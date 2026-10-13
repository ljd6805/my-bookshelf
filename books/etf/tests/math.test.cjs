/* 지수와 ETF 계산의 대표값·경계값·불변 조건. 기준값은 docs/index.html의 #curriculum-case(공통 사례 성장 계획),
   #chapters의 L1·L2 칸과 마지막 과제, 조사 노트 docs/research.html의 기준값 V-1~V-8이다.
   기대값은 문서의 숫자 문자열과 아래 ref(정수·소수 직접 계산)로 따로 적었고, math.js의 결과와 대조한다.
   마지막 두 테스트는 content.js와 review.json에 나오는 모든 숫자가 여기서 계산했거나 문제에 주어진 숫자인지,
   L2 답이 본문과 복습 문제에 새어 나가지 않았는지 검사한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),M=require('../js/math.js');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const won=x=>Math.round(x).toLocaleString('en-US');                // 15934116 → '15,934,116'
const pct=(x,d=2)=>(x*100).toFixed(d);                              // 0.0375 → '3.75'
const S=[{price:20000,shares:1e7,float:.5},{price:50000,shares:2e6,float:.8},{price:10000,shares:1e7,float:1}];
const up=r=>S.map((s,i)=>({...s,price:s.price*(1+r[i])}));
const IDX=[.010,-.005,.008,-.003,.006],REC1=IDX.map(r=>r-0.0001),REC2=IDX.map((r,i)=>r+[.0005,-.0005,.0005,-.0005,0][i]);
const ref={grow:(P,r,c,n)=>P*Math.pow((1+r)*(1-c),n),trade:(nav,m,r)=>m*(m-1)*r*nav};

/* 책에 나오는 계산값을 한곳에 모은다. 아래 테스트가 기대값과 대조하고, 마지막 테스트가 본문 숫자의 출처로 쓴다. */
const C={};
const put=(k,v)=>{C[k]=v;return v;};
put('base',M.totalCap(S));put('i105',M.indexLevel(M.totalCap(up([.1,0,0])),C.base));put('i9650',M.indexLevel(M.totalCap(up([0,.06,-.2])),C.base));
put('i110',M.indexLevel(4400e8,4000e8));put('rebase',M.rebase(4000e8,4200e8,4700e8));put('jump',M.indexLevel(4700e8,4000e8));put('bumpB',M.indexLevel(4100e8,4000e8));put('rebase2',M.rebase(4000e8,4400e8,4000e8));
for(const m of ['cap','float','equal']){C['w_'+m]=M.weights(S,m);C['r_'+m]=M.indexReturn(C['w_'+m],[.1,-.05,0]);C['l2_'+m]=M.indexReturn(C['w_'+m],[-.08,.04,.02]);C['rv1_'+m]=M.indexReturn(C['w_'+m],[0,.07,0]);C['rv3_'+m]=M.indexReturn(C['w_'+m],[.08,-.04,0]);}
put('drift',M.drift(C.w_equal,[.1,-.05,0]));put('check2',M.indexReturn([.6,.4],[.05,-.05]));
put('cu3',M.createRedeem(3000e8,1e7,3));put('cuL2',M.createRedeem(1500e8,5e6,4));put('red2',M.createRedeem(3000e8,1e7,-2));put('cu5',M.createRedeem(3000e8,1e7,5));
put('inav',M.navFromIndex(303.6));put('gap013',M.gap(30400,30360));put('tickPct',5/30000);put('gapL2',M.gap(12270,12000));put('gapChk',M.gap(29850,30000));put('gapRv',M.gap(30420,30360));
put('bid',M.bidBook(30360,true)[0][0]);put('lp100',M.gapScene({time:'10:30',index:303.6,lp:true,qty:100}));put('auc1000',M.gapScene({time:'15:25',index:303.6,lp:true,qty:1000}));
put('cNuri',M.etfCost('nuri'));put('cGaram',M.etfCost('garam'));put('cChk',M.costs(.0007,.0002,.0005));
put('g10',M.costGap(1e7,.05,.0022,.0013,10));put('g20',M.costGap(2e7,.05,.0022,.0013,20));put('g30',M.costGap(1e7,.05,.0022,.0013,30));put('g9',M.costGap(6e6,.05,.0022,.0013,10));
put('te1',M.trackingError(REC1,IDX));put('te2',M.trackingError(REC2,IDX));put('td1',M.periodReturn(REC1)-M.periodReturn(IDX));put('td2',M.periodReturn(REC2)-M.periodReturn(IDX));
put('up10',M.rebalance(100,2,.1));put('dn10',M.rebalance(100,2,-.1));put('invL2',M.rebalance(100,-1,.05));put('lchk',M.rebalance(50,2,-.04));put('invDn',M.rebalance(100,-1,-.1));put('rv200',M.rebalance(200,2,.05));put('invRv',M.rebalance(200,-1,-.02));
put('fx1',M.foreignInav(12000,.01));put('fxL2',M.foreignInav(12000,-.005,.008));put('fx2',M.foreignInav(12000,.02));put('fxRv',M.foreignInav(12000,-.01,.02));
put('b3',M.bondMove(.03875,.03961,3,.01));put('b10',M.bondMove(.045,.04376,10,.01));
put('final',M.finalTask(1e7,30900,30000));put('finalL2',M.finalTask(5e6,12300,12000));put('finalRv',M.finalTask(1e7,30600,30000));
put('cmp',M.comparePurpose({amount:6e6,years:10,trips:1}));

