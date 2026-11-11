/* 1~7장 실험. 계산은 ELMath, 3차원 그림은 EL3D, 조작 부품은 ELUI가 맡는다. 모든 숫자는 브라우저에서 실제로 계산한다. */
(()=>{
'use strict';
const L=ELLabs,U=ELUI,M=ELMath,D3=EL3D,{num,vec,esc}=U;
const C={a:'var(--accent)',b:'var(--blue)',o:'var(--orange)',m:'var(--muted)'};
const drinkOptions=M.DRINKS.map(d=>[d.id,`${d.name} ${vec(d.v)}`]);
const recipe=(el,ids=['x0','x1','x2'])=>ids.map(id=>U.value(el,id));
const sliders=(v,step=0.5)=>M.AXES.map((a,i)=>U.range('x'+i,`${a} (${M.UNITS[i]})`,0,4,step,v[i])).join('');
const words=v=>`샷 ${num(v[0])}잔, 우유 ${num(v[1]*100)} mL, 시럽 ${num(v[2])}펌프`;
const menuPoints=(s,skip)=>M.DRINKS.forEach(d=>{if(d.id!==skip)s.point(d.v,C.m,{r:3.5,label:d.name,labelColor:C.m,size:11});});

/* 1장: 숫자 세 개를 공간의 점과 화살표로. */
L.vector=el=>{
 const stage=U.setup3(el,sliders([2,2,0]));let v=[2,2,0];
 const view=D3.mount(stage,{labels:M.AXES,draw(s){
  menuPoints(s);
  const [x,y,z]=v;
  s.line([0,0,0],[x,0,0],C.a,{width:2.4,dash:'5 4'}).line([x,0,0],[x,y,0],C.b,{width:2.4,dash:'5 4'}).line([x,y,0],[x,y,z],C.o,{width:2.4,dash:'5 4'});
  s.arrow([0,0,0],v,'var(--text)',{width:3.4,label:vec(v)});
  s.label=`샷·우유·시럽 축이 있는 공간에서 원점부터 점 ${vec(v)}까지 그린 화살표. 점선은 샷 ${num(x)}, 우유 ${num(y)}, 시럽 ${num(z)}만큼 차례로 간 길`;
 }});
 U.bind(el,()=>{
  v=recipe(el);view.redraw();const d=M.matchDrink(v);
  U.say(el,`벡터 <b>${vec(v)}</b>${U.josa(vec(v),'은는')} ${words(v)}인 레시피입니다. 점선을 따라 샷 축으로 ${num(v[0])}, 우유 축으로 ${num(v[1])}, 시럽 축으로 ${num(v[2])}만큼 가면 화살표 끝에 닿습니다. ${d?`메뉴의 <b>${esc(d.name)}</b>와 같은 점입니다.`:'메뉴 여섯 음료 가운데 이 점에 놓인 음료는 없습니다.'}`);
 });
};

/* 2장: 실수배와 덧셈. */
const EXTRAS=[['shot','샷 1잔 추가 (1, 0, 0)',[1,0,0]],['milk','우유 100 mL 추가 (0, 1, 0)',[0,1,0]],['syrup','시럽 1펌프 추가 (0, 0, 1)',[0,0,1]],...M.DRINKS.map(d=>[d.id,`${d.name} ${vec(d.v)}`,d.v])];
L.addscale=el=>{
 const stage=U.setup3(el,U.select('a','처음 음료 a',drinkOptions,'latte')+U.range('ka','a에 곱할 수 k',0,2,0.5,1)+U.select('b','더할 벡터 b',EXTRAS.map(e=>[e[0],e[1]]),'syrup')+U.range('kb','b에 곱할 수 m',0,2,0.5,2));
 let st={a:[2,2,0],b:[0,0,1],ka:1,kb:2};
 const view=D3.mount(stage,{labels:M.AXES,range:8,step:2,draw(s){
  const p=M.scale(st.a,st.ka),q=M.scale(st.b,st.kb),sum=M.add(p,q);
  s.arrow([0,0,0],p,C.a,{label:`k·a ${vec(p)}`}).arrow(p,sum,C.b,{label:''}).arrow([0,0,0],q,C.b,{opacity:.35,dash:'4 4'}).line(q,sum,C.a,{dash:'4 4',opacity:.5});
  s.arrow([0,0,0],sum,C.o,{width:3.6,label:`합 ${vec(sum)}`});
  s.label=`k·a ${vec(p)} 끝에 m·b ${U.J(vec(q),'을를')} 이어 붙여 합 ${vec(sum)}에 닿는 화살표 셋. 점선은 b를 먼저 가도 같은 점에 닿는 길`;
 }});
 U.bind(el,()=>{
  st={a:M.drink(el.querySelector('#a').value).v,b:EXTRAS.find(e=>e[0]===el.querySelector('#b').value)[2],ka:U.value(el,'ka'),kb:U.value(el,'kb')};
  view.redraw();const p=M.scale(st.a,st.ka),q=M.scale(st.b,st.kb),sum=M.add(p,q),d=M.matchDrink(sum);
  U.say(el,`${num(st.ka)}·${vec(st.a)} + ${num(st.kb)}·${vec(st.b)} = ${vec(p)} + ${vec(q)} = <b>${vec(sum)}</b>. 같은 자리의 숫자끼리 더했습니다. ${d?`합은 메뉴의 <b>${esc(d.name)}</b>와 같습니다.`:`합은 ${words(sum)}인 레시피입니다.`} 점선 길처럼 b를 먼저 가고 a를 나중에 가도 같은 점에 닿습니다.`);
 });
};

/* 3장: 길이와 거리. */
L.length=el=>{
 const stage=U.setup3(el,sliders([2,1.5,0.5])+U.select('target','거리를 잴 음료',drinkOptions,'latte'));let v=[2,1.5,0.5],t=M.drink('latte');
 const view=D3.mount(stage,{labels:M.AXES,draw(s){
  menuPoints(s,t.id);
  s.arrow([0,0,0],v,C.a,{label:`내 레시피 ${vec(v)}`}).point(t.v,C.b,{r:6,label:t.name,labelColor:C.b}).line(v,t.v,C.o,{width:3,dash:'6 4'});
  s.text(M.scale(M.add(v,t.v),.5),`거리 ${num(M.dist(v,t.v))}`,C.o,{dy:-8});
  s.label=`내 레시피 ${U.J(vec(v),'과와')} ${t.name} ${vec(t.v)} 사이를 잇는 점선. 거리 ${num(M.dist(v,t.v))}`;
 }});
 U.bind(el,()=>{
  v=recipe(el);t=M.drink(el.querySelector('#target').value);view.redraw();
  const diff=M.sub(v,t.v),d=M.dist(v,t.v),rows=M.DRINKS.map(x=>({name:x.name,d:M.dist(v,x.v)})).sort((p,q)=>p.d-q.d);
  U.say(el,`내 레시피 ${vec(v)}의 길이는 √(${v.map(x=>num(x*x)).join(' + ')}) = <b>${num(M.norm(v))}</b>입니다. ${esc(t.name)}와의 차이는 ${vec(diff)}, 거리는 √(${diff.map(x=>num(x*x)).join(' + ')}) = <b>${num(d)}</b>, 거리의 제곱은 ${num(d*d)}입니다. 지금 가장 가까운 음료는 <b>${esc(rows[0].name)}</b>(거리 ${num(rows[0].d)})입니다.`,
   U.table(['음료','내 레시피와의 거리'],rows.map(r=>[r.name,num(r.d)]),i=>i===0));
 });
};

/* 4장: 내적은 곱해서 더하기. */
L.dot=el=>{
 const rateOptions=Object.entries(M.RATES).map(([k,r])=>[k,`${r.name} ${vec(r.w)} ${r.unit}`]);
 const stage=U.setup3(el,sliders([2,2,0])+U.select('rate','곱할 값 w (재료 한 단위마다)',rateOptions,'cost')+U.select('other','방향을 견줄 음료',drinkOptions,'flat'));
 let v=[2,2,0],o=M.drink('flat');
 const view=D3.mount(stage,{labels:M.AXES,draw(s){
  s.arrow([0,0,0],v,C.a,{label:`x ${vec(v)}`}).arrow([0,0,0],o.v,C.b,{label:`${o.name} ${vec(o.v)}`});
  const ang=M.angleDeg(v,o.v);
  s.label=`원점에서 나간 두 화살표, 내 레시피 ${U.J(vec(v),'과와')} ${o.name} ${vec(o.v)}. 사이 각도 ${ang===null?'없음':num(ang,1)+'도'}`;
 }});
 U.bind(el,()=>{
  v=recipe(el);o=M.drink(el.querySelector('#other').value);view.redraw();
  const r=M.RATES[el.querySelector('#rate').value],t=M.terms(r.w,v),total=M.dot(r.w,v),c=M.cosine(v,o.v),ang=M.angleDeg(v,o.v);
  U.say(el,`${esc(r.name)} = ${r.w.map((w,i)=>`${num(w)}×${num(v[i])}`).join(' + ')} = ${t.map(x=>num(x)).join(' + ')} = <b>${num(total)} ${r.unit}</b>. 같은 자리끼리 곱해서 모두 더한 값이 내적 w·x입니다. `+
   (c===null?'레시피가 (0, 0, 0)이면 방향이 없어 각도를 잴 수 없습니다.':`${esc(o.name)}와의 내적은 ${num(M.dot(v,o.v))}, 두 길이의 곱은 ${U.J(num(M.norm(v)*M.norm(o.v)),'이')}므로 코사인은 <b>${num(c)}</b>, 사이 각도는 <b>${num(ang,1)}°</b>입니다.`),
   U.table(['재료','양 x','한 단위 값 w','곱 w×x'],[...M.AXES.map((a,i)=>[a,num(v[i]),num(r.w[i]),num(t[i])]),['합 (내적)','','',num(total)]],i=>i===3));
 });
};

/* 5장: 뉴런 하나 = 가중합 + 편향 + 활성화. 평면 w·x+b=0이 레시피 공간을 둘로 가른다. */
const EDGES=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
function planeInBox(w,b,size){
 const c=D3.unitCorners(null,size),pts=[];
 for(const [i,j] of EDGES){const fi=M.dot(w,c[i])+b,fj=M.dot(w,c[j])+b;if(fi===fj)continue;const t=fi/(fi-fj);if(t>=0&&t<=1)pts.push(M.add(c[i],M.scale(M.sub(c[j],c[i]),t)));}
 if(pts.length<3)return null;
 const mid=M.scale(pts.reduce(M.add),1/pts.length),n=M.scale(w,1/M.norm(w));
 let u=Math.abs(n[2])<.9?[0,0,1]:[1,0,0];u=M.sub(u,M.scale(n,M.dot(u,n)));u=M.scale(u,1/M.norm(u));
 const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]];
 return {mid,pts:pts.map(p=>({p,a:Math.atan2(M.dot(M.sub(p,mid),v),M.dot(M.sub(p,mid),u))})).sort((p,q)=>p.a-q.a).map(x=>x.p)};
}
const ACTS=[['step','계단 (0보다 크면 1)'],['relu','ReLU (음수는 0)'],['sigmoid','시그모이드 (0~1)'],['none','없음 (가중합 그대로)']];
L.neuron=el=>{
 const T=M.TASTE,stage=U.setup3(el,M.AXES.map((a,i)=>U.range('w'+i,`${a}의 가중치 w${i+1}`,-2,2,0.5,T.w[i])).join('')+U.range('bias','편향 b',-4,4,0.5,T.b)+U.select('act','활성화 함수',ACTS,'step'));
 let w=T.w.slice(),b=T.b;
 const view=D3.mount(stage,{labels:M.AXES,draw(s){
  const pl=M.norm(w)>0?planeInBox(w,b,4):null;
  if(pl){s.poly(pl.pts,C.o,.22,{strokeWidth:1.6});s.arrow(pl.mid,M.add(pl.mid,M.scale(w,.9/M.norm(w))),C.o,{width:2.4,label:'w 방향'});}
  M.DRINKS.forEach(d=>{const z=M.dot(w,d.v)+b;s.point(d.v,z>0?C.a:C.m,{r:6,label:d.name,labelColor:z>0?C.a:C.m,size:11});});
  s.label=`레시피 공간을 가르는 평면 w·x+b=0과 음료 여섯 점. 가중합이 0보다 큰 음료는 ${M.DRINKS.filter(d=>M.dot(w,d.v)+b>0).map(d=>d.name).join(', ')||'없음'}`;
 }});
 U.bind(el,()=>{
  w=[0,1,2].map(i=>U.value(el,'w'+i));b=U.value(el,'bias');view.redraw();
  const act=el.querySelector('#act').value,rows=M.DRINKS.map(d=>({d,...M.neuron(w,b,d.v,act)})),on=rows.filter(r=>r.z>0);
  U.say(el,`가중합 z = ${w.map((x,i)=>`${x<0?`(${num(x)})`:num(x)}×${M.AXES[i]}`).join(' + ')} + (${num(b)}). 여섯 음료 가운데 z가 0보다 큰 음료는 <b>${on.length}개</b>${on.length?`(${on.map(r=>esc(r.d.name)).join(', ')})`:''}입니다. `+
   (M.norm(w)===0?'가중치가 모두 0이면 모든 음료의 z가 편향과 같아 평면이 생기지 않습니다.':'주황색 면이 z = 0인 곳이고, w 방향 화살표 쪽이 z가 커지는 쪽입니다.')+` 편향을 바꾸면 면이 기울기는 그대로인 채 나란히 움직입니다.`,
   U.table(['음료','가중합 z','출력'],rows.map(r=>[r.d.name,num(r.z),num(r.out)]),i=>rows[i].z>0));
 });
};

