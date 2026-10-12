/* 거래 규칙 계산의 대표값·경계값. 안내 상자(js/lab-guides.js) 결과 읽기의 숫자도 여기서 대조한다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const ASKS=[[19960,120],[19970,300],[19980,500],[19990,800],[20000,1200]];
test('stock tick size changes exactly at each price boundary',()=>{
 const cases={1999:1,2000:5,4995:5,5000:10,19990:10,20000:50,49950:50,50000:100,199900:100,200000:500,499500:500,500000:1000};
 for(const [p,t] of Object.entries(cases))assert.equal(M.tickSize(+p),t,p);
 assert.equal(M.tickSize(1999,'etf'),1);assert.equal(M.tickSize(2000,'etf'),5);assert.equal(M.tickSize(600000,'etf'),5);
});
test('valid prices and rounding to the nearest tick across the 20,000 boundary',()=>{
 assert.ok(M.isValidPrice(19990));assert.ok(!M.isValidPrice(20030));assert.ok(!M.isValidPrice(19995));assert.ok(M.isValidPrice(19995,'etf'));assert.ok(!M.isValidPrice(0));
 assert.equal(M.roundToTick(20030,'stock','down'),20000);assert.equal(M.roundToTick(20030,'stock','up'),20050);
 assert.equal(M.roundToTick(19995,'stock','down'),19990);assert.equal(M.roundToTick(19995,'stock','up'),20000);assert.equal(M.roundToTick(49990,'stock','up'),50000);
});
test('ladder steps change size at 20,000',()=>{assert.deepEqual(M.ladder(20000,3),{down:[19970,19980,19990],price:20000,up:[20050,20100,20150]});assert.deepEqual(M.ladder(19990,2).up,[20000,20050]);});
test('price limits are ±30% snapped inside the band',()=>{
 assert.deepEqual([M.priceLimits(19950).upper,M.priceLimits(19950).lower],[25900,13970]);
 assert.deepEqual([M.priceLimits(52300).upper,M.priceLimits(52300).lower],[67900,36700]);
 assert.deepEqual([M.priceLimits(9980).upper,M.priceLimits(9980).lower],[12970,6990]);
 assert.deepEqual([M.priceLimits(19000).upper,M.priceLimits(19000).lower],[24700,13300]);
 assert.deepEqual([M.priceLimits(1000).upper,M.priceLimits(1000).lower],[1300,700]);
 const l=M.priceLimits(19950);assert.ok(l.upPct<=30&&l.downPct>=-30);
});
test('market order sweeps the book: average price and slippage',()=>{
 let r=M.sweep(ASKS,100);assert.equal(r.avg,19960);assert.equal(r.slip,0);
 r=M.sweep(ASKS,1000);assert.equal(r.fills.length,4);assert.ok(Math.abs(r.avg-19975.4)<1e-9);assert.equal(r.slipPct.toFixed(3),'0.077');
 r=M.sweep(ASKS,500);assert.ok(Math.abs(r.avg-19969.2)<1e-9);
 r=M.sweep(ASKS,3000);assert.equal(r.filled,2920);assert.equal(r.unfilled,80);assert.equal(r.avg.toFixed(2),'19989.11');assert.equal(r.slipPct.toFixed(3),'0.146');
 assert.equal(M.sweep(ASKS,0).filled,0);
 const s=M.spread(19950,19960);assert.equal(s.won,10);assert.equal(s.pct.toFixed(3),'0.050');
});
test('time priority queue fills those ahead first',()=>{
 assert.equal(M.queueFill(800,100,500).status,'대기');
 assert.deepEqual(M.queueFill(800,100,850),{toAhead:800,toMine:50,mineLeft:50,need:900,status:'일부 체결'});
 assert.equal(M.queueFill(0,100,100).status,'전부 체결');assert.equal(M.queueFill(800,100,0).toAhead,0);
});
test('single-price auction picks the price with the most volume',()=>{
 const buys=[[20100,100],[20050,200],[20000,300],[19990,400],[19950,500],[19900,300]],sells=[[19900,200],[19950,300],[19990,400],[20000,400],[20050,300],[20100,200]];
 assert.deepEqual(M.auction(buys,sells,19950).best,{price:19990,demand:1000,supply:900,volume:900,imbalance:100});
 assert.equal(M.auction([...buys,[Infinity,600]],sells,19950).best.price,20000);assert.equal(M.auction([...buys,[Infinity,600]],sells,19950).best.volume,1200);
 const cb=[[20050,100],[20000,200],[19990,300],[19950,300],[19900,400]],cs=[[19900,600],[19950,500],[19990,300],[20000,300],[20050,200]];
 assert.deepEqual(M.auction(cb,cs,19950).best,{price:19950,demand:900,supply:1100,volume:900,imbalance:200});
 assert.equal(M.auction([[19900,10]],[[20000,10]],19950).best,null);
});
test('VI triggers: dynamic on a jump, static on a slow crash, none under a higher threshold',()=>{
 const jump=[19950,19980,20000,20050,20700,20900,21000,21200,21300,21400,21500,21600],crash=[19950,19900,19850,19800,19500,19000,18600,18200,17900,17700,17500,17950];
 assert.deepEqual([M.viCheck(jump,19950,3).index,M.viCheck(jump,19950,3).type,M.viCheck(jump,19950,3).move.toFixed(2)],[4,'동적','3.24']);
 assert.equal(M.viCheck(jump,19950,4.5),null);
 assert.deepEqual([M.viCheck(crash,19950,3).index,M.viCheck(crash,19950,3).type,M.viCheck(crash,19950,3).move.toFixed(2)],[8,'정적','-10.28']);
 assert.equal(M.viCheck(crash,19950,2).index,5);
 assert.equal(M.viCheck([20000,18000],20000,50).type,'정적');assert.equal(M.viCheck([19950,19400],19950,3),null);assert.equal(M.viCheck([10000,9700],10000,3,50).type,'동적');
 assert.deepEqual([M.breakerLevel(7.9),M.breakerLevel(8),M.breakerLevel(15),M.breakerLevel(20)],[0,1,2,3]);
});
test('base price adjustments',()=>{
 assert.equal(M.rightsBase(20000,.25,15000).base,19000);assert.equal(M.rightsBase(20000,1,0).base,10000);
 assert.equal(M.rightsBase(20000,.25,20000).base,20000);assert.equal(M.splitBase(50000,5000,100).base,1000);assert.equal(M.splitBase(20000,5000,1000).base,4000);
});
test('settlement skips weekends and 2026 holidays',()=>{
 const H=['2026-09-24','2026-09-25','2026-10-05','2026-10-09'];
 assert.equal(M.addBusinessDays('2026-09-23',2,H),'2026-09-29');assert.equal(M.addBusinessDays('2026-09-22',2,H),'2026-09-28');
 assert.equal(M.addBusinessDays('2026-10-08',2,H),'2026-10-13');assert.equal(M.addBusinessDays('2026-10-01',2,H),'2026-10-06');
 assert.equal(M.addBusinessDays('2026-10-12',2,H),'2026-10-14');assert.equal(M.addBusinessDays('2026-10-16',2),'2026-10-20');
 assert.deepEqual(M.shortfall(1995000,1500000,19000),{due:495000,sellQty:27});assert.deepEqual(M.shortfall(1995000,2000000,19000),{due:0,sellQty:0});
});
test('round trip costs and break-even sell price',()=>{
 assert.deepEqual(M.roundTrip(19950,20000,10),{buyAmt:199500,sellAmt:200000,buyFee:29,sellFee:30,tax:400,costs:459,gross:500,net:41});
 assert.equal(M.roundTrip(19950,20000,100).net,401);assert.equal(M.roundTrip(19950,20000,10,.015,0).net,441);
 assert.equal(M.breakEven(19950,10),20000);assert.equal(M.breakEven(19950,10,.015,0,'etf'),19960);
 assert.ok(M.isValidPrice(M.breakEven(20030,10)),'off-tick buy still gives an orderable break-even');assert.equal(M.breakEven(20030,10),20100);
});
test('grid cells: tick validity, cost and the narrowest profitable step',()=>{
 const sheet=M.gridSheet(19970,30,6,10);
 assert.deepEqual(sheet.map(c=>c.valid),[true,false,false,false,false,false]);assert.equal(sheet[0].net,-159);assert.ok(sheet.every(c=>!c.profitable));
 assert.equal(M.minGridStep(19970,1,10),80);assert.equal(M.minGridStep(20000,1,10),50);assert.equal(M.minGridStep(19970,1,10,.015,0,'etf'),10);
 assert.equal(M.minGridStep(19970,6,10),null);
 const fixed=M.gridSheet(20000,50,6,10);assert.ok(fixed.every(c=>c.profitable));assert.equal(fixed.reduce((s,c)=>s+c.net,0),219);
 assert.equal(M.gridSheet(19970,30,6,10,.015,0,'etf').reduce((s,c)=>s+c.net,0),1441);
 assert.equal(M.gridCell(19970,30,10,.015,0,'etf').net,241);assert.equal(M.gridCell(20000,30,10).validSell,false);
});
test('claims and venue examples used in chapters 1 and 2',()=>{
 assert.deepEqual(M.claims(100,30),{toBond:30,toEquity:70,bondShort:0});assert.deepEqual(M.claims(20,30),{toBond:20,toEquity:0,bondShort:10});assert.deepEqual(M.claims(-50,30),{toBond:0,toEquity:-50,bondShort:30});
 const v=M.bestVenue([{name:'KRX',ask:19960,fee:.015},{name:'NXT',ask:19950,fee:.0145}],100);assert.deepEqual(v.map(x=>[x.name,x.total]),[['NXT',1995289],['KRX',1996299]]);
 const w=M.bestVenue([{name:'KRX',ask:19950,fee:.015},{name:'NXT',ask:19960,fee:.0145}],1000);assert.equal(w[1].total-w[0].total,9902);
});
test('choiceOrder rotates the answer into the target slot',()=>{
 for(let a=0;a<3;a++)for(let t=0;t<3;t++){const o=M.choiceOrder(3,a,t);assert.equal(o[t],a);assert.deepEqual([...o].sort(),[0,1,2]);}
});
test('market hours table: KRX after-market replaces the old single-price session, NXT after starts 15:40',()=>{
 const src=require('node:fs').readFileSync(require('node:path').join(__dirname,'../js/labs-after.js'),'utf8');
 assert.match(src,/\['애프터마켓','16:00','20:00'\]/);assert.match(src,/\['애프터마켓','15:40','20:00'\]/);assert.doesNotMatch(src,/\['시간외 단일가'/);
});
