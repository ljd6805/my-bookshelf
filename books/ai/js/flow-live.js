/* 움직이는 흐름 그림: "먼저 개념 잡기"의 흐름 상자(.concept-diagram .flow)를 빛나는 점이 차례로 지나가게 한다.
   상자가 실제로 차례대로 이어지는 장만 PLAN에 넣고, 장마다 무엇이 지나가는지 따로 적는다. 되돌아가는 고리는 back에
   돌아갈 상자 번호를 둔다. 세 데이터 나누기(3장)·메모리 구성(10장)처럼 순서가 없는 그림은 넣지 않는다.
   시각적 비유이며 실험 계산과 연결하지 않는다. 동작 줄이기에서는 아무것도 붙이지 않는다. */
(function () {
  'use strict';
  const PLAN = {
    neuron: { note: '빛나는 점은 입력 x가 가중합을 거쳐 출력 y가 되는 순서를 따라갑니다.' },
    learning: { note: '빛나는 점은 예측에서 갱신까지 간 뒤 예측으로 돌아가, 학습이 같은 고리를 되풀이한다는 것을 보여 줍니다.', back: 0 },
    tokens: { note: '빛나는 점은 문장 하나가 토큰과 ID를 거쳐 벡터가 되는 순서를 따라갑니다.' },
    embeddings: { note: '빛나는 점은 문장이나 이미지가 벡터로 바뀐 뒤 비교되는 순서를 따라갑니다.' },
    attention: { note: '빛나는 점은 Q·K 점수가 가중치를 거쳐 V의 가중합이 되는 순서를 따라갑니다.' },
    generation: { note: '빛나는 점은 모델 점수에서 다음 토큰 하나를 고르기까지의 순서를 따라갑니다.' },
    vision: { note: '빛나는 점은 픽셀 값이 커널 연산을 거쳐 특징 맵이 되는 순서를 따라갑니다.' },
    alignment: { note: '빛나는 점은 모델이 거치는 학습 단계의 순서를 따라갑니다.' },
    rag: { note: '빛나는 점은 문서를 준비한 뒤 질문 하나가 답과 출처가 되기까지의 순서를 따라갑니다.' },
    agents: { note: '빛나는 점은 종료 판단에서 다시 행동으로 돌아가, 에이전트가 끝낼 때까지 고리를 되풀이한다는 것을 보여 줍니다.', back: 1 },
    final: { note: '빛나는 점은 센서 경보에서 점검 기록까지 도우미가 일하는 순서를 따라갑니다.' },
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
