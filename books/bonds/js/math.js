/* 금리와 채권 계산. DOM을 만지지 않으며 tests/math.test.cjs가 대표값·경계값·불변 조건을 검사한다.
   「금융과 투자 처음부터」 3권 「금리와 채권 · 기준금리에서 채권 가격까지」의 계산 원본이다.
   책 사이 코드 의존을 두지 않는다(1권 money의 MMath와 같은 식이 있어도 여기서 새로 쓴다).
   단위와 표기:
   - 금리·수익률·스프레드는 모두 소수(0.035 = 연 3.5%)다. 화면에서 %나 %p로 바꾼다.
   - 시간은 해(year) 단위다. 이표 주기 freq는 1년에 이자를 주는 횟수(1 = 연 1회, 2 = 반년마다)다.
   - 채권 금액은 액면 face 기준이고 기본값은 10,000원이다(국내 채권 단가를 "액면 10,000원당 가격"으로
     적는 관행, 조사 노트 3-3). 원 단위로 반올림하지 않는다. 화면에서 반올림한다.
   - 만기수익률 y는 이표 주기로 복리하는 연 표시 금리다(반년 이표면 반년 금리 = y/2). 국내 실무의 단가 계산
     관행(남은 기간의 끝수 처리 방식)은 이 책에서 확인하지 못했으므로 여기서는 교과서의 기본 식을 쓴다.
   - 실제 계산과 교육용 모형을 구분한다. 가격·만기수익률·듀레이션·볼록성·경과이자·고든 모형은 실제 계산이고,
     yieldCurveModel은 기준금리 경로와 기간 프리미엄을 가정한 교육용 시나리오 모형이지 예측이 아니다. */
