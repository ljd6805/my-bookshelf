/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A09Math로 계산한다. */
window.A09Figures=(()=>{
'use strict';
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
/* 점 하나가 (x,y)에서 (x+dx,y+dy)로 반복 이동한다. */
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const H={svg,t,box,line,dot,blink,grow,pulse};
const F={};
const M=A09Math,C=['var(--muted)','var(--blue)','var(--accent)','var(--orange)'];
/* 곡선 하나를 (x0,y0) 원점, 가로 폭 w, 세로 높이 h 상자 안에 그린다. pts=[[x,y]] (x: lo~hi, y: 0~ymax) */
const curve=(pts,x0,y0,w,h,lo,hi,ymax,color='var(--accent)',cls='')=>`<polyline${cls?` class="${cls}"`:''} points="${pts.map(([x,y])=>`${(x0+(x-lo)/(hi-lo)*w).toFixed(1)},${(y0-Math.min(y,ymax)/ymax*h).toFixed(1)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
const pdfPts=(f,lo=-4,hi=4,n=60)=>Array.from({length:n+1},(_,i)=>{const x=lo+(hi-lo)*i/n;return [x,f(x)];});

F.map=()=>{
 const fam=[['정확한 밀도','자기회귀 · 정규화 플로'],['근사 밀도','VAE · 디퓨전 (ELBO)'],['암시적 밀도','GAN · 표본만'],['점수 · 플로','∇log p · 플로 매칭'],['토큰 자기회귀','VQ 토큰 + 트랜스포머']];
 let b=t(150,26,'다섯 갈래',{w:700});
 fam.forEach(([a,s],i)=>{const y=40+i*50;b+=blink(box(20,y,260,42,C[(i%3)+1])+t(36,y+19,a,{a:'start',w:700})+t(36,y+36,s,{a:'start',size:13,fill:'var(--muted)'}),i*.8);});
 const P=M.mixProb(1.5,2.5);
 b+=box(310,40,310,210,'var(--line)','var(--chart)',12)+t(465,64,'도토리 데이터의 두 봉우리',{size:14,fill:'var(--muted)'});
 b+=curve(pdfPts(x=>M.mixPdf(x)),330,220,270,140,-4,4,0.45)+`<path d="M330 220H600" stroke="var(--muted)"/>`;
 b+=t(364,240,'낮 −2',{size:13,fill:'var(--muted)'})+t(566,240,'밤 +2',{size:13,fill:'var(--muted)'});
 b+=`<rect x="${330+5.5/8*270}" y="80" width="${270/8}" height="140" fill="var(--accent)" fill-opacity=".15"/>`+pulse(330+6/8*270,104,10,'var(--accent)')+t(465,240,`명시적 P(1.5~2.5)=${P.toFixed(2)}`,{size:12,fill:'var(--accent)',a:'middle'});
 b+=box(420,262,90,30,'var(--orange)')+t(465,282,'G(z)',{size:14,w:700})+t(530,282,'암시적: 표본만',{size:13,a:'start',fill:'var(--orange)'});
 [[-2.2,0],[1.9,0.6],[2.3,1.2],[-1.8,1.8]].forEach(([x,d])=>{b+=dot(465,262,(330+(x+4)/8*270)-465,-40,'var(--orange)',d,5);});
 return {svg:svg(`생성 모델 다섯 갈래와, 두 봉우리 분포에서 구간 확률 ${P.toFixed(2)}를 계산하는 명시적 밀도와 표본만 내놓는 암시적 생성기를 비교한 그림`,b),caption:`왼쪽 다섯 상자가 차례로 켜지며 갈래를 보여 주고, 오른쪽 곡선은 도토리 장난감 데이터의 참 밀도를 실제로 계산한 것입니다. 아래 G(z)에서 튀어나가는 점은 확률을 말하지 않고 표본만 내놓는 생성기를 나타낸 비유입니다.`};
};
F.vae=()=>{
 let b='';const xs=[0.8,0.5,0.9,0.3,0.6,0.4,0.7,0.2];
 xs.forEach((v,i)=>{b+=grow(24,40+i*24,v*70,16,'var(--blue)',i*.1);});b+=t(60,250,'x (특징 8개)',{size:13,fill:'var(--muted)'});
 b+=`<path d="M110 40L190 110V170L110 230Z" fill="var(--panel2)" stroke="var(--blue)" stroke-width="2"/>`+t(150,145,'인코더',{size:14,w:700});
 b+=box(210,92,96,40,'var(--accent)')+t(258,117,'μ',{w:700})+box(210,150,96,40,'var(--accent)')+t(258,175,'log σ²',{w:700});
 b+=line('M306 112H340M306 170H340','var(--muted)')+box(340,110,120,62,'var(--orange)','var(--chart)',10)+t(400,136,'z = μ + σ·ε',{size:14,w:700})+t(400,158,'ε ~ N(0, I)',{size:13,fill:'var(--muted)'})+pulse(400,141,26,'var(--orange)');
 b+=`<path d="M480 110L560 40V230L480 170Z" fill="var(--panel2)" stroke="var(--blue)" stroke-width="2"/>`+t(520,145,'디코더',{size:14,w:700});
 xs.forEach((v,i)=>{b+=blink(`<rect x="572" y="${40+i*24}" width="${v*55}" height="16" rx="3" fill="var(--blue)" fill-opacity=".55"/>`,1.2+i*.08);});b+=t(600,250,'x̂',{size:14,fill:'var(--muted)'});
 b+=line('M460 141H480')+dot(306,141,174,0,'var(--orange)',0,5);
 const r=M.betaVae(1);
 b+=box(200,226,280,60,'var(--line)','var(--chart)',10)+t(340,250,'손실 = 재구성 + β·KL',{size:14,w:700})+t(340,274,`β = 1이면 잠재 8개 중 ${r.active}개만 살아 있음`,{size:13,fill:'var(--accent)'});
 return {svg:svg(`특징 8개가 인코더를 지나 μ와 log σ²가 되고, z = μ + σ·ε로 뽑힌 뒤 디코더로 되살아나는 VAE 그림. β=1이면 ${r.active}개 차원만 살아 있습니다.`,b),caption:`인코더는 점 대신 분포(μ, σ)를 내고, 재매개화로 뽑은 z를 디코더가 되살립니다. 아래 상자의 살아 있는 차원 수는 둘째 실험과 같은 닫힌 해로 실제 계산했고, 흐르는 점과 막대 움직임은 과정을 보여 주는 비유입니다.`};
};
F.gan=()=>{
 let b=box(20,60,110,56,'var(--orange)')+t(75,86,'생성자 G',{w:700})+t(75,106,'z → 가짜',{size:13,fill:'var(--muted)'});
 b+=box(20,170,110,56,'var(--blue)')+t(75,196,'진짜 그림',{w:700})+t(75,216,'도토리 2,000장',{size:13,fill:'var(--muted)'});
 b+=box(200,110,120,70,'var(--accent)')+t(260,140,'판별자 D',{w:700})+t(260,162,'진짜일 확률',{size:13,fill:'var(--muted)'});
 b+=line('M130 88L200 130','var(--orange)')+line('M130 198L200 160','var(--blue)')+dot(130,88,70,42,'var(--orange)',0,5)+dot(130,198,70,-38,'var(--blue)',.6,5);
 b+=line('M260 110V40H75V60','var(--accent)')+t(170,34,'“이쪽이 진짜 같다” 신호',{size:13,fill:'var(--accent)'})+dot(260,110,0,-70,'var(--accent)',1.2,4);
 const X=v=>370+v*240,Y=v=>250-v*170;
 b+=box(350,40,280,240,'var(--line)','var(--chart)',10)+t(490,62,'가짜에 매긴 점수 D(G(z))와 기울기',{size:13,fill:'var(--muted)'});
 const pts=k=>Array.from({length:21},(_,i)=>{const d=i/20,g=M.ganGrad(d);return `${X(d).toFixed(1)},${Y(g[k]).toFixed(1)}`;}).join(' ');
 b+=`<path d="M370 250H610M370 250V80" stroke="var(--muted)"/>`+`<polyline points="${pts('saturating')}" fill="none" stroke="var(--orange)" stroke-width="2.5"/><polyline class="fig-draw" points="${pts('nonSaturating')}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>`;
 b+=t(372,270,'0',{size:13,fill:'var(--muted)',a:'start'})+t(608,270,'1',{size:13,fill:'var(--muted)',a:'end'})+t(380,100,'비포화 −log D',{size:13,a:'start',fill:'var(--accent)'})+t(600,110,'포화 log(1−D)',{size:13,a:'end',fill:'var(--orange)'})+pulse(X(0.05),Y(0.05),8,'var(--orange)');
 return {svg:svg('생성자의 가짜와 진짜 그림이 판별자로 들어가고 판별자의 신호가 생성자로 돌아가는 그림, 그리고 판별자가 가짜를 확신할 때 포화 손실의 기울기가 0으로 사라지는 곡선',b),caption:`왼쪽은 두 네트워크가 신호를 주고받는 순환을 보여 주는 비유이고, 오른쪽 두 곡선은 판별자가 가짜에 준 점수에 따라 생성자가 받는 기울기 크기를 로짓 기준으로 실제 계산한 것입니다. 점수가 0 근처일 때 포화 손실은 기울기를 잃습니다.`};
};
F.cond=()=>{
 let b=box(20,50,90,90,'var(--muted)','var(--chart)',8)+`<path d="M45 115Q65 60 85 115M55 95H75" fill="none" stroke="var(--text)" stroke-width="2"/>`+t(65,160,'밑그림 x',{size:13,fill:'var(--muted)'});
 b+=`<path d="M130 50L190 80V110L130 140Z" fill="var(--panel2)" stroke="var(--blue)" stroke-width="2"/><path d="M200 80L260 50V140L200 110Z" fill="var(--panel2)" stroke="var(--blue)" stroke-width="2"/>`+t(195,170,'U-Net G',{size:14,w:700});
 b+=`<path class="fig-dash" d="M150 58C170 20 220 20 240 58" fill="none" stroke="var(--accent)" stroke-width="2"/>`+t(195,30,'건너뛰기 연결',{size:13,fill:'var(--accent)'});
 b+=box(280,50,90,90,'var(--orange)','var(--chart)',8)+`<path d="M305 115Q325 60 345 115" fill="none" stroke="var(--orange)" stroke-width="5"/>`+t(325,160,'채색 G(x)',{size:13,fill:'var(--muted)'});
 for(let i=0;i<9;i++){const cx=400+(i%3)*28,cy=58+Math.floor(i/3)*28;b+=blink(`<rect x="${cx}" y="${cy}" width="24" height="24" rx="3" fill="var(--accent)" fill-opacity=".35" stroke="var(--accent)"/>`,i*.3);}
 b+=t(442,160,'PatchGAN: 조각마다 판정',{size:13,fill:'var(--muted)'});
 b+=line('M110 95H130')+line('M260 95H280')+line('M370 95H398');
 b+=t(20,200,'StyleGAN',{a:'start',w:700})+box(20,214,60,40,'var(--muted)')+t(50,239,'z',{w:700})+line('M80 234H110')+box(110,214,100,40,'var(--blue)')+t(160,239,'매핑망 8층',{size:13})+line('M210 234H240')+box(240,214,50,40,'var(--accent)')+t(265,239,'w',{w:700});
 ['4²','8²','16²','32²'].forEach((s,i)=>{const x=330+i*70;b+=blink(box(x,214,60,40,'var(--orange)')+t(x+30,239,s,{size:14}),i*.6)+line(`M290 234 L${x} 234`,'var(--line)','');});
 b+=t(470,280,'층마다 AdaIN(w)으로 스타일을 다시 칠함',{size:13,fill:'var(--muted)'});
 return {svg:svg('밑그림이 U-Net 생성자를 지나 채색되고 PatchGAN이 조각마다 판정하는 Pix2Pix와, z가 매핑망을 지나 w가 되어 해상도마다 들어가는 StyleGAN을 함께 그린 그림',b),caption:`위는 Pix2Pix의 흐름(밑그림 → U-Net → 채색 → 조각별 판정), 아래는 StyleGAN이 w를 해상도마다 넣는 구조입니다. 실제 계산이 아닌 구조 도식이며, 켜졌다 꺼지는 칸은 판정과 주입의 순서를 보여 주는 비유입니다.`};
};
F.ddpm=()=>{
 const ts=[1,150,300,500,1000];let b=t(320,24,'순방향: 노이즈를 더한다 →',{size:14,fill:'var(--orange)'})+t(320,288,'← 역방향: 예측한 노이즈를 뺀다',{size:14,fill:'var(--accent)'});
 ts.forEach((tt,i)=>{const x=14+i*126,r=M.forward(tt);b+=box(x,44,110,170,'var(--line)','var(--chart)',8);
  b+=blink(curve(r.grid,x+6,180,98,120,-4,4,0.45,i===0?'var(--accent)':'var(--blue)'),i*.6);
  b+=t(x+55,202,`t=${tt}`,{size:14,w:700})+t(x+55,240,`SNR ${r.snr>100?'∞':r.snr.toFixed(2)}`,{size:13,fill:'var(--muted)'});
  if(i<4)b+=dot(x+110,30,126,0,'var(--orange)',i*.5,4)+dot(x+236,262,-126,0,'var(--accent)',i*.5,4);});
 b+=`<path d="M14 30H620M14 262H620" stroke="var(--line)"/>`;
 return {svg:svg('도토리 두 봉우리 분포가 t=1, 150, 300, 500, 1000으로 갈수록 하나의 가우스로 뭉개지는 순방향과, 그 반대로 걷는 역방향을 보여 주는 그림',b),caption:`다섯 곡선은 선형 스케줄에서 x_t의 분포를 실제로 계산한 것입니다. t=300 근처까지는 두 장면이 구분되지만 t=500이면 하나로 합쳐집니다. 위아래로 흐르는 점은 순방향과 역방향의 방향을 나타낸 비유입니다.`};
};
F.latent=()=>{
 const r=M.latentSize(512,8,4);let b='';
 b+=box(20,60,150,150,'var(--blue)','var(--chart)',6);for(let i=1;i<10;i++)b+=`<path d="M${20+i*15} 60V210M20 ${60+i*15}H170" stroke="var(--line)" stroke-width=".6"/>`;
 b+=t(95,232,'512×512×3',{size:14,w:700})+t(95,252,`${r.px.toLocaleString('ko-KR')}개`,{size:13,fill:'var(--muted)'});
 b+=line('M170 135H210','var(--blue)')+t(190,124,'E',{size:14,w:700});
 b+=box(210,105,60,60,'var(--accent)','var(--chart)',6)+t(240,186,'64×64×4',{size:14,w:700})+t(240,206,`${r.lat.toLocaleString('ko-KR')}개`,{size:13,fill:'var(--muted)'});
 b+=box(300,95,150,80,'var(--orange)')+t(375,128,'디노이저',{w:700})+t(375,150,'U-Net · DiT',{size:13,fill:'var(--muted)'})+`<path class="fig-dash" d="M330 175C330 215 420 215 420 175" fill="none" stroke="var(--orange)" stroke-width="2"/>`+t(375,226,'20~50단계 반복',{size:13,fill:'var(--orange)'});
 b+=line('M270 135H300')+dot(270,135,30,0,'var(--accent)',0,5);
 ['밤의','도토리','숲속'].forEach((s,i)=>{b+=blink(box(300+i*52,24,48,30,'var(--blue)')+t(324+i*52,44,s,{size:13}),i*.5);});
 b+=line('M375 54V95','var(--blue)')+t(470,74,'교차 어텐션',{size:13,fill:'var(--blue)'});
 b+=line('M450 135H490')+t(470,124,'D',{size:14,w:700})+box(490,60,130,150,'var(--accent)','var(--chart)',6)+pulse(555,135,30,'var(--accent)')+t(555,232,'그림',{size:14,w:700});
 b+=t(320,282,`디노이저가 다루는 값이 약 ${Math.round(r.ratio)}분의 1로 줄어듭니다`,{size:14,fill:'var(--accent)'});
 return {svg:svg(`512×512×3 그림이 VAE 인코더로 64×64×4 잠재가 되어 약 ${Math.round(r.ratio)}배 작은 공간에서 디노이징되고, 글 토큰이 교차 어텐션으로 들어온 뒤 디코더로 그림이 되는 잠재 디퓨전 그림`,b),caption:`값의 개수와 ${Math.round(r.ratio)}배라는 비율은 실제로 계산했습니다. 반복 화살표와 깜박이는 글 토큰은 디노이징 반복과 교차 어텐션 주입을 보여 주는 도식입니다.`};
};
F.control=()=>{
 let b=box(20,30,170,70,'var(--muted)')+t(105,60,'얼린 기반 인코더',{size:14,w:700})+t(105,84,'가중치 그대로',{size:13,fill:'var(--muted)'});
 b+=box(20,130,170,70,'var(--blue)')+t(105,160,'ControlNet 복제본',{size:14,w:700})+t(105,184,'자세 뼈대를 읽음',{size:13,fill:'var(--muted)'});
 b+=box(220,138,80,54,'var(--orange)','var(--chart)')+t(260,162,'영 합성곱',{size:13,w:700})+t(260,182,'0에서 출발',{size:13,fill:'var(--muted)'});
 b+=grow(222,196,76,6,'var(--orange)',.4)+line('M190 165H220')+line('M300 165H330V65H190','var(--orange)')+t(330,120,'+',{size:22,w:700,fill:'var(--orange)'});
 const o=M.lora(640,16);
 b+=box(360,30,260,170,'var(--line)','var(--chart)',10)+t(490,54,'LoRA: W + B·A',{size:14,w:700});
 b+=`<rect x="380" y="70" width="90" height="90" fill="var(--panel2)" stroke="var(--muted)"/>`+t(425,120,'W 얼림',{size:13});
 b+=t(484,120,'+',{size:18,w:700});
 b+=blink(`<rect x="500" y="70" width="14" height="90" fill="var(--accent)"/>`+t(507,180,'B',{size:13,w:700}),0)+blink(`<rect x="522" y="70" width="90" height="14" fill="var(--accent)"/>`+t(567,100,'A',{size:13,w:700}),.6);
 b+=t(490,194,`d=640, r=16 → ${o.ratio.toFixed(0)}배 적게 학습`,{size:13,fill:'var(--accent)'});
 b+=box(20,220,600,70,'var(--line)','var(--chart)',10)+t(40,248,'인페인팅 입력 9채널',{a:'start',w:700,size:14});
 [['노이즈 잠재 4','var(--blue)'],['원본 잠재 4','var(--muted)'],['마스크 1','var(--orange)']].forEach(([s,c],i)=>{b+=blink(box(220+i*130,234,120,40,c)+t(280+i*130,259,s,{size:13}),i*.5);});
 return {svg:svg(`얼린 기반 인코더에 ControlNet 복제본이 영 합성곱을 거쳐 더해지고, LoRA가 W에 작은 B·A를 더하며(약 ${o.ratio.toFixed(0)}배 감소), 인페인팅 모델이 9채널 입력을 받는 그림`,b),caption:`ControlNet과 인페인팅 입력은 구조 도식이고, 0에서 자라는 막대는 영 합성곱이 학습하며 커지는 모습을 나타낸 비유입니다. LoRA의 ${o.ratio.toFixed(0)}배는 첫 실험과 같은 식으로 실제 계산했습니다.`};
};
F.media=()=>{
 const v=M.video(10,1080,2),a=M.codec(8),mb=M.splatMB(1e6);let b='';
 b+=t(20,32,'비디오',{a:'start',w:700});for(let i=0;i<5;i++)b+=blink(box(20+i*26,46+i*6,90,56,'var(--blue)','var(--chart)',4),i*.3);
 b+=line('M170 80H210')+t(330,62,`3D VAE → 시공간 조각`,{size:14})+t(330,84,`10초 1080p: ${v.tokens.toLocaleString('ko-KR')}개`,{size:13,fill:'var(--accent)'})+t(330,104,`나눈 어텐션으로 ${v.saving.toFixed(0)}배 절약`,{size:13,fill:'var(--muted)'});
 b+=t(20,140,'오디오',{a:'start',w:700});let wave='M20 180';for(let i=0;i<=60;i++)wave+=`L${20+i*2.5} ${180+18*Math.sin(i*0.7)*Math.sin(i*0.13)}`;b+=`<path class="fig-draw" d="${wave}" fill="none" stroke="var(--orange)" stroke-width="2"/>`;
 b+=line('M175 180H210');for(let c=0;c<6;c++)for(let k=0;k<4;k++)b+=blink(`<rect x="${220+c*16}" y="${158+k*12}" width="12" height="9" fill="var(--orange)" fill-opacity="${1-k*0.2}"/>`,c*.25);
 b+=t(450,170,`코덱 75Hz × 코드북 8 = 초당 ${a.tps}토큰`,{size:13})+t(450,190,`비트율 ${(a.bps/1000).toFixed(0)} kbps (코드북 1024)`,{size:13,fill:'var(--muted)'});
 b+=t(20,238,'3D',{a:'start',w:700});[[60,260,14],[90,250,10],[80,275,8],[110,268,12],[130,256,7]].forEach(([x,y,r],i)=>{b+=blink(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*0.7}" fill="var(--accent)" fill-opacity=".5"/>`,i*.3);});
 b+=line('M160 262H210')+t(430,252,'가우시안 하나에 59개 값',{size:13})+t(430,272,`100만 개 × 4바이트 ≈ ${mb.toFixed(0)} MB`,{size:13,fill:'var(--muted)'});
 return {svg:svg(`비디오는 시공간 조각 ${v.tokens}개로, 오디오는 초당 ${a.tps}개 코덱 토큰으로, 3D는 가우시안 구름(100만 개 약 ${mb.toFixed(0)}MB)으로 바꾸는 세 매체의 공통 구조 그림`,b),caption:`세 줄의 숫자(조각 수, 초당 토큰과 비트율, 가우시안 저장량)는 이 장의 가정으로 실제 계산했습니다. 겹친 프레임, 파형, 타원은 각 매체의 모양을 나타낸 그림입니다.`};
};
F.flow=()=>{
 const X=t=>60+(1-t)*520,Y=x=>150-x*42;let b=t(60,28,'노이즈 x₁ (t=1)',{size:14,a:'start',fill:'var(--muted)'})+t(580,28,'데이터 x₀ (t=0)',{size:14,a:'end',fill:'var(--muted)'});
 b+=`<path d="M60 40V260M580 40V260" stroke="var(--line)"/>`+t(600,Y(2)+5,'밤',{size:13,a:'start'})+t(600,Y(-2)+5,'낮',{size:13,a:'start'});
 [-1.4,-0.6,-0.15,0.15,0.6,1.4].forEach((x1,i)=>{const p=M.flowPath(x1,40);b+=`<polyline class="fig-draw" points="${p.map(([tt,x])=>`${X(tt).toFixed(1)},${Y(x).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--blue)" stroke-width="2"/>`;
  const end=p[p.length-1][1];b+=`<path d="M${X(1)} ${Y(x1)}L${X(0)} ${Y(end)}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 5"/>`+dot(X(1),Y(x1),X(0)-X(1),Y(end)-Y(x1),'var(--accent)',i*.3,5);});
 b+=t(320,286,'파랑: 평균 속도장이 만든 휜 길 · 점선: 재흐름 뒤의 곧은 길',{size:13,fill:'var(--muted)'});
 return {svg:svg('노이즈 여섯 점에서 출발한 경로가 평균 속도장 때문에 휘어 낮과 밤 장면에 도착하고, 재흐름 뒤에는 같은 짝이 곧은 직선으로 이어지는 그림',b),caption:`파란 곡선은 도토리 분포의 정확한 플로 매칭 속도장을 40단계로 적분한 실제 경로이고, 점선은 같은 출발점과 도착점을 이은 직선(재흐름이 목표로 하는 길)입니다. 점선을 따라 움직이는 점은 한 걸음 샘플링을 보여 주는 비유입니다.`};
};
F.var=()=>{
 const sizes=[1,2,4,8];let b='';let x=30;
 sizes.forEach((n,i)=>{const s=100,c=s/n;let g='';for(let r=0;r<n;r++)for(let q=0;q<n;q++)g+=`<rect x="${x+q*c+1}" y="${70+r*c+1}" width="${c-2}" height="${c-2}" rx="2" fill="var(--accent)" fill-opacity="${0.25+0.6*((r+q)%3)/2}"/>`;
  b+=blink(g,i*.9)+t(x+50,195,`${n}×${n}`,{w:700})+t(x+50,216,`패스 ${i+1}`,{size:13,fill:'var(--muted)'});if(i<3)b+=line(`M${x+104} 120H${x+142}`)+dot(x+104,120,38,0,'var(--orange)',i*.9,5);x+=146;});
 const r=M.varScales(4);
 b+=t(320,40,'앞 척도 전부를 보고 다음 척도를 한 번에 예측',{size:14,fill:'var(--muted)'});
 b+=t(320,260,`척도 4개: 토큰 ${r.tokens2d}개를 패스 ${r.passes}번에 · 8×8 래스터 자기회귀는 패스 64번`,{size:14,fill:'var(--accent)'});
 return {svg:svg(`1×1, 2×2, 4×4, 8×8 격자가 차례로 켜지며 척도마다 한 번의 패스로 토큰 ${r.tokens2d}개를 만드는 VAR 그림`,b),caption:`척도마다 격자 전체가 한꺼번에 켜지는 것이 VAR의 “척도 안 병렬”입니다. 토큰과 패스 수는 실제로 세었고, 칸의 밝기는 장식입니다.`};
};
F.eval=()=>{
 const e=M.fidLab(1,0.6,50);let b=box(20,30,300,240,'var(--line)','var(--chart)',10)+t(170,54,'FID: 두 특징 분포의 거리',{size:14,w:700});
 const X=v=>170+v*42,Y=v=>160-v*42;
 b+=`<ellipse cx="${X(0)}" cy="${Y(0)}" rx="84" ry="84" fill="var(--blue)" fill-opacity=".15" stroke="var(--blue)" stroke-width="2"/>`;
 b+=`<ellipse class="fig-pulse" cx="${X(1)}" cy="${Y(0)}" rx="50" ry="50" fill="var(--orange)" fill-opacity=".15" stroke="var(--orange)" stroke-width="2"/>`;
 b+=`<path d="M${X(0)} ${Y(0)}H${X(1)}" stroke="var(--text)" stroke-width="2"/>`+t(X(0)-30,Y(0)-92,'진짜',{size:13,fill:'var(--blue)'})+t(X(1)+40,Y(0)-60,'생성',{size:13,fill:'var(--orange)'});
 b+=t(170,256,`이동 1, σ 0.6 → FID ${e.exact.toFixed(2)}`,{size:13,fill:'var(--accent)'});
 b+=box(340,30,280,110,'var(--line)','var(--chart)',10)+t(480,54,'CLIP 점수: 방향의 닮음',{size:14,w:700});
 b+=`<path d="M380 120L470 70" stroke="var(--blue)" stroke-width="3"/><path class="fig-draw" d="M380 120L490 96" stroke="var(--orange)" stroke-width="3"/>`+t(500,76,'글',{size:13,a:'start',fill:'var(--blue)'})+t(500,104,'그림',{size:13,a:'start',fill:'var(--orange)'});
 const cs=M.cosine([90,50],[110,24]);b+=t(570,128,`cos = ${cs.toFixed(2)}`,{size:13,a:'end',fill:'var(--accent)'});
 b+=box(340,160,280,110,'var(--line)','var(--chart)',10)+t(480,184,'사람 비교: A와 B 중 어느 쪽?',{size:14,w:700});
 b+=blink(box(370,200,90,50,'var(--accent)')+t(415,231,'A 승',{w:700}),0)+blink(box(500,200,90,50,'var(--blue)')+t(545,231,'B 승',{w:700}),1.2);
 return {svg:svg(`진짜와 생성 특징 분포 사이의 FID(이동 1, 표준편차 0.6이면 ${e.exact.toFixed(2)}), 글과 그림 임베딩의 코사인인 CLIP 점수, 두 그림을 나란히 고르는 사람 비교를 함께 그린 그림`,b),caption:`FID ${e.exact.toFixed(2)}와 코사인 값은 실제로 계산했습니다(2차원 교육용 특징). 맥박처럼 커지는 원과 번갈아 켜지는 승패 상자는 평가 과정을 보여 주는 비유입니다.`};
};
F.final=()=>{
 const rep=[['흐릿한 회색','5장 · 단계 수'],['같은 그림·번들거림','6장 · 가이던스 w'],['15초 지연','9장 · 증류 플로'],['FID 500장','11장 · 표본 수']];let b='';
 rep.forEach(([a,s],i)=>{const y=30+i*64;b+=box(20,y,190,50,'var(--orange)')+t(115,y+31,a,{size:14,w:700});
  b+=line(`M210 ${y+25}H260`)+dot(210,y+25,50,0,'var(--orange)',i*1.2,5);
  b+=blink(box(260,y,170,50,'var(--accent)')+t(345,y+31,s,{size:14}),i*1.2);
  b+=line(`M430 ${y+25}H470`)+blink(box(470,y,150,50,'var(--blue)')+t(545,y+31,'같은 시드로 다시 잼',{size:13}),i*1.2+.6);});
 b+=t(320,290,'보고 → 원인 가설과 손잡이 하나 → 다시 잴 증거',{size:14,fill:'var(--muted)'});
 return {svg:svg('보고 네 건이 각각 단계 수, 가이던스, 증류 플로, 표본 수라는 손잡이로 이어지고 같은 시드로 다시 재는 단계로 넘어가는 그림',b),caption:'네 보고를 이 책의 장과 손잡이에 잇는 판단 순서를 보여 주는 도식입니다. 연결은 미리 정한 시나리오이며, 실제 원인은 다시 잰 증거로 확인해야 합니다.'};
};
/* 기본 그림: flow 단계를 상자로 놓고 점이 차례로 지나간다. 장마다 F[장ID]로 고유 그림을 만든다. */
function fallback(c){
 const steps=c.flow.map(x=>x.split('|')),n=steps.length,w=(600-(n-1)*20)/n,colors=['var(--accent)','var(--blue)','var(--orange)','var(--accent)'];
 let b='';steps.forEach(([a,s],i)=>{const x=20+i*(w+20);b+=blink(box(x,90,w,110,colors[i%4]),i*.6)+t(x+w/2,140,a,{w:700})+t(x+w/2,168,s.length>14?s.slice(0,14)+'…':s,{size:12,fill:'var(--muted)'});if(i<n-1)b+=line(`M${x+w} 145H${x+w+20}`)+dot(x+w-4,145,24,0,colors[i%4],i*.6,5);});
 return {svg:svg(`${c.title}의 흐름: ${steps.map(s=>s[0]).join(', ')}`,b),caption:`${c.subtitle}`};
}
function render(c){return F[c.id]?F[c.id](H):fallback(c);}
return {render,F,H};
})();
