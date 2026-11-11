/* 9~12장 실험: 회전체 부피(3D), 확률밀도의 넓이, 이중적분의 기둥과 판(3D), 마지막 과제의 유량계 기록.
   계산은 모두 IGMath가 하고, 3D 그림은 IG3D가 그린다. */
(()=>{
'use strict';
const U=IGUI,M=IGMath,D3=IG3D,F=U.num,R=U.range,S=U.select;
const keys=o=>Object.entries(o).map(([k,v])=>[k,v.name]);
const viewControls=(p,yaw,pitch)=>R(p+'-yaw','그림 돌리기 (도)',0,360,5,yaw)+R(p+'-pitch','내려다보는 각 (도)',5,80,5,pitch);
/* 움직임 단추: data-play="입력ID:시작:끝". 한 번에 하나만 움직이고, 다시 누르면 멈춘다. */
function playButtons(el,list){
 const box=document.createElement('div');box.className='buttons play-row';box.innerHTML=list.map(([label,spec])=>`<button type="button" data-play="${spec}">${label}</button>`).join('');
 el.querySelector('.controls').appendChild(box);let stop=null;
 box.onclick=e=>{const b=e.target.closest('[data-play]');if(!b)return;const running=b.getAttribute('aria-pressed')==='true';if(stop){stop();stop=null;}box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));if(running)return;
  const [id,from,to]=b.dataset.play.split(':');b.setAttribute('aria-pressed','true');stop=D3.animate(el.querySelector('#'+id),{from:+from,to:+to,done:()=>{b.removeAttribute('aria-pressed');stop=null;}});};
}

IGLabs.solid=el=>{
 U.setup(el,S('so-key','그릇의 모양',keys(M.SOLIDS),'bowl')+R('so-n','원판 수 n',1,40,1,8)+R('so-level','물을 채운 높이 (전체의 %)',10,100,5,100)+R('so-sweep','옆모습 곡선을 돌린 각 (도)',0,360,5,360)+viewControls('so',30,25));
 playButtons(el,[['곡선을 한 바퀴 돌리기','so-sweep:0:360'],['한 바퀴 둘러보기','so-yaw:0:360']]);D3.drag(el,'so-yaw','so-pitch');
 U.bind(el,()=>{const key=U.text(el,'so-key'),d=M.SOLIDS[key],n=U.value(el,'so-n'),level=d.H*U.value(el,'so-level')/100,sweep=U.value(el,'so-sweep'),r=M.diskVolume(key,n,level);
  const profile=Array.from({length:41},(_,i)=>[d.H*i/40,d.rho(d.H*i/40)]),rmax=Math.max(...profile.map(p=>p[1]));
  const scene=D3.solid({disks:r.disks,sweep,H:d.H,rmax,profile});
  const chart=D3.render({...scene,yaw:U.value(el,'so-yaw'),pitch:U.value(el,'so-pitch'),label:`${d.name}. 옆모습 곡선을 세로축 둘레로 ${sweep}도 돌려 만든 입체를 원판 ${n}개로 쌓은 3차원 그림`});
  const biggest=r.disks.reduce((a,b)=>b[2]>a[2]?b:a);
  U.result(el,chart,`${d.name} · 높이 ${F(level)} dm까지 · 원판 ${n}개 · 두께 Δh = <b>${F(r.dh,3)} dm</b><br>원판 부피의 합 Σ π·ρ²·Δh = <strong>${F(r.sum)} L</strong> · 참값 π∫ρ² dh = ${d.Vs} = <b>${F(r.exact)} L</b> · 차이 ${F(r.sum-r.exact)} L<br>가장 큰 원판: 높이 ${F(biggest[0])}~${F(biggest[0]+biggest[1])} dm, 반지름 ${F(biggest[2])} dm, 부피 ${F(Math.PI*biggest[2]**2*biggest[1])} L<br>`+
  (sweep<360?`지금 그림은 곡선을 ${sweep}도만 돌린 모습입니다(한 바퀴의 ${F(sweep/360*100,0)}%, 부피 ${F(r.sum*sweep/360)} L). 주황 면이 돌리기 전의 옆모습입니다. `:'')+
  (key==='bowl'?`이 탱크는 ρ²이 h의 일차식이라 원판 한 개로도 참값이 나옵니다. 물 100 L가 고이면 수위는 ${F(M.bowlLevel(100))} dm입니다.`:'원판을 늘리면 계단 모양이 매끈해지고 합이 참값에 가까워집니다.')+'<br>1 dm³ = 1 L. 원판의 반지름은 각 원판 가운데 높이에서 잰 값이며 실제 계산입니다. 그림은 끌어서 돌릴 수 있습니다.');});
};

