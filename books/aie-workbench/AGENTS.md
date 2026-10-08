# AI 개발 작업대 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-workbench/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 01권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 Phase 0 · Setup & Tooling(레슨 12개)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 영화 리뷰 감성 분류 프로젝트 review-lab을 내 노트북, 빌린 GPU 상자, 팀원의 상자에서 같은 결과로 다시 돌리는 일. 모든 장의 문단과 실험이 이 프로젝트를 다시 쓴다. 마지막 장은 팀원의 고장 보고 네 가지에 확인 순서를 세우는 과제다.
- 장 ID(stack, envs, git, gpu, remote, docker, keys, notebook, data, debug, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-01-workbench:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-workbench`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-workbench/tests/browser.cjs`.
- 전역 접두어는 `A01`(A01Book, A01Math, A01UI, A01Labs, A01Guides, A01Figures, A01Home), 서가 삽화 클래스 접두어는 `a01-ill-`이다.
- 실험은 실제 계산(경로 표, 버전 비교, 권한 비트, 층 캐시, 시드 분할, 경사하강)과 교육용 가정값(빌드 시간, 점검 시간, 파일 크기, 로딩·계산 시간)을 결과 문장에서 구분해 밝힌다.
- 제품 이름·가격·버전은 원본 커리큘럼 기준(확인일 2026-10-08)으로만 쓴다. 새 수치를 지어내지 않는다.
