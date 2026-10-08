# AI Book 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/ai/`이다. 이전 `ai-book-interactive` 저장소로 수정사항을 보내지 않는다.
- 루트 `AGENTS.md`의 공통 규칙을 따른다. 책 전용 본문·실험·자산·테스트는 이 폴더에 둔다.
- `js/content.js`의 12개 장 ID와 기존 hash 링크를 유지한다.
- 장을 추가하거나 ID를 바꾸면 `index.html`의 `book-routes` 메타데이터와 카탈로그 목차를 함께 갱신한다.
- 다른 책의 내부 JavaScript를 직접 가져오지 않는다. 공유 모듈은 실제 중복과 변경 영향이 확인된 뒤 도입한다.
- 머리말의 서가로 돌아가기 버튼(`data-shelf-return`, `../../index.html#books`)을 유지한다. 기준은 `docs/07-book-integration.html#shelf-return`이다.
- 루트에서 `npm test --prefix books/ai`, `node --test tests/test_shelf_model.mjs`, `python3 scripts/validate.py`를 실행한다.
- 실험 코드를 바꾸면 해당 입력·출력·초기화를 실제 브라우저에서 검증한다. 기존 `docs/` 기록은 이전 시점의 검증 결과이며 현재 결과로 간주하지 않는다.
