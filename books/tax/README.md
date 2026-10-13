# 세금과 계좌 · 같은 수익, 다른 세후 수익

정적 인터랙티브 교과서(「금융과 투자 처음부터」 11권). 가상 인물 하린이 배당 20만 원이 169,200원으로 들어온 거래 내역에서 출발해 투자 한 건에서 세금이 빠지는 네 시점, 증권거래세, 이자·배당 원천징수와 분리과세, 양도소득세와 대주주 기준, 금융소득종합과세, ETF·채권의 과세 방식, ISA, 연금저축과 IRP를 브라우저에서 직접 계산하고, 세후 수익 계산기로 같은 투자를 계좌별로 견준 뒤 1,000만 원을 세 계좌에 나눈 세 배분안의 세후 금액을 비교한다. 세율과 한도는 2026-10-13 보도 기준이며, 학습용이고 세무 상담이나 투자 권유가 아니다. 저장소 루트에서 HTTP 서버를 실행하고 books/tax/를 연다.

검사: `npm test --prefix books/tax`

브라우저 검사: `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node books/tax/tests/browser.cjs` (빈 포트에 python3 http.server를 스스로 띄운다. `BOOK_URL`로 주소를 줄 수 있고, 결과는 `BOOK_EVIDENCE` 폴더, 기본은 임시 폴더. playwright 모듈을 찾지 못하면 `NODE_PATH=/opt/node22/lib/node_modules`를 붙인다)

제작·조사·검증: [docs/index.html](docs/index.html)
