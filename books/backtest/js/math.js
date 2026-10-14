/* 백테스트와 자동 매매 계산. DOM을 만지지 않으며 tests/math.test.cjs가 대표값·경계값·불변 조건을 검사한다.
   「금융과 투자 처음부터」 13권 「백테스트와 자동 매매 · 가정을 고쳐 수익률을 견주고 봇의 멈춤 조건 시험하기」의 계산 원본이다.
   책 사이 코드 의존을 두지 않는다(12권의 격자 장부, 4권의 비용 계산이 있어도 여기서 새로 쓴다). 가상 기록은 js/data.js(BData)에 있다.
   단위와 표기:
   - 가격·금액은 원 정수다. 수수료 = 금액 × 15 ÷ 100,000의 몫, 거래세 = 매도 금액 × 2 ÷ 1,000의 몫(가람200 같은 ETF 매도는 0).
     소수 곱셈으로 버리면 1원이 어긋날 수 있어 정수 몫으로 계산한다.
   - 수익률·변동성·낙폭은 소수(0.0562 = 5.62%)로 돌려주고 화면에서 %의 소수 둘째 자리로 쓴다. 샤프 비율은 소수 셋째 자리.
   - 연 수익률 = (끝 금액 ÷ 시작 금액)^(250 ÷ 거래일 수) − 1. 한 해를 250거래일로 본다(가정).
   - 샤프 비율 = 날마다 수익률의 평균 ÷ 모표준편차 × √250, 무위험 수익률 0 가정. √250 연율화는 날마다 수익률이 서로 독립일 때의 근사(Lo 2002).
   - 반올림은 5에서 올림(round). 부동소수 오차는 1e-9만큼 밀어서 막는다.
   - 시점에 묶인 실제 숫자(⏱)는 셋뿐이고 MARKET 한 곳에 둔다(증권거래세 0.20%, 수수료 0.015%, 호가단위 표).
   - 실제 계산(백테스트 엔진, 수정주가 계수, 지표, 부트스트랩, 설정 402개 시험, 주문 상태 전이, 대사, 멈춤 조건 판정, 체결 짝짓기)과
     미리 정한 가정(가상 기록, 모의 서버의 체결 규칙과 호출 한도, 중복 매수 사건)을 구분한다. 어느 결과도 설정·종목·매매 시점을 권하지 않는다. */
