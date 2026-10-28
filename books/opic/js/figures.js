/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 OText(js/opic.js)와 OSamples(js/samples.js)로 실제로 계산해 그린다.
   움직임은 style.css의 fig-* 애니메이션(fig-dash·fig-seq·fig-grow·fig-pulse)이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   네 덩어리(도입·세부·예·마무리)는 모든 그림에서 ob-* 색과 이름표로 같게 그린다. */
(function(root){
'use strict';
const T=root.OText,S=root.OSamples,U=root.OUI;
const svg=(label,body,h=250)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||14}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}${o.mono?' font-family="var(--font-mono)"':''}${o.en?' lang="en"':''}>${s}</text>`;
const box=(x,y,w,h,stroke='var(--line)',fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash',w=2)=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}"/>`;
const head=(x,y,ang,stroke)=>{const a=ang*Math.PI/180,p=s=>`${(x-9*Math.cos(a+s)).toFixed(1)} ${(y-9*Math.sin(a+s)).toFixed(1)}`;return `<path d="M${p(.45)}L${x} ${y}L${p(-.45)}" fill="none" stroke="${stroke}" stroke-width="2.4"/>`;};
const arrow=(x1,y1,x2,y2,stroke='var(--orange)')=>line(`M${x1} ${y1}L${x2} ${y2}`,stroke,'fig-dash',2.4)+head(x2,y2,Math.atan2(y2-y1,x2-x1)*180/Math.PI,stroke);
const seq=(body,delay)=>`<g class="fig-seq" style="animation-delay:${delay}s">${body}</g>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const grow=(x,y,w,h,fill,delay=0,cls='')=>`<rect class="fig-grow${cls?' '+cls:''}" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1).toFixed(1)}" height="${h}" rx="3" fill="${fill}"/>`;
const note=(s,y)=>t(320,y,s,{size:12,fill:'var(--muted)'});
const F={};

/* 1장: 40분을 15문항으로 나눈 띠. 문항마다 듣기 20초와 말하기 140초. */
F.test=()=>{const p=T.plan(4),L=T.layout(4),x0=20,w=600,unit=w/T.TEST_SECONDS;let body=t(20,26,'본 시험 40분(2,400초) · 자기 평가 4단계 · 15문항',{a:'start',w:700});
 for(let i=0;i<p.questions;i++){const x=x0+i*p.perQuestion*unit;body+=seq(grow(x,44,p.listenEach*unit,34,'var(--blue)',i*.08)+grow(x+p.listenEach*unit,44,p.speakEach*unit-2,34,'var(--accent)',i*.08+.04),i*.25);}
 body+=t(20,100,'■ 듣기 20초',{a:'start',size:12,fill:'var(--blue)'})+t(110,100,`■ 말하기 평균 ${p.speakEach}초`,{a:'start',size:12,fill:'var(--accent)'});
 L.forEach((g,k)=>{const xa=x0+(g.from-1)*p.perQuestion*unit,xb=x0+g.to*p.perQuestion*unit,y=128+(k%2)*40;body+=line(`M${xa+2} ${y}H${xb-2}`,'var(--line)','',2)+t((xa+xb)/2,y+18,`${g.name} ${g.from}~${g.to}`,{size:11.5});});
 const r=x0+7*p.perQuestion*unit;body+=line(`M${r} 38V214`,'var(--orange)')+t(r+6,230,'7번 뒤 난이도 재조정(보조 출처)',{a:'start',size:12,fill:'var(--orange)'});
 return {svg:svg(`40분을 15문항이 고르게 나눈 띠. 문항마다 듣기 20초와 말하기 140초. 아래 줄은 흔히 보고되는 문항 배치(자기소개 1, 설문 주제 2~4, 설문·돌발 5~10, 롤플레이 11~13, 비교·사회 이슈 14~15)이고, 7번 뒤에 난이도를 다시 고릅니다.`,body,240),caption:'40분을 15문항이 고르게 쓰면 문항마다 듣기 20초와 말하기 140초입니다. 아래 줄의 배치는 응시 정리들이 전하는 순서이며 공식 문서가 밝힌 것이 아닙니다.'};};

