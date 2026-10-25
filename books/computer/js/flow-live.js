/* 움직이는 흐름 그림: "먼저 개념 잡기"의 흐름 상자(.concept-diagram .flow)를 빛나는 점이 차례로 지나가게 한다.
   상자가 실제로 차례대로 이어지는 장만 PLAN에 넣고, 장마다 무엇이 지나가는지 따로 적는다. 되돌아가는 고리는 back에
   돌아갈 상자 번호를 둔다. 스위치·비트·바이트의 단위 관계(1장)처럼 순서가 없는 그림은 넣지 않는다.
   시각적 비유이며 실험 계산과 연결하지 않는다. 동작 줄이기에서는 아무것도 붙이지 않는다. */
(function () {
  'use strict';
  const PLAN = {
    encoding: { note: '빛나는 점은 같은 바이트가 고른 약속에 따라 뜻이 되는 순서를 따라갑니다.' },
    gates: { note: '빛나는 점은 입력 두 비트가 규칙표를 거쳐 출력 비트가 되는 순서를 따라갑니다.' },
    adder: { note: '빛나는 점은 자리올림이 낮은 자리에서 높은 자리로 전해지는 순서를 따라갑니다.' },
    memory: { note: '빛나는 점은 입력 값이 클럭 순간에 저장값이 되는 순서를 따라갑니다.' },
    cpu: { note: '빛나는 점은 가져오기·해독·실행을 거친 뒤 다시 가져오기로 돌아가, CPU가 명령마다 같은 고리를 되풀이한다는 것을 보여 줍니다.', back: 0 },
    programs: { note: '빛나는 점은 JMP 0에서 처음 상자로 돌아가, 남은 횟수가 0이 될 때까지 반복한다는 것을 보여 줍니다.', back: 0 },
    cache: { note: '빛나는 점은 주소 하나가 블록과 줄 번호를 거쳐 적중 또는 실패로 판정되는 순서를 따라갑니다.' },
    final: { note: '빛나는 점은 관찰에서 가설을 거쳐 확인으로 넘어가는 조사 순서를 따라갑니다.' },
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
