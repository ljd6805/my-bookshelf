/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A08Math로 계산한다. */
window.A08Figures=(()=>{
'use strict';
const M=A08Math,T=M.TOKENS;
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
const n=(v,d=0)=>Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});

F.why=()=>{
 const X=i=>20+i*87,r=M.depth(7);let b=t(20,28,'RNN · 앞 토큰을 기다리며 한 줄로',{a:'start',w:700});
 T.forEach((s,i)=>{b+=box(X(i),42,76,40,i===6?'var(--accent)':'var(--line)')+t(X(i)+38,67,s,{size:14});if(i<6)b+=`<path d="M${X(i)+76} 62h11" stroke="var(--muted)" stroke-width="2"/>`;});
 b+=line(`M${X(0)+38} 100H${X(6)+38}`,'var(--accent)')+dot(X(0)+38,100,X(6)-X(0),0,'var(--accent)',0,7)+t(620,124,`직렬 단계 ${r.rnn}`,{a:'end',size:14,fill:'var(--accent)'});
 b+=t(20,158,'어텐션 · 모든 쌍을 한 번에',{a:'start',w:700});
 T.forEach((s,i)=>{b+=box(X(i),212,76,40,i===6?'var(--blue)':'var(--line)')+t(X(i)+38,237,s,{size:14});if(i<6)b+=blink(`<path d="M${X(i)+38} 212Q${(X(i)+X(6))/2+38} ${170-i*2} ${X(6)+38} 212" fill="none" stroke="var(--blue)" stroke-width="2"/>`,0.2);});
 b+=t(620,282,`직렬 깊이 1 · 점수표 7×7 = ${r.entries}칸`,{a:'end',size:14,fill:'var(--blue)'});
 return {svg:svg('위는 RNN이 일곱 토큰을 차례로 지나며 일곱 단계를 기다리는 모습, 아래는 어텐션이 ‘읽었다’에서 모든 토큰으로 한 번에 선을 잇는 모습',b),caption:'위 줄의 점은 RNN이 은닉 상태를 한 칸씩 넘기는 직렬 계산을, 아래 줄의 선은 어텐션이 모든 쌍의 점수를 동시에 계산하는 것을 보여 주는 시각적 비유입니다. 단계 수와 칸 수는 실제로 센 값입니다.'};
};

F.selfattn=()=>{
 const sc=M.attnRow(64,true).example.weights,un=M.attnRow(64,false).example.weights,X=i=>196+i*62;let b='';
 b+=box(20,118,120,56,'var(--accent)')+t(80,143,'읽었다의',{size:14})+t(80,163,'질문 q',{size:14,w:700});
 [[sc,'÷ √64 = 8로 나눔',40,'var(--accent)'],[un,'나누지 않음',160,'var(--orange)']].forEach(([w,name,y,c],k)=>{
  b+=t(196,y+2,name,{a:'start',size:14,fill:c});
  w.forEach((p,i)=>{const h=Math.max(2,p*80);b+=blink(`<rect x="${X(i)+8}" y="${y+92-h}" width="40" height="${h}" rx="3" fill="${c}"/>`+(p>=0.05?t(X(i)+28,y+86-h,Math.round(p*100)+'%',{size:13}):''),k*1.2+i*0.15);});
  b+=`<path d="M196 ${y+92}H630" stroke="var(--line)"/>`;
 });
 b+=line('M140 146C170 146 170 90 196 90','var(--accent)')+line('M140 146C170 146 170 210 196 210','var(--orange)');
 T.forEach((s,i)=>{b+=t(X(i)+28,284,s,{size:13,fill:'var(--muted)'});});
 return {svg:svg('‘읽었다’의 질문이 일곱 토큰에 주는 가중치 막대. 위는 √64로 나눠 고르게 퍼지고, 아래는 나누지 않아 한 토큰에 몰린 모습',b),caption:'d_k = 64에서 같은 질문과 열쇠로 계산한 softmax 가중치입니다. 위는 √d_k로 나눈 경우, 아래는 나누지 않은 경우이며, 시드를 고정한 무작위 벡터로 한 실제 계산입니다.'};
};

