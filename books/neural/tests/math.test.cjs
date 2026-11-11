/* 계산 함수의 대표값·경계값·불변 조건 */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,e=1e-6,m='')=>assert.ok(Math.abs(a-b)<=e,`${m} ${a} vs ${b}`);

test('tensor shapes: element count is the product of axis sizes',()=>{
 const t=M.tensorShape('table',8,{features:1});assert.deepEqual(t.shape,[8,1]);assert.equal(t.elements,8);assert.equal(t.rank,2);
 const g=M.tensorShape('gray',32);assert.deepEqual(g.shape,[32,28,28]);assert.equal(g.elements,25088);
 const c=M.tensorShape('color',32);assert.deepEqual(c.shape,[32,3,28,28]);assert.equal(c.elements,75264);assert.equal(c.bytes,301056);
 const l=M.tensorShape('color',32,{last:true});assert.deepEqual(l.shape,[32,28,28,3]);assert.equal(l.elements,c.elements);
 assert.equal(M.tensorShape('color',32,{side:224}).elements,4816896);
 const s=M.tensorShape('text',4);assert.deepEqual(s.shape,[4,12,64]);assert.deepEqual(s.one,[12,64]);
 for(const k of M.TENSOR_KINDS){const r=M.tensorShape(k,1);assert.equal(r.shape[0],1);assert.equal(r.axes.length,r.rank);assert.equal(r.elements,r.shape.reduce((a,b)=>a*b,1));}
 const p=M.padding([5,9,12,7]);assert.equal(p.T,12);assert.deepEqual(p.pads,[7,3,0,5]);assert.equal(p.total,15);
});

test('line losses on the cafe record: representative values and the least-squares line',()=>{
 const l=M.lineLoss(4,12);near(l.mse,1.5);near(l.mae,1);near(l.rmse,Math.sqrt(1.5));
 near(M.lineLoss(3,12).mse,17.75);near(M.lineLoss(0,0).mse,750.5);
 const f=M.lineFit();near(f.w,170/42);near(f.b,11.5833333,1e-6);near(M.lineLoss(f.w,f.b).bias,0,1e-9,'residuals sum to zero');
 const best=M.lineLoss(f.w,f.b).mse;near(best,1.4255952,1e-6);
 for(const [dw,db] of [[0.1,0],[-0.1,0],[0,0.5],[0,-0.5]])assert.ok(M.lineLoss(f.w+dw,f.b+db).mse>best,'fit is the minimum');
});

test('one outlier moves MSE far more than MAE and drags the fitted line',()=>{
 const D=M.lineData(true);assert.equal(D.y[7],9);assert.equal(M.LINE.y[7],41,'original data untouched');
 const a=M.lineLoss(4.05,11.5),b=M.lineLoss(4.05,11.5,D);
 assert.ok(b.mse/a.mse>80);assert.ok(b.mae/a.mae<5);
 const g=M.lineFit(D);near(g.w,1.3809524,1e-6);assert.ok(M.lineLoss(g.w,g.b,D).mse<b.mse);assert.ok(M.lineLoss(g.w,g.b,D).mae>b.mae,'MSE fit gives up MAE');
});

test('gradient of MSE matches finite differences and vanishes at the fit',()=>{
 const h=1e-5;for(const [w,b] of [[0,12],[2,5],[6,-3]]){const g=M.lineGrad(w,b);
  near(g.gw,(M.lineLoss(w+h,b).mse-M.lineLoss(w-h,b).mse)/(2*h),1e-5);near(g.gb,(M.lineLoss(w,b+h).mse-M.lineLoss(w,b-h).mse)/(2*h),1e-5);}
 near(M.lineGrad(0,12).gw,-138.75);const f=M.lineFit(),g=M.lineGrad(f.w,f.b);near(g.gw,0,1e-9);near(g.gb,0,1e-9);
 const sub=M.lineGrad(1,1,M.LINE,[0,7]);near(sub.gw,2*((1-12)*0+(8-41)*7)/2);
});

test('slope walk converges below the limit 2/35 and moves away above it',()=>{
 const lim=M.slopeLimit();near(lim.curvature,35);near(lim.limit,2/35);
 const ok=M.slopeWalk(0,0.02,6);near(ok.path[1],2.775);near(ok.path[6],3.96139575,1e-6);
 const best=111/28;for(const lr of [0.005,0.02,0.05]){const p=M.slopeWalk(0,lr,12).path;for(let i=1;i<p.length;i++)assert.ok(Math.abs(p[i]-best)<Math.abs(p[i-1]-best),'closer each step '+lr);}
 const bad=M.slopeWalk(0,0.06,12).path;for(let i=1;i<bad.length;i++)assert.ok(Math.abs(bad[i]-best)>Math.abs(bad[i-1]-best),'farther each step');
 near(M.slopeWalk(0,0.005,12).path[12],3.57,0.01);assert.equal(M.slopeWalk(0,0.02,1).path.length,2);
});

