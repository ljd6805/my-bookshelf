window.MLabs={};
window.MUI=(()=>{
'use strict';
/* 낱말 끝 받침에 맞춘 조사. josa('하린','이','가') → '이'. 숫자는 읽는 소리로 본다. */
const josa=(w,a,b)=>{const t=String(w),d='영일이삼사오육칠팔구'['0123456789'.indexOf(t.at(-1))]||t.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
/* 음수는 수학 기호 −로 쓴다. */
const sfmt=(n,d=2)=>(n<0?'−':'')+fmt(Math.abs(n),d);
const pct=(p,d=2)=>`${sfmt(p,d)}%`;
/* 원 단위 금액: won(13439163.79) → '13,439,164원'. 만 원 어림: man(55736617) → '약 5,574만 원'. */
const won=n=>`${sfmt(Math.round(n),0)}원`;
const man=n=>`약 ${sfmt(n/1e4,0)}만 원`;
const value=(el,id)=>Number(el.querySelector('#'+id).value);
/* 숫자 칸 읽기: 비었거나 범위를 벗어나면 null. 오류 문장은 각 실험이 "확인해 주세요"로 보여 준다. */
function num(el,id){const x=el.querySelector('#'+id),s=x.value.trim(),v=Number(s);if(s===''||!Number.isFinite(v))return null;if(x.min!==''&&v<+x.min)return null;if(x.max!==''&&v>+x.max)return null;return v;}
const problem=(what,why)=>`<strong>${what}${josa(what,'을','를')} 확인해 주세요</strong> · ${why}`;
function range(id,label,min,max,step,v){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;}
function number(id,label,min,max,step,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${v}">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function select(id,label,options,v){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;}
function text(id,label,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="text" value="${esc(v)}" autocomplete="off" spellcheck="false">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart" tabindex="0" role="group" aria-label="실험 그림. 좁은 화면에서는 옆으로 밀어 볼 수 있고, 같은 숫자는 아래 결과 문장에 있습니다."></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
function bind(el,fn){const update=()=>{el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=x.value;});fn();};el.querySelectorAll('input,select').forEach(x=>{x.addEventListener('input',update);if(x.tagName==='SELECT')x.addEventListener('change',update);});update();}
function result(el,chart,textHtml){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=textHtml;}
/* 실험 결과의 성격을 밝히는 꼬리표: real(공식을 실제로 계산), example(정해 둔 예시 숫자), scenario(가정한 시나리오). */
const KINDS={real:'공식을 실제로 계산',example:'정해 둔 예시 숫자',scenario:'가정한 시나리오'};
const kind=(k,more='')=>`<br><span class="kind-tag">${KINDS[k]}</span>${more?` ${more}`:''}`;
const svg=(label,body,h=280)=>`<svg viewBox="0 0 480 ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
function table(head,rows,caption=''){return `<div class="table-wrap"><table>${caption?`<caption>${esc(caption)}</caption>`:''}<thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
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
/* 선 그래프: series=[{name,points:[[x,y]...],color,dash}], 축 범위는 점들에서 잡는다. marks=[[x,y,글]]은 점과 글을 찍는다. */
function lines(series,{label='',xName='',yName='',yFmt=v=>sfmt(v,0),xFmt=v=>v,marks=[],zero=false,h=280}={}){
 const pts=series.flatMap(s=>s.points),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]).concat(marks.map(m=>m[1])).concat(zero?[0]:[]);
 const x0=Math.min(...xs),x1=Math.max(...xs),ylo=Math.min(...ys),yhi=Math.max(...ys),pad=(yhi-ylo)*.08||1,y0=ylo-pad,y1=yhi+pad;
 const L=64,R=468,T=26,B=h-46,X=x=>L+(x-x0)/((x1-x0)||1)*(R-L),Y=y=>B-(y-y0)/((y1-y0)||1)*(B-T);
 let s=`<path d="M${L} ${T}V${B}H${R}" stroke="var(--line)" fill="none"/>`;
 [y0+pad,(y0+y1)/2,y1-pad].forEach(v=>{s+=`<text x="${L-6}" y="${Y(v)+4}" text-anchor="end" class="axis">${esc(yFmt(v))}</text><path d="M${L} ${Y(v)}H${R}" stroke="var(--line)" stroke-dasharray="2 4"/>`;});
 if(zero&&y0<0&&y1>0)s+=`<path d="M${L} ${Y(0)}H${R}" stroke="var(--muted)" stroke-width="1.5"/>`;
 [x0,(x0+x1)/2,x1].forEach(v=>{s+=`<text x="${X(v)}" y="${B+18}" text-anchor="middle" class="axis">${esc(xFmt(Math.round(v*10)/10))}</text>`;});
 s+=`<text x="${R}" y="${h-8}" text-anchor="end" class="axis">${esc(xName)}</text><text x="8" y="24" class="axis">${esc(yName)}</text>`;
 series.forEach((ser,k)=>{s+=`<path d="${ser.points.map((p,i)=>`${i?'L':'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('')}" fill="none" stroke="${ser.color}" stroke-width="${ser.width||3}" ${ser.dash?`stroke-dasharray="${ser.dash}"`:''}/>`;const lx=L+k*150;s+=`<path d="M${lx} 8H${lx+22}" stroke="${ser.color}" stroke-width="3" ${ser.dash?`stroke-dasharray="${ser.dash}"`:''}/><text x="${lx+27}" y="12" style="fill:${ser.color}" class="series">${esc(ser.name)}</text>`;});
 marks.forEach(([x,y,t])=>{s+=`<circle cx="${X(x)}" cy="${Y(y)}" r="5" fill="var(--orange)" stroke="var(--bg)" stroke-width="1.5"/>${t?`<text x="${Math.min(X(x)+8,R-4)}" y="${Y(y)+18}" ${X(x)>R-120?'text-anchor="end"':''} class="mark-t">${esc(t)}</text>`:''}`;});
 return svg(label,s,h);
}
/* 시간 저울: 왼쪽 접시는 오늘의 돈을 미래로 옮긴 값, 오른쪽 접시는 미래에 받는 돈. 기울기는 두 값의 비율로 정하고 ±12도로 자른다.
   색만으로 알리지 않도록 무거운 쪽에 ▼ 무거움 글자를 붙인다. */
function balance(leftValue,rightValue,{leftName='오늘의 돈',rightName='미래의 돈',leftNote='',rightNote='',h=230}={}){
 const diff=(rightValue-leftValue)/Math.max(Math.abs(leftValue),Math.abs(rightValue),1),deg=Math.max(-12,Math.min(12,diff*120)),rad=deg*Math.PI/180,cx=240,cy=70,arm=150;
 const lx=cx-arm*Math.cos(rad),ly=cy-arm*Math.sin(rad),rx=cx+arm*Math.cos(rad),ry=cy+arm*Math.sin(rad),even=Math.abs(diff)<5e-5;
 const heavy=side=>even?'':(side==='left'?diff<0:diff>0)?'▼ 무거움':'';
 const coins=(x,y,n,cls)=>Array.from({length:n},(_,i)=>`<ellipse class="${cls}" cx="${x}" cy="${y-8-i*7}" rx="22" ry="6"/>`).join('');
 const nl=Math.max(1,Math.min(9,Math.round(leftValue/Math.max(leftValue,rightValue,1)*8))),nr=Math.max(1,Math.min(9,Math.round(rightValue/Math.max(leftValue,rightValue,1)*8)));
 const pan=(x,y,n,cls,name,note,side)=>`<path d="M${x} ${y}V${y+40}" stroke="var(--muted)"/><path d="M${x-44} ${y+40}H${x+44}" stroke="var(--text)" stroke-width="3"/>${coins(x,y+38,n,cls)}<text x="${x}" y="${y+64}" text-anchor="middle" class="pan-name">${esc(name)}</text><text x="${x}" y="${y+82}" text-anchor="middle" class="pan-value">${esc(note)}</text><text x="${x}" y="${y+100}" text-anchor="middle" class="pan-heavy">${heavy(side)}</text>`;
 const body=`<path d="M${cx} ${cy}V${h-16}M${cx-40} ${h-16}H${cx+40}" stroke="var(--text)" stroke-width="3"/><path d="M${lx} ${ly}L${rx} ${ry}" stroke="var(--text)" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="6" fill="var(--accent)"/>${pan(lx,ly,nl,'coin-now',leftName,leftNote,'left')}${pan(rx,ry,nr,'coin-later',rightName,rightNote,'right')}<text x="${cx}" y="${cy-16}" text-anchor="middle" class="pan-heavy">${even?'균형':''}</text>`;
 return svg(`시간 저울. ${leftName} ${leftNote}, ${rightName} ${rightNote}. ${even?'두 접시가 균형을 이룹니다':diff>0?rightName+' 쪽이 무겁습니다':leftName+' 쪽이 무겁습니다'}.`,body,h+40);
}
function thumbnail(i){
 const sets=[['오늘','1년 뒤','저울'],['단리','복리','곡선'],['72','÷ r','두 배'],['미래','÷ (1+r)','오늘'],['원리금','원금','만기'],['NPV','IRR','0'],['명목','물가','실질'],['+50%','−50%','CAGR'],['보수','30년','복리'],['상환','투자','저울']][i]||['?','?','?'];
 const colors=['var(--accent)','var(--blue)','var(--orange)'],widths=[70,45,25];
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${sets.map((s,k)=>`<rect x="${8+k*99}" y="18" width="86" height="62" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><rect x="${16+k*99}" y="67" width="${widths[(k+i)%3]}" height="3" fill="${colors[k]}"/><text x="${51+k*99}" y="51" text-anchor="middle" fill="var(--text)" font-size="${s.length>4?13:16}">${esc(s)}</text>`).join('')}</svg>`;
}
return {josa,esc,fmt,sfmt,pct,won,man,value,num,problem,range,number,select,text,setup,bind,result,KINDS,kind,svg,table,bars,lines,balance,thumbnail};
})();
