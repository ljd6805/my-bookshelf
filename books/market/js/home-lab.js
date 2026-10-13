/* 표지의 살아 있는 실험: 하린이 새벽전자 호가창에 시장가 매수를 넣으면 매도 호가를 몇 단계 먹고 평균 얼마에 사는가. 3장 sweep과 같은 호가창, 실제 규칙 계산이다. */
window.MHome=(()=>{
function mount(el){
 const M=MMath,U=MUI,B=U.BOOK;
 el.innerHTML=`<div class="lab-top"><span>하린의 시장가 매수는 평균 얼마에 체결될까</span><span>ORDER BOOK / 새벽전자</span></div><div class="home-book"></div><div class="network-controls">${U.range('home-qty','시장가 매수 수량 (주)',0,3000,10,500)}<div class="buttons"><button type="button" data-qty="100">100주</button><button type="button" data-qty="1000">1,000주</button><button type="button" data-qty="2500">2,500주</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>가상 종목 새벽전자의 호가창(전일 종가 19,950원)에 시장가 매수 주문을 넣습니다. 주문은 가장 싼 매도 호가부터 차례로 체결되고, 평균 체결가가 맨 위 호가보다 얼마나 비싸졌는지(미끄러짐)를 계산합니다. 3장에서 같은 호가창을 자세히 봅니다.</p></details>`;
 const input=el.querySelector('#home-qty'),box=el.querySelector('.home-book'),out=el.querySelector('.home-result');
 function update(){
  const q=Number(input.value),r=M.sweep(B.asks,q);
  el.querySelector('#home-qty-value').textContent=`${U.fmt(q,0)}주`;
  box.innerHTML=U.orderBook(B.asks,B.bids,r.fills,{h:250,label:`새벽전자 호가창. 시장가 매수 ${q}주가 매도 호가 ${r.fills.length}단계를 먹었습니다.`});
  out.innerHTML=q?`${U.fmt(r.filled,0)}주가 매도 호가 <b>${r.fills.length}단계</b>를 먹어 평균 <b>${U.won(r.avg,2)}</b>에 체결됩니다. 맨 위 호가 ${U.won(B.asks[0][0])}보다 ${U.won(r.slip,2)} 비쌉니다.${r.unfilled?` 매도 물량이 모자라 ${U.fmt(r.unfilled,0)}주는 남습니다.`:''}`:'수량이 0이면 아무것도 체결되지 않습니다. 슬라이더를 움직여 보세요.';
 }
 const click=e=>{const b=e.target.closest('[data-qty]');if(b){input.value=b.dataset.qty;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
