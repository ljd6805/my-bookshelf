/* 표지의 살아 있는 실험: 같은 질문을 키워드와 의미 비율 α로 검색한다. 실제 계산이다. */
window.RHome=(()=>{
function mount(el){
 const q=RMath.QUESTIONS[1];
 el.innerHTML=`<div class="lab-top"><span>같은 질문, 두 가지 검색</span><span>HYBRID / α</span></div><div class="home-graphic"><p class="home-q">“${q.text}”</p><div class="home-rank"></div></div><div class="network-controls">${RUI.range('home-alpha','키워드 비중 α (0 = 의미만, 1 = 키워드만)',0,1,.05,.5)}<div class="buttons"><button type="button" data-alpha="1">키워드만</button><button type="button" data-alpha="0">의미만</button><button type="button" data-alpha="0.5">반반</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>가상의 한빛시립도서관 안내 문서 13개(규정은 5조각)에서 BM25 키워드 점수와 손으로 정한 7차원 임베딩의 코사인 점수를 0~1로 맞춰 α로 섞습니다. 질문에는 문서와 같은 낱말이 “책” 하나뿐입니다. 정답은 D2(연체와 대출 정지)와 R2(규정 3~5문장)입니다.</p></details>`;
 const input=el.querySelector('#home-alpha');
 function update(){
  const a=Number(input.value),rows=RMath.hybrid(q.text,RMath.corpus(true),a).slice(0,4),max=Math.max(rows[0].score,.01);
  el.querySelector('#home-alpha-value').textContent=a.toFixed(2);
  el.querySelector('.home-rank').innerHTML=rows.map((r,i)=>{const ok=q.rel.includes(r.id);return `<div class="home-row ${ok?'right':''}"><b>${i+1}</b><span>${r.id} ${r.doc.title}${ok?' ✓':''}</span><i style="width:${r.score/max*100}%"></i><strong>${r.score.toFixed(2)}</strong></div>`;}).join('');
  const ok=q.rel.includes(rows[0].id);
  el.querySelector('.home-result').innerHTML=`α=${a.toFixed(2)} · 1위 <b>${rows[0].id}</b> ${ok?'정답 근거입니다.':'정답이 아닙니다.'}<br>${a>.8?'키워드만 보면 “책”이 겹친 문서가 위로 옵니다.':a<.2?'의미만 보면 낱말이 달라도 연체 문서를 찾습니다.':'두 점수를 섞으면 한쪽이 놓친 문서를 다른 쪽이 건집니다.'}`;
 }
 const click=e=>{const b=e.target.closest('[data-alpha]');if(b){input.value=b.dataset.alpha;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
