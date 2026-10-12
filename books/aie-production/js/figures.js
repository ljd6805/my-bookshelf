/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A18Math로 계산한다. */
window.A18Figures=(()=>{
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
const H={svg,t,box,line,dot,blink,grow,pulse};
const F={};
const M=A18Math,fmt=(n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const C={a:'var(--accent)',b:'var(--blue)',o:'var(--orange)',m:'var(--muted)'};
F.platform=()=>{
 const x=u=>60+u*540,y=v=>250-v/6*210,pts=[];for(let u=0.1;u<=1.001;u+=0.05)pts.push(`${x(u)},${y(M.breakeven(u,1.6).dedicated)}`);
 const be=M.breakeven(0.68,1.6),bu=be.breakEvenU;
 let b=line('M60 250H600M60 40V250','var(--line)','')+t(330,285,'GPU 지속 사용률 (0% → 100%)',{size:13,fill:C.m})+t(64,30,'$ / 100만 토큰',{a:'start',size:13,fill:C.m});
 b+=`<polyline class="fig-draw" points="${pts.join(' ')}" fill="none" stroke="${C.a}" stroke-width="3"/>`+line(`M60 ${y(1.6)}H600`,C.b)+t(596,y(1.6)-8,'토큰 단가 $1.60',{a:'end',size:13,fill:C.b});
 b+=pulse(x(bu),y(1.6),7,C.o)+t(x(bu)+12,y(1.6)+50,`손익분기 ${fmt(bu*100,1)}%`,{a:'start',size:14,w:700});
 b+=`<circle cx="${x(0.68)}" cy="${y(be.dedicated)}" r="7" fill="${C.a}"/>`+t(x(0.68),y(be.dedicated)-14,`누리봇 68% · $${fmt(be.dedicated,2)}`,{size:14,w:700});
 b+=t(x(0.18),y(M.breakeven(0.18,1.6).dedicated)-12,'쉬는 시간도 요금',{a:'start',size:13,fill:C.m});
 return {svg:svg('전용 GPU의 100만 토큰당 비용 곡선이 사용률 30.2%에서 토큰 단가 1.6달러 선과 만나는 그림',b),caption:'전용 GPU는 사용률이 높을수록 토큰 하나가 싸지고, 손익분기 사용률보다 오래 바쁘면 토큰을 사는 것보다 유리합니다.'};
};
F.precision=()=>{
 const rows=[['FP8 가중치 · FP8 KV','fp8',1],['INT4 · BF16 KV','int4',2],['INT4 · FP8 KV','int4',1]],sx=v=>v/80*400;
 let b=t(160,34,'H100 80GB 한 장',{a:'start',size:13,fill:C.m})+line('M160 44V270','var(--line)','')+line('M560 44V270',C.o,'fig-dash')+t(560,34,'80GB',{size:13,fill:C.o});
 rows.forEach(([name,f,k],i)=>{const r=M.hbmBudget(f,k,M.hbmBudget(f,k,1).maxConc),yy=64+i*72;
  b+=t(150,yy+24,name,{a:'end',size:13})+grow(160,yy,sx(r.weights),34,C.a,i*.3)+grow(160+sx(r.weights),yy,sx(r.act),34,C.m,i*.3+.2)+grow(160+sx(r.weights+r.act),yy,sx(r.kv),34,C.b,i*.3+.4);
  b+=t(160+sx(r.weights)/2,yy+23,`가중치 ${fmt(r.weights)}GB`,{size:13,fill:'var(--bg)',w:700})+t(552,yy+56,`KV · 대화 ${r.maxConc}개`,{a:'end',size:13,fill:C.b,w:700});});
 return {svg:svg('같은 80GB에 FP8 가중치는 대화 14개, INT4와 BF16 KV는 59개, INT4와 FP8 KV는 119개를 담는 막대 그림',b),caption:'가중치를 줄이면 KV 자리가 넓어지고, KV 형식을 줄이면 같은 자리에 대화가 두 배로 들어갑니다.'};
};
F.engine=()=>{
 const off=M.chunkedPrefill(32000,0),on=M.chunkedPrefill(32000,2048),sx=ms=>ms/1000*470;
 let b=t(20,46,'끔',{a:'start',size:14,w:700})+t(20,166,'2,048 조각',{a:'start',size:14,w:700});
 b+=grow(110,60,sx(off.prefillOnly),26,C.o,0)+t(110+sx(off.prefillOnly)/2,78,`긴 프리필 ${fmt(off.prefillOnly)}ms 한 덩어리`,{size:13,fill:'var(--bg)',w:700});
 for(let i=0;i<5;i++)b+=`<rect x="${110+sx(off.prefillOnly)+i*14}" y="96" width="8" height="16" fill="${C.a}"/>`;
 b+=t(110,128,`이웃 손님: ${fmt(off.stall)}ms 동안 토큰 없음`,{a:'start',size:13,fill:C.o});
 for(let i=0;i<on.chunks&&i<16;i++){const x0=110+i*(sx(51.2)+sx(7));b+=blink(`<rect x="${x0}" y="180" width="${sx(51.2)}" height="26" rx="3" fill="${C.o}"/><rect x="${x0+sx(51.2)}" y="212" width="${Math.max(3,sx(7))}" height="16" fill="${C.a}"/>`,i*.25);}
 b+=t(110,256,`조각 ${on.chunks}개 사이마다 디코드가 끼어듦 · 이웃 간격 ${fmt(on.stall,1)}ms · 첫 토큰 ${fmt(on.ttft)}ms`,{a:'start',size:13,fill:C.a});
 return {svg:svg('32,000토큰 프리필을 한 번에 하면 이웃이 807ms 기다리고, 2,048토큰 조각으로 나누면 조각 사이마다 디코드가 끼어드는 시간축 그림',b),caption:'청크 프리필은 긴 프리필을 조각내 그 사이에 이웃 손님의 디코드를 끼워 넣습니다. 대신 긴 손님의 첫 토큰은 조금 늦어집니다.'};
};
F.metrics=()=>{
 const s=M.latencySample(false).map(x=>x.tpot),edges=[0,5,10,15,20,25,30,40,50,60,70,80],cnt=edges.slice(0,-1).map((e,i)=>s.filter(v=>v>=e&&v<edges[i+1]).length),g=M.goodput({ttft:800,tpot:25,e2e:3000},false);
 const sx=v=>50+v/80*560,sy=n=>Math.max(2,Math.sqrt(n)/Math.sqrt(Math.max(...cnt))*190);
 let b=line('M50 240H610','var(--line)','')+t(330,262,'토큰 간격 TPOT (ms)',{size:13,fill:C.m});
 cnt.forEach((n,i)=>{const w=sx(edges[i+1])-sx(edges[i])-2,h=sy(n);b+=`<rect class="fig-grow" style="animation-delay:${i*.08}s;transform-origin:center bottom" x="${sx(edges[i])}" y="${240-h}" width="${w}" height="${h}" fill="${edges[i]>=25?C.o:C.a}"/>`;});
 b+=line(`M${sx(g.meanTpot)} 40V240`,C.b)+t(sx(g.meanTpot)+6,38,`평균 ${fmt(g.meanTpot,1)}`,{a:'start',size:13,fill:C.b,w:700});
 b+=line(`M${sx(25)} 60V240`,C.m)+t(sx(25)+6,62,'목표 25',{a:'start',size:13,fill:C.m});
 b+=pulse(sx(g.p99),250,6,C.o)+t(sx(g.p99),90,`P99 ${fmt(g.p99,1)}`,{size:13,fill:C.o,w:700})+t(610,290,`goodput ${fmt(g.goodput*100,2)}%`,{a:'end',size:14,w:700});
 return {svg:svg('합성 요청 2,000개의 토큰 간격 분포에서 평균 9.5ms와 P99 64ms가 멀리 떨어진 막대 그림',b),caption:'평균은 왼쪽 큰 산에 붙어 있지만, 오른쪽 꼬리의 느린 요청이 P99와 goodput을 정합니다. 막대 높이는 개수의 제곱근으로 눌렀습니다.'};
};
F.speculative=()=>{
 const r=M.specSpeedup(0.7,5,'mid');
 let b=t(20,56,'초안 모델',{a:'start',size:14,w:700})+t(20,166,'큰 모델 검증',{a:'start',size:14,w:700});
 for(let i=0;i<5;i++){const x0=150+i*80;b+=blink(box(x0,34,64,36,C.b)+t(x0+32,58,`초안${i+1}`,{size:13}),i*.3);}
 for(let i=0;i<5;i++){const x0=150+i*80,ok=i<3;b+=blink(box(x0,144,64,36,ok?C.a:C.o)+t(x0+32,168,ok?'수락':(i===3?'거절':'버림'),{size:13,fill:ok?C.a:C.o,w:700}),1.6+i*.3,'fig-seq');b+=line(`M${x0+32} 70V144`,C.m);}
 b+=dot(182,74,0,66,C.b,0,5)+dot(262,74,0,66,C.b,.3,5)+dot(342,74,0,66,C.b,.6,5);
 b+=t(320,226,`수락률 α = 0.7, K = 5일 때 검증 한 번의 기대 토큰 ${fmt(r.E,2)}개`,{size:14,w:700})+t(320,252,`보통 부하에서 ${fmt(r.speedup,2)}배 · 손익분기 α ${fmt(r.breakEven,3)}`,{size:13,fill:C.m});
 return {svg:svg('작은 모델이 초안 5개를 쓰고 큰 모델이 한 번에 검증해 앞의 3개를 수락하고 네 번째에서 거절하는 그림',b),caption:'첫 거절이 나오면 그 뒤 초안은 모두 버립니다. 그래서 기대 토큰 수는 1 + Kα가 아니라 (1−α^(K+1))/(1−α)입니다.'};
};
F.locality=()=>{
 const rr=M.routeSim('rr',4,'fixed'),aw=M.routeSim('aware',4,'fixed'),col=[C.a,C.b,C.o,C.m];
 let b=t(160,30,`라운드 로빈 · 적중 ${fmt(rr.hitRate*100)}%`,{size:14,w:700})+t(480,30,`캐시를 아는 라우터 · 적중 ${fmt(aw.hitRate*100,1)}%`,{size:14,w:700});
 [0,320].forEach((ox,side)=>{b+=box(ox+120,52,80,34,C.m)+t(ox+160,74,'라우터',{size:13});
  for(let k=0;k<4;k++){const x0=ox+20+k*72;b+=box(x0,200,62,44,C.m)+t(x0+31,227,`GPU ${k+1}`,{size:13});}
  for(let j=0;j<4;j++){const target=side?j:(j+1)%4,tx=ox+51+target*72;b+=dot(ox+160,90,tx-(ox+160),108,col[j],j*.5,6);}});
 b+=t(160,276,'같은 접두부가 매번 다른 GPU로',{size:13,fill:C.m})+t(480,276,'같은 접두부는 늘 같은 GPU로',{size:13,fill:C.m});
 return {svg:svg('라운드 로빈은 같은 색 요청을 여러 GPU에 흩고, 캐시를 아는 라우터는 같은 색 요청을 같은 GPU로 모으는 그림',b),caption:'점의 색은 고정 접두부의 종류입니다. 같은 접두부를 같은 복제본에 모아야 그 복제본의 캐시가 다시 쓰입니다.'};
};
F.scaling=()=>{
 const r=M.coldStart({node:'ca',image:'pull',weights:'plain',warm:0}),f=M.coldStart({node:'karp',image:'seeded',weights:'snapshot',warm:0}),sx=v=>v/383*520,col=[C.m,C.o,C.a,C.b,C.a];
 let b=t(20,44,'완화책 없음',{a:'start',size:14,w:700})+t(20,144,'모두 켬',{a:'start',size:14,w:700})+t(20,244,'웜 풀 1대',{a:'start',size:14,w:700});
 const bar=(parts,y0,d0)=>{let x0=100,o='';parts.forEach((p,i)=>{if(p[1]>0){o+=grow(x0,y0,sx(p[1]),30,col[i],d0+i*.25);const w=sx(p[1]);if(w>34)o+=t(x0+w/2,y0+20,w>150?`${p[0]} ${fmt(p[1])}초`:`${fmt(p[1])}초`,{size:13,fill:'var(--bg)',w:700});}x0+=sx(p[1]);});return o;};
 b+=bar(r.parts,56,0)+t(620,104,`${fmt(r.cold)}초`,{a:'end',size:14,w:700})+bar(f.parts,156,1.2)+t(100+sx(f.cold)+8,176,`${fmt(f.cold,1)}초`,{a:'start',size:14,w:700});
 b+=grow(100,256,Math.max(4,sx(3)),30,C.a,2.4)+t(120,276,`3초 · 대신 매달 ${fmt(M.coldStart({node:'ca',image:'pull',weights:'plain',warm:1}).warmMonth)}달러`,{a:'start',size:14,w:700});
 return {svg:svg('0대에서 깨어날 때 383초, 완화책을 모두 켜면 62.5초, 웜 풀이 있으면 3초가 걸리는 시간 막대 그림',b),caption:'완화책은 단계마다 시간을 줄이지만, 첫 손님을 몇 초 안에 받으려면 결국 켜 둔 GPU가 필요합니다.'};
};
F.cost=()=>{
 const rows=[['기준(캐시·배치 없음)',M.dailyBill(0,'sync').base],['캐시 적중 7%',M.dailyBill(0.07,'sync').day],['순서를 고쳐 74%',M.dailyBill(0.74,'sync').day],['74% + 배치',M.dailyBill(0.74,'batch').day]],sx=v=>v/120*360;
 let b=t(20,30,'외부 API 요청 1만 건의 하루 청구액',{a:'start',size:14,w:700});
 rows.forEach(([n,v],i)=>{const yy=56+i*56;b+=t(190,yy+22,n,{a:'end',size:13})+grow(200,yy,sx(v),32,i===1?C.o:(i?C.a:C.m),i*.35)+t(206+sx(v),yy+22,`$${fmt(v,2)}`,{a:'start',size:14,w:700});});
 b+=line(`M${200+sx(105)} 48V280`,C.m);
 return {svg:svg('하루 청구액이 기준 105달러, 적중 7%에서 115달러, 74%에서 69달러, 배치까지 겹치면 34달러인 막대 그림',b),caption:'적중률이 낮은 캐시는 쓰기 할증 때문에 기준보다 비쌉니다. 순서를 고쳐 적중률을 올린 뒤 배치를 겹치면 할인이 곱해집니다.'};
};
F.gateway=()=>{
 const r=M.gatewayFallback(0.3,2,true);
 let b=box(20,120,100,50,C.m)+t(70,150,'누리봇',{size:14})+box(200,110,130,70,C.a)+t(265,140,'게이트웨이',{size:14,w:700})+t(265,162,'키·한도·기록',{size:13,fill:C.m});
 b+=box(450,40,160,56,C.o)+t(530,66,'공급자 A',{size:14})+t(530,86,'429 · 30%',{size:13,fill:C.o})+box(450,200,160,56,C.b)+t(530,226,'대체 공급자 B',{size:14})+t(530,246,'재시도 2번 뒤',{size:13,fill:C.m});
 b+=line('M120 145H200')+line('M330 130L450 70',C.o)+line('M330 160L450 228',C.b)+dot(124,145,72,0,C.a,0)+dot(334,130,110,-58,C.o,.6)+dot(334,160,110,66,C.b,1.4);
 b+=pulse(450,68,8,C.o)+t(320,290,`실패율 ${fmt(r.failRate*100,3)}% · 가장 늦은 성공 ${fmt(r.worst)}ms`,{size:14,w:700});
 return {svg:svg('누리봇 요청이 게이트웨이를 거쳐 공급자 A로 가고, 실패가 이어지면 대체 공급자 B로 넘어가는 흐름 그림',b),caption:'게이트웨이는 키와 한도, 기록을 한곳에 모으고, 첫 공급자가 실패하면 재시도한 뒤 대체 공급자로 넘깁니다.'};
};
F.rollout=()=>{
 const r=M.canary('refusal',1),st=[...M.STAGES,100];
 let b=t(320,34,'거절률 관문 2배 · 실제 악화 없음(1.0배)',{size:14,w:700});
 st.forEach((s,i)=>{const x0=30+i*102;b+=blink(box(x0,90,84,60,i<5?C.a:C.b)+t(x0+42,118,`${s}%`,{size:16,w:700})+t(x0+42,140,i<5?'관찰 1시간':'전체 배포',{size:13,fill:C.m}),i*.5);
  if(i<5){b+=line(`M${x0+84} 120H${x0+102}`)+t(x0+42,186,`잘못 울림`,{size:13,fill:C.m})+t(x0+42,206,`${fmt(r.stages[i].trip*100,1)}%`,{size:14,fill:r.stages[i].trip>0.05?C.o:C.a,w:700});}});
 b+=pulse(114,90,8,C.o)+t(320,262,`어디선가 잘못 멈출 확률 ${fmt(r.haltBy*100,1)}%: 1% 단계는 표본이 적어 흔들립니다`,{size:13,fill:C.m});
 return {svg:svg('카나리 1%, 10%, 25%, 50%, 75%, 100% 단계와 단계마다 관문이 잘못 울릴 확률을 적은 그림',b),caption:'첫 단계는 카나리 쪽 요청이 30건뿐이라 비율이 크게 흔들립니다. 관문을 첫 단계에 그대로 걸면 잘못된 경보가 잦습니다.'};
};
F.incident=()=>{
 const rows=[['1% · 30%',M.burnRate(0.01,0.3)],['5% · 20%',M.burnRate(0.05,0.2)],['20% · 100%',M.burnRate(0.2,1)]],sx=v=>Math.min(v,10)/10*300;
 let b=t(20,30,'영향 범위 · 주입 오류율 → 오류 예산 소진 속도',{a:'start',size:14,w:700});
 rows.forEach(([n,r],i)=>{const yy=60+i*66;b+=t(150,yy+22,n,{a:'end',size:13})+grow(160,yy,sx(r.burn),32,r.abort?C.o:C.a,i*.4)+t(168+sx(r.burn),yy+22,`${fmt(r.burn,1)}배${r.burn>10?' (잘림)':''} · ${r.abort?'중단':'계속'}`,{a:'start',size:14,w:700});});
 b+=line(`M${160+sx(2)} 48V260`,C.o)+t(160+sx(2),290,'중단 기준 2배',{size:13,fill:C.o})+pulse(160+sx(2),256,5,C.o);
 return {svg:svg('카오스 실험 세 가지의 오류 예산 소진 속도 0.8배, 2.2배, 40.2배와 중단 기준 2배를 비교한 막대 그림',b),caption:'소진 속도가 2배를 넘으면 한 달 예산을 보름 안에 다 쓰는 속도이므로 실험을 멈춥니다.'};
};
F.final=()=>{
 const cases=[['첫 손님 대기','웜 풀',M.finalCase('cold','warm'),'초'],['청구서','순서 바꾸기',M.finalCase('cache','reorder'),'달러'],['끊김','청크 프리필',M.finalCase('tail','chunk'),'% goodput']];
 let b='';cases.forEach(([rep,fix,r,u],i)=>{const yy=40+i*84;
  b+=blink(box(20,yy,150,56,C.o)+t(95,yy+33,rep,{size:14,w:700}),i*.8)+line(`M170 ${yy+28}H230`)+dot(172,yy+28,56,0,C.o,i*.8,5);
  b+=blink(box(230,yy,150,56,C.b)+t(305,yy+33,fix,{size:14,w:700}),i*.8+.4)+line(`M380 ${yy+28}H440`)+dot(382,yy+28,56,0,C.b,i*.8+.4,5);
  b+=blink(box(440,yy,180,56,C.a)+t(530,yy+25,`${fmt(r.before,r.before<200?2:0)} → ${fmt(r.after,r.after<200?2:0)}`,{size:14,w:700})+t(530,yy+45,u,{size:13,fill:C.m}),i*.8+.8);});
 return {svg:svg('세 가지 운영 보고를 각각 웜 풀, 프롬프트 순서 바꾸기, 청크 프리필로 처방하고 지표가 움직이는 그림',b),caption:'보고된 증상마다 그 원인을 겨누는 처방이 따로 있고, 처방이 맞았는지는 같은 계산을 다시 돌려 지표로 확인합니다.'};
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
