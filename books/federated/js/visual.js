window.FLLabs={};
window.FLUI=(()=>{
'use strict';
/* 낱말 끝 받침에 맞춘 조사. josa('꿀','을','를') → '을', josa('꿀','으로','로') → '로'(ㄹ 받침은 '로'). 숫자는 읽는 소리로 본다. */
const josa=(w,a,b)=>{const t=String(w),d='영일이삼사오육칠팔구'['0123456789'.indexOf(t.at(-1))]||t.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=(p,d=1)=>`${fmt(p*100,d)}%`;
const int=n=>Math.round(n).toLocaleString('en-US');
/* 바이트를 읽기 쉬운 단위로: 1 KB = 1,000바이트, 1 MB = 1,000,000바이트. */
const bytes=b=>b>=1e9?`${fmt(b/1e9,2)} GB`:b>=1e6?`${fmt(b/1e6,2)} MB`:b>=1e3?`${fmt(b/1e3,1)} KB`:`${int(b)}바이트`;
const value=(el,id)=>Number(el.querySelector('#'+id).value);
const checked=(el,id)=>el.querySelector('#'+id).checked;
function range(id,label,min,max,step,v){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;}
function select(id,label,options,v){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;}
function check(id,label,on=false){return `<label class="check" for="${id}"><input id="${id}" type="checkbox" ${on?'checked':''}><span>${label}</span></label>`;}
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart"></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
/* 입력이 바뀌면 fn을 부른다. 계산이 무거운 실험(heavy)은 끌기를 멈춘 뒤 0.15초 기다렸다 한 번만 계산하고, 그동안 “계산 중”을 보인다. */
function bind(el,fn,{heavy=false}={}){
 let timer=null;
 const show=()=>el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=x.value;});
 const run=()=>{show();if(!heavy)return fn();const r=el.querySelector('.readout');if(r)r.setAttribute('aria-busy','true');clearTimeout(timer);timer=setTimeout(()=>{fn();if(r)r.removeAttribute('aria-busy');},150);};
 el.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',run));show();fn();
}
function result(el,chart,textHtml){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=textHtml;}
const color=i=>['var(--accent)','var(--blue)','var(--orange)','var(--muted)'][i%4];
/* 막대: 데스크톱은 SVG, 좁은 화면은 같은 값을 HTML 막대로 보여 준다. mark(i)가 참이면 ✓와 강조색을 쓴다. */
function bars(labels,values,{unit='',digits=3,max=null,mark=()=>false,format=null}={}){
 const top=max??Math.max(...values.map(Math.abs),1e-9),left=118,width=250,gap=Math.max(20,Math.min(40,232/values.length)),bh=Math.min(24,gap-7),show=v=>format?format(v):fmt(v,digits)+unit;
 const body=values.map((v,i)=>{const y=16+i*gap,w=Math.min(1,Math.abs(v)/top)*width,c=mark(i)?'var(--accent)':'var(--blue)';return `<text x="8" y="${y+bh/2+5}">${esc(labels[i])}${mark(i)?' ✓':''}</text><rect x="${left}" y="${y}" width="${width}" height="${bh}" rx="3" fill="var(--panel2)"/><rect x="${left}" y="${y}" width="${Math.max(w,1)}" height="${bh}" rx="3" fill="${c}"/><text x="${left+width+10}" y="${y+bh/2+5}">${esc(show(v))}</text>`;}).join('');
 const desk=`<svg viewBox="0 0 480 ${Math.max(120,28+values.length*gap)}" role="img" aria-label="${esc(labels.map((l,i)=>`${l} ${show(values[i])}`).join(', '))}">${body}</svg>`;
 const mob=`<div class="mobile-bars">${labels.map((l,i)=>`<div class="mobile-bar"><div><b>${esc(l)}${mark(i)?' ✓':''}</b><span>${esc(show(values[i]))}</span></div><div class="mobile-track"><i style="width:${Math.min(1,Math.abs(values[i])/top)*100}%;background:${mark(i)?'var(--accent)':'var(--blue)'}"></i></div></div>`).join('')}</div>`;
 return `<div class="responsive-bars">${desk}${mob}</div>`;
}
/* 꺾은선: series = [{name, values, dash}]. x는 1부터 센 라운드. 선마다 끝에 이름과 마지막 값을 적고, 같은 값을 글로도 남긴다(aria-label). */
function lines(series,{ymin=0,ymax=1,ylabel='',xlabel='라운드',digits=3,target=null}={}){
 const W=480,H=230,l=46,r=16,t=14,b=34,n=Math.max(...series.map(s=>s.values.length)),X=i=>l+(n>1?i/(n-1):0)*(W-l-r),Y=v=>t+(1-(Math.min(ymax,Math.max(ymin,v))-ymin)/(ymax-ymin))*(H-t-b);
 let g='';for(let k=0;k<=4;k++){const v=ymin+(ymax-ymin)*k/4;g+=`<path d="M${l} ${Y(v)}H${W-r}" stroke="var(--line)"/><text x="${l-6}" y="${Y(v)+4}" text-anchor="end" font-size="11">${fmt(v,2)}</text>`;}
 g+=`<text x="${W-r}" y="${H-6}" text-anchor="end" font-size="11">${esc(xlabel)} 1~${n}</text><text x="${l}" y="${H-6}" font-size="11">${esc(ylabel)}</text>`;
 if(target!==null)g+=`<path d="M${l} ${Y(target)}H${W-r}" stroke="var(--orange)" stroke-dasharray="5 4"/><text x="${l+4}" y="${Y(target)-4}" font-size="11" fill="var(--orange)">목표 ${fmt(target,2)}</text>`;
 const paths=series.map((s,i)=>`<path d="${s.values.map((v,j)=>`${j?'L':'M'}${X(j).toFixed(1)} ${Y(v).toFixed(1)}`).join('')}" fill="none" stroke="${s.color||color(i)}" stroke-width="2.5" ${s.dash?'stroke-dasharray="6 4"':''}/>`).join('');
 const legend=`<div class="legend">${series.map((s,i)=>`<span><i style="background:${s.color||color(i)}"></i>${esc(s.name)} · 마지막 ${fmt(s.values.at(-1),digits)}</span>`).join('')}</div>`;
 const label=series.map(s=>`${s.name}: ${xlabel} 1 ${fmt(s.values[0],digits)}, ${xlabel} ${s.values.length} ${fmt(s.values.at(-1),digits)}`).join('; ');
 return `<div class="line-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${g}${paths}</svg>${legend}</div>`;
}
/* 표: head는 머리 칸, rows는 칸 배열. mark(i)가 참이면 그 줄을 강조한다. */
function table(head,rows,{caption='',mark=()=>false}={}){return `<div class="table-wrap"><table class="fl-table">${caption?`<caption>${esc(caption)}</caption>`:''}<tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map((r,i)=>`<tr class="${mark(i)?'on':''}">${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;}
function thumbnail(i){
 const sets=[['원문','서버','기기'],['E번','평균','FedAvg'],['라운드','×기기','×크기'],['말투','표류','μ'],['충전','와이파이','편향'],['마감','부분','작은'],['Δ','→횟수','복원'],['+m','−m','합'],['자르기','잡음','ε'],['공용','λ','내 것'],['묶음','구간','숨김'],['Gboard','LoRA','B·A'],['q·E','z·λ','보고서']][i]||['?','?','?'];
 const colors=['var(--accent)','var(--blue)','var(--orange)'],widths=[70,45,25];
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${sets.map((s,k)=>`<rect x="${8+k*99}" y="18" width="86" height="62" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><rect x="${16+k*99}" y="67" width="${widths[(k+i)%3]}" height="3" fill="${colors[k]}"/><text x="${51+k*99}" y="51" text-anchor="middle" fill="var(--text)" font-size="${s.length>4?12:15}">${esc(s)}</text>`).join('')}</svg>`;
}
return {josa,esc,fmt,pct,int,bytes,value,checked,range,select,check,setup,bind,result,bars,lines,table,thumbnail,color};
})();
