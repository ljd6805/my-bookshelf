/* 거시경제 계산. DOM을 만지지 않으며 tests/math.test.cjs가 대표값·경계값·불변 조건을 검사한다.
   「금융과 투자 처음부터」 2권 「거시경제 · GDP·물가·고용을 계산하고 금리·환율 경로를 가설로 세우기」의 계산 원본이다.
   책 사이 코드 의존을 두지 않는다(1권 money의 복리·실질 수익률, 확률과 통계의 상관계수가 있어도 여기서 새로 쓴다).
   단위와 표기:
   - 비율·성장률은 소수다(0.06 = 6%). 화면에서 %로 바꾼다. 정책 시나리오 모형의 입력과 출력만은 %·%p 단위의 수다
     (정책 금리 +0.25는 +0.25%p, 출력 GDP −0.166은 기준선 대비 −0.166%). %p(퍼센트포인트)는 두 백분율의 차이다.
   - 금액: GDP·지출은 조 원, 경상수지는 억 달러, 원화 금액은 원(화면에서 만 원 단위로 반올림), 환율은 1달러당 원이다.
   - 모형 출력은 소수 셋째 자리(r3), 화면 글자는 %·%p 소수 둘째 자리(r2)로 반올림한다. 중간값은 반올림하지 않는다.
   - 하린, 새벽전자, 온결식품, 모형 경제와 그 숫자는 가상이다(ASSUME). 실제 한국 통계는 발표일·확인일·출처 등급·이례적 값 표시와 함께
     MARKET 한 곳에만 둔다. 정책 시나리오 모형의 계수와 기준선은 MODEL 한 곳에만 둔다(계수는 가정이며 통계로 추정하지 않았다).
   - 실제 계산(지출 합, 실질 성장률, 연율, 물가지수, 실업률, 원화 금액, 경상수지, 시차 상관)과 미리 정한 가상 시나리오(ASSUME),
     미리 정한 시나리오 모형(MODEL로 계산하지만 예측이 아님)을 구분한다. 어느 결과도 시장 가격의 예측이나 매매 판단이 아니다. */
