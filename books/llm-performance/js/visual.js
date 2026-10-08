window.PLabs={};
window.PUI=(()=>{
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
function bars(labels,values,unit='GiB',limit=null){
 const max=Math.max(...values,limit||0,.01),left=120,width=270;
 const body=values.map((v,i)=>{const y=25+i*52;return `<text x="8" y="${y+20}">${esc(labels[i])}</text><rect x="${left}" y="${y}" width="${width}" height="28" rx="3" fill="var(--panel2)"/><rect x="${left}" y="${y}" width="${v/max*width}" height="28" rx="3" fill="${i%2?'var(--blue)':'var(--accent)'}"/><text x="400" y="${y+20}">${fmt(v,1)}</text>`;}).join('');
 const cap=limit===null?'':`<path d="M${left+limit/max*width} 12V245" stroke="var(--orange)" stroke-width="2" stroke-dasharray="5 4"/>`;
 const desktop=svg(body+cap+`<text x="12" y="271">${esc(unit)}</text>`,labels.map((l,i)=>`${l} ${fmt(values[i])} ${unit}`).join(', '));
 const mobile=`<div class="mobile-bars">${labels.map((l,i)=>`<div class="mobile-bar"><div><b>${esc(l)}</b><span>${fmt(values[i],2)} ${esc(unit)}</span></div><div class="mobile-track"><i style="width:${values[i]/max*100}%;background:${i%2?'var(--blue)':'var(--accent)'}"></i>${limit===null?'':`<em style="left:${limit/max*100}%"></em>`}</div></div>`).join('')}${limit===null?'':`<p class="caption">점선: 가용 용량 ${fmt(limit,0)} ${esc(unit)}</p>`}</div>`;
 return `<div class="responsive-bars">${desktop}${mobile}</div>`;
}
function cards(items,active){return `<div class="stage-grid">${items.map((x,i)=>`<div class="stage ${i===active?'current':''}"><span>${String(i+1).padStart(2,'0')}${i===active?' · 현재':''}</span><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}</div>`;}
function matrixTable(A,label,highlight=-1){return `<div class="matrix-block"><b>${label}</b><div class="matrix-grid">${A.flat().map((n,i)=>`<span class="${i===highlight?'selected':''}">${n}</span>`).join('')}</div></div>`;}
function thumbnail(i){
 const colors=['var(--accent)','var(--blue)','var(--orange)'];
 const labels=[['TTFT','ITL','E2E'],['CPU','queue','GPU'],['COPY','OVERLAP','EXEC'],['grid','block','warp'],['lane','address','sector'],['tile','reuse','limit'],['FLOP','byte','ms'],['read','fuse','write'],['token','page','KV'],['queue','batch','done'],['GPU','LINK','GPU'],['time','quality','go?']][i];
 const bars=[70,45,25];
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${labels.map((s,k)=>`<rect x="${8+k*99}" y="18" width="86" height="62" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><rect x="${16+k*99}" y="67" width="${bars[(k+i)%3]}" height="3" fill="${colors[k]}"/><text x="${51+k*99}" y="51" text-anchor="middle" fill="var(--text)" font-size="${s.length>5?12:15}">${s}</text>`).join('')}</svg>`;
}
function timeline(events,labels,total){
 const left=70,width=385,row=190/labels.length;
 const ticks=Array.from({length:5},(_,i)=>`<path d="M${left+i*width/4} 28V232" stroke="var(--line)"/><text x="${left+i*width/4}" y="256" text-anchor="middle">${fmt(i*total/4,0)}</text>`).join('');
 const names=labels.map((l,i)=>`<text x="4" y="${58+i*row}">${esc(l)}</text>`).join('');
 const blocks=events.map(e=>`<rect x="${left+e.start/total*width}" y="${40+e.lane*row}" width="${Math.max(1,(e.end-e.start)/total*width-1)}" height="${Math.min(30,row-5)}" rx="2" fill="${e.lane%2?'var(--blue)':'var(--accent)'}"><title>${esc(e.label)}: ${fmt(e.start)}–${fmt(e.end)} ms</title></rect>`).join('');
 return svg(ticks+names+blocks+'<text x="455" y="277" text-anchor="end">ms</text>','가로축은 ms, 행은 '+labels.join(', ')+'. 각 구간의 시간은 아래 표에도 있습니다.');
}
function table(headers,rows){return `<div class="data-table"><table><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
return {esc,fmt,value,range,select,setup,bind,result,svg,bars,cards,matrixTable,thumbnail,timeline,table};
})();
