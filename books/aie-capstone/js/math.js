/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   단위: 시간은 초(s), 비용은 달러($), 메모리는 GB(10⁹ 바이트). 교육용 가정값은 각 함수 주석에 적었다. */
(function(root){
'use strict';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const sigmoid=x=>1/(1+Math.exp(-x));
/* 시드를 고정한 의사난수(mulberry32). 같은 시드면 같은 수열이 나와 실험 초기화가 같은 결과를 재현한다. */
function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}

/* 1장 · 재시도와 지연. 시도 하나는 확률 p로 시간 초과(timeoutS 소모), 1−p로 okS 만에 성공한다.
   재시도 전 대기는 원본 레슨 23의 0, 0.1·(1+U), 0.4·(1+U)를 평균(×1.25)으로 쓰고, 4·5번째는 같은 ×4 규칙으로 늘렸다(가정). */
const BACKOFF=[0,0.125,0.5,2,8];
function retryStats(p,attempts,timeoutS,okS=0.8){
 const out=[];let wait=0,success=0,expected=0,calls=0;
 for(let i=1;i<=attempts;i++){
  wait+=BACKOFF[i-1];const reach=Math.pow(p,i-1);calls+=reach;
  const pr=reach*(1-p),lat=(i-1)*timeoutS+wait+okS;success+=pr;expected+=pr*lat;out.push([lat,pr]);
 }
 const failP=Math.pow(p,attempts),failLat=attempts*timeoutS+wait;expected+=failP*failLat;out.push([failLat,failP]);
 out.sort((a,b)=>a[0]-b[0]);let acc=0,p95=out[out.length-1][0];
 for(const [lat,pr] of out){acc+=pr;if(acc>=0.95-1e-12){p95=lat;break;}}
 return {success,expected,p95,worst:Math.max(...out.map(o=>o[0])),calls,failP};
}
/* 1장 · 계획-실행 예산. 계획 planLen걸음, 걸음마다 실패 확률 p. 실패하면 재계획이 진단·수정 add걸음을 끼워 넣고
   실패한 걸음을 다시 한다. 재계획은 maxReplans번까지, 걸음(성공·실패 모두)은 maxSteps까지 쓴다. 상태별 확률을 정확히 센다. */
function replanBudget(p,maxSteps,planLen=5,add=3,maxReplans=5){
 let states=new Map([[`${planLen},0`,1]]),done=0,abort=0,doneSteps=0,abortSteps=0;
 for(let s=0;s<maxSteps;s++){
  const next=new Map(),put=(k,v)=>next.set(k,(next.get(k)||0)+v);
  for(const [key,pr] of states){
   const [r,j]=key.split(',').map(Number);
   if(r-1===0){done+=pr*(1-p);doneSteps+=pr*(1-p)*(s+1);}else put(`${r-1},${j}`,pr*(1-p));
   if(j<maxReplans)put(`${r+add},${j+1}`,pr*p);else{abort+=pr*p;abortSteps+=pr*p*(s+1);}
  }
  states=next;
 }
 let yieldP=0;for(const v of states.values())yieldP+=v;
 const expSteps=doneSteps+abortSteps+yieldP*maxSteps;
 return {done,abort,yieldP,expSteps,minSteps:planLen};
}
/* 2장 · pass@k. 단순 추정 1−(1−p)^k와 원본 레슨 72의 비편향 추정 1 − C(n−c,k)/C(n,k). */
const passNaive=(p,k)=>1-Math.pow(1-clamp(p,0,1),k);
function passAtK(n,c,k){
 if(k>n)return NaN;if(n-c<k)return 1;
 let prod=1;for(let i=n-c+1;i<=n;i++)prod*=1-k/i;return 1-prod;
}
/* 표지 · 통과할 때까지 최대 k번 시도한다(앞에서 통과하면 멈춤). 기대 시도 수와 통과당 비용. */
function tryUntilPass(p,k,costPer){
 let exp=0;for(let i=0;i<k;i++)exp+=Math.pow(1-p,i);
 const pass=passNaive(p,k);
 return {pass,expTries:exp,costPerTask:exp*costPer,costPerSolved:pass>0?exp*costPer/pass:Infinity};
}
/* 시도 수 분포의 q분위: 1번째 시도에 통과하지 못하면 다음 시도. 끝까지 실패하면 k번. */
function triesQuantile(p,k,q=0.95){let acc=0;for(let i=1;i<=k;i++){acc+=Math.pow(1-p,i-1)*p;if(acc>=q-1e-12)return i;}return k;}
/* 2장 · 꼬리 표집. 하루 요청 perDay, 오류 비율 err(전부 보관), 성공 요청 보관률 keep.
   성공한 응답 중 badRate 비율에 조용한 결함(예: 가짜 주민번호)이 섞였을 때 첫 발견까지 걸리는 기대 시간(포아송 가정). */
function tailSampling(perDay,err,keep,badRate){
 const stored=perDay*(err+(1-err)*keep),badPerHour=perDay/24*(1-err)*badRate*keep;
 const minutes=badPerHour>0?60/badPerHour:Infinity,within5=1-Math.exp(-badPerHour*5/60);
 return {stored,share:stored/perDay,badPerHour,minutes,within5};
}
/* 3장 · 여러 역할 팀의 토큰 증폭. 단일 에이전트 turns턴, 팀은 역할 수만큼 턴이 늘어난다(원본 레슨 10: 40턴 → 4역할 160턴). */
function teamCost(roles,teamSolve,singleSolve,turns=40,costPerTurn=0.02){
 const single=turns*costPerTurn/singleSolve,team=turns*roles*costPerTurn/teamSolve;
 return {single,team,ratio:team/single,breakEven:roles*singleSolve,teamTurns:turns*roles};
}
/* 4장 · UCB1 스케줄러. 갈래별 참 평균 보상(가정)에서 시드 고정 잡음으로 실험 결과를 뽑는다.
   점수 = 평균 + c·√(ln N / n), 안 해 본 갈래는 무한대. 3번 이상 해 보고 평균 0.2 미만이면 가지치기, 평균 0.7 이상이 처음 되면 논문 신호. */
const UCB_MEANS=[0.15,0.40,0.55,0.75];
function ucbRun(c,budget,seed=7,means=UCB_MEANS){
 const R=rng(seed),k=means.length,runs=Array(k).fill(0),sum=Array(k).fill(0),pruned=Array(k).fill(false),trigger=Array(k).fill(0),order=[];
 let total=0;
 for(let t=1;t<=budget;t++){
  let best=-1,score=-Infinity;
  for(let i=0;i<k;i++){if(pruned[i])continue;const s=runs[i]===0?Infinity:sum[i]/runs[i]+c*Math.sqrt(Math.log(t-1||1)/runs[i]);if(s>score){score=s;best=i;}}
  const r=clamp(means[best]+(R()-0.5)*0.5,0,1);runs[best]++;sum[best]+=r;total+=r;order.push(best);
  const m=sum[best]/runs[best];
  if(!trigger[best]&&m>=0.7)trigger[best]=t;
  if(runs[best]>=3&&m<0.2)pruned[best]=true;
 }
 const best=means.indexOf(Math.max(...means));
 return {runs,means:runs.map((n,i)=>n?sum[i]/n:0),pruned,trigger,total,regret:budget*means[best]-total,bestShare:runs[best]/budget,order};
}
/* 5장 · GPT 매개변수 수. 블록 하나 = 12d² + 13d (QKV·출력 투영·MLP 4배·LayerNorm 두 개, 편향 포함). */
function gptParams(L,d,V=50257,ctx=1024,tied=true){
 const block=12*d*d+13*d,tok=V*d,pos=ctx*d,lnf=2*d,head=tied?0:V*d,total=L*block+tok+pos+lnf+head;
 return {block,blocks:L*block,tok,pos,lnf,head,total,bf16GB:total*2/1e9,trainGB:total*16/1e9};
}
/* 3장 슬라이딩 창 개수(원본 레슨 31): 길이 T+1 창을 보폭 S로 자른다. */
const windowCount=(N,T,S)=>Math.max(0,1+Math.floor((N-(T+1))/S));
/* 6장 · DPO. 두 응답(선호 w, 비선호 l)과 기준 정책 확률 refP. 보상 차 dr일 때 KL 규제 최적 정책은 π ∝ π_ref·exp(r/β). */
function dpoPolicy(beta,dr,refP=0.5){
 const pw=sigmoid(Math.log(refP/(1-refP))+dr/beta),xl=(a,b)=>a>0?a*Math.log(a/b):0,kl=xl(pw,refP)+xl(1-pw,1-refP);
 return {pw,kl,margin:dr/beta,startLoss:Math.log(2),startGrad:beta/2};
}
const dpoLoss=(beta,margin)=>-Math.log(sigmoid(beta*margin));
/* 7장 · ZeRO 단계별 매개변수 하나당 바이트(혼합 정밀도 Adam: fp16 가중치 2 + fp16 기울기 2 + fp32 원본·두 모멘트 12). 활성값은 뺐다. */
function zeroMem(Pb,N,stage){
 const bytes={ddp:16,z1:4+12/N,z2:2+14/N,z3:16/N}[stage],comm=(stage==='z3'?3:2)*(N-1)/N*2*Pb;
 return {bytes,gb:Pb*bytes,ddpGb:Pb*16,saving:1-bytes/16,commGB:comm};
}
/* 7장 · 파이프라인 거품. 단계 N, 마이크로배치 M, 앞·뒤 계산 각 1칸. */
function bubble(N,M){return {fraction:(N-1)/(M+N-1),slots:2*(M+N-1),useful:2*M,gpipeAct:M,ofobAct:Math.min(M,N)};}
/* 8장 · 검색 지표. rels: 순위별 관련도(0이면 무관), gold: 정답 문서 관련도 목록. 이득은 관련도, 할인은 log2(순위+1). */
function ragMetrics(rels,gold,k){
 const top=rels.slice(0,k),hit=top.filter(r=>r>0).length,first=rels.findIndex(r=>r>0);
 const dcg=top.reduce((s,r,i)=>s+r/Math.log2(i+2),0),ideal=[...gold].sort((a,b)=>b-a).slice(0,k).reduce((s,r,i)=>s+r/Math.log2(i+2),0);
 return {precision:hit/k,recall:hit/gold.length,mrr:first<0?0:1/(first+1),ndcg:ideal?dcg/ideal:0};
}
/* 8장 · 같은 질문에 대한 세 파이프라인의 순위 목록(교육용 가정 순위). 정답 문서 셋의 관련도는 d1=3, d3=2, d7=1. 조각 하나는 400토큰으로 가정. */
const RAG_GOLD={d1:3,d3:2,d7:1};
const RAG_RUNS={base:['d5','d9','d3','d2','d8','d1','d4','d6','d10','d7'],hybrid:['d3','d5','d1','d9','d2','d7','d8','d4','d6','d10'],rerank:['d1','d3','d7','d5','d9','d2','d8','d4','d6','d10']};
function ragRun(name,k){
 const rels=RAG_RUNS[name].map(d=>RAG_GOLD[d]||0);
 return Object.assign(ragMetrics(rels,Object.values(RAG_GOLD),k),{ctxTokens:k*400,firstHit:rels.findIndex(r=>r>0)+1,fullAt:Math.max(...Object.keys(RAG_GOLD).map(d=>RAG_RUNS[name].indexOf(d)+1))});
}
/* 9장 · 패치 토큰 예산. 한 변 side 픽셀을 patch 크기로 자르면 (side/patch)² 토큰(나머지는 잘라 냄)에 CLS 하나. */
function patchTokens(side,patch,textTokens=64){
 const g=Math.floor(side/patch),n=g*g,seq=n+1;
 return {grid:g,patches:n,seq,selfPairs:seq*seq,crossPairs:textTokens*n,rel:seq*seq/(197*197),cut:side-g*patch};
}
/* 10장 · 짝지은 부트스트랩. 과제 n개마다 두 모델 점수 차 d_i = gap + 잡음(두 균등 잡음 ±0.15의 차)을 만들고,
   잡음의 표본 평균을 빼서 관찰된 평균 차이가 정확히 gap이 되게 한다(교육용 가정: 표본 운을 없애고 구간 폭만 보이게 함).
   그 차이를 B번 복원 추출해 2.5%·97.5% 분위로 95% 구간을 낸다. 시드가 고정이라 같은 입력이면 같은 결과다. */
function bootstrapDiff(n,gap,B=500,seed=11){
 const R=rng(seed),e=[];
 for(let i=0;i<n;i++)e.push((R()-0.5)*0.3-(R()-0.5)*0.3);
 const m0=e.reduce((s,x)=>s+x,0)/n,d=e.map(x=>gap+x-m0),mean=gap,means=[];
 for(let b=0;b<B;b++){let s=0;for(let i=0;i<n;i++)s+=d[Math.floor(R()*n)];means.push(s/n);}
 means.sort((x,y)=>x-y);const lo=means[Math.floor(0.025*B)],hi=means[Math.ceil(0.975*B)-1];
 return {mean,lo,hi,width:hi-lo,verdict:lo>0?'better':hi<0?'worse':'tie'};
}
/* 11장 · 안전 게이트. 공격 50개와 정상 50개의 탐지기 점수(교육용 가정 분포를 고르게 나눈 분위값).
   공격은 0.99에서 0.25까지, 정상은 대부분 0.1 아래이고 역할극처럼 헷갈리는 소수가 0.87까지 오른다.
   점수 ≥ 문턱이면 차단, 0.5~문턱이면 경고 후 통과, 0.5 미만이면 그냥 통과(원본 레슨 87의 집계표 모양). */
function gateFixture(){
 const att=[],ben=[];
 for(let i=0;i<50;i++){const u=(i+0.5)/50;att.push(+(1-0.75*Math.pow(u,1.6)).toFixed(3));ben.push(+(0.9*Math.pow(u,4)).toFixed(3));}
 return {att,ben};
}
function gateStats(thr,base){
 const {att,ben}=gateFixture(),frac=(a,f)=>a.filter(f).length/a.length;
 const tpr=frac(att,s=>s>=thr),fpr=frac(ben,s=>s>=thr),miss=frac(att,s=>s<0.5),attWarn=frac(att,s=>s>=0.5&&s<thr),benWarn=frac(ben,s=>s>=0.5&&s<thr);
 const precision=tpr*base+fpr*(1-base)>0?tpr*base/(tpr*base+fpr*(1-base)):0;
 return {tpr,fpr,miss,attWarn,benWarn,precision,benignBlocked10k:fpr*(1-base)*1e4,notBlocked10k:(1-tpr)*base*1e4,attackThrough10k:miss*base*1e4};
}
/* 12장 · 출시 사양표. 앞 장의 계산을 묶는다. 가정: 개발자 200명 × 하루 10과제 × 22일 × 사용량 배수, 시도 하나 6,000토큰 + 문맥 조각당 400토큰,
   100만 토큰당 3달러, 시도 하나 12초 + 문맥 조각당 0.15초, 공격 기저율 1%, 출력 쪽 층이 입력 탐지기를 지나온 공격의 60%를 더 막음,
   문맥 조각 수별 한 번 통과율 3→0.30, 5→0.34, 10→0.35(모두 교육용 가정값).
   mode='seq'는 통과할 때까지 차례로 시도하고, 'par'는 k개를 한꺼번에 돌려 그중 통과한 것을 쓴다. */
const CTX_PASS={3:0.30,5:0.34,10:0.35};
function launchSheet(k,mode,ctx,thr,outLayer,traffic=2){
 const tasks=200*10*22*traffic,p=CTX_PASS[ctx],per=(6000+400*ctx)*3/1e6,one=12+0.15*ctx,t=tryUntilPass(p,k,per),g=gateStats(thr,0.01);
 const tries=mode==='par'?k:t.expTries,p95=mode==='par'?one:triesQuantile(p,k,0.95)*one,leak=(1-g.tpr)*(outLayer?0.4:1);
 return {tasks,p,pass:t.pass,tries,monthly:tasks*tries*per,p95,benignBlocked:g.fpr*0.99*tasks,attackNotBlocked:leak*0.01*tasks,tpr:g.tpr,fpr:g.fpr};
}
const LAUNCH_TARGET={monthly:4000,p95:30,pass:0.55,benignBlocked:1500,attackNotBlocked:300};
const A20Math={clamp,sigmoid,rng,retryStats,replanBudget,passNaive,passAtK,tryUntilPass,triesQuantile,tailSampling,teamCost,UCB_MEANS,ucbRun,gptParams,windowCount,dpoPolicy,dpoLoss,zeroMem,bubble,ragMetrics,RAG_GOLD,RAG_RUNS,ragRun,patchTokens,bootstrapDiff,gateFixture,gateStats,CTX_PASS,launchSheet,LAUNCH_TARGET};
if(typeof module!=='undefined')module.exports=A20Math;else root.A20Math=A20Math;
})(typeof window!=='undefined'?window:globalThis);
