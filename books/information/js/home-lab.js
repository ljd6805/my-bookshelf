/* 표지의 살아 있는 실험: 윤슬의 메시지를 몇 개 모아 허프만 부호를 지으면 한 글자에 몇 비트가 드는지. 실제 계산이다. */
window.ITHome=(()=>{
function mount(el){
 const M=ITMath,U=ITUI;
 el.innerHTML=`<div class="lab-top"><span>윤슬의 메시지를 한 글자에 몇 비트로 적을까</span><span>HUFFMAN / 실제 계산</span></div><div class="home-graphic"></div><div class="network-controls">${U.range('home-n','모은 메시지 수',5,70,5,70)}<div class="buttons"><button type="button" data-n="5">5개</button><button type="button" data-n="20">20개</button><button type="button" data-n="70">70개 전부</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>윤슬의 메시지(이 책을 위해 지어낸 합성 데이터)를 앞에서부터 모아 글자 빈도를 세고, 그 빈도로 허프만 부호를 브라우저에서 짓습니다. 막대는 같은 글을 UTF-8, 고정 길이, 허프만으로 적었을 때 한 글자에 드는 비트와 엔트로피(평균 길이의 하한)입니다. 허프만 부호표를 함께 보내는 비용은 넣지 않았습니다.</p></details>`;
 const input=el.querySelector('#home-n'),box=el.querySelector('.home-graphic');
 function update(){
  const n=Number(input.value),t=M.corpus.first(n),s=M.stats(t),h=M.huffman(s.counts.map(([sym,w])=>({sym,w}))),utf=new TextEncoder().encode(t).length*8/s.n,fixed=Math.ceil(Math.log2(s.distinct));
  el.querySelector('#home-n-value').textContent=`${n}개`;
  box.innerHTML=U.bars(['UTF-8','고정 길이','허프만','엔트로피'],[utf,fixed,h.L,h.H],{unit:'비트',digits:2,max:20,mark:i=>i===2});
  el.querySelector('.home-result').innerHTML=`메시지 ${n}개, ${s.n}글자, 서로 다른 글자 ${s.distinct}개. 허프만 부호는 한 글자에 <b>${U.fmt(h.L,2)}비트</b>로, UTF-8(${U.fmt(utf,1)}비트)의 ${U.pct(h.L/utf,0)}입니다. 엔트로피 ${U.fmt(h.H,2)}비트보다 ${U.fmt(h.L-h.H,3)}비트 깁니다.`;
 }
 const click=e=>{const b=e.target.closest('[data-n]');if(b){input.value=b.dataset.n;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
