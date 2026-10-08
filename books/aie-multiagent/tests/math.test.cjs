/* 계산 함수의 대표값·경계값·불변 조건. 기대값은 손계산이나 독립 계산으로 정했다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,tol=1e-9,msg='')=>assert.ok(Math.abs(a-b)<=tol,`${msg} ${a} vs ${b}`);

test('ceiling: one context grows linearly and overflows 200k at 29 docs; workers stay small',()=>{
 const a=M.ceiling(1);assert.equal(a.single,9000);assert.equal(a.stay,true);
 assert.equal(M.ceiling(28).overflow,false);assert.equal(M.ceiling(29).overflow,true);assert.equal(M.ceiling(10).firstOverflow,29);
 const b=M.ceiling(30);assert.equal(b.workers,6);assert.equal(b.workerCtx,37000);assert.equal(b.leadCtx,14000);
 assert.ok(b.multiTotal>b.singleTotal,'splitting costs more tokens in total');assert.equal(b.singleTime,600);assert.equal(b.multiTime,160);
 assert.equal(M.ceiling(10).stay,false,'20 tool calls is no longer small');assert.equal(M.ceiling(9).stay,true);
});
test('A2A lifecycle: legal paths reach terminals and terminal tasks refuse new events',()=>{
 assert.equal(M.taskRun(M.TASK_SCENARIOS.happy).state,'COMPLETED');
 const inp=M.taskRun(M.TASK_SCENARIOS.input);assert.equal(inp.state,'COMPLETED');assert.equal(inp.rejected,0);
 const late=M.taskRun(M.TASK_SCENARIOS.late);assert.equal(late.state,'COMPLETED');assert.equal(late.rejected,1);
 const rej=M.taskRun(M.TASK_SCENARIOS.reject);assert.equal(rej.state,'REJECTED');assert.equal(rej.rejected,1);
 assert.equal(M.taskRun(M.TASK_SCENARIOS.input,2).state,'INPUT_REQUIRED');assert.equal(M.taskRun(M.TASK_SCENARIOS.input,0).state,'SUBMITTED');
 for(const t of M.TERMINAL)assert.deepEqual(M.TASK_NEXT[t],[]);
});
test('orchestra: handoff loses the review step as p grows, selector doubles calls',()=>{
 const z=M.orchestra(0);near(z.handoff.review,1);near(z.handoff.calls,3);
 const h=M.orchestra(0.2);near(h.handoff.review,0.64);near(h.handoff.calls,2.44);near(h.selector.calls,20/3,1e-9);
 near(M.orchestra(1).handoff.calls,1);near(M.orchestra(1).handoff.review,0);assert.equal(h.static.calls,3);
});
test('fanout: parallel time beats serial, then spawn overhead wins; tokens rise with workers',()=>{
 const one=M.fanout(1,1);assert.equal(one.time,109);assert.equal(one.serial,108);
 assert.equal(M.fanout(5,1).time,38);assert.equal(M.bestFanout(1).k,5);assert.equal(M.bestFanout(0).k,8);assert.equal(M.bestFanout(3).k,5);
 assert.ok(M.fanout(10,3).time>M.fanout(5,3).time);assert.ok(M.fanout(10,1).tokens>M.fanout(1,1).tokens);
 const s=M.lpt(M.SUBQ,3);assert.equal(s.load.reduce((a,b)=>a+b,0),99);assert.equal(s.makespan,Math.max(...s.load));
});
test('drift: fidelity is (1-e)^(2d) and a canary catches 80% of drift',()=>{
 near(M.drift(1,0.1).keep,0.81);near(M.drift(3,0.1).keep,Math.pow(0.9,6));near(M.drift(2,0).bad,0);
 const c=M.drift(3,0.1,true);near(c.silent,(1-Math.pow(0.9,6))*0.2,1e-12);near(c.caught+c.silent,c.bad,1e-12);
});
test('verify: a code verifier cuts shipped bugs; probabilities add up to one',()=>{
 for(const m of ['none','critic','verifier','both']){const r=M.verify(0.3,m);near(r.bug+r.clean+r.escalate,1,1e-12,m);}
 near(M.verify(0.3,'none').bug,0.3);near(M.verify(0.3,'verifier').bug,0.3*0.1*(1+0.27+0.27*0.27),1e-12);
 assert.ok(M.verify(0.3,'critic').bug>M.verify(0.3,'verifier').bug);near(M.verify(0,'both').bug,0);near(M.verify(0,'both').clean,1);
});
test('poison: only the read-only verifier stops 42% from reaching the report',()=>{
 assert.equal(M.poison('none').final,42);assert.equal(M.poison('provenance').final,42);assert.equal(M.poison('writer').final,42);
 assert.equal(M.poison('readonly').final,4.2);assert.equal(M.poison('readonly').caught,true);
 assert.equal(M.poison('writer').wrong,5);assert.equal(M.poison('none').traceSteps,4);assert.equal(M.poison('provenance').traceSteps,1);
 assert.equal(M.poison('none',3).final,null);
});
test('schedule: shared queue balances load; LPT reaches the lower bound here',()=>{
 assert.equal(M.schedule(1,'sequential').makespan,46);assert.equal(M.schedule(3,'fixed').makespan,21);assert.equal(M.schedule(3,'queue').makespan,17);assert.equal(M.schedule(3,'lpt').makespan,16);
 for(const w of [1,2,3,4,6])for(const m of ['fixed','queue','lpt']){const r=M.schedule(w,m);assert.ok(r.makespan>=r.lower-1e-9);assert.equal(r.load.reduce((a,b)=>a+b,0),46);}
 assert.equal(M.schedule(6,'queue').makespan,9,'longest single document bounds the time');
});
test('pheromone: ungated deposits lock onto the fast wrong agent; quality gate finds the right routes',()=>{
 const u=M.pheromone(false,0.02),g=M.pheromone(true,0.1);
 assert.ok(u.share[2]>0.9);assert.ok(g.share[2]<0.05);assert.deepEqual(g.best,g.optimal);assert.ok(g.quality>u.quality+0.3);
 assert.deepEqual(M.pheromone(true,0.1),M.pheromone(true,0.1),'seeded');
});
test('vote: binomial majority, monoculture caps the gain, rho=1 means one voter',()=>{
 near(M.majority(1,0.65),0.65);near(M.majority(3,0.65),3*0.65*0.65*0.35+Math.pow(0.65,3),1e-12);
 near(M.vote(5,0.65,1).acc,0.65);assert.ok(M.vote(9,0.65,0).acc>M.vote(9,0.65,0.6).acc);near(M.majority(5,0.5),0.5,1e-12);
 assert.ok(M.vote(3,0.65,0.1).acc>M.vote(5,0.65,0.6).acc,'three diverse beat five copies');
});
test('topology: graph messages grow as n(n-1), chain stays linear',()=>{
 assert.equal(M.topology('graph',5).messages,40);assert.equal(M.topology('chain',5).messages,8);assert.equal(M.topology('star',4,1).messages,6);
 assert.ok(M.topology('graph',7).contextTokens/M.topology('graph',4).contextTokens>3);
});
test('consensus: plurality falls to sycophancy, confidence weighting resists it, monoculture beats all three',()=>{
 const s=M.consensus('sycophancy');assert.equal(s.plural.correct,false);assert.equal(s.weighted.correct,true);assert.equal(s.geo.correct,false);
 const m=M.consensus('monoculture');assert.ok(!m.plural.correct&&!m.weighted.correct&&!m.geo.correct);
 const b=M.consensus('byzantine');assert.ok(b.plural.correct&&b.weighted.correct&&b.geo.correct);assert.equal(b.f,1);assert.equal(b.bftLimit,1);
 assert.equal(M.consensus('byzantine',0.7).weighted.accept,false);near(M.median([1,3,2]),2);near(M.median([1,2,3,4]),2.5);
});
test('bargain: offer generator closes more deals with more rounds and never overbids',()=>{
 const r1=M.bargain(1),r6=M.bargain(6);assert.ok(r6.og>r1.og);assert.ok(r6.og>r6.naive);assert.ok(r6.og>0.8);
 assert.ok(r6.naiveOver>0.3);assert.ok(r6.ogSurplus>0&&r6.ogSurplus<=1);assert.deepEqual(M.bargain(4),M.bargain(4));
});
test('shapley: efficiency, symmetry of the formula, and second price',()=>{
 for(const f of [0.6,0.8,1]){const v=M.coalitionValue(f),p=M.shapley(v);near(p.R+p.W+p.V,f,1e-12);}
 const p=M.shapley(M.coalitionValue(0.8));near(p.R,0.45,1e-12);near(p.W,0.25,1e-12);near(p.V,0.1,1e-12);
 const sym=M.shapley({'':0,A:1,B:1,AB:3},['A','B']);near(sym.A,1.5);near(sym.B,1.5);
 assert.deepEqual(M.secondPrice([5,8,6]),{winner:1,pay:6});
});
test('tom: first-order belief cuts duplication; belief noise erodes it',()=>{
 const z=M.tom(0,3),f=M.tom(1,3),n=M.tom(1,3,0.3);assert.ok(f.duplication<z.duplication-0.1);assert.ok(n.duplication>f.duplication);
 assert.ok(f.turns<z.turns);assert.equal(f.completion,1);assert.deepEqual(M.tom(1,4),M.tom(1,4));
});
test('retrieval: recency decays with age, ranking shifts with decay',()=>{
 const r=M.retrieval(0.1);near(r[0].rec,Math.exp(-0.8),1e-12);near(r[0].score,Math.exp(-0.8)+0.9+0.9,1e-12);
 const top=d=>{const s=M.retrieval(d);return s.indexOf(s.reduce((a,b)=>b.score>a.score?b:a));};assert.equal(top(0.1),0);
 assert.ok(M.retrieval(0.01)[3].score>M.retrieval(0.5)[3].score);
});
test('storm: retries amplify past capacity into a storm; the breaker holds load at 1',()=>{
 near(M.storm(0.1,5,false).final,(1-Math.pow(0.1,6))/0.9,1e-9);assert.ok(M.storm(0.2,5,false).final>5);near(M.storm(0.2,5,true).final,1);
 near(M.storm(0.3,0,false).final,1);assert.ok(M.storm(0.2,2,false).final<M.storm(0.2,5,false).final);
});
test('resume: checkpoints bound the work to redo',()=>{
 assert.deepEqual(M.resume(10,7,0),{saved:0,redo:7,total:17});assert.deepEqual(M.resume(10,7,3),{saved:6,redo:1,total:11});
 assert.equal(M.resume(10,1,1).redo,1);
});
test('diagnose: the independent check is the only fix that works in all three incidents',()=>{
 for(const i of ['poison','storm','mono']){assert.equal(M.diagnose(i,'verify').good,true,i);assert.equal(M.diagnose(i,'more').good,false,i);assert.equal(M.diagnose(i,'longer').good,false,i);}
});
