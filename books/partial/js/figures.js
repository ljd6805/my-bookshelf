/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 그림 속 숫자와 곡면은 모두 DXMath로 계산한다. */
window.DXFigures=(()=>{
'use strict';
const M=DXMath,U=DXUI,W=M.WINDOW,A='var(--accent)',T='var(--text)',MU='var(--muted)';
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||T}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke=MU,cls='fig-dash',w=2)=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const turn=(body,i)=>blink(body,i*1.2,i?'fig-turn':'fig-turn fig-first');
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const f2=(n,d=2)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:false});
const H={svg,t,box,line,dot,blink,turn,grow,pulse};
const F={};
/* 왼쪽 320px 칸에 들어가는 카페 손실 곡면. extra는 DXUI.surfaceBody의 선·점·면 */
const FRAME={scale:98,cx:170,cy:178,height:0.8};
const bowl=(extra,yaw=-35,pitch=28)=>U.surfaceBody({f:M.loss,win:W,yaw,pitch,n:16,axes:['w','b','L'],frame:FRAME,...extra});
const at=(w,b,L,yaw=-35,pitch=28)=>{const [u,v,z]=M.unit(w,b,L,W);return M.project(u,v,z,yaw,pitch,FRAME);};
const span=(a,b,n=24)=>Array.from({length:n+1},(_,i)=>a+(b-a)*i/n);

F.slope=()=>{
 const X=w=>60+w*65,Y=L=>270-L*0.8,L=w=>M.loss(w,M.B0),hs=[3,2,1,0.2],w0=2,L0=L(w0),ex=M.secant(w0,1).exact;
 let b=line('M60 270H590M60 270V25',MU,'')+`<polyline class="fig-draw" points="${span(0,8,60).map(w=>`${X(w).toFixed(1)},${Y(L(w)).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--blue)" stroke-width="3"/>`;
 b+=`<path d="M${X(w0-1)} ${Y(L0-ex)}L${X(w0+1.6)} ${Y(L0+ex*1.6)}" stroke="${A}" stroke-width="3" stroke-dasharray="7 5"/>`;
 hs.forEach((h,i)=>{const r=M.secant(w0,h);b+=turn(`<path d="M${X(w0-0.6)} ${Y(L0-r.slope*0.6)}L${X(w0+h+0.6)} ${Y(r.L1+r.slope*0.6)}" stroke="var(--orange)" stroke-width="3"/><circle cx="${X(w0+h)}" cy="${Y(r.L1)}" r="6" fill="var(--orange)"/>`+t(430,60,`간격 h = ${h}`,{size:15,w:700})+t(430,84,`두 점을 이은 선의 기울기 ${f2(r.slope)}`,{size:14,fill:'var(--orange)'}),i);});
 b+=`<circle cx="${X(w0)}" cy="${Y(L0)}" r="6" fill="${T}"/>`+t(430,112,`접선의 기울기 ${f2(ex)}`,{size:14,fill:A})+t(590,292,'w →',{a:'end',size:13,fill:MU})+t(64,18,'L',{a:'start',size:13,fill:MU})+t(X(w0),Y(L0)+24,'w = 2',{size:13,fill:MU});
 return {svg:svg('손실 곡선 위의 w = 2인 점에서, 두 번째 점을 차츰 가까이 옮기면 두 점을 이은 선이 점선으로 그린 접선에 가까워지는 모습',b),caption:`절편을 b = 12로 고정한 카페 손실 곡선입니다. 간격 h가 3, 2, 1, 0.2로 줄면 두 점을 이은 선의 기울기는 ${hs.map(h=>f2(M.secant(w0,h).slope)).join(', ')}로 바뀌며 접선의 기울기 ${f2(ex)}에 가까워집니다.`};
};

