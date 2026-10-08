/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   공통 사례: 온라인 서점 '책마루'의 야간 에이전트 누리. 수치 중 원본 레슨에서 온 것은 주석에 [원본], 이 책이 정한 교육용 가정값은 [가정]으로 적는다. */
(function(root){
'use strict';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const sigmoid=z=>1/(1+Math.exp(-z));
/* 시드를 고정한 난수(mulberry32)와 표준정규 표본. 같은 시드면 늘 같은 결과를 낸다. */
function rng(seed){let s=seed>>>0;return ()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function gauss(r){const u=Math.max(r(),1e-12),v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}

const A16Math={
 clamp,sigmoid,rng,gauss,

 /* 1장 · 단계 신뢰도의 누적: 단계마다 성공 확률 p가 독립이면 n단계 모두 성공할 확률은 p^n. */
 chain(p,n){
  const P=Math.pow(p,n),n50=p>=1?Infinity:Math.log(0.5)/Math.log(p);
  return {P,n50,fail:1-P,expectedFirstFail:p>=1?Infinity:1/(1-p)};
 },
 chainCurve(p,nmax,steps=60){const out=[];for(let i=0;i<=steps;i++){const n=nmax*i/steps;out.push([n,Math.pow(p,n)]);}return out;},

 /* 2장 · STaR 고리 장난감 모형. 풀이를 세 종류로 나눈다: 바른 추론, 지름길, 찍기.
    분포 안 정답률 [가정]: 바른 0.9, 지름길 0.9, 찍기 0.25. 분포 밖: 바른 0.9, 지름길 0.1, 찍기 0.25.
    한 바퀴: 정답을 낸 풀이만 남기고(과정 검사를 켜면 지름길·찍기 풀이의 80%를 걸러 냄), 남은 비율 쪽으로 η=0.5만큼 옮겨 간다. */
 starLoop(h,rounds,filter='answer'){
  const accIn=[0.9,0.9,0.25],accOut=[0.9,0.1,0.25],catchRate=filter==='process'?0.8:0;
  let w=[0.2,clamp(h,0,0.6),0];w[2]=1-w[0]-w[1];
  const acc=(w,a)=>w.reduce((s,x,i)=>s+x*a[i],0),hist=[{round:0,inD:acc(w,accIn),outD:acc(w,accOut),w:w.slice()}];
  let keptTotal=0;
  for(let r=1;r<=rounds;r++){
   const kept=w.map((x,i)=>x*accIn[i]*(i===0?1:1-catchRate)),s=kept.reduce((a,b)=>a+b,0);
   keptTotal=s;w=w.map((x,i)=>0.5*x+0.5*kept[i]/s);
   hist.push({round:r,inD:acc(w,accIn),outD:acc(w,accOut),w:w.slice()});
  }
  const last=hist[hist.length-1];
  return {hist,inD:last.inD,outD:last.outD,gap:last.inD-last.outD,w:last.w,keptShare:keptTotal};
 },

 /* 3장 · 평가기 아래의 진화 고리. 부모 프로그램 하나에서 세대마다 자식 8개를 만들고 평가 점수가 가장 높은 자식이 부모보다 나으면 바꾼다.
    q = 실제 품질(숨긴 입력에서의 정답률 비슷한 값), h = 공개 테스트 암기 정도, t = 평가 코드 손대기 정도. 모두 [가정]인 교육용 단위.
    visible: 점수 = q + h. holdout: 점수 = q + 작은 잡음. editable: 숨긴 입력이지만 평가 코드가 에이전트 손에 있어 점수 = q + t. */
 evolve(mode,gens,seed=16){
  const r=rng(seed);let p={q:0.5,h:0,t:0};
  const score=c=>mode==='visible'?c.q+c.h:mode==='editable'?c.q+c.t:c.q+0.01*gauss(r);
  p.s=score(p);const rep=[[0,p.s]],tru=[[0,p.q]];let accepted=0;
  for(let g=1;g<=gens;g++){
   let best=null;
   for(let k=0;k<8;k++){
    const dh=0.03*gauss(r),z=gauss(r),c={h:Math.max(0,p.h+dh),t:p.t+(z>1.5?0.04*z:0)};
    c.q=clamp(p.q+0.012*gauss(r)-0.25*Math.max(0,dh)-(c.t>p.t?0.01:0),0,1);c.s=score(c);
    if(!best||c.s>best.s)best=c;
   }
   if(best.s>p.s){p=best;accepted++;}
   rep.push([g,p.s]);tru.push([g,p.q]);
  }
  return {reported:rep,truth:tru,finalReported:p.s,finalTrue:p.q,gap:p.s-p.q,accepted,h:p.h,t:p.t};
 },

 /* 4장 · 자동 연구 파이프라인의 기대값(아이디어 100개당).
    [원본] 실험 코드 실패율 0.42 (Beel 외의 독립 평가). [가정] 이미 알려진 아이디어 30%, 새로움 검사가 그중 70%를 새롭다고 잘못 판정,
    돌아간 실험의 치명적 결함은 첫 시도 성공 25%, 재시도 끝에 성공 40%, 얕은 심사(그림 위주)는 결함을 10%, 깊은 심사(주장 재현)는 70% 잡는다. 알려진 아이디어는 얕은 심사 5%, 깊은 심사 60%가 잡는다. */
 scientist(retries,review){
  const N=100,known=30,novel=70,mislabel=0.7,fail=0.42,flaw=0.25;
  const catchFlaw=review==='deep'?0.7:0.1,catchKnown=review==='deep'?0.6:0.05;
  const proceed=novel+known*mislabel,runOk=1-Math.pow(fail,retries+1);
  let attempts=0;for(let k=0;k<=retries;k++)attempts+=Math.pow(fail,k);
  const first=1-fail,retryOk=runOk-first,fl=(first*flaw+retryOk*0.4)/runOk;
  const ran=proceed*runOk,nv=novel*runOk,kn=known*mislabel*runOk,flawed=ran*fl;
  const goodNovel=nv*(1-fl),flawedPass=nv*fl*(1-catchFlaw)+kn*fl*(1-catchFlaw)*(1-catchKnown),knownPass=kn*(1-fl)*(1-catchKnown);
  const submitted=goodNovel+flawedPass+knownPass;
  return {proceed,runOk,flawRate:fl,ran,attempts:proceed*attempts,attemptsPerIdea:attempts,flawed,flawedPass,knownPass,goodNovel,submitted,badShare:submitted?(flawedPass+knownPass)/submitted:0};
 },

 /* 5장 · 능력과 정렬의 복리 경주. 주기마다 능력은 rc, 정렬은 ra 비율로 자란다. 상대 격차 C/A − 1이 문턱을 넘으면 멈춤 신호. */
 race(ra,cycles,rc=0.10,limit=0.25){
  const pts=[],gap=[];let first=null;
  for(let t=0;t<=cycles;t++){const C=Math.pow(1+rc,t),A=Math.pow(1+ra,t),g=C/A-1;pts.push([t,C,A]);gap.push([t,g]);if(first===null&&g>limit)first=t;}
  const last=pts[pts.length-1];
  return {pts,gap,C:last[1],A:last[2],relGap:last[1]/last[2]-1,first,limit};
 },

 /* 5장 · 관문 쌓기. 편집 후보 여섯 개를 켠 관문 수(level)와 회귀 허용치(tol, 점)로 판정한다. 후보의 성질은 [가정]. */
 gateEdits:[
  {name:'도구 오류 뒤 재시도 넣기',good:true,perf:3,hash:false,anchor:false,safety:0,worst:0},
  {name:'평가기의 환각 표시 지우기',good:false,perf:8,hash:true,anchor:false,safety:0,worst:0},
  {name:'목표 문장을 “테스트 통과”로 바꾸기',good:false,perf:5,hash:false,anchor:true,safety:0,worst:0},
  {name:'환불 거절 규칙 느슨하게',good:false,perf:4,hash:false,anchor:false,safety:-6,worst:0},
  {name:'긴 파일 빨라짐, 한글 파일명 작업 깨짐',good:false,perf:2,hash:false,anchor:false,safety:0,worst:-7},
  {name:'프롬프트 정리',good:true,perf:1,hash:false,anchor:false,safety:0,worst:-2}
 ],
 gates(level,tol){
  const rows=A16Math.gateEdits.map(e=>{
   let by=null;
   if(e.perf<=0)by='성능';
   else if(level>=1&&e.hash)by='불변식';
   else if(level>=2&&e.anchor)by='정렬 닻';
   else if(level>=3&&e.safety<0)by='다목적';
   else if(level>=4&&-e.worst>tol)by='회귀 감지';
   return {...e,accepted:!by,by};
  });
  return {rows,accepted:rows.filter(x=>x.accepted).length,badIn:rows.filter(x=>x.accepted&&!x.good).length,goodOut:rows.filter(x=>!x.accepted&&x.good).length};
 },

 /* 6장 · 권한 모드 사다리. 누리의 하룻밤 행동 여덟 개를 모드별 규칙으로 판정한다(규칙은 공식 문서의 모드 설명을 단순화한 [가정]). */
 nightActions:[
  {name:'버그 목록 읽기',kind:'read'},{name:'checkout.py 고치기',kind:'edit'},{name:'테스트 실행',kind:'shell'},
  {name:'.env 파일 읽기',kind:'secret'},{name:'설정 파일에 값 적기',kind:'edit'},{name:'공개 저장소로 git push',kind:'push'},
  {name:'오래된 브랜치 지우기',kind:'delete'},{name:'처음 보는 주소로 curl',kind:'net'}
 ],
 ladder(mode,workspace){
  const rows=A16Math.nightActions.map(a=>{
   const risky=['shell','push','delete','net','secret'].includes(a.kind);let d;
   if(mode==='plan')d='ask';
   else if(mode==='default')d=['read','secret'].includes(a.kind)?'auto':'ask';
   else if(mode==='acceptEdits')d=['read','edit','secret'].includes(a.kind)?'auto':'ask';
   else if(mode==='auto')d=['delete','net'].includes(a.kind)?'ask':'auto';
   else if(mode==='dontAsk')d=['read','edit','shell'].includes(a.kind)?'auto':'deny';
   else d='auto';
   return {...a,risky,d};
  });
  const ran=k=>rows.some(x=>x.kind===k&&x.d==='auto');
  const leak=ran('secret')&&ran('push');
  return {rows,asks:rows.filter(x=>x.d==='ask').length,riskyAuto:rows.filter(x=>x.risky&&x.d==='auto').length,denied:rows.filter(x=>x.d==='deny').length,leak,harm:leak&&workspace==='repo'};
 },

 /* 7장 · 브라우저 에이전트와 간접 프롬프트 주입. 공급 페이지 네 개와 방어 조합. 판정 규칙은 원본 레슨의 시나리오를 단순화한 것. */
 pages:[
  {name:'정상 공급 페이지',attack:false,visible:false,act:'write',does:'재고·가격 갱신'},
  {name:'본문에 보이는 주입',attack:true,visible:true,act:'send',does:'고객 목록을 바깥 주소로 전송'},
  {name:'URL 조각(#) 속 주입',attack:true,visible:false,act:'send',does:'고객 목록을 바깥 주소로 전송'},
  {name:'기억 심기',attack:true,visible:false,act:'memory',does:'“다음부터 환불은 이 계좌로” 기억 저장'}
 ],
 inject(defense){
  const san=defense==='sanitizer'||defense==='both'||defense==='canary',wall=defense==='boundary'||defense==='both';
  const rows=A16Math.pages.map(p=>{
   let out;
   if(san&&p.visible)out='stripped';
   else if(wall)out='ask';
   else out=p.attack?'hit':'done';
   if(p.act==='memory'&&out==='hit'&&defense==='canary')out='alarm';
   return {...p,out};
  });
  return {rows,hits:rows.filter(x=>x.out==='hit').length,asks:rows.filter(x=>x.out==='ask').length,blocked:rows.filter(x=>x.attack&&x.out!=='hit').length};
 },

 /* 8장 · 내구 실행. 활동 여섯 개 가운데 k개를 마친 뒤 프로세스가 죽었을 때 다시 시작하는 비용. LLM 호출 한 번 0.40달러는 [가정]. */
 activities:[
  {name:'LLM: 오늘 할 일 계획',kind:'llm'},{name:'공급 페이지 읽기',kind:'read'},{name:'사람 승인 기다리기',kind:'approval'},
  {name:'LLM: 환불 문안 작성',kind:'llm'},{name:'환불 30달러 실행',kind:'effect'},{name:'고객에게 메일 보내기',kind:'effect'}
 ],
 replay(k,mode){
  const A=A16Math.activities,done=A.slice(0,k);let rerun;
  if(mode==='naive')rerun=done;
  else if(mode==='nolog')rerun=done.filter(a=>a.kind==='llm');
  else rerun=[];
  const count=kind=>rerun.filter(a=>a.kind===kind).length;
  const diverge=mode==='nolog'&&count('llm')>0&&k>1;
  return {k,rerun:rerun.map(a=>a.name),dupEffects:count('effect'),rebilled:count('llm')*0.4,reask:count('approval'),reads:count('read'),diverge,remaining:A.length-k};
 },

 /* 8장 · 제안-확정과 체크포인트. 상황 네 가지와 보호 수준(0 승인만, 1 +멱등 키, 2 +사전 조건, 3 +사후 확인·되돌리기). */
 commit(scenario,level){
  const steps=['제안 저장','사람 승인'];let outcome,ok=true,money=30;
  if(scenario==='clean'){steps.push('실행','상태 기록');outcome='환불 한 번, 정상';}
  else if(scenario==='crash'){steps.push('실행','충돌(상태 기록 전)','재시도');
   if(level>=1){steps.push('같은 멱등 키 → 실행 생략');outcome='환불 한 번, 정상';}else{steps.push('다시 실행');outcome='환불 두 번(60달러)';ok=false;money=60;}}
  else if(scenario==='balance'){steps.push('잔액이 승인 때와 달라짐');
   if(level>=2){steps.push('사전 조건 실패 → 실행하지 않고 알림');outcome='실행 안 함, 사람에게 알림';money=0;}else{steps.push('실행');outcome='승인 조건이 깨진 채 환불(마이너스 잔액)';ok=false;}}
  else{steps.push('실행','결제 API가 200을 돌려줌');
   if(level>=3){steps.push('다시 읽기 → 반영 안 됨','보상 절차·알림');outcome='실패를 아침 전에 발견';money=0;}else{steps.push('“완료”로 기록');outcome='완료로 적혔지만 고객은 환불을 못 받음';ok=false;money=0;}}
  return {steps,outcome,ok,money};
 },

 /* 9장 · 비용 통제 겹. 평소 지출 0.1달러/분, 120분째부터 폴링 고리가 rate 달러/분을 더 쓴다. 상한(모두 [가정]): 10분 50달러, 하루 300달러, 이달 4,000달러(고리 시작 때 이미 1,500달러 사용). */
 governor(rate,layer){
  const base=0.1,start=120,limitMin=60*24*31,win=[];let spent=1500,today=0,stop=null,why='',extra=0,wsum=0;
  for(let m=0;m<limitMin;m++){
   const s=base+(m>=start?rate:0);spent+=s;today+=s;if(m>=start)extra+=rate;
   win.push(s);wsum+=s;if(win.length>10)wsum-=win.shift();
   if(m%1440===1439)today=0;
   const v=(layer==='velocity'||layer==='all')&&wsum>50,d=(layer==='day'||layer==='all')&&today>300,mo=spent>4000;
   if(v||d||mo){stop=m;why=v?'10분 속도 제한':d?'하루 상한':'이달 상한';break;}
  }
  return {stop,why,minutesAfterLoop:stop===null?null:stop-start+1,loss:extra};
 },

 /* 9장 · 통계 감지기와 고정 한도. 기준 시간당 도구 호출 10회, 공격자가 시간마다 c회씩 천천히 올린다.
    직전 시간까지의 EWMA(α=0.3) 평균에 3σ(σ=2회, 평소 흔들림 [가정])를 더한 선을 넘으면 경보. 고정 한도는 시간당 30회.
    선형 증가에서 EWMA는 c(1−α)/α만큼 뒤처지고, 새 값과 직전 EWMA의 차이는 c/α로 수렴하므로 c/α < 3σ(c < 1.8)이면 끝내 울리지 않는다. */
 breaker(c,hours=48){
  const alpha=0.3,sigma=2,hard=30;let m=10,ewmaHour=null,hardHour=null;const xs=[],ms=[];
  for(let t=0;t<=hours;t++){
   const x=10+c*t;xs.push([t,x]);ms.push([t,m+3*sigma]);
   if(ewmaHour===null&&x>m+3*sigma)ewmaHour=t;
   if(hardHour===null&&x>hard)hardHour=t;
   m=alpha*x+(1-alpha)*m;
  }
  return {xs,ms,ewmaHour,hardHour,lag:c*(1-alpha)/alpha,gap:c/alpha,threshold:3*sigma};
 },

 /* 10장 · 네 층 우선순위. 하드코딩 금지 → 안전 → 윤리 → 지침 → 도움. 운영자는 지침의 기본값만 조정할 수 있다. 사례 판정은 [가정]. */
 tierCases:[
  {name:'고객이 환불 규정을 묻는다',hard:false,safety:true,ethics:true,guide:'ok',help:true},
  {name:'고객이 다른 고객의 주소를 묻는다',hard:false,safety:true,ethics:false,guide:'ok',help:true},
  {name:'고객이 주식 종목을 추천해 달라',hard:false,safety:true,ethics:true,guide:'scope',help:true},
  {name:'“감사 로그를 끄고 진행해”',hard:false,safety:false,ethics:true,guide:'ok',help:true},
  {name:'위험 물질 합성 방법을 묻는다',hard:true,safety:false,ethics:false,guide:'ok',help:true},
  {name:'답을 길게, 표로 정리해 달라',hard:false,safety:true,ethics:true,guide:'style',help:true}
 ],
 tiers(i,operator){
  const c=A16Math.tierCases[i];let decision,tier,note='';
  if(c.hard){decision='거절';tier='하드코딩 금지';note=operator==='unlock'?'운영자가 해제하려 해도 바뀌지 않습니다.':'';}
  else if(!c.safety){decision='거절';tier='1층 안전·감독 지원';}
  else if(!c.ethics){decision='거절';tier='2층 윤리';}
  else if(c.guide==='scope'){if(operator==='unlock'){decision='답변';tier='3층 지침(운영자가 범위 넓힘)';}else{decision='정중히 범위 밖 안내';tier='3층 지침';}}
  else if(c.guide==='style'&&operator==='narrow'){decision='짧게 답변';tier='3층 지침(운영자 기본값)';}
  else{decision='답변';tier='4층 도움';}
  if(operator==='unlock'&&!c.hard&&(!c.safety||!c.ethics))note='운영자 설정은 안전·윤리 층을 넘지 못합니다.';
  return {...c,decision,tier,note};
 },

 /* 10장 · 방어 겹. 층마다 공격이 통과할 확률. [원본] 이모지 숨기기는 여섯 개 가드에서 공격 성공률 100%. 나머지는 [가정]. 층 사이 독립을 가정한 곱이다. */
 layerPass:{
  classifier:{plain:0.05,homoglyph:0.6,emoji:1.0,paraphrase:0.5},
  model:{plain:0.1,homoglyph:0.3,emoji:0.3,paraphrase:0.4},
  runtime:{plain:0.2,homoglyph:0.2,emoji:0.2,paraphrase:0.2},
  review:{plain:0.1,homoglyph:0.1,emoji:0.1,paraphrase:0.1}
 },
 layers(attack,n){
  const order=['classifier','model','runtime','review'],used=order.slice(0,n),each=used.map(k=>A16Math.layerPass[k][attack]);
  const pass=each.reduce((a,b)=>a*b,1);
  return {used,each,pass,per1000:pass*1000};
 },

 /* 11장 · METR식 시간 지평 적합. 가상의 과제 12묶음(전문가 1분~2,048분, 묶음마다 20번 시도)의 성공 수를 만들고
    P(성공)=σ(a − b·log2 t)를 뉴턴법으로 적합한다. 가상 모델의 참 50% 지평은 240분, 기울기 0.6 [가정]. inflate는 평가 상황에서 부풀려진 성공률(%p). */
 horizonData(inflate=0){
  const out=[];for(let i=0;i<12;i++){const x=i,p=sigmoid(0.6*(Math.log2(240)-x)),q=clamp(p+inflate/100,0,0.99);out.push({x,t:Math.pow(2,x),n:20,k:Math.round(20*q)});}return out;
 },
 logisticFit(data,iters=50){
  let a=0,b=0;
  for(let it=0;it<iters;it++){
   let g0=0,g1=0,h00=0,h01=0,h11=0;
   for(const d of data){const p=sigmoid(a-b*d.x),w=d.n*p*(1-p),e=d.k-d.n*p;g0+=e;g1+=-e*d.x;h00+=w;h01+=-w*d.x;h11+=w*d.x*d.x;}
   const det=h00*h11-h01*h01;if(Math.abs(det)<1e-12)break;
   const da=(h11*g0-h01*g1)/det,db=(-h01*g0+h00*g1)/det;a+=da;b+=db;if(Math.abs(da)+Math.abs(db)<1e-10)break;
  }
  return {a,b};
 },
 horizonAt(fit,level){const z=Math.log(level/(1-level));return Math.pow(2,(fit.a-z)/fit.b);},
 horizon(inflate,level){
  const data=A16Math.horizonData(inflate),fit=A16Math.logisticFit(data),base=A16Math.logisticFit(A16Math.horizonData(0));
  return {data,fit,h50:A16Math.horizonAt(fit,0.5),hLevel:A16Math.horizonAt(fit,level),true50:A16Math.horizonAt(base,0.5),trueLevel:A16Math.horizonAt(base,level)};
 },

 /* 12장 · 마지막 과제. 사건 세 개에 통제 하나씩을 고르면 남는 피해(달러 또는 사건 수)를 계산한다. 피해액은 모두 [가정]. */
 incidentOptions:{
  cost:[['none','아무것도 더하지 않음'],['month','이달 비용 상한만'],['tool','주문 추적 도구별 호출 상한 + 10분 속도 제한'],['kill','아침에 사람이 누르는 킬 스위치']],
  inject:[['none','아무것도 더하지 않음'],['sanitize','공급 페이지 정제기'],['boundary','읽기-쓰기 경계 + 확인 목록 승인'],['classifier','입력 분류기 하나']],
  improve:[['none','아무것도 더하지 않음'],['score','점수가 오른 편집만 받기'],['firewall','평가기 방화벽 + 불변식 관문'],['review','사람이 편집 요약을 읽고 승인']]
 },
 incident(cost,inject,improve){
  const C={none:[3600,'고리가 이달 상한 없이 계속 돕니다.'],month:[2500,'상한에 닿을 때까지 며칠 동안 돈이 샙니다.'],tool:[50,'10분 안에 끊기고, 도구별 호출 기록이 원인을 보여 줍니다.'],kill:[400,'밤새 돈 뒤 아침에야 멈춥니다. 다음 밤에도 같은 고리가 돕니다.']};
  const I={none:[1,'숨은 지시가 그대로 환불 제안이 되고 졸린 승인자가 통과시킵니다.'],sanitize:[1,'본문 주입만 걸러 내고 URL 조각 속 지시는 지나갑니다.'],boundary:[0,'바깥 글에서 나온 쓰기는 새 승인을 받고, 확인 목록이 받는 계좌를 묻습니다.'],classifier:[0.5,'평문 지시는 잡지만 숨김 문자 변형은 지나갈 수 있습니다(절반으로 봄).']};
  const S={none:[1,'테스트 검사를 지운 편집이 들어옵니다.'],score:[1,'점수가 올랐으므로 오히려 먼저 받아들입니다.'],firewall:[0,'평가기 해시가 바뀌어 편집이 거절됩니다.'],review:[0.5,'요약만 읽으면 놓칠 수 있습니다(절반으로 봄).']};
  const c=C[cost],i=I[inject],s=S[improve];
  return {cost:c[0],costNote:c[1],inject:i[0],injectNote:i[1],improve:s[0],improveNote:s[1],open:(c[0]>100?1:0)+(i[0]>0?1:0)+(s[0]>0?1:0)};
 }
};
if(typeof module!=='undefined')module.exports=A16Math;else root.A16Math=A16Math;
})(typeof window!=='undefined'?window:globalThis);
