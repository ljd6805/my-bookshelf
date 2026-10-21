# Prisma · 데이터 모델에서 안전한 변경까지

10장과 10개 개념 실험으로 Prisma ORM 7의 데이터 접근을 학습합니다.

- 교과서: `index.html`
- 제작 문서: `docs/index.html`
- 공식 근거와 모형 경계: `docs/research.html`
- 실제 TypeScript·SQLite 실습: `docs/local-lab.html`, `examples/README.md`

브라우저 모형 검사:

```sh
npm test --prefix books/prisma
node books/prisma/tests/browser.cjs
node books/prisma/tests/shelf.cjs
```

브라우저 검사는 같은 프로세스에서 임시 로컬 서버를 열고 종료합니다. Playwright Chromium이 필요하며, 별도 바이너리는 `PW_EXECUTABLE_PATH`로 지정합니다. 외부 테스트 서버를 쓰려면 `BOOK_BASE_URL`을 지정합니다.
