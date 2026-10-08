# 캡스톤 · 배운 도구로 제품 하나를 끝까지 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-capstone/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 20(마지막 권)권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 Phase 19 · Capstone Projects(큰 프로젝트 17개와 구현 트랙 레슨 68개, 모두 85개)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 여섯 명의 플랫폼 팀이 개발자 200명을 위해 만드는 사내 AI 개발 도우미 모루. 에이전트 고리와 검증, 팀형 제품, 자동 연구, 작은 GPT 조립과 사후 학습, 분산 학습, RAG, 다중 모달, 평가 하네스, 안전 게이트를 차례로 붙이며, 사양표의 네 칸(월 예산·p95 지연·통과율·위험)을 매 장 다시 계산한다. 마지막 장은 사용량이 두 배가 된 달에 다섯 줄 목표를 동시에 지키는 출시 사양표 과제다.
- 장 ID(harness, verify, products, research, gpt, posttrain, scale, rag, multimodal, evals, safety, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-20-capstone:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-capstone`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-capstone/tests/browser.cjs`.
- 전역 접두어는 `A20`(A20Book, A20Math, A20UI, A20Labs, A20Guides, A20Figures, A20Home), 서가 삽화 클래스 접두어는 `a20-ill-`이다.
- 원본 프로젝트 85개는 12장에 빠짐없이 나누어 각 장의 "더 깊이 보기" 첫 상자에 한두 줄씩 정리했다. 대응표는 docs/index.html#mapping이다. 장을 옮기거나 합치면 대응표와 content.js의 source 번호를 함께 고친다.
- 실험은 실제 계산(재시도·재계획 확률, pass@k, 포아송 발견 시간, 손익분기, 매개변수 수, DPO 닫힌 식, ZeRO 바이트, 파이프라인 거품, 검색 지표, 패치 수, 부트스트랩 구간, 탐지율·정밀도, 사양표 조합)과 교육용 가정값(대기 시간, 성공 지연, 참 평균, 순위 목록, 탐지기 점수 분포, 가격·통과율·층 효과)을 결과 문장에서 구분해 밝힌다. 난수는 시드를 고정한다.
- 수치와 이름은 원본 커리큘럼 기준(확인일 2026-10-08)으로만 쓴다. 원본 레슨 42의 LSH 설정(b=32, r=4)은 문턱이 약 0.42라는 계산을 함께 적었으니, 원본 주장(0.8 겨냥)을 그대로 옮기지 않는다.
- 시리즈 이전 권은 ../aie-safety/(19권)이고 다음 권은 없다. 밖으로 나가는 cross 링크는 01~10권과 기존 책(ai, llm-gpu, probability 등)의 book-routes 장 ID로만 둔다.
