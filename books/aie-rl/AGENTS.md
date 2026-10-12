# 강화학습 · 보상에서 정책까지 작업 규칙

- 이 책의 개발 원본은 `my-bookshelf/books/aie-rl/`이다. 루트 `AGENTS.md`와 `docs/08-book-template.html`을 따른다.
- 「AI 엔지니어링 처음부터」 시리즈 10권이다. 원본 커리큘럼 rohitg00/ai-engineering-from-scratch(MIT)의 Phase 9 · Reinforcement Learning(레슨 12개)를 한국어로 재구성했다. 원문과 코드를 옮기지 않는다.
- 공통 사례: 창고 배송 로봇 나르미. 4×4 창고에서 출고대로 가는 길을 배우는 것에서 시작해, 낭떠러지 하역장, 젖은 바닥, 작업자의 선호, 교차로에서 만나는 두 번째 로봇 다르미, 수를 내다보는 탐색까지 한 로봇이 점점 어려운 현장에 놓인다. 마지막 장은 2호 창고에서 올라온 운영 보고 세 가지에 처방과 부족한 증거를 적는 과제다.
- 장 ID(mdp, dp, mc, td, dqn, pg, ppo, rlhf, multi, simreal, games, final)와 진입 경로(home, chapters, sources)는 주소로 쓰이므로 바꾸지 않는다. 바꾸면 index.html의 book-routes와 data/catalog.json을 함께 고친다.
- 계산은 js/math.js에만 둔다. 화면 코드(labs-*.js, figures.js, home-lab.js)는 계산하지 않고 그린다. 계산을 바꾸면 tests/math.test.cjs에 대표값·경계값·불변 조건을 더한다.
- 다른 책의 JavaScript를 가져오지 않는다. 다른 책으로는 `../폴더/#장ID` 링크와 이동 이유로만 잇는다.
- 진도 저장 키: `bookshelf:aie-10-rl:v1:progress`. 서가 복귀 링크 `../../index.html#books`를 유지한다.
- 검사: `npm test --prefix books/aie-rl`, `python3 scripts/validate.py`, 루트에서 `python3 -m http.server 8765` 후 `node books/aie-rl/tests/browser.cjs`.
- 전역 접두어는 `A10`(A10Book, A10Math, A10UI, A10Labs, A10Guides, A10Figures, A10Home), 서가 삽화 클래스 접두어는 `a10-ill-`이다.
- 실험은 실제 계산(벨만 방정식, 가치 반복, Q-learning·SARSA 학습, 닫힌 식의 분산·편향, PPO 갱신, 브래들리-테리, KL 정규화 정책, PUCT, GRPO 이점)과 교육용 가정값(창고 배치, 보상표, 행동별 점수·만족도, 통로 평균)을 결과 문장에서 구분해 밝힌다. 난수는 시드를 고정한다.
- 알고리즘 이름·논문·수치는 원본 커리큘럼 기준(확인일 2026-10-08)으로만 쓴다. 새 수치를 지어내지 않는다.
