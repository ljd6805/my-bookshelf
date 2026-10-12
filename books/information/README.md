# 정보는 몇 비트인가 · 엔트로피에서 압축과 토큰까지

정적 인터랙티브 교과서. 지어낸 문자 메시지 묶음으로 정보량, 엔트로피, 허프만 부호, 산술 부호, LZ78과 BPE, 해밍(7,4), 확률표 양자화를 브라우저에서 직접 계산한다. 저장소 루트에서 HTTP 서버를 실행하고 books/information/를 연다.

검사: `npm test --prefix books/information`

기준값 다시 만들기: `python3 books/information/tests/reference.py`

브라우저 검사: 저장소 루트에서 `python3 -m http.server 8781`을 띄운 뒤 `BOOK_URL=http://127.0.0.1:8781/books/information/ node books/information/tests/browser.cjs` (playwright 필요, `PW_EXECUTABLE_PATH`로 크로미움 경로 지정 가능)

제작·가정·검증: [docs/index.html](docs/index.html), 조사 노트: [docs/research.html](docs/research.html)
