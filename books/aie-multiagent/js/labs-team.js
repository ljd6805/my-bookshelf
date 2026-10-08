/* 1~4장 실험: 한 에이전트의 천장, A2A 수명주기, 세 지휘 방식, 반장과 조사원, 층마다 흐려지는 뜻. 계산은 A17Math에서 한다. */
(()=>{
'use strict';
const U=A17UI,M=A17Math,R=U.range,S=U.select,F=U.fmt;
const sub=t=>`<h4 class="a17-sub">${t}</h4>`;
const k=n=>F(n/1000,1)+'k';

A17Labs.ceiling=el=>{
 U.setup(el,R('docs','읽어야 할 문서 수',1,60,1,12)+S('doctok','문서 하나의 길이(토큰, 가정값)',[[3000,'3,000 (짧은 기사)'],[7000,'7,000 (보고서 한 장)'],[15000,'15,000 (긴 보고서)']],7000));
 U.bind(el,()=>{const n=U.value(el,'docs'),d=U.value(el,'doctok'),r=M.ceiling(n,d);
  U.result(el,sub('가장 큰 문맥 하나의 크기(천 토큰), 점선은 창 200k')+U.bars(['혼자 하는 에이전트','조사원 한 명(최대)','반장'],[r.single,r.workerCtx,r.leadCtx].map(x=>x/1000),'천 토큰',r.window/1000,1),
  `문서 ${n}개 × ${F(d,0)}토큰 · 도구 호출 <b>${r.calls}번</b><br>혼자 하면 문맥 <strong>${k(r.single)}</strong>${r.overflow?' · <b>창 200k를 넘었습니다</b>':''} · 걸리는 시간 <b>${r.singleTime}초</b><br>조사원 <b>${r.workers}명</b>으로 나누면 가장 큰 조사원 문맥 <b>${k(r.workerCtx)}</b>, 반장 문맥 <b>${k(r.leadCtx)}</b>, 걸리는 시간 <b>${r.multiTime}초</b><br>전체 토큰은 혼자 ${k(r.singleTotal)}, 팀 ${k(r.multiTotal)}로 팀이 ${F(r.multiTotal/r.singleTotal,2)}배입니다. 이 길이의 문서는 ${r.firstOverflow}개부터 창을 넘습니다.<br>원본의 경험칙(도구 호출 20번 미만, 10만 토큰 이하)으로는 <strong>${r.stay?'혼자 하는 편':'나누어 볼 만한 일'}</strong>입니다. 토큰과 시간 상수는 이 책의 가정값이고, 합계는 그 가정으로 실제 계산했습니다.`);});
};

const STATE_KO={SUBMITTED:'접수됨',WORKING:'작업 중',INPUT_REQUIRED:'입력 필요',AUTH_REQUIRED:'인증 필요',COMPLETED:'완료',FAILED:'실패',CANCELED:'취소',REJECTED:'거절'};
const SCN=[['happy','바로 끝나는 작업'],['input','중간에 질문하는 작업'],['auth','인증을 거친 뒤 실패'],['reject','거절된 뒤 다시 시작 시도'],['late','끝난 뒤 산출물을 더 보냄'],['cancel','입력 대기 중 취소']];
A17Labs.lifecycle=el=>{
 U.setup(el,S('scenario','사건 묶음',SCN,'input')+R('step','넣은 사건 수',0,4,1,4));
 U.bind(el,()=>{const s=U.text(el,'scenario'),ev=M.TASK_SCENARIOS[s],n=U.value(el,'step'),r=M.taskRun(ev,n);
  const items=[['시작','작업이 <b>접수됨</b>(SUBMITTED) 상태로 만들어집니다.']].concat(r.history.map((h,i)=>[`사건 ${i+1} · ${h.event}`,h.ok?`${STATE_KO[h.from]}에서 받아들여 <b>${STATE_KO[h.to]}</b>이 됩니다.`:`${STATE_KO[h.from]}에서는 받을 수 없어 거절합니다. 상태는 그대로입니다.`]));
  const next=M.TASK_NEXT[r.state].map(x=>STATE_KO[x]).join(', ');
  U.result(el,U.cards(items,items.length-1),
  `이 묶음의 사건 ${ev.length}개 중 <b>${Math.min(n,ev.length)}개</b>를 넣었습니다.<br>현재 상태 <strong>${STATE_KO[r.state]} (${r.state})</strong> · 거절된 사건 <b>${r.rejected}개</b><br>${r.terminal?'끝 상태입니다. 이 작업은 더 이상 사건을 받지 않으므로, 후속 요청은 새 작업으로 보내야 합니다.':`여기서 받을 수 있는 다음 상태: ${next}.`}<br>전이표는 원본 레슨이 그린 A2A 작업 수명주기를 단순화한 것이고, 판정은 그 표로 실제 계산했습니다.`);});
};

A17Labs.orchestra=el=>{
 U.setup(el,R('early','에이전트가 일찍 끝낼 확률 p',0,0.6,0.05,0.2));
 U.bind(el,()=>{const p=U.value(el,'early'),r=M.orchestra(p),names=['고정 순서','손넘김','선택자 LLM'],o=[r.static,r.handoff,r.selector];
  el.querySelector('#early-value').textContent=F(p,2);
  U.result(el,sub('검토 단계에 닿을 확률(%)')+U.bars(names,o.map(x=>x.review*100),'%',null,1)+sub('작업 하나에 드는 모델 호출 수(평균)')+U.bars(names,o.map(x=>x.calls),'번',null,2),
  `p = <b>${F(p,2)}</b><br>고정 순서는 조사, 작성, 검토를 늘 차례로 부르므로 호출 <b>3번</b>, 검토 도달 <b>100%</b>입니다.<br>손넘김은 각 에이전트가 다음 차례를 정하므로 검토 도달이 (1−p)² = <strong>${F(r.handoff.review*100,1)}%</strong>, 평균 호출 <b>${F(r.handoff.calls,2)}번</b>입니다.<br>선택자 LLM은 검토까지 가지만 매 차례 고르는 호출이 붙어 평균 <b>${F(r.selector.calls,2)}번</b>(선택 정확도 0.9 가정)입니다.<br>p와 0.9는 가정값이고, 확률과 기대 호출 수는 그 가정으로 정확히 계산했습니다.`);});
};

A17Labs.fanout=el=>{
 U.setup(el,R('workers','조사원 수 K',1,10,1,3)+S('spawn','조사원 하나를 띄우는 비용(분, 가정값)',[[0,'0분'],[1,'1분'],[3,'3분']],1));
 U.bind(el,()=>{const K=U.value(el,'workers'),sp=U.value(el,'spawn'),r=M.fanout(K,sp),best=M.bestFanout(sp),pts=[];
  for(let i=1;i<=10;i++)pts.push([i,M.fanout(i,sp).time]);
  U.result(el,U.plot({lines:[{data:pts},{data:[[1,r.serial],[10,r.serial]],color:'var(--orange)',dashed:true}],points:[[K,r.time,'var(--orange)',7],[best.k,best.time,'var(--blue)',5]],xmin:1,xmax:10,ymin:0,ymax:120,xlabel:'조사원 수 K',ylabel:'끝날 때까지 걸린 시간(분)',label:`조사원 수에 따른 완료 시간. 지금 K ${K}에서 ${r.time}분, 혼자 하면 ${r.serial}분`}),
  `K = <b>${K}</b>, 띄우기 비용 ${sp}분<br>완료 시간 = 계획 5 + 띄우기 ${sp}×${K} + 가장 바쁜 조사원 ${r.makespan} + 종합 3 + ${K} = <strong>${r.time}분</strong> (혼자 차례로 하면 ${r.serial}분, 주황 점선)<br>조사원별 일 ${r.load.join(', ')}분 · 이 비용에서 가장 빠른 K는 <b>${best.k}명(${best.time}분)</b>입니다(파란 점).<br>전체 토큰 <b>${F(r.tokens,0)}</b> · 반장 문맥 ${F(r.leadCtx,0)} · 가장 큰 조사원 문맥 ${F(r.maxWorkerCtx,0)}<br>하위 질문 10개의 소요 시간과 토큰은 가정값이고, 배분(긴 일부터 빈 조사원에게)과 합계는 실제 계산입니다.`);});
};

A17Labs.drift=el=>{
 U.setup(el,R('depth','계층 깊이 d',1,4,1,2)+R('misread','한 번 건널 때 뜻이 어긋날 확률 e',0,0.3,0.01,0.1)+S('canary','카나리아 조사원',[['off','없음'],['on','있음 (원래 질문을 그대로 받음)']],'off'));
 U.bind(el,()=>{const d=U.value(el,'depth'),e=U.value(el,'misread'),c=U.text(el,'canary')==='on',r=M.drift(d,e,c);
  el.querySelector('#misread-value').textContent=F(e,2);
  U.result(el,U.bars(['뜻이 그대로 남음','어긋났지만 알아챔','어긋난 채 모름'],[r.keep,r.caught,r.silent].map(x=>x*100),'%',null,1),
  `깊이 ${d}이면 질문이 ${d}번 내려가고 요약이 ${d}번 올라와 <b>${r.passes}번</b> 건넙니다.<br>충실도 (1−e)^${r.passes} = (1−${F(e,2)})^${r.passes} = <strong>${F(r.keep*100,1)}%</strong> · 어긋날 확률 <b>${F(r.bad*100,1)}%</b><br>${c?`카나리아가 어긋남의 80%를 알아채(가정값) 모른 채 남는 몫은 <b>${F(r.silent*100,1)}%</b>입니다.`:'카나리아가 없으면 어긋난 결과를 그대로 받아 씁니다.'}<br>e와 알아챌 확률은 가정값이고, 거듭제곱은 실제 계산입니다.`);});
};
})();
