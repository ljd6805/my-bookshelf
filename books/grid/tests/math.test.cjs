/* 그리드 매매 계산의 대표값·경계값·불변 조건. 4권과 겹치는 숫자(왕복 비용·최소 간격)는 4권 본문 값과 같아야 한다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,eps=1e-9,msg='')=>assert.ok(Math.abs(a-b)<=eps,`${msg} ${a} ≠ ${b}`);
const LV=M.arithmeticLevels(18000,22000,20);/* 하린의 기본 격자: 18,000~22,000원 200원 간격 20칸 */
const sum=a=>a.reduce((s,x)=>s+x,0);
function checkLedger(r,msg){/* 현금 + 주식 평가액 = 시작 자금 + 실현 + 평가 손익, 그리고 체결 기록과 현금이 맞는지 */
 near(r.cash+r.shares*r.last,r.capital+r.realized+r.unrealized,1e-6,msg+' conservation');
 const flow=sum(r.fills.map(f=>f.side==='buy'?-(f.price*f.qty+f.fee):f.price*f.qty-f.fee-f.tax));
 near(r.capital+flow,r.cash,1e-6,msg+' cash flow');
 assert.equal(r.shares,sum(r.fills.map(f=>f.side==='buy'?f.qty:-f.qty)),msg+' shares');
 near(r.realized,sum(r.fills.filter(f=>f.side==='sell').map(f=>f.pnl)),1e-6,msg+' realized');
 r.series.forEach(s=>near(s.equity-r.capital,s.realized+s.unrealized,1e-6,msg+' series '+s.t));
 assert.ok(r.minCash>=0,msg+' never borrowed');
}

test('tick table and rounding at the band edges (vol. 4 rules)',()=>{
 assert.equal(M.tickSize(19990),10);assert.equal(M.tickSize(20000),50);assert.equal(M.tickSize(1999),1);assert.equal(M.tickSize(2000),5);assert.equal(M.tickSize(30000,'etf'),5);
 assert.equal(M.roundToTick(19996),20000);assert.equal(M.roundToTick(20020),20000);assert.equal(M.roundToTick(20025),20050);
 assert.equal(M.roundToTick(19995,'stock','down'),19990);assert.equal(M.roundToTick(19995,'stock','up'),20000);assert.equal(M.roundToTick(20001,'stock','up'),20050);
 assert.equal(M.roundToTick(4998),5000);assert.equal(M.roundToTick(0.4),1);
 for(let p=1;p<60000;p+=37)for(const dir of ['nearest','down','up'])assert.ok(M.isValidPrice(M.roundToTick(p,'stock',dir)),`${p} ${dir}`);
 assert.deepEqual(M.priceLimits(20000),{upper:26000,lower:14000});assert.deepEqual(M.priceLimits(9980),{upper:12970,lower:6990});
});

test('one cell: round-trip cost, break-even and the narrowest profitable step match vol. 4',()=>{
 assert.equal(M.roundTrip(19950,20000,10).net,41);assert.equal(M.roundTrip(19970,20000,10).costs,459);assert.equal(M.roundTrip(19970,20000,10).net,-159);
 assert.equal(M.breakEven(19950,10),20000);assert.equal(M.minStep(19970,10),80);assert.equal(M.minStep(20000,10),50);assert.equal(M.minStep(19000,10),50);
 assert.equal(M.minStep(19970,10,{tax:0,kind:'etf'}),10);assert.equal(M.minUniformStep(20000,6,10),50);assert.equal(M.minUniformStep(19970,6,10),null);
 const c=M.cell(20000,20030,10);assert.equal(c.validSell,false);assert.equal(c.profitable,false);
 near(M.costRate(),.23,1e-12);near(M.costRate({tax:0}),.03,1e-12);
 assert.equal(M.roundTrip(20000,20000,10).net,-(30+30+400),'zero step loses exactly the costs');
});