F.multihead=()=>{
 const r=M.heads(2048,16),w=600/16;let b=t(20,28,`d_model ${n(r.dModel)}`,{a:'start',w:700})+t(620,28,`헤드 16개 × d_head ${r.dHead}`,{a:'end',fill:'var(--accent)'});
 for(let i=0;i<16;i++)b+=blink(`<rect x="${20+i*w}" y="40" width="${w-3}" height="34" rx="3" fill="${i%2?'var(--blue)':'var(--accent)'}"/>`,i*0.12);
 for(let i=0;i<16;i++){const x=20+(i%8)*76,y=104+Math.floor(i/8)*62;b+=blink(box(x+6,y,48,48,'var(--orange)','var(--chart)',4)+`<path d="M${x+10} ${y+44}L${x+50} ${y+4}" stroke="var(--orange)" stroke-width="1.5" opacity=".6"/>`,0.6+i*0.12);}
 b+=t(628,128,'헤드마다',{a:'end',size:13,fill:'var(--muted)'})+t(628,146,'N×N 점수표',{a:'end',size:13,fill:'var(--muted)'});
 b+=line('M320 232V246','var(--muted)')+box(20,246,440,34,'var(--accent)','var(--panel2)',6)+t(240,269,'이어 붙이기 → W_o로 섞기',{size:14})+box(480,246,140,34,'var(--blue)','var(--panel2)',6)+t(550,269,`4d² = ${n(r.proj/1e6,1)}M`,{size:14});
 return {svg:svg('d_model 2048을 16칸으로 나누고 헤드마다 점수표를 하나씩 만든 뒤 다시 이어 붙여 W_o로 섞는 그림',b),caption:'d_model 2048을 헤드 16개로 나누면 헤드마다 128차원과 자기 점수표를 갖습니다. 투영 파라미터 4·d²는 헤드 수와 무관하게 같으며, 숫자는 실제 계산입니다.'};
};

F.position=()=>{
 const cx=150,cy=150,R=100,th=Math.PI/7.2,arrow=(a,c)=>`<path d="M${cx} ${cy}L${cx+R*Math.cos(a)} ${cy-R*Math.sin(a)}" stroke="${c}" stroke-width="4"/><circle cx="${cx+R*Math.cos(a)}" cy="${cy-R*Math.sin(a)}" r="6" fill="${c}"/>`;
 let b=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--line)" stroke-width="2"/>`+t(cx,30,'RoPE · 위치만큼 회전',{w:700});
 for(let s=0;s<4;s++)b+=turn(arrow((3+s*2)*th,'var(--accent)')+arrow((s*2)*th,'var(--blue)')+t(cx,285,`두 위치를 ${s*2}칸 함께 옮김`,{size:14}),s);
 b+=t(330,64,'질문 q (위치 6+s)',{a:'start',size:14,fill:'var(--accent)'})+t(330,88,'열쇠 k (위치 3+s)',{a:'start',size:14,fill:'var(--blue)'});
 b+=t(330,126,'이동',{a:'start',size:14,fill:'var(--muted)'})+t(450,126,'RoPE 점수',{a:'start',size:14,fill:'var(--muted)'})+t(560,126,'사인 더하기',{a:'start',size:14,fill:'var(--muted)'});
 [0,2,4,6].forEach((s,i)=>{const y=154+i*30;b+=blink(t(330,y,`${s}칸`,{a:'start',size:14})+t(450,y,n(M.positionShift('rope',s).moved,3),{a:'start',size:14,fill:'var(--accent)'})+t(560,y,n(M.positionShift('abs',s).moved,3),{a:'start',size:14,fill:'var(--orange)'}),i*1.2);});
 return {svg:svg('질문과 열쇠 화살표가 같은 각도만큼 함께 돌아 사잇각이 그대로이고, 옆 표에서 RoPE 점수는 같고 사인 더하기 점수는 달라지는 그림',b),caption:'두 화살표는 위치에 비례한 각도로 함께 돌기 때문에 사잇각, 곧 상대 거리가 유지됩니다. 회전 각도는 보기 쉽게 키운 시각적 비유이고, 오른쪽 표의 점수는 d = 8 벡터로 한 실제 계산입니다.'};
};

