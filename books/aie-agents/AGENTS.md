# 에이전트 엔지니어링 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-agents/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 15권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 Phase 14 · Agent Engineering(레슨 54개)을 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 운영 경보가 울리면 고장 난 서비스를 찾고 안전한 다음 행동을 제안하는 장애 대응 에이전트 “당직 도우미”(checkout 서비스 5xx 경보). 모든 장의 문단과 실험이 이 에이전트를 다시 쓴다. 마지막 장은 2주 그림자 파일럿 결과를 판정하고 다음 단계와 톱니 행동을 정하는 과제다.
- 장 ID(loop, plan, refine, memory, patterns, runtime, measure, defend, workbench, gates, frame, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-15-agents:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-agents`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-agents/tests/browser.cjs`.
- 전역 접두어는 `A15`(A15Book, A15Math, A15UI, A15Labs, A15Guides, A15Figures, A15Home), 실험 상태 목록 클래스는 `a15-row`, 서가 삽화 클래스 접두어는 `a15-ill-`이다.
- 실험은 실제 계산(멈춤 조건, UCT 식, 융합 점수, 음성 지연 합, SWE-bench 판정, 글롭 범위 검사, 게이트·루브릭 문턱, 위험 점수, 조각 점수, 파일럿 판정)과 시나리오·교육용 가정값(대본, 토큰 수, 반성 상승폭, 사건 데이터, 패치와 완료 보고 구성)을 결과 문장에서 구분해 밝힌다.
- 제품 이름·버전·벤치마크 수치·날짜는 원본 커리큘럼 기준(확인일 2026-10-08)으로만 쓴다. 새 수치를 지어내지 않는다. 별도 검수자가 원본 레슨과 인용 논문에 대조한다.
