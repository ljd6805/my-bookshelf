/* 재무제표 계산의 대표값·경계값·불변 조건. 기준값은 docs/research.html의 V-1~V-10, docs/index.html의 #curriculum-case(공통 사례 성장 계획)와
   #chapters의 L1·L2 칸이다. 기대값은 문서의 숫자 문자열과 ref(정수·소수 직접 계산)로 따로 적고 math.js의 결과와 대조한다.
   대조 네 줄은 결정적 시드의 무작위 입력 수백 개에서도 맞아야 한다(속성 검사).
   마지막 테스트들은 content.js와 review.json의 모든 숫자가 여기서 계산했거나 문제에 주어진 숫자인지,
   L2 답이 본문·복습 문제에 새어 나가지 않았는지 검사한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),M=require('../js/math.js');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const f1=x=>x.toFixed(1),pct=(x,d=1)=>(x*100).toFixed(d);
const S=M.saebyeok(),Y24=S.y2024,Y25=S.y2025,F=M.finalTask();

/* 책에 나오는 계산값을 한곳에 모은다. 아래 테스트가 기대값과 대조하고, 숫자 출처 검사가 쓴다. */
const C={};const put=(k,v)=>{C[k]=v;return v;};
put('s24',Y24);put('s25',Y25);put('final',F);put('open',M.totals(M.OPENING));
put('borrow50',M.applyTx(M.OPENING,{kind:'borrow',amount:50}));put('sale30',M.applyTx(M.OPENING,{kind:'creditSale',amount:30}));
put('is24',M.incomeStatement());put('isUpFixed',M.incomeStatement({sales:1650,sga:270}));put('isUpRatio',M.incomeStatement({sales:1650}));
put('isInt22',M.incomeStatement({interestExpense:22}));put('isL2',M.incomeStatement({cogsRate:.72,sga:270}));
put('capex120',M.linkedYear(M.OPENING,{...M.YEARS[2024],capex:120}));put('station',M.linkedYear(M.OPENING,{...M.YEARS[2024],ar:430}));
put('div60',M.linkedYear(M.OPENING,{...M.YEARS[2024],dividend:60}));put('l2link',M.linkedYear(M.OPENING,{...M.YEARS[2024],capex:200}));
put('l2cash',M.linkedYear(M.OPENING,{...M.YEARS[2024],ar:280}));put('l2final',M.linkedYear(Y24.close,{...M.YEARS[2025],ar:330}));
put('r24',F.r2024);put('r25',F.r2025);put('dupont',M.dupont(136,1500,1103,728));put('l2stab',M.stability({op:30,interest:12,liabilities:300,equity:200,currentAssets:120,currentLiabilities:150}));
put('a3',M.alarm(.03,.8,.1));put('a2',M.alarm(.02,.8,.1));put('a5',M.alarm(.05,.8,.1));put('a1',M.alarm(.01,.8,.1));
put('parts24',M.accrualParts({dAR:30,dInv:20,dAP:10,dep:60}));put('accL2',M.accrualRatio(50,-10,400));put('accRv',M.accrualRatio(80,100,500));
put('ind',M.industryTable());put('indL2',{t:1800/150,d:M.daysFromTurnover(1800/150)});
put('d24',M.deadline('2024-12-31','annual'));put('d25',M.deadline('2025-12-31','annual'));put('dHalf',M.deadline('2026-06-30','half'));put('dQ1',M.deadline('2026-03-31','quarter'));put('dQ3',M.deadline('2026-09-30','quarter'));
/* 복습 문제(review.json)와 본문 확인 문제의 계산 */
put('rvPayAP',M.applyTx(M.OPENING,{kind:'payAP',amount:40}));put('rvSale20',M.applyTx(M.OPENING,{kind:'creditSale',amount:20,cost:14}));
put('rvSga285',M.incomeStatement({sga:285}));put('rvS2000',M.incomeStatement({sales:2000}));put('rvSales1600',M.linkedYear(M.OPENING,{...M.YEARS[2024],sales:1600}));
put('borrow50T',M.totals(C.borrow50));put('sale30T',M.totals(C.sale30));put('rvPayAPT',M.totals(C.rvPayAP));put('rvSale20T',M.totals(C.rvSale20));
put('a3rest',{noAlarmBad:C.a3.bad-C.a3.tp,noAlarmGood:C.a3.good-C.a3.fp,quiet:1000-C.a3.alarms});put('rvExtra',{re:530+C.rvSales1600.is.ni,eqRatio:900.8/600,cfoNi:100/80});
put('rvInv',M.linkedYear(M.OPENING,{...M.YEARS[2024],inv:300}));put('rvCfoInv50',M.cfoBridge({ni:136,dep:60,dAR:30,dInv:50,dAP:10}));
/* 4·8·9장 확인 문제(새 사례): 가상의 회사 간접법, 9월 결산 회사의 사업보고서 기한, 가상의 식품 도매 회사 매출채권 회전일수 */
put('qCfoNew',M.cfoBridge({ni:40,dep:25,dAR:20,dInv:-10,dAP:-5}));put('qCfoWrong',{invSign:40+25-20-10-5,apSign:40+25-20+10+5});
put('qD9',M.deadline('2025-09-30','annual'));put('qD9q',M.deadline('2025-09-30','quarter'));
put('qFood',M.industryRow({name:'가상의 식품 도매 회사',sales:730,cogs:500,invOpen:20,invClose:20,arClose:60,ppeShare:0.2}));put('qFoodWrong',{pctRead:60/730,turnover:730/60});

