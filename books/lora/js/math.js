/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으며 tests/math.test.cjs가 대표값·경계값·불변 조건을 검사한다.
   단위: 메모리는 바이트로 계산하고 화면에서는 1GB = 10⁹바이트, 1MB = 10⁶바이트로 적는다.
   모델 구조(MODELS)는 Hugging Face config.json에서 옮긴 실제 값이고, 활성값 메모리는 독자가 넣는 가정값이다.
   작은 행렬 실험(SVD, 경사하강, 망각)은 고정 씨앗의 장난감 문제이며 실제 언어 모델의 학습이 아니다. */
(function(root){
'use strict';
const GB=1e9,MB=1e6;
/* 모델 구조. 층마다 q·k·v·o(어텐션 투영)와 gate·up·down(MLP) 선형층이 있고, 임베딩과 출력층은 묶지 않는다(tie_word_embeddings=false). */
const MODELS={
 llama7:{name:'Llama 2 7B',layers:32,hidden:4096,inter:11008,heads:32,kv:32,vocab:32000},
 mistral7:{name:'Mistral 7B',layers:32,hidden:4096,inter:14336,heads:32,kv:8,vocab:32000},
 llama13:{name:'Llama 2 13B',layers:40,hidden:5120,inter:13824,heads:40,kv:40,vocab:32000}
};
const MODULES=['q','k','v','o','gate','up','down'];
/* 선형층 하나의 [입력 차원, 출력 차원]. k·v는 키·값 머리 수(kv)만큼만 나온다(GQA). */
function shapes(m){
 const d=m.hidden,kvd=m.kv*(d/m.heads);
 return {q:[d,d],k:[d,kvd],v:[d,kvd],o:[d,d],gate:[d,m.inter],up:[d,m.inter],down:[m.inter,d]};
}
function countParams(m){
 const s=shapes(m),linear=MODULES.reduce((a,k)=>a+s[k][0]*s[k][1],0)*m.layers;
 const embed=2*m.vocab*m.hidden,norms=(2*m.layers+1)*m.hidden;
 return {total:linear+embed+norms,linear,embed,norms};
}
/* LoRA 학습 파라미터: 붙인 선형층마다 r·(입력 + 출력). */
function loraParams(m,r,targets){
 const s=shapes(m);return targets.reduce((a,k)=>a+r*(s[k][0]+s[k][1]),0)*m.layers;
}
/* 혼합 정밀도 Adam의 파라미터당 바이트: fp16 가중치 2 + fp16 기울기 2 + fp32 원본 4 + Adam 1차·2차 모멘트 4 + 4 = 16 (ZeRO 논문의 2Ψ+2Ψ+12Ψ). */
const PER_PARAM={weight:2,grad:2,master:4,adamM:4,adamV:4};
const TRAIN_BYTES=16;
function fullMemory(m){const N=countParams(m).total;return Object.fromEntries(Object.entries(PER_PARAM).map(([k,b])=>[k,N*b]));}
/* QLoRA 양자화 상수: 64개 묶음마다 fp32 상수 하나(32/64 = 0.5비트), 이중 양자화면 8/64 + 32/(64·256) ≈ 0.127비트. */
const constBits=dq=>dq?8/64+32/(64*256):32/64;
/* 방법별 학습 메모리(바이트). activationGB는 독자가 넣는 가정값. LoRA·QLoRA의 어댑터는 학습 파라미터라 16바이트씩 센다. */
function memoryPlan({model,method,r=8,targets=['q','v'],doubleQuant=true,activationGB=0}){
 const c=countParams(model),P=method==='full'?0:loraParams(model,r,targets),act=activationGB*GB,parts={};
 if(method==='full')Object.assign(parts,fullMemory(model));
 else if(method==='lora')parts.base=c.total*2;
 else{parts.base=c.linear*0.5+(c.embed+c.norms)*2;parts.consts=c.linear*constBits(doubleQuant)/8;}
 if(P)parts.adapter=P*TRAIN_BYTES;
 parts.act=act;
 const total=Object.values(parts).reduce((a,b)=>a+b,0);
 return {parts,total,trainable:method==='full'?c.total:P,params:c.total};
}
/* 결정적 의사 난수 mulberry32와 정규분포(박스-뮬러). */
function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function gauss(rand){let u=0;while(u===0)u=rand();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*rand());}
const zeros=(n,m)=>Array.from({length:n},()=>new Array(m).fill(0));
const randn=(n,m,rand,s=1)=>Array.from({length:n},()=>Array.from({length:m},()=>gauss(rand)*s));
function matmul(A,B){const n=A.length,k=B.length,m=B[0].length,C=zeros(n,m);for(let i=0;i<n;i++)for(let t=0;t<k;t++){const a=A[i][t];if(a)for(let j=0;j<m;j++)C[i][j]+=a*B[t][j];}return C;}
const T=A=>A[0].map((_,j)=>A.map(r=>r[j]));
const add=(A,B,s=1)=>A.map((r,i)=>r.map((v,j)=>v+s*B[i][j]));
const scale=(A,s)=>A.map(r=>r.map(v=>v*s));
const frob=A=>Math.sqrt(A.reduce((a,r)=>a+r.reduce((b,v)=>b+v*v,0),0));
const matvec=(A,x)=>A.map(r=>r.reduce((a,v,j)=>a+v*x[j],0));
/* 대칭 행렬의 고윳값 분해(순환 야코비). 16×16까지 쓰므로 단순한 방법으로 충분하다. */
function eigSym(S){
 const n=S.length,A=S.map(r=>r.slice()),V=zeros(n,n);for(let i=0;i<n;i++)V[i][i]=1;
 for(let sweep=0;sweep<100;sweep++){
  let off=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)off+=A[i][j]*A[i][j];
  if(off<1e-22)break;
  for(let p=0;p<n;p++)for(let q=p+1;q<n;q++){
   if(Math.abs(A[p][q])<1e-300)continue;
   const th=(A[q][q]-A[p][p])/(2*A[p][q]),t=Math.sign(th||1)/(Math.abs(th)+Math.sqrt(th*th+1)),c=1/Math.sqrt(t*t+1),s=t*c;
   for(let k=0;k<n;k++){const akp=A[k][p],akq=A[k][q];A[k][p]=c*akp-s*akq;A[k][q]=s*akp+c*akq;}
   for(let k=0;k<n;k++){const apk=A[p][k],aqk=A[q][k];A[p][k]=c*apk-s*aqk;A[q][k]=s*apk+c*aqk;}
   for(let k=0;k<n;k++){const vkp=V[k][p],vkq=V[k][q];V[k][p]=c*vkp-s*vkq;V[k][q]=s*vkp+c*vkq;}
  }
 }
 const order=[...Array(n).keys()].sort((i,j)=>A[j][j]-A[i][i]);
 return {values:order.map(i=>A[i][i]),vectors:order.map(i=>V.map(r=>r[i]))};
}
/* 특잇값 분해: AᵀA의 고윳값 분해에서 σᵢ = √λᵢ, uᵢ = A vᵢ / σᵢ. */
function svd(A){
 const {values,vectors}=eigSym(matmul(T(A),A)),s=values.map(v=>Math.sqrt(Math.max(v,0)));
 const u=vectors.map((v,i)=>s[i]>1e-12?matvec(A,v).map(x=>x/s[i]):A.map(()=>0));
 return {s,u,v:vectors};
}
/* 랭크 k 근사 Aₖ = Σ_{i<k} σᵢuᵢvᵢᵀ와 상대 오차, 저장할 수 k·(m+n). */
function lowRank(A,k,dec=svd(A)){
 const n=A.length,m=A[0].length,Ak=zeros(n,m);
 for(let i=0;i<k;i++)for(let a=0;a<n;a++)for(let b=0;b<m;b++)Ak[a][b]+=dec.s[i]*dec.u[i][a]*dec.v[i][b];
 const err=frob(add(A,Ak,-1)),norm=frob(A);
 return {Ak,err,rel:norm?err/norm:0,energy:dec.s.slice(0,k).reduce((a,x)=>a+x*x,0)/dec.s.reduce((a,x)=>a+x*x,0),store:k*(n+m),full:n*m};
}
/* 실험 2·4·6장의 목표 변화량: 16×16, 큰 성분 셋과 작은 성분 셋, 그리고 잡음. 세 성분이면 대부분이 설명되도록 지었다. */
function targetDelta(seed=7,{n=16,strengths=[3,2,1.2,0.35,0.25,0.15],noise=0.02}={}){
 const rand=rng(seed),U=gramSchmidt(randn(strengths.length,n,rand)),V=gramSchmidt(randn(strengths.length,n,rand)),D=zeros(n,n);
 strengths.forEach((s,i)=>{for(let a=0;a<n;a++)for(let b=0;b<n;b++)D[a][b]+=s*U[i][a]*V[i][b];});
 return D.map(r=>r.map(v=>v+noise*gauss(rand)));
}
function gramSchmidt(rows){const out=[];for(const r of rows){let v=r.slice();for(const q of out){const d=v.reduce((a,x,i)=>a+x*q[i],0);v=v.map((x,i)=>x-d*q[i]);}const nn=Math.hypot(...v);out.push(v.map(x=>x/nn));}return out;}
/* LoRA 경사하강: 목표 ΔW에 γ·B·A를 맞춘다. 손실 ½‖γBA − ΔW‖², A는 N(0, 1/n)로, B는 0(또는 같은 분포)으로 시작한다.
   γ = α/r(LoRA) 또는 α/√r(rsLoRA). 돌려주는 err는 상대 오차 ‖γBA − ΔW‖ / ‖ΔW‖이다. */
