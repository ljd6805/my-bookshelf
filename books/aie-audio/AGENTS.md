# 음성과 오디오 · 파형에서 대화하는 목소리까지 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-audio/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 07권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 Phase 6 · Speech & Audio(레슨 17개)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 후드 팬이 도는 부엌의 음성 비서 솔이. 첫 장부터 마지막 장까지 “솔아, 타이머 오 분 맞춰 줘” 한 문장을 받아 적고, 알아듣고, 대답하고, 출시 뒤 불만을 진단한다.
- 장 ID(wave, mel, classify, asr, whisper, speaker, tts, codec, pipeline, turn, safety, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-07-audio:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-audio`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-audio/tests/browser.cjs`.
- 전역 이름 접두어는 `A07`(A07Math, A07UI, A07Labs, A07Guides, A07Book), 서가 삽화 클래스·id 접두어는 `a07-ill-`, 상태 목록 클래스는 `a07-rows`·`a07-cells`이다.
- 실험은 실제 음성을 녹음하거나 모델을 돌리지 않는다. 결과 문장마다 실제 계산·이 책의 가정값·미리 정한 시나리오를 구분해 적는다. 모델 이름·벤치마크·규제 일정은 “원본 커리큘럼 기준(확인일 2026-10-08)”으로 쓰고 공식 출처로 다시 확인한다.
- 이 책의 강조색은 산호색이다. 그림·결과 문장에서 색 이름(초록 등)에 기대지 말고 글자·모양으로도 상태를 알린다.
- 서재 등록 제안(장 색인·공통 개념·읽기 노선·들어오는 링크)은 `docs/registration.json`에 있다. 등록은 서재 관리자가 `data/catalog.json`과 `scripts/build_catalog.py`로 한다.
