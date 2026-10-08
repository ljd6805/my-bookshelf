/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A15Math로 계산한다. */
window.A15Figures=(()=>{
'use strict';
const M=A15Math;
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
const A='var(--accent)',B='var(--blue)',O='var(--orange)',MU='var(--muted)';
const F={};

F.loop=()=>{
 const ok=M.agentLoop('normal',6),st=M.agentLoop('stuck',6),pos=[[40,40,'생각','다음에 알 것'],[210,40,'행동','search_logs(…)'],[210,180,'관찰','5xx 15분째 급증'],[40,180,'판단','끝낼까, 더 돌까']];
 let b='';pos.forEach(([x,y,a,s],i)=>{b+=blink(box(x,y,140,70,[A,B,O,A][i])+t(x+70,y+30,a,{w:700})+t(x+70,y+54,s,{size:13,fill:MU}),i*1.2);});
 b+=line('M180 75H210')+line('M280 110V180')+line('M210 215H180')+line('M110 180V110');
 b+=dot(180,75,30,0,A,0)+dot(280,110,0,70,B,1.2)+dot(210,215,-30,0,O,2.4)+dot(110,180,0,-70,A,3.6);
 b+=box(390,30,230,240,'var(--line)','var(--chart)')+t(505,58,'턴 예산 6',{w:700});
 const row=(y,label,n,stop,c)=>t(405,y,label,{a:'start',size:14})+[...Array(6)].map((_,k)=>`<rect x="${405+k*34}" y="${y+10}" width="28" height="26" rx="4" fill="${k<n?c:'var(--panel2)'}" stroke="var(--line)"/>`).join('')+t(405,y+58,stop,{a:'start',size:13,fill:c});
 b+=row(90,'정상 대본',ok.turns.length,`${ok.turns.length}턴에 finish로 종료`,A)+row(175,'같은 행동 반복',st.turns.length,`${st.turns.length}턴 예산에 걸려 멈춤`,O);
 return {svg:svg(`생각, 행동, 관찰, 판단이 고리처럼 이어지고, 정상 대본은 ${ok.turns.length}턴에 끝나며 같은 행동을 반복하는 대본은 턴 예산 ${st.turns.length}에서 멈추는 그림`,b),caption:`에이전트는 생각·행동·관찰·판단을 되풀이하는 반복문입니다. 오른쪽 턴 수는 실험과 같은 대본을 실제로 돌려 센 값이고, 고리를 도는 점은 순서를 보여 주는 시각적 비유입니다.`};
};
F.plan=()=>{
 const r=M.tokenCost(8),P=600,s=150,max=1800,h=v=>v/max*110;
 const react=[...Array(9)].map((_,i)=>P+s*i),rewoo=[P,...Array(8).fill(80),P+800];
 let b=t(20,30,'단계 8개를 풀 때 호출마다 싣는 입력 토큰',{a:'start',size:14,fill:MU});
 const draw=(vals,y0,c,label,total)=>t(20,y0-70,label,{a:'start',w:700})+t(20,y0-44,`합계 ${total.toLocaleString('en-US')}`,{a:'start',fill:c,w:700})+vals.map((v,i)=>grow(170+i*44,y0-h(v),30,h(v),c,i*.15)).join('')+`<path d="M160 ${y0}H630" stroke="var(--line)"/>`;
 b+=draw(react,150,O,'ReAct',r.react)+draw(rewoo,280,A,'ReWOO',r.rewoo);
 b+=t(20,146,'기록이 쌓임',{a:'start',size:13,fill:MU})+t(20,276,'계획·작업자·풀이',{a:'start',size:13,fill:MU});
 return {svg:svg(`단계가 8개일 때 ReAct는 호출마다 입력이 커져 합계 ${r.react} 토큰, ReWOO는 계획과 짧은 작업자 호출로 합계 ${r.rewoo} 토큰인 그림`,b),caption:`ReAct는 호출할 때마다 쌓인 기록을 다시 싣고, ReWOO는 계획 한 번과 짧은 작업자 호출로 끝냅니다. 합계는 실험과 같은 식으로 계산했으며 프롬프트 길이 600, 기록 150 같은 토큰 수는 교육용 가정값입니다.`};
};
F.refine=()=>{
 const r=M.reflexion('scalar',3),notes=['배포 기록을 먼저 보지 않음','오류율 상승 시각을 확인 안 함'];
 let b='';
 r.rows.forEach((x,i)=>{const X=30+i*205;b+=blink(box(X,40,180,92,i===2?A:O)+t(X+90,70,`시도 ${x.trial}`,{w:700})+t(X+90,96,`성공 확률 ${Math.round(x.p*100)}%`,{size:14})+t(X+90,120,i<2?'외부 판정: 실패':'외부 판정: 성공',{size:13,fill:i<2?O:A}),i*1.4);
  if(i<2){b+=line(`M${X+90} 132V170H${X+295}V132`,B)+dot(X+90,170,205,0,B,i*1.4+.6,5)+t(X+192,192,`반성: ${notes[i]}`,{size:13,fill:B});}});
 b+=t(30,232,'누적 성공 확률',{a:'start',size:14,fill:MU});
 b+=`<rect x="170" y="244" width="440" height="22" rx="4" fill="var(--panel2)"/>`+r.rows.map((x,i)=>grow(170,244,x.cumulative*440,22,[O,B,A][i],i*1.4)).join('')+t(610,286,`3회 뒤 ${Math.round(r.final*1000)/10}%`,{a:'end',size:14,w:700});
 return {svg:svg(`외부 판정이 실패를 알려 주면 반성 문장이 다음 시도로 넘어가고, 시도 세 번 뒤 누적 성공 확률이 ${Math.round(r.final*100)}%가 되는 그림`,b),caption:`실패할 때마다 한 줄 반성이 일화 기억에 쌓여 다음 시도로 넘어갑니다. 확률은 실험과 같은 시나리오 모형(처음 30%, 시도마다 20%p 상승)으로 계산했고, 반성 문장은 당직 도우미 사례로 지은 예입니다.`};
};
F.memory=()=>{
 const w=M.memoryRecall(4,'window'),p=M.memoryRecall(4,'paging'),facts=['경보 채널','담당 결제팀','14:02 배포','오류율 12%','캐시 변경','DB 정상','승인 필요'];
 let b=t(20,28,'주 문맥 4칸 (램)',{a:'start',w:700})+t(20,200,'외부 기억 (디스크)',{a:'start',w:700});
 for(let k=0;k<4;k++)b+=box(20+k*120,44,108,50,A);
 for(let f=0;f<4;f++)b+=turn(facts.slice(f,f+4).map((x,k)=>t(74+k*120,75,x,{size:14,fill:k===3?A:'var(--text)'})).join('')+t(255,118,`${f+4}번째 사실이 들어온 뒤`,{size:13,fill:MU}),f);
 b+=line('M74 94V210',O)+dot(74,100,0,105,O,0,5)+t(90,150,'밀려남',{a:'start',size:13,fill:O});
 b+=box(20,214,470,58,B,'var(--chart)')+t(255,248,'archival_memory_insert · 세션·턴 번호와 함께',{size:13,fill:MU});
 b+=line('M450 214V100',B)+dot(450,205,0,-100,B,1.2,5)+t(462,160,'검색',{a:'start',size:13,fill:B});
 b+=box(512,44,118,228,'var(--line)','var(--chart)')+t(571,76,'질문 6개',{w:700})+t(571,116,'창만',{size:14,fill:MU})+t(571,140,`${w.answered}개 답`,{size:15,fill:O,w:700})+t(571,186,'창+검색',{size:14,fill:MU})+t(571,210,`${p.answered}개 답`,{size:15,fill:A,w:700})+t(571,234,`검색 ${p.calls}회`,{size:13,fill:B});
 return {svg:svg(`주 문맥 4칸에서 밀려난 사실이 외부 기억으로 내려가고 검색으로 다시 올라오며, 창만 쓰면 질문 6개 중 ${w.answered}개, 검색을 더하면 ${p.answered}개에 답하는 그림`,b),caption:`주 문맥은 램처럼 작고 외부 기억은 디스크처럼 큽니다. 오른쪽 답한 질문 수와 검색 횟수는 실험과 같은 규칙(오래된 것부터 밀려남)으로 계산했고, 칸을 바꾸는 사실 이름은 순서를 보여 주는 예입니다.`};
};
F.patterns=()=>{
 const rows=M.patternCost(3),max=Math.max(...rows.map(r=>r.seconds));
 let b=t(20,28,'로그 원천 3개 · 호출 1회 2초 가정',{a:'start',size:14,fill:MU})+t(360,28,'기다리는 시간',{a:'start',size:14,fill:MU});
 rows.forEach((r,i)=>{const y=50+i*48;b+=t(20,y+22,r.name,{a:'start',size:14})+t(250,y+22,`호출 ${r.calls}`,{a:'end',size:14,fill:B});
  b+=`<rect x="270" y="${y+6}" width="300" height="22" rx="4" fill="var(--panel2)"/>`+grow(270,y+6,r.seconds/max*300,22,r.id==='parallel'?A:O,i*.3)+t(630,y+22,`${r.seconds}초`,{a:'end',size:14,w:700});});
 b+=pulse(420,163,15,A);
 return {svg:svg(`로그 원천 3개를 다룰 때 다섯 워크플로 패턴의 호출 수와 기다리는 시간. 병렬화는 호출 ${rows[2].calls}번이지만 ${rows[2].seconds}초로 가장 짧은 그림`,b),caption:`병렬화는 프롬프트 연결과 호출 수가 같아도 동시에 돌아 기다리는 시간이 짧습니다. 호출 수와 시간은 실험과 같은 교육용 모형(호출 1회 2초, 평가자-최적화 2회 반복)으로 계산했습니다.`};
};
F.runtime=()=>{
 const sc=600/1600,X=20,cols=[MU,B,A,O,'var(--text)'];let b=t(20,28,'사람이 말을 마친 뒤 첫 음성까지 (LLM 첫 토큰 300ms)',{a:'start',size:14,fill:MU});
 [[600,'최상급 ≤600'],[1200,'흔함 ≤1200'],[1500,'고장 느낌 >1500']].forEach(([v,l])=>{b+=`<path d="M${X+v*sc} 48V194" stroke="var(--line)" stroke-dasharray="4 4"/>`+t(X+v*sc,262,l,{size:13,fill:MU});});
 ['fast','slow'].forEach((k,j)=>{const r=M.voiceLatency(300,k),y=72+j*78;let x=X;b+=t(X,y-8,k==='fast'?`빠른 구성 · 합계 ${r.total}ms`:`느린 구성 · 합계 ${r.total}ms`,{a:'start',size:14,w:700});
  r.parts.forEach(([n,v],i)=>{b+=grow(x,y,v*sc,30,cols[i],i*.4+j*.2);x+=v*sc;});});
 M.voiceLatency(300,'fast').parts.forEach(([n],i)=>{b+=`<rect x="${20+i*118}" y="206" width="14" height="14" rx="3" fill="${cols[i]}"/>`+t(40+i*118,218,n.replace(' 발화 감지','').replace(' 부분 인식','').replace(' 첫 토큰','').replace(' 첫 음성',''),{a:'start',size:13,fill:MU});});
 return {svg:svg(`음성 지연을 구간별로 쌓으면 빠른 구성은 ${M.voiceLatency(300,'fast').total}ms, 느린 구성은 ${M.voiceLatency(300,'slow').total}ms가 되어 체감 구간이 달라지는 그림`,b),caption:`음성 에이전트의 지연은 VAD·STT·LLM·TTS·전송이 차례로 더해집니다. 구간 값은 원본 레슨의 전형 범위 양 끝이고 합계는 실제로 더한 값이며, 체감 구간 경계는 원본 기준(확인일 2026-10-08)입니다.`};
};
F.measure=()=>{
 const sets=[['f2p','all','고칠 테스트만 보면'],['both','all','깨진 테스트까지 보면'],['both','clean','누출 과제를 거르면']];
 let b=t(20,28,'패치 8건을 세 번 채점하기',{a:'start',size:14,fill:MU});
 [...sets,sets[2]].forEach(([rule,f,label],i)=>{const r=M.harness(rule,f);let g=t(20,70,label,{a:'start',w:700})+t(620,70,`해결률 ${r.resolved}/${r.total}`,{a:'end',w:700,fill:A});
  M.PATCHES.forEach((p,k)=>{const x=20+k*76,keep=f!=='clean'||!p.leaked,row=r.rows.find(z=>z.id===p.id),ok=row&&row.resolved;
   g+=box(x,96,64,96,keep?(ok?A:O):'var(--line)',keep?'var(--panel2)':'transparent')+t(x+32,128,p.id,{size:14,fill:keep?'var(--text)':MU})+t(x+32,156,keep?(ok?'해결':'아님'):'제외',{size:13,fill:keep?(ok?A:O):MU})+(p.leaked?t(x+32,180,'누출',{size:13,fill:MU}):'');});
  b+=turn(g,i);});
 b+=t(20,240,'FAIL_TO_PASS 통과 + PASS_TO_PASS 유지 = 해결',{a:'start',size:14})+t(20,266,'숫자가 낮아질수록 점수가 실제 실력에 가까워집니다',{a:'start',size:13,fill:MU});
 return {svg:svg(`같은 패치 8건이 판정 규칙과 누출 거르기에 따라 해결률 ${M.harness('f2p','all').resolved}/8, ${M.harness('both','all').resolved}/8, ${M.harness('both','clean').resolved}/5로 바뀌는 그림`,b),caption:`같은 패치라도 판정 규칙과 과제 거르기에 따라 해결률이 달라집니다. 해결률은 실험과 같은 규칙으로 계산했고, 패치 여덟 건은 교육용 가정 데이터입니다.`};
};
F.defend=()=>{
 const r=M.pve(4),gx=[170,280,390,500],names=['출처','인자','민감','기억'],vc={allow:A,block:O,confirm:B},vt={allow:'실행',block:'차단',confirm:'확인'};
 let b='';gx.forEach((x,i)=>{b+=`<rect x="${x-4}" y="40" width="8" height="230" rx="3" fill="var(--line)"/>`+t(x,32,`규칙${i+1} ${names[i]}`,{size:13,fill:MU});});
 r.rows.forEach((c,i)=>{const y=62+i*46,stop=c.rule?gx[c.rule-1]-14:570;b+=t(20,y+16,c.tool,{a:'start',size:13});
  b+=`<path d="M140 ${y+11}H${stop}" stroke="${vc[c.verdict]}" stroke-width="2" stroke-dasharray="5 5"/>`+dot(140,y+11,stop-140,0,vc[c.verdict],i*.5,5);
  b+=blink(`<circle cx="${stop}" cy="${y+11}" r="9" fill="${vc[c.verdict]}"/>`,i*.5)+t(stop+16,y+16,vt[c.verdict],{a:'start',size:13,fill:vc[c.verdict],w:700});});
 return {svg:svg(`도구 호출 다섯 건이 검사 규칙 네 개를 지나며 ${r.blocked}건은 차단, ${r.confirm}건은 사람 확인, 나머지는 실행되는 그림`,b),caption:`값싼 검사기가 도구 호출마다 출처·인자·민감도·기억 쓰기를 차례로 봅니다. 판정은 실험과 같은 규칙으로 계산했고, 다섯 호출은 당직 도우미 사례로 지은 시나리오입니다.`};
};
F.workbench=()=>{
 const r=M.scopeCheck(M.DIFFS.creep,false),files=[['AGENTS.md','길잡이 · 50줄 안팎'],['agent_state.json','지금 과업 · 다음 행동'],['task_board.json','할 일 · 진행 · 막힘'],['scope_contract','허용 · 금지 글롭']];
 let b=t(20,28,'작업대의 바닥 파일',{a:'start',size:14,fill:MU});
 files.forEach(([n,s],i)=>{b+=blink(box(20,42+i*58,250,48,[A,B,B,O][i])+t(36,64+i*58,n,{a:'start',size:14,w:700})+t(36,82+i*58,s,{a:'start',size:13,fill:MU}),i*.6);});
 b+=line('M270 270H330V60H340',MU)+t(350,28,'범위가 번진 diff 검사',{a:'start',size:14,fill:MU});
 const lab={in:'허용',off:'경고',forbidden:'차단'},col={in:A,off:B,forbidden:O};
 r.rows.forEach((x,i)=>{const y=44+i*56;b+=blink(box(340,y,290,46,col[x.status])+t(352,y+28,x.file,{a:'start',size:13})+t(620,y+28,lab[x.status],{a:'end',size:14,w:700,fill:col[x.status]}),1+i*.6);});
 b+=t(340,284,`차단 ${r.blocks} · 경고 ${r.warns} → ${r.passed?'통과':'게이트로 넘기지 않음'}`,{a:'start',size:14,w:700});
 return {svg:svg(`작업대의 바닥 파일 네 개와, 범위가 번진 diff를 계약에 대어 차단 ${r.blocks}개와 경고 ${r.warns}개가 나오는 그림`,b),caption:`길잡이·상태·작업판이 작업대의 바닥이고, 범위 계약이 diff를 파일 단위로 판정합니다. 판정은 실험과 같은 글롭 규칙으로 계산했으며 파일 경로는 원본 레슨의 가입 검증 예를 본뜬 시나리오입니다.`};
};
F.gates=()=>{
 const names=['검사 없음','실행됨','0으로 끝남','종료 코드','금지 경로','차단 규칙','범위 밖'];let b=t(20,28,'에이전트가 “완료”라고 보고한 20건 가운데 통과 수',{a:'start',size:14,fill:MU});
 for(let L=0;L<=6;L++){const g=M.gate(L,false),y=42+L*33;b+=t(130,y+18,names[L],{a:'end',size:13})+`<rect x="140" y="${y+4}" width="400" height="20" rx="4" fill="var(--panel2)"/>`+grow(140,y+4,g.passed/20*400,20,L?B:O,L*.35)+t(552,y+19,`${g.passed}`,{a:'start',size:14,w:700});}
 const s=M.gate(6,true);b+=`<path d="M${140+s.passed/20*400} 40V280" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 4"/>`+t(140+s.passed/20*400+6,290,`엄격 모드 ${s.passed}건 = 정말 끝난 일`,{a:'start',size:13,fill:A,w:700});
 return {svg:svg(`완료 보고 20건에 게이트 검사를 하나씩 켜면 통과 수가 20에서 ${M.gate(6,false).passed}로 줄고, 엄격 모드에서 정말 끝난 ${s.passed}건만 남는 그림`,b),caption:`검사를 하나 켤 때마다 말뿐인 완료가 걸러집니다. 통과 수는 실험과 같은 게이트 규칙으로 계산했고, 실패 유형별 건수는 교육용 가정 데이터입니다.`};
};
F.frame=()=>{
 const r=M.riskRank('none',4);let b=t(20,28,'위험 = 영향 × 불확실성 + 되돌리기 어려움',{a:'start',size:14,fill:MU});
 r.rows.forEach((a,i)=>{const y=48+i*46,w=a.impact*a.uncertainty/25*360,v=a.irreversibility/25*360;b+=t(20,y+20,a.cls,{a:'start',size:14,w:700})+t(84,y+20,`${a.impact}×${a.uncertainty}+${a.irreversibility}`,{a:'start',size:13,fill:MU});
  b+=grow(190,y+4,w,24,a.id===r.next.id?O:B,i*.3)+grow(190+w,y+4,v,24,'var(--line)',i*.3+.5)+t(190+w+v+10,y+22,`${a.score}`,{a:'start',size:14,w:700});});
 const top=r.rows[0],w0=(top.impact*top.uncertainty+top.irreversibility)/25*360;b+=pulse(190+w0+20,64,17,O)+t(630,290,`다음 실험: ${top.cls} 가정`,{a:'end',size:14,fill:O,w:700});
 return {svg:svg(`당직 도우미의 다섯 가정을 위험 점수로 줄 세우면 ${r.rows.map(a=>a.cls+' '+a.score).join(', ')}이고 ${top.cls} 가정을 먼저 확인하는 그림`,b),caption:`가정마다 영향 × 불확실성(색 막대)에 되돌리기 어려움(회색 막대)을 더해 순위를 매깁니다. 점수식은 원본 레슨의 예시이고 각 가정의 1~5 값은 교육용 가정값입니다.`};
};
F.final=()=>{
 const c=M.chooseSlice(['feasibility','usability','safety']);let b=t(20,28,'필요한 증명: 실현성 · 사용성 · 안전',{a:'start',size:14,fill:MU});
 c.rows.forEach((s,i)=>{const y=44+i*38,on=s.eligible,pick=c.choice&&s.name===c.choice.name;b+=blink(box(20,y,300,30,pick?A:on?B:'var(--line)',on?'var(--panel2)':'transparent',6)+t(30,y+20,s.name,{a:'start',size:13,fill:on?'var(--text)':MU})+t(312,y+20,on?`점수 ${s.score}`:'자격 없음',{a:'end',size:13,fill:pick?A:MU,w:pick?700:400}),i*.4);});
 const X=v=>350+(v-0.5)*560;b+=t(350,60,'파일럿 정답률 판정',{a:'start',size:14,fill:MU});
 b+=`<rect x="${X(.5)}" y="80" width="${X(.75)-X(.5)}" height="40" fill="${O}" opacity=".35"/><rect x="${X(.75)}" y="80" width="${X(.9)-X(.75)}" height="40" fill="${B}" opacity=".35"/><rect x="${X(.9)}" y="80" width="${X(1)-X(.9)}" height="40" fill="${A}" opacity=".35"/>`;
 b+=t((X(.5)+X(.75))/2,100,'실패',{size:14})+t((X(.75)+X(.9))/2,100,'모호',{size:14})+t((X(.9)+X(1))/2,100,'통과',{size:14});
 [.5,.75,.9,1].forEach(v=>{b+=t(X(v),142,v,{size:13,fill:MU});});
 const d=M.pilotDecision(0.86,95,0);b+=`<path d="M${X(.86)} 76V124" stroke="var(--text)" stroke-width="3"/>`+pulse(X(.86),124,7,'var(--text)')+t(X(.86),178,`0.86 · ${d.verdict==='ambiguous'?'모호':d.verdict}`,{size:14,w:700});
 b+=t(350,214,'운영 쓰기 1회 = 숫자와 관계없이 실패',{a:'start',size:13,fill:O})+t(350,238,'통과는 중앙값 120초 이하도 함께',{a:'start',size:13,fill:MU})+t(350,262,'모호 → 재생 세트를 늘려 다시',{a:'start',size:13,fill:MU});
 return {svg:svg(`필요한 증명을 모두 덮는 조각 가운데 ${c.choice.name}을 고르고, 파일럿 정답률 0.86은 미리 정한 문턱으로 모호 판정이 나는 그림`,b),caption:`자격 관문을 통과한 조각끼리만 점수를 비교하고, 파일럿 결과는 결과 전에 정한 문턱으로 판정합니다. 점수와 판정은 실험과 같은 식으로 계산했으며 후보 값과 0.86은 교육용 가정값입니다.`};
};

function fallback(c){
 const steps=c.flow.map(x=>x.split('|')),n=steps.length,w=(600-(n-1)*20)/n;
 let b='';steps.forEach(([a,s],i)=>{const x=20+i*(w+20);b+=blink(box(x,90,w,110,A),i*.6)+t(x+w/2,140,a,{w:700})+t(x+w/2,168,s,{size:13,fill:MU});});
 return {svg:svg(`${c.title}의 흐름`,b),caption:c.subtitle};
}
function render(c){return F[c.id]?F[c.id](H):fallback(c);}
return {render,F,H};
})();
