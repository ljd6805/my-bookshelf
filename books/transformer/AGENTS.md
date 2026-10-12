# 트랜스포머 속을 열어 보기
루트 AGENTS.md와 docs/08-book-template.html을 따른다.
- 공통 사례는 이 책을 위해 학습시킨 2층 트랜스포머 ‘토리’다(낱말 32개, d=32, 헤드 4개×2층, MLP 128). 사실 문장 “곰 먹이 꿀 .”, 세기 “3 4 5”, 반복 목록 “목록 곰 꿀 숲 토끼 포도 곰 꿀 숲 토끼”를 장마다 다시 쓴다.
- 가중치는 tools/train_tori.py(JAX·optax, 시드 7)로 학습하고 tools/export_tori.py로 js/weights.js·js/checkpoints.js·tests/reference.json에 내보낸다. tools/tori.pkl은 커밋하지 않는다.
- 가중치를 다시 만들면 본문·안내 상자·그림의 숫자가 모두 바뀐다. `npm test`의 tests/math.test.cjs가 먼저 실패하므로 그 숫자를 고치고 문장을 맞춘다.
- 실제 계산(토리 가중치)과 교육용 모형(3장 2차원 부드러운 찾기), 별도 장난감 모형(13장 중첩)을 구분해 적는다.
- 계산은 js/math.js, 본문은 js/content.js, 조작은 js/labs-*.js, 안내는 js/lab-guides.js, 개념 그림은 js/figures.js에서 관리한다. 전역 이름은 T 접두어(TMath, TBook, TUI, TLabs, TGuides, TFigures, THome, TWeights, TCheckpoints)를 쓴다.
- npm test와 tests/browser.cjs를 실행하고 docs/index.html에 검증 범위를 기록한다.
