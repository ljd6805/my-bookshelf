/* 계산 함수의 대표값·경계값·불변 조건 */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,e=1e-6,m='')=>assert.ok(Math.abs(a-b)<=e,`${m} ${a} vs ${b}`);

test('activations and derivatives match finite differences',()=>{
 near(M.sigmoid(0),0.5);near(M.dact('sigmoid',0),0.25);near(M.act('relu',-2),0);near(M.dact('relu',3),1);near(M.act('leaky',-1),-0.01);
 near(M.sigmoid(-800),0,1e-12);near(M.sigmoid(800),1,1e-12);assert.ok(Number.isFinite(M.sigmoid(-1e4)));
 for(const n of ['sigmoid','tanh','gelu','swish'])for(const z of [-2,-0.3,0.7,2.5]){const h=1e-5;near(M.dact(n,z),(M.act(n,z+h)-M.act(n,z-h))/(2*h),1e-6,n);}
 for(let z=-6;z<=6;z+=0.5)assert.ok(M.dact('sigmoid',z)<=0.25+1e-12);
});

test('perceptron learns AND, OR, NAND but never XOR',()=>{
 for(const g of ['AND','OR','NAND']){const r=M.perceptron(g,30);assert.ok(r.converged,g);assert.deepEqual(r.predict,M.GATES[g]);}
 const x=M.perceptron('XOR',200);assert.equal(x.converged,false);assert.ok(x.hist.every(h=>h.errors>0));
 const a=M.perceptron('AND',1);assert.equal(a.hist.length,1);
});

test('hand-wired 2-2-1 network computes XOR only with a nonlinearity',()=>{
 const r=M.xorForward(20);assert.deepEqual(r.map(x=>x.out>=0.5?1:0),[0,1,1,0]);r.forEach((x,i)=>near(x.out,[0,1,1,0][i],1e-3));
 const lin=M.xorForward(20,'linear');lin.forEach(x=>near(x.out,lin[0].out,1e-9,'linear collapses'));near(lin[0].out,370,1e-9);
});

test('chain rule gradient equals numeric gradient',()=>{
 for(const w of [-3,-0.5,0.8,2.9]){const c=M.chain(w);near(c.dLdw,c.numeric,1e-7);near(c.dLdw,c.dLda*c.dadz*1.5,1e-12);}
 assert.ok(Math.abs(M.chain(3).dLdw)<Math.abs(M.chain(0).dLdw),'saturation shrinks gradient');
});

test('loss gradients: BCE is p-y, MSE vanishes when confidently wrong',()=>{
 const l=M.lossAt(0.01);near(l.gBce,-0.99);near(l.gMse,2*(-0.99)*0.01*0.99);near(l.bce,-Math.log(0.01));
 assert.ok(Number.isFinite(M.lossAt(0).bce));near(M.lossAt(0.5).bce,Math.log(2));
 near(M.smooth(10,0.1)[0],0.91);near(M.smooth(10,0.1).reduce((a,b)=>a+b,0),1);
});

test('optimizers on the valley: SGD diverges above 2/25, momentum and Adam converge',()=>{
 assert.equal(M.valley('sgd',0.07).diverged,0);assert.ok(M.valley('sgd',0.09,200).diverged>0||M.valley('sgd',0.09).f>1e3);
 assert.ok(M.valley('momentum',0.03).f<M.valley('sgd',0.01).f);assert.ok(M.valley('adam',0.2,200).f<0.05);
 assert.equal(M.valley('sgd',0.05).path.length,41);
});

test('learning-rate schedules hit their endpoints',()=>{
 const T=100;near(M.lrAt('const',50,T,0.3),0.3);near(M.lrAt('cosine',0,T,1),1);near(M.lrAt('cosine',T,T,1),0.01);
 near(M.lrAt('warmcos',0,T,1),0.2);near(M.lrAt('warmcos',4,T,1),1);assert.ok(M.lrAt('warmcos',99,T,1)<0.02);
 near(M.lrAt('step',0,T,1),1);near(M.lrAt('step',40,T,1),0.1);near(M.lrAt('onecycle',0,T,1),0.04);near(M.lrAt('onecycle',50,T,1),1);
 for(const k of ['const','step','cosine','warmcos','onecycle'])for(let t=0;t<T;t++){const v=M.lrAt(k,t,T,1);assert.ok(v>0&&v<=1+1e-12,k+t);}
});

test('dataset is reproducible and nearly balanced',()=>{
 const a=M.dataset('circle',400,5),b=M.dataset('circle',400,5);assert.deepEqual(a,b);
 const frac=a.Y.reduce((s,y)=>s+y,0)/400;assert.ok(frac>0.4&&frac<0.6,String(frac));
 a.X.forEach((p,i)=>assert.equal(a.Y[i],p[0]**2+p[1]**2<0.64?1:0));
});

