window.MLabs={};
window.MUI=(()=>{
'use strict';
const M=MMath;
/* 낱말 끝 받침에 맞춘 조사. josa('경상수지','을','를') → '를'. 숫자는 읽는 소리로 본다. */
const josa=(w,a,b)=>{if(/%p?\)?$/.test(String(w)))return b;const t=String(w).replace(/[)]$/,''),d='영일이삼사오육칠팔구'['0123456789'.indexOf(t.at(-1))]||t.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
/* 음수는 수학 기호 −로 쓴다. 반올림해서 0이 되면 부호를 떼어 −0이 나오지 않게 한다. */
const sfmt=(n,d=0)=>{const r=Number((Number(n)+(n>=0?1e-9:-1e-9)).toFixed(d));return (r<0?'−':'')+fmt(Math.abs(r),d);};
const splus=(n,d=0)=>{const r=Number((Number(n)+(n>=0?1e-9:-1e-9)).toFixed(d));return (r>0?'+':'')+sfmt(r,d);};
/* 소수로 계산한 비율은 pct(0.0192,2) → '1.92%'. 모형의 입력·출력처럼 이미 % 단위인 수는 per(−0.166) → '−0.17%', ppt(0.137) → '+0.14%p'. */
const pct=(x,d=2)=>`${sfmt(x*100,d)}%`;
const spct=(x,d=2)=>`${splus(x*100,d)}%`;
const per=(x,d=2)=>`${splus(x,d)}%`;
const ppt=(x,d=2)=>`${splus(x,d)}%p`;
const won=x=>M.wonText(x);
/* 숫자 칸 읽기: 비었거나 min~max를 벗어나면 null. 틀린 칸에는 aria-invalid와 ✗ 글자를 붙이고(색만으로 알리지 않는다), 맞는 값이 들어오면 지운다. */
function flag(x,msg){const id=x.id+'-err';let e=x.parentElement.querySelector('#'+id);const keep=(x.getAttribute('aria-describedby')||'').split(' ').filter(t=>t&&t!==id);
 if(!msg){x.removeAttribute('aria-invalid');if(e)e.remove();if(keep.length)x.setAttribute('aria-describedby',keep.join(' '));else x.removeAttribute('aria-describedby');return;}
 if(!e){e=document.createElement('small');e.className='field-error';e.id=id;x.insertAdjacentElement('afterend',e);}
 e.textContent='✗ '+msg;x.setAttribute('aria-invalid','true');x.setAttribute('aria-describedby',[...keep,id].join(' '));}
const dec=s=>(String(s).split('.')[1]||'').length;
function num(el,id){const x=el.querySelector('#'+id),s=x.value.trim().replace(/,/g,''),v=Number(s);
 const range=x.min!==''&&x.max!==''?`${sfmt(+x.min,dec(x.min))}~${sfmt(+x.max,dec(x.max))} 사이로 넣어 주세요`:x.min!==''?`${sfmt(+x.min,dec(x.min))} 이상으로 넣어 주세요`:`${sfmt(+x.max,dec(x.max))} 이하로 넣어 주세요`;
 if(s===''||!Number.isFinite(v)){flag(x,'숫자를 넣어 주세요');return null;}
 if((x.min!==''&&v<+x.min)||(x.max!==''&&v>+x.max)){flag(x,range);return null;}
 flag(x,'');return v;}
/* 쉼표로 나눈 숫자 목록 칸(8장). 숫자가 아닌 것이 섞이면 null. */
function list(el,id){const x=el.querySelector('#'+id),parts=x.value.split(/[,\s]+/).filter(Boolean).map(s=>s.replace(/^−/,'-')),v=parts.map(Number);
 if(parts.length<3||v.some(n=>!Number.isFinite(n))){flag(x,'쉼표로 나눈 숫자를 세 개 이상 넣어 주세요');return null;}flag(x,'');return v;}
const value=(el,id)=>el.querySelector('#'+id).value;
const checked=(el,id)=>el.querySelector('#'+id).checked;
const problem=(what,why)=>`<strong>✗ ${what}${josa(what,'을','를')} 확인해 주세요</strong> · ${why}`;
/* 계산 함수(js/math.js)가 던진 RangeError를 독자가 읽는 말로 옮긴다. */
const WHY=[[/weights must add up to 1/,'가중치의 합이 100%가 아니라 지수를 계산하지 않습니다.'],[/GDP must be > 0/,'지출의 합이 0 이하라 GDP와 비중을 계산하지 않습니다.'],[/pop15 must be/,'15세 이상 인구가 취업자와 실업자의 합보다 작습니다.'],[/labor force must be > 0/,'취업자와 실업자가 모두 0이라 실업률을 계산할 수 없습니다.'],[/n must be a whole number/,'구직을 포기한 사람은 0명부터 실업자 수까지 정수로 넣어야 합니다.'],[/no variation/,'한쪽 목록의 숫자가 모두 같아 상관계수를 계산할 수 없습니다.'],[/same length/,'두 목록의 숫자 개수가 같아야 합니다.'],[/lag must be/,'짝을 셋 이상 남기려면 시차를 줄여야 합니다.'],[/not open in the/,'이 장에서는 열지 않은 손잡이입니다.'],[/loses meaning|must be between/,'계산할 수 있는 범위를 벗어났습니다.'],[/must be > 0/,'0보다 커야 하는 값입니다.'],[/must be ≥ 0/,'0 이상이어야 하는 값입니다.']];
const why=e=>(WHY.find(([re])=>re.test(String(e&&e.message)))||[0,'입력한 값으로는 계산할 수 없습니다.'])[1];
const tidy=v=>typeof v==='number'&&isFinite(v)?Number(v.toFixed(8)):v;
function range(id,label,min,max,step,v,hint=''){v=tidy(v);return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"${hint?` aria-describedby="${id}-hint"`:''}>${hint?`<small class="hint" id="${id}-hint">${hint}</small>`:''}</label>`;}
function number(id,label,min,max,step,v,hint=''){v=tidy(v);return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="number" inputmode="decimal"${min===''?'':` min="${min}"`}${max===''?'':` max="${max}"`} step="${step}" value="${v}">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function text(id,label,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="text" autocomplete="off" value="${esc(v)}">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function select(id,label,options,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,t])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(t)}</option>`).join('')}</select>${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function check(id,label,on,hint=''){return `<label class="control check" for="${id}"><span class="row"><input id="${id}" type="checkbox"${on?' checked':''}><span>${label}</span></span>${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
const group=(legend,body)=>`<fieldset class="cards"><legend>${legend}</legend>${body}</fieldset>`;
/* wide: 조작 칸을 위에, 그림·표를 아래에 한 줄로 놓는다(표가 넓은 실험). */
function setup(el,controls,wide=false){el.innerHTML=`<div class="lab-columns${wide?' wide':''}"><div class="controls">${controls}</div><div class="chart" tabindex="0" role="group" aria-label="실험 그림과 표. 같은 숫자는 아래 결과 문장에도 있습니다."></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
/* 입력이 바뀌면 다시 계산한다. 계산에 걸린 시간은 data-ms에 남겨 브라우저 검사가 읽는다. [data-free] 안의 메모 칸은 계산에 쓰지 않는다. */
function bind(el,fn){
 const sync=()=>el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=sfmt(x.value,dec(x.step));});
 const update=e=>{sync();const t=performance.now();fn(e);el.dataset.ms=(performance.now()-t).toFixed(1);};
 el.querySelectorAll('input,select').forEach(x=>{if(x.closest('[data-free]'))return;x.addEventListener('input',update);if(x.tagName==='SELECT'||x.type==='checkbox')x.addEventListener('change',update);});
 on(el,'lab-refresh',update);update();
}
/* 실험을 다시 그릴 때(초기화) 같은 상자에 처리기가 쌓이지 않도록 종류마다 하나만 둔다. */
function on(el,type,fn){el._ml=el._ml||{};if(el._ml[type])el.removeEventListener(type,el._ml[type]);el._ml[type]=fn;el.addEventListener(type,fn);}
function markWide(root){root.querySelectorAll('.table-wrap').forEach(w=>w.classList.toggle('is-wide',w.scrollWidth>w.clientWidth+1));}
function result(el,chart,textHtml){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=textHtml;markWide(el);}
window.addEventListener('resize',()=>markWide(document));
/* 결과의 성격을 밝히는 꼬리표(책 AGENTS.md): 실제 계산, 공식 원문(재게시), 보도 기준, 교재 정의, 미리 정한 가상 시나리오, 미리 정한 시나리오 모형, 확인 못함, 시각적 비유. */
const KINDS={real:'실제 계산',official:'공식 원문(재게시)',news:'보도 기준',textbook:'교재 정의',scenario:'미리 정한 가상 시나리오',model:'미리 정한 시나리오 모형',unknown:'확인 못함',metaphor:'시각적 비유'};
const kind=(ks,more='')=>`<br>${[].concat(ks).map(k=>`<span class="kind-tag${['news','unknown','model'].includes(k)?' model-tag':''}">${KINDS[k]}</span>`).join(' ')}${more?` ${more}`:''}`;
const RATE_NOTE='기준금리와 통계는 바뀌므로 확인일을 보고 다시 확인하세요.';
const DISCLAIMER='가상의 경제와 가상의 발표로 만든 사례이며, 실제 시장 가격의 예측이나 매매 권유가 아닙니다.';
const P=M.MARKET.policyRate;
const RATE_FACT=`기준금리는 ${M.CHECKED} 확인 기준 연 ${sfmt(P.value,2)}%(${P.decided} 결정, ${P.grade})이고, 다음 결정은 ${P.next}입니다.`;
/* 모형 화면마다 붙이는 고정 문구(MODEL.label). */
const modelBanner=(more='')=>`<p class="model-banner"><b>${M.MODEL.label}</b>${more?`<br>${more}`:''}</p>`;
/* 이례적 값 상자: 머리에 “이례적 값 · 등급 · 확인일”을 적는다. 계산 결과가 아니라 확인용으로만 보인다. */
const unusual=(grade,body)=>`<div class="unusual-box" role="note"><b>이례적 값 · ${grade} · 확인일 ${M.CHECKED}</b><br>${body}</div>`;
const svg=(label,body,h=280,vw=480)=>`<svg viewBox="0 0 ${vw} ${h}"${vw>480?' class="cols-wide"':''} role="img" aria-label="${esc(label)}">${body}</svg>`;
/* fit: 좁은 화면에서 행마다 칸을 위아래로 쌓는다. 'cards': 칸이 많은 표를 행마다 카드로 묶는다. 두 경우 모두 칸 이름을 data-label로 붙인다. */
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
return {M,josa,esc,fmt,sfmt,splus,pct,spct,per,ppt,won,num,list,value,checked,problem,why,range,number,text,select,check,group,setup,bind,on,result,KINDS,kind,RATE_NOTE,DISCLAIMER,RATE_FACT,modelBanner,unusual,svg,table,niceTicks,choiceOrder};
})();
/* 실험 그림: 세로 막대(0선 기준, 음수는 아래로), 가로 막대 묶음, 분기 꺾은선, 장 카드 썸네일. 색만으로 알리지 않도록 막대와 선마다 숫자·이름표·모양을 붙인다. */
Object.assign(window.MUI,(()=>{
'use strict';
const {esc,sfmt,svg,niceTicks}=MUI;
/* o = {labels, values, base, mark(i), fmt, tick, h, vw, label, title, colors, twoLine}. mark(i)가 참인 막대에는 ▲ 표시를 붙인다. */
function columns(o){
 const h=o.h||260,VW=o.vw||480,L=64,R=VW-10,T=o.title?40:22,B=h-(o.twoLine?48:32),n=o.values.length,base=o.base??0,vf=o.fmt||(v=>sfmt(v,1));
 const ext=[...o.values,base],lo0=Math.min(...ext),hi0=Math.max(...ext),pad=(hi0-lo0)*.16||1,lo=lo0<base?lo0-pad:lo0,hi=hi0+pad;
 const Y=v=>B-(v-lo)/((hi-lo)||1)*(B-T),w=(R-L)/n,bw=Math.max(6,Math.min(64,w*.62));
 let s=`<path d="M${L} ${Y(base).toFixed(1)}H${R}" stroke="var(--muted)"/>`;
 niceTicks(lo,hi,4).forEach(v=>{s+=`<text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${esc(o.tick?o.tick(v):sfmt(v,0))}</text>`;});
 o.values.forEach((v,i)=>{const x=L+i*w+(w-bw)/2,y=Math.min(Y(v),Y(base)),hh=Math.max(1,Math.abs(Y(v)-Y(base))),on=o.mark&&o.mark(i);
  s+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${hh.toFixed(1)}" rx="2" fill="${(o.colors&&o.colors[i])||(v<base?'var(--orange)':on?'var(--accent)':'var(--blue)')}"/>`;
  s+=`<text x="${(x+bw/2).toFixed(1)}" y="${(v>=base?y-6:y+hh+15).toFixed(1)}" text-anchor="middle" class="price">${on?'▲':''}${esc(vf(v,i))}</text>`;
  const [a,b]=String(o.labels[i]).split('|');s+=`<text x="${(x+bw/2).toFixed(1)}" y="${B+18}" text-anchor="middle" class="axis">${esc(a)}</text>`;if(b)s+=`<text x="${(x+bw/2).toFixed(1)}" y="${B+34}" text-anchor="middle" class="axis">${esc(b)}</text>`;});
 if(o.title)s+=`<text x="10" y="18" class="series">${esc(o.title)}</text>`;
 return svg(o.label||o.title||'막대 그림',s,h,VW);
}
/* 가로 막대 묶음. o = {groups:[{title, rows:[[이름, 값, 글, 강조]]}], max, label}. 음수는 0 기준선 왼쪽으로 그린다. */
function hbars(o){
 const L=o.left||130,R=o.right||380,row=22;let y=8,s='';
 o.groups.forEach((g,gi)=>{const max=[].concat(o.max)[gi]??Math.max(1e-9,...g.rows.map(r=>Math.abs(r[1]||0)));y+=16;s+=`<text x="10" y="${y}" class="series">${esc(g.title)}</text>`;y+=8;
  const neg=Math.max(0,...g.rows.map(r=>-(r[1]||0))),span=neg>0?Math.max(0,...g.rows.map(r=>r[1]||0))+neg:max,Z=L+neg/span*(R-L),k=(R-L)/span,y0=y;
  g.rows.forEach(([name,v,label,on])=>{const w=v?Math.max(2,Math.abs(v)*k):0,x=v<0?Z-w:Z;s+=`<text x="${L-8}" y="${y+15}" text-anchor="end" class="axis">${on?'▲ ':''}${esc(name)}</text>`;if(w)s+=`<rect x="${x.toFixed(1)}" y="${y+3}" width="${w.toFixed(1)}" height="16" rx="2" fill="${v<0?'var(--orange)':on?'var(--accent)':'var(--blue)'}"/>`;s+=`<text x="${((v<0?Z:Z+w)+6).toFixed(1)}" y="${y+15}" class="price">${esc(label)}</text>`;y+=row;});
  if(neg>0)s+=`<path d="M${Z.toFixed(1)} ${y0}V${y}" stroke="var(--muted)"/>`;y+=6;});
 return svg(o.label,s,y+6);
}
/* 분기 꺾은선. o = {series:[{name, values, color, dash, shape}], labels, mark(i), tick, title, label, h, vw}. 선마다 점 모양(● ■ ▲ ◆)과 이름을 함께 적어 색 없이도 가린다. */
const SHAPES={'●':(x,y,c)=>`<circle cx="${x}" cy="${y}" r="3.6" fill="${c}"/>`,'■':(x,y,c)=>`<rect x="${(x-3.4).toFixed(1)}" y="${(y-3.4).toFixed(1)}" width="6.8" height="6.8" fill="${c}"/>`,'▲':(x,y,c)=>`<path d="M${x} ${(y-4.4).toFixed(1)}l4 7.4h-8z" fill="${c}"/>`,'◆':(x,y,c)=>`<path d="M${x} ${(y-4.6).toFixed(1)}l4 4.6l-4 4.6l-4-4.6z" fill="${c}"/>`};
function lines(o){
 const h=o.h||270,VW=o.vw||480,L=56,R=VW-14,T=o.title?40:20,B=h-(o.legend===false?30:34+20*o.series.length),n=o.labels.length;
 const all=o.series.flatMap(s=>s.values).concat(0),lo0=Math.min(...all),hi0=Math.max(...all),pad=(hi0-lo0)*.12||0.5,lo=lo0-pad,hi=hi0+pad;
 const X=i=>L+(n>1?i/(n-1):0.5)*(R-L),Y=v=>B-(v-lo)/((hi-lo)||1)*(B-T);
 let s=`<path d="M${L} ${Y(0).toFixed(1)}H${R}" stroke="var(--muted)"/>`;
 niceTicks(lo,hi,4).forEach(v=>{s+=`<text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${esc(o.tick?o.tick(v):sfmt(v,2))}</text>`;});
 const every=n>8?2:1;o.labels.forEach((t,i)=>{if(i%every===0||(o.mark&&o.mark(i)))s+=`<text x="${X(i).toFixed(1)}" y="${B+16}" text-anchor="middle" class="axis">${o.mark&&o.mark(i)?'▲':''}${esc(t)}</text>`;});
 if(o.mark)o.labels.forEach((t,i)=>{if(o.mark(i))s+=`<path d="M${X(i).toFixed(1)} ${T}V${B}" stroke="var(--accent)" stroke-dasharray="3 3"/>`;});
 o.series.forEach((se,k)=>{const c=se.color||['var(--blue)','var(--orange)','var(--accent)','var(--muted)'][k%4],sh=se.shape||['●','■','▲','◆'][k%4];
  s+=`<path d="M${se.values.map((v,i)=>`${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('L')}" fill="none" stroke="${c}" stroke-width="2.4"${se.dash?' stroke-dasharray="6 4"':''}/>`;
  se.values.forEach((v,i)=>{s+=SHAPES[sh](X(i).toFixed(1),Y(v),c);});
  if(o.legend!==false){const lx=12,ly=B+40+20*k;s+=SHAPES[sh](lx+6,ly-4,c)+`<text x="${lx+16}" y="${ly}" class="axis">${esc(sh+' '+se.name)}</text>`;}});
 if(o.title)s+=`<text x="10" y="18" class="series">${esc(o.title)}</text>`;
 return svg(o.label||o.title,s,h,VW);
}
function thumbnail(i){
 const sets=[['C+I+G','X − M','실질'],['가중치','지수','상승률'],['실업률','고용률','갭'],['금리','환율','물가'],['지출','GDP','합'],['달러','× 환율','원화'],['상품','서비스','경상'],['선행','시차','r'],['1997','2008','2020'],['3.4%','가설','지표']][i]||['?','?','?'];
 const colors=['var(--accent)','var(--blue)','var(--orange)'];
 const wave=`<path d="M8 30H292M8 74H292" fill="none" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 4"/>`;
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${wave}${sets.map((s,k)=>`<rect x="${12+k*96}" y="30" width="84" height="44" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><text x="${54+k*96}" y="58" text-anchor="middle" fill="var(--text)" font-size="${s.length>4?13:16}">${esc(s)}</text>`).join('')}</svg>`;
}
return {columns,hbars,lines,thumbnail};
})());
