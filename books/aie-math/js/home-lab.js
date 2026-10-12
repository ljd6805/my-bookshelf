/* 표지 오른쪽의 살아 있는 대표 실험. 1차원 손실 L(w)=(w−2)²+0.5에서 학습률 하나로 경사하강 30걸음을 실제 계산한다. */
window.A02Home=(()=>{
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>학습률 하나가 정하는 30걸음</span><span>GRADIENT DESCENT</span></div><div class="home-graphic"></div><div class="network-controls">${A02UI.range('home-lr','학습률 η',0.05,1.05,0.05,0.3)}<div class="buttons"><button type="button" data-lr="0.1">조심스럽게 0.1</button><button type="button" data-lr="1.05">너무 크게 1.05</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>말귀의 가중치 하나가 받는 손실을 L(w)=(w−2)²+0.5라는 그릇 모양으로 단순화했습니다. w=−2에서 출발해 w ← w − η·2(w−2)를 30번 반복합니다. 곡률이 2이므로 η가 1보다 작으면 바닥 w=2로 모이고, 1을 넘으면 매 걸음 더 크게 튀며 멀어집니다. 브라우저 안의 실제 계산이며 실제 모델의 손실 지형은 이보다 훨씬 복잡합니다(5장).</p></details>`;
 const input=el.querySelector('#home-lr');
 function update(){
  const lr=Number(input.value),r=A02Math.descend1d(lr),w=r.ws[r.ws.length-1],L=r.loss[r.loss.length-1],ok=Number.isFinite(L)&&L<1e6;
  el.querySelector('#home-lr-value').textContent=lr.toFixed(2);
  el.querySelector('.home-graphic').innerHTML=A02UI.plot({lines:[{data:[[0,2],[30,2]],color:'var(--muted)',dashed:true},{data:r.ws.map((v,t)=>[t,v]),color:'var(--accent)'}],points:[[r.ws.length-1,Math.max(-6,Math.min(10,w)),'var(--orange)',6]],xmin:0,xmax:30,ymin:-6,ymax:10,xlabel:'걸음',ylabel:'가중치 w',label:`학습률 ${lr.toFixed(2)}로 30걸음 경사하강한 가중치의 경로. 점선은 바닥 w=2.`});
  el.querySelector('.home-result').innerHTML=ok?`η = <b>${lr.toFixed(2)}</b> · 30걸음 뒤 w = <b>${w.toFixed(3)}</b>, 손실 <b>${L.toFixed(4)}</b><br>${lr>1.001?'η가 1보다 커서 바닥을 넘어 점점 크게 흔들립니다.':lr>0.999?'η=1이면 바닥을 사이에 두고 같은 폭으로 끝없이 오갑니다(w=−2와 6).':lr>0.5?'바닥을 넘었다 돌아오며 흔들리지만 결국 모입니다.':'바닥 w=2를 향해 한쪽에서 다가갑니다.'}`:`η = <b>${lr.toFixed(2)}</b> · 값이 너무 커져 발산했습니다.`;
 }
 const click=e=>{const b=e.target.closest('[data-lr]');if(b){input.value=b.dataset.lr;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
