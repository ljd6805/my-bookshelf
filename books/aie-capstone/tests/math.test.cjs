/* 계산 함수의 대표값·경계값·불변 조건. 기대값은 손계산이나 독립 계산으로 정했다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,tol=1e-6,msg)=>assert.ok(Math.abs(a-b)<=tol,`${msg||''} ${a} vs ${b}`);
const C=(n,k)=>{if(k<0||k>n)return 0;let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r;};

test('retry: success is 1 − p^n, latencies grow with timeouts and backoff',()=>{
 const r=M.retryStats(0.2,3,5);near(r.success,0.992,1e-12);near(r.failP,0.008,1e-12);
 near(r.worst,3*5+0+0.125+0.5,1e-12,'three timeouts plus two waits');near(r.p95,5+0.125+0.8,1e-12,'95% reached on the second try');
 const z=M.retryStats(0,5,5);near(z.success,1);near(z.p95,0.8);near(z.calls,1);
 assert.ok(M.retryStats(0.2,5,5).worst>r.worst&&M.retryStats(0.2,5,5).success>r.success);
});
test('replan: probabilities of done, abort and yield sum to one; no failures means done in five steps',()=>{
 for(const [p,b] of [[0.1,12],[0.2,40],[0.35,9]]){const r=M.replanBudget(p,b);near(r.done+r.abort+r.yieldP,1,1e-9);}
 const z=M.replanBudget(0,5);near(z.done,1);near(z.expSteps,5);assert.equal(M.replanBudget(0,4).done,0);
 near(M.replanBudget(0.1,12).done,0.806,1e-3);assert.ok(M.replanBudget(0.2,40).done<0.9,'replan cap blocks 90%');
 assert.ok(M.replanBudget(0.1,17).done>=0.9&&M.replanBudget(0.1,16).done<0.9);
});
test('pass@k: unbiased estimator matches the combinatorial formula and its edges',()=>{
 for(const [n,c,k] of [[10,3,5],[10,2,8],[10,1,1],[20,5,10]])near(M.passAtK(n,c,k),1-C(n-c,k)/C(n,k),1e-12);
 near(M.passAtK(10,3,5),1-21/252,1e-12);assert.equal(M.passAtK(10,0,5),0);assert.equal(M.passAtK(10,6,5),1);assert.ok(Number.isNaN(M.passAtK(5,1,6)));
 near(M.passNaive(0.3,5),1-Math.pow(0.7,5),1e-12);near(M.passAtK(10,3,1),0.3,1e-12);
});
test('try until pass: cost per solved does not depend on k; quantile of tries',()=>{
 const a=M.tryUntilPass(0.34,1,0.024),b=M.tryUntilPass(0.34,4,0.024);near(a.costPerSolved,b.costPerSolved,1e-12);near(a.costPerSolved,0.024/0.34,1e-12);
 near(b.expTries,(1-Math.pow(0.66,4))/0.34,1e-12);assert.equal(M.tryUntilPass(0,3,1).costPerSolved,Infinity);
 assert.equal(M.triesQuantile(0.34,2),2);assert.equal(M.triesQuantile(0.99,4),1);assert.equal(M.triesQuantile(0.3,3),3);
});
test('tail sampling: stored volume and discovery time',()=>{
 const r=M.tailSampling(1e5,0.02,0.1,0.01);near(r.stored,1e5*(0.02+0.98*0.1),1e-6);near(r.badPerHour,1e5/24*0.98*0.01*0.1,1e-9);
 near(r.minutes,60/r.badPerHour,1e-9);near(r.minutes,14.69,0.01);assert.equal(M.tailSampling(1e5,0.02,0,0.01).minutes,Infinity);
 assert.ok(M.tailSampling(1e5,0.02,0.21,0.01).within5>0.5&&M.tailSampling(1e5,0.02,0.20,0.01).within5<0.5);
});
test('team cost: break-even solve rate is roles × single rate',()=>{
 const r=M.teamCost(4,0.6,0.25);near(r.breakEven,1);near(r.single,40*0.02/0.25);near(r.team,160*0.02/0.6);assert.equal(r.teamTurns,160);
 near(M.teamCost(3,0.6,0.2).team,M.teamCost(3,0.6,0.2).single,1e-12,'exactly at break-even');
});
test('UCB: deterministic with a seed, budget is spent, low arm pruned, 0.55 arm signals early',()=>{
 const a=M.ucbRun(1.4,30),b=M.ucbRun(1.4,30);assert.deepEqual(a.runs,b.runs);assert.equal(a.runs.reduce((s,x)=>s+x,0),30);
 assert.deepEqual(a.runs,[3,5,9,13]);assert.equal(a.pruned[0],true);assert.equal(a.trigger[2],3);
 assert.ok(M.ucbRun(0,30).bestShare>M.ucbRun(3,30).bestShare,'less exploration concentrates on the best arm here');
});
test('GPT parameter count: 124M tied, 163M untied, block 12d²+13d',()=>{
 const r=M.gptParams(12,768);assert.equal(r.block,7087872);assert.equal(r.total,124439808);assert.equal(M.gptParams(12,768,50257,1024,false).total,163037184);
 near(M.gptParams(12,1536).block/r.block,4,0.01,'double width, about four times');assert.equal(M.windowCount(1025,1024,1024),1);assert.equal(M.windowCount(100,1024,1),0);assert.equal(M.windowCount(2049,1024,512),3);
});
test('DPO optimal policy: sigma(Δr/β), KL bounded by ln 2, no NaN at the extremes',()=>{
 const r=M.dpoPolicy(1,1);near(r.pw,1/(1+Math.exp(-1)),1e-12);near(r.kl,r.pw*Math.log(2*r.pw)+(1-r.pw)*Math.log(2*(1-r.pw)),1e-12);
 const e=M.dpoPolicy(0.05,3);assert.ok(Number.isFinite(e.kl));near(e.kl,Math.log(2),1e-9);near(M.dpoPolicy(1,0).kl,0,1e-12);
 near(M.dpoLoss(1,0),Math.log(2),1e-12);assert.ok(M.dpoPolicy(0.5,1).pw>M.dpoPolicy(2,1).pw);
});
test('ZeRO bytes per parameter and communication',()=>{
 near(M.zeroMem(7,8,'ddp').gb,112);near(M.zeroMem(7,8,'z1').gb,38.5);near(M.zeroMem(7,8,'z2').gb,26.25);near(M.zeroMem(7,8,'z3').gb,14);
 near(M.zeroMem(1,64,'z1').bytes,4.1875);for(const s of ['z1','z2','z3'])near(M.zeroMem(7,1,s).bytes,16,1e-12,'one device saves nothing');
 near(M.zeroMem(7,8,'z3').commGB/M.zeroMem(7,8,'ddp').commGB,1.5,1e-12);near(M.zeroMem(7,8,'z1').commGB,M.zeroMem(7,8,'ddp').commGB,1e-12);
 assert.ok(M.zeroMem(7,2,'z1').gb<=80&&M.zeroMem(7,1,'z1').gb>80);
});
test('pipeline bubble (S−1)/(M+S−1)',()=>{
 near(M.bubble(4,8).fraction,3/11);near(M.bubble(4,64).fraction,3/67);near(M.bubble(8,63).fraction,0.1);assert.equal(M.bubble(4,8).ofobAct,4);assert.equal(M.bubble(4,8).gpipeAct,8);
 near(M.bubble(1,5).fraction,0);
});
test('retrieval metrics on hand-checked rankings',()=>{
 const base=M.ragRun('base',10);near(base.recall,1);near(base.mrr,1/3);assert.equal(base.fullAt,10);
 assert.equal(M.ragRun('hybrid',10).fullAt,6);assert.equal(M.ragRun('rerank',3).fullAt,3);near(M.ragRun('rerank',3).ndcg,1,1e-12);near(M.ragRun('rerank',3).precision,1);
 const r=M.ragMetrics([0,2,0,3],[3,2],2);near(r.precision,0.5);near(r.recall,0.5);near(r.mrr,0.5);near(r.ndcg,(2/Math.log2(3))/(3+2/Math.log2(3)),1e-12);
 near(M.ragRun('base',3).ctxTokens,1200);
});
test('patch tokens: 224/16 is 196, doubling the side gives four times the tokens',()=>{
 const a=M.patchTokens(224,16),b=M.patchTokens(448,16);assert.equal(a.patches,196);assert.equal(a.seq,197);near(a.rel,1);assert.equal(b.patches,784);near(b.rel,785*785/(197*197),1e-12);
 assert.equal(M.patchTokens(336,32).cut,16);assert.equal(M.patchTokens(224,32).patches,49);
});
test('bootstrap interval: mean equals the true gap, width shrinks with more tasks, deterministic',()=>{
 const a=M.bootstrapDiff(50,0.02),b=M.bootstrapDiff(50,0.02);assert.deepEqual(a,b);near(a.mean,0.02,1e-12);assert.ok(a.lo<a.mean&&a.mean<a.hi);
 assert.ok(M.bootstrapDiff(800,0.02).width<M.bootstrapDiff(50,0.02).width);
 assert.equal(M.bootstrapDiff(100,0.02).verdict,'tie');assert.equal(M.bootstrapDiff(200,0.02).verdict,'better');assert.equal(M.bootstrapDiff(800,0).verdict,'tie');assert.equal(M.bootstrapDiff(200,-0.02).verdict,'worse');
});
test('gate: rates from the fixture, precision follows Bayes with the base rate',()=>{
 const g=M.gateStats(0.7,0.01);near(g.tpr,0.56);near(g.fpr,0.06);near(g.precision,0.56*0.01/(0.56*0.01+0.06*0.99),1e-12);
 near(g.benignBlocked10k,594,1e-9);near(g.tpr+g.attWarn+g.miss,1,1e-12);
 assert.ok(M.gateStats(0.9,0.01).fpr<=M.gateStats(0.6,0.01).fpr&&M.gateStats(0.9,0.01).tpr<=M.gateStats(0.6,0.01).tpr);
 assert.ok(M.gateStats(0.7,0.1).precision>g.precision);
});
test('launch sheet: current setting fails, a feasible combination exists, parallel trades cost for latency',()=>{
 const T=M.LAUNCH_TARGET,ok=r=>r.monthly<=T.monthly&&r.p95<=T.p95&&r.pass>=T.pass&&r.benignBlocked<=T.benignBlocked&&r.attackNotBlocked<=T.attackNotBlocked;
 const now=M.launchSheet(3,'seq',10,0.7,0);assert.equal(now.tasks,88000);assert.equal(ok(now),false);near(now.monthly,88000*((1-Math.pow(0.65,3))/0.35)*0.03,1e-6);
 assert.equal(ok(M.launchSheet(2,'seq',5,0.9,1)),true);
 const par=M.launchSheet(3,'par',10,0.7,0);assert.ok(par.p95<now.p95&&par.monthly>now.monthly);near(par.pass,now.pass,1e-12);
});
