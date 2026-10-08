# 벡터와 행렬로 보는 세상 · 직접 움직이는 선형대수

노래 여덟 곡으로 작은 추천기를 만들며 벡터, 내적, 투영, 행렬 변환, 행렬식, 역행렬,
고유벡터, 주성분, 신경망 한 층을 직접 움직여 익히는 한국어 정적 웹 교과서입니다.
11개 장, 장마다 실험 1개, 이해 확인과 마지막 과제가 있습니다.
화면 구성은 서가의 첫 책 AI Book과 같은 한 페이지·해시 경로(`#vectors` 등) 방식입니다.

- 공개 주소: https://ljd6805.github.io/my-bookshelf/books/linear-algebra/
- 기획·검증 기록: `docs/index.html`

## 실행과 테스트

저장소 루트에서 실행합니다.

```sh
python3 -m http.server 8765
npm test --prefix books/linear-algebra
NODE_PATH=$(npm root -g) node books/linear-algebra/tests/browser.cjs   # Playwright 필요
```

`js/linalg.js`는 순수 계산, `js/songs.js`는 공통 사례 데이터, `js/plane.js`는 SVG 좌표평면,
`js/ui.js`는 슬라이더·애니메이션·예측·읽음 표시, `js/labs-1~3.js`는 실험,
`js/content.js`는 장 본문, `js/lab-views.js`는 실험 마크업과 안내, `js/page-*.js`·`js/app.js`는 화면 조립과 경로입니다.
읽음 표시는 `localStorage`의 `bookshelf:linear-algebra-world:v1:progress`에만 저장합니다.

## 모형의 경계

노래와 점수는 설명용 가상 데이터입니다. 10장의 가중치는 학습한 값이 아니라 직접 정한 값입니다.
