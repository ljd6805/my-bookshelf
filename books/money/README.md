# 돈의 시간 가치 · 이자와 복리에서 현재가치까지

정적 인터랙티브 교과서(「금융과 투자 처음부터」 1권). 가상 인물 하린의 1,000만 원과 신용대출 600만 원을 따라가며 기회비용, 단리와 복리, 72의 법칙과 실효 금리, 현재가치, 대출 상환표, 순현재가치와 내부수익률, 실질 수익률, 연환산 수익률, 비용의 복리를 브라우저에서 직접 계산한다. 금융상품 권유가 아니다. 저장소 루트에서 HTTP 서버를 실행하고 books/money/를 연다.

검사: `npm test --prefix books/money`

브라우저 검사: `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node books/money/tests/browser.cjs` (빈 포트에 python3 http.server를 스스로 띄운다. `BOOK_URL`로 주소를 줄 수 있고, 결과는 `BOOK_EVIDENCE` 폴더, 기본은 임시 폴더)

제작·조사·검증: [docs/index.html](docs/index.html)
