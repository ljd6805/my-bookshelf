/* 표지 오른쪽의 대표 실험: 카페 손실 곡면 위의 한 점에서 w 방향과 b 방향의 단면 접선(두 편미분)을 함께 본다.
   곡면은 천천히 돌아가며(동작 줄이기에서는 멈춤) 끌거나 단추로 돌릴 수 있다. 계산은 DXMath.grad, 그림은 DXUI.surface. */
window.DXHome=(()=>{
const M=DXMath,U=DXUI,F=U.fmt,W=M.WINDOW,T='var(--text)',A='var(--accent)';
const still=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='reduce';
function chart(w,b,v){
 const g=M.grad(w,b),L=M.loss(w,b),d=1,ts=Array.from({length:25},(_,i)=>i/24);
 return U.surface({f:M.loss,win:W,yaw:v.yaw,pitch:v.pitch,n:16,axes:['w','b','L'],
  lines:[{pts:ts.map(t=>[8*t,b,M.loss(8*t,b)]),color:T,width:3},{pts:ts.map(t=>[w,8+8*t,M.loss(w,8+8*t)]),color:T,width:2.5,dash:'6 5'},{pts:[[w-d,b,L-g.gw*d],[w+d,b,L+g.gw*d]],color:A,width:4},{pts:[[w,b-d,L-g.gb*d],[w,b+d,L+g.gb*d]],color:A,width:4,dash:'3 4'}],
  dots:[[w,b,L,A,7]],label:'카페 8일 기록의 손실 곡면. 한 점을 지나는 w 방향 단면과 b 방향 단면, 두 접선이 그려져 있습니다. 숫자는 아래 결과에 있습니다.'});
}
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>손실 곡면 · 두 방향의 기울기</span><span>REAL CALCULATION</span></div><div class="home-graphic dx-home-map s3d-art" tabindex="0" role="group" aria-label="3차원 그림. 좌우로 끌거나 방향키로 돌릴 수 있습니다. 같은 내용은 아래 결과에 숫자로 있습니다."></div><div class="network-controls">${U.range('home-w','기울기 w (기온 1℃에 늘어나는 잔 수)',0,8,0.1,2)}${U.range('home-b','절편 b (20℃인 날의 잔 수)',8,16,0.5,12)}<div class="buttons"><button type="button" data-act="spin" aria-pressed="false">천천히 돌리기</button><button type="button" data-act="top">위에서 보기</button><button type="button" data-act="best">손실이 가장 작은 자리</button><button type="button" data-act="reset">처음으로</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>기온이 20℃에서 27℃까지였던 여덟 날의 아이스 음료 판매(12, 15, 21, 22, 28, 33, 34, 41잔, 설명용 가상 값)에 선 ŷ = w·x + b를 그었을 때의 평균제곱오차 L(w, b)를 높이로 그린 곡면입니다. 실선은 b를 고정하고 w만 움직인 단면, 점선은 w를 고정하고 b만 움직인 단면이고, 분홍 선 두 개가 각 단면의 접선입니다. 접선의 기울기가 편미분 ∂L/∂w와 ∂L/∂b입니다.</p></details>`;
 const iw=el.querySelector('#home-w'),ib=el.querySelector('#home-b'),art=el.querySelector('.home-graphic'),spinBtn=el.querySelector('[data-act=spin]'),v={yaw:-35,pitch:28};let timer=null,drag=null;
 function update(){const w=Number(iw.value),b=Number(ib.value),g=M.grad(w,b);
  el.querySelector('#home-w-value').textContent=w;el.querySelector('#home-b-value').textContent=b;art.innerHTML=chart(w,b,v);
  el.querySelector('.home-result').innerHTML=`(w, b) = (${F(w,1)}, ${F(b,1)}) · 손실 L = <b>${F(M.loss(w,b))}</b><br>w만 움직인 단면의 기울기 ∂L/∂w = <b>${F(g.gw)}</b> · b만 움직인 단면의 기울기 ∂L/∂b = <b>${F(g.gb)}</b><br>${g.norm<1?'두 기울기가 모두 0에 가깝습니다. 손실이 가장 작은 자리입니다.':Math.abs(g.gw)>Math.abs(g.gb)*3?'같은 자리에서도 w 방향이 b 방향보다 훨씬 가파릅니다.':'두 방향의 기울기가 비슷한 크기입니다.'}`;}
 const spin=on=>{clearInterval(timer);timer=on?setInterval(()=>{v.yaw+=0.8;art.innerHTML=chart(Number(iw.value),Number(ib.value),v);},80):null;spinBtn.setAttribute('aria-pressed',String(on));spinBtn.textContent=on?'멈추기':'천천히 돌리기';};
 const click=e=>{const t=e.target.closest('[data-act]');if(!t)return;const a=t.dataset.act;
  if(a==='spin'){spin(!timer);return;}
  if(a==='top'){spin(false);v.yaw=0;v.pitch=90;}
  if(a==='best'){iw.value=4;ib.value=11.5;}
  if(a==='reset'){spin(false);iw.value=2;ib.value=12;v.yaw=-35;v.pitch=28;}
  update();};
 const down=e=>{drag={x:e.clientX};},move=e=>{if(!drag)return;v.yaw+=(e.clientX-drag.x)*.6;drag={x:e.clientX};update();},up=()=>{drag=null;};
 const key=e=>{const k={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,8],ArrowDown:[0,-8]}[e.key];if(!k)return;e.preventDefault();v.yaw+=k[0];v.pitch=Math.max(8,Math.min(90,v.pitch+k[1]));update();};
 iw.addEventListener('input',update);ib.addEventListener('input',update);el.addEventListener('click',click);
 art.addEventListener('pointerdown',down);art.addEventListener('pointermove',move);art.addEventListener('pointerup',up);art.addEventListener('pointerleave',up);art.addEventListener('keydown',key);
 update();if(!still())spin(true);
 return ()=>{clearInterval(timer);};
}
return {mount};
})();
