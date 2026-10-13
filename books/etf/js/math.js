/* 지수와 ETF 계산. DOM을 만지지 않으며 tests/math.test.cjs가 대표값·경계값·불변 조건을 검사한다.
   「금융과 투자 처음부터」 7권 「지수와 ETF · 기초지수·NAV·괴리율로 ETF 비교하기」의 계산 원본이다.
   책 사이 코드 의존을 두지 않는다(3권 bonds의 채권 가격 식, 1권 money의 복리 식이 있어도 여기서 새로 쓴다).
   단위와 표기:
   - 금액은 원이다. 주식·ETF 수량은 1주 단위로 버린다(ETF 매매수량단위 1주, 한국거래소 규정포털, 조사 노트 3-7).
     iNAV 추정값은 원 미만을 반올림한다. 10년 뒤 금액은 원 미만을 반올림하고, 두 금액의 차이는 반올림 전 값의 차이를 반올림한다
     (조사 노트 V-5: 20년 차이 923,933.20원 → 923,933원. 반올림한 두 금액의 차는 923,934원이다).
   - 비율과 수익률은 소수다(0.012 = 1.2%). 화면에서 %나 %p로 바꾼다. %p는 두 백분율의 차이다.
   - 지수 1포인트 = 100원으로 놓는다(누리200 지수 300.00 = 누리200 ETF NAV 30,000원, 가정).
   - 규칙 숫자(호가단위, 가격제한폭, 괴리율 공시 기준, LP 종가 괴리율 관리 기준, LP 의무 면제 시간, 과세 유형의 세율)는
     모두 RULES 한 곳에 둔다. 확인일은 2026-10-13이다. 호가단위·가격제한폭·매매수량단위는 한국거래소 규정포털 원문으로,
     나머지는 보도·운용사·은행 안내로만 확인했다(조사 노트 머리말). 규칙이 바뀌면 RULES만 고친다.
   - 보도로도 확인하지 못한 것은 계산에 쓰지 않거나 assumptions에 이름을 남기고 화면에 "확인 못함"으로 적는다:
     LP 의무 장 시작 전 면제 시각(08:00과 08:30이 어긋남), 해외 기초자산 iNAV 추정 방식(환율 × 선물은 이 책의 단순화),
     실제 설정단위(CU) 크기(10만 좌는 가정), 면제 시간에 LP가 호가를 내지 않는다는 실험 시나리오.
   - 실제 계산(지수·NAV·괴리율·비용·재조정 금액)과 미리 정한 가상 시나리오(장중 지수 경로, 다른 투자자의 호가, 비용 전 수익률 5%)를 구분한다.
   - 레버리지 상품의 감쇠 크기와 거래 요건은 8권, ETF 세금 금액은 11권이 계산한다. 여기서는 재조정 매매 금액과 과세 유형·세율만 낸다. */