function trainLora({target,r,steps=300,lr=0.02,alpha=8,mode='r',seed=11,initB='zero',every=10}){
 const n=target.length,m=target[0].length,rand=rng(seed),g=mode==='sqrt'?alpha/Math.sqrt(r):alpha/r;
 let A=randn(r,m,rand,1/Math.sqrt(m)),B=initB==='zero'?zeros(n,r):randn(n,r,rand,1/Math.sqrt(r));
 const norm=frob(target),curve=[],out=()=>scale(matmul(B,A),g);
 const start=frob(out());
 for(let t=0;t<=steps;t++){
  const G=add(out(),target,-1);
  if(t%every===0||t===steps)curve.push([t,frob(G)/norm]);
  if(t===steps)break;
  const dB=scale(matmul(G,T(A)),g),dA=scale(matmul(T(B),G),g);
  B=add(B,dB,-lr);A=add(A,dA,-lr);
 }
 return {curve,err:curve.at(-1)[1],start,gamma:g,B,A,out:out()};
}
/* 첫 걸음에서 γBA가 움직이는 크기 ‖Δ(γBA)‖: B=0이면 Δ(γBA) = −η·γ²·G·AᵀA라 γ²·r에 비례한다. */
function firstStep({target,r,alpha=8,mode='r',lr=0.02,seed=11}){
 const res=trainLora({target,r,steps:1,lr,alpha,mode,seed,every:1});return frob(res.out);
}
/* 내재 차원 장난감: 파라미터 D개 선형 회귀에서 θ = P·z(무작위 d차원 부분공간)만 학습해 최소제곱으로 푼다.
   kind 'focused'는 입력 분산이 몇 방향에 몰린 문제, 'spread'는 고르게 퍼진 문제. 성능 = 1 − L(d)/L(0). */
