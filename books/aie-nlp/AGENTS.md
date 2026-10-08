# 자연어 처리 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-nlp/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 06권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 Phase 5 · NLP — Foundations to Advanced(레슨 29개)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 온라인 서점 “마루책방”의 고객 문의함(문의 여덟 통, 리뷰 열두 개, 약관 열두 문장, 다섯 턴 대화). 모든 장의 문단과 실험이 이 문의함을 다시 쓴다. 마지막 장은 해외 문의와 긴 약관이 들어왔을 때 무엇을 바꾸고 어떤 증거가 부족한지 답하는 과제다.
- 장 ID(clean, tfidf, vectors, topics, sentiment, tagging, sequence, seq2seq, answer, links, dialog, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-06-nlp:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-nlp`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-nlp/tests/browser.cjs`.
- 전역 접두어는 `A06`(A06Book, A06Math, A06UI, A06Labs, A06Guides, A06Figures, A06Home), 서가 삽화 클래스 접두어는 `a06-ill-`, 실험 화면 클래스는 `a06-`이다.
- 실험은 실제 계산(토큰화, BPE, TF-IDF, 나이브 베이즈, 비터비, 퍼플렉서티, 어텐션, BLEU, 청킹 경계, 자카드 연결 점수, 상태 일치)과 교육용 가정값(단어 벡터, 주제 분포, HMM 확률표, 문장 길이, 사전 확률)과 교육용 모형(JSON 유효율의 독립 가정, 긴 문맥 정답률 곡선)을 결과 문장에서 구분해 밝힌다.
- 겹치는 내용(토큰, 임베딩, 어텐션, RAG, 코사인 유사도)은 AI Book·선형대수 책으로 cross 링크를 걸고 짧게 요약한다. 아직 없는 시리즈 권(검색과 RAG, 지식 그래프 등)으로는 링크하지 않는다.
