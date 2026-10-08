/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A10Guides=(()=>{
const guides={
 randwalk:['할인율이 커질수록 무작위 정책의 가치가 최단 경로 값에서 얼마나 멀어지는지 확인합니다.',[['γ = 0.5',{gamma:0.5}],['γ = 0.9',{gamma:0.9}],['γ = 1.0',{gamma:1}]],'γ=0.5에서는 출발 칸 가치가 약 −2로 최단 경로 값과 거의 같고, γ=1에서는 약 −59.4로 −6과 크게 벌어져야 정상입니다. 멀리 내다볼수록 무작위로 헤매는 비용이 드러납니다.'],
 valueiter:['훑기 한 번에 출고대의 정보가 한 칸씩 퍼지는지, 미끄러짐이 최적 가치를 얼마나 깎는지 봅니다.',[['3번 훑기',{sweeps:3,vgamma:1,slip:0}],['수렴까지',{sweeps:20,vgamma:1,slip:0}],['젖은 바닥 0.3',{sweeps:20,vgamma:0.99,slip:0.3}]],'3번 훑으면 출고대에서 3칸 넘게 떨어진 칸은 모두 −3이고, 수렴하면 출발 칸이 −6이어야 합니다. 젖은 바닥(γ=0.99)에서는 약 −8.1로 나빠집니다.'],
 egreedy:['탐험이 없을 때 가장 좋은 통로를 놓치는지, 탐험이 너무 많을 때 점수가 깎이는지 봅니다.',[['ε = 0 (탐욕)',{eps:0}],['ε = 0.1',{eps:0.1}],['ε = 0.3',{eps:0.3}]],'ε=0이면 가장 좋은 통로를 고른 비율이 20% 근처에 머물고, ε=0.1이면 85% 안팎까지 올라야 정상입니다. ε=0.3은 찾기는 하지만 계속 헤매느라 마지막 점수가 조금 낮습니다.'],
 cliff:['탐험이 있을 때 Q-learning과 SARSA가 서로 다른 길을 배우는지 확인합니다.',[['ε = 0',{ceps:0}],['ε = 0.1',{ceps:0.1}],['ε = 0.3',{ceps:0.3}]],'ε=0.1에서 Q-learning은 13걸음 가장자리 길, SARSA는 17걸음 윗길을 배우고, 훈련 중 평균 보상은 SARSA가 더 높아야 정상입니다. ε=0이면 둘이 같은 길로 모입니다.'],
 overest:['max로 고른 추정이 행동 수와 잡음에 따라 얼마나 부풀려지는지 봅니다.',[['행동 1개',{acts:1,noise:1}],['행동 10개',{acts:10,noise:1}],['행동 20개, σ=2',{acts:20,noise:2}]],'행동이 1개면 편향이 0 근처, 10개(σ=1)면 약 +1.5, 20개(σ=2)면 약 +3.7이어야 정상입니다. 이중 추정은 어느 경우든 0 근처에 머뭅니다.'],
 baseline:['기준선이 기울기의 평균은 그대로 두고 분산만 바꾸는지 확인합니다.',[['기준선 없음',{offset:0,b:0}],['보상 +10, 기준선 없음',{offset:10,b:0}],['보상 +10, b = 10.7',{offset:10,b:10.7}]],'세 예제 모두 평균은 0.21이어야 합니다. 분산은 약 0.31, 약 24.3, 약 0.21로 바뀝니다. 상수를 더한 만큼 기준선을 옮기면 분산이 원래보다도 작아집니다.'],
 gae:['λ가 편향과 분산을 맞바꾸는지, 비평가가 정확할 때는 무엇이 달라지는지 봅니다.',[['λ = 0 (TD)',{lambda:0,cerr:1}],['λ = 0.95',{lambda:0.95,cerr:1}],['λ = 1 (몬테카를로)',{lambda:1,cerr:1}]],'λ=0에서 편향 1·분산 1, λ=1에서 편향 0·분산 20이어야 정상입니다. 비평가 오차를 0으로 바꾸면 편향이 사라져 λ=0이 가장 좋아집니다.'],
 clip:['좋은 행동은 1+ε 위에서, 나쁜 행동은 1−ε 아래에서 기울기가 끊기는지 확인합니다.',[['좋은 행동, r = 1.5',{ratio:1.5,peps:0.2,adv:1}],['나쁜 행동, r = 0.7',{ratio:0.7,peps:0.2,adv:-1}],['좋은 행동, r = 0.7',{ratio:0.7,peps:0.2,adv:1}]],'첫째와 둘째는 기울기 0(잘림)이고 목적 값은 각각 1.2와 −0.8입니다. 셋째는 좋은 행동이 줄어든 상태라 기울기가 살아 있어야 정상입니다.'],
 epochs:['같은 묶음을 여러 번 쓸 때 자르기가 정책의 이동을 멈추는지 봅니다.',[['K = 1',{kep:1,pmode:'clip'}],['K = 10, 자르기',{kep:10,pmode:'clip'}],['K = 30, 자르기 없음',{kep:30,pmode:'none'}]],'K=1에서는 두 방식이 같고 KL 약 0.009입니다. 자르면 KL이 약 0.037에서 멈추고, 자르지 않으면 30번 뒤 약 1.5까지 커지며 좋은 행동의 비율이 2.8배를 넘어야 정상입니다.'],
 bt:['점수 차가 클수록 확률이 1에 다가가고, 틀린 쪽을 확신할수록 손실이 커지는지 봅니다.',[['점수 차 0',{delta:0,chose:'A'}],['Δ = 2, A를 고름',{delta:2,chose:'A'}],['Δ = 2, B를 고름',{delta:2,chose:'B'}]],'Δ=0이면 확률 0.5, 손실 약 0.693입니다. Δ=2에서 A를 고르면 손실 약 0.127로 작고, B를 고르면 약 2.127로 커져야 정상입니다.'],
 kl:['β가 작아질수록 보상 모델 점수는 오르고 실제 만족도는 떨어지는 지점이 있는지 찾습니다.',[['β = 0.2',{beta:0.2}],['β = 1.0',{beta:1}],['β = 3.0',{beta:3}]],'β=0.2에서는 지름길 확률이 거의 1이고 만족도가 약 −2.0, β=1에서는 약 0.16, β=3에서는 약 0.67이어야 정상입니다. 점수가 가장 높은 정책이 가장 나쁜 정책입니다.'],
 coop:['같은 보상표에서 독립 학습과 중앙 학습이 어디에 정착하는지 비교합니다.',[['독립, ε = 0.1',{cmode:'indep',xeps:0.1,cepi:2000}],['중앙, ε = 0.1',{cmode:'joint',xeps:0.1,cepi:2000}],['독립, ε = 0.2',{cmode:'indep',xeps:0.2,cepi:2000}]],'독립 학습은 대부분 “둘 다 천천히”(약 93%)에, 중앙 학습은 60번 모두 “둘 다 질주”에 정착해야 정상입니다. 독립 학습에서 ε를 올리면 질주 비율이 더 줄어듭니다.'],
 dr:['훈련 범위를 넓히면 젖은 바닥에서 버티지만, 너무 넓으면 마른 바닥에서 멈춰 버리는지 봅니다.',[['w = 0 (마른 바닥만)',{width:0}],['w = 0.2',{width:0.2}],['w = 0.5',{width:0.5}]],'w=0이면 미끄러짐 0.3에서 약 −201, w=0.2면 약 −43.4, w=0.5면 약 −26.1이어야 정상입니다. 그러나 w=0.5의 정책은 마른 바닥에서 출발하지 못해 −100이 됩니다.'],
 puct:['탐험 상수가 가치와 사전 확률 중 무엇을 따르게 하는지 봅니다.',[['c = 0',{cpuct:0}],['c = 1',{cpuct:1}],['c = 5',{cpuct:5}]],'c=0이면 수 A만 40번, c=1이면 B가 가장 많고(23번), c=5면 방문 비율이 사전 확률(15·60·25%)에 가까워져야 정상입니다.'],
 grpo:['묶음이 작거나 문제가 너무 쉽거나 어려우면 신호가 사라지는지 확인합니다.',[['G = 4, p = 0.5',{gsize:4,gp:0.5}],['G = 16, p = 0.9',{gsize:16,gp:0.9}],['G = 64, p = 0.1',{gsize:64,gp:0.1}]],'G=4, p=0.5에서 신호 없음 확률은 12.5%, G=16, p=0.9에서는 약 18.5%, G=64, p=0.1에서는 0.12%여야 정상입니다. 신호가 있으면 성공한 시도의 이점은 양수, 실패는 음수입니다.'],
 diagnose:['보고마다 원인과 이어진 처방만 지표를 움직이는지 확인합니다.',[['젖은 바닥 + 무작위화',{report:'slip',fix:'dr'}],['불만 + β 올리기',{report:'hack',fix:'beta'}],['젖은 바닥 + β 올리기',{report:'slip',fix:'beta'}]],'첫째는 약 −201에서 약 −26으로, 둘째는 약 −2.0에서 약 0.48로 움직여야 합니다. 셋째처럼 원인과 상관없는 처방은 값이 그대로입니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A10Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
