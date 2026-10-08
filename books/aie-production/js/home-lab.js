/* 표지 오른쪽의 살아 있는 대표 실험. 동시 대화 수를 늘릴 때 H100 80GB의 메모리와 토큰 간격 하한이 어떻게 변하는지 실제로 계산한다. */
window.A18Home=(()=>{
const U=A18UI,M=A18Math;
function graphic(r){
 const sx=v=>v/80*440,parts=[['가중치',r.weights,'var(--accent)'],['활성값',r.act,'var(--muted)'],['KV',r.kv,r.fits?'var(--blue)':'var(--orange)']];
 let x=20,body='';parts.forEach(([n,v,c])=>{const w=Math.max(0,Math.min(sx(v),460-x));body+=`<rect x="${x}" y="40" width="${w}" height="44" rx="3" fill="${c}"/>`;if(w>60)body+=`<text x="${x+w/2}" y="67" text-anchor="middle" fill="var(--bg)" font-size="14" font-weight="700">${n} ${U.fmt(v,1)}</text>`;x+=w;});
 body+=`<path d="M460 28V96" stroke="var(--orange)" stroke-width="2" stroke-dasharray="5 4"/><text x="460" y="20" text-anchor="end" font-size="13" fill="var(--muted)">HBM 80GB</text>`;
 const tx=v=>20+Math.min(v,40)/40*440;
 body+=`<rect x="20" y="140" width="440" height="14" rx="7" fill="var(--panel2)"/><rect x="20" y="140" width="${tx(r.tpot)-20}" height="14" rx="7" fill="${r.meets?'var(--accent)':'var(--orange)'}"/><path d="M${tx(25)} 128V166" stroke="var(--muted)" stroke-width="2"/><text x="${tx(25)}" y="184" text-anchor="middle" font-size="13" fill="var(--muted)">TPOT 목표 25ms</text><text x="20" y="128" font-size="13" fill="var(--text)">토큰 간격 하한 ${U.fmt(r.tpot,1)}ms</text>`;
 return `<svg viewBox="0 0 480 200" role="img" aria-label="HBM 사용 ${U.fmt(r.total,1)}GB, 토큰 간격 하한 ${U.fmt(r.tpot,1)}ms">${body}</svg>`;
}
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>누리봇 한 대가 받을 수 있는 대화</span><span>H100 · INT4 · FP8 KV</span></div><div class="home-graphic"></div><div class="network-controls">${U.range('home-conc','동시 대화 수 (각 2,048토큰)',1,160,1,16)}<div class="buttons"><button type="button" data-k="16">16개</button><button type="button" data-k="119">119개 (한계)</button><button type="button" data-k="140">140개</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>70B 모델(Llama 3 70B 구조)을 INT4 가중치 35GB로 올리고, 대화 하나의 KV를 FP8로 2 × 80층 × 8헤드 × 128차원 × 2,048토큰 ≈ 0.34GB로 셉니다. 활성값 5GB는 가정입니다. 토큰 간격 하한은 한 디코드 반복마다 가중치와 모든 KV를 HBM에서 한 번 읽는다고 보고 (가중치 + KV) ÷ 3,350GB/s로 계산한 이론값이며, 실제 엔진은 이보다 느립니다.</p></details>`;
 const input=el.querySelector('#home-conc');
 function update(){
  const c=Number(input.value),r=M.homeDecode(c);el.querySelector('#home-conc-value').textContent=c;
  el.querySelector('.home-graphic').innerHTML=graphic(r);
  el.querySelector('.home-result').innerHTML=r.fits?`대화 <b>${c}개</b> · HBM ${U.fmt(r.total,1)}GB · 토큰 간격 하한 <b>${U.fmt(r.tpot,1)}ms</b> · 초당 ${U.fmt(r.tput,0)}토큰. ${r.meets?'목표 25ms 안입니다.':'목표 25ms를 넘습니다.'}`:`대화 <b>${c}개</b>는 HBM ${U.fmt(r.total,1)}GB가 필요해 80GB를 넘습니다. 한 대의 한계는 ${r.maxConc}개입니다.`;
 }
 const click=e=>{const b=e.target.closest('[data-k]');if(b){input.value=b.dataset.k;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
