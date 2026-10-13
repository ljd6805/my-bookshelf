# 금리와 채권
루트 AGENTS.md와 docs/08-book-template.html을 따른다. 「금융과 투자 처음부터」 시리즈 3권이며, 8권 「가격은 어떻게 흔들리는가」(books/volatility/)와 같은 화면 구조를 쓴다.
- 공통 사례는 모두 가상이다: 하린, 가상의 은행 물결은행, 가상의 국채 나라 3년(연 3.875%)·나라 10년(연 4.5%), 가상의 새벽전자 3년 회사채(연 5.0%), 가상의 ETF 누리200. 실제 금리(기준금리 3.00%, 2026-10-07 국고채 금리 등)는 확인일과 함께 적고, 가상 채권에 넣을 때는 “실제 금리를 가상 채권에 넣은 값”이라고 밝힌다. 실제 상품·발행사를 사례로 쓰거나 권하지 않는다.
- 결과 문장은 권유나 금리 예측이 아니라 “이 가정에서는 …”으로 쓴다. "사세요", "파세요", "추천", "오를 것" 같은 말을 쓰지 않는다(tests/guides.test.cjs와 math.test.cjs가 검사). 10장의 200만 원씩은 “계산 편의, 권유 아님”이다.
- 계산은 js/math.js 한 곳에만 둔다(DOM 없음, tests/math.test.cjs가 대표값·경계값과 본문·복습·L2 숫자를 대조). 실험과 그림은 BMath만 불러 숫자를 얻고 같은 공식을 다시 쓰지 않는다. math.js의 결과를 바꾸면 본문·테스트·안내 상자를 함께 고친다.
- 실험의 기본 상태는 본문 숫자를 그대로 재현하고, 예측 질문(L2)의 사례는 입력을 바꿔 닿을 수 있어야 한다(tests/browser.cjs의 DEFAULTS·L2). L2 문장의 원본은 js/app.js의 info이며, docs/index.html 설계 표에 옮길 때 같은 문장을 쓴다(routes.test.cjs가 표가 있으면 대조). 결과 읽기의 마지막 문장이 L2의 답이다.
- 실험 결과 끝의 꼬리표로 실제 계산·실제 금리를 가상 채권에 넣은 값·미리 정한 가상 시나리오·교육용 모형(예측이 아님)·시각적 비유를 구분한다. 할증·액면·할인과 정상·평평·역전은 색과 함께 글자와 ▲▼, ↗→↘로도 적는다.
- 6장 수익률 곡선 놀이판(대표 실험)은 교육용 모형이다. 실제 국고채 금리는 점으로만 찍고 “모형과 맞춘 것 아님”을 붙인다. 모형의 고정 가정(초단기 차이 0.20%p, 1년, 절반 만기 5년, 기대 물가 계수 0.5)은 js/visual.js의 BUI.CURVE와 math.js 기본값이 같다.
- 본문은 js/content.js, 개념 그림은 js/figures.js, 조작은 js/labs-rate.js(1~3장)·labs-price.js(4~5장)·labs-curve.js(6장)·labs-credit.js(7~9장)·labs-final.js(10장), 안내는 js/lab-guides.js, 표지 실험(금리와 가격)은 js/home-lab.js, 공통 UI와 그림 도구는 js/visual.js에서 관리한다. 전역 이름은 B 접두어(BMath, BBook, BUI, BLabs, BGuides, BFigures, BHome)를 쓴다. 실험 id에 붙임표가 있으면(who-pays, curve-board, final-table) 따옴표 키로 쓴다. 함수와 즉시 실행 블록은 100줄 이내(routes.test.cjs가 검사).
- 서가 펼침 삽화(assets/shelf-illustration.svg)의 클래스·id·keyframes는 bo- 접두어이고 글자는 viewBox 안에 둔다(browser.cjs가 잰다). 표지 삽화(assets/cover-art.svg)는 공통 cv-* 클래스만 쓰고, 펼침 삽화와 다른 장면(이표채 현금흐름과 오늘로 돌아오는 할인 화살표)을 그린다. 책 색은 blue.
- npm test와 tests/browser.cjs를 실행하고 docs/index.html에 검증 범위를 기록한다.
