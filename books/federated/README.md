# 연합학습 · 데이터를 기기에 두고 업데이트만 모아 모델 학습하기

Jdeok.Lee의 서재에 꽂힌 학습 책입니다. 가상의 키보드 앱 엔지니어 하린이 합성 사용자 1,000명의 원문을 모으지 않고 다음 단어 추천을 개선하는 과정을 따라, FedSGD와 FedAvg, 통신량, non-IID와 기기 표류, 기기 선택 편향, 성능이 다른 기기, 업데이트에서 원문 복원, 보안 집계, DP-FedAvg, 개인화, 그룹별 연합 평가, Gboard와 LoRA 연합학습을 브라우저에서 직접 계산합니다.

- 읽기: `index.html` (서재 루트에서 `python3 -m http.server`로 띄운 뒤 `books/federated/`)
- 제작 문서: `docs/index.html`, 조사 노트: `docs/research.html`, 팩트·출처 검수: `docs/fact-review.html`
- 검사: `npm test` (계산·경로), `node tests/browser.cjs` (브라우저)
