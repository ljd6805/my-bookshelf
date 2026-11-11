# 편미분과 연쇄 법칙 · 곡면을 잘라 기울기를 재고 역전파 계산하기

카페 8일 기록의 손실을 곡면으로 세워 돌려 보며 자르고, 단면의 기울기(편미분)에서 접평면, 기울기 벡터, 경사하강, 연쇄 법칙, 계산 그래프, 기울기 소실까지 브라우저에서 직접 계산해 보는 책입니다. 11장, 실험 12개(돌려 보는 3차원 그림 6개), 복습 26문항.

- 책 열기: `index.html` (서가에서는 `books/partial/`)
- 「미적분」 시리즈 2권입니다. 다음에 읽을 책은 「신경망의 계산」(`../neural/#backprop`)입니다.
- 제작 문서: `docs/index.html`, 조사 노트: `docs/research.html`, 팩트·출처 검수: `docs/fact-review.html`
- 검사: `npm test --prefix books/partial`, 루트에서 `python3 -m http.server 8765` 후 `node books/partial/tests/browser.cjs`
