# 찾고 정렬하고 잇기
루트 AGENTS.md와 docs/08-book-template.html을 따른다.
- 공통 사례는 가상의 솔내도서관(1만 권 → 통합 뒤 100만 권)과 본관·분관 일곱 곳의 배송 지도다. 장마다 같은 도서관과 지도를 쓰고, 장마다 규모 장부(js/math.js LEDGER)에 한 줄을 둔다. 11장 설계 과제가 그 장부를 쓴다.
- 모든 실험은 알고리즘을 실제로 실행해 비교·이동·확인 횟수를 센다. 청구기호·제목·대출 횟수는 고정 시드 합성 자료, 분관 지도와 배송 시간은 가상 자료, 10장 주제 지도는 2차원 교육용 모형, 11장 하루 질문 수와 ‘1초에 1억 단계’는 과제용 가정이다. 이 구분을 본문·실험 결과·참고 자료 절에 함께 적는다.
- 시드·자료·식을 바꾸면 본문·안내 상자·그림 캡션·review.json의 숫자가 함께 바뀐다. `npm test`의 기준값(tests/math.test.cjs)을 먼저 고치고 문장을 맞춘다.
- 10장은 색인이 “왜 빠른가”만 다룬다. BM25·조각·임베딩 사용법은 검색과 RAG 책으로 보낸다.
- 계산은 js/math.js, 본문은 js/content.js, 조작은 js/labs-*.js, 개념 그림은 js/figures.js, 실험 안내는 js/lab-guides.js에서 관리한다. 전역 이름은 AL 접두어(ALMath, ALBook, ALUI, ALLabs, ALGuides, ALFigures, ALHome)를 쓰고, localStorage 키는 bookshelf:algorithms:v1:… 형식으로 둔다.
- npm test와 tests/browser.cjs를 실행하고 docs/index.html에 검증 범위를 기록한다.
