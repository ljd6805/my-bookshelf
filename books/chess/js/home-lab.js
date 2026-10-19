/* 표지의 살아 있는 실험: 빈 판의 칸을 누르면 고른 기물을 그 칸에 놓고 닿는 칸을 센다. 2장 reach 실험과 같은 계산(CRules.pseudoMoves)이다. */
window.CHome=(()=>{
function mount(el){
 const R=CRules,U=CUI,KINDS=[['n','나이트'],['b','비숍'],['r','룩'],['q','퀸'],['k','킹']];
 let kind='n',at=R.sq('d4');
 el.innerHTML=`<div class="lab-top"><span>같은 기물도 놓인 칸에 따라 닿는 칸 수가 달라질까</span><span>REACH / 닿는 칸</span></div><div class="home-board"></div><div class="network-controls"><div class="buttons" role="group" aria-label="기물 고르기">${KINDS.map(([k,n])=>`<button type="button" data-kind="${k}" aria-pressed="${k===kind}">${n}</button>`).join('')}</div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 세나요?</summary><p>다른 기물이 없는 빈 판에 고른 흰 기물 하나만 놓고, 규칙대로 한 수에 갈 수 있는 칸을 셉니다. 판의 칸을 누르면 기물이 그 칸으로 옮겨 갑니다. 2장에서 다른 폰이 길을 막는 경우까지 다시 셉니다.</p></details>`;
 const holder=el.querySelector('.home-board'),out=el.querySelector('.home-result');
 function update(){
  const s=R.parseFEN('8/8/8/8/8/8/8/8 w - - 0 1');s.board[at]=kind.toUpperCase();
  const ms=R.pseudoMoves(s).filter(m=>m.from===at),marks={[at]:'from'};ms.forEach(m=>marks[m.to]='to');
  const name=KINDS.find(k=>k[0]===kind)[1];
  holder.innerHTML=U.board(s,{marks,label:`빈 판의 ${R.name(at)}에 놓인 흰 ${name}. 칸을 누르면 기물을 옮깁니다.`});
  out.innerHTML=`${R.name(at)}에 놓인 ${name}${U.josa(name,'은','는')} <b>${ms.length}칸</b>에 닿습니다(●). 다른 칸을 눌러 가운데와 구석을 견주어 보세요.`;
  el.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===kind)));
 }
 const click=e=>{const k=e.target.closest('[data-kind]');if(k){kind=k.dataset.kind;update();return;}const b=e.target.closest('[data-sq]');if(b){at=+b.dataset.sq;update();holder.querySelector(`[data-sq="${at}"]`)?.focus();}};
 el.addEventListener('click',click);update();
 return ()=>el.removeEventListener('click',click);
}
return {mount};
})();