F.partial=()=>{
 const w=2,bb=12,sw=M.slice(w,bb,'w'),sb=M.slice(w,bb,'b'),L=sw.value,X0=400,X1=610,Y=v=>250-v*0.62;
 const curveW=span(0,8).map(x=>[x,bb,M.loss(x,bb)]),curveB=span(8,16).map(y=>[w,y,M.loss(w,y)]);
 let b=bowl({dots:[[w,bb,L,A,6]]});
 const side=(isW,i)=>{const pts=isW?span(0,8,40).map(x=>[X0+(x/8)*(X1-X0),Y(M.loss(x,bb))]):span(8,16,40).map(y=>[X0+((y-8)/8)*(X1-X0),Y(M.loss(w,y))]),s=isW?sw:sb,px=isW?X0+(w/8)*(X1-X0):X0+((bb-8)/8)*(X1-X0),k=isW?(X1-X0)/8:(X1-X0)/8,d=isW?0.9:2.2;
  const wall=isW?[[0,bb,0],[8,bb,0],[8,bb,W.z[1]],[0,bb,W.z[1]]]:[[w,8,0],[w,16,0],[w,16,W.z[1]],[w,8,W.z[1]]],P=p=>{const q=at(...p);return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;};
  return turn(`<polygon points="${wall.map(P).join(' ')}" fill="${T}" fill-opacity=".13" stroke="${T}" stroke-opacity=".5"/><polyline points="${(isW?curveW:curveB).map(P).join(' ')}" fill="none" stroke="${T}" stroke-width="4"/>`+
   `<polyline points="${pts.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${T}" stroke-width="3"/><path d="M${px-d*k} ${Y(L-s.slope*d)}L${px+d*k} ${Y(L+s.slope*d)}" stroke="${A}" stroke-width="3.5"/><circle cx="${px}" cy="${Y(L)}" r="6" fill="${A}"/>`+
   t(505,36,isW?'b = 12로 고정하고 자른 단면':'w = 2로 고정하고 자른 단면',{size:14,w:700})+t(505,58,isW?`∂L/∂w = ${f2(s.slope)}`:`∂L/∂b = ${f2(s.slope)}`,{size:15,fill:A,w:700})+t(X1,278,isW?'w →':'b →',{a:'end',size:13,fill:MU}),i);};
 b+=line(`M${X0} 250H${X1}M${X0} 250V70`,MU,'')+[true,false,true,false].map(side).join('')+t(X0+4,84,'L',{a:'start',size:13,fill:MU})+pulse(at(w,bb,L).x,at(w,bb,L).y,11,A);
 return {svg:svg('왼쪽은 손실 곡면을 세로 면으로 자르는 모습, 오른쪽은 잘린 단면 곡선과 그 접선. b를 고정한 단면과 w를 고정한 단면이 번갈아 나타납니다',b),caption:`같은 점 (w, b) = (2, 12)에서 곡면을 두 방향으로 자른 단면입니다. b를 고정한 단면의 기울기는 ${f2(sw.slope)}, w를 고정한 단면의 기울기는 ${f2(sb.slope)}로, 한 점에 편미분이 변수마다 하나씩 있습니다. 곡면과 단면은 카페 기록으로 계산했습니다.`};
};

F.rules=()=>{
 let b=box(200,20,240,56,'var(--blue)')+t(320,55,'f(x, y) = x²·y',{size:20,w:700});
 b+=line('M270 76L170 130',MU)+line('M370 76L470 130',MU)+dot(270,76,-100,54,A,0)+dot(370,76,100,54,A,1.2);
 b+=box(40,130,260,130,A)+t(170,158,'x로 편미분',{size:15,w:700})+blink(t(170,186,'y는 상수로 둠',{size:14,fill:'var(--orange)'}),0)+t(170,214,'(상수)·x²  →  (상수)·2x',{size:14,fill:MU})+t(170,244,'∂f/∂x = 2xy',{size:18,w:700,fill:A});
 b+=box(340,130,260,130,A)+t(470,158,'y로 편미분',{size:15,w:700})+blink(t(470,186,'x²은 상수로 둠',{size:14,fill:'var(--orange)'}),2.4)+t(470,214,'(상수)·y  →  (상수)·1',{size:14,fill:MU})+t(470,244,'∂f/∂y = x²',{size:18,w:700,fill:A});
 const r=M.partials('mixed',1,-1.5);
 b+=t(320,286,`(x, y) = (1, −1.5)에서 ∂f/∂x = ${f2(r.fx)}, ∂f/∂y = ${f2(r.fy)}`,{size:14,fill:MU});
 return {svg:svg('f(x, y) = x²·y를 x로 편미분할 때는 y를 상수로 두고, y로 편미분할 때는 x²을 상수로 두어 변수 하나인 미분 규칙을 쓰는 과정',b),caption:'편미분은 새 규칙이 아니라, 움직이지 않는 변수를 상수로 묶어 두고 변수 하나일 때의 미분 규칙을 그대로 쓰는 계산입니다. 아래 숫자는 (1, −1.5)에서 계산한 값입니다.'};
};

