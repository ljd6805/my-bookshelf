# 컴퓨터는 어떻게 동작하는가 · 스위치에서 CPU까지

계산기에서 3 + 4를 누르면 화면에 7이 뜨기까지를 9개 장과 9개 실험으로 따라가는 한국어 정적 웹 교과서입니다.

- 공개 주소: https://ljd6805.github.io/my-bookshelf/books/computer/
- 기획서·모형 경계·검증 기록: `docs/index.html`

## 실행과 테스트

저장소 루트에서 실행합니다.

```sh
python3 -m http.server 8000
npm test --prefix books/computer
node books/computer/tests/browser.cjs   # Playwright 필요, 서버 실행 중
```

`js/model.js`(비트·게이트·가산기), `js/cpu.js`(교육용 8비트 CPU), `js/cache.js`(직접 사상 캐시)는 화면과 분리된 계산 모형입니다.
`js/labs-*.js`가 실험 화면을, `js/app.js`가 실험 연결과 읽은 장 표시를 맡습니다. 외부 의존성과 서버 통신은 없습니다.
