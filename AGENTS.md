# 나만의 서재 — 공통 작업 규칙

## 목적과 범위
- 학습자가 문제를 이해하고, 직접 조작하고, 새 상황에서 설명할 수 있는 책을 만든다.
- 이 저장소는 서가와 모든 학습 책의 개발 원본, 공통 기준을 함께 관리한다.
- 각 책은 books/주제/ 아래에 본문·실험·자산·테스트·문서를 독립 폴더로 둔다. 신규 도서를 별도 저장소로 만들지 않는다. GitHub Pages는 main/root에서 함께 배포한다.
- 첫 책은 AI Book · 직접 실험하는 AI 교과서(ai-book-interactive)이다. 다음 책은 사용자 요청에 따라 등록한다.
- euiyun.com 분석은 관찰과 설계 참고이며 원문·코드·브랜드 복제의 허가가 아니다.

## 작업 시작
1. index.html과 docs/00-intent.html을 읽는다.
2. docs/01-library-charter.html과 docs/02-collaboration.html을 읽는다.
3. data/work-state.json, git status, 최근 커밋에서 진행 상태를 확인한다.
4. 구현 전에 목적·변경 파일·독자에게 생길 변화·확인 방법을 기록한다.
5. 이미 승인된 범위의 작고 되돌릴 수 있는 구현 선택은 자율적으로 진행한다.

## 문서와 이야기
- 프로젝트 설명·설계 결정·인계 문서는 HTML로 작성하고 index.html에서 연결한다.
- README.md, AGENTS.md, CLAUDE.md는 도구 진입점이므로 Markdown을 유지한다.
- 한국어는 자연스러운 문장으로 쓴다. 명사 나열과 설명 없는 은유를 피한다.
- 한 책에 계속 등장하는 사례와 마지막 과제를 먼저 정한다.
- 장마다 시작 질문·이전 결과·새 도구·해결 결과·남은 질문을 연결한다.
- 핵심 흐름은 문제 → 예측 → 조작 → 관찰 → 설명 → 전이이다.
- 다음 장과 다른 책의 링크에는 이동 이유를 쓴다.

