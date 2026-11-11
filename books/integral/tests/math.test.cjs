/* 계산 함수의 대표값·경계값·불변 조건. 본문·예제·결과 읽기에 적은 숫자를 여기서 대조한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx={};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/math.js'),'utf8'),ctx);
const M=ctx.IGMath,near=(a,b,e=1e-6,m='')=>assert.ok(Math.abs(a-b)<=e,`${m} ${a} vs ${b}`);

test('rain: rate, stored amount and the first five minutes',()=>{
 near(M.rate(1),5.4);near(M.rate(3),12.6);near(M.rate(5),15);near(M.rate(10),0);near(M.stored(5),50);near(M.stored(10),100);
 const l=M.riemann(M.rate,0,5,5,'left'),r=M.riemann(M.rate,0,5,5,'right');near(l.sum,42);near(r.sum,57);assert.equal(l.rects.length,5);near(l.dx,1);
 near(M.riemann(M.rate,0,5,10,'left').sum,46.125);near(M.riemann(M.rate,0,5,10,'right').sum,53.625);
 near(M.riemann(M.rate,0,5,1000,'left').sum,49.9625,1e-4);near(M.riemann(M.rate,0,5,1000,'right').sum,50.0375,1e-4);
});
test('riemann invariants: right − left = (f(b) − f(a))·Δx, and sums converge',()=>{
 for(const n of [1,5,50,1000]){const l=M.riemann(M.rate,0,5,n,'left').sum,r=M.riemann(M.rate,0,5,n,'right').sum;near(r-l,75/n,1e-9,'n='+n);assert.ok(l<50&&r>50);}
 near(M.riemann(M.rate,0,10,7,'left').sum,M.riemann(M.rate,0,10,7,'right').sum,1e-9,'r(0)=r(10)');
 near(M.riemann(M.rate,0,5,2000,'mid').sum,50,1e-5);
});
test('drain day: signed area 20 = 31.88 − 11.88, lowest stored amount −5.94',()=>{
 near(M.NET_ZERO[0],1.5843,1e-4);near(M.NET_ZERO[1],8.4157,1e-4);
 const s=M.signedParts(M.net,0,10,4000);near(s.pos,31.88,5e-3);near(s.neg,11.88,5e-3);near(s.net,20,1e-3);
 near(M.netStored(M.NET_ZERO[0]),-5.94,5e-3);near(M.netStored(10),20);
});
test('fundamental theorem: average rate of change tends to r(3) and F(b) − F(a) matches a Riemann sum',()=>{
 near(M.quotient(M.stored,3,1),13.6);near(M.quotient(M.stored,3,.1),12.718,1e-9);near(M.quotient(M.stored,3,.01),12.61198,1e-5);
 near(M.stored(7)-M.stored(2),68);near(M.riemann(M.rate,2,7,1000,'mid').sum,68,1e-5);near(M.stored(6)-M.stored(2),54.4);
});
test('storm: integration by parts closed form and its limit 32 L',()=>{
 near(M.storm(2),16/Math.E);near(M.stormStored(6),25.6273,1e-4);near(M.stormStored(12),31.4448,1e-4);near(M.stormStored(0),0);
 assert.ok(M.stormStored(60)<32&&M.stormStored(60)>31.9999);near(M.simpson(M.storm,0,6,2000),M.stormStored(6),1e-8);
});
test('numerical integration: values for exp(−x²) on [0,1] and error ratios',()=>{
 const exact=0.7468241328;near(M.riemann(x=>Math.exp(-x*x),0,1,4,'left').sum,0.821999,1e-6);
 near(M.trapezoid(x=>Math.exp(-x*x),0,1,4),0.742984,1e-6);near(M.simpson(x=>Math.exp(-x*x),0,1,4),0.746855,1e-6);near(M.simpson(x=>Math.exp(-x*x),0,1,200),exact,1e-9);
 const f=x=>Math.exp(-x*x),et=n=>Math.abs(M.trapezoid(f,0,1,n)-exact),es=n=>Math.abs(M.simpson(f,0,1,n)-exact);
 near(et(4)/et(8),4,.05);near(es(4)/es(8),16,.5);
 near(M.simpson(M.rate,0,10,2),100,1e-9,'simpson exact for quadratics');near(M.trapezoid(M.rate,0,10,4),93.75);near(M.trapezoid(x=>[0,6,8,6,0][x],0,4,4),20);near(M.simpson(x=>[0,6,8,6,0][x],0,4,4),64/3);
});
test('tank: disk sums, exact volume 38.4π and level for 100 L',()=>{
 near(M.bowlLevel(100),7.2837,1e-4);near(0.6*Math.PI*64,120.637,1e-3);near(0.6*Math.PI*16,30.159,1e-3);
 for(const k of Object.keys(M.SOLIDS)){const a=M.diskVolume(k,4,1),b=M.diskVolume(k,60,1);assert.ok(Math.abs(b.sum-b.exact)<=Math.abs(a.sum-a.exact)+1e-9,k);near(b.sum,b.exact,b.exact*5e-3,k);assert.equal(a.disks.length,4);}
});
test('probability: densities integrate to about 1 and interval values',()=>{
 near(M.density('normal',7,13).cdf,0.6827,1e-4);near(M.density('normal',4,16).cdf,0.9545,1e-4);near(M.density('normal',7,13).prob,0.6827,1e-4);
 near(M.density('uniform',5,8).prob,0.15,1e-6);near(M.density('expo',4,20).cdf,Math.exp(-1)-Math.exp(-5),1e-6);
 for(const k of Object.keys(M.DENSITY)){const d=M.density(k,0,1);assert.ok(d.total>0.99&&d.total<1.0001,k+' total '+d.total);}
 near(M.erf(1),0.8427008,2e-7);near(M.erf(0),0,1e-7);
});
test('double integral: column sums approach the exact volume',()=>{
 near(M.columns('dome',1).sum,16);near(M.columns('dome',2).sum,14);near(M.columns('dome',4).sum,13.5);near(M.columns('dome',10).sum,13.36);near(M.columns('dome',1).exact,40/3);
 near(M.columns('ramp',1).exact,16/3);near(M.columns('plane',1).exact,7);near(M.columns('plane',1).sum,7,1e-9,'midpoint exact for a plane');
 for(const k of Object.keys(M.SURFACES)){const a=M.columns(k,2),b=M.columns(k,12);assert.ok(Math.abs(b.sum-b.exact)<=Math.abs(a.sum-a.exact)+1e-9,k);assert.equal(b.cols.length,144);near(M.slabs(k,12).sum,b.exact,b.exact*.02,k+' slabs');}
});
test('final task: record, estimates by interval and verdicts',()=>{
 const rec=M.finalTable(2).map(r=>r[1]);assert.equal(rec.map(v=>v.toFixed(1)).join(),'0.0,13.9,10.2,5.6,2.8,1.3,0.6');
 const e=M.finalEstimate(2);near(e.est.left,67.6);near(e.est.right,68.8);near(e.est.trap,68.2);near(e.est.simpson,73.2);near(e.room,72.4);assert.equal(e.verdict,'split');
 assert.equal(M.finalEstimate(4).verdict,'under');assert.equal(M.finalEstimate(3).verdict,'under');assert.equal(M.finalEstimate(1).verdict,'split');assert.equal(M.finalEstimate(.5).verdict,'over');
 near(M.finalEstimate(4).est.trap,53.2);assert.equal(M.finalEstimate(4).est.simpson,null);near(M.finalEstimate(3).est.simpson,69.8);near(M.finalExact(),74.21,5e-3);assert.ok(M.finalExact()>72.4);
});
