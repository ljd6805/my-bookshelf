/* 기업 가치 평가 계산. DOM을 만지지 않으며 tests/math.test.cjs가 대표값·경계값·불변 조건을 검사한다.
   「금융과 투자 처음부터」 6권 「기업 가치 평가 · 배수 비교와 현금흐름 할인으로 주당 가치의 범위 계산하기」의 계산 원본이다.
   책 사이 코드 의존을 두지 않는다(1권 money의 할인 식, 3권 bonds의 고든 모형, 5권 statements의 재무제표 계산이 있어도 여기서 새로 쓴다).
   단위와 표기:
   - 금액은 억 원, 주당 값은 원/주, 주식 수는 주다. 주당 값(원) = 금액(억 원) × 1억 ÷ 주식 수.
   - 비율·금리·성장률은 소수다(0.083 = 8.3%). 화면에서 %나 배로 바꾼다. %p(퍼센트포인트)는 두 백분율의 차이다.
   - 중간값은 반올림하지 않고 계산하고, 화면에서만 반올림한다(금액은 억 원 소수 첫째 자리, 주당 값은 원, 민감도 표는 10원,
     비율은 소수 둘째 자리). 기준안 주당 값은 22,749.5원이라 원 단위 반올림으로 22,750원이 된다(경계에 가까움, 테스트가 지킨다).
   - 새벽전자와 그 숫자, 비교 회사 가·나·다·라, 분석가 A·B는 가상이다. 5권에서 가져온 재무 숫자와 이 책의 가치 평가 가정은
     ASSUME 한 곳에, 시장에서 확인한 숫자(국고채 금리·위험 프리미엄·회사채 금리·코스피 배수)는 확인일·출처 등급과 함께 MARKET 한 곳에,
     2026년에 나올 정기보고서의 기한(5권 조사 노트, 2026-10-13 확인)은 RULES 한 곳에 둔다.
   - 실제 계산(배수, FCFF, 할인, 영구가치, 민감도, 역산, 차이 나누기)과 미리 정한 가상 시나리오(새벽전자·비교 회사·분석가의 숫자),
     이 책의 단순화(감가상각 = 기초 유형자산 10%, 유형자산 ÷ 매출 일정, 연말 할인, 평가 시점 2025년 말, 시장가 비중을 주가 20,000원으로
     고정, 선행 EPS = 후행 EPS × (1 + 매출 성장률))를 구분한다. 어느 결과도 매매 판단이 아니다.
   - 영구성장률 g가 할인율 r 이상이면 영구가치를 계산하지 않고 'g ≥ r' RangeError를 던진다. */
