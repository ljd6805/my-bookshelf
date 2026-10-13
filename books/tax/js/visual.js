window.TLabs={};
window.TUI=(()=>{
'use strict';
const M=TMath;
/* 낱말 끝 받침에 맞춘 조사. josa('하린','이','가') → '이'. 숫자는 읽는 소리로 본다. */
const josa=(w,a,b)=>{const t=String(w),d='영일이삼사오육칠팔구'['0123456789'.indexOf(t.at(-1))]||t.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
/* 음수는 수학 기호 −로 쓴다. 반올림해서 0이 되면 부호를 떼어 −0.00이 나오지 않게 한다. */
const sfmt=(n,d=0)=>{const r=Number(Number(n).toFixed(d));return (r<0?'−':'')+fmt(Math.abs(r),d);};
const splus=(n,d=0)=>{const r=Number(Number(n).toFixed(d));return (r>0?'+':'')+sfmt(r,d);};
/* 금리·수익률은 소수로 계산하고 화면에서만 %나 %p로 바꾼다. rate(0.03961) → '3.961%', pp(0.0017) → '+0.17%p'. */
const pct=(x,d=2)=>`${sfmt(x*100+Math.sign(x)*1e-9,d)}%`;
const ppct=(x,d=2)=>`${splus(x*100+Math.sign(x)*1e-9,d)}%`;
const rate=(x,d=3)=>pct(x,d);
const pp=(x,d=2)=>`${splus(x*100+Math.sign(x)*1e-9,d)}%p`;
const won=(n,d=2)=>`${sfmt(n,d)}원`;
/* 숫자 칸 읽기: 비었거나 범위를 벗어나면 null. 오류 문장은 각 실험이 "확인해 주세요"로 보여 준다. */
function num(el,id){const x=el.querySelector('#'+id),s=x.value.trim().replace(/,/g,''),v=Number(s);if(s===''||!Number.isFinite(v))return null;if(x.min!==''&&v<+x.min)return null;if(x.max!==''&&v>+x.max)return null;return v;}
const value=(el,id)=>el.querySelector('#'+id).value;
const checked=(el,id)=>el.querySelector('#'+id).checked;
const problem=(what,why)=>`<strong>✗ ${what}${josa(what,'을','를')} 확인해 주세요</strong> · ${why}`;
function range(id,label,min,max,step,v,hint=''){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"${hint?` aria-describedby="${id}-hint"`:''}>${hint?`<small class="hint" id="${id}-hint">${hint}</small>`:''}</label>`;}
function number(id,label,min,max,step,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="number" inputmode="decimal"${min===''?'':` min="${min}"`}${max===''?'':` max="${max}"`} step="${step}" value="${v}">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function select(id,label,options,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(text)}</option>`).join('')}</select>${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function check(id,label,on,hint=''){return `<label class="control check" for="${id}"><span class="row"><input id="${id}" type="checkbox"${on?' checked':''}><span>${label}</span></span>${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart" tabindex="0" role="group" aria-label="실험 그림. 좁은 화면에서는 옆으로 밀어 볼 수 있고, 같은 숫자는 아래 결과 문장에 있습니다."></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
/* 입력이 바뀌면 다시 계산한다. 계산에 걸린 시간은 data-ms에 남겨 브라우저 검사가 읽는다. */
function bind(el,fn){
 const sync=()=>el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=fmt(x.value,(String(x.step).split('.')[1]||'').length);});
 const update=e=>{sync();const t=performance.now();fn(e);el.dataset.ms=(performance.now()-t).toFixed(1);};
 el.querySelectorAll('input,select').forEach(x=>{x.addEventListener('input',update);if(x.tagName==='SELECT'||x.type==='checkbox')x.addEventListener('change',update);});
 el.addEventListener('tx-refresh',update);update();
}
function markWide(root){root.querySelectorAll('.table-wrap').forEach(w=>w.classList.toggle('is-wide',w.scrollWidth>w.clientWidth+1));}
function result(el,chart,textHtml){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=textHtml;markWide(el);}
window.addEventListener('resize',()=>markWide(document));
/* 결과의 성격을 밝히는 꼬리표. real: 정한 식대로 실제 계산, news: 2026-10-13 보도·안내로 확인한 세율·한도, scenario: 미리 정한 가상 시나리오,
   unknown: 보도로도 확인하지 못한 규칙이라 가정으로만 둔 것, metaphor: 시각적 비유. */
const KINDS={real:'실제 계산',news:'세율·한도는 2026-10-13 보도 기준',scenario:'미리 정한 가상 시나리오',unknown:'확인 못함 · 가정으로만 계산',metaphor:'시각적 비유'};
const kind=(ks,more='')=>`<br>${[].concat(ks).map(k=>`<span class="kind-tag">${KINDS[k]}</span>`).join(' ')}${more?` ${more}`:''}`;
/* 모든 실험 결과 위에 붙는 확인일 표시. 세율·한도를 바꾸려면 js/math.js의 RATES만 고친다. */
const RATE_NOTE=`세율·한도는 ${M.CHECKED} 보도·안내 기준(공식 원문 미확인)`;
const LAW_NOTE='세법은 바뀝니다. 실제 신고와 계좌 선택은 국세청 등 공식 자료나 세무 전문가와 확인해야 합니다.';
const svg=(label,body,h=280)=>`<svg viewBox="0 0 480 ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
function table(head,rows,caption=''){return `<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(caption||'결과 표')} · 좁은 화면에서는 옆으로 밀어 볼 수 있습니다"><table>${caption?`<caption>${esc(caption)}</caption>`:''}<thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
/* 축 눈금: lo~hi를 1·2·5×10^k 간격으로 나눈 둥근 값들. */
function niceTicks(lo,hi,count=4){
 const span=hi-lo;if(!(span>0))return [lo];
 const raw=span/count,pow=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/pow,step=(f<=1?1:f<=2?2:f<=5?5:10)*pow,out=[];
 for(let v=Math.ceil(lo/step)*step;v<=hi+step*1e-9;v+=step)out.push(Math.abs(v)<step*1e-9?0:Number(v.toPrecision(12)));
 return out;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. */
function choiceOrder(n,answer,target){const order=[...Array(n).keys()];const k=((answer-target)%n+n)%n;return order.slice(k).concat(order.slice(0,k));}
/* 책 전체가 함께 쓰는 가상 상품. kind는 TMath.generalTax의 과세 방식이다. tests/math.test.cjs와 같은 정의다. */
const PRODUCTS={
 stock:['새벽전자 주식','코스피·소액주주 가정'],
 kequity:['누리200 ETF','국내주식형'],
 kother:['누리 해외100 ETF','국내 상장 해외주식형'],
 foreign:['먼바다500 ETF','해외 상장'],
 bond:['나라 3년 채권','이자 + 가격 몫 가정']
};
const pname=k=>PRODUCTS[k][0];
const won0=n=>`${sfmt(n,0)}원`;
const rp=(x,d=1)=>`${sfmt(x*100+Math.sign(x)*1e-9,d)}%`;
return {M,josa,esc,fmt,sfmt,splus,pct,ppct,rate,pp,won,won0,rp,num,value,checked,problem,range,number,select,check,setup,bind,result,KINDS,kind,RATE_NOTE,LAW_NOTE,svg,table,niceTicks,choiceOrder,PRODUCTS,pname};
})();
/* 실험 그림: 좌표 그래프(가로축이 숫자), 막대, 장 카드 썸네일. 색만으로 알리지 않도록 선마다 모양(실선·점선)과 글 이름표를 붙인다. */
Object.assign(window.TUI,(()=>{
'use strict';
const {esc,fmt,sfmt,svg,niceTicks}=TUI;
const COLORS=['var(--accent)','var(--text)','var(--orange)','var(--blue)'];
const DASH=['','6 4','2 3','9 3 2 3'];
const MARK=['━','┅','┈','┉'];
/* 좌표 그래프. o = {series:[{pts:[[x,y]], name, color, dash, width}], dots:[{x,y,label,shape:'circle'|'square'|'diamond'}], xlim, ylim, xfmt, yfmt, xlab, hlines:[[y,글]], vlines:[[x,글]], h, label}.
   계열은 순서대로 강조 실선·검정 점선·주황 점선·청록 점선. 점은 모양이 다르고 이름표를 단다. */
function xy(o){
 const h=o.h||280,L=58,R=466,T=34,B=h-34,S=o.series||[],D=o.dots||[];
 const xs=S.flatMap(s=>s.pts.map(p=>p[0])).concat(D.map(d=>d.x)),ys=S.flatMap(s=>s.pts.map(p=>p[1])).concat(D.map(d=>d.y),(o.hlines||[]).map(x=>x[0]));
 const [x0,x1]=o.xlim||[Math.min(...xs),Math.max(...xs)],ylo=Math.min(...ys),yhi=Math.max(...ys),pad=(yhi-ylo)*.08||Math.abs(yhi)*.05||1,[y0,y1]=o.ylim||[ylo-pad,yhi+pad];
 const X=v=>L+(v-x0)/((x1-x0)||1)*(R-L),Y=v=>B-(v-y0)/((y1-y0)||1)*(B-T),xf=o.xfmt||(v=>fmt(v)),yf=o.yfmt||(v=>fmt(v));
 let s=`<path d="M${L} ${T}V${B}H${R}" stroke="var(--line)" fill="none"/>`;
 niceTicks(y0,y1,4).forEach(v=>{s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--line)" stroke-opacity=".5"/><text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${esc(yf(v))}</text>`;});
 (o.xticks||niceTicks(x0,x1,5)).forEach(v=>{s+=`<text x="${X(v).toFixed(1)}" y="${B+17}" text-anchor="middle" class="axis">${esc(xf(v))}</text>`;});
 if(o.xlab)s+=`<text x="${R-4}" y="${B-6}" text-anchor="end" class="axis">${esc(o.xlab)}</text>`;
 (o.hlines||[]).forEach(([v,t])=>{s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--muted)" stroke-dasharray="4 4"/>${t?`<text x="${R-4}" y="${(Y(v)-5).toFixed(1)}" text-anchor="end" class="axis">${esc(t)}</text>`:''}`;});
 (o.vlines||[]).forEach(([v,t])=>{s+=`<path d="M${X(v).toFixed(1)} ${T}V${B}" stroke="var(--orange)" stroke-dasharray="3 3"/>${t?`<text x="${Math.min(R,X(v)+4).toFixed(1)}" y="${T+12}" class="mark-t"${X(v)>R-110?' text-anchor="end"':''}>${esc(t)}</text>`:''}`;});
 S.forEach((ser,k)=>{const d=ser.pts.filter(p=>Number.isFinite(p[1])).map((p,i)=>`${i?'L':'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('');const dash=ser.dash??DASH[k%4];
  s+=`<path d="${d}" fill="none" stroke="${ser.color||COLORS[k%4]}" stroke-width="${ser.width||2.4}"${dash?` stroke-dasharray="${dash}"`:''} stroke-opacity="${ser.opacity??1}"/>`;});
 D.forEach(d=>{const x=X(d.x),y=Y(d.y),c=d.color||'var(--orange)';
  s+=d.shape==='square'?`<rect x="${(x-5).toFixed(1)}" y="${(y-5).toFixed(1)}" width="10" height="10" fill="${c}" stroke="var(--panel)" stroke-width="1.5"/>`:d.shape==='diamond'?`<path d="M${x.toFixed(1)} ${(y-7).toFixed(1)}l7 7-7 7-7-7z" fill="${c}" stroke="var(--panel)" stroke-width="1.5"/>`:`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${d.r||5}" fill="${d.hollow?'var(--panel)':c}" stroke="${c}" stroke-width="2"/>`;
  if(d.label)s+=`<text x="${(x+(d.left?-8:8)).toFixed(1)}" y="${(y+(d.dy??-8)).toFixed(1)}" class="mark-t"${d.left?' text-anchor="end"':''}>${esc(d.label)}</text>`;});
 const named=S.filter(x=>x.name);
 if(named.length)s+=`<text x="${L}" y="16" class="series">${named.map(x=>`${x.mark||MARK[S.indexOf(x)%4]} ${esc(x.name)}`).join('   ')}</text>`;
 if(o.legend2)s+=`<text x="${L}" y="30" class="axis">${esc(o.legend2)}</text>`;
 return svg(o.label||named.map(x=>x.name).join(', '),s,h);
}
/* 가운데 0선(또는 base선)을 두는 세로 막대. o = {labels, values, base, mark(i), fmt, tick, h, label, title, colors}. mark(i)가 참인 막대에는 ▲ 표시를 붙인다. */
function columns(o){
 const h=o.h||260,L=72,R=468,T=30,B=h-34,n=o.values.length,base=o.base??0,vf=o.fmt||(v=>sfmt(v,2));
 const ext=[...o.values,base,...(o.extra||[])],lo0=Math.min(...ext),hi0=Math.max(...ext),pad=(hi0-lo0)*.14||.1,lo=o.lo??lo0-pad,hi=hi0+pad;
 const Y=v=>B-(v-lo)/(hi-lo)*(B-T),w=(R-L)/n,bw=Math.max(4,w*.6);
 let s=`<path d="M${L} ${Y(base).toFixed(1)}H${R}" stroke="var(--muted)"/>`;
 niceTicks(lo,hi,4).forEach(v=>{s+=`<text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${esc(o.tick?o.tick(v):sfmt(v,2))}</text>`;});
 (o.hlines||[]).forEach(([v,t])=>{s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--orange)" stroke-dasharray="4 4"/><text x="${R}" y="${(Y(v)-5).toFixed(1)}" text-anchor="end" class="mark-t">${esc(t)}</text>`;});
 o.values.forEach((v,i)=>{const x=L+i*w+(w-bw)/2,y=Math.min(Y(v),Y(base)),hh=Math.max(1,Math.abs(Y(v)-Y(base))),on=o.mark&&o.mark(i);
  s+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${hh.toFixed(1)}" rx="2" fill="${(o.colors&&o.colors[i])||(on?'var(--accent)':'var(--blue)')}"/>`;
  if(n<=12)s+=`<text x="${(x+bw/2).toFixed(1)}" y="${(v>=base?y-5:y+hh+13).toFixed(1)}" text-anchor="middle" class="axis">${on?'▲':''}${esc(vf(v))}</text>`;
  if(n<=12)s+=`<text x="${(x+bw/2).toFixed(1)}" y="${B+18}" text-anchor="middle" class="axis">${esc(o.labels[i])}</text>`;});
 if(o.title)s+=`<text x="${L}" y="16" class="series">${esc(o.title)}</text>`;
 return svg(o.label||o.title||'막대 그림',s,h);
}
function thumbnail(i){
 const sets=[['살 때','받을 때','팔 때'],['코스피','코스닥','코넥스'],['14%','1.4%','입금'],['소액','대주주','해외'],['2,000만','넘는 몫','합계'],['국내','해외','채권'],['한도','9.9%','3년'],['공제','연금','중도'],['일반','ISA','연금'],['X','Y','Z']][i]||['?','?','?'];
 const colors=['var(--accent)','var(--blue)','var(--orange)'];
 const wave=`<path d="M8 30H292M8 74H292" fill="none" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 4"/>`;
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${wave}${sets.map((s,k)=>`<rect x="${12+k*96}" y="30" width="84" height="44" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><text x="${54+k*96}" y="58" text-anchor="middle" fill="var(--text)" font-size="${s.length>3?13:16}">${esc(s)}</text>`).join('')}</svg>`;
}
return {xy,columns,thumbnail};
})());
