/* 계산 함수의 대표값·경계값·불변 조건 */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,e=1e-9,msg)=>assert.ok(Math.abs(a-b)<=e,`${msg||''} ${a} vs ${b}`);

test('seeded random numbers repeat and stay in [0,1)',()=>{const a=M.rng(3),b=M.rng(3);for(let i=0;i<50;i++){const x=a();assert.equal(x,b());assert.ok(x>=0&&x<1);}});
test('quantile, mean and std on known values',()=>{assert.equal(M.quantile([1,2,3,4,5],0.5),3);assert.equal(M.quantile([1,2,3,4],0.25),1.75);assert.equal(M.mean([2,4]),3);near(M.std([2,4]),1);});
test('sigmoid is 0.5 at 0 and symmetric',()=>{assert.equal(M.sigmoid(0),0.5);near(M.sigmoid(2)+M.sigmoid(-2),1);});

test('centroid classifier beats chance only when classes separate',()=>{const far=M.centroidLab(3),none=M.centroidLab(0);assert.ok(far.acc>0.85);assert.ok(Math.abs(none.acc-0.5)<0.1);assert.ok(far.acc>far.random+0.3);});
test('logistic regression: zero epochs means loss ln2, training lowers loss',()=>{const z=M.logisticLab(0),t=M.logisticLab(200);near(z.loss,Math.log(2),1e-12);assert.ok(t.loss<z.loss);assert.ok(t.acc>=0.8);});
test('class weights equal duplicated rows exactly',()=>{const tr=M.imbalanceData(801,40,4),dup=[...tr.filter(p=>!p.c),...Array.from({length:40},(_,i)=>tr.filter(p=>p.c)[i%4])];
 const w=M.trainLogistic(tr,50,0.5,tr.map(p=>p.c?5.5:0.55)),d=M.trainLogistic(dup,50,0.5);near(w.w[0],d.w[0],1e-9);near(w.b,d.b,1e-9);});

test('gini and entropy: pure 0, 50/50 maximum',()=>{assert.equal(M.gini([5,0]),0);assert.equal(M.entropy([0,7]),0);near(M.gini([4,4]),0.5);near(M.entropy([4,4]),1);assert.equal(M.gini([]),0);});
test('split gain is never negative and the best split is 5.5',()=>{for(let t=1.5;t<9;t+=1){const s=M.splitScores(t);assert.ok(s.gainGini>=-1e-12&&s.gainEntropy>=-1e-12);assert.equal(s.left[0]+s.left[1]+s.right[0]+s.right[1],24);}assert.equal(M.bestSplit().t,5.5);});

test('kNN with k=1 memorises training data; k=N predicts the majority',()=>{assert.equal(M.knnLab(1).accTrain,1);const tr=M.knnData(71,60),maj=tr.filter(p=>p.c).length*2>tr.length?1:0;assert.equal(M.knnPredict(tr,{x:9,y:9},60),maj);});
test('SVM margin widens as C shrinks and support vectors grow',()=>{const s=M.svmLab(-2),l=M.svmLab(2);assert.ok(s.width>l.width);assert.ok(s.support>=l.support);assert.ok(l.errors>=1,'one noisy point stays wrong');});

test('k-means inertia never increases and silhouette prefers K=3',()=>{const P=M.clusterData(),h=M.kmeans(P,3,8);for(let i=1;i<h.length;i++)assert.ok(h[i].inertia<=h[i-1].inertia+1e-9);
 const sil=K=>M.silhouette(P,M.kmeans(P,K,10).at(-1).lab);assert.ok(sil(3)>sil(2)&&sil(3)>sil(4));});

test('naive Bayes: alpha 0 lets one unseen word decide; smoothing keeps both classes alive',()=>{const z=M.naiveBayes(0),one=M.naiveBayes(1);assert.equal(z.post[0],1);assert.equal(z.logs[1],-Infinity);near(one.post[0]+one.post[1],1);assert.ok(one.post[1]>0);
 one.probs.forEach(p=>near(M.sum(p),1,1e-12));assert.ok(M.naiveBayes(5).post[0]<one.post[0],'stronger smoothing pulls toward the prior');});

test('raw won units let amount dominate distance; scaling restores attempts',()=>{const w=M.scalingLab('won'),z=M.scalingLab('z');assert.ok(w.share>0.99);assert.ok(z.share<0.6);assert.ok(z.acc>w.acc+0.2);});
test('mutual information sees a curved relation that correlation misses',()=>{const x=Array.from({length:201},(_,i)=>-1+i/100),y=x.map(v=>v*v);assert.ok(Math.abs(M.pearson(x,y))<1e-9);assert.ok(M.mutualInfo(x,y)>0.8);near(M.pearson(x,x),1);});

