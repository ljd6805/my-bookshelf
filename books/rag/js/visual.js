window.RLabs={};
window.RUI=(()=>{
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const value=(el,id)=>Number(el.querySelector('#'+id).value);
function range(id,label,min,max,step,v){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;}
function select(id,label,options,v){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${key}" ${String(key)===String(v)?'selected':''}>${text}</option>`).join('')}</select></label>`;}
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart"></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
function bind(el,fn){const update=()=>{el.querySelectorAll('input[type=range]').forEach(x=>el.querySelector('#'+x.id+'-value').textContent=x.value);fn();};el.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',update));update();}
function result(el,chart,text){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=text;}
function svg(body,label){return `<svg viewBox="0 0 480 280" role="img" aria-label="${esc(label)}">${body}</svg>`;}
function bars(labels,values,unit='점',limit=null,digits=2,colors=null){
 const max=Math.max(...values,limit||0,.01),left=120,width=270;
 const gap=Math.min(52,240/values.length),bh=Math.min(28,gap-8);const body=values.map((v,i)=>{const y=20+i*gap;return `<text x="8" y="${y+bh/2+5}">${esc(labels[i])}</text><rect x="${left}" y="${y}" width="${width}" height="${bh}" rx="3" fill="var(--panel2)"/><rect x="${left}" y="${y}" width="${v/max*width}" height="${bh}" rx="3" fill="${colors?colors[i]:(i%2?'var(--blue)':'var(--accent)')}"/><text x="400" y="${y+bh/2+5}">${fmt(v,digits)}</text>`;}).join('');
 const cap=limit===null?'':`<path d="M${left+limit/max*width} 12V245" stroke="var(--orange)" stroke-width="2" stroke-dasharray="5 4"/>`;
 const desktop=svg(body+cap+`<text x="12" y="271">${esc(unit)}</text>`,labels.map((l,i)=>`${l} ${fmt(values[i])} ${unit}`).join(', '));
 const mobile=`<div class="mobile-bars">${labels.map((l,i)=>`<div class="mobile-bar"><div><b>${esc(l)}</b><span>${fmt(values[i],digits)} ${esc(unit)}</span></div><div class="mobile-track"><i style="width:${values[i]/max*100}%;background:${colors?colors[i]:(i%2?'var(--blue)':'var(--accent)')}"></i>${limit===null?'':`<em style="left:${limit/max*100}%"></em>`}</div></div>`).join('')}${limit===null?'':`<p class="caption">점선: 가용 용량 ${fmt(limit,0)} ${esc(unit)}</p>`}</div>`;
 return `<div class="responsive-bars">${desktop}${mobile}</div>`;
}
function text(id,label,v){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="text" value="${esc(v)}" autocomplete="off"></label>`;}
function questions(id,label,list,v){return select(id,label,list.map((q,i)=>[i,q.text]),v);}
function docs(rows,mark=()=>''){return `<ol class="doc-list">${rows.map(r=>`<li class="${mark(r)}"><b>${r.id}</b> ${esc(r.doc.title)}<span>${fmt(r.score,2)}</span></li>`).join('')}</ol>`;}
function thumbnail(i){
 const sets=[['?','근거','답'],['낱말','→','문서'],['IDF','tf','길이'],['문장','✂','조각'],['축','cos','방향'],['키워드','α','의미'],['P@k','R@k','MRR'],['N개','다시','1위'],['예산','근거','KV'],['문턱','답','보류']][i];
 const colors=['var(--accent)','var(--blue)','var(--orange)'],bars=[70,45,25];
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${sets.map((s,k)=>`<rect x="${8+k*99}" y="18" width="86" height="62" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><rect x="${16+k*99}" y="67" width="${bars[(k+i)%3]}" height="3" fill="${colors[k]}"/><text x="${51+k*99}" y="51" text-anchor="middle" fill="var(--text)" font-size="${s.length>3?13:16}">${s}</text>`).join('')}</svg>`;
}
return {esc,fmt,value,range,select,text,questions,setup,bind,result,svg,bars,docs,thumbnail};
})();
