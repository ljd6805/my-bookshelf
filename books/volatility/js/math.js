/* 가격 흔들림 계산. DOM을 만지지 않으며 tests/math.test.cjs가 대표값·경계값·불변 조건을 검사한다.
   「금융과 투자 처음부터」 8권 「가격은 어떻게 흔들리는가」의 계산 원본이다. 책 사이 코드 의존을 두지 않는다.
   단위와 표기:
   - 가격은 양수(원 또는 지수 포인트). 단위를 바꾸지 않으므로 수익률·통계는 단위와 무관하다.
   - 수익률은 모두 소수(0.05 = 5%)다. 12권 GMath처럼 %로 받지 않는다. 화면에서 %로 바꾼다.
   - "한 기간"은 입력 배열의 한 칸이다. 보통 거래일 하루이고, 연율화는 기본 250기간 = 1년으로 둔다
     (국내 펀드 투자위험등급 산정의 연환산보정계수 √250. 조사 노트 1-7, 미국 자료는 252가 흔함).
   - 난수는 시드를 받는 결정적 생성기(mulberry32)라 같은 시드면 같은 경로가 나온다. 암호용이 아니다.
   이 파일의 무작위 경로는 실제 시세가 아니라 가정한 모형(정규 또는 Student-t 잡음, AR(1)·평균 회귀)에서 뽑은 가상 경로다. */
