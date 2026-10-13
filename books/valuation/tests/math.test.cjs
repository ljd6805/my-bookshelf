/* 가치 평가 계산의 대표값·경계값·불변 조건. 기준값은 docs/research.html의 V-1~V-10, docs/index.html의 #curriculum-case(공통 사례 성장 계획)와
   #chapters의 해결 결과·L1·L2·확인 칸이다. 기대값은 문서의 숫자 문자열로 따로 적고 math.js(VMath)의 결과와 대조한다.
   불변 조건(PBR = ROE × PER, 주주 몫 = 기업가치 − 순차입금, 할인율이 오르면 값이 내림, g ≥ r이면 계산하지 않음, 차이 나누기의 합 = A − B)은
   결정적 시드의 무작위 입력에서도 맞아야 한다. 마지막 테스트들은 content.js와 review.json의 모든 숫자가 여기서 계산했거나 문제에 주어진 숫자인지,
   L2 답이 본문·확인 문제·복습 문제에 새어 나가지 않았는지 검사한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),M=require('../js/math.js');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const f1=x=>M.r1(x).toFixed(1),f2=x=>x.toFixed(2),pct=(x,d=1)=>(x*100).toFixed(d),w=x=>M.won(x).toLocaleString('en-US'),w10=x=>M.r10(x).toLocaleString('en-US');
const D=M.dcf(),F=M.finalTask(),PV=M.peerValues();

/* 책에 나오는 계산값을 한곳에 모은다. 아래 테스트가 기대값과 대조하고, 숫자 출처 검사가 쓴다. */
const C={};const put=(k,v)=>{C[k]=v;return v;};
put('b25',M.basics());put('b24',M.basics({ni:136,equity:776}));put('split',M.split(undefined,2));
put('m25',M.multiples());put('m24',M.multiples({ni:136,equity:776}));put('fwd',M.forwardPer(20000,C.b25.eps,0.05));
put('peers',M.peerTable());put('pv',PV);put('div',M.dividend());put('r7',M.impliedR(400,20000,0.07));put('r6',M.impliedR(400,20000,0.06));put('r8',M.impliedR(400,20000,0.08));
put('ev24',M.evBridge(2024));put('ev25',M.evBridge(2025));put('evCash',M.evBridge(2025,{cash:162.8}));put('evDiff',C.ev25.ev-C.ev24.ev);
put('f24',M.actualFcff(2024));put('f25',M.actualFcff(2025));put('dcf',D);put('wacc',M.wacc());put('wacc34',M.wacc({rf:0.034}));
put('finalTask',F);put('tornado',M.tornado());put('pp',['r','margin','gT','growth','wcRatio'].map(k=>M.perPoint(k)));
put('impG',M.implied('growth'));put('impR',M.implied('r'));put('impAll',['margin','wcRatio','gT'].map(k=>M.implied(k)));
put('gPeers',[M.impliedG(8,0.5,0.09),M.impliedG(11,0.35,0.09),M.impliedG(18,0.2,0.09)]);
const RS=[0.073,0.078,0.083,0.088,0.093];
put('sG',M.sensitivity('r',RS,'growth',[0.01,0.03,0.05,0.07,0.09]));put('sM',M.sensitivity('r',RS,'margin',[0.10,0.11,0.12,0.13,0.14]));put('sT',M.sensitivity('r',RS,'gT',[0.01,0.015,0.02,0.025,0.03]));
put('range',M.rangeSentence(Math.min(PV.low,C.tornado[0].low),C.tornado[0].high));
/* 확인·전이 문제와 복습 문제의 계산(새 사례와 오답 보기 포함) */
put('q',{y16:400/16000,rent:[1200/30000,1200/25000],nwc322:1890*0.322,dNwc322:1890*0.322-580,evWrong:2487.2/278,cash162:450-162.8,
 waccDrop:C.wacc.wacc-C.wacc34.wacc,gNa:[0.09*11-0.35,11.35],scholar:[1000/0.05,1000/0.03],retention:[0.5*0.09,0.8*0.2],rGap:C.impR-0.083,
 ke12:M.capm(0.044,1.2,0.049),riskOnly:1.2*0.049,kdWrong:0.0506/0.8,meanPer:(8+11+13+18)/4,meanVal:12.5*1648,per11:11*1648,
 noWc:84+40,asym:[0.322-0.28,0.28-0.18],onePlus:[1.07,1.06,1.083],ndWrong:[450+62.8,250-62.8],pv1:146.9/1.083,denom:[0.083-0.02,0.083-0.025],pbr24:20000/7760,share75:3/4});

