# 정보는 몇 비트인가
루트 AGENTS.md와 docs/08-book-template.html을 따른다.
- 공통 사례는 이 책을 위해 지어낸 두 사람의 문자 메시지 묶음이다(js/messages.js: 윤슬 70개, 도윤 30개). 실제 사람의 대화가 아니며 개인 정보를 넣지 않는다. 메시지를 바꾸면 본문·안내 상자·그림·복습 문항의 숫자가 모두 바뀐다.
- 모든 실험은 실제 계산이다(허프만, 크래프트, 산술 부호는 BigInt 정확 계산과 복원 확인, LZ78, BPE, 해밍(7,4), 양자화). 9장 잡음만 씨앗을 정한 의사 난수(mulberry32)다. 이 구분을 본문과 참고 자료 절에 그대로 적는다.
- 엔트로피·교차 엔트로피·KL의 손실 계산과 미분은 「모델을 움직이는 수학」 6장(../aie-math/#entropy)의 몫이다. 이 책은 같은 양을 "압축 길이"로 읽는 데 머문다. 장별 경계는 docs/index.html 교과과정 절의 "기존 장과 다른 점" 열에 있다.
- 계산은 js/math.js, 본문은 js/content.js, 조작은 js/labs-*.js, 안내는 js/lab-guides.js, 개념 그림은 js/figures.js, 표지 실험은 js/home-lab.js. 전역 이름은 IT 접두어(ITMath, ITBook, ITUI, ITLabs, ITGuides, ITFigures, ITHome, ITMessages)를 쓴다.
- localStorage 키는 bookshelf:information:v1:… 형식을 쓴다(진도·복습은 서재 공통 book-study.js가 관리).
- 숫자를 고치면 python3 tests/reference.py로 기준값을 다시 만들고 npm test를 돌린다. tests/math.test.cjs가 안내 상자의 숫자도 대조한다.
- npm test와 tests/browser.cjs(포트 8781)를 실행하고 docs/index.html에 검증 범위를 기록한다.
