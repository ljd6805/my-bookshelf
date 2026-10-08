# 지식 그래프와 온톨로지 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/knowledge-graph/`이다. 루트 `AGENTS.md`의 공통 규칙과 `docs/08-book-template.html`(AI Book 기준 화면·장 구조)을 따른다.
- 공통 사례는 "퀴리 가족의 사실 21개"(`js/graph.js`의 `triples`)이다. 새 장과 실험도 이 그래프에서 출발한다. 사실을 더하거나 바꾸면 노벨상 공식 기록 같은 출처로 확인하고, 지명은 오늘날 기준이라는 전제를 유지한다.
- 장 ID(`triples, walk, identity, ontology, reasoning, query, extraction, embedding, graphrag`)와 진입 경로(`home, chapters, sources`)는 주소로 쓰이므로 바꾸지 않는다. 바꾸거나 추가하면 `index.html`의 `book-routes`, `data/catalog.json`의 목차와 `chapter_index`를 함께 고친다.
- 계산은 `js/graph.js`에만 둔다(DOM 없음, Node 테스트). `labs-*.js`, `figures.js`, `home-graph.js`는 계산 함수를 불러 그리기만 한다. 계산을 바꾸면 `tests/graph.test.cjs`에 대표값·경계값·불변 조건을 더한다.
- 7장 추출 점수와 8장 좌표는 미리 정한 교육용 값이다. 화면과 문서에서 실제 계산과 구별해 밝힌다. 9장은 언어 모델을 실행하지 않는다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `content.js`의 `cross` 필드(`../주제/#장ID`, 이동 이유)로만 잇는다.
- 서가 복귀 버튼(`data-shelf-return`, `../../index.html#books`)과 `data-typeset="book"`, `../../assets/type.css` 연결을 유지한다.
- 검사: `npm test --prefix books/knowledge-graph`, `python3 scripts/validate.py`, `python3 scripts/build_catalog.py --check`. 실험을 바꾸면 루트에서 `python3 -m http.server 8000` 후 `node books/knowledge-graph/tests/browser.cjs`(playwright 필요)로 예제·직접 조작·초기화를 확인한다.
