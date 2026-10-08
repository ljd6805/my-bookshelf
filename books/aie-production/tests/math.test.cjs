/* js/math.js의 대표값·경계값·불변 조건. 값은 책 본문과 실험 안내의 숫자와 맞춘다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,eps=1e-2)=>assert.ok(Math.abs(a-b)<=eps,`${a} != ${b}`);

test('breakeven: representative values and monotonicity',()=>{
 near(M.breakeven(0.3,1.6).dedicated,1.61);near(M.breakeven(1,1.6).dedicated,0.483);
 near(M.breakeven(0.68,1.6).breakEvenU,0.302,1e-3);near(M.breakeven(0.68,0.9).breakEvenU,0.537,1e-3);
 assert.equal(M.breakeven(0.68,1.6).cheaper,'dedicated');assert.equal(M.breakeven(0.2,1.6).cheaper,'api');
 near(M.nuriUtil().util,0.679,1e-3);
 for(let u=0.1;u<1;u+=0.1)assert.ok(M.breakeven(u,1.6).dedicated>M.breakeven(u+0.1,1.6).dedicated);
});

test('chunked prefill: off, small chunks, and chunk longer than prompt',()=>{
 const off=M.chunkedPrefill(32000,0);near(off.ttft,807);near(off.stall,807);
 const c512=M.chunkedPrefill(32000,512);assert.equal(c512.chunks,63);near(c512.stall,19.8);near(c512.ttft,1241);
 near(M.chunkedPrefill(32000,2048).stall,58.2);
 assert.deepEqual(M.chunkedPrefill(4000,4096),M.chunkedPrefill(4000,0));
 /* 조각이 작을수록 이웃의 간격은 줄고 긴 손님의 첫 토큰은 늘어난다 */
 assert.ok(M.chunkedPrefill(32000,256).stall<c512.stall&&M.chunkedPrefill(32000,256).ttft>c512.ttft);
});

test('HBM budget: Llama 3 70B KV and max concurrency',()=>{
 assert.equal(M.kvBytesPerToken(2),327680);
 assert.equal(M.hbmBudget('fp8',1,1).maxConc,14);assert.equal(M.hbmBudget('int4',2,1).maxConc,59);
 assert.equal(M.hbmBudget('int4',1,1).maxConc,119);assert.equal(M.hbmBudget('nvfp4',1,1).maxConc,106);
 assert.equal(M.hbmBudget('bf16',1,1).maxConc,-1);assert.equal(M.hbmBudget('bf16',1,1).fits,false);
 assert.ok(M.hbmBudget('int4',1,119).fits);assert.ok(!M.hbmBudget('int4',1,120).fits);
});

test('edge ceiling scales with bandwidth and inversely with model size',()=>{
 near(M.edgeCeiling(90,8).tokS,22.5);near(M.edgeCeiling(90,3).tokS,60);near(M.edgeCeiling(50,8).tokS,12.5);
 near(M.edgeCeiling(180,8).tokS,2*M.edgeCeiling(90,8).tokS);
});

test('goodput: seeded sample, chunked prefill helps the tail, tighter SLO lowers goodput',()=>{
 const S=t=>({ttft:800,tpot:t,e2e:3000}),off=M.goodput(S(25),false),on=M.goodput(S(25),true);
 near(off.goodput,0.9445,1e-4);near(on.goodput,0.97,1e-4);near(off.meanTpot,9.49);near(off.p99,64.27);
 assert.ok(on.p99<off.p99);assert.ok(M.goodput(S(10),true).goodput<on.goodput);
 assert.ok(M.goodput(S(40),true).goodput>=M.goodput(S(25),true).goodput);
 assert.ok(off.goodput>=0&&off.goodput<=1);
 const itl=M.itlByTool(300,1400,200);assert.ok(itl.incl>itl.excl);
});

test('speculative decoding: exact expectation, limits, break-even',()=>{
 near(M.specTokens(0.7,5),2.941,1e-3);assert.equal(M.specTokens(0,5),1);assert.equal(M.specTokens(1,5),6);
 assert.ok(M.specTokens(0.7,5)<1+5*0.7);
 near(M.specSpeedup(0.7,5,'low').speedup,2.262);near(M.specSpeedup(0.7,5,'high').speedup,1.508);
 near(M.specSpeedup(0.7,5,'high').breakEven,0.495,1e-3);near(M.specSpeedup(0.4,5,'high').speedup,0.851,1e-3);
 const be=M.specSpeedup(0.7,5,'mid');near(M.specTokens(be.breakEven,5)/be.cost,1,1e-6);
 assert.ok(M.specSpeedup(0.7,8,'high').breakEven>M.specSpeedup(0.7,5,'high').breakEven);
});

test('KV transfer between pools',()=>{
 const r=M.kvTransfer(4096,'rdma'),t=M.kvTransfer(4096,'tcp');
 near(r.mb,671.09);near(r.ms,19.97);near(t.ms,79.89);near(r.prefill,102.4);
 assert.ok(M.kvTransfer(256,'rdma').shortRule);assert.ok(!r.shortRule);near(t.ms/r.ms,4);
});

