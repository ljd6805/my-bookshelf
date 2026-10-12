/* 돈의 시간 가치 계산. DOM을 만지지 않으며 tests/math.test.cjs가 대표값과 경계값을 검사한다.
   금리·수익률은 연 %로 받고, 금액은 원이다. 원 미만은 계산 중에는 그대로 두고 화면에서 반올림한다(상환표만 원 단위로 끊는다). */
(function(root){
'use strict';
const pct=r=>r/100;
/* 단리: 원금에만 이자. 복리: 한 해를 m번 나눠 이자에 이자. */
const simpleFV=(p,r,years)=>p*(1+pct(r)*years);
const compoundFV=(p,r,years,m=1)=>p*Math.pow(1+pct(r)/m,m*years);
const continuousFV=(p,r,years)=>p*Math.exp(pct(r)*years);
/* 실효 연 금리(%): 표시 금리 r을 한 해 m번 나눠 붙일 때 실제로 한 해에 불어나는 비율. m=Infinity면 연속 복리. */
function ear(r,m=1){return (m===Infinity?Math.exp(pct(r))-1:Math.pow(1+pct(r)/m,m)-1)*100;}
/* 두 배가 되는 해: 72의 법칙(어림)과 정확한 값 ln2/ln(1+r). */
const rule72=r=>72/r;
const doublingYears=r=>Math.log(2)/Math.log(1+pct(r));
/* 현재가치: 미래 금액을 할인율로 오늘로 데려온다. */
const pv=(fv,r,years,m=1)=>fv/Math.pow(1+pct(r)/m,m*years);
/* 원리금균등 월 상환액: 원금 p, 연 금리 r, n개월. 금리 0이면 원금을 n으로 나눈다. */
function payment(p,r,n){const i=pct(r)/12;return i===0?p/n:p*i/(1-Math.pow(1+i,-n));}
/* 상환표. method: 'level'(원리금균등) | 'principal'(원금균등) | 'bullet'(만기일시). 이자는 달마다 남은 원금 × 연 금리 / 12, 원 단위 반올림.
   마지막 달에 남은 원금을 모두 갚아 끝수를 맞춘다. */
function schedule(p,r,n,method='level'){
 const i=pct(r)/12,rows=[];let left=p;
 const level=Math.round(payment(p,r,n));
 for(let k=1;k<=n;k++){
  const interest=Math.round(left*i);
  let principal=method==='level'?level-interest:method==='principal'?Math.round(p/n):0;
  if(k===n)principal=left;
  left-=principal;rows.push({month:k,interest,principal,pay:interest+principal,left});
 }
 const totalInterest=rows.reduce((s,x)=>s+x.interest,0);
 return {rows,totalInterest,totalPay:p+totalInterest,first:rows[0],last:rows[n-1]};
}
/* 적금(정기적립식) 단리 이자: 매달 같은 금액을 넣고, 각 납입금은 만기까지 남은 달 수만큼 단리로 이자가 붙는다(1회차는 n개월, 마지막 회차는 1개월).
   세금은 이자에서 원천징수 비율(기본 15.4%)을 뗀다. */
function savings(monthly,n,r,tax=15.4){
 const months=n*(n+1)/2,interest=monthly*pct(r)/12*months,taxWon=Math.round(interest*pct(tax));
 return {principal:monthly*n,interest,tax:taxWon,net:interest-taxWon,effective:interest/(monthly*n)*100};
}
/* 같은 적금 총액을 처음에 한꺼번에 예금했을 때와 비교하기 위한 값. */
const lumpInterest=(amount,r,months)=>amount*pct(r)*months/12;
/* 순현재가치: flows[t]는 t년 뒤의 돈(받으면 +, 내면 −). */
const npv=(r,flows)=>flows.reduce((s,c,t)=>s+c/Math.pow(1+pct(r),t),0);
/* 내부수익률(%): NPV가 0이 되는 할인율. 부호가 바뀌는 구간을 −99%~1000%에서 촘촘히 찾고 이분법으로 좁힌다. 근이 여럿이면 모두, 없으면 빈 목록. */
function irr(flows){
 const roots=[],f=r=>npv(r,flows);let a=-99,fa=f(a);
 for(let b=-98.5;b<=1000;b+=0.5){const fb=f(b);if(fa===0)roots.push(a);else if(fa*fb<0){let lo=a,hi=b;for(let k=0;k<80;k++){const m=(lo+hi)/2;(f(lo)*f(m)<=0)?hi=m:lo=m;}roots.push((lo+hi)/2);}a=b;fa=fb;}
 return roots;
}
/* 실질 수익률(%): (1+명목)/(1+물가)−1. tax는 명목 이자에 붙는 세율(%). 어림식 명목−물가도 함께 돌려준다. */
function real(nominal,inflation,tax=0){
 const after=nominal*(1-pct(tax));
 return {after,exact:((1+pct(after))/(1+pct(inflation))-1)*100,approx:after-inflation};
}
/* 해마다 수익률(%) 목록 → 산술 평균, 연환산 수익률(CAGR), 끝 금액. 변동성 손실 어림: 산술 평균 − 분산/2. */
function cagr(path,start=1){
 const n=path.length,growth=path.reduce((g,x)=>g*(1+pct(x)),1),mean=path.reduce((s,x)=>s+x,0)/n;
 const variance=path.reduce((s,x)=>s+Math.pow(pct(x)-pct(mean),2),0)/n;
 return {mean,cagr:(Math.pow(growth,1/n)-1)*100,end:start*growth,approx:mean-variance/2*100};
}
/* 비용의 복리: 총수익률 gross에서 해마다 비용률 fee를 뺀 순수익률로 불어난다(근사: (1+g)(1−f)). */
function feeDrag(p,gross,fee,years){
 const withFee=p*Math.pow((1+pct(gross))*(1-pct(fee)),years),noFee=p*Math.pow(1+pct(gross),years);
 return {noFee,withFee,lost:noFee-withFee,lostShare:(1-withFee/noFee)*100};
}
/* 마지막 과제: 같은 돈 a를 남은 대출 상환에 쓸 때와 투자에 둘 때, years년 뒤 순자산 차이.
   상환하면 대출 금리만큼의 이자를 확실히 아낀다(원리금균등 남은 기간 동안 아낀 이자를 그 자리에서 다시 같은 금리로 갚는 것으로 보아 복리로 근사).
   투자하면 가정한 수익률 scenarios(%)마다 결과가 달라지고, 이자·배당이면 세율, 비용률을 뺀다. */
function repayVsInvest(a,loanRate,years,scenarios,fee=0,tax=0){
 const repay=a*Math.pow(1+pct(loanRate),years);
 return {repay,invest:scenarios.map(s=>{const net=(1+pct(s))*(1-pct(fee))-1,gain=Math.pow(1+net,years)-1,end=a*(1+gain*(1-pct(tax)));return {rate:s,end,diff:end-repay};}),breakEven:((1+pct(loanRate))/(1-pct(fee))-1)*100};
}
/* 보기 순서: 정답 원래 번호 answer를 target 자리에 오게 돌린다. */
function choiceOrder(n,answer,target){const order=[...Array(n).keys()];const k=((answer-target)%n+n)%n;return order.slice(k).concat(order.slice(0,k));}
const api={simpleFV,compoundFV,continuousFV,ear,rule72,doublingYears,pv,payment,schedule,savings,lumpInterest,npv,irr,real,cagr,feeDrag,repayVsInvest,choiceOrder};
if(typeof module!=='undefined')module.exports=api;else root.MMath=api;
})(this);