test('arithmetic and geometric levels, budget and quantity for a budget',()=>{
 assert.equal(LV.length,21);assert.ok(LV.every((p,i)=>p===18000+200*i));
 const r=M.gridReport(LV,5);assert.equal(r.count,20);assert.equal(r.invalid,0);assert.equal(r.unprofitable,0);assert.equal(r.minStep,200);
 assert.equal(r.budget,1990289);assert.equal(r.netPerCycle,15399);
 assert.equal(M.qtyForBudget(LV,3e6),7);assert.ok(M.gridBudget(LV,7)<=3e6&&M.gridBudget(LV,8)>3e6);assert.equal(M.qtyForBudget(LV,1000),0);
 const G=M.geometricLevels(18000,22000,20),g=M.gridReport(G,5);
 assert.equal(G[0],18000);assert.equal(G[20],22000);assert.ok(G.every(p=>M.isValidPrice(p)));
 assert.ok(g.maxStepPct-g.minStepPct>.25,'50원 눈금 위에서 등비 간격이 고르지 않다');assert.deepEqual(G.filter(p=>p>20000).map((p,i,a)=>i?p-a[i-1]:0).filter(s=>s%50),[]);
 assert.equal(M.stepLevels(19970,30,6)[2],20030);assert.equal(M.gridReport(M.stepLevels(19970,30,6),10).invalid,5);
 assert.deepEqual(M.arithmeticLevels(20000,20100,10),[20000,20050,20100],'too fine a grid collapses onto the 50원 ticks');
 near(M.ratioLevels(10000,1,3)[3],10300,0);
});

test('loss if the price falls below the whole grid',()=>{
 const l=M.lossAt(LV,5,16000);assert.equal(l.shares,100);assert.equal(l.cost,1990289);assert.equal(l.exitCost,3440);assert.equal(l.loss,393729);assert.equal(l.avgCost,19900);
 assert.equal(M.lossAt(LV,5,16000,undefined,false).loss,390289);
 assert.ok(M.lossAt(LV,5,15000).loss>l.loss,'lower price, larger loss');
});

test('box market: realized P&L equals the sum of cell profits, and the ledger balances',()=>{
 const path=[19900];for(let k=0;k<3;k++)path.push(17900,22100);
 const r=M.simulate({path,levels:LV,qty:5});
 assert.equal(r.shares,0);assert.equal(r.buys,50);assert.equal(r.sells,50);assert.equal(r.roundTrips,50);
 const expected=sum(r.fills.filter(f=>f.side==='sell').map(f=>M.roundTrip(LV[f.cell],LV[f.cell+1],5).net));
 assert.equal(r.realized,expected);assert.equal(r.realized,38614);
 const lowerTen=sum(M.gridReport(LV,5).cells.slice(0,10).map(c=>c.net));assert.equal(r.realized,lowerTen+2*15399,'first pass only lower half, then two full cycles');
 assert.equal(r.pnl,r.realized);checkLedger(r,'box');
 const etf=M.simulate({path,levels:LV,qty:5,costs:{tax:0,kind:'etf'}});assert.ok(etf.realized>r.realized);checkLedger(etf,'etf');
});

test('trend markets: up leaves cash idle above the range, down piles up inventory',()=>{
 const up=M.wave({start:20000,days:30,perDay:8,amp:2,period:8,drift:.8}),down=M.wave({start:20000,days:30,perDay:8,amp:2,period:8,drift:-.8});
 const a=M.simulate({days:up,levels:LV,qty:5,start:'filled'}),b=M.simulate({days:down,levels:LV,qty:5});
 assert.equal(a.shares,0);assert.ok(a.outside.above>0);assert.ok(a.pnl>0);checkLedger(a,'up');
 assert.ok(M.buyHold(up,a.capital).pnl>a.pnl,'holding beats the grid in a steady rise');
 assert.ok(b.shares>0&&b.unrealized<0&&b.pnl<0);assert.ok(b.outside.below>0);checkLedger(b,'down');
 assert.equal(b.heldCells,12,'cells above the highest price seen were never armed');
 assert.ok(M.buyHold(down,b.capital).pnl<b.pnl,'the grid loses less than full holding in this fall');
});

test('fill rules: touch versus through, armed only above the level',()=>{
 const lv=M.stepLevels(19900,100,2);
 assert.equal(M.simulate({path:[20050,20000,20100],levels:lv,qty:10}).roundTrips,1);
 assert.equal(M.simulate({path:[20050,20000,20100],levels:lv,qty:10,fill:'through'}).roundTrips,0);
 assert.equal(M.simulate({path:[20050,20000,19950,20150],levels:lv,qty:10,fill:'through'}).roundTrips,1);
 assert.equal(M.simulate({path:[19850,20050,19850],levels:lv,qty:10}).buys,2,'armed after the price rose above');
 assert.equal(M.simulate({path:[19850,19800],levels:lv,qty:10}).buys,0,'starting below a level does not buy it');
 const f=M.simulate({path:[20050,20050],levels:lv,qty:10,start:'filled'});assert.equal(f.buys,0,'filled start buys only levels at or above the start price');
 const g=M.simulate({path:[19950,19950],levels:lv,qty:10,start:'filled'});assert.equal(g.buys,1);assert.equal(g.fills[0].price,19950);assert.equal(g.fills[0].how,'start');checkLedger(g,'filled');
});

