# AI 안전과 윤리 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-safety/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 19권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 Phase 18 Ethics, Safety & Alignment(레슨 30개)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 누리은행의 상담·업무 AI 비서 누리. 오픈 모델을 들여와 RLHF와 DPO로 다듬고, 숨은 결함과 정렬 위장을 의심하며 감독 장치를 세우고, 탈옥·간접 주입·조정 층을 시험하고, 대출 심사의 공정성·고객 대화의 프라이버시·EU와 한국의 규제 일정을 점검한다. 마지막 장은 출시 한 달 뒤 들어온 보고 세 가지에 앞 장의 계산으로 처방을 맞추는 과제다.
- 장 ID(rlhf, dpo, deception, scheming, control, jailbreak, injection, guard, fairness, privacy, governance, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-19-safety:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-safety`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-safety/tests/browser.cjs`.
- 규제·법률 내용은 원본 커리큘럼 범위에서만 쓰고 "원본 커리큘럼 기준(확인일 2026-10-08)"과 공식 문서 확인 안내를 함께 둔다. 새 날짜·벌금·조항을 더할 때는 공식 출처로 확인한 날짜를 적는다.
- 탈옥·주입 실험에는 실제 공격 문구를 싣지 않는다. 시나리오와 계산만 보인다.
- 전역 접두어 A19, 삽화 클래스 접두어 a19-ill-.
