/* 금리와 채권 계산의 대표값·경계값·불변 조건. 기준값은 조사 노트(docs/research.html#values)의 V-1~V-9이며,
   math.js를 보지 않고 파이썬으로 따로 계산한 값과 같아야 한다. */
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../js/math.js');
const near=(a,b,eps=1e-9,msg='')=>assert.ok(Math.abs(a-b)<=eps,`${msg} ${a} ≠ ${b}`);
const NARA3={face:10000,couponRate:0.03875,years:3,freq:2};   // 가상 "나라 3년" 채권
const NARA10={face:10000,couponRate:0.045,years:10,freq:2};   // 가상 "나라 10년" 채권
const SAEBYEOK={face:10000,couponRate:0.05,years:3,freq:2};   // 가상 새벽전자 3년 회사채

test('V-1 simple, compound and Fisher real rate',()=>{
 near(M.simpleValue(1e7,0.035,1),10350000,1e-6);
 near(M.compoundValue(1e7,0.035,2),10712250,1e-6);
 near(M.effectiveRate(0.03,12),0.030415956913,1e-11);
 near(M.realRate(0.035,0.029),0.005830903790087,1e-14,'exact Fisher');
 near(M.realRateApprox(0.035,0.029),0.006,1e-15);
 near(M.realRate(0.04376,0.029),0.014344023323615,1e-14);
 near(M.realRate(0.05,0),0.05,1e-15,'no inflation: real = nominal');
 assert.ok(M.realRate(0.02,0.03)<0,'inflation above nominal gives negative real rate');
 assert.throws(()=>M.realRate(0.03,-1),RangeError);
 near(M.discountFactor(0.04,3),1/1.04**3,1e-15);near(M.discountFactor(0.04,0),1,0);
 near(M.discountFactor(0.04,2,1,true),Math.exp(-0.08),1e-15);
 near(M.rolloverValue(1e7,[0.035,0.03,0.03]),10980315,1e-6);
 assert.throws(()=>M.compoundValue(100,-2,1),RangeError);
});

test('V-2 zero-coupon bond: price is discounted face, duration equals maturity',()=>{
 const z1={face:10000,couponRate:0,years:3,freq:1},z2={face:10000,couponRate:0,years:3,freq:2};
 near(M.priceFromYield(z1,0.04),8889.963586709147,1e-8);
 near(M.priceFromYield(z2,0.04),8879.71382186192,1e-8);
 near(M.macaulayDuration(z2,0.04),3,1e-12);
 near(M.macaulayDuration({face:10000,couponRate:0,years:10,freq:2},0.04376),10,1e-12);
 near(M.priceFromYield(z1,0),10000,1e-9,'zero yield: price = face');
 assert.equal(M.cashFlows(z2).filter(x=>x.cf>0).length,1,'only the final payment');
});

test('V-3 par bond: coupon = yield gives face, premium and discount on either side',()=>{
 near(M.priceFromYield(NARA3,0.03875),10000,1e-8);
 near(M.priceFromYield(NARA10,0.045),10000,1e-8);
 assert.ok(M.priceFromYield(NARA3,0.03)>10000,'premium when yield < coupon');
 assert.ok(M.priceFromYield(NARA3,0.05)<10000,'discount when yield > coupon');
 const cf=M.cashFlows(NARA3);assert.equal(cf.length,6);near(cf[0].cf,193.75,1e-12);near(cf[5].cf,10193.75,1e-9);
 assert.throws(()=>M.cashFlows({couponRate:0.03,years:2.3,freq:2}),RangeError);
});

test('V-4 price from yield and YTM round trip, including failure cases',()=>{
 near(M.priceFromYield(NARA3,0.03961),9975.897988575987,1e-8);
 near(M.priceFromYield(NARA10,0.04376),10099.563430841865,1e-8);
 near(M.priceFromYield(NARA10,0.05376),9329.165541777558,1e-8);
 for(const [b,y] of [[NARA3,0.03961],[NARA10,0.04376],[NARA10,0.12],[SAEBYEOK,0.05061],[{couponRate:0,years:5,freq:1},0.0],[NARA3,-0.01]]){
  const r=M.ytm(b,M.priceFromYield(b,y));near(r.ytm,y,1e-10,'round trip');
 }
 assert.throws(()=>M.ytm(NARA3,0),RangeError,'price must be positive');
 assert.throws(()=>M.ytm(NARA3,-5),RangeError);
 assert.throws(()=>M.ytm(NARA3,1e9),RangeError,'no yield in the search range');
 assert.throws(()=>M.ytm(NARA3,100),RangeError,'yield above 100% is outside the default range');
 const wide=M.ytm(NARA3,100,{hi:100});assert.ok(wide.ytm>1,'a wider range finds an extreme yield');near(M.priceFromYield(NARA3,wide.ytm),100,1e-6);
});