test('gaps fill resting orders at the open, which is the better price for me',()=>{
 const days=[[19900,19950],[19500,19900]];
 const r=M.simulate({days,levels:LV,qty:5});
 const gapBuys=r.fills.filter(f=>f.how==='gap');assert.deepEqual(gapBuys.map(f=>[f.cell,f.price]),[[9,19500],[8,19500]]);
 const sell=r.fills.find(f=>f.side==='sell');assert.equal(sell.price,19800);assert.equal(sell.pnl,M.roundTrip(19500,19800,5).net);
 const up=M.simulate({days:[[20100,19900],[20500]],levels:LV,qty:5});
 assert.deepEqual(up.fills.filter(f=>f.side==='sell').map(f=>f.price),[20500],'a gap up sells at the open, above the 20,000 limit');
 checkLedger(r,'gap');checkLedger(up,'gap up');
});

test('price limits clip a path to ±30% of the previous close',()=>{
 const p=M.prepareDays([[20000],[10000],[30000]]);assert.deepEqual(p.days,[[20000],[14000],[18200]]);assert.equal(p.clipped,2);
 assert.deepEqual(M.prepareDays([[20000]],{base:15000}).days,[[19500]]);
 const r=M.simulate({days:[[20000],[10000]],levels:LV,qty:5});assert.equal(r.last,14000);assert.equal(r.clipped,1);
 assert.ok(r.fills.every(f=>f.price===14000),'a limit-down open fills every resting buy at the lower limit');checkLedger(r,'limit');
});

test('stop rules sell everything once and then stop trading',()=>{
 const down=M.wave({start:20000,days:30,perDay:8,amp:2,period:8,drift:-.8});
 const s=M.simulate({days:down,levels:LV,qty:5,stop:{below:17500}});
 assert.equal(s.stopped.reason,'below');assert.equal(s.stopped.price,17500);assert.equal(s.shares,0);assert.equal(s.pnl,s.realized);
 assert.ok(s.fills.every(f=>f.t<=s.stopped.t));checkLedger(s,'stop');
 const free=M.simulate({days:down,levels:LV,qty:5});assert.ok(s.pnl>free.pnl,'stopping at 17,500 loses less than riding to the end here');
 const m=M.simulate({days:down,levels:LV,qty:5,stop:{maxLoss:100000}});assert.equal(m.stopped.reason,'maxLoss');
 const at=m.series[m.stopped.t];assert.ok(at.equity-m.capital>-100000-30000,'stopped close to the loss limit');checkLedger(m,'maxLoss');
 const gap=M.simulate({days:[[19900,19950],[17000]],levels:LV,qty:5,stop:{below:17500}});assert.equal(gap.stopped.price,17000);assert.equal(gap.shares,0);checkLedger(gap,'stop gap');
});

test('not enough cash skips buys and never borrows',()=>{
 const path=[22100,17900];const r=M.simulate({path,levels:LV,qty:5,capital:500000});
 assert.ok(r.skipped.length>0);assert.ok(r.cash>=0);assert.equal(r.buys+r.skipped.length,20);checkLedger(r,'cash');
 const full=M.simulate({path,levels:LV,qty:5});assert.equal(full.maxCashUsed,M.gridBudget(LV,5),'a full fall uses the whole budget');
});

test('comparisons: holding, periodic buying and rebalancing',()=>{
 const flat=[[20000,20500],[19500,20000]];
 assert.equal(M.buyHold(flat,1e6).pnl,-floorFee(49*20000));
 const h=M.buyHold(flat,1e6);assert.equal(h.shares,49);near(h.equity,h.cash+h.shares*20000,0);
 const p=M.periodic([[20000],[20000],[20000]],600000,undefined,{parts:3,every:1});assert.equal(p.shares,27);assert.equal(p.trades,3);
 const r100=M.rebalance(flat,1e6,undefined,{weight:100,every:20});assert.equal(r100.shares,h.shares);
 assert.equal(M.rebalance(flat,1e6,undefined,{weight:0}).trades,0);
 const half=M.rebalance([[20000],[22000],[20000]],1e6,undefined,{weight:50,every:1});assert.equal(half.trades,3);assert.ok(half.taxes>0);
 function floorFee(a){return Math.floor(a*.015/100+1e-7);}
});