F.plane=()=>{
 const w=2,bb=12,dw=0.5,db=1,r=M.planeEstimate(w,bb,dw,db),P=(x,y)=>r.L+r.gw*(x-w)+r.gb*(y-bb),s=1.3;
 const patch=[[w-s,bb-s],[w+s,bb-s],[w+s,bb+s],[w-s,bb+s]].map(([x,y])=>[x,y,P(x,y)]);
 let b=bowl({polys:[{pts:patch,fill:A,opacity:.4}],lines:[{pts:[[w+dw,bb+db,r.L+r.estimate],[w+dw,bb+db,r.L+r.actual]],color:T,width:3,dash:'3 3'}],dots:[[w,bb,r.L,T,6],[w+dw,bb+db,r.L+r.actual,T,5],[w+dw,bb+db,r.L+r.estimate,A,6]]});
 const q=at(w,bb,r.L);b+=pulse(q.x,q.y,11,A);
 b+=t(390,50,'Δw = 0.5, Δb = 1 만큼 움직이면',{a:'start',size:14,w:700});
 [['w 몫  ∂L/∂w·Δw',r.partW,'var(--blue)'],['b 몫  ∂L/∂b·Δb',r.partB,'var(--blue)'],['더한 어림',r.estimate,A],['실제 변화',r.actual,'var(--orange)']].forEach(([n,v,c],i)=>{const y=78+i*50;b+=t(390,y,n,{a:'start',size:13,fill:MU})+grow(390,y+8,Math.abs(v)*4,16,c,i*0.5)+t(394+Math.abs(v)*4,y+21,f2(v),{a:'start',size:14,w:700});});
 return {svg:svg('왼쪽은 손실 곡면의 한 점에 닿는 분홍 접평면과, 조금 옮긴 자리에서 접평면 위의 어림 점과 곡면 위의 실제 점. 오른쪽은 w 몫과 b 몫을 더한 어림과 실제 변화를 견준 막대',b),caption:`(2, 12)에서 접평면은 곡면에 닿아 있다가 멀어질수록 벌어집니다. Δw = 0.5, Δb = 1이면 두 몫 ${f2(r.partW)}와 ${f2(r.partB)}를 더한 어림은 ${f2(r.estimate)}, 실제 변화는 ${f2(r.actual)}입니다. 손실 식으로 계산한 값입니다.`};
};

F.gradient=()=>{
 const w=6,bb=14,g=M.grad(w,bb),k=0.02,z=M.loss(w,bb),P=(x,y)=>at(x,y,z,0,90),p0=P(w,bb),p1=P(w+g.gw*k,bb),p2=P(w+g.gw*k,bb+g.gb*k),n=P(w-g.gw*k*1.6,bb-g.gb*k*1.6);
 let b=bowl({},0,90);
 b+=`<path class="fig-draw" d="M${p0.x} ${p0.y}L${p1.x} ${p1.y}" stroke="${T}" stroke-width="3" fill="none"/><path class="fig-draw" style="animation-delay:.8s" d="M${p1.x} ${p1.y}L${p2.x} ${p2.y}" stroke="${T}" stroke-width="3" fill="none"/>`;
 b+=`<path class="fig-draw" style="animation-delay:1.6s" d="M${p0.x} ${p0.y}L${p2.x} ${p2.y}" stroke="${A}" stroke-width="4.5" fill="none"/>`+line(`M${p0.x} ${p0.y}L${n.x} ${n.y}`,A,'fig-dash',3)+dot(p0.x,p0.y,n.x-p0.x,n.y-p0.y,A,0,6)+`<circle cx="${p0.x}" cy="${p0.y}" r="6" fill="${T}"/>`;
 b+=t(390,60,'(w, b) = (6, 14)에서',{a:'start',size:15,w:700})+t(390,92,`∂L/∂w = ${f2(g.gw)}  → 가로 화살표`,{a:'start',size:14})+t(390,118,`∂L/∂b = ${f2(g.gb)}  → 세로 화살표`,{a:'start',size:14})+t(390,152,`∇L = (${f2(g.gw)}, ${f2(g.gb)})`,{a:'start',size:16,w:700,fill:A})+t(390,178,`크기 ${f2(g.norm)}`,{a:'start',size:14,fill:MU})+t(390,222,'점선: 반대쪽 −∇L',{a:'start',size:14,fill:A})+t(390,246,'손실이 가장 빨리 줄어드는 방향',{a:'start',size:13,fill:MU});
 return {svg:svg('손실 곡면을 위에서 본 지도 위에서, 가로 방향 편미분과 세로 방향 편미분을 이어 붙여 기울기 벡터 화살표를 만들고, 그 반대쪽으로 점이 움직이는 모습',b),caption:`위에서 본 지도에서 색띠의 경계가 등고선입니다. 편미분 두 개를 가로·세로 성분으로 이어 붙이면 기울기 벡터가 되고, 이 벡터는 등고선에 수직입니다. 화살표 길이는 실제 값의 0.02배로 줄여 그렸습니다.`};
};

