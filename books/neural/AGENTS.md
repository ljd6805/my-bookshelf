# 신경망의 계산 · 예측선 긋기에서 역전파와 기울기 소실까지 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/neural/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 2026-11-11에 「딥러닝 핵심」(books/aie-deep)을 두 권으로 나누며 만든 첫 권이다. 시리즈에 넣지 않은 "인공지능" 분야 책이고, 다음 책은 「딥러닝 핵심」이다(content.js의 meta.next).
- 장 순서는 서재 주인의 수업 필기 흐름을 따른다: 텐서 → 예측선과 손실 → 경사하강 → 가중합과 활성화(퍼셉트론·순전파) → 역전파 → 기울기 소실과 ReLU → 목적에 맞는 구조(LLM은 그 가운데 하나) → 마지막 과제. 사내 교육 자료의 문장·그림·예제는 옮기지 않는다.
- 4~7장(perceptron, forward, backprop, activation)은 「딥러닝 핵심」에서 옮겨 온 장이며, 개념과 순서는 rohitg00/ai-engineering-from-scratch(MIT)의 phases/03-deep-learning-core를 참고했다. 바닥글과 출처의 표기를 지우지 않는다.
- 공통 사례: "점에 선을 긋는 일". 2~3장은 도윤의 카페 8일 기록(x = 최고 기온 − 20℃, y = 아이스 음료 판매 잔 수, 설명용 가상 값, js/math.js의 LINE), 4~6장은 네 모서리 점, 마지막 과제는 반지름 0.8 원 안팎을 가르는 점 80개다. 마지막 과제의 데이터 규칙은 「딥러닝 핵심」의 원 판별기와 같게 유지한다.
- 장 ID(tensor, loss, descent, perceptron, forward, backprop, activation, architectures, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes, review.json, data/catalog.json, 다른 책의 `../neural/#장ID` 링크를 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산이나 실험 조건(시드, epoch, 학습률, 데이터)을 바꾸면 본문·결과 읽기(lab-guides.js)·그림 설명·복습 문항의 숫자를 함께 확인하고 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 「딥러닝 핵심」의 장 번호를 가리키는 문장(1장 옵티마이저, 3장 초기화, 4장 규제, 5장 정규화, 6장 프레임워크)이 본문에 있다. 그 책의 장 순서를 바꾸면 이 책도 고친다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도는 서재 공통 assets/book-study.js가 `bookshelf:neural:v1:study`에 남긴다. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/neural`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/neural/tests/browser.cjs`.
- 전역 이름은 NC 접두어(NCMath, NCBook, NCUI, NCLabs, NCFigures, NCGuides, NCHome)만 쓴다. 서가 삽화의 클래스·keyframes는 nc-ill- 접두어를 쓴다.
- 학습 실험은 브라우저에서 매번 실제로 계산하므로 한 번 갱신이 0.3초를 넘지 않게 조건을 작게 유지한다.