test('assumptions and rules live in one table each, with the check date',()=>{
 assert.equal(M.CHECKED,'2026-10-13');assert.equal(M.ASSUME.cogsRate,.70);assert.equal(M.ASSUME.taxRate,.20);assert.equal(M.ASSUME.minCash,50);assert.equal(M.ASSUME.borrowStep,50);
 assert.equal(M.RULES.annualDays,90);assert.equal(M.RULES.interimDays,45);assert.equal(M.RULES.grade.interimDays,'news');assert.equal(M.RULES.grade.holiday,'unknown');
 const src=read('js/math.js');for(const n of ['0.70','0.18','0.20'])assert.equal(src.split(n).length-1,1,n+' appears only in ASSUME');
 assert.equal((src.match(/annualDays:90/g)||[]).length,1);for(const v of Object.values(M.assumptions))assert.match(v,/단순화|가정|확인 못함/);
});

test('V-2 재무상태표: 2023 1,050 = 370 + 680, 2024 1,156 = 380 + 776, 2025 1,500.8 = 600 + 900.8',()=>{
 assert.deepEqual([C.open.assets,C.open.liabilities,C.open.equity],[1050,370,680]);assert.deepEqual([C.open.currentAssets,C.open.currentLiabilities],[450,170]);
 assert.deepEqual([Y24.totals.assets,Y24.totals.liabilities,Y24.totals.equity],[1156,380,776]);assert.deepEqual([Y25.totals.assets,Y25.totals.liabilities,Y25.totals.equity],[1500.8,600,900.8]);
 assert.deepEqual(Y24.close,{cash:136,ar:230,inv:170,ppe:620,ap:130,std:50,bond:200,capital:50,surplus:100,re:626});
 assert.deepEqual(Y25.close,{cash:62.8,ar:430,inv:300,ppe:708,ap:150,std:250,bond:200,capital:50,surplus:100,re:750.8});
 assert.deepEqual([Y24.totals.currentAssets,Y24.totals.noncurrentAssets],[536,620],'ch2 check question');
 const b=M.totals(C.borrow50);assert.deepEqual([b.assets,b.liabilities,b.equity],[1100,420,680]);
 const s=M.totals(C.sale30);assert.deepEqual([C.sale30.ar-200,C.sale30.inv-150,C.sale30.re-530,s.assets,s.equity],[30,-21,9,1059,689]);
 const eq=M.applyTx(M.OPENING,{kind:'buyEquipment',amount:30});assert.equal(M.totals(eq).assets,1050,'buying equipment with cash keeps the total');
 assert.deepEqual(M.classifyCheck({cash:'current',ar:'current',inv:'current',ppe:'noncurrent',ap:'current',std:'current',bond:'current'}).bond,false);
 assert.throws(()=>M.applyTx(M.OPENING,{kind:'payAP',amount:500}),RangeError);assert.throws(()=>M.applyTx(M.OPENING,{kind:'gift',amount:1}),RangeError);
});

