window.SLabs={};
window.SUI=(()=>{
'use strict';
const M=SMath;
/* 낱말 끝 받침에 맞춘 조사. josa('현금','을','를') → '을'. 숫자는 읽는 소리로 본다. */
const josa=(w,a,b)=>{const t=String(w).replace(/[%)]$/,''),d='영일이삼사오육칠팔구'['0123456789'.indexOf(t.at(-1))]||t.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
/* 음수는 수학 기호 −로 쓴다. 반올림해서 0이 되면 부호를 떼어 −0.0이 나오지 않게 한다. */
const sfmt=(n,d=0)=>{const r=Number(Number(n).toFixed(d));return (r<0?'−':'')+fmt(Math.abs(r),d);};
const splus=(n,d=0)=>{const r=Number(Number(n).toFixed(d));return (r>0?'+':'')+sfmt(r,d);};
/* 금액은 억 원, 소수 첫째 자리까지. 정수면 소수점을 쓰지 않는다. n1(164.8) → '164.8', n1(1156) → '1,156', ek(-83.2) → '−83.2억 원'. */
const n1=x=>{const r=M.r1(x);return sfmt(r,Number.isInteger(r)?0:1);};
const ek=x=>`${n1(x)}억 원`;
const sek=x=>`${M.r1(x)>0?'+':''}${ek(x)}`;
/* 비율은 소수로 계산하고 화면에서만 %·%p·배·회·일로 바꾼다. pct(0.12) → '12.0%', pp(0.205) → '+20.5%p'. */
const pct=(x,d=1)=>`${sfmt(x*100+Math.sign(x)*1e-9,d)}%`;
const ppct=(x,d=1)=>`${splus(x*100+Math.sign(x)*1e-9,d)}%`;
const pp=(x,d=1)=>`${splus(x*100+Math.sign(x)*1e-9,d)}%p`;
const times=(x,unit='배',d=1)=>`${sfmt(x,d)}${unit}`;
/* 숫자 칸 읽기: 비었거나 범위를 벗어나면 null. 오류 문장은 각 실험이 "확인해 주세요"로 보여 준다. */
function num(el,id){const x=el.querySelector('#'+id),s=x.value.trim().replace(/,/g,''),v=Number(s);if(s===''||!Number.isFinite(v))return null;if(x.min!==''&&v<+x.min)return null;if(x.max!==''&&v>+x.max)return null;return v;}
/* 날짜 칸 읽기: YYYY-MM-DD 모양이고 실제로 있는 날이며 min~max 안이면 그 문자열, 아니면 null. */
function day(el,id){const x=el.querySelector('#'+id),v=x.value.trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return null;const d=new Date(v+'T00:00:00Z');if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==v)return null;if((x.min&&v<x.min)||(x.max&&v>x.max))return null;return v;}
const value=(el,id)=>el.querySelector('#'+id).value;
const checked=(el,id)=>el.querySelector('#'+id).checked;
const fill=(el,values)=>Object.entries(values).forEach(([k,v])=>{const x=el.querySelector('#'+k);if(x.type==='checkbox')x.checked=!!v;else x.value=v;});
const problem=(what,why)=>`<strong>✗ ${what}${josa(what,'을','를')} 확인해 주세요</strong> · ${why}`;
/* 계산 함수가 던진 RangeError를 독자가 읽는 말로 옮긴다. */
const WHY=[[/cash would go below 0/,'현금이 0보다 적어집니다. 가진 현금보다 많이 낼 수 없습니다.'],[/repay more than the debt/,'단기차입금보다 많이 갚을 수 없습니다.'],[/pay more than payables/,'매입채무보다 많이 갚을 수 없습니다.'],[/not enough inventory/,'팔린 재고의 원가가 가진 재고보다 많습니다.'],[/equity must be > 0/,'자본이 0 이하라 자본으로 나누는 비율을 계산할 수 없습니다.'],[/sales must be > 0/,'매출이 0이라 매출로 나누는 비율을 계산할 수 없습니다.'],[/denominators must be > 0/,'나누는 값(분모)이 0이라 계산할 수 없습니다.'],[/not a real date/,'달력에 없는 날짜입니다.']];
const why=e=>(WHY.find(([re])=>re.test(String(e&&e.message)))||[0,'입력한 값으로는 계산할 수 없습니다.'])[1];
function range(id,label,min,max,step,v,hint=''){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"${hint?` aria-describedby="${id}-hint"`:''}>${hint?`<small class="hint" id="${id}-hint">${hint}</small>`:''}</label>`;}
function number(id,label,min,max,step,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="number" inputmode="decimal"${min===''?'':` min="${min}"`}${max===''?'':` max="${max}"`} step="${step}" value="${v}">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function date(id,label,v,min='2000-01-01',max='2099-12-31',hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="date" min="${min}" max="${max}" value="${v}">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function select(id,label,options,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(text)}</option>`).join('')}</select>${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function check(id,label,on,hint=''){return `<label class="control check" for="${id}"><span class="row"><input id="${id}" type="checkbox"${on?' checked':''}><span>${label}</span></span>${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
/* wide: 조작 칸을 위에, 그림·표를 아래에 한 줄로 놓는다(세 재무제표처럼 표가 여러 개일 때). */
function setup(el,controls,wide=false){el.innerHTML=`<div class="lab-columns${wide?' wide':''}"><div class="controls">${controls}</div><div class="chart" tabindex="0" role="group" aria-label="실험 그림과 표. 좁은 화면에서는 옆으로 밀어 볼 수 있고, 같은 숫자는 아래 결과 문장에 있습니다."></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
/* 입력이 바뀌면 다시 계산한다. 계산에 걸린 시간은 data-ms에 남겨 브라우저 검사가 읽는다. */
function bind(el,fn){
 const sync=()=>el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=fmt(x.value,(String(x.step).split('.')[1]||'').length);});
 const update=e=>{sync();const t=performance.now();fn(e);el.dataset.ms=(performance.now()-t).toFixed(1);};
 el.querySelectorAll('input,select').forEach(x=>{x.addEventListener('input',update);if(x.tagName==='SELECT'||x.type==='checkbox'||x.type==='date')x.addEventListener('change',update);});
 on(el,'fs-refresh',update);update();
}
/* 실험을 다시 그릴 때(초기화) 같은 상자에 처리기가 쌓이지 않도록 종류마다 하나만 둔다. */
function on(el,type,fn){el._fs=el._fs||{};if(el._fs[type])el.removeEventListener(type,el._fs[type]);el._fs[type]=fn;el.addEventListener(type,fn);}
function markWide(root){root.querySelectorAll('.table-wrap').forEach(w=>w.classList.toggle('is-wide',w.scrollWidth>w.clientWidth+1));}
function result(el,chart,textHtml){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=textHtml;markWide(el);}
window.addEventListener('resize',()=>markWide(document));
/* 결과의 성격을 밝히는 꼬리표. real: 정한 식대로 실제 계산, scenario: 미리 정한 가상 시나리오(새벽전자와 비교 회사의 숫자), simple: 이 책의 단순화,
   official: 한국거래소 안내 원문으로 확인한 규칙, guide: 회계법인·법무법인 안내로만 확인한 규칙, unknown: 확인하지 못한 것, metaphor: 시각적 비유. */
const KINDS={real:'실제 계산',scenario:'미리 정한 가상 시나리오',simple:'이 책의 단순화',official:`한국거래소 안내 원문 · 확인 ${M.CHECKED}`,guide:`회계법인 안내 기준(공식 원문·현행 여부 미확인) · 확인 ${M.CHECKED}`,unknown:'확인 못함',metaphor:'시각적 비유'};
const kind=(ks,more='')=>`<br>${[].concat(ks).map(k=>`<span class="kind-tag${['guide','unknown','simple'].includes(k)?' model-tag':''}">${KINDS[k]}</span>`).join(' ')}${more?` ${more}`:''}`;
/* 규칙 숫자를 쓰는 결과 위에 붙는 확인일 문장. 규칙을 바꾸려면 js/math.js의 RULES만 고친다. */
const RULE_NOTE=`제출 기한과 감사의견에 따른 조치는 ${M.CHECKED} 확인 기준입니다. 기준과 공시 규칙은 바뀌므로 한국회계기준원·금융감독원·한국거래소의 공식 자료로 다시 확인하세요.`;
const ADVICE_NOTE='가상의 회사로 계산한 사례이며, 특정 주식을 사고팔라는 권유가 아닙니다. 학습용 계산, 투자 권유 아님.';
const svg=(label,body,h=280,vw=480)=>`<svg viewBox="0 0 ${vw} ${h}"${vw>480?' class="cols-wide"':''} role="img" aria-label="${esc(label)}">${body}</svg>`;
function table(head,rows,caption='',fit=false){return `<div class="table-wrap${fit?' fit':''}" tabindex="0" role="region" aria-label="${esc(caption||'결과 표')} · 좁은 화면에서는 옆으로 밀어 볼 수 있습니다"><table>${caption?`<caption>${esc(caption)}</caption>`:''}<thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td${fit?` data-label="${esc(String(head[i]).replace(/<[^>]+>/g,''))}"`:''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
/* 대조 한 줄: 색이 아니라 ✓/✗ 글자와 "맞음/어긋남"으로 상태를 적는다. */
const checkLine=c=>`<li class="${c.ok?'is-ok':'is-bad'}">${esc(c.name)} ${c.ok?'✓ 맞음':'✗ 어긋남'} <span class="caption">(${n1(c.left)} = ${n1(c.right)}${c.ok?'':' 아님'})</span></li>`;
const checkList=(cs,label='대조 네 줄')=>`<ul class="check-list" aria-label="${esc(label)}">${cs.map(checkLine).join('')}</ul>`;
/* 축 눈금: lo~hi를 1·2·5×10^k 간격으로 나눈 둥근 값들. */
function niceTicks(lo,hi,count=4){
 const span=hi-lo;if(!(span>0))return [lo];
 const raw=span/count,pow=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/pow,step=(f<=1?1:f<=2?2:f<=5?5:10)*pow,out=[];
 for(let v=Math.ceil(lo/step)*step;v<=hi+step*1e-9;v+=step)out.push(Math.abs(v)<step*1e-9?0:Number(v.toPrecision(12)));
 return out;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. */
function choiceOrder(n,answer,target){const order=[...Array(n).keys()];const k=((answer-target)%n+n)%n;return order.slice(k).concat(order.slice(0,k));}
return {M,josa,esc,fmt,sfmt,splus,n1,ek,sek,pct,ppct,pp,times,num,day,value,checked,fill,problem,why,range,number,date,select,check,setup,bind,on,result,KINDS,kind,RULE_NOTE,ADVICE_NOTE,svg,table,checkLine,checkList,niceTicks,choiceOrder};
})();
/* 실험 그림: 세로 막대(0선 기준, 음수는 아래로), 가로 막대 묶음, 장 카드 썸네일. 색만으로 알리지 않도록 막대마다 숫자와 이름표를 붙인다. */
Object.assign(window.SUI,(()=>{
'use strict';
const {esc,sfmt,svg,niceTicks}=SUI;
/* o = {labels, values, base, mark(i), fmt, tick, h, label, title, colors, notes}. mark(i)가 참인 막대에는 ▲ 표시를 붙인다. notes[i]는 막대 위 둘째 줄 글. */
function columns(o){
 const h=o.h||260,VW=o.vw||480,L=64,R=VW-10,T=o.title?40:22,B=h-(o.twoLine?48:32),n=o.values.length,base=o.base??0,vf=o.fmt||(v=>sfmt(v,1));
 const ext=[...o.values,base],lo0=Math.min(...ext),hi0=Math.max(...ext),pad=(hi0-lo0)*.16||1,lo=lo0<base?lo0-pad:lo0,hi=hi0+pad;
 const Y=v=>B-(v-lo)/((hi-lo)||1)*(B-T),w=(R-L)/n,bw=Math.max(6,Math.min(64,w*.62));
 let s=`<path d="M${L} ${Y(base).toFixed(1)}H${R}" stroke="var(--muted)"/>`;
 niceTicks(lo,hi,4).forEach(v=>{s+=`<text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${esc(o.tick?o.tick(v):sfmt(v,0))}</text>`;});
 o.values.forEach((v,i)=>{const x=L+i*w+(w-bw)/2,y=Math.min(Y(v),Y(base)),hh=Math.max(1,Math.abs(Y(v)-Y(base))),on=o.mark&&o.mark(i);
  s+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${hh.toFixed(1)}" rx="2" fill="${(o.colors&&o.colors[i])||(on?'var(--accent)':'var(--blue)')}"/>`;
  s+=`<text x="${(x+bw/2).toFixed(1)}" y="${(v>=base?y-6:y+hh+15).toFixed(1)}" text-anchor="middle" class="price">${on?'▲':''}${esc(o.vtext?o.vtext(v,i):vf(v))}</text>`;
  const [a,b]=String(o.labels[i]).split('|');s+=`<text x="${(x+bw/2).toFixed(1)}" y="${B+18}" text-anchor="middle" class="axis">${esc(a)}</text>`;if(b)s+=`<text x="${(x+bw/2).toFixed(1)}" y="${B+34}" text-anchor="middle" class="axis">${esc(b)}</text>`;});
 if(o.title)s+=`<text x="10" y="18" class="series">${esc(o.title)}</text>`;
 return svg(o.label||o.title||'막대 그림',s,h,VW);
}
/* 가로 막대 묶음. o = {groups:[{title, rows:[[이름, 값, 글, 강조]]}], max(그룹마다 최댓값 배열 또는 하나), label}. 값이 null이면 "없음"으로 적는다. */
function hbars(o){
 const L=120,R=400,row=22;let y=8,s='';
 o.groups.forEach((g,gi)=>{const max=[].concat(o.max)[gi]??Math.max(1,...g.rows.map(r=>r[1]||0));y+=16;s+=`<text x="10" y="${y}" class="series">${esc(g.title)}</text>`;y+=8;
  g.rows.forEach(([name,v,label,on])=>{const w=v?Math.max(2,v/max*(R-L)):0;s+=`<text x="${L-8}" y="${y+15}" text-anchor="end" class="axis">${on?'▲ ':''}${esc(name)}</text>`;if(w)s+=`<rect x="${L}" y="${y+3}" width="${w.toFixed(1)}" height="16" rx="2" fill="${on?'var(--accent)':'var(--blue)'}"/>`;s+=`<text x="${(L+w+6).toFixed(1)}" y="${y+15}" class="price">${esc(label)}</text>`;y+=row;});y+=6;});
 return svg(o.label,s,y+6);
}
function thumbnail(i){
 const sets=[['발생','현금','결산일'],['자산','부채','자본'],['매출','영업','순이익'],['순이익','조정','현금'],['손익','현금','상태'],['수익성','안정성','활동성'],['발생액','경보','기저율'],['DART','기한','감사'],['제조','유통','SW'],['2024','2025','2026']][i]||['?','?','?'];
 const colors=['var(--accent)','var(--blue)','var(--orange)'];
 const wave=`<path d="M8 30H292M8 74H292" fill="none" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 4"/>`;
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${wave}${sets.map((s,k)=>`<rect x="${12+k*96}" y="30" width="84" height="44" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><text x="${54+k*96}" y="58" text-anchor="middle" fill="var(--text)" font-size="${s.length>3?13:16}">${esc(s)}</text>`).join('')}</svg>`;
}
return {columns,hbars,thumbnail};
})());