F.block=()=>{
 const r=M.blockParams(2048,16),parts=[[66,'RMSNorm','var(--muted)'],[166,'어텐션','var(--accent)'],[306,'RMSNorm','var(--muted)'],[406,'FFN','var(--blue)']];let b='';
 b+=`<path d="M20 170H610" stroke="var(--line)" stroke-width="3"/>`+t(24,160,'x',{a:'start',w:700})+t(616,160,'y',{a:'end',w:700});
 parts.forEach(([x,s,c],i)=>{b+=blink(box(x,146,86,48,c)+t(x+43,176,s,{size:14}),i*0.6);});
 [[280,'h'],[524,'y']].forEach(([x,s])=>{b+=`<circle cx="${x}" cy="170" r="15" fill="var(--panel2)" stroke="var(--orange)" stroke-width="2"/>`+t(x,176,'+',{size:18,w:700,fill:'var(--orange)'});});
 b+=line('M40 170C40 80 280 80 280 155','var(--orange)')+line('M296 170C296 80 524 80 524 155','var(--orange)')+t(160,82,'잔차: 입력을 그대로 더함',{size:14,fill:'var(--orange)'})+t(410,82,'잔차',{size:14,fill:'var(--orange)'});
 b+=dot(24,170,580,0,'var(--accent)',0,7);
 b+=t(320,236,`블록 하나 ≈ 4d² + 8d² = ${n(r.perLayer/1e6,1)}M (d = 2048)`,{size:15})+t(320,266,`16층 + 임베딩 = ${n(r.total/1e9,2)}B · FFN이 어텐션의 두 배`,{size:14,fill:'var(--muted)'});
 return {svg:svg('입력 x가 정규화, 어텐션, 더하기, 정규화, FFN, 더하기를 지나고 두 잔차 곡선이 입력을 건너뛰어 더하는 사전 정규화 블록 그림',b),caption:'점은 토큰 하나의 벡터가 블록을 지나는 길이고, 주황 곡선은 입력을 그대로 넘기는 잔차 연결입니다. 아래 파라미터 수는 도란 설정으로 한 실제 계산입니다.'};
};

F.bertgpt=()=>{
 const c=22,grid=(x0,causal,col)=>{let g='';for(let i=0;i<7;i++){let row='';for(let j=0;j<7;j++){const on=!causal||j<=i;row+=`<rect x="${x0+j*c}" y="${54+i*c}" width="${c-3}" height="${c-3}" rx="2" fill="${on?col:'var(--panel2)'}" opacity="${on?0.85:1}"/>`;}g+=blink(row,i*0.35);}return g;};
 let b=t(130,32,'BERT · 양방향',{w:700})+t(470,32,'GPT · 인과(삼각)',{w:700});
 b+=grid(55,false,'var(--blue)')+grid(395,true,'var(--accent)');
 b+=t(130,232,'49칸 모두 열림',{size:14,fill:'var(--blue)'})+t(470,232,'28칸 열림 · 미래 = −∞',{size:14,fill:'var(--accent)'});
 const toks=['나는','어제','[MASK]','책을','오늘','다','읽었다'];let x=20;
 toks.forEach((s,i)=>{const w=s.length*15+16;b+=box(x,250,w,32,i===2?'var(--orange)':'var(--line)','var(--panel2)',5)+t(x+w/2,271,s,{size:13,fill:i===2?'var(--orange)':'var(--text)'});x+=w+6;});
 b+=pulse(20+ (toks.slice(0,2).reduce((a,s)=>a+s.length*15+22,0)) + (6*15+16)/2,266,20,'var(--orange)');
 b+=t(620,272,'GPT: 다음을 맞힘',{a:'end',size:13,fill:'var(--muted)'});
 return {svg:svg('왼쪽 BERT는 7×7 칸이 모두 열린 양방향 표, 오른쪽 GPT는 대각선 아래만 열린 삼각 표이고, 아래 문장의 셋째 토큰이 [MASK]로 가려진 그림',b),caption:'행이 한 줄씩 켜지는 것은 각 토큰이 볼 수 있는 칸입니다. BERT는 가려진 ‘산’을 양쪽 문맥으로 맞히고, GPT는 대각선 위가 막혀 과거만 봅니다. 칸 수는 마스크 규칙을 센 실제 값입니다.'};
};

