/* 계산 함수의 대표값·경계값·불변 조건. 기대값은 손계산이나 독립 계산으로 정했다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,tol=1e-6,msg)=>assert.ok(Math.abs(a-b)<=tol,`${msg||''} ${a} vs ${b}`);

test('chain: p^n, n50 = ln0.5/ln p, and monotone in n',()=>{
 near(M.chain(0.99,70).P,Math.pow(0.99,70),1e-12);near(M.chain(0.99,70).P,0.4948,1e-4);
 near(M.chain(0.99,1).n50,Math.log(0.5)/Math.log(0.99),1e-9);near(M.chain(0.999,1).n50,692.8,0.1);
 near(M.chain(0.99,0).P,1,1e-12,'zero steps');near(M.chain(0.99,70).P+M.chain(0.99,70).fail,1,1e-12);
 assert.ok(M.chain(0.99,200).P<M.chain(0.99,70).P);near(M.chain(0.99,1).expectedFirstFail,100,1e-9);
});
test('starLoop: answer-only filter widens in/out gap, process filter closes it, no shortcut means no gap',()=>{
 const a=M.starLoop(0.4,8,'answer'),p=M.starLoop(0.4,8,'process'),z=M.starLoop(0,8,'answer');
 near(a.inD,0.891,1e-3);near(a.outD,0.365,1e-3);near(p.outD,0.888,1e-3);near(z.gap,0,1e-9);
 assert.ok(a.gap>p.gap);near(a.w.reduce((s,x)=>s+x,0),1,1e-9,'weights sum to 1');
 const r0=M.starLoop(0.4,0,'answer');near(r0.inD,a.hist[0].inD,1e-12,'round 0 = start');
});
test('evolve: hidden inputs keep reported close to truth; visible tests and editable judge do not',()=>{
 const v=M.evolve('visible',40),h=M.evolve('holdout',40),e=M.evolve('editable',40);
 assert.ok(v.gap>1&&e.gap>1,'visible/editable diverge');assert.ok(Math.abs(h.gap)<0.05,'holdout tracks');
 near(v.finalReported,1.965,1e-3);near(h.finalTrue,0.813,1e-3);
 const g0=M.evolve('visible',0);near(g0.finalReported,0.5,1e-9);near(g0.finalTrue,0.5,1e-9);
 assert.deepEqual(M.evolve('visible',40).reported,v.reported,'seeded, deterministic');
});
test('scientist: deep review lowers the flawed share; more retries submit more',()=>{
 const s0=M.scientist(0,'shallow'),s5=M.scientist(5,'shallow'),d1=M.scientist(1,'deep'),s1=M.scientist(1,'shallow');
 near(s0.submitted,50.9,0.1);near(s0.badShare,0.401,1e-3);near(s5.submitted,86.7,0.1);
 assert.ok(d1.badShare<s1.badShare&&d1.submitted<s1.submitted);assert.ok(s5.badShare>s0.badShare);
 for(const r of [s0,s5,d1])assert.ok(r.badShare>=0&&r.badShare<=1);
});
test('race: equal growth keeps the gap at zero, slower alignment crosses the limit',()=>{
 near(M.race(0.10,20).relGap,0,1e-12);assert.equal(M.race(0.10,20).first,null);
 near(M.race(0,20).C,Math.pow(1.1,20),1e-9);near(M.race(0,20).relGap,Math.pow(1.1,20)-1,1e-9);
 assert.equal(M.race(0.05,20).first,5);assert.equal(M.race(0,20).first,3);assert.ok(M.race(0.12,20).relGap<0);
});
test('gates: more gates never admit more bad edits; tight tolerance blocks a good edit',()=>{
 let prev=Infinity;for(let l=0;l<=4;l++){const g=M.gates(l,3);assert.ok(g.badIn<=prev);prev=g.badIn;}
 assert.equal(M.gates(0,3).accepted,6);assert.equal(M.gates(0,3).badIn,4);
 assert.equal(M.gates(4,3).badIn,0);assert.equal(M.gates(4,0).goodOut,1);assert.equal(M.gates(4,10).badIn,1);
});
test('ladder: plan asks for everything, bypass auto-runs every risky action, container removes harm',()=>{
 assert.equal(M.ladder('plan','repo').asks,8);assert.equal(M.ladder('plan','repo').riskyAuto,0);
 assert.equal(M.ladder('default','repo').asks,6);assert.equal(M.ladder('default','repo').riskyAuto,1);
 assert.equal(M.ladder('bypass','repo').riskyAuto,5);assert.equal(M.ladder('auto','repo').leak,true);
 assert.equal(M.ladder('auto','container').harm,false);assert.equal(M.ladder('dontAsk','repo').denied,4);
});
test('inject: boundary stops every hit, canary turns the memory hit into an alarm',()=>{
 assert.equal(M.inject('none').hits,3);assert.equal(M.inject('sanitizer').hits,2);assert.equal(M.inject('boundary').hits,0);
 assert.deepEqual(M.inject('canary').rows.map(r=>r.out),['done','stripped','hit','alarm']);
});
test('replay: recorded replay has no duplicates; naive restart duplicates side effects',()=>{
 const n=M.replay(5,'naive'),r=M.replay(5,'replay'),x=M.replay(5,'nolog');
 assert.equal(n.dupEffects,1);near(n.rebilled,0.8,1e-9);assert.equal(r.dupEffects,0);near(r.rebilled,0,1e-12);
 assert.equal(x.diverge,true);assert.equal(M.replay(0,'naive').dupEffects,0);assert.equal(M.replay(6,'naive').dupEffects,2);
});
test('commit: each guard closes its own failure',()=>{
 assert.equal(M.commit('crash',0).money,60);assert.equal(M.commit('crash',1).ok,true);
 assert.equal(M.commit('balance',1).ok,false);assert.equal(M.commit('balance',2).ok,true);
 assert.equal(M.commit('silent',2).ok,false);assert.equal(M.commit('silent',3).ok,true);assert.equal(M.commit('clean',0).ok,true);
});
test('governor: velocity cap stops fast loops in minutes; slow leaks need a day cap',()=>{
 const v=M.governor(6,'velocity'),m=M.governor(6,'month');
 assert.equal(v.why,'10분 속도 제한');assert.equal(v.minutesAfterLoop,9);near(v.loss,54,1e-9);
 assert.equal(m.why,'이달 상한');near(m.loss,2448,1e-9);assert.ok(v.loss<m.loss);
 assert.equal(M.governor(1,'all').why,'하루 상한');assert.equal(M.governor(1,'velocity').why,'이달 상한');
});
test('breaker: EWMA lag = c(1-a)/a, alarm gap = c/a, so drift below 3sigma*a never trips the alarm',()=>{
 near(M.breaker(1).lag,1*0.7/0.3,1e-9);near(M.breaker(1).gap,1/0.3,1e-9);
 assert.equal(M.breaker(1.79,400).ewmaHour,null);assert.ok(M.breaker(1.81,400).ewmaHour!==null);assert.equal(M.breaker(1).ewmaHour,null);assert.equal(M.breaker(1).hardHour,21);
 assert.equal(M.breaker(2).ewmaHour,7);assert.equal(M.breaker(3).ewmaHour,3);assert.equal(M.breaker(0.5).hardHour,41);
});
test('tiers: hardcoded and safety refusals survive operator unlock; scope can be widened',()=>{
 for(const op of ['default','narrow','unlock']){assert.equal(M.tiers(4,op).decision,'거절');assert.equal(M.tiers(3,op).decision,'거절');assert.equal(M.tiers(1,op).decision,'거절');}
 assert.equal(M.tiers(2,'default').tier,'3층 지침');assert.equal(M.tiers(2,'unlock').decision,'답변');assert.equal(M.tiers(0,'default').tier,'4층 도움');
});
test('layers: pass probability is the product of layer passes and never grows with more layers',()=>{
 near(M.layers('emoji',1).per1000,1000,1e-9);near(M.layers('emoji',4).per1000,6,1e-9);near(M.layers('plain',4).per1000,0.1,1e-9);
 for(const a of ['plain','homoglyph','emoji','paraphrase'])for(let n=1;n<4;n++)assert.ok(M.layers(a,n+1).pass<=M.layers(a,n).pass);
});
test('horizon: fit recovers ~240 min, 80% horizon is shorter, inflation lengthens it',()=>{
 const h=M.horizon(0,0.8);near(h.h50,242.9,0.5);near(h.hLevel,48.6,0.5);assert.ok(h.hLevel<h.h50);
 near(M.horizonAt({a:2,b:1},0.5),4,1e-12,'2^(a/b) at 50%');
 near(M.horizon(10,0.5).h50,457.3,0.5);assert.ok(M.horizon(20,0.5).h50>M.horizon(10,0.5).h50);
 const d=M.horizonData(20);assert.ok(d.every(x=>x.k<=x.n&&x.k>=0));
});
test('incident: cutting each path leaves no open incident; easy fixes leave all three open',()=>{
 assert.equal(M.incident('none','none','none').open,3);assert.equal(M.incident('month','sanitize','score').open,3);
 const z=M.incident('tool','boundary','firewall');assert.equal(z.open,0);assert.equal(z.cost,50);
});