test('drawdown, annualizing and the preset wave',()=>{
 assert.deepEqual(M.maxDrawdown([100,120,90,130,65]),{mdd:-50,peak:3,trough:4});assert.equal(M.maxDrawdown([1,2,3]).mdd,0);
 near(M.annualize(10,125),21,1e-9);near(M.annualize(0,60),0,0);
 assert.equal(M.tri(0),0);assert.equal(M.tri(.25),1);assert.equal(M.tri(.75),-1);
 const w=M.wave({start:20000,days:3,perDay:4,amp:5,period:8});assert.deepEqual(w[0],[20000,20500,21000,20500]);assert.ok(w.flat().every(p=>M.isValidPrice(p)));
 const g=M.wave({start:20000,days:2,perDay:2,gaps:{1:-5}});assert.deepEqual(g,[[20000,20000],[19000,19000]]);
});

/* ── 본문(js/content.js)·복습(review.json)의 숫자 대조 ──
   미리 정한 가상 경로. 실험(박스권·6개월 장부)도 같은 정의를 쓴다. */
const BOX=()=>M.wave({start:20000,days:80,perDay:8,amp:7,period:64});
const UP=()=>M.wave({start:20000,days:30,perDay:8,amp:2,period:8,drift:.8});
const DOWN=()=>M.wave({start:20000,days:30,perDay:8,amp:2,period:8,drift:-.8});
const FINAL=()=>[...BOX(),...M.wave({start:20000,days:20,perDay:8,amp:2,period:16,drift:-.5,gaps:{0:-8}}),...M.wave({start:16700,days:20,perDay:8,amp:2,period:16})];
const SWING=[19900,17900,22100,17900,22100,17900,22100];
const ETF={tax:0,kind:'etf'},EL=M.arithmeticLevels(30000,32000,20,'etf');
const dayCloses=r=>r.series.filter((s,i,a)=>!a[i+1]||a[i+1].day!==s.day).map(s=>s.equity);
const pct=(a,b)=>(a/b-1)*100;

test('content ch1-4: rules, one cell, spacing and range',()=>{
 let r=M.simulate({path:[19900,19500,19900],levels:LV,qty:5});assert.deepEqual(r.fills.map(f=>[f.side,f.price]),[['buy',19800],['buy',19600],['sell',19800]]);
 assert.deepEqual(M.simulate({path:[19900,20500,19900],levels:LV,qty:5}).fills.map(f=>f.price),[20400,20200,20000]);
 assert.equal(LV.slice(0,-1).filter(p=>p<19900).length,10);assert.equal(EL.slice(0,-1).filter(p=>p<31050).length,11);
 const c=M.roundTrip(19800,20000,5);assert.deepEqual([c.buyFee,c.sellFee,c.tax,c.costs,c.net],[14,15,200,229,771]);
 assert.equal(M.cell(18000,18200,5).net,792);assert.equal(M.cell(21800,22000,5).net,748);near(792/90000*100,.88,1e-9);
 assert.equal(M.roundTrip(18000,18050,5).net,44);assert.equal(M.roundTrip(18000,18040,5).net,-6);assert.equal(M.minStep(18000,5),50);
 assert.equal(M.roundTrip(20000,20050,10).net,39);assert.equal(M.roundTrip(20000,20050,10).costs,461);
 assert.equal(M.roundTrip(30000,30005,10,ETF).net,-40);assert.equal(M.roundTrip(30000,30010,10,ETF).net,10);assert.equal(M.minStep(30000,10,ETF),10);
 const a=M.gridReport(LV,5);assert.equal(a.maxStepPct.toFixed(2),'1.11');assert.equal(a.minStepPct.toFixed(2),'0.92');
 const G=M.geometricLevels(18000,22000,20),g=M.gridReport(G,5);
 assert.equal(Math.pow(22000/18000,1/20).toFixed(4),'1.0101');assert.equal((18000*Math.pow(22000/18000,1/20)).toFixed(1),'18181.5');assert.equal(G[1],18180);
 const st=G.slice(1).map((p,i)=>[G[i],p,p-G[i]]);assert.deepEqual(st.filter(x=>x[2]===250).map(x=>[x[0],x[1]]),[[20900,21150],[21550,21800]]);
 assert.deepEqual(st.slice(0,3).map(x=>x[2]),[180,180,190]);assert.equal(g.maxStepPct.toFixed(2),'1.20');assert.equal(g.minStepPct.toFixed(2),'0.92');assert.equal(g.netPerCycle,15419);assert.equal(g.budget,1983488);
 const G2=M.geometricLevels(16000,24000,10).slice(1).map((p,i,x)=>p-M.geometricLevels(16000,24000,10)[i]);assert.equal(Math.min(...G2),660);assert.equal(Math.max(...G2),950);
 assert.deepEqual(M.geometricLevels(4000,6000,10).slice(4,8),[4705,4900,5100,5310]);const G4=M.geometricLevels(4000,6000,10);const s4=G4.slice(1).map((p,i)=>p-G4[i]);assert.equal(Math.min(...s4),165);assert.equal(Math.max(...s4),240);
 assert.equal(M.gridBudget(M.arithmeticLevels(18000,22000,40),5),3990579);assert.equal(M.gridReport(M.arithmeticLevels(16000,24000,20),5).budget,1980288);assert.equal(M.gridReport(M.arithmeticLevels(16000,24000,20),5).netPerCycle,35378);
 const A=M.arithmeticLevels(50000,60000,20);assert.equal(A[1]-A[0],500);assert.equal(M.gridBudget(A,2),2190319);
});

