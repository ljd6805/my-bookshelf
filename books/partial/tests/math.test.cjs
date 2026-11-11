/* 계산 함수의 대표값·경계값·불변 조건. 본문·결과 읽기·복습 문항에 적은 숫자가 여기서 계산한 값과 같은지도 확인한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx={};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/math.js'),'utf8'),ctx);
const M=ctx.DXMath,near=(a,b,e=1e-6,m='')=>assert.ok(Math.abs(a-b)<=e,`${m} ${a} vs ${b}`);

test('cafe loss: expanded formula equals the mean squared error of the eight days',()=>{
 const mse=(w,b)=>M.DATA.x.reduce((s,x,i)=>s+(w*x+b-M.DATA.y[i])**2,0)/8;
 for(const [w,b] of [[2,12],[0,8],[8,16],[4.05,11.58],[-1,20]])near(M.loss(w,b),mse(w,b),1e-9);
 near(M.loss(2,12),69);near(M.loss(3,12),17.75);near(M.loss(1,9),225.75);
 const best=M.best();near(best.w,4.048,1e-3);near(best.b,11.583,1e-3);near(best.loss,1.4256,1e-4);
 const g=M.grad(best.w,best.b);near(g.gw,0,1e-9);near(g.gb,0,1e-9);
});

test('secant slope approaches the derivative; the gap is exactly 17.5h',()=>{
 near(M.secant(2,1).slope,-51.25);near(M.secant(2,0.1).slope,-67);near(M.secant(2,0.01).slope,-68.575,1e-9);near(M.secant(2,2).slope,-33.75);
 for(const h of [2,1,0.5,0.1,0.01]){const r=M.secant(2,h);near(r.exact,-68.75);near(r.gap,17.5*h,1e-9);}
 near(M.secant(4,0.01).exact,1.25);
});

test('partial derivatives are slopes of the slices and match numeric differences',()=>{
 const a=M.slice(2,12,'w');near(a.slope,-68.75);near(a.other,-13.5);near(a.p,17.5);near(a.q,-138.75);near(a.r,276.5);near(a.bottom,3.9643,1e-4);
 const b=M.slice(2,12,'b');near(b.slope,-13.5);near(b.q,-37.5);near(b.r,375);
 near(M.slice(2,16,'w').slope,-40.75);
 near(M.grad(3.9642857,12).gb,0.25,1e-6);
 for(const [w,b2] of [[0,8],[8,16],[5,9]])for(const k of ['w','b']){const r=M.slice(w,b2,k);near(r.slope,r.numeric,1e-5);}
});

test('five surfaces: rule-based partials equal numeric partials',()=>{
 const want={bowl:[2,-3],plane:[3,2],product:[-1.5,1],saddle:[2,3],mixed:[-3,1]};
 for(const k of Object.keys(M.SURFACES)){const r=M.partials(k,1,-1.5);near(r.fx,want[k][0]);near(r.fy,want[k][1]);
  for(const [x,y] of [[-2,-2],[2,2],[0,0],[0.25,-1.75]]){const q=M.partials(k,x,y);near(q.fx,q.nx,1e-6);near(q.fy,q.ny,1e-6);}}
 const s=M.partials('saddle',0,0);near(s.fx,0);near(s.fy,0);
});

test('tangent plane estimate: error is exactly the quadratic remainder',()=>{
 const a=M.planeEstimate(2,12,0.1,0.1);near(a.estimate,-8.225);near(a.actual,-7.97);near(a.error,0.255);
 const b=M.planeEstimate(2,12,0.5,1);near(b.estimate,-47.875);near(b.actual,-39);near(b.error,8.875);
 near(M.planeEstimate(2,12,2,2).error,102);
 const c=M.planeEstimate(4,11.5,0.5,1);near(c.gw,-2.25);near(c.gb,-0.5);near(c.estimate,-1.625);near(c.actual,7.25);
 for(const [dw,db] of [[0,0],[-2,2],[1.3,-0.7]]){const r=M.planeEstimate(6,14,dw,db);near(r.error,17.5*dw*dw+db*db+7*dw*db,1e-9);near(r.error,r.curve,1e-9);}
});

test('directional rate: largest along the gradient, zero at right angles',()=>{
 const g=M.grad(2,12);near(g.norm,70.0629,1e-4);near((g.deg+360)%360,191.11,1e-2);
 near(M.directional(2,12,0).rate,-68.75);near(M.directional(2,12,90).rate,-13.5);
 near(M.directional(2,12,190).rate,70.05,1e-2);near(M.directional(2,12,10).rate,-70.05,1e-2);near(M.directional(2,12,100).rate,-1.357,1e-3);
 const h=M.grad(6,14);near(h.gw,85.25);near(h.gb,18.5);near(h.norm,87.234,1e-3);
 const k=M.grad(4,9);near(k.norm,20.50,1e-2);
 for(let d=0;d<360;d+=10){const r=M.directional(6,14,d);assert.ok(Math.abs(r.rate)<=r.norm+1e-9);near(r.rate,r.numeric,1e-4);}
 near(M.directional(2,12,g.deg+90).rate,0,1e-9);
});

test('gradient descent walk: representative losses and the step limit',()=>{
 const one=M.walk(1,9,0.02,1);near(one.first.gw,-124.75);near(one.first.gb,-26.5);near(one.last.w,3.495);near(one.last.b,9.53);near(one.last.L,18.93,1e-2);
 near(M.walk(1,9,0.02,2).last.L,3.66,1e-2);near(M.walk(1,9,0.02,5).last.L,2.38,1e-2);near(M.walk(1,9,0.02,60).last.L,1.69,1e-2);
 near(M.walk(1,9,0.005,60).last.L,2.18,1e-2);near(M.walk(1,9,0.05,60).last.L,1.46,1e-2);
 const bad=M.walk(1,9,0.056,10);assert.ok(bad.diverged);near(bad.last.L,488.47,1e-2);assert.ok(!M.walk(1,9,0.05,60).diverged);
 near(M.stepLimit().limit,0.0549,1e-4);assert.equal(M.walk(1,9,0.02,0).path.length,1);
 const p=M.walk(7,15,0.02,30).path;for(let i=1;i<p.length;i++)assert.ok(p[i].L<=p[i-1].L+1e-9,'loss never rises below the limit');
});

test('chain rule on one day: product of inner and outer rates',()=>{
 const r=M.chainDay(7,3);assert.equal(r.u,-8);assert.equal(r.l,64);assert.equal(r.inner,7);assert.equal(r.outer,-16);assert.equal(r.slope,-112);near(r.actual,-10.71);near(r.estimate,-11.2);
 assert.equal(M.chainDay(0,3).slope,0);assert.equal(M.chainDay(4,4).slope,0);assert.equal(M.chainDay(7,5).slope,84);assert.equal(M.chainDay(3,3).slope,-6);
 for(let d=0;d<8;d++){const q=M.chainDay(d,2.3);near(q.slope,q.numeric,1e-5);}
});

test('one neuron: local derivatives multiplied backwards equal the numeric gradient',()=>{
 const r=M.neuron(0.8);near(r.z,0.7);near(r.a,0.6682,1e-4);near(r.L,0.1101,1e-4);near(r.dLda,-0.6636,1e-4);near(r.dadz,0.2217,1e-4);near(r.dLdz,-0.1471,1e-4);near(r.dLdw,-0.2207,1e-4);
 near(M.neuron(3).dLdw,-0.00095,1e-5);near(M.neuron(-2).dLdw,-0.0829,1e-4);near(M.neuron(-2).a,0.0293,1e-4);
 for(const w of [-3,-1,0,0.8,3]){const q=M.neuron(w);near(q.dLdw,q.numeric,1e-7);near(q.dLdw,q.dLdz*q.x,1e-12);near(q.dLdb,q.dLdz,1e-12);}
});

test('paths add: per-day shares sum to the expanded partial derivative',()=>{
 const r=M.pathSum(3,8);[0,0,-1.5,-0.75,-4,-7.5,-6,-14].forEach((v,i)=>near(r.parts[i].c,v));near(r.total,-33.75);near(r.total,M.grad(3,12).gw);
 const f=M.pathSum(3,4);[0,0,-3,-1.5].forEach((v,i)=>near(f.parts[i].c,v));near(f.total,-4.5);near(M.pathSum(4,8).total,1.25);assert.equal(M.pathSum(3,1).total,0);
 for(let n=1;n<=8;n++){const q=M.pathSum(5.5,n);near(q.total,q.numeric,1e-5);}
});

test('shared weight: T paths of w^(T-1)x each',()=>{
 near(M.shared(0.9,3).total,4.86);near(M.shared(0.9,8).total,7.653,1e-3);near(M.shared(1.5,3).total,13.5);near(M.shared(1.5,8).total,273.375,1e-3);
 for(const T of [1,2,5,8])for(const w of [0.5,1,1.5]){const r=M.shared(w,T);near(r.total,T*r.each,1e-9);near(r.total,r.numeric,1e-4);}
});

test('deep chain: products vanish or explode with depth',()=>{
 near(M.deepChain('sigmoid',1,5).product,6.08e-4,1e-6);near(M.deepChain('sigmoid',1,10).product,3.48e-7,1e-9);near(M.deepChain('sigmoid',1,20).product,1.14e-13,1e-15);
 near(M.deepChain('sigmoid',3,10).product,3.97e-8,1e-10);near(M.deepChain('tanh',1,20).product,0.107,1e-3);
 near(M.deepChain('relu',0.5,10).product,0.5**10,1e-12);near(M.deepChain('relu',0.9,20).product,0.9**20,1e-12);near(M.deepChain('relu',1.5,20).product,1.5**20,1e-6);near(M.deepChain('relu',1,20).product,1);
 for(const k of Object.keys(M.ACT_NAME)){const r=M.deepChain(k,1.2,7);assert.equal(r.factors.length,7);near(r.product,r.factors.reduce((a,b)=>a*b,1),1e-12);}
});

test('2-2-1 audit: the correct method matches numeric gradients, each mistake does not',()=>{
 const base=M.audit('v1','correct');near(base.h[0],0.5987,1e-4);near(base.h[1],0.6225,1e-4);near(base.o,0.5611,1e-4);near(base.L,0.1926,1e-4);
 near(base.value,-0.12942,1e-5);near(M.audit('w11','correct').value,-0.03636,1e-5);near(M.audit('x1','correct').value,-0.00903,1e-5);
 for(const t of M.AUDIT_TARGETS){const r=M.audit(t,'correct');assert.ok(r.relError<1e-6,t);}
 near(M.audit('v1','skipact').value,-0.52553,1e-5);near(M.audit('w11','skipact').value,-0.15132,1e-5);near(M.audit('x1','skipact').value,-0.03675,1e-5);
 near(M.audit('x1','onepath').value,-0.01818,1e-5);near(M.audit('x1','multiply').value,0.00077,1e-5);
 for(const m of ['skipact','onepath','multiply'])assert.ok(M.audit('x1',m).relError>0.5,m);
 assert.equal(M.audit('v1','onepath').applies,false);near(M.audit('v1','onepath').value,base.value,1e-12);
});
