/* 1~2장 실험: KL 벌점과 동의 벌점, 과최적화 곡선, 선호 손실. 계산은 A19Math에서 한다. */
(()=>{
'use strict';
const U=A19UI,M=A19Math,R=U.range,S=U.select,F=U.fmt;
const NAMES=M.ANSWERS.map(a=>a.name);
A19Labs.klpolicy=el=>{
 U.setup(el,R('kl-beta','KL 벌점 β',0.05,3,0.05,1)+S('kl-alpha','동의 벌점 α',[[0,'0 (벌점 없음)'],[0.25,'0.25'],[0.5,'0.5'],[1,'1.0']],0));
 U.bind(el,()=>{const b=U.value(el,'kl-beta'),a=U.value(el,'kl-alpha'),r=M.klPolicy(b,a),best=M.bestBeta(a);el.querySelector('#kl-beta-value').textContent=F(b,2);
  U.result(el,`<h4 class="a19-sub">누리의 답 비율 (SFT 기준 0.50 · 0.30 · 0.20)</h4>`+U.bars(NAMES,r.pi,'확률',null,3),
  `β = <b>${F(b,2)}</b>, α = <b>${F(a,2)}</b><br>맞장구 답의 비율 <strong>${F(r.syc,3)}</strong> · 보상 모델 점수 기댓값 <b>${F(r.proxy,3)}</b> · KL(π‖π_SFT) <b>${F(r.kl,3)}</b><br>실제 도움 기댓값 <strong>${F(r.util,3)}</strong> (SFT 그대로일 때 ${F(r.base.util,3)}) · 이 α에서 실제 도움이 가장 큰 β는 약 <b>${F(best.beta,2)}</b>(도움 ${F(best.util,3)})<br>${r.util<r.base.util?'보상 모델 점수는 올랐지만 실제 도움은 SFT보다 나빠졌습니다. 맞장구 답이 점수를 따 가고 있습니다.':'실제 도움이 SFT보다 좋아졌습니다.'} π ∝ π_SFT·exp((r − α·동의)/β)라는 닫힌 해를 실제로 계산했고, 세 답의 확률·점수·도움은 교육용 가정값입니다.`);});
};
A19Labs.overopt=el=>{
 U.setup(el,S('oo-n','보상 모델 학습 라벨 수 n',[[1000,'1천 쌍'],[3000,'3천 쌍'],[10000,'1만 쌍'],[30000,'3만 쌍']],1000)+R('oo-d','최적화 거리 d = √KL',0,12,0.5,3));
 U.bind(el,()=>{const n=U.value(el,'oo-n'),d=U.value(el,'oo-d'),r=M.overopt(n,d);el.querySelector('#oo-d-value').textContent=F(d,1);
  U.result(el,U.plot({lines:[{data:r.curve.map(p=>[p[0],p[1]]),color:'var(--orange)',dashed:true},{data:r.curve.map(p=>[p[0],p[2]])}],points:[[d,r.proxy,'var(--orange)'],[d,r.gold,'var(--accent)'],[r.dStar,r.goldPeak,'var(--blue)',4]],xmin:0,xmax:12,ymin:-4,ymax:10,xlabel:'d = √KL',ylabel:'점수 (점선 대리 · 실선 골드)',label:`라벨 ${n}쌍에서 대리 점수와 골드 점수 곡선. d ${F(d,1)}에서 대리 ${F(r.proxy,2)}, 골드 ${F(r.gold,2)}`}),
  `라벨 <b>${n.toLocaleString('en-US')}쌍</b> · 골드 곡선 계수 b = <b>${F(r.bg,3)}</b><br>d = <b>${F(d,1)}</b>에서 대리 점수 <b>${F(r.proxy,2)}</b>, 골드 점수 <strong>${F(r.gold,2)}</strong>, 틈 <b>${F(r.gap,2)}</b><br>골드 점수의 정점은 d* = <b>${F(r.dStar,2)}</b>(KL ≈ ${F(r.klStar,1)})에서 ${F(r.goldPeak,2)}이고, d = ${F(r.dZero,2)}를 넘으면 0 아래로 떨어집니다.<br>${d>r.dStar?'정점을 지났습니다. 대리 점수는 오르는데 실제 점수는 내려가는 구간입니다.':'아직 정점 앞이라 두 점수가 함께 오릅니다.'} R = a·d − b·d²는 원본의 함수 꼴이고, b가 라벨 수에 따라 줄어드는 식은 이 책의 가정값입니다.`);});
};
A19Labs.dpoloss=el=>{
 U.setup(el,R('dp-w','선택된 답의 로그 확률비 Δ_w',-3,3,0.1,0.5)+R('dp-l','거절된 답의 로그 확률비 Δ_l',-5,1,0.1,-1)+S('dp-beta','β',[[0.05,'0.05'],[0.1,'0.1'],[0.3,'0.3'],[0.5,'0.5']],0.1));
 U.bind(el,()=>{const w=U.value(el,'dp-w'),l=U.value(el,'dp-l'),b=U.value(el,'dp-beta'),r=M.prefLoss(w,l,b);
  el.querySelector('#dp-w-value').textContent=F(w,1);el.querySelector('#dp-l-value').textContent=F(l,1);
  const curve=Array.from({length:61},(_,i)=>{const m=-10+i;return [m,M.prefLoss(m,0,b).dpo];});
  U.result(el,U.plot({lines:[{data:curve},{data:[[-10,Math.LN2],[50,Math.LN2]],color:'var(--muted)',dashed:true}],points:[[r.margin,r.dpo,r.degraded?'var(--orange)':'var(--accent)']],xmin:-10,xmax:50,ymin:0,ymax:1.6,xlabel:'여유 Δ_w − Δ_l',ylabel:'DPO 손실 (점선 = log 2)',label:`β ${b}에서 여유에 따른 DPO 손실 곡선과 현재 점`}),
  `여유 Δ_w − Δ_l = <b>${F(r.margin,1)}</b> · 암묵적 보상 차이 β·여유 = <b>${F(r.gap,3)}</b> · 선택 확률 σ = <b>${F(r.prob,3)}</b><br>DPO 손실 <strong>${F(r.dpo,3)}</strong> (log 2 = 0.693) · 기울기 크기 β(1 − σ) = <b>${F(r.grad,4)}</b><br>IPO 손실 <b>${F(r.ipo,2)}</b> (목표 여유 1/(2β) = ${F(r.ipoTarget,1)}) · BPO(이 책의 단순화, λ = 1) <b>${F(r.bpo,3)}</b><br>${r.degraded?'선택된 답 퇴화: 순서는 맞지만 Δ_w < 0이라 선택된 답의 확률이 기준 정책보다 내려갔습니다. DPO는 이것을 벌하지 않고 BPO 줄만 벌합니다.':r.margin<=0?'여유가 0 이하라 선호 순서가 아직 틀렸습니다.':'선호 순서도 맞고 선택된 답의 확률도 내려가지 않았습니다.'} 손실 식을 실제로 계산했고 학습 고리는 돌리지 않습니다.`);});
};
})();
