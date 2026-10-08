/* 계산 함수의 대표값·경계값·불변 조건 */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<=eps,`${a} ≉ ${b}`);

test('softmax: sums to one, shift-invariant, -Infinity gives exact zero',()=>{
 const p=M.softmax([2,1,0.1]);near(p.reduce((a,b)=>a+b,0),1);
 M.softmax([102,101,100.1]).forEach((x,i)=>near(x,p[i]));
 const m=M.softmax([1,-Infinity,0]);assert.equal(m[1],0);near(m[0]+m[2],1);
 near(M.entropy([0.25,0.25,0.25,0.25]),2);assert.equal(M.entropy([1,0]),0);
});
test('rng is deterministic and normal has unit variance',()=>{
 const a=M.rng(5),b=M.rng(5);for(let i=0;i<5;i++)assert.equal(a(),b());
 const r=M.rng(1);let s=0,q=0;const n=20000;for(let i=0;i<n;i++){const x=M.normal(r);s+=x;q+=x*x;}
 assert.ok(Math.abs(s/n)<0.03);assert.ok(Math.abs(q/n-1)<0.05);
});
test('depth: RNN steps grow as N, tree depth as log2 N, entries as N^2',()=>{
 assert.deepEqual([M.depth(1024).rnn,M.depth(1024).tree,M.depth(1024).entries],[1024,10,1048576]);
 assert.equal(M.depth(1).tree,1);assert.equal(M.depth(7).tree,3);near(M.depth(1024).scoreMB,2.097152);
});
test('attnRow: unscaled score std ≈ √d_k, scaled ≈ 1, saturation grows with d_k only without scaling',()=>{
 for(const d of [16,256]){const u=M.attnRow(d,false),s=M.attnRow(d,true);assert.ok(Math.abs(u.std/Math.sqrt(d)-1)<0.1,d);assert.ok(Math.abs(s.std-1)<0.1,d);}
 assert.ok(M.attnRow(512,false).maxW>0.95);assert.ok(M.attnRow(512,false).grad<0.1);
 assert.ok(Math.abs(M.attnRow(512,true).maxW-M.attnRow(16,true).maxW)<0.05);
 const e=M.attnRow(64,true).example.weights;near(e.reduce((a,b)=>a+b,0),1);assert.equal(e.length,7);
 assert.ok(M.attnRow(64,true).entropy<=Math.log2(7)+1e-12);
});
test('heads: projection params ignore head count, d_head and zones',()=>{
 assert.equal(M.heads(2048,16).dHead,128);assert.equal(M.heads(2048,1).proj,M.heads(2048,64).proj);
 assert.equal(M.heads(512,64).zone,'small');assert.equal(M.heads(4096,8).zone,'large');assert.equal(M.heads(1024,12).zone,'invalid');assert.equal(M.heads(768,12).zone,'ok');
 near(M.heads(512,8,2048).scoreMB,8*2048*2048*2/1e6);
});
test('rope: preserves length, depends only on relative position; sinusoid addition does not',()=>{
 const x=[1,2,3,4,5,6,7,8],y=M.rope(x,37),len=v=>Math.hypot(...v);near(len(y),len(x),1e-9);
 assert.deepEqual(M.rope(x,0),x);
 for(const s of [1,50,1000]){near(M.positionShift('rope',s).moved,M.positionShift('rope',0).base,1e-9);}
 assert.ok(Math.abs(M.positionShift('abs',100).moved-M.positionShift('abs',0).base)>0.1);
 near(M.positionShift('abs',0).moved,M.positionShift('abs',0).base);
 const pe=M.sinusoid(0,8);assert.deepEqual(pe,[0,1,0,1,0,1,0,1]);
});
test('blockParams: 12d² per layer plus tied embedding',()=>{
 const r=M.blockParams(2048,16);assert.equal(r.perLayer,12*2048*2048);assert.equal(r.total,12*2048*2048*16+32000*2048);
 assert.equal(r.ffn,2*r.attn);assert.ok(Math.abs(M.blockParams(4096,32).total/1e9-6.5735)<1e-3);
});
test('layerNorm is shift-invariant with zero mean and unit variance; rmsNorm has unit RMS but is not shift-invariant',()=>{
 const x=[2,-1,0.5,3],ln=M.layerNorm(x),ln2=M.layerNorm(x.map(v=>v+3));ln.forEach((v,i)=>near(v,ln2[i],1e-9));
 near(ln.reduce((a,b)=>a+b,0),0);near(ln.reduce((a,b)=>a+b*b,0)/4,1,1e-4);
 const r=M.rmsNorm(x);near(Math.sqrt(r.reduce((a,b)=>a+b*b,0)/4),1,1e-6);assert.ok(Math.abs(M.rmsNorm(x.map(v=>v+3))[1]-r[1])>0.1);
});
test('mlm: parts add up and approach 15% · 80/10/10 for many tokens',()=>{
 for(const n of [20,1000,10000]){const r=M.mlm(n);assert.equal(r.mask+r.rand+r.keep,r.sel);assert.ok(r.sel<=n);}
 const r=M.mlm(10000);assert.ok(Math.abs(r.sel/10000-0.15)<0.01);assert.ok(Math.abs(r.mask/r.sel-0.8)<0.03);
 assert.equal(M.mlm(10000).expect.mask,1200);assert.equal(M.mlm(100).marks.length,7);
});
test('causalMatrix: rows are distributions; masked is lower-triangular; stage 1 is a prefix average',()=>{
 for(const st of [1,2,3]){const W=M.causalMatrix(st,true);W.forEach((row,i)=>{near(row.reduce((a,b)=>a+b,0),1);row.forEach((v,j)=>{if(j>i)assert.equal(v,0);});});}
 M.causalMatrix(1,true).forEach((row,i)=>row.forEach((v,j)=>{if(j<=i)near(v,1/(i+1));}));
 const open=M.causalMatrix(3,false);assert.ok(open[0].slice(1).reduce((a,b)=>a+b,0)>0);
 M.causalMatrix(1,false).flat().forEach(v=>near(v,1/7));
});
test('maskGrid: encoder full, decoder causal up to step, cross rows open up to step',()=>{
 const sum=g=>g.flat().reduce((a,b)=>a+b,0);
 assert.equal(sum(M.maskGrid('encoder',1)),49);assert.equal(sum(M.maskGrid('decoder',3)),6);assert.equal(sum(M.maskGrid('decoder',5)),15);
 assert.equal(sum(M.maskGrid('cross',3)),21);assert.equal(sum(M.maskGrid('cross',5)),35);assert.equal(M.maskGrid('decoder',2)[0][1],0);
});
test('patches and whisper frames',()=>{
 assert.equal(M.patches(224,16).tokens,197);assert.equal(M.patches(224,16).dim,768);assert.equal(M.patches(224,14).tokens,257);
 assert.equal(M.patches(224,8).tokens,785);assert.equal(M.patches(384,14).crop,6);assert.equal(M.patches(384,14).N,729);
 const w=M.whisperFrames(1);assert.equal(w.frames,100);assert.equal(M.whisperFrames(30).frames,3000);assert.equal(M.whisperFrames(30).padShare,0);assert.equal(w.tokens,1500);
});
test('moeRoute: counts total T·k, balancing reduces imbalance, active ratio k/E',()=>{
 for(const k of [1,2,4]){const r=M.moeRoute(k,0);assert.equal(r.counts.reduce((a,b)=>a+b,0),r.T*k);near(r.active,k/8);}
 const a=M.moeRoute(2,0),b=M.moeRoute(2,40);assert.ok(a.imbalance>2.5);assert.ok(b.imbalance<1.3);assert.ok(b.imbalance<a.imbalance);
 assert.deepEqual(M.moeRoute(2,0).counts,M.moeRoute(2,0).counts);assert.ok(M.moeRoute(1,0).topGate===1);
});
test('tiledAttention: every tile size matches one-shot softmax',()=>{
 for(const t of [1,2,3,4,8,16]){const r=M.tiledAttention(t);assert.ok(r.err<1e-12,`tile ${t}`);assert.equal(r.steps.length,Math.ceil(16/t));}
 const s=M.tiledAttention(1).steps;for(let i=1;i<s.length;i++)assert.ok(s[i].max>=s[i-1].max);
 near(M.scoreMemory(8192).fullMB,134.217728);near(M.scoreMemory(8192).tileKB,32.768);
});
test('kvCache: GQA is MHA/8, MQA is MHA/64, SWA caps growth, diff doubles GQA',()=>{
 const N=32768,g=M.kvCache('gqa',N).gb,m=M.kvCache('mha',N).gb;near(m/g,8);near(m/M.kvCache('mqa',N).gb,64);near(M.kvCache('diff',N).gb/g,2);
 near(g,4096*80*N/1e9);assert.ok(M.kvCache('swa',131072).gb<M.kvCache('gqa',131072).gb/5);
 near(M.kvCache('swa',1024).gb,M.kvCache('gqa',1024).gb);
});
test('Chinchilla: optimum beats fixed ratios at the same compute and ratio grows with compute',()=>{
 for(const e of [20,23,25]){const C=10**e,o=M.chOptimal(C);for(const r of [1.7,20,1875])assert.ok(M.chAtRatio(C,r).L>=o.L-1e-6);near(6*o.N*o.D/C,1,1e-9);}
 assert.ok(M.chOptimal(1e25).ratio>M.chOptimal(1e20).ratio);
 const p=M.chAtRatio(1e23,20);near(p.D/p.N,20);near(6*p.N*p.D,1e23,1e10);
 near(M.chLoss(1e30,1e30),M.CH.E,1e-3);
});
test('spec: expected tokens formula, limits, and best draft length',()=>{
 near(M.spec(0.75,5).tokens,(1-0.75**6)/0.25);near(M.spec(1,4).tokens,5);near(M.spec(0,4).tokens,1);
 near(M.spec(0.75,5).speedup,M.spec(0.75,5).tokens/1.5);assert.ok(M.spec(0.5,8).speedup<M.specBest(0.5).speedup);
 assert.ok(M.specBest(0.9).n>M.specBest(0.5).n);
 near(M.acceptRate([0.5,0.5],[0.5,0.5]),1);near(M.acceptRate([1,0],[0,1]),0);
 const res=M.residual([0.6,0.3,0.1],[0.2,0.5,0.3]);near(res[0],1);assert.equal(res[1],0);
});
test('redesign: baseline fails long context, GQA and SWA pass, spec passes speed, MoE quality is undecidable',()=>{
 assert.equal(M.redesign('long','none').pass,false);assert.equal(M.redesign('long','gqa').pass,true);assert.equal(M.redesign('long','swa').pass,true);
 assert.equal(M.redesign('fast','none').pass,false);assert.equal(M.redesign('fast','spec').pass,true);near(M.redesign('fast','none').speed,1);
 assert.equal(M.redesign('quality','moe').pass,null);assert.equal(M.redesign('quality','tokens').pass,true);assert.equal(M.redesign('quality','gqa').pass,false);
 assert.ok(M.redesign('long','moe').total>M.redesign('long','none').total);near(M.design('none').active,M.design('none').total);
});