test('batch size sets the number of updates; momentum reaches the floor sooner',()=>{
 const full=M.descend({B:8}),one=M.descend({B:1}),two=M.descend({B:2});
 assert.equal(full.updates,30);assert.equal(two.updates,120);assert.equal(one.updates,240);assert.equal(two.perEpoch,4);
 near(full.first,750.5);near(full.mse,17.408,0.01);near(one.mse,1.604,0.01);near(full.floor,1.4255952,1e-6);
 assert.equal(full.upFrac,0,'full batch below the limit never goes up');assert.ok(one.upFrac>0.3);
 assert.deepEqual(M.descend({B:1}).steps,one.steps,'fixed seed is reproducible');
 const plain=M.descend({B:8,epochs:100}),mom=M.descend({B:8,epochs:100,beta:0.9});near(plain.mse,4.577,0.01);near(mom.mse,1.448,0.01);
 for(const r of [full,one,two,plain,mom])assert.ok(r.mse>=r.floor-1e-9,'never below the least-squares loss');
 const blown=M.descend({B:8,lr:0.06});assert.ok(blown.mse>blown.first);const inf=M.descend({B:1,beta:0.9});assert.ok(inf.diverged>0);assert.equal(inf.mse,Infinity);
});

test('activations and derivatives match finite differences',()=>{
 near(M.sigmoid(0),0.5);near(M.dact('sigmoid',0),0.25);near(M.act('relu',-2),0);near(M.dact('relu',3),1);near(M.act('leaky',-1),-0.01);
 near(M.sigmoid(-800),0,1e-12);near(M.sigmoid(800),1,1e-12);assert.ok(Number.isFinite(M.sigmoid(-1e4)));
 for(const n of ['sigmoid','tanh','gelu','swish'])for(const z of [-2,-0.3,0.7,2.5]){const h=1e-5;near(M.dact(n,z),(M.act(n,z+h)-M.act(n,z-h))/(2*h),1e-6,n);}
 for(let z=-6;z<=6;z+=0.5)assert.ok(M.dact('sigmoid',z)<=0.25+1e-12);
});

test('perceptron learns AND, OR, NAND but never XOR',()=>{
 for(const g of ['AND','OR','NAND']){const r=M.perceptron(g,30);assert.ok(r.converged,g);assert.deepEqual(r.predict,M.GATES[g]);}
 assert.equal(M.perceptron('AND',30).convergedAt,4);assert.equal(M.perceptron('OR',30).convergedAt,4);assert.equal(M.perceptron('NAND',30).convergedAt,6);
 const x=M.perceptron('XOR',200);assert.equal(x.converged,false);assert.ok(x.hist.every(h=>h.errors>0));
 const a=M.perceptron('AND',1);assert.equal(a.hist.length,1);
});

test('hand-wired 2-2-1 network computes XOR only with a nonlinearity',()=>{
 const r=M.xorForward(20);assert.deepEqual(r.map(x=>x.out>=0.5?1:0),[0,1,1,0]);r.forEach((x,i)=>near(x.out,[0,1,1,0][i],1e-3));
 const lin=M.xorForward(20,'linear');lin.forEach(x=>near(x.out,lin[0].out,1e-9,'linear collapses'));near(lin[0].out,370,1e-9);
 assert.equal(M.mlpParams([784,256,128,10]),235146);assert.equal(M.mlpParams([4,5,3]),43);assert.equal(M.mlpParams([2,8,1]),33);
});

test('chain rule gradient equals numeric gradient',()=>{
 for(const w of [-3,-0.5,0.8,2.9]){const c=M.chain(w);near(c.dLdw,c.numeric,1e-7);near(c.dLdw,c.dLda*c.dadz*1.5,1e-12);}
 assert.ok(Math.abs(M.chain(3).dLdw)<Math.abs(M.chain(0).dLdw),'saturation shrinks gradient');
});

test('loss gradients: BCE is p-y, MSE vanishes when confidently wrong',()=>{
 const l=M.lossAt(0.01);near(l.gBce,-0.99);near(l.gMse,2*(-0.99)*0.01*0.99);near(l.bce,-Math.log(0.01));
 assert.ok(Number.isFinite(M.lossAt(0).bce));near(M.lossAt(0.5).bce,Math.log(2));
 const m=M.lossAt(0.02);near(m.gBce/m.gMse,1/(2*0.02*0.98),1e-9);
});

