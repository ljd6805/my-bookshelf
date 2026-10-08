window.GHome=(()=>{
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>같은 모델, 길어진 대화</span><span>MEMORY / GiB</span></div><div class="home-graphic"></div><div class="network-controls">${GUI.range('home-tokens','저장 문맥 길이 (tokens)',1024,32768,1024,8192)}<div class="buttons"><button data-tokens="8192">8,192토큰</button><button data-tokens="32768">32,768토큰</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>가상 Dense 8B, 가중치 4bit, 32층·KV head 8·head_dim 128·16bit KV, 요청 하나입니다. 가중치 부가정보 10%와 실행 여유 2 GiB를 가정합니다. 16 GiB 예산에서 각 항목이 차지하는 비율을 계산합니다. 실제 장비 측정은 아닙니다.</p></details>`;
 const input=el.querySelector('#home-tokens');
 function update(){
 const r=GMath.budget({bits:4,tokens:Number(input.value),batch:1,capacity:16});
 const parts=[['가중치',r.weights,'var(--accent)'],['KV',r.kv,'var(--blue)'],['부가·여유',r.metadata+r.workspace,'var(--orange)']];
 el.querySelector('#home-tokens-value').textContent=Number(input.value).toLocaleString('en-US');
 el.querySelector('.home-graphic').innerHTML=`<div class="home-chip"><span>가상 16 GiB GPU</span><div class="memory-lanes">${parts.map(([name,n,c])=>`<div><b>${name}</b><div><i style="width:${n/r.available*100}%;background:${c}"></i></div><strong>${GUI.fmt(n/GMath.GiB,2)}</strong></div>`).join('')}</div><div class="home-total">${GUI.fmt(r.total/GMath.GiB,2)}<small> / 16 GiB</small></div></div>`;
 el.querySelector('.home-result').innerHTML=`문맥 ${Number(input.value).toLocaleString('en-US')}토큰 · KV <b>${GUI.fmt(r.kv/GMath.GiB,2)} GiB</b><br>문맥만 늘리면 가중치는 같고 KV가 커집니다.`;
 }
 const click=e=>{const b=e.target.closest('[data-tokens]');if(b){input.value=b.dataset.tokens;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
