/* 표지 오른쪽의 살아 있는 대표 실험: KL 벌점 β 하나로 누리의 세 가지 답이 어떻게 다시 나뉘는지 닫힌 해로 계산한다. */
window.A19Home=(()=>{
function mount(el){
 const U=A19UI,M=A19Math,F=U.fmt;
 el.innerHTML=`<div class="lab-top"><span>KL 벌점과 누리의 답</span><span>RLHF · β</span></div><div class="home-graphic"></div><div class="network-controls">${U.range('home-beta','KL 벌점 β',0.05,3,0.05,1)}<div class="buttons"><button type="button" data-beta="0.1">β = 0.1 (세게 최적화)</button><button type="button" data-beta="1">β = 1 (SFT 근처)</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>KL 벌점을 둔 RLHF 목적 E[r] − β·KL(π‖π_SFT)의 최적해 π(y) ∝ π_SFT(y)·exp(r(y)/β)를 세 가지 답에 대해 실제로 계산합니다. 세 답의 SFT 확률(0.5·0.3·0.2), 보상 모델 점수(1.0·1.3·−0.5), 실제 도움(+1·−1·−1)은 교육용 가정값입니다. 맞장구 답은 보상 모델 점수가 가장 높지만 고객에게는 해롭습니다.</p></details>`;
 const input=el.querySelector('#home-beta');
 function update(){const b=Number(input.value),r=M.klPolicy(b);el.querySelector('#home-beta-value').textContent=F(b,2);
  el.querySelector('.home-graphic').innerHTML=U.bars(M.ANSWERS.map(a=>a.name),r.pi,'확률',null,3);
  el.querySelector('.home-result').innerHTML=`β = <b>${F(b,2)}</b> · 맞장구 답 <strong>${F(r.syc,3)}</strong><br>보상 모델 점수 <b>${F(r.proxy,3)}</b> · 실제 도움 <b>${F(r.util,3)}</b> · KL <b>${F(r.kl,3)}</b><br>${r.util<r.base.util?'점수는 올랐지만 실제 도움은 SFT보다 나빠졌습니다.':'아직 SFT보다 도움이 됩니다.'}`;}
 const click=e=>{const btn=e.target.closest('[data-beta]');if(btn){input.value=btn.dataset.beta;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