test('V-5 duration, convexity and the price-change approximation',()=>{
 near(M.macaulayDuration(NARA3,0.03961),2.8608103499674744,1e-10);
 near(M.modifiedDuration(NARA3,0.03961),2.8052523276189802,1e-10);
 near(M.macaulayDuration(NARA10,0.04376),8.1723231168037,1e-9);
 near(M.modifiedDuration(NARA10,0.04376),7.997341289391808,1e-9);
 near(M.convexity(NARA10,0.04376),76.43442545960005,1e-3);
 near(M.convexity(NARA3,0.03961),9.473592799144027,1e-4);
 assert.ok(M.macaulayDuration(NARA10,0.04376)<10,'coupon bond duration is shorter than maturity');
 assert.ok(M.modifiedDuration(NARA10,0.06)<M.modifiedDuration(NARA10,0.03),'duration falls as yield rises');
 for(const b of [NARA3,NARA10,SAEBYEOK,{couponRate:0,years:7,freq:1}])assert.ok(M.convexity(b,0.04)>0,'convexity positive');
 const up=M.priceChange(NARA10,0.04376,0.01),dn=M.priceChange(NARA10,0.04376,-0.01);
 near(up.exact,-0.0762803159106541,1e-10);near(up.durationOnly,-0.07997341289391809,1e-10);
 near(up.withConvexity,-0.076151691620938,1e-6);near(dn.exact,0.08393104045896127,1e-10);
 assert.ok(dn.exact>-up.exact,'a fall in rates lifts the price more than the same rise lowers it');
 assert.ok(up.durationOnly<up.exact&&dn.durationOnly<dn.exact,'duration alone understates the price on both sides');
 near(M.priceChange(NARA3,0.03961,0).exact,0,1e-15);
 near(M.dv01(NARA10,0.04376),7.997341289391808*10099.563430841865*1e-4,1e-6);
 const fd=(M.priceFromYield(NARA10,0.04377)-M.priceFromYield(NARA10,0.04375))/0.00002;
 near(-fd/M.priceFromYield(NARA10,0.04376),M.modifiedDuration(NARA10,0.04376),1e-6,'D* = −(1/P)dP/dy');
});

test('V-6 accrued interest, dirty and clean price',()=>{
 near(M.accruedInterest(NARA3,73,182),77.71291208791209,1e-10);
 near(M.dirtyPrice(NARA3,0.03961,73,182),10054.679084323549,1e-7);
 near(M.cleanPrice(NARA3,0.03961,73,182),9976.966172235636,1e-7);
 near(M.dirtyPrice(NARA3,0.03961,0,182),M.priceFromYield(NARA3,0.03961),1e-9,'on the coupon date dirty = clean = price');
 near(M.accruedInterest(NARA3,0,182),0,0);
 assert.throws(()=>M.accruedInterest(NARA3,182,182),RangeError);
 assert.throws(()=>M.accruedInterest(NARA3,-1,182),RangeError);
});

test('V-7 yield curve teaching model: hold, two cuts, one hike',()=>{
 const base={base:0.03,spread0:0.002,horizon:1,tpMax:0.015,tpHalf:5},T=[0.25,1,3,10];
 const hold=M.yieldCurveModel(Object.assign({change:0},base),T),cut=M.yieldCurveModel(Object.assign({change:-0.005},base),T);
 near(hold[1].yield,0.0345,1e-12);near(hold[3].yield,0.042,1e-12);
 near(cut[0].yield,0.032089285714285,1e-12);near(cut[2].yield,0.033458333333333,1e-12);near(cut[3].yield,0.03725,1e-12);
 near(M.termSpread(hold,10,0.25),0.042-(0.032+0.015*0.25/5.25),1e-12);
 const flatNoTp=M.yieldCurveModel({base:0.03,change:0,tpMax:0},T);flatNoTp.forEach(c=>near(c.yield,0.03,1e-15,'no change, no premium: flat'));
 const deep=M.yieldCurveModel({base:0.03,change:-0.02,horizon:1,tpMax:0.002},[0.25,10]);
 assert.ok(M.termSpread(deep,10,0.25)<0,'deep expected cuts with a small premium invert the curve');
 near(M.yieldCurveModel({base:0.03,change:-0.01,horizon:0},[2])[0].expected,0.02,1e-15,'immediate change');
 assert.throws(()=>M.yieldCurveModel({base:0.03},[0]),RangeError);
 assert.throws(()=>M.termSpread(hold,7,1),RangeError);
});

test('V-8 credit spread pricing and the expected-loss sketch',()=>{
 near(M.spreadPrice(SAEBYEOK,0.03961,0.011),9983.21734066811,1e-7);
 near(M.spreadPrice(SAEBYEOK,0.03961,0.016),9846.936077268674,1e-7);
 near(M.spreadPrice(SAEBYEOK,0.03961,0),M.priceFromYield(SAEBYEOK,0.03961),1e-12);
 near(M.impliedDefault(0.011,0.4),0.018333333333333,1e-14);
 assert.throws(()=>M.impliedDefault(0.01,1),RangeError);
});

test('V-9 Gordon growth value, its rate sensitivity and the g ≥ r error',()=>{
 near(M.gordonValue(2,0.08,0.03),40,1e-12);
 near(M.gordonValue(2,0.07,0.03),50,1e-12);
 near(M.gordonChange(2,0.08,0.03,-0.01).change,0.25,1e-12);
 near(M.gordonChange(2,0.08,0.03,-0.01,-0.005).change,1/9,1e-12,'growth falling with the rate offsets part of the gain');
 near(M.gordonDuration(0.08,0.03),20,1e-12);
 assert.throws(()=>M.gordonValue(2,0.05,0.05),RangeError,'g = r');
 assert.throws(()=>M.gordonValue(2,0.04,0.05),RangeError,'g > r');
 assert.throws(()=>M.gordonDuration(0.03,0.04),RangeError);
 near(M.gordonValue(0,0.08,0.03),0,0);
});

