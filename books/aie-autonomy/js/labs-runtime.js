/* 6~9장 실험: 권한 모드, 간접 주입과 방어, 재생, 제안-확정, 겹 상한, EWMA와 고정 한도.
   계산과 판정 규칙은 A16Math에 있고 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=A16UI,M=A16Math,R=U.range,S=U.select,F=U.fmt;
const word={ask:'사람에게 묻기',auto:'자동 실행',deny:'거절'};

A16Labs.ladder=el=>{
 U.setup(el,S('mode','권한 모드',[['plan','plan · 모든 행동 검토'],['default','default(Manual) · 읽기만 자동, 나머지는 묻기'],['acceptEdits','acceptEdits · 파일 쓰기 자동'],['auto','auto · 분류기가 행동 검토'],['dontAsk','dontAsk · 허락 안 된 것은 거절'],['bypass','bypassPermissions · 모두 허락']],'auto')+S('ws','작업 공간',[['repo','실제 저장소(운영 자격 증명 있음)'],['container','일회용 컨테이너(가짜 자격 증명)']],'repo'));
 U.bind(el,()=>{const m=U.text(el,'mode'),w=U.text(el,'ws'),r=M.ladder(m,w);
  const rows=r.rows.map((a,i)=>[`${i+1}. ${a.name}`,a.risky?'위험':'일상',a.d==='auto'?`<b>${word[a.d]}</b>`:word[a.d]]);
  U.result(el,U.table(['누리의 행동','종류','판정'],rows,`${m} 모드에서 하룻밤 행동 여덟 개의 판정`),
  `모드 <b>${m}</b> · 사람에게 묻는 횟수 <strong>${r.asks}</strong>번, 자동 실행된 위험 행동 <strong>${r.riskyAuto}</strong>개, 거절 <b>${r.denied}</b>개<br>유출 사슬(.env 읽기 → 설정 파일에 적기 → 공개 저장소로 push) ${r.leak?'<strong>완성됨</strong>':'끊김'} · ${r.leak?(r.harm?'운영 자격 증명이 있어 실제 유출입니다.':'일회용 컨테이너라 가짜 자격 증명만 나갑니다.'):'사람 확인이나 거절이 사슬 중간을 끊었습니다.'}<br>모드별 규칙은 공식 문서의 설명을 단순화한 것이고, auto 모드가 삭제와 낯선 네트워크만 막는다는 판정은 원본 레슨의 정리를 따른 가정입니다.`);});
};

A16Labs.inject=el=>{
 const out={done:'실행',hit:'<b>공격 성공</b>',stripped:'정제기가 걸러 냄',ask:'새 승인 요청',alarm:'카나리 경보(기억이 발동하자 표시)'};
 const DO=[['none','방어 없음'],['sanitizer','내용 정제기'],['boundary','읽기-쓰기 경계'],['both','정제기 + 읽기-쓰기 경계'],['canary','정제기 + 기억 카나리']];
 U.setup(el,S('defense','방어 조합',DO,'none'));
 U.bind(el,()=>{const d=U.text(el,'defense'),r=M.inject(d),dn=DO.find(x=>x[0]===d)[1];
  const rows=r.rows.map(p=>[p.name,p.attack?'공격':'정상',p.does,out[p.out]]);
  U.result(el,U.table(['공급 페이지','성격','누리가 하려는 일','결과'],rows,`방어 조합 ${dn}에서 공급 페이지 네 개의 결과`),
  `<b>${dn}</b> · 성공한 공격 <strong>${r.hits}</strong>개 / 3개, 막거나 드러낸 공격 <b>${r.blocked}</b>개 · 사람 승인 요청 <b>${r.asks}</b>번<br>${r.asks?'승인 요청은 정상 페이지의 가격 갱신에도 생깁니다. 경계의 비용은 사람의 시간입니다.':'사람 승인 요청이 없으니 밤새 사람이 깨지 않지만, 쓰기를 막는 경계도 없습니다.'}<br>원본 레슨의 시나리오를 단순화한 규칙 판정이며, 승인 요청을 받은 사람은 실제로 읽고 거절한다고 가정합니다.`);});
};

A16Labs.replay=el=>{
 U.setup(el,R('crash','마친 활동 수(그 직후 충돌)',0,6,1,5)+S('restart','다시 시작 방식',[['naive','처음부터 다시(while True)'],['replay','사건 기록으로 재생'],['nolog','재생하되 LLM 호출은 기록 안 함']],'naive'));
 U.bind(el,()=>{const k=U.value(el,'crash'),m=U.text(el,'restart'),r=M.replay(k,m);
  const items=M.activities.map((a,i)=>[a.name,i<k?(r.rerun.includes(a.name)?'충돌 전에 끝남 → 다시 실행':'충돌 전에 끝남 → 기록에서 재생'):'아직 안 함 → 이번에 실행']);
  U.result(el,U.cards(items,Math.min(k,5)),
  `${k}개 활동 뒤 충돌, ${m==='naive'?'처음부터 다시':m==='replay'?'사건 기록 재생':'LLM 미기록 재생'} · 중복 부작용 <strong>${r.dupEffects}</strong>건, 다시 청구된 LLM 비용 <strong>${F(r.rebilled,2)}달러</strong>, 다시 묻는 승인 <b>${r.reask}</b>번<br>${r.diverge?'LLM 출력이 기록되지 않아 다시 부르면 다른 계획이 나올 수 있습니다. 뒤따르는 기록과 어긋나는 재생 불일치입니다.':r.dupEffects?'환불이나 메일이 한 번 더 나갑니다.':'끝난 일은 다시 하지 않고 남은 활동만 실행합니다.'}<br>활동 순서와 LLM 호출 1회 0.40달러, 환불 30달러는 교육용 가정값이고, 다시 실행되는 활동은 규칙으로 센 값입니다.`);});
};

A16Labs.commit=el=>{
 U.setup(el,S('scenario','상황',[['clean','정상 진행'],['crash','실행 직후 충돌, 재시도'],['balance','승인 뒤 잔액이 바뀜'],['silent','결제 API가 200을 줬지만 반영 안 됨']],'crash')+S('guard','보호 수준',[[0,'승인만'],[1,'+ 멱등 키'],[2,'+ 사전 조건'],[3,'+ 사후 확인·되돌리기']],0));
 U.bind(el,()=>{const sc=U.text(el,'scenario'),g=U.value(el,'guard'),r=M.commit(sc,g);
  U.result(el,U.cards(r.steps.map((s,i)=>[`${i+1}단계`,s]),r.steps.length-1),
  `보호 수준 <b>${g}</b> · 결과: <strong>${r.outcome}</strong> · ${r.ok?'문제 없음':'<strong>잘못된 결과</strong>'} · 실제로 나간 돈 <b>${r.money}달러</b><br>${r.ok?'이 상황을 막는 장치가 켜져 있습니다.':sc==='crash'?'멱등 키(보호 수준 1)가 있으면 같은 요청을 한 번만 실행합니다.':sc==='balance'?'사전 조건(보호 수준 2)이 승인 때의 조건을 실행 직전에 다시 봅니다.':'사후 확인(보호 수준 3)이 대상을 다시 읽어 반영 여부를 확인합니다.'}<br>원본 레슨의 네 시나리오를 단순화한 상태 기계이고, 환불 30달러는 교육용 가정값입니다.`);});
};

A16Labs.governor=el=>{
 const L=[['month','이달 상한만'],['day','이달 + 하루 상한'],['velocity','이달 + 10분 속도 제한'],['all','세 겹 모두']];
 U.setup(el,R('rate','고리의 분당 지출(달러)',1,20,1,6)+S('layer','켠 상한',L,'month'));
 U.bind(el,()=>{const rate=U.value(el,'rate'),l=U.text(el,'layer'),r=M.governor(rate,l),all=L.map(x=>M.governor(rate,x[0]));
  const t=r.minutesAfterLoop,when=t===null?'31일 안에 멈추지 않음':t<120?`${t}분`:t<2880?`${F(t/60,1)}시간`:`${F(t/1440,1)}일`;
  U.result(el,U.bars(L.map(x=>x[1]),all.map(x=>x.loss),'고리가 멈출 때까지 더 쓴 돈(달러)',null,0),
  `분당 <b>${rate}달러</b> 고리, <b>${L.find(x=>x[0]===l)[1]}</b> · 멈춤: <strong>${when}</strong> 뒤 (${r.why}) · 더 쓴 돈 <strong>${F(r.loss,0)}달러</strong><br>10분 창 지출은 평소 1달러 + 고리 ${rate*10}달러로 ${rate*10+1>50?'50달러를 넘어 속도 제한이 걸릴 수 있습니다.':'50달러를 넘지 못해 속도 제한은 이 고리를 못 봅니다.'} 막대는 같은 고리에서 상한 조합 네 가지를 비교합니다.<br>분 단위로 지출을 더한 실제 계산이며, 평소 지출 분당 0.1달러, 고리 시작 120분째, 상한 값은 교육용 가정값입니다.`);});
};

A16Labs.breaker=el=>{
 U.setup(el,R('drift','시간마다 늘어나는 도구 호출 수 c',0.5,10,0.5,1));
 U.bind(el,()=>{const c=U.value(el,'drift'),r=M.breaker(c);el.querySelector('#drift-value').textContent=F(c,1);
  const ymax=Math.max(40,Math.ceil((10+c*48)/10)*10);
  U.result(el,U.plot({lines:[{data:r.xs},{data:r.ms,color:'var(--orange)',dashed:true},{data:[[0,30],[48,30]],color:'var(--blue)',dashed:true}],points:[...(r.ewmaHour!==null?[[r.ewmaHour,r.xs[r.ewmaHour][1],'var(--orange)',6]]:[]),...(r.hardHour!==null?[[r.hardHour,r.xs[r.hardHour][1],'var(--blue)',6]]:[])],xmin:0,xmax:48,ymin:0,ymax,xlabel:'시간',ylabel:'시간당 호출 (실선 실제, 주황 점선 EWMA 경보선, 파랑 점선 고정 한도 30)',label:`호출 수가 시간마다 ${F(c,1)}회씩 늘 때 EWMA 경보선과 고정 한도`}),
  `c = <b>${F(c,1)}</b>회/시간 · EWMA가 뒤처지는 폭 c(1−α)/α = <b>${F(r.lag,2)}</b>회, 새 값이 직전 EWMA보다 앞서는 폭 c/α = <b>${F(r.gap,2)}</b>회, 경보 문턱 3σ = <b>${r.threshold}</b>회<br>EWMA 경보: <strong>${r.ewmaHour===null?'48시간 동안 울리지 않음':r.ewmaHour+'시간째'}</strong> · 고정 한도 30회: <strong>${r.hardHour===null?'48시간 안에 넘지 않음':r.hardHour+'시간째'}</strong><br>시간당 호출이 선형으로 늘 때의 결정적 계산입니다(α=0.3). 평소 흔들림 σ=2회와 한도 30회는 교육용 가정값입니다.`);});
};
})();
