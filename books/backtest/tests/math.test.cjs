/* 계산 검사: js/data.js의 가상 기록과 js/math.js의 계산이 조사 노트(docs/research.html V-0~V-11, calc13.py)의 기준값과 같은지, 경계값과 불변 조건.
   마지막 테스트들은 content.js와 review.json의 모든 숫자가 여기서 계산했거나 문제에 주어진 숫자인지(given.cjs),
   L2와 확인 문제의 답이 그 장의 본문에 먼저 나오지 않는지 본다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const D=require('../js/data.js'),M=require('../js/math.js');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const r2=x=>M.round(x*100,2),r3=x=>M.round(x,3);

/* 책에 나오는 계산값을 한곳에 모은다. 아래 테스트가 기대값과 대조하고, 숫자 출처 검사가 쓴다. */
const C={};const put=(k,v)=>{C[k]=v;return v;};
const WF=put('waterfall',M.waterfall()),A5=put('a5',M.a5Stats()),AU=put('audit',M.audit());
put('years',[0,1,2,'all'].map(y=>M.yearRun(y)));
put('data',{adj:M.adjust().bars[0],factor:M.adjust().factors[0],fills:M.adjFills(),surv:M.survivorship(),stats:M.dataStats(),first:M.records().bars[0]});
put('look',{bug:M.stopDays('bug'),fixed:M.stopDays('fixed'),mixA:M.assumptionRun({data:'real',code:'bug',order:'low',rule:'touch',cost:false,resume:'fixed'}),mixB:M.assumptionRun({data:'real',code:'fixed',order:'low',rule:'touch',cost:false,resume:'bug'}),gap:M.step('A1').pnl-M.step('A2').pnl});
put('fills',{day430:M.dayCompare(430),rt:M.roundTrip(20000,20200,5),rtEtf:M.roundTrip(35000,35050,10,true),L2a:M.barCell(19800,20000,5,[19900,20050,19780,19950]),L2b:M.barCell(19800,20000,5,[19900,20050,19780,19950],'onefill'),cellShare:200*5});
put('metrics',{boot1000:M.bootstrap(A5.r,1000),L2:M.monthly([2,-1,3,0,1,-2].map(x=>x/100),[100,104,101,106,99,103])});
const OV=put('overfit',{o402:M.overfit(402),alt:M.overfit(402,true),o10:M.overfit(10),o100:M.overfit(100),emax:[10,100,402,1000].map(N=>M.emax(N)),emaxT:[10,100,402,1000].map(N=>M.emax(N,500)),sim:M.emaxSim(),wf:M.walkForward(),isd:M.isBestDetail(),L2:M.rankCheck([18,15,12,9,6],[-2,4,7,3,5]),n:M.combos().length});
put('api',{s16:M.schedule(16),s20:M.schedule(20),cpd:M.callsPerDay(10,5)});
put('orders',{story:M.orderFlow(19500,8,[{type:'ack',id:1},{type:'fill',qty:3,id:2},{type:'cancelReq',id:3},{type:'cancelAck',id:4}]),L2:M.orderFlow(18750,10,[{type:'ack',id:1},{type:'fill',qty:4,id:2},{type:'cancelReq',id:3},{type:'cancelAck',id:4}])});
const STOPC={loss:M.lossLimit(3e6,2),count:20,same:true,hold:128,recon:true,delay:5};
put('limits',{dup:M.stopCheck(M.STOP_LOGS.dup,STOPC),crash:M.stopCheck(M.STOP_LOGS.crash,STOPC),normal:M.stopCheck(M.STOP_LOGS.normal,STOPC),L2:M.stopCheck({requests:M.parseRequests('B2,B3,B4,B5,B6,B7,B8,B9,B10').requests.map(r=>({...r,later:true}))},{count:8,same:true,loss:60000}),check:M.lossLimit(5e6,1.5),v12:16*8});
put('monitor',{d20:M.monitorDays(20),L2:M.matchFills(M.parseFills('B 19250 19250; B 19000 18950; S 19000 19250'),M.parseFills('B 19250 19250; S 19250 19500; B 19000 19000; S 19000 19250'),8),check:-2116-(-2441)});
put('final',{L2:M.reconValue(75,60,35150),check:M.residual(-52140,-38600,-4920),rest:AU.total-AU.bt});
/* 복습 문항의 계산(새 사례와 오답 보기 포함). */
put('rv',{ann:M.annualize(4e6,4.66e6,750),surv:M.survivorSimple(15,0.06,5,-0.6),div:M.divFactor(400,20000),stop:M.stopLines(50,18100,17200,17500,17500),rt:M.roundTrip(19000,19250,8),mon:M.monthly([1,3,-2,2].map(x=>x/100),[100,110,99,105]),
 rank:M.rankCheck([20,16,13,10],[2,6,-1,4]),sched:M.schedule(14,3),of:M.orderFlow(19250,12,[{type:'ack',id:1},{type:'fill',qty:5,id:2},{type:'cancelReq',id:3},{type:'cancelAck',id:4}]),loss:M.lossLimit(8e6,1.2),
 mf:M.matchFills(M.parseFills('B 19500 19500; B 19250 19200'),M.parseFills('B 19500 19500; S 19500 19750; B 19250 19250'),10),dup:10*19000-196000,res:M.residual(-70000,-50000,-6000),emaxLong:M.emax(402,1000)});

