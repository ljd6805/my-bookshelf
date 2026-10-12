# 도구와 프로토콜 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-tools/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 14권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 Phase 13(Tools & Protocols, 레슨 31개)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 팀 회의 노트를 찾고 요약하고 정리하는 노트 비서. notes_search·notes_delete·export 도구, notes 서버와 tasks 서버, 지우와 민호 두 사용자가 모든 장에 다시 나온다.
- 장 ID(loop, schema, envelope, client, context, mrtr, tasks, poison, auth, gateway, skills, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-14-tools:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-tools`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-tools/tests/browser.cjs`.
- MCP 규칙과 수치는 원본 레슨이 기준으로 삼은 2026-07-28 개정판을 따른다. 개정판이 바뀌면 원본 레슨과 공식 명세를 다시 확인하고 math.js 주석과 본문의 확인일을 함께 고친다.
- 서술자 해시는 교육용 FNV-1a 32비트다. SHA-256이라고 쓰지 않는다.