F.descent=()=>{
 const r=M.walk(1,9,0.02,12),pts=r.path.map(p=>[p.w,p.b,p.L]),frames=[0,1,2,12];
 let b=bowl({lines:[{pts,color:T,width:3,cls:'fig-draw'}]});
 frames.forEach((k,i)=>{const p=r.path[k],q=at(p.w,p.b,p.L);b+=turn(`<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="8" fill="${A}" stroke="var(--bg)" stroke-width="2"/>`+t(390,70,`${k}걸음`,{a:'start',size:18,w:700})+t(390,104,`(w, b) = (${f2(p.w)}, ${f2(p.b)})`,{a:'start',size:15})+t(390,132,`손실 L = ${f2(p.L)}`,{a:'start',size:15,fill:A,w:700}),i);});
 b+=t(390,186,'w ← w − η·∂L/∂w',{a:'start',size:14,fill:MU})+t(390,210,'b ← b − η·∂L/∂b',{a:'start',size:14,fill:MU})+t(390,244,'η = 0.02, 출발 (1, 9)',{a:'start',size:13,fill:MU});
 return {svg:svg('손실 곡면 위에서 출발점 (1, 9)의 점이 기울기 반대쪽으로 한 걸음씩 옮겨 가 골짜기에 닿는 모습과 걸음마다의 손실',b),caption:`학습률 0.02로 실제 계산한 길입니다. 손실은 ${f2(r.path[0].L)}에서 한 걸음 만에 ${f2(r.path[1].L)}, 두 걸음에 ${f2(r.path[2].L)}로 줄고, 그 뒤로는 골짜기를 따라 천천히 내려가 12걸음 뒤 ${f2(r.path[12].L)}입니다.`};
};

F.chain=()=>{
 const r=M.chainSimple(2),xs=[90,320,550];
 let b=['x = 2','y = 3x = 6','z = y² = 36'].map((s,i)=>box(xs[i]-80,30,160,54,'var(--blue)')+t(xs[i],63,s,{size:17,w:700})).join('');
 b+=line('M170 57H240',MU)+line('M400 57H470',MU)+dot(170,57,70,0,A,0)+dot(400,57,70,0,A,1.2)+t(205,44,'× 3',{size:15,fill:A,w:700})+t(435,44,`× ${r.outer}`,{size:15,fill:A,w:700});
 [['x를 0.1 늘리면',0.1,'var(--blue)',0],['y는 0.3 늘고 (3배)',r.dy,'var(--blue)',0.8],[`z는 약 ${f2(r.estimate,1)} 늘어남 (다시 ${r.outer}배)`,r.estimate,A,1.6]].forEach(([n,v,c,d],i)=>{const y=128+i*48;b+=t(60,y,n,{a:'start',size:14,fill:MU})+grow(60,y+8,v*110,18,c,d)+t(66+v*110,y+23,f2(v,1),{a:'start',size:14,w:700});});
 b+=t(320,286,`dz/dx = ${r.outer} × 3 = ${r.slope} · 실제로는 0.1 늘릴 때 z가 ${f2(r.dz)} 늘어납니다`,{size:14,fill:MU});
 return {svg:svg('x에서 y로 3배, y에서 z로 12배로 이어지는 두 단계에서, x의 작은 변화 0.1이 y에서 0.3, z에서 약 3.6으로 커지는 막대',b),caption:`y = 3x, z = y²에서 x = 2일 때의 변화입니다. 단계마다의 변화율 3과 ${r.outer}를 곱한 ${r.slope}이 x에 대한 z의 변화율이고, 0.1을 늘렸을 때의 실제 변화 ${f2(r.dz)}는 어림 ${f2(r.estimate,1)}에 가깝습니다.`};
};