(function(root){
'use strict';
const PERIODS_PER_YEAR=250;

/* ── 난수 ── mulberry32: 32비트 시드에서 [0,1) 균등 난수. 정규는 Box–Muller, t는 정규 ÷ √(χ²/ν). */
function rng(seed){
 let a=(seed>>>0)||1;
 const uniform=()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
 let spare=null;
 const normal=()=>{
  if(spare!==null){const s=spare;spare=null;return s;}
  let u=0;while(u===0)u=uniform();const v=uniform(),r=Math.sqrt(-2*Math.log(u));
  spare=r*Math.sin(2*Math.PI*v);return r*Math.cos(2*Math.PI*v);
 };
 /* 분산이 1이 되도록 맞춘 Student-t(자유도 ν, 정수, ν>2). 분산 ν/(ν−2)를 √((ν−2)/ν)로 나눠 1로 맞춘다. */
 const studentT=nu=>{
  if(!(nu>2))throw new RangeError('nu must be > 2 for finite variance');
  let chi=0;for(let i=0;i<Math.round(nu);i++){const z=normal();chi+=z*z;}
  return normal()/Math.sqrt(chi/Math.round(nu))*Math.sqrt((nu-2)/nu);
 };
 return {uniform,normal,studentT};
}

/* ── 수익률 (1장) ──
   단순 수익률 R = P_t / P_{t−1} − 1, 로그 수익률 r = ln(P_t / P_{t−1}) = ln(1 + R).
   여러 기간을 이으면 단순 수익률은 (1 + R)을 곱하고, 로그 수익률은 더한다. */
function checkPrices(prices){
 if(!Array.isArray(prices)||prices.length<2)throw new RangeError('need at least two prices');
 prices.forEach(p=>{if(!(p>0))throw new RangeError('prices must be positive');});
}
function simpleReturns(prices){checkPrices(prices);return prices.slice(1).map((p,i)=>p/prices[i]-1);}
function logReturns(prices){checkPrices(prices);return prices.slice(1).map((p,i)=>Math.log(p/prices[i]));}
const simpleToLog=R=>Math.log1p(R);
const logToSimple=r=>Math.expm1(r);
/* 수익률 배열을 이어 붙인 전체 수익률. kind: 'simple'이면 Π(1+R)−1, 'log'면 Σr(로그 수익률 그대로). */
function compound(returns,kind='simple'){
 if(kind==='log')return returns.reduce((s,r)=>s+r,0);
 return returns.reduce((g,R)=>g*(1+R),1)-1;
}
/* 첫 가격과 수익률 배열로 가격 경로를 되살린다(단순 수익률). −100%면 0에서 멈춘다. */
function pathFromReturns(start,returns){
 const out=[start];returns.forEach(R=>out.push(Math.max(0,out[out.length-1]*(1+R))));return out;
}

/* ── 기술 통계 (3·5장) ── 표본 분산은 n−1로 나눈다(ddof=1). 첨도는 초과 첨도(정규 = 0). */
function mean(x){if(!x.length)throw new RangeError('empty');return x.reduce((s,v)=>s+v,0)/x.length;}
function variance(x,ddof=1){
 const n=x.length;if(n-ddof<=0)throw new RangeError('not enough values');
 const m=mean(x);return x.reduce((s,v)=>s+(v-m)*(v-m),0)/(n-ddof);
}
const sd=(x,ddof=1)=>Math.sqrt(variance(x,ddof));
/* 한 기간 표준편차를 1년으로: σ_연 = σ_기간 × √(기간 수). 수익률이 서로 독립이고 분산이 같다는 가정에서만 맞다. */
const annualizeVol=(sdPerPeriod,periods=PERIODS_PER_YEAR)=>sdPerPeriod*Math.sqrt(periods);
/* 한 기간 평균 로그 수익률을 1년으로(더하기): μ_연 = μ × 기간 수. 단순 수익률이면 (1+R)^기간 − 1. */
const annualizeMean=(m,periods=PERIODS_PER_YEAR,kind='log')=>kind==='log'?m*periods:Math.pow(1+m,periods)-1;
/* 모멘트 기반 왜도·초과 첨도(모집단 공식, n으로 나눔). 작은 표본에서는 치우침이 있다. */
function moments(x){
 const n=x.length,m=mean(x);let m2=0,m3=0,m4=0;
 x.forEach(v=>{const d=v-m;m2+=d*d;m3+=d*d*d;m4+=d*d*d*d;});
 m2/=n;m3/=n;m4/=n;
 return {skew:m2?m3/Math.pow(m2,1.5):0,kurtosis:m2?m4/(m2*m2)-3:0};
}
/* |수익률|이 기준(평균에서 k 표준편차) 밖으로 나간 날의 비율. 정규라면 k=3에서 약 0.27%. */
function tailShare(x,k=3){const m=mean(x),s=sd(x);return x.filter(v=>Math.abs(v-m)>k*s).length/x.length;}

/* ── 변동성 손실과 레버리지 ETF의 일일 재조정 (2장) ──
   k배 상품은 매일 기초지수 하루 수익률의 k배를 목표로 한다. 값 L_t = L_{t−1} × (1 + k R_t).
   하루에 1 + kR ≤ 0이면 값이 0이 되고 그 뒤로 0에 머문다(실제 상품은 그 전에 거래 정지·상장폐지 절차가 있음).
   feePerYear는 연 총보수(소수)로, 하루에 feePerYear/기간 수만큼 뺀다. 차입 비용·추적 오차·괴리율은 넣지 않는다. */
function leveragedPath(indexReturns,k=2,opts={}){
 const start=opts.start??100,periods=opts.periods??PERIODS_PER_YEAR,fee=(opts.feePerYear??0)/periods;
 const out=[start];
 indexReturns.forEach(R=>{const prev=out[out.length-1];out.push(prev<=0?0:Math.max(0,prev*(1+k*R-fee)));});
 return out;
}
/* 매일 재조정하지 않고 처음에 k배로 한 번만 산 경우(기간 수익률의 k배, 손실은 −100%에서 멈춤)와 견주기 위한 값. */
const staticLeverage=(totalIndexReturn,k=2)=>Math.max(-1,k*totalIndexReturn);
/* 지수가 제자리로 돌아오는 경로: 오를 때 +a, 내릴 때 1/(1+a) − 1. pairs번 되풀이(2×pairs 기간). */
function flatVolatileReturns(a,pairs){
 const out=[];for(let i=0;i<pairs;i++){out.push(a);out.push(1/(1+a)-1);}return out;
}
/* 연속 시간 근사(Avellaneda·Zhang 2009, 금리·보수 0): L_T/L_0 ≈ (S_T/S_0)^k × exp(−(k²−k)/2 × Σσ²).
   variancePerPeriod는 로그 수익률의 한 기간 분산, n은 기간 수. 이산 일일 재조정과의 차이는 작은 수익률에서 작다. */
const leveragedApprox=(indexGross,k,variancePerPeriod,n)=>Math.pow(indexGross,k)*Math.exp(-(k*k-k)/2*variancePerPeriod*n);
/* 변동성 손실 어림: 기하 평균 ≈ 산술 평균 − σ²/2 (한 기간, 소수). */
const volatilityDrag=sdPerPeriod=>sdPerPeriod*sdPerPeriod/2;

/* ── ATR (3장) ── Wilder(1978). bars: [{high, low, close}] (같은 단위).
   참범위 TR = max(고가 − 저가, |고가 − 전일 종가|, |저가 − 전일 종가|). 첫 봉은 전일 종가가 없어 고가 − 저가.
   ATR: 처음 n개 TR의 평균을 첫 값으로 두고, 이후 ATR_t = (ATR_{t−1} × (n − 1) + TR_t) / n. 값이 없는 앞 칸은 null. */
function trueRange(bars){
 return bars.map((b,i)=>{
  if(!(b.high>=b.low))throw new RangeError('high must be >= low');
  if(i===0)return b.high-b.low;
  const pc=bars[i-1].close;return Math.max(b.high-b.low,Math.abs(b.high-pc),Math.abs(b.low-pc));
 });
}
function atrWilder(bars,n=14){
 if(!(n>=1))throw new RangeError('n must be >= 1');
 const tr=trueRange(bars),out=tr.map(()=>null);if(tr.length<n)return out;
 let atr=mean(tr.slice(0,n));out[n-1]=atr;
 for(let i=n;i<tr.length;i++){atr=(atr*(n-1)+tr[i])/n;out[i]=atr;}
 return out;
}

/* ── 무작위 보행 생성기 (4~8장) ──
   로그 가격 x_t = ln P_t를 한 기간씩 움직인다.
     잡음 e_t = vol × ε_t, ε_t는 표준정규 또는 분산 1로 맞춘 Student-t(tails: 't', nu).
     수익률 자기상관(phi): r_t = drift + phi × (r_{t−1} − drift) + e_t   (AR(1), −1 < phi < 1)
     평균 회귀(kappa): x_t = x_{t−1} + r_t + kappa × (ln anchor − x_{t−1})   (이산 OU, 0 ≤ kappa < 1)
   phi = kappa = 0이면 독립 잡음의 무작위 보행(기하 무작위 보행). drift·vol은 한 기간 로그 수익률 단위다.
   kappa > 0이면 가격이 anchor(기본은 시작가)로 끌려가 박스권처럼 보이고, phi > 0이면 같은 방향이 이어져 추세처럼 보인다.
   반환: n+1개 가격(시작가 포함). */
function randomWalk(o={}){
 const n=o.n??250,start=o.start??100,drift=o.drift??0,vol=o.vol??.01,phi=o.phi??0,kappa=o.kappa??0;
 if(!(n>=1))throw new RangeError('n must be >= 1');
 if(!(Math.abs(phi)<1))throw new RangeError('phi must be in (-1, 1)');
 if(!(kappa>=0&&kappa<1))throw new RangeError('kappa must be in [0, 1)');
 if(!(start>0)||!(vol>=0))throw new RangeError('start > 0 and vol >= 0 required');
 const g=rng(o.seed??1),anchor=Math.log(o.anchor??start),eps=o.tails==='t'?()=>g.studentT(o.nu??6):g.normal;
 let x=Math.log(start),prev=drift;const out=[start];
 for(let t=0;t<n;t++){
  const r=drift+phi*(prev-drift)+vol*eps();
  x+=r+kappa*(anchor-x);prev=r;out.push(Math.exp(x));
 }
 return out;
}
/* 같은 설정으로 시드만 바꿔 여러 경로를 만들고 각 경로에 f를 적용한 값을 모은다(분포 세기용). */
function monteCarlo(o,trials,f){
 const out=[];for(let i=0;i<trials;i++)out.push(f(randomWalk({...o,seed:(o.seed??1)+i*7919})));return out;
}

/* ── 자기상관 (6장) ── 시차 lag의 표본 자기상관: Σ(x_t − m)(x_{t+lag} − m) / Σ(x_t − m)². 백색잡음이면 95%가 ±1.96/√n 안. */
function autocorr(x,lag=1){
 const n=x.length;if(!(lag>=1&&lag<n))throw new RangeError('lag out of range');
 const m=mean(x);let num=0,den=0;
 for(let t=0;t<n;t++){const d=x[t]-m;den+=d*d;if(t+lag<n)num+=d*(x[t+lag]-m);}
 return den?num/den:0;
}
const acf=(x,maxLag=10)=>Array.from({length:maxLag},(_,i)=>autocorr(x,i+1));
const acfBand=n=>1.96/Math.sqrt(n);

/* ── 분산비 (7장) ── Lo·MacKinlay(1988) 겹치는 q기간 합을 쓰는 분산비와 동분산 z 통계량.
   x: 한 기간 로그 수익률 T개. μ = 평균, σa² = Σ(x−μ)²/(T−1),
   σc² = Σ_{t=q}^{T}(x_{t−q+1}+…+x_t − qμ)² / m,  m = q(T−q+1)(1−q/T),
   VR(q) = σc²/σa²,  z = (VR−1) / √(2(2q−1)(q−1)/(3qT)).
   VR ≈ 1이면 무작위 보행과 구별되지 않음, VR > 1이면 같은 방향이 이어짐(추세 쪽), VR < 1이면 되돌림(평균 회귀 쪽).
   z 분모는 독립·동분산 가정이다. 변동성이 몰려 다니는 실제 수익률에는 이분산에 강한 통계량이 따로 있다(이 책은 다루지 않음). */
function varianceRatio(x,q=2){
 const T=x.length;if(!(q>=2&&q<T))throw new RangeError('need 2 <= q < T');
 const mu=mean(x),sa=x.reduce((s,v)=>s+(v-mu)*(v-mu),0)/(T-1);
 let win=0;for(let i=0;i<q;i++)win+=x[i];
 let sc=(win-q*mu)**2;
 for(let t=q;t<T;t++){win+=x[t]-x[t-q];sc+=(win-q*mu)**2;}
 const m=q*(T-q+1)*(1-q/T),vr=sa?sc/m/sa:1,se=Math.sqrt(2*(2*q-1)*(q-1)/(3*q*T));
 return {vr,z:(vr-1)/se,se,q,T};
}

/* ── 구간 통과 횟수 (8장) ── 가격이 level을 위에서 아래로, 또는 아래에서 위로 건너간 횟수.
   level과 정확히 같은 값은 건너간 것으로 보지 않고 직전 쪽을 유지한다(닿기만 하고 돌아가면 0회). */
function levelCrossings(prices,level){
 let side=0,count=0,up=0,down=0;
 prices.forEach(p=>{
  const s=p>level?1:p<level?-1:0;if(s===0)return;
  if(side!==0&&s!==side){count++;if(s>0)up++;else down++;}
  side=s;
 });
 return {count,up,down};
}
/* 여러 가격선(격자)을 지나간 횟수의 합과 선별 횟수. */
function crossingsOfLevels(prices,levels){
 const each=levels.map(l=>levelCrossings(prices,l).count);
 return {total:each.reduce((s,c)=>s+c,0),each};
}

/* ── 최대 낙폭과 회복 기간 (9장) ──
   낙폭 DD_t = P_t / max(P_0..P_t) − 1 (0 이하, 소수). 최대 낙폭 MDD = min DD_t.
   peak: MDD를 만든 고점 칸, trough: 저점 칸, recovery: 저점 뒤 처음으로 고점 값 이상이 된 칸(없으면 null).
   fallLength = trough − peak, recoveryLength = recovery − trough(회복 못 하면 null), longestUnderwater: 고점 아래에 머문 가장 긴 연속 기간. */
function drawdownSeries(values){let peak=-Infinity;return values.map(v=>{peak=Math.max(peak,v);return peak>0?v/peak-1:0;});}
function maxDrawdown(values){
 if(!values.length)throw new RangeError('empty');
 let peak=values[0],pi=0,best={mdd:0,peak:0,trough:0},under=0,longest=0;
 values.forEach((v,i)=>{
  if(v>=peak){peak=v;pi=i;under=0;}else{under++;longest=Math.max(longest,under);}
  const dd=peak>0?v/peak-1:0;if(dd<best.mdd)best={mdd:dd,peak:pi,trough:i};
 });
 let recovery=null;
 if(best.mdd<0){const target=values[best.peak];for(let i=best.trough+1;i<values.length;i++)if(values[i]>=target){recovery=i;break;}}
 return {...best,recovery,fallLength:best.trough-best.peak,recoveryLength:recovery===null?null:recovery-best.trough,longestUnderwater:longest};
}
/* 낙폭 d(소수, 음수)를 되찾는 데 필요한 상승률: 1/(1+d) − 1. −50%면 +100%. */
const recoveryNeeded=d=>{if(!(d>-1&&d<=0))throw new RangeError('d must be in (-1, 0]');return 1/(1+d)-1;};

/* 가격 기록 하나의 요약(마지막 과제에서 씀): 연율 변동성, 1차 자기상관, VR(q), 최대 낙폭. */
function summarize(prices,o={}){
 const r=logReturns(prices),q=o.q??5;
 return {n:r.length,meanLog:mean(r),sd:sd(r),annualVol:annualizeVol(sd(r),o.periods),ac1:autocorr(r,1),band:acfBand(r.length),
  vr:varianceRatio(r,q),...moments(r),mdd:maxDrawdown(prices)};
}

/* ── 새벽전자의 1년 기록 (마지막 과제·5장·7장의 공통 사례) ──
   앞 120거래일은 12권 「격자 하나에서 손익이 갈리기까지」 13장의 6개월 시나리오(GUI.PATH.FINAL)를 그대로 쓴다:
     80일 박스권 wave({start:20000, days:80, perDay:8, amp:7, period:64})
     + 20일 하락 wave({start:20000, days:20, perDay:8, amp:2, period:16, drift:−0.5, gaps:{0:−8}})  (81일째 시가 −8% 갭)
     + 20일 횡보 wave({start:16700, days:20, perDay:8, amp:2, period:16}).
   아래 SAEBYEOK_TICKS·tickRound·tri·wave는 books/grid/js/math.js의 STOCK_TICKS·roundToTick('nearest', 주식)·tri·wave를
   계산이 같도록 복사했다(책 사이 코드 의존을 두지 않음). 12권 쪽이 바뀌면 tests/math.test.cjs의 대조 검사가 알려 준다.
   뒤 130거래일은 이 파일의 생성기에서 뽑은 가상 경로다(실제 시세 아님, 12권에 없는 날). 120일째 종가에서 이어
   하루 perDay점씩 로그 가격을 움직인다: 한 점의 잡음 vol/√perDay, 평균 회귀 kappa/perDay(기준은 120일째 종가). 점마다 호가단위로 맞춘다.
   하루 막대: 시가 = 첫 점, 종가 = 마지막 점, 고가·저가 = 그날 점들의 최대·최소(장중 점이 perDay개뿐인 가상 막대).
   단위: 원. 하린의 격자 가격선은 12권과 같은 18,000~22,000원 200원 간격 21개. */
const SAEBYEOK_TICKS=[[2000,1],[5000,5],[20000,10],[50000,50],[200000,100],[500000,500],[Infinity,1000]];
const tickOf=p=>SAEBYEOK_TICKS.find(([upper])=>p<upper)[1];
function tickRound(price){const p=Math.max(1,price),t=tickOf(p);return Math.max(t,Math.round(p/t)*t);}
function tri(x){const f=((x-.25)%1+1)%1;return 4*Math.abs(f-.5)-1;}
function wave(o){
 const perDay=o.perDay||8,period=o.period||16,amp=o.amp||0,drift=o.drift||0,gaps=o.gaps||{};
 let level=o.start,t=0;const out=[];
 for(let d=0;d<o.days;d++){
  if(d>0)level*=1+drift/100;if(gaps[d])level*=1+gaps[d]/100;
  const row=[];for(let k=0;k<perDay;k++,t++)row.push(tickRound(level*(1+amp/100*tri(t/period))));out.push(row);
 }
 return out;
}
const HARIN_LINES=Object.freeze(Array.from({length:21},(_,i)=>18000+200*i));
/* 12권 13장 시나리오의 하루 점들(120일 × 8점). */
function gridSixMonths(){
 return [...wave({start:20000,days:80,perDay:8,amp:7,period:64}),
  ...wave({start:20000,days:20,perDay:8,amp:2,period:16,drift:-.5,gaps:{0:-8}}),
  ...wave({start:16700,days:20,perDay:8,amp:2,period:16})];
}
/* 생성한 날들의 하루 점들. 시드가 같으면 같은 점이 나온다. */
function generatedDays(start,o={}){
 const days=o.days??130,perDay=o.perDay??8,vol=o.vol??.015,kappa=o.kappa??0,g=rng(o.seed??8);
 if(!(start>0)||!(vol>=0)||!(kappa>=0&&kappa<1))throw new RangeError('start > 0, vol >= 0, 0 <= kappa < 1');
 const sp=vol/Math.sqrt(perDay),kp=kappa/perDay,anchor=Math.log(start),out=[];let x=anchor;
 for(let d=0;d<days;d++){
  const row=[];for(let k=0;k<perDay;k++){x+=sp*g.normal()+kp*(anchor-x);row.push(tickRound(Math.exp(x)));}out.push(row);
 }
 return out;
}
const toBars=(days,source)=>days.map(row=>({open:row[0],close:row[row.length-1],high:Math.max(...row),low:Math.min(...row),source}));
/* 새벽전자 1년 기록: 250개 하루 막대 {day(1부터), open, close, high, low, source: 'grid'|'generated'}. */
function saebyeokYear(o={}){
 const first=toBars(gridSixMonths(),'grid'),last=first[first.length-1].close;
 const rest=toBars(generatedDays(last,o),'generated');
 return [...first,...rest].map((b,i)=>({day:i+1,...b}));
}

const api={PERIODS_PER_YEAR,rng,simpleReturns,logReturns,simpleToLog,logToSimple,compound,pathFromReturns,
 mean,variance,sd,annualizeVol,annualizeMean,moments,tailShare,
 leveragedPath,staticLeverage,flatVolatileReturns,leveragedApprox,volatilityDrag,
 trueRange,atrWilder,randomWalk,monteCarlo,autocorr,acf,acfBand,varianceRatio,
 levelCrossings,crossingsOfLevels,drawdownSeries,maxDrawdown,recoveryNeeded,summarize,
 tickRound,wave,HARIN_LINES,gridSixMonths,generatedDays,saebyeokYear};
if(typeof module!=='undefined')module.exports=api;else root.VMath=api;
})(this);