F.encdec=()=>{
 const p=M.patches(224,16),w=M.whisperFrames(30);let b='';
 b+=blink(box(20,30,150,50,'var(--line)')+t(95,60,'글 7토큰',{size:14}),0);
 let g='';for(let i=0;i<4;i++)for(let j=0;j<4;j++)g+=`<rect x="${32+j*16}" y="${104+i*16}" width="14" height="14" fill="var(--blue)" opacity="${0.35+((i+j)%3)*0.2}"/>`;
 b+=blink(box(20,96,150,80,'var(--line)')+g+t(140,130,'이미지',{size:13})+t(140,150,`${p.tokens}토큰`,{size:13,fill:'var(--blue)'}),1.2);
 let s='';for(let k=0;k<10;k++)s+=`<rect x="${30+k*6}" y="${202+((k*7)%5)*4}" width="4" height="${48-((k*7)%5)*8}" fill="var(--orange)"/>`;
 b+=blink(box(20,192,150,72,'var(--line)')+s+t(130,222,'30초 소리',{size:13})+t(130,242,`${n(w.tokens)}토큰`,{size:13,fill:'var(--orange)'}),2.4);
 b+=box(200,60,130,180,'var(--accent)','var(--panel2)',10)+t(265,145,'인코더',{w:700})+t(265,168,'한 번 실행',{size:13,fill:'var(--muted)'});
 b+=line('M170 55L200 110')+line('M170 136L200 150')+line('M170 228L200 190');
 b+=box(430,60,130,180,'var(--blue)','var(--panel2)',10)+t(495,145,'디코더',{w:700})+t(495,168,'한 토큰씩',{size:13,fill:'var(--muted)'});
 [100,140,180,220].forEach((y,i)=>{b+=line(`M330 ${y}H430`,'var(--accent)')+dot(334,y,92,0,'var(--accent)',i*0.5,5);});
 b+=t(380,52,'교차 어텐션',{size:13,fill:'var(--accent)'});
 ['I','finished','the','book','today'].forEach((s,i)=>{b+=blink(t(575,92+i*34,s,{a:'start',size:14}),0.8+i*0.8);});
 return {svg:svg('글, 이미지 패치, 소리 스펙트로그램이 차례로 인코더에 들어가고, 디코더가 교차 어텐션으로 인코더 출력을 보며 영어 출력 토큰을 하나씩 쓰는 그림',b),caption:'세 입력은 모두 토큰이 되어 인코더에 들어가고, 디코더는 매 단계 교차 어텐션으로 원문 전체를 봅니다. 197토큰(224×224, 16×16 패치)과 1,500토큰(Whisper 30초)은 원본 설정으로 센 실제 값이고, 화살표와 점은 흐름을 보여 주는 비유입니다.'};
};