test('assumptions, market numbers and filing dates live in one table each, with check dates and grades',()=>{
 assert.equal(M.CHECKED,'2026-10-13');assert.equal(M.ASSUME.base.r,0.083);assert.equal(M.ASSUME.base.wcRatio,0.28);assert.equal(M.ASSUME.base.gT,0.02);
 assert.deepEqual([M.MARKET.rf.raw,M.MARKET.rf.date,M.MARKET.rf.grade],[0.04395,'2026-10-08','news']);assert.deepEqual([M.MARKET.erp.raw,M.MARKET.erp.date,M.MARKET.erp.grade],[0.0487,'2026-01-05','estimate']);
 assert.equal(M.MARKET.beta.grade,'assumption');assert.deepEqual([M.MARKET.kd.raw,M.MARKET.kd.date],[0.05061,'2026-10-07']);assert.match(M.MARKET.kospiForwardPer.what,/계산 입력으로 쓰지 않음/);
 assert.deepEqual([M.RULES.q1,M.RULES.half,M.RULES.annual2026,M.RULES.annual2025],['2026-05-15','2026-08-14','2027-03-31','2026-03-31']);
 const src=read('js/math.js');for(const n of ['0.28,','0.083,','0.04395','0.0487','0.05061','708/1800'])assert.equal(src.split(n).length-1,1,n+' appears only once (in ASSUME or MARKET)');
 for(const v of Object.values(M.assumptions))assert.match(v,/단순화|가정|확인 못함/);
});

test('5권 숫자를 그대로 쓴다: 2024·2025 매출·영업이익·감가상각·순이익·운전자본·자본·차입금·현금',()=>{
 const S=require('../../statements/js/math.js'),s=S.saebyeok(),y=M.ASSUME.years,nwc=c=>c.ar+c.inv-c.ap;
 for(const [yr,o] of [[2024,s.y2024],[2025,s.y2025]]){const v=y[yr];assert.deepEqual([v.sales,v.op,v.dep,v.ni,v.equity,v.cash,v.debt,v.nwc],[o.is.sales,o.is.op,o.dep,o.is.ni,o.totals.equity,o.close.cash,o.close.std+o.close.bond,nwc(o.close)]);}
 assert.equal(y[2024].nwcOpen,nwc(S.OPENING));assert.equal(y[2025].ppe,s.y2025.close.ppe);assert.deepEqual([y[2024].capex,y[2025].capex],[S.YEARS[2024].capex,S.YEARS[2025].capex]);
 assert.equal(M.ASSUME.dps*M.ASSUME.shares/1e8,S.ASSUME.dividend,'400원 × 1,000만 주 = 40억 원');
});

test('V-1 시가총액 2,000억 원, EPS 1,648원, BPS 9,008원(2024: 1,360 · 7,760), 액면분할 10,000 · 824 · 2,000; L2 600억 · 1,200 · 9,000',()=>{
 assert.deepEqual([C.b25.cap,w(C.b25.eps),w(C.b25.bps)],[2000,'1,648','9,008']);assert.deepEqual([w(C.b24.eps),w(C.b24.bps)],['1,360','7,760']);
 assert.deepEqual([C.split.price,w(C.split.eps),C.split.cap,w(C.split.bps)],[10000,'824',2000,'4,504']);
 const l2=M.basics({price:15000,shares:4e6,ni:48,equity:360});assert.deepEqual([l2.cap,w(l2.eps),w(l2.bps)],[600,'1,200','9,000']);
 assert.throws(()=>M.basics({shares:0}),RangeError);assert.throws(()=>M.basics({price:-1}),RangeError);
});

