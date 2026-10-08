/* 1~3장 실험: 에이전트 루프, ReAct·ReWOO 토큰 비용, UCT 선택, Reflexion 재시도. 계산은 A15Math에서 한다. */
(()=>{
'use strict';
const U=A15UI,M=A15Math,S=U.select,R=U.range;
const pct=x=>`${U.fmt(x*100,1)}%`;

A15Labs.loop=el=>{
 U.setup(el,S('loop-scn','대본 (가짜 모델의 생각과 행동)',[['normal','정상 대본'],['error','도구 오류가 한 번 나는 대본'],['stuck','같은 행동을 반복하는 대본']],'normal')+R('loop-max','턴 예산 max_turns',1,12,1,6));
 U.bind(el,()=>{
  const scn=U.text(el,'loop-scn'),max=U.value(el,'loop-max'),r=M.agentLoop(scn,max);
  const items=r.turns.map(x=>[`턴 ${x.n} · ${x.action}`,x.finish?'완료 선언':/^오류 \d/.test(x.observation)?'오류 관찰':'관찰',x.observation,!/^오류 \d/.test(x.observation)]);
  const why=r.stop==='finish'?`대본이 ${r.turns.length}턴째에 finish를 내어 정상 종료했습니다.`:scn==='stuck'?'같은 검색만 되풀이해 완료 선언이 나오지 않았고, 턴 예산이 반복을 끊었습니다.':`이 대본은 ${r.needed}턴이 필요하지만 예산이 ${max}턴이라 답 없이 멈췄습니다. 지금까지의 기록은 남습니다.`;
  U.result(el,U.rows(items,`턴 ${r.turns.length}개의 생각, 행동, 관찰 기록`,'루프 기록'),
  `멈춤 이유: <strong>${r.stop==='finish'?'완료 선언 (finish)':'턴 예산 소진 (max_turns)'}</strong> · 사용한 턴 ${r.turns.length}/${max} · 도구 호출 ${r.toolCalls}회 · 오류 관찰 ${r.errors}회<br>${why}${r.errors?' 400 오류는 예외가 아니라 관찰로 돌아가 다음 턴에 인자를 고쳤습니다.':''}<br>생각과 도구 결과는 미리 정한 대본(시나리오)이고, 멈춤 판정은 실제 루프 코드가 계산합니다.`);
 });
};

A15Labs.tokens=el=>{
 U.setup(el,R('tok-n','도구를 쓰는 단계 수 n',1,20,1,8));
 U.bind(el,()=>{
  const n=U.value(el,'tok-n'),r=M.tokenCost(n),xs=[...Array(20)].map((_,i)=>i+1);
  const chart=U.plot({lines:[{data:xs.map(k=>[k,M.tokenCost(k).react/1000]),color:'var(--orange)'},{data:xs.map(k=>[k,M.tokenCost(k).rewoo/1000])}],points:[[n,r.react/1000,'var(--orange)'],[n,r.rewoo/1000,'var(--accent)']],xmin:1,xmax:20,ymin:0,ymax:45,xlabel:'단계 수 n',ylabel:'입력 토큰 합 (천)',label:`단계 ${n}개에서 ReAct ${r.react} 토큰, ReWOO ${r.rewoo} 토큰`});
  U.result(el,chart,`ReAct(주황): 호출 ${r.reactCalls}번, 입력 토큰 <strong>${r.react.toLocaleString('en-US')}</strong> · ReWOO(강조색): 호출 ${r.rewooCalls}번, 입력 토큰 <strong>${r.rewoo.toLocaleString('en-US')}</strong><br>ReAct가 <b>${U.fmt(r.ratio,2)}배</b> 많습니다. ReAct는 k번째 호출에 앞선 k단계의 기록을 모두 다시 싣기 때문에 단계 수의 제곱에 가깝게 늘고, ReWOO는 단계마다 짧은 작업자 호출만 더합니다.<br>식은 실제 계산이고 토큰 수(기본 프롬프트 600, 단계 기록 150, 작업자 80, 증거 100)는 교육용 가정값입니다. 논문의 약 5배 절감과 직접 비교하는 숫자가 아닙니다.`);
 });
};

A15Labs.uct=el=>{
 U.setup(el,R('uct-c','탐색 상수 c',0,2,0.1,0));
 U.bind(el,()=>{
  const c=U.value(el,'uct-c'),r=M.uct(M.HYPOTHESES,c),best=r.scores[r.choice];
  const chart=U.bars(r.scores.map(x=>x.name),r.scores.map(x=>x.score),'UCT 점수',null,3);
  const lines=r.scores.map(x=>`${x.name}: Q ${U.fmt(x.q,2)} + 탐색 ${U.fmt(x.explore,3)} = ${U.fmt(x.score,3)} (확인 ${x.n}회)`).join('<br>');
  U.result(el,chart,`다음에 확인할 가설: <strong>${best.name}</strong> (총 확인 N = ${r.N})<br>${lines}<br>${c===0?'c가 0이면 평균 보상만 보므로 지금까지 가장 좋았던 가설만 계속 팝니다.':'c가 커질수록 적게 확인한 가설에 붙는 가산점 √(ln N / n)이 커집니다.'}<br>UCT 식은 실제 계산이고, 세 가설의 평균 보상과 확인 횟수는 교육용 가정값입니다.`);
 });
};

A15Labs.reflexion=el=>{
 U.setup(el,S('ref-eval','평가 신호',Object.entries(M.EVALUATORS).map(([k,v])=>[k,v.label]),'scalar')+R('ref-trials','시도 횟수',1,8,1,3));
 U.bind(el,()=>{
  const ev=U.text(el,'ref-eval'),T=U.value(el,'ref-trials'),r=M.reflexion(ev,T);
  const chart=U.plot({lines:[{data:r.rows.map(x=>[x.trial,x.p]),color:'var(--blue)',dashed:true},{data:r.rows.map(x=>[x.trial,x.cumulative])}],points:r.rows.map(x=>[x.trial,x.cumulative,'var(--accent)',4]),xmin:1,xmax:8,ymin:0,ymax:1,xlabel:'시도',ylabel:'성공 확률',label:`${M.EVALUATORS[ev].label}로 ${T}번 시도하면 누적 성공 ${pct(r.final)}`});
  U.result(el,chart,`${M.EVALUATORS[ev].label} · 시도 ${T}회 뒤 누적 성공 <strong>${pct(r.final)}</strong> · 시도마다 성공 확률 +${U.fmt(r.delta*100,0)}%p<br>점선은 시도별 성공 확률, 실선은 한 번이라도 성공할 확률입니다. ${r.delta?'좋은 평가 신호일수록 반성이 다음 시도를 더 많이 고칩니다.':'반성이 없어도 여러 번 시도하면 우연히 성공할 확률은 오르지만, 시도마다의 확률은 그대로입니다.'}<br>시나리오 모형입니다. 처음 30%, 상한 90%, 신호별 상승폭은 질 차이를 보이려고 정한 가정값이며 논문의 수치가 아닙니다.`);
 });
};
})();