F.moe=()=>{
 const a=M.moeRoute(2,0),z=M.moeRoute(2,40),mx=Math.max(...a.counts);let b='';
 b+=box(20,72,90,44,'var(--line)')+t(65,99,'토큰',{size:14})+box(150,62,100,64,'var(--accent)')+t(200,99,'라우터',{w:700});
 b+=line('M110 94H150','var(--accent)');
 for(let e=0;e<8;e++){const y=20+e*20;b+=`<rect x="320" y="${y}" width="96" height="16" rx="3" fill="var(--panel2)" stroke="${e===0||e===2?'var(--accent)':'var(--line)'}"/>`+t(368,y+13,'전문가 '+(e+1),{size:13});}
 b+=line('M250 94L320 28','var(--accent)')+line('M250 94L320 68','var(--accent)')+dot(252,94,64,-66,'var(--accent)',0,5)+dot(252,94,64,-26,'var(--accent)',0.3,5);
 b+=t(440,40,'top-2만 계산',{a:'start',size:14,fill:'var(--accent)'})+t(440,64,'나머지 6개는 쉼',{a:'start',size:14,fill:'var(--muted)'})+t(440,100,`활성 ${a.k}/${a.E} = ${n(a.active*100,0)}%`,{a:'start',size:14});
 b+=t(20,198,'조정 전',{a:'start',size:14,fill:'var(--orange)'})+t(20,262,'40회 뒤',{a:'start',size:14,fill:'var(--blue)'});
 a.counts.forEach((c,e)=>{b+=grow(90+e*66,182,Math.max(2,c/mx*60),20,'var(--orange)',e*0.1);});
 z.counts.forEach((c,e)=>{b+=grow(90+e*66,246,Math.max(2,c/mx*60),20,'var(--blue)',0.9+e*0.1);});
 b+=t(620,226,`가장 바쁜 전문가 ${n(a.imbalance,2)}배 → ${n(z.imbalance,2)}배 (목표 ${a.target})`,{a:'end',size:13,fill:'var(--muted)'});
 return {svg:svg('토큰이 라우터를 거쳐 전문가 8개 중 2개로 가고, 아래 막대에서 조정 전에는 앞쪽 전문가에 몰렸던 사용량이 편향 조정 40회 뒤 고르게 되는 그림',b),caption:'위는 라우터가 토큰 하나를 전문가 두 개로 보내는 흐름(비유)이고, 아래 막대는 토큰 256개를 top-2로 보냈을 때 전문가별 사용량을 실제로 계산한 것입니다. 라우터 점수의 치우침은 책의 가정입니다.'};
};

F.memory=()=>{
 const m=M.scoreMemory(8192),kv=Object.keys(M.KV_VARIANTS).map(k=>M.kvCache(k,32768)),mx=Math.max(...kv.map(x=>x.gb));let b='';
 b+=box(20,24,250,126,'var(--line)','var(--chart)',10)+t(145,46,'HBM · 주메모리',{size:14,w:700});
 let g='';for(let i=0;i<6;i++)for(let j=0;j<10;j++)g+=`<rect x="${40+j*21}" y="${58+i*14}" width="19" height="12" fill="var(--muted)" opacity=".25"/>`;b+=g+`<rect x="40" y="58" width="40" height="26" fill="none" stroke="var(--accent)" stroke-width="2"/>`;
 b+=box(390,46,150,82,'var(--accent)','var(--panel2)',10)+t(465,72,'SRAM · 칩 안',{size:14,w:700})+t(465,96,'타일 하나',{size:13,fill:'var(--muted)'})+t(465,116,'(m, ℓ) 이어 가기',{size:13,fill:'var(--accent)'});
 b+=line('M270 72H390','var(--accent)')+dot(276,72,108,0,'var(--accent)',0,6)+dot(276,72,108,0,'var(--accent)',1.2,6)+line('M390 112H270','var(--blue)')+t(330,134,'출력만',{size:13,fill:'var(--blue)'});
 b+=t(560,64,`표 전체 ${n(m.fullMB,1)}MB`,{a:'start',size:13,fill:'var(--muted)'})+t(560,84,'(N = 8,192)',{a:'start',size:13,fill:'var(--muted)'})+t(560,108,`타일 ${n(m.tileKB,1)}KB`,{a:'start',size:13,fill:'var(--accent)'});
 b+=t(20,176,'32K 문맥의 KV 캐시 (70B급, GB)',{a:'start',size:14,w:700});
 kv.forEach((x,i)=>{const y=190+i*21;b+=t(20,y+14,x.label,{a:'start',size:13})+grow(200,y,Math.max(2,x.gb/mx*330),15,i===2?'var(--blue)':'var(--accent)',i*0.15)+t(620,y+14,n(x.gb,1),{a:'end',size:13});});
 return {svg:svg('위는 주메모리의 큰 점수표에서 작은 타일만 칩 안 메모리로 옮겨 계산하는 FlashAttention, 아래는 어텐션 변형별 32K 문맥 KV 캐시 막대',b),caption:'위쪽 점은 타일이 주메모리에서 칩 안으로 오가는 흐름을 보여 주는 비유이고, 표와 타일 크기, 아래 KV 캐시 막대는 원본 레슨의 70B급 설정으로 한 실제 계산입니다.'};
};

