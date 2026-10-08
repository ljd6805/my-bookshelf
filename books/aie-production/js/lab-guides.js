/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A18Guides=(()=>{
const guides={
 breakeven:['전용 GPU의 100만 토큰당 비용이 사용률에 따라 어떻게 변하고, 어디서 토큰 단가와 만나는지 확인합니다.',[['누리봇 예상 사용률 68%',{util:0.68,price:1.6}],['낮은 사용률 20%',{util:0.2,price:1.6}],['싼 토큰 단가 $0.90',{util:0.68,price:0.9}]],'사용률 68%에서 전용 GPU는 100만 토큰당 약 $0.71로 토큰 단가 $1.60보다 쌉니다. 사용률이 20%로 떨어지면 약 $2.42로 뒤집힙니다. 토큰 단가가 $0.90로 내리면 손익분기 사용률은 30.2%에서 53.7%로 오릅니다.'],
 hbm:['가중치 형식과 KV 정밀도가 HBM 80GB 안에 받을 수 있는 대화 수를 각각 어떻게 바꾸는지 확인합니다.',[['FP8 가중치 · FP8 KV · 14개',{fmt:'fp8',kvb:1,conc:14}],['INT4 · BF16 KV · 59개',{fmt:'int4',kvb:2,conc:59}],['INT4 · FP8 KV · 119개',{fmt:'int4',kvb:1,conc:119}]],'FP8 가중치(70GB)는 대화 14개에서 꽉 찹니다. INT4(35GB)로 바꾸면 BF16 KV로 59개, FP8 KV로 119개까지 들어갑니다. NVFP4는 배율 값 때문에 39.4GB가 되어 FP8 KV로 106개까지 받습니다. BF16 가중치는 140GB라 한 장에 올라가지 않습니다.'],
 edge:['대역폭과 모델 크기만으로 정해지는 디코드 속도의 상한을 확인합니다.',[['휴대폰 90GB/s · 8B',{bw:90,model:8}],['휴대폰 90GB/s · 3B',{bw:90,model:3}],['HBM 3,000GB/s · 70B',{bw:3000,model:70}]],'90GB/s에서 8B 모델(4GB)의 상한은 초당 22.5토큰, 3B(1.5GB)는 60토큰으로 약 2.7배입니다. 같은 식으로 3,000GB/s의 데이터센터 GPU에서도 70B(35GB)는 초당 약 86토큰이 상한입니다.'],
 chunk:['조각 크기를 줄일 때 이웃의 토큰 간격과 긴 프롬프트의 첫 토큰 시간이 서로 반대로 움직이는지 확인합니다.',[['끔 · 32,000토큰',{chunkSize:0,plen:32000}],['512토큰 조각',{chunkSize:512,plen:32000}],['256토큰 조각',{chunkSize:256,plen:32000}]],'청크 프리필을 끄면 이웃 손님은 807ms 동안 토큰을 받지 못합니다. 512토큰 조각이면 이웃의 간격은 19.8ms로 목표 안에 들지만 긴 프롬프트의 첫 토큰은 1,241ms로 늦어집니다. 256토큰으로 더 줄이면 간격은 13.4ms, 첫 토큰은 1,675ms가 됩니다.'],
 goodput:['평균과 P99, goodput이 같은 기록에서 서로 다른 이야기를 하는지 확인합니다.',[['청크 프리필 끔 · TPOT 25ms',{tpotSlo:25,chunked:'off'}],['청크 프리필 켬 · TPOT 25ms',{tpotSlo:25,chunked:'on'}],['켬 · TPOT 10ms로 조임',{tpotSlo:10,chunked:'on'}]],'청크 프리필을 끄면 평균 TPOT은 9.5ms로 좋아 보이지만 P99는 64.3ms이고 goodput은 94.45%입니다. 켜면 goodput이 97%로 오릅니다. 같은 설정에서 목표를 10ms로 조이면 94.65%로 내려가므로, goodput은 목표를 함께 적어야 뜻이 있습니다.'],
 spec:['초안이 받아들여지는 비율과 서버가 붐비는 정도에 따라 추측 디코딩이 이득인지 손해인지 확인합니다.',[['α 0.7 · K 5 · 한가함',{alpha:0.7,specK:5,load:'low'}],['α 0.7 · K 5 · 붐빔',{alpha:0.7,specK:5,load:'high'}],['α 0.4 · K 5 · 붐빔',{alpha:0.4,specK:5,load:'high'}]],'α 0.7, K 5에서 검증 한 번에 약 2.94토큰을 얻습니다. 한가할 때는 2.26배 빨라지지만 붐비면 1.51배로 줄고, 손익분기 α는 0.231에서 0.495로 오릅니다. 붐빌 때 α가 0.4로 떨어지면 0.85배로 오히려 느려집니다.'],
 kvtransfer:['프리필과 디코드를 다른 GPU로 나눌 때 KV를 옮기는 시간이 얼마나 되는지 확인합니다.',[['4K · RDMA',{plen2:4096,link:'rdma'}],['4K · TCP',{plen2:4096,link:'tcp'}],['256토큰 · RDMA',{plen2:256,link:'rdma'}]],'4,096토큰의 KV는 약 671MB이고 RDMA로 20ms, 프리필 시간 102.4ms의 약 20%입니다. TCP로 바꾸면 80ms로 약 78%가 됩니다. 256토큰처럼 짧은 프롬프트는 옮길 이유가 없어 같은 GPU에서 처리합니다.'],
 router:['같은 요청 줄을 어느 복제본에 보내느냐에 따라 접두부 캐시 적중률이 얼마나 달라지는지 확인합니다.',[['라운드 로빈 · 4대',{strategy:'rr',replicas:4,order:'fixed'}],['캐시를 아는 라우터 · 4대',{strategy:'aware',replicas:4,order:'fixed'}],['캐시 라우터 · 날짜가 앞',{strategy:'aware',replicas:4,order:'dynamic'}]],'라운드 로빈은 4대에서 적중률이 약 32%에 머뭅니다. 캐시를 아는 라우터는 같은 접두부를 같은 복제본으로 모아 99.5%까지 올리고, 가장 바쁜 복제본도 34% 정도만 맡습니다. 프롬프트 맨 앞에 날짜와 사용자 ID를 두면 어떤 라우터도 약 1% 이하밖에 맞히지 못합니다(라운드 로빈 0.25%, 캐시 라우터 1.1%).'],
 coldstart:['0대에서 깨어날 때 어떤 단계가 시간을 가장 많이 쓰고, 어떤 완화책이 그 단계를 줄이는지 확인합니다.',[['아무 완화책 없음',{node:'ca',image:'pull',weights:'plain',warm:0}],['Karpenter · 이미지 심기 · 스냅숏',{node:'karp',image:'seeded',weights:'snapshot',warm:0}],['웜 풀 1대',{node:'ca',image:'pull',weights:'plain',warm:1}]],'아무것도 하지 않으면 첫 요청이 383초를 기다리고 그중 이미지 내려받기가 180초입니다. 노드·이미지·가중치 완화책을 모두 켜면 62.5초로 줄지만 여전히 1분입니다. 웜 풀 1대는 첫 요청을 3초로 만들지만 매달 2,920달러가 듭니다.'],
 bill:['프롬프트 캐시 적중률과 배치 차선이 하루 청구액을 각각 얼마나 줄이는지 확인합니다.',[['적중률 7% · 즉시',{hit:0.07,lane:'sync'}],['적중률 74% · 즉시',{hit:0.74,lane:'sync'}],['적중률 74% · 배치',{hit:0.74,lane:'batch'}]],'캐시를 켜지 않은 기준은 하루 105달러입니다. 적중률이 7%면 쓰기 할증 때문에 115.17달러로 오히려 비쌉니다. 접두부 순서를 고쳐 74%가 되면 68.94달러, 같은 요청을 배치로 보내면 34.47달러입니다.'],
 cascade:['작은 모델로 보내는 몫을 늘릴 때 비용과 품질 손실이 함께 움직이는 지점을 확인합니다.',[['70% · 계단식',{frac:0.7,cmode:'cascade'}],['90% · 계단식',{frac:0.9,cmode:'cascade'}],['90% · 미리 분류',{frac:0.9,cmode:'pre'}]],'쉬운 질문 70%만 보내면 비용은 39.1%로 줄고 품질 손실은 없습니다. 90%로 늘리면 비용은 35.7%로 조금 더 줄지만 어려운 질문 4%를 놓칩니다. 확신도 검사 없이 미리 분류만 하면 비용은 12.7%까지 내려가는 대신 품질 손실이 20%가 됩니다.'],
 fallback:['재시도와 대체 공급자가 손님이 보는 실패율과 지연을 어떻게 바꾸는지 확인합니다.',[['실패율 30% · 재시도 2번',{p429:0.3,retries:2,fb:'no'}],['재시도 2번 · 대체 있음',{p429:0.3,retries:2,fb:'yes'}],['완전 장애 · 재시도 3번',{p429:1,retries:3,fb:'no'}]],'첫 공급자가 30% 실패할 때 재시도 2번이면 손님이 보는 실패율은 2.7%입니다. 대체 공급자를 더하면 0.054%로 떨어지지만 가장 늦은 성공은 3,010ms로 전체 시간 목표를 넘습니다. 첫 공급자가 완전히 멈추면 재시도를 몇 번 하든 실패율은 100%입니다.'],
 canary:['카나리 단계가 작을 때 관문이 우연히 울릴 위험과, 실제 악화를 놓칠 위험을 함께 확인합니다.',[['거절률 · 악화 없음',{metric:'refusal',ratio:1}],['비용 · 1.3배 악화',{metric:'cost',ratio:1.3}],['싫어요 · 악화 없음',{metric:'feedback',ratio:1}]],'악화가 없어도 거절률 관문은 1% 단계에서 21.8%의 확률로 잘못 울립니다. 요청당 비용이 1.3배 나빠지면 관문(1.2배)이 1% 단계에서 70%, 10% 단계까지 가면 94% 확률로 울립니다. 싫어요 관문은 악화가 없을 때 1% 단계에서 26.6% 확률로 울립니다.'],
 burnrate:['카오스 실험의 영향 범위와 주입 강도가 오류 예산을 얼마나 빨리 쓰는지 확인합니다.',[['범위 5% · 오류 20%',{blast:0.05,inj:0.2}],['범위 1% · 오류 30%',{blast:0.01,inj:0.3}],['범위 20% · 완전 장애',{blast:0.2,inj:1}]],'범위 5%에 오류 20%를 넣으면 소진 속도는 2.2배라서 실험을 멈춥니다. 범위 1%에 30%면 0.8배라 계속해도 됩니다. 범위 20%에 완전 장애를 넣으면 40.2배로, 한 달 예산을 18시간 만에 다 씁니다.'],
 sampling:['성공 추적을 적게 남기면서도 오류와 드문 문제를 놓치지 않는 규칙을 확인합니다.',[['5% · 모두 같은 비율',{srate:0.05,rule:'uniform'}],['5% · 오류·고비용은 모두',{srate:0.05,rule:'rules'}],['1% · 오류·고비용은 모두',{srate:0.01,rule:'rules'}]],'모든 추적을 5%로 남기면 오류 추적도 5%만 남습니다. 오류와 고비용 요청을 모두 남기는 규칙을 더하면 보관량은 11.65%로 늘지만 오류 추적은 100% 남습니다. 하루 20번 나타나는 드문 문제를 잡을 확률은 표본 비율이 정하므로 5%에서 64.2%, 1%에서 18.2%입니다.'],
 diagnose:['보고된 증상에 맞는 처방만 실패한 지표를 움직이는지 확인합니다.',[['첫 손님 대기 · 웜 풀',{report:'cold',fix:'warm'}],['청구서 · 순서 바꾸기',{report:'cache',fix:'reorder'}],['끊김 · 청크 프리필',{report:'tail',fix:'chunk'}]],'콜드 스타트 보고에 웜 풀을 처방하면 첫 대기가 383초에서 3초로 줄고, 청구서 보고에 순서 바꾸기를 처방하면 115.17달러가 68.94달러로 줄며, 끊김 보고에 청크 프리필을 처방하면 goodput이 94.45%에서 97%로 오릅니다. 처방을 엇갈려 고르면 지표는 그대로입니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A18Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