/* 2장: 글의 형태 네 계단과 공원 표본 넷의 글 모양 어림. */
F.levels=()=>{const steps=[['낱말·구','Novice'],['문장','Intermediate'],['문단','Advanced'],['확장 담화','Superior']];let body='';
 steps.forEach(([k,e],i)=>{const x=24+i*150,y=180-i*40;body+=seq(box(x,y,140,40+i*40,'var(--line)','var(--panel2)',6)+t(x+70,y+22,k,{w:700})+t(x+70,y+40,e,{size:12,fill:'var(--muted)',en:1}),i*.5);});
 S.PARK.forEach((p,i)=>{const s=T.shape(p.text),lv=s.level?1:0,x=s.level===3?300:24+lv*150+24+(s.level===2?56:0),y=180-lv*40-14;body+=pulse(x+8,y,9,i===3?'var(--orange)':'var(--accent)')+t(x+8,y+4,i+1,{size:11,w:700,mono:1});});
 body+=t(24,28,'ACTFL 글의 형태(Text Type) 네 계단과 공원 표본 1~4의 자리',{a:'start',w:700})+t(24,50,'고급(IH·AL 쪽)은 시간틀을 바꾸는 문단, 중급(IM 쪽)은 이어 만든 문장',{a:'start',size:12.5,fill:'var(--muted)'})+t(624,244,'표본 번호는 이 책의 글 모양 어림이며 등급이 아닙니다',{a:'end',size:12,fill:'var(--muted)'});
 return {svg:svg('글의 형태 네 계단(낱말·구, 문장, 문단, 확장 담화)과 공원 표본 넷의 자리. 표본 1은 낱말·구, 표본 2와 3은 문장 계단, 표본 4는 문장과 문단 사이에 놓입니다.',body,256),caption:'ACTFL 글의 형태 네 계단 위에 공원 표본 넷을 놓았습니다. 표본 4만 시간틀을 바꾸며 문단 쪽으로 다가갑니다.'};};

/* 3장: 묶어 고른 12개 항목이 이야기 묶음 4개로 모이는 그림. */
F.survey=()=>{const picked=S.SURVEY.filter(i=>S.SURVEY_PRESETS.tight.includes(i.id)),r=T.survey(S.SURVEY,S.SURVEY_PRESETS.tight),cy={};let body='';
 r.clusters.forEach((c,k)=>{cy[c]=56+k*48;body+=seq(box(450,cy[c]-18,160,36,'var(--accent)','var(--chart)',18)+t(530,cy[c]+5,`${c} 이야기`,{w:700}),1+k*.4);});
 picked.forEach((it,k)=>{const y=34+k*17.5;body+=t(150,y+4,`${it.name}`,{a:'end',size:12})+line(`M156 ${y}C300 ${y},300 ${cy[it.story]},448 ${cy[it.story]}`,'var(--muted)','fig-dash',1.4);});
 body+=t(20,20,`고른 항목 ${r.count}개`,{a:'start',w:700})+t(450,20,`준비할 이야기 ${r.stories}개`,{a:'start',w:700,fill:'var(--accent)'});
 return {svg:svg(`배경 설문에서 묶어 고른 항목 12개가 이야기 묶음 ${r.stories}개(${r.clusters.join(', ')})로 모입니다.`,body,250),caption:`같은 경험으로 답할 수 있는 항목을 함께 고르면 항목 12개가 이야기 ${r.stories}개로 모입니다. 묶음은 이 책이 민서의 생활에 맞춰 지어낸 분류입니다.`};};

/* 4장: 첫 답과 네 덩어리 답의 막대(1분에 60낱말). */
F.describe=()=>{const bar=(pick,y,label)=>{const parts=T.bankParts(S.BANK,pick),rows=T.BLOCKS.map(k=>({key:k,name:T.BLOCK_NAMES[k],seconds:T.secondsFor(T.words((parts[k]||[]).join(' ')),60),present:(parts[k]||[]).length>0}));return U.blocksBar(rows,{scale:100,width:640,y,h:38,label}).replace(/^<svg[^>]*>|<\/svg>$/g,'').replace('y="20"',`y="${y-12}"`);};
 const body=seq(bar(S.BANK_PRESETS.start,34,'민서의 첫 답'),0)+seq(bar(S.BANK_PRESETS.full,146,'네 덩어리를 채운 답'),1.2);
 return {svg:svg('민서의 첫 답(도입 5초, 세부 12초, 예 없음, 마무리 2초, 모두 19초)과 네 덩어리를 채운 답(모두 73초)을 1분에 60낱말로 계산한 막대.',body,240),caption:'첫 답은 세부만 나열하고 예 덩어리가 없습니다. 네 덩어리를 채우면 1분에 60낱말로 73초가 됩니다.'};};

