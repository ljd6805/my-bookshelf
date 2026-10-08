/* 표지 오른쪽의 살아 있는 대표 실험: 열쇠 차원 d_k를 바꾸면 ‘읽었다’의 어텐션 가중치가 √d_k 나누기 여부에 따라 어떻게 달라지는지 실제로 계산한다. */
window.A08Home=(()=>{
function art(sc,un){
 const T=A08Math.TOKENS,w=56,x0=34;let b='';
 [['√d_k로 나눔',sc,'var(--accent)',30],['나누지 않음',un,'var(--orange)',150]].forEach(([name,ws,color,y])=>{
  b+=`<text x="${x0}" y="${y}" font-size="15">${name}</text><path d="M${x0} ${y+92}H${x0+7*w}" stroke="var(--line)"/>`;
  ws.forEach((p,i)=>{const h=Math.max(1,p*80);b+=`<rect x="${x0+i*w+8}" y="${y+92-h}" width="${w-16}" height="${h}" rx="3" fill="${color}"/>`;});
 });
 T.forEach((t,i)=>{b+=`<text x="${x0+i*w+w/2}" y="272" text-anchor="middle" font-size="13">${t}</text>`;});
 return `<svg viewBox="0 0 440 284" role="img" aria-label="‘읽었다’가 일곱 토큰에 주는 가중치. 위는 √d_k로 나눈 경우, 아래는 나누지 않은 경우" style="display:block;width:100%;height:auto">${b}</svg>`;
}
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>‘읽었다’는 어디를 볼까</span><span>ATTENTION / d_k</span></div><div class="home-graphic"></div><div class="network-controls">${A08UI.range('home-dk','열쇠 차원 d_k',4,512,4,64)}<div class="buttons"><button type="button" data-k="16">d_k 16</button><button type="button" data-k="512">d_k 512</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>질문 q와 열쇠 일곱 개를 표준정규분포에서 뽑아(시드 고정) 점수 q·k를 만들고 softmax로 가중치를 냅니다. 위 막대는 점수를 √d_k로 나눈 경우, 아래 막대는 나누지 않은 경우의 첫 시행입니다. 아래 숫자는 같은 계산을 60번 반복한 평균입니다. 성분의 분산이 1이면 내적의 표준편차가 √d_k이므로, 나누지 않으면 d_k가 클수록 한 토큰에 가중치가 몰립니다. 학습된 모델의 실제 가중치가 아니라 나누기의 효과를 보여 주는 교육용 계산입니다.</p></details>`;
 const input=el.querySelector('#home-dk');
 function update(){
  const d=Number(input.value),s=A08Math.attnRow(d,true,60),u=A08Math.attnRow(d,false,60);
  el.querySelector('#home-dk-value').textContent=d;
  el.querySelector('.home-graphic').innerHTML=art(s.example.weights,u.example.weights);
  el.querySelector('.home-result').innerHTML=`d_k ${d} · 가장 큰 가중치 평균: 나눔 <b>${A08UI.fmt(s.maxW*100,0)}%</b>, 나누지 않음 <b>${A08UI.fmt(u.maxW*100,0)}%</b><br>softmax 기울기 합: 나눔 ${A08UI.fmt(s.grad,2)}, 나누지 않음 ${A08UI.fmt(u.grad,2)} ${u.grad<0.2?'— 나누지 않으면 학습 신호가 거의 끊깁니다.':''}`;
 }
 const click=e=>{const b=e.target.closest('[data-k]');if(b){input.value=b.dataset.k;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
