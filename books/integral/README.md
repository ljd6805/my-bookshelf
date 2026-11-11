# 적분 · 잘게 나눠 더해 넓이·쌓인 양·부피 계산하기

빗물 탱크의 유입 속도 기록에서 고인 물을 구하는 일로 출발해, 리만 합과 정적분, 미적분의 기본 정리, 원시함수, 치환적분, 부분적분, 수치적분, 회전체의 부피, 확률밀도, 이중적분까지 브라우저에서 직접 계산해 보는 책입니다. 12장, 실험 14개(3D 2개), 따라 하는 예제 40개, 복습 36문항.

- 책 열기: `index.html` (서가에서는 `books/integral/`)
- 시리즈: 「미적분」 3권. 1권 미분(`../derivative/`), 2권 편미분과 연쇄 법칙.
- 제작 문서: `docs/index.html`, 조사 노트: `docs/research.html`, 팩트·출처 검수: `docs/fact-review.html`
- 검사: `npm test --prefix books/integral`, 루트에서 `python3 -m http.server 8765` 후 `node books/integral/tests/browser.cjs`
- 유입 속도 식과 유량계 기록은 설명용 가상 값이고, 실험의 숫자는 모두 `js/math.js`가 실제로 계산합니다.
