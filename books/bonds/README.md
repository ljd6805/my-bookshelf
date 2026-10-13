# 금리와 채권 · 기준금리에서 채권 가격까지

정적 인터랙티브 교과서(「금융과 투자 처음부터」 3권). 가상 인물 하린이 예금 3.5%, 신용대출 6%대, 국채 광고의 “평균 연 6.0%”, 기준금리 3.00%에서 출발해 금리가 누가 누구에게 내는 값인지, 기준금리가 시장으로 번지는 길, 채권의 현금흐름·가격·만기수익률, 듀레이션과 볼록성, 수익률 곡선(교육용 모형), 신용 스프레드, 할인율로 본 주식, 채권을 갖는 길을 브라우저에서 직접 계산하고, 마지막에 금리 인하가 예고된 해의 다섯 상품을 세 갈래로 나누어 적는다. 투자 권유도 금리 예측도 아니다. 저장소 루트에서 HTTP 서버를 실행하고 books/bonds/를 연다.

검사: `npm test --prefix books/bonds`

브라우저 검사: `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node books/bonds/tests/browser.cjs` (빈 포트에 python3 http.server를 스스로 띄운다. `BOOK_URL`로 주소를 줄 수 있고, 결과는 `BOOK_EVIDENCE` 폴더, 기본은 임시 폴더. playwright 모듈을 찾지 못하면 `NODE_PATH=/opt/node22/lib/node_modules`를 붙인다)

제작·조사·검증: [docs/index.html](docs/index.html)
