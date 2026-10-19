# 체스 입문
루트 AGENTS.md와 docs/08-book-template.html을 따른다. AI Book(books/ai/)과 같은 화면 구조(표지·읽기 두 모드, 장 일곱 블록, 실험 블록)를 쓴다. 기획·교과과정·장 설계·문체 메모·제작 기록은 docs/index.html이, 규칙 조항 대조와 출처는 docs/research.html이 원본이다.

- **규칙의 원본은 FIDE Laws of Chess 2023년 1월 1일 시행판**이다(research.html S0). 규칙 문장을 고치면 research.html #facts의 조항 번호를 같은 커밋에서 맞춘다. 기물 가치(1·3·3·5·9)와 오프닝 원칙은 규칙이 아니라 관례라고 본문과 실험에 밝힌다.
- **판정은 js/chess.js 한 곳에서 계산한다**(DOM 없음, Node에서도 require). 칸 번호는 rank*8+file(a1=0, h8=63). 수 생성을 고치면 tests/chess.test.cjs의 perft 공개값(시작 국면 20·400·8,902, Kiwipete 48·2,039·97,862, Position 3 14·191·2,812·43,238)이 그대로 나와야 한다. 기보는 FIDE 부록 C를 따라 캐슬링 0-0·0-0-0, 승진 b8Q로 적고, 입력은 O-O·b8=Q도 받는다.
- **국면·퍼즐·하준의 대국은 js/positions.js 한 곳에 둔다.** 하준(지어낸 인물)의 첫 대국은 20반수(10수 Kxf7 뒤 기권)이고, 복기 순간은 반수 2·10·18이다. 국면을 바꾸면 lab-guides.js의 결과 읽기, docs/index.html #chapters, review.json, tests/chess.test.cjs의 숫자를 같은 커밋에서 다시 계산한다.
- **실제 계산·미리 정한 국면·지어낸 기록을 구분한다.** 화면 꼬리표는 CUI.KINDS(real·preset·story)를 쓴다. 11장 게임 트리 그림의 잎 점수는 설명용 예시라고 그림 설명에 적는다.
- **실험 기본값은 L2의 답을 바로 보이지 않는다**(2장 기본 d4·L2 a1, 11장 기본 깊이 2·L2 깊이 3). app.js의 L2 문장은 docs/index.html #chapters의 L2 칸과 같아야 한다(tests/routes.test.cjs).
- **브라우저가 멈추지 않게 한다.** 미니맥스는 labs-engine.js MINIMAX_LIMIT(start·fork 3, ladder 4)를 넘는 깊이에서 세지 않는다. 복기 실험은 search 깊이 2(이어지는 잡기는 quiesce)로 읽는다.
- **장 ID**: board moves special check ending notation value opening tactics mates engine final. 바꾸지 않는다. 다른 책이 #engine으로 들어온다(algorithms#graph, aie-rl#games).
- **용어**: 세로줄(file)·가로줄(rank), 규칙상 움직임·합법 수, 체크메이트(외통)·스테일메이트, 앙파상·승진·캐슬링, 꼬치 공격, 발견 공격, 반수. 같은 대상을 다른 말로 부르지 않는다.
- 판과 기물은 색만으로 구별하지 않는다. 기물은 모양이 다르고, 표시(●·✕·⊘·○)와 칸 단추의 aria-label로도 읽는다. 키보드로 칸 단추를 옮겨 두거나 기보 입력 칸으로 둔다.
- 서가 펼침 삽화의 클래스·id·keyframes는 cs- 접두어(나이트 포크 수순, 움직임). 표지 삽화는 공통 cv-* 클래스만 쓰는 정지 그림(마지막 줄 체크메이트)이다.
- 함수와 즉시 실행 블록은 100줄 이내. 스크립트·스타일을 고치면 index.html의 ?v= 한 값을 함께 올린다. `npm test`와 `node tests/browser.cjs`를 실행한다.