test('rules live in one table with the check date, and the unverified items are named',()=>{
 assert.equal(M.CHECKED,'2026-10-13');assert.deepEqual(M.RULES.disclose,{domestic:0.01,foreign:0.02});
 assert.equal(M.RULES.lpClose.domestic,0.02);assert.equal(M.RULES.lpClose.foreign,0.05);assert.equal(M.RULES.lpClose.since,'2026-08-19');
 assert.deepEqual(M.RULES.lpExempt,[['09:00','09:05'],['15:20','15:30']],'pre-open exemption is left out because sources disagree');
 for(const v of Object.values(M.assumptions))assert.match(v,/확인 못함|시나리오/);
 assert.equal(M.CU,100000);assert.equal(M.POINT,100);
 const src=read('js/math.js');assert.equal((src.match(/0\.154/g)||[]).length,1,'15.4% appears only in RULES');
});

test('V-1 세 종목 지수: 4,000억 원 = 100, 새벽전자 +10% → 105.00, 4,400억 → 110.00, 교체 뒤 기준 약 4,476억 원',()=>{
 assert.equal(C.base,2000e8+1000e8+1000e8);assert.equal(C.i105.toFixed(2),'105.00');assert.equal(C.i110.toFixed(2),'110.00');
 assert.equal(Math.round(C.rebase/1e8),4476);assert.equal(M.indexLevel(4700e8,C.rebase).toFixed(2),'105.00','the index carries over the swap');assert.equal(C.jump.toFixed(2),'117.50');
 assert.equal(C.bumpB.toFixed(2),'102.50');assert.equal(Math.round(C.rebase2/1e8),3636);assert.equal(M.indexLevel(4000e8,4000e8).toFixed(2),'100.00');
 assert.equal(M.totalCap(S,true),1000e8+800e8+1000e8);
 assert.throws(()=>M.indexLevel(1,0),RangeError);assert.throws(()=>M.totalCap([]),RangeError);assert.throws(()=>M.marketCap({price:1,shares:1,float:1.2},true),RangeError);
});

test('V-1 L2: 새벽전자 그대로, A사 +6%, B사 −20% → 96.50',()=>{assert.equal(C.i9650.toFixed(2),'96.50');assert.equal((2000+1060+800)/4000*100,96.5);});

test('V-2 가중 방식: +3.75% · +2.14% · +1.67%, L2 −2.50% · −1.00% · −0.67%, 비중과 하루 뒤 비중',()=>{
 assert.deepEqual(C.w_cap.map(w=>pct(w)),['50.00','25.00','25.00']);assert.deepEqual(C.w_float.map(w=>pct(w)),['35.71','28.57','35.71']);assert.deepEqual(C.w_equal.map(w=>pct(w)),['33.33','33.33','33.33']);
 assert.deepEqual([C.r_cap,C.r_float,C.r_equal].map(r=>pct(r)),['3.75','2.14','1.67']);
 assert.deepEqual([C.l2_cap,C.l2_float,C.l2_equal].map(r=>pct(r)),['-2.50','-1.00','-0.67']);
 assert.equal(pct(C.check2),'1.00');assert.deepEqual(C.drift.map(w=>pct(w)),['36.07','31.15','32.79']);
 assert.ok(Math.abs(C.w_float.reduce((a,b)=>a+b,0)-1)<1e-12,'weights sum to 1');
 assert.deepEqual([C.rv1_cap,C.rv1_float,C.rv1_equal].map(r=>pct(r)),['1.75','2.00','2.33'],'review: A사 +7%');
 assert.deepEqual([C.rv3_cap,C.rv3_float,C.rv3_equal].map(r=>pct(r)),['3.00','1.71','1.33'],'review: +8%, −4%, 0%');
 assert.throws(()=>M.weights(S,'price'),RangeError);assert.throws(()=>M.indexReturn([1],[.1,.2]),RangeError);
});

