/* 재무제표 읽기 계산. DOM을 만지지 않으며 tests/math.test.cjs가 대표값·경계값·불변 조건을 검사한다.
   「금융과 투자 처음부터」 5권 「재무제표 읽기 · 세 재무제표를 맞춰 보고 비율과 현금흐름으로 위험 신호 찾기」의 계산 원본이다.
   책 사이 코드 의존을 두지 않는다(1권 money의 할인 식, 확률과 통계의 베이즈 식이 있어도 여기서 새로 쓴다).
   단위와 표기:
   - 금액은 억 원이다. 줄마다 소수 첫째 자리로 반올림한다(법인세 20%에서 둘째 자리가 생기므로). 반올림한 줄끼리 더하므로
     대조 네 줄은 반올림 뒤에도 정확히 맞는다(비교는 1e-6 허용).
   - 비율은 소수다(0.12 = 12.0%). 화면에서 %나 배·회·일로 바꾼다. %p는 두 백분율의 차이다.
   - 새벽전자와 그 숫자는 가상이다. 가정(매출원가율·판매비와관리비율·감가상각률·이자·세율·배당·최소 현금과 차입 단위)은
     모두 ASSUME 한 곳에 둔다(docs/research.html 기준값 머리말, V-2~V-10).
   - 공시 기한·감사의견에 따른 거래소 조치·회계기준 변경 시점은 RULES 한 곳에 둔다. 확인일은 2026-10-13이다.
     사업보고서 90일과 감사의견 조치는 한국거래소 안내 원문, 반기·분기 45일은 회계법인 안내(2012)로만 확인했고,
     기한이 토요일·공휴일일 때의 처리는 확인하지 못했다(조사 노트 3-1·3-2·3-5). 규칙이 바뀌면 RULES만 고친다.
   - 실제 계산(세 재무제표, 비율, 발생액, 경보 세기, 날짜 더하기)과 미리 정한 가상 시나리오(새벽전자·비교 회사의 숫자),
     이 책의 단순화(발생액 비율 정의, 감가상각 = 기초 유형자산 10%, 연말 차입, 손실이면 법인세 0)를 구분한다.
   - 가치 평가(PER·PBR·EV/EBITDA·DCF)는 6권 「기업 가치 평가」의 몫이라 여기서 계산하지 않는다. 배당소득세는 11권이 계산한다. */
