/* 표지의 살아 있는 실험(백테스트 가정 하나씩 바꾸기 실험의 맛보기): 1장의 첫 백테스트(A1)에서 가정을 하나씩 고쳐 간 단계를 막대로 보이고, 단계를 옮기면 그 단계까지 고친 연 수익률이 나온다.
   BMath.waterfall로 실제로 계산한다(A0 수정주가는 2장에서 버린 자료라 맛보기에서는 뺀다). 어느 단계의 수익률도 기대 수익률이 아니다. */
window.BHome=(()=>{
function mount(el){
 const M=BMath,U=BUI,steps=M.waterfall().filter(s=>s.key!=='A0');
 el.innerHTML=`<div class="lab-top"><span>가정을 하나씩 고쳐 연 수익률 다시 계산하기</span><span>BACKTEST · STEPS</span></div><div class="home-book"></div><div class="network-controls">${U.range('home-s','고친 가정의 수',0,steps.length-1,1,0,'0은 1장의 첫 백테스트(실제 가격 + 배당 현금, 저가 먼저, 닿으면 체결, 비용 없음)')}<div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>12권 하린의 격자 규칙(18,000~22,000원 · 200원 · 20칸 · 칸당 5주)을 가상 회사 새벽전자의 750거래일 기록에 돌립니다. 그날 알 수 없던 값을 쓴 코드 줄, 하루 막대 안의 순서, 체결 규칙, 수수료·거래세를 차례로 고치고, 마지막에는 하루 막대 뒤에 숨겨 둔 하루 안 경로로 계산합니다. ${M.TEXT.notExpected}. ${M.TEXT.year3Note}. 학습용 계산이며 투자 권유가 아닙니다.</p></details>`;
 const input=el.querySelector('#home-s'),box=el.querySelector('.home-book'),out=el.querySelector('.home-result');
 function update(){
  const k=Number(input.value),s=steps[k];
  el.querySelector('#home-s-value').textContent=String(k);
  box.innerHTML=U.columns({labels:steps.map((x,i)=>i?`+${i}`:'처음'),values:steps.map(x=>x.ann*100),fmt:v=>U.sfmt(v,2)+'%',tick:v=>U.sfmt(v,0)+'%',mark:i=>i===k,colors:steps.map((x,i)=>i===k?'var(--accent)':i<k?'var(--blue)':'var(--line)'),label:`${s.label}: 연 ${U.pct(s.ann,2)}`,title:'고친 가정마다의 연 수익률(▲ 지금 단계)',h:300});
  out.innerHTML=`${k?`${k}번째로 고친 가정: ${s.label}`:'1장의 첫 백테스트'} → 연 수익률 <b>${U.pct(s.ann,2)}</b>, 왕복 ${U.fmt(s.trips)}번.<br><span class="kind-tag">${U.KINDS.real}</span> <span class="kind-tag warn-tag">${U.KINDS.scenario}</span>`;
 }
 input.addEventListener('input',update);update();
 return ()=>input.removeEventListener('input',update);
}
return {mount};
})();