test('V-3 설정·환매: 3 CU → 1,030만 좌·3,090억 원·30,000원, L2 4 CU → 540만 좌·1,620억 원, 환매 20만 좌 → 30,000원',()=>{
 assert.deepEqual([C.cu3.units,C.cu3.assets,C.cu3.nav],[10300000,3090e8,30000]);assert.equal(3*100000*30000,90e8,'90억 원어치 바구니');
 assert.deepEqual([C.cuL2.units,C.cuL2.assets,C.cuL2.nav],[5400000,1620e8,30000]);
 assert.deepEqual([C.red2.units,C.red2.assets,C.red2.nav],[9800000,2940e8,30000]);assert.equal(200000*30000,60e8);
 assert.deepEqual([C.cu5.units,C.cu5.assets],[10500000,3150e8]);
 for(const k of [-5,-1,0,1,7])assert.equal(M.createRedeem(3000e8,1e7,k).nav,30000,'invariant: NAV unchanged for '+k+' CU');
 assert.throws(()=>M.createRedeem(3000e8,1e7,-100),RangeError);assert.throws(()=>M.createRedeem(3000e8,1e7,1.5),RangeError);
});

test('V-4 괴리율: iNAV 30,360원, 30,400원 → +0.13%, 호가 한 칸 0.017%, L2 12,270/12,000 → +2.25%, 확인 −0.50%',()=>{
 assert.equal(C.inav,30360);assert.equal(pct(C.gap013),'0.13');assert.equal(pct(C.gap013,4),'0.1318');assert.equal(pct(C.tickPct,3),'0.017');
 assert.equal(pct(C.gapL2),'2.25');assert.deepEqual([M.gapCheck(C.gapL2,'foreign').disclose,M.gapCheck(C.gapL2,'foreign').lpClose],[true,false],'L2: over 2%, under 5%');
 assert.equal(pct(C.gapChk),'-0.50');assert.equal(pct(C.gapRv,3),'0.198');assert.equal(pct(C.gapRv),'0.20');
 assert.equal(M.gapCheck(0.01).disclose,false,'exactly 1% does not exceed');assert.equal(M.gapCheck(-0.011).disclose,true,'discount counts too');
 assert.deepEqual([M.tick(1999),M.tick(2000),M.tick(30000)],[1,5,5]);assert.equal(M.tickUp(30511.8),30515);assert.equal(M.tickDown(30319),30315);
 assert.throws(()=>M.gap(100,0),RangeError);assert.throws(()=>M.gapCheck(0.01,'mars'),RangeError);
});