function subspaceProblem(kind='focused',seed=5,D=40,N=160){
 const rand=rng(seed),Q=gramSchmidt(randn(D,D,rand)),spec=[...Array(D).keys()].map(i=>kind==='focused'?Math.pow(0.55,i)*4:1);
 const Z=randn(N,D,rand),X=Z.map(z=>Q.reduce((acc,q,i)=>acc.map((v,j)=>v+z[i]*spec[i]*q[j]),new Array(D).fill(0)));
 const theta=Array.from({length:D},()=>gauss(rand)),y=X.map(x=>x.reduce((a,v,j)=>a+v*theta[j],0));
 return {X,y,D,N};
}
function solve(M,b){const n=b.length,A=M.map((r,i)=>[...r,b[i]]);for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];const piv=A[c][c]||1e-12;for(let r=0;r<n;r++){if(r===c)continue;const f=A[r][c]/piv;if(f)for(let k=c;k<=n;k++)A[r][k]-=f*A[c][k];}}return A.map((r,i)=>r[n]/(r[i]||1e-12));}
function subspaceFit(prob,d,seed=1){
 const {X,y,D}=prob,L0=y.reduce((a,v)=>a+v*v,0);
 if(d<=0)return {perf:0,loss:L0};
 /* 같은 씨앗의 D×D 무작위 행렬에서 앞 d열을 쓰므로 d를 늘리면 부분공간이 커지기만 한다. */
 const P=randn(D,D,rng(seed)).map(row=>row.slice(0,d)),XP=matmul(X,P),G=matmul(T(XP),XP);
 for(let i=0;i<d;i++)G[i][i]+=1e-9*(G[i][i]||1);
 const z=solve(G,matvec(T(XP),y)),pred=matvec(XP,z),L=pred.reduce((a,p,i)=>a+(p-y[i])**2,0);
 return {perf:Math.max(0,1-L/L0),loss:L};
}
function intrinsicCurve(kind,seed=5,dims=[0,1,2,3,4,5,6,8,10,12,16,20,24,30,40]){
 const prob=subspaceProblem(kind,seed),pts=dims.map(d=>[d,subspaceFit(prob,d,seed+1).perf]);
 const hit=pts.find(([,p])=>p>=0.9);return {pts,d90:hit?hit[0]:null,D:prob.D};
}
/* fp16 반올림: 가수 10비트, 지수 −14 아래는 비정규수 간격 2⁻²⁴. 범위를 넘는 값은 이 실험에 나오지 않는다. */
function fp16(x){if(!x)return 0;const a=Math.abs(x),e=Math.max(Math.floor(Math.log2(a)),-14),step=Math.pow(2,e-10);return Math.sign(x)*Math.round(a/step)*step;}
/* 합치기 실험: W(8×8)에 어댑터 두 개를 번갈아 합쳤다 빼기를 reps번. precision 'fp16'이면 합칠 때마다 W를 fp16으로 저장한다. */
function mergeDemo({precision='fp32',reps=1,r=2,alpha=4,seed=21}){
 const rand=rng(seed),n=8,W=randn(n,n,rand,0.05).map(row=>row.map(fp16)),g=alpha/r;
 const ad=[0,1].map(()=>({B:randn(n,r,rand,0.03),A:randn(r,n,rand,0.3)})),x=Array.from({length:n},()=>gauss(rand));
 const store=precision==='fp16'?M=>M.map(row=>row.map(fp16)):M=>M;
 const delta=a=>scale(matmul(a.B,a.A),g);
 const yUnmerged=add([matvec(W,x)],[matvec(delta(ad[0]),x)])[0],Wm=store(add(W,delta(ad[0]))),yMerged=matvec(Wm,x);
 let cur=W;for(let i=0;i<reps;i++){const a=ad[i%2];cur=store(add(store(add(cur,delta(a))),delta(a),-1));}
 const maxAbs=(u,v)=>Math.max(...u.map((p,i)=>Math.abs(p-v[i])));
 return {outDiff:maxAbs(yUnmerged,yMerged),drift:Math.max(...cur.map((row,i)=>maxAbs(row,W[i]))),wScale:Math.max(...W.flat().map(Math.abs)),n,r};
}
/* 합치지 않은 LoRA가 토큰 하나·선형층 하나에 더하는 곱셈 수: A로 r개, B로 d_out개 출력 → r·(d_in + d_out). 합치면 0. */
const extraMults=(din,dout,r)=>r*(din+dout);
/* 9장 방법 비교: 학습 파라미터와 추론 때 더 드는 것. 수식은 각 논문의 구조를 따른 이 책의 계산이다. */
function variants(m,{r=8,targets=['q','v'],bottleneck=64,prefix=10}){
 const d=m.hidden,s=shapes(m),lora=loraParams(m,r,targets);
 return [
  {id:'lora',name:'LoRA',params:lora,extra:0,note:'합치면 추가 곱셈 0'},
  {id:'dora',name:'DoRA',params:lora+targets.reduce((a,k)=>a+s[k][1],0)*m.layers,extra:0,note:'크기 벡터까지 합치면 추가 곱셈 0'},
  {id:'adapter',name:'어댑터',params:m.layers*2*(2*d*bottleneck+bottleneck+d),extra:m.layers*2*2*d*bottleneck,note:'층마다 두 번 더 지나감'},
  {id:'prefix',name:'프리픽스 튜닝',params:m.layers*2*prefix*d,extra:0,note:`층마다 키·값 ${prefix}개가 늘어남`},
  {id:'prompt',name:'프롬프트 튜닝',params:prefix*d,extra:0,note:`입력 앞 토큰 ${prefix}개`}
 ];
}
/* 10장 장난감: 12차원 선형 모델 W. 작업 A의 입력은 0~5번 방향에만 있고, 작업 B의 입력은 (6−overlap)번부터 여섯 방향에 있다.
   작업 B를 맞추는 데 필요한 변화 C = (W_B − W_A)·P_B 가운데 랭크 r 이하로 가장 잘 맞춘 변화 Δᵣ(SVD로 자른 값)를 쓴다.
   배운 양 = ‖Δᵣ‖² / ‖C‖², 잊은 양 = ‖Δᵣ·P_A‖² (작업 A 입력에서 출력이 원래와 달라진 제곱합의 기댓값). 학습 과정이 아니라 닫힌 식이다. */
