/* 1~3장 실험: 시간 저울, 단리와 복리, 두 배가 되는 해와 실효 금리. 계산은 MMath, 여기서는 입력을 읽고 그리기만 한다.
   금액 입력은 만 원, 금리는 연 %. 세금·물가는 빼고 계산한다(7장에서 더함). */
(()=>{
'use strict';
const U=MUI,M=MMath,F=U.fmt,W=U.won,P=U.pct;
/* 두 금액이 같아지는 연 금리: 오늘 a를 내고 n년 뒤 b를 받는 현금흐름의 IRR로 구한다. 없으면 null. */
const evenRate=(a,b,n)=>{const r=M.irr([-a,...Array(n-1).fill(0),b]);return r.length?r[0]:null;};
MLabs.scale=el=>{
 U.setup(el,U.number('stoday','오늘 받는 돈 (만 원)',1,100000,1,1000,'1~100,000만 원')+U.number('slater','나중에 받는 돈 (만 원)',1,100000,1,1030,'1~100,000만 원')+U.range('syears','몇 년 뒤에 받나 (년)',1,30,1,1)+U.range('srate','오늘 돈을 맡길 수 있는 금리 (연 %)',0,10,.1,3));
 U.bind(el,()=>{
  const today=U.num(el,'stoday'),later=U.num(el,'slater'),years=U.value(el,'syears'),rate=U.value(el,'srate');
  if(today===null||later===null)return U.result(el,'',U.problem('금액','두 금액은 1만 원에서 100,000만 원 사이의 숫자로 넣어야 저울에 올릴 수 있습니다.'));
  const moved=M.compoundFV(today*1e4,rate,years),offer=later*1e4,back=M.pv(offer,rate,years),even=evenRate(today,later,years),gap=moved-offer;
  const chart=U.balance(moved,offer,{leftName:`오늘 ${F(today,0)}만 원`,rightName:`${years}년 뒤 약속`,leftNote:`${years}년 뒤 ${W(moved)}`,rightNote:W(offer)});
  const same=Math.abs(gap)<1;
  const verdict=same?'두 접시가 <b>같은 무게</b>입니다.':gap>0?`오늘 받는 쪽이 <b>${W(gap)} 무겁습니다</b>.`:`나중에 받는 쪽이 <b>${W(-gap)} 무겁습니다</b>.`;
  const evenText=even===null?'두 금액이 같아지는 금리를 −99%~1,000% 안에서 찾지 못했습니다.':`두 제안이 같아지는 금리는 <b>연 ${P(even)}</b>입니다. 맡길 수 있는 금리가 이보다 높으면 오늘 쪽이, 낮으면 나중 쪽이 무거워집니다.`;
  U.result(el,chart,`오늘 ${W(today*1e4)}을 연 ${P(rate,1)}로 ${years}년 옮기면 <b>${W(moved)}</b>입니다. ${years}년 뒤 약속한 ${W(offer)}과 견주면 ${verdict}<br>거꾸로 ${years}년 뒤 ${W(offer)}을 같은 금리로 오늘로 데려오면 ${W(back)}입니다. ${evenText}${U.kind('real','해마다 이자를 다시 붙여 계산했습니다(2장에서 자세히 봅니다). 세금·물가·약속이 깨질 위험은 뺐고, 금리는 가정입니다.')}`);
 });
};
MLabs.compound=el=>{
 U.setup(el,U.range('cprin','원금 (만 원)',100,5000,100,1000)+U.range('crate','연 금리 (%) · 음수는 해마다 줄어듦',-10,12,.1,3)+U.range('cyears','기간 (년)',1,40,1,10));
 U.bind(el,()=>{
  const p=U.value(el,'cprin')*1e4,r=U.value(el,'crate'),n=U.value(el,'cyears'),simple=M.simpleFV(p,r,n),comp=M.compoundFV(p,r,n),gap=comp-simple;
  const yrs=Array.from({length:n+1},(_,t)=>t);
  const chart=U.lines([{name:'단리',points:yrs.map(t=>[t,M.simpleFV(p,r,t)/1e4]),color:'var(--blue)',dash:'7 5'},{name:'복리',points:yrs.map(t=>[t,M.compoundFV(p,r,t)/1e4]),color:'var(--accent)'}],{label:`원금 ${F(p/1e4,0)}만 원, 연 ${r}%, ${n}년. 단리 ${W(simple)}, 복리 ${W(comp)}.`,xName:'해',yName:'만 원',yFmt:v=>F(v,0),marks:[[n,comp/1e4,'']]});
  const second=n>=2?` 2년째 이자는 단리 ${W(M.simpleFV(p,r,2)-M.simpleFV(p,r,1))}, 복리 ${W(M.compoundFV(p,r,2)-M.compoundFV(p,r,1))}입니다.`:'';
  const dir=r<0?`<br>금리가 음수면 복리도 해마다 남은 돈에서 같은 비율씩 깎여 ${n}년 뒤 처음의 <b>${P(comp/p*100,1)}</b>만 남습니다.`:'';
  U.result(el,chart,`${W(p)}을 연 ${P(r,1)}로 ${n}년 두면 단리 <b>${W(simple)}</b>, 복리 <b>${W(comp)}</b>입니다. 복리가 단리보다 ${W(Math.abs(gap))} ${gap>=0?'많습니다':'적습니다'}.${second}${dir}${U.kind('real','이자를 해마다 한 번 붙이는 복리입니다. 세금과 물가는 뺐습니다.')}`);
 });
};
const PERIODS=[['1','해마다 (1번)'],['12','달마다 (12번)'],['365','날마다 (365번)'],['Infinity','연속 복리']];
const periodName=m=>({1:'해마다',12:'달마다',365:'날마다',Infinity:'연속으로'})[m];
MLabs.double=el=>{
 U.setup(el,U.range('drate','연 금리 (%)',1,20,.5,6)+U.select('dm','이자를 붙이는 횟수 (한 해)',PERIODS,'12'));
 U.bind(el,()=>{
  const r=U.value(el,'drate'),m=Number(el.querySelector('#dm').value),est=M.rule72(r),exact=M.doublingYears(r),eff=M.ear(r,m),withM=M.doublingYears(eff);
  const rates=Array.from({length:39},(_,i)=>1+i*.5);
  const chart=U.lines([{name:'72의 법칙 − 정확한 값',points:rates.map(x=>[x,M.rule72(x)-M.doublingYears(x)]),color:'var(--accent)'}],{label:`72의 법칙의 오차(년). 연 ${r}%에서 72의 법칙 ${F(est,2)}년, 정확한 값 ${F(exact,2)}년, 차이 ${F(est-exact,2)}년.`,xName:'연 금리 (%)',yName:'어림의 오차 (년)',yFmt:v=>U.sfmt(v,1),zero:true,marks:[[r,est-exact,`${U.sfmt(est-exact,2)}년`]]})
   +U.table(['붙이는 횟수','실효 연 금리'],PERIODS.map(([k,t])=>[`${t}${+k===m?' ✓':''}`,P(M.ear(r,+k),4)]),`표시 금리 연 ${r}%`);
  const err=est-exact;
  U.result(el,chart,`연 ${P(r,1)}에서 72의 법칙은 <b>${F(est,2)}년</b>, 정확한 값 ln 2 ÷ ln(1 + 금리)는 <b>${F(exact,2)}년</b>으로 ${F(Math.abs(err),2)}년(약 ${F(Math.abs(err)*12,1)}개월) ${err>=0?'길게':'짧게'} 어림합니다.<br>같은 연 ${P(r,1)}라도 이자를 ${periodName(m)} 붙이면 실효 연 금리는 <b>${P(eff,4)}</b>이고, 두 배까지 ${F(withM,2)}년이 걸립니다.${U.kind('real','세금은 뺐습니다. 실효 금리는 한 해 동안 실제로 불어나는 비율입니다.')}`);
 });
};
})();