F.scaling=()=>{
 const C=1e23,o=M.chOptimal(C),xs=[];for(let e=8.5;e<=12;e+=0.05)xs.push([e,M.chLoss(10**e,C/(6*10**e))]);
 const lo=1.98,hi=2.14,X=e=>70+(e-8.5)/3.5*520,Y=L=>40+(hi-Math.min(L,hi))/(hi-lo)*200;
 let b=`<path d="M70 240H590M70 40V240" stroke="var(--line)"/>`+t(330,276,'log₁₀ N (파라미터), C = 10²³ 고정',{size:14,fill:'var(--muted)'})+t(70,30,'손실 L',{a:'start',size:14,fill:'var(--muted)'});
 [9,10,11,12].forEach(e=>{b+=t(X(e),258,String(e),{size:13,fill:'var(--muted)'});});
 b+=`<polyline class="fig-draw" points="${xs.map(([e,L])=>`${X(e).toFixed(1)},${Y(L).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="3"/>`;
 const ox=X(Math.log10(o.N)),oy=Y(o.L);b+=`<circle cx="${ox}" cy="${oy}" r="6" fill="var(--accent)"/>`+pulse(ox,oy,12,'var(--accent)')+t(ox,oy+30,`최적 D/N ≈ ${n(o.ratio)}`,{size:14,fill:'var(--accent)'});
 [[20,'var(--blue)'],[1875,'var(--orange)']].forEach(([r,c],i)=>{const p=M.chAtRatio(C,r),x=X(Math.log10(p.N)),y=Y(p.L);b+=blink(`<circle cx="${x}" cy="${y}" r="6" fill="${c}"/>`+t(x,y-14,`D/N ${n(r)}`,{size:14,fill:c}),0.6+i*1.2);});
 b+=t(590,60,`최적 N ${n(o.N/1e9,1)}B · D ${n(o.D/1e12,2)}T`,{a:'end',size:14});
 return {svg:svg('계산량 10의 23제곱에서 파라미터 수에 따른 손실 곡선과 최적점, 비율 20과 1,875의 위치를 표시한 그림',b),caption:'곡선은 원본 레슨이 인용한 Chinchilla 식으로 같은 계산량에서 N을 바꾸며 실제로 계산한 손실입니다. 왼쪽 주황 점(비율 1,875)은 손실이 조금 높지만 모델이 훨씬 작습니다.'};
};

F.speculative=()=>{
 const s=M.spec(0.75,5);let b=t(20,30,'초안 모델이 5개를 먼저 씀 (각 약 3ms)',{a:'start',size:14,w:700});
 const st=['ok','ok','ok','no','skip'];
 ['오늘','다','읽었다','.','끝'].forEach((w,i)=>{const x=20+i*100;b+=blink(box(x,44,86,40,'var(--line)')+t(x+43,70,w,{size:14}),i*0.3);
  const c=st[i]==='ok'?'var(--accent)':st[i]==='no'?'var(--orange)':'var(--muted)',mark=st[i]==='ok'?'수락':st[i]==='no'?'거절':'버림';
  b+=blink(t(x+43,112,mark,{size:14,fill:c,w:700}),2+i*0.3);});
 b+=blink(box(520,44,100,40,'var(--orange)')+t(570,70,'다시 뽑음',{size:13,fill:'var(--orange)'}),3.4);
 b+=box(20,128,600,34,'var(--blue)','var(--panel2)',6)+t(320,151,'큰 모델이 6개 위치의 분포를 한 번의 순전파로 계산 (약 30ms)',{size:14});
 b+=t(20,196,'그냥 생성: 큰 모델 5번',{a:'start',size:14})+grow(220,184,375,16,'var(--muted)',0)+t(620,198,'150ms',{a:'end',size:13});
 b+=t(20,226,'추측 디코딩: 5×3 + 30',{a:'start',size:14})+grow(220,214,112,16,'var(--accent)',0.4)+t(620,228,'45ms',{a:'end',size:13});
 b+=t(320,270,`α = 0.75, 초안 5개 → 검증 한 번에 기대 ${n(s.tokens,2)}토큰, 비용 비 0.1에서 ${n(s.speedup,2)}배`,{size:14,fill:'var(--muted)'});
 return {svg:svg('초안 다섯 토큰이 나타나고 큰 모델이 한 번에 검증해 앞 세 개는 수락, 넷째는 거절 후 다시 뽑는 그림과 150ms 대 45ms 시간 막대',b),caption:'수락·거절 표시는 한 번의 예를 보여 주는 시나리오이고, 시간(30ms·3ms)은 원본 레슨의 예입니다. 아래 기대 토큰 수와 속도 향상은 식으로 한 실제 계산입니다.'};
};

F.final=()=>{
 const base=M.redesign('long','none'),g=M.redesign('long','gqa'),sp=M.redesign('fast','spec'),tk=M.redesign('quality','tokens');
 const rows=[['구조','디코더 전용 16층'],['d_model · 헤드','2048 · 16 (d_head 128)'],['KV 헤드','16 → ?'],['위치 · 정규화','RoPE · 사전 RMSNorm'],['문맥','4K → 32K?'],['학습 토큰','파라미터 × 20'],['디코딩','한 토큰씩 → ?']];
 let b=t(20,26,'도란 설계표',{a:'start',w:700});
 rows.forEach(([k,v],i)=>{const y=40+i*34;b+=`<rect x="20" y="${y}" width="330" height="30" rx="4" fill="var(--panel2)" stroke="${v.includes('?')?'var(--orange)':'var(--line)'}"/>`+t(30,y+20,k,{a:'start',size:13,fill:'var(--muted)'})+t(340,y+20,v,{a:'end',size:13});});
 const cards=[[`문맥 32K: ${n(base.memGB,1)}GB > 24GB`,`GQA면 ${n(g.memGB,1)}GB`,108],[`속도 1.5배`,`추측 디코딩 ${n(sp.speed,2)}배`,176],[`손실 낮추기`,`토큰 10배: ${n(tk.loss,3)}`,244]];
 cards.forEach(([a,c,y],i)=>{b+=blink(box(400,y-30,220,56,'var(--accent)','var(--panel2)',8)+t(510,y-8,a,{size:13,w:700})+t(510,y+14,c,{size:13,fill:'var(--accent)'}),i*1.2);});
 b+=line('M400 106C380 106 370 123 350 123','var(--orange)')+line('M400 174C380 174 370 259 350 259','var(--orange)')+line('M400 242C380 242 370 225 350 225','var(--orange)');
 b+=t(510,26,'새 요구 → 바꿀 칸',{size:14,w:700});
 return {svg:svg('왼쪽 도란 설계표에서 KV 헤드, 문맥, 학습 토큰, 디코딩 칸이 물음표로 표시되고, 오른쪽 세 요구 카드가 차례로 켜지며 바꿀 칸을 가리키는 그림',b),caption:'설계표와 요구는 이 책의 공통 사례이고, 카드 안의 메모리·속도·손실은 앞 장의 식으로 다시 계산한 값입니다. 화살표는 어느 칸을 바꿀지 보여 주는 비유이며, 품질은 계산하지 않았습니다.'};
};

function fallback(c){return {svg:svg(c.title,t(320,150,c.title)),caption:c.subtitle};}
function render(c){return F[c.id]?F[c.id](H):fallback(c);}
return {render,F,H};
})();
