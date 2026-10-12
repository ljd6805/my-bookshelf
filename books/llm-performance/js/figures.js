window.PFigures=(()=>{
const rect=(x,y,w,h,color='--accent')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="var(${color})" opacity=".65"/>`;
const label=(x,y,s,size=12)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}">${s}</text>`;
const line=(x,y,a,b)=>`<path d="M${x} ${y}L${a} ${b}" stroke="var(--line)" stroke-width="2"/>`;
function time(id){
 const points={metrics:[['요청',0],['첫 토큰',100],['다음',170],['마지막',260]],timing:[['CPU 제출',0],['GPU 시작',80],['CPU 반환',150],['GPU 완료',260]],timeline:[['복사 1',0],['계산 1',80],['복사 2',150],['계산 2',260]]}[id];
 return line(30,80,325,80)+points.map(([s,x],i)=>`<circle cx="${40+x}" cy="80" r="6" fill="var(${i%2?'--blue':'--accent'})"/>`+line(40+x,80,40+x,i%2?106:55)+label(40+x,i%2?125:40,s)).join('');
}
/* 3장(timeline)·9장(paging)·10장(batching) 그림은 실험과 같은 PMath 계산값으로 그린다. 막대는 fig-grow로 시간 순서대로 차오르며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다. */
const grow=(x,y,w,h,color,delay)=>`<rect class="fig-grow" style="animation-delay:${delay.toFixed(2)}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="var(${color})"/>`;
const gap=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="none" stroke="var(--line)" stroke-dasharray="3 3"/>`;
function overlap(){
 const r=PMath.pipeline(4,3,6,true),k=9,x0=58;let s=label(180,18,`복사와 계산을 겹치면 ${r.total} ms (직렬 ${r.serial} ms)`);
 s+=label(30,52,'복사')+label(30,96,'계산');
 r.events.forEach(e=>{s+=grow(x0+e.start*k,e.lane?78:34,(e.end-e.start)*k-2,28,e.lane?'--blue':'--accent',e.start*.12)+label(x0+(e.start+e.end)/2*k,e.lane?97:53,e.label.split(' ')[1],11);});
 s+=line(x0,122,x0+r.total*k,122)+label(x0,138,'0',11)+label(x0+r.total*k,138,r.total+' ms',11);
 return s+label(180,166,'복사 2는 계산 1이 도는 동안 끝나 두 줄이 같은 시간에 바쁩니다',11);
}
function slots(r,n){
 const of={},free=Array(n).fill(0),cells=[];
 [...r.events].sort((a,b)=>a.start-b.start||a.lane-b.lane).forEach(e=>{if(!(e.lane in of)){const i=free.findIndex(t=>t<=e.start);of[e.lane]=i;}const i=of[e.lane];free[i]=r.ends[e.lane];cells.push({...e,slot:i});});
 return cells;
}
function batch(){
 const k=2.5,x0=74;let s=label(180,16,'요청 2·6·3·5토큰, 슬롯 2개, 단계 10 ms');
 [[0,'고정 배치',40],[1,'매 단계 투입',112]].forEach(([c,name,y])=>{const r=PMath.schedule(2,10,Boolean(c));
  s+=label(180,y-8,`${name} · ${r.total} ms`,11);for(let i=0;i<2;i++)s+=label(40,y+14+i*26,'슬롯 '+(i+1),11)+gap(x0,y+i*26,r.total*k,20);
  slots(r,2).forEach(e=>s+=grow(x0+e.start*k+1,y+e.slot*26,(e.end-e.start)*k-2,20,+e.label%2?'--accent':'--blue',e.start*.04)+label(x0+(e.start+e.end)/2*k,y+e.slot*26+14,e.label,10));});
 return s+label(180,180,'칸 안 숫자는 요청 번호, 점선만 남은 칸은 쉬는 슬롯입니다',11);
}
function pages(){
 const r=PMath.paging(513,16),big=PMath.paging(513,256),w=7.6,x0=70;let s=label(180,16,`블록 16토큰: ${r.used} 사용 / ${r.allocated} 할당`);
 r.lengths.forEach((n,row)=>{const y=34+row*30;s+=label(36,y+14,n+'토큰',11);
  for(let b=0;b<r.pages[row];b++){const fill=Math.min(16,n-b*16)/16;s+=(fill<1?`<rect x="${x0+b*w}" y="${y}" width="${w-1}" height="20" rx="3" fill="none" stroke="var(--orange)" stroke-width="2"/>`:gap(x0+b*w,y,w-1,20))+grow(x0+b*w,y,(w-1)*fill,20,fill<1?'--orange':'--accent',(row*12+b)*.03);}});
 return s+label(180,140,`마지막 블록의 빈 자리 합 ${r.waste}토큰`,11)+label(180,162,`블록 256이면 ${big.allocated.toLocaleString('en-US')} 할당, ${big.waste}토큰이 빕니다`,11);
}
function grid(){let s=label(175,20,'grid → block → warp');for(let b=0;b<2;b++){s+=`<rect x="${16+b*172}" y="35" width="160" height="110" rx="8" fill="none" stroke="var(--line)"/>`+label(96+b*172,58,'block '+b);for(let i=0;i<16;i++)s+=rect(28+b*172+i%8*17,75+Math.floor(i/8)*22,12,16,i<8?'--accent':'--blue');}return s+label(180,170,'작은 칸 = thread');}
function addresses(){let s=label(175,20,'32개 lane의 연속 접근 → 4개 sector');for(let i=0;i<32;i++)s+=rect(18+i*10,45,7,18);for(let i=0;i<4;i++)s+=line(54+i*80,68,54+i*80,106)+rect(16+i*80,108,76,35,'--blue')+label(54+i*80,130,'32 byte')+label(54+i*80,165,'8 × float');return s;}

function tile(){let s=label(180,20,'같은 SM, 다른 상주 block 수');for(let i=0;i<8;i++)s+=rect(20+i%4*35,40+Math.floor(i/4)*36,28,28);s+=label(86,142,'타일16 / 8 block');s+=rect(228,45,68,68,'--blue')+label(264,142,'타일32 / 1 block');return s+label(180,173,'register 32 → 64인 본문 예제');}
function roof(){return line(40,135,320,135)+line(40,135,40,25)+`<path d="M40 130L180 45H320" fill="none" stroke="var(--accent)" stroke-width="4"/><circle cx="107" cy="110" r="6" fill="var(--orange)"/>`+label(200,160,'산술 집약도 →')+label(106,25,'메모리 대역폭 상한')+label(240,78,'연산 상한')+label(100,102,'관찰값');}
function fusion(){return label(180,20,'중간 결과 z의 왕복을 줄입니다')+rect(20,45,60,35)+rect(145,45,60,35,'--orange')+rect(270,45,60,35,'--blue')+label(50,68,'x, b')+label(175,68,'z')+label(300,68,'y')+line(80,62,145,62)+line(205,62,270,62)+`<path d="M50 95V130H300V95" fill="none" stroke="var(--accent)" stroke-width="3"/>`+label(175,156,'레지스터에서 이어 계산 후 y 저장');}
function devices(){let s='';[[35,42],[245,42],[35,110],[245,110]].forEach(([x,y],i)=>s+=rect(x,y,80,38,i%2?'--accent':'--blue')+label(x+40,y+24,'GPU '+i));return s+line(115,61,245,61)+line(115,129,245,129)+line(75,80,75,110)+line(285,80,285,110)+label(180,22,'분할한 결과를 함께 합칩니다')+label(180,172,'연결선: collective 통신의 개념');}
function review(){let s=label(180,20,'네 조건을 함께 확인합니다');['TTFT','ITL','VRAM','품질'].forEach((x,i)=>s+=rect(14+i*86,45,74,50,i===3?'--blue':'--accent')+label(51+i*86,75,x));return s+line(50,107,310,107)+label(180,140,'모두 충족 → 반복 검증')+label(180,168,'하나라도 미충족 → 원인 조사');}
const CAPTIONS={timeline:'막대 길이가 시간에 비례하는 타임라인입니다. 값은 실험의 “겹침” 예제(묶음 4개, 복사 3 ms, 계산 6 ms)와 같습니다.',batching:'고정 배치는 요청 1이 끝난 뒤 슬롯 1이 40 ms 동안 비고, 매 단계 투입은 그 자리에 요청 3을 바로 넣습니다. 실험의 두 정책과 같은 계산입니다.',paging:'주황 칸은 일부만 찬 마지막 블록입니다. 값은 실험의 기준 예제(요청 129·257·513토큰, 블록 16)에서 계산합니다.'};
function render(id){
 const funcs={timeline:overlap,threads:grid,coalescing:addresses,tiling:tile,evidence:roof,fusion,paging:pages,batching:batch,parallel:devices,review};const art=['metrics','timing'].includes(id)?time(id):funcs[id]?.();
 if(!art)return null;
 return {svg:`<svg viewBox="0 0 360 185" role="img" aria-label="${PBook.chapters.find(c=>c.id===id).title}의 핵심 관계. 아래 흐름 상자에 같은 내용을 글로 설명합니다.">${art}</svg>`,caption:CAPTIONS[id]||'관계와 순서를 보여 주는 개념도입니다. 크기·길이는 실제 비용의 축척이 아니며, 수치는 아래 실험에서 확인합니다.'};
}
return {render};})();
