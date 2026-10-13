/* 세금과 계좌 계산의 대표값·경계값·불변 조건. 기준값은 docs/index.html의 #curriculum-case(공통 사례 성장 계획),
   #chapters의 L2 답, 마지막 과제, 조사 노트 docs/research.html#values(V-1~V-8)의 숫자다.
   기대값은 math.js를 보지 않고 아래 ref 함수(정수 원 단위 직접 계산)와 문서의 숫자 문자열로 따로 적었다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),M=require('../js/math.js');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const won=s=>Number(String(s).replace(/[^\d−-]/g,'').replace('−','-'));
/* 문서와 독립인 참고 계산: 원 단위 정수로 바로 계산한다. */
const ref={
 flows:(P,n,g,d)=>{const value=Math.round(P*Math.pow(1+g,n));return {value,gain:value-P,income:Math.round(P*d*n),pretax:value-P+Math.round(P*d*n)};},
 cut:(x)=>Math.floor(x+1e-6)
};
const BASE=ref.flows(10000000,3,0.04,0.02);

test('base case: 1,000만 원, 3년, 연 4% + 2% → 세전 1,848,640원',()=>{
 const f=M.roundFlows(M.flows(10000000,3,0.04,0.02));
 assert.deepEqual([f.value,f.gain,f.income,f.pretax],[11248640,1248640,600000,1848640]);
 assert.deepEqual([BASE.value,BASE.pretax],[11248640,1848640]);
 assert.throws(()=>M.flows(-1,3,0.04,0.02),RangeError);assert.throws(()=>M.flows(100,2.5,0.04,0.02),RangeError);assert.throws(()=>M.flows(100,3,-1,0),RangeError);
 assert.equal(M.flows(100,0,0.5,0.1).pretax,0,'zero years: nothing happens');
});

test('V-1 general account after-tax for five products (case 6장)',()=>{
 const f=M.roundFlows(M.flows(10000000,3,0.04,0.02)),after=k=>M.generalTax(k,f).after;
 const div=ref.cut(600000*0.154),etf=ref.cut(1248640*0.154),stt=ref.cut(11248640*0.002);
 assert.deepEqual([div,etf,stt],[92400,192290,22497]);
 assert.equal(after('stock'),1848640-stt-div);assert.equal(after('stock'),1733743);
 assert.equal(after('kequity'),1756240);assert.equal(after('kother'),1563950);assert.equal(after('foreign'),1756240);assert.equal(after('bond'),1756240);
 assert.equal(M.generalTax('kother',f).total,284690);
 assert.ok(M.generalTax('kequity',{...f,gain:-500000,value:9500000,pretax:100000}).total===92400,'a price loss changes nothing for a domestic equity ETF');
});

test('2장 거래세: 시장별 세율, 횟수, ETF 0, L2 코넥스 500만 원 × 24번 = 120,000원',()=>{
 assert.deepEqual([M.stt('kospi',10000000).tax,M.stt('kospi',10000000).rural,M.stt('kospi',10000000).each],[5000,15000,20000]);
 assert.equal(M.stt('kosdaq',10000000).each,20000);assert.equal(M.stt('konex',10000000).each,10000);assert.equal(M.stt('etf',10000000).each,0);
 assert.equal(M.stt('kospi',10000000,24).total,480000,'case: 한 달에 두 번 1,000만 원');
 assert.equal(M.stt('konex',5000000,24).total,5000*24);assert.equal(M.stt('konex',5000000,24).total,120000,'L2');
 assert.equal(M.stt('kospi',3000000).each,6000,'확인 문제');
 assert.equal(ref.cut(19960*10*0.002),399,'4권의 거래세 399원');
 assert.equal(M.stt('kospi',0).each,0);assert.throws(()=>M.stt('nasdaq',100),RangeError);assert.throws(()=>M.stt('kospi',100,1.5),RangeError);
});

test('3장 원천징수와 고배당 분리과세: 200,000 → 169,200, L2 3,000만 원 → 4,800,000원',()=>{
 assert.deepEqual(M.withholding(200000),{income:28000,local:2800,tax:30800,net:169200});
 assert.equal(M.withholding(500000).net,423000,'확인 문제');
 assert.equal(M.highDividendTax(30000000).tax,20000000*0.14+10000000*0.20);assert.equal(M.highDividendTax(30000000).tax,4800000);
 assert.equal(M.highDividendTax(20000000).tax,2800000,'2,000만 원까지는 14%');
 assert.equal(M.highDividendTax(200000).tax,28000,'small dividends: same as withholding income tax');
 assert.equal(M.highDividendTax(400000000).tax,ref.cut(20000000*0.14+280000000*0.2+100000000*0.25));
 assert.equal(M.withholding(0).tax,0);assert.throws(()=>M.withholding(-1),RangeError);
});

