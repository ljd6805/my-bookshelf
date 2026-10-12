/* 표지의 살아 있는 실험: 반복되는 목록에서 토리의 1층 유도 헤드 셋(0·1·3)이 어디를 보고 무엇을 예측하는지. 실제 계산이다. */
window.THome=(()=>{
const TEXT='목록 곰 꿀 숲 토끼 포도 곰 꿀 숲 토끼';
function mount(el){
 const M=TMath,U=TUI,ids=M.tokenize(TEXT).ids,tok=ids.map(i=>M.vocab()[i]),r=M.run(ids);
 el.innerHTML=`<div class="lab-top"><span>토리가 앞에서 본 것을 이어 쓰는 순간</span><span>INDUCTION / 1층</span></div><div class="home-graphic"><svg class="home-arcs" viewBox="0 0 560 150" role="img" aria-label="토큰 사이에 어텐션 호가 그려진 그림"></svg></div><div class="network-controls">${U.range('home-pos','지금 위치',2,ids.length-1,1,7)}<div class="buttons"><button type="button" data-pos="3">처음 보는 꿀</button><button type="button" data-pos="7">두 번째 곰</button><button type="button" data-pos="9">두 번째 숲</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>학습된 2층 트랜스포머 토리(임베딩 32차원, 층마다 헤드 4개)를 브라우저에서 돌립니다. 호는 1층 헤드 0·1·3의 어텐션을 평균해 가장 많이 보는 칸을 가리킵니다. 오른쪽 숫자는 마지막 출력에서 1위 낱말의 확률입니다.</p></details>`;
 const input=el.querySelector('#home-pos'),svg=el.querySelector('.home-arcs'),x=i=>24+i*(512/(ids.length-1));
 function update(){
  const p=Number(input.value),row=r.attn[1][0][p].map((v,s)=>(v+r.attn[1][1][p][s]+r.attn[1][3][p][s])/3),src=row.indexOf(Math.max(...row)),best=M.top(r.probs[p],1)[0],next=tok[p+1];
  el.querySelector('#home-pos-value').textContent=`${p} · ${tok[p]}`;
  const mid=(x(src)+x(p))/2,h=Math.min(90,18+Math.abs(p-src)*12);
  svg.innerHTML=tok.map((t,i)=>`<g class="${i===p?'home-now':i===src?'home-src':i>p?'home-future':''}"><rect x="${x(i)-23}" y="96" width="46" height="34" rx="6"/><text x="${x(i)}" y="118" text-anchor="middle">${U.esc(t)}</text></g>`).join('')+`<path class="home-arc" d="M${x(p)} 94Q${mid} ${94-h} ${x(src)} 94" fill="none"/><text x="${mid}" y="${Math.max(16,94-h/2-6)}" text-anchor="middle" class="home-w">${(row[src]*100).toFixed(0)}%</text>`;
  const ok=next?best.token===next:false;
  el.querySelector('.home-result').innerHTML=`위치 ${p} “${U.esc(tok[p])}”에서 유도 헤드는 위치 ${src} “${U.esc(tok[src])}”${U.josa(tok[src],'을','를')} 가장 많이 봅니다(${(row[src]*100).toFixed(0)}%).<br>토리의 예측 1위: <b>${U.esc(best.token)}</b> ${(best.p*100).toFixed(1)}%${next?` · 실제 다음 낱말 “${U.esc(next)}” ${ok?'맞힘':'못 맞힘'}`:''}. ${p<6?'처음 보는 목록이라 아직 이어 쓸 근거가 없습니다.':'앞에서 같은 낱말 다음에 무엇이 왔는지 보고 그대로 잇습니다.'}`;
 }
 const click=e=>{const b=e.target.closest('[data-pos]');if(b){input.value=b.dataset.pos;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
