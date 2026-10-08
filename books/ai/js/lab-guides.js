/* 비교 조건과 해석을 실험 바로 옆에 둔다. 예제 선택은 실제 입력 이벤트를 사용한다. */
window.AIGuides=(()=>{
const guides={
neuron:['입력에 가중치를 곱하고 편향을 더한 값이 출력으로 바뀝니다. 주황 점은 현재 입력, 청록 선은 가능한 입력 전체의 출력입니다.',[['양의 가중치',{x1:1,w1:2,w2:0,bias:0}],['음의 가중치',{x1:1,w1:-2,w2:0,bias:0}],['입력 영향 없음',{w1:0,w2:0,bias:0}]],'w₁의 부호를 바꾸면 곡선 방향이 뒤집힙니다. w₁=0이면 x₁을 움직여도 출력이 그대로인 것이 정상입니다.'],
activation:['함수마다 음수와 큰 양수를 다르게 처리합니다. 주황 점의 높이가 현재 출력입니다.',[['ReLU 음수',{fn:'relu',ax:-2}],['Sigmoid 중앙',{fn:'sigmoid',ax:0}],['Sigmoid 포화',{fn:'sigmoid',ax:5}]],'Sigmoid는 끝으로 갈수록 평평해집니다. ReLU와 나머지 함수의 세로축 범위가 다르므로 눈금과 숫자를 함께 비교하세요.'],
regression:['가중치와 절편을 직접 조절해 학습이 찾으려는 답을 살펴봅니다.',[['맞추기 전',{slope:.5,intercept:0}],['잘 맞는 직선',{slope:2,intercept:1}]],'MSE는 점과 직선 사이 세로 거리의 제곱을 평균한 값입니다. 작을수록 이 다섯 점을 잘 맞춥니다.'],
descent:['같은 시작점에서 학습률만 바꿔 보세요. 예제를 고른 뒤 10번 학습을 누르세요.',[['안정적인 학습률',{lr:.1},'reset'],['너무 큰 학습률',{lr:1.1},'reset']],'학습률 0.1에서는 손실이 줄고, 1.1에서는 최솟값을 지나쳐 오가며 커집니다. 슬라이더는 다음 갱신의 크기를 정하므로 학습 버튼을 눌러야 점이 이동합니다.'],
overfit:['같은 훈련 점을 직선과 7차 보간 곡선의 혼합으로 맞춥니다. 모델을 새로 학습하는 과정은 아닙니다.',[['직선',{complexity:0}],['중간 곡선',{complexity:.64}],['모든 점 통과',{complexity:1}]],'중간 곡선과 모든 점 통과를 비교하세요. 훈련 오차는 줄지만 검증 오차는 다시 커집니다. 검증값은 잡음 없는 기저 함수의 101개 지점과 비교한 교육용 오차입니다.'],
bpe:['반복되는 이웃 조각을 합쳐 글자를 더 큰 토큰으로 만듭니다.',[['문자 단위',{merges:0}],['첫 병합',{merges:1}],['8번 병합',{merges:8}]],'병합할수록 같은 문장을 더 적은 조각으로 표현합니다. 이 작은 영문 말뭉치에서 배운 규칙이며 실제 LLM 토크나이저와 같지는 않습니다.'],
embedding:['각도와 길이를 따로 바꾸며 코사인 유사도가 무엇을 측정하는지 확인합니다. 두 축은 같은 축척입니다.',[['같은 방향',{angle:0,length:1}],['직각',{angle:90,length:1}],['반대 방향',{angle:180,length:1}]],'방향이 같으면 1, 직각이면 0, 반대면 −1입니다. 길이만 바꾸면 내적은 달라져도 코사인 유사도는 그대로입니다. 단어에서 학습한 벡터가 아닌 기하 실험입니다.'],
attention:['Query와 Key의 내적으로 참고 비중을 정하고, 그 비중으로 Value를 섞습니다.',[['모두 같은 비중',{q1:0,q2:0}],['K₃ 쪽 강조',{q1:3,q2:3}],['K₄ 쪽 강조',{q1:-3,q2:0}]],'표의 출력 기여를 모두 더하면 가중합 출력이 됩니다. 가중치는 합이 1이지만 출력 값은 확률이 아니므로 0~1 밖일 수 있습니다.'],
mask:['테두리로 표시한 Query 행이 어느 Key 열을 볼 수 있는지 확인합니다.',[['첫 위치',{causal:'yes',position:1}],['마지막 위치',{causal:'yes',position:5}],['미래도 허용',{causal:'no',position:1}]],'인과 마스크를 켜면 현재 위치보다 오른쪽은 ×입니다. 마지막 위치는 미래가 없어서 마스크를 꺼도 같습니다. 값은 학습된 어텐션이 아닌 거리 기반 예시입니다.'],
temperature:['후보의 순서는 고정하고 확률의 쏠림만 바꿉니다.',[['낮은 온도',{temp:.1}],['기준 온도',{temp:1}],['높은 온도',{temp:2.5}]],'온도가 높을수록 이 분포가 평평해집니다. 가장 높은 후보의 순위가 뒤집히거나 문장을 생성하는 실험은 아닙니다.'],
sampling:['후보를 거른 뒤 100회 추출하여 이론 확률과 관측 비율을 비교합니다.',[['한 후보만',{filter:'k',k:1}],['세 후보',{filter:'k',k:3}],['누적 80%',{filter:'p',p:.8}]],'Top-p는 원래 확률의 누적값이 기준을 처음 넘는 후보까지 포함합니다. 아래 막대는 추출 후에 채워집니다. 추출 횟수가 적으면 이론값과 차이가 나는 것이 정상입니다.'],
convolution:['입력의 테두리 9칸과 커널을 같은 위치끼리 곱해 더하면 중앙 출력이 됩니다.',[['경계 찾기',{kernel:'edge'},'restore'],['평균 내기',{kernel:'blur'},'restore'],['빈 입력',{kernel:'edge'},'clear']],'Sobel은 밝기가 바뀌는 경계에 반응하고, 평균 필터는 주변 픽셀의 평균을 냅니다. 빈 입력에서 픽셀 하나를 켜면 영향이 주변 출력으로 퍼지는 모습을 볼 수 있습니다.'],
reward:['A는 자세한 응답(유용성 3·간결성 0), B는 균형 잡힌 응답(2·2), C는 너무 짧은 응답(0·3)이라고 가정합니다.',[['간결성 우선',{help:0,beta:.3}],['균형 평가',{help:.5,beta:.3}],['유용성 우선',{help:1,beta:.3}]],'평가 기준을 바꾸면 높은 확률을 받는 응답도 달라집니다. β를 키우면 초기의 균등 분포에 가까워집니다. 가정한 점수의 계산 모형이며 실제 응답 평가나 RLHF 학습은 아닙니다.'],
quantization:['같은 수치를 표현하는 눈금을 줄이면 저장량과 오차가 함께 바뀝니다.',[['거친 2 bit',{bits:2}],['4 bit',{bits:4}],['촘촘한 8 bit',{bits:8}]],'2 bit는 값 4개, 8 bit는 값 256개를 표현합니다. 곡선이 겹칠 때에는 MSE와 최대 절대 오차를 읽으세요. 모델의 정답률을 측정하는 실험은 아닙니다.'],
memory:['모델 크기·가중치 정밀도·문맥 길이가 어떤 항목의 용량을 바꾸는지 분리해 봅니다.',[['기준 8K',{params:8,precision:4,context:8192}],['문맥 두 배',{params:8,precision:4,context:16384}],['가중치 16 bit',{params:8,precision:16,context:8192}]],'문맥을 두 배로 늘리면 KV만 두 배가 됩니다. 정밀도를 4에서 16 bit로 바꾸면 가중치 용량만 네 배입니다. 모델 크기와 KV 구조는 이 계산기에서 독립적인 가정입니다.'],
retrieval:['문서와 질문에 공통으로 들어 있는 단어로 검색합니다. 결과 수와 첫 문서를 함께 확인하세요.',[['메모리 질문',{query:'문맥 길이 메모리 KV',topn:2}],['학습 질문',{query:'학습 가중치',topn:2}],['근거 없는 질문',{query:'우주선',topn:2}]],'가져올 문서 수를 늘려도 최고 점수 문서가 같으면 발췌 답변은 같습니다. 정확히 겹치는 단어가 없으면 답변을 보류합니다. 의미 검색이나 LLM 생성은 수행하지 않습니다.'],
agent:['도구가 성공하거나 실패했을 때 다음 행동과 종료 조건을 따라갑니다.',[['정상 실행',{failure:'ok'}],['한 번 실패',{failure:'fail'}],['계속 실패',{failure:'always'}]],'다음 단계를 끝까지 눌러 보세요. 계속 실패하면 재시도 한 번 뒤 답변을 보류하고 멈춥니다. 실제 도구 호출이 없는 고정 실행 시뮬레이션입니다.'],
evaluation:['12개 샘플의 점수와 실제 정답은 고정하고, 경보를 울릴 문턱만 바꿉니다.',[['모두 경보',{threshold:0}],['기준 0.5',{threshold:.5}],['경보 없음',{threshold:1}]],'임계값을 낮추면 놓친 이상은 줄지만 오경보가 늘 수 있습니다. 아래 샘플 카드에서 어떤 판단이 바뀌었는지 확인하세요. TP·TN은 맞은 판단, FP는 오경보, FN은 놓친 이상입니다.']
};
function mount(id,el){
 const [purpose,presets,interpretation]=guides[id],host=el.parentElement;
 const box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}">${p[0]}</button>`).join('')}<button data-initialize>실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${interpretation}</p>`;
 host.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-initialize')){AILabs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
 const [,values,action]=presets[+b.dataset.preset];for(const [key,value] of Object.entries(values))el.querySelector('#'+key).value=value;
 el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));if(action)el.querySelector('#'+action).click();
 box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',()=>box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed')));
}
return {mount};
})();
