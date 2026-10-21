window.PLabs={};
window.PUI=(()=>{
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function select(id,label,options,value){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([v,t])=>`<option value="${v}" ${String(v)===String(value)?'selected':''}>${t}</option>`).join('')}</select></label>`;}
function range(id,label,min,max,value){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${value}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="1" value="${value}"></label>`;}
function check(id,label,on=true){return `<label class="check" for="${id}"><input id="${id}" type="checkbox" ${on?'checked':''}>${label}</label>`;}
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart" role="group" aria-label="모형 결과. 같은 내용은 아래 결과 문장에도 있습니다."></div></div><div class="readout" role="status" aria-live="polite"></div><p class="caption model-note">브라우저의 JavaScript 교육 모형입니다. Prisma 엔진·SQL을 실행하거나 실제 DB 성능을 측정하지 않습니다.</p>`;}
function bind(el,fn){const update=()=>{el.querySelectorAll('input[type=range]').forEach(x=>el.querySelector('#'+x.id+'-value').textContent=x.value);fn();};el.addEventListener('input',update);el.addEventListener('change',update);update();}
function table(headers,rows){return `<div class="table-wrap"><table><thead><tr>${headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}">반환 행 없음</td></tr>`}</tbody></table></div>`;}
function stages(items){return `<div class="stages">${items.map(([name,state])=>`<div class="stage ${state===false?'bad':state===true?'good':''}"><span>${state===true?'✓':state===false?'✕':'→'}</span><b>${esc(name)}</b></div>`).join('')}</div>`;}
function bars(values){const max=Math.max(1,...values.map(x=>x[1]));return `<div class="p-bars">${values.map(([label,n])=>`<div><div class="row"><b>${esc(label)}</b><strong>${n}</strong></div><i style="width:${n/max*100}%"></i></div>`).join('')}</div>`;}
function diagram(c,index){
 const labels=c.flow.slice(0,4).map(x=>x.split('|')[0]);
 const textLines=s=>s.length>10&&/[가-힣]/.test(s)?[s.slice(0,Math.ceil(s.length/2)),s.slice(Math.ceil(s.length/2))]:[s];
 const nodes=labels.map((s,i)=>`<rect x="${16+i*147}" y="42" width="131" height="64" rx="8"/><text x="${81+i*147}" y="78" text-anchor="middle">${textLines(s).map((line,k)=>`<tspan x="${81+i*147}" dy="${k?18:0}">${esc(line)}</tspan>`).join('')}</text>${i<labels.length-1?`<path d="M${147+i*147} 74h16m-5-4 5 4-5 4"/>`:''}`).join('');
 return `<svg viewBox="0 0 620 148" role="img" aria-label="${esc(c.title)}의 핵심 관계"><text x="16" y="22" class="diagram-label">${String(index+1).padStart(2,'0')} / ${esc(c.group)}</text>${nodes}</svg>`;
}
function thumbnail(i){
 const labels=['타입과 DB 제약을 순서대로 검사','프로젝트와 작업과 실행의 관계','스키마와 Client와 DB의 서로 다른 상태','행과 열을 각각 선택','부모와 자식의 조회 조건 구분','확장과 백필과 전환과 축소','두 쓰기를 하나의 트랜잭션으로 묶음','반복 조회와 묶음 조회의 호출 수','프로젝트 경계 밖의 요청을 거절','부분 실패와 중복과 권한을 각각 검증'];
 const rect=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/>`;
 const text=(x,y,t)=>`<text x="${x}" y="${y}" text-anchor="middle">${t}</text>`;
 const arts=[
  rect(12,26,94,48)+rect(134,26,94,48)+'<path d="M106 50h28"/>'+text(59,55,'타입 ✓')+text(181,55,'DB ✕'),
  rect(8,28,64,45)+rect(90,28,64,45)+rect(172,28,64,45)+'<path d="M72 50h18m64 0h18"/>'+text(40,55,'Project')+text(122,55,'Task')+text(204,55,'Run'),
  rect(28,35,36,45)+rect(102,54,36,26)+rect(176,54,36,26)+text(46,24,'schema')+text(120,24,'Client')+text(194,24,'DB'),
  '<path d="M30 20h180v60H30zm0 20h180M30 60h180M90 20v60m60-60v60"/>'+rect(31,40,58,20)+text(120,98,'where × select'),
  rect(15,29,76,44)+rect(146,8,78,34)+rect(146,59,78,34)+'<path d="M91 50h23V25h32M114 50v26h32"/>'+text(53,55,'Task')+text(185,30,'성공')+text(185,81,'실패'),
  [12,70,128,186].map((x,k)=>rect(x,30,42,44)+text(x+21,57,k+1)).join('')+'<path d="M54 52h16m42 0h16m42 0h16"/>',
  rect(16,14,208,72)+rect(34,31,70,36)+rect(136,31,70,36)+text(69,55,'Task')+text(171,55,'Run')+'<path d="M104 49h32"/>',
  rect(24,25,190,18)+rect(24,61,38,18)+text(120,18,'N + 1 회')+text(118,77,'2회'),
  rect(14,25,88,50)+rect(138,25,88,50)+text(58,56,'Project 1')+text(182,56,'Project 2')+'<path d="M112 35l16 30m0-30-16 30"/>',
  [15,92,169].map((x,k)=>rect(x,28,55,46)+text(x+27,57,'✓')).join('')
 ];
 return `<svg viewBox="0 0 240 105" aria-label="${labels[i]}" role="img">${arts[i]}</svg>`;
}
return {esc,select,range,check,setup,bind,table,stages,bars,diagram,thumbnail};
})();
