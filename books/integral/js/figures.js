/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 곡선·직사각형·원판·기둥의 크기는 모두 IGMath로 계산한다. */
window.IGFigures=(()=>{
'use strict';
const M=IGMath;
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const turn=(body,i)=>blink(body,i*1.2,i?'fig-turn':'fig-turn fig-first');
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const f2=(n,d=2)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:false}).replace('-','−');
/* 작은 좌표 상자: 왼쪽 아래 (x0, y0+h)가 (xmin, ymin). 축과 함께 곡선·직사각형·칠한 넓이를 그리는 함수를 돌려준다. */
function panel(x0,y0,w,h,xmin,xmax,ymin,ymax){
 const X=v=>x0+(v-xmin)/(xmax-xmin)*w,Y=v=>y0+h-(v-ymin)/(ymax-ymin)*h,pts=d=>d.map(([a,b])=>X(a).toFixed(1)+','+Y(b).toFixed(1)).join(' ');
 return {X,Y,
  axes:`<path d="M${x0} ${y0}V${y0+h}H${x0+w}" fill="none" stroke="var(--muted)" stroke-width="1.2"/>`,
  line:(d,color='var(--accent)',w=3,cls='')=>`<polyline${cls?` class="${cls}" pathLength="1000"`:''} points="${pts(d)}" fill="none" stroke="${color}" stroke-width="${w}"/>`,
  fill:(d,color='var(--accent)',op=.32)=>`<polygon points="${X(d[0][0]).toFixed(1)},${Y(0).toFixed(1)} ${pts(d)} ${X(d[d.length-1][0]).toFixed(1)},${Y(0).toFixed(1)}" fill="${color}" fill-opacity="${op}"/>`,
  rect:(rx,rw,rh,color='var(--blue)')=>`<rect x="${X(rx).toFixed(1)}" y="${Y(Math.max(rh,0)).toFixed(1)}" width="${(X(rx+rw)-X(rx)).toFixed(1)}" height="${Math.max(Math.abs(Y(0)-Y(rh)),.6).toFixed(1)}" fill="${color}" fill-opacity=".36" stroke="${color}" stroke-width="1"/>`};
}
const curve=(f,a,b,n=60)=>Array.from({length:n+1},(_,i)=>{const x=a+(b-a)*i/n;return [x,f(x)];});
/* IG3D가 그린 그림을 바깥 SVG 안에 끼워 넣는다. 안쪽 그림의 설명은 바깥 aria-label이 대신한다. */
const inset=(scene,x,y,w,h,yaw=32,pitch=24)=>IG3D.render({...scene,yaw,pitch,label:''}).replace('<svg class="ig3d"',`<svg x="${x}" y="${y}" width="${w}" height="${h}"`).replace(' role="img" aria-label=""',' aria-hidden="true"');
const F={};

