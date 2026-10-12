# 생성 모델 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-generative/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 09권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 Phase 8 · Generative AI(레슨 15개: 01~14, 19)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 그림책 작업실의 여우 캐릭터 “도토리” 그림 2,000장으로 새 삽화를 만드는 생성기. 그림을 특징값 하나로 줄이면 낮 장면 N(−2, 0.5²)과 밤 장면 N(+2, 0.5²)이 반반인 분포이며, 모든 장의 실험이 이 분포를 다시 쓴다. 마지막 장은 생성기에 들어온 이상 보고 네 가지에 맞는 손잡이를 고르는 과제다.
- 장 ID(map, vae, gan, cond, ddpm, latent, control, media, flow, var, eval, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-09-generative:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-generative`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-generative/tests/browser.cjs`.
- 전역 접두어는 `A09`(A09Book, A09Math, A09UI, A09Labs, A09Guides, A09Figures, A09Home), 서가 삽화 클래스 접두어는 `a09-ill-`이다.
- 실험은 실제 계산(커널 밀도, β-VAE 닫힌 해, GAN 축소 모형, 정확한 잡음 예측기로 돌린 DDIM과 가이던스, SDEdit 유지 확률, 정확한 주변 속도장의 플로 매칭, VAR 잔차 척도, 2차원 FID)과 교육용 가정값(비디오 압축 비율, VAR 밝기 줄), 미리 정한 시나리오(마지막 장 판정)를 결과 문장에서 구분해 밝힌다.
- 모델 이름·연도·수치는 원본 커리큘럼 기준(확인일 2026-10-08)으로만 쓴다. 새 수치를 지어내지 않는다.
