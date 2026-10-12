/* 9~12장 실험: 공정성 지표, 차등 프라이버시, 워터마크, EU AI Act 시점, 출시 후 진단. 계산은 A19Math에서 한다. */
(()=>{
'use strict';
const U=A19UI,M=A19Math,R=U.range,S=U.select,F=U.fmt;
const pct=v=>F(v*100,1)+'%';
A19Labs.fair=el=>{
 U.setup(el,R('fr-ta','A 집단 문턱 τ_A',-1,3,0.05,1)+R('fr-tb','B 집단 문턱 τ_B',-1,3,0.05,1)+S('fr-base','B 집단 기저율(갚을 사람 비율)',[[0.3,'0.3'],[0.5,'0.5 (A와 같음)'],[0.7,'0.7']],0.3));
 U.bind(el,()=>{const ta=U.value(el,'fr-ta'),tb=U.value(el,'fr-tb'),bb=U.value(el,'fr-base'),r=M.fairness(ta,tb,bb),pt=M.parityThreshold(ta,bb);
  el.querySelector('#fr-ta-value').textContent=F(ta,2);el.querySelector('#fr-tb-value').textContent=F(tb,2);
  U.result(el,U.bars(['A 승인율','B 승인율','A TPR','B TPR','A FPR','B FPR','A 정밀도','B 정밀도'],[r.A.sel,r.B.sel,r.A.tpr,r.B.tpr,r.A.fpr,r.B.fpr,r.A.ppv,r.B.ppv],'비율',null,3),
  `τ_A = <b>${F(ta,2)}</b>, τ_B = <b>${F(tb,2)}</b> · 기저율 A 0.5, B ${F(bb,1)}<br>승인율 차이(인구 통계적 동등) <strong>${F(r.dp,3)}</strong> · TPR 차이 <b>${F(r.tprGap,3)}</b> · FPR 차이 <b>${F(r.fprGap,3)}</b>(둘 다 0이면 균등 오즈) · 정밀도 차이 <b>${F(r.ppvGap,3)}</b><br>B의 승인율을 A와 같게 하는 문턱은 τ_B ≈ <b>${F(pt,3)}</b>입니다.<br>${Math.abs(r.dp)<0.01&&Math.abs(r.tprGap)>0.01?'승인율은 맞았지만 TPR이 갈라져 균등 오즈가 깨졌습니다.':Math.abs(r.tprGap)<1e-9&&Math.abs(r.dp)>0.01?'같은 문턱이라 균등 오즈는 성립하지만 기저율이 달라 승인율과 정밀도가 갈립니다.':'세 기준이 서로 다른 값을 보입니다.'} 점수 분포 N(1.5,1)·N(0,1)을 두 집단에 똑같이 가정하고 실제로 계산했습니다.`);});
};
A19Labs.dp=el=>{
 U.setup(el,R('dp-sigma','잡음 배수 σ',0.5,20,0.5,1)+S('dp-t','반복 횟수 T',[[1,'1번'],[10,'10번'],[100,'100번'],[1000,'1,000번']],1));
 U.bind(el,()=>{const s=U.value(el,'dp-sigma'),T=U.value(el,'dp-t'),r=M.dpEpsilon(s,T),p=M.mia(r.mu);el.querySelector('#dp-sigma-value').textContent=F(s,1);
  const roc=Array.from({length:51},(_,i)=>{const a=i/50;return [a,M.mia(r.mu,a)];});
  U.result(el,U.plot({lines:[{data:roc},{data:[[0,0],[1,1]],color:'var(--muted)',dashed:true}],points:[[0.01,p,'var(--orange)']],xmin:0,xmax:1,ymin:0,ymax:1,xlabel:'공격의 오탐률 α',ylabel:'멤버십 추론 최대 탐지율',label:`μ ${F(r.mu,3)}에서 멤버십 추론 공격의 최대 탐지율 곡선. 오탐률 1%에서 ${pct(p)}`}),
  `σ = <b>${F(s,1)}</b>, T = <b>${T}</b> · 가우스 DP 매개변수 μ = √T/σ = <b>${F(r.mu,3)}</b><br>δ = 10⁻⁵에서 ε = <strong>${F(r.eps,3)}</strong><br>오탐률 1%로 “이 고객의 대화가 학습에 들어갔다”를 맞히는 공격의 최대 탐지율 <b>${pct(p)}</b> (대각선 = 추측과 같음)<br>${T>1?`반복이 ${T}번이면 σ를 √${T} ≈ ${F(Math.sqrt(T),1)}배로 늘려야 같은 μ와 ε를 지킵니다.`:'반복이 늘면 μ가 √T배로 커집니다.'} 가우스 DP 곡선으로 실제 계산했으며, 부분 표본 증폭은 넣지 않아 실제 DP-SGD보다 ε가 크게 나옵니다.`);});
};
A19Labs.wm=el=>{
 U.setup(el,R('wm-t','글 길이 T (토큰)',25,400,25,200)+S('wm-delta','초록 토큰 가산 δ',[[0.5,'0.5'],[1,'1'],[2,'2'],[4,'4']],2)+R('wm-r','사람이 바꿔 쓴 비율 r',0,1,0.1,0));
 U.bind(el,()=>{const T=U.value(el,'wm-t'),d=U.value(el,'wm-delta'),rr=U.value(el,'wm-r'),r=M.watermark(T,d,rr);el.querySelector('#wm-r-value').textContent=F(rr,1);
  const curve=Array.from({length:41},(_,i)=>{const t=Math.max(10,i*10);return [t,M.watermark(t,d,rr).z];});
  U.result(el,U.plot({lines:[{data:curve},{data:[[0,4],[400,4]],color:'var(--orange)',dashed:true}],points:[[T,r.z,r.detected?'var(--accent)':'var(--orange)']],xmin:0,xmax:400,ymin:-2,ymax:22,xlabel:'글 길이 T (토큰)',ylabel:'z 점수 (점선 = 검출 문턱 4)',label:`T ${T}, δ ${d}, 바꿔 쓴 비율 ${F(rr,1)}에서 z 점수 ${F(r.z,2)}`}),
  `T = <b>${T}</b> · δ = <b>${d}</b> · γ = 0.25 · 바꿔 쓴 비율 <b>${F(rr,1)}</b><br>워터마크 토큰의 초록 확률 ${F(r.pg,3)} → 초록 토큰 기댓값 <b>${F(r.G,1)}</b>개 (워터마크 없는 글이면 ${F(T*0.25,1)}개)<br>z = <strong>${F(r.z,2)}</strong> → ${r.detected?'<b>검출됨</b>':'<b>검출되지 않음</b>'} · 이 δ와 r에서 z 4에 필요한 길이 ${Number.isFinite(r.need)?`<b>${r.need}</b>토큰`:'<b>없음</b>(모두 바꿔 써서 신호가 사라짐)'}<br>사람 글을 잘못 검출할 확률은 1 − Φ(4) ≈ ${F(r.humanFpr*1e5,1)}/10만입니다. 엔트로피가 충분하다는 가정 아래 기댓값으로 계산했습니다.`);});
};
A19Labs.euact=el=>{
 U.setup(el,R('eu-m','기준 달 (그 달 28일 기준)',0,48,1,24)+S('eu-kind','누리의 쓰임새',[['credit','대출 심사(부속서 III 고위험)'],['chat','상담 챗봇'],['gpai','범용 AI 모델 제공자'],['social','사회적 점수 매기기']],'credit'));
 U.bind(el,()=>{const m=U.value(el,'eu-m'),k=U.text(el,'eu-kind'),r=M.euObligations(m,k);el.querySelector('#eu-m-value').textContent=r.today.slice(0,7);
  const card=(e,on)=>`<li class="${on?'pass':'skipped'}"><span>${e.date} · ${on?'적용 중':'적용 전'}</span><p>${e.text}</p></li>`;
  U.result(el,`<ol class="a19-steps">${r.active.map(e=>card(e,true)).join('')}${r.upcoming.map(e=>card(e,false)).join('')}</ol>`,
  `기준일 <b>${r.today}</b> · 적용 중 <strong>${r.active.length}</strong>개, 적용 전 <b>${r.upcoming.length}</b>개${k==='social'&&r.active.some(e=>e.kinds.includes('social'))?'<br>사회적 점수는 금지 관행이라 의무를 지키는 문제가 아니라 기능 자체를 내놓을 수 없습니다.':''}<br>한국 AI 기본법: ${r.koreaInForce?'2026년 1월 22일부터 시행 중':'2026년 1월 22일 시행 전'}<br>날짜는 원본 커리큘럼 기준에 AI 옴니버스 규정 (EU) 2026/1744의 고위험 연기를 반영했습니다(확인일 2026-10-08). 개정·일정 조정이 또 있을 수 있습니다. 실제 판단 전에는 EU와 국가법령정보센터의 공식 문서를 확인하세요. 날짜를 비교하는 단순 조회이고 법률 자문이 아닙니다.`);});
};
A19Labs.diagnose=el=>{
 U.setup(el,S('dg-report','출시 한 달 뒤 들어온 보고',[['leak','메일 요약 뒤 계좌 정보가 외부로 나갔다'],['syc','틀린 전제에도 “네, 맞습니다”라고 한다'],['gap','지역에 따라 대출 승인율이 다르다']],'leak')+S('dg-remedy','처방',Object.entries(M.REMEDIES).map(([k,v])=>[k,v]),'userfilter'));
 U.bind(el,()=>{const rep=U.text(el,'dg-report'),rem=U.text(el,'dg-remedy'),r=M.diagnose(rep,rem);
  const worse=Math.abs(r.after)>Math.abs(r.before)+1e-9,same=Math.abs(r.after-r.before)<1e-9;
  U.result(el,U.bars(['처방 전','처방 후'],[r.before,r.after],r.unit,null,3),
  `${r.metric}: 처방 전 <b>${F(r.before,3)}</b> → 처방 후 <strong>${F(r.after,3)}</strong><br>${r.fixed?'<b>해결</b> · 이 처방이 원인을 겨눴습니다.':worse?'<b>악화</b> · 처방이 문제를 키웠습니다.':same?'<b>변화 없음</b> · 원인과 다른 곳을 고쳤습니다.':'<b>조금 움직였지만 충분하지 않음</b>.'}${rep==='leak'&&r.trace?` (사슬 ${r.trace.leaked?'끝까지 이어짐':`${r.trace.blockedAt+1}단계에서 끊김`})`:''}${rep==='gap'&&rem==='parity'?`<br>대신 TPR 차이가 ${F(r.tprGapAfter,3)}로 새로 생겼습니다. B 문턱 ${F(r.tB,3)}.`:''}<br>앞 장의 계산 함수(주입 상태 기계, KL 닫힌 해, 공정성 모형)를 그대로 다시 불러 계산했습니다. 보고와 처방의 짝은 이 책이 정한 시나리오입니다.`);});
};
})();
