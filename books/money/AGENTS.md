# 돈의 시간 가치
루트 AGENTS.md와 docs/08-book-template.html을 따른다. 「금융과 투자 처음부터」 시리즈 1권이며, 4권 「주문 한 장이 체결되기까지」(books/market/)와 같은 화면 구조를 쓴다.
- 공통 사례는 모두 가정이다: 4권의 하린이 모은 1,000만 원과 남은 신용대출 600만 원(연 6%, 3년), 8장의 누리200 ETF. 장마다 이 돈이 예금·상환표·투자로 모습을 바꾸고, 마지막 과제에서 같은 돈을 상환과 투자 중 어디에 둘 때 3년 뒤 숫자가 어떻게 다른지 표로 만든다. 실제 금융상품을 사례로 쓰거나 권하지 않는다.
- 결과 문장은 권유가 아니라 "이 가정에서는 …"으로 쓴다. "갚으세요", "투자하세요" 같은 말을 쓰지 않는다(tests/guides.test.cjs가 안내 상자를 검사).
- 계산은 js/math.js 한 곳에만 둔다(DOM 없음, tests/math.test.cjs가 대표값·경계값과 본문·안내 상자의 숫자를 대조). 실험과 그림은 MMath만 불러 숫자를 얻고 같은 공식을 다시 쓰지 않는다. 세율·물가·신용점수 같은 바깥 사실의 원문과 확인일은 docs/research.html에 적고, 바뀌면 math.js 기본값·안내 상자·본문을 함께 고친다.
- 8장 실험은 산술 평균·연환산 수익률·끝 금액·"평균으로 꾸준히 불었을 때"만 보여 준다. 변동성 손실의 어림식(분산/2)은 8권 몫이라 화면에 내지 않는다(MMath.cagr의 approx는 테스트에서만 쓴다).
- 실험 결과 문장 끝의 꼬리표로 공식을 실제로 계산한 것, 정해 둔 예시 숫자(8장 cagr 경로), 가정한 시나리오(10장 decide 투자 수익률)를 구분한다. 저울 그림은 시각적 비유다.
- 본문은 js/content.js, 개념 그림은 js/figures.js, 조작은 js/labs-grow.js(1~3장)·labs-today.js(4~6장)·labs-weigh.js(7~10장), 안내는 js/lab-guides.js, 표지 실험(시간 저울)은 js/home-lab.js, 공통 UI는 js/visual.js에서 관리한다. 전역 이름은 M 접두어(MMath, MBook, MUI, MLabs, MGuides, MFigures, MHome)를 쓴다.
- 서가 펼침 삽화(assets/shelf-illustration.svg)의 클래스·id는 mn- 접두어, 표지 삽화(assets/cover-art.svg)는 공통 cv-* 클래스만 쓴다.
- npm test와 tests/browser.cjs를 실행하고 docs/index.html에 검증 범위를 기록한다.
