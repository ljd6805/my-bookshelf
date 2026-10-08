/* 공통 실험 UI와 SVG 차트. 좌표계는 SVG 내부에서만 사용한다. */
window.AILabs={};
window.AIUI=(()=>{
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number.isFinite(n)?n.toFixed(d):'정의되지 않음';
function range(id,label,min,max,step,value){return `<label class="control" for="${id}"><span class="row"><span>${label}</span><output id="${id}-value">${value}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;}
function bind(el,fn){
  const update=()=>{el.querySelectorAll('input[type=range]').forEach(i=>{el.querySelector(`#${i.id}-value`).textContent=i.value;});fn();};
  el.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',update));update();
}
const value=(el,id)=>Number(el.querySelector('#'+id).value);
function setup(el,controls,chart=true){el.innerHTML=`<div class="lab-columns"><div>${controls}</div><div>${chart?'<div class="chart"></div>':'<div class="viz"></div>'}</div></div><div class="readout" role="status" aria-live="polite"></div>`;}
function svg(content,label='실험 차트'){return `<svg viewBox="0 0 480 280" role="img" aria-label="${esc(label)}">${content}</svg>`;}
function plot({lines=[],points=[],xmin=-1,xmax=1,ymin=-1,ymax=1,xlabel='x',ylabel='y',equal=false}){
  const width=equal?210:405,left=equal?140:45;
  const x=v=>left+(v-xmin)/(xmax-xmin)*width,y=v=>235-(v-ymin)/(ymax-ymin)*210;
  let out='';
  for(let i=0;i<=4;i++){const xx=left+i*width/4,yy=25+i*52.5;out+=`<path d="M${xx} 25V235 M${left} ${yy}H${left+width}" stroke="var(--line)" stroke-width=".6"/><text x="${xx}" y="254" text-anchor="middle">${fmt(xmin+(xmax-xmin)*i/4,1)}</text><text x="${left-9}" y="${yy+4}" text-anchor="end">${fmt(ymax-(ymax-ymin)*i/4,1)}</text>`;}
  const clipId='plot-'+Math.random().toString(36).slice(2);
  out+=`<defs><clipPath id="${clipId}"><rect x="45" y="25" width="405" height="210"/></clipPath></defs><g clip-path="url(#${clipId})">`;
  for(const line of lines){out+=`<polyline points="${line.data.map(([a,b])=>`${x(a)},${Math.max(-1000,Math.min(1000,y(b)))}`).join(' ')}" fill="none" stroke="${line.color||'var(--accent)'}" stroke-width="2.5" ${line.dashed?'stroke-dasharray="5 5"':''}/>`;}
  out+=points.map(p=>`<circle cx="${x(p[0])}" cy="${Math.max(-1000,Math.min(1000,y(p[1])))}" r="${p[3]||4}" fill="${p[2]||'var(--orange)'}"/>`).join('');
  const result=svg(`${out}</g><text x="${left+width}" y="275" text-anchor="end">${esc(xlabel)}</text><text x="${equal?103:8}" y="14">${esc(ylabel)}</text>`,`${xlabel}와 ${ylabel} 관계. 숫자 결과는 차트 아래에 표시됩니다.`);
  return equal?result.replace('viewBox="0 0 480 280"','data-equal="true" viewBox="90 0 300 280"'):result;
}
function bars(labels,values){return `<div class="bars">${labels.map((l,i)=>`<div class="bar-row"><span>${esc(l)}</span><div class="bar-track"><div class="bar-fill" style="width:${values[i]*100}%"></div></div><small>${fmt(values[i]*100,1)}%</small></div>`).join('')}</div>`;}
function heat(values,n,scale=1,row=-1){return `<div class="heatmap" style="grid-template-columns:repeat(${n},1fr)">${values.map((v,i)=>`<div class="cell ${Math.floor(i/n)===row?'selected-cell':''}" style="background:${v===null?'#29303c':`hsl(${v<0?22:168} 50% ${16+Math.min(1,Math.abs(v)/scale)*24}%)`}">${v===null?'×':fmt(v,2)}</div>`).join('')}</div>`;}
const series=(fn,min,max,n=80)=>Array.from({length:n+1},(_,i)=>{const x=min+(max-min)*i/n;return [x,fn(x)];});
function thumbnail(index){
 const line=(a,b,color='var(--accent)')=>`<path d="M${a}L${b}" stroke="${color}" stroke-width="2" fill="none"/>`;
 const dot=(x,y,r=4)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="var(--accent)"/>`;
 let content='';
 if(index===0){for(let i=0;i<3;i++)for(let j=0;j<4;j++)content+=line([55,25+i*25],[145,15+j*23],'var(--line)')+line([145,15+j*23],[245,40+i*12],'var(--line)');for(let i=0;i<3;i++)content+=dot(55,25+i*25);for(let j=0;j<4;j++)content+=dot(145,15+j*23);content+=dot(245,52,8);}
 else if(index===1||index===2||index===9){const points=Array.from({length:30},(_,i)=>[20+i*9, index===1?75-i*1.6:50+Math.sin(i*.3)*26]);content=`<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2"/>`;points.filter((_,i)=>i%4===0).forEach(p=>content+=`<circle cx="${p[0]}" cy="${p[1]+(index===1?8:-5)}" r="4" fill="var(--orange)"/>`);}
 else if(index===3){['learn','ing','AI'].forEach((t,i)=>content+=`<rect x="${25+i*90}" y="30" width="78" height="38" rx="5" fill="var(--panel2)" stroke="var(--accent)"/><text x="${64+i*90}" y="54" text-anchor="middle" fill="var(--accent)" font-size="14">${t}</text>`);}
 else if(index===4){content=line([70,75],[235,35])+line([70,75],[140,20],'var(--orange)')+dot(235,35)+`<circle cx="140" cy="20" r="4" fill="var(--orange)"/>`;}
 else if(index===5||index===7){for(let r=0;r<4;r++)for(let c=0;c<8;c++)content+=`<rect x="${30+c*30}" y="${8+r*21}" width="25" height="17" rx="2" fill="var(--accent)" opacity="${index===5?(c>r+2?.07:.2+(c%3)*.3):((r+c)%3? .25:.8)}"/>`;}
 else if(index===6||index===8){[65,43,28,16,8].forEach((h,i)=>content+=`<rect x="${40+i*47}" y="${85-h}" width="27" height="${h}" rx="3" fill="${i?'var(--accent)':'var(--orange)'}"/>`);}
 else{for(let i=0;i<4;i++){content+=`<rect x="${20+i*70}" y="${25+(i%2)*18}" width="48" height="35" rx="5" fill="var(--panel2)" stroke="var(--accent)"/>`;if(i<3)content+=line([68+i*70,43+(i%2)*18],[90+i*70,43+((i+1)%2)*18],'var(--line)');}}
 return `<svg viewBox="0 0 300 100" aria-hidden="true">${content}</svg>`;
}
return {esc,fmt,range,bind,value,setup,svg,plot,bars,heat,series,thumbnail};
})();
