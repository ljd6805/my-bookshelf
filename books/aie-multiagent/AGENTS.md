# 멀티 에이전트 · 여럿이 나눠 맡고 서로 확인하기 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-multiagent/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 17권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 Phase 16 · Multi-Agent & Swarms(레슨 25개)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 시청 정책팀이 맡긴 질문 “공공자전거 대여소를 내년에 30곳 늘려야 할까?”를 푸는 보고서 팀. 혼자 일하던 에이전트 하나가 반장·조사원 가·나·다·작성자·비평가·검증자로 나뉘고, 메시지 약속, 차례 정하기, 대기열, 토론과 합의, 흥정과 몫 나누기, 운영 장애를 차례로 겪는다. 기억 오염 장면에서는 원문의 “4.2% 증가”가 “42%”로 잘못 옮겨진다. 마지막 장은 시의회 보고 뒤 올라온 사고 세 건에 처방을 고르는 과제다.
- 장 ID(why, protocol, turn, supervisor, roles, swarm, debate, consensus, market, social, ops, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-17-multiagent:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-multiagent`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-multiagent/tests/browser.cjs`.
- 전역 접두어는 `A17`(A17Book, A17Math, A17UI, A17Labs, A17Guides, A17Figures, A17Home), 서가 삽화 클래스 접두어는 `a17-ill-`이다.
- 실험은 실제 계산(다수결 확률, 섀플리 값, 대기열 일정, 상태 전이, 재시도 부하의 반복 계산, 시드를 고정한 흥정·개미 군집·마음 모형 시뮬레이션)과 교육용 가정값(문서 토큰 수, 걸리는 시간, 버그를 잡는 비율, 연합 가치표, 에이전트의 답과 자신감)을 결과 문장에서 구분해 밝힌다. 실제 LLM은 부르지 않는다.
- 프레임워크·프로토콜·제품 이름과 논문 수치는 원본 커리큘럼 기준(확인일 2026-10-08)으로만 쓴다. 새 수치를 지어내지 않는다.
