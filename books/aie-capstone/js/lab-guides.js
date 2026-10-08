/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A20Guides=(()=>{
const guides={
 retry:['시도 횟수와 시간 초과 길이가 성공률과 꼬리 지연을 어떻게 맞바꾸는지 확인합니다.',[['3번 · 5초',{'rt-p':0.2,'rt-n':3,'rt-to':5}],['5번으로 늘리기',{'rt-p':0.2,'rt-n':5,'rt-to':5}],['시간 초과 2초',{'rt-p':0.2,'rt-n':3,'rt-to':2}]],'시도를 늘리면 성공률은 조금 오르지만 최악 지연은 시간 초과와 대기가 더해져 크게 늘어납니다. p95와 최악 지연을 사용자가 기다릴 수 있는 시간과 비교하세요.'],
 replan:['걸음 예산과 재계획 상한이 완료·중단·넘겨주기 확률을 어떻게 나누는지 봅니다.',[['실패율 0.1 · 예산 12',{'rp-p':0.1,'rp-max':12}],['실패율 0.1 · 예산 17',{'rp-p':0.1,'rp-max':17}],['실패율 0.2 · 예산 40',{'rp-p':0.2,'rp-max':40}]],'곡선이 계단 모양인 것은 재계획 한 번이 3걸음을 끼워 넣기 때문입니다. 예산을 늘려도 남는 몫은 재계획 상한에 걸린 중단입니다.'],
 passk:['비편향 pass@k와 단순 추정의 차이, 그리고 통과 한 건당 비용을 확인합니다.',[['c 3 · k 5',{'pk-c':3,'pk-k':5}],['c 2 · k 8',{'pk-c':2,'pk-k':8}],['c 9 · k 1',{'pk-c':9,'pk-k':1}]],'시도 10번 안에서 통과가 드물수록 단순 추정이 비편향 추정보다 낮게 나오고, k가 n−c보다 크면 비편향 추정은 1이 됩니다. 차례로 시도하면 통과 한 건당 비용은 k와 상관없이 같습니다.'],
 tailsample:['성공 응답 보관률이 보관량과 결함 발견 시간을 어떻게 맞바꾸는지 봅니다.',[['10만 · 10%',{'ts-day':100000,'ts-keep':10,'ts-err':2}],['10만 · 21%',{'ts-day':100000,'ts-keep':21,'ts-err':2}],['100만 · 2%',{'ts-day':1000000,'ts-keep':2,'ts-err':2}]],'보관률을 두 배로 하면 보관량도 거의 두 배가 되지만 발견 시간은 절반이 됩니다. 요청이 많은 서비스는 낮은 보관률로도 같은 발견 속도를 얻습니다.'],
 teamcost:['역할 팀이 단일 에이전트보다 싸게 풀려면 해결률이 얼마여야 하는지 계산합니다.',[['역할 4 · 해결률 0.9',{'tc-roles':4,'tc-team':0.9,'tc-single':0.25}],['역할 2 · 해결률 0.6',{'tc-roles':2,'tc-team':0.6,'tc-single':0.25}],['단일 0.1 · 역할 3',{'tc-roles':3,'tc-team':0.4,'tc-single':0.1}]],'손익분기 해결률은 역할 수 × 단일 해결률입니다. 이 값이 1 이상이면 팀은 모든 문제를 풀어도 해결당 비용에서 이기지 못합니다.'],
 ucb:['탐험 가중치 c가 좋은 갈래에 예산을 몰아주는 일과 덜 해 본 갈래를 확인하는 일을 어떻게 나누는지 봅니다.',[['c 0 (탐욕)',{'ucb-c':0,'ucb-b':30}],['c 1.4',{'ucb-c':1.4,'ucb-b':30}],['c 3 · 예산 60',{'ucb-c':3,'ucb-b':60}]],'c가 작으면 처음 좋아 보인 갈래에 몰리고, 크면 실행이 고르게 퍼져 후회가 커집니다. 논문 신호는 실행 횟수가 적을 때 운으로도 나온다는 점을 함께 보세요.'],
 gptparams:['층 수와 폭, 가중치 묶기가 매개변수와 메모리를 어디서 늘리는지 확인합니다.',[['124M 설정',{'gp-L':12,'gp-d':768,'gp-tie':1}],['출력층 따로',{'gp-L':12,'gp-d':768,'gp-tie':0}],['폭 1600 · 48층',{'gp-L':48,'gp-d':1600,'gp-tie':1}]],'블록 매개변수는 폭의 제곱으로 늘어 폭을 두 배로 하면 약 네 배가 됩니다. 작은 모델일수록 임베딩이 전체에서 차지하는 몫이 큽니다.'],
 dpo:['β가 선호 응답의 확률과 기준 정책으로부터의 거리를 어떻게 함께 움직이는지 봅니다.',[['β 1 · Δr 1',{'dpo-beta':1,'dpo-dr':1}],['β 0.1',{'dpo-beta':0.1,'dpo-dr':1}],['β 2',{'dpo-beta':2,'dpo-dr':1}]],'β를 줄이면 같은 보상 차이로도 정책이 한쪽 답으로 쏠리고 KL이 ln 2에 가까워집니다. 선호 라벨이 틀렸다면 그 오류도 같은 세기로 밀립니다.'],
 zero:['ZeRO 단계와 장비 수가 장비 하나의 메모리와 통신을 어떻게 바꾸는지 계산합니다.',[['7B · 8대 · ZeRO-1',{'z-model':7,'z-n':8,'z-stage':'z1'}],['7B · 2대 · ZeRO-1',{'z-model':7,'z-n':2,'z-stage':'z1'}],['70B · 64대 · ZeRO-3',{'z-model':70,'z-n':64,'z-stage':'z3'}]],'ZeRO-1과 2는 통신량을 DDP와 같게 두고 메모리를 줄이고, ZeRO-3은 가장 많이 줄이는 대신 가중치를 모으느라 통신이 약 1.5배가 됩니다.'],
 bubble:['단계 수와 마이크로배치 수가 쉬는 칸과 활성값 메모리를 어떻게 맞바꾸는지 봅니다.',[['단계 4 · M 8',{'bb-s':4,'bb-m':8}],['단계 4 · M 64',{'bb-s':4,'bb-m':64}],['단계 8 · M 64',{'bb-s':8,'bb-m':64}]],'마이크로배치를 늘리면 거품은 줄지만 GPipe가 들고 있어야 하는 활성값은 그만큼 늘어납니다. 1F1B는 활성값을 단계 수로 묶어 둡니다.'],
 ragmetrics:['같은 질문에서 파이프라인과 k에 따라 검색 지표와 문맥 토큰이 어떻게 달라지는지 봅니다.',[['기본 · k 5',{'rg-run':'base','rg-k':5}],['하이브리드 · k 6',{'rg-run':'hybrid','rg-k':6}],['재순위 · k 3',{'rg-run':'rerank','rg-k':3}]],'재현율 1을 얻는 데 기본 검색은 10조각, 하이브리드는 6조각, 재순위는 3조각이 듭니다. 순위를 고치면 같은 근거를 더 적은 문맥으로 넣을 수 있습니다.'],
 patches:['해상도와 패치 크기가 패치 토큰과 어텐션 쌍을 몇 배로 바꾸는지 확인합니다.',[['224 · 16',{'pt-side':224,'pt-p':16}],['448 · 16',{'pt-side':448,'pt-p':16}],['448 · 32',{'pt-side':448,'pt-p':32}]],'한 변을 두 배로 하면 패치는 네 배, 자기 어텐션 쌍은 약 열여섯 배가 됩니다. 패치를 키우면 토큰은 돌아오지만 세부가 뭉개집니다.'],
 bootstrap:['과제 수에 따라 95% 구간의 폭과 판정이 어떻게 달라지는지 봅니다.',[['50개 · 차이 0.02',{'bs-n':50,'bs-gap':0.02}],['200개 · 차이 0.02',{'bs-n':200,'bs-gap':0.02}],['800개 · 차이 0',{'bs-n':800,'bs-gap':0}]],'굵은 줄이 지금 과제 수의 구간입니다. 파란 줄은 0을 포함해 판정을 보류한 것이고, 강조색 줄은 0을 지나지 않아 판정이 난 것입니다. 지금 과제 수의 판정은 결과 문장에 글로도 적혀 있습니다.'],
 gate:['차단 문턱이 탐지율·오탐률과, 기저율을 만난 차단의 정밀도를 어떻게 바꾸는지 계산합니다.',[['문턱 0.6 · 1%',{'gt-thr':0.6,'gt-base':0.01}],['문턱 0.9 · 1%',{'gt-thr':0.9,'gt-base':0.01}],['문턱 0.7 · 10%',{'gt-thr':0.7,'gt-base':0.1}]],'공격이 드물수록 같은 오탐률이 만드는 정상 차단이 공격 차단보다 많아집니다. 기저율을 10%로 올려 정밀도가 어떻게 바뀌는지 비교하세요.'],
 launch:['다섯 손잡이를 함께 움직여 사용량이 두 배가 된 달의 다섯 목표를 동시에 지키는 조합을 찾습니다.',[['지금 설정',{'ln-k':3,'ln-mode':'seq','ln-ctx':10,'ln-thr':0.7,'ln-out':0}],['병렬 3번',{'ln-k':3,'ln-mode':'par','ln-ctx':10,'ln-thr':0.7,'ln-out':0}],['조각 5개 · 최대 2번',{'ln-k':2,'ln-mode':'seq','ln-ctx':5,'ln-thr':0.7,'ln-out':0}]],'막대가 1 이하이면 그 줄을 지킨 것입니다. 한 줄을 고치면 다른 줄이 넘어가는 짝, 예를 들어 문턱과 막지 못한 공격의 짝을 찾고, 그 짝을 풀어 줄 다른 손잡이를 고르세요.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A20Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
