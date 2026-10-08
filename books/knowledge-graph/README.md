# 지식 그래프와 온톨로지 · 의미를 구조로

퀴리 가족에 관한 문장 스물한 개로 트리플, 식별자, 온톨로지, 추론, 질의, 추출, 임베딩, GraphRAG까지 9개 장과 9개 실험으로 배우는 정적 웹 교과서입니다.

- 공개 주소: https://ljd6805.github.io/my-bookshelf/books/knowledge-graph/
- 개발 문서: `docs/index.html` (책의 약속, 장 연결표, 실험 확인 수준, 검증 기록)

## 실행과 테스트

저장소 루트에서 실행합니다.

```sh
python3 -m http.server 8000
npm test --prefix books/knowledge-graph
node books/knowledge-graph/tests/browser.cjs   # playwright가 있을 때
```

`js/graph.js`는 순수 계산과 공통 사례 데이터, `js/content.js`는 장 글, `js/labs-*.js`는 실험,
`js/figures.js`는 움직이는 개념 그림, `js/app.js`는 장 이동을 맡습니다. 외부 API 호출은 없습니다.
