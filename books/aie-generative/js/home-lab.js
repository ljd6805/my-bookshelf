/* 표지 오른쪽의 살아 있는 대표 실험: 순방향 디퓨전 단계 t를 바꾸면 도토리 두 봉우리 분포가 언제 하나로 뭉개지는지 실제로 계산한다. */
window.A09Home=(()=>{
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>도토리 그림에 노이즈 더하기</span><span>FORWARD DIFFUSION</span></div><div class="home-graphic"></div><div class="network-controls">${A09UI.range('home-t','순방향 단계 t (1~1000)',1,1000,1,1)}<div class="buttons"><button type="button" data-t="1">깨끗한 데이터 t=1</button><button type="button" data-t="1000">순수 노이즈 t=1000</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>도토리 그림을 특징값 하나로 줄이면 낮 장면 N(−2, 0.5²)과 밤 장면 N(+2, 0.5²)이 반반인 분포입니다. 선형 스케줄(β 0.0001→0.02, T=1000)로 x_t = √ᾱ_t·x₀ + √(1−ᾱ_t)·ε를 만들면 x_t의 분포도 두 가우스의 혼합이라 정확히 계산됩니다. 곡선은 그 밀도이고, 신호대잡음비는 ᾱ/(1−ᾱ)입니다. 생성은 이 과정을 거꾸로 걷는 일입니다.</p></details>`;
 const input=el.querySelector('#home-t'),U=A09UI;
 function update(){
  const t=Number(input.value),r=A09Math.forward(t),X=v=>30+(v+4)/8*400,Y=v=>200-Math.min(v,0.45)/0.45*170;
  el.querySelector('#home-t-value').textContent=t;
  const pts=r.grid.map(([x,y])=>`${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' ');
  el.querySelector('.home-graphic').innerHTML=`<svg viewBox="0 0 460 240" role="img" aria-label="단계 ${t}에서 x_t의 밀도 곡선. 봉우리 ${r.twoPeaks?'두 개':'한 개'}."><path d="M30 200H430" stroke="var(--muted)"/><polygon points="30,200 ${pts} 430,200" fill="var(--accent)" fill-opacity=".18"/><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="3"/>${r.centers.map(c=>`<path d="M${X(c)} 30V200" stroke="var(--orange)" stroke-dasharray="5 4" stroke-width="2"/>`).join('')}<text x="${X(-2)}" y="224" text-anchor="middle" font-size="15">낮 −2</text><text x="${X(2)}" y="224" text-anchor="middle" font-size="15">밤 +2</text><text x="${X(0)}" y="224" text-anchor="middle" font-size="15">0</text></svg>`;
  el.querySelector('.home-result').innerHTML=`t = <b>${t}</b> · 신호 계수 √ᾱ = <b>${U.fmt(Math.sqrt(r.alphaBar),3)}</b> · SNR <b>${r.snr>1000?'1000 이상':U.fmt(r.snr,3)}</b><br>${r.twoPeaks?'낮과 밤 두 봉우리가 아직 구분됩니다.':'두 장면이 하나의 봉우리로 뭉개졌습니다. 여기서부터 거꾸로 걸으려면 모델이 장면을 골라야 합니다.'}`;
 }
 const click=e=>{const b=e.target.closest('[data-t]');if(b){input.value=b.dataset.t;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
