/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A04Math로 계산한다. */
window.A04Figures=(()=>{
'use strict';
const M=A04Math;
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

F.optimizer=()=>{
 const X=x=>320+x*70,Y=y=>150-y*90;let b='';
 [0.5,2,4.5,8].forEach(l=>b+=`<ellipse cx="320" cy="150" rx="${Math.sqrt(2*l)*70}" ry="${Math.sqrt(2*l/25)*90}" fill="none" stroke="var(--line)"/>`);
 [['sgd',0.07,'var(--orange)','SGD η=0.07',0],['momentum',0.03,'var(--blue)','모멘텀 η=0.03',.6],['adam',0.2,'var(--accent)','Adam η=0.2',1.2]].forEach(([o,lr,c,n,d],i)=>{const r=M.valley(o,lr,40);b+=`<g class="fig-seq" style="animation-delay:${d}s">${draw(r.path.map(([x,y])=>[X(x),Y(y)]),c,2.5)}</g>`+t(24,236+i*22,`${n} · 40걸음 뒤 f = ${f2(r.f,3)}`,{size:13,fill:c,a:'start'});});
 b+=`<circle cx="${X(-4)}" cy="${Y(1.2)}" r="6" fill="var(--text)"/>`+t(X(-4),Y(1.2)-12,'출발',{size:13})+pulse(320,150,7,'var(--accent)')+t(334,145,'최솟값',{size:13,a:'start'});
 b+=t(320,24,'f(x, y) = ½(x² + 25y²) · 세로가 25배 가파른 골짜기',{size:14,fill:'var(--muted)'});
 return {svg:svg('좁고 긴 골짜기 등고선 위에서 SGD는 위아래로 지그재그하고, 모멘텀과 Adam은 골짜기를 따라 최솟값으로 가는 경로',b),caption:'같은 출발점에서 세 옵티마이저가 40걸음 동안 실제로 지나간 길입니다. SGD는 가파른 세로 방향에서 튕기고, 모멘텀은 흔들림을 평균으로 지우며, Adam은 방향마다 보폭을 고르게 맞춥니다.'};
};
F.schedule=()=>{
 const T=150,X=s=>60+s*3,Y=v=>240-v*190;let b=`<path d="M60 240H520M60 40V240" stroke="var(--line)"/>`+t(520,262,'학습 단계 (총 150)',{size:13,fill:'var(--muted)',a:'end'})+t(52,54,'최대',{size:13,fill:'var(--muted)',a:'end'});
 [['step','var(--blue)','계단'],['cosine','var(--accent)','코사인'],['warmcos','var(--orange)','워밍업+코사인'],['onecycle','var(--text)','1cycle']].forEach(([k,c,n],i)=>{b+=`<g class="fig-seq" style="animation-delay:${i*.6}s">${draw(Array.from({length:T},(_,s)=>[X(s),Y(M.lrAt(k,s,T,1))]),c,2.5,k==='onecycle'?'6 5':'')}</g>`+t(540,80+i*36,n,{size:14,fill:c,a:'start',w:700});});
 b+=grow(X(0),252,X(8)-X(0),8,'var(--orange)')+t(96,292,'워밍업 구간: 처음 5%(8단계)',{size:13,fill:'var(--orange)',a:'start'});
 return {svg:svg('계단, 코사인, 워밍업 더하기 코사인, 1cycle 네 가지 학습률 일정의 모양',b),caption:'최대 학습률을 1로 둔 네 일정을 실제 공식으로 그렸습니다. 워밍업은 처음 몇 단계만 올라가고, 코사인은 처음과 끝을 완만하게, 가운데를 빠르게 내립니다.'};
};
F.init=()=>{
 const rows=[['작은 값','small','var(--blue)'],['Xavier','xavier','var(--orange)'],['He','he','var(--accent)']],D=12;let b=t(320,26,'ReLU · 폭 48 · 층마다 활성값 표준편차 (로그 눈금)',{size:14,fill:'var(--muted)'});
 rows.forEach(([n,k,c],r)=>{const s=M.deepStats('relu',k,D).fwd,y=52+r*78;b+=t(20,y+30,n,{size:15,w:700,a:'start'});
  s.forEach((v,l)=>{const h=Math.max(2,Math.min(60,(Math.log10(v)+5)*12));b+=`<rect class="fig-grow" style="animation-delay:${l*.08}s;transform-origin:bottom" x="${120+l*40}" y="${y+60-h}" width="28" height="${h}" rx="3" fill="${c}"/>`;});
  b+=t(612,y+36,v2(s[D-1]),{size:13,fill:c,a:'end'});});
 b+=t(320,292,'막대 하나 = 층 하나(왼쪽 1층 → 오른쪽 12층), 오른쪽 숫자는 12층의 값',{size:13,fill:'var(--muted)'});
 return {svg:svg('작은 값, Xavier, He 초기화로 12층 ReLU 망을 지날 때 층마다 활성값 크기가 줄거나 유지되는 막대그래프',b),caption:'무작위 입력을 실제로 흘려 잰 값입니다. 작은 초기화는 몇 층 만에 신호가 사라지고, Xavier는 ReLU에서 층마다 서서히 줄며, He는 크기를 거의 유지합니다.'};
};
const v2=v=>v<1e-3?v.toExponential(1):f2(v);
F.regularize=()=>{
 let b='';const cols=[60,200,340],rows=[[130],[50,90,130,170,210],[130]];
 rows[1].forEach(y=>{b+=line(`M60 130L200 ${y}`,'var(--line)','')+line(`M200 ${y}L340 130`,'var(--line)','');});
 b+=`<circle cx="60" cy="130" r="20" fill="var(--panel2)" stroke="var(--blue)" stroke-width="2"/>`+t(60,135,'x',{size:14});
 rows[1].forEach((y,i)=>{b+=`<circle cx="200" cy="${y}" r="17" fill="var(--panel2)" stroke="var(--accent)" stroke-width="2"/>`+blink(`<circle cx="200" cy="${y}" r="17" fill="var(--bg)" stroke="var(--orange)" stroke-width="2"/>`+`<path d="M190 ${y-10}L210 ${y+10}M210 ${y-10}L190 ${y+10}" stroke="var(--orange)" stroke-width="2.5"/>`,[0.3,2.1,1.2,3.0,0.8][i]);});
 b+=`<circle cx="340" cy="130" r="20" fill="var(--panel2)" stroke="var(--orange)" stroke-width="2"/>`+t(340,135,'ŷ',{size:14});
 b+=t(200,252,'학습: 매번 다른 뉴런이 꺼짐 (p = 0.4)',{size:13,fill:'var(--muted)'})+t(200,274,'남은 값 × 1/(1 − p) = × 1.67',{size:13,fill:'var(--orange)'});
 b+=box(410,40,210,200,'var(--line)','var(--chart)',8)+t(515,66,'학습 vs 검증',{size:14,w:700});
 [0,0.3].map(d=>{const r=M.train({n:40,noise:0.15,width:32,epochs:400,lr:0.03,dropout:d,seed:2});return [`드롭아웃 ${d}`,r.trainAcc,r.valAcc];}).forEach(([n,tr,va],i)=>{const y=96+i*72;b+=t(424,y,n,{size:13,a:'start'})+grow(424,y+8,tr*150,14,'var(--blue)',i*.4)+grow(424,y+28,va*150,14,'var(--accent)',i*.4+.2)+t(604,y+20,f2(tr),{size:13,a:'end'})+t(604,y+40,f2(va),{size:13,a:'end'});});
 b+=t(515,262,'파랑 학습, 초록 검증 정확도',{size:13,fill:'var(--muted)'});
 return {svg:svg('은닉 뉴런이 무작위로 꺼지는 드롭아웃과, 드롭아웃 0과 0.3에서 학습·검증 정확도를 비교한 막대',b),caption:'왼쪽 X 표시는 학습할 때마다 다른 뉴런이 꺼지는 모습을 보여 주는 비유입니다. 오른쪽 막대는 이 장의 첫 실험 조건(라벨 15% 뒤집힘, 시드 2)에서 실제로 학습한 결과로, 드롭아웃이 학습 정확도를 내주고 검증 정확도를 얻는 모습입니다.'};
};
F.normalize=()=>{
 const grid=(ox,title,sub,mark,c,d)=>{let g=t(ox+110,34,title,{size:15,w:700,fill:c})+t(ox+110,54,sub,{size:13,fill:'var(--muted)'});
  for(let r=0;r<4;r++)for(let k=0;k<6;k++)g+=`<rect x="${ox+20+k*32}" y="${70+r*30}" width="28" height="26" rx="4" fill="var(--panel2)" stroke="var(--line)"/>`;
  g+=blink(mark(ox),d);return g+t(ox+8,88,'표본',{size:13,fill:'var(--muted)',a:'end'})+t(ox+110,206,'특징 6개 →',{size:13,fill:'var(--muted)'});};
 let b=grid(60,'BatchNorm','특징 하나를 묶음의 표본들로 맞춘다',ox=>`<rect x="${ox+20+2*32-3}" y="67" width="34" height="122" rx="6" fill="none" stroke="var(--orange)" stroke-width="3"/>`,'var(--orange)',0.3);
 b+=grid(370,'LayerNorm','표본 하나를 그 표본의 특징들로 맞춘다',ox=>`<rect x="${ox+17}" y="${70+30-3}" width="194" height="32" rx="6" fill="none" stroke="var(--accent)" stroke-width="3"/>`,'var(--accent)',1.2);
 b+=t(24,246,'같은 표본의 BatchNorm 값이 묶음마다 흔들리는 정도',{size:13,fill:'var(--muted)',a:'start'});
 [2,8,32,128].forEach((B,i)=>{const v=M.normBatch({B}).bnSpread,x=24+i*152;b+=t(x,270,`B = ${B}`,{size:13,a:'start'})+grow(x+56,259,v*60,13,'var(--orange)',i*.3)+t(x+61+v*60,270,f2(v),{size:13,a:'start',fill:'var(--orange)'});});
 b+=t(24,292,'LayerNorm은 묶음과 무관해 흔들림이 0입니다',{size:13,fill:'var(--accent)',a:'start'});
 return {svg:svg('표본 4개와 특징 6개로 된 격자에서 배치 정규화는 세로 한 줄을, 층 정규화는 가로 한 줄을 묶어 맞추는 모습과, 배치 크기별 배치 정규화 값의 흔들림 막대',b),caption:'위 격자는 평균과 표준편차를 어느 방향으로 구하는지 보여 주는 도식입니다. 아래 막대는 이 장 실험과 같은 조건(폭 16, 시드 1, 묶음 40개)에서 실제로 계산한 값으로, 배치가 작을수록 같은 표본의 값이 크게 흔들립니다.'};
};
F.framework=()=>{
 const steps=['zero_grad','forward','loss','backward','step'],cx=470,cy=150,R=95;let b='';
 [['Module','forward · backward · parameters','var(--accent)'],['Sequential','Module을 묶은 Module','var(--blue)'],['Optimizer','파라미터 목록만 본다','var(--orange)'],['DataLoader','배치로 나누고 섞기','var(--text)']].forEach(([n,s,c],i)=>{const y=34+i*62;b+=box(20,y,240,50,c)+t(36,y+22,n,{a:'start',w:700,size:15})+t(36,y+42,s,{a:'start',size:13,fill:'var(--muted)'});});
 b+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--line)" stroke-width="2" stroke-dasharray="5 6"/>`;
 steps.forEach((s,i)=>{const a=-Math.PI/2+i*2*Math.PI/5,x=cx+R*Math.cos(a),y=cy+R*Math.sin(a);b+=blink(box(x-52,y-16,104,32,'var(--accent)','var(--panel2)',16)+t(x,y+5,`${i+1}. ${s}`,{size:13}),i*.9);});
 b+=t(cx,cy-4,'학습 한 단계',{size:14,w:700})+t(cx,cy+18,'배치마다 반복',{size:13,fill:'var(--muted)'});
 b+=t(320,288,'PyTorch는 backward를 autograd로, JAX는 grad 함수로 자동화한다',{size:14,fill:'var(--muted)'});
 return {svg:svg('Module, Sequential, Optimizer, DataLoader 네 부품과 zero_grad, forward, loss, backward, step 다섯 단계 학습 루프',b),caption:'왼쪽 네 상자는 프레임워크의 약속이고, 오른쪽 고리는 배치마다 도는 다섯 단계입니다. 단계가 차례로 밝아지는 것은 실행 순서를 보여 주는 비유입니다.'};
};
F.debug=()=>{
 const cases=[['정상','none','var(--accent)'],['학습률 과다','lr','var(--orange)'],['라벨 뒤섞임','labels','var(--blue)']];let b='';
 cases.forEach(([n,bug,c],i)=>{const r=M.train({bug,epochs:120,seed:1}),x0=20+i*208,X=s=>x0+14+s*1.5,Y=v=>230-Math.min(v,2)*80;
  b+=box(x0,34,196,224,'var(--line)','var(--chart)',8)+t(x0+98,58,n,{size:15,w:700,fill:c});
  b+=`<path d="M${x0+14} 230H${x0+186}M${x0+14} 70V230" stroke="var(--line)"/>`+`<path d="M${x0+14} ${Y(0.693)}H${x0+186}" stroke="var(--muted)" stroke-dasharray="3 4"/>`;
  b+=`<g class="fig-seq" style="animation-delay:${i*.7}s">${draw(r.loss.map((v,s)=>[X(s),Y(v)]),c,2.2)}${draw(r.val.map((v,s)=>[X(s),v]).filter(p=>p[1]!==null&&Number.isFinite(p[1])).map(([x,v])=>[x,Y(v)]),'var(--muted)',1.8,'5 4')}</g>`;
  b+=t(x0+98,252,`검증 정확도 ${f2(r.valAcc)}`,{size:13,fill:'var(--muted)'});});
 b+=t(320,22,'실선 학습 손실 · 점선 검증 손실 · 가는 점선 0.693(반반 찍기)',{size:13,fill:'var(--muted)'})+t(320,288,'같은 원 판별기, 같은 시드. 고장마다 곡선 모양이 다르다',{size:14,fill:'var(--muted)'});
 return {svg:svg('정상, 학습률 과다, 라벨 뒤섞임 세 경우의 학습 손실과 검증 손실 곡선',b),caption:'원 판별기를 세 조건으로 실제 학습시킨 손실 곡선입니다. 정상은 둘 다 내려가고, 학습률 과다는 크게 출렁이며, 라벨이 섞이면 학습 손실만 천천히 내려가고 검증 손실은 올라갑니다.'};
};
F.final=()=>{
 const a=M.train({depth:6,width:8,act:'sigmoid',init:'small',opt:'sgd',lr:0.5,epochs:1,seed:1}).gradNorm,c=M.train({depth:6,width:8,act:'relu',init:'he',opt:'sgd',lr:0.5,epochs:1,seed:1}).gradNorm;
 let b=t(320,26,'첫 epoch에 층마다 받은 기울기 크기 (로그 눈금, 1층 → 출력층)',{size:14,fill:'var(--muted)'});
 [['시그모이드 + 작은 초기화',a,'var(--orange)'],['ReLU + He 초기화',c,'var(--accent)']].forEach(([n,g,col],r)=>{const y=50+r*124;b+=t(20,y+10,n,{size:15,w:700,a:'start',fill:col});
  g.forEach((v,l)=>{const h=Math.max(2,Math.min(60,(Math.log10(Math.max(v,1e-30))+17)*3.5));b+=`<rect class="fig-grow" style="animation-delay:${(g.length-l)*.15}s" x="${40+l*80}" y="${y+84-h}" width="50" height="${h}" rx="3" fill="${col}"/>`+t(65+l*80,y+100,v.toExponential(1),{size:13,fill:'var(--muted)'});});});
 return {svg:svg('6층 판별기에서 시그모이드와 작은 초기화는 앞층 기울기가 사실상 0이고, ReLU와 He 초기화는 층마다 비슷한 크기를 받는 막대',b),caption:'마지막 과제의 출발 설정과 한 가지 처방 후보를 첫 epoch만 실제로 계산해, 층별 기울기 크기를 비교했습니다. 막대는 출력층에서 앞층 쪽으로 차례로 자라 역전파 방향을 나타냅니다.'};
};
function render(c){return F[c.id](H);}
return {render,F,H};
})();