test('V-10 individual treasury headline: total return over 10 years vs compound annual rate',()=>{
 // 2026년 10월 발행분 10년물: 표면금리 4.510% + 가산금리 0.28%p, 연 복리, 만기 일시 지급(세전)
 const total=M.compoundValue(1,0.0479,10)-1;
 near(total,0.5966,5e-4,'about 59.7% over ten years');
 near(total/10,0.0597,5e-5,'headline "average 6.0% a year" divides the total by ten');
 near(Math.pow(1+total,1/10)-1,0.0479,1e-12,'the compound annual rate is 4.79%');
 near(M.compoundValue(1,0.0495,20)-1,1.628,1e-3,'20-year: 4.520% + 0.43%p → about 162.8%');
 near(M.compoundValue(1,0.04325,5)-1,0.2358,1e-3,'5-year: 4.275% + 0.05%p → about 23.6%');
});

/* 마지막 과제(1년 보유). 출발 곡선은 "두 번 인하" 곡선(기준 3.00%, 기대 변화 −0.50%p). 1년 뒤에는 남은 기대 변화가 0이고
   기준금리가 (가) 2.50% (나) 2.25% (다) 3.00%. 나라 3년·10년은 남은 만기 2년·9년. 이표는 재투자하지 않는다. */
const CURVE={spread0:0.002,horizon:1,tpMax:0.015,tpHalf:5};
const cy=(base,change,T)=>M.yieldCurveModel(Object.assign({base,change},CURVE),[T])[0].yield;
const yearOne=(bond,startChange,spread=0)=>{
 const y0=cy(0.03,startChange,bond.years)+spread;
 return [0.025,0.0225,0.03].map(base=>M.holdingReturn(bond,y0,cy(base,0,bond.years-1)+spread,1));
};

test('V-11 final task: one-year holding returns, expectation vs surprise',()=>{
 const [ga,na,da]=yearOne(NARA10,-0.005);
 near(ga.price0,10642.106657654971,1e-6);near(ga.priceReturn,-0.000592842694107,1e-9,'(가) price barely moves: roll-down vs pull to par');
 near(ga.totalReturn,0.041692018233904,1e-9);near(ga.coupons,450,1e-9);
 near(na.totalReturn-ga.totalReturn,0.018737522934056,1e-9,'(나) − (가)');
 near(da.totalReturn-ga.totalReturn,-0.036266659240372,1e-9,'(다) − (가)');
 const [g3,n3,d3]=yearOne(NARA3,-0.005);
 near(g3.totalReturn,0.037564176926287,1e-9);near(n3.totalReturn-g3.totalReturn,0.004797208786483,1e-9);near(d3.totalReturn-g3.totalReturn,-0.009507178856583,1e-9);
 const [gs,ns,ds]=yearOne(SAEBYEOK,-0.005,0.011);
 near(gs.totalReturn,0.048494729722855,1e-9);near(ns.totalReturn,0.053227188496860,1e-9);near(ds.totalReturn,0.039115177564830,1e-9);
 // 대조: 인하를 반영하지 않은 동결 곡선에서 샀다면 (가)에서도 가격이 뛴다 (기대에서 벗어난 몫)
 const [hg,hn,hd]=yearOne(NARA10,0);
 near(hg.priceReturn,0.038355916557347,1e-9);near(hg.totalReturn,0.082288697310853,1e-9);
 near(hn.totalReturn-hg.totalReturn,0.01946775911897,1e-9);near(hd.totalReturn-hg.totalReturn,-0.037680037806427,1e-9);
 const [hg3,hn3,hd3]=yearOne(NARA3,0);
 near(hn3.totalReturn-hg3.totalReturn,0.004853742409018,1e-9);near(hd3.totalReturn-hg3.totalReturn,-0.009619218020351,1e-9);
 assert.throws(()=>M.holdingReturn(NARA3,0.03,0.03,3),RangeError,'cannot hold past maturity here');
 assert.throws(()=>M.holdingReturn(NARA3,0.03,0.03,0.3),RangeError);
 // 고든: (가) r 8% 그대로 → 배당 2 + 값 40 → 41.2 = 8%. (나) r −0.25%p, (다) r +0.50%p
 const eq=dr=>(M.gordonValue(2.06,0.08+dr,0.03)+2)/40-1;
 near(eq(0),0.08,1e-12);near(eq(-0.0025),0.134210526315789,1e-12);near(eq(0.005),-0.013636363636364,1e-12);
 near((M.gordonValue(2*1.0275,0.0775,0.0275)+2)/40-1,0.0775,1e-12,'growth falling with r keeps r − g');
 near(M.compoundValue(1,0.035,1)-1,0.035,1e-15,'deposit: 3.5% in every branch within one year');
});

