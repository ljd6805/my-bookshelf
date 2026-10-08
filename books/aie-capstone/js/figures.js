/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A20Math로 계산한다. */
window.A20Figures=(()=>{
'use strict';
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
/* 점 하나가 (x,y)에서 (x+dx,y+dy)로 반복 이동한다. */
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const turn=(body,i)=>blink(body,i*1.2,i?'fig-turn':'fig-turn fig-first');
const turn2=(a,b)=>turn(a,0)+turn(b,1)+turn(a,2)+turn(b,3);
const poly=(pts,stroke,cls='fig-draw',w=2.5)=>`<polyline class="${cls}" points="${pts.map(p=>p.map(v=>+v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${w}"/>`;
const H={svg,t,box,line,dot,blink,turn,turn2,grow,pulse,poly};
const F={},M=A20Math,f=(n,d=1)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}).replace('-','−');
F.harness=({svg,t,box,line,dot,grow})=>{
 const st=['계획','실행','도구 대기','반성'],c=['var(--accent)','var(--blue)','var(--orange)','var(--accent)'];let b='';
 st.forEach((s,i)=>{const x=24+i*152;b+=box(x,40,128,62,c[i])+t(x+64,77,s,{w:700});if(i<3)b+=line(`M${x+128} 71H${x+152}`)+dot(x+124,71,26,0,c[i],i*.6,5);});
 b+=line('M560 102V128H88V102','var(--muted)')+dot(560,128,-470,0,'var(--orange)',1.4,5)+t(324,148,'실패하면 재계획 · 재계획은 최대 5번, 걸음 예산 안에서만',{size:14,fill:'var(--muted)'});
 [1,3,5].forEach((n,i)=>{const r=M.retryStats(0.2,n,5),y=178+i*36;b+=(`<g>${t(24,y+18,`최대 ${n}번`,{a:'start',size:15,w:700})}${grow(130,y,r.success*300,24,'var(--accent)',0)}${t(440,y+18,`성공 ${f(r.success,3)}`,{a:'start',size:14})}${grow(130,y+26,Math.min(r.worst,40)/40*300,6,'var(--orange)',0)}${t(540,y+30,`최악 ${f(r.worst,1)}초`,{a:'start',size:13,fill:'var(--orange)'})}</g>`);});
 return {svg:svg('계획·실행·도구 대기·반성의 고리와, 시간 초과 확률 0.2에서 최대 시도 1·3·5번의 성공 확률과 최악 지연 막대',b),caption:'위쪽은 상태 기계로 적은 에이전트 고리이고, 실패하면 재계획 화살표를 따라 돌아갑니다. 아래 막대는 시간 초과 확률 0.2, 시간 초과 5초에서 최대 시도 횟수별 성공 확률(초록)과 최악 지연(주황)을 A20Math로 계산한 것입니다.'};
};
F.verify=({svg,t,poly,line,dot,pulse})=>{
 const X=k=>70+(k-1)*30,Y=v=>250-v*190,u=[],n=[];let b='';
 for(let k=1;k<=10;k++){u.push([X(k),Y(M.passAtK(10,3,k))]);n.push([X(k),Y(M.passNaive(0.3,k))]);}
 b+=`<path d="M70 60V250H340" stroke="var(--line)" fill="none"/>`+t(205,280,'시도 횟수 k (1~10)',{size:13,fill:'var(--muted)'})+t(70,48,'pass@k',{a:'start',size:13,fill:'var(--muted)'});
 b+=poly(u,'var(--accent)')+poly(n,'var(--blue)','fig-draw',2)+t(250,90,`비편향 pass@5 = ${f(M.passAtK(10,3,5),3)}`,{size:14,fill:'var(--accent)'})+t(250,116,`단순 1 − 0.7⁵ = ${f(M.passNaive(0.3,5),3)}`,{size:14,fill:'var(--blue)'});
 const ts=M.tailSampling(1e5,0.02,0.1,0.01);
 b+=`<rect x="400" y="70" width="210" height="150" rx="10" fill="var(--panel2)" stroke="var(--line)"/>`+t(505,98,'꼬리 표집',{w:700});
 for(let i=0;i<10;i++){const err=i===2,keep=i===6;b+=`<rect x="${416+i*19}" y="116" width="14" height="30" rx="2" fill="${err?'var(--orange)':keep?'var(--accent)':'var(--line)'}"/>`;}
 b+=t(505,170,'오류는 모두 · 성공은 10%',{size:13,fill:'var(--muted)'})+t(505,198,`첫 결함 발견 ≈ ${f(ts.minutes,1)}분`,{size:14})+pulse(587,131,9,'var(--orange)')+dot(505,222,0,40,'var(--accent)',0.4,5);
 return {svg:svg('10번 중 3번 통과한 과제의 비편향 pass@k와 단순 추정 곡선, 그리고 오류는 모두 성공은 일부만 남기는 꼬리 표집',b),caption:`왼쪽은 10번 중 3번 통과한 과제에서 k에 따른 비편향 pass@k(초록)와 단순 추정(파랑)을 계산한 곡선입니다. 오른쪽은 하루 10만 요청, 오류 2%, 성공 10% 보관에서 성공 응답 1%의 결함을 처음 보기까지 약 ${f(ts.minutes,1)}분이 걸린다는 계산입니다.`};
};
F.products=({svg,t,grow,box,turn2})=>{
 const r=M.teamCost(4,0.6,0.25),roles=['설계','코더','리뷰어','테스터'];let b='';
 b+=t(24,40,'단일 에이전트 · 40턴',{a:'start',size:15,w:700})+grow(24,52,40/160*560,26,'var(--blue)',0);
 roles.forEach((s,i)=>{b+=t(24,124+i*34,s,{a:'start',size:14})+grow(90,108+i*34,40/160*560,22,'var(--accent)',0.3*i);});
 b+=t(24,262,`팀 · 역할 4개 × 40턴 = ${r.teamTurns}턴`,{a:'start',size:15,w:700});
 const a=`<g>${box(400,110,220,96,'var(--orange)')}${t(510,140,'손익분기 해결률',{size:14,fill:'var(--muted)'})}${t(510,176,`4 × 0.25 = ${f(r.breakEven,2)}`,{size:20,w:700})}</g>`,c=`<g>${box(400,110,220,96,'var(--orange)')}${t(510,140,'해결당 비용(팀 0.6)',{size:14,fill:'var(--muted)'})}${t(510,176,`단일의 ${f(r.ratio,2)}배`,{size:20,w:700})}</g>`;
 b+=turn2(a,c);
 return {svg:svg('단일 에이전트 40턴과 역할 4개 팀 160턴의 토큰 막대, 손익분기 해결률 1.00',b),caption:`역할 팀은 역할 수만큼 턴이 늘어납니다. 단일 에이전트의 해결률이 0.25면 역할 4개 팀은 해결률 ${f(r.breakEven,2)}를 넘어야 해결당 비용이 같아지므로, 0.6을 풀어도 해결당 비용이 단일의 ${f(r.ratio,2)}배입니다(교육용 가정값으로 계산).`};
};
F.research=({svg,t,grow,line,pulse,box})=>{
 const r=M.ucbRun(1.4,30),names=['A','B','C','D'];let b=box(250,24,140,44,'var(--accent)')+t(320,52,'질문 · 예산 30번',{size:14,w:700});
 names.forEach((s,i)=>{const x=40+i*150;b+=line(`M320 68L${x+50} 110`)+box(x,110,100,40,i===3?'var(--accent)':'var(--line)')+t(x+50,136,`갈래 ${s} (${f(M.UCB_MEANS[i],2)})`,{size:13});
  b+=grow(x+30,262-r.runs[i]*8,40,r.runs[i]*8,i===3?'var(--accent)':'var(--blue)',0.2*i)+t(x+50,284,`${r.runs[i]}번${r.pruned[i]?' · 가지침':''}`,{size:14});
  if(r.trigger[i])b+=pulse(x+90,112,8,'var(--orange)')+t(x+50,170,`${r.trigger[i]}번째에 신호`,{size:13,fill:'var(--orange)'});});
 return {svg:svg('UCB1이 네 갈래 실험에 예산 30번을 나눈 실행 횟수와 가지치기, 논문 신호 시점',b),caption:`c = 1.4, 예산 30번으로 UCB1을 돌린 시뮬레이션입니다. 참 평균이 가장 높은 D에 ${r.runs[3]}번을 썼고, 평균 0.15인 A는 세 번 만에 가지쳤으며, C는 첫 실행의 운으로 일찍 신호를 냈습니다(참 평균과 잡음은 교육용 가정값).`};
};
F.gpt=({svg,t,grow,dot,box,line})=>{
 const r=M.gptParams(12,768),W=580,s=W/r.total;let b=t(30,40,`GPT 124M 설정 · 전체 ${f(r.total,0)}개`,{a:'start',size:16,w:700});
 const parts=[['블록 12개',r.blocks,'var(--accent)'],['토큰 임베딩',r.tok,'var(--blue)'],['위치',r.pos,'var(--orange)']];let x=30;
 parts.forEach(([n,v,c],i)=>{b+=grow(x,60,v*s,40,c,0.4*i);if(v*s>60)b+=t(x+v*s/2,128,`${n} ${f(v/1e6,1)}M`,{size:14});x+=v*s;});
 b+=t(600,128,'위치 0.8M',{a:'end',size:13,fill:'var(--orange)'});
 const st=['토큰','임베딩','블록 × 12','출력(묶음)'];st.forEach((n,i)=>{const bx=30+i*152;b+=box(bx,170,124,50,i===2?'var(--accent)':'var(--line)')+t(bx+62,200,n,{size:14});if(i<3)b+=line(`M${bx+124} 195H${bx+152}`)+dot(bx+120,195,30,0,'var(--accent)',i*.5,5);});
 b+=t(30,262,`블록 하나 12d² + 13d = ${f(r.block,0)} · bf16 가중치 ${f(r.bf16GB,2)} GB · Adam 학습 상태 ${f(r.trainGB,2)} GB`,{a:'start',size:14,fill:'var(--muted)'});
 return {svg:svg('GPT 124M의 매개변수를 블록, 토큰 임베딩, 위치 임베딩으로 나눈 막대와 토큰이 지나는 순서',b),caption:'어휘 50,257, 폭 768, 12층, 출력층을 토큰 임베딩과 묶은 설정의 매개변수를 A20Math로 센 막대입니다. 블록이 약 68%, 토큰 임베딩이 약 31%를 차지합니다.'};
};
F.posttrain=({svg,t,box,line,dot,poly})=>{
 const st=['사전학습','SFT','DPO','평가표'];let b='';
 st.forEach((s,i)=>{const x=24+i*152;b+=box(x,30,124,50,i===2?'var(--accent)':'var(--line)')+t(x+62,61,s,{w:700});if(i<3)b+=line(`M${x+124} 55H${x+152}`)+dot(x+120,55,30,0,'var(--accent)',i*.6,5);});
 const X=v=>70+v/2*300,Y=v=>270-v*150,pw=[],kl=[];for(let x=0.05;x<=2.0001;x+=0.05){const r=M.dpoPolicy(x,1);pw.push([X(x),Y(r.pw)]);kl.push([X(x),Y(r.kl/Math.log(2))]);}
 b+=`<path d="M70 110V270H370" stroke="var(--line)" fill="none"/>`+poly(pw,'var(--accent)')+poly(kl,'var(--blue)','fig-draw',2)+t(220,292,'β (0 ~ 2), 보상 차 1',{size:13,fill:'var(--muted)'});
 const a=M.dpoPolicy(0.5,1),c=M.dpoPolicy(1,1),d=M.dpoPolicy(2,1);
 b+=t(400,140,'선호 응답 확률 σ(Δr/β)',{a:'start',size:14,fill:'var(--accent)'})+t(400,166,`β 0.5 → ${f(a.pw,2)} · 1 → ${f(c.pw,2)} · 2 → ${f(d.pw,2)}`,{a:'start',size:14})+t(400,206,'KL ÷ ln 2 (파랑)',{a:'start',size:14,fill:'var(--blue)'})+t(400,232,`β 0.5 → ${f(a.kl/Math.log(2),2)} · 2 → ${f(d.kl/Math.log(2),2)}`,{a:'start',size:14});
 return {svg:svg('사전학습에서 SFT, DPO, 평가표로 이어지는 파이프라인과 β에 따른 선호 확률과 KL 곡선',b),caption:'위는 원본 캡스톤 07의 파이프라인이고, 아래는 응답 두 개짜리 문제에서 β를 바꿀 때 DPO가 겨냥하는 정책의 선호 확률(초록)과 기준 정책으로부터의 KL(파랑)을 닫힌 식으로 계산한 곡선입니다. β가 작을수록 한쪽으로 쏠리고 멀어집니다.'};
};
F.scale=({svg,t,grow,blink})=>{
 const st=[['DDP','ddp'],['ZeRO-1','z1'],['ZeRO-2','z2'],['ZeRO-3','z3']],s=200/112;let b=t(24,30,'7B · 장비 8대 · 장비당 GB',{a:'start',size:14,w:700});
 st.forEach(([n,k],i)=>{const r=M.zeroMem(7,8,k),y=52+i*44;b+=t(24,y+20,n,{a:'start',size:14})+grow(96,y,r.gb*s,26,i?'var(--accent)':'var(--blue)',0.3*i)+t(100+r.gb*s,y+20,f(r.gb,1),{a:'start',size:14});});
 b+=`<path d="M${96+80*s} 44V226" stroke="var(--orange)" stroke-dasharray="5 4" stroke-width="2"/>`+t(96+80*s,246,'80GB',{size:13,fill:'var(--orange)'});
 const S=4,Mb=8,cw=12,r=M.bubble(S,Mb);b+=t(360,30,`파이프라인 단계 ${S} · 마이크로배치 ${Mb}`,{a:'start',size:14,w:700});
 for(let st2=0;st2<S;st2++){let cells='';for(let c=0;c<Mb+S-1;c++){const busy=c>=st2&&c<st2+Mb;cells+=`<rect x="${360+c*(cw+8)}" y="${52+st2*34}" width="${cw+4}" height="24" rx="2" fill="${busy?'var(--accent)':'none'}" stroke="${busy?'none':'var(--muted)'}" stroke-dasharray="3 3"/>`;}b+=blink(`<g>${cells}</g>`,st2*0.4);}
 b+=t(360,210,`앞 계산 칸 중 쉬는 칸(점선) ${f(r.fraction*100,1)}%`,{a:'start',size:14})+t(360,236,`GPipe 활성값 ${r.gpipeAct}개 · 1F1B ${r.ofobAct}개`,{a:'start',size:14,fill:'var(--muted)'});
 return {svg:svg('7B 모델 장비 8대에서 DDP와 ZeRO 단계별 장비당 메모리 막대, 그리고 단계 4 마이크로배치 8의 파이프라인 거품 격자',b),caption:'왼쪽은 혼합 정밀도 Adam의 16바이트를 ZeRO 단계마다 장비 8대에 나눈 장비당 메모리이고, 주황 점선은 비교용 80GB입니다. 오른쪽은 단계 4, 마이크로배치 8의 앞 계산 일정으로, 점선 칸이 거품입니다. 모두 A20Math의 실제 계산입니다.'};
};
F.rag=({svg,t,turn})=>{
 const names=[['base','기본 벡터'],['hybrid','하이브리드'],['rerank','+ 재순위']];let b=t(24,30,'같은 질문, 세 파이프라인의 상위 10개 (채운 칸이 정답)',{a:'start',size:14,w:700});
 names.forEach(([k,n],i)=>{const list=M.RAG_RUNS[k],r=M.ragRun(k,10),y=56+i*72;b+=t(24,y+22,n,{a:'start',size:14});
  let cells='';list.forEach((d,j)=>{const g=M.RAG_GOLD[d]||0;cells+=`<rect x="${130+j*36}" y="${y}" width="30" height="34" rx="4" fill="${g?'var(--accent)':'var(--panel2)'}" stroke="var(--line)"/>`+(g?t(145+j*36,y+23,g,{size:14,fill:'var(--bg)',w:700}):'');});
  b+=cells+turn(`<rect x="126" y="${y-4}" width="${r.fullAt*36+2}" height="42" rx="6" fill="none" stroke="var(--orange)" stroke-width="3"/>`,i)+t(130,y+54,`정답 셋을 모두 담는 k = ${r.fullAt} · ${f(r.fullAt*400,0)}토큰 · MRR ${f(r.mrr,2)}`,{a:'start',size:13,fill:'var(--muted)'});});
 return {svg:svg('기본 벡터, 하이브리드, 재순위 파이프라인의 순위 목록과 정답 셋을 모두 담는 데 필요한 조각 수',b),caption:'같은 질문에 대한 세 순위 목록(교육용 가정값)에서 정답 조각의 위치와, 정답 셋을 모두 담으려면 몇 조각을 보여 줘야 하는지 계산했습니다. 순위를 고치면 같은 재현율을 10조각에서 3조각으로 얻습니다.'};
};
F.multimodal=({svg,t,turn2,dot})=>{
 const a=M.patchTokens(224,16),c=M.patchTokens(448,16);
 const grid=(n,size)=>{let g='';const cs=size/n;for(let i=0;i<=n;i++)g+=`<path d="M${40+i*cs} 50V${50+size}M40 ${50+i*cs}H${40+size}" stroke="var(--accent)" stroke-width="${n>20?0.6:1}"/>`;return g;};
 const A=`<g>${grid(14,196)}${t(138,272,`224 ÷ 16 = 14 → ${a.patches}개`,{size:14})}</g>`,C=`<g>${grid(28,196)}${t(138,272,`448 ÷ 16 = 28 → ${c.patches}개`,{size:14})}</g>`;
 let b=`<rect x="40" y="50" width="196" height="196" fill="var(--panel2)"/>`+turn2(A,C);
 for(let i=0;i<8;i++)b+=`<rect x="${300+i*36}" y="70" width="30" height="30" rx="4" fill="${i?'var(--blue)':'var(--orange)'}"/>`;
 b+=t(300,58,'CLS + 패치 토큰 → ViT 12층',{a:'start',size:14})+dot(240,85,56,0,'var(--accent)',0,5);
 b+=t(300,150,`자기 어텐션 쌍: ${f(a.selfPairs,0)} → ${f(c.selfPairs,0)}`,{a:'start',size:14})+t(300,176,`약 ${f(c.rel,1)}배 (토큰은 4배)`,{a:'start',size:14,w:700,fill:'var(--accent)'})+t(300,214,`글 64토큰과의 교차 쌍: ${f(a.crossPairs,0)} → ${f(c.crossPairs,0)}`,{a:'start',size:14,fill:'var(--muted)'});
 return {svg:svg('224 그림과 448 그림을 16 패치로 자른 격자, 패치 토큰 수와 어텐션 쌍의 증가',b),caption:'한 변 224와 448 그림을 16 × 16 패치로 자르면 토큰이 196개에서 784개로 네 배가 되고, CLS를 더한 자기 어텐션 쌍은 약 15.9배가 됩니다. 수는 A20Math의 실제 계산입니다.'};
};
F.evals=({svg,t,grow})=>{
 const x=v=>120+(v+0.04)/0.12*440,ns=[50,100,200,800];let b=`<path d="M${x(0)} 30V250" stroke="var(--muted)" stroke-width="1.5"/>`+t(x(0),272,'0',{size:14})+`<path d="M${x(0.02)} 30V250" stroke="var(--orange)" stroke-dasharray="5 4"/>`+t(x(0.02),24,'참 차이 0.02',{size:13,fill:'var(--orange)'});
 ns.forEach((n,i)=>{const r=M.bootstrapDiff(n,0.02),y=60+i*50,lo=Math.max(-0.04,r.lo);b+=t(108,y+6,`과제 ${n}`,{a:'end',size:14})+grow(x(lo),y-6,x(r.hi)-x(lo),12,r.verdict==='tie'?'var(--blue)':'var(--accent)',0.4*i)+t(x(r.hi)+8,y+6,r.verdict==='tie'?'판정 보류':'나아짐',{a:'start',size:13});});
 return {svg:svg('참 차이 0.02에서 과제 수 50, 100, 200, 800의 부트스트랩 95% 구간',b),caption:'참 차이 0.02에서 과제 수를 늘리며 짝지은 부트스트랩 95% 구간을 계산했습니다. 구간이 0을 포함하면 판정을 보류하고(파랑), 200개부터 구간 전체가 0 위로 올라옵니다(초록). 과제별 잡음은 교육용 가정 분포입니다.'};
};
F.safety=({svg,t,pulse})=>{
 const {att,ben}=M.gateFixture(),g=M.gateStats(0.7,0.01),x=v=>40+v*560;let b=`<rect x="${x(0.7)}" y="30" width="${x(1)-x(0.7)}" height="190" fill="var(--orange)" fill-opacity=".12"/><path class="fig-dash" d="M${x(0.7)} 30V220" stroke="var(--orange)" stroke-width="2.5"/>`+t(x(0.7)+6,48,'차단 ≥ 0.7',{a:'start',size:14,fill:'var(--orange)'});
 att.forEach((s,i)=>{b+=`<circle cx="${x(s)}" cy="${80+(i%5)*12}" r="5" fill="var(--accent)"/>`;});ben.forEach((s,i)=>{b+=`<rect x="${x(s)-4.5}" y="${160+(i%5)*12}" width="9" height="9" fill="var(--blue)"/>`;});
 b+=t(40,72,'공격 50',{a:'start',size:13,fill:'var(--accent)'})+t(40,152,'정상 50',{a:'start',size:13,fill:'var(--blue)'})+pulse(x(0.87),164,10,'var(--orange)');
 b+=t(40,250,`탐지율 ${f(g.tpr*100,0)}% · 오탐률 ${f(g.fpr*100,0)}% · 공격이 1%면 “막았다” 중 진짜 공격 ${f(g.precision*100,1)}%`,{a:'start',size:15,w:700})+t(x(0),278,'0',{size:13,fill:'var(--muted)'})+t(320,278,'탐지기 점수',{size:13,fill:'var(--muted)'})+t(x(1),278,'1',{size:13,fill:'var(--muted)'});
 return {svg:svg('공격 50개와 정상 50개의 탐지기 점수 분포와 차단 문턱 0.7, 기저율 1%에서의 차단 정밀도',b),caption:`문턱 0.7에서 공격의 ${f(g.tpr*100,0)}%와 정상의 ${f(g.fpr*100,0)}%가 막힙니다. 공격이 요청의 1%뿐이면 막힌 요청 가운데 진짜 공격은 약 ${f(g.precision*100,1)}%입니다. 점수는 교육용 가정 분포의 고정값이고, 비율은 실제 계산입니다.`};
};
F.final=({svg,t,turn2})=>{
 const T=M.LAUNCH_TARGET,rows=[['월 비용','monthly','달러',0,1],['p95 지연','p95','초',1,1],['통과율','pass','',2,0],['정상 차단','benignBlocked','건',0,1],['막지 못한 공격','attackNotBlocked','건',0,1]];
 const sheet=(r,title,y0)=>{let g=t(24,36,title,{a:'start',size:15,w:700});rows.forEach(([n,k,u,d,le],i)=>{const v=r[k],ok=le?v<=T[k]:v>=T[k],y=66+i*42;g+=`<rect x="24" y="${y-22}" width="592" height="34" rx="5" fill="var(--panel2)" stroke="${ok?'var(--accent)':'var(--orange)'}"/>`+t(40,y,n,{a:'start',size:14})+t(330,y,`${f(v,d)}${u?' '+u:''}`,{a:'end',size:14,w:700})+t(350,y,`목표 ${le?'≤':'≥'} ${f(T[k],le?0:2)}`,{a:'start',size:14,fill:'var(--muted)'})+t(600,y,ok?'지킴':'넘김',{a:'end',size:14,w:700,fill:ok?'var(--accent)':'var(--orange)'});});return `<g>${g}</g>`;};
 const a=M.launchSheet(3,'seq',10,0.7,0),c=M.launchSheet(2,'seq',5,0.9,1);
 const svgBody=turn2(sheet(a,'지금 설정: 차례로 3번 · 조각 10 · 문턱 0.7 · 출력 층 끔'),sheet(c,'한 가지 답: 차례로 2번 · 조각 5 · 문턱 0.9 · 출력 층 켬'));
 return {svg:svg('사용량이 두 배가 된 달의 출시 사양표 다섯 줄을 지금 설정과 찾은 조합으로 번갈아 보여 줌',svgBody),caption:'월 88,000과제에서 지금 설정은 통과율만 지키고 네 줄을 넘깁니다. 손잡이 다섯 개를 함께 움직이면 다섯 줄을 모두 지키는 조합이 나오지만, 그 답은 교육용 가정값, 특히 정상 50개에서 본 오탐 0건에 기대고 있습니다.'};
};
/* 기본 그림: flow 단계를 상자로 놓고 점이 차례로 지나간다. 장마다 F[장ID]로 고유 그림을 만든다. */
function fallback(c){
 const steps=c.flow.map(x=>x.split('|')),n=steps.length,w=(600-(n-1)*20)/n,colors=['var(--accent)','var(--blue)','var(--orange)','var(--accent)'];
 let b='';steps.forEach(([a,s],i)=>{const x=20+i*(w+20);b+=blink(box(x,90,w,110,colors[i%4]),i*.6)+t(x+w/2,140,a,{w:700})+t(x+w/2,168,s.length>14?s.slice(0,14)+'…':s,{size:12,fill:'var(--muted)'});if(i<n-1)b+=line(`M${x+w} 145H${x+w+20}`)+dot(x+w-4,145,24,0,colors[i%4],i*.6,5);});
 return {svg:svg(`${c.title}의 흐름: ${steps.map(s=>s[0]).join(', ')}`,b),caption:`${c.subtitle}`};
}
function render(c){return F[c.id]?F[c.id](H):fallback(c);}
return {render,F,H};
})();
