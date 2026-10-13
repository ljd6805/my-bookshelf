/* 표지의 살아 있는 실험: 모형 경제의 명목 GDP 성장률 6%를 두고 디플레이터 상승률만 바꾸면 실질 성장률이 어떻게 바뀌는가.
   MMath.realGrowth로 실제로 계산하며, 1장 실험의 실질 성장률 계산과 같다(본문 값 4% → 1.92%). */
window.MHome=(()=>{
function mount(el){
 const M=MMath,U=MUI,N=M.ASSUME.growth.nominal;
 el.innerHTML=`<div class="lab-top"><span>디플레이터를 바꿔 모형 경제의 실질 성장률 다시 계산하기</span><span>NOMINAL · REAL</span></div><div class="home-book"></div><div class="network-controls">${U.range('home-d','GDP 디플레이터 상승률 (%)',0,10,0.1,(M.ASSUME.growth.deflator*100).toFixed(1),'본문 값은 4%. 명목 성장률 6%는 그대로 둡니다')}<div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>이름 없는 가상의 “모형 경제”의 명목 GDP가 1년에 6% 늘었다고 놓고, 그 가운데 가격이 오른 몫(디플레이터 상승률)을 걷어 내 생산의 양이 늘어난 비율(실질 성장률)을 (1 + 명목) ÷ (1 + 디플레이터) − 1로 계산합니다. 두 비율을 빼기만 한 어림과 나눗셈으로 구한 값이 디플레이터가 클수록 더 벌어집니다. 숫자는 미리 정한 가상 시나리오이며, 실제 경제의 예측이 아니고 투자 권유가 아닙니다.</p></details>`;
 const input=el.querySelector('#home-d'),box=el.querySelector('.home-book'),out=el.querySelector('.home-result');
 function update(){
  const d=Number(input.value)/100,real=M.realGrowth(N,d);
  el.querySelector('#home-d-value').textContent=U.sfmt(d*100,1);
  box.innerHTML=U.columns({labels:['명목|성장률','디플레이터|상승률','실질|성장률','어림|(명목 − 디플레이터)'],values:[N*100,d*100,real*100,(N-d)*100],mark:i=>i===2,fmt:v=>U.sfmt(v,2)+'%',tick:v=>U.sfmt(v,0)+'%',title:'모형 경제의 한 해 (%) · ▲ 실질',twoLine:true,h:240,label:`명목 ${U.pct(N)}, 디플레이터 ${U.pct(d)}, 실질 ${U.pct(real)}, 어림 ${U.pct(N-d)}`});
  out.innerHTML=`디플레이터 ${U.pct(d,1)}: 실질 성장률 = ${U.sfmt(1+N,2)} ÷ ${U.sfmt(1+d,3)} − 1 = <b>${U.pct(real)}</b>(어림 ${U.pct(N-d)}, 차이 ${U.sfmt((N-d-real)*100,2)}%p).<br><span class="kind-tag">${U.KINDS.real}</span> <span class="kind-tag">${U.KINDS.scenario}</span>`;
 }
 input.addEventListener('input',update);update();
 return ()=>input.removeEventListener('input',update);
}
return {mount};
})();
