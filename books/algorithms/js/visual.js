/* 실험 공통 화면 부품: 조작부, 결과 상자, 막대·선 차트, 장 카드 썸네일. 계산은 하지 않는다. */
window.ALLabs={};
window.ALUI=(()=>{
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const int=n=>Math.round(n).toLocaleString('en-US');
/* 큰 수를 한국어 단위로 읽기 쉽게: 12,345 → 1.2만, 3,500,000 → 350만, 1.2e8 → 1.2억 */
function big(n){const a=Math.abs(n);if(a>=1e8)return fmt(n/1e8,a>=1e9?0:1)+'억';if(a>=1e4)return fmt(n/1e4,a>=1e5?0:1)+'만';return a>=100||Number.isInteger(n)?int(n):fmt(n,1);}
const value=(el,id)=>Number(el.querySelector('#'+id).value);
function range(id,label,min,max,step,v){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;}
function select(id,label,options,v){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${key}" ${String(key)===String(v)?'selected':''}>${text}</option>`).join('')}</select></label>`;}
function text(id,label,v){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="text" value="${esc(v)}" autocomplete="off"></label>`;}
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart"></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
/* 슬라이더 옆 숫자는 기본으로 값 그대로, data-show 함수가 있으면 그 글로 보여 준다. */
function bind(el,fn,show={}){const update=()=>{el.querySelectorAll('input[type=range]').forEach(x=>el.querySelector('#'+x.id+'-value').textContent=show[x.id]?show[x.id](Number(x.value)):x.value);fn();};el.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',update));update();}
function result(el,chart,html){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=html;}
function svg(body,label,h=280){return `<svg viewBox="0 0 480 ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;}
/* 가로 막대. log=true면 로그 눈금(1부터)으로 그려 1과 100만을 한 화면에 둔다. */
function bars(labels,values,unit='단계',opt={}){
 const {log=false,colors=null,digits=0}=opt,scale=v=>log?Math.log10(Math.max(v,1)):v,max=Math.max(...values.map(scale),log?1:.01),left=150,width=230;
 const gap=Math.min(52,240/values.length),bh=Math.min(28,gap-8),col=i=>colors?colors[i]:(i%2?'var(--blue)':'var(--accent)');
 const body=values.map((v,i)=>{const y=18+i*gap,w=Math.max(scale(v)/max*width,2);return `<text x="8" y="${y+bh/2+5}">${esc(labels[i])}</text><rect x="${left}" y="${y}" width="${width}" height="${bh}" rx="3" fill="var(--panel2)"/><rect x="${left}" y="${y}" width="${w}" height="${bh}" rx="3" fill="${col(i)}"/><text x="${left+width+8}" y="${y+bh/2+5}">${esc(digits?fmt(v,digits):big(v))}</text>`;}).join('');
 const label=labels.map((l,i)=>`${l} ${digits?fmt(values[i],digits):int(values[i])} ${unit}`).join(', ');
 const desktop=svg(body+`<text x="8" y="272">${esc(unit)}${log?' · 로그 눈금 (한 칸에 10배)':''}</text>`,label);
 const mobile=`<div class="mobile-bars">${labels.map((l,i)=>`<div class="mobile-bar"><div><b>${esc(l)}</b><span>${esc(digits?fmt(values[i],digits):big(values[i]))} ${esc(unit)}</span></div><div class="mobile-track"><i style="width:${Math.max(scale(values[i])/max*100,1)}%;background:${col(i)}"></i></div></div>`).join('')}${log?'<p class="caption">로그 눈금: 막대 한 칸이 10배입니다.</p>':''}</div>`;
 return `<div class="responsive-bars">${desktop}${mobile}</div>`;
}
/* 선 차트: series=[{name,points:[[x,y]],color,dash}] — 축은 0부터. */
function lines(series,xLabel,yLabel,label,opt={}){
 const W=480,H=280,L=58,R=18,T=18,B=46,all=series.flatMap(s=>s.points),xm=Math.max(...all.map(p=>p[0]),1),ym=opt.ymax||Math.max(...all.map(p=>p[1]),1);
 const X=x=>L+x/xm*(W-L-R),Y=y=>H-B-Math.min(y,ym)/ym*(H-T-B);
 let b=`<path d="M${L} ${T}V${H-B}H${W-R}" fill="none" stroke="var(--line)"/>`;
 for(let k=0;k<=4;k++){const y=ym*k/4;b+=`<path d="M${L} ${Y(y)}H${W-R}" stroke="var(--line)" stroke-dasharray="2 4"/><text x="${L-6}" y="${Y(y)+4}" text-anchor="end">${esc(big(y))}</text>`;}
 b+=`<text x="${L}" y="${H-B+18}">0</text><text x="${W-R}" y="${H-B+18}" text-anchor="end">${esc(big(xm))}</text><text x="${(L+W-R)/2}" y="${H-8}" text-anchor="middle">${esc(xLabel)}</text><text x="10" y="12">${esc(yLabel)}</text>`;
 series.forEach((s,i)=>{const d=s.points.map((p,k)=>`${k?'L':'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('');b+=`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.dash?2:3}" ${s.dash?'stroke-dasharray="6 5"':''}/>`;
  b+=`<rect x="${L+10}" y="${T+4+i*20}" width="14" height="4" fill="${s.color}"/><text x="${L+30}" y="${T+10+i*20}">${esc(s.name)}</text>`;});
 if(opt.mark)b+=`<circle cx="${X(opt.mark[0])}" cy="${Y(opt.mark[1])}" r="6" fill="var(--orange)"/>`;
 return svg(b,label);
}
function thumbnail(i){
 const sets=[['n','n²','log n'],['[ ]','→','LIFO'],['5 2 8','÷2','2 5 8'],['?','½','트리'],['키','#','칸'],['★','힙','10'],['본관','→','이웃'],['4분','+','최단'],['새','→','세'],['낱말','→','목록'],['1만','→','100만']][i];
 const colors=['var(--accent)','var(--blue)','var(--orange)'],widths=[70,45,25];
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${sets.map((s,k)=>`<rect x="${8+k*99}" y="18" width="86" height="62" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><rect x="${16+k*99}" y="67" width="${widths[(k+i)%3]}" height="3" fill="${colors[k]}"/><text x="${51+k*99}" y="51" text-anchor="middle" fill="var(--text)" font-size="${s.length>3?13:16}">${s}</text>`).join('')}</svg>`;
}
return {esc,fmt,int,big,value,range,select,text,setup,bind,result,svg,bars,lines,thumbnail};
})();
