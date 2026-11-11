# 딥러닝 핵심 · 학습 설정을 고르고 손실 곡선으로 고장 찾기

「AI 엔지니어링 처음부터」 시리즈 4권. 원 판별기 하나를 옵티마이저, 학습률 일정, 초기화, 규제, 정규화로 안정되게 학습시키고 손실 곡선으로 고장을 찾습니다. 모든 학습은 브라우저 안에서 실제로 계산합니다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 `phases/03-deep-learning-core` 06~13 레슨을 한국어로 새로 썼습니다. 뉴런, 역전파, 활성화, 손실(01~05 레슨)은 앞 책 「신경망의 계산」(`books/neural/`)에 있습니다.

- 읽기: 저장소 루트에서 `python3 -m http.server 8765` 후 `http://127.0.0.1:8765/books/aie-deep/`
- 계산·경로 검사: `npm test --prefix books/aie-deep`
- 브라우저 검사: `BOOK_URL=http://127.0.0.1:8765/books/aie-deep/ node books/aie-deep/tests/browser.cjs`
- 제작 문서: `docs/index.html`, 서재 등록 제안: `docs/registration.json`
