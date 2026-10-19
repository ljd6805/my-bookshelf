/* 표지의 살아 있는 실험: 하린의 GPU에 전체 미세조정·LoRA·QLoRA 학습이 들어가는지. 모델 구조는 공개 설정 파일, 활성값은 4GB 가정이다. */
window.LRHome=(()=>{
function mount(el){
 const M=LRMath,U=LRUI,ALL=M.MODULES,NAMES={full:'전체 미세조정',lora:'LoRA',qlora:'QLoRA'};
 el.innerHTML=`<div class="lab-top"><span>하린의 GPU에 학습이 들어갈까</span><span>MEMORY / 실제 계산</span></div><div class="home-graphic"></div><div class="network-controls">${U.modelSelect('home-model','llama7')}${U.range('home-gpu','GPU 메모리(GB)',8,80,8,24)}<div class="buttons"><button type="button" data-gpu="24">24GB</button><button type="button" data-gpu="48">48GB</button><button type="button" data-gpu="80">80GB</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>공개된 설정 파일의 층 수와 행렬 크기로 파라미터를 세고, 전체 미세조정은 파라미터마다 16바이트, LoRA는 fp16 기본 가중치에 어댑터(일곱 층, r = 16)의 학습 몫, QLoRA는 4비트 기본 가중치와 양자화 상수에 같은 어댑터를 더합니다. 세 방법 모두 활성값 4GB를 가정으로 더했습니다. 실제 활성값은 배치 크기와 문장 길이에 따라 달라집니다.</p></details>`;
 const model=el.querySelector('#home-model'),gpuIn=el.querySelector('#home-gpu'),box=el.querySelector('.home-graphic');
 function update(){
  const m=M.MODELS[model.value],gpu=Number(gpuIn.value)*M.GB,plans=['full','lora','qlora'].map(k=>[k,M.memoryPlan({model:m,method:k,r:16,targets:ALL,activationGB:4}).total]);
  el.querySelector('#home-gpu-value').textContent=`${gpuIn.value}`;
  box.innerHTML=U.bars(plans.map(p=>NAMES[p[0]]),plans.map(p=>p[1]/M.GB),{unit:'GB',digits:1,mark:i=>plans[i][1]<=gpu,limit:gpu/M.GB,limitLabel:`GPU ${gpuIn.value}GB`});
  const fit=plans.filter(p=>p[1]<=gpu).map(p=>NAMES[p[0]]);
  el.querySelector('.home-result').innerHTML=`${m.name}: 전체 미세조정 ${U.gb(plans[0][1],1)}, LoRA ${U.gb(plans[1][1],1)}, QLoRA ${U.gb(plans[2][1],1)}. GPU ${gpuIn.value}GB에 들어가는 방법은 <b>${fit.length?fit.join('·')+' ✓':'없습니다 ✗'}</b>.`;
 }
 const click=e=>{const b=e.target.closest('[data-gpu]');if(b){gpuIn.value=b.dataset.gpu;update();}};
 model.addEventListener('input',update);gpuIn.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{model.removeEventListener('input',update);gpuIn.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
