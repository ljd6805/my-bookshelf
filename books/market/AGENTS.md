# 주문 한 장이 체결되기까지
루트 AGENTS.md와 docs/08-book-template.html을 따른다.
- 공통 사례는 모두 가상이다: 투자자 하린, 종목 새벽전자(전일 종가 19,950원, 2만 원 호가단위 경계 바로 아래), ETF 누리200. 하린의 주문 한 장이 장마다 다음 관문을 지나고, 마지막 과제에서 하린의 격자 주문표(19,970원부터 30원 간격)를 진단한다. 실제 종목·업체·인물을 사례로 쓰지 않으며 투자 권유를 하지 않는다.
- 거래 규칙 계산은 js/math.js 한 곳에만 둔다(DOM 없음, tests/math.test.cjs가 대표값·경계값과 안내 상자의 숫자를 대조). 규칙 값(호가단위 표, 가격제한폭, VI 문턱, 거래세율, 거래 시간, 휴장일)의 원문과 확인일은 docs/research.html에 적고, 바뀌면 math.js·labs-after.js의 표·안내 상자·본문을 함께 고친다.
- 실험 결과 문장 끝의 꼬리표로 실제 규칙 계산, 정해 둔 예시 숫자(1장 claims, 2장 venue), 시나리오(12장 scam)를 구분한다. 호가창·주문 묶음·가격 경로는 규칙 계산 안의 정해 둔 예시다.
- 본문은 js/content.js, 개념 그림은 js/figures.js, 조작은 js/labs-orders.js·labs-rules.js·labs-after.js, 안내는 js/lab-guides.js, 표지 실험은 js/home-lab.js, 공통 UI는 js/visual.js에서 관리한다. 전역 이름은 M 접두어(MMath, MBook, MUI, MLabs, MGuides, MFigures, MHome)를 쓴다.
- 공통 호가창 데이터는 MUI.BOOK 하나를 표지와 3장이 함께 쓴다.
- npm test와 tests/browser.cjs를 실행하고 docs/index.html에 검증 범위를 기록한다.
