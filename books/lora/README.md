# LoRA 미세조정 · 저랭크 행렬로 학습할 파라미터와 GPU 메모리 줄이기

7B·13B 언어 모델을 GPU 한 장에서 미세조정하려는 하린(지어낸 인물)의 사례로, 전체 미세조정의 메모리(파라미터당 16바이트)에서 시작해 행렬의 랭크와 SVD, 내재 차원, LoRA의 식 W + (α/r)·B·A와 B = 0 시작, 학습 파라미터 수, 배율 α/r과 α/√r, 어댑터 합치기, QLoRA의 메모리, 어댑터·프리픽스·프롬프트 튜닝·DoRA, 덜 배우고 덜 잊는 교환, 어댑터 서빙, 연합학습의 통신량까지 13개 장과 13개 실험으로 브라우저에서 계산하는 정적 교과서입니다. 마지막 과제는 하린의 조건에서 전체 미세조정·LoRA·QLoRA 가운데 하나를 고르고 r·대상 층·메모리·학습 파라미터 수로 근거를 적는 일입니다.

- 실행: 저장소 루트에서 정적 서버를 띄우고 `books/lora/`를 엽니다.
- 검사: `npm test`, `npm run browser`(Playwright 필요, `PW_EXECUTABLE_PATH`로 크로미움 경로 지정 가능).
- 제작·조사: [docs/index.html](docs/index.html), [docs/research.html](docs/research.html), [docs/fact-review.html](docs/fact-review.html)
