/* 공통 실험 UI와 SVG 그림. 좌표계는 SVG 안에서만 쓴다. AI Book의 visual.js와 같은 역할을 한다. */
window.KGLabs={};
window.KGUI=(()=>{
const G=KGGraph;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number.isFinite(n)?n.toFixed(d):'정의되지 않음';
// 받침 유무로 조사를 고른다: jo('마리 퀴리','은','는') → '마리 퀴리는'.
const jo=(w,a,b)=>{const c=String(w).charCodeAt(String(w).length-1);return w+(c>=0xac00&&c<=0xd7a3&&(c-0xac00)%28?a:b);};
const pct=n=>n===null?'정의되지 않음':(n*100).toFixed(1)+'%';
function range(id,label,min,max,step,value){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${value}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;}
function select(id,label,options,value){return `<label class="control" for="${id}"><span class="row"><span>${label}</span></span><select id="${id}">${options.map(([v,t])=>`<option value="${v}"${v===value?' selected':''}>${esc(t)}</option>`).join('')}</select></label>`;}
function bind(el,fn){
 const update=()=>{el.querySelectorAll('input[type=range]').forEach(i=>{const o=el.querySelector(`#${i.id}-value`);if(o)o.textContent=i.value;});fn();};
 el.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',update));update();
}
const value=(el,id)=>Number(el.querySelector('#'+id).value);
const pick=(el,id)=>el.querySelector('#'+id).value;
function setup(el,controls){el.innerHTML=`<div class="lab-columns"><div>${controls}</div><div><div class="chart"></div></div></div><div class="readout" role="status" aria-live="polite"></div>`;}
function svg(content,label='실험 그림',box='0 0 480 280'){return `<svg viewBox="${box}" role="img" aria-label="${esc(label)}">${content}</svg>`;}
const label=id=>G.entities[id]?G.entities[id].label:id;
const fact=([s,p,o])=>`${label(s)} —${G.predicates[p]||p}→ ${label(o)}`;
// 그래프 그리기. on: 강조할 점, edges: 강조할 사실, fresh: 새로 생긴 사실(점선), names: 간선 이름을 보일지.
function graph(list,{on=null,edges=[],fresh=[],names=false,title='지식 그래프'}={}){
 const nodes=new Set();list.forEach(([s,,o])=>{nodes.add(s);nodes.add(o);});
 const hot=new Set(edges.map(G.key)),neu=new Set(fresh.map(G.key)),id='kg-arrow-'+Math.random().toString(36).slice(2,8);
 let out=`<defs><marker id="${id}" viewBox="0 0 10 10" refX="17" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1L9 5L0 9z" fill="context-stroke"/></marker></defs>`;
 for(const t of list){
  const [a,p,b]=t,A=G.entities[a],B=G.entities[b],k=G.key(t),cls=neu.has(k)?'kg-edge fresh':hot.has(k)?'kg-edge on':'kg-edge';
  out+=`<line class="${cls}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" marker-end="url(#${id})"/>`;
  if(names&&(hot.has(k)||neu.has(k)))out+=`<text class="kg-edge-label" x="${(A.x+B.x)/2}" y="${(A.y+B.y)/2-4}" text-anchor="middle">${esc(G.predicates[p])}</text>`;
 }
 for(const n of nodes){const e=G.entities[n],state=on?(on.has(n)?' on':' dim'):'';const [lx,ly,anchor]=e.side==='r'?[e.x+12,e.y+4,'start']:[e.x,e.y<140?e.y-12:e.y+20,'middle'];out+=`<g class="kg-node${state}"><circle cx="${e.x}" cy="${e.y}" r="7"/><text x="${lx}" y="${ly}" text-anchor="${anchor}">${esc(e.label)}</text></g>`;}
 return svg(out,`${title}. 점 ${nodes.size}개, 사실 ${list.length}개. 숫자 결과는 아래 글에 있습니다.`,'0 0 480 292');
}
function plot({points=[],arrows=[],xmin=-1,xmax=1,ymin=-1,ymax=1,xlabel='x',ylabel='y'}){
 const x=v=>140+(v-xmin)/(xmax-xmin)*210,y=v=>235-(v-ymin)/(ymax-ymin)*210;let out='';
 for(let i=0;i<=4;i++){const xx=140+i*52.5,yy=25+i*52.5;out+=`<path d="M${xx} 25V235M140 ${yy}H350" stroke="var(--line)" stroke-width=".6"/><text x="${xx}" y="252" text-anchor="middle">${fmt(xmin+(xmax-xmin)*i/4,1)}</text><text x="132" y="${yy+4}" text-anchor="end">${fmt(ymax-(ymax-ymin)*i/4,1)}</text>`;}
 const id='kg-plot-'+Math.random().toString(36).slice(2,8);
 out+=`<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1L9 5L0 9z" fill="context-stroke"/></marker></defs>`;
 for(const a of arrows)out+=`<line x1="${x(a.from[0])}" y1="${y(a.from[1])}" x2="${x(a.to[0])}" y2="${y(a.to[1])}" stroke="${a.color||'var(--accent)'}" stroke-width="${a.width||2}" ${a.dashed?'stroke-dasharray="4 4"':''} marker-end="url(#${id})"/>`;
 for(const p of points)out+=`<circle cx="${x(p.at[0])}" cy="${y(p.at[1])}" r="${p.r||5}" fill="${p.color||'var(--orange)'}"/>${p.text?`<text x="${x(p.at[0])+8}" y="${y(p.at[1])-7}">${esc(p.text)}</text>`:''}`;
 return svg(out+`<text x="350" y="272" text-anchor="end">${esc(xlabel)}</text><text x="140" y="14" text-anchor="middle">${esc(ylabel)}</text>`,`${xlabel}와 ${ylabel} 평면. 숫자 결과는 아래 글에 있습니다.`,'80 0 330 280');
}
function bars(rows){return `<div class="bars">${rows.map(([l,v,t])=>`<div class="bar-row"><span>${esc(l)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(0,Math.min(1,v||0))*100}%"></div></div><small>${t}</small></div>`).join('')}</div>`;}
function thumbnail(index){
 const pts=[[40,50],[95,22],[150,58],[205,28],[260,62],[120,82],[220,84]];
 const links=[[[0,1],[1,2]],[[0,1],[1,2],[2,3],[3,4]],[[0,5],[1,5]],[[1,0],[1,2],[1,3]],[[0,1],[1,2],[0,2]],[[0,1],[1,2],[2,3]],[[0,1],[2,3],[4,6]],[[0,1],[2,3],[5,6]],[[0,1],[1,2],[2,3],[3,4],[2,6]]][index]||[];
 const used=new Set(links.flat());let c='';
 for(const [a,b] of links)c+=`<path d="M${pts[a][0]} ${pts[a][1]}L${pts[b][0]} ${pts[b][1]}" stroke="${index===4&&a===0&&b===2?'var(--orange)':'var(--accent)'}" stroke-width="2" ${index===4&&a===0&&b===2?'stroke-dasharray="4 4"':''}/>`;
 for(const i of used)c+=`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="${index===2&&i===5?9:6}" fill="${i===used.values().next().value?'var(--orange)':'var(--accent)'}"/>`;
 if(index===7)c+=`<path d="M40 50L95 22M150 58L205 28" stroke="var(--orange)" stroke-width="1.5" stroke-dasharray="3 3"/>`;
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${c}</svg>`;
}
return {esc,fmt,jo,pct,range,select,bind,value,pick,setup,svg,label,fact,graph,plot,bars,thumbnail};
})();
