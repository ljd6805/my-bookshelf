/* 행동재무학 계산의 대표값·경계값·불변 조건. 기준값은 docs/research.html의 V-0~V-10과 docs/index.html #chapters의 해결 결과·L2·확인·전이 칸이다.
   기대값은 문서의 숫자 문자열로 따로 적고 math.js(PMath)의 결과와 대조한다. 불변 조건(실현 손익 + 평가 손익 = 끝 금액 − 시작 금액,
   PGR·PLR은 0~1, 맞는 폭포 + 틀린 폭포 = 1, 우도비 1이면 확신 그대로, 이항 확률의 합 1, 비용은 정수 원)은 결정적 시드의 무작위 입력에서도 맞아야 한다.
   마지막 테스트들은 content.js와 review.json의 모든 숫자가 여기서 계산했거나 문제에 주어진 숫자인지(given.cjs),
   L2 답이 그 장의 본문·확인 문제·복습 문제에 새어 나가지 않았는지, 확인 문제의 답이 본문에 미리 나오지 않는지 검사한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),M=require('../js/math.js');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const f1=x=>M.round(x,1).toFixed(1),f2=x=>M.round(x,2).toFixed(2),f3=x=>M.round(x,3).toFixed(3),f4=x=>M.round(x,4).toFixed(4),pct=(x,d=1)=>M.round(x*100,d).toFixed(d);
const J=M.JOURNAL;

/* 책에 나오는 계산값을 한곳에 모은다. 아래 테스트가 기대값과 대조하고, 숫자 출처 검사가 쓴다. */
const C={};const put=(k,v)=>{C[k]=v;return v;};
const L=put('ledger',M.ledger()),R=put('replay',M.ruleReplay());
put('frame',{fr:M.frames(1000,200,1/3,600),L2:M.ev([[0.25,0],[0.75,-800]]),lives:{saved:200,die:400,people:600},kelly:0.55-0.45});
put('prospect',{v100:M.value(100),v200:M.value(200),vm100:M.value(-100),v300:M.value(300),pv:M.prospect(200,100),pvW:M.prospect(200,100,{weighting:true}),G:M.threshold(100),GW:M.threshold(100,{weighting:true}),
 table:M.weightTable(),ce:[M.certainty(0.01,1000),M.certainty(0.99,1000),M.certainty(0.01,-1000)],ceEV:[10,990,-10],L2:M.threshold(100,{alpha:1,beta:1}),check:M.prospect(300,100),checkW:M.prospect(300,100,{weighting:true}),
 transfer:[M.threshold(100,{lambda:1.955,alpha:1,beta:1}),M.threshold(100,{lambda:1.955})],edge:M.threshold(100,{lambda:1,alpha:1,beta:1}),ev:M.prospect(200,100).ev});
put('disp',{a:M.disposition(1,13,L),b:M.disposition(14,26,L),all:M.disposition(1,26,L),L2:M.pgrPlr({RG:2,PG:6,RL:1,PL:9}),odean:[0.148/0.098,0.098/0.148,0.148-0.098],transfer:M.pgrPlr({RG:3,PG:1,RL:3,PL:1}),
 up5:22600/20000-1,hold:M.holding(L)});
put('base',{main:M.bayes(0.02,0.6,0.1),L1:M.bayes(0.03,0.8,0.1),L2:M.bayes(0.05,0.8,0.2),check:M.bayes(0.02,0.6,0.05),transfer:M.bayes(0.2,0.6,0.1),
 table:{notFlaggedDoubles:20-12,notFlagged:980-98,notFlaggedAll:1000-110,others:980,double:2*M.bayes(0.02,0.6,0.1).posterior,checkFalse:980*0.05,checkFlagged:12+49,tDoubles:200,tHits:120,tOthers:800,tFalse:80,tWrong:120/1000}});
const E=M.evidence();
put('conf',{all:E.all,support:E.supportOnly,L2:[M.oddsUpdate(0.4,[3,0.25]),M.oddsUpdate(0.4,[3])],check:M.oddsUpdate(0.5,[2,1.5,1.5,0.5,0.4,0.5]),priorOdds4:0.02/0.98*6,gap:E.supportOnly.p-E.all.p,
 against:0.5*0.4,denoms:[1+E.all.odds,1+E.supportOnly.odds,1.45],half:E.all.p/2,lr07:0.7/0.3});
