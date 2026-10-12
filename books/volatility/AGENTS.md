# 가격은 어떻게 흔들리는가
루트 AGENTS.md와 docs/08-book-template.html을 따른다. 「금융과 투자 처음부터」 시리즈 8권이며, 12권 「격자 하나에서 손익이 갈리기까지」(books/grid/)와 같은 화면 구조를 쓴다.
- 공통 사례는 모두 가상이다: 하린, 가상의 회사 새벽전자, 가상의 지수·ETF 누리200과 레버리지 상품 누리200 2배. 새벽전자 1년 기록은 앞 120일이 12권 13장 시나리오, 뒤 130일이 생성기(시드 20)다. 실제 종목·상품·발행사를 사례로 쓰거나 권하지 않는다.
- 결과 문장은 권유나 방향 예측이 아니라 "이 가정에서는 …"으로 쓴다. "사세요", "파세요", "추천", "오를 것" 같은 말을 쓰지 않는다(tests/guides.test.cjs와 math.test.cjs가 검사).
- 계산은 js/math.js 한 곳에만 둔다(DOM 없음, tests/math.test.cjs가 대표값·경계값과 본문·복습·L2 숫자를 대조). 실험과 그림은 VMath만 불러 숫자를 얻고 같은 공식을 다시 쓰지 않는다. math.js의 결과를 바꾸면 본문·테스트·안내 상자를 함께 고친다.
- 실험의 기본 상태는 본문 숫자를 그대로 재현하고, 예측 질문(L2)의 사례는 입력을 바꿔 닿을 수 있어야 한다(tests/browser.cjs의 DEFAULTS·L2). L2 문장의 원본은 js/app.js의 info이며, docs/index.html 설계 표에 옮길 때 같은 문장을 쓴다(routes.test.cjs가 표가 있으면 대조). 결과 읽기의 마지막 문장이 L2의 답이다.
- 실험 결과 끝의 꼬리표로 실제 계산·미리 정한 가상 경로(새벽전자, 제자리 경로)·생성기(시드를 밝힌 가상 경로)·시각적 비유를 구분한다. 띠 밖·고른 값은 색과 함께 ▲, ✓, ✗, 실선·점선 이름표로도 적는다.
- 몬테카를로는 경로 4,000개 이하, t 잡음은 400개 이하로 묶고 결과를 VUI.memo에 남긴다. 다시 계산은 300ms 안이어야 한다(tests/browser.cjs가 data-ms로 확인). 더 무거운 계산을 넣으려면 버튼과 "계산 중" 상태를 둔다.
- 본문은 js/content.js, 개념 그림은 js/figures.js, 조작은 js/labs-returns.js(1~3장)·labs-model.js(4~6장)·labs-path.js(7~9장)·labs-final.js(10장), 안내는 js/lab-guides.js, 표지 실험(일일 재조정)은 js/home-lab.js, 공통 UI와 그림 도구는 js/visual.js에서 관리한다. 전역 이름은 V 접두어(VMath, VBook, VUI, VLabs, VGuides, VFigures, VHome)를 쓴다. 함수와 즉시 실행 블록은 100줄 이내(routes.test.cjs가 검사).
- 서가 펼침 삽화(assets/shelf-illustration.svg)의 클래스·id·keyframes는 vo- 접두어이고 글자는 viewBox 안에 둔다(browser.cjs가 잰다). 표지 삽화(assets/cover-art.svg)는 공통 cv-* 클래스만 쓴다. 책 색은 violet.
- npm test와 tests/browser.cjs를 실행하고 docs/index.html에 검증 범위를 기록한다.