IGLabs.density=el=>{
 U.setup(el,S('dn-key','기다리는 시간의 분포',keys(M.DENSITY),'normal')+R('dn-a','구간의 한쪽 끝 a (분)',0,20,0.5,7)+R('dn-b','구간의 다른 쪽 끝 b (분)',0,20,0.5,13));
 U.bind(el,()=>{const key=U.text(el,'dn-key'),d=M.DENSITY[key],a=U.value(el,'dn-a'),b=U.value(el,'dn-b'),lo=Math.min(a,b),hi=Math.max(a,b),r=M.density(key,a,b);
  const chart=U.plot({lines:[{data:U.curve(d.f,0,20,200)}],fills:lo<hi?[{data:U.curve(d.f,lo,hi,100),opacity:.42}]:[],marks:[[lo,'var(--blue)'],[hi,'var(--blue)']],xmin:0,xmax:20,ymin:0,ymax:d.ymax,xlabel:'기다리는 시간 x (분)',ylabel:'확률밀도 f(x) (1/분)',digits:2,label:`${d.name}의 확률밀도 곡선과 ${lo}분에서 ${hi}분 사이에 칠한 넓이`});
  U.result(el,chart,`${d.name}<br>P(${F(lo,1)} ≤ X ≤ ${F(hi,1)}) = ∫ f(x) dx = <strong>${F(r.prob,4)}</strong> (${F(r.prob*100,1)}%) · 닫힌 식으로 구한 값 ${F(r.cdf,4)}<br>0~20분 전체 넓이 <b>${F(r.total,4)}</b> · 평균 ∫ x·f(x) dx = <b>${F(r.mean)}분</b> · 표준편차 ${F(r.sd)}분<br>`+
  (lo===hi?'구간의 폭이 0이면 넓이도 0입니다. 연속 분포에서 정확히 한 시각이 나올 확률은 0입니다.':`구간 가운데의 밀도 ${F(r.height,4)} (1/분)는 확률이 아닙니다. 폭 ${F(hi-lo,1)}분을 곱한 ${F(r.height*(hi-lo),4)}은 직사각형 하나로 어림한 넓이입니다. 구간이 좁을수록 위의 넓이와 가까워지고, 넓으면 크게 어긋납니다.`)+
  (key==='uniform'?'':` 전체 넓이가 1보다 조금 작은 것은 0분 앞과 20분 뒤의 꼬리를 그림 밖에 두었기 때문입니다(이론값: 평균 ${d.mean}분, 표준편차 ${F(d.sd)}분).`)+'<br>넓이는 심프슨 2,000칸으로 더한 실제 계산입니다.');});
};

IGLabs.columns=el=>{
 U.setup(el,S('cl-key','바닥 위의 곡면',keys(M.SURFACES),'dome')+S('cl-mode','나누는 방법',[['cols','가로·세로로 잘라 기둥 n×n개'],['slabs','x 방향으로만 잘라 판 n장']],'cols')+R('cl-n','한 방향의 칸 수 n',1,12,1,4)+viewControls('cl',35,30));
 playButtons(el,[['칸 수를 1에서 12까지 늘리기','cl-n:1:12'],['한 바퀴 둘러보기','cl-yaw:0:360']]);D3.drag(el,'cl-yaw','cl-pitch');
 U.bind(el,()=>{const key=U.text(el,'cl-key'),d=M.SURFACES[key],mode=U.text(el,'cl-mode'),n=U.value(el,'cl-n'),view={yaw:U.value(el,'cl-yaw'),pitch:U.value(el,'cl-pitch')},geo={ax:d.ax,bx:d.bx,ay:d.ay,by:d.by,zmax:d.zmax};
  if(mode==='cols'){const r=M.columns(key,n),tall=r.cols.reduce((a,b)=>b[4]>a[4]?b:a);
   U.result(el,D3.render({...D3.boxes({cols:r.cols,...geo}),...view,label:`${d.name} 아래를 기둥 ${n*n}개로 채운 3차원 그림`}),`${d.name}<br>기둥 ${n} × ${n} = ${n*n}개 · 바닥 한 칸 ${F(r.dx,3)} × ${F(r.dy,3)}<br>기둥 부피의 합 ΣΣ f(x, y)·Δx·Δy = <strong>${F(r.sum,4)}</strong> · 참값 <b>${F(r.exact,4)}</b> · 차이 ${F(r.sum-r.exact,4)}<br>가장 높은 기둥의 높이 ${F(tall[4],3)}, 부피 ${F(tall[4]*r.dx*r.dy,4)}<br>`+(key==='plane'?'평면에서는 기둥 가운데의 높이가 그 칸의 평균 높이와 같아, 기둥 한 개로도 참값이 나옵니다.':'칸을 늘리면 기둥 윗면이 곡면에 가까워지고 합이 참값으로 모입니다.')+'<br>기둥의 높이는 각 칸 가운데에서 잰 값이며 실제 계산입니다. 그림은 끌어서 돌릴 수 있습니다.');return;}
  const r=M.slabs(key,n),show=r.list.slice(0,4).map(s=>`A(${F(s.x)}) = ${F(s.area,3)}`).join(', ');
  U.result(el,D3.render({...D3.slabs({slabs:r.list.map(s=>[s.x0,s.dx,s.curve]),...geo}),...view,label:`${d.name} 아래를 x 방향으로 자른 판 ${n}장으로 채운 3차원 그림. 주황 면이 단면`}),`${d.name}<br>판 ${n}장 · 두께 Δx = ${F(r.dx,3)} · 단면 넓이 ${d.As} (y로 먼저 적분한 값)<br>${show}${n>4?', …':''}<br>판 부피의 합 Σ A(x)·Δx = <strong>${F(r.sum,4)}</strong> · 참값 <b>${F(r.exact,4)}</b> · 차이 ${F(r.sum-r.exact,4)}<br>안쪽 적분(y)으로 주황 단면의 넓이를 구하고, 바깥 적분(x)으로 그 넓이를 두께만큼씩 더합니다. 9장의 원판 쌓기와 같은 계산입니다.<br>단면 넓이는 닫힌 식, 합은 각 판 가운데의 x에서 잰 실제 계산입니다.`);});
};

