/* 표지의 살아 있는 실험: 시간 저울. 오늘 1,000만 원과 친구가 약속한 1년 뒤 1,030만 원을, 하린이 맡길 수 있는 금리로 같은 시점에 옮겨 단다.
   1장 scale 실험과 같은 사례이며 MMath.compoundFV로 실제로 계산한다. */
window.MHome=(()=>{
function mount(el){
 const M=MMath,U=MUI,TODAY=1e7,OFFER=1.03e7;
 el.innerHTML=`<div class="lab-top"><span>오늘 1,000만 원과 1년 뒤 1,030만 원, 어느 쪽의 가치가 클까</span><span>TIME SCALE / 시간 저울</span></div><div class="home-scale"></div><div class="network-controls">${U.range('home-rate','하린이 맡길 수 있는 금리 (연 %)',0,8,.1,3)}<div class="buttons"><button type="button" data-rate="2">연 2%</button><button type="button" data-rate="3">연 3%</button><button type="button" data-rate="4">연 4%</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>오늘 받은 1,000만 원을 고른 금리의 예금에 1년 넣었을 때의 금액(1,000만 × (1 + 금리))을 왼쪽 접시에, 친구가 약속한 1년 뒤 1,030만 원을 오른쪽 접시에 올립니다. 세금·물가·약속이 깨질 위험은 뺐고, 금리는 가정입니다. 1장에서 같은 저울을 기간과 금액까지 바꾸며 다시 봅니다.</p></details>`;
 const input=el.querySelector('#home-rate'),box=el.querySelector('.home-scale'),out=el.querySelector('.home-result');
 function update(){
  const r=Number(input.value),moved=M.compoundFV(TODAY,r,1),gap=moved-OFFER;
  el.querySelector('#home-rate-value').textContent=`${U.fmt(r,1)}%`;
  box.innerHTML=U.balance(moved,OFFER,{leftName:'오늘 1,000만 원',rightName:'1년 뒤 약속',leftNote:`1년 뒤 ${U.won(moved)}`,rightNote:U.won(OFFER),h:200});
  const verdict=Math.abs(gap)<1?'친구의 약속과 <b>같은 무게</b>입니다.':gap>0?`친구의 약속보다 <b>${U.won(gap)} 무겁습니다</b>. 이 가정에서는 오늘 받는 쪽의 숫자가 큽니다.`:`친구의 약속보다 <b>${U.won(-gap)} 가볍습니다</b>. 이 가정에서는 1년 뒤 받는 쪽의 숫자가 큽니다.`;
  out.innerHTML=`연 ${U.fmt(r,1)}%라면 오늘 1,000만 원은 1년 뒤 <b>${U.won(moved)}</b>이 되어 ${verdict}`;
 }
 const click=e=>{const b=e.target.closest('[data-rate]');if(b){input.value=b.dataset.rate;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
