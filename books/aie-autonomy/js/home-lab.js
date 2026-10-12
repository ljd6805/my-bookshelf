/* 표지 오른쪽의 살아 있는 대표 실험: 한 단계 성공 확률 p 하나로, 누리가 10·70·200단계짜리 일을 끝까지 해낼 확률 pⁿ을 실제로 계산한다. */
window.A16Home=(()=>{
function mount(el){
 const U=A16UI,M=A16Math;
 el.innerHTML=`<div class="lab-top"><span>누리는 밤새 일을 끝낼까</span><span>RELIABILITY / pⁿ</span></div><div class="home-graphic"></div><div class="network-controls">${U.range('home-p','한 단계 성공 확률 p',0.95,0.999,0.001,0.99)}<div class="buttons"><button type="button" data-p="0.99">p = 0.99</button><button type="button" data-p="0.999">p = 0.999</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>누리의 하룻밤 일은 도구 호출과 확인이 이어진 단계들입니다. 단계마다 성공 확률이 p이고 실패가 서로 독립이라면, n단계를 모두 성공할 확률은 pⁿ입니다. 막대는 n = 10, 70, 200에서의 pⁿ을, 결과 문장의 n₅₀은 pⁿ이 절반이 되는 단계 수 ln 0.5 ÷ ln p를 실제로 계산한 값입니다. 독립 가정은 단순화이며, 실제 실패는 몰리거나 중간에 고쳐지기도 합니다.</p></details>`;
 const input=el.querySelector('#home-p');
 function update(){
  const p=Number(input.value),ns=[10,70,200],P=ns.map(n=>M.chain(p,n).P),n50=M.chain(p,1).n50;
  el.querySelector('#home-p-value').textContent=U.fmt(p,3);
  el.querySelector('.home-graphic').innerHTML=U.bars(ns.map(n=>`${n}단계`),P.map(x=>x*100),'끝까지 성공할 확률(%)',null,1);
  el.querySelector('.home-result').innerHTML=`p = <b>${U.fmt(p,3)}</b> · 70단계를 끝까지 해낼 확률 <strong>${U.fmt(P[1]*100,1)}%</strong><br>절반이 되는 단계 수 n₅₀ ≈ <b>${U.fmt(n50,0)}</b>단계 · 200단계는 <b>${U.fmt(P[2]*100,1)}%</b>`;
 }
 const click=e=>{const b=e.target.closest('[data-p]');if(b){input.value=b.dataset.p;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
