/* 표지의 살아 있는 실험(가치 함수 실험의 맛보기): 선우가 거절한 반반 내기(+200만 / −100만 원)에서 손실 회피 계수 λ만 옮기면 전망 가치가 다시 계산된다.
   PMath.prospect로 실제로 계산하며 α = β = 0.88, 확률 가중 끔은 2장 실험의 기본값과 같다(λ 2.25에서 −11.79). */
window.PHome=(()=>{
function mount(el){
 const M=PMath,U=PUI,m=M.JOURNAL.memo.prospect,lams=Array.from({length:41},(_,k)=>1+k*0.05);
 const pts=lams.map(l=>[l,M.prospect(m.gain,m.loss,{lambda:l}).value]);
 el.innerHTML=`<div class="lab-top"><span>손실 회피 계수 λ를 옮겨 반반 내기의 전망 가치 다시 계산하기</span><span>LOSS · GAIN</span></div><div class="home-book"></div><div class="network-controls">${U.range('home-l','손실 회피 계수 λ',1,3,0.05,2.25,'기본값 2.25는 한 연구의 중앙값입니다')}<div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>반반 확률로 200만 원을 벌거나 100만 원을 잃는 내기의 기대값은 +50만 원입니다. 가치 함수 v(x) = x^0.88(이익), −λ(−x)^0.88(손실)로 전망 가치를 계산하면, λ가 클수록 손실 쪽이 무거워져 전망 가치가 0 아래로 내려갑니다. 모수는 ${M.TEXT.paramNote}. 학습용 계산이며 투자 권유가 아닙니다.</p></details>`;
 const input=el.querySelector('#home-l'),box=el.querySelector('.home-book'),out=el.querySelector('.home-result');
 function update(){
  const l=Number(input.value),r=M.prospect(m.gain,m.loss,{lambda:l});
  el.querySelector('#home-l-value').textContent=U.sfmt(l,2);
  box.innerHTML=U.xy({series:[{name:'전망 가치 (α = β = 0.88, 가중 끔)',pts,color:'var(--blue)'}],points:[{name:`지금 λ ${U.sfmt(l,2)}`,x:l,y:r.value,shape:'▲',color:'var(--orange)'}],refs:[{y:0,text:'0 (받아들임과 거절의 경계)'}],
   xmin:1,xmax:3,xlabel:'손실 회피 계수 λ',ylabel:'전망 가치',xtick:v=>U.sfmt(v,1),ytick:v=>U.sfmt(v,0),h:330,label:`λ ${U.sfmt(l,2)}: 전망 가치 ${U.sfmt(r.value,2)}`});
  out.innerHTML=`λ ${U.sfmt(l,2)}: 전망 가치 <b>${U.splus(r.value,2)}</b> ${r.accept?'✓ 받아들임':'✗ 거절'} · 기대값은 언제나 +50만 원.<br><span class="kind-tag">${U.KINDS.real}</span> <span class="kind-tag">${U.KINDS.paper}</span>`;
 }
 input.addEventListener('input',update);update();
 return ()=>input.removeEventListener('input',update);
}
return {mount};
})();
