# 편미분과 연쇄 법칙 · 곡면을 잘라 기울기를 재고 역전파 계산하기 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/partial/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 2026-11-11에 서재 주인의 요청으로 만들었다. 「신경망의 계산」(books/neural) 3장과 6장이 식 몇 줄로 지나간 편미분과 연쇄 법칙을 따로 풀어 쓴 책이며, 중심은 편미분 자체를 이해하는 데 있다(1~6장). 연쇄 법칙과 역전파 계산(7~11장)은 그 위에 쌓는다.
- 「미적분」 시리즈(catalog.json series id `calculus`)의 2권이다. 1권 「미분」(books/derivative), 3권 「적분」(books/integral)은 다른 작업에서 만든다. 변수 하나의 미분 규칙은 1권의 몫이므로 이 책 1장은 뜻과 규칙 세 가지만 다룬다.
- 공통 사례는 「신경망의 계산」과 같은 도윤의 카페 8일 기록(x = 최고 기온 − 20℃, y = 아이스 음료 판매 잔 수, 설명용 가상 값, js/math.js의 DATA)과 그 평균제곱오차 L(w, b)이다. 기록을 바꾸면 두 책의 숫자를 함께 고친다.
- 장 ID(slope, partial, rules, plane, gradient, descent, chain, graph, branch, deep, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes, review.json, data/catalog.json, 다른 책의 `../partial/#장ID` 링크를 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산이나 실험 조건을 바꾸면 본문(content.js)·결과 읽기(lab-guides.js)·그림 설명(figures.js)·복습 문항(review.json)의 숫자를 함께 확인하고 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 3차원 곡면은 js/visual.js의 surface가 SVG로 그린다(외부 라이브러리 없음). 끌기·방향키·단추로 돌릴 수 있어야 하고, 같은 내용이 그림 아래 결과 문장에 숫자로 있어야 한다. 곡면 창은 w 0~8, b 8~16으로 폭을 같게 두어 위에서 본 지도의 각도가 일그러지지 않게 한다. 움직임 줄이기 설정에서는 자동 회전을 시작하지 않는다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도는 서재 공통 assets/book-study.js가 `bookshelf:partial:v1:study`에 남긴다. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/partial`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/partial/tests/browser.cjs`.
- 전역 이름은 DX 접두어(DXMath, DXBook, DXUI, DXLabs, DXFigures, DXGuides, DXHome)만 쓴다. 서가 삽화의 클래스·keyframes는 dx-ill- 접두어를 쓴다.
