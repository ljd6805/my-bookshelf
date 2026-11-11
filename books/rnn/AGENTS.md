# 순환 신경망
루트 AGENTS.md와 docs/08-book-template.html을 따른다. 화면 구조는 「에이전트 지침 파일」(books/harness/)을 본떠 AI Book 표준(머리말 메뉴, 표지·읽기 두 모드, 장 화면 일곱 블록)을 지킨다. 기획·교과과정·장 설계·문체 비평·제작 기록은 docs/index.html이, 사실과 출처는 docs/research.html이, 검수 기록은 docs/fact-review.html이 원본이다.

- **책**: id `recurrent-networks`, 폴더 books/rnn/, 제목 「순환 신경망 · 은닉 상태를 펼쳐 계산하고 LSTM으로 긴 순서 학습하기」, 책등 “순환신경망”, 분류 인공지능, 색 amber. 13장(12장 + 마지막 과제), 실험 13개. 장 번호는 1장부터 센다(app.js가 index+1로 표시).
- **접두어**: 스크립트 전역은 `RN`(RNMath·RNBook·RNUI·RNLabs·RNGuides·RNHome·RNFigures), CSS·SVG 클래스는 `rn-`. 진도 키는 book-study.js가 정하는 bookshelf:rnn:v1:study.
- **경계**: 퍼셉트론·역전파·옵티마이저·초기화는 「딥러닝 핵심」(aie-deep), n-gram·word2vec·번역 정렬은 「자연어 처리」(aie-nlp), 셀프 어텐션부터는 「트랜스포머 깊이 보기」(aie-transformer)가 다룬다. 이 책은 RNN 셀에서 LSTM·GRU, 문장 분류, RNN의 한계까지만 다룬다.
- **공통 사례**: 유나의 토마토 온실 기온 기록(하루 주기 + 닷새 주기 + 잡음의 합성 자료, js/math.js의 series)과 토마토 후기 40문장(REVIEWS 32, HELD_OUT 8). 모두 지어낸 것이다.
- **원자료와의 관계**: 서재 주인의 사내 교육 자료(RNN 강의 다섯 편)와 필기 노트에서는 다룰 주제의 순서와 강조점만 참고했다. 슬라이드의 문장·그림·코드를 옮기지 않는다. PyTorch 코드 상자는 공식 문서를 보고 새로 쓴 읽기용이며 실험은 PyTorch를 실행하지 않는다.
- **계산 구분**: 순전파·BPTT·학습·분류는 js/math.js가 실제로 계산한다(수치 미분과 대조). 4장의 과제 분류와 마지막 과제의 기록 다섯 건은 이 책이 정한 시나리오이며 app.js의 KIND가 실험마다 밝힌다.
- **초기값**: 후기 분류기는 seed 10(학습에 없던 8문장을 모두 맞힘)을 쓴다. 초기값 1~12에서 맞힌 수는 2~8개로 퍼지며 본문과 안내가 이를 밝힌다. 모델이나 자료를 고치면 이 범위를 다시 재고 문장을 고친다.
- **안내 숫자**: js/lab-guides.js의 결과 읽기와 content.js 본문의 숫자를 바꾸면 tests/math.test.cjs가 실제 계산과 대조한다.
- **검사**: `npm test`(routes·math), `npm run browser`(Playwright, 저장소 루트에서 `python3 -m http.server 8791`, 1280·390·320px).
