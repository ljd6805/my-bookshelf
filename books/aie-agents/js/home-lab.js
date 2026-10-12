/* 표지 오른쪽의 살아 있는 대표 실험: 단계마다 성공률 p인 일을 n단계 이어 하면 모두 성공할 확률 pⁿ.
   원본 레슨 01이 말하는 40~400단계 에이전트에서 작은 오류율이 얼마나 빨리 불어나는지 실제로 계산한다. */
window.A15Home=(()=>{
const STEPS=[10,40,100,400];
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>단계가 길수록 작은 실수가 쌓인다</span><span>pⁿ</span></div><div class="home-graphic"></div><div class="network-controls">${A15UI.range('home-p','한 단계 성공률 p (%)',90,100,0.5,99)}<div class="buttons"><button type="button" data-k="95">한 단계 95%</button><button type="button" data-k="99.5">한 단계 99.5%</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>단계마다 성공할 확률 p가 서로 독립이라고 가정하고, n단계를 한 번도 틀리지 않고 마칠 확률 pⁿ을 계산합니다. 원본 커리큘럼 기준(확인일 2026-10-08)으로 요즘 에이전트는 작업 하나에 40~400단계를 돌기 때문에, 단계당 99%도 긴 작업에서는 크게 줄어듭니다. 실제 에이전트는 실패를 관찰로 받아 고치기도 하므로 이 값은 검증·재시도·게이트가 없을 때의 하한 그림에 가깝습니다. 계산은 실제이고 독립 가정은 단순화입니다.</p></details>`;
 const input=el.querySelector('#home-p');
 function update(){
  const p=Number(input.value)/100,vals=STEPS.map(n=>A15Math.compound(p,n)*100);
  el.querySelector('#home-p-value').textContent=input.value;
  el.querySelector('.home-graphic').innerHTML=A15UI.bars(STEPS.map(n=>`${n}단계`),vals,'% 모두 성공',null,1);
  el.querySelector('.home-result').innerHTML=`한 단계 <b>${input.value}%</b>이면 40단계를 모두 성공할 확률 <b>${A15UI.fmt(vals[1],1)}%</b>, 400단계는 <b>${A15UI.fmt(vals[3],2)}%</b>입니다.`;
 }
 const click=e=>{const b=e.target.closest('[data-k]');if(b){input.value=b.dataset.k;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