test('4장 괴리율 실험: LP 호가 30,320/30,400원, LP 없는 매도 호가, 15:25 매수 1,000주 → 31,275원 +3.01%, AP CU당 9,150만 원',()=>{
 assert.equal(C.lp100.lp,true);assert.equal(C.lp100.price,30400);assert.equal(pct(C.lp100.gap),'0.13');assert.equal(M.bidBook(30360,true)[0][0],30320);
 assert.deepEqual(M.askBook(30360,false).map(a=>a[0]),[30515,30665,30970,31275,31880]);assert.deepEqual(M.askBook(30360,false).map(a=>a[1]),[100,200,300,500,1000]);
 assert.equal(C.auc1000.lp,false,'LP exempt at 15:25');assert.equal(C.auc1000.auction,true);assert.equal(C.auc1000.fill.levels,4);assert.equal(C.auc1000.price,31275);assert.equal(pct(C.auc1000.gap),'3.01');
 assert.equal(C.auc1000.fill.avg,31275,'single price auction: everyone pays the last price');
 const cont=M.gapScene({time:'10:30',index:303.6,lp:false,qty:1000});assert.equal(cont.price,31275);assert.equal(cont.fill.avg,30985.5,'continuous: each level at its own price');
 assert.deepEqual([C.auc1000.ap.action,C.auc1000.ap.perUnit,C.auc1000.ap.perCU],['create',915,91500000]);assert.equal(M.arbitrage(29900,30000).action,'redeem');
 assert.equal(M.gapScene({time:'15:25',index:303.6,lp:true,qty:100}).price,30515);assert.equal(M.gapScene({time:'14:00',index:303.6,lp:true,qty:1000}).price,30400);
 assert.equal(M.lpExempt('09:04'),true);assert.equal(M.lpExempt('09:05'),false);assert.equal(M.lpExempt('15:19'),false);assert.equal(M.lpExempt('15:20'),true);
 assert.equal(M.marketBuy(M.askBook(30360,false),5000).unfilled,2900,'a too-large order is only partly filled');assert.throws(()=>M.marketBuy([],1.5),RangeError);assert.throws(()=>M.lpExempt('3pm'),RangeError);
});

test('V-5 추적 괴리·추적 오차·총비용: −0.20%p, 기록 ①·②, 0.22%·0.13%, 10년 144,308원, L2 20년 923,933원',()=>{
 assert.equal(pct(M.trackingDiff(.078,.08)),'-0.20');
 assert.equal(C.te1.annual<1e-12,true);assert.equal(pct(C.td1),'-0.05');assert.equal(pct(C.td2,3),'-0.001');assert.equal(pct(C.te2.daily),'0.05');assert.equal(pct(C.te2.annual),'0.79');
 assert.equal(pct(C.cNuri.ter),'0.18');assert.equal(pct(C.cNuri.total),'0.22');assert.equal(pct(C.cGaram.total),'0.13');assert.equal(pct(M.ETFS.garam.fee),'0.05');
 assert.deepEqual([pct(C.cChk.ter),pct(C.cChk.total)],['0.09','0.14']);
 assert.deepEqual([C.g10.a,C.g10.b,C.g10.diff],[15934116,16078424,144308]);assert.equal(Math.round(ref.grow(1e7,.05,.0022,10)),15934116);
 assert.deepEqual([C.g20.a,C.g20.b,C.g20.diff],[50779213,51703147,923933]);assert.equal(C.g20.b-C.g20.a,923934,'rounded amounts differ by 923,934원; the book quotes the unrounded gap');
 assert.deepEqual([C.g30.a,C.g30.b,C.g30.diff],[40456095,41565257,1109162]);assert.equal(1e7*0.0009*30,270000);
 assert.throws(()=>M.trackingError([0.1],[0.1]),RangeError);assert.throws(()=>M.grow(100,.05,1.2,1),RangeError);assert.throws(()=>M.grow(100,.05,.01,2.5),RangeError);
});

test('V-6 재조정 매매: +10% → 20억 원 매수, −10% → 20억 원 매도, L2 인버스 +5% → 10억 원 되삼, 확인 4억 원 매도',()=>{
 const r=x=>Math.round(x*100)/100;
 assert.deepEqual([C.up10.after,C.up10.nav,C.up10.target,C.up10.trade].map(r),[220,120,240,20]);
 assert.deepEqual([C.dn10.after,C.dn10.nav,C.dn10.target,C.dn10.trade].map(r),[180,80,160,-20]);
 assert.deepEqual([C.invL2.after,C.invL2.nav,C.invL2.target,C.invL2.trade].map(r),[-105,95,-95,10]);
 assert.deepEqual([C.lchk.after,C.lchk.nav,C.lchk.target,C.lchk.trade].map(r),[96,46,92,-4]);
 assert.deepEqual([C.invDn.after,C.invDn.nav,C.invDn.target,C.invDn.trade].map(r),[-90,110,-110,-20],'본문: 인버스 −10% → 20억 원 더 팖');
 assert.deepEqual([C.rv200.after,C.rv200.nav,C.rv200.target,C.rv200.trade].map(r),[420,220,440,20]);assert.deepEqual([C.invRv.after,C.invRv.nav,C.invRv.trade].map(r),[-196,204,-8]);
 for(const [n,m,x] of [[100,2,.1],[100,-1,.05],[50,2,-.04],[80,3,.02]])assert.ok(Math.abs(M.rebalance(n,m,x).trade-ref.trade(n,m,x))<1e-9,'trade = m(m−1)·r·NAV');
 assert.equal(M.rebalance(100,1,.07).trade,0,'a plain 1× fund never rebalances');
 assert.equal(M.priceLimit(2),0.6);assert.equal(M.priceLimit(-1),0.3);assert.equal(M.priceLimit(),0.3);
 assert.equal(M.rebalanceDays(100,2,[.1,-1/11]).length,2);assert.throws(()=>M.rebalance(100,2,-.6),RangeError);assert.throws(()=>M.rebalance(100,0,.1),RangeError);
});

