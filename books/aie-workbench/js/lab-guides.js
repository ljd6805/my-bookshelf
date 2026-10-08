/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A01Guides=(()=>{
const guides={
 preflight:['선택 도구가 없을 때와 필수 도구가 없을 때 종료 코드가 어떻게 다른지 확인합니다.',[['입문, Node.js 없음',{route:'beginner',missing:'node'}],['스킬 경로, Node.js 없음',{route:'agent-skills',missing:'node'}],['기초 경로, numpy 없음',{route:'ml-foundations',missing:'numpy'}]],'같은 “Node.js 없음”이라도 입문 경로에서는 종료 코드 0, 에이전트 스킬 경로에서는 1이어야 정상입니다. 경로 표에 따른 실제 판정입니다.'],
 resolver:['전역 설치에서 나중에 깐 버전이 앞의 것을 덮어쓰는지, 가상 환경에서는 둘 다 돌아가는지 봅니다.',[['전역, 예전이 2.1 고정',{bpin:1,mode:'global'}],['전역, 예전이 2.4 고정',{bpin:4,mode:'global'}],['가상 환경, 2.1 고정',{bpin:1,mode:'separate'}]],'2.1 고정을 전역에 깔면 review-lab이 깨지고, 가상 환경으로 나누면 둘 다 정상이어야 합니다. 2.4처럼 범위가 겹칠 때만 전역 설치가 우연히 버팁니다.'],
 cuda:['빌드 CUDA가 드라이버 CUDA보다 높을 때 GPU를 못 쓰는지 확인합니다.',[['드라이버 12.1, cu124',{driver:'12.1',wheel:'12.4'}],['드라이버 12.1, cu121',{driver:'12.1',wheel:'12.1'}],['Mac, cu121 빌드',{driver:'none',wheel:'12.1'}]],'첫 예제는 GPU 사용 불가, 둘째는 가능, 셋째는 드라이버가 없어 불가로 나와야 합니다. 어느 경우든 import는 성공할 수 있다는 점에 주목하세요.'],
 branch:['main이 움직였는지에 따라 빨리 감기와 병합 커밋이 갈리는지 봅니다.',[['main 그대로',{mainc:0,expc:3}],['main에 커밋 2개',{mainc:2,expc:3}]],'main 커밋이 0이면 빨리 감기로 기록이 5줄, 2개면 병합 커밋이 더해져 8줄이어야 합니다. 그래프를 세는 실제 계산입니다.'],
 ignore:['규칙을 하나씩 더할 때 커밋 크기와 키 노출이 어떻게 줄어드는지 봅니다.',[['규칙 없음',{rules:0}],['규칙 3개',{rules:3}],['규칙 4개',{rules:4}]],'규칙 3개까지는 크기가 크게 줄지만 .env가 남아 키가 기록에 들어갑니다. 넷째 규칙에서 비로소 키가 빠져야 정상입니다.'],
 vram:['같은 7B 모델이 정밀도와 GPU 메모리에 따라 들어가는지 계산합니다.',[['7B fp16, 16GB',{params:7,bytes:2,gpumem:16}],['7B fp16, 24GB',{params:7,bytes:2,gpumem:24}],['7B 8비트, 16GB',{params:7,bytes:1,gpumem:16}]],'7B fp16은 가중치 14GB에 여유를 더해 16.8GB라 16GB에는 들어가지 않고 24GB에는 들어가야 합니다. 8비트로 줄이면 16GB에 들어갑니다.'],
 cloudcost:['끄지 않고 둔 시간이 청구액에서 차지하는 몫을 확인합니다.',[['바로 끔',{price:1,runs:6,idle:0}],['하룻밤 켜 둠',{price:1,runs:6,idle:12}],['비싼 GPU, 주말 내내',{price:2,runs:6,idle:48}]],'학습 6회는 모두 합쳐 1시간입니다. 하룻밤 켜 두면 비용의 약 92%가 유휴 시간이 되어야 합니다. 원본 가격 범위로 한 계산입니다.'],
 survive:['접속이 끊긴 뒤 학습이 살아남는 방법과 다시 붙을 수 있는 방법을 구분합니다.',[['& 배경 실행',{method:'bg'}],['nohup',{method:'nohup'}],['tmux',{method:'tmux'}]],'&는 끊김에서 끝나고, nohup은 살아남지만 로그로만 보며, tmux는 다시 붙을 수 있어야 합니다. 원본의 비교표를 따른 시나리오입니다.'],
 chmod:['권한 숫자의 각 자리가 누구의 rwx인지, 실행에 무엇이 필요한지 봅니다.',[['754, 그 밖의 사람',{own:7,grp:5,oth:4,who:'other'}],['754, 그룹 사용자',{own:7,grp:5,oth:4,who:'group'}],['644, 소유자',{own:6,grp:4,oth:4,who:'owner'}]],'754에서 그 밖의 사람은 r--라 실행이 거부되고, 그룹은 r-x라 실행됩니다. 644는 소유자에게도 실행 비트가 없습니다.'],
 layers:['바뀐 층 뒤의 모든 층이 다시 만들어지는지, 순서가 빌드 시간을 바꾸는지 봅니다.',[['코드 수정, 좋은 순서',{changed:'code',order:'good'}],['코드 수정, 나쁜 순서',{changed:'code',order:'bad'}],['PyTorch 버전 변경',{changed:'torch',order:'good'}]],'좋은 순서에서 코드 수정은 2초, 나쁜 순서에서는 pip 층까지 422초가 걸려야 합니다. 캐시 규칙은 실제 계산, 층별 시간은 가정값입니다.'],
 leak:['키가 Git 기록에 들어가는 조건과 공개 범위가 함께 위험을 정하는지 봅니다.',[['.env 무시 안 함, 공개',{store:'tracked',repo:'public'}],['.env 무시함, 공개',{store:'envignored',repo:'public'}],['코드에 적음, 비공개',{store:'literal',repo:'private'}]],'첫 예제는 위험 높음, 둘째는 없음, 셋째는 중간이어야 합니다. 공개 저장소라도 기록에 키가 없으면 위험이 없습니다.'],
 kernel:['실행 순서와 지운 셀 때문에 지금 커널의 결과가 재현되지 않는 경우를 찾습니다.',[['셀 2를 두 번',{seq:'twice'}],['3부터 실행',{seq:'early'}],['셀 2 삭제',{seq:'deleted'}]],'셀 2를 두 번 실행하면 지금 커널은 y = 30, 재시작 후에는 20이어야 합니다. 셀 2를 지우면 지금은 20, 재시작 후에는 10입니다.'],
 split:['같은 시드는 같은 분할을, 다른 시드는 평가 세트에 옛 훈련 리뷰를 섞는지 봅니다.',[['같은 시드 42',{rows:1000,seed:42}],['시드 7로 다시',{rows:1000,seed:7}],['큰 데이터, 시드 2024',{rows:5000,seed:2024}]],'시드 42는 누수 0개, 시드 7은 평가 200개 중 절반 넘게 옛 훈련 리뷰여야 합니다. 실제로 섞어 센 결과입니다.'],
 profile:['일꾼을 늘리면 병목이 로딩에서 계산으로 옮겨 가는지 확인합니다.',[['일꾼 0명',{workers:0}],['일꾼 1명',{workers:1}],['일꾼 2명',{workers:2}]],'0명이면 한 단계 100ms, 1명이면 60ms, 2명이면 40ms로 계산이 병목이 되어야 합니다. 그 뒤로는 일꾼을 늘려도 줄지 않습니다.'],
 curve:['학습률이 |1 − 2η| < 1의 경계를 넘을 때 곡선이 어떻게 바뀌는지 봅니다.',[['적당히 0.25',{lr:0.25}],['출렁임 0.85',{lr:0.85}],['폭발 1.2',{lr:1.2}]],'0.25는 빠르게 내려가고, 0.85는 부호가 바뀌며 천천히 내려가며, 1.2는 손실이 커져 7단계에서 조건부 중단점이 걸려야 합니다.'],
 triage:['같은 보고라도 확인 순서에 따라 원인까지 걸리는 시간이 달라지는지 비교합니다.',[['99%, 아래층부터',{scenario:'acc99',strategy:'bottom'}],['99%, 증상부터',{scenario:'acc99',strategy:'symptom'}],['느림, 손실 곡선부터',{scenario:'slow',strategy:'top'}]],'정확도 99% 보고는 아래층부터 하면 26분, 증상부터 하면 10분이어야 합니다. 시간은 가정값이며 순서의 차이를 보는 시나리오입니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A01Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
