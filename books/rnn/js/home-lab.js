/* 표지의 살아 있는 실험: 마지막 시점의 기울기가 앞 시점으로 거슬러 오르며 얼마나 남는지. 무작위 가중치의 셀로 실제로 역전파한다. */
window.RNHome=(()=>{
function mount(el){
 const M=RNMath,U=RNUI,NAMES={rnn:'단순 RNN',lstm:'LSTM (망각 게이트 편향 3)'};let type='rnn';
 el.innerHTML=`<div class="lab-top"><span>기울기는 몇 시점 앞까지 닿을까</span><span>은닉 8개 / 실제 계산</span></div><div class="home-graphic"></div><div class="network-controls">${U.range('home-T','거슬러 오를 시점 수',10,60,10,20)}<div class="buttons"><button type="button" data-cell="rnn" aria-pressed="true">단순 RNN</button><button type="button" data-cell="lstm" aria-pressed="false">LSTM</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>학습하기 전의 무작위 가중치를 가진 셀(은닉 8개)에 무작위 입력을 넣어 순전파한 뒤, 마지막 시점에서 크기 1인 기울기를 출발시켜 한 시점씩 거슬러 오릅니다. 막대는 그 기울기의 크기입니다. LSTM은 망각 게이트의 편향을 3으로 두어 게이트가 평균 0.95쯤 열린 경우입니다. 6장과 9장이 같은 계산을 자세히 다룹니다.</p></details>`;
 const T=el.querySelector('#home-T'),box=el.querySelector('.home-graphic');
 function update(){
  const n=Number(T.value),r=M.gradFlow({type,T:n,gateBias:type==='lstm'?3:0}),ks=[0,1,2,3,4].map(i=>Math.round(i*(n-1)/4));
  el.querySelector('#home-T-value').textContent=n;
  box.innerHTML=U.bars(ks.map(k=>`${k}시점 앞`),ks.map(k=>r.norms[k]),{max:1,show:v=>v>=0.01?U.fmt(v,2):v.toExponential(0)});
  el.querySelectorAll('[data-cell]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cell===type)));
  el.querySelector('.home-result').innerHTML=`${NAMES[type]}: 마지막 시점에서 크기 1로 출발한 기울기는 ${n-1}시점 앞에서 <b>${r.last>=0.01?U.fmt(r.last,2):r.last.toExponential(1)}</b>이 됩니다. ${type==='rnn'?'이렇게 작아지면 먼 시점의 입력은 학습에 거의 영향을 주지 못합니다.':'게이트가 열려 있으면 기울기가 먼 시점까지 남습니다.'}`;
 }
 const click=e=>{const b=e.target.closest('[data-cell]');if(b){type=b.dataset.cell;update();}};
 T.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{T.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
