/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자가 있는 그림은 GMath로 계산한다.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion에서 멈춘다. */
window.GFigures=(()=>{
'use strict';
const M=GMath,G=M.GiB,f=(n,d=2)=>n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const turn=(body,i)=>blink(body,i*1.2,i?'fig-turn':'fig-turn fig-first');
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;

const F={};
F.files=()=>{
 const rows=[['config.json','층 수·폭·head','var(--blue)'],['tokenizer.json','문장 ↔ 정수 ID','var(--orange)'],['model.safetensors','가중치 텐서','var(--accent)']];
 let b=box(16,28,236,244,'var(--line)','var(--chart)',12)+t(30,56,'모델 폴더',{a:'start',fill:'var(--muted)'});
 rows.forEach(([n,s,c],i)=>{const y=74+i*64;b+=box(30,y,208,50,c)+t(44,y+22,n,{a:'start',size:15,w:700})+t(44,y+41,s,{a:'start',size:13,fill:'var(--muted)'})+line(`M238 ${y+25}C268 ${y+25} 268 150 296 150`,c)+dot(242,y+25,52,125-y,c,i*.5,5);});
 b+=box(296,104,132,92,'var(--accent)')+t(362,142,'실행 엔진',{w:700,size:16})+t(362,166,'구조를 만들고',{size:13,fill:'var(--muted)'})+t(362,184,'텐서를 배치',{size:13,fill:'var(--muted)'});
 b+=line('M428 150H470','var(--accent)')+box(470,70,154,160,'var(--orange)','var(--chart)',12)+t(547,98,'CPU · GPU',{w:700});
 for(let r=0;r<3;r++)for(let c=0;c<4;c++)b+=blink(`<rect x="${490+c*30}" y="${116+r*30}" width="22" height="22" rx="3" fill="var(--orange)" opacity=".75"/>`,(r*4+c)*.15);
 b+=t(320,290,'파일은 숫자를 담고, 계산은 실행 엔진과 하드웨어가 합니다',{size:14,fill:'var(--muted)'});
 return {svg:svg('설정·토크나이저·가중치 세 파일을 실행 엔진이 읽어 CPU와 GPU에서 계산하는 그림',b),caption:'모델 폴더의 세 파일은 각자 다른 역할을 맡고, 실행 엔진이 이들을 읽어야 비로소 계산이 시작됩니다. 움직이는 점은 읽는 방향을 보여 주는 시각적 비유입니다.'};
};
F.parameters=()=>{
 const D=4,H=3,total=M.linearParams(D,H),ins=[56,112,168,224],outs=[84,140,196];let b='',k=0;
 ins.forEach(y1=>outs.forEach(y2=>{b+=blink(`<line x1="110" y1="${y1}" x2="320" y2="${y2}" stroke="var(--accent)" stroke-width="2.5"/>`,k*.25);b+=`<line x1="110" y1="${y1}" x2="320" y2="${y2}" stroke="var(--line)" stroke-width="1"/>`;k++;}));
 ins.forEach((y,i)=>b+=`<circle cx="110" cy="${y}" r="16" fill="var(--panel2)" stroke="var(--blue)" stroke-width="2"/>`+t(110,y+5,'x'+(i+1),{size:13}));
 outs.forEach((y,i)=>b+=`<circle cx="320" cy="${y}" r="16" fill="var(--panel2)" stroke="var(--orange)" stroke-width="2"/>`+t(320,y+5,'y'+(i+1),{size:13})+box(348,y-11,40,22,'var(--orange)','var(--chart)',4)+t(368,y+5,'+b',{size:13}));
 b+=t(110,262,`입력 폭 D = ${D}`,{fill:'var(--blue)',size:14})+t(330,262,`출력 폭 H = ${H}`,{fill:'var(--orange)',size:14});
 b+=box(420,60,204,170,'var(--line)','var(--chart)',10)+t(522,94,`선 = 가중치 ${D} × ${H} = ${D*H}`,{size:14})+t(522,128,`편향 = ${H}`,{size:14})+`<path d="M440 146H604" stroke="var(--line)"/>`+t(522,182,`${total}개`,{size:30,w:700,fill:'var(--accent)'})+t(522,210,'이 층의 파라미터',{size:13,fill:'var(--muted)'});
 return {svg:svg(`입력 ${D}개와 출력 ${H}개를 잇는 선 ${D*H}개와 편향 ${H}개, 합계 ${total}개의 파라미터`,b,290),caption:`입력 4개와 출력 3개를 잇는 선 하나가 가중치 하나입니다. 선 ${D*H}개에 편향 ${H}개를 더해 ${total}개를 셉니다. 8B 모델은 이런 칸이 약 80억 개 있다는 뜻입니다(실제 계산).`};
};
F.weights=()=>{
 const rows=[16,8,4].map(bit=>[bit,M.weightBytes(8,bit)]),max=rows[0][1];let b=t(320,34,'가상 Dense 8B · 저장할 숫자 8 × 10⁹개',{size:15,fill:'var(--muted)'});
 rows.forEach(([bit,bytes],i)=>{const y=70+i*70,w=bytes/max*330;b+=t(20,y+24,`${bit} bit`,{a:'start',size:17,w:700})+t(20,y+44,`숫자 하나 ${bit/8} byte`,{a:'start',size:13,fill:'var(--muted)'})+box(130,y+4,330,34,'var(--line)','var(--panel2)',4)+grow(130,y+4,w,34,i===2?'var(--accent)':i?'var(--blue)':'var(--orange)',i*.4)+t(474,y+20,`${f(bytes/1e9,1)} GB`,{a:'start',size:16,w:700})+t(474,y+40,`= ${f(bytes/G)} GiB`,{a:'start',size:13,fill:'var(--muted)'});});
 b+=t(320,290,'GB는 10⁹ byte, GiB는 2³⁰ byte입니다. 같은 용량도 GiB로 적으면 숫자가 작아집니다',{size:13,fill:'var(--muted)'});
 return {svg:svg('가상 8B 모델 가중치 용량: 16bit 16 GB, 8bit 8 GB, 4bit 4 GB',b),caption:'같은 80억 개의 숫자도 숫자 하나에 쓰는 bit 수에 따라 용량이 절반씩 줄어듭니다. 가중치만 계산한 값이며 KV와 실행 여유는 들어 있지 않습니다(실제 계산).'};
};
F.journey=()=>{
 const n=[[16,'저장장치','SSD · 파일','var(--muted)'],[176,'CPU · RAM','문장 처리 · 준비','var(--blue)'],[436,'GPU · VRAM','가중치 보관 · 계산','var(--accent)']];let b='';
 n.forEach(([x,a,s,c])=>b+=box(x,90,x>400?188:140,90,c)+t(x+(x>400?94:70),128,a,{w:700,size:16})+t(x+(x>400?94:70),152,s,{size:13,fill:'var(--muted)'}));
 b+=line('M156 135H176','var(--muted)')+line('M316 135H436','var(--orange)')+t(376,124,'PCIe',{size:13,fill:'var(--orange)'});
 b+=t(300,28,'① 처음 한 번 · 가중치 수 GB',{size:14,fill:'var(--orange)'})+line('M86 88C200 44 420 44 520 88','var(--orange)')+`<rect class="fig-pkt fig-slow" style="--dx:430px;--dy:0px" x="76" y="70" width="26" height="18" rx="3" fill="var(--orange)"/>`;
 b+=`<path d="M560 182c40 30-40 50-40 0" fill="none" stroke="var(--accent)" stroke-width="2" class="fig-dash"/>`+t(530,240,'② 매 토큰 VRAM에서 다시 읽음',{size:14,fill:'var(--accent)'});
 b+=line('M470 210C420 270 300 270 250 182','var(--blue)')+dot(470,210,-210,-28,'var(--blue)',0,5)+t(300,278,'③ 고른 토큰 ID 몇 byte만 CPU로',{size:14,fill:'var(--blue)'});
 return {svg:svg('가중치는 처음 한 번 PCIe로 VRAM에 옮기고, 토큰마다 VRAM에서 다시 읽으며, 작은 토큰 ID만 CPU로 돌아가는 그림',b),caption:'큰 가중치는 처음 한 번 PCIe를 건너 VRAM에 자리를 잡습니다. 그 뒤로는 토큰마다 GPU 안에서 다시 읽고, 매번 CPU로 돌아가는 것은 작은 토큰 ID뿐입니다(단순화한 시나리오).'};
};
F.hierarchy=()=>{
 const L=[['VRAM (HBM·GDDR)','수십 GB · GPU 전체','var(--blue)',470],['L2 캐시','수십 MB · GPU 전체가 공유','var(--blue)',420],['L1 · shared memory','SM마다 수백 KB 이하','var(--accent)',340],['레지스터','스레드가 바로 쓰는 칸','var(--accent)',270],['Tensor Core','곱하고 누적하는 연산 유닛','var(--orange)',210]];let b='';
 L.forEach(([a,s,c,w],i)=>{const x=320-w/2,y=14+i*54;b+=box(x,y,w,44,c,'var(--panel2)',6)+t(320,y+20,a,{w:700,size:15})+t(320,y+38,s,{size:12,fill:'var(--muted)'});});
 b+=`<rect class="fig-pkt fig-down" style="--dx:0px;--dy:216px" x="${320+95}" y="22" width="18" height="18" rx="3" fill="var(--orange)"/>`;
 b+=blink(`<circle cx="${320+80}" cy="250" r="7" fill="var(--orange)"/>`,1.6)+blink(`<circle cx="${320+80}" cy="250" r="12" fill="none" stroke="var(--orange)" stroke-width="2"/>`,2);
 b+=t(10,40,'크고 멀다',{a:'start',size:12,fill:'var(--muted)'})+t(10,262,'작고 가깝다',{a:'start',size:12,fill:'var(--muted)'})+`<path d="M30 52V240" stroke="var(--muted)" stroke-width="2" marker-end="url(#fh)"/><defs><marker id="fh" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>`;
 return {svg:svg('VRAM, L2, shared memory, 레지스터, 연산 유닛으로 갈수록 작고 계산기에 가까워지는 GPU 저장 계층',b,290),caption:'아래로 내려갈수록 저장 공간은 작아지고 계산기에 가까워집니다. 한 번 내려온 타일을 여러 번 쓰면 위층에서 다시 읽는 횟수가 줄어듭니다. 크기 비율은 맞추지 않은 개념도입니다.'};
};
F.transformer=()=>{
 const grid=(x,y,c,label,sub)=>{let s='';for(let r=0;r<4;r++)for(let k=0;k<4;k++)s+=`<rect x="${x+k*30}" y="${y+r*30}" width="26" height="26" rx="3" fill="var(--panel2)" stroke="var(--line)"/>`;return s+t(x+58,y+146,label,{w:700,size:15,fill:c})+t(x+58,y+166,sub,{size:12,fill:'var(--muted)'});};
 let b=grid(40,50,'var(--blue)','X','토큰 × 폭')+t(194,115,'×',{size:28})+grid(240,50,'var(--accent)','W','학습된 가중치')+t(394,115,'=',{size:28})+grid(440,50,'var(--orange)','Y','새 표현');
 [[0,0],[0,1],[1,0],[1,1]].forEach(([r,c],i)=>b+=turn(`<rect x="38" y="${48+r*60}" width="122" height="58" rx="4" fill="var(--blue)" opacity=".28" stroke="var(--blue)"/><rect x="${238+c*60}" y="48" width="58" height="122" rx="4" fill="var(--accent)" opacity=".28" stroke="var(--accent)"/><rect x="${438+c*60}" y="${48+r*60}" width="58" height="58" rx="4" fill="var(--orange)" opacity=".55" stroke="var(--orange)" stroke-width="2"/>`,i));
 b+=t(320,262,'Y의 2×2 타일 하나 = X의 두 행 띠 × W의 두 열 띠 · M×K와 K×N을 곱하면 약 2MKN FLOP',{size:13,fill:'var(--muted)'});
 return {svg:svg('행렬 X와 W를 곱해 Y를 만들 때, Y의 2×2 타일 하나가 X의 두 행과 W의 두 열로 계산되는 그림',b,290),caption:'Y의 2×2 타일 하나를 채우려면 X의 두 행과 W의 두 열만 있으면 됩니다. 강조된 타일이 차례로 옮겨 가는 모습은 GPU가 큰 행렬곱을 작은 타일로 나누어 처리하는 방식을 단순화한 그림입니다.'};
};
F.phases=()=>{
 const cell=(x,y,c,s,o=1)=>`<rect x="${x}" y="${y}" width="40" height="34" rx="5" fill="${c}" opacity="${o}"/>`+t(x+20,y+22,s,{size:13,fill:'var(--bg)',w:700});
 let b=t(20,40,'Prefill',{a:'start',w:700,size:17,fill:'var(--accent)'})+t(110,40,'프롬프트 6개 위치를 한꺼번에 계산하고 K·V를 남깁니다',{a:'start',size:13,fill:'var(--muted)'});
 b+=blink([0,1,2,3,4,5].map(i=>cell(20+i*46,56,'var(--accent)','p'+(i+1))).join('')+`<path d="M300 73H336" stroke="var(--accent)" stroke-width="2"/>`+cell(342,56,'var(--orange)','g1')+t(362,108,'첫 출력',{size:12,fill:'var(--orange)'}),0);
 b+=t(20,148,'Decode',{a:'start',w:700,size:17,fill:'var(--orange)'})+t(110,148,'새 토큰 하나씩, 남겨 둔 K·V를 읽으며 이어 갑니다',{a:'start',size:13,fill:'var(--muted)'});
 b+=[0,1,2,3,4,5,6].map(i=>cell(20+i*46,164,'var(--muted)',i<6?'p'+(i+1):'g1',.55)).join('');
 [0,1,2].forEach(i=>b+=blink(cell(342+i*46,164,'var(--orange)','g'+(i+2))+`<path d="M${362+i*46} 200Q${362+i*46} 232 338 216" fill="none" stroke="var(--orange)" stroke-width="1.5" stroke-dasharray="4 4"/>`,.4+i*.9));
 b+=`<path d="M22 206V214H336V206" fill="none" stroke="var(--muted)" stroke-width="1.5"/>`+t(178,236,'과거 K·V를 읽음',{size:13,fill:'var(--muted)'});
 b+=t(20,282,'출력 G개 = prefill 1번(첫 출력 g1) + decode G−1번(g2부터)',{a:'start',size:14,fill:'var(--text)'});
 return {svg:svg('Prefill은 프롬프트 6개 위치를 한꺼번에 처리해 첫 출력 g1을 내고, Decode는 g2부터 새 토큰을 하나씩 만들며 과거 K·V를 읽는 그림',b),caption:'Prefill은 프롬프트 여러 위치를 함께 계산하고 K·V를 남깁니다. 첫 출력 g1은 prefill 끝에서 나오고, decode는 g2부터 새 토큰을 하나 만들 때마다 앞에서 남긴 K·V 전체를 다시 읽습니다. 점선은 읽기를 뜻하는 개념도입니다.'};
};
F.cache=()=>{
 const m=M.models.toy,perToken=M.kvBytes({...m,tokens:1}),ctx=M.kvBytes({...m,tokens:8192});let b='';
 [2,1].forEach(o=>b+=`<rect x="${70+o*10}" y="${30-o*10}" width="400" height="200" rx="8" fill="var(--chart)" stroke="var(--line)"/>`);
 b+=box(70,30,400,200,'var(--line)','var(--chart)',8)+t(270,22,'요청 B개면 이 격자도 B장',{size:12,fill:'var(--muted)'});
 ['층 1','층 2','층 3','…','층 L'].forEach((s,r)=>b+=t(40,64+r*38,s,{size:13,fill:'var(--muted)'}));
 for(let c=0;c<8;c++){let col='';for(let r=0;r<5;r++){const y=46+r*38;col+=`<rect x="${88+c*46}" y="${y}" width="18" height="28" rx="2" fill="var(--accent)"/><rect x="${108+c*46}" y="${y}" width="18" height="28" rx="2" fill="var(--blue)"/>`;}b+=c<4?col:blink(col,(c-4)*.7);}
 b+=t(270,250,'토큰 →  (열 하나 = 토큰 하나의 K와 V, 모든 층)',{size:13,fill:'var(--muted)'});
 b+=box(490,60,136,150,'var(--orange)','var(--panel2)',10)+t(558,88,'가상 8B · 16bit',{size:12,fill:'var(--muted)'})+t(558,118,`토큰당 ${f(perToken/1024,0)} KiB`,{size:15,w:700})+t(558,150,'8,192 토큰이면',{size:12,fill:'var(--muted)'})+t(558,182,`${f(ctx/G)} GiB`,{size:22,w:700,fill:'var(--orange)'});
 b+=`<rect x="100" y="270" width="12" height="12" fill="var(--accent)"/>`+t(118,281,'K',{a:'start',size:13})+`<rect x="150" y="270" width="12" height="12" fill="var(--blue)"/>`+t(168,281,'V',{a:'start',size:13});
 return {svg:svg(`층마다 토큰 하나당 K와 V를 저장하는 KV 캐시 격자. 가상 8B 16bit에서 토큰당 ${f(perToken/1024,0)} KiB, 8192 토큰이면 ${f(ctx/G)} GiB`,b),caption:`토큰이 하나 늘 때마다 모든 층에 K와 V 한 칸씩이 추가됩니다. 가상 8B(32층·KV head 8·차원 128·16bit)에서는 토큰당 ${f(perToken/1024,0)} KiB, 8,192 토큰이면 ${f(ctx/G)} GiB입니다(실제 계산).`};
};
F.bottleneck=()=>{
 const bw=500e9,peak=50e12,ridge=peak/bw,dec=M.roofline({batch:1}).intensity,pre=M.roofline({batch:512}).intensity;
 const X=v=>70+Math.log10(v)/4*520,Y=v=>250-Math.log10(v/1e11)/3*210,r=v=>Math.min(v*bw,peak);
 let b=`<path d="M70 30V250H600" fill="none" stroke="var(--line)" stroke-width="2"/>`;
 b+=`<path class="fig-draw" d="M${X(1)} ${Y(r(1))}L${X(ridge)} ${Y(peak)}L${X(1e4)} ${Y(peak)}" fill="none" stroke="var(--accent)" stroke-width="3"/>`;
 b+=t(X(12)-14,Y(r(12))-14,'대역폭 경사 · 메모리가 막음',{size:13,fill:'var(--accent)',a:'end'})+t(X(2000),Y(peak)-12,'연산 지붕 · 계산이 막음',{size:13,fill:'var(--accent)'});
 [[dec,'decode · 배치 1','var(--orange)'],[pre,'512개 함께','var(--blue)']].forEach(([v,s,c])=>b+=`<circle class="fig-pulse" cx="${X(v)}" cy="${Y(r(v))}" r="8" fill="${c}"/>`+t(X(v)+(v<10?16:-10),Y(r(v))+(v<10?30:30),`${s} · ${f(v,0)} FLOP/byte`,{size:13,fill:c,a:v<10?'start':'middle'}));
 b+=`<path d="M${X(ridge)} ${Y(peak)}V250" stroke="var(--muted)" stroke-dasharray="4 4"/>`+t(X(ridge),270,`경계 ${f(ridge,0)}`,{size:12,fill:'var(--muted)'});
 b+=t(335,292,'가로: 읽은 byte당 연산 수(로그)  ·  세로: 낼 수 있는 연산 속도(로그)',{size:13,fill:'var(--muted)'});
 return {svg:svg('roofline 그림. 배치 1 decode는 대역폭 경사에, 512개를 함께 계산하면 연산 지붕 쪽에 놓인다',b),caption:`가상 장비(대역폭 500 GB/s, 연산 50 TFLOP/s)에서 4bit 8B 가중치만 셌을 때, 배치 1 decode는 byte당 ${f(dec,0)} FLOP라 대역폭 경사에 걸립니다. 512개 위치를 함께 계산하면 ${f(pre,0)} FLOP/byte로 연산 지붕에 닿습니다(이상적 모형 계산).`};
};
F.tradeoffs=()=>{
 const m=M.moe(8,2);let b=box(20,96,110,70,'var(--muted)')+t(75,126,'라우터',{w:700})+t(75,148,'토큰마다 선택',{size:12,fill:'var(--muted)'});
 b+=`<circle class="fig-pkt" style="--dx:60px;--dy:0px" cx="-10" cy="131" r="7" fill="var(--text)"/>`;
 const at=i=>[180+(i%4)*70,60+Math.floor(i/4)*90];
 for(let i=0;i<8;i++){const [x,y]=at(i);b+=box(x,y,58,58,'var(--line)','var(--panel2)',6)+t(x+29,y+35,'E'+(i+1),{size:14,fill:'var(--muted)'});}
 [[0,5],[2,3],[1,6],[4,7]].forEach((pair,k)=>b+=turn(pair.map(i=>{const [x,y]=at(i);return `<rect x="${x}" y="${y}" width="58" height="58" rx="6" fill="var(--accent)" opacity=".35" stroke="var(--accent)" stroke-width="3"/>`;}).join(''),k));
 b+=box(470,60,156,148,'var(--orange)','var(--chart)',10)+t(548,92,'가상 MoE',{size:13,fill:'var(--muted)'})+t(548,124,`저장 ${f(m.total,1)}B`,{size:17,w:700})+t(548,152,'모든 expert',{size:12,fill:'var(--muted)'})+t(548,182,`계산 ${f(m.active,1)}B`,{size:17,w:700,fill:'var(--accent)'})+t(548,200,'토큰당 2개 선택',{size:12,fill:'var(--muted)'});
 [['양자화','숫자 크기 ↓ · 오차 ↑'],['Offload','VRAM ↓ · 전송 ↑'],['여러 GPU','나누어 보관 · 통신 ↑']].forEach(([a,s],i)=>b+=box(20+i*206,232,190,52,'var(--line)','var(--panel2)',6)+t(115+i*206,254,a,{w:700,size:14})+t(115+i*206,274,s,{size:12,fill:'var(--muted)'}));
 return {svg:svg(`MoE 라우터가 expert 8개 중 2개를 고르는 그림. 저장 ${f(m.total,1)}B, 계산 ${f(m.active,1)}B. 아래에 양자화·offload·여러 GPU의 대가`,b),caption:`MoE는 토큰마다 expert 일부만 계산하지만 모든 expert를 보관해야 합니다. 가상 모형(공통 2B + expert당 0.5B)에서 8개 중 2개를 고르면 저장 ${f(m.total,1)}B, 계산 ${f(m.active,1)}B입니다. 아래 세 방법도 줄이는 것과 늘어나는 것이 짝을 이룹니다.`};
};
F.modelcards=()=>{
 const ms=[M.models.q8,M.models.q30].map(m=>({m,w:M.weightBytes(m.params,16)/G,kv:M.kvBytes({...m,tokens:8192})/G})),mw=Math.max(...ms.map(x=>x.w)),mk=Math.max(...ms.map(x=>x.kv));let b='';
 ms.forEach(({m,w,kv},i)=>{const x=16+i*316;b+=box(x,16,292,268,i?'var(--blue)':'var(--accent)','var(--chart)',12)+t(x+146,46,m.name,{w:700,size:17});
  b+=t(x+146,72,`전체 ${m.params}B · 활성 ${m.active}B`,{size:13,fill:'var(--muted)'})+t(x+146,94,`${m.layers}층 · KV head ${m.kvHeads} · 차원 ${m.headDim}`,{size:13,fill:'var(--muted)'});
  b+=t(x+20,130,'가중치 16bit',{a:'start',size:13})+box(x+20,138,252,22,'var(--line)','var(--panel2)',3)+grow(x+20,138,w/mw*252,22,'var(--orange)',i*.4)+t(x+272,180,`${f(w)} GiB`,{a:'end',size:15,w:700});
  b+=t(x+20,214,'KV · 8,192 토큰',{a:'start',size:13})+box(x+20,222,252,22,'var(--line)','var(--panel2)',3)+grow(x+20,222,kv/mk*252,22,'var(--blue)',.8+i*.4)+t(x+272,268,`${f(kv,3)} GiB`,{a:'end',size:15,w:700});});
 return {svg:svg(`Qwen3-8B 가중치 ${f(ms[0].w)} GiB, KV ${f(ms[0].kv,3)} GiB와 Qwen3-30B-A3B 가중치 ${f(ms[1].w)} GiB, KV ${f(ms[1].kv,3)} GiB 비교`,b),caption:`Qwen3-30B-A3B는 가중치가 훨씬 크지만 KV head가 4개라 같은 문맥의 KV는 더 작습니다. 공식 config의 층·KV head·차원으로 계산했습니다(16bit, 8,192 토큰, 요청 1).`};
};
F.design=()=>{
 const S=[['과제 시작 조건','16bit · 32,768 토큰 · 요청 4',{bits:16,tokens:32768,batch:4}],['문맥·요청 줄이기','8bit · 16,384 토큰 · 요청 2',{bits:8,tokens:16384,batch:2}],['표지의 예','4bit · 8,192 토큰 · 요청 1',{bits:4,tokens:8192,batch:1}]].map(([a,s,o])=>[a,s,M.budget(o)]);
 const max=Math.max(...S.map(x=>x[2].total)),sc=420/max,cap=24*G*sc,parts=[['weights','가중치','var(--orange)'],['metadata','부가정보','var(--muted)'],['kv','KV','var(--blue)'],['workspace','여유','var(--accent)']];let b='';
 S.forEach(([a,s,r],i)=>{const y=34+i*76;let x=190;b+=t(16,y+18,a,{a:'start',size:15,w:700})+t(16,y+38,s,{a:'start',size:12,fill:'var(--muted)'});
  parts.forEach(([k,,c],j)=>{const w=r[k]*sc;b+=grow(x,y,w,30,c,i*.5+j*.15);x+=w;});b+=t(190,y+52,`합계 ${f(r.total/G)} GiB · ${r.fits?'들어감':'초과'}`,{a:'start',size:13,fill:r.fits?'var(--accent)':'var(--orange)'});});
 b+=`<path d="M${190+cap} 20V250" stroke="var(--orange)" stroke-width="2" stroke-dasharray="6 5"/>`+t(190+cap,270,'가용 24 GiB',{size:13,fill:'var(--orange)'});
 parts.forEach(([,s,c],j)=>b+=`<rect x="${190+j*96}" y="282" width="12" height="12" fill="${c}"/>`+t(208+j*96,293,s,{a:'start',size:12}));
 return {svg:svg('가상 8B 모델의 세 가지 실행 조건에서 가중치·부가정보·KV·여유를 쌓은 막대와 24 GiB 선',b),caption:`가상 8B 모델의 같은 24 GiB 장비에서 조건만 바꾼 세 예산입니다. 시작 조건은 ${f(S[0][2].total/G)} GiB로 넘치고, bit·문맥·요청을 줄이면 ${f(S[1][2].total/G)} GiB, ${f(S[2][2].total/G)} GiB로 들어옵니다. 부가정보 10%와 여유 2 GiB는 가정입니다(실제 계산).`};
};
return {render:id=>F[id]?F[id]():null,ids:Object.keys(F)};
})();