test('V-7 기초자산별 iNAV: 12,120원, L2 12,036원, 확인 12,240원, 나라 3년 −2.76%, 나라 10년 −7.63%',()=>{
 assert.deepEqual([C.fx1,C.fxL2,C.fx2,C.fxRv],[12120,12036,12240,12118]);assert.equal((12000*0.995*1.008).toFixed(2),'12035.52');assert.equal((12000*0.99*1.02).toFixed(1),'12117.6');
 assert.equal(C.b3.p0.toFixed(2),'9975.90');assert.equal(C.b3.p1.toFixed(2),'9700.71');assert.equal(pct(C.b3.change),'-2.76');assert.equal(pct(C.b10.change),'-7.63');
 assert.equal(M.bondPrice(.04,.04,3).toFixed(6),'10000.000000','a par bond prices at face');
 assert.deepEqual(M.riskTable('synthetic'),{holds:false,counterparty:true,issuerCredit:false,maturity:false});assert.equal(M.riskTable('etn').maturity,true);
 assert.throws(()=>M.riskTable('gold'),RangeError);assert.throws(()=>M.foreignInav(-1,0),RangeError);
});

test('8장 과세 유형: 국내주식형 0, 그 밖의 국내 상장 15.4%, 해외 상장 22%, L2 15.4% 유형 3개, ETF 거래세 0',()=>{
 const t=(u,l)=>M.taxType(u,l);
 assert.deepEqual([t('kstock').type,t('kstock').gainRate],['kequity',0]);assert.deepEqual([t('fstock').type,t('fstock').gainRate],['kother',0.154]);
 assert.deepEqual([t('fstock','foreign').type,t('fstock','foreign').gainRate],['foreign',0.22]);assert.equal(t('derivative').gainRate,0.154,'누리200 2배');
 const l2=[['kstock','domestic'],['bond','domestic'],['commodity','domestic'],['fstock','domestic'],['fstock','foreign']].filter(([u,l])=>t(u,l).gainRate===0.154).length;assert.equal(l2,3);
 assert.equal(t('bond').stt,0);assert.throws(()=>t('crypto'),RangeError);assert.throws(()=>t('kstock','moon'),RangeError);
});

test('V-7 9장 비교: 9,560,470원 · 9,647,055원 · 86,585원, 스프레드 1,000원·6,000원, 월 20번 10,000원·60,000원, 18번, L2 22,500원·135,000원',()=>{
 assert.deepEqual([C.g9.a,C.g9.b,C.g9.diff],[9560470,9647055,86585]);
 assert.deepEqual([M.spreadCost(6e6,30000,5),M.spreadCost(6e6,30000,30)],[1000,6000]);assert.equal(M.shares(6e6,30000),200);
 assert.deepEqual([M.spreadCost(3e6,30000,5,20),M.spreadCost(3e6,30000,30,20)],[10000,60000]);
 assert.deepEqual([M.spreadCost(4.5e6,30000,5,30),M.spreadCost(4.5e6,30000,30,30)],[22500,135000]);assert.equal(M.shares(4.5e6,30000),150);
 assert.deepEqual([M.spreadCost(9e6,30000,5),M.spreadCost(9e6,30000,30)],[1500,9000]);
 assert.equal(C.cmp.bigger,'hold');assert.equal(C.cmp.crossTrips,18);assert.equal(M.comparePurpose({amount:6e6,years:10,trips:18}).trade.diff,90000);assert.equal(M.comparePurpose({amount:6e6,years:10,trips:17}).trade.diff,85000);
 assert.equal(M.comparePurpose({amount:6e6,years:10,trips:18}).bigger,'trade');assert.throws(()=>M.spreadCost(1,30000,5,1.5),RangeError);
});