const IV=M.intervals(),TO=M.turnover(L);
put('over',{iv:IV,to:TO,drag:M.ASSUME.cost.turnovers.map(t=>M.costDrag(t)),ten:[0,...M.ASSUME.cost.turnovers].map(t=>M.growthAfter(2000,0.06,M.costDrag(t),10)),rt:M.roundTrip(),rtEtf:M.roundTrip(true),
 L2:{rate:11/20,expect:20*0.9,p:M.binomCdf(11,20,0.9)},check:{cost:M.tradeCost(1e8),share:M.tradeCost(1e8)/2e7,turn:1e8/2e7,wrong:[M.tradeCost(1e8)/10,M.tradeCost(1e8)/10/2e7,M.tradeCost(1e8)*10,M.tradeCost(1e8)*10/2e7]},
 transfer:{cost:M.tradeCost(1e8,true),share:M.tradeCost(1e8,true)/2e7},barber:[0.179-0.114,0.179-0.164],costShare:L.cost/J.start});
put('herd',{odds:M.ASSUME.cascade.ps.map(p=>M.cascadeOdds(p)),no10:M.ASSUME.cascade.ps.map(p=>M.noCascade(p,10)),third:[0.6,0.7,0.8,0.9].map(p=>M.thirdPerson(p)),check:M.cascadeOdds(0.9),
 checkParts:[0.81,1.1*0.1,2*0.91],r7:M.cascadeOdds(0.7),r7parts:[0.7*1.7,0.49-0.7+1,2*0.79]});
put('outcome',{rows:M.ASSUME.outcome.ns.map(n=>M.outcomeDist(0.55,n)),L2:M.outcomeDist(0.55,10),check:M.outcomeDist(0.5,10),transfer:M.outcomeDist(0.52,250),each:[0.55-0.45,0.52-0.48],lose52:1-0.52,half:250/2});
put('rules',{path:M.pathRule(),newPath:M.pathRule({name:'새벽전자',qty:200,prices:[30000,28500,27000,29000,31500]}),newPrices:[30000,28500,27000,29000,31500],L2:M.stopGap(300,18000,16500),r2end:400*19300/L.end,r2wrong:400*19300/J.start,r2amount:400*19300,
 cashShare:L.cash/L.end,avg8:L.weeks[7].hold['온결식품'].cost/250,newCost:[30000*200,M.fee(30000*200),27000*200,M.fee(27000*200),M.tax(27000*200,'새벽전자'),30000*200+M.fee(30000*200)],r15:M.ruleReplay({r1:0.15}),r5:M.ruleReplay({r1:0.05})});
put('final',{audit:M.audit(),form:M.formCheck()});
/* 복습 문항의 계산(새 사례와 오답 보기 포함) */
put('rv',{frame:[M.ev([[0.5,200],[0.5,0]]),700-100,700-200,500+100],prospect:[M.prospect(100,100),M.value(100)+M.value(-100),M.threshold(100,{lambda:1,alpha:1,beta:1})],
 disp:[M.pgrPlr({RG:4,PG:4,RL:1,PL:4}),4/5],base:[M.bayes(0.1,0.5,0.1),M.bayes(0.01,0.8,0.1),990*0.1,10*0.8],conf:[M.oddsUpdate(0.25,[3]),0.25*3,4*0.25,Math.pow(2,5)],
 over:[6/10,10*0.8,M.costDrag(2)],herd:[M.thirdPerson(0.6),M.cascadeOdds(0.7)],outcome:[M.outcomeDist(0.6,1).each,M.outcomeDist(0.55,4).neg,0.45*0.45*0.45*0.45],
 rules:[M.pathRule().hold-M.pathRule().rule,636018-361832,18100/20000-1,20000*0.9,20000-18100]});