test('backprop gradient of the small network matches finite differences',()=>{
 const base=M.train({width:3,act:'tanh',epochs:0,seed:5}),h=1e-5;
 const lossWith=(layer,k,d)=>{const r=M.train({width:3,act:'tanh',epochs:0,seed:5});r.net[layer].W[k]+=d;return M.evaluate(r.net,{X:r.data.X.map(p=>Float64Array.from(p)),Y:r.data.Y},'tanh').loss;};
 const step=M.train({width:3,act:'tanh',epochs:1,lr:1,seed:5});
 for(const [layer,k] of [[0,0],[0,3],[1,1]]){const num=(lossWith(layer,k,h)-lossWith(layer,k,-h))/(2*h),ana=base.net[layer].W[k]-step.net[layer].W[k];near(ana,num,1e-6,'layer '+layer);}
});

test('XOR training: learns from seed 1, stalls from seed 6, crawls with a small rate',()=>{
 const ok=M.train({data:'xor',width:2,act:'sigmoid',lr:2,epochs:1000,seed:1});assert.ok(ok.trainLoss<0.02);assert.equal(ok.trainAcc,1);
 const stuck=M.train({data:'xor',width:2,act:'sigmoid',lr:2,epochs:1000,seed:6});near(stuck.trainLoss,0.353,0.01);
 const slow=M.train({data:'xor',width:2,act:'sigmoid',lr:0.1,epochs:1000,seed:1});near(slow.trainLoss,0.644,0.01);
 assert.equal(ok.loss.length,1000);assert.ok(ok.loss[999]<ok.loss[0]);
});

test('deep gradient: sigmoid vanishes with depth, ReLU keeps its size',()=>{
 const s=M.deepStats('sigmoid',20).bwd,r=M.deepStats('relu',20).bwd;assert.equal(s.length,20);
 assert.ok(s[0]/s[19]<1e-8);assert.ok(r[0]/r[19]>0.3&&r[0]/r[19]<3);
 const s30=M.deepStats('sigmoid',30).bwd;assert.ok(s30[0]/s30[29]<1e-13);
 near(M.vanish(10),0.25**10,1e-15);near(M.vanish(3),0.015625);
});

test('architecture parameter counts: only the dense layer grows with input size',()=>{
 const a=M.archParams('image',28),b=M.archParams('image',224,{channels:3});
 assert.equal(a.dense,50240);assert.equal(a.conv,640);assert.equal(b.dense,9633856);assert.equal(b.conv,1792);assert.equal(b.inputs,150528);
 assert.equal(M.archParams('image',448,{channels:3}).conv,1792);
 const s=M.archParams('sequence',12),l=M.archParams('sequence',512);
 assert.equal(s.dense,24640);assert.equal(l.dense,1048640);assert.equal(s.rnn,6208);assert.equal(l.rnn,6208);assert.equal(s.attention,4224);assert.equal(l.attention,4224);
});

test('circle classifier: a line or a linear hidden layer stays near chance, a nonlinear hidden layer bends the boundary',()=>{
 const o={lr:1,epochs:600,seed:1},line=M.train({...o,depth:0}),lin=M.train({...o,width:8,act:'linear'}),tanh=M.train({...o,width:8,act:'tanh'}),relu=M.train({...o,width:8,act:'relu',init:'he'});
 near(line.trainAcc,0.6625);near(line.valAcc,0.535);assert.equal(line.params,3);
 near(lin.valAcc,line.valAcc,1e-12,'no activation = one line');near(lin.trainAcc,line.trainAcc,1e-12);
 near(tanh.trainAcc,0.9625);near(tanh.valAcc,0.825);assert.equal(tanh.params,33);near(relu.valAcc,0.905);
 const sm=M.train({...o,width:8,act:'sigmoid',loss:'mse'}),sb=M.train({...o,width:8,act:'sigmoid'});near(sm.valAcc,0.555);near(sb.valAcc,0.755);
 const D=M.dataset('circle',80,1);assert.equal(D.X.length,80);D.X.forEach((p,i)=>{assert.ok(Math.abs(p[0])<=1&&Math.abs(p[1])<=1);assert.equal(D.Y[i],p[0]**2+p[1]**2<M.CIRCLE_R2?1:0);});
 const g=M.decisionGrid(tanh.net,'tanh',10);assert.equal(g.length,10);g.flat().forEach(p=>assert.ok(p>=0&&p<=1));
 assert.ok(g[5][5]>0.5,'centre is inside');assert.ok(g[0][0]<0.5,'corner is outside');
});
