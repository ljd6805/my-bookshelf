window.RGuides=(()=>{
const guides={
 grounding:['같은 질문에 근거 없이 답할 때와 근거를 찾아 넣을 때를 나란히 봅니다.',[['근거 없이',{ask:1,mode:'closed'}],['근거와 함께',{ask:1,mode:'open'}],['잃어버리면 · 근거',{ask:4,mode:'open'}]],'“늦게 돌려주면”은 근거 없이 “하루 100원 연체료”라고 답하지만, 근거를 넣으면 D2의 연체 문장을 보여 줍니다. “잃어버리면”은 검색이 D2를 1위로 잘못 골라 근거가 있어도 답이 틀립니다. 검색이 틀리면 RAG도 틀립니다.'],
 invert:['질문 낱말의 문서 목록을 OR와 AND로 합칩니다.',[['책 반납 · OR',{query:'책 반납',combine:'or'}],['책 반납 · AND',{query:'책 반납',combine:'and'}],['늦게 돌려주면',{query:'늦게 돌려주면',combine:'or'}]],'“책 반납”은 OR로 D2·D3·D8·D9·D13 다섯 개, AND로 D2 하나입니다. “늦게 돌려주면”은 어떤 목록도 없어 0개입니다. 같은 뜻이라도 낱말이 다르면 역색인은 찾지 못합니다.'],
 bm25:['k1과 b를 하나씩 바꾸며 “대출 기간”의 순위가 어떻게 바뀌는지 봅니다.',[['기본 (1.2, 0.75)',{bq:'대출 기간',k1:1.2,b:.75}],['길이 무시 b=0',{bq:'대출 기간',k1:1.2,b:0}],['반복 무시 k1=0',{bq:'대출 기간',k1:0,b:.75}]],'기본값에서는 D1 대출 권수와 기간이 2.37로 1위입니다. b=0이면 “대출”이 다섯 번 나오는 이용 규정 전문(D13)이 2.79로 1위가 됩니다. k1=0이면 반복을 세지 않아 D1·D2·D6이 모두 2.07로 같아집니다.'],
 chunk:['조각 크기와 겹침을 바꾸며 4·5번 문장이 한 조각에 남는지 확인합니다.',[['2문장 · 겹침 0',{size:2,overlap:0}],['2문장 · 겹침 1',{size:2,overlap:1}],['3문장 · 겹침 1',{size:3,overlap:1}]],'2문장·겹침 0은 조각 5개로 4번과 5번이 갈라집니다. 겹침 1이면 조각 9개로 늘지만 C4에 함께 있습니다. 3문장·겹침 1은 조각 5개, 평균 약 33토큰이고 C2에 함께 있으며 BM25 3위입니다. 이 책은 다음 장부터 이 설정을 씁니다.'],
 embed:['질문 벡터의 방향과 가장 가까운 문서를 축 두 개로 봅니다.',[['늦게 돌려주면',{eq:1,ax:1,ay:0}],['그림책 읽어 주기',{eq:9,ax:3,ay:2}],['노트북 대여',{eq:11,ax:4,ay:0}]],'“늦게 돌려주면”은 낱말이 하나도 겹치지 않는 R2·D2를 cos 0.93으로 찾습니다. “그림책 읽어 주기”는 사전에 없는 낱말뿐이라 벡터가 0이 되어 찾지 못합니다. “노트북 대여”는 답이 없는데도 전자책 문서와 0.91로 가깝습니다.'],
 hybrid:['같은 질문에서 α를 바꾸며 1위 문서가 어떻게 바뀌는지 봅니다.',[['A-3 열람실 · 키워드만',{hq:3,alpha:1}],['늦게 · 키워드만',{hq:1,alpha:1}],['늦게 · 반반',{hq:1,alpha:.5}]],'A-3 열람실은 키워드만 써도 D7이 1위입니다. “늦게 돌려주면”은 키워드만 쓰면 “책”이 겹친 D9 상호대차가 1위(오답)지만, α=0.5에서는 D2가 0.81로 1위가 됩니다.'],
 metrics:['검색 방식과 k를 바꾸며 질문 10개의 평균 지표를 비교합니다.',[['키워드 · k=1',{method:'keyword',k:1}],['의미 · k=1',{method:'meaning',k:1}],['혼합 · k=3',{method:'hybrid',k:3}]],'k=1에서 정밀도는 키워드 0.70, 의미 0.80, 혼합 0.90입니다. MRR은 0.76, 0.83, 0.93입니다. 혼합 k=3은 재현율 0.85지만 정밀도는 0.30으로 떨어집니다.'],
 rerank:['후보 수 N을 바꾸며 “책을 잃어버리면”의 정답 R3가 몇 위가 되는지 봅니다.',[['N=3',{pool:3,rq:4}],['N=5',{pool:5,rq:4}],['N=1',{pool:1,rq:4}]],'1차 검색은 R3를 4위에 둡니다. N=3이면 R3가 후보에 없어 재순위가 도울 수 없습니다. N=5이면 R3가 1위로 올라오고, 질문 10개의 1위 적중률이 90%에서 100%가 됩니다.'],
 pack:['토큰 예산을 바꾸며 어떤 근거가 들어가고 빠지는지 봅니다.',[['예산 100',{pq:1,budget:100}],['예산 200',{pq:1,budget:200}],['예산 400',{pq:1,budget:400}]],'“늦게 돌려주면”에서 예산 100이면 D2·D3 두 개가 들어가 정답 D2가 포함됩니다. 예산을 늘리면 R2도 들어오지만 D8·D9 같은 관련 없는 조각이 함께 늘고 KV 캐시도 커집니다.'],
 abstain:['문턱과 1위 근거를 고르는 방법을 바꾸며 네 가지 결과를 셉니다.',[['문턱 0',{threshold:0,ranker:'hybrid'}],['문턱 0.4',{threshold:.4,ranker:'hybrid'}],['재순위 · 0.5',{threshold:.5,ranker:'rerank'}]],'문턱 0이면 모두 답해 9개를 맞히고 4개를 틀립니다. 0.4로 올리면 와이파이 질문을 바르게 보류합니다. 재순위·0.5는 9개를 맞히고 틀린 답을 2개로 줄이지만, 노트북 대여(0.79)는 여전히 답해 버립니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){RLabs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',()=>box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed')));
}
return {mount,guides};
})();
