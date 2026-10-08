/* 표지 오른쪽의 살아 있는 대표 실험: 사기 경보 문턱. 가상 결제 1,000건(사기 30건)의 점수로 실제 계산한다. */
window.A03Home=(()=>{
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>사기 경보 문턱 실험</span><span>결제 1,000건 · 사기 30건</span></div><div class="home-graphic"></div><div class="network-controls">${A03UI.range('home-thr','경보 문턱(사기 점수 ≥)',0.05,0.95,0.05,0.5)}<div class="buttons"><button type="button" data-k="0.3">놓치지 않기(0.3)</button><button type="button" data-k="0.7">헛경보 줄이기(0.7)</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>시드를 고정한 가상 서점 결제 1,000건에 모델이 낸 사기 점수(0~1)가 있습니다. 점수가 문턱 이상이면 경보를 울립니다. 문턱마다 잡은 사기(TP), 놓친 사기(FN), 정상인데 울린 오경보(FP)를 세고, 정밀도 = TP÷(TP+FP), 재현율 = TP÷(TP+FN)을 계산합니다. 점수 분포는 교육용 가정이며 실제 서비스의 수치가 아닙니다.</p></details>`;
 const input=el.querySelector('#home-thr'),D=A03Math.scoreData();
 function update(){const t=Number(input.value),cm=A03Math.confusion(D,t),r=A03Math.rates(cm),U=A03UI;el.querySelector('#home-thr-value').textContent=U.fmt(t,2);
  el.querySelector('.home-graphic').innerHTML=U.bars(['잡은 사기','놓친 사기','오경보'],[cm.TP,cm.FN,cm.FP],'',null,0);
  el.querySelector('.home-result').innerHTML=`문턱 <b>${U.fmt(t,2)}</b>: 사기 30건 중 <b>${cm.TP}</b>건을 잡고 <b>${cm.FN}</b>건을 놓쳤으며, 정상 결제에 경보 <b>${cm.FP}</b>번. 정밀도 ${U.pct(r.precision)}, 재현율 ${U.pct(r.recall)}, 정확도 ${U.pct(r.accuracy)}.`;}
 const click=e=>{const b=e.target.closest('[data-k]');if(b){input.value=b.dataset.k;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
