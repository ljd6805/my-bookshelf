/* 계산 함수의 대표값·경계값·불변 조건 */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
test('preflight: optional misses never fail, required misses do',()=>{
 const ok=M.preflight('beginner','none');assert.equal(ok.exit,0);assert.equal(ok.total,2);
 assert.equal(M.preflight('beginner','node').exit,0);assert.equal(M.preflight('beginner','node').optionalMissing,2);
 assert.equal(M.preflight('beginner','gpu').exit,0);
 assert.equal(M.preflight('agent-skills','node').exit,1);assert.equal(M.preflight('agent-skills','node').passed,2);
 assert.equal(M.preflight('ml-foundations','numpy').exit,1);
 for(const r of Object.keys(M.ROUTES))assert.equal(M.preflight(r,'git').exit,1,r);
});
test('resolveEnv: global install overwrites, separate envs both work',()=>{
 const g=M.resolveEnv({aMin:3,aMax:6,bPin:1,mode:'global'});assert.equal(g.okA,false);assert.deepEqual(g.common,[]);
 const s=M.resolveEnv({aMin:3,aMax:6,bPin:1,mode:'separate'});assert.ok(s.okA&&s.okB);
 const g2=M.resolveEnv({aMin:3,aMax:6,bPin:4,mode:'global'});assert.equal(g2.okA,true);assert.deepEqual(g2.common,[4]);
 assert.equal(M.resolveEnv({aMin:3,aMax:6,bPin:6,mode:'global'}).okA,true);
});
test('cudaCheck: wheel CUDA must not exceed driver CUDA',()=>{
 assert.equal(M.cudaCheck('12.4','12.1').gpu,true);assert.equal(M.cudaCheck('12.4','12.4').gpu,true);
 assert.equal(M.cudaCheck('12.1','12.4').gpu,false);assert.equal(M.cudaCheck('none','12.1').gpu,false);
 assert.equal(M.cudaCheck('12.4','cpu').gpu,false);assert.equal(M.cudaCheck('11.8','cpu').runs,true);
});
test('gitMerge: fast-forward only when main did not move',()=>{
 assert.deepEqual(M.gitMerge(2,0,3),{type:'fast-forward',mergeCommit:0,logCount:5,mainBefore:2,expTip:5});
 const m=M.gitMerge(2,2,3);assert.equal(m.type,'merge');assert.equal(m.logCount,8);
});
test('ignoreRules: more rules never increase committed size, .env leaves at level 4',()=>{
 let prev=Infinity;for(let l=0;l<=4;l++){const r=M.ignoreRules(l);assert.ok(r.mb<=prev);prev=r.mb;assert.equal(r.kept.length+r.ignored.length,M.FILES.length);}
 assert.equal(M.ignoreRules(3).secret,true);assert.equal(M.ignoreRules(4).secret,false);
 assert.ok(Math.abs(M.ignoreRules(4).mb-0.32)<1e-9);
});
test('vramFit: 7B fp16 is 14 GB of weights, boundary is inclusive',()=>{
 assert.equal(M.vramFit(7,2,16).weights,14);assert.equal(M.vramFit(7,2,16).fits,false);
 assert.equal(M.vramFit(7,2,16,0).fits,true);assert.equal(M.vramFit(8,2,16,0).fits,true);
 assert.ok(Math.abs(M.vramFit(1,2,24).maxB-10)<1e-9);
});
test('cloudCost: idle hours are billed at the same price',()=>{
 const c=M.cloudCost(1,6,0);assert.equal(c.runH,1);assert.equal(c.cost,1);assert.equal(c.cpuH,48);
 const d=M.cloudCost(2,6,9);assert.equal(d.cost,20);assert.equal(d.idleShare,0.9);
 assert.equal(M.cloudCost(0.2,0,0).idleShare,0);
});
test('survive: only nohup and tmux outlive the SSH drop, only tmux reattaches',()=>{
 assert.equal(M.survive('bg').survive,false);assert.equal(M.survive('fg').survive,false);
 assert.equal(M.survive('nohup').survive,true);assert.equal(M.survive('nohup').reattach,false);
 assert.equal(M.survive('tmux').reattach,true);assert.equal(M.survive('tmux').steps[3][1],'attach');
});
test('chmod: octal digits map to rwx bits',()=>{
 assert.equal(M.chmod(7,5,4,'owner').text,'-rwxr-xr--');assert.equal(M.chmod(6,4,4,'owner').text,'-rw-r--r--');
 assert.equal(M.chmod(7,5,4,'other').canExec,false);assert.equal(M.chmod(7,5,4,'group').canExec,true);
 assert.equal(M.chmod(1,1,1,'owner').canExec,false);assert.equal(M.chmod(0,0,0,'owner').text,'----------');
});
test('dockerBuild: a change rebuilds that layer and every later one',()=>{
 const g=M.dockerBuild('code','good');assert.equal(g.sec,2);assert.equal(g.cached,4);
 const b=M.dockerBuild('code','bad');assert.equal(b.sec,422);
 assert.equal(M.dockerBuild('base','good').sec,M.dockerBuild('base','good').full);
 for(const o of ['good','bad'])for(const k of Object.keys(M.LAYERS)){const r=M.dockerBuild(k,o);assert.ok(r.sec<=r.full&&r.sec>0);}
});
test('keyLeak: ignored .env and env vars never reach history',()=>{
 assert.equal(M.keyLeak('envignored','public').level,0);assert.equal(M.keyLeak('envvar','public').level,0);
 assert.equal(M.keyLeak('literal','public').level,2);assert.equal(M.keyLeak('tracked','private').level,1);
 assert.equal(M.keyLeak('literal','local').inHistory,true);assert.equal(M.keyLeak('literal','local').level,0);
});
test('kernel: hidden state and order change the result',()=>{
 assert.equal(M.kernel('top').now.y,20);assert.equal(M.kernel('top').same,true);
 assert.equal(M.kernel('twice').now.y,30);assert.equal(M.kernel('twice').same,false);
 assert.ok(M.kernel('early').now.error);assert.equal(M.kernel('deleted').now.y,20);assert.equal(M.kernel('deleted').fresh.y,10);
});
test('split: 70/10/20 sizes, same seed reproduces, different seed leaks',()=>{
 const s=M.split(1000,42);assert.deepEqual([s.train.length,s.val.length,s.test.length],[700,100,200]);
 assert.deepEqual(M.split(1000,42).test,s.test);
 assert.equal(new Set([...s.train,...s.val,...s.test]).size,1000);
 assert.equal(M.leak(1000,42,42).overlap,0);const l=M.leak(1000,42,7);assert.ok(l.rate>0.5&&l.rate<0.9,String(l.rate));
});
test('stepTime: workers overlap loading with compute',()=>{
 assert.equal(M.stepTime(60,40,0).step,100);assert.equal(M.stepTime(60,40,2).step,40);
 assert.equal(M.stepTime(60,40,1).bottleneck,'데이터 로딩');assert.equal(M.stepTime(60,40,8).idle,0);
 for(let w=0;w<=8;w++)assert.ok(M.stepTime(60,40,w).step>=40);
});
test('lossCurve: |1-2η| decides convergence; breakpoint fires above 100',()=>{
 assert.equal(M.lossCurve(0.25).kind,'수렴');assert.ok(M.lossCurve(0.25).final<1e-6);
 assert.equal(M.lossCurve(1).kind,'제자리');assert.equal(M.lossCurve(1).final,1);
 const d=M.lossCurve(1.2);assert.equal(d.kind,'발산');assert.equal(d.stop,7);
 assert.equal(M.lossCurve(0.75).kind,'출렁이며 수렴');assert.equal(M.lossCurve(0.05).kind,'느린 수렴');assert.equal(M.lossCurve(0.05).stop,-1);
});
test('triage: symptom-first is never slower than bottom-up or top-down here',()=>{
 for(const s of ['importfail','nocuda','acc99','slow']){const sym=M.triage(s,'symptom');assert.equal(sym.checks,1);
  assert.ok(sym.minutes<=M.triage(s,'bottom').minutes&&sym.minutes<=M.triage(s,'top').minutes);}
 assert.equal(M.triage('slow','bottom').minutes,41);assert.equal(M.triage('importfail','top').minutes,58);
});
