# LoRA 미세조정
루트 AGENTS.md와 docs/08-book-template.html을 따른다. 화면 구조는 「정보는 몇 비트인가」(books/information/)를 본떠 AI Book 표준(머리말 메뉴, 표지·읽기 두 모드, 장 화면 일곱 블록)을 지킨다. 기획·교과과정·장 설계·문체 비평·제작 기록은 docs/index.html이, 사실과 출처는 docs/research.html이, 검수 기록은 docs/fact-review.html이 원본이다.

- **책**: id `lora`, 폴더 books/lora/, 제목 「LoRA 미세조정 · 저랭크 행렬로 학습할 파라미터와 GPU 메모리 줄이기」, 책등 “LoRA 원리”, 분류 인공지능(트랜스포머 속 다음), 색 violet. 13장(12장 + 마지막 과제), 실험 13개.
- **접두어**: 스크립트 전역은 `LR`(LRMath·LRBook·LRUI·LRLabs·LRGuides·LRHome·LRFigures), CSS·SVG 클래스는 `lr-`. 진도 키는 book-study.js가 정하는 bookshelf:lora:v1:study.
- **공통 사례**: 지어낸 인물 하린. 7B 모델을 GPU 24GB 한 장에서 회사 문서 말투로 미세조정하려다 메모리가 모자라고, 마지막 과제에서는 13B·24GB·문서 2,000쌍·말투 목표로 방법을 고른다.
- **계산 구분**: js/math.js가 모든 계산을 하며 tests/math.test.cjs가 대표값·경계값을 검사한다. 1·5·8·11·12장과 마지막 과제는 공개 설정 파일(Llama 2 7B·13B는 NousResearch 미러, Mistral 7B는 공식)의 구조로 실제 계산한다. 활성값은 독자가 넣는 가정값이다. 2·3·4·6·7·10장은 고정 씨앗 장난감 행렬의 실제 계산이며 논문 수치를 재현한다고 쓰지 않는다. 논문 수치는 docs/research.html에서 원문으로 확인한 것만 쓴다.
- **안내 숫자**: js/lab-guides.js의 결과 읽기 숫자를 바꾸면 tests/math.test.cjs의 대응 값도 함께 확인한다.
- **연결**: 12장은 「연합학습」 책(books/federated/, 다른 스레드에서 제작)과 서로 잇는다. 그 책이 main에 오르기 전까지 본문에 “준비 중”으로 적고, 나중에 병합하는 쪽이 ../federated/#장ID 링크를 잇는다(tests/routes.test.cjs가 둘 중 하나를 검사).
- **검사**: `npm test`(routes·math), `npm run browser`(Playwright, 저장소 루트에서 `python3 -m http.server 8783`, 1280·390·320px).
