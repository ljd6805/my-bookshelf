# 기업 가치 평가 · 배수 비교와 현금흐름 할인으로 주당 가치의 범위 계산하기

정적 인터랙티브 교과서(「금융과 투자 처음부터」 6권). 가상의 회사 새벽전자(주가 20,000원, 1,000만 주)를 두고 시가총액·EPS·BPS, PER·PBR·ROE, 배당수익률과 요구수익률, EV/EBITDA로 가상의 비교 회사와 견준 뒤, FCFF를 예측하고 WACC로 할인해 영구가치를 더한 DCF 주당 가치 22,750원을 브라우저에서 직접 계산한다. DCF 민감도 표로 가정별 변화 폭을 재고, 주가에 담긴 가정을 거꾸로 풀며, 마지막에 가상의 분석가 A(31,833원)와 B(15,867원)의 차이를 가정별로 나눈다. 금리와 위험 프리미엄은 2026-10-08 확인 기준이며, 학습용 계산이고 투자 권유가 아니다. 저장소 루트에서 HTTP 서버를 실행하고 books/valuation/을 연다.

검사: `npm test --prefix books/valuation`

브라우저 검사: `NODE_PATH=/opt/node22/lib/node_modules node books/valuation/tests/browser.cjs` (빈 포트에 python3 http.server를 스스로 띄운다. `BOOK_URL`로 주소를, `PW_EXECUTABLE_PATH`로 chromium 경로를 줄 수 있고, 결과는 `BOOK_EVIDENCE` 폴더, 기본은 임시 폴더)

제작·조사·검증: [docs/index.html](docs/index.html)
