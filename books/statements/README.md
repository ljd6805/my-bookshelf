# 재무제표 읽기 · 세 재무제표를 맞춰 보고 비율과 현금흐름으로 위험 신호 찾기

정적 인터랙티브 교과서(「금융과 투자 처음부터」 5권). 가상 인물 하린이 가상의 회사 새벽전자의 “순이익 21% 증가, 현금 54% 감소” 기사에서 출발해 발생주의, 재무상태표, 손익계산서, 간접법 현금흐름표를 브라우저에서 직접 계산하고, 세 재무제표를 대조 네 줄로 맞춘 뒤 비율·발생액 비율로 위험 신호를 찾으며, DART의 보고서·제출 기한·감사의견과 업종 차이를 확인한다. 마지막에 FY2024와 FY2025를 견주어 확인할 항목과 시점을 정한다. 제출 기한과 감사의견에 따른 조치는 2026-10-13 확인 기준이며, 학습용이고 투자 권유가 아니다. 저장소 루트에서 HTTP 서버를 실행하고 books/statements/를 연다.

검사: `npm test --prefix books/statements`

브라우저 검사: `NODE_PATH=/opt/node22/lib/node_modules node books/statements/tests/browser.cjs` (빈 포트에 python3 http.server를 스스로 띄운다. `BOOK_URL`로 주소를, `PW_EXECUTABLE_PATH`로 chromium 경로를 줄 수 있고, 결과는 `BOOK_EVIDENCE` 폴더, 기본은 임시 폴더)

제작·조사·검증: [docs/index.html](docs/index.html)
