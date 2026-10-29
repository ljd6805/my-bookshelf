# 에이전트 지침 파일 · AGENTS.md·CLAUDE.md가 읽히는 방식과 쓰고 고치는 법

코딩 에이전트가 세션마다 읽는 마크다운 지침 파일을 다루는 정적 교과서입니다. 윤서 팀의 저장소(지어낸 예)에서 Claude Code와 Codex가 작업 폴더에 따라 지침 파일을 찾고, 이어 붙이고, 크기 한도에서 자르는 규칙을 공식 문서(확인일 2026-10-29)대로 계산합니다. 지침으로는 막을 수 없는 규칙과 길이·보안의 함정, 검사할 수 있는 줄을 쓰고 알맞은 파일에 두는 법, 실수 기록으로 지침을 더하고 정리하는 주기를 12개 장과 12개 실험으로 다루고, 마지막 과제에서 사고 기록 다섯 건을 진단합니다.

- 실행: 저장소 루트에서 정적 서버를 띄우고 `books/harness/`를 엽니다.
- 검사: `npm test`, `npm run browser`(Playwright 필요, `PW_EXECUTABLE_PATH`로 크로미움 경로 지정 가능).
- 제작·조사: [docs/index.html](docs/index.html), [docs/research.html](docs/research.html), [docs/fact-review.html](docs/fact-review.html)
