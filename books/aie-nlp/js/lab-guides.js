/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A06Guides=(()=>{
const guides={
 split:['같은 질문을 세 가지 단위로 잘라 어휘 크기와 검색되는 문의 수를 비교합니다.',[['어절 그대로',{q:'환불 언제 돼요',mode:'space'}],['조사 떼기',{q:'환불 언제 돼요',mode:'josa'}],['글자 두 개',{q:'환불 언제 돼요',mode:'char2'}]],'어절 그대로는 “환불은”을 놓치고, 조사 떼기는 걸리는 문의가 늘어납니다. 글자 두 개 조각은 어휘가 47개로 커집니다.'],
 bpe:['병합 횟수에 따라 토큰 수, 어휘 크기, 처음 보는 낱말의 분할이 어떻게 바뀌는지 봅니다.',[['병합 없음',{merges:0}],['병합 3번',{merges:3}],['병합 8번',{merges:8}]],'병합이 늘수록 토큰 수는 79개에서 33개로 줄고 어휘는 커집니다. 처음 보는 “배송료”도 아는 조각 “배송”을 재사용합니다.'],
 tfidf:['한 낱말이 얼마나 많은 문의에 나오느냐가 그 낱말의 무게를 어떻게 바꾸는지 봅니다.',[['한 통에만',{df:1}],['실제 문의함',{df:2}],['여덟 통 모두',{df:8}]],'df가 8이면 평활 없는 식의 가중치는 0입니다. 평활 식은 1을 더해 작은 무게를 남깁니다.'],
 skipgram:['문맥 창 크기가 학습 쌍의 수와 주변 낱말 통계를 어떻게 바꾸는지 봅니다.',[['환불 · 창 1',{win:1,target:'환불'}],['환불 · 창 3',{win:3,target:'환불'}],['배송 · 창 2',{win:2,target:'배송'}]],'창을 1에서 3으로 넓히면 쌍이 44개에서 86개로 늘고, 바로 옆이 아닌 낱말도 문맥에 들어옵니다.'],
 analogy:['같은 유추 벡터라도 순위 기준이 코사인이냐 내적이냐에 따라 답이 바뀌는지 봅니다.',[['시인 찾기 · 코사인',{set:0,measure:'cos'}],['시인 찾기 · 내적',{set:0,measure:'dot'}],['소설가 찾기 · 코사인',{set:2,measure:'cos'}]],'코사인은 관계가 맞는 낱말을 1위에 놓고, 내적은 길이가 긴 “책”을 1위에 올립니다.'],
 lda:['낱말 증거와 α가 한 문의의 주제 비율을 어떻게 움직이는지 봅니다.',[['배송 문의 그대로',{nref:0,alpha:'1'}],['환불 3개 추가',{nref:3,alpha:'1'}],['환불 3개 · α 0.1',{nref:3,alpha:'0.1'}]],'환불이 들어오면 환불·교환 주제가 커지고, α가 작으면 남는 주제 비율이 0에 가까워집니다.'],
 negation:['부정 범위 처리가 “안 좋아요” 같은 문장의 판정을 바꾸는지 봅니다.',[['안 좋아요 · 처리 없음',{sent:2,scope:'off'}],['안 좋아요 · NOT_ 처리',{sent:2,scope:'on'}],['나쁘지 않아요 · NOT_ 처리',{sent:0,scope:'on'}]],'처리 없이는 “내용이 안 좋아요”가 긍정으로 틀리고, NOT_ 표시를 붙이면 부정으로 바로잡힙니다.'],
 viterbi:['방출 확률이 작아질 때 전이 확률이 품사 줄을 얼마나 지켜 주는지 봅니다.',[['동사 확률 0.1',{pv:0.1}],['동사 확률 0.03',{pv:0.03}],['동사 확률 0.005',{pv:0.005}]],'0.03에서는 “can I book the book”의 첫 book만 명사로 바뀌고, 0.005에서는 두 문장 모두 바뀝니다. 최빈 품사 기준선은 늘 명사라고 답합니다.'],
 perplexity:['처음 보는 낱말 쌍이 퍼플렉서티를 어떻게 무너뜨리고, 평활이 그것을 어떻게 막는지 봅니다.',[['본 문장 · k 0',{sent:0,k:0}],['새 쌍 · k 0',{sent:1,k:0}],['새 쌍 · k 0.5',{sent:1,k:0.5}]],'k = 0에서 새 쌍이 든 문장은 퍼플렉서티가 무한대입니다. k를 주면 유한해지지만, 본 문장의 퍼플렉서티도 함께 올라갑니다.'],
 align:['날카로움 β가 디코더의 어텐션을 얼마나 한 어절에 모으는지 봅니다.',[['When · β 0',{word:'When',beta:0}],['When · β 3',{word:'When',beta:3}],['damaged · β 8',{word:'damaged',beta:8}]],'β = 0이면 다섯 어절을 똑같이 봅니다. β가 커지면 “When”은 “언제”에, “damaged”는 “파본”에 거의 모든 가중치를 줍니다.'],
 bleu:['빠뜨림, 어순 뒤섞기, 다른 표현이 BLEU를 각각 얼마나 깎는지 봅니다.',[['참조와 같음',{cand:0,maxn:4}],['한 낱말 빠뜨림',{cand:1,maxn:4}],['어순 뒤섞기',{cand:2,maxn:4}]],'빠뜨린 번역은 간결성 벌점을 받고, 어순을 뒤섞은 번역은 1-gram은 완벽하지만 4-gram이 하나도 맞지 않아 점수가 크게 떨어집니다.'],
 chunk:['조각 크기와 자르는 방식이 답 구간을 온전히 지키는지 봅니다.',[['150 · 고정',{size:150,strategy:'fixed'}],['150 · 문장',{size:150,strategy:'sentence'}],['300 · 고정',{size:300,strategy:'fixed'}]],'같은 150토큰이라도 문장 경계에서 자르면 답이 한 조각에 들어가고, 고정 길이는 조각을 키워도 답을 가를 수 있습니다.'],
 linking:['사전 확률과 문맥 중 어느 쪽을 믿느냐가 연결 결과를 어떻게 바꾸는지 봅니다.',[['신간 문의 · λ 0.3',{ctx:0,lambda:0.3}],['신간 문의 · λ 0.8',{ctx:0,lambda:0.8}],['주차 문의 · λ 0',{ctx:3,lambda:0}]],'λ가 0.6 이상이면 “신간”이 분명한데도 흔한 뜻인 강으로 잇습니다. 문맥이 아무것도 겹치지 않으면 NIL로 남깁니다.'],
 dst:['대화 상태를 어떻게 갱신하느냐가 몇째 턴부터 틀리게 만드는지 봅니다.',[['5턴 · 반영',{turn:5,policy:'full'}],['2턴 · 마지막만',{turn:2,policy:'lastonly'}],['3턴 · 덧붙이기',{turn:3,policy:'append'}]],'반영 방식은 JGA 1.00을 지키고, 마지막 턴만 보는 방식은 둘째 턴에 책과 배송지를 잃으며, 덧붙이는 방식은 셋째 턴에 배송지가 둘이 됩니다.'],
 constrain:['토큰마다의 작은 실수 확률이 긴 JSON 전체의 유효율을 얼마나 깎는지 봅니다.',[['p 0.9',{p:0.9}],['p 0.98',{p:0.98}],['p 0.999',{p:0.999}]],'p = 0.98이어도 24토큰 전체가 유효할 확률은 약 62%입니다. 재시도는 비용을 늘려 보완하고, 제약 디코딩은 형식을 구조로 보장합니다.'],
 needle:['문맥 길이와 과제 유형에 따라 깊이별 정답률이 어떻게 무너지는지 봅니다.',[['128k · 바늘 하나',{len:5,task:'single'}],['8k · 이어 추론',{len:1,task:'multi'}],['128k · 이어 추론',{len:5,task:'multi'}]],'바늘 하나는 128k에서도 가장자리를 잘 찾지만 가운데가 약하고, 이어 추론은 8k에서 이미 90% 아래로 내려갑니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A06Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
