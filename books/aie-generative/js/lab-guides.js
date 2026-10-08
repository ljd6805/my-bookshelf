/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A09Guides=(()=>{
const guides={
 density:['커널 폭이 너무 좁거나 넓을 때 구간 확률과 봉우리 수가 어떻게 틀어지는지 봅니다.',[['좁게 0.05',{bw:0.05}],['알맞게 0.3',{bw:0.3}],['넓게 1.5',{bw:1.5}]],'0.3에서는 커널 추정이 참값 0.341에 가깝고 봉우리가 2개여야 합니다. 0.05는 봉우리가 여럿 생기고, 1.5는 확률을 크게 낮춰 잡습니다.'],
 bottleneck:['잠재 차원을 하나씩 늘릴 때 지키는 분산이 얼마나 빨리 차는지 봅니다.',[['k = 1',{zdim:1}],['k = 3',{zdim:3}],['k = 8',{zdim:8}]],'k=1은 약 51%, k=3은 약 88%, k=8은 100%를 지켜야 합니다. 앞쪽 방향일수록 한 차원이 많은 정보를 담습니다.'],
 beta:['β가 문턱 2λ를 넘을 때마다 잠재 차원이 하나씩 꺼지는지 봅니다.',[['β = 0.1',{beta:0.1}],['β = 1',{beta:1}],['β = 5',{beta:5}]],'β=0.1이면 7개, 1이면 4개, 5면 1개가 살아 있어야 합니다. β가 커질수록 재구성 오차는 늘고 KL은 줄어듭니다.'],
 balance:['생성자만 빠르게 할 때 장면 비율이 반반에서 벗어나 흔들리는지 확인합니다.',[['균형 ηG 2',{etag:2,etad:2}],['빠른 생성자 ηG 8',{etag:8,etad:2}],['아주 빠른 생성자 ηG 16',{etag:16,etad:2}]],'ηG=2는 50%에 수렴하고, 8은 반반 근처에서 흔들리며, 16은 한 장면이 10% 아래로 굶는 모드 붕괴가 나타나야 합니다. 교육용 시뮬레이션입니다.'],
 l1l2:['그럴듯한 답이 둘일 때 L2와 L1이 각각 무엇을 고르는지 비교합니다.',[['빨강 70%',{pred:0.7}],['반반',{pred:0.5}],['빨강 30%',{pred:0.3}]],'빨강 70%면 L2는 0.30(보라 쪽), L1은 0(빨강)이어야 합니다. 반반이면 둘 다 가운데에 머뭅니다.'],
 truncation:['ψ를 낮출수록 다양성이 정확히 ψ배로 줄고 평균 근처 비율이 늘어나는지 봅니다.',[['ψ = 0.5',{psi:0.5}],['ψ = 0.7',{psi:0.7}],['ψ = 1.0',{psi:1}]],'다양성은 ψ=0.5에서 0.50배, 0.7에서 0.70배여야 하고, 평균 근처 비율은 ψ가 작을수록 커집니다.'],
 schedule:['같은 단계에서 두 스케줄의 신호가 얼마나 다른지 비교합니다.',[['선형, t = 300',{sched:'linear',tstep:300}],['코사인, t = 300',{sched:'cosine',tstep:300}],['선형, t = 700',{sched:'linear',tstep:700}]],'t=300에서 선형은 신호 0.63, 코사인은 0.89여야 합니다. 선형은 t=700이면 신호가 0.08로 거의 사라집니다.'],
 steps:['단계 수에 따라 샘플이 흐릿한 중간에서 두 장면으로 갈라지는지 봅니다.',[['1단계',{nsteps:1}],['3단계',{nsteps:3}],['20단계',{nsteps:20}]],'1단계는 200개 모두 흐릿한 중간에, 3단계는 약 70%가 장면에, 20단계는 97%가 장면에 닿아야 합니다.'],
 cfg:['w를 키울수록 평균이 밀려나고 다양성이 줄며 과포화가 늘어나는지 봅니다.',[['w = 0',{gscale:0}],['w = 3',{gscale:3}],['w = 9',{gscale:9}]],'w=0은 평균 약 2, 표준편차 약 0.4이고, w=3은 평균 2.6, w=9는 평균 3.2 이상에 대부분 과포화여야 합니다.'],
 lora:['랭크를 바꿀 때 학습할 값의 수가 얼마나 줄어드는지 계산합니다.',[['d 640, r 16',{ldim:640,rank:16}],['d 640, r 4',{ldim:640,rank:4}],['d 4096, r 64',{ldim:4096,rank:64}]],'d=640, r=16이면 20배, r=4면 80배, d=4096·r=64면 32배 적어야 합니다.'],
 sdedit:['강도를 높일 때 원래 장면을 지킬 확률이 어디서 크게 떨어지는지 봅니다.',[['강도 0.3',{strength:0.3}],['강도 0.6',{strength:0.6}],['강도 0.9',{strength:0.9}]],'0.3이면 약 95%, 0.6이면 약 63%, 0.9면 약 51%로 거의 동전 던지기가 되어야 합니다.'],
 video:['조각 크기와 해상도가 토큰 수와 어텐션 비용을 얼마나 바꾸는지 계산합니다.',[['10초 1080p, 2×2',{vsec:10,vres:1080,vpatch:2}],['10초 1080p, 4×4',{vsec:10,vres:1080,vpatch:4}],['5초 720p, 2×2',{vsec:5,vres:720,vpatch:2}]],'첫 예제는 원시 1.49GB, 토큰 489,600개여야 하고, 4×4 조각은 토큰이 122,400개로 4분의 1이 됩니다.'],
 flowsteps:['휜 길과 곧은 길에서 단계 수가 결과를 얼마나 바꾸는지 비교합니다.',[['휜 길, 1단계',{fpath:'independent',fsteps:1}],['휜 길, 4단계',{fpath:'independent',fsteps:4}],['곧은 길, 1단계',{fpath:'rectified',fsteps:1}]],'휜 길 1단계는 모두 흐릿한 중간에 떨어지고, 4단계면 약 90%가 장면에 닿으며, 곧은 길은 1단계로도 기준과 같아야 합니다.'],
 scales:['척도를 하나씩 더할 때 오차가 얼마나 줄고 패스가 몇 번 드는지 봅니다.',[['척도 1개',{kscale:1}],['척도 3개',{kscale:3}],['척도 5개',{kscale:5}]],'척도 1개는 전체 평균 하나로 오차 약 0.083, 3개면 0.013, 5개면 0입니다. 패스는 척도 수와 같습니다.'],
 fid:['같은 분포라도 표본 수가 적으면 FID가 0에서 얼마나 벗어나는지, 다양성을 잃으면 얼마나 커지는지 봅니다.',[['같은 분포, 50장',{fshift:0,fsigma:1,fn:50}],['같은 분포, 1만 장',{fshift:0,fsigma:1,fn:10000}],['다양성 절반, 1만 장',{fshift:0,fsigma:0.5,fn:10000}]],'50장이면 참값 0인데 평균 약 0.09에 범위가 넓고, 1만 장이면 0에 가까워야 합니다. σ=0.5는 참값 0.5를 잘 맞혀야 합니다.'],
 triage:['보고마다 원인을 겨냥하는 손잡이가 무엇인지, 아닌 선택은 왜 아닌지 봅니다.',[['같은 그림 → w 낮추기',{symptom:'samey',action:'cfg'}],['FID 500장 → ψ 바꾸기',{symptom:'fid',action:'psi'}],['느림 → 증류 플로',{symptom:'slow',action:'distill'}]],'첫째와 셋째는 원인을 겨냥한 조치, 둘째는 숫자를 믿을 수 없는 상태에서 지표를 좋아 보이게 만들 수 있어 틀린 조치로 나와야 합니다. 미리 정한 시나리오입니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A09Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
