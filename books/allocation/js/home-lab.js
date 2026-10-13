/* 표지의 살아 있는 실험(포트폴리오 비중 실험의 맛보기): 누리200과 채권 묶음(상관 −0.2, V-0 가정)의 주식 비중만 바꾸면 기대수익과 표준편차가 함께 움직인다.
   AMath.twoAsset·minVar2로 실제로 계산하며, 3장 실험의 두 자산 곡선과 같다(본문 값 60/40 → μ 5.60%, σ 10.58%). */
window.AHome=(()=>{
function mount(el){
 const M=AMath,U=AUI,a=M.asset(1),b=M.asset(3),rho=M.ASSETS.corr[1][3];
 const pts=Array.from({length:41},(_,k)=>{const p=M.twoAsset(k/40,a,b,rho);return [p.sigma*100,p.mu*100];}),wm=M.minVar2(a.sigma,b.sigma,rho),mv=M.twoAsset(wm,a,b,rho);
 el.innerHTML=`<div class="lab-top"><span>누리200 비중을 옮겨 기대수익과 표준편차 다시 계산하기</span><span>WEIGHT · RISK</span></div><div class="home-book"></div><div class="network-controls">${U.range('home-w','누리200 비중 (%, 나머지는 채권 묶음)',0,100,1,60,'본문 값은 60%. 상관은 −0.2로 둡니다')}<div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>가상 지수 누리200(기대수익 7%, 표준편차 18%)과 채권 묶음(3.5%, 6%)을 섞을 때, 기대수익은 비중대로 평균이 되지만 표준편차는 상관이 1보다 작은 만큼 덜 더해집니다. 기대수익·표준편차·상관은 ${U.LABEL}이며, 투자 권유가 아닙니다.</p></details>`;
 const input=el.querySelector('#home-w'),box=el.querySelector('.home-book'),out=el.querySelector('.home-result');
 function update(){
  const w=Number(input.value)/100,p=M.twoAsset(w,a,b,rho);
  el.querySelector('#home-w-value').textContent=U.sfmt(w*100,0);
  box.innerHTML=U.xy({series:[{name:'두 자산을 섞은 곡선 (상관 −0.2)',pts,color:'var(--blue)'}],points:[{name:`지금 비중 (누리200 ${U.sfmt(w*100,0)}%)`,x:p.sigma*100,y:p.mu*100,shape:'▲',color:'var(--orange)'},{name:`최소분산 (누리200 ${U.pct(wm)})`,x:mv.sigma*100,y:mv.mu*100,shape:'◆',color:'var(--accent)'}],
   xmin:0,xmax:20,ymin:3,ymax:7.5,xlabel:'표준편차 σ (%)',ylabel:'기대수익 μ (%)',xtick:v=>U.sfmt(v,0),ytick:v=>U.sfmt(v,1),h:330,label:`누리200 ${U.sfmt(w*100,0)}%: 기대수익 ${U.pct(p.mu)}, 표준편차 ${U.pct(p.sigma)}`});
  out.innerHTML=`누리200 ${U.sfmt(w*100,0)}% · 채권 ${U.sfmt(100-w*100,0)}%: 기대수익 <b>${U.pct(p.mu)}</b>, 표준편차 <b>${U.pct(p.sigma)}</b>.<br><span class="kind-tag">${U.KINDS.real}</span> <span class="kind-tag">${U.KINDS.assume}</span>`;
 }
 input.addEventListener('input',update);update();
 return ()=>input.removeEventListener('input',update);
}
return {mount};
})();
