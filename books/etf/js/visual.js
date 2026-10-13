window.ELabs={};
window.EUI=(()=>{
'use strict';
const M=EMath;
/* 낱말 끝 받침에 맞춘 조사. josa('괴리율','을','를') → '을'. 숫자는 읽는 소리로 본다. */
const josa=(w,a,b)=>{const t=String(w),d='영일이삼사오육칠팔구'['0123456789'.indexOf(t.at(-1))]||t.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
/* 음수는 수학 기호 −로 쓴다. 반올림해서 0이 되면 부호를 떼어 −0.00이 나오지 않게 한다. */
const sfmt=(n,d=0)=>{const r=Number(Number(n).toFixed(d));return (r<0?'−':'')+fmt(Math.abs(r),d);};
const splus=(n,d=0)=>{const r=Number(Number(n).toFixed(d));return (r>0?'+':'')+sfmt(r,d);};
/* 비율은 소수로 계산하고 화면에서만 %나 %p로 바꾼다. pct(0.0375) → '3.75%', ppct(0.0013) → '+0.13%', pp(-0.002) → '−0.20%p'. */
const pct=(x,d=2)=>`${sfmt(x*100+Math.sign(x)*1e-9,d)}%`;
const ppct=(x,d=2)=>`${splus(x*100+Math.sign(x)*1e-9,d)}%`;
const pp=(x,d=2)=>`${splus(x*100+Math.sign(x)*1e-9,d)}%p`;
const won0=n=>`${sfmt(n,0)}원`;
/* 큰 금액과 좌수: 309,000,000,000 → '3,090억 원', 10,300,000 → '1,030만 좌'. 나누어떨어지지 않으면 소수 둘째 자리까지 쓴다. */
const eok=(n,d)=>`${sfmt(n/1e8,d??(Number.isInteger(Math.round(n/1e6)/100)?0:2))}억 원`;
const man=(n,unit='좌')=>`${sfmt(n/1e4,Number.isInteger(n/1e4)?0:2)}만 ${unit}`;
const hhmm=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
/* 숫자 칸 읽기: 비었거나 범위를 벗어나면 null. 오류 문장은 각 실험이 "확인해 주세요"로 보여 준다. */
function num(el,id){const x=el.querySelector('#'+id),s=x.value.trim().replace(/,/g,''),v=Number(s);if(s===''||!Number.isFinite(v))return null;if(x.min!==''&&v<+x.min)return null;if(x.max!==''&&v>+x.max)return null;return v;}
const value=(el,id)=>el.querySelector('#'+id).value;
const checked=(el,id)=>el.querySelector('#'+id).checked;
const problem=(what,why)=>`<strong>✗ ${what}${josa(what,'을','를')} 확인해 주세요</strong> · ${why}`;
function range(id,label,min,max,step,v,hint='',fmtName=''){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${fmtName==='time'?hhmm(v):v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"${fmtName?` data-fmt="${fmtName}"`:''}${hint?` aria-describedby="${id}-hint"`:''}>${hint?`<small class="hint" id="${id}-hint">${hint}</small>`:''}</label>`;}
function number(id,label,min,max,step,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="number" inputmode="decimal"${min===''?'':` min="${min}"`}${max===''?'':` max="${max}"`} step="${step}" value="${v}">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function select(id,label,options,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(text)}</option>`).join('')}</select>${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function check(id,label,on,hint=''){return `<label class="control check" for="${id}"><span class="row"><input id="${id}" type="checkbox"${on?' checked':''}><span>${label}</span></span>${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function setup(el,controls,charts=1){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart" tabindex="0" role="group" aria-label="실험 그림. 좁은 화면에서는 옆으로 밀어 볼 수 있고, 같은 숫자는 아래 결과 문장에 있습니다."></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
/* 입력이 바뀌면 다시 계산한다. 계산에 걸린 시간은 data-ms에 남겨 브라우저 검사가 읽는다. */
function bind(el,fn){
 const sync=()=>el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=x.dataset.fmt==='time'?hhmm(+x.value):fmt(x.value,(String(x.step).split('.')[1]||'').length);});
 const update=e=>{sync();const t=performance.now();fn(e);el.dataset.ms=(performance.now()-t).toFixed(1);};
 el.querySelectorAll('input,select').forEach(x=>{x.addEventListener('input',update);if(x.tagName==='SELECT'||x.type==='checkbox')x.addEventListener('change',update);});
 el.addEventListener('ef-refresh',update);update();
}
function markWide(root){root.querySelectorAll('.table-wrap').forEach(w=>w.classList.toggle('is-wide',w.scrollWidth>w.clientWidth+1));}
function result(el,chart,textHtml){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=textHtml;markWide(el);}
window.addEventListener('resize',()=>markWide(document));
/* 결과의 성격을 밝히는 꼬리표. real: 정한 식대로 실제 계산, official: 한국거래소 규정포털 원문으로 확인한 규칙(호가단위·가격제한폭·매매수량단위),
   news: 보도·안내로만 확인한 규칙(괴리율 공시 기준·LP 의무·과세 유형), scenario: 미리 정한 가상 시나리오, unknown: 확인하지 못해 이 책이 단순화한 것, metaphor: 시각적 비유. */
const KINDS={real:'실제 계산',official:'한국거래소 규정포털 원문 · 확인 2026-10-13',news:'규칙은 2026-10-13 보도·안내 기준(공식 원문 미확인)',scenario:'미리 정한 가상 시나리오',unknown:'확인 못함 · 이 책의 단순화',metaphor:'시각적 비유'};
const kind=(ks,more='')=>`<br>${[].concat(ks).map(k=>`<span class="kind-tag${k==='news'||k==='unknown'?' model-tag':''}">${KINDS[k]}</span>`).join(' ')}${more?` ${more}`:''}`;
/* 규칙 숫자를 쓰는 결과 위에 붙는 확인일 문장. 규칙을 바꾸려면 js/math.js의 RULES만 고친다. */
const RULE_NOTE=`괴리율 기준과 LP 의무는 ${M.CHECKED} 보도·안내 기준입니다. 규칙은 바뀌므로 거래 전 한국거래소 공시와 투자설명서로 확인하세요.`;
const ADVICE_NOTE='가상의 ETF로 계산한 사례이며, 고르거나 사고팔 시점을 권하는 것이 아닙니다. 계산 편의, 권유 아님.';
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
/* 괴리율의 방향을 글로 적는다(색만으로 알리지 않는다). */
const side=g=>Math.abs(g)<1e-12?'괴리 없음(시장가 = NAV)':g>0?'프리미엄(시장가가 NAV보다 비쌈)':'디스카운트(시장가가 NAV보다 쌈)';
return {M,josa,esc,fmt,sfmt,splus,pct,ppct,pp,won0,eok,man,hhmm,num,value,checked,problem,range,number,select,check,setup,bind,result,KINDS,kind,RULE_NOTE,ADVICE_NOTE,svg,table,niceTicks,choiceOrder,side};
})();
/* 실험 그림: 좌표 그래프(가로축이 숫자), 막대, 장 카드 썸네일. 색만으로 알리지 않도록 선마다 모양(실선·점선)과 글 이름표를 붙인다. */
Object.assign(window.EUI,(()=>{
'use strict';
const {esc,fmt,sfmt,svg,niceTicks}=EUI;
const COLORS=['var(--accent)','var(--text)','var(--orange)','var(--blue)'];
const DASH=['','6 4','2 3','9 3 2 3'];
const MARK=['━','┅','┈','┉'];
/* 좌표 그래프. o = {series:[{pts:[[x,y]], name, color, dash, width}], dots:[{x,y,label,shape,left}], xlim, ylim, xfmt, yfmt, xlab, hlines:[[y,글]], vlines:[[x,글]], h, label}. */
function xy(o){
 const h=o.h||280,L=64,R=466,T=34,B=h-34,S=o.series||[],D=o.dots||[];
 const xs=S.flatMap(s=>s.pts.map(p=>p[0])).concat(D.map(d=>d.x)),ys=S.flatMap(s=>s.pts.map(p=>p[1])).concat(D.map(d=>d.y),(o.hlines||[]).map(x=>x[0]));
 const [x0,x1]=o.xlim||[Math.min(...xs),Math.max(...xs)],ylo=Math.min(...ys),yhi=Math.max(...ys),pad=(yhi-ylo)*.08||Math.abs(yhi)*.05||1,[y0,y1]=o.ylim||[ylo-pad,yhi+pad];
 const X=v=>L+(v-x0)/((x1-x0)||1)*(R-L),Y=v=>B-(v-y0)/((y1-y0)||1)*(B-T),xf=o.xfmt||(v=>fmt(v)),yf=o.yfmt||(v=>fmt(v));
 let s=`<path d="M${L} ${T}V${B}H${R}" stroke="var(--line)" fill="none"/>`;
 niceTicks(y0,y1,4).forEach(v=>{s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--line)" stroke-opacity=".5"/><text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${esc(yf(v))}</text>`;});
 (o.xticks||niceTicks(x0,x1,5)).forEach(v=>{s+=`<text x="${X(v).toFixed(1)}" y="${B+17}" text-anchor="middle" class="axis">${esc(xf(v))}</text>`;});
 if(o.xlab)s+=`<text x="${R-4}" y="${B-6}" text-anchor="end" class="axis">${esc(o.xlab)}</text>`;
 (o.hlines||[]).forEach(([v,t])=>{s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--muted)" stroke-dasharray="4 4"/>${t?`<text x="${R-4}" y="${(Y(v)-5).toFixed(1)}" text-anchor="end" class="axis">${esc(t)}</text>`:''}`;});
 S.forEach((ser,k)=>{const d=ser.pts.filter(p=>Number.isFinite(p[1])).map((p,i)=>`${i?'L':'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('');const dash=ser.dash??DASH[k%4];
  s+=`<path d="${d}" fill="none" stroke="${ser.color||COLORS[k%4]}" stroke-width="${ser.width||2.4}"${dash?` stroke-dasharray="${dash}"`:''}/>`;});
 D.forEach(d=>{const x=X(d.x),y=Y(d.y),c=d.color||'var(--orange)';
  s+=d.shape==='square'?`<rect x="${(x-5).toFixed(1)}" y="${(y-5).toFixed(1)}" width="10" height="10" fill="${c}" stroke="var(--panel)" stroke-width="1.5"/>`:`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${d.r||5}" fill="${c}" stroke="${c}" stroke-width="2"/>`;
  if(d.label)s+=`<text x="${(x+(d.left?-8:8)).toFixed(1)}" y="${(y+(d.dy??-8)).toFixed(1)}" class="mark-t"${d.left?' text-anchor="end"':''}>${esc(d.label)}</text>`;});
 const named=S.filter(x=>x.name);
 if(named.length)s+=`<text x="${L}" y="16" class="series">${named.map(x=>`${x.mark||MARK[S.indexOf(x)%4]} ${esc(x.name)}`).join('   ')}</text>`;
 return svg(o.label||named.map(x=>x.name).join(', '),s,h);
}
/* 가운데 0선(또는 base선)을 두는 세로 막대. o = {labels, values, base, mark(i), fmt, tick, h, label, title, colors}. mark(i)가 참인 막대에는 ▲ 표시를 붙인다. */
function columns(o){
 const h=o.h||260,L=76,R=466,T=30,B=h-34,n=o.values.length,base=o.base??0,vf=o.fmt||(v=>sfmt(v,2));
 const ext=[...o.values,base,...(o.extra||[])],lo0=Math.min(...ext),hi0=Math.max(...ext),pad=(hi0-lo0)*.16||.1,lo=o.lo??lo0-(lo0<base?pad:0),hi=hi0+pad;
 const Y=v=>B-(v-lo)/((hi-lo)||1)*(B-T),w=(R-L)/n,bw=Math.max(4,w*.6);
 let s=`<path d="M${L} ${Y(base).toFixed(1)}H${R}" stroke="var(--muted)"/>`;
 niceTicks(lo,hi,4).forEach(v=>{s+=`<text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${esc(o.tick?o.tick(v):sfmt(v,2))}</text>`;});
 (o.hlines||[]).forEach(([v,t])=>{s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--orange)" stroke-dasharray="4 4"/><text x="${R}" y="${(Y(v)-5).toFixed(1)}" text-anchor="end" class="mark-t">${esc(t)}</text>`;});
 o.values.forEach((v,i)=>{const x=L+i*w+(w-bw)/2,y=Math.min(Y(v),Y(base)),hh=Math.max(1,Math.abs(Y(v)-Y(base))),on=o.mark&&o.mark(i);
  s+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${hh.toFixed(1)}" rx="2" fill="${(o.colors&&o.colors[i])||(on?'var(--accent)':'var(--blue)')}"/>`;
  s+=`<text x="${(x+bw/2).toFixed(1)}" y="${(v>=base?y-5:y+hh+14).toFixed(1)}" text-anchor="middle" class="axis">${on?'▲':''}${esc(vf(v))}</text>`;
  s+=`<text x="${(x+bw/2).toFixed(1)}" y="${B+18}" text-anchor="middle" class="axis">${esc(o.labels[i])}</text>`;});
 if(o.title)s+=`<text x="12" y="16" class="series">${esc(o.title)}</text>`;
 return svg(o.label||o.title||'막대 그림',s,h);
}
function thumbnail(i){
 const sets=[['합','기준','지수'],['시총','유동','동일'],['AP','CU','NAV'],['iNAV','LP','괴리'],['괴리','오차','비용'],['2배','−1배','재조정'],['채권','금','해외'],['비과세','15.4%','22%'],['보유','거래','목적'],['(가)','(나)','(다)']][i]||['?','?','?'];
 const colors=['var(--accent)','var(--blue)','var(--orange)'];
 const wave=`<path d="M8 30H292M8 74H292" fill="none" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 4"/>`;
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${wave}${sets.map((s,k)=>`<rect x="${12+k*96}" y="30" width="84" height="44" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><text x="${54+k*96}" y="58" text-anchor="middle" fill="var(--text)" font-size="${s.length>3?13:16}">${esc(s)}</text>`).join('')}</svg>`;
}
return {xy,columns,thumbnail};
})());
