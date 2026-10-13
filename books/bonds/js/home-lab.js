/* 표지의 살아 있는 실험: 시장 금리가 움직이면 나라 3년과 나라 10년의 값이 얼마나 다르게 움직이는가.
   2026-10-07 국고채 금리(3년 3.961%, 10년 4.376%)를 가상 채권에 넣고 BMath.priceChange로 실제로 계산한다. 5장 실험과 같은 계산이다. */
window.BHome=(()=>{
function mount(el){
 const M=BMath,U=BUI,N3=U.bond('nara3'),N10=U.bond('nara10');
 el.innerHTML=`<div class="lab-top"><span>금리가 오르면 채권 값은?</span><span>PRICE ↔ YIELD / 가격과 금리</span></div><div class="home-book"></div><div class="network-controls">${U.range('home-dy','시장 금리 변화 (%p)',-2,2,.25,1)}<div class="buttons"><button type="button" data-dy="-1">−1%p</button><button type="button" data-dy="1">+1%p</button><button type="button" data-dy="2">+2%p</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>가상의 나라 3년(연 3.875%)과 나라 10년(연 4.5%)을 2026-10-07 국고채 금리 3.961%·4.376%로 할인한 값에서 출발해, 두 금리가 같은 폭으로 움직일 때 가격이 몇 % 바뀌는지 계산합니다. 실제 금리를 가상 채권에 넣은 값이고, 세금과 거래 비용은 넣지 않았습니다. 5장에서 같은 계산을 할인채와 어림식까지 넣어 해 봅니다.</p></details>`;
 const input=el.querySelector('#home-dy'),box=el.querySelector('.home-book'),out=el.querySelector('.home-result');
 function update(){
  const dy=Number(input.value)/100,a=M.priceChange(N3,0.03961,dy),b=M.priceChange(N10,0.04376,dy);
  el.querySelector('#home-dy-value').textContent=U.fmt(dy*100,2);
  box.innerHTML=U.columns({labels:['나라 3년','나라 10년'],values:[a.exact*100,b.exact*100],fmt:v=>`${U.splus(v,2)}%`,tick:v=>`${U.sfmt(v,0)}%`,mark:i=>i===1,extra:[-8,8],title:`금리 ${U.pp(dy)}일 때 가격 변화`,h:230,label:`금리 ${U.pp(dy)}: 나라 3년 ${U.ppct(a.exact)}, 나라 10년 ${U.ppct(b.exact)}`});
  out.innerHTML=`시장 금리가 <b>${U.pp(dy)}</b> 움직이면 나라 3년은 ${U.fmt(a.price0,2)}원 → <b>${U.fmt(a.price1,2)}원</b>(<b>${U.ppct(a.exact)}</b>), 나라 10년은 ${U.fmt(b.price0,2)}원 → <b>${U.fmt(b.price1,2)}원</b>(<b>${U.ppct(b.exact)}</b>)입니다. 이표는 그대로인데 그 이표를 받을 권리의 값이 바뀌고, 먼 돈이 많은 채권일수록 더 크게 움직입니다.<br><span class="kind-tag">${U.KINDS.real}</span> <span class="kind-tag">${U.KINDS.realfic}</span>`;
 }
 const click=e=>{const b=e.target.closest('[data-dy]');if(b){input.value=b.dataset.dy;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
