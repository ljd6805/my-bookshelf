/* 표지 오른쪽의 살아 있는 대표 실험: 의미 캐시 적중률에 따라 다락 도우미의 한 달 LLM 비용을 실제로 계산한다. */
window.A12Home=(()=>{
const M=A12Math,U=A12UI;
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>다락 도우미 · 한 달 LLM 비용</span><span>REAL CALCULATION</span></div><div class="home-graphic"></div><div class="network-controls">${U.range('home-hit','의미 캐시 적중률 (%)',0,90,1,35)}<div class="buttons"><button type="button" data-hit="0">캐시 없음</button><button type="button" data-hit="60">적중 60%</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>하루 활성 사용자 1만 명이 5번씩 묻고, 질문 한 건에 입력 1,500토큰과 출력 400토큰을 쓴다고 둡니다. 단가는 원본 레슨의 계산 예시(백만 토큰당 입력 2.50달러, 출력 10.00달러, 원본 커리큘럼 기준·확인일 2026-10-08)입니다. 캐시에 적중한 질문은 LLM 비용을 0으로 보고, 30일 기준 한 달 비용을 계산해 예산 8,000달러와 비교합니다. 임베딩과 서버 비용, 잘못된 적중의 피해는 넣지 않았습니다.</p></details>`;
 const input=el.querySelector('#home-hit');
 function update(){const h=Number(input.value),r=M.monthlyCost({hit:h/100}),none=M.monthlyCost({hit:0});
  el.querySelector('#home-hit-value').textContent=h;
  el.querySelector('.home-graphic').innerHTML=U.bars(['캐시 없음','적중 30%','적중 60%',`지금 ${h}%`],[none.total,M.monthlyCost({hit:0.3}).total,M.monthlyCost({hit:0.6}).total,r.total],'달러/월 · 점선은 예산 8,000달러',8000,0);
  el.querySelector('.home-result').innerHTML=`적중률 <b>${h}%</b> · 한 달 <b>$${U.fmt(r.total,0)}</b> · 요청당 ${U.fmt(r.perRequest*100,3)}센트<br>${r.total>8000?`예산 $8,000을 $${U.fmt(r.total-8000,0)} 넘습니다. 12장의 마지막 과제가 이 상황에서 출발합니다.`:`예산 안입니다. 캐시가 없을 때보다 $${U.fmt(none.total-r.total,0)} 아낍니다. 적중률을 올릴수록 잘못된 적중도 함께 재야 합니다(10장).`}`;}
 const click=e=>{const b=e.target.closest('[data-hit]');if(b){input.value=b.dataset.hit;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