test('V-2 PER 12.14 · PBR 2.22 · ROE 18.3%, 2024 PER 14.71, 비교 회사 PBR, 중앙값 19,776 · 17,971; L2 PBR 1.5 · PER 15',()=>{
 assert.deepEqual([f2(C.m25.per),f2(C.m25.pbr),pct(C.m25.roe),pct(C.m25.roe,2),f2(C.m24.per),f2(C.m24.pbr),pct(C.m24.roe,2)],['12.14','2.22','18.3','18.29','14.71','2.58','17.53']);
 assert.deepEqual(C.peers.map(p=>f2(p.pbr)),['0.72','1.65','2.34','3.60']);assert.deepEqual([PV.median.per,PV.median.pbr.toFixed(3),PV.median.evEbitda],[12,'1.995',7.5]);
 assert.deepEqual([w(PV.values.per),w(PV.values.pbr),w(PV.values.evEbitda)],['19,776','17,971','16,978']);
 assert.deepEqual([C.fwd.eps1.toFixed(1),f2(C.fwd.per)],['1730.4','11.56']);
 assert.equal(0.15*10,1.5);assert.equal(1.5/0.10,15);assert.equal(M.median([3,1,2]),2);assert.throws(()=>M.median([]),RangeError);
});

test('invariant: PBR = ROE × PER for any positive price, income and equity (seeded), and fails when the bases are mixed',()=>{
 const r=rng(20261013);
 for(let i=0;i<300;i++){const o={price:1000+r()*99000,shares:Math.round(1e6+r()*1e8),ni:1+r()*999,equity:1+r()*9999},m=M.multiples(o);assert.ok(Math.abs(m.pbr-m.roeTimesPer)<1e-9*m.pbr,'case '+i);}
 assert.notEqual((0.197*C.m25.per).toFixed(2),f2(C.m25.pbr),'average-equity ROE does not reproduce the year-end PBR');
});

test('V-3 배당수익률 2.0%, 배당성향 24.3%, 요구수익률 9.14%, b × ROE 13.9%; L2 3.0% · 30% · 7.12%',()=>{
 assert.deepEqual([pct(C.div.yield),pct(C.div.payout),pct(C.div.retention),pct(C.div.sustainableG),C.div.retention.toFixed(3)],['2.0','24.3','75.7','13.9','0.757']);
 assert.deepEqual([C.r7.d1,pct(C.r7.yield1,2),pct(C.r7.r,2)],[428,'2.14','9.14']);assert.deepEqual([pct(C.r6.r,2),pct(C.r8.r,2)],['8.12','10.16']);
 const l2=M.dividend({dps:1500,price:50000,eps:5000,roe:0.1});assert.deepEqual([pct(l2.yield),pct(l2.payout,0),pct(M.impliedR(1500,50000,0.04).r,2)],['3.0','30','7.12']);
 assert.equal(pct(C.q.y16),'2.5');assert.equal(M.perpetuity(2,0.08,0.03).toFixed(6),'40.000000','3권 L1: 2 ÷ (8% − 3%) = 40');
});

test('V-4 EV 2,114 → 2,387.2, EBITDA 240 · 278, 8.81 · 8.59, 중앙값 7.5배 → 16,978원, 범위 16,978~19,776; 확인 2,287.2 · 8.23; L2 6.67 · 9.67',()=>{
 assert.deepEqual([C.ev24.netDebt,C.ev24.ev,C.ev24.ebitda,f2(C.ev24.evEbitda)],[114,2114,240,'8.81']);assert.deepEqual([f1(C.ev25.netDebt),f1(C.ev25.ev),C.ev25.ebitda,f2(C.ev25.evEbitda)],['387.2','2387.2',278,'8.59']);
 assert.deepEqual([PV.evValue,f1(PV.equityByEv),w(PV.low),w(PV.high)],[2085,'1697.8','16,978','19,776']);assert.equal(f1(C.evDiff),'273.2');
 assert.deepEqual([f1(C.evCash.ev),f2(C.evCash.evEbitda)],['2287.2','8.23']);
 const a=M.ev(1000,0,0),b=M.ev(1000,500,50);assert.deepEqual([f2(a.ev/150),f2(b.ev/150)],['6.67','9.67']);
 assert.throws(()=>M.ev(1000,-1,0),RangeError);assert.deepEqual(M.equityValue(2662,387,1e7).perShare,(2662-387)*10);
});

