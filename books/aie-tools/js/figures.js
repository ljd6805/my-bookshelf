/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A14Math로 계산한다. */
window.A14Figures=(()=>{
'use strict';
const M=A14Math;
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
const H={svg,t,box,line,dot,blink,turn,grow,pulse};
const F={};
const A='var(--accent)',B='var(--blue)',O='var(--orange)',G='var(--muted)';

F.loop=()=>{
 const r=M.fanout(3,500);
 let b=box(20,40,150,70,B)+t(95,70,'모델',{w:700})+t(95,94,'호출을 부탁',{size:13,fill:G});
 b+=box(245,40,150,70,A)+t(320,70,'호스트',{w:700})+t(320,94,'스키마 검사·실행',{size:13,fill:G});
 b+=box(470,40,150,70,O)+t(545,70,'notes_search',{w:700,size:14})+t(545,94,'실제 도구',{size:13,fill:G});
 b+=line('M170 62H245',B)+dot(176,62,64,0,B,0,5)+t(208,34,'call_1',{size:13,fill:B});
 b+=line('M395 75H470',A)+dot(401,75,64,0,A,.8,5);
 b+=line('M545 110V140H95V110',O)+dot(545,116,0,24,O,1.6,5)+t(320,134,'결과에 같은 id(call_1)를 붙여 돌려줌',{size:13,fill:O});
 const W=440/r.seqTotal,row=(y,label,total,segs)=>{let s=t(20,y+19,label,{a:'start',size:14,w:700});let x=110;segs.forEach(([w,c],i)=>{s+=grow(x,y,w*W,26,c,i*.25);x+=w*W;});return s+t(x+8,y+19,`${total} ms`,{a:'start',size:14,fill:A});};
 b+=t(20,178,'모델 왕복 500ms(가정), 도구 400·600·800ms일 때',{a:'start',size:13,fill:G});
 b+=row(192,'순차',r.seqTotal,[[500,B],[400,O],[500,B],[600,O],[500,B],[800,O],[500,B]]);
 b+=row(236,'병렬',r.parTotal,[[500,B],[800,O],[500,B]]);
 b+=t(20,288,`모델 왕복 ${r.turnsSeq}번 대 ${r.turnsPar}번 · 파란 칸은 모델, 주황 칸은 도구`,{a:'start',size:13,fill:G});
 return {svg:svg(`모델이 호출을 부탁하고 호스트가 검사해 실행한 뒤 같은 id로 결과를 돌려주며, 도구 셋을 순차로 부르면 ${r.seqTotal}ms, 병렬로 부르면 ${r.parTotal}ms가 걸리는 그림`,b),caption:`위쪽은 네 단계 고리이고 움직이는 점은 메시지의 길을 보여 주는 비유입니다. 아래 막대는 공식으로 실제 계산했으며, 모델 왕복 500ms는 교육용 가정값이고 도구 지연은 원본 레슨 03의 값입니다.`};
};
F.schema=()=>{
 let b=t(160,32,'모델이 고르는 근거',{w:700});
 b+=turn(box(20,50,280,88,O)+t(40,80,'manage_notes(action, …)',{a:'start',size:14,w:700})+t(40,108,'설명: 노트 관련 작업',{a:'start',size:13,fill:G})+t(40,128,'무엇을 언제 쓰는지 모호',{a:'start',size:13,fill:O}),0);
 b+=turn(box(20,50,280,88,A)+t(40,80,'notes_search(query, limit)',{a:'start',size:14,w:700})+t(40,108,'노트를 찾을 때 사용합니다.',{a:'start',size:13,fill:G})+t(40,128,'지우기에는 쓰지 않습니다.',{a:'start',size:13,fill:A}),1);
 b+=box(20,160,280,110,'var(--line)','var(--chart)',10)+t(40,188,'스키마 = 인자의 모양',{a:'start',size:14,w:700})+t(40,216,'query: string (필수)',{a:'start',size:13})+t(40,238,'limit: integer 1~20',{a:'start',size:13})+t(40,260,'sort: enum recent | relevance',{a:'start',size:13});
 const p=.85,ks=[1,2,3];b+=t(470,32,`검사 후 재시도 · 한 번에 통과 ${p}`,{w:700,size:14});
 ks.forEach((k,i)=>{const r=M.retryOdds(p,k),y=60+i*64;b+=t(340,y+22,`${k}번까지`,{a:'start',size:14})+box(420,y,180,32,'var(--line)','var(--panel2)',4)+grow(420,y,180*r.success,32,i===2?A:B,i*.4)+t(420,y+54,`실패 ${M.retryOdds(p,k).failPer1000.toFixed(1)} / 1,000`,{a:'start',size:13,fill:G});});
 b+=t(470,282,'시도는 서로 독립이라고 가정',{size:13,fill:G});
 return {svg:svg('모호한 만능 도구와 경계가 분명한 notes_search 설명을 번갈아 보이고, 통과 확률 0.85에서 재시도 횟수에 따라 끝내 실패하는 비율이 150, 22.5, 3.4로 줄어드는 그림',b),caption:'왼쪽 위는 이름과 설명이 모델의 선택을 돕는 경우와 방해하는 경우를 번갈아 보이는 예시이고, 오른쪽 막대는 시도마다 독립이라는 가정 아래 재시도 성공률을 실제로 계산한 값입니다.'};
};
F.envelope=()=>{
 const r=M.lifecycle('ok','http'),S=M.LIFE_STAGES;
 let b=box(20,30,250,240,B,'var(--chart)',12)+t(36,56,'요청 한 통(POST)',{a:'start',w:700});
 ['MCP-Protocol-Version 헤더','Mcp-Method: tools/call','"jsonrpc": "2.0", "id": 7','"method": "tools/call"','params._meta','  protocolVersion','  clientCapabilities','params.name·arguments'].forEach((s,i)=>{b+=blink(t(36,86+i*24,s,{a:'start',size:13,fill:i<2?O:i>=4&&i<7?A:'var(--text)'}),i*.25);});
 S.forEach((s,i)=>{const y=34+i*34;b+=box(330,y,290,28,i===6?A:'var(--line)','var(--panel2)',6)+t(344,y+19,`${i+1} ${s}`,{a:'start',size:13})+blink(t(606,y+19,'통과',{a:'end',size:13,w:700,fill:A}),i*.5);});
 b+=line('M270 150H330',B)+dot(276,150,48,0,B,0,5)+dot(318,40,0,210,A,.3,5);
 b+=t(475,288,`응답: HTTP ${r.out.http} · resultType ${r.out.result}`,{size:13,fill:A});
 return {svg:svg('버전과 기능을 담은 요청 한 통이 JSON-RPC 봉투부터 핸들러 실행까지 일곱 검사를 차례로 통과해 HTTP 200과 complete로 답하는 그림',b),caption:'MCP 2026-07-28에서는 핸드셰이크 없이 요청마다 버전과 기능을 싣고 서버가 정해진 순서로 검사합니다. 검사 순서와 결과는 원본 레슨 06·07·09의 규칙을 실제로 계산한 것이고, 움직이는 점은 요청의 진행을 보여 주는 비유입니다.'};
};
F.client=()=>{
 let b=box(20,100,140,100,A,'var(--chart)',12)+t(90,135,'노트 비서',{w:700})+t(90,160,'클라이언트',{size:13,fill:G})+t(90,182,'서버마다 장부',{size:13,fill:G});
 b+=box(450,30,170,100,B)+t(535,60,'notes 서버',{w:700})+t(535,88,'search',{size:14,fill:B})+t(535,112,'export',{size:14,fill:B});
 b+=box(450,170,170,100,O)+t(535,200,'tasks 서버',{w:700})+t(535,228,'search',{size:14,fill:O})+t(535,252,'create',{size:14,fill:O});
 b+=box(200,80,200,140,'var(--line)','var(--panel2)',10)+t(300,106,'모델이 보는 이름',{size:13,fill:G});
 b+=turn(t(300,146,'search ?',{size:18,w:700,fill:O})+t(300,178,'이름이 겹침',{size:13,fill:O}),0);
 b+=turn(t(300,140,'notes.search',{size:15,w:700,fill:B})+t(300,166,'tasks.search',{size:15,w:700,fill:O})+t(300,194,'이름공간 정책',{size:13,fill:A}),1);
 b+=turn(t(300,140,'notes.search',{size:15,w:700,fill:B})+t(300,166,'→ notes 서버로',{size:13,fill:G})+t(300,194,'원래 이름 search',{size:13,fill:G}),2);
 b+=line('M160 150H200',A)+line('M400 130L450 80',B)+line('M400 170L450 220',O)+dot(406,126,40,-40,B,.5,5);
 b+=t(320,290,'원격 서버는 POST 엔드포인트 하나만 엽니다',{size:13,fill:G});
 return {svg:svg('두 서버가 모두 search를 내놓으면 클라이언트가 notes.search와 tasks.search로 이름공간을 붙여 구분하고, 고른 이름을 원래 서버의 원래 이름으로 되돌려 보내는 그림',b),caption:'이름 충돌은 프로토콜이 아니라 클라이언트의 병합 정책으로 풉니다. 서버와 도구 이름은 이 책의 노트 비서 예시이며 그림은 시나리오입니다.'};
};
F.context=()=>{
 const cols=[['tools','행동','모델이 고름',B],['resources','URI로 읽을거리','앱이 고름',A],['prompts','틀','사용자가 고름',O]];
 let b='';cols.forEach(([n,d,w,c],i)=>{const x=20+i*205;b+=blink(box(x,24,190,84,c)+t(x+95,52,n,{w:700})+t(x+95,76,d,{size:13})+t(x+95,98,w,{size:13,fill:G}),i*.6);});
 b+=t(20,140,'같은 notes://inbox, 사용자마다 다른 내용',{a:'start',size:14,w:700});
 const pub=M.cacheRun('public',30),pri=M.cacheRun('private',30);
 [['cacheScope public',pub,O],['cacheScope private',pri,A]].forEach(([n,r,c],k)=>{const y=160+k*62;b+=t(20,y+20,n,{a:'start',size:13,fill:c,w:700});
  r.rows.forEach((x,i)=>{const cx=200+i*52,col=x.kind==='leak'?O:x.kind==='hit'?A:G;b+=blink(`<circle cx="${cx}" cy="${y+14}" r="15" fill="var(--panel2)" stroke="${col}" stroke-width="2"/>`+t(cx,y+19,x.u.slice(0,1),{size:13,fill:col}),i*.3);});
  b+=t(200,y+50,`적중 ${r.hits} · 남의 내용 ${r.leaks}`,{a:'start',size:13,fill:c});});
 b+=pulse(252,174,18,O);
 return {svg:svg(`도구·자원·프롬프트를 누가 고르는지 나누고, ttlMs 30초에서 공유 캐시는 남의 내용을 ${pub.leaks}번 보여 주고 사용자별 캐시는 0번 보여 주는 그림`,b),caption:`위쪽은 세 기본 요소의 역할 분담이고, 아래 원은 지우와 민호가 번갈아 읽는 여덟 요청입니다. 요청 순서는 미리 정한 시나리오이고, 적중과 누출 수는 캐시 규칙으로 실제 계산했습니다.`};
};
F.mrtr=()=>{
 const X=[90,550],rows=[['tools/call id 11 · “TPS 보고서 지워 줘”',0,1,B],['input_required · 후보 3개 + requestState',1,0,O],['사용자: 2번 노트 선택',null,null,A],['tools/call id 12 · 같은 요청 + 응답 + requestState',0,1,B],['complete · 노트 1개 삭제',1,0,A]];
 let b=box(20,20,140,40,B)+t(90,46,'클라이언트',{w:700})+box(480,20,140,40,O)+t(550,46,'서버',{w:700})+`<path d="M90 60V290M550 60V290" stroke="var(--line)" stroke-width="2" stroke-dasharray="4 4"/>`;
 rows.forEach(([s,from,to,c],i)=>{const y=86+i*44;
  if(from===null){b+=blink(box(30,y-18,120,30,c)+t(90,y+2,'사람이 고름',{size:13,fill:c}),i*.8);b+=t(170,y+2,s,{a:'start',size:13,fill:G});return;}
  const x1=X[from],x2=X[to];b+=blink(`<path d="M${x1} ${y}H${x2}" stroke="${c}" stroke-width="2"/>`+t(320,y-8,s,{size:13,fill:c}),i*.8)+dot(x1,y,x2-x1,0,c,i*.8,5);});
 return {svg:svg('클라이언트가 tools/call을 보내면 서버가 input_required와 서명된 requestState로 답하고, 사람이 고른 뒤 클라이언트가 새 id로 같은 요청을 다시 보내 complete를 받는 순서 그림',b),caption:'서버는 클라이언트에게 요청을 보내지 않고 결과로 되묻습니다. 메시지 순서는 원본 레슨 11·12의 규칙을 따른 시나리오이고, 점의 움직임은 메시지 방향을 보여 주는 비유입니다.'};
};
F.tasks=()=>{
 const st=[['working',B],['input_required',O],['working',B],['completed',A]];
 let b=t(20,30,'작업 핸들 task_42의 상태(같은 저장소에서 읽음)',{a:'start',size:14,w:700});
 st.forEach(([s,c],i)=>{const x=20+i*155;b+=blink(box(x,44,140,46,c)+t(x+70,73,s,{size:14,w:700,fill:c}),i*.8);if(i<3)b+=line(`M${x+140} 67H${x+155}`,G);});
 b+=t(20,116,'tasks/get으로 묻고, tasks/update로 답하고, tasks/cancel로 멈춥니다',{a:'start',size:13,fill:G});
 const sc=[[400,1500],[400,2500],[600,1500]],sx=x=>170+x*0.19;
 b+=t(20,150,'두 시계: 유휴 500ms · 최대 2000ms',{a:'start',size:14,w:700});
 sc.forEach(([iv,work],i)=>{const r=M.deadline(iv,work),y=168+i*40,c=r.outcome==='complete'?A:O;
  b+=t(20,y+18,`알림 ${iv} · 일 ${work}`,{a:'start',size:13});
  b+=grow(sx(0),y+4,r.at*0.19,18,c,i*.4);for(let p=iv;p<Math.min(work,r.at+1);p+=iv)b+=`<path d="M${sx(p)} ${y}V${y+26}" stroke="var(--text)" stroke-width="2"/>`;
  b+=t(sx(r.at)+8,y+18,r.outcome==='complete'?'완료':r.outcome==='max'?'최대 시계':'유휴 시계',{a:'start',size:13,w:700,fill:c});});
 b+=`<path class="fig-dash" d="M${sx(2000)} 160V290" stroke="${O}" stroke-width="2"/>`+t(sx(2000)-4,292,'2000ms',{a:'end',size:13,fill:O});
 return {svg:svg('작업 핸들이 working, input_required, working, completed로 바뀌고, 아래에서는 진행 알림 간격과 작업 길이에 따라 완료, 최대 시계 취소, 유휴 시계 취소가 갈리는 그림',b),caption:'위쪽 상태 변화는 Tasks 확장의 규칙을 따른 시나리오입니다. 아래 막대 셋은 유휴 500ms와 최대 2000ms 규칙으로 실제 계산했으며, 세로 눈금은 진행 알림이 도착한 시각입니다.'};
};
F.poison=()=>{
 const ok=M.admitDescriptor('ok'),rug=M.admitDescriptor('rugpull');
 let b=box(20,30,200,110,A)+t(120,58,'어제 승인한 export',{w:700,size:14})+t(120,86,'note_id 하나',{size:13,fill:G})+t(120,118,`고정값 ${ok.pin}`,{size:14,fill:A});
 b+=box(20,170,200,110,O)+t(120,198,'오늘 받은 export',{w:700,size:14})+t(120,226,'note_id + recipient',{size:13,fill:O})+t(120,258,`다이제스트 ${rug.digest}`,{size:14,fill:O});
 b+=box(270,100,130,80,'var(--line)','var(--panel2)',10)+t(335,132,'키 정렬 JSON',{size:13})+t(335,156,'→ 해시',{size:13,fill:G});
 b+=line('M220 85L270 125',A)+line('M220 225L270 160',O)+dot(226,225,40,-60,O,.4,5)+line('M400 140H440',G);
 b+=box(440,40,180,90,'var(--line)','var(--chart)',10)+t(530,70,'설명 스캐너',{size:14,w:700})+t(530,100,`경고 ${rug.scanner}건`,{size:14,fill:G});
 b+=box(440,150,180,110,O,'var(--chart)',10)+t(530,180,'고정값과 비교',{size:14,w:700})+blink(t(530,212,'다름 → 격리',{size:17,w:700,fill:O}),.8)+t(530,240,'다시 승인할 때까지',{size:13,fill:G});
 return {svg:svg(`설명은 그대로이고 스키마에 recipient 필드만 늘어난 export 서술자가 스캐너 경고 ${rug.scanner}건으로 통과하지만, 고정값 ${ok.pin}과 다이제스트 ${rug.digest}가 달라 격리되는 그림`,b),caption:'서술자 전체를 키 정렬 JSON으로 만들어 해시하면 설명에 드러나지 않는 스키마 변경도 잡힙니다. 해시는 브라우저에서 실제로 계산했지만, 원본의 SHA-256 대신 짧은 교육용 FNV-1a 32비트를 썼습니다.'};
};
F.auth=()=>{
 const ok=M.checkToken('valid','notes_search'),bad=M.checkToken('wrongAud','notes_search');
 let b=box(20,90,170,120,B,'var(--chart)',12)+t(105,118,'액세스 토큰',{w:700})+t(36,146,'iss auth.example.com',{a:'start',size:13})+t(36,168,'aud notes…/mcp',{a:'start',size:13,fill:A})+t(36,190,'scope notes:read',{a:'start',size:13});
 b+=box(420,30,200,100,A)+t(520,60,'노트 서버',{w:700})+t(520,88,'aud 일치',{size:13,fill:G})+t(520,114,`HTTP ${ok.status} 통과`,{size:15,w:700,fill:A});
 b+=box(420,170,200,100,O)+t(520,200,'할 일 서버',{w:700})+t(520,228,'aud가 내 주소가 아님',{size:13,fill:G})+t(520,254,`HTTP ${bad.status} ${bad.error}`,{size:14,w:700,fill:O});
 b+=line('M190 130L420 80',A)+dot(196,128,218,-46,A,0,6)+line('M190 170L420 220',O)+dot(196,172,218,46,O,1.2,6)+pulse(420,220,10,O);
 b+=t(300,290,'자원 서버는 요청마다 kid·서명·iss·aud·exp·scope를 확인',{size:13,fill:G});
 return {svg:svg(`노트 서버를 대상으로 발급된 토큰은 노트 서버에서 ${ok.status}으로 통과하고, 할 일 서버에 내밀면 대상 불일치로 ${bad.status}을 받는 그림`,b),caption:'대상(aud) 주장 덕분에 한 서버의 토큰을 다른 서버가 받아 주지 않습니다. 통과와 거절은 원본 레슨 16·18의 검사 순서를 실제로 계산한 결과이고, 주소는 예시입니다.'};
};
F.gateway=()=>{
 const w=M.traceSpans('warm',true),c=M.traceSpans('cold',true),sc=480/c.total;
 let b=t(20,30,'같은 질문, 다른 날의 트레이스',{a:'start',size:14,w:700});
 [['평소',w,0],['느린 날',c,1]].forEach(([n,r,k])=>{const y0=52+k*120;b+=t(20,y0+12,`${n} · 전체 ${r.total.toLocaleString('en-US')} ms`,{a:'start',size:14,w:700,fill:k?O:A});
  r.spans.forEach((s,i)=>{const y=y0+22+i*22,x=130+s.start*sc;b+=t(124,y+14,['llm 고르기','tool','mcp.call','llm 답하기'][i],{a:'end',size:13,fill:G})+grow(x,y,Math.max(2,s.dur*sc),16,s.depth===2?O:B,i*.3);});});
 b+=pulse(130+1220*sc+(c.mcp*sc)/2,240,16,O)+t(620,292,`콜드 스타트 mcp.call ${c.mcp.toLocaleString('en-US')} ms가 ${Math.round(c.share*100)}%`,{a:'end',size:13,fill:O});
 return {svg:svg(`평소 ${w.total}ms인 트레이스와 MCP 서버 콜드 스타트로 ${c.total}ms가 된 트레이스를 스팬 폭포로 비교해 mcp.call 스팬이 대부분을 차지함을 보이는 그림`,b),caption:'트레이스 문맥이 모든 홉에 전파되면 느린 홉이 한 줄에 드러납니다. 스팬 지연은 원본 레슨 20의 “3초와 30초” 사례를 본뜬 교육용 가정값이고, 합계와 비율은 그 값으로 실제 계산했습니다.'};
};
F.skills=()=>{
 const r=M.disclosure(50,200000);
 const tiers=[['1 목록','이름+설명 · 약 100토큰씩',`${r.catalog.toLocaleString('en-US')}토큰(50개)`,B],['2 본문','고른 스킬의 SKILL.md','3,000토큰(가정)',A],['3 참고 파일','필요할 때만 읽기','1,500토큰(가정)',O]];
 let b='';tiers.forEach(([n,d,v,c],i)=>{const y=30+i*78;b+=blink(box(20,y,330,64,c)+t(36,y+26,n,{a:'start',w:700})+t(36,y+50,d,{a:'start',size:13,fill:G})+t(338,y+26,v,{a:'end',size:13,fill:c}),i*.7);});
 b+=dot(185,94,0,56,A,.7,5)+dot(185,172,0,56,O,1.4,5);
 const sx=220/r.eager;b+=t(510,40,'200k 창에 올리는 토큰',{size:14,w:700});
 b+=t(400,84,'모두 올림',{a:'start',size:13})+grow(400,92,r.eager*sx,26,O,0)+t(400,140,`${r.eager.toLocaleString('en-US')} (${Math.round(r.eagerShare*100)}%)`,{a:'start',size:13,fill:O});
 b+=t(400,180,'점진 공개',{a:'start',size:13})+grow(400,188,Math.max(3,r.progressive*sx),26,A,.5)+t(400,236,`${r.progressive.toLocaleString('en-US')} (${(r.progShare*100).toFixed(2)}%)`,{a:'start',size:13,fill:A});
 b+=t(510,282,`목록 예산 2%에는 ${r.fits}개까지`,{size:13,fill:G});
 return {svg:svg(`스킬 50개를 세 단계로 공개하면 목록 ${r.catalog}토큰과 본문 하나, 참고 파일 하나로 ${r.progressive}토큰만 쓰고, 모두 올리면 ${r.eager}토큰을 쓰는 그림`,b),caption:'목록 항목 약 100토큰은 Agent Skills 명세의 어림값이고 본문과 참고 파일 토큰은 교육용 가정값입니다. 막대 길이와 비율은 그 값으로 실제 계산했고, 내려가는 점은 필요할 때만 다음 단계를 읽는다는 비유입니다.'};
};
F.final=()=>{
 const reps=[['confirm','확인 없이 지움'],['proxy500','프록시 뒤에서만 500'],['crossToken','다른 서버 토큰이 통함'],['slow','어떤 날만 30초'],['double','보고서가 두 번 생김']];
 let b=t(20,30,'이상 보고',{a:'start',size:14,w:700})+t(620,30,'선 위부터 · 시간부터(분)',{a:'end',size:14,w:700});
 reps.forEach(([k,s],i)=>{const y=48+i*48,a=M.triage(k,'wire'),c=M.triage(k,'time'),best=a.minutes<=c.minutes;
  b+=blink(box(20,y,250,38,'var(--line)')+t(34,y+25,s,{a:'start',size:14}),i*.5);
  b+=t(300,y+25,M.CHECKS[a.root][0].replace(/\(.*\)/,''),{a:'start',size:13,fill:G});
  b+=blink(t(560,y+25,String(a.minutes),{a:'end',size:15,w:700,fill:best?A:O})+t(612,y+25,String(c.minutes),{a:'end',size:15,w:700,fill:best?O:A}),i*.5+.3);});
 b+=t(20,296,'점검 시간과 원인은 미리 정한 시나리오입니다',{a:'start',size:13,fill:G});
 return {svg:svg('다섯 가지 이상 보고마다 원인이 드러나는 점검과, 선 위 기록부터 볼 때와 시간부터 볼 때 걸리는 분을 비교하는 그림',b),caption:'보고마다 원인이 숨은 계약이 다르므로 확인 순서에 따라 걸리는 시간이 달라집니다. 점검별 시간과 원인 배정은 시나리오이고, 누적 분은 그 값으로 실제 계산했습니다.'};
};
/* 기본 그림: flow 단계를 상자로 놓고 점이 차례로 지나간다. */
function fallback(c){
 const steps=c.flow.map(x=>x.split('|')),n=steps.length,w=(600-(n-1)*20)/n,colors=[A,B,O,A];
 let b='';steps.forEach(([a,s],i)=>{const x=20+i*(w+20);b+=blink(box(x,90,w,110,colors[i%4]),i*.6)+t(x+w/2,140,a,{w:700})+t(x+w/2,168,s.length>14?s.slice(0,14)+'…':s,{size:13,fill:G});if(i<n-1)b+=line(`M${x+w} 145H${x+w+20}`)+dot(x+w-4,145,24,0,colors[i%4],i*.6,5);});
 return {svg:svg(`${c.title}의 흐름: ${steps.map(s=>s[0]).join(', ')}`,b),caption:`${c.subtitle}`};
}
function render(c){return F[c.id]?F[c.id](H):fallback(c);}
return {render,F,H};
})();
