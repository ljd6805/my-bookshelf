# LoRA의 원리 · 저랭크 변화만으로 미세조정이 되는 이유 확인하기

13B 모델의 0.5%도 안 되는 수만 학습해 말투를 맞춘 하린(지어낸 인물)의 LoRA가 왜 통했는지, 16×16 장난감 모델로 따지는 정적 교과서입니다. 미세조정 변화량 ΔW의 크기와 SVD, 기울기와 사전학습이 변화를 몇 방향에 모으는 이유, 무작위 부분공간과 LoRA, B·A의 학습 과정과 표현력, 부분공간 유사도, 에너지 랭크와 성능 랭크, 자료가 적을 때의 규제 효과, 덜 배우고 덜 잊는 교환을 12개 장과 12개 실험으로 브라우저에서 계산합니다. 마지막 과제는 정체를 모르는 작업 세 개에 시험 미세조정을 하고 r을 판정하는 일입니다.

- 실행: 저장소 루트에서 정적 서버를 띄우고 `books/lora-why/`를 엽니다.
- 검사: `npm test`, `npm run browser`(Playwright 필요, `PW_EXECUTABLE_PATH`로 크로미움 경로 지정 가능).
- 제작·조사: [docs/index.html](docs/index.html), [docs/research.html](docs/research.html), [docs/fact-review.html](docs/fact-review.html)
