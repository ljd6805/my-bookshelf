# GPU 속 LLM
루트 AGENTS.md와 docs/08-book-template.html을 따른다.
- NVIDIA 분리형 GPU의 dense decoder-only 추론을 기본 범위로 삼는다.
- 교육용 가정과 실제 측정을 구분한다. GB(10^9)와 GiB(2^30)를 섞지 않는다.
- GPU 내부 전송과 CPU↔GPU 전송을 구분한다. KV cache와 하드웨어 cache를 구분한다.
- 모델은 js/math.js, 본문은 js/content.js, 조작은 js/labs-*.js에서 관리한다.
- npm test와 tests/browser.cjs를 실행하고 docs/index.html에 검증 범위를 기록한다.
