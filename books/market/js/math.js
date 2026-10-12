/* 거래 규칙 계산. DOM을 만지지 않으며 tests/math.test.cjs가 대표값과 경계값을 검사한다.
   규칙의 원문과 확인일은 docs/research.html에 있다. 교육용으로 단순화한 부분은 함수 설명에 적는다. 단위는 원·주·%다. */
(function(root){
'use strict';
/* 호가가격단위. 2023년 1월 개편 뒤 유가증권시장과 코스닥이 같은 표를 쓴다. ETF·ETN은 2천 원 미만 1원, 이상 5원. */
const STOCK_TICKS=[[2000,1],[5000,5],[20000,10],[50000,50],[200000,100],[500000,500],[Infinity,1000]];
function tickSize(price,kind='stock'){
 if(kind==='etf')return price<2000?1:5;
 return STOCK_TICKS.find(([upper])=>price<upper)[1];
}
const isValidPrice=(price,kind='stock')=>Number.isInteger(price)&&price>0&&price%tickSize(price,kind)===0;
/* 가장 가까운 유효 가격. dir은 'down'(내림) 또는 'up'(올림). 경계에서는 그 가격대의 눈금으로 다시 맞춘다. */
function roundToTick(price,kind='stock',dir='down'){
 let p=Math.max(1,Math.floor(price));
 const t=tickSize(p,kind);
 if(dir==='up'){p=Math.ceil(price/t)*t;return tickSize(p,kind)>t&&p%tickSize(p,kind)?Math.ceil(p/tickSize(p,kind))*tickSize(p,kind):p;}
 return Math.floor(p/t)*t;
}
/* 위아래 n칸의 유효 가격 사다리. */
function ladder(price,n=4,kind='stock'){
 const up=[],down=[];let p=price;
 for(let i=0;i<n;i++){p=p+tickSize(p,kind);up.push(p);}
 p=price;for(let i=0;i<n;i++){p=p-tickSize(p-1,kind);down.push(p);}
 return {down:down.reverse(),price,up};
}
/* 가격제한폭: 기준가 × 30%를 기준가의 호가단위 미만에서 버려 폭을 정하고, 기준가에 더하고 뺀 값을 그 가격대의 호가단위 미만에서 버린다.
   (거래소 예: 9,980 → 12,970 / 6,990) 지금 호가단위 표에서는 상한가만 끝수 처리가 필요하다. */
function priceLimits(base,kind='stock',rate=.3){
 const t=tickSize(base,kind),width=Math.floor(base*rate/t)*t;
 const upper=roundToTick(base+width,kind,'down'),lower=roundToTick(base-width,kind,'down');
 return {upper,lower,upPct:(upper/base-1)*100,downPct:(lower/base-1)*100};
}
/* 호가창에 시장가 주문을 넣었을 때 반대편 호가를 차례로 먹는다. levels=[[가격,수량],...] 좋은 가격부터. */
function sweep(levels,qty){
 let left=qty,cost=0;const fills=[];
 for(const [price,size] of levels){if(left<=0)break;const q=Math.min(left,size);fills.push([price,q]);cost+=price*q;left-=q;}
 const filled=qty-left,avg=filled?cost/filled:0,best=levels.length?levels[0][0]:0;
 return {fills,filled,unfilled:left,cost,avg,slip:filled?avg-best:0,slipPct:filled&&best?(avg/best-1)*100:0};
}
const spread=(bestBid,bestAsk)=>({won:bestAsk-bestBid,pct:(bestAsk-bestBid)/((bestAsk+bestBid)/2)*100});
/* 시간 우선 대기열. 같은 가격 앞에 ahead주가 서 있고 내 주문 mine주가 뒤에 선다. 그 가격에 매도 incoming주가 들어오면 앞에서부터 채운다. */
function queueFill(ahead,mine,incoming){
 const toAhead=Math.min(ahead,incoming),toMine=Math.min(mine,incoming-toAhead);
 return {toAhead,toMine,mineLeft:mine-toMine,need:ahead+mine,status:toMine===mine?'전부 체결':toMine>0?'일부 체결':'대기'};
}
/* 단일가 매매의 체결가(교육용 단순화): 체결 가능 수량이 가장 큰 가격을 고르고, 같으면 남는 수량이 작은 가격, 그래도 같으면 기준가에 가까운 가격.
   buys·sells=[[가격,수량],...]. 시장가는 가격 Infinity(매수)·0(매도)로 넣는다. */
function auction(buys,sells,base){
 const prices=[...new Set([...buys,...sells].map(o=>o[0]).filter(Number.isFinite).filter(p=>p>0))].sort((a,b)=>a-b);
 let best=null;
 for(const p of prices){
  const demand=buys.filter(o=>o[0]>=p).reduce((s,o)=>s+o[1],0),supply=sells.filter(o=>o[0]<=p).reduce((s,o)=>s+o[1],0);
  const volume=Math.min(demand,supply),imbalance=Math.abs(demand-supply),gap=Math.abs(p-base);
  const row={price:p,demand,supply,volume,imbalance};
  if(volume>0&&(!best||volume>best.volume||(volume===best.volume&&(imbalance<best.imbalance||(imbalance===best.imbalance&&gap<Math.abs(best.price-base))))))best=row;
 }
 return {best,table:prices.map(p=>({price:p,demand:buys.filter(o=>o[0]>=p).reduce((s,o)=>s+o[1],0),supply:sells.filter(o=>o[0]<=p).reduce((s,o)=>s+o[1],0)}))};
}
/* 변동성완화장치. 정적 VI는 정적 기준가(직전 단일가 체결가, 장 시작 전에는 전일 종가)에서 ±10%, 동적 VI는 직전 체결가에서 ±dynamicPct.
   path는 차례로 체결되려는 가격 목록. 처음 걸리는 지점과 종류를 돌려준다. 문턱은 '이상'이며, 부동소수 오차로 정확히 −10%인 가격을 놓치지 않도록 곱셈으로 비교한다. */
function viCheck(path,staticBase,dynamicPct=3,staticPct=10){
 for(let i=1;i<path.length;i++){
  const s=(path[i]/staticBase-1)*100,d=(path[i]/path[i-1]-1)*100,reach=(p,ref,pct)=>Math.abs(p-ref)*100>=pct*ref-1e-9;
  if(reach(path[i],staticBase,staticPct))return {index:i,type:'정적',move:s,price:path[i]};
  if(reach(path[i],path[i-1],dynamicPct))return {index:i,type:'동적',move:d,price:path[i]};
 }
 return null;
}
/* 시장 전체의 서킷브레이커 단계: 지수가 전일 대비 8%·15%·20% 이상 떨어져 1분 이어지면 1·2·3단계. */
function breakerLevel(dropPct){return dropPct>=20?3:dropPct>=15?2:dropPct>=8?1:0;}
/* 기준가 조정. 유상증자 권리락: (전일 종가 × 기존 주식 + 발행가 × 신주) ÷ (기존 + 신주), 무상증자는 발행가 0, 액면분할은 종가 × 새 액면 ÷ 옛 액면.
   결과는 가장 가까운 호가단위로 반올림한다(이 책의 가정, 실제 끝수 처리는 시행세칙). 현금 배당은 기준가 조정 대상 목록에 없다(조사 노트 10-4). */
function rightsBase(close,ratio,issuePrice=0){const raw=(close+issuePrice*ratio)/(1+ratio);return {raw,base:roundTo(raw)};}
function splitBase(close,oldPar,newPar){const raw=close*newPar/oldPar;return {raw,base:roundTo(raw)};}
function roundTo(raw,kind='stock'){const t=tickSize(raw,kind);return Math.round(raw/t)*t;}
/* 결제일: 체결일에서 영업일 n일 뒤. holidays는 'YYYY-MM-DD' 목록. 날짜는 UTC 자정으로 다룬다. */
function addBusinessDays(dateText,n=2,holidays=[]){
 const d=new Date(dateText+'T00:00:00Z');let left=n;
 while(left>0){d.setUTCDate(d.getUTCDate()+1);const day=d.getUTCDay(),key=d.toISOString().slice(0,10);if(day!==0&&day!==6&&!holidays.includes(key))left--;}
 return d.toISOString().slice(0,10);
}
/* 미수: 결제일까지 넣지 못한 돈. 반대매매는 다음 영업일 시가 근처에서 그 돈을 채울 만큼 판다(교육용: 가정한 매도 가격으로 수량을 올림). */
function shortfall(cost,cash,sellPrice){const due=Math.max(0,cost-cash);return {due,sellQty:due?Math.ceil(due/sellPrice):0};}
/* 왕복 비용. fee는 매수·매도 각각의 수수료율(%), tax는 매도 금액에 붙는 증권거래세율(%). 원 미만은 버린다. */
function roundTrip(buyPrice,sellPrice,qty,fee=.015,tax=.2){
 const buyAmt=buyPrice*qty,sellAmt=sellPrice*qty,buyFee=Math.floor(buyAmt*fee/100),sellFee=Math.floor(sellAmt*fee/100),taxWon=Math.floor(sellAmt*tax/100);
 const costs=buyFee+sellFee+taxWon,gross=sellAmt-buyAmt;
 return {buyAmt,sellAmt,buyFee,sellFee,tax:taxWon,costs,gross,net:gross-costs};
}
/* 본전 매도가: 비용까지 넣고 손익이 0 이상이 되는 가장 낮은 유효 가격. */
function breakEven(buyPrice,qty,fee=.015,tax=.2,kind='stock'){
 let p=isValidPrice(buyPrice,kind)?buyPrice:roundToTick(buyPrice,kind,'up');/* 눈금에 맞지 않는 매수가도 매도 후보는 유효 가격에서만 찾는다. */
 for(let i=0;i<10000;i++){if(roundTrip(buyPrice,p,qty,fee,tax).net>=0)return p;p+=tickSize(p,kind);}
 return null;
}
/* 격자 한 칸 판정: 위 가격이 호가단위에 맞는지, 한 칸 차익이 왕복 비용보다 큰지. */
function gridCell(buyPrice,step,qty,fee=.015,tax=.2,kind='stock'){
 const sell=buyPrice+step,valid=isValidPrice(buyPrice,kind)&&isValidPrice(sell,kind),rt=roundTrip(buyPrice,sell,qty,fee,tax);
 return {buy:buyPrice,sell,validBuy:isValidPrice(buyPrice,kind),validSell:isValidPrice(sell,kind),valid,net:rt.net,costs:rt.costs,profitable:valid&&rt.net>0};
}
function gridSheet(start,step,count,qty,fee=.015,tax=.2,kind='stock'){return Array.from({length:count},(_,i)=>gridCell(start+i*step,step,qty,fee,tax,kind));}
/* 1장: 회사 이익을 채권자와 주주가 나누는 몫. 이자는 정해져 있고 주주는 나머지를 갖는다(세금·재투자 생략). */
function claims(profit,interest){const toBond=Math.min(Math.max(profit,0),interest),toEquity=profit-toBond;return {toBond,toEquity,bondShort:interest-toBond};}
/* 2장: 두 시장 중 체결 비용이 낮은 곳. 매수면 (매도1호가 + 시장 수수료), 수수료는 원 단위 비율. */
function bestVenue(venues,qty){return venues.map(v=>({...v,total:v.ask*qty+Math.floor(v.ask*qty*v.fee/100)})).sort((a,b)=>a.total-b.total);}
/* 보기 순서: 정답 원래 번호 answer를 target 자리에 오게 돌린다. */
function choiceOrder(n,answer,target){const order=[...Array(n).keys()];const k=((answer-target)%n+n)%n;return order.slice(k).concat(order.slice(0,k));}
/* 격자 주문표에서 모든 칸이 눈금에 맞고 왕복 비용을 넘기는 가장 좁은 간격. 1원부터 maxStep까지 차례로 찾고, 없으면 null. count=1이면 한 칸만 본다. */
function minGridStep(start,count,qty,fee=.015,tax=.2,kind='stock',maxStep=2000){
 for(let s=1;s<=maxStep;s++)if(gridSheet(start,s,count,qty,fee,tax,kind).every(c=>c.profitable))return s;
 return null;
}
const api={STOCK_TICKS,tickSize,isValidPrice,roundToTick,ladder,priceLimits,sweep,spread,queueFill,auction,viCheck,breakerLevel,rightsBase,splitBase,roundTo,addBusinessDays,shortfall,roundTrip,breakEven,gridCell,gridSheet,claims,bestVenue,choiceOrder,minGridStep};
if(typeof module!=='undefined')module.exports=api;else root.MMath=api;
})(this);
