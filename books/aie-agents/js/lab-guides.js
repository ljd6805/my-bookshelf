/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A15Guides=(()=>{
const guides={
 loop:['멈춤 조건이 루프를 어떻게 끝내는지 봅니다. 완료 선언이 먼저 오면 정상 종료, 턴 예산이 먼저 다하면 답 없이 멈춥니다.',[['도구 오류 · 예산 4',{'loop-scn':'error','loop-max':4}],['도구 오류 · 예산 5',{'loop-scn':'error','loop-max':5}],['반복 대본 · 예산 12',{'loop-scn':'stuck','loop-max':12}]],'“오류 관찰” 줄 다음 턴에서 인자가 고쳐지는지 보세요. 반복 대본은 예산을 늘려도 끝나지 않고 비용만 늘어납니다.'],
 tokens:['단계 수가 늘 때 두 방식의 입력 토큰이 어떻게 벌어지는지 봅니다.',[['짧은 일 3단계',{'tok-n':3}],['보통 8단계',{'tok-n':8}],['긴 일 20단계',{'tok-n':20}]],'주황 곡선이 위로 휘는 것은 기록을 매번 다시 싣기 때문입니다. 두 곡선의 비율이 단계 수와 함께 커집니다.'],
 uct:['탐색 상수 c가 “잘 아는 가설을 더 파기”와 “덜 본 가설 시험하기” 사이의 균형을 어떻게 바꾸는지 봅니다.',[['c = 0 (활용만)',{'uct-c':0}],['c = 0.3',{'uct-c':0.3}],['c = 1.4',{'uct-c':1.4}]],'막대가 가장 긴 가설이 다음에 확인할 갈래입니다. 확인 1회뿐인 C에 붙는 탐색 가산점이 c와 함께 빠르게 커집니다.'],
 reflexion:['평가 신호의 질이 재시도의 효과를 얼마나 바꾸는지 봅니다.',[['외부 판정 3회',{'ref-eval':'scalar','ref-trials':3}],['자기 평가 3회',{'ref-eval':'self','ref-trials':3}],['반성 없이 8회',{'ref-eval':'none','ref-trials':8}]],'점선(시도별 확률)이 오르는지, 실선(누적 성공)만 오르는지 구분하세요. 반성이 없으면 점선이 평평합니다.'],
 window:['창 크기와 기억 방식에 따라 마지막 질문 여섯 개에 몇 개 답하는지 봅니다.',[['창만 · 4칸',{'win-w':4,'win-mode':'window'}],['검색 · 4칸',{'win-w':4,'win-mode':'paging'}],['핵심 블록 · 4칸',{'win-w':4,'win-mode':'core'}]],'“밀려나 잊음”이 몇 줄인지, 검색으로 되찾을 때 도구 호출이 몇 번 드는지 함께 보세요.'],
 fusion:['최신도 가중치를 올리면 기억의 순위가 어떻게 뒤집히는지 봅니다.',[['원본 기본값 0.2',{'fus-rec':0.2}],['최신도 0.5',{'fus-rec':0.5}],['최신도 0',{'fus-rec':0}]],'1위가 r1(오래됐지만 관련도 높음)에서 r3(방금 생긴 변경)으로 바뀌는 지점을 찾으세요.'],
 patterns:['일의 성격에 맞는 패턴과, 원천 수가 늘 때 호출 수와 시간이 어떻게 변하는지 봅니다.',[['독립 원천 6개',{'pat-k':6,'pat-task':'independent'}],['정해진 단계 3개',{'pat-k':3,'pat-task':'known'}],['볼 원천을 모름',{'pat-k':4,'pat-task':'unknown'}]],'“맞음” 줄이 추천 패턴입니다. 연결과 병렬화는 호출 수가 같아도 시간이 다르다는 점을 확인하세요.'],
 voice:['구간 지연이 쌓여 체감 구간이 어떻게 바뀌는지 봅니다.',[['빠른 구성 · LLM 300',{'voice-llm':300,'voice-stack':'fast'}],['느린 구성 · LLM 400',{'voice-llm':400,'voice-stack':'slow'}],['느린 구성 · LLM 800',{'voice-llm':800,'voice-stack':'slow'}]],'LLM 막대 하나만이 아니라 나머지 네 구간의 합이 구성에 따라 250ms와 590ms로 달라진다는 점을 보세요.'],
 harness:['판정 규칙과 누출 거르기가 해결률을 얼마나 바꾸는지 봅니다.',[['느슨한 판정',{'har-rule':'f2p','har-filter':'all'}],['SWE-bench 판정',{'har-rule':'both','har-filter':'all'}],['판정 + 누출 제외',{'har-rule':'both','har-filter':'clean'}]],'“깨뜨림”이 0이 아닌 패치와 “누출” 표시가 붙은 패치가 각각 결과에서 어떻게 빠지는지 따라가 보세요.'],
 pve:['값싼 검사 규칙을 하나씩 켤 때 어떤 호출이 막히는지 봅니다.',[['검사 없음',{'pve-level':0}],['출처·인자 검사',{'pve-level':2}],['규칙 네 개 모두',{'pve-level':4}]],'정상 호출 c1은 늘 실행되어야 합니다. 위험한 호출 수가 4에서 0으로 줄어드는 순서를 확인하세요.'],
 scope:['범위 계약이 diff의 파일마다 어떤 판정을 내리는지 봅니다.',[['계약을 지킨 diff',{'scope-diff':'clean','scope-mode':'normal'}],['문서 섞임 · 엄격',{'scope-diff':'docs','scope-mode':'strict'}],['범위 번짐',{'scope-diff':'creep','scope-mode':'normal'}]],'금지 경로는 모드와 관계없이 차단이고, 허용 밖 경로는 모드에 따라 경고와 차단 사이를 오갑니다.'],
 gate:['게이트 검사를 켤 때마다 말뿐인 완료가 얼마나 걸러지는지 봅니다.',[['검사 없음',{'gate-level':0,'gate-mode':'normal'}],['실행·종료 확인',{'gate-level':3,'gate-mode':'normal'}],['모두 · 엄격',{'gate-level':6,'gate-mode':'strict'}]],'“못 잡음”이 남은 유형이 말뿐인 완료입니다. 엄격 모드에서 통과 수가 정말 끝난 9건과 같아집니다.'],
 rubric:['다섯 차원 점수와 판정 문턱의 관계를 봅니다.',[['고르게 좋음',{'rub-0':2,'rub-1':2,'rub-2':1,'rub-3':2,'rub-4':1}],['합계 8, 0점 하나',{'rub-0':2,'rub-1':2,'rub-2':2,'rub-3':2,'rub-4':0}],['모두 1점',{'rub-0':1,'rub-1':1,'rub-2':1,'rub-3':1,'rub-4':1}]],'합계만 보지 말고 0점 차원이 있는지 함께 보세요. 0점 하나는 다른 차원으로 메울 수 없습니다.'],
 risk:['위험 점수로 다음 실험 대상을 고르고, 검증을 마친 가정이 빠질 때 순서가 어떻게 바뀌는지 봅니다.',[['처음 상태',{'risk-tested':'none','risk-irr':4}],['안전 검증 뒤',{'risk-tested':'safety','risk-irr':4}],['되돌리기 쉬운 안전',{'risk-tested':'none','risk-irr':1}]],'“다음 실험” 줄이 지금 가장 위험한 열린 가정입니다. 되돌리기 어려움 하나만 바꿔도 순서가 바뀝니다.'],
 slice:['자격 관문이 점수보다 먼저 작동하는 모습을 봅니다.',[['사용성만',{'slice-need':'usability'}],['실현성 + 사용성',{'slice-need':'feasibility,usability'}],['안전까지',{'slice-need':'feasibility,usability,safety'}]],'점수가 가장 높은 대시보드도 필요한 증명을 빠뜨리면 “자격 없음”이 됩니다.'],
 pilot:['미리 정한 문턱으로 파일럿 결과를 판정하고 다음 행동을 정합니다.',[['정답률 0.86',{'pil-correct':0.86,'pil-median':95,'pil-writes':0}],['좋은 숫자 + 운영 쓰기',{'pil-correct':0.92,'pil-median':100,'pil-writes':1}],['통과',{'pil-correct':0.93,'pil-median':110,'pil-writes':0}]],'가드레일 줄이 “위반”이면 다른 줄이 모두 좋아도 실패입니다. 모호 판정에서 문턱을 옮기지 않는 것이 핵심입니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A15Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