test('V-5 FCFF 84 · −225.2, 기준안 2026 196.8(운전자본 −50.8), 2027~2030 126.9~146.9, 5년 현재가치 595.1; 확인 28.6; L2 50 · 46.3',()=>{
 assert.deepEqual([C.f24.nopat,C.f24.dNwc,C.f24.fcff,pct(C.f24.wcRatio)],[144,40,84,'18.0']);assert.deepEqual([f1(C.f25.nopat),C.f25.dNwc,f1(C.f25.fcff),pct(C.f25.wcRatio)],['172.8',310,'-225.2','32.2']);
 const R=D.rows;assert.deepEqual(R.map(r=>f1(r.fcff)),['196.8','126.9','133.2','139.9','146.9']);assert.deepEqual(R.map(r=>f1(r.pv)),['181.8','108.2','104.9','101.7','98.6']);
 assert.deepEqual(R.map(r=>r.df.toFixed(4)),['0.9234','0.8526','0.7873','0.7269','0.6712']);assert.deepEqual([f1(R[0].sales),f1(R[0].op),f1(R[0].dep),f1(R[0].capex),f1(R[0].dNwc),f1(R[0].nwc)],['1890.0','226.8','70.8','106.2','-50.8','529.2']);
 assert.equal(f1(D.pvSum),'595.1');assert.equal(pct(M.ASSUME.base.ppeRatio),'39.3');
 assert.deepEqual([f1(C.q.nwc322),f1(C.q.dNwc322)],['608.6','28.6']);
 const l2=M.fcff({op:100,dep:30,capex:50,dNwc:10});assert.deepEqual([l2,f1(l2*M.discountFactor(0.08,1))],[50,'46.3']);
 assert.throws(()=>M.fcff({op:1,dep:1,capex:1}),RangeError);assert.throws(()=>M.forecast({years:0}),RangeError);assert.throws(()=>M.forecast({wcRatio:-0.1}),RangeError);
});

test('V-6 자기자본비용 9.3%, 세후 부채 비용 4.05%(4.048%), 비중 81.6 : 18.4, WACC 8.335%; 확인 8.3% · 7.52%; L2 10.77% · 8.98%',()=>{
 const W=C.wacc;assert.deepEqual([pct(W.ke),pct(W.kd,3),pct(W.kd,2),pct(W.wE),pct(W.wD),pct(W.wacc,3),pct(W.wacc)],['9.3','4.048','4.05','81.6','18.4','8.335','8.3']);
 assert.deepEqual(W.checked,{rf:'2026-10-08',erp:'2026-01-05',kd:'2026-10-07'});
 assert.deepEqual([pct(C.wacc34.ke),pct(C.wacc34.wacc,2),pct(C.q.waccDrop)],['8.3','7.52','0.8']);
 const ke=M.capm(0.044,1.3,0.049),l2=M.wacc({beta:1.3,equity:70,debt:30,kdPre:0.06});assert.deepEqual([pct(ke,2),pct(l2.wacc,2)],['10.77','8.98']);
 assert.throws(()=>M.wacc({equity:0,debt:0}),RangeError);assert.throws(()=>M.capm(0.04,9,0.05),RangeError);
});

test('V-7 2031 FCFF 194.0 > 146.9, 영구가치 3,079.6, 현재가치 2,067.1, EV 2,662.2(77.6%), 주주 몫 2,275.0, 주당 22,750원; L2 1,666.7 · 1,083.2 · +20%',()=>{
 assert.deepEqual([f1(D.next.fcff),f1(D.next.capex),f1(D.next.dNwc),f1(D.next.sales),f1(D.next.op),f1(D.next.dep)],['194.0','108.4','12.9','2343.3','281.2','90.4']);
 assert.ok(D.next.fcff>D.rows[4].fcff,'lower growth → less reinvestment → higher FCFF');assert.deepEqual([f1(D.rows[4].capex),f1(D.rows[4].dNwc)],['129.1','30.6']);
 assert.deepEqual([f1(D.tv),f1(D.tvPv),f1(D.firm),pct(D.tvShare),f1(D.equity),M.won(D.perShare)],['3079.6','2067.1','2662.2','77.6','2275.0',22750]);
 assert.ok(D.perShare>22749.5&&D.perShare<22749.6,'22,749.5원: 원 단위 반올림 경계 바로 위(입력을 바꾸면 이 테스트가 알린다)');
 const t=M.terminal(100,0.09,0.03);assert.deepEqual([f1(t.tv),f1(t.pv),f1(M.perpetuity(100,0.09,0.04)),pct(M.perpetuity(100,0.09,0.04)/t.tv-1,0)],['1666.7','1083.2','2000.0','20']);
 assert.deepEqual([C.q.scholar[0],w(C.q.scholar[1]*1e4/1e4)],[20000,'33,333'],'장학금: 2억 원, 약 3억 3,333만 원');
});