test('the record is generated once in data.js and matches the reference path (V-0)',()=>{
 const R=D.records();assert.equal(R.path.length,750);assert.equal(R.path[0].length,8);assert.equal(R.path[0][0],20000);
 for(const d of [0,240,430,499,500,559,749])for(const p of R.path[d])assert.equal(p%D.tick(p),0,'tick '+d);
 const ref=JSON.parse(read('tests/fixtures/path-sample.json'));for(const [d,row] of Object.entries(ref))assert.deepEqual(R.path[+d],row,'path day '+d);
 assert.deepEqual(D.records().altPath.slice(0,500),R.path.slice(0,500),'the alternative year 3 shares years 1-2');
 assert.match(D.SCENARIO.label,/가상/);assert.deepEqual(D.EX,[240,490,740]);assert.equal(D.DIV,400);
 assert.ok(!/document|window\.document/.test(read('js/math.js').replace(/\/\*[\s\S]*?\*\//g,'')),'math.js does not touch the DOM');
});
test('mulberry32 and the tick table behave as in calc13.py',()=>{
 const r=D.mulberry32(13);assert.equal(r().toFixed(10),D.mulberry32(13)().toFixed(10));
 assert.deepEqual([D.tick(1999),D.tick(2000),D.tick(19990),D.tick(20000),D.tick(49950),D.tick(50000)],[1,5,10,50,50,100]);
 assert.equal(D.rtick(19994),19990);assert.equal(D.rtick(20024),20000);
});
test('three ⏱ values live in MARKET with labels, the check date and integer fractions',()=>{
 assert.equal(M.CHECKED,'2026-10-14');const t=Object.entries(M.MARKET).filter(([,v])=>v&&v.timeSensitive).map(([k])=>k);assert.deepEqual(t,['tradeTax','fee','tick']);
 assert.equal(M.MARKET.tradeTax.label,'보도 기준 · 4권·11권 서재 안 재인용 · 법령 원문 확인 못함');assert.equal(M.MARKET.fee.label,'가정');
 assert.deepEqual([M.MARKET.fee.num,M.MARKET.fee.den,M.MARKET.tradeTax.num,M.MARKET.tradeTax.den],[15,100000,2,1000]);
 assert.equal(M.MARKET.recheck,'세율과 수수료는 바뀌므로 확인일을 보고 다시 확인하세요');assert.equal(M.MARKET.nextRecheck,'2027-04-14');
 assert.deepEqual([M.fee(100000),M.fee(101000),M.fee(99999),M.tax(101000),M.tax(101000,true),M.tax(499)],[15,15,14,202,0,0]);
});
test('assumption waterfall (V-1~V-4): 6.24 · 12.25 · 11.22 · 9.09 · 7.94 · 5.62 · 3.05%',()=>{
 assert.deepEqual(WF.map(s=>s.key),['A0','A1','A2','A3','A4','A5','T']);assert.deepEqual(WF.map(s=>r2(s.ann)),[6.24,12.25,11.22,9.09,7.94,5.62,3.05]);
 const S=Object.fromEntries(WF.map(s=>[s.key,s]));
 assert.deepEqual([S.A0.pnl,S.A0.trips,S.A0.stops],[597385,1289,15]);assert.deepEqual([S.A1.pnl,S.A1.trips,S.A1.stops,S.A1.div],[1242550,1724,6,54000]);
 assert.deepEqual([S.A2.pnl,S.A2.trips],[1127550,1721]);assert.equal(S.A3.trips,1045);assert.deepEqual([S.A4.trips,S.A4.div],[979,52000]);
 assert.deepEqual([S.A5.pnl,S.A5.fees,S.A5.tax],[534912,30162,208226]);assert.deepEqual([S.T.pnl,S.T.trips,S.T.fees,S.T.tax],[283251,1142,34905,240544]);
 assert.equal(C.look.gap,115000);assert.deepEqual([r2(C.look.mixA.ann),r2(C.look.mixB.ann)],[12.21,11.25]);
});
test('year runs and the 1장 calculators',()=>{
 const [y1,y2,y3,all]=C.years;assert.deepEqual([r2(y1.ann),y1.pnl,y1.trips,y1.stops,y1.unreal,y1.shares],[25.30,759050,818,0,-106500,75]);
 assert.deepEqual([r2(y2.ann),y2.pnl,y2.trips,y2.stops],[11.80,354050,580,3]);assert.deepEqual([r2(y3.ann),y3.pnl,y3.trips,y3.stops],[1.10,33100,315,3]);assert.equal(r2(all.ann),12.25);
 const L2=M.closeOnlyCell(35000,35500,10,[35100,34900,35600,35300],true);assert.deepEqual([L2.trips,L2.net,L2.fees],[1,4895,105]);
 assert.equal(r2(M.annualize(2e6,2.42e6,500)),10.00);
});
test('data chapter (V-2): adjustment factor, never-traded fills, survivorship',()=>{
 assert.equal(C.data.factor.toFixed(6),'0.939668');assert.deepEqual(C.data.adj,[18793,19028,18605,19028]);assert.deepEqual([C.data.fills.total,C.data.fills.never],[2818,2799]);
 const s=C.data.surv;assert.deepEqual([s.n,s.delisted],[20,4]);assert.deepEqual(s.list.filter(x=>x.delisted!=null).map(x=>x.delisted).sort((a,b)=>a-b),[171,278,375,614]);assert.deepEqual([r2(s.meanAll),r2(s.meanAlive),r2(s.bias)],[-13.18,-1.32,11.86]);
 const sp=M.splitReturns(40000,2,20100);assert.deepEqual([r2(sp.raw),r2(sp.adjusted)],[-49.75,0.50]);
 const q=M.survivorSimple(7,0.12,3,-0.8);assert.deepEqual([r2(q.alive),r2(q.all)],[12,-15.6]);
});
test('look-ahead chapter (V-3): six stop days, bug prices, shares on day 430',()=>{
 const b=C.look.bug.stops,f=C.look.fixed.stops;assert.deepEqual(b.map(x=>x.day),[415,430,458,670,713,745]);assert.deepEqual(b.map(x=>x.price),[17830,18390,17670,17570,17660,18010]);
 assert.ok(f.every(x=>x.price===17500));assert.deepEqual([b[1].shares,f[1].shares],[30,40]);
 assert.deepEqual(M.stopLines(40,18300,17300,17600,17500),{bug:732000,fixed:700000,diff:32000});assert.equal(M.stopLines(40,17400,17300,17450,17500).diff,0,'gap below the stop: both sell at the open');
});
test('fills chapter (V-4): bar calculators, round trips and the 430일째 bar',()=>{
 const {L2a,L2b,rt,rtEtf}=C.fills;assert.deepEqual([L2a.trips,L2a.total,L2a.fees,L2a.tax],[1,771,29,200]);assert.deepEqual([L2b.trips,L2b.held,L2b.total,L2b.fees],[0,true,736,14]);
 const gap=M.barCell(19800,20000,5,[19700,20100,19600,19900]);assert.deepEqual([gap.trips,gap.fills[0][1],gap.total],[1,19700,1271],'opening below the resting buy fills at the open');
 assert.deepEqual([rt.feeBuy,rt.feeSell,rt.tax,rt.cost,rt.cost*3],[15,15,202,232,696]);assert.deepEqual([rtEtf.net,rtEtf.tax],[396,0]);
 const d=C.fills.day430;assert.deepEqual([d.low.buys,d.low.sells,d.high.buys,d.high.sells,d.path.buys,d.path.sells],[2,1,1,0,1,0]);assert.equal(d.points.length,8);
});
test('metrics chapter (V-5): A5 metrics, bootstrap, yearly Sharpe, buy-and-hold',()=>{
 assert.deepEqual([r2(A5.ann),r2(A5.vol),r3(A5.sharpe),r2(A5.mdd),A5.peakDay,A5.troughDay],[5.62,12.43,0.502,-10.14,401,746]);
 assert.deepEqual([r2(A5.boot.lo),r2(A5.boot.hi),r2(A5.boot.pNeg)],[-7.91,21.37,22.67]);assert.deepEqual(A5.years.map(r3),[1.063,0.670,-0.460]);assert.equal(M.round(A5.lag1,2),-0.20);
 const h=A5.hold;assert.deepEqual([h.shares,h.end,r2(h.total),r2(h.ann),r2(h.vol),r3(h.sharpe),r2(h.mdd),h.peakDay,h.troughDay],[149,2977203,-0.76,-0.25,42.03,0.204,-22.26,16,448]);
 const m=C.metrics.L2;assert.deepEqual([r3(m.sharpe),r3(m.annual),r2(m.mdd)],[0.293,1.014,-6.60]);
});
test('overfit chapter (V-6): 402 settings, in-sample best, out-of-sample rank, alternative year, walk-forward, E[max]',()=>{
 const o=OV.o402;assert.equal(OV.n,402);assert.deepEqual([r2(o.isBest),r2(o.oosBest),o.oosRank,r2(o.isMedian),r2(o.oosMedian),r3(o.rho)],[23.23,6.83,82,11.98,-2.18,-0.161]);
 assert.deepEqual([o.cfg.low,o.cfg.top,o.cfg.step,o.cfg.n,o.cfg.q],[17500,21500,250,16,8]);assert.deepEqual([r3(OV.isd.metrics.sharpe),r2(OV.isd.metrics.vol),r2(OV.isd.metrics.mdd)],[1.503,14.62,-5.82]);
 assert.deepEqual([r2(OV.isd.v12.is),r2(OV.isd.v12.oos),r2(OV.isd.v12.altOos)],[11.51,-5.75,16.74]);
 const a=OV.alt;assert.deepEqual([r2(a.oosBest),a.oosRank,r2(a.oosMedian),r3(a.rho)],[22.82,44,15.60,0.841]);
 assert.deepEqual(OV.wf.map(w=>[r2(w.trainBest),r2(w.test)]),[[31.24,11.45],[27.91,12.81]]);
 assert.deepEqual(OV.emax.map(e=>M.round(e.z,4)),[1.5746,2.5306,2.9863,3.2551]);assert.deepEqual(OV.emax.map(e=>r3(e.sharpe)),[1.113,1.789,2.112,2.302]);
 assert.deepEqual([10,100,402,1000].map(N=>r3(OV.sim[N])),[1.094,1.764,2.093,2.301]);
 for(let i=1;i<4;i++)assert.ok(OV.emax[i].z>OV.emax[i-1].z,'E[max z] grows with N');
 assert.deepEqual(OV.L2,{best:0,oosRank:5,gap:20});assert.equal(M.invNorm(0.975).toFixed(6),'1.959964');
});
test('api and orders chapters (V-7, V-8): schedule, state machine, reconciliation',()=>{
 assert.deepEqual([C.api.s16.total,C.api.s20.last,C.api.s20.total,C.api.cpd],[8,9,10,720]);
 const s=C.orders.story;assert.deepEqual([s.state,s.diff.shares,s.diff.cash],['canceled',3,-58508]);const L=C.orders.L2;assert.deepEqual([L.diff.shares,L.diff.cash],[4,-75011]);
 const o=M.newOrder(19500,8);M.orderStep(o,{type:'ack',id:1});M.orderStep(o,{type:'fill',qty:3,id:2});M.orderStep(o,{type:'fill',qty:3,id:2});assert.equal(o.filled,3,'the same event twice changes nothing');
 M.orderStep(o,{type:'cancelAck',id:3});assert.deepEqual([o.state,M.openQty(o),o.filled+o.canceled+M.openQty(o)],['canceled',0,8],'filled + canceled + open = ordered');
 const blind=M.orderFlow(19000,10,[{type:'ack',id:1},{type:'timeout',id:2},{type:'fill',qty:10,id:3}],{resend:'blind'});assert.deepEqual([blind.orders.length,blind.account.shares,blind.ledger.shares],[2,20,10]);
 const fixed=M.orderFlow(18750,10,[{type:'ack',id:1},{type:'fill',qty:4,id:2},{type:'cancelReq',id:3},{type:'cancelAck',id:4}],{bot:'correct'});assert.deepEqual(fixed.diff,{shares:0,cash:0});
 const r=M.mockSend([{price:19500,qty:8,rid:'a'},{price:19500,qty:8,rid:'a'},{price:19505,qty:8},{price:19250,qty:0}]);assert.deepEqual(r.log.map(x=>x.code),['OK','SAME_ID','BAD_TICK','BAD_QTY']);
});
test('limits chapter (V-9): the duplicate night, a crash, the L2 log',()=>{
 const d=C.limits.dup;assert.deepEqual(d.hit.same.n,2);assert.deepEqual(d.hit.recon.n,5);assert.ok(!d.hit.hold,'hold limit does not catch the duplicates');assert.deepEqual([d.acct,d.ledger],[88,72]);
 const night=d.rows.filter(x=>x.n&&x.n<=3).map(x=>x.ledger);assert.deepEqual(night,[56,56,56]);const open=d.rows.find(x=>x.open!=null);assert.deepEqual([open.acct,open.ledger],[80,64]);
 const chk=d.rows.find(x=>x.check);assert.deepEqual([chk.acct,chk.ledger],[72,56]);
 const c=C.limits.crash;assert.deepEqual([c.hit.delay.n,c.hit.loss.n,c.hit.loss.pnl],[5,7,-67733]);assert.deepEqual(C.limits.normal.hit,{});
 assert.deepEqual(Object.keys(C.limits.L2.hit),['count']);assert.equal(C.limits.L2.hit.count.n,9);assert.equal(C.limits.check,75000);
});
test('monitor chapter (V-10): first 20 days, the L2 pairs',()=>{
 const r=C.monitor.d20,l=r[19];assert.deepEqual([l.mockPnl,l.btPnl,l.diffPnl,l.cumBt,l.cumMock,l.cumMatched],[-71345,-68904,-2441,32,34,30]);assert.equal(r2(l.cumRate),93.75);
 assert.ok(r.every(x=>x.priceDiff===0));assert.deepEqual(r.map(x=>x.recon>0),r.map((_,i)=>i>=10));
 const L=C.monitor.L2;assert.deepEqual([L.matched,L.missed,L.priceDiff,L.rate],[3,1,-400,0.75]);assert.equal(C.monitor.check,325);
 assert.deepEqual(M.alerts(r),{day:10,why:['recon']});
});
test('final task (V-11): causes add up to −89,061원 and the expected value uses the rounded 23.23%',()=>{
 const a=AU;assert.deepEqual([a.bt,a.live,a.fillDiff,a.dupPnl,a.dupCost,a.total],[-64557,-71735,-7178,-17326,311726,-89061]);assert.equal(a.bt+a.fillDiff+a.dupPnl,a.total,'causes add up');
 assert.deepEqual([r2(a.totalPct),a.end,a.ledger,a.account,a.open,a.last,a.expected,a.optimistic,a.optFills],[-2.97,2910939,96,112,19480,18400,154229,-26356,148]);
 assert.deepEqual([a.match.btFills,a.match.mockFills,a.match.matched,a.match.missed,a.match.extra,a.match.priceDiff],[85,92,78,7,14,0]);
 assert.deepEqual([a.mockStats.fills,a.mockStats.trips,a.mockStats.fees,a.mockStats.tax,a.btStats.fills,a.btStats.trips,a.btStats.shares],[92,40,2098,12437,85,37,88]);
 assert.deepEqual(C.final.L2,{shares:15,value:527250});assert.equal(C.final.check,-8620);
 for(const k of ['window60','noVerdict','disclaimer','noAuto','mockOnly'])assert.ok(M.TEXT[k].length>10,k);
 assert.equal(M.TEXT.window60,'봇을 돌린 60일(500~559일째)은 작성 세션이 가격이 곧게 내려가도록 지어낸 구간이고, 시장 경로의 몫 −64,557원은 그 설정에서 나옵니다');
});
test('boundaries and invariants',()=>{
 assert.ok(M.roundTrip(20000,20010,5).net<0,'a gap narrower than the round-trip cost loses');
 const noCost=M.assumptionRun({data:'real',code:'fixed',order:'onefill',rule:'through',cost:false});assert.equal(r2(noCost.ann),7.94,'costs off: A5 equals A4');
 const out=M.run(M.records().bars.slice(0,5).map(()=>[30000,30100,29900,30000]),{levels:M.V12,qty:5});assert.equal(out.book.fills.length,0,'prices outside every cell: no fills');
 for(const key of ['A1','A5','T']){const s=M.step(key),b=s.book;const hold=b.lots.reduce((t,l,i)=>t+(l?1:0),0)*b.q;assert.equal(b.cash+hold*s.lastClose,3e6+b.realized+s.unreal+s.div,'cash + holdings = start + realized + unrealized + dividends ('+key+')');}
 assert.equal(M.audit().bt+M.audit().fillDiff+M.audit().dupPnl,M.audit().total);
 assert.ok(Number.isNaN(M.monthly([0,0,0],[100,100,100,100]).sharpe),'zero spread: no Sharpe, the lab must say so instead of printing NaN');
});
test('every function in math.js and data.js stays under 100 lines',()=>{
 for(const f of ['js/math.js','js/data.js']){const lines=read(f).split('\n');let depth=0,start=null;
  lines.forEach((line,i)=>{const o=(line.match(/\{/g)||[]).length,c=(line.match(/\}/g)||[]).length;if(start===null&&/(function\b|=>\s*\{)/.test(line)&&depth===1)start=[i,depth];depth+=o-c;if(start&&depth<=start[1]){assert.ok(i-start[0]+1<=100,`${f}:${start[0]+1} ${i-start[0]+1} lines`);start=null;}});}
});

/* 문제에 주어진 입력·날짜·장 번호·권 번호·가정·출처 값·오답 보기. 계산값(C)과 함께 본문 숫자의 출처가 된다. */
const GIVEN=require('./given.cjs');
const allowedNumbers=()=>{
 const computed=new Set(),seen=new WeakSet();
 const add=v=>{if(typeof v!=='number'||!Number.isFinite(v))return;const a=Math.abs(v);if(a>=1e4){const w=Math.round(a);computed.add((w%1e4).toLocaleString('en-US'));computed.add(Math.floor(w/1e4).toLocaleString('en-US'));}for(const x of [a,a*100])for(const dd of [0,1,2,3,4,5,6]){const y=M.round(x,dd);computed.add(y.toFixed(dd));computed.add(y.toLocaleString('en-US',{minimumFractionDigits:dd,maximumFractionDigits:dd}));}computed.add(String(a));};
 const walk=(o,depth=0)=>{if(depth>6)return;if(o instanceof Float64Array)return;if(Array.isArray(o)){if(o.length>3000)return;o.forEach(x=>walk(x,depth+1));}else if(o&&typeof o==='object'){if(seen.has(o))return;seen.add(o);Object.values(o).forEach(x=>walk(x,depth+1));}else add(o);};
 walk(C);walk(M.ASSUME);walk(M.MARKET);walk(M.FACTS);walk(D.SCENARIO);return new Set([...computed,...GIVEN]);
};
const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=ctx.window.BBook,REV=JSON.parse(read('review.json'));
test('every number in content.js and review.json is computed above or given in the problem',()=>{
 const allowed=allowedNumbers(),strip=s=>String(s).replace(/<[^>]+>/g,' ');
 const text=strip(JSON.stringify(B.chapters.map(c=>[c.title,c.subtitle,c.desc,c.recall,c.paragraphs,c.formula,c.formulaNote,c.flow,c.details,c.warning,c.quiz,c.transfer,c.cross.map(x=>x[2])]))+JSON.stringify(REV.chapters));
 const missing=[...new Set(text.match(/\d[\d,]*\d(?:\.\d+)?|\d(?:\.\d+)?/g))].filter(t=>!allowed.has(t.replace(/,$/,'')));
 assert.deepEqual(missing,[],'numbers with no computation or given input: '+missing.join(' '));
});
/* L2 답: 그 장의 글 전체(본문·상자·확인·전이)와 그 장의 복습 문항에 나오지 않는다. */
const L2={backtest:['4,895'],data:['49.75','0.50%'],lookahead:['32,000'],fills:['771','736'],metrics:['0.293','1.014','6.60'],overfit:['20%p','5위'],api:['9초째','9~10초'],orders:['75,011'],limits:['아홉 번째'],monitor:['−400','75%'],final:['527,250']};
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
test('L2 answers from docs/index.html #chapters are not stated in that chapter or its review questions',()=>{
 for(const c of B.chapters){const all=JSON.stringify(c)+JSON.stringify(REV.chapters[c.id]);
  for(const s of L2[c.id])assert.doesNotMatch(all,new RegExp('(?<![\\d.,])'+esc(s)+'(?![\\d])'),c.id+' L2 answer leaked: '+s);}
});
test('확인 answers are not given away in the prose before the quiz',()=>{
 const before=id=>{const c=B.chapters.find(x=>x.id===id);return JSON.stringify([c.subtitle,c.desc,c.paragraphs,c.formula,c.formulaNote,c.flow,c.details,c.warning]);};
 const Q={backtest:[/10\.00%/],data:[/15\.6%/],fills:[/696원/],overfit:[/2\.302/],api:[/720번/],limits:[/75,000원/],monitor:[/\+325/,/−2,116/],final:[/−8,620/]};
 for(const [id,rs] of Object.entries(Q))for(const re of rs)assert.doesNotMatch(before(id),re,id+' 확인 answer before the quiz: '+re);
});