F.graph=()=>{
 const r=M.neuron(0.8),N=[[70,60,'x','1.5'],[70,150,'w','0.8'],[70,240,'b','−0.5'],[250,150,'z = w·x + b',f2(r.z)],[410,150,'a = σ(z)',f2(r.a,3)],[570,150,'L = (a − 1)²',f2(r.L,3)]];
 let b=line('M110 60L196 138',MU,'')+line('M110 150H196',MU,'')+line('M110 240L196 162',MU,'')+line('M304 150H356',MU,'')+line('M464 150H512',MU,'');
 b+=dot(110,150,86,0,'var(--blue)',0)+dot(304,150,52,0,'var(--blue)',0.5)+dot(464,150,48,0,'var(--blue)',1);
 b+=dot(512,166,-48,0,A,1.6)+dot(356,166,-52,0,A,2.1)+dot(196,166,-86,0,A,2.6);
 b+=N.map(([x,y,n,v],i)=>box(x-(i<3?40:54),y-26,i<3?80:108,52,'var(--blue)')+t(x,y-5,n,{size:12.5,fill:MU})+t(x,y+15,v,{size:15,w:700})).join('');
 b+=t(488,196,`2(a − 1) = ${f2(r.dLda,3)}`,{size:12.5,fill:A})+t(330,196,`a(1 − a) = ${f2(r.dadz,3)}`,{size:12.5,fill:A})+t(150,196,'x = 1.5',{size:12.5,fill:A});
 b+=t(320,278,`뒤에서부터 곱하면 ∂L/∂w = ${f2(r.dLda,3)} × ${f2(r.dadz,3)} × 1.5 = ${f2(r.dLdw,4)}`,{size:14,w:700})+t(320,26,'파란 점: 값을 앞으로 계산 · 분홍 점: 기울기를 뒤로 곱해 감',{size:13,fill:MU});
 return {svg:svg('입력 x, 가중치 w, 편향 b에서 z, a, L로 이어지는 계산 그래프. 파란 점은 값을 오른쪽으로, 분홍 점은 기울기를 왼쪽으로 나릅니다',b),caption:`w = 0.8인 뉴런 하나의 계산 그래프입니다. 화살표 아래의 분홍 숫자가 연산마다의 국소 미분이고, 출력 쪽에서부터 세 개를 곱한 ${f2(r.dLdw,4)}가 w의 기울기입니다. 실제 계산한 값입니다.`};
};

F.branch=()=>{
 const r=M.pathSum(3,8),ys=[70,150,230],days=[5,6,7];
 let b=box(40,124,90,52,'var(--blue)')+t(85,147,'w',{size:13,fill:MU})+t(85,166,'3.0',{size:15,w:700})+box(510,124,100,52,'var(--blue)')+t(560,147,'평균 손실 L',{size:13,fill:MU})+t(560,166,f2(M.loss(3,12)),{size:15,w:700});
 days.forEach((d,i)=>{const y=ys[i],p=r.parts[d];b+=line(`M130 150L230 ${y}`,MU,'')+line(`M410 ${y}L510 150`,MU,'')+box(230,y-28,180,56,A)+t(320,y-6,`${d+1}일째 오차² (x = ${p.x})`,{size:13,fill:MU})+t(320,y+15,`몫 ${f2(p.c)}`,{size:15,w:700,fill:A})+dot(510,150,-100,y-150,A,i*0.5)+dot(230,y,-100,150-y,A,1.4+i*0.5);});
 b+=pulse(85,150,40,A)+t(85,206,'경로마다의 몫을',{size:13,fill:MU})+t(85,224,'더한다',{size:13,fill:MU})+t(320,286,`여덟 날의 몫을 모두 더하면 ∂L/∂w = ${f2(r.total)} (그림은 6~8일째만 표시)`,{size:14,w:700});
 return {svg:svg('가중치 w 하나가 날마다의 오차 제곱에 한 번씩 쓰여 여러 갈래로 갈라졌다가 평균 손실에서 만나고, 기울기는 갈래마다 거꾸로 와서 w에서 더해지는 모습',b),caption:`w = 3, b = 12일 때 w는 여덟 날의 계산에 한 번씩 쓰입니다. 날마다의 몫 ${r.parts.map(p=>f2(p.c,1)).join(', ')}을 모두 더한 ${f2(r.total)}가 평균 손실의 편미분 ∂L/∂w입니다. 실제 계산한 값입니다.`};
};

