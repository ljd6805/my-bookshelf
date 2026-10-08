/* 공통 실험 UI와 SVG 차트(AI Book·LLM 시스템 책의 형식). 계산은 하지 않고 그리기만 한다. */
window.A15Labs={};
window.A15UI=(()=>{
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number.isFinite(n)?n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}):'정의되지 않음';
const value=(el,id)=>Number(el.querySelector('#'+id).value);
const text=(el,id)=>el.querySelector('#'+id).value;
function range(id,label,min,max,step,v){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;}
function select(id,label,options,v){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,t])=>`<option value="${key}" ${String(key)===String(v)?'selected':''}>${t}</option>`).join('')}</select></label>`;}
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart"></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
function bind(el,fn){const update=()=>{el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=x.value;});fn();};el.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',update));update();}
function result(el,chart,t){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=t;}
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
/* 상태 목록(HTML): items=[[이름, 상태 글자, 값 글자, 좋음?]]. 색과 함께 상태 글자로도 구분하고 좁은 화면에서도 글자가 줄지 않는다. */
function rows(items,label,title=''){
 return `<div class="a15-rows" role="group" aria-label="${esc(label)}">${title?`<b class="a15-rows-title">${esc(title)}</b>`:''}${items.map(([name,state,val,good])=>`<div class="a15-row ${good?'good':'bad'}"><span>${esc(name)}</span><b>${esc(state)}</b><small>${esc(val)}</small></div>`).join('')}</div>`;
}
return {esc,fmt,value,text,range,select,setup,bind,result,svg,plot,bars,cards,grid,thumbnail,rows};
})();
