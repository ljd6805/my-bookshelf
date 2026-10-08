# 멀티모달 AI · 보고 듣고 말하는 모델 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-multimodal/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 13권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 phases/12-multimodal-ai(25개 레슨)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 세탁기 A/S 센터 상담 도우미. 고객이 보낸 E-21 표시창 사진, 탈수 소음 녹음, 90초 드럼 영상, 48쪽 스캔 설명서, 수리 예약 웹페이지를 장마다 하나씩 더 읽는다. 마지막 장에서는 건조기 고객(6분 영상 속 0.3초 불꽃, 손글씨 보증서, 영어 120쪽 설명서, 모바일 앱 예약)으로 바뀐 상황을 같은 도구로 다시 설계한다.
- 장 ID(patches, clip, bridge, recipe, anyres, video, voice, tokens, unified, action, docs, agent)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-13-multimodal:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-multimodal`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-multimodal/tests/browser.cjs`.
- 표에 쓰인 장난감 벡터·단계별 지연·디코딩 속도는 예시나 가정이며 화면에 그렇게 밝힌다. 원본 레슨과 인용 논문에 없는 수치를 새로 만들지 않는다.
- 콘텐츠에 `<image>` 같은 꺾쇠 토큰을 쓸 때는 `&lt;image&gt;`로 적는다. 그대로 쓰면 HTML 태그로 해석된다.
