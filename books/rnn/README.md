# 순환 신경망 · 은닉 상태를 펼쳐 계산하고 LSTM으로 긴 순서 학습하기

기온 기록과 문장처럼 순서가 있는 자료를 읽는 순환 신경망을 다루는 정적 교과서입니다. RNN 셀의 은닉 상태를 시간 축으로 펼쳐 계산하고, 시간 방향 역전파에서 기울기가 사라지고 폭발하는 크기를 구하고, LSTM과 GRU의 게이트가 그 길을 어떻게 바꾸는지 견줍니다. 문장을 임베딩으로 바꿔 분류하고 검증 오차로 학습을 멈추는 법, RNN의 한계가 어텐션으로 이어진 까닭까지 13개 장과 13개 실험으로 다룹니다. 계산은 모두 브라우저에서 하며 유나의 온실 기록과 후기 문장은 지어낸 자료입니다.

- 실행: 저장소 루트에서 정적 서버를 띄우고 `books/rnn/`을 엽니다.
- 검사: `npm test`, `npm run browser`(Playwright 필요, `PW_EXECUTABLE_PATH`로 크로미움 경로 지정 가능).
- 제작·조사: [docs/index.html](docs/index.html), [docs/research.html](docs/research.html), [docs/fact-review.html](docs/fact-review.html)
