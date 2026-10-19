window.CLabs={};
window.CUI=(()=>{
'use strict';
const R=window.CRules;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* 낱말 끝 받침에 맞춘 조사. josa('룩','이','가') → '이'. 칸 이름(e4)처럼 숫자로 끝나면 읽는 소리로 본다. */
const josa=(w,a,b)=>{const t=String(w),d='영일이삼사오육칠팔구'['0123456789'.indexOf(t.at(-1))]||t.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const sign=n=>n>0?`+${n}`:n<0?`−${-n}`:'0';
function range(id,label,min,max,stepv,v,hint=''){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${stepv}" value="${v}">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function select(id,label,options,v){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;}
function text(id,label,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="text" value="${esc(v)}" autocomplete="off" spellcheck="false">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function check(id,label,on=false){return `<label class="control check-row" for="${id}"><input id="${id}" type="checkbox" ${on?'checked':''}><span>${label}</span></label>`;}
/* 실험 상자: 왼쪽 조작부, 오른쪽 판(.chart), 아래 결과 문장. 판은 버튼 64개라 키보드로도 고를 수 있다. */
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart" role="group" aria-label="실험 판. 칸마다 단추이며, 같은 내용은 아래 결과 문장에 있습니다."></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
function bind(el,fn){const update=()=>{el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=x.value;});fn();};el.querySelectorAll('input,select').forEach(x=>{if(x.dataset.manual!==undefined)return;x.addEventListener('input',update);if(x.tagName==='SELECT'||x.type==='checkbox')x.addEventListener('change',update);});update();}
/* 결과 꼬리표: 규칙대로 실제 계산, 미리 정한 국면, 시각적 비유를 구분한다. */
const KINDS={real:'규칙을 실제로 계산',preset:'미리 정한 국면',story:'지어낸 대국 기록'};
const kind=(k,more='')=>`<br><span class="kind-tag">${KINDS[k]}</span>${more?` ${more}`:''}`;
function table(head,rows,caption=''){return `<div class="table-wrap"><table>${caption?`<caption>${esc(caption)}</caption>`:''}<thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
/* 막대: 값과 이름을 글로 함께 적어 색 없이도 읽힌다. */
function bars(labels,values,{unit='',mark=()=>false}={}){
 const top=Math.max(...values.map(Math.abs),1);
 return `<div class="cbars">${labels.map((l,i)=>`<div class="cbar"><div><b>${esc(l)}${mark(i)?' ✓':''}</b><span>${values[i].toLocaleString('en-US')}${unit}</span></div><div class="cbar-track"><i style="width:${Math.max(1,Math.abs(values[i])/top*100)}%"${mark(i)?' class="on"':''}></i></div></div>`).join('')}</div>`;
}
/* 기물 그림(45×45). 흰 기물은 밝게 칠하고 검은 선, 검은 기물은 어둡게 칠한다. 모양이 달라 색을 못 봐도 종류를 알 수 있다. */
const SHAPES={
 p:'<circle cx="22.5" cy="14" r="5.5"/><path d="M17 21h11l3 12H14z"/><rect x="11" y="33" width="23" height="5" rx="2"/>',
 r:'<path d="M12 9h4v4h4V9h5v4h4V9h4v8l-3 3v12h-15V20l-3-3z"/><rect x="10" y="32" width="25" height="6" rx="2"/>',
 n:'<path d="M14 38h20c0-9-2-17-7-23l1-6-5 3c-6 1-11 6-12 12l4 2 4-3 3 1-8 10z"/><circle cx="20" cy="16" r="1.4" class="pc-eye"/>',
 b:'<circle cx="22.5" cy="8" r="2.6"/><path d="M22.5 11c6 4 8 9 6 15H16c-2-6 0-11 6.5-15z"/><path d="M15 27h15v4H15z"/><rect x="11" y="33" width="23" height="5" rx="2"/><path d="M20 19h5M22.5 16.5v5" class="pc-line"/>',
 q:'<path d="M9 14l5 15h17l5-15-7 8-6.5-12L16 22z"/><circle cx="9" cy="12" r="2.4"/><circle cx="22.5" cy="8" r="2.4"/><circle cx="36" cy="12" r="2.4"/><rect x="12" y="30" width="21" height="8" rx="2"/>',
 k:'<path d="M22.5 4v8M18.5 8h8" class="pc-cross"/><path d="M11 18c5-4 18-4 23 0l-4 12H15z"/><rect x="12" y="30" width="21" height="8" rx="2"/>'
};
const glyph=p=>`<svg viewBox="0 0 45 45" class="pc ${R.colorOf(p)==='w'?'pc-w':'pc-b'}" aria-hidden="true" focusable="false">${SHAPES[R.typeOf(p)]}</svg>`;
const pieceName=p=>`${R.colorOf(p)==='w'?'흰':'검은'} ${R.NAME[R.typeOf(p)]}`;
/* 판 그리기. marks: {칸번호: 'from'|'to'|'capture'|'bad'|'hit'|'last'} 꼴. 표시는 색과 함께 글자(●·✕·○)로도 남긴다. */
function board(s,{marks={},flip=false,label='체스판',small=false,buttons=true}={}){
 const cells=[],ranks=flip?[0,1,2,3,4,5,6,7]:[7,6,5,4,3,2,1,0],files=flip?[7,6,5,4,3,2,1,0]:[0,1,2,3,4,5,6,7];
 const sym={to:'●',capture:'✕',bad:'⊘',hit:'○',from:'',last:'',sel:''};
 for(const r of ranks)for(const f of files){
  const i=r*8+f,p=s.board[i],m=marks[i]||'',nm=R.name(i),light=R.isLight(i);
  const say=`${nm}${p?' '+pieceName(p):''}${m==='to'?', 갈 수 있는 칸':m==='capture'?', 잡을 수 있는 칸':m==='bad'?', 킹이 공격받게 되어 갈 수 없는 칸':m==='hit'?', 공격받는 칸':m==='from'?', 고른 기물':''}`;
  const coord=(f===(flip?7:0)?`<span class="rk">${r+1}</span>`:'')+(r===(flip?7:0)?`<span class="fl">${R.FILES[f]}</span>`:'');
  const inner=`${coord}${p?glyph(p):''}${sym[m]?`<span class="mk">${sym[m]}</span>`:''}`;
  cells.push(buttons?`<button type="button" class="sq ${light?'lt':'dk'} ${m?'m-'+m:''}" data-sq="${i}" aria-label="${esc(say)}">${inner}</button>`:`<span class="sq ${light?'lt':'dk'} ${m?'m-'+m:''}">${inner}</span>`);
 }
 return `<div class="cboard${small?' small':''}" role="${buttons?'grid':'img'}" aria-label="${esc(label)}">${cells.join('')}</div>`;
}
/* 실제로 두어 보는 판. 기물을 누르면 합법 수가 ●(빈 칸)·✕(잡기)로 표시되고, 그 칸을 누르면 둔다. 승진은 promo 선택 상자 값을 쓴다.
   onChange(state, info)는 수를 둘 때마다 불린다. history는 국면 열쇠 목록, sans는 둔 수의 기보다. */
function play(holder,{fen=R.START,flip=false,promo=()=> 'q',onChange=()=>{},canMove=()=>true,label='두어 보는 판',extraMarks=()=>({})}={}){
 const api={state:R.parseFEN(fen),history:[],sans:[],selected:-1,flip,last:null};
 api.history=[R.positionKey(api.state)];
 const draw=()=>{const marks={...extraMarks(api.state)};if(api.last){marks[api.last.from]='last';marks[api.last.to]='last';}
  if(api.selected>=0){marks[api.selected]='from';for(const m of R.legalMoves(api.state,api.selected))marks[m.to]=api.state.board[m.to]||m.flag==='ep'?'capture':'to';}
  holder.innerHTML=board(api.state,{marks,flip:api.flip,label});};
 api.reset=(f=fen,keepFlip=true)=>{fen=f;api.state=R.parseFEN(f);api.history=[R.positionKey(api.state)];api.sans=[];api.selected=-1;api.last=null;if(!keepFlip)api.flip=flip;draw();onChange(api.state,{reset:true});};
 api.apply=m=>{const text=R.san(api.state,m);api.state=R.makeMove(api.state,m);api.history.push(R.positionKey(api.state));api.sans.push(text);api.selected=-1;api.last=m;draw();onChange(api.state,{move:m,san:text});return text;};
 api.playSan=t=>{const m=R.parseSan(api.state,t);if(!m)return null;return api.apply(m);};
 api.redraw=draw;
 holder.addEventListener('click',e=>{const b=e.target.closest('[data-sq]');if(!b)return;const i=+b.dataset.sq,s=api.state;
  if(!canMove(s)){return;}
  if(api.selected>=0){const ms=R.legalMoves(s,api.selected).filter(m=>m.to===i);if(ms.length){const pick=ms.find(m=>!m.promo||m.promo===promo())||ms[0];api.apply(pick);holder.querySelector(`[data-sq="${i}"]`)?.focus();return;}}
  api.selected=s.board[i]&&R.colorOf(s.board[i])===s.turn&&api.selected!==i?i:-1;draw();holder.querySelector(`[data-sq="${i}"]`)?.focus();onChange(api.state,{select:api.selected});});
 draw();return api;
}
/* 수 입력 칸: 판을 누르지 않고 기보로 둔다(키보드와 화면 낭독기 사용자를 위한 길). */
function sanInput(id,label='수 입력 (예: e4, Nf3, 0-0)'){return `<form class="san-form" data-san-form><label class="control" for="${id}"><span>${label}</span><input id="${id}" type="text" autocomplete="off" spellcheck="false" data-manual></label><button type="submit">두기</button></form>`;}
function wireSan(el,id,api,onError){el.querySelector('[data-san-form]').addEventListener('submit',e=>{e.preventDefault();const x=el.querySelector('#'+id),v=x.value.trim();if(!v)return;if(api.playSan(v))x.value='';else onError(v);});}
function thumbnail(i){
 const sets=[['a1','h8','좌표'],['N 8','R 14','닿는 칸'],['e.p.','8Q','0-0'],['+','핀','합법'],['#','=','무승부'],['Nf3','x','기보'],['1','3','5·9'],['중앙','전개','킹'],['포크','핀','꼬치'],['Q','R','외통'],['max','min','αβ'],['복기','실수','대안']][i]||['?','?','?'];
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${sets.map((s,k)=>`<rect x="${8+k*99}" y="18" width="86" height="62" rx="6" fill="${k%2?'var(--panel2)':'var(--chart)'}" stroke="var(--line)"/><rect x="${16+k*99}" y="67" width="${[60,40,25][(k+i)%3]}" height="3" fill="var(--accent)"/><text x="${51+k*99}" y="51" text-anchor="middle" fill="var(--text)" font-size="${s.length>3?14:17}">${esc(s)}</text>`).join('')}</svg>`;
}
return {esc,josa,sign,range,select,text,check,setup,bind,KINDS,kind,table,bars,glyph,pieceName,board,play,sanInput,wireSan,thumbnail};
})();
