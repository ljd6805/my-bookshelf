/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A12Math로 계산한다. */
window.A12Figures=(()=>{
'use strict';
const M=A12Math;
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}${o.mono?' font-family="var(--font-mono)"':''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const turn=(body,i)=>blink(body,i*1.2,i?'fig-turn':'fig-turn fig-first');
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const draw=(pts,color,w=3)=>`<polyline class="fig-draw" pathLength="1000" points="${pts.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${w}"/>`;
const f=(n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const H={svg,t,box,line,dot,blink,turn,grow,pulse,draw};
const F={};
const A='var(--accent)',B='var(--blue)',O='var(--orange)',MU='var(--muted)';

/* 1장: 온도에 따라 다섯 후보의 확률 막대가 바뀐다(실제 소프트맥스). */
F.prompt=()=>{
 const temps=[0,0.3,1,1.5];let b=box(20,20,260,92,A)+t(150,48,'시스템 메시지',{w:700})+t(150,72,'역할 · 규칙 · 형식',{size:14,fill:MU})+t(150,96,'"정책에 없는 약속은 하지 않는다"',{size:13,fill:MU});
 b+=box(20,128,260,62,B)+t(150,154,'사용자 메시지',{w:700})+t(150,177,'"반품 신청 기한은?"',{size:14,fill:MU});
 b+=box(20,206,260,62,O)+t(150,232,'다음 토큰 후보',{w:700})+t(150,255,'로짓 ÷ 온도 T → 소프트맥스',{size:14,fill:MU});
 b+=line('M280 66H316')+line('M280 159H316')+line('M280 237H316')+dot(282,66,34,0,A,0,5)+dot(282,159,34,0,B,.4,5);
 temps.forEach((T,i)=>{const r=M.sampling(T,1);let g=t(470,34,`온도 T = ${T}`,{w:700,fill:A});
  M.CANDIDATES.forEach(([name],k)=>{const y=52+k*44;g+=t(392,y+20,name,{a:'end',size:14})+box(400,y+4,200,22,'var(--line)','var(--panel2)',4)+`<rect x="400" y="${y+4}" width="${(r.final[k]*200).toFixed(1)}" height="22" rx="4" fill="${k===0?A:k===4?O:B}"/>`+t(606,y+21,f(r.final[k]*100,0)+'%',{a:'start',size:13,mono:1});});
  b+=turn(g,i);});
 return {svg:svg('왼쪽은 시스템 메시지와 사용자 메시지가 다음 토큰 후보로 이어지는 구조, 오른쪽은 온도를 0, 0.3, 1, 1.5로 바꿀 때 다섯 후보의 확률 막대가 평평해지는 모습',b),caption:'오른쪽 막대는 교육용 로짓에 온도별 소프트맥스를 실제로 계산한 값입니다. 온도 0에서는 "14일"이 100%이고, 1.5에서는 틀린 답 "환불 불가"도 5% 넘게 뽑힙니다.'};
};

/* 2장: 예시 세 개 + 질문이 다섯 풀이로 퍼지고 다수결로 모인다. */
F.reasoning=()=>{
 let b='';['예시 1 · 배송','예시 2 · 반품','예시 3 · 결제'].forEach((s,i)=>b+=box(20,30+i*52,150,40,B)+t(95,56+i*52,s,{size:14}));
 b+=box(20,196,150,58,A)+t(95,221,'새 문의',{w:700})+t(95,243,'환불액은?',{size:14,fill:MU});
 const ans=['3,000원','3,000원','4,500원','3,000원','3,000원'];
 ans.forEach((a,i)=>{const y=30+i*50;b+=line(`M170 ${150}L300 ${y+20}`,'var(--line)','')+dot(172,150,128,y+20-150,A,i*.35,5)+blink(box(300,y,170,40,a==='3,000원'?A:O)+t(385,y+26,`풀이 ${i+1} → ${a}`,{size:14}),i*.35);});
 b+=line('M470 150H510')+box(510,105,115,90,A)+t(567,135,'다수결',{w:700})+t(567,160,'3,000원',{fill:A,w:700})+t(567,182,'5개 중 4개',{size:13,fill:MU})+pulse(567,150,58,A);
 const p=M.majority(0.7,5);b+=t(320,288,`풀이 하나가 맞을 확률 0.7일 때 5개 다수결이 맞을 확률 ${f(p,3)} (이진 모형 계산)`,{size:13,fill:MU});
 return {svg:svg('예시 세 개와 새 문의가 다섯 개의 풀이로 퍼지고, 네 풀이가 같은 답을 내어 다수결로 3,000원이 선택되는 과정',b),caption:`풀이 다섯 개와 답은 설명을 위한 시나리오입니다. 아래 숫자는 이진 모형으로 실제 계산한 값으로, 풀이 하나의 정답률 0.7이 다수결 5개에서 ${f(p,3)}으로 오릅니다.`};
};

/* 3장: 단계마다 스키마가 허용하는 토큰만 밝게 남는다(실제 허용 집합 계산). */
F.structured=()=>{
 let b=t(20,30,'만든 접두부',{a:'start',size:14,fill:MU})+t(20,198,'어휘 12개 중 이번 자리에 허용되는 토큰',{a:'start',size:14,fill:MU});
 [1,3,7,11].forEach((s,i)=>{const r=M.jsonMask(s),pre=r.prefix.join(' ')+' ▌';let g=box(20,42,600,48,A,'var(--chart)')+t(32,72,pre.replace(/"/g,'&quot;'),{a:'start',size:14,mono:1});
  g+=t(20,120,`${s}단계 · 상태: ${r.state}${r.type?` (${r.type==='string'?'문자열':r.type==='integer'?'정수':'참·거짓'})`:''} · 허용 ${r.allowed.length}개, 막힘 ${r.blocked}개`,{a:'start',size:15,w:700,fill:A});
  M.VOCAB.forEach((v,k)=>{const x=20+(k%6)*101,y=208+Math.floor(k/6)*44,on=r.allowed.includes(v);g+=box(x,y,95,36,on?A:'var(--line)',on?'color-mix(in srgb,var(--accent) 22%,var(--panel2))':'var(--panel2)',6)+t(x+47.5,y+23,v.replace(/"/g,'&quot;').replace('네, 확인했습니다','네, 확…'),{size:13,mono:1,fill:on?'var(--text)':MU})+(on?'':`<path d="M${x+8} ${y+18}H${x+87}" stroke="${MU}" stroke-width="1.5"/>`);});
  b+=turn(g,i);});
 return {svg:svg('주문 JSON을 만드는 1, 3, 7, 11단계에서 스키마가 허용하는 토큰만 밝게 남고 나머지는 지워지는 모습',b),caption:'허용 집합은 작은 스키마 모형으로 실제 계산한 것입니다. 3단계에서는 문자열이면 "네, 확인했습니다"도 허용되고, 7단계 정수 자리에서는 "2" 하나만 남습니다.'};
};

/* 4장: 창 예산 막대(압축 전·후)와 위치별 주의 경향 그림. */
F.context=()=>{
 const cols=[MU,B,O,A,'var(--text)','var(--line)'],rows=[['압축 전',M.contextBudget({window:32000,tools:60,turns:80,chunks:20})],['도구 가지치기 + 요약',M.contextBudget({window:32000,tools:60,turns:80,chunks:20,strategy:'both'})]];
 let b=t(20,26,'32K 창 · 도구 60개 · 대화 80턴 · 청크 20개',{a:'start',size:14,fill:MU});
 rows.forEach(([name,r],i)=>{const y=44+i*64;let x=20;b+=t(20,y+14,`${name}: ${f(r.used)}토큰 (${f(r.share*100,0)}%)${r.over?' · 넘침':''}`,{a:'start',size:14,w:700,fill:r.over?O:A});
  r.parts.forEach(([,v],k)=>{const w=Math.min(v/32000*600,620-x);if(w>0)b+=grow(x,y+22,w,24,cols[k],i*.6+k*.1);x+=w;});b+=`<path d="M620 ${y+18}V${y+50}" stroke="${O}" stroke-width="2"/>`;});
 b+=['시스템','도구','대화','근거','질문','답변 예약'].map((s,k)=>`<rect x="${20+k*100}" y="176" width="12" height="12" fill="${cols[k]}"/>`+t(38+k*100,187,s,{a:'start',size:13,fill:MU})).join('');
 const pts=[];for(let i=0;i<=40;i++){const u=i/40;pts.push([60+u*520,212+46*(1-Math.pow(2*u-1,2))]);}
 b+=draw(pts,B)+t(60,292,'처음',{size:13,fill:MU})+t(320,292,'가운데 · 덜 쓰임',{size:13,fill:O})+t(580,292,'끝',{size:13,fill:MU})+pulse(320,258,10,O);
 return {svg:svg('위는 32K 창에 도구·대화·근거를 채운 예산 막대가 압축 전에는 넘치고 압축 뒤에는 절반 이하로 줄어드는 모습, 아래는 문맥 가운데 정보가 덜 쓰이는 경향을 나타낸 곡선',b),caption:'위 막대는 이 장의 가정으로 실제 계산한 토큰 예산입니다. 아래 곡선은 Liu 등(2023)이 보고한 "처음과 끝은 잘 쓰고 가운데는 덜 쓴다"는 경향을 나타낸 그림이며 수치가 아닙니다.'};
};

/* 5장: 질문 벡터가 가까운 조각 셋을 찾고, 저장 용량 막대가 줄어든다. */
F.retrieval=()=>{
 let b=box(20,20,290,260,'var(--line)','var(--chart)');const pts=[[80,70],[120,210],[250,60],[200,240],[270,190],[60,150],[150,110]],q=[175,150],near=[6,3,4];
 pts.forEach(([x,y],i)=>b+=`<circle cx="${x}" cy="${y}" r="7" fill="${near.includes(i)?A:'var(--line)'}"/>`);
 near.forEach((i,k)=>b+=line(`M${q[0]} ${q[1]}L${pts[i][0]} ${pts[i][1]}`,A)+dot(q[0],q[1],pts[i][0]-q[0],pts[i][1]-q[1],A,k*.4,5));
 b+=`<circle cx="${q[0]}" cy="${q[1]}" r="9" fill="${O}"/>`+pulse(q[0],q[1],16,O)+t(165,276,'질문과 가까운 조각 3개',{size:13,fill:MU})+t(190,135,'질문',{size:13,fill:O,a:'start'});
 const rows=[['1536 · float32',M.vectorStore(1536,'float32',10)],['256 · float32',M.vectorStore(256,'float32',10)],['1536 · 이진',M.vectorStore(1536,'binary',10)]];
 b+=t(330,40,'조각 1,000만 개의 벡터 저장량',{a:'start',size:14,w:700});
 rows.forEach(([n,r],i)=>{const y=70+i*66;b+=t(330,y,n,{a:'start',size:14})+grow(330,y+10,Math.max(r.totalGB/61.44*230,2),22,i?B:A,i*.4)+t(568,y+27,`${f(r.totalGB,2)} GB`,{a:'start',size:13,mono:1});});
 b+=t(330,280,'전수 비교: 질문당 곱셈·덧셈 약 154억 번',{a:'start',size:13,fill:MU});
 return {svg:svg('왼쪽은 질문 벡터에서 가까운 조각 세 개로 선이 이어지는 모습, 오른쪽은 1,536차원 float32와 256차원, 이진 양자화의 저장량 막대',b),caption:'왼쪽 점의 위치는 설명을 위한 그림입니다. 오른쪽 저장량과 아래 계산량은 1,000만 조각 기준으로 실제 계산한 값이며 HNSW 색인의 추가 메모리는 넣지 않았습니다.'};
};

/* 6장: 얼린 W 옆으로 B·A 경로가 지나가고, 학습 파라미터 수를 비교한다. */
F.lora=()=>{
 const m=M.loraMatrix(4096,4096,16);let b=box(170,40,170,170,MU,'var(--panel2)')+t(255,118,'W (얼림)',{w:700})+t(255,142,'4096 × 4096',{size:14,fill:MU,mono:1})+t(255,166,`${f(m.full)}개`,{size:13,fill:MU,mono:1});
 b+=box(380,40,26,170,A,'color-mix(in srgb,var(--accent) 25%,var(--panel2))',4)+t(393,232,'B',{w:700,fill:A})+box(420,40,170,26,A,'color-mix(in srgb,var(--accent) 25%,var(--panel2))',4)+t(505,90,'A (16 × 4096)',{size:14,fill:A})+t(393,256,'4096 × 16',{size:13,fill:A,mono:1});
 b+=box(20,105,90,40,B)+t(65,131,'입력 x',{size:14})+line('M110 125H170')+line('M110 125C140 125 140 53 420 53',A)+dot(112,125,56,0,B,0,5)+dot(112,125,300,-72,A,.5,5);
 b+=line('M340 125H600')+box(560,105,66,40,O)+t(593,131,'+ → y',{size:14})+dot(342,125,214,0,B,1,5);
 b+=t(320,282,`학습하는 것은 B·A의 ${f(m.lora)}개뿐 · 원래 층의 ${f(m.share*100,2)}%`,{size:15,w:700,fill:A})+pulse(393,125,22,A);
 return {svg:svg('입력 x가 얼린 큰 행렬 W와 옆의 좁은 행렬 B와 A를 함께 지나 더해지는 LoRA 구조와, 학습하는 파라미터가 원래 층의 0.78%라는 계산',b),caption:'행렬 크기와 파라미터 수는 4096 × 4096 층에 랭크 16을 붙인 경우를 실제로 계산했습니다. 상자 크기는 실제 비율이 아니라 모양을 보이려는 그림입니다.'};
};

/* 7장: 함수 호출 고리와 순차·병렬 대기 시간 막대. */
F.tools=()=>{
 const names=[['고객',B],['앱',A],['모델',O],['주문 시스템',A]];let b='';
 names.forEach(([n,c],i)=>b+=box(20+i*155,24,130,40,c)+t(85+i*155,50,n,{size:14,w:700}));
 const steps=[[85,240,'질문'],[240,395,'도구 정의 + 질문'],[395,240,'lookup_order 호출 JSON'],[240,550,'검증 후 실행'],[550,240,'결과'],[240,395,'결과 전달'],[395,85,'최종 답']];
 steps.forEach(([a,c,s],i)=>{const y=84+i*18;b+=blink(`<path d="M${a} ${y}H${c}" stroke="var(--line)" stroke-width="2"/>`+t((a+c)/2,y-3,s,{size:13,fill:MU}),i*.45)+dot(a,y,c-a,0,i%2?A:O,i*.45,4);});
 const r=M.toolLatency(3,500,'sequential');b+=t(20,234,'도구 3개 × 500ms, 모델 한 차례 800ms',{a:'start',size:13,fill:MU});
 b+=t(20,258,'순차',{a:'start',size:14})+grow(70,246,r.seq/r.seq*470,16,O,0)+t(548,259,`${f(r.seq)}ms`,{a:'start',size:13,mono:1});
 b+=t(20,284,'병렬',{a:'start',size:14})+grow(70,272,r.par/r.seq*470,16,A,.4)+t(78+r.par/r.seq*470,285,`${f(r.par)}ms`,{a:'start',size:13,mono:1});
 return {svg:svg('고객, 앱, 모델, 주문 시스템 사이로 질문과 도구 호출과 결과가 차례로 오가는 함수 호출 고리, 아래는 도구 세 개를 순차와 병렬로 부를 때의 대기 시간 막대',b),caption:`모델은 호출 JSON만 내고 실행은 앱이 합니다. 아래 막대는 이 장의 지연 모형으로 실제 계산한 값으로, 도구 세 개를 병렬로 부르면 ${f(r.seq)}ms가 ${f(r.par)}ms로 줄어듭니다.`};
};

/* 8장: 사례 수에 따라 통과율 90%의 Wilson 구간이 좁아진다(실제 계산). */
F.eval=()=>{
 const X=v=>80+(v-0.75)/0.25*520;let b='';[0.75,0.8,0.85,0.9,0.95,1].forEach(v=>b+=`<path d="M${X(v)} 30V236" stroke="var(--line)" stroke-width="1"/>`+t(X(v),256,f(v*100)+'%',{size:13,fill:MU}));
 b+=`<path d="M${X(0.9)} 30V236" stroke="${A}" stroke-width="2" stroke-dasharray="5 4"/>`;
 [50,100,200,500,1000].forEach((n,i)=>{const w=M.wilson(Math.round(n*0.9),n),y=50+i*40;b+=t(70,y+5,`n = ${n}`,{a:'end',size:14,mono:1})+grow(X(w.lo),y-6,X(w.hi)-X(w.lo),12,i<2?O:A,i*.3)+`<circle cx="${X(0.9)}" cy="${y}" r="5" fill="var(--text)"/>`+t(X(w.hi)+8,y+5,`폭 ${f(w.width*100,1)}%p`,{a:'start',size:13,fill:MU});});
 b+=t(320,286,'관측 통과율 90%의 Wilson 95% 구간',{size:14,w:700});
 return {svg:svg('관측 통과율 90%를 사례 50, 100, 200, 500, 1000개로 잰 경우의 Wilson 95% 구간 막대가 사례가 늘수록 좁아지는 모습',b),caption:'구간은 Wilson 공식으로 실제 계산했습니다. 50개일 때 구간이 [78.6%, 95.7%]로 폭이 17%p라 관측 90%를 80%짜리 시스템과 가르지 못하고, 200개에서 8.4%p, 1,000개에서 3.7%p로 좁아집니다.'};
};

/* 9장: 입력 검사 → 모델 → 출력 검사 샌드위치와 막은 요청의 구성. */
F.guardrails=()=>{
 const layers=[['길이·사용량',B],['주제 분류',B],['주입 탐지',B],['모델',O],['유해성',A],['개인정보',A]];let b='';
 layers.forEach(([n,c],i)=>{const x=10+i*105;b+=box(x,30,95,50,c)+t(x+47.5,60,n,{size:13,w:700});if(i<5)b+=line(`M${x+95} 55H${x+105}`)+dot(x+95,55,10,0,c,i*.3,4);});
 b+=blink(t(57,104,'✕ 막힘',{size:14,fill:O}),.3)+blink(t(267,104,'✕ 막힘',{size:14,fill:O}),.9)+blink(t(582,104,'✕ 걸러 냄',{size:14,fill:O}),1.5);
 const g=M.guard(0.5,0.01),tot=g.tp+g.fp;b+=t(20,146,'공격 1%, 임계값 0.5일 때 하루 1만 건 중 막힌 요청',{a:'start',size:14,w:700});
 b+=grow(20,160,g.tp/tot*600,34,O,0)+grow(20+g.tp/tot*600,160,g.fp/tot*600,34,B,.3)+t(30,218,`실제 공격 ${f(g.tp)}건`,{a:'start',size:14,fill:O})+t(620,218,`잘못 막은 정상 문의 ${f(g.fp,1)}건`,{a:'end',size:14,fill:B});
 b+=t(320,262,`정밀도 ${f(g.precision*100,1)}% · 놓친 공격 ${f(g.fn)}건`,{size:16,w:700,fill:A})+pulse(30,177,12,O);
 return {svg:svg('입력 검사 세 층, 모델, 출력 검사 두 층을 요청이 차례로 지나며 일부가 막히는 모습과, 막힌 요청 가운데 실제 공격이 아주 적은 비율이라는 막대',b),caption:`아래 막대는 교육용 탐지 점수로 실제 계산했습니다. 공격 100건 중 ${f(g.tp)}건을 잡지만, 막힌 요청 대부분은 정상 문의라서 정밀도가 ${f(g.precision*100,1)}%에 그칩니다.`};
};

/* 10장: 의미 캐시 → 접두부 캐시 → 모델로 내려가는 흐름과 비용 배수 막대. */
F.cache=()=>{
 let b=box(20,24,150,48,B)+t(95,53,'새 질문',{w:700})+line('M170 48H210')+box(210,24,180,48,A)+t(300,53,'의미 캐시',{w:700})+dot(170,48,40,0,B,0,5);
 b+=line('M390 48H430',A)+box(430,24,190,48,A)+t(525,53,'적중 → 저장된 답',{size:14})+dot(390,48,40,0,A,.6,5);
 b+=line('M300 72V110')+t(312,96,'놓침',{a:'start',size:13,fill:MU})+dot(300,72,0,38,O,1,5);
 const seg=[['시스템 지시',150,A],['도구 정의',130,A],['예시',90,A],['이번 질문',110,O]];let x=60;
 seg.forEach(([n,w,c],i)=>{b+=box(x,112,w-6,44,c,i<3?'color-mix(in srgb,var(--accent) 18%,var(--panel2))':'var(--panel2)',6)+t(x+(w-6)/2,139,n,{size:14});x+=w;});
 b+=t(60,176,'← 바뀌지 않는 접두부: 캐시 읽기',{a:'start',size:13,fill:A})+t(540,176,'바뀌는 끝: 새로 계산',{a:'end',size:13,fill:O});
 const rows=[[0,M.promptCache(0,'a5').mult],[1,M.promptCache(1,'a5').mult],[10,M.promptCache(10,'a5').mult]];
 b+=t(20,204,'명시적 캐시(5분) · 쓰기 1번 뒤 읽기 r번의 평균 비용 배수',{a:'start',size:14,w:700});
 rows.forEach(([r,m],i)=>{const y=218+i*26;b+=t(90,y+15,`r = ${r}`,{a:'end',size:13,mono:1})+grow(100,y,m/1.25*420,18,i?A:O,i*.3)+t(108+m/1.25*420,y+15,`${f(m,3)}배`,{a:'start',size:13,mono:1});});
 return {svg:svg('새 질문이 의미 캐시에서 적중하면 저장된 답으로, 놓치면 바뀌지 않는 접두부는 캐시에서 읽고 바뀌는 끝만 새로 계산하는 흐름과 읽기 횟수별 비용 배수 막대',b),caption:'흐름은 원본 레슨이 설명한 캐시 층을 그린 것입니다. 아래 막대는 원본 커리큘럼 기준 배수(쓰기 1.25, 읽기 0.1)로 실제 계산했으며, 읽기 1번이면 0.675배, 10번이면 약 0.205배입니다.'};
};

/* 11장: 환불 요청이 그래프의 노드를 차례로 지나고, 환불 앞에서 멈춘다. */
F.graph=()=>{
 const pos={START:[60,70],agent:[200,70],tools:[200,190],review:[350,70],refund:[350,190],END:[560,130]};
 let b=line('M85 70H170')+line('M200 95V165',A)+line('M215 165V95',B)+line('M230 70H320')+line('M350 95V165',O)+line('M300 175L250 90','var(--line)')+line('M230 70C400 0 520 60 545 115');
 Object.entries(pos).forEach(([k,[x,y]])=>{const label={START:'시작',agent:'모델',tools:'도구',review:'승인 대기',refund:'환불 실행',END:'끝'}[k];b+=box(x-55,y-22,110,44,k==='review'?O:k==='refund'?O:A)+t(x,y+6,label,{size:15,w:700});});
 const snaps=M.graphRun('add','before'),show=[1,2,4,5];
 show.forEach((s,i)=>{const sn=snaps[s],[x,y]=pos[sn.node]||pos.END;b+=turn(pulse(x,y,32,O)+t(20,262,`체크포인트 ${sn.checkpoint} · ${sn.note}`,{a:'start',size:14,fill:'var(--text)'})+t(20,286,`메시지 ${sn.messages}개 · 환불 ${sn.refunded?'완료':'아직'}${sn.paused?' · 멈춤':''} · 단계마다 상태 저장`,{a:'start',size:13,fill:MU}),i);});
 return {svg:svg('시작, 모델, 도구, 승인 대기, 환불 실행, 끝으로 이루어진 상태 그래프를 환불 요청이 지나가며 승인 대기에서 멈추는 모습',b),caption:'노드 순서와 체크포인트 내용은 이 장의 실험과 같은 미리 정한 시나리오입니다. 승인 대기가 환불 실행 앞에 있으므로, 멈춘 시점에 환불은 아직 일어나지 않았습니다.'};
};

/* 12장: 프로덕션 경로를 요청이 지나가고, 적중률별 월 비용이 예산선과 비교된다. */
F.final=()=>{
 const parts=['게이트웨이','입력 검사','라우터','의미 캐시','LLM','출력 검사','비용 기록'];let b='';
 parts.forEach((p,i)=>{const x=8+i*90;b+=box(x,24,82,44,i===3?A:i===4?O:B)+t(x+41,51,p,{size:13,w:700});if(i<6)b+=dot(x+82,46,8,0,A,i*.3,4);});
 const rows=[['캐시 0%',M.monthlyCost({hit:0})],['적중 8%',M.monthlyCost({hit:0.08})],['적중 35%',M.monthlyCost({hit:0.35})],['8% + 소형 30%',M.monthlyCost({hit:0.08,mini:0.3})]],X=v=>140+v/13000*420;
 b+=t(20,98,'한 달 LLM 비용 (원본 레슨의 계산 예시 단가)',{a:'start',size:14,w:700});
 rows.forEach(([n,r],i)=>{const y=114+i*40;b+=t(130,y+18,n,{a:'end',size:13})+grow(140,y+2,X(r.total)-140,22,r.total>8000?O:A,i*.3)+t(Math.max(X(r.total),X(8000))+8,y+19,`$${f(r.total)}`,{a:'start',size:13,mono:1});});
 b+=`<path d="M${X(8000)} 108V276" stroke="var(--text)" stroke-width="2" stroke-dasharray="6 4"/>`+t(X(8000),292,'예산 $8,000',{size:13,w:700});
 return {svg:svg('게이트웨이부터 비용 기록까지 일곱 부품을 요청이 지나는 프로덕션 경로와, 캐시 적중률과 소형 모델 비율에 따른 한 달 비용 막대를 예산선과 비교한 그림',b),caption:'비용 막대는 하루 사용자 1만 명, 5번 질문, 입력 1,500·출력 400토큰과 원본 레슨의 계산 예시 단가로 실제 계산했습니다. 적중률이 8%로 떨어지면 예산을 넘고, 작은 모델 30%를 더하면 다시 안으로 들어옵니다.'};
};

function fallback(c){
 const steps=c.flow.map(x=>x.split('|')),n=steps.length,w=(600-(n-1)*20)/n;let b='';
 steps.forEach(([a],i)=>{const x=20+i*(w+20);b+=blink(box(x,90,w,110,A),i*.6)+t(x+w/2,150,a,{w:700});});
 return {svg:svg(`${c.title}의 흐름`,b),caption:c.subtitle};
}
function render(c){return F[c.id]?F[c.id](H):fallback(c);}
return {render,F,H};
})();