test('V-2 L2: 2024 말에서 설비 30 현금 구입 + 매입채무 20 상환 → 1,136 · 360 · 776',()=>{
 const t=M.totals(M.applyTx(M.applyTx(Y24.close,{kind:'buyEquipment',amount:30}),{kind:'payAP',amount:20}));assert.deepEqual([t.assets,t.liabilities,t.equity],[1136,360,776]);
});

test('V-1 발생주의: 2024-12-20 외상 30 → 2024 매출, 2025 현금; 결산일 12-15면 다음 해; L2 매출 35·현금 30',()=>{
 const tx=[{type:'creditSale',amount:30,date:'2024-12-20'},{type:'collect',amount:30,date:'2025-02-20'}];const a=M.accrual(tx);
 assert.deepEqual([a[2024].revenue,a[2024].cashIn,a[2025].revenue,a[2025].cashIn],[30,0,0,30]);assert.equal(M.accrual(tx,'12-15')[2025].revenue,30);
 const l2=M.accrual([{type:'cashSale',amount:10,date:'2024-12-05'},{type:'creditSale',amount:25,date:'2024-12-10'},{type:'collect',amount:25,date:'2025-01-15'},{type:'collect',amount:20,date:'2024-03-10'}]);
 assert.deepEqual([l2[2024].revenue,l2[2024].cashIn],[35,30]);
 const eq=M.accrual([{type:'buyEquipment',amount:50,date:'2024-12-15',pay:'2025-01-10'}]);assert.deepEqual([eq[2024].assetsBought,eq[2024].payable,eq[2024].cashOut,eq[2025].cashOut],[50,50,0,50]);
 assert.throws(()=>M.accrual([{type:'barter',amount:1,date:'2024-01-01'}]),RangeError);assert.throws(()=>M.fiscalYear('2024/01/01'),RangeError);
});

test('V-3 손익계산서: 1,500 → 450 → 180(12.0%) → 170 → 34 → 136, 매출 +10% 고정 225(13.6%, +25%)·비례 198, 이자 22 → 128',()=>{
 const i=C.is24;assert.deepEqual([i.cogs,i.gross,i.sga,i.op,i.pretax,i.tax,i.ni],[1050,450,270,180,170,34,136]);assert.equal(pct(i.opMargin),'12.0');assert.equal(pct(i.netMargin,2),'9.07');
 assert.deepEqual([C.isUpFixed.cogs,C.isUpFixed.op,pct(C.isUpFixed.opMargin),pct(M.change(180,C.isUpFixed.op),0)],[1155,225,'13.6','25']);
 assert.deepEqual([C.isUpRatio.sga,C.isUpRatio.op,pct(M.change(180,C.isUpRatio.op),0)],[297,198,'10']);
 assert.deepEqual([C.isInt22.pretax,C.isInt22.tax,C.isInt22.ni],[160,32,128]);assert.equal(Y25.is.ni,164.8);assert.equal(Y25.is.tax,41.2);assert.equal(Y25.dep,62);
 assert.equal(M.ASSUME.bond*M.ASSUME.bondRate+50*M.ASSUME.stRate,12,'12 = 200 × 5% + 50 × 4%');
 const loss=M.incomeStatement({sales:0});assert.deepEqual([loss.op,loss.tax,loss.ni],[0,0,-10],'loss: no tax');assert.equal(loss.opMargin,null);
 assert.throws(()=>M.incomeStatement({cogsRate:1.2}),RangeError);assert.throws(()=>M.incomeStatement({sales:-1}),RangeError);
});

