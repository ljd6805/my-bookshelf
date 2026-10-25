/* 움직이는 흐름 그림: "먼저 개념 잡기"의 흐름 상자(.concept-diagram .flow)에 책의 따라갈 양(빛나는 점)이 첫 상자에서 끝 상자까지
   차례로 지나가는 움직임을 붙인다. 장을 열 때 한 번, 같은 장의 실험 값을 바꿀 때마다 다시 흐른다.
   시각적 비유이며 계산은 아니다. 동작 줄이기에서는 움직이지 않고 모든 상자를 그대로 보여 준다(CSS). */
(function () {
  'use strict';
  const NOTE = '빛나는 점은 숫자로 바뀐 입력이 첫 상자에서 마지막 상자까지 거쳐 가는 순서를 보여 줍니다.';
  const main = document.querySelector('main');
  if (!main) return;
  let timer = 0;

  function replay(fig) {
    const flow = fig.querySelector('.flow');
    flow.classList.remove('flow-run');
    void flow.offsetWidth; // 같은 애니메이션을 처음부터 다시 시작하게 한다.
    flow.classList.add('flow-run');
  }

  function enhance() {
    const fig = main.querySelector('.concept-diagram:not([data-flow-live])');
    if (!fig || !fig.querySelector('.flow')) return;
    fig.dataset.flowLive = '1';
    const boxes = [...fig.querySelectorAll('.flow > div')];
    boxes.forEach((box, i) => box.style.setProperty('--i', i));
    fig.querySelector('.flow').style.setProperty('--n', boxes.length);
    const cap = fig.querySelector('figcaption');
    if (cap) {
      cap.insertAdjacentHTML('beforeend', ` <span class="flow-note">${NOTE} 아래 실험의 값을 바꾸면 다시 지나갑니다.</span> <button type="button" class="flow-replay">흐름 다시 보기</button>`);
      cap.querySelector('.flow-replay').addEventListener('click', () => replay(fig));
    }
    replay(fig);
  }

  // 실험 입력이 바뀌면 잠시 뒤 한 번만 다시 흐르게 한다(슬라이더를 끄는 동안 계속 다시 시작하지 않도록).
  main.addEventListener('input', (e) => {
    if (!e.target.closest('.lab')) return;
    clearTimeout(timer);
    timer = setTimeout(() => { const fig = main.querySelector('.concept-diagram[data-flow-live]'); if (fig) replay(fig); }, 450);
  });
  new MutationObserver(enhance).observe(main, { childList: true });
  enhance();
})();
