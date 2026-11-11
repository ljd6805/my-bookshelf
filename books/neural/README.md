# 신경망의 계산 · 예측선 긋기에서 역전파와 기울기 소실까지

카페 8일 기록에 예측선 하나를 긋고 손실을 재는 일에서 출발해, 경사하강, 퍼셉트론, 순전파, 역전파, 활성화 함수와 기울기 소실, 목적에 맞는 구조 고르기까지 신경망의 계산을 브라우저에서 직접 해 보는 책입니다. 9장, 실험 13개, 복습 27문항.

- 책 열기: `index.html` (서가에서는 `books/neural/`)
- 다음 책: 「딥러닝 핵심」(`../aie-deep/`). 이 책의 마지막 과제에서 학습시킨 원 판별기를 더 안정되게 학습시키는 방법으로 이어집니다.
- 제작 문서: `docs/index.html`, 조사 노트: `docs/research.html`, 팩트·출처 검수: `docs/fact-review.html`
- 검사: `npm test --prefix books/neural`, 루트에서 `python3 -m http.server 8765` 후 `node books/neural/tests/browser.cjs`
- 4~7장은 [AI Engineering from Scratch](https://github.com/rohitg00/ai-engineering-from-scratch)(MIT)의 3단계 레슨을 참고해 새로 썼습니다. 원문과 코드는 옮기지 않았습니다.