(function(root){
'use strict';
const FACE=10000;

function need(cond,msg){if(!cond)throw new RangeError(msg);}
function finite(x,name){need(typeof x==='number'&&Number.isFinite(x),name+' must be a finite number');}

/* ── 1장 금리는 돈의 가격 ──
   단리 F = P(1 + r·t), 복리 F = P(1 + r/m)^(m·t), 실효 연 금리 EAR = (1 + r/m)^m − 1.
   r > −m 이어야 한다(한 주기에 원금보다 많이 잃을 수 없다). */
function simpleValue(P,r,t){finite(P,'P');finite(r,'r');finite(t,'t');need(t>=0,'t must be ≥ 0');return P*(1+r*t);}
function compoundValue(P,r,t,m=1){
 finite(P,'P');finite(r,'r');finite(t,'t');need(t>=0,'t must be ≥ 0');need(m>0,'m must be > 0');need(1+r/m>0,'r/m must be > −1');
 return P*Math.pow(1+r/m,m*t);
}
function effectiveRate(r,m=1){finite(r,'r');need(m>0,'m must be > 0');need(1+r/m>0,'r/m must be > −1');return Math.pow(1+r/m,m)-1;}
/* 피셔 관계. 정확한 식 (1 + 명목) = (1 + 실질)(1 + 물가) → 실질 = (1 + 명목)/(1 + 물가) − 1.
   어림식 실질 ≈ 명목 − 물가는 두 값이 0에 가까울 때만 잘 맞는다. 물가는 −100%보다 커야 한다. */
function realRate(nominal,inflation){finite(nominal,'nominal');finite(inflation,'inflation');need(inflation>-1,'inflation must be > −1');return (1+nominal)/(1+inflation)-1;}
function realRateApprox(nominal,inflation){finite(nominal,'nominal');finite(inflation,'inflation');return nominal-inflation;}
/* 할인 계수 DF = 1/(1 + r/m)^(m·t). t년 뒤 1원의 오늘 값. continuous=true면 e^(−r·t). */
function discountFactor(r,t,m=1,continuous=false){
 finite(r,'r');finite(t,'t');need(t>=0,'t must be ≥ 0');
 if(continuous)return Math.exp(-r*t);
 need(m>0,'m must be > 0');need(1+r/m>0,'r/m must be > −1');return Math.pow(1+r/m,-m*t);
}
/* 예금을 1년마다 새 금리로 다시 맡길 때의 값(마지막 과제). rates[i]는 i번째 해의 연 금리(연 1회 복리). */
function rolloverValue(P,rates){
 finite(P,'P');need(Array.isArray(rates),'rates must be an array');
 return rates.reduce((v,r)=>{finite(r,'rate');need(r>-1,'rate must be > −1');return v*(1+r);},P);
}

/* ── 3장 채권의 현금흐름 ──
   bond = {face, couponRate, years, freq}. 이표 = face·couponRate/freq를 주기마다, 만기에 액면을 더한다.
   years·freq는 정수여야 한다(발행일이나 이자 지급일에서 본 남은 주기 수). couponRate = 0이면 할인채(무이표채). */
function checkBond(b){
 need(b&&typeof b==='object','bond must be an object');
 const face=b.face===undefined?FACE:b.face,freq=b.freq===undefined?2:b.freq;
 finite(face,'face');need(face>0,'face must be > 0');finite(b.couponRate,'couponRate');need(b.couponRate>=0,'couponRate must be ≥ 0');
 finite(b.years,'years');need(b.years>0,'years must be > 0');need([1,2,4,12].includes(freq),'freq must be 1, 2, 4 or 12');
 const n=Math.round(b.years*freq);need(Math.abs(n-b.years*freq)<1e-9,'years × freq must be a whole number of periods');
 return {face,couponRate:b.couponRate,years:b.years,freq,n};
}
function cashFlows(bond){
 const b=checkBond(bond),c=b.face*b.couponRate/b.freq,out=[];
 for(let k=1;k<=b.n;k++)out.push({k,t:k/b.freq,cf:c+(k===b.n?b.face:0)});
 return out;
}

/* ── 4장 가격과 만기수익률 ──
   이자 지급일 바로 뒤(경과이자 0)의 가격 P = Σ CF_k/(1 + y/f)^k. y는 연 표시, f = freq.
   y/f > −1 이어야 한다. 표면금리 = y면 가격 = 액면(액면가 채권). */
function priceFromYield(bond,y){
 const b=checkBond(bond);finite(y,'y');need(1+y/b.freq>0,'y/freq must be > −1');
 const q=1+y/b.freq;return cashFlows(b).reduce((s,x)=>s+x.cf/Math.pow(q,x.k),0);
}
/* 만기수익률. 뉴턴법을 먼저 쓰고, 구간을 벗어나거나 수렴하지 않으면 이분법으로 바꾼다.
   실패하는 경우(RangeError): 가격 ≤ 0, 가격이 모든 현금흐름의 합의 한계를 넘어 찾는 구간
   [lo, hi](기본 연 −50% ~ +100%)에서 답이 없을 때. 가격은 y에 대해 줄어들기만 하므로 답은 많아야 하나다. */
function ytm(bond,price,opts={}){
 const b=checkBond(bond);finite(price,'price');need(price>0,'price must be > 0');
 const lo0=opts.lo===undefined?-0.5:opts.lo,hi0=opts.hi===undefined?1:opts.hi,tol=opts.tol||1e-12,maxIter=opts.maxIter||200;
 need(1+lo0/b.freq>0,'lo/freq must be > −1');need(hi0>lo0,'hi must be > lo');
 const f=y=>priceFromYield(b,y)-price;
 const fLo=f(lo0),fHi=f(hi0);
 if(fLo<0||fHi>0)throw new RangeError('no yield in ['+lo0+', '+hi0+'] gives this price');
 let lo=lo0,hi=hi0,y=(b.couponRate>lo0&&b.couponRate<hi0)?b.couponRate:(lo0+hi0)/2,iter=0,method='newton';
 for(;iter<maxIter;iter++){
  const fy=f(y);if(Math.abs(fy)<tol*b.face)return {ytm:y,iterations:iter,method};
  if(fy>0)lo=y;else hi=y;
  const d=-modifiedDuration(b,y)*priceFromYield(b,y);  // dP/dy
  let next=y-fy/d;
  if(!(next>lo&&next<hi)){next=(lo+hi)/2;method='bisection';}
  if(Math.abs(next-y)<1e-15)return {ytm:next,iterations:iter+1,method};
  y=next;
 }
 throw new RangeError('ytm did not converge');
}

/* ── 경과이자와 깨끗한 가격·더러운 가격 ──
   날짜 셈 가정: 직전 이자 지급일부터 지난 날 수 ÷ 이번 이자 기간의 실제 날 수(기간 안 실제 일수 비율,
   Actual/Actual 방식의 기간 안 계산). 국고채의 공식 관행과 같은지는 확인하지 못했다(조사 노트 "확인하지 못한 것").
   경과이자 AI = 이표 × w, w = daysSince/daysInPeriod (0 ≤ w < 1).
   더러운 가격(실제로 주고받는 값) = 남은 현금흐름을 (k − w) 주기로 할인한 합. 깨끗한 가격 = 더러운 가격 − AI.
   bond.years는 직전 이자 지급일에서 본 남은 기간이다. */
function accrualFraction(daysSince,daysInPeriod){
 finite(daysSince,'daysSince');finite(daysInPeriod,'daysInPeriod');need(daysInPeriod>0,'daysInPeriod must be > 0');
 need(daysSince>=0&&daysSince<daysInPeriod,'daysSince must be in [0, daysInPeriod)');return daysSince/daysInPeriod;
}
function accruedInterest(bond,daysSince,daysInPeriod){const b=checkBond(bond);return b.face*b.couponRate/b.freq*accrualFraction(daysSince,daysInPeriod);}
function dirtyPrice(bond,y,daysSince,daysInPeriod){
 const b=checkBond(bond),w=accrualFraction(daysSince,daysInPeriod);finite(y,'y');need(1+y/b.freq>0,'y/freq must be > −1');
 const q=1+y/b.freq;return cashFlows(b).reduce((s,x)=>s+x.cf/Math.pow(q,x.k-w),0);
}
function cleanPrice(bond,y,daysSince,daysInPeriod){return dirtyPrice(bond,y,daysSince,daysInPeriod)-accruedInterest(bond,daysSince,daysInPeriod);}

/* ── 5장 듀레이션과 볼록성 ── (이자 지급일 기준)
   매콜리 듀레이션 D = Σ t_k·PV_k / P (해). 무이표채면 D = 만기.
   수정 듀레이션 D* = D/(1 + y/f) = −(1/P)·dP/dy. 금리가 1%p(0.01) 오르면 가격은 약 D*% 내린다.
   볼록성 C = (1/P)·d²P/dy² = Σ k(k+1)·CF_k/(1 + y/f)^(k+2) / (f²·P) (해²). 현금흐름이 모두 양수면 C > 0. */
function macaulayDuration(bond,y){
 const b=checkBond(bond),P=priceFromYield(b,y),q=1+y/b.freq;
 return cashFlows(b).reduce((s,x)=>s+x.t*x.cf/Math.pow(q,x.k),0)/P;
}
function modifiedDuration(bond,y){const b=checkBond(bond);return macaulayDuration(b,y)/(1+y/b.freq);}
function convexity(bond,y){
 const b=checkBond(bond),P=priceFromYield(b,y),q=1+y/b.freq;
 return cashFlows(b).reduce((s,x)=>s+x.k*(x.k+1)*x.cf/Math.pow(q,x.k+2),0)/(b.freq*b.freq*P);
}
/* 금리가 dy만큼 바뀔 때 가격 변화율: 정확한 값, 듀레이션만 쓴 어림, 볼록성까지 쓴 어림.
   ΔP/P ≈ −D*·Δy + ½·C·Δy². 큰 Δy일수록 듀레이션 어림은 하락을 부풀리고 상승을 덜 잡는다. */
function priceChange(bond,y,dy){
 finite(dy,'dy');const b=checkBond(bond),P0=priceFromYield(b,y),P1=priceFromYield(b,y+dy);
 const D=modifiedDuration(b,y),C=convexity(b,y);
 return {price0:P0,price1:P1,exact:P1/P0-1,durationOnly:-D*dy,withConvexity:-D*dy+0.5*C*dy*dy};
}
/* 금리 1bp(0.0001)당 가격 변화(원). DV01 = D*·P·0.0001. */
function dv01(bond,y){const b=checkBond(bond);return modifiedDuration(b,y)*priceFromYield(b,y)*1e-4;}

/* ── 마지막 과제: 1년 보유 수익 ──
   이자 지급일에 가격 P0(금리 y0)으로 사서 elapsed년 뒤 이자 지급일에 남은 만기의 채권을 금리 y1로 판다고 본다.
   받은 이표는 다시 굴리지 않고 그대로 더한다(1년 동안 반년 이표 두 번, 재투자 수익은 무시하는 단순화).
   priceReturn = P1/P0 − 1, totalReturn = (P1 + 받은 이표)/P0 − 1.
   곡선이 그대로여도 만기가 짧아지며 더 낮은 금리 자리로 내려가는 몫(롤다운)과 할증 채권이 액면으로
   다가가는 몫이 priceReturn에 함께 들어 있다. */
function holdingReturn(bond,y0,y1,elapsed=1){
 const b=checkBond(bond);finite(elapsed,'elapsed');
 const k=Math.round(elapsed*b.freq);need(k>=1&&Math.abs(k-elapsed*b.freq)<1e-9&&k<b.n,'elapsed must be a whole number of periods shorter than the bond');
 const rest=Object.assign({},b,{years:b.years-elapsed});
 const P0=priceFromYield(b,y0),P1=priceFromYield(rest,y1),coupons=k*b.face*b.couponRate/b.freq;
 return {price0:P0,price1:P1,coupons,priceReturn:P1/P0-1,totalReturn:(P1+coupons)/P0-1};
}

/* ── 6장 수익률 곡선: 교육용 시나리오 모형 (예측이 아님) ──
   단기 금리 경로 s(t) = base + spread0 + change·min(t/horizon, 1)  (해 t, 연속 시간)
     base: 오늘의 기준금리, spread0: 기준금리 위 초단기 시장금리의 차이(가정),
     change: 시장이 기대하는 기준금리 변화의 합(인하면 음수), horizon: 그 변화가 끝나는 데 걸린다고 보는 해.
   만기 T의 금리 y(T) = (1/T)∫₀ᵀ s(t)dt + tp(T),  tp(T) = tpMax·T/(T + tpHalf) (기간 프리미엄, 가정).
   기대 이론(앞 항)과 기간 프리미엄(뒤 항)을 더한 장난감 모형이며, 실제 곡선을 맞추려 만든 것이 아니다.
   기대 물가 손잡이(6장 수익률 곡선 놀이판, 1장 피셔 관계와 이어짐): 시장이 보는 기대 물가 inflationExp가
   물가 목표 inflationTarget(기본 2%)보다 높으면 중앙은행이 금리를 더 올릴 것이라고 본다고 가정하고
     실제로 쓰는 기대 변화 = change + inflationCoef·(inflationExp − inflationTarget),  inflationCoef 기본 0.5
   로 바꾼다. 계수 0.5는 "기대 물가가 목표보다 1%p 높으면 앞으로 1년 동안 기준금리가 0.5%p 더 오른다고
   본다"는 교육용 가정이다(실제 중앙은행의 반응 계수를 추정한 값이 아니다). inflationExp를 주지 않으면 효과가 없다. */
function avgPath(p,T){
 const h=p.horizon,s0=p.base+p.spread0;
 if(h<=0||T<=h)return s0+p.change*(h<=0?1:T/(2*h));
 return s0+p.change*(1-h/(2*T));
}
function yieldCurveModel(params,maturities){
 const p=Object.assign({spread0:0,change:0,horizon:1,tpMax:0,tpHalf:5,inflationTarget:0.02,inflationCoef:0.5},params||{});
 ['base','spread0','change','horizon','tpMax','tpHalf','inflationTarget','inflationCoef'].forEach(k=>finite(p[k],k));
 if(p.inflationExp!==undefined){finite(p.inflationExp,'inflationExp');need(p.inflationExp>-1,'inflationExp must be > −1');
  p.change=p.change+p.inflationCoef*(p.inflationExp-p.inflationTarget);}
 need(p.horizon>=0,'horizon must be ≥ 0');need(p.tpHalf>0,'tpHalf must be > 0');need(Array.isArray(maturities),'maturities must be an array');
 return maturities.map(T=>{
  finite(T,'maturity');need(T>0,'maturity must be > 0');
  const expected=avgPath(p,T),tp=p.tpMax*T/(T+p.tpHalf);
  return {T,expected,termPremium:tp,yield:expected+tp,policyChange:p.change};
 });
}
function termSpread(curve,longT,shortT){
 const pick=T=>{const x=curve.find(c=>Math.abs(c.T-T)<1e-12);need(x,'maturity '+T+' not in curve');return x.yield;};
 return pick(longT)-pick(shortT);
}

/* ── 7장 신용 스프레드 ──
   회사채 금리 = 같은 만기 국채 금리 + 신용 스프레드. 가격은 그 금리로 같은 식을 쓴다.
   breakEvenDefault: 1년 동안 부도 확률 p, 부도 때 회수율 R일 때 기대 손실 ≈ p(1 − R) → 스프레드 ≈ p(1 − R).
   이 어림은 위험 중립·세금·유동성 프리미엄을 무시한 교육용 근사다. */
function spreadPrice(bond,govYield,spread){finite(govYield,'govYield');finite(spread,'spread');return priceFromYield(bond,govYield+spread);}
function impliedDefault(spread,recovery){finite(spread,'spread');finite(recovery,'recovery');need(recovery>=0&&recovery<1,'recovery must be in [0, 1)');return spread/(1-recovery);}

/* ── 8장 할인율로 본 주식: 고든 성장 모형 ──
   P = D1/(r − g). D1: 1년 뒤 배당(원), r: 요구수익률(할인율), g: 영원히 일정하다고 가정한 배당 성장률.
   g ≥ r이면 값이 무한대나 음수가 되어 모형이 뜻을 잃으므로 오류로 막는다.
   r에 대한 수정 듀레이션 −(1/P)dP/dr = 1/(r − g) (해). 주식의 "듀레이션"이라는 비유의 출발점이다. */
function gordonValue(D1,r,g){
 finite(D1,'D1');finite(r,'r');finite(g,'g');need(D1>=0,'D1 must be ≥ 0');
 if(!(g<r))throw new RangeError('growth g must be smaller than discount rate r');
 return D1/(r-g);
}
function gordonDuration(r,g){finite(r,'r');finite(g,'g');if(!(g<r))throw new RangeError('growth g must be smaller than discount rate r');return 1/(r-g);}
function gordonChange(D1,r,g,dr,dg=0){
 const P0=gordonValue(D1,r,g),P1=gordonValue(D1,r+dr,g+dg);
 return {price0:P0,price1:P1,change:P1/P0-1};
}

const api={FACE,simpleValue,compoundValue,effectiveRate,realRate,realRateApprox,discountFactor,rolloverValue,
 cashFlows,priceFromYield,ytm,accrualFraction,accruedInterest,dirtyPrice,cleanPrice,
 macaulayDuration,modifiedDuration,convexity,priceChange,dv01,holdingReturn,
 yieldCurveModel,termSpread,spreadPrice,impliedDefault,gordonValue,gordonDuration,gordonChange};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.BMath=api;
})(typeof window!=='undefined'?window:globalThis);
