# 지수와 ETF
루트 AGENTS.md와 docs/08-book-template.html을 따른다. 「금융과 투자 처음부터」 시리즈 7권이며, 11권 「세금과 계좌」(books/tax/)와 같은 화면 구조를 쓴다.
- 이 책은 학습용이며 투자 권유가 아니다. 사례는 모두 가상이다: 하린, 새벽전자·A사·B사·C사, 가상 지수 누리200 지수(코스피200과 같은 방식으로 만들었다고 정함), 누리200·가람200·누리200 2배·누리 해외100·누리 국채3년·먼바다500 ETF. 실제 코스피·코스피200은 실제 지수로 출처와 함께 설명한다. 기준값: 지수 300.00 = NAV 30,000원(지수 1포인트 = 100원).
- 괴리율 공시 기준·LP 의무·레버리지 거래 요건은 2026-10-13 보도·안내 기준이다. 화면에 확인일과 "규칙은 바뀌므로 거래 전 한국거래소 공시와 투자설명서로 확인"(js/visual.js RULE_NOTE)을 붙이고, 보도로도 확인 못한 규칙은 "확인 못함"으로 적는다. 규칙 숫자는 js/math.js의 RULES 한 곳에만 둔다.
- 결과 문장은 권유가 아니라 "이 가정에서는 …"으로 쓴다. "추천", "유리", "~사세요", "고르세요"를 쓰지 않는다(tests/guides.test.cjs가 검사). 9장과 10장에는 ADVICE_NOTE("가상의 ETF로 계산한 사례이며, 고르거나 사고팔 시점을 권하는 것이 아닙니다. 계산 편의, 권유 아님.")를 붙인다.
- 레버리지 감쇠 계산과 거래 요건 상자는 8권 #drag, ETF 세금 금액은 11권 #etf로 보내고 이 책에서 다시 계산하지 않는다(6장 실험은 하루 한 번의 재조정만, 8장은 유형과 세율만). 두 권은 선수가 아니라 깊이 보기(뒤 권)이며, 본문 떠올리기는 4권 이하와 이 책 앞 장으로만 쓴다.
- 계산은 js/math.js(window.EMath) 한 곳에 둔다(DOM 없음, 주식 수 1주 단위 버림, iNAV 원 미만 반올림). tests/math.test.cjs가 research.html V-1~V-8과 본문·복습·L2 숫자를 대조한다. app.js의 L2 문장은 docs/index.html #chapters의 L2 칸에서 괄호 속 답을 뺀 질문과 같게, content.js recall은 L1과 같게 둔다(tests/routes.test.cjs·content.test.cjs). lab-guides.js의 결과 읽기는 마지막 문장에서 L2에 답한다.
- 전역 이름은 E 접두어(EMath·EBook·EUI·ELabs·EGuides·EFigures·EHome). 스크립트 순서: math → content → visual → figures → labs-index → labs-gap → labs-cost → labs-assets → labs-compare → home-lab → lab-guides → app.
- 실험 꼬리표로 실제 계산·한국거래소 원문·보도 기준·미리 정한 가상 시나리오·확인 못함·시각적 비유를 구분하고, 상태(프리미엄/디스카운트, LP 호가 의무 있음/면제, 기준을 넘음/넘지 않음)는 색과 함께 글자와 ▲ ✓ ✗로 적는다.
- 4장 괴리율 실험의 시각 슬라이더는 15:29에서 멈춘다(15:30 이후는 math.js가 LP 면제로 보지 않는다). 장 시작 09:00~09:04도 LP 면제 시간으로 계산된다.
- 서가 펼침 삽화의 클래스·id·keyframes는 ef- 접두어. 표지 삽화는 공통 cv-* 클래스만 쓰고 펼침 삽화와 다른 장면(종목 블록 바구니와 NAV 가격표)으로 둔다. 책 색은 aqua.
- 함수와 즉시 실행 블록은 100줄 이내. 스크립트·스타일을 고치면 index.html의 ?v= 한 값을 함께 올린다. npm test와 tests/browser.cjs를 실행하고 docs/index.html에 검증 범위를 기록한다.