F.deep=()=>{
 const n=6,r=M.deepChain('sigmoid',1,n),xs=i=>60+i*92;
 let b='';
 for(let i=0;i<n;i++){const x=xs(i),len=Math.max(3,84*(Math.log10(r.running[i])+5)/5);
  b+=box(x,50,74,54,'var(--blue)')+t(x+37,72,`${i+1}층`,{size:13,fill:MU})+t(x+37,92,`×${f2(r.factors[i],3)}`,{size:14,w:700})+(i<n-1?line(`M${x+74} 77H${x+92}`,MU,''):'')+grow(x,150,len,22,A,(n-1-i)*0.45)+t(x+37,196,r.running[i]<0.01?r.running[i].toExponential(1):f2(r.running[i],3),{size:13,w:700});}
 b+=dot(xs(n-1)+37,128,-(xs(n-1)-xs(0)),0,A,0,6)+t(320,28,'층 하나를 거슬러 갈 때마다 곱해지는 값 w·σ′(z)',{size:14,fill:MU})+t(320,226,'↑ 출력에서 그 층의 입력까지 곱해 온 값 (막대는 로그 눈금)',{size:13,fill:MU})+t(320,272,`6층을 모두 거슬러 가면 처음 기울기의 ${r.product.toExponential(1)}배`,{size:15,w:700,fill:A});
 return {svg:svg('여섯 층이 한 줄로 이어진 계산에서, 출력 쪽에서 입력 쪽으로 갈수록 곱해 온 값을 나타내는 막대가 짧아지는 모습',b),caption:`시그모이드 층 여섯 개(w = 1, 입력 0.5)를 실제로 계산했습니다. 층마다 ${f2(r.factors[0],3)} 안팎의 값이 곱해져 첫 층에 닿는 기울기는 ${r.product.toExponential(1)}배가 됩니다. 연쇄 법칙의 곱이 길어질 때 생기는 기울기 소실입니다.`};
};

F.final=()=>{
 const r=M.audit('x1'),P={x1:[80,100],x2:[80,210],h1:[260,100],h2:[260,210],o:[440,155]},E=[['x1','h1'],['x1','h2'],['x2','h1'],['x2','h2'],['h1','o'],['h2','o']];
 let b=E.map(([a,c])=>line(`M${P[a][0]+30} ${P[a][1]}L${P[c][0]-30} ${P[c][1]}`,'var(--line)','')).join('');
 const path=(h,i,val)=>turn(`<path d="M110 100L${P[h][0]-30} ${P[h][1]}M${P[h][0]+30} ${P[h][1]}L410 155" stroke="${A}" stroke-width="5" fill="none"/>`+t(545,120,`${h==='h1'?'h₁':'h₂'}을 지나는 경로`,{size:14,w:700})+t(545,146,`몫 ${f2(val,5)}`,{size:15,fill:A,w:700}),i);
 b+=path('h1',0,r.delta*r.p1)+path('h2',1,r.delta*r.p2)+path('h1',2,r.delta*r.p1)+path('h2',3,r.delta*r.p2);
 b+=[['x1','x₁','1'],['x2','x₂','0.5'],['h1','h₁',f2(r.h[0],3)],['h2','h₂',f2(r.h[1],3)],['o','o',f2(r.o,3)]].map(([k,n,v])=>`<circle cx="${P[k][0]}" cy="${P[k][1]}" r="30" fill="var(--panel2)" stroke="var(--blue)" stroke-width="2"/>`+t(P[k][0],P[k][1]-4,n,{size:13,fill:MU})+t(P[k][0],P[k][1]+14,v,{size:14,w:700})).join('');
 b+=t(545,196,'두 경로의 몫을 더하면',{size:13,fill:MU})+t(545,222,`∂L/∂x₁ = ${f2(r.correct,5)}`,{size:15,w:700})+t(320,286,'경로 안에서는 국소 미분을 곱하고, 경로끼리는 더합니다',{size:14,fill:MU});
 return {svg:svg('입력 둘, 은닉 뉴런 둘, 출력 하나인 망에서 입력 x₁이 출력에 닿는 두 경로가 번갈아 굵게 표시되고, 경로마다의 몫과 그 합이 적힌 그림',b),caption:`마지막 과제의 2-2-1 망입니다. x₁에서 손실까지는 h₁을 지나는 경로와 h₂를 지나는 경로가 있고, 두 몫 ${f2(r.delta*r.p1,5)}와 ${f2(r.delta*r.p2,5)}를 더한 ${f2(r.correct,5)}가 ∂L/∂x₁입니다. 고정한 가중치로 실제 계산했습니다.`};
};
function render(c){return F[c.id](H);}
return {render,F,H};
})();
