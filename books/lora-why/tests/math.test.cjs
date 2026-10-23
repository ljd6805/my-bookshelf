/* 계산 모델 검증: 선형대수의 불변 조건(SVD 재구성, 에커트-영, 기울기 랭크 한계, 잊은 양 = ‖ΔW‖²/16)과 대표값·경계값.
   안내 상자(lab-guides.js)의 결과 읽기에 적은 숫자가 실제 계산과 같은지도 여기서 대조한다. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const M=require(path.resolve(__dirname,'../js/math.js'));
const near=(a,b,tol=1e-9,msg)=>assert.ok(Math.abs(a-b)<=tol,`${msg||''} ${a} vs ${b}`);
const P=x=>`${(x*100).toFixed(1)}%`.replace('100.0%','100%'),F=(x,d=2)=>x.toFixed(d);
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../js/lab-guides.js'),'utf8'),ctx);
const G=ctx.window.LWGuides.guides,reading=id=>G[id][2];
const has=(id,...xs)=>{for(const x of xs)assert.ok(reading(id).includes(x),`${id}: "${x}" not in guide`);};
const tone=M.makeWorld({family:'tone'}),ft=M.fullFinetune(tone);

test('SVD reconstructs the matrix and singular values are sorted and non-negative',()=>{
 const A=M.randn(16,16,M.rng(7)),d=M.svd(A),back=M.truncate(A,16,d);
 near(M.frob(M.add(A,back,-1)),0,1e-8);for(let i=1;i<16;i++)assert.ok(d.s[i-1]>=d.s[i]-1e-12&&d.s[i]>=0);
});
test('Eckart–Young: the truncation error equals the dropped singular values, and beats other rank-k matrices',()=>{
 const d=M.svd(ft.dW);for(const k of [0,1,3,8,16])near(M.frob(M.add(ft.dW,M.truncate(ft.dW,k,d),-1)),Math.sqrt(d.s.slice(k).reduce((a,x)=>a+x*x,0)),1e-8,'k='+k);
 const r3=M.frob(M.add(ft.dW,M.truncate(ft.dW,3,d),-1)),B=M.randn(16,3,M.rng(3)),A=M.randn(3,16,M.rng(4));assert.ok(M.frob(M.add(ft.dW,M.matmul(B,A),-1))>r3);
 assert.equal(M.energy(d.s,0),0);near(M.energy(d.s,16),1,1e-12);
});
test('gradient rank never exceeds min(batch, input directions, 16)',()=>{
 for(const b of [1,2,4,8,32])for(const k of [1,4,16]){const g=M.gradientRank(tone,{batch:b,inputDims:k});assert.equal(g.bound,Math.min(b,k,16));assert.ok(g.rank<=g.bound,`${b},${k}`);}
 const s=M.inputSpanCheck(tone,{inputDims:4});assert.equal(s.rank,4);near(s.outside,0,1e-9);
});
test('LoRA starts at W0 (B = 0) and r = 16 reaches full fine-tuning',()=>{
 const lo0=M.trainLora(tone,{r:3,steps:0});near(M.frob(lo0.dW),0,1e-12);
 const full=M.gain(ft.W,tone),lo=M.trainLora(tone,{r:16});near(lo.gain,full,0.005);
 for(const r of [1,2,3,4])assert.ok(M.trainLora(tone,{r}).gain<=M.trainLora(tone,{r:r+1}).gain+0.005,'monotone in r (training tolerance) '+r);
});
test('forgetting equals ‖ΔW‖²/16 because the old tasks average to W0',()=>{
 const D=M.randn(16,16,M.rng(9),0.1);near(M.forgetting(tone,D),M.frob(D)**2/16,1e-9);
 const pts=M.tradeoff(M.makeWorld({family:'skill'}),[1,2,4,8,16]);for(let i=1;i<pts.length;i++){assert.ok(pts[i].learned>=pts[i-1].learned-1e-9);assert.ok(pts[i].forgot>=pts[i-1].forgot-1e-9);}
});
test('subspace similarity lies in [0, 1] and is 1 for a matrix against itself',()=>{
 const A=M.randn(4,16,M.rng(2)),p=M.subspaceSimilarity(A,A);for(let i=0;i<4;i++)near(p[i][i],1,1e-8);
 for(const row of M.subspaceSimilarity(A,M.randn(8,16,M.rng(5))))for(const v of row)assert.ok(v>=-1e-12&&v<=1+1e-9);
});
test('random subspace: d = 0 changes nothing and d = 256 recovers full least squares',()=>{near(M.randomSubspace(tone,0),0,1e-9);near(M.randomSubspace(tone,256),1,1e-6);assert.equal(M.intrinsicCurve(tone).d90,240);});

test('guide numbers · delta, svd, gradient, pretrain',()=>{
 const W0=M.frob(tone.W0);has('delta',F(M.frob(ft.dW)),F(W0),P(M.frob(ft.dW)/W0),F(ft.start,3),F(ft.loss,3),P(M.gain(ft.W,tone)));
 const f50=M.fullFinetune(tone,{steps:50});has('delta',F(M.frob(f50.dW)),P(M.gain(f50.W,tone)));
 for(const fam of ['skill','format']){const w=M.makeWorld({family:fam}),f=M.fullFinetune(w);has('delta',P(M.frob(f.dW)/M.frob(w.W0)),P(M.gain(f.W,w)));}
 const d=M.svd(ft.dW),rel=k=>M.frob(M.add(ft.dW,M.truncate(ft.dW,k,d),-1))/M.frob(ft.dW);has('svd',P(M.energy(d.s,3)),P(rel(3)),P(M.energy(d.s,1)),P(rel(1)),...d.s.slice(0,4).map(x=>F(x)));
 const d0=M.svd(tone.W0);has('svd',P(M.energy(d0.s,3)),P(M.frob(M.add(tone.W0,M.truncate(tone.W0,3,d0),-1))/W0),`${M.rankFor(d0.s,.9)}개`);
 const sc=M.svd(M.fullFinetune(tone,{start:M.zeros(16,16)}).dW);has('svd',P(M.energy(sc.s,3)));
 assert.deepEqual([1,4,32].map(b=>M.gradientRank(tone,{batch:b,inputDims:16}).rank),[1,4,16]);assert.equal(M.gradientRank(tone,{batch:32,inputDims:4}).rank,4);
 has('gradient',F(M.inputSpanCheck(tone,{inputDims:4}).norm,3),F(M.inputSpanCheck(tone,{inputDims:16}).norm,3));
 const pre=(from,m)=>{const w=M.makeWorld({family:'skill',m}),f=M.fullFinetune(w,{start:from==='pre'?w.W0:M.zeros(16,16)}),s=M.svd(f.dW).s;return [F(M.frob(f.dW)),M.rankFor(s,.9),M.rankFor(s,.99)];};
 assert.deepEqual(pre('pre',3),['1.88',2,3]);assert.deepEqual(pre('zero',3),['13.37',8,12]);assert.deepEqual(pre('pre',1),['1.10',1,2]);assert.deepEqual(pre('pre',12),['2.65',6,8]);has('pretrain','1.88','13.37','1.10','2.65');
});
test('guide numbers · intrinsic, dynamics, expressivity, subspace',()=>{
 has('intrinsic',...[96,240,32].map(d=>P(M.randomSubspace(tone,d))),...[1,2,3].map(r=>P(M.trainLora(tone,{r}).gain)));
 const log=r=>M.trainLora(tone,{r,steps:300,track:10}).log,a=log(3),b=log(1),c=log(8);
 has('dynamics',P(a[0].cover),F(a[0].cos),P(a[10].cover),P(a[10].coverB),P(b[10].cover),P(c[0].cover),F(c[0].cos));near(a[0].coverB,0,1e-12);
 for(const [fam,r] of [['tone',3],['tone',1],['skill',3],['skill',16]]){const w=M.makeWorld({family:fam}),f=M.fullFinetune(w),d=M.svd(f.dW);has('expressivity',P(M.trainLora(w,{r}).gain),P(M.gain(f.W,w)));if(r<16)has('expressivity',P(M.gain(M.add(w.W0,M.truncate(f.dW,r,d)),w)));}
 const phi=(r1,r2)=>M.subspaceSimilarity(M.trainLora(tone,{r:r1,seed:21}).A,M.trainLora(tone,{r:r2,seed:22}).A),rnd=(r1,r2)=>M.subspaceSimilarity(M.randn(r1,16,M.rng(41)),M.randn(r2,16,M.rng(42)));
 has('subspace',F(phi(2,8)[0][0]),F(rnd(2,8)[0][0]),F(phi(2,8)[1][1]),F(phi(1,8)[0][0]),F(phi(4,16)[0][0]),F(rnd(4,16)[0][0]),F(phi(2,4)[0][0]));
 has('subspace',...M.svd(tone.need).s.slice(0,3).map(x=>F(x)));
});
test('guide numbers · energy, regularize, limits, final',()=>{
 for(const [n,s,k90,kp] of [[128,.1,1,3],[64,.3,2,2],[32,.5,4,1],[256,1,3,1]]){const r=M.rankReport(tone,{count:n,noise:s});assert.equal(r.k90,k90,`${n}/${s}`);assert.equal(r.kPerf,kp,`${n}/${s}`);}
 has('energy',P(M.rankReport(tone).full),P(M.rankReport(tone,{count:32,noise:.5}).full));
 const at=(r,s,n)=>M.dataSweep(tone,{r,noise:s,counts:[n]})[0];
 const a=at(3,.6,24),b=at(3,.6,128);has('regularize',P(a.full).replace('-','−'),P(a.lora),P(b.full),P(b.lora),P(at(1,.6,24).lora));
 const c=at(3,1,24),e=at(8,.3,24);has('regularize',P(c.full).replace('-','−'),P(c.lora).replace('-','−'),P(e.full),P(e.lora));assert.ok(a.full<0&&a.lora>0);
 for(const [fam,r] of [['tone',2],['tone',3],['skill',3],['skill',8]]){const p=M.tradeoff(M.makeWorld({family:fam}),[r,16]);has('limits',P(p[0].learned),F(p[0].forgot,3),F(p[1].forgot,3));}
 const v=(k,r)=>M.probeVerdict(k,r);
 const a2=v('a',2),a1=v('a',1),b2=v('b',2),b4=v('b',4),c3=v('c',3),c8=v('c',8);
 assert.ok(a2.enough&&!a1.enough&&!b2.enough&&b4.enough&&!c3.enough&&c8.enough);
 assert.deepEqual([a2.rep.k90,a2.rep.kPerf,b2.rep.k90,b2.rep.kPerf,c3.rep.k90,c3.rep.kPerf],[2,2,3,4,6,10]);
 has('final',P(a2.lora.gain),P(a2.rep.full),P(a1.lora.gain),P(b2.lora.gain),P(b4.lora.gain),P(c3.lora.gain),P(c8.lora.gain),F(c8.forgot,3),F(c8.fullForgot,3));
});
test('0장 guide: B·A parameter counts and LoRA gains match the computation',()=>{
 const skill=M.makeWorld({family:'skill'}),g=(w,r)=>P(M.trainLora(w,{r}).gain);
 has('overview',g(tone,1),g(tone,3),g(skill,3),g(skill,8),'12.5%','37.5%','256개');
 const lo=M.trainLora(tone,{r:3});assert.equal(lo.params,96);assert.equal(lo.B.length,16);assert.equal(lo.B[0].length,3);assert.equal(lo.A.length,3);assert.equal(lo.A[0].length,16);
});
