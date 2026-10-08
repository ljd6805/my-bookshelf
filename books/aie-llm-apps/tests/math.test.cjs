/* 계산 함수의 대표값·경계값·불변 조건. 숫자는 책 본문과 lab-guides.js의 읽을거리에 쓰인 값이다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,eps=1e-6,msg)=>assert.ok(Math.abs(a-b)<=eps,`${msg||''} ${a} != ${b}`);

test('sum과 softmax: 합이 1, 온도 0은 탐욕 선택',()=>{
 assert.equal(M.sum([1,2,3]),6);assert.equal(M.sum([]),0);
 const z=M.CANDIDATES.map(c=>c[1]);for(const T of [0.1,0.7,1,2])near(M.sum(M.softmax(z,T)),1,1e-12);
 assert.deepEqual(M.softmax(z,0),[1,0,0,0,0]);
 const lo=M.softmax(z,0.5),hi=M.softmax(z,2);assert.ok(lo[0]>hi[0],'온도를 올리면 1등 확률이 준다');
});
test('sampling: 대표값, top-p 경계, 엔트로피 불변',()=>{
 const a=M.sampling(1.5,1);near(a.final[0],0.455,0.001);near(a.final[4],0.054,0.001);assert.equal(a.keptCount,5);
 const b=M.sampling(1.5,0.5);near(b.final[0],0.676,0.001);near(b.final[1],0.324,0.001);assert.equal(b.keptCount,2);
 assert.equal(M.sampling(0,1).keptCount,1);assert.equal(M.sampling(0.7,1).entropy>M.sampling(0.3,1).entropy,true);
 for(const T of [0,0.7,2])for(const p of [1,0.9,0.5])near(M.sum(M.sampling(T,p).final),1,1e-9);
});
test('fewshot: 토큰 선형 증가, k=0 경계',()=>{
 const r=M.fewshot(3,80);assert.equal(r.perQuery,590);assert.equal(r.daily,5900000);assert.equal(r.monthly,177000000);
 assert.equal(M.fewshot(0,200).ratio,1);assert.equal(M.fewshot(10,40).perQuery-M.fewshot(9,40).perQuery,40);
});
test('comb와 majority: 대표값, N=1 경계, p<0.5에서 역전',()=>{
 assert.equal(M.comb(5,2),10);assert.equal(M.comb(15,0),1);
 near(M.majority(0.7,1),0.7,1e-12);near(M.majority(0.7,3),0.784,1e-9);near(M.majority(0.7,5),0.83692,1e-5);near(M.majority(0.7,15),0.950,0.001);
 near(M.majority(0.4,15),0.213,0.001);near(M.majority(0.5,9),0.5,1e-12);near(M.majority(0.7,2),0.7,1e-12);
 for(const p of [0.6,0.8])assert.ok(M.majority(p,7)>M.majority(p,5));
});
test('jsonMask: 단계별 허용 집합과 막힌 수의 합',()=>{
 assert.deepEqual(M.jsonMask(0).allowed,['{']);assert.deepEqual(M.jsonMask(1).allowed,['"order_id"','"qty"','"refund"']);
 assert.deepEqual(M.jsonMask(3).allowed,['"A-1042"','"네, 확인했습니다"']);assert.deepEqual(M.jsonMask(7).allowed,['2']);
 assert.deepEqual(M.jsonMask(11).allowed,['true','false']);assert.deepEqual(M.jsonMask(12).allowed,['}']);assert.deepEqual(M.jsonMask(13).allowed,[]);
 assert.deepEqual(M.jsonMask(99).allowed,[]);
 for(let s=0;s<13;s++){const r=M.jsonMask(s);assert.ok(r.allowed.includes(r.next),`단계 ${s}의 목표 토큰은 허용되어야 한다`);assert.equal(r.allowed.length+r.blocked,M.VOCAB.length);}
 assert.deepEqual(M.allowedNext([]),{state:'시작',allowed:['{']});
});
test('contextBudget: 기본값, 넘침 예시, 압축은 늘리지 않는다',()=>{
 assert.equal(M.contextBudget({}).used,20200);
 const o=M.contextBudget({window:32000,tools:60,turns:80,chunks:20});assert.equal(o.used,37700);assert.equal(o.free,-5700);assert.equal(o.over,true);
 const b=M.contextBudget({window:32000,tools:60,turns:80,chunks:20,strategy:'both'});assert.equal(b.used,15650);near(b.share,0.489,0.001);
 const z=M.contextBudget({tools:0,turns:0,chunks:0,strategy:'summary'});assert.equal(z.used,4700);
 for(const s of ['prune','summary','both'])assert.ok(M.contextBudget({strategy:s}).used<=M.contextBudget({}).used);
 assert.equal(M.sum(o.parts.map(p=>p[1])),o.used);
});
test('vectorStore와 rrf',()=>{
 near(M.vectorStore(1536,'float32',10).totalGB,61.44,1e-9);near(M.vectorStore(256,'float32',10).totalGB,10.24,1e-9);near(M.vectorStore(1536,'binary',10).totalGB,1.92,1e-9);
 assert.equal(M.vectorStore(1536,'binary',1).ratio,32);assert.equal(M.vectorStore(1024,'float32',2).macs,2048e6);
 near(M.rrf([1,1]),2/61,1e-12);assert.ok(M.rrf([1,3])>M.rrf([2,3]));assert.equal(M.rrf([]),0);
});
test('LoRA: 기본 파라미터, 층 하나, 방식별 메모리 순서',()=>{
 assert.equal(M.baseParams(),6738415616);const one=M.loraMatrix(4096,4096,16);assert.equal(one.lora,131072);near(one.share,0.0078125,1e-12);
 const l=M.lora('qv',16,'lora'),q=M.lora('qv',16,'qlora'),f=M.lora('qv',16,'full');
 assert.equal(l.trainable,8388608);near(l.share*100,0.124,0.001);near(l.memGB,13.54,0.01);near(q.memGB,3.44,0.01);near(f.memGB,53.91,0.01);
 assert.equal(f.trainable,f.base);assert.ok(f.memGB>l.memGB&&l.memGB>q.memGB);
 assert.equal(M.lora('q',8,'lora').trainable*2,M.lora('q',16,'lora').trainable);assert.ok(M.lora('all',16,'lora').trainable>M.lora('qkvo',16,'lora').trainable);
});
test('toolLatency와 integrations',()=>{
 const r=M.toolLatency(5,500,'sequential');assert.equal(r.seq,7300);assert.equal(r.par,2100);assert.equal(r.trips,6);
 const one=M.toolLatency(1,500,'parallel');assert.equal(one.seq,one.par);assert.equal(one.saved,0);
 for(let n=1;n<=8;n++)assert.ok(M.toolLatency(n,300,'x').par<=M.toolLatency(n,300,'x').seq);
 assert.deepEqual(M.integrations(5,20),{custom:100,protocol:25});
});
test('mcpCheck: 오류 코드와 전송 방식별 차이',()=>{
 assert.equal(M.mcpCheck('ok','stdio').ok,true);assert.equal(M.mcpCheck('ok','http').http,200);
 assert.equal(M.mcpCheck('call','http').result.resultType,'complete');assert.equal(M.mcpRequest('call').headers['Mcp-Name'],'lookup_order');
 assert.equal(M.mcpCheck('nometa','stdio').code,-32602);assert.equal(M.mcpCheck('noversion','http').code,-32602);
 const old=M.mcpCheck('oldversion','http');assert.equal(old.code,-32022);assert.deepEqual(old.data.supported,[M.MCP_VERSION]);assert.equal(old.http,400);assert.equal(M.mcpCheck('oldversion','stdio').http,null);
 const h=M.mcpCheck('header','http');assert.equal(h.code,-32020);assert.equal(h.http,400);assert.equal(M.mcpCheck('header','stdio').ok,true);
 assert.equal(M.mcpCheck('nometa','stdio').http,null);
});
test('wilson과 kappa',()=>{
 const widths=[50,100,200,500,1000].map(n=>M.wilson(Math.round(n*0.9),n).width*100);
 [17.0,11.9,8.4,5.3,3.7].forEach((w,i)=>near(widths[i],w,0.05));for(let i=1;i<widths.length;i++)assert.ok(widths[i]<widths[i-1]);
 assert.deepEqual(M.wilson(0,0),{lo:0,hi:0,p:0,width:0});const z=M.wilson(0,20);assert.equal(z.lo,0);assert.ok(z.hi>0);assert.ok(M.wilson(20,20).hi<=1);
 const w=M.wilson(45,50);assert.ok(w.lo<=w.p&&w.p<=w.hi);
 near(M.kappa(200,0.8,1,0).kappa,0,1e-12);near(M.kappa(200,0.8,0.9,0.7).kappa,0.578,0.001);near(M.kappa(200,0.5,0.9,0.9).kappa,0.8,1e-9);
 const k=M.kappa(200,0.8,0.9,0.7);near(k.a+k.b+k.c+k.d,200,1e-9);near(M.kappa(200,0.7,1,1).kappa,1,1e-12);
});
test('semCache와 promptCache',()=>{
 const s=M.semCache(0.96);assert.equal(s.hits,3);assert.equal(s.wrong,0);assert.equal(s.missed,4);
 assert.equal(M.semCache(0.85).hits,12);assert.equal(M.semCache(0.99).hits,0);
 for(const t of [0.85,0.9,0.92,0.95,0.99]){const r=M.semCache(t);assert.equal(r.good+r.missed,M.SEM_PAIRS.filter(p=>p[3]).length);assert.ok(M.semCache(t).hits>=M.semCache(t+0.01).hits);}
 near(M.promptCache(1,'a5').mult,0.675,1e-12);near(M.promptCache(10,'a5').mult,0.2045,1e-4);assert.equal(M.promptCache(10,'a5','timestamp').mult,1.25);
 assert.equal(M.promptCache(0,'a5').mult,1.25);assert.equal(M.promptCache(0,'a1h').mult,2);near(M.promptCache(1,'a1h').mult,1.05,1e-12);assert.equal(M.promptCache(10,'a5','stable',800).mult,1);assert.equal(M.promptCache(0,'auto').mult,1);
 for(const k of Object.keys(M.PROVIDERS))assert.ok(M.promptCache(20,k).mult<M.promptCache(2,k).mult);
});
test('guard와 layeredMiss: 기저율이 정밀도를 좌우',()=>{
 const g=M.guard(0.5,0.01);near(g.tp,80,1e-9);near(g.fp,2227.5,1e-6);near(g.precision,0.0347,0.0005);
 const h=M.guard(0.9,0.01);near(h.precision,0.092,0.001);near(h.fn/100,0.75,1e-9);
 assert.equal(M.guard(0.1,0.01).tpr,1);assert.ok(M.guard(0.5,0.1).precision>g.precision);near(g.tp+g.fn,100,1e-9);
 near(M.layeredMiss([0.1,0.2,0.5]),0.01,1e-12);assert.equal(M.layeredMiss([]),1);
});
test('graphRun: 멈춤 위치와 리듀서',()=>{
 const b=M.graphRun('add','before');assert.equal(b.length,8);assert.equal(b[4].node,'review');assert.equal(b[4].paused,true);assert.equal(b[4].refunded,false);assert.equal(b[7].node,'END');assert.equal(b[7].messages,6);
 const a=M.graphRun('add','after');assert.equal(a[5].node,'review');assert.equal(a[5].refunded,true);
 const n=M.graphRun('add','none');assert.equal(n.length,7);assert.ok(!n.some(s=>s.paused));
 assert.ok(M.graphRun('overwrite','before').slice(1).every(s=>s.messages===1));b.forEach((s,i)=>assert.equal(s.checkpoint,i));
});
test('monthlyCost: 표지·12장 대표값과 단조성',()=>{
 near(M.monthlyCost({hit:0}).total,11625,1e-6);near(M.monthlyCost({hit:0.08}).total,10695,1e-6);near(M.monthlyCost({hit:0.35}).total,7556.25,1e-6);
 near(M.monthlyCost({hit:0.08,mini:0.3}).total,7679,1);assert.equal(M.monthlyCost({hit:1}).total,0);
 const r=M.monthlyCost({hit:0.2,mini:0.4});near(r.strong+r.cheap,r.total,1e-9);assert.equal(r.requests,1500000);
 assert.ok(M.monthlyCost({hit:0.5}).total<M.monthlyCost({hit:0.4}).total);assert.ok(M.monthlyCost({mini:0.5}).total<M.monthlyCost({mini:0.2}).total);
});