(function(root){
'use strict';
const CHECKED='2026-10-13';
const ASSUME={
 cogsRate:0.70,          // 매출원가 = 매출 × 70%(감가상각 일부 포함, 가정)
 sgaRate:0.18,           // 판매비와관리비 = 매출 × 18%(감가상각 포함, 가정)
 depRate:0.10,           // 감가상각비 = 기초 유형자산 × 10%(정액·잔존가치 없음을 대신하는 이 책의 단순화)
 interestExpense:12,     // 이자비용: 사채 200 × 5.0% + 단기차입금 50 × 4%(3권 새벽전자 3년 회사채 표면금리 5.0%와 맞춤)
 interestIncome:2,       // 이자수익(가정)
 taxRate:0.20,           // 법인세 = 세전이익 × 20%(가정, 실제 세율이 아님). 그해에 모두 낸다. 손실이면 0(이월결손 없음, 단순화)
 dividend:40,            // 배당금 = 1,000만 주 × 400원(11권 배당 2%, 주가 약 20,000원과 맞춤)
 minCash:50,             // 기말 현금이 이보다 적으면
 borrowStep:50,          // 이 단위로 단기차입금을 늘린다. 차입은 연말에 일어나 그해 이자비용은 바뀌지 않는다(가정)
 bond:200, bondRate:0.05, stRate:0.04, // 사채 200(3년, 5.0%), 단기차입금 금리 4%(가정)
 shares:1e7, par:500     // 주식 1,000만 주, 액면 500원 → 자본금 50억 원(액면은 이 책의 가정)
};
/* 현금흐름표 분류: 이자 지급은 영업활동, 배당 지급은 재무활동(현행 K-IFRS 제1007호의 선택 가운데 하나, 조사 노트 2-3). */
const RULES={
 annualDays:90,          // 사업보고서: 사업연도 경과 후 90일 이내(한국거래소 안내 원문 · 법무법인 안내, 3-1)
 interimDays:45,         // 반기·분기보고서: 경과 후 45일 이내(회계법인 안내 2012, 공식 원문·현행 여부 확인 못함, 3-2)
 extensionBizDays:5,     // 사업보고서 연장신고 시 5영업일 안에서 연장(한국거래소 안내, 3-1)
 grade:{annualDays:'official',interimDays:'news',audit:'official',holiday:'unknown'},
 audit:{                 // 유가증권시장 감사의견에 따른 조치(한국거래소 안내 원문, 3-5). 코스닥·이의신청·개선기간은 다루지 않음
  unqualified:'안내에 조치 사유로 적히지 않음',
  qualifiedScope:'관리종목 지정(사실 확인일 다음날)',
  qualifiedScopeAgain:'상장폐지 절차 진행(관리종목 상태에서 다시 범위제한 한정)',
  qualifiedOther:'감사범위 제한이 아닌 한정은 이 안내의 조치 사유로 적히지 않음',
  adverse:'상장폐지 절차 진행',
  disclaimer:'상장폐지 절차 진행'
 },
 standardChange:'2027-01-01' // K-IFRS 제1118호(IFRS 18)와 현금흐름표 이자·배당 분류 변경: 이 날 이후 시작하는 회계연도부터(3·4장 안내 상자만)
};
const OPENING={cash:100,ar:200,inv:150,ppe:600,ap:120,std:50,bond:200,capital:50,surplus:100,re:530}; // 2023년 말(기초), V-2
const YEARS={
 2024:{sales:1500,ar:230,inv:170,ap:130,capex:80},
 2025:{sales:1800,ar:430,inv:300,ap:150,capex:150}
};
function need(cond,msg){if(!cond)throw new RangeError(msg);}
function num(x,name){need(typeof x==='number'&&Number.isFinite(x),name+' must be a finite number');}
function amount(x,name){num(x,name);need(x>=0,name+' must be ≥ 0');}
function ratio01(x,name){num(x,name);need(x>=0&&x<=1,name+' must be between 0 and 1');}
const r1=x=>Math.round(x*10+(x>=0?1e-9:-1e-9))/10;   // 억 원 소수 첫째 자리
const same=(a,b)=>Math.abs(a-b)<1e-6;

/* ── 1장 발생주의 ── 거래: {type, amount, date('YYYY-MM-DD'), pay?(대금 날짜)}.
   type: cashSale(매출·현금 같은 날), creditSale(매출만), collect(현금만, 앞서 외상으로 판 대금), buyInventory(재고 매입, 현금 지급; 비용 아님),
   buyEquipment(설비 구입: 자산은 date, 현금은 pay 또는 date; pay가 date보다 앞서는 선급은 다루지 않아 오류). close: 결산일 'MM-DD'(기본 12-31). 결과는 회계연도(결산일이 속한 해)별 매출·현금 유입·유출. */
const TX=['cashSale','creditSale','collect','buyInventory','buyEquipment'];
function fiscalYear(date,close='12-31'){
 need(/^\d{4}-\d{2}-\d{2}$/.test(date),'date must look like YYYY-MM-DD');need(/^\d{2}-\d{2}$/.test(close),'close must look like MM-DD');
 const y=+date.slice(0,4);return date.slice(5)<=close?y:y+1;
}
function accrual(txs,close='12-31'){
 need(Array.isArray(txs),'transactions must be a list');const out={};
 const row=y=>out[y]||(out[y]={revenue:0,cashIn:0,cashOut:0,assetsBought:0,payable:0});
 for(const t of txs){
  need(TX.includes(t.type),'unknown transaction '+t.type);amount(t.amount,'amount');const fy=fiscalYear(t.date,close);
  if(t.type==='cashSale'){row(fy).revenue+=t.amount;row(fy).cashIn+=t.amount;}
  else if(t.type==='creditSale')row(fy).revenue+=t.amount;
  else if(t.type==='collect')row(fy).cashIn+=t.amount;
  else{need(!t.pay||t.pay>=t.date,'payment date must not be before the purchase date (prepayment is not modelled)');const py=fiscalYear(t.pay||t.date,close);row(fy).assetsBought+=t.amount;row(py).cashOut+=t.amount;if(py!==fy)row(fy).payable+=t.amount;}
 }
 return out;
}

/* ── 2장 재무상태표 ── bs: OPENING과 같은 열 이름. 자산 = 현금 + 매출채권 + 재고 + 유형자산, 부채 = 매입채무 + 단기차입금 + 사채. */
const ASSET_KEYS=['cash','ar','inv','ppe'],LIAB_KEYS=['ap','std','bond'],EQ_KEYS=['capital','surplus','re'];
const CLASS={cash:'current',ar:'current',inv:'current',ppe:'noncurrent',ap:'current',std:'current',bond:'noncurrent'}; // 사채는 만기 1년 넘게 남았다고 놓음(가정)
function totals(bs){
 for(const k of [...ASSET_KEYS,...LIAB_KEYS,...EQ_KEYS])num(bs[k],k);
 const sum=ks=>r1(ks.reduce((t,k)=>t+bs[k],0));const assets=sum(ASSET_KEYS),liabilities=sum(LIAB_KEYS),equity=sum(EQ_KEYS);
 const cur=(ks,c)=>r1(ks.filter(k=>CLASS[k]===c).reduce((t,k)=>t+bs[k],0));
 return {assets,liabilities,equity,balanced:same(assets,liabilities+equity),currentAssets:cur(ASSET_KEYS,'current'),noncurrentAssets:cur(ASSET_KEYS,'noncurrent'),currentLiabilities:cur(LIAB_KEYS,'current'),noncurrentLiabilities:cur(LIAB_KEYS,'noncurrent')};
}
/* 거래 하나가 두 줄 이상을 함께 바꾼다. kind: borrow(현금·단기차입금 +), repayDebt(현금·단기차입금 −), buyEquipment(현금 −, 유형자산 +),
   payAP(현금·매입채무 −), creditSale(매출채권 + 판매가, 재고 − 원가, 이익잉여금 + 차액; 세금은 이 실험에서 넣지 않음). */
function applyTx(bs,tx){
 const b={...bs},a=tx.amount;amount(a,'amount');
 if(tx.kind==='borrow'){b.cash+=a;b.std+=a;}
 else if(tx.kind==='repayDebt'){need(a<=b.std,'cannot repay more than the debt');b.cash-=a;b.std-=a;}
 else if(tx.kind==='buyEquipment'){b.cash-=a;b.ppe+=a;}
 else if(tx.kind==='payAP'){need(a<=b.ap,'cannot pay more than payables');b.cash-=a;b.ap-=a;}
 else if(tx.kind==='creditSale'){const c=tx.cost??r1(a*ASSUME.cogsRate);amount(c,'cost');need(c<=b.inv,'not enough inventory');b.ar+=a;b.inv-=c;b.re+=a-c;}
 else throw new RangeError('unknown kind '+tx.kind);
 for(const k of Object.keys(b))if(typeof b[k]==='number')b[k]=r1(b[k]);
 need(b.cash>=0,'cash would go below 0');return b;
}
/* 유동·비유동 맞히기: picks {열 이름: 'current'|'noncurrent'} → 줄마다 ✓/✗. */
function classifyCheck(picks){return Object.fromEntries(Object.keys(CLASS).map(k=>[k,picks[k]===CLASS[k]]));}

/* ── 3장 손익계산서 ── sga: 숫자면 고정 금액, 없으면 매출 × sgaRate. 결과는 단계별 이익과 영업이익률. */
function incomeStatement(o={}){
 const sales=o.sales??1500,cogsRate=o.cogsRate??ASSUME.cogsRate,taxRate=o.taxRate??ASSUME.taxRate;
 amount(sales,'sales');ratio01(cogsRate,'cogsRate');ratio01(taxRate,'taxRate');
 const ie=o.interestExpense??ASSUME.interestExpense,ii=o.interestIncome??ASSUME.interestIncome;amount(ie,'interestExpense');amount(ii,'interestIncome');
 const sga=o.sga!==undefined?o.sga:r1(sales*(o.sgaRate??ASSUME.sgaRate));amount(sga,'sga');
 const cogs=r1(sales*cogsRate),gross=r1(sales-cogs),op=r1(gross-sga),pretax=r1(op-ie+ii),tax=r1(Math.max(0,pretax)*taxRate),ni=r1(pretax-tax);
 return {sales,cogs,gross,sga,op,opMargin:sales?op/sales:null,interestExpense:ie,interestIncome:ii,pretax,tax,ni,netMargin:sales?ni/sales:null};
}
const change=(a,b)=>{num(a,'from');num(b,'to');need(a!==0,'from must not be 0');return (b-a)/Math.abs(a);};

/* ── 4장 간접법 영업활동 현금흐름 ── 순이익 + 감가상각 − 매출채권 증가 − 재고 증가 + 매입채무 증가. steps는 조정 단계별 누적값. */
function cfoBridge(o){
 for(const k of ['ni','dep','dAR','dInv','dAP'])num(o[k],k);amount(o.dep,'dep');
 const parts=[['순이익',o.ni],['감가상각',o.dep],['매출채권 증가',-o.dAR],['재고 증가',-o.dInv],['매입채무 증가',o.dAP]];
 let run=0;const steps=parts.map(([label,v])=>{run=r1(run+v);return {label,value:r1(v),total:run};});
 return {steps,cfo:run};
}

/* ── 5장 세 재무제표 연동(대표 실험) ── opening: 기초 재무상태표, input: {sales, ar, inv, ap, capex, dividend?, cogsRate?, sgaRate?}.
   기말 매출채권·재고·매입채무는 입력한 잔액이다. 차입 전 기말 현금이 minCash보다 적으면 borrowStep 단위로 단기차입금을 늘린다(연말, 이자 불변).
   돌려주는 checks 네 줄은 어떤 입력에서도 ok여야 한다(불변 조건). */
function linkedYear(opening=OPENING,input=YEARS[2024],as=ASSUME){
 totals(opening);for(const k of ['sales','ar','inv','ap','capex'])amount(input[k],k);
 const div=input.dividend??as.dividend;amount(div,'dividend');
 const dep=r1(opening.ppe*as.depRate);
 const is=incomeStatement({sales:input.sales,cogsRate:input.cogsRate??as.cogsRate,sgaRate:input.sgaRate??as.sgaRate,interestExpense:as.interestExpense,interestIncome:as.interestIncome,taxRate:as.taxRate});
 const dAR=r1(input.ar-opening.ar),dInv=r1(input.inv-opening.inv),dAP=r1(input.ap-opening.ap);
 const cf=cfoBridge({ni:is.ni,dep,dAR,dInv,dAP}),cfi=r1(-input.capex);
 const before=r1(opening.cash+cf.cfo+cfi-div);
 const borrow=before<as.minCash?Math.ceil((as.minCash-before)/as.borrowStep-1e-9)*as.borrowStep:0;
 const cff=r1(-div+borrow),net=r1(cf.cfo+cfi+cff);
 const close={cash:r1(opening.cash+net),ar:input.ar,inv:input.inv,ppe:r1(opening.ppe+input.capex-dep),ap:input.ap,std:r1(opening.std+borrow),bond:opening.bond,capital:opening.capital,surplus:opening.surplus,re:r1(opening.re+is.ni-div)};
 const t=totals(close);
 const checks=[
  {name:'자산 = 부채 + 자본',left:t.assets,right:r1(t.liabilities+t.equity),ok:t.balanced},
  {name:'기초 이익잉여금 + 순이익 − 배당 = 기말 이익잉여금',left:r1(opening.re+is.ni-div),right:close.re,ok:same(opening.re+is.ni-div,close.re)},
  {name:'기초 현금 + 현금흐름 합계 = 기말 현금',left:r1(opening.cash+net),right:close.cash,ok:same(opening.cash+cf.cfo+cfi+cff,close.cash)},
  {name:'기초 유형자산 + 설비투자 − 감가상각 = 기말 유형자산',left:r1(opening.ppe+input.capex-dep),right:close.ppe,ok:same(opening.ppe+input.capex-dep,close.ppe)}
 ];
 return {is,dep,cf:{steps:cf.steps,cfo:cf.cfo,cfi,dividend:-div,borrow,cff,net,cashBeforeBorrow:before},close,totals:t,checks,
  depInsideCosts:is.cogs+is.sga>=dep}; // false면 "감가상각이 비용 안에 들어 있다"는 가정이 깨진 입력(매출이 아주 작을 때). 대조 네 줄은 그래도 맞는다
}
/* 2023년 말에서 2024·2025 사업연도를 차례로 계산한다. */
function saebyeok(){const y24=linkedYear(OPENING,YEARS[2024]),y25=linkedYear(y24.close,YEARS[2025]);return {opening:OPENING,y2024:y24,y2025:y25};}

/* ── 6장 비율 ── opening·close: 재무상태표, is: 손익계산서, cfo: 영업활동 현금흐름. 평균 = (기초 + 기말) ÷ 2.
   매출채권회전율 = 매출 ÷ 평균 매출채권(외상 매출을 따로 나누지 않는 단순화), 재고자산회전율 = 매출원가 ÷ 평균 재고,
   회전일수(기말) = 기말 잔액 ÷ 매출(재고는 매출원가) × 365. 유동비율의 유동부채 = 매입채무 + 단기차입금. */
function ratios(opening,close,is,cfo){
 const o=totals(opening),c=totals(close),avg=(a,b)=>(a+b)/2,avgA=avg(o.assets,c.assets),avgE=avg(o.equity,c.equity);
 need(is.sales>0,'sales must be > 0');need(avgE>0&&c.equity>0,'equity must be > 0');
 return {
  opMargin:is.op/is.sales,netMargin:is.ni/is.sales,roeAvg:is.ni/avgE,roeEnd:is.ni/c.equity,roa:is.ni/avgA,avgAssets:avgA,avgEquity:avgE,
  debtRatio:c.liabilities/c.equity,currentRatio:c.currentAssets/c.currentLiabilities,interestCover:is.interestExpense?is.op/is.interestExpense:null,
  arTurnover:is.sales/avg(opening.ar,close.ar),arDays:close.ar/is.sales*365,invTurnover:is.cogs/avg(opening.inv,close.inv),invDays:is.cogs?close.inv/is.cogs*365:null,
  cfoToNi:cfo===undefined||!is.ni?null:cfo/is.ni,accrualRatio:cfo===undefined?null:(is.ni-cfo)/avgA
 };
}
/* 다른 회사 숫자로 안정성 비율 셋만 계산할 때. */
function stability(o){for(const k of ['op','interest','liabilities','equity','currentAssets','currentLiabilities'])amount(o[k],k);need(o.interest>0&&o.equity>0&&o.currentLiabilities>0,'denominators must be > 0');return {interestCover:o.op/o.interest,debtRatio:o.liabilities/o.equity,currentRatio:o.currentAssets/o.currentLiabilities};}
/* 듀폰 분해: ROE = 순이익률 × 총자산회전율 × 자기자본승수(평균 총자산 ÷ 평균 자본). */
function dupont(ni,sales,avgAssets,avgEquity){num(ni,'ni');need(sales>0&&avgAssets>0&&avgEquity>0,'denominators must be > 0');const m=ni/sales,t=sales/avgAssets,l=avgAssets/avgEquity;return {margin:m,turnover:t,leverage:l,roe:m*t*l};}

/* ── 7장 순이익과 영업현금흐름 ── 발생액 비율 = (순이익 − 영업현금흐름) ÷ 평균 총자산. Sloan(1996)의 측정과 다른 이 책의 단순화다(조사 노트 4-5). */
function accrualRatio(ni,cfo,avgAssets){num(ni,'ni');num(cfo,'cfo');need(avgAssets>0,'average assets must be > 0');return (ni-cfo)/avgAssets;}
/* 순이익 − 영업현금흐름을 만든 줄: 매출채권 증가 + 재고 증가 − 매입채무 증가 − 감가상각. share는 차이에서 매출채권·재고 증가가 차지하는 몫. */
function accrualParts(o){const gap=r1(o.dAR+o.dInv-o.dAP-o.dep);return {gap,arInv:r1(o.dAR+o.dInv),share:gap?(o.dAR+o.dInv)/gap:null};}
/* 경보 세기: 회사 n개 가운데 기저율만큼 실제 문제, 적중률(문제 회사에서 울릴 확률), 오경보율(정상 회사에서 울릴 확률). 기대 개수로 센다. */
function alarm(base,hit,falseRate,n=1000){
 ratio01(base,'base rate');ratio01(hit,'hit rate');ratio01(falseRate,'false alarm rate');need(Number.isInteger(n)&&n>0,'n must be a whole number > 0');
 const bad=n*base,tp=bad*hit,fp=(n-bad)*falseRate;return {bad,good:n-bad,tp,fp,alarms:tp+fp,precision:tp+fp?tp/(tp+fp):null};
}

/* ── 8장 제출 기한 ── 기간 끝 날짜에 법정 일수를 더한다. 주말이면 weekend:true와 "휴일 처리 확인 못함"을 함께 돌려준다(공휴일 표는 넣지 않음). */
const WEEKDAY=['일','월','화','수','목','금','토'];
function addDays(date,days){need(/^\d{4}-\d{2}-\d{2}$/.test(date),'date must look like YYYY-MM-DD');need(Number.isInteger(days),'days must be a whole number');const d=new Date(date+'T00:00:00Z');need(!Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===date,'not a real date: '+date);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
function deadline(periodEnd,kind){
 need(['annual','half','quarter'].includes(kind),'kind must be annual, half or quarter');
 const days=kind==='annual'?RULES.annualDays:RULES.interimDays,date=addDays(periodEnd,days),w=new Date(date+'T00:00:00Z').getUTCDay();
 return {date,days,weekday:WEEKDAY[w],weekend:w===0||w===6,note:w===0||w===6?'기한이 주말: 휴일 처리 확인 못함':'',grade:kind==='annual'?RULES.grade.annualDays:RULES.grade.interimDays,checked:CHECKED};
}
/* 12월 결산 회사의 한 해 정기보고서 기한 네 개(1분기·반기·3분기·사업보고서). */
function filingCalendar(year){need(Number.isInteger(year)&&year>=2000&&year<2100,'year must be 2000–2099');return [['1분기 보고서',deadline(`${year}-03-31`,'quarter')],['반기보고서',deadline(`${year}-06-30`,'half')],['3분기 보고서',deadline(`${year}-09-30`,'quarter')],['사업보고서',deadline(`${year}-12-31`,'annual')]];}
function auditAction(opinion){need(Object.hasOwn(RULES.audit,opinion),'unknown opinion '+opinion);return {opinion,action:RULES.audit[opinion],grade:RULES.grade.audit,market:'유가증권시장',checked:CHECKED};}

/* ── 9장 업종 비교 ── 가상의 회사 셋(새벽전자 2024는 위 모델에서 계산). 유통·소프트웨어 회사의 숫자는 미리 정한 가상 시나리오(V-9).
   유통 회사의 기초·기말 재고는 모두 100으로 놓아 평균과 기말이 같다(가정). 두 회사의 영업이익은 정하지 않았다. */
const INDUSTRY={
 retail:{name:'가상의 유통 회사',sales:2000,cogs:1600,invOpen:100,invClose:100,arClose:50,ppeShare:0.30},
 software:{name:'가상의 소프트웨어 회사',sales:500,cogs:150,invOpen:0,invClose:0,arClose:100,ppeShare:0.10}
};
function industryRow(c){
 amount(c.sales,'sales');need(c.sales>0,'sales must be > 0');amount(c.cogs,'cogs');const avgInv=(c.invOpen+c.invClose)/2;
 return {name:c.name,invTurnover:avgInv?c.cogs/avgInv:null,invDays:c.invClose?c.invClose/c.cogs*365:null,arDays:c.arClose/c.sales*365,ppeShare:c.ppeShare};
}
const daysFromTurnover=t=>{num(t,'turnover');need(t>0,'turnover must be > 0');return 365/t;};
function industryTable(){
 const s=saebyeok(),y=s.y2024,r=ratios(OPENING,y.close,y.is,y.cf.cfo);
 return {saebyeok:{name:'새벽전자(제조)',invTurnover:r.invTurnover,invDays:r.invDays,arDays:r.arDays,ppeShare:y.close.ppe/y.totals.assets,opMargin:r.opMargin},retail:industryRow(INDUSTRY.retail),software:industryRow(INDUSTRY.software)};
}

/* ── 10장 마지막 과제 ── 2024 → 2025 사업연도의 신호와, 2025년 말 단기차입금에 4%를 1년 낸다고 놓은 2026 이자비용과 이자보상배율. */
function interestEstimate(bond,bondRate,std,stRate){amount(bond,'bond');amount(std,'std');ratio01(bondRate,'bondRate');ratio01(stRate,'stRate');return r1(bond*bondRate+std*stRate);}
function finalTask(){
 const s=saebyeok(),a=s.y2024,b=s.y2025,ra=ratios(OPENING,a.close,a.is,a.cf.cfo),rb=ratios(a.close,b.close,b.is,b.cf.cfo);
 const interest2026=interestEstimate(ASSUME.bond,ASSUME.bondRate,b.close.std,ASSUME.stRate);
 return {y2024:a,y2025:b,r2024:ra,r2025:rb,niChange:change(a.is.ni,b.is.ni),cashChange:change(a.close.cash,b.close.cash),
  interest2026,cover2026:b.is.op/interest2026,deadlines:{q1:deadline('2026-03-31','quarter'),half:deadline('2026-06-30','half'),q3:deadline('2026-09-30','quarter'),annual:deadline('2026-12-31','annual')}};
}

const assumptions={
 depreciation:'감가상각 = 기초 유형자산 × 10%(이 책의 단순화)',
 borrowing:'기말 현금이 50억 원보다 적으면 50억 원 단위로 연말에 단기차입(이자는 그해 그대로, 가정)',
 accrualRatio:'발생액 비율 = (순이익 − 영업현금흐름) ÷ 평균 총자산(이 책의 단순화, Sloan의 측정과 다름)',
 interimDays:'반기·분기 45일의 공식 원문·현행 여부와 휴일 처리(확인 못함)',
 interest2027:'2027년 이후 이자 지급의 현금흐름표 분류 세부(자료끼리 엇갈려 확인 못함)'
};
const api={CHECKED,ASSUME,RULES,OPENING,YEARS,INDUSTRY,CLASS,TX,assumptions,r1,fiscalYear,accrual,totals,applyTx,classifyCheck,incomeStatement,change,cfoBridge,
 linkedYear,saebyeok,ratios,stability,dupont,accrualRatio,accrualParts,alarm,addDays,deadline,filingCalendar,auditAction,industryRow,daysFromTurnover,industryTable,
 interestEstimate,finalTask};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.SMath=api;
})(typeof window!=='undefined'?window:globalThis);
