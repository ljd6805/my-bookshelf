/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A07Guides=(()=>{
const guides={
 alias:['나이퀴스트를 넘은 음이 어떤 주파수로 접혀 보이는지 확인합니다.',[['10 kHz로 7 kHz',{tone:7000,sr:'10000'}],['16 kHz로 9 kHz',{tone:9000,sr:'16000'}],['16 kHz로 3 kHz',{tone:3000,sr:'16000'}]],'첫 예제는 3 kHz, 둘째는 7 kHz로 접혀야 하고, 셋째는 3 kHz 그대로여야 정상입니다. 찍힌 점은 원래 음과 접힌 음 양쪽 곡선 위에 모두 놓입니다.'],
 stft:['창 길이 하나가 주파수 해상도와 시간 해상도를 맞바꾸는지 봅니다.',[['짧은 창 10 ms',{win:10}],['음성 인식 25 ms',{win:25}],['긴 창 100 ms',{win:100}]],'10 ms는 두 딸깍 소리를 가르지만 두 음은 못 가르고, 100 ms는 그 반대여야 합니다. 25 ms는 빈 간격 40 Hz, 프레임 998개입니다.'],
 melbank:['멜 필터를 늘리면 낮은 쪽 필터가 FFT 빈보다 좁아져 비는지 확인합니다.',[['멜 40개',{nmels:40,nfft:'400'}],['멜 128개, n_fft 400',{nmels:128,nfft:'400'}],['멜 128개, n_fft 1024',{nmels:128,nfft:'1024'}]],'n_fft 400에서 40개는 빈 필터가 없고 128개는 21개가 비어야 합니다. n_fft를 1024로 늘리면 빈 간격이 15.6 Hz로 좁아져 빈 필터가 줄어듭니다.'],
 imbalance:['정확도와 macro F1이 같은 분류기를 얼마나 다르게 평가하는지 봅니다.',[['늘 배경, 경보 10개',{alarms:10,model:'majority'}],['k-NN, 경보 10개',{alarms:10,model:'knn'}],['균형 학습, 경보 10개',{alarms:10,model:'balanced'}]],'늘 배경이라고 답하는 분류기도 정확도는 약 89%이지만 macro F1은 약 32%여야 합니다. 균형 학습은 정확도가 비슷하지만 macro F1이 두 배 가까이 높아야 합니다.'],
 ctc:['공백이 같은 글자의 반복을 지켜 주는지, 규칙 하나를 빼면 어떻게 되는지 봅니다.',[['5 5 5 사이 공백 없음',{path:'a',mode:'both'}],['5 5 _ 5',{path:'b',mode:'both'}],['반복만 합치기',{path:'b',mode:'repeat'}]],'첫 예제는 5분, 둘째는 55분이어야 합니다. 반복만 합치면 공백 기호가 출력에 남습니다.'],
 wer:['오류의 종류와 정규화가 WER을 어떻게 바꾸는지 셉니다.',[['첫 단어 잘림',{hyp:'clip',norm:'on'}],['침묵 환각',{hyp:'ins',norm:'on'}],['표기만 다름, 정규화 안 함',{hyp:'format',norm:'off'}]],'첫 단어가 잘리면 삭제 1개로 약 16.7%, 환각 문장은 삽입 3개로 50%여야 합니다. 표기만 다른 결과는 정규화하면 0%, 하지 않으면 높게 나옵니다.'],
 chunks:['녹음 길이에 따라 창 수와 덧댄 침묵이 어떻게 바뀌는지 계산합니다.',[['2초 명령',{clip:2,overlap:'5'}],['31초',{clip:31,overlap:'5'}],['10분, 겹침 5초',{clip:600,overlap:'5'}]],'2초 명령은 창의 93% 이상이 침묵이고, 31초는 창이 둘로 늘어야 합니다. 10분은 겹침 5초에서 24개입니다.'],
 eer:['문턱과 녹음 조건이 두 오류를 어떻게 맞바꾸는지 봅니다.',[['조용함, EER 문턱',{cond:'quiet',thr:.53}],['후드 소음, 같은 문턱',{cond:'noisy',thr:.53}],['결제용 높은 문턱',{cond:'quiet',thr:.65}]],'조용할 때는 두 오류가 모두 1% 아래지만, 같은 문턱을 후드 소음에 쓰면 엄마가 거부되는 비율이 크게 늘어야 합니다. 문턱을 높이면 오수락이 거의 0이 됩니다.'],
 duration:['말 속도가 프레임 수와 길이를 어떻게 바꾸는지 계산합니다.',[['보통 속도',{speed:1,pause:'0'}],['1.5배 빠르게',{speed:1.5,pause:'0'}],['느리게, 끝에 쉼',{speed:.7,pause:'20'}]],'보통 속도는 90프레임, 0.9초여야 합니다. 1.5배면 음절마다 나누고 반올림해 60프레임, 0.6초가 됩니다. 0.7배에 쉼을 더하면 1.48초입니다.'],
 rvq:['코드북을 더할 때 오차와 토큰 수가 어떻게 함께 움직이는지 봅니다.',[['Mimi, 코드북 8개',{codec:'12.5',books:8}],['EnCodec, 코드북 8개',{codec:'75',books:8}],['Mimi, 코드북 1개',{codec:'12.5',books:1}]],'Mimi 8개는 10초에 1,000개 토큰, EnCodec 8개는 6,000개여야 합니다. 코드북 1개는 토큰이 적지만 오차가 가장 큽니다.'],
 budget:['TTS 시작 시점과 음성 인식 방식이 지연 예산을 어떻게 바꾸는지 더합니다.',[['스트리밍, 첫 토큰부터',{asr:'stream',ttsafter:1}],['스트리밍, 20토큰 모음',{asr:'stream',ttsafter:20}],['청크 방식 인식',{asr:'chunked',ttsafter:20}]],'첫 토큰부터 말하면 원본 예산표의 400 ms, 20토큰을 모으면 780 ms여야 합니다. 청크 방식 인식은 2초가 넘어 고장 난 듯이 느껴집니다.'],
 vad:['문턱과 사전 버퍼가 첫 단어 잘림과 잡음 오작동을 어떻게 맞바꾸는지 셉니다.',[['기본 문턱 0.5',{vthr:.5,preroll:'0'}],['민감한 문턱 0.3',{vthr:.3,preroll:'0'}],['0.5 + 사전 버퍼',{vthr:.5,preroll:'300'}]],'0.5에서는 앞부분 100 ms가 잘리고, 0.3에서는 잘림이 없는 대신 후드 팬에 한 번 반응해야 합니다. 사전 버퍼를 붙이면 0.5에서도 잘림이 0이 됩니다.'],
 hangover:['침묵 대기 시간이 말 끊김과 대답 지연을 어떻게 맞바꾸는지 봅니다.',[['짧게 400 ms',{hang:400,flush:'yes'}],['권장 700 ms',{hang:700,flush:'yes'}],['700 ms, 흘려보내기 없음',{hang:700,flush:'no'}]],'400 ms는 “음…” 뒤에서 한 번 끼어들고, 700 ms는 끼어들지 않으면서 825 ms 뒤에 대답해야 합니다. 흘려보내기를 빼면 375 ms가 더 늦어집니다.'],
 watermark:['비트 복원율이 떨어질 때 검출 확률이 얼마나 급하게 무너지는지 계산합니다.',[['압축 정도 (p 0.02)',{ber:.02,k:'14'}],['잡음 (p 0.1)',{ber:.1,k:'14'}],['음높이 변경 (p 0.45)',{ber:.45,k:'14'}]],'p 0.02에서는 99% 넘게 검출되고, p 0.45(복원율 0.55)에서는 1% 아래로 떨어져야 합니다. 오탐 확률은 기준 비트에만 달려 있습니다. 예제의 p 값은 교육용 가정입니다.'],
 slices:['평균 WER이 작은 집단의 높은 오류를 얼마나 가리는지 봅니다.',[['어르신 5%',{elder:5,ewer:30}],['어르신 20%',{elder:20,ewer:30}],['평가 세트에 어르신 없음',{elder:0,ewer:30}]],'어르신 비율 5%면 전체 WER은 5.3%로 괜찮아 보이지만 어르신에게는 30%여야 합니다. 비율이 0이면 평균은 이 집단을 전혀 보지 못합니다.'],
 triage:['불만마다 원인을 겨누는 방안과 확인할 지표, 부족한 증거를 짚습니다.',[['첫 소리 잘림, 큰 모델',{complaint:'clip',fix:'bigger'}],['첫 소리 잘림, 사전 버퍼',{complaint:'clip',fix:'preroll'}],['어르신 불만, 집단별 평가',{complaint:'elder',fix:'slice'}]],'더 큰 모델은 어느 불만의 원인도 겨누지 않아야 하고, 사전 버퍼와 집단별 평가는 각 불만의 원인을 겨눠야 합니다. 시나리오이므로 실제 진단에는 로그가 필요합니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A07Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