/* 5장: 일과 여섯 단계를 잇는 순서 표현. */
F.routine=()=>{const keys=S.ROUTINE.map(r=>r[0]),text=T.routineText(S.ROUTINE,keys,'usually',true),lines=T.sentenceLines(text);let body=t(20,24,'On Saturday mornings, I usually …',{a:'start',w:700,en:1});
 lines.forEach((l,i)=>{const x=20+(i%3)*206,y=48+Math.floor(i/3)*96,m=l.trim().match(/^(Then|After that,|Next,|Finally,)/),word=m?m[1]:'usually';
  body+=seq(box(x,y,192,72,'var(--line)','var(--panel2)',8)+t(x+12,y+24,word,{a:'start',w:700,fill:'var(--orange)',en:1})+t(x+12,y+50,S.ROUTINE[i][1],{a:'start',size:12.5,en:1}),i*.5);
  if(i%3<2)body+=arrow(x+194,y+36,x+204,y+36);});
 return {svg:svg('민서의 토요일 아침 일과 여섯 단계. 첫 단계는 usually, 이어서 Then, After that, Next, Then, Finally로 순서를 알립니다.',body,250),caption:'현재 시제 동사에 빈도 표현 usually와 순서 표현을 붙여 여섯 단계를 잇습니다. 같은 순서 표현이 이어서 나오지 않게 바꿔 씁니다.'};};

/* 6장: 다섯 조각과 과거 표시 수. */
F.past=()=>{const now=T.timeFrames(T.storyText(S.STORY,[0,1,2,3,4],false)).past,then=T.timeFrames(T.storyText(S.STORY,[0,1,2,3,4],true)).past;let body='';
 S.STORY.forEach(([role,,p],i)=>{const x=14+i*126;body+=seq(box(x,40,112,60,i===2?'var(--orange)':'var(--line)','var(--panel2)',8)+t(x+56,66,role,{w:700})+t(x+56,88,p.split(' ').slice(0,3).join(' ')+'…',{size:11,en:1,fill:'var(--muted)'}),i*.45);if(i<4)body+=arrow(x+113,70,x+124,70);});
 body+=t(20,24,'경험 이야기의 다섯 조각 (제주 여행)',{a:'start',w:700})+grow(20,140,now*50,26,'var(--blue)',.2)+t(30+now*50,158,`현재형 동사: 과거 표시 ${now}개`,{a:'start',size:13})+grow(20,184,then*50,26,'var(--accent)',.6)+t(30+then*50,202,`과거형 동사: ${then}개`,{a:'start',size:13})+note('같은 순서라도 동사를 과거형으로 바꿔야 지난 일로 들립니다',240);
 return {svg:svg(`경험 이야기의 다섯 조각 배경·사건·문제·해결·느낌. 바른 순서에서 현재형 동사로 말하면 과거 시간틀 표시가 ${now}개, 과거형으로 말하면 ${then}개입니다.`,body,250),caption:`배경 → 사건 → 문제 → 해결 → 느낌. 문제 조각이 이야기를 만들고, 과거형 동사가 지난 일임을 알립니다. 과거 표시는 ${now}개에서 ${then}개로 늘어납니다.`};};

