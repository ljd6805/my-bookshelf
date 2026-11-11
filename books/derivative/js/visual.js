/* 공통 실험 UI와 SVG 그래프. 계산은 하지 않고 그리기만 한다(계산은 DVMath).
   따라갈 양: 이 책의 모든 그림에서 기울기(접선·할선)는 주황 선, 원래 함수는 강조색 실선, 도함수는 파란 선으로 그린다. */
window.DVLabs={};
window.DVUI=(()=>{
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* 음수는 −(U+2212)로 적고, 정의되지 않는 값은 글로 적는다. */
const fmt=(n,d=2)=>Number.isFinite(n)?(Math.abs(n)<0.5*10**-d?0:n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}).replace('-','−'):'정의되지 않음';
const value=(el,id)=>Number(el.querySelector('#'+id).value);
const text=(el,id)=>el.querySelector('#'+id).value;
const on=(el,id)=>el.querySelector('#'+id).checked;
function range(id,label,min,max,step,v){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;}
function select(id,label,options,v){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,t])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;}
function check(id,label,checked=false){return `<label class="check" for="${id}"><input id="${id}" type="checkbox" ${checked?'checked':''}><span>${label}</span></label>`;}
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart"></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
function bind(el,fn){const update=()=>{el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=x.value;});fn();};el.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',update));update();}
function result(el,chart,t){if(chart!==null)el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=t;}
function sample(f,a,b,n=120){const out=[];for(let i=0;i<=n;i++){const x=a+(b-a)*i/n,y=f(x);if(Number.isFinite(y))out.push([x,y]);}return out;}
/* 함수 그래프. curves=[{f,color,dash,width,from,to}], segs=[{a,b,color,dash,width}], pts=[[x,y,color,r]], notes=[[x,y,글,color]] */
function graph({xmin,xmax,ymin,ymax,curves=[],segs=[],pts=[],notes=[],xlabel='x',ylabel='y',label,h=280}){
 const L=56,W=400,T=30,B=h-44,dx=xmax-xmin>=40?0:xmax-xmin>=1?1:xmax-xmin>=0.1?2:4,dy=ymax-ymin>=40?0:ymax-ymin>=1?1:ymax-ymin>=0.1?2:4,X=v=>L+(v-xmin)/(xmax-xmin)*W,Y=v=>B-(v-ymin)/(ymax-ymin)*(B-T),cl=v=>Math.max(-2000,Math.min(2000,v));
 const id='dvc'+Math.random().toString(36).slice(2);let out='';
 for(let i=0;i<=4;i++){const xx=L+i*W/4,yy=T+i*(B-T)/4;out+=`<path d="M${xx} ${T}V${B}M${L} ${yy}H${L+W}" stroke="var(--line)" stroke-width=".6"/><text x="${xx}" y="${B+17}" text-anchor="middle">${fmt(xmin+(xmax-xmin)*i/4,dx)}</text><text x="${L-7}" y="${yy+4}" text-anchor="end">${fmt(ymax-(ymax-ymin)*i/4,dy)}</text>`;}
 if(ymin<0&&ymax>0)out+=`<path d="M${L} ${Y(0)}H${L+W}" stroke="var(--muted)" stroke-width="1"/>`;
 if(xmin<0&&xmax>0)out+=`<path d="M${X(0)} ${T}V${B}" stroke="var(--muted)" stroke-width="1"/>`;
 out+=`<defs><clipPath id="${id}"><rect x="${L}" y="${T}" width="${W}" height="${B-T}"/></clipPath></defs><g clip-path="url(#${id})">`;
 for(const c of curves){const p=sample(c.f,c.from??xmin,c.to??xmax);if(p.length>1)out+=`<polyline points="${p.map(([a,b])=>`${X(a).toFixed(1)},${cl(Y(b)).toFixed(1)}`).join(' ')}" fill="none" stroke="${c.color||'var(--accent)'}" stroke-width="${c.width||2.6}"${c.dash?' stroke-dasharray="6 5"':''}/>`;}
 for(const s of segs)out+=`<path d="M${X(s.a[0]).toFixed(1)} ${cl(Y(s.a[1])).toFixed(1)}L${X(s.b[0]).toFixed(1)} ${cl(Y(s.b[1])).toFixed(1)}" stroke="${s.color||'var(--orange)'}" stroke-width="${s.width||2.4}"${s.dash?' stroke-dasharray="5 4"':''} fill="none"/>`;
 out+=pts.map(p=>`<circle cx="${X(p[0]).toFixed(1)}" cy="${cl(Y(p[1])).toFixed(1)}" r="${p[3]||5}" fill="${p[2]||'var(--orange)'}" stroke="var(--bg)"/>`).join('')+'</g>';
 out+=notes.map(n=>`<text x="${Math.min(L+W-4,Math.max(L+4,X(n[0]))).toFixed(1)}" y="${Math.min(B-4,Math.max(T+12,Y(n[1]))).toFixed(1)}" fill="${n[3]||'var(--text)'}" text-anchor="${n[4]||'start'}">${esc(n[2])}</text>`).join('');
 return `<svg viewBox="0 0 480 ${h}" role="img" aria-label="${esc(label||`${xlabel}에 따른 ${ylabel} 그래프. 숫자는 아래 결과 문장에 있습니다.`)}">${out}<text x="${L+W}" y="${h-6}" text-anchor="end">${esc(xlabel)}</text><text x="8" y="14">${esc(ylabel)}</text></svg>`;
}
/* 선분 (x0,y0)을 지나고 기울기 m인 직선을 화면 가로 범위만큼 그릴 두 끝점 */
function lineThrough(x0,y0,m,xmin,xmax){return {a:[xmin,y0+m*(xmin-x0)],b:[xmax,y0+m*(xmax-x0)]};}
function legend(items){return `<p class="dv-legend">${items.map(([c,t,dash])=>`<span><i style="background:${dash?`repeating-linear-gradient(90deg,${c} 0 5px,transparent 5px 8px)`:c}"></i>${esc(t)}</span>`).join('')}</p>`;}
function table(head,rows,mark=()=>false){return `<div class="dv-scroll"><table class="dv-table"><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr class="${mark(i)?'on':''}">${r.map((c,j)=>`<td${j?' class="num"':''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
/* 장 카드 썸네일: 장의 thumb 필드(짧은 낱말 3개)를 세 칸 흐름으로 그린다. */
function thumbnail(c,i){
 const colors=['var(--accent)','var(--orange)','var(--blue)'],bar=[70,45,25];
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${c.thumb.map((s,k)=>`<rect x="${8+k*99}" y="18" width="86" height="62" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><rect x="${16+k*99}" y="67" width="${bar[(k+i)%3]}" height="3" fill="${colors[k]}"/><text x="${51+k*99}" y="51" text-anchor="middle" fill="var(--text)" font-size="${String(s).length>5?12:15}">${esc(s)}</text>`).join('')}${c.thumb.slice(1).map((_,k)=>`<path d="M${94+k*99} 49h13" stroke="var(--muted)"/>`).join('')}</svg>`;
}
const reduced=()=>document.documentElement.dataset.motion==='reduce'||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
/* 슬라이더 값을 to까지 차례로 옮기며 input 이벤트를 보낸다(재생 단추). 동작 줄이기에서는 마지막 값으로 바로 간다. */
function play(input,to,ms=1800){
 const from=Number(input.value),step=Number(input.step)||1,set=v=>{input.value=Math.round(v/step)*step;input.dispatchEvent(new Event('input',{bubbles:true}));};
 if(reduced()||from===to){set(to);return;}
 const t0=performance.now();
 (function tick(now){if(!input.isConnected)return;const k=Math.min(1,(now-t0)/ms);set(from+(to-from)*k);if(k<1)requestAnimationFrame(tick);else set(to);})(t0);
}
return {esc,fmt,value,text,on,range,select,check,setup,bind,result,sample,graph,lineThrough,legend,table,thumbnail,play,reduced};
})();
