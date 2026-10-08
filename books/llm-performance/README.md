# LLM 추론은 어디서 느려지는가

시스템 이해편의 후속 교과서. 12장과 13개 실험으로 측정·커널·메모리·서빙을 연결한다.

- 본문: index.html
- 기획·구현·검증: docs/index.html
- JavaScript 계산 검사: `npm test --prefix books/llm-performance`
- 실행 예제 검사: `python3 -m unittest discover -s books/llm-performance/tests -p 'test_*.py' -v`
- 브라우저: 루트에서 서버를 켠 뒤 `node books/llm-performance/tests/browser.cjs`
- GPU 실습: examples/index.html (실행 환경과 측정 경계 포함)