/* 7장: 축 × 시간틀 표. */
F.compare=()=>{const fr=[['과거','back then · used to'],['현재','these days · now'],['미래','will · going to']],ax=Object.keys(S.AXIS_NAMES);let body=t(20,24,'휴대폰 비교: 축 셋 × 시간틀 셋',{a:'start',w:700});
 fr.forEach(([n,e],j)=>{body+=t(220+j*140,52,n,{w:700})+t(220+j*140,70,e,{size:11,fill:'var(--muted)',en:1});});
 ax.forEach((a,i)=>{body+=t(80,112+i*50,S.AXIS_NAMES[a],{a:'middle',w:700});fr.forEach((_,j)=>{body+=seq(box(156+j*140,88+i*50,128,40,'var(--line)',j===1?'var(--chart)':'var(--panel2)',6)+t(220+j*140,113+i*50,'문장 1',{size:12,fill:'var(--muted)'}),j*1.2+i*.2);});});
 const s=T.shape(T.compareText(S.COMPARE.phone,ax,[0,1,2]));body+=note(`모두 켜면 문장 ${s.sentences}개·${s.words}낱말·시간틀 ${s.frames}개 → 글 모양 어림 “${s.name}”`,248);
 return {svg:svg(`휴대폰 비교 답을 생김새·하는 일·불편한 점 세 축과 과거·현재·미래 세 시간틀의 표로 짰습니다. 모두 쓰면 문장 ${s.sentences}개, ${s.words}낱말입니다.`,body,260),caption:'축마다 과거에서 현재, 현재에서 미래로 넘어갑니다. 시간틀을 바꿀 때 back then, these days, will 같은 표시를 먼저 말합니다.'};};

/* 8장: 질문 셋과 대안 둘. */
F.roleplay=()=>{const ask=[1,2,3].map(i=>S.ROLEPLAY.ask.lines[i]),solve=[1,2,3].map(i=>S.ROLEPLAY.solve.lines[i]),q=T.questionsCheck(ask),alt=T.alternatives(solve.join(' '));let body='';
 body+=t(20,24,'정보 묻기: 의문문 셋',{a:'start',w:700})+t(340,24,'문제 풀기: 사정 + 대안 둘',{a:'start',w:700});
 ask.forEach((l,i)=>{body+=seq(box(20,40+i*58,290,46,'var(--accent)','var(--chart)',16)+t(34,68+i*58,l.length>38?l.slice(0,37)+'…':l,{a:'start',size:12,en:1}),i*.6);});
 solve.forEach((l,i)=>{body+=seq(box(340,40+i*58,280,46,i?'var(--orange)':'var(--line)','var(--panel2)',16)+t(354,68+i*58,l.length>38?l.slice(0,37)+'…':l,{a:'start',size:12,en:1}),2+i*.6);});
 body+=note(`왼쪽: 질문 ${q.questions}개(종류 ${q.kinds.length}가지) · 오른쪽: 대안 문장 ${alt}개`,232);
 return {svg:svg(`롤플레이 두 상황. 헬스장에 묻는 의문문 ${q.questions}개(how, what, 예·아니오)와, 수업에 못 가는 사정 한 문장과 대안 ${alt}개.`,body,246),caption:`정보를 묻는 문항에서는 서로 다른 종류의 의문문 셋을, 문제를 푸는 문항에서는 사정 한 문장과 대안 둘을 냅니다.`};};

/* 9장: 이야기 세 개로 질문 여덟 개를 덮는 판. */
F.combo=()=>{const prep=S.REUSE_PRESETS.three,r=T.reuse(S.STORIES,S.QUESTIONS,prep),mark={fit:['✓','var(--accent)'],adapt:['△','var(--orange)'],none:['✕','var(--muted)']};let body=t(20,24,`준비한 이야기 ${prep.length}개(공원·집·제주)로 질문 8개 덮기`,{a:'start',w:700});
 r.rows.forEach((x,i)=>{const col=i%4,row=Math.floor(i/4),X=20+col*152,Y=44+row*96,[m,c]=mark[x.status];body+=seq(box(X,Y,140,84,c,'var(--panel2)',8)+t(X+14,Y+26,m,{a:'start',size:20,fill:c,w:700})+t(X+40,Y+24,`${x.q.kind} · ${({place:'묘사',routine:'습관',past:'경험',compare:'비교'})[x.q.use]}`,{a:'start',size:12})+t(X+14,Y+52,x.q.text.slice(0,22)+'…',{a:'start',size:11,en:1,fill:'var(--muted)'})+t(X+14,Y+72,x.status==='none'?'덮지 못함':x.status==='fit'?'그대로 씀':'쓰임만 바꿈',{a:'start',size:12,fill:c}),i*.3);});
 body+=note(`그대로 씀 ${r.fit} · 쓰임만 바꿈 ${r.adapt} · 덮지 못함 ${r.none}`,246);
 return {svg:svg(`이야기 세 개로 질문 여덟 개를 판정한 결과. 그대로 씀 ${r.fit}개, 쓰임만 바꿈 ${r.adapt}개, 덮지 못함 ${r.none}개.`,body,256),caption:'주제와 쓰임이 모두 맞으면 그대로, 쓰임만 맞으면 틀만 가져와 새 문장으로 말합니다. 질문과 이야기는 이 책이 지어낸 것입니다.'};};

