# 머신러닝 기초 · 데이터에서 믿을 만한 예측까지 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-ml/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 03권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 phases/02-ml-fundamentals(레슨 18개)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 가상의 작은 온라인 서점 결제 기록(결제 1,000건 중 사기 약 3%)과 일별 주문 수. 책 전체가 이 기록으로 사기 경보 하나를 완성하는 이야기다. 장마다 같은 서점의 결제·고객·문의 데이터를 쓰고, 마지막 장에서 새 결제 수단 도입 뒤의 분포 이동을 다룬다.
- 장 ID(framing, lines, trees, neighbors, clusters, bayes, features, metrics, tradeoff, pipeline, rare, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-03-ml:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-ml`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-ml/tests/browser.cjs`.
- 실험 입력 id(sep, epochs, cut, k, logc, kk, step, alpha, scale, thr, deg, n, rho, cats, win, inj, method, shift, policy, home-thr)는 lab-guides.js의 예제 키와 같아야 한다.
- 결과 문장과 안내의 숫자는 A03Math 계산값이다. 계산을 바꾸면 lab-guides.js의 결과 읽기 숫자도 다시 확인한다.
- 시점에 민감한 사실은 원본 커리큘럼 범위에서만 쓰고 확인일(2026-10-08)을 밝힌다.