test('V-3 L2: 매출원가율 72%, 판매비와관리비 270 → 150(10.0%, −16.7%)',()=>{assert.deepEqual([C.isL2.op,pct(C.isL2.opMargin),pct(M.change(180,C.isL2.op))],[150,'10.0','-16.7']);});

test('V-4 간접법: 136 + 60 − 30 − 20 + 10 = 156, −80, −40 → +36; 2025 −83.2 · −150 · +160 → −73.2; L2 매출채권 +80 → 106',()=>{
 assert.deepEqual(Y24.cf.steps.map(s=>s.total),[136,196,166,146,156]);assert.deepEqual([Y24.cf.cfo,Y24.cf.cfi,Y24.cf.cff,Y24.cf.net],[156,-80,-40,36]);
 assert.deepEqual([Y25.cf.cfo,Y25.cf.cfi,Y25.cf.cff,Y25.cf.net,Y25.cf.borrow,Y25.cf.cashBeforeBorrow],[-83.2,-150,160,-73.2,200,-137.2]);
 const l2=M.cfoBridge({ni:136,dep:60,dAR:80,dInv:20,dAP:10});assert.equal(l2.cfo,106);assert.equal(C.l2cash.cf.cfo,106);assert.equal(C.l2cash.close.cash,86);assert.equal(C.l2cash.cf.borrow,0);
 assert.equal(C.rvCfoInv50.cfo,126);assert.equal(M.cfoBridge({ni:100,dep:0,dAR:60,dInv:30,dAP:0}).cfo,10,'ch4 transfer: shop');
});

test('V-5 연동 실험: 2024 네 줄, 설비투자 120, 정거장(매출채권 430 → −44, −64, 150 차입, 86), 배당 60',()=>{
 for(const y of [Y24,Y25])assert.ok(y.checks.every(c=>c.ok),'all four checks hold');
 assert.deepEqual(Y24.checks.map(c=>c.right),[1156,626,136,620]);assert.deepEqual(Y25.checks.map(c=>c.right),[1500.8,750.8,62.8,708]);
 const c=C.capex120;assert.deepEqual([c.is.ni,c.close.cash,c.close.ppe,c.totals.assets,c.cf.borrow],[136,96,660,1156,0]);
 const s=C.station;assert.deepEqual([s.is.ni,s.cf.cfo,s.cf.cashBeforeBorrow,s.cf.borrow,s.close.cash,s.close.std,s.totals.assets,s.totals.liabilities,s.totals.equity],[136,-44,-64,150,86,200,1306,530,776]);
 assert.equal(-64+100,36,'100 borrowed is not enough');assert.ok(s.checks.every(x=>x.ok));
 assert.deepEqual([C.div60.close.re,C.div60.close.cash],[606,116]);
});

test('V-5 L2: 설비투자 200 → 차입 전 16, 50 차입, 기말 현금 66, 단기차입금 100, 유형자산 740, 1,206 = 430 + 776',()=>{
 const l=C.l2link;assert.deepEqual([l.cf.cashBeforeBorrow,l.cf.borrow,l.close.cash,l.close.std,l.close.ppe,l.totals.assets,l.totals.liabilities,l.totals.equity,l.is.ni],[16,50,66,100,740,1206,430,776,136]);
});