test('V-12 curve model: expected inflation above the 2% target steepens the expected path',()=>{
 const T=[1,3,10],base=Object.assign({base:0.03,change:0},CURVE);
 const at=pi=>M.yieldCurveModel(Object.assign({inflationExp:pi},base),T);
 const neutral=at(0.02),hold=M.yieldCurveModel(base,T);
 neutral.forEach((c,i)=>near(c.yield,hold[i].yield,1e-15,'expected inflation at target changes nothing'));
 const hot=at(0.03);near(hot[0].policyChange,0.005,1e-15);
 near(hot[0].yield,0.037,1e-12);near(hot[1].yield,0.041791666666667,1e-12);near(hot[2].yield,0.04675,1e-12);
 const cold=M.yieldCurveModel(Object.assign({inflationExp:0.01},base,{change:-0.005}),T);near(cold[0].policyChange,-0.01,1e-15);
 assert.ok(at(0.04)[1].yield>hot[1].yield&&hot[1].yield>neutral[1].yield,'higher expected inflation, higher yields');
 near(M.yieldCurveModel(Object.assign({inflationExp:0.03,inflationCoef:0},base),[3])[0].yield,hold[1].yield,1e-15,'coefficient 0 switches it off');
 assert.throws(()=>M.yieldCurveModel(Object.assign({inflationExp:NaN},base),[1]),RangeError);
});

/* ── 본문(js/content.js)·복습(review.json)의 숫자 대조 ──
   본문·흐름 그림·확인 문제·복습 문항에 적은 숫자를 BMath로 다시 계산해 적힌 자릿수 그대로 비교한다. */
const pc=(x,d=2)=>(x*100+Math.sign(x)*1e-9).toFixed(d);/* 소수 → % 문자열, 끝자리 5는 올림(3.7625 → 3.763) */
const won=x=>x.toFixed(2);
const Z10={face:10000,couponRate:0,years:10,freq:2};
const HOLD=T=>cy(0.03,0,T),CUT2=T=>cy(0.03,-0.005,T);

test('content ch1 rate',()=>{
 const t10=M.compoundValue(1,0.0479,10)-1,t20=M.compoundValue(1,0.0495,20)-1;
 assert.equal(pc(t10),'59.66');assert.equal(pc(t10/10),'5.97');assert.equal(pc(t10/10,1),'6.0');
 assert.equal((Math.round((0.0451+0.0028)*1e6)/1e4).toFixed(2),'4.79');
 assert.equal((6.33-3.14).toFixed(2),'3.19');
 assert.equal(pc(Math.pow(1+1.628,1/20)-1),'4.95');assert.equal(pc(t20),'162.81');assert.equal(pc(1.628/20,1),'8.1');
 assert.equal(pc(M.realRate(0.035,0.029),3),'0.583');assert.equal(pc(M.realRateApprox(0.035,0.029),1),'0.6');
 near(Math.pow(1.1,3),1.331,1e-12);assert.equal(pc(0.331/3),'11.03');assert.equal(pc(Math.pow(1.331,1/3)-1),'10.00');
 assert.equal(pc(M.compoundValue(1,0.04325,5)-1,1),'23.6');
});

test('content ch2 transmit',()=>{
 assert.equal((3.240-3.00).toFixed(2),'0.24');assert.equal((3.961-3.00).toFixed(3),'0.961');
 assert.equal((2.65-2.81).toFixed(2),'-0.16');assert.equal((3.29-2.62).toFixed(2),'0.67');
 assert.equal((0.0025/0.0001).toFixed(0),'25');assert.equal((4.376-3.961).toFixed(3),'0.415');
});

test('content ch3 bond',()=>{
 const sum=b=>M.cashFlows(b).reduce((s,x)=>s+x.cf,0);
 assert.equal(won(M.cashFlows(NARA3)[0].cf),'193.75');assert.equal(won(M.cashFlows(NARA3)[5].cf),'10193.75');
 assert.equal(won(sum(NARA3)),'11162.50');assert.equal(sum(NARA10),14500);assert.equal(sum(SAEBYEOK),11500);
 assert.equal(M.cashFlows(NARA10).length,20);assert.equal(M.cashFlows(NARA10)[0].cf,225);assert.equal(M.cashFlows(SAEBYEOK)[0].cf,250);
 const z3=M.cashFlows({face:10000,couponRate:0,years:3,freq:2});assert.deepEqual(z3.filter(x=>x.cf>0).map(x=>x.cf),[10000]);
 near(0.03875/0.00125,31,1e-9,'3.875% is a multiple of 0.125%');near(0.045/0.00125,36,1e-9);assert.ok(Math.abs(0.039/0.00125-Math.round(0.039/0.00125))>0.1,'3.900% is not');
 assert.equal(100*0.04*0.5*2*2+100,108,'transfer: 2만 원 × 4 + 100만 원');
});

test('content ch4 price',()=>{
 const P=y=>won(M.priceFromYield(NARA3,y));
 assert.deepEqual([P(0.03),P(0.03875),P(0.03961),P(0.05),P(0.04961)],['10249.25','10000.00','9975.90','9690.17','9700.71']);
 assert.equal((1+0.03961/2).toFixed(6),'1.019805');
 const r=M.ytm(NARA3,M.priceFromYield(NARA3,0.03961));assert.equal(r.iterations,3);assert.equal(pc(r.ytm,3),'3.961');
 assert.equal(pc(M.ytm(NARA3,9800).ytm),'4.60');
 assert.equal(won(M.accruedInterest(NARA3,73,182)),'77.71');assert.equal(won(M.dirtyPrice(NARA3,0.03961,73,182)),'10054.68');assert.equal(won(M.cleanPrice(NARA3,0.03961,73,182)),'9976.97');
 assert.equal(won(M.priceFromYield(NARA10,0.04376)),'10099.56');assert.equal(pc(M.priceChange(NARA3,0.03961,0.01).exact),'-2.76');
 assert.equal(won(193.75/2),'96.88');
});

