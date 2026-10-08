/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A05Guides=(()=>{
const guides={
 convsize:['커널·패딩·보폭 중 하나만 바꿔도 출력 크기와 수용 영역이 어떻게 달라지는지 봅니다.',[['same 3×3',{cvh:480,cvk:3,cvp:1,cvs:1}],['패딩 없음',{cvh:480,cvk:3,cvp:0,cvs:1}],['7×7 보폭 2',{cvh:480,cvk:7,cvp:3,cvs:2}]],'same 3×3은 크기를 유지하고, 패딩을 빼면 층마다 2칸씩 줄며, 보폭 2는 층마다 절반이 됩니다. 수용 영역은 보폭이 클수록 빨리 넓어집니다.'],
 standardize:['학습 때와 다른 전처리가 모델 입력값을 얼마나 바꾸는지 숫자로 비교합니다.',[['올바른 순서',{stmode:'ok',str:200}],['÷255 빠뜨림',{stmode:'raw',str:200}],['BGR로 넣음',{stmode:'bgr',str:200}]],'÷255를 빠뜨리면 값이 수백 배 커지고, BGR은 빨강과 파랑 채널의 뜻을 바꿉니다. 어느 쪽도 오류는 나지 않습니다.'],
 residual:['평범한 망의 기울기가 깊이에 따라 지수적으로 줄 때, 잔차 지름길이 무엇을 지키는지 봅니다.',[['얕은 망 (L=8)',{resl:8,resa:0.8}],['깊은 망 (L=50)',{resl:50,resa:0.8}],['약한 블록 (a=0.5)',{resl:30,resa:0.5}]],'주황 선(평범한 망)은 깊어질수록 곧게 떨어지고, 초록 선(덧셈 지름길)은 0, 즉 기울기 1에 머뭅니다.'],
 patches:['패치 크기와 입력 크기가 토큰 수와 어텐션 비용을 얼마나 바꾸는지 봅니다.',[['기본 224·p16',{vimg:224,vpatch:16}],['448·p16',{vimg:448,vpatch:16}],['224·p8',{vimg:224,vpatch:8}]],'입력 한 변을 두 배로 하거나 패치를 절반으로 하면 토큰은 네 배, 어텐션 쌍은 약 열여섯 배가 됩니다.'],
 softmax:['온도가 확률의 날카로움을, 라벨 스무딩이 손실의 목표를 어떻게 바꾸는지 봅니다.',[['T=1, 원-핫',{smt:1,sme:0}],['T=0.5',{smt:0.5,sme:0}],['T=1, ε=0.2',{smt:1,sme:0.2}]],'T를 낮추면 자전거 확률이 1에 가까워지고 원-핫 손실은 줄어듭니다. ε를 주면 확률이 아무리 높아도 손실이 0이 되지 않습니다.'],
 nms:['NMS 임계값이 너무 낮거나 높을 때 무엇이 사라지고 무엇이 남는지 봅니다.',[['기본 0.45',{nmst:0.45,nmss:0.3}],['너무 낮음 0.05',{nmst:0.05,nmss:0.3}],['너무 높음 0.8',{nmst:0.8,nmss:0.3}]],'0.45에서는 물체마다 상자 하나가 남고, 0.05에서는 두 번째 자전거의 가장 좋은 상자 b1이 첫 자전거 상자 a1과 IoU 0.06만 겹쳐도 지워지고 점수가 낮은 b2(0.40)가 대신 남으며, 0.8에서는 중복 상자가 살아남습니다.'],
 dice:['작은 물체 앞에서 픽셀 정확도와 IoU·Dice가 서로 다른 말을 하는 순간을 찾습니다.',[['전경 1%, 못 찾음',{dfg:1,drec:0}],['전경 5%, 60% 찾음',{dfg:5,drec:60}],['전경 30%, 60% 찾음',{dfg:30,drec:60}]],'전경 1%에서 아무것도 못 찾아도 정확도는 0.985(“모두 배경”이라 답하면 0.99)이지만 IoU와 Dice는 0입니다. 전경이 커지면 세 지표의 차이가 줄어듭니다.'],
 kalman:['검출 오차를 크게 가정할수록 칼만 필터가 검출을 덜 믿는 모습을 봅니다.',[['R=4 (검출 믿음)',{kr:4}],['R=25',{kr:25}],['R=200 (예측 믿음)',{kr:200}]],'R이 작으면 궤적이 검출점을 바짝 따라가고, 크면 부드럽지만 처음 속도를 늦게 배웁니다. 가림 구간은 세 경우 모두 예측만으로 이어집니다.'],
 contrast:['온도가 유사도 순위는 그대로 두고 확률과 손실만 바꾸는지 확인합니다.',[['τ=0.07 (CLIP 시작값)',{ctau:0.07}],['τ=0.3',{ctau:0.3}],['τ=1',{ctau:1}]],'τ가 작으면 대각선 확률이 1에 가까워지고 손실이 줄며, τ=1이면 네 칸이 비슷해져 손실이 약 1.08로 커지고, 네 칸이 완전히 같을 때의 값 log 4 ≈ 1.39 쪽으로 다가갑니다.'],
 cer:['실수의 종류(바꿈·빠짐·넣음)와 개수가 CER에 어떻게 반영되는지 봅니다.',[['0을 O로',{ocrh:1}],['한 글자 빠짐',{ocrh:2}],['앞부분 놓침',{ocrh:5}]],'바꿈 하나와 빠짐 하나는 같은 1점이라 CER이 같습니다. 앞부분 “서울-”을 놓치면 세 글자가 빠져 CER이 크게 오릅니다.'],
 depthscale:['축척이 틀려도 순서는 맞는 상대 깊이의 성질과, 지표가 축척에 얼마나 민감한지 봅니다.',[['축척 2 (작음)',{dscale:2}],['축척 4',{dscale:4}],['축척 7 (큼)',{dscale:7}]],'축척 4 근처에서 AbsRel이 가장 작고 δ<1.25가 높습니다. 축척 2나 7에서도 다섯 물체의 순서는 그대로입니다.'],
 composite:['앞 표본의 불투명도가 뒤 표본들의 몫을 어떻게 가리는지 봅니다.',[['투명 α₁=0',{ca1:0}],['반투명 α₁=0.5',{ca1:0.5}],['불투명 α₁=1',{ca1:1}]],'α₁=0이면 빨강은 기여가 없고 회색·파랑이 색을 만듭니다. α₁=1이면 뒤의 두 색은 가중치 0이 되어 픽셀이 빨강이 됩니다.'],
 noise:['시점이 지날수록 신호 계수가 줄고 잡음 계수가 커지는 모양과 속도를 봅니다.',[['t=100',{nt:100}],['t=500',{nt:500}],['t=900',{nt:900}]],'t=100까지는 신호가 대부분 남지만, t=500이면 신호 계수가 약 0.28로 이미 잡음보다 작습니다. 마지막 구간은 거의 순수 잡음입니다.'],
 cfg:['가이던스 배율이 조건부와 무조건부 예측의 차이를 얼마나 늘리는지 봅니다.',[['w=0 (무조건부)',{cw:0}],['w=1 (조건부)',{cw:1}],['w=7.5 (SD 기본)',{cw:7.5}]],'w=0과 1에서는 각각 ε_u와 ε_c에 정확히 겹치고, 7.5에서는 차이 방향으로 6.5배 더 나갑니다.'],
 flowsteps:['곧은 길과 휜 길에서 오일러 단계 수가 도착 오차에 주는 영향을 비교합니다.',[['곧은 길, 1단계',{fbend:0,fsteps:1}],['휜 길, 1단계',{fbend:1,fsteps:1}],['휜 길, 30단계',{fbend:1,fsteps:30}]],'곧은 길은 1단계로도 오차가 0입니다. 휜 길은 1단계에서 크게 빗나가고, 단계를 늘려야 줄어듭니다.'],
 latency:['입력 크기와 정밀도 중 어느 손잡이가 예산을 맞추는 데 더 큰지 비교합니다.',[['1280·FP32 (새 카메라 그대로)',{lside:1280,lprec:'fp32'}],['640·FP32',{lside:640,lprec:'fp32'}],['640·INT8',{lside:640,lprec:'int8'}]],'1280·FP32는 예산의 세 배에 가깝고, 640으로 줄이면 거의 닿으며, INT8을 더하면 여유가 생깁니다. 해상도를 줄이면 작은 물체 정확도가 떨어질 수 있다는 점은 이 계산이 보여 주지 않습니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A05Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