test('content ch5-8: box, rally, slide and gap',()=>{
 const b=M.simulate({path:SWING,levels:LV,qty:5});assert.deepEqual([b.roundTrips,b.realized,b.fees,b.taxes,b.shares],[50,38614,1436,9950,0]);
 assert.equal(M.simulate({path:SWING.slice(0,3),levels:LV,qty:5}).realized,7816);assert.ok((b.fees+b.taxes)/b.realized>.25);
 const n40=M.gridReport(M.arithmeticLevels(18000,22000,40),5).cells.map(c=>c.net);assert.equal(Math.min(...n40),248);assert.equal(Math.max(...n40),293);
 const e=M.simulate({path:[30350,30050,30350,30050,30350],levels:M.stepLevels(30000,100,4),qty:10,costs:ETF});assert.equal(e.roundTrips,4);assert.equal(e.realized,3640);
 [30000,30100,30200].forEach(p=>assert.equal(M.cell(p,p+100,10,ETF).net,910));
 const box=BOX().flat();assert.equal(Math.min(...box),18600);assert.equal(Math.max(...box),21400);
 const up=UP(),u=M.simulate({days:up,levels:LV,qty:5,start:'filled'}),h=M.buyHold(up,u.capital);
 assert.equal(up[29].slice(-1)[0],24950);assert.deepEqual([u.roundTrips,u.realized,u.shares,u.cash,u.outside.above,u.outside.points],[52,105927,0,2096216,139,240]);
 assert.equal(u.fills.filter(f=>f.how==='start').length,10);assert.equal(u.series[u.series.findIndex(s=>s.price>22000)].day+1,11);
 assert.equal(sum(u.fills.filter(f=>f.side==='sell').map(f=>M.roundTrip(LV[f.cell],LV[f.cell+1],5).net)),39463);
 assert.equal(h.shares,99);assert.equal(h.pnl,489753);assert.equal(u.capital,1990289);
 const dn=DOWN(),d=M.simulate({days:dn,levels:LV,qty:5});assert.equal(dn[29].slice(-1)[0],15690);assert.equal(Math.max(...dn.flat()),20400);
 assert.deepEqual([d.buys,d.sells,d.realized,d.heldCells,d.shares,d.avgCost,d.openCost,d.marketValue,d.unrealized,d.pnl,d.maxCashUsed],[40,28,21973,12,60,19100,1146166,941400,-204766,-182793,1127359]);
 assert.equal((d.openCost/d.shares).toFixed(1),'19102.8');assert.equal(d.liquidation-d.capital,-184816);assert.equal(LV.slice(0,-1).filter(p=>p>=20400).length,8);
 const s=M.simulate({path:[19900,16000],levels:LV,qty:5});assert.deepEqual([s.heldCells,s.avgCost,s.unrealized],[10,18900,-145136]);assert.equal(M.lossAt(LV,5,16000,undefined,false).loss,390289);
 const g=M.simulate({days:[[19900,19950],[19500,19900]],levels:LV,qty:5});assert.deepEqual(g.fills.map(f=>[f.side,f.price]),[['buy',19500],['buy',19500],['sell',19800]]);assert.equal(g.realized,1274);assert.equal(g.unrealized,1986);
 const ng=M.simulate({path:[19900,19950,19500,19900],levels:LV,qty:5});assert.equal(ng.realized,774);assert.equal(ng.unrealized,486);
 assert.equal(M.priceLimits(19900).lower,13930);const ld=M.simulate({days:[[19900],[13000]],levels:LV,qty:5});assert.equal(ld.buys,10);assert.equal(ld.openCost,696600);assert.ok(18200-13930>4000);
 const gu=M.simulate({days:[[20100,19900],[20500]],levels:LV,qty:5}).fills.find(f=>f.side==='sell');assert.deepEqual([gu.price,gu.pnl],[20500,2265]);
 assert.deepEqual(M.simulate({days:[[31050],[30700]],levels:EL,qty:10,costs:ETF}).fills.map(f=>f.price),[30700,30700,30700,30700]);
 const ea=M.simulate({path:[31150,30500],levels:M.stepLevels(30800,100,3),qty:10,costs:ETF});assert.deepEqual([ea.buys,ea.avgCost,ea.openCost,ea.unrealized],[3,30900,927138,-12138]);
});

