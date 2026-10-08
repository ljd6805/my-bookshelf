window.PFigures=(()=>{
const rect=(x,y,w,h,color='--accent')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="var(${color})" opacity=".65"/>`;
const label=(x,y,s,size=12)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}">${s}</text>`;
const line=(x,y,a,b)=>`<path d="M${x} ${y}L${a} ${b}" stroke="var(--line)" stroke-width="2"/>`;
function time(id){
 const points={metrics:[['요청',0],['첫 토큰',100],['다음',170],['마지막',260]],timing:[['CPU 제출',0],['GPU 시작',80],['CPU 반환',150],['GPU 완료',260]],timeline:[['복사 1',0],['계산 1',80],['복사 2',150],['계산 2',260]]}[id];
 return line(30,80,325,80)+points.map(([s,x],i)=>`<circle cx="${40+x}" cy="80" r="6" fill="var(${i%2?'--blue':'--accent'})"/>`+line(40+x,80,40+x,i%2?106:55)+label(40+x,i%2?125:40,s)).join('');
}
function grid(){let s=label(175,20,'grid → block → warp');for(let b=0;b<2;b++){s+=`<rect x="${16+b*172}" y="35" width="160" height="110" rx="8" fill="none" stroke="var(--line)"/>`+label(96+b*172,58,'block '+b);for(let i=0;i<16;i++)s+=rect(28+b*172+i%8*17,75+Math.floor(i/8)*22,12,16,i<8?'--accent':'--blue');}return s+label(180,170,'작은 칸 = thread');}
function addresses(){let s=label(175,20,'32개 lane의 연속 접근 → 4개 sector');for(let i=0;i<32;i++)s+=rect(18+i*10,45,7,18);for(let i=0;i<4;i++)s+=line(54+i*80,68,54+i*80,106)+rect(16+i*80,108,76,35,'--blue')+label(54+i*80,130,'32 byte')+label(54+i*80,165,'8 × float');return s;}

function tile(){let s=label(180,20,'같은 SM, 다른 상주 block 수');for(let i=0;i<8;i++)s+=rect(20+i%4*35,40+Math.floor(i/4)*36,28,28);s+=label(86,142,'타일16 / 8 block');s+=rect(228,45,68,68,'--blue')+label(264,142,'타일32 / 1 block');return s+label(180,173,'register 32 → 64인 본문 예제');}
function roof(){return line(40,135,320,135)+line(40,135,40,25)+`<path d="M40 130L180 45H320" fill="none" stroke="var(--accent)" stroke-width="4"/><circle cx="107" cy="110" r="6" fill="var(--orange)"/>`+label(200,160,'산술 집약도 →')+label(106,25,'처리량 상한')+label(240,78,'연산 상한')+label(100,102,'관찰값');}
function fusion(){return label(180,20,'중간 결과 z의 왕복을 줄입니다')+rect(20,45,60,35)+rect(145,45,60,35,'--orange')+rect(270,45,60,35,'--blue')+label(50,68,'x, b')+label(175,68,'z')+label(300,68,'y')+line(80,62,145,62)+line(205,62,270,62)+`<path d="M50 95V130H300V95" fill="none" stroke="var(--accent)" stroke-width="3"/>`+label(175,156,'레지스터에서 이어 계산 후 y 저장');}
function pages(){let s=label(180,20,'논리 블록과 물리 블록의 연결');const map=[2,0,3,1];for(let i=0;i<4;i++){s+=rect(22+i*83,40,65,28)+label(55+i*83,60,'논리 '+i)+line(55+i*83,70,55+map[i]*83,117)+rect(22+i*83,120,65,28,'--blue')+label(55+i*83,140,'물리 '+i);}return s;}
function batch(){let s=label(180,20,'완료한 자리로 다음 요청이 들어옵니다');[[0,4],[1,7],[2,3]].forEach(([lane,count])=>{s+=label(42,59+lane*38,'슬롯 '+(lane+1));for(let i=0;i<7;i++)s+=rect(86+i*32,40+lane*38,28,24,i<count?'--accent':'--blue');});return s+label(185,174,'색 경계는 슬롯의 요청 교체를 뜻합니다');}
function devices(){let s='';[[35,42],[245,42],[35,110],[245,110]].forEach(([x,y],i)=>s+=rect(x,y,80,38,i%2?'--accent':'--blue')+label(x+40,y+24,'GPU '+i));return s+line(115,61,245,61)+line(115,129,245,129)+line(75,80,75,110)+line(285,80,285,110)+label(180,22,'분할한 결과를 함께 합칩니다')+label(180,172,'연결선: collective 통신의 개념');}
function review(){let s=label(180,20,'네 조건을 함께 확인합니다');['TTFT','ITL','VRAM','품질'].forEach((x,i)=>s+=rect(14+i*86,45,74,50,i===3?'--blue':'--accent')+label(51+i*86,75,x));return s+line(50,107,310,107)+label(180,140,'모두 충족 → 반복 검증')+label(180,168,'하나라도 미충족 → 원인 조사');}
function render(id){
 const funcs={threads:grid,coalescing:addresses,tiling:tile,evidence:roof,fusion,paging:pages,batching:batch,parallel:devices,review};const art=['metrics','timing','timeline'].includes(id)?time(id):funcs[id]?.();
 if(!art)return null;
 return {svg:`<svg viewBox="0 0 360 185" role="img" aria-label="${PBook.chapters.find(c=>c.id===id).title}의 핵심 관계. 아래 흐름 상자에 같은 내용을 글로 설명합니다.">${art}</svg>`,caption:'관계와 순서를 보여 주는 개념도입니다. 크기·길이는 실제 비용의 축척이 아니며, 수치는 아래 실험에서 확인합니다.'};
}
return {render};})();
