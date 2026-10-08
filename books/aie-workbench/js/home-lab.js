/* 표지 오른쪽의 살아 있는 대표 실험: DataLoader 일꾼 수를 바꾸면 한 단계 시간과 GPU 대기 시간이 어떻게 바뀌는지 실제로 계산한다. */
window.A01Home=(()=>{
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>review-lab 학습 한 단계</span><span>STEP TIME / ms</span></div><div class="home-graphic"></div><div class="network-controls">${A01UI.range('home-workers','DataLoader 일꾼 수 (num_workers)',0,8,1,0)}<div class="buttons"><button type="button" data-w="0">일꾼 0명</button><button type="button" data-w="4">일꾼 4명</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>한 단계에 데이터 로딩 60ms, 순전파와 역전파 40ms가 든다고 가정합니다(원본 레슨의 “로딩이 60%” 예). 일꾼이 없으면 둘이 차례로 이어지고, 일꾼 n명이면 미리 읽기가 계산과 겹쳐 한 단계는 max(60 ÷ n, 40)ms가 됩니다. 완벽한 겹침을 가정한 교육용 모형이며 실제 장비를 측정한 값이 아닙니다.</p></details>`;
 const input=el.querySelector('#home-workers');
 function update(){
  const w=Number(input.value),r=A01Math.stepTime(60,40,w),max=100;
  const lanes=[['로딩',r.loadEff,'var(--blue)'],['계산',40,'var(--accent)'],['GPU 대기',r.idle,'var(--orange)']];
  el.querySelector('#home-workers-value').textContent=w;
  el.querySelector('.home-graphic').innerHTML=`<div class="home-chip"><span>1,000단계 기준 한 에폭 ${A01UI.fmt(r.step,0)}초</span><div class="memory-lanes">${lanes.map(([n,v,c])=>`<div><b>${n}</b><div><i style="width:${v/max*100}%;background:${c}"></i></div><strong>${A01UI.fmt(v,0)}</strong></div>`).join('')}</div><div class="home-total">${A01UI.fmt(r.step,0)}<small> ms / 단계</small></div></div>`;
  el.querySelector('.home-result').innerHTML=`일꾼 ${w}명 · GPU 사용률 <b>${A01UI.fmt(r.gpuUse*100,0)}%</b> · 병목 <b>${r.bottleneck}</b><br>${r.idle>0?'GPU가 다음 배치를 기다리는 시간이 남아 있습니다.':'로딩이 계산 뒤에 숨었습니다. 일꾼을 더 늘려도 빨라지지 않습니다.'}`;
 }
 const click=e=>{const b=e.target.closest('[data-w]');if(b){input.value=b.dataset.w;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
