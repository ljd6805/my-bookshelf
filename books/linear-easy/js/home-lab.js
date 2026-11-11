/* 표지의 살아 있는 실험: 행렬 하나를 고르면 한 변이 1인 상자와 세 단위 화살표가 옮겨진다. ELMath가 계산한 실제 값이다. */
window.ELHome=(()=>{
function mount(el){
 const M=ELMath,U=ELUI,D3=EL3D,K=ELLabs._kit,keys=['stretch','turn','shear','flatten'];let key='stretch',t=1,cancel=()=>{};
 el.innerHTML=`<div class="lab-top"><span>행렬은 공간을 어떻게 옮길까</span><span>3×3 행렬 / 실제 계산</span></div><div class="home-graphic"></div><div class="network-controls"><div class="buttons">${keys.map(k=>`<button type="button" data-kind="${k}" aria-pressed="${k===key}">${U.esc(M.TRANSFORMS[k].name)}</button>`).join('')}</div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>단추마다 3×3 행렬이 하나씩 있습니다. 상자의 꼭짓점 여덟 개와 단위 화살표 세 개에 그 행렬을 곱한 자리를 그립니다. 움직이는 동안에는 “그대로 두기” 행렬과 고른 행렬 사이를 일정한 비율로 섞은 행렬을 씁니다. 7장에서 같은 실험을 자세히 다룹니다.</p></details>`;
 const view=D3.mount(el.querySelector('.home-graphic'),{labels:M.AXES,range:2,signed:true,zoom:1.25,ticks:false,pitch:24,draw(s){
  const Mt=M.lerpMat(M.identity(3),M.TRANSFORMS[key].M,t);K.drawCube(s,M.identity(3),{ghost:true});K.drawCube(s,Mt);
  s.label=`한 변이 1인 상자가 “${M.TRANSFORMS[key].name}” 행렬로 옮겨진 모습`;
 }});
 function say(){const T=M.TRANSFORMS[key].M;el.querySelector('.home-result').innerHTML=`“${U.esc(M.TRANSFORMS[key].name)}”: 단위 화살표 셋이 <b>${[0,1,2].map(j=>U.vec(M.column(T,j))).join(', ')}</b>${U.josa(U.vec(M.column(T,2)),'으로로')} 갑니다. ${K.volumeWord(M.det3(T))[0].toUpperCase()+K.volumeWord(M.det3(T)).slice(1)}.`;}
 const click=e=>{const b=e.target.closest('[data-kind]');if(!b)return;key=b.dataset.kind;el.querySelectorAll('[data-kind]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));say();cancel();cancel=D3.play(1500,u=>{t=u;view.redraw();});};
 el.addEventListener('click',click);say();
 return ()=>{cancel();view.destroy();el.removeEventListener('click',click);};
}
return {mount};
})();
