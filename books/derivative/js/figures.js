/* 장 개념 그림 12장. 그림 속 숫자는 DVMath로 계산한다. 움직임은 보조이며, 동작 줄이기에서는 마지막 모습으로 멈춘다(assets/style.css의 dvf-*).
   따라갈 양: 기울기(할선·접선)는 주황, 원래 함수는 강조색, 도함수는 파랑. */
window.DVFigures=(()=>{
'use strict';
const M=DVMath,RK=M.rocket,F=DVUI.fmt,AC='var(--accent)',OR='var(--orange)',BL='var(--blue)',MU='var(--muted)',TX='var(--text)';
/* 작은 좌표계: 화면 상자 [ox, oy, w, h]에 x·y 범위를 맞춘다. */
function plot(ox,oy,w,h,xmin,xmax,ymin,ymax){
 const X=v=>ox+(v-xmin)/(xmax-xmin)*w,Y=v=>oy+h-(v-ymin)/(ymax-ymin)*h;
 const curve=(f,color=AC,a=xmin,b=xmax,extra='')=>{const p=[];for(let i=0;i<=60;i++){const x=a+(b-a)*i/60;p.push(`${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`);}return `<polyline points="${p.join(' ')}" fill="none" stroke="${color}" stroke-width="2.6" ${extra}/>`;};
 const axes=(xl,yl)=>`<path d="M${ox} ${oy}V${oy+h}H${ox+w}" fill="none" stroke="${MU}"/><text x="${ox+w}" y="${oy+h+16}" text-anchor="end" fill="${MU}">${xl}</text><text x="${ox}" y="${oy-6}" fill="${MU}">${yl}</text>`;
 const line=(x0,y0,m,a,b,color=OR,extra='')=>`<path d="M${X(a).toFixed(1)} ${Y(y0+m*(a-x0)).toFixed(1)}L${X(b).toFixed(1)} ${Y(y0+m*(b-x0)).toFixed(1)}" stroke="${color}" stroke-width="2.6" ${extra}/>`;
 const dot=(x,y,color=OR,r=5)=>`<circle cx="${X(x).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="${r}" fill="${color}"/>`;
 return {X,Y,curve,axes,line,dot};
}
const T=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'start'}" fill="${o.fill||TX}"${o.b?' font-weight="700"':''}${o.cls?` class="${o.cls}"`:''}${o.st?` style="${o.st}"`:''}>${s}</text>`;
const svg=(label,body)=>`<svg viewBox="0 0 720 250" role="img" aria-label="${label}" font-size="13">${body}</svg>`;
const rocket=()=>plot(60,30,300,180,0,4,0,24);

function average(){
 const p=rocket(),a=1,b=2,m=M.avgRate(RK.h,a,b);
 return {caption:`두 시각 1초와 2초의 높이 차이 ${F(RK.h(b)-RK.h(a),0)} m를 걸린 시간 1초로 나눈 값 ${F(m,0)} m/s가 두 점을 잇는 할선의 기울기입니다.`,
 svg:svg('로켓 높이 그래프 위 두 점을 잇는 할선과 가로 변화 Δt, 세로 변화 Δh',p.axes('t (초)','높이 h (m)')+p.curve(RK.h)+p.line(a,RK.h(a),m,0.3,3)+
 `<path class="dvf-seq" d="M${p.X(a)} ${p.Y(15)}H${p.X(b)}" stroke="${BL}" stroke-width="3"/><path class="dvf-seq" style="animation-delay:1.2s" d="M${p.X(b)} ${p.Y(15)}V${p.Y(20)}" stroke="${BL}" stroke-width="3"/>`+p.dot(a,15,BL)+p.dot(b,20,BL)+
 T(p.X(1.5),p.Y(15)+18,'Δt = 1초',{a:'middle',fill:BL})+T(p.X(b)+10,p.Y(15)+18,'Δh = 5 m',{fill:BL})+
 T(420,70,'평균 변화율 = Δh ÷ Δt',{b:1})+T(420,100,`= (${F(RK.h(b),0)} − ${F(RK.h(a),0)}) ÷ (2 − 1)`)+T(420,130,`= ${F(m,0)} m/s`,{fill:OR,b:1})+T(420,170,'주황 선: 두 점을 잇는 할선',{fill:OR})+T(420,194,'할선의 기울기 = 평균 변화율',{fill:MU}))};
}
function limit(){
 const p=rocket(),dts=[1,0.5,0.1],rows=M.shrinkTable(RK.h,1,[1,0.5,0.1,0.01]);
 return {caption:`1초에서 시작하는 구간을 1초, 0.5초, 0.1초로 줄이면 평균 속도가 ${rows.slice(0,3).map(r=>F(r.avg,1)).join(', ')} m/s로 바뀌며 10에 다가갑니다.`,
 svg:svg('구간을 줄일 때마다 할선이 바뀌고 평균 속도가 10에 다가가는 그림',p.axes('t (초)','높이 h (m)')+p.curve(RK.h)+
 dts.map((d,i)=>`<g class="dvf-turn${i===2?' dvf-last':''}" style="animation-delay:${i*1.6}s">${p.line(1,15,rows[i].avg,0.2,1.9)}${p.dot(1+d,RK.h(1+d),BL)}</g>`).join('')+p.dot(1,15,BL)+
 T(420,50,'Δt (초)',{fill:MU})+T(560,50,'평균 속도 (m/s)',{fill:MU})+rows.map((r,i)=>`<g class="${i<3?'dvf-turn'+(i===2?' dvf-last':''):''}" ${i<3?`style="animation-delay:${i*1.6}s"`:''}>${i<3?`<rect x="412" y="${62+i*30}" width="270" height="26" rx="4" fill="none" stroke="${OR}"/>`:''}</g>`+T(420,80+i*30,F(r.dt,2))+T(560,80+i*30,F(r.avg,2),{b:1})).join('')+T(420,206,'Δt → 0이면 다가가는 값(극한): 10 m/s',{fill:OR,b:1}))};
}
function tangent(){
 const p=rocket(),sx=300/4,sy=180/24,ang=m=>-Math.atan(m*sy/sx)*180/Math.PI,x=p.X(1),y=p.Y(15);
 return {caption:'둘째 점을 첫째 점 쪽으로 끌어오면 주황 할선이 돌아서 접선에 다가갑니다. 그 접선의 기울기 10 m/s가 1초에서의 미분계수입니다.',
 svg:svg('할선이 접점을 중심으로 돌아 접선이 되는 그림',p.axes('t (초)','높이 h (m)')+p.curve(RK.h)+
 `<path class="dvf-swing" style="--a0:${ang(2.5).toFixed(1)}deg;--a1:${ang(10).toFixed(1)}deg;transform-origin:${x}px ${y}px" d="M${x-70} ${y}H${x+100}" stroke="${OR}" stroke-width="2.8"/>`+p.dot(1,15,BL)+
 T(420,60,'할선의 기울기 = 20 − 10a − 5Δt',{b:1})+T(420,90,'a = 1초, Δt = 1.5초: 2.5 m/s')+T(420,116,'a = 1초, Δt = 0.5초: 7.5 m/s')+T(420,142,'a = 1초, Δt = 0.01초: 9.95 m/s')+T(420,178,'Δt → 0: 접선의 기울기 h′(1) = 10 m/s',{fill:OR,b:1})+T(420,204,'접선: y = 15 + 10(t − 1)',{fill:MU}))};
}
function func(){
 const p=plot(60,24,280,90,0,4,0,24),q=plot(60,150,280,76,0,4,-22,22),ts=[0.5,2,3.5];
 return {caption:'위 그래프의 세 점에서 잰 접선의 기울기 15, 0, −15를 같은 시각의 아래 그래프에 찍으면 도함수 h′(t) = 20 − 10t의 직선 위에 놓입니다.',
 svg:svg('높이 그래프의 접선 기울기를 아래 그래프에 옮겨 찍어 도함수 직선을 그리는 그림',p.axes('','높이 h (m)')+p.curve(RK.h)+q.axes('t (초)','기울기 h′ (m/s)')+`<path d="M${q.X(0)} ${q.Y(0)}H${q.X(4)}" stroke="${MU}" stroke-dasharray="4 4"/>`+q.curve(RK.v,BL,0,4,'class="dvf-draw"')+
 ts.map((t,i)=>`<g class="dvf-seq" style="animation-delay:${i*1.2}s">${p.line(t,RK.h(t),RK.v(t),t-0.45,t+0.45)}${p.dot(t,RK.h(t))}<path d="M${p.X(t)} ${p.Y(RK.h(t))}V${q.Y(RK.v(t))}" stroke="${OR}" stroke-dasharray="3 4"/>${q.dot(t,RK.v(t))}</g>`).join('')+
 T(400,50,'위: 원래 함수 h(t)의 그래프',{fill:AC,b:1})+T(400,76,'주황 선: 그 점의 접선')+T(400,150,'아래: 도함수 h′(t)의 그래프',{fill:BL,b:1})+T(400,176,'높이가 아니라 위 그래프의 기울기')+ts.map((t,i)=>T(400+i*100,206,`t = ${t}: ${F(RK.v(t),0)}`,{fill:OR})).join(''))};
}
function squareArt(ox,oy,k,x,dx,l){
 const W=x*k,d=dx*k,r=(a,b,w,h,f,cls='',st='')=>`<rect x="${a}" y="${b}" width="${w}" height="${h}" fill="${f}" fill-opacity=".85" stroke="var(--bg)" class="${cls}" style="${st}"/>`;
 return r(ox,oy+d,W,W,AC)+r(ox+W,oy+d,d,W,OR,'dvf-seq')+r(ox,oy,W,d,l.top||OR,'dvf-seq','animation-delay:1.2s')+r(ox+W,oy,d,d,MU,'dvf-seq','animation-delay:2.4s')+
 T(ox+W/2,oy+d+W+18,l.x,{a:'middle'})+T(ox+W+d/2,oy+d+W+18,l.dx,{a:'middle',fill:OR})+T(ox+W/2,oy+d+W/2+5,l.in,{a:'middle',fill:'var(--bg)',b:1})+T(ox-8,oy+d+W/2+5,l.y||'',{a:'end'});
}
function power(){
 const a=M.powerPieces(2,3,1),b=M.powerPieces(2,3,0.1);
 return {caption:`한 변이 x인 정사각형의 한 변을 dx 늘리면 x·dx짜리 띠 두 개와 dx²짜리 모서리 조각이 붙습니다. x = 3, dx = 1이면 늘어난 넓이 ${F(a.exact,0)} 가운데 띠가 ${F(a.slabs,0)}입니다.`,
 svg:svg('정사각형 x²에 띠 두 개와 모서리 조각이 덧붙는 그림',squareArt(70,28,44,3,1,{x:'x = 3',dx:'dx',in:'x²'})+
 T(330,56,'(x + dx)² − x² = 2x·dx + dx²',{b:1})+T(330,90,'띠 두 개: 2 × x·dx',{fill:OR})+T(330,116,'모서리 조각: dx²',{fill:MU})+T(330,152,`dx = 1: 늘어난 넓이 ÷ dx = ${F(a.ratio,0)}`)+T(330,178,`dx = 0.1: 늘어난 넓이 ÷ dx = ${F(b.ratio,1)}`)+T(330,212,`dx → 0: 2x = ${F(a.rule,0)}만 남는다`,{fill:OR,b:1}))};
}
function product(){
 return {caption:'가로 u, 세로 v인 직사각형이 자라면 오른쪽 띠 v·Δu와 위쪽 띠 u·Δv가 붙습니다. 모서리 조각 Δu·Δv는 Δt가 작아질수록 띠보다 훨씬 빨리 작아집니다.',
 svg:svg('직사각형 u×v에 오른쪽 띠, 위쪽 띠, 모서리 조각이 덧붙는 그림',squareArt(80,34,40,3.4,1,{x:'u',dx:'Δu',in:'u·v',y:'v',top:BL})+
 T(340,56,'늘어난 넓이 = v·Δu + u·Δv + Δu·Δv',{b:1})+T(340,92,'오른쪽 띠: v·Δu  →  Δt로 나누면 u′v',{fill:OR})+T(340,118,'위쪽 띠: u·Δv  →  Δt로 나누면 uv′',{fill:BL})+T(340,144,'모서리 조각: Δu·Δv  →  0',{fill:MU})+T(340,190,'(u·v)′ = u′v + uv′',{fill:OR,b:1})+T(340,216,'u′v′는 모서리 조각의 식이다',{fill:MU}))};
}
function chain(){
 const b=M.balloon(2,0.5),box=(x,t1,t2,c)=>`<rect x="${x}" y="70" width="130" height="80" rx="10" fill="var(--panel2)" stroke="${c}" stroke-width="2.5"/>${T(x+65,102,t1,{a:'middle',b:1})}${T(x+65,128,t2,{a:'middle',fill:MU})}`;
 const arrow=(x,t,c,delay)=>`<path d="M${x} 110h96" stroke="${MU}" stroke-width="2"/><path d="M${x+96} 110l-8 -5v10z" fill="${MU}"/><circle class="dvf-pkt" style="--dx:92px;animation-delay:${delay}s" cx="${x+2}" cy="110" r="6" fill="${c}"/>${T(x+48,96,t,{a:'middle',fill:c,b:1})}`;
 return {caption:`시간이 반지름을, 반지름이 부피를 바꿉니다. 반지름 ${F(b.r,0)} cm에서 두 변화율 ${F(b.drdt,1)} cm/초와 ${F(b.dVdr,1)} cm³/cm를 곱한 ${F(b.dVdt,1)} cm³/초가 부피의 변화율입니다.`,
 svg:svg('시간 t가 반지름 r을 정하고 r이 부피 V를 정할 때 두 변화율을 곱하는 그림',box(40,'시간 t','2초',MU)+arrow(170,`× ${F(b.drdt,1)}`,BL,0)+box(270,'반지름 r',`${F(b.r,0)} cm`,BL)+arrow(400,`× ${F(b.dVdr,1)}`,OR,1.2)+box(500,'부피 V',`${F(b.V,1)} cm³`,OR)+
 T(220,174,'dr/dt (cm/초)',{a:'middle',fill:BL})+T(450,174,'dV/dr = 4πr² (cm³/cm)',{a:'middle',fill:OR})+T(360,216,`dV/dt = dV/dr × dr/dt = ${F(b.dVdr,1)} × ${F(b.drdt,1)} = ${F(b.dVdt,1)} cm³/초`,{a:'middle',b:1}))};
}
function transcendental(){
 const cx=130,cy=125,r=84,p=plot(400,40,250,150,-2,2,0,8),e=M.expBase(Math.E,1);
 return {caption:'왼쪽: 원 위를 도는 점의 높이가 sin θ이고, 점이 움직이는 방향(주황 화살표)의 세로 성분이 그 변화율 cos θ입니다. 오른쪽: eˣ은 어느 점에서나 접선의 기울기가 함숫값과 같습니다.',
 svg:svg('단위원 위를 도는 점과 움직이는 방향의 화살표, 그리고 e의 x제곱 그래프와 접선',`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--line)" stroke-width="2"/><path d="M${cx-r-12} ${cy}H${cx+r+12}M${cx} ${cy-r-12}V${cy+r+12}" stroke="${MU}"/><g class="dvf-spin" style="transform-origin:${cx}px ${cy}px"><path d="M${cx} ${cy}H${cx+r}" stroke="${TX}" stroke-width="2"/><path d="M${cx+r} ${cy}v-46" stroke="${OR}" stroke-width="3"/><path d="M${cx+r} ${cy-54}l-5 9h10z" fill="${OR}"/><circle cx="${cx+r}" cy="${cy}" r="6" fill="${AC}"/></g>`+
 T(cx,236,'높이 = sin θ, 높이의 변화율 = cos θ',{a:'middle'})+p.axes('x','eˣ')+p.curve(Math.exp,AC,-2,2)+p.line(1,e.f,e.d,0.3,1.7)+p.dot(1,e.f)+p.line(0,1,1,-0.8,0.8)+p.dot(0,1)+
 T(p.X(1)-12,p.Y(e.f)-42,`x = 1: 값 ${F(e.f,2)}, 기울기 ${F(e.d,2)}`,{a:'end',fill:OR})+T(p.X(0)-10,p.Y(1)-26,'x = 0: 값 1, 기울기 1',{a:'end',fill:OR})+T(525,236,'(eˣ)′ = eˣ',{a:'middle',b:1}))};
}
function shape(){
 const Fn=M.FUNCS.cubic,p=plot(60,30,330,170,-2.2,2.2,-4,4),band=(a,b,c,t)=>`<rect x="${p.X(a)}" y="206" width="${p.X(b)-p.X(a)}" height="18" fill="${c}" fill-opacity=".25"/>${T((p.X(a)+p.X(b))/2,220,t,{a:'middle',b:1})}`;
 return {caption:'f(x) = x³ − 3x는 f′이 양수인 구간에서 오르고 음수인 구간에서 내려갑니다. f′의 부호가 +에서 −로 바뀌는 x = −1에서 극대, −에서 +로 바뀌는 x = 1에서 극소입니다.',
 svg:svg('삼차함수 그래프와 도함수의 부호 띠, 극대와 극소에서의 수평 접선',p.axes('','f(x) = x³ − 3x')+`<path d="M${p.X(-2.2)} ${p.Y(0)}H${p.X(2.2)}" stroke="${MU}" stroke-dasharray="4 4"/>`+p.curve(Fn.f)+
 p.line(-1,2,0,-1.6,-0.4,OR,'class="dvf-seq"')+p.line(1,-2,0,0.4,1.6,OR,'class="dvf-seq" style="animation-delay:1.6s"')+p.dot(-1,2)+p.dot(1,-2)+T(p.X(-1),p.Y(2)-12,'극대 2',{a:'middle',fill:OR,b:1})+T(p.X(1),p.Y(-2)+24,'극소 −2',{a:'middle',fill:OR,b:1})+
 band(-2.2,-1,AC,'f′ > 0 증가')+band(-1,1,OR,'f′ < 0 감소')+band(1,2.2,AC,'f′ > 0 증가')+
 T(430,60,'f′(x) = 3x² − 3 = 0  →  x = −1, 1',{b:1})+T(430,96,'x = −1: f′이 +에서 −로 → 극대',{fill:OR})+T(430,122,'x = 1: f′이 −에서 +로 → 극소',{fill:OR})+T(430,158,'f″(x) = 6x',{b:1})+T(430,184,'x < 0: 위로 볼록(∩)')+T(430,208,'x > 0: 아래로 볼록(∪)'))};
}
function optimize(){
 const V=x=>M.box(x,30,30).V,p=plot(380,36,290,160,0,15,0,2600),xs=[2,5,10];
 const net=(ox,x,i)=>{const k=2.6,s=30*k,c=x*k;return `<g class="dvf-seq" style="animation-delay:${i*1.4}s"><rect x="${ox}" y="60" width="${s}" height="${s}" fill="${AC}" fill-opacity=".25" stroke="${AC}"/>${[[0,0],[s-c,0],[0,s-c],[s-c,s-c]].map(([a,b])=>`<rect x="${ox+a}" y="${60+b}" width="${c}" height="${c}" fill="var(--bg)" stroke="${OR}" stroke-dasharray="3 3"/>`).join('')}${T(ox+s/2,60+s+18,`x = ${x}`,{a:'middle'})}${T(ox+s/2,60+s+38,`${F(V(x),0)} cm³`,{a:'middle',fill:x===5?OR:TX,b:x===5})}</g>`;};
 return {caption:`30 cm 종이의 귀퉁이를 2, 5, 10 cm씩 잘라 낸 전개도와 부피입니다. 부피 그래프의 접선이 수평인 x = 5 cm에서 ${F(V(5),0)} cm³로 가장 큽니다.`,
 svg:svg('귀퉁이를 잘라 낸 종이 세 장과 자르는 길이에 따른 부피 그래프',xs.map((x,i)=>net(20+i*106,x,i)).join('')+T(20,40,'점선: 잘라 낼 귀퉁이',{fill:OR})+p.axes('자르는 길이 x (cm)','부피 V (cm³)')+p.curve(V)+p.line(5,V(5),0,3,7)+xs.map((x,i)=>`<g class="dvf-seq" style="animation-delay:${i*1.4}s">${p.dot(x,V(x),x===5?OR:BL)}</g>`).join('')+T(p.X(5),p.Y(V(5))-12,'V′(5) = 0',{a:'middle',fill:OR,b:1}))};
}
function linear(){
 const A=M.APPROX.sqrt,p=plot(60,30,330,170,9,49,3,7.4),xs=[26,36,49];
 return {caption:`√x를 x = 25에서 그은 접선으로 어림하면 x = 26에서는 차이가 ${F(M.linearApprox('sqrt',26).error,3)}뿐이지만 x = 36에서는 ${F(M.linearApprox('sqrt',36).error,1)}, x = 49에서는 ${F(M.linearApprox('sqrt',49).error,1)}로 벌어집니다.`,
 svg:svg('제곱근 곡선과 x = 25에서 그은 접선, 멀어질수록 벌어지는 차이',p.axes('x','√x와 접선')+p.curve(A.f)+p.line(25,5,0.1,9,49)+p.dot(25,5,MU,6)+
 xs.map((x,i)=>{const r=M.linearApprox('sqrt',x);return `<g class="dvf-seq" style="animation-delay:${i*1.3}s"><path d="M${p.X(x)} ${p.Y(r.f)}V${p.Y(r.L)}" stroke="${BL}" stroke-width="4"/></g>`;}).join('')+T(p.X(25)+8,p.Y(5)+34,'기준점 (25, 5)',{fill:MU})+
 T(430,56,'L(x) = 5 + 0.1(x − 25)',{b:1,fill:OR})+xs.map((x,i)=>{const r=M.linearApprox('sqrt',x);return T(430,92+i*28,`x = ${x}: 어림 ${F(r.L,1)}, 실제 ${F(r.f,3)}`);}).join('')+T(430,188,'파란 선: 어림값과 실제 값의 차이',{fill:BL})+T(430,212,'기준점에서 멀수록 차이가 커진다',{fill:MU}))};
}
function final(){
 const k=9,rs=[2.5,M.canBest(1).r,5];
 const can=(cx,r,i)=>{const c=M.can(r,1),w=r*k,h=c.h*k,base=184,best=i===1;return `<g${best?' class="dvf-pulse-soft"':''}><path d="M${cx-w} ${base-h}V${base}A${w} ${w*0.3} 0 0 0 ${cx+w} ${base}V${base-h}" fill="${AC}" fill-opacity="${best?.9:.45}" stroke="var(--bg)"/><ellipse cx="${cx}" cy="${base-h}" rx="${w}" ry="${w*0.3}" fill="${OR}" fill-opacity="${best?1:.6}" stroke="var(--bg)"/></g>${T(cx,216,`r = ${F(r,2)}, h = ${F(c.h,2)}`,{a:'middle'})}${T(cx,236,`S = ${F(c.cost,1)} cm²`,{a:'middle',fill:best?OR:TX,b:best})}`;};
 return {caption:`부피가 330 mL로 같은 캔 세 개를 같은 축척으로 그렸습니다. 가늘고 긴 캔은 옆면이, 굵고 낮은 캔은 뚜껑과 바닥이 넓어서, 그 사이의 r ≈ ${F(rs[1],2)} cm에서 겉넓이가 가장 작습니다.`,
 svg:svg('부피가 같은 세 캔: 가늘고 긴 캔, 겉넓이가 가장 작은 캔, 굵고 낮은 캔',can(90,rs[0],0)+can(250,rs[1],1)+can(430,rs[2],2)+T(540,70,'S(r) = 2πr² + 660/r',{b:1})+T(540,100,'주황: 뚜껑과 바닥 2πr²',{fill:OR})+T(540,126,'강조색: 옆면 660/r',{fill:AC})+T(540,166,'S′(r) = 0인 r에서',{b:1})+T(540,190,'겉넓이가 가장 작다',{b:1}))};
}
const all={average,limit,tangent,function:func,power,product,chain,transcendental,shape,optimize,linear,final};
return {render:id=>all[id]?all[id]():null,ids:Object.keys(all)};
})();
