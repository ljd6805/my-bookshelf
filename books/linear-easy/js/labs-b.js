/* 8~14장 실험. 계산은 ELMath, 3차원 그림은 EL3D. 모든 숫자는 브라우저에서 실제로 계산한다. */
(()=>{
'use strict';
const L=ELLabs,U=ELUI,M=ELMath,D3=EL3D,{num,vec,esc}=U,K=L._kit,C=K.C;

/* 8장: 행렬 곱 = 변환을 이어서 하기. prog 0~100은 첫 변환, 100~200은 둘째 변환. */
L.matmul=el=>{
 const stage=U.setup3(el,U.select('first','먼저 할 변환 A',K.transformOptions,'stretch')+U.select('second','다음에 할 변환 B',K.transformOptions,'turn')+U.range('prog','진행 (0~100 A, 100~200 B)',0,200,10,200));
 let A=M.identity(3),B=M.identity(3),p=2;
 const view=D3.mount(stage,{labels:M.AXES,range:2,signed:true,zoom:1.25,ticks:false,pitch:24,draw(s){
  const now=p<=1?M.lerpMat(M.identity(3),A,p):M.matMul(M.lerpMat(M.identity(3),B,p-1),A);
  s.box(D3.unitCorners(M.matMul(A,B)),C.m,0,{stroke:'var(--orange)',strokeWidth:1.2});
  K.drawCube(s,now,{names:false});
  s.label=`상자에 변환 A를 한 뒤 B를 한 모습. 주황색 테두리는 순서를 바꿔 B를 먼저 하고 A를 했을 때의 상자`;
 }});
 const extra=document.createElement('div');extra.className='buttons';extra.innerHTML='<button type="button" data-play>A 다음 B 차례로 움직여 보기</button>';el.querySelector('.controls').append(extra);
 let cancel=()=>{};
 extra.querySelector('button').onclick=()=>{cancel();const r=el.querySelector('#prog');cancel=D3.play(3200,u=>{r.value=Math.round(u*20)*10;r.dispatchEvent(new Event('input',{bubbles:true}));});};
 U.bind(el,()=>{
  const ka=el.querySelector('#first').value,kb=el.querySelector('#second').value;A=M.TRANSFORMS[ka].M;B=M.TRANSFORMS[kb].M;p=U.value(el,'prog')/100;view.redraw();
  const BA=M.matMul(B,A),AB=M.matMul(A,B),eq=BA.every((r,i)=>M.same(r,AB[i],1e-9));
  U.say(el,`${p<2?`지금은 ${p<=1?`A를 ${num(p*100)}%`:`A를 마치고 B를 ${num((p-1)*100)}%`} 적용한 중간 모습입니다. `:''}“${esc(M.TRANSFORMS[ka].name)}” 다음에 “${esc(M.TRANSFORMS[kb].name)}”를 하는 변환은 행렬 하나 <b>BA</b>로 쓸 수 있습니다(나중에 하는 B를 왼쪽에 씁니다). 순서를 바꾼 AB는 주황색 테두리 상자입니다. 두 결과는 <b>${eq?'같습니다':'다릅니다'}</b>. ${eq?'이 두 변환은 순서를 바꿔도 되는 드문 짝입니다.':'행렬 곱은 순서를 바꾸면 결과가 달라질 수 있습니다.'}`,
   `<div class="el-mv"><div>${U.matrix(BA,{label:'BA'})}<small>BA (A 먼저)</small></div><span>${eq?'=':'≠'}</span><div>${U.matrix(AB,{label:'AB'})}<small>AB (B 먼저)</small></div></div>`);
 });
};

/* 9장: 모양 규칙과 전치, 여러 음료 한꺼번에 계산하기. */
const blocks=(m,n,color,label)=>`<div class="el-block"><i style="grid-template-columns:repeat(${n},14px)">${'<b></b>'.repeat(m*n)}</i><small>${label} (${m}×${n})</small></div>`.replace('<i ',`<i data-c="${color}" `);
const dims=[1,2,3,4,5,6].map(n=>[n,String(n)]);
L.shape=el=>{
 U.setup(el,U.select('am','A의 행 수',dims,6)+U.select('an','A의 열 수',dims,3)+U.select('bm','B의 행 수',dims,2)+U.select('bn','B의 열 수',dims,3)+U.check('bt','B를 전치해서 곱하기 (Bᵀ)',false));
 U.bind(el,()=>{
  const a=[U.value(el,'am'),U.value(el,'an')],b0=[U.value(el,'bm'),U.value(el,'bn')],t=el.querySelector('#bt').checked,b=t?[b0[1],b0[0]]:b0,r=M.mulShape(a,b),alt=M.mulShape(a,t?b0:[b0[1],b0[0]]);
  const chart=`<div class="el-shapes ${r.ok?'ok':'bad'}">${blocks(a[0],a[1],'a','A')}<span>×</span>${blocks(b[0],b[1],'b',t?'Bᵀ':'B')}<span>${r.ok?'=':'✕'}</span>${r.ok?blocks(r.shape[0],r.shape[1],'o','AB'):'<div class="el-block"><small>곱할 수 없음</small></div>'}</div><p class="caption">안쪽 두 수: A의 열 ${a[1]}, ${t?'Bᵀ':'B'}의 행 ${b[0]} ${r.ok?'→ 같음 ✓':'→ 다름 ✕'}</p>`;
  const cafe=r.ok&&a[0]===6&&a[1]===3&&b[0]===3&&b[1]===2&&t;
  const X=M.DRINKS.map(d=>d.v),Z=cafe?M.batch(X,M.NET.W1,M.NET.b1):null;
  U.result(el,chart+(cafe?U.table(['음료','진한 맛 z₁','단맛 z₂'],M.DRINKS.map((d,i)=>[d.name,num(Z[i][0]),num(Z[i][1])])):''),
   r.ok?`(${a.join('×')}) × (${b.join('×')}) → <b>(${r.shape.join('×')})</b>. 안쪽 두 수 ${U.J(a[1],'과와')} ${U.J(b[0],'이가')} 같아서 곱할 수 있고, 바깥 두 수 ${U.J(a[0],'과와')} ${U.J(b[1],'이가')} 결과의 모양이 됩니다. 결과 칸 ${r.shape[0]*r.shape[1]}개마다 숫자 ${a[1]}쌍을 곱하므로 곱셈은 모두 ${r.mults}번입니다.${cafe?' 지금 모양은 음료 여섯 개(6×3)에 민준의 취향 층 W₁(2×3)을 전치해 곱한 것과 같아서, 편향 b₁까지 더한 실제 값을 표로 보였습니다. 한 줄이 음료 하나입니다.':''}`
   :`(${a.join('×')}) × (${b.join('×')})${U.josa(b[1],'은는')} <b>곱할 수 없습니다</b>. A의 열 수 ${U.J(a[1],'과와')} ${t?'Bᵀ':'B'}의 행 수 ${U.J(b[0],'이가')} 다르기 때문입니다. ${alt.ok?`B를 ${t?'전치하지 않으면':'전치하면'} (${(t?b0:[b0[1],b0[0]]).join('×')})${U.josa((t?b0:[b0[1],b0[0]])[1],'이가')} 되어 곱할 수 있고 결과는 (${alt.shape.join('×')})입니다.`:'B를 전치해도 안쪽 수가 맞지 않습니다.'}`);
 });
};

/* 10장: 텐서. 축은 [날, 음료, 재료]. 날은 위로, 음료는 샷 축 자리, 재료는 우유 축 자리로 쌓아 그린다. */
const AXIS_NAMES=['날','음료','재료'];
L.tensor=el=>{
 const stage=U.setup3(el,U.range('days','날 수 (축 0)',1,2,1,2)+U.range('kinds','음료 수 (축 1)',1,6,1,6)+U.select('axis','이 축을 따라 더하기',[['none','더하지 않음'],['0','축 0 (날)을 따라'],['1','축 1 (음료)을 따라'],['2','축 2 (재료)를 따라']],'none'));
 let T=M.orders(),axis=-1;
 const view=D3.mount(stage,{labels:['축 1: 음료','','축 0: 날'],range:4,ticks:false,yaw:-38,pitch:26,draw(s){
  const [a,b,c]=M.tensorShape(T),top=Math.max(...T.flat(2),1),g=.62,w=.56;
  for(let i=0;i<a;i++)for(let j=0;j<b;j++)for(let k=0;k<c;k++){
   const at=[j*g+.1,k*g+.1,i*1.5+.2],val=T[i][j][k];
   s.box(D3.unitCorners(null,w,at),[C.a,C.b,C.o][k],.12+.6*val/top,{stroke:'var(--text)',strokeWidth:.8});
  }
  if(axis>=0){const from=[.1+w/2,.1+w/2,.2+w/2],to=axis===0?[from[0],from[1],(a-1)*1.5+.2+w+.5]:axis===1?[(b-1)*g+.1+w+.5,from[1],from[2]]:[from[0],(c-1)*g+.1+w+.5,from[2]];s.arrow(M.add(from,axis===0?[-.45,-.45,0]:axis===1?[0,-.5,-.35]:[-.5,0,-.35]),M.add(to,axis===0?[-.45,-.45,0]:axis===1?[0,-.5,-.35]:[-.5,0,-.35]),'var(--text)',{width:3,label:`축 ${axis} 방향으로 더함`});}
  s.text([-.7,c*g/2,0],'축 2: 재료','var(--muted)',{size:12,anchor:'end'});
  s.label=`작은 상자 ${a*b*c}개를 날 ${a}층, 음료 ${b}줄, 재료 3칸으로 쌓은 텐서. 진할수록 값이 큼`;
 }});
 U.bind(el,()=>{
  const days=U.value(el,'days'),kinds=U.value(el,'kinds'),ax=el.querySelector('#axis').value;axis=ax==='none'?-1:+ax;T=M.orders(days,kinds);view.redraw();
  const s=M.tensorShape(T),names=M.DRINKS.slice(0,kinds).map(d=>d.name),dayNames=['첫째 날','둘째 날'].slice(0,days);
  let extra='',text=`이 텐서의 모양은 <b>(${s.join(', ')})</b>입니다. 축 0은 날 ${s[0]}개, 축 1은 음료 ${s[1]}개, 축 2는 재료 3개이고, 숫자는 모두 ${s.join(' × ')} = <b>${M.count(s)}개</b>입니다. 칸 하나의 값은 그날 그 음료에 쓴 그 재료의 양(팔린 잔 수 × 레시피)입니다.`;
  if(axis>=0){
   const R=M.sumAxis(T,axis),rs=M.dropAxis(s,axis),head=axis===2?['날 \\ 음료',...names]:['',...M.AXES],rowNames=axis===0?names:dayNames;
   extra=U.table(head.map(String),R.map((r,i)=>[rowNames[i],...r.map(x=>num(x))]));
   text+=` 축 ${axis}(${AXIS_NAMES[axis]})를 따라 더하면 그 축이 사라져 모양이 <b>(${rs.join(', ')})</b>인 행렬이 됩니다. ${['음료마다 이틀 동안 쓴 재료의 양','날마다 모든 음료에 쓴 재료의 양','날마다 음료 한 종류에 들어간 재료 단위의 합'][axis]}${axis===0&&days===1?'(지금은 날이 하루뿐이라 값은 그대로이고 축만 사라집니다)':''}입니다.`;
  }
  U.say(el,text,extra);
 });
};

/* 11장: 되돌리기와 랭크. 출력 공간(행 셋)에서 음료 점들이 부피·면·선 가운데 무엇을 이루는지 본다. */
L.inverse=el=>{
 const stage=U.setup3(el,U.select('out','음료마다 적어 둔 출력 세 가지',Object.entries(M.OUTPUTS).map(([k,o])=>[k,o.name]),'full')+U.select('drink','되찾을 음료',K.drinkOptions,'latte'));
 let key='full',d=M.drink('latte');
 const view=D3.mount(stage,{labels:()=>M.OUTPUTS[key].rows,range:4,ticks:false,draw(s){
  const O=M.OUTPUTS[key],box=D3.unitCorners(null,4).map(c=>M.matVec(O.M,c)),top=[0,1,2].map(i=>Math.max(...box.map(p=>Math.abs(p[i])),1e-9)),fit=p=>p.map((x,i)=>x/top[i]*4);
  s.box(box.map(fit),C.b,.14,{stroke:'var(--blue)'});
  M.DRINKS.forEach(x=>s.point(fit(M.matVec(O.M,x.v)),x.id===d.id?C.o:C.a,{r:x.id===d.id?7:4.5,label:x.name,size:11,labelColor:x.id===d.id?C.o:'var(--text)'}));
  s.label=`출력 공간에 찍은 음료 여섯 점과 레시피 상자가 옮겨진 모양. 랭크 ${M.rank(O.M)}. 축마다 가장 큰 값이 같은 길이가 되게 줄여 그렸음`;
 }});
 U.bind(el,()=>{
  key=el.querySelector('#out').value;d=M.drink(el.querySelector('#drink').value);view.redraw();
  const O=M.OUTPUTS[key],r=M.recover(key,d.v),shapeWord=['','한 줄 위에','한 평면 위에','부피가 있는 덩어리로'][r.rank];
  U.say(el,`${esc(d.name)} ${vec(d.v)}의 출력은 ${O.rows.map((n,i)=>`${n} ${num(r.y[i])}`).join(', ')}입니다. 이 행렬의 랭크는 <b>${r.rank}</b>, 행렬식은 ${U.J(num(r.det),'이')}고, 레시피 공간의 상자는 출력 공간에서 ${shapeWord} 놓입니다. `+
   (r.ok?`랭크가 3이라 역행렬이 있고, 출력에 역행렬을 곱하면 <b>${vec(r.x)}</b>${U.josa(vec(r.x),'이가')} 나와 원래 레시피를 되찾습니다.`:`랭크가 3보다 작아 역행렬이 없습니다. 예를 들어 레시피 <b>${vec(r.other)}</b>도 출력이 ${U.J(vec(r.otherY),'으로로')} 똑같아서, 출력만 보고는 어느 레시피였는지 정할 수 없습니다.`),
   `<div class="el-mv"><div>${U.matrix(O.M,{rows:O.rows,label:'출력 행렬'})}<small>W (3×3), 랭크 ${r.rank}</small></div></div>`);
 });
};

/* 12장: 같은 행렬을 여러 번 곱하기. */
L.eigen=el=>{
 U.setup(el,U.select('kind','되풀이해 곱할 행렬',Object.entries(M.REPEAT).map(([k,r])=>[k,r.name]),'regulars')+U.range('share','출발 벡터에서 첫째 칸의 몫 (%)',0,100,10,50)+U.range('n','곱한 횟수 n',0,20,1,5));
 U.bind(el,()=>{
  const R=M.REPEAT[el.querySelector('#kind').value],share=U.value(el,'share')/100,n=U.value(el,'n'),total=R.start[0]+R.start[1];
  const v0=[total*share,total*(1-share)],seq=M.powers(R.M,v0,n),e=M.eig2(R.M),last=seq[n],top=Math.max(...seq.map(v=>Math.max(Math.abs(v[0]),Math.abs(v[1]))),1e-9);
  const S=230,ox=40,oy=250,px=v=>[ox+v[0]/top*S,oy-v[1]/top*S];
  const arrows=seq.map((v,i)=>{const [x,y]=px(v);return `<line x1="${ox}" y1="${oy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${i===n?'var(--orange)':'var(--accent)'}" stroke-width="${i===n?3.4:1.6}" opacity="${i===n?1:(.25+.5*i/Math.max(n,1)).toFixed(2)}"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i===n?5:3}" fill="${i===n?'var(--orange)':'var(--accent)'}"/>`;}).join('');
  const dirs=e.vectors.map((v,i)=>{const k=1.15*S/Math.max(Math.abs(v[0]),Math.abs(v[1]),1e-9),x=ox+Math.abs(v[0])*k*Math.sign(v[0]||1),y=oy-v[1]*k*Math.sign(v[0]||1);return v[1]*Math.sign(v[0]||1)<-1e-9?'':`<line x1="${ox}" y1="${oy}" x2="${Math.min(x,470).toFixed(1)}" y2="${Math.max(y,10).toFixed(1)}" stroke="var(--blue)" stroke-dasharray="6 5" stroke-width="1.5"/>`;}).join('');
  const chart=`<svg viewBox="0 0 480 280" role="img" aria-label="${esc(`출발 벡터 ${vec(v0)}에 행렬을 ${n}번 곱한 벡터들을 원점에서 나간 선으로 그린 그림. 마지막 벡터 ${vec(last)}`)}"><path class="axis" d="M${ox} ${oy}H470M${ox} 12V${oy}"/>${dirs}${arrows}<text x="466" y="${oy+18}" text-anchor="end">${esc(R.labels[0])}</text><text x="${ox+6}" y="16">${esc(R.labels[1])}</text><text x="300" y="30" fill="var(--blue)">점선: 고유 방향</text></svg>`+U.matrix(R.M,{label:'되풀이해 곱하는 행렬'});
  const show=v=>v[0]>=0&&v[1]>=0?M.scale(v,1/(v[0]+v[1])):M.scale(v,1/Math.max(Math.abs(v[0]),Math.abs(v[1])));
  const ratio=n>0&&M.norm(seq[n-1])>1e-12?M.norm(last)/M.norm(seq[n-1]):null;
  U.result(el,chart,`출발 ${vec(v0)}에 행렬을 ${n}번 곱하면 <b>${vec(last,3)}</b>, 길이는 ${num(M.norm(last),3)}입니다. ${ratio===null?'':`마지막 한 번 곱할 때 길이는 <b>${num(ratio,3)}배</b>가 되었습니다. `}이 행렬의 고윳값은 ${U.J(num(e.values[0]),'과와')} ${U.J(num(e.values[1]),'이')}고, 큰 고윳값 ${num(e.values[0])}의 고유 방향은 ${vec(show(e.vectors[0]))}입니다. 곱하는 횟수가 늘수록 벡터는 이 방향으로 눕고, 한 번 곱할 때마다 길이는 ${num(e.values[0])}배에 가까워집니다${Math.abs(e.values[0]-1)<1e-9?'(1배이므로 더 변하지 않습니다)':e.values[0]>1?'(20번이면 '+num(e.values[0]**20,1)+'배)':'(20번이면 '+num(e.values[0]**20,4)+'배)'}.`);
 });
};

/* 13장: 기울기 벡터와 야코비안. */
L.jacobian=el=>{
 const N=M.NET,stage=U.setup3(el,K.sliders(M.NEWDRINK.v)+U.select('axis','조금 늘릴 재료',M.AXES.map((a,i)=>[i,a]),0)+U.range('dx','늘리는 양 Δx',0.1,2,0.1,0.5));
 let x=M.NEWDRINK.v.slice();
 const view=D3.mount(stage,{labels:M.AXES,draw(s){
  K.menuPoints(s);const g=M.scoreGradient(x),len=M.norm(g);
  s.point(x,'var(--text)',{r:6,label:`x ${vec(x)}`});
  if(len>0)s.arrow(x,M.add(x,M.scale(g,1/len)),C.o,{width:3.4,label:`기울기 ${vec(g)}`});
  s.label=`레시피 ${vec(x)} 자리에서 민준의 점수가 가장 빨리 오르는 방향을 가리키는 기울기 화살표 ${vec(g)}`;
 }});
 U.bind(el,()=>{
  x=K.recipe(el);view.redraw();
  const i=U.value(el,'axis'),dx=U.value(el,'dx'),step=[0,0,0].map((_,k)=>k===i?dx:0),x2=M.add(x,step),f0=M.forward(x),f1=M.forward(x2),J=M.layerJacobian(N.W1,N.b1,x),g=M.scoreGradient(x);
  const pred=M.matVec(J,step),real=M.sub(f1.h,f0.h),predY=M.dot(g,step),realY=f1.y-f0.y,exact=M.same(pred,real,1e-9);
  U.say(el,`${U.J(M.AXES[i],'을를')} ${num(dx)} 늘리면 은닉층 (진한 맛, 단맛)은 ${vec(f0.h)}에서 ${U.J(vec(f1.h),'으로로')} <b>${vec(real)}</b>만큼 바뀝니다. 야코비안으로 어림한 값 J·Δx는 <b>${vec(pred)}</b>입니다. 점수 y는 ${num(f0.y)}에서 ${U.J(num(f1.y),'으로로')} ${num(realY)}만큼 바뀌고, 기울기로 어림하면 ${num(predY)}입니다. `+
   (exact?'두 값이 같습니다. 이 구간에서는 켜진 뉴런과 꺼진 뉴런이 바뀌지 않아 층이 행렬 하나처럼 움직이기 때문입니다.':'두 값이 다릅니다. 늘리는 도중에 ReLU의 꺾이는 점을 지나 켜진 뉴런이 바뀌었기 때문입니다. 야코비안은 지금 자리 가까이에서만 맞는 어림입니다.')+` 꺼진 뉴런(가중합이 0 이하)의 행은 야코비안에서 0입니다.`,
   `<div class="el-mv"><div>${U.matrix(J,{rows:N.hidden,label:'야코비안',on:i=>f0.z1[i]>0})}<small>J = ∂h/∂x (2×3)</small></div><div>${U.matrix([g],{label:'기울기'})}<small>∇y = w₂ᵀJ (1×3)</small></div></div>`);
 });
};

/* 14장: 2층 신경망 순전파를 모양과 함께 계산하고, 모양 오류 세 건을 진단한다. */
const BUGS=[
 ['x-shape','음료 6개의 표 X(6×3)에 W₁(2×3)을 그대로 곱했다: X·W₁',2,'안쪽 수 3과 2가 달라 곱할 수 없습니다. W₁을 전치해 X·W₁ᵀ (6×3)(3×2) → (6×2)로 계산합니다.'],
 ['bias','은닉층 결과 (6×2)에 편향 b₁ 대신 b₂(숫자 1개)를 더했다',0,'모양은 맞아 오류 없이 계산되지만 값이 틀립니다. 은닉 뉴런 두 개에는 편향이 하나씩, 곧 b₁(2)이 필요합니다. 모양이 맞는다고 계산이 맞는 것은 아닙니다.'],
 ['order','출력층을 w₂·(W₁x)가 아니라 W₁·(w₂x)로 적었다',1,'w₂는 은닉 2칸을 받는 가중치라 입력 3칸짜리 x와 곱할 수 없습니다. 행렬 곱은 순서를 바꿀 수 없으니 입력 쪽 층을 먼저 곱합니다.']
];
const FIXES=[['0','편향의 칸 수를 층의 뉴런 수에 맞춘다'],['1','곱하는 순서를 입력에서 출력 쪽으로 바로잡는다'],['2','가중치 행렬을 전치해 안쪽 수를 맞춘다']];
L.final=el=>{
 const N=M.NET,all=[...M.DRINKS,{id:'new',name:M.NEWDRINK.name,v:M.NEWDRINK.v}];
 U.setup(el,U.select('drink','계산할 음료',all.map(d=>[d.id,`${d.name} ${vec(d.v)}`]),'new')+U.range('stage','계산 단계',1,5,1,5)+U.select('bug','진단할 모양 오류',BUGS.map(b=>[b[0],b[1]]),'x-shape')+U.select('fix','내가 고른 고칠 방법',FIXES,'0'));
 U.bind(el,()=>{
  const d=all.find(x=>x.id===el.querySelector('#drink').value),st=U.value(el,'stage'),f=M.forward(d.v),Wx=M.matVec(N.W1,d.v);
  const rows=[['① 입력 x','(3)',vec(d.v)],['② W₁x','(2×3)(3) → (2)',vec(Wx)],['③ W₁x + b₁','(2) + (2) → (2)',vec(f.z1)],['④ h = ReLU(③)','(2) → (2)',vec(f.h)],['⑤ y = w₂·h + b₂','(2)·(2) + 1개 → 숫자 1개',num(f.y)]].slice(0,st);
  const bug=BUGS.find(b=>b[0]===el.querySelector('#bug').value),pick=+el.querySelector('#fix').value,ok=pick===bug[2];
  U.result(el,U.table(['단계','모양','값'],rows,i=>i===st-1),`${esc(d.name)} ${vec(d.v)}: ${st<5?`${st}단계까지 계산했습니다. 마지막 줄은 ${rows[st-1][0]} = ${rows[st-1][2]}입니다.`:`민준의 점수는 <b>${num(f.y)}</b>입니다. 진한 맛 ${num(f.h[0])}에 2를 곱하고 단맛 ${num(f.h[1])}에 −1을 곱해 더한 뒤 −0.5를 더했습니다. ${f.y>0?'0보다 크므로 권할 만한 음료로 판정합니다.':'0 이하이므로 권하지 않는 음료로 판정합니다.'}`}<br><b>모양 오류 진단:</b> “${esc(bug[1])}”에 “${esc(FIXES[pick][1])}”를 골랐습니다. ${ok?'<b>맞습니다.</b> ':'<b>다시 골라 보세요.</b> 모양을 단계 표와 견주어 보면 어디가 어긋나는지 보입니다. '}${ok?esc(bug[3]):''}`);
 });
};
})();
