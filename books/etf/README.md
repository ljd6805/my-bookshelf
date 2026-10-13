# 지수와 ETF · 기초지수·NAV·괴리율로 ETF 비교하기

정적 인터랙티브 교과서(「금융과 투자 처음부터」 7권). 가상 인물 하린이 같은 지수를 따라간다는 ETF 두 개의 값이 다른 화면에서 출발해 시가총액 방식 지수, 가중 방식별 지수 수익률, 설정·환매와 1좌당 NAV, 괴리율과 LP 호가, 추적 괴리·추적 오차와 총비용, 레버리지·인버스 ETF의 하루 재조정 매매, 기초자산별 iNAV와 복제 방식의 위험, 과세 유형, 목적별 비교표를 브라우저에서 직접 계산하고, 마지막에 장 마감 단일가 시간에 괴리율 +3.00%로 산 1,000만 원의 손익을 세 시점으로 따진다. 괴리율 기준과 LP 의무는 2026-10-13 보도·안내 기준이며, 학습용이고 투자 권유가 아니다. 저장소 루트에서 HTTP 서버를 실행하고 books/etf/를 연다.

검사: `npm test --prefix books/etf`

브라우저 검사: `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node books/etf/tests/browser.cjs` (빈 포트에 python3 http.server를 스스로 띄운다. `BOOK_URL`로 주소를 줄 수 있고, 결과는 `BOOK_EVIDENCE` 폴더, 기본은 임시 폴더. playwright 모듈을 찾지 못하면 `NODE_PATH=/opt/node22/lib/node_modules`를 붙인다)

제작·조사·검증: [docs/index.html](docs/index.html)
