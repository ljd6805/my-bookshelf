/* 표지의 살아 있는 실험: 새벽전자 기준안 DCF에서 할인율만 바꾸면 5년 현재가치 합, 영구가치의 현재가치, 주당 가치가 어떻게 바뀌는가.
   VMath.dcf로 실제로 계산하며, 7장 영구가치 실험과 8장 DCF 민감도 표의 할인율 축과 같은 계산이다. */
window.VHome=(()=>{
function mount(el){
 const M=VMath,U=VUI,E=U.ek,N=U.n1;
 el.innerHTML=`<div class="lab-top"><span>할인율을 바꿔 새벽전자 주당 가치 다시 계산하기</span><span>DISCOUNT RATE · VALUE</span></div><div class="home-book"></div><div class="network-controls">${U.range('home-r','할인율 r (%)',6,11,0.1,(M.ASSUME.base.r*100).toFixed(1),'본문 값은 8.3%. 7.3%와 9.3%로 옮기면 8장의 할인율 ±1%p입니다')}<div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>가상의 회사 새벽전자의 2026~2030년 FCFF를 기준안(매출 성장률 5%, 영업이익률 12%, 운전자본 비율 28%)으로 예측하고, 2031년부터는 해마다 2%씩 영원히 자란다고 놓아 영구가치로 묶은 뒤, 할인율로 2025년 말 값으로 바꿉니다. 기업가치에서 순차입금 387.2억 원을 빼고 1,000만 주로 나누면 주당 가치입니다. 할인율 하나만 움직여도 값이 크게 바뀌는 까닭은 영구가치의 분모 r − g에 할인율이 들어 있기 때문입니다. 학습용 계산이며 투자 권유가 아닙니다.</p></details>`;
 const input=el.querySelector('#home-r'),box=el.querySelector('.home-book'),out=el.querySelector('.home-result');
 function update(){
  const r=Number(input.value)/100,d=M.dcf({r});
  el.querySelector('#home-r-value').textContent=U.fmt(r*100,1);
  box.innerHTML=U.columns({labels:['5년|현재가치','영구가치|현재가치','기업가치','주주 몫'],values:[d.pvSum,d.tvPv,d.firm,d.equity],mark:i=>i===1,fmt:v=>N(v),title:`할인율 ${U.pct(r)}일 때 (억 원)`,twoLine:true,h:240,label:`5년 현재가치 합 ${E(d.pvSum)}, 영구가치의 현재가치 ${E(d.tvPv)}, 기업가치 ${E(d.firm)}, 주주 몫 ${E(d.equity)}`});
  out.innerHTML=`할인율 ${U.pct(r)}: 5년 현재가치 합 <b>${E(d.pvSum)}</b>, 영구가치의 현재가치 <b>${E(d.tvPv)}</b>(기업가치의 ${U.pct(d.tvShare)}), 기업가치 ${E(d.firm)}, 주당 <b>${U.won(d.perShare)}</b>.<br><span class="kind-tag">${U.KINDS.real}</span> <span class="kind-tag">${U.KINDS.scenario}</span> <span class="kind-tag model-tag">${U.KINDS.simple}</span>`;
 }
 input.addEventListener('input',update);update();
 return ()=>input.removeEventListener('input',update);
}
return {mount};
})();
