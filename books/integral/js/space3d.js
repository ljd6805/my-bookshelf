/* 3차원 그림 그리기(9장 회전체, 11장 이중적분, 표지 일부). 계산은 하지 않는다: IGMath가 준 원판·기둥의 크기를 받아
   면으로 만들고, 회전(yaw: 세로축 둘레, pitch: 내려다보는 각)과 정사영, 뒤에서 앞으로 칠하기만 한다. 길이는 축척대로다.
   색은 책의 CSS 변수를 쓰고, 면의 밝기는 불투명도로만 나타낸다(색 외에 윤곽선으로도 면을 구분한다). */
window.IG3D=(()=>{
'use strict';
const DEG=Math.PI/180,W=480,H=340;
function camera(yaw,pitch,box){
 const a=yaw*DEG,b=pitch*DEG,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
 const c=box.map(([lo,hi])=>(lo+hi)/2),r=Math.hypot(...box.map(([lo,hi])=>(hi-lo)/2)),s=Math.min(W,H-30)/2/r*0.98;
 /* 화면 x, 화면 y(위가 +), 깊이 d(클수록 보는 사람에게 가깝다) */
 const P=p=>{const x=p[0]-c[0],y=p[1]-c[1],z=p[2]-c[2],x1=x*ca-y*sa,y1=x*sa+y*ca;return [W/2+x1*s,H/2-(y1*sb+z*cb)*s,z*sb-y1*cb];};
 return {P,view:[sa*cb*-1,-ca*cb,sb]};/* view: 보는 사람 쪽을 가리키는 단위 벡터(세계 좌표) */
}
function normal(p){const [a,b,c]=p,u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;return n.map(x=>x/l);}
const LIGHT=(()=>{const v=[-0.45,-0.55,0.7],l=Math.hypot(...v);return v.map(x=>x/l);})();
/* faces: [{pts:[[x,y,z]…], fill, n(바깥 법선, 없으면 계산), line}], lines: [{pts, stroke, dash}], labels: [{at:[x,y,z], text}] */
function render({faces=[],lines=[],labels=[],yaw=30,pitch=25,box,label}){
 const cam=camera(yaw,pitch,box),P=cam.P,out=[];
 for(const f of faces){
  const n=f.n||normal(f.pts),facing=n[0]*cam.view[0]+n[1]*cam.view[1]+n[2]*cam.view[2];
  if(facing<=0.001)continue;
  const q=f.pts.map(P),d=q.reduce((s,p)=>s+p[2],0)/q.length,lit=Math.max(0,n[0]*LIGHT[0]+n[1]*LIGHT[1]+n[2]*LIGHT[2]);
  out.push([d,`<polygon points="${q.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="${f.fill}" fill-opacity="${(0.34+0.6*lit).toFixed(2)}" stroke="${f.line||'var(--bg)'}" stroke-width="${f.line?1.4:0.6}" stroke-linejoin="round"/>`]);
 }
 out.sort((a,b)=>a[0]-b[0]);
 const back=lines.map(l=>`<polyline points="${l.pts.map(P).map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}" fill="none" stroke="${l.stroke||'var(--muted)'}" stroke-width="${l.w||1.2}"${l.dash?` stroke-dasharray="${l.dash}"`:''}/>`).join('');
 const text=labels.map(t=>{const p=P(t.at);return `<text x="${p[0].toFixed(1)}" y="${p[1].toFixed(1)}" text-anchor="${t.anchor||'middle'}" fill="var(--muted)">${t.text}</text>`;}).join('');
 return `<svg class="ig3d" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">${back}${out.map(x=>x[1]).join('')}${text}</svg>`;
}
/* 세로축 둘레 회전체: disks=[[아래 높이, 두께, 반지름]], sweep=돌린 각(도), profile=원래 곡선 [[높이, 반지름]] */
function solid({disks,sweep=360,H:top,rmax,profile=[],fill='var(--accent)',cut='var(--orange)'}){
 const m=Math.max(4,Math.round(28*sweep/360)),full=sweep>=359.5,th=k=>k/m*sweep*DEG,faces=[],lines=[];
 const pt=(r,k,z)=>[r*Math.cos(th(k)),r*Math.sin(th(k)),z];
 disks.forEach(([z0,dz,r],i)=>{
  const z1=z0+dz,above=disks[i+1]?disks[i+1][2]:0;
  for(let k=0;k<m;k++){
   const mid=(th(k)+th(k+1))/2;
   faces.push({pts:[pt(r,k,z0),pt(r,k+1,z0),pt(r,k+1,z1),pt(r,k,z1)],n:[Math.cos(mid),Math.sin(mid),0],fill});
   if(above<r)faces.push({pts:above>0?[pt(above,k,z1),pt(r,k,z1),pt(r,k+1,z1),pt(above,k+1,z1)]:[[0,0,z1],pt(r,k,z1),pt(r,k+1,z1)],n:[0,0,1],fill});
  }
  if(!full){
   faces.push({pts:[[0,0,z0],pt(r,0,z0),pt(r,0,z1),[0,0,z1]],n:[0,-1,0],fill:cut});
   faces.push({pts:[[0,0,z0],[0,0,z1],pt(r,m,z1),pt(r,m,z0)],n:[-Math.sin(th(m)),Math.cos(th(m)),0],fill:cut});
  }
 });
 /* 바닥 격자, 회전축, 원래 곡선(돌리기 전의 옆모습)과 그릇의 테두리 */
 const ring=(r,z)=>Array.from({length:49},(_,k)=>[r*Math.cos(k/48*2*Math.PI),r*Math.sin(k/48*2*Math.PI),z]);
 lines.push({pts:ring(rmax,0),dash:'3 4'},{pts:[[0,0,0],[0,0,top*1.08]],stroke:'var(--text)',dash:'6 4'});
 if(profile.length){lines.push({pts:profile.map(([h,r])=>[r,0,h]),stroke:'var(--orange)',w:2.4},{pts:profile.map(([h,r])=>[-r,0,h]),dash:'3 4'},{pts:ring(profile[profile.length-1][1],top),dash:'3 4'});}
 return {faces,lines,labels:[{at:[0,0,top*1.38],text:'회전축 (높이 h)'},{at:[rmax*1.05,0,0],text:'반지름 ρ',anchor:'start'}],box:[[-rmax,rmax],[-rmax,rmax],[0,top*1.4]]};
}
/* 바닥 직사각형 위의 기둥: cols=[[x0, y0, dx, dy, 높이]]. 음수 높이는 바닥 아래로 그린다. */
function boxes({cols,ax,bx,ay,by,zmax,fill='var(--accent)',top='var(--blue)'}){
 const faces=[];
 for(const [x,y,dx,dy,z] of cols){
  const lo=Math.min(0,z),hi=Math.max(0,z),x1=x+dx,y1=y+dy;if(hi-lo<1e-9)continue;
  faces.push({pts:[[x,y,hi],[x1,y,hi],[x1,y1,hi],[x,y1,hi]],n:[0,0,1],fill:top},
   {pts:[[x,y,lo],[x1,y,lo],[x1,y,hi],[x,y,hi]],n:[0,-1,0],fill},{pts:[[x1,y,lo],[x1,y1,lo],[x1,y1,hi],[x1,y,hi]],n:[1,0,0],fill},
   {pts:[[x1,y1,lo],[x,y1,lo],[x,y1,hi],[x1,y1,hi]],n:[0,1,0],fill},{pts:[[x,y1,lo],[x,y,lo],[x,y,hi],[x,y1,hi]],n:[-1,0,0],fill});
 }
 return {faces,...floor(ax,bx,ay,by,zmax)};
}
/* x 방향으로 자른 판: slabs=[[x0, dx, 단면 곡선 [[y, z]…]]]. 단면(옆면)은 주황으로 칠해 넓이 A(x)가 보이게 한다. */
function slabs({slabs:list,ax,bx,ay,by,zmax,fill='var(--accent)',side='var(--orange)'}){
 const faces=[];
 for(const [x,dx,curve] of list){
  const x1=x+dx,poly=xx=>[[xx,curve[0][0],0],...curve.map(([y,z])=>[xx,y,z]),[xx,curve[curve.length-1][0],0]];
  faces.push({pts:poly(x),n:[-1,0,0],fill:side},{pts:poly(x1).reverse(),n:[1,0,0],fill:side});
  for(let k=0;k<curve.length-1;k++){const [y0,z0]=curve[k],[y1,z1]=curve[k+1];faces.push({pts:[[x,y0,z0],[x1,y0,z0],[x1,y1,z1],[x,y1,z1]],fill});}
  const [ya,za]=curve[0],[yb,zb]=curve[curve.length-1];
  if(za>1e-9)faces.push({pts:[[x,ya,0],[x1,ya,0],[x1,ya,za],[x,ya,za]],n:[0,-1,0],fill});
  if(zb>1e-9)faces.push({pts:[[x1,yb,0],[x,yb,0],[x,yb,zb],[x1,yb,zb]],n:[0,1,0],fill});
 }
 return {faces,...floor(ax,bx,ay,by,zmax)};
}
function floor(ax,bx,ay,by,zmax){
 const lines=[{pts:[[ax,ay,0],[bx,ay,0],[bx,by,0],[ax,by,0],[ax,ay,0]]},{pts:[[ax,ay,0],[ax,ay,zmax]],dash:'5 4'}];
 const mx=(bx-ax)*0.08,my=(by-ay)*0.08;
 return {lines,labels:[{at:[bx+mx,ay-my,0],text:'x'},{at:[ax-mx,by+my,0],text:'y'},{at:[ax,ay,zmax*1.08],text:'z'}],box:[[ax,bx],[ay,by],[0,zmax]]};
}
/* 그림을 끌어 돌리기: yaw·pitch 슬라이더 값을 바꾸고 input 이벤트를 보내 사람이 슬라이더를 움직인 것과 같은 경로로 다시 그린다. */
function drag(el,yawId,pitchId){
 const chart=el.querySelector('.chart'),yaw=el.querySelector('#'+yawId),pitch=el.querySelector('#'+pitchId);let last=null;
 const clamp=(v,inp)=>Math.max(+inp.min,Math.min(+inp.max,v));
 chart.addEventListener('pointerdown',e=>{if(!e.target.closest('svg.ig3d'))return;last=[e.clientX,e.clientY];chart.setPointerCapture(e.pointerId);});
 chart.addEventListener('pointermove',e=>{if(!last)return;const dx=e.clientX-last[0],dy=e.clientY-last[1];last=[e.clientX,e.clientY];
  yaw.value=clamp(((+yaw.value-dx*0.6)%360+360)%360,yaw);pitch.value=clamp(+pitch.value+dy*0.4,pitch);yaw.dispatchEvent(new Event('input',{bubbles:true}));});
 const end=()=>{last=null;};chart.addEventListener('pointerup',end);chart.addEventListener('pointercancel',end);
}
/* 단추로 값 하나를 처음부터 끝까지 움직이는 애니메이션. 동작 줄이기에서는 마지막 값으로 바로 간다. 돌려준 함수로 멈춘다. */
function animate(input,{from,to,ms=3200,done}){
 const still=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='reduce';
 const set=v=>{input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));};
 if(still){set(to);if(done)done();return ()=>{};}
 let t0=null,id=0,lastDraw=0;
 const step=t=>{if(t0===null)t0=t;const k=Math.min(1,(t-t0)/ms);if(t-lastDraw>45||k===1){lastDraw=t;const st=+input.step||1;set(Math.round((from+(to-from)*k)/st)*st);}
  if(k<1&&input.isConnected)id=requestAnimationFrame(step);else if(done)done();};
 id=requestAnimationFrame(step);return ()=>cancelAnimationFrame(id);
}
return {render,solid,boxes,slabs,drag,animate};
})();