(function(root){
'use strict';
const D=root.BData||(typeof require!=='undefined'?require('./data.js'):null);
const CHECKED='2026-10-14';
/* ⏱ 시점에 묶인 값. 화면마다 값·등급·확인일을 함께 적는다. */
const MARKET={
 tradeTax:{value:0.002,num:2,den:1000,timeSensitive:true,checked:CHECKED,sourceChecked:['2026-10-12','2026-10-13','2026-10-14'],grade:'보도 · 서재 안 재인용',
  label:'보도 기준 · 4권·11권 서재 안 재인용 · 법령 원문 확인 못함',note:'코스피·코스닥 주식 매도 금액의 0.20%(2026-01-01부터, 코스피는 증권거래세 0.05%와 농어촌특별세 0.15%를 합친 값). ETF 매도는 면제. 4권(확인 2026-10-12)·11권(확인 2026-10-13)의 확인값을 은재가 G3에서 2026-01-04·05 보도로 다시 확인(2026-10-14)'},
 fee:{value:0.00015,num:15,den:100000,timeSensitive:true,checked:CHECKED,grade:'가정',label:'가정',note:'살 때·팔 때 각각 0.015%. 4권·10권·12권과 같은 가정이며 증권사 원문은 확인하지 못함'},
 tick:{timeSensitive:true,checked:CHECKED,grade:'서재 안 재인용',label:'4권이 한국거래소 규정 페이지로 확인한 값의 서재 안 재인용',
  table:[[2000,1],[5000,5],[20000,10],[50000,50],[200000,100],[500000,500],[Infinity,1000]]},
 recheck:'세율과 수수료는 바뀌므로 확인일을 보고 다시 확인하세요',
 owners:{G3:'은재',G6:'정민',G7:'한결',fixed:'한결·은재'},nextRecheck:'2027-04-14'
};
/* 연구 결과와 공식 문서의 숫자(등급과 함께). 숫자는 화면에 나올 때 이 등급을 함께 적는다. */
const FACTS={
 emaxGamma:{value:0.5772156649,grade:'학술 원문',source:'Bailey·López de Prado 2014'},
 lo2002:{value:0.65,grade:'학술 초록',source:'Lo 2002',note:'헤지펀드 예에서 월 수익률의 자기상관 때문에 √12로 연율화한 샤프가 최대 65% 과대 평가될 수 있다(초록). 부풀리는 쪽이 양의 자기상관이라는 것은 정의에서 나오는 설명'},
 killSwitch:{grade:'보도',month:'2013년 12월',note:'한국거래소가 회원이 요청하면 사전 등록 알고리즘 계좌의 착오 주문을 취소하고 추가 주문을 막는 장치를 이듬해 2월 도입한다고 보도됨(2013-12-30). 2014-01-07 국내 보도도 도입 계획으로만 적어, 시행 여부는 원문으로 확인하지 못함(은재 G3, 2026-10-14)'}
};
const TEXT={
 disclaimer:'가상의 인물과 기록으로 만든 계산 연습이며, 어떤 설정도 권하지 않습니다',
 notExpected:'어느 단계의 수익률도 기대 수익률이 아니며, 가정을 바꾸면 이만큼 바뀐다는 뜻입니다',
 madeYear3:'지어낸 3년째',
 year3Note:'3년째는 작성 세션이 하락과 낮은 변동성이 오도록 지어낸 구간입니다',
 window60:'봇을 돌린 60일(500~559일째)은 작성 세션이 가격이 곧게 내려가도록 지어낸 구간이고, 시장 경로의 몫 −64,557원은 그 설정에서 나옵니다',
 noVerdict:'석 달의 손익으로 설정의 좋고 나쁨을 판정할 수 없습니다',
 noAuto:'이 책은 자동 매매를 권하지 않습니다. 수동으로 낸 주문에도 같은 대사가 필요합니다',
 mockOnly:'책 안의 가상 모의 서버이며 실제 증권사에 연결하지 않습니다. 키 칸에는 가상 키만 들어갑니다',
 brokerDocs:'증권사마다 키·토큰·호출 한도가 다르고 공식 문서에서 확인합니다'
};
const ASSUME={capital:3000000,perYear:250,div:400,v12:D.SCENARIO.v12,stop:17500,resume:18500,rate:2,bootSeed:2026,mcSeed:2028};
const round=(x,d=0)=>{const f=Math.pow(10,d);return Math.round(x*f+(x>=0?1e-9:-1e-9))/f;};
const fee=a=>Math.floor(a*MARKET.fee.num/MARKET.fee.den);
const tax=(a,etf=false)=>etf?0:Math.floor(a*MARKET.tradeTax.num/MARKET.tradeTax.den);
const tick=D.tick,sum=a=>a.reduce((s,x)=>s+x,0),mean=a=>sum(a)/a.length;
function pstdev(a){const m=mean(a);return Math.sqrt(sum(a.map(x=>(x-m)*(x-m)))/a.length);}
function median(a){const s=[...a].sort((x,y)=>x-y),n=s.length;return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2;}
function wonText(won){const w=Math.round(Math.abs(won)),man=Math.floor(w/1e4),rest=w%1e4,sign=won<0?'−':'';
 return sign+(man?man.toLocaleString('en-US')+'만'+(rest?' ':''):'')+(rest||!man?rest.toLocaleString('en-US'):'')+'원';}
const levels=(low,high,step)=>{const out=[];for(let p=low;p<=high;p+=step)out.push(p);return out;};
const V12=levels(18000,22000,200);

/* ── 격자 장부. 칸 i는 L[i]에 사서 L[i+1]에 판다. 칸마다 한 묶음(qty주)만 든다. ── */
function newBook(L,q,capital,cost,through){
 const n=L.length-1;
 return {L,q,cash:capital,cost,through,lots:new Array(n).fill(null),armed:new Array(n).fill(false),fills:[],realized:0,fees:0,taxes:0,divs:0,paused:false,stops:0,trips:0,today:null,skipped:0,stopLog:[],resumeLog:[]};
}
function bookBuy(b,i,p,t){const a=p*b.q,f=b.cost?fee(a):0;b.armed[i]=false;if(a+f>b.cash){b.skipped++;return;}b.cash-=a+f;b.fees+=f;b.lots[i]=a+f;b.fills.push([t,'B',i,p]);}
function bookSell(b,i,p,t,how){const a=p*b.q,f=b.cost?fee(a):0,x=b.cost?tax(a):0;b.cash+=a-f-x;b.fees+=f;b.taxes+=x;b.realized+=a-f-x-b.lots[i];b.lots[i]=null;b.fills.push([t,'S',i,p]);if(how==='limit')b.trips++;}
function used(b,i){if(b.today===null)return false;if(b.today.has(i))return true;b.today.add(i);return false;}
const shares=b=>b.lots.reduce((s,l)=>s+(l?1:0),0)*b.q;
/* 가격이 a에서 c로 움직일 때의 체결. 갭(전날 종가 → 시가)이면 지정가보다 유리한 시가에 체결한다. */
function move(b,a,c,t,gap){
 if(b.paused||a===c)return;
 const n=b.lots.length,L=b.L;
 if(c<a){for(let i=n-1;i>=0;i--){const hit=b.through?c<L[i]:c<=L[i];if(b.lots[i]===null&&b.armed[i]&&hit&&!used(b,i))bookBuy(b,i,gap?Math.min(L[i],c):L[i],t);}}
 else{for(let i=0;i<n;i++){const U=L[i+1],hit=b.through?c>U:c>=U;if(b.lots[i]!==null&&hit&&!used(b,i))bookSell(b,i,gap?Math.max(U,c):U,t,'limit');}}
 for(let i=0;i<n;i++)if(b.lots[i]===null&&c>L[i])b.armed[i]=true;
}
function liquidate(b,p,t,why='price'){const held=shares(b);for(let i=0;i<b.lots.length;i++)if(b.lots[i]!==null)bookSell(b,i,p,t,'stop');b.paused=true;b.stops++;b.stopLog.push({day:t,price:p,shares:held,why});}
/* 하루 막대 안의 점 순서. optimistic·onefill: 시가 → 저가 → 고가 → 종가(저가 먼저), pessimistic: 고가 먼저, path: 하루 여덟 점. */
function points(row,mode){if(mode==='optimistic'||mode==='onefill')return [row[0],row[2],row[1],row[3]];if(mode==='pessimistic')return [row[0],row[1],row[2],row[3]];return row;}
/* 멈춤 뒤 다시 시작: 전날 종가가 resume 이상이면 오늘 시가부터. lookahead면 오늘 종가를 보고 오늘 시가부터(미래 정보 버그). */
function dayStart(b,o,pts,prev,levelsArr,t){
 if(prev===null)for(let i=0;i<b.lots.length;i++)if(pts[0]>levelsArr[i])b.armed[i]=true;
 if(b.paused&&o.resume!=null){const laR=o.laResume!=null?o.laResume:!!o.lookahead,ref=laR?pts[pts.length-1]:(prev!==null?prev:pts[0]);if(ref>=o.resume){b.paused=false;b.resumeLog.push({day:t,ref,lookahead:laR});for(let i=0;i<b.lots.length;i++)b.armed[i]=pts[0]>levelsArr[i];}}
}
/* 백테스트 한 번. days: mode가 path면 하루 여덟 점 목록, 아니면 막대 [시가, 고가, 저가, 종가]. 돌려주는 curve는 날마다 종가로 친 평가 금액. */
function run(days,o={}){
 const L=o.levels||V12,q=o.qty||5,cap=o.capital||ASSUME.capital,mode=o.mode||'path',ex=o.ex||[],stop=o.stop==null?null:o.stop;
 const b=newBook(L,q,cap,o.cost!==false,!!o.through),curve=[],divCash=o.divCash!==false,start=o.start||0;let prev=o.prev!=null?o.prev:null;
 if(o.armed)b.armed.fill(true);
 for(let d=0;d<days.length;d++){
  const t=start+d,pts=points(days[d],mode);
  b.today=mode==='onefill'?new Set():null;
  if(ex.includes(d)&&divCash){const dv=shares(b)*ASSUME.div;b.cash+=dv;b.divs+=dv;}
  dayStart(b,o,pts,prev,L,t);
  if((o.laStop!=null?o.laStop:o.lookahead)&&stop!==null&&!b.paused&&Math.min(...pts)<=stop)liquidate(b,pts[0],t,'lookahead');
  const seq=prev!==null?[prev,...pts]:pts;
  for(let k=1;k<seq.length;k++){
   const a=seq[k-1],c=seq[k],gap=prev!==null&&k===1;
   if(stop!==null&&!b.paused&&c<=stop&&stop<a){move(b,a,gap?c:Math.max(c,stop),t,gap);liquidate(b,gap?c:stop,t);}
   else move(b,a,c,t,gap);
  }
  prev=pts[pts.length-1];curve.push(b.cash+shares(b)*prev);
 }
 b.shares=shares(b);b.lastClose=prev;
 return {book:b,curve};
}
const ann=(curve,cap=ASSUME.capital,per=ASSUME.perYear)=>Math.pow(curve[curve.length-1]/cap,per/curve.length)-1;

/* ── 자료 ── */
const rec=()=>D.records();
/* 수정주가: 배당락일 전날까지의 가격에 (1 − 400 ÷ 배당락 전날 종가)를 곱해 거꾸로 맞춘다(원 단위 반올림, 호가 눈금이 아님). */
function adjust(bars=rec().bars,ex=D.EX,div=ASSUME.div){
 const f=new Array(bars.length).fill(1);let acc=1;
 for(let d=bars.length-1;d>=0;d--){f[d]=acc;if(ex.includes(d))acc*=(1-div/bars[d-1][3]);}
 return {bars:bars.map((b,d)=>b.map(x=>Math.round(x*f[d]))),factors:f};
}
/* 분할과 배당의 수정 계수(2장 L2·확인용 계산기). ratio: 1주를 몇 주로 나누는지. */
/* 수정주가로 돌린 체결 가운데 실제로 거래된 적 없는 가격의 수. 그날의 수정 계수로 되돌린 값이 호가 눈금 위의 정수가 아니면 거래된 적 없는 가격이다. */
function adjFills(){
 const A=adjust(),R=rec(),{book}=run(A.bars,{mode:'optimistic',cost:false,lookahead:true,divCash:false,ex:D.EX,...ST});
 let never=0;const rows=book.fills.map(([t,side,i,p])=>{const real=p/A.factors[t],ok=Math.abs(real-Math.round(real))<1e-6&&Math.round(real)%tick(Math.round(real))===0;if(!ok)never++;return {day:t,side,price:p,real,ok,factor:A.factors[t]};});
 return {total:rows.length,never,rows};
}
function splitReturns(prevClose,ratio,close){return {raw:close/prevClose-1,adjusted:close/(prevClose/ratio)-1};}
function divFactor(div,prevClose){return 1-div/prevClose;}
function dataStats(){
 const B=rec().bars,cl=B.map(b=>b[3]),r=cl.slice(1).map((c,i)=>c/cl[i]-1);
 return {days:B.length,firstBar:B[0],lastClose:cl[cl.length-1],minClose:Math.min(...cl),maxClose:Math.max(...cl),minLow:Math.min(...B.map(b=>b[2])),dailySd:pstdev(r),
  ex:D.EX.map(d=>({day:d,prevClose:B[d-1][3],open:B[d][0]}))};
}
/* 생존 편향: 전체 평균과 남은 종목 평균(2장). */
function survivorship(list=rec().universe){
 const alive=list.filter(x=>x.delisted===null);
 return {n:list.length,delisted:list.length-alive.length,meanAll:mean(list.map(x=>x.ret)),meanAlive:mean(alive.map(x=>x.ret)),bias:mean(alive.map(x=>x.ret))-mean(list.map(x=>x.ret)),list};
}
function survivorSimple(nUp,up,nDown,down){const all=(nUp*up+nDown*down)/(nUp+nDown);return {alive:up,all,bias:up-all};}

/* ── 가정 하나씩 바꾸기(2~4장) ── */
const ST={stop:ASSUME.stop,resume:ASSUME.resume};
const STEP_DEF=[
 ['A0','수정주가 · 저가 먼저 · 닿으면 · 비용 끔 · 미래 정보 줄 그대로',{adj:true,mode:'optimistic',cost:false,lookahead:true,divCash:false}],
 ['A1','실제 가격 + 배당 현금(1장의 첫 백테스트)',{mode:'optimistic',cost:false,lookahead:true}],
 ['A2','미래 정보 줄 고침',{mode:'optimistic',cost:false}],
 ['A3','한 칸 하루 한 번',{mode:'onefill',cost:false}],
 ['A4','한 눈금 지나야 체결',{mode:'onefill',cost:false,through:true}],
 ['A5','수수료·거래세 켬',{mode:'onefill',cost:true,through:true}],
 ['T','하루 안 경로로 계산',{path:true,mode:'path',cost:true,through:true}]
];
/* 다섯 칸의 선택으로 한 번 돌린다. s = {data:'real'|'adj', code:'bug'|'fixed', order:'low'|'onefill', rule:'touch'|'through', cost:false|true, path:false}. */
function assumptionRun(s){
 const R=rec(),days=s.path?R.path:(s.data==='adj'?adjust().bars:R.bars),mode=s.path?'path':(s.order==='onefill'?'onefill':'optimistic');
 const {book,curve}=run(days,{mode,cost:!!s.cost,through:s.rule==='through',laStop:s.code==='bug',laResume:(s.resume||s.code)==='bug',ex:D.EX,divCash:s.data!=='adj',...ST});
 return {ann:ann(curve),pnl:curve[curve.length-1]-ASSUME.capital,trips:book.trips,stops:book.stops,fees:book.fees,tax:book.taxes,div:book.divs,curve,book};
}
const STEP_STATE={A0:{data:'adj',code:'bug',order:'low',rule:'touch',cost:false},A1:{data:'real',code:'bug',order:'low',rule:'touch',cost:false},A2:{data:'real',code:'fixed',order:'low',rule:'touch',cost:false},
 A3:{data:'real',code:'fixed',order:'onefill',rule:'touch',cost:false},A4:{data:'real',code:'fixed',order:'onefill',rule:'through',cost:false},A5:{data:'real',code:'fixed',order:'onefill',rule:'through',cost:true},
 T:{data:'real',code:'fixed',order:'onefill',rule:'through',cost:true,path:true}};
const memo={};
function step(key){if(!memo[key])memo[key]=assumptionRun(STEP_STATE[key]);return memo[key];}
function waterfall(){return STEP_DEF.map(([key,label])=>({key,label,...step(key)}));}
/* 1장 실험: 12권 규칙을 고른 해에 돌린 첫 백테스트(A1의 가정). */
function yearRun(y){
 const R=rec(),[a,b]=y==='all'?[0,750]:D.SCENARIO.years[y],ex=D.EX.filter(d=>d>=a&&d<b).map(d=>d-a);
 const {book,curve}=run(R.bars.slice(a,b),{mode:'optimistic',cost:false,lookahead:true,ex,start:a,...ST});
 const unreal=book.lots.reduce((s,l)=>s+(l?book.q*book.lastClose-l:0),0);
 return {from:a,to:b,ann:ann(curve),pnl:curve[curve.length-1]-ASSUME.capital,trips:book.trips,stops:book.stops,realized:book.realized,unreal,div:book.divs,fills:book.fills,curve,shares:book.shares};
}
/* 1장 L2 계산기: 종가만 있는 기록에서 칸 하나(지정가 체결 가정). etf면 거래세 0. */
function closeOnlyCell(buy,sell,qty,closes,etf=true){
 let held=false,trips=0,net=0,fees=0;const log=[];
 for(const c of closes){
  if(!held&&c<=buy){held=true;const f=fee(buy*qty);fees+=f;net-=buy*qty+f;log.push(['B',buy,c]);}
  else if(held&&c>=sell){held=false;trips++;const a=sell*qty,f=fee(a),x=tax(a,etf);fees+=f;net+=a-f-x;log.push(['S',sell,c]);}
 }
 return {trips,net:held?null:net,held,fees,log};
}
/* 1장 확인용: 연 수익률 환산. */
const annualize=(start,end,days,per=250)=>Math.pow(end/start,per/days)-1;
/* 3장: 코드 두 줄의 매도 금액 비교(L2 계산기). */
function stopLines(qty,open,low,close,stop){const bug=low<=stop?open*qty:null,fixed=low<=stop?(open<=stop?open:stop)*qty:null;return {bug,fixed,diff:bug===null?0:bug-fixed};}
/* 3장 실험 표: 멈춤 규칙이 걸린 날과 매도 가격, 다시 시작한 날(버그 줄/고친 줄). */
function stopDays(code,resume=code){
 const R=rec(),{book,curve}=run(R.bars,{mode:'optimistic',cost:false,laStop:code==='bug',laResume:resume==='bug',ex:D.EX,...ST});
 return {stops:book.stopLog.map(s=>({...s,low:R.bars[s.day][2],open:R.bars[s.day][0],close:R.bars[s.day][3]})),resumes:book.resumeLog,ann:ann(curve),pnl:curve[curve.length-1]-ASSUME.capital};
}
/* 4장: 칸 하나와 막대 하나(L2 계산기). 비어 있고 매수가 걸린 칸에서 시작한다(전날 종가는 매수 가격 바로 위로 두어, 시가가 매수 가격 이하로 열리면 걸린 주문이 시가에 체결된다). 끝 손익 = 실현 손익 + 종가로 친 평가 손익. */
function barCell(buy,sell,qty,bar,mode='optimistic',through=false){
 const {book}=run([bar],{levels:[buy,sell],qty,mode,cost:true,through,capital:1e12,armed:true,prev:buy+1});
 const held=book.lots[0],unreal=held?qty*bar[3]-held:0;
 return {trips:book.trips,realized:book.realized,held:!!held,unreal,total:book.realized+unreal,fees:book.fees,tax:book.taxes,fills:book.fills.map(f=>[f[1],f[3]])};
}
/* 4장 막대 하나 보기: d일째 막대에서 시가보다 위 칸은 들고 있고 아래 칸은 비어 매수가 걸려 있다고 놓고, 세 순서로 하루만 돌린다(닿으면 체결, 비용 끔). */
function dayCompare(d){
 const R=rec(),bar=R.bars[d],path=R.path[d],L=V12,q=5,out={};
 for(const [key,pts] of [['low',[bar[0],bar[2],bar[1],bar[3]]],['high',[bar[0],bar[1],bar[2],bar[3]]],['path',path]]){
  const b=newBook(L,q,1e12,false,false);for(let i=0;i<b.lots.length;i++){if(L[i+1]<=bar[0])b.lots[i]=L[i]*q;else if(L[i]<bar[0])b.armed[i]=true;}
  for(let k=1;k<pts.length;k++)move(b,pts[k-1],pts[k],d,false);
  out[key]={buys:b.fills.filter(f=>f[1]==='B').length,sells:b.fills.filter(f=>f[1]==='S').length,realized:b.realized,fills:b.fills.map(f=>[f[1],f[3]])};
 }
 return {day:d,bar,points:path,...out};
}
/* 칸 한 번 왕복의 비용과 순손익(4장 확인·전이용 계산기). */
function roundTrip(buy,sell,qty,etf=false){const fb=fee(buy*qty),fs=fee(sell*qty),x=tax(sell*qty,etf);return {gross:(sell-buy)*qty,feeBuy:fb,feeSell:fs,tax:x,cost:fb+fs+x,net:(sell-buy)*qty-fb-fs-x};}

/* ── 5장: 지표와 부트스트랩 ── */
function returns(curve,cap=ASSUME.capital){const eq=[cap,...curve];return eq.slice(1).map((e,i)=>e/eq[i]-1);}
/* 최대 낙폭: 평가 금액 ÷ 그때까지의 고점 − 1의 가장 작은 값. peak·trough는 시작 금액을 0번으로 센 날 번호. */
function drawdown(eq){let peak=eq[0],pk=0,mdd=0,p=0,tr=0;eq.forEach((e,i)=>{if(e>peak){peak=e;pk=i;}if(e/peak-1<mdd){mdd=e/peak-1;p=pk;tr=i;}});return {mdd,peak:p,trough:tr};}
function metrics(curve,cap=ASSUME.capital,per=ASSUME.perYear){
 const r=returns(curve,cap),m=mean(r),sd=pstdev(r),dd=drawdown([cap,...curve]);
 return {ann:ann(curve,cap,per),vol:sd*Math.sqrt(per),sharpe:m/sd*Math.sqrt(per),mdd:dd.mdd,peakDay:dd.peak,troughDay:dd.trough,meanDaily:m,r};
}
/* 날마다 수익률 r을 복원 추출해 같은 길이의 기간을 n번 다시 만들고 연 수익률을 모은다. 95% 구간은 정렬한 값의 2.5%·97.5% 자리. */
function bootstrap(r,n=10000,seed=ASSUME.bootSeed,per=ASSUME.perYear){
 const rnd=D.mulberry32(seed),T=r.length,out=new Float64Array(n);
 for(let k=0;k<n;k++){let g=1;for(let j=0;j<T;j++)g*=1+r[Math.floor(rnd()*T)];out[k]=Math.pow(g,per/T)-1;}
 const s=Array.from(out).sort((a,b)=>a-b);let neg=0;for(const x of s)if(x<0)neg++;
 return {lo:s[Math.floor(0.025*n)],hi:s[Math.floor(0.975*n)-1],pNeg:neg/n,median:median(s),values:s,n};
}
function yearSharpe(r,per=ASSUME.perYear){return [0,250,500].map(k=>{const a=r.slice(k,k+250);return mean(a)/pstdev(a)*Math.sqrt(per);});}
function autocorr1(r){const m=mean(r);let a=0,b=0;for(let i=0;i<r.length;i++){b+=(r[i]-m)*(r[i]-m);if(i)a+=(r[i]-m)*(r[i-1]-m);}return a/b;}
/* 같은 기간 보유: 첫날 시가에 수수료 포함 300만 원 안에서 산 만큼 들고 배당 현금을 받는다(파는 비용 없음, 세전). */
function hold(bars=rec().bars,cap=ASSUME.capital){
 const p=bars[0][0];let n=Math.floor(cap/p);while(n*p+fee(n*p)>cap)n--;
 let cash=cap-n*p-fee(n*p);const curve=bars.map((b,d)=>{if(D.EX.includes(d))cash+=n*ASSUME.div;return cash+n*b[3];});
 return {shares:n,end:curve[curve.length-1],total:curve[curve.length-1]/cap-1,curve,...metrics(curve,cap)};
}
/* 5장 L2 계산기: 월 수익률 목록의 월 샤프(모표준편차), √12 연율화, 평가 금액 목록의 최대 낙폭. */
function monthly(rets,values){const m=mean(rets),sd=pstdev(rets),s=sd>0?m/sd:NaN;return {mean:m,sd,sharpe:s,annual:s*Math.sqrt(12),mdd:values&&values.length>1?drawdown(values).mdd:null};}
function a5Stats(){
 if(memo.a5)return memo.a5;const c=step('A5').curve,m=metrics(c),bt=bootstrap(m.r);
 memo.a5={...m,boot:bt,years:yearSharpe(m.r),lag1:autocorr1(m.r),hold:hold()};return memo.a5;
}

/* ── 6장: 설정 402개, 표본 안·밖, 기대 최대 샤프, 걷기 전진 ── */
function budget(lv,q){let s=0;for(let i=0;i<lv.length-1;i++)s+=lv[i]*q+fee(lv[i]*q);return s;}
function combos(){
 if(memo.combos)return memo.combos;const G=D.SCENARIO.grid,out=[];
 for(const q of G.qs)for(const step of G.steps)for(const low of G.lows)for(const n of G.ns){
  const lv=levels(low,low+step*n,step);
  if(lv.every(l=>l%tick(l)===0)&&budget(lv,q)<=ASSUME.capital)out.push({q,step,low,n,top:lv[lv.length-1],lv});
 }
 return memo.combos=out;
}
/* 표본 안·밖 평가는 4장의 현실 가정(한 칸 하루 한 번, 한 눈금 지나야, 비용)으로 한다. 가장 아래 칸이 17,500원보다 높을 때만 멈춤 규칙을 쓴다. */
function evalCfg(days,c,ex){const st=c.lv[0]>ASSUME.stop?ST:{};return ann(run(days,{levels:c.lv,qty:c.q,mode:'onefill',cost:true,through:true,ex,...st}).curve);}
function rank(xs){const o=xs.map((_,i)=>i).sort((a,b)=>xs[a]-xs[b]||a-b),r=new Array(xs.length);o.forEach((i,k)=>{r[i]=k;});return r;}
function spearman(a,b){const ra=rank(a),rb=rank(b),n=a.length;let s=0;for(let i=0;i<n;i++)s+=(ra[i]-rb[i])**2;return 1-6*s/(n*(n*n-1));}
const better=(xs,v)=>xs.filter(x=>x>v).length;
const argmax=xs=>xs.reduce((bi,x,i)=>x>xs[bi]?i:bi,0);
/* 설정마다 표본 안(1~2년째)과 표본 밖(3년째) 연 수익률. alt면 3년째를 1·2년째와 같은 성질로 지은 다른 기록(가정). 오래 걸려 한 번만 계산한다. */
function sampleSplit(alt=false){
 const key=alt?'splitAlt':'split';if(memo[key])return memo[key];
 const R=rec(),C=combos(),isd=R.bars.slice(0,500),oos=(alt?R.altBars:R.bars).slice(500);
 const IS=memo.split?memo.split.IS:C.map(c=>evalCfg(isd,c,[240,490]));
 return memo[key]={IS,OOS:C.map(c=>evalCfg(oos,c,[240]))};
}
/* 설정 N개(402개 목록에서 고르게 건너뛰어 고름)의 표본 안 1등과 그 표본 밖 순위·순위 상관. */
function subset(N){const C=combos();if(N>=C.length)return C.map((_,i)=>i);return Array.from({length:N},(_,k)=>Math.floor(k*C.length/N));}
function overfit(N=402,alt=false){
 const S=sampleSplit(alt),idx=subset(N),IS=idx.map(i=>S.IS[i]),OOS=idx.map(i=>S.OOS[i]),b=argmax(IS);
 return {N:idx.length,idx,IS,OOS,best:idx[b],cfg:combos()[idx[b]],isBest:IS[b],oosBest:OOS[b],oosRank:better(OOS,OOS[b])+1,isMedian:median(IS),oosMedian:median(OOS),rho:spearman(IS,OOS)};
}
/* 정규분포의 분위수(Wichura AS241). Python statistics.NormalDist.inv_cdf와 같은 방법. */
function invNorm(p){
 const q=p-0.5;let r,num,den;
 if(Math.abs(q)<=0.425){r=0.180625-q*q;
  num=(((((((2509.0809287301226727*r+33430.575583588128105)*r+67265.770927008700853)*r+45921.953931549871457)*r+13731.693765509461125)*r+1971.5909503065514427)*r+133.14166789178437745)*r+3.387132872796366608);
  den=(((((((5226.495278852545925*r+28729.085735721942674)*r+39307.89580009271061)*r+21213.794301586595867)*r+5394.1960214247511077)*r+687.1870074920579083)*r+42.313330701600911252)*r+1);return q*num/den;}
 r=q<=0?p:1-p;r=Math.sqrt(-Math.log(r));
 if(r<=5){r-=1.6;num=(((((((7.7454501427834140764e-4*r+0.0227238449892691845833)*r+0.24178072517745061177)*r+1.27045825245236838258)*r+3.64784832476320460504)*r+5.7694972214606914055)*r+4.6303378461565452959)*r+1.42343711074968357734);
  den=(((((((1.05075007164441684324e-9*r+5.475938084995344946e-4)*r+0.0151986665636164571966)*r+0.14810397642748007459)*r+0.68976733498510000455)*r+1.6763848301838038494)*r+2.05319162663775882187)*r+1);}
 else{r-=5;num=(((((((2.01033439929228813265e-7*r+2.71155556874348757815e-5)*r+0.0012426609473880784386)*r+0.026532189526576123093)*r+0.29656057182850489123)*r+1.7848265399172913358)*r+5.4637849111641143699)*r+6.6579046435011037772);
  den=(((((((2.04426310338993978564e-15*r+1.4215117583164458887e-7)*r+1.8463183175100546818e-5)*r+7.868691311456132591e-4)*r+0.0148753612908506148525)*r+0.13692988092273580531)*r+0.59983220655588793769)*r+1);}
 const x=num/den;return q<0?-x:x;
}
/* 실력이 0인 설정 N개의 1등 샤프 기대값(Bailey·López de Prado 2014). z는 σ(SR) = 1 기준, sharpe는 T거래일로 잰 연 샤프(σ = √(250/T)). */
function emax(N,T=500,per=ASSUME.perYear){const g=FACTS.emaxGamma.value,z=(1-g)*invNorm(1-1/N)+g*invNorm(1-1/(N*Math.E));return {z,sharpe:z*Math.sqrt(per/T)};}
function emaxSim(Ns=[10,100,402,1000],trials=2000,seed=ASSUME.mcSeed,T=500){const rnd=D.mulberry32(seed),out={};for(const N of Ns){let s=0;for(let k=0;k<trials;k++){let m=-Infinity;for(let j=0;j<N;j++){const g=D.gauss(rnd);if(g>m)m=g;}s+=m;}out[N]=s/trials*Math.sqrt(ASSUME.perYear/T);}return out;}
/* 걷기 전진: 1년으로 402개를 시험해 1등을 고르고 다음 1년에 그 설정만 돌린다(두 번). */
function walkForward(){
 if(memo.wf)return memo.wf;const B=rec().bars,C=combos(),out=[];
 for(const k of [0,1]){
  const tr=B.slice(250*k,250*(k+1)),te=B.slice(250*(k+1),250*(k+2));
  const extr=D.EX.filter(d=>d>=250*k&&d<250*(k+1)).map(d=>d-250*k),exte=D.EX.filter(d=>d>=250*(k+1)&&d<250*(k+2)).map(d=>d-250*(k+1));
  const sc=C.map(c=>evalCfg(tr,c,extr)),b=argmax(sc);
  out.push({trainYear:k+1,trainBest:sc[b],cfg:C[b],test:evalCfg(te,C[b],exte)});
 }
 return memo.wf=out;
}
function isBestDetail(){
 if(memo.isd)return memo.isd;const o=overfit(402),c=o.cfg,{curve}=run(rec().bars.slice(0,500),{levels:c.lv,qty:c.q,mode:'onefill',cost:true,through:true,ex:[240,490]});
 const v12=combos().length&&{is:evalCfg(rec().bars.slice(0,500),{lv:V12,q:5},[240,490]),oos:evalCfg(rec().bars.slice(500),{lv:V12,q:5},[240]),altOos:evalCfg(rec().altBars.slice(500),{lv:V12,q:5},[240])};
 return memo.isd={...o,metrics:metrics(curve),v12};
}
/* 6장 L2 계산기: 설정 몇 개의 표본 안·밖 수익률로 표본 안 1등의 표본 밖 순위와 두 수익률의 차이. */
function rankCheck(IS,OOS){const b=argmax(IS);return {best:b,oosRank:better(OOS,OOS[b])+1,gap:IS[b]-OOS[b]};}

/* ── 7장: 가상 모의 서버의 요청·응답(실제 증권사에 연결하지 않는다) ── */
/* 초당 rate건만 받는 서버에 n건을 차례로 보낼 때 k번째 요청이 나가는 초 구간(0초부터 셈)과 모두 나가는 데 걸리는 시간. */
function schedule(n,rate=ASSUME.rate){const at=Array.from({length:n},(_,k)=>Math.floor(k/rate));return {at,last:n?at[n-1]:0,total:Math.ceil(n/rate)};}
const callsPerDay=(everyMin,places,minutes=1440)=>Math.floor(minutes/everyMin)*places;
/* 주문 요청 목록을 모의 서버에 보낸다. pace: 'paced'(한도에 맞춰 나눠 보냄) | 'burst'(한꺼번에). token: 'ok'|'none'|'expired'.
   응답 코드(가상): OK, RATE_LIMIT(초당 한도 초과), NO_TOKEN, TOKEN_EXPIRED, BAD_TICK(호가 눈금이 아님), BAD_QTY, SAME_ID(같은 요청 ID → 첫 응답을 다시 돌려줌). */
function mockSend(reqs,o={}){
 const rate=o.rate||ASSUME.rate,pace=o.pace||'paced',token=o.token||'ok',seen={},perSec={},log=[];let orderNo=1000,sent=0;
 reqs.forEach((r,k)=>{
  const sec=pace==='burst'?0:Math.floor(sent/rate);let code='OK',no=null;
  if(token!=='ok')code=token==='none'?'NO_TOKEN':'TOKEN_EXPIRED';
  else if(r.rid&&seen[r.rid]){code='SAME_ID';no=seen[r.rid];}
  else if(!Number.isInteger(r.qty)||r.qty<1)code='BAD_QTY';
  else if(r.price%tick(r.price)!==0)code='BAD_TICK';
  else if((perSec[sec]||0)>=rate)code='RATE_LIMIT';
  if(code==='OK'){perSec[sec]=(perSec[sec]||0)+1;no=++orderNo;if(r.rid)seen[r.rid]=no;sent++;}
  log.push({k:k+1,sec,code,orderNo:no,notice:code==='OK'?'접수 통보':code==='SAME_ID'?'통보 없음(이미 접수된 주문)':'통보 없음',...r});
 });
 return {log,accepted:log.filter(x=>x.code==='OK').length,rejected:log.filter(x=>x.code!=='OK'&&x.code!=='SAME_ID').length};
}

/* ── 8장: 주문 상태와 대사 ── */
const STATES={pendingNew:'접수 대기',new:'접수',partial:'부분 체결',filled:'전량 체결',pendingCancel:'취소 대기',canceled:'취소',rejected:'거부'};
const TERMINAL=['filled','canceled','rejected'];
function newOrder(price,qty){return {price,qty,filled:0,canceled:0,state:'pendingNew',seen:new Set()};}
const openQty=o=>TERMINAL.includes(o.state)?0:o.qty-o.filled-o.canceled;
/* 사건 하나로 다음 상태를 고른다. 같은 사건(같은 id)을 두 번 받으면 아무것도 바꾸지 않는다. 끝난 주문은 사건을 무시한다. */
function orderStep(o,ev){
 if(ev.id!=null){if(o.seen.has(ev.id))return o;o.seen.add(ev.id);}
 if(TERMINAL.includes(o.state))return o;
 const rest=o.qty-o.filled;
 if(ev.type==='ack'&&o.state==='pendingNew')o.state='new';
 else if(ev.type==='reject'&&o.state==='pendingNew')o.state='rejected';
 else if(ev.type==='fill'){const k=Math.min(ev.qty||rest,rest);o.filled+=k;o.state=o.filled===o.qty?'filled':o.state==='pendingCancel'?'pendingCancel':'partial';}
 else if(ev.type==='cancelReq'&&o.state!=='pendingNew')o.state='pendingCancel';
 else if(ev.type==='cancelAck'){o.canceled=o.qty-o.filled;o.state='canceled';}
 return o;
}
/* 서버 사건 목록을 흘려 보내며 계좌(서버가 아는 사실)와 봇 장부를 함께 적는다.
   bot: 'naive'(취소를 요청하면 0주로 적고 전량 체결 통보만 반영) | 'correct'(체결 통보마다 반영하고 취소 확인의 취소 수량만 지움).
   resend: 응답 없음(timeout) 뒤 'none' 다시 보내지 않음 | 'blind' 요청 ID 없이 다시 보냄 | 'rid' 같은 요청 ID로 다시 보냄 | 'query' 미체결 조회 뒤 보냄. */
function orderFlow(price,qty,events,o={}){
 const bot=o.bot||'naive',resend=o.resend||'none',orders=[newOrder(price,qty)],hist=[];let ledger=0,dup=false;
 for(const ev of events){
  if(ev.type==='timeout'){if(resend==='blind'&&!dup){orders.push(newOrder(price,qty));dup=true;}hist.push({ev,state:orders[0].state,filled:orders[0].filled,open:openQty(orders[0]),canceled:orders[0].canceled,orders:orders.length});continue;}
  const before=orders[0].filled;orders.forEach((x,i)=>orderStep(x,i?{...ev,id:ev.id==null?null:ev.id+'#'+i}:ev));
  const o0=orders[0];
  if(bot==='correct')ledger=o0.filled;
  else if(ev.type==='cancelReq')ledger=0;
  else if(o0.state==='filled'&&before<o0.filled)ledger=o0.qty;
  hist.push({ev,state:o0.state,filled:o0.filled,open:openQty(o0),canceled:o0.canceled,orders:orders.length});
 }
 const acc=orders.reduce((s,x)=>s+x.filled,0),cash=-orders.reduce((s,x)=>s+x.filled*price+fee(x.filled*price),0),lcash=-(ledger*price+(ledger?fee(ledger*price):0));
 return {hist,orders,account:{shares:acc,cash},ledger:{shares:ledger,cash:lcash},diff:{shares:acc-ledger,cash:cash-lcash},state:orders[0].state};
}

/* ── 9장: 멈춤 조건 ── */
/* 요청 기록에 조건을 대어 보고 조건마다 처음 걸린 요청 번호와 그때의 평가 손익을 적는다. 조건마다 따로, 기록은 그대로 흘려 보낸다.
   기록의 줄: {side,cell,qty,fill(바로 체결된 가격)|later(다음 시가에 체결), mark(그때 가격), age(시세가 늦은 초), resend(요청 ID 없이 다시 보낸 것: 봇 장부는 모름)},
   {open:가격}(아침 시가, 남은 주문이 체결됨), {check:true}(장 시작 전 대사). 손익 = 계좌(서버 사실)의 평가 손익, 기록 시작 때를 0으로 둔다.
   c = {loss:한도 원|null, count:건수|null, same:bool, hold:주|null, recon:bool, delay:초|null}. 조건은 요청을 보내기 직전에 본다. */
function stopCheck(sc,c){
 const acct={...(sc.held||{})},ledger={...(sc.held||{})},pending=[],hit={},rows=[];let cash=0,n=0,mark=sc.mark0||0,reconBad=false;
 const tot=m=>Object.values(m).reduce((s,x)=>s+x,0),v0=tot(acct)*(sc.mark0||0),pnl=()=>cash+tot(acct)*mark-v0;
 const fill=(r,p)=>{const amt=p*r.qty,f=fee(amt);if(r.side==='B'){cash-=amt+f;acct[r.cell]=(acct[r.cell]||0)+r.qty;if(!r.resend)ledger[r.cell]=(ledger[r.cell]||0)+r.qty;}
  else{cash+=amt-f-tax(amt);acct[r.cell]=(acct[r.cell]||0)-r.qty;ledger[r.cell]=(ledger[r.cell]||0)-r.qty;}};
 for(const r of sc.requests){
  if(r.check){reconBad=tot(acct)!==tot(ledger);rows.push({check:true,acct:tot(acct),ledger:tot(ledger)});continue;}
  if(r.open!=null){mark=r.open;pending.splice(0).forEach(x=>fill(x,Math.min(x.cell,r.open)));rows.push({open:r.open,acct:tot(acct),ledger:tot(ledger)});continue;}
  n++;if(r.mark)mark=r.mark;const p=pnl(),why=[];
  if(c.loss!=null&&p<=-c.loss)why.push('loss');
  if(c.count!=null&&n>c.count)why.push('count');
  if(c.same&&r.side==='B'&&((acct[r.cell]||0)>0||pending.some(x=>x.cell===r.cell&&x.side==='B')))why.push('same');
  if(c.hold!=null&&r.side==='B'&&tot(ledger)+r.qty>c.hold)why.push('hold');
  if(c.recon&&reconBad)why.push('recon');
  if(c.delay!=null&&(r.age||0)>c.delay)why.push('delay');
  why.forEach(w=>{if(!hit[w])hit[w]={n,pnl:p};});
  if(r.fill!=null)fill(r,r.fill);else if(r.later)pending.push(r);
  rows.push({n,r,pnl:p,why,acct:tot(acct),ledger:tot(ledger)});
 }
 const first=Object.entries(hit).sort((a,b)=>a[1].n-b[1].n)[0]||null;
 return {rows,hit,first:first?{cond:first[0],...first[1]}:null,count:n,acct:tot(acct),ledger:tot(ledger),pnl:pnl()};
}
/* 9장 L2 직접 입력: "B2,B3,…"처럼 칸 번호와 방향만 있는 요청 목록(체결 없음). */
function parseRequests(text){const out=[];for(const tok of String(text).split(/[,\s]+/).filter(Boolean)){const m=tok.match(/^([BS])(\d{1,3})$/i);if(!m)return null;out.push({side:m[1].toUpperCase(),cell:+m[2],qty:1});}return out.length?{requests:out}:null;}
const lossLimit=(capital,pct)=>Math.round(capital*pct/100);
/* 9장 실험의 가상 요청 기록 세 가지(미리 정한 시나리오, 칸 = 칸의 매수 가격). dup은 마지막 과제의 사고와 같은 밤이다. */
const STOP_LOGS={
 normal:{label:'평소의 하루',mark0:19400,held:{19500:8,19750:8,20000:8},requests:[
  {side:'B',cell:19250,qty:8,fill:19250,mark:19250,age:1},{side:'S',cell:19250,qty:8,fill:19500,mark:19500,age:1},{side:'B',cell:19250,qty:8,fill:19250,mark:19250,age:2},
  {side:'S',cell:19500,qty:8,fill:19750,mark:19750,age:1},{side:'B',cell:19500,qty:8,fill:19500,mark:19500,age:1},{side:'S',cell:19250,qty:8,fill:19500,mark:19500,age:1}]},
 dup:{label:'밤사이 같은 칸 세 번',mark0:19530,held:{19750:8,20000:8,20250:8,20500:8,20750:8,21000:8,21250:8},requests:[
  {side:'B',cell:19500,qty:8,later:true,mark:19530,age:1},{side:'B',cell:19500,qty:8,later:true,mark:19530,age:1,resend:true},{side:'B',cell:19500,qty:8,later:true,mark:19530,age:1,resend:true},
  {open:19480},{side:'S',cell:19500,qty:8,fill:19750,mark:19790,age:1},{check:true},{side:'B',cell:19500,qty:8,fill:19500,mark:19480,age:1},{side:'B',cell:19250,qty:8,fill:19250,mark:19210,age:1}]},
 crash:{label:'급락한 하루',mark0:19600,held:{19750:8,20000:8},requests:[
  {side:'B',cell:19500,qty:8,fill:19500,mark:19500,age:1},{side:'B',cell:19250,qty:8,fill:19250,mark:19250,age:1},{side:'B',cell:19000,qty:8,fill:19000,mark:19000,age:2},
  {side:'B',cell:18750,qty:8,fill:18750,mark:18750,age:2},{side:'B',cell:18500,qty:8,fill:18500,mark:18500,age:9},{side:'B',cell:18250,qty:8,fill:18250,mark:18250,age:14},
  {side:'B',cell:18000,qty:8,fill:18000,mark:18000,age:3},{side:'B',cell:17750,qty:8,fill:17750,mark:17750,age:2}]}
};

/* ── 10장·마지막 과제: 모의 서버 운용 창(500~559일째) ── */
function mockWindow(){
 if(memo.win)return memo.win;const R=rec(),c=overfit(402).cfg,{from,to}=D.SCENARIO.mock,o={levels:c.lv,qty:c.q,cost:true,through:true};
 const m=run(R.path.slice(from,to),{...o,mode:'path'}),b=run(R.bars.slice(from,to),{...o,mode:'onefill'}),opt=run(R.bars.slice(from,to),{...o,mode:'optimistic',through:false});
 return memo.win={cfg:c,mock:m,bt:b,opt,bars:R.bars.slice(from,to),path:R.path.slice(from,to)};
}
/* 같은 날·같은 칸·같은 방향이면 맞은 체결. 가격이 달라도 맞음으로 세고 가격 차이(모의 서버 − 백테스트) × 수량을 따로 더한다. fills: [날, 'B'|'S', 칸, 가격]. */
function matchFills(mock,bt,q){
 const key=f=>f[0]+'|'+f[1]+'|'+f[2],A={},Bk={};
 for(const f of mock)(A[key(f)]=A[key(f)]||[]).push(f[3]);for(const f of bt)(Bk[key(f)]=Bk[key(f)]||[]).push(f[3]);
 let hit=0,diff=0;for(const k in Bk){const a=A[k]||[];Bk[k].forEach((pb,i)=>{if(i<a.length){hit++;diff+=(a[i]-pb)*q;}});}
 return {btFills:bt.length,mockFills:mock.length,matched:hit,missed:bt.length-hit,extra:mock.length-hit,priceDiff:diff,rate:bt.length?hit/bt.length:null};
}
/* 첫 days일의 날마다 짝짓기와 누적 손익 차이. 중복 매수(11번째 거래일)는 체결 짝짓기에 넣지 않고 대사 차이(주식 수) 칸에만 적는다. */
function monitorDays(days=5){
 const W=mockWindow(),q=W.cfg.q,dup=D.SCENARIO.mock.dup,out=[];let cm=0,cb=0;
 for(let d=0;d<days;d++){
  const mf=W.mock.book.fills.filter(f=>f[0]===d),bf=W.bt.book.fills.filter(f=>f[0]===d);cm+=mf.length;cb+=bf.length;
  const m=matchFills(mf,bf,q),cum=matchFills(W.mock.book.fills.filter(f=>f[0]<=d),W.bt.book.fills.filter(f=>f[0]<=d),q);
  out.push({day:d,...m,cumRate:cum.rate,cumMatched:cum.matched,cumBt:cum.btFills,cumMock:cum.mockFills,diffPnl:W.mock.curve[d]-W.bt.curve[d],mockPnl:W.mock.curve[d]-ASSUME.capital,btPnl:W.bt.curve[d]-ASSUME.capital,recon:d>=dup.day?dup.extra*dup.qty:0});
 }
 return out;
}
/* 경보 기준: 대사 차이 ≠ 0이면 그날, 그날 체결률이 rate 아래인 날이 runs일 연속이면, 누적 차이가 계좌의 cum% 넘으면. 처음 울린 날과 까닭. */
function alerts(rows,o={rate:0.8,runs:3,cum:0.5,recon:true}){
 let run=0;const lim=ASSUME.capital*o.cum/100;
 for(const r of rows){const why=[];if(o.recon&&r.recon!==0)why.push('recon');run=r.rate!=null&&r.rate<o.rate?run+1:r.rate==null?run:0;if(run>=o.runs)why.push('rate');if(Math.abs(r.diffPnl)>lim)why.push('cum');if(why.length)return {day:r.day,why};}
 return null;
}
/* 10장 L2 직접 입력: 줄마다 "B 19000 18950"(방향, 칸, 체결 가격). 날은 모두 같은 날로 본다. */
function parseFills(text){const out=[];for(const line of String(text).split(/[\n;]+/).map(s=>s.trim()).filter(Boolean)){const m=line.match(/^([BS])\s+(\d+)\s+(\d+)$/i);if(!m)return null;out.push([0,m[1].toUpperCase(),+m[2],+m[3]]);}return out;}

/* 마지막 과제: 원인별 금액. 모의 서버 손익 = 시장 경로(같은 60일 현실 가정 백테스트) + 체결 차이 + 중복 매수. */
function audit(){
 if(memo.audit)return memo.audit;
 const W=mockWindow(),dup=D.SCENARIO.mock.dup,open=W.path[dup.day][0],last=W.path[W.path.length-1][7],q=dup.qty,cap=ASSUME.capital;
 const dupCost=dup.extra*(open*q+fee(open*q)),dupPnl=dup.extra*q*last-dupCost,live=W.mock.curve[59]-cap,bt=W.bt.curve[59]-cap,fillDiff=live-bt,total=live+dupPnl,o=overfit(402);
 return memo.audit={cfg:W.cfg,open,last,dupShares:dup.extra*q,dupCost,dupPnl,live,bt,fillDiff,total,totalPct:total/cap,
  expected:Math.round(cap*(Math.pow(1+round(o.isBest,4),60/250)-1)),isBest:o.isBest,oosBest:o.oosBest,oosRank:o.oosRank,N:o.N,emax:emax(o.N).sharpe,optimistic:W.opt.curve[59]-cap,
  ledger:W.mock.book.shares,account:W.mock.book.shares+dup.extra*q,end:cap+total,match:matchFills(W.mock.book.fills,W.bt.book.fills,W.cfg.q),
  mockStats:{fills:W.mock.book.fills.length,trips:W.mock.book.trips,fees:W.mock.book.fees,tax:W.mock.book.taxes},btStats:{fills:W.bt.book.fills.length,trips:W.bt.book.trips,shares:W.bt.book.shares},optFills:W.opt.book.fills.length};
}
const reconValue=(account,ledger,close)=>({shares:account-ledger,value:(account-ledger)*close});
const residual=(actual,bt,fillDiff)=>actual-bt-fillDiff;

const assumptions={
 data:'새벽전자의 750거래일 경로, 배당 400원, 가상 종목 20개, 모의 서버 운용 창과 중복 매수 사건은 작성 세션이 지어낸 가상 시나리오다. 3년째는 하락과 낮은 변동성이 오도록 지어냈다',
 bar:'하루 막대(시가·고가·저가·종가)만 보면 저가와 고가의 순서를 모른다. 낙관 가정은 저가 먼저, 하루 안 경로 계산은 미리 정한 여덟 점을 쓴다',
 fills:'닿으면 체결은 가격이 칸 가격에 닿기만 해도 체결된다고 보고, 한 눈금 지나야 체결은 칸 가격을 넘어서야 체결된다고 본다. 실제 대기열은 재지 못한다',
 cost:'수수료 0.015%(가정)와 거래세 0.20%(보도 기준)는 확인일 기준 값이며 바뀔 수 있다',
 metrics:'한 해 250거래일, 무위험 수익률 0, 모표준편차. √250 연율화와 날마다 하나씩 뽑는 부트스트랩은 날마다 수익률이 서로 독립일 때의 근사다',
 overfit:'설정 402개는 칸당 수량 5·6·7·8·10주, 간격 100~400원, 가장 아래 칸 17,000~19,000원, 칸 수 10~40개 가운데 호가 눈금에 맞고 300만 원 안에 드는 것이다',
 mock:'모의 서버의 체결 규칙(하루 안 여덟 점에서 한 눈금 지나면 체결, 갭이면 시가)과 초당 2건 한도는 미리 정한 시나리오다',
 rounding:'반올림은 5에서 올린다. 비용은 정수 연산으로 원 단위 버림한다'
};
const MODEL={levels:V12,steps:STEP_DEF.map(s=>s[0]),states:STATES};
const api={CHECKED,MARKET,FACTS,TEXT,ASSUME,MODEL,assumptions,STOP_LOGS,round,fee,tax,tick,mean,pstdev,median,wonText,levels,V12,
 newBook,run,ann,adjust,adjFills,splitReturns,divFactor,dataStats,survivorship,survivorSimple,STEP_DEF,STEP_STATE,assumptionRun,step,waterfall,yearRun,closeOnlyCell,annualize,stopLines,stopDays,barCell,dayCompare,roundTrip,
 returns,drawdown,metrics,bootstrap,yearSharpe,autocorr1,hold,monthly,a5Stats,budget,combos,evalCfg,rank,spearman,sampleSplit,subset,overfit,invNorm,emax,emaxSim,walkForward,isBestDetail,rankCheck,
 schedule,callsPerDay,mockSend,STATES,newOrder,orderStep,openQty,orderFlow,stopCheck,parseRequests,lossLimit,mockWindow,matchFills,monitorDays,alerts,parseFills,audit,reconValue,residual,records:rec};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.BMath=api;
})(typeof window!=='undefined'?window:globalThis);
