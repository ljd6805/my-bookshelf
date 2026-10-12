# LLM 직접 만들기 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-llm-build/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 11권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 `phases/10-llms-from-scratch` 24개 레슨(01~22, 25, 34)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: "서재봇" — 서재의 책과 실험을 추천하는 작은 LLM. 토크나이저 학습에서 데이터 정제, 사전학습, 정렬, 평가, 양자화와 서빙 설정까지 한 모델을 만들고, 마지막 장에서 출시 매니페스트의 되돌리기 범위를 계산한다. 원본 사실과 수치는 원본 레슨과 인용 논문 기준(확인일 2026-10-08)으로만 쓴다.
- 장 ID(tokenizer, data, pretrain, memory, parallel, sft, preference, selfimprove, eval, serving, architecture, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-11-llm-build:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-llm-build`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-llm-build/tests/browser.cjs`.
- 원본 레슨의 알려진 오류를 옮기지 않는다: 메모리 표의 파라미터당 12바이트(FP32 사본 누락, 이 책은 16바이트), GPT-2 파라미터 수, 15강의 α 수치, 16강의 12% 수치, 20강의 활성 파라미터 셈, 21강 Jamba KV 수치, 34강의 층당 800MB, 달러 비용. 수치는 math.js에서 공식으로 계산한다.
