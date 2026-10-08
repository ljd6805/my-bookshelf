# LLM 직접 만들기 · 토크나이저에서 정렬과 서빙까지

「AI 엔지니어링 처음부터」 시리즈 11권. 서재의 책을 추천하는 작은 LLM "서재봇"을 바이트 단위 토크나이저에서 출시 매니페스트까지 만들며, 데이터 정제·사전학습과 규모의 법칙·학습 메모리와 병렬화·SFT·DPO·GRPO·평가·양자화·추측 디코딩·오픈 모델 설정 읽기를 브라우저 실험 16개로 배웁니다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 `phases/10-llms-from-scratch` 24개 레슨을 한국어로 새로 썼습니다.

- 읽기: 저장소 루트에서 `python3 -m http.server 8765` 후 `http://127.0.0.1:8765/books/aie-llm-build/`
- 계산·경로 검사: `npm test --prefix books/aie-llm-build`
- 브라우저 검사: `BOOK_URL=http://127.0.0.1:8765/books/aie-llm-build/ node books/aie-llm-build/tests/browser.cjs`
- 제작 문서: `docs/index.html`, 서재 등록 제안: `docs/registration.json`