F.area=()=>{
 const A=panel(50,60,200,180,0,6,0,16),B=panel(350,60,250,180,0,5,0,16),r=M.riemann(M.rate,0,5,5,'left');
 let b=t(150,36,'속도가 일정할 때',{size:15,w:700})+A.axes+A.rect(0,5,4,'var(--accent)')+A.line([[0,4],[5,4]])+t(A.X(2.5),A.Y(1.6),'4 × 5 = 20 L',{size:15})+t(150,264,'시간 (분)',{size:13,fill:'var(--muted)'});
 b+=t(475,36,'속도가 변할 때',{size:15,w:700})+B.axes+B.line(curve(M.rate,0,5))+r.rects.map(([x,w,h],i)=>blink(B.rect(x,w,h)+t(B.X(x+0.5),B.Y(h)-6,f2(h,1),{size:12,fill:'var(--blue)'}),i*0.5)).join('')+t(475,264,`0 + 5.4 + 9.6 + 12.6 + 14.4 = ${f2(r.sum,0)} L`,{size:14});
 b+=`<path class="fig-dash" d="M262 150H338" stroke="var(--orange)" stroke-width="2" fill="none"/>`+dot(262,150,76,0,'var(--orange)',0,5)+t(300,136,'잘게 나눠',{size:13,fill:'var(--orange)'});
 return {svg:svg('왼쪽은 높이 4, 폭 5인 직사각형 하나로 20리터를 구하는 그림, 오른쪽은 유입 속도 곡선 아래에 직사각형 다섯 개가 차례로 놓이며 높이 0, 5.4, 9.6, 12.6, 14.4를 더해 42리터를 어림하는 그림',b),caption:'속도가 일정하면 직사각형 하나의 넓이가 고인 양입니다. 속도가 변하면 1분씩 나눠 칸마다 직사각형을 세우고 더합니다(왼쪽 끝 높이, 합 42 L, 실제 50 L). 높이는 실제 계산값입니다.'};
};
F.riemann=()=>{
 let b='';[5,10,20,40].forEach((n,k)=>{const P=panel(150,50,340,190,0,5,0,16),l=M.riemann(M.rate,0,5,n,'left'),r=M.riemann(M.rate,0,5,n,'right');
  b+=turn(l.rects.map(([x,w,h])=>P.rect(x,w,h)).join('')+t(320,278,`n = ${n} · 왼쪽 합 ${f2(l.sum)} L · 오른쪽 합 ${f2(r.sum)} L · 차이 ${f2(r.sum-l.sum)} L`,{size:15}),k);});
 const P=panel(150,50,340,190,0,5,0,16);b+=P.axes+P.line(curve(M.rate,0,5))+t(320,30,'칸 수를 5 → 10 → 20 → 40으로 늘리기',{size:15,w:700})+t(560,150,'→ 50 L',{size:18,fill:'var(--orange)',w:700})+pulse(560,144,34,'var(--orange)');
 return {svg:svg('유입 속도 곡선 아래의 직사각형이 5개, 10개, 20개, 40개로 차례로 바뀌며 왼쪽 합이 42.00, 46.13, 48.09, 49.05리터로 커지고 오른쪽 합과의 차이가 15, 7.5, 3.75, 1.88리터로 줄어드는 그림',b),caption:'칸 수를 두 배로 늘릴 때마다 왼쪽 합과 오른쪽 합의 차이가 절반이 됩니다(실제 계산). 두 합이 함께 다가가는 값 50 L가 정적분입니다. 동작을 줄이면 n = 5인 그림만 보입니다.'};
};
F.accumulate=()=>{
 const A=panel(50,50,240,180,0,10,0,16),B=panel(360,50,240,180,0,10,0,100);let b=t(170,32,'유입 속도 r(t)',{size:15,w:700})+t(480,32,'쌓인 양 A(x)',{size:15,w:700})+A.axes+B.axes+A.line(curve(M.rate,0,10))+B.line(curve(M.stored,0,10),'var(--blue)',3,'fig-draw');
 [2,4,6,8,10].forEach((x,k)=>{b+=blink(A.fill(curve(M.rate,Math.max(0,x-2),x,20),'var(--accent)',.42)+`<circle cx="${B.X(x)}" cy="${B.Y(M.stored(x))}" r="6" fill="var(--orange)"/>`+t(B.X(x)-8,B.Y(M.stored(x))-10,f2(M.stored(x),1),{size:12,a:'end'}),k*0.7);});
 b+=`<path class="fig-dash" d="M296 140H352" stroke="var(--orange)" stroke-width="2" fill="none"/>`+t(324,128,'넓이 → 높이',{size:12,fill:'var(--orange)'})+t(170,256,'x = 2, 4, 6, 8, 10분까지 칠한 넓이',{size:13,fill:'var(--muted)'})+t(480,256,'10.4 · 35.2 · 64.8 · 89.6 · 100 L',{size:13,fill:'var(--muted)'});
 return {svg:svg('왼쪽 유입 속도 곡선 아래가 2분씩 차례로 칠해지고, 그때마다 오른쪽 쌓인 양 그래프에 점이 하나씩 찍혀 10.4, 35.2, 64.8, 89.6, 100리터가 되는 그림',b),caption:'왼쪽에서 0분부터 x분까지 칠한 넓이가 오른쪽 그래프의 점 높이 A(x)입니다. x = 2, 4, 6, 8, 10에서 실제로 계산한 값을 찍었습니다. 속도가 큰 4~6분 사이에 점이 가장 많이 올라갑니다.'};
};
F.ftc=()=>{
 const A=panel(50,50,240,180,0,10,0,16),B=panel(360,50,240,180,0,10,0,100),x=3,h=1,q=M.quotient(M.stored,x,h);
 let b=t(170,32,'유입 속도 r(t)',{size:15,w:700})+t(480,32,'쌓인 양 A(x)',{size:15,w:700})+A.axes+B.axes+A.line(curve(M.rate,0,10))+B.line(curve(M.stored,0,10),'var(--blue)');
 b+=blink(A.fill(curve(M.rate,x,x+h,12),'var(--orange)',.6),0)+t(A.X(x+0.5),A.Y(0)-8,'폭 h',{size:12,fill:'var(--text)'})+B.line([[x-1.5,M.stored(x)-1.5*q],[x+h+1.5,M.stored(x)+(h+1.5)*q]],'var(--orange)',2.4)+`<circle cx="${B.X(x)}" cy="${B.Y(M.stored(x))}" r="5" fill="var(--orange)"/><circle cx="${B.X(x+h)}" cy="${B.Y(M.stored(x+h))}" r="5" fill="var(--orange)"/>`;
 b+=`<path class="fig-dash" d="M296 120H352" stroke="var(--accent)" stroke-width="2" fill="none"/>`+dot(296,120,56,0,'var(--accent)',0,5)+t(324,108,'적분',{size:13,fill:'var(--accent)'})+`<path class="fig-dash" d="M352 170H296" stroke="var(--blue)" stroke-width="2" fill="none"/>`+dot(352,170,-56,0,'var(--blue)',1.2,5)+t(324,192,'미분',{size:13,fill:'var(--blue)'});
 b+=t(170,256,`띠의 넓이 ${f2(M.stored(x+h)-M.stored(x),1)} L (x = 3, h = 1)`,{size:13,fill:'var(--muted)'})+t(480,256,`두 점을 이은 직선의 기울기 ${f2(q,1)} · r(3) = ${f2(M.rate(3),1)}`,{size:13,fill:'var(--muted)'});
 return {svg:svg('왼쪽 유입 속도 곡선에서 3분부터 4분까지의 가는 띠가 깜박이고, 오른쪽 쌓인 양 그래프에서 같은 두 시각의 점을 이은 직선이 그려진 그림. 두 그래프 사이에 적분과 미분을 가리키는 화살표가 서로 반대 방향으로 움직인다',b),caption:'왼쪽 띠의 넓이 13.6 L를 폭 1분으로 나눈 값이 오른쪽 직선의 기울기 13.6 L/분입니다(실제 계산). 폭을 줄이면 이 기울기가 r(3) = 12.6에 다가갑니다. 속도를 적분하면 쌓인 양이 되고, 쌓인 양을 미분하면 속도로 돌아옵니다.'};
};
F.antiderivative=()=>{
 const A=panel(50,50,220,180,0,10,0,16),B=panel(360,40,240,200,0,10,-30,150);let b=t(160,32,'f(t) = 6t − 0.6t²',{size:15,w:700})+t(480,26,'F(t) + C = 3t² − 0.2t³ + C',{size:15,w:700})+A.axes+B.axes+A.line(curve(M.rate,0,10));
 [-20,0,20,40].forEach((C,k)=>{const y=M.stored(5)+C;b+=blink(B.line(curve(s=>M.stored(s)+C,0,10),C===0?'var(--blue)':'var(--muted)',C===0?3:2)+B.line([[3.6,y-1.4*15],[6.4,y+1.4*15]],'var(--orange)',3)+t(B.X(10)+4,B.Y(M.stored(10)+C)+4,`C = ${f2(C,0)}`,{size:12,a:'start'}),k*0.8);});
 b+=`<path d="M${A.X(5)} ${A.Y(0)}V${A.Y(15)}" stroke="var(--orange)" stroke-width="2" stroke-dasharray="5 4"/>`+t(A.X(5),A.Y(15)-8,'f(5) = 15',{size:13,fill:'var(--orange)'})+t(160,256,'미분 ← · → 적분',{size:13,fill:'var(--muted)'})+t(480,268,'t = 5에서의 기울기는 어느 곡선에서나 15',{size:13,fill:'var(--muted)'});
 return {svg:svg('왼쪽은 유입 속도 곡선과 5분에서의 값 15, 오른쪽은 적분상수 C가 −20, 0, 20, 40인 원시함수 곡선 네 개가 차례로 나타나고 곡선마다 5분에서의 접선이 같은 기울기로 그려지는 그림',b),caption:'원시함수 3t² − 0.2t³ + C는 C에 따라 위아래로 옮겨질 뿐 모양이 같습니다. 그래서 어느 곡선에서나 t = 5의 기울기가 f(5) = 15입니다. 곡선은 실제 계산이고 접선은 기울기 15로 그렸습니다.'};
};
F.substitution=()=>{
 const xs=[0,0.5,1,1.5,2],X=v=>70+v*120,U=v=>70+v*125;let b=t(320,30,'u = x² 로 바꾸면 칸의 폭이 달라진다',{size:15,w:700})+`<path d="M70 90H310M70 210H570" stroke="var(--muted)" stroke-width="1.4"/>`+t(48,95,'x',{size:15})+t(48,215,'u',{size:15});
 xs.forEach((x,i)=>{b+=`<path d="M${X(x)} 82V98M${U(x*x)} 202V218" stroke="var(--text)" stroke-width="1.6"/>`+t(X(x),74,f2(x,1),{size:13})+t(U(x*x),238,f2(x*x,2),{size:13})+`<path class="fig-dash" d="M${X(x)} 98L${U(x*x)} 202" stroke="var(--orange)" stroke-width="1.6" fill="none"/>`;
  if(i<4){const x1=xs[i+1];b+=`<rect x="${X(x)}" y="100" width="${X(x1)-X(x)}" height="14" fill="var(--accent)" fill-opacity="${.25+i*.15}"/>`+blink(`<rect x="${U(x*x)}" y="186" width="${U(x1*x1)-U(x*x)}" height="14" fill="var(--blue)" fill-opacity="${.25+i*.15}"/>`+t((U(x*x)+U(x1*x1))/2,178,`× ${f2(x+x1,1)}`,{size:13,fill:'var(--blue)'}),i*0.6);}});
 b+=t(320,274,'폭 0.5인 칸이 u에서는 0.25, 0.75, 1.25, 1.75가 된다 · 배율 = 2x (칸의 가운데)',{size:14,fill:'var(--muted)'});
 return {svg:svg('위쪽 x축을 0부터 2까지 폭 0.5인 네 칸으로 나누고, 같은 점들을 아래쪽 u축의 0, 0.25, 1, 2.25, 4로 잇는 그림. u축의 칸은 폭이 0.25, 0.75, 1.25, 1.75로 오른쪽으로 갈수록 넓어지고 칸마다 배율 0.5, 1.5, 2.5, 3.5가 차례로 나타난다',b),caption:'x축의 폭이 같은 네 칸을 u = x²으로 옮기면 오른쪽 칸일수록 넓어집니다. 늘어나는 배율은 칸 가운데의 2x와 같고(실제 계산), 이것이 du = 2x dx의 뜻입니다.'};
};
F.parts=()=>{
 const P=panel(120,40,220,210,0,1.15,0,3),c=curve(Math.exp,0,1,40),uv=c.map(([x,y])=>[x,y]);
 let b=t(230,26,'u = x, v = eˣ (x: 0 → 1)',{size:15,w:700})+P.axes+t(P.X(1.15)+10,P.Y(0)+5,'u',{size:15})+t(P.X(0)-4,P.Y(3)-6,'v',{size:15});
 b+=`<rect x="${P.X(0)}" y="${P.Y(Math.E)}" width="${P.X(1)-P.X(0)}" height="${P.Y(0)-P.Y(Math.E)}" fill="none" stroke="var(--muted)" stroke-dasharray="5 4"/>`;
 b+=blink(P.fill(uv,'var(--blue)',.45)+t(P.X(0.6),P.Y(0.7),'∫ v du',{size:15,fill:'var(--text)'}),0)+blink(`<polygon points="${P.X(0)},${P.Y(1)} ${uv.map(([a,v])=>P.X(a).toFixed(1)+','+P.Y(v).toFixed(1)).join(' ')} ${P.X(0)},${P.Y(Math.E)}" fill="var(--accent)" fill-opacity=".45"/>`+t(P.X(0.3),P.Y(2.2),'∫ u dv',{size:15}),1.2)+P.line(uv,'var(--orange)',3);
 b+=t(490,90,'직사각형 전체',{size:14,fill:'var(--muted)'})+t(490,112,`[u·v] = 1 × e = ${f2(Math.E,3)}`,{size:15})+t(490,152,'파란 넓이',{size:14,fill:'var(--muted)'})+t(490,174,`∫ v du = e − 1 = ${f2(Math.E-1,3)}`,{size:15})+t(490,214,'초록 넓이',{size:14,fill:'var(--muted)'})+t(490,236,`∫ u dv = ${f2(Math.E,3)} − ${f2(Math.E-1,3)} = 1`,{size:15,w:700});
 return {svg:svg('가로축이 u, 세로축이 v인 평면에 x가 0에서 1까지 갈 때의 점 (x, e의 x제곱)이 그리는 곡선. 곡선 아래 파란 넓이가 v du의 적분 1.718, 곡선 왼쪽 초록 넓이가 u dv의 적분 1이고, 둘을 합치면 가로 1, 세로 e인 직사각형의 넓이 2.718이 된다',b),caption:'∫₀¹ x·eˣ dx를 u-v 평면의 넓이로 그렸습니다. 직사각형 전체 [u·v] = e에서 곡선 아래 넓이 ∫v du = e − 1을 빼면 곡선 왼쪽 넓이 ∫u dv = 1이 남습니다(실제 계산). 부분적분 공식의 뺄셈이 이 그림의 뺄셈입니다.'};
};
F.numeric=()=>{
 const f=x=>Math.exp(-x*x),names=['직사각형 (왼쪽 끝)','사다리꼴','심프슨 (포물선)'],vals=[M.integrate(f,0,1,2,'left'),M.integrate(f,0,1,2,'trap'),M.integrate(f,0,1,2,'simpson')];let b=t(320,26,'같은 두 칸을 무엇으로 덮는가 (∫₀¹ e^(−x²) dx, 참값 0.7468)',{size:15,w:700});
 names.forEach((name,k)=>{const P=panel(40+k*205,60,160,160,0,1,0,1.1);let s=P.axes;
  if(k===0)s+=M.riemann(f,0,1,2,'left').rects.map(([x,w,h])=>P.rect(x,w,h)).join('');
  else{const d=k===1?[[0,f(0)],[0.5,f(0.5)],[1,f(1)]]:curve(x=>{const u=x/0.5;return f(0)*(u-1)*(u-2)/2-f(0.5)*u*(u-2)+f(1)*u*(u-1)/2;},0,1,30);s+=P.fill(d,'var(--blue)',.36)+P.line(d,'var(--blue)',1.8);}
  s+=P.line(curve(f,0,1,40))+[0,0.5,1].map(x=>`<circle cx="${P.X(x)}" cy="${P.Y(f(x))}" r="4" fill="var(--orange)"/>`).join('');
  b+=blink(s,k*1.0)+t(120+k*205,244,name,{size:14,w:700})+t(120+k*205,266,`${f2(vals[k],4)} · 오차 ${f2(Math.abs(vals[k]-0.746824),4)}`,{size:13,fill:'var(--muted)'});});
 return {svg:svg('같은 곡선의 두 칸을 왼쪽부터 직사각형, 사다리꼴, 포물선 조각으로 덮은 세 그림이 차례로 밝아진다. 값은 0.8894, 0.7314, 0.7472이고 참값 0.7468과의 차이는 0.1426, 0.0155, 0.0004이다',b),caption:'함숫값 세 개(주황 점)는 같고 칸의 윗변만 수평선, 직선, 포물선으로 바꿨습니다. 두 칸에서의 오차가 0.1426, 0.0155, 0.0004로 줄어듭니다(실제 계산).'};
};
F.volume=()=>{
 const d=M.SOLIDS.bowl,profile=Array.from({length:41},(_,i)=>[d.H*i/40,d.rho(d.H*i/40)]),disks=M.diskVolume('bowl',8).disks,rmax=d.rho(d.H);let b=t(320,24,'옆모습 곡선 ρ = √(1.2h)를 세로축 둘레로 돌리기',{size:15,w:700});
 [90,180,270,360].forEach((sw,k)=>{b+=turn(inset(IG3D.solid({disks,sweep:sw,H:d.H,rmax,profile}),150,30,340,240)+t(320,288,`${sw}° 돌림 · 원판 8개 · 부피 ${f2(M.diskVolume('bowl',8).sum*sw/360,1)} L`,{size:14}),k);});
 b+=`<circle class="fig-pulse" cx="560" cy="150" r="30" fill="none" stroke="var(--orange)" stroke-width="3"/>`+t(560,146,'π·ρ²·Δh',{size:13,fill:'var(--orange)'})+t(560,164,'원판 하나',{size:12,fill:'var(--muted)'});
 return {svg:svg('포물선 모양의 옆모습 곡선을 세로축 둘레로 90도, 180도, 270도, 360도 차례로 돌려 원판 여덟 개로 쌓은 그릇이 만들어지는 3차원 그림. 다 돌리면 부피는 120.6리터이다',b),caption:'주황 곡선(탱크의 옆모습)을 축 둘레로 돌리면 그릇이 됩니다. 원판 8개의 크기는 실제 계산값이고 한 바퀴를 다 돌린 부피는 120.6 L입니다. 동작을 줄이면 90° 돌린 그림만 보입니다. 실험에서는 직접 돌려 볼 수 있습니다.'};
};
F.probability=()=>{
 const d=M.DENSITY.normal,P=panel(70,50,500,180,0,20,0,0.15);let b=t(320,30,'확률은 곡선 아래의 넓이 (정규분포, 평균 10분, 표준편차 3분)',{size:15,w:700})+P.axes;
 b+=blink(P.fill(curve(d.f,4,16,60),'var(--blue)',.3),1.4)+blink(P.fill(curve(d.f,7,13,40),'var(--accent)',.55),0)+P.line(curve(d.f,0,20,120));
 [4,7,10,13,16].forEach(x=>b+=`<path d="M${P.X(x)} ${P.Y(0)}v6" stroke="var(--muted)"/>`+t(P.X(x),P.Y(0)+22,x+'분',{size:13,fill:'var(--muted)'}));
 b+=t(P.X(10),P.Y(0.06),f2(M.density('normal',7,13).prob,4),{size:17,w:700})+t(P.X(15.2),P.Y(0.045)-22,'4~16분: '+f2(M.density('normal',4,16).prob,4),{size:14,fill:'var(--blue)',a:'start'})+pulse(P.X(10),P.Y(0.065),30,'var(--orange)')+t(320,276,'전체 넓이 = 1 · 한 점의 넓이 = 0',{size:14,fill:'var(--muted)'});
 return {svg:svg('종 모양의 확률밀도 곡선 아래에서 7분부터 13분까지의 넓이 0.6827이 먼저 칠해지고, 이어 4분부터 16분까지의 넓이 0.9545가 옅게 칠해지는 그림',b),caption:'평균 ± 표준편차 구간(7~13분)의 넓이는 0.6827, 평균 ± 2 표준편차 구간(4~16분)의 넓이는 0.9545입니다(심프슨 공식으로 실제 계산). 구간의 폭이 두 배가 되어도 넓이는 두 배가 되지 않습니다.'};
};
F.double=()=>{
 const d=M.SURFACES.dome,geo={ax:d.ax,bx:d.bx,ay:d.ay,by:d.by,zmax:d.zmax};let b=t(320,24,'둥근 지붕 z = 4 − x² − y² 아래에 기둥 세우기',{size:15,w:700});
 [1,2,4,8].forEach((n,k)=>{const r=M.columns('dome',n);b+=turn(inset(IG3D.boxes({cols:r.cols,...geo}),150,30,340,240,35,30)+t(320,288,`${n} × ${n} = ${n*n}개 · 부피의 합 ${f2(r.sum,3)} (참값 13.333)`,{size:14}),k);});
 b+=`<circle class="fig-pulse" cx="560" cy="150" r="32" fill="none" stroke="var(--orange)" stroke-width="3"/>`+t(560,146,'f·Δx·Δy',{size:13,fill:'var(--orange)'})+t(560,164,'기둥 하나',{size:12,fill:'var(--muted)'});
 return {svg:svg('정사각형 바닥 위의 둥근 지붕 아래를 기둥 1개, 4개, 16개, 64개로 차례로 채우는 3차원 그림. 부피의 합이 16, 14, 13.5, 13.375로 참값 13.333에 다가간다',b),caption:'바닥을 잘게 나눌수록 기둥 윗면이 곡면에 가까워지고, 부피의 합이 16 → 14 → 13.5 → 13.375로 참값 13.333에 다가갑니다(실제 계산). 동작을 줄이면 기둥 1개인 그림만 보입니다.'};
};
F.final=()=>{
 const r=M.finalEstimate(2),P=panel(50,50,300,180,0,12,0,16),pts=r.rows;let par=[];
 for(let i=0;i<pts.length-1;i+=2){const [x0,y0]=pts[i],y1=pts[i+1][1],y2=pts[i+2][1];for(let k=0;k<=10;k++){const u=k/5;par.push([x0+u*2,y0*(u-1)*(u-2)/2-y1*u*(u-2)+y2*u*(u-1)/2]);}}
 let b=t(200,32,'2분마다 읽은 유량계 값 7개',{size:15,w:700})+P.axes+blink(P.fill(pts,'var(--blue)',.3)+P.line(pts,'var(--blue)',2),0)+blink(P.line(par,'var(--orange)',2.4),1.6)+pts.map(p=>`<circle cx="${P.X(p[0])}" cy="${P.Y(p[1])}" r="5" fill="var(--text)"/>`).join('')+t(200,256,'파랑: 직선으로 잇기 · 주황: 포물선으로 잇기',{size:13,fill:'var(--muted)'});
 const E=[['왼쪽',r.est.left],['오른쪽',r.est.right],['사다리꼴',r.est.trap],['심프슨',r.est.simpson]],X=v=>420+(v-64)*17;
 b+=t(500,32,'12분 동안 들어온 양의 추정 (L)',{size:15,w:700})+`<path d="M${X(r.room)} 50V232" stroke="var(--orange)" stroke-width="2" stroke-dasharray="6 4"/>`+t(X(r.room),248,`남은 자리 ${f2(r.room,1)}`,{size:13,fill:'var(--orange)'});
 E.forEach(([n,v],k)=>{const y=66+k*42;b+=t(414,y+17,n,{size:13,a:'end'})+`<rect class="fig-grow" style="animation-delay:${k*0.4}s" x="420" y="${y}" width="${X(v)-420}" height="24" rx="3" fill="${v>r.room?'var(--orange)':'var(--blue)'}" fill-opacity=".7"/>`+t(X(v)+6,y+17,f2(v,1),{size:13,a:'start'});});
 return {svg:svg('왼쪽은 2분마다 읽은 유량계 값 일곱 개를 직선으로 이은 선과 포물선으로 이은 선, 오른쪽은 네 방법의 추정값 67.6, 68.8, 68.2, 73.2리터를 막대로 그리고 남은 자리 72.4리터를 점선으로 표시한 그림. 심프슨 막대만 점선을 넘는다',b),caption:'같은 기록 일곱 개에서 왼쪽·오른쪽 직사각형과 사다리꼴은 남은 자리 72.4 L보다 작고, 심프슨만 큽니다(실제 계산, 막대는 64 L부터 그렸습니다). 기준선이 추정값들 사이에 있으면 이 기록으로는 판정할 수 없습니다.'};
};
function render(c){return F[c.id]();}
return {render,F};
})();
