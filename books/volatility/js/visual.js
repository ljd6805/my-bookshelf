window.VLabs={};
window.VUI=(()=>{
'use strict';
const M=VMath;
/* 낱말 끝 받침에 맞춘 조사. josa('하린','이','가') → '이'. 숫자는 읽는 소리로 본다. */
const josa=(w,a,b)=>{const t=String(w),d='영일이삼사오육칠팔구'['0123456789'.indexOf(t.at(-1))]||t.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
/* 음수는 수학 기호 −로 쓴다. 반올림해서 0이 되면 부호를 떼어 −0.00이 나오지 않게 한다. */
const sfmt=(n,d=0)=>{const r=Number(Number(n).toFixed(d));return (r<0?'−':'')+fmt(Math.abs(r),d);};
const splus=(n,d=0)=>{const r=Number(Number(n).toFixed(d));return (r>0?'+':'')+sfmt(r,d);};
/* 수익률은 소수로 계산하고 화면에서만 %로 바꾼다. pct(−0.0539) → '−5.39%', ppct는 + 부호를 붙인다. */
const pct=(x,d=2)=>`${sfmt(x*100,d)}%`;
const ppct=(x,d=2)=>`${splus(x*100,d)}%`;
const won=n=>`${sfmt(n,0)}원`;
/* 숫자 칸 읽기: 비었거나 범위를 벗어나면 null. 오류 문장은 각 실험이 "확인해 주세요"로 보여 준다. */
function num(el,id){const x=el.querySelector('#'+id),s=x.value.trim().replace(/,/g,''),v=Number(s);if(s===''||!Number.isFinite(v))return null;if(x.min!==''&&v<+x.min)return null;if(x.max!==''&&v>+x.max)return null;return v;}
const value=(el,id)=>el.querySelector('#'+id).value;
const problem=(what,why)=>`<strong>✗ ${what}${josa(what,'을','를')} 확인해 주세요</strong> · ${why}`;
/* 쉼표로 적은 숫자 목록. 숫자가 아니거나 개수·범위를 벗어나면 null. */
function list(el,id,{min=0,max=1e9,count=[2,12]}={}){const s=el.querySelector('#'+id).value.trim();if(!s)return null;const a=s.split(/[,\s]+/).filter(Boolean).map(v=>Number(v.replace(/,/g,'')));if(a.length<count[0]||a.length>count[1]||a.some(v=>!Number.isFinite(v)||v<min||v>max))return null;return a;}
function range(id,label,min,max,step,v,hint=''){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"${hint?` aria-describedby="${id}-hint"`:''}>${hint?`<small class="hint" id="${id}-hint">${hint}</small>`:''}</label>`;}
function number(id,label,min,max,step,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${v}">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function select(id,label,options,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(text)}</option>`).join('')}</select>${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function text(id,label,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="text" value="${esc(v)}" autocomplete="off" spellcheck="false">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart" tabindex="0" role="group" aria-label="실험 그림. 좁은 화면에서는 옆으로 밀어 볼 수 있고, 같은 숫자는 아래 결과 문장에 있습니다."></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
/* 입력이 바뀌면 다시 계산한다. 계산에 걸린 시간은 data-ms에 남겨 브라우저 검사가 읽는다(결과 문장에는 넣지 않는다). */
function bind(el,fn){
 const update=e=>{el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=fmt(x.value,(String(x.step).split('.')[1]||'').length);});const t=performance.now();fn(e);el.dataset.ms=(performance.now()-t).toFixed(1);};
 el.querySelectorAll('input,select').forEach(x=>{x.addEventListener('input',update);if(x.tagName==='SELECT')x.addEventListener('change',update);});update();
}
function result(el,chart,textHtml){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=textHtml;}
/* 실험 결과의 성격을 밝히는 꼬리표. real: 정한 식대로 실제 계산, scenario: 미리 정한 가상 경로, gen: 시드를 밝힌 생성기 경로, metaphor: 시각적 비유. */
const KINDS={real:'실제 계산',scenario:'미리 정한 가상 경로',gen:'생성기 · 시드를 밝힌 가상 경로',metaphor:'시각적 비유'};
const kind=(ks,more='')=>`<br>${[].concat(ks).map(k=>`<span class="kind-tag">${KINDS[k]}</span>`).join(' ')}${more?` ${more}`:''}`;
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
/* 같은 입력의 계산은 한 번만 한다(초기화와 비교 예제가 바로 돌아오도록). 몬테카를로 결과도 여기에 남는다. */
const cache=new Map();
const memo=(key,f)=>{if(!cache.has(key))cache.set(key,f());return cache.get(key);};
/* 제자리 경로처럼 하루씩 지그재그인 값은 이틀마다(한 쌍이 끝난 날) 값만 그려 흐름이 보이게 한다. */
const pairEnds=a=>a.filter((_,i)=>i%2===0);
const median=a=>{const s=[...a].sort((x,y)=>x-y),n=s.length;return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2;};
/* 책 전체가 함께 쓰는 가상 기록. tests/math.test.cjs와 같은 정의다.
   새벽전자 1년(앞 120일은 12권 13장 시나리오, 뒤 130일은 생성기 시드 20), 누리200 1년(생성기 시드 524, 하루 1.2%), 제자리 경로(+a와 1/(1+a)−1을 125번). */
const DATA={
 year:()=>memo('year',()=>M.saebyeokYear()),
 closes:()=>memo('closes',()=>DATA.year().map(b=>b.close)),
 returns:()=>memo('returns',()=>M.logReturns(DATA.closes())),
 nuri:()=>memo('nuri',()=>M.randomWalk({n:250,vol:.012,seed:524})),
 flat:a=>memo('flat'+a,()=>M.flatVolatileReturns(a,125))
};
return {M,josa,esc,fmt,sfmt,splus,pct,ppct,won,num,value,problem,list,range,number,select,text,setup,bind,result,KINDS,kind,svg,table,niceTicks,choiceOrder,memo,median,pairEnds,DATA};
})();
/* 실험 그림: 여러 선 그래프, 막대(가운데 0선), 분포(히스토그램), 장 카드 썸네일. 색만으로 알리지 않도록 선마다 모양(실선·점선)과 글 이름표를 붙인다. */
Object.assign(window.VUI,(()=>{
'use strict';
const {esc,fmt,sfmt,svg,niceTicks}=VUI;
const COLORS=['var(--text)','var(--accent)','var(--orange)','var(--blue)'];
const DASH=['','6 4','2 3','9 3 2 3'];
/* 선 그래프. o = {series:[{values, name, width}], h, yfmt, band:[lo,hi,글], hlines:[[값,글]], vmark:[[칸,글]], vspan:[처음 칸, 끝 칸, 글], xunit, label, log}.
   가로축은 칸 순서(0부터), xunit이 있으면 그 단위로 눈금을 적는다. 계열은 순서대로 검정 실선·강조 점선·주황 점선·파랑 점선. */
function lines(o){
 const h=o.h||280,L=62,R=468,T=34,B=h-30,S=o.series,n=Math.max(...S.map(s=>s.values.length));
 const ys=S.flatMap(s=>s.values.filter(Number.isFinite)).concat(o.band?o.band.slice(0,2):[],(o.hlines||[]).map(x=>x[0]));
 const lo0=Math.min(...ys),hi0=Math.max(...ys),pad=(hi0-lo0)*.06||Math.abs(hi0)*.05||1,lo=lo0-pad,hi=hi0+pad,yf=o.yfmt||(v=>fmt(v));
 const X=i=>L+i/Math.max(1,n-1)*(R-L),Y=v=>B-(v-lo)/(hi-lo)*(B-T);
 let s=`<path d="M${L} ${T}V${B}H${R}" stroke="var(--line)" fill="none"/>`;
 if(o.band)s+=`<rect x="${L}" y="${Y(o.band[1]).toFixed(1)}" width="${R-L}" height="${Math.max(1,Y(o.band[0])-Y(o.band[1])).toFixed(1)}" fill="var(--accent)" opacity=".1"/>`+(o.band[2]?`<text x="${R-4}" y="${(Y(o.band[1])+14).toFixed(1)}" text-anchor="end" class="axis">${esc(o.band[2])}</text>`:'');
 if(o.vspan)s+=`<rect x="${X(o.vspan[0]).toFixed(1)}" y="${T}" width="${Math.max(1,X(o.vspan[1])-X(o.vspan[0])).toFixed(1)}" height="${B-T}" fill="var(--accent)" opacity=".12"/>`+(o.vspan[2]?`<text x="${X(o.vspan[0]).toFixed(1)}" y="${B-6}" class="axis"${X(o.vspan[0])>R-90?' text-anchor="end"':''}>${esc(o.vspan[2])}</text>`:'');
 niceTicks(lo,hi,4).forEach(v=>{s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--line)" stroke-opacity=".5"/><text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${esc(yf(v))}</text>`;});
 if(o.xunit)niceTicks(0,n-1,4).filter(Number.isInteger).forEach(d=>{s+=`<text x="${X(d).toFixed(1)}" y="${B+18}" text-anchor="middle" class="axis">${d}${o.xunit}</text>`;});
 (o.hlines||[]).forEach(([v,t])=>{s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--muted)" stroke-dasharray="4 4"/>${t?`<text x="${L+4}" y="${(Y(v)-5).toFixed(1)}" class="axis">${esc(t)}</text>`:''}`;});
 (o.vmark||[]).forEach(([i,t])=>{s+=`<path d="M${X(i).toFixed(1)} ${T}V${B}" stroke="var(--orange)" stroke-dasharray="3 3"/><text x="${Math.min(R,X(i)+4).toFixed(1)}" y="${T+12}" class="mark-t"${X(i)>R-80?' text-anchor="end"':''}>${esc(t)}</text>`;});
 S.forEach((ser,k)=>{const d=ser.values.map((v,i)=>Number.isFinite(v)?`${X(i).toFixed(1)} ${Y(v).toFixed(1)}`:null);let p='',pen=false;d.forEach(q=>{if(q===null){pen=false;return;}p+=(pen?'L':'M')+q;pen=true;});
  s+=`<path d="${p}" fill="none" stroke="${ser.color||COLORS[k%4]}" stroke-width="${ser.width||(n>200?1.5:2.2)}"${(ser.dash??DASH[k%4])?` stroke-dasharray="${ser.dash??DASH[k%4]}"`:''} stroke-opacity="${ser.opacity??1}"/>`;});
 const named=S.filter(x=>x.name);
 s+=`<text x="${L}" y="18" class="series">${named.map(x=>`${x.mark||['━','┅','┈','┉'][S.indexOf(x)%4]} ${esc(x.name)}`).join('   ')}</text>`;
 return svg(o.label||named.map(x=>x.name).join(', '),s,h);
}
/* 가운데 0선(또는 base선)을 두는 세로 막대. o = {labels, values, base, band:[±값,글], mark(i), fmt, h, label}. mark(i)가 참인 막대에는 ▲ 표시를 붙인다. */
function columns(o){
 const h=o.h||260,L=56,R=468,T=30,B=h-34,n=o.values.length,base=o.base??0,vf=o.fmt||(v=>sfmt(v,2));
 const ext=[...o.values,base,...(o.band?[base+o.band[0],base-o.band[0]]:[])],lo0=Math.min(...ext),hi0=Math.max(...ext),pad=(hi0-lo0)*.12||.1,lo=lo0-pad,hi=hi0+pad;
 const Y=v=>B-(v-lo)/(hi-lo)*(B-T),w=(R-L)/n,bw=Math.max(4,w*.6);
 let s=`<path d="M${L} ${Y(base).toFixed(1)}H${R}" stroke="var(--muted)"/>`;
 if(o.band)s+=`<rect x="${L}" y="${Y(base+o.band[0]).toFixed(1)}" width="${R-L}" height="${(Y(base-o.band[0])-Y(base+o.band[0])).toFixed(1)}" fill="var(--accent)" opacity=".12"/><path d="M${L} ${Y(base+o.band[0]).toFixed(1)}H${R}M${L} ${Y(base-o.band[0]).toFixed(1)}H${R}" stroke="var(--accent)" stroke-dasharray="4 3"/><text x="${R}" y="${(Y(base+o.band[0])-5).toFixed(1)}" text-anchor="end" class="axis">${esc(o.band[1])}</text>`;
 niceTicks(lo,hi,4).forEach(v=>{s+=`<text x="${L-6}" y="${(Y(v)+4).toFixed(1)}" text-anchor="end" class="axis">${esc(o.tick?o.tick(v):sfmt(v,2))}</text>`;});
 o.values.forEach((v,i)=>{const x=L+i*w+(w-bw)/2,y=Math.min(Y(v),Y(base)),hh=Math.max(1,Math.abs(Y(v)-Y(base))),on=o.mark&&o.mark(i);
  s+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${hh.toFixed(1)}" rx="2" fill="${on?'var(--accent)':'var(--blue)'}"/>`;
  if(n<=12)s+=`<text x="${(x+bw/2).toFixed(1)}" y="${(v>=base?y-5:y+hh+13).toFixed(1)}" text-anchor="middle" class="axis">${on?'▲':''}${esc(vf(v))}</text>`;
  s+=`<text x="${(x+bw/2).toFixed(1)}" y="${B+18}" text-anchor="middle" class="axis">${esc(o.labels[i])}</text>`;});
 if(o.title)s+=`<text x="${L}" y="16" class="series">${esc(o.title)}</text>`;
 return svg(o.label||o.title||'막대 그림',s,h);
}
/* 분포: 값들을 bins칸으로 나눠 센 막대. o = {values, bins, lines:[[값,글]], fmt, h, label, title, range:[lo,hi]}. 기준선 밖 칸은 강조색과 빗금 무늬로도 구분한다. */
function histogram(o){
 const h=o.h||240,L=46,R=468,T=30,B=h-36,v=o.values.filter(Number.isFinite),bins=o.bins||24,vf=o.fmt||(x=>sfmt(x,2));
 const ext=v.concat((o.lines||[]).map(x=>x[0])),lo=o.range?o.range[0]:Math.min(...ext),hi0=o.range?o.range[1]:Math.max(...ext),hi=hi0>lo?hi0:lo+1,bw=(hi-lo)/bins;
 const counts=Array(bins).fill(0);v.forEach(x=>{const i=Math.min(bins-1,Math.max(0,Math.floor((x-lo)/bw)));counts[i]++;});
 const top=Math.max(1,...counts),X=x=>L+(x-lo)/(hi-lo)*(R-L),Y=c=>B-c/top*(B-T),outside=o.outside||(()=>false);
 const hid='vu-hatch';/* 무늬가 같아서 한 쪽에 그림이 여럿이어도 같은 id를 써도 된다. */
 let s=`<defs><pattern id="${hid}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V6" stroke="var(--bg)" stroke-width="2"/></pattern></defs><path d="M${L} ${B}H${R}" stroke="var(--line)"/>`;
 counts.forEach((c,i)=>{const x0=X(lo+i*bw),x1=X(lo+(i+1)*bw),mid=lo+(i+.5)*bw,out=outside(mid);if(!c)return;s+=`<rect x="${(x0+.5).toFixed(1)}" y="${Y(c).toFixed(1)}" width="${Math.max(1,x1-x0-1).toFixed(1)}" height="${(B-Y(c)).toFixed(1)}" fill="${out?'var(--orange)':'var(--blue)'}"/>${out?`<rect x="${(x0+.5).toFixed(1)}" y="${Y(c).toFixed(1)}" width="${Math.max(1,x1-x0-1).toFixed(1)}" height="${(B-Y(c)).toFixed(1)}" fill="url(#${hid})" opacity=".5"/>`:''}`;});
 niceTicks(lo,hi,4).forEach(x=>{s+=`<text x="${X(x).toFixed(1)}" y="${B+18}" text-anchor="middle" class="axis">${esc(vf(x))}</text>`;});
 s+=`<text x="${L-6}" y="${T+4}" text-anchor="end" class="axis">${top}</text><text x="${L-6}" y="${B}" text-anchor="end" class="axis">0</text>`;
 (o.lines||[]).forEach(([x,t],k)=>{if(x<lo||x>hi)return;const px=X(x);s+=`<path d="M${px.toFixed(1)} ${T-4}V${B}" stroke="var(--orange)" stroke-width="1.5" stroke-dasharray="5 3"/>${t?`<text x="${px.toFixed(1)}" y="${T-8+(k%2)*14}" text-anchor="${px>R-60?'end':px<L+60?'start':'middle'}" class="mark-t">${esc(t)}</text>`:''}`;});
 if(o.title)s+=`<text x="${L}" y="14" class="series">${esc(o.title)}</text>`;
 return svg(o.label||o.title||'분포 그림',s,h);
}
function thumbnail(i){
 const sets=[['단순','로그','곱셈'],['지수','2배','재조정'],['σ','√250','ATR'],['시드','보행','√n'],['정규','t분포','3σ'],['ρ₁','φ','κ'],['VR(q)','q','z'],['선','통과','κ'],['고점','낙폭','회복'],['두 장','우연','한계']][i]||['?','?','?'];
 const colors=['var(--accent)','var(--blue)','var(--orange)'];
 const wave=`<path d="M8 60 L40 44 L70 66 L100 40 L130 58 L160 36 L190 62 L220 46 L250 70 L292 50" fill="none" stroke="var(--line)" stroke-width="2"/>`;
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${wave}${sets.map((s,k)=>`<rect x="${12+k*96}" y="30" width="84" height="44" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><text x="${54+k*96}" y="58" text-anchor="middle" fill="var(--text)" font-size="${s.length>3?13:16}">${esc(s)}</text>`).join('')}</svg>`;
}
return {lines,columns,histogram,thumbnail};
})());
