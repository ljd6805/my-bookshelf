/* 표지의 살아 있는 실험: 작업 계열을 고르고 랭크 r로 ΔW를 자르면 필요한 변화를 얼마나 메우는지. 16×16 장난감 세계의 실제 계산이다. */
window.LWHome=(()=>{
function mount(el){
 const M=LWMath,U=LWUI,NAMES={tone:'말투',format:'형식',skill:'새 능력'},cache={};
 el.innerHTML=`<div class="lab-top"><span>ΔW를 랭크 r로 자르면</span><span>TOY 16×16 / 실제 계산</span></div><div class="home-graphic"></div><div class="network-controls">${U.select('home-fam','새 작업의 계열',Object.entries(NAMES).map(([k,v])=>[k,v+' 계열']),'tone')}${U.range('home-r','남길 랭크 r',1,16,1,3)}<div class="buttons"><button type="button" data-r="1">r = 1</button><button type="button" data-r="3">r = 3</button><button type="button" data-r="8">r = 8</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>같은 계열의 작업 20개를 평균한 W₀에서 새 작업 자료 128개로 전체 미세조정을 300걸음 하고, 변화량 ΔW를 SVD로 나눠 큰 성분 r개만 남겼을 때 새 입력에서 메우는 비율을 잽니다. 막대는 특잇값이며, 남긴 성분에 ✓를 붙였습니다. 작업 계열과 씨앗은 이 책이 정한 장난감입니다.</p></details>`;
 const fam=el.querySelector('#home-fam'),rIn=el.querySelector('#home-r'),box=el.querySelector('.home-graphic');
 function data(f){if(!cache[f]){const w=M.makeWorld({family:f}),ft=M.fullFinetune(w),dec=M.svd(ft.dW);cache[f]={w,ft,dec,full:M.gain(ft.W,w)};}return cache[f];}
 function update(){
  const f=fam.value,r=Number(rIn.value),d=data(f),cut=M.gain(M.add(d.w.W0,M.truncate(d.ft.dW,r,d.dec)),d.w);
  el.querySelector('#home-r-value').textContent=String(r);
  box.innerHTML=U.bars(d.dec.s.slice(0,8).map((_,i)=>`σ${i+1}`),d.dec.s.slice(0,8),{digits:2,mark:i=>i<r});
  el.querySelector('.home-result').innerHTML=`${NAMES[f]} 계열: 성분 ${r}개(저장할 수 ${r*32}개)로 필요한 변화의 <b>${U.pct(cut,1)}</b>를 메웁니다. 256칸을 모두 고친 전체 미세조정은 ${U.pct(d.full,1)}입니다. <b>${cut>=0.95*d.full?'r = '+r+'에서 충분 ✓':'r = '+r+'에서는 부족 ✗'}</b>`;
 }
 const click=e=>{const b=e.target.closest('[data-r]');if(b){rIn.value=b.dataset.r;update();}};
 fam.addEventListener('input',update);rIn.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{fam.removeEventListener('input',update);rIn.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