(function(root){
'use strict';
const CHECKED='2026-10-13';
const RULES={
 tick:[[2000,1],[Infinity,5]],            // ETF 호가가격단위: 2,000원 미만 1원, 이상 5원(공식 원문, 조사 노트 3-7)
 lot:1,                                   // ETF 매매수량단위 1주(공식 원문, 3-7)
 priceLimit:0.30,                         // 가격제한폭 기준가격 ±30%, 레버리지 ETF는 배율만큼 확대(공식 원문, 5-2)
 disclose:{domestic:0.01,foreign:0.02},   // 괴리율 공시 기준(보도 기준, 3-2). 종가 기준인지 장중 기준인지는 확인 못함
 lpClose:{domestic:0.02,foreign:0.05,since:'2026-08-19',before:{domestic:0.03,foreign:0.06}}, // LP 종가 괴리율 관리 기준(보도 기준, 3-3)
 lpExempt:[['09:00','09:05'],['15:20','15:30']], // LP 호가 의무 면제 시간(보도 기준, 3-4). 장 시작 전 면제 시작 시각은 확인 못함이라 넣지 않음
 lpMinQty:100,                            // LP 최소 호가 수량(보도 기준, 3-4)
 auction:['15:20','15:30'],               // 장 마감 단일가 시간(4권 조사 노트 1-5)
 tax:{kequity:0,kother:0.154,foreign:0.22,stt:0} // 매매차익 세율과 ETF 매도 거래세(보도 기준, 7-1·7-2). 공제와 금액은 11권
};
const CU=100000;                          // 설정단위 10만 좌(가정, 조사 노트 2-1)
const POINT=100;                          // 지수 1포인트 = 100원(가정)
const DAYS=250;                           // 추적 오차 연율화 거래일 수(이 책의 가정, 8권과 같은 관례)
const ETFS={                              // 가상의 ETF. 총보수·총비용·스프레드는 가정(문서 #plan). 가람200의 기타비용·매매중개수수료 나눔은 이 책이 정한 값
 nuri:{name:'누리200',index:'누리200 지수',nav:30000,fee:0.0015,other:0.0003,trading:0.0004,spread:5,underlying:'kstock',listing:'domestic'},
 garam:{name:'가람200',index:'누리200 지수',nav:30000,fee:0.0005,other:0.0003,trading:0.0005,spread:30,underlying:'kstock',listing:'domestic'},
 overseas:{name:'누리 해외100',index:'해외100 지수',nav:12000,underlying:'fstock',listing:'domestic'}
};
function need(cond,msg){if(!cond)throw new RangeError(msg);}
function num(x,name){need(typeof x==='number'&&Number.isFinite(x),name+' must be a finite number');}
function money(x,name){num(x,name);need(x>=0,name+' must be ≥ 0');}
function rate(x,name){num(x,name);need(x>-1,name+' must be above −100%');}
const round2=x=>Math.round(x*100+1e-9)/100;
const minutes=t=>{need(/^\d{2}:\d{2}$/.test(t),'time must look like HH:MM');const [h,m]=t.split(':').map(Number);return h*60+m;};

/* ── 1장 시가총액 방식 지수 ── 지수 = 오늘 시가총액 합 ÷ 기준 시가총액 × 100. stocks: [{price, shares, float?}] */
function marketCap(s,useFloat=false){money(s.price,'price');money(s.shares,'shares');const f=useFloat?(s.float??1):1;need(f>=0&&f<=1,'float must be between 0 and 1');return s.price*s.shares*f;}
function totalCap(stocks,useFloat=false){need(Array.isArray(stocks)&&stocks.length>0,'stocks must be a non-empty list');return stocks.reduce((t,s)=>t+marketCap(s,useFloat),0);}
function indexLevel(cap,baseCap,base=100){money(cap,'cap');num(baseCap,'baseCap');need(baseCap>0,'baseCap must be > 0');return cap/baseCap*base;}
/* 구성 종목을 바꿀 때: 바꾸기 직전 지수가 그대로 이어지도록 기준 시가총액을 바꾼 뒤의 합에 맞춰 고친다. */
function rebase(baseCap,capBefore,capAfter){num(baseCap,'baseCap');need(baseCap>0&&capBefore>0&&capAfter>0,'caps must be > 0');return baseCap*capAfter/capBefore;}

/* ── 2장 가중 방식 ── method: cap(시가총액), float(유동시가총액), equal(동일). 비중의 합은 1. */
function weights(stocks,method){
 need(['cap','float','equal'].includes(method),'unknown weighting '+method);
 if(method==='equal')return stocks.map(()=>1/stocks.length);
 const caps=stocks.map(s=>marketCap(s,method==='float')),t=caps.reduce((a,b)=>a+b,0);need(t>0,'total cap must be > 0');return caps.map(c=>c/t);
}
/* 지수 수익률 = Σ(비중 × 종목 수익률), 곧 비중 벡터와 수익률 벡터의 내적. */
function indexReturn(w,returns){need(w.length===returns.length,'weights and returns must have the same length');returns.forEach((r,i)=>rate(r,'return '+i));return w.reduce((t,x,i)=>t+x*returns[i],0);}
/* 하루가 지난 뒤의 비중. 동일 가중도 가격이 움직이면 비중이 달라져 다시 맞춰야 한다. */
function drift(w,returns){const grown=w.map((x,i)=>x*(1+returns[i])),t=grown.reduce((a,b)=>a+b,0);return grown.map(g=>g/t);}

/* ── 3장 설정·환매 ── AP가 설정단위(CU)만큼 바구니를 넣으면(cus > 0) 좌수와 순자산이 늘고, 환매(cus < 0)면 준다.
   바구니는 1좌당 NAV로 값을 매기므로 NAV는 그대로다. 거래소 매매는 좌수와 순자산을 바꾸지 않는다. */
function nav(assets,units){money(assets,'assets');need(units>0,'units must be > 0');return assets/units;}
function createRedeem(assets,units,cus,cu=CU){
 need(Number.isInteger(cus),'cus must be a whole number');need(Number.isInteger(cu)&&cu>0,'cu must be a whole number > 0');
 const per=nav(assets,units),newUnits=units+cus*cu;need(newUnits>0,'cannot redeem more units than exist');
 return {units:newUnits,assets:assets+cus*cu*per,nav:per,change:cus*cu};
}

/* ── 4장 NAV·iNAV·괴리율·LP ── */
function navFromIndex(level,point=POINT){money(level,'index');return Math.round(level*point*100)/100;}
function gap(price,nav0){money(price,'price');num(nav0,'nav');need(nav0>0,'nav must be > 0');return (price-nav0)/nav0;}
function tick(price){money(price,'price');for(const [hi,t] of RULES.tick)if(price<hi)return t;}
const tickUp=p=>Math.ceil(p/tick(p)-1e-9)*tick(p),tickDown=p=>Math.floor(p/tick(p)+1e-9)*tick(p);
/* 괴리율을 보도된 기준과 견준다. underlying: domestic | foreign. 기준선 위면 true(같으면 넘지 않음). */
function gapCheck(g,underlying='domestic'){num(g,'gap');need(['domestic','foreign'].includes(underlying),'underlying must be domestic or foreign');const a=Math.abs(g);return {disclose:a>RULES.disclose[underlying]+1e-12,lpClose:a>RULES.lpClose[underlying]+1e-12,discloseLine:RULES.disclose[underlying],lpLine:RULES.lpClose[underlying]};}
function lpExempt(time){const m=minutes(time);return RULES.lpExempt.some(([a,b])=>m>=minutes(a)&&m<minutes(b));}
function isAuction(time){const m=minutes(time);return m>=minutes(RULES.auction[0])&&m<=minutes(RULES.auction[1]);}
/* 가상 호가창: 다른 투자자의 매도 호가는 iNAV 위 0.5%·1%·2%·3%·5%에 100·200·300·500·1,000주(미리 정한 시나리오).
   LP가 호가를 내면 iNAV ± lpHalf(기본 40원)에 lpQty주씩 다섯 칸을 더한다. 면제 시간에는 LP 호가가 없다고 놓는다(시나리오). */
const OTHERS=[[0.005,100],[0.01,200],[0.02,300],[0.03,500],[0.05,1000]];
function askBook(inav,lpOn,o={}){
 money(inav,'inav');const half=o.lpHalf??40,qty=o.lpQty??1000,levels=[];
 if(lpOn){const a=tickUp(inav+half);for(let i=0;i<5;i++)levels.push([a+i*tick(a),qty,'LP']);}
 for(const [p,q] of OTHERS)levels.push([tickUp(inav*(1+p)),q,'others']);
 return levels.sort((x,y)=>x[0]-y[0]);
}
function bidBook(inav,lpOn,o={}){const half=o.lpHalf??40,qty=o.lpQty??1000,levels=[];if(lpOn){const b=tickDown(inav-half);for(let i=0;i<5;i++)levels.push([b-i*tick(b),qty,'LP']);}for(const [p,q] of OTHERS)levels.push([tickDown(inav*(1-p)),q,'others']);return levels.sort((x,y)=>y[0]-x[0]);}
/* 시장가 매수 qty주. 접속매매는 칸마다 그 가격에, 단일가는 모두 마지막 칸 가격 하나로 체결된다고 놓는다(다른 매수 주문은 없음). */
function marketBuy(asks,qty,auction=false){
 need(Number.isInteger(qty)&&qty>=0,'qty must be a whole number ≥ 0');let left=qty,cost=0,last=null,levels=0;
 for(const [p,q] of asks){if(left<=0)break;const take=Math.min(left,q);cost+=take*p;left-=take;last=p;levels++;}
 const filled=qty-left;if(auction&&filled)cost=filled*last;
 return {filled,unfilled:left,last,levels,avg:filled?cost/filled:null,cost};
}
/* 괴리율 실험 한 장면: 시각·지수·LP 단추·매수 수량으로 iNAV, 체결가, 괴리율, 기준 비교, AP 차익 방향을 낸다. */
function gapScene(o){
 const inav=Math.round(navFromIndex(o.index,o.point??POINT)),auction=isAuction(o.time),lp=!!o.lp&&!lpExempt(o.time),asks=askBook(inav,lp,o);
 const fill=marketBuy(asks,o.qty??100,auction),price=fill.last??asks[0][0],g=gap(price,inav),check=gapCheck(g,o.underlying||'domestic');
 return {inav,auction,lp,exempt:lpExempt(o.time),asks,fill,price,gap:g,check,ap:arbitrage(price,inav,o.cu??CU)};
}
/* AP의 차익거래(비용 전): 시장가 > NAV면 바구니로 설정해 ETF를 팔고, 시장가 < NAV면 ETF를 사서 환매한다. CU 하나 기준. */
function arbitrage(price,nav0,cu=CU){const d=price-nav0;return {action:d>0?'create':d<0?'redeem':'none',perUnit:Math.abs(d),perCU:Math.abs(d)*cu};}

/* ── 5장 추적 괴리·추적 오차·총비용 ── */
function periodReturn(daily){need(Array.isArray(daily),'daily returns must be a list');return daily.reduce((v,r)=>{rate(r,'return');return v*(1+r);},1)-1;}
const trackingDiff=(etfRet,idxRet)=>{num(etfRet,'etf return');num(idxRet,'index return');return etfRet-idxRet;};
/* 추적 오차 = 하루 차이(ETF − 지수)의 표본 표준편차 σ × √250. 한국 안내는 "추적오차"를 기간 차이로도 쓴다(조사 노트 4-1). */
function trackingError(etfDaily,idxDaily,days=DAYS){
 need(etfDaily.length===idxDaily.length&&etfDaily.length>=2,'need two equal lists of at least two days');
 const d=etfDaily.map((r,i)=>r-idxDaily[i]),m=d.reduce((a,b)=>a+b,0)/d.length,sd=Math.sqrt(d.reduce((a,x)=>a+(x-m)**2,0)/(d.length-1));
 return {diffs:d,mean:m,daily:sd,annual:sd*Math.sqrt(days)};
}
/* 총보수 + 기타비용 = 합성총보수(TER), TER + 매매중개수수료 = 총비용(보도 기준 정의, 조사 노트 4-2). */
function costs(fee,other,trading){[fee,other,trading].forEach((x,i)=>{num(x,'cost '+i);need(x>=0&&x<0.1,'cost rates must be between 0 and 10%');});return {ter:fee+other,total:fee+other+trading};}
const etfCost=k=>{const e=ETFS[k];need(!!e&&e.fee!==undefined,'unknown etf '+k);return costs(e.fee,e.other,e.trading);};
/* n년 뒤 금액 = 원금 × ((1 + r)(1 − c))ⁿ. 해마다 끝에 비용을 뗀다는 단순화. r은 비용 전 수익률(가상 시나리오). */
function grow(principal,r,c,years){money(principal,'principal');rate(r,'r');need(c>=0&&c<1,'cost must be between 0 and 100%');need(Number.isInteger(years)&&years>=0,'years must be a whole number ≥ 0');return principal*Math.pow((1+r)*(1-c),years);}
function costGap(principal,r,cA,cB,years){const a=grow(principal,r,cA,years),b=grow(principal,r,cB,years);return {a:Math.round(a),b:Math.round(b),diff:Math.round(Math.abs(b-a))};}

/* ── 6장 레버리지·인버스 재조정 ── 노출 = 배수 × 순자산. 하루 뒤 노출 = 노출 × (1 + r), 새 순자산 = 순자산 × (1 + 배수 × r).
   재조정 매매 = 배수 × 새 순자산 − 하루 뒤 노출 = 배수 × (배수 − 1) × r × 순자산. 양수면 노출을 늘리는 매수(인버스는 되삼).
   비용·차입 이자·추적 괴리는 넣지 않는다. 감쇠의 크기는 8권 #drag가 계산한다. */
function rebalance(nav0,multiple,r){
 money(nav0,'nav');num(multiple,'multiple');need(multiple!==0,'multiple must not be 0');rate(r,'index return');
 const exposure=multiple*nav0,after=exposure*(1+r),newNav=nav0*(1+multiple*r);need(newNav>0,'the fund would be wiped out');
 const target=multiple*newNav;return {exposure,after,nav:newNav,target,trade:target-after};
}
function rebalanceDays(nav0,multiple,returns){let v=nav0;return returns.map(r=>{const d=rebalance(v,multiple,r);v=d.nav;return {...d,r};});}
function priceLimit(multiple=1){num(multiple,'multiple');need(multiple!==0,'multiple must not be 0');return RULES.priceLimit*Math.abs(multiple);}

/* ── 7장 기초자산별 iNAV ── 해외 지수: 전일 NAV × (1 + 환율 변화) × (1 + 해외 지수 선물 변화), 원 미만 반올림.
   이 식은 출처가 직접 적지 않은 이 책의 단순화다(조사 노트 6-3, 확인 못함). 환헤지 없음. */
function foreignInav(prevNav,fx,fut=0){money(prevNav,'prevNav');rate(fx,'fx');rate(fut,'futures');return Math.round(prevNav*(1+fx)*(1+fut));}
/* 채권 가격: 반년마다 이표, 만기에 액면. 3권 #duration의 나라 3년(3.875%, 3년, 3.961%)과 나라 10년(4.5%, 10년, 4.376%)을 다시 계산한다. */
function bondPrice(coupon,y,years,face=10000,freq=2){
 num(coupon,'coupon');rate(y,'yield');need(Number.isInteger(years*freq)&&years>0,'years × freq must be a whole number > 0');
 const n=years*freq,c=face*coupon/freq,k=y/freq;let p=0;for(let i=1;i<=n;i++)p+=c/Math.pow(1+k,i);return p+face/Math.pow(1+k,n);
}
function bondMove(coupon,y,years,dy){const p0=bondPrice(coupon,y,years),p1=bondPrice(coupon,y+dy,years);return {p0,p1,change:p1/p0-1};}
/* 복제 방식별 위험 항목(조사 노트 6-1·6-2). 값은 "있음/없음"이며 정도를 재지 않는다. */
const RISKS={
 physical:{holds:true,counterparty:false,issuerCredit:false,maturity:false},
 synthetic:{holds:false,counterparty:true,issuerCredit:false,maturity:false},
 etn:{holds:false,counterparty:false,issuerCredit:true,maturity:true}
};
function riskTable(kind){need(!!RISKS[kind],'unknown replication '+kind);return {...RISKS[kind]};}

/* ── 8장 과세 유형 ── underlying: kstock(국내 주식, 60% 이상) | bond | commodity | fstock | derivative, listing: domestic | foreign.
   유형과 매매차익 세율만 낸다. 공제·금액·계좌별 차이는 11권 #etf와 #order(보도 기준, 조사 노트 7-1·7-2). */
const UNDERLYINGS=['kstock','bond','commodity','fstock','derivative'];
function taxType(underlying,listing='domestic'){
 need(UNDERLYINGS.includes(underlying),'unknown underlying '+underlying);need(['domestic','foreign'].includes(listing),'listing must be domestic or foreign');
 if(listing==='foreign')return {type:'foreign',gainRate:RULES.tax.foreign,income:'양도소득',stt:RULES.tax.stt};
 if(underlying==='kstock')return {type:'kequity',gainRate:RULES.tax.kequity,income:'비과세',stt:RULES.tax.stt};
 return {type:'kother',gainRate:RULES.tax.kother,income:'배당소득',stt:RULES.tax.stt};
}

/* ── 9장 목적별 비교 ── 보유 비용은 총비용 차이의 복리, 거래 비용은 왕복마다 스프레드 한 칸 × 주식 수(시장가 30,000원, 가정). */
function shares(amount,price){money(amount,'amount');money(price,'price');need(price>0,'price must be > 0');return Math.floor(amount/price+1e-9);}
function spreadCost(amount,price,spread,trips=1){need(Number.isInteger(trips)&&trips>=0,'trips must be a whole number ≥ 0');money(spread,'spread');return shares(amount,price)*spread*trips;}
/* purpose: {amount, years, trips(보유 기간 전체의 왕복 수), r}. 두 ETF의 보유 비용 차와 거래 비용 차, 차이가 큰 항목, 순서가 뒤집히는 왕복 수. */
function comparePurpose(p,a='nuri',b='garam'){
 const A=ETFS[a],B=ETFS[b],r=p.r??0.05,price=p.price??30000,g=costGap(p.amount,r,etfCost(a).total,etfCost(b).total,p.years);
 const tradeA=spreadCost(p.amount,price,A.spread,p.trips),tradeB=spreadCost(p.amount,price,B.spread,p.trips),perTrip=shares(p.amount,price)*Math.abs(B.spread-A.spread);
 return {hold:g,trade:{a:tradeA,b:tradeB,diff:Math.abs(tradeB-tradeA)},bigger:g.diff>Math.abs(tradeB-tradeA)?'hold':'trade',crossTrips:perTrip?Math.floor(g.diff/perTrip)+1:null};
}

/* ── 10장 마지막 과제 ── 15:25 예상 체결가에 amount원어치를 1주 단위로 사고, (나) 다음 거래일 시장가가 NAV로 돌아오면(지수 변화 indexMove),
   (다) 1년 뒤 괴리 0이면 같은 돈을 NAV에 냈을 때와 비교한다. 남은 돈은 현금으로 둔다. */
function finalTask(amount,price,nav0,indexMove=0){
 const n=shares(amount,price),paid=n*price,g=gap(price,nav0),later=n*nav0*(1+indexMove);
 return {gap:g,shares:n,paid,cash:amount-paid,value:Math.round(later),loss:Math.round(later-paid),lossRate:(later-paid)/paid,navShares:shares(paid,nav0),premium:Math.round(paid-n*nav0)};
}

const assumptions={
 preOpenExempt:'LP 의무가 장 시작 전 몇 시부터 면제되는지(08:00과 08:30이 어긋남, 확인 못함)',
 foreignInav:'해외 기초자산 iNAV를 환율과 해외 지수 선물로 추정한다(이 책의 단순화, 확인 못함)',
 cuSize:'설정단위 10만 좌(실제 크기는 상품마다 다름, 확인 못함)',
 lpScenario:'면제 시간에 LP가 호가를 내지 않는다(실험 시나리오, 실제로는 낼 수도 있음)',
 discloseBasis:'괴리율 공시 판정이 종가 기준인지 장중 기준인지(확인 못함)'
};
const api={CHECKED,RULES,CU,POINT,DAYS,ETFS,RISKS,UNDERLYINGS,assumptions,round2,minutes,marketCap,totalCap,indexLevel,rebase,weights,indexReturn,drift,
 nav,createRedeem,navFromIndex,gap,tick,tickUp,tickDown,gapCheck,lpExempt,isAuction,askBook,bidBook,marketBuy,gapScene,arbitrage,
 periodReturn,trackingDiff,trackingError,costs,etfCost,grow,costGap,rebalance,rebalanceDays,priceLimit,foreignInav,bondPrice,bondMove,riskTable,
 taxType,shares,spreadCost,comparePurpose,finalTask};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.EMath=api;
})(typeof window!=='undefined'?window:globalThis);
