window.ALabs={};
window.AUI=(()=>{
'use strict';
const M=AMath;
/* 낱말 끝 받침에 맞춘 조사. josa('표준편차','을','를') → '를'. 숫자는 읽는 소리로 본다. */
const josa=(w,a,b)=>{if(/%p?\)?$/.test(String(w)))return b;const t=String(w).replace(/[)]$/,''),d='영일이삼사오육칠팔구'['0123456789'.indexOf(t.at(-1))]||t.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
/* 음수는 수학 기호 −로 쓴다. 반올림은 5에서 올림(1e-9 밀기)이고, 반올림해서 0이 되면 부호를 뗀다. */
const sfmt=(n,d=0)=>{const r=M.round(Number(n),d);return (r<0?'−':'')+fmt(Math.abs(r),d);};
const splus=(n,d=0)=>{const r=M.round(Number(n),d);return (r>0?'+':'')+sfmt(r,d);};
/* 소수로 계산한 비율: pct(0.1825) → '18.25%', ppt(0.0182) → '1.82%p'. */
const pct=(x,d=2)=>`${sfmt(x*100,d)}%`;
const spct=(x,d=2)=>`${splus(x*100,d)}%`;
const ppt=(x,d=2)=>`${sfmt(x*100,d)}%p`;
const won=x=>M.wonText(x);
/* 숫자 칸 읽기: 비었거나 min~max를 벗어나면 null. 틀린 칸에는 aria-invalid와 ✗ 글자를 붙이고(색만으로 알리지 않는다), 맞는 값이 들어오면 지운다. */
function flag(x,msg){const id=x.id+'-err';let e=x.parentElement.querySelector('#'+id);const keep=(x.getAttribute('aria-describedby')||'').split(' ').filter(t=>t&&t!==id);
 if(!msg){x.removeAttribute('aria-invalid');if(e)e.remove();if(keep.length)x.setAttribute('aria-describedby',keep.join(' '));else x.removeAttribute('aria-describedby');return;}
 if(!e){e=document.createElement('small');e.className='field-error';e.id=id;x.insertAdjacentElement('afterend',e);}
 e.textContent='✗ '+msg;x.setAttribute('aria-invalid','true');x.setAttribute('aria-describedby',[...keep,id].join(' '));}
const dec=s=>(String(s).split('.')[1]||'').length;
function num(el,id,whole=false){const x=el.querySelector('#'+id),s=x.value.trim().replace(/,/g,'').replace(/^−/,'-'),v=Number(s);
 const range=x.min!==''&&x.max!==''?`${sfmt(+x.min,dec(x.min))}~${sfmt(+x.max,dec(x.max))} 사이로 넣어 주세요`:x.min!==''?`${sfmt(+x.min,dec(x.min))} 이상으로 넣어 주세요`:`${sfmt(+x.max,dec(x.max))} 이하로 넣어 주세요`;
 if(s===''||!Number.isFinite(v)){flag(x,'숫자를 넣어 주세요');return null;}
 if((x.min!==''&&v<+x.min)||(x.max!==''&&v>+x.max)){flag(x,range);return null;}
 if(whole&&!Number.isInteger(v)){flag(x,'정수로 넣어 주세요');return null;}
 flag(x,'');return v;}
/* 쉼표로 나눈 숫자 목록 칸. min개보다 적거나 숫자가 아닌 것이 섞이면 null. */
function list(el,id,min=3){const x=el.querySelector('#'+id),parts=x.value.split(/[,\s]+/).filter(Boolean).map(s=>s.replace(/^−/,'-')),v=parts.map(Number);
 if(parts.length<min||v.some(n=>!Number.isFinite(n))){flag(x,min>1?`쉼표로 나눈 숫자를 ${min}개 이상 넣어 주세요`:'쉼표로 나눈 숫자를 넣어 주세요');return null;}flag(x,'');return v;}
const value=(el,id)=>el.querySelector('#'+id).value;
const checked=(el,id)=>el.querySelector('#'+id).checked;
const problem=(what,why)=>`<strong>✗ ${what}${josa(what,'을','를')} 확인해 주세요</strong> · ${why}`;
/* 계산 함수(js/math.js)가 던진 RangeError를 독자가 읽는 말로 옮긴다. */
const WHY=[[/weights must add up to 1/,'비중의 합이 100%가 아닙니다.'],[/rho below/,'종목이 N개이면 모든 짝의 상관이 −1 ÷ (N − 1)보다 작을 수 없습니다.'],[/move as one/,'두 자산이 똑같이 움직여(상관 1, 같은 표준편차) 최소분산 비중이 하나로 정해지지 않습니다.'],
 [/no variation/,'시장 수익률이 모두 같아 베타를 계산할 수 없습니다.'],[/same length/,'두 목록의 숫자 개수가 같아야 합니다(3개 이상).'],[/below the minimum/,'이 목표는 두 자산으로 만들 수 있는 가장 작은 표준편차보다 낮습니다.'],[/above the stock-only/,'이 목표는 주식만 담은 표준편차보다 높습니다.'],
 [/0 < p < 1/,'승률은 0과 1 사이, 배당 b는 0보다 커야 합니다.'],[/f must be between/,'건 비율은 0 이상 1 미만이어야 합니다.'],[/single stock/,'이 과제에서 IRP는 개별 주식(새벽전자)을 담지 않습니다. IRP 안 새벽전자는 0이어야 합니다.'],[/IRP holdings must add up/,'IRP 안 금액의 합이 1억 원(10,000만 원)이어야 합니다.'],
 [/IRP cannot hold more/,'IRP에 담은 금액이 그 자산의 전체 금액보다 많습니다. 비중을 늘리거나 IRP 금액을 줄여 주세요.'],[/general account/,'일반 계좌 금액의 합이 2억 원이 되지 않습니다.'],[/no short selling/,'비중은 0 이상이어야 합니다(공매도 없음).'],[/zero-risk/,'위험이 0인 안이라 위험 기여를 계산하지 않습니다.'],
 [/sigma must be > 0/,'표준편차가 0보다 커야 샤프 비율을 계산할 수 있습니다.'],[/singular/,'두 자산이 같은 값이라 계산이 하나로 정해지지 않습니다.'],[/must be/,'계산할 수 있는 범위를 벗어났습니다.']];
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
function on(el,type,fn){el._al=el._al||{};if(el._al[type])el.removeEventListener(type,el._al[type]);el._al[type]=fn;el.addEventListener(type,fn);}
function markWide(root){root.querySelectorAll('.table-wrap').forEach(w=>w.classList.toggle('is-wide',w.scrollWidth>w.clientWidth+1));}
function result(el,chart,textHtml){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=textHtml;markWide(el);}
window.addEventListener('resize',()=>markWide(document));
/* 결과의 성격을 밝히는 꼬리표(책 AGENTS.md): 실제 계산, 미리 정한 가정, 서재 안 재인용, 보도 기준, 교재 정의, 학술 서지, 확인 못함, 시각적 비유. */
const KINDS={real:'실제 계산',assume:'미리 정한 가정',relay:'서재 안 재인용',news:'보도 기준',textbook:'교재 정의',paper:'학술 서지',unknown:'확인 못함',metaphor:'시각적 비유'};
const kind=(ks,more='')=>`<br>${[].concat(ks).map(k=>`<span class="kind-tag${['news','unknown','relay'].includes(k)?' warn-tag':''}">${KINDS[k]}</span>`).join(' ')}${more?` ${more}`:''}`;
/* 고정 문구: 다섯 자산의 가정 꼬리표, 비중 문구, 재확인 문장, 마지막 과제 면책 문장, 켈리 문장(content.js·math.js와 같은 말). */
const LABEL=M.ASSETS.label,WEIGHTS=M.ASSETS.weightsNote,RECHECK=M.MARKET.recheck+'.';
const DISCLAIMER='가상의 인물과 가정으로 만든 계산 연습이며, 실제 계좌의 비중을 권하지 않습니다. 실제 결정에는 세금·비용·소득·건강·다른 자산을 함께 보아야 합니다.';
const KELLY='이 비율은 따르는 값이 아니라 가정이 얼마나 공격적인지 보여 주는 값이며, 이 책은 돈을 빌려 이 비율을 채우는 계산을 하지 않는다.';
const banner=(more='')=>`<p class="assume-banner"><b>${LABEL}</b>${more?`<br>${more}`:''}</p>`;
/* 시점에 묶인 값(⏱)은 값·꼬리표·확인일을 함께 적는다. key: pensionLimit, tdfException, rf10y, erp. */
function timed(key){const v=M.MARKET[key],val=key==='pensionLimit'?`위험자산 한도 ${sfmt(v.value*100,0)}%`:key==='tdfException'?'적격 TDF는 이 한도의 예외':key==='rf10y'?`국고채 10년 금리 ${pct(v.value,1)}`:`주식 위험 프리미엄 ${pct(v.value,1)}`;
 return `<span class="time-tag">⏱ ${val} · ${v.label} · ${v.checked} 확인 기준</span>`;}
const verdict=(ok,yes='만족',no='만족하지 못함')=>ok?`<span class="verdict ok">✓ ${yes}</span>`:`<span class="verdict bad">✗ ${no}</span>`;
const svg=(label,body,h=280,vw=480)=>`<svg viewBox="0 0 ${vw} ${h}"${vw>480?' class="cols-wide"':''} role="img" aria-label="${esc(label)}">${body}</svg>`;
/* fit: 좁은 화면에서 행마다 칸을 위아래로 쌓는다. 'cards': 칸이 많은 표를 행마다 카드로 묶는다. 'compact': 칸을 좁혀 한 표로 둔다. */
function table(head,rows,caption='',fit=false){const cls=fit==='cards'?' cards':fit==='compact'?' compact':fit?' fit':'';return `<div class="table-wrap${cls}" tabindex="0" role="region" aria-label="${esc(caption||'결과 표')}"><table>${caption?`<caption>${esc(caption)}</caption>`:''}<thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>`<td${fit?` data-label="${esc(String(head[i]).replace(/<[^>]+>/g,''))}"`:''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
/* 축 눈금: lo~hi를 1·2·5×10^k 간격으로 나눈 둥근 값들. */
function niceTicks(lo,hi,count=4){
 const span=hi-lo;if(!(span>0))return [lo];
 const raw=span/count,pow=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/pow,step=(f<=1?1:f<=2?2:f<=5?5:10)*pow,out=[];
 for(let v=Math.ceil(lo/step-1e-9)*step;v<=hi+step*1e-9;v+=step)out.push(Math.abs(v)<step*1e-9?0:Number(v.toPrecision(12)));
 return out;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. */
function choiceOrder(n,answer,target){const order=[...Array(n).keys()];const k=((answer-target)%n+n)%n;return order.slice(k).concat(order.slice(0,k));}
/* 바꿔 넣은 가정(무위험 금리·누리200 기대수익)으로 fn을 계산하고 되돌린다. math.js의 tangencyShift와 같은 방식이다. */
function withAssume(o,fn){const keepRf=M.ASSUME.rf,keepMu=M.ASSETS.mu.slice();try{if(o.rf!=null)M.ASSUME.rf=o.rf;if(o.mu)o.mu.forEach((v,i)=>{if(v!=null)M.ASSETS.mu[i]=v;});return fn();}finally{M.ASSUME.rf=keepRf;keepMu.forEach((v,i)=>{M.ASSETS.mu[i]=v;});}}
return {M,josa,esc,fmt,sfmt,splus,pct,spct,ppt,won,num,list,value,checked,problem,why,range,number,text,select,check,group,setup,bind,on,result,KINDS,kind,LABEL,WEIGHTS,RECHECK,DISCLAIMER,KELLY,banner,timed,verdict,svg,table,niceTicks,choiceOrder,withAssume};
})();
/* 실험 그림: 세로 막대(0선 기준, 음수는 아래로), 가로 막대 묶음, 수치 축 그림(점·곡선·직선), 장 카드 썸네일.
   막대와 선은 값에 비례해 그리고(축은 0 또는 데이터 범위에서 시작), 색만으로 가리지 않도록 숫자·이름표·점 모양(● ■ ▲ ◆ ○)·선 무늬를 함께 둔다. */
Object.assign(window.AUI,(()=>{
'use strict';
const {esc,sfmt,svg,niceTicks}=AUI;
/* o = {labels, values, base, mark(i), fmt, tick, h, vw, label, title, colors, twoLine, ref:{value,text}}. mark(i)가 참인 막대에는 ▲ 표시를 붙인다. */
function columns(o){
 const h=o.h||260,VW=o.vw||480,L=64,R=VW-10,T=o.title?(o.ref?54:40):22,B=h-(o.twoLine?52:32),n=o.values.length,base=o.base??0,vf=o.fmt||(v=>sfmt(v,1));
 const ext=[...o.values,base].concat(o.ref?[o.ref.value]:[]),lo0=Math.min(...ext),hi0=Math.max(...ext),pad=(hi0-lo0)*.16||1,lo=lo0<base?lo0-pad:lo0,hi=hi0+pad;
 const Y=v=>B-(v-lo)/((hi-lo)||1)*(B-T),w=(R-L)/n,bw=Math.max(6,Math.min(64,w*.62));
 let s=`<path d="M${L} ${Y(base).toFixed(1)}H${R}" stroke="var(--muted)"/>`;
 niceTicks(lo,hi,4).forEach(v=>{s+=`<text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${esc(o.tick?o.tick(v):sfmt(v,0))}</text>`;});
 o.values.forEach((v,i)=>{const x=L+i*w+(w-bw)/2,y=Math.min(Y(v),Y(base)),hh=Math.max(1,Math.abs(Y(v)-Y(base))),on=o.mark&&o.mark(i);
  s+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${hh.toFixed(1)}" rx="2" fill="${(o.colors&&o.colors[i])||(v<base?'var(--orange)':on?'var(--accent)':'var(--blue)')}"/>`;
  s+=`<text x="${(x+bw/2).toFixed(1)}" y="${(v>=base?y-6:y+hh+15).toFixed(1)}" text-anchor="middle" class="price">${on?'▲':''}${esc(vf(v,i))}</text>`;
  const [a,b]=String(o.labels[i]).split('|');s+=`<text x="${(x+bw/2).toFixed(1)}" y="${B+18}" text-anchor="middle" class="axis">${esc(a)}</text>`;if(b)s+=`<text x="${(x+bw/2).toFixed(1)}" y="${B+37}" text-anchor="middle" class="axis">${esc(b)}</text>`;});
 if(o.ref){const y=Y(o.ref.value).toFixed(1);s+=`<path d="M${L} ${y}H${R}" stroke="var(--orange)" stroke-dasharray="6 4"/><path d="M${L} ${T-16}h22" stroke="var(--orange)" stroke-dasharray="6 4"/><text x="${L+28}" y="${T-12}" class="mark-t">${esc(o.ref.text)} (점선)</text>`;}
 if(o.title)s+=`<text x="10" y="18" class="series">${esc(o.title)}</text>`;
 return svg(o.label||o.title||'막대 그림',s,h,VW);
}
/* 가로 막대 묶음. o = {groups:[{title, rows:[[이름, 값, 글, 강조]]}], max, label}. 음수는 0 기준선 왼쪽으로 그린다. */
function hbars(o){
 const L=o.left||130,R=o.right||380,row=24;let y=8,s='';
 o.groups.forEach((g,gi)=>{const max=[].concat(o.max)[gi]??Math.max(1e-9,...g.rows.map(r=>Math.abs(r[1]||0)));y+=16;s+=`<text x="10" y="${y}" class="series">${esc(g.title)}</text>`;y+=8;
  const neg=Math.max(0,...g.rows.map(r=>-(r[1]||0))),span=neg>0?Math.max(0,...g.rows.map(r=>r[1]||0))+neg:max,Z=L+neg/span*(R-L),k=(R-L)/span,y0=y;
  g.rows.forEach(([name,v,label,on])=>{const w=v?Math.max(2,Math.abs(v)*k):0,x=v<0?Z-w:Z;s+=`<text x="${L-8}" y="${y+15}" text-anchor="end" class="axis">${on?'▲ ':''}${esc(name)}</text>`;if(w)s+=`<rect x="${x.toFixed(1)}" y="${y+3}" width="${w.toFixed(1)}" height="16" rx="2" fill="${v<0?'var(--orange)':on?'var(--accent)':'var(--blue)'}"/>`;s+=`<text x="${((v<0?Z:Z+w)+6).toFixed(1)}" y="${y+15}" class="price">${esc(label)}</text>`;y+=row;});
  s+=`<path d="M${Z.toFixed(1)} ${y0}V${y}" stroke="var(--muted)"/>`;y+=6;});
 return svg(o.label,s,y+6,o.vw||480);
}
/* 점 모양: 색 없이도 계열을 가린다. */
const SHAPES={'●':(x,y,c)=>`<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`,'○':(x,y,c)=>`<circle cx="${x}" cy="${y}" r="4.2" fill="var(--chart)" stroke="${c}" stroke-width="2"/>`,'■':(x,y,c)=>`<rect x="${(x-3.8).toFixed(1)}" y="${(y-3.8).toFixed(1)}" width="7.6" height="7.6" fill="${c}"/>`,
 '▲':(x,y,c)=>`<path d="M${x} ${(y-5).toFixed(1)}l4.6 8.4h-9.2z" fill="${c}"/>`,'◆':(x,y,c)=>`<path d="M${x} ${(y-5.4).toFixed(1)}l4.6 5.4l-4.6 5.4l-4.6-5.4z" fill="${c}"/>`};
const DASH={solid:'',dash:'7 4',dot:'2 4',long:'12 5'};
/* 수치 축 그림. o = {series:[{name, pts:[[x,y]], dash, color, width, marks:[i], shape}], points:[{name, x, y, shape, color, text, dx, dy, anchor}], refs:[{x|y, text}],
   xmin, xmax, ymin, ymax, xtick, ytick, xlabel, ylabel, title, label, h, vw}. 범례는 그림 아래 한 줄에 하나씩(좁은 화면에서도 잘리지 않음). */
function xy(o){
 const VW=o.vw||480,legend=[...(o.dotsName?[{name:o.dotsName,dots:true}]:[]),...o.series.filter(s=>s.name),...(o.points||[]).filter(p=>p.name)],h=o.h||300,L=60,R=VW-16,T=o.title?48:24,B=h-40-legend.length*21;
 const xs=[...o.series.flatMap(s=>s.pts.map(p=>p[0])),...(o.points||[]).map(p=>p.x),...(o.dots||[]).map(p=>p[0]),...(o.refs||[]).filter(r=>r.x!=null).map(r=>r.x)],ys=[...o.series.flatMap(s=>s.pts.map(p=>p[1])),...(o.points||[]).map(p=>p.y),...(o.dots||[]).map(p=>p[1]),...(o.refs||[]).filter(r=>r.y!=null).map(r=>r.y)];
 const x0=o.xmin??Math.min(...xs),x1=o.xmax??Math.max(...xs),y0=o.ymin??Math.min(...ys),y1=o.ymax??Math.max(...ys);
 const X=v=>L+(v-x0)/((x1-x0)||1)*(R-L),Y=v=>B-(v-y0)/((y1-y0)||1)*(B-T),c=v=>v.toFixed(1);
 let s=`<path d="M${L} ${T}V${B}H${R}" fill="none" stroke="var(--muted)"/>`;
 niceTicks(y0,y1,4).forEach(v=>{s+=`<path d="M${L} ${c(Y(v))}H${R}" stroke="var(--line)" stroke-dasharray="2 4"/><text x="${L-6}" y="${c(Y(v)+4)}" text-anchor="end" class="axis">${esc(o.ytick?o.ytick(v):sfmt(v,0))}</text>`;});
 niceTicks(x0,x1,o.xcount||4).forEach(v=>{s+=`<text x="${c(X(v))}" y="${B+17}" text-anchor="${X(v)-L<10?'start':'middle'}" class="axis">${esc(o.xtick?o.xtick(v):sfmt(v,0))}</text>`;});
 if(o.xlabel)s+=`<text x="${R}" y="${B+36}" text-anchor="end" class="axis">${esc(o.xlabel)}</text>`;
 if(o.ylabel)s+=`<text x="${L}" y="${T-10}" class="axis">${esc(o.ylabel)}</text>`;
 (o.refs||[]).forEach(r=>{if(r.y!=null){const y=c(Y(r.y));s+=`<path d="M${L} ${y}H${R}" stroke="var(--orange)" stroke-dasharray="6 4"/>${r.text?`<text x="${R}" y="${c(Y(r.y)-5)}" text-anchor="end" class="mark-t">${esc(r.text)}</text>`:''}`;}
  else{const x=c(X(r.x));s+=`<path d="M${x} ${T}V${B}" stroke="var(--orange)" stroke-dasharray="6 4"/>${r.text?`<text x="${c(X(r.x)+(r.anchor==='end'?-5:5))}" y="${T+12}" text-anchor="${r.anchor||'start'}" class="mark-t">${esc(r.text)}</text>`:''}`;}});
 (o.dots||[]).forEach(p=>{s+=`<circle cx="${c(X(p[0]))}" cy="${c(Y(p[1]))}" r="1.8" fill="var(--muted)" opacity=".55"/>`;});
 o.series.forEach((se,k)=>{const col=se.color||['var(--blue)','var(--accent)','var(--orange)','var(--muted)'][k%4];
  s+=`<path d="M${se.pts.map(p=>`${c(X(p[0]))} ${c(Y(p[1]))}`).join('L')}" fill="none" stroke="${col}" stroke-width="${se.width||2.4}"${DASH[se.dash||'solid']?` stroke-dasharray="${DASH[se.dash]}"`:''}/>`;
  (se.marks||[]).forEach(i=>{const p=se.pts[i];if(p)s+=SHAPES[se.shape||'●'](c(X(p[0])),Y(p[1]),col);});});
 (o.points||[]).forEach(p=>{const col=p.color||'var(--accent)';s+=SHAPES[p.shape||'●'](c(X(p.x)),Y(p.y),col);if(p.text)s+=`<text x="${c(X(p.x)+(p.dx??8))}" y="${c(Y(p.y)+(p.dy??4))}" text-anchor="${p.anchor||'start'}" class="price">${esc(p.text)}</text>`;});
 legend.forEach((it,k)=>{const ly=B+52+21*k,col=it.color||(it.pts?['var(--blue)','var(--accent)','var(--orange)','var(--muted)'][o.series.indexOf(it)%4]:'var(--accent)');
  s+=it.dots?`<circle cx="27" cy="${ly-5}" r="2.4" fill="var(--muted)"/>`:it.pts?`<path d="M14 ${ly-5}H40" stroke="${col}" stroke-width="${it.width||2.4}"${DASH[it.dash||'solid']?` stroke-dasharray="${DASH[it.dash]}"`:''}/>`+(it.marks&&it.marks.length?SHAPES[it.shape||'●'](27,ly-5,col):''):SHAPES[it.shape||'●'](27,ly-5,col);
  s+=`<text x="48" y="${ly}" class="axis">${esc(it.name)}</text>`;});
 if(o.title)s+=`<text x="10" y="18" class="series">${esc(o.title)}</text>`;
 return svg(o.label||o.title,s,h,VW);
}
function thumbnail(i){
 const sets=[['N','ρ','바닥'],['Σ','wᵀΣw','고윳값'],['w','σ','최소'],['투자선','샤프','접점'],['Cov','β','CAPM'],['주식','채권','현금'],['비중','띠','매매'],['f*','g(f)','하위 10%'],['평상시','위기','σ'],['조건 1','조건 2','IRP']][i]||['?','?','?'];
 const colors=['var(--accent)','var(--blue)','var(--orange)'];
 const wave=`<path d="M8 30H292M8 74H292" fill="none" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 4"/>`;
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${wave}${sets.map((s,k)=>`<rect x="${12+k*96}" y="30" width="84" height="44" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><text x="${54+k*96}" y="58" text-anchor="middle" fill="var(--text)" font-size="${s.length>4?13:16}">${esc(s)}</text>`).join('')}</svg>`;
}
return {columns,hbars,xy,thumbnail,SHAPES};
})());