test('content ch5 duration',()=>{
 assert.deepEqual([M.macaulayDuration(NARA3,0.03961).toFixed(2),M.modifiedDuration(NARA3,0.03961).toFixed(2),M.convexity(NARA3,0.03961).toFixed(2)],['2.86','2.81','9.47']);
 assert.deepEqual([M.macaulayDuration(NARA10,0.04376).toFixed(2),M.modifiedDuration(NARA10,0.04376).toFixed(2),M.convexity(NARA10,0.04376).toFixed(1)],['8.17','8.00','76.4']);
 assert.deepEqual([M.macaulayDuration(Z10,0.04376),M.modifiedDuration(Z10,0.04376).toFixed(2)],[10,'9.79']);
 const u3=M.priceChange(NARA3,0.03961,0.01),u10=M.priceChange(NARA10,0.04376,0.01),d10=M.priceChange(NARA10,0.04376,-0.01),z=M.priceChange(Z10,0.04376,0.01),u2=M.priceChange(NARA10,0.04376,0.02);
 assert.equal(won(u10.price1),'9329.17');
 assert.deepEqual([pc(u3.exact),pc(u10.exact),pc(u3.durationOnly),pc(u10.durationOnly),pc(u3.withConvexity),pc(u10.withConvexity)],['-2.76','-7.63','-2.81','-8.00','-2.76','-7.62']);
 assert.equal(pc(-0.08+0.5*76.4*0.0001),'-7.62');
 assert.equal(pc(d10.exact),'8.39');assert.equal(pc(z.exact),'-9.30');
 assert.deepEqual([pc(u2.exact),pc(u2.durationOnly),pc(u2.withConvexity)],['-14.57','-15.99','-14.47']);
 assert.equal(M.dv01(NARA10,0.04376).toFixed(2),'8.08');
 assert.equal((u10.exact/u3.exact).toFixed(1),'2.8','almost three times');
});

test('content ch6 curve (teaching model)',()=>{
 const f3=x=>pc(x,3);
 assert.deepEqual([f3(HOLD(1)),f3(HOLD(3)),f3(HOLD(10))],['3.450','3.763','4.200']);
 assert.deepEqual([f3(CUT2(3)),f3(CUT2(10))],['3.346','3.725']);
 assert.deepEqual([f3(cy(0.03,0.0025,3)),f3(cy(0.03,0.0025,10))],['3.971','4.438']);
 const hot=T=>M.yieldCurveModel(Object.assign({base:0.03,change:0,inflationExp:0.03},CURVE),[T])[0].yield;
 assert.deepEqual([f3(hot(1)),f3(hot(3)),f3(hot(10))],['3.700','4.179','4.675']);
 const mv=(b,y0,y1)=>pc(M.priceFromYield(b,y1(b.years))/M.priceFromYield(b,y0(b.years))-1);
 assert.deepEqual([mv(NARA3,HOLD,hot),mv(NARA10,HOLD,hot),mv(Z10,HOLD,hot)],['-1.16','-3.72','-4.54']);
 assert.deepEqual([mv(NARA3,HOLD,CUT2),mv(NARA10,HOLD,CUT2)],['1.18','3.90']);
 assert.equal(won(M.priceFromYield(NARA10,CUT2(10))),'10642.11');
 const cold=M.yieldCurveModel(Object.assign({base:0.03,change:0,inflationExp:0.01},CURVE),[3,10]);near(cold[0].yield,CUT2(3),1e-15);near(cold[1].yield,CUT2(10),1e-15);
 assert.equal((4.376-3.961).toFixed(3),'0.415');assert.equal((13.88).toFixed(1),'13.9');
 const inv=M.yieldCurveModel(Object.assign({},CURVE,{base:0.03,change:-0.015,tpMax:0.0025}),[0.25,10]);assert.ok(M.termSpread(inv,10,0.25)<0,'a large expected cut with a small premium inverts the curve');
});

test('content ch7 credit',()=>{
 assert.equal(won(M.spreadPrice(SAEBYEOK,0.03961,0.011)),'9983.22');assert.equal(won(M.spreadPrice(SAEBYEOK,0.03961,0.016)),'9846.94');
 assert.equal(pc(M.spreadPrice(SAEBYEOK,0.03961,0.016)/M.spreadPrice(SAEBYEOK,0.03961,0.011)-1),'-1.37');
 assert.equal(won(M.priceFromYield(NARA3,0.04461)),'9837.15');assert.equal(pc(M.priceFromYield(NARA3,0.04461)/M.priceFromYield(NARA3,0.03961)-1),'-1.39');
 near(M.spreadPrice(SAEBYEOK,0.04461,0.011),M.spreadPrice(SAEBYEOK,0.03961,0.016),1e-9,'rate +0.5%p and spread +0.5%p give the same corporate price');
 assert.ok(M.modifiedDuration(SAEBYEOK,0.05061)<M.modifiedDuration(NARA3,0.03961),'bigger coupon, slightly shorter duration');
 assert.equal(pc(M.impliedDefault(0.011,0.4)),'1.83');assert.equal(pc(0.011*0.6,2),'0.66');assert.equal((4.644-3.961).toFixed(3),'0.683');
 assert.equal(pc(1-Math.pow(1-M.impliedDefault(0.011,0.4),100),0),'84');assert.equal(pc(1-Math.pow(1-0.0183,100),0),'84');
 assert.equal(pc(M.impliedDefault(0.02,0.5),0),'4');
});

