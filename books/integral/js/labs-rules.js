/* 5~8장 실험: 원시함수와 적분상수, 치환적분, 부분적분, 수치적분 네 방법.
   계산은 모두 IGMath가 하고, 여기서는 입력을 읽어 그림과 결과 문장을 그린다. */
(()=>{
'use strict';
const U=IGUI,M=IGMath,F=U.num,R=U.range,S=U.select;
const keys=o=>Object.entries(o).map(([k,v])=>[k,v.name]);
const span=(data)=>{const ys=data.map(p=>p[1]).filter(Number.isFinite),lo=Math.min(0,...ys),hi=Math.max(0,...ys),pad=(hi-lo)*0.08||1;return [lo-(lo<0?pad:0),hi+pad];};

IGLabs.family=el=>{
 U.setup(el,S('fm-fn','적분할 함수',keys(M.FAMILY),'rain')+R('fm-c','적분상수 C',-5,5,0.5,0)+R('fm-p','확인할 점의 위치 (구간의 %)',0,100,5,50));
 U.bind(el,()=>{const d=M.FAMILY[U.text(el,'fm-fn')],C=U.value(el,'fm-c'),[lo,hi]=d.dom,x=lo+(hi-lo)*U.value(el,'fm-p')/100,h=1e-4,vr=d.fs.includes('t')?'t':'x';
  const slope=(d.F(x+h)-d.F(Math.max(x-h,lo)))/(x+h-Math.max(x-h,lo)),fc=U.curve(d.f,lo,hi),Fc=U.curve(d.F,lo,hi),[f0,f1]=span(fc),[g0,g1]=span(Fc.map(([a,b])=>[a,b+C]).concat(Fc.map(([a,b])=>[a,b+C+2]),Fc.map(([a,b])=>[a,b+C-2])));
  const top=U.plot({lines:[{data:fc}],points:[[x,d.f(x)]],marks:[[x,'var(--blue)']],xmin:lo,xmax:hi,ymin:f0,ymax:f1,xlabel:vr,ylabel:`f(${vr})`,label:`적분할 함수 ${d.fs}의 그래프`});
  const bottom=U.plot({lines:[{data:Fc.map(([a,b])=>[a,b+C+2]),color:'var(--muted)',dashed:true},{data:Fc.map(([a,b])=>[a,b+C-2]),color:'var(--muted)',dashed:true},{data:Fc.map(([a,b])=>[a,b+C]),color:'var(--blue)'}],points:[[x,d.F(x)+C]],marks:[[x,'var(--blue)']],xmin:lo,xmax:hi,ymin:g0,ymax:g1,xlabel:vr,ylabel:`F(${vr}) + C`,label:`원시함수 ${d.Fs} + C의 그래프. 점선은 C가 2만큼 크고 작은 두 곡선`});
  U.result(el,U.stack(top,bottom),`∫ (${d.fs}) d${vr} = <strong>${d.Fs} + C</strong><br>쓴 규칙: ${d.rule}<br>${vr} = ${F(x)}에서 F(${vr}) + C = ${F(d.F(x)+C,3)} · 그 점에서 잰 기울기 <b>${F(slope,3)}</b> · f(${vr}) = <b>${F(d.f(x),3)}</b><br>C를 바꾸면 곡선이 위아래로 옮겨질 뿐 기울기는 그대로입니다. 그래서 ${F(lo,1)}에서 ${F(x)}까지의 정적분 (F(${F(x)}) + C) − (F(${F(lo,1)}) + C) = <b>${F(d.F(x)-d.F(lo),3)}</b>에서는 C가 지워집니다.<br>${x-h<lo?'구간의 왼쪽 끝이라 기울기는 오른쪽으로 폭 0.0001만 잰 값이고, 그래서 f의 값과 조금 다를 수 있습니다. 실제 계산입니다.':'기울기는 폭 0.0002의 차분으로 잰 실제 계산입니다.'}`);});
};

IGLabs.subst=el=>{
 U.setup(el,S('sb-key','바꿀 적분',keys(M.SUBST),'cos')+R('sb-b','위끝 b (가장 큰 값의 %)',10,100,5,60)+R('sb-n','x축을 나눈 칸 수 n',2,40,1,6));
 U.bind(el,()=>{const key=U.text(el,'sb-key'),d=M.SUBST[key],b=d.bmax*U.value(el,'sb-b')/100,n=U.value(el,'sb-n'),r=M.substitution(key,b,n),first=r.rows[0],last=r.rows[n-1];
  const fx=U.curve(d.f,0,b),gu=U.curve(d.g,r.ua,r.ub),[x0,x1]=span(fx),[u0,u1]=span(gu);
  const top=U.plot({lines:[{data:fx}],rects:r.rows.map(q=>[q.x,q.dx,q.hx,'var(--accent)']),xmin:0,xmax:b,ymin:x0,ymax:x1,xlabel:d.xs,ylabel:d.fs,digits:2,label:`원래 변수로 그린 ${d.fs}의 그래프와 폭이 같은 직사각형 ${n}개`});
  const bottom=U.plot({lines:[{data:gu,color:'var(--blue)'}],rects:r.rows.map(q=>[q.u0,q.du,q.hu,'var(--blue)']),xmin:r.ua,xmax:r.ub,ymin:u0,ymax:u1,xlabel:d.us,ylabel:d.gs,digits:2,label:`새 변수 u로 그린 ${d.gs}의 그래프와, 같은 점을 옮겨 폭이 달라진 직사각형 ${n}개`});
  U.result(el,U.stack(top,bottom),`${d.ds} · 구간 x: 0 → ${F(b)} 이 u: ${F(r.ua)} → <b>${F(r.ub)}</b>로 바뀝니다.<br>x로 더한 합 <b>${F(r.sumX,4)}</b> · u로 더한 합 <b>${F(r.sumU,4)}</b> · 참값 <strong>${F(r.exact,4)}</strong><br>마지막 칸: x에서는 폭 ${F(last.dx,3)} × 높이 ${F(last.hx,3)} = ${F(last.dx*last.hx,4)}, u에서는 폭 ${F(last.du,3)} × 높이 ${F(last.hu,3)} = ${F(last.du*last.hu,4)}<br>`+
  (key==='unit'?'u = 60t는 모든 칸의 폭을 똑같이 60배로 늘리고 높이를 60분의 1로 줄이므로, 칸마다 넓이가 정확히 같습니다.':'u = x²는 x가 클수록 칸을 더 넓게 늘립니다. 칸이 가늘어질수록 늘어난 폭은 2x·Δx에 가까워지고 두 합은 같은 참값으로 모입니다.')+'<br>왼쪽 끝 높이로 더한 실제 계산입니다.');});
};

IGLabs.parts=el=>{
 U.setup(el,S('pt-key','적분할 식',keys(M.PARTS),'storm')+R('pt-b','위끝 b (가장 큰 값의 %)',10,100,5,50));
 U.bind(el,()=>{const key=U.text(el,'pt-key'),d=M.PARTS[key],b=d.lo+(d.bmax-d.lo)*U.value(el,'pt-b')/100,r=M.parts(key,b),fx=U.curve(d.f,d.lo,d.bmax),seg=U.curve(d.f,d.lo,b,80),[y0,y1]=span(fx);
  const chart=U.plot({lines:[{data:fx}],fills:[{data:seg.map(([a,v])=>[a,Math.max(v,0)]),opacity:.38},{data:seg.map(([a,v])=>[a,Math.min(v,0)]),color:'var(--orange)',opacity:.42}],marks:[[b,'var(--blue)']],xmin:d.lo,xmax:d.bmax,ymin:y0,ymax:y1,xlabel:'x',ylabel:'적분할 식의 값',digits:2,label:`적분할 식의 그래프와 ${F(d.lo,1)}에서 ${F(b)}까지 칠한 넓이`});
  U.result(el,chart,U.table(['고른 것','미분하거나 적분한 것'],[[d.us,d.dus],[d.dvs,d.vs]])+`구간 ${F(d.lo,1)} → ${F(b)}<br>[u·v] = <b>${F(r.uv,4)}</b> · ∫ v du = <b>${F(r.vdu,4)}</b><br>∫ u dv = [u·v] − ∫ v du = ${F(r.uv,4)} − (${F(r.vdu,4)}) = <strong>${F(r.value,4)}</strong>${key==='storm'?' L':''}<br>심프슨 400칸으로 원래 식을 직접 더한 값 <b>${F(r.numeric,4)}</b> · 닫힌 식의 값 ${F(r.exact,4)}<br>`+
  (key==='storm'?`소나기가 시작하고 ${F(b)}분 동안 고인 물입니다. 끝없이 기다려도 32 L를 넘지 않습니다.`:key==='ln'?'ln x 하나뿐인 식도 dv = dx로 두면 곱의 꼴이 됩니다.':'u를 미분하면 상수가 되어 남은 적분 ∫ v du가 원래 적분보다 쉬워집니다.')+' 실제 계산입니다.');});
};

/* 고른 방법이 곡선을 무엇으로 바꿔 더하는지 그린다: 직사각형, 사다리꼴(꺾은선), 포물선 조각 */
function shapes(d,n,method){
 const dx=(d.b-d.a)/n,xs=Array.from({length:n+1},(_,i)=>d.a+i*dx);
 if(method==='left'||method==='mid')return {rects:M.riemann(d.f,d.a,d.b,n,method).rects,fills:[]};
 if(method==='trap')return {rects:[],fills:[{data:xs.map(x=>[x,d.f(x)]),color:'var(--blue)',opacity:.36}],edge:xs.map(x=>[x,d.f(x)])};
 const m=n%2?n+1:n,h=(d.b-d.a)/m,pts=[];
 for(let i=0;i<m;i+=2){const x0=d.a+i*h,y0=d.f(x0),y1=d.f(x0+h),y2=d.f(x0+2*h);for(let k=0;k<=10;k++){const t=k/5;pts.push([x0+t*h,y0*(t-1)*(t-2)/2-y1*t*(t-2)+y2*t*(t-1)/2]);}}
 return {rects:[],fills:[{data:pts,color:'var(--blue)',opacity:.36}],edge:pts};
}
IGLabs.numeric=el=>{
 U.setup(el,S('nm-key','계산할 적분',keys(M.NUMERIC),'gauss')+S('nm-n','칸 수 n',[2,4,8,16,32,64].map(v=>[v,String(v)]),4)+S('nm-method','그림에 보일 방법',M.METHODS,'trap'));
 U.bind(el,()=>{const key=U.text(el,'nm-key'),d=M.NUMERIC[key],n=U.value(el,'nm-n'),method=U.text(el,'nm-method'),rows=M.numeric(key,n),sh=shapes(d,n,method),fc=U.curve(d.f,d.a,d.b),[y0,y1]=span(fc);
  const chart=U.plot({lines:[{data:fc},...(sh.edge?[{data:sh.edge,color:'var(--blue)',w:1.6}]:[])],rects:sh.rects,fills:sh.fills,xmin:d.a,xmax:d.b,ymin:y0,ymax:y1,xlabel:'x',ylabel:'f(x)',digits:2,label:`${d.name}의 곡선과, ${M.METHODS.find(x=>x[0]===method)[1]} 방법이 ${n}칸으로 바꿔 더하는 도형`});
  const e=v=>v<5e-13?'0':v.toExponential(2).replace('e-','×10^−').replace('e+','×10^');
  U.result(el,chart,`${d.name} · 참값 <strong>${F(d.exact,6)}</strong>${d.unit?' '+d.unit:''} · ${d.note}`+U.table(['방법',`n = ${n}의 값`,'오차의 크기','n을 두 배로 하면 오차가'],rows.map(r=>[r.name,F(r.value,6),e(r.error),r.ratio===null?'이미 0':`1/${F(r.ratio,1)}로 줄어듦`]))+
  `같은 칸 수에서 오차가 가장 작은 방법은 <b>${rows.reduce((a,b)=>b.error<a.error?b:a).name}</b>입니다. `+(key==='root'?'이 함수는 x = 0에서 곡선이 수직으로 서기 때문에 어느 방법도 제 속도를 내지 못합니다.':key==='rain'?'이차식이라 포물선 조각으로 잇는 심프슨 공식은 곡선과 완전히 겹칩니다.':key==='sin'?'양 끝에서 sin x가 0이라 왼쪽 직사각형 합이 사다리꼴 합과 같은 값이 됩니다.':'왼쪽 직사각형은 약 1/2, 가운데점과 사다리꼴은 약 1/4, 심프슨은 약 1/16로 줄어듭니다.')+'<br>실제 계산입니다. 심프슨 공식은 칸 수가 짝수일 때만 씁니다.');});
};
})();
