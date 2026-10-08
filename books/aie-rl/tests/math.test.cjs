/* 계산 함수의 대표값·경계값·불변 조건. 기대값은 손계산이나 독립 계산으로 정했다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,tol=1e-6,msg)=>assert.ok(Math.abs(a-b)<=tol,`${msg||''} ${a} vs ${b}`);

test('grid moves stay inside walls and the cliff sends the robot back to start',()=>{
 const w=M.warehouse();assert.equal(M.move(w,0,0),0);assert.equal(M.move(w,0,1),1);assert.equal(M.move(w,3,1),3);
 const c=M.cliffWorld();assert.deepEqual(M.outcomes(c,36,1),[[36,-100,1]]);assert.deepEqual(M.outcomes(c,47,0),[[47,0,1]]);
 const s=M.outcomes(M.warehouse(0.2),5,1);near(s.reduce((t,x)=>t+x[2],0),1,1e-12,'slip probabilities sum');
});
test('random policy value: gamma=0 gives one step, values get worse as gamma grows',()=>{
 near(M.mdpRandom(0).start,-1,1e-9);const a=M.mdpRandom(0.5).start,b=M.mdpRandom(0.9).start,c=M.mdpRandom(0.99).start;assert.ok(a>b&&b>c);
 near(M.mdpRandom(0.9).horizon,10,1e-9);near(M.mdpRandom(1).optimal,-6,1e-12);
 const r=M.mdpRandom(1).start;assert.ok(r<-55&&r>-65,'4x4 random walk from corner about -59');
});
test('value iteration reaches -6 path and matches policy iteration; information spreads one cell per sweep',()=>{
 const vi=M.valueIteration(M.warehouse(),1);near(vi.V[0],-6,1e-9);
 const pi=M.policyIteration(M.warehouse(0.1),0.99),vi2=M.valueIteration(M.warehouse(0.1),0.99,1e-9);near(pi.V[0],vi2.V[0],1e-4,'PI=VI');
 const k3=M.valueSweeps(M.warehouse(),1,3).V;assert.equal(k3[14],-1);assert.equal(k3[13],-2);assert.equal(k3[0],-3);
 assert.ok(M.valueIteration(M.warehouse(0.3),0.99).V[0]<vi2.V[0],'more slip, worse value');
});
test('Monte Carlo average of random rollouts approaches the DP value',()=>{
 const dp=M.mdpRandom(1).start,mc=M.mcRandom(4000,7).mean;assert.ok(Math.abs(mc-dp)<4,`${mc} vs ${dp}`);
});
test('epsilon-greedy explores: pure greedy gets stuck, small epsilon finds the best route',()=>{
 const g=M.banditEps(0),e=M.banditEps(0.1);assert.ok(e.lastOpt>0.7&&g.lastOpt<0.5);assert.ok(e.total>g.total);
 const all=M.banditEps(1);near(all.lastOpt,1/3,0.08,'uniform random picks best a third of the time');
});
test('cliff walking: Q-learning hugs the edge, SARSA walks the safer top path when exploring',()=>{
 const r=M.cliffCompare(0.1);assert.equal(r.q.steps,13);assert.equal(r.sarsa.reached,true);assert.ok(r.sarsa.steps>13);
 assert.ok(r.sarsa.lastAvg>r.q.lastAvg,'SARSA earns more while still exploring');
 const z=M.cliffCompare(0);assert.equal(z.q.steps,13);assert.equal(z.sarsa.steps,13);
});
test('max over noisy zero-valued estimates is biased upward, double estimator is not',()=>{
 near(M.maxBias(1,1).single,0,0.06);const b=M.maxBias(10,1);assert.ok(b.single>1.4&&b.single<1.7);near(b.double,0,0.06);
 assert.ok(M.maxBias(10,2).single>M.maxBias(10,1).single);
});
test('policy gradient: baseline leaves the mean unchanged and the best baseline minimizes variance',()=>{
 const a=M.pgVariance(0.3,0,1,1,0),b=M.pgVariance(0.3,0,1,1,5),s=M.pgVariance(0.3,0,1,1,0.7);
 near(a.mean,0.21,1e-12);near(b.mean,0.21,1e-12);near(a.bStar,0.7,1e-12);near(s.variance,a.varStar,1e-12);
 assert.ok(s.variance<a.variance&&s.variance<b.variance);const shifted=M.pgVariance(0.3,10,11,1,0);assert.ok(shifted.variance>50*a.variance/1.5);
});
test('GAE: lambda=0 is the TD error, lambda=1 is return minus value; bias and variance trade off',()=>{
 const r=[-1,-1,2],v=[0.5,0.2,-0.3];const a0=M.gae(r,v,1,0),a1=M.gae(r,v,1,1);
 near(a0[0],-1+0.2-0.5);near(a1[0],(-1-1+2)-0.5);near(a1[2],2+0.3);
 const s0=M.gaeStats(0,1),s1=M.gaeStats(1,1);near(s0.bias,1);near(s0.variance,1);near(s1.bias,0);near(s1.variance,20);
 assert.ok(M.gaeStats(0.5,1).variance<M.gaeStats(0.9,1).variance);
});
test('PPO clip: flat beyond 1+eps for good actions and below 1-eps for bad ones',()=>{
 const g=M.clipObj(1.5,1,0.2);near(g.obj,1.2);assert.equal(g.gradZero,true);
 const b=M.clipObj(0.5,-1,0.2);near(b.obj,-0.8);assert.equal(b.gradZero,true);
 const ok=M.clipObj(0.5,1,0.2);near(ok.obj,0.5);assert.equal(ok.gradZero,false);near(M.clipObj(1,1,0.2).obj,1);
});
test('PPO epochs: clipping caps the drift from the old policy, no clipping keeps drifting',()=>{
 const c10=M.ppoEpochs(10,true),c30=M.ppoEpochs(30,true),u30=M.ppoEpochs(30,false);
 near(c10.kl,c30.kl,1e-9,'clipped KL plateaus');assert.ok(u30.kl>10*c30.kl);near(M.ppoEpochs(1,true).kl,M.ppoEpochs(1,false).kl,1e-12);
 assert.ok(c30.ratio0<1.4&&u30.ratio0>2);c30.probs.forEach(p=>assert.ok(p>0));near(c30.probs.reduce((a,b)=>a+b,0),1,1e-12);
});
test('Bradley-Terry: equal scores give one half, loss falls as the preferred answer scores higher',()=>{
 near(M.bt(0).pA,0.5);near(M.bt(0).loss,Math.log(2));assert.ok(M.bt(2).loss<M.bt(0).loss);near(M.bt(2,'B').loss,-Math.log(1-M.sigmoid(2)));
 near(M.bt(3).pA+M.bt(-3).pA,1,1e-12);
});
test('KL-regularized policy: large beta stays at the reference, small beta chases the reward model',()=>{
 const big=M.klPolicy(1000),small=M.klPolicy(0.1);M.BEHAVIORS.forEach((b,i)=>near(big.probs[i],b.ref,0.01));assert.ok(big.kl<1e-3);
 assert.ok(small.rm>big.rm&&small.truth<big.truth&&small.kl>big.kl);assert.ok(small.probs[2]>0.99,'reward hacking behavior wins');
});
test('two robots: joint learner finds the best convoy, independent learners settle on slow-slow under exploration',()=>{
 const i=M.coopGame(2000,0.1,'indep'),j=M.coopGame(2000,0.1,'joint');assert.ok(j.best>0.9);assert.ok(i.best<0.2&&i.share[8]>0.7);
 near(i.share.reduce((a,b)=>a+b,0),1,1e-9);
});
test('domain randomization: a policy trained on a slippery floor survives slip, a narrow one does not',()=>{
 const d=M.drEval(0.2);near(d.narrow[0],M.evalPolicy(M.trainedPolicy(0),0),1e-9);assert.equal(d.baseSteps,13);
 assert.ok(d.dr[3]>d.narrow[3]*0.5,'wide training is far better at slip 0.3');assert.ok(d.dr[0]<d.narrow[0],'but slightly worse on a dry floor');
 const over=M.drEval(0.4);near(over.dr[0],-100,1e-3,'over-cautious policy never leaves the start on a dry floor');
});
test('PUCT: c=0 follows value only, large c follows the prior',()=>{
 assert.deepEqual(M.puct(0).visits,[40,0,0]);const big=M.puct(50,400);assert.ok(Math.abs(big.share[1]-0.6)<0.08);
 assert.equal(M.puct(1).visits.reduce((a,b)=>a+b,0),40);
});
test('GRPO group advantages have zero mean, unit spread, and vanish when all rewards agree',()=>{
 const g=M.grpoGroup(8,0.5,21);if(g.std>0){near(g.adv.reduce((a,b)=>a+b,0),0,1e-9);near(Math.sqrt(g.adv.reduce((a,b)=>a+b*b,0)/8),1,1e-9);}
 near(M.grpoGroup(8,0.1).noSignal,Math.pow(0.1,8)+Math.pow(0.9,8));assert.deepEqual(M.grpoGroup(4,1).adv,[0,0,0,0]);
});
test('home: discount decides near charger or far exit, switching near gamma = 0.2^(1/4)',()=>{
 assert.equal(M.homeGamma(0.6).target,'near');assert.equal(M.homeGamma(0.7).target,'far');near(M.homeGamma(0.5).threshold,Math.pow(0.2,0.25));
});
test('final task: only the matching fix moves the failing metric',()=>{
 for(const [rep,fix] of [['slip','dr'],['hack','beta'],['stuck','eps']]){const ok=M.finalCase(rep,fix);assert.ok(ok.matched&&ok.after>ok.before,rep);
  for(const f of ['dr','beta','eps','gamma'])if(f!==fix){const x=M.finalCase(rep,f);assert.equal(x.after,x.before);assert.equal(x.matched,false);}}
});
