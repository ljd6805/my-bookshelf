/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   공통 사례: 시청 정책팀이 맡긴 질문 "공공자전거 대여소를 30곳 늘려야 할까?"를 푸는 보고서 팀.
   토큰 수, 걸리는 시간, 오류율 같은 값은 이 책이 정한 교육용 가정값이며 함수 이름 옆에 적었다. */
(function(root){
'use strict';
/* 시드를 고정한 난수(mulberry32). 같은 시드는 같은 결과를 낸다. */
function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const sum=a=>a.reduce((s,x)=>s+x,0);
const choose=(n,k)=>{let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r;};

/* 1장 · 한 에이전트의 천장. 가정: 문서 하나를 찾고 읽는 데 도구 호출 2번, 20초.
   시스템 프롬프트 2,000토큰, 조사원 한 명은 문서 5개까지, 요약은 1,500토큰, 반장의 계획 3,000토큰, 창 200,000토큰. */
function ceiling(n,docTok=7000){
 const SYS=2000,PER=5,SUM=1500,PLAN=3000,SEC=20,WINDOW=200000;
 const single=SYS+n*docTok,workers=Math.ceil(n/PER),workerCtx=SYS+Math.min(n,PER)*docTok,leadCtx=SYS+PLAN+workers*SUM;
 const multiTotal=workers*SYS+n*docTok+workers*SUM+leadCtx;
 const singleTime=n*SEC,multiTime=30+Math.min(n,PER)*SEC+30;
 const calls=2*n,stay=calls<20&&single<100000;
 return {single,workers,workerCtx,leadCtx,multiTotal,singleTotal:single,singleTime,multiTime,calls,stay,overflow:single>WINDOW,window:WINDOW,firstOverflow:Math.floor((WINDOW-SYS)/docTok)+1};
}

/* 2장 · A2A 작업 수명주기(원본 레슨이 그린 상태 그림을 단순화한 전이표). 끝 상태에서는 어떤 사건도 받지 않는다. */
const TASK_NEXT={SUBMITTED:['WORKING','REJECTED','CANCELED'],WORKING:['INPUT_REQUIRED','AUTH_REQUIRED','COMPLETED','FAILED','CANCELED'],INPUT_REQUIRED:['WORKING','CANCELED'],AUTH_REQUIRED:['WORKING','CANCELED'],COMPLETED:[],FAILED:[],CANCELED:[],REJECTED:[]};
const TERMINAL=['COMPLETED','FAILED','CANCELED','REJECTED'];
const TASK_SCENARIOS={
 happy:['WORKING','COMPLETED'],
 input:['WORKING','INPUT_REQUIRED','WORKING','COMPLETED'],
 auth:['WORKING','AUTH_REQUIRED','WORKING','FAILED'],
 reject:['REJECTED','WORKING'],
 late:['WORKING','COMPLETED','WORKING'],
 cancel:['WORKING','INPUT_REQUIRED','CANCELED','WORKING']
};
function taskRun(events,steps=events.length){
 let state='SUBMITTED';const history=[];
 events.slice(0,steps).forEach(e=>{const ok=TASK_NEXT[state].includes(e);history.push({from:state,event:e,ok,to:ok?e:state});if(ok)state=e;});
 return {state,history,terminal:TERMINAL.includes(state),rejected:history.filter(h=>!h.ok).length};
}

/* 3장 · 누가 다음 차례를 정하나. 조사 → 작성 → 검토 세 단계.
   p: 지금 에이전트가 "이만하면 끝"이라며 일찍 마칠 확률(손넘김 방식에서만 작동).
   q: 바깥 선택자 LLM이 맞는 다음 발언자를 고를 확률(가정 0.9). 틀리면 그 차례를 버리고 다시 고른다. */
function orchestra(p,q=0.9){
 const stat={calls:3,review:1,selector:0};
 const hand={calls:1+(1-p)+(1-p)*(1-p),review:(1-p)*(1-p),selector:0};
 const sel={calls:3/q+3/q,review:1,selector:3/q};
 return {static:stat,handoff:hand,selector:sel};
}

/* 4장 · 반장 한 명과 조사원 K명. 하위 질문 10개(분 단위 소요는 가정값)를 가장 긴 일부터 비어 있는 조사원에게 준다.
   계획 5분, 조사원을 띄울 때마다 spawn분, 종합 3분 + 조사원당 1분. 조사원 문맥 3,000 + 질문당 8,000토큰, 반장은 요약 1,500토큰씩 읽는다. */
const SUBQ=[9,14,6,11,8,13,7,10,12,9];
function lpt(times,k){const load=Array(k).fill(0),count=Array(k).fill(0);[...times].sort((a,b)=>b-a).forEach(t=>{const i=load.indexOf(Math.min(...load));load[i]+=t;count[i]++;});return {load,count,makespan:Math.max(...load)};}
function fanout(k,spawn=1,times=SUBQ){
 const s=lpt(times,k),time=5+spawn*k+s.makespan+3+k,serial=5+sum(times)+4;
 const tokens=k*3000+times.length*8000+(4000+k*1500);
 return {k,time,serial,makespan:s.makespan,load:s.load,count:s.count,tokens,leadCtx:4000+k*1500,maxWorkerCtx:3000+Math.max(...s.count)*8000};
}
function bestFanout(spawn=1,times=SUBQ){let best=null;for(let k=1;k<=times.length;k++){const r=fanout(k,spawn,times);if(!best||r.time<best.time)best=r;}return best;}

/* 4장 · 계층의 의미 흐림. 질문은 d단계를 내려가고 요약은 d단계를 올라오며, 한 번 건널 때마다 확률 e로 뜻이 어긋난다.
   카나리아 조사원은 원래 질문을 그대로 받아 어긋남을 확률 c(가정 0.8)로 알아챈다. */
function drift(d,e,canary=false,c=0.8){
 const passes=2*d,keep=Math.pow(1-e,passes),bad=1-keep,silent=canary?bad*(1-c):bad;
 return {passes,keep,bad,silent,caught:bad-silent};
}

/* 5장 · 비평가와 검증자. b: 실행자가 버그를 낼 확률. 비평가는 그럴듯해 보이는 실행 버그의 30%만, 테스트를 돌리는 검증자는 90%를 잡는다고 가정.
   잡히면 다시 만들게 하되 수정 왕복은 2번까지, 그다음은 사람에게 넘긴다. */
const CHECK={none:{critic:false,verifier:false},critic:{critic:true,verifier:false},verifier:{critic:false,verifier:true},both:{critic:true,verifier:true}};
function verify(b,mode,cCatch=0.3,vCatch=0.9,rounds=2){
 const m=CHECK[mode],miss=(m.critic?1-cCatch:1)*(m.verifier?1-vCatch:1),rej=b*(1-miss);
 let geo=0;for(let k=0;k<=rounds;k++)geo+=Math.pow(rej,k);
 const bug=b*miss*geo,clean=(1-b)*geo,escalate=Math.pow(rej,rounds+1),attempts=geo;
 const checksPer=(m.critic?1:0)+(m.verifier?1:0);
 return {miss,bug,clean,escalate,attempts,calls:attempts*(1+checksPer)};
}

/* 5장 · 공유 기억 오염. 조사원 가가 원문 "4.2% 증가"를 "42%"로 잘못 적는 고정 시나리오.
   mode: none(장치 없음), provenance(출처 기록과 덧붙이기만), readonly(쓰기 권한 없는 검증자), writer(풀에 쓰는 검증자). */
function poison(mode,steps=5){
 const SRC=4.2,pool=[];
 const add=(who,value,text,extra={})=>pool.push({who,value,text,source:mode==='none'?'':extra.source||'',flag:extra.flag||''});
 const plan=[
  ()=>add('조사원 가',42,'대여 건수가 42% 늘었다',{source:'시 교통과 보고서 3쪽'}),
  ()=>add('요약가',42,'42%의 큰 증가(가의 기록)',{source:'풀 1번 기록'}),
  ()=>add('분석가',42,'증가 폭이 크니 30곳 확대를 권고',{source:'풀 2번 기록'}),
  ()=>{
   if(mode==='readonly'){pool.push({who:'검증자(읽기 전용)',value:SRC,text:'원문을 다시 열어 보니 4.2%. 1번 기록과 다름',source:'시 교통과 보고서 3쪽',flag:'별도 채널',side:true});}
   else if(mode==='writer'){add('검증자(풀에 씀)',42,'풀의 기록 3개가 모두 42%로 일치. 확인됨',{source:'풀 1~3번 기록',flag:'오염된 확인'});}
  },
  ()=>{
   const caught=mode==='readonly';
   add('작성자',caught?SRC:42,caught?'1번 기록을 대체: 4.2% 증가. 확대 권고 보류':'최종 보고서: 42% 증가, 30곳 확대 권고',{source:caught?'검증 채널 · 원문':'풀 1~3번 기록',flag:caught?'정정(1번을 대체)':''});
  }
 ];
 plan.slice(0,steps).forEach(f=>f());
 const inPool=pool.filter(x=>!x.side),wrong=inPool.filter(x=>x.value===42).length,last=inPool[inPool.length-1];
 const trace=mode==='none'?inPool.length:1;
 return {pool,wrong,final:steps>=5?last.value:null,traceSteps:trace,caught:mode==='readonly'&&steps>=4};
}

/* 6장 · 공유 대기열. 문서 12개(분 단위 소요, 가정값)를 일꾼 w명이 처리한다.
   sequential: 한 명이 차례로. fixed: 미리 번갈아 나눠 줌. queue: 비면 대기열에서 다음 것을 가져감. lpt: 긴 일부터 가져감. */
const DOCS=[2,9,3,1,8,2,7,1,2,6,3,2];
function schedule(w,mode,docs=DOCS){
 if(mode==='sequential')w=1;
 const load=Array(w).fill(0),count=Array(w).fill(0),order=mode==='lpt'?[...docs].sort((a,b)=>b-a):docs;
 order.forEach((t,i)=>{let j=mode==='fixed'?i%w:load.indexOf(Math.min(...load));load[j]+=t;count[j]++;});
 const makespan=Math.max(...load),busy=sum(docs);
 return {w,load,count,makespan,idle:w*makespan-busy,utilization:busy/(w*makespan),lower:Math.max(busy/w,Math.max(...docs))};
}

/* 6장 · 개미 군집식 길잡이(AMRO-S의 착상을 단순화). 조사원 3명 × 일감 종류 4가지.
   QUAL은 일감별 실제 품질(가정값), LAT는 처리 시간. 셋째 조사원은 빠르지만 자주 틀린다.
   gate=false면 끝낸 일마다 1/LAT만큼 흔적을 남기고, gate=true면 품질 검사(품질 표본 > 0.7)를 통과한 일에만 1을 남긴다. */
const QUAL=[[0.9,0.5,0.6,0.85],[0.6,0.9,0.85,0.5],[0.4,0.4,0.4,0.4]],LAT=[3,3,1];
function pheromone(gate,rho,tasks=300,seed=17){
 const r=rng(seed),tau=QUAL.map(row=>row.map(()=>1)),last=[];let qSum=0,qRand=0;
 for(let n=0;n<tasks;n++){
  const type=n%4,col=tau.map(row=>row[type]),tot=sum(col);let u=r()*tot,a=0;while(u>col[a]&&a<2){u-=col[a];a++;}
  const q=QUAL[a][type],ok=r()<q;
  for(const row of tau)for(let t=0;t<4;t++)row[t]*=1-rho;
  tau[a][type]+=gate?(ok&&q>0.7?1:0):1/LAT[a];
  if(n>=tasks-60){qSum+=q;last.push(a);}
  qRand+=sum(QUAL.map(row=>row[type]))/3;
 }
 const share=QUAL.map((_,a)=>last.filter(x=>x===a).length/last.length);
 const best=[0,1,2,3].map(t=>tau.map(row=>row[t]).indexOf(Math.max(...tau.map(row=>row[t]))));
 return {tau,share,quality:qSum/60,random:qRand/tasks,best,optimal:[0,1,1,0]};
}

/* 7장 · 다수결. 각 에이전트가 맞힐 확률 p. 확률 rho로 모두가 같은 모델의 같은 답을 따라가고(단일 문화), 나머지 경우는 서로 독립이다. */
function majority(n,p){let s=0;for(let k=Math.floor(n/2)+1;k<=n;k++)s+=choose(n,k)*Math.pow(p,k)*Math.pow(1-p,n-k);if(n%2===0)s+=0.5*choose(n,n/2)*Math.pow(p,n/2)*Math.pow(1-p,n/2);return s;}
function vote(n,p,rho){const ind=majority(n,p),acc=rho*p+(1-rho)*ind;return {independent:ind,acc,gain:acc-p,calls:n};}

/* 7장 · 토론 구조별 메시지 수와 읽는 문맥(답 하나 400토큰 가정). 한 라운드에 각자 한 번 말한다. */
function topology(kind,n,rounds=2,tok=400){
 const per={star:2*(n-1),chain:n-1,tree:2*(n-1),graph:n*(n-1)}[kind];
 const reads={star:(n-1)+(n-1),chain:n-1,tree:2*(n-1),graph:n*(n-1)}[kind];
 return {messages:per*rounds,contextTokens:reads*tok*rounds};
}

/* 8장 · 다섯 에이전트의 숫자 답(대여 증가율 %)과 자신감. 정답은 4.2. */
const VOTES={
 honest:[[4.2,0.8],[4.2,0.7],[4.1,0.6],[4.3,0.7],[4.2,0.8]],
 byzantine:[[42,0.95],[4.2,0.6],[4.2,0.5],[4.3,0.55],[3.9,0.5]],
 sycophancy:[[42,0.9],[42,0.3],[42,0.35],[4.2,0.85],[4.3,0.8]],
 monoculture:[[42,0.6],[42,0.6],[42,0.6],[4.2,0.7],[4.3,0.65]]
};
function clusters(votes,tol=0.1){
 const out=[];votes.forEach(([v,c])=>{const g=out.find(g=>Math.abs(v-g.center)<=tol*Math.abs(g.center));if(g){g.members.push(v);g.count++;g.weight+=c;}else out.push({center:v,members:[v],count:1,weight:c});});
 return out;
}
function median(a){const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;}
function consensus(name,threshold=0.5,truth=4.2){
 const votes=VOTES[name],cl=clusters(votes),n=votes.length,W=sum(votes.map(v=>v[1]));
 const byCount=[...cl].sort((a,b)=>b.count-a.count)[0],byWeight=[...cl].sort((a,b)=>b.weight-a.weight)[0],med=median(votes.map(v=>v[0]));
 const right=v=>Math.abs(v-truth)<=0.1*truth;
 const plural={value:byCount.center,share:byCount.count/n},weighted={value:byWeight.center,share:byWeight.weight/W},geo={value:med,share:votes.filter(v=>right(v[0])===right(med)).length/n};
 for(const x of [plural,weighted,geo]){x.accept=x.share>=threshold;x.correct=right(x.value);}
 return {votes,plural,weighted,geo,f:votes.filter(v=>!right(v[0])).length,bftLimit:Math.floor((n-1)/3)};
}

/* 9장 · 흥정. 시드를 고정한 1,000번의 거래. 구매자 최대가 B ~ 균등[80,120], 판매자 최저가 S ~ 균등[60,100].
   판매자는 1.3S에서, 제안 생성기(OG) 구매자는 0.7B에서 출발해 라운드 k마다 남은 폭의 k/R만큼 고르게 양보한다(R라운드 안에 끝까지 가지는 않는다).
   순진한 LLM 구매자는 매번 0.85B 근처를 크게 흔들려 부르며(표준편차 0.15B), 자기 최대가를 넘어 부르기도 한다. 최대가를 넘은 값에 성사되면 손해 거래로 보고 성사에서 뺀다. */
function bargain(rounds,trials=1000,seed=7){
 const r=rng(seed);let zopa=0,og=0,naive=0,naiveOver=0,ogSurplus=0;
 const gauss=()=>{let u=0;for(let i=0;i<6;i++)u+=r();return (u-3)/Math.sqrt(0.5);};
 for(let i=0;i<trials;i++){
  const B=80+40*r(),S=60+40*r();if(B<S)continue;zopa++;
  const ask=k=>1.3*S-(0.3*S)*k/rounds;
  let dealO=false,dealN=false,over=false,price=0;
  for(let k=0;k<rounds;k++){const offer=0.7*B+(0.3*B)*k/rounds;if(offer>=ask(k)){dealO=true;price=ask(k);break;}}
  for(let k=0;k<rounds;k++){const offer=B*(0.85+0.15*gauss());if(offer>B)over=true;if(offer>=ask(k)){dealN=offer<=B;break;}}
  if(dealO){og++;ogSurplus+=(B-price)/(B-S||1);}if(dealN)naive++;if(over)naiveOver++;
 }
 return {zopa,og:og/zopa,naive:naive/zopa,naiveOver:naiveOver/zopa,ogSurplus:og?ogSurplus/og:0};
}

/* 9장 · 섀플리 값. 조사원(R)·작성자(W)·검증자(V)의 연합 가치표(가정값). 셋이 모두 모였을 때의 가치만 full로 바꾼다. */
function coalitionValue(full){return {'':0,R:0.3,W:0.1,V:0,RW:0.6,RV:0.4,VW:0.2,RVW:full};}
function shapley(v,players=['R','W','V']){
 const key=s=>[...s].sort().join(''),perms=[];
 const permute=(a,p=[])=>{if(!a.length)return perms.push(p);a.forEach((x,i)=>permute(a.filter((_,j)=>j!==i),[...p,x]));};permute(players);
 const phi={};players.forEach(x=>phi[x]=0);
 perms.forEach(o=>{let s=[];o.forEach(x=>{phi[x]+=v[key([...s,x])]-v[key(s)];s=[...s,x];});});
 players.forEach(x=>phi[x]/=perms.length);return phi;
}
function secondPrice(bids){const s=bids.map((b,i)=>[b,i]).sort((a,b)=>b[0]-a[0]);return {winner:s[0][1],pay:s.length>1?s[1][0]:0};}

/* 10장 · 상대의 마음 모형. n명이 n개의 상자를 하나씩 줍는다(상자를 주운 에이전트는 일을 마친다). 서로 말은 못 하고, 지난 차례에 각자 어느 상자 쪽으로 움직였는지만 본다.
   같은 상자를 두 차례 연속 향해야 그 상자에 닿아 줍는다. 0차: 남은 상자 중 무작위로 정해 끝까지 간다.
   1차: 번호가 더 작은 다른 에이전트가 향하던 상자를 피해서 고른다(믿음 오류 확률 h면 그 관측을 무작위 상자로 잘못 기억). */
function tom(order,n,h=0,trials=200,seed=11){
 const r=rng(seed);let dup=0,choices=0,turnsSum=0,done=0;
 for(let t=0;t<trials;t++){
  let left=[...Array(n).keys()],target=Array(n).fill(-1),prog=Array(n).fill(0),seen=Array(n).fill(-1),busy=Array(n).fill(true),turn=0;
  while(left.length&&turn<4*n){
   turn++;const next=Array(n).fill(-1);
   for(let a=0;a<n;a++){
    if(!busy[a])continue;
    const belief=seen.map((x,j)=>j===a||x<0?-1:(r()<h?left[Math.floor(r()*left.length)]:x));
    let keep=left.includes(target[a]);
    if(order===1&&keep&&belief.some((x,j)=>j<a&&x===target[a]))keep=false;
    if(keep){next[a]=target[a];continue;}
    let pool=left;if(order===1){const free=left.filter(x=>!belief.includes(x));if(free.length)pool=free;}
    next[a]=pool[Math.floor(r()*pool.length)];
   }
   for(let a=0;a<n;a++){if(!busy[a])continue;prog[a]=next[a]===target[a]?prog[a]+1:1;if(next.some((x,j)=>j!==a&&busy[j]&&x===next[a]))dup++;choices++;}
   target=next;seen=[...next];
   for(let a=0;a<n;a++)if(busy[a]&&prog[a]>=2&&left.includes(target[a])){left=left.filter(x=>x!==target[a]);busy[a]=false;}
  }
  if(!left.length){done++;turnsSum+=turn;}
 }
 return {duplication:dup/choices,completion:done/trials,turns:done?turnsSum/done:4*n};
}

/* 10장 · 생성형 에이전트의 기억 꺼내기. 점수 = 최근성 e^(−decay·나이) + 중요도/10 + 관련도(가중치 모두 1). */
const MEMORIES=[['이사벨라가 밸런타인 파티에 초대했다',8,9,0.9],['아침에 커피를 마셨다',1,2,0.1],['대여소 앞 공사 소식을 들었다',3,5,0.3],['어제 파티 장소가 하브스 카페라고 들었다',20,7,0.8],['비가 와서 자전거를 두고 왔다',2,3,0.2]];
function retrieval(decay,mem=MEMORIES){return mem.map(([text,age,imp,rel])=>{const rec=Math.exp(-decay*age);return {text,age,imp,rel,rec,score:rec+imp/10+rel};});}

/* 11장 · 재시도 폭풍과 회로 차단기. 요청량 1(상대값), 재고 서비스 용량 1.2.
   재시도 r번이면 요청 하나가 평균 Σ_{k=0}^{r} f^k번 시도된다. 용량을 넘는 몫은 실패해 결제 실패율에 더해진다.
   차단기를 켜면 실패율이 문턱(10%)을 넘을 때 재시도를 멈추고 기본 응답을 돌려준다. */
function storm(f0,retries,breaker,steps=20,cap=1.2,theta=0.1,demand=1){
 let f=f0;const load=[],fail=[];let opened=0;
 for(let t=0;t<steps;t++){
  const open=breaker&&f>theta;if(open)opened++;
  let att=0;for(let k=0;k<=(open?0:retries);k++)att+=Math.pow(f,k);
  const l=demand*att,e=Math.max(0,1-cap/l);load.push(l);fail.push(f);f=Math.min(0.99,f0+e);
 }
 return {load,fail,peak:Math.max(...load),final:load[load.length-1],finalFail:fail[fail.length-1],opened};
}
/* 11장 · 체크포인트에서 다시 시작. 단계 n개 중 crash 번째 단계 도중 죽고, every 단계마다 상태를 저장했다면 다시 해야 할 단계 수. */
function resume(n,crash,every){const saved=every>0?Math.floor((crash-1)/every)*every:0;return {saved,redo:crash-saved,total:n+(crash-saved)};}

/* 마지막 장 · 세 가지 사고와 세 가지 처방. 앞 장의 함수로 처방 전후 지표를 다시 계산한다. */
function diagnose(incident,fix){
 if(incident==='poison'){
  const before=poison('none').final,mode=fix==='verify'?'readonly':'none',after=poison(mode).final;
  return {metric:'최종 보고서의 증가율(정답 4.2%)',before,after,unit:'%',good:after===4.2};
 }
 if(incident==='storm'){
  const before=storm(0.2,5,false).final,after=fix==='more'?storm(0.2,5,false,20,1.2,0.1,1.5).final:fix==='verify'?storm(0.2,5,true).final:storm(0.2,8,false).final;
  return {metric:'재고 서비스가 받는 부하(평소 1)',before,after,unit:'배',good:after<=1.2};
 }
 const before=vote(3,0.75,0.8).acc,after=fix==='more'?vote(7,0.75,0.8).acc:fix==='verify'?vote(3,0.75,0.1).acc:before;
 return {metric:'합의한 답이 맞을 확률',before,after,unit:'',good:after>=0.8};
}

const A17Math={rng,choose,ceiling,TASK_NEXT,TERMINAL,TASK_SCENARIOS,taskRun,orchestra,SUBQ,lpt,fanout,bestFanout,drift,verify,poison,DOCS,schedule,QUAL,LAT,pheromone,majority,vote,topology,VOTES,clusters,median,consensus,bargain,coalitionValue,shapley,secondPrice,tom,MEMORIES,retrieval,storm,resume,diagnose};
if(typeof module!=='undefined')module.exports=A17Math;else root.A17Math=A17Math;
})(typeof window!=='undefined'?window:globalThis);
