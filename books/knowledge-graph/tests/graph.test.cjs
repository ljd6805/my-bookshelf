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

test('keyword ranking keeps document order for ties',()=>{
 const r=G.keywordRank([{text:'가 나'},{text:'나'},{text:'가 나 다'}],['가','나']);
 assert.deepEqual(r.map(x=>x.i),[0,2,1]);
});
