# 트랜스포머 깊이 보기 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-transformer/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 08권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 Phase 7 · Transformers Deep Dive(레슨 16개)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 작은 한국어 언어 모델 ‘도란’의 설계표를 장마다 한 칸씩 채운다. 예문은 “나는 어제 산 책을 오늘 다 읽었다”(7토큰)이고, 마지막 낱말 ‘읽었다’가 ‘책을’을 참고해야 하는 관계를 모든 어텐션 실험이 다시 쓴다. 마지막 장은 운영팀의 새 요구 세 가지(문맥 32K, 속도 1.5배, 같은 계산으로 손실 낮추기)에 설계표의 어느 칸을 바꿀지 판단하는 과제다.
- 장 ID(why, selfattn, multihead, position, block, bertgpt, encdec, moe, memory, scaling, speculative, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다. KV 캐시 원리(LLM 시스템 #cache), 샘플링(AI Book #generation)처럼 서재의 다른 책이 깊게 다룬 내용은 요약과 링크로 처리한다.
- 진도 저장 키: `bookshelf:aie-08-transformer:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 전역 접두어는 `A08`(A08Book, A08Math, A08UI, A08Labs, A08Guides, A08Figures, A08Home), 서가 삽화 클래스 접두어는 `a08-ill-`, 책 전용 CSS 클래스는 `a08-`이다.
- 무작위 벡터는 모두 시드를 고정한다(mulberry32). 실험은 실제 계산(softmax, RoPE, 정규화, 마스크, 타일 softmax, 라우팅, KV 크기, Chinchilla 식, 추측 디코딩 기대값)과 책의 가정(라우터 점수 치우침, 도란의 크기, 디코드 속도를 메모리 읽기량으로 어림)을 결과 문장에서 구분해 밝힌다.
- 모델 이름·크기·비율은 원본 커리큘럼 기준(확인일 2026-10-08)으로만 쓴다. 새 수치를 지어내지 않는다.
- 검사: `npm test --prefix books/aie-transformer`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `BOOK_URL=http://127.0.0.1:8765/books/aie-transformer/ node books/aie-transformer/tests/browser.cjs`.