test('boundary: g ≥ r throws “g ≥ r” and never returns a value; g just below r gives a large finite value',()=>{
 assert.throws(()=>M.dcf({gT:0.083}),/g ≥ r/);assert.throws(()=>M.dcf({gT:0.09}),/g ≥ r/);assert.throws(()=>M.perpetuity(1,0.05,0.05),/g ≥ r/);
 assert.throws(()=>M.justifiedPer(0.4,0.09,0.1),/g ≥ r/);assert.throws(()=>M.impliedG(100,0,0.09,'forward'),RangeError);
 const near=M.dcf({gT:0.0829});assert.ok(Number.isFinite(near.perShare)&&near.perShare>10*D.perShare,'g just below r');
 const cell=M.sensitivity('r',[0.02],'gT',[0.02,0.03]);assert.deepEqual(cell[0].map(c=>c.error),['g ≥ r','g ≥ r']);assert.equal(cell[0][0].value,null);
 const g0=M.dcf({growth:0});assert.ok(g0.perShare>0&&g0.perShare<D.perShare,'growth 0');assert.ok(Number.isFinite(M.value({wcRatio:0.18}))&&Number.isFinite(M.value({wcRatio:0.322})));
});

test('V-8 한 번에 하나: 18,971↔27,968 · 20,095↔25,404 · 21,682↔25,292 · 21,534↔24,055 · 21,884↔23,764, 순서와 1%p당 변화',()=>{
 const T=C.tornado;assert.deepEqual(T.map(t=>t.key),['r','margin','wcRatio','growth','gT']);
 assert.deepEqual(T.map(t=>[w(t.low),w(t.high)]),[['18,971','27,968'],['20,095','25,404'],['21,682','25,292'],['21,534','24,055'],['21,884','23,764']]);
 const pp=Object.fromEntries(C.pp.map(p=>[p.key,[M.won(p.up),M.won(p.down)]]));
 assert.deepEqual(pp,{r:[-3779,5219],margin:[2654,-2654],gT:[2220,-1612],growth:[641,-619],wcRatio:[-254,254]});
 assert.deepEqual([C.range.low,C.range.high],[17000,28000]);assert.deepEqual([pct(0.322-0.28),pct(0.28-0.18)],['4.2','10.0']);
});

test('V-8 표: 성장률 × 할인율, 영업이익률 × 할인율, 영구성장률 × 할인율(10원 반올림); 확인 20,400 · 25,460; L2 24,336',()=>{
 assert.deepEqual(C.sG.map(r=>r.map(c=>w10(c.value))),[['24,760','26,310','27,970','29,760','31,680'],['22,400','23,710','25,130','26,660','28,290'],['20,400','21,530','22,750','24,060','25,460'],['18,710','19,680','20,720','21,840','23,040'],['17,240','18,070','18,970','19,940','20,970']]);
 assert.deepEqual([0,2,4].map(i=>C.sM[i].map(c=>w10(c.value))),[['21,640','24,810','27,970','31,130','34,290'],['17,440','20,100','22,750','25,400','28,060'],['14,400','16,690','18,970','21,260','23,540']]);
 assert.deepEqual([0,2,4].map(i=>C.sT[i].map(c=>w10(c.value))),[['25,360','26,550','27,970','29,680','31,780'],['21,140','21,880','22,750','23,760','24,970'],['17,940','18,420','18,970','19,600','20,330']]);
 assert.equal(w(M.value({wcRatio:0.322,margin:0.13})),'24,336');
});

