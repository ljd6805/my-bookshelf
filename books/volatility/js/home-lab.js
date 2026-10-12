/* 표지의 살아 있는 실험: 제자리로 돌아오는 지수와 날마다 2배로 맞춘 상품. 하루 +a%, 다음 날 제자리로 돌아오는 일을 125번 되풀이한
   250거래일 경로에서 VMath.leveragedPath로 실제로 계산한다. 2장 reset 실험과 같은 경로다(보수·비용 없음, 가상의 상품). */
window.VHome=(()=>{
function mount(el){
 const M=VMath,U=VUI;
 el.innerHTML=`<div class="lab-top"><span>지수는 제자리인데 2배 상품은?</span><span>DAILY RESET / 일일 재조정</span></div><div class="home-book"></div><div class="network-controls">${U.range('home-a','하루 흔들림 폭 a (%)',.5,3,.1,1.5)}<div class="buttons"><button type="button" data-a="1">1%</button><button type="button" data-a="1.5">1.5%</button><button type="button" data-a="2">2%</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>가상의 지수가 하루 a% 오르고 다음 날 1/(1 + a) − 1만큼 내려 제자리로 돌아오는 일을 125번 되풀이합니다(250거래일). 가상의 상품 “누리200 2배”는 날마다 그날 지수 수익률의 2배만큼 움직이도록 다시 맞춥니다. 보수·차입 비용·괴리율은 넣지 않았습니다. 2장에서 같은 계산을 배율과 날 수까지 바꿔 가며 해 봅니다.</p></details>`;
 const input=el.querySelector('#home-a'),box=el.querySelector('.home-book'),out=el.querySelector('.home-result');
 function update(){
  const a=Number(input.value)/100,R=M.flatVolatileReturns(a,125),idx=M.pathFromReturns(100,R),two=M.leveragedPath(R,2,{start:100});
  el.querySelector('#home-a-value').textContent=U.fmt(a*100,1);
  box.innerHTML=U.lines({series:[{values:U.pairEnds(idx),name:'지수 (이틀마다)'},{values:U.pairEnds(two),name:'날마다 2배'}],hlines:[[100,'처음 값 100']],xunit:'쌍',h:250,label:`하루 ${U.fmt(a*100,1)}% 흔들림. 250거래일 뒤 지수 ${U.fmt(idx[250],2)}, 2배 상품 ${U.fmt(two[250],2)}`});
  out.innerHTML=`하루 ${U.fmt(a*100,1)}%씩 오르내린 지수는 250거래일 뒤 <b>${U.fmt(idx[250],2)}</b>${U.josa(U.fmt(idx[250],2),'으로','로')} 제자리입니다. 날마다 2배로 다시 맞춘 상품은 <b>${U.fmt(two[250],2)}</b>, 곧 <b>${U.ppct(two[250]/100-1)}</b>입니다. 지수가 오르내리기만 했는데 이만큼 깎였습니다.`;
 }
 const click=e=>{const b=e.target.closest('[data-a]');if(b){input.value=b.dataset.a;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
