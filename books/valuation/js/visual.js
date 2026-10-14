window.VLabs={};
window.VUI=(()=>{
'use strict';
const M=VMath;
/* 낱말 끝 받침에 맞춘 조사. josa('주당 가치','을','를') → '를'. 숫자는 읽는 소리로 본다. */
const josa=(w,a,b)=>{if(/%p?\)?$/.test(String(w)))return b;const t=String(w).replace(/[)]$/,''),d='영일이삼사오육칠팔구'['0123456789'.indexOf(t.at(-1))]||t.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
/* 음수는 수학 기호 −로 쓴다. 반올림해서 0이 되면 부호를 떼어 −0이 나오지 않게 한다. */
const sfmt=(n,d=0)=>{const r=Number(Number(n).toFixed(d));return (r<0?'−':'')+fmt(Math.abs(r),d);};
const splus=(n,d=0)=>{const r=Number(Number(n).toFixed(d));return (r>0?'+':'')+sfmt(r,d);};
/* 금액은 억 원 소수 첫째 자리(정수면 소수점 없음), 주당 값은 원, 민감도 표는 10원. n1(2662.15) → '2,662.2', won(22749.5) → '22,750원'. */
const n1=x=>{const r=M.r1(x);return sfmt(r,Number.isInteger(r)?0:1);};
const n1f=x=>sfmt(M.r1(x),1);
const ek=x=>`${n1(x)}억 원`;
const won=x=>`${sfmt(Math.round(x+(x>=0?1e-9:-1e-9)))}원`;
const swon=x=>`${Math.round(x)>0?'+':''}${won(x)}`;
const won10=x=>sfmt(M.r10(x));
/* 비율은 소수로 계산하고 화면에서만 %·%p·배로 바꾼다. pct(0.0914,2) → '9.14%', pp(0.01) → '+1.0%p'. */
const pct=(x,d=1)=>`${sfmt(x*100+Math.sign(x)*1e-9,d)}%`;
const pp=(x,d=1)=>`${splus(x*100+Math.sign(x)*1e-9,d)}%p`;
const times=(x,d=2,unit='배')=>`${sfmt(x,d)}${unit}`;
/* 숫자 칸 읽기: 비었거나 min~max를 벗어나면 null. 오류 문장은 각 실험이 "확인해 주세요"로 보여 준다. */
/* 칸 옆 오류 표시: 틀린 칸에는 aria-invalid와 ✗ 글자를 붙이고(색만으로 알리지 않는다), 맞는 값이 들어오면 지운다. 초기화는 실험을 다시 그려 함께 지운다. */
function flag(x,msg){const id=x.id+'-err';let e=x.parentElement.querySelector('#'+id);const keep=(x.getAttribute('aria-describedby')||'').split(' ').filter(t=>t&&t!==id);
 if(!msg){x.removeAttribute('aria-invalid');if(e)e.remove();if(keep.length)x.setAttribute('aria-describedby',keep.join(' '));else x.removeAttribute('aria-describedby');return;}
 if(!e){e=document.createElement('small');e.className='field-error';e.id=id;x.insertAdjacentElement('afterend',e);}
 e.textContent='✗ '+msg;x.setAttribute('aria-invalid','true');x.setAttribute('aria-describedby',[...keep,id].join(' '));}
function num(el,id){const x=el.querySelector('#'+id),s=x.value.trim().replace(/,/g,''),v=Number(s);
 const range=x.min!==''&&x.max!==''?`${fmt(+x.min,(x.min.split('.')[1]||'').length)}~${fmt(+x.max,(x.max.split('.')[1]||'').length)} 사이로 넣어 주세요`:x.min!==''?`${fmt(+x.min,(x.min.split('.')[1]||'').length)} 이상으로 넣어 주세요`:`${fmt(+x.max,(x.max.split('.')[1]||'').length)} 이하로 넣어 주세요`;
 if(s===''||!Number.isFinite(v)){flag(x,'숫자를 넣어 주세요');return null;}
 if((x.min!==''&&v<+x.min)||(x.max!==''&&v>+x.max)){flag(x,range);return null;}
 flag(x,'');return v;}
const value=(el,id)=>el.querySelector('#'+id).value;
const checked=(el,id)=>el.querySelector('#'+id).checked;
const problem=(what,why)=>`<strong>✗ ${what}${josa(what,'을','를')} 확인해 주세요</strong> · ${why}`;
/* 계산 함수(js/math.js)가 던진 RangeError를 독자가 읽는 말로 옮긴다. */
const WHY=[[/g ≥ r/,'g ≥ r이라 계산하지 않습니다. 영구성장률이 할인율보다 낮아야 영구가치가 유한한 값이 됩니다.'],[/EPS must be > 0/,'EPS가 0 이하라 PER을 계산할 수 없습니다.'],[/BPS must be > 0/,'BPS가 0 이하라 PBR을 계산할 수 없습니다.'],[/no solution between/,'정해 둔 범위 안에서 DCF 주당 가치가 주가와 같아지는 값이 없습니다.'],[/each assumption once/,'같은 가정을 두 번 골랐습니다. 네 가정을 한 번씩 고르세요.'],[/not both 0/,'주식과 부채의 시장가가 둘 다 0이라 비중을 계산할 수 없습니다.'],[/must be between/,'계산할 수 있는 범위를 벗어났습니다.'],[/must be > 0/,'0보다 커야 하는 값입니다.']];
const why=e=>(WHY.find(([re])=>re.test(String(e&&e.message)))||[0,'입력한 값으로는 계산할 수 없습니다.'])[1];
const tidy=v=>typeof v==='number'&&isFinite(v)?Number(v.toFixed(8)):v;
function range(id,label,min,max,step,v,hint=''){v=tidy(v);return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"${hint?` aria-describedby="${id}-hint"`:''}>${hint?`<small class="hint" id="${id}-hint">${hint}</small>`:''}</label>`;}
function number(id,label,min,max,step,v,hint=''){v=tidy(v);return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="number" inputmode="decimal"${min===''?'':` min="${min}"`}${max===''?'':` max="${max}"`} step="${step}" value="${v}">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function select(id,label,options,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(text)}</option>`).join('')}</select>${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function check(id,label,on,hint=''){return `<label class="control check" for="${id}"><span class="row"><input id="${id}" type="checkbox"${on?' checked':''}><span>${label}</span></span>${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
const group=(legend,body)=>`<fieldset class="cards"><legend>${legend}</legend>${body}</fieldset>`;
/* wide: 조작 칸을 위에, 그림·표를 아래에 한 줄로 놓는다(표가 넓은 실험). */
function setup(el,controls,wide=false){el.innerHTML=`<div class="lab-columns${wide?' wide':''}"><div class="controls">${controls}</div><div class="chart" tabindex="0" role="group" aria-label="실험 그림과 표. 같은 숫자는 아래 결과 문장에도 있습니다."></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
/* 입력이 바뀌면 다시 계산한다. 계산에 걸린 시간은 data-ms에 남겨 브라우저 검사가 읽는다. */
function bind(el,fn){
 const sync=()=>el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=fmt(x.value,(String(x.step).split('.')[1]||'').length);});
 const update=e=>{sync();const t=performance.now();fn(e);el.dataset.ms=(performance.now()-t).toFixed(1);};
 el.querySelectorAll('input,select').forEach(x=>{if(x.closest('[data-free]'))return;x.addEventListener('input',update);if(x.tagName==='SELECT'||x.type==='checkbox')x.addEventListener('change',update);});
 on(el,'lab-refresh',update);update();
}
/* 실험을 다시 그릴 때(초기화) 같은 상자에 처리기가 쌓이지 않도록 종류마다 하나만 둔다. */
function on(el,type,fn){el._vl=el._vl||{};if(el._vl[type])el.removeEventListener(type,el._vl[type]);el._vl[type]=fn;el.addEventListener(type,fn);}
function markWide(root){root.querySelectorAll('.table-wrap').forEach(w=>w.classList.toggle('is-wide',w.scrollWidth>w.clientWidth+1));}
function result(el,chart,textHtml){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=textHtml;markWide(el);}
window.addEventListener('resize',()=>markWide(document));
/* 결과의 성격을 밝히는 꼬리표. real: 정한 식대로 실제 계산, scenario: 미리 정한 가상 시나리오(새벽전자·비교 회사·분석가의 숫자), simple: 이 책의 단순화,
   academic: 대학 교재·강의 원문으로 확인한 식, news: 보도·2차 자료로 확인한 시장 숫자, estimate: 교수 개인 추정치, official·guide: 정기보고서 기한의 출처 등급,
   unknown: 확인하지 못한 것, metaphor: 시각적 비유. */
const KINDS={real:'실제 계산',scenario:'미리 정한 가상 시나리오',simple:'이 책의 단순화',academic:'대학 교재·강의 원문',news:'보도·2차 자료',estimate:'교수 추정치',official:`공식 원문(5권 조사 노트) · 확인 ${M.CHECKED}`,guide:`회계법인 안내 기준(공식 원문·현행 여부 미확인) · 확인 ${M.CHECKED}`,unknown:'확인 못함',metaphor:'시각적 비유'};
const kind=(ks,more='')=>`<br>${[].concat(ks).map(k=>`<span class="kind-tag${['guide','unknown','simple','news','estimate'].includes(k)?' model-tag':''}">${KINDS[k]}</span>`).join(' ')}${more?` ${more}`:''}`;
/* 시장 숫자의 확인일과 출처 등급(js/math.js MARKET). 계산에 쓴 값과 원래 값을 함께 적는다. */
const GRADE={news:'보도·2차 자료',estimate:'교수 추정치',series:'앞선 권의 가상 설정',assumption:'이 책의 가정',academic:'대학 교재·강의 원문'};
const RATE_NAME={rf:['국고채 10년 금리',3],erp:['한국 주식 위험 프리미엄',2],kd:['새벽전자 3년 회사채 할인 금리',3],beta:['베타',1]};
const rateTag=key=>{const m=M.MARKET[key],[name,d]=RATE_NAME[key],v=m.raw??m.value;return `<span class="kind-tag model-tag">${name} ${key==='beta'?sfmt(v,1):pct(v,d)} · ${m.edition?`${m.edition}, ${m.checked} 확인`:`확인일 ${m.date}`} · ${GRADE[m.grade]}</span>`;};
const RATE_NOTE='금리와 위험 프리미엄은 바뀌므로 확인일을 보고 다시 확인하세요.';
const ADVICE_NOTE='가상의 회사와 가상의 분석가로 계산한 사례이며, 특정 주식을 사고팔라는 권유가 아닙니다. 학습용 계산, 투자 권유 아님.';
const svg=(label,body,h=280,vw=480)=>`<svg viewBox="0 0 ${vw} ${h}"${vw>480?' class="cols-wide"':''} role="img" aria-label="${esc(label)}">${body}</svg>`;
/* fit: 좁은 화면에서 행마다 칸을 위아래로 쌓는다. 'cards': 민감도 표처럼 칸이 많은 표를 행마다 카드로 묶고 칸을 여러 줄로 감싼다. 두 경우 모두 칸 이름을 data-label로 붙인다. */
function table(head,rows,caption='',fit=false){const cls=fit==='cards'?' cards':fit==='compact'?' compact':fit==='task'?' fit task':fit?' fit':'';return `<div class="table-wrap${cls}" tabindex="0" role="region" aria-label="${esc(caption||'결과 표')}"><table>${caption?`<caption>${esc(caption)}</caption>`:''}<thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td${fit?` data-label="${esc(String(head[i]).replace(/<[^>]+>/g,''))}"`:''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
/* 축 눈금: lo~hi를 1·2·5×10^k 간격으로 나눈 둥근 값들. */
function niceTicks(lo,hi,count=4){
 const span=hi-lo;if(!(span>0))return [lo];
 const raw=span/count,pow=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/pow,step=(f<=1?1:f<=2?2:f<=5?5:10)*pow,out=[];
 for(let v=Math.ceil(lo/step)*step;v<=hi+step*1e-9;v+=step)out.push(Math.abs(v)<step*1e-9?0:Number(v.toPrecision(12)));
 return out;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. */
function choiceOrder(n,answer,target){const order=[...Array(n).keys()];const k=((answer-target)%n+n)%n;return order.slice(k).concat(order.slice(0,k));}
return {M,josa,esc,fmt,sfmt,splus,n1,n1f,ek,won,swon,won10,pct,pp,times,num,value,checked,problem,why,range,number,select,check,group,setup,bind,on,result,KINDS,kind,GRADE,rateTag,RATE_NOTE,ADVICE_NOTE,svg,table,niceTicks,choiceOrder};
})();
/* 실험 그림: 세로 막대(0선 기준, 음수는 아래로), 가로 막대 묶음, 계단 막대, 장 카드 썸네일. 색만으로 알리지 않도록 막대마다 숫자와 이름표를 붙인다. */
Object.assign(window.VUI,(()=>{
'use strict';
const {esc,sfmt,svg,niceTicks}=VUI;
/* o = {labels, values, base, mark(i), fmt, tick, h, vw, label, title, colors, twoLine}. mark(i)가 참인 막대에는 ▲ 표시를 붙인다. */
function columns(o){
 const h=o.h||260,VW=o.vw||480,L=64,R=VW-10,T=o.title?40:22,B=h-(o.twoLine?48:32),n=o.values.length,base=o.base??0,vf=o.fmt||(v=>sfmt(v,1));
 const ext=[...o.values,base],lo0=Math.min(...ext),hi0=Math.max(...ext),pad=(hi0-lo0)*.16||1,lo=lo0<base?lo0-pad:lo0,hi=hi0+pad;
 const Y=v=>B-(v-lo)/((hi-lo)||1)*(B-T),w=(R-L)/n,bw=Math.max(6,Math.min(64,w*.62));
 let s=`<path d="M${L} ${Y(base).toFixed(1)}H${R}" stroke="var(--muted)"/>`;
 niceTicks(lo,hi,4).forEach(v=>{s+=`<text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${esc(o.tick?o.tick(v):sfmt(v,0))}</text>`;});
 o.values.forEach((v,i)=>{const x=L+i*w+(w-bw)/2,y=Math.min(Y(v),Y(base)),hh=Math.max(1,Math.abs(Y(v)-Y(base))),on=o.mark&&o.mark(i);
  s+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${hh.toFixed(1)}" rx="2" fill="${(o.colors&&o.colors[i])||(on?'var(--accent)':'var(--blue)')}"/>`;
  s+=`<text x="${(x+bw/2).toFixed(1)}" y="${(v>=base?y-6:y+hh+15).toFixed(1)}" text-anchor="middle" class="price">${on?'▲':''}${esc(vf(v,i))}</text>`;
  const [a,b]=String(o.labels[i]).split('|');s+=`<text x="${(x+bw/2).toFixed(1)}" y="${B+18}" text-anchor="middle" class="axis">${esc(a)}</text>`;if(b)s+=`<text x="${(x+bw/2).toFixed(1)}" y="${B+34}" text-anchor="middle" class="axis">${esc(b)}</text>`;});
 if(o.title)s+=`<text x="10" y="18" class="series">${esc(o.title)}</text>`;
 return svg(o.label||o.title||'막대 그림',s,h,VW);
}
/* 계단 막대: 시작 막대에서 몫을 차례로 더하고 빼 끝 막대에 닿는다. steps=[[이름, 몫]], 처음과 끝은 전체 막대. 몫의 부호를 +·−로도 적는다. */
function waterfall(o){
 const h=o.h||270,VW=o.vw||480,L=60,R=VW-10,T=o.title?40:22,B=h-(o.twoLine?48:32),items=[[o.start[0],o.start[1],'total'],...o.steps.map(s=>[s[0],s[1],'step']),[o.end[0],o.end[1],'total']];
 let run=0;const bars=items.map(([n,v,k])=>{const a=k==='total'?0:run,b=k==='total'?v:run+v;run=k==='total'?v:run+v;return {n,v,k,a,b};});
 const ext=bars.flatMap(b=>[b.a,b.b]),lo=Math.min(0,...ext),hi=Math.max(...ext)*1.14,Y=v=>B-(v-lo)/((hi-lo)||1)*(B-T),w=(R-L)/bars.length,bw=Math.max(6,Math.min(56,w*.62)),vf=o.fmt||(v=>sfmt(v,0));
 let s=`<path d="M${L} ${Y(0).toFixed(1)}H${R}" stroke="var(--muted)"/>`;
 niceTicks(lo,hi,4).forEach(v=>{s+=`<text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${esc(o.tick?o.tick(v):sfmt(v,0))}</text>`;});
 bars.forEach((b,i)=>{const x=L+i*w+(w-bw)/2,top=Y(Math.max(b.a,b.b)),hh=Math.max(1,Math.abs(Y(b.a)-Y(b.b))),col=b.k==='total'?'var(--blue)':b.v>=0?'var(--accent)':'var(--orange)';
  s+=`<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${hh.toFixed(1)}" rx="2" fill="${col}"/>`;
  s+=`<text x="${(x+bw/2).toFixed(1)}" y="${(top-6).toFixed(1)}" text-anchor="middle" class="price">${b.k==='step'&&b.v>0?'+':''}${esc(vf(b.v))}</text>`;
  const [p,q]=String(b.n).split('|');s+=`<text x="${(x+bw/2).toFixed(1)}" y="${B+18}" text-anchor="middle" class="axis">${esc(p)}</text>`;if(q)s+=`<text x="${(x+bw/2).toFixed(1)}" y="${B+34}" text-anchor="middle" class="axis">${esc(q)}</text>`;});
 if(o.title)s+=`<text x="10" y="18" class="series">${esc(o.title)}</text>`;
 return svg(o.label||o.title,s,h,VW);
}
/* 가로 막대 묶음. o = {groups:[{title, rows:[[이름, 값, 글, 강조]]}], max, label}. 값이 null이면 막대 없이 글만 적는다. */
function hbars(o){
 const L=o.left||130,R=o.right||380,row=22;let y=8,s='';
 o.groups.forEach((g,gi)=>{const max=[].concat(o.max)[gi]??Math.max(1e-9,...g.rows.map(r=>Math.abs(r[1]||0)));y+=16;s+=`<text x="10" y="${y}" class="series">${esc(g.title)}</text>`;y+=8;
  /* 음수가 있으면 0 기준선을 오른쪽으로 옮겨 음수 막대는 왼쪽으로, 양수 막대는 오른쪽으로 그린다. */
  const neg=Math.max(0,...g.rows.map(r=>-(r[1]||0))),span=neg>0?Math.max(0,...g.rows.map(r=>r[1]||0))+neg:max,Z=L+neg/span*(R-L),k=(R-L)/span,y0=y;
  g.rows.forEach(([name,v,label,on])=>{const w=v?Math.max(2,Math.abs(v)*k):0,x=v<0?Z-w:Z;s+=`<text x="${L-8}" y="${y+15}" text-anchor="end" class="axis">${on?'▲ ':''}${esc(name)}</text>`;if(w)s+=`<rect x="${x.toFixed(1)}" y="${y+3}" width="${w.toFixed(1)}" height="16" rx="2" fill="${v<0?'var(--orange)':on?'var(--accent)':'var(--blue)'}"/>`;s+=`<text x="${((v<0?Z:Z+w)+6).toFixed(1)}" y="${y+15}" class="price">${esc(label)}</text>`;y+=row;});
  if(neg>0)s+=`<path d="M${Z.toFixed(1)} ${y0}V${y}" stroke="var(--muted)"/>`;y+=6;});
 return svg(o.label,s,y+6);
}
function thumbnail(i){
 const sets=[['주가','EPS','BPS'],['PER','ROE','PBR'],['배당','성장률','r'],['시총','순차입','EV'],['FCFF','할인','합'],['국고채','β','WACC'],['g','r − g','영구'],['할인율','이익률','표'],['주가','역산','g'],['A','B','차이']][i]||['?','?','?'];
 const colors=['var(--accent)','var(--blue)','var(--orange)'];
 const wave=`<path d="M8 30H292M8 74H292" fill="none" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 4"/>`;
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${wave}${sets.map((s,k)=>`<rect x="${12+k*96}" y="30" width="84" height="44" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><text x="${54+k*96}" y="58" text-anchor="middle" fill="var(--text)" font-size="${s.length>3?13:16}">${esc(s)}</text>`).join('')}</svg>`;
}
return {columns,waterfall,hbars,thumbnail};
})());
