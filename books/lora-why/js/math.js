/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으며 tests/math.test.cjs가 대표값·경계값·불변 조건을 검사한다.
   이 책의 모든 실험은 하나의 장난감 세계를 쓴다. 16×16 선형층 하나가 "모델"이고, 같은 계열의 작업들은
   공통 행렬 W_s에 몇 개의 방향(uⱼvⱼᵀ)만 다르게 더한 행렬이다. 계열이 다른 방향 수 m이 이 책의 가정이며,
   그 가정 위에서 기울기·SVD·경사하강·최소제곱은 브라우저에서 실제로 계산한다. 실제 언어 모델의 학습이 아니다.
   단위: 손실은 출력 칸마다의 제곱 오차 평균(½을 곱하지 않음), 행렬 크기는 프로베니우스 노름 ‖·‖_F. */
(function(root){
'use strict';
const N=16;
/* 결정적 의사 난수 mulberry32와 정규분포(박스-뮬러). */
function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function gauss(rand){let u=0;while(u===0)u=rand();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*rand());}
const zeros=(n,m)=>Array.from({length:n},()=>new Array(m).fill(0));
const eye=n=>zeros(n,n).map((r,i)=>{r[i]=1;return r;});
const randn=(n,m,rand,s=1)=>Array.from({length:n},()=>Array.from({length:m},()=>gauss(rand)*s));
function matmul(A,B){const n=A.length,k=B.length,m=B[0].length,C=zeros(n,m);for(let i=0;i<n;i++)for(let t=0;t<k;t++){const a=A[i][t];if(a)for(let j=0;j<m;j++)C[i][j]+=a*B[t][j];}return C;}
const T=A=>A[0].map((_,j)=>A.map(r=>r[j]));
const add=(A,B,s=1)=>A.map((r,i)=>r.map((v,j)=>v+s*B[i][j]));
const scale=(A,s)=>A.map(r=>r.map(v=>v*s));
const frob=A=>Math.sqrt(A.reduce((a,r)=>a+r.reduce((b,v)=>b+v*v,0),0));
const dot=(A,B)=>A.reduce((a,r,i)=>a+r.reduce((b,v,j)=>b+v*B[i][j],0),0);
const matvec=(A,x)=>A.map(r=>r.reduce((a,v,j)=>a+v*x[j],0));
const outer=(u,v,s=1)=>u.map(a=>v.map(b=>s*a*b));
function gramSchmidt(rows){const out=[];for(const r of rows){let v=r.slice();for(const q of out){const d=v.reduce((a,x,i)=>a+x*q[i],0);v=v.map((x,i)=>x-d*q[i]);}const nn=Math.hypot(...v);out.push(v.map(x=>x/nn));}return out;}
/* 대칭 행렬의 고윳값 분해(순환 야코비). 16×16까지만 쓰므로 단순한 방법으로 충분하다. */
function eigSym(S){
 const n=S.length,A=S.map(r=>r.slice()),V=eye(n);
 for(let sweep=0;sweep<100;sweep++){
  let off=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)off+=A[i][j]*A[i][j];
  if(off<1e-24)break;
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
/* 특잇값 분해: AᵀA의 고윳값 분해에서 σᵢ = √λᵢ, uᵢ = A vᵢ / σᵢ. u·v는 행 하나가 방향 하나다. */
function svd(A){
 const {values,vectors}=eigSym(matmul(T(A),A)),s=values.map(v=>Math.sqrt(Math.max(v,0)));
 const u=vectors.map((v,i)=>s[i]>1e-12?matvec(A,v).map(x=>x/s[i]):A.map(()=>0));
 return {s,u,v:vectors};
}
/* 랭크 k 근사 Aₖ = Σ_{i<k} σᵢuᵢvᵢᵀ(에커트-영 정리에 따라 랭크 k 이하에서 가장 가까운 행렬). */
function truncate(A,k,dec=svd(A)){
 let Ak=zeros(A.length,A[0].length);for(let i=0;i<Math.min(k,dec.s.length);i++)Ak=add(Ak,outer(dec.u[i],dec.v[i],dec.s[i]));return Ak;
}
/* 에너지 비율: 앞 k개 특잇값의 제곱합 ÷ 전체 제곱합. 몇 개가 에너지의 frac을 담는지(k_frac). */
const energy=(s,k)=>{const all=s.reduce((a,x)=>a+x*x,0);return all?s.slice(0,k).reduce((a,x)=>a+x*x,0)/all:0;};
function rankFor(s,frac){for(let k=0;k<=s.length;k++)if(energy(s,k)>=frac-1e-12)return k;return s.length;}
/* 수치 랭크: σ₁의 tol배보다 큰 특잇값의 개수. */
const numRank=(s,tol=1e-6)=>s.filter(x=>x>tol*Math.max(s[0],1e-300)).length;

/* ── 장난감 세계 ──
   공통 행렬 W_s(16×16, 랭크가 높음)와, 계열이 다른 방향 m개(uⱼ, vⱼ 정규직교, 세기 sⱼ).
   작업 t의 정답 행렬 W_t = W_s + Σⱼ c_tj·sⱼ·uⱼvⱼᵀ (c_tj ~ N(0, 1)). 사전학습은 작업 20개의 자료를 모아
   최소제곱으로 푼다. 입력이 고르게 퍼져 있고(N(0, I)) 자료가 충분하면 그 해는 작업 행렬들의 평균이다. */
const FAMILIES={
 tone:{name:'말투 계열',m:3,decay:0.6,top:1.5},
 format:{name:'형식 계열',m:5,decay:0.75,top:1.3},
 skill:{name:'새 능력 계열',m:12,decay:0.95,top:0.9}
};
function strengths(m,decay,top){return Array.from({length:m},(_,j)=>top*Math.pow(decay,j));}
function makeWorld({family='tone',m=null,seed=7,tasks=20}={}){
 const f=FAMILIES[family]||FAMILIES.tone,mm=m??f.m,rand=rng(seed);
 const Ws=randn(N,N,rand,0.8);
 const U=gramSchmidt(randn(12,N,rand)),V=gramSchmidt(randn(12,N,rand)),s=strengths(mm,f.decay,f.top);
 const task=c=>s.reduce((W,sj,j)=>add(W,outer(U[j],V[j],c[j]*sj)),Ws);
 const coeffs=Array.from({length:tasks},()=>s.map(()=>gauss(rand)));
 const pre=coeffs.map(task),W0=scale(pre.reduce((a,W)=>add(a,W),zeros(N,N)),1/tasks);
 const cNew=s.map(()=>gauss(rand)),Wnew=task(cNew);
 return {family,m:mm,s,Ws,U:U.slice(0,mm),V:V.slice(0,mm),pre,W0,Wnew,need:add(Wnew,W0,-1),seed};
}
/* 미세조정 자료: 입력 x ~ N(0, I)를 count개, 출력 y = W_new·x + σ·잡음. inputDims가 16보다 작으면
   입력을 앞 inputDims개 좌표축 방향에만 둔다(3장). */
function sampleData(W,{count=128,noise=0.1,seed=101,inputDims=N}={}){
 const rand=rng(seed),X=Array.from({length:count},()=>Array.from({length:N},(_,j)=>j<inputDims?gauss(rand):0));
 const Y=X.map(x=>matvec(W,x).map(v=>v+noise*gauss(rand)));
 return {X,Y,count,noise,inputDims};
}
/* 평균 제곱 오차의 기울기 ∂L/∂W = (2/(n·16))·Σᵢ (Wxᵢ − yᵢ)xᵢᵀ. 행 하나가 출력, 열 하나가 입력이다. */
function gradient(W,X,Y){
 let G=zeros(N,N);const c=2/(X.length*N);
 X.forEach((x,i)=>{const e=matvec(W,x).map((v,k)=>v-Y[i][k]);G=add(G,outer(e,x,c));});
 return G;
}
/* 새 입력에서의 손실: 입력이 N(0, I)이면 E‖(W − W_new)x‖²/16 = ‖W − W_new‖²_F/16(잡음 몫 σ²는 빼고 센다). */
const testLoss=(W,world)=>frob(add(W,world.Wnew,-1))**2/N;
/* 전체 미세조정: W₀에서 출발해 경사하강 steps걸음(학습률 lr). 배치는 자료 전체. */
function fullFinetune(world,{data=sampleData(world.Wnew),steps=300,lr=0.5,start=world.W0,every=0}={}){
 let W=start.map(r=>r.slice());const curve=[];
 for(let t=0;t<steps;t++){if(every&&t%every===0)curve.push([t,testLoss(W,world)]);W=add(W,gradient(W,data.X,data.Y),-lr);}
 if(every)curve.push([steps,testLoss(W,world)]);
 return {W,dW:add(W,start,-1),loss:testLoss(W,world),start:testLoss(start,world),curve};
}
/* 성능 = 출발점 대비 줄인 손실의 비율. 1이면 정답 행렬과 같고, 0이면 출발점과 같다. */
const gain=(W,world,start=world.W0)=>{const L0=testLoss(start,world);return L0?1-testLoss(W,world)/L0:0;};
/* LoRA: W = W₀ + γ·B·A, B(16×r)는 0, A(r×16)는 N(0, 1/16)에서 시작. 같은 자료로 경사하강한다.
   B의 기울기 = γ·G·Aᵀ, A의 기울기 = γ·Bᵀ·G (G는 W에 대한 기울기). */
function trainLora(world,{r=3,data=sampleData(world.Wnew),steps=600,lr=2,alpha=null,seed=11,track=null}={}){
 const rand=rng(seed),g=(alpha??r)/r;let A=randn(r,N,rand,1/Math.sqrt(N)),B=zeros(N,r);
 const W=()=>add(world.W0,scale(matmul(B,A),g)),log=[];
 for(let t=0;t<steps;t++){
  const G=gradient(W(),data.X,data.Y);
  if(track&&t%track===0)log.push(stepInfo(G,A,B,g,world,t));
  const dB=scale(matmul(G,T(A)),g),dA=scale(matmul(T(B),G),g);
  B=add(B,dB,-lr);A=add(A,dA,-lr);
 }
 const Wf=W();
 return {W:Wf,dW:add(Wf,world.W0,-1),A,B,gamma:g,loss:testLoss(Wf,world),gain:gain(Wf,world),params:r*2*N,log};
}
/* 6장: 한 걸음에서 LoRA가 실제로 바꾸는 W의 변화(1차 근사) ΔW_LoRA = −η·γ²·(G·AᵀA + B·Bᵀ·G)와
   전체 기울기 −η·G의 방향이 이루는 코사인, A의 행공간이 정답 방향 vⱼ를 덮는 정도. */
function stepInfo(G,A,B,g,world,t){
 const step=add(matmul(G,matmul(T(A),A)),matmul(matmul(B,T(B)),G)),cos=dot(step,G)/((frob(step)*frob(G))||1);
 return {t,cos,cover:coverage(A,world.V),coverB:B.every(r=>r.every(v=>v===0))?0:coverage(T(B),world.U)};
}
/* 행 벡터들이 펼치는 공간에 정답 방향들이 얼마나 들어가는지: Σⱼ‖Q·dⱼ‖² ÷ m (Q는 정규직교 기저). 0~1. */
function coverage(rows,dirs){
 const Q=gramSchmidt(rows.filter(r=>Math.hypot(...r)>1e-12));
 return dirs.reduce((a,d)=>a+Q.reduce((b,q)=>b+q.reduce((c,v,i)=>c+v*d[i],0)**2,0),0)/dirs.length;
}
/* 3장: 한 걸음의 기울기 랭크(배치 크기 b, 입력 차원 k)와, 학습이 끝난 뒤 ΔW가 입력 공간 밖으로 낸 크기. */
function gradientRank(world,{batch=4,inputDims=N,seed=101}={}){
 const d=sampleData(world.Wnew,{count:batch,noise:0.3,seed,inputDims}),G=gradient(world.W0,d.X,d.Y),s=svd(G).s;
 return {rank:numRank(s),s,bound:Math.min(batch,inputDims,N)};
}
function inputSpanCheck(world,{inputDims=6,count=64,steps=300}={}){
 const data=sampleData(world.Wnew,{count,inputDims}),ft=fullFinetune(world,{data,steps});
 const outside=frob(ft.dW.map(r=>r.map((v,j)=>j>=inputDims?v:0))),s=svd(ft.dW).s;
 return {rank:numRank(s),outside,norm:frob(ft.dW),s};
}
/* 5장: 무작위 d차원 부분공간(256차원 파라미터 공간 안)에서 고칠 수 있는 최선. 입력이 고르게 퍼져 있으면
   손실이 ‖W − W_new‖²에 비례하므로 최선은 필요한 변화 vec(W_new − W₀)를 그 부분공간에 정사영한 것이다. */
function randomSubspace(world,d,seed=5){
 if(d<=0)return 0;
 const rand=rng(seed),need=world.need.flat(),basis=gramSchmidt(randn(d,N*N,rand));
 const kept=basis.reduce((a,q)=>a+q.reduce((b,v,i)=>b+v*need[i],0)**2,0);
 return kept/need.reduce((a,v)=>a+v*v,0);
}
function intrinsicCurve(world,dims=[0,8,16,32,48,64,96,128,160,192,224,240,256],seed=5){
 const pts=dims.map(d=>[d,randomSubspace(world,d,seed)]),hit=pts.find(([,p])=>p>=0.9);
 return {pts,d90:hit?hit[0]:null};
}
/* 8장: LoRA 논문의 부분공간 유사도 φ(i, j) = ‖Uᵢᵀ·Uⱼ‖²_F / min(i, j). Uᵢ는 A의 오른쪽 특이벡터 앞 i개. */
function subspaceSimilarity(A1,A2){
 const V1=svd(A1).v.slice(0,A1.length),V2=svd(A2).v.slice(0,A2.length);
 return V1.map((_,i)=>V2.map((_,j)=>{let s=0;for(let a=0;a<=i;a++)for(let b=0;b<=j;b++)s+=V1[a].reduce((c,v,k)=>c+v*V2[b][k],0)**2;return s/Math.min(i+1,j+1);}));
}
/* 9장: 전체 미세조정 ΔW의 에너지 랭크(에너지 90%)와 성능 랭크(ΔW를 랭크 k로 잘라도 성능의 99%를 지키는 k). */
function rankReport(world,{count=128,noise=0.1,steps=300,seed=101}={}){
 const data=sampleData(world.Wnew,{count,noise,seed}),ft=fullFinetune(world,{data,steps}),dec=svd(ft.dW);
 const full=gain(ft.W,world),perf=Array.from({length:N+1},(_,k)=>gain(add(world.W0,truncate(ft.dW,k,dec)),world));
 const kPerf=perf.findIndex(p=>p>=0.99*full);
 return {s:dec.s,k90:rankFor(dec.s,0.9),kPerf,perf,full,stable:dec.s.reduce((a,x)=>a+x*x,0)/(dec.s[0]**2||1)};
}
/* 10장: 자료 수를 바꾸며 전체 미세조정과 LoRA(r)의 새 입력 손실을 비교한다. */
function dataSweep(world,{counts=[8,12,16,24,32,64,128],r=3,noise=0.6,steps=300,seed=101}={}){
 return counts.map(count=>{const data=sampleData(world.Wnew,{count,noise,seed});
  const ft=fullFinetune(world,{data,steps}),lo=trainLora(world,{r,data,steps:steps*2});
  return {count,full:gain(ft.W,world),lora:lo.gain,fullLoss:ft.loss,loraLoss:lo.loss};});
}
/* 11장: 원래 작업(사전학습 작업 20개)에서 잊은 양 = 평균 손실의 증가. 입력이 고르게 퍼져 있고 작업 평균이 W₀이므로
   그 값은 정확히 ‖ΔW‖²_F/16이다(교차항의 평균이 0). 함수는 정의대로 평균을 내서 이 등식을 확인할 수 있게 한다. */
function forgetting(world,dW){
 const W=add(world.W0,dW),loss=Wt=>frob(add(W,Wt,-1))**2/N,base=Wt=>frob(add(world.W0,Wt,-1))**2/N;
 return world.pre.reduce((a,Wt)=>a+loss(Wt)-base(Wt),0)/world.pre.length;
}
/* 랭크 r로 묶은 최선의 변화(필요한 변화의 랭크 r 근사)가 배운 양과 잊은 양. 경사하강 없이 닫힌 식으로 센다. */
function tradeoff(world,ranks=[1,2,3,4,6,8,12,16]){
 const dec=svd(world.need);
 return ranks.map(r=>{const D=truncate(world.need,r,dec);return {r,learned:gain(add(world.W0,D),world),forgot:forgetting(world,D)};});
}
/* 12장 마지막 과제: 정체를 모르는 작업 세 개. 시험 미세조정(자료 128개, 잡음 0.1)의 ΔW를 보고 r을 고른다. */
const PROBES={a:{name:'고객센터 말투',family:'tone',seed:31},b:{name:'보고서 형식',family:'format',seed:32},c:{name:'사내 스크립트 언어',family:'skill',seed:33}};
function probeVerdict(key,r,{count=128,noise=0.1}={}){
 const p=PROBES[key],world=makeWorld({family:p.family,seed:p.seed}),rep=rankReport(world,{count,noise}),lo=trainLora(world,{r,data:sampleData(world.Wnew,{count,noise})});
 const enough=lo.gain>=0.95*rep.full;
 return {world,rep,lora:lo,enough,params:r*2*N,forgot:forgetting(world,lo.dW),fullForgot:forgetting(world,fullFinetune(world,{data:sampleData(world.Wnew,{count,noise})}).dW)};
}
/* 보기 순서: 정답을 target 자리로 옮긴다(화면에서만). */
const choiceOrder=(n,answer,target)=>{const order=[...Array(n).keys()].filter(i=>i!==answer);order.splice(Math.min(target,n-1),0,answer);return order;};
const api={N,rng,gauss,zeros,eye,randn,matmul,T,add,scale,frob,dot,matvec,outer,gramSchmidt,eigSym,svd,truncate,energy,rankFor,numRank,FAMILIES,strengths,makeWorld,sampleData,gradient,testLoss,fullFinetune,gain,trainLora,stepInfo,coverage,gradientRank,inputSpanCheck,randomSubspace,intrinsicCurve,subspaceSimilarity,rankReport,dataSweep,forgetting,tradeoff,PROBES,probeVerdict,choiceOrder};
root.LWMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
