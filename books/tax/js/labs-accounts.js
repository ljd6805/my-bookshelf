/* 7~8장 실험: ISA의 비과세 한도와 9.9%, 연금저축·IRP의 세액공제와 꺼낼 때의 세금(두 단계).
   계산은 TMath.flows·roundFlows·generalTax·isaTax·pensionCredit·pensionOutcome·presentValue. 가격 상승 4%·분배 2%는 기준 사례의 가상 시나리오다. */
(()=>{
'use strict';
const U=TUI,M=TMath,F=U.fmt,W=U.won0,R=M.RATES,B=M.BASE;
const note=()=>`<span class="rate-note">${U.RATE_NOTE}</span><br>`;
const base=(p,n=B.years)=>M.roundFlows(M.flows(p,n,B.growth,B.payout));
/* 7장: ISA. */
const IPRODS=['kother','kequity','stock','bond','foreign'];
function isaLines(kind,f,type,early){
 const g=M.generalTax(kind,f),t=M.isaTax(kind,f,type),tax=early?g.total:t.tax,after=f.pretax-tax;
 const head=early?`3년 전에 해지하면 비과세·분리과세 특례가 사라져 일반계좌와 같은 세금 <b>${W(g.total)}</b>을 냅니다(보도 기준). 세후 수익은 <b>${W(after)}</b>입니다.`
  :`ISA 안의 과세 대상 순이익 <b>${W(t.net)}</b>에서 비과세 한도 ${W(t.limit)}을 빼면 ${W(Math.max(0,t.net-t.limit))}이고, × 9.9% = 세금 <b>${W(t.tax)}</b>, 세후 수익 <b>${W(after)}</b>입니다.`;
 const vs=early?'':` 같은 투자를 일반계좌에서 하면 세금이 <b>${W(g.total)}</b>이라 ISA 쪽 세금이 <b>${W(g.total-t.tax)}</b> 적습니다.`;
 const stt=kind==='stock'&&!early?`<br>새벽전자를 ISA에서 팔 때 거래세가 빠지는지는 <b>확인 못함</b>입니다. 거래세 ${W(M.isaTax(kind,f,type,true).stt)}이 빠진다고 놓으면 세후 ${W(M.isaTax(kind,f,type,true).after)}, 빠지지 않는다고 놓으면 ${W(after)}입니다.`:'';
 return {tax,gen:g.total,text:head+vs+stt};
}
TLabs.isa=el=>{
 U.setup(el,U.select('itype','ISA 유형',[['general','일반형 (비과세 200만 원)'],['low','서민형 (비과세 400만 원)']],'general')+U.select('iprod','상품',IPRODS.map(k=>[k,`${U.pname(k)} (${U.PRODUCTS[k][1]})`]),'kother')+U.number('iprin','원금 (원)',0,100000000,100000,10000000,'연 납입 한도 2,000만 원·총 1억 원(보도 기준)')+U.number('iyears','보유 기간 (년)',1,10,1,3,'의무 기간 3년')+U.check('iearly','3년 전에 해지',false));
 U.bind(el,()=>{
  const type=U.value(el,'itype'),kind=U.value(el,'iprod'),p=U.num(el,'iprin'),n=U.num(el,'iyears'),early=U.checked(el,'iearly');
  if(p===null)return U.result(el,'',U.problem('원금','0에서 1억 원 사이의 원 단위 숫자를 넣어야 합니다.'));
  if(n===null||!Number.isInteger(n))return U.result(el,'',U.problem('보유 기간','1에서 10 사이의 정수(년)를 넣어야 합니다.'));
  if(kind==='foreign')return U.result(el,'',`${note()}✗ <b>먼바다500(해외 상장 ETF)은 ISA에서 살 수 없습니다</b>(보도 기준). 계산하지 않았습니다. 같은 상품의 일반계좌 세금은 6장 실험에서 볼 수 있습니다.${U.kind(['news'])}`);
  const f=base(p,n),L=isaLines(kind,f,type,early);
  const chart=U.columns({labels:['일반계좌 세금',early?'해지 뒤 세금':'ISA 세금'],values:[L.gen,L.tax],mark:i=>i===1,fmt:v=>`${F(v)}원`,tick:v=>F(v),title:`${U.pname(kind)} ${F(p)}원 · ${n}년 · 세전 ${F(f.pretax)}원`,h:230,label:`일반계좌 세금 ${W(L.gen)}, ISA 세금 ${W(L.tax)}`});
  const warn=!early&&n<R.isa.years?`<br>보유 기간이 의무 기간 3년보다 짧습니다. 위 값은 계좌를 유지한다고 놓은 것이고, 이 기간에 해지하면 “3년 전에 해지”의 값이 됩니다.`:'';
  U.result(el,chart,`${note()}<b>${U.pname(kind)}</b> ${W(p)}, ${n}년(연 4% + 2%, 세전 ${W(f.pretax)}): ${L.text}${warn}${U.kind(['real','news','scenario'],kind==='stock'?'':'국내 주식과 국내주식형 ETF의 차익은 원래 비과세라 ISA 순이익에 넣지 않았습니다.')}`);
 });
};
/* 8장: 연금저축·IRP. 1단계 넣을 때(세액공제), 2단계 꺼낼 때(연금소득세 5.5% 또는 중도 인출 16.5%)와 늦게 내는 세금의 현재가치. */
const ACCTS=[['saving','연금저축 (공제 한도 600만 원)'],['irp','IRP (합산 한도 900만 원)'],['both','둘 다 (합산 한도 900만 원)']];
function pensionChart(o){
 const items=[['세전 수익',o.pretax],['받은 공제',o.credit],['꺼낼 때 세금',-o.tax],['세후',o.after]];
 return U.columns({labels:items.map(x=>x[0]),values:items.map(x=>x[1]),mark:i=>i===3,fmt:v=>F(v),tick:v=>F(v/10000)+'만',title:'원 · 세후 = 세전 수익 + 공제 − 꺼낼 때 세금',h:240,label:items.map(x=>`${x[0]} ${W(x[1])}`).join(', ')});
}
TLabs.pension=el=>{
 U.setup(el,`<fieldset class="step"><legend>1단계 · 넣을 때</legend>${U.select('pacct','계좌',ACCTS,'saving')+U.number('pamt','한 해 납입액 (원)',0,18000000,100000,10000000)+U.select('pband','총급여 구간',[['under','5,500만 원 이하 (공제율 16.5%)'],['over','5,500만 원 초과 (공제율 13.2%)']],'under')}</fieldset><fieldset class="step"><legend>2단계 · 꺼낼 때</legend>${U.select('pwithdraw','꺼내는 방법',[['annuity','55세 이후 연금으로 (5.5%)'],['early','3년 뒤 중도 인출 (16.5%)']],'annuity')}</fieldset><fieldset class="step"><legend>늦게 내는 세금의 오늘 가치</legend>${U.number('pdefer','늦게 내는 세금 (원)',0,100000000,1,M.pensionOutcome(base(10000000),'saving','under','annuity').tax,'직접 바꾸기 전까지는 2단계에서 계산한 세금을 따라갑니다')+U.number('pyears','세금을 내는 해까지 남은 해 (년)',0,50,1,10)+U.range('prate','할인율 (%)',0,8,.5,3,'1권 할인 계산')}</fieldset>`);
 let touched=false;
 U.bind(el,e=>{
  if(e&&e.target&&e.target.id==='pdefer')touched=true;
  const acct=U.value(el,'pacct'),amt=U.num(el,'pamt'),band=U.value(el,'pband'),mode=U.value(el,'pwithdraw'),yrs=U.num(el,'pyears'),r=+U.value(el,'prate')/100;
  if(amt===null)return U.result(el,'',U.problem('납입액','0에서 1,800만 원 사이의 원 단위 숫자를 넣어야 합니다.'));
  if(yrs===null||!Number.isInteger(yrs))return U.result(el,'',U.problem('남은 해','0에서 50 사이의 정수(년)를 넣어야 합니다.'));
  const c=M.pensionCredit(amt,acct,band),f=base(amt),o=M.pensionOutcome(f,acct,band,mode);
  if(!touched)el.querySelector('#pdefer').value=o.tax;
  const defer=U.num(el,'pdefer');
  if(defer===null)return U.result(el,'',U.problem('늦게 내는 세금','0 이상의 원 단위 숫자를 넣어야 합니다.'));
  const pv=M.presentValue(defer,r,yrs),name=ACCTS.find(a=>a[0]===acct)[1].split(' (')[0];
  const step1=`<b>1단계 넣을 때</b>: ${name}에 ${W(amt)}을 넣으면 공제 대상은 한도 ${W(c.limit)}까지인 ${W(c.base)}이고, × ${U.rp(c.rate)} = <b>${W(c.credit)}</b>을 다음 해 연말정산에서 돌려받습니다.`;
  const out=mode==='early'?`3년 뒤 중도에 꺼내면 공제받은 원금 ${W(c.base)}과 수익 ${W(f.pretax)}에 16.5%가 붙어 세금 <b>${W(o.tax)}</b>, 세후 <b>${W(o.after)}</b>입니다. 받은 공제 <b>${W(c.credit)}</b>, 공제받은 원금 몫 기타소득세 <b>${W(o.principalTax)}</b>, 차이 <b>${U.sfmt(c.credit-o.principalTax)}원</b>입니다.`
   :`55세 이후 연금으로 받으면 공제받은 원금 ${W(c.base)}과 수익 ${W(f.pretax)}에 5.5%가 붙어 세금 <b>${W(o.tax)}</b>, 세후 <b>${W(o.after)}</b>입니다(그때까지 세율이 그대로라는 가정).`;
  const nc=amt>c.base?` 공제받지 않은 원금 ${W(amt-c.base)}은 세금 없이 나온다고 놓았습니다. 이 규칙과 돈이 빠지는 순서는 <b>확인 못함</b>입니다.`:'';
  const step2=`<b>2단계 꺼낼 때</b>(3년 동안 연 4% + 2%, 세전 수익 ${W(f.pretax)}): ${out}${nc}<br><b>늦게 내는 세금의 오늘 가치</b>: ${yrs}년 뒤 내는 세금 ${W(defer)}${defer===o.tax?'(2단계에서 계산한 세금)':''}은 할인율 ${F(r*100,1)}%에서 오늘 가치 <b>${W(pv)}</b>입니다. 세금이 없어지는 것이 아니라 늦게 내는 것입니다.`;
  U.result(el,pensionChart({pretax:f.pretax,credit:c.credit,tax:o.tax,after:o.after}),`${note()}${step1}<br>${step2}${U.kind(['real','news','scenario'].concat(nc?['unknown']:[]),'연금 수령액이 연 1,500만 원을 넘는 경우와 70세 이후의 낮은 세율은 계산에 넣지 않았습니다.')}`);
 });
};
})();
