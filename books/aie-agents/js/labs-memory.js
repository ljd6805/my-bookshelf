/* 4~6장 실험: 주 문맥과 외부 기억, 융합 점수, 워크플로 패턴 비용, 음성 지연 예산. 계산은 A15Math에서 한다. */
(()=>{
'use strict';
const U=A15UI,M=A15Math,S=U.select,R=U.range;

const HOW={window:'창 안에 있음',core:'핵심 블록',archival:'검색으로 회상',lost:'밀려나 잊음'};
A15Labs.window=el=>{
 U.setup(el,R('win-w','주 문맥 창 크기 (사실 칸 수)',3,12,1,4)+S('win-mode','기억 방식',[['window','창만 (오래된 것부터 밀려남)'],['paging','창 + 외부 기억 검색'],['core','핵심 블록에 규칙 2개 고정']],'window'));
 U.bind(el,()=>{
  const w=U.value(el,'win-w'),mode=U.text(el,'win-mode'),r=M.memoryRecall(w,mode);
  const items=r.rows.map(x=>[x.text,HOW[x.how],x.calls?'도구 1회':'호출 없음',x.how!=='lost']);
  U.result(el,U.rows(items,`질문 여섯 개에 대한 회상 결과, ${r.answered}개 답함`,'마지막에 묻는 질문 6개'),
  `답한 질문 <strong>${r.answered}/6</strong> · 기억 도구 호출 <b>${r.calls}회</b> · 흘러가는 사실에 남은 칸 ${r.room}개<br>${mode==='window'?'창 밖으로 밀려난 사실은 모델이 볼 수 없어 답하지 못합니다.':mode==='paging'?'밀려난 사실도 외부 기억에서 찾아오지만, 찾을 때마다 도구 호출 한 번이 듭니다.':'승인 규칙과 읽기 전용 규칙은 늘 보이지만, 그만큼 흘러가는 사실의 칸이 줄어듭니다.'}<br>사실이 한 턴에 하나씩 들어오는 순서와 밀려나는 규칙은 실제 계산이고, 사실 열두 개는 당직 도우미 시나리오입니다.`);
 });
};

A15Labs.fusion=el=>{
 U.setup(el,R('fus-rec','최신도 가중치 w_rec (w_rel = 0.8 − w_rec, w_imp = 0.2)',0,0.8,0.05,0.2));
 U.bind(el,()=>{
  const r=M.fusion(U.value(el,'fus-rec')),top=r.rows[0];
  const chart=U.bars(r.rows.map(x=>x.id),r.rows.map(x=>x.score),'융합 점수',null,3);
  const lines=r.rows.map((x,i)=>`${i+1}위 ${x.id} “${x.text}” · 관련도 ${x.rel} · 중요도 ${x.imp} · ${x.ageDays}일 전 (최신도 ${U.fmt(x.recency,3)}) → <b>${U.fmt(x.score,3)}</b>`).join('<br>');
  U.result(el,chart,`가중치 관련도 ${U.fmt(r.wRel,2)} · 중요도 ${U.fmt(r.wImp,2)} · 최신도 ${U.fmt(r.wRec,2)} · 1위 <strong>${top.id}</strong><br>${lines}<br>${top.id==='r1'?'관련도가 높은 오래된 사실(담당 팀)이 위에 옵니다.':'방금 생긴 변경 사항이 위로 올라옵니다. 대화형 에이전트일수록 최신도를 높게 둡니다.'} 반감기 1일, 융합식은 원본 레슨 코드와 같은 실제 계산이고 기억 세 건의 값은 교육용 가정값입니다.`);
 });
};

const TASKN={known:'단계가 정해진 일',types:'종류마다 처리가 다른 경보',independent:'서로 독립인 원천 여러 개',unknown:'볼 원천을 그때 정해야 하는 일',quality:'기준에 맞을 때까지 다듬는 보고서'};
const WHY={chain:'단계를 미리 셀 수 있어 출력을 다음 입력으로 넘기면 됩니다.',routing:'분류 한 번으로 알맞은 처리로 보내면 됩니다.',parallel:'원천끼리 상관없으니 동시에 돌려 모으면 가장 빠릅니다.',orchestrator:'무엇을 볼지 미리 모르니 오케스트레이터가 작업자를 그때 고릅니다.',evaluator:'평가 기준이 분명하니 평가자가 통과시킬 때까지 고칩니다.'};
A15Labs.patterns=el=>{
 U.setup(el,R('pat-k','살펴볼 로그 원천 수 k',1,8,1,3)+S('pat-task','일의 성격',Object.entries(TASKN),'independent'));
 U.bind(el,()=>{
  const k=U.value(el,'pat-k'),task=U.text(el,'pat-task'),rec=M.TASKS[task],rows=M.patternCost(k),pick=rows.find(r=>r.id===rec);
  const items=rows.map(r=>[r.name,r.id===rec?'맞음':'덜 맞음',`호출 ${r.calls} · ${r.seconds}초`,r.id===rec]);
  U.result(el,U.rows(items,`${TASKN[task]}에 맞는 패턴은 ${pick.name}`,'패턴별 호출 수와 기다리는 시간'),
  `“${TASKN[task]}”에 맞는 패턴: <strong>${pick.name}</strong> · 호출 ${pick.calls}번 · 기다리는 시간 ${pick.seconds}초<br>${WHY[rec]} 원천이 ${k}개일 때 프롬프트 연결은 ${rows[0].seconds}초, 병렬화는 ${rows[2].seconds}초입니다.<br>호출 수와 시간은 교육용 모형(호출 1회 2초, 평가자-최적화 2회 반복)으로 계산했고, 일과 패턴의 짝은 원본 레슨 12의 기준을 옮긴 규칙입니다.`);
 });
};

const BAND={premium:'최상급 (≤600ms)',slower:'조금 느림 (600~800ms)',common:'흔한 수준 (800~1200ms)',slow:'느림 (1200~1500ms)',broken:'고장 난 것처럼 느껴짐 (>1500ms)'};
A15Labs.voice=el=>{
 U.setup(el,R('voice-llm','LLM 첫 토큰 시간 (ms)',100,800,50,300)+S('voice-stack','나머지 구간 구성',[['fast','빠른 구성 (각 범위의 낮은 끝)'],['slow','느린 구성 (각 범위의 높은 끝)']],'fast'));
 U.bind(el,()=>{
  const llm=U.value(el,'voice-llm'),r=M.voiceLatency(llm,U.text(el,'voice-stack'));
  const chart=U.bars(r.parts.map(p=>p[0]),r.parts.map(p=>p[1]),'ms',null,0);
  U.result(el,chart,`총 지연 <strong>${r.total}ms</strong> · 체감 구간: <b>${BAND[r.band]}</b><br>${r.parts.map(p=>`${p[0]} ${p[1]}`).join(' + ')} = ${r.total}ms. ${r.band==='premium'?'사람끼리 대화하는 듯한 반응입니다.':'LLM 몫만 줄여서는 모자랄 수 있으니 다른 구간도 함께 봅니다.'}<br>실제 덧셈입니다. 구간 값은 원본 레슨 22의 2026년 전형 범위이고 체감 구간 경계는 원본 기준(확인일 2026-10-08)이며, 600~800ms와 1200~1500ms 구간 이름은 이 책이 붙였습니다.`);
 });
};
})();