test('invariant: value falls as the discount rate rises and rises with margin; equity = firm − net debt (seeded)',()=>{
 const r=rng(7);let checked=0;
 for(let i=0;i<200;i++){
  const base={growth:-0.02+r()*0.12,margin:0.08+r()*0.22,wcRatio:0.15+r()*0.17,gT:r()*0.03};const r1=0.05+r()*0.08,r2=r1+0.001+r()*0.05;
  const a=M.dcf({...base,r:r1}),b=M.dcf({...base,r:r2}),positive=[...a.rows,a.next].every(x=>x.fcff>0);
  if(positive){checked++;assert.ok(b.perShare<a.perShare,'case '+i+' r: with positive FCFF a higher discount rate lowers the value');}
  assert.ok(M.value({...base,r:r1,margin:base.margin+0.01})>a.perShare,'case '+i+' margin');
  assert.ok(Math.abs(a.equity-(a.firm-a.netDebt))<1e-9&&Math.abs(a.perShare-a.equity*10)<1e-6,'case '+i+' bridge');
  assert.ok(Math.abs(a.firm-(a.pvSum+a.tvPv))<1e-9,'case '+i+' firm');
 }
 assert.ok(checked>150,'most seeded cases have positive FCFF: '+checked);
});

test('V-9 주가 20,000원 = 성장률 0.25% 또는 할인율 9.0%, 비교 회사 가 2.59% · 나 5.64% · 라 7.80%, b × ROE 4.5% · 16.0%; L2 7.4%',()=>{
 assert.deepEqual([pct(C.impG,2),pct(C.impR,1),pct(C.impR,2)],['0.25','9.0','9.00']);assert.ok(Math.abs(M.value({growth:C.impG})-20000)<0.01&&Math.abs(M.value({r:C.impR})-20000)<0.01);
 assert.deepEqual(C.impAll.map(x=>pct(x,2)),['10.96','38.81','0.08']);
 assert.deepEqual(C.gPeers.map(g=>pct(g,2)),['2.59','5.64','7.80']);assert.deepEqual(C.peers.map(p=>pct(p.retentionG,1)),['4.5','9.8','12.6','16.0']);
 for(const [g,p] of C.gPeers.map((g,i)=>[g,[M.ASSUME.peers[0],M.ASSUME.peers[1],M.ASSUME.peers[3]][i]]))assert.ok(Math.abs(M.justifiedPer(p.payout,0.09,g)-p.per)<1e-9,'round trip '+p.name);
 assert.equal(pct(M.impliedG(25,0.4,0.09,'forward'),1),'7.4');assert.deepEqual([C.q.gNa[0].toFixed(2),C.q.gNa[1]],['0.64',11.35]);assert.equal(pct(C.q.rGap),'0.7');
 assert.throws(()=>M.implied('tax'),RangeError);assert.throws(()=>M.implied('growth',1e9),/no solution/);
});

test('V-10 A 31,833 · B 15,867(2.01배), 744.1 · 512.1, 79.2% · 74.1%, B → A 18,625 · 23,006 · 26,539 · 31,833; L2 19,246; 확인 +3,379',()=>{
 assert.deepEqual([w(F.A.perShare),w(F.B.perShare),f2(F.ratio),w(F.diff)],['31,833','15,867','2.01','15,966']);
 assert.deepEqual([f1(F.A.pvSum),f1(F.B.pvSum),f1(F.A.tvPv),f1(F.B.tvPv),pct(F.A.tvShare),pct(F.B.tvShare)],['744.1','512.1','2826.4','1461.9','79.2','74.1']);
 assert.deepEqual(F.gap.steps.map(s=>[s.key,w(s.value),w(s.delta)]),[['wcRatio','18,625','2,758'],['margin','23,006','4,381'],['growth','26,539','3,533'],['r','31,833','5,294']]);
 const l2=M.value({...M.ASSUME.analysts.B,r:0.08});assert.equal(w(l2),'19,246');const first=M.gapSteps(['r','wcRatio','margin','growth']).steps[0];assert.deepEqual([w(first.delta)],['3,379']);assert.ok(first.delta<F.gap.steps[3].delta);
});

