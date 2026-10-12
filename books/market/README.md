# 주문 한 장이 체결되기까지 · 한국 증권시장의 구조와 규칙

정적 인터랙티브 교과서. 가상 투자자 하린이 가상 종목 새벽전자에 낸 주문 한 장을 따라가며 호가창, 가격·시간 우선, 단일가 매매, 호가단위, 가격제한폭과 VI, 기준가 조정, T+2 결제, 수수료와 거래세, 거래 시간을 브라우저에서 직접 계산한다. 투자 권유가 아니다. 저장소 루트에서 HTTP 서버를 실행하고 books/market/을 연다.

검사: `npm test --prefix books/market`

브라우저 검사: `BOOK_URL=http://127.0.0.1:8765/books/market/ PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node books/market/tests/browser.cjs` (결과는 `BOOK_EVIDENCE` 폴더, 기본은 임시 폴더)

제작·조사·검증: [docs/index.html](docs/index.html)