test('content ch9-13: ledger, capital, comparison, exit and the six-month ledger',()=>{
 const d=M.simulate({days:DOWN(),levels:LV,qty:5});assert.equal(d.cash,866096);assert.equal(d.cash+d.shares*d.last,1807496);assert.equal(d.capital+d.realized+d.unrealized,1807496);assert.equal(d.liquidation,1805473);
 const bx=M.simulate({days:BOX(),levels:LV,qty:5});assert.deepEqual([bx.roundTrips,bx.realized,bx.unrealized,bx.pnl,bx.maxCashUsed],[132,101686,-23719,77967,1393202]);
 const p=bx.pnl/bx.capital*100;assert.equal(p.toFixed(2),'3.92');assert.equal(M.annualize(p,80).toFixed(2),'12.76');
 const pu=bx.pnl/bx.maxCashUsed*100;assert.equal(pu.toFixed(2),'5.60');assert.equal(M.annualize(pu,80).toFixed(2),'18.55');
 assert.equal(420000+30*19000-1000000-12000,-22000);
 assert.deepEqual([5,6,7,8].map(q=>M.gridBudget(LV,q)),[1990289,2388349,2786408,3184468]);assert.equal(M.qtyForBudget(LV,3e6),7);
 assert.equal(3e6-M.gridBudget(LV,7),213592);assert.equal(3e6-M.gridBudget(LV,5),1009711);assert.equal(M.gridReport(LV,7).netPerCycle,21559);
 assert.equal(M.lossAt(LV,7,16000).loss,551224);assert.equal(M.lossAt(LV,5,16000).lossPct.toFixed(1),'19.8');assert.equal(M.lossAt(LV,7,16000).lossPct.toFixed(1),'19.8');
 assert.equal(M.lossAt(LV,5,15000).loss,493514);assert.equal(M.lossAt(LV,5,14000).loss,593299);assert.equal(M.lossAt(LV,6,16000).loss,472477);
 const s7=M.simulate({path:[19900,16000],levels:LV,qty:7});assert.equal(s7.liquidation-s7.capital,-205601);
 assert.equal(M.simulate({path:[19900,17000],levels:LV,qty:5}).unrealized,-95136);assert.equal(M.priceLimits(20000).lower,14000);
 assert.equal(M.qtyForBudget(EL,2e6,ETF),3);assert.equal(M.gridBudget(EL,3,ETF),1857268);assert.equal(M.gridBudget(EL,4,ETF),2476363);
 const cap=M.gridBudget(LV,5),fast={per:{parts:6,every:5},reb:{weight:50,every:5}};
 const up=UP(),dn=DOWN();
 assert.equal(M.buyHold(up,cap).pnl,489753);assert.equal(pct(M.buyHold(up,cap).equity,cap).toFixed(2),'24.61');assert.equal(M.periodic(up,cap,undefined,fast.per).pnl,252415);assert.equal(M.rebalance(up,cap,undefined,fast.reb).pnl,230866);
 const gu=M.simulate({days:up,levels:LV,qty:5,start:'filled'});assert.equal(pct(gu.equity,cap).toFixed(2),'5.32');assert.equal(489753-105927,383826);
 const hd=M.buyHold(dn,cap),gd=M.simulate({days:dn,levels:LV,qty:5});
 assert.equal(hd.pnl,-426987);assert.equal(pct(hd.equity,cap).toFixed(2),'-21.45');assert.equal(M.periodic(dn,cap,undefined,fast.per).pnl,-251757);assert.equal(M.rebalance(dn,cap,undefined,fast.reb).pnl,-223030);
 assert.equal(pct(gd.equity,cap).toFixed(2),'-9.18');assert.equal(gd.fills.length,68);assert.equal(gd.fees+gd.taxes,6293);assert.equal(hd.fees+hd.taxes,297);
 assert.equal(M.maxDrawdown(dayCloses(gd)).mdd.toFixed(2),'-9.08');assert.equal(M.maxDrawdown(hd.series).mdd.toFixed(2),'-20.65');
 assert.equal(M.simulate({days:BOX(),levels:LV,qty:5,costs:ETF}).pnl,104451);
 const k=gd.series.findIndex(s=>s.price<18000);assert.deepEqual([gd.series[k].day+1,gd.series[k].price,gd.series[k].equity-cap],[12,17940,-50959]);
 const st=M.simulate({days:dn,levels:LV,qty:5,stop:{below:17500}});assert.deepEqual([st.series[st.stopped.t].day+1,st.stopped.price,st.pnl],[16,17500,-76449]);assert.equal(-76449-(-182793),106344);
 const ml=M.simulate({days:dn,levels:LV,qty:5,stop:{maxLoss:100000}});assert.deepEqual([ml.series[ml.stopped.t].day+1,ml.stopped.price,ml.pnl],[19,16960,-108765]);
 const s17=M.simulate({days:dn,levels:LV,qty:5,stop:{below:17000}});assert.deepEqual([s17.series[s17.stopped.t].day+1,s17.pnl],[19,-106377]);
 assert.equal(M.gridBudget(M.arithmeticLevels(16000,20000,20),5),1790259);
 /* 13장 */
 const days=FINAL(),f=M.simulate({days,levels:LV,qty:5});assert.equal(days.length,120);assert.equal(M.prepareDays(days).clipped,0);
 const endOf=dd=>f.series.filter(s=>s.day===dd).slice(-1)[0];
 assert.equal(endOf(79).price,19910);assert.equal(endOf(79).equity-cap,77967);assert.equal(((18400/19910-1)*100).toFixed(1),'-7.6');
 assert.deepEqual(f.fills.filter(x=>x.how==='gap'&&x.price===18400).map(x=>LV[x.cell]),[19600,19400,19200,19000,18800,18600,18400]);
 assert.equal(endOf(99).price,16640);const m6=days.slice(100).flat();assert.equal(Math.min(...m6),16370);assert.equal(Math.max(...m6),17030);
 assert.deepEqual([f.roundTrips,f.realized,f.heldCells,f.shares,f.avgCost.toFixed(1),(f.openCost/f.shares).toFixed(1),f.last,f.unrealized,f.pnl,f.cash,f.maxCashUsed,f.liquidation-f.capital],
  [138,107080,17,85,'19347.6','19350.4',16620,-232086,-125006,452583,1542312,-128042]);
 assert.equal(f.openCost,1644786);assert.equal(f.shares*f.last,1412700);
 const byM=[0,0,0,0,0,0];f.fills.filter(x=>x.side==='sell').forEach(x=>byM[Math.floor(f.series[x.t].day/20)]++);assert.deepEqual(byM.slice(4),[6,0]);assert.equal(sum(byM.slice(0,4)),132);
 assert.deepEqual([f.outside.below,f.outside.points],[280,960]);assert.ok(f.series.every(s=>s.price>=18000||s.day>=80));
 assert.equal(M.simulate({days:[...days,[15000]],levels:LV,qty:5}).pnl,-262706);
 assert.equal(f.cash+3e6-cap,1462294);assert.equal(f.liquidation,1862247);
 assert.equal(M.simulate({days,levels:M.geometricLevels(18000,22000,20),qty:5}).pnl,-142174);
 const r1=M.simulate({days,levels:LV,qty:5,stop:{below:17500}});assert.deepEqual([r1.series[r1.stopped.t].day+1,r1.pnl],[88,-53402]);
 const r2=M.simulate({days,levels:LV,qty:5,stop:{maxLoss:100000}});assert.deepEqual([r2.series[r2.stopped.t].day+1,r2.pnl],[94,-105116]);
});