test('invariant: the gap steps always add up to A − B, in every one of the 24 orders',()=>{
 const keys=M.ASSUME.gapOrder,perms=a=>a.length<=1?[a]:a.flatMap((x,i)=>perms([...a.slice(0,i),...a.slice(i+1)]).map(p=>[x,...p]));
 const all=perms(keys);assert.equal(all.length,24);const shares=new Set();
 for(const o of all){const g=M.gapSteps(o);assert.ok(Math.abs(g.total-F.diff)<1e-6,o.join('>'));shares.add(M.won(g.steps.find(s=>s.key==='r').delta));}
 assert.ok(shares.size>1,'the discount-rate share depends on the order');assert.throws(()=>M.gapSteps(['r','r']),RangeError);
});

test('the numbers in docs/index.html #curriculum-case and #chapters (해결 결과·L1·L2·확인) are the numbers above',()=>{
 const doc=read('docs/index.html'),caseText=doc.slice(doc.indexOf('id="curriculum-case"'),doc.indexOf('id="chapters"')),L=doc.slice(doc.indexOf('id="chapters"'),doc.indexOf('id="style"'));
 const caseNums=['2,000억 원','1,648원','9,008원','12.14배','2.22배','18.3%','14.71배','19,776원','17,971원','2.0%','24.3%','9.14%','13.9%','2,114억 원','2,387.2억 원','278억 원','8.59배','2,085억 원','16,978원','16,978~19,776원','= 84억 원','−225.2억 원','50.8억 원','196.8억 원','595.1억 원','9.3%','4.05%','8.3%','194.0억 원','3,079.6억 원','2,067.1억 원','2,662.2억 원','77.6%','2,275.0억 원','22,750원','18,971원 ↔ 27,968원','20,095원 ↔ 25,404원','약 17,000원~28,000원','0.25%','9.0%','2.59%','7.80%','39.3%'];
 for(const s of caseNums)assert.ok(caseText.includes(s),'case: '+s);
 const solved=['시가총액 2,000억 원, EPS 1,648원, BPS 9,008원','0.183 × 12.14 = 2.22','b × ROE = 13.9%','EV 2,114억 원(2024 말) → 2,387.2억 원(2025 말), EBITDA 278억 원, 8.59배','126.9~146.9억 원','4.4% + 1.0 × 4.9% = 9.3%, 5.06% × 0.8 = 4.05%','2031년 FCFF 194.0억 원 &gt; 2030년 146.9억 원','운전자본 32.2% ↔ 18% 21,682 ↔ 25,292원, 성장률 3% ↔ 7% 21,534 ↔ 24,055원, 영구성장률 ±0.5%p 21,884 ↔ 23,764원','할인율 +1%p −3,779원·−1%p +5,219원, 영업이익률 ±2,654원, 영구성장률 +2,220원·−1,612원, 성장률 +641원·−619원, 운전자본 비율 ∓254원','비교 회사 가 2.59%(b × ROE 4.5%), 라 7.80%(16.0%)','운전자본 +2,758원, 영업이익률 +4,381원, 성장률 +3,533원, 할인율 +5,294원','5년 현재가치 744.1·512.1억 원, 영구가치 비중 79.2%·74.1%'];
 for(const s of solved)assert.ok(L.includes(s),'chapters result: '+s);
 const l1=['900.8억 원','164.8억 원','19.7%','18.3%','2 ÷ (8% − 3%) = 40','62억 원','NPV 11.6만 원','−83.2억 원','5.061%','146.9억 원','77.6%','13.07%','9.14%','할인율 9.0%','430억 원'];
 for(const s of l1)assert.ok(L.includes(s),'chapters L1: '+s);
 const l2=['(시가총액 600억 원, EPS 1,200원, BPS 9,000원)','(PBR 1.5배, PER 15배)','(3.0%, 30%, 7.12%)','(6.67배, 9.67배)','(FCFF 50억 원, 현재가치 약 46.3억 원)','(10.77%, 약 8.98%)','(1,666.7억 원, 약 1,083.2억 원, 2,000억 원으로 20%)','(오른다, 24,336원)','(7.4%)','(19,246원)'];
 for(const s of l2)assert.ok(L.includes(s),'chapters L2: '+s);
 const check=['(10,000원, 824원, 2,000억 원 그대로)','(2.34배)','(2.5%)','(2,287.2억 원, 8.23배)','(1,890 × 32.2% − 580 = 28.6억 원','(8.3%, 약 7.5%: (2,000 × 8.3% + 450 × 4.05%) ÷ 2,450 = 7.52%)','(계산하지 않고 “g ≥ r” 오류)','(20,400원, 25,460원)','(약 5.64%)','(작다: 19,246 − 15,867 = +3,379원','(4.0%, 4.8%)','(2억 원, 1년 뒤 첫 지급이면 약 3억 3,333만 원)','(50만 원'];
 for(const s of check)assert.ok(L.includes(s),'chapters check/transfer: '+s);
});

