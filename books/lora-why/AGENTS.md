# LoRA의 원리
루트 AGENTS.md와 docs/08-book-template.html을 따른다. 화면 구조는 「LoRA 미세조정」(books/lora/)을 본떠 AI Book 표준(머리말 메뉴, 표지·읽기 두 모드, 장 화면 일곱 블록)을 지킨다. 기획·교과과정·장 설계·문체 비평·제작 기록은 docs/index.html이, 사실과 출처는 docs/research.html이, 검수 기록은 docs/fact-review.html이 원본이다.

- **책**: id `lora-principles`, 폴더 books/lora-why/, 제목 「LoRA의 원리 · 저랭크 변화만으로 미세조정이 되는 이유 확인하기」, 책등 “LoRA 원리”, 분류 인공지능(연합학습 다음), 색 blue. 12장(11장 + 마지막 과제), 실험 12개.
- **접두어**: 스크립트 전역은 `LW`(LWMath·LWBook·LWUI·LWLabs·LWGuides·LWHome·LWFigures), CSS·SVG 클래스는 `lw-`. 진도 키는 book-study.js가 정하는 bookshelf:lora-why:v1:study.
- **경계**: 메모리·파라미터 수·QLoRA·서빙은 「LoRA 미세조정」이 다룬다. 이 책은 왜 저랭크로 되는지만 다루고, 그 책의 내용을 다시 쓰지 않는다.
- **공통 사례**: 「LoRA 미세조정」 마지막 과제의 하린(지어낸 인물). 팀장이 “왜 됐나”와 “개발팀에도 같은 설정을 권할까”를 묻는다.
- **계산 구분**: 모든 실험은 js/math.js가 고정 씨앗 16×16 선형층 장난감에서 실제로 계산한다. 작업 계열(말투 m=3·형식 m=5·새 능력 m=12)과 세 시험 작업, 95% 판정선은 이 책이 정한 것이다. 논문 수치는 docs/research.html에서 원문으로 확인한 것만 조건과 함께 쓰고, 장난감 수치와 한 문장에서 비교하지 않는다.
- **안내 숫자**: js/lab-guides.js의 결과 읽기 숫자를 바꾸면 tests/math.test.cjs가 실제 계산과 대조한다.
- **검사**: `npm test`(routes·math), `npm run browser`(Playwright, 저장소 루트에서 `python3 -m http.server 8783`, 1280·390·320px).
