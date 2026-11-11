/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 NCMath로 계산한다. */
window.NCFigures=(()=>{
'use strict';
const M=NCMath;
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const turn=(body,i)=>blink(body,i*1.2,i?'fig-turn':'fig-turn fig-first');
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
/* 실선은 fig-draw로 그려지며 나타나고, 점선은 fig-seq로 깜박이며 나타난다(fig-draw가 점선 무늬를 덮어쓰므로). */
const draw=(pts,color,w=3,dash='')=>{const P=pts.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ');return dash?blink(`<polyline points="${P}" fill="none" stroke="${color}" stroke-width="${w}" stroke-dasharray="${dash}"/>`,0.4):`<polyline class="fig-draw" pathLength="1000" points="${P}" fill="none" stroke="${color}" stroke-width="${w}"/>`;};
const f2=(n,d=2)=>Number(n).toFixed(d);
const H={svg,t,box,line,dot,blink,turn,grow,pulse,draw};
const F={};

/* 네 모서리 점과 학습 중 움직이는 경계선. 경계선 위치는 퍼셉트론 학습 기록에서 계산한다. */
function square(ox,oy,s,labels){let b=box(ox,oy,s,s,'var(--line)','var(--chart)',6);
 M.CORNERS.forEach(([a,c],i)=>{const x=ox+20+a*(s-40),y=oy+s-20-c*(s-40);b+=`<circle cx="${x}" cy="${y}" r="11" fill="${labels[i]?'var(--accent)':'var(--panel)'}" stroke="var(--accent)" stroke-width="2.5"/>`+t(x,y+5,labels[i],{size:13,fill:labels[i]?'var(--bg)':'var(--text)'});});return b;}
function boundary(ox,oy,s,w,bb){const X=v=>ox+20+v*(s-40),Y=v=>oy+s-20-v*(s-40);
 if(Math.abs(w[1])<1e-9){const x0=-bb/(w[0]||1e-9);return `M${X(x0)} ${oy}V${oy+s}`;}
 const y=x=>(-bb-w[0]*x)/w[1];return `M${X(-0.3)} ${Y(y(-0.3))}L${X(1.3)} ${Y(y(1.3))}`;}
F.perceptron=()=>{
 const r=M.perceptron('AND',8),frames=[1,2,4,7].map(e=>r.hist[e]);let b=`<defs><clipPath id="ncf-clip"><rect x="40" y="40" width="220" height="220"/></clipPath></defs>`+square(40,40,220,M.GATES.AND);
 b+=`<g clip-path="url(#ncf-clip)">`+frames.map((h,i)=>turn(`<path d="${boundary(40,40,220,h.w,h.b)}" stroke="var(--orange)" stroke-width="3" fill="none"/>`,i)).join('')+'</g>';
 frames.forEach((h,i)=>b+=turn(t(150,285,`AND · ${[1,2,4,7][i]+1}회 학습 · 틀린 점 ${h.errors}개`,{size:14,fill:'var(--muted)'}),i));
 b+=square(380,40,220,M.GATES.XOR)+`<path d="M400 160L580 120M400 120L580 200" stroke="var(--orange)" stroke-width="2.5" stroke-dasharray="6 6" opacity=".55"/>`+pulse(490,150,22,'var(--orange)')+t(490,156,'?',{size:20,w:700,fill:'var(--orange)'});
 b+=t(490,285,'XOR · 어떤 직선도 1과 0을 가르지 못함',{size:14,fill:'var(--muted)'})+t(150,26,'선형 분리 가능',{size:14,w:700})+t(490,26,'선형 분리 불가능',{size:14,w:700});
 return {svg:svg('왼쪽은 AND 네 점에서 학습할수록 경계선이 옮겨 가 0과 1을 가르는 모습, 오른쪽은 XOR 네 점을 어떤 직선도 가르지 못하는 모습',b),caption:`왼쪽 경계선은 퍼셉트론 학습 규칙(η = 0.1)을 실제로 돌린 기록에서 그렸고, ${r.convergedAt}회째 학습에서 틀린 점이 0이 됩니다. 오른쪽 XOR은 선을 어떻게 그어도 같은 쪽에 1과 0이 섞입니다.`};
};
F.forward=()=>{
 const R=M.xorForward(20),ins=[110,190],hid=[110,190];let b='';
 ins.forEach(y1=>hid.forEach(y2=>b+=line(`M110 ${y1}L290 ${y2}`,'var(--line)','')));hid.forEach(y=>b+=line(`M290 ${y}L470 150`,'var(--line)',''));
 ins.forEach((y,i)=>{b+=dot(110,y,180,hid[1-i]-y,'var(--blue)',i*.3,5)+dot(290,hid[i],180,150-hid[i],'var(--accent)',1.2+i*.3,5);});
 ins.forEach((y,i)=>b+=`<circle cx="110" cy="${y}" r="24" fill="var(--panel2)" stroke="var(--blue)" stroke-width="2"/>`+t(110,y+5,'x'+(i+1),{size:15}));
 [['OR',hid[0]],['NAND',hid[1]]].forEach(([n,y])=>b+=`<circle cx="290" cy="${y}" r="30" fill="var(--panel2)" stroke="var(--accent)" stroke-width="2"/>`+t(290,y+5,n,{size:14,w:700}));
 b+=`<circle cx="470" cy="150" r="30" fill="var(--panel2)" stroke="var(--orange)" stroke-width="2"/>`+t(470,155,'AND',{size:14,w:700});
 b+=t(110,250,'입력 (2,)',{size:13,fill:'var(--muted)'})+t(290,250,'은닉 σ(W₁x+b₁) (2,)',{size:13,fill:'var(--muted)'})+t(470,214,'출력 (1,)',{size:13,fill:'var(--muted)'});
 b+=box(520,40,110,150,'var(--line)','var(--chart)',8)+t(575,62,'x → ŷ',{size:13,fill:'var(--muted)'});
 R.forEach((r,i)=>b+=blink(t(575,88+i*26,`${r.x.join('')} → ${f2(r.out)}`,{size:14}),i*.5));
 b+=t(320,288,'k = 20일 때 출력은 0, 1, 1, 0에 가까워진다 (실제 계산)',{size:14,fill:'var(--muted)'});
 return {svg:svg('입력 두 개가 OR와 NAND 은닉 뉴런을 거쳐 AND 출력 뉴런으로 가며 XOR을 계산하는 2-2-1 망',b),caption:'손으로 정한 2-2-1 망에서 은닉층이 OR와 NAND라는 새 특징을 만들고, 출력이 둘의 AND를 계산해 XOR이 됩니다. 오른쪽 숫자는 시그모이드로 실제 계산한 출력이고, 움직이는 점은 계산 순서를 보여 주는 표시입니다.'};
};
F.backprop=()=>{
 const c=M.chain(0.8),xs=[14,176,330,484],W=[120,130,130,130],labels=[['z = w·x + b',f2(c.z)],['a = σ(z)',f2(c.a)],['L = (a − y)²',f2(c.L,3)]];let b='';
 b+=box(14,115,120,60,'var(--blue)')+t(74,140,'w = 0.80',{size:14})+t(74,163,'x 1.5 · b −0.5',{size:13,fill:'var(--muted)'});
 labels.forEach(([n,v],i)=>{const x=xs[i+1];b+=box(x,115,130,60,i===2?'var(--orange)':'var(--accent)')+t(x+65,140,n,{size:14})+t(x+65,164,v,{size:15,w:700,fill:'var(--accent)'});});
 for(let i=0;i<3;i++){const e=xs[i]+W[i],gap=xs[i+1]-e;b+=line(`M${e} 135H${xs[i+1]}`,'var(--blue)')+dot(e,135,gap,0,'var(--blue)',i*.5,5)+line(`M${xs[i+1]} 158H${e}`,'var(--orange)')+dot(xs[i+1],158,-gap,0,'var(--orange)',1.6+(2-i)*.5,5);}
 const g=[['dL/da',c.dLda],['da/dz',c.dadz],['dz/dw = x',1.5]];
 g.reverse().forEach(([n,v],i)=>{const x=[176,330,484][i];b+=blink(box(x,205,130,48,'var(--orange)','var(--chart)',6)+t(x+65,225,n,{size:13,fill:'var(--muted)'})+t(x+65,245,f2(v,3),{size:15,w:700,fill:'var(--orange)'}),1.6+(2-i)*.5);});
 b+=t(320,40,'순전파: 값을 계산해 저장 →',{size:14,fill:'var(--blue)'})+t(320,70,`← 역전파: 국소 기울기를 곱함 · dL/dw = ${f2(c.dLda,3)} × ${f2(c.dadz,3)} × 1.5 = ${f2(c.dLdw,3)}`,{size:14,fill:'var(--orange)'});
 b+=t(320,285,`수치 미분과 비교: ${f2(c.numeric,5)} (실제 계산)`,{size:14,fill:'var(--muted)'});
 return {svg:svg('뉴런 하나의 계산 그래프에서 값은 왼쪽에서 오른쪽으로, 기울기는 오른쪽에서 왼쪽으로 흐르며 국소 기울기 세 개를 곱해 dL/dw를 구하는 그림',b),caption:'w = 0.8인 뉴런 하나를 실제로 계산했습니다. 파란 점은 순전파의 값, 주황 점은 역전파의 기울기가 흐르는 방향이며, 아래 세 칸의 국소 기울기를 곱한 값이 수치 미분과 맞습니다.'};
};
F.activation=()=>{
 const X=z=>60+(z+4)*50,Y=v=>230-v*90,pts=n=>Array.from({length:81},(_,i)=>{const z=-4+i*0.1;return [X(z),Y(M.act(n,z))];}).filter(p=>p[1]>20);
 let b=`<path d="M60 230H460M260 30V270" stroke="var(--line)"/>`+t(470,234,'z',{size:13,fill:'var(--muted)'});
 [['sigmoid','var(--blue)',0],['relu','var(--accent)',.5],['gelu','var(--orange)',1]].forEach(([n,c,d],i)=>{b+=`<g style="animation-delay:${d}s" class="fig-seq">${draw(pts(n),c)}</g>`+t(520,80+i*40,{sigmoid:'시그모이드',relu:'ReLU',gelu:'GELU'}[n],{size:15,w:700,fill:c,a:'start'});});
 const ds=[['시그모이드 최대 기울기',M.dact('sigmoid',0)],['ReLU 양수 쪽 기울기',M.dact('relu',2)],['GELU z = 2 기울기',M.dact('gelu',2)]];
 ds.forEach(([n,v],i)=>b+=t(480,200+i*28,`${n} ${f2(v)}`,{size:13,fill:'var(--muted)',a:'start'}));
 b+=pulse(X(0),Y(0.5),9,'var(--blue)')+`<path d="M60 140H460" stroke="var(--line)" stroke-dasharray="4 5"/>`+t(52,145,'1',{size:13,fill:'var(--muted)',a:'end'})+t(52,235,'0',{size:13,fill:'var(--muted)',a:'end'})+t(260,290,'가로 z는 −4에서 4, 점선은 높이 1',{size:13,fill:'var(--muted)'});
 return {svg:svg('시그모이드, ReLU, GELU 세 활성화 함수의 모양과 대표 기울기',b),caption:'세 곡선은 실제 함수 값으로 그렸습니다. 시그모이드는 양 끝이 평평해 기울기가 최대 0.25이고, ReLU와 GELU는 양수 쪽에서 기울기가 1 근처로 유지됩니다.'};
};
/* 1장: 숫자 하나에서 축이 하나씩 늘어 텐서가 되는 과정 */
F.tensor=()=>{
 const cell=(x,y,c='var(--accent)')=>`<rect x="${x}" y="${y}" width="22" height="22" rx="3" fill="var(--panel2)" stroke="${c}" stroke-width="1.5"/>`;
 const gridAt=(x,y,rows,cols,c)=>{let s='';for(let r=0;r<rows;r++)for(let k=0;k<cols;k++)s+=cell(x+k*25,y+r*25,c);return s;};
 const items=[['스칼라','( )','축 0개',gridAt(49,128,1,1,'var(--blue)')],['벡터','(4,)','축 1개',gridAt(151,128,1,4,'var(--blue)')],['행렬','(3, 4)','축 2개',gridAt(301,103,3,4,'var(--accent)')],['3차원 텐서','(2, 3, 4)','축 3개',gridAt(477,91,3,4,'var(--orange)')+gridAt(465,103,3,4,'var(--accent)')]];
 let b='';
 items.forEach(([n,sh,ax,g],i)=>{const cx=[60,200,350,520][i];b+=blink(g,i*.9)+t(cx,56,n,{size:15,w:700})+t(cx,216,sh,{size:16,w:700,fill:'var(--accent)'})+t(cx,240,ax,{size:13,fill:'var(--muted)'});});
 [110,262,418].forEach((x,i)=>b+=line(`M${x} 140h24`,'var(--muted)')+dot(x,140,24,0,'var(--orange)',i*.9,4));
 b+=t(320,282,'축이 하나 늘 때마다 모양에 숫자가 하나 더 붙는다',{size:14,fill:'var(--muted)'});
 return {svg:svg('숫자 하나, 숫자 네 개의 줄, 3행 4열의 표, 표 두 장을 겹친 3차원 텐서가 차례로 나타나며 모양이 ( ), (4,), (3, 4), (2, 3, 4)로 늘어나는 그림',b),caption:'축이 늘어날 때마다 모양에 숫자가 하나씩 더 붙습니다. (2, 3, 4)는 3행 4열의 표가 두 장 있다는 뜻이고 원소는 2 × 3 × 4 = 24개입니다. 칸의 수는 예시이고, 차례로 밝아지는 것은 읽는 순서를 나타냅니다.'};
};
/* 2장: 카페 8일 기록 위에서 선을 바꿀 때마다 오차와 MSE가 달라진다 */
F.loss=()=>{
 const D=M.LINE,X=x=>70+(x+0.5)*45,Y=y=>260-y*4.6,frames=[[2,8],[3,12],[4,12],[5,12]];
 let b=`<path d="M70 260H430M70 30V260" stroke="var(--line)"/>`+t(430,284,'기온 − 20 (℃)',{size:13,fill:'var(--muted)',a:'end'})+t(64,38,'잔',{size:13,fill:'var(--muted)',a:'end'});
 b+=`<defs><clipPath id="ncf-loss"><rect x="70" y="30" width="360" height="230"/></clipPath></defs><g clip-path="url(#ncf-loss)">`;
 frames.forEach(([w,c],i)=>{let g=`<path d="M${X(-0.5)} ${Y(c-0.5*w)}L${X(7.5)} ${Y(c+7.5*w)}" stroke="var(--accent)" stroke-width="3" fill="none"/>`;
  D.x.forEach((x,k)=>g+=`<path d="M${X(x)} ${Y(D.y[k])}V${Y(w*x+c)}" stroke="var(--orange)" stroke-width="2.5"/>`);b+=turn(g,i);});
 b+='</g>'+D.x.map((x,k)=>`<circle cx="${X(x)}" cy="${Y(D.y[k])}" r="6" fill="var(--blue)" stroke="var(--bg)" stroke-width="1.5"/>`).join('');
 b+=box(452,60,178,150,'var(--line)','var(--chart)',8);
 frames.forEach(([w,c],i)=>{const l=M.lineLoss(w,c);b+=turn(t(541,92,`ŷ = ${w}x + ${c}`,{size:15,w:700})+t(541,126,`MSE ${f2(l.mse)}`,{size:15,fill:'var(--orange)'})+t(541,152,`MAE ${f2(l.mae)}`,{size:14,fill:'var(--muted)'})+t(541,178,`RMSE ${f2(l.rmse)}잔`,{size:14,fill:'var(--muted)'}),i);});
 b+=t(541,240,'주황 선분 = 날마다의 오차',{size:13,fill:'var(--muted)'});
 return {svg:svg('카페 8일 기록의 점 여덟 개 위에서 예측선이 네 가지로 바뀌고, 그때마다 점에서 선까지의 오차 선분과 MSE, MAE, RMSE 값이 함께 바뀌는 그림',b),caption:'같은 여덟 점에 선 네 개를 차례로 그어 손실을 실제로 계산했습니다. 주황 선분이 짧아질수록 손실이 작아지며, ŷ = 4x + 12에서 MSE가 1.50으로 넷 가운데 가장 작습니다.'};
};
/* 3장: 손실 포물선 위를 학습률 0.02로 걷는 길 */
F.descent=()=>{
 const L=w=>M.lineLoss(w,12).mse,X=w=>70+(w+1)*45,Y=v=>250-v*0.72,r=M.slopeWalk(0,0.02,5),ws=Array.from({length:81},(_,i)=>-1+i*0.1);
 let b=`<path d="M70 250H430M70 30V250" stroke="var(--line)"/>`+t(430,276,'기울기 w (b = 12 고정)',{size:13,fill:'var(--muted)',a:'end'})+t(64,38,'MSE',{size:13,fill:'var(--muted)',a:'end'});
 b+=draw(ws.map(w=>[X(w),Math.max(30,Y(L(w)))]),'var(--accent)');
 r.path.forEach((w,i)=>{b+=blink(`<circle cx="${X(w)}" cy="${Y(L(w))}" r="7" fill="var(--orange)"/>`+t(X(w)+(i?0:-12),Y(L(w))-14,`${f2(w)}`,{size:13,fill:'var(--orange)',a:i?'middle':'end'}),i*.6);});
 for(let i=0;i<2;i++){const a=r.path[i],c=r.path[i+1];b+=dot(X(a),Y(L(a)),X(c)-X(a),Y(L(c))-Y(L(a)),'var(--orange)',i*.6,5);}
 b+=box(452,50,178,170,'var(--line)','var(--chart)',8)+t(541,78,'η = 0.02, 5걸음',{size:14,w:700});
 r.path.slice(0,5).forEach((w,i)=>b+=blink(t(541,104+i*24,`w ${f2(w)} · 기울기 ${f2(M.lineGrad(w,12).gw,1)}`,{size:13,fill:'var(--muted)'}),i*.6));
 b+=t(250,292,'기울기가 작아질수록 걸음도 짧아진다 (실제 계산)',{size:14,fill:'var(--muted)'});
 return {svg:svg('손실 포물선 위에서 w가 0에서 출발해 학습률 0.02로 다섯 걸음 걸으며 최솟값 3.96 쪽으로 다가가는 그림',b),caption:`카페 기록에서 b를 12로 두고 w = 0에서 출발한 다섯 걸음을 실제로 계산했습니다. 첫 걸음은 기울기 −138.75에 0.02를 곱한 2.78만큼 가고, 최솟값에 가까워질수록 기울기와 걸음이 함께 작아져 ${f2(r.path[5])}에 닿습니다.`};
};
/* 8장: 네 구조가 가중치를 다시 쓰는 방식 */
F.architectures=()=>{
 const im=M.archParams('image',28),sq=M.archParams('sequence',12),int=n=>n.toLocaleString('en-US');let b='';
 const panel=(x,title,sub)=>box(x,34,148,224,'var(--line)','var(--chart)',8)+t(x+74,58,title,{size:14,w:700})+t(x+74,246,sub,{size:12,fill:'var(--muted)'});
 b+=panel(6,'완전 연결',`28×28 → 64: ${int(im.dense)}개`);
 [90,120,150,180].forEach(y1=>[105,135,165].forEach(y2=>b+=line(`M40 ${y1}L120 ${y2}`,'var(--line)','')));
 [90,120,150,180].forEach(y=>b+=`<circle cx="40" cy="${y}" r="7" fill="var(--blue)"/>`);[105,135,165].forEach(y=>b+=`<circle cx="120" cy="${y}" r="8" fill="var(--accent)"/>`);
 b+=dot(40,90,80,15,'var(--orange)',0,4)+dot(40,180,80,-15,'var(--orange)',.4,4)+t(80,212,'모든 입력 × 모든 뉴런',{size:12,fill:'var(--muted)'});
 b+=panel(164,'합성곱',`3×3 필터 64개: ${int(im.conv)}개`);
 for(let r=0;r<5;r++)for(let c=0;c<5;c++)b+=`<rect x="${188+c*20}" y="${82+r*20}" width="18" height="18" rx="2" fill="var(--panel2)" stroke="var(--line)"/>`;
 b+=`<rect class="fig-pkt fig-slow" style="--dx:40px;--dy:40px" x="187" y="81" width="60" height="60" rx="3" fill="none" stroke="var(--orange)" stroke-width="3"/>`+t(238,212,'같은 필터를 자리마다',{size:12,fill:'var(--muted)'});
 b+=panel(322,'순환',`은닉 64: ${int(sq.rnn)}개`);
 [0,1,2].forEach(i=>{const x=340+i*40;b+=box(x,116,30,30,'var(--accent)','var(--panel2)',5)+t(x+15,172,`x${i+1}`,{size:12,fill:'var(--muted)'})+line(`M${x+15} 160V148`,'var(--blue)','');if(i<2)b+=line(`M${x+30} 131h10`,'var(--orange)')+dot(x+30,131,10,0,'var(--orange)',i*.5,4);});
 b+=t(396,212,'같은 층을 시점마다',{size:12,fill:'var(--muted)'});
 b+=panel(480,'어텐션',`벡터 길이 32: ${int(sq.attention)}개`);
 [0,1,2,3].forEach(i=>b+=`<rect x="${498+i*30}" y="150" width="24" height="22" rx="4" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.5"/>`);
 [[0,3],[1,3],[2,3],[0,2]].forEach(([a,c],i)=>{const x1=510+a*30,x2=510+c*30;b+=blink(`<path d="M${x1} 150Q${(x1+x2)/2} ${150-(c-a)*22} ${x2} 150" fill="none" stroke="var(--orange)" stroke-width="2"/>`,i*.5);});
 b+=t(554,212,'토큰끼리 직접 비교',{size:12,fill:'var(--muted)'});
 b+=t(320,286,'구조마다 다시 쓰는 가중치가 다르다 (파라미터 수는 식으로 계산)',{size:14,fill:'var(--muted)'});
 return {svg:svg('완전 연결, 합성곱, 순환, 어텐션 네 구조를 나란히 놓고 각각 입력을 잇는 방식과 첫 층 파라미터 수를 보이는 그림',b),caption:'네 구조가 입력을 잇는 방식을 나란히 그렸습니다. 합성곱은 주황 필터를 자리마다 옮겨 쓰고, 순환은 같은 층을 시점마다 쓰며, 어텐션은 토큰끼리 호로 잇습니다. 숫자는 28×28 흑백 이미지와 12 토큰 문장에 대해 식으로 센 첫 층 파라미터 수이고, 움직임은 계산 순서를 나타내는 표시입니다.'};
};
/* 마지막 과제: 선 하나와 은닉 뉴런 8개의 판별 지도 */
F.final=()=>{
 const runs=[['선 하나',M.train({depth:0,lr:1,epochs:600,seed:1}),'tanh'],['tanh 은닉 뉴런 8개',M.train({width:8,act:'tanh',lr:1,epochs:600,seed:1}),'tanh']];let b='';
 runs.forEach(([name,r,a],k)=>{const ox=40+k*310,n=14,c=200/n,g=M.decisionGrid(r.net,a,n);let m='';
  g.forEach((row,i)=>row.forEach((p,j)=>m+=`<rect x="${ox+j*c}" y="${50+i*c}" width="${c+.4}" height="${c+.4}" fill="${p>=0.5?'var(--accent)':'var(--blue)'}" opacity="${(0.15+Math.abs(p-0.5)*0.7).toFixed(2)}"/>`));
  b+=blink(m,k*1.2)+`<circle cx="${ox+100}" cy="150" r="80" fill="none" stroke="var(--text)" stroke-width="2" stroke-dasharray="6 5"/>`;
  r.data.X.slice(0,40).forEach((p,i)=>b+=`<circle cx="${(ox+100+p[0]*100).toFixed(1)}" cy="${(150-p[1]*100).toFixed(1)}" r="3.5" fill="${r.data.Y[i]?'var(--accent)':'var(--blue)'}" stroke="var(--bg)"/>`);
  b+=t(ox+100,34,name,{size:15,w:700})+t(ox+100,274,`학습 ${f2(r.trainAcc*100,1)}% · 새 점 ${f2(r.valAcc*100,1)}%`,{size:14,fill:'var(--muted)'});});
 b+=line('M262 150h60','var(--orange)')+dot(262,150,60,0,'var(--orange)',0,5)+t(292,136,'은닉층',{size:13,fill:'var(--orange)'});
 return {svg:svg('왼쪽은 선 하나로 학습한 판별 지도가 평면을 둘로만 나누는 모습, 오른쪽은 tanh 은닉 뉴런 8개로 학습한 판별 지도가 점선 원을 따라 굽는 모습',b),caption:'같은 점 80개로 두 설계를 실제로 학습시킨 판별 지도입니다(η = 1, 600 epoch, 시드 1, 점은 40개만 표시). 초록은 원 안, 파랑은 원 밖으로 판단한 영역이고 점선이 실제 원입니다. 은닉층을 넣으면 경계가 원을 따라 굽습니다.'};
};
function render(c){return F[c.id](H);}
return {render,F,H};
})();
