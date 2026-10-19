/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 FLMath로 합성 사용자 1,000명(씨앗 7)을 실제로 계산해 그린다.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다. */
window.FLFigures=(()=>{
'use strict';
const M=FLMath,f=(n,d=2)=>Number(n).toFixed(d),int=n=>Math.round(n).toLocaleString('en-US');
/* 숫자·낱말 끝 받침에 맞춘 조사(숫자는 읽는 소리로). */
const josa=(w,a,b)=>{const x=String(w),d='영일이삼사오육칠팔구'['0123456789'.indexOf(x.at(-1))]||x.at(-1),c=d.charCodeAt(0)-0xac00,k=c>=0&&c<11172?c%28:0;return k&&!(a==='으로'&&k===8)?a:b;};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const svg=(label,body,h=280)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${esc(s)}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const blink=(body,delay)=>`<g class="fig-seq" style="animation-delay:${delay}s">${body}</g>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const pkt=(x,y,dx,dy,color,delay=0)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="6" fill="${color}"/>`;
const phone=(x,y,label,stroke='var(--line)',w=44)=>box(x,y,w,78,stroke,'var(--panel2)',9)+`<rect x="${x+6}" y="${y+12}" width="${w-12}" height="40" rx="3" fill="var(--chart)" stroke="var(--line)"/>`+t(x+w/2,y+37,label,{size:11,fill:'var(--muted)'});
const C=['var(--accent)','var(--blue)','var(--orange)'];
/* 무거운 계산(40라운드 FedAvg, 약 0.4초)은 그림이 처음 필요할 때 한 번만 한다. */
let base=null;
const users=()=>M.users(1);
function model(){if(!base)base=M.train(users(),{C:.1,E:5,B:10,rounds:40});return base;}
const draw={
 why(){const raw=M.rawBytes(users()),c=M.commBytes({rounds:1,devices:1});
  const col=(x,title,sub)=>t(x,28,title,{w:700,size:14})+t(x,48,sub,{size:12,fill:'var(--muted)'});
  let b=col(110,'중앙 학습','원문을 서버로 모은다')+col(320,'데이터센터 분산 학습','운영자가 모은 원문을 나눈다')+col(530,'연합학습','원문은 기기에 남는다');
  b+=box(70,190,80,46,'var(--orange)')+t(110,218,'서버',{w:700})+[0,1,2].map(i=>phone(40+i*52,70,'원문','var(--orange)')).join('')+[0,1,2].map(i=>pkt(62+i*52,150,48-i*52,50,'var(--orange)',i*.4)).join('');
  b+=box(270,64,100,40,'var(--orange)')+t(320,89,'모은 원문',{size:13})+[0,1,2,3].map(i=>box(252+i*36,170,30,30,'var(--blue)','var(--panel2)',5)+t(267+i*36,190,`W${i+1}`,{size:10})+line(`M320 104L${267+i*36} 170`,'var(--blue)')).join('')+t(320,228,'기울기 평균 = 한 대의 기울기',{size:12,fill:'var(--blue)'});
  b+=box(490,190,80,46,'var(--accent)')+t(530,218,'서버',{w:700})+[0,1,2].map(i=>phone(458+i*52,70,'원문','var(--accent)')+pkt(480+i*52,150,50-i*52,50,'var(--accent)',i*.4)).join('')+t(530,174,'Δ만',{size:12,fill:'var(--accent)'});
  b+=t(320,264,`원문 전체 ${int(raw)}바이트 · 연합학습에서 기기 한 대가 한 라운드에 주고받는 양 ${int(c.down+c.up)}바이트(숫자 ${M.DIM}개 × 4바이트 × 2)`,{size:12});
  return {svg:svg('세 가지 학습 방식에서 원문이 놓이는 곳과 서버로 가는 것',b),caption:`왼쪽 둘은 원문이 서버나 데이터센터에 모이고, 오른쪽 연합학습만 원문을 기기에 둔 채 업데이트 Δ를 보냅니다. 합성 사용자 1,000명의 원문은 UTF-8로 ${int(raw)}바이트입니다.`};},
 fedavg(){const L=users(),k=[0,1,4],n=k.map(i=>L[i].train.length),m=n.reduce((a,x)=>a+x,0);
  let b=box(250,20,140,44,'var(--accent)')+t(320,47,'서버 모델 wₜ',{w:700});
  b+=k.map((id,i)=>{const x=60+i*200;return line(`M320 64L${x+60} 104`)+box(x,104,120,72,C[i])+t(x+60,126,`기기 ${id} · n=${n[i]}`,{size:13,w:700})+t(x+60,148,'E번 훑기, 묶음 B',{size:12,fill:'var(--muted)'})+t(x+60,166,'→ Δₖ',{size:13})+pkt(x+60,182,320-(x+60),40,C[i],i*.5)+t(x+60,204,`몫 ${n[i]}/${m} = ${f(n[i]/m,3)}`,{size:12,fill:C[i]});}).join('');
  b+=box(200,224,240,40,'var(--text)')+t(320,249,`wₜ₊₁ = wₜ + Σ (nₖ / mₜ) Δₖ,  mₜ = ${m}`,{size:13,w:700});
  return {svg:svg('FedAvg 한 라운드: 기기 셋이 여러 걸음 학습한 업데이트를 학습 쌍 수로 가중 평균',b),caption:`합성 사용자 0·1·4번이 한 라운드에 뽑혔다고 놓고, 서버가 이번 라운드 참여 기기의 학습 쌍 합 mₜ = ${m}${josa(m,'으로','로')} 나눠 가중 평균하는 모습입니다. E = 1, B = ∞이면 FedSGD가 됩니다.`};},
 comm(){const c=M.commBytes({rounds:40,devices:100}),q=M.updateBytes(M.DIM,8);
  const cell=(x,top,bot,col)=>box(x,90,130,70,col)+t(x+65,120,top,{size:16,w:700})+t(x+65,145,bot,{size:12,fill:'var(--muted)'});
  let b=t(320,34,'통신량 = 라운드 수 × 기기 수 × (내려받기 + 올리기)',{w:700})+cell(20,'40','라운드',C[0])+t(162,130,'×',{size:22})+cell(175,'100','기기 (C = 0.1)',C[1])+t(317,130,'×',{size:22})+cell(330,`${int(c.down+c.up)}바이트`,'모델 + 업데이트',C[2])+t(472,130,'=',{size:22})+cell(490,`${f(c.total/1e6,1)} MB`,'모두','var(--text)');
  b+=grow(60,200,c.up/3,22,'var(--blue)')+t(60+c.up/3+8,216,`32비트 업데이트 ${c.up}바이트`,{a:'start',size:12})+grow(60,234,q/3,22,'var(--accent)',.4)+t(60+q/3+8,250,`8비트로 양자화 ${q}바이트(눈금 폭 4바이트 포함)`,{a:'start',size:12});
  return {svg:svg('통신량을 세 수의 곱으로 계산하는 식과 양자화한 업데이트의 크기',b),caption:`가중치 ${M.DIM}개 모델을 한 라운드 100대, 40라운드 주고받으면 ${f(c.total/1e6,1)} MB입니다. 올리는 업데이트를 8비트로 줄이면 기기 한 대가 ${c.up}바이트 대신 ${q}바이트를 보냅니다.`};},
 noniid(){const T=M.DRIFT,a=M.driftRun({steps:20,eta:.1,rounds:15}),s=M.driftRun({steps:20,eta:.1,rounds:15,method:'scaffold'}),X=x=>320+x*70,Y=y=>150-y*42;
  let b=line(`M${X(-3.5)} ${Y(0)}H${X(3.8)}M${X(0)} ${Y(3.2)}V${Y(-2.6)}`,'var(--line)','');
  b+=T.c.map((c,i)=>`<circle cx="${X(c[0])}" cy="${Y(c[1])}" r="7" fill="${C[i]}"/>`+t(X(c[0]),Y(c[1])-12,`기기 ${i+1}의 최적점`,{size:12,fill:C[i]})).join('');
  const path=(p,col)=>`<path class="fig-draw" d="${p.map((q,i)=>`${i?'L':'M'}${X(q[0]).toFixed(1)} ${Y(q[1]).toFixed(1)}`).join('')}" fill="none" stroke="${col}" stroke-width="2.5"/>`;
  b+=path(a.path,'var(--orange)')+path(s.path,'var(--accent)')+`<circle class="fig-pulse" cx="${X(a.opt[0])}" cy="${Y(a.opt[1])}" r="6" fill="none" stroke="var(--text)" stroke-width="2.5"/>`+t(X(a.opt[0])+10,Y(a.opt[1])+22,'전체 최적점',{a:'start',size:12});
  b+=t(20,250,`주황 선: FedAvg(기기마다 20걸음) 15라운드 뒤 최적점과 거리 ${f(a.dist,3)}`,{a:'start',size:12,fill:'var(--orange)'})+t(20,270,`보라 선: SCAFFOLD 거리 ${f(s.dist,4)}`,{a:'start',size:12,fill:'var(--accent)'});
  return {svg:svg('손실이 서로 다른 기기 셋의 최적점과 FedAvg·SCAFFOLD 경로',b,284),caption:`기기 셋의 손실을 2차식으로 정한 축소 모형입니다. 기기 안에서 20걸음씩 학습하면 각 기기의 모델이 자기 최적점 쪽으로 끌려가는 기기 표류(client drift) 때문에 FedAvg는 전체 최적점에서 ${f(a.dist,2)}만큼 떨어진 곳에 머물고, 제어 변수를 쓰는 SCAFFOLD는 최적점에 닿습니다.`};},
 select(){const L=users(),pop=[0,1,2].map(s=>L.filter(u=>u.style===s).length/L.length),T=M.TRAITS;
  const band=(y,v,label,delay)=>{let x=150;return t(140,y+20,label,{a:'end',size:13})+v.map((p,i)=>{const w=p*440,r=grow(x,y,Math.max(w-2,1),30,C[i],delay+i*.15)+(w>50?t(x+w/2,y+20,`${M.STYLES[i]} ${f(p*100,1)}%`,{size:12,fill:'var(--bg)',w:700}):'');x+=w;return r;}).join('');};
  const rate=(y,key,label)=>t(140,y+16,label,{a:'end',size:13})+[0,1,2].map(i=>t(220+i*150,y+16,`${M.STYLES[i]} ${f(T[key][i]*100,0)}%`,{size:13,w:700,fill:C[i]})).join('');
  let b=t(320,34,'새벽 3시에 충전·와이파이·유휴인 기기만 후보로 받으면',{w:700})+band(60,pop,'사용자 1,000명',0)+rate(118,'nightCharge','밤에 충전')+rate(150,'homeWifi','집 와이파이');
  b+=t(320,206,'참여 기기 속 말투 비율이 어떻게 바뀔지 먼저 예측한 뒤 실험에서 세어 보세요',{size:13,w:700,fill:'var(--orange)'})+t(320,234,'기기 상태의 확률은 이 책이 정한 시나리오입니다',{size:12,fill:'var(--muted)'});
  return {svg:svg('사용자 1,000명의 말투 비율과 말투별 밤 충전·집 와이파이 비율',b),caption:'위 띠는 사용자 1,000명의 말투 비율이고, 아래 두 줄은 이 책이 말투마다 정한 밤 충전 비율과 집 와이파이 비율입니다. 새벽 조건이 참여 기기의 말투 비율을 어떻게 바꾸는지는 실험에서 셉니다.'};},
 hetero(){const need=M.stepsNeeded(50,5,10),dl=10;
  let b=t(320,30,`학습 쌍 50개, E = 5, B = 10이면 ${need}걸음 · 마감까지 1초에 등급별 속도만큼`,{w:700,size:14});
  b+=M.TIERS.map((tier,i)=>{const can=dl*M.SPEED[i],y=60+i*64,w=Math.min(can,need)/need*360,ok=can>=need;return t(90,y+26,`${tier} (${M.SPEED[i]}걸음/초)`,{a:'end',size:13})+box(100,y,360,36,'var(--line)','var(--chart)',5)+grow(100,y,w,36,ok?'var(--accent)':'var(--orange)',i*.3)+t(470,y+16,`마감 ${dl}초에 ${can}걸음`,{a:'start',size:12})+t(470,y+32,ok?'다 마침':'못 마침',{a:'start',size:12,fill:ok?'var(--accent)':'var(--orange)'});}).join('');
  b+=t(320,244,'못 마친 기기의 업데이트를 버릴지, 부분 학습이나 작은 모델로 받을지 고릅니다',{size:13,w:700,fill:'var(--orange)'})+t(320,266,`작은 모델은 숫자 ${M.SMALL_DIM}개(전체 ${M.DIM}개)라 한 걸음이 약 ${M.SMALL_SPEEDUP}배 빠르다고 가정합니다`,{size:11,fill:'var(--muted)'});
  return {svg:svg('기기 등급별로 마감 안에 마칠 수 있는 학습 걸음',b),caption:`마감 ${dl}초 안에 고급·중급 기기는 ${need}걸음을 마치지만 보급형은 ${dl*M.SPEED[2]}걸음에서 멈춥니다. 등급별 속도는 이 책이 정한 시나리오이고, 걸음 수는 실제 학습 설정으로 계산했습니다.`};},
 leakage(){const L=users(),u=L.find(x=>x.train.length<=8),d=M.userUpdate(M.zeros(),u.train),r=M.recoverCounts(M.zeros(),d,u.train.length,.3),act=M.countsOf(u.train);
  let b=t(320,30,`기기 ${u.id}의 업데이트 Δ(숫자 ${M.DIM}개)에서 단어 쌍 횟수를 되찾기`,{w:700,size:14})+box(30,54,160,170,'var(--orange)')+t(110,80,'서버가 받은 Δ',{size:13,w:700});
  b+=r.rows.slice(0,5).map((c,i)=>t(110,108+i*24,`${M.CONTEXTS[c]} 줄: ${f(d[c*M.K],3)} …`,{size:12})).join('')+line('M195 140H255','var(--orange)')+t(225,130,'계산',{size:12});
  b+=box(260,54,350,170,'var(--accent)')+t(435,80,'되찾은 쌍(정답과 비교)',{size:13,w:700});
  b+=r.rows.slice(0,5).map((c,i)=>{const ks=r.table[c].map((n,k)=>n?`${M.WORDS[k]}×${n}`:'').filter(Boolean).join(', '),same=r.table[c].every((n,k)=>n===act[c][k]);return blink(t(275,108+i*24,`${M.CONTEXTS[c]} → ${ks} ${same?'✓':'✗'}`,{a:'start',size:13}),i*.5);}).join('');
  b+=t(320,256,r.exact?'FedSGD 업데이트 한 번이면 모든 쌍을 정확히 되찾습니다':'정확히 되찾지 못했습니다',{size:13,w:700,fill:'var(--orange)'});
  return {svg:svg(`기기 ${u.id}의 업데이트에서 되찾은 단어 쌍`,b),caption:`학습 쌍 ${u.train.length}개뿐인 기기 ${u.id}${josa(u.id,'이','가')} 처음 모델(가중치 0)에서 FedSGD로 보낸 업데이트를 서버 쪽에서 풀었습니다. 선형 모델과 원-핫 입력이라 나눗셈과 정수 조건만으로 횟수가 정확히 나옵니다.`};},
 secagg(){const x=[[3,1],[5,2],[-1,4]],s=M.secureAggregate(x,{t:2,double:false,seed:42});
  let b=t(320,30,'쌍마다 한쪽은 +m, 다른 쪽은 −m을 더해 보낸다',{w:700});
  b+=x.map((v,i)=>{const y=60+i*58;return box(20,y,150,44,C[i])+t(95,y+28,`기기 ${i+1}: (${v.join(', ')})`,{size:13,w:700})+line(`M172 ${y+22}H238`,C[i])+box(240,y,190,44,'var(--line)')+blink(t(335,y+28,`보낸 값 (${s.masked[i].join(', ')})`,{size:13}),i*.4)+pkt(432,y+22,90,150-(y+22),C[i],i*.5);}).join('');
  b+=box(470,128,150,60,'var(--accent)')+t(545,152,'서버의 합',{size:13})+t(545,176,`(${s.sum.join(', ')})`,{size:16,w:700,fill:'var(--accent)'});
  b+=t(320,258,`마스크가 서로 지워져 합 (${s.truth.join(', ')})만 남습니다 · 값은 2¹⁶으로 나눈 나머지`,{size:12,fill:'var(--muted)'});
  return {svg:svg('보안 집계: 기기 셋이 마스크를 더해 보낸 값과 서버가 얻는 합',b),caption:`작은 소수(65,537)로 실제로 키를 합의하고 마스크를 만들어 계산했습니다. 서버가 받은 값 하나하나는 원래 값과 닮지 않았지만, 셋을 더하면 원래 합 (${s.truth.join(', ')})이 나옵니다.`};},
 dp(){const e1=M.epsilon({q:.1,z:1,T:40,delta:1e-5}),cx=150,cy=150,S=70,ups=[[60,-20],[110,40],[-40,-90],[30,70]];
  let b=t(320,30,'① 길이 S로 자르기  ② 합에 잡음 zS 더하기  ③ 회계로 ε 계산',{w:700,size:14})+`<circle cx="${cx}" cy="${cy}" r="${S}" fill="none" stroke="var(--accent)" stroke-dasharray="5 4" stroke-width="2"/>`+t(cx,cy+S+20,'반지름 S',{size:12,fill:'var(--accent)'});
  b+=ups.map(([dx,dy],i)=>{const n=Math.hypot(dx,dy),k=n>S?S/n:1;return `<path d="M${cx} ${cy}l${dx} ${dy}" stroke="var(--muted)" stroke-dasharray="3 3" stroke-width="2"/>`+blink(`<path d="M${cx} ${cy}l${(dx*k).toFixed(1)} ${(dy*k).toFixed(1)}" stroke="${C[i%3]}" stroke-width="3"/>`,i*.3);}).join('');
  b+=box(300,70,140,60,'var(--blue)')+t(370,96,'합 + 잡음',{size:13,w:700})+t(370,118,'정규분포, 표준편차 zS',{size:11,fill:'var(--muted)'})+`<circle class="fig-pulse" cx="440" cy="100" r="5" fill="var(--orange)"/>`;
  b+=box(460,60,160,150,'var(--orange)')+t(540,86,'q 0.1, 40라운드',{size:12})+t(540,112,`z = 1 → ε ${f(e1.eps,2)}`,{size:14,w:700})+t(540,140,'z = 2 → ε는 실험에서',{size:13,fill:'var(--muted)'})+t(540,166,'δ = 10⁻⁵',{size:12,fill:'var(--muted)'})+t(540,190,'정수 차수 2~256',{size:11,fill:'var(--muted)'});
  return {svg:svg(`업데이트 자르기와 잡음, z 1에서 ε ${f(e1.eps,2)}`,b),caption:`길이가 S를 넘는 업데이트는 원 둘레까지 줄이고, 합에 잡음을 더합니다. 오른쪽 ε는 사용자 1,000명을 확률 0.1로 40라운드 뽑았을 때 RDP 회계로 실제 계산한 값입니다(포아송 표집 가정). z를 2로 올렸을 때의 ε는 실험에서 계산해 보세요.`};},
 personal(){const L=users(),w=model().w,u=L.find(x=>x.style===2&&x.train.length>=30),c=11,g=M.probs(w,c),lw=M.localTrain(w,u.train,{E:2,B:10,lr:.3,seed:9*13+u.id}).w,p=M.probs(lw,c),m=g.map((x,k)=>.5*x+.5*p[k]),ks=[3,4,5];
  const row=(y,v,label,delay)=>t(150,y+18,label,{a:'end',size:13})+ks.map((k,i)=>grow(160+i*150,y,Math.max(v[k]*140,1),26,C[i],delay)+t(166+i*150+Math.max(v[k]*140,1),y+18,f(v[k],2),{a:'start',size:12})).join('');
  let b=t(320,30,`줄임말 사용자 ${u.id}${josa(u.id,'이','가')} “${M.CONTEXTS[c]}” 다음에 쓸 단어의 확률`,{w:700,size:14})+ks.map((k,i)=>t(230+i*150,62,M.WORDS[k],{size:13,w:700,fill:C[i]})).join('');
  b+=row(80,g,'공용 모델',0)+row(130,p,'기기에서 2번 더 학습',.4)+row(180,m,'λ = 0.5로 섞기',.8);
  b+=t(320,250,'섞은 확률 = λ × 공용 + (1 − λ) × 개인',{size:13,w:700});
  return {svg:svg(`사용자 ${u.id}의 세 모델 확률 비교`,b),caption:`40라운드 FedAvg로 만든 공용 모델과, 줄임말 사용자 ${u.id}${josa(u.id,'이','가')} 자기 학습 쌍으로 두 번 더 학습한 모델, 둘을 반씩 섞은 확률을 실제로 계산했습니다. 공용 모델은 다수인 존댓말 쪽에 확률을 몰아 줍니다.`};},
 fairness(){const pr=M.predict(model().w),hit=u=>M.correct(pr,u.testCount),rows=[...M.groupReport(users(),hit,'tier').rows,...M.groupReport(users(),hit,'fresh').rows],X=v=>140+(v-.45)*1200;
  let b=t(320,30,'묶음별 첫 추천 적중률과 95% 윌슨 구간',{w:700});
  b+=rows.map((r,i)=>{const y=62+i*36;return t(130,y+5,`${r.group} (${r.devices}대)`,{a:'end',size:12})+`<path d="M${X(r.ci[0]).toFixed(1)} ${y}H${X(r.ci[1]).toFixed(1)}" stroke="var(--blue)" stroke-width="3"/>`+blink(`<circle cx="${X(r.acc).toFixed(1)}" cy="${y}" r="6" fill="${r.acc<.6?'var(--orange)':'var(--accent)'}"/>`,i*.25)+t(X(r.ci[1])+10,y+5,f(r.acc,3),{a:'start',size:12});}).join('');
  b+=[.5,.6,.7].map(v=>line(`M${X(v)} 50V${62+rows.length*36-20}`,'var(--line)','')+t(X(v),62+rows.length*36,f(v,1),{size:11,fill:'var(--muted)'})).join('');
  return {svg:svg('기기 등급과 가입 시기별 적중률과 구간',b),caption:'40라운드 FedAvg 모델을 기기마다 시험 쌍 20개로 채점해 맞힌 수만 모은 결과입니다. 전체 평균에서는 보이지 않던 보급형 기기와 새로 가입한 사용자의 낮은 적중률이 묶음으로 나누면 드러납니다.'};},
 deploy(){const d=4096,r=8,lora=M.loraParams({L:1,d,r,mats:1});
  let b=t(320,30,`d × d 행렬 하나(d = ${d})에 랭크 r = ${r} LoRA를 붙이면`,{w:700})+box(40,60,170,170,'var(--muted)','var(--chart)',4)+t(125,140,'W₀ (얼림)',{size:15,w:700})+t(125,164,`${int(d*d)}개`,{size:12,fill:'var(--muted)'});
  b+=t(235,150,'+',{size:24})+box(262,60,22,170,'var(--accent)')+t(273,250,'B',{size:14,w:700})+t(298,150,'×',{size:20})+box(312,128,170,22,'var(--accent)')+t(397,170,'A',{size:14,w:700});
  b+=t(397,200,`B·A 숫자 ${int(lora)}개 = 2dr`,{size:13,w:700,fill:'var(--accent)'})+pkt(560,200,0,-120,'var(--accent)',0)+box(510,52,110,48,'var(--accent)')+t(565,82,'서버',{w:700})+t(565,250,`주고받는 양 ${f(lora/(d*d)*100,2)}%`,{size:12,fill:'var(--accent)'});
  return {svg:svg('얼린 가중치 옆에 붙인 LoRA 행렬 B와 A, 그리고 주고받는 숫자',b),caption:`연합학습에서 LoRA를 쓰면 기기는 B와 A만 학습하고 그것만 서버와 주고받습니다. 이 행렬 하나에서는 ${int(d*d)}개 대신 ${int(lora)}개(256분의 1)입니다.`};},
 final(){const e=M.epsilon({q:.1,z:1,T:40,delta:1e-5}),c=M.commBytes({rounds:1,devices:1}),per=.1*40*(c.down+c.up);
  const knob=(y,a,bb)=>box(30,y,180,40,'var(--blue)')+t(120,y+18,a,{size:13,w:700})+t(120,y+34,bb,{size:11,fill:'var(--muted)'});
  let b=t(320,28,'하린이 정하는 네 값 → 함께 움직이는 세 결과',{w:700})+knob(46,'참여 확률 q','라운드마다 뽑힐 확률')+knob(96,'기기 안 학습 E','자기 데이터를 훑는 횟수')+knob(146,'잡음 배수 z','자른 길이 S의 몇 배')+knob(196,'개인화 비율 λ','공용 모델의 몫');
  b+=[66,116,166,216].map((y,i)=>line(`M212 ${y}C300 ${y} 330 ${80+i*40} 410 ${80+i*40}`,C[i%3])).join('');
  const out=(y,a,bb,col)=>blink(box(410,y,200,58,col)+t(510,y+24,a,{size:14,w:700})+t(510,y+46,bb,{size:12,fill:'var(--muted)'}),y/100);
  b+=out(50,'정확도','전체·줄임말·신규 사용자','var(--accent)')+out(120,'통신량',`q 0.1이면 기기당 약 ${int(per)}바이트`,'var(--blue)')+out(190,'프라이버시 예산 ε',`q 0.1, z 1이면 ${f(e.eps,2)}`,'var(--orange)');
  b+=t(320,270,'40라운드, S = 1, δ = 10⁻⁵ 기준',{size:12,fill:'var(--muted)'});
  return {svg:svg('네 가지 설정과 세 가지 결과의 관계',b),caption:`네 설정은 서로 얽혀 결과 셋을 함께 바꿉니다. 그림의 통신량과 ε는 40라운드 기준으로 실제 계산한 값이고, 정확도는 실험에서 설정마다 계산합니다.`};}
};
function render(id){const r=draw[id]?draw[id]():null;if(r)r.caption+=' 그림의 숫자는 브라우저에서 실제로 계산한 값입니다.';return r;}
return {render};
})();