IGLabs.final=el=>{
 const methods=[['trap','사다리꼴'],['left','왼쪽 직사각형'],['right','오른쪽 직사각형'],['simpson','심프슨']];
 U.setup(el,S('fn-step','유량계를 읽는 간격',[[4,'4분'],[3,'3분'],[2,'2분'],[1,'1분'],[0.5,'30초']],2)+S('fn-method','그림에 보일 방법',methods,'trap'));
 U.bind(el,()=>{const step=U.value(el,'fn-step'),method=U.text(el,'fn-method'),r=M.finalEstimate(step),pts=r.rows,T=M.FINAL.T,n=pts.length-1;
  let rects=[],fills=[],edge=[];
  if(method==='left'||method==='right')rects=pts.slice(0,n).map((p,i)=>[p[0],step,method==='left'?p[1]:pts[i+1][1],'var(--blue)']);
  else if(method==='trap'||n%2){edge=pts;fills=[{data:pts,color:'var(--blue)',opacity:.36}];}
  else{for(let i=0;i<n;i+=2){const [x0,y0]=pts[i],y1=pts[i+1][1],y2=pts[i+2][1];for(let k=0;k<=10;k++){const t=k/5;edge.push([x0+t*step,y0*(t-1)*(t-2)/2-y1*t*(t-2)+y2*t*(t-1)/2]);}}fills=[{data:edge,color:'var(--blue)',opacity:.36}];}
  const chart=U.plot({lines:edge.length?[{data:edge,color:'var(--blue)',w:1.6}]:[],rects,fills,points:pts.map(p=>[p[0],p[1],'var(--orange)',n>24?3:5]),xmin:0,xmax:T,ymin:0,ymax:16,xlabel:'시간 t (분)',ylabel:'유량계 값 (L/분)',label:`${step}분 간격으로 읽은 유량계 값 ${pts.length}개와, 고른 방법이 그 점들로 만든 도형`});
  const e=r.est,cell=v=>v===null?'칸 수가 홀수라 쓸 수 없음':`${F(v,1)} L · ${v>r.room?'넘침':'넘치지 않음'}`;
  U.result(el,chart,`읽은 값 ${pts.length}개 (${step}분 간격): ${pts.slice(0,7).map(p=>F(p[1],1)).join(', ')}${pts.length>7?', …':''} L/분`+U.table(['방법','12분 동안 들어온 양의 추정 · 판정'],[['왼쪽 직사각형',cell(e.left)],['오른쪽 직사각형',cell(e.right)],['사다리꼴',cell(e.trap)],['심프슨',cell(e.simpson)]])+
  `탱크의 남은 자리 ${F(M.FINAL.capacity,1)} − ${F(M.FINAL.start,1)} = <b>${F(r.room,1)} L</b> · 추정값의 범위 <strong>${F(r.lo,1)} ~ ${F(r.hi,1)} L</strong><br>`+
  (r.verdict==='split'?'방법에 따라 판정이 갈립니다. 이 간격의 기록만으로는 넘치는지 말할 수 없습니다.':r.verdict==='over'?'네 방법 모두 남은 자리보다 큽니다. 이 간격에서는 넘친다고 판단할 수 있습니다.':'쓸 수 있는 방법 모두 남은 자리보다 작습니다. 다만 방법들이 서로 얼마나 다른지, 간격을 줄여도 같은지 확인해야 합니다.')+
  '<br>표의 값은 소수 첫째 자리까지 읽은 것이고, 추정은 그 값만으로 한 실제 계산입니다. 유량계 기록은 설명용 가상 값입니다.');});
};
})();
