/* 홈에서는 실제 순전파 결과를 SVG와 텍스트로 함께 표시합니다. */
window.AIHomeNetwork=(()=>{
const fixed=n=>n.toFixed(2);
function node(x,y,label,value,color,percent=false){
 return `<g><circle cx="${x}" cy="${y}" r="30" fill="var(--panel2)" stroke="${color}" stroke-width="3"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="var(--text)" font-size="15">${percent?(value*100).toFixed(1)+'%':fixed(value)}</text><text x="${x}" y="${y+51}" text-anchor="middle" fill="var(--muted)" font-size="13">${label}</text></g>`;
}
function edge(x1,y1,x2,y2,strength,color){
 return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="${1+strength*6}" opacity="${.18+strength*.82}"/>`;
}
function diagram(r){
 const [h1,h2]=r.hidden,[high,low]=r.probabilities;
 let edges=edge(90,132,202,72,r.input,'var(--accent)')+edge(90,132,202,200,1-r.input,'var(--orange)');
 edges+=edge(262,72,372,72,h1,'var(--accent)')+edge(262,72,372,200,h1,'var(--orange)');
 edges+=edge(262,200,372,72,h2,'var(--orange)')+edge(262,200,372,200,h2,'var(--accent)');
 return `<svg viewBox="0 0 480 270" role="img" aria-label="입력 ${fixed(r.input)}, 중간 값 ${fixed(h1)}와 ${fixed(h2)}, 높은 입력 출력 ${fixed(high*100)}%, 낮은 입력 출력 ${fixed(low*100)}%"><text x="60" y="22" text-anchor="middle">입력</text><text x="232" y="22" text-anchor="middle">중간 계산</text><text x="402" y="22" text-anchor="middle">출력 확률</text>${edges}${node(60,132,'x',r.input,'var(--blue)')}${node(232,72,'h₁',h1,'var(--accent)')}${node(232,200,'h₂',h2,'var(--orange)')}${node(402,72,'높은 입력',high,'var(--accent)',true)}${node(402,200,'낮은 입력',low,'var(--orange)',true)}</svg>`;
}
function markup(){
 return `<div class="lab-top"><span>입력을 바꾸면, 출력도 바뀝니다</span><span>1 → 2 → 2</span></div><div class="network-diagram"></div><div class="network-controls">${AIUI.range('signal','입력값 x',0,1,.01,.5)}<div class="buttons"><button data-input="0">낮게 0</button><button data-input="0.5">중간 0.5</button><button data-input="1">높게 1</button></div><div class="network-result" role="status" aria-live="polite"></div><div class="network-bars"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>입력 숫자 하나를 두 뉴런에 넣고, 그 계산 결과를 두 출력으로 전달합니다. 청록 선은 양의 가중치, 주황 선은 음의 가중치입니다. 선의 굵기는 설명용 표시입니다.</p><code>h₁ = sigmoid(8x − 4)<br>h₂ = sigmoid(−8x + 4)<br>z = [3(h₁−h₂), 3(h₂−h₁)]<br>출력 = softmax(z)</code><p>가중치를 손으로 정한 교육용 신경망입니다. 학습된 AI의 정확도나 실제 사건의 확률을 나타내지는 않습니다.</p></details><p class="caption">0과 1 버튼을 번갈아 눌러 보세요. 뉴런 안의 값, 연결선, 출력 막대가 함께 바뀝니다.</p>`;
}
function mount(el){
 el.innerHTML=markup();const input=el.querySelector('#signal');
 function render(){
  const r=AIMath.networkForward(Number(input.value)),high=r.probabilities[0];
  el.querySelector('#signal-value').textContent=fixed(r.input);
  el.querySelector('.network-diagram').innerHTML=diagram(r);
  el.querySelector('.network-result').innerHTML=`<span>입력 <b>${fixed(r.input)}</b></span><strong>${Math.abs(high-.5)<1e-9?'두 출력이 같습니다':high>.5?'높은 입력 쪽으로 기웁니다':'낮은 입력 쪽으로 기웁니다'}</strong>`;
  el.querySelector('.network-bars').innerHTML=AIUI.bars(['높은 입력','낮은 입력'],r.probabilities);
 }
 input.addEventListener('input',render);
 const click=e=>{const b=e.target.closest('[data-input]');if(b){input.value=b.dataset.input;render();}};
 el.addEventListener('click',click);render();
 return ()=>{input.removeEventListener('input',render);el.removeEventListener('click',click);};
}
return {mount};
})();
