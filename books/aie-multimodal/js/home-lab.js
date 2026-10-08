/* 표지 오른쪽의 살아 있는 대표 실험: 표시창 사진 한 장이 패치 14 격자에서 몇 개의 시각 토큰이 되고 8,192 문맥의 몇 %를 차지하는지 실제로 계산한다. */
window.A13Home=(()=>{
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>사진 한 장은 몇 토큰일까?</span><span>패치 14 · 문맥 8,192</span></div><div class="home-graphic"></div><div class="network-controls">${A13UI.range('home-side','정사각형 사진 한 변 (px)',224,1344,28,336)}<div class="buttons"><button type="button" data-side="336">336 (LLaVA-1.5)</button><button type="button" data-side="1344">1344 (확대)</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>세탁기 표시창 사진을 한 변 H인 정사각형으로 맞춘 뒤 14×14픽셀 패치로 자르면 (H ÷ 14)²개의 패치가 생기고, 패치마다 시각 토큰 하나가 언어 모델에 들어갑니다. 그 수를 문맥 길이 8,192로 나눠 사진 한 장이 차지하는 몫을 보입니다. 압축이나 풀링이 없는 단순 연결을 가정한 실제 계산이며, 그림 속 격자는 칸 수를 줄여 그린 시각적 비유입니다.</p></details>`;
 const input=el.querySelector('#home-side');
 function update(){
  const H=Number(input.value),r=A13Math.patchTokens(H,H,14,0),b=A13Math.contextBudget(8192,r.patches,1,0),g=Math.min(r.gh,24),cell=180/g;
  el.querySelector('#home-side-value').textContent=H;
  let grid='';for(let i=0;i<=g;i++){const p=20+i*cell;grid+=`<path d="M20 ${p.toFixed(1)}H200M${p.toFixed(1)} 20V200" stroke="var(--accent)" stroke-width="1" opacity=".55"/>`;}
  const w=Math.min(1,b.share)*180;
  el.querySelector('.home-graphic').innerHTML=`<svg viewBox="0 0 440 230" role="img" aria-label="한 변 ${H}픽셀 사진이 ${r.gh}×${r.gw} 패치, 시각 토큰 ${r.patches}개, 문맥의 ${A13UI.fmt(b.share*100,1)}%"><rect x="0" y="0" width="440" height="230" rx="8" fill="var(--panel2)"/><rect x="20" y="20" width="180" height="180" rx="4" fill="none" stroke="var(--line)" stroke-width="2"/>${grid}<text x="110" y="118" text-anchor="middle" font-size="26" font-family="var(--font-mono)">E-21</text><text x="110" y="222" text-anchor="middle" font-size="13">${r.gh}×${r.gw} 패치${r.gh>24?' (칸은 줄여 그림)':''}</text><text x="236" y="58" font-size="15">시각 토큰</text><text x="236" y="88" font-size="26" font-family="var(--font-mono)">${A13UI.fmt(r.patches,0)}</text><text x="236" y="136" font-size="15">문맥 8,192 중</text><rect x="236" y="150" width="180" height="20" rx="4" fill="none" stroke="var(--line)" stroke-width="2"/><rect x="236" y="150" width="${w.toFixed(1)}" height="20" rx="4" fill="var(--accent)" opacity=".75"/><text x="236" y="194" font-size="15">${A13UI.fmt(b.share*100,1)}%${b.fits?'':' · 넘침'}</text></svg>`;
  el.querySelector('.home-result').innerHTML=`(${H} ÷ 14)² = ${r.gh}² = <b>${A13UI.fmt(r.patches,0)}토큰</b> · 문맥의 ${A13UI.fmt(b.share*100,1)}%<br>${b.fits?`질문과 답에 남는 자리 ${A13UI.fmt(b.left,0)}토큰`:'사진 한 장이 문맥을 넘습니다. 압축이나 타일 전략이 필요합니다.'}`;
 }
 const click=e=>{const b=e.target.closest('[data-side]');if(b){input.value=b.dataset.side;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