/* 6장: 행렬 × 벡터 = 가중합 여러 개. */
const SETS={
 two:{name:'원가·열량 (2×3)',rows:['원가(원)','열량(kcal)'],W:[M.RATES.cost.w,M.RATES.kcal.w]},
 three:{name:'원가·열량·카페인 (3×3)',rows:['원가(원)','열량(kcal)','카페인(mg)'],W:M.MENU},
 taste:{name:'진한 맛·단맛 점수 (2×3)',rows:M.NET.hidden,W:M.NET.W1}
};
L.matrix=el=>{
 U.setup(el,sliders([2,2,0])+U.select('set','행렬 W (행 하나가 출력 하나)',Object.entries(SETS).map(([k,s])=>[k,s.name]),'two')+U.range('row','자세히 볼 행',1,3,1,1));
 U.bind(el,()=>{
  const v=recipe(el),S=SETS[el.querySelector('#set').value],y=M.matVec(S.W,v),r=Math.min(U.value(el,'row'),S.W.length)-1,[m,n]=M.shape(S.W);
  const chart=`<div class="el-mv"><div>${U.matrix(S.W,{on:i=>i===r,rows:S.rows,label:`행렬 W, ${m}행 ${n}열`})}<small>W (${m}×${n})</small></div><span>×</span><div>${U.matrix(v.map(x=>[x]),{label:'벡터 x'})}<small>x (${n})</small></div><span>=</span><div>${U.matrix(y.map(x=>[x]),{on:i=>i===r,label:'결과 Wx'})}<small>Wx (${m})</small></div></div>`;
  U.result(el,chart,`${esc(S.rows[r])} 행: ${S.W[r].map((w,i)=>`${num(w)}×${num(v[i])}`).join(' + ')} = <b>${num(y[r])}</b>. 행마다 4장의 내적을 한 번씩 계산합니다. 숫자 ${n}개짜리 벡터가 들어가 숫자 <b>${m}개</b>짜리 벡터 ${U.J(vec(y),'이가')} 나왔습니다. 행의 수가 출력의 수이고, 열의 수는 입력의 수와 같아야 합니다.`);
 });
};

