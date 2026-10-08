# 모델을 움직이는 수학 · 미분에서 푸리에까지 (books/aie-math) 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-math/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 02권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 Phase 1 Math Foundations(레슨 22개)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 거실 조명의 음성 명령 인식기 ‘말귀’(명령 ‘켜’·‘꺼’·‘밝게’). 소리 → 스펙트럼 → 텐서 → 층 → softmax·교차 엔트로피 → 역전파·경사하강 → SVD 압축 → 명령 흐름(마르코프) → 새 버전 판정 순서로 모든 장과 실험에 다시 등장한다. 소리·특징·전이 확률·정확도는 가상 값임을 실험 문장에 밝힌다.
- 장 ID(signal, tensor, derivative, autodiff, optimize, entropy, stability, sampling, svd, linsys, markov, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-02-math:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-math`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-math/tests/browser.cjs`.
- 서재의 『벡터와 행렬로 보는 세상』(books/linear-algebra)과 『확률과 통계』(books/probability)가 깊게 다루는 내용(원본 레슨 01·02·03·06·07·10·15)은 장 안의 짧은 요약과 cross 링크로만 다룬다. 분량은 원본에만 있는 미분·자동미분·최적화·정보이론·수치 안정성·샘플링·SVD·연립방정식·푸리에·그래프·확률 과정에 쓴다.
- 원본 레슨 22개와 장의 대응표는 docs/index.html에 있다. 레슨을 다른 장으로 옮기면 대응표와 각 장의 details 제목(레슨 번호)을 함께 고친다.
- 서가 삽화 클래스 접두어는 `a02-ill-`, JS 전역 접두어는 `A02`이다.