/* 결정적 의사 난수(mulberry32). 같은 시드면 같은 입력이 나와 실패를 다시 볼 수 있다. */
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
test('property: the four checks hold for 500 random valid inputs over three chained years (seed 20261013)',()=>{
 const r=rng(20261013),d1=x=>Math.round(x*10)/10,pick=(a,b)=>d1(a+r()*(b-a));
 for(let i=0;i<500;i++){
  let open={cash:pick(0,400),ar:pick(0,600),inv:pick(0,500),ppe:pick(0,2000),ap:pick(0,300),std:pick(0,300),bond:pick(0,400),capital:50,surplus:100,re:0};
  open.re=d1(open.cash+open.ar+open.inv+open.ppe-open.ap-open.std-open.bond-150);
  for(let y=0;y<3;y++){
   const inp={sales:pick(0,5000),ar:pick(0,1500),inv:pick(0,1200),ap:pick(0,600),capex:pick(0,1500),dividend:pick(0,100),cogsRate:d1(r()*100)/100,sgaRate:d1(r()*40)/100};
   const out=M.linkedYear(open,inp);
   for(const c of out.checks)assert.ok(c.ok,`seed case ${i} year ${y}: ${c.name} ${c.left} vs ${c.right}`);
   assert.ok(out.close.cash>=M.ASSUME.minCash-1e-9||out.cf.borrow===0&&out.cf.cashBeforeBorrow>=M.ASSUME.minCash,`case ${i}: cash floor`);
   assert.equal(out.cf.borrow%M.ASSUME.borrowStep,0);assert.ok(out.cf.borrow===0||out.cf.cashBeforeBorrow+out.cf.borrow-M.ASSUME.borrowStep<M.ASSUME.minCash,'borrows the smallest multiple');
   open=out.close;
  }
 }
});
test('boundaries: sales 0, receivables 0, a large capex that forces borrowing',()=>{
 const z=M.linkedYear(M.OPENING,{...M.YEARS[2024],sales:0});assert.ok(z.checks.every(c=>c.ok));assert.equal(z.is.tax,0);assert.equal(z.depInsideCosts,false,'sales 0 breaks the "depreciation inside costs" assumption and says so');
 const a=M.linkedYear(M.OPENING,{...M.YEARS[2024],ar:0});assert.ok(a.checks.every(c=>c.ok));assert.equal(a.cf.cfo,136+60+200-20+10);
 const big=M.linkedYear(M.OPENING,{...M.YEARS[2024],capex:1000});assert.ok(big.checks.every(c=>c.ok));assert.equal(big.cf.borrow,Math.ceil((50-(100+156-1000-40))/50)*50);assert.ok(big.close.cash>=50&&big.close.cash<100);
 assert.throws(()=>M.linkedYear(M.OPENING,{...M.YEARS[2024],capex:-1}),RangeError);assert.throws(()=>M.linkedYear(M.OPENING,{sales:1}),RangeError);
});

test('V-6 비율 2024 · 2025, 듀폰, L2 비교 회사 2.5배 · 150% · 80%',()=>{
 const a=C.r24,b=C.r25;
 assert.deepEqual([pct(a.opMargin),pct(a.netMargin,2),pct(a.roeAvg),pct(a.roeEnd),pct(a.roa),pct(a.debtRatio),pct(a.currentRatio),f1(a.interestCover),a.arTurnover.toFixed(2),f1(a.arDays),a.invTurnover.toFixed(2),f1(a.invDays)],
  ['12.0','9.07','18.7','17.5','12.3','49.0','297.8','15.0','6.98','56.0','6.56','59.1']);
 assert.deepEqual([pct(b.opMargin),pct(b.netMargin,2),pct(b.roeAvg),pct(b.roeEnd),pct(b.roa),pct(b.debtRatio),pct(b.currentRatio),f1(b.interestCover),b.arTurnover.toFixed(2),f1(b.arDays),b.invTurnover.toFixed(2),f1(b.invDays)],
  ['12.0','9.16','19.7','18.3','12.4','66.6','198.2','18.0','5.45','87.2','5.36','86.9']);
 assert.deepEqual([a.avgAssets,a.avgEquity,b.avgAssets,b.avgEquity],[1103,728,1328.4,838.4]);assert.equal(pct(136/1156),'11.8','ending-assets distractor');
 assert.deepEqual([pct(C.dupont.margin,2),C.dupont.turnover.toFixed(2),C.dupont.leverage.toFixed(2),pct(C.dupont.roe)],['9.07','1.36','1.52','18.7']);
 assert.deepEqual([C.l2stab.interestCover,pct(C.l2stab.debtRatio,0),pct(C.l2stab.currentRatio,0)],[2.5,'150','80']);
 assert.throws(()=>M.stability({op:1,interest:0,liabilities:1,equity:1,currentAssets:1,currentLiabilities:1}),RangeError);
});

