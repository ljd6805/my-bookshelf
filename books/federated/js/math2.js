/* 실험에 쓰는 순수 계산 함수(2): 2차원 기기 표류 모형(FedAvg·FedProx·SCAFFOLD), 업데이트로 원문 복원, 보안 집계(마스크·비밀 나눔),
   차등 프라이버시(자르기·잡음·RDP 회계), 개인화, 그룹별 연합 평가, LoRA 어댑터 통신량. js/math.js의 FLMath에 더한다.
   DOM을 만지지 않으며 tests/math.test.cjs가 검사한다. 모든 자료는 고정 씨앗으로 만든 합성 자료다. */
(function(root){
'use strict';
const M=root.FLMath||(typeof require!=='undefined'?require('./math.js'):null);
const {rng,gauss,P,K,DIM,zeros,probs,localTrain,sub,norm,evaluate,correct,predict}=M;

/* ---------- 4장: 2차원 기기 표류 모형 ---------- */
/* 기기 셋의 손실 f_i(w) = ½ Σ_d a_id (w_d − c_id)². 전체 손실 F = 세 손실의 평균, 최적점 w*_d = Σ a_id c_id ÷ Σ a_id.
   실제 모델이 아니라 기울기만 정확히 계산되는 축소 모형이다(값은 이 책이 정함). */
const DRIFT={a:[[2,.2],[.2,2],[1,1]],c:[[-2,1],[2,1],[0,-2]]};
function driftOptimum(T=DRIFT){return [0,1].map(d=>{let s=0,t=0;T.a.forEach((a,i)=>{s+=a[d]*T.c[i][d];t+=a[d];});return s/t;});}
function driftLoss(w,T=DRIFT){return T.a.reduce((s,a,i)=>s+.5*(a[0]*(w[0]-T.c[i][0])**2+a[1]*(w[1]-T.c[i][1])**2),0)/T.a.length;}
const fullGrad=(x,T)=>[0,1].map(d=>T.a.reduce((s,a,i)=>s+a[d]*(x[d]-T.c[i][d]),0)/T.a.length);
/* method: 'fedavg' | 'fedprox'(μ) | 'scaffold'(제어 변수: 라운드 시작점의 기울기를 써서 y ← y − η(∇f_i(y) − ∇f_i(x) + ∇F(x))). */
function driftRun({steps=10,eta=.1,rounds=30,method='fedavg',mu=0,start=[3,3]}={},T=DRIFT){
 let x=start.slice();const path=[x.slice()],ends=[];
 for(let r=0;r<rounds;r++){
  const gF=fullGrad(x,T),sum=[0,0],last=[];
  T.a.forEach((a,i)=>{const y=x.slice();for(let k=0;k<steps;k++)for(let d=0;d<2;d++){let g=a[d]*(y[d]-T.c[i][d]);if(method==='fedprox')g+=mu*(y[d]-x[d]);if(method==='scaffold')g+=-a[d]*(x[d]-T.c[i][d])+gF[d];y[d]-=eta*g;}last.push(y);sum[0]+=y[0];sum[1]+=y[1];});
  x=[sum[0]/T.a.length,sum[1]/T.a.length];path.push(x.slice());ends.push(last);
 }
 const opt=driftOptimum(T);
 return {path,ends,x,opt,dist:Math.hypot(x[0]-opt[0],x[1]-opt[1]),gap:driftLoss(x,T)-driftLoss(opt,T)};
}

/* ---------- 7장: 업데이트에서 단어 쌍 복원 ---------- */
/* 기기의 업데이트 Δ = (학습 뒤 w) − (받은 w). FedSGD(E=1, 전체 한 묶음)면 Δ = −lr·g이고 g는 평균 기울기다. */
function userUpdate(w,pairs,{E=1,B=Infinity,lr=.3,seed=5}={}){return sub(localTrain(w,pairs,{E,B,lr,seed}).w,w);}
/* 서버(공격자)는 받은 w, 학습률 lr, 쌍 수 n(가중 평균에 쓰려고 기기가 함께 보냄)을 안다.
   g = −Δ/lr에서 앞 단어 c의 줄은 g_ck = (n_c·p_ck − 횟수_ck) ÷ n. n_c(0~n)를 차례로 넣어 횟수가 모두 0 이상의 정수가 되는 값을 찾는다.
   한 번의 기울기(FedSGD)면 정확히 찾아지고, 여러 걸음 학습했거나 잡음이 있으면 정수 조건을 만족하는 값이 없어 가장 가까운 값을 쓴다. */
function recoverCounts(w,delta,n,lr,tol=1e-6){
 const table=[],rows=[];let exact=true;
 for(let c=0;c<P;c++){
  const p=probs(w,c),g=Array.from({length:K},(_,k)=>-delta[c*K+k]/lr);
  if(g.every(x=>Math.abs(x)<1e-12)){table.push(new Array(K).fill(0));continue;}
  let best=null;
  for(let t=1;t<=n;t++){const v=g.map((x,k)=>t*p[k]-n*x),err=v.reduce((s,y)=>s+Math.abs(y-Math.max(0,Math.round(y))),0);if(!best||err<best.err)best={t,v,err};if(err<tol*K)break;}
  if(best.err>=tol*K)exact=false;
  table.push(best.v.map(y=>Math.max(0,Math.round(y))));rows.push(c);
 }
 return {table,rows,exact};
}
/* 한 쌍만으로 계산한 기울기에서 입력 벡터 꺼내기: 출력 j마다 x = ∂L/∂W_j ÷ ∂L/∂b_j (Geiping 외 2020의 관찰). */
function recoverInput(g,j){const gb=g[P*K+j];if(Math.abs(gb)<1e-12)return null;return Array.from({length:P},(_,c)=>g[c*K+j]/gb);}
function countsOf(pairs){const t=Array.from({length:P},()=>new Array(K).fill(0));for(const [c,k] of pairs)t[c][k]++;return t;}

/* ---------- 8장: 보안 집계 ---------- */
/* 장난감 크기의 정수 계산: 소수 p = 65537, 생성원 g = 3(Diffie–Hellman 키 합의), 업데이트와 마스크는 2^16으로 나눈 나머지.
   실제 프로토콜(Bonawitz 외 2017)은 큰 군과 암호학적 난수 생성기, 인증을 쓴다. 이 계산은 원리를 보이려는 축소판이다. */
const PRIME=65537,GEN=3,MOD=65536;
function modpow(b,e,m){let r=1;b%=m;while(e>0){if(e&1)r=r*b%m;b=b*b%m;e=Math.floor(e/2);}return r;}
const modinv=(a,m)=>modpow(((a%m)+m)%m,m-2,m);
function maskVec(seed,d){const r=rng(seed*2654435761>>>0);return Array.from({length:d},()=>Math.floor(r()*MOD));}
const enc=x=>((x%MOD)+MOD)%MOD,dec=x=>x>=MOD/2?x-MOD:x;
/* 비밀 나눔(Shamir): t−1차 다항식 f(0) = 비밀, 조각 (i, f(i)), i = 1..n. 조각 t개면 라그랑주 보간으로 f(0)을 되찾는다. */
function shamirShare(secret,n,t,r){const co=[secret,...Array.from({length:t-1},()=>1+Math.floor(r()*(PRIME-1)))];return Array.from({length:n},(_,i)=>{const x=i+1;let y=0,xp=1;for(const a of co){y=(y+a*xp)%PRIME;xp=xp*x%PRIME;}return [x,y];});}
function shamirRecover(points){let s=0;for(const [xi,yi] of points){let num=1,den=1;for(const [xj] of points)if(xj!==xi){num=num*(PRIME-xj)%PRIME;den=den*((xi-xj+PRIME)%PRIME)%PRIME;}s=(s+yi*num%PRIME*modinv(den,PRIME))%PRIME;}return s;}
/* 사용자 n명(updates: 정수 벡터들)의 보안 집계를 처음부터 끝까지 계산한다.
   dropped: 마스크한 값을 보내기 전에 끊긴 사용자 번호들, t: 비밀을 되찾는 데 필요한 조각 수, double: 자기 마스크 b_u도 쓰는지. */
function secureAggregate(updates,{dropped=[],t=3,double=true,seed=42}={}){
 const n=updates.length,d=updates[0].length,r=rng(seed),drop=new Set(dropped);
 const sk=updates.map(()=>2+Math.floor(r()*(PRIME-3))),pk=sk.map(a=>modpow(GEN,a,PRIME)),self=updates.map(()=>1+Math.floor(r()*(PRIME-2)));
 const pair=(u,v)=>modpow(pk[v],sk[u],PRIME);
 const skShares=sk.map(a=>shamirShare(a,n,t,r)),selfShares=self.map(b=>shamirShare(b,n,t,r));
 const masked=updates.map((x,u)=>x.map((xi,i)=>{let y=enc(xi);for(let v=0;v<n;v++)if(v!==u){const m=maskVec(pair(u,v),d)[i];y=u<v?y+m:y-m;}if(double)y+=maskVec(self[u],d)[i];return enc(y);}));
 const alive=[...Array(n).keys()].filter(u=>!drop.has(u));
 const raw=Array.from({length:d},(_,i)=>enc(alive.reduce((s,u)=>s+masked[u][i],0)));
 const enough=alive.length>=t,holders=alive.slice(0,t);let sum=raw.slice(),recovered={sk:{},self:{}};
 if(enough){
  for(const v of drop){const a=shamirRecover(holders.map(u=>skShares[v][u]));recovered.sk[v]=a;for(const u of alive){const m=maskVec(modpow(pk[u],a,PRIME),d);sum=sum.map((s,i)=>enc(u<v?s-m[i]:s+m[i]));}}
  if(double)for(const u of alive){const b=shamirRecover(holders.map(h=>selfShares[u][h]));recovered.self[u]=b;const m=maskVec(b,d);sum=sum.map((s,i)=>enc(s-m[i]));}
 }
 const truth=Array.from({length:d},(_,i)=>alive.reduce((s,u)=>s+updates[u][i],0));
 return {masked:masked.map(v=>v.map(dec)),raw:raw.map(dec),sum:enough?sum.map(dec):null,truth,alive,enough,recovered,sk,pk};
}

/* ---------- 9장: 차등 프라이버시 ---------- */
function clip(d,S){const nr=norm(d),f=nr>S?S/nr:1;return {d:d.map(x=>x*f),clipped:nr>S,norm:nr};}
/* DP-FedAvg(McMahan 외 2018의 틀): 라운드마다 사용자를 확률 q로 따로따로 뽑고(포아송 표집), 업데이트를 길이 S로 자르고,
   합에 표준편차 zS인 정규 잡음을 칸마다 더한 뒤 기대 인원 qN으로 나눈다. 사용자마다 몫은 같다(쌍 수로 가중하지 않음). */
function dpTrain(list,{q=.1,E=1,B=10,lr=.3,S=1,z=1,rounds=40,seed=1,noise=true}={}){
 let w=zeros();const curve=[],sizes=[];let clippedShare=0,count=0;
 for(let t=0;t<rounds;t++){
  const r=rng(seed*7777+t),sum=zeros();let m=0;
  for(const u of list){if(r()>=q)continue;const c=clip(sub(localTrain(w,u.train,{E,B,lr,seed:seed*31+t*977+u.id}).w,w),S);for(let i=0;i<DIM;i++)sum[i]+=c.d[i];m++;count++;if(c.clipped)clippedShare++;}
  const next=Float64Array.from(w),den=q*list.length;for(let i=0;i<DIM;i++)next[i]+=(sum[i]+(noise?z*S*gauss(r):0))/den;
  w=next;sizes.push(m);curve.push(evaluate(w,list).acc);
 }
 return {w,curve,sizes,clippedShare:count?clippedShare/count:0,final:evaluate(w,list)};
}
/* 포아송 표집 가우스 기법의 Rényi DP(정수 차수 α, Mironov·Talwar·Zhang 2019):
   A_α = Σ_{k=0}^{α} C(α,k)(1−q)^{α−k} q^k exp((k²−k)/(2z²)), ε_α = log A_α ÷ (α−1). T번 되풀이하면 T·ε_α.
   (ε, δ)로 바꾸기(Mironov 2017 명제 3): ε = min_α T·ε_α + log(1/δ) ÷ (α−1). 정수 차수만 쓰므로 조금 느슨할 수 있다. */
const LF=[0];for(let i=1;i<=1024;i++)LF[i]=LF[i-1]+Math.log(i);
function rdpOrder(q,z,a){
 if(q>=1)return a/(2*z*z);
 const terms=[];for(let k=0;k<=a;k++)terms.push(LF[a]-LF[k]-LF[a-k]+(a-k)*Math.log1p(-q)+(k?k*Math.log(q):0)+(k*k-k)/(2*z*z));
 const m=Math.max(...terms);return (m+Math.log(terms.reduce((s,x)=>s+Math.exp(x-m),0)))/(a-1);
}
function epsilon({q,z,T,delta,orders}){
 if(!(z>0))return {eps:Infinity,order:null};
 let best={eps:Infinity,order:null};
 for(const a of orders||Array.from({length:255},(_,i)=>i+2)){const e=T*rdpOrder(q,z,a)+Math.log(1/delta)/(a-1);if(e<best.eps)best={eps:e,order:a};}
 return best;
}

/* ---------- 10장: 개인화 ---------- */
/* 공용 모델 w에서 사용자마다 자기 학습 쌍으로 epochs번 더 학습해(lr, 묶음 10) 개인 모델을 만들고,
   두 모델의 확률을 λ·공용 + (1−λ)·개인으로 섞어 앞 단어마다 가장 큰 단어를 추천한다. 시험 쌍은 학습에 쓰지 않는다. */
function personalize(w,list,{epochs=2,lr=.3,lambda=.5,seed=9}={}){
 const pg=Array.from({length:P},(_,c)=>probs(w,c)),gpred=predict(w),out=[];
 for(const u of list){
  const lw=epochs?localTrain(w,u.train,{E:epochs,B:10,lr,seed:seed*13+u.id}).w:w;
  const pred=Array.from({length:P},(_,c)=>{const pl=probs(lw,c),mix=pl.map((x,k)=>lambda*pg[c][k]+(1-lambda)*x);return mix.indexOf(Math.max(...mix));});
  out.push({id:u.id,style:u.style,fresh:u.fresh,n:u.train.length,global:correct(gpred,u.testCount)/u.test.length,mine:correct(pred,u.testCount)/u.test.length});
 }
 const mean=f=>out.reduce((s,x)=>s+f(x),0)/out.length;
 const by=[0,1,2].map(s=>{const g=out.filter(x=>x.style===s);return g.length?g.reduce((a,x)=>a+x.mine,0)/g.length:0;});
 return {users:out,global:mean(x=>x.global),mine:mean(x=>x.mine),byStyle:by,better:out.filter(x=>x.mine>x.global+1e-9).length,worse:out.filter(x=>x.mine<x.global-1e-9).length};
}

/* ---------- 11장: 그룹별 연합 평가 ---------- */
/* 기기는 시험 쌍 20개를 자기 안에서 채점해 (맞힌 수, 시험 수)만 보낸다. 서버는 메타데이터 열쇠로 묶어 더한다.
   style(말투)은 서버가 모르는 값이며, 이 책에서만 정답지로 보여 준다. 기기가 minSize대보다 적은 묶음은 숫자를 감춘다.
   구간은 윌슨 95% 구간(z = 1.96)이며 시험 쌍을 서로 독립으로 본 근사다(한 사람의 쌍은 서로 닮아 실제로는 더 넓다). */
const GROUPS={tier:['기기 등급',u=>M.TIERS[u.tier]],fresh:['가입 시기',u=>u.fresh?'가입 30일 이내':'가입 30일 넘음'],night:['충전 습관',u=>u.night?'밤에 충전':'밤에 충전 안 함'],wifi:['집 와이파이',u=>u.wifi?'있음':'없음'],style:['말투(정답지)',u=>M.STYLES[u.style]]};
function wilson(h,n,z=1.96){if(!n)return [0,0];const p=h/n,d=1+z*z/n,c=p+z*z/(2*n),s=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n));return [(c-s)/d,(c+s)/d];}
function groupReport(list,hitOf,key,minSize=20){
 const [label,f]=GROUPS[key],map=new Map();
 for(const u of list){const g=f(u);if(!map.has(g))map.set(g,{group:g,devices:0,hit:0,n:0});const x=map.get(g);x.devices++;x.hit+=hitOf(u);x.n+=u.test.length;}
 const rows=[...map.values()].sort((a,b)=>b.devices-a.devices).map(x=>({...x,hidden:x.devices<minSize,acc:x.hit/x.n,ci:wilson(x.hit,x.n)}));
 return {label,rows};
}
function participation(logs,list){const seen=new Map();for(const l of logs)for(const id of (l.ids||[]))seen.set(id,(seen.get(id)||0)+1);return list.map(u=>seen.get(u.id)||0);}