test('router simulation: aware routing collects hits, dynamic prefix order destroys them',()=>{
 const rr=M.routeSim('rr',4,'fixed'),aw=M.routeSim('aware',4,'fixed'),dy=M.routeSim('aware',4,'dynamic');
 assert.ok(aw.hitRate>0.99&&rr.hitRate<0.35&&dy.hitRate<0.05);
 near(M.routeSim('rr',1,'fixed').hitRate,M.routeSim('aware',1,'fixed').hitRate,1e-9);
 assert.equal(aw.load.reduce((a,b)=>a+b,0),1200);assert.ok(aw.maxShare<0.4);
});

test('cold start and warm pool cost',()=>{
 assert.equal(M.coldStart({node:'ca',image:'pull',weights:'plain',warm:0}).cold,383);
 near(M.coldStart({node:'karp',image:'seeded',weights:'snapshot',warm:0}).cold,62.5);
 const w=M.coldStart({node:'ca',image:'pull',weights:'plain',warm:1});assert.equal(w.first,3);assert.equal(w.warmMonth,2920);
 assert.equal(M.coldStart({node:'karp',image:'seeded',weights:'snapshot',warm:0}).first,M.coldStart({node:'karp',image:'seeded',weights:'snapshot',warm:0}).cold);
});

test('daily bill: low hit rate costs more than no cache, batch halves',()=>{
 const base=M.dailyBill(0,'sync').base;near(base,105);near(M.dailyBill(0,'sync').day,120);
 near(M.dailyBill(0.07,'sync').day,115.17);near(M.dailyBill(0.74,'sync').day,68.94);
 near(M.dailyBill(0.74,'batch').day,M.dailyBill(0.74,'sync').day/2,1e-9);
 const r=M.dailyBill(0.5,'sync');near(r.parts.prefix+r.parts.dynamic+r.parts.output,r.day,1e-9);
 near(M.parallelWrites(10).ratio,5.81);
});

test('cascade routing: savings and loss trade-off',()=>{
 near(M.cascade(0.7,'cascade').cost,0.391,1e-3);assert.equal(M.cascade(0.7,'cascade').loss,0);
 near(M.cascade(0.9,'cascade').loss,0.04,1e-9);near(M.cascade(0.9,'pre').loss,0.2,1e-9);near(M.cascade(0.9,'pre').cost,0.127,1e-3);
 assert.equal(M.cascade(0,'cascade').cost,1);
});

test('gateway fallback: independence model and full outage',()=>{
 near(M.gatewayFallback(0.3,2,false).failRate,0.027,1e-9);near(M.gatewayFallback(0.3,2,true).failRate,0.00054,1e-9);
 assert.equal(M.gatewayFallback(1,3,false).failRate,1);near(M.gatewayFallback(1,1,true).success,0.98,1e-9);
 assert.equal(M.gatewayFallback(0,2,false).failRate,0);assert.equal(M.gatewayFallback(0.3,2,true).worst,3010);
});

test('canary gate probabilities',()=>{
 const r=M.canary('refusal',1);near(r.stages[0].trip,0.218,1e-3);near(r.haltBy+r.reachFull,1,1e-9);
 near(M.canary('feedback',1).stages[0].trip,0.266,1e-3);near(M.canary('cost',1.3).stages[0].trip,0.70,1e-2);
 near(M.canary('refusal',2).stages[2].trip,0.5,1e-9);
 assert.ok(M.canary('cost',1.5).haltBy>M.canary('cost',1).haltBy);
});

test('burn rate and trace sampling',()=>{
 near(M.burnRate(0.05,0.2).burn,2.2,1e-9);assert.ok(M.burnRate(0.05,0.2).abort);
 near(M.burnRate(0.01,0.3).burn,0.8,1e-9);assert.ok(!M.burnRate(0.01,0.3).abort);near(M.burnRate(0.2,1).burn,40.2,1e-9);
 near(M.traceSampling(0.05,'rules').share,0.1165,1e-9);assert.equal(M.traceSampling(0.05,'rules').errKept,1);
 near(M.traceSampling(0.05,'uniform').rareCatch,0.642,1e-3);near(M.traceSampling(0.01,'rules').rareCatch,0.182,1e-3);
 assert.equal(M.traceSampling(1,'uniform').share,1);
});

test('final case: only the matching fix moves the failed metric',()=>{
 const fixes=['warm','reorder','chunk','route'],match={cold:'warm',cache:'reorder',tail:'chunk'};
 for(const rep of Object.keys(match))for(const f of fixes){const r=M.finalCase(rep,f);
  if(f===match[rep]){assert.ok(r.matched);assert.ok(r.lowerBetter?r.after<r.before:r.after>r.before);}else assert.equal(r.after,r.before);}
 near(M.finalCase('cache','reorder').after,68.94);near(M.finalCase('tail','chunk').after,97,1e-6);
});

test('home decode: bandwidth floor and HBM limit',()=>{
 near(M.homeDecode(1).tpot,10.55);near(M.homeDecode(119).tpot,22.37);assert.ok(M.homeDecode(119).meets);
 assert.ok(!M.homeDecode(120).fits);assert.ok(!M.homeDecode(120).meets);
 for(let c=1;c<160;c+=10)assert.ok(M.homeDecode(c+1).tpot>M.homeDecode(c).tpot);
});
