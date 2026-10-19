/* 계산 모델 검증: 공개 설정 파일 값으로 손으로 쓴 식과 대조하고, 대표값·경계값·불변 조건을 확인한다.
   안내 상자(lab-guides.js)와 본문에 적은 숫자도 여기서 실제 계산과 맞춘다. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const M=require(path.resolve(__dirname,'../js/math.js'));
const near=(a,b,tol=1e-9,msg)=>assert.ok(Math.abs(a-b)<=tol,`${msg||''} ${a} vs ${b}`);
const L7=M.MODELS.llama7,L13=M.MODELS.llama13,MI=M.MODELS.mistral7,ALL=M.MODULES,GB=1e9;
const plan=(model,method,o={})=>M.memoryPlan({model,method,activationGB:4,...o});

test('parameter counts match the public configs (hand formula)',()=>{
 /* 층마다 어텐션 4개 + MLP 3개 + 정규화 2개, 그리고 임베딩·출력층·마지막 정규화 */
 const hand=m=>{const h=m.hidden,kv=h/m.heads*m.kv;return m.layers*(2*h*h+2*h*kv+3*h*m.inter+2*h)+2*m.vocab*h+h;};
 for(const m of [L7,L13,MI])assert.equal(M.countParams(m).total,hand(m),m.name);
 assert.equal(M.countParams(L7).total,6738415616);assert.equal(M.countParams(MI).total,7241732096);assert.equal(M.countParams(L13).total,13015864320);
});
test('LoRA trainable parameters: layers × Σ r·(in + out)',()=>{
 assert.equal(M.loraParams(L7,8,['q','v']),32*2*8*(4096+4096));assert.equal(M.loraParams(L7,8,['q','v']),4194304);
 assert.equal(M.loraParams(L7,8,ALL),19988480);assert.equal(M.loraParams(L7,16,['q','k','v','o']),16777216);assert.equal(M.loraParams(L7,16,ALL),39976960);
 assert.equal(M.loraParams(MI,8,['q','v']),32*8*((4096+4096)+(4096+1024)));assert.equal(M.loraParams(MI,8,['q','v']),3407872);
 assert.equal(M.loraParams(L7,8,[]),0);
 for(const r of [1,2,4,8,16,32])assert.equal(M.loraParams(L7,r,ALL),r*M.loraParams(L7,1,ALL),'linear in r');
});
test('full fine-tuning memory: 16 bytes per parameter plus assumed activations',()=>{
 const N7=M.countParams(L7).total;assert.equal(M.TRAIN_BYTES,16);
 near(plan(L7,'full').total,N7*16+4*GB,1);near(plan(L7,'full').total/GB,111.81,0.005);near(N7*2/GB,13.48,0.005);
 near(plan(L13,'full').total/GB,212.25,0.005);near(plan(MI,'full').total/GB,119.87,0.005);
 assert.equal(plan(L7,'full').trainable,N7);
});
test('LoRA and QLoRA memory: representative values used in the text',()=>{
 near(plan(L7,'lora',{r:16,targets:ALL}).total/GB,18.12,0.005);
 const q=plan(L13,'qlora',{r:16,targets:ALL,doubleQuant:true});near(q.total/GB,12.20,0.005);assert.equal(q.trainable,62586880);
 near(q.parts.base/GB,7.00,0.005);near(q.parts.consts/GB,0.20,0.005);near(q.parts.adapter/GB,1.00,0.005);
 near(plan(L13,'lora',{r:16,targets:ALL}).total/GB,31.03,0.005);near(plan(L13,'qlora',{r:16,targets:ALL,doubleQuant:false}).total/GB,12.79,0.005);
 near(plan(L7,'qlora',{r:16,targets:['q','v']}).total/GB,8.00,0.005);
 /* 양자화 상수: 블록 64개마다 fp32 상수(0.5비트), 이중 양자화면 8비트 상수 + 256블록마다 fp32 */
 near(M.constBits(false),32/64,1e-12);near(M.constBits(true),8/64+32/(64*256),1e-12);near(M.constBits(true),0.127,5e-4);
 assert.ok(plan(L13,'qlora',{r:16,targets:ALL}).total<24*GB&&plan(L13,'lora',{r:16,targets:ALL}).total>24*GB,'final scenario split');
});
test('memory is monotone in r and only the adapter part changes',()=>{
 let prev=0;for(const r of [1,2,4,8,16,32,64]){const p=plan(L13,'qlora',{r,targets:ALL});assert.ok(p.total>prev);prev=p.total;near(p.parts.base,plan(L13,'qlora',{r:1,targets:ALL}).parts.base,1);}
});
test('SVD: reconstruction, ordering and Eckart–Young truncation error',()=>{
 const D=M.targetDelta(),d=M.svd(D);
 for(let i=1;i<d.s.length;i++)assert.ok(d.s[i-1]>=d.s[i]-1e-12);
 near(M.lowRank(D,16,d).rel,0,1e-9,'full rank rebuilds');near(M.lowRank(D,0,d).rel,1,1e-12);
 const tail=k=>Math.sqrt(d.s.slice(k).reduce((a,x)=>a+x*x,0))/Math.sqrt(d.s.reduce((a,x)=>a+x*x,0));
 for(const k of [1,3,4,8])near(M.lowRank(D,k,d).rel,tail(k),1e-9,'k='+k);
 near(d.s[0],2.969,5e-4);near(d.s[1],1.988,5e-4);near(d.s[2],1.214,5e-4);
 near(M.lowRank(D,3,d).rel,0.1283,5e-4);near(M.lowRank(D,1,d).rel,0.625,5e-4);near(M.lowRank(D,8,d).rel,0.0371,5e-4);near(M.lowRank(D,3,d).energy,0.984,5e-4);
 assert.equal(M.lowRank(D,3,d).store,96);
 const R=M.randn(16,16,M.rng(9),0.5);near(M.lowRank(R,3,M.svd(R)).rel,0.708,5e-4);
});
test('LoRA training: B = 0 starts at the base model and approaches the SVD optimum, never below it',()=>{
 const D=M.targetDelta(),d=M.svd(D);
 for(const r of [1,2,4,8]){const t=M.trainLora({target:D,r,steps:300});assert.equal(t.start,0);assert.ok(t.err>=M.lowRank(D,r,d).rel-1e-9,'r='+r);}
 near(M.trainLora({target:D,r:4,steps:300}).err,0.1175,5e-4);near(M.trainLora({target:D,r:8,steps:300}).err,0.100,5e-4);
 const rb=M.trainLora({target:D,r:4,steps:300,initB:'random'});near(rb.start,8.776,5e-4);near(rb.err,0.146,5e-4);
 const a=M.trainLora({target:D,r:4,steps:300}),b=M.trainLora({target:D,r:4,steps:300});assert.equal(a.err,b.err,'fixed seed');
});
test('scaling: first step ∝ γ²·r, so α/r shrinks with r and α/√r does not',()=>{
 const D=M.targetDelta(),fr=[1,2,4,8,16].map(r=>M.firstStep({target:D,r,mode:'r'})),fs=[1,2,4,8,16].map(r=>M.firstStep({target:D,r,mode:'sqrt'}));
 for(let i=1;i<5;i++)assert.ok(fr[i]<fr[i-1]);near(fr[0],0.832,5e-4);near(fr[4],0.032,5e-4);near(fs[4],0.515,5e-4);
 const e=(r,mode,steps)=>M.trainLora({target:D,r,steps,alpha:8,mode}).err;
 near(e(4,'r',100),0.125,5e-4);near(e(16,'r',100),0.312,5e-4);near(e(16,'sqrt',100),0.066,5e-4);near(e(16,'r',400),0.074,5e-4);near(e(16,'sqrt',400),0.017,5e-4);
 for(const alpha of [2,16])for(const mode of ['r','sqrt'])for(const r of [1,2,4,8,16])assert.ok(Number.isFinite(M.trainLora({target:D,r,steps:400,alpha,mode}).err),`${alpha} ${mode} ${r}`);
});
test('intrinsic dimension: nested subspaces give monotone curves and d90 values',()=>{
 for(const kind of ['focused','spread']){const c=M.intrinsicCurve(kind);for(let i=1;i<c.pts.length;i++)assert.ok(c.pts[i][1]>=c.pts[i-1][1]-1e-9,kind);near(c.pts.at(-1)[1],1,1e-6);}
 assert.equal(M.intrinsicCurve('focused').d90,4);assert.equal(M.intrinsicCurve('spread').d90,40);
 const p=M.subspaceProblem('focused');near(M.subspaceFit(p,0,6).perf,0,1e-12);near(M.subspaceFit(p,4,6).perf,0.990,5e-4);
});
test('merging: fp32 keeps outputs, fp16 rounding is small and grows with repeated swaps',()=>{
 const a=M.mergeDemo({precision:'fp32',reps:1}),b=M.mergeDemo({precision:'fp16',reps:1}),c=M.mergeDemo({precision:'fp16',reps:50});
 assert.ok(a.outDiff<1e-12);assert.ok(b.outDiff>1e-6&&b.outDiff<1e-3);near(b.outDiff,4.6e-5,1e-6);near(c.drift,1.31e-3,1e-5);assert.ok(c.drift>b.drift*10);
 assert.equal(M.extraMults(4096,4096,8),8*(4096+4096));assert.equal(M.fp16(1),1);assert.equal(M.fp16(1+2**-12),1);
});
test('variants: counts follow their definitions',()=>{
 const v=Object.fromEntries(M.variants(L7,{r:8,targets:['q','v'],bottleneck:64,prefix:10}).map(x=>[x.id,x]));
 assert.equal(v.lora.params,4194304);assert.equal(v.dora.params,4194304+32*2*4096);assert.equal(v.prompt.params,10*4096);assert.equal(v.prefix.params,32*2*10*4096);
 assert.equal(v.adapter.params,33820672);assert.equal(v.adapter.extra,33554432);
 assert.ok(M.variants(L7,{r:8,targets:['q','v'],bottleneck:64,prefix:100}).find(x=>x.id==='prefix').params>v.lora.params);
});
test('forgetting toy: rank trades learning for forgetting; no overlap means no forgetting',()=>{
 const pts=[1,2,3,4,'full'].map(k=>M.forgetRun({rank:k,overlap:3}));
 for(let i=1;i<pts.length;i++){assert.ok(pts[i].learned>pts[i-1].learned);assert.ok(pts[i].forgot>pts[i-1].forgot);}
 near(pts[0].learned,0.402,5e-4);near(pts[0].forgot,0.271,5e-4);near(pts[1].learned,0.641,5e-4);near(pts[1].forgot,0.695,5e-4);near(pts[4].learned,1,1e-9);near(pts[4].forgot,1.332,5e-4);
 for(const k of [1,2,'full'])near(M.forgetRun({rank:k,overlap:0}).forgot,0,1e-9);
});
test('serving and federated communication',()=>{
 const s=M.serving({model:L7,r:8,targets:['q','v'],users:100,active:8,gbps:10});
 assert.equal(s.adapterBytes,4194304*2);near(s.fullCopies,100*M.countParams(L7).total*2,1);near(s.shared,s.baseBytes+100*s.adapterBytes,1);near(s.loadSec,8388608*8/10e9,1e-12);near(s.ratio,1607,0.5);
 near(s.shared/GB,14.32,0.005);near(M.serving({model:L7,r:8,targets:['q','v'],users:1000,active:8,gbps:10}).shared/GB,21.87,0.005);
 const f=M.fedComm({model:L7,method:'lora',r:8,targets:['q','v'],clients:100,rounds:50}),g=M.fedComm({model:L7,method:'full',r:8,targets:['q','v'],clients:100,rounds:50});
 assert.equal(f.total,50*100*2*8388608);near(f.total/GB,83.89,0.005);near(g.total/f.total,1607,1);near(M.fedComm({model:L7,method:'lora',r:1,targets:['q','v'],clients:100,rounds:50}).total/GB,10.49,0.005);
 near(M.averagingGap({clients:20,spread:0}).gap,0,1e-12);near(M.averagingGap({clients:20,spread:0.3}).gap,0.076,5e-4);near(M.averagingGap({clients:20,spread:1}).gap,0.570,5e-4);
});
test('choice order puts the answer at the target position and keeps every option',()=>{
 for(const n of [3,4])for(let a=0;a<n;a++)for(let t=0;t<3;t++){const o=M.choiceOrder(n,a,t);assert.equal(o.length,n);assert.equal(o[Math.min(t,n-1)],a);assert.equal(new Set(o).size,n);}
});
