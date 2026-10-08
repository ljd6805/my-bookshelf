# 검색과 RAG
루트 AGENTS.md와 docs/08-book-template.html을 따른다.
- 공통 사례는 가상의 한빛시립도서관 안내 문서 13개와 질문 13개(답 없는 질문 3개 포함)다. 장마다 같은 문서와 질문을 쓴다.
- 문서·질문·정답 표시를 바꾸면 본문·안내 상자·그림 캡션의 숫자가 함께 바뀐다. `npm test`의 숫자 검사를 먼저 고치고 문장을 맞춘다.
- 실제 계산(역색인·BM25·조각·혼합·평가)과 교육용 모형(손으로 정한 7차원 임베딩, 학습하지 않은 재순위), 시나리오(1장 근거 없는 답)를 구분해 적는다.
- 토큰은 어절 × 1.5 어림값, KV는 LLM 시스템 책의 가상 8B 모델(토큰당 128 KiB)과 같게 유지한다.
- 계산은 js/math.js, 본문은 js/content.js, 조작은 js/labs-*.js, 개념 그림은 js/figures.js에서 관리한다. 전역 이름은 R 접두어(RMath, RBook, RUI, RLabs, RGuides, RFigures, RHome)를 쓴다.
- npm test와 tests/browser.cjs를 실행하고 docs/index.html에 검증 범위를 기록한다.
