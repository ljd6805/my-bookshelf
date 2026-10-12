# 가격은 어떻게 흔들리는가 · 수익률과 변동성의 수학

정적 인터랙티브 교과서(「금융과 투자 처음부터」 8권). 가상 인물 하린이 −50% 다음 +50%에서 출발해 단순·로그 수익률, 날마다 2배로 맞추는 가상 상품의 변동성 손실, 표준편차·연율화·ATR, 무작위 보행과 두꺼운 꼬리, 자기상관·분산비·구간 통과 횟수·최대 낙폭을 브라우저에서 직접 계산하고, 마지막에 1년 기록 두 장을 같은 흔들림의 무작위 보행과 견준다. 투자 권유가 아니다. 저장소 루트에서 HTTP 서버를 실행하고 books/volatility/를 연다.

검사: `npm test --prefix books/volatility`

브라우저 검사: `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node books/volatility/tests/browser.cjs` (빈 포트에 python3 http.server를 스스로 띄운다. `BOOK_URL`로 주소를 줄 수 있고, 결과는 `BOOK_EVIDENCE` 폴더, 기본은 임시 폴더. playwright 모듈을 찾지 못하면 `NODE_PATH=/opt/node22/lib/node_modules`를 붙인다)

제작·조사·검증: [docs/index.html](docs/index.html)
