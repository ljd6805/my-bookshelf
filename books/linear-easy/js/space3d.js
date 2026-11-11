/* 3차원 그림판. 점·화살표·면을 회전시켜 SVG에 정사영으로 그린다. 계산은 ELMath가 하고 여기서는 회전·투영·깊이 순서만 맡는다.
   축은 [샷, 우유, 시럽]이고 시럽 축이 위로 선다. 길이는 축척대로다.
   끌기·방향키로 돌릴 수 있고, 처음에는 좌우로 천천히 흔들린다(동작 줄이기에서는 멈춘 채 시작한다). */
window.EL3D=(()=>{
'use strict';
const DEG=Math.PI/180,W=440,H=360;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const still=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='reduce';
const f=n=>n.toFixed(1);

/* 한 번 그릴 때 쓰는 붓. 요소마다 깊이를 기억했다가 먼 것부터 그린다. */
function Scene(view){this.v=view;this.items=[];this.top=[];this.label='';}
Scene.prototype.p=function(q){return this.v.project(q);};
Scene.prototype.line=function(a,b,color,o={}){
 const p=this.p(a),q=this.p(b);
 this.items.push({d:(p.d+q.d)/2+(o.lift||0),s:`<line x1="${f(p.x)}" y1="${f(p.y)}" x2="${f(q.x)}" y2="${f(q.y)}" stroke="${color}" stroke-width="${o.width||1.6}"${o.dash?` stroke-dasharray="${o.dash}"`:''}${o.opacity?` opacity="${o.opacity}"`:''} stroke-linecap="round"/>`});
 return this;
};
Scene.prototype.arrow=function(a,b,color,o={}){
 const p=this.p(a),q=this.p(b),len=Math.hypot(q.x-p.x,q.y-p.y),width=o.width||3;
 if(len<2){this.items.push({d:q.d+.05,s:`<circle cx="${f(q.x)}" cy="${f(q.y)}" r="4" fill="${color}"/>`});}
 else{const ux=(q.x-p.x)/len,uy=(q.y-p.y)/len,h=Math.min(13,len*.45),bx=q.x-ux*h,by=q.y-uy*h;
  this.items.push({d:(p.d+q.d)/2+.05+(o.lift||0),s:`<g${o.opacity?` opacity="${o.opacity}"`:''}><line x1="${f(p.x)}" y1="${f(p.y)}" x2="${f(bx)}" y2="${f(by)}" stroke="${color}" stroke-width="${width}"${o.dash?` stroke-dasharray="${o.dash}"`:''} stroke-linecap="round"/><polygon points="${f(q.x)},${f(q.y)} ${f(bx-uy*h*.42)},${f(by+ux*h*.42)} ${f(bx+uy*h*.42)},${f(by-ux*h*.42)}" fill="${color}"/></g>`});}
 if(o.label)this.text(b,o.label,color,{dy:-9});
 return this;
};
Scene.prototype.point=function(a,color,o={}){
 const p=this.p(a);
 this.items.push({d:p.d+.1,s:`<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${o.r||5}" fill="${color}"${o.ring?` stroke="${o.ring}" stroke-width="2.5"`:' stroke="var(--chart)" stroke-width="1"'}/>`});
 if(o.label)this.text(a,o.label,o.labelColor||'var(--text)',{dy:-10,size:o.size,...(o.at||{})});
 return this;
};
Scene.prototype.poly=function(pts,color,opacity=.25,o={}){
 const ps=pts.map(q=>this.p(q));
 this.items.push({d:ps.reduce((s,p)=>s+p.d,0)/ps.length+(o.lift||0),s:`<polygon points="${ps.map(p=>`${f(p.x)},${f(p.y)}`).join(' ')}" fill="${color}" fill-opacity="${opacity}" stroke="${o.stroke||color}" stroke-width="${o.strokeWidth||1}" stroke-linejoin="round"/>`});
 return this;
};
/* 글자는 늘 맨 위에 그린다. 그림 밖으로 나가지 않게 가장자리에서 안쪽으로 붙인다. */
Scene.prototype.text=function(a,str,color='var(--text)',o={}){
 const p=this.p(a),x=Math.max(8,Math.min(W-8,p.x+(o.dx||0))),y=Math.max(14,Math.min(H-6,p.y+(o.dy||0)));
 const anchor=x>W*.72?'end':x<W*.28?'start':'middle';
 this.top.push(`<text x="${f(x)}" y="${f(y)}" text-anchor="${o.anchor||anchor}" fill="${color}" font-size="${o.size||13}" font-weight="${o.weight||600}" paint-order="stroke" stroke="var(--chart)" stroke-width="3">${esc(str)}</text>`);
 return this;
};
/* 바닥 격자와 세 축. range는 축마다 [0, range] 또는 [-range, range]. */
Scene.prototype.frame=function(){
 const v=this.v,lo=v.signed?-v.range:0,hi=v.range,g='var(--line)',st=v.step;
 for(let k=lo;k<=hi;k+=st){this.line([k,lo,0],[k,hi,0],g,{width:1,lift:-9}).line([lo,k,0],[hi,k,0],g,{width:1,lift:-9});}
 const e=hi+.45;
 this.line([lo,0,0],[e,0,0],'var(--muted)',{width:1.6,lift:-8}).line([0,lo,0],[0,e,0],'var(--muted)',{width:1.6,lift:-8}).line([0,0,v.signed?lo:0],[0,0,e],'var(--muted)',{width:1.6,lift:-8});
 this.text([e+.25,0,0],v.labels[0],'var(--muted)',{size:12}).text([0,e+.25,0],v.labels[1],'var(--muted)',{size:12}).text([0,0,e+.3],v.labels[2],'var(--muted)',{size:12});
 if(v.ticks)for(let k=st;k<=hi;k+=st){this.text([k,0,0],String(k),'var(--muted)',{size:10,dy:13,weight:400}).text([0,k,0],String(k),'var(--muted)',{size:10,dy:13,weight:400}).text([0,0,k],String(k),'var(--muted)',{size:10,dx:-9,dy:4,weight:400});}
 return this;
};
/* 꼭짓점 여덟 개로 상자 하나를 그린다. corners 순서: (x,y,z)의 이진수 000,100,010,110,001,101,011,111. */
const FACES=[[0,1,3,2],[4,5,7,6],[0,1,5,4],[2,3,7,6],[0,2,6,4],[1,3,7,5]];
Scene.prototype.box=function(c,color,opacity=.22,o={}){FACES.forEach((q,i)=>this.poly(q.map(k=>c[k]),o.colors?o.colors[i>>1]:color,opacity,{stroke:o.stroke||color,strokeWidth:o.strokeWidth||1.2,lift:o.lift}));return this;};
const unitCorners=(M,s=1,at=[0,0,0])=>[0,1,2,3,4,5,6,7].map(k=>{const v=[k&1?s:0,k&2?s:0,k&4?s:0];return M?M.map((r,i)=>r[0]*v[0]+r[1]*v[1]+r[2]*v[2]+at[i]):v.map((x,i)=>x+at[i]);});

function mount(host,opt){
 const view={yaw:opt.yaw??-32,pitch:opt.pitch??22,range:opt.range??4,signed:!!opt.signed,labels:typeof opt.labels==='function'?opt.labels():opt.labels||['x','y','z'],ticks:opt.ticks!==false,step:opt.step||1,sway:0,spin:!still()&&opt.spin!==false};
 const home={yaw:view.yaw,pitch:view.pitch},span=view.signed?view.range*2:view.range,unit=(opt.zoom||1.12)*H/(span*1.75+1.4);
 const center=view.signed?[0,0,0]:[view.range/2,view.range/2,view.range*.3];
 view.project=q=>{
  const a=(view.yaw+view.sway)*DEG,e=view.pitch*DEG,x=q[0]-center[0],y=q[1]-center[1],z=q[2]-center[2];
  const xr=x*Math.cos(a)-y*Math.sin(a),yr=x*Math.sin(a)+y*Math.cos(a);
  return {x:W/2+xr*unit,y:H/2-(z*Math.cos(e)+yr*Math.sin(e))*unit,d:z*Math.sin(e)-yr*Math.cos(e)};
 };
 host.innerHTML=`<div class="el-3d"><svg viewBox="0 0 ${W} ${H}" role="img" tabindex="0" aria-label=""></svg><div class="el-3d-bar"><button type="button" data-spin aria-pressed="${view.spin}">${view.spin?'움직임 멈추기':'천천히 흔들기'}</button><button type="button" data-home>처음 각도</button><span class="caption">그림을 끌거나, 그림을 누른 뒤 방향키로 돌려 보세요.</span></div></div>`;
 const svg=host.querySelector('svg'),spinButton=host.querySelector('[data-spin]');
 function redraw(){
  if(typeof opt.labels==='function')view.labels=opt.labels();const s=new Scene(view);if(opt.frame!==false)s.frame();opt.draw(s);
  s.items.sort((a,b)=>a.d-b.d);svg.innerHTML=s.items.map(i=>i.s).join('')+s.top.join('');
  svg.setAttribute('aria-label',s.label||opt.label||'3차원 그림');
 }
 let t0=null,raf=0;
 function tick(t){
  if(!svg.isConnected)return;
  if(view.spin){if(t0===null)t0=t;view.sway=16*Math.sin((t-t0)/1900);redraw();}
  raf=requestAnimationFrame(tick);
 }
 function setSpin(on){view.spin=on;t0=null;if(!on)view.sway=0;spinButton.setAttribute('aria-pressed',String(on));spinButton.textContent=on?'움직임 멈추기':'천천히 흔들기';redraw();}
 spinButton.onclick=()=>setSpin(!view.spin);
 host.querySelector('[data-home]').onclick=()=>{view.yaw=home.yaw;view.pitch=home.pitch;setSpin(false);};
 let drag=null;
 svg.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,yaw:view.yaw,pitch:view.pitch};svg.setPointerCapture(e.pointerId);if(view.spin)setSpin(false);});
 svg.addEventListener('pointermove',e=>{if(!drag)return;view.yaw=drag.yaw+(e.clientX-drag.x)*.5;view.pitch=Math.max(-10,Math.min(89,drag.pitch+(e.clientY-drag.y)*.4));redraw();});
 const end=()=>{drag=null;};svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
 svg.addEventListener('keydown',e=>{const k={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,6],ArrowDown:[0,-6]}[e.key];if(!k)return;e.preventDefault();if(view.spin)setSpin(false);view.yaw+=k[0];view.pitch=Math.max(-10,Math.min(89,view.pitch+k[1]));redraw();});
 redraw();raf=requestAnimationFrame(tick);
 return {redraw,view,destroy:()=>cancelAnimationFrame(raf)};
}
/* 0에서 1까지 가는 값을 ms 동안 흘려 보낸다. 동작 줄이기에서는 곧바로 1을 준다. 취소 함수를 돌려준다. */
function play(ms,frame,done){
 if(still()){frame(1);if(done)done();return ()=>{};}
 let start=null,id=0,stop=false;
 const step=t=>{if(stop)return;if(start===null)start=t;const u=Math.min(1,(t-start)/ms),e=u<.5?2*u*u:1-2*(1-u)*(1-u);frame(e);if(u<1)id=requestAnimationFrame(step);else if(done)done();};
 id=requestAnimationFrame(step);return ()=>{stop=true;cancelAnimationFrame(id);};
}
return {mount,play,unitCorners,still};
})();
