window.GLabs={};
window.GUI=(()=>{
'use strict';
const M=GMath;
/* 낱말 끝 받침에 맞춘 조사. josa('하린','이','가') → '이'. 숫자는 읽는 소리로 본다. */
const josa=(w,a,b)=>{const t=String(w),d='영일이삼사오육칠팔구'['0123456789'.indexOf(t.at(-1))]||t.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
/* 음수는 수학 기호 −로 쓴다. 손익은 부호를 늘 붙인다(splus). */
const sfmt=(n,d=0)=>(n<0?'−':'')+fmt(Math.abs(n),d);
const splus=(n,d=0)=>(n>0?'+':'')+sfmt(n,d);
const pct=(p,d=2)=>`${sfmt(p,d)}%`;
const won=n=>`${sfmt(Math.round(n),0)}원`;
const pwon=n=>`${splus(Math.round(n),0)}원`;
const value=(el,id)=>Number(el.querySelector('#'+id).value);
/* 숫자 칸 읽기: 비었거나 범위를 벗어나면 null. 오류 문장은 각 실험이 "확인해 주세요"로 보여 준다. */
function num(el,id){const x=el.querySelector('#'+id),s=x.value.trim().replace(/,/g,''),v=Number(s);if(s===''||!Number.isFinite(v))return null;if(x.min!==''&&v<+x.min)return null;if(x.max!==''&&v>+x.max)return null;return v;}
/* 눈금에 맞는 가격만 받는 칸. 범위 밖이면 null, 눈금이 아니면 NaN을 돌려준다. */
function price(el,id,kind='stock'){const v=num(el,id);if(v===null)return null;return M.isValidPrice(v,kind)?v:NaN;}
const problem=(what,why)=>`<strong>✗ ${what}${josa(what,'을','를')} 확인해 주세요</strong> · ${why}`;
/* 쉼표로 적은 가격 목록. 숫자가 아니거나 개수·범위를 벗어나면 null. */
function list(el,id,{min=1000,max=100000,count=[2,12]}={}){const s=el.querySelector('#'+id).value.trim();if(!s)return null;const a=s.split(/[,\s]+/).filter(Boolean).map(Number);if(a.length<count[0]||a.length>count[1]||a.some(v=>!Number.isFinite(v)||v<min||v>max))return null;return a;}
function range(id,label,min,max,step,v,hint=''){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"${hint?` aria-describedby="${id}-hint"`:''}>${hint?`<small class="hint" id="${id}-hint">${hint}</small>`:''}</label>`;}
function number(id,label,min,max,step,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="number" inputmode="numeric" min="${min}" max="${max}" step="${step}" value="${v}">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function select(id,label,options,v){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;}
function text(id,label,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="text" value="${esc(v)}" autocomplete="off" spellcheck="false">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart" tabindex="0" role="group" aria-label="실험 그림. 좁은 화면에서는 옆으로 밀어 볼 수 있고, 같은 숫자는 아래 결과 문장에 있습니다."></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
function bind(el,fn){const update=()=>{el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=fmt(x.value,String(x.step).includes('.')?1:0);});fn();};el.querySelectorAll('input,select').forEach(x=>{x.addEventListener('input',update);if(x.tagName==='SELECT')x.addEventListener('change',update);});update();}
function result(el,chart,textHtml){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=textHtml;}
/* 실험 결과의 성격을 밝히는 꼬리표: real(규칙대로 실제 계산), scenario(미리 정한 가상 경로 위의 계산), example(정해 둔 예시 가격). */
const KINDS={real:'규칙대로 실제 계산',scenario:'미리 정한 가상 경로',example:'정해 둔 예시 가격'};
const kind=(k,more='')=>`<br><span class="kind-tag">${KINDS[k]}</span>${more?` ${more}`:''}`;
const svg=(label,body,h=280)=>`<svg viewBox="0 0 480 ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
function table(head,rows,caption=''){return `<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(caption||'결과 표')} · 좁은 화면에서는 옆으로 밀어 볼 수 있습니다"><table>${caption?`<caption>${esc(caption)}</caption>`:''}<thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
/* 막대: 데스크톱은 SVG, 좁은 화면은 같은 값을 HTML 막대로. mark(i)가 참이면 강조색과 ✓ 표시. signed면 가운데 0선 양쪽으로 그린다. */
function bars(labels,values,{unit='',digits=0,max=null,mark=()=>false,signed=false,show=null}={}){
 const top=max??Math.max(...values.map(Math.abs),1e-6),left=150,width=220,gap=Math.max(24,Math.min(44,232/values.length)),bh=Math.min(24,gap-8);
 const color=(v,i)=>mark(i)?'var(--accent)':v<0?'var(--orange)':'var(--blue)',label=i=>show?show(values[i],i):`${sfmt(values[i],digits)}${unit}`;
 const body=values.map((v,i)=>{const y=16+i*gap,w=Math.min(1,Math.abs(v)/top)*(signed?width/2:width),x=signed?(v<0?left+width/2-w:left+width/2):left;return `<text x="8" y="${y+bh/2+5}">${esc(labels[i])}${mark(i)?' ✓':''}</text><rect x="${left}" y="${y}" width="${width}" height="${bh}" rx="3" fill="var(--panel2)"/><rect x="${x}" y="${y}" width="${Math.max(w,1)}" height="${bh}" rx="3" fill="${color(v,i)}"/><text x="${left+width+8}" y="${y+bh/2+5}">${esc(label(i))}</text>`;}).join('');
 const mid=signed?`<path d="M${left+width/2} 10V${20+values.length*gap}" stroke="var(--muted)" stroke-dasharray="3 3"/>`:'';
 const desk=`<svg viewBox="0 0 480 ${Math.max(120,28+values.length*gap)}" role="img" aria-label="${esc(labels.map((l,i)=>`${l} ${label(i)}`).join(', '))}">${mid}${body}</svg>`;
 const mob=`<div class="mobile-bars">${labels.map((l,i)=>`<div class="mobile-bar"><div><b>${esc(l)}${mark(i)?' ✓':''}</b><span>${esc(label(i))}</span></div><div class="mobile-track"><i style="width:${Math.min(100,Math.abs(values[i])/top*100)}%;background:${color(values[i],i)}"></i></div></div>`).join('')}</div>`;
 return `<div class="responsive-bars">${desk}${mob}</div>`;
}
/* 축 눈금: lo~hi를 1·2·5×10^k 간격으로 나눈 둥근 값들. */
function niceTicks(lo,hi,count=4){
 const span=hi-lo;if(!(span>0))return [lo];
 const raw=span/count,pow=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/pow,step=(f<=1?1:f<=2?2:f<=5?5:10)*pow,out=[];
 for(let v=Math.ceil(lo/step)*step;v<=hi+step*1e-9;v+=step)out.push(Math.abs(v)<step*1e-9?0:Number(v.toPrecision(12)));
 return out;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. */
function choiceOrder(n,answer,target){const order=[...Array(n).keys()];const k=((answer-target)%n+n)%n;return order.slice(k).concat(order.slice(0,k));}
/* 미리 정한 가상 경로(실제 시세가 아님). tests/math.test.cjs의 정의와 같다. 한 번 만든 뒤 다시 쓴다. */
const cache={};
const once=(k,f)=>cache[k]||(cache[k]=f());
const PATH={
 LV:()=>once('LV',()=>M.arithmeticLevels(18000,22000,20)),
 BOX:()=>once('BOX',()=>M.wave({start:20000,days:80,perDay:8,amp:7,period:64})),
 UP:()=>once('UP',()=>M.wave({start:20000,days:30,perDay:8,amp:2,period:8,drift:.8})),
 DOWN:()=>once('DOWN',()=>M.wave({start:20000,days:30,perDay:8,amp:2,period:8,drift:-.8})),
 FINAL:()=>once('FINAL',()=>[...PATH.BOX(),...M.wave({start:20000,days:20,perDay:8,amp:2,period:16,drift:-.5,gaps:{0:-8}}),...M.wave({start:16700,days:20,perDay:8,amp:2,period:16})]),
 SWING:[19900,17900,22100,17900,22100,17900,22100]
};
/* 하루 끝 금액 목록(최대 낙폭을 하루 끝 금액으로 재기 위해). */
const dayCloses=r=>r.series.filter((s,i,a)=>!a[i+1]||a[i+1].day!==s.day).map(s=>s.equity);
/* 칸 상태: 들고 있으면 held(매도 대기), 비었고 가격이 한 번이라도 칸 위에 있었으면 armed(매수 대기), 아니면 idle(주문 없음).
   GMath.simulate의 규칙 2(매수는 가격이 칸 위에 있을 때만 걸림)를 체결 기록과 지나온 최고가로 다시 읽은 것이다. 멈춤 규칙이 없을 때만 쓴다. */
function cellStates(levels,prices,fills){
 const held=levels.slice(0,-1).map(()=>false),top=Math.max(...prices);
 fills.forEach(f=>{held[f.cell]=f.side==='buy';});
 return levels.slice(0,-1).map((L,i)=>held[i]?'held':top>L?'armed':'idle');
}
const STATE={held:['●','매도 대기'],armed:['○','매수 대기'],idle:['–','주문 없음']};
return {M,josa,esc,fmt,sfmt,splus,pct,won,pwon,value,num,price,problem,list,range,number,select,text,setup,bind,result,KINDS,kind,svg,table,bars,niceTicks,choiceOrder,PATH,dayCloses,cellStates,STATE};
})();
/* 실험 그림: 가격 경로와 격자선, 칸 사다리, 장 카드 썸네일. 색만으로 알리지 않도록 매수는 ●, 매도는 ■ 모양을 쓴다. */
Object.assign(window.GUI,(()=>{
'use strict';
const {esc,fmt,svg,niceTicks}=GUI;
/* 가격 경로. o = {prices, perDay, levels, fills, band:[lo,hi], lines:[[가격,글]], label, h}. 가로축은 점 순서, perDay가 있으면 거래일로 적는다. */
function pathChart(o){
 const h=o.h||280,P=o.prices,lv=o.levels||[],L=58,R=468,T=30,B=h-34;
 const ys=P.concat(o.band||[],(o.lines||[]).map(x=>x[0]));const lo0=Math.min(...ys),hi0=Math.max(...ys),pad=(hi0-lo0)*.06||100,lo=lo0-pad,hi=hi0+pad;
 const X=i=>L+i/Math.max(1,P.length-1)*(R-L),Y=v=>B-(v-lo)/(hi-lo)*(B-T);
 let s=`<path d="M${L} ${T}V${B}H${R}" stroke="var(--line)" fill="none"/>`;
 if(o.band)s+=`<rect x="${L}" y="${Y(o.band[1])}" width="${R-L}" height="${Math.max(1,Y(o.band[0])-Y(o.band[1]))}" fill="var(--accent)" opacity=".07"/>`;
 const shown=lv.filter(v=>v>=lo&&v<=hi),thin=shown.length>26?Math.ceil(shown.length/26):1;
 shown.forEach((v,i)=>{if(i%thin===0)s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--accent)" stroke-opacity=".35" stroke-dasharray="2 3"/>`;});
 niceTicks(lo,hi,4).forEach(v=>{s+=`<text x="${L-6}" y="${Y(v)+4}" text-anchor="end" class="axis">${fmt(v)}</text>`;});
 if(o.perDay){const days=Math.ceil(P.length/o.perDay);niceTicks(0,days,4).filter(Number.isInteger).forEach(d=>{const i=Math.min(P.length-1,d*o.perDay);s+=`<text x="${X(i)}" y="${B+18}" text-anchor="middle" class="axis">${d}일</text>`;});}
 (o.lines||[]).forEach(([v,t])=>{s+=`<path d="M${L} ${Y(v)}H${R}" stroke="var(--orange)" stroke-width="1.5" stroke-dasharray="6 4"/><text x="${R}" y="${Y(v)-5}" text-anchor="end" class="mark-t">${esc(t)}</text>`;});
 s+=`<path d="${P.map((p,i)=>`${i?'L':'M'}${X(i).toFixed(1)} ${Y(p).toFixed(1)}`).join('')}" fill="none" stroke="var(--text)" stroke-width="${P.length>200?1.4:2.4}"/>`;
 const q=P.length>200?2.2:4;(o.fills||[]).forEach(f=>{const x=X(f.t),y=Y(f.price);s+=f.side==='buy'?`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${P.length>200?2.6:5}" fill="var(--blue)"/>`:`<rect x="${(x-q).toFixed(1)}" y="${(y-q).toFixed(1)}" width="${2*q}" height="${2*q}" fill="var(--orange)"/>`;});
 s+=`<text x="${L}" y="18" class="series">● 매수 체결  ■ 매도 체결  ┄ 격자 가격</text>`;
 return svg(o.label||'가격 경로와 격자 가격',s,h);
}
/* 칸 사다리: 왼쪽은 칸마다 상태(● 매도 대기 ○ 매수 대기 – 주문 없음), 오른쪽은 지나온 가격. 같은 세로축을 쓴다. */
function ladder(levels,states,prices,{fills=[],label=''}={}){
 const h=Math.max(300,levels.length*15+50),T=24,B=h-26,lo=Math.min(levels[0],...prices)-100,hi=Math.max(levels.at(-1),...prices)+100,Y=v=>B-(v-lo)/(hi-lo)*(B-T);
 let s='';
 states.forEach((st,i)=>{const y1=Y(levels[i+1]),y0=Y(levels[i]),hh=Math.max(2,y0-y1-2),[sym,name]=GUI.STATE[st];
  s+=`<rect x="70" y="${(y1+1).toFixed(1)}" width="120" height="${hh.toFixed(1)}" rx="2" class="cell-${st}"/><text x="64" y="${(y0+4).toFixed(1)}" text-anchor="end" class="axis">${fmt(levels[i])}</text>`;
  if(hh>=9)s+=`<text x="78" y="${(y1+hh/2+5).toFixed(1)}" class="cell-t">${sym} ${name}</text>`;});
 s+=`<text x="64" y="${(Y(levels.at(-1))+4).toFixed(1)}" text-anchor="end" class="axis">${fmt(levels.at(-1))}</text>`;
 const X=i=>230+i/Math.max(1,prices.length-1)*230;
 levels.forEach(v=>{s+=`<path d="M196 ${Y(v).toFixed(1)}H468" stroke="var(--accent)" stroke-opacity=".3" stroke-dasharray="2 3"/>`;});
 s+=`<path d="${prices.map((p,i)=>`${i?'L':'M'}${X(i).toFixed(1)} ${Y(p).toFixed(1)}`).join('')}" fill="none" stroke="var(--text)" stroke-width="2.4"/>`;
 prices.forEach((p,i)=>{s+=`<text x="${X(i)}" y="${Y(p)+(i%2?16:-8)}" text-anchor="middle" class="price">${fmt(p)}</text>`;});
 s+=`<text x="70" y="14" class="series">칸 상태</text><text x="230" y="14" class="series">가격이 지나간 길</text>`;
 return svg(label||'격자 칸의 상태와 가격 경로',s,h);
}
function thumbnail(i){
 const sets=[['빈 칸','산 칸','팔린 칸'],['차익','비용','몫'],['등차','등비','눈금'],['범위','칸 수','돈'],['오르내림','왕복','쌓임'],['오름','현금','보유'],['내림','재고','평가'],['종가','갭','시가'],['현금','주식','장부'],['한도','수량','손실'],['보유','적립','격자'],['멈춤','한도','옮김'],['6개월','장부','결정']][i]||['?','?','?'];
 const colors=['var(--accent)','var(--blue)','var(--orange)'];
 const lines=[0,1,2,3,4].map(k=>`<path d="M8 ${22+k*14}H292" stroke="var(--line)" stroke-dasharray="2 4"/>`).join('');
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${lines}${sets.map((s,k)=>`<rect x="${12+k*96}" y="30" width="84" height="44" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><text x="${54+k*96}" y="58" text-anchor="middle" fill="var(--text)" font-size="${s.length>3?13:16}">${esc(s)}</text>`).join('')}</svg>`;
}
return {pathChart,ladder,thumbnail};
})());
