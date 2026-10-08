# AI Book · 직접 실험하는 AI 교과서

12개 챕터, 18개 계산형 실험, 챕터별 확인 문제를 제공하는 한국어 정적 웹 교과서입니다.

- 공개 주소: https://ljd6805.github.io/my-bookshelf/books/ai/
- 개발 원본: 이 저장소의 `books/ai/`
- 이전 출처: `ljd6805/ai-book-interactive`; 2026-10-08 복사 후 이전 저장소는 보존하며 자동 동기화하지 않습니다.
- 복사 파일 목록과 원본 SHA: `../../data/ai-book-import.json`
- 통합 계획·검증: `../../docs/07-book-integration.html`

## 실행과 테스트

저장소 루트에서 실행합니다.

```sh
python3 -m http.server 8000
npm test --prefix books/ai
```

미리보기: http://localhost:8000/books/ai/

`js/content.js`는 장 설명과 확인 문제, `js/math.js`는 순수 계산, `js/labs-*.js`는 실험,
`js/visual.js`는 시각화, `js/app.js`는 장 이동을 담당합니다. `docs/index.html`은 책 개발 문서 허브입니다.
런타임 외부 의존성, API 키, 서버 추론은 없습니다. 서가의 main/root GitHub Pages에서 함께 배포됩니다.

## 교육용 모형의 경계

실제 LLM을 실행하지 않습니다. 임베딩은 수동 벡터, RAG는 키워드 검색 및 발췌,
에이전트는 고정 상태 머신, RLHF는 보상과 KL 제약의 정책 분포 예제입니다.
메모리 계산은 고정된 GQA 구조의 부분 합계이며 실측치가 아닙니다.
