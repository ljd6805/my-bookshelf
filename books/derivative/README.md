# 미분 · 순간 변화율을 계산하고 그래프의 기울기로 읽기

위로 쏜 물로켓의 높이 h(t) = 20t − 5t²에서 출발해 평균 변화율, 극한, 미분계수, 도함수, 미분 규칙, 극값, 최적화, 선형 근사와 뉴턴 방법까지 브라우저에서 직접 계산해 보는 책입니다. 12장, 실험 18개(3D 4개), 한 줄씩 펼쳐 보는 예제 36개, 복습 24문항. 시리즈 「미적분」의 1권입니다.

- 책 열기: `index.html` (서가에서는 `books/derivative/`)
- 다음에 읽을 곳: 「신경망의 계산」 3장 경사하강(`../neural/#descent`). 미적분 2권 「편미분과 연쇄 법칙」, 3권 「적분」이 공개되면 그 책들로 이어집니다.
- 제작 문서: `docs/index.html`, 조사 노트: `docs/research.html`, 팩트·출처 검수: `docs/fact-review.html`
- 검사: `npm test --prefix books/derivative`, 루트에서 `python3 -m http.server 8791` 후 `node books/derivative/tests/browser.cjs`
- 정의와 정리는 OpenStax Calculus Volume 1(CC BY-NC-SA 4.0)과 대조했습니다. 문장·그림·예제는 옮기지 않았고, 로켓·상자·캔의 숫자는 이 책에서 정한 값입니다.
