/* 10~12장 실험: 의미 캐시 임계값, 프롬프트 캐시 배수, 상태 그래프 실행, 출시 2주 차 청구서. 계산은 A12Math. */
(()=>{
'use strict';
const U=A12UI,M=A12Math,F=U.fmt,R=U.range,S=U.select;

A12Labs.semcache=el=>{
 U.setup(el,R('sc-thr','유사도 임계값',0.85,0.99,0.01,0.92));
 U.bind(el,()=>{const th=U.value(el,'sc-thr'),r=M.semCache(th),esc=U.esc;
  const rows=M.SEM_PAIRS.map((p,i)=>{const hit=r.hit[i],st=hit?(p[3]?['good','✓ 적중']:['bad','✕ 잘못된 적중']):(p[3]?['miss','· 놓침']:['skip','— 새로 답함']);return `<div class="a12-pair ${st[0]}"><span>${esc(p[0])}<small>캐시: ${esc(p[1])}</small></span><b>${F(p[2],2)}</b><em>${st[1]}</em></div>`;}).join('');
  U.result(el,`<div class="a12-pairs" role="list" aria-label="질문 쌍 12개와 유사도, 판정">${rows}</div>`,
  `임계값 <b>${F(th,2)}</b>: 캐시로 답한 질문 <strong>${r.hits}/${r.total}</strong> (적중률 ${F(r.hitRate*100,0)}%) · 그중 잘못된 적중 <b>${r.wrong}건</b> · 같은 답을 원했는데 놓친 질문 <b>${r.missed}건</b><br>`+
  (r.wrong>0?'잘못된 적중은 "환불"과 "반품", "전자책"과 "종이책"처럼 낱말 하나로 답이 달라지는 질문에서 생깁니다. 틀린 답을 가장 빠르게 전하는 실패입니다.':'잘못된 적중은 사라졌지만 같은 뜻의 질문도 그만큼 놓쳐 비용 절감이 줄었습니다.')+
  ` 원본 레슨은 보통 0.92~0.95를 출발점으로 소개합니다.<br>질문 쌍과 유사도는 교육용으로 정한 값이며, 판정은 그 값으로 실제 계산한 결과입니다.`);});
};

A12Labs.promptcache=el=>{
 U.setup(el,R('pc-reads','쓰기 1번 뒤 읽기 횟수 r',0,20,1,10)+S('pc-provider','캐시 방식',Object.entries(M.PROVIDERS).map(([k,p])=>[k,p.name]),'a5')+S('pc-layout','프롬프트 배치',[['stable','바뀌지 않는 부분을 앞에'],['timestamp','현재 시각을 맨 위에']],'stable')+S('pc-prefix','접두부 길이 (토큰)',[['800','800'],['4000','4,000'],['15000','15,000']],'15000'));
 U.bind(el,()=>{const r=U.value(el,'pc-reads'),pv=U.text(el,'pc-provider'),lay=U.text(el,'pc-layout'),pre=Number(U.text(el,'pc-prefix')),c=M.promptCache(r,pv,lay,pre),P=M.PROVIDERS[pv];
  const lines=Object.keys(M.PROVIDERS).map((k,i)=>({data:Array.from({length:21},(_,x)=>[x,M.promptCache(x,k).mult]),color:['var(--accent)','var(--blue)','var(--orange)'][i],dashed:k!==pv}));
  U.result(el,U.plot({lines,points:[[r,c.mult,'var(--orange)',7]],xmin:0,xmax:20,ymin:0,ymax:2.1,xlabel:'읽기 횟수 r',ylabel:'접두부 평균 비용 배수',label:`세 캐시 방식의 읽기 횟수별 비용 배수. 실선이 지금 고른 방식이며 현재 점은 ${F(c.mult,3)}배`}),
  `${P.name}: 쓰기 ${P.write}배, 읽기 ${P.read}배 · 평균 비용 배수 <strong>${F(c.mult,3)}배</strong> (${c.saving>=0?`${F(c.saving*100,1)}% 절약`:`${F(-c.saving*100,1)}% 더 냄`})<br>`+
  `요청 한 건의 입력 환산 ${F(c.effective,0)}토큰 (캐시 없으면 ${F(c.plain,0)}토큰, 끝의 질문 200토큰은 매번 정가)<br>`+
  (pre<P.min?`접두부가 최소 길이 ${F(P.min,0)}토큰보다 짧아 캐시되지 않습니다.`:lay==='timestamp'?'맨 위의 시각이 요청마다 달라 접두부가 한 번도 일치하지 않습니다. 매번 쓰기만 하고 읽기는 없으므로 '+(P.write>1?'할증만 냅니다.':'할인을 받지 못합니다.'):r===0?'쓰기만 하고 다시 읽지 않으면 할증만 냅니다. 원본 레슨은 수명 안에 세 번 이상 다시 쓸 접두부를 캐시하라고 권합니다.':'바뀌지 않는 부분을 앞에 두어 읽을 때마다 할인을 받습니다.')+
  `<br>배수는 원본 커리큘럼 기준(확인일 2026-10-08, 1시간 쓰기 2배는 Anthropic 공식 문서로 바로잡음)이며, 이 배수로 실제 계산한 값입니다.`);});
};

A12Labs.graph=el=>{
 U.setup(el,R('gr-step','체크포인트 번호',0,7,1,0)+S('gr-reducer','messages 리듀서',[['add','덧붙이기 (add_messages)'],['overwrite','지정 안 함 (덮어쓰기)']],'add')+S('gr-interrupt','승인 멈춤 위치',[['before','환불 실행 앞'],['after','환불 실행 뒤'],['none','멈춤 없음']],'before'));
 U.bind(el,()=>{const snaps=M.graphRun(U.text(el,'gr-reducer'),U.text(el,'gr-interrupt')),k=Math.min(U.value(el,'gr-step'),snaps.length-1),s=snaps[k];
  const label={START:'시작',agent:'모델',tools:'도구',review:'승인 대기',refund:'환불 실행',END:'끝'};
  U.result(el,U.cards(snaps.map(x=>[label[x.node],x.note]),k),
  `체크포인트 <b>${s.checkpoint}</b> · 노드 <b>${label[s.node]}</b> · 메시지 <strong>${s.messages}개</strong> · 환불 <b>${s.refunded?'완료':'아직'}</b>${s.paused?' · <b>멈춤</b>':''}<br>`+
  (s.paused&&s.refunded?'승인을 묻는 시점에 환불은 이미 실행되었습니다. 멈춤은 되돌릴 수 없는 노드 앞에 두어야 합니다.':s.paused?'환불 실행 직전에 멈췄습니다. 상태는 체크포인트에 저장되어 있어, 사람이 승인하면 같은 thread_id로 이어서 실행합니다.':s.messages===1&&k>1?'덮어쓰기 리듀서 때문에 이전 대화가 사라지고 마지막 메시지 하나만 남았습니다. 오류는 나지 않습니다.':k>=snaps.length-1?(snaps.some(x=>x.paused)?'끝까지 실행했습니다. 모든 체크포인트에서 시간 여행으로 다시 갈라질 수 있습니다.':'멈춤 없이 끝까지 실행되었습니다. 사람이 환불을 확인할 틈이 없었습니다.'):'노드를 지날 때마다 상태가 저장됩니다.')+
  `<br>LangGraph를 실행하지 않고 그 규칙을 따라 미리 정한 시나리오입니다. 이 설정의 체크포인트는 0~${snaps.length-1}번입니다.`);});
};

A12Labs.capstone=el=>{
 U.setup(el,R('cp-hit','의미 캐시 적중률 (%)',0,90,1,8)+R('cp-mini','작은 모델로 보내는 비율 (%)',0,90,5,0)+R('cp-dau','하루 활성 사용자',1000,50000,1000,10000));
 U.bind(el,()=>{const hit=U.value(el,'cp-hit')/100,mini=U.value(el,'cp-mini')/100,dau=U.value(el,'cp-dau'),r=M.monthlyCost({dau,hit,mini}),over=r.total>8000;
  U.result(el,U.bars(['큰 모델','작은 모델','한 달 합계'],[r.strong,r.cheap,r.total],'달러',8000,0),
  `요청 ${F(r.requests,0)}건/월 중 LLM 호출 ${F(r.calls,0)}건 · 한 달 <strong>$${F(r.total,0)}</strong> (요청당 ${F(r.perRequest*100,3)}센트) · 예산 $8,000 ${over?`<b>초과 $${F(r.total-8000,0)}</b>`:`<b>안 · 여유 $${F(8000-r.total,0)}</b>`}<br>`+
  (mini>0?`작은 모델 ${F(mini*100,0)}%는 비용을 줄이지만 그 답의 품질은 이 식에 없습니다. 8장의 평가 세트로 큰 모델과의 차이를 재야 합니다. `:'')+
  (hit>0.35?'적중률을 높일수록 10장의 잘못된 적중도 함께 재야 합니다. ':hit<0.1?'적중률이 낮다면 임계값 변경 전후의 적중·잘못된 적중·놓침을 먼저 비교하세요. ':'')+
  (r.perRequest>0.01?'요청당 1센트를 넘어 원본 레슨의 단위 경제 목표를 벗어납니다.':'요청당 비용은 원본 레슨의 목표(1센트 미만) 안에 있습니다.')+
  '<br>원본 레슨의 계산 예시 단가(원본 커리큘럼 기준, 확인일 2026-10-08)로 실제 계산했습니다. 품질, 지연, 잘못된 적중은 계산하지 않습니다.');});
};
})();
