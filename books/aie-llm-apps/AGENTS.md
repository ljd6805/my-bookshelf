# LLM 엔지니어링 · 프롬프트에서 서비스까지 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-llm-apps/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 12권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 phases/11-llm-engineering(17개 레슨)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 가상의 온라인 서점 "책다락"의 고객 지원 도우미 "다락 도우미". 1장의 막연한 프롬프트에서 12장의 출시 2주 차 청구서까지 같은 도우미에 부품을 하나씩 더한다. 이야기 방식은 "제품을 완성한다".
- 장 ID(prompt,reasoning,structured,context,retrieval,lora,tools,eval,guardrails,cache,graph,final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-12-llm-apps:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-llm-apps`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-llm-apps/tests/browser.cjs`.
- 전역 접두어는 `A12`(A12Math, A12Book, A12UI, A12Figures, A12Labs, A12Guides, A12Home)이고, 서가 삽화의 클래스·id·keyframes 접두어는 `a12-ill-`이다.
- 모델 이름, MCP 개정(2026-07-28), 캐시 배수, 가격 같은 시점 민감 사실은 원본 레슨이 쓴 범위에서만 쓰고 "원본 커리큘럼 기준(확인일 2026-10-08)"이라고 밝힌다. 원본에 없는 수치를 지어내지 않는다.
- 실험 결과 문장에는 실제 계산인지, 미리 정한 시나리오인지, 교육용 가정값인지 밝힌다. 로짓·탐지 점수·질문 쌍 유사도는 교육용 값이다.
