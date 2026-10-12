/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림. 숫자가 있는 그림은 A05Math로 계산한다.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다. */
window.A05Figures=(()=>{
'use strict';
const M=A05Math,f=(n,d=2)=>n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
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

F.pixels=()=>{
 const img=Array.from({length:6},()=>[20,20,20,200,200,200]),k=[[-1,0,1],[-2,0,2],[-1,0,1]],out=M.conv2d(img,k),n=M.convOut(6,3,0,1),c=30;let b='';
 img.forEach((row,y)=>row.forEach((v,x)=>{b+=`<rect x="${20+x*c}" y="${60+y*c}" width="${c-2}" height="${c-2}" rx="2" fill="${v>100?'var(--blue)':'var(--panel2)'}" opacity="${v>100?.55:1}"/>`+t(20+x*c+14,60+y*c+20,v,{size:13});}));
 b+=`<rect class="fig-pkt fig-slow" style="--dx:${3*c}px;--dy:0px" x="18" y="58" width="${3*c+2}" height="${3*c+2}" rx="3" fill="none" stroke="var(--orange)" stroke-width="3"/>`;
 b+=t(110,44,'입력 6×6 (밝기)',{size:14,fill:'var(--muted)'});
 k.forEach((row,y)=>row.forEach((v,x)=>{b+=box(232+x*34,100+y*34,30,30,'var(--orange)','var(--chart)',3)+t(247+x*34,120+y*34,v,{size:14});}));
 b+=t(282,84,'Sobel 커널 3×3',{size:14,fill:'var(--orange)'})+t(268,232,'곱해서 더하기',{size:13,fill:'var(--muted)'});
 out.forEach((row,y)=>row.forEach((v,x)=>{b+=blink(`<rect x="${410+x*48}" y="${80+y*36}" width="44" height="32" rx="3" fill="${v?'var(--accent)':'var(--panel2)'}" opacity="${v?.8:1}"/>`+t(432+x*48,101+y*36,v,{size:13,fill:v?'var(--bg)':'var(--text)'}),(y*4+x)*.25);}));
 b+=t(506,64,`출력 ${n}×${n}`,{size:14,fill:'var(--accent)'})+line('M370 145H402','var(--accent)');
 b+=t(320,282,`⌊(6 − 3 + 2×0)/1⌋ + 1 = ${n} · 밝기가 바뀌는 세로 경계에서만 ${out[0][1]}`,{size:14,fill:'var(--muted)'});
 return {svg:svg(`6×6 입력 위를 3×3 Sobel 커널이 밀며 경계에서만 ${out[0][1]}을 내는 ${n}×${n} 출력을 만드는 그림`,b),caption:`주황 창이 입력 위를 한 칸씩 밀며 곱하고 더해, 밝기가 20에서 200으로 바뀌는 세로 경계에서만 큰 값(${out[0][1]})을 냅니다. 출력 값은 실제로 계산한 합성곱이고, 창이 움직이는 모습은 순서를 보여 주는 애니메이션입니다.`};
};
F.backbone=()=>{
 const rows=[['LeNet','1998','합성곱 틀'],['AlexNet','2012','ReLU·드롭아웃'],['VGG','2014','3×3 깊게'],['ResNet','2015','F(x) + x'],['ViT','2020','패치 = 토큰']];let b='';
 rows.forEach(([n,y,i],k)=>{const x=20+k*122,c=k===3?'var(--accent)':k===4?'var(--blue)':'var(--line)';b+=blink(box(x,24,110,92,c)+t(x+55,54,n,{w:700,size:16})+t(x+55,76,y,{size:13,fill:'var(--muted)'})+t(x+55,100,i,{size:13,fill:k===3?'var(--accent)':'var(--text)'}),k*.5);if(k<4)b+=line(`M${x+110} 70H${x+122}`);});
 b+=t(40,170,'x',{size:18,w:700})+line('M56 165H120','var(--muted)','')+box(120,140,130,50,'var(--orange)')+t(185,170,'F(x): 3×3 두 번',{size:13});
 b+=line('M250 165H330','var(--muted)','')+`<circle cx="345" cy="165" r="15" fill="var(--panel2)" stroke="var(--accent)" stroke-width="2"/>`+t(345,171,'+',{size:20,w:700});
 b+=line('M60 152C80 105 320 105 340 150','var(--accent)')+t(200,120,'지름길: 기울기 1을 그대로 전달',{size:13,fill:'var(--accent)'})+dot(330,165,-260,0,'var(--orange)',0,6);
 b+=line('M360 165H420','var(--muted)','')+t(450,171,'y',{size:18,w:700})+t(200,230,'← 역전파 기울기',{size:13,fill:'var(--orange)'});
 const r=M.residual(30,0.8);
 b+=box(480,140,144,110,'var(--line)','var(--chart)',10)+t(552,166,'30블록, a = 0.8',{size:13,fill:'var(--muted)'})+t(552,196,`평범: ${r.plain.toExponential(1)}`,{size:14,fill:'var(--orange)'})+t(552,226,'지름길: 1',{size:14,fill:'var(--accent)'});
 b+=t(320,286,'모델마다 새 아이디어 하나: 틀 → 비선형 → 깊이 → 잔차 → 패치 토큰',{size:13,fill:'var(--muted)'});
 return {svg:svg('LeNet, AlexNet, VGG, ResNet, ViT의 핵심 아이디어와 잔차 블록에서 기울기가 지름길로 돌아오는 그림',b),caption:`위 줄은 계보를 차례로 밝히고, 아래는 잔차 블록에서 기울기가 덧셈 지름길을 따라 줄지 않고 돌아오는 모습입니다. 30블록 숫자는 층마다 0.8배를 곱하는 장난감 모형의 실제 계산이고, 움직이는 점은 역전파 방향을 보여 주는 비유입니다.`};
};
F.classify=()=>{
 const z=[2,0.5,-1],p=M.softmax(z,1),names=['자전거','사람','빈 칸'];let b='';
 for(let i=0;i<4;i++)b+=box(20+i*58,90,50,120,'var(--line)','var(--panel2)',6)+t(45+i*58,156,'얼림',{size:13,fill:'var(--muted)'});
 b+=t(130,76,'사전학습 백본 (ImageNet)',{size:14,fill:'var(--muted)'})+box(262,110,70,80,'var(--accent)')+t(297,146,'머리',{w:700})+t(297,168,'학습',{size:13,fill:'var(--accent)'});
 b+=line('M252 150H262')+dot(240,150,22,0,'var(--accent)',0,5);
 names.forEach((n,i)=>{const y=80+i*58;b+=t(372,y+22,n,{a:'start',size:14})+t(440,y+22,`z = ${z[i]}`,{a:'start',size:13,fill:'var(--muted)'});
  b+=box(500,y+4,120,26,'var(--line)','var(--panel2)',4)+grow(500,y+4,p[i]*120,26,i?'var(--blue)':'var(--accent)',i*.3)+t(560,y+48,`p = ${f(p[i],3)}`,{size:13,fill:'var(--muted)'});});
 b+=line('M332 150H366','var(--accent)')+t(320,276,`softmax → 손실 = −log ${f(p[0],3)} = ${f(-Math.log(p[0]),3)} (정답: 자전거)`,{size:14,fill:'var(--muted)'});
 return {svg:svg('얼린 백본 뒤의 머리가 세 클래스 logit을 내고 소프트맥스가 확률로 바꾸는 그림',b),caption:`백본은 얼려 두고 머리만 학습합니다. logit (2, 0.5, −1)을 소프트맥스에 넣으면 자전거 확률이 ${f(p[0],3)}이 됩니다. 확률 막대는 실제 계산이고, logit은 예시 값입니다.`};
};
F.detect=()=>{
 const A=[70,90,250,220],B=[92,100,268,228],C=[300,96,470,224],P=[500,40,600,232],iab=M.iou(A,B),iac=M.iou(A,C);let b='';
 b+=`<rect x="20" y="20" width="600" height="240" rx="8" fill="var(--panel2)"/><path d="M20 232H620" stroke="var(--line)" stroke-width="2"/>`;
 for(let i=1;i<6;i++)b+=`<path d="M${20+i*100} 20V260" stroke="var(--line)" stroke-width=".8" stroke-dasharray="3 5"/>`;
 const r=(q,c,w=3)=>`<rect x="${q[0]}" y="${q[1]}" width="${q[2]-q[0]}" height="${q[3]-q[1]}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
 b+=r(A,'var(--accent)')+t(A[0]+6,A[1]-8,'A 0.92',{a:'start',size:14,fill:'var(--accent)'});
 b+=blink(r(B,'var(--orange)',2.5)+t(B[2]-4,B[3]+20,`B 0.81 · A와 IoU ${f(iab,2)} → 지움`,{a:'end',size:14,fill:'var(--orange)'}),0,'fig-turn fig-first');
 b+=r(C,'var(--accent)')+t(C[0]+6,C[1]-8,`C 0.88 · A와 IoU ${f(iac,2)}`,{a:'start',size:14,fill:'var(--accent)'})+r(P,'var(--blue)')+t(P[0]+50,P[1]-6,'사람 0.76',{size:14,fill:'var(--blue)'});
 b+=pulse((A[0]+A[2])/2,(A[1]+A[3])/2,8,'var(--accent)')+pulse((C[0]+C[2])/2,(C[1]+C[3])/2,8,'var(--accent)');
 b+=t(320,286,'점선 격자 = 검출 칸 · 중심이 떨어진 칸이 물체를 책임집니다',{size:13,fill:'var(--muted)'});
 return {svg:svg(`같은 자전거의 두 상자는 IoU ${f(iab,2)}로 겹쳐 NMS가 하나를 지우고, 옆 자전거와는 IoU ${f(iac,2)}라 남는 그림`,b),caption:`같은 자전거에 겹친 상자 B는 A와의 IoU가 ${f(iab,2)}로 임계값 0.45를 넘어 잠시 보였다가 지워집니다. 옆 자전거 C는 IoU ${f(iac,2)}라 남습니다. IoU는 실제 계산, 상자는 예시입니다.`};
};
F.segment=()=>{
 const sizes=[480];for(let i=0;i<4;i++)sizes.push(M.convOut(sizes[i],3,1,2));let b='';
 sizes.slice(0,4).forEach((s,i)=>{const y=30+i*56,w=150-i*24;b+=blink(box(20+i*14,y,w,40,'var(--blue)')+t(95+i*2,y+25,`${s}×${s*4/3} · ${64<<i}ch`,{size:13}),i*.4);
  const xr=620-w-i*14;b+=blink(box(xr,y,w,40,'var(--accent)')+t(xr+w/2,y+25,`${s} 해상도 복원`,{size:13}),2.4-i*.4);
  b+=line(`M${20+i*14+w} ${y+20}H${xr}`,'var(--orange)')+t(320,y+16,i===0?'건너뛰기 연결 (이어 붙이기)':'',{size:13,fill:'var(--orange)'});});
 b+=box(250,250,140,40,'var(--line)','var(--chart)')+t(320,275,`병목 ${sizes[4]}×${sizes[4]*4/3}`,{size:13});
 b+=dot(60,50,40,215,'var(--blue)',0,6)+dot(560,265,20,-215,'var(--accent)',1.2,6);
 b+=t(80,288,'인코더: ½씩, 채널 ×2',{size:13,fill:'var(--blue)'})+t(560,288,'디코더: ×2씩',{size:13,fill:'var(--accent)'});
 return {svg:svg('U-Net 인코더가 해상도를 절반씩 줄이고 디코더가 키우며 같은 해상도끼리 건너뛰기 연결로 잇는 그림',b,300),caption:`인코더는 보폭 2 합성곱으로 480 → ${sizes.slice(1).join(' → ')}까지 줄이고(실제 출력 크기 계산), 디코더는 다시 키웁니다. 주황 점선이 잃은 가장자리 정보를 같은 해상도의 디코더에 돌려주는 건너뛰기 연결입니다.`};
};
F.motion=()=>{
 const off=[3,-4,5,-2,4,-5,2,null,null,null,-3,4,-2,3],meas=off.map((o,i)=>o===null?null:40+12*i+o),out=M.kalman(meas,0.5,25);let b='';
 const X=v=>30+v*2.7,Y=i=>40+i*0;out.forEach((o,i)=>{const x=X(o.x),hid=meas[i]===null;
  b+=box(20+i*43,56,38,150,hid?'var(--line)':'var(--panel2)',hid?'var(--chart)':'var(--panel2)',4);
  b+=t(39+i*43,228,i,{size:13,fill:'var(--muted)'});
  if(!hid)b+=blink(`<rect x="${26+i*43}" y="${150-((meas[i]-40)/2)%40}" width="26" height="34" fill="none" stroke="var(--orange)" stroke-width="2"/>`,i*.3);
  b+=blink(`<circle cx="${39+i*43}" cy="${130}" r="${hid?7:5}" fill="${hid?'none':'var(--accent)'}" stroke="var(--accent)" stroke-width="2"/>`,i*.3);});
 b+=`<rect x="${20+7*43-3}" y="48" width="${3*43+2}" height="166" rx="6" fill="var(--line)" opacity=".35"/>`+t(20+8.5*43,44,'기둥 뒤 가림 (검출 없음)',{size:13,fill:'var(--muted)'});
 b+=line(`M39 130H${39+13*43}`,'var(--accent)')+dot(39,130,13*43,0,'var(--accent)',0,6);
 b+=t(320,262,`초록 점 = 칼만 위치 · 빈 원 = 예측만 · 주황 상자 = 검출 · 9프레임 오차 ${f(Math.abs(out[9].x-(40+12*9)),1)}px`,{size:13,fill:'var(--muted)'})+t(18,24,'프레임 →',{a:'start',size:13,fill:'var(--muted)'});
 return {svg:svg('14프레임 동안 검출을 따라가고, 가려진 7~9프레임은 칼만 예측만으로 궤적을 잇는 그림',b,280),caption:`검출이 있는 프레임에서는 예측과 검출을 섞고, 기둥에 가린 7~9프레임에서는 등속 예측만으로 궤적을 잇습니다. 9프레임의 오차는 1차원 칼만 필터로 실제 계산한 값이며, 검출 위치는 예시입니다. 클립 전체를 한 번에 보는 비디오 모델이라면 8프레임×196패치에서 결합 어텐션은 ${Math.round(M.attnCost(8,196).joint).toLocaleString('en-US')}쌍, 공간·시간을 나눈 분할 어텐션은 ${Math.round(M.attnCost(8,196).divided).toLocaleString('en-US')}쌍을 비교합니다.`};
};
F.selfsup=()=>{
 const I=[[0.9,0.3,0.1],[0.7,0.7,0.1],[0.1,0.2,0.95],[0.2,0.9,0.4]],T=[[0.95,0.25,0.15],[0.6,0.75,0.2],[0.15,0.1,1],[0.1,0.95,0.3]],S=M.simMatrix(I,T);
 const names=['빨간 자전거','파란 자전거','빈 거치대','사람'];let b=box(20,40,150,220,'var(--blue)','var(--chart)',10)+t(95,64,'사진 인코더',{w:700,size:14});
 names.forEach((n,i)=>{b+=box(36,80+i*42,118,32,'var(--line)')+t(95,101+i*42,n,{size:13});});
 b+=box(200,4,420,36,'var(--orange)','var(--chart)',8)+t(410,28,'글 인코더: “a photo of …” 네 문장',{size:14});
 S.forEach((row,i)=>row.forEach((v,j)=>{const x=240+j*92,y=56+i*52,d=i===j;b+=`<rect x="${x}" y="${y}" width="86" height="46" rx="4" fill="${d?'var(--accent)':'var(--blue)'}" opacity="${(0.15+0.75*Math.max(0,v)**4).toFixed(2)}"/>`+t(x+43,y+29,f(v,2),{size:14,w:d?700:400});
  if(d)b+=blink(`<rect x="${x}" y="${y}" width="86" height="46" rx="4" fill="none" stroke="var(--accent)" stroke-width="3"/>`,i*.6);}));
 b+=line('M170 160H232','var(--accent)')+t(430,284,'대각선(짝이 맞는 쌍)은 높이고 나머지는 낮추도록 학습',{size:13,fill:'var(--muted)'});
 return {svg:svg('사진 4장과 설명 4개의 코사인 유사도 표에서 대각선이 가장 크도록 학습하는 그림',b,300),caption:`표의 숫자는 3차원 예시 임베딩으로 실제 계산한 코사인 유사도입니다. 대각선이 각 행에서 가장 크지만, 두 자전거끼리(${f(S[0][1],2)}, ${f(S[1][0],2)})처럼 닮은 음성이 손실을 키웁니다. 라벨 없이 배우는 MAE는 패치 196개 중 75%를 가려 인코더가 ${M.maeTokens(196,0.75).visible}개만 보게 하므로, 어텐션 쌍이 전부 볼 때의 ${(M.maeTokens(196,0.75).share*100).toFixed(1)}%로 줄어듭니다.`};
};
F.reading=()=>{
 const seq=['A','A','-','0','ε','4','4','2','ε','7'],txt=M.ctcCollapse(seq);let b='';
 b+=box(20,60,150,150,'var(--line)','var(--chart)',10)+`<circle cx="60" cy="170" r="24" fill="none" stroke="var(--muted)" stroke-width="3"/><circle cx="130" cy="170" r="24" fill="none" stroke="var(--muted)" stroke-width="3"/>`+box(52,92,86,34,'var(--muted)','var(--panel2)',4)+t(95,115,'A-0427',{size:15,w:700});
 b+=blink(`<rect x="46" y="86" width="98" height="46" fill="none" stroke="var(--orange)" stroke-width="3" stroke-dasharray="6 4"/>`,0)+t(95,80,'① 글자 상자',{size:13,fill:'var(--orange)'});
 b+=line('M170 110H200','var(--orange)');
 seq.forEach((c,i)=>{b+=blink(box(204+i*34,92,30,36,c==='ε'?'var(--line)':'var(--blue)','var(--panel2)',4)+t(219+i*34,116,c,{size:14,fill:c==='ε'?'var(--muted)':'var(--text)'}),0.3+i*.2);});
 b+=t(374,80,'② 시간 칸마다 글자 또는 빈칸 ε',{size:13,fill:'var(--blue)'})+line('M374 130V160','var(--blue)');
 b+=box(290,164,168,40,'var(--accent)')+t(374,190,`③ CTC 접기 → ${txt}`,{size:14,w:700});
 b+=line('M458 184H490','var(--accent)')+box(490,150,140,70,'var(--accent)','var(--chart)',8)+t(560,178,'④ 구조화',{size:13,fill:'var(--muted)'})+t(560,204,`번호: ${txt}`,{size:14});
 b+=dot(170,110,30,0,'var(--orange)',0,5)+dot(458,184,32,0,'var(--accent)',.8,5);
 b+=t(320,258,'반복은 합치고 빈칸은 지웁니다. 같은 글자가 연달아 나오려면 사이에 ε이 필요합니다',{size:13,fill:'var(--muted)'});
 return {svg:svg(`자전거 번호판을 상자로 찾고, 시간 칸 출력을 CTC로 접어 ${txt}로 읽는 그림`,b,280),caption:`시간 칸 출력 ${seq.join(' ')}을 CTC 규칙(반복 합치기, 빈칸 지우기)으로 접으면 ${txt}이 됩니다. 접기는 실제 계산이고, 시간 칸 출력은 예시입니다.`};
};
F.depth=()=>{
 const al=[0.3,0.5,0.8],cols=['var(--orange)','var(--muted)','var(--blue)'],names=['빨간 반사광','회색 기둥','파란 간판'],r=M.composite(al);let b='';
 b+=`<path d="M30 110L70 90V130Z" fill="var(--panel2)" stroke="var(--text)" stroke-width="2"/>`+t(50,156,'카메라',{size:13});
 b+=line('M70 110H610','var(--accent)')+dot(70,110,540,0,'var(--accent)',0,5);
 al.forEach((a,i)=>{const x=200+i*150;b+=`<circle cx="${x}" cy="110" r="${14+a*10}" fill="${cols[i]}" opacity="${0.25+a*0.6}"/>`+t(x,64,names[i],{size:13})+t(x,80,`α = ${a}`,{size:13,fill:'var(--muted)'});
  b+=box(x-50,170,100,24,'var(--line)','var(--panel2)',4)+grow(x-50,170,r.w[i]*100,24,cols[i],i*.4)+t(x,214,`w = ${f(r.w[i],2)}`,{size:14});});
 b+=t(320,250,`빛이 앞에서 가려진 만큼 뒤 표본의 몫이 줄어듭니다 · 뚫고 나간 빛 ${f(r.rest,2)}`,{size:13,fill:'var(--muted)'});
 b+=t(320,280,'X = (u − cx)·d / fx, Y = (v − cy)·d / fy, Z = d  (깊이로 픽셀을 3D 점으로)',{size:13,fill:'var(--muted)'});
 return {svg:svg(`광선 위 세 표본의 불투명도 0.3, 0.5, 0.8에서 가중치 ${r.w.map(v=>f(v,2)).join(', ')}를 구하는 알파 합성 그림`,b),caption:`광선 위 세 표본의 가중치는 T·α로 ${r.w.map(v=>f(v,2)).join(', ')}입니다. NeRF와 가우시안 스플래팅이 공유하는 알파 합성의 실제 계산이며, 불투명도는 예시입니다. 움직이는 점은 광선 방향을 보여 주는 비유입니다.`};
};
F.generate=()=>{
 const ts=[0,250,500,750,1000],ab=ts.map(x=>M.alphaBar(x));let b='';
 ts.forEach((tt,i)=>{const x=30+i*122,s=Math.sqrt(ab[i]);b+=box(x,60,96,96,'var(--line)','var(--panel2)',6)+`<rect x="${x+20}" y="${80}" width="56" height="56" rx="6" fill="var(--accent)" opacity="${(s*0.9).toFixed(2)}"/>`;
  for(let k=0;k<24;k++){const px=x+6+((k*37+i*11)%84),py=66+((k*53+i*7)%84);b+=`<circle cx="${px}" cy="${py}" r="2.4" fill="var(--orange)" opacity="${(Math.sqrt(1-ab[i])).toFixed(2)}"/>`;}
  b+=t(x+48,180,`t = ${tt}`,{size:14})+t(x+48,202,`√ᾱ = ${f(s,2)}`,{size:13,fill:'var(--accent)'});});
 b+=line('M40 40H600','var(--orange)')+t(320,32,'정방향: 잡음을 조금씩 더함 (고정)',{size:14,fill:'var(--orange)'});
 b+=line('M600 230H40','var(--accent)')+t(320,252,'역방향: 망이 잡음을 맞혀 한 단계씩 걷어 냄 (학습)',{size:14,fill:'var(--accent)'})+dot(600,230,-560,0,'var(--accent)',0,6);
 b+=t(320,286,'초록 네모 = 남은 신호 · 주황 점 = 잡음',{size:13,fill:'var(--muted)'});
 return {svg:svg(`시점 0, 250, 500, 750, 1000에서 신호 계수 ${ab.map(a=>f(Math.sqrt(a),2)).join(', ')}로 잡음이 늘어나는 확산 과정`,b),caption:`DDPM 선형 일정에서 신호 계수 √ᾱ_t는 ${ab.map(a=>f(Math.sqrt(a),2)).join(' → ')}로 줄어듭니다(실제 계산). 네모의 진하기와 점의 양은 그 비율을 보여 주는 비유입니다.`};
};
F.world=()=>{
 const X=x=>40+x*560,Y=y=>270-y*240,curve=Array.from({length:41},(_,i)=>M.flowPath(i/40,0.8)),e=M.flowEuler(3,0.8),s=M.flowEuler(3,0);let b='';
 b+=`<path d="M${X(0.1)} ${Y(0.5)}L${X(0.9)} ${Y(0.5)}" stroke="var(--accent)" stroke-width="3"/>`+`<path d="${curve.map((p,i)=>`${i?'L':'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('')}" fill="none" stroke="var(--blue)" stroke-width="2" stroke-dasharray="6 5"/>`;
 b+=`<path class="fig-draw" d="${e.pts.map((p,i)=>`${i?'L':'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('')}" fill="none" stroke="var(--orange)" stroke-width="2.5"/>`;
 e.pts.forEach(p=>b+=`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="5" fill="var(--orange)"/>`);
 s.pts.forEach((p,i)=>b+=blink(`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="6" fill="var(--accent)"/>`,i*.5));
 b+=pulse(X(0.1),Y(0.5),9,'var(--accent)')+t(X(0.1),Y(0.5)+34,'데이터 x₀',{size:14})+t(X(0.9),Y(0.5)+34,'잡음 ε',{size:14});
 b+=t(320,26,`곧은 길 3단계 오차 ${f(s.err,3)} · 휜 길 3단계 오차 ${f(e.err,3)}`,{size:14,fill:'var(--muted)'});
 b+=t(330,226,'초록: 정류 흐름(직선)',{size:13,fill:'var(--accent)'})+t(330,70,'파랑 점선: 휜 길 · 주황: 그 위 오일러 3걸음',{size:13,fill:'var(--blue)'});
 return {svg:svg(`잡음에서 데이터로 가는 곧은 길은 3걸음에 정확히 도착하고, 휜 길은 오차 ${f(e.err,3)}을 남기는 그림`,b,290),caption:`같은 3걸음 오일러 적분이라도 곧은 길(초록)은 정확히 데이터에 닿고, 휜 길(주황)은 ${f(e.err,3)}만큼 빗나갑니다. 정확한 속도를 아는 장난감 모형의 실제 계산입니다.`};
};
F.capstone=()=>{
 const rows=[['1280 · FP32',M.latency(1280,'fp32')],['640 · FP32',M.latency(640,'fp32')],['640 · INT8',M.latency(640,'int8')]],keys=[['decode','디코드','var(--muted)'],['pre','전처리','var(--blue)'],['det','검출','var(--orange)'],['nms','NMS','var(--line)'],['cls','분류','var(--accent)']],sc=4.4;let b='';
 rows.forEach(([n,r],i)=>{const y=50+i*62;let x=130;b+=t(20,y+22,n,{a:'start',size:14});keys.forEach(([k],j)=>{const w=r[k]*sc;b+=grow(Math.min(x,620),y,Math.min(w,Math.max(0,620-x)),30,keys[j][2],i*.4+j*.1);x+=w;});
  b+=t(Math.min(130+r.total*sc+8,560),y+21,`${f(r.total,1)}ms${r.total>r.budget?' ✕':' ✓'}`,{a:'start',size:14,fill:r.total>r.budget?'var(--orange)':'var(--accent)'});});
 const bx=130+(1000/30)*sc;b+=`<path class="fig-dash" d="M${bx} 36V230" stroke="var(--orange)" stroke-width="2"/>`+t(bx,30,'예산 33.3ms (30fps)',{size:13,fill:'var(--orange)'});
 keys.forEach(([,n,c],j)=>{b+=`<rect x="${130+j*96}" y="250" width="14" height="14" fill="${c}"/>`+t(150+j*96,262,n,{a:'start',size:13});});
 b+=t(130,290,'1280·FP32 막대는 그림 오른쪽에서 잘렸습니다(합계는 글자로 표시)',{a:'start',size:13,fill:'var(--muted)'});
 return {svg:svg('입력 크기와 정밀도에 따른 단계별 지연 막대와 33.3ms 예산선',b),caption:`단계별 막대는 가정한 기준값(640·FP32)에 픽셀 수 비례와 INT8 0.4배를 적용한 시나리오 계산입니다. 1280·FP32는 ${f(rows[0][1].total,1)}ms로 예산을 크게 넘고, 640·INT8은 ${f(rows[2][1].total,1)}ms로 들어옵니다.`};
};
function render(c){return F[c.id](H);}
return {render,F,H};
})();
