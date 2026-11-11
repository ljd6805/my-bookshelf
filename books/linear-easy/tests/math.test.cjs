/* 계산 모델 검증: 벡터·행렬·뉴런·텐서·역행렬·고윳값·야코비안의 대표값, 경계값, 불변 조건.
   안내 상자(lab-guides.js)의 결과 읽기와 복습 문제(review.json)에 적은 숫자가 실제 계산과 같은지도 여기서 대조한다. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),ctx={window:{}};
for(const f of ['math.js','lab-guides.js','content.js'])vm.runInNewContext(fs.readFileSync(path.join(base,'js',f),'utf8'),ctx);
const M=ctx.window.ELMath,G=ctx.window.ELGuides.guides,reading=id=>G[id][2];
const has=(id,...xs)=>{for(const x of xs)assert.ok(reading(id).includes(x),`${id}: "${x}" not in guide`);};
const near=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
const vnear=(a,b,eps=1e-9)=>{assert.equal(a.length,b.length);a.forEach((x,i)=>near(x,b[i],eps));};
const v=id=>M.drink(id).v,plain=x=>JSON.parse(JSON.stringify(x));

test('vectors: add, scale, subtract work component by component',()=>{
 vnear(M.add(v('latte'),M.scale([0,0,1],2)),v('vanilla'));vnear(M.scale(v('americano'),1.5),[3,0,0]);vnear(M.add(v('espresso'),v('americano')),[3,0,0]);
 vnear(M.scale(v('latte'),2),[4,4,0]);vnear(M.sub(v('vanilla'),v('latte')),[0,0,2]);vnear(M.scale(v('latte'),0),[0,0,0]);
 has('addscale','(2, 2, 2)','(3, 0, 0)','(4, 4, 0)');
});
test('length and distance: representative values, zero vector, symmetry, triangle inequality',()=>{
 near(M.norm([3,4,0]),5);near(M.norm([0,0,0]),0);near(M.norm(v('latte')),Math.sqrt(8));near(M.dist(v('latte'),v('flat')),Math.SQRT2);near(M.dist(v('latte'),v('vanilla')),2);
 const x=[2,1.5,.5];near(M.norm(x),Math.sqrt(6.5));near(M.dist(x,v('latte')),Math.sqrt(.5));assert.equal(M.nearest(x).drink.id,'latte');
 for(const id of ['americano','latte','vanilla','flat'])near(M.dist([2,1,1],v(id)),Math.SQRT2);
 near(M.dist([3,4,0],v('americano')),Math.sqrt(17));
 for(const a of M.DRINKS)for(const b of M.DRINKS){near(M.dist(a.v,b.v),M.dist(b.v,a.v));for(const c of M.DRINKS)assert.ok(M.dist(a.v,c.v)<=M.dist(a.v,b.v)+M.dist(b.v,c.v)+1e-12);}
 has('length','2.55','0.71','1.41','4.12');
});
test('dot product: bills, cosine, right angle, and the zero-vector case',()=>{
 assert.equal(M.dot(M.RATES.cost.w,v('latte')),1600);assert.equal(M.dot(M.RATES.kcal.w,v('latte')),140);assert.equal(M.dot(M.RATES.kcal.w,v('vanilla')),180);assert.equal(M.dot(M.RATES.cost.w,v('vanilla')),1800);
 near(M.cosine(v('espresso'),v('americano')),1);near(M.angleDeg(v('espresso'),v('americano')),0);assert.equal(M.dot(v('espresso'),v('steamer')),0);near(M.angleDeg(v('espresso'),v('steamer')),90);
 assert.equal(M.cosine([0,0,0],v('latte')),null);assert.equal(M.angleDeg([0,0,0],v('latte')),null);
 assert.equal(M.round(M.cosine(v('latte'),v('flat')),2),0.89);assert.equal(M.round(M.angleDeg(v('latte'),v('flat')),1),26.6);
 near(M.dot(v('latte'),v('flat')),M.norm(v('latte'))*M.norm(v('flat'))*M.cosine(v('latte'),v('flat')));
 has('dot','1,600원','140 kcal','180 kcal','0.89','26.6°');
});
test('neuron: weighted sums of the six drinks, bias shift, boundary is not positive',()=>{
 const z=(id,w=M.TASTE.w,b=M.TASTE.b)=>M.neuron(w,b,v(id)).z;
 near(z('americano'),.5);near(z('latte'),1.5);near(z('flat'),2);near(z('vanilla'),-.5);near(z('espresso'),-.5);near(z('steamer'),-2);
 near(z('flat',M.TASTE.w,-3),.5);near(z('latte',M.TASTE.w,-3),0);assert.equal(M.neuron(M.TASTE.w,-3,v('latte'),'step').out,0);
 near(z('vanilla',[0,.5,1],-2),1);near(z('steamer',[0,.5,1],-2),1.5);assert.equal(M.DRINKS.filter(d=>z(d.id,[0,.5,1],-2)>0).length,2);
 assert.equal(M.neuron(M.TASTE.w,M.TASTE.b,v('vanilla'),'relu').out,0);near(M.sigmoid(0),.5);assert.equal(M.step(0),0);assert.equal(M.relu(-3),0);
 has('neuron','아메리카노(0.5)','라테(1.5)','플랫화이트(2)','플랫화이트(0.5)','바닐라라테(1)','바닐라우유(1.5)');
});
test('matrix times vector is one dot product per row',()=>{
 assert.deepEqual(plain(M.matVec(M.MENU,v('latte'))),[1600,140,150]);assert.deepEqual(plain(M.matVec(M.MENU,v('americano'))),[1000,10,150]);assert.deepEqual(plain(M.matVec(M.MENU.slice(0,2),v('latte'))),[1600,140]);
 vnear(M.matVec(M.NET.W1,v('vanilla')),[1,3]);vnear(M.matVec(M.identity(3),[7,-2,.5]),[7,-2,.5]);
 for(const d of M.DRINKS)M.MENU.forEach((r,i)=>near(M.matVec(M.MENU,d.v)[i],M.dot(r,d.v)));
 has('matrix','(1600, 140)','(1600, 140, 150)','(1, 3)');
});
test('transforms: columns are where unit vectors land; determinant is the volume factor',()=>{
 const T=M.TRANSFORMS,d=k=>M.det3(T[k].M);
 near(d('identity'),1);near(d('stretch'),2);near(d('turn'),1);near(d('shear'),1);near(d('flatten'),0);near(d('flip'),-1);near(d('grow'),3.375);
 vnear(M.matVec(T.stretch.M,[1,0,0]),[2,0,0]);vnear(M.matVec(T.turn.M,[1,0,0]),[0,1,0],1e-12);vnear(M.matVec(T.turn.M,[0,1,0]),[-1,0,0],1e-12);vnear(M.matVec(T.shear.M,[0,1,0]),[1,1,0]);vnear(M.matVec(T.flatten.M,[0,0,1]),[0,0,0]);
 for(const k of Object.keys(T))for(let j=0;j<3;j++)vnear(M.column(T[k].M,j),M.matVec(T[k].M,M.identity(3)[j]),1e-12);
 has('transform','(2, 0, 0)','(0, 1, 0)','(−1, 0, 0)','(1, 1, 0)','행렬식이 0','−1');
});
test('matrix product composes transforms; order matters; determinants multiply',()=>{
 const T=M.TRANSFORMS,r=X=>X.map(row=>row.map(x=>M.round(x,6)));
 assert.deepEqual(plain(r(M.matMul(T.turn.M,T.stretch.M))),[[0,-1,0],[2,0,0],[0,0,1]]);assert.deepEqual(plain(r(M.matMul(T.stretch.M,T.turn.M))),[[0,-2,0],[1,0,0],[0,0,1]]);
 assert.deepEqual(plain(M.matMul(T.grow.M,T.stretch.M)),[[3,0,0],[0,1.5,0],[0,0,1.5]]);assert.deepEqual(plain(M.matMul(T.stretch.M,T.grow.M)),plain(M.matMul(T.grow.M,T.stretch.M)));
 assert.deepEqual(plain(M.matMul(T.shear.M,T.flatten.M)),plain(M.matMul(T.flatten.M,T.shear.M)));
 const x=[1,2,3];vnear(M.matVec(T.turn.M,M.matVec(T.stretch.M,x)),M.matVec(M.matMul(T.turn.M,T.stretch.M),x),1e-12);
 for(const a of Object.keys(T))for(const b of Object.keys(T))near(M.det3(M.matMul(T[a].M,T[b].M)),M.det3(T[a].M)*M.det3(T[b].M),1e-9);
 assert.throws(()=>M.matMul([[1,2,3]],[[1,2,3]]),/모양이 맞지 않습니다/);
 has('matmul','[0 −1 0; 2 0 0; 0 0 1]','[0 −2 0; 1 0 0; 0 0 1]','[3 0 0; 0 1.5 0; 0 0 1.5]');
});
test('shape rule, transpose and batch',()=>{
 assert.equal(M.mulShape([6,3],[2,3]).ok,false);assert.deepEqual(plain(M.mulShape([6,3],[2,3]).inner),[3,2]);assert.deepEqual(plain(M.mulShape([6,3],[3,2])),{ok:true,shape:[6,2],mults:36});
 assert.deepEqual(plain(M.mulShape([4,3],[3,5])),{ok:true,shape:[4,5],mults:60});assert.deepEqual(plain(M.mulShape([1,3],[3,1]).shape),[1,1]);
 assert.deepEqual(plain(M.shape(M.transpose(M.NET.W1))),[3,2]);assert.deepEqual(plain(M.transpose(M.transpose(M.NET.W1))),plain(M.NET.W1));
 const X=M.DRINKS.map(d=>d.v),out=M.batch(X,M.NET.W1,M.NET.b1);assert.deepEqual(plain(M.shape(out)),[6,2]);vnear(out[2],[.5,0]);
 X.forEach((x,i)=>vnear(out[i],M.layer(M.NET.W1,M.NET.b1,x).z));
 has('shape','(6×2)','36번','(0.5, 0)','(4×5)','60번');
});
test('tensor: shape, count and sums along each axis',()=>{
 const T=M.orders();assert.deepEqual(plain(M.tensorShape(T)),[2,6,3]);assert.equal(M.count([2,6,3]),36);assert.equal(M.count([]),1);
 const s0=M.sumAxis(T,0),s1=M.sumAxis(T,1),s2=M.sumAxis(T,2);assert.deepEqual(plain(M.shape(s0)),[6,3]);assert.deepEqual(plain(s0[2]),[42,42,0]);
 assert.deepEqual(plain(s1),[[75,50,18],[76,56,28]]);assert.deepEqual(plain(M.shape(s2)),[2,6]);assert.deepEqual(plain(M.dropAxis([2,6,3],1)),[2,3]);
 const total=T.flat(2).reduce((a,b)=>a+b,0);for(const s of [s0,s1,s2])assert.equal(s.flat().reduce((a,b)=>a+b,0),total);
 assert.deepEqual(plain(M.tensorShape(M.orders(1,3))),[1,3,3]);
 has('tensor','36개','(42, 42, 0)','(75, 50, 18)','(76, 56, 28)');
});
test('inverse and rank: recover the recipe only at full rank',()=>{
 near(M.det3(M.MENU),-37500);assert.equal(M.rank(M.OUTPUTS.full.M),3);assert.equal(M.rank(M.OUTPUTS.double.M),2);assert.equal(M.rank(M.OUTPUTS.same.M),1);assert.equal(M.rank([[0,0,0],[0,0,0],[0,0,0]]),0);
 const inv=M.inv3(M.MENU);M.matMul(inv,M.MENU).forEach((r,i)=>vnear(r,M.identity(3)[i],1e-9));assert.equal(M.inv3(M.OUTPUTS.double.M),null);
 for(const d of M.DRINKS){const r=M.recover('full',d.v);assert.ok(r.ok);vnear(r.x,d.v,1e-9);}
 const a=M.recover('double',v('latte'));assert.equal(a.ok,false);vnear(a.otherY,a.y,1e-6);assert.ok(!M.same(a.other,v('latte')));assert.deepEqual(plain(a.other.map(x=>M.round(x,2))),[1.98,1.69,1]);assert.deepEqual(plain(a.y),[1600,3200,140]);
 const b=M.recover('same',v('latte'));vnear(b.otherY,b.y,1e-6);assert.deepEqual(plain(b.other.map(x=>M.round(x,2))),[1.4,3,0]);
 has('inverse','−37,500','(1600, 140, 150)','(1.98, 1.69, 1)','(1600, 3200, 140)','(1.4, 3, 0)');
});
test('eigenvalues: Av = λv, repeated products settle on the largest eigenvalue',()=>{
 const R=M.REPEAT,e=M.eig2(R.regulars.M);near(e.values[0],1);near(e.values[1],.6);
 e.vectors.forEach((x,i)=>vnear(M.matVec(R.regulars.M,x),M.scale(x,e.values[i]),1e-12));vnear(M.matVec(R.regulars.M,[75,25]),[75,25]);
 vnear(M.eig2(R.grow.M).values,[1.2,.8]);vnear(M.eig2(R.shrink.M).values,[.7,.3]);assert.equal(M.eig2([[0,-1],[1,0]]).real,false);
 const r3=x=>x.map(y=>M.round(y,3));assert.deepEqual(plain(r3(M.powers(R.regulars.M,[50,50],5)[5])),[73.056,26.944]);assert.deepEqual(plain(r3(M.powers(R.regulars.M,[10,90],20)[20])),[74.998,25.002]);
 assert.deepEqual(plain(r3(M.powers(R.grow.M,[1,0],20)[20])),[19.175,19.163]);assert.ok(M.norm(M.powers(R.shrink.M,[1,0],20)[20])<.001);
 for(const x of M.powers(R.regulars.M,[50,50],20))near(x[0]+x[1],100,1e-9);
 assert.deepEqual(plain(M.powers(R.regulars.M,[50,50],2).map(x=>x.map(y=>M.round(y,6)))),[[50,50],[60,40],[66,34]]);
 has('eigen','(73.056, 26.944)','(74.998, 25.002)','(19.175, 19.163)','0.001');
});
test('jacobian: exact while no neuron switches, off when one does; gradient equals the numeric one',()=>{
 const N=M.NET,x=M.NEWDRINK.v,J=M.layerJacobian(N.W1,N.b1,x);assert.deepEqual(plain(J),plain(N.W1));vnear(M.matVec(J,[.5,0,0]),[.5,0]);
 vnear(M.scoreGradient(x),[2,-1.5,-1]);vnear(M.numericGradient(p=>M.forward(p).y,x),[2,-1.5,-1],1e-6);
 near(M.forward([3.5,2,1]).y-M.forward(x).y,1);near(M.forward([3,2,2]).y-M.forward(x).y,-1);near(M.forward([3,2.2,1]).y-M.forward(x).y,-.3);
 const la=v('latte'),Jl=M.layerJacobian(N.W1,N.b1,la);assert.deepEqual(plain(Jl[1]),[0,0,0]);vnear(M.matVec(Jl,[0,2,0]),[-1,0]);vnear(M.sub(M.forward([2,4,0]).h,M.forward(la).h),[-.5,1]);
 const va=v('vanilla'),Jv=M.layerJacobian(N.W1,N.b1,va);assert.deepEqual(plain(Jv),plain(N.W1));vnear(M.matVec(Jv,[0,2,0]),[-1,1]);vnear(M.sub(M.forward([2,4,2]).h,M.forward(va).h),[-.5,1]);near(M.forward([2,4,2]).y-M.forward(va).y,-2);near(M.dot(M.scoreGradient(va),[0,2,0]),-3);
 near(M.forward([2,3,2]).y-M.forward(va).y,M.dot(M.scoreGradient(va),[0,1,0]));assert.deepEqual(plain(M.layerJacobian(N.W1,N.b1,v('americano'))[1]),[0,0,0]);near(M.layer(N.W1,N.b1,v('americano')).z[1],-1);
 has('jacobian','(0.5, 0)','1.5에서 2.5','(0.5, 2)에서 (0, 3)','(−0.5, 1)','(−1, 1)','−1.5에서 −3.5');
});
test('forward pass of the two-layer network, stage by stage',()=>{
 const f=M.forward(M.NEWDRINK.v);vnear(M.matVec(M.NET.W1,M.NEWDRINK.v),[2,2]);vnear(f.z1,[1.5,1]);vnear(f.h,[1.5,1]);near(f.y,1.5);
 const va=M.forward(v('vanilla'));vnear(va.h,[.5,2]);near(va.y,-1.5);const st=M.forward(v('steamer'));vnear(st.z1,[-2,2.5]);vnear(st.h,[0,2.5]);
 const la=M.forward(v('latte'));vnear(la.h,[.5,0]);near(la.y,.5);vnear(M.forward([0,0,0]).h,[0,0]);near(M.forward([0,0,0]).y,-.5);
 has('final','(2, 2)','(1.5, 1)','(0.5, 2)','−1.5','(−2, 2.5)','(0, 2.5)');
});
test('choice rotation keeps a permutation and puts the answer at the target',()=>{
 for(let a=0;a<3;a++)for(let t=0;t<3;t++){const o=M.choiceOrder(3,a,t);assert.equal([...o].sort().join(),'0,1,2');assert.equal(o[t],a);}
 assert.equal(M.round(-0.0001),0);assert.ok(!Object.is(M.round(-0.0001),-0));
});
