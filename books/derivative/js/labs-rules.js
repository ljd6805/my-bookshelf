/* 5~8장 실험: 정육면체가 자랄 때 늘어난 조각(3D), 다항식 미분, 직사각형 넓이로 보는 곱의 규칙,
   풍선의 겉넓이 × 두께(3D), 함수 기계 두 대, 지수함수의 밑, 단위원. 계산은 DVMath. */
(()=>{
'use strict';
const U=DVUI,M=DVMath,F=U.fmt,R=U.range,S=U.select;
const AC='var(--accent)',OR='var(--orange)',BL='var(--blue)',MU='var(--muted)';

/* 정육면체 x³ 둘레에 판 3개(x·x·dx), 막대 3개(x·dx·dx), 모서리 조각 1개(dx³)를 붙인다. g는 조각 사이 틈. */
function cubeScene(S3,n,x,dx,g){
 const o=-x/2,e=o+x+g,t=n===2?0.12:x,d=n===2?0.12:dx;
 S3.cuboid([o,o,0],[o+x,o+x,t],AC);
 S3.cuboid([e,o,0],[e+dx,o+x,t],OR);S3.cuboid([o,e,0],[o+x,e+dx,t],OR);
 if(n===3){S3.cuboid([o,o,x+g],[o+x,o+x,x+g+dx],OR);S3.cuboid([e,o,x+g],[e+dx,o+x,x+g+dx],BL);S3.cuboid([o,e,x+g],[o+x,e+dx,x+g+dx],BL);}
 S3.cuboid([e,e,0],[e+dx,e+dx,t],n===3?BL:MU);
 if(n===3)S3.cuboid([e,e,x+g],[e+dx,e+dx,x+g+d],MU);
 S3.text([0,o-0.5,0],`x = ${x}`,{dy:16});S3.text([e+dx/2,o-0.5,0],'dx',{dy:16,fill:OR});
}
DVLabs.cube=el=>{
 U.setup(el,S('cb-n','도형',[[3,'정육면체의 부피 x³'],[2,'정사각형의 넓이 x²']],3)+R('cb-x','한 변의 길이 x (cm)',1,3,0.5,2)+R('cb-dx','늘어난 길이 dx (cm)',0.05,1,0.05,1)+U.check('cb-gap','조각 사이를 띄워 보기',true));
 const host=el.querySelector('.chart');host.innerHTML='<div class="dv-stage"></div><div class="dv-under"></div>';
 const st={n:3,x:2,dx:0.5,g:0.25};
 const scene=DV3D.mount(host.querySelector('.dv-stage'),{label:'한 변 x인 정육면체와 한 변이 dx 늘어날 때 덧붙는 판 세 개, 막대 세 개, 모서리 조각 하나.',unit:44,yaw:-32,pitch:26,center:[240,215],build:S3=>cubeScene(S3,st.n,st.x,st.dx,st.g)});
 U.bind(el,()=>{st.n=U.value(el,'cb-n');st.x=U.value(el,'cb-x');st.dx=U.value(el,'cb-dx');st.g=U.on(el,'cb-gap')?0.25:0;scene.draw();
  const p=M.powerPieces(st.n,st.x,st.dx),u=st.n===3?'cm³':'cm²',x=st.x,dx=st.dx;
  const rows=st.n===3?[['판 (주황)',3,`x·x·dx = ${F(x*x*dx,3)}`,F(p.slabs,3)],['막대 (파랑)',3,`x·dx·dx = ${F(x*dx*dx,3)}`,F(p.rods,3)],['모서리 조각 (회색)',1,`dx³ = ${F(dx**3,4)}`,F(p.corner,4)]]:[['띠 (주황)',2,`x·dx = ${F(x*dx,3)}`,F(p.slabs,3)],['모서리 조각 (회색)',1,`dx² = ${F(dx*dx,4)}`,F(p.corner,4)]];
  host.querySelector('.dv-under').innerHTML=U.table(['조각','개수','한 개의 크기',`합계 (${u})`],rows);
  U.result(el,null,`원래 ${st.n===3?'부피':'넓이'} ${F(p.base,3)} ${u} → 늘어난 양 <b>${F(p.exact,4)}</b> ${u}<br>늘어난 양 ÷ dx = <strong>${F(p.ratio,4)}</strong> = ${st.n===3?`3x² + 3x·dx + dx² = ${F(3*x*x,2)} + ${F(3*x*dx,3)} + ${F(dx*dx,4)}`:`2x + dx = ${F(2*x,1)} + ${F(dx,2)}`}<br>dx → 0이면 남는 값(미분계수) <b>${st.n===3?'3x²':'2x'} = ${F(p.rule,2)}</b> · 주황 조각만으로 어림한 양(${F(p.linear,3)})은 실제보다 ${F(p.exact-p.linear,4)} 작습니다(전체의 ${F((p.exact-p.linear)/p.exact*100,1)}%).<br>길이는 축척대로 그렸고 값은 실제 계산입니다.`);});
};

const sign=(v,first)=>v<0?(first?'−':' − '):(first?'':' + ');
function polyText(c,v='x'){const out=[];for(let i=c.length-1;i>=0;i--){if(!c[i])continue;const a=Math.abs(c[i]),k=a===1&&i>0?'':String(a);out.push(sign(c[i],!out.length)+k+(i>1?`${v}${'⁰¹²³'[i]}`:i===1?v:''));}return out.join('')||'0';}
DVLabs.poly=el=>{
 U.setup(el,R('py-a','x³의 계수',-1,1,0.25,0)+R('py-b','x²의 계수',-5,5,0.5,-5)+R('py-c','x의 계수',-20,20,1,20)+R('py-d','상수항',-10,10,1,0)+R('py-x','기울기를 읽을 점 x',-1,5,0.1,1));
 U.bind(el,()=>{const c=[U.value(el,'py-d'),U.value(el,'py-c'),U.value(el,'py-b'),U.value(el,'py-a')],x=U.value(el,'py-x'),d=M.polyDeriv(c),f=t=>M.polyEval(c,t),fd=t=>M.polyEval(d,t),fx=f(x),m=fd(x);
  U.result(el,U.graph({xmin:-1,xmax:5,ymin:-30,ymax:30,xlabel:'x',ylabel:'f(x)와 f′(x)',curves:[{f},{f:fd,color:BL,dash:true}],segs:[{...U.lineThrough(x,fx,m,x-0.8,x+0.8),color:OR,width:3}],pts:[[x,fx,OR],[x,m,BL]],label:`f(x) = ${polyText(c)}와 도함수 f′(x) = ${polyText(d)}의 그래프`})+U.legend([[AC,'f(x)'],[BL,'f′(x)',true],[OR,'x에서의 접선']]),
  `f(x) = <b>${polyText(c)}</b><br>항마다 지수를 계수에 곱하고 지수를 1 줄이면 f′(x) = <strong>${polyText(d)}</strong><br>x = ${F(x,1)}에서 f = ${F(fx)}, 규칙으로 구한 기울기 f′ = <b>${F(m)}</b> · 가운데 차분으로 검산한 값 ${F(M.numDiff(f,x))}<br>상수항(${F(c[0],0)})은 도함수에 남지 않습니다. 그래프를 위아래로 옮겨도 기울기는 그대로이기 때문입니다.<br>실제 계산한 값입니다. 처음 놓인 식 −5x² + 20x는 x를 t로 읽으면 로켓의 높이입니다.`);});
};

/* 가로 u, 세로 v인 직사각형과 dt초 뒤에 붙는 띠 두 개, 모서리 조각 */
function rectArt(u,v,du,dv,dt){
 const k=30,ox=40,oy=250,W=u*k,H=v*k,a=du*dt*k,b=dv*dt*k,r=(x,y,w,h,fill,o)=>`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(w,0.5).toFixed(1)}" height="${Math.max(h,0.5).toFixed(1)}" fill="${fill}" fill-opacity="${o}" stroke="var(--bg)"/>`;
 return `<svg viewBox="0 0 480 280" role="img" aria-label="가로 ${u}, 세로 ${v}인 직사각형에 ${F(dt)}초 동안 오른쪽 띠, 위쪽 띠, 모서리 조각이 덧붙은 그림. 넓이는 아래 표에 있습니다.">${r(ox,oy-H,W,H,AC,0.85)}${r(ox+W,oy-H,a,H,OR,0.85)}${r(ox,oy-H-b,W,b,BL,0.85)}${r(ox+W,oy-H-b,a,b,MU,0.9)}<text x="${ox+W/2}" y="${oy+18}" text-anchor="middle">u = ${u} cm</text><text x="${ox-8}" y="${oy-H/2}" text-anchor="end">v = ${v}</text><text x="${ox+W/2}" y="${oy-H/2+5}" text-anchor="middle" fill="var(--bg)" font-weight="700">u·v</text></svg>`;
}
DVLabs.rect=el=>{
 U.setup(el,R('rc-u','가로 u (cm)',1,6,0.5,3)+R('rc-v','세로 v (cm)',1,6,0.5,2)+R('rc-du','가로가 늘어나는 속도 u′ (cm/초)',0,3,0.5,1)+R('rc-dv','세로가 늘어나는 속도 v′ (cm/초)',0,3,0.5,2)+R('rc-dt','지켜본 시간 Δt (초)',0.01,1,0.01,1));
 U.bind(el,()=>{const u=U.value(el,'rc-u'),v=U.value(el,'rc-v'),du=U.value(el,'rc-du'),dv=U.value(el,'rc-dv'),dt=U.value(el,'rc-dt'),p=M.productRect(u,v,du,dv,dt);
  U.result(el,rectArt(u,v,du,dv,dt)+U.table(['덧붙은 조각','식','넓이 (cm²)'],[['오른쪽 띠 (주황)',`v · u′Δt = ${v} × ${F(du*dt)}`,F(p.stripV,3)],['위쪽 띠 (파랑)',`u · v′Δt = ${u} × ${F(dv*dt)}`,F(p.stripU,3)],['모서리 조각 (회색)',`u′Δt · v′Δt`,F(p.corner,4)]]),
  `넓이 ${F(p.area)} cm²가 ${F(dt)}초 동안 <b>${F(p.delta,4)}</b> cm² 늘었습니다.<br>평균 변화율 = ${F(p.delta,4)} ÷ ${F(dt)} = <strong>${F(p.avg,3)} cm²/초</strong> = (u′v + uv′) + u′v′·Δt = ${F(p.rule)} + ${F(du*dv*dt,3)}<br>Δt → 0이면 남는 값, 곧 곱의 규칙 <b>u′v + uv′ = ${F(du*v)} + ${F(u*dv)} = ${F(p.rule)} cm²/초</b><br>도함수끼리 곱한 값(u′v′ = ${F(p.wrong)})은 ${Math.abs(p.wrong-p.rule)<1e-9?'이 값에서는 우연히 같지만 다른 값에서는 다릅니다. u나 v를 바꿔 확인하세요.':'이 값과 다릅니다. 띠 두 개의 넓이를 빠뜨리고 모서리 조각만 센 식이기 때문입니다.'}<br>실제 계산한 값입니다.`);});
};

DVLabs.balloon=el=>{
 U.setup(el,R('bl-t','바람을 넣은 시간 t (초)',0,4,0.5,1)+R('bl-rate','반지름이 늘어나는 속도 dr/dt (cm/초)',0.1,1,0.1,0.5)+R('bl-dt','껍질을 볼 시간 Δt (초)',0.05,1,0.05,1));
 const host=el.querySelector('.chart');host.innerHTML='<div class="dv-stage"></div>';
 const st={r:2.5,dr:0.5};
 const scene=DV3D.mount(host.querySelector('.dv-stage'),{label:'반지름 r인 풍선과, Δt초 동안 반지름이 dr만큼 늘어 덧씌워진 얇은 껍질.',unit:20,yaw:-30,pitch:20,center:[240,165],build:S3=>{S3.sphere([0,0,0],st.r,AC,{o:0.95});S3.sphere([0,0,0],st.r+st.dr,OR,{o:0.28,grid:false,dash:true,lift:1});S3.line([0,0,0],[st.r,0,0],'var(--text)',{lift:50});S3.text([st.r/2,0,0],'r',{dy:-6});S3.text([0,0,st.r+st.dr],`두께 dr = ${F(st.dr,3)}`,{dy:-8,fill:OR});}});
 U.bind(el,()=>{const t=U.value(el,'bl-t'),rate=U.value(el,'bl-rate'),dt=U.value(el,'bl-dt'),b=M.balloon(t,rate),sh=M.shell(b.r,rate*dt);st.r=b.r;st.dr=rate*dt;scene.draw();
  U.result(el,null,`t = ${t}초: 반지름 r = 2 + ${rate} × ${t} = <b>${F(b.r)}</b> cm, 부피 V = ${F(b.V,1)} cm³<br>바깥 변화율 dV/dr = 4πr² = <b>${F(b.dVdr,1)}</b> cm³/cm (풍선의 겉넓이와 같은 값)<br>안쪽 변화율 dr/dt = <b>${F(rate,1)}</b> cm/초<br>연쇄 법칙 dV/dt = dV/dr × dr/dt = ${F(b.dVdr,1)} × ${F(rate,1)} = <strong>${F(b.dVdt,1)} cm³/초</strong><br>검산: ${F(dt)}초 동안 실제로 늘어난 부피 ${F(sh.exact,2)} cm³, 겉넓이 × 두께 ${F(sh.approx,2)} cm³ (차이 ${F(sh.rel*100,1)}%). Δt를 줄이면 차이가 줄어듭니다.<br>풍선을 완전한 구로 보고 실제로 계산한 값입니다. 반지름과 껍질 두께는 축척대로 그렸습니다.`);});
};

function machineArt(I,O,x,c){
 const box=(x0,t1,t2,col)=>`<rect x="${x0}" y="70" width="120" height="74" rx="10" fill="var(--panel2)" stroke="${col}" stroke-width="2.5"/><text x="${x0+60}" y="102" text-anchor="middle" font-weight="700" fill="var(--text)">${U.esc(t1)}</text><text x="${x0+60}" y="126" text-anchor="middle" fill="${col}">${U.esc(t2)}</text>`;
 const val=(x0,name,v)=>`<text x="${x0}" y="100" text-anchor="middle" fill="var(--muted)">${name}</text><text x="${x0}" y="124" text-anchor="middle" font-weight="700" fill="var(--text)">${F(v,3)}</text>`;
 return `<svg viewBox="0 0 480 240" role="img" aria-label="x가 안쪽 기계 g를 지나 u가 되고, u가 바깥 기계 f를 지나 y가 되는 그림. 변화율은 g에서 ${F(c.inner,3)}배, f에서 ${F(c.outer,3)}배가 되어 전체로 ${F(c.product,3)}배입니다.">${val(34,'x',x)}<path d="M62 107h28M210 107h36M366 107h28" stroke="var(--muted)" stroke-width="2"/>${box(90,'안쪽 '+I.name,`×${F(c.inner,3)}`,BL)}${val(228,'u',c.u)}${box(246,'바깥 '+O.name,`×${F(c.outer,3)}`,OR)}${val(432,'y',c.y)}<text x="240" y="186" text-anchor="middle" fill="var(--text)">x가 조금 변하면 u는 ${F(c.inner,3)}배, y는 다시 ${F(c.outer,3)}배 변합니다</text><text x="240" y="214" text-anchor="middle" font-weight="700" fill="var(--accent)">dy/dx = ${F(c.outer,3)} × ${F(c.inner,3)} = ${F(c.product,3)}</text></svg>`;
}
DVLabs.machines=el=>{
 U.setup(el,S('mc-g','안쪽 함수 g',Object.entries(M.INNER).map(([k,v])=>[k,v.name]),'half')+S('mc-f','바깥 함수 f',Object.entries(M.OUTER).map(([k,v])=>[k,v.name]),'sin')+R('mc-x','입력 x',-2,2,0.1,0.5));
 U.bind(el,()=>{const gi=U.text(el,'mc-g'),fi=U.text(el,'mc-f'),x=U.value(el,'mc-x'),I=M.INNER[gi],O=M.OUTER[fi],c=M.chainAt(gi,fi,x);
  U.result(el,machineArt(I,O,x,c),`안쪽: u = g(${F(x,1)}) = <b>${F(c.u,3)}</b>, du/dx = ${I.ds} = <b>${F(c.inner,3)}</b><br>바깥: dy/du = ${O.ds}에 u의 값(<b>u = ${F(c.u,3)}</b>)을 넣어 <b>${F(c.outer,3)}</b><br>연쇄 법칙 dy/dx = ${F(c.outer,3)} × ${F(c.inner,3)} = <strong>${F(c.product,3)}</strong> · 가운데 차분으로 검산한 값 ${F(c.numeric,3)}<br>흔한 실수: 바깥 도함수 ${O.ds}에 u가 아니라 x의 값(${F(x,1)})을 넣으면 결과가 ${F(c.wrong,3)}입니다. ${Math.abs(c.wrong-c.product)<1e-9?'이 x에서는 u와 x가 같아(또는 바깥 도함수가 같아) 우연히 맞았습니다. x를 옮겨 보세요.':'검산값과 다릅니다.'}<br>실제 계산한 값입니다. sin과 eᵘ의 입력은 라디안·실수입니다.`);});
};

DVLabs.expbase=el=>{
 U.setup(el,R('eb-a','밑 a',1.5,4,0.001,2)+R('eb-x','기울기를 읽을 점 x',-2,2,0.1,1));
 U.bind(el,()=>{const a=U.value(el,'eb-a'),x=U.value(el,'eb-x'),e=M.expBase(a,x),f=t=>a**t,fd=t=>a**t*e.ratio;
  U.result(el,U.graph({xmin:-2,xmax:2,ymin:0,ymax:10,xlabel:'x',ylabel:'aˣ와 그 도함수',curves:[{f},{f:fd,color:BL,dash:true}],segs:[{...U.lineThrough(x,e.f,e.d,x-0.7,x+0.7),color:OR,width:3}],pts:[[x,e.f,OR],[x,e.d,BL]],label:`밑 ${F(a,3)}인 지수함수와 도함수의 그래프`})+U.legend([[AC,'aˣ'],[BL,'도함수',true],[OR,'x에서의 접선']]),
  `a = ${F(a,3)}, x = ${F(x,1)}: 함숫값 aˣ = <b>${F(e.f,3)}</b>, 기울기 = <b>${F(e.d,3)}</b> (가운데 차분 검산 ${F(e.numeric,3)})<br>기울기 ÷ 함숫값 = <strong>${F(e.ratio,4)}</strong> = ln a. x를 옮겨도 이 비는 그대로입니다.<br>${Math.abs(e.ratio-1)<0.0005?'비가 소수 셋째 자리까지 1.000입니다. 밑이 e ≈ 2.718일 때 지수함수는 도함수와 자기 자신이 같아 두 곡선이 겹칩니다.':e.ratio<1?'비가 1보다 작아 도함수 곡선이 함수 곡선보다 아래에 있습니다. 밑을 키워 보세요.':'비가 1보다 커서 도함수 곡선이 함수 곡선보다 위에 있습니다. 밑을 줄여 보세요.'}<br>실제 계산한 값입니다.`);});
};

function circleArt(c,deg){
 const cx=140,cy=130,r=90,px=cx+r*c.x,py=cy-r*c.y,k=60,vx=px+c.dx*k,vy=py-c.dy*k;
 const key=(c0,t,dash)=>`<li><i style="background:${dash?`repeating-linear-gradient(90deg,${c0} 0 5px,transparent 5px 8px)`:c0}"></i>${t}</li>`;
 return `<svg viewBox="0 0 300 260" role="img" aria-label="단위원 위 각도 ${deg}도인 점과 그 점이 움직이는 방향의 화살표. 화살표의 세로 성분이 cos, 가로 성분이 −sin입니다."><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--line)" stroke-width="2"/><path d="M${cx-r-14} ${cy}H${cx+r+14}M${cx} ${cy-r-14}V${cy+r+14}" stroke="var(--muted)"/><path d="M${cx} ${cy}L${px.toFixed(1)} ${py.toFixed(1)}" stroke="var(--text)" stroke-width="2"/><path d="M${px.toFixed(1)} ${py.toFixed(1)}V${cy}" stroke="${AC}" stroke-width="3"/><path d="M${px.toFixed(1)} ${py.toFixed(1)}L${vx.toFixed(1)} ${vy.toFixed(1)}" stroke="${OR}" stroke-width="3"/><path d="M${vx.toFixed(1)} ${py.toFixed(1)}V${vy.toFixed(1)}" stroke="${BL}" stroke-width="3" stroke-dasharray="5 4"/><path d="M${px.toFixed(1)} ${py.toFixed(1)}H${vx.toFixed(1)}" stroke="${MU}" stroke-width="2" stroke-dasharray="5 4"/><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5" fill="${OR}"/></svg><ul class="dv-keys">${key(AC,`굵은 세로선: 높이 sin θ = ${F(c.y,3)}`)}${key(OR,'화살표: 점이 움직이는 방향 (길이 1)')}${key(BL,`세로 점선: 화살표의 세로 성분 cos θ = ${F(c.dy,3)}`,1)}${key(MU,`가로 점선: 화살표의 가로 성분 −sin θ = ${F(c.dx,3)}`,1)}</ul>`;
}
DVLabs.circle=el=>{
 U.setup(el,R('ci-deg','각도 θ (도)',0,360,5,30));
 U.bind(el,()=>{const deg=U.value(el,'ci-deg'),th=deg*Math.PI/180,c=M.circlePoint(th);
  U.result(el,`<div class="dv-wide">${circleArt(c,deg)}</div>`+U.graph({xmin:0,xmax:2*Math.PI,ymin:-1.3,ymax:1.3,xlabel:'θ (라디안)',ylabel:'sin θ',curves:[{f:Math.sin},{f:Math.cos,color:BL,dash:true}],segs:[{...U.lineThrough(th,c.y,c.dy,th-0.8,th+0.8),color:OR,width:3}],pts:[[th,c.y,OR],[th,c.dy,BL]],h:210,label:'sin 그래프와 그 도함수 cos 그래프, 현재 각도에서의 접선'})+U.legend([[AC,'sin θ'],[BL,'cos θ (sin의 도함수)',true],[OR,'접선']]),
  `θ = ${deg}° = <b>${F(th,3)}</b> 라디안: sin θ = ${F(c.y,3)}, cos θ = ${F(c.dy,3)}<br>각도 θ가 1라디안 늘 때 높이가 변하는 비율 d(sin θ)/dθ = <strong>cos θ = ${F(c.dy,3)}</strong><br>가로 위치가 변하는 빠르기 d(cos θ)/dθ = −sin θ = ${F(c.dx,3)}<br>각도를 도(°)로 재면 같은 기울기가 cos θ × π/180 = ${F(c.perDegree,5)}(1°마다)로 바뀝니다. (sin x)′ = cos x는 x가 라디안일 때의 식입니다.<br>실제 계산한 값입니다.`);});
};
})();
