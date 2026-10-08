/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A10Math로 계산한다. */
window.A10Figures=(()=>{
'use strict';
const M=A10Math,f=(n,d=1)=>Number(n).toFixed(d).replace('-','−');
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const turn=(body,i)=>blink(body,i*1.2,i?'fig-turn':'fig-turn fig-first');
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const H={svg,t,box,line,dot,blink,turn,grow,pulse};
const F={};
const poly=(pts,stroke,cls='fig-draw',w=2.5)=>`<polyline class="${cls}" points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${w}"/>`;

F.mdp=()=>{
 let b=box(30,40,170,90,'var(--accent)')+t(115,78,'나르미',{w:700})+t(115,102,'정책 π(a|s)',{size:14,fill:'var(--muted)'});
 b+=box(440,40,170,90,'var(--blue)')+t(525,78,'창고',{w:700})+t(525,102,'전이 P(s′|s,a)',{size:14,fill:'var(--muted)'});
 b+=line('M200 62H440','var(--accent)')+dot(206,62,228,0,'var(--accent)',0)+t(320,52,'행동 a',{size:14,fill:'var(--accent)'});
 b+=line('M440 108H200','var(--blue)')+dot(434,108,-228,0,'var(--blue)',1.2)+t(320,132,'다음 상태 s′ · 보상 r = −1',{size:14,fill:'var(--blue)'});
 const g=0.9;b+=t(30,178,`할인 γ = ${g}: k걸음 뒤 보상의 무게 γᵏ`,{a:'start',size:14,fill:'var(--muted)'});
 for(let k=0;k<12;k++){const w=Math.pow(g,k),x=40+k*48;b+=grow(x,270-w*70,30,w*70,k<10?'var(--orange)':'var(--line)',k*.12)+t(x+15,290,`${k}`,{size:13,fill:'var(--muted)'});if(k%3===0)b+=t(x+15,262-w*70,f(w,2),{size:13});}
 return {svg:svg('나르미가 행동을 보내고 창고가 다음 상태와 보상을 돌려주는 고리, 그리고 γ 0.9에서 k걸음 뒤 보상의 무게가 줄어드는 막대',b),caption:'위쪽은 나르미와 창고가 행동과 보상을 주고받는 MDP의 고리이고, 아래 막대는 γ=0.9에서 k걸음 뒤 보상의 무게 0.9ᵏ를 실제로 계산한 것입니다. 10걸음쯤에서 무게가 약 0.35로 줄어 지평이 약 10걸음입니다.'};
};
F.dp=()=>{
 const env=M.warehouse(),ks=[1,2,4,6];let b='';
 ks.forEach((k,i)=>{const r=M.valueSweeps(env,1,k);let g='';for(let s=0;s<16;s++){const x=40+(s%4)*62,y=40+Math.floor(s/4)*58,goal=s===15;g+=`<rect x="${x}" y="${y}" width="58" height="54" rx="5" fill="${goal?'var(--accent)':'var(--panel2)'}" fill-opacity="${goal?0.35:1}" stroke="var(--line)"/>`+t(x+29,y+33,goal?'출고':f(r.V[s],0),{size:15,w:goal?700:400});}
  g+=t(470,90,`훑기 ${k}번`,{size:22,w:700,fill:'var(--accent)'})+t(470,124,`출발 칸 V = ${f(r.V[0],0)}`,{size:16})+t(470,154,k<6?'정보가 아직 퍼지는 중':'최단 경로 −6에 도착',{size:14,fill:'var(--muted)'});b+=turn(g,i);});
 b+=t(470,230,'출고대에서 한 번에 한 칸씩',{size:14,fill:'var(--muted)'})+t(470,252,'값이 퍼져 나갑니다',{size:14,fill:'var(--muted)'});
 return {svg:svg('미끄러짐 없는 4×4 창고에서 가치 반복을 1, 2, 4, 6번 훑은 칸별 가치가 차례로 바뀌는 그림',b),caption:'γ=1, 미끄러짐 없는 창고에서 동기식 가치 반복을 1·2·4·6번 훑은 결과를 실제로 계산해 차례로 보여 줍니다. 출고대에서 가까운 칸부터 값이 확정되고, 6번째에 출발 칸이 −6이 됩니다.'};
};
F.mc=()=>{
 const r=M.mcRandom(400,7),dp=M.mdpRandom(1).start,y=v=>40+(-v-20)/70*200,x=i=>60+i/400*540;let b='';
 b+=`<path d="M60 40V240H600" stroke="var(--line)" fill="none"/>`;
 for(const v of [-20,-40,-60,-80])b+=t(52,y(v)+5,f(v,0),{a:'end',size:13,fill:'var(--muted)'});
 b+=line(`M60 ${y(dp)}H600`,'var(--orange)')+t(110,y(dp)+22,`동적계획법 값 ${f(dp,1)}`,{a:'start',size:14,fill:'var(--orange)'});
 b+=poly(r.curve.map((v,i)=>[x(i+1).toFixed(1),y(Math.max(-90,Math.min(-20,v))).toFixed(1)]),'var(--accent)');
 b+=t(330,270,'에피소드 수 (0 → 400)',{size:14,fill:'var(--muted)'})+t(70,30,'출발 칸 이득의 누적 평균',{a:'start',size:14,fill:'var(--muted)'});
 b+=pulse(x(400),y(r.mean),8,'var(--accent)')+t(x(400)-12,y(r.mean)+28,`400번 평균 ${f(r.mean,1)}`,{a:'end',size:14,fill:'var(--accent)'});
 return {svg:svg(`무작위 정책으로 400번 걸은 출발 칸 이득의 누적 평균이 동적계획법 값 ${f(dp,1)} 근처로 모이는 곡선`,b),caption:`시드를 고정한 무작위 걸음 400번의 첫 방문 이득을 실제로 평균 낸 곡선입니다. 초반에는 크게 흔들리다 1장의 정확한 값 ${f(dp,1)} 근처로 모입니다. 지도 없이 걸은 기록만으로 가치를 추정할 수 있다는 뜻입니다.`};
};
F.td=()=>{
 const r=M.cliffCompare(0.1),cs=44,ox=56,oy=50,cx=s=>ox+(s%12)*cs+cs/2,cy=s=>oy+Math.floor(s/12)*cs+cs/2;let b='';
 for(let s=0;s<48;s++){const cl=s>36&&s<47,x=ox+(s%12)*cs,y=oy+Math.floor(s/12)*cs;b+=`<rect x="${x}" y="${y}" width="${cs-3}" height="${cs-3}" rx="4" fill="${cl?'var(--orange)':'var(--panel2)'}" fill-opacity="${cl?0.35:1}"/>`;}
 b+=t(ox+cs/2,oy+3*cs+28,'S',{w:700,fill:'var(--blue)'})+t(ox+11*cs+cs/2,oy+3*cs+28,'G',{w:700,fill:'var(--accent)'})+t(ox+6*cs,oy+3*cs+28,'하역장 낭떠러지 (−100)',{size:14,fill:'var(--orange)'});
 b+=poly(r.q.path.map(s=>[cx(s),cy(s)+4]),'var(--accent)','fig-dash',3)+poly(r.sarsa.path.map(s=>[cx(s),cy(s)-4]),'var(--blue)','fig-dash',3);
 b+=dot(cx(24),cy(24)+4,11*cs,0,'var(--accent)',0,7)+dot(cx(0),cy(0)-4,11*cs,0,'var(--blue)',0.8,7);
 b+=t(ox,30,`Q-learning ${r.q.steps}걸음 (훈련 중 평균 ${f(r.q.lastAvg,1)})`,{a:'start',size:14,fill:'var(--accent)'})+t(600,30,`SARSA ${r.sarsa.steps}걸음 (${f(r.sarsa.lastAvg,1)})`,{a:'end',size:14,fill:'var(--blue)'});
 return {svg:svg(`절벽 창고에서 Q-learning은 낭떠러지 바로 위 줄로 ${r.q.steps}걸음, SARSA는 맨 윗줄로 ${r.sarsa.steps}걸음 경로를 배운 그림`,b,250),caption:`ε=0.1, α=0.5로 500번 실제 학습한 탐욕 경로입니다. 초록 선의 Q-learning은 가장자리 지름길을, 파란 선의 SARSA는 탐험 중 미끄러질 위험을 셈한 윗길을 고릅니다. 움직이는 점은 두 경로를 따라가는 시각적 표시입니다.`};
};
F.dqn=()=>{
 const mb=M.maxBias(10,1);let b='';
 b+=box(20,110,110,70,'var(--muted)')+t(75,142,'창고 화면',{w:700})+t(75,164,'s, a, r, s′',{size:13,fill:'var(--muted)'});
 b+=box(170,70,130,150,'var(--blue)','var(--chart)')+t(235,95,'재생 버퍼',{w:700,fill:'var(--blue)'});
 for(let i=0;i<5;i++)b+=grow(185,110+i*20,100,14,'var(--blue)',i*.25);
 b+=box(350,50,130,70,'var(--accent)')+t(415,82,'온라인 망 θ',{w:700})+t(415,104,'매 걸음 갱신',{size:13,fill:'var(--muted)'});
 b+=box(350,170,130,70,'var(--orange)')+t(415,202,'타깃 망 θ⁻',{w:700})+t(415,224,'C걸음마다 복사',{size:13,fill:'var(--muted)'})+pulse(470,180,10,'var(--orange)');
 b+=line('M130 145H170')+dot(132,145,34,0,'var(--muted)',0,5)+line('M300 110L350 88','var(--blue)')+dot(302,110,44,-20,'var(--blue)',.6,5)+line('M415 120V170','var(--accent)','fig-dash');
 b+=box(510,90,115,110,'var(--line)','var(--chart)')+t(567,116,'TD 손실',{w:700})+t(567,142,'(y − Q)²',{size:14})+t(567,170,'y = r + γ·',{size:13,fill:'var(--muted)'})+t(567,188,'max Q(s′;θ⁻)',{size:13,fill:'var(--muted)'});
 b+=line('M480 85H510')+line('M480 205H510');
 b+=t(320,282,`max 편향(행동 10개, 잡음 1): +${f(mb.single,2)} · 이중 추정: ${f(mb.double,2)}`,{size:14,fill:'var(--orange)'});
 return {svg:svg('창고 화면의 전이가 재생 버퍼에 쌓이고, 무작위로 뽑힌 묶음이 온라인 망을 고치며, 목표는 얼려 둔 타깃 망이 계산하는 DQN 구조',b),caption:`DQN의 데이터 흐름을 그린 구조도이며 움직이는 점은 시각적 비유입니다. 아래 줄의 최대화 편향 +${f(mb.single,2)}는 참값 0인 행동 10개를 4,000번 실제로 추정해 계산한 값입니다.`};
};
F.pg=()=>{
 const p0=M.softmax([0,0,0]),th=[0,0,0].map((v,j)=>v+1*1*((j===0?1:0)-p0[j])),p1=M.softmax(th);let b=t(160,34,'REINFORCE 한 걸음 (행동 1, 이점 +1)',{size:14,fill:'var(--muted)'});
 [p0,p1].forEach((p,k)=>{let g='';p.forEach((q,i)=>{const x=50+i*90;g+=`<rect x="${x}" y="${230-q*300}" width="60" height="${q*300}" rx="4" fill="${i===0?'var(--accent)':'var(--blue)'}"/>`+t(x+30,222-q*300,f(q,2),{size:15,w:700})+t(x+30,252,`행동 ${i+1}`,{size:14,fill:'var(--muted)'});});
  g+=t(160,280,k?'갱신 뒤: 고른 행동의 확률이 오름':'갱신 전: 셋 다 1/3',{size:14,fill:k?'var(--accent)':'var(--muted)'});b+=turn(g,k);});
 const pts=[];for(let x=-2;x<=4.001;x+=0.25)pts.push([x,M.pgVariance(0.3,0,1,1,x).variance]);
 const X=v=>370+(v+2)/6*240,Y=v=>230-Math.min(v,3)/3*170,best=M.pgVariance(0.3,0,1,1,0);
 b+=`<path d="M370 60V230H610" stroke="var(--line)" fill="none"/>`+poly(pts.map(([x,y])=>[X(x).toFixed(1),Y(y).toFixed(1)]),'var(--orange)');
 b+=pulse(X(best.bStar),Y(best.varStar),7,'var(--accent)')+t(X(best.bStar),Y(best.varStar)-14,`b* = ${f(best.bStar,1)}`,{size:14,fill:'var(--accent)'})+t(490,40,'기준선 b에 따른 분산',{size:14,fill:'var(--muted)'})+t(490,256,'기준선 b (−2 → 4)',{size:13,fill:'var(--muted)'});
 return {svg:svg('왼쪽은 이점 +1인 행동을 한 번 강화했을 때 소프트맥스 확률이 1/3에서 바뀌는 막대, 오른쪽은 기준선에 따른 정책경사 분산 곡선',b),caption:`왼쪽은 ∇log π = 원핫 − π로 한 걸음 올렸을 때 확률이 1/3에서 ${f(p1[0],2)}로 오르는 실제 계산이고, 오른쪽은 두 행동 문제에서 기준선 b에 따른 분산을 닫힌 식으로 그린 곡선입니다. b* = ${f(best.bStar,1)}에서 분산이 가장 작습니다.`};
};
F.ppo=()=>{
 let b='';[[1,'좋은 행동 A = +1',20],[-1,'나쁜 행동 A = −1',330]].forEach(([A,name,ox])=>{
  const X=r=>ox+30+r/2*250,Y=v=>150-v*55,pts=[],un=[];for(let r=0;r<=2.0001;r+=0.05){pts.push([X(r).toFixed(1),Y(M.clipObj(r,A,0.2).obj).toFixed(1)]);un.push([X(r).toFixed(1),Y(r*A).toFixed(1)]);}
  b+=t(ox+155,34,name,{w:700,fill:A>0?'var(--accent)':'var(--orange)'})+`<path d="M${ox+30} 150H${ox+290}" stroke="var(--line)"/>`;
  b+=`<path d="M${X(0.8)} 50V250M${X(1.2)} 50V250" stroke="var(--blue)" stroke-dasharray="4 4"/>`+t(X(0.8),268,'0.8',{size:13,fill:'var(--blue)'})+t(X(1.2),268,'1.2',{size:13,fill:'var(--blue)'});
  b+=poly(un,'var(--muted)','fig-dash',1.5)+poly(pts,A>0?'var(--accent)':'var(--orange)');
  b+=dot(X(0.6),Y(M.clipObj(0.6,A,0.2).obj),X(1.6)-X(0.6),Y(M.clipObj(1.6,A,0.2).obj)-Y(M.clipObj(0.6,A,0.2).obj),'var(--text)',A>0?0:1.2,6);
  b+=t(ox+160,290,A>0?'1.2 넘으면 평평: 더 밀지 않음':'0.8 아래로 평평: 더 줄이지 않음',{size:14,fill:'var(--muted)'});});
 return {svg:svg('확률 비 r에 따른 PPO의 잘린 목적 함수. 좋은 행동은 1.2 위에서, 나쁜 행동은 0.8 아래에서 평평해지는 두 그래프',b),caption:'ε=0.2일 때 잘린 목적 min(r·A, clip(r)·A)를 실제로 계산한 선(색)과 자르지 않은 r·A(회색 점선)입니다. 평평한 구간에서는 기울기가 0이라 같은 묶음을 여러 번 써도 정책이 멀리 가지 않습니다. 움직이는 점은 r이 커지는 모습을 보여 주는 표시입니다.'};
};
F.rlhf=()=>{
 const p=M.bt(2).pA;let b='';[['1 SFT','시범으로 π_ref','var(--muted)'],['2 보상 모델','쌍대 선호로 R_φ','var(--blue)'],['3 PPO','R − β·KL','var(--accent)']].forEach(([a,s,c],i)=>{const x=20+i*210;b+=blink(box(x,30,180,70,c)+t(x+90,60,a,{w:700})+t(x+90,84,s,{size:14,fill:'var(--muted)'}),i*.8);if(i<2)b+=line(`M${x+180} 65H${x+210}`)+dot(x+176,65,34,0,c,i*.8,5);});
 b+=box(60,140,200,110,'var(--accent)','var(--chart)')+t(160,168,'배송 영상 A',{w:700})+t(160,196,'보상 모델 점수 2.0',{size:14})+pulse(240,160,10,'var(--accent)')+t(160,232,'작업자가 고름 ✓',{size:14,fill:'var(--accent)'});
 b+=box(380,140,200,110,'var(--line)','var(--chart)')+t(480,168,'배송 영상 B',{w:700})+t(480,196,'보상 모델 점수 0.0',{size:14});
 b+=t(320,190,'vs',{size:18,w:700,fill:'var(--muted)'})+t(320,282,`브래들리-테리: P(A 선호) = σ(2.0 − 0.0) = ${f(p,3)}`,{size:15,fill:'var(--blue)'});
 return {svg:svg('SFT, 보상 모델, PPO 세 단계와 두 배송 영상 중 하나를 고르는 쌍대 선호, 점수 차 2에서 선호 확률 0.881',b),caption:`위쪽은 원본이 설명하는 RLHF의 세 단계이고, 아래는 두 영상의 보상 모델 점수 차 2.0을 브래들리-테리 확률 ${f(p,3)}로 바꾼 실제 계산입니다. 영상과 점수는 교육용 예입니다.`};
};
F.multi=()=>{
 const A=M.AISLE,names=['질주','보통','천천히'];let b='';
 b+=`<path d="M40 150H280M160 40V260" stroke="var(--line)" stroke-width="26" stroke-linecap="round"/>`+t(160,288,'교차로',{size:14,fill:'var(--muted)'});
 b+=dot(50,150,96,0,'var(--accent)',0,10)+dot(160,50,0,86,'var(--blue)',0.3,10)+t(50,130,'나르미',{a:'start',size:14,fill:'var(--accent)'})+t(176,54,'다르미',{a:'start',size:14,fill:'var(--blue)'})+pulse(160,150,16,'var(--orange)');
 b+=t(470,40,'공동 보상표 (행: 나르미, 열: 다르미)',{size:14,fill:'var(--muted)'});
 names.forEach((n,i)=>{b+=t(400+i*80,72,n,{size:14,fill:'var(--blue)'})+t(330,108+i*58,n,{a:'end',size:14,fill:'var(--accent)'});});
 for(let i=0;i<3;i++)for(let j=0;j<3;j++){const v=A[i][j],x=362+j*80,y=82+i*58,hl=(i===0&&j===0)||(i===2&&j===2);const cell=`<rect x="${x}" y="${y}" width="74" height="50" rx="5" fill="${v<0?'var(--orange)':'var(--panel2)'}" fill-opacity="${v<0?0.3:1}" stroke="${hl?(i===0?'var(--accent)':'var(--blue)'):'var(--line)'}" stroke-width="${hl?3:1}"/>`+t(x+37,y+31,v>0?'+'+v:String(v).replace('-','−'),{size:16,w:700});b+=hl?blink(cell,i===0?0:1.2):cell;}
 b+=t(470,272,'최선 +11 · 독립 학습이 흔히 머무는 곳 +5',{size:14,fill:'var(--muted)'});
 return {svg:svg('교차로로 다가오는 두 로봇과 3×3 공동 보상표. 둘 다 질주 11점, 한쪽만 질주 −30점, 둘 다 천천히 5점',b),caption:'두 로봇이 같은 교차로로 들어오는 장면은 시각적 비유이고, 오른쪽 보상표는 실험에 쓰는 가정값입니다. 둘 다 질주하는 11점이 최선이지만, 상대가 가끔 다른 속도를 고르면 −30이 섞여 둘 다 천천히(5점)가 안전해 보입니다.'};
};
F.simreal=()=>{
 const narrow=M.evalPolicy(M.trainedPolicy(0),0.3),wide=M.evalPolicy(M.trainedPolicy(0.2),0.3);let b=t(130,34,'훈련: 매번 다른 바닥',{w:700});
 [0.05,0.32,0.18,0.4,0.11].forEach((s,i)=>{b+=blink(box(30+(i%2)*110,52+Math.floor(i/2)*64,100,52,'var(--blue)','var(--chart)')+t(80+(i%2)*110,84+Math.floor(i/2)*64,`slip ${s}`,{size:15}),i*.6);});
 b+=line('M250 150H330','var(--accent)')+dot(252,150,74,0,'var(--accent)',0,6);
 b+=box(340,60,280,180,'var(--orange)','var(--chart)')+t(480,88,'실제 바닥: 미끄러짐 0.3',{w:700,fill:'var(--orange)'});
 const X=v=>Math.abs(v)/220*190;b+=t(360,124,'마른 바닥만 본 정책',{a:'start',size:14})+grow(360,132,X(narrow),18,'var(--orange)',0)+t(360+X(narrow)>590?590:360+X(narrow)+6,146,f(narrow,0),{a:360+X(narrow)>590?'end':'start',size:14,w:700});
 b+=t(360,184,'0~0.4로 무작위화한 정책',{a:'start',size:14})+grow(360,192,X(wide),18,'var(--accent)',0.4)+t(366+X(wide),206,f(wide,0),{a:'start',size:14,w:700});
 b+=t(480,232,'출발 칸의 기대 이득 (막대가 짧을수록 좋음)',{size:13,fill:'var(--muted)'})+t(320,284,'관측하지 못하는 미끄러짐을 고르게 섞으면 평균 미끄러짐 하나로 훈련한 것과 같습니다',{size:14,fill:'var(--muted)'});
 return {svg:svg(`여러 미끄러짐으로 훈련한 정책이 미끄러짐 0.3 바닥에서 기대 이득 ${f(wide,0)}, 마른 바닥만 본 정책은 ${f(narrow,0)}인 그림`,b),caption:`왼쪽 상자들은 훈련마다 다른 바닥을 뽑는다는 시각적 표현이고, 오른쪽 막대는 절벽 창고에서 가치 반복과 정책 평가로 실제 계산한 출발 칸 기대 이득(${f(narrow,0)} 대 ${f(wide,0)})입니다.`};
};
F.games=()=>{
 const g=M.grpoGroup(8,0.5,21);let b='';
 [['자기 대국','현재 정책끼리',170,60],['탐색 (PUCT)','방문 분포로 개선',290,170],['학습','방문 분포를 목표로',50,170]].forEach(([a,s,x,y],i)=>{b+=blink(box(x,y,170,64,['var(--accent)','var(--blue)','var(--orange)'][i])+t(x+85,y+28,a,{w:700})+t(x+85,y+50,s,{size:13,fill:'var(--muted)'}),i*.8);});
 b+=line('M300 124L340 170','var(--accent)')+line('M290 202H220','var(--blue)')+line('M135 170L190 124','var(--orange)')+dot(300,124,40,46,'var(--accent)',0,5)+dot(288,202,-66,0,'var(--blue)',.8,5)+dot(135,170,55,-46,'var(--orange)',1.6,5);
 b+=t(540,40,'GRPO: 같은 주문 8번',{w:700})+t(540,62,'출고 스캐너가 1/0',{size:13,fill:'var(--muted)'});
 g.rewards.forEach((r,i)=>{const x=480+(i%2)*62,y=78+Math.floor(i/2)*50;b+=blink(`<rect x="${x}" y="${y}" width="56" height="42" rx="5" fill="${r?'var(--accent)':'var(--orange)'}" fill-opacity=".3" stroke="var(--line)"/>`+t(x+28,y+18,r?'✓':'✗',{size:14,w:700})+t(x+28,y+36,f(g.adv[i],2),{size:13}),i*.25);});
 b+=t(540,292,`이점 = (점수 − ${f(g.mean,2)}) / ${f(g.std,2)}`,{size:13,fill:'var(--muted)'});
 return {svg:svg('자기 대국, 탐색, 학습이 도는 고리와, 같은 주문을 8번 시도해 검증기 점수로 묶음 상대 이점을 계산한 GRPO 묶음',b),caption:`왼쪽 고리는 원본이 AlphaZero·MuZero·GRPO를 묶는 구조를 그린 도식입니다. 오른쪽 묶음은 성공 확률 0.5의 검증기로 8번을 시드로 뽑아 이점 (r − 평균)/표준편차를 실제로 계산한 것입니다.`};
};
F.final=()=>{
 let b='';[['젖은 바닥에서 낙하','10장 · 무작위화 범위','var(--orange)'],['점수↑ 그런데 불만↑','8장 · KL 벌점 β','var(--blue)'],['늘 같은 통로만','3장 · 탐험 ε','var(--accent)']].forEach(([a,s,c],i)=>{const y=40+i*82;
  b+=blink(box(30,y,230,64,c)+t(145,y+38,a,{w:700}),i*1.2)+line(`M260 ${y+32}H360`,c)+dot(262,y+32,94,0,c,i*1.2,6)+blink(box(360,y,250,64,'var(--line)','var(--chart)')+t(485,y+28,'의심할 원인',{size:13,fill:'var(--muted)'})+t(485,y+50,s,{size:15,w:700,fill:c}),i*1.2+.6);});
 b+=t(320,290,'처방 → 계산으로 확인 → 부족한 증거 적기',{size:15,fill:'var(--muted)'});
 return {svg:svg('2호 창고의 세 가지 실패 보고가 각각 무작위화 범위, KL 벌점, 탐험 ε라는 의심 원인과 이어지는 진단 도식',b),caption:'세 보고를 앞 장의 변수와 잇는 진단 도식입니다. 화살표는 판단의 흐름을 보여 주는 시각적 표현이며, 실제 효과는 아래 실험에서 앞 장의 계산을 다시 돌려 확인합니다.'};
};
function render(c){return F[c.id]?F[c.id](H):{svg:svg(c.title,''),caption:c.subtitle};}
return {render,F,H};
})();
