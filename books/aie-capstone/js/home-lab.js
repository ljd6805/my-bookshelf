/* 표지 오른쪽의 살아 있는 대표 실험. 모루의 과제 하나를 통과할 때까지 최대 k번 시도할 때의 통과율과 비용을 실제로 계산한다. */
window.A20Home=(()=>{
function mount(el){
 const U=A20UI,M=A20Math,F=U.fmt,P=0.34,COST=0.024;
 el.innerHTML=`<div class="lab-top"><span>최대 몇 번까지 다시 시도할까</span><span>PASS · COST</span></div><div class="home-graphic"></div><div class="network-controls">${U.range('home-k','최대 시도 횟수 k',1,8,1,3)}<div class="buttons"><button type="button" data-k="1">한 번만</button><button type="button" data-k="4">네 번까지</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>한 번 시도의 통과율 p = 0.34, 시도 하나의 비용 0.024달러(문맥 조각 5개, 8,000토큰에 100만 토큰당 3달러)라고 둡니다. 둘 다 교육용 가정값입니다. 통과할 때까지 차례로 최대 k번 시도하면 통과율은 1 − (1 − p)^k, 기대 시도 수는 (1 − (1 − p)^k) / p입니다. 과제당 비용은 기대 시도 수 × 0.024달러이고, 통과 한 건당 비용은 그 값을 통과율로 나눈 것입니다. 계산은 식 그대로의 실제 계산입니다.</p></details>`;
 const input=el.querySelector('#home-k');
 function update(){
  const k=Number(input.value),r=M.tryUntilPass(P,k,COST);el.querySelector('#home-k-value').textContent=k;
  el.querySelector('.home-graphic').innerHTML=U.bars(['통과율 %','과제당 ¢','통과 1건당 ¢'],[r.pass*100,r.costPerTask*100,r.costPerSolved*100],'통과율은 %, 비용은 센트(¢)',null,1);
  el.querySelector('.home-result').innerHTML=`최대 <b>${k}번</b> 시도 → 통과율 <b>${F(r.pass*100,1)}%</b>, 기대 시도 ${F(r.expTries,2)}번, 과제당 ${F(r.costPerTask,3)}달러. 통과 한 건당 비용은 k와 상관없이 ${F(r.costPerSolved,3)}달러로 같고, 늘어나는 것은 통과율과 과제당 비용입니다.`;
 }
 const click=e=>{const b=e.target.closest('[data-k]');if(b){input.value=b.dataset.k;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
