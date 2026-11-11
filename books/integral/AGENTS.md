# 적분 · 잘게 나눠 더해 넓이·쌓인 양·부피 계산하기 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/integral/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 2026-11-11에 서재 주인의 요청(미분과 적분을 각각 전문으로 다루는 책, 3D 애니메이션과 학습 도구, 수식 예시)으로 만들었다. 「미적분」 시리즈(catalog.json의 series `calculus`)의 3권이고, 1권은 미분(books/derivative), 2권은 편미분과 연쇄 법칙이다. 시리즈 정보는 js/content.js의 meta.series에도 있다.
- 공통 사례는 수빈의 빗물 탱크다(모두 설명용 가상 값, js/math.js). 유입 속도 r(t) = 6t − 0.6t² L/분(0~10분, 모두 100 L), 배수구를 연 날 q(t) = r(t) − 8, 소나기 s(t) = 8t·e^(−t/2), 탱크는 ρ(h) = √(1.2h) dm·깊이 8 dm의 포물면(120.64 L), 마지막 과제는 2.36·s(t)를 12분 동안 읽은 기록(용량 120.6 L, 처음 48.2 L, 남은 자리 72.4 L, 참값 74.21 L)이다. 10장(기다리는 시간)과 11장(둥근 지붕)만 탱크 밖의 사례를 쓴다.
- 장 ID(area, riemann, accumulate, ftc, antiderivative, substitution, parts, numeric, volume, probability, double, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes, review.json, data/catalog.json, 다른 책의 `../integral/#장ID` 링크를 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js, space3d.js)는 계산하지 않고 그린다. 식이나 조건을 바꾸면 본문·예제(content.js, content-b.js)·결과 읽기(lab-guides.js)·그림 설명·복습 문항(review.json)·docs/research.html 4절의 숫자를 함께 확인하고 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 마지막 과제의 숫자는 “4분·3분 간격은 넘치지 않음, 2분·1분은 엇갈림, 30초는 넘침”이 되도록 맞춘 값이다. FINAL의 k·capacity·start를 바꾸면 이 판정 순서가 유지되는지 테스트로 확인한다.
- 이 책이 표준 장 구조에 더한 학습 도구: “쉬운 말로 먼저”(chapter.easy), “예제로 따라 하기”(chapter.examples: [제목, 문제, 풀이 단계 배열, 답]), 접어 둔 “결과 읽기”, 재생 단추(data-play). 장 화면 일곱 블록의 순서는 바꾸지 않는다. 장마다 easy와 예제 둘 이상을 유지한다(tests/routes.test.cjs가 검사).
- 3D는 9장(solid)과 11장(columns) 실험, 두 장의 그림에만 쓴다. js/space3d.js가 SVG로 그리며 끌기·슬라이더·재생 단추로 돌린다. 원판과 기둥의 크기는 계산값이고 면의 밝기만 표현이다. 3D 화면마다 숫자를 결과 문장과 표로도 적는다(2D·텍스트 대안).
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다. 미분 책이 공개되면 3~7장 cross에 `../derivative/#tangent·#function·#power·#chain·#product` 링크를 더한다.
- 진도는 서재 공통 assets/book-study.js가 `bookshelf:integral:v1:study`에 남긴다. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/integral`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/integral/tests/browser.cjs`.
- 전역 이름은 IG 접두어(IGMath, IGBook, IGUI, IGLabs, IG3D, IGFigures, IGGuides, IGHome)만 쓴다. 서가 삽화의 클래스·keyframes는 ig-ill- 접두어를 쓴다.