test('lab prediction answers (L2) proposed for the guides',()=>{
 const a=M.simulate({path:[19900,19100,19700],levels:LV,qty:5});assert.deepEqual([a.buys,a.sells,a.heldCells],[4,2,2]);
 assert.equal(M.roundTrip(21800,21850,5).net,0);assert.equal(M.minStep(21800,5),100);
 const G=M.geometricLevels(18000,22000,40),s=G.slice(1).map((p,i)=>[G[i],p-G[i]]);assert.deepEqual(s.filter(x=>x[1]===150).map(x=>x[0]),[20900,21650]);
 const n=M.simulate({days:BOX(),levels:M.arithmeticLevels(19000,21000,20),qty:5});assert.equal((n.outside.below+n.outside.above)/n.outside.points*100,28.125);
 const w=M.simulate({path:SWING,levels:M.arithmeticLevels(18000,22000,10),qty:5});assert.deepEqual([w.roundTrips,w.realized],[25,44280]);
 assert.equal(M.simulate({days:UP(),levels:LV,qty:5}).realized,59390);
 const sl=M.simulate({path:[19900,18900],levels:LV,qty:5});assert.deepEqual([sl.heldCells,sl.avgCost,sl.unrealized],[5,19400,-12570]);
 const g=M.simulate({days:[[19900],[19300,19900]],levels:LV,qty:5});assert.equal(g.fills.filter(f=>f.how==='gap').length,3);assert.equal(g.realized,3550);
 assert.equal(M.simulate({path:[19900,19300,19900],levels:LV,qty:5}).realized,1550);
 const bx=M.simulate({days:BOX(),levels:LV,qty:5}),p3=bx.pnl/3e6*100;assert.equal(p3.toFixed(2),'2.60');assert.equal(M.annualize(p3,80).toFixed(2),'8.35');
 assert.equal(M.lossAt(LV,6,17000).loss,352735);
 const cap=M.gridBudget(LV,5),b=BOX(),q={parts:4,every:20};assert.equal(M.buyHold(b,cap).pnl,-9207);assert.equal(M.periodic(b,cap,undefined,q).pnl,-8928);assert.equal(M.rebalance(b,cap,undefined,{weight:50,every:20}).pnl,-4557);
 const m5=M.simulate({days:DOWN(),levels:LV,qty:5,stop:{maxLoss:50000}});assert.equal(m5.pnl,-53263);assert.equal(M.simulate({days:DOWN(),levels:LV,qty:5,stop:{below:18000}}).pnl,-49675);
 const wide=M.simulate({days:FINAL(),levels:M.arithmeticLevels(16000,24000,20),qty:5});assert.deepEqual([wide.outside.below,wide.roundTrips,wide.pnl],[0,72,-7601]);
});

