const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../js/graph.js');

test('the Curie graph has 14 entities and 21 facts in one component',()=>{
 const s=G.stats(G.triples);
 assert.equal(s.nodes,14);assert.equal(s.edges,21);assert.equal(s.components,1);assert.equal(s.top,'marie');
 for(const [a,p,b] of G.triples.concat(G.extra)){assert.ok(G.entities[a]&&G.entities[b],a+b);assert.ok(G.schema[p],p);}
});

test('islands merge as facts are added: 4 components at fact 4, one at fact 9',()=>{
 const comps=n=>G.stats(G.triples.slice(0,n)).components;
 assert.deepEqual([1,2,3,4,5,6,7,8,9].map(comps),[1,2,3,4,4,3,3,2,1]);
 assert.equal(comps(0),0);
});

test('breadth-first reach from polonium and the shortest path to the 1935 prize',()=>{
 assert.deepEqual([0,1,2,3,4].map(h=>G.reach(G.triples,'polonium',h).count),[0,3,9,13,13]);
 assert.equal(G.reach(G.triples,'polonium',3).used.length,21);
 assert.equal(G.path(G.triples,'polonium','nobel1935').length,3);
 assert.equal(G.path(G.triples,'marie','nobel1935').length,2);
 assert.equal(G.path(G.triples,'marie','marie').length,0);
});

test('jaccard similarity of name bigrams: bounds and known values',()=>{
 assert.equal(G.jaccard('Marie Curie','Marie Curie'),1);
 assert.equal(G.jaccard('마리 퀴리','Marie Curie'),0);
 assert.equal(G.jaccard('Marie Curie','M. Curie'),.5);
 assert.ok(Math.abs(G.jaccard('M. Curie','P. Curie')-4/6)<1e-12);
 assert.equal(G.jaccard('a','b'),0);
});

test('entity resolution: no threshold is perfect, identifiers are',()=>{
 const names=[['마리 퀴리','marie'],['Marie Curie','marie'],['M. Curie','marie'],['피에르 퀴리','pierre'],['P. Curie','pierre'],['Pierre Curie','pierre']].map(([name,id])=>({name,id}));
 for(let t=.05;t<=1;t+=.05){const r=G.resolve(names,t);assert.ok(r.wrong>0||r.missed>0,String(t));}
 const exact=G.resolve(names,.5,true);assert.equal(exact.clusters.length,2);assert.equal(exact.wrong,0);assert.equal(exact.missed,0);
});

test('ontology: types inherit up the hierarchy; validate rejects and RDFS infers',()=>{
 assert.deepEqual(G.typesOf('marie'),['Scientist','Person','Agent','Thing']);
 assert.equal(G.check('marie','awarded','nobel1911').ok,true);
 const bad=G.check('marie','awarded','paris');assert.equal(bad.ok,false);assert.equal(bad.okS,true);assert.equal(bad.okO,false);
 assert.deepEqual(G.check('marie','awarded','paris','rdfs').inferred,['paris a Award']);
 assert.deepEqual(G.check('polonium','spouse','pierre','rdfs').inferred,['polonium a Person']);
 for(const t of G.triples.concat(G.extra))assert.equal(G.check(...t).ok,true,t.join(' '));
});

test('forward chaining reaches a fixed point; counts per round',()=>{
 const base=G.triples.concat(G.extra);
 const all=G.infer(base,['spouse','parent','located'],5);
 assert.deepEqual(all.log.map(r=>r.length),[9,3]);assert.equal(all.fixed,true);assert.equal(all.all.length,base.length+12);
 const one=G.infer(base,['located'],1);assert.equal(one.added,5);assert.equal(one.fixed,false);
 assert.ok(G.infer(base,['located'],2).all.some(t=>t.join()==='marie,bornIn,europe'));
 assert.equal(G.infer(base,[],3).added,0);
 const again=G.infer(all.all,['spouse','parent','located'],3);assert.equal(again.added,0);
});

test('pattern matching joins on shared variables and respects direction',()=>{
 assert.deepEqual(G.match(G.triples,[['?x','discovered','polonium']]).map(r=>r['?x']).sort(),['marie','pierre']);
 assert.deepEqual(G.match(G.triples,[['?x','discovered','polonium'],['?x','spouse','?y']]),[{'?x':'marie','?y':'pierre'}]);
 assert.equal(G.match(G.triples,[['?x','spouse','marie']]).length,0);
 const reasoned=G.infer(G.triples,['spouse'],3).all;
 assert.equal(G.match(reasoned,[['?x','discovered','polonium'],['?x','spouse','?y']]).length,2);
 assert.equal(G.chainComplete(G.triples)[0]['?z'],'nobel1935');
});

test('precision and recall: recall never rises with the threshold, empty set is undefined',()=>{
 const c=[{score:.9,gold:true},{score:.6,gold:false},{score:.4,gold:true},{score:.2,gold:false}];
 let last=1;for(let t=0;t<=1.0001;t+=.05){const r=G.prf(c,t);assert.ok(r.recall<=last+1e-12);last=r.recall;}
 assert.equal(G.prf(c,.95).precision,null);
 const half=G.prf(c,.5);assert.equal(half.precision,.5);assert.equal(half.recall,.5);assert.equal(half.f1,.5);
});