test('the journal, assumptions, the two time-sensitive values and research facts live in one table each, with labels',()=>{
 assert.equal(M.CHECKED,'2026-10-14');assert.equal(M.ASSUME.journal,J);assert.match(J.label,/미리 정한 가상 시나리오/);
 assert.deepEqual([J.start,J.weeks,J.trades.length,J.trades.filter(t=>t.side==='B').length],[20000000,26,15,9]);
 for(const n of J.names)assert.equal(J.prices[n].length,26,n);
 const t=Object.entries(M.MARKET).filter(([,v])=>v&&v.timeSensitive);assert.deepEqual(t.map(([k])=>k),['tradeTax','fee'],'exactly two ⏱ values');
 assert.equal(M.MARKET.tradeTax.label,'보도 기준 · 4권·11권 서재 안 재인용 · 법령 원문 확인 못함');assert.equal(M.MARKET.fee.label,'가정');
 assert.deepEqual([M.MARKET.tradeTax.value,M.MARKET.fee.value],[0.002,0.00015]);assert.equal(M.MARKET.recheck,'세율과 수수료는 바뀌므로 확인일을 보고 다시 확인하세요');
 assert.equal(M.MARKET.nextRecheck,'2027-04-14');assert.deepEqual(M.MARKET.owners,{G3:'은재',G6:'정민',G7:'한결',fixed:'한결(담당)·은재(확인 작업)'});
 const src=read('js/math.js');for(const n of ['15,100000','2,1000'].map(s=>s.split(','))){assert.ok(src.includes(`num:${n[0]},den:${n[1]}`),'integer fee/tax fraction '+n);}
 assert.equal(src.split('20000,20600,21300').length-1,1,'the journal prices appear once (JOURNAL is the single source)');
 assert.ok(!fs.existsSync(path.resolve(__dirname,'..','js/journal.js')),'no second copy of the journal');
 for(const v of Object.values(M.assumptions))assert.match(v,/가정|가상|반올림/);
 assert.deepEqual([M.FACTS.tk1992.lambda,M.FACTS.brown.mean,M.FACTS.odean.pgr,M.FACTS.odean.plr,M.FACTS.gollwitzer.d],[2.25,1.955,0.148,0.098,0.65]);
 assert.equal(M.TEXT.frameNote,'새로고침하면 선택이 사라진다');
});
test('fees and tax use integer floor arithmetic: 600만 원 × 0.015% = 900원, not 899; ETF sells pay no tax',()=>{
 assert.equal(M.fee(6000000),900);assert.equal(6000000*0.00015<900,true,'the float product falls just below 900');assert.equal(M.fee(4500000),675);assert.equal(M.fee(1),0);
 assert.equal(M.tax(5400000,'새벽전자'),10800);assert.equal(M.tax(3780000,'가람200'),0);assert.equal(M.tax(3870000,'누리 해외100'),0);
 assert.throws(()=>M.fee(100.5),/whole number/);assert.throws(()=>M.tax(-1,'새벽전자'),/whole number/);
 assert.equal(f2(M.roundTrip()*100),'0.23');assert.equal(f2(M.roundTrip(true)*100),'0.03');
});
test('V-0 ledger: end 19,569,716원, cash 11,849,716원, 새벽전자 400주 at 20,303.04원, fees 9,624 + tax 25,660 = 35,284, invariant −430,284원',()=>{
 assert.deepEqual([L.end,L.cash,L.fees,L.taxes,L.cost,L.sells],[19569716,11849716,9624,25660,35284,28040000]);
 assert.deepEqual(Object.keys(L.hold),['새벽전자']);assert.equal(L.hold['새벽전자'].qty,400);assert.equal(f2(L.hold['새벽전자'].cost/400),'20303.04');
 assert.deepEqual(L.realized.map(r=>[r.week,r.name,r.pnl]),[[5,'새벽전자',764523],[9,'가람200',78924],[13,'누리 해외100',148862],[18,'가람200',88880],[20,'온결식품',-1154085],[24,'누리 해외100',43829]]);
 const g=C.final.audit;assert.deepEqual([g.gains,g.losses,g.unreal,g.change],[1125018,-1154085,-401217,-430284]);assert.equal(g.gains+g.losses+g.unreal,L.end-J.start,'realized + unrealized = end − start');
 assert.equal(pct(g.ret,2),'-2.15');assert.equal(pct(L.cost/J.start,2),'0.18');
});
test('V-1 frames: A·B +200만, C·D −400만, end 1,200만; L2 −600만 (same as the sure loss); B and D end at 1,600만 or 1,000만',()=>{
 const F=C.frame.fr;assert.deepEqual([F.gain.A.ev,F.gain.B.ev,F.loss.C.ev,F.loss.D.ev,F.endEV,F.loss.start],[200,200,-400,-400,1200,1600]);assert.equal(F.sameEV,true);
 assert.deepEqual(F.gain.B.ends.map(e=>e[1]),[1600,1000]);assert.deepEqual(F.loss.D.ends.map(e=>e[1]),[1600,1000]);assert.equal(C.frame.L2,-600);
 assert.equal(M.sameOrDiff('sure','risky'),'다름');assert.equal(M.sameOrDiff('risky','risky'),'같음');assert.throws(()=>M.sameOrDiff('A','D'),/sure or risky/);
 assert.throws(()=>M.ev([[0.5,1],[0.4,2]]),/add up to 1/);assert.throws(()=>M.frames(1000,200,1,600),/0 < p < 1/);assert.equal(f2(C.frame.kelly),'0.10');
});
test('V-2 value function: v(100) 57.54, v(200) 105.90, PV −11.79, threshold 251.31 (weighted 274.07); w⁺/w⁻ table; CE 37.24 · 900.15 · −25.55; L2 225; 확인 +10.92 (+4.87 weighted); 전이 195.5 · 214.21',()=>{
 const P=C.prospect;assert.deepEqual([P.v100,P.v200,P.vm100,P.pv.value,P.G,P.GW].map(f2),['57.54','105.90','-129.47','-11.79','251.31','274.07']);assert.equal(P.pv.ev,50);assert.equal(P.pv.accept,false);
 assert.deepEqual(P.table.map(r=>f4(r.gain)),['0.0553','0.1316','0.1863','0.4206','0.7117','0.9116']);assert.deepEqual(P.table.map(r=>f4(r.loss)),['0.0397','0.1114','0.1701','0.4540','0.7749','0.9451']);
 assert.deepEqual(P.ce.map(f2),['37.24','900.15','-25.55']);assert.equal(P.L2,225);assert.deepEqual([f2(P.check.value),f2(P.checkW.value)],['10.92','4.87']);
 assert.deepEqual(P.transfer.map(f2),['195.50','214.21']);assert.equal(f2(P.edge),'100.00','λ = 1, α = 1: the threshold equals the loss');
 const flat=M.prospect(200,100,{lambda:1,alpha:1,beta:1});assert.equal(flat.value,flat.ev,'λ = 1 and α = β = 1 give the expected value');
 assert.equal(M.weight(0,0.61),0);assert.equal(M.weight(1,0.61),1);assert.throws(()=>M.value(1,{lambda:0}),RangeError);assert.throws(()=>M.threshold(0),RangeError);
});
test('V-3 PGR/PLR: weeks 1–13 RG 3 PG 2 RL 0 PL 4 → 0.600 · 0.000; 14–26 → 1.000 · 0.200; all 0.714 · 0.111; holding 4.8 and 19 weeks; L2 0.250 · 0.100 · 0.150',()=>{
 const D=C.disp;assert.deepEqual([D.a.RG,D.a.PG,D.a.RL,D.a.PL,f3(D.a.pgr),f3(D.a.plr)],[3,2,0,4,'0.600','0.000']);
 assert.deepEqual([D.b.RG,D.b.PG,D.b.RL,D.b.PL,f3(D.b.pgr),f3(D.b.plr)],[2,0,1,4,'1.000','0.200']);assert.deepEqual([f3(D.all.pgr),f3(D.all.plr)],['0.714','0.111']);
 assert.deepEqual(D.a.days.map(d=>[d.week,d.RG,d.PG,d.RL,d.PL]),[[5,1,1,0,1],[9,1,1,0,1],[13,1,0,0,2]]);
 assert.deepEqual([D.L2.pgr,D.L2.plr,f3(D.L2.gap)],[0.25,0.1,'0.150']);assert.equal(f2(D.odean[0]),'1.51');assert.deepEqual([D.transfer.pgr,D.transfer.plr],[0.75,0.75]);
 assert.deepEqual(D.hold.gains,[4,6,7,4,3]);assert.deepEqual([D.hold.avgGain,D.hold.avgLoss],[4.8,19]);
 assert.equal(M.pgrPlr({RG:1,PG:0,RL:0,PL:0}).plr,null,'zero denominator → cannot compute');assert.throws(()=>M.pgrPlr({RG:1.5,PG:0,RL:0,PL:0}),/whole number/);assert.throws(()=>M.disposition(14,13),RangeError);
});
test('V-4 base rate: 12 + 98 = 110, 10.9%; L1 19.8%; L2 17.4%; 확인 19.7%; 전이 60.0%; edges 0% and 100%',()=>{
 const B=C.base;assert.deepEqual([B.main.grid.hits,B.main.grid.falseHits,B.main.grid.flagged,B.main.grid.doubles],[12,98,110,20]);assert.equal(pct(B.main.posterior),'10.9');
 assert.deepEqual([B.L1,B.L2,B.check,B.transfer].map(x=>pct(x.posterior)),['19.8','17.4','19.7','60.0']);assert.equal(f1(B.main.lr),'6.0');
 assert.equal(M.bayes(0,0.6,0.1).posterior,0,'base rate 0 → posterior 0');assert.equal(M.bayes(0.02,0.6,0).posterior,1,'no false alarms → 100%');assert.equal(M.bayes(0,0,0).posterior,null);
});
test('V-5 likelihood ratios: all five → odds 0.9, 47.4%; support only → 4.5, 81.8%; L2 33.3% · 66.7%; 확인 31.0%; LR 1 leaves the belief unchanged',()=>{
 const F=C.conf;assert.deepEqual([f2(F.all.odds),pct(F.all.p),f2(F.support.odds),pct(F.support.p)],['0.90','47.4','4.50','81.8']);
 assert.deepEqual(F.L2.map(x=>pct(x.p)),['33.3','66.7']);assert.equal(pct(F.check.p),'31.0');assert.equal(pct(F.gap),'34.4');
 assert.equal(pct(M.oddsUpdate(0.02,[6]).p),pct(C.base.main.posterior),'4장 = prior odds × LR 6');
 assert.equal(M.oddsUpdate(0.37,Array(10).fill(1)).p.toFixed(12),(0.37).toFixed(12),'LR 1 adds nothing');assert.throws(()=>M.oddsUpdate(0.5,[0]),RangeError);assert.throws(()=>M.odds(1),RangeError);
});
test('V-6 intervals and cost: 6/9 hits (66.7%), P(X ≤ 6) 5.3%; turnover 142.4% (284.7% a year); drag 0.17 · 0.69 · 2.76%p; 10 years 3,582 · 3,355 · 2,751만; 확인 23만/1.15%p; 전이 3만/0.15%p; L2 55% · 18',()=>{
 const O=C.over;assert.deepEqual([O.iv.hits,O.iv.n,pct(O.iv.rate),pct(O.iv.pAtMost)],[6,9,'66.7','5.3']);assert.deepEqual(O.iv.rows.filter(r=>!r.hit).map(r=>[r.week,r.name,r.price]),[[1,'온결식품',28200],[8,'온결식품',25500],[10,'새벽전자',19000]]);
 assert.deepEqual([pct(O.to.half),pct(O.to.annual),Math.round(O.to.avgEquity)],['142.4','284.7',19695426]);assert.deepEqual(O.drag.map(x=>pct(x,2)),['0.17','0.69','2.76']);
 assert.deepEqual(O.ten.map(x=>Math.round(x)),[3582,3524,3355,2751]);assert.deepEqual([O.check.cost,pct(O.check.share,2),O.transfer.cost,pct(O.transfer.share,2)],[230000,'1.15',30000,'0.15']);
 assert.deepEqual([pct(O.L2.rate,0),O.L2.expect],['55',18]);assert.equal(pct(O.L2.p,3),'0.006');assert.deepEqual(O.barber.map(x=>pct(x)),['6.5','1.5']);
 assert.ok(Math.abs(M.binomPmf(9,0.9).reduce((a,b)=>a+b,0)-1)<1e-12);assert.ok(Math.abs(M.binomCdf(9,9,0.9)-1)<1e-12);assert.throws(()=>M.costDrag(-1),RangeError);
});
test('V-7 cascades (S15 model): wrong 36.8 · 24.7 · 14.3% (right 63.2 · 75.3 · 85.7%); no cascade after ten 0.08%; third person 53.3 · 56.7 · 60.0 · 63.3%; 확인 6.0%; p = 0.5 is uninformative',()=>{
 const H=C.herd;assert.deepEqual(H.odds.map(o=>pct(o.wrong)),['36.8','24.7','14.3']);assert.deepEqual(H.odds.map(o=>pct(o.right)),['63.2','75.3','85.7']);
 assert.deepEqual(H.no10.map(x=>pct(x,2)),['0.08','0.04','0.01']);assert.deepEqual(H.third.map(x=>pct(x)),['53.3','56.7','60.0','63.3']);assert.equal(M.thirdPerson(0.7).toFixed(6),(17/30).toFixed(6));
 assert.equal(pct(H.check.wrong),'6.0');const h=M.cascadeOdds(0.5);assert.ok(Math.abs(h.right-h.wrong)<1e-12,'p = 0.5: right and wrong cascades are equally likely');
 const run=M.cascadeRun([true,true,false,false,false],()=>true);assert.equal(run.start,2);assert.equal(run.dir,true);assert.deepEqual(run.acts.map(a=>a.buy),[true,true,true,true,true]);
 const tie=M.cascadeRun([true,false,false],i=>false);assert.deepEqual(tie.acts.map(a=>[a.buy,a.tie]),[[true,false],[false,true],[false,false]]);assert.equal(tie.start,null);
 assert.ok(M.publicSignals(0.6,101)>M.publicSignals(0.6,11)&&M.publicSignals(0.6,101)>0.95,'public signals approach 1');assert.throws(()=>M.cascadeOdds(0.4),RangeError);
});
test('V-8 loss probability at 55%: 24.9 · 19.7 · 13.5 · 4.9% for 20 · 50 · 100 · 250; L2 n = 10 → 26.2% and 23.4%; 확인 0; 전이 52% × 250 → 24.3%',()=>{
 const O=C.outcome;assert.deepEqual(O.rows.map(r=>pct(r.neg)),['24.9','19.7','13.5','4.9']);assert.deepEqual(O.rows.map(r=>Math.round(r.mean)),[2,5,10,25]);
 assert.deepEqual([pct(O.L2.neg),pct(O.L2.zero)],['26.2','23.4']);assert.equal(O.check.each,0);assert.equal(pct(O.transfer.neg),'24.3');
 for(const r of O.rows)assert.ok(Math.abs(r.neg+r.zero+r.pos-1)<1e-12);assert.ok(Math.abs(M.outcomeDist(0.5,9).neg-0.5)<1e-12,'p 0.5, odd n: symmetric');
});
test('V-9 rules: R1 first hits 8주 온결식품 −10.35% (avg 30,004.50) and 14주 새벽전자 −11.64% (avg 21,503.22); replay 20,014,650 vs 19,569,716 (+444,934 = +679,735 − 234,801); R2 15–26 (38.2% → 39.4%); R3 5/9; rebound −636,018 vs +361,832; L2 450,000; 전이 −612,510 vs +285,555',()=>{
 assert.deepEqual(R.r1.first.map(x=>[x.week,x.name,pct(x.drop,2),f2(x.avg)]),[[8,'온결식품','-10.35','30004.50'],[14,'새벽전자','-11.64','21503.22']]);
 const weeks=n=>R.r1.hits.filter(h=>h.name===n).map(h=>h.week);assert.deepEqual(weeks('온결식품'),[8,11,12,13,14,15,16,17,18,19,20]);assert.deepEqual(weeks('새벽전자'),[14,15,16,17,18,19,20,22]);
 assert.deepEqual([R.actual,R.rule,R.diff],[19569716,20014650,444934]);assert.deepEqual([R.split['온결식품'].diff,R.split['새벽전자'].diff],[679735,-234801]);
 assert.deepEqual([R.split['온결식품'].rule,R.split['온결식품'].actual,R.split['새벽전자'].rule,R.split['새벽전자'].actual],[-474350,-1154085,128505,363306]);
 assert.equal(R.split['온결식품'].diff+R.split['새벽전자'].diff,R.diff,'per-stock split adds up');assert.deepEqual(R.ruleSales.map(s=>[s.week,s.name]),[[8,'온결식품'],[14,'새벽전자']]);
 assert.deepEqual(R.r2.map(x=>x.week),[15,16,17,18,19,20,21,22,23,24,25,26]);assert.equal(R.r2[0].equity,19154461);assert.equal(pct(R.r2[0].share),'38.2');assert.equal(pct(C.rules.r2end),'39.4');
 assert.deepEqual(R.r3,{buys:9,missing:5,noted:4});
 const P=C.rules.path,N=C.rules.newPath;assert.deepEqual([P.trigger,pct(P.triggerDrop,2),P.rule,P.hold],[4,'-11.64',-636018,361832]);assert.deepEqual([N.trigger,pct(N.triggerDrop,2),f2(N.avg),N.rule,N.hold],[2,'-10.01','30004.50',-612510,285555]);
 assert.equal(C.rules.L2,450000);assert.equal(M.ASSUME.rebound.prices.slice(0,5).join(),J.prices['새벽전자'].slice(9,14).join(),'the rebound path follows the journal for weeks 10–14');
 assert.equal(f3(C.rules.avg8),'28764.312');assert.deepEqual([C.rules.r15.diff,C.rules.r5.diff],[-829846,938870]);assert.equal(M.ruleReplay({r1:0.2}).diff,0,'a 20% limit never triggers');
});
test('V-10 final audit: hits 6/9, turnover 284.7%, others 1 (trade 8), R1 first 2, R2 12 weeks, R3 5/9, form gaps 0 · 0 · 5 · 9',()=>{
 const A=C.final.audit;assert.deepEqual([A.intervals.hits,pct(A.turnover.annual),A.others,A.ownFirst,A.r1First,A.r2Weeks,A.r3.missing],[6,'284.7',1,8,2,12,5]);
 assert.deepEqual(C.final.form,{reason:0,range:0,counter:5,rule:9});assert.deepEqual(M.formCheck(['counter']),{counter:5});assert.throws(()=>M.formCheck(['mood']),/unknown/);
 assert.deepEqual([f3(A.disposition.pgr),f3(A.disposition.plr)],['0.714','0.111']);
});
test('the plan, research and chapter table numbers are the ones computed here',()=>{
 const doc=read('docs/index.html'),rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]])),all=Object.values(rows).join(' ');
 for(const s of ['−600만 원','225만 원','0.250, 0.100, 0.150','약 17.4%','약 33.3%, 약 66.7%','55%, 18개','약 56.7%','약 26.2%, 약 23.4%','45만 원','0.714, 0.111','+10.92','195.5만 원, 214.21만 원','약 1.51배','약 19.7%','60.0%','약 31.0%','23만 원, 1.15%p','약 6.0%','약 24.3%','약 39.4%','−61만 2,510원','+28만 5,555원','4.8주, 19주','44만 4,934원','251.31만 원','274.07만 원','37.24만 원','10.9%','47.4%','81.8%','142.4%','284.7%','3만 5,284원','0.368·0.247·0.143'])assert.ok(all.includes(s),'chapters: '+s);
 const res=read('docs/research.html');for(const s of ['19,569,716','11,849,716','1,125,018','−401,217','−430,284','35,284','9,624','25,660','20,014,650','444,934','679,735','234,801','636,018','361,832','612,510','285,555','19,154,461','28,040,000','57.54','105.90','251.31','274.07','0.0553','37.24','900.15','25.55','10.9%','47.4%','81.8%','5.3%','0.17%p','3,582만','0.368','26.2%'])assert.ok(res.includes(s),'research: '+s);
});
test('invariants on random inputs: costs are whole won, realized + unrealized = end − start, PGR/PLR in 0–1, right + wrong cascades = 1, binomial sums to 1, LR 1 keeps the belief',()=>{
 const r=rng(20261014);
 for(let n=0;n<300;n++){
  const a=Math.floor(r()*5e7);assert.ok(Number.isInteger(M.fee(a))&&M.fee(a)<=a*0.00015+1e-9&&M.fee(a)>a*0.00015-1,'fee floor case '+n);assert.ok(Number.isInteger(M.tax(a,'새벽전자'))&&M.tax(a,'새벽전자')>a*0.002-1,'tax floor case '+n);
  const c={RG:Math.floor(r()*9),PG:Math.floor(r()*9),RL:Math.floor(r()*9),PL:Math.floor(r()*9)},q=M.pgrPlr(c);for(const v of [q.pgr,q.plr])if(v!=null)assert.ok(v>=0&&v<=1);
  const p=0.5+r()*0.49,o=M.cascadeOdds(p);assert.ok(Math.abs(o.right+o.wrong-1)<1e-12&&o.right>=o.wrong-1e-12,'cascade case '+n);
  const pr=0.01+r()*0.98,lr=0.1+r()*5;assert.ok(Math.abs(M.oddsUpdate(pr,[lr,1/lr]).p-pr)<1e-12,'LR and its inverse cancel case '+n);
  const nn=1+Math.floor(r()*80),pp=r();assert.ok(Math.abs(M.binomPmf(nn,pp).reduce((s,x)=>s+x,0)-1)<1e-9,'binomial case '+n);
  const g=M.threshold(50+r()*200,{lambda:1+r()*2,alpha:0.5+r()*0.5,beta:0.5+r()*0.5});assert.ok(g>0);
  const b=M.bayes(r()*0.5,r(),0.01+r()*0.5);assert.ok(b.posterior>=0&&b.posterior<=1);
 }
 for(const lim of [0.03,0.08,0.1,0.12,0.18]){const X=M.ledger({r1:lim}),A=M.audit({r1:lim});const g=sum(X.realized.map(x=>x.pnl))+sum(Object.values(X.unreal));assert.equal(g,X.end-J.start,'invariant with R1 '+lim);assert.equal(A.replay.diff,X.end-L.end);}
});
function sum(a){return a.reduce((s,x)=>s+x,0);}

