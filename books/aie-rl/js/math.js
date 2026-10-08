/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   공통 사례: 창고 배달 로봇 나르미. 격자 창고는 행 우선 번호(r*cols+c)로 칸을 세고, 행동은 0 위·1 오른쪽·2 아래·3 왼쪽이다. */
(function(root){
'use strict';
const DR=[-1,0,1,0],DC=[0,1,0,-1],ARROWS=['↑','→','↓','←'];
/* 시드가 있는 난수: 같은 시드는 같은 결과를 낸다(mulberry32). */
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function gauss(r){let u=0;while(u===0)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r());}
const sigmoid=x=>1/(1+Math.exp(-x));
function softmax(z){const m=Math.max(...z),e=z.map(v=>Math.exp(v-m)),s=e.reduce((a,b)=>a+b,0);return e.map(v=>v/s);}

/* 격자 MDP. slip 확률만큼 의도한 방향의 양옆으로 미끄러진다(양쪽 반씩). 낭떠러지 칸에 들어가면 cliffR를 받고 출발점으로 돌아간다. */
function makeGrid(o){return {rows:o.rows,cols:o.cols,start:o.start||0,terminals:o.terminals||[],cliff:o.cliff||[],slip:o.slip||0,stepR:o.stepR===undefined?-1:o.stepR,cliffR:o.cliffR===undefined?-100:o.cliffR,enterR:o.enterR||{}};}
const warehouse=(slip=0)=>makeGrid({rows:4,cols:4,start:0,terminals:[15],slip});
const cliffWorld=(slip=0)=>{const cliff=[];for(let c=1;c<11;c++)cliff.push(36+c);return makeGrid({rows:4,cols:12,start:36,terminals:[47],cliff,slip});};
const homeWorld=()=>makeGrid({rows:5,cols:5,start:10,terminals:[0,24],stepR:0,enterR:{0:2,24:10}});
function move(env,s,a){const r=Math.floor(s/env.cols),c=s%env.cols;return Math.min(Math.max(r+DR[a],0),env.rows-1)*env.cols+Math.min(Math.max(c+DC[a],0),env.cols-1);}
function outcomes(env,s,a){
 if(env.terminals.includes(s))return [[s,0,1]];
 const dirs=env.slip>0?[[a,1-env.slip],[(a+1)%4,env.slip/2],[(a+3)%4,env.slip/2]]:[[a,1]];
 return dirs.map(([d,p])=>{const n=move(env,s,d);if(env.cliff.includes(n))return [env.start,env.cliffR,p];return [n,env.enterR[n]!==undefined?env.enterR[n]:env.stepR,p];});
}
const qValue=(env,V,g,s,a)=>outcomes(env,s,a).reduce((t,[n,r,p])=>t+p*(r+g*V[n]),0);
const nStates=env=>env.rows*env.cols;
/* 정책 평가: pi[s]는 행동 확률 4개. 제자리 갱신(가우스-자이델)으로 최대 변화가 tol 아래가 될 때까지 반복한다. */
function evaluate(env,pi,gamma,tol=1e-6,max=20000){
 const V=new Array(nStates(env)).fill(0);let sweeps=0,delta=Infinity;
 while(delta>=tol&&sweeps<max){delta=0;sweeps++;
  for(let s=0;s<V.length;s++){if(env.terminals.includes(s))continue;let v=0;for(let a=0;a<4;a++)if(pi[s][a])v+=pi[s][a]*qValue(env,V,gamma,s,a);delta=Math.max(delta,Math.abs(v-V[s]));V[s]=v;}}
 return {V,sweeps,converged:delta<tol};
}
const uniform=env=>Array.from({length:nStates(env)},()=>[.25,.25,.25,.25]);
const asProbs=(env,act)=>act.map(a=>[0,1,2,3].map(k=>k===a?1:0));
function greedy(env,V,gamma){return Array.from({length:nStates(env)},(_,s)=>{let best=0,bv=-Infinity;for(let a=0;a<4;a++){const q=qValue(env,V,gamma,s,a);if(q>bv+1e-9){bv=q;best=a;}}return best;});}
/* 가치 반복: 동기식 한 번 훑기(모든 칸이 이전 V를 읽음)를 k번 한다. 정보가 한 번에 한 칸씩 퍼지는 모습을 보여 준다. */
function valueSweeps(env,gamma,k){
 let V=new Array(nStates(env)).fill(0),delta=0;
 for(let i=0;i<k;i++){const W=V.slice();delta=0;for(let s=0;s<V.length;s++){if(env.terminals.includes(s))continue;let b=-Infinity;for(let a=0;a<4;a++)b=Math.max(b,qValue(env,V,gamma,s,a));W[s]=b;delta=Math.max(delta,Math.abs(b-V[s]));}V=W;}
 return {V,delta,policy:greedy(env,V,gamma)};
}
function valueIteration(env,gamma,tol=1e-6,max=20000){let sweeps=0,r;do{sweeps++;r=valueSweepsFrom(env,gamma,r?r.V:null);}while(r.delta>=tol&&sweeps<max);return {V:r.V,sweeps,policy:greedy(env,r.V,gamma)};}
function valueSweepsFrom(env,gamma,V0){const V=V0||new Array(nStates(env)).fill(0),W=V.slice();let delta=0;for(let s=0;s<V.length;s++){if(env.terminals.includes(s))continue;let b=-Infinity;for(let a=0;a<4;a++)b=Math.max(b,qValue(env,V,gamma,s,a));W[s]=b;delta=Math.max(delta,Math.abs(b-V[s]));}return {V:W,delta};}
/* 정책 반복: 모두 '위'에서 시작해 평가 → 탐욕 개선을 정책이 멈출 때까지. gamma<1에서만 쓴다. */
function policyIteration(env,gamma){let act=new Array(nStates(env)).fill(0),outer=0,ev;
 while(outer<100){outer++;ev=evaluate(env,asProbs(env,act),gamma);const next=greedy(env,ev.V,gamma);if(next.every((a,i)=>a===act[i]))break;act=next;}
 return {V:ev.V,policy:act,outer};}
/* 탐욕 정책을 출발점에서 따라간 경로(미끄러짐 없이). */
function path(env,policy,limit=80){const out=[env.start];let s=env.start;for(let i=0;i<limit&&!env.terminals.includes(s);i++){s=move(env,s,policy[s]);if(env.cliff.includes(s)){out.push(s);break;}out.push(s);}return out;}

/* 1장: 무작위 정책의 가치와 할인율 */
function mdpRandom(gamma){const env=warehouse(),ev=evaluate(env,uniform(env),gamma,1e-6,50000);let best=0;for(let k=0;k<6;k++)best-=Math.pow(gamma,k);
 return {V:ev.V,start:ev.V[0],sweeps:ev.sweeps,horizon:gamma<1?1/(1-gamma):Infinity,optimal:best,gap:best-ev.V[0]};}
/* 3장: 무작위 정책으로 굴린 에피소드의 첫 방문 몬테카를로 평균(출발 칸만). */
function mcRandom(n,seed=7,gamma=1,cap=500){const env=warehouse(),r=rng(seed);let mean=0;const curve=[];
 for(let i=1;i<=n;i++){let s=0,G=0,disc=1;for(let t=0;t<cap&&s!==15;t++){const [[nx,rew]]=outcomes(env,s,Math.floor(r()*4));G+=disc*rew;disc*=gamma;s=nx;}mean+=(G-mean)/i;curve.push(mean);}
 return {mean,curve};}
/* 3장: 세 갈래 통로(밴디트). 표본 평균 Q, ε-탐욕. runs번 반복한 평균. */
const ROUTE_MEANS=[1.0,1.5,1.2];
function banditEps(eps,o={}){const means=o.means||ROUTE_MEANS,steps=o.steps||500,runs=o.runs||200,r=rng(o.seed||11),k=means.length,best=means.indexOf(Math.max(...means));
 const avg=new Array(steps).fill(0),opt=new Array(steps).fill(0);
 for(let run=0;run<runs;run++){const Q=new Array(k).fill(0),N=new Array(k).fill(0);
  for(let t=0;t<steps;t++){let a;if(r()<eps)a=Math.floor(r()*k);else{a=0;for(let i=1;i<k;i++)if(Q[i]>Q[a])a=i;}
   const rew=means[a]+gauss(r);N[a]++;Q[a]+=(rew-Q[a])/N[a];avg[t]+=rew/runs;if(a===best)opt[t]+=1/runs;}}
 const tail=(arr,n)=>arr.slice(-n).reduce((a,b)=>a+b,0)/n;
 return {avg,opt,total:avg.reduce((a,b)=>a+b,0),lastOpt:tail(opt,100),lastAvg:tail(avg,100),bestMean:means[best]};}

/* 4장: 절벽 걷기에서 Q-learning(다음 칸의 max)과 SARSA(실제로 고른 다음 행동). runs번 평균. */
function tdRun(env,algo,eps,alpha,episodes,r){
 const Q=Array.from({length:nStates(env)},()=>[0,0,0,0]),ret=[];
 const pick=s=>{if(r()<eps)return Math.floor(r()*4);let b=0;for(let a=1;a<4;a++)if(Q[s][a]>Q[s][b])b=a;return b;};
 for(let e=0;e<episodes;e++){let s=env.start,a=pick(s),G=0;
  for(let t=0;t<300&&!env.terminals.includes(s);t++){const [[n,rew]]=outcomes(env,s,a);G+=rew;const done=env.terminals.includes(n),a2=done?0:pick(n);
   const next=done?0:(algo==='q'?Math.max(...Q[n]):Q[n][a2]);Q[s][a]+=alpha*(rew+next-Q[s][a]);s=n;a=a2;}
  ret.push(G);}
 return {Q,ret};
}
function cliffCompare(eps,o={}){const env=cliffWorld(),runs=o.runs||10,episodes=o.episodes||500,alpha=o.alpha||0.5,out={};
 for(const algo of ['q','sarsa']){const r=rng((o.seed||5)+(algo==='q'?0:1000)),curve=new Array(episodes).fill(0);let edge=0,first=null;
  for(let i=0;i<runs;i++){const {Q,ret}=tdRun(env,algo,eps,alpha,episodes,r);ret.forEach((g,k)=>curve[k]+=g/runs);
   const pol=Q.map(q=>{let b=0;for(let a=1;a<4;a++)if(q[a]>q[b])b=a;return b;}),p=path(env,pol,60);
   if(!first)first=p;if(p[p.length-1]===47&&p.filter(s=>s>=24&&s<36).length>=10)edge++;}
  const p=first,reached=p[p.length-1]===47;
  out[algo]={curve,lastAvg:curve.slice(-100).reduce((a,b)=>a+b,0)/100,path:p,reached,steps:p.length-1,edgeRuns:edge,runs,topRow:Math.min(...p.map(s=>Math.floor(s/12)))};}
 return out;}
/* 5장: 최대화 편향. 참값이 모두 0인 행동 K개를 잡음 σ로 추정할 때 max 추정의 평균(단일)과 이중 추정. */
function maxBias(K,sigma,o={}){const r=rng(o.seed||3),trials=o.trials||4000;let single=0,dbl=0;
 for(let t=0;t<trials;t++){let bA=-Infinity,iA=0;const B=[];for(let a=0;a<K;a++){const qa=sigma*gauss(r);B.push(sigma*gauss(r));if(qa>bA){bA=qa;iA=a;}}single+=bA/trials;dbl+=B[iA]/trials;}
 return {single,double:dbl};}
/* 6장: 두 행동 정책경사 추정량 g=(R-b)·∇log π(a)의 평균과 분산(정확한 식). π(1)=p, 보상 평균 mu0·mu1, 잡음 σ. */
function pgVariance(p,mu0,mu1,sigma,b){const s1=1-p,s0=-p,mean=p*s1*(mu1-b)+(1-p)*s0*(mu0-b),m2=p*s1*s1*((mu1-b)**2+sigma*sigma)+(1-p)*s0*s0*((mu0-b)**2+sigma*sigma),v=m2-mean*mean,bStar=(1-p)*mu1+p*mu0;
 const vStar=(()=>{const m=p*s1*(mu1-bStar)+(1-p)*s0*(mu0-bStar);return p*s1*s1*((mu1-bStar)**2+sigma*sigma)+(1-p)*s0*s0*((mu0-bStar)**2+sigma*sigma)-m*m;})();
 return {mean,variance:v,std:Math.sqrt(Math.max(v,0)),bStar,varStar:vStar};}
/* 6장: GAE. δ_t=r_t+γV(s_{t+1})-V(s_t), A_t=Σ(γλ)^l δ_{t+l}. */
function gae(rewards,values,gamma,lambda,last=0){const A=new Array(rewards.length).fill(0);let g=0;
 for(let t=rewards.length-1;t>=0;t--){const nv=t+1<values.length?values[t+1]:last,d=rewards[t]+gamma*nv-values[t];g=d+gamma*lambda*g;A[t]=g;}return A;}
/* 6장: 비평가가 모든 칸을 c만큼 틀릴 때 A_0 추정의 편향·분산(γ=1, 길이 T, 보상 잡음 σ). */
function gaeStats(lambda,c,T=20,sigma=1){const bias=c*(1-Math.pow(lambda,T-1));let v=0;for(let l=0;l<T;l++)v+=Math.pow(lambda,2*l);v*=sigma*sigma;return {bias,variance:v,rmse:Math.sqrt(bias*bias+v)};}
/* 7장: PPO 클리핑 목적. */
function clipObj(ratio,A,eps){const c=Math.min(Math.max(ratio,1-eps),1+eps),un=ratio*A,cl=c*A,obj=Math.min(un,cl);return {unclipped:un,clipped:cl,obj,gradZero:(A>0&&ratio>1+eps)||(A<0&&ratio<1-eps)};}
/* 7장: 한 상태·세 행동 정책을 같은 묶음으로 K번 갱신. 묶음: 행동0 A=+1, 행동1 A=-1, 행동2 A=0 각 4개. */
const PPO_BATCH=[0,0,0,0,1,1,1,1,2,2,2,2].map((a,i)=>[a,[1,-1,0][a]]);
function ppoEpochs(K,useClip,o={}){const eps=o.eps||0.2,lr=o.lr||0.5,old=[1/3,1/3,1/3];let th=[0,0,0];const hist=[];
 for(let k=0;k<K;k++){const pi=softmax(th),g=[0,0,0];let clipped=0;
  for(const [a,A] of PPO_BATCH){const ratio=pi[a]/old[a],z=useClip&&clipObj(ratio,A,eps).gradZero;if(z){clipped++;continue;}for(let j=0;j<3;j++)g[j]+=ratio*A*((j===a?1:0)-pi[j])/PPO_BATCH.length;}
  th=th.map((v,j)=>v+lr*g[j]);const np=softmax(th);hist.push({kl:old.reduce((s,q,j)=>s+q*Math.log(q/np[j]),0),clipFrac:clipped/PPO_BATCH.length,probs:np});}
 const last=hist[hist.length-1]||{kl:0,clipFrac:0,probs:old};return {hist,kl:last.kl,clipFrac:last.clipFrac,probs:last.probs,ratio0:last.probs[0]/old[0]};}
/* 8장: 브래들리-테리. 점수 차 Δ=R(A)-R(B)일 때 사람이 A를 고를 확률과 손실. */
function bt(delta,chose='A'){const pA=sigmoid(delta),p=chose==='A'?pA:1-pA;return {pA,p,loss:-Math.log(p),grad:1-p};}
/* 8장: KL 규제 최적 정책 π ∝ π_ref·exp(R/β)(닫힌 해). 보상 모델 점수와 실제 만족도가 다른 행동을 섞었다. */
const BEHAVIORS=[{name:'정석 경로',ref:.45,rm:1.0,truth:1.0},{name:'조금 빠른 경로',ref:.25,rm:1.4,truth:1.2},{name:'선반 스치는 지름길',ref:.05,rm:3.0,truth:-2.0},{name:'느린 우회',ref:.2,rm:0.2,truth:0.5},{name:'멈춰서 확인',ref:.05,rm:-0.5,truth:0.3}];
function klPolicy(beta,items=BEHAVIORS){const w=items.map(b=>Math.log(b.ref)+b.rm/beta),p=softmax(w);
 return {probs:p,rm:p.reduce((s,q,i)=>s+q*items[i].rm,0),truth:p.reduce((s,q,i)=>s+q*items[i].truth,0),kl:p.reduce((s,q,i)=>s+(q>0?q*Math.log(q/items[i].ref):0),0),names:items.map(b=>b.name)};}

/* 9장: 교차로를 함께 지나는 로봇 두 대(등반 게임 형태의 공동 보상). 행동 0 나란히 질주, 1 보통 속도, 2 천천히. */
const AISLE=[[11,-30,0],[-30,7,6],[0,0,5]];
function coopGame(episodes,eps,mode,o={}){const runs=o.runs||60,alpha=o.alpha||0.1,r=rng(o.seed||17),n=AISLE.length,ends=new Array(n*n).fill(0);let tail=0;
 const arg=q=>{let b=0;for(let k=1;k<q.length;k++)if(q[k]>q[b])b=k;return b;},pick=q=>r()<eps?Math.floor(r()*q.length):arg(q);
 for(let run=0;run<runs;run++){const init=k=>Array.from({length:k},()=>r()*1e-3),Q1=init(n),Q2=init(n),J=init(n*n);let last=0;
  for(let e=0;e<episodes;e++){let a,b;
   if(mode==='joint'){const j=pick(J);a=Math.floor(j/n);b=j%n;J[j]+=alpha*(AISLE[a][b]-J[j]);}
   else{a=pick(Q1);b=pick(Q2);const rew=AISLE[a][b];Q1[a]+=alpha*(rew-Q1[a]);Q2[b]+=alpha*(rew-Q2[b]);}
   if(e>=episodes-100)last+=AISLE[a][b];}
  const j=mode==='joint'?arg(J):arg(Q1)*n+arg(Q2);ends[j]++;tail+=last/Math.min(100,episodes)/runs;}
 const share=ends.map(v=>v/runs);return {share,best:share[0],tailAvg:tail,runs,top:share.indexOf(Math.max(...share))};}
/* 10장: 도메인 랜덤화. 미끄러짐을 관측하지 못하는 정책에는 걸음마다 slip~균등[0,w]를 새로 뽑는 훈련이 평균 미끄러짐 w/2 하나로 훈련한 것과 같다(에피소드마다 고정하면 근사). */
const REAL_SLIPS=[0,0.1,0.2,0.3,0.4,0.5];
function trainedPolicy(trainSlip,gamma=0.99){return valueIteration(cliffWorld(trainSlip),gamma,1e-6).policy;}
function evalPolicy(policy,slip,gamma=0.99){return evaluate(cliffWorld(slip),asProbs(cliffWorld(slip),policy),gamma,1e-6).V[36];}
function drEval(width,gamma=0.99){const pol=trainedPolicy(width/2,gamma),base=trainedPolicy(0,gamma),env=cliffWorld();
 const p=path(env,pol,80),pb=path(env,base,80);
 return {slips:REAL_SLIPS,dr:REAL_SLIPS.map(s=>evalPolicy(pol,s,gamma)),narrow:REAL_SLIPS.map(s=>evalPolicy(base,s,gamma)),steps:p.length-1,baseSteps:pb.length-1,topRow:Math.min(...p.map(s=>Math.floor(s/12))),policy:pol};}
/* 11장: PUCT 선택. 수 세 개의 가치 Q(결정적), 사전 확률 prior. 방문하지 않은 수의 Q는 0. */
const MOVES=[{name:'수 A',q:0.55,prior:0.15},{name:'수 B',q:0.45,prior:0.6},{name:'수 C',q:0.2,prior:0.25}];
function puct(c,N=40,moves=MOVES){const n=moves.map(()=>0);for(let i=0;i<N;i++){const tot=n.reduce((a,b)=>a+b,0);let best=0,bs=-Infinity;
  moves.forEach((m,k)=>{const sc=(n[k]?m.q:0)+c*m.prior*Math.sqrt(tot)/(1+n[k]);if(sc>bs+1e-12){bs=sc;best=k;}});n[best]++;}
 return {visits:n,share:n.map(v=>v/N),best:n.indexOf(Math.max(...n))};}
/* 11장: GRPO 묶음 상대 이점. 같은 주문을 G번 시도하고 검증기가 1/0을 준다. */
function grpoGroup(G,p,seed=21){const r=rng(seed),rew=Array.from({length:G},()=>r()<p?1:0),m=rew.reduce((a,b)=>a+b,0)/G,sd=Math.sqrt(rew.reduce((a,b)=>a+(b-m)**2,0)/G);
 return {rewards:rew,mean:m,std:sd,adv:rew.map(x=>sd>0?(x-m)/sd:0),noSignal:Math.pow(p,G)+Math.pow(1-p,G)};}
/* 표지: 가까운 충전대(+2)와 먼 출구(+10) 중 어디로 갈지 할인율이 정한다. */
function homeGamma(gamma){const env=homeWorld(),vi=valueIteration(env,gamma,1e-9),p=path(env,vi.policy,30),end=p[p.length-1];
 return {V:vi.V,policy:vi.policy,path:p,target:end===24?'far':'near',near:2*gamma,far:10*Math.pow(gamma,5),threshold:Math.pow(0.2,1/4)};}
/* 마지막 과제: 보고 세 가지와 처방 네 가지. 맞는 처방이면 앞 장의 계산으로 전후를 비교한다. */
const REPORTS={slip:{metric:'젖은 바닥(미끄러짐 0.3)에서 출발 칸의 기대 이득',fix:'dr'},hack:{metric:'작업자 실제 만족도의 기대값',fix:'beta'},stuck:{metric:'마지막 100번의 평균 보상',fix:'eps'}};
function finalCase(report,fix){const R=REPORTS[report];let before,after;
 if(report==='slip'){before=evalPolicy(trainedPolicy(0),0.3);after=fix==='dr'?evalPolicy(trainedPolicy(0.2),0.3):before;}
 else if(report==='hack'){before=klPolicy(0.2).truth;after=fix==='beta'?klPolicy(1.5).truth:before;}
 else{before=banditEps(0,{runs:100}).lastAvg;after=fix==='eps'?banditEps(0.1,{runs:100}).lastAvg:before;}
 return {metric:R.metric,before,after,matched:fix===R.fix};}

const A10Math={rng,gauss,sigmoid,softmax,ARROWS,makeGrid,warehouse,cliffWorld,homeWorld,move,outcomes,qValue,evaluate,uniform,asProbs,greedy,valueSweeps,valueIteration,policyIteration,path,
 mdpRandom,mcRandom,ROUTE_MEANS,banditEps,tdRun,cliffCompare,maxBias,pgVariance,gae,gaeStats,clipObj,PPO_BATCH,ppoEpochs,bt,BEHAVIORS,klPolicy,AISLE,coopGame,REAL_SLIPS,trainedPolicy,evalPolicy,drEval,MOVES,puct,grpoGroup,homeGamma,REPORTS,finalCase};
if(typeof module!=='undefined')module.exports=A10Math;else root.A10Math=A10Math;
})(typeof window!=='undefined'?window:globalThis);
