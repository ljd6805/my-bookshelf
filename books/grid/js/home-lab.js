/* 표지의 살아 있는 실험: 하린의 격자 사다리. 19,900원에서 주식 없이 시작한 가격이 고른 값까지 내려갔다가 19,900원으로 돌아올 때
   어느 칸이 사지고 팔리는지 GMath.simulate로 실제로 계산한다. 1장 ladder 실험과 같은 격자(18,000~22,000원 · 200원 · 칸당 5주)다. */
window.GHome=(()=>{
function mount(el){
 const M=GMath,U=GUI,lv=U.PATH.LV();
 el.innerHTML=`<div class="lab-top"><span>가격이 내려갔다 돌아오면 어느 칸이 움직일까</span><span>GRID LADDER / 격자 사다리</span></div><div class="home-book"></div><div class="network-controls">${U.range('home-low','그날 내려간 가장 낮은 가격 (원)',17000,19800,100,19500)}<div class="buttons"><button type="button" data-low="19500">19,500원</button><button type="button" data-low="19000">19,000원</button><button type="button" data-low="18000">18,000원</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>18,000원부터 22,000원까지 200원마다 가격을 찍은 20칸 격자입니다. 칸마다 아래 가격에 5주를 사고 위 가격에 팝니다. 가격이 19,900원 → 고른 값 → 19,900원으로 움직이는 동안 지정가에 닿은 주문이 체결된다고 보고, 수수료 0.015%(가정)와 거래세 0.20%를 뺀 실현 손익을 보여 줍니다. 회사와 가격은 가상입니다. 1장에서 같은 사다리를 직접 움직여 봅니다.</p></details>`;
 const input=el.querySelector('#home-low'),box=el.querySelector('.home-book'),out=el.querySelector('.home-result');
 function update(){
  const low=Number(input.value),path=[19900,low,19900],r=M.simulate({path,levels:lv,qty:5}),st=U.cellStates(lv,path,r.fills),held=st.filter(s=>s==='held').length;
  el.querySelector('#home-low-value').textContent=U.fmt(low);
  box.innerHTML=U.ladder(lv,st,path,{label:`19,900 → ${U.fmt(low)} → 19,900원. 매수 ${r.buys}번, 매도 ${r.sells}번, 매도 대기 ${held}칸.`});
  out.innerHTML=`19,900원에서 ${U.fmt(low)}원까지 내려갔다가 돌아오면 <b>${r.buys}칸</b>이 사지고 그중 <b>${r.sells}칸</b>이 팔립니다. 판 칸이 비용을 내고 남긴 실현 손익은 <b>${U.pwon(r.realized)}</b>이고, ● 매도 대기로 남은 칸은 ${held}칸입니다.`;
 }
 const click=e=>{const b=e.target.closest('[data-low]');if(b){input.value=b.dataset.low;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
