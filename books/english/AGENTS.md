# 영어 회화 기초
루트 AGENTS.md와 docs/08-book-template.html을 따른다. AI Book(books/ai/)과 같은 화면 구조(표지·읽기 두 모드, 장 일곱 블록, 실험 블록)를 쓴다. 기획·교과과정·장 설계·문체 메모·제작 기록은 docs/index.html이, 출처와 확인하지 못한 것은 docs/research.html이 원본이다.

- **판정과 숫자는 js/english.js 한 곳에서 계산한다**(DOM 없음, Node에서도 require). 문장 규칙은 현재·과거·현재진행·be going to와 VERBS에 있는 동사만 다룬다. 규칙을 고치면 tests/english.test.cjs의 값(talk 0·3·6 / 3·0·9 / 6·0·9 / 3·1·8, fluency 32·77, lunchStats 15·7·20·0·2, timed 448개 자기 판정)이 그대로 나와야 하고, lab-guides.js의 결과 읽기, docs/index.html #chapters, review.json의 숫자를 같은 커밋에서 맞춘다.
- **실제 계산·미리 정한 값·지어낸 기록을 구분한다.** 화면 꼬리표는 EUI.KINDS(real·preset·measure·story)를 쓴다. 영어 음절 수와 강세 자리, Sam의 반응, 공손 점수의 문턱(D+P+R은 이 책의 단순화), 되묻기 표현은 미리 정한 값이다.
- **듣기는 브라우저 음성 합성(ESpeak, en-US 목소리)만 쓴다.** 목소리가 없으면 단추를 끄고 안내 문구를 보인다. 녹음·발음 채점·외부 서버를 더하지 않는다. 장을 떠나면 ESpeak.stop으로 소리를 멈춘다.
- **실험 기본값은 L2의 답을 바로 보이지 않는다**(1장 기본 coffee·L2 street, 5장 기본 I·visit·every day·L2 Sam·go·yesterday, 10장 기본 다듬은 자기소개·L2 처음 자기소개). app.js의 L2 문장은 docs/index.html #chapters의 L2 칸과 같아야 한다(tests/routes.test.cjs).
- **장 ID**: syllable stress frame questions time followup requests repair linking fluency final. 바꾸지 않는다. 다른 책이 #followup(aie-audio#turn), #repair(aie-nlp#dialog)로 들어온다.
- **영어 낱말 뒤의 조사**: 화면 문장에 바뀌는 영어 낱말을 넣을 때 은/는·이/가·을/를을 바로 붙이지 않는다. 괄호(“주어(Sam)가”)나 콜론, 변하지 않는 조사(의·에·처럼)로 쓴다.
- **용어**: 음절·강세·내용어·기능어, be동사·일반동사, 시간 표지, 말차례, 되묻기(수리), 연음, 낱말 오류율(WER), 분당 낱말 수, 군말. 같은 대상을 다른 말로 부르지 않는다.
- 서가 펼침 삽화의 클래스·id·keyframes는 en-ill 접두어(대답이 늘어나는 말풍선, 움직임). 표지 삽화는 공통 cv-* 클래스만 쓰는 정지 그림(말풍선 세 개)이다.
- 시리즈 「영어 말하기」 1권이다. 2권 「오픽 대비」가 공개되면 catalog.json series의 status를 book_id로 바꾸고, 이 책의 마지막 장에서 2권으로 가는 링크를 더한다.
- 함수와 즉시 실행 블록은 100줄 이내. 스크립트·스타일을 고치면 index.html의 책 자산 ?v= 한 값을 함께 올린다. `npm test`와 `node tests/browser.cjs`를 실행한다.
