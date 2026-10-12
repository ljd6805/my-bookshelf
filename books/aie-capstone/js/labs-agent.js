/* 1~4장 실험: 재시도와 꼬리 지연, 재계획 예산, pass@k, 꼬리 표집, 역할 팀 비용, UCB 스케줄러. 계산은 A20Math에서 한다. */
(()=>{
'use strict';
const U=A20UI,M=A20Math,R=U.range,S=U.select,F=U.fmt;
const r2=v=>Math.round(v*100)/100;
A20Labs.retry=el=>{
 U.setup(el,R('rt-p','시간 초과 확률 p',0,0.6,0.05,0.2)+R('rt-n','최대 시도 횟수',1,5,1,3)+R('rt-to','시간 초과 길이(초)',1,10,1,5));
 U.bind(el,()=>{const p=r2(U.value(el,'rt-p')),n=U.value(el,'rt-n'),to=U.value(el,'rt-to'),r=M.retryStats(p,n,to);
  U.result(el,U.bars(['기대 지연','p95 지연','최악 지연'],[r.expected,r.p95,r.worst],'초',10,2),
  `시간 초과 확률 ${F(p,2)}, 최대 ${n}번, 시간 초과 ${to}초<br>성공 확률 <strong>${F(r.success,4)}</strong> (모두 실패할 확률 ${F(r.failP,4)})<br>기대 지연 <b>${F(r.expected,2)}초</b> · p95 <b>${F(r.p95,2)}초</b> · 최악 <b>${F(r.worst,2)}초</b> · 기대 호출 수 ${F(r.calls,2)}번<br>주황 점선은 사용자가 기다릴 수 있다고 둔 10초입니다. ${r.worst>10?'최악의 경우가 이 선을 넘으므로 시도 횟수나 시간 초과를 줄이고, 넘기면 사람에게 넘겨주는 길을 둡니다.':'최악의 경우도 이 선 안에 있습니다.'}<br>확률과 지연은 식으로 정확히 계산했습니다. 성공한 호출 0.8초, 재시도 전 대기 0·0.125·0.5·2·8초는 교육용 가정값입니다.`);});
};
A20Labs.replan=el=>{
 U.setup(el,R('rp-p','걸음마다 실패할 확률',0,0.4,0.05,0.1)+R('rp-max','걸음 예산',5,40,1,12));
 U.bind(el,()=>{const p=r2(U.value(el,'rp-p')),b=U.value(el,'rp-max'),r=M.replanBudget(p,b),curve=[];
  for(let x=5;x<=40;x++)curve.push([x,M.replanBudget(p,x).done]);
  U.result(el,U.plot({lines:[{data:curve},{data:[[5,0.9],[40,0.9]],color:'var(--orange)',dashed:true}],points:[[b,r.done,'var(--orange)',6]],xmin:5,xmax:40,ymin:0,ymax:1,xlabel:'걸음 예산',ylabel:'완료 확률 (점선은 0.9)',label:`걸음 예산에 따른 완료 확률. 지금 예산 ${b}에서 ${F(r.done,3)}`}),
  `실패율 ${F(p,2)}, 걸음 예산 ${b}<br>완료 <strong>${F(r.done,3)}</strong> · 재계획 5번을 넘겨 중단 <b>${F(r.abort,3)}</b> · 예산을 다 써서 사람에게 넘겨줌 <b>${F(r.yieldP,3)}</b><br>기대 걸음 수 ${F(r.expSteps,2)} (실패가 없으면 5걸음)<br>${r.abort>0.05?'예산을 늘려도 줄지 않는 몫은 재계획 상한에 걸린 중단입니다.':r.yieldP>0.05?'넘겨주기가 크면 걸음 예산이 계획 길이와 재계획 비용에 비해 빠듯하다는 뜻입니다.':'예산과 상한 모두 여유가 있습니다.'}<br>5걸음 계획, 실패마다 3걸음 추가라는 교육용 가정 위에서 모든 상태의 확률을 정확히 셌습니다.`);});
};
A20Labs.passk=el=>{
 U.setup(el,R('pk-c','10번 중 통과한 횟수 c',0,10,1,3)+R('pk-k','시도 횟수 k',1,10,1,5));
 U.bind(el,()=>{const c=U.value(el,'pk-c'),k=U.value(el,'pk-k'),p=c/10,u=M.passAtK(10,c,k),nv=M.passNaive(p,k),t=M.tryUntilPass(p,k,0.024),a=[],b=[];
  for(let x=1;x<=10;x++){a.push([x,M.passAtK(10,c,x)]);b.push([x,M.passNaive(p,x)]);}
  U.result(el,U.plot({lines:[{data:a},{data:b,color:'var(--blue)',dashed:true}],points:[[k,u,'var(--orange)',6]],xmin:1,xmax:10,ymin:0,ymax:1,xlabel:'시도 횟수 k',ylabel:'pass@k (실선 비편향 · 점선 단순)',label:`k에 따른 pass@k. c ${c}, k ${k}에서 비편향 ${F(u,3)}`}),
  `10번 중 ${c}번 통과 (한 번 통과율 ${F(p,1)}), k = ${k}<br>비편향 pass@k = 1 − C(${10-c},${k})/C(10,${k}) = <strong>${F(u,3)}</strong><br>단순 추정 1 − (1 − ${F(p,1)})^${k} = <b>${F(nv,3)}</b> · 차이 ${F(nv-u,3)}<br>통과할 때까지 최대 ${k}번 차례로 시도하면 기대 시도 ${F(t.expTries,2)}번, 과제당 ${F(t.costPerTask,3)}달러, ${c>0?`통과 한 건당 <b>${F(t.costPerSolved,3)}달러</b>`:'통과가 한 번도 없어 통과 한 건당 비용은 정의되지 않습니다'}<br>pass@k는 식으로 정확히 계산했고, 시도당 0.024달러는 교육용 가정값입니다.`);});
};
A20Labs.tailsample=el=>{
 U.setup(el,S('ts-day','하루 요청 수',[[10000,'1만'],[100000,'10만'],[1000000,'100만']],100000)+R('ts-keep','성공 응답 보관률(%)',0,100,1,10)+R('ts-err','오류 비율(%)',0,10,0.5,2));
 U.bind(el,()=>{const day=U.value(el,'ts-day'),keep=U.value(el,'ts-keep')/100,err=U.value(el,'ts-err')/100,r=M.tailSampling(day,err,keep,0.01),curve=[];
  for(let x=0;x<=100;x+=2)curve.push([x,M.tailSampling(day,err,x/100,0.01).within5]);
  U.result(el,U.plot({lines:[{data:curve},{data:[[0,0.5],[100,0.5]],color:'var(--orange)',dashed:true}],points:[[keep*100,r.within5,'var(--orange)',6]],xmin:0,xmax:100,ymin:0,ymax:1,xlabel:'성공 응답 보관률(%)',ylabel:'5분 안에 발견할 확률',label:`보관률에 따른 5분 안 발견 확률. 지금 ${F(r.within5,3)}`}),
  `하루 ${F(day,0)}건, 오류 ${F(err*100,1)}%는 모두, 성공은 ${F(keep*100,0)}%만 보관<br>하루 보관량 <b>${F(r.stored,0)}건</b> (전체의 ${F(r.share*100,1)}%)<br>${r.badPerHour>0?`보관된 결함 응답 시간당 ${F(r.badPerHour,2)}건 → 첫 발견까지 기대 <strong>${F(r.minutes,1)}분</strong>, 5분 안에 발견할 확률 <strong>${F(r.within5,3)}</strong>`:'성공 응답을 하나도 보관하지 않으므로 성공 응답에 숨은 결함은 <strong>발견할 수 없습니다</strong>'}<br>성공 응답 1%에 조용한 결함이 섞였다는 것은 교육용 가정이고, 발견 시간은 포아송 도착을 가정해 계산했습니다.`);});
};
A20Labs.teamcost=el=>{
 U.setup(el,R('tc-roles','역할 수',1,6,1,4)+R('tc-team','팀의 해결률',0.05,1,0.05,0.6)+S('tc-single','단일 에이전트 해결률',[[0.1,'0.1'],[0.25,'0.25'],[0.5,'0.5']],0.25));
 U.bind(el,()=>{const n=U.value(el,'tc-roles'),ts=r2(U.value(el,'tc-team')),ss=U.value(el,'tc-single'),r=M.teamCost(n,ts,ss);
  U.result(el,U.bars(['단일 에이전트','역할 팀'],[r.single,r.team],'달러 / 해결 1건',null,3),
  `단일: 40턴, 해결률 ${F(ss,2)} → 해결당 <b>${F(r.single,3)}달러</b><br>팀: 역할 ${n}개가 각자 40턴, 모두 ${r.teamTurns}턴, 해결률 ${F(ts,2)} → 해결당 <b>${F(r.team,3)}달러</b> (단일의 ${F(r.ratio,2)}배)<br>손익분기 해결률 = 역할 수 × 단일 해결률 = <strong>${F(r.breakEven,2)}</strong>. ${r.breakEven>1?'1을 넘으므로 팀은 모든 문제를 풀어도 해결당 비용에서 이길 수 없습니다.':r.breakEven===1?'정확히 1이라 팀은 모든 문제를 풀어야 겨우 같은 비용이 됩니다.':ts>r.breakEven?'팀의 해결률이 이 값을 넘어 해결당 비용이 더 낮습니다.':'팀의 해결률이 이 값보다 낮아 해결당 비용이 더 높습니다.'}<br>턴당 0.02달러, 역할마다 같은 턴 수는 교육용 가정값이고, 나눗셈은 실제 계산입니다.`);});
};
A20Labs.ucb=el=>{
 U.setup(el,R('ucb-c','탐험 가중치 c',0,3,0.1,1.4)+R('ucb-b','실험 예산(번)',8,60,1,30));
 U.bind(el,()=>{const c=r2(U.value(el,'ucb-c')),b=U.value(el,'ucb-b'),r=M.ucbRun(c,b),names=['A','B','C','D'];
  const labels=names.map((x,i)=>`갈래 ${x} (참 ${F(M.UCB_MEANS[i],2)})${r.pruned[i]?' · 가지침':''}`);
  const first=r.trigger.map((t,i)=>t?`${names[i]}(${t}번째)`:'').filter(Boolean);
  U.result(el,U.bars(labels,r.runs,'실행 횟수',null,0),
  `c = ${F(c,1)}, 예산 ${b}번<br>갈래별 실행 ${r.runs.join(' · ')} · 관찰 평균 ${r.means.map(m=>F(m,2)).join(' · ')}<br>가장 좋은 갈래 D에 쓴 비율 <strong>${F(r.bestShare*100,0)}%</strong> · 후회(늘 D만 했을 때와의 차이) <b>${F(r.regret,2)}</b><br>논문 신호(평균 0.7 이상): ${first.length?first.join(', '):'아직 없음'} · 가지친 갈래: ${r.pruned.some(Boolean)?names.filter((_,i)=>r.pruned[i]).join(', '):'없음'}<br>참 평균과 잡음 폭 ±0.25는 교육용 가정값이고, 시드 7로 고정한 시뮬레이션이라 같은 설정은 같은 결과를 냅니다.`);});
};
})();
