/* 움직이는 흐름 그림: "먼저 개념 잡기"의 흐름 상자(.concept-diagram .flow)를 빛나는 점이 차례로 지나가게 한다.
   상자가 실제로 차례대로 이어지는 장만 PLAN에 넣고, 장마다 무엇이 지나가는지 따로 적는다. 되돌아가는 고리는 back에
   돌아갈 상자 번호를 둔다. 관계를 나타낸 그림(2장 세 모델의 관계, 5장 관계 조회의 조건)과 순서 없이 함께 쓰는 조회 인자(4장 where·orderBy·select)에는 넣지 않는다.
   시각적 비유이며 실험 계산과 연결하지 않는다. 동작 줄이기에서는 아무것도 붙이지 않는다. */
(function () {
  'use strict';
  const PLAN = {
    why: { note: '빛나는 점은 요청 하나가 애플리케이션에서 Prisma Client를 거쳐 데이터베이스까지 가는 순서를 따라갑니다.' },
    setup: { note: '빛나는 점은 스키마를 선언한 뒤 마이그레이션과 Client 생성을 거쳐 첫 조회에 이르는 순서를 따라갑니다.' },
    migrations: { note: '빛나는 점은 확장에서 백필과 전환을 거쳐 축소에 이르는 스키마 변경 단계의 순서를 따라갑니다.' },
    transactions: { note: '빛나는 점은 첫 요청이 키 확인·쓰기 묶기·커밋 또는 롤백을 거친 뒤, 같은 요청이 다시 오면 키 확인으로 돌아가 저장한 응답을 재사용하는 고리를 보여 줍니다.', back: 0 },
    performance: { note: '빛나는 점은 반환 요구를 고정하고 호출 수를 세고 데이터량을 줄인 뒤 실제 DB에서 재는 순서를 따라갑니다.' },
    testing: { note: '빛나는 점은 변경 요청 하나가 입력 검사와 권한 문맥, 조건부 변경을 거쳐 결과 검사에 이르는 순서를 따라갑니다.' },
    final: { note: '빛나는 점은 요구사항에서 설계와 실패 주입을 거쳐 인계 기록에 이르는 작업 순서를 따라갑니다.' },
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
