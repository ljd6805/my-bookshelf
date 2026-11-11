/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 좌표와 숫자는 ELMath로 실제로 계산해 그린다.
   3차원 장면은 정해진 각도에서 비스듬히 내려다본 평행 투영이다(실험의 그림판처럼 돌릴 수는 없다).
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다. */
window.ELFigures=(()=>{
'use strict';
const M=ELMath,U=ELUI,num=U.num,vec=U.vec;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const A='var(--accent)',B='var(--blue)',O='var(--orange)',G='var(--muted)',T='var(--text)';
const svg=(label,body,h=280)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||14}" fill="${o.fill||T}"${o.w?` font-weight="${o.w}"`:''}>${esc(s)}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const pkt=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const seq=(i,body)=>`<g class="fig-seq" style="animation-delay:${(i*0.8).toFixed(1)}s">${body}</g>`;
const f=n=>n.toFixed(1);
/* 2차원 화살표. cls에 fig-draw를 주면 그려지는 움직임이 붙는다. */
function arrow(p,q,color,o={}){
 const len=Math.hypot(q[0]-p[0],q[1]-p[1])||1,ux=(q[0]-p[0])/len,uy=(q[1]-p[1])/len,h=Math.min(11,len*.4),bx=q[0]-ux*h,by=q[1]-uy*h;
 return `<g${o.opacity?` opacity="${o.opacity}"`:''}><path${o.cls?` class="${o.cls}"`:''} d="M${f(p[0])} ${f(p[1])}L${f(bx)} ${f(by)}" stroke="${color}" stroke-width="${o.width||3}" fill="none"${o.dash?` stroke-dasharray="${o.dash}"`:''} stroke-linecap="round"/><polygon points="${f(q[0])},${f(q[1])} ${f(bx-uy*h*.45)},${f(by+ux*h*.45)} ${f(bx+uy*h*.45)},${f(by-ux*h*.45)}" fill="${color}"/></g>`;
}
/* 비스듬히 내려다본 평행 투영: 샷 축은 오른쪽 아래, 우유 축은 왼쪽 아래, 시럽 축은 위. 세 축의 눈금 길이는 화면에서 서로 다르다. */
const iso=(ox,oy,u)=>p=>[ox+(p[0]*.92-p[1]*.6)*u,oy+(p[0]*.26+p[1]*.44)*u-p[2]*u];
function axes(P,n,labels=M.AXES){
 const l=(a,b,c=G,w=1.4,d='')=>`<path d="M${f(P(a)[0])} ${f(P(a)[1])}L${f(P(b)[0])} ${f(P(b)[1])}" stroke="${c}" stroke-width="${w}"${d?` stroke-dasharray="${d}"`:''} fill="none"/>`;
 let g='';for(let k=0;k<=n;k++)g+=l([k,0,0],[k,n,0],'var(--line)',1)+l([0,k,0],[n,k,0],'var(--line)',1);
 const e=n+.5,a=P([e,0,0]),b=P([0,e,0]),c=P([0,0,e]);
 return g+l([0,0,0],[e,0,0])+l([0,0,0],[0,e,0])+l([0,0,0],[0,0,e])+t(a[0]+14,a[1]+12,labels[0],{size:12,fill:G})+t(b[0]-14,b[1]+12,labels[1],{size:12,fill:G})+t(c[0],c[1]-8,labels[2],{size:12,fill:G});
}
const seg=(P,a,b,color,o={})=>`<path${o.cls?` class="${o.cls}"`:''} d="M${f(P(a)[0])} ${f(P(a)[1])}L${f(P(b)[0])} ${f(P(b)[1])}" stroke="${color}" stroke-width="${o.width||2.4}" fill="none"${o.dash?` stroke-dasharray="${o.dash}"`:''}/>`;
const dot3=(P,p,color,label,o={})=>{const q=P(p);return `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${o.r||5}" fill="${color}"/>`+(label?t(q[0]+(o.dx||0),q[1]+(o.dy||-10),label,{size:o.size||12,fill:o.fill||T,a:o.a}):'');};
/* 꼭짓점 여덟 개(EL3D.unitCorners 순서)로 상자의 보이는 세 면과 모서리를 그린다. */
function cube(P,c,color,o={}){
 const face=(ids,fill,op)=>`<polygon points="${ids.map(i=>P(c[i]).map(f).join(',')).join(' ')}" fill="${fill}" fill-opacity="${op}" stroke="${o.stroke||color}" stroke-width="${o.width||1.4}" stroke-linejoin="round"${o.dash?` stroke-dasharray="${o.dash}"`:''}/>`;
 const op=o.opacity??.25;
 return face([0,1,3,2],color,op*.5)+face([0,2,6,4],color,op*.7)+face([0,1,5,4],color,op*.7)+face([1,3,7,5],o.c1||color,op)+face([2,3,7,6],o.c2||color,op)+face([4,5,7,6],o.c3||color,op*1.3);
}
const corners=(Mx,s=1)=>[0,1,2,3,4,5,6,7].map(k=>{const v=[k&1?s:0,k&2?s:0,k&4?s:0];return Mx?M.matVec(Mx,v):v;});
const mat=(x,y,Mx,o={})=>{const cw=o.cw||44,ch=o.ch||26,rows=Mx.length,cols=Mx[0].length;return `<path d="M${x+6} ${y}H${x}V${y+rows*ch}H${x+6}M${x+cols*cw-6} ${y}H${x+cols*cw}V${y+rows*ch}H${x+cols*cw-6}" fill="none" stroke="${o.color||T}" stroke-width="2"/>`+Mx.map((r,i)=>{const row=(o.hi&&o.hi(i)?`<rect x="${x+4}" y="${y+i*ch+2}" width="${cols*cw-8}" height="${ch-4}" rx="4" fill="${A}" fill-opacity=".18"/>`:'')+r.map((v,j)=>t(x+j*cw+cw/2,y+i*ch+ch/2+5,typeof v==='number'?num(v):v,{size:o.size||14})).join('');return o.seq?seq(i,row):row;}).join('');};

const draw={
 vector(){
  const P=iso(210,150,30),la=M.drink('latte').v,va=M.drink('vanilla').v;
  const body=axes(P,4)+seq(0,seg(P,[0,0,0],[2,0,0],A,{width:4}))+seq(1,seg(P,[2,0,0],[2,2,0],B,{width:4}))+seq(2,seg(P,[2,2,0],[2,2,2],O,{width:4}))
   +arrow(P([0,0,0]),P(va),T,{width:3,cls:'fig-draw'})+dot3(P,la,B,`라테 ${vec(la)}`,{dy:22})+dot3(P,va,O,`바닐라라테 ${vec(va)}`,{dy:-12})
   +t(520,70,'① 샷 축으로 2',{fill:A,size:13})+t(520,96,'② 우유 축으로 2',{fill:B,size:13})+t(520,122,'③ 시럽 축으로 2',{fill:O,size:13})+t(520,160,'숫자 세 개 = 점 하나',{size:13,w:700})+t(520,182,'= 원점에서 나간 화살표',{size:13,w:700});
  return {svg:svg(`샷, 우유, 시럽 세 축의 공간에서 원점부터 샷 2, 우유 2, 시럽 2만큼 차례로 가서 바닐라라테 ${vec(va)}에 닿는 길과 화살표. 바닥에는 라테 ${vec(la)}`,body),caption:'숫자 세 개를 축마다 차례로 따라가면 공간의 한 점에 닿습니다. 라테는 바닥 위에, 바닐라라테는 그 점에서 시럽 축으로 2만큼 위에 있습니다.'};
 },
 addscale(){
  const P=iso(210,150,30),la=[2,2,0],sy=[0,0,2],sum=M.add(la,sy);
  const body=axes(P,4)+arrow(P([0,0,0]),P(la),A,{cls:'fig-draw'})+arrow(P(la),P(sum),B,{cls:'fig-draw'})+arrow(P([0,0,0]),P(sum),O,{width:3.4})+arrow(P([0,0,0]),P([0,0,1]),B,{opacity:.6})+arrow(P([0,0,1]),P(sy),B,{opacity:.35,dash:'4 4'})
   +dot3(P,sum,O,`합 ${vec(sum)}`)+t(P(la)[0],P(la)[1]+22,`라테 ${vec(la)}`,{size:12,fill:A})
   +t(520,70,'실수배',{w:700,size:13})+t(520,92,'2 · (0, 0, 1) = (0, 0, 2)',{size:13,fill:B})+t(520,130,'덧셈',{w:700,size:13})+t(520,152,`${vec(la)} + ${vec(sy)}`,{size:13})+t(520,174,`= ${vec(sum)}`,{size:13,fill:O,w:700});
  return {svg:svg(`라테 화살표 ${vec(la)} 끝에 시럽 한 펌프 (0, 0, 1)을 두 배 한 화살표 ${vec(sy)}를 이어 붙여 합 ${vec(sum)}에 닿는 그림`,body),caption:'시럽 한 펌프 벡터를 두 배로 늘인 뒤 라테 화살표 끝에 이어 붙이면 바닐라라테에 닿습니다.'};
 },
 length(){
  const P=iso(210,150,30),la=M.drink('latte').v,fl=M.drink('flat').v,va=M.drink('vanilla').v,mid=(a,b)=>P(M.scale(M.add(a,b),.5));
  const body=axes(P,4)+seg(P,la,va,O,{dash:'6 6',cls:'fig-dash'})+seg(P,la,fl,A,{dash:'6 6',cls:'fig-dash'})+dot3(P,la,T,'라테',{dy:22})+dot3(P,fl,A,'플랫화이트',{dy:22,dx:30})+dot3(P,va,O,'바닐라라테')
   +t(mid(la,va)[0]+34,mid(la,va)[1],`거리 ${num(M.dist(la,va))}`,{fill:O,size:13})+t(mid(la,fl)[0]+10,mid(la,fl)[1]-8,`거리 ${num(M.dist(la,fl))}`,{fill:A,size:13})
   +t(520,80,`(2, 2, 0) − (3, 1, 0)`,{size:13})+t(520,102,'= (−1, 1, 0)',{size:13})+t(520,130,'√(1 + 1 + 0) ≈ 1.41',{size:13,fill:A,w:700})+t(520,170,'라테는 바닐라라테보다',{size:12,fill:G})+t(520,188,'플랫화이트에 가깝습니다',{size:12,fill:G});
  return {svg:svg(`라테에서 플랫화이트까지의 거리 ${num(M.dist(la,fl))}과 바닐라라테까지의 거리 ${num(M.dist(la,va))}를 점선으로 그린 3차원 그림`,body),caption:'두 점을 잇는 선의 길이가 거리입니다. 차이 벡터의 성분을 제곱해 더하고 제곱근을 씌웁니다.'};
 },
 dot(){
  const w=M.RATES.cost.w,x=[2,2,0],tm=M.terms(w,x);
  const body=t(320,30,'라테 한 잔의 원가 = 단가 벡터 · 레시피 벡터',{w:700})+['샷','우유','시럽'].map((n,i)=>seq(i,box(70,50+i*52,500,40,[A,B,O][i])+t(130,76+i*52,n,{size:14,w:700})+t(250,76+i*52,`${num(w[i])}원 × ${num(x[i])}`,{size:14})+t(480,76+i*52,`= ${num(tm[i])}원`,{size:14,a:'end'}))).join('')
   +`<path d="M70 212H570" stroke="${T}" stroke-width="2"/>`+t(130,240,'합 (내적)',{w:700})+t(480,240,`${num(M.dot(w,x))}원`,{w:700,a:'end',fill:O,size:16})+pkt(520,70,0,160,O,0)+pkt(520,122,0,108,O,.8)+pkt(520,174,0,56,O,1.6);
  return {svg:svg(`단가 (500, 300, 100)과 라테 (2, 2, 0)을 같은 자리끼리 곱한 1000, 600, 0을 더해 1600원이 되는 계산서`,body,262),caption:'같은 자리끼리 곱하고 모두 더합니다. 계산서 한 장이 내적 한 번입니다.'};
 },
 neuron(){
  const T0=M.TASTE,x=[2,2,0],z=M.neuron(T0.w,T0.b,x).z;
  const ins=M.AXES.map((n,i)=>box(30,40+i*70,120,46,[A,B,O][i])+t(90,60+i*70,n,{size:12,fill:G})+t(90,78+i*70,num(x[i]),{w:700})+`<path d="M150 ${63+i*70}L290 133" stroke="${G}" stroke-width="1.6" fill="none"/>`+t(215,(63+i*70+133)/2-6,`×${num(T0.w[i])}`,{size:13,fill:[A,B,O][i]})+pkt(150,63+i*70,140,70-i*70,[A,B,O][i],i*.5)).join('');
  const body=ins+`<circle cx="330" cy="133" r="40" fill="var(--panel2)" stroke="${T}" stroke-width="2"/>`+t(330,128,'더하기',{size:12,fill:G})+t(330,148,`+ (${num(T0.b)})`,{size:13})
   +`<path d="M370 133H430" stroke="${G}" stroke-width="1.6"/>`+t(400,122,`z = ${num(z)}`,{size:12,fill:O})+box(430,105,90,56,O,'var(--panel2)',8,'fig-pulse')+t(475,138,'f(z)',{w:700})+`<path d="M520 133H570" stroke="${G}" stroke-width="1.6"/>`+t(596,138,'출력',{size:13,w:700})
   +t(330,250,`라테: 1×2 + 0.5×2 + (−1)×0 − 1.5 = ${num(z)} → 0보다 크므로 “좋아함”`,{size:13});
  return {svg:svg(`입력 샷 2, 우유 2, 시럽 0에 가중치 1, 0.5, −1을 곱해 더하고 편향 −1.5를 더한 가중합 ${num(z)}가 활성화 함수를 거쳐 출력이 되는 뉴런 하나`,body,266),caption:'뉴런 하나는 가중합, 편향, 활성화 함수의 세 단계입니다. 3차원 공간에서 가중합이 0인 자리는 실험에서 평면으로 볼 수 있습니다.'};
 },
 matrix(){
  const x=[2,2,0],y=M.matVec(M.MENU,x),names=['원가','열량','카페인'];
  const body=t(320,30,'행마다 내적을 한 번씩',{w:700})+names.map((n,i)=>t(96,84+i*34,n,{size:13,a:'end',fill:G})).join('')+mat(110,62,M.MENU,{cw:56,ch:34,seq:true,hi:()=>true})+t(300,118,'×',{size:20})+mat(326,62,x.map(v=>[v]),{cw:48,ch:34})+t(400,118,'=',{size:20})+mat(426,62,y.map(v=>[v]),{cw:76,ch:34,seq:true,hi:()=>true,color:O})
   +t(194,190,'W (3×3)',{size:12,fill:G})+t(350,190,'x (3)',{size:12,fill:G})+t(464,190,'Wx (3)',{size:12,fill:G})+t(320,232,`라테 ${vec(x)} → 원가 ${num(y[0])}원, 열량 ${num(y[1])} kcal, 카페인 ${num(y[2])} mg`,{size:13});
  return {svg:svg(`원가, 열량, 카페인 세 행으로 된 행렬에 라테 벡터 (2, 2, 0)을 곱해 (1600, 140, 150)이 나오는 계산. 행이 하나씩 차례로 강조된다`,body,250),caption:'행렬의 행 하나가 가중치 벡터 하나입니다. 행마다 레시피와 내적해 출력 하나씩을 만듭니다.'};
 },
 transform(){
  const P1=iso(170,120,54),P2=iso(450,120,54),S=M.TRANSFORMS.stretch.M,I=M.identity(3);
  const basis=(P,Mx)=>[0,1,2].map(j=>arrow(P([0,0,0]),P(M.column(Mx,j)),[A,B,O][j])).join('');
  const body=cube(P1,corners(I),G,{opacity:.3})+basis(P1,I)+t(170,250,'처음: 한 변이 1인 상자',{size:13})+`<path class="fig-dash" d="M262 130H350" stroke="${T}" stroke-width="2" fill="none"/>`+t(306,118,'W를 곱함',{size:12,fill:G})
   +cube(P2,corners(I),G,{opacity:0,dash:'4 4'})+cube(P2,corners(S),A,{opacity:.3})+basis(P2,S)+t(470,250,'샷 축으로 2배: 부피 2배',{size:13})+mat(545,34,S,{cw:26,ch:22,size:12});
  return {svg:svg('한 변이 1인 상자와 세 단위 화살표가 샷 축으로 2배 늘이는 행렬을 거쳐 길어진 상자가 되는 그림. 첫째 화살표 끝이 (2, 0, 0)으로 간다',body,264),caption:'세 단위 화살표의 도착점이 행렬의 세 열입니다. 샷 축 화살표만 (2, 0, 0)으로 가고 나머지는 그대로라 상자가 한쪽으로 늘어납니다.'};
 },
 matmul(){
  const A2=[[2,0],[0,1]],B2=[[0,-1],[1,0]],I=[[1,0],[0,1]],mul2=(X,Y)=>X.map(r=>[r[0]*Y[0][0]+r[1]*Y[1][0],r[0]*Y[0][1]+r[1]*Y[1][1]]);
  const shape=(cx,cy,Mx,color)=>{const u=26,p=v=>[cx+(Mx[0][0]*v[0]+Mx[0][1]*v[1])*u,cy-(Mx[1][0]*v[0]+Mx[1][1]*v[1])*u],pts=[[0,0],[1,0],[1,1],[0,1]].map(p);return `<path d="M${cx-60} ${cy}H${cx+60}M${cx} ${cy-60}V${cy+34}" stroke="var(--line)" stroke-width="1"/><polygon points="${pts.map(q=>q.map(f).join(',')).join(' ')}" fill="${color}" fill-opacity=".3" stroke="${color}" stroke-width="2"/>`+arrow(p([0,0]),p([1,0]),A,{width:2.4});};
  const row=(y,label,steps,names)=>t(54,y-6,label,{size:13,w:700})+steps.map((Mx,i)=>seq(i,shape(170+i*170,y,Mx,i===2?O:B))+(i<2?`<path d="M${232+i*170} ${y-14}H${268+i*170}" stroke="${T}" stroke-width="2"/>`+t(250+i*170,y+20,names[i],{size:11,fill:G}):'')).join('');
  const body=row(86,'BA',[I,A2,mul2(B2,A2)],['A: 2배 늘이기','B: 90° 돌리기'])+row(214,'AB',[I,B2,mul2(A2,B2)],['B: 90° 돌리기','A: 2배 늘이기'])+t(585,40,'세로로 긴 모양',{size:12,fill:O})+t(585,168,'가로로 긴 모양',{size:12,fill:O});
  return {svg:svg('위 줄은 정사각형을 가로로 2배 늘인 뒤 90도 돌려 세로로 긴 직사각형이 되고, 아래 줄은 먼저 돌린 뒤 가로로 늘여 가로로 긴 직사각형이 되는 비교. 평면에서 본 그림',body,262),caption:'같은 두 변환도 순서를 바꾸면 결과가 다릅니다. 보기 쉽게 시럽 축 위에서 내려다본 평면 그림으로 그렸습니다.'};
 },
 shape(){
  const grid=(x,y,m,n,color,label)=>{let s='';for(let i=0;i<m;i++)for(let j=0;j<n;j++)s+=`<rect x="${x+j*22}" y="${y+i*22}" width="19" height="19" rx="3" fill="${color}" fill-opacity=".35" stroke="${color}"/>`;return s+t(x+n*11,y+m*22+18,label,{size:13});};
  const body=t(320,26,'안쪽 두 수가 같아야 곱할 수 있습니다',{w:700})+grid(60,50,6,3,B,'X (6×3)')+t(150,120,'×',{size:20})+grid(180,94,3,2,A,'W₁ᵀ (3×2)')+t(250,120,'=',{size:20})+grid(280,50,6,2,O,'XW₁ᵀ (6×2)')
   +box(390,60,220,110,'var(--line)')+t(500,88,'( 6 × 3 ) ( 3 × 2 )',{size:17,w:700})+`<rect class="fig-pulse" x="462" y="98" width="76" height="4" fill="${A}"/>`+t(500,122,'안쪽 3 = 3 ✓',{size:13,fill:A})+t(500,150,'바깥 6, 2 → 결과 (6×2)',{size:13,fill:O})
   +t(500,200,'음료 6개를 한꺼번에:',{size:12,fill:G})+t(500,218,'한 줄이 음료 하나, 두 칸이 두 뉴런',{size:12,fill:G});
  return {svg:svg('6행 3열 표 X와 3행 2열로 전치한 가중치 행렬을 곱해 6행 2열 결과가 나오는 모양 규칙. 안쪽 두 수 3과 3이 같다',body,240),caption:'(6×3)과 (3×2)는 안쪽 수가 같아 곱할 수 있고, 바깥 수 6과 2가 결과의 모양입니다. W₁(2×3)을 전치하지 않으면 안쪽 수가 3과 2로 달라 곱할 수 없습니다.'};
 },
 tensor(){
  const P=iso(300,150,26),T3=M.orders(),top=Math.max(...T3.flat(2));
  let cells='';for(let i=0;i<2;i++){let layer='';for(let j=5;j>=0;j--)for(let k=2;k>=0;k--){const at=[j*.95,k*1.5,i*3.2],c=[0,1,2,3,4,5,6,7].map(q=>[at[0]+(q&1?.8:0),at[1]+(q&2?.8:0),at[2]+(q&4?.8:0)]);layer=cube(P,c,[A,B,O][k],{opacity:.18+.55*T3[i][j][k]/top,stroke:T,width:.8})+layer;}cells+=seq(i,layer);}
  const body=cells+t(92,70,'축 0: 날 (2)',{size:13,fill:T,w:700})+t(92,92,'위아래로 표 두 장',{size:12,fill:G})+t(540,200,'축 1: 음료 (6)',{size:13,w:700})+t(100,236,'축 2: 재료 (3)',{size:13,w:700})+t(540,60,'모양 (2, 6, 3)',{size:15,w:700,fill:O})+t(540,82,'2 × 6 × 3 = 36개',{size:13});
  return {svg:svg('작은 상자 36개를 날 2층, 음료 6줄, 재료 3칸으로 쌓은 텐서. 색이 진할수록 그날 그 음료에 쓴 그 재료의 양이 많다',body,270),caption:'표 두 장을 포개면 축이 세 개인 텐서가 됩니다. 상자의 진하기는 이 책이 정한 이틀 치 주문 기록에서 계산한 재료 사용량입니다.'};
 },
 inverse(){
  const fit=key=>{const Mx=M.OUTPUTS[key].M,c=corners(null,4).map(p=>M.matVec(Mx,p)),top=[0,1,2].map(i=>Math.max(...c.map(p=>Math.abs(p[i])),1e-9));return c.map(p=>p.map((x,i)=>x/top[i]*2));};
  const panel=(k,x,key,label,color)=>{const P=iso(x,96,34);return axes(P,2,['','',''])+seq(k,cube(P,fit(key),color,{opacity:.3})+t(x,236,label,{size:13,w:700,fill:color}))+t(x,256,M.OUTPUTS[key].name,{size:11,fill:G});};
  const body=panel(0,110,'full','랭크 3: 얇아도 부피가 있음',A)+panel(1,320,'double','랭크 2: 평면 한 장',B)+panel(2,530,'same','랭크 1: 선 하나',O);
  return {svg:svg('레시피 공간의 상자가 세 가지 출력 행렬을 거친 모습. 원가·열량·카페인은 얇지만 부피가 있는 덩어리, 원가·원가의 2배·열량은 평면 한 장, 원가의 배수 셋은 선 하나',body,268),caption:'출력이 부피가 있는 덩어리를 이루면 되돌릴 수 있고, 평면이나 선으로 납작해지면 되돌릴 수 없습니다. 첫째 그림은 우유와 시럽이 원가와 열량을 비슷한 비율로 올려서 얇아 보이지만 부피가 0은 아닙니다. 축마다 가장 큰 값이 같은 길이가 되게 줄여 그렸습니다.'};
 },
 eigen(){
  const R=M.REPEAT.regulars,sq=M.powers(R.M,[50,50],8),ox=90,oy=236,u=2.2,p=v=>[ox+v[0]*u,oy-v[1]*u];
  const body=`<path d="M${ox} ${oy}H330M${ox} 30V${oy}" stroke="${G}" stroke-width="1.4" fill="none"/>`+t(330,oy+18,'라테 단골',{size:12,fill:G,a:'end'})+t(ox+6,26,'아메리카노 단골',{size:12,fill:G,a:'start'})
   +`<path d="M${ox} ${oy}L${p([100,100/3])[0]} ${p([100,100/3])[1]}" stroke="${B}" stroke-dasharray="6 5" stroke-width="1.6"/>`+t(p([100,100/3])[0]+5,p([100,100/3])[1]+4,'고유 방향 (3, 1)',{size:12,fill:B,a:'start'})
   +sq.slice(0,6).map((v,i)=>seq(i,arrow(p([0,0]),p(v),i?A:O,{width:2.6})+(i<3||i===5?t(p(v)[0]+8,p(v)[1]+(i===5?18:-4),`${i}주 ${vec(v,1)}`,{size:11,a:'start'}):''))).join('')
   +t(490,60,'매주 같은 행렬을 곱함',{w:700,size:13})+mat(430,76,R.M,{cw:60,ch:28})+t(490,160,'(50, 50) → (60, 40) → (66, 34)',{size:12})+t(490,182,'→ … → (75, 25)에 다가감',{size:12,fill:O,w:700})+t(490,214,'고윳값 1의 방향만 남습니다',{size:12,fill:G});
  return {svg:svg('라테 단골과 아메리카노 단골 수를 나타내는 벡터가 (50, 50)에서 시작해 매주 행렬을 곱할 때마다 (60, 40), (66, 34)를 거쳐 고유 방향 (75, 25) 쪽으로 눕는 그림',body,262),caption:'같은 행렬을 되풀이해 곱하면 벡터가 고윳값이 가장 큰 고유 방향으로 눕습니다. 단골 이동 비율은 이 책이 정한 값입니다.'};
 },
 jacobian(){
  const x=M.NEWDRINK.v,J=M.layerJacobian(M.NET.W1,M.NET.b1,x),dx=[.5,0,0],dh=M.matVec(J,dx),dy=M.dot(M.NET.w2,dh),g=M.scoreGradient(x);
  const body=t(320,28,`신메뉴 ${vec(x)}에서 샷을 0.5 늘리면`,{w:700})+box(24,60,120,60,A)+t(84,84,'Δx',{size:12,fill:G})+t(84,104,vec(dx),{w:700,size:13})
   +`<path class="fig-dash" d="M144 90H206" stroke="${T}" stroke-width="2" fill="none"/>`+t(175,80,'J 곱',{size:12,fill:G})+box(206,60,150,60,B)+t(281,84,'Δh (진한 맛, 단맛)',{size:12,fill:G})+t(281,104,vec(dh),{w:700,size:13})
   +`<path class="fig-dash" d="M356 90H418" stroke="${T}" stroke-width="2" fill="none"/>`+t(387,80,'w₂ 내적',{size:12,fill:G})+box(418,60,110,60,O)+t(473,84,'Δy (점수)',{size:12,fill:G})+t(473,104,num(dy),{w:700,size:14})+pkt(84,130,389,0,O,0)
   +t(110,170,'J =',{a:'end'})+mat(118,146,J,{cw:48,ch:26})+t(440,164,'w₂ = (2, −1)',{size:13})+t(440,190,`∇y = w₂ᵀJ = ${vec(g)}`,{size:13,fill:O,w:700})
   +t(320,238,'층을 이으면 변화율이 곱해집니다: 연쇄 법칙 = 행렬 곱',{size:13});
  return {svg:svg(`입력 변화 (0.5, 0, 0)에 야코비안을 곱해 은닉층 변화 ${vec(dh)}가 되고, 다시 출력 가중치와 내적해 점수 변화 ${num(dy)}가 되는 흐름`,body,254),caption:'입력의 작은 변화에 야코비안을 곱하면 은닉층의 변화가, 거기에 출력 가중치를 내적하면 점수의 변화가 나옵니다.'};
 },
 final(){
  const N=M.NET,x=M.NEWDRINK.v,fw=M.forward(x),ys=[60,130,200],hs=[92,168];
  const edge=(a,b,w,i)=>`<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="${w>0?A:w<0?O:'var(--line)'}" stroke-width="${w===0?1:1.2+Math.abs(w)*1.4}" fill="none"/>`+(w?pkt(a[0],a[1],b[0]-a[0],b[1]-a[1],w>0?A:O,i*.3,4):'');
  const node=(x0,y0,top,val,color)=>`<circle cx="${x0}" cy="${y0}" r="27" fill="var(--panel2)" stroke="${color}" stroke-width="2"/>`+t(x0,y0-4,top,{size:11,fill:G})+t(x0,y0+14,val,{size:14,w:700});
  let e='';ys.forEach((y,j)=>hs.forEach((h,i)=>{e+=edge([117,y],[293,h],N.W1[i][j],i+j);}));hs.forEach((h,i)=>{e+=edge([347,h],[493,130],N.w2[i],i+3);});
  const body=e+ys.map((y,j)=>node(90,y,M.AXES[j],num(x[j]),T)).join('')+hs.map((h,i)=>node(320,h,N.hidden[i],num(fw.h[i]),B)).join('')+node(520,130,'점수',num(fw.y),O)
   +t(90,250,'입력 (3)',{size:12,fill:G})+t(320,250,'은닉층 (2): ReLU(W₁x + b₁)',{size:12,fill:G})+t(520,250,'출력: w₂·h + b₂',{size:12,fill:G})+t(600,134,'> 0',{size:13,fill:O,w:700});
  return {svg:svg(`신메뉴 (3, 2, 1)이 입력 세 개에서 은닉 뉴런 두 개 (진한 맛 ${num(fw.h[0])}, 단맛 ${num(fw.h[1])})를 거쳐 점수 ${num(fw.y)}이 되는 2층 신경망. 양수 가중치와 음수 가중치의 선 색이 다르다`,body,266),caption:'선의 굵기는 가중치의 크기, 색은 부호(양수와 음수)입니다. 신메뉴는 진한 맛 1.5, 단맛 1을 거쳐 점수 1.5가 됩니다. 가중치는 이 책이 정한 값입니다.'};
 }
};
function render(id){const r=draw[id]?draw[id]():null;if(r)r.caption+=' 그림의 좌표와 숫자는 브라우저에서 ELMath로 계산한 값입니다.';return r;}
return {render};
})();