function forgetProblem(seed=3){const n=12,rand=rng(seed),WA=randn(n,n,rand,0.4),Delta=randn(n,n,rand,0.25);return {n,WA,WB:add(WA,Delta),Delta};}
function forgetRun({rank='full',overlap=3,seed=3}){
 const {n,Delta}=forgetProblem(seed),start=6-overlap,inB=j=>j>=start&&j<start+6,inA=j=>j<6;
 const C=Delta.map(row=>row.map((v,j)=>inB(j)?v:0)),dec=svd(C),k=rank==='full'?n:Math.min(rank,n);
 const D=k>=n?C:lowRank(C,k,dec).Ak,sq=M=>frob(M)**2;
 const learned=sq(D)/sq(C),forgot=sq(D.map(row=>row.map((v,j)=>inA(j)?v:0)));
 return {learned,forgot,rank:dec.s.filter(x=>x>1e-9*dec.s[0]).slice(0,k).length};
}
/* 11장 서빙: 사용자 users명에게 각자 어댑터. 저장량, 동시에 올린 어댑터의 GPU 메모리, 어댑터 하나를 bandwidth Gbps로 옮기는 시간. */
function serving({model,r=8,targets=['q','v'],users=100,active=8,gbps=10}){
 const N=countParams(model).total,P=loraParams(model,r,targets),adapterBytes=P*2,baseBytes=N*2;
 return {adapterBytes,baseBytes,fullCopies:users*baseBytes,shared:baseBytes+users*adapterBytes,gpu:baseBytes+active*adapterBytes,loadSec:adapterBytes*8/(gbps*1e9),ratio:baseBytes/adapterBytes};
}
/* 12장 연합 학습 통신량: 라운드마다 참여 기기 clients개가 내려받고(down) 올린다(up). 업데이트는 fp16 2바이트로 센다. */
function fedComm({model,method='lora',r=8,targets=['q','v'],clients=100,rounds=50}){
 const per=(method==='full'?countParams(model).total:loraParams(model,r,targets))*2;
 return {perUpdate:per,perRound:clients*per*2,total:rounds*clients*per*2};
}
/* 어댑터를 B·A로 따로 평균하면 평균(B)·평균(A) ≠ 평균(B·A). 기기 clients개가 같은 어댑터(B₀, A₀)에서 출발해
   spread만큼 서로 다르게 움직였다고 두고, 따로 평균한 곱이 곱의 평균과 얼마나 다른지(상대 차이) 잰다. */