test('V-7 영업현금흐름 ÷ 순이익, 발생액 비율, 기저율 3% → 24/121 = 19.8%, 2% → 14.0%, 5% → 29.6%, L2 15.0%',()=>{
 assert.deepEqual([C.r24.cfoToNi.toFixed(2),C.r25.cfoToNi.toFixed(2),pct(C.r24.accrualRatio),pct(C.r25.accrualRatio)],['1.15','-0.50','-1.8','18.7']);
 assert.deepEqual([C.a3.bad,C.a3.tp,C.a3.fp,C.a3.alarms,pct(C.a3.precision)],[30,24,97,121,'19.8']);assert.deepEqual([30-24,970-97,1000-121],[6,873,879]);
 assert.equal(pct(C.a2.precision),'14.0');assert.equal(pct(C.a5.precision),'29.6');assert.deepEqual([C.a5.tp,C.a5.fp],[40,95]);assert.equal(pct(C.a1.precision),'7.5');
 assert.equal(pct(C.accL2),'15.0');assert.equal(pct(C.accRv),'-4.0');assert.deepEqual([C.parts24.gap,C.parts24.arInv],[-20,50]);
 assert.throws(()=>M.alarm(1.2,.8,.1),RangeError);assert.throws(()=>M.accrualRatio(1,1,0),RangeError);
});

test('V-8 제출 기한: 2025-03-31(월) · 2026-03-31(화) · 2026-08-14(금) · L2 2026-05-15(금) · 2026-11-14(토, 휴일 처리 확인 못함)',()=>{
 assert.deepEqual([C.d24.date,C.d24.weekday],['2025-03-31','월']);assert.deepEqual([C.d25.date,C.d25.weekday],['2026-03-31','화']);
 assert.deepEqual([C.dHalf.date,C.dHalf.weekday],['2026-08-14','금']);assert.deepEqual([C.dQ1.date,C.dQ1.weekday],['2026-05-15','금']);
 assert.deepEqual([C.dQ3.date,C.dQ3.weekend],['2026-11-14',true]);assert.match(C.dQ3.note,/확인 못함/);assert.equal(F.deadlines.annual.date,'2027-03-31');
 assert.deepEqual(M.filingCalendar(2026).map(([,d])=>d.date),['2026-05-15','2026-08-14','2026-11-14','2027-03-31']);
 assert.equal(M.addDays('2024-02-28',1),'2024-02-29','leap year');assert.throws(()=>M.addDays('2025-02-30',1),RangeError);
 assert.match(M.auditAction('disclaimer').action,/상장폐지/);assert.match(M.auditAction('qualifiedScope').action,/관리종목/);assert.throws(()=>M.auditAction('good'),RangeError);
});

