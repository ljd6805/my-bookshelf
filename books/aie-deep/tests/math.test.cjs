/* 계산 함수의 대표값·경계값·불변 조건 */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,e=1e-6,m='')=>assert.ok(Math.abs(a-b)<=e,`${m} ${a} vs ${b}`);

test('activations and derivatives match finite differences',()=>{
 near(M.sigmoid(0),0.5);near(M.dact('sigmoid',0),0.25);near(M.act('relu',-2),0);near(M.dact('relu',3),1);near(M.act('leaky',-1),-0.01);
 near(M.sigmoid(-800),0,1e-12);near(M.sigmoid(800),1,1e-12);assert.ok(Number.isFinite(M.sigmoid(-1e4)));
 for(const n of ['sigmoid','tanh','gelu','swish'])for(const z of [-2,-0.3,0.7,2.5]){const h=1e-5;near(M.dact(n,z),(M.act(n,z+h)-M.act(n,z-h))/(2*h),1e-6,n);}
 for(let z=-6;z<=6;z+=0.5)assert.ok(M.dact('sigmoid',z)<=0.25+1e-12);
});

test('optimizers on the valley: SGD diverges above 2/25, momentum and Adam converge',()=>{
 assert.equal(M.valley('sgd',0.07).diverged,0);assert.ok(M.valley('sgd',0.09,200).diverged>0||M.valley('sgd',0.09).f>1e3);
 assert.ok(M.valley('momentum',0.03).f<M.valley('sgd',0.01).f);assert.ok(M.valley('adam',0.2,200).f<0.05);
 assert.equal(M.valley('sgd',0.05).path.length,41);
 const ag=M.valley('adagrad',0.3),rp=M.valley('rmsprop',0.3);
 near(ag.eff[0],0.3/4,1e-6,'first AdaGrad step divides by |g|');assert.ok(ag.eff[39]<ag.eff[0]/3,'AdaGrad effective rate only shrinks');for(let i=1;i<40;i++)assert.ok(ag.eff[i]<=ag.eff[i-1]);
 assert.ok(rp.f<1e-6&&ag.f>0.5,'RMSProp reaches the minimum where AdaGrad stalls');assert.equal(M.valley('sgd',0.05).eff.length,0);
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
 const n=M.autodiff('neuron'),z=0.8*1.5-0.5,a=M.sigmoid(z);near(n.val.L,(a-1)**2,1e-12);near(n.grad.w,2*(a-1)*a*(1-a)*1.5,1e-12);
});

test('parameter count and memory',()=>{
 assert.equal(M.mlpParams([784,256,128,10]),235146);assert.equal(M.mlpParams([2,1]),3);
 const m=M.memory([784,256,128,10],'bfloat16');assert.equal(m.weights,235146*2);assert.equal(m.trainAdam,235146*16);
});

