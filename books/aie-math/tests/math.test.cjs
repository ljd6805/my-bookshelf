/* 계산 함수의 대표값·경계값·불변 조건. 기대값은 손계산이나 독립 공식으로 정했다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,eps=1e-9,msg)=>assert.ok(Math.abs(a-b)<=eps,`${msg||''} ${a} vs ${b}`);
const sum=a=>a.reduce((s,x)=>s+x,0);

test('DFT: 정수 주파수 성분은 자기 k에만 원래 진폭으로 나타나고, 파스발 정리가 성립한다',()=>{
 const x=M.synth([[3,1,0],[10,.5,0]],64),a=M.amplitudes(x),X=M.dft(x);
 near(a[3],1,1e-9);near(a[10],.5,1e-9);a.forEach((v,k)=>{if(k!==3&&k!==10)near(v,0,1e-9,'k='+k);});
 near(sum(X.mag.map(m=>m*m))/64,M.energy(x),1e-8,'Parseval');
 near(M.amplitudes(Array(8).fill(2))[0],2,1e-12,'DC');
 const y=M.synth([[6,.5,0],[6,.6,0]],64);near(M.amplitudes(y)[6],1.1,1e-9,'same k adds');
});
test('브로드캐스팅·보폭·파이프라인 모양',()=>{
 assert.deepEqual(M.broadcast([8,50,16],[16]),[8,50,16]);assert.deepEqual(M.broadcast([8,50,16],[50,1]),[8,50,16]);
 assert.equal(M.broadcast([8,50,16],[50]),null);assert.deepEqual(M.broadcast([1],[3,1]),[3,1]);
 assert.deepEqual(M.strides([2,3,4]),[12,4,1]);
 const p=M.pipeline(8,50,40,16);assert.equal(p.params,40*16+16+16*3+3);assert.equal(p.steps[0].count,16000);assert.deepEqual(p.steps[3].shape,[8,3]);
 assert.equal(M.pipeline(32,50,40,16).params,p.params,'params do not depend on batch');assert.equal(M.pipeline(16,50,40,16).macs,2*p.macs);
});
test('노름과 거리: 3-4-5, 코사인은 배율에 불변, 작은 소리는 L2에서 꺼로 끌린다',()=>{
 near(M.norm.l2([3,4]),5);near(M.norm.l1([3,-4]),7);near(M.norm.linf([3,-4]),4);
 near(M.cosine([1,2,3],[2,4,6]),1);near(M.cosine([1,0],[0,1]),0);
 const q=[.8,.33,.12];for(const s of [.2,1,3])assert.equal(M.nearest(q.map(v=>v*s),'cos').i,0);
 assert.equal(M.nearest(q,'l2').i,0);assert.equal(M.nearest(q.map(v=>v*.3),'l2').i,1);
});
test('수치 미분: 가운데 차분은 h=1e-5에서 매우 정확하고, 너무 작은 h는 반올림 오차가 커진다',()=>{
 const g=M.lossWGrad(.5);near(g,2*(M.sigmoid(1)-1)*M.sigmoid(1)*(1-M.sigmoid(1))*2,1e-15);
 const [big,mid,tiny]=M.diffErrors(.5,[-1,-5,-14]);
 assert.ok(mid.centered<1e-9);assert.ok(tiny.centered>mid.centered*1000);assert.ok(big.forward>big.centered);
 near(M.numDiff(x=>x*x,3,1e-3,true),6,1e-9,'x² at 3');
});
test('역전파: 연쇄법칙의 곱과 가운데 차분이 일치하고, 포화되면 기울기가 작아진다',()=>{
 const r=M.backprop({x:2,w:.5,b:0,y:1});near(r.dLdw,r.dLda*r.dadz*2,1e-15);near(r.dLdb,r.dLdz);
 assert.ok(M.gradCheck({x:2,w:.5,b:0,y:1}).rel<1e-7);assert.ok(M.gradCheck({x:2,w:-2,b:0,y:0}).rel<1e-7);
 const s=M.backprop({x:2,w:3,b:0,y:0});assert.ok(Math.abs(s.dLdw)<.02&&s.dLda>1.9);
 near(M.backprop({x:2,w:0,b:0,y:.5}).dLdw,0,1e-15,'a=y');
});
test('경사하강: 한계 2/12를 넘으면 발산하고, 모멘텀은 같은 학습률에서 더 빨리 내려간다',()=>{
 near(M.lrLimit(),1/6);assert.ok(M.descend(.15,40).final<M.ravine(M.RAVINE.start));
 assert.ok(M.descend(.18,40).final>M.ravine(M.RAVINE.start));
 const base=M.descend(.05,40),mo=M.descend(.05,40,.8);assert.equal(M.firstBelow(base.loss,.01),-1);assert.ok(M.firstBelow(mo.loss,.01)>0);
 assert.equal(M.descend(.1,0).path.length,1);
 const one=M.descend1d(.5,1);near(one.ws[1],2,1e-12,'lr 0.5 jumps to the bottom of curvature 2');assert.ok(M.descend1d(1.05).loss.at(-1)>M.descend1d(1.05).loss[0]);
});
test('정보이론: H(P,Q)=H(P)+KL, KL≥0, 확률이 절반이면 1비트',()=>{
 near(M.entropy([.5,.5]),1);near(M.entropy([1,0,0]),0);near(M.entropy([.25,.25,.25,.25]),2);
 for(const c of [.05,.3,.7,.99])for(const e of [0,.1]){const p=M.smoothTarget(e),q=M.prediction(c);near(M.crossEntropy(p,q),M.entropy(p)+M.kl(p,q),1e-12);assert.ok(M.kl(p,q)>=-1e-12);near(sum(q),1,1e-12);near(sum(p),1,1e-12);}
 near(M.crossEntropy([1,0,0],M.prediction(.45))-M.crossEntropy([1,0,0],M.prediction(.9)),1,1e-12);
 near(M.kl([.3,.7],[.3,.7]),0,1e-12);assert.notEqual(M.kl([.9,.1],[.5,.5]).toFixed(6),M.kl([.5,.5],[.9,.1]).toFixed(6));
});
test('수치 안정성: float16 반올림, 그대로 softmax의 붕괴, 최댓값 빼기의 불변성',()=>{
 assert.equal(M.toHalf(65504),65504);assert.equal(M.toHalf(70000),Infinity);near(M.toHalf(.1),.0999755859375,0);assert.equal(M.toHalf(1),1);assert.equal(M.toHalf(-2.5),-2.5);
 assert.ok(M.expFits(11,'f16')&&!M.expFits(12,'f16'));assert.ok(M.expFits(88,'f32')&&!M.expFits(89,'f32'));
 assert.ok(M.broken(M.softmaxIn([10,11,12],'f16',false)));assert.ok(!M.broken(M.softmaxIn([10,11,12],'f16',true)));
 assert.ok(M.broken(M.softmaxIn([98,99,100],'f32',false)));
 const a=M.softmaxIn([1,2,3],'f64',true),b=M.softmaxIn([101,102,103],'f64',true);a.forEach((v,i)=>near(v,b[i],1e-12));
 near(M.logSumExp([1000,1000]),1000+Math.log(2),1e-9);near(M.logSumExp([0,0,0]),Math.log(3),1e-12);
});
test('샘플링: 온도와 top-p, 몬테카를로 표준오차',()=>{
 const L=[2.2,1.8,1.1,.2,-.8];near(sum(M.softmaxT(L,.3)),1,1e-12);assert.ok(M.softmaxT(L,.3)[0]>M.softmaxT(L,1)[0]);assert.ok(M.entropy(M.softmaxT(L,2))>M.entropy(M.softmaxT(L,1)));
 assert.deepEqual(M.topP([.5,.3,.2],.7).map(v=>+v.toFixed(3)),[.625,.375,0]);assert.deepEqual(M.topP([.5,.3,.2],1).map(v=>+v.toFixed(3)),[.5,.3,.2]);
 const r1=M.rng(5),r2=M.rng(5);assert.equal(r1(),r2());
 const s=M.monteCarloPi(4096);near(s.se*2,M.monteCarloPi(1024).se,1e-12,'4x samples halves SE');assert.ok(s.err<4*s.se);assert.equal(M.monteCarloPi(100).pts.length,100);
});
test('SVD: 특잇값 제곱합 = 프로베니우스 노름², 전체 랭크면 복원, 오차 = 버린 특잇값',()=>{
 const A=M.spectrogram(),d=M.svd(A);near(sum(d.s.map(x=>x*x)),M.fro(A)**2,1e-9);
 for(let i=1;i<d.s.length;i++)assert.ok(d.s[i-1]>=d.s[i]-1e-12);
 const full=M.lowRank(d,10);A.forEach((r,i)=>r.forEach((v,j)=>near(full[i][j],v,1e-8)));
 for(const k of [1,2,5]){const c=M.compress(A,k);near(c.rel*M.fro(A),Math.sqrt(sum(d.s.slice(k).map(x=>x*x))),1e-8,'Eckart-Young k='+k);}
 const s2=M.svd([[3,0],[0,-2]]).s;near(s2[0],3,1e-12);near(s2[1],2,1e-12);
 assert.equal(M.compress(A,6).store,138);assert.equal(M.compress(A,2).store,46);
});
test('조건수: 직교면 1, 각도가 작을수록 커지며, 잡음 이동은 0.01·√(1+cos²θ)/sinθ, 릿지는 줄인다',()=>{
 const o=M.conditioning(90);near(o.kappa,1,1e-12);near(o.shift,.01,1e-12);o.x.forEach(v=>near(v,1,1e-12));
 const r=M.conditioning(5);{const th=5*Math.PI/180;near(r.shift,.01*Math.hypot(1,Math.cos(th))/Math.sin(th),1e-9);}assert.ok(r.kappa>20);r.x.forEach(v=>near(v,1,1e-9));
 near(r.kappaNormal,r.kappa**2,1e-6,'normal matrix squares κ');
 const g=M.conditioning(3,.1);assert.ok(g.shift<M.conditioning(3).shift/10);assert.ok(g.x[0]<1);
});
test('마르코프: 행의 합 1, 정상 분포는 πP=π, 게으른 연쇄도 같은 π',()=>{
 for(const q of [0,.5,.8]){const P=M.commandChain(q);P.forEach(r=>near(sum(r),1,1e-12));const pi=M.stationary(P);near(sum(pi),1,1e-12);M.step(pi,P).forEach((v,i)=>near(v,pi[i],1e-12));
  const lazy=P.map((r,i)=>r.map((v,j)=>.5*v+(i===j?.5:0)));M.stationary(lazy).forEach((v,i)=>near(v,pi[i],1e-9));
  assert.ok(M.mixingSteps(lazy,[1,0,0])>=M.mixingSteps(P,[1,0,0]));}
 const ev=M.evolve(M.commandChain(.5),[1,0,0],1);assert.deepEqual(ev[1],M.commandChain(.5)[0]);near(M.tv([1,0],[0,1]),1);
});
test('마지막 과제: 구간은 1/√n으로 좁아지고, n=200은 0을 포함하며 2,000은 넘는다. 베이즈 기저율',()=>{
 const a=M.diffInterval(.86,.89,200),b=M.diffInterval(.86,.89,800);near(a.se/b.se,2,1e-12);
 assert.ok(!a.clear&&a.lo<0&&a.hi>0);assert.ok(M.diffInterval(.86,.89,2000).clear);near(a.d,.03,1e-12);
 near(M.posterior(1e-4,.99,.01),.99e-4/(.99e-4+.9999*.01),1e-15);assert.ok(M.posterior(1e-4,.99,.01)<.01);near(M.posterior(.5,.9,.1),.9,1e-12);
});
