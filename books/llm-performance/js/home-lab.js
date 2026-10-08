window.PHome=(()=>{
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>같은 32토큰 요약</span><span>TIME / ms</span></div><div class="home-graphic"></div>${PUI.range('home-ttft','첫 토큰까지 (ms)',100,1000,50,400)}<div class="network-controls"><div class="buttons"><button data-time="400">기준 400 ms</button><button data-time="200">대기 절반</button></div></div><div class="home-result" role="status" aria-live="polite"></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>출력 32토큰, 일정한 ITL 20 ms를 가정합니다. 총 시간은 TTFT + 31 × 20 ms입니다. 실제 모델이나 GPU의 측정값이 아닌 산술 계산입니다.</p></details>`;
 const input=el.querySelector('#home-ttft');
 const update=()=>{const r=PMath.metrics(Number(input.value),20,32);el.querySelector('#home-ttft-value').textContent=input.value;el.querySelector('.home-graphic').innerHTML=PUI.bars(['첫 토큰 대기','이후 31개','전체 시간'],[r.ttft,620,r.total],'ms');el.querySelector('.home-result').innerHTML=`총 <b>${r.total} ms</b> · ${PUI.fmt(r.tps)} tokens/s<br>첫 대기를 줄여도 이후 간격은 20 ms입니다.`;};
 const click=e=>{const b=e.target.closest('[data-time]');if(b){input.value=b.dataset.time;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};})();
