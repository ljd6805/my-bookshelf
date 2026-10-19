# 연합학습 · 데이터를 기기에 두고 업데이트만 모아 모델 학습하기
루트 AGENTS.md와 docs/08-book-template.html을 따른다.
- 공통 사례는 가상의 키보드 앱 엔지니어 하린과 합성 사용자 1,000명이다(js/math.js의 population, 씨앗 7). 실제 사람의 입력이나 Gboard 자료가 아니며 개인 정보를 넣지 않는다. 사용자 생성 규칙이나 씨앗을 바꾸면 본문·안내 상자·그림·복습 문항의 숫자가 모두 바뀐다.
- 이 책은 기기 간 연합학습(cross-device)만 다룬다. 1장에서 데이터센터 분산 학습(DistBelief의 데이터 병렬)과 구분하고, 기관 간·수직 연합학습, 동형암호, 악의적 기기의 오염 방어는 다루지 않는다.
- 모든 실험은 브라우저 안 실제 계산이다(학습, 가중 평균, 양자화, 마스크와 비밀 나눔, 잡음, RDP 회계). 기기 상태(충전·와이파이·유휴)의 확률과 기기 등급별 속도만 이 책이 정한 시나리오다. 이 구분을 본문과 참고 자료 절에 그대로 적는다.
- 논문 수치는 docs/research.html의 “책에 써도 되는 수치” 표에서만 가져오고 논문 시점을 붙인다. “책에 쓰지 말 것” 표의 수치는 쓰지 않는다. 서버 평균은 이번 라운드 참여 기기의 데이터 합 m_t로 나눈다(McMahan 외 2017 정오표).
- ε는 정수 차수 2~256과 Mironov(2017) 명제 3의 변환, 포아송 표집 가정으로 계산한다. 화면에 이 셋을 밝힌다.
- 계산은 js/math.js·js/math2.js, 본문은 js/content.js, 조작은 js/labs-*.js, 실험 글은 js/lab-text.js, 안내는 js/lab-guides.js, 개념 그림은 js/figures.js, 표지 실험은 js/home-lab.js. 전역 이름은 FL 접두어(FLMath, FLBook, FLUI, FLLabs, FLLabText, FLGuides, FLFigures, FLHome)를 쓴다.
- LoRA 책(books/lora/)이 서가에 있으면 12장에서 ../lora/#federated로 잇고, 없으면 “준비 중”으로 적고 링크를 걸지 않는다.
- localStorage 키는 bookshelf:federated:v1:… 형식을 쓴다(진도·복습은 서재 공통 book-study.js가 관리).
- npm test와 tests/browser.cjs(포트 8793)를 실행하고 docs/index.html에 검증 범위를 기록한다.
