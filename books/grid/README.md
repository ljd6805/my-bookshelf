# 격자 하나에서 손익이 갈리기까지 · 그리드 매매의 원리

정적 인터랙티브 교과서(「금융과 투자 처음부터」 12권). 가상 인물 하린이 가상의 회사 새벽전자 주식에 18,000~22,000원 · 200원 · 20칸 격자를 깔고, 칸 하나의 손익과 최소 간격, 등차·등비 격자, 범위와 자금, 박스권·상승·하락·갭에서의 장부, 다른 방법과의 비교, 멈춤 규칙, 6개월 장부를 브라우저에서 직접 계산한다. 매매 권유가 아니다. 저장소 루트에서 HTTP 서버를 실행하고 books/grid/를 연다.

검사: `npm test --prefix books/grid`

브라우저 검사: `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node books/grid/tests/browser.cjs` (빈 포트에 python3 http.server를 스스로 띄운다. `BOOK_URL`로 주소를 줄 수 있고, 결과는 `BOOK_EVIDENCE` 폴더, 기본은 임시 폴더)

제작·조사·검증: [docs/index.html](docs/index.html)
