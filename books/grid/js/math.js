/* 그리드(격자) 매매 계산. DOM을 만지지 않으며 tests/math.test.cjs가 대표값·경계값·불변 조건을 검사한다.
   단위: 가격·금액은 원, 수량은 주, 비율·수수료율·세율은 %. 원 미만 수수료·세금은 주문마다 버린다.
   호가단위·가격제한폭·왕복 비용 규칙은 4권 「주문 한 장이 체결되기까지」(books/market/js/math.js)에서 복사했다. 책 사이 코드 의존을 두지 않는다.
   비용 기본값은 4권 조사 노트(books/market/docs/research.html 9-1·9-3)를 따른다:
   - 위탁수수료 매수·매도 각각 0.015% (가정. 증권사마다 다르며 1차 자료로 확인하지 못함)
   - 증권거래세 매도 금액의 0.20% (2026년 코스피 = 거래세 0.05% + 농어촌특별세 0.15%, 코스닥 0.20%. 보도로 확인)
   - 국내 주식형 ETF는 거래세 면제라 tax: 0, kind: 'etf'로 넣는다.
   이 파일의 시뮬레이터는 교육용 모형이다. 무엇을 단순화했는지는 simulate 위 설명에 적는다. */
(function(root){
'use strict';
const COSTS=Object.freeze({fee:.015,tax:.2,kind:'stock'});
const costsOf=c=>({...COSTS,...(c||{})});
/* 부동소수 오차로 30원이 29.999…원이 되어 1원 덜 버려지는 일을 막는다. */
const floorWon=x=>Math.floor(x+1e-7);

/* ── 호가단위 (4권 6장) ── 2023년 1월 개편 뒤 코스피·코스닥 주식은 같은 표, ETF·ETN은 2천 원 미만 1원, 이상 5원. */
const STOCK_TICKS=[[2000,1],[5000,5],[20000,10],[50000,50],[200000,100],[500000,500],[Infinity,1000]];
function tickSize(price,kind='stock'){
 if(kind==='etf')return price<2000?1:5;
 return STOCK_TICKS.find(([upper])=>price<upper)[1];
}
const isValidPrice=(price,kind='stock')=>Number.isInteger(price)&&price>0&&price%tickSize(price,kind)===0;
/* 유효 가격으로 맞추기. dir: 'nearest'(가까운 쪽, 가운데면 올림) | 'down'(내림) | 'up'(올림).
   가격대 경계(2천·5천·2만·5만·20만·50만)는 모두 위 가격대 눈금의 배수라, 아래 눈금으로 반올림해도 경계에서 유효하다. */
function roundToTick(price,kind='stock',dir='nearest'){
 if(dir==='up'){
  let p=Math.max(1,Math.ceil(price-1e-9));
  for(;;){const t=tickSize(p,kind),q=Math.ceil(p/t)*t;if(q===p)return p;p=q;}
 }
 const p=Math.max(1,price),t=tickSize(dir==='down'?Math.floor(p):p,kind);
 return Math.max(t,(dir==='down'?Math.floor(p/t+1e-9):Math.round(p/t))*t);
}
/* 가격제한폭 (4권 7장): 기준가 × 30%를 기준가의 호가단위 미만에서 버려 폭을 정하고, 기준가 ± 폭을 그 가격의 호가단위 미만에서 버린다. */
function priceLimits(base,kind='stock',rate=.3){
 const t=tickSize(base,kind),width=Math.floor(base*rate/t)*t;
 return {upper:roundToTick(base+width,kind,'down'),lower:roundToTick(base-width,kind,'down')};
}

/* ── 왕복 비용과 한 칸의 손익 (4권 10장) ── */
function roundTrip(buyPrice,sellPrice,qty,c){
 const {fee,tax}=costsOf(c),buyAmt=buyPrice*qty,sellAmt=sellPrice*qty;
 const buyFee=floorWon(buyAmt*fee/100),sellFee=floorWon(sellAmt*fee/100),taxWon=floorWon(sellAmt*tax/100);
 const costs=buyFee+sellFee+taxWon,gross=sellAmt-buyAmt;
 return {buyAmt,sellAmt,buyFee,sellFee,tax:taxWon,costs,gross,net:gross-costs};
}
/* 비용으로 사라지는 간격의 어림(%): 매수·매도 수수료와 거래세의 합. 한 칸 간격이 이 비율보다 넓어야 남는다. */
const costRate=c=>{const {fee,tax}=costsOf(c);return 2*fee+tax;};
/* 한 칸 판정: 매수가·매도가가 눈금에 맞는지, 한 번 왕복하면 비용을 빼고 얼마가 남는지. */
function cell(buy,sell,qty,c){
 const {kind}=costsOf(c),validBuy=isValidPrice(buy,kind),validSell=isValidPrice(sell,kind),rt=roundTrip(buy,sell,qty,c);
 return {buy,sell,step:sell-buy,stepPct:(sell/buy-1)*100,validBuy,validSell,valid:validBuy&&validSell,net:rt.net,costs:rt.costs,profitable:validBuy&&validSell&&rt.net>0};
}
/* 이 매수가에서 한 칸이 남기려면 필요한 가장 좁은 간격(원). 매도 후보는 유효 가격만 차례로 본다. 없으면 null. */
function minStep(buy,qty,c,maxSteps=20000){
 const {kind}=costsOf(c);let sell=roundToTick(buy+1,kind,'up');
 for(let i=0;i<maxSteps;i++){if(roundTrip(buy,sell,qty,c).net>0)return sell-buy;sell+=tickSize(sell,kind);}
 return null;
}
/* 본전 매도가: 비용을 넣은 손익이 0 이상이 되는 가장 낮은 유효 가격. */
function breakEven(buy,qty,c){
 const {kind}=costsOf(c);let p=roundToTick(buy,kind,'up');
 for(let i=0;i<20000;i++){if(roundTrip(buy,p,qty,c).net>=0)return p;p+=tickSize(p,kind);}
 return null;
}

/* ── 격자 가격 (levels): 아래에서 위로 n+1개 가격, 칸 i는 levels[i]에 사서 levels[i+1]에 판다. ── */
const uniqSorted=a=>[...new Set(a)].sort((x,y)=>x-y);
/* 등차: lo~hi를 같은 원 간격 cells칸으로. 가격마다 가까운 눈금으로 맞추고 겹친 가격은 하나로 합친다. */
function arithmeticLevels(lo,hi,cells,kind='stock'){
 return uniqSorted(Array.from({length:cells+1},(_,i)=>roundToTick(lo+(hi-lo)*i/cells,kind)));
}
/* 등비: lo~hi를 같은 비율 간격 cells칸으로. 칸마다 같은 %를 노린다. */
function geometricLevels(lo,hi,cells,kind='stock'){
 return uniqSorted(Array.from({length:cells+1},(_,i)=>roundToTick(lo*Math.pow(hi/lo,i/cells),kind)));
}
/* 시작가와 원 간격을 그대로 쓴다(반올림 없음). 4권 마지막 과제처럼 눈금에 맞지 않는 가격도 그대로 남겨 판정한다. */
const stepLevels=(start,step,cells)=>Array.from({length:cells+1},(_,i)=>start+i*step);
/* 시작가에서 pct%씩 곱해 올라가며 가까운 눈금으로 맞춘다. */
function ratioLevels(start,pct,cells,kind='stock'){
 return uniqSorted(Array.from({length:cells+1},(_,i)=>roundToTick(start*Math.pow(1+pct/100,i),kind)));
}
/* 격자 전체 판정표와 요약. budget은 모든 칸이 지정가에 한 번씩 사졌을 때 들어가는 돈(수수료 포함) = 이 격자가 묶을 수 있는 최대 현금. */
function gridReport(levels,qty,c){
 const cells=levels.slice(0,-1).map((b,i)=>cell(b,levels[i+1],qty,c));
 const steps=cells.map(x=>x.step),pcts=cells.map(x=>x.stepPct);
 return {cells,count:cells.length,minStep:Math.min(...steps),maxStep:Math.max(...steps),minStepPct:Math.min(...pcts),maxStepPct:Math.max(...pcts),
  invalid:cells.filter(x=>!x.valid).length,unprofitable:cells.filter(x=>x.valid&&!x.profitable).length,
  netPerCycle:cells.reduce((s,x)=>s+x.net,0),budget:gridBudget(levels,qty,c)};
}
function gridBudget(levels,qty,c){const {fee}=costsOf(c);return levels.slice(0,-1).reduce((s,p)=>s+p*qty+floorWon(p*qty*fee/100),0);}
/* 같은 시작가·같은 간격으로 count칸을 깔 때 모든 칸이 눈금에 맞고 남는 가장 좁은 원 간격(4권 minGridStep과 같은 판정). */
function minUniformStep(start,count,qty,c,maxStep=5000){
 for(let s=1;s<=maxStep;s++){const lv=stepLevels(start,s,count);if(lv.slice(0,-1).every((b,i)=>cell(b,lv[i+1],qty,c).profitable))return s;}
 return null;
}
/* 예산 안에서 칸당 몇 주까지 살 수 있나: gridBudget(levels, q) ≤ budget인 가장 큰 정수 q. */
function qtyForBudget(levels,budget,c){
 let q=Math.floor(budget/levels.slice(0,-1).reduce((s,p)=>s+p,0));
 while(q>0&&gridBudget(levels,q,c)>budget)q--;
 while(gridBudget(levels,q+1,c)<=budget)q++;
 return Math.max(0,q);
}
/* 가격이 price까지 내려가 모든 칸이 지정가에 사진 채로 남았을 때의 손실. exit=true면 그 가격에 모두 팔 때의 수수료·거래세까지 뺀다. */
function lossAt(levels,qty,price,c,exit=true){
 const {fee,tax}=costsOf(c),held=levels.length-1,cost=gridBudget(levels,qty,c),shares=held*qty,value=shares*price;
 const exitCost=exit?floorWon(value*fee/100)+floorWon(value*tax/100):0,loss=cost-(value-exitCost);
 return {shares,cost,value,exitCost,loss,lossPct:cost?loss/cost*100:0,avgCost:shares?levels.slice(0,-1).reduce((s,p)=>s+p,0)/held:0};
}

/* ── 가격 경로 준비 ── days = [[하루의 가격들], ...]. 하루 안에서는 가격이 점과 점 사이를 빠짐없이 지나간다고 본다(연속).
   하루의 첫 가격은 시가이고, 전날 마지막 가격(종가)에서 시가로는 건너뛴다(갭: 사이의 가격에서는 거래가 없다).
   모든 가격은 가까운 눈금으로 맞추고, 그날의 상·하한가(전날 종가 기준 ±30%) 밖이면 상·하한가로 자른다. 첫날 기준가는 opts.base(없으면 첫 가격). */
function prepareDays(days,opts={}){
 const kind=opts.kind||'stock';let base=opts.base||days[0][0],clipped=0;
 const out=days.map(day=>{
  const {upper,lower}=priceLimits(roundToTick(base,kind),kind);
  const row=day.map(p=>{const q=Math.min(upper,Math.max(lower,roundToTick(p,kind)));if(q!==roundToTick(p,kind))clipped++;return q;});
  base=row[row.length-1];return row;
 });
 return {days:out,clipped};
}

/* ── 격자 시뮬레이터 ──
   가정(교육용 단순화):
   1. 칸 i의 매수 지정가는 levels[i], 매도 지정가는 levels[i+1]. 칸은 비었거나(매수 대기) 한 묶음(qty주)을 들고 있다(매도 대기).
   2. 매수 주문은 가격이 그 칸 위에 있을 때만 걸려 있다(armed). 가격이 처음부터 칸 아래에 있으면 한 번 위로 올라간 뒤에야 걸린다.
   3. 체결 규칙 fill: 'touch'(기본, 지정가에 닿으면 전량 체결) | 'through'(지정가를 한 눈금이라도 지나가야 체결). 대기열·일부 체결은 4권 4장 몫이라 넣지 않는다.
   4. 하루 안의 연속 이동에서는 지정가에 체결된다. 시가가 전날 종가에서 건너뛰어 걸려 있던 지정가를 넘어서면, 그 주문은 지정가와 시가 중
      나에게 유리한 쪽인 시가에 체결된다(장 시작 단일가 매매에서 매수 지정가 이하의 가격, 매도 지정가 이상의 가격에 체결되는 것과 같다).
      팔고 나서 다시 걸리는 매수와 사고 나서 걸리는 매도는 언제나 격자 가격에 건다(체결가가 아니라).
   5. 현금이 모자라면 그 매수는 건너뛰고(skipped) 가격이 다시 칸 위로 올라가야 다시 걸린다. 쉬는 현금의 이자는 0으로 본다.
   6. start: 'empty'(기본, 주식 없이 시작) | 'filled'(시작가 이상에 있는 칸을 시작가에 사서 매도 대기로 시작).
   7. 멈춤 규칙 stop = {below, above, maxLoss}: below·above는 가격이 그 값에 닿으면 남은 주식을 그 값(눈금 내림)에, 갭이면 시가에 모두 판다.
      maxLoss(원)는 경로의 점마다 (평가금액 − 시작 자금)이 −maxLoss 이하인지 보고, 그렇다면 그 점의 가격에 모두 판다. 멈춘 뒤에는 주문을 내지 않는다.
      갭으로 멈춤 가격까지 건너뛴 날에는 멈춤 가격 위에 걸려 있던 매수도 시가에 체결된 뒤 함께 팔린다(걸어 둔 주문은 시가에 모두 체결되기 때문).
   8. 평가 손익 = 들고 있는 주식 × 마지막 가격 − 그 주식을 산 돈(매수 수수료 포함). 팔 때 낼 비용은 liquidation에서 따로 뺀다.
   불변식: cash + shares × last = capital + realized + unrealized (테스트가 검사). */
function newBook(levels,qty,capital,c){
 return {levels,qty,c:costsOf(c),capital,cash:capital,minCash:capital,lots:levels.slice(0,-1).map(()=>null),armed:levels.slice(0,-1).map(()=>false),
  fills:[],skipped:[],realized:0,fees:0,taxes:0,roundTrips:0,stopped:null};
}
function doBuy(b,i,price,t,how){
 const amt=price*b.qty,fee=floorWon(amt*b.c.fee/100),cost=amt+fee;
 b.armed[i]=false;
 if(cost>b.cash){b.skipped.push({t,cell:i,price});return false;}
 b.cash-=cost;b.minCash=Math.min(b.minCash,b.cash);b.fees+=fee;b.lots[i]={price,cost};
 b.fills.push({t,side:'buy',cell:i,price,qty:b.qty,fee,tax:0,how});return true;
}
function doSell(b,i,price,t,how){
 const lot=b.lots[i],amt=price*b.qty,fee=floorWon(amt*b.c.fee/100),tax=floorWon(amt*b.c.tax/100),pnl=amt-fee-tax-lot.cost;
 b.cash+=amt-fee-tax;b.fees+=fee;b.taxes+=tax;b.realized+=pnl;b.lots[i]=null;if(how!=='stop')b.roundTrips++;
 b.fills.push({t,side:'sell',cell:i,price,qty:b.qty,fee,tax,pnl,how});
}
/* 한 번의 이동(from → to). gap이면 체결가는 시가(to), 아니면 지정가. stopAt은 이 이동 안에서 멈춤이 걸리는 가격(없으면 null). */
function move(b,from,to,t,gap,fill,stopAt){
 const hitDown=L=>fill==='through'?to<L:to<=L,hitUp=U=>fill==='through'?to>U:to>=U;
 if(to<from){
  for(let i=b.lots.length-1;i>=0;i--){const L=b.levels[i];if(stopAt!=null&&L<stopAt)break;if(!b.lots[i]&&b.armed[i]&&hitDown(L))doBuy(b,i,gap?Math.min(L,to):L,t,gap?'gap':'limit');}
 }else if(to>from){
  for(let i=0;i<b.lots.length;i++){const U=b.levels[i+1];if(stopAt!=null&&U>stopAt)break;if(b.lots[i]&&hitUp(U))doSell(b,i,gap?Math.max(U,to):U,t,gap?'gap':'limit');}
 }
 b.lots.forEach((lot,i)=>{if(!lot&&to>b.levels[i])b.armed[i]=true;});
}
function liquidate(b,price,t,reason){b.lots.forEach((lot,i)=>{if(lot)doSell(b,i,price,t,'stop');});b.stopped={t,price,reason};}
const sharesOf=b=>b.lots.filter(Boolean).length*b.qty;
const openCostOf=b=>b.lots.reduce((s,l)=>s+(l?l.cost:0),0);
/* 이동 하나를 멈춤 규칙과 함께 처리한다. 멈추면 true. */
function step(b,from,to,t,gap,o){
 const kind=b.c.kind,st=o.stop||{};
 const below=st.below!=null&&to<from&&to<=st.below&&from>st.below,above=st.above!=null&&to>from&&to>=st.above&&from<st.above;
 if(below){const p=gap?to:roundToTick(st.below,kind,'down');move(b,from,to,t,gap,o.fill,st.below);liquidate(b,p,t,'below');return true;}
 if(above){const p=gap?to:roundToTick(st.above,kind,'down');move(b,from,to,t,gap,o.fill,st.above);liquidate(b,p,t,'above');return true;}
 move(b,from,to,t,gap,o.fill,null);
 if(st.maxLoss!=null&&b.cash+sharesOf(b)*to-b.capital<=-st.maxLoss){liquidate(b,to,t,'maxLoss');return true;}
 return false;
}
/* 시뮬레이션. o = {days | path, levels, qty, capital, costs, fill, start, stop, base}.
   path(숫자 배열)는 갭과 가격제한이 없는 하루짜리 경로로 다룬다. capital을 주지 않으면 gridBudget(최대로 묶일 돈)을 쓴다. */
function simulate(o){
 const c=costsOf(o.costs),levels=o.levels,qty=o.qty;
 const prep=o.days?prepareDays(o.days,{kind:c.kind,base:o.base}):{days:[o.path.map(p=>roundToTick(p,c.kind))],clipped:0};
 const b=newBook(levels,qty,o.capital!=null?o.capital:gridBudget(levels,qty,c),c),opt={fill:o.fill||'touch',stop:o.stop};
 const series=[],outside={below:0,above:0,points:0};let t=0,prev=null;
 const p0=prep.days[0][0];
 levels.slice(0,-1).forEach((L,i)=>{if(o.start==='filled'&&L>=p0)doBuy(b,i,p0,0,'start');else if(p0>L)b.armed[i]=true;});
 prep.days.forEach((day,d)=>day.forEach((p,k)=>{
  if(prev!==null&&!b.stopped)step(b,prev,p,t,k===0,opt);
  const sh=sharesOf(b),oc=openCostOf(b);
  outside.points++;if(p<levels[0])outside.below++;if(p>levels[levels.length-1])outside.above++;
  series.push({t,day:d,price:p,cash:b.cash,shares:sh,equity:b.cash+sh*p,realized:b.realized,unrealized:sh*p-oc});
  prev=p;t++;
 }));
 return summarize(b,prev,series,outside,prep.clipped);
}
function summarize(b,last,series,outside,clipped){
 const shares=sharesOf(b),openCost=openCostOf(b),value=shares*last,held=b.lots.filter(Boolean);
 const exitCost=floorWon(value*b.c.fee/100)+floorWon(value*b.c.tax/100);
 return {fills:b.fills,skipped:b.skipped,buys:b.fills.filter(f=>f.side==='buy').length,sells:b.fills.filter(f=>f.side==='sell').length,roundTrips:b.roundTrips,
  realized:b.realized,cash:b.cash,capital:b.capital,shares,heldCells:held.length,avgCost:shares?held.reduce((s,l)=>s+l.price,0)/held.length:0,openCost,
  last,marketValue:value,unrealized:value-openCost,equity:b.cash+value,pnl:b.cash+value-b.capital,liquidation:b.cash+value-exitCost,
  fees:b.fees,taxes:b.taxes,minCash:b.minCash,maxCashUsed:b.capital-b.minCash,stopped:b.stopped,outside,clipped,series};
}

/* ── 견주기 (11장) ── 같은 경로·같은 자금으로 보유, 적립식, 리밸런싱을 계산한다. 모두 prepareDays를 거친 같은 가격을 쓴다. */
function buyQty(cash,price,c){let q=Math.floor(cash/(price*(1+c.fee/100)));while(q>0&&q*price+floorWon(q*price*c.fee/100)>cash)q--;return q;}
function trade(acct,side,q,price,c){
 if(q<=0)return;const amt=q*price,fee=floorWon(amt*c.fee/100),tax=side==='sell'?floorWon(amt*c.tax/100):0;
 if(side==='buy'){acct.cash-=amt+fee;acct.shares+=q;}else{acct.cash+=amt-fee-tax;acct.shares-=q;}
 acct.fees+=fee;acct.taxes+=tax;acct.trades++;
}
function finish(acct,capital,last,c,series){
 const value=acct.shares*last,exitCost=floorWon(value*c.fee/100)+floorWon(value*c.tax/100),equity=acct.cash+value;
 return {cash:acct.cash,shares:acct.shares,last,marketValue:value,equity,pnl:equity-capital,pnlPct:(equity/capital-1)*100,liquidation:equity-exitCost,
  fees:acct.fees,taxes:acct.taxes,trades:acct.trades,series};
}
/* 첫 가격에 살 수 있는 만큼 사서 끝까지 들고 있기. */
function buyHold(days,capital,costs,opts={}){
 const c=costsOf(costs),d=prepareDays(days,{kind:c.kind,base:opts.base}).days,acct={cash:capital,shares:0,fees:0,taxes:0,trades:0};
 trade(acct,'buy',buyQty(capital,d[0][0],c),d[0][0],c);
 const series=d.map(day=>acct.cash+acct.shares*day[day.length-1]);
 return finish(acct,capital,d[d.length-1].slice(-1)[0],c,series);
}
/* 적립식: 자금을 parts번으로 나눠 every일마다 그날 시가에 산다. 남는 돈은 현금으로 둔다. */
function periodic(days,capital,costs,opts={}){
 const c=costsOf(costs),d=prepareDays(days,{kind:c.kind,base:opts.base}).days,parts=opts.parts||6,every=opts.every||20;
 const acct={cash:capital,shares:0,fees:0,taxes:0,trades:0},slice=capital/parts;let done=0;
 const series=d.map((day,i)=>{if(i%every===0&&done<parts){trade(acct,'buy',buyQty(Math.min(slice,acct.cash),day[0],c),day[0],c);done++;}return acct.cash+acct.shares*day[day.length-1];});
 return finish(acct,capital,d[d.length-1].slice(-1)[0],c,series);
}
/* 리밸런싱: every일마다 그날 시가에서 주식 비중을 weight%로 되돌린다(첫날 포함). */
function rebalance(days,capital,costs,opts={}){
 const c=costsOf(costs),d=prepareDays(days,{kind:c.kind,base:opts.base}).days,w=(opts.weight!=null?opts.weight:50)/100,every=opts.every||20;
 const acct={cash:capital,shares:0,fees:0,taxes:0,trades:0};
 const series=d.map((day,i)=>{
  if(i%every===0){const p=day[0],target=Math.floor(w*(acct.cash+acct.shares*p)/p),diff=target-acct.shares;
   if(diff>0)trade(acct,'buy',Math.min(diff,buyQty(acct.cash,p,c)),p,c);else trade(acct,'sell',-diff,p,c);}
  return acct.cash+acct.shares*day[day.length-1];
 });
 return finish(acct,capital,d[d.length-1].slice(-1)[0],c,series);
}
/* 최대 낙폭(%): 지나온 최고점에서 가장 크게 떨어진 비율. 자세한 뜻과 측정은 8권 몫이고 이 책은 요약 상자에서만 쓴다. */
function maxDrawdown(values){
 let peak=values[0],pi=0,best={mdd:0,peak:0,trough:0};
 values.forEach((v,i)=>{if(v>peak){peak=v;pi=i;}const dd=peak?(v/peak-1)*100:0;if(dd<best.mdd)best={mdd:dd,peak:pi,trough:i};});
 return best;
}
/* 기간 수익률(%)을 연 수익률로: (1 + r)^(250 / 거래일) − 1. 1권 8장의 연환산과 같은 계산(1년 = 거래일 250일 가정). */
const annualize=(pct,tradingDays,perYear=250)=>(Math.pow(1+pct/100,perYear/tradingDays)-1)*100;

/* ── 미리 정한 시나리오 경로 (실제 시세가 아님) ──
   wave: 하루 perDay개 점, 삼각파(진폭 amp%, 주기 period점)에 하루 drift%씩 곱해 가는 추세, gaps={일차: 시가 변화%}.
   가격은 눈금에 맞추며, 가격제한폭 자르기는 simulate/prepareDays가 한다. */
function tri(x){const f=((x-.25)%1+1)%1;return 4*Math.abs(f-.5)-1;}
function wave(o){
 const kind=o.kind||'stock',perDay=o.perDay||8,period=o.period||16,amp=o.amp||0,drift=o.drift||0,gaps=o.gaps||{};
 let level=o.start,t=0;const out=[];
 for(let d=0;d<o.days;d++){
  if(d>0)level*=1+drift/100;if(gaps[d])level*=1+gaps[d]/100;
  const row=[];for(let k=0;k<perDay;k++,t++)row.push(roundToTick(level*(1+amp/100*tri(t/period)),kind));out.push(row);
 }
 return out;
}

const api={COSTS,floorWon,STOCK_TICKS,tickSize,isValidPrice,roundToTick,priceLimits,roundTrip,costRate,cell,minStep,breakEven,
 arithmeticLevels,geometricLevels,stepLevels,ratioLevels,gridReport,gridBudget,minUniformStep,qtyForBudget,lossAt,
 prepareDays,simulate,buyHold,periodic,rebalance,maxDrawdown,annualize,tri,wave};
if(typeof module!=='undefined')module.exports=api;else root.GMath=api;
})(this);
