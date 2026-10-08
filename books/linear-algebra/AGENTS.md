# 벡터와 행렬로 보는 세상 · 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/linear-algebra/`이다. 루트 `AGENTS.md`의 공통 규칙을 따른다.
- 공통 사례는 `js/songs.js`의 가상 노래 여덟 곡(빠르기, 에너지; −3~3)과 취향 (1, 2)이다. 값을 바꾸면 본문의 예시 숫자와 테스트가 함께 바뀌므로, 바꾸기 전에 `node`로 영향받는 숫자를 다시 계산하고 모든 장을 고친다.
- 화면 구성은 서가의 기준 책인 AI Book(`books/ai/`)과 같다. `index.html` 한 페이지가 해시 경로로 표지(`#home`·`#chapters`·`#sources`)와 장을 보여 준다. 장 ID `vectors, similarity, projection, matrix, compose, determinant, inverse, eigen, pca, layer, challenge`를 유지한다. 장을 추가하면 `js/content.js`, `index.html`의 `book-routes`, `tests/structure.test.cjs`의 목록을 함께 고친다.
- 각 장(`js/content.js`)은 장 지도 5칸(현재 문제·이전 결과·새 도구·해결할 것·남는 질문), 개념 그림, 공식과 변수 설명, 예측, 실험, 관찰과 숫자 예, 이해 확인 2개, 새 상황에 써 보기, 혼동하지 마세요, 더 깊이 보기, 확인 문제, 참고 자료, 남은 질문, 이유를 적은 다음 장 링크를 갖춘다. 실험의 안내 상자(무엇을 확인하나요?·비교 예제·결과 읽기)와 마크업은 `js/lab-views.js`에 둔다.
- 계산은 `js/linalg.js`(순수 함수, 화면 없음)에, 그리기는 `js/plane.js`·`js/kit.js`, 실험은 `js/labs-*.js`, 화면 조립은 `js/helpers.js`·`js/page-*.js`·`js/app.js`에 둔다. `assets/style.css`의 앞부분은 AI Book의 스타일을 복사한 것이므로 AI Book의 공통 틀이 바뀌면 함께 맞춘다. 다른 책의 JavaScript를 가져오지 않는다.
- 스타일·스크립트를 바꾸면 `index.html`의 `?v=` 자산 버전을 함께 올린다.
- 정적 삽화의 색은 `s-a`·`f-me` 같은 역할 클래스로 지정해 밝은·어두운 화면을 모두 지원한다.
- 루트에서 `npm test --prefix books/linear-algebra`, `python3 scripts/validate.py`를 실행한다. 실험을 바꾸면 `python3 -m http.server 8765` 후 `NODE_PATH=$(npm root -g) node books/linear-algebra/tests/browser.cjs`로 확인한다.
- 기획·검증 기록은 `docs/index.html`에 남긴다.
