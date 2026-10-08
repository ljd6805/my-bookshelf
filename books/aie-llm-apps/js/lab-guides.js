/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A12Guides=(()=>{
const guides={
 sampling:['온도와 top-p가 정답 후보와 꼬리 후보의 확률을 어떻게 옮기는지 확인합니다.',[['온도 0',{'sp-temp':0,'sp-topp':'1'}],['온도 1.5',{'sp-temp':1.5,'sp-topp':'1'}],['온도 1.5 + top-p 0.5',{'sp-temp':1.5,'sp-topp':'0.5'}]],'온도 0에서는 "14일"이 100%입니다. 온도 1.5에서는 "14일"이 45.5%로 내려가고 틀린 답 "환불 불가"가 5.4%까지 오릅니다. 같은 온도에 top-p 0.5를 걸면 후보 두 개("14일" 67.6%, "7일" 32.4%)만 남아 꼬리가 사라집니다.'],
 fewshot:['예시 수와 길이가 문의 한 건과 하루 전체의 입력 토큰을 얼마나 늘리는지 봅니다.',[['예시 0개',{'fs-k':0,'fs-per':80}],['예시 3개 × 80토큰',{'fs-k':3,'fs-per':80}],['예시 10개 × 200토큰',{'fs-k':10,'fs-per':200}]],'예시가 없으면 350토큰입니다. 80토큰짜리 3개를 넣으면 590토큰으로 1.69배, 200토큰짜리 10개를 넣으면 2,350토큰으로 6.71배가 되어 하루 1만 건에 2,350만 토큰을 씁니다.'],
 vote:['풀이 수를 늘리면 다수결 정답률이 오르는 경우와 오히려 내려가는 경우를 비교합니다.',[['p 0.7 · N 5',{'vt-p':0.7,'vt-n':'5'}],['p 0.7 · N 15',{'vt-p':0.7,'vt-n':'15'}],['p 0.4 · N 15',{'vt-p':0.4,'vt-n':'15'}]],'p = 0.7이면 N = 5에서 0.837, N = 15에서 0.950으로 오르지만 오름폭은 점점 줄어듭니다. p = 0.4이면 N = 15에서 0.213으로 풀이 하나일 때보다 나빠집니다.'],
 jsonmask:['단계마다 스키마가 허용하는 토큰이 어떻게 달라지는지, 그리고 무엇은 막지 못하는지 봅니다.',[['3단계 · order_id 값',{'jm-step':3}],['7단계 · qty 값',{'jm-step':7}],['11단계 · refund 값',{'jm-step':11}]],'3단계 문자열 자리에서는 "A-1042"와 "네, 확인했습니다" 두 개가 모두 허용됩니다. 7단계 정수 자리에서는 "2" 하나만, 11단계 참·거짓 자리에서는 true와 false만 남습니다.'],
 budget:['창이 넘치는 조건과, 어떤 압축이 얼마나 자리를 되찾는지 확인합니다.',[['기본값 (128K)',{'cb-window':'128000','cb-tools':50,'cb-turns':20,'cb-chunks':10,'cb-strategy':'none'}],['32K · 압축 없음',{'cb-window':'32000','cb-tools':60,'cb-turns':80,'cb-chunks':20,'cb-strategy':'none'}],['32K · 가지치기 + 요약',{'cb-window':'32000','cb-tools':60,'cb-turns':80,'cb-chunks':20,'cb-strategy':'both'}]],'기본값은 20,200토큰으로 128K 창의 15.8%입니다. 32K 창에 도구 60개, 80턴, 청크 20개를 넣으면 37,700토큰으로 5,700토큰 넘칩니다. 가지치기와 요약을 함께 쓰면 15,650토큰(48.9%)으로 다시 들어옵니다.'],
 embedstore:['차원과 정밀도를 바꾸면 같은 조각 수의 저장량이 얼마나 줄어드는지 봅니다.',[['1536 · float32',{'es-dims':'1536','es-prec':'float32','es-n':10}],['256 · float32',{'es-dims':'256','es-prec':'float32','es-n':10}],['1536 · 이진',{'es-dims':'1536','es-prec':'binary','es-n':10}]],'1,000만 조각에서 1536차원 float32는 61.44GB, 256차원으로 자르면 10.24GB(6분의 1), 이진 양자화는 1.92GB(32분의 1)입니다. 줄인 만큼의 정확도 손실은 계산하지 않으므로 인용한 대략값과 함께 읽으세요.'],
 lora:['학습 방식에 따라 메모리가 얼마나 달라지고, 랭크와 대상 층은 학습량을 얼마나 바꾸는지 봅니다.',[['q·v · 랭크 16 · LoRA',{'lr-target':'qv','lr-rank':'16','lr-method':'lora'}],['q·v · 랭크 16 · QLoRA',{'lr-target':'qv','lr-rank':'16','lr-method':'qlora'}],['전체 미세조정',{'lr-target':'qv','lr-rank':'16','lr-method':'full'}]],'q·v 랭크 16은 8,388,608개(0.124%)만 학습하며 LoRA 하한은 13.54GB, QLoRA는 3.44GB입니다. 전체 미세조정은 모든 파라미터마다 8바이트를 잡아 53.91GB가 됩니다.'],
 toolloop:['도구 호출을 병렬로 바꾸면 고객의 대기 시간이 얼마나 줄어드는지 확인합니다.',[['도구 5개 · 순차',{'tl-n':5,'tl-tool':500,'tl-mode':'sequential'}],['도구 5개 · 병렬',{'tl-n':5,'tl-tool':500,'tl-mode':'parallel'}],['도구 1개',{'tl-n':1,'tl-tool':500,'tl-mode':'parallel'}]],'도구 5개를 500ms씩 순차로 부르면 7,300ms, 병렬이면 2,100ms로 71% 줄어듭니다. 도구가 1개면 두 방식 모두 2,100ms로 같습니다.'],
 mcp:['2026-07-28 규칙에서 어떤 요청이 처리되고 어떤 오류 코드가 돌아오는지 봅니다.',[['올바른 요청 · HTTP',{'mc-variant':'ok','mc-transport':'http'}],['지원하지 않는 버전 · stdio',{'mc-variant':'oldversion','mc-transport':'stdio'}],['헤더 불일치 · HTTP',{'mc-variant':'header','mc-transport':'http'}]],'올바른 요청은 HTTP 200과 resultType complete, 60초 공유 캐시 힌트를 받습니다. 2025-11-25 버전은 −32022와 함께 supported ["2026-07-28"], requested "2025-11-25"를 받습니다. 헤더 버전만 다른 요청은 HTTP에서 400과 −32020을 받지만, stdio로 보내면 헤더가 없어 처리됩니다.'],
 wilson:['같은 통과율 90%라도 사례 수에 따라 구간 폭이 얼마나 달라지는지 봅니다.',[['50개',{'wl-n':50,'wl-acc':0.9}],['200개',{'wl-n':200,'wl-acc':0.9}],['1,000개',{'wl-n':1000,'wl-acc':0.9}]],'50개는 [78.6%, 95.7%]로 폭이 17.0%p입니다. 200개는 [85.1%, 93.4%]로 8.4%p, 1,000개는 3.7%p로 좁아집니다.'],
 judge:['일치율과 카파가 서로 다른 이야기를 하는 경우를 찾습니다.',[['무조건 통과하는 판정자',{'jg-pass':0.9,'jg-sens':1,'jg-spec':0}],['민감도·특이도 0.9',{'jg-pass':0.9,'jg-sens':0.9,'jg-spec':0.9}],['사람 통과 50%',{'jg-pass':0.5,'jg-sens':0.9,'jg-spec':0.9}]],'무조건 통과하는 판정자는 일치율 0.900이지만 카파는 0입니다. 민감도·특이도가 0.9이면 일치율은 같은 0.900인데 카파는 0.590이고, 사람 통과가 50%인 세트에서는 같은 판정자의 카파가 0.800으로 올라갑니다.'],
 guard:['임계값과 공격 비율에 따라 막힌 요청 가운데 진짜 공격이 얼마나 되는지 봅니다.',[['임계값 0.5 · 공격 1%',{'gd-thr':0.5,'gd-share':'0.01'}],['임계값 0.9 · 공격 1%',{'gd-thr':0.9,'gd-share':'0.01'}],['임계값 0.7 · 공격 10%',{'gd-thr':0.7,'gd-share':'0.1'}]],'임계값 0.5, 공격 1%에서는 공격 80건을 잡고 정상 문의 2,227.5건을 막아 정밀도가 3.5%입니다. 0.9로 올리면 정상 문의 247.5건만 막지만 공격의 75%를 놓칩니다. 공격이 10%라면 임계값 0.7에서 정밀도가 41.9%로 올라갑니다.'],
 semcache:['임계값을 올리고 내릴 때 적중, 잘못된 적중, 놓친 질문이 어떻게 맞바뀌는지 봅니다.',[['0.85',{'sc-thr':0.85}],['0.92',{'sc-thr':0.92}],['0.96',{'sc-thr':0.96}]],'0.85에서는 12개 모두 캐시로 답하지만 5개가 잘못된 적중입니다. 0.92에서는 9개 중 3개가 잘못이고 1개를 놓칩니다. 0.96에서 잘못된 적중이 0이 되지만 적중은 3개뿐이고 4개를 놓칩니다.'],
 promptcache:['읽기 횟수와 배치가 접두부 비용 배수를 어떻게 바꾸는지 확인합니다.',[['5분 · 읽기 1번',{'pc-reads':1,'pc-provider':'a5','pc-layout':'stable','pc-prefix':'15000'}],['5분 · 읽기 10번',{'pc-reads':10,'pc-provider':'a5','pc-layout':'stable','pc-prefix':'15000'}],['시각을 맨 위에',{'pc-reads':20,'pc-provider':'a5','pc-layout':'timestamp','pc-prefix':'15000'}]],'읽기 1번이면 0.675배, 10번이면 0.205배입니다. 현재 시각을 맨 위에 두면 읽기를 20번 해도 매번 쓰기만 일어나 1.25배, 즉 캐시가 없을 때보다 25% 더 냅니다.'],
 graph:['멈춤 위치와 리듀서에 따라 체크포인트의 상태가 어떻게 달라지는지 봅니다.',[['환불 앞에서 멈춤',{'gr-step':4,'gr-reducer':'add','gr-interrupt':'before'}],['환불 뒤에서 멈춤',{'gr-step':5,'gr-reducer':'add','gr-interrupt':'after'}],['덮어쓰기 리듀서',{'gr-step':6,'gr-reducer':'overwrite','gr-interrupt':'before'}]],'환불 앞에서 멈추면 체크포인트 4에서 메시지 4개, 환불은 아직입니다. 환불 뒤에서 멈추면 체크포인트 5에서 이미 환불이 끝난 채 승인을 묻습니다. 덮어쓰기 리듀서는 체크포인트 6에서도 메시지가 1개뿐입니다.'],
 capstone:['적중률과 작은 모델 비율이라는 두 손잡이로 청구서를 예산 안에 넣어 봅니다.',[['출시 계획 · 적중 35%',{'cp-hit':35,'cp-mini':0,'cp-dau':10000}],['2주 차 · 적중 8%',{'cp-hit':8,'cp-mini':0,'cp-dau':10000}],['적중 8% + 작은 모델 30%',{'cp-hit':8,'cp-mini':30,'cp-dau':10000}]],'적중 35%이면 한 달 $7,556으로 예산 안입니다. 적중이 8%로 떨어지면 $10,695로 $2,695 넘칩니다. 작은 모델 30%를 더하면 $7,679로 다시 들어오지만, 그 답의 품질 증거는 따로 필요합니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A12Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
