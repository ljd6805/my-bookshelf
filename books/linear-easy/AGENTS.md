# 쉬운 선형대수
루트 AGENTS.md와 docs/08-book-template.html을 따른다. 화면 구조는 「에이전트 지침 파일」(books/harness/)을 본떠 AI Book 표준(머리말 메뉴, 표지·읽기 두 모드, 장 화면 일곱 블록)을 지킨다. 기획·교과과정·장 설계·문체 비평·제작 기록은 docs/index.html이, 사실과 출처는 docs/research.html이, 검수 기록은 docs/fact-review.html이 원본이다.

- **책**: id `linear-algebra-easy`, 폴더 books/linear-easy/, 제목 「쉬운 선형대수 · 벡터·행렬·텐서를 3D로 보며 신경망 계산하기」, 책등 “쉬운 선형대수”, 분류 수학, 색 aqua. 14장(13장 + 마지막 과제), 실험 14개. 장 번호는 1장부터 센다(app.js가 index+1로 표시).
- **접두어**: 스크립트 전역은 `EL`(ELMath·ELBook·ELUI·EL3D·ELFigures·ELLabs·ELGuides·ELHome), CSS·SVG 클래스는 `el-`. 진도 키는 book-study.js가 정하는 bookshelf:linear-easy:v1:study.
- **경계**: 2차원 평면의 투영·주성분은 「벡터와 행렬로 보는 세상」(linear-algebra), 미분과 자동 미분은 「모델을 움직이는 수학」(aie-math), 가중치 학습과 역전파는 「신경망의 계산」(neural)이 다룬다. 이 책은 숫자가 정해진 뒤의 계산과 그 계산을 적는 말(벡터·행렬·텐서·야코비안)만 다룬다.
- **공통 사례**: 소라의 카페(지어낸 예). 벡터는 늘 [샷(잔), 우유(100 mL), 시럽(펌프)] 순서다. 음료 여섯 개, 단가·열량·카페인, 민준의 취향 가중치, 2층 신경망, 단골 이동표, 이틀 치 주문은 js/math.js가 원본이고 화면마다 “이 책이 정한 값”이라고 밝힌다.
- **3차원 그림판**: js/space3d.js(EL3D)가 회전·정사영·깊이 순서만 맡고 계산은 ELMath가 한다. 길이는 축척대로 그린다. 끌기·방향키·“처음 각도”·“움직임 멈추기”를 유지하고, prefers-reduced-motion과 html[data-motion=reduce]에서는 멈춘 채 시작한다. 그림마다 aria-label 문장과 표·결과 문장(2D·텍스트 대안)을 함께 둔다.
- **장 그림**: js/figures.js는 정해진 각도의 평행 투영이며 돌릴 수 없다. 좌표와 숫자는 ELMath로 계산한다.
- **계산 구분**: 실험은 모두 js/math.js의 실제 계산이다. 7·8장의 움직이는 중간 모습은 “그대로 두기” 행렬과 고른 행렬을 섞은 행렬로 그린 것이고 화면에 그렇게 적는다. app.js의 KIND가 실험마다 계산의 성격을 밝힌다.
- **안내 숫자**: js/lab-guides.js의 결과 읽기와 review.json의 숫자를 바꾸면 tests/math.test.cjs가 실제 계산과 대조한다.
- **다시 확인할 것**: PyTorch 문서 세 쪽은 2.15판으로 확인했다(2026-11-11). 판이 바뀌면 docs/research.html의 “다시 확인할 것”부터 본다.
- **검사**: `npm test`(routes·math), `npm run browser`(Playwright, 저장소 루트에서 `python3 -m http.server 8790`, 1280·390·320px).
