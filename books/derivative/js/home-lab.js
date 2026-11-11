/* 표지 실험: 시각 t를 옮기면 로켓의 높이와 그 순간의 속도(접선의 기울기)를 계산한다. 계산은 DVMath.rocket. */
window.DVHome=(()=>{
'use strict';
const U=DVUI,RK=DVMath.rocket,F=U.fmt;
/* 왼쪽 띠: 높이 0~20 m 눈금 위에 로켓을 축척대로 올려 놓는다. 화살표 길이는 속도에 비례한다. */
function strip(t){
 const h=RK.h(t),v=RK.v(t),y=226-h/24*204,len=v/20*46;
 return `<svg class="dv-strip" viewBox="0 0 90 250" role="img" aria-label="로켓의 높이 ${F(h,1)}미터를 세로 눈금 위에 그린 그림. 화살표는 속도 ${F(v,1)}미터 매 초입니다."><path d="M30 22V226M24 226H84" stroke="var(--muted)"/>${[0,5,10,15,20].map(m=>`<path d="M26 ${226-m/24*204}h8" stroke="var(--muted)"/><text x="22" y="${230-m/24*204}" text-anchor="end">${m}</text>`).join('')}<path d="M56 ${y-16}l7 12v10h-14v-10z" fill="var(--accent)"/><path d="M49 ${y+6}l-5 8h5zM63 ${y+6}l5 8h-5z" fill="var(--accent)"/>${Math.abs(len)>1?`<path d="M78 ${y}V${y-len}" stroke="var(--orange)" stroke-width="3"/><path d="M78 ${y-len-(len>0?6:-6)}l-5 ${len>0?8:-8}h10z" fill="var(--orange)"/>`:`<circle cx="78" cy="${y}" r="4" fill="var(--orange)"/>`}<text x="6" y="14">높이 (m)</text></svg>`;
}
function mount(el){
 el.innerHTML=`<div class="dv-home"><div class="dv-home-art"></div></div>${U.range('home-t','시각 t (초)',0,4,0.1,1)}<div class="buttons dv-home-buttons"><button type="button" data-play>0초부터 4초까지 재생</button></div><p class="home-result" role="status" aria-live="polite"></p><p class="caption">주황 선은 그 순간의 접선이고, 접선의 기울기가 그 순간의 속도입니다. h(t) = 20t − 5t²으로 실제 계산합니다.</p>`;
 const input=el.querySelector('#home-t'),art=el.querySelector('.dv-home-art');
 function update(){
  const t=Number(input.value),h=RK.h(t),v=RK.v(t);
  el.querySelector('#home-t-value').textContent=input.value;
  art.innerHTML=strip(t)+U.graph({xmin:0,xmax:4,ymin:0,ymax:24,xlabel:'t (초)',ylabel:'높이 h (m)',curves:[{f:RK.h}],segs:[{...U.lineThrough(t,h,v,t-0.7,t+0.7),width:3}],pts:[[t,h]],h:250,label:`로켓 높이 그래프와 t = ${F(t,1)}초에서의 접선. 기울기 ${F(v,1)} m/s`});
  el.querySelector('.home-result').innerHTML=`t = ${F(t,1)}초: 높이 <b>${F(h,2)} m</b>, 그 순간의 속도 h′(t) = 20 − 10t = <b>${F(v,1)} m/s</b> · ${Math.abs(v)<1e-9?'속도가 0인 최고점입니다.':v>0?'양수이므로 올라가는 중입니다.':'음수이므로 내려오는 중입니다.'}`;
 }
 const click=e=>{if(e.target.closest('[data-play]')){input.value=0;U.play(input,4,3200);}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