test('content ch8 equity',()=>{
 near(M.gordonValue(2,0.08,0.03),40,1e-12);near(M.gordonValue(2,0.07,0.03),50,1e-9);assert.equal(M.gordonValue(2,0.07,0.025).toFixed(2),'44.44');
 assert.equal(pc(M.gordonChange(2,0.08,0.03,-0.01).change,0),'25');assert.equal(pc(M.gordonChange(2,0.08,0.03,-0.01,-0.005).change,1),'11.1');
 near(M.gordonChange(2,0.08,0.03,-0.01,-0.01).change,0,1e-12,'g falling as much as r: no change');
 near(M.gordonDuration(0.08,0.03),20,1e-12);assert.equal(M.gordonValue(2,0.08,0.075).toFixed(0),'400');
 assert.equal((0.25/M.priceChange(NARA10,0.04376,-0.01).exact).toFixed(1),'3.0','about three times nara 10');
 assert.equal(M.gordonValue(2,0.09,0.03).toFixed(2),'33.33');assert.equal(pc(M.gordonChange(2,0.08,0.03,0.01).change,1),'-16.7');
 assert.equal(M.gordonValue(2,0.08,0.055).toFixed(2),'80.00');assert.equal(M.gordonValue(2,0.08,0.025).toFixed(2),'36.36');assert.equal(pc(M.gordonValue(2,0.08,0.025)/40-1,1),'-9.1');
 assert.equal(M.gordonValue(1000,0.06,0.02).toFixed(0),'25000');assert.equal(M.gordonValue(1000,0.05,0.02).toFixed(0),'33333');assert.equal(pc(M.gordonChange(1000,0.06,0.02,-0.01).change,0),'33');
 assert.equal((1000/0.06).toFixed(0),'16667');assert.equal(pc((1000/0.05)/(1000/0.06)-1,0),'20');
 assert.equal((2/0.08).toFixed(0),'25');assert.equal(M.gordonValue(2,0.08,0.05).toFixed(2),'66.67');
});

test('content ch9 holding',()=>{
 const h=dy=>M.holdingReturn(NARA3,0.03961,0.03961+dy,1);
 assert.deepEqual([won(h(0).price1),pc(h(0).totalReturn)],['9983.62','3.96']);
 assert.deepEqual([won(h(0.01).price1),pc(h(0.01).totalReturn),pc(h(0.01).priceReturn)],['9795.63','2.08','-1.81']);
 assert.deepEqual([won(h(-0.01).price1),pc(h(-0.01).totalReturn)],['10176.23','5.89']);
 assert.equal(won(h(0).coupons),'387.50');
});

test('content ch10 final: one year after the two-cut curve',()=>{
 const [ga,na,da]=yearOne(NARA10,-0.005),[g3,n3,d3]=yearOne(NARA3,-0.005),[gs,ns,ds]=yearOne(SAEBYEOK,-0.005,0.011);
 assert.deepEqual([won(g3.price0),won(ga.price0),won(gs.price0),pc(CUT2(3)+0.011,3)],['10149.85','10642.11','10154.05','4.446']);
 assert.equal(pc(cy(0.025,0,9),3),'3.664');
 assert.deepEqual([pc(ga.priceReturn),pc(ga.totalReturn),ga.coupons],['-0.06','4.17',450]);
 const N9={face:10000,couponRate:0.045,years:9,freq:2},aged=M.priceFromYield(N9,CUT2(10));
 assert.deepEqual([pc(aged/ga.price0-1),pc(ga.price1/aged-1)],['-0.51','0.45'],'pull to par vs roll-down');
 assert.ok(M.priceFromYield({face:10000,couponRate:0.03,years:9,freq:2},CUT2(10))>M.priceFromYield({face:10000,couponRate:0.03,years:10,freq:2},CUT2(10)),'a discount bond rises as it ages: both forces point up');
 assert.deepEqual([pc(g3.totalReturn),pc(gs.totalReturn)],['3.76','4.85']);
 assert.deepEqual([pc(na.totalReturn-ga.totalReturn),pc(da.totalReturn-ga.totalReturn)],['1.87','-3.63']);
 assert.deepEqual([pc(n3.totalReturn-g3.totalReturn),pc(d3.totalReturn-g3.totalReturn)],['0.48','-0.95']);
 assert.deepEqual([pc(ns.totalReturn-gs.totalReturn),pc(ds.totalReturn-gs.totalReturn)],['0.47','-0.94']);
 near(cy(0.0225,0,9)-cy(0.025,0,9),-0.0025,1e-15);near(cy(0.03,0,2)-cy(0.025,0,2),0.005,1e-15,'parallel shift at every maturity');
 assert.deepEqual([M.modifiedDuration(N9,cy(0.025,0,9)).toFixed(1),M.modifiedDuration({face:10000,couponRate:0.03875,years:2,freq:2},cy(0.025,0,2)).toFixed(1)],['7.4','1.9']);
 const eq=dr=>(M.gordonValue(2.06,0.08+dr,0.03)+2)/40-1,eqg=(M.gordonValue(2*1.0275,0.0775,0.0275)+2)/40-1;
 assert.deepEqual([M.gordonValue(2.06,0.08,0.03).toFixed(1),pc(eq(0),1),pc(eq(-0.0025),1),pc(eq(0.005),1),pc(eq(-0.0025)-eq(0),1),pc(eq(0.005)-eq(0),1),pc(eqg)],['41.2','8.0','13.4','-1.4','5.4','-9.4','7.75']);
 const dep=M.compoundValue(1,0.035,1)-1,sum=i=>(dep+[g3,n3,d3][i].totalReturn+[ga,na,da][i].totalReturn+[gs,ns,ds][i].totalReturn+[eq(0),eq(-0.0025),eq(0.005)][i])/5;
 assert.deepEqual([pc(sum(0)),pc(sum(1)),pc(sum(2))],['4.86','6.50','1.88']);
 assert.equal(Math.round(1e7*sum(0)/1000)*1000,486000,'about 486 thousand won');
 const [hg,hn,hd]=yearOne(NARA10,0),[hg3,hn3,hd3]=yearOne(NARA3,0);
 assert.deepEqual([pc(HOLD(10),3),pc(hg.priceReturn),pc(hg.totalReturn),pc(hn.totalReturn-hg.totalReturn),pc(hd.totalReturn-hg.totalReturn)],['4.200','3.84','8.23','1.95','-3.77']);
 assert.deepEqual([pc(hn3.totalReturn-hg3.totalReturn),pc(hd3.totalReturn-hg3.totalReturn)],['0.49','-0.96']);
 assert.ok(hg.totalReturn-ga.totalReturn>0.04,'more than 4%p apart');
 assert.equal(pc(450/ga.price0),'4.23');
});

