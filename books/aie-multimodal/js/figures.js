/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림. 숫자가 있는 그림은 A13Math로 계산한다.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다. */
window.A13Figures=(()=>{
'use strict';
const M=A13Math,f=(n,d=0)=>n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const H={svg,t,box,line,dot,blink,grow,pulse};
const F={};
const AC='var(--accent)',BL='var(--blue)',OR='var(--orange)',MU='var(--muted)';

F.patches=()=>{
 const r=M.patchTokens(224,224,16,1),c=26;let b='';
 b+=t(100,30,'표시창 사진 224×224',{size:14,fill:MU});
 for(let y=0;y<6;y++)for(let x=0;x<6;x++)b+=`<rect x="${22+x*c}" y="${44+y*c}" width="${c-2}" height="${c-2}" rx="2" fill="var(--panel2)" stroke="var(--line)"/>`;
 b+=`<rect x="48" y="96" width="102" height="50" rx="4" fill="none" stroke="${BL}" stroke-width="2"/>`+t(99,128,'E-21',{size:20,w:700,fill:BL});
 b+=`<rect class="fig-pkt fig-slow" style="--dx:${5*c}px;--dy:0px" x="22" y="${44+2*c}" width="${c-2}" height="${c-2}" rx="2" fill="none" stroke="${OR}" stroke-width="3"/>`;
 b+=t(100,218,'P×P 패치 하나 = 3P² 숫자',{size:13,fill:OR});
 b+=line('M190 120H250',AC)+t(220,108,'공유 투영',{size:13,fill:AC});
 b+=box(256,96,96,48,AC)+t(304,126,'768 → D',{size:15});
 b+=line('M352 120H392',AC);
 for(let i=0;i<7;i++)b+=blink(box(398+i*32,100,26,40,i===0?OR:AC,'var(--panel2)',4)+t(411+i*32,126,i===0?'C':String(i),{size:13}),i*.35);
 b+=t(510,86,'토큰 열',{size:14,fill:MU})+t(412,166,'[CLS]',{size:13,fill:OR,a:'start'});
 b+=t(320,250,`224 ÷ 16 = ${r.gh} → ${r.gh}×${r.gw} = ${r.patches}개 패치 + [CLS] = ${r.seq}토큰`,{size:15,w:700,fill:AC});
 b+=t(320,278,`픽셀 하나씩이면 ${f(r.raw)}개 숫자 · 어텐션 쌍 ${f(r.pairs)}`,{size:13,fill:MU});
 return {svg:svg(`표시창 사진을 16픽셀 패치로 잘라 ${r.patches}개 패치와 [CLS]를 합한 ${r.seq}토큰으로 바꾸는 그림`,b),caption:`주황 창이 패치를 하나씩 집어 같은 행렬로 투영하면 토큰 열이 차례로 생깁니다. 토큰 수와 쌍의 수는 식으로 실제 계산한 값이고, 창이 움직이는 모습은 순서를 보여 주는 애니메이션입니다.`};
};
F.clip=()=>{
 const I=[[0.9,0.2,0.1],[0.2,0.9,0.2],[0.1,0.2,0.95]],T=[[0.85,0.3,0.15],[0.25,0.85,0.3],[0.2,0.15,0.9]],S=M.simMatrix(I,T);
 const imgs=['E-21 표시창','막힌 필터','꺾인 호스'],txts=['“E-21: 배수 불량”','“필터를 청소하세요”','“호스를 펴세요”'];let b='';
 imgs.forEach((n,i)=>{b+=box(18,64+i*66,120,46,BL)+t(78,93+i*66,n,{size:14});});
 txts.forEach((n,j)=>{b+=box(480,64+j*66,148,46,OR)+t(554,93+j*66,n,{size:13});});
 b+=t(78,48,'사진 인코더',{size:14,fill:BL})+t(554,48,'글 인코더',{size:14,fill:OR});
 S.forEach((row,i)=>row.forEach((v,j)=>{const x=200+j*76,y=64+i*66,on=i===j;b+=(on?blink(box(x,y,68,46,AC,'color-mix(in srgb,var(--accent) 25%,var(--panel2))',6),i*.6):box(x,y,68,46,'var(--line)','var(--panel2)',6))+t(x+34,y+29,v.toFixed(2),{size:15,w:on?700:400,fill:on?AC:'var(--text)'});}));
 b+=line('M140 87H196',BL)+line('M432 87H476',OR);
 b+=pulse(234,87,30,AC);
 b+=t(314,282,'대각선(짝)은 높이고 나머지는 낮추도록 두 인코더를 함께 학습',{size:14,fill:MU});
 return {svg:svg(`사진 셋과 문장 셋의 코사인 유사도 표에서 대각선 ${S[0][0].toFixed(2)} 등 짝이 맞는 칸이 강조되는 그림`,b),caption:`가운데 표의 숫자는 미리 정한 3차원 예시 벡터로 실제 계산한 코사인 유사도입니다. 대각선이 차례로 밝아지는 움직임은 학습이 짝을 끌어당기는 방향을 보여 주는 비유입니다.`};
};
F.bridge=()=>{
 const q=M.qformer(256,32,8);let b='';
 b+=t(70,30,'얼린 ViT 패치',{size:14,fill:MU});
 for(let i=0;i<8;i++)b+=box(30,42+i*27,80,21,'var(--line)','var(--panel2)',4);
 b+=t(70,282,'사진당 256개',{size:13,fill:MU});
 b+=t(250,30,'학습되는 쿼리',{size:14,fill:AC});
 for(let i=0;i<4;i++){const y=70+i*44;b+=box(210,y,80,30,AC)+t(250,y+21,`Q${i+1}`,{size:14,w:700});for(let k=0;k<8;k+=3)b+=line(`M110 ${52+k*27}L210 ${y+15}`,'var(--line)');b+=dot(110,52+i*54,100,y+15-52-i*54,AC,i*.5,5);}
 b+=t(250,268,`32개로 요약 · ${q.ratio}배 압축`,{size:13,fill:AC});
 b+=line('M290 140H350',AC);
 b+=box(356,40,130,200,BL,'var(--panel2)',10)+t(421,64,'얼린 언어 모델',{size:14,fill:BL});
 for(let i=0;i<3;i++)b+=box(372,80+i*50,98,34,'var(--line)','var(--chart)',5)+t(421,102+i*50,`층 ${i*4+1}–${i*4+4}`,{size:13,fill:MU});
 b+=box(504,108,120,64,OR)+t(564,132,'tanh(α)·XAttn',{size:13,fill:OR})+`<rect x="514" y="146" width="100" height="12" rx="3" fill="var(--chart)"/>`+grow(514,146,60,12,OR,.4)+t(564,194,'α₀ = 0 → 0.6',{size:13,fill:MU});
 b+=line('M486 140H504',OR);
 b+=t(320,290,`사진 8장: 패치 그대로 ${f(q.mlp)}토큰 → Q-Former ${f(q.qf)}토큰`,{size:14,w:700,fill:'var(--text)'});
 return {svg:svg(`얼린 ViT 패치를 쿼리 32개가 교차 어텐션으로 요약하고, 게이트 tanh(α)가 0에서 열리며 얼린 언어 모델 층 사이로 시각 정보를 섞는 그림`,b),caption:`왼쪽은 BLIP-2의 Q-Former가 패치를 쿼리로 모으는 모습, 오른쪽은 Flamingo의 게이트가 0에서 조금씩 열리는 모습입니다. 토큰 수와 압축률은 실제 계산이고, 게이트 막대가 자라는 것은 학습 과정을 보여 주는 비유입니다(0.6은 실험의 목표 예시).`};
};
F.recipe=()=>{
 const tok=M.patchTokens(336,336,14).patches,ctx=M.contextBudget(2048,tok,1,0);let b='';
 const st=[['CLIP ViT-L/14','336 → 576 패치',BL],['2층 MLP','1024 → D',OR],['언어 모델','답 생성',AC]];
 st.forEach(([a,s,c],i)=>{const x=24+i*212;b+=box(x,40,170,70,c)+t(x+85,70,a,{size:15,w:700})+t(x+85,94,s,{size:13,fill:MU});if(i<2)b+=line(`M${x+170} 75H${x+212}`,c)+dot(x+170,75,40,0,c,i*.6,5);});
 b+=t(320,146,'프롬프트: [시스템] [<image> → 576토큰] [질문]',{size:14});
 b+=`<rect x="40" y="160" width="560" height="26" rx="4" fill="var(--panel2)"/>`+grow(40,160,560*ctx.share,26,BL,.3)+t(42+560*ctx.share/2,178,`이미지 ${tok}`,{size:13,fill:'var(--bg)'})+t(40+560*ctx.share+(560*(1-ctx.share))/2,178,`글 자리 ${f(ctx.left)} (문맥 2,048)`,{size:13,fill:MU});
 b+=blink(box(60,210,240,46,OR)+t(180,238,'1단계 정렬: MLP만 학습',{size:14}),0);
 b+=blink(box(340,210,240,46,AC)+t(460,238,'2단계 지시: MLP + 언어 모델',{size:14}),1.2);
 b+=t(320,288,'얼음은 1단계에서만 · 손실은 두 단계 모두 다음 토큰 예측 하나',{size:13,fill:MU});
 return {svg:svg('CLIP 인코더의 576개 패치가 MLP를 거쳐 프롬프트의 image 자리에 들어가고, 정렬과 지시 튜닝 두 단계로 학습하는 LLaVA 구조 그림',b),caption:`576 = 24×24와 문맥 2,048에서 남는 ${f(ctx.left)}은 실제 계산입니다. 두 단계 상자가 차례로 밝아지는 것은 학습 순서를 보여 주는 애니메이션입니다.`};
};
F.anyres=()=>{
 const W=600,Hh=1800,sq=M.squarePad(W,Hh),ar=M.anyres(W,Hh),nv=M.nativeTokens(W,Hh,28,4096*784);let b='';
 b+=blink(box(20,40,180,180,'var(--line)','var(--chart)',6)+`<rect x="80" y="40" width="60" height="180" fill="${BL}" opacity=".45"/>`+t(110,240,'정사각형 + 채움',{size:14,w:700})+t(110,262,`576토큰 · 빈칸 ${Math.round(sq.pad*100)}%`,{size:13,fill:OR}),0);
 b+=blink(`<g>${[0,1,2].map(i=>box(250,40+i*60,60,56,AC,'var(--panel2)',3)+t(280,74+i*60,`타일${i+1}`,{size:13})).join('')}${box(326,40,56,56,OR,'var(--panel2)',3)}${t(354,74,'썸네일',{size:13})}</g>`+t(316,240,`AnyRes ${ar.grid.r}×${ar.grid.c} + 썸네일`,{size:14,w:700})+t(316,262,`${f(ar.tokens)}토큰`,{size:13,fill:AC}),1.2);
 let g='';for(let y=0;y<9;y++)for(let x=0;x<3;x++)g+=`<rect x="${454+x*20}" y="${40+y*20}" width="18" height="18" rx="2" fill="${BL}" opacity=".5"/>`;
 b+=blink(g+t(486,240,'원래 비율(28px 단위)',{size:14,w:700})+t(486,262,`${nv.gw}×${nv.gh} = ${f(nv.tokens)}토큰`,{size:13,fill:AC}),2.4);
 b+=t(320,24,'세로로 긴 영수증 600×1800을 세 가지로 넣기',{size:14,fill:MU})+t(320,290,'같은 문서라도 전략에 따라 토큰과 낭비가 달라집니다',{size:13,fill:MU});
 return {svg:svg(`600×1800 영수증을 정사각형 채움(576토큰, 빈칸 ${Math.round(sq.pad*100)}%), AnyRes(${ar.tokens}토큰), 원래 비율(${nv.tokens}토큰)로 넣는 세 방식 비교 그림`,b),caption:`세 칸의 토큰 수와 채움 비율은 이 책의 식으로 실제 계산했습니다(원래 비율은 상한을 넉넉히 둔 경우). 원래 비율 칸의 격자는 실제 ${nv.gw}×${nv.gh}를 줄여 그린 모식도이고, 칸이 차례로 밝아지는 것은 비교 순서를 보여 주는 애니메이션입니다.`};
};
F.video=()=>{
 const e=M.eventCatch(0.4,1),v=M.videoBudget(90,1,M.pooled(27,3),32768);let b='';
 b+=t(320,28,'드럼 영상 10초 구간 · 1 FPS 표본',{size:14,fill:MU});
 b+=`<path d="M30 120H610" stroke="var(--line)" stroke-width="2"/>`;
 for(let s=0;s<=10;s++){const x=30+s*58;b+=`<path d="M${x} 112V128" stroke="var(--muted)"/>`+t(x,148,`${s}s`,{size:13,fill:MU});}
 for(let s=0;s<10;s++){const x=30+s*58+8;b+=blink(box(x,60,40,40,BL,'var(--panel2)',4),s*.45);}
 const ev=30+6.55*58;b+=`<rect x="${ev}" y="56" width="${0.4*58}" height="80" fill="${OR}" opacity=".35"/>`+pulse(ev+11,96,14,OR)+t(ev+12,176,'쿵! 0.4초',{size:14,w:700,fill:OR});
 b+=dot(30,120,580,0,AC,0,6);
 b+=box(40,200,270,70,AC)+t(175,228,`포착 확률 min(1, 0.4×1) = ${Math.round(e.p*100)}%`,{size:14,w:700})+t(175,252,'시작 위치가 무작위일 때',{size:13,fill:MU});
 b+=box(330,200,270,70,BL)+t(465,228,`90초 × 1 FPS × 81 = ${f(v.tokens)}토큰`,{size:14,w:700})+t(465,252,`예산 32,768의 ${Math.round(v.share*100)}%`,{size:13,fill:MU});
 return {svg:svg(`1 FPS로 뽑은 프레임 사이로 0.4초짜리 사건이 지나가 포착 확률이 ${Math.round(e.p*100)}%뿐이고, 90초 영상이 ${v.tokens}토큰이 되는 그림`,b),caption:`청록 점이 시간축을 따라가고 파란 프레임이 1초마다 밝아집니다. 주황 구간이 그 사이에 끼면 영상 표본은 사건을 놓칩니다. 확률과 토큰 수는 실제 계산이며, 사건 위치는 예시입니다.`};
};
F.voice=()=>{
 const frames=Math.round(30/0.01);let b='';
 let w='M20 120';for(let i=0;i<=60;i++){const x=20+i*2.5,y=120+Math.sin(i*.9)*(i%15<4?34:10);w+=`L${x} ${y.toFixed(1)}`;}
 b+=`<path d="${w}" fill="none" stroke="${BL}" stroke-width="2"/>`+t(95,60,'소음 녹음 16kHz',{size:14,fill:MU});
 for(let y=0;y<5;y++)for(let x=0;x<6;x++)b+=blink(`<rect x="${190+x*18}" y="${76+y*18}" width="16" height="16" rx="2" fill="${AC}" opacity="${(0.25+((x*3+y*5)%7)/9).toFixed(2)}"/>`,x*.25);
 b+=t(244,190,'로그 멜 80칸',{size:13,fill:AC});
 b+=line('M300 120H340',AC);
 b+=box(346,70,120,100,AC)+t(406,112,'Thinker',{size:16,w:700})+t(406,136,'할 말 → 글 토큰',{size:13,fill:MU});
 b+=line('M466 120H494',OR)+dot(466,120,26,0,OR,0,5);
 b+=box(500,84,110,72,OR)+t(555,114,'Talker',{size:16,w:700})+t(555,138,'음성 토큰',{size:13,fill:MU});
 b+=pulse(555,206,16,OR)+t(555,248,'스피커',{size:13,fill:OR});
 b+=t(320,276,`30초 ÷ 10ms = ${f(frames)}프레임 × 80 멜 · Talker는 초당 50개 이상 내야 끊기지 않음`,{size:14,fill:'var(--text)'});
 return {svg:svg(`소음 파형이 로그 멜 배열이 되고 Thinker가 할 말을 정하면 Talker가 음성 토큰을 이어 내는 흐름 그림`,b),caption:`프레임 수 ${f(frames)}은 10ms 간격으로 실제 계산했습니다. 파형과 멜 칸의 밝기는 모양을 보여 주는 예시이며, 점이 Thinker에서 Talker로 건너가는 움직임은 스트리밍 순서를 보여 주는 비유입니다.`};
};
F.tokens=()=>{
 const r=M.imageTokens(512,16,8192,30),ids=[4821,1029,2891,77,5310,6002,412,3388,905,7710,2264,148,6521,330,4096,1888];let b='';
 b+=t(110,30,'사진 → 코드북 번호',{size:14,fill:MU});
 ids.forEach((v,i)=>{const x=20+(i%4)*46,y=44+Math.floor(i/4)*46;b+=blink(box(x,y,42,42,AC,'var(--panel2)',3)+t(x+21,y+26,v,{size:13}),i*.18);});
 b+=line('M212 130H252',AC);
 const seq=['글','글','IMG','4821','1029','…','/IMG','글'];
 seq.forEach((s,i)=>{const x=258+i*46,c=s==='글'?BL:(s.includes('IMG')?OR:AC);b+=box(x,110,42,40,c,'var(--panel2)',4)+t(x+21,135,s,{size:13});});
 b+=dot(258,170,360,0,AC,0,5)+t(440,192,'한 디코더 · 다음 토큰 손실 하나',{size:13,fill:MU});
 b+=box(40,226,560,56,BL)+t(320,250,`512 ÷ 16 = ${r.side} → ${f(r.tokens)}토큰 · 코드북 8,192 = 토큰당 13비트`,{size:14,w:700})+t(320,272,`초당 30토큰이면 한 장에 약 ${f(r.seconds)}초`,{size:13,fill:MU});
 return {svg:svg(`사진을 코드북 번호 격자로 바꾸고 글 토큰과 한 줄로 이어 다음 토큰으로 예측하는 초기 융합 그림`,b),caption:`번호 격자가 차례로 채워지는 것은 토크나이저 출력을 보여 주는 비유이고, 번호 값은 예시입니다. 토큰 수와 생성 시간은 실제 계산이며, 초당 30토큰은 원본 레슨이 쓴 예시 속도입니다. IMG와 /IMG 칸은 이미지 구간을 여닫는 구분자 토큰입니다.`};
};
F.unified=()=>{
 const N=36,T=4,s=M.maskSchedule(N,T),order=[];for(let k=0;k<N;k++)order.push((k*17)%N);let b='',k=0;
 const step=new Array(N);s.commit.forEach((c,i)=>{for(let j=0;j<c;j++)step[order[k++]]=i;});
 b+=t(130,28,'6×6 이미지 토큰',{size:14,fill:MU});
 for(let i=0;i<N;i++){const x=40+(i%6)*30,y=40+Math.floor(i/6)*30;b+=`<rect x="${x}" y="${y}" width="26" height="26" rx="3" fill="var(--panel2)" stroke="var(--line)"/>`+t(x+13,y+18,'?',{size:13,fill:MU})+blink(`<rect x="${x}" y="${y}" width="26" height="26" rx="3" fill="${['var(--blue)','var(--accent)','var(--orange)','var(--accent)'][step[i]]}"/>`,step[i]*1.1);}
 b+=t(130,240,'단계마다 확신 높은 칸부터 확정',{size:13,fill:MU});
 s.commit.forEach((c,i)=>{const y=52+i*44;b+=t(266,y+18,`단계 ${i+1}`,{size:14,a:'start'})+`<rect x="330" y="${y}" width="${36*6}" height="24" rx="3" fill="var(--panel2)"/>`+grow(330,y,c*6,24,['var(--blue)','var(--accent)','var(--orange)','var(--accent)'][i],i*.4)+t(560,y+18,`${c}칸 확정 · 남음 ${s.masked[i+1]}`,{size:13,a:'start'});});
 b+=t(320,268,`r(t) = cos(πt / 2T), T = ${T}: 가린 칸 ${s.masked.join(' → ')}`,{size:14,w:700,fill:AC});
 b+=t(320,292,`한 칸씩 뽑으면 ${N}번, 가림 예측은 ${T}번의 순전파`,{size:13,fill:MU});
 return {svg:svg(`MaskGIT 코사인 일정으로 36칸 이미지 토큰을 ${T}단계에 ${s.commit.join(', ')}칸씩 확정하는 그림`,b),caption:`단계별 확정 칸 수는 코사인 일정으로 실제 계산했습니다. 어느 칸이 먼저 확정되는지는 확신도 대신 정한 예시 순서이고, 칸이 차례로 칠해지는 움직임은 병렬 생성 순서를 보여 주는 애니메이션입니다.`};
};
F.action=()=>{
 const a=M.actionBin(0.337,256),r=M.actionRate(7,10,35);let b='';
 b+=`<path d="M60 230L110 150L190 120L250 150" fill="none" stroke="var(--text)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
 [[60,230],[110,150],[190,120]].forEach(([x,y])=>b+=`<circle cx="${x}" cy="${y}" r="9" fill="${AC}"/>`);
 b+=`<path d="M250 150l14 -10M250 150l14 10" stroke="${OR}" stroke-width="5"/>`+box(272,140,34,28,OR,'var(--panel2)',4)+t(289,186,'필터',{size:13,fill:OR});
 b+=pulse(110,150,14,AC)+t(150,270,'7자유도 팔(관절 값은 [−1, 1])',{size:13,fill:MU});
 b+=t(470,40,'관절 하나의 값 0.337을 칸 번호로',{size:14,fill:MU});
 b+=`<path d="M340 90H600" stroke="var(--line)" stroke-width="2"/>`;
 for(let i=0;i<=16;i++){const x=340+i*16.25;b+=`<path d="M${x} 82V98" stroke="var(--muted)"/>`;}
 b+=t(340,118,'−1',{size:13,fill:MU})+t(600,118,'+1',{size:13,fill:MU});
 const px=340+(0.337+1)/2*260;b+=dot(340,90,px-340,0,OR,0,7)+`<path d="M${px} 70V110" stroke="${OR}" stroke-width="2"/>`;
 b+=box(340,140,260,60,AC)+t(470,164,`256칸 → ${a.index}번 칸 → ${a.value.toFixed(4)}`,{size:14,w:700})+t(470,188,`오차 ${a.err.toFixed(4)} · 최대 ${a.maxErr.toFixed(4)}`,{size:13,fill:MU});
 b+=box(340,216,260,60,BL)+t(470,240,`7 × 10Hz = 초당 ${r.need}토큰 필요`,{size:14,w:700})+t(470,264,`디코딩 35토큰/초면 최대 ${r.maxHz}Hz`,{size:13,fill:MU});
 return {svg:svg(`로봇 팔 관절 값 0.337을 256칸 중 ${a.index}번 칸 토큰으로 바꾸고, 7자유도 10Hz 제어에 초당 ${r.need}토큰이 필요함을 보이는 그림`,b),caption:`눈금 위 점이 관절 값의 자리를 찾아가는 움직임은 양자화를 보여 주는 비유이고, 칸 번호·오차·필요한 토큰 속도는 실제 계산입니다. 위 눈금은 256칸을 16칸으로 줄여 그렸고, 디코딩 35토큰/초는 가정값입니다.`};
};
F.docs=()=>{
 const Q=[[0.9,0.1,0.1],[0.1,0.9,0.2],[0.2,0.2,0.9]],P=[[0.85,0.2,0.1],[0.2,0.1,0.3],[0.15,0.88,0.25],[0.3,0.3,0.4],[0.1,0.3,0.92],[0.4,0.4,0.3]],m=M.maxSim(Q,P),pool=M.pooledScore(Q,P);
 const qn=['배수','필터','그림'],cols=[AC,BL,OR];let b='';
 b+=t(80,30,'질의 토큰',{size:14,fill:MU})+t(470,30,'설명서 12쪽의 패치',{size:14,fill:MU});
 qn.forEach((n,i)=>{b+=box(30,60+i*70,100,44,cols[i])+t(80,88+i*70,n,{size:15,w:700});});
 P.forEach((_,j)=>{const x=360+(j%3)*84,y=60+Math.floor(j/3)*104;b+=box(x,y,74,86,'var(--line)','var(--panel2)',4)+t(x+37,y+48,`p${j+1}`,{size:14,fill:MU});});
 m.picks.forEach((p,i)=>{const x=360+(p%3)*84+37,y=60+Math.floor(p/3)*104+43;b+=line(`M130 ${82+i*70}L${x-37} ${y}`,cols[i])+pulse(x,y,24,cols[i]);});
 b+=t(320,272,`MaxSim = ${m.picks.map((p,i)=>M.cos(Q[i],P[p]).toFixed(2)).join(' + ')} = ${m.score.toFixed(2)}`,{size:15,w:700,fill:AC});
 b+=t(320,294,`평균 한 벡터로 줄이면 코사인 ${pool.toFixed(2)} 하나 (최댓값 합과 다른 척도)`,{size:13,fill:MU});
 return {svg:svg(`질의 토큰 배수·필터·그림이 각각 가장 닮은 패치를 골라 MaxSim ${m.score.toFixed(2)}을 만드는 그림`,b),caption:`각 질의 토큰에서 가장 닮은 패치로 점선이 이어집니다. 벡터는 미리 정한 3차원 예시이고 코사인과 합은 실제 계산입니다. 점선이 흐르는 움직임은 질의가 패치를 찾는 과정을 보여 주는 비유입니다.`};
};
F.agent=()=>{
 const steps=[['화면 캡처',320,46],['계획',530,130],['행동 JSON',440,240],['실행',200,240],['검증',110,130]];let b='';
 steps.forEach(([n,x,y],i)=>{b+=blink(box(x-62,y-24,124,48,i===4?OR:AC)+t(x,y+6,n,{size:15,w:700}),i*.8);const [,x2,y2]=steps[(i+1)%5];b+=line(`M${x} ${y}L${x2} ${y2}`,'var(--line)');});
 b+=dot(320,46,210,84,AC,0,6);
 b+=t(320,140,'{"action":"click",',{size:13,fill:MU})+t(320,160,'"x":384,"y":220}',{size:13,fill:MU});
 b+=t(320,290,`p = 0.95: 5단계 ${M.agentSuccess(0.95,5).plain.toFixed(2)} · 10단계 ${M.agentSuccess(0.95,10).plain.toFixed(2)} · 20단계 ${M.agentSuccess(0.95,20).plain.toFixed(2)}`,{size:14,w:700,fill:OR});
 return {svg:svg('화면 캡처, 계획, 행동 JSON, 실행, 검증을 도는 컴퓨터 사용 에이전트 루프와 단계 수에 따른 성공률 그림',b),caption:`점이 루프를 돌며 다섯 단계가 차례로 밝아집니다. 아래 성공률은 단계가 독립이라는 가정에서 0.95를 거듭제곱한 실제 계산이고, 행동 JSON은 예시입니다.`};
};
function render(c){return F[c.id](H);}
return {render,F,H};
})();