(function(root){
'use strict';
const CHECKED='2026-10-13';

/* 정책 시나리오 모형(미리 정한 시나리오 모형 · 예측 아님 · 계수는 가정 · 12분기만 계산 · 금리 하한과 중앙은행의 재반응은 넣지 않음).
   docs/research.html V-4의 식과 계수. 계수는 교재가 말하는 방향과 시차(주된 효과 1~3년 뒤)에 맞춰 고른 가정이다.
   i(q) = Δi·[금리 기간] − km·Δm·[통화량 기간] + kg·Δg·[지출 기간]        시장 금리 편차(%p)
   e(q) = −ki·i(q)                                                         원/달러 환율 편차(%, + = 원화 약세)
   y(q) = ay·y(q−1) − by·i(q−2) + gy·Δg·[지출 기간] + ey·e(q−1)            GDP 수준 편차(%)
   π(q) = ap·π(q−1) + bp·y(q−1) + ep·e(q−1) + sp·s·[충격 기간]             물가 상승률 편차(%p, 연율)
   시차는 식에 넣은 것(금리는 i(q−2), 지속 계수 ay·ap)이다. 모형은 가정한 시차를 보여 줄 뿐 시차를 찾아내지 않는다. */
const MODEL={
 coef:{ki:2.0,km:0.25,kg:0.10,ay:0.6,by:0.25,gy:0.32,ey:0.04,ap:0.7,bp:0.15,ep:0.02,sp:0.08},
 baseline:{inflation:2.0,policyRate:3.00,usdkrw:1340},  // 기준선 가정: 물가 상승률 2.0%, 정책 금리 3.00%, GDP는 추세, 원/달러 1,340원
 quarters:12,
 ranges:{rate:[-2,2],money:[-4,4],spend:[-2,2],shock:[-10,10]},   // 정책 금리 %p, 통화량 증가율 %p, 정부 지출 GDP 대비 %, 수입 물가 %
 maxLen:{rate:8,money:8,spend:8,shock:4},
 stages:{policy:['rate'],fiscal:['rate','spend'],fx:['rate','spend'],full:['rate','money','spend','shock']}, // 4장·5장·6장·10장에서 여는 손잡이
 label:'미리 정한 시나리오 모형 · 예측 아님 · 계수는 가정 · 12분기만 계산 · 금리 하한과 중앙은행의 재반응은 넣지 않음',
 fixedNote:'+0.25%p는 모형에 넣는 입력 크기이며 10월 22일 결정의 예상이 아닙니다'
};

/* 가상의 사례(미리 정한 가상 시나리오). 이름과 숫자는 모두 지어낸 것이다. */
const ASSUME={
 model:MODEL,
 economy:{c:480,i:190,g:170,x:420,m:360},          // 1장 모형 경제의 한 해 지출(조 원)
 growth:{nominal:0.06,deflator:0.04},              // 1장 모형 경제의 명목 성장률과 디플레이터 상승률
 basket:[                                          // 2장 장바구니 셋(가중치, 기준 해 가격 → 올해 가격, 원)
  {name:'쌀',w:0.2,p0:50000,p1:52000},
  {name:'전기 요금',w:0.3,p0:60000,p1:66000},
  {name:'외식',w:0.5,p0:9000,p1:9450}
 ],
 town:{pop15:1000,employed:580,unemployed:20},     // 3장 가상 동네(15세 이상 1,000명)
 gapCurve:[-0.9,-0.5,0,0.5,0.9,1.1,0.8,0.3,-0.2,-0.6,-0.8,-0.5],  // 3장 가상 GDP 갭(잠재 GDP 대비 %, 12분기)
 saebyeok:{usd:1000000,fall:0.02},                 // 6장 새벽전자의 수출 대금 100만 달러, 원/달러 2% 하락
 onkyeol:{usd:400000},                             // 6장 온결식품의 밀가루 수입 대금 40만 달러
 trade:{goods:40,services:-6,primary:3,secondary:-1},  // 7장 가상의 나라 한 달(억 달러)
 lead:[0.3,0.4,0.2,-0.1,-0.3,-0.2,0.1,0.3,0.4,0.2,-0.1,-0.2],          // 8장 가상 선행지수 전월 대비 변화 12개월
 coin:[0.15,0.05,0.10,0.29,0.27,0.16,-0.03,-0.29,-0.16,0.13,0.19,0.32], // 8장 가상 동행지수(세 달 전 선행 × 0.8에 작은 흔들림)
 coinMade:{lag:3,scale:0.8},                       // 동행을 만든 방식(세 달 늦춘 선행 × 0.8). 3개월에서 r이 가장 큰 것은 만든 방식대로다
 release:{actual:3.4,expected:3.0,core:null,meetingWeeks:6},   // 10장 모형 경제의 가상 발표(전년 동월 대비 %). 근원물가는 아직 보지 않음
 hypotheses:{
  A:{name:'수입 물가 충격 한 번',shock:{size:5,start:1,len:1}},
  B:{name:'물가 압력이 네 분기 이어짐',shock:{size:5,start:1,len:4}}
 },
 hike:{size:0.25,start:2,len:4}                    // 10장 (다): 다음 분기부터 정책 금리 +0.25%p를 4분기
};

/* 실제 한국 통계와 사건(2026-10-13 확인). grade: '공식 원문(재게시)'(KDI 경제교육·정보센터에 다시 실린 공식 자료),
   '보도'(신문·방송), '학술'(학술 요약). unusual: 평소 범위를 크게 벗어난 이례적 값(확인 상자에만 두고 확인 문제·복습 답에 쓰지 않음).
   ⏱ 기준금리는 2026-10-22 금융통화위원회 결정 뒤 이 항목(policyRate)부터 고친다. 결정 뒤 한 커밋에서 3권 「금리와 채권」의 상자도 함께 고친다. */
const MARKET={
 policyRate:{value:3.00,prev:2.75,decided:'2026-08-27',julyFrom:2.50,julyTo:2.75,july:'2026-07-16',next:'2026-10-22',grade:'공식 원문(재게시)',checked:CHECKED,
  note:'2026-10-13 확인 기준 연 3.00%(2026-08-27 결정). 다음 결정 2026-10-22. ⏱ 결정 뒤 value·decided·checked와 4장·마지막 과제의 기준금리 문장, “이야기 뒤의 일” 상자를 함께 고친다(제작 문서 #rate-rule)',
  afterStory:null,  // ← 2026-10-22 결정 뒤 {date, value, change, grade, checked}로 채운다
  meetings2026:['01-15','02-26','04-10','05-28','07-16','08-27','10-22','11-26'],meetingsGrade:'2차 자료(3권 조사 노트 재인용)'},
 cpi:{index:120.43,base:'2020 = 100',yoy:2.9,mom:0.3,coreFoodEnergy:2.8,coreAgriOil:2.7,month:'2026-09',released:'2026-10-02',grade:'공식 원문(재게시)',checked:CHECKED},
 labor:{unemployment:2.0,employment1564:70.4,employmentChange:0.5,employedTenThousand:2915.1,employedChangeTenThousand:18.4,month:'2026-08',released:'2026-09-09',grade:'공식 원문(재게시)',checked:CHECKED},
 gdp:{quarter:'2026-Q2',realQoQ:0.6,realYoY:3.7,advance:'2026-07-23',released:'2026-09-08',grade:'공식 원문(재게시)',checked:CHECKED,
  nominalYoY:{value:26.4,grade:'공식 원문(재게시)',unusual:true},
  deflator:{value:21.9,grade:'보도',unusual:true},
  exportDeflator:{value:56.6,grade:'보도',unusual:true},
  savingRate:{value:45.6,change:3.9,grade:'공식 원문(재게시)',unusual:true},
  investmentRate:{value:24.2,change:-1.1,grade:'공식 원문(재게시)',unusual:false}},
 usdkrw:{value:1338.5,date:'2026-10-08',label:'주간 종가 15:30 · 보도',grade:'보도',checked:CHECKED},
 bop:{month:'2026-08',released:'2026-10-08',grade:'보도',checked:CHECKED,
  current:{value:461.1,unusual:true},goods:{value:468.1,unusual:true}},
 cli:{month:'2026-08',coincident:101.7,coincidentChange:0.5,leading:104.2,leadingChange:-0.1,released:'2026-09-30',grade:'보도',checked:CHECKED},
 calendar:[                                        // 8장 2026년 10월 발표 달력(이야기 시점에 이미 나온 것과 예정된 것)
  {what:'8월 산업활동동향(경기종합지수)',date:'2026-09-30',grade:'보도'},
  {what:'9월 소비자물가동향',date:'2026-10-02',grade:'공식 원문(재게시)'},
  {what:'8월 국제수지(잠정)',date:'2026-10-08',grade:'보도'},
  {what:'금융통화위원회 기준금리 결정',date:'2026-10-22',grade:'공식 원문(재게시)'}
 ],
 crisis:{
  y1997:{request:'1997-11-21',imf:210,imfDate:'1997-12-03',usdkrwBefore:900,usdkrwPeak:1962.0,peakDate:'1997-12-23',growth1998:{first:-5.1,current:-4.9},grade:'보도'},
  y2008:{rateBefore:5.00,raised:'2008-08',rateFrom:5.25,rateTo:2.00,krwWeaker:40,swap:300,swapDate:'2008-10-30',q4QoQ:-4.5,q4Annualized:17,grade:'학술'},
  y2020:{rateFrom:1.25,rateTo:0.75,cutDate:'2020-03-16',swap:600,swapDate:'2020-03-19',nextDayClose:1246.5,nextDayChange:-39.2,growth2020:-0.7,grade:'보도'}
 }
};

function need(cond,msg){if(!cond)throw new RangeError(msg);}
function num(x,name){need(typeof x==='number'&&Number.isFinite(x),name+' must be a finite number');}
function pos(x,name){num(x,name);need(x>0,name+' must be > 0');}
function rate(x,name,lo=-0.99,hi=10){num(x,name);need(x>lo&&x<=hi,name+' must be between '+lo+' and '+hi);}
function whole(x,name,lo,hi){need(Number.isInteger(x)&&x>=lo&&x<=hi,name+' must be a whole number '+lo+'–'+hi);}
const round=(x,d)=>{const f=Math.pow(10,d);return Math.round(x*f+(x>=0?1e-9:-1e-9))/f;};
const r2=x=>round(x,2),r3=x=>round(x,3);
/* 원화 금액(원)을 “13억 3,850만 원”처럼 만 원 단위로 적는다(화면용). */
function wonText(won){num(won,'won');const sign=won<0?'−':'',man=Math.round(Math.abs(won)/1e4),eok=Math.floor(man/1e4),rest=man%1e4;
 return sign+(eok?eok.toLocaleString('en-US')+'억'+(rest?' ':''):'')+(rest||!eok?rest.toLocaleString('en-US')+'만':'')+' 원';}

/* ── 1장 GDP ── GDP = C + I + G + (X − M). 비중은 GDP에 견준 몫(순수출은 X − M). */
function gdp(o=ASSUME.economy){
 for(const k of ['c','i','g','x','m'])num(o[k],k);const y=o.c+o.i+o.g+o.x-o.m,net=o.x-o.m;need(y>0,'GDP must be > 0');
 return {gdp:y,net,shares:{c:o.c/y,i:o.i/y,g:o.g/y,net:net/y}};
}
/* 실질 성장률 = (1 + 명목) ÷ (1 + 디플레이터) − 1. 근사 “명목 − 디플레이터”와 다르다. */
function realGrowth(nominal,deflator){rate(nominal,'nominal');rate(deflator,'deflator');return (1+nominal)/(1+deflator)-1;}
/* 분기(또는 한 기간) 성장률이 periods번 이어질 때의 증가율. 연율 = (1 + 분기)⁴ − 1. */
function annualize(q,periods=4){rate(q,'growth');whole(periods,'periods',1,12);return Math.pow(1+q,periods)-1;}

/* ── 2장 소비자물가지수 ── 지수 = Σ 가중치 × (올해 가격 ÷ 기준 가격) × 100. 가중치 합은 1. */
function priceIndex(items=ASSUME.basket){
 need(Array.isArray(items)&&items.length>0,'need at least one item');let wsum=0,idx=0;
 for(const it of items){num(it.w,'weight');need(it.w>=0,'weight must be ≥ 0');pos(it.p0,'base price');pos(it.p1,'price');wsum+=it.w;idx+=it.w*it.p1/it.p0;}
 need(Math.abs(wsum-1)<1e-9,'weights must add up to 1');
 return {index:100*idx,inflation:idx-1,parts:items.map(it=>({name:it.name,w:it.w,ratio:it.p1/it.p0,contribution:it.w*(it.p1/it.p0-1)}))};
}
const inflation=(now,before)=>{pos(now,'index');pos(before,'index');return now/before-1;};
/* 상승률로 1년 전 지수를 거꾸로 푼 어림(발표 수치가 반올림돼 실제와 조금 다를 수 있다). */
const indexBefore=(now,yoy)=>{pos(now,'index');rate(yoy,'yoy');return now/(1+yoy);};
/* 실질 수익률(피셔 식) = (1 + 명목) ÷ (1 + 물가 상승률) − 1. 1권 7장의 식을 여기서 새로 쓴다. */
const realRate=(nominal,infl)=>realGrowth(nominal,infl);

/* ── 3장 고용과 국면 ── 실업률 = 실업자 ÷ 경제활동인구, 참가율 = 경제활동인구 ÷ 15세 이상, 고용률 = 취업자 ÷ 15세 이상. */
function labor(o=ASSUME.town){
 for(const k of ['employed','unemployed'])num(o[k],k);need(o.employed>=0&&o.unemployed>=0,'counts must be ≥ 0');
 const force=o.employed+o.unemployed;pos(force,'labor force');const pop=o.pop15??force;need(pop>=force,'pop15 must be ≥ labor force');
 return {pop15:pop,force,inactive:pop-force,unemployment:o.unemployed/force,participation:force/pop,employment:o.employed/pop};
}
/* 실업자 n명이 구직을 포기해 경제활동인구에서 빠진다(15세 이상 인구와 취업자는 그대로). */
function discourage(o,n){whole(n,'n',0,o.unemployed);return labor({...o,unemployed:o.unemployed-n});}
/* GDP 갭의 수준과 방향으로 국면을 나눈다. 꼭대기에서 방향이 바뀌면 정점, 바닥에서 바뀌면 저점, 오르는 중이면 확장, 내리는 중이면 수축. */
function phase(series,t){
 need(Array.isArray(series)&&series.length>=3,'need at least three quarters');whole(t,'t',0,series.length-1);series.forEach(x=>num(x,'gap'));
 const prev=series[Math.max(0,t-1)],cur=series[t],next=series[Math.min(series.length-1,t+1)];
 const name=t>0&&t<series.length-1&&cur>prev&&cur>=next?'정점':t>0&&t<series.length-1&&cur<prev&&cur<=next?'저점':(t===0?next>cur:cur>prev)?'확장':'수축';
 return {t,gap:cur,level:cur>0?'잠재 GDP 위':cur<0?'잠재 GDP 아래':'잠재 GDP와 같음',direction:(t===0?next-cur:cur-prev)>0?'오르는 중':'내리는 중',phase:name};
}

/* ── 4·5·6·10장 정책 시나리오 모형 ── inputs: {rate,money,spend,shock} 각각 {size,start,len}(start는 1부터, 분기).
   stage는 그 장에서 여는 손잡이(policy·fiscal·fx·full). 결과는 기준선 대비 편차 네 줄과 기준선을 더한 수준. */
function checkInputs(inputs,stage){
 const allowed=MODEL.stages[stage];need(!!allowed,'unknown stage '+stage);const out={};
 for(const [k,v] of Object.entries(inputs||{})){
  need(k in MODEL.ranges,'unknown input '+k);need(allowed.includes(k),k+' is not open in the '+stage+' stage');if(v==null)continue;
  const size=v.size??0,start=v.start??1,len=v.len??4,[lo,hi]=MODEL.ranges[k];num(size,k+' size');need(size>=lo-1e-12&&size<=hi+1e-12,k+' must be between '+lo+' and '+hi+' (outside the range the linear model loses meaning)');
  whole(start,k+' start',1,MODEL.quarters);whole(len,k+' length',1,MODEL.maxLen[k]);out[k]={size,start,len};
 }
 return out;
}
const on=(v,q)=>v&&q>=v.start&&q<v.start+v.len?v.size:0;
function scenario(inputs={},o={}){
 const stage=o.stage||'full',n=o.quarters??MODEL.quarters;whole(n,'quarters',1,MODEL.quarters);const v=checkInputs(inputs,stage),k=MODEL.coef,b=MODEL.baseline;
 const i=[],e=[],y=[],pi=[];
 for(let q=1;q<=n;q++){
  const t=q-1,iq=on(v.rate,q)-k.km*on(v.money,q)+k.kg*on(v.spend,q),eq=-k.ki*iq;
  const yq=(t>0?k.ay*y[t-1]:0)-(t>1?k.by*i[t-2]:0)+k.gy*on(v.spend,q)+(t>0?k.ey*e[t-1]:0);
  const pq=(t>0?k.ap*pi[t-1]+k.bp*y[t-1]+k.ep*e[t-1]:0)+k.sp*on(v.shock,q);
  i.push(iq);e.push(eq);y.push(yq);pi.push(pq);
 }
 return {stage,inputs:v,quarters:n,i,e,y,pi,level:{marketRate:i.map(x=>b.policyRate+x),usdkrw:e.map(x=>b.usdkrw*(1+x/100)),inflation:pi.map(x=>b.inflation+x)}};
}
/* 한 줄에서 절댓값이 가장 큰 편차와 그 분기(1부터). 모두 0이면 q는 null. 같은 크기면 앞 분기. */
function peak(series){
 need(Array.isArray(series)&&series.length>0,'need a series');let best=0,q=null;
 series.forEach((x,t)=>{num(x,'value');if(Math.abs(x)>Math.abs(best)+1e-12){best=x;q=t+1;}});return {q,value:best};
}
function peaks(s){return {i:peak(s.i),e:peak(s.e),y:peak(s.y),pi:peak(s.pi)};}
/* 두 결과를 분기마다 더한다(선형 모형의 중첩 확인용). */
function addPaths(a,b){need(a.quarters===b.quarters,'same number of quarters');const plus=(p,q)=>p.map((x,t)=>x+q[t]);return {i:plus(a.i,b.i),e:plus(a.e,b.e),y:plus(a.y,b.y),pi:plus(a.pi,b.pi),quarters:a.quarters};}
/* 지출이 오래 이어질 때의 장기 승수 = gy ÷ (1 − ay)(금리·환율 반응을 빼고 본 값, 이 책의 가정). */
const multiplier=()=>MODEL.coef.gy/(1-MODEL.coef.ay);
/* 첫 분기 GDP가 움직이지 않는 까닭: 금리는 i(q−2), 환율은 e(q−1)로 들어가므로 금리 경로는 3분기, 환율 경로는 2분기부터 걸린다. */
const firstQuarters=()=>({fx:2,rate:3});

/* ── 6장 환율과 원화 금액 ── 원화 금액 = 달러 × 원/달러. 1달러당 원화 변화 = 이후 ÷ 이전 − 1, 원화 1원의 달러 가치 변화 = 이전 ÷ 이후 − 1. */
function won(usd,usdkrw){num(usd,'usd');need(usd>=0,'usd must be ≥ 0');pos(usdkrw,'usdkrw');return usd*usdkrw;}
function fxMove(before,after){pos(before,'before');pos(after,'after');return {perDollar:after/before-1,wonValue:before/after-1};}
/* 원/달러가 비율 fall만큼 내린 환율. roundTo는 반올림 자릿수(6장은 소수 첫째 자리 1,311.7원). */
function fxAfter(usdkrw,change,roundTo=1){pos(usdkrw,'usdkrw');rate(change,'change',-0.99,1);const exact=usdkrw*(1+change);return {exact,rounded:round(exact,roundTo)};}
function fxAmounts(usd,before,after){const a=won(usd,before),b=won(usd,after);return {before:a,after:b,diff:b-a,change:b/a-1};}

/* ── 7장 경상수지 ── 경상수지 = 상품 + 서비스 + 본원소득 + 이전소득 수지. 상품수지를 뺀 나머지 셋의 합 = 경상 − 상품. */
function currentAccount(o=ASSUME.trade){for(const k of ['goods','services','primary','secondary'])num(o[k],k);return {ca:o.goods+o.services+o.primary+o.secondary,nonGoods:o.services+o.primary+o.secondary};}
const nonGoods=(ca,goods)=>{num(ca,'current account');num(goods,'goods');return ca-goods;};
/* 저축 − 투자 = 순수출: 국민저축 S = Y − C − G로 놓으면 Y = C + I + G + (X − M)에서 S − I = X − M(정의에서 나오는 항등식). */
function savingInvestment(o=ASSUME.economy){const g=gdp(o),s=g.gdp-o.c-o.g;return {saving:s,investment:o.i,gap:s-o.i,net:g.net};}

/* ── 8장 시차 상관 ── 동행을 k달 늦춰 선행[t]와 동행[t + k]를 짝짓고 피어슨 상관계수 r을 계산한다(쌍의 수 n = 길이 − k). */
function pearson(a,b){
 need(a.length===b.length&&a.length>=3,'need at least three pairs');const n=a.length,ma=a.reduce((s,x)=>s+x,0)/n,mb=b.reduce((s,x)=>s+x,0)/n;
 let sab=0,saa=0,sbb=0;for(let t=0;t<n;t++){const da=a[t]-ma,db=b[t]-mb;sab+=da*db;saa+=da*da;sbb+=db*db;}need(saa>0&&sbb>0,'a series with no variation has no correlation');
 return sab/Math.sqrt(saa*sbb);
}
function lagCorr(lead=ASSUME.lead,coin=ASSUME.coin,k=0){
 need(Array.isArray(lead)&&Array.isArray(coin)&&lead.length===coin.length,'two series of the same length');[...lead,...coin].forEach(x=>num(x,'value'));whole(k,'lag',0,lead.length-3);
 const a=lead.slice(0,lead.length-k),b=coin.slice(k);return {k,n:a.length,r:pearson(a,b)};
}
function lagTable(lead=ASSUME.lead,coin=ASSUME.coin,maxLag=4){const rows=[];for(let k=0;k<=maxLag;k++)rows.push(lagCorr(lead,coin,k));const best=rows.reduce((m,x)=>x.r>m.r?x:m,rows[0]);return {rows,best};}

/* ── 9장 위기 지표 ── 변화율과 원화 가치. 숫자가 출처마다 다르면 계산하지 않고 둘 다 적는다(MARKET.crisis). */
function crisisNumbers(c=MARKET.crisis){
 const k=c.y1997,f=fxMove(k.usdkrwBefore,k.usdkrwPeak);
 return {fx1997:f,rate2008:c.y2008.rateTo-c.y2008.rateFrom,annual2008:annualize(c.y2008.q4QoQ/100),rate2020:c.y2020.rateTo-c.y2020.rateFrom,growth1998Gap:k.growth1998.current-k.growth1998.first};
}

/* ── 10장 마지막 과제 ── 예상과의 차이와 두 가설의 8분기 경로. 시장 가격(모형 경제의 3년 국채 금리·자국 통화 환율·주가지수)은 계산하지 않는다. */
const surprise=(actual=ASSUME.release.actual,expected=ASSUME.release.expected)=>{num(actual,'actual');num(expected,'expected');return r3(actual-expected);};
function hypothesisPaths(hike=ASSUME.hike,quarters=8){
 const run=(shock,withHike)=>scenario(withHike?{shock,rate:hike}:{shock},{stage:'full',quarters});
 const A=ASSUME.hypotheses.A.shock,B=ASSUME.hypotheses.B.shock;
 return {A:run(A,false),B:run(B,false),Ahike:run(A,true),Bhike:run(B,true)};
}
/* 물가 편차가 처음으로 기준선 아래(< 0)로 내려가는 분기(1부터). 없으면 null. */
const firstBelow=series=>{const t=series.findIndex(x=>x<0);return t<0?null:t+1;};
function finalTask(){const p=hypothesisPaths();return {surprise:surprise(),paths:p,sameFirstQuarter:r3(p.A.pi[0])===r3(p.B.pi[0]),belowA:firstBelow(p.Ahike.pi)};}

const assumptions={
 model:'정책 시나리오 모형의 계수는 교재의 방향과 시차에 맞춰 고른 가정이며 통계로 추정하지 않았다(예측 아님)',
 lag:'시차는 식에 넣은 가정(금리 i(q−2), 지속 계수 0.6·0.7)이며 모형이 찾아낸 것이 아니다',
 linear:'선형 모형이라 입력을 몇 배로 하면 결과도 같은 배수가 되고, 함께 넣은 결과는 따로 넣은 결과의 합이다(실제 경제에서는 다를 수 있다는 단순화)',
 floor:'금리 하한(0%)과 중앙은행의 재반응은 넣지 않았다(이 책의 단순화)',
 fx:'금리 1%p당 원화 2% 강세는 방향만 교재·한국은행 글에서 확인한 가정이고 크기의 근거는 없다',
 spend:'지출 GDP 대비 1%당 시장 금리 +0.10%p(자금 수요)와 승수 0.8은 가정이다',
 rounding:'6장 원화 금액은 1,338.5 × 0.98 = 1,311.73원을 1,311.7원으로 반올림한 환율로 계산한 값이다(이 책의 단순화)'
};
const api={CHECKED,MODEL,ASSUME,MARKET,assumptions,r2,r3,round,wonText,gdp,realGrowth,annualize,priceIndex,inflation,indexBefore,realRate,
 labor,discourage,phase,scenario,peak,peaks,addPaths,multiplier,firstQuarters,won,fxMove,fxAfter,fxAmounts,currentAccount,nonGoods,savingInvestment,
 pearson,lagCorr,lagTable,crisisNumbers,surprise,hypothesisPaths,firstBelow,finalTask};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.MMath=api;
})(typeof window!=='undefined'?window:globalThis);
