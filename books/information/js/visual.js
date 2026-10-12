window.ITLabs={};
window.ITUI=(()=>{
'use strict';
/* 낱말 끝 받침에 맞춘 조사. josa('꿀','을','를') → '을', josa('꿀','으로','로') → '로'(ㄹ 받침은 '로'). 숫자는 읽는 소리로 본다. */
const josa=(w,a,b)=>{const t=String(w),d='영일이삼사오육칠팔구'['0123456789'.indexOf(t.at(-1))]||t.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=(p,d=1)=>`${fmt(p*100,d)}%`;
const value=(el,id)=>Number(el.querySelector('#'+id).value);
function range(id,label,min,max,step,v){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;}
function select(id,label,options,v){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;}
function text(id,label,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="text" value="${esc(v)}" autocomplete="off" spellcheck="false">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function check(id,label,on=false){return `<label class="check" for="${id}"><input id="${id}" type="checkbox" ${on?'checked':''}><span>${label}</span></label>`;}
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart"></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
function bind(el,fn){const update=()=>{el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=x.value;});fn();};el.querySelectorAll('input,select').forEach(x=>x.addEventListener('input',update));update();}
function result(el,chart,textHtml){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=textHtml;}
/* 막대: 데스크톱은 SVG, 좁은 화면은 같은 값을 HTML 막대로 보여 준다. mark(i)가 참이면 정답 표시(✓)와 강조색을 쓴다. */
function bars(labels,values,{unit='',digits=3,max=null,mark=()=>false,signed=false}={}){
 const top=max??Math.max(...values.map(Math.abs),1e-6),left=96,width=280,gap=Math.max(20,Math.min(40,232/values.length)),bh=Math.min(24,gap-7);
 const body=values.map((v,i)=>{const y=16+i*gap,w=Math.abs(v)/top*(signed?width/2:width),x=signed?(v<0?left+width/2-w:left+width/2):left,c=mark(i)?'var(--accent)':v<0?'var(--orange)':'var(--blue)';return `<text x="8" y="${y+bh/2+5}">${esc(labels[i])}${mark(i)?' ✓':''}</text><rect x="${left}" y="${y}" width="${width}" height="${bh}" rx="3" fill="var(--panel2)"/><rect x="${x}" y="${y}" width="${Math.max(w,1)}" height="${bh}" rx="3" fill="${c}"/><text x="${left+width+10}" y="${y+bh/2+5}">${fmt(v,digits)}${esc(unit)}</text>`;}).join('');
 const mid=signed?`<path d="M${left+width/2} 10V${20+values.length*gap}" stroke="var(--muted)" stroke-dasharray="3 3"/>`:'';
 const desk=`<svg viewBox="0 0 480 ${Math.max(120,28+values.length*gap)}" role="img" aria-label="${esc(labels.map((l,i)=>`${l} ${fmt(values[i],digits)}${unit}`).join(', '))}">${mid}${body}</svg>`;
 const mob=`<div class="mobile-bars">${labels.map((l,i)=>`<div class="mobile-bar"><div><b>${esc(l)}${mark(i)?' ✓':''}</b><span>${fmt(values[i],digits)}${esc(unit)}</span></div><div class="mobile-track"><i style="width:${Math.abs(values[i])/top*100}%;background:${mark(i)?'var(--accent)':values[i]<0?'var(--orange)':'var(--blue)'}"></i></div></div>`).join('')}</div>`;
 return `<div class="responsive-bars">${desk}${mob}</div>`;
}
/* 어텐션 표: 행 = 지금 위치(질문), 열 = 보는 위치(열쇠). 칸의 진하기와 숫자가 함께 값을 알려 준다. */
function heatmap(matrix,rows,cols,{caption='',hi=null,digits=2,showValues=true}={}){
 const n=rows.length,m=cols.length,cell=Math.min(34,Math.floor(360/Math.max(m,1))),left=70,topPad=64,w=left+m*cell+10,h=topPad+n*cell+10;
 let b='';
 cols.forEach((c,j)=>{b+=`<text class="hm-col" x="${left+j*cell+cell/2}" y="${topPad-8}" transform="rotate(-50 ${left+j*cell+cell/2} ${topPad-8})">${esc(c)}</text>`;});
 rows.forEach((r,i)=>{b+=`<text x="${left-6}" y="${topPad+i*cell+cell/2+4}" text-anchor="end">${esc(r)}</text>`;matrix[i].forEach((v,j)=>{const blank=!Number.isFinite(v);const on=hi&&hi(i,j);b+=`<rect x="${left+j*cell}" y="${topPad+i*cell}" width="${cell-2}" height="${cell-2}" rx="2" fill="${blank?'transparent':'var(--accent)'}" fill-opacity="${blank?0:Math.max(.04,Math.min(1,v))}" stroke="${on?'var(--orange)':blank?'var(--line)':'none'}" stroke-width="${on?2.5:1}" ${blank?'stroke-dasharray="2 2"':''}/>`;if(showValues&&!blank&&cell>=26&&v>=.1)b+=`<text x="${left+j*cell+cell/2-1}" y="${topPad+i*cell+cell/2+4}" text-anchor="middle" class="hm-v ${v>.55?'dark':''}">${fmt(v,digits).replace(/^0/,'')}</text>`;});});
 const label=caption||'어텐션 가중치 표';
 return `<div class="heatmap"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${b}</svg></div>`;
}
function chips(tokens,cls=()=>''){return `<div class="tok-row">${tokens.map((t,i)=>`<span class="tok ${cls(i)}"><small>${i}</small>${esc(t)}</span>`).join('')}</div>`;}
function thumbnail(i){
 const sets=[['−log p','놀람','비트'],['평균','H','≤log n'],['앞 글자','조건','연쇄'],['트리','0·1','크래프트'],['내 부호','남의 글','+KL'],['구간','좁히기','비트'],['사전','LZ','BPE'],['시험','2^H','PPL'],['잡음','해밍','고침'],['표','b비트','길이'],['A·B·C','비트/글자','고르기']][i]||['?','?','?'];
 const colors=['var(--accent)','var(--blue)','var(--orange)'],bars=[70,45,25];
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${sets.map((s,k)=>`<rect x="${8+k*99}" y="18" width="86" height="62" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><rect x="${16+k*99}" y="67" width="${bars[(k+i)%3]}" height="3" fill="${colors[k]}"/><text x="${51+k*99}" y="51" text-anchor="middle" fill="var(--text)" font-size="${s.length>3?13:16}">${esc(s)}</text>`).join('')}</svg>`;
}
return {josa,esc,fmt,pct,value,range,select,text,check,setup,bind,result,bars,heatmap,chips,thumbnail};
})();