## 구현
- 서가 카탈로그에는 실제 학습용 지식자료만 등록한다. 저장소 구축·운영·분석·기획 문서는 서가에 진열하지 않고 운영 문서로 보존한다.
- 정적 HTML·CSS와 필요한 만큼의 JavaScript부터 사용한다.
- Python·JavaScript 함수는 원칙적으로 100줄 이내로 유지한다.
- 계산 모델과 화면 렌더링을 분리한다. 단위·가정·유효 범위를 명시한다.
- 실제 계산, 미리 정한 시나리오, 시각적 비유를 구분한다.
- 3D는 공간 관계 설명에 필요할 때 사용하고 2D·텍스트 대안을 둔다.
- 입력 라벨·키보드 조작·초기화·오류 상태·색 외의 상태 표시를 제공한다.
- 프로젝트 Pages의 /repo/ 경로를 고려해 내부 자산에는 상대 경로를 쓴다.
- localStorage 키는 bookshelf:book-id:v1:progress처럼 책과 버전을 포함한다.
- 장 ID와 앵커는 안정적으로 유지한다. 이동 후 기존 링크를 검사한다.
- catalog.json을 카탈로그 원본으로 사용하고 중복된 수동 집계를 줄인다.
- 서가 디자인·동작 수정 전 docs/05-glass-library-design.html과 docs/06-glass-library-implementation.html을 읽는다. 승인 목업의 투명한 유리·아이보리 라벨·명조체·분류를 유지한다.
- 스타일·스크립트 변경 시 index.html의 자산 버전, assets/*.js의 상대 import 경로 ?v=, tests/responsive.html의 미리보기 버전을 함께 갱신한다. validate.py가 셋의 일치를 검사한다.
- 문서 제목·목차 변경도 build_catalog.py로 다시 생성해 미리보기와 동기화한다.
- 자료·책 목록 변경은 docs/04-site-plan.html을 읽고 python3 scripts/build_catalog.py로 반영한다. 카탈로그와 index.html을 함께 커밋한다.
- 요구가 확인되기 전에 계정·서버·복잡한 빌드·서브모듈을 추가하지 않는다.

## 도서 통합 운영
- AI 책은 books/ai/가 개발 원본이다. 이전 ai-book-interactive 저장소는 보존하며 자동 동기화하지 않는다.
- 도서 카탈로그 URL은 books/주제/ 상대 경로를 기본으로 하고 안정적인 장 ID를 유지한다.
- books/주제/AGENTS.md에 책별 규칙을 둔다. 책 사이 내부 코드 의존을 추가하지 않는다.
- 모든 책의 books/주제/index.html 머리말(`<header>`)에 서가로 돌아가는 버튼 `<a class="shelf-return" data-shelf-return href="../../index.html#books">`를 둔다. 320px에서도 보이고 누를 수 있어야 하며 validate.py가 검사한다. 세부 기준은 docs/07-book-integration.html#shelf-return을 따른다.
- 변경 책의 테스트와 공통 링크 검사를 실행한다. 공통 코드 수정 시 모든 책을 검사한다.
- 통합 기준과 이전 기록은 docs/07-book-integration.html을 따른다.

## 지식 지도와 큐레이션 갱신 (책을 추가·공개할 때마다)
- 책을 published로 올리는 같은 커밋에서 서가의 지식 연결도 함께 갱신한다. validate.py(scripts/curation_rules.py)가 아래 다섯 가지를 검사하며 하나라도 빠지면 CI가 실패한다.
- 장 색인: data/catalog.json의 chapter_index에 새 책의 장을 "번호 · 장 제목"으로 등록한다. 앵커는 그 책 book-routes에 있어야 한다.
- 공통 개념: 새 책의 장을 concepts 두 개 이상에 넣는다. 기존 개념에 장을 더하거나, 다른 책과 함께 쓰는 새 개념(한국어 이름·영문 동의어·한 줄 요약)을 만든다. 개념 하나는 반드시 두 권 이상을 잇는다.
- 읽기 노선: learning_paths 중 하나 이상이 새 책의 장을 정거장으로 지나가게 한다. 기존 노선에 정거장을 더하거나 질문 하나로 새 노선을 만든다. 단계마다 할 일·시간·이동 이유·남길 기록을 쓰고, 할 일은 그 장의 실제 실험과 맞춘다.
- 양방향 링크: 새 책의 "더 읽어 보기"에서 다른 책으로 가는 링크 하나 이상, 다른 책에서 새 책으로 오는 링크 하나 이상을 이동 이유와 함께 둔다(../주제/#장ID).
- 지도 배치는 자동이다. 책은 타원 위에 고르게 놓이고 개념은 겹치지 않게 계산되므로 좌표를 손으로 넣지 않는다. 책 색(color)은 다른 책과 겹치지 않게 고른다.
- 갱신 후 python3 scripts/build_catalog.py로 서가를 다시 만들고, 1280·390·320px에서 노선도와 지식 지도를 확인한다. 세부 절차는 docs/08-book-template.html#knowledge-links를 따른다.

## 책 구성 표준
- 모든 책의 화면 배치와 장 구조는 AI Book(books/ai/)을 기준으로 한다. 새 책을 만들거나 책 구조를 바꾸기 전에 docs/08-book-template.html을 읽는다.
- 머리말 메뉴 순서, 표지·읽기 두 모드와 왼쪽 장 목차, 장 화면 일곱 블록(장 머리 → 먼저 개념 잡기 → 실험 → 혼동하지 마세요 → 확인 문제 → 더 읽어 보기 → 이전·다음), 실험 블록 형식, content.js 장 데이터 필드를 그대로 유지한다.
- 글꼴은 assets/type.css의 공통 체계(본문 Pretendard, 제목 Noto Serif KR, 숫자·코드 JetBrains Mono)를 쓴다. 책 index.html은 `<html data-typeset="book">`과 `../../assets/type.css`를 연결하고, 책 CSS는 var(--font-sans|serif|mono)만 쓴다. 기준은 docs/08-book-template.html#typography, validate.py가 검사한다.
- 서가에서 펼쳤을 때 보이는 대표 삽화(assets/shelf-illustration.svg)는 반드시 움직인다. @keyframes와 animation(또는 SMIL)으로 책의 핵심 과정을 보여 주고, prefers-reduced-motion과 html[data-motion=reduce]에서 멈추며, 클래스·id는 책 접두어를 붙인다. 정지 그림이나 애니메이션 흔적만 있는 그림은 validate.py가 오류로 막는다. 등록 후 서가에서 직접 펼쳐 움직임을 눈으로 확인한다(docs/08-book-template.html#shelf-art).
- 색·표지 실험·장과 실험 내용은 책마다 새로 만든다. 고정 항목을 바꿔야 하면 docs/08을 먼저 고치고 모든 책에 반영할지 사용자에게 확인한다.

## 책등 제목 규칙
- 책등 명조체의 최대 글자 크기는 데스크톱·모바일 모두 18px이다. 제목 길이에 따른 확대·자동 축소·말줄임표를 사용하지 않는다.
- 모든 서가 항목에 spine_title을 반드시 작성한다. 내용의 핵심 주제·학습 활동을 살려 공백 제외 최대 6글자로 직접 다듬는다. 앞부분만 기계적으로 자르거나 뜻을 모호하게 만들지 않는다.
- 한글은 NFC 완성형으로 정규화하고, 영문·숫자도 각각 한 글자로 센다. 누락·6글자 초과·말줄임표는 생성 오류로 처리한다.
- title에는 전체 제목을 보존한다. 목록·펼친 책·접근성 이름·검색은 전체 제목을 사용하고, 분류는 책등 제목 아래에 둔다.
- 새 책 등록 시 320px 화면에서 제목 잘림과 분류 겹침을 확인한다. 세부 기준과 예시는 docs/04-site-plan.html#spine-title-rule을 따른다.

## 서가 진열 규칙
- 서가는 가지런하고 아름답게 보여야 한다. 책을 추가하거나 순서·색·분류를 바꾸기 전에 docs/04-site-plan.html#shelf-display-rule을 읽는다.
- 모든 책등은 같은 높이·폭·각도로 같은 바닥선에 서고, 실제 책처럼 1px 틈만 두고 붙어 선다. 책별 높이 변화나 일부만 기울이는 장식을 넣지 않는다.
- color는 필수이며 유리 팔레트 여섯 색 중 하나다. 이웃한 두 책은 같은 색을 쓰지 않는다.
- spine_category는 필수이며 공백 제외 최대 4글자다. 같은 분야는 같은 이름을 쓰고, 같은 분류의 책은 붙여 세운다. 새 책은 그 분류 묶음 끝에, 새 분류는 서가 끝에 둔다.
- 책등 글꼴은 서재 공통 토큰(assets/type.css의 --font-serif 제목, --font-sans 분류)만 쓴다. 읽을 수 있는 책은 대표 삽화(illustration)를 가진다.
- 생성기가 색·이웃 색·분류 길이·분류 묶음·삽화 누락을 오류로 막는다. 등록 후 1280·390·320px에서 정렬과 잘림을 확인한다.

## 검증
- 기본 검사: python3 scripts/validate.py
- 카탈로그만 확인: python3 scripts/build_catalog.py --check
- 검색·설정 단위 검증: node --test tests/test_shelf_model.mjs
- 검사기 단위 검증: python3 -m unittest discover -s tests -v
- 계산 변경은 대표값·경계값·불변 조건을 검증한다.
- 단순 문구·색상 변경에 구현을 그대로 복제하는 테스트를 추가하지 않는다.
- 인터랙션 변경은 실제 브라우저에서 입력·출력·초기화를 확인한다.
- 구조 확인, 동작 확인, 수치 정확성, 학습 효과는 각각 구분하여 보고한다.
- 검사하지 못한 항목과 환경 제한을 docs/03-verification.html에 남긴다.
- 외부 사실은 확인일과 출처를 남긴다. 변화가 잦은 수치는 공식 출처로 재확인한다.

## 협업과 인계
- 다른 도구로 넘기기 전에 작업 상태와 작은 단위의 커밋을 남긴다.
- 같은 파일을 동시에 고치지 않는다. 타인의 미완료 변경을 임의로 초기화하지 않는다.
- 완료·근거·검증·남은 일·다음 행동을 data/work-state.json과 HTML에 기록한다.
- 인증 정보·개인 대화·민감한 자료는 공개 저장소에 넣지 않는다.
- 원격 생성·업로드·배포는 실제 확인 후에만 완료로 기록한다.