test('V-8 마지막 과제: +3.00%, 323주 9,980,700원, 현금 19,300원, 9,690,000원, −290,700원(−2.91%), 332주, L2 +2.50% · 406주 · −121,800원',()=>{
 const f=C.final;assert.equal(pct(f.gap),'3.00');assert.deepEqual([f.shares,f.paid,f.cash,f.value,f.loss,f.navShares,f.premium],[323,9980700,19300,9690000,-290700,332,290700]);
 assert.equal(pct(f.lossRate),'-2.91');assert.equal(pct(1-1/1.03),'2.91');
 const g=C.finalL2;assert.equal(pct(g.gap),'2.50');assert.deepEqual([g.shares,g.paid,g.value,g.loss],[406,4993800,4872000,-121800]);
 const h=C.finalRv;assert.equal(pct(h.gap),'2.00');assert.deepEqual([h.shares,h.paid,h.cash,h.value,h.loss],[326,9975600,24400,9780000,-195600]);
 assert.deepEqual([M.gapCheck(.03).disclose,M.gapCheck(.03).lpClose],[true,true]);assert.deepEqual([M.gapCheck(.03,'foreign').disclose,M.gapCheck(.03,'foreign').lpClose],[true,false]);
 assert.equal(M.finalTask(1e7,30900,30000,0.05).premium,290700,'the premium paid does not depend on later index moves');
});

test('the numbers in docs/index.html #curriculum-case and #chapters L1·L2 cells are the numbers above',()=>{
 const doc=read('docs/index.html'),caseText=doc.slice(doc.indexOf('id="curriculum-case"'),doc.indexOf('id="chapters"')),L=doc.slice(doc.indexOf('id="chapters"'),doc.indexOf('id="style"'));
 const caseNums=['4,000억','4,200억','105.00','3.75%','2.14%','1.67%','1,030만','3,090억','303.60',won(C.inav)+'원','30,400원','0.13%','0.017%','7.80%','−0.20%p','0.22%','0.13%',won(C.g10.diff)+'원','20억','12,120원',won(C.g9.a)+'원',won(C.g9.b)+'원',won(C.g9.diff)+'원','1,000원','6,000원','10,000원','60,000원'];
 for(const s of caseNums)assert.ok(caseText.includes(s),'case: '+s);
 const l2=['96.50','−2.50%, −1.00%, −0.67%','540만 좌, 1,620억 원, 30,000원','+2.25%',won(C.g20.diff)+'원',won(C.g20.a)+'원',won(C.g20.b)+'원','105억','95억','10억',won(C.fxL2)+'원','3개','22,500원','135,000원','+2.50%','406주',won(C.finalL2.paid)+'원',won(C.finalL2.value)+'원','−121,800원','110.00','+1.00%','30,000원','−0.50%','0.09%, 0.14%','4억','96억','46억','92억','12,240원','2.76%','7.63%','144,308원','0.017%','30,360원'];
 for(const s of l2)assert.ok(L.includes(s),'chapters: '+s);
});

/* 문제에 주어진 입력·날짜·장 번호·오답 보기. 계산값(C)과 함께 본문 숫자의 출처가 된다. */
const GIVEN=['0','00','01','03','05','06','08','09','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','17','18','19','20','22','25','26','27','30','31','40','46','50','60','80','85','90','92','94.9','96','100','110','120','150','160','180','196','200','204','220','240','250','300','400','420','440','500','600','800','900','980',
 '1980','1990','2007','2019','2020','2021','2023','2024','2026','1,000','1,030','1,050','1,100','1,500','2,000','2,200','2,940','3,000','3,090','3,150','4,000','4,100','4,200','4,400','4,700','5,000','10,000','10,300','12,000','20,000','29,850','30,000','30,420','30,600','30,900','50,000','200,000',
 '7.80','0.001','0.01','0.02','0.03','0.04','0.05','0.06','0.07','0.10','0.15','0.20','0.25','0.30','0.3','0.40','0.5','0.50','0.6','0.60','0.8','0.99','1.0','1.00','1.01','1.02','1.2','1.50','2.00','3.00','3.875','3.961','5.00','5.70','6.00','7.00','8.00','15.4','100.00','300.00','303.60',
 '95.97','100.02', // 8권 마지막 과제의 값, 6장 details의 곁글 “8권을 먼저 읽었다면”에만 둔다
 '104.00','140.00','103.33','12,024','12,360','29,400','31,500','4,500','27,000','12,120']; // 오답 보기
