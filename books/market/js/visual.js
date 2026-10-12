window.MLabs={};
window.MUI=(()=>{
'use strict';
/* 낱말 끝 받침에 맞춘 조사. josa('새벽전자','을','를') → '를', josa('주문','으로','로') → '으로'(ㄹ 받침은 '로'). 숫자는 읽는 소리로 본다. */
const josa=(w,a,b)=>{const t=String(w),d='영일이삼사오육칠팔구'['0123456789'.indexOf(t.at(-1))]||t.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const pct=(p,d=1)=>`${fmt(p*100,d)}%`;
/* 원 단위 금액: won(19950) → '19,950원', won(19969.2,2) → '19,969.20원'. */
const won=(n,d=0)=>`${fmt(n,d)}원`;
const value=(el,id)=>Number(el.querySelector('#'+id).value);
/* 공통 사례: 가상 종목 새벽전자의 호가창(전일 종가 19,950원). 매도 호가는 싼 것부터, 매수 호가는 비싼 것부터. 표지와 3장이 함께 쓴다. */
const BOOK={name:'새벽전자',base:19950,asks:[[19960,120],[19970,300],[19980,500],[19990,800],[20000,1200]],bids:[[19950,150],[19940,400],[19930,600],[19920,900],[19910,1100]]};
function range(id,label,min,max,step,v){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${v}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;}
function number(id,label,min,max,step,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="number" inputmode="numeric" min="${min}" max="${max}" step="${step}" value="${v}">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function select(id,label,options,v){return `<label class="control" for="${id}"><span>${label}</span><select id="${id}">${options.map(([key,text])=>`<option value="${esc(key)}" ${String(key)===String(v)?'selected':''}>${esc(text)}</option>`).join('')}</select></label>`;}
function text(id,label,v,hint=''){return `<label class="control" for="${id}"><span>${label}</span><input id="${id}" type="text" value="${esc(v)}" autocomplete="off" spellcheck="false">${hint?`<small class="hint">${hint}</small>`:''}</label>`;}
function check(id,label,on=false){return `<label class="check" for="${id}"><input id="${id}" type="checkbox" ${on?'checked':''}><span>${label}</span></label>`;}
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div class="controls">${controls}</div><div class="chart" tabindex="0" role="group" aria-label="실험 그림. 좁은 화면에서는 옆으로 밀어 볼 수 있고, 같은 숫자는 아래 결과 문장에 있습니다."></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
function bind(el,fn){const update=()=>{el.querySelectorAll('input[type=range]').forEach(x=>{const o=el.querySelector('#'+x.id+'-value');if(o)o.textContent=x.value;});fn();};el.querySelectorAll('input,select').forEach(x=>{x.addEventListener('input',update);if(x.type==='checkbox')x.addEventListener('change',update);});update();}
function result(el,chart,textHtml){el.querySelector('.chart').innerHTML=chart;el.querySelector('.readout').innerHTML=textHtml;}
/* 실험 결과의 성격을 밝히는 꼬리표: real(실제 규칙 계산), example(정해 둔 예시 숫자), scenario(시나리오). */
const KINDS={real:'실제 규칙 계산',example:'정해 둔 예시 숫자',scenario:'시나리오'};
const kind=(k,more='')=>`<br><span class="kind-tag">${KINDS[k]}</span>${more?` ${more}`:''}`;
/* 480×h SVG 틀. label은 화면 읽기 프로그램이 읽는 한 문장 요약이다. */
const svg=(label,body,h=280)=>`<svg viewBox="0 0 480 ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
function table(head,rows,caption=''){return `<div class="table-wrap"><table>${caption?`<caption>${esc(caption)}</caption>`:''}<thead><tr>${head.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
/* 막대: 데스크톱은 SVG, 좁은 화면은 같은 값을 HTML 막대로 보여 준다. mark(i)가 참이면 강조색과 ✓ 표시를 쓴다. */
function bars(labels,values,{unit='',digits=0,max=null,mark=()=>false,signed=false}={}){
 const top=max??Math.max(...values.map(Math.abs),1e-6),left=150,width=220,gap=Math.max(24,Math.min(44,232/values.length)),bh=Math.min(24,gap-8);
 const color=(v,i)=>mark(i)?'var(--accent)':v<0?'var(--orange)':'var(--blue)';
 const body=values.map((v,i)=>{const y=16+i*gap,w=Math.abs(v)/top*(signed?width/2:width),x=signed?(v<0?left+width/2-w:left+width/2):left;return `<text x="8" y="${y+bh/2+5}">${esc(labels[i])}${mark(i)?' ✓':''}</text><rect x="${left}" y="${y}" width="${width}" height="${bh}" rx="3" fill="var(--panel2)"/><rect x="${x}" y="${y}" width="${Math.max(w,1)}" height="${bh}" rx="3" fill="${color(v,i)}"/><text x="${left+width+8}" y="${y+bh/2+5}">${fmt(v,digits)}${esc(unit)}</text>`;}).join('');
 const mid=signed?`<path d="M${left+width/2} 10V${20+values.length*gap}" stroke="var(--muted)" stroke-dasharray="3 3"/>`:'';
 const desk=`<svg viewBox="0 0 480 ${Math.max(120,28+values.length*gap)}" role="img" aria-label="${esc(labels.map((l,i)=>`${l} ${fmt(values[i],digits)}${unit}`).join(', '))}">${mid}${body}</svg>`;
 const mob=`<div class="mobile-bars">${labels.map((l,i)=>`<div class="mobile-bar"><div><b>${esc(l)}${mark(i)?' ✓':''}</b><span>${fmt(values[i],digits)}${esc(unit)}</span></div><div class="mobile-track"><i style="width:${Math.min(100,Math.abs(values[i])/top*100)}%;background:${color(values[i],i)}"></i></div></div>`).join('')}</div>`;
 return `<div class="responsive-bars">${desk}${mob}</div>`;
}
/* 호가창 그림: 위는 매도 호가(비싼 것이 위), 아래는 매수 호가. fills=[[가격,수량],...]은 시장가 주문이 먹은 부분이다. */
function orderBook(asks,bids,fills=[],{h=280,label=''}={}){
 const rows=[...asks].reverse().map(r=>[...r,'ask']).concat(bids.map(r=>[...r,'bid'])),top=Math.max(...rows.map(r=>r[1])),rh=(h-20)/rows.length,mid=250,bw=130;
 const eaten=p=>(fills.find(f=>f[0]===p)||[0,0])[1];
 const body=rows.map(([p,q,side],i)=>{const y=10+i*rh,w=q/top*bw,e=side==='ask'?eaten(p)/top*bw:0,x=side==='ask'?mid-w:mid;
  return `<text x="${side==='ask'?8:472}" y="${y+rh/2+4}" ${side==='bid'?'text-anchor="end"':''}>${fmt(q,0)}주${e?` · ${fmt(eaten(p),0)} 체결`:''}</text><rect x="${x}" y="${y+2}" width="${Math.max(w,1)}" height="${rh-4}" rx="2" fill="${side==='ask'?'var(--orange)':'var(--blue)'}" fill-opacity=".28"/>${e?`<rect x="${mid-e}" y="${y+2}" width="${e}" height="${rh-4}" rx="2" fill="var(--accent)"/>`:''}<text x="${side==='ask'?mid+8:mid-8}" y="${y+rh/2+4}" ${side==='bid'?'text-anchor="end"':''} class="price">${fmt(p,0)}</text>`;}).join('');
 const line=`<path d="M10 ${10+asks.length*rh}H470" stroke="var(--muted)" stroke-dasharray="4 4"/><text x="472" y="${10+rh/2+4}" text-anchor="end">매도 호가 ↑</text><text x="8" y="${10+(rows.length-1)*rh+rh/2+4}">↓ 매수 호가</text>`;
 return svg(label||'호가창 그림',body+line,h);
}
function chips(items,cls=()=>''){return `<div class="tok-row">${items.map((t,i)=>`<span class="tok ${cls(i)}">${esc(t)}</span>`).join('')}</div>`;}
function thumbnail(i){
 const sets=[['주식','채권','몫'],['KRX','NXT','최선'],['매도','매수','틈'],['가격','시간','줄'],['수요','공급','한 값'],['1원','10원','50원'],['±30%','VI','CB'],['배당','권리','분할'],['T','+2','결제'],['수수료','세금','왕복'],['08:00','15:30','20:00'],['경고','리딩방','보호'],['격자','진단','표']][i]||['?','?','?'];
 const colors=['var(--accent)','var(--blue)','var(--orange)'],widths=[70,45,25];
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${sets.map((s,k)=>`<rect x="${8+k*99}" y="18" width="86" height="62" rx="6" fill="var(--panel2)" stroke="${colors[k]}"/><rect x="${16+k*99}" y="67" width="${widths[(k+i)%3]}" height="3" fill="${colors[k]}"/><text x="${51+k*99}" y="51" text-anchor="middle" fill="var(--text)" font-size="${s.length>3?13:16}">${esc(s)}</text>`).join('')}</svg>`;
}
return {josa,esc,fmt,pct,won,value,BOOK,range,number,select,text,check,setup,bind,result,KINDS,kind,svg,table,bars,orderBook,chips,thumbnail};
})();