test('4장 양도세: 소액주주 0, 대주주 판정, 해외 1,000만 원 → 165만 원, L2 600만 − 150만 → 44만 원',()=>{
 assert.equal(M.domesticGainTax(1248640,false),0);
 assert.equal(M.isBigHolder(4999999999,0.001),false);assert.equal(M.isBigHolder(5000000000,0.001),true);assert.equal(M.isBigHolder(1e8,0.01),true);assert.equal(M.isBigHolder(1e8,0.015,'kosdaq'),false);
 assert.equal(M.domesticGainTax(400000000,true),ref.cut(300000000*0.22+100000000*0.275));
 assert.equal(M.foreignGainTax(10000000).tax,1650000);assert.equal(M.foreignGainTax(2480000).tax,0);assert.equal(M.foreignGainTax(2000000).tax,0,'확인 문제');
 assert.deepEqual(M.foreignGainTax(6000000,1500000),{base:2000000,tax:440000});
 assert.equal(M.foreignGainTax(1000000,3000000).tax,0,'a loss larger than the gain gives no negative tax');
 assert.equal(ref.cut((5000000-2500000)*0.22),550000,'전이: 한 해 500만 원');
});

test('5장 종합과세: 넘는 몫만, 2,100만·24% → 110,000원, L2 2,300만·35% → 693,000원',()=>{
 assert.equal(M.extraTax(19000000,0.24).extra,0);assert.equal(M.extraTax(20000000,0.35).extra,0,'exactly 2,000만 원 is not comprehensive');assert.equal(M.extraTax(20000000,0.35).comprehensive,false);
 assert.equal(M.extraTax(21000000,0.24).extra,110000);assert.equal(M.extraTax(25000000,0.15).extra,55000);
 assert.equal(M.extraTax(19500000,0.35).extra,0);assert.equal(M.extraTax(23000000,0.35).extra,ref.cut(3000000*0.21*1.1));assert.equal(M.extraTax(23000000,0.35).extra,693000);
 assert.equal(M.extraTax(30000000,0.14).extra,0,'marginal 14% adds nothing');assert.throws(()=>M.extraTax(1,0.6),RangeError);
});

test('6장 ETF: 차익 800만 원 → 국내 상장 1,232,000원, 해외 상장 1,210,000원, 같아지는 차익 약 833만 원',()=>{
 assert.equal(ref.cut(8000000*0.154),1232000);assert.equal(M.foreignGainTax(8000000).tax,1210000);
 const f={principal:0,value:8000000,gain:8000000,income:0,pretax:8000000};
 assert.equal(M.generalTax('kother',f).total,1232000);assert.equal(M.generalTax('foreign',f).total,1210000);assert.equal(M.generalTax('kequity',f).total,0,'누리200 차익 500만 원도 0원');
 assert.equal(Math.round(M.breakEvenGain()),8333333);
 const at=g=>[M.generalTax('kother',{...f,gain:g,value:g,pretax:g}).total,M.generalTax('foreign',{...f,gain:g,value:g,pretax:g}).total];
 assert.ok(at(8000000)[0]>at(8000000)[1]&&at(9000000)[0]<at(9000000)[1],'the two lines cross between 800만 and 900만');
});

