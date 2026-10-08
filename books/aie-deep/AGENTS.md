# 딥러닝 핵심 · 퍼셉트론에서 나만의 작은 프레임워크까지 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-deep/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 4권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 phases/03-deep-learning-core(레슨 13개)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 평면 [-1,1]² 위의 점이 반지름 0.8 원 안(1)인지 밖(0)인지 맞히는 작은 신경망 "원 판별기". 1~3장은 그 가장 작은 판인 네 모서리 XOR로 시작하고, 이후 모든 학습 실험은 js/math.js의 train()으로 같은 판별기를 실제로 학습시킨다. 실험 조건(점 수, 시드, epoch)을 바꾸면 본문·안내·그림 설명의 숫자를 함께 확인한다.
- 장 ID(perceptron, forward, backprop, activation, loss, optimizer, schedule, init, regularize, framework, debug, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-04-deep:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-deep`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-deep/tests/browser.cjs`.
- 전역 이름은 A04 접두어(A04Math, A04Book, A04UI, A04Labs, A04Figures, A04Guides, A04Home)만 쓴다. 서가 삽화의 클래스·keyframes는 a04-ill- 접두어를 쓴다.
- 학습 실험은 브라우저에서 매번 실제로 계산하므로 한 번 갱신이 0.3초를 넘지 않게 조건을 작게 유지한다(검증 손실은 최대 100번만 잰다).