test('gradient check flags buggy backprop and tolerates good ε',()=>{
 assert.ok(M.gradCheck(1e-5,'none').max<1e-7);assert.ok(M.gradCheck(1e-5,'sign').max>0.9);assert.ok(M.gradCheck(1e-5,'factor').max>0.3);
 assert.ok(M.gradCheck(0.1,'none').max>M.gradCheck(1e-5,'none').max);
});
test('minibatch SGD: updates per epoch, full batch never jitters, linear scaling matches B=8',()=>{
 const full=M.minibatch({B:80,lr:0.3}),small=M.minibatch({B:8,lr:0.3}),scaled=M.minibatch({B:80,lr:3});
 assert.equal(full.updates,30);assert.equal(small.updates,300);assert.equal(M.minibatch({B:1,lr:0.1,epochs:2}).updates,160);
 assert.equal(full.upFrac,0);assert.ok(small.upFrac>0.2,'small batches sometimes step uphill');
 assert.ok(small.trainLoss<full.trainLoss-0.1,'more updates per epoch');assert.ok(Math.abs(scaled.trainLoss-small.trainLoss)<0.03,'10x batch with 10x learning rate');
 assert.ok(Math.abs(small.trainLoss-0.493)<0.002);assert.ok(M.minibatch({B:1,lr:3}).trainLoss>small.trainLoss,'too large a step for one point');
 const again=M.minibatch({B:8,lr:0.3});assert.equal(again.trainLoss,small.trainLoss,'seeded and repeatable');
});
test('블록 구조: 잔차는 꺼지는 신호를 살리고, 축소 없이는 √L배 쌓이며, LayerNorm은 초기화와 무관하다',()=>{
 const f=(i,a,b)=>M.blockStats(a,i,50,b);
 assert.deepEqual(M.blockStats('tanh','small',20,'plain'),M.deepStats('tanh','small',20).fwd,'plain = deepStats');
 assert.ok(f('small','tanh','plain')[49]<1e-50,'small tanh plain vanishes');
 const res=f('small','tanh','residual')[49];assert.ok(res>1&&res<1.3,'small tanh residual keeps ~1: '+res);
 const xr=f('xavier','tanh','residual')[49],xs=f('xavier','tanh','scaled')[49];
 assert.ok(xr>5&&xr<7.5,'xavier tanh residual grows about sqrt(50): '+xr);assert.ok(xs>1&&xs<1.5,'scaled stays near 1: '+xs);
 assert.ok(f('he','relu','residual')[49]>1e8,'he relu residual explodes (variance doubles)');
 for(const i of ['small','std','xavier','he'])for(const a of ['tanh','relu']){const v=f(i,a,'layernorm')[49];assert.ok(v>0.4&&v<0.8,i+a+' LN '+v);}
 const z=M.layerNorm([1,2,3,4]);assert.ok(Math.abs(z.reduce((s,v)=>s+v,0))<1e-12);assert.ok(Math.abs(z.reduce((s,v)=>s+v*v,0)/4-1)<1e-4);
});
test('more training points close the gap; bestVal marks where validation loss was lowest',()=>{
 const run=n=>M.train({n,noise:0.15,width:32,epochs:400,lr:0.03,seed:2}),few=run(40),many=run(200),bf=M.bestVal(few),bm=M.bestVal(many);
 assert.equal(few.trainAcc,1);assert.ok(few.trainAcc-few.valAcc>0.3);assert.ok(Math.abs(many.trainAcc-many.valAcc)<0.06);
 assert.equal(bf.epoch,105);near(bf.loss,0.483,0.001);assert.ok(few.valLoss>bf.loss*4,'validation loss climbs back after its minimum');
 assert.ok(bm.epoch>380&&many.valLoss-bm.loss<0.01,'with enough data the minimum sits at the end');
 near(bf.loss,few.val[bf.epoch-1],0);assert.ok(few.val.every(v=>v===null||v>=bf.loss));
 const small=M.train({n:200,noise:0.15,width:2,epochs:400,lr:0.03,seed:2});assert.ok(small.trainAcc<0.8,'two hidden units underfit');
});
test('batch norm depends on the batch, layer norm does not',()=>{
 const s=[2,8,32,128].map(B=>M.normBatch({B}));
 for(let i=1;i<s.length;i++)assert.ok(s[i].bnSpread<s[i-1].bnSpread,'spread shrinks with batch size');
 near(s[1].bnSpread/s[3].bnSpread,4,1.2,'about 1/sqrt(B)');near(s[0].bnSpread,0.721,0.001);near(s[3].bnSpread,0.105,0.001);
 s[0].bn.forEach(v=>near(Math.abs(v),1,1e-3,'two samples normalize to +-1'));
 assert.ok(s.every(r=>r.ln===s[0].ln&&r.ref===s[0].ref&&r.lnSpread===0),'layer norm and the population reference ignore B');
 assert.ok(s[3].bnMin<s[3].ref&&s[3].ref<s[3].bnMax,'large batches scatter around the population value');
 assert.deepEqual(M.normBatch({B:8,seed:2}),M.normBatch({B:8,seed:2}));assert.equal(s[1].bn.length,40);
});
