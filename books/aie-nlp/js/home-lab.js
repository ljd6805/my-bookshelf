/* 표지 오른쪽의 살아 있는 대표 실험. 문의 하나를 골라 그 문의 안 낱말들의 TF-IDF를 실제로 계산한다. */
window.A06Home=(()=>{
const M=A06Math,U=A06UI;
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>문의 한 통의 핵심 낱말</span><span>TF-IDF</span></div><div class="home-graphic"></div><div class="network-controls">${U.range('home-doc','문의 번호 (마루책방 문의함 8통)',1,8,1,5)}<div class="buttons"><button type="button" data-k="1">1번 · 환불 시기</button><button type="button" data-k="5">5번 · 환불 독촉</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>문의를 어절로 나눈 뒤 끝 조사를 떼고, 낱말마다 TF(이 문의 안에서 차지하는 비율)와 IDF = ln(9 / (df + 1)) + 1(df는 그 낱말이 든 문의 수)을 곱합니다. 문의함 여덟 통으로 한 실제 계산이며, 조사 떼기는 단순 규칙이라 “작가”가 “작”으로 잘리는 실수도 그대로 보입니다.</p></details>`;
 const input=el.querySelector('#home-doc');
 function update(){const k=Number(input.value),rows=M.tfidfDoc(M.INBOX,k-1);el.querySelector('#home-doc-value').textContent=k;
  el.querySelector('.home-graphic').innerHTML=U.bars(rows.map(r=>r.word),rows.map(r=>r.w),'가중치',null,2);
  el.querySelector('.home-result').innerHTML=`${k}번 “${U.esc(M.INBOX[k-1])}”에서 가장 무거운 낱말은 <b>${U.esc(rows[0].word)}</b> (${U.fmt(rows[0].w,2)}, 문의 ${rows[0].df}통에 나옴)입니다.`;}
 const click=e=>{const b=e.target.closest('[data-k]');if(b){input.value=b.dataset.k;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
