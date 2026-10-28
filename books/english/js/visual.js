window.ELabs={};
/* 공통 실험 UI: 조작부, 결과 상자, 표, 막대, 듣기 단추, 장 카드 썸네일. */
window.EUI=(()=>{
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function range(id,label,min,max,step,v,hint=''){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function select(id,label,options,v){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;}
function text(id,label,v='',hint='',area=false){const field=area?`<textarea id="${id}" class="ew-input" spellcheck="false">${esc(v)}</textarea>`:`<input id="${id}" class="ew-input" type="text" value="${esc(v)}" autocomplete="off" spellcheck="false">`;return `<label class="control" for="${id}"><span>${label}</span>${field}${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function check(id,label,on=false){return `<label class="control check-row" for="${id}"><input id="${id}" type="checkbox" ${on?'checked':''}><span>${label}</span></label>`;}
/* 실험 상자: 왼쪽 조작부, 오른쪽 그림(.chart), 아래 결과 문장. */
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart" role="group" aria-label="실험 그림. 같은 내용은 아래 결과 문장에 있습니다."></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
function bind(el,fn){const update=()=>{el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=x.value;});fn();};el.querySelectorAll('input,select,textarea').forEach(x=>{x.addEventListener('input',update);if(x.tagName==='SELECT'||x.type==='checkbox')x.addEventListener('change',update);});update();return update;}
/* 결과 꼬리표: 규칙으로 실제 계산, 미리 정한 예문·시나리오, 이 기기에서 잰 값, 지어낸 대화 기록을 구분한다. */
const KINDS={real:'규칙으로 실제 계산',preset:'미리 정한 예문·시나리오',measure:'이 기기에서 잰 값',story:'지어낸 대화 기록'};
const kind=(k,more='')=>`<br><span class="kind-tag">${KINDS[k]}</span>${more?` ${more}`:''}`;
function table(head,rows,caption=''){return `<div class="table-wrap"><table>${caption?`<caption>${esc(caption)}</caption>`:''}<thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
/* 막대: 값과 이름을 글로 함께 적어 색 없이도 읽힌다. */
function bars(labels,values,{unit='',mark=()=>false}={}){
 const top=Math.max(...values.map(Math.abs),1);
 return `<div class="cbars">${labels.map((l,i)=>`<div class="cbar"><div><b>${esc(l)}${mark(i)?' ✓':''}</b><span>${values[i].toLocaleString('en-US')}${unit}</span></div><div class="cbar-track"><i style="width:${Math.max(1,Math.abs(values[i])/top*100)}%"${mark(i)?' class="on"':''}></i></div></div>`).join('')}</div>`;
}
/* 대화 기록: [화자, 말] 목록. 지우의 말은 오른쪽, 멈춤(gap)은 점선 상자. mark는 강조할 줄 번호. */
function talk(lines,{mark=-1}={}){return `<ol class="ew-talk">${lines.map(([who,say],i)=>who==='gap'?`<li class="ew-gap">${esc(say)}</li>`:`<li class="${who==='지우'?'ew-me':''}"${i===mark?' style="outline:3px solid var(--orange)"':''}><b>${esc(who)}</b>${esc(say)}${i===mark?' ◀':''}</li>`).join('')}</ol>`;}
/* 보기 순서: 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 고르게 오게 한다. */
function choiceOrder(n,answer,target){const order=[...Array(n).keys()].filter(i=>i!==answer);order.splice(Math.min(target,n-1),0,answer);return order;}
function thumbnail(i){
 const sets=[['street','4→1','음절'],['want','go','station'],['I','work','in Seoul'],['Do','Does','Did'],['go','went','going to'],['Yes.','+1','?'],['Can','Could','Mind'],['again?','slowly','mean?'],['wanna','gonna','WER'],['wpm','um','1분'],['A','B','C']][i]||['?','?','?'];
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${sets.map((s,k)=>`<rect x="${8+k*99}" y="18" width="86" height="62" rx="6" fill="${k%2?'var(--panel2)':'var(--chart)'}" stroke="var(--line)"/><rect x="${16+k*99}" y="67" width="${[60,40,25][(k+i)%3]}" height="3" fill="var(--accent)"/><text x="${51+k*99}" y="51" text-anchor="middle" fill="var(--text)" font-size="${s.length>6?13:16}">${esc(s)}</text>`).join('')}</svg>`;
}
return {esc,range,select,text,check,setup,bind,KINDS,kind,table,bars,talk,choiceOrder,thumbnail};
})();
/* 브라우저 음성 합성(Web Speech API). 없는 브라우저와 테스트 환경에서는 아무것도 읽지 않고 null을 돌려준다.
   목소리는 영어(en-US 우선) 가운데 기기에 있는 것을 쓰며, 재생 시간은 이 기기에서 잰 값이다. */
window.ESpeak=(()=>{
'use strict';
const available=()=>typeof window.speechSynthesis!=='undefined'&&typeof window.SpeechSynthesisUtterance!=='undefined';
function voice(){const vs=window.speechSynthesis.getVoices();return vs.find(v=>/^en[-_]US/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang))||null;}
function say(text,rate=1,onend=()=>{}){
 if(!available()){onend(null);return false;}
 window.speechSynthesis.cancel();
 const u=new SpeechSynthesisUtterance(text),v=voice();u.lang='en-US';u.rate=rate;if(v)u.voice=v;
 let t0=0;u.onstart=()=>{t0=performance.now();};u.onend=()=>onend(t0?(performance.now()-t0)/1000:null);u.onerror=()=>onend(null);
 window.speechSynthesis.speak(u);return true;
}
const stop=()=>{if(available())window.speechSynthesis.cancel();};
/* 듣기 단추 html. 음성 합성이 없으면 단추를 끄고 이유를 적는다. */
function button(id,label='영어로 듣기'){const ok=available();return `<button type="button" class="ew-speak" id="${id}" ${ok?'':'disabled'} aria-describedby="${id}-note">▶ ${label}</button><small class="hint" id="${id}-note">${ok?'브라우저 목소리로 읽습니다. 소리가 나지 않으면 기기 음량과 영어 목소리 설치를 확인하세요.':'이 브라우저에는 음성 합성이 없어 읽기를 할 수 없습니다. 문장은 글로 보입니다.'}</small>`;}
return {available,say,stop,button};
})();
