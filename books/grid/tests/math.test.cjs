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
