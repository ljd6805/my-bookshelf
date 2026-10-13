/* 표지의 살아 있는 실험: 새벽전자 2024 사업연도에서 기말 매출채권만 바꾸면 순이익은 그대로인데 영업현금흐름과 기말 현금이 어떻게 바뀌고,
   세 재무제표의 대조 네 줄은 맞는가. SMath.linkedYear로 실제로 계산하며, 5장 세 재무제표 연동 실험의 3단계와 같은 계산이다. */
window.SHome=(()=>{
function mount(el){
 const M=SMath,U=SUI,E=U.ek,N=U.n1;
 el.innerHTML=`<div class="lab-top"><span>세 재무제표 한꺼번에 맞추기</span><span>INCOME · CASH · BALANCE</span></div><div class="home-book"></div><div class="network-controls">${U.range('home-ar','2024년 기말 매출채권 (억 원)',200,500,10,230,'본문 값은 230. 430으로 옮기면 5장의 차입 단계입니다')}<div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>가상의 회사 새벽전자의 2024 사업연도(매출 1,500억 원, 기초 매출채권 200억 원)에서 기말 매출채권만 바꿉니다. 외상으로 판 돈이 덜 들어와도 손익계산서의 매출과 순이익은 그대로지만, 간접법 현금흐름표에서는 매출채권 증가만큼 영업활동 현금흐름이 줄고 재무상태표의 현금도 같이 줄어듭니다. 기말 현금이 50억 원보다 적으면 50억 원 단위로 연말에 빌린다고 놓았습니다(이 책의 단순화). 5장에서 매출·재고·설비투자까지 바꿔 봅니다.</p></details>`;
 const input=el.querySelector('#home-ar'),box=el.querySelector('.home-book'),out=el.querySelector('.home-result');
 function update(){
  const ar=Number(input.value),lk=M.linkedYear(M.OPENING,{...M.YEARS[2024],ar}),ok=lk.checks.every(c=>c.ok);
  el.querySelector('#home-ar-value').textContent=U.fmt(ar);
  box.innerHTML=U.columns({labels:['순이익','영업현금흐름','기말 현금','단기차입금'],values:[lk.is.ni,lk.cf.cfo,lk.close.cash,lk.close.std],mark:i=>i===1,fmt:v=>N(v),title:`기말 매출채권 ${N(ar)}억 원일 때 (억 원)`,h:230,label:`순이익 ${E(lk.is.ni)}, 영업현금흐름 ${E(lk.cf.cfo)}, 기말 현금 ${E(lk.close.cash)}, 단기차입금 ${E(lk.close.std)}`});
  out.innerHTML=`기말 매출채권 ${E(ar)}: 순이익 <b>${E(lk.is.ni)}</b> 그대로, 영업활동 현금흐름 <b>${E(lk.cf.cfo)}</b>, 기말 현금 <b>${E(lk.close.cash)}</b>${lk.cf.borrow?`(차입 전 ${E(lk.cf.cashBeforeBorrow)}이라 ${E(lk.cf.borrow)} 단기차입)`:''}. 자산 ${N(lk.totals.assets)} = 부채 ${N(lk.totals.liabilities)} + 자본 ${N(lk.totals.equity)}, 대조 네 줄 ${ok?'모두 ✓ 맞음':'✗ 어긋남'}.<br><span class="kind-tag">${U.KINDS.real}</span> <span class="kind-tag">${U.KINDS.scenario}</span> <span class="kind-tag model-tag">${U.KINDS.simple}</span>`;
 }
 input.addEventListener('input',update);update();
 return ()=>input.removeEventListener('input',update);
}
return {mount};
})();
