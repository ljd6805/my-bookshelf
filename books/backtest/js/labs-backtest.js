/* 1~4장 실험: 격자 규칙 백테스트 실행 실험(1장)과 백테스트 가정 하나씩 바꾸기 실험(2·3·4장에서 칸을 달리 열기).
   계산은 BMath.yearRun·closeOnlyCell·assumptionRun·adjFills·survivorship·splitReturns·divFactor·stopDays·stopLines·barCell·dayCompare·roundTrip만 쓴다.
   기본값과 비교 예제는 L2와 확인 문제의 입력과 다르게 둔다(책 AGENTS.md). 4장의 “하루 안 경로로 계산” 단추는 다섯 칸이 모두 현실 가정으로 바뀐 뒤에만 열린다.
   어느 결과도 설정을 권하지 않으며 기대 수익률이 아니다(면책 문장). */
(()=>{
'use strict';
const U=BUI,M=BMath,D=BData,S=D.SCENARIO;
const W=x=>`${U.splus(x)}원`,P=x=>U.spct(x,2),p2=x=>U.pct(x,2);
const notCounted=`<ul class="mini-list"><li>하루 안에서 가격이 지나간 순서(막대에는 없음)</li><li>같은 가격에 먼저 줄 선 주문(대기열)</li><li>하린의 주문이 가격에 준 영향</li><li>서버 장애와 주문 오류</li><li>앞으로의 가격</li><li>같은 기간 보유와의 비교(5장)</li></ul>`;
/* 막대 종가 선과 그날 산(●)·판(○) 표시, 아래에 평가 금액 곡선. */
function runCharts(r,R){
 const days=R.bars.slice(r.from,r.to),pts=days.map((b,i)=>[r.from+i,b[3]]),buyDays=new Set(),sellDays=new Set();
 r.fills.forEach(f=>(f[1]==='B'?buyDays:sellDays).add(f[0]));
 const step=Math.max(1,Math.ceil(days.length/120)),pick=set=>[...set].filter((d,k)=>k%step===0);
 const a=U.xy({series:[{name:'새벽전자 종가(가상 기록)',pts,color:'var(--blue)',width:1.6}],points:[...pick(buyDays).map((d,k)=>({name:k?null:'산 날(●, 일부만 표시)',x:d,y:R.bars[d][2],shape:'●',color:'var(--accent)'})),...pick(sellDays).map((d,k)=>({name:k?null:'판 날(○, 일부만 표시)',x:d,y:R.bars[d][1],shape:'○',color:'var(--orange)'}))],
  refs:[{y:S.stop,text:'멈춤 17,500원'}],xlabel:'일째(0일째부터)',ylabel:'원',ytick:v=>U.sfmt(v),h:300,label:`${r.from}~${r.to-1}일째 종가와 체결한 날`});
 const b=U.xy({series:[{name:'평가 금액(종가로 친 현금 + 주식)',pts:r.curve.map((v,i)=>[r.from+i,v/1e4]),color:'var(--accent)'}],refs:[{y:300,text:'시작 300만 원'}],xlabel:'일째',ylabel:'만 원',ytick:v=>U.sfmt(v),h:260,label:`평가 금액이 300만 원에서 ${U.sfmt(r.curve[r.curve.length-1]/1e4,1)}만 원`});
 return a+b;
}
BLabs['grid-run']=el=>{
 U.setup(el,U.select('gy','기간',[['0','1년째(0~249일째)'],['1','2년째(250~499일째)'],['2','3년째(500~749일째, 지어낸 3년째)'],['all','3년 이어서(750거래일)']],'0','12권 하린의 규칙(18,000~22,000원 · 200원 · 20칸 · 칸당 5주, 멈춤 17,500원·다시 시작 18,500원)을 1장의 가정으로 돌립니다')
  +U.group('칸 하나를 종가만으로 백테스트(직접 입력)',U.number('cb','사는 가격(원)',1,1000000,1,19600)+U.number('cs','파는 가격(원)',1,1000000,1,19800)+U.number('cq','주식 수',1,100000,1,3)
   +U.text('cl','종가 기록(쉼표로 나눔)','19700, 19550, 19850, 19750','종가가 사는 가격 이하면 사는 가격에, 파는 가격 이상이면 파는 가격에 체결된다고 봅니다')+U.check('ce','ETF(거래세 없음)',false)),true);
 U.bind(el,()=>{
  const R=M.records(),y=U.value(el,'gy'),r=M.yearRun(y==='all'?'all':+y);
  const b=U.num(el,'cb',true),s=U.num(el,'cs',true),q=U.num(el,'cq',true),cl=U.list(el,'cl',1);
  let cell='';
  if(b===null||s===null||q===null)cell=U.problem('칸 가격과 주식 수','1 이상의 정수로 넣어 주세요.');
  else if(b>=s)cell=U.problem('칸 가격','사는 가격이 파는 가격보다 낮아야 합니다.');
  else if(cl===null)cell=U.problem('종가 기록','쉼표로 나눈 숫자를 넣어 주세요.');
  else{const c=M.closeOnlyCell(b,s,q,cl,U.checked(el,'ce'));cell=`칸 하나(${U.fmt(b)}원에 사서 ${U.fmt(s)}원에 팖, ${U.fmt(q)}주): 왕복 <b>${c.trips}번</b>, ${c.held?`끝에 ${U.fmt(q)}주를 들고 있어 왕복 손익만으로는 끝나지 않습니다(산 금액과 수수료 ${U.fmt(-c.net-0)}원이 들어가 있음)`:`수수료 ${U.fmt(c.fees)}원${U.checked(el,'ce')?'':'과 거래세'}를 뺀 손익 <b>${W(c.net)}</b>`}.`;}
  const text=`${y==='all'?'3년 이어서':['1년째','2년째','3년째(지어낸 3년째)'][+y]}: 왕복 <b>${U.fmt(r.trips)}번</b>, 멈춤 ${r.stops}번, 실현 손익 ${W(r.realized)}, 끝 평가 손익 ${W(r.unreal)}(끝에 ${r.shares}주), 배당 ${U.fmt(r.div)}원, 손익 <b>${W(r.pnl)}</b>, 연 수익률 <b>${p2(r.ann)}</b>.`
   +`<div class="not-counted"><b>이 계산이 쓰지 않은 것</b>${notCounted}</div>${cell}<br>${M.TEXT.notExpected}. ${M.TEXT.year3Note}.${U.kind(['real','scenario'])}`;
  U.result(el,runCharts(r,R),text);
 });
};

})();