test('7장 ISA: 3년 0원, 5년 115,486원 vs 487,645원, L2 1,500만 원 → 76,523원, 서민형 0원',()=>{
 const f=M.roundFlows(M.flows(10000000,3,0.04,0.02)),f5=M.roundFlows(M.flows(10000000,5,0.04,0.02)),f15=M.roundFlows(M.flows(15000000,3,0.04,0.02));
 assert.equal(M.isaTax('kother',f).tax,0);assert.equal(M.isaTax('kother',f).after,1848640);
 assert.equal(f5.pretax,3166529);assert.equal(M.isaTax('kother',f5).tax,ref.cut((3166529-2000000)*0.099));assert.equal(M.isaTax('kother',f5).tax,115486);assert.equal(M.generalTax('kother',f5).total,487645);
 assert.equal(487645-115486,372159);assert.equal(M.isaTax('kother',f5,'low').tax,0);
 assert.equal(f15.pretax,2772960);assert.equal(M.isaTax('kother',f15).tax,76523);assert.equal(M.generalTax('kother',f15).total,427035);assert.equal(427035-76523,350512);
 assert.equal(M.isaTaxable('kequity',f),600000);assert.equal(M.isaTax('kequity',f).after,1848640);
 assert.equal(M.isaTax('stock',f,'general',true).after,1826143);assert.equal(M.isaTax('stock',f).after,1848640);
 assert.equal(ref.cut((2500000-2000000)*0.099),49500,'확인 문제');
 assert.throws(()=>M.isaTax('foreign',f),RangeError,'foreign-listed ETF cannot go into ISA');
});

test('8장 연금: 공제 99만 원, 2,406,965원·1,543,615원, IRP, 13.2%, L2 차이 −198,000원, 현재가치 744,093원',()=>{
 const f=M.roundFlows(M.flows(10000000,3,0.04,0.02));
 assert.equal(M.pensionCredit(6000000).credit,990000);assert.equal(M.pensionCredit(10000000).credit,990000);assert.equal(M.pensionCredit(10000000,'irp').credit,1485000);assert.equal(M.pensionCredit(9000000,'both','over').credit,1188000);
 assert.equal(M.pensionCredit(3000000).credit,495000,'확인 문제');
 const ann=1848640-ref.cut(0.055*(6000000+1848640))+990000,early=1848640-ref.cut(0.165*(6000000+1848640))+990000;
 assert.deepEqual([ann,early],[2406965,1543615]);
 assert.equal(M.pensionOutcome(f).after,2406965);assert.equal(M.pensionOutcome(f,'saving','under','early').after,1543615);
 assert.equal(M.pensionOutcome(f,'irp').after,2736965);assert.equal(M.pensionOutcome(f,'irp','under','early').after,1543615);
 assert.equal(M.pensionOutcome(f,'saving','over').after,2208965);assert.equal(M.pensionOutcome(f,'saving','over','early').after,1345615);
 const f6=M.roundFlows(M.flows(6000000,3,0.04,0.02)),o=M.pensionOutcome(f6,'saving','over','early');
 assert.deepEqual([o.credit,o.principalTax,o.credit-o.principalTax],[792000,990000,-198000]);
 assert.equal(M.pensionOutcome(f6,'saving','under','early').credit-M.pensionOutcome(f6,'saving','under','early').principalTax,0,'16.5%: principal tax cancels the credit');
 assert.equal(M.presentValue(1000000,0.03,10),744093);assert.equal(M.presentValue(1000000,0.03,0),1000000);
 assert.equal(100000-M.presentValue(100000,0.04,5),17808,'전이: 유예의 값 약 1만 7,807원(오늘 가치를 버려 1원 차이)');
 assert.ok(Math.abs((100000-100000/Math.pow(1.04,5))-17807.29)<0.01);
});

test('9장 계산기: 기준 사례 네 칸, 일반·ISA 차이 92,400 / 284,690, L2 원금 500만 원 → 46,200 / 142,345',()=>{
 const t=k=>M.afterTaxTable({kind:k,principal:10000000,years:3,growth:0.04,payout:0.02}),c=t('kother').cells;
 assert.deepEqual([c.general.after,c.isa.after,c.annuity.after,c.early.after],[1563950,1848640,2406965,1543615]);
 assert.equal(t('kequity').cells.isa.after-t('kequity').cells.general.after,92400);assert.equal(c.isa.after-c.general.after,284690);
 const h=k=>M.afterTaxTable({kind:k,principal:5000000,years:3,growth:0.04,payout:0.02}).cells;
 assert.equal(h('kequity').isa.after-h('kequity').general.after,46200);assert.equal(h('kother').isa.after-h('kother').general.after,142345);
 assert.equal(t('bond').cells.general.after,1756240,'확인 문제: 나라 3년');
 assert.equal(t('foreign').cells.isa.blocked,'foreign');assert.equal(t('foreign').cells.annuity.blocked,'foreign');assert.equal(t('stock').cells.annuity.blocked,'unknown');
 assert.equal(t('stock').cells.isa.sttUnknown,1826143);
});