/* 문제에 주어진 입력·날짜·장 번호·권 번호·가정·출처 값·오답 보기. 계산값(C)과 함께 본문 숫자의 출처가 된다. */
const GIVEN=require('./given.cjs');
const allowedNumbers=()=>{
 const computed=new Set();
 const add=v=>{if(typeof v!=='number'||!Number.isFinite(v))return;const a=Math.abs(v);if(a>=1e4){const w=Math.round(a);computed.add((w%1e4).toLocaleString('en-US'));computed.add(Math.floor(w/1e4).toLocaleString('en-US'));}for(const x of [a,a*100])for(const dd of [0,1,2,3,4,5]){const y=M.round(x,dd);computed.add(y.toFixed(dd));computed.add(y.toLocaleString('en-US',{minimumFractionDigits:dd,maximumFractionDigits:dd}));}computed.add(String(a));};
 const walk=o=>{if(Array.isArray(o))o.forEach(walk);else if(o&&typeof o==='object')Object.values(o).forEach(walk);else add(o);};
 walk(C);walk(M.ASSUME);walk(M.MARKET);walk(M.FACTS);return new Set([...computed,...GIVEN]);
};
const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=ctx.window.PBook,REV=JSON.parse(read('review.json'));
test('every number in content.js and review.json is computed above or given in the problem',()=>{
 const allowed=allowedNumbers(),strip=s=>String(s).replace(/<[^>]+>/g,' ');
 const text=strip(JSON.stringify(B.chapters.map(c=>[c.title,c.subtitle,c.desc,c.recall,c.paragraphs,c.formula,c.formulaNote,c.flow,c.details,c.warning,c.quiz,c.transfer,c.cross.map(x=>x[2])]))+JSON.stringify(REV.chapters));
 const missing=[...new Set(text.match(/\d[\d,]*\d(?:\.\d+)?|\d(?:\.\d+)?/g))].filter(t=>!allowed.has(t.replace(/,$/,'')));
 assert.deepEqual(missing,[],'numbers with no computation or given input: '+missing.join(' '));
});
/* L2 답: 그 장의 글 전체(본문·상자·확인·전이)와 그 장의 복습 문항에 나오지 않는다. 다른 장의 같은 숫자(예: 6장 적중률 66.7%)는 다른 계산이라 막지 않는다. */
const L2={frame:['800만','기대 손익은 −600만'],prospect:['225만','225'],disposition:['0.250','0.100','0.150'],baserate:['17.4'],confirm:['33.3','66.7'],overconfidence:['55%','18개','0.006'],
 herd:['56.7','17/30'],outcome:['26.2','23.4'],rules:['45만','450,000'],final:['0.714','0.111','0.603']};
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
test('L2 answers from docs/index.html #chapters are not stated in that chapter or its review questions',()=>{
 for(const c of B.chapters){const all=JSON.stringify(c)+JSON.stringify(REV.chapters[c.id]);
  for(const s of L2[c.id])assert.doesNotMatch(all,new RegExp('(?<![\\d.,])'+esc(s)+'(?![\\d])'),c.id+' L2 answer leaked: '+s);}
});
test('확인 answers are not given away in the prose before the quiz',()=>{
 const before=id=>{const c=B.chapters.find(x=>x.id===id);return JSON.stringify([c.subtitle,c.desc,c.paragraphs,c.formula,c.formulaNote,c.flow,c.details,c.warning]);};
 const Q={frame:[/1,600만 원 또는 1,000만/,/1\/3 확률로 1,600만/],prospect:[/10\.92/,/151\.31/],disposition:[/1\.51/,/1\.5배/],baserate:[/19\.7%/],confirm:[/31\.0%/],overconfidence:[/23만 원/,/1\.15%p/],
  herd:[/6\.0%/],outcome:[/기대값은 0(?![.\d])/],rules:[/39\.4/,/39\.45/],final:[/4\.8주/,/19주/]};
 for(const [id,rs] of Object.entries(Q))for(const re of rs)assert.doesNotMatch(before(id),re,id+' 확인 answer before the quiz: '+re);
 const T={prospect:[/195\.5/,/214\.21/],disposition:[/0\.750/],baserate:[/60\.0%/],overconfidence:[/3만 원/,/0\.15%p/],outcome:[/24\.3%/],rules:[/612,510/,/61만 2,510/,/285,555/,/28만 5,555/]};
 for(const [id,rs] of Object.entries(T))for(const re of rs)assert.doesNotMatch(before(id),re,id+' 전이 answer before the quiz: '+re);
});

