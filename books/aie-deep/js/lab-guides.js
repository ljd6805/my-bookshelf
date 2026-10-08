/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A04Guides=(()=>{
const guides={
 perceptron:['선형으로 나뉘는 게이트는 몇 번 만에 오류가 0이 되고, XOR은 왜 끝내 0이 되지 않는지 확인합니다.',[['AND 4회',{'pc-gate':'AND','pc-epochs':4}],['XOR 30회',{'pc-gate':'XOR','pc-epochs':30}],['NAND 10회',{'pc-gate':'NAND','pc-epochs':10}]],'AND·OR·NAND는 몇 회 안에 막대가 초록(오류 0)으로 바뀝니다. XOR은 30회가 되어도 주황 막대가 남고 경계선이 계속 흔들려야 정상입니다.'],
 xorforward:['은닉층과 비선형 활성화가 있어야 XOR이 풀린다는 것을 출력 네 개로 확인합니다.',[['k = 20, 시그모이드',{'xf-k':20,'xf-act':'sigmoid'}],['k = 2, 시그모이드',{'xf-k':2,'xf-act':'sigmoid'}],['k = 20, 활성화 없음',{'xf-k':20,'xf-act':'linear'}]],'k = 20 시그모이드는 출력이 0, 1, 1, 0에 붙고, k = 2에서는 0.5 근처로 뭉개집니다. 활성화를 없애면 네 출력이 똑같아져 어떤 기준으로도 XOR이 되지 않습니다.'],
 chain:['국소 기울기 세 개의 곱이 수치 미분과 같고, 출력이 포화되면 기울기가 사라지는 것을 봅니다.',[['w = 0.8',{'ch-w':0.8}],['w = 3 (포화)',{'ch-w':3}],['w = −2',{'ch-w':-2}]],'w = 3이면 a가 1에 가까워 da/dz가 작아지고 dL/dw도 0에 가깝습니다. w = −2에서는 오차가 크고 기울기가 음수여서 w를 키우는 쪽으로 갱신됩니다. 해석값과 수치값의 차이는 항상 아주 작아야 합니다.'],
 xortrain:['같은 2-2-1 망도 학습률과 시작점에 따라 배우거나 멈추는 것을 확인합니다.',[['η = 2, 시드 1',{'xt-lr':2,'xt-seed':1}],['η = 0.1, 시드 1',{'xt-lr':0.1,'xt-seed':1}],['η = 2, 시드 6',{'xt-lr':2,'xt-seed':6}]],'η = 2, 시드 1은 손실이 0 근처로 내려갑니다. η = 0.1은 1,000번으로는 너무 느리고, 시드 6은 같은 학습률에서도 손실이 0.35 근처에 멈춥니다.'],
 actcurve:['함수마다 기울기가 0에 가까워지는 구간이 어디인지 찾습니다.',[['시그모이드 z = 4',{'ac-act':'sigmoid','ac-z':4}],['ReLU z = −2',{'ac-act':'relu','ac-z':-2}],['GELU z = −0.5',{'ac-act':'gelu','ac-z':-0.5}]],'시그모이드는 z = 4에서 기울기가 0.02 이하로 떨어집니다. ReLU는 음수에서 기울기가 정확히 0이라 뉴런이 꺼지고, GELU는 작은 음수에서도 0이 아닌 기울기를 남깁니다.'],
 depthgrad:['같은 깊이에서 활성화만 바꾸면 첫 층에 도착하는 기울기가 몇 자릿수 달라지는지 봅니다.',[['시그모이드 20층',{'dg-act':'sigmoid','dg-depth':20}],['ReLU 20층',{'dg-act':'relu','dg-depth':20}],['tanh 20층',{'dg-act':'tanh','dg-depth':20}]],'시그모이드 20층은 첫 층/마지막 층 비율이 10⁻⁹ 아래로 떨어지고, ReLU는 1 근처를 유지합니다. 그래프의 기울어진 정도가 층마다 곱해지는 미분의 크기입니다.'],
 lossgrad:['확신에 찬 오답에서 두 손실이 보내는 신호의 세기를 비교합니다.',[['p = 0.02 (크게 틀림)',{'lg-p':0.02}],['p = 0.5',{'lg-p':0.5}],['p = 0.95 (거의 맞음)',{'lg-p':0.95}]],'p가 0에 가까울수록 교차 엔트로피 기울기는 −1 쪽으로 커지지만, 제곱 오차 기울기는 오히려 0으로 줄어듭니다. 거의 맞힌 p = 0.95에서는 둘 다 작습니다.'],
 valley:['같은 골짜기에서 옵티마이저와 학습률에 따라 경로가 어떻게 달라지는지 봅니다.',[['SGD η = 0.07',{'vl-opt':'sgd','vl-lr':0.07}],['SGD η = 0.09 (발산)',{'vl-opt':'sgd','vl-lr':0.09}],['모멘텀 η = 0.03',{'vl-opt':'momentum','vl-lr':0.03}],['Adam η = 0.2',{'vl-opt':'adam','vl-lr':0.2}]],'SGD 0.07은 세로로 크게 지그재그하고, 0.09는 경계(0.08)를 넘어 튕겨 나갑니다. 모멘텀은 흔들림이 줄고, Adam은 두 방향을 비슷한 보폭으로 걷습니다.'],
 schedule:['같은 최대 학습률에서 일정 모양만 바꾸었을 때 초반 안정성과 마지막 손실을 비교합니다.',[['상수 η = 1.0',{'sc-kind':'const','sc-peak':1}],['워밍업+코사인 η = 1.0',{'sc-kind':'warmcos','sc-peak':1}],['계단 η = 0.1',{'sc-kind':'step','sc-peak':0.1}]],'점선은 학습률, 실선은 손실입니다. 워밍업 일정은 처음 몇 단계 학습률이 낮게 시작합니다. 최대 학습률 1.0에서 상수 일정은 초반 손실이 1.5 넘게 튀지만, 워밍업+코사인은 0.7 근처에서 억제됩니다. 계단 0.1처럼 낮은 학습률에서는 일정 차이가 작고 마지막 손실도 높게 남습니다.'],
 depthsignal:['초기화와 활성화의 짝이 맞을 때만 깊은 층에서 신호가 유지되는지 봅니다.',[['작은 값 + tanh',{'ds-init':'small','ds-act':'tanh','ds-depth':20}],['Xavier + ReLU 50층',{'ds-init':'xavier','ds-act':'relu','ds-depth':50}],['He + ReLU 50층',{'ds-init':'he','ds-act':'relu','ds-depth':50}]],'작은 값은 몇 층 만에 0으로, 표준정규는 ReLU에서 폭발합니다. Xavier+ReLU는 층마다 조금씩 줄어 50층에서는 10⁻⁸ 수준까지 떨어지고, He+ReLU는 50층에서도 0.1~1 범위에 머뭅니다.'],
 dropout:['라벨이 섞인 작은 데이터에서 규제가 학습 정확도를 내주고 검증 정확도를 얻는지 확인합니다.',[['규제 없음',{'do-p':0,'do-wd':0}],['드롭아웃 0.3',{'do-p':0.3,'do-wd':0}],['감쇠 1.0',{'do-p':0,'do-wd':1}]],'규제가 없으면 학습 정확도 100%, 검증 손실이 위로 치솟습니다. 드롭아웃 0.3이나 감쇠 1.0에서는 학습 정확도가 내려가는 대신 격차가 줄어듭니다.'],
 autodiff:['역위상 순서로 노드를 하나씩 처리하며, 여러 경로에서 온 기울기가 더해지는 것을 봅니다.',[['a를 두 번 쓰는 식, 1단계',{'ad-expr':'reuse','ad-step':1}],['a를 두 번 쓰는 식, 완료',{'ad-expr':'reuse','ad-step':2}],['뉴런 식, 완료',{'ad-expr':'neuron','ad-step':5}]],'f = a·b + a에서 1단계 뒤 a의 기울기는 1이고, 2단계 뒤에는 b가 더해져 −2가 됩니다. 뉴런 식을 끝까지 돌리면 3장 실험의 dL/dw와 같은 값이 나옵니다.'],
 memory:['층 폭이 파라미터 수와 메모리를 어떻게 바꾸는지 계산합니다.',[['원본 레슨 크기',{'mm-h1':256,'mm-h2':128,'mm-dtype':'float32'}],['h1을 512로',{'mm-h1':512,'mm-h2':128,'mm-dtype':'float32'}],['bfloat16',{'mm-h1':256,'mm-h2':128,'mm-dtype':'bfloat16'}]],'784-256-128-10은 235,146개입니다. 첫 은닉층이 입력 784개와 연결되어 있어 h1을 두 배로 하면 파라미터도 거의 두 배가 됩니다. 자료형은 가중치 메모리만 바꾸고 Adam 학습 메모리(float32 기준) 막대는 그대로입니다.'],
 symptoms:['고장마다 손실 곡선이 남기는 서로 다른 흔적을 읽습니다.',[['정상',{'sy-bug':'none'}],['학습률 과다',{'sy-bug':'lr'}],['라벨 뒤섞임',{'sy-bug':'labels'}]],'정상은 두 곡선이 함께 내려갑니다. 학습률 과다는 실선이 크게 출렁이고, 라벨 뒤섞임은 실선만 천천히 내려가며 점선(검증)은 0.693 위로 올라갑니다.'],
 gradcheck:['수치 미분과 비교해 역전파 구현의 버그를 잡고, ε 선택의 함정을 봅니다.',[['올바름, ε = 1e-5',{'gc-eps':0.00001,'gc-bug':'none'}],['부호 버그',{'gc-eps':0.00001,'gc-bug':'sign'}],['올바름, ε = 1e-1',{'gc-eps':0.1,'gc-bug':'none'}]],'올바른 구현은 ε = 1e-5에서 상대 차이가 1e-10보다 작습니다. 부호 버그는 상대 차이가 1이 되어 바로 드러납니다. ε = 0.1은 근사 오차 때문에 올바른 구현도 일치 자릿수가 줄어듭니다.'],
 rescue:['멈춘 깊은 판별기에서 무엇을 바꾸면 앞층까지 기울기가 도착하는지 증거로 판단합니다.',[['출발 설정',{'rs-act':'sigmoid','rs-init':'small','rs-opt':'sgd'}],['활성화만 ReLU',{'rs-act':'relu','rs-init':'small','rs-opt':'sgd'}],['ReLU + He + AdamW',{'rs-act':'relu','rs-init':'he','rs-opt':'adam'}]],'출발 설정은 손실이 0.693(회색)에 붙어 있고 첫 층 기울기가 출력층의 10⁻¹⁴배 수준입니다. 활성화만 ReLU로 바꾸면 비율은 1 근처가 되지만 기울기 크기 자체가 너무 작아 여전히 멈춥니다. 활성화와 초기화를 함께 맞추면(예: tanh+Xavier) SGD로도 손실이 내려가고, ReLU+He에 AdamW까지 쓰면 거의 0까지 내려갑니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A04Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