test('every number in content.js and review.json is computed above or given in the problem',()=>{
 const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=ctx.window.EBook,R=JSON.parse(read('review.json'));
 const computed=new Set();const add=v=>{if(typeof v==='number'&&Number.isFinite(v)){computed.add(won(v));for(const d of [0,1,2,3,4])computed.add(Math.abs(v*100).toFixed(d)),computed.add(Math.abs(v).toFixed(d));}};
 const walk=o=>{if(Array.isArray(o))o.forEach(walk);else if(o&&typeof o==='object')Object.values(o).forEach(walk);else add(o);};walk(C);
 for(const v of [C.rebase/1e8,C.rebase2/1e8,C.g10.diff,C.auc1000.ap.perCU/1e4,C.b3.p0,C.b3.p1,12000*0.99*1.02,1e7*0.0009*30,M.comparePurpose({amount:6e6,years:10,trips:18}).trade.diff,M.comparePurpose({amount:6e6,years:10,trips:17}).trade.diff,M.spreadCost(9e6,30000,30),M.spreadCost(3e6,30000,30,20),M.spreadCost(3e6,30000,5,20),M.spreadCost(6e6,30000,30)])add(v);
 /* 9장 본문: 300만 원 · 한 달 20번을 1년(240번) 이어 갈 때의 거래 비용과 1년 보유 비용 차. */
 {const y=M.comparePurpose({amount:3e6,years:1,trips:240});for(const v of [y.hold.diff,y.trade.a,y.trade.b,y.trade.diff/12])add(v);}
 for(const [v,d] of [[C.b3.p0,2],[C.b3.p1,2],[12000*0.99*1.02,1]])computed.add(v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}));
 const allowed=new Set([...computed,...GIVEN]),strip=s=>String(s).replace(/<[^>]+>/g,' ');
 const text=strip(JSON.stringify(B.chapters.map(c=>[c.subtitle,c.desc,c.recall,c.paragraphs,c.formula,c.formulaNote,c.flow,c.details,c.warning,c.quiz,c.transfer]))+JSON.stringify(R.chapters));
 const missing=[...new Set(text.match(/\d[\d,]*\d(?:\.\d+)?|\d(?:\.\d+)?/g))].filter(t=>!allowed.has(t.replace(/,$/,'')));
 assert.deepEqual(missing,[],'numbers with no computation or given input: '+missing.join(' '));
 const aside=B.chapters.find(c=>c.id==='leverage').details.map(d=>d.join(' ')).join(' ');assert.match(aside,/8권을 먼저 읽었다면[\s\S]*100\.02[\s\S]*95\.97/);
 assert.doesNotMatch(strip(JSON.stringify(B.chapters.map(c=>[c.paragraphs,c.flow,c.recall,c.quiz]))+JSON.stringify(R.chapters)),/95\.97|100\.02/,'vol 8 numbers stay in the optional aside');
});

test('L2 answers from docs/index.html #chapters are not stated or computed in the prose or the review quiz',()=>{
 const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=ctx.window.EBook,R=read('review.json');
 const text=JSON.stringify(B.chapters)+R;
 for(const s of ['96.50','−2.50%','−0.67%','540만','1,620억','12,270','2.25%','923,933','50,779,213','51,703,147','12,036','22,500','135,000','12,300','121,800','4,993,800','4,872,000','406주','15.4% 유형 3개','10억 원어치를 되삼','10억 원 되삼'])assert.ok(!text.includes(s),'L2 answer leaked: '+s);
});

test('every function in math.js stays under 100 lines',()=>{
 const lines=read('js/math.js').split('\n');let depth=0,start=null;
 lines.forEach((line,i)=>{const o=(line.match(/\{/g)||[]).length,c=(line.match(/\}/g)||[]).length;if(start===null&&/(function\b|=>\s*\{)/.test(line)&&depth===1)start=[i,depth];depth+=o-c;if(start&&depth<=start[1]){assert.ok(i-start[0]+1<=100,`math.js:${start[0]+1} ${i-start[0]+1} lines`);start=null;}});
});
