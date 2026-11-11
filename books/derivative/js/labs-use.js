/* 9~12장 실험: 도함수의 부호와 극값, 상자 접기(3D), 접선 어림, 뉴턴 방법, 캔의 비율(3D). 계산은 DVMath. */
(()=>{
'use strict';
const U=DVUI,M=DVMath,F=U.fmt,R=U.range,S=U.select;
const AC='var(--accent)',OR='var(--orange)',BL='var(--blue)',MU='var(--muted)';
const KIND={max:'극대',min:'극소',none:'극값 아님'};

DVLabs.signs=el=>{
 U.setup(el,S('sg-f','함수',['rocket','cubic','cube','sine'].map(k=>[k,M.FUNCS[k].name]),'cubic')+R('sg-p','점의 위치 (정의 구간의 %)',0,100,1,10));
 U.bind(el,()=>{const id=U.text(el,'sg-f'),Fn=M.FUNCS[id],[x0,x1]=Fn.dom,x=x0+(x1-x0)*U.value(el,'sg-p')/100,s=M.shapeAt(id,x,0.02),cr=M.classify(id);
  const top=U.graph({xmin:x0,xmax:x1,ymin:Fn.range[0],ymax:Fn.range[1],xlabel:Fn.x,ylabel:Fn.y,curves:[{f:Fn.f}],segs:[{...U.lineThrough(x,s.f,s.d1,x-(x1-x0)*0.14,x+(x1-x0)*0.14),color:OR,width:3}],pts:[...cr.map(c=>[c.x,c.f,MU,6]),[x,s.f,OR]],notes:cr.map(c=>[c.x,c.f+(Fn.range[1]-Fn.range[0])*0.09,KIND[c.kind],'var(--text)','middle']),h:220,label:`${Fn.name}의 그래프, 접선, f′ = 0인 점`});
  const bottom=U.graph({xmin:x0,xmax:x1,ymin:Fn.drange[0],ymax:Fn.drange[1],xlabel:Fn.x,ylabel:'f′ (실선)와 f″ (점선)',curves:[{f:Fn.d1,color:BL},{f:Fn.d2,color:MU,dash:true}],pts:[[x,s.d1,OR]],h:200,label:'도함수와 이계도함수의 그래프'});
  U.result(el,top+bottom,`x = <b>${F(x)}</b>: f = ${F(s.f)}, f′ = <b>${F(s.d1)}</b>, f″ = <b>${F(s.d2)}</b><br>f′의 부호: <strong>${s.trend==='up'?'양수 → 증가하는 중':s.trend==='down'?'음수 → 감소하는 중':'0에 가까움 → 접선이 수평'}</strong><br>f″의 부호: <strong>${s.bend==='cup'?'양수 → 아래로 볼록(∪), 기울기가 커지는 중':s.bend==='cap'?'음수 → 위로 볼록(∩), 기울기가 작아지는 중':'0에 가까움 → 휘는 방향이 바뀌는 자리일 수 있음'}</strong><br>f′ = 0인 점: ${cr.map(c=>`x = ${F(c.x)}에서 f = ${F(c.f)} (<b>${KIND[c.kind]}</b>)`).join(', ')}<br>극값 판정은 f′의 부호가 그 점 앞뒤에서 바뀌는지로 했습니다. 실제 계산한 값입니다.`);});
};

/* 종이 a×b에서 한 변 x인 귀퉁이를 잘라 내고 날개 네 장을 각도 deg만큼 접어 올린 모습 */
function boxScene(S3,a,b,x,deg){
 const w=a-2*x,l=b-2*x,X=w/2,Y=l/2,c=Math.cos(deg*Math.PI/180),s=Math.sin(deg*Math.PI/180),r=x*c,z=x*s;
 S3.poly([[-X,-Y,0],[X,-Y,0],[X,Y,0],[-X,Y,0]],AC,{o:0.9});
 S3.poly([[X,-Y,0],[X,Y,0],[X+r,Y,z],[X+r,-Y,z]],OR,{o:0.8});S3.poly([[-X,-Y,0],[-X,Y,0],[-X-r,Y,z],[-X-r,-Y,z]],OR,{o:0.8});
 S3.poly([[-X,Y,0],[X,Y,0],[X,Y+r,z],[-X,Y+r,z]],OR,{o:0.65});S3.poly([[-X,-Y,0],[X,-Y,0],[X,-Y-r,z],[-X,-Y-r,z]],OR,{o:0.65});
 for(const [sx,sy] of [[1,1],[1,-1],[-1,1],[-1,-1]])S3.poly([[sx*X,sy*Y,0],[sx*(X+x),sy*Y,0],[sx*(X+x),sy*(Y+x),0],[sx*X,sy*(Y+x),0]],'none',{stroke:MU,dash:true,lift:-100});
 S3.text([0,-Y-x-1,0],`${F(w,1)} cm`,{dy:16});S3.text([X+x+1,0,0],`${F(l,1)} cm`,{dx:26});S3.text([X+r,-Y,z],`x = ${F(x,1)}`,{dy:-8,fill:OR});
}
DVLabs.box=el=>{
 U.setup(el,S('bx-paper','종이 크기',[['30,30','30 cm × 30 cm'],['30,20','30 cm × 20 cm']],'30,30')+R('bx-x','잘라 낼 정사각형의 한 변 x (cm)',0.5,14.5,0.1,2)+R('bx-fold','날개를 접은 각도 (도)',0,90,5,90)+'<div class="buttons"><button type="button" data-play>접기 재생</button></div>');
 el.querySelector('[data-play]').onclick=()=>{const i=el.querySelector('#bx-fold');i.value=0;U.play(i,90,2400);};
 const host=el.querySelector('.chart');host.innerHTML='<div class="dv-stage"></div><div class="dv-under"></div>';
 const st={a:30,b:30,x:2,deg:90,ok:true};
 const scene=DV3D.mount(host.querySelector('.dv-stage'),{label:'네 귀퉁이를 잘라 낸 종이의 날개 네 장을 접어 올려 만든 뚜껑 없는 상자. 점선은 잘라 낸 귀퉁이입니다.',unit:7.2,yaw:-28,pitch:38,center:[240,185],spin:false,build:S3=>{if(st.ok)boxScene(S3,st.a,st.b,st.x,st.deg);else S3.text([0,0,0],'이 길이로는 자를 수 없습니다');}});
 U.bind(el,()=>{const [a,b]=U.text(el,'bx-paper').split(',').map(Number),x=U.value(el,'bx-x'),p=M.box(x,a,b),best=M.boxBest(a,b);Object.assign(st,{a,b,x,deg:U.value(el,'bx-fold'),ok:x<p.max});scene.draw();
  const V=t=>M.box(t,a,b).V,ymax=Math.ceil(best.V*1.15/100)*100;
  host.querySelector('.dv-under').innerHTML=U.graph({xmin:0,xmax:p.max,ymin:0,ymax,xlabel:'자르는 길이 x (cm)',ylabel:'부피 V (cm³)',curves:[{f:V}],segs:st.ok?[{...U.lineThrough(x,p.V,p.dV,x-p.max*0.15,x+p.max*0.15),color:OR,width:3}]:[],pts:st.ok?[[x,p.V,OR]]:[],h:200,label:`자르는 길이에 따른 상자 부피 그래프와 x = ${x}에서의 접선`});
  if(!st.ok){U.result(el,null,`<b>자를 수 없는 길이입니다.</b> 짧은 변이 ${Math.min(a,b)} cm이므로 x는 ${F(p.max,0)} cm보다 작아야 합니다. x를 줄이세요.`);return;}
  U.result(el,null,`바닥 ${F(p.w,1)} cm × ${F(p.l,1)} cm, 높이 ${F(x,1)} cm → 부피 V = <strong>${F(p.V,1)} cm³</strong><br>V′(${F(x,1)}) = <b>${F(p.dV,1)}</b> cm³/cm · ${Math.abs(p.dV)<5?'기울기가 0에 가깝습니다. 접선이 거의 수평인 이 근처가 부피가 가장 큰 곳입니다.':p.dV>0?'양수이므로 x를 더 늘리면 부피가 커집니다.':'음수이므로 x를 줄여야 부피가 커집니다.'}<br>V″(${F(x,1)}) = ${F(p.d2V,1)} ${p.d2V<0?'(음수, 위로 볼록)':'(양수, 아래로 볼록)'}<br>V = x(${a} − 2x)(${b} − 2x), 0 &lt; x &lt; ${F(p.max,0)}. 종이 두께와 풀칠할 자리는 0으로 본 실제 계산입니다.`);});
};

DVLabs.approx=el=>{
 U.setup(el,S('ax-f','함수와 기준점',Object.entries(M.APPROX).map(([k,v])=>[k,v.name]),'sqrt')+R('ax-d','기준점에서 떨어진 정도 (−1 = 왼쪽 끝, 1 = 오른쪽 끝)',-1,1,0.0125,-0.5));
 U.bind(el,()=>{const id=U.text(el,'ax-f'),A=M.APPROX[id],half=Math.min(A.a-A.dom[0],A.dom[1]-A.a),x=A.a+U.value(el,'ax-d')*half,r=M.linearApprox(id,x);
  U.result(el,U.graph({xmin:A.dom[0],xmax:A.dom[1],ymin:A.range[0],ymax:A.range[1],xlabel:A.x,ylabel:'f(x)와 접선 L(x)',curves:[{f:A.f}],segs:[{...U.lineThrough(A.a,r.base,r.slope,A.dom[0],A.dom[1]),color:OR},{a:[x,r.f],b:[x,r.L],color:BL,width:3}],pts:[[A.a,r.base,MU,6],[x,r.f,AC],[x,r.L,OR]],label:`${A.name}에서 그은 접선과 x = ${F(x,3)}에서의 차이`})+U.legend([[AC,'실제 함수'],[OR,'기준점에서 그은 접선'],[BL,'두 값의 차이']]),
  `접선의 식 L(x) = ${F(r.base,2)} + ${F(r.slope,2)}·(x − ${A.a})<br>x = <b>${F(x,3)}</b>: 접선으로 어림한 값 <strong>${F(r.L,4)}</strong>, 실제 값 <b>${F(r.f,4)}</b><br>오차(어림 − 실제) = ${F(r.error,4)} · 실제 값의 ${F(Math.abs(r.error/r.f)*100,2)}%<br>기준점에서 ${F(Math.abs(x-A.a),3)}만큼 떨어졌습니다. 떨어진 거리를 반으로 줄이면 오차는 약 4분의 1로 줄어듭니다.<br>실제 계산한 값입니다.`);});
};

DVLabs.newton=el=>{
 U.setup(el,S('nw-f','풀 방정식',Object.entries(M.NEWTON).map(([k,v])=>[k,v.name]),'rocket12')+R('nw-x0','시작점',-2.5,4,0.1,0.5)+R('nw-n','걸음 수',0,6,1,1));
 U.bind(el,()=>{const id=U.text(el,'nw-f'),N=M.NEWTON[id],raw=U.value(el,'nw-x0'),x0=Math.max(N.dom[0],Math.min(N.dom[1],raw)),n=U.value(el,'nw-n'),r=M.newton(id,x0,n);
  const segs=r.xs.slice(0,-1).map((x,i)=>({a:[x,N.f(x)],b:[r.xs[i+1],0],color:OR,width:i===r.xs.length-2?3:1.4}));
  U.result(el,U.graph({xmin:N.dom[0],xmax:N.dom[1],ymin:N.range[0],ymax:N.range[1],xlabel:N.x,ylabel:'f',curves:[{f:N.f}],segs,pts:[...r.xs.map(x=>[x,N.f(x),BL,4]),[r.last,0,OR,6]],label:`${N.name}의 그래프와 뉴턴 방법의 접선들. 마지막 값 ${F(r.last,4)}`})+U.table(['걸음','x','f(x)'],r.xs.map((x,i)=>[i,F(x,6),F(N.f(x),6)]),i=>i===r.xs.length-1),
  (raw!==x0?`고른 시작점(${F(raw,1)})은 이 방정식의 그래프 범위 밖이라 범위의 끝(${F(x0,1)})으로 옮겼습니다.<br>`:'')+`시작점 x₀ = ${F(x0,1)}, ${r.xs.length-1}걸음 뒤 x = <strong>${F(r.last,6)}</strong>, f(x) = ${F(r.residual,6)}<br>`+
  (r.stopped>=0?`<b>${r.stopped===0?'시작점에서 한 걸음도 떼지 못하고 멈췄습니다.':r.stopped+'걸음 뒤에 멈췄습니다.'}</b> 이 점에서 f′ = 0이라 접선이 수평이고 가로축과 만나지 않습니다. 시작점을 옮기세요.`:r.converged?`f(x)가 0.000001보다 0에 가깝습니다. 해 ${N.roots.map(v=>F(v,4)).join(', ')} 가운데 하나에 닿았습니다.`:'아직 해에 닿지 않았습니다. 걸음 수를 늘리거나, 값이 같은 자리를 오가는지 표에서 확인하세요.')+'<br>x ← x − f(x) ÷ f′(x)를 실제로 되풀이한 값입니다.');});
};

DVLabs.can=el=>{
 U.setup(el,R('cn-r','밑면의 반지름 r (cm)',2.5,6,0.05,2.5)+R('cn-k','뚜껑·바닥 재료 값이 옆면의 몇 배인가 k',1,3,0.5,1));
 const host=el.querySelector('.chart');host.innerHTML='<div class="dv-stage"></div><div class="dv-under"></div>';
 const st={r:2.5,h:16.8};
 const scene=DV3D.mount(host.querySelector('.dv-stage'),{label:'부피 330 mL를 지키며 반지름에 따라 높이가 달라지는 원기둥 캔.',unit:11,yaw:-30,pitch:22,center:[240,290],build:S3=>{S3.cylinder([0,0,0],st.r,st.h,AC,{endFill:OR});S3.text([0,0,st.h],`r = ${F(st.r)}`,{dy:-14,fill:OR});S3.text([st.r,0,st.h/2],`h = ${F(st.h)}`,{dx:34});}});
 U.bind(el,()=>{const r=U.value(el,'cn-r'),k=U.value(el,'cn-k'),c=M.can(r,k),best=M.canBest(k),top=Math.max(M.can(2.5,k).cost,M.can(6,k).cost),ymax=Math.max(440,240+4*Math.ceil((top-240)/40)*10);st.r=r;st.h=c.h;scene.draw();
  host.querySelector('.dv-under').innerHTML=U.graph({xmin:2.5,xmax:6,ymin:240,ymax,xlabel:'반지름 r (cm)',ylabel:'비용 넓이 S (cm²)',curves:[{f:t=>M.can(t,k).cost}],segs:[{...U.lineThrough(r,c.cost,c.dCost,r-0.5,r+0.5),color:OR,width:3}],pts:[[r,c.cost,OR]],h:200,label:`반지름에 따른 비용 넓이 그래프와 r = ${F(r)}에서의 접선`});
  U.result(el,null,`r = ${F(r)} cm → 높이 h = 330 ÷ (πr²) = <b>${F(c.h)}</b> cm (h는 지름의 ${F(c.ratio)}배)<br>뚜껑·바닥 넓이 ${F(c.ends,1)} cm² × ${k} + 옆면 넓이 ${F(c.side,1)} cm² = 비용 넓이 S = <strong>${F(c.cost,1)} cm²</strong><br>S′(${F(r)}) = <b>${F(c.dCost,1)}</b> cm²/cm · ${Math.abs(c.dCost)<=c.d2Cost*0.025+1e-9?'기울기가 0에 가깝습니다. 이 근처가 비용이 가장 작은 반지름입니다.':c.dCost<0?'음수이므로 r을 키우면 비용이 줄어듭니다.':'양수이므로 r을 줄이면 비용이 줄어듭니다.'}<br>S″ = ${F(c.d2Cost,1)} (양수, 아래로 볼록)<br>S = k·2πr² + 660/r. 재료 두께, 이음매, 캔의 목 모양은 넣지 않은 실제 계산입니다.`);});
};
})();
