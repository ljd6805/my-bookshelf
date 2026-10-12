/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A16Math로 계산한다. */
window.A16Figures=(()=>{
'use strict';
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
const M=A16Math,f=(n,d=1)=>Number(n).toFixed(d).replace('-','−'),pc=x=>f(x*100,1)+'%';
const poly=(pts,stroke,cls='fig-draw',w=2.5,dash='')=>`<polyline class="${cls}" points="${pts.map(q=>q.map(v=>v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${stroke}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
const axes=(x0,y0,x1,y1)=>`<path d="M${x0} ${y0}V${y1}H${x1}" stroke="var(--line)" fill="none"/>`;
const F={};
/* 1장: 단계가 이어진 사슬과 pⁿ 막대. */
F.horizon=()=>{
 let b=t(20,34,'누리의 하룻밤 = 단계가 이어진 사슬',{a:'start',size:15,w:700});
 for(let i=0;i<10;i++){const x=40+i*56;b+=box(x,52,40,30,'var(--line)')+t(x+20,72,i<9?`${i+1}`:'…',{size:13,fill:'var(--muted)'});if(i<9)b+=line(`M${x+40} 67H${x+56}`);}
 b+=dot(60,67,504,0,'var(--accent)',0,6)+t(600,72,'n',{size:15,w:700,fill:'var(--accent)'});
 const ns=[10,70,200],ps=[0.99,0.999],col=['var(--orange)','var(--blue)'];
 b+=t(20,118,'끝까지 성공할 확률 pⁿ',{a:'start',size:14,fill:'var(--muted)'});
 ns.forEach((n,i)=>{const y=128+i*50;b+=t(70,y+26,`${n}단계`,{a:'end',size:14});ps.forEach((p,j)=>{const P=M.chain(p,n).P,w=P*420;b+=grow(84,y+j*20,w,16,col[j],i*.3+j*.15)+t(92+w,y+j*20+13,`${pc(P)}`,{a:'start',size:13});});});
 b+=t(620,292,'주황 p = 0.99 · 파랑 p = 0.999',{a:'end',size:13,fill:'var(--muted)'});
 const r=M.chain(0.99,70);
 return {svg:svg('단계 열 개가 이어진 사슬을 점이 지나가고, 아래에 p 0.99와 0.999에서 10·70·200단계를 끝까지 성공할 확률 막대가 자라는 그림',b),caption:`막대는 pⁿ을 실제로 계산한 값입니다. p = 0.99에서 70단계를 끝까지 해낼 확률은 ${pc(r.P)}로 절반에 못 미치고, p를 0.999로 올려야 200단계도 ${pc(M.chain(0.999,200).P)}가 됩니다.`};
};
/* 2장: STaR 고리와 분포 안·밖 정답률. */
F.star=()=>{
 const st=[['문제',60],['풀이 생성',170],['정답 확인',280],['다시 학습',390]];let b='';
 st.forEach(([s,x],i)=>{b+=blink(box(x-50,40,100,48,i===2?'var(--orange)':'var(--accent)'),i*.6)+t(x,70,s,{size:14,w:700});if(i<3)b+=line(`M${x+50} 64H${x+60}`)+dot(x+46,64,18,0,'var(--accent)',i*.6,5);});
 b+=line('M390 88V112H60V88','var(--muted)')+dot(390,112,-330,0,'var(--blue)',1.2,5)+t(225,130,'고리를 돌 때마다 맞힌 풀이가 더 많아진다',{size:13,fill:'var(--muted)'});
 const A=M.starLoop(0.4,8,'answer'),P=M.starLoop(0.4,8,'process');
 b+=t(450,40,'8바퀴 뒤 정답률',{a:'start',size:14,w:700});
 [['정답만',A],['과정 검사',P]].forEach(([n,r],i)=>{const y=60+i*70;b+=t(450,y+12,n,{a:'start',size:13,fill:'var(--muted)'});b+=grow(450,y+20,r.inD*120,14,'var(--blue)',i*.4)+grow(450,y+38,r.outD*120,14,'var(--orange)',i*.4+.2)+t(456+r.inD*120,y+32,pc(r.inD),{a:'start',size:13})+t(456+r.outD*120,y+50,pc(r.outD),{a:'start',size:13});});
 b+=t(450,214,'파랑 분포 안 · 주황 분포 밖',{a:'start',size:13,fill:'var(--muted)'});
 b+=t(40,190,'지름길 풀이도 정답에 닿으면',{a:'start',size:15})+t(40,216,'정답만 확인하는 고리를 통과한다',{a:'start',size:15})+pulse(380,200,14,'var(--orange)')+t(380,205,'!',{size:15,w:700,fill:'var(--orange)'});
 b+=t(40,262,`처음 지름길 40% · 정답만 보면 분포 밖 ${pc(A.outD)}, 과정까지 보면 ${pc(P.outD)}`,{a:'start',size:14,fill:'var(--muted)'});
 return {svg:svg('문제, 풀이 생성, 정답 확인, 다시 학습으로 도는 STaR 고리와, 8바퀴 뒤 정답만 확인할 때와 과정 검사를 더할 때의 분포 안팎 정답률 막대',b),caption:`처음 지름길 풀이가 40%인 장난감 모형에서 8바퀴를 실제로 계산했습니다. 정답만 거르면 분포 안 ${pc(A.inD)}, 분포 밖 ${pc(A.outD)}로 벌어지고, 과정 검사를 더하면 분포 밖도 ${pc(P.outD)}로 따라옵니다.`};
};
/* 3장: 보고 점수와 실제 품질 곡선. */
F.evolve=()=>{
 const V=M.evolve('visible',40),Hd=M.evolve('holdout',40),x=g=>70+g*13,y=v=>250-v*100;let b=axes(70,40,600,250);
 [0,0.5,1,1.5,2].forEach(v=>b+=t(62,y(v)+5,f(v,1),{a:'end',size:13,fill:'var(--muted)'}));
 b+=t(335,280,'세대 (0~40)',{size:13,fill:'var(--muted)'});
 b+=poly(V.reported.map(([g,v])=>[x(g),y(v)]),'var(--orange)')+poly(V.truth.map(([g,v])=>[x(g),y(v)]),'var(--orange)','fig-draw',2,'6 5');
 b+=poly(Hd.reported.map(([g,v])=>[x(g),y(v)]),'var(--accent)')+poly(Hd.truth.map(([g,v])=>[x(g),y(v)]),'var(--accent)','fig-draw',2,'6 5');
 b+=t(596,y(V.finalReported)-8,`공개 테스트 채점: 보고 ${f(V.finalReported,2)}`,{a:'end',size:13,fill:'var(--orange)'})+t(596,y(V.finalTrue)+20,`실제 ${f(V.finalTrue,2)}`,{a:'end',size:13,fill:'var(--orange)'});
 b+=t(596,y(Hd.finalReported)-10,`숨긴 입력: ${f(Hd.finalReported,2)} / ${f(Hd.finalTrue,2)}`,{a:'end',size:13,fill:'var(--accent)'});
 b+=pulse(x(40),y(V.finalReported),7,'var(--orange)');
 return {svg:svg('같은 진화 고리를 공개 테스트로 채점할 때와 숨긴 입력으로 채점할 때, 40세대 동안 보고 점수 실선과 실제 품질 점선이 그려지는 그래프',b),caption:`시드를 고정한 진화 고리를 실제로 돌렸습니다. 공개 테스트로만 채점하면 40세대 뒤 보고 점수가 ${f(V.finalReported,2)}, 실제 품질이 ${f(V.finalTrue,2)}로 크게 벌어지고, 숨긴 입력으로 채점하면 둘이 함께 움직입니다. 실선이 보고 점수, 점선이 실제 품질입니다.`};
};
/* 4장: 연구 파이프라인과 심사 깊이. */
F.research=()=>{
 const st=['아이디어','실험 코드','논문 작성','심사'];let b='';
 st.forEach((s,i)=>{const x=30+i*150;b+=blink(box(x,40,120,50,i===3?'var(--orange)':'var(--blue)'),i*.6)+t(x+60,71,s,{size:14,w:700});if(i<3)b+=line(`M${x+120} 65H${x+150}`)+dot(x+116,65,34,0,'var(--blue)',i*.6,5);});
 b+=t(320,118,'아이디어 100개를 흘려보낸 기댓값 (재시도 1회)',{size:14,fill:'var(--muted)'});
 const S=M.scientist(1,'shallow'),D=M.scientist(1,'deep');
 [['얕은 심사',S],['깊은 심사',D]].forEach(([n,r],i)=>{const y=140+i*62,bad=r.submitted*r.badShare;b+=t(130,y+24,n,{a:'end',size:14});b+=grow(140,y+8,(r.submitted-bad)*4.5,22,'var(--blue)',i*.4)+grow(140+(r.submitted-bad)*4.5,y+8,bad*4.5,22,'var(--orange)',i*.4+.3);b+=t(150+r.submitted*4.5,y+25,`제출 ${f(r.submitted,1)}편 · 결함 ${pc(r.badShare)}`,{a:'start',size:13});});
 b+=t(320,282,'파랑 결함 없는 제출 · 주황 결함이 섞인 제출',{size:13,fill:'var(--muted)'});
 return {svg:svg('아이디어, 실험 코드, 논문 작성, 심사로 이어진 자동 연구 파이프라인과, 얕은 심사와 깊은 심사에서 제출 수와 결함 비율 막대',b),caption:`단계별 실패율과 심사의 적발률을 가정하고 기댓값을 실제로 계산했습니다. 재시도 1회에서 얕은 심사는 ${f(S.submitted,1)}편을 내보내고 그중 ${pc(S.badShare)}에 결함이 있으며, 깊은 심사는 ${f(D.submitted,1)}편, ${pc(D.badShare)}로 줄입니다.`};
};
/* 5장: 복리 경주. */
F.bounded=()=>{
 const R=M.race(0.05,20),x=k=>70+k*24,y=v=>250-(v-1)*30;let b=axes(70,40,560,250);
 [1,3,5,7].forEach(v=>b+=t(62,y(v)+5,f(v,0),{a:'end',size:13,fill:'var(--muted)'}));
 b+=t(315,280,'자기 개선 주기 (0~20)',{size:13,fill:'var(--muted)'});
 b+=poly(R.pts.map(([k,c])=>[x(k),y(c)]),'var(--orange)')+poly(R.pts.map(([k,,a])=>[x(k),y(a)]),'var(--accent)');
 b+=t(x(20)+6,y(R.C)+5,`능력 ${f(R.C,2)}`,{a:'start',size:13,fill:'var(--orange)'})+t(x(20)+6,y(R.A)+5,`정렬 ${f(R.A,2)}`,{a:'start',size:13,fill:'var(--accent)'});
 if(R.first!==null)b+=pulse(x(R.first),y(R.pts[R.first][1]),7,'var(--orange)')+t(x(R.first)-10,y(R.pts[R.first][1])-60,`${R.first}주기: 격차가 한계 25%를 넘음`,{a:'start',size:13})+line(`M${x(R.first)} ${y(R.pts[R.first][1])-10}V${y(R.pts[R.first][1])-54}`,'var(--muted)','');
 return {svg:svg('능력이 주기당 10%, 정렬이 5%씩 복리로 자랄 때 20주기 동안 두 곡선이 벌어지는 그래프',b),caption:`능력은 주기당 10%, 정렬은 5%씩 복리로 자란다고 두고 실제로 계산했습니다. 상대 격차가 25%를 넘는 것은 ${R.first}주기째이고, 20주기 뒤 능력 ${f(R.C,2)}배, 정렬 ${f(R.A,2)}배로 격차가 계속 커집니다.`};
};
/* 6장: 권한 사다리. */
F.permission=()=>{
 const modes=[['plan','plan'],['default','default'],['acceptEdits','acceptEdits'],['auto','auto'],['dontAsk','dontAsk'],['bypass','bypassPermissions']];let b='';
 b+=line('M60 30V280','var(--line)','')+line('M300 30V280','var(--line)','');
 modes.forEach(([k,n],i)=>{const y=50+i*40,r=M.ladder(k,'repo');b+=`<path d="M60 ${y}H300" stroke="var(--muted)" stroke-width="2"/>`+t(180,y-6,n,{size:14,w:700});
  b+=blink(box(330,y-24,290,34,r.riskyAuto>2?'var(--orange)':'var(--accent)')+t(475,y-2,`묻기 ${r.asks} · 위험 자동 ${r.riskyAuto} · 거절 ${r.denied}`,{size:14}),i*.5);});
 b+=dot(40,250,0,-200,'var(--accent)',0,7)+t(30,292,'위로 갈수록 사람이 더 자주 확인',{a:'start',size:13,fill:'var(--muted)'});
 return {svg:svg('plan부터 bypassPermissions까지 권한 모드 여섯 개를 사다리 가로대로 놓고, 모드마다 하룻밤 행동 여덟 개 중 묻기와 위험한 자동 실행 수를 보여 주는 그림',b),caption:`하룻밤 행동 여덟 개를 모드별 규칙으로 판정한 결과입니다. plan은 여덟 번 모두 묻고, auto는 ${M.ladder('auto','repo').asks}번만 묻는 대신 위험 행동 ${M.ladder('auto','repo').riskyAuto}개가 자동으로 실행됩니다. 판정 규칙은 공식 문서를 단순화한 가정입니다.`};
};
/* 7장: 읽은 글이 쓰기가 되는 길. */
F.browser=()=>{
 let b=box(20,90,150,90,'var(--blue)')+t(95,128,'공급 페이지',{size:15,w:700})+t(95,152,'숨은 지시 포함',{size:13,fill:'var(--orange)'});
 b+=box(245,90,150,90,'var(--accent)')+t(320,128,'누리',{size:15,w:700})+t(320,152,'읽고 계획',{size:13,fill:'var(--muted)'});
 b+=box(470,90,150,90,'var(--orange)')+t(545,128,'쓰기 행동',{size:15,w:700})+t(545,152,'환불 · 기억 저장',{size:13,fill:'var(--muted)'});
 b+=line('M170 135H245','var(--blue)')+dot(176,135,64,0,'var(--orange)',0,6)+line('M395 135H470','var(--orange)');
 const N=M.inject('none'),B=M.inject('boundary');
 const sA=dot(401,135,64,0,'var(--orange)',0,6)+t(320,220,`방어 없음: 페이지 네 곳 중 ${N.hits}곳의 지시가 실행됨`,{size:15,fill:'var(--orange)'});b+=turn(sA,0)+turn(sA,2);
 const sB=`<path d="M432 112V158" stroke="var(--accent)" stroke-width="5"/>`+pulse(432,135,14,'var(--accent)')+t(320,220,`읽기-쓰기 경계: ${B.asks}곳 모두 사람에게 묻고 실행 ${B.hits}곳`,{size:15,fill:'var(--accent)'});b+=turn(sB,1)+turn(sB,3);
 b+=t(320,262,'바깥 글에서 나온 쓰기는 새 승인을 받는다',{size:14,fill:'var(--muted)'});
 return {svg:svg('공급 페이지의 숨은 지시가 누리를 거쳐 쓰기 행동으로 가는 길과, 읽기-쓰기 경계가 그 길을 끊는 장면이 번갈아 나오는 그림',b),caption:`가상의 공급 페이지 네 곳으로 방어 조합을 판정했습니다. 방어가 없으면 ${N.hits}곳의 숨은 지시가 실행되고, 읽기-쓰기 경계를 두면 바깥 글에서 나온 쓰기가 모두 사람의 승인을 기다립니다.`};
};
/* 8장: 사건 기록과 재생. */
F.durable=()=>{
 const acts=M.activities,Nv=M.replay(5,'naive'),Rp=M.replay(5,'replay');let b=t(20,34,'활동 다섯 개를 마친 직후 충돌',{a:'start',size:15,w:700});
 acts.forEach((a,i)=>{const x=20+i*102,done=i<5;b+=box(x,52,94,46,done?'var(--accent)':'var(--line)')+t(x+47,80,`${i+1}`,{size:15,w:700,fill:done?'var(--text)':'var(--muted)'});});
 b+=pulse(530,75,16,'var(--orange)')+t(530,120,'충돌',{size:14,fill:'var(--orange)'});
 {const s=dot(30,160,480,0,'var(--orange)',0,6)+t(20,200,'처음부터 다시: 다섯 활동을 모두 다시 실행',{a:'start',size:15,fill:'var(--orange)'})+t(20,228,`중복 부작용 ${Nv.dupEffects}건 · LLM 비용 ${f(Nv.rebilled,1)}달러 다시 냄 · 사람에게 ${Nv.reask}번 더 물음`,{a:'start',size:14});b+=turn(s,0)+turn(s,2);}
 {const s=`<path d="M20 160H520" stroke="var(--accent)" stroke-width="3" stroke-dasharray="4 6"/>`+dot(520,160,90,0,'var(--accent)',0,6)+t(20,200,'사건 기록으로 재생: 기록된 결과를 읽고 6번째부터',{a:'start',size:15,fill:'var(--accent)'})+t(20,228,`중복 부작용 ${Rp.dupEffects}건 · 다시 낸 비용 ${f(Rp.rebilled,1)}달러 · 다시 물음 ${Rp.reask}번`,{a:'start',size:14});b+=turn(s,1)+turn(s,3);}
 b+=t(20,276,'모든 활동의 결과를 기록해 두어야 재생할 수 있다',{a:'start',size:14,fill:'var(--muted)'});
 return {svg:svg('활동 여섯 개 중 다섯 개를 마친 뒤 충돌했을 때, 처음부터 다시 실행하는 경우와 사건 기록으로 재생하는 경우가 번갈아 나오는 그림',b),caption:`가상의 하룻밤 활동 여섯 개로 다시 시작 방식을 비교했습니다. 처음부터 다시 돌리면 이미 한 환불이 ${Nv.dupEffects}건 중복되고 LLM 비용 ${f(Nv.rebilled,1)}달러를 다시 내지만, 사건 기록으로 재생하면 중복도 추가 비용도 없습니다.`};
};
/* 9장: 시간 단위가 다른 상한. */
F.budget=()=>{
 const L=[['month','이달 상한만'],['day','하루 상한'],['velocity','10분 속도 제한']],R=L.map(([k])=>M.governor(6,k)),mx=Math.max(...R.map(r=>r.loss));let b=t(20,34,'분당 6달러를 쓰는 고리가 시작된 뒤 끊길 때까지',{a:'start',size:15,w:700});
 L.forEach(([k,n],i)=>{const y=62+i*62,r=R[i],w=Math.max(r.loss/mx*300,4);b+=t(150,y+22,n,{a:'end',size:14});b+=grow(160,y+6,w,26,i===2?'var(--accent)':'var(--orange)',i*.4)+t(168+w,y+25,`${r.minutesAfterLoop}분 · ${Math.round(r.loss).toLocaleString('en-US')}달러`,{a:'start',size:13});});
 b+=pulse(166,231,10,'var(--accent)')+t(20,270,'월 상한은 그달 돈이 다 빠진 뒤에, 속도 제한은 몇 분 안에 걸린다',{a:'start',size:14,fill:'var(--muted)'});
 return {svg:svg('분당 6달러의 비용 고리를 이달 상한, 하루 상한, 10분 속도 제한이 각각 끊기까지 걸린 시간과 잃은 돈을 비교한 막대',b),caption:`평소 지출과 상한을 가정하고 고리가 시작된 뒤 처음 걸리는 상한을 실제로 계산했습니다. 이달 상한만 두면 ${R[0].minutesAfterLoop}분 동안 ${Math.round(R[0].loss).toLocaleString('en-US')}달러가 빠지고, 10분 속도 제한은 ${R[2].minutesAfterLoop}분, ${f(R[2].loss,0)}달러에서 끊습니다.`};
};
/* 10장: 원칙의 층과 방어 겹. */
F.guard=()=>{
 const tiers=[['하드코딩 금지','var(--orange)'],['1 안전·감독 지원','var(--accent)'],['2 윤리','var(--accent)'],['3 지침','var(--blue)'],['4 도움','var(--blue)']];let b=t(20,30,'충돌하면 위층이 이긴다',{a:'start',size:15,w:700});
 tiers.forEach(([n,c],i)=>{b+=blink(box(20,44+i*44,240,36,c),i*.5)+t(140,67+i*44,n,{size:14,w:i===0?700:400});});
 b+=t(450,30,'이모지 숨기기 1,000번 중 통과',{size:15,w:700});
 [1,2,3,4].forEach((n,i)=>{const r=M.layers('emoji',n),y=48+i*52,w=Math.max(r.per1000/1000*180,3);b+=t(350,y+22,`${n}겹`,{a:'end',size:14});b+=grow(360,y+6,w,24,'var(--orange)',i*.35)+t(366+w,y+24,f(r.per1000,0)+'번',{a:'start',size:13});});
 b+=t(450,272,'분류기 → 모델 → 실행 울타리 → 사람 검토',{size:13,fill:'var(--muted)'});
 return {svg:svg('하드코딩 금지와 네 층 우선순위가 위에서 아래로 쌓인 그림과, 이모지 숨기기 공격 1,000번 중 방어 겹을 하나씩 쌓을 때 통과 수가 줄어드는 막대',b),caption:`왼쪽은 원칙이 충돌할 때 위층이 이기는 순서이고, 오른쪽은 층별 통과 확률을 곱한 계산입니다. 분류기 한 겹이면 이모지 숨기기 1,000번이 모두 지나가고, 네 겹을 쌓으면 ${f(M.layers('emoji',4).per1000,0)}번으로 줄어듭니다. 층이 서로 독립이라는 가정 위의 값입니다.`};
};
/* 11장: 로지스틱 지평 적합. */
F.policy=()=>{
 const H=M.horizon(0,0.8),x=v=>70+v*45,y=p=>250-p*200;let b=axes(70,40,610,250);
 [0,0.5,1].forEach(p=>b+=t(62,y(p)+5,f(p*100,0)+'%',{a:'end',size:13,fill:'var(--muted)'}));
 [0,3,6,9].forEach(v=>b+=t(x(v),270,`${Math.pow(2,v)}분`,{size:13,fill:'var(--muted)'}));
 b+=t(560,290,'전문가 시간(로그 눈금)',{size:13,fill:'var(--muted)'});
 H.data.forEach((d,i)=>b+=blink(`<circle cx="${x(d.x)}" cy="${y(d.k/d.n)}" r="5" fill="var(--blue)"/>`,i*.15));
 const curve=[];for(let v=0;v<=11.5;v+=0.25)curve.push([x(v),y(1/(1+Math.exp(-(H.fit.a-H.fit.b*v))))]);b+=poly(curve,'var(--accent)');
 const l50=Math.log2(H.h50),l80=Math.log2(H.hLevel);
 b+=line(`M${x(l50)} ${y(0.5)}V250`,'var(--orange)')+line(`M${x(l80)} ${y(0.8)}V250`,'var(--orange)');
 b+=t(x(l50)+6,y(0.5)-8,`50% 지평 ≈ ${f(H.h50,0)}분`,{a:'start',size:13})+t(x(l80)+6,y(0.8)-8,`80% 지평 ≈ ${f(H.hLevel,0)}분`,{a:'start',size:13});
 b+=pulse(x(l50),y(0.5),7,'var(--orange)');
 return {svg:svg('가상의 과제 열두 묶음의 성공률 점과, 로그 시간에 맞춘 로지스틱 곡선, 그리고 50%와 80% 지평을 표시한 그래프',b),caption:`참 50% 지평이 240분인 가상 모델의 과제 묶음 성공 수에 로지스틱 곡선을 실제로 맞췄습니다. 50% 지평은 약 ${f(H.h50,0)}분이지만 80% 신뢰도를 요구하면 약 ${f(H.hLevel,0)}분으로 다섯 배쯤 짧아집니다.`};
};
/* 12장: 사고 세 건과 통제. */
F.final=()=>{
 const inc=[['사고 1','비용 고리'],['사고 2','숨은 지시'],['사고 3','평가기 변조']],A=M.incident('none','none','none'),Z=M.incident('tool','boundary','firewall');let b='';
 inc.forEach(([a,s],i)=>{const y=40+i*62;b+=box(20,y,160,48,'var(--orange)')+t(100,y+20,a,{size:14,w:700})+t(100,y+40,s,{size:13,fill:'var(--muted)'})+line(`M180 ${y+24}H460`)+dot(186,y+24,268,0,'var(--orange)',i*.5,5)+box(460,y,160,48,'var(--line)')+t(540,y+30,'피해',{size:14});});
 const ctl=['도구별 상한','읽기-쓰기 경계','평가기 방화벽'];
 {const s=t(320,250,`통제 없음: 비용 ${A.cost.toLocaleString('en-US')}달러 · 열린 사고 ${A.open}건`,{size:15,fill:'var(--orange)'});b+=turn(s,0)+turn(s,2);}
 {const s=ctl.map((c,i)=>{const y=40+i*62;return `<path d="M320 ${y+6}V${y+42}" stroke="var(--accent)" stroke-width="5"/>`+t(320,y-2,c,{size:13,fill:'var(--accent)'});}).join('')+t(320,250,`경로를 끊으면: 비용 ${f(Z.cost,0)}달러 · 열린 사고 ${Z.open}건`,{size:15,fill:'var(--accent)'});b+=turn(s,1)+turn(s,3);}
 b+=t(320,282,'통제는 누리가 고칠 수 없는 곳에 둔다',{size:14,fill:'var(--muted)'});
 return {svg:svg('사고 세 건이 각각 피해로 이어지는 길과, 도구별 상한, 읽기-쓰기 경계, 평가기 방화벽이 그 길을 끊는 장면이 번갈아 나오는 그림',b),caption:`사고별 피해를 가정하고 통제 조합의 남은 피해를 계산했습니다. 아무것도 더하지 않으면 비용 ${A.cost.toLocaleString('en-US')}달러에 사고 세 건이 모두 열려 있고, 경로를 끊는 세 통제를 고르면 ${f(Z.cost,0)}달러에 열린 사고가 없습니다.`};
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
