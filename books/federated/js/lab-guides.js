/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기. 내용은 FLGuideData(실험 파일이 채움)에서 읽는다. */
window.FLGuides=(()=>{
function mount(id,el){
 const g=FLGuideData[id];if(!g)return;
 const [purpose,presets,reading]=g,box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){FLLabs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>{const input=el.querySelector('#'+key);if(input.type==='checkbox')input.checked=!!value;else input.value=value;});
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',()=>box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed')));
}
return {mount};
})();