test('10장 마지막 과제: X·Y·Z, 13.2%, 전부 3년 뒤, 가격 상승 0%(L2)',()=>{
 const P=k=>M.planOutcome(k).after;
 const pen=1109184-ref.cut(0.055*7109184)+990000,isa=739456,gen=739456-ref.cut(739456*0.154);
 assert.deepEqual([pen+isa,1848640,gen+pen],[2447635,1848640,2333759]);
 assert.deepEqual([P('X'),P('Y'),P('Z')],[2447635,1848640,2333759]);
 assert.deepEqual(['X','Z'].map(k=>M.planOutcome(k,{band:'over'}).after),[2249635,2135759]);
 assert.deepEqual(['X','Y','Z'].map(k=>M.planOutcome(k,{need:10000000}).after),[1665625,1848640,1551749]);
 assert.equal(M.planOutcome('X',{need:10000000,band:'over'}).after,1467625);
 assert.deepEqual(['X','Y','Z'].map(k=>M.planOutcome(k,{growth:0}).after),[1240200,600000,1203240]);
 assert.equal(M.planOutcome('X',{need:4000000}).early,false);assert.equal(M.planOutcome('X',{need:4000001}).early,true);
 assert.throws(()=>M.planOutcome('W'),RangeError);
});

test('ch9 L2: Nuri200 for five years, general vs ISA',()=>{
 const c=M.afterTaxTable({principal:10000000,years:5,growth:0.04,payout:0.02,kind:'kequity'}).cells;
 const ref=Math.floor(1000000*0.154+1e-7),pretax=Math.round(1e7*1.04**5)-1e7+1000000;
 assert.equal(c.general.after,pretax-ref);assert.equal(c.isa.after,pretax);assert.equal(c.isa.after-c.general.after,154000);assert.equal(c.general.after,3012529);
});

test('the numbers in docs/index.html #curriculum-case and #chapters L2 cells are the numbers above',()=>{
 const doc=read('docs/index.html'),caseText=doc.slice(doc.indexOf('id="curriculum-case"'),doc.indexOf('id="chapters"'));
 for(const s of ['1,848,640원','169,200원','28,000원','2,800원','1,248,640원','165만 원','11만 원','1,756,240원','1,563,950원','3,166,529원','115,486원','487,645원','1,826,143원','2,406,965원','1,543,615원','92,400원','284,690원','99만 원','48만 원'])assert.ok(caseText.includes(s),'case: '+s);
 const L2=doc.slice(doc.indexOf('id="chapters"'),doc.indexOf('id="style"'));
 for(const s of ['18,480원','120,000원','480만 원','44만 원','693,000원','123만 2,000원','121만 원','2,772,960원','76,523원','427,035원','350,512원','79만 2,000원','99만 원','19만 8,000원','3,012,529원','3,166,529원','154,000원','1,240,200원','600,000원','1,203,240원','744,093원'])assert.ok(L2.includes(s),'chapters: '+s);
});

test('rates live in one table with the check date, and the unverified rules are named',()=>{
 assert.equal(M.CHECKED,'2026-10-13');assert.equal(M.withholdRate().toFixed(3),'0.154');
 assert.deepEqual(Object.keys(M.assumptions).sort(),['foreignNetting','isaStt','noncreditedTaxFree','pensionStock']);
 for(const v of Object.values(M.assumptions))assert.match(v,/확인 못함/);
 const src=read('js/math.js').split('const RATES=')[1].split('};')[0];assert.match(src,/0\.0005/);
 const others=['labs-events','labs-gains','labs-accounts','labs-calc','labs-final','figures','home-lab'].map(f=>read(`js/${f}.js`)).join('');
 assert.doesNotMatch(others,/0\.154|0\.099|0\.165|0\.055\b|0\.0015/,'labs and figures read rates from TMath.RATES instead of repeating them');
});

test('content.js and review.json repeat only computed numbers',()=>{
 const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);const B=ctx.window.TBook,text=JSON.stringify(B.chapters)+read('review.json');
 for(const s of ['1,848,640원','1,563,950원','2,406,965원','1,543,615원','2,447,635원','2,333,759원','169,200원','744,093원'])assert.ok(text.includes(s),s);
 assert.doesNotMatch(text,/1,543,614|744,094/,'old typos stay fixed');
});
