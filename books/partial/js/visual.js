/* 공통 실험 UI와 SVG 차트(AI Book·LLM 시스템 책의 형식), 그리고 돌려 볼 수 있는 3차원 곡면 그림.
   계산은 하지 않고 그리기만 한다. 3차원 좌표를 화면 좌표로 옮기는 식은 DXMath.project에 있다. */
window.DXLabs={};
window.DXUI=(()=>{
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* 음수는 본문과 같은 빼기 기호(−)로 적고, 반올림해 0이 된 값에는 부호를 붙이지 않는다. */
const fmt=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}).replace(/^-(?=0(\.0+)?$)/,'').replace(/^-/,'−'):'정의되지 않음';
const value=(el,id)=>Number(el.querySelector('#'+id).value);
const text=(el,id)=>el.querySelector('#'+id).value;
function range(id,label,min,max,step,v){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;}
function select(id,label,options,v){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,t])=>`<option value="${key}" ${String(key)===String(v)?'selected':''}>${t}</option>`).join('')}</select></label>`;}
function setup(el,controls){el._v=null;el._t=null;clearInterval(el._spin);el._spin=null;el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart"></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
function bind(el,fn){const update=()=>{el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=x.value;});fn();};el.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',update));update();}
/* 숫자 뒤에 붙는 조사를 마지막 숫자의 받침에 맞춰 고른다. josa('3.66','로') → '3.66으로', josa('−13.50','를') → '−13.50을' */
const JOSA={'로':['로','으로'],'와':['와','과'],'를':['를','을'],'가':['가','이']};
function josa(s,kind){const d=String(s).replace(/[^0-9]/g,'').slice(-1),pair=JOSA[kind];if(d==='')return s+pair[0];const closed=kind==='로'?'036'.includes(d):'013678'.includes(d);return s+pair[closed?1:0];}
/* 음수는 괄호로 감싸 "+ (−13.50)"처럼 적는다. */
const paren=s=>String(s).startsWith('−')?`(${s})`:String(s);
/* 돌려 보는 그림은 이미 있는 그림 칸과 단추를 그대로 두고 안쪽 그림과 단추 상태만 바꾼다. 다시 그릴 때마다 단추를 새로 만들면 도는 동안 누른 단추가 사라져 눌리지 않는다. */
function result(el,chart,t){
 const c=el.querySelector('.chart'),old=c.querySelector('.s3d-art'),r=el.querySelector('.readout');
 if(old&&chart.startsWith('<div class="s3d">')){
  const tmp=document.createElement('div');tmp.innerHTML=chart;old.innerHTML=tmp.querySelector('.s3d-art').innerHTML;
  const fresh=tmp.querySelectorAll('.s3d-tools button');c.querySelectorAll('.s3d-tools button').forEach((b,i)=>{const n=fresh[i];if(!n)return;if(n.hasAttribute('aria-pressed'))b.setAttribute('aria-pressed',n.getAttribute('aria-pressed'));if(b.textContent!==n.textContent)b.textContent=n.textContent;});
 }else c.innerHTML=chart;
 if(el._t!==t){el._t=t;r.innerHTML=t;}
}
function svg(body,label){return `<svg viewBox="0 0 480 280" role="img" aria-label="${esc(label)}">${body}</svg>`;}
/* 선 그래프: lines=[{data:[[x,y]],color,dashed}], points=[[x,y,color,r]] */
function plot({lines=[],points=[],xmin=0,xmax=1,ymin=0,ymax=1,xlabel='x',ylabel='y',label}){
 const L=52,W=400,x=v=>L+(v-xmin)/(xmax-xmin)*W,y=v=>235-(v-ymin)/(ymax-ymin)*210,cl=v=>Math.max(-1000,Math.min(1000,v));
 let out='';
 for(let i=0;i<=4;i++){const xx=L+i*W/4,yy=25+i*52.5;out+=`<path d="M${xx} 25V235M${L} ${yy}H${L+W}" stroke="var(--line)" stroke-width=".6"/><text x="${xx}" y="254" text-anchor="middle">${fmt(xmin+(xmax-xmin)*i/4,1)}</text><text x="${L-8}" y="${yy+4}" text-anchor="end">${fmt(ymax-(ymax-ymin)*i/4,1)}</text>`;}
 const id='clip'+Math.random().toString(36).slice(2);
 out+=`<defs><clipPath id="${id}"><rect x="${L}" y="25" width="${W}" height="210"/></clipPath></defs><g clip-path="url(#${id})">`;
 for(const l of lines)out+=`<polyline points="${l.data.map(([a,b])=>`${x(a)},${cl(y(b))}`).join(' ')}" fill="none" stroke="${l.color||'var(--accent)'}" stroke-width="2.5"${l.dashed?' stroke-dasharray="6 5"':''}/>`;
 out+=points.map(p=>`<circle cx="${x(p[0])}" cy="${cl(y(p[1]))}" r="${p[3]||5}" fill="${p[2]||'var(--orange)'}"/>`).join('');
 return svg(`${out}</g><text x="${L+W}" y="274" text-anchor="end">${esc(xlabel)}</text><text x="8" y="14">${esc(ylabel)}</text>`,label||`${xlabel}에 따른 ${ylabel}. 숫자 결과는 아래 결과 문장에 있습니다.`);
}
/* 막대: 데스크톱은 SVG, 760px 이하는 HTML 막대로 바꿔 글자가 작아지지 않게 한다. */
function bars(labels,values,unit='',limit=null,digits=2){
 const max=Math.max(...values.map(Math.abs),limit||0,1e-9),left=130,width=260,n=labels.length,step=Math.min(52,230/n),h=Math.min(28,step-8);
 const body=values.map((v,i)=>{const yy=20+i*step;return `<text x="8" y="${yy+h*.7}">${esc(labels[i])}</text><rect x="${left}" y="${yy}" width="${width}" height="${h}" rx="3" fill="var(--panel2)"/><rect x="${left}" y="${yy}" width="${Math.abs(v)/max*width}" height="${h}" rx="3" fill="${i%2?'var(--blue)':'var(--accent)'}"/><text x="400" y="${yy+h*.7}">${fmt(v,digits)}</text>`;}).join('');
 const cap=limit===null?'':`<path d="M${left+limit/max*width} 10V250" stroke="var(--orange)" stroke-width="2" stroke-dasharray="5 4"/>`;
 const desktop=svg(body+cap+`<text x="12" y="272">${esc(unit)}</text>`,labels.map((l,i)=>`${l} ${fmt(values[i],digits)} ${unit}`).join(', '));
 const mobile=`<div class="mobile-bars">${labels.map((l,i)=>`<div class="mobile-bar"><div><b>${esc(l)}</b><span>${fmt(values[i],digits)} ${esc(unit)}</span></div><div class="mobile-track"><i style="width:${Math.abs(values[i])/max*100}%;background:${i%2?'var(--blue)':'var(--accent)'}"></i>${limit===null?'':`<em style="left:${limit/max*100}%"></em>`}</div></div>`).join('')}</div>`;
 return `<div class="responsive-bars">${desktop}${mobile}</div>`;
}
/* 단계 카드: items=[[제목,설명]], active=현재 단계 */
function cards(items,active){return `<div class="stage-grid">${items.map((x,i)=>`<div class="stage ${i===active?'current':''}"><span>${String(i+1).padStart(2,'0')}${i===active?' · 현재':''}</span><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}</div>`;}
/* 숫자 격자: values=2차원 배열, 값 크기를 밝기로 보이고 숫자도 함께 적는다. */
function grid(values,label,digits=2,highlight=null){const n=values[0].length,flat=values.flat(),m=Math.max(...flat.map(Math.abs),1e-9);return `<div class="kit-grid" role="img" aria-label="${esc(label)}" style="grid-template-columns:repeat(${n},minmax(0,1fr))">${values.map((row,r)=>row.map((v,c)=>`<span class="${highlight&&highlight[0]===r&&highlight[1]===c?'on':''}" style="--a:${(Math.abs(v)/m).toFixed(3)};--h:${v<0?'var(--orange)':'var(--accent)'}">${fmt(v,digits)}</span>`).join('')).join('')}</div>`;}
/* 장 카드 썸네일: 장의 thumb 필드(짧은 낱말 3개)를 세 칸 흐름으로 그린다. */
function thumbnail(c,i){
 const colors=['var(--accent)','var(--blue)','var(--orange)'],labels=c.thumb||c.flow.slice(0,3).map(x=>x.split('|')[0]),bar=[70,45,25];
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${labels.map((s,k)=>`<rect x="${8+k*99}" y="18" width="86" height="62" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><rect x="${16+k*99}" y="67" width="${bar[(k+i)%3]}" height="3" fill="${colors[k]}"/><text x="${51+k*99}" y="51" text-anchor="middle" fill="var(--text)" font-size="${String(s).length>5?12:15}">${esc(s)}</text>`).join('')}${labels.slice(1).map((_,k)=>`<path d="M${94+k*99} 49h13" stroke="var(--muted)"/>`).join('')}</svg>`;
}

/* ---- 3차원 곡면 ----
   surface({f,win,yaw,pitch,n,lines,dots,polys,labels,label}) → SVG 문자열.
   f(x,y)는 높이, win은 {x:[a,b],y:[a,b],z:[lo,hi]}. 곡면은 n×n 사각형으로 나눠 먼 것부터 그리고, 높이를 열 단계 색띠로 칠한다
   (낮은 곳 파랑, 높은 곳 주황). 위에서 보면(pitch 90) 색띠의 경계가 등고선이 된다.
   lines=[{pts:[[x,y,z]],color,width,dash}], dots=[[x,y,z,color,r]], polys=[{pts,fill,opacity}], labels=[[x,y,z,글]] */
const M3=DXMath;
function surfaceBody(o){
 const win=o.win||M3.WINDOW,n=o.n||20,yaw=o.yaw,pitch=o.pitch,lift=o.frame&&o.frame.cy?0:44*Math.max(0,(pitch-45)/45),P=(x,y,z)=>{const [u,v,t]=M3.unit(x,y,z,win),q=M3.project(u,v,t,yaw,pitch,o.frame);q.y-=lift;return q;};
 const xs=i=>win.x[0]+(win.x[1]-win.x[0])*i/n,ys=j=>win.y[0]+(win.y[1]-win.y[0])*j/n,quads=[];
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){
  const c=[[xs(i),ys(j)],[xs(i+1),ys(j)],[xs(i+1),ys(j+1)],[xs(i),ys(j+1)]].map(([x,y])=>P(x,y,o.f(x,y)));
  const zc=o.f(xs(i+.5),ys(j+.5)),t=Math.max(0,Math.min(1,(zc-win.z[0])/(win.z[1]-win.z[0])));
  quads.push({d:c.reduce((s,p)=>s+p.depth,0)/4,pts:c.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),band:Math.min(9,Math.floor(t*10))});
 }
 quads.sort((a,b)=>a.d-b.d);
 let out=quads.map(q=>`<polygon points="${q.pts}" style="fill:color-mix(in srgb,var(--orange) ${q.band*11}%,var(--blue))" fill-opacity=".78" stroke="var(--bg)" stroke-width=".5"/>`).join('');
 const z0=win.z[0],c=[[win.x[0],win.y[0]],[win.x[1],win.y[0]],[win.x[1],win.y[1]],[win.x[0],win.y[1]]].map(([x,y])=>P(x,y,z0));
 out=`<polygon points="${c.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}" fill="none" stroke="var(--line)" stroke-width="1.5"/>`+out;
 for(const g of o.polys||[])out+=`<polygon points="${g.pts.map(p=>{const q=P(...p);return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;}).join(' ')}" fill="${g.fill||'var(--text)'}" fill-opacity="${g.opacity||.14}" stroke="${g.fill||'var(--text)'}" stroke-opacity=".5"/>`;
 for(const l of o.lines||[])out+=`<polyline points="${l.pts.map(p=>{const q=P(...p);return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;}).join(' ')}" fill="none" stroke="${l.color||'var(--text)'}" stroke-width="${l.width||3}" stroke-linecap="round" stroke-linejoin="round"${l.dash?` stroke-dasharray="${l.dash}"`:''}${l.cls?` class="${l.cls}"`:''}/>`;
 for(const d of o.dots||[]){const q=P(d[0],d[1],d[2]);out+=`<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${d[4]||6}" fill="${d[3]||'var(--text)'}" stroke="var(--bg)" stroke-width="1.5"/>`;}
 /* 축 이름과 양 끝의 값: 바닥 모서리 바깥쪽에 적는다. 돌려도 어느 쪽이 큰 값인지 숫자로 읽을 수 있다. */
 const mid=(a,b)=>(a+b)/2,ax=o.axes||['x','y','z'],lab=(q,s,dx=0,dy=0)=>`<text x="${(q.x+dx).toFixed(1)}" y="${(q.y+dy).toFixed(1)}" text-anchor="middle" font-size="13" fill="var(--muted)">${esc(s)}</text>`;
 const ex=P(mid(...win.x),win.y[0],z0),ey=P(win.x[0],mid(...win.y),z0),cc=P(mid(...win.x),mid(...win.y),z0),push=(q)=>{const dx=q.x-cc.x,dy=q.y-cc.y,m=Math.hypot(dx,dy)||1;return [dx/m*18,dy/m*18+4];};
 const ends=(q0,q1,vals,off)=>lab(q0,String(vals[0]),off[0]*.8,off[1]*.8)+lab(q1,String(vals[1]),off[0]*.8,off[1]*.8),px=push(ex),py=push(ey);
 out+=lab(ex,ax[0],...px)+lab(ey,ax[1],...py)+ends(P(win.x[0]+(win.x[1]-win.x[0])*.06,win.y[0],z0),P(win.x[1]-(win.x[1]-win.x[0])*.06,win.y[0],z0),win.x,px)+ends(P(win.x[0],win.y[0]+(win.y[1]-win.y[0])*.06,z0),P(win.x[0],win.y[1]-(win.y[1]-win.y[0])*.06,z0),win.y,py);
 if(pitch<80){const top=P(win.x[0],win.y[1],win.z[1]),base=P(win.x[0],win.y[1],z0);out+=`<path d="M${base.x.toFixed(1)} ${base.y.toFixed(1)}L${top.x.toFixed(1)} ${top.y.toFixed(1)}" stroke="var(--line)" stroke-width="1.5"/>`+lab(top,`${ax[2]} ↑`,0,-8);}
 for(const t of o.labels||[]){const q=P(t[0],t[1],t[2]);out+=`<text x="${q.x.toFixed(1)}" y="${(q.y-10).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="${t[4]||'var(--text)'}" stroke="var(--bg)" stroke-width="3" paint-order="stroke">${esc(t[3])}</text>`;}
 return out;
}
function surface(o){return `<svg viewBox="0 0 480 320" role="img" aria-label="${esc(o.label)}">${surfaceBody(o)}</svg>`;}
/* 돌려 보는 그림 틀: 그림(끌기·방향키)과 단추. 같은 내용은 실험의 결과 문장에 숫자로 적는다. */
const START={yaw:-35,pitch:28};
function view(el,start){return el._v||(el._v={...(start||START),start:start||START});}
function stage(svgText,v){
 const top=v.pitch>=89;
 return `<div class="s3d"><div class="s3d-art" tabindex="0" role="group" aria-label="3차원 그림. 좌우로 끌거나 방향키로 돌릴 수 있습니다. 같은 내용은 아래 결과 문장에 숫자로 있습니다.">${svgText}</div><div class="s3d-tools" role="group" aria-label="3차원 그림 돌리기"><button type="button" data-turn="-20">← 돌리기</button><button type="button" data-turn="20">돌리기 →</button><button type="button" data-view="top" aria-pressed="${top}">위에서 보기</button><button type="button" data-view="start">처음 각도</button><button type="button" data-spin aria-pressed="${!!v.spin}">${v.spin?'멈추기':'천천히 돌리기'}</button></div></div>`;
}
/* 실험 상자 el에 돌리기 조작을 한 번만 건다. 다시 그릴 때는 el._redraw()를 부른다. */
function turnable(el,redraw,start){
 el._redraw=redraw;view(el,start);if(el._s3)return;el._s3=true;let drag=null;
 const again=sel=>{el._redraw();const t=sel&&el.querySelector(sel);if(t)t.focus({preventScroll:true});};
 const stop=()=>{clearInterval(el._spin);el._spin=null;if(el._v)el._v.spin=false;};
 el.addEventListener('pointerdown',e=>{if(!e.target.closest('.s3d-art'))return;drag={x:e.clientX,y:e.clientY};});
 el.addEventListener('pointermove',e=>{if(!drag)return;const v=view(el);v.yaw+=(e.clientX-drag.x)*.6;v.pitch=Math.max(8,Math.min(90,v.pitch+(e.clientY-drag.y)*.4));drag={x:e.clientX,y:e.clientY};el._redraw();});
 ['pointerup','pointercancel','pointerleave'].forEach(n=>el.addEventListener(n,()=>{drag=null;}));
 el.addEventListener('keydown',e=>{if(!e.target.classList||!e.target.classList.contains('s3d-art'))return;const v=view(el),k={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,8],ArrowDown:[0,-8]}[e.key];if(!k)return;e.preventDefault();v.yaw+=k[0];v.pitch=Math.max(8,Math.min(90,v.pitch+k[1]));again('.s3d-art');});
 el.addEventListener('click',e=>{const b=e.target.closest('.s3d-tools button');if(!b)return;const v=view(el);
  if(b.dataset.turn){v.yaw+=Number(b.dataset.turn);again(`[data-turn="${b.dataset.turn}"]`);}
  else if(b.dataset.view==='top'){stop();v.yaw=0;v.pitch=90;again('[data-view=top]');}
  else if(b.dataset.view==='start'){stop();v.yaw=v.start.yaw;v.pitch=v.start.pitch;again('[data-view=start]');}
  else if(b.hasAttribute('data-spin')){if(el._spin)stop();else{v.spin=true;if(v.pitch>80)v.pitch=28;el._spin=setInterval(()=>{if(!document.body.contains(el)){clearInterval(el._spin);return;}view(el).yaw+=1.2;el._redraw();},70);}again('[data-spin]');}
 });
}
return {esc,fmt,josa,paren,value,text,range,select,setup,bind,result,svg,plot,bars,cards,grid,thumbnail,surface,surfaceBody,view,stage,turnable};
})();