(function(root){
'use strict';
const CHECKED='2026-10-13';
const ASSUME={
 shares:1e7,             // 주식 1,000만 주(4권 1장과 맞춘 시리즈 설정)
 price:20000,            // 주가 20,000원(2026년 4월, 가정. 4·7·12권과 맞춤)
 dps:400,                // 주당 배당 400원 = 40억 원(5권 ASSUME.dividend, 11권과 맞춤)
 tax:0.20,               // 법인세 = 영업이익 × 20%(5권과 같은 가정, 실제 세율이 아님)
 years:{                 // 5권 research V-2~V-10, books/statements/js/math.js 계산값(억 원). nwc = 매출채권 + 재고 − 매입채무(기말)
  2024:{sales:1500,op:180,dep:60,ni:136,capex:80,nwcOpen:230,nwc:270,equity:776,debt:250,cash:136},
  2025:{sales:1800,op:216,dep:62,ni:164.8,capex:150,nwcOpen:270,nwc:580,equity:900.8,debt:450,cash:62.8,ppe:708}
 },
 base:{                  // 기준안(평가 시점 2025-12-31, 2026~2030 명시 예측 5년, 2031년부터 영구가치)
  growth:0.05,           // 2026~2030 매출 성장률
  margin:0.12,           // 영업이익률(2024·2025 실적과 같음)
  wcRatio:0.28,          // 운전자본 ÷ 매출: 2024년 18%와 2025년 32.2% 사이에서 고른 가정(매출채권 일부 회수)
  depRate:0.10,          // 감가상각 = 기초 유형자산 × 10%(5권의 단순화)
  ppeRatio:708/1800,     // 유형자산 ÷ 매출 = 2025년 708 ÷ 1,800 유지(이 책의 단순화). 설비투자 = 유형자산 증가 + 감가상각
  r:0.083,               // 할인율(WACC) 8.3%: 6장 wacc()의 8.335%를 소수 첫째 자리로 둠
  gT:0.02,               // 영구성장률 2%
  years:5
 },
 dividendGrowth:0.07,    // 3장: 배당이 해마다 7%씩 영원히 자란다고 놓는 한 단계 모형의 단순화(7.6절에서 상한을 다룸)
 peerR:0.09,             // 9장: 비교 회사의 주가에 담긴 성장률을 풀 때 쓰는 요구수익률 9%(가정)
 peers:[                 // 가상의 전자부품 회사 넷. PER은 모두 후행(지난 한 해 이익 기준), PBR = ROE × PER
  {name:'가',per:8,roe:0.09,evEbitda:5.5,growth:0.02,payout:0.50},
  {name:'나',per:11,roe:0.15,evEbitda:7.0,growth:0.05,payout:0.35},
  {name:'다',per:13,roe:0.18,evEbitda:8.0,growth:0.07,payout:0.30},
  {name:'라',per:18,roe:0.20,evEbitda:11.0,growth:0.12,payout:0.20}
 ],
 analysts:{              // 마지막 과제: 같은 2026년 4월, 같은 정의("2025년 말 기준 주당 가치")
  A:{growth:0.08,margin:0.13,wcRatio:0.20,r:0.080,gT:0.02},   // 매출채권이 2024년 수준 근처로 회수된다고 봄
  B:{growth:0.03,margin:0.11,wcRatio:0.322,r:0.090,gT:0.02}   // 2025년 수준(32.2%)이 이어진다고 봄
 },
 gapOrder:['wcRatio','margin','growth','r'] // 10.3절 본문 순서: 운전자본 → 영업이익률 → 성장률 → 할인율
};
/* grade: news(보도), academic(대학 교재·강의 원문), estimate(교수 개인 추정치), series(앞선 권의 가상 설정), assumption(이 책의 가정). */
const MARKET={
 rf:{value:0.044,raw:0.04395,date:'2026-10-08',grade:'news',what:'국고채 10년 장 마감 금리(SBS Biz 보도). 4.4%로 둠. 이야기 시점 2026년 4월의 금리가 아님'},
 erp:{value:0.049,raw:0.0487,date:'2026-01-05',grade:'estimate',what:'한국 주식 위험 프리미엄 4.87% = 성숙 시장 4.23% + 국가 0.64%(Damodaran 갱신 표). 4.9%로 둠'},
 beta:{value:1.0,date:CHECKED,grade:'assumption',what:'베타 1.0(시장과 같이 움직인다고 놓은 가정). 추정은 9권(준비 중)'},
 kd:{value:0.0506,raw:0.05061,date:'2026-10-07',grade:'series',what:'새벽전자 3년 회사채 할인 금리 5.061%(3권 7장: 국채 금리 + 스프레드 1.10%p). 세전 부채 비용'},
 kospiForwardPer:{value:7.63,date:'2026-04-14',grade:'news',what:'코스피 12개월 선행 PER(FnGuide 집계, 파이낸셜뉴스 보도). 계산 입력으로 쓰지 않음'}
};
/* 2026년 정기보고서 기한(12월 결산, 5권 RULES로 계산한 날짜. 반기·분기 45일은 회계법인 안내로만 확인). */
const RULES={annual2025:'2026-03-31',q1:'2026-05-15',half:'2026-08-14',annual2026:'2027-03-31',grade:{annual:'official',interim:'news'},checked:CHECKED};

function need(cond,msg){if(!cond)throw new RangeError(msg);}
function num(x,name){need(typeof x==='number'&&Number.isFinite(x),name+' must be a finite number');}
function pos(x,name){num(x,name);need(x>0,name+' must be > 0');}
function rate(x,name,lo=-0.5,hi=1){num(x,name);need(x>=lo&&x<=hi,name+' must be between '+lo+' and '+hi);}
const r1=x=>Math.round(x*10+(x>=0?1e-9:-1e-9))/10;    // 억 원 소수 첫째 자리(화면용)
const won=x=>Math.round(x);                              // 원(화면용)
const r10=x=>Math.round(x/10)*10;                        // 민감도 표 10원(화면용)
const perShare=(amount,shares=ASSUME.shares)=>{num(amount,'amount');pos(shares,'shares');return amount*1e8/shares;};

/* ── 1장 가격과 회사의 크기 ── 시가총액(억 원) = 주가 × 주식 수, EPS = 순이익 ÷ 주식 수, BPS = 자본 ÷ 주식 수(원/주). */
function basics(o={}){
 const price=o.price??ASSUME.price,shares=o.shares??ASSUME.shares,ni=o.ni??ASSUME.years[2025].ni,equity=o.equity??ASSUME.years[2025].equity;
 pos(price,'price');pos(shares,'shares');num(ni,'ni');num(equity,'equity');
 return {price,shares,cap:price*shares/1e8,eps:perShare(ni,shares),bps:perShare(equity,shares)};
}
/* 주식 수를 factor배로 나눈다(액면분할). 회사의 숫자는 그대로, 주가는 1/factor로 바뀐다고 놓는다. */
function split(o,factor){pos(factor,'factor');const b=basics(o);return basics({price:b.price/factor,shares:b.shares*factor,ni:o?.ni,equity:o?.equity});}

/* ── 2장 배수 ── PER = 주가 ÷ EPS, PBR = 주가 ÷ BPS, ROE = 순이익 ÷ 기말 자본. 같은 해 이익·같은 시점 자본이면 PBR = ROE × PER. */
function multiples(o={}){
 const b=basics(o);need(b.eps>0,'EPS must be > 0 for PER');need(b.bps>0,'BPS must be > 0 for PBR');
 const per=b.price/b.eps,pbr=b.price/b.bps,roe=b.eps/b.bps;
 return {...b,per,pbr,roe,roeTimesPer:roe*per};
}
/* 선행 PER: 내년 EPS 예상으로 나눈 값. 이 책은 내년 EPS = 지난해 EPS × (1 + 매출 성장률)로 놓는다(이 책의 단순화). */
function forwardPer(price,eps0,growth){pos(price,'price');pos(eps0,'eps0');rate(growth,'growth');const eps1=eps0*(1+growth);return {eps1,per:price/eps1};}
function median(xs){need(Array.isArray(xs)&&xs.length>0,'need at least one number');xs.forEach(x=>num(x,'value'));const s=[...xs].sort((a,b)=>a-b),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;}
function peerTable(peers=ASSUME.peers){
 return peers.map(p=>{pos(p.per,'per');rate(p.roe,'roe');return {...p,pbr:p.roe*p.per,retentionG:(1-p.payout)*p.roe};});
}
/* 비교 회사 중앙값으로 새벽전자 다시 매기기: PER × EPS, PBR × BPS, EV/EBITDA × EBITDA − 순차입금(4장). */
function peerValues(year=2025,peers=ASSUME.peers){
 const t=peerTable(peers),y=ASSUME.years[year],m=multiples({ni:y.ni,equity:y.equity}),e=evBridge(year);
 const med={per:median(t.map(p=>p.per)),pbr:median(t.map(p=>p.pbr)),evEbitda:median(t.map(p=>p.evEbitda))};
 const evValue=med.evEbitda*e.ebitda,byEv=perShare(evValue-e.netDebt);
 const values={per:med.per*m.eps,pbr:med.pbr*m.bps,evEbitda:byEv};
 return {median:med,evValue,equityByEv:evValue-e.netDebt,values,low:Math.min(...Object.values(values)),high:Math.max(...Object.values(values))};
}

/* ── 3장 배당 ── 배당수익률 = 주당 배당 ÷ 주가, 배당성향 = 주당 배당 ÷ EPS, 지속 가능 성장률 = (1 − 배당성향) × ROE.
   고든 모형 P = D₁ ÷ (r − g)를 r로 풀면 r = D₁ ÷ P + g, D₁ = D₀ × (1 + g)(한 단계 모형: g가 영원히 이어진다고 놓음). */
function dividend(o={}){
 const dps=o.dps??ASSUME.dps,price=o.price??ASSUME.price,eps=o.eps??basics().eps;num(dps,'dps');need(dps>=0,'dps must be ≥ 0');pos(price,'price');pos(eps,'eps');
 const roe=o.roe??multiples().roe;num(roe,'roe');const payout=dps/eps;
 return {dps,price,eps,yield:dps/price,payout,retention:1-payout,sustainableG:(1-payout)*roe};
}
function impliedR(dps,price,g){num(dps,'dps');pos(price,'price');rate(g,'g',-0.5,0.5);const d1=dps*(1+g);return {d1,yield1:d1/price,r:d1/price+g};}
/* 영구 성장 현금흐름의 값 = 1년 뒤 현금흐름 ÷ (r − g). g ≥ r이면 계산하지 않는다. */
function perpetuity(cf1,r,g){num(cf1,'cash flow');rate(r,'r',-0.5,1);rate(g,'g',-0.5,1);need(g<r,'g ≥ r: growth must be below the discount rate');return cf1/(r-g);}

/* ── 4장 기업가치 ── 순차입금 = 차입금 − 현금, EV = 시가총액 + 순차입금, EBITDA = 영업이익 + 감가상각, 주주 몫 = 기업가치 − 순차입금. */
function ev(cap,debt,cash){num(cap,'cap');num(debt,'debt');num(cash,'cash');need(debt>=0&&cash>=0,'debt and cash must be ≥ 0');const netDebt=debt-cash;return {cap,debt,cash,netDebt,ev:cap+netDebt};}
function evBridge(year=2025,o={}){
 const y=ASSUME.years[year];need(!!y,'unknown year '+year);const cap=basics({price:o.price}).cap,e=ev(cap,o.debt??y.debt,o.cash??y.cash);
 const ebitda=y.op+y.dep;return {...e,ebitda,evEbitda:e.ev/ebitda};
}
function equityValue(firmValue,netDebt,shares=ASSUME.shares){num(firmValue,'firm value');num(netDebt,'net debt');const equity=firmValue-netDebt;return {equity,perShare:perShare(equity,shares)};}

/* ── 5장 FCFF ── FCFF = 영업이익 × (1 − 세율) + 감가상각 − 설비투자 − 운전자본 증가(주주와 채권자 모두의 몫, 억 원). */
function fcff(o){for(const k of ['op','dep','capex','dNwc'])num(o[k],k);const tax=o.tax??ASSUME.tax;rate(tax,'tax',0,1);return o.op*(1-tax)+o.dep-o.capex-o.dNwc;}
function actualFcff(year){const y=ASSUME.years[year];need(!!y,'unknown year '+year);const dNwc=y.nwc-y.nwcOpen;return {year,nopat:y.op*(1-ASSUME.tax),dep:y.dep,capex:y.capex,dNwc,wcRatio:y.nwc/y.sales,fcff:fcff({op:y.op,dep:y.dep,capex:y.capex,dNwc})};}
const discountFactor=(r,t)=>{rate(r,'r',-0.5,1);num(t,'t');return Math.pow(1+r,-t);};
function check(a){
 rate(a.growth,'growth',-0.3,0.5);rate(a.margin,'margin',-0.5,0.8);rate(a.wcRatio,'wcRatio',0,1);rate(a.r,'r',0.001,0.5);rate(a.gT,'gT',-0.1,0.5);
 rate(a.depRate,'depRate',0,1);pos(a.ppeRatio,'ppeRatio');need(Number.isInteger(a.years)&&a.years>=1&&a.years<=10,'years must be a whole number 1–10');
}
/* 2025년 말에서 출발해 명시 예측(years년)과 그다음 해(영구가치용, 성장률 gT)를 한 줄씩 만든다. 할인은 연말(t년 말). */
function forecast(over={}){
 const a={...ASSUME.base,...over};check(a);const y=ASSUME.years[2025];
 let sales=y.sales,ppe=y.ppe,nwc=y.nwc;const rows=[];
 for(let t=1;t<=a.years+1;t++){
  const g=t<=a.years?a.growth:a.gT,s=sales*(1+g),op=s*a.margin,dep=ppe*a.depRate,ppe1=s*a.ppeRatio,capex=ppe1-ppe+dep,nwc1=s*a.wcRatio,dNwc=nwc1-nwc;
  const f=fcff({op,dep,capex,dNwc}),df=t<=a.years?discountFactor(a.r,t):null;
  rows.push({year:2025+t,sales:s,op,dep,capex,dNwc,nwc:nwc1,fcff:f,df,pv:df===null?null:f*df});sales=s;ppe=ppe1;nwc=nwc1;
 }
 return {a,rows:rows.slice(0,a.years),next:rows[a.years],pvSum:rows.slice(0,a.years).reduce((t,r)=>t+r.pv,0)};
}

/* ── 6장 할인율 ── CAPM: 자기자본비용 = 무위험 금리 + β × 주식 위험 프리미엄. 세후 부채 비용 = 세전 × (1 − 세율).
   WACC = E/(E+D) × 자기자본비용 + D/(E+D) × 세후 부채 비용(시장가 비중; 주식 시장가는 주가 20,000원으로 고정, 이 책의 단순화). */
function capm(rf,beta,erp){rate(rf,'rf',-0.05,0.3);num(beta,'beta');need(beta>=-1&&beta<=4,'beta must be between −1 and 4');rate(erp,'erp',0,0.3);return rf+beta*erp;}
function wacc(o={}){
 const rf=o.rf??MARKET.rf.value,beta=o.beta??MARKET.beta.value,erp=o.erp??MARKET.erp.value,kdPre=o.kdPre??MARKET.kd.value,tax=o.tax??ASSUME.tax;
 const E=o.equity??basics().cap,D=o.debt??ASSUME.years[2025].debt;num(E,'equity');num(D,'debt');need(E>=0&&D>=0&&E+D>0,'equity and debt must be ≥ 0 and not both 0');rate(kdPre,'kdPre',0,0.5);rate(tax,'tax',0,1);
 const ke=capm(rf,beta,erp),kd=kdPre*(1-tax),wE=E/(E+D),wD=D/(E+D);
 return {rf,beta,erp,ke,kdPre,kd,wE,wD,wacc:wE*ke+wD*kd,checked:{rf:MARKET.rf.date,erp:MARKET.erp.date,kd:MARKET.kd.date}};
}

/* ── 7장 영구가치와 주당 가치 ── 영구가치(예측 마지막 해 말) = 다음 해 FCFF ÷ (r − g). 기업가치 = 5년 현재가치 + 영구가치의 현재가치.
   주주 몫 = 기업가치 − 순차입금(2025년 말 387.2억 원), 주당 가치 = 주주 몫 ÷ 주식 수. */
function terminal(fcffNext,r,g,years=5){const tv=perpetuity(fcffNext,r,g);return {tv,pv:tv*discountFactor(r,years)};}
function dcf(over={}){
 const f=forecast(over),a=f.a,t=terminal(f.next.fcff,a.r,a.gT,a.years),firm=f.pvSum+t.pv,nd=evBridge(2025).netDebt,eq=equityValue(firm,nd);
 return {a,rows:f.rows,next:f.next,pvSum:f.pvSum,tv:t.tv,tvPv:t.pv,firm,tvShare:t.pv/firm,netDebt:nd,equity:eq.equity,perShare:eq.perShare};
}
const value=over=>dcf(over).perShare;

/* ── 8장 민감도 ── 두 가정을 함께 바꾼 표. g ≥ r인 칸은 값 대신 error:'g ≥ r'. */
function sensitivity(rowKey,rowVals,colKey,colVals,base={}){
 need(rowKey!==colKey,'pick two different assumptions');need(rowVals.length>0&&colVals.length>0,'need values on both axes');
 return rowVals.map(rv=>colVals.map(cv=>{try{return {value:value({...base,[rowKey]:rv,[colKey]:cv})};}catch(e){if(/g ≥ r/.test(e.message))return {value:null,error:'g ≥ r'};throw e;}}));
}
/* 한 번에 하나만 바꾼 폭. ranges: {key:[low쪽 값, high쪽 값]}. width가 큰 순서로 정렬(순서는 고른 범위에 달림). */
const RANGES={r:[0.093,0.073],margin:[0.11,0.13],wcRatio:[0.322,0.18],growth:[0.03,0.07],gT:[0.015,0.025]};
function tornado(ranges=RANGES,base={}){
 const mid=value(base);
 return Object.entries(ranges).map(([key,[a,b]])=>{const va=value({...base,[key]:a}),vb=value({...base,[key]:b});return {key,from:a,to:b,low:Math.min(va,vb),high:Math.max(va,vb),valueAtFrom:va,valueAtTo:vb,width:Math.abs(vb-va),base:mid};}).sort((x,y)=>y.width-x.width);
}
/* 1%p(0.01)를 올리고 내릴 때 주당 가치의 변화(원). 기울기를 재는 숫자이며 두 방향이 다를 수 있다. */
function perPoint(key,base={},step=0.01){const a={...ASSUME.base,...base};num(a[key],key);const mid=value(base);return {key,up:value({...base,[key]:a[key]+step})-mid,down:value({...base,[key]:a[key]-step})-mid};}
/* 배수 범위와 DCF 범위를 합친 "약 ○원~○원"(1,000원 단위로 바깥쪽 반올림하지 않고 가까운 1,000원). */
function rangeSentence(lo,hi){num(lo,'low');num(hi,'high');need(lo<=hi,'low must be ≤ high');return {low:Math.round(lo/1000)*1000,high:Math.round(hi/1000)*1000};}

/* ── 9장 주가에 담긴 가정 ── 나머지는 기준안으로 두고 key 하나를 바꿔 DCF 주당 가치가 price와 같아지는 값을 이분법으로 찾는다. */
function implied(key,price=ASSUME.price,base={},range){
 need(['growth','margin','wcRatio','r','gT'].includes(key),'cannot solve for '+key);pos(price,'price');const a0={...ASSUME.base,...base};
 const [lo,hi]=range||{growth:[-0.1,0.3],margin:[0,0.5],wcRatio:[0,0.8],r:[a0.gT+0.001,0.3],gT:[-0.05,a0.r-0.001]}[key];
 const f=x=>value({...base,[key]:x})-price;let a=lo,b=hi,fa=f(a),fb=f(b);need(fa*fb<=0,'no solution between '+lo+' and '+hi);
 for(let i=0;i<200&&b-a>1e-12;i++){const m=(a+b)/2,fm=f(m);if(fa*fm<=0){b=m;fb=fm;}else{a=m;fa=fm;}}
 return (a+b)/2;
}
/* 정당화 PER(고든 모형): 후행 P/E₀ = 배당성향 × (1 + g) ÷ (r − g), 선행 P/E₁ = 배당성향 ÷ (r − g). */
function justifiedPer(payout,r,g,basis='trailing'){rate(payout,'payout',0,1);need(basis==='trailing'||basis==='forward','basis must be trailing or forward');return perpetuity(basis==='trailing'?payout*(1+g):payout,r,g);}
/* 위 식을 g로 푼다. 후행: g = (r × PER − 배당성향) ÷ (PER + 배당성향), 선행: g = r − 배당성향 ÷ PER. */
function impliedG(per,payout,r,basis='trailing'){
 pos(per,'per');rate(payout,'payout',0,1);rate(r,'r',0,0.5);need(basis==='trailing'||basis==='forward','basis must be trailing or forward');
 const g=basis==='trailing'?(r*per-payout)/(per+payout):r-payout/per;need(g<r,'g ≥ r');return g;
}

/* ── 10장 마지막 과제 ── B에서 출발해 order 순서로 가정을 A의 것으로 하나씩 바꾼다. 몫의 합은 언제나 A − B(불변 조건). */
function gapSteps(order=ASSUME.gapOrder,from=ASSUME.analysts.B,to=ASSUME.analysts.A){
 need(new Set(order).size===order.length,'each assumption once');const cur={...from};let prev=value(cur);const steps=[];
 for(const key of order){need(key in to,'unknown assumption '+key);cur[key]=to[key];const v=value(cur);steps.push({key,value:v,delta:v-prev});prev=v;}
 return {start:value(from),end:value(to),steps,total:steps.reduce((t,s)=>t+s.delta,0)};
}
function finalTask(){
 const A=dcf(ASSUME.analysts.A),B=dcf(ASSUME.analysts.B),gap=gapSteps();
 return {A,B,ratio:A.perShare/B.perShare,diff:A.perShare-B.perShare,gap,checkpoints:RULES};
}

const assumptions={
 depreciation:'감가상각 = 기초 유형자산 × 10%(5권과 같은 이 책의 단순화)',
 ppe:'유형자산 ÷ 매출 = 708 ÷ 1,800 유지, 설비투자 = 유형자산 증가 + 감가상각(이 책의 단순화)',
 timing:'평가 시점 2025-12-31, 현금흐름은 해마다 연말에 한 번 들어온다고 놓고 할인(이 책의 단순화, 중간 연도 할인은 다루지 않음)',
 weights:'WACC의 주식 비중은 주가 20,000원으로 한 번 정해 고정(값을 매기려는 주가가 할인율에 다시 들어가는 순환을 끊는 이 책의 단순화)',
 debtCost:'세전 부채 비용은 3년 회사채 할인 금리 5.06%(무위험 금리는 10년 국고채라 만기가 다름, 이 책의 단순화)',
 forwardEps:'선행 EPS = 후행 EPS × (1 + 매출 성장률)(이 책의 단순화)',
 erpMix:'미국 국채 기준으로 만든 위험 프리미엄을 원화 국고채 금리에 더함(이 책의 단순화, 타당성 확인 못함)'
};
const api={CHECKED,ASSUME,MARKET,RULES,RANGES,assumptions,r1,won,r10,perShare,basics,split,multiples,forwardPer,median,peerTable,peerValues,
 dividend,impliedR,perpetuity,ev,evBridge,equityValue,fcff,actualFcff,discountFactor,forecast,capm,wacc,terminal,dcf,value,
 sensitivity,tornado,perPoint,rangeSentence,implied,justifiedPer,impliedG,gapSteps,finalTask};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.VMath=api;
})(typeof window!=='undefined'?window:globalThis);
