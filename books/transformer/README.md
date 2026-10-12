# 트랜스포머 속을 열어 보기 · 학습된 작은 모델의 회로를 추적하다

정적 인터랙티브 교과서. 브라우저가 학습된 2층 트랜스포머 ‘토리’의 가중치로 모든 실험을 직접 계산한다. 저장소 루트에서 HTTP 서버를 실행하고 books/transformer/를 연다.

검사: `npm test --prefix books/transformer`

브라우저 검사: `BOOK_URL=http://127.0.0.1:8765/books/transformer/ node books/transformer/tests/browser.cjs`

가중치 다시 만들기: `python3 books/transformer/tools/train_tori.py && python3 books/transformer/tools/export_tori.py` (jax·optax 필요)

제작·가정·검증: [docs/index.html](docs/index.html)
