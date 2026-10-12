# 컴퓨터 비전 · 픽셀에서 장면 이해까지 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-vision/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 05권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 phases/04-computer-vision(28개 레슨)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 역 앞 공공자전거 대여소를 비추는 카메라(640×480, 초당 30프레임). 1장의 픽셀 전처리에서 시작해 검출·분할·추적·OCR·깊이·생성을 거쳐, 마지막 장에서 비 오는 밤 새 카메라로 바뀐 상황을 33.3ms 예산 안에서 다시 맞춘다.
- 장 ID(pixels, backbone, classify, detect, segment, motion, selfsup, reading, depth, generate, world, capstone)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-05-vision:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-vision`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-vision/tests/browser.cjs`.
