# 미분 · 순간 변화율을 계산하고 그래프의 기울기로 읽기 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/derivative/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 시리즈 「미적분」의 1권이다(catalog.json의 series `calculus`). 2권은 「편미분과 연쇄 법칙」(books/partial), 3권은 「적분」(books/integral)이다. 이 책은 변수가 하나인 함수의 미분만 다루고, 편미분·기울기 벡터·적분은 두 책으로 보낸다.
- 공통 사례: 하람의 물로켓 높이 h(t) = 20t − 5t² (m, 초, 0~4초). 물을 다 뿜은 순간을 0초, 그때 속도 20 m/s, 중력가속도 10 m/s², 공기 저항 없음으로 둔 모형이며 측정값이 아니다. 낙하산·매출·저금통·상자·캔의 숫자도 이 책에서 정한 값이다. 숫자를 바꾸면 본문·예제·쉬운 말로 먼저(easy.js)·결과 읽기(lab-guides.js)·그림·복습 문항·docs의 표를 함께 고친다.
- 장 ID(average, limit, tangent, function, power, product, chain, transcendental, shape, optimize, linear, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes, review.json, data/catalog.json, 다른 책의 `../derivative/#장ID` 링크를 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, scene3d.js, figures.js, home-lab.js, lab-guides.js)는 DVMath의 값을 그리거나 문장에 넣기만 한다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 색의 뜻을 책 전체에서 지킨다: 강조색은 원래 함수, 주황은 기울기와 접선, 파랑은 도함수. 색만으로 구별하지 않고 범례와 글 레이블을 함께 둔다.
- 3D 장면은 공간 관계를 봐야 하는 네 실험(cube, balloon, box, can)에만 쓴다. 3D 실험마다 같은 값을 결과 문장과 표로 적고, 동작 줄이기 설정에서 자동 회전을 멈춘다.
- 장마다 예제는 셋이고 한 줄씩 펼쳐 본다. 식을 새로 넣으면 읽는 법(formulaNote)과 숫자를 넣은 예제를 함께 넣는다.
- 실험의 "먼저 예측하기" 질문은 처음 놓인 값이나 본문만 읽어서는 답이 보이지 않게 쓴다. 실험의 처음 값을 바꾸면 예측 질문을 다시 확인한다.
- 실험 제목을 바꾸면 data/catalog.json 읽기 노선 slope-to-best-value의 할 일에 적힌 실험 이름을 같은 커밋에서 맞춘다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도는 서재 공통 assets/book-study.js가 `bookshelf:derivative:v1:study`에 남긴다. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 스크립트나 스타일을 고치면 index.html의 `?v=` 값을 모든 로컬 자산에서 함께 올린다(tests/routes.test.cjs가 한 가지 값인지 검사한다).
- 검사: `npm test --prefix books/derivative`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8791` 후 `node books/derivative/tests/browser.cjs`.
- 전역 이름은 DV 접두어(DVMath, DVBook, DVUI, DVLabs, DV3D, DVGuides, DVFigures, DVHome, DVEasy)만 쓴다. 서가 삽화의 클래스·keyframes는 dv-ill-, 장 그림은 dvf- 접두어를 쓴다.
