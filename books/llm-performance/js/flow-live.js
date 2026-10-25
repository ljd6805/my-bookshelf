/* 움직이는 흐름 그림: "먼저 개념 잡기"의 흐름 상자(.concept-diagram .flow)를 빛나는 점이 차례로 지나가게 한다.
   상자가 실제로 차례대로 이어지는 장만 PLAN에 넣고, 장마다 무엇이 지나가는지 따로 적는다. 되돌아가는 고리는 back에
   돌아갈 상자 번호를 둔다. 동시에 일어나는 일이나 계층을 나타낸 그림(3장 타임라인, 4장 grid에서 thread까지, 6장 타일 크기와 자원)에는 넣지 않는다.
   시각적 비유이며 실험 계산과 연결하지 않는다. 동작 줄이기에서는 아무것도 붙이지 않는다. */
(function () {
  'use strict';
  const PLAN = {
    metrics: { note: '빛나는 점은 요청 하나가 시작해 첫 토큰과 다음 토큰들을 거쳐 마지막 토큰에 이르는 순서를 따라갑니다.' },
    timing: { note: '빛나는 점은 워밍업과 동기화를 거쳐 구간을 재고 완료를 확인하는 측정 순서를 따라갑니다.' },
    coalescing: { note: '빛나는 점은 lane 번호에서 주소를 계산하고 sector로 묶어 효율을 계산하는 순서를 따라갑니다.' },
    evidence: { note: '빛나는 점은 범위를 고정한 뒤 일의 양과 시간을 재고 근거를 대조하는 순서를 따라갑니다.' },
    fusion: { note: '빛나는 점은 입력을 한 번 읽어 중간 계산과 활성화를 거친 뒤 출력만 쓰는 순서를 따라갑니다.' },
    paging: { note: '빛나는 점은 요청의 논리 토큰이 블록 표를 거쳐 물리 KV 블록을 받고, 끝나면 블록을 돌려주는 순서를 따라갑니다.' },
    batching: { note: '빛나는 점은 다음 단계에서 실행 슬롯으로 돌아가, 스케줄러가 자리가 빌 때마다 새 요청을 넣는 고리를 보여 줍니다.', back: 1 },
    parallel: { note: '빛나는 점은 나눈 계산 시간에 통신·동기화 시간이 더해져 전체 시간이 되는 순서를 따라갑니다.' },
    review: { note: '빛나는 점은 판정 기록 뒤 다시 같은 기준으로 돌아가, 개선안마다 같은 검증 고리를 거친다는 것을 보여 줍니다.', back: 0 },
  };
  const main = document.querySelector('main');
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!main || still) return; // 동작 줄이기에서는 움직임도 안내문도 붙이지 않고 원래 그림만 둔다.
  const TAIL = '움직임은 순서를 보여 주는 시각적 비유이며 아래 실험의 계산과 연결되어 있지 않습니다.';

  function replay(flow) {
    flow.classList.remove('flow-run');
    void flow.offsetWidth; // 같은 애니메이션을 처음부터 다시 시작하게 한다.
    flow.classList.add('flow-run');
  }

  function enhance() {
    const fig = main.querySelector('.concept-diagram:not([data-flow-live])');
    const plan = PLAN[location.hash.slice(1)];
    if (!fig || !plan || !fig.querySelector('.flow')) return;
    fig.dataset.flowLive = '1';
    const flow = fig.querySelector('.flow'), boxes = [...flow.children];
    boxes.forEach((box, i) => box.style.setProperty('--i', i));
    flow.style.setProperty('--n', boxes.length);
    if (plan.back !== undefined) boxes[plan.back].classList.add('flow-back');
    const cap = fig.querySelector('figcaption');
    if (cap) {
      cap.insertAdjacentHTML('beforeend', ` <span class="flow-note">${plan.note} ${TAIL}</span> <button type="button" class="flow-replay">흐름 다시 보기</button>`);
      cap.querySelector('.flow-replay').addEventListener('click', () => replay(flow));
    }
    replay(flow);
  }

  new MutationObserver(enhance).observe(main, { childList: true });
  enhance();
})();
