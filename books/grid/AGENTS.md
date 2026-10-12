# 격자 하나에서 손익이 갈리기까지
루트 AGENTS.md와 docs/08-book-template.html을 따른다. 「금융과 투자 처음부터」 시리즈 12권이며, 1권 「돈의 시간 가치」(books/money/)와 같은 화면 구조를 쓴다.
- 공통 사례는 모두 가상이다: 1·4권의 하린, 가상의 회사 새벽전자(19,900원 근처), 가상의 ETF 누리200. 하린의 기본 격자는 18,000~22,000원 · 200원 · 20칸 · 칸당 5주, 한도는 300만 원이다. 실제 종목을 사례로 쓰거나 권하지 않는다.
- 결과 문장은 권유가 아니라 "이 가정에서는 …"으로 쓴다. "사세요", "파세요", "추천" 같은 말을 쓰지 않는다(tests/guides.test.cjs가 안내 상자와 실험 글을 검사).
- 계산은 js/math.js 한 곳에만 둔다(DOM 없음, tests/math.test.cjs가 대표값·경계값과 본문·복습·L2 숫자를 대조). 실험과 그림은 GMath만 불러 숫자를 얻고 같은 공식을 다시 쓰지 않는다. 미리 정한 가상 경로(BOX·UP·DOWN·FINAL·SWING·LV)는 js/visual.js의 GUI.PATH와 js/figures.js에 테스트와 같은 정의로 둔다. 경로를 바꾸면 테스트·본문·안내 상자를 함께 고친다.
- 실험의 기본 상태는 본문 숫자를 그대로 재현하고, 예측 질문(L2)의 사례는 입력을 바꿔 닿을 수 있어야 한다(tests/browser.cjs의 DEFAULTS·L2). L2 문장의 원본은 js/app.js의 info이며, docs/index.html 설계 표에 옮길 때 같은 문장을 쓴다(routes.test.cjs가 표가 있으면 대조).
- 실험 결과 문장 끝의 꼬리표로 규칙대로 실제 계산한 것(1~4·8·10장)과 미리 정한 가상 경로 위의 계산(5~7·9·11~13장)을 구분한다. 칸 상태와 체결은 색과 함께 기호(● 매수·매도 대기, ○ 매수 대기, – 주문 없음, ■ 매도, ✓, ✗)로도 적는다.
- 본문은 js/content.js, 개념 그림은 js/figures.js, 조작은 js/labs-lay.js(1~4장)·labs-walk.js(5~8장)·labs-read.js(9~12장)·labs-final.js(13장), 안내는 js/lab-guides.js, 표지 실험(격자 사다리)은 js/home-lab.js, 공통 UI와 그림 도구는 js/visual.js에서 관리한다. 전역 이름은 G 접두어(GMath, GBook, GUI, GLabs, GGuides, GFigures, GHome)를 쓴다. 함수와 즉시 실행 블록은 100줄 이내(routes.test.cjs가 검사).
- 서가 펼침 삽화(assets/shelf-illustration.svg)의 클래스·id·keyframes는 gr- 접두어, 표지 삽화(assets/cover-art.svg)는 공통 cv-* 클래스만 쓴다. 책 색은 rose.
- npm test와 tests/browser.cjs를 실행하고 docs/index.html에 검증 범위를 기록한다.
