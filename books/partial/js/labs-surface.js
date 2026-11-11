/* 1~6장 실험: 할선과 접선, 곡면의 단면(편미분), 여러 모양 함수의 편미분, 접평면 어림, 방향에 따른 변화율, 경사하강 걸음.
   계산은 모두 DXMath가 하고, 여기서는 입력을 읽어 그림과 결과 문장을 그린다. 3차원 그림은 DXUI.surface가 그린다. */
(()=>{
'use strict';
const U=DXUI,M=DXMath,F=U.fmt,R=U.range,S=U.select,W=M.WINDOW,AX=['w','b','L'];
const T='var(--text)',A='var(--accent)';
const pair=s=>s.split(',').map(Number);
const clampW=(w,b)=>[Math.max(W.x[0],Math.min(W.x[1],w)),Math.max(W.y[0],Math.min(W.y[1],b))];
/* 카페 손실 곡면 위에 선·점·면을 얹은 돌려 보는 그림 */
function lossStage(el,extra,label){const v=U.view(el);return U.stage(U.surface({f:M.loss,win:W,yaw:v.yaw,pitch:v.pitch,axes:AX,label,...extra}),v);}
/* 바닥 평면 위의 화살표(지도에서 방향을 보일 때). z는 화살표를 띄울 높이 */
function arrow(w,b,deg,len,z,color,dash){
 const t=deg*Math.PI/180,e=[w+len*Math.cos(t),b+len*Math.sin(t)],wing=k=>[e[0]-0.35*Math.cos(t+k),e[1]-0.35*Math.sin(t+k),z];
 return [{pts:[[w,b,z],[e[0],e[1],z]],color,width:3.5,dash},{pts:[wing(0.5),[e[0],e[1],z],wing(-0.5)],color,width:3.5}];
}

DXLabs.secant=el=>{
 U.setup(el,R('sc-w','기울기 w (잔/℃)',0,6,0.1,2)+S('sc-h','두 점 사이 간격 h',[[2,'2'],[1,'1'],[0.5,'0.5'],[0.1,'0.1'],[0.01,'0.01']],1));
 U.bind(el,()=>{const w=U.value(el,'sc-w'),h=U.value(el,'sc-h'),r=M.secant(w,h),L=t=>M.loss(t,M.B0);
  const ws=Array.from({length:81},(_,i)=>i/10),ext=Math.max(1.5,h+0.8);
  U.result(el,U.plot({lines:[{data:ws.map(t=>[t,L(t)]),color:'var(--blue)'},{data:[[w-ext,r.L0-r.exact*ext],[w+ext,r.L0+r.exact*ext]],color:A,dashed:true},{data:[[w-0.8,r.L0-r.slope*0.8],[w+ext,r.L0+r.slope*ext]],color:'var(--orange)'}],points:[[w,r.L0,T,6],[w+h,r.L1,'var(--orange)',6]],xmin:0,xmax:8,ymin:0,ymax:300,xlabel:'기울기 w (절편 b = 12 고정)',ylabel:'손실 L (잔²)',label:`손실 곡선 위에서 w = ${F(w,1)}인 점과 w + h = ${F(w+h,2)}인 점을 이은 할선(실선)과 w = ${F(w,1)}에서의 접선(점선)`}),
  `w = ${F(w,1)}에서 L = ${F(r.L0)}, w + h = ${F(w+h,2)}에서 L = ${F(r.L1)}<br>두 점을 이은 선의 기울기 = (${F(r.L1)} − ${F(r.L0)}) ÷ ${h} = <strong>${F(r.slope)}</strong><br>h를 0에 가깝게 보냈을 때의 값(미분) = 35 × ${F(w,1)} − 138.75 = <b>${F(r.exact)}</b> · 둘의 차이 ${F(r.gap,3)} = 17.5 × h<br>`+
  (h<=0.1?'두 점이 가까워 실선(할선)과 점선(접선)이 거의 겹칩니다.':'두 점이 멀어 실선과 점선의 기울기가 눈에 띄게 다릅니다. h를 줄여 보세요.')+(Math.abs(r.exact)<4?' 이 자리는 곡선의 바닥(w ≈ 3.96) 근처라 기울기가 0에 가깝습니다.':r.exact<0?' 기울기가 음수이므로 w를 늘리면 손실이 줄어듭니다.':' 기울기가 양수이므로 w를 늘리면 손실이 늘어납니다.')+'<br>카페 8일 기록의 평균제곱오차로 실제 계산했습니다.');});
};

DXLabs.slice=el=>{
 U.setup(el,S('sl-var','움직일 변수',[['w','w를 움직이고 b는 고정'],['b','b를 움직이고 w는 고정']],'w')+R('sl-w','w (잔/℃)',0,8,0.1,2)+R('sl-b','b (잔)',8,16,0.5,12));
 const draw=()=>{const which=U.text(el,'sl-var'),w=U.value(el,'sl-w'),b=U.value(el,'sl-b'),r=M.slice(w,b,which),isW=which==='w',L=r.value;
  const ts=Array.from({length:41},(_,i)=>i/40),curve=isW?ts.map(t=>{const x=W.x[0]+8*t;return [x,b,M.loss(x,b)];}):ts.map(t=>{const y=W.y[0]+8*t;return [w,y,M.loss(w,y)];});
  const wall=isW?[[0,b,0],[8,b,0],[8,b,W.z[1]],[0,b,W.z[1]]]:[[w,8,0],[w,16,0],[w,16,W.z[1]],[w,8,W.z[1]]];
  const d=Math.min(1.2,60/Math.max(Math.abs(r.slope),1)+0.25),tan=isW?[[w-d,b,L-r.slope*d],[w+d,b,L+r.slope*d]]:[[w,b-d,L-r.slope*d],[w,b+d,L+r.slope*d]];
  const mv=isW?'w':'b',fx=isW?'b':'w',q=r.q,eq=`${F(r.p,1)}${mv}² ${q<0?'−':'+'} ${F(Math.abs(q))}${mv} + ${F(r.r)}`;
  U.result(el,lossStage(el,{polys:[{pts:wall,fill:T,opacity:.12}],lines:[{pts:curve,color:T,width:4},{pts:tan,color:A,width:4}],dots:[[w,b,L,A,7]]},`손실 곡면을 ${fx} = ${F(r.fixed,1)}인 세로 면으로 자른 단면 곡선과, (${F(w,1)}, ${F(b,1)})에서 그 단면에 그은 접선`),
  `${fx} = ${F(r.fixed,1)}로 고정하고 곡면을 자르면 단면은 L = ${eq} 인 포물선입니다.<br>${mv} = ${F(r.at,1)}에서 이 단면의 기울기: <strong>∂L/∂${mv} = ${isW?`35 × ${F(w,1)} + 7 × ${F(b,1)} − 222.75`:`2 × ${F(b,1)} + 7 × ${F(w,1)} − 51.5`} = ${F(r.slope)}</strong> (수치 미분 ${F(r.numeric,4)})<br>같은 자리에서 반대쪽 변수로 잰 편미분 ∂L/∂${fx} = <b>${F(r.other)}</b> · 이 자리의 손실 L = ${F(L)}<br>`+
  (Math.abs(r.slope)<1.5?`이 단면에서는 바닥(${mv} ≈ ${F(r.bottom)}) 근처라 기울기가 0에 가깝습니다. 그래도 반대쪽 편미분이 0이 아니면 곡면 전체의 바닥은 아닙니다.`:`${mv}만 조금 늘리면 손실이 ${r.slope<0?'줄어듭니다':'늘어납니다'}. 이 단면의 바닥은 ${mv} ≈ ${F(r.bottom)}${(isW?r.bottom<0||r.bottom>8:r.bottom<8||r.bottom>16)?'로 그림 밖에 있습니다':'입니다'}.`)+
  '<br>굵은 선이 단면, 분홍 선이 접선, 반투명한 면이 고정한 값입니다. 손실 식으로 실제 계산했습니다.');};
 U.turnable(el,draw);U.bind(el,draw);
};

DXLabs.surfaces=el=>{
 U.setup(el,S('pf-f','함수 f(x, y)',Object.entries(M.SURFACES).map(([k,s])=>[k,s.name]),'bowl')+R('pf-x','x',-2,2,0.25,1)+R('pf-y','y',-2,2,0.25,-1.5));
 const draw=()=>{const k=U.text(el,'pf-f'),x=U.value(el,'pf-x'),y=U.value(el,'pf-y'),s=M.SURFACES[k],r=M.partials(k,x,y),win=M.SURFACE_WINDOW(k),v=U.view(el);
  const ts=Array.from({length:33},(_,i)=>-2+i/8),d=0.7,z=r.value;
  U.result(el,U.stage(U.surface({f:s.f,win,yaw:v.yaw,pitch:v.pitch,axes:['x','y','f'],lines:[{pts:ts.map(t=>[t,y,s.f(t,y)]),color:T,width:3.5},{pts:ts.map(t=>[x,t,s.f(x,t)]),color:T,width:3,dash:'6 5'},{pts:[[x-d,y,z-r.fx*d],[x+d,y,z+r.fx*d]],color:A,width:4},{pts:[[x,y-d,z-r.fy*d],[x,y+d,z+r.fy*d]],color:A,width:4,dash:'3 4'}],dots:[[x,y,z,A,7]],label:`f(x, y) = ${s.name}의 곡면과, (${x}, ${y})를 지나는 x 방향 단면과 y 방향 단면, 두 단면의 접선`}),v),
  `f(x, y) = ${s.name} · (${x}, ${y})에서 f = ${F(z)}<br><strong>∂f/∂x = ${s.tx} = ${F(r.fx)}</strong> · ${s.rx}.<br><strong>∂f/∂y = ${s.ty} = ${F(r.fy)}</strong> · ${s.ry}.<br>수치 미분으로 확인: ∂f/∂x ≈ ${F(r.nx,4)}, ∂f/∂y ≈ ${F(r.ny,4)}<br>`+
  (r.fx===0&&r.fy===0?'두 편미분이 모두 0입니다. 어느 변수를 조금 움직여도 f가 거의 변하지 않는 자리입니다.':Math.sign(r.fx)*Math.sign(r.fy)<0?'x를 늘릴 때와 y를 늘릴 때 f가 변하는 방향이 서로 반대입니다.':'')+
  ' 실선이 x만 움직인 단면, 점선이 y만 움직인 단면이고 분홍 선이 각 단면의 접선입니다. 식으로 실제 계산했습니다.');};
 U.turnable(el,draw);U.bind(el,draw);
};

DXLabs.plane=el=>{
 U.setup(el,S('pl-at','출발 자리 (w, b)',[['2,12','(2, 12)'],['6,14','(6, 14)'],['4,11.5','(4, 11.5) 바닥 근처']],'2,12')+R('pl-dw','w의 변화 Δw',-2,2,0.1,0.5)+R('pl-db','b의 변화 Δb',-2,2,0.1,1));
 const draw=()=>{const [w,b]=pair(U.text(el,'pl-at')),dw=U.value(el,'pl-dw'),db=U.value(el,'pl-db'),r=M.planeEstimate(w,b,dw,db),P=(x,y)=>r.L+r.gw*(x-w)+r.gb*(y-b),s=1;
  const patch=[[w-s,b-s],[w+s,b-s],[w+s,b+s],[w-s,b+s]].map(([x,y])=>[x,y,P(x,y)]),[nw,nb]=clampW(w+dw,b+db);
  U.result(el,lossStage(el,{polys:[{pts:patch,fill:A,opacity:.35}],lines:[{pts:[[nw,nb,r.L+r.estimate],[nw,nb,r.L+r.actual]],color:T,width:3,dash:'3 3'}],dots:[[w,b,r.L,T,6],[nw,nb,r.L+r.actual,T,6],[nw,nb,r.L+r.estimate,A,7]]},`손실 곡면과 (${w}, ${b})에서 곡면에 닿는 접평면, 그리고 (${F(w+dw,1)}, ${F(b+db,1)})에서 곡면 위의 실제 점과 접평면 위의 어림 점`),
  `출발 (${w}, ${b}): L = ${F(r.L)}, ∂L/∂w = ${F(r.gw)}, ∂L/∂b = ${F(r.gb)}<br>접평면으로 어림한 변화 = ${F(r.gw)} × ${F(dw,1)} + ${F(r.gb)} × ${F(db,1)} = ${F(r.partW)} + ${F(r.partB)} = <strong>${F(r.estimate)}</strong><br>실제 변화 = L(${F(w+dw,1)}, ${F(b+db,1)}) − L(${w}, ${b}) = <b>${F(r.actual)}</b> · 어림과의 차이 <b>${F(r.error,3)}</b><br>`+
  (dw===0&&db===0?'두 변화가 모두 0이라 움직이지 않았습니다.':Math.abs(r.error)<=0.05*Math.max(Math.abs(r.actual),0.5)?'변화가 작아 접평면의 어림이 실제 변화와 거의 같습니다.':'변화가 커서 곡면이 접평면에서 벗어난 만큼 어림이 빗나갑니다. Δw와 Δb를 0.1 근처로 줄여 보세요.')+
  ` 차이는 17.5Δw² + Δb² + 7ΔwΔb = ${F(r.curve,3)}와 같습니다.<br>분홍 면이 접평면, 분홍 점이 어림한 높이, 흰 테두리 점이 곡면 위의 실제 높이입니다. 손실 식으로 실제 계산했습니다.`);};
 U.turnable(el,draw);U.bind(el,draw);
};

DXLabs.compass=el=>{
 U.setup(el,S('cp-at','서 있는 자리 (w, b)',[['2,12','(2, 12)'],['6,14','(6, 14)'],['4,9','(4, 9)']],'2,12')+R('cp-deg','움직일 방향 θ (도, 0은 w가 늘어나는 쪽)',0,350,10,0));
 const draw=()=>{const [w,b]=pair(U.text(el,'cp-at')),deg=U.value(el,'cp-deg'),r=M.directional(w,b,deg),z=M.loss(w,b),gd=(r.deg+360)%360;
  U.result(el,lossStage(el,{lines:[...arrow(w,b,r.deg,1.6,z,T),...arrow(w,b,r.deg+180,1.6,z,T,'5 4'),...arrow(w,b,deg,1.6,z,A)],dots:[[w,b,z,T,5]]},`손실 곡면을 위에서 본 지도. (${w}, ${b})에서 기울기 벡터 방향의 화살표, 그 반대쪽 점선 화살표, 고른 방향 ${deg}도의 화살표`),
  `(${w}, ${b})에서 ∂L/∂w = ${F(r.gw)}, ∂L/∂b = ${F(r.gb)} → 기울기 벡터 ∇L = (${F(r.gw)}, ${F(r.gb)}), 크기 <b>${F(r.norm)}</b>, 방향 ${F(gd,1)}°<br>θ = ${deg}° 쪽으로 움직일 때 손실이 변하는 빠르기 = ${F(r.gw)} × cos ${deg}° + ${F(r.gb)} × sin ${deg}° = <strong>${F(r.rate)}</strong> (수치 미분 ${F(r.numeric,3)})<br>`+
  (r.off<12?`기울기 벡터와 거의 같은 방향입니다. 손실이 가장 빠르게 늘어나며, 그 빠르기의 최댓값이 기울기의 크기 ${F(r.norm)}입니다.`:r.off>168?`기울기 벡터의 반대쪽입니다. 손실이 가장 빠르게 줄어드는 방향이고, 경사하강이 걷는 쪽입니다.`:Math.abs(r.off-90)<12?'기울기 벡터와 거의 직각입니다. 손실이 거의 변하지 않는 방향, 곧 색띠의 경계(등고선)를 따라가는 방향입니다.':r.rate>0?`기울기 벡터와 ${F(r.off,0)}° 벌어진 방향이라 손실이 늘어나지만 가장 빠른 방향은 아닙니다.`:`기울기 벡터와 ${F(r.off,0)}° 벌어진 방향이라 손실이 줄어들지만 가장 빠른 방향은 아닙니다.`)+
  '<br>흰(어두운 화면) 또는 검은(밝은 화면) 실선 화살표가 기울기 벡터, 점선이 그 반대쪽, 분홍 화살표가 고른 방향입니다. 화살표 길이는 방향만 보이려고 같게 그렸습니다. 손실 식으로 실제 계산했습니다.');};
 U.turnable(el,draw,{yaw:0,pitch:90});U.bind(el,draw);
};

DXLabs.walk=el=>{
 U.setup(el,S('wk-lr','학습률 η',[[0.005,'0.005'],[0.02,'0.02'],[0.05,'0.05'],[0.056,'0.056']],0.02)+R('wk-steps','걸음 수',0,60,1,5)+S('wk-start','출발 자리 (w, b)',[['1,9','(1, 9)'],['7,15','(7, 15)'],['2,15','(2, 15)']],'1,9'));
 const draw=()=>{const lr=U.value(el,'wk-lr'),n=U.value(el,'wk-steps'),[w0,b0]=pair(U.text(el,'wk-start')),r=M.walk(w0,b0,lr,n),lim=M.stepLimit(),g=r.first,last=r.last,gl=M.grad(last.w,last.b),best=M.best();
  const pts=r.path.map(p=>{const [w,b]=clampW(p.w,p.b);return [w,b,M.loss(w,b)];});
  U.result(el,lossStage(el,{lines:[{pts,color:T,width:2.5}],dots:[...pts.map((p,i)=>[p[0],p[1],p[2],i===pts.length-1?A:T,i===pts.length-1?7:3.5]),[best.w,best.b,best.loss,'var(--bg)',4]]},`손실 곡면 위에서 (${w0}, ${b0})을 출발해 학습률 ${lr}로 ${n}걸음 걸은 길`),
  `출발 (${w0}, ${b0}): L = ${F(r.path[0].L)}, ∂L/∂w = ${F(g.gw)}, ∂L/∂b = ${F(g.gb)}<br>첫 걸음: w ← ${w0} − ${lr} × (${F(g.gw)}) = ${F(w0-lr*g.gw)}, b ← ${b0} − ${lr} × (${F(g.gb)}) = ${F(b0-lr*g.gb)}<br>${n}걸음 뒤 (w, b) = (${F(last.w)}, ${F(last.b)}), 손실 <strong>${F(last.L)}</strong>, 남은 기울기 크기 <b>${F(gl.norm)}</b><br>`+
  (n===0?'아직 걷지 않았습니다. 걸음 수를 늘려 보세요.':r.diverged?`<strong>걸을수록 손실이 커집니다.</strong> η가 이 곡면의 한계 약 ${F(lim.limit,4)}보다 커서 걸음마다 골짜기를 넘어 더 높은 곳에 떨어집니다. 그림 밖으로 나간 점은 가장자리에 붙여 그렸습니다.`:lr>lim.limit/2?`w 쪽으로 골짜기를 넘나들며 내려갑니다. ∂L/∂w가 커서 w의 걸음이 골짜기 폭보다 크기 때문입니다.`:last.L<best.loss*1.05?`손실이 가장 작은 자리(w ≈ ${F(best.w)}, b ≈ ${F(best.b)}, L ≈ ${F(best.loss)})에 거의 닿았습니다.`:`w는 몇 걸음 만에 골짜기에 닿지만, ∂L/∂b가 작아 b는 골짜기를 따라 천천히 움직입니다. 가장 작은 손실은 ${F(best.loss)}입니다.`)+
  '<br>선이 걸어온 길, 분홍 점이 지금 자리, 작은 점이 손실이 가장 작은 자리입니다. 손실 식으로 실제 계산했습니다.');};
 U.turnable(el,draw);U.bind(el,draw);
};
})();
