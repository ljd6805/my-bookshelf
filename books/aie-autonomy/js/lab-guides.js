/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A16Guides=(()=>{
const guides={
 chain:['단계 신뢰도 p와 단계 수 n이 끝까지 성공할 확률을 얼마나 빨리 깎는지 확인합니다.',[['p 0.99 · 70단계',{steps:70,pstep:'0.99'}],['p 0.999 · 70단계',{steps:70,pstep:'0.999'}],['p 0.99 · 200단계',{steps:200,pstep:'0.99'}]],'p 0.99에서 70단계는 49.5%, 200단계는 13.4%입니다. p를 0.999로 올리면 70단계가 93.2%가 되고 n₅₀은 69단계에서 693단계로 열 배 늘어납니다.'],
 star:['정답만 보고 거르는 STaR 고리가 지름길 풀이를 함께 키우는지, 과정 검사가 그것을 막는지 확인합니다.',[['정답만 확인',{short:0.4,rounds:8,filter:'answer'}],['과정 검사 추가',{short:0.4,rounds:8,filter:'process'}],['지름길 없음',{short:0,rounds:8,filter:'answer'}]],'지름길 0.4에서 8바퀴 돌면 분포 안 정답률은 89.1%인데 분포 밖은 36.5%에 머뭅니다. 과정 검사를 더하면 분포 밖도 88.8%로 따라 올라옵니다.'],
 evolve:['같은 진화 고리라도 평가기가 무엇을 보느냐에 따라 보고 점수와 실제 품질이 갈라지는지 확인합니다.',[['공개 테스트로만',{judge:'visible',gens:40}],['숨긴 입력',{judge:'holdout',gens:40}],['평가 코드가 저장소 안',{judge:'editable',gens:40}]],'40세대에서 공개 테스트 채점은 보고 1.965, 실제 0.435로 벌어지고, 숨긴 입력은 0.827과 0.813으로 함께 움직입니다. 평가 코드를 고칠 수 있으면 다시 1.921과 0.649로 갈라집니다.'],
 scientist:['재시도와 심사 깊이가 제출되는 논문 수와 그중 결함 있는 비율을 어떻게 바꾸는지 확인합니다.',[['재시도 0 · 얕은 심사',{retries:0,review:'shallow'}],['재시도 1 · 깊은 심사',{retries:1,review:'deep'}],['재시도 5 · 얕은 심사',{retries:5,review:'shallow'}]],'얕은 심사에서는 재시도를 늘릴수록 제출 수가 50.9에서 86.7로 늘지만 결함 비율도 40.1%에서 44.8%로 오릅니다. 깊은 심사는 재시도 1에서 51.3편, 결함 비율 20.6%로 낮춥니다.'],
 race:['능력이 주기당 10%씩 클 때 정렬 성장률이 얼마여야 격차가 벌어지지 않는지 확인합니다.',[['정렬 성장 0%',{ra:0}],['정렬 성장 5%',{ra:5}],['정렬 성장 10%',{ra:10}]],'정렬이 자라지 않으면 3주기 만에 한계를 넘고 20주기 뒤 상대 격차는 5.73입니다. 5%면 5주기째 넘고, 10%로 같아져야 격차가 0으로 머뭅니다.'],
 gates:['관문을 하나씩 켤 때 나쁜 편집이 걸러지는 수와 좋은 편집이 잘못 막히는 수를 함께 확인합니다.',[['관문 없음',{level:'0',tol:3}],['불변식 + 정렬 닻',{level:'2',tol:3}],['네 관문 · 허용치 0',{level:'4',tol:0}]],'관문이 없으면 편집 6개가 모두 들어오고 그중 4개가 나쁩니다. 네 관문을 모두 켜고 허용치 3이면 2개만 들어오고 나쁜 것은 0개지만, 허용치를 0으로 조이면 좋은 편집 1개까지 막힙니다.'],
 ladder:['권한 모드와 작업 공간을 바꾸며 하룻밤 행동 여덟 개 중 몇 번을 묻고, 위험한 행동이 몇 번 자동으로 실행되는지 확인합니다.',[['default · 실제 저장소',{mode:'default',ws:'repo'}],['auto · 실제 저장소',{mode:'auto',ws:'repo'}],['auto · 격리 컨테이너',{mode:'auto',ws:'container'}]],'default는 여섯 번 묻고 위험한 자동 실행이 1번(.env 읽기)입니다. auto는 두 번만 묻는 대신 위험 행동 3번이 자동으로 실행되어 비밀이 새는 사슬이 완성됩니다. 같은 auto라도 격리 컨테이너에서는 실제 피해로 이어지지 않습니다.'],
 inject:['공급 페이지 네 곳의 숨은 지시가 방어 조합마다 어떻게 처리되는지 확인합니다.',[['방어 없음',{defense:'none'}],['정제기만',{defense:'sanitizer'}],['읽기-쓰기 경계',{defense:'boundary'}]],'방어가 없으면 네 페이지 중 3곳의 지시가 실행됩니다. 정제기는 한 곳만 지워 2곳이 남고, 읽기-쓰기 경계는 네 곳 모두 사람에게 묻게 해 실행되는 지시가 0이 됩니다.'],
 replay:['활동 다섯 개를 마친 직후 충돌했을 때 다시 시작하는 방식에 따라 중복 부작용과 다시 낸 비용이 어떻게 달라지는지 확인합니다.',[['처음부터 다시',{crash:5,restart:'naive'}],['사건 기록으로 재생',{crash:5,restart:'replay'}],['LLM 호출 기록 안 함',{crash:5,restart:'nolog'}]],'처음부터 다시 돌리면 부작용 1건이 중복되고 LLM 비용 0.8달러를 다시 내며 사람에게 한 번 더 묻습니다. 재생은 모두 0이고, LLM 호출을 기록하지 않으면 비용을 다시 내고 이번엔 다른 답이 나와 경로가 갈라집니다.'],
 commit:['환불 하나를 제안-확정으로 처리할 때 보호 장치를 하나씩 더하면 어떤 상황이 막히는지 확인합니다.',[['충돌 · 승인만',{scenario:'crash',guard:'0'}],['잔액 변경 · 사전 조건',{scenario:'balance',guard:'2'}],['조용한 실패 · 사후 확인',{scenario:'silent',guard:'3'}]],'승인만 있으면 충돌 뒤 재시도가 환불을 두 번(60달러) 냅니다. 멱등 키부터 중복이 막히고, 잔액이 바뀐 상황은 사전 조건이 있어야 멈추며, API가 200을 주고도 반영하지 않은 실패는 사후 확인만 잡습니다.'],
 governor:['분당 지출이 다른 고리를 시간 단위가 다른 상한들이 각각 언제 끊는지 확인합니다.',[['분당 6달러 · 이달 상한만',{rate:6,layer:'month'}],['분당 6달러 · 10분 속도 제한',{rate:6,layer:'velocity'}],['분당 2달러 · 세 겹 모두',{rate:2,layer:'all'}]],'분당 6달러 고리를 이달 상한만으로 막으면 408분 뒤 2,448달러를 쓰고서야 멈춥니다. 10분 속도 제한은 9분, 54달러에서 끊습니다. 분당 2달러로 천천히 새면 속도 제한은 못 보고, 세 겹을 모두 켜야 하루 상한이 276달러에서 끊습니다.'],
 breaker:['도구 호출이 시간마다 조금씩 늘 때 EWMA 통계 경보와 시간당 30회 고정 한도 중 무엇이 먼저 울리는지 확인합니다.',[['시간당 +1회',{drift:1}],['시간당 +2회',{drift:2}],['시간당 +3회',{drift:3}]],'시간당 1회씩 늘면 새 값이 직전 EWMA보다 3.3회만 앞서므로(c/α) 6회 문턱을 넘지 못해 끝내 울리지 않고, 고정 한도가 21시간째 울립니다. 2회면 EWMA가 7시간째, 3회면 3시간째 먼저 울립니다.'],
 tiers:['같은 운영자 설정이 사례마다 어느 층에서 결정을 바꾸고, 어느 층은 끝내 넘지 못하는지 확인합니다.',[['주식 추천 · 기본',{tcase:'2',operator:'default'}],['주식 추천 · 모두 허용',{tcase:'2',operator:'unlock'}],['감사 로그 끄기 · 모두 허용',{tcase:'3',operator:'unlock'}]],'주식 추천은 3층 지침이 범위 밖으로 안내하지만, 운영자가 범위를 넓히면 답변으로 바뀝니다. 감사 로그를 끄라는 요청은 운영자가 모두 허용을 시도해도 1층 안전·감독 지원에서 거절됩니다.'],
 layers:['공격 변형마다 층을 하나씩 쌓을 때 1,000번 중 모든 층을 지나는 횟수가 어떻게 줄어드는지 확인합니다.',[['이모지 · 분류기만',{attack:'emoji',nl:1}],['이모지 · 네 겹',{attack:'emoji',nl:4}],['평문 · 네 겹',{attack:'plain',nl:4}]],'이모지 숨기기는 분류기 한 겹이면 1,000번이 모두 지나가고, 네 겹을 쌓으면 6번으로 줄어듭니다. 평문 요청은 같은 네 겹에서 0.1번입니다. 모두 층이 서로 독립이라는 가정 위의 곱입니다.'],
 horizonfit:['평가 상황의 부풀림과 요구 신뢰도에 따라 맞춘 시간 지평이 얼마나 달라지는지 확인합니다.',[['부풀림 0 · 50%',{inflate:0,level:'0.5'}],['부풀림 0 · 80%',{inflate:0,level:'0.8'}],['부풀림 10%p · 80%',{inflate:10,level:'0.8'}]],'부풀림이 없으면 50% 지평은 약 243분, 80% 지평은 약 49분으로 다섯 배 짧습니다. 성공률이 10%p 부풀면 50% 지평이 약 457분, 80% 지평이 약 120분으로 길어 보입니다.'],
 incident:['사고 세 건에 통제를 하나씩 고르고, 남는 피해와 열린 사고 수를 확인합니다.',[['아무것도 안 함',{fixcost:'none',fixinject:'none',fiximprove:'none'}],['손쉬운 조합',{fixcost:'month',fixinject:'sanitize',fiximprove:'score'}],['경로를 끊는 조합',{fixcost:'tool',fixinject:'boundary',fiximprove:'firewall'}]],'아무것도 안 하면 비용 3,600달러에 사고 세 건이 모두 열려 있습니다. 이달 상한·정제기·점수 관문 조합은 비용만 2,500달러로 줄일 뿐 세 건이 그대로 열립니다. 도구별 상한, 읽기-쓰기 경계, 평가기 방화벽을 고르면 50달러에 열린 사고 0건입니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A16Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
