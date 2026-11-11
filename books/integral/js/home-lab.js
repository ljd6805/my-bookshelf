/* 표지 오른쪽의 대표 실험: 빗물 유입 속도 곡선 아래(처음 5분)를 직사각형으로 채우고 칸 수를 늘려 본다.
   계산은 IGMath.riemann, 움직임은 IG3D.animate(동작 줄이기에서는 마지막 값으로 바로 간다). */
window.IGHome=(()=>{
const M=IGMath,F=IGUI.num;
function chart(n){
 const X=t=>40+t*52,Y=v=>250-v*14,l=M.riemann(M.rate,0,5,n,'left'),r=M.riemann(M.rate,0,5,n,'right');let s=`<path d="M40 250H300M40 20V250" stroke="var(--line)"/>`;
 [0,5,10,15].forEach(v=>s+=`<text x="34" y="${Y(v)+4}" text-anchor="end" font-size="12" fill="var(--muted)">${v}</text>`);
 [0,1,2,3,4,5].forEach(t=>s+=`<text x="${X(t)}" y="266" text-anchor="middle" font-size="12" fill="var(--muted)">${t}분</text>`);
 r.rects.forEach(([x,w,h])=>s+=`<rect x="${X(x).toFixed(1)}" y="${Y(h).toFixed(1)}" width="${(w*52).toFixed(1)}" height="${(h*14).toFixed(1)}" fill="var(--orange)" fill-opacity=".28" stroke="var(--orange)" stroke-width=".8"/>`);
 l.rects.forEach(([x,w,h])=>s+=`<rect x="${X(x).toFixed(1)}" y="${Y(h).toFixed(1)}" width="${(w*52).toFixed(1)}" height="${Math.max(h*14,.5).toFixed(1)}" fill="var(--blue)" fill-opacity=".45" stroke="var(--blue)" stroke-width=".8"/>`);
 s+=`<polyline points="${IGUI.curve(M.rate,0,5,60).map(([t,v])=>X(t).toFixed(1)+','+Y(v).toFixed(1)).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="3"/>`;
 return `<svg viewBox="0 0 312 276" role="img" aria-label="처음 5분의 빗물 유입 속도 곡선과, 그 아래를 채운 파란 직사각형(왼쪽 끝 높이)과 곡선 위로 나온 주황 직사각형(오른쪽 끝 높이) 각 ${n}개. 숫자는 아래 결과에 있습니다.">${s}</svg>`;
}
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>빗물 탱크 · 처음 5분에 고인 물</span><span>REAL CALCULATION</span></div><div class="home-graphic ig-home-map"></div><div class="network-controls">${IGUI.range('home-n','직사각형 수 n',1,50,1,5)}<div class="buttons"><button type="button" data-run="1">칸 수를 50까지 늘리기</button><button type="button" data-run="0">처음으로</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>비가 오는 동안 탱크로 들어오는 물의 속도는 r(t) = 6t − 0.6t² (L/분, 설명용 가상 값)입니다. 속도가 계속 바뀌므로 5분을 n칸으로 나누고, 칸마다 속도가 일정하다고 보아 속도 × 시간을 더합니다. 파란 직사각형은 칸의 왼쪽 끝 속도를, 주황 직사각형은 오른쪽 끝 속도를 썼습니다. 실제로 고인 물 50 L는 언제나 두 합 사이에 있고, 칸을 늘리면 두 합이 50으로 모입니다. 이 극한이 정적분입니다.</p></details>`;
 const input=el.querySelector('#home-n');let stop=()=>{};
 function update(){const n=Number(input.value),l=M.riemann(M.rate,0,5,n,'left').sum,r=M.riemann(M.rate,0,5,n,'right').sum;
  el.querySelector('#home-n-value').textContent=n;el.querySelector('.home-graphic').innerHTML=chart(n);
  el.querySelector('.home-result').innerHTML=`왼쪽 합 <b>${F(l)} L</b> ≤ 실제 50 L ≤ 오른쪽 합 <b>${F(r)} L</b><br>두 합의 차이 ${F(r-l)} L = 15 × ${F(5/n,2)}분`;}
 const click=e=>{const t=e.target.closest('[data-run]');if(!t)return;stop();if(t.dataset.run==='1')stop=IG3D.animate(input,{from:1,to:50,ms:4000});else{input.value=5;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{stop();input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
