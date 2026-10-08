/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A14Guides=(()=>{
const guides={
 validate:['모델이 만든 인자가 어느 필드에서 왜 거절되는지, 선언 밖 필드를 거절할 때와 허용할 때의 차이를 확인합니다.',[['정상 인자',{vcall:'ok',vextra:'false'}],['범위 밖 limit',{vcall:'range',vextra:'false'}],['지어낸 필드를 허용',{vcall:'extra',vextra:'true'}]],'초록 줄은 통과, 주황 줄은 거절 이유, 점선 줄은 검사를 조용히 지난 필드입니다. 거절된 인자는 오류 목록과 함께 모델에게 돌아가 다시 만들게 됩니다.'],
 fanout:['도구 수와 모델 왕복 시간이 순차·병렬 호출의 전체 시간에 각각 어떻게 들어가는지 확인합니다.',[['원본 예: 도구 3개',{fn:3,fm:500}],['모델 왕복 0ms',{fn:3,fm:0}],['도구 6개, 느린 모델',{fn:6,fm:2000}]],'순차는 도구마다 모델 왕복이 한 번씩 더 붙고, 병렬은 가장 느린 도구 하나만 기다립니다. 모델 왕복이 길수록 병렬의 이득이 커집니다.'],
 retry:['검사 후 재시도가 끝내 실패하는 비율을 얼마나 줄이는지, 통과 확률이 낮을 때는 어떤지 확인합니다.',[['통과 0.85, 한 번',{rp:0.85,rk:1}],['통과 0.85, 세 번',{rp:0.85,rk:3}],['통과 0.3, 다섯 번',{rp:0.3,rk:5}]],'막대는 시도 횟수별 누적 성공률입니다. 통과 확률이 낮으면 재시도를 늘려도 실패가 많이 남으므로 스키마나 설명을 고쳐야 합니다.'],
 lint:['도구 이름과 설명의 어느 부분이 규칙에 걸리는지, 오류와 경고가 어떻게 다른지 확인합니다.',[['좋은 초안',{ld:'good'}],['만능 도구',{ld:'monolith'}],['숨은 지시',{ld:'poisoned'}]],'오류가 하나라도 있으면 거부, 경고만 있으면 고쳐서 다시, 둘 다 없으면 등록 가능입니다.'],
 lifecycle:['요청의 결함마다 일곱 검사 중 어디서 멈추고 어떤 상태와 오류 코드로 답하는지 확인합니다.',[['정상 요청',{ldef:'ok',ltr:'http'}],['헤더와 본문 불일치',{ldef:'nameMismatch',ltr:'http'}],['미지원 버전 · stdio',{ldef:'unsupported',ltr:'stdio'}]],'멈춘 단계 아래는 모두 건너뜁니다. 먼저 걸리는 검사가 응답을 정하므로 같은 요청에 결함이 둘이면 앞쪽 검사의 코드가 나옵니다.'],
 replica:['복제본 수와 상태를 두는 곳에 따라 다음 요청이 초안을 찾을 확률이 어떻게 바뀌는지 확인합니다.',[['복제본 1개 · 메모리',{rn:1,rd:'memory'}],['복제본 4개 · 메모리',{rn:4,rd:'memory'}],['복제본 4개 · 공유 저장소',{rn:4,rd:'shared'}]],'막대 셋은 같은 복제본 수에서 세 설계를 나란히 비교합니다. 복제본이 하나일 때 통과한 시험은 상태가 숨어 있다는 사실을 가립니다.'],
 cache:['캐시 범위와 유효 시간이 적중, 남의 내용, 낡은 내용을 어떻게 바꾸는지 확인합니다.',[['public · 30초',{cs:'public',ct:30}],['private · 30초',{cs:'private',ct:30}],['private · 120초',{cs:'private',ct:120}]],'주황 줄은 남의 노트를 보여 주었거나 50초에 더한 노트를 놓친 요청입니다. 범위는 누가 보느냐를, 유효 시간은 얼마나 낡아도 되느냐를 정합니다.'],
 rebind:['다시 보낸 요청을 변조할 때 어느 검사에서 멈추는지, 노트와 nonce가 어떻게 되는지 확인합니다.',[['정상 선택',{rv:'ok'}],['인자를 바꿔 재시도',{rv:'args'}],['같은 응답 재전송',{rv:'replay'}]],'멈춘 검사 아래는 실행하지 않습니다. 노트가 지워지는 경우는 일곱 검사를 모두 통과했을 때뿐입니다.'],
 tasklife:['작업 이야기마다 호출의 resultType과 작업 status가 단계별로 어떻게 갈리는지 확인합니다.',[['보통 · 마지막 단계',{tstory:'normal',tstep:3}],['사용자 입력 · 2단계',{tstory:'input',tstep:2}],['늦은 취소 · 마지막',{tstory:'late',tstep:3}]],'각 줄은 호출 하나입니다. 가운데 굵은 글자가 작업 status이고, 오른쪽에 그 호출의 resultType이 있습니다.'],
 deadline:['진행 알림 간격과 작업 길이에 따라 요청이 완료되는지, 어느 시계에 걸리는지 확인합니다.',[['원본 예: 1.5초 작업',{dp:400,dw:1500}],['2.5초 작업',{dp:400,dw:2500}],['알림이 뜸함',{dp:600,dw:1500}]],'유휴 마감은 마지막 알림마다 뒤로 밀리고 최대 마감은 그대로입니다. 둘 중 먼저 오는 마감이 작업보다 빠르면 취소됩니다.'],
 admit:['서술자가 바뀐 방식에 따라 스캐너, 다이제스트, 이름 충돌 중 무엇이 잡는지 확인합니다.',[['그대로',{av:'ok'}],['스키마만 바뀜',{av:'rugpull'}],['무해한 경고 문장',{av:'warning'}]],'다이제스트가 고정값과 다르면 설명이 멀쩡해도 격리합니다. 스캐너 경고는 사람 검토로 보내는 신호입니다.'],
 token:['토큰의 어느 주장이 망가졌을 때 어느 검사에서 몇 번 상태로 멈추는지 확인합니다.',[['정상 · 지우기',{tv:'valid',tt:'notes_delete'}],['다른 서버 토큰',{tv:'wrongAud',tt:'notes_search'}],['범위 부족 · 지우기',{tv:'noScope',tt:'notes_delete'}]],'401은 토큰 자체가 이 서버에 맞지 않을 때, 403은 토큰은 맞지만 범위가 모자랄 때입니다.'],
 trace:['MCP 서버의 콜드 스타트와 trace 문맥 전파가 폭포 그림에서 각각 어떻게 보이는지 확인합니다.',[['평소 · 전파',{xs:'warm',xp:'on'}],['콜드 · 전파',{xs:'cold',xp:'on'}],['콜드 · 전파 없음',{xs:'cold',xp:'off'}]],'파란 막대가 MCP 서버 스팬입니다. 전파가 없으면 그 스팬이 다른 트레이스로 떨어져 주황으로 표시되고, 느린 이유가 노트 비서 쪽에서 보이지 않습니다.'],
 disclosure:['설치한 스킬 수와 문맥 창 크기에 따라 목록이 예산에 들어가는지, 점진 공개가 얼마나 아끼는지 확인합니다.',[['50개 · 200k',{sn:50,sw:'200000'}],['300개 · 128k',{sn:300,sw:'128000'}],['10개 · 32k',{sn:10,sw:'32000'}]],'목록 전체가 예산 막대보다 길면 일부 설명이 목록에서 빠집니다. 점진 공개 막대는 스킬 수가 늘어도 목록만큼만 자랍니다.'],
 routeval:['설명 판과 문턱을 바꾸며 정밀도·재현율과 출시 기준이 어떻게 움직이는지 확인합니다.',[['v1 · 문턱 0.6',{rver:'v1',rth:0.6}],['v1 · 문턱 0.75',{rver:'v1',rth:0.75}],['v2 · 문턱 0.6',{rver:'v2',rth:0.6}]],'문턱을 올리면 잘못 발동이 줄고 놓침이 늘어납니다. 설명을 고친 v2는 근접 오답의 점수를 낮춰 두 비율을 함께 올립니다.'],
 incident:['같은 보고라도 확인 순서에 따라 원인에 닿는 시간이 어떻게 달라지는지 확인합니다.',[['느린 날 · 선 위부터',{ii:'slow',io:'wire'}],['느린 날 · 시간부터',{ii:'slow',io:'time'}],['토큰 문제 · 신뢰 경계부터',{ii:'crossToken',io:'trust'}]],'초록 줄에서 원인이 드러납니다. 그 위 줄은 이상이 없던 점검이고, 아래 줄은 하지 않아도 되었던 점검입니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A14Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