test('lab prediction answers (L2) proposed for the guides',()=>{
 /* 1 rate: 5년물 총수익 23.58%("연평균 4.7%")의 연 복리 금리 */
 const t5=M.compoundValue(1,0.04325,5)-1;assert.equal(pc(t5),'23.58');assert.equal(pc(t5/5,1),'4.7');assert.equal(pc(Math.pow(1+t5,1/5)-1,3),'4.325');
 /* 2 transmit: 0.50%p 인하를 믿던 시장에서 0.25%p만 내리고 추가 기대가 사라지면 */
 assert.deepEqual([pc(CUT2(3),3),pc(cy(0.0275,0,3),3),pc(cy(0.0275,0,3)-CUT2(3),2)],['3.346','3.513','0.17']);
 assert.deepEqual([pc(CUT2(10),3),pc(cy(0.0275,0,10),3)],['3.725','3.950']);
 /* 3 bond: 새벽전자를 연 1회 이자로 바꾸면 이자 합은 같고 시점만 달라진다 */
 const y1={face:10000,couponRate:0.05,years:3,freq:1},int=b=>M.cashFlows(b).reduce((s,x)=>s+x.cf,0)-10000;assert.deepEqual([int(y1),int(SAEBYEOK)],[1500,1500]);assert.equal(M.cashFlows(y1)[0].cf,500);
 /* 4 price: 나라 10년을 시장 금리 3.5%로 */
 assert.equal(won(M.priceFromYield(NARA10,0.035)),'10837.64');
 /* 5 duration: 나라 10년 +3%p */
 const u3=M.priceChange(NARA10,0.04376,0.03);assert.deepEqual([pc(u3.exact),pc(u3.durationOnly),pc(u3.withConvexity)],['-20.88','-23.99','-20.55']);
 /* 6 curve: "한 번 인상" 곡선에서 실제로 0.25%p 올리고 추가 기대가 사라지면 */
 assert.deepEqual([pc(cy(0.03,0.0025,10),4),pc(cy(0.0325,0,10),4),pc(cy(0.0325,0,10)-cy(0.03,0.0025,10),4)],['4.4375','4.4500','0.0125']);
 assert.deepEqual([pc(cy(0.03,0.0025,3),3),pc(cy(0.0325,0,3),3)],['3.971','4.013']);
 /* 7 credit: 스프레드 3.00%p */
 assert.equal(won(M.spreadPrice(SAEBYEOK,0.03961,0.03)),'9477.20');near(M.impliedDefault(0.03,0.4),0.05,1e-15);
 /* 8 equity: g 5%에서 할인율 −1%p */
 assert.equal(M.gordonValue(2,0.08,0.05).toFixed(2),'66.67');near(M.gordonChange(2,0.08,0.05,-0.01).change,0.5,1e-12);assert.equal(M.gordonDuration(0.08,0.05).toFixed(1),'33.3');
 /* 9 holding: 같은 +1%p라도 남은 만기 1년에 팔 때가 2년에 팔 때보다 덜 깎인다 */
 const hit=k=>M.holdingReturn(NARA3,0.03961,0.04961,k).price1/M.holdingReturn(NARA3,0.03961,0.03961,k).price1-1;
 assert.deepEqual([pc(hit(1)),pc(hit(2))],['-1.88','-0.96']);
 /* 10 final: (다)에서 새벽전자 스프레드가 0.5%p 벌어지면 */
 const y0=CUT2(3)+0.011,dw=M.holdingReturn(SAEBYEOK,y0,cy(0.03,0,2)+0.016,1),[gs]=yearOne(SAEBYEOK,-0.005,0.011);
 assert.deepEqual([pc(dw.totalReturn),pc(dw.totalReturn-gs.totalReturn)],['2.98','-1.86']);
});

