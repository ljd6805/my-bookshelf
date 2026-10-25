/* 움직이는 흐름 그림: "먼저 개념 잡기"의 흐름 상자(.concept-diagram .flow)를 빛나는 점이 차례로 지나가게 한다.
   상자가 실제로 차례대로 이어지는 장만 PLAN에 넣고, 장마다 무엇이 지나가는지 따로 적는다. 되돌아가는 고리는 back에
   돌아갈 상자 번호를 둔다. 개별 수치를 나란히 놓은 비교 그림(2장 자료 바꾸기, 6장 표본 안과 밖, 7장 주문 요청의 항목)에는 넣지 않는다.
   시각적 비유이며 실험 계산과 연결하지 않는다. 동작 줄이기에서는 아무것도 붙이지 않는다. */
(function () {
  'use strict';
  const PLAN = {
    backtest: { note: '빛나는 점은 규칙과 자료가 가정을 거쳐 수익률이라는 출력이 되는 순서를 따라갑니다.' },
    lookahead: { note: '빛나는 점은 미래 정보를 쓴 줄을 찾아 고치고 다시 계산한 결과에 이르는 순서를 따라갑니다.' },
    fills: { note: '빛나는 점은 체결 가정과 비용을 하나씩 현실에 가깝게 바꿀 때마다 수익률이 줄어드는 순서를 따라갑니다.' },
    metrics: { note: '빛나는 점은 수익 곡선에서 흩어짐과 낙폭을 잰 뒤 다시 뽑아 구간을 내는 순서를 따라갑니다.' },
    orders: { note: '빛나는 점은 주문 하나가 접수에서 부분 체결과 취소를 거쳐 대사에 이르는 순서를 따라갑니다.' },
    limits: { note: '빛나는 점은 같은 칸 요청이 거듭 보내진 뒤 다음 날 아침 대사에서 드러나기까지의 사건 순서를 따라갑니다.' },
    monitor: { note: '빛나는 점은 같은 기간의 두 기록을 짝지은 뒤 체결률과 누적 차이를 내는 순서를 따라갑니다.' },
    final: { note: '빛나는 점은 단단한 증거부터 손실 원인을 찾고 원인 금액의 합을 확인하는 순서를 따라갑니다.' },
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
