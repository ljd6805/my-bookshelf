/* 표지 오른쪽의 살아 있는 대표 실험: 할인율 γ 하나로 나르미가 가까운 충전대(+2)와 먼 출구(+10) 중 어디로 갈지 가치 반복으로 실제 계산한다. */
window.A10Home=(()=>{
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>나르미는 어디로 갈까</span><span>VALUE ITERATION / γ</span></div><div class="home-graphic"></div><div class="network-controls">${A10UI.range('home-g','할인율 γ (미래 보상의 무게)',0.5,0.99,0.01,0.9)}<div class="buttons"><button type="button" data-g="0.6">γ = 0.6</button><button type="button" data-g="0.9">γ = 0.9</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>5×5 창고 가운데 왼쪽에서 출발한 나르미는 위쪽 2걸음에 충전대(도착하면 +2), 오른쪽 아래 6걸음에 출구(+10)가 있습니다. 걸음마다 보상은 0이고, 가치 반복으로 칸마다 최적 가치와 화살표를 실제로 계산합니다. 충전대 쪽 가치는 2·γ, 출구 쪽은 10·γ⁵이므로 γ⁴ &gt; 0.2, 곧 γ가 약 0.669보다 크면 먼 출구를 고릅니다. 창고 배치와 보상은 교육용 가정값입니다.</p></details>`;
 const input=el.querySelector('#home-g'),M=A10Math,U=A10UI;
 function update(){
  const g=Number(input.value),r=M.homeGamma(g),env=M.homeWorld();
  el.querySelector('#home-g-value').textContent=U.fmt(g,2);
  el.querySelector('.home-graphic').innerHTML=U.warehouseBoard(env,{V:r.V,policy:r.policy,path:r.path.slice(1,-1),goalText:i=>i===0?'충전 +2':'출구 +10',digits:2},`γ ${U.fmt(g,2)}에서 칸별 가치와 화살표. 나르미는 ${r.target==='far'?'먼 출구':'가까운 충전대'}로 갑니다`);
  el.querySelector('.home-result').innerHTML=`γ = <b>${U.fmt(g,2)}</b> · 충전대 쪽 가치 2γ = <b>${U.fmt(r.near,2)}</b> · 출구 쪽 10γ⁵ = <b>${U.fmt(r.far,2)}</b><br>나르미의 선택: <strong>${r.target==='far'?'6걸음 먼 출구(+10)':'2걸음 가까운 충전대(+2)'}</strong> (경계 γ ≈ ${U.fmt(r.threshold,3)})`;
 }
 const click=e=>{const b=e.target.closest('[data-g]');if(b){input.value=b.dataset.g;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
