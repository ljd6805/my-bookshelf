/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A17Math로 계산한다. */
window.A17Figures=(()=>{
'use strict';
const M=A17Math,f=(n,d=1)=>Number(n).toFixed(d);
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const turn=(body,i)=>blink(body,i*1.2,i?'fig-turn':'fig-turn fig-first');
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const poly=(pts,stroke,cls='fig-draw',w=2.5)=>`<polyline class="${cls}" points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${w}"/>`;
const H={svg,t,box,line,dot,blink,turn,grow,pulse,poly};
const F={};
const A='var(--accent)',B='var(--blue)',O='var(--orange)',MU='var(--muted)';

F.why=()=>{
 const one=M.ceiling(30),team=M.ceiling(30),sc=260/one.single;
 let b=t(20,36,`혼자: 문서 30개를 한 문맥에`,{a:'start',w:700})+box(20,52,280,34,MU,'var(--panel2)',4)+grow(20,52,one.single*sc,34,O)+line(`M${20+one.window*sc} 44V96`,O,'')+t(20+one.window*sc,112,'창 200k',{size:13,fill:O});
 b+=t(20,140,`${f(one.single/1000,0)}k 토큰 · ${one.singleTime}초`,{a:'start',size:14,fill:MU});
 b+=t(340,36,`팀: 반장 1명 + 조사원 ${team.workers}명`,{a:'start',w:700})+box(340,52,120,34,A)+t(400,75,`반장 ${f(team.leadCtx/1000,0)}k`,{size:14});
 for(let i=0;i<team.workers;i++){const x=340+(i%3)*96,y=120+Math.floor(i/3)*62;b+=box(x,y,88,46,B)+grow(x+6,y+30,team.workerCtx/team.window*76,8,B,i*.15)+t(x+44,y+22,`${f(team.workerCtx/1000,0)}k`,{size:13});if(i<3)b+=dot(400,88,x+44-400,y-88,A,i*.4,4);}
 b+=t(320,272,`팀은 문맥마다 ${f(team.workerCtx/1000,0)}k로 작지만 전체 토큰은 ${f(team.multiTotal/1000,0)}k로 혼자(${f(one.single/1000,0)}k)보다 많습니다.`,{size:14,fill:MU});
 return {svg:svg(`문서 30개를 혼자 읽으면 문맥 ${f(one.single/1000,0)}k로 창을 넘고, 팀으로 나누면 가장 큰 문맥이 ${f(team.workerCtx/1000,0)}k입니다`,b),caption:'한 에이전트가 넘치는 곳은 문맥 창이고, 나누면 문맥은 작아지지만 전체 비용은 커집니다.'};
};
F.protocol=()=>{
 const S=[['SUBMITTED','접수됨',40,60],['WORKING','작업 중',230,60],['INPUT_REQUIRED','입력 필요',230,180],['COMPLETED','완료',430,60],['CANCELED','취소',430,180]];
 const r=M.taskRun(M.TASK_SCENARIOS.input),path=['SUBMITTED',...r.history.map(h=>h.to)];
 let b=line('M200 85H230',MU)+line('M310 110V180',MU)+line('M330 180V110',MU)+line('M390 85H430',MU)+line('M390 205H430',MU);
 for(const [id,ko,x,y] of S){const term=M.TERMINAL.includes(id);b+=box(x,y,160,50,term?O:A)+t(x+80,y+22,ko,{w:700,size:14})+t(x+80,y+40,id,{size:13,fill:MU});}
 path.forEach((id,i)=>{const s=S.find(x=>x[0]===id);b+=turn(`<rect x="${s[2]-4}" y="${s[3]-4}" width="168" height="58" rx="10" fill="none" stroke="${A}" stroke-width="3"/>`,i);});
 b+=t(510,140,'끝 상태',{size:13,fill:O})+box(470,248,150,36,O)+t(545,271,'새 사건은 거절',{size:13})+pulse(545,140,16,O);
 b+=t(20,272,`이번 경로: ${path.length}개 상태, 거절 ${r.rejected}번`,{a:'start',size:14,fill:MU});
 return {svg:svg('A2A 작업이 접수됨에서 작업 중, 입력 필요를 거쳐 완료로 가고, 끝 상태는 새 사건을 거절하는 상태 그림',b),caption:'A2A 작업은 정해진 상태 사이로만 움직이며, 끝 상태에 닿으면 더는 사건을 받지 않습니다.'};
};
F.turn=()=>{
 const r=M.orchestra(0.2),rows=[['고정 순서',1,'호출 3'],['손넘김',r.handoff.review,`검토 도달 ${f(r.handoff.review*100,0)}%`],['선택자 LLM',1,`호출 ${f(r.selector.calls,2)}`]],steps=['조사','작성','검토'];
 let b='';
 rows.forEach(([name,rev,note],i)=>{const y=40+i*82;b+=t(20,y+28,name,{a:'start',w:700});
  steps.forEach((s,k)=>{const x=150+k*130,faint=k===2&&rev<1;b+=blink(box(x,y,100,44,faint?O:[A,B,A][k],faint?'transparent':'var(--panel2)')+t(x+50,y+28,s,{size:14,fill:faint?O:'var(--text)'}),k*.8+i*.2);if(k<2)b+=line(`M${x+100} ${y+22}H${x+130}`,MU);});
  if(i===2)b+=box(540,y,80,44,B)+t(580,y+28,'선택자',{size:13})+dot(540,y+22,-270,0,B,.3,4);
  b+=t(150,y+64,note,{a:'start',size:13,fill:MU});});
 return {svg:svg(`세 가지 지휘 방식. 일찍 끝낼 확률 0.2에서 손넘김의 검토 도달은 ${f(r.handoff.review*100,0)}%`,b),caption:'다음 차례를 에이전트 스스로 정하면 호출은 줄지만 검토 같은 뒷단계가 빠질 수 있습니다.'};
};
F.supervisor=()=>{
 const r=M.fanout(5,1),sc=10;
 let b=box(250,24,140,46,A)+t(320,52,'반장',{w:700});
 r.load.forEach((l,i)=>{const y=96+i*34;b+=t(130,y+17,`조사원 ${i+1}`,{a:'end',size:14})+box(140,y,240,24,MU,'var(--panel2)',4)+grow(140,y,l*sc,24,i%2?B:A,i*.2)+t(150+l*sc,y+17,`${l}분`,{a:'start',size:13});});
 b+=line('M320 70V92',MU)+dot(320,72,0,18,A,0,4);
 b+=box(420,110,200,110,O)+t(520,140,`K = 5`,{w:700})+t(520,166,`완료 ${r.time}분`,{size:14})+t(520,190,`혼자 차례로 ${r.serial}분`,{size:14,fill:MU});
 b+=t(320,282,`가장 바쁜 조사원 ${r.makespan}분이 전체 시간을 정합니다.`,{size:14,fill:MU});
 return {svg:svg(`반장이 조사원 5명에게 하위 질문을 나눠 ${r.time}분에 끝내는 그림. 혼자면 ${r.serial}분`,b),caption:'반장은 하위 질문을 나눠 주고 요약만 받으며, 가장 늦게 끝나는 조사원이 전체 시간을 정합니다.'};
};
F.roles=()=>{
 const c=M.verify(0.3,'critic'),v=M.verify(0.3,'verifier');
 let b=box(20,110,130,60,A)+t(85,146,'실행자',{w:700});
 b+=box(250,40,150,60,B)+t(325,66,'비평가',{w:700})+t(325,86,'글을 읽고 판단',{size:13,fill:MU});
 b+=box(250,180,150,60,O)+t(325,206,'검증자',{w:700})+t(325,226,'테스트를 실행',{size:13,fill:MU});
 b+=line('M150 130L250 70',MU)+line('M150 150L250 210',MU)+dot(150,130,100,-60,A,0,5)+dot(150,150,100,60,A,1.2,5);
 b+=box(470,40,150,60,B)+t(545,66,'버그 출고',{size:14})+t(545,88,`${f(c.bug*100,1)}%`,{w:700,fill:B});
 b+=box(470,180,150,60,O)+t(545,206,'버그 출고',{size:14})+t(545,228,`${f(v.bug*100,1)}%`,{w:700,fill:O});
 b+=line('M400 70H470',MU)+line('M400 210H470',MU)+pulse(545,210,40,O);
 b+=t(320,282,'버그 확률 30%에서 같은 실행자를 두 방식으로 검사한 결과',{size:14,fill:MU});
 return {svg:svg(`버그 확률 30%에서 비평가만 두면 ${f(c.bug*100,1)}%, 검증자만 두면 ${f(v.bug*100,1)}%가 출고되는 그림`,b),caption:'같은 모델의 의견보다 실제로 돌려 본 결과가 더 많은 버그를 거릅니다.'};
};
F.swarm=()=>{
 const q=M.schedule(3,'queue'),x0=30;
 let b=t(x0,30,'공유 대기열(문서 12개, 분)',{a:'start',w:700});
 M.DOCS.forEach((d,i)=>{const x=x0+i*48;b+=blink(box(x,44,40,36,i%2?B:A)+t(x+20,68,d,{size:14}),i*.3);});
 for(let w=0;w<3;w++){const y=130+w*44;b+=t(x0,y+20,`일꾼 ${w+1}`,{a:'start',size:14})+box(110,y,340,28,MU,'var(--panel2)',4)+grow(110,y,q.load[w]*18,28,w%2?B:A,w*.3)+t(118+q.load[w]*18,y+20,`${q.load[w]}분`,{a:'start',size:13});}
 b+=dot(300,80,-150,60,A,0,5)+dot(340,80,-120,100,B,.8,5)+dot(380,80,-90,140,A,1.6,5);
 b+=box(480,130,140,116,O)+t(550,160,'대기열',{w:700})+t(550,186,`${q.makespan}분`,{size:15})+t(550,212,`미리 나눔 ${M.schedule(3,'fixed').makespan}분`,{size:13,fill:MU});
 return {svg:svg(`일꾼 3명이 공유 대기열에서 문서를 가져가 ${q.makespan}분에 끝내는 그림`,b),caption:'빈 일꾼이 다음 일을 가져가면 누가 무엇을 할지 미리 정하지 않아도 일이 고르게 나뉩니다.'};
};
F.debate=()=>{
 const a=M.vote(5,0.65,0),c=M.vote(5,0.65,0.6);
 let b=box(250,110,140,70,A)+t(320,140,'다수결',{w:700})+t(320,164,'5명 중 3명 이상',{size:13,fill:MU});
 for(let i=0;i<5;i++){const ang=Math.PI*(0.15+0.7*i/4),x=320-230*Math.cos(ang),y=150-120*Math.sin(ang)+40;b+=pulse(x,y,14,i%2?B:A)+t(x,y+5,i+1,{size:13})+dot(x,y,320-x,145-y,i%2?B:A,i*.35,4);}
 b+=box(20,220,280,60,B)+t(160,246,'서로 다른 모델 5명',{size:14})+t(160,268,`정확도 ${f(a.acc,3)}`,{w:700,size:14});
 b+=box(340,220,280,60,O)+t(480,246,'같은 모델 5명 (ρ 0.6)',{size:14})+t(480,268,`정확도 ${f(c.acc,3)}`,{w:700,size:14});
 return {svg:svg(`다섯 명이 다수결로 답을 모을 때 서로 독립이면 ${f(a.acc,3)}, 같은 모델이면 ${f(c.acc,3)}`,b),caption:'투표자를 늘린 효과는 그들이 서로 얼마나 다르게 틀리는지에 달려 있습니다.'};
};
F.consensus=()=>{
 const r=M.consensus('sycophancy'),xs=v=>v<10?140:470;
 let b=t(320,30,'동조 2명이 붙은 다섯 답(정답 4.2%)',{w:700});
 b+=box(60,50,170,120,A)+t(145,76,'4.2% 무리',{w:700})+box(390,50,170,120,O)+t(475,76,'42% 무리',{w:700});
 r.votes.forEach(([v,c],i)=>{const k=r.votes.slice(0,i).filter(x=>(x[0]<10)===(v<10)).length,x=xs(v)-20+k*28,y=120;b+=`<circle class="fig-pulse" style="animation-delay:${i*.3}s" cx="${x}" cy="${y}" r="${6+c*10}" fill="${v<10?A:O}" opacity=".75"/>`;});
 const rows=[['다수결',r.plural],['자신감 가중',r.weighted],['중앙값',r.geo]];
 rows.forEach(([n,x],i)=>{b+=turn(box(170,190,300,60,x.correct?A:O)+t(320,216,n,{w:700,size:14})+t(320,238,`${x.value}% · ${x.correct?'맞음':'틀림'}`,{size:14}),i);});
 b+=t(320,282,'원의 크기는 자신감입니다. 같은 답도 묶는 방식에 따라 결론이 갈립니다.',{size:13,fill:MU});
 return {svg:svg('동조 두 명이 붙은 다섯 답을 다수결, 자신감 가중, 중앙값으로 묶은 결과를 차례로 보이는 그림',b),caption:'다수결과 중앙값은 숫자를 세고, 자신감 가중은 확신을 셉니다. 공격의 모양에 따라 버티는 집계가 다릅니다.'};
};
F.market=()=>{
 const Bv=100,Sv=80,R=4,x=k=>80+k*130,y=p=>250-(p-60)*3.2,buy=[],ask=[];let deal=-1;
 for(let k=0;k<R;k++){const o=0.7*Bv+0.3*Bv*k/R,a=1.3*Sv-0.3*Sv*k/R;buy.push([x(k),y(o)]);ask.push([x(k),y(a)]);if(deal<0&&o>=a)deal=k;}
 let b=line(`M60 ${y(Bv)}H600`,B,'')+t(604,y(Bv)-8,'구매자 최대 100',{a:'end',size:13,fill:B})+line(`M60 ${y(Sv)}H600`,O,'')+t(604,y(Sv)+18,'판매자 최저 80',{a:'end',size:13,fill:O});
 b+=poly(ask,O)+poly(buy,A);for(let k=0;k<R;k++){b+=blink(`<circle cx="${buy[k][0]}" cy="${buy[k][1]}" r="6" fill="${A}"/><circle cx="${ask[k][0]}" cy="${ask[k][1]}" r="6" fill="${O}"/>`,k*.6)+t(x(k),280,`라운드 ${k+1}`,{size:13,fill:MU});}
 if(deal>=0)b+=pulse(x(deal),(buy[deal][1]+ask[deal][1])/2,18,A)+t(x(deal)+28,buy[deal][1]+30,`판매자 요구 ${f(1.3*Sv-0.3*Sv*deal/R,0)}에 성사`,{a:'start',size:14,fill:A});
 b+=t(620,30,'구매자 제안(코드가 계산)',{a:'end',size:14,fill:A})+t(620,50,'판매자 요구',{a:'end',size:14,fill:O});
 return {svg:svg(`최대가 100인 구매자와 최저가 80인 판매자가 네 라운드 동안 고르게 양보해 라운드 ${deal+1}에서 성사하는 그림`,b),caption:'값은 정해진 규칙으로 계산하고 말만 모델에게 맡기면, 자기 한계를 넘겨 부르지 않으면서 차근차근 가까워집니다.'};
};
F.social=()=>{
 const z=M.tom(0,3),o=M.tom(1,3);
 const panel=(x0,title,targets,dup)=>{let s=t(x0+140,30,title,{w:700,size:14});
  for(let i=0;i<3;i++){const y=73+i*70;s+=box(x0+220,y-23,64,46,O)+t(x0+252,y+5,`상자 ${i+1}`,{size:13});}
  for(let i=0;i<3;i++){const y=73+i*70,ty=73+targets[i]*70;s+=pulse(x0+30,y,14,i%2?B:A)+t(x0+30,y+5,'ABC'[i],{size:13})+line(`M${x0+46} ${y}L${x0+218} ${ty}`,i%2?B:A);}
  return s+t(x0+140,272,`같은 상자를 고른 비율 ${f(dup*100,1)}%`,{size:14,fill:MU});};
 const b=blink(panel(10,'0차: 각자 무작위',[0,0,2],z.duplication),0)+blink(panel(330,'1차: 상대를 짐작',[0,1,2],o.duplication),1.2)+line('M320 40V280',MU,'');
 return {svg:svg(`세 에이전트가 상자 셋을 줍는 그림. 0차는 같은 상자를 고르는 비율 ${f(z.duplication*100,1)}%, 1차는 ${f(o.duplication*100,1)}%`,b),caption:'상대가 어디로 가는지 짐작하면 말을 하지 않고도 같은 일을 두 번 하는 경우가 줄어듭니다.'};
};
F.ops=()=>{
 const s=M.storm(0.2,5,false),k=M.storm(0.2,5,true),x=i=>70+i*28,y=v=>250-v*34;
 let b=line(`M70 ${y(1.2)}H610`,O,'')+t(610,y(1.2)-8,'용량 1.2',{a:'end',size:13,fill:O});
 b+=poly(s.load.map((v,i)=>[x(i),y(v)]),O)+poly(k.load.map((v,i)=>[x(i),y(v)]),A);
 b+=t(80,y(s.final)-10,`재시도 5번: ${f(s.final,2)}`,{a:'start',size:14,fill:O})+t(400,y(1)+26,`차단기: ${f(k.final,2)}`,{a:'start',size:14,fill:A});
 b+=pulse(x(19),y(s.final),12,O)+t(340,284,'시간 단계(실패율 0.2)',{size:13,fill:MU})+line('M70 40V250H610',MU,'');
 return {svg:svg(`실패율 0.2에서 재시도 5번이면 부하가 ${f(s.final,2)}로 치솟고, 회로 차단기를 켜면 ${f(k.final,2)}에 머무는 그림`,b),caption:'실패를 재시도로 덮으면 실패가 더 많은 요청을 부르고, 차단기는 그 되먹임 고리를 끊습니다.'};
};
F.final=()=>{
 const I=[['poison','기억 오염'],['storm','재시도 폭풍'],['mono','단일 문화']],X=[['more','더 붙이기'],['verify','독립 확인'],['longer','더 오래']];
 let b='';X.forEach(([,n],j)=>{b+=t(250+j*130,40,n,{w:700,size:14});});
 I.forEach(([id,n],i)=>{const y=60+i*66;b+=t(30,y+32,n,{a:'start',w:700,size:14});X.forEach(([fx],j)=>{const r=M.diagnose(id,fx),x=190+j*130;b+=blink(box(x,y,120,50,r.good?A:O,r.good?'var(--panel2)':'transparent')+t(x+60,y+31,r.good?'해결':'그대로·악화',{size:14,fill:r.good?A:O}),(i*3+j)*.25);});});
 b+=t(320,280,'세 사고 모두에서 통한 것은 독립된 확인 하나였습니다.',{size:14,fill:MU});
 return {svg:svg('사고 세 건과 처방 세 가지를 교차한 표. 독립된 확인만 세 사고를 모두 해결합니다',b),caption:'에이전트를 더 붙이거나 더 오래 돌리는 것보다, 다른 경로로 확인하는 장치 하나가 더 많은 사고를 막습니다.'};
};

function fallback(c){
 const steps=c.flow.map(x=>x.split('|')),n=steps.length,w=(600-(n-1)*20)/n,colors=[A,B,O,A];
 let b='';steps.forEach(([a,s],i)=>{const x=20+i*(w+20);b+=blink(box(x,90,w,110,colors[i%4]),i*.6)+t(x+w/2,140,a,{w:700})+t(x+w/2,168,s.length>14?s.slice(0,14)+'…':s,{size:13,fill:MU});if(i<n-1)b+=line(`M${x+w} 145H${x+w+20}`)+dot(x+w-4,145,24,0,colors[i%4],i*.6,5);});
 return {svg:svg(`${c.title}의 흐름: ${steps.map(s=>s[0]).join(', ')}`,b),caption:`${c.subtitle}`};
}
function render(c){return F[c.id]?F[c.id](H):fallback(c);}
return {render,F,H};
})();