/* 7장: 행렬은 공간 전체를 옮긴다. */
const FACE_COLORS=[C.o,C.b,C.a];
function drawCube(s,Mx,o={}){
 s.box(D3.unitCorners(Mx),C.m,o.ghost?0:.3,o.ghost?{stroke:'var(--muted)',strokeWidth:1}:{colors:FACE_COLORS,stroke:'var(--text)'});
 if(!o.ghost)['e₁','e₂','e₃'].forEach((n,j)=>s.arrow([0,0,0],M.column(Mx,j),[C.a,C.b,C.o][j],{width:3,label:o.names===false?'':n}));
}
const transformOptions=Object.entries(M.TRANSFORMS).map(([k,t])=>[k,t.name]);
const volumeWord=d=>Math.abs(d)<1e-9?'상자가 납작해져 부피가 0이 되었습니다':`부피는 ${num(Math.abs(d))}배${d<0?'이고 안팎이 뒤집혔습니다':'입니다'}`;
L.transform=el=>{
 const stage=U.setup3(el,U.select('kind','변환 행렬',transformOptions,'stretch')+U.range('prog','변환을 적용한 정도 (%)',0,100,5,100));
 let T=M.TRANSFORMS.stretch.M,t=1;
 const view=D3.mount(stage,{labels:M.AXES,range:2,signed:true,zoom:1.25,ticks:false,pitch:24,draw(s){
  const Mt=M.lerpMat(M.identity(3),T,t);drawCube(s,M.identity(3),{ghost:true});drawCube(s,Mt);
  s.label=`한 변이 1인 상자와 세 단위 화살표가 행렬로 옮겨진 모습. 화살표 끝은 ${[0,1,2].map(j=>vec(M.column(Mt,j))).join(', ')}`;
 }});
 const extra=document.createElement('div');extra.className='buttons';extra.innerHTML='<button type="button" data-play>처음부터 움직여 보기</button>';el.querySelector('.controls').append(extra);
 let cancel=()=>{};
 extra.querySelector('button').onclick=()=>{cancel();const p=el.querySelector('#prog');cancel=D3.play(1800,u=>{p.value=Math.round(u*20)*5;p.dispatchEvent(new Event('input',{bubbles:true}));});};
 U.bind(el,()=>{
  T=M.TRANSFORMS[el.querySelector('#kind').value].M;t=U.value(el,'prog')/100;view.redraw();
  const Mt=M.lerpMat(M.identity(3),T,t),d=M.det3(Mt);
  U.say(el,`${t<1?`변환을 ${num(t*100)}%만 적용한 중간 모습입니다. `:''}세 단위 화살표 e₁ (1, 0, 0), e₂ (0, 1, 0), e₃ (0, 0, 1)이 각각 <b>${vec(M.column(Mt,0))}</b>, <b>${vec(M.column(Mt,1))}</b>, <b>${vec(M.column(Mt,2))}</b>${U.josa(vec(M.column(Mt,2)),'으로로')} 갔습니다. 이 세 벡터를 세로로 세워 나란히 놓으면 아래 행렬이 됩니다. 행렬식은 ${U.J(num(d),'이')}고, ${volumeWord(d)}.`,
   `<div class="el-mv">${U.matrix(Mt,{label:'지금 적용된 행렬'})}<small>열 하나가 단위 화살표 하나의 도착점</small></div>`);
 });
};
L._kit={C,drinkOptions,recipe,sliders,words,menuPoints,drawCube,transformOptions,volumeWord};
})();
