/* 돌려 볼 수 있는 3차원 그림(5·7·10·12장과 표지). SVG에 정사영으로 그리고 먼 면부터 칠한다.
   3D는 공간 관계(늘어난 부피 조각, 겉넓이 × 두께, 접히는 면, 원기둥 비율)를 설명할 때만 쓴다.
   같은 내용은 실험의 결과 문장과 표에 숫자로도 있다. 길이는 모두 축척대로이고 값은 DVMath가 계산한다.
   조작: 끌기, 방향키, 단추. "천천히 돌리기"는 동작 줄이기 설정에서는 꺼진 채 시작한다. */
window.DV3D=(()=>{
'use strict';
const DEG=Math.PI/180,W=480,H=320;
const reduced=()=>document.documentElement.dataset.motion==='reduce'||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const n1=v=>v.toFixed(1);
/* 시점 하나에서 점을 화면 좌표와 깊이(d가 클수록 앞)로 바꾸는 함수 */
function projector(view,unit,cx,cy){
 const a=view.yaw*DEG,b=view.pitch*DEG,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
 return p=>{const x1=p[0]*ca-p[1]*sa,y1=p[0]*sa+p[1]*ca;return {x:cx+x1*unit,y:cy-(y1*sb+p[2]*cb)*unit,d:p[2]*sb-y1*cb};};
}
/* 그릴 조각을 모으는 붓. poly·line·text는 조각을 더하고, cuboid·sphere·cylinder는 그 조각들로 도형을 만든다. */
function brush(P,unit){
 const out=[];
 const S={P,unit,
  poly(pts,fill,o={}){const q=pts.map(P);out.push({d:q.reduce((s,p)=>s+p.d,0)/q.length+(o.lift||0),s:`<polygon points="${q.map(p=>`${n1(p.x)},${n1(p.y)}`).join(' ')}" fill="${fill}" fill-opacity="${o.o??1}" stroke="${o.stroke||'var(--bg)'}" stroke-width="${o.sw||1}"${o.dash?' stroke-dasharray="5 4"':''}/>`});},
  line(a,b,stroke,o={}){const p=P(a),q=P(b);out.push({d:(p.d+q.d)/2+(o.lift||0),s:`<path d="M${n1(p.x)} ${n1(p.y)}L${n1(q.x)} ${n1(q.y)}" stroke="${stroke}" stroke-width="${o.sw||1.5}"${o.dash?' stroke-dasharray="5 4"':''} fill="none"/>`});},
  text(at,str,o={}){const p=P(at);out.push({d:1e6,s:`<text x="${n1(p.x+(o.dx||0))}" y="${n1(p.y+(o.dy||0))}" text-anchor="${o.anchor||'middle'}" font-size="${o.size||13}" fill="${o.fill||'var(--text)'}" font-weight="${o.w||600}" paint-order="stroke" stroke="var(--chart)" stroke-width="3">${str}</text>`});},
  /* 축에 나란한 상자. 윗면·옆면의 밝기를 다르게 해서 방향이 읽히게 한다. */
  cuboid(a,b,fill,o={}){
   const [x0,y0,z0]=a,[x1,y1,z1]=b,op=o.o??0.9,f=(pts,k)=>S.poly(pts,fill,{o:op*k,stroke:o.stroke,sw:o.sw});
   f([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],1);f([[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],0.55);
   f([[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],0.78);f([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],0.78);
   f([[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]],0.62);f([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],0.62);
  },
  /* 구: 정사영에서는 어느 쪽에서 보아도 원이다. 앞쪽 위도·경도선을 그려 둥근 면을 읽게 한다. */
  sphere(c,r,fill,o={}){
   const p=P(c),n=36,seg=(f)=>{let d='',pen=false;for(let i=0;i<=n;i++){const q3=f(i/n*2*Math.PI),q=P(q3);if(q.d>=p.d-1e-9){d+=`${pen?'L':'M'}${n1(q.x)} ${n1(q.y)}`;pen=true;}else pen=false;}return d;};
   let g=`<circle cx="${n1(p.x)}" cy="${n1(p.y)}" r="${n1(r*unit)}" fill="${fill}" fill-opacity="${o.o??0.85}" stroke="${o.stroke||fill}" stroke-width="${o.sw||1.5}"${o.dash?' stroke-dasharray="5 4"':''}/>`;
   if(o.grid!==false){let d='';for(const lat of [-60,-30,0,30,60]){const z=r*Math.sin(lat*DEG),rr=r*Math.cos(lat*DEG);d+=seg(t=>[c[0]+rr*Math.cos(t),c[1]+rr*Math.sin(t),c[2]+z]);}
    for(let k=0;k<6;k++){const ph=k*30*DEG;d+=seg(t=>[c[0]+r*Math.cos(t)*Math.cos(ph),c[1]+r*Math.cos(t)*Math.sin(ph),c[2]+r*Math.sin(t)]);}
    g+=`<path d="${d}" fill="none" stroke="var(--bg)" stroke-opacity=".55" stroke-width="1"/>`;}
   out.push({d:p.d+(o.lift||0),s:g});
  },
  /* z축에 나란한 원기둥(밑면 중심 c, 반지름 r, 높이 h). 옆면은 띠 28개로 나눠 칠한다. */
  cylinder(c,r,h,fill,o={}){
   const n=28,ring=z=>Array.from({length:n},(_,i)=>[c[0]+r*Math.cos(i/n*2*Math.PI),c[1]+r*Math.sin(i/n*2*Math.PI),z]),lo=ring(c[2]),hi=ring(c[2]+h);
   for(let i=0;i<n;i++){const j=(i+1)%n;S.poly([lo[i],lo[j],hi[j],hi[i]],fill,{o:(o.o??0.9)*(0.6+0.3*Math.abs(Math.cos(i/n*2*Math.PI))),stroke:fill,sw:0.4});}
   S.poly(lo,o.endFill||fill,{o:0.5,stroke:o.stroke});S.poly(hi,o.endFill||fill,{o:o.o??0.95,stroke:o.stroke});
  }
 };
 return {S,out};
}
/* host 안에 그림과 조작 단추를 놓는다. build(S)는 시점이 바뀔 때마다 불려 조각을 다시 만든다. */
function mount(host,{label,build,yaw=-35,pitch=24,unit=20,center=[W/2,H/2+30],spin=true}){
 const view={yaw,pitch},start={yaw,pitch};
 host.innerHTML=`<div class="dv3d"><svg viewBox="0 0 ${W} ${H}" role="img" tabindex="0" aria-label="${DVUI.esc(label)} 끌거나 방향키로 돌려 볼 수 있습니다."></svg><div class="buttons dv3d-buttons"><button type="button" data-turn="-15,0" aria-label="왼쪽으로 돌리기">◀</button><button type="button" data-turn="15,0" aria-label="오른쪽으로 돌리기">▶</button><button type="button" data-turn="0,10" aria-label="위에서 보기 쪽으로 기울이기">▲</button><button type="button" data-turn="0,-10" aria-label="옆에서 보기 쪽으로 기울이기">▼</button><button type="button" data-spin aria-pressed="false">천천히 돌리기</button><button type="button" data-home>처음 각도</button></div></div>`;
 const svg=host.querySelector('svg'),spinBtn=host.querySelector('[data-spin]');let spinning=false,last=0,drag=null;
 function draw(){const {S,out}=brush(projector(view,unit,center[0],center[1]),unit);build(S);svg.innerHTML=out.sort((p,q)=>p.d-q.d).map(p=>p.s).join('');}
 function turn(dy,dp){view.yaw=(view.yaw+dy)%360;view.pitch=Math.max(4,Math.min(88,view.pitch+dp));draw();}
 function tick(t){if(!spinning||!svg.isConnected){spinning=false;return;}if(t-last>40){last=t;view.yaw=(view.yaw+0.5)%360;draw();}requestAnimationFrame(tick);}
 function setSpin(v){spinning=v;spinBtn.setAttribute('aria-pressed',String(v));if(v)requestAnimationFrame(tick);}
 host.querySelector('.dv3d-buttons').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.turn){const [a,c]=b.dataset.turn.split(',').map(Number);setSpin(false);turn(a,c);}
  else if(b.hasAttribute('data-spin'))setSpin(!spinning);
  else{setSpin(false);view.yaw=start.yaw;view.pitch=start.pitch;draw();}};
 svg.addEventListener('keydown',e=>{const k={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,6],ArrowDown:[0,-6]}[e.key];if(k){e.preventDefault();setSpin(false);turn(k[0],k[1]);}});
 svg.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];setSpin(false);svg.setPointerCapture(e.pointerId);});
 svg.addEventListener('pointermove',e=>{if(!drag)return;turn((e.clientX-drag[0])*0.5,(e.clientY-drag[1])*0.3);drag=[e.clientX,e.clientY];});
 const end=()=>{drag=null;};svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
 draw();if(spin&&!reduced())setSpin(true);
 return {draw,view,stop:()=>setSpin(false)};
}
return {mount,projector,brush};
})();
