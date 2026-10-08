# 컴퓨터는 어떻게 동작하는가 · 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/computer/`이다. 루트 `AGENTS.md`의 공통 규칙을 따른다.
- 공통 사례는 “3 + 4를 누르면 화면에 7이 뜨기까지”, 마지막 과제는 9장의 100 × 3 = 44 조사이다. 새 장도 이 사례의 한 구간을 맡게 한다.
- 장 ID `bits, encoding, gates, adder, memory, cpu, programs, cache, final`과 앵커를 유지한다.
- 계산은 `js/model.js`, `js/cpu.js`, `js/cache.js`(순수 함수)에, 화면은 `js/labs-*.js`에 둔다. 다른 책의 JavaScript를 가져오지 않는다.
- CPU 명령 집합을 바꾸면 6장 명령표, `docs/index.html`의 모형 경계, 테스트를 함께 고친다.
- 루트에서 `npm test --prefix books/computer`, `python3 scripts/validate.py`를 실행한다. 실험을 바꾸면 서버를 띄운 뒤 `node books/computer/tests/browser.cjs`로 실제 브라우저에서 확인한다.
