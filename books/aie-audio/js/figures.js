/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A07Math로 계산한다. */
window.A07Figures=(()=>{
'use strict';
const M=A07Math;
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
const A='var(--accent)',B='var(--blue)',O='var(--orange)',Mu='var(--muted)';

F.wave=()=>{
 const r=M.alias(7000,10000),X=x=>40+x*560/2,Y=v=>120-v*55;let wave='',fake='';
 for(let i=0;i<=200;i++){const ms=2*i/200,s=ms/1000;wave+=(i?'L':'M')+X(ms).toFixed(1)+' '+Y(Math.sin(2*Math.PI*7000*s)).toFixed(1);fake+=(i?'L':'M')+X(ms).toFixed(1)+' '+Y(Math.sin(2*Math.PI*(7000-10000)*s)).toFixed(1);}
 let b=t(40,30,'10 kHz로 찍은 7 kHz 음 (2 ms 구간)',{a:'start',fill:Mu})+`<path d="${wave}" fill="none" stroke="${Mu}" stroke-width="1.5" stroke-dasharray="4 4"/>`+`<path d="${fake}" fill="none" stroke="${A}" stroke-width="3"/>`;
 for(let n=0;n<=20;n++){const s=n/10000;b+=blink(`<circle cx="${X(s*1000)}" cy="${Y(Math.sin(2*Math.PI*7000*s))}" r="6" fill="${O}"/>`,n*.18);}
 const fx=f=>60+f/10000*520;b+=`<path d="M60 240H580" stroke="var(--line)" stroke-width="2"/>`+[0,3000,5000,7000,10000].map(f=>`<path d="M${fx(f)} 234v12" stroke="${Mu}"/>`+t(fx(f),266,`${f/1000} kHz`,{size:13,fill:Mu})).join('');
 b+=`<path d="M${fx(5000)} 210V250" stroke="${O}" stroke-width="2"/>`+t(fx(5000),204,'나이퀴스트 5 kHz',{size:13,fill:O})+`<circle cx="${fx(7000)}" cy="240" r="7" fill="${Mu}"/>`+`<circle cx="${fx(3000)}" cy="240" r="8" fill="${A}"/>`+pulse(fx(3000),240,14,A)+dot(fx(7000),240,fx(3000)-fx(7000),0,O,0,6);
 b+=t(fx(3000),290,`보이는 주파수 ${r.apparent/1000} kHz`,{size:14,fill:A,w:700});
 return {svg:svg(`10 kHz로 찍은 7 kHz 음의 점들이 ${r.apparent/1000} kHz 곡선 위에 놓이고, 주파수 축에서 7 kHz가 나이퀴스트 5 kHz를 기준으로 3 kHz로 접히는 그림`,b),caption:`동그란 점은 7 kHz 음을 10 kHz로 찍은 실제 값이고, 굵은 실선 곡선은 같은 점을 지나는 ${r.apparent/1000} kHz 사인입니다. 접히는 주파수는 원본 레슨의 공식으로 실제 계산했고, 움직이는 점은 접힘을 보여 주는 시각적 비유입니다.`};
};
F.mel=()=>{
 const s=M.stft({winMs:25}),mb=M.melBank(80);let b=t(20,28,'파형 → STFT → 멜 필터뱅크 → 로그 멜',{a:'start',fill:Mu});
 let wv='';for(let i=0;i<=160;i++){const x=20+i*1.5;wv+=(i?'L':'M')+x+' '+(78+Math.sin(i*.55)*Math.sin(i*.07)*22).toFixed(1);}
 b+=`<path d="${wv}" fill="none" stroke="${B}" stroke-width="2"/>`+`<rect class="fig-pkt" style="--dx:200px;--dy:0px" x="20" y="50" width="40" height="56" fill="none" stroke="${O}" stroke-width="3"/>`+t(140,128,'25 ms 창을 10 ms씩 밀기',{size:13,fill:O});
 for(let c=0;c<10;c++)for(let r=0;r<8;r++){const v=(Math.sin(c*.7+r*1.3)+1)/2;b+=blink(`<rect x="${290+c*16}" y="${48+r*14}" width="14" height="12" fill="${A}" opacity="${(.15+v*.75).toFixed(2)}"/>`,c*.25);}
 b+=t(370,176,`STFT ${s.bins}개 빈`,{size:13,fill:Mu});
 const mx=f=>470+f/8000*150;mb.filters.filter((_,i)=>i%4===0).forEach((f,i)=>{b+=`<path class="fig-draw" style="animation-delay:${i*.08}s" d="M${mx(f.lowHz)} 160L${mx(f.centerHz)} 60L${mx(f.highHz)} 160" fill="none" stroke="${i%2?B:A}" stroke-width="1.6"/>`;});
 b+=t(545,176,'멜 필터 80개 (일부)',{size:13,fill:Mu})+line('M262 100H284',Mu)+line('M452 100H466',Mu);
 b+=box(40,206,560,70,'var(--line)','var(--chart)',10)+t(320,236,`10초 · 16 kHz → 프레임 ${s.frames}개 × 빈 ${s.bins}개 → 행렬곱 → ${s.frames} × 80 로그 멜`,{size:14,w:700})+t(320,262,'낮은 주파수 필터는 좁고 높은 주파수 필터는 넓습니다',{size:13,fill:Mu});
 return {svg:svg(`창이 파형 위를 밀고 지나가며 스펙트로그램 열이 차례로 생기고, 멜 삼각 필터가 낮은 쪽은 촘촘하게 높은 쪽은 넓게 놓이는 그림. 10초에 ${s.frames}프레임`,b),caption:`프레임 수 ${s.frames}개와 빈 ${s.bins}개, 멜 필터의 위치는 원본 공식으로 실제 계산했습니다. 스펙트로그램 칸의 밝기는 모양을 보여 주는 예시 값입니다.`};
};
F.classify=()=>{
 const counts=[900,100,10],maj=M.classMetrics(counts,[1,0,0]),bal=M.classMetrics(counts,[.9,.88,.85]);let b=t(20,30,'부엌 소리 1,010개',{a:'start',fill:Mu});
 [['배경',900,Mu],['주전자',100,B],['화재 경보',10,O]].forEach(([n,c,col],i)=>{const y=52+i*42;b+=t(20,y+20,n,{a:'start',size:14})+grow(110,y,c/900*200,26,col,i*.3)+t(110+c/900*200+8,y+20,`${c}개`,{a:'start',size:14,fill:col});});
 const card=(x,title,r,c)=>box(x,186,280,96,c,'var(--chart)',10)+t(x+140,212,title,{size:14,w:700})+t(x+20,242,`정확도 ${(r.accuracy*100).toFixed(1)}%`,{a:'start',size:15})+t(x+20,268,`macro F1 ${(r.macroF1*100).toFixed(1)}%`,{a:'start',size:15,w:700,fill:c});
 b+=turn(card(30,'늘 “배경”이라고 답함',maj,O),0)+turn(card(30,'늘 “배경”이라고 답함',maj,O),1)+turn(card(30,'경보를 하나도 못 맞힘',maj,O),2)+turn(card(30,'정확도만 보면 속는다',maj,O),3);
 b+=card(330,'균형 샘플링 학습',bal,A)+box(360,40,250,120,'var(--line)','var(--chart)',10)+t(485,70,'로그 멜 → CNN · AST',{size:14})+t(485,100,'→ 클래스별 확률',{size:14})+t(485,132,'클래스별 재현율로 평가',{size:14,fill:A,w:700})+dot(330,98,30,0,A,0,5);
 return {svg:svg(`배경 900, 주전자 100, 경보 10개에서 늘 배경이라고 답하면 정확도 ${(maj.accuracy*100).toFixed(1)}%지만 macro F1 ${(maj.macroF1*100).toFixed(1)}%이고, 균형 학습은 macro F1 ${(bal.macroF1*100).toFixed(1)}%인 그림`,b),caption:'막대는 클래스별 개수, 아래 두 카드는 같은 데이터에서 두 분류기의 정확도와 macro F1입니다. 클래스별 재현율은 가정값이고 지표는 실제 계산이며, 왼쪽 카드의 문구가 바뀌는 것은 읽는 순서를 돕는 연출입니다.'};
};
F.asr=()=>{
 const frames='_ 5 5 _ 5 분 분 _'.split(' '),r=M.ctcCollapse(frames),merged=M.ctcCollapse(frames,'repeat');let b=t(20,30,'프레임 8개의 최댓값 경로',{a:'start',fill:Mu});
 frames.forEach((f,i)=>{const x=40+i*70;b+=blink(box(x,46,56,52,f==='_'?Mu:A)+t(x+28,80,f==='_'?'␣':f,{size:20,w:700,fill:f==='_'?Mu:'var(--text)'}),i*.3);});
 b+=line('M320 106V128',Mu)+t(330,124,'① 반복 합치기',{a:'start',size:14,fill:B});
 merged.tokens.forEach((f,i)=>{const x=110+i*70;b+=blink(box(x,136,56,44,B)+t(x+28,165,f==='_'?'␣':f,{size:18,fill:f==='_'?Mu:'var(--text)'}),2.4+i*.2);});
 b+=line('M320 188V208',Mu)+t(330,204,'② 공백 지우기',{a:'start',size:14,fill:O});
 b+=box(220,216,200,56,A,'var(--chart)',10)+t(320,253,r.text,{size:26,w:700,fill:A})+pulse(420,244,10,A);
 b+=t(460,250,'공백이 두 5를 갈라',{a:'start',size:13,fill:Mu})+t(460,270,'“55분”이 됩니다',{a:'start',size:13,fill:Mu});
 return {svg:svg(`프레임 경로 ${frames.join(' ')}에서 반복을 합치면 ${merged.tokens.join(' ')}, 공백을 지우면 ${r.text}가 되는 그림`,b),caption:`CTC 탐욕 디코딩의 두 규칙을 실제로 적용한 결과(${r.text})입니다. 칸이 차례로 켜지는 움직임은 프레임 시간 순서를 보여 줍니다.`};
};
F.whisper=()=>{
 const c=M.whisperChunks(30,5),tok=M.audioTokens(30,2);let b=t(20,28,'Whisper: 30초 창 하나',{a:'start',fill:Mu});
 b+=box(20,46,130,70,B,'var(--chart)')+t(85,76,'로그 멜',{w:700})+t(85,100,`${c.melFrames}프레임`,{size:13,fill:Mu});
 b+=box(190,46,130,70,A,'var(--chart)')+t(255,76,'인코더',{w:700})+t(255,100,`출력 ${c.encFrames}개`,{size:13,fill:Mu});
 b+=box(360,46,260,70,O,'var(--chart)')+t(490,72,'디코더 (교차 어텐션)',{w:700})+t(490,98,'언어 · 작업 · 시각 토큰 → 글자',{size:13,fill:Mu});
 b+=line('M150 81H190',B)+line('M320 81H360',A)+dot(150,81,36,0,B,0,5)+dot(320,81,36,0,A,.6,5);
 b+=t(340,150,'오디오 언어모델: 인코더 + 프로젝터 + LLM',{a:'start',size:14,fill:Mu})+line('M255 116V176',A);
 b+=box(190,176,130,70,A,'var(--chart)')+t(255,206,'프로젝터',{w:700})+t(255,230,'2개씩 묶기',{size:13,fill:Mu});
 b+=box(360,176,260,70,B,'var(--chart)')+t(490,206,'LLM',{w:700})+t(490,230,`오디오 토큰 ${tok}개 + 질문 → 답`,{size:13,fill:Mu})+line('M320 211H360',B)+dot(320,211,36,0,B,1.2,5);
 b+=blink(box(20,176,130,70,O,'var(--chart)')+t(85,206,'2초 명령?',{w:700,fill:O})+t(85,230,'28초는 침묵',{size:13,fill:O}),0)+t(320,280,'짧은 입력은 VAD로 말소리만 넣어야 환각을 피합니다',{size:13,fill:Mu});
 return {svg:svg(`30초 로그 멜 ${c.melFrames}프레임이 인코더에서 ${c.encFrames}개로 줄어 디코더나 프로젝터를 거쳐 LLM으로 가는 그림`,b),caption:`Whisper 창 하나의 프레임 수와 인코더 출력 수, 프로젝터가 2개씩 묶었을 때의 토큰 수(${tok}개)는 실제 계산입니다. 움직이는 점은 데이터가 흐르는 방향을 보여 주는 비유입니다.`};
};
F.speaker=()=>{
 const enroll=[.92,.39],same=[.84,.54],other=[.35,.94],cs=M.cosine(enroll,same),co=M.cosine(enroll,other),O0=[120,250],L=170,P=v=>[O0[0]+v[0]*L,O0[1]-v[1]*L];
 const arrow=(v,c,lbl,d)=>{const [x,y]=P(v);return blink(`<path d="M${O0[0]} ${O0[1]}L${x} ${y}" stroke="${c}" stroke-width="4"/><circle cx="${x}" cy="${y}" r="6" fill="${c}"/>`+t(x+10,y-6,lbl,{a:'start',size:14,fill:c,w:700}),d);};
 let b=t(20,28,'화자 임베딩 (길이 1로 맞춘 2차원 예)',{a:'start',fill:Mu})+`<path d="M${O0[0]} ${O0[1]}H320M${O0[0]} ${O0[1]}V60" stroke="var(--line)"/>`;
 b+=arrow(enroll,A,'엄마 등록',0)+arrow(same,B,'엄마 새 발화',.6)+arrow(other,O,'다른 가족',1.2);
 b+=box(360,50,260,210,'var(--line)','var(--chart)',12)+t(490,80,'코사인 점수와 문턱 0.80',{size:14,fill:Mu});
 b+=t(380,120,'엄마 ↔ 엄마',{a:'start'})+t(600,120,cs.toFixed(2),{a:'end',w:700,fill:A})+t(380,152,'엄마 ↔ 다른 가족',{a:'start'})+t(600,152,co.toFixed(2),{a:'end',w:700,fill:O});
 b+=`<path d="M380 172H600" stroke="var(--line)"/>`+t(400,204,'통과',{a:'start',fill:A,w:700})+t(600,204,'엄마 새 발화',{a:'end',size:14})+t(400,236,'거부',{a:'start',fill:O,w:700})+t(600,236,'다른 가족',{a:'end',size:14})+pulse(380,198,9,A);
 return {svg:svg(`등록 임베딩과 엄마의 새 발화 코사인 ${cs.toFixed(2)}, 다른 가족과 ${co.toFixed(2)}를 문턱 0.80과 비교하는 그림`,b),caption:`실제 임베딩은 192차원이지만 여기서는 2차원 예시 벡터로 코사인을 실제 계산했습니다(${cs.toFixed(2)}, ${co.toFixed(2)}). 화살표가 차례로 나타나는 것은 등록과 검증의 순서입니다.`};
};
F.tts=()=>{
 const d=M.durations([12,8,10,9,14,13,9,15],1),syl=['타','이','머','를','맞','췄','어','요'];let b=t(20,28,'텍스트 전처리 → 길이 예측 → 멜 → 보코더',{a:'start',fill:Mu});
 b+=box(20,46,150,50,B,'var(--chart)')+t(95,77,'타이머를 맞췄어요',{size:14,w:700});
 let x=200;d.frames.forEach((f,i)=>{const w=f*4.4;b+=grow(x,52,w-2,38,i%2?B:A,i*.2)+t(x+w/2,76,syl[i],{size:14,fill:'var(--bg)',w:700});x+=w;});
 b+=t(400,114,`음절별 프레임 ${d.frames.join('·')} = ${d.total}프레임 = ${d.seconds}초`,{size:13,fill:Mu});
 for(let c=0;c<22;c++)for(let r=0;r<6;r++){const v=(Math.sin(c*.5+r)+1)/2;b+=blink(`<rect x="${200+c*18}" y="${130+r*12}" width="16" height="10" fill="${A}" opacity="${(.2+v*.7).toFixed(2)}"/>`,c*.12);}
 b+=t(110,170,'멜 스펙트로그램',{size:14,fill:Mu})+line('M400 206V222',Mu);
 let wv='';for(let i=0;i<=200;i++){const xx=200+i*2;wv+=(i?'L':'M')+xx+' '+(250+Math.sin(i*.9)*Math.sin(i*.06)*20).toFixed(1);}
 b+=`<path d="${wv}" fill="none" stroke="${O}" stroke-width="2"/>`+t(110,256,'보코더 → 24 kHz 파형',{size:14,fill:Mu})+t(400,292,`${d.samples.toLocaleString('en-US')}샘플`,{size:13,fill:O});
 return {svg:svg(`“타이머를 맞췄어요” 여덟 음절이 프레임 ${d.total}개로 늘어나 멜과 파형이 되는 그림. 길이 ${d.seconds}초`,b),caption:`음절별 프레임 수는 이 책의 가정값이고, 합계 ${d.total}프레임과 ${d.seconds}초, 샘플 수는 실제 계산입니다. 멜 칸과 파형 모양은 예시 그림입니다.`};
};
F.codec=()=>{
 const q=M.rvq(M.RVQ_SIGNAL,4),bm=M.codecBudget(12.5,8),be=M.codecBudget(75,8);let b=t(20,28,'잔차 벡터 양자화: 코드북마다 남은 오차를 다시 적는다',{a:'start',fill:Mu});
 q.errors.forEach((e,i)=>{const y=48+i*44,w=Math.max(4,Math.sqrt(e/q.errors[0])*200);b+=t(20,y+22,`코드북 ${i+1}`,{a:'start',size:14})+grow(110,y,w,28,i?B:A,i*.5)+t(110+w+8,y+20,`오차 ${e.toExponential(1)}`,{a:'start',size:13,fill:Mu});});
 b+=t(110,234,'막대 길이는 남은 오차의 제곱근 비율',{a:'start',size:13,fill:Mu});
 b+=box(420,48,200,90,A,'var(--chart)',10)+t(520,74,'Mimi 12.5 Hz × 8',{size:14,w:700})+t(520,100,`10초 = 토큰 ${bm.tokens}개`,{size:14,fill:A})+t(520,124,`${bm.kbps} kbps (1,024코드 가정)`,{size:13,fill:Mu});
 b+=box(420,154,200,90,O,'var(--chart)',10)+t(520,180,'EnCodec 75 Hz × 8',{size:14,w:700})+t(520,206,`10초 = 토큰 ${be.tokens}개`,{size:14,fill:O})+t(520,230,`${be.kbps} kbps`,{size:13,fill:Mu});
 for(let i=0;i<8;i++)b+=blink(`<rect x="${428+i*24}" y="258" width="20" height="20" rx="3" fill="${i?B:A}"/>`,i*.3);
 b+=t(520,296,'한 프레임의 토큰 8개 (첫째 = 의미)',{size:13,fill:Mu});
 return {svg:svg(`코드북 1~4를 거치며 오차가 줄고, 10초를 Mimi는 ${bm.tokens}개, EnCodec은 ${be.tokens}개 토큰으로 적는 그림`,b),caption:`잔차 오차는 장난감 RVQ(2비트 양자화기)로, 토큰 수와 비트레이트는 프레임 속도 × 코드북 수로 실제 계산했습니다. 칸이 차례로 켜지는 것은 깊이 방향으로 코드북을 예측하는 순서를 나타냅니다.`};
};
F.pipeline=()=>{
 const r=M.turnLatency({ttsAfter:1}),x=v=>30+v/1600*580,cols=[Mu,B,O,A,B,O,A,Mu];let b=t(20,28,`스트리밍 파이프라인 한 턴 · 합계 ${r.total} ms (원본 예산표)`,{a:'start',fill:Mu});
 let acc=0,i=0;const used=[];r.parts.forEach(([n,v],k)=>{if(v<=0)return;b+=grow(x(acc),48,Math.max(2,x(acc+v)-x(acc)-1),40,cols[k],i*.25);used.push([n,v,cols[k]]);acc+=v;i++;});
 b+=dot(x(0),68,x(r.total)-x(0),0,'var(--text)',0,6);
 [[230,'사람끼리 230',118,'start'],[500,'500 로봇 같음',138,'start'],[800,'800 목표',118,'start'],[1500,'1,500 고장',138,'end']].forEach(([v,l,y,a])=>{b+=`<path d="M${x(v)} 40V${y-12}" stroke="var(--line)" stroke-dasharray="4 4"/>`+t(a==='end'?x(v):x(v)+4,y,l,{a,size:13,fill:Mu});});
 used.forEach(([n,v,c],k)=>{const cx=30+(k%3)*200,cy=172+Math.floor(k/3)*34;b+=`<rect x="${cx}" y="${cy-13}" width="16" height="16" rx="3" fill="${c}"/>`+t(cx+24,cy,`${n} ${v} ms`,{a:'start',size:14});});
 b+=t(20,276,'2022년 일괄 처리 파이프라인은 약 2,500 ms였습니다',{a:'start',size:13,fill:O});
 return {svg:svg(`마이크 20, VAD 10, 인식 150, LLM 첫 토큰 100, TTS 100, 출력 20 ms를 이어 ${r.total} ms가 되는 막대와 230·500·800·1500 ms 기준선`,b),caption:`단계별 지연은 원본 레슨의 예산표이고 합 ${r.total} ms는 실제 계산입니다. 막대를 따라 움직이는 점은 한 턴의 시간이 흐르는 모습을 보여 주는 비유입니다.`};
};
F.turn=()=>{
 const h=M.hangoverRun([300,650],700),X=ms=>110+ms/4700*510;let b=t(20,28,'말차례 방식 (반이중) · 침묵 대기 700 ms + 흘려보내기',{a:'start',fill:Mu});
 const seg=(y,s,e,c,l)=>`<rect x="${X(s)}" y="${y}" width="${X(e)-X(s)}" height="30" rx="5" fill="${c}" opacity=".8"/>`+(l?t((X(s)+X(e))/2,y+20,l,{size:13,fill:'var(--bg)',w:700}):'');
 b+=t(20,66,'사용자',{a:'start',size:14})+seg(46,0,500,B,'솔아')+seg(46,800,1300,B,'음…')+seg(46,1950,3000,B,'타이머 오 분');
 b+=t(20,112,'솔이',{a:'start',size:14})+blink(`<rect x="${X(3000)}" y="92" width="${X(3000+h.latency)-X(3000)}" height="30" fill="${O}" opacity=".35"/>`,0)+seg(92,3000+h.latency,4650,A,'맞췄어요');
 b+=t(X(3000)+4,140,`대기 ${h.latency} ms`,{a:'start',size:13,fill:O});
 b+=t(20,184,'전이중 (Moshi) · 80 ms마다 듣고 말하기',{a:'start',fill:Mu});
 b+=t(20,222,'사용자',{a:'start',size:14})+seg(202,0,500,B,'솔아')+seg(202,800,1300,B,'음…')+seg(202,1950,3000,B,'타이머 오 분');
 b+=t(20,268,'모델',{a:'start',size:14})+blink(seg(248,1350,1600,A,'네'),.6)+seg(248,3200,3900,A,'맞췄어요');
 for(let k=0;k<6;k++)b+=dot(X(k*640),236,0,12,Mu,k*.4,3);
 b+=t(X(1475),296,'맞장구',{size:13,fill:A});
 return {svg:svg(`반이중 방식은 사용자의 말이 끝난 뒤 ${h.latency} ms를 기다렸다 답하고, 전이중 방식은 듣는 중에 맞장구를 치고 약 200 ms 뒤 답하는 그림`,b),caption:`위쪽 대기 ${h.latency} ms는 침묵 대기 700과 흘려보내기 125를 실제로 더한 값입니다. 아래 전이중 그림의 시점은 원본이 설명한 Moshi의 방식을 보여 주는 시나리오입니다.`};
};
F.safety=()=>{
 const w=M.watermark(.45),wc=M.watermark(.02);let b=t(20,28,'세 겹의 방어와 세 가지 공격',{a:'start',fill:Mu});
 const layers=[['위조 탐지','AASIST','합성 흔적 판정',B],['워터마크','AudioSeal','16비트 꺼내기',A],['출처 서명','C2PA','매니페스트 확인',O]];
 layers.forEach(([n,m,s,c],i)=>{const x=200+i*150;b+=box(x,50,130,200,c,'var(--chart)',10)+t(x+65,80,n,{w:700,size:14})+t(x+65,100,m,{size:13,fill:Mu})+t(x+65,236,s,{size:13,fill:Mu});});
 const attacks=[['다시 인코딩',[0,1,0]],['음높이 변경',[1,0,0]],['워터마크 없는 도구',[1,0,0]]];
 attacks.forEach(([n,stop],i)=>{const y=130+i*36;b+=t(20,y+5,n,{a:'start',size:14});const k=stop.indexOf(1),xs=200+k*150+65;b+=dot(150,y,xs-150,0,O,i*.5,6)+t(xs,y+5,'막음',{size:13,fill:'var(--text)',w:700});});
 b+=t(20,284,`워터마크 검출: 비트 복원율 0.98이면 ${(wc.detect*100).toFixed(1)}%, 0.55이면 ${(w.detect*100).toFixed(2)}% (16비트 중 14비트 기준)`,{a:'start',size:13,fill:Mu});
 return {svg:svg(`위조 탐지, 워터마크, 출처 서명 세 겹 중 다시 인코딩은 워터마크가, 음높이 변경과 워터마크 없는 도구는 위조 탐지가 막는 그림`,b),caption:`어느 방어가 어느 공격을 막는지는 원본 레슨의 설명을 옮긴 시나리오이고, 아래 줄의 검출 확률은 이항 분포로 실제 계산했습니다(비트 복원율 값은 가정).`};
};
F.final=()=>{
 const r=M.sliceWer([{share:90,wer:4},{share:10,wer:30}]);let b=t(20,28,'불만 → 지표 → 나눠 보기 → 다시 재기',{a:'start',fill:Mu});
 const cs=[['첫 소리 잘림','VAD 켜짐 시각'],['침묵 환각','삽입 오류 I'],['대답이 굼뜸','지연 P95'],['어르신 불만','집단별 WER']];
 cs.forEach(([a,m],i)=>{const y=46+i*50;b+=blink(box(20,y,170,40,O,'var(--chart)',8)+t(105,y+26,a,{size:14}),i*.6)+line(`M190 ${y+20}H230`,Mu)+blink(box(230,y,150,40,A,'var(--chart)',8)+t(305,y+26,m,{size:14}),i*.6+.3);});
 const bx=(v)=>v/32*140;[['일반 사용자',4,B],['어르신',30,O],['전체 평균',r.overall,A]].forEach(([n,v,c],i)=>{const y=60+i*58;b+=t(420,y,n,{a:'start',size:14})+grow(420,y+8,bx(v),24,c,i*.4)+t(420+bx(v)+6,y+27,`${v.toFixed(1)}%`,{a:'start',size:14,w:700,fill:c});});
 b+=t(420,250,'어르신 10%일 때 평균은',{a:'start',size:13,fill:Mu})+t(420,270,`${r.overall.toFixed(1)}%로 문제를 가립니다`,{a:'start',size:13,fill:Mu});
 return {svg:svg(`네 가지 불만이 각자 맞는 지표로 이어지고, 일반 4%와 어르신 30%의 WER이 평균 ${r.overall.toFixed(1)}%로 가려지는 그림`,b),caption:`집단별 WER(4%, 30%)은 가정값이고 가중 평균 ${r.overall.toFixed(1)}%는 실제 계산입니다. 불만과 지표를 잇는 상자가 차례로 켜지는 것은 진단 순서를 보여 주는 연출입니다.`};
};
function fallback(c){
 const steps=c.flow.map(x=>x.split('|')),n=steps.length,w=(600-(n-1)*20)/n,colors=[A,B,O,A];
 let b='';steps.forEach(([a,s],i)=>{const x=20+i*(w+20);b+=blink(box(x,90,w,110,colors[i%4]),i*.6)+t(x+w/2,140,a,{w:700})+t(x+w/2,168,s.length>14?s.slice(0,14)+'…':s,{size:13,fill:Mu});if(i<n-1)b+=line(`M${x+w} 145H${x+w+20}`)+dot(x+w-4,145,24,0,colors[i%4],i*.6,5);});
 return {svg:svg(`${c.title}의 흐름: ${steps.map(s=>s[0]).join(', ')}`,b),caption:`${c.subtitle}`};
}
function render(c){return F[c.id]?F[c.id](H):fallback(c);}
return {render,F,H};
})();
