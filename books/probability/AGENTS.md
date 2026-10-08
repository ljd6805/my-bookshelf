# 확률과 통계 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/probability/`이다. 루트 `AGENTS.md`의 공통 규칙을 따른다.
- 공통 사례는 "한빛 공장 진동 센서 20대의 경보"이다. 새 장과 실험도 이 사례에서 출발하고, 전이 문제에서만 공장 밖으로 나간다.
- 장 ID(`chance, binomial, spread, clt, bayes, interval, testing, likelihood`)와 진입 경로(`home, chapters, sources, final`)는 주소로 쓰이므로 바꾸지 않는다. 바꾸거나 추가하면 `index.html`의 `book-routes`와 `data/catalog.json` 목차를 함께 고친다.
- 계산은 `js/stats.js`, `js/inference.js`에만 둔다. 화면 코드(`labs-*.js`, `figures.js`)는 계산하지 않고 그린다. 계산을 바꾸면 `tests/stats.test.cjs`에 대표값·경계값·불변 조건을 추가한다.
- 실험 상자에는 종류(정확한 계산/시뮬레이션), 입력 범위, 가정을 적는다. 그림은 개념 도식이며 실제 계산이 아님을 유지한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../ai/#장ID` 같은 링크와 이동 이유로만 연결한다.
- 진도 저장 키: `bookshelf:probability-statistics:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/probability`, `python3 scripts/validate.py`. 실험을 바꾸면 루트에서 `python3 -m http.server 8765` 후 `node books/probability/tests/browser.cjs`(전역 playwright 필요)로 입력·출력·초기화를 확인한다.