/* 결정적 의사 난수(mulberry32). 같은 시드면 같은 입력이 나와 실패를 다시 볼 수 있다. */
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

test('every function in math.js stays under 100 lines',()=>{
 const lines=read('js/math.js').split('\n');let depth=0,start=null;
 lines.forEach((line,i)=>{const o=(line.match(/\{/g)||[]).length,c=(line.match(/\}/g)||[]).length;if(start===null&&/(function\b|=>\s*\{)/.test(line)&&depth===1)start=[i,depth];depth+=o-c;if(start&&depth<=start[1]){assert.ok(i-start[0]+1<=100,`math.js:${start[0]+1} ${i-start[0]+1} lines`);start=null;}});
});
test('edge inputs from the labs: empty or long signal lists, a path that never triggers, odd trial counts, zero-denominator PGR',()=>{
 assert.throws(()=>M.cascadeRun([]),RangeError);assert.throws(()=>M.cascadeRun(Array(61).fill(true)),RangeError);
 const flat=M.pathRule({name:'새벽전자',qty:100,prices:[20000,19500,19000,20500]});assert.equal(flat.trigger,null);assert.equal(flat.rule,flat.hold);
 assert.throws(()=>M.pathRule({qty:100,prices:[20000]}),RangeError);assert.throws(()=>M.pathRule({qty:1.5,prices:[20000,19000]}),RangeError);
 const odd=M.outcomeDist(0.55,7);assert.equal(odd.zero,0,'odd n never ties');assert.throws(()=>M.outcomeDist(0.55,5001),RangeError);
 assert.throws(()=>M.ledger({r1:0}),RangeError);assert.throws(()=>M.r2Weeks(L,0),RangeError);assert.equal(M.disposition(1,4).pgr,null,'no sale in weeks 1–4');
 assert.deepEqual(M.r1Weeks(L,0.25).first,[],'a 25% limit never triggers in the journal');
});