test('training the circle classifier: deterministic, learns, and wider helps',()=>{
 const r1=M.train({width:8,epochs:200,seed:1}),r2=M.train({width:8,epochs:200,seed:1});
 assert.deepEqual(r1.loss,r2.loss);assert.ok(r1.loss[0]>0.6&&r1.trainLoss<0.2);assert.ok(r1.valAcc>0.8);
 assert.ok(M.train({width:1,epochs:200,seed:1}).valAcc<r1.valAcc);
 assert.ok(r1.val.filter(v=>v!==null).length<=101);assert.equal(r1.loss.length,200);
 const x=M.train({data:'xor',width:2,act:'sigmoid',opt:'sgd',lr:2,epochs:1000,seed:1});assert.ok(x.trainLoss<0.05);
 const stuck=M.train({data:'xor',width:2,act:'sigmoid',opt:'sgd',lr:2,epochs:1000,seed:6});assert.ok(stuck.trainLoss>0.3);
});

test('regularization narrows the generalization gap in the dropout lab setting',()=>{
 const base=M.train({n:40,noise:0.15,width:32,epochs:400,lr:0.03,seed:2}),drop=M.train({n:40,noise:0.15,width:32,epochs:400,lr:0.03,dropout:0.3,seed:2});
 assert.equal(base.trainAcc,1);assert.ok(drop.trainAcc-drop.valAcc<base.trainAcc-base.valAcc);assert.ok(drop.valAcc>base.valAcc);
});

test('deliberate bugs leave their signatures',()=>{
 const ok=M.train({epochs:150,seed:1}),lab=M.train({bug:'labels',epochs:150,seed:1}),nz=M.train({bug:'nozero',epochs:150,seed:1});
 assert.ok(lab.valAcc<0.5&&lab.trainAcc>0.6);assert.ok(nz.trainLoss>ok.trainLoss*5);
 const lr=M.train({bug:'lr',epochs:150,seed:1}),tail=lr.loss.slice(-30);assert.ok(Math.max(...tail)-Math.min(...tail)>0.1);
});

test('deep stats: He keeps ReLU signal, small init vanishes, sigmoid gradients vanish',()=>{
 const he=M.deepStats('relu','he',30).fwd,sm=M.deepStats('relu','small',30).fwd;assert.ok(he[29]>0.3&&he[29]<3);assert.ok(sm[29]<1e-20);
 const g=M.deepStats('sigmoid','he',20).bwd;assert.ok(g[0]/g[19]<1e-8);const r=M.deepStats('relu','he',20).bwd;assert.ok(r[0]/r[19]>0.3);
 assert.equal(M.initStd('xavier',48,48),Math.sqrt(2/96));assert.equal(M.initStd('he',50,10),Math.sqrt(2/50));
});

test('final task: sigmoid+small init is stuck, ReLU+He+AdamW recovers',()=>{
 const bad=M.train({depth:6,width:8,act:'sigmoid',init:'small',opt:'sgd',lr:0.5,epochs:200,seed:1});assert.ok(bad.trainLoss>0.68);assert.ok(bad.gradNorm[0]/bad.gradNorm[6]<1e-10);
 const good=M.train({depth:6,width:8,act:'relu',init:'he',opt:'adam',lr:0.02,epochs:200,seed:1});assert.ok(good.trainLoss<0.1&&good.valAcc>0.85);
});

test('autodiff accumulates gradients over every path',()=>{
 const r=M.autodiff('reuse');near(r.grad.a,-3+1);near(r.grad.b,2);assert.equal(r.snaps.length,3);near(r.snaps[1].grad.a,1);
 const n=M.autodiff('neuron'),c=M.chain(0.8);near(n.grad.w,c.dLdw,1e-12);near(n.val.L,c.L,1e-12);
});

test('parameter count and memory',()=>{
 assert.equal(M.mlpParams([784,256,128,10]),235146);assert.equal(M.mlpParams([2,1]),3);
 const m=M.memory([784,256,128,10],'bfloat16');assert.equal(m.weights,235146*2);assert.equal(m.trainAdam,235146*16);
});

test('gradient check flags buggy backprop and tolerates good ε',()=>{
 assert.ok(M.gradCheck(1e-5,'none').max<1e-7);assert.ok(M.gradCheck(1e-5,'sign').max>0.9);assert.ok(M.gradCheck(1e-5,'factor').max>0.3);
 assert.ok(M.gradCheck(0.1,'none').max>M.gradCheck(1e-5,'none').max);
});
