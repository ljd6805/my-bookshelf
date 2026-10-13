# 세금과 계좌
루트 AGENTS.md와 docs/08-book-template.html을 따른다. 「금융과 투자 처음부터」 시리즈 11권이며, 3권 「금리와 채권」(books/bonds/)과 같은 화면 구조를 쓴다.
- 이 책은 학습용이며 세무 상담이 아니다. 공통 사례는 모두 가상이다: 하린, 가상의 새벽전자 주식, 가상의 ETF 누리200(국내주식형)·누리 해외100(국내 상장 해외주식형)·먼바다500(해외 상장), 가상의 채권 나라 3년. 기준 사례는 1,000만 원, 3년, 연 가격 상승 4% + 분배 2%(미리 정한 가상 시나리오)이고 세전 수익은 1,848,640원이다.
- 세율·한도·기준 금액은 모두 2026-10-13에 보도·은행·법무법인 안내로 확인한 값이며 공식 원문으로 확인하지 못했다. 화면에는 "세율·한도는 2026-10-13 보도·안내 기준(공식 원문 미확인)"(TUI.RATE_NOTE)을 붙이고, 보도로도 확인하지 못한 규칙은 "확인 못함"으로 적는다. 세율을 바꾸려면 js/math.js의 RATES만 고치고 본문·복습·테스트·안내 상자를 함께 고친다.
- 결과 문장은 권유가 아니라 "이 가정에서는 …"으로 쓴다. 어느 계좌나 상품이 낫다거나 유리하다고 쓰지 않고, 상품·계좌를 향한 "~하세요", "추천"을 쓰지 않는다(tests/guides.test.cjs가 검사). 10장의 배분안은 "하린의 조건에서 계산한 배분안이며, 독자에게 권하는 배분이 아닙니다"를 붙인다.
- 계산은 js/math.js 한 곳에만 둔다(DOM 없음, 원 미만 버림, tests/math.test.cjs가 대표값·경계값과 본문·복습·L2 숫자를 대조). 실험과 그림은 TMath만 불러 숫자를 얻고 세율 숫자를 다시 쓰지 않는다.
- 실험의 기본 상태는 본문 숫자를 그대로 재현하고, 예측 질문(L2)의 사례는 입력을 바꿔 닿을 수 있어야 한다(tests/browser.cjs의 DEFAULTS·L2). L2 문장은 docs/index.html #chapters 표의 L2 칸과 js/app.js의 info[lab][2]가 같아야 하고, 장의 recall은 같은 표의 L1과 같아야 한다(tests/guides.test.cjs). 결과 읽기의 마지막 문장이 L2의 답이다.
- 실험 결과 끝의 꼬리표로 실제 계산·세율·한도는 2026-10-13 보도 기준·미리 정한 가상 시나리오·확인 못함·시각적 비유를 구분한다. 상태는 색과 함께 글자와 ▲ ✓ ✗로도 적는다.
- 본문은 js/content.js, 개념 그림은 js/figures.js, 조작은 js/labs-events.js(1~3장)·labs-gains.js(4~6장)·labs-accounts.js(7~8장)·labs-calc.js(9장 대표 실험, 세후 수익 계산기)·labs-final.js(10장), 안내는 js/lab-guides.js, 표지 실험은 js/home-lab.js, 공통 UI와 그림 도구는 js/visual.js에서 관리한다. 전역 이름은 T 접두어(TMath, TBook, TUI, TLabs, TGuides, TFigures, THome)를 쓴다. 실험 id에 붙임표가 있으면(tax-map, etf-tax, after-tax, final-order) 따옴표 키로 쓴다. 함수와 즉시 실행 블록은 100줄 이내(routes.test.cjs가 검사).
- 서가 펼침 삽화(assets/shelf-illustration.svg)의 클래스·id·keyframes는 tx- 접두어이고 글자는 viewBox 안에 둔다(browser.cjs가 잰다). 표지 삽화(assets/cover-art.svg)는 공통 cv-* 클래스만 쓰고, 펼침 삽화와 다른 장면(배당 입금 거래 내역 한 장)을 그린다. 책 색은 plum.
- npm test와 tests/browser.cjs를 실행하고 docs/index.html에 검증 범위를 기록한다.
