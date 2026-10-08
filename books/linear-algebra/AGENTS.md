# 벡터와 행렬로 보는 세상 · 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/linear-algebra/`이다. 루트 `AGENTS.md`의 공통 규칙을 따른다.
- 공통 사례는 `js/songs.js`의 가상 노래 여덟 곡(빠르기, 에너지; −3~3)과 취향 (1, 2)이다. 값을 바꾸면 본문의 예시 숫자와 테스트가 함께 바뀌므로, 바꾸기 전에 `node`로 영향받는 숫자를 다시 계산하고 모든 장을 고친다.
- 장 파일과 ID `vectors, similarity, projection, matrix, compose, determinant, inverse, eigen, pca, layer, challenge`를 유지한다. 장을 추가하면 `index.html` 목차, 앞뒤 장의 `next`/`prev` 링크, `tests/structure.test.cjs`의 목록을 함께 고친다.
- 각 장은 장 지도 5칸(현재 문제·이전 결과·새 도구·해결할 것·남는 질문), 예측, 실험 1개, 4단계 설명(직관·변수·식·숫자 예), 이해 확인 2개, 오늘 꼭 해 볼 실험, 더 깊이 보기, 이유를 적은 다음 장 링크를 갖춘다.
- 계산은 `js/linalg.js`(순수 함수, 화면 없음)에, 그리기는 `js/plane.js`·`js/kit.js`, 실험은 `js/labs-*.js`에 둔다. 다른 책의 JavaScript를 가져오지 않는다.
- 정적 삽화의 색은 `s-a`·`f-me` 같은 역할 클래스로 지정해 밝은·어두운 화면을 모두 지원한다.
- 루트에서 `npm test --prefix books/linear-algebra`, `python3 scripts/validate.py`를 실행한다. 실험을 바꾸면 `python3 -m http.server 8765` 후 `NODE_PATH=$(npm root -g) node books/linear-algebra/tests/browser.cjs`로 확인한다.
- 기획·검증 기록은 `docs/index.html`에 남긴다.
