# AI 인프라와 운영 · 모델 서버에서 운영 장부까지 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-production/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 18권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 Phase 17 · Infrastructure and Production(레슨 28개)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 다온의 상담 챗봇 누리봇. 쇼핑몰·병원 예약·유럽 매장 세 고객사가 하루 약 5만 건을 보내고, 요청마다 공통 접두부 2,000토큰·고객별 내용 500토큰·답 200토큰을 쓴다. 70B 모델을 H100 80GB에 올리는 결정에서 시작해 엔진 설정, 측정, 라우팅, 늘리고 줄이기, 청구서, 게이트웨이, 카나리, 사고 대응까지 한 서비스를 운영한다. 마지막 장은 월요일 아침 운영 보고 세 가지에 처방을 골라 지표가 움직이는지 확인하는 과제다.
- 장 ID(platform,precision,engine,metrics,speculative,locality,scaling,cost,gateway,rollout,incident,final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-18-production:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-production`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-production/tests/browser.cjs`.
- 전역 접두어는 `A18`(A18Book, A18Math, A18UI, A18Labs, A18Guides, A18Figures, A18Home), 서가 삽화 클래스 접두어는 `a18-ill-`이다.
- 서재의 LLM 시스템(books/llm-gpu)·LLM 성능(books/llm-performance) 책과 겹치는 내용(페이지 KV, 연속 배치, 지표 정의, 가중치 형식)은 요약하고 그 책의 장으로 링크한다. 이 책은 운영 결정과 비용에 집중한다.
- 실험은 실제 계산(손익분기, HBM 예산, 대역폭 상한, 청크 프리필 시간, 추측 디코딩 기대 토큰, KV 크기, 청구액, 재시도 확률, 카나리 관문 확률, 소진 속도, 표본 확률)과 미리 정한 시나리오(합성 지연 분포, 라우팅 시뮬레이션, 콜드 스타트 단계 시간, 계단식 라우팅)를 결과 문장에서 구분해 밝힌다. 난수는 시드를 고정한다.
- 가격·제품 상태·버전 같은 바뀌기 쉬운 사실은 원본 커리큘럼 기준(확인일 2026-10-08)으로만 쓰고 교육용 가정이라고 밝힌다. 새 수치를 지어내지 않는다.
