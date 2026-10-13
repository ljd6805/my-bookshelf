/* 표지의 살아 있는 실험: 같은 누리 해외100을 일반계좌·ISA·연금저축(55세 이후 연금 수령)에 두면 3년 세후 수익이 얼마나 다른가.
   기준 사례 비율(연 4% 가격 상승 + 2% 분배, 미리 정한 가상 시나리오)에 원금만 바꿔 TMath.afterTaxTable로 실제로 계산한다. 9장 계산기와 같은 계산이다. */
window.THome=(()=>{
function mount(el){
 const M=TMath,U=TUI,W=U.won0;
 el.innerHTML=`<div class="lab-top"><span>같은 수익, 다른 세후 수익</span><span>AFTER-TAX / 세후 수익</span></div><div class="home-book"></div><div class="network-controls">${U.range('home-amt','원금 (만 원)',100,2000,100,1000)}<div class="buttons"><button type="button" data-amt="500">500만 원</button><button type="button" data-amt="1000">1,000만 원</button><button type="button" data-amt="1500">1,500만 원</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>가상의 ETF 누리 해외100에 원금을 3년 동안 두고 가격이 해마다 4% 오르며 분배금을 연 2% 받는다고 놓은 뒤, 일반계좌(분배금과 차익에 15.4%), ISA 일반형(순이익 200만 원까지 비과세, 넘는 몫 9.9%), 연금저축(넣을 때 공제 16.5%, 55세 이후 연금으로 받을 때 5.5%)의 세후 수익을 계산합니다. ${U.RATE_NOTE}이며, 연금 칸은 3년 뒤 손에 쥐는 금액이 아닙니다. 9장에서 같은 계산을 상품과 인출 방식까지 바꿔 해 봅니다.</p></details>`;
 const input=el.querySelector('#home-amt'),box=el.querySelector('.home-book'),out=el.querySelector('.home-result');
 function update(){
  const p=Number(input.value)*10000,t=M.afterTaxTable({...M.BASE,principal:p,kind:'kother',band:'under'}),c=t.cells,vals=[c.general.after,c.isa.after,c.annuity.after];
  el.querySelector('#home-amt-value').textContent=U.fmt(input.value);
  box.innerHTML=U.columns({labels:['일반계좌','ISA','연금저축 · 연금 수령'],values:vals,fmt:v=>U.fmt(v),tick:v=>`${U.fmt(v/10000)}만`,mark:i=>i===2,title:`원금 ${U.fmt(p/10000)}만 원, 3년 세후 수익 (원) · ▲ 연금 수령 칸`,h:230,label:`세후 수익: 일반계좌 ${W(vals[0])}, ISA ${W(vals[1])}, 연금저축 ${W(vals[2])}`});
  out.innerHTML=`누리 해외100 <b>${W(p)}</b>, 3년 세전 수익 ${W(t.flows.pretax)}이 일반계좌에서는 <b>${W(vals[0])}</b>, ISA에서는 <b>${W(vals[1])}</b>, 연금저축에서 55세 이후 연금으로 받으면 <b>${W(vals[2])}</b>(받은 공제 ${W(c.annuity.detail.credit)} 포함)으로 남습니다. 수익은 같고, 어느 계좌에 두었는지에 따라 붙는 세금이 다릅니다.<br><span class="kind-tag">${U.KINDS.real}</span> <span class="kind-tag">${U.KINDS.news}</span> <span class="kind-tag">${U.KINDS.scenario}</span>`;
 }
 const click=e=>{const b=e.target.closest('[data-amt]');if(b){input.value=b.dataset.amt;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
