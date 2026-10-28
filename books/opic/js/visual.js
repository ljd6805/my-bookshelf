window.OLabs={};
window.OUI=(()=>{
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* 낱말 끝 받침에 맞춘 조사. josa('답','이','가') → '이'. 숫자로 끝나면 읽는 소리로 본다. */
const josa=(w,a,b)=>{const t=String(w),d='영일이삼사오육칠팔구'['0123456789'.indexOf(t.at(-1))]||t.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const fmt=(n,d=0)=>Number(n).toLocaleString('ko-KR',{minimumFractionDigits:d,maximumFractionDigits:d});
const clock=s=>{const t=Math.max(0,Math.round(s));return `${Math.floor(t/60)}분 ${String(t%60).padStart(2,'0')}초`;};
function range(id,label,min,max,stepv,v,hint=''){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${stepv}" value="${v}">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function select(id,label,options,v){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;}
function check(id,label,on=false){return `<label class="control check-row" for="${id}"><input id="${id}" type="checkbox" ${on?'checked':''}><span>${label}</span></label>`;}
function area(id,label,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><textarea id="${id}" rows="6" spellcheck="false" lang="en">${esc(v)}</textarea>${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
/* 실험 상자: 왼쪽 조작부, 오른쪽 그림(.chart), 아래 결과 문장. */
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart" role="group" aria-label="실험 그림. 같은 내용은 아래 결과 문장에 있습니다."></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
function bind(el,fn){const update=()=>{el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=x.value;});fn();};el.querySelectorAll('input,select,textarea').forEach(x=>{if(x.dataset.manual!==undefined)return;x.addEventListener('input',update);if(x.tagName==='SELECT'||x.type==='checkbox')x.addEventListener('change',update);});update();}
/* 결과 꼬리표: 실제 계산, 이 책이 정한 어림 규칙, 지어낸 자료, 공개 안내 기준을 구분한다. */
const KINDS={real:'실제로 계산',rule:'이 책이 정한 어림 규칙',story:'이 책이 지어낸 자료',source:'공개 안내 기준(바뀔 수 있음)'};
const kind=(...ks)=>`<br>${ks.map(k=>`<span class="kind-tag">${KINDS[k]}</span>`).join(' ')}`;
function table(head,rows,caption=''){return `<div class="table-wrap"><table>${caption?`<caption>${esc(caption)}</caption>`:''}<thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
/* 막대: 값과 이름을 글로 함께 적어 색 없이도 읽힌다. */
function bars(labels,values,{unit='',mark=()=>false,max}={}){
 const top=max||Math.max(...values.map(Math.abs),1);
 return `<div class="cbars">${labels.map((l,i)=>`<div class="cbar"><div><b>${esc(l)}${mark(i)?' ✓':''}</b><span>${typeof values[i]==='number'?fmt(values[i],Number.isInteger(values[i])?0:1):values[i]}${unit}</span></div><div class="cbar-track"><i style="width:${Math.max(1,Math.min(100,Math.abs(values[i])/top*100))}%"${mark(i)?' class="on"':''}></i></div></div>`).join('')}</div>`;
}
/* 이 책이 끝까지 따라가는 양: 답 하나의 네 덩어리(도입·세부·예·마무리). 모든 그림에서 같은 색·같은 무늬·같은 이름표로 그린다.
   rows: [{name, seconds, present}], scale: 막대 전체 폭에 해당하는 초. 빠진 덩어리는 점선 빈칸과 ✕로 표시한다. */
const BLOCK_STYLE={open:'ob-open',detail:'ob-detail',example:'ob-example',close:'ob-close'};
function blocksBar(rows,{scale=120,width=600,y=34,h=40,label='답의 네 덩어리'}={}){
 let x=20;const unit=(width-40)/scale,out=[],avail=width-40-4*(rows.length-1);
 /* 빠진 덩어리(96)와 최소 폭(56)을 먼저 확보하고, 남은 폭이 모자라면 비례 부분만 줄여 막대가 그림 밖으로 나가지 않게 한다. */
 let ws=rows.map(r=>r.present?Math.max(r.seconds*unit,56):96);
 const sum=ws.reduce((a,w)=>a+w,0),fixed=rows.reduce((a,r)=>a+(r.present?56:96),0);
 if(sum>avail&&sum>fixed){const k=Math.max(0,(avail-fixed)/(sum-fixed));ws=ws.map((w,i)=>rows[i].present?56+(w-56)*k:w);}
 for(const [i,r] of rows.entries()){
  const w=ws[i];
  out.push(r.present?`<rect class="ob ${BLOCK_STYLE[r.key]}" x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="5"/><text x="${(x+w/2).toFixed(1)}" y="${y+h/2+5}" text-anchor="middle" class="ob-t">${esc(r.name)}</text><text x="${(x+w/2).toFixed(1)}" y="${y+h+18}" text-anchor="middle" class="ob-s">${Math.round(r.seconds)}초</text>`
   :`<rect class="ob ob-missing" x="${x.toFixed(1)}" y="${y}" width="${w}" height="${h}" rx="5"/><text x="${(x+w/2).toFixed(1)}" y="${y+h/2+5}" text-anchor="middle" class="ob-s">✕</text><text x="${(x+w/2).toFixed(1)}" y="${y+h+18}" text-anchor="middle" class="ob-s">${esc(r.name)} 없음</text>`);
  x+=w+4;
 }
 const total=rows.reduce((a,r)=>a+(r.present?r.seconds:0),0);
 return `<svg viewBox="0 0 ${width} ${y+h+34}" role="img" aria-label="${esc(label)}: ${rows.map(r=>r.present?`${r.name} ${Math.round(r.seconds)}초`:`${r.name} 없음`).join(', ')}, 모두 ${Math.round(total)}초">${out.join('')}<text x="20" y="20" class="ob-s">${esc(label)} · 모두 ${Math.round(total)}초</text></svg>`;
}
function thumbnail(i){
 const sets=[['40분','15문항','듣기'],['NL','IM','AL'],['설문','묶음','이야기'],['도입','세부','예'],['usually','then','현재'],['went','배경','사건'],['used to','now','will'],['?','?','대안'],['콤보','돌발','바꿔 쓰기'],['wpm','멈춤','시계'],['진단','고침','다시']][i]||['?','?','?'];
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${sets.map((s,k)=>`<rect x="${8+k*99}" y="18" width="86" height="62" rx="6" fill="${k%2?'var(--panel2)':'var(--chart)'}" stroke="var(--line)"/><rect x="${16+k*99}" y="67" width="${[60,40,25][(k+i)%3]}" height="3" fill="var(--accent)"/><text x="${51+k*99}" y="51" text-anchor="middle" fill="var(--text)" font-size="${s.length>4?13:16}">${esc(s)}</text>`).join('')}</svg>`;
}
return {esc,josa,fmt,clock,range,select,check,area,setup,bind,KINDS,kind,table,bars,blocksBar,thumbnail};
})();
