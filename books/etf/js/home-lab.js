/* 표지의 살아 있는 실험: 누리200 ETF(iNAV 30,360원)를 시장가로 살 때, LP 호가가 있는 10:30과 LP 의무가 면제되는 15:25 단일가에서 체결가와 괴리율이 얼마나 다른가.
   EMath.gapScene으로 실제로 계산한다. 다른 투자자의 호가와 LP 호가(iNAV ± 40원, 1,000주씩)는 미리 정한 가상 시나리오이며 4장 괴리율 실험과 같은 계산이다. */
window.EHome=(()=>{
function mount(el){
 const M=EMath,U=EUI,W=U.won0;let time='10:30';
 el.innerHTML=`<div class="lab-top"><span>같은 주문, 다른 괴리율</span><span>PREMIUM / 괴리율</span></div><div class="home-book"></div><div class="network-controls">${U.range('home-qty','시장가 매수 수량 (주)',0,3000,100,100)}<div class="buttons" role="group" aria-label="시각"><button type="button" data-time="10:30" aria-pressed="true">10:30 · LP 호가 있음</button><button type="button" data-time="15:25" aria-pressed="false">15:25 · 단일가, LP 의무 면제</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>가상의 누리200 지수가 303.60이면 누리200 ETF의 iNAV는 30,360원입니다(지수 1포인트 = 100원). 매도 호가창에는 LP가 iNAV보다 40원 위부터 1,000주씩 다섯 칸을, 다른 투자자가 iNAV 위 0.5%·1%·2%·3%·5%에 100·200·300·500·1,000주를 내놓았다고 놓습니다(미리 정한 가상 시나리오). 15:20~15:30은 장 마감 단일가 시간이고 LP 호가 의무가 면제된다는 안내가 있어, 이 실험은 그 시간에 LP 호가가 없다고 놓고 모든 주문을 마지막 칸 가격 하나로 체결합니다. ${U.RULE_NOTE} 4장에서 같은 계산을 시각과 LP 단추, AP의 차익까지 바꿔 해 봅니다.</p></details>`;
 const input=el.querySelector('#home-qty'),box=el.querySelector('.home-book'),out=el.querySelector('.home-result');
 function update(){
  const qty=Number(input.value),s=M.gapScene({time,index:303.6,lp:true,qty}),f=s.fill;
  el.querySelector('#home-qty-value').textContent=U.fmt(qty);
  el.querySelectorAll('[data-time]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.time===time)));
  box.innerHTML=U.columns({labels:['iNAV','체결가'],values:[s.inav,s.price],mark:i=>i===1,fmt:v=>U.fmt(v),tick:v=>U.fmt(v),base:s.inav-400,title:`${time} · 시장가 매수 ${U.fmt(qty)}주 · 괴리율 ${U.ppct(s.gap)}`,h:230,label:`iNAV ${W(s.inav)}, 체결가 ${W(s.price)}, 괴리율 ${U.ppct(s.gap)}`});
  const how=!qty?`주문이 없어 가장 낮은 매도 호가 <b>${W(s.price)}</b>을 시장가로 봅니다`:s.auction?`단일가라 ${U.fmt(f.filled)}주가 모두 <b>${W(s.price)}</b> 하나로 체결됩니다`:`마지막 체결가는 <b>${W(s.price)}</b>입니다`;
  out.innerHTML=`${time} · ${s.lp?'LP 호가 의무 있음':'LP 호가 의무 면제'}: iNAV ${W(s.inav)}인 누리200을 시장가로 ${U.fmt(qty)}주 사면 ${how}${f.unfilled?`(${U.fmt(f.unfilled)}주 미체결)`:''}. 괴리율은 <b>${U.ppct(s.gap)}</b>, ${U.side(s.gap).split('(')[0]}입니다. 지수는 그대로이고, 차이는 호가창에 누가 호가를 내놓았는지에서 생깁니다.<br><span class="kind-tag">${U.KINDS.real}</span> <span class="kind-tag">${U.KINDS.scenario}</span> <span class="kind-tag model-tag">${U.KINDS.news}</span>`;
 }
 const click=e=>{const b=e.target.closest('[data-time]');if(b){time=b.dataset.time;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
