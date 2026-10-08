/* A19Math의 대표값·경계값·불변 조건. 책과 따로 손으로 계산한 값과 대조한다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,tol=1e-3,msg)=>assert.ok(Math.abs(a-b)<=tol,`${msg||''} ${a} ≉ ${b}`);
const sum=a=>a.reduce((x,y)=>x+y,0);

test('정규분포 도구: Φ와 Φ⁻¹가 서로 역함수이고 알려진 값과 맞는다',()=>{
 near(M.Phi(0),0.5,1e-7);near(M.Phi(1.959964),0.975,1e-6);near(M.PhiInv(0.975),1.959964,1e-5);
 for(const p of [0.001,0.02,0.3,0.5,0.9,0.999])near(M.Phi(M.PhiInv(p)),p,1e-7,'round trip');
 assert.equal(M.PhiInv(0),-Infinity);assert.equal(M.PhiInv(1),Infinity);
});

test('KL 닫힌 해: 확률 합 1, β가 크면 SFT로, 작으면 최고 점수 답으로',()=>{
 for(const b of [0.05,0.1,0.3,1,3]){const r=M.klPolicy(b);near(sum(r.pi),1,1e-12);assert.ok(r.kl>=0);}
 const big=M.klPolicy(1000);M.ANSWERS.forEach((a,i)=>near(big.pi[i],a.p0,1e-3));
 const zero=M.klPolicy(0);assert.deepEqual(zero.pi,[0,1,0]);
 near(M.klPolicy(0.1).syc,0.9234,1e-4);near(M.klPolicy(0.3).util,-0.2406,1e-4);near(M.klPolicy(1).util,0.0531,1e-4);
 near(M.klPolicy(0.3,0.5).syc,0.2350,1e-4);
 // 손 계산: β = 1이면 가중치 0.5e¹, 0.3e^1.3, 0.2e^−0.5
 const w=[0.5*Math.exp(1),0.3*Math.exp(1.3),0.2*Math.exp(-0.5)],s=sum(w);near(M.klPolicy(1).pi[1],w[1]/s,1e-12);
 // 대리 점수는 β가 작을수록 오른다(단조)
 let prev=-Infinity;for(const b of [3,1,0.5,0.3,0.1,0.05]){const p=M.klPolicy(b).proxy;assert.ok(p>=prev-1e-12);prev=p;}
 const best=M.bestBeta(0);near(best.beta,1.5,0.02);
});

test('과최적화: 골드 정점 d* = a/(2b), 라벨이 늘면 정점이 뒤로',()=>{
 const r=M.overopt(1000,3);near(r.bg,0.32,1e-12);near(r.dStar,1.5625,1e-9);near(r.proxy,2.82,1e-9);near(r.gold,3-0.32*9,1e-9);
 near(M.overopt(30000,0).dStar,6.687,1e-3);assert.equal(M.overopt(1000,0).gap,0);
 let prev=0;for(const n of [1000,3000,10000,30000]){const d=M.overopt(n,0).dStar;assert.ok(d>prev);prev=d;}
 assert.equal(r.curve.length,61);near(r.goldPeak,1/(4*0.32),1e-12);
});

test('선호 손실: 여유가 0이면 log 2, 퇴화 판정, IPO 목표',()=>{
 near(M.prefLoss(0,0,0.1).dpo,Math.LN2,1e-12);
 const d=M.prefLoss(-0.5,-2,0.1);near(d.dpo,Math.log(1+Math.exp(-0.15)),1e-12);assert.equal(d.degraded,true);near(d.ipo,12.25,1e-9);near(d.bpo-d.dpo,0.5,1e-12);
 assert.equal(M.prefLoss(0.5,-1,0.1).degraded,false);
 // 같은 여유면 DPO 손실이 같다(Δ_w의 부호를 보지 않는다)
 near(M.prefLoss(2,0.5,0.1).dpo,M.prefLoss(-1,-2.5,0.1).dpo,1e-12);
 near(M.prefLoss(0,0,0.5).ipoTarget,1,1e-12);near(M.softplus(100),100,1e-9);
 near(M.simpo(-10,10,-20,10,2,0.5).z,2*(-1)-2*(-2)-0.5,1e-12);
});

test('백도어 시나리오와 순응 격차',()=>{
 const b=M.backdoor(10);near(b.redTeam,0.6*Math.pow(0.7,10),1e-12);near(b.heldOut,1-0.15*Math.pow(0.9,10),1e-12);
 near(M.backdoor(0,'cot').heldOut,0.95,1e-12);assert.ok(M.backdoor(20).heldOut>M.backdoor(0).heldOut);assert.ok(M.backdoor(20,'cot').heldOut<=1);
 const g=M.complianceGap(0.3,0.6);near(g.mon,1/(1+Math.exp(1.8)),1e-12);near(g.un,1/(1+Math.exp(3.6)),1e-12);near(g.gap,0.1153,1e-4);
 assert.equal(M.complianceGap(0,0.6).gap,0);near(M.observedRate(0.2,0.5),0.1,1e-12);
});

test('통제 프로토콜: 경계와 순서',()=>{
 assert.equal(M.control('none',0.02,2).safety,0);assert.equal(M.control('upfront',0.05,2).safety,0.05);
 const m=M.control('monitor',0.02,2);near(m.safety,1-M.Phi(M.PhiInv(0.98)-2),1e-12);near(m.safety,0.4786,1e-4);
 near(M.control('edit20',0.02,2).safety,0.8134,1e-4);near(M.control('edit20',0.02,2).useful,0.9,1e-12);
 for(const d of [1,2,3]){const s=['upfront','monitor','edit10','edit20'].map(p=>M.control(p,0.02,d).safety);for(let i=1;i<s.length;i++)assert.ok(s[i]>=s[i-1]-1e-12,`d=${d}`);}
 // 판별력 0이면 의심 점수가 정보를 주지 않아 무작위 감사와 같다
 near(M.control('monitor',0.05,0).safety,0.05,1e-6);
 const e=M.control('edit10',0.02,2);near(e.caught+e.edited+e.passed,1,1e-12);
});

test('PGR: 무작위 오류만이면 1, 체계적 오류만이면 음수',()=>{
 near(M.pgr(0.7,0).pgr,1,1e-12);near(M.pgr(0.7,0.5).pgr,0.43,1e-12);near(M.pgr(0.7,1).pgr,-0.14,1e-9);near(M.pgr(0.7,0.5).ft,0.8075,1e-12);
});

test('질의 예산과 다회 예시',()=>{
 const pa=M.perQuery(0.9,200);near(M.budgetASR(pa,200),0.9,1e-12);near(pa,0.011448,1e-5);near(M.budgetASR(pa,20),0.2057,1e-4);
 near(M.perQuery(0.85,20),0.0905,1e-4);assert.equal(M.budgetASR(0.3,0),0);
 near(M.msj(256),0.9,1e-12);assert.equal(M.msj(512),1);near(M.msj(256,true),0.9*2/61,1e-12);
 near(M.msj(64)/M.msj(32),Math.pow(2,0.8),1e-12);
});

test('주입 상태 기계: 어느 방어가 어디서 막는지',()=>{
 const base={payload:'benign',userFilter:'off',retrievalFilter:'off',ifc:'off',render:'allow'};
 assert.equal(M.injectionTrace(base).leaked,true);assert.equal(M.injectionTrace(base).steps.length,6);
 assert.equal(M.injectionTrace({...base,userFilter:'on'}).leaked,true);
 assert.equal(M.injectionTrace({...base,retrievalFilter:'keyword'}).leaked,true);
 assert.equal(M.injectionTrace({...base,payload:'plain',retrievalFilter:'keyword'}).blockedAt,2);
 assert.equal(M.injectionTrace({...base,ifc:'on'}).blockedAt,3);
 assert.equal(M.injectionTrace({...base,render:'approved'}).leaked,true);
 const off=M.injectionTrace({...base,render:'off'});assert.equal(off.blockedAt,4);assert.equal(off.steps[5].status,'skipped');
});

test('조정 층: 손 계산 대조와 기저율',()=>{
 const r=M.moderation(2,'both','plain',0.01);near(r.miss,M.Phi(-0.5)*M.Phi(0),1e-12);near(r.fpr,1-M.Phi(2)**2,1e-12);near(r.precision,0.1596,1e-4);
 near(M.moderation(2,'in','encoded',0.01).miss,M.Phi(1.5),1e-12);
 assert.ok(M.moderation(2,'both','plain',0.1).precision>r.precision);
 near(r.perMillion.caught+r.perMillion.missed,10000,1e-6);
});

test('공정성: 같은 문턱이면 균등 오즈, 승인율 맞추면 TPR이 갈린다',()=>{
 const r=M.fairness(1,1,0.3);assert.equal(r.tprGap,0);assert.equal(r.fprGap,0);near(r.A.tpr,M.Phi(0.5),1e-12);near(r.dp,0.1066,1e-4);
 const t=M.parityThreshold(1,0.3);near(t,0.6375,1e-3);const p=M.fairness(1,t,0.3);near(p.dp,0,1e-9);assert.ok(p.tprGap<-0.1);
 const s=M.fairness(1,1,0.5);assert.equal(s.dp,0);assert.equal(s.ppvGap,0);
});

test('차등 프라이버시: GDP 곡선, √T 법칙, MIA',()=>{
 const r=M.dpEpsilon(1,1);near(r.eps,4.377,2e-3);near(M.gdpDelta(r.eps,1),1e-5,1e-9);
 near(M.dpEpsilon(10,100).eps,r.eps,1e-6);near(M.dpEpsilon(2,1).eps,1.993,2e-3);
 let prev=Infinity;for(const s of [1,2,5,10]){const e=M.dpEpsilon(s,1).eps;assert.ok(e<prev);prev=e;}
 near(M.mia(1),M.Phi(M.PhiInv(0.01)+1),1e-12);near(M.mia(0),0.01,1e-9);
});

test('워터마크: z 점수 손 계산과 경계',()=>{
 const w=M.watermark(200,2,0),pg=0.25*Math.exp(2)/(0.25*Math.exp(2)+0.75);near(w.pg,pg,1e-12);near(w.z,(200*pg-50)/Math.sqrt(200*0.1875),1e-9);assert.equal(w.need,15);
 assert.equal(M.watermark(200,2,0.8).detected,false);near(M.watermark(200,2,0.8).z,3.013,1e-3);
 assert.equal(M.watermark(200,2,1).z,0);assert.equal(M.watermark(200,2,1).need,Infinity);assert.equal(M.watermark(200,1,0).need,60);
});

test('EU 일정 조회와 진단',()=>{
 assert.equal(M.addMonths(0),'2024-08-28');assert.equal(M.addMonths(24),'2026-08-28');
 const c=M.euObligations(17,'chat');assert.equal(c.active.length,2);assert.equal(c.upcoming.length,1);assert.equal(c.koreaInForce,true);
 assert.equal(M.euObligations(24,'credit').active.length,3);assert.equal(M.euObligations(39,'credit').active.length,3);assert.equal(M.euObligations(40,'credit').active.length,4);/* 부속서 III 고위험은 AI 옴니버스(EU 2026/1744)로 2027-12-02 */assert.equal(M.euObligations(16,'chat').koreaInForce,false);
 const all=M.euObligations(48,'gpai');assert.equal(all.upcoming.length,0);
 assert.equal(M.diagnose('leak','ifc').fixed,true);assert.equal(M.diagnose('leak','userfilter').fixed,false);
 const s=M.diagnose('syc','betadown');assert.ok(s.after>s.before);near(M.diagnose('syc','agree').after,0.235,1e-3);
 const g=M.diagnose('gap','parity');assert.equal(g.fixed,true);assert.ok(g.tprGapAfter<-0.1);
});