/* 문제에 주어진 입력·날짜·장 번호·권 번호·가정·출처 값·오답 보기. 계산값(C)과 함께 본문 숫자의 출처가 된다. */
const GIVEN=require('./given.cjs');
const allowedNumbers=()=>{
 const computed=new Set();
 const add=v=>{if(typeof v!=='number'||!Number.isFinite(v))return;const a=Math.abs(v);for(const x of [a,a*100,M.r10(a)])for(const d of [0,1,2,3,4]){computed.add(x.toFixed(d));computed.add(x.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}));}computed.add(String(a));};
 const walk=o=>{if(Array.isArray(o))o.forEach(walk);else if(o&&typeof o==='object')Object.values(o).forEach(walk);else add(o);};
 walk(C);walk(M.ASSUME);walk(M.MARKET);return new Set([...computed,...GIVEN]);
};
const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=ctx.window.VBook,REV=JSON.parse(read('review.json'));
test('every number in content.js and review.json is computed above or given in the problem',()=>{
 const allowed=allowedNumbers(),strip=s=>String(s).replace(/<[^>]+>/g,' ');
 const text=strip(JSON.stringify(B.chapters.map(c=>[c.title,c.subtitle,c.desc,c.recall,c.paragraphs,c.formula,c.formulaNote,c.flow,c.details,c.warning,c.quiz,c.transfer,c.cross.map(x=>x[2])]))+JSON.stringify(REV.chapters));
 const missing=[...new Set(text.match(/\d[\d,]*\d(?:\.\d+)?|\d(?:\.\d+)?/g))].filter(t=>!allowed.has(t.replace(/,$/,'')));
 assert.deepEqual(missing,[],'numbers with no computation or given input: '+missing.join(' '));
});

test('L2 answers from docs/index.html #chapters are not stated or computed in the prose, details, quizzes or the review',()=>{
 const all=JSON.stringify(B.chapters)+JSON.stringify(REV.chapters),esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 for(const s of ['600억','1,200원','9,000원','1.5배','PER 15배','15배','7.12','3.0%','6.67','9.67','FCFF 50억','46.3','10.77','8.98','1,666.7','1,083.2','24,336','7.4%','19,246','3,379'])
  assert.doesNotMatch(all,new RegExp('(?<![\\d.,])'+esc(s)+'(?![\\d])'),'L2 answer leaked: '+s);
 /* 8장 L2는 운전자본 32.2%와 영업이익률 13%를 함께 바꾼 값이다. 본문 표에는 운전자본 축이 없다. */
 const s8=B.chapters.find(c=>c.id==='sensitivity');assert.doesNotMatch(JSON.stringify(s8.details),/운전자본 \\\\|운전자본 비율 ×/);
});

/* 결정적 의사 난수(mulberry32). 같은 시드면 같은 입력이 나와 실패를 다시 볼 수 있다. */
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

test('every function in math.js stays under 100 lines',()=>{
 const lines=read('js/math.js').split('\n');let depth=0,start=null;
 lines.forEach((line,i)=>{const o=(line.match(/\{/g)||[]).length,c=(line.match(/\}/g)||[]).length;if(start===null&&/(function\b|=>\s*\{)/.test(line)&&depth===1)start=[i,depth];depth+=o-c;if(start&&depth<=start[1]){assert.ok(i-start[0]+1<=100,`math.js:${start[0]+1} ${i-start[0]+1} lines`);start=null;}});
});