test('TransE ranks by distance and the mean offset minimises squared error',()=>{
 const pairs=[[[0,0],[1,1]],[[1,0],[2,1.2]],[[0,1],[0.9,2]]],r=G.meanOffset(pairs);
 const sse=v=>pairs.reduce((s,[h,t])=>s+(h[0]+v[0]-t[0])**2+(h[1]+v[1]-t[1])**2,0);
 for(const d of [[.01,0],[-.01,0],[0,.01],[0,-.01]])assert.ok(sse(r)<sse([r[0]+d[0],r[1]+d[1]]));
 const rank=G.transe([0,0],[1,1],{a:[1,1],b:[3,3],c:[1.2,1]});assert.deepEqual(rank.map(x=>x.id),['a','c','b']);assert.equal(rank[0].d,0);
});

test('the chapter 8 coordinates: mean offset fits all training pairs and generalises to Madrid',()=>{
 const {cities,countries,answer,train}=G.embedding,cand=Object.fromEntries(Object.entries(countries).map(([k,v])=>[k,v[1]]));
 const pairs=train.map(c=>[cities[c][1],answer[c]]),best=G.meanOffset(train.map(c=>[cities[c][1],countries[answer[c]][1]]));
 assert.deepEqual(best.map(v=>+v.toFixed(4)),[1.525,1.2125]);
 const fit=G.transeScore(pairs,best,cand),none=G.transeScore(pairs,[0,0],cand);
 assert.equal(fit.hits,4);assert.ok(fit.meanError<none.meanError);assert.ok(none.hits<4);
 assert.equal(G.transe(cities.madrid[1],best,cand)[0].id,'spain');
});

test('keyword ranking keeps document order for ties',()=>{
 const r=G.keywordRank([{text:'가 나'},{text:'나'},{text:'가 나 다'}],['가','나']);
 assert.deepEqual(r.map(x=>x.i),[0,2,1]);
});

test('choiceOrder puts the answer at the target position and keeps every option once',()=>{
 for(let answer=0;answer<3;answer++)for(let target=0;target<3;target++){
  const order=G.choiceOrder(3,answer,target);
  assert.equal(order[target],answer);assert.deepEqual([...order].sort(),[0,1,2]);
 }
});

test('adjacency matrix powers count walks: first nonzero power equals the BFS distance',()=>{
 const at=(k,a,b)=>{const w=G.walks(G.triples,k);return w.P[w.at[a]][w.at[b]];};
 assert.deepEqual([1,2,3,4].map(k=>at(k,'polonium','nobel1935')),[0,0,2,6]);
 assert.equal([1,2,3,4].find(k=>at(k,'polonium','nobel1935')>0),G.path(G.triples,'polonium','nobel1935').length);
 // A²의 대각선은 차수와 같다(보행은 같은 간선으로 되돌아올 수 있다).
 const deg=G.stats(G.triples).degree,w2=G.walks(G.triples,2);
 for(const id of w2.ids)assert.equal(w2.P[w2.at[id]][w2.at[id]],deg[id],id);
 assert.equal(at(2,'marie','marie'),8);
 // 보행 합계는 불어나지만 닿는 점은 13개에서 멈춘다.
 assert.deepEqual([1,2,3,4].map(k=>{const w=G.walks(G.triples,k);return w.P[w.at.polonium].reduce((a,b)=>a+b,0);}),[3,16,56,269]);
 assert.deepEqual(G.walks(G.triples,0).P[0].filter(v=>v).length,1);
});

test('whole-graph shape check: 21 facts pass; wrong facts and an untyped node differ by mode',()=>{
 const base=G.shapeReport(G.triples);assert.equal(base.violations.length,0);assert.deepEqual(base.inferred,[]);
 const award=G.shapeReport(G.triples.concat([['marie','awarded','paris']]));assert.equal(award.violations.length,1);assert.deepEqual(award.inferred,['paris a Award']);
 const fresh=G.shapeReport(G.triples.concat([['bronislawa','bornIn','warsaw']]));assert.equal(fresh.violations.length,1);assert.deepEqual(fresh.inferred,['bronislawa a Person']);assert.deepEqual(fresh.untyped,['bronislawa']);
 const all=G.shapeReport(G.triples.concat([['marie','awarded','paris'],['polonium','spouse','pierre'],['bronislawa','bornIn','warsaw']]));
 assert.equal(all.rows.length,24);assert.equal(all.violations.length,3);assert.equal(all.inferred.length,3);
});

test('the evidence chain the book follows is answered by the three-line pattern',()=>{
 const rows=G.match(G.triples,[['?x','discovered','polonium'],['?y','childOf','?x'],['?y','awarded','?z']]);
 assert.equal(rows.length,2);assert.deepEqual([...new Set(rows.map(r=>r['?z']))],['nobel1935']);
 // 7장 추출 후보 가운데 관계 규칙에 걸리는 틀린 후보는 하나뿐이다(본문 7장).
 const wrong=[['becquerel','spouse','marie'],['polonium','discovered','marie'],['pierre','awarded','nobel1911'],['irene','childOf','frederic']];
 assert.equal(wrong.filter(t=>!G.check(...t).ok).length,1);
});