test('4·8·9장 확인 문제(새 사례): 영업현금흐름 50, 9월 결산 사업보고서 기한 2025-12-29(월), 매출채권 회전일수 30.0일',()=>{
 assert.equal(C.qCfoNew.cfo,50);assert.deepEqual([C.qCfoWrong.invSign,C.qCfoWrong.apSign],[30,60]);
 assert.deepEqual([C.qD9.date,C.qD9.weekday,C.qD9q.date],['2025-12-29','월','2025-11-14']);
 assert.deepEqual([f1(C.qFood.arDays),pct(C.qFoodWrong.pctRead),f1(C.qFoodWrong.turnover)],['30.0','8.2','12.2']);
});
test('V-9 업종: 새벽전자 6.56회·59.1일·56.0일·53.6%, 유통 16회·22.8일·9.1일, 소프트웨어 73.0일, L2 12회·30.4일',()=>{
 const t=C.ind;assert.deepEqual([t.saebyeok.invTurnover.toFixed(2),f1(t.saebyeok.invDays),f1(t.saebyeok.arDays),pct(t.saebyeok.ppeShare)],['6.56','59.1','56.0','53.6']);
 assert.deepEqual([t.retail.invTurnover,f1(t.retail.invDays),f1(t.retail.arDays)],[16,'22.8','9.1']);assert.deepEqual([t.software.invTurnover,t.software.invDays,f1(t.software.arDays)],[null,null,'73.0']);
 assert.deepEqual([C.indL2.t,f1(C.indL2.d)],[12,'30.4']);assert.equal(f1(150/1200*365),'45.6');
});

test('V-10 마지막 과제: +21.2%, −53.8%, 87.2일, 86.9일, +20.5%p, 2026 이자 20, 10.8배; L2 매출채권 330 → 16.8, 차이 148',()=>{
 assert.deepEqual([pct(F.niChange),pct(F.cashChange),F.interest2026,F.cover2026.toFixed(1)],['21.2','-53.8',20,'10.8']);
 assert.equal(((F.r2025.accrualRatio-F.r2024.accrualRatio)*100).toFixed(1),'20.5');assert.deepEqual([pct(200/230),pct(130/170)],['87.0','76.5']);
 assert.equal(Y25.cf.steps[2].value+Y25.cf.steps[3].value,-330);
 const l=C.l2final;assert.deepEqual([l.cf.cfo,M.r1(l.is.ni-l.cf.cfo),l.cf.borrow,l.close.cash],[16.8,148,100,62.8]);
});

test('the numbers in docs/index.html #curriculum-case and #chapters L1·L2 cells are the numbers above',()=>{
 const doc=read('docs/index.html'),caseText=doc.slice(doc.indexOf('id="curriculum-case"'),doc.indexOf('id="chapters"')),L=doc.slice(doc.indexOf('id="chapters"'),doc.indexOf('id="style"'));
 for(const s of ['1,050억','370억','680억','1,100억','1,500억','1,050억','270억','180억 원(12.0%)','34억','136억','60억','156억','−80억','−40억','+36억','18.7%','17.5%','12.3%','49.0%','297.8%','15.0배','56.0일','59.1일','−1.8%','121건','24건(19.8%)','2025-03-31','2026-08-14','53.6%','22.8일','9.1일','73.0일'])assert.ok(caseText.includes(s),'case: '+s);
 const l2=['매출 35억 원, 현금 30억 원','자산 1,136억 원, 부채 360억 원, 자본 776억 원','150억 원, 10.0%, −16.7%','(106억 원)','차입 전 현금 16억 원','기말 현금 66억 원','단기차입금 100억 원','유형자산 740억 원','자산 1,206억 원 = 부채 430억 원 + 자본 776억 원','2.5배, 150%, 80%','(15.0%)','(2026-05-15)','12회, 30.4일','영업현금흐름 16.8억 원, 차이 148억 원'];
 for(const s of l2)assert.ok(L.includes(s),'chapters L2: '+s);
 for(const s of ['(536억 원, 620억 원)','128억 원: 세전 160, 법인세 32','(−80억 원, −40억 원)','(606억 원, 116억 원)','(12.3%)','(29.6%)','(73.0일)','(20억 원, 10.8배)','140만 원 → 164만 원'])assert.ok(L.includes(s),'chapters check: '+s);
});

