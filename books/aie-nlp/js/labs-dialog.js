/* 10~12장 실험: 개체 연결, 대화 상태 추적, 구조화 출력, 긴 문맥 바늘 찾기. 계산은 A06Math에서 한다. */
(()=>{
'use strict';
const U=A06UI,M=A06Math,S=U.select,R=U.range,F=U.fmt,E=U.esc;

const CTX=['한강 신간 소설 언제 나오나요','한강 다리 사진집 있나요','한강 점심 예약 되나요','한강 주차 되나요'];
A06Labs.linking=el=>{
 U.setup(el,S('ctx','문의 문장',CTX.map((c,i)=>[i,c]),0)+R('lambda','λ: 사전 확률에 주는 무게 (나머지는 문맥)',0,1,0.05,0.3));
 U.bind(el,()=>{const c=CTX[U.value(el,'ctx')],l=U.value(el,'lambda'),r=M.linkEntity(c,l),nil=r.pick.startsWith('NIL');
  el.querySelector('#lambda-value').textContent=F(l,2);
  U.result(el,U.bars(r.list.map(x=>x.id),r.list.map(x=>x.score),'점수',0.15,3),
  `“${E(c)}”의 “한강” 후보 점수 = λ × 사전 확률 + (1 − λ) × 문맥 겹침(자카드)<br>${r.list.map(x=>`${x.id}: ${F(l,2)} × ${F(x.prior,2)} + ${F(1-l,2)} × ${F(x.sim,3)} = <b>${F(x.score,3)}</b>`).join('<br>')}<br>점선은 NIL 문턱 0.15입니다. 연결 결과: <strong>${E(r.pick)}</strong>. ${nil?'어느 후보도 문턱을 넘지 못해 지식 기반에 없는 대상으로 남겨 둡니다. 억지로 잇는 것보다 안전합니다.':l>=0.6&&r.pick==='강 한강'&&c.includes('신간')?'사전 확률에 너무 기대면 문맥이 분명히 작가를 가리켜도 가장 흔한 뜻(강)으로 잇습니다.':'문맥 낱말이 후보 설명과 겹친 만큼 점수가 오릅니다.'} 사전 확률과 설명 낱말은 교육용 가정값이고, 점수는 실제 계산입니다.`);});
};

const POLICY={full:'이전 상태에 이번 턴 변경을 반영',lastonly:'마지막 턴 말만 보고 새로 만듦',append:'고치는 말도 덧붙여 쌓음'};
const slots=st=>Object.keys(st).length?Object.entries(st).map(([k,v])=>`${k}=${v}`).join(', '):'(비어 있음)';
A06Labs.dst=el=>{
 U.setup(el,R('turn','살펴볼 턴',1,5,1,3)+S('policy','상태 갱신 방식',Object.entries(POLICY),'full'));
 U.bind(el,()=>{const t=U.value(el,'turn'),p=U.text(el,'policy'),r=M.dstStates(p),i=t-1,j=M.jga(r.ok,t),keys=[...new Set([...Object.keys(r.gold[i]),...Object.keys(r.got[i])])];
  const rows=keys.map(k=>{const g=r.gold[i][k],o=r.got[i][k],ok=g===o;return `<div class="a06-slot ${ok?'good':'bad'}"><span>${E(k)}</span><b>${o===undefined?'(없음)':E(o)}</b><small>${ok?'정답과 같음':`정답 ${g===undefined?'(없음)':E(g)}`}</small></div>`;}).join('');
  U.result(el,`<div class="kit-panel a06-panel"><p class="a06-label">${t}턴 손님: “${E(M.DIALOG[i].say)}”</p><div class="a06-rows">${rows||'<p class="a06-empty">슬롯이 하나도 없습니다.</p>'}</div><p class="a06-label">턴별 일치: ${r.ok.slice(0,t).map((x,k)=>`${k+1}턴 ${x?'○':'×'}`).join(' · ')}</p></div>`,
  `갱신 방식: ${POLICY[p]}<br>${t}턴 상태: ${E(slots(r.got[i]))} → 정답과 <strong>${r.ok[i]?'같음':'다름'}</strong><br>1~${t}턴 결합 목표 정확도(JGA) = 모든 슬롯이 맞은 턴 ${r.ok.slice(0,t).filter(Boolean).length} ÷ ${t} = <b>${F(j,2)}</b><br>${p==='lastonly'?'앞 턴에서 말한 책과 배송지를 잊어버리므로 둘째 턴부터 틀립니다.':p==='append'?'“부산 말고 대구”를 덮어쓰지 않고 덧붙여서 셋째 턴부터 배송지가 둘이 됩니다.':'고치기와 지우기를 모두 반영해 다섯 턴 내내 정답을 유지합니다.'} 다섯 턴 대화와 갱신 규칙은 시나리오이고, 일치 판정은 실제 계산입니다.`);});
};

A06Labs.constrain=el=>{
 U.setup(el,R('p','토큰 하나가 형식을 지킬 확률 p',0.9,0.999,0.001,0.95));
 U.bind(el,()=>{const p=U.value(el,'p'),r=M.jsonValidity(p);
  el.querySelector('#p-value').textContent=F(p,3);
  U.result(el,U.bars(['프롬프트만','실패 시 3번까지 재시도','제약 디코딩'],[r.prompt*100,r.retry*100,r.constrained*100],'%',null,1),
  `24토큰짜리 주문 JSON에서 토큰마다 형식을 지킬 확률이 ${F(p,3)}이면, 한 번에 유효할 확률은 ${F(p,3)}<sup>24</sup> = <strong>${F(r.prompt*100,1)}%</strong>입니다.<br>실패하면 다시 부르는 방식은 1 − (1 − ${F(r.prompt,3)})³ = <b>${F(r.retry*100,1)}%</b>이고 평균 <b>${F(r.expectedCalls,2)}번</b> 호출합니다. 제약 디코딩은 문법에 맞지 않는 토큰을 아예 고를 수 없게 막으므로 형식은 <b>100%</b> 맞습니다.<br>제약 디코딩도 값이 옳은지는 보장하지 않습니다. 토큰이 서로 독립이라는 교육용 가정으로 한 실제 계산입니다.`);});
};

const lenLabel=i=>M.LENGTHS[i]+'k';
A06Labs.needle=el=>{
 U.setup(el,R('len','문맥 길이 (토큰, k = 1000)',0,5,1,3)+S('task','과제 유형',[['single','바늘 하나 찾기'],['multi','두 사실을 이어 추론하기']],'single'));
 U.bind(el,()=>{const i=U.value(el,'len'),task=U.text(el,'task'),g=M.needleGrid(M.LENGTHS[i],task),eff=M.effectiveLength(task),worst=g.acc.indexOf(g.min);
  el.querySelector('#len-value').textContent=lenLabel(i);
  U.result(el,U.bars(g.depths.map(d=>`깊이 ${F(d*100,0)}%`),g.acc.map(x=>x*100),'%',90,1),
  `길이 ${lenLabel(i)}, ${task==='single'?'바늘 하나':'두 사실 이어 추론'}: 깊이 다섯 곳의 정답률 ${g.acc.map(x=>F(x*100,0)+'%').join(', ')}<br>${Math.max(...g.acc)-g.min<1e-9?`이 길이에서는 깊이와 관계없이 정답률이 <strong>${F(g.min*100,1)}%</strong>로 같고`:`가장 낮은 곳은 <strong>깊이 ${F(g.depths[worst]*100,0)}%</strong> (${F(g.min*100,1)}%)이고`}, 모든 깊이가 90%를 넘는 가장 긴 길이(유효 길이)는 <b>${eff}k</b>입니다.<br>${task==='multi'?'두 사실을 이어야 하는 과제는 바늘 하나 찾기보다 훨씬 짧은 길이에서 무너집니다.':'바늘 하나 찾기는 길어져도 잘 버티지만, 문서 가운데에 묻힌 사실부터 놓칩니다.'} 원본이 설명한 경향(가운데 손실, 다단계 과제가 먼저 무너짐)을 흉내 낸 교육용 모형이며 실제 모델을 측정한 값이 아닙니다.`);});
};
})();
