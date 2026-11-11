/* 1~4장 실험: 평균 변화율, 구간 줄이기, 한 점에 다가가기, 할선과 접선, 확대하기, 도함수 따라 그리기.
   계산은 모두 DVMath가 하고, 여기서는 입력을 읽어 그림과 결과 문장을 그린다. */
(()=>{
'use strict';
const U=DVUI,M=DVMath,F=U.fmt,R=U.range,S=U.select,RK=M.rocket;
const AC='var(--accent)',OR='var(--orange)',BL='var(--blue)';
const rocketGraph=(o)=>U.graph({xmin:0,xmax:4,ymin:0,ymax:24,xlabel:'t (초)',ylabel:'높이 h (m)',curves:[{f:RK.h}],...o});

DVLabs.interval=el=>{
 U.setup(el,R('iv-a','구간의 시작 a (초)',0,3.9,0.1,1)+R('iv-b','구간의 끝 b (초)',0.1,4,0.1,2));
 U.bind(el,()=>{const a=U.value(el,'iv-a'),b=U.value(el,'iv-b'),ha=RK.h(a),hb=RK.h(b),avg=M.avgRate(RK.h,a,b);
  if(a===b){U.result(el,rocketGraph({pts:[[a,ha]],label:'로켓 높이 그래프와 점 하나'}),`<b>구간의 길이가 0입니다.</b> Δt = 0이면 Δh ÷ Δt가 0 ÷ 0이 되어 평균 변화율을 계산할 수 없습니다. a와 b를 서로 다르게 놓으세요. 이 문제를 2장에서 극한으로 풉니다.`);return;}
  const line=U.lineThrough(a,ha,avg,0,4),lo=Math.min(a,b),hi=Math.max(a,b),through=lo<2&&hi>2;
  U.result(el,rocketGraph({segs:[{...line,color:OR}],pts:[[a,ha,BL],[b,hb,BL]],label:`로켓 높이 그래프에서 t = ${a}인 점과 t = ${b}인 점을 잇는 할선. 기울기 ${F(avg)} m/s`})+U.legend([[AC,'높이 h(t)'],[OR,'두 점을 잇는 할선(기울기 = 평균 변화율)']]),
  `h(${a}) = <b>${F(ha)}</b> m, h(${b}) = <b>${F(hb)}</b> m<br>Δh = ${F(hb)} − ${F(ha)} = ${F(hb-ha)} m, Δt = ${b} − ${a} = ${F(b-a,1)}초<br>평균 변화율(평균 속도) = Δh ÷ Δt = <strong>${F(avg)} m/s</strong><br>`+
  (Math.abs(avg)<1e-9?'평균 속도가 0입니다. 두 시각의 높이가 같다는 뜻이지 로켓이 멈춰 있었다는 뜻이 아닙니다.':avg>0?'양수이므로 이 구간 전체로 보면 로켓은 올라갔습니다.':'음수이므로 이 구간 전체로 보면 로켓은 내려왔습니다.')+(through?' 이 구간에는 최고점(t = 2초, 20 m)이 들어 있습니다. 올라간 높이와 내려온 높이가 Δh에서 서로 지워지므로, 평균 속도만으로는 로켓이 올라갔다가 내려왔다는 것을 알 수 없습니다.':'')+'<br>h(t) = 20t − 5t²으로 실제 계산한 값입니다.');});
};

const DTS=[1,0.5,0.1,0.01,0.001,0.0001];
DVLabs.shrink=el=>{
 U.setup(el,S('sk-a','기준 시각 a',[[1,'t = 1초 (올라가는 중)'],[2,'t = 2초 (최고점)'],[3,'t = 3초 (내려오는 중)']],3)+S('sk-side','구간을 잡는 쪽',[[1,'오른쪽 [a, a + Δt]'],[-1,'왼쪽 [a − Δt, a]']],1)+R('sk-n','Δt를 줄인 횟수 (1 → 0.5 → 0.1 → 0.01 → 0.001 → 0.0001)',1,6,1,1));
 U.bind(el,()=>{const a=U.value(el,'sk-a'),side=U.value(el,'sk-side'),n=U.value(el,'sk-n'),rows=M.shrinkTable(RK.h,a,DTS.slice(0,n).map(d=>d*side)),last=rows[n-1],lim=RK.v(a);
  const line=U.lineThrough(a,RK.h(a),last.avg,0,4);
  U.result(el,rocketGraph({segs:[{...line,color:OR}],pts:[[a,RK.h(a),BL],[a+last.dt,RK.h(a+last.dt),BL]],label:`로켓 높이 그래프에서 t = ${a}인 점과 t = ${F(a+last.dt,4)}인 점을 잇는 할선`})+U.table(['Δt (초)','구간','평균 속도 (m/s)'],rows.map(r=>[F(Math.abs(r.dt),4),side>0?`[${a}, ${F(a+r.dt,4)}]`:`[${F(a+r.dt,4)}, ${a}]`,F(r.avg,4)]),i=>i===n-1),
  `Δt = ${F(Math.abs(last.dt),4)}초일 때 평균 속도 <strong>${F(last.avg,4)} m/s</strong><br>표의 값은 ${n<3?'아직 몇 개뿐입니다. Δt를 더 줄여 어떤 수에 다가가는지 보세요.':`<b>${F(lim,0)}</b>에 다가갑니다. 이 식에서 평균 속도는 ${F(lim,0)} ${side>0?'−':'+'} 5·Δt이므로 차이는 5·Δt = ${F(Math.abs(last.avg-lim),4)}입니다.`}<br>Δt에 0을 넣은 것이 아닙니다. 0이 아닌 Δt를 줄여 가며 실제로 계산한 값입니다.`);});
};

const AP={hole:{dom:[-1,3],range:[0,4],x:'x',y:'f(x)'},jump:{dom:[0,2],range:[500,2000],x:'주차 시간 x (시간)',y:'요금 (원)'},sinc:{dom:[-6,6],range:[-0.4,1.2],x:'x (라디안)',y:'sin x / x'}};
DVLabs.approach=el=>{
 U.setup(el,S('ap-f','함수와 다가갈 점',Object.entries(M.LIMITS).map(([k,v])=>[k,v.name]),'jump')+R('ap-k','거리 d를 줄인 횟수 (d = 1, 0.1, 0.01, …)',0,6,1,0));
 U.bind(el,()=>{const id=U.text(el,'ap-f'),k=U.value(el,'ap-k'),d=10**-k,L=M.LIMITS[id],p=M.limitProbe(id,d),A=AP[id],dg=id==='jump'?0:id==='sinc'?8:6;
  const curves=id==='jump'?[{f:L.f,to:0.9999},{f:L.f,from:1}]:[{f:L.f}];
  const pts=[[L.at-d,p.left,BL],[L.at+d,p.right,BL]];if(Number.isFinite(L.value))pts.push([L.at,L.value,AC,6]);
  U.result(el,U.graph({xmin:A.dom[0],xmax:A.dom[1],ymin:A.range[0],ymax:A.range[1],xlabel:A.x,ylabel:A.y,curves,pts,label:`${L.name}. 왼쪽 값 ${F(p.left,dg)}, 오른쪽 값 ${F(p.right,dg)}`}),
  `거리 d = ${F(d,6)}<br>왼쪽 f(${F(L.at-d,6)}) = <b>${F(p.left,dg)}</b> · 오른쪽 f(${F(L.at+d,6)}) = <b>${F(p.right,dg)}</b><br>그 점의 값 f(${L.at}) = <b>${Number.isFinite(L.value)?F(L.value,dg):'정의되지 않음 (0 ÷ 0)'}</b><br>`+
  (p.exists?`양쪽 값이 같은 수 <strong>${F(p.limit,0)}</strong>에 다가가므로 극한은 ${F(p.limit,0)}입니다. 그 점에서 함수가 정의되지 않아도 극한은 있습니다.${F(p.right,dg)===F(p.limit,dg)?' 표시한 자릿수에서는 극한과 같아 보이지만, 양쪽 값은 극한과 조금 다릅니다.':''}`:`왼쪽은 <strong>${F(p.leftLimit,0)}</strong>, 오른쪽은 <strong>${F(p.rightLimit,0)}</strong>에 다가갑니다. 두 값이 달라 극한은 없습니다. 그 점의 값 ${F(L.value,0)}이 있어도 마찬가지입니다.`)+'<br>식에 수를 넣어 실제 계산한 값입니다.');});
};

DVLabs.secant=el=>{
 U.setup(el,R('sc-a','접점의 시각 a (초)',0,3.5,0.1,3)+R('sc-dt','할선의 둘째 점까지의 간격 Δt (초)',0.01,1.5,0.01,1)+U.check('sc-tan','접선(Δt → 0의 극한)도 함께 그리기')+'<div class="buttons"><button type="button" data-play>Δt 줄이기 재생</button></div>');
 el.querySelector('[data-play]').onclick=()=>{const i=el.querySelector('#sc-dt');i.value=1.5;U.play(i,0.01,2600);};
 U.bind(el,()=>{const a=U.value(el,'sc-a'),dt=U.value(el,'sc-dt'),tan=U.on(el,'sc-tan'),ha=RK.h(a),m=M.avgRate(RK.h,a,a+dt),d=RK.v(a);
  const segs=[{...U.lineThrough(a,ha,m,0,4),color:OR}];if(tan)segs.push({...U.lineThrough(a,ha,d,0,4),color:BL,dash:true});
  U.result(el,rocketGraph({segs,pts:[[a,ha,BL],[a+dt,RK.h(a+dt),OR]],label:`t = ${a}인 점과 ${F(a+dt)}인 점을 잇는 할선, 기울기 ${F(m)} m/s`})+U.legend([[OR,'할선'],...(tan?[[BL,'접선',true]]:[])]),
  `할선의 기울기 = [h(${F(a+dt)}) − h(${a})] ÷ ${F(dt)} = <strong>${F(m)} m/s</strong><br>정의대로 전개하면 [h(a + Δt) − h(a)] ÷ Δt = 20 − 10a − 5Δt = 20 − ${F(10*a,0)} − ${F(5*dt)}<br>`+
  (tan?`Δt → 0이면 남는 값, 곧 미분계수 h′(${a}) = <b>${F(d,0)} m/s</b>. 할선과 접선의 기울기 차이는 5Δt = ${F(5*dt)}입니다.<br>접선의 식: y = ${F(ha)} + (${F(d,0)})(t − ${a})`:'Δt를 줄이면 이 기울기가 어떤 값에 다가가는지 본 뒤 접선을 켜서 견주어 보세요.')+(a+dt>4+1e-9?`<br><b>둘째 점의 시각 ${F(a+dt)}초는 로켓이 땅에 닿는 4초를 지났습니다.</b> 식 h(t) = 20t − 5t²은 0초부터 4초까지만 로켓의 높이이므로, 이 할선은 식의 계산일 뿐 로켓의 움직임이 아닙니다.`:'')+'<br>실제 계산한 값입니다.');});
};

const ZM={rocket:{a:1,half:1,name:'로켓 높이 h(t), t = 1초 근처'},abs:{a:0,half:2,name:'f(x) = |x|, x = 0 근처'},cubic:{a:1,half:1,name:'f(x) = x³ − 3x, x = 1 근처'}};
DVLabs.zoom=el=>{
 U.setup(el,S('zm-f','함수와 확대할 점',Object.entries(ZM).map(([k,v])=>[k,v.name]),'rocket')+R('zm-k','확대 횟수 (한 번에 2배)',0,8,1,0));
 U.bind(el,()=>{const id=U.text(el,'zm-f'),k=U.value(el,'zm-k'),Z=ZM[id],Fn=M.FUNCS[id],w=Z.half/2**k,fa=Fn.f(Z.a),m=id==='abs'?NaN:Fn.d1(Z.a),s=id==='abs'?1:Math.max(Math.abs(m),1),yh=w*s*1.4;
  const segs=Number.isFinite(m)?[{...U.lineThrough(Z.a,fa,m,Z.a-w,Z.a+w),color:OR,dash:true}]:[],gap=Number.isFinite(m)?Math.abs(Fn.f(Z.a+w)-(fa+m*w)):NaN;
  U.result(el,U.graph({xmin:Z.a-w,xmax:Z.a+w,ymin:fa-yh,ymax:fa+yh,xlabel:Fn.x,ylabel:Fn.y,curves:[{f:Fn.f}],segs,pts:[[Z.a,fa,BL]],label:`${Z.name}를 ${2**k}배 확대한 창`})+U.legend([[AC,'곡선'],...(segs.length?[[OR,'접선',true]]:[])]),
  `배율 <strong>${2**k}배</strong> · 창의 가로 폭 ${F(2*w,4)}<br>`+(Number.isFinite(m)?`창 오른쪽 끝에서 곡선과 접선의 세로 차이 <b>${F(gap,5)}</b> (창 높이의 ${F(gap/(2*yh)*100,2)}%)<br>확대할수록 곡선이 기울기 ${F(m,0)}인 직선과 구별되지 않습니다. 이 직선의 기울기가 그 점의 미분계수입니다.`:`왼쪽 기울기는 −1, 오른쪽 기울기는 +1입니다. ${2**k}배로 확대해도 꺾인 모양이 그대로여서 하나의 직선에 가까워지지 않습니다. x = 0에서 |x|는 미분할 수 없습니다.`)+'<br>실제 계산한 그래프입니다.');});
};

DVLabs.trace=el=>{
 U.setup(el,S('tr-f','함수',[['rocket',M.FUNCS.rocket.name],['cubic',M.FUNCS.cubic.name],['sine',M.FUNCS.sine.name]],'cubic')+R('tr-p','점의 위치 (정의 구간의 %)',0,100,1,10)+U.check('tr-all','도함수 그래프 전체 보기')+'<div class="buttons"><button type="button" data-play>왼쪽 끝에서 오른쪽 끝까지 재생</button></div>');
 el.querySelector('[data-play]').onclick=()=>{const i=el.querySelector('#tr-p');i.value=0;U.play(i,100,4000);};
 U.bind(el,()=>{const id=U.text(el,'tr-f'),Fn=M.FUNCS[id],[x0,x1]=Fn.dom,x=x0+(x1-x0)*U.value(el,'tr-p')/100,all=U.on(el,'tr-all'),fx=Fn.f(x),d=Fn.d1(x);
  const top=U.graph({xmin:x0,xmax:x1,ymin:Fn.range[0],ymax:Fn.range[1],xlabel:Fn.x,ylabel:Fn.y,curves:[{f:Fn.f}],segs:[{...U.lineThrough(x,fx,d,x-(x1-x0)*0.14,x+(x1-x0)*0.14),color:OR,width:3}],pts:[[x,fx,OR]],h:210,label:`${Fn.name} 그래프와 x = ${F(x)}에서의 접선`});
  const bottom=U.graph({xmin:x0,xmax:x1,ymin:Fn.drange[0],ymax:Fn.drange[1],xlabel:Fn.x,ylabel:'접선의 기울기 f′',curves:[{f:Fn.d1,color:BL,to:all?x1:x}],pts:[[x,d,OR]],h:210,label:`지금까지 지나온 점의 기울기를 이어 그린 도함수 그래프. 현재 값 ${F(d)}`});
  U.result(el,top+bottom+U.legend([[AC,'원래 함수 f'],[OR,'지금 점의 접선과 기울기'],[BL,'기울기를 이어 그린 도함수 f′']]),
  `x = <b>${F(x)}</b>에서 f = ${F(fx)}, 접선의 기울기 f′ = <strong>${F(d)}${Fn.unit?' '+Fn.unit:''}</strong><br>${Math.abs(d)<0.05?'기울기가 거의 0입니다. 위 그래프는 이 근처에서 평평하고, 아래 그래프는 가로축을 지납니다.':d>0?'기울기가 양수입니다. 위 그래프는 오르고, 아래 그래프는 가로축 위에 있습니다.':'기울기가 음수입니다. 위 그래프는 내려가고, 아래 그래프는 가로축 아래에 있습니다.'}<br>아래 그래프의 높이는 위 그래프의 높이가 아니라 위 그래프의 기울기입니다. 실제 계산한 값입니다.`);});
};
})();
