# 체스 입문 · 규칙을 익히고 기초 원칙으로 한 판 두기

체스를 처음 두는 성인을 위한 정적 인터랙티브 교과서입니다. 지어낸 인물 하준이 동네 체스 모임에 들어가 4주 뒤 첫 15분 대국을 두기까지를 따라가며, 체스판 좌표와 처음 배치, 여섯 기물의 움직임, 앙파상·승진·캐슬링, 체크와 합법 수, 체크메이트·스테일메이트·무승부, 대수 기보, 기물 가치와 교환, 오프닝 원칙, 포크·핀·꼬치 공격·발견 공격, 기본 체크메이트, 미니맥스와 알파베타를 12개 장과 12개 실험으로 익힙니다. 마지막 과제는 하준이 10수 만에 기권한 첫 대국을 복기하는 일입니다.

모든 판정은 브라우저 안의 규칙 엔진(js/chess.js)이 계산합니다. 규칙 문장은 FIDE Laws of Chess 2023년 시행판과 조항 단위로 대조했고, 엔진은 perft 공개값과 맞춰 검산했습니다.

- 제작·조사: [docs/index.html](docs/index.html), [docs/research.html](docs/research.html), [docs/fact-review.html](docs/fact-review.html)
- 검사: `npm test`, `node tests/browser.cjs`(Playwright, 1280·390·320px)