function averagingGap({clients=4,spread=0.5,r=2,n=6,seed=31}){
 const rand=rng(seed),B0=randn(n,r,rand,0.5),A0=randn(r,n,rand,0.5);
 const ads=Array.from({length:clients},()=>({B:add(B0,randn(n,r,rand,spread)),A:add(A0,randn(r,n,rand,spread))}));
 const mean=Ms=>Ms.reduce((acc,M)=>add(acc,M,1/Ms.length),zeros(Ms[0].length,Ms[0][0].length));
 const exact=mean(ads.map(a=>matmul(a.B,a.A))),split=matmul(mean(ads.map(a=>a.B)),mean(ads.map(a=>a.A)));
 return {gap:frob(add(split,exact,-1))/frob(exact),exactNorm:frob(exact)};
}
/* 보기 순서: 정답을 target 자리로 옮긴다(화면에서만). */
const choiceOrder=(n,answer,target)=>{const order=[...Array(n).keys()].filter(i=>i!==answer);order.splice(Math.min(target,n-1),0,answer);return order;};
const api={GB,MB,MODELS,MODULES,shapes,countParams,loraParams,PER_PARAM,TRAIN_BYTES,fullMemory,constBits,memoryPlan,rng,gauss,zeros,randn,matmul,T,add,scale,frob,matvec,eigSym,svd,lowRank,targetDelta,gramSchmidt,trainLora,firstStep,subspaceProblem,subspaceFit,intrinsicCurve,fp16,mergeDemo,extraMults,variants,forgetProblem,forgetRun,serving,fedComm,averagingGap,choiceOrder};
root.LRMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