test('content.js and review.json have the template fields',()=>{
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
 const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/content.js'),'utf8'),ctx);
 const B=JSON.parse(JSON.stringify(ctx.window.GBook)),ids=['rule','cell','spacing','range','box','rally','slide','gap','ledger','capital','compare','exit','final'];
 assert.deepEqual(B.chapters.map(c=>c.id),ids);
 B.chapters.forEach(c=>{
  for(const k of ['title','subtitle','desc','time','group','recall','formula','formulaNote','warning'])assert.ok(typeof c[k]==='string'&&c[k].length,c.id+' '+k);
  assert.equal(c.labs.length,1);assert.equal(c.paragraphs.length,4,c.id);assert.equal(c.flow.length,4);c.flow.forEach(x=>assert.match(x,/^[^|]+\|[^|]+$/));
  for(const q of [c.quiz,c.transfer]){assert.equal(q[1].length,3);assert.ok(q[2]>=0&&q[2]<3);assert.ok(q[3].length>20);}
  assert.ok(Array.isArray(c.source)&&Array.isArray(c.cross)&&c.details.length>=1);
  assert.doesNotMatch(JSON.stringify(c),/(사세요|파세요|매수하세요|매도하세요)/,c.id+' no advice');
 });
 const R=JSON.parse(fs.readFileSync(path.join(__dirname,'../review.json'),'utf8'));assert.equal(R.book,'grid');assert.deepEqual(Object.keys(R.chapters),ids);
 Object.values(R.chapters).forEach(list=>{assert.ok(list.length>=2&&list.length<=3);list.forEach(q=>{assert.equal(q.choices.length,3);assert.ok(q.answer>=0&&q.answer<3);});});
});

test('review.json numbers',()=>{
 assert.equal(M.simulate({path:[19900,18700],levels:LV,qty:5}).buys,6);
 const r=M.roundTrip(19800,20000,10);assert.deepEqual([r.buyFee,r.sellFee,r.tax,r.net],[29,30,400,1541]);near(M.costRate({tax:0}),.03,1e-12);
 const n=M.gridReport(M.arithmeticLevels(19000,21000,20),5);assert.equal(n.minStep,100);assert.equal(n.netPerCycle,5409);
 const w=M.simulate({path:SWING,levels:M.arithmeticLevels(18000,22000,40),qty:5});assert.deepEqual([w.roundTrips,w.realized],[99,27009]);
 const l=M.lossAt(LV,6,16000);assert.equal(l.cost,2388349);assert.equal(l.value-l.exitCost,1915872);
 assert.deepEqual(M.geometricLevels(18000,22000,20).slice(1,3),[18180,18360]);
});