/* 10장: 민서 첫 녹음의 말한 시간과 멈춘 시간, 40분 안의 배분. */
F.timing=()=>{const sec=80,words=58,pause=18,rate=T.wpm(words,sec),need=Math.round(rate*90/60),used=15*90+15*20,unit=560/sec;let body=t(20,24,`민서의 첫 녹음 ${sec}초 · ${words}낱말 · 1분에 ${rate.toFixed(1)}낱말`,{a:'start',w:700});
 body+=grow(20,40,(sec-pause)*unit,34,'var(--accent)',0)+grow(20+(sec-pause)*unit,40,pause*unit,34,'var(--orange)',.8)+t(30,62,`말함 ${sec-pause}초`,{a:'start',size:13,fill:'var(--bg)',w:700})+t(600,96,`멈춤 ${pause}초 (${Math.round(pause/sec*100)}%)`,{a:'end',size:13,fill:'var(--orange)'});
 body+=t(20,132,`1분 30초를 채우려면 약 ${need}낱말`,{a:'start',w:700})+t(20,174,`15문항 × (듣기 20초 + 말하기 90초) = ${U.clock(used)}`,{a:'start',size:13});
 const w=600/T.TEST_SECONDS;body+=box(20,186,600,26,'var(--line)','var(--panel2)',4)+grow(20,186,used*w,26,'var(--blue)',1.2)+t(20+used*w+6,204,`40분의 ${Math.round(used/T.TEST_SECONDS*100)}%`,{a:'start',size:12});
 return {svg:svg(`민서의 첫 녹음 80초 가운데 말한 시간 62초와 멈춘 시간 18초. 같은 속도로 1분 30초를 채우려면 약 ${need}낱말이 필요하고, 15문항을 1분 30초씩 답하면 40분의 69%를 씁니다.`,body,230),caption:`녹음 전체 속도와 멈춘 시간을 따로 봅니다. 민서는 같은 속도로 1분 30초를 채우려면 약 ${need}낱말이 필요합니다.`};};

/* 11장: 답 네 개 × 점검 다섯 가지, 첫 주와 고친 답. */
F.final=()=>{const checks=['길이','연결어','과거','시간틀','질문'],order=['length','link','past','frames','ask'];let body=t(20,22,'첫 주 녹음에서 처음 걸린 점검(●)과 고친 답(✓)',{a:'start',w:700});
 checks.forEach((c,j)=>{body+=t(250+j*76,48,c,{w:700,size:13});});
 S.ANSWERS.forEach((a,i)=>{const d=T.diagnose(a.before.text,a.before.seconds,a.target),e=T.diagnose(a.after.text,a.after.seconds,a.target),y=78+i*42,k=order.indexOf(d.fix);
  body+=t(20,y+5,a.q.length>30?a.q.slice(0,29)+'…':a.q,{a:'start',size:12,en:1});
  checks.forEach((_,j)=>{const x=250+j*76;body+=box(x-30,y-16,60,30,'var(--line)','var(--panel2)',6);if(j===k)body+=pulse(x,y-1,9,'var(--orange)')+t(x,y+4,'●',{fill:'var(--orange)'});});
  body+=seq(t(250+k*76+20,y+4,e.fix==='keep'?'✓':'',{fill:'var(--accent)',w:700,size:16}),1+i*.4);});
 return {svg:svg('민서의 첫 주 답 넷이 처음 걸린 점검: 집 묘사는 길이, 제주 여행은 과거 표시, 휴대폰 비교는 시간틀, 헬스장 롤플레이는 질문. 고친 답은 모두 다섯 점검을 넘습니다.',body,250),caption:'첫 주 답 넷은 서로 다른 점검에 걸립니다. 하나씩 고쳐 다시 녹음하면 무엇 때문에 나아졌는지 알 수 있습니다.'};};

root.OFigures={render:id=>F[id]?F[id]():null};
})(typeof window!=='undefined'?window:globalThis);
