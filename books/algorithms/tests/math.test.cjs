const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../js/math.js');
const close=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
const sorted=a=>a.every((v,i)=>!i||a[i-1]<=v);

test('ch1: counted steps follow n, n(n-1)/2 and floor(log2 n)+1; doubling n doubles, quadruples, adds one',()=>{
 assert.deepEqual(['linear','pairs','halving'].map(t=>M.measure(t,1000)),[1000,499500,10]);
 assert.deepEqual(['linear','pairs','halving'].map(t=>M.measure(t,2000)),[2000,1999000,11]);
 for(const n of [1,2,7,64,100,1000])for(const t of ['linear','pairs','halving'])assert.equal(M.measure(t,n),M.growth[t](n),t+n);
 assert.throws(()=>M.measure('linear',0),RangeError);assert.throws(()=>M.measure('sort',10),RangeError);
});
test('binary search: worst case floor(log2 n)+1 at 1e4 and 1e6, finds every key in a small shelf',()=>{
 assert.equal(M.binarySearch(1e4,M.callNumber(3700)).comparisons,13);assert.equal(M.binarySearch(1e6,M.callNumber(1e6-1)).comparisons,20);assert.equal(M.binarySearch(1e6,M.callNumber(0)).comparisons,19);
 for(const n of [1,2,3,10,1000,1e4,1e6])assert.ok(M.binarySearch(n,M.callNumber(n)+1).comparisons<=Math.floor(Math.log2(n))+1);
 for(let i=0;i<37;i++)assert.equal(M.binarySearch(37,M.callNumber(i)).index,i);assert.equal(M.binarySearch(37,1001).index,-1);
});
test('ch2: array vs linked list costs for n=1000, and bad input is rejected',()=>{
 const tot=(k,op)=>M.listCost(k,op,1000).total;
 assert.deepEqual([tot('array','front'),tot('linked','front')],[1001,1]);assert.deepEqual([tot('array','back'),tot('linked','back')],[1,1000]);
 assert.deepEqual([tot('array','read'),tot('linked','read')],[1,501]);assert.deepEqual([tot('array','remove'),tot('linked','remove')],[500,500]);
 assert.equal(M.listCost('linked','remove',1).total,1);assert.throws(()=>M.listCost('array','front',0),RangeError);assert.throws(()=>M.listCost('tree','front',5),RangeError);
});
test('ch2: queue serves first-come first; stack with arrive 2 / serve 1 never serves book 1; equal rates make them alike',()=>{
 const q=M.serveSim('queue',2,1),s=M.serveSim('stack',2,1);
 assert.equal(q.first.wait,0);close(q.avgWait,3);assert.equal(q.maxWait,6);assert.equal(s.first,null);assert.equal(s.maxWait,11);
 assert.equal(q.done.length+q.left.length,24);assert.deepEqual(M.serveSim('stack',1,1).order,M.serveSim('queue',1,1).order);
 assert.throws(()=>M.serveSim('queue',-1,1),RangeError);
});
test('ch3: sorts are correct and their comparison counts match hand values; lower bound is ceil(log2 n!)',()=>{
 const c=o=>Object.values(M.SORTS).map(f=>f(M.makeInput(o,128)).comparisons);
 assert.deepEqual(c('random'),[4338,733,771]);assert.deepEqual(c('sorted'),[127,448,8128]);assert.deepEqual(c('reversed'),[8128,448,8128]);
 assert.equal(M.sortLowerBound(128),717);assert.equal(M.sortLowerBound(8),16);assert.equal(M.sortLowerBound(1),0);assert.equal(M.sortLowerBound(2),1);assert.equal(M.sortLowerBound(3),3);
 for(const o of ['random','sorted','reversed'])for(const n of [1,2,9,64])for(const f of Object.values(M.SORTS))assert.ok(sorted(f(M.makeInput(o,n)).sorted));
 for(const n of [8,64,128,512])assert.ok(M.mergeSort(M.makeInput('random',n)).comparisons>=M.sortLowerBound(n)*0.9);
});
test('ch4: tree height — random 31 → 9, sorted 31 → 31, AVL 5; 255 sorted → 255 vs AVL 8; AVL stays within 1.44 log2 n',()=>{
 assert.equal(M.treeExperiment('random','plain',31).height,9);assert.equal(M.treeExperiment('sorted','plain',31).height,31);
 const a=M.treeExperiment('sorted','avl',31);assert.equal(a.height,5);assert.equal(a.rotations,26);
 assert.equal(M.treeExperiment('sorted','plain',255).height,255);assert.equal(M.treeExperiment('sorted','avl',255).height,8);
 for(const n of [7,63,255])for(const o of ['random','sorted']){const t=M.treeExperiment(o,'avl',n);assert.equal(t.n,n);assert.ok(t.height<=1.44*Math.log2(n+2));}
});
test('ch5: hashing — load stays under the limit with resizing, amortized insert is constant, no resizing gives long chains',()=>{
 const a=M.hashSim(500,8,.75,true);assert.equal(a.m,1024);close(a.avgProbe,1.274,1e-3);close(a.amortized,2.524,1e-3);
 const b=M.hashSim(2000,8,.75,false);close(b.avgProbe,126.665,1e-3);assert.equal(b.maxChain,289);
 const c=M.hashSim(500,8,3,true);assert.equal(c.m,256);close(c.avgProbe,1.962,1e-3);
 for(const n of [10,100,1000,2000]){const r=M.hashSim(n);assert.ok(r.load<=.75);assert.ok(r.amortized<3);assert.ok(r.copies<2*n);assert.equal(r.lens.reduce((s,x)=>s+x,0),n);}
 assert.throws(()=>M.hashSim(0),RangeError);
});
test('ch6: top-k — all three methods agree; comparison counts at n=2000',()=>{
 const items=M.borrowCounts(2000),r=m=>M.topK(items,10,m);
 assert.deepEqual([r('sort').comparisons,r('heap').comparisons,r('scan').comparisons],[19055,2235,19945]);
 for(const k of [1,10,50])assert.deepEqual(M.topK(items,k,'heap').top.map(x=>x.id),M.topK(items,k,'sort').top.map(x=>x.id));
 assert.equal(M.topK(items,1,'heap').comparisons,1999);assert.equal(M.topK(items,1,'scan').comparisons,1999);
 assert.equal(M.topK(items,50,'scan').comparisons,98725);assert.equal(M.topK(items,50,'heap').comparisons,3486);
 assert.equal(M.topK(items.slice(0,3),10,'heap').top.length,3);assert.throws(()=>M.topK(items,0,'heap'),RangeError);
});
test('ch7: BFS and DFS orders from 본관, BFS levels from 호수, both check every road twice',()=>{
 const name=v=>M.BRANCHES[v][0];
 assert.equal(M.traverse(0,'bfs').order.map(name).join(' '),'본관 강변 시장 학교 공원 역앞 언덕 호수');
 assert.equal(M.traverse(0,'dfs').order.map(name).join(' '),'본관 강변 시장 학교 언덕 호수 역앞 공원');
 /* 표준 DFS(꺼낼 때 방문 표시)와 4곳 방문 뒤 기다리는 분관(꺼낼 순서) */
 assert.deepEqual(['bfs','dfs'].map(k=>M.traverse(0,k).waiting[3].map(name).join(' ')),['공원 역앞 언덕','언덕 역앞 공원']);
 assert.deepEqual(['bfs','dfs'].map(k=>name(M.traverse(0,k).order[4])),['공원','언덕']);
 for(let s=0;s<8;s++){const r=M.traverse(s,'dfs');assert.equal(new Set(r.order).size,8);for(const v of r.order.slice(1))assert.ok(M.neighbors(r.parent[v]).some(e=>e.to===v));}
 const lv=M.traverse(7,'bfs').level;assert.deepEqual([5,6,3,2,4,1,0].map(v=>lv[v]),[1,1,2,2,2,3,3]);
 for(const k of ['bfs','dfs'])for(let s=0;s<8;s++){const r=M.traverse(s,k);assert.equal(r.order.length,8);assert.equal(r.edges,2*M.ROADS.length);}
 assert.equal(M.pathTo(M.traverse(0,'dfs').parent,7).length-1,5);assert.equal(M.pathMinutes(M.pathTo(M.traverse(0,'dfs').parent,7)),30);assert.equal(M.pathTo(M.traverse(0,'bfs').parent,7).length-1,3);
 assert.throws(()=>M.traverse(9,'bfs'),RangeError);
});
test('ch8: Dijkstra 본관→호수 26 min, BFS path 27, greedy 31; 본관→학교 14 vs greedy 43; Dijkstra is never beaten',()=>{
 const d=M.dijkstra(0,7);assert.equal(d.minutes,26);assert.deepEqual(d.path,[0,1,3,5,7]);assert.equal(d.settled.length,8);assert.equal(d.relax,22);
 assert.equal(M.pathMinutes(M.pathTo(M.traverse(0,'bfs').parent,7)),27);assert.equal(M.greedyRoute(0,7).minutes,31);
 assert.equal(M.dijkstra(0,3).minutes,14);assert.equal(M.greedyRoute(0,3).minutes,43);
 for(let s=0;s<8;s++)for(let g=0;g<8;g++){const best=M.dijkstra(s,g).minutes,gr=M.greedyRoute(s,g),bfs=M.pathMinutes(M.pathTo(M.traverse(s,'bfs').parent,g));
  assert.equal(M.pathMinutes(M.dijkstra(s,g).path),best);if(gr.reached)assert.ok(gr.minutes>=best);assert.ok(bfs>=best);assert.equal(best,M.dijkstra(g,s).minutes);}
});
test('ch9: edit distance — hand values, symmetry, bounds and cell counts',()=>{
 assert.equal(M.editDistance('별을 새는 고양이','별을 세는 고양이').distance,1);
 const r=M.editDistance('바다로 가는 기차','바다로 간 기차');assert.equal(r.distance,2);assert.deepEqual(r.ops,['‘가’ 지우기','‘는’→‘간’ 바꾸기']);
 assert.equal(M.editDistance('','abc').distance,3);assert.equal(M.editDistance('kitten','sitting').distance,3);assert.equal(M.editDistance('같다','같다').distance,0);
 for(const [a,b] of [['고양이','고향이'],['abc','yabd'],['기차역','역']]){const x=M.editDistance(a,b).distance;assert.equal(x,M.editDistance(b,a).distance);assert.ok(x>=Math.abs([...a].length-[...b].length)&&x<=Math.max([...a].length,[...b].length));}
 assert.equal(M.closestTitles('별을 새는 고양이').cells,1404);assert.equal(M.closestTitles('고양이 탐정').rows[0].distance,4);assert.equal(M.closestTitles('고양이 탐정').cells,936);
});
test('ch10: inverted index finds the same titles as scanning with far fewer steps on rare words',()=>{
 const t1=M.makeTitles(1e4),p1=M.buildIndex(t1),w=s=>M.WORDS.indexOf(s);
 const s1=M.scanSearch(t1,[w('등대')]),i1=M.indexSearch(p1,[w('등대')]);assert.equal(s1.checks,10000);assert.equal(i1.steps,551);assert.deepEqual(i1.hits,s1.hits);assert.equal(i1.hits.length,550);
 assert.equal(M.indexSearch(p1,[w('고양이')]).steps,5733);
 const t2=M.makeTitles(1e5),p2=M.buildIndex(t2),q=[w('등대'),w('탐정')],s2=M.scanSearch(t2,q),i2=M.indexSearch(p2,q);
 assert.equal(s2.checks,105482);assert.equal(i2.steps,9156);assert.deepEqual(i2.hits,s2.hits);assert.equal(i2.hits.length,132);assert.ok(i2.steps<=p2[q[0]].length+p2[q[1]].length+q.length);
});
test('ch10: grid ANN trades distance computations for recall; one cell with radius 0 equals exact search',()=>{
 const pts=M.makePoints(2000),b=(c,r)=>M.annBenchmark(pts,c,r);
 let x=b(8,0);close(x.avgDistances,31,1);close(x.recall,.83,.01);x=b(32,0);close(x.avgDistances,2,1);close(x.recall,.42,.01);x=b(16,1);close(x.avgDistances,74,1);assert.equal(x.recall,1);
 const one=b(1,0);assert.equal(one.recall,1);assert.equal(one.avgDistances,2000);assert.throws(()=>M.gridNN(pts,[.5,.5],0),RangeError);
});
test('ledger and ch11 design: scale rows and daily totals for the all-scan and best designs',()=>{
 const r=M.ledgerRow('search');assert.deepEqual([r.small,r.large],[14,20]);assert.equal(M.ledgerRow('steps').ratio,100);close(M.ledgerRow('hash').ratio,1);
 const scan={call:'scan',word:'scan',typo:'all',top:'sort',route:'bfs'},best=Object.fromEntries(M.DESIGN.map(q=>[q.id,q.fix]));
 close(M.designCost(scan,1e6).total,3.1997e10,1e7);close(M.designCost(scan,1e4).seconds,3.17,.01);close(M.designCost({...scan,typo:'filter'},1e6).total,1.2097e10,1e7);
 close(M.designCost(best,1e6).total,1.5222e8,1e5);assert.ok(M.designCost(best,1e6).rows.every(x=>x.best));
 const rows=M.designCost(best,1e6).rows,daily=id=>rows.find(x=>x.id===id).daily;close(daily('top'),5e7,1);close(daily('typo'),1.002e8,1);assert.ok(rows.every(x=>x.daily<=daily('typo')));
 /* 힙 장부 줄은 실측 꼴 ≈ n: 실제 힙 비교 횟수가 n과 n(1+2·log₂10) 사이이고 n에 가깝다 */
 for(const n of [1e4,1e5]){const c=M.topK(M.borrowCounts(n),10,'heap').comparisons;assert.ok(c>=n-1&&c<=1.05*n,String(c));assert.equal(M.ledgerRow('heap',n,n).small,n);}
 assert.equal(M.topK(M.borrowCounts(1e4),10,'heap').comparisons,10297);
 for(const q of M.DESIGN)assert.ok(q.options[q.fix][1](1e6)<=Object.values(q.options)[0][1](1e6)||q.id==='route');
});
test('choiceOrder puts the answer on the target slot and keeps each index once',()=>{for(let a=0;a<3;a++)for(let t=0;t<3;t++){const o=M.choiceOrder(3,a,t);assert.equal(o[t],a);assert.deepEqual([...o].sort(),[0,1,2]);}});
