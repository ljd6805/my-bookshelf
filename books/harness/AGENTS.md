# 에이전트 지침 파일
루트 AGENTS.md와 docs/08-book-template.html을 따른다. 화면 구조는 「LoRA의 원리」(books/lora-why/)를 본떠 AI Book 표준(머리말 메뉴, 표지·읽기 두 모드, 장 화면 일곱 블록)을 지킨다. 기획·교과과정·장 설계·문체 비평·제작 기록은 docs/index.html이, 사실과 출처는 docs/research.html이, 검수 기록은 docs/fact-review.html이 원본이다.

- **책**: id `agent-instruction-files`, 폴더 books/harness/, 제목 「에이전트 지침 파일 · 읽히는 방식과 쓰고 고치는 법」, 책등 “지침 파일”, 분류 인공지능, 색 amber. 12장(11장 + 마지막 과제), 실험 12개. 장 번호는 1장부터 센다(app.js가 index+1로 표시).
- **접두어**: 스크립트 전역은 `HN`(HNMath·HNBook·HNUI·HNLabs·HNGuides·HNHome·HNFigures), CSS·SVG 클래스는 `hn-`. 진도 키는 book-study.js가 정하는 bookshelf:harness:v1:study.
- **경계**: 에이전트 고리·작업대·범위 계약은 「에이전트 엔지니어링」(aie-agents), 스킬 포장은 「도구와 MCP」(aie-tools), 프롬프트 쓰기는 「LLM 활용」(aie-llm-apps)이 다룬다. 이 책은 세션마다 읽히는 지침 파일만 깊이 다룬다.
- **공통 사례**: 윤서(Claude Code)와 민호(Codex)의 저장소 booking-app(지어낸 예). 지침 파일 아홉 개와 내용은 js/math.js의 FILES가 원본이다.
- **사실의 출처**: 도구 동작은 공식 문서에서 확인한 것만 쓰고 확인일(2026-10-29)과 버전(v2.1.277, v2.1.283 등)을 함께 적는다. 문서가 정하지 않은 부분은 화면에 “이 책의 가정”으로 밝힌다. 모델이 지침을 따르는지는 계산하지 않는다.
- **계산 구분**: 찾기·합치기·크기·점검은 js/math.js가 실제로 계산한다. 작업 열두 개, 8주 기록, 사고 다섯 건, 어림 규칙은 이 책이 정한 시나리오이며 app.js의 KIND가 실험마다 밝힌다.
- **실제 예**: 이 저장소의 루트 AGENTS.md 수치(커밋 de2fda7 기준 133줄·12,512자·23,972바이트)를 고칠 때는 같은 커밋 기준으로 다시 세고 content.js의 출처 13과 tests를 함께 고친다.
- **안내 숫자**: js/lab-guides.js의 결과 읽기 숫자를 바꾸면 tests/math.test.cjs가 실제 계산과 대조한다.
- **다시 확인할 것**: 도구 문서는 자주 바뀐다. 다음 개정 때 docs/research.html의 “다시 확인할 것” 목록부터 공식 문서와 대조한다.
- **검사**: `npm test`(routes·math), `npm run browser`(Playwright, 저장소 루트에서 `python3 -m http.server 8783`, 1280·390·320px).
