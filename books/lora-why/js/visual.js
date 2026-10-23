window.LWLabs={};
window.LWUI=(()=>{
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const int=n=>Math.round(n).toLocaleString('en-US');
const pct=(p,d=1)=>`${fmt(p*100,d)}%`;
const value=(el,id)=>Number(el.querySelector('#'+id).value);
function range(id,label,min,max,step,v){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;}
function select(id,label,options,v){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;}
function check(id,label,on=false){return `<label class="check" for="${id}"><input id="${id}" type="checkbox" ${on?'checked':''}><span>${label}</span></label>`;}
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart"></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
function bind(el,fn){const update=()=>{el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=x.value;});fn();};el.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',update));update();}
function result(el,chart,textHtml){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=textHtml;}
/* 가로 막대: 데스크톱은 SVG, 좁은 화면은 같은 값을 HTML 막대로 보여 준다. mark(i)가 참이면 ✓와 강조색, limit가 있으면 점선으로 한도를 그린다. */
function bars(labels,values,{unit='',digits=2,max=null,mark=()=>false,limit=null,limitLabel='',show=null}={}){
 const top=Math.max(max??0,...values,limit??0,1e-9),left=110,width=250,gap=Math.max(22,Math.min(40,232/values.length)),bh=Math.min(24,gap-7),h=Math.max(120,28+values.length*gap);
 const text=i=>show?show(values[i],i):`${fmt(values[i],digits)}${unit}`;
 const body=values.map((v,i)=>{const y=16+i*gap,w=Math.max(v,0)/top*width,c=mark(i)?'var(--accent)':'var(--blue)';return `<text x="8" y="${y+bh/2+5}">${esc(labels[i])}${mark(i)?' ✓':''}</text><rect x="${left}" y="${y}" width="${width}" height="${bh}" rx="3" fill="var(--panel2)"/><rect x="${left}" y="${y}" width="${Math.max(w,1)}" height="${bh}" rx="3" fill="${c}"/><text x="${left+width+8}" y="${y+bh/2+5}">${esc(text(i))}</text>`;}).join('');
 const lim=limit==null?'':`<path d="M${left+limit/top*width} 8V${h-6}" stroke="var(--orange)" stroke-width="2" stroke-dasharray="5 4"/><text x="${Math.min(left+limit/top*width+4,400)}" y="${h-4}" fill="var(--orange)">${esc(limitLabel)}</text>`;
 const desk=`<svg viewBox="0 0 480 ${h}" role="img" aria-label="${esc(labels.map((l,i)=>`${l} ${text(i)}`).join(', ')+(limit!=null?`, 한도 ${limitLabel}`:''))}">${body}${lim}</svg>`;
 const mob=`<div class="mobile-bars">${labels.map((l,i)=>`<div class="mobile-bar"><div><b>${esc(l)}${mark(i)?' ✓':''}</b><span>${esc(text(i))}</span></div><div class="mobile-track"><i style="width:${Math.max(values[i],0)/top*100}%;background:${mark(i)?'var(--accent)':'var(--blue)'}"></i></div></div>`).join('')}${limit!=null?`<p class="caption">점선 한도: ${esc(limitLabel)}</p>`:''}</div>`;
 return `<div class="responsive-bars">${desk}${mob}</div>`;
}
/* 선 그래프: series = [{name, pts:[[x,y]], color, dash}]. x·y 범위는 자료에서 정하거나 옵션으로 준다. */
function lines(series,{xLabel='',yLabel='',yMax=null,yMin=0,xMax=null,logX=false,hline=null,hlineLabel=''}={}){
 const all=series.flatMap(s=>s.pts),X0=Math.min(...all.map(p=>p[0])),X1=xMax??Math.max(...all.map(p=>p[0])),Y1=yMax??Math.max(...all.map(p=>p[1]),1e-9);
 const L=52,R=464,Tp=28,B=236,fx=x=>logX?L+(Math.log2(x)-Math.log2(Math.max(X0,1)))/(Math.log2(X1)-Math.log2(Math.max(X0,1))||1)*(R-L):L+(x-X0)/((X1-X0)||1)*(R-L),fy=y=>B-(Math.min(y,Y1)-yMin)/((Y1-yMin)||1)*(B-Tp);
 const grid=[0,0.25,0.5,0.75,1].map(t=>{const y=yMin+t*(Y1-yMin);return `<path class="axis" d="M${L} ${fy(y)}H${R}" stroke-dasharray="2 4"/><text x="${L-6}" y="${fy(y)+4}" text-anchor="end">${fmt(y,Y1-yMin<2?2:0)}</text>`;}).join('');
 const paths=series.map(s=>(s.pts.length>1&&!s.only?`<path d="${s.pts.map((p,i)=>`${i?'L':'M'}${fx(p[0]).toFixed(1)} ${fy(p[1]).toFixed(1)}`).join('')}" fill="none" stroke="${s.color}" stroke-width="${s.width||2.4}" ${s.dash?'stroke-dasharray="6 4"':''}/>`:'')+(s.dots?s.pts.map(p=>`<circle cx="${fx(p[0]).toFixed(1)}" cy="${fy(p[1]).toFixed(1)}" r="${s.dots}" fill="${s.color}"/>`).join(''):'')).join('');
 const h=hline==null?'':`<path d="M${L} ${fy(hline)}H${R}" stroke="var(--orange)" stroke-dasharray="5 4" stroke-width="1.6"/><text x="${R}" y="${fy(hline)-5}" text-anchor="end" fill="var(--orange)">${esc(hlineLabel)}</text>`;
 const label=series.map(s=>`${s.name}: ${s.pts.length>6?`처음 ${fmt(s.pts[0][1],3)}, 끝 ${fmt(s.pts.at(-1)[1],3)}`:s.pts.map(p=>`${p[0]}→${fmt(p[1],3)}`).join(', ')}`).join('. ');
 return `<svg viewBox="0 0 480 270" role="img" aria-label="${esc(`${yLabel} 그래프. ${label}`)}">${grid}<path class="axis" d="M${L} ${B}H${R}M${L} ${Tp}V${B}"/>${paths}${h}<text x="${(L+R)/2}" y="262" text-anchor="middle">${esc(xLabel)}</text><text x="${L}" y="16">${esc(yLabel)}</text><text x="${L}" y="${B+16}" text-anchor="middle">${+(+X0).toFixed(1)}</text><text x="${R}" y="${B+16}" text-anchor="end">${+(+X1).toFixed(1)}</text></svg><p class="lw-legend">${series.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</p>`;
}
function table(head,rows,on=()=>false){return `<table class="lw-table"><thead><tr>${head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr class="${on(i)?'on':''}">${r.map((c,j)=>`<td class="${j&&/^[-−\d.,%×]+[A-Za-z%]*$/.test(String(c))?'num':''}">${esc(c)}${j===0&&on(i)?' ✓':''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
/* 행렬 칸 그림: 값의 크기를 진하기로, 부호를 색으로. 숫자 대신 칸 모양을 보는 그림이다. */
function grid(M,{cell=12,label='행렬'}={}){
 const top=Math.max(...M.flat().map(Math.abs),1e-9),n=M.length,m=M[0].length;
 const cells=M.map((row,i)=>row.map((v,j)=>`<rect x="${j*cell}" y="${i*cell}" width="${cell-1}" height="${cell-1}" fill="${v<0?'var(--orange)':'var(--accent)'}" fill-opacity="${Math.min(1,Math.abs(v)/top).toFixed(3)}"/>`).join('')).join('');
 return `<svg viewBox="0 0 ${m*cell} ${n*cell}" width="${m*cell}" height="${n*cell}" role="img" aria-label="${esc(label)}">${cells}</svg>`;
}
function thumbnail(i){
 const sets=[['W₀','W₁','ΔW'],['σ₁','σ₂','σ₃'],['δ','xᵀ','합'],['계열','평균','남은 변화'],['d','90%','r'],['B=0','A','방향'],['r','=16','같음'],['φ','r=2','r=8'],['에너지','성능','꼬리'],['자료','잡음','r'],['말투','새 능력','r'],['시험','σ','r 결정']][i]||['?','?','?'];
 const colors=['var(--accent)','var(--blue)','var(--orange)'],bars=[70,45,25];
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${sets.map((s,k)=>`<rect x="${8+k*99}" y="18" width="86" height="62" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><rect x="${16+k*99}" y="67" width="${bars[(k+i)%3]}" height="3" fill="${colors[k]}"/><text x="${51+k*99}" y="51" text-anchor="middle" fill="var(--text)" font-size="${s.length>3?13:16}">${esc(s)}</text>`).join('')}</svg>`;
}
return {esc,fmt,int,pct,value,range,select,check,setup,bind,result,bars,lines,table,grid,thumbnail};
})();