test('confusion matrix counts add up and extremes behave',()=>{const D=M.scoreData();for(const t of [0,0.3,0.7,1.01]){const c=M.confusion(D,t);assert.equal(c.TP+c.FP+c.FN+c.TN,1000);}
 const all=M.rates(M.confusion(D,0));assert.equal(all.recall,1);const none=M.rates(M.confusion(D,1.01));assert.equal(none.recall,0);near(none.accuracy,0.97);});
test('AUC is between 0.5 and 1 and ROC runs from (0,0) to (1,1)',()=>{const D=M.scoreData(),a=M.auc(D),r=M.rocCurve(D);assert.ok(a>0.9&&a<=1);assert.deepEqual(r[0],[0,0]);assert.deepEqual(r.at(-1),[1,1]);});
test('MCC is 1 for a perfect table and 0 when nothing is flagged',()=>{near(M.rates({TP:5,FP:0,FN:0,TN:5}).mcc,1);assert.equal(M.rates({TP:0,FP:0,FN:3,TN:97}).mcc,0);});
test('stratified folds keep the same number of frauds',()=>{const D=M.scoreData(),s=M.stratifiedCounts(D,5,true),r=M.stratifiedCounts(D,5,false);assert.deepEqual(s.folds,[6,6,6,6,6]);assert.equal(M.sum(r.folds),30);});

test('polynomial fit recovers an exact cubic',()=>{const xs=[-1,-0.5,0,0.5,1],w=M.polyFit(xs,xs.map(x=>1-2*x+3*x**3),3,0);[1,-2,0,3].forEach((c,i)=>near(w[i],c,1e-8));});
test('bias-variance: total = bias²+variance+noise, U shape with peak at interpolation',()=>{const r=[0,5,11].map(d=>M.biasVariance(d));r.forEach(x=>near(x.total,x.bias2+x.variance+x.noise,1e-12));
 assert.ok(r[1].total<r[0].total&&r[1].total<r[2].total);assert.ok(r[0].bias2>r[1].bias2);assert.ok(r[2].variance>r[1].variance);});
test('majority vote: N=1 equals p, independent voters improve, full correlation does not',()=>{near(M.majorityVote(1,0.6),0.6);assert.ok(M.majorityVote(21,0.6)>0.8);near(M.ensembleAccuracy(51,0.6,1),0.6);near(M.majorityVote(3,0.5),0.5);});

test('target encoding fitted on all rows inflates accuracy on pure noise',()=>{const r=M.targetEncodingLab(300);assert.ok(r.leaky>0.7);assert.ok(Math.abs(r.honest-0.5)<0.06);const s=M.targetEncodingLab(5);assert.ok(r.leaky>s.leaky);});
test('centered moving average with window 1 copies the answer (MAE 0)',()=>{const y=M.orderSeries(),f=M.forecasts(y,1);assert.equal(f.mae.leaky,0);assert.equal(f.mae.trailing,f.mae.persist);assert.equal(f.actual.length,30);});

test('injected outliers mask z-score but not IQR',()=>{const a=M.outlierLab(0),b=M.outlierLab(20);assert.equal(a.zHit,10);assert.equal(b.zHit,0);assert.equal(b.iqrHit,10);assert.ok(b.std>a.std*3);});
test('resampling raises recall over plain training; SMOTE makes points between minority pairs',()=>{const n=M.imbalanceLab('none'),o=M.imbalanceLab('over'),w=M.imbalanceLab('weight');assert.ok(o.recall>n.recall);assert.deepEqual(o.cm,w.cm);
 const mins=[{x:0,y:0,c:1},{x:2,y:0,c:1}],s=M.smote(mins,4,1);s.forEach(p=>{assert.equal(p.y,0);assert.ok(p.x>=0&&p.x<=2);});});
test('drift: keeping the old threshold loses recall; retraining recovers more than retuning',()=>{const k0=M.driftLab(0,'keep'),k2=M.driftLab(2,'keep'),rt=M.driftLab(2,'retune'),rr=M.driftLab(2,'retrain');
 assert.ok(k2.recall<k0.recall);assert.ok(rr.cost<rt.cost&&rr.cost<k2.cost);assert.equal(M.driftLab(0,'retune').t,k0.t);});
