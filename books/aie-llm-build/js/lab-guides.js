/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A11Guides=(()=>{
const guides={
 bpe:['병합을 거듭할수록 토큰이 줄고, 병합표를 배운 언어가 다른 언어를 자르는 비용을 정한다는 것을 확인합니다.',[['병합 0회',{'bpe-merges':0}],['한국어 표 60회',{'bpe-corpus':'ko','bpe-merges':60,'bpe-probe':'ko'}],['영어 표로 한국어 읽기',{'bpe-corpus':'en','bpe-merges':60,'bpe-probe':'ko'}]],'병합 0회에서는 시험 문장의 바이트 수와 토큰 수가 같습니다. 한국어 표는 같은 문장을 훨씬 적은 토큰으로 자르지만, 영어 표는 한국어 바이트를 거의 합치지 못해 바이트 수에 가까운 토큰이 나옵니다.'],
 minhash:['서명 길이 k가 MinHash 추정의 오차를, 띠의 행 수 r이 후보로 잡히는 문턱을 어떻게 바꾸는지 봅니다.',[['사본 · k = 16',{'mh-pair':'ab','mh-k':16}],['사본 · k = 256',{'mh-pair':'ab','mh-k':256}],['다른 글 · r = 8',{'mh-pair':'ac','mh-k':128,'mh-rows':8}]],'k를 늘리면 파란 점(추정)이 주황 점(참값)에 가까워집니다. r을 키우면 곡선이 오른쪽으로 가팔라져 유사도가 낮은 쌍은 거의 후보가 되지 않습니다.'],
 packing:['같은 문서 묶음을 패딩과 패킹으로 담을 때 빈자리가 얼마나 다른지 학습 길이별로 비교합니다.',[['L = 512',{'pk-L':512}],['L = 4,096',{'pk-L':4096}]],'학습 길이가 길수록 패딩의 활용률은 크게 떨어지지만, 패킹은 마지막 시퀀스의 빈칸만 남아 훨씬 높게 유지됩니다. 두 막대의 차이가 GPU가 빈칸에 쓰는 계산입니다.'],
 nextchar:['학습률이 손실 곡선의 모양을 어떻게 바꾸고, 왜 바닥 아래로는 내려가지 못하는지 확인합니다.',[['학습률 5',{'nc-lr':5,'nc-steps':400}],['학습률 20',{'nc-lr':20,'nc-steps':400}],['학습률 100',{'nc-lr':100,'nc-steps':400}]],'5는 400번이 지나도 바닥에서 멀고, 20은 바닥에 거의 닿습니다. 100은 곡선이 흔들리며 오히려 더 높은 곳에서 멈춥니다. 어느 경우든 주황 점선 아래로는 가지 않습니다.'],
 chinchilla:['같은 계산량에서 모델을 키운 선택과 데이터를 늘린 선택의 손실을 Chinchilla 식으로 비교합니다.',[['Gopher의 선택',{'cc-budget':'5.04e23','cc-logn':11.45}],['Chinchilla의 선택',{'cc-budget':'5.88e23','cc-logn':10.85}]],'Gopher는 280B 모델에 파라미터당 1토큰 남짓을 주어 식의 최솟값(노란 점)에서 왼쪽 위로 멀리 떨어져 있습니다. Chinchilla는 70B에 파라미터당 20토큰을 주어 최솟값 근처에 있습니다.'],
 trainmem:['모델 크기, ZeRO 단계, GPU 수가 GPU 한 장의 학습 메모리를 어떻게 바꾸는지 봅니다.',[['7.5B · ZeRO 3 · 64장',{'tm-model':'7.5','tm-stage':3,'tm-gpus':64}],['8B · 복제 · 8장',{'tm-model':'8','tm-stage':0,'tm-gpus':8}],['70B · ZeRO 3 · 16장',{'tm-model':'70','tm-stage':3,'tm-gpus':16}]],'복제 방식에서는 GPU를 늘려도 장당 메모리가 그대로입니다. ZeRO 3단계는 세 몫을 모두 N으로 나누므로 GPU 수에 반비례해 줄어듭니다.'],
 ckpt:['활성값을 버리고 다시 계산하는 방식에 따라 메모리와 추가 계산이 어떻게 맞바뀌는지 봅니다.',[['선택적 · 8,192',{'ck-mode':'selective','ck-seq':8192}],['선택적 · 2,048',{'ck-mode':'selective','ck-seq':2048}],['전체 · k = 8',{'ck-mode':'full','ck-k':8}]],'긴 시퀀스일수록 제곱으로 크는 어텐션 항만 버리는 선택적 재계산의 효과가 큽니다. 전체 재계산은 메모리를 가장 많이 줄이지만 순전파를 한 번 더 하는 만큼 계산이 늘어납니다.'],
 bubble:['파이프라인 단계 수와 마이크로배치 수가 기다리는 시간(거품)을 어떻게 정하는지 봅니다.',[['P = 4, M = 1',{'pp-p':4,'pp-m':1}],['P = 4, M = 16',{'pp-p':4,'pp-m':16}],['P = 8, M = 16',{'pp-p':8,'pp-m':16}]],'마이크로배치가 하나면 GPU 네 장 중 한 번에 한 장만 일해 거품이 75%입니다. M을 늘리면 거품이 크게 줄고, P를 늘리면 다시 커집니다.'],
 lossmask:['손실을 어떤 토큰에서 세고 무엇으로 나누는지에 따라 같은 응답의 학습 신호가 달라지는 것을 봅니다.',[['지시문 0토큰',{'sft-prompt':0}],['지시문 60 · 모든 토큰',{'sft-prompt':60,'sft-mode':'all'}],['지시문 60 · 응답만',{'sft-prompt':60,'sft-mode':'resp'}]],'지시문이 없으면 세 방식이 같습니다. 지시문이 길어지면 모든 토큰 평균은 지시문 손실에 끌려가고, 응답 ÷ 전체 길이는 작아지지만, 응답만 세는 방식은 그대로입니다.'],
 dpo:['로그확률 비율의 차이 m과 β가 DPO 손실과 기울기 크기를 어떻게 정하는지 봅니다.',[['m = 0, β = 0.1',{'dpo-m':0,'dpo-beta':0.1}],['m = 2, β = 0.1',{'dpo-m':2,'dpo-beta':0.1}],['m = 2, β = 0.5',{'dpo-m':2,'dpo-beta':0.5}]],'m = 0에서는 β와 관계없이 손실이 ln 2입니다. β가 크면 m이 커질 때 손실이 더 빨리 떨어지고 기울기의 무게 σ(−β·m)도 더 빨리 0으로 갑니다. 다만 m = 2처럼 m이 작을 때는 앞에 곱한 β 때문에 기울기 크기가 오히려 큽니다.'],
 grpo:['집단 크기와 정답률이 "모든 답이 같은 점수라 배울 것이 없는 집단"의 확률을 어떻게 바꾸는지 봅니다.',[['G = 16, p = 0.1',{'gr-g':16,'gr-p':0.1}],['G = 8, p = 0.1',{'gr-g':8,'gr-p':0.1}],['G = 16, p = 0.95',{'gr-g':16,'gr-p':0.95}]],'정답률이 0이나 1에 가까울수록 신호 없는 집단이 많아집니다. 집단을 키우면 그 확률이 줄지만 질문마다 뽑는 비용이 늘어납니다.'],
 elo:['K와 경기 수가 ELO 점수의 수렴 속도와 흔들림을 어떻게 바꾸는지 봅니다.',[['30경기',{'elo-games':30}],['K = 64, 1,000경기',{'elo-k':64,'elo-games':1000}],['K = 8, 1,000경기',{'elo-k':8,'elo-games':1000}]],'30경기로는 순서가 뒤바뀌기 쉽습니다. K가 크면 빨리 움직이지만 끝까지 크게 흔들리고, K가 작으면 느리지만 차분하게 자리를 잡습니다.'],
 quant:['같은 비트 수에서도 배율을 텐서 하나로 둘지 행마다 둘지에 따라 오차가 크게 달라지는 것을 봅니다.',[['4비트 · 텐서',{'q-bits':4,'q-gran':'tensor'}],['4비트 · 채널',{'q-bits':4,'q-gran':'channel'}],['8비트 · 채널',{'q-bits':8,'q-gran':'channel'}]],'텐서 하나의 배율은 이상치 행이 정하므로 보통 행의 작은 값이 몇 단계에 몰려 오차가 커집니다. 행마다 배율을 두면 같은 4비트에서 신호 대 잡음비가 10dB 가까이 오릅니다.'],
 specdec:['수락률 α와 초안 길이 N이 검증당 토큰 수와 실제 속도 향상을 어떻게 정하는지 봅니다.',[['α = 0.6, N = 5',{'sd-alpha':0.6,'sd-n':5}],['α = 0.9, N = 5',{'sd-alpha':0.9,'sd-n':5}],['α = 0.85, N = 1',{'sd-alpha':0.85,'sd-n':1,'sd-c':0.05}]],'α가 높으면 같은 N에서 훨씬 많은 토큰을 얻습니다. N을 무작정 늘리면 초안 비용이 커져 속도 향상이 꺾이므로 노란 점이 가장 좋은 N입니다.'],
 config:['공개 config의 숫자만으로 전체·활성 파라미터와 KV 캐시를 계산해 모델을 비교합니다.',[['Llama 3 8B · 128K',{'cf-model':'llama3','cf-ctx':131072}],['DeepSeek-V3 · 128K',{'cf-model':'deepseek','cf-ctx':131072}],['Jamba · 256K',{'cf-model':'jamba','cf-ctx':262144}]],'DeepSeek-V3는 가중치가 훨씬 크지만 MLA 덕분에 KV 캐시는 Llama 3 8B보다 작습니다. Jamba는 어텐션 층이 적어 긴 문맥에서도 KV 캐시가 작게 유지됩니다.'],
 rollback:['실패한 단계에 따라 다시 해야 할 범위와 시간이 얼마나 다른지 의존 그래프로 계산합니다.',[['SFT 실패',{'rb-stage':'sft'}],['DPO 실패',{'rb-stage':'dpo'}],['양자화 실패',{'rb-stage':'quant'}]],'SFT를 바꾸면 그 아래 정렬·평가·서빙이 모두 무효가 됩니다. DPO는 보상 모델을 재사용하고, 양자화는 서빙 설정만 함께 다시 하면 됩니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A11Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
