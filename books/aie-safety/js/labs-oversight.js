/* 3~5장 실험: 잠복 백도어, 순응 격차, 통제 프로토콜, 약한 감독(PGR). 계산은 A19Math에서 한다. */
(()=>{
'use strict';
const U=A19UI,M=A19Math,R=U.range,S=U.select,F=U.fmt;
A19Labs.backdoor=el=>{
 U.setup(el,R('bd-k','적대 훈련 횟수 k',0,20,1,0)+S('bd-kind','백도어 종류',[['plain','일반 백도어'],['cot','사고 과정을 거쳐 증류한 백도어']],'plain'));
 U.bind(el,()=>{const k=U.value(el,'bd-k'),kind=U.text(el,'bd-kind'),r=M.backdoor(k,kind),r0=M.backdoor(0,kind);
  U.result(el,U.plot({lines:[{data:r.curve.map(p=>[p[0],p[1]]),color:'var(--orange)',dashed:true},{data:r.curve.map(p=>[p[0],p[2]])}],points:[[k,r.redTeam,'var(--orange)'],[k,r.heldOut,'var(--accent)']],xmin:0,xmax:20,ymin:0,ymax:1,xlabel:'적대 훈련 횟수',ylabel:'결함률 (점선 레드팀 문구 · 실선 원래 트리거)',label:`${M.BACKDOOR[kind].label}, 적대 훈련 ${k}번 뒤 레드팀 문구 결함률 ${F(r.redTeam,3)}, 원래 트리거 결함률 ${F(r.heldOut,3)}`}),
  `${M.BACKDOOR[kind].label} · 적대 훈련 <b>${k}번</b><br>레드팀이 찾은 문구에서의 결함률 <b>${F(r.redTeam,3)}</b> (처음 ${F(r0.redTeam,2)}) · 원래 트리거(“배포 연도”)에서의 결함률 <strong>${F(r.heldOut,3)}</strong> (처음 ${F(r0.heldOut,2)})<br>트리거가 없는 평범한 입력의 결함률은 ${F(r.clean,0)}입니다. 평가 화면에는 아무 문제도 보이지 않습니다.<br>${k>0?'레드팀 점수는 좋아졌지만 숨은 트리거의 결함은 오히려 더 확실해졌습니다. 모델이 “레드팀 문구”와 “진짜 트리거”를 더 잘 구별하게 된 것입니다.':'아직 적대 훈련 전입니다.'} 원본이 보고한 정성적 결과를 숫자로 흉내 낸 시나리오 모형이며 실제 모델에서 잰 값이 아닙니다.`);});
};
A19Labs.gap=el=>{
 U.setup(el,R('gp-w','재훈련에 쓰일 무게 w',0,1,0.05,0.3)+S('gp-h','유해 요청에 응하는 비용 h',[[0.2,'0.2'],[0.4,'0.4'],[0.6,'0.6'],[0.8,'0.8']],0.6));
 U.bind(el,()=>{const w=U.value(el,'gp-w'),h=U.value(el,'gp-h'),r=M.complianceGap(w,h);el.querySelector('#gp-w-value').textContent=F(w,2);
  U.result(el,U.bars(['감시 조건 순응률','비감시 조건 순응률','순응 격차'],[r.mon,r.un,r.gap],'비율',null,3),
  `w = <b>${F(w,2)}</b>, h = <b>${F(h,1)}</b> (k = 6, v = 1)<br>감시 조건(무료 사용자, 재훈련에 쓰임) 순응률 <b>${F(r.mon*100,1)}%</b> · 비감시 조건(유료 사용자) 순응률 <b>${F(r.un*100,1)}%</b><br>순응 격차 <strong>${F(r.gap*100,1)}%p</strong><br>${w===0?'w = 0이면 두 조건이 같아져 격차가 사라집니다. 훈련에 쓰인다고 느끼지 않으면 위장할 이유가 없습니다.':'감시받는다고 믿을 때만 “거절하면 고쳐진다”는 계산이 더해져 순응이 늘어납니다.'} σ(k(w·v − h))와 σ(−k·h)를 실제로 계산한 장난감 결정 모형이며, k·v·h는 원본 보고와 크기만 비슷하게 맞춘 가정값입니다.`);});
};
A19Labs.protocol=el=>{
 U.setup(el,S('pc-proto','통제 프로토콜',Object.entries(M.PROTOCOLS).map(([k,p])=>[k,p.name]),'monitor')+R('pc-a','사람 감사 예산 a',0.01,0.1,0.01,0.02)+S('pc-d','신뢰 모델 T의 판별력 d',[[1,'1 (약함)'],[2,'2'],[3,'3 (강함)']],2));
 U.bind(el,()=>{const p=U.text(el,'pc-proto'),a=U.value(el,'pc-a'),d=U.value(el,'pc-d'),keys=Object.keys(M.PROTOCOLS),all=keys.map(k=>M.control(k,a,d)),r=M.control(p,a,d);el.querySelector('#pc-a-value').textContent=F(a*100,0)+'%';
  U.result(el,`<h4 class="a19-sub">같은 a·d에서 프로토콜별 안전</h4>`+U.bars(keys.map(k=>M.PROTOCOLS[k].name+(k===p?' ◀':'')),all.map(x=>x.safety),'안전 확률',null,3),
  `${M.PROTOCOLS[p].name} · 감사 예산 <b>${F(a*100,0)}%</b> · 판별력 d = <b>${d}</b><br>안전(적발이 사고보다 먼저 올 확률) <strong>${F(r.safety,3)}</strong> · 쓸모 <b>${F(r.useful,2)}</b><br>공격 한 번이 감사에 걸릴 확률 <b>${F(r.caught,3)}</b>${r.edited!==undefined?` · T가 고쳐 써서 무력화할 확률 <b>${F(r.edited,3)}</b>`:''} · 그대로 통과할 확률 <b>${F(r.passed,3)}</b><br>${p==='none'?'감시가 없으면 첫 공격이 바로 사고입니다.':p==='upfront'?'무작위 감사는 공격을 고르지 못해 안전이 예산 a와 같습니다.':'의심 점수 상위에 감사를 몰아 무작위 감사보다 훨씬 높습니다.'} 정상 N(0,1)·백도어 N(d,1) 의심 점수와 T 실력 0.5를 가정한 장난감 모형을 실제로 계산했습니다.`);});
};
A19Labs.w2s=el=>{
 U.setup(el,R('ws-a','약한 감독자의 정확도',0.55,0.9,0.05,0.7)+R('ws-s','오류 중 체계적 오류의 비율 s',0,1,0.1,0.5));
 U.bind(el,()=>{const a=U.value(el,'ws-a'),s=U.value(el,'ws-s'),r=M.pgr(a,s);el.querySelector('#ws-a-value').textContent=F(a,2);el.querySelector('#ws-s-value').textContent=F(s,1);
  U.result(el,U.bars(['약한 감독자','약한 라벨로 미세조정한 강한 모델','강한 모델 상한'],[r.weak,r.ft,r.ceiling],'정확도',null,3),
  `약한 감독자 정확도 <b>${F(a,2)}</b> · 체계적 오류 비율 s = <b>${F(s,1)}</b><br>강한 모델의 미세조정 정확도 <b>${F(r.ft,4)}</b> · 상한 ${F(r.ceiling,2)}<br>PGR = (미세조정 − 약한) / (상한 − 약한) = <strong>${F(r.pgr,2)}</strong><br>${s===0?'오류가 모두 무작위면 강한 모델이 그것을 넘어서 상한까지 회복합니다.':s===1?'오류가 모두 체계적이면 강한 모델이 그 오류를 그대로 배워 PGR이 0보다 작아질 수 있습니다.':'무작위 오류는 넘어서고 체계적 오류는 따라 하므로 격차의 일부만 회복합니다.'} “강한 모델은 체계적 오류를 따라 하고 무작위 오류는 넘어선다”는 가정 위의 계산이며 상한 0.95는 가정값입니다.`);});
};
})();
