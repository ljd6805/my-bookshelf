/* 돈의 시간 가치 계산의 대표값·경계값·불변 조건. 본문(js/content.js)과 안내 상자(js/lab-guides.js) 결과 읽기의 숫자도 여기서 대조한다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,eps=1e-6,msg)=>assert.ok(Math.abs(a-b)<=eps,`${msg||''} ${a} ≠ ${b}`);
const R=Math.round;
test('simple and compound growth: 1,000만 at 3%',()=>{
 assert.equal(M.simpleFV(1e7,3,10),13e6);assert.equal(R(M.compoundFV(1e7,3,10)),13439164);
 assert.equal(R(M.simpleFV(1e7,3,30)),19e6);assert.equal(R(M.compoundFV(1e7,3,30)),24272625);
 assert.equal(R(M.compoundFV(1e7,3,1)),10300000);assert.equal(R(M.compoundFV(1e7,3,2)-M.compoundFV(1e7,3,1)),309000);
 assert.equal(R(M.compoundFV(1e7,-3,10)),7374241);
 assert.equal(M.compoundFV(1e7,3,0),1e7);assert.equal(M.simpleFV(1e7,0,10),1e7);assert.equal(M.compoundFV(1e7,0,10),1e7);
 near(M.compoundFV(1e7,3,1,12),1e7*(1+M.ear(3,12)/100),1e-6,'m-period FV equals EAR growth');
 near(Math.pow(1.3,.1)*100-100,2.658,1e-3,'30% over 10 years');
});
test('effective annual rate and continuous compounding',()=>{
 near(M.ear(3,1),3,1e-12);assert.equal(M.ear(3,12).toFixed(4),'3.0416');assert.equal(M.ear(6,12).toFixed(2),'6.17');
 assert.equal(M.ear(3,Infinity).toFixed(4),'3.0455');assert.ok(M.ear(3,365)<M.ear(3,Infinity)&&M.ear(3,365)>M.ear(3,12));
 near(M.continuousFV(1e7,3,1)/1e7-1,M.ear(3,Infinity)/100,1e-12);assert.equal(M.ear(0,12),0);
});
test('rule of 72 against the exact doubling time',()=>{
 assert.equal(M.rule72(6),12);assert.equal(M.doublingYears(6).toFixed(2),'11.90');assert.equal(M.doublingYears(3).toFixed(2),'23.45');
 assert.equal(M.rule72(9),8);assert.equal(M.doublingYears(9).toFixed(2),'8.04');assert.equal(M.doublingYears(M.ear(6,12)).toFixed(2),'11.58');
 for(let r=4;r<=12;r+=.5)assert.ok(Math.abs(M.rule72(r)-M.doublingYears(r))<.5,`72 rule within half a year at ${r}%`);
 near(M.compoundFV(1,7,M.doublingYears(7)),2,1e-12,'doubling');assert.equal(M.doublingYears(0),Infinity);
});
test('present value reverses compounding',()=>{
 assert.equal(R(M.pv(11e6,3,3)),10066558);assert.equal(R(M.pv(11e6,5,3)),9502214);
 assert.equal(R(M.pv(1e6,5,1)),952381);assert.equal(R(M.pv(1e6,5,30)),231377);assert.equal(R(M.pv(1102500,5,2)),1e6);
 assert.equal(R(M.pv(3.3e6,4,3)),2933688);near(M.pv(M.compoundFV(123456,4.2,7),4.2,7),123456,1e-6);assert.equal(M.pv(5e6,3,0),5e6);
});
test('level payment and the three repayment schedules (600만, 6%, 36개월)',()=>{
 assert.equal(R(M.payment(6e6,6,36)),182532);assert.equal(M.payment(6e6,0,36),6e6/36);
 const L=M.schedule(6e6,6,36,'level'),P=M.schedule(6e6,6,36,'principal'),B=M.schedule(6e6,6,36,'bullet');
 assert.deepEqual([L.first.interest,L.first.principal,L.first.pay],[30000,152532,182532]);assert.equal(L.totalInterest,571136);
 assert.deepEqual([P.first.principal,P.first.pay],[166667,196667]);assert.equal(P.totalInterest,555000);
 assert.deepEqual([B.first.pay,B.last.pay],[30000,6030000]);assert.equal(B.totalInterest,1080000);
 for(const s of [L,P,B]){assert.equal(s.last.left,0);assert.equal(s.rows.length,36);assert.equal(s.rows.reduce((a,r)=>a+r.principal,0),6e6);assert.equal(s.totalPay,6e6+s.totalInterest);}
 assert.ok(L.rows.slice(0,35).every(r=>r.pay===182532),'level months equal until the last');
 for(let k=1;k<36;k++)assert.ok(L.rows[k].interest<=L.rows[k-1].interest);
 assert.equal(L.rows[11].left,4118431);assert.equal(L.rows.slice(12).reduce((a,r)=>a+r.interest,0),262321);
 const Z=M.schedule(6e6,0,36,'level');assert.equal(Z.totalInterest,0);assert.equal(Z.last.left,0);
 const one=M.schedule(1e6,12,1,'level');assert.equal(one.rows.length,1);assert.equal(one.last.left,0);assert.equal(one.totalInterest,10000);
});
test('installment savings: 50만 × 12 at 3%',()=>{
 const s=M.savings(5e5,12,3);assert.equal(s.principal,6e6);assert.equal(s.interest,97500);assert.equal(s.tax,15015);assert.equal(s.net,82485);assert.equal(s.effective,1.625);
 assert.equal(M.lumpInterest(6e6,3,12),180000);assert.equal(M.savings(5e5,12,3,0).tax,0);assert.equal(M.savings(5e5,12,0).interest,0);
});
test('NPV and IRR, including two roots and none',()=>{
 assert.equal(M.npv(5,[-100,60,60]).toFixed(2),'11.56');assert.equal(M.npv(0,[-100,60,60]),20);
 const r=M.irr([-100,60,60]);assert.equal(r.length,1);assert.equal(r[0].toFixed(2),'13.07');near(M.npv(r[0],[-100,60,60]),0,1e-9);
 const two=M.irr([-100,230,-132]);assert.equal(two.length,2);near(two[0],10,1e-6);near(two[1],20,1e-6);
 assert.ok(M.npv(15,[-100,230,-132])>0&&M.npv(5,[-100,230,-132])<0&&M.npv(25,[-100,230,-132])<0);assert.equal(M.npv(15,[-100,230,-132]).toFixed(2),'0.19');
 assert.deepEqual(M.irr([100,10]),[]);assert.deepEqual(M.irr([-100,-10]),[]);
 assert.equal(M.npv(2,[-50,30,30]).toFixed(1),'8.2');
 const loan=M.irr([6e6,...Array(36).fill(-182532)]);assert.equal(loan.length,1);assert.equal(loan[0].toFixed(3),'0.500');
 assert.equal(M.npv(7,[42]),42);
});
test('real return after tax and inflation',()=>{
 const a=M.real(3,2,15.4);near(a.after,2.538,1e-12);assert.equal(a.exact.toFixed(3),'0.527');assert.equal(a.approx.toFixed(3),'0.538');
 assert.equal(M.real(3,3,15.4).exact.toFixed(2),'-0.45');assert.equal(M.real(3,2).exact.toFixed(2),'0.98');
 near(M.real(2,2).exact,0,1e-12);assert.ok(M.real(1,3).exact<0);near((1.03/1.05-1)*100,-1.905,1e-3);
});
test('arithmetic mean vs CAGR, swing around a fixed mean',()=>{
 const h=M.cagr([50,-50],1e7);assert.equal(h.mean,0);assert.equal(h.cagr.toFixed(1),'-13.4');assert.equal(R(h.end),7500000);
 const f=M.cagr([20,-10,15,-5,10],1e7);near(f.mean,6,1e-12);assert.equal(f.cagr.toFixed(2),'5.35');assert.equal(R(f.end),12978900);
 assert.equal(R(M.compoundFV(1e7,6,5)),13382256);assert.equal(R(M.compoundFV(1e7,6,5)-f.end),403356);
 const sw=k=>[20,-10,15,-5,10].map(x=>6+(x-6)*k),ends=[0,.5,1,1.5].map(k=>M.cagr(sw(k),1e7).end);
 for(let i=1;i<ends.length;i++)assert.ok(ends[i]<ends[i-1],'more swing, smaller end');
 assert.equal(R(ends[0]),13382256);assert.equal(R(ends[3]),12474597);assert.equal(M.cagr(sw(1.5)).cagr.toFixed(2),'4.52');
 assert.equal(M.cagr([100,-50]).cagr,0);assert.equal(M.cagr([0]).cagr,0);assert.equal(M.cagr([0]).mean,0);assert.equal(M.cagr([7]).cagr.toFixed(10),'7.0000000000');
 const e=M.cagr([]);assert.ok(Number.isNaN(e.mean)&&Number.isNaN(e.cagr));assert.equal(e.end,1);
 assert.equal(f.approx.toFixed(2),'5.33');
});
test('fee drag compounds over 30 years',()=>{
 const a=M.feeDrag(1e7,6,1,30),b=M.feeDrag(1e7,6,.1,30);
 assert.equal(R(a.noFee),57434912);assert.equal(R(a.withFee),42484626);assert.equal(R(a.lost),14950286);assert.equal(a.lostShare.toFixed(1),'26.0');
 assert.equal(R(b.withFee),55736617);assert.equal(b.lostShare.toFixed(1),'3.0');
 assert.equal((M.feeDrag(100,6,1,1).withFee-100).toFixed(2),'4.94');assert.equal(M.feeDrag(1e7,6,0,30).lost,0);
 assert.equal(R(M.feeDrag(1e7,6,2.3,30).withFee),28576752);
 assert.equal((M.feeDrag(1,0,3,10).withFee*100).toFixed(1),'73.7');
});
test('repay vs invest at three years',()=>{
 const r=M.repayVsInvest(6e6,6,3,[-10,5,8],.1,0);
 assert.equal(R(r.repay),7146096);assert.deepEqual(r.invest.map(x=>R(x.end)),[4360891,6924934,7535620]);
 assert.deepEqual(r.invest.map(x=>R(x.diff)),[-2785205,-221162,389524]);assert.equal(r.breakEven.toFixed(2),'6.11');
 const at=M.repayVsInvest(6e6,6,3,[r.breakEven],.1,0);near(at.invest[0].diff,0,1e-6,'break-even');
 const t=M.repayVsInvest(6e6,6,3,[5,8],.1,15.4);assert.deepEqual(t.invest.map(x=>R(x.end)),[6782494,7299134]);
 assert.equal(R(M.compoundFV(6e4,6,3)),71461);assert.equal(R(M.repayVsInvest(6e6,0,3,[],0,0).repay),6e6);
});
test('choice order rotates the answer to the target slot',()=>{
 for(let a=0;a<3;a++)for(let t=0;t<3;t++)assert.equal(M.choiceOrder(3,a,t)[t],a);
});
test('repayVsInvest taxes gains only, never losses',()=>{const r=M.repayVsInvest(6e6,6,3,[-10,8],0.1,15.4);assert.equal(Math.round(r.invest[0].end),4360891);assert.equal(Math.round(r.invest[1].end),7299134);});
test('prediction (L2) cases that the chapter prose does not compute',()=>{
 assert.equal(R(M.compoundFV(1e7,3.5,1)),10350000);
 assert.equal(R(M.compoundFV(1e7,6,10)),17908477);assert.equal(R(M.compoundFV(1e7,6,10)-M.simpleFV(1e7,6,10)),1908477);
 assert.equal(M.rule72(4),18);assert.equal(M.doublingYears(4).toFixed(2),'17.67');assert.equal(((M.rule72(4)-M.doublingYears(4))*12).toFixed(1),'3.9');
 assert.equal(((M.rule72(6)-M.doublingYears(6))*12).toFixed(1),'1.3');
 assert.equal(R(M.pv(12e6,4,5)),9863125);
 const s=M.schedule(6e6,6,60,'level');assert.equal(s.totalInterest,959806);assert.equal(s.first.pay,115997);
 assert.equal(M.npv(8,[-100,40,40,40]).toFixed(2),'3.08');assert.equal(M.irr([-100,40,40,40])[0].toFixed(2),'9.70');assert.equal(M.npv(15,[-100,60,60]).toFixed(2),'-2.46');
 const r=M.real(4,3,15.4);near(r.after,3.384,1e-12);assert.equal(r.exact.toFixed(3),'0.373');
 const c=M.cagr([20,-20],1e7);assert.equal(c.mean,0);assert.equal(R(c.end),9600000);assert.equal(c.cagr.toFixed(2),'-2.02');
 const f=M.feeDrag(1e7,6,.5,30);assert.equal(R(f.withFee),49416090);assert.equal(f.lostShare.toFixed(1),'14.0');
 assert.equal(M.repayVsInvest(6e6,6,3,[],.5,0).breakEven.toFixed(2),'6.53');
});
test('break-even after prepayment fee and tax',()=>{
 near(M.breakEvenAfter(6,3,.1),M.repayVsInvest(6e6,6,3,[],.1,0).breakEven,1e-9,'no fee/tax equals breakEven');
 assert.equal(M.breakEvenAfter(6,3,.1).toFixed(2),'6.11');assert.equal(M.breakEvenAfter(6,3,.1,0,1).toFixed(2),'5.75');assert.equal(M.breakEvenAfter(6,3,.1,15.4,0).toFixed(2),'7.13');
 for(const [tax,pre] of [[15.4,0],[0,1],[15.4,1],[15.4,3]]){const b=M.breakEvenAfter(6,3,.1,tax,pre),x=M.repayVsInvest(6e6,6,3,[b],.1,tax).invest[0];near(x.diff+M.compoundFV(6e6*pre/100,6,3),0,1e-6,`tax ${tax} pre ${pre}`);}
 assert.ok(M.breakEvenAfter(0,3,0,15.4,3)<0,'when repaying loses money, the break-even is a loss and no tax applies');
});
test('ch9 transfer: 3만 원 a month for 10 years at 3%',()=>{
 assert.equal(Math.round(3e4*(Math.pow(1.0025,120)-1)/.0025/1e4),419);
 const s=M.savings(3e4,120,3,0);assert.equal(Math.round((s.principal+s.interest)/1e4),414);
 assert.equal(R(1.2e7*.06/12),60000);near(M.npv(10,[-100,55,60.5]),0,1e-9);
});
test('irr records a root at the upper bound and returns none for an all-zero flow',()=>{const r=M.irr([-1,11]);assert.equal(r.length,1);near(r[0],1000,1e-6);assert.deepEqual(M.irr([0,0]),[]);});