/* 문제에 주어진 입력·날짜·장 번호·권 번호·가정·오답 보기. 계산값(C)과 함께 본문 숫자의 출처가 된다. */
const GIVEN=require('./given.cjs');
const allowedNumbers=()=>{
 const computed=new Set();
 const add=v=>{if(typeof v!=='number'||!Number.isFinite(v))return;const a=Math.abs(v);for(const d of [0,1,2]){computed.add(a.toFixed(d));computed.add((a*100).toFixed(d));computed.add(a.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}));computed.add((a*100).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}));}computed.add(String(a));};
 const walk=o=>{if(Array.isArray(o))o.forEach(walk);else if(o&&typeof o==='object')Object.values(o).forEach(walk);else add(o);};walk(C);
 for(const v of [F.r2025.accrualRatio-F.r2024.accrualRatio,200/230,130/170,136/1156,150/1200*365,300/1200*365,100/1000*365,164.8/1500.8,600/1500.8,M.change(180,C.isUpRatio.op),M.change(180,C.isUpFixed.op),F.niChange,F.cashChange,
  C.rvSga285.op/1500,M.change(140,164),C.rvS2000.op*0.8,216/28,120/12])add(v);
 return new Set([...computed,...GIVEN]);
};
test('every number in content.js and review.json is computed above or given in the problem',()=>{
 const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=ctx.window.SBook,R=JSON.parse(read('review.json'));
 const allowed=allowedNumbers(),strip=s=>String(s).replace(/<[^>]+>/g,' ');
 const text=strip(JSON.stringify(B.chapters.map(c=>[c.title,c.subtitle,c.desc,c.recall,c.paragraphs,c.formula,c.formulaNote,c.flow,c.details,c.warning,c.quiz,c.transfer,c.cross.map(x=>x[2])]))+JSON.stringify(R.chapters));
 const missing=[...new Set(text.match(/\d[\d,]*\d(?:\.\d+)?|\d(?:\.\d+)?/g))].filter(t=>!allowed.has(t.replace(/,$/,'')));
 assert.deepEqual(missing,[],'numbers with no computation or given input: '+missing.join(' '));
});

test('L2 answers from docs/index.html #chapters are not stated or computed in the prose or the review quiz',()=>{
 const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=ctx.window.SBook,R=JSON.parse(read('review.json'));
 const all=JSON.stringify(B.chapters)+JSON.stringify(R.chapters);
 const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 for(const s of ['35억','1,136','360억','10.0%','16.7%','106억','66억','740억','1,206','차입 전 현금 16','단기차입금 100억','2.5배','150%','유동비율 80%','15.0%','12회','30.4','16.8','148억','차입 100억'])assert.doesNotMatch(all,new RegExp('(?<![\\d.,])'+esc(s)),'L2 answer leaked: '+s);
 /* 8장 L2(2026년 1분기 보고서 기한)는 8장까지의 본문·복습에 쓰지 않는다. 마지막 과제는 이 날짜를 확인 시점으로 쓴다. */
 const upToDart=JSON.stringify(B.chapters.filter(c=>c.id!=='final'))+JSON.stringify(Object.entries(R.chapters).filter(([id])=>id!=='final'));
 assert.ok(!upToDart.includes('2026-05-15'),'ch8 L2 date leaked before the final task');
});

test('every function in math.js stays under 100 lines',()=>{
 const lines=read('js/math.js').split('\n');let depth=0,start=null;
 lines.forEach((line,i)=>{const o=(line.match(/\{/g)||[]).length,c=(line.match(/\}/g)||[]).length;if(start===null&&/(function\b|=>\s*\{)/.test(line)&&depth===1)start=[i,depth];depth+=o-c;if(start&&depth<=start[1]){assert.ok(i-start[0]+1<=100,`math.js:${start[0]+1} ${i-start[0]+1} lines`);start=null;}});
});