test('review.json numbers',()=>{
 assert.equal((3.5+2.9).toFixed(1),'6.4');assert.equal((1.10*0.6).toFixed(2),'0.66');assert.equal(pc(M.realRate(0.035,0.029),3),'0.583');
 assert.equal(won(M.priceFromYield(NARA3,0.03)),'10249.25');assert.equal(won(M.accruedInterest(NARA3,73,182)),'77.71');
 assert.equal(M.modifiedDuration(Z10,0.04376).toFixed(2),'9.79');assert.equal(pc(M.priceChange(NARA10,0.04376,-0.01).exact),'8.39');
 assert.equal(M.gordonValue(2,0.08,0).toFixed(0),'25');
 const h=M.holdingReturn(NARA3,0.03961,0.04961,1);assert.deepEqual([pc(h.totalReturn),pc(h.priceReturn),won(h.price1)],['2.08','-1.81','9795.63']);
});

test('content.js and review.json have the template fields',()=>{
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
 const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/content.js'),'utf8'),ctx);
 const B=JSON.parse(JSON.stringify(ctx.window.BBook)),ids=['rate','transmit','bond','price','duration','curve','credit','equity','holding','final'];
 assert.deepEqual(B.chapters.map(c=>c.id),ids);
 B.sources.forEach(s=>{assert.equal(s.length,3);assert.match(s[1],/^https:\/\//);assert.ok(s[2].length>20);assert.match(s[2],/S\d+/,'each note names its research row');});
 const advice=/(사세요|파세요|매수하세요|매도하세요|추천|권합니다|오를 것|내릴 것|오를 겁니다|내릴 겁니다|사 두세요|사야 합니다)/;
 const labs=new Set();
 B.chapters.forEach((c,i)=>{
  for(const k of ['title','subtitle','desc','time','group','recall','formula','formulaNote','warning'])assert.ok(typeof c[k]==='string'&&c[k].length,c.id+' '+k);
  assert.equal(c.labs.length,1);labs.add(c.labs[0]);assert.equal(c.paragraphs.length,4,c.id);assert.equal(c.flow.length,4);c.flow.forEach(x=>assert.match(x,/^[^|]+\|[^|]+$/,c.id+' flow'));
  for(const q of [c.quiz,c.transfer]){assert.equal(q[1].length,3);assert.ok(q[2]>=0&&q[2]<3);assert.ok(q[3].length>20);}
  assert.ok(Array.isArray(c.source)&&c.source.length>0&&c.source.every(n=>n>=0&&n<B.sources.length),c.id+' source index');
  assert.ok(Array.isArray(c.cross)&&c.details.length>=1);c.cross.forEach(x=>{assert.equal(x.length,3);assert.match(x[1],/^\.\.\/[a-z0-9-]+\/#[a-z0-9-]+$/);assert.ok(x[2].length>10);});
  assert.doesNotMatch(JSON.stringify(c),advice,c.id+' no advice or prediction');
  assert.doesNotMatch(JSON.stringify(c),/<(?!\/?(p|b)>)/,c.id+' only <p> and <b> tags');
  if(i<ids.length-1){assert.ok(c.paragraphs[3].trim().endsWith('?'),c.id+' ends with the remaining question');assert.ok(B.chapters[i+1].desc.endsWith('?'));}
 });
 assert.equal(labs.size,10,'one distinct lab per chapter');
 B.chapters.slice(0,9).forEach((c,i)=>assert.equal(c.paragraphs[3].trim().slice(-5),B.chapters[i+1].desc.slice(-5),c.id+': the remaining question leads to the next desc'));
 const all=JSON.stringify(B.chapters);
 const first=(name,mark)=>{const i=all.indexOf(name);assert.ok(i>=0,name);assert.ok(all.slice(Math.max(0,i-40),i+120).includes(mark),name+' is introduced as fictional');};
 first('물결은행','가상');first('나라 10년','가상');first('새벽전자','가상');first('누리200','가상');
 assert.ok(B.chapters[2].paragraphs[1].includes('가상의 국채'),'나라 3년 is introduced as a fictional government bond');
 assert.ok(/확인 2026-10-12/.test(JSON.stringify(B.chapters[1]))&&JSON.stringify(B.chapters[1]).includes('2026-10-22'),'base rate carries its check date and next decision');
 assert.ok(B.chapters[3].paragraphs[0].includes('실제 금리를 가상 채권에 넣은 값'),'real yields on fictional bonds are labelled');
 assert.ok(/권유가 아닙니다|뜻이 아닙니다/.test(JSON.stringify(B.chapters[9])),'equal split is not advice');
 const R=JSON.parse(fs.readFileSync(path.join(__dirname,'../review.json'),'utf8'));assert.equal(R.schema,1);assert.equal(R.book,'bonds');assert.deepEqual(Object.keys(R.chapters),ids);
 const pos=[0,0,0];
 Object.values(R.chapters).forEach(list=>{assert.equal(list.length,3);list.forEach(q=>{assert.equal(q.choices.length,3);assert.ok(q.answer>=0&&q.answer<3);pos[q.answer]++;assert.ok(q.why.length>20);assert.doesNotMatch(q.q+q.why,advice);});});
 assert.ok(Math.min(...pos)>=8,'answers spread over the three positions: '+pos);
});