/* 2·3·4장: 백테스트 가정 하나씩 바꾸기 실험. 함수 길이 규칙(100줄)에 맞춰 1장 실험과 다른 IIFE로 둔다. */
(()=>{
'use strict';
const U=BUI,M=BMath,D=BData,S=D.SCENARIO;
const W=x=>`${U.splus(x)}원`,P=x=>U.spct(x,2),p2=x=>U.pct(x,2);
/* ── 백테스트 가정 하나씩 바꾸기 실험: 다섯 칸과 결과 표. open: 이 장에서 바꿀 수 있는 칸. ── */
const OPTS={data:[['real','실제 가격 + 배당 현금'],['adj','수정주가']],code:[['bug','오늘 저가를 보고 오늘 시가에 판다'],['fixed','17,500원에 닿은 가격에, 갭이면 시가에 판다']],
 order:[['low','저가 먼저'],['onefill','한 칸 하루 한 번']],rule:[['touch','닿으면 체결'],['through','한 눈금 지나야 체결']],cost:[['off','비용 끔'],['on','수수료·거래세 켬']]};
const NAMES={data:'가격 자료',code:'멈춤 규칙 코드',order:'하루 막대 안의 순서',rule:'체결 규칙',cost:'비용'};
const REAL={data:'real',code:'fixed',order:'onefill',rule:'through',cost:'on'};
function fieldsHtml(start,open){return Object.keys(OPTS).map(k=>{const html=U.select('as-'+k,NAMES[k],OPTS[k],start[k],open.includes(k)?'':'이 장에서는 바꾸지 않는 칸입니다');return open.includes(k)?html:html.replace('<select ','<select disabled ');}).join('');}
function readState(el){const s={};Object.keys(OPTS).forEach(k=>{s[k]=U.value(el,'as-'+k);});return s;}
const toRun=s=>({data:s.data,code:s.code,order:s.order,rule:s.rule,cost:s.cost==='on'});
const label=s=>Object.keys(OPTS).map(k=>OPTS[k].find(o=>o[0]===s[k])[1]).join(' · ');
function historyTable(rows){
 return U.table(['바꾼 뒤의 다섯 칸','연 수익률','손익','왕복','멈춤','수수료·거래세'],rows.map(h=>[h.label+(h.path?' · <b>하루 안 경로</b>':''),`<b>${p2(h.ann)}</b>`,W(h.pnl),`${U.fmt(h.trips)}번`,`${h.stops}번`,`${U.fmt(h.fees)} · ${U.fmt(h.tax)}원`]),'바꿀 때마다 쌓이는 결과 표','cards');
}
function assumptionLab(el,o){
 const hist=[];
 U.setup(el,U.group('다섯 칸(새벽전자 750거래일, 12권 규칙)',fieldsHtml(o.start,o.open))+(o.pathButton?`<div class="buttons"><button type="button" data-path disabled>하루 안 경로로 계산</button></div><p class="caption path-note" role="status">다섯 칸을 모두 현실 가정(실제 가격, 고친 코드, 한 칸 하루 한 번, 한 눈금 지나야, 비용 켬)으로 바꾸면 열립니다.</p>`:'')+(o.extra||''),true);
 const pathBtn=el.querySelector('[data-path]');
 if(pathBtn)pathBtn.onclick=()=>{const r=M.assumptionRun({...toRun(readState(el)),path:true});hist.push({label:label(readState(el)),path:true,...r});el.dispatchEvent(new Event('lab-refresh'));};
 U.bind(el,e=>{
  const s=readState(el),r=M.assumptionRun(toRun(s)),key=label(s);
  if(!hist.length||(e&&e.target&&e.target.id&&e.target.id.startsWith('as-')&&hist[hist.length-1].label!==key))hist.push({label:key,...r});
  if(pathBtn){const ok=Object.keys(REAL).every(k=>s[k]===REAL[k]);pathBtn.disabled=!ok;el.querySelector('.path-note').textContent=ok?'다섯 칸이 모두 현실 가정입니다. 하루 안 경로로 계산할 수 있습니다.':'다섯 칸을 모두 현실 가정(실제 가격, 고친 코드, 한 칸 하루 한 번, 한 눈금 지나야, 비용 켬)으로 바꾸면 열립니다.';}
  const last=hist[hist.length-1],ex=o.part?o.part(el,s,r):{chart:'',text:''};
  const chart=U.columns({labels:hist.slice(-6).map((h,i)=>`${hist.length-Math.min(6,hist.length)+i+1}번째${h.path?'|경로':''}`),values:hist.slice(-6).map(h=>h.ann*100),fmt:v=>U.sfmt(v,2)+'%',tick:v=>U.sfmt(v,0)+'%',mark:i=>i===Math.min(6,hist.length)-1,label:'바꿀 때마다의 연 수익률(최근 여섯 줄)',title:'연 수익률(▲ 지금)',h:240})+historyTable(hist)+ex.chart;
  U.result(el,chart,`지금 다섯 칸: ${label(s)}${last.path?' · 하루 안 경로':''}.<br>연 수익률 <b>${p2(last.ann)}</b>, 손익 ${W(last.pnl)}, 왕복 ${U.fmt(last.trips)}번, 멈춤 ${last.stops}번, 수수료 ${U.fmt(last.fees)}원·거래세 ${U.fmt(last.tax)}원, 배당 ${U.fmt(last.div)}원.${ex.text?'<br>'+ex.text:''}<br>${M.TEXT.notExpected}.${U.kind(['real','scenario'])}${o.timed?` ${U.timed('fee')} ${U.timed('tradeTax')} ${U.RECHECK}`:''}`);
 });
}
/* 2장: 가격 자료 칸, 생존 편향, 분할·배당 계산기. */
function dataPart(el,s){
 const R=M.records(),A=M.adjust(),bar=s.data==='adj'?A.bars[0]:R.bars[0],af=s.data==='adj'?M.adjFills():null,uni=U.value(el,'du'),sv=M.survivorship();
 const list=uni==='alive'?sv.list.filter(x=>x.delisted===null):sv.list,avg=list.reduce((a,x)=>a+x.ret,0)/list.length;
 const sp=[U.num(el,'dp'),U.num(el,'dr',true),U.num(el,'dc')],dv=[U.num(el,'dd'),U.num(el,'dq')];
 let calc='';
 if(sp.some(v=>v===null)||sp[0]<=0||sp[1]<1)calc=U.problem('분할 계산 칸','전날 종가와 분할 뒤 종가는 0보다 크게, 분할 비율은 1 이상의 정수로 넣어 주세요.');
 else{const r=M.splitReturns(sp[0],sp[1],sp[2]);calc=`분할(1주 → ${sp[1]}주) 날: 수정하지 않은 가격의 그날 수익률 <b>${P(r.raw)}</b>, 수정한 가격(전날 종가 ÷ ${sp[1]})의 수익률 <b>${P(r.adjusted)}</b>.`;}
 if(dv.some(v=>v===null)||dv[1]<=0)calc+=` ${U.problem('배당 계산 칸','배당과 전날 종가를 0보다 크게 넣어 주세요.')}`;
 else calc+=` 배당 ${U.fmt(dv[0])}원, 배당락 전날 종가 ${U.fmt(dv[1])}원이면 그 앞 가격에 곱하는 수는 1 − ${U.fmt(dv[0])} ÷ ${U.fmt(dv[1])} = <b>${U.sfmt(M.divFactor(dv[0],dv[1]),6)}</b>입니다.`;
 const chart=U.hbars({groups:[{title:`가상 종목 ${list.length}개의 3년 수익률(${uni==='alive'?'지금 상장된 종목만':'상장폐지 포함'})`,rows:list.map(x=>[x.name.replace('가상 종목 ',''),x.ret*100,`${U.sfmt(x.ret*100,2)}%${x.delisted!==null?' ✗ 폐지':''}`,x.delisted!==null])}],label:'가상 종목 20개의 3년 수익률',left:60});
 return {chart,text:`첫 막대(${s.data==='adj'?'수정주가':'실제 가격'}): 시가 ${U.fmt(bar[0])}원, 고가 ${U.fmt(bar[1])}원, 저가 ${U.fmt(bar[2])}원, 종가 ${U.fmt(bar[3])}원. `+(af?`체결 ${U.fmt(af.total)}건 가운데 <b>${U.fmt(af.never)}건 ✗</b> 거래된 적 없는 가격(그날의 수정 계수로 되돌리면 호가 눈금 위의 정수가 아님).`:'체결 가격은 모두 ✓ 그날 실제로 거래될 수 있던 칸 가격입니다.')
  +`<br>생존 편향: ${uni==='alive'?'지금 상장된 16개':'상장폐지 포함 20개'}의 3년 수익률 평균 <b>${U.sfmt(avg*100,2)}%</b>(가상 종목, 시작가의 40% 이하면 폐지).<br>${calc}`};
}
BLabs['assume-data']=el=>assumptionLab(el,{start:{data:'real',code:'bug',order:'low',rule:'touch',cost:'off'},open:['data'],part:dataPart,
 extra:U.group('빠진 종목(생존 편향)',U.select('du','종목 목록',[['all','상장폐지 포함 20개'],['alive','지금 상장된 종목만']],'all'))
  +U.group('분할·배당 계산기(직접 입력)',U.number('dp','분할 전날 종가(원)',1,10000000,1,30000)+U.number('dr','분할 비율(1주 → 몇 주)',1,100,1,5)+U.number('dc','분할 날 종가(원)',1,10000000,1,6150)+U.number('dd','배당(원)',0,1000000,1,400)+U.number('dq','배당락 전날 종가(원)',1,10000000,1,18780))});
/* 3장: 코드 줄 찾기와 멈춘 날 표, 두 줄의 매도 금액 계산기. */
const LINES=[['for 날 in 기록:','—','—',true],['  if 전날 종가 ≥ 18,500 and 멈춤: 다시 시작','전날 종가','어제 장 마감','고친 줄'],['  if 오늘 종가 ≥ 18,500 and 멈춤: 오늘 시가부터 다시 시작','오늘 종가','오늘 장 마감','버그 줄'],
 ['  if 오늘 저가 ≤ 17,500: 오늘 시가에 모두 판다','오늘 저가','오늘 장 마감','버그 줄'],['  가격이 17,500원에 닿으면 그 가격에(갭이면 시가에) 판다','지금 가격','그 순간','고친 줄'],['  칸 가격에 닿으면 사고판다','지금 가격','그 순간',true]];
function codePart(el,s){
 const sd=M.stopDays(s.code),q=U.num(el,'lq',true),op=U.num(el,'lo',true),lo=U.num(el,'ll',true),cl=U.num(el,'lc',true),st=U.num(el,'ls',true);
 const marks=LINES.slice(1).map((l,i)=>{const pick=U.value(el,'lf-'+i);return pick?(pick==='no')===(l[3]==='버그 줄')?'✓ 맞게 판정':'✗ 다시 보세요':'';});
 const table=U.table(['날','시가','저가','매도 가격','판 주식 수'],sd.stops.map(x=>[`${x.day}일째`,U.fmt(x.open),U.fmt(x.low),`${U.fmt(x.price)}${x.price>S.stop?' ▲':''}`,`${x.shares}주`]),`멈춤 규칙이 걸린 날(${s.code==='bug'?'버그 줄':'고친 줄'})`,'fit');
 const codeT=U.table(['코드 줄','쓰는 값','값이 정해지는 시각','내 판정'],LINES.slice(1).map((l,i)=>[`<code>${U.esc(l[0].trim())}</code>`,l[1],l[2],marks[i]||'—']),'줄마다 그 시각에 알 수 있었나','cards');
 let calc;
 if([q,op,lo,cl,st].some(v=>v===null))calc=U.problem('두 줄 계산 칸','1 이상의 정수로 넣어 주세요.');
 else if(lo>Math.min(op,cl))calc=U.problem('저가','저가는 시가와 종가보다 높을 수 없습니다.');
 else{const r=M.stopLines(q,op,lo,cl,st);calc=r.bug===null?`저가 ${U.fmt(lo)}원이 멈춤 가격 ${U.fmt(st)}원보다 높아 두 줄 모두 팔지 않습니다.`:`버그 줄의 매도 금액 ${U.fmt(r.bug)}원, 고친 줄 ${U.fmt(r.fixed)}원, 차이 <b>${U.fmt(r.diff)}원</b>(버그 줄이 부풀린 금액, 비용 제외).`;}
 return {chart:codeT+table,text:`${s.code==='bug'?'버그 줄':'고친 줄'}: 멈춘 날 ${sd.stops.length}번, 17,500원보다 높게 판 날 ${sd.stops.filter(x=>x.price>S.stop).length}번(▲). 다시 시작한 날 ${sd.resumes.length}번.<br>${calc}`};
}
BLabs['assume-code']=el=>assumptionLab(el,{start:{data:'real',code:'fixed',order:'low',rule:'touch',cost:'off'},open:['code'],part:codePart,
 extra:U.group('줄 찾기: 그 시각에 알 수 있던 값인가요?',LINES.slice(1).map((l,i)=>U.select('lf-'+i,`<code>${U.esc(l[0].trim())}</code>`,[['','고르기'],['yes','✓ 알 수 있음'],['no','✗ 알 수 없음']],'')).join(''))
  +U.group('두 줄의 매도 금액(직접 입력, 갭 없음)',U.number('lq','들고 있는 주식 수',1,100000,1,30)+U.number('lo','시가(원)',1,1000000,1,18390)+U.number('ll','저가(원)',1,1000000,1,17370)+U.number('lc','종가(원)',1,1000000,1,17570)+U.number('ls','멈춤 가격(원)',1,1000000,1,17500))});
/* 4장: 막대 하나의 세 순서, 칸 하나와 막대 하나 계산기, 왕복 비용. */
function fillsPart(el){
 const d=U.num(el,'fd',true),cb=[U.num(el,'fb',true),U.num(el,'fs',true),U.num(el,'fq',true),U.num(el,'fo',true),U.num(el,'fh',true),U.num(el,'fl',true),U.num(el,'fc',true)];
 let chart='',text='';
 if(d===null)text=U.problem('날','0~749일째의 정수로 넣어 주세요.');else{const c=M.dayCompare(d);chart=U.xy({series:[{name:'하루 안 여덟 점(가상 경로)',pts:c.points.map((p,i)=>[i,p]),color:'var(--blue)',marks:[0,1,2,3,4,5,6,7],shape:'●'}],refs:[{y:c.bar[1],text:'고가'},{y:c.bar[2],text:'저가'}],xlabel:'하루 안의 점(0 = 시가, 7 = 종가)',ylabel:'원',ytick:v=>U.sfmt(v),h:250,label:`${d}일째 하루 안 경로`});
  text=`${d}일째 막대(시가 ${U.fmt(c.bar[0])} · 고가 ${U.fmt(c.bar[1])} · 저가 ${U.fmt(c.bar[2])} · 종가 ${U.fmt(c.bar[3])}원), 시가보다 위 칸은 들고 있다고 놓은 하루: 저가 먼저 매수 ${c.low.buys}·매도 ${c.low.sells}, 고가 먼저 매수 ${c.high.buys}·매도 ${c.high.sells}, 하루 안 경로 매수 ${c.path.buys}·매도 ${c.path.sells}(닿으면 체결, 비용 끔, 멈춤 규칙 없음).`;}
 if(cb.some(v=>v===null))text+=`<br>${U.problem('칸과 막대 칸','1 이상의 정수로 넣어 주세요.')}`;
 else if(cb[0]>=cb[1])text+=`<br>${U.problem('칸 가격','사는 가격이 파는 가격보다 낮아야 합니다.')}`;
 else if(!(cb[5]<=Math.min(cb[3],cb[6])&&cb[4]>=Math.max(cb[3],cb[6])))text+=`<br>${U.problem('막대','저가 ≤ 시가·종가 ≤ 고가가 되게 넣어 주세요.')}`;
 else{const bar=[cb[3],cb[4],cb[5],cb[6]],a=M.barCell(cb[0],cb[1],cb[2],bar),b=M.barCell(cb[0],cb[1],cb[2],bar,'onefill');
  const say=x=>`왕복 ${x.trips}번, ${x.held?`${U.fmt(cb[2])}주를 들고 끝나 종가로 친 손익 ${W(x.total)}`:`비용을 뺀 손익 ${W(x.total)}`}(수수료 ${U.fmt(x.fees)}원, 거래세 ${U.fmt(x.tax)}원)`;
  text+=`<br>칸 하나와 막대 하나(비어 있고 매수가 걸린 칸): 저가 먼저 → ${say(a)}. 한 칸 하루 한 번 → ${say(b)}.`;}
 const rt=[U.num(el,'rb',true),U.num(el,'rs',true),U.num(el,'rq',true),U.num(el,'rn',true)];
 if(rt.some(v=>v===null))text+=`<br>${U.problem('왕복 비용 칸','1 이상의 정수로 넣어 주세요.')}`;
 else{const r=M.roundTrip(rt[0],rt[1],rt[2],U.checked(el,'re'));text+=`<br>왕복 한 번: 수수료 ${U.fmt(r.feeBuy)}원·${U.fmt(r.feeSell)}원, 거래세 ${U.fmt(r.tax)}원, 순손익 ${W(r.net)}. ${U.fmt(rt[3])}번이면 비용 합 <b>${U.fmt(r.cost*rt[3])}원</b>, 순손익 합 ${W(r.net*rt[3])}.`;}
 return {chart,text};
}
BLabs['assume-fills']=el=>assumptionLab(el,{start:{data:'real',code:'fixed',order:'low',rule:'touch',cost:'off'},open:['data','code','order','rule','cost'],part:fillsPart,pathButton:true,timed:true,
 extra:U.group('막대 하나의 세 순서',U.number('fd','날(0~749일째)',0,749,1,430,'그날 시가보다 위 칸은 들고 있고 아래 칸은 비어 있다고 놓습니다'))
  +U.group('칸 하나와 막대 하나(직접 입력)',U.number('fb','사는 가격(원)',1,1000000,1,19600)+U.number('fs','파는 가격(원)',1,1000000,1,19800)+U.number('fq','주식 수',1,100000,1,6)+U.number('fo','시가',1,1000000,1,19700)+U.number('fh','고가',1,1000000,1,19850)+U.number('fl','저가',1,1000000,1,19550)+U.number('fc','종가',1,1000000,1,19750))
  +U.group('왕복 비용(직접 입력)',U.number('rb','사는 가격(원)',1,1000000,1,19500)+U.number('rs','파는 가격(원)',1,1000000,1,19700)+U.number('rq','주식 수',1,100000,1,4)+U.number('rn','왕복 횟수',1,1000,1,1)+U.check('re','ETF(거래세 없음)',false))});
})();
