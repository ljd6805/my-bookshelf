/* 계산 모델(js/math.js)의 대표값·경계값·불변 조건. 본문과 예제, 복습 문항에 적은 숫자를 여기서 대조한다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,e=1e-6,msg)=>assert.ok(Math.abs(a-b)<=e,`${msg||''} ${a} ≉ ${b}`);
const RK=M.rocket;
test('rocket model: heights, velocity, acceleration, top',()=>{
 assert.deepEqual([0,1,2,3,4].map(RK.h),[0,15,20,15,0]);assert.deepEqual([0,1,2,3].map(RK.v),[20,10,0,-10]);assert.equal(RK.a(1.7),-10);
 for(const t of [0.3,1,2.6])near(M.numDiff(RK.h,t),RK.v(t),1e-6,'v = h′');
});
test('average rate: chapter values and the identity 20 − 5(a + b)',()=>{
 assert.equal(M.avgRate(RK.h,1,2),5);assert.equal(M.avgRate(RK.h,0,4),0);assert.equal(M.avgRate(RK.h,2.5,3.5),-10);assert.equal(M.avgRate(RK.h,0.5,1.5),10);assert.equal(M.avgRate(RK.h,3,4),-15);
 for(const [a,b] of [[0.2,1.9],[1,3.3],[0.5,2.5]])near(M.avgRate(RK.h,a,b),20-5*(a+b),1e-9);
 assert.ok(!Number.isFinite(M.avgRate(RK.h,1,1)),'a = b is undefined');
});
test('shrinking intervals approach the derivative from both sides',()=>{
 const r=M.shrinkTable(RK.h,1,[1,0.5,0.1,0.01,0.001]);[5,7.5,9.5,9.95,9.995].forEach((v,i)=>near(r[i].avg,v,1e-9));
 near(M.shrinkTable(RK.h,1,[-0.01])[0].avg,10.05,1e-9);near(M.shrinkTable(RK.h,3,[1])[0].avg,-15,1e-9);near(M.shrinkTable(RK.h,2,[0.0001])[0].avg,-0.0005,1e-7);
});
test('limits: removable hole, jump, sin x / x',()=>{
 const h=M.limitProbe('hole',1e-3),j=M.limitProbe('jump',1e-3),s=M.limitProbe('sinc',1e-3);
 assert.ok(h.exists&&h.limit===2&&!Number.isFinite(M.LIMITS.hole.value));near(h.left,1.999,1e-9);near(h.right,2.001,1e-9);
 assert.ok(!j.exists&&j.left===1000&&j.right===1500&&M.LIMITS.jump.value===1500);
 assert.ok(s.exists&&s.limit===1);near(M.limitProbe('sinc',1).right,Math.sin(1),1e-12);
});
test('function table: analytic derivatives match central differences',()=>{
 for(const [id,Fn] of Object.entries(M.FUNCS)){if(id==='abs')continue;const [a,b]=Fn.dom;
  for(const k of [0.13,0.5,0.81]){const x=a+(b-a)*k;near(Fn.d1(x),M.numDiff(Fn.f,x),1e-5,id+' d1');near(Fn.d2(x),M.numDiff(Fn.d1,x),1e-5,id+' d2');}}
});
test('critical points are classified by the sign change of f′',()=>{
 assert.deepEqual(M.classify('rocket').map(c=>[c.x,c.f,c.kind]),[[2,20,'max']]);
 assert.deepEqual(M.classify('cubic').map(c=>[c.x,c.f,c.kind]),[[-1,2,'max'],[1,-2,'min']]);
 assert.deepEqual(M.classify('cube').map(c=>c.kind),['none']);
 const s=M.classify('sine');near(s[0].x,Math.PI/2);assert.equal(s[0].kind,'max');near(s[1].x,3*Math.PI/2);assert.equal(s[1].kind,'min');
});
test('power pieces: slabs + rods + corner = exact growth',()=>{
 const a=M.powerPieces(3,2,1),b=M.powerPieces(3,2,0.5),q=M.powerPieces(2,3,1);
 assert.deepEqual([a.slabs,a.rods,a.corner,a.exact,a.rule],[12,6,1,19,12]);near(b.slabs/b.exact,0.7869,1e-4);near(b.ratio,15.25);
 assert.deepEqual([q.slabs,q.corner,q.exact,q.ratio,q.rule],[6,1,7,7,6]);
 for(const dx of [1,0.3,0.01]){const p=M.powerPieces(3,1.5,dx);near(p.slabs+p.rods+p.corner,p.exact,1e-12);near(p.exact,(1.5+dx)**3-1.5**3,1e-12);}
 near(M.powerPieces(3,2,1e-6).ratio,12,1e-4);
});
test('polynomial derivative',()=>{
 assert.deepEqual([...M.polyDeriv([0,20,-5,0])],[20,-10,0]);assert.deepEqual([...M.polyDeriv([-9,7,-4,2])],[7,-8,6]);
 assert.equal(M.polyEval(M.polyDeriv([-9,7,-4,2]),1),5);assert.equal(M.polyEval(M.polyDeriv([5,-2,3]),2),10);
});
test('product and quotient rules',()=>{
 const p=M.productRect(3,2,1,2,1);assert.deepEqual([p.stripV,p.stripU,p.corner,p.delta,p.avg,p.rule,p.wrong],[2,6,2,10,10,8,2]);
 near(M.productRect(3,2,1,2,0.01).avg,8.02,1e-9);near(M.quotientRule(1,2,2,1),0.75);
 assert.equal(3*5*0+4*5+3*-1,17);
});
test('chain rule: outer derivative is evaluated at the inner value',()=>{
 const a=M.chainAt('lin','sq',0.5);assert.deepEqual([a.u,a.inner,a.outer,a.product,a.wrong],[2.5,3,5,15,3]);
 for(const g of Object.keys(M.INNER))for(const f of Object.keys(M.OUTER))for(const x of [-1.3,0.4,1.5]){const c=M.chainAt(g,f,x);near(c.product,c.numeric,1e-4*Math.max(1,Math.abs(c.product)),g+f);}
 const s=M.chainAt('sq','sin',1.5);assert.ok(s.product<0&&s.wrong>0);near(s.product,3*Math.cos(2.25),1e-12);
});
test('balloon: dV/dt = 4πr² · dr/dt and the thin-shell estimate',()=>{
 const b=M.balloon(2,0.5);near(b.r,3);near(b.dVdr,36*Math.PI);near(b.dVdt,18*Math.PI);near(b.dVdt,56.5487,1e-4);
 near(M.balloon(4,0.5).dVdt/M.balloon(1,0.5).dVdt,2.56,1e-9);
 const s=M.shell(3,0.5);near(s.exact,4/3*Math.PI*(3.5**3-27),1e-9);assert.ok(M.shell(3,0.05).rel<M.shell(3,0.5).rel);
});
test('exponential, circle, parachute, launch range, sigmoid',()=>{
 near(M.expBase(2,1).ratio,Math.LN2);near(M.expBase(4,0).ratio,2*Math.LN2);near(M.expBase(Math.E,1.3).ratio,1,1e-12);near(M.expBase(3,0).ratio,1.0986,1e-4);
 const c=M.circlePoint(Math.PI/6);near(c.y,0.5);near(c.dy,Math.cos(Math.PI/6));near(c.dx,-0.5);near(M.circlePoint(0).perDegree,Math.PI/180);
 near(M.chute(0).a,-10);near(M.chute(0.8).a,-10/Math.E);assert.ok(Math.abs(M.chute(4).a)<0.07&&Math.abs(M.chute(40).v+8)<1e-9);
 near(M.launchRange(45).R,40);near(M.launchRange(45).dRdTheta,0,1e-9);near(M.launchRange(30).dRdTheta,40,1e-9);near(M.launchRange(30).dRdDeg,0.698,1e-3);
 near(M.sigmoid(0).d,0.25);near(M.sigmoid(2).s,0.8808,1e-4);near(M.sigmoid(2).d,0.105,1e-3);
});
test('box: V and V′, maximum inside the range',()=>{
 assert.deepEqual([2,5,8,4,6].map(x=>M.box(x,30,30).V),[1352,2000,1568,1936,1944]);assert.equal(M.box(4,30,30).dV,132);assert.equal(M.box(5,30,30).dV,0);assert.ok(M.box(8,30,30).dV<0);
 const a=M.boxBest(30,30),b=M.boxBest(30,20);near(a.x,5);near(a.V,2000);near(b.x,(50-Math.sqrt(700))/6);near(b.V,1056.306,1e-3);near(b.other,12.7429,1e-4);
 for(const x of [1,3.3,7])near(M.box(x,30,20).dV,M.numDiff(t=>M.box(t,30,20).V,x),1e-4);
 near(M.boxBest(12,12).x,2);near(M.boxBest(12,12).V,128);
});
test('linear approximation and its error',()=>{
 const r=M.linearApprox('sqrt',26);near(r.L,5.1);near(r.error,0.00098,1e-5);near(M.linearApprox('sqrt',36).error,0.1);near(M.linearApprox('sqrt',24).L,4.9);
 near(M.linearApprox('rocket',1.1).error,0.05);near(M.linearApprox('rocket',1.5).error,1.25);near(M.linearApprox('exp',0.1).L,1.1);
 near(M.linearApprox('sqrt',33).error/M.linearApprox('sqrt',29).error,3.74,0.01);
});
test('Newton: converges, stops on a flat tangent, cycles',()=>{
 const a=M.newton('rocket12',0,3).xs;near(a[1],0.6);near(a[2],0.728571,1e-6);near(a[3],0.735072,1e-6);
 const root=2-Math.sqrt(1.6);near(M.newton('rocket12',0.5,5).last,root,1e-9);near(M.newton('rocket12',2.5,1).last,3.85);near(M.newton('rocket12',2.5,6).last,2+Math.sqrt(1.6),1e-9);
 assert.equal(M.newton('rocket12',2,3).stopped,0);assert.deepEqual([...M.newton('cycle',0,4).xs],[0,1,0,1,0]);near(M.newton('cycle',-2,6).last,-1.7692924,1e-6);
 near(M.newton('sqrt2',1,1).last,1.5);near(M.newton('sqrt2',1,5).last,Math.SQRT2,1e-12);
});
test('can: cheapest shape has height ÷ diameter = k',()=>{
 for(const k of [1,2,3]){const b=M.canBest(k);near(b.ratio,k,1e-9);near(Math.PI*b.r*b.r*b.h,330,1e-9);near(b.dCost,0,1e-9);assert.ok(b.d2Cost>0);
  for(const r of [b.r-0.4,b.r+0.4])assert.ok(M.can(r,k).cost>b.cost);}
 const b=M.canBest(1);near(b.r,3.7449,1e-4);near(b.h,7.4899,1e-4);near(b.cost,264.357,1e-3);near(M.canBest(2).r,2.9724,1e-4);near(M.canBest(2).h,11.8894,1e-4);
 near(M.can(3,1).dCost,-35.63,0.01);near(M.can(4,1).dCost,9.02,0.01);near(M.can(2.5,1).cost,303.27,0.01);
 for(const r of [2.6,3.7,5.5])near(M.can(r,2).dCost,M.numDiff(t=>M.can(t,2).cost,r),1e-4);
 near(Math.cbrt(1000/Math.PI),6.83,0.005);
});
test('quiz order keeps every option and puts the answer on the target slot',()=>{
 for(let a=0;a<3;a++)for(let t=0;t<3;t++){const q=M.quizOrder(3,a,t);assert.equal(q[t],a);assert.deepEqual([...q].sort(),[0,1,2]);}
});
