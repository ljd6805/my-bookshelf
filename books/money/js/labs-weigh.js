/* 7~10장 실험: 실질 수익률, 연환산 수익률, 비용의 복리, 마지막 과제(상환과 투자의 저울). 계산은 MMath, 여기서는 입력을 읽고 그리기만 한다.
   수익률 경로와 투자 수익률 시나리오는 정해 둔 예시·가정이며 실제 상품의 과거 수익률이나 예측이 아니다. */
(()=>{
'use strict';
const U=MUI,M=MMath,F=U.fmt,W=U.won,P=U.pct;
MLabs.real=el=>{
 U.setup(el,U.range('rnom','명목 금리 (연 %)',0,10,.1,3)+U.range('rinf','물가 상승률 (연 %)',-2,10,.1,2)+U.range('rtax','이자에서 떼는 세율 (%)',0,50,.1,15.4));
 U.bind(el,()=>{
  const nom=U.value(el,'rnom'),inf=U.value(el,'rinf'),tax=U.value(el,'rtax'),r=M.real(nom,inf,tax),basket=M.compoundFV(1e7,r.exact,1);
  const chart=U.bars(['명목 금리','세후 금리','실질 수익률','어림 (세후 − 물가)'],[nom,r.after,r.exact,r.approx],{unit:'%',digits:3,signed:true,max:Math.max(nom,Math.abs(r.exact),Math.abs(r.approx),.5),mark:i=>i===2});
  const sign=r.exact<0?`<br>실질 수익률이 음수입니다. 통장의 숫자는 늘어도 1년 뒤 살 수 있는 양은 줄어듭니다.`:'';
  U.result(el,chart,`명목 ${P(nom,1)}에서 세금 ${P(tax,1)}를 떼면 세후 금리는 <b>${P(r.after,3)}</b>입니다. 물가가 ${P(inf,1)} 오르면 (1 + ${F(r.after/100,5)}) ÷ (1 + ${F(inf/100,3)}) − 1로 실질 수익률은 <b>${P(r.exact,3)}</b>이고, 어림식 세후 − 물가는 ${P(r.approx,3)}입니다.<br>오늘 1,000만 원어치 장바구니를 기준으로 1년 뒤 살 수 있는 양은 오늘 돈으로 ${W(basket)}어치입니다.${sign}${U.kind('real','물가 상승률과 세율은 가정입니다. 금융소득이 많으면 세율이 달라집니다.')}`);
 });
};
/* 경로 읽기: "50, -50" → [50,-50]. 1~30개, 각 값은 −99.9% 이상 1000% 이하. */
function parsePath(s){const v=s.replace(/−/g,'-').split(/[,\s]+/).filter(Boolean).map(Number);return v.length>=1&&v.length<=30&&v.every(x=>Number.isFinite(x)&&x>-100&&x<=1000)?v:null;}
MLabs.cagr=el=>{
 U.setup(el,U.text('gpath','해마다 수익률 (%, 쉼표로)','50, -50','예: 20, -10, 15, -5, 10')+U.range('gswing','흔들림 크기 (%) · 평균은 그대로',0,150,5,100)+U.range('gstart','처음 금액 (만 원)',100,5000,100,1000));
 U.bind(el,()=>{
  const base=parsePath(el.querySelector('#gpath').value),swing=U.value(el,'gswing')/100,start=U.value(el,'gstart')*1e4;
  if(!base)return U.result(el,'',U.problem('수익률','숫자 1~30개를 쉼표로 나눠 넣고, 한 해 수익률은 −100%보다 커야 합니다. 예: 50, -50'));
  const avg=M.cagr(base).mean,path=base.map(x=>avg+(x-avg)*swing);
  if(path.some(x=>x<=-100))return U.result(el,'',U.problem('흔들림 크기',`흔들림을 ${F(swing*100,0)}%로 키우면 어느 해 수익률이 −100% 이하가 되어 돈이 모두 사라집니다. 흔들림을 줄여 보세요.`));
  const r=M.cagr(path,start),steady=M.compoundFV(start,r.mean,path.length);
  let acc=start;const pts=[[0,start/1e4]].concat(path.map((x,t)=>{acc=acc*(1+x/100);return [t+1,acc/1e4];}));
  const chart=U.lines([{name:'평균으로 꾸준히',points:path.map((_,t)=>[t,M.compoundFV(start,r.mean,t)/1e4]).concat([[path.length,steady/1e4]]),color:'var(--blue)',dash:'7 5'},{name:'실제 경로',points:pts,color:'var(--accent)'}],{label:`수익률 ${path.map(x=>F(x,1)).join(', ')}%. 산술 평균 ${F(r.mean,2)}%, 연환산 ${F(r.cagr,2)}%, 끝 금액 ${W(r.end)}.`,xName:'해',yName:'만 원',yFmt:v=>F(v,0),marks:[[path.length,r.end/1e4,'']]});
  const shown=swing===1?'':`<br>흔들림을 ${F(swing*100,0)}%로 바꾼 경로: ${path.map(x=>U.sfmt(x,1)+'%').join(', ')}.`;
  U.result(el,chart,`${path.length}년 수익률의 산술 평균은 <b>${P(r.mean)}</b>, 처음과 끝만 본 연환산 수익률(CAGR)은 <b>${P(r.cagr)}</b>입니다. ${W(start)}은 <b>${W(r.end)}</b>이 됩니다.<br>평균 ${P(r.mean)}로 해마다 꾸준히 불었다면 ${W(steady)}이었을 테니, 산술 평균은 실제보다 ${W(Math.abs(steady-r.end))} ${steady>=r.end?'부풀린':'낮춘'} 셈입니다.${shown}${U.kind('example','수익률 경로는 정해 둔 예시이며 실제 ETF의 과거 수익률이 아닙니다.')}`);
 });
};
MLabs.fees=el=>{
 U.setup(el,U.range('fprin','처음 금액 (만 원)',100,10000,100,1000)+U.range('fgross','비용을 떼기 전 수익률 (연 %)',-5,15,.5,6)+U.range('fyears','기간 (년)',1,50,1,30)+U.range('fa','비용률 ① (연 %)',0,3,.05,1)+U.range('fb','비용률 ② (연 %)',0,3,.05,.1)+U.range('fturn','①에 더할 한 해 회전 수 (왕복 0.23%씩)',0,20,1,0));
 U.bind(el,()=>{
  const p=U.value(el,'fprin')*1e4,g=U.value(el,'fgross'),n=U.value(el,'fyears'),turn=U.value(el,'fturn'),fa=U.value(el,'fa')+turn*.23,fb=U.value(el,'fb');
  const A=M.feeDrag(p,g,fa,n),B=M.feeDrag(p,g,fb,n),yrs=Array.from({length:n+1},(_,t)=>t);
  const chart=U.lines([{name:'비용 0%',points:yrs.map(t=>[t,M.feeDrag(p,g,0,t).withFee/1e4]),color:'var(--blue)',dash:'7 5'},{name:`② ${F(fb,2)}%`,points:yrs.map(t=>[t,M.feeDrag(p,g,fb,t).withFee/1e4]),color:'var(--accent)'},{name:`① ${F(fa,2)}%`,points:yrs.map(t=>[t,M.feeDrag(p,g,fa,t).withFee/1e4]),color:'var(--orange)'}],{label:`${n}년 뒤 비용 없음 ${W(A.noFee)}, 비용 ${fb}% ${W(B.withFee)}, 비용 ${F(fa,2)}% ${W(A.withFee)}.`,xName:'해',yName:'만 원',yFmt:v=>F(v,0)});
  const line=(x,f,k)=>`비용률 ${k} ${P(f,2)}: <b>${W(x.withFee)}</b>(${U.man(x.withFee)}), 비용이 없을 때보다 ${W(x.lost)} 적어 쌓였어야 할 돈의 <b>${P(x.lostShare,1)}</b>`;
  const net=M.feeDrag(100,g,fa,1).withFee-100,turnText=turn?`<br>①에는 한 해 ${turn}번 회전 × 왕복 0.23% = ${P(turn*.23,2)}가 더해져 있습니다(4권 10장의 왕복 비용을 어림한 값).`:'';
  U.result(el,chart,`${W(p)}이 연 ${P(g,1)}로 ${n}년 불어나면 비용이 없을 때 <b>${W(A.noFee)}</b>(${U.man(A.noFee)})입니다.<br>${line(A,fa,'①')}입니다.<br>${line(B,fb,'②')}입니다.<br>비용률 ①을 떼면 해마다 실제로 불어나는 비율은 (1 + ${F(g/100,3)}) × (1 − ${F(fa/100,4)}) − 1 = ${P(net,2)}입니다.${turnText}${U.kind('real','비용을 해마다 끝에 한 번 뗀다고 보았습니다. 수익률과 비용률은 가정입니다.')}`);
 });
};
function decideTable(r,a,years,cut,loanRate){
 const signed=d=>`${d>=0?'+':'−'}${F(Math.abs(Math.round(d)),0)}원`;
 const rows=[[`대출 상환 (연 ${P(loanRate,1)})`,'확실',W(r.repay-cut),'기준']].concat(r.invest.map(x=>[`투자 연 ${P(x.rate,1)} 가정`,'가정',W(x.end),signed(x.diff+cut)]));
 return U.table(['선택','성격',`${years}년 뒤`,'상환과 차이'],rows,`${F(a/1e4,0)}만 원을 어디에 두나`);
}
MLabs.decide=el=>{
 U.setup(el,U.number('xamt','상환 또는 투자에 쓸 돈 (만 원)',10,1000,10,600,'모아 둔 돈 1,000만 원 안에서')+U.range('xloan','대출 금리 (연 %)',0,20,.1,6)+U.range('xyears','비교 시점 (년 뒤)',1,10,1,3)+U.range('xs1','투자 시나리오 ㉠ (연 %)',-30,30,1,-10)+U.range('xs2','투자 시나리오 ㉡ (연 %)',-30,30,1,5)+U.range('xs3','투자 시나리오 ㉢ (연 %)',-30,30,1,8)+U.range('xfee','투자 비용률 (연 %)',0,2,.05,.1)+U.select('xtax','투자 이익에 붙는 세금',[['0','없음 (국내 주식형 ETF 매매 차익 가정)'],['15.4','15.4% (분배금·이자 가정)']],'0')+U.range('xpre','중도상환수수료율 (%)',0,3,.1,0));
 U.bind(el,()=>{
  const a0=U.num(el,'xamt');
  if(a0===null)return U.result(el,'',U.problem('금액','쓸 돈은 10만 원에서 1,000만 원 사이로 넣어야 합니다.'));
  const a=a0*1e4,loan=U.value(el,'xloan'),n=U.value(el,'xyears'),sc=['xs1','xs2','xs3'].map(id=>U.value(el,id)),fee=U.value(el,'xfee'),tax=+el.querySelector('#xtax').value,pre=U.value(el,'xpre');
  const r=M.repayVsInvest(a,loan,n,sc,fee,tax),cut=M.compoundFV(a*pre/100,loan,n),monthly=M.payment(a,loan,n*12),spare=1e7-a;
  const labels=['상환 (확실)',...sc.map(s=>`투자 ${U.sfmt(s,0)}% (가정)`)],vals=[r.repay-cut,...r.invest.map(x=>x.end)];
  const chart=U.bars(labels,vals.map(v=>v/1e4),{max:Math.max(...vals)/1e4,mark:i=>i===0,show:v=>`${F(v,1)}만`})+decideTable(r,a,n,cut,loan);
  const inv=r.invest.map(x=>`연 ${P(x.rate,1)}면 ${W(x.end)}(상환보다 ${W(Math.abs(x.diff+cut))} ${x.diff+cut>=0?'많음':'적음'})`).join(', ');
  const preText=pre?` 중도상환수수료 ${P(pre,1)}는 오늘 ${W(a*pre/100)}이고, 같은 ${n}년 뒤로 옮기면 ${W(cut)}이라 상환 효과에서 뺐습니다. 아래 같아지는 수익률은 이 수수료를 빼기 전 값입니다.`:'';
  U.result(el,chart,`이 가정에서는 ${W(a)}으로 연 ${P(loan,1)} 대출을 갚으면 ${n}년 뒤 <b>${W(r.repay-cut)}</b>어치의 효과가 확실하게 남습니다.${preText}<br>투자에 두면 비용률 ${P(fee,2)}${tax?`와 세금 ${P(tax,1)}`:''}를 뺀 뒤 ${inv}입니다.<br>상환과 같아지려면 비용을 뗀 뒤에도 해마다 <b>연 ${P(r.breakEven)}</b>를 꾸준히 벌어야 합니다${tax?'(세금은 이 값에 넣지 않았습니다)':''}. 수익률이 흔들리면 같은 평균이어도 연환산은 그보다 낮을 수 있습니다(8장).<br>계산 밖의 숫자: 비상금으로 남는 돈 ${W(Math.max(0,spare))}, 대출을 갚으면 달마다 나가지 않는 상환액 ${W(monthly)}(원리금균등 ${n*12}개월 가정). 이 표는 정답을 고르지 않고, 어떤 조건에서 숫자가 어느 쪽을 가리키는지만 보여 줍니다.${U.kind('scenario','투자 수익률은 가정한 시나리오이며 미래 수익률의 예측이 아닙니다. 상환 효과는 아낀 이자를 같은 금리로 복리 근사했습니다.')}`);
 });
};
})();
