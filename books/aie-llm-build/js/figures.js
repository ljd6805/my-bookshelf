/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A11Math로 계산한다. */
window.A11Figures=(()=>{
'use strict';
const M=A11Math;
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
/* 점 하나가 (x,y)에서 (x+dx,y+dy)로 반복 이동한다. */
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const turn=(body,i)=>blink(body,i*1.2,i?'fig-turn':'fig-turn fig-first');
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
/* 실선은 fig-draw로 그려지며 나타나고, 점선은 fig-seq로 깜박이며 나타난다. */
const draw=(pts,color,w=3,dash='')=>{const P=pts.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ');return dash?blink(`<polyline points="${P}" fill="none" stroke="${color}" stroke-width="${w}" stroke-dasharray="${dash}"/>`,0.4):`<polyline class="fig-draw" pathLength="1000" points="${P}" fill="none" stroke="${color}" stroke-width="${w}"/>`;};
const f=(n,d=2)=>Number(n).toFixed(d);
const H={svg,t,box,line,dot,blink,turn,grow,pulse,draw};
const F={};

/* 1장: " 서재봇은"이 병합 횟수에 따라 13조각에서 1조각으로 합쳐진다. 병합표는 한국어 소개문으로 실제 학습한다. */
F.tokenizer=()=>{
 const tb=M.bpeTrain(M.DATA.corpus.ko,60),steps=[0,5,10,20,30];let b=t(320,32,'" 서재봇은" (13바이트)를 자르는 조각',{size:15,w:700});
 steps.forEach((n,i)=>{const ids=M.bpeEncode(' 서재봇은',tb.merges.slice(0,n)),ps=ids.map(id=>M.tokenBytes(id,tb.merges)),unit=560/13;let x=40,g='';
  ps.forEach(p=>{const w=p.length*unit;const s=M.showBytes(p);g+=box(x+1,120,w-2,64,'var(--accent)',p.length>1?'color-mix(in srgb,var(--accent) 22%,var(--panel2))':'var(--panel2)',6)+(w>=36?t(x+w/2,158,s.length<=5?s:s[0]==='‹'?p.length+'바이트':s.slice(0,5),{size:13}):'');x+=w;});
  g+=t(320,226,`병합 ${n}회 · <tspan font-weight="700" fill="var(--accent)">${ids.length}토큰</tspan>`,{size:16})+t(320,254,n===0?'바이트 하나가 토큰 하나 (한글 한 글자 = 3바이트)':n<20?'자주 붙어 나온 바이트 쌍부터 합칩니다':'자주 쓰는 낱말은 한 토큰이 됩니다',{size:14,fill:'var(--muted)'});
  b+=turn(g,i);});
 b+=t(40,92,'바이트 칸 13개',{a:'start',size:13,fill:'var(--muted)'});
 return {svg:svg('「 서재봇은」이라는 13바이트가 병합 0회, 5회, 10회, 20회, 30회를 거치며 13토큰에서 1토큰으로 합쳐지는 모습',b),caption:'한국어 소개문(398바이트)으로 이 페이지가 직접 학습한 병합표를 앞에서부터 적용한 결과입니다. 칸의 폭은 바이트 수이고, 꺾쇠 조각은 글자 하나를 다 채우지 못한 바이트입니다.'};
};

/* 2장: 원문 → 중복 판정 → 패킹. 숫자는 이 책의 교육용 문서와 길이로 계산한다. */
F.data=()=>{
 const D=M.DATA,A=M.shingles(D.docs.a),B=M.shingles(D.docs.b),J=M.jaccard(A,B),p=M.packing(D.lengths,1024);let b='';
 b+=box(30,60,170,150,'var(--blue)')+t(115,90,'원문 두 편',{w:700})+t(115,125,'공지문',{size:14})+t(115,150,'광고 붙은 사본',{size:14})+t(115,190,`Jaccard ${f(J)}`,{size:14,fill:'var(--orange)',w:700});
 b+=line('M200 135H250')+dot(200,135,50,0,'var(--blue)',0,5);
 b+=blink(box(250,60,150,150,'var(--orange)'),0.4)+t(325,90,'중복 판정',{w:700})+t(325,125,'문턱 0.8 이상',{size:14})+t(325,150,'→ 하나만 남김',{size:14})+pulse(325,185,14,'var(--orange)');
 b+=line('M400 135H440')+dot(400,135,40,0,'var(--orange)',0.8,5);
 b+=t(530,50,'학습 길이 1,024',{size:14,w:700});
 b+=t(450,92,'패딩',{a:'start',size:13,fill:'var(--muted)'})+`<rect x="450" y="100" width="160" height="20" rx="3" fill="var(--panel2)"/>`+grow(450,100,160*p.padUtil,20,'var(--muted)',0.6)+t(610,140,`${f(p.padUtil*100,0)}% 채움`,{a:'end',size:13,fill:'var(--muted)'});
 b+=t(450,172,'패킹',{a:'start',size:13,fill:'var(--muted)'})+`<rect x="450" y="180" width="160" height="20" rx="3" fill="var(--panel2)"/>`+grow(450,180,160*p.packUtil,20,'var(--accent)',1.2)+t(610,220,`${f(p.packUtil*100,0)}% 채움`,{a:'end',size:13,fill:'var(--accent)',w:700});
 b+=t(320,270,'걸러 낸 뒤 이어 붙여야 GPU가 빈칸을 계산하지 않습니다',{size:14,fill:'var(--muted)'});
 return {svg:svg(`거의 같은 두 글이 Jaccard ${f(J)}로 중복 판정되어 하나만 남고, 남은 문서를 패킹하면 학습 자리의 ${f(p.packUtil*100,0)}%가 찬다는 흐름`,b),caption:`두 글의 낱말 3-gram Jaccard와 활용률은 이 책의 교육용 글과 문서 길이 12개로 실제 계산한 값입니다. 문서마다 따로 채우는 패딩은 ${f(p.padUtil*100,0)}%, 이어 붙이는 패킹은 ${f(p.packUtil*100,0)}%를 씁니다.`};
};

/* 3장: 바이그램 손실 곡선이 ln V에서 출발해 바닥으로 내려간다. */
F.pretrain=()=>{
 const d=M.bigramData(M.DATA.corpus.ko),r=M.bigramTrain(d,400,20),fl=M.bigramFloor(d),X=i=>70+i/400*520,Y=v=>250-v/4.5*200;let b='';
 b+=`<path d="M70 50V250H590" stroke="var(--line)" fill="none"/>`+t(64,Y(r.hist[0])+5,f(r.hist[0]),{a:'end',size:13,fill:'var(--muted)'})+t(64,Y(fl)+5,f(fl),{a:'end',size:13,fill:'var(--orange)'});
 b+=draw([[70,Y(fl)],[590,Y(fl)]],'var(--orange)',2,'6 5')+draw(r.hist.filter((_,i)=>i%5===0).map((v,i)=>[X(i*5),Y(v)]),'var(--accent)',3);
 b+=t(330,276,'경사하강 갱신 횟수 (0 → 400)',{size:14,fill:'var(--muted)'})+t(80,Y(r.hist[0])-12,`시작 = ln ${d.V} (모든 글자 같은 확률)`,{a:'start',size:14})+t(580,Y(fl)-12,'빈도로 센 바닥',{a:'end',size:14,fill:'var(--orange)'});
 b+=pulse(X(400),Y(r.hist[400]),9,'var(--accent)')+t(580,Y(r.hist[400])+34,`400회 뒤 ${f(r.hist[400],3)}`,{a:'end',size:14,fill:'var(--accent)',w:700});
 return {svg:svg(`글자 바이그램 모델의 손실이 ln ${d.V} = ${f(r.hist[0])}에서 시작해 400번 갱신 뒤 ${f(r.hist[400],3)}로, 바닥 ${f(fl,3)} 가까이 내려가는 곡선`,b),caption:`한국어 소개문의 글자 ${d.V}종으로 바이그램 로짓 표를 학습률 20으로 실제 학습한 손실 곡선입니다. 아무리 학습해도 이 모델은 주황 점선(앞 글자 하나만 보고 얻을 수 있는 최선) 아래로 내려가지 못합니다.`};
};

/* 4장: 파라미터 하나의 16바이트와 ZeRO 단계별 GPU 한 장의 몫(8B, GPU 8장). */
F.memory=()=>{
 let b=t(320,30,'파라미터 하나 = 16바이트 (혼합 정밀도 Adam)',{w:700});
 const parts=[['가중치',2,'var(--accent)'],['기울기',2,'var(--blue)'],['FP32 가중치 사본',4,'var(--orange)'],['모멘텀',4,'var(--orange)'],['분산',4,'var(--orange)']];let x=40;
 parts.forEach(([n,by,c],i)=>{const w=by*35;b+=grow(x,50,w-3,40,c,i*0.3)+t(x+w/2,112,n,{size:13,fill:'var(--muted)'})+t(x+w/2,76,by+'B',{size:14,fill:'var(--bg)',w:700});x+=w;});
 b+=t(600,76,'= 16B',{a:'end',size:15,w:700});
 const st=[0,1,2,3].map(s=>M.trainMemory(8,s,8).total),max=st[0];
 st.forEach((v,i)=>{const y=150+i*30,w=v/max*420;b+=t(150,y+16,['복제','ZeRO 1','ZeRO 2','ZeRO 3'][i],{a:'end',size:14})+grow(160,y,w,20,i?'var(--accent)':'var(--orange)',0.4+i*0.4)+t(170+w,y+16,`${f(v,0)}GB`,{a:'start',size:14,fill:'var(--muted)'});});
 b+=`<path d="M${160+80/max*420} 142V270" stroke="var(--orange)" stroke-dasharray="5 4"/>`+t(160+80/max*420,286,'80GB',{size:13,fill:'var(--orange)'});
 return {svg:svg(`파라미터 하나가 2+2+4+4+4 = 16바이트를 차지하고, 8B 모델을 GPU 8장에 둘 때 장당 메모리가 복제 ${f(st[0],0)}GB에서 ZeRO 3단계 ${f(st[3],0)}GB로 줄어드는 막대`,b),caption:`ZeRO 논문의 혼합 정밀도 Adam 셈입니다. 8B 모델을 GPU 8장에 복제하면 장마다 ${f(st[0],0)}GB가 필요하지만, 옵티마이저 상태·기울기·가중치를 차례로 나누면 ${f(st[3],0)}GB까지 내려갑니다. 활성값은 따로 계산해야 합니다.`};
};

/* 5장: GPipe 일정표(P = 4, M = 4)가 칸마다 채워진다. */
F.parallel=()=>{
 const P=4,Mb=4,g=M.gpipeSchedule(P,Mb),cw=500/g.T;let b=t(320,30,`GPipe · 단계 ${P}개, 마이크로배치 ${Mb}개 · 시간 칸 ${g.T}개`,{w:700});
 for(let s=0;s<P;s++){const y=50+s*44;b+=t(66,y+26,`GPU ${s+1}`,{a:'end',size:14})+`<rect x="80" y="${y}" width="500" height="36" fill="var(--panel2)" rx="3"/>`;}
 g.cells.forEach(c=>{const x=80+c.t*cw,y=50+c.stage*44;b+=blink(`<rect x="${x+1}" y="${y}" width="${cw-2}" height="36" rx="3" fill="${c.kind==='F'?'var(--accent)':'var(--blue)'}"/>`+t(x+cw/2,y+23,c.mb,{size:13,fill:'var(--bg)',w:700}),c.t*0.25);});
 b+=t(80,250,'노랑 = 순전파, 파랑 = 역전파, 회색 = 기다리는 거품',{a:'start',size:14,fill:'var(--muted)'})+t(580,280,`거품 (P − 1)/(M + P − 1) = ${f(g.bubble*100,1)}%`,{a:'end',size:15,fill:'var(--orange)',w:700});
 return {svg:svg(`GPU 네 장이 마이크로배치 네 개를 순전파 후 역전파하는 GPipe 일정표. 회색 거품이 ${f(g.bubble*100,1)}%`,b),caption:`칸은 시간 순서대로 켜집니다. 첫 GPU가 일을 넘겨줄 때까지 나머지는 기다리고, 끝에서는 반대로 기다립니다. 마이크로배치를 늘리면 같은 거품이 더 긴 일에 묻힙니다(한 칸의 시간이 같다는 가정).`};
};

/* 6장: 지시문 토큰은 마스크 0, 응답 토큰만 손실에 들어간다. */
F.sft=()=>{
 const n=6,resp=M.RESP,cw=36;let b=t(320,32,'채팅 템플릿으로 펼친 한 예시',{w:700}),x=40;
 b+=t(40,72,'지시문 (사용자 차례)',{a:'start',size:14,fill:'var(--muted)'})+t(40+n*cw+10,72,'응답 (서재봇 차례)',{a:'start',size:14,fill:'var(--accent)'});
 for(let i=0;i<n;i++){b+=box(x,84,cw-4,44,'var(--line)','var(--panel2)',5)+t(x+cw/2-2,112,'0',{size:14,fill:'var(--muted)'});x+=cw;}
 x+=10;resp.forEach((v,i)=>{b+=blink(box(x,84,cw-4,44,'var(--accent)','color-mix(in srgb,var(--accent) 25%,var(--panel2))',5)+t(x+cw/2-2,112,'1',{size:14,w:700}),0.2*i);b+=grow(x+4,230-v*30,cw-12,v*30,'var(--orange)',0.2*i+0.6)+t(x+cw/2-2,252,f(v,1),{size:13,fill:'var(--muted)'});x+=cw;});
 b+=t(40,150,'마스크',{a:'start',size:13,fill:'var(--muted)'})+t(40,200,'손실에 들어가는 몫',{a:'start',size:14,fill:'var(--muted)'});
 const r=M.sftLoss(n,'resp');b+=t(600,285,`응답 손실 합 ÷ 응답 토큰 ${r.denom}개 = ${f(r.loss,2)}`,{a:'end',size:15,fill:'var(--orange)',w:700});
 return {svg:svg(`지시문 토큰 여섯 개는 마스크 0, 응답 토큰 여덟 개는 마스크 1이고 응답 토큰의 손실만 더해 평균 ${f(r.loss,2)}를 내는 그림`,b),caption:'지시문 칸은 손실을 계산하지 않고(마스크 0), 응답 칸의 손실만 더해 응답 토큰 수로 나눕니다. 그래야 지시문이 길든 짧든 같은 응답에서 같은 학습 신호가 나옵니다. 토큰 손실은 교육용 값입니다.'};
};

/* 7장: DPO 손실 곡선 −log σ(β·m) 위를 점이 움직인다. */
F.preference=()=>{
 const X=m=>60+(m+6)/12*520,Y=v=>250-v/3*200,beta=0.5;let b=`<path d="M60 50V250H580M${X(0)} 50V250" stroke="var(--line)" fill="none"/>`;
 const pts=Array.from({length:49},(_,i)=>-6+i*0.25).map(m=>[X(m),Y(Math.min(3,M.dpo(m,beta).loss))]);b+=draw(pts,'var(--accent)',3);
 [-4,0,2,5].forEach((m,i)=>{const r=M.dpo(m,beta);b+=turn(`<circle cx="${X(m)}" cy="${Y(r.loss)}" r="8" fill="var(--orange)"/>`+t(X(m),Y(r.loss)-16,`m = ${m} · 손실 ${f(r.loss)}`,{size:14,w:700})+t(320,40,m<0?'비선호 답을 더 좋아함 → 크게 고침':m===0?'기준 모델과 같음 → ln 2':'잘 구분함 → 거의 안 고침',{size:14,fill:'var(--muted)'}),i);});
 b+=t(320,282,'m = (선호 답의 로그확률 비율) − (비선호 답의 로그확률 비율)',{size:14,fill:'var(--muted)'})+t(52,Y(0)+5,'0',{a:'end',size:13,fill:'var(--muted)'});
 return {svg:svg(`β = ${beta}일 때 DPO 손실 −log σ(β·m) 곡선. m이 음수면 손실이 크고 m이 클수록 0에 가까워진다`,b),caption:`β = ${beta}에서 DPO 손실을 계산한 곡선입니다. 정책이 기준 모델과 같으면(m = 0) 손실은 ln 2 ≈ 0.693이고, 비선호 답 쪽으로 기운 쌍일수록 손실과 기울기가 커집니다.`};
};

/* 8장: GRPO 집단 여덟 답의 보상과 이점. 시드 고정으로 뽑은 실제 계산. */
F.selfimprove=()=>{
 const groups=[[M.grpoGroup(8,0.5,6),'정답률 0.5인 질문'],[{rewards:new Array(8).fill(1),...M.groupAdvantages(new Array(8).fill(1))},'너무 쉬운 질문']];let b='';
 groups.forEach(([g,name],k)=>{let s=t(320,36,`${name} · 답 8개를 뽑아 규칙으로 채점`,{w:700});
  g.rewards.forEach((r,i)=>{const x=50+i*70;s+=box(x,60,58,50,r?'var(--accent)':'var(--orange)','var(--panel2)',6)+t(x+29,92,r?'맞음':'틀림',{size:14});
   const a=g.adv[i],h=Math.abs(a)*40;s+=`<rect x="${x+14}" y="${a>=0?190-h:190}" width="30" height="${Math.max(h,1)}" fill="${a>=0?'var(--accent)':'var(--orange)'}" rx="3"/>`+t(x+29,a>=0?184-h:206+h,(a>=0?'+':'')+f(a),{size:13,fill:'var(--muted)'});});
  s+=`<path d="M40 190H600" stroke="var(--line)"/>`+t(320,276,g.sd?`평균 ${f(g.mean)} · 표준편차 ${f(g.sd)} → (보상 − 평균) ÷ 표준편차`:'모든 답이 같은 점수 → 이점이 모두 0, 배울 것이 없음',{size:15,fill:g.sd?'var(--text)':'var(--orange)',w:700});
  b+=turn(s,k);});
 return {svg:svg('같은 질문에서 뽑은 답 여덟 개를 채점해 집단 평균과 표준편차로 이점을 계산하는 GRPO. 모든 답이 맞으면 이점이 모두 0이 된다',b),caption:'GRPO는 비평 모델 없이 같은 질문의 답끼리 비교해 이점을 만듭니다. 첫 장면은 고정 시드로 실제로 뽑은 집단이고, 둘째 장면처럼 모두 맞거나 모두 틀리면 기울기가 사라집니다.'};
};

/* 9장: 쌍 비교로 ELO 점수가 실제 실력 순서로 갈라진다. */
F.eval=()=>{
 const TR=[1200,1100,1000,900],r=M.eloRun(TR,16,200,7),C=['var(--accent)','var(--blue)','var(--orange)','var(--muted)'],X=i=>70+i/200*500,Y=v=>260-(v-800)/500*220;let b=`<path d="M70 40V260H570" stroke="var(--line)" fill="none"/>`;
 [900,1000,1100,1200].forEach(v=>b+=t(64,Y(v)+5,v,{a:'end',size:13,fill:'var(--muted)'}));
 TR.forEach((_,j)=>{b+=draw(r.hist.filter((_,i)=>i%4===0).map((h,i)=>[X(i*4),Y(h[j])]),C[j],2.5);b+=t(578,Y(r.R[j])+5,`v${4-j} ${f(r.R[j],0)}`,{a:'start',size:13,fill:C[j],w:700});});
 b+=t(320,288,'경기 수 (0 → 200), 모두 1000점에서 출발 · K = 16',{size:14,fill:'var(--muted)'});
 return {svg:svg(`서재봇 네 버전이 1000점에서 시작해 200번의 쌍 비교 뒤 실력 순서대로 점수가 갈라지는 ELO 곡선`,b),caption:'실제 실력(1200, 1100, 1000, 900)으로 승패를 고정 시드로 뽑아 ELO를 갱신한 시뮬레이션입니다. 200경기 뒤에도 점수는 실제 실력과 차이가 있고, 그 흔들림이 판정의 불확실성입니다.'};
};

/* 10장: 초안 모델이 N개를 쓰고 큰 모델이 한 번에 검증한다. */
F.serving=()=>{
 const a=0.6,N=5,s=M.specDecode(a,N,0.05),acc=[1,1,1,0,0];let b=t(320,32,`추측 디코딩 · 초안 ${N}개를 큰 모델이 한 번에 확인`,{w:700});
 b+=t(40,78,'작은 초안 모델',{a:'start',size:14,fill:'var(--muted)'});
 acc.forEach((_,i)=>{const x=40+i*80;b+=blink(box(x,90,68,44,'var(--blue)','var(--panel2)',6)+t(x+34,118,`초안${i+1}`,{size:13}),i*0.3);});
 b+=dot(240,140,0,50,'var(--blue)',1.6,6)+t(40,212,'큰 모델 검증 1회',{a:'start',size:14,fill:'var(--muted)'});
 acc.forEach((ok,i)=>{const x=40+i*80;b+=blink(box(x,222,68,44,ok?'var(--accent)':'var(--orange)',ok?'color-mix(in srgb,var(--accent) 22%,var(--panel2))':'var(--panel2)',6)+t(x+34,250,i<3?'수락':i===3?'고쳐 씀':'버림',{size:13,w:700}),2+i*0.3);});
 b+=box(450,90,170,176,'var(--line)','var(--chart)')+t(535,124,`α = ${a}`,{size:15})+t(535,158,'검증당 기대 토큰',{size:13,fill:'var(--muted)'})+t(535,186,f(s.E),{size:22,fill:'var(--accent)',w:700})+t(535,222,'속도 향상',{size:13,fill:'var(--muted)'})+t(535,250,`${f(s.speedup)}배`,{size:20,fill:'var(--orange)',w:700});
 return {svg:svg(`작은 모델이 초안 다섯 개를 쓰고 큰 모델이 한 번에 검증해 세 개를 받아들이고 넷째를 고쳐 쓰는 추측 디코딩. α = ${a}에서 기대 토큰 ${f(s.E)}개`,b),caption:`초안이 처음 틀린 자리에서 큰 모델이 대신 한 토큰을 뽑으므로 검증 한 번에 적어도 한 토큰은 나옵니다. 오른쪽 수치는 위치마다 수락률 α = ${a}, 초안 비용 0.05를 가정한 식의 값이고, 왼쪽의 수락·거절 장면은 예시입니다.`};
};

/* 11장: 128K 문맥에서 모델별 KV 캐시. 공개 config로 계산한다. */
F.architecture=()=>{
 const keys=['gpt2','llama3','mixtral','deepseek','jamba'],ctx=131072,v=keys.map(k=>M.kvPerToken(M.MODELS[k])*ctx/1e9),max=Math.max(...v);let b=t(320,32,'토큰 131,072개의 KV 캐시 (16비트, 시퀀스 하나)',{w:700});
 keys.forEach((k,i)=>{const y=58+i*42,w=v[i]/max*330,m=M.MODELS[k];b+=t(200,y+20,m.name,{a:'end',size:14})+grow(210,y+4,w,24,k==='deepseek'||k==='jamba'?'var(--accent)':'var(--blue)',i*0.4)+t(218+w,y+22,`${f(v[i],1)}GB`,{a:'start',size:14,fill:'var(--muted)'});});
 b+=t(320,282,'KV 헤드 공유(GQA), 잠재 압축(MLA), 어텐션 층 줄이기(하이브리드)가 이 막대를 줄입니다',{size:13,fill:'var(--muted)'});
 return {svg:svg(`128K 토큰에서 모델별 KV 캐시 크기 막대. Llama 3 8B ${f(v[1],1)}GB, DeepSeek-V3 ${f(v[3],1)}GB, Jamba ${f(v[4],1)}GB`,b),caption:'각 모델의 공개 config 숫자(층 수, KV 헤드 수, 헤드 차원, MLA 잠재 차원, 어텐션 층 수)로 토큰당 KV 바이트를 계산해 131,072를 곱했습니다. GPT-2의 학습 문맥은 1,024라서 이 길이는 계산만 해 본 값입니다.'};
};

/* 12장: 열한 단계 의존 그래프에서 SFT를 바꾸면 아래 단계가 모두 무효가 된다. */
F.final=()=>{
 const S=M.STAGES,pos={},bad=new Set(M.rollback('sft').stages.map(s=>s[0]));
 const lay=[['tok'],['data'],['pre'],['scale'],['sft'],['rm','dpo'],['cai'],['eval','quant'],['serve']];
 lay.forEach((col,i)=>col.forEach((id,j)=>{pos[id]=[30+i*68,col.length>1?(j?205:95):150];}));
 const q=[];for(const [a,bs] of Object.entries(M.EDGES))bs.forEach(c=>q.push([a,c]));
 const name={tok:'토큰화',data:'데이터',pre:'사전',scale:'확장',sft:'SFT',rm:'보상',dpo:'DPO',cai:'자기',eval:'평가',quant:'양자화',serve:'서빙'};
 let b=t(320,30,'출시 매니페스트의 열한 단계와 의존 관계',{w:700});
 q.forEach(([a,c])=>{const [x1,y1]=pos[a],[x2,y2]=pos[c];b+=`<path d="M${x1+54} ${y1}L${x2} ${y2}" stroke="var(--line)" stroke-width="2" fill="none"/>`;});
 S.forEach(([id],i)=>{const [x,y]=pos[id],hit=bad.has(id);b+=(hit?blink(box(x,y-24,54,48,'var(--orange)','color-mix(in srgb,var(--orange) 18%,var(--panel2))',6),0.3*i):box(x,y-24,54,48,'var(--accent)'))+t(x+27,y+5,name[id],{size:13,w:hit?700:400});});
 b+=pulse(pos.sft[0]+27,150,34,'var(--orange)')+t(320,272,`SFT를 바꾸면 주황 ${bad.size}단계를 다시, 노랑 ${S.length-bad.size}단계는 재사용`,{size:15,fill:'var(--orange)',w:700});
 return {svg:svg(`토크나이저부터 서빙 설정까지 열한 단계의 의존 그래프에서 SFT를 바꾸면 그 아래 ${bad.size}단계가 무효가 되는 모습`,b),caption:'의존 관계는 원본 13강의 파이프라인 그래프를 따릅니다. 바꾼 단계에서 화살표를 따라 닿는 단계만 다시 하면 되고, 사전학습처럼 위쪽의 비싼 단계는 체크포인트를 그대로 씁니다.'};
};

/* 기본 그림: flow 단계를 상자로 놓고 점이 차례로 지나간다. */
function fallback(c){
 const steps=c.flow.map(x=>x.split('|')),n=steps.length,w=(600-(n-1)*20)/n,colors=['var(--accent)','var(--blue)','var(--orange)','var(--accent)'];
 let b='';steps.forEach(([a,s],i)=>{const x=20+i*(w+20);b+=blink(box(x,90,w,110,colors[i%4]),i*.6)+t(x+w/2,140,a,{w:700})+t(x+w/2,168,s.length>14?s.slice(0,14)+'…':s,{size:13,fill:'var(--muted)'});if(i<n-1)b+=line(`M${x+w} 145H${x+w+20}`)+dot(x+w-4,145,24,0,colors[i%4],i*.6,5);});
 return {svg:svg(`${c.title}의 흐름: ${steps.map(s=>s[0]).join(', ')}`,b),caption:`${c.subtitle}`};
}
function render(c){return F[c.id]?F[c.id](H):fallback(c);}
return {render,F,H};
})();
