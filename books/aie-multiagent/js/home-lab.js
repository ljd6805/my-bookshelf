/* 표지 오른쪽의 살아 있는 대표 실험: 조사원 수 K에 따른 완료 시간과 토큰. A17Math.fanout으로 실제 계산한다. */
window.A17Home=(()=>{
function mount(el){
 const U=A17UI,M=A17Math;
 el.innerHTML=`<div class="lab-top"><span>조사원을 몇 명 띄울까</span><span>MIN · TOKENS</span></div><div class="home-graphic"></div><div class="network-controls">${U.range('home-k','조사원 수 K',1,10,1,3)}<div class="buttons"><button type="button" data-k="1">혼자에 가깝게 (K = 1)</button><button type="button" data-k="5">가장 빠른 K = 5</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>하위 질문 10개(9~14분, 합 99분)를 긴 일부터 비어 있는 조사원에게 나눠 줍니다. 완료 시간은 계획 5분 + 띄우기 1분×K + 가장 바쁜 조사원의 시간 + 종합 3분 + K분입니다. 토큰은 조사원마다 3,000, 질문마다 8,000, 반장이 4,000 + 요약 1,500×K를 씁니다. 분과 토큰은 이 책의 가정값이고, 배분과 합계는 실제 계산입니다. 자세한 실험은 4장에 있습니다.</p></details>`;
 const input=el.querySelector('#home-k');
 function update(){const k=Number(input.value),r=M.fanout(k,1);el.querySelector('#home-k-value').textContent=k;
  el.querySelector('.home-graphic').innerHTML=U.bars(r.load.map((_,i)=>`조사원 ${i+1}`),r.load,'분',null,0);
  el.querySelector('.home-result').innerHTML=`K = <b>${k}</b> · 완료 <b>${r.time}분</b> (혼자 차례로 ${r.serial}분) · 전체 토큰 <b>${r.tokens.toLocaleString('en-US')}</b><br>가장 바쁜 조사원 ${r.makespan}분이 전체 시간을 정합니다.`;}
 const click=e=>{const b=e.target.closest('[data-k]');if(b){input.value=b.dataset.k;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
