# 자율 시스템 (AI 엔지니어링 16) 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-autonomy/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 16권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 Phase 15 · Autonomous Systems(레슨 22개)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 온라인 서점 책마루의 야간 에이전트 누리(밤 10시~아침 6시에 버그 수정, 공급 페이지 확인, 환불 처리, 자기 개선 시도). 장마다 누리의 “자율 운영 명세서”에 한 줄을 더하고, 마지막 장에서 주문 추적 도구를 붙인 첫 주의 사고 세 건에 통제를 고른다.
- 장 ID(horizon, star, evolve, research, bounded, permission, browser, durable, budget, guard, policy, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-16-autonomy:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-autonomy`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-autonomy/tests/browser.cjs`.