/* ---------- 12장: LoRA 어댑터만 주고받기 ---------- */
/* d×k 행렬 하나에 LoRA를 붙이면 B(d×r)와 A(r×k)로 r(d+k)개를 학습한다(Hu 외 2021). 층 L개, 층마다 행렬 mats개(정사각 d×d)일 때
   어댑터 숫자 = L × mats × 2dr. 전체 모델 숫자 full은 입력으로 받는다(이 책이 정한 예시 크기). */
const loraParams=({L,d,r,mats=2})=>L*mats*2*d*r;
function loraComm({full,L,d,r,mats=2,bits=16,devices,rounds}){
 const lora=loraParams({L,d,r,mats}),bytes=x=>x*bits/8;
 return {lora,share:lora/full,fullRound:devices*2*bytes(full),loraRound:devices*2*bytes(lora),fullTotal:rounds*devices*2*bytes(full),loraTotal:rounds*devices*2*bytes(lora)};
}

Object.assign(M,{DRIFT,driftOptimum,driftLoss,driftRun,userUpdate,recoverCounts,recoverInput,countsOf,PRIME,GEN,MOD,modpow,modinv,maskVec,enc,dec,shamirShare,shamirRecover,secureAggregate,clip,dpTrain,rdpOrder,epsilon,personalize,GROUPS,wilson,groupReport,participation,loraParams,loraComm});
if(typeof module!=='undefined')module.exports=M;
})(typeof window!=='undefined'?window:globalThis);
