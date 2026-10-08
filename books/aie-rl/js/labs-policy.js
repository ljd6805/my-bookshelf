/* 6~8장 실험: 기준선과 분산, GAE, PPO 클리핑, 에폭 수와 KL, 브래들리-테리, KL 벌점. 계산은 A10Math에서 한다. */
(()=>{
'use strict';
const U=A10UI,M=A10Math,R=U.range,S=U.select,F=U.fmt;
A10Labs.baseline=el=>{
 U.setup(el,R('b','기준선 b',-2,14,0.1,0)+S('offset','보상 설정',[[0,'보상 평균 0과 1'],[10,'모든 보상 +10 (평균 10과 11)']],0));
 U.bind(el,()=>{const b=U.value(el,'b'),o=U.value(el,'offset'),r=M.pgVariance(0.3,o,1+o,1,b),curve=[];for(let x=-2;x<=14.001;x+=0.25)curve.push([x,M.pgVariance(0.3,o,1+o,1,x).variance]);
  const ymax=Math.min(40,Math.max(o?30:1.5,r.variance*1.15));el.querySelector('#b-value').textContent=F(b,1);
  U.result(el,U.plot({lines:[{data:curve}],points:[[b,r.variance,'var(--orange)',6],[r.bStar,r.varStar,'var(--blue)',5]],xmin:-2,xmax:14,ymin:0,ymax,xlabel:'기준선 b',ylabel:'기울기 추정의 분산',label:`기준선에 따른 분산 곡선. 지금 b ${F(b,1)}에서 분산 ${F(r.variance,3)}`}),
  `기울기 추정의 평균 <strong>${F(r.mean,3)}</strong> (b와 상관없이 같음)<br>분산 <b>${F(r.variance,3)}</b> · 표준편차 <b>${F(r.std,3)}</b><br>분산이 가장 작은 b* = (1−p)·μ₁ + p·μ₀ = <b>${F(r.bStar,2)}</b>, 그때 분산 ${F(r.varStar,3)} (파란 점). 지금 분산은 그 ${F(r.variance/r.varStar,1)}배입니다.<br>π(1)=0.3, 잡음 σ=1인 두 행동 문제에서 닫힌 식으로 정확히 계산했습니다.`);});
};
A10Labs.gae=el=>{
 U.setup(el,R('lambda','GAE의 λ',0,1,0.05,0.95)+S('cerr','비평가 오차 c (모든 칸)',[[0,'0 (정확한 비평가)'],[1,'1'],[3,'3']],1));
 U.bind(el,()=>{const l=U.value(el,'lambda'),c=U.value(el,'cerr'),r=M.gaeStats(l,c),b2=[],v=[],m=[];
  for(let x=0;x<=1.0001;x+=0.05){const s=M.gaeStats(Math.min(x,1),c);b2.push([x,s.bias*s.bias]);v.push([x,s.variance]);m.push([x,s.rmse*s.rmse]);}
  el.querySelector('#lambda-value').textContent=F(l,2);
  U.result(el,U.plot({lines:[{data:b2,color:'var(--orange)'},{data:v,color:'var(--blue)',dashed:true},{data:m}],points:[[l,r.rmse*r.rmse,'var(--text)',6]],xmin:0,xmax:1,ymin:0,ymax:Math.max(21,c*c+2),xlabel:'λ',ylabel:'편향²(주황) · 분산(파란 점선) · 평균제곱오차',label:`λ에 따른 편향 제곱, 분산, 평균제곱오차. 지금 λ ${F(l,2)}`}),
  `λ = <b>${F(l,2)}</b>, 비평가 오차 c = ${c}<br>첫 걸음 이점 추정의 편향 <b>${F(r.bias,3)}</b> · 분산 <b>${F(r.variance,3)}</b> · 평균제곱오차 <strong>${F(r.rmse*r.rmse,3)}</strong><br>${l===0?'λ=0은 한 걸음 TD 오차입니다. 분산은 가장 작지만 비평가 오차가 그대로 편향이 됩니다.':l===1?'λ=1은 몬테카를로 이득에서 V를 뺀 것입니다. 편향은 0이지만 20걸음의 잡음이 모두 쌓입니다.':'λ가 클수록 편향은 줄고 분산은 커집니다.'}<br>길이 20, γ=1, 보상 잡음 1에서 닫힌 식으로 정확히 계산했습니다.`);});
};
A10Labs.clip=el=>{
 U.setup(el,R('ratio','확률 비 r = π_new / π_old',0,2,0.05,1.3)+S('peps','자르기 폭 ε',[[0.1,'0.1'],[0.2,'0.2'],[0.3,'0.3']],0.2)+S('adv','이점 A',[[1,'A = +1 (좋은 행동)'],[-1,'A = −1 (나쁜 행동)']],1));
 U.bind(el,()=>{const r=U.value(el,'ratio'),e=U.value(el,'peps'),A=U.value(el,'adv'),o=M.clipObj(r,A,e),un=[],cl=[];
  for(let x=0;x<=2.0001;x+=0.05){un.push([x,x*A]);cl.push([x,M.clipObj(x,A,e).obj]);}
  el.querySelector('#ratio-value').textContent=F(r,2);
  U.result(el,U.plot({lines:[{data:un,color:'var(--muted)',dashed:true},{data:cl},{data:[[1-e,-2],[1-e,2]],color:'var(--orange)',dashed:true},{data:[[1+e,-2],[1+e,2]],color:'var(--orange)',dashed:true}],points:[[r,o.obj,'var(--orange)',6]],xmin:0,xmax:2,ymin:-2,ymax:2,xlabel:'확률 비 r',ylabel:'목적 함수 (실선 L^CLIP, 회색 점선 r·A)',label:`잘린 목적 함수. r ${F(r,2)}, A ${A}, 값 ${F(o.obj,2)}`}),
  `r = <b>${F(r,2)}</b>, ε = ${e}, A = ${A>0?'+1':'−1'}<br>r·A = ${F(o.unclipped,2)}, clip(r)·A = ${F(o.clipped,2)} → min = <strong>${F(o.obj,2)}</strong><br>정책 기울기: <strong>${o.gradZero?'0 (잘림)':'살아 있음'}</strong> — ${o.gradZero?(A>0?'좋은 행동을 이미 1+ε배 넘게 키웠으므로 더 밀지 않습니다.':'나쁜 행동을 이미 1−ε배 아래로 줄였으므로 더 줄이지 않습니다.'):(A>0&&r<1?'좋은 행동이 오히려 줄어든 상태라 되돌리는 기울기가 남습니다.':A<0&&r>1?'나쁜 행동이 오히려 늘어난 상태라 되돌리는 기울기가 남습니다.':'아직 신뢰 구간 안이라 보통의 정책경사처럼 움직입니다.')}<br>식을 그대로 계산한 값입니다.`);});
};
A10Labs.epochs=el=>{
 U.setup(el,R('kep','같은 묶음으로 갱신한 횟수 K',1,30,1,10)+S('pmode','목적 함수',[['clip','잘린 목적 (ε=0.2)'],['none','자르지 않은 r·A']],'clip'));
 U.bind(el,()=>{const K=U.value(el,'kep'),mode=U.text(el,'pmode'),c=M.ppoEpochs(30,true),u=M.ppoEpochs(30,false),r=M.ppoEpochs(K,mode==='clip');
  U.result(el,U.plot({lines:[{data:u.hist.map((h,i)=>[i+1,h.kl]),color:'var(--orange)',dashed:true},{data:c.hist.map((h,i)=>[i+1,h.kl])}],points:[[K,r.kl,'var(--text)',6]],xmin:0,xmax:30,ymin:0,ymax:1.6,xlabel:'갱신 횟수 K',ylabel:'KL(π_old‖π)',label:`에폭에 따른 KL. 잘린 목적(실선)은 멈추고 자르지 않은 목적(점선)은 계속 커짐. 지금 K ${K}에서 ${F(r.kl,3)}`}),
  `${mode==='clip'?'잘린 목적':'자르지 않은 목적'}으로 K = <b>${K}</b>번 갱신<br>KL(π_old‖π) = <strong>${F(r.kl,4)}</strong> · 자르기 비율 <b>${F(r.clipFrac*100,0)}%</b><br>새 정책 확률 (좋은·나쁜·중립 행동) = ${r.probs.map(p=>F(p,3)).join(' · ')}, 좋은 행동의 비율 r = <b>${F(r.ratio0,3)}</b><br>상태 하나·행동 셋, 이점 +1·−1·0 표본 각 4개, 학습률 0.5의 실제 계산입니다. 원본이 권하는 평균 KL 범위는 0~0.02입니다.`);});
};
A10Labs.bt=el=>{
 U.setup(el,R('delta','점수 차 Δ = R(A) − R(B)',-5,5,0.1,1)+S('chose','사람의 선택',[['A','A를 고름'],['B','B를 고름']],'A'));
 U.bind(el,()=>{const d=U.value(el,'delta'),ch=U.text(el,'chose'),r=M.bt(d,ch),pc=[],lc=[];for(let x=-5;x<=5.001;x+=0.1){pc.push([x,M.bt(x).pA]);lc.push([x,M.bt(x,ch).loss]);}
  el.querySelector('#delta-value').textContent=F(d,1);
  U.result(el,U.plot({lines:[{data:pc,color:'var(--blue)',dashed:true},{data:lc}],points:[[d,r.loss,'var(--orange)',6]],xmin:-5,xmax:5,ymin:0,ymax:5,xlabel:'점수 차 Δ',ylabel:'손실(실선) · A를 고를 확률(점선)',label:`브래들리-테리 손실과 확률. Δ ${F(d,1)}에서 손실 ${F(r.loss,3)}`}),
  `Δ = <b>${F(d,1)}</b> → 모형이 말하는 “사람이 A를 고를 확률” σ(Δ) = <strong>${F(r.pA,3)}</strong><br>사람은 ${ch}를 골랐습니다. 이 표시의 손실 −log p = <b>${F(r.loss,3)}</b>, 보상 모델이 받는 기울기 크기 1 − p = <b>${F(r.grad,3)}</b><br>${r.grad<0.1?'이미 잘 맞히고 있어 거의 배우지 않습니다.':r.grad>0.9?'반대로 확신하고 있었으므로 크게 고쳐집니다.':'점수 차를 사람의 선택 쪽으로 옮기며 배웁니다.'} 식을 그대로 계산한 값입니다.`);});
};
A10Labs.kl=el=>{
 U.setup(el,R('beta','KL 벌점 β',0.1,3,0.1,1));
 U.bind(el,()=>{const b=U.value(el,'beta'),r=M.klPolicy(b),ref=M.klPolicy(1000);el.querySelector('#beta-value').textContent=F(b,1);
  U.result(el,`<h4 class="a10-sub">정책이 행동마다 고르는 확률</h4>`+U.bars(r.names,r.probs,'',null,3),
  `β = <b>${F(b,1)}</b><br>보상 모델 점수의 기대값 <b>${F(r.rm,2)}</b> · 작업자 실제 만족도의 기대값 <strong>${F(r.truth,2)}</strong> · KL(π‖π_ref) <b>${F(r.kl,2)}</b><br>기준 정책 그대로라면 점수 ${F(ref.rm,2)}, 만족도 ${F(ref.truth,2)}입니다. ${r.probs[2]>0.5?'β가 작아 보상 모델의 빈틈(선반 스치는 지름길)에 확률이 몰렸습니다. 보상 해킹입니다.':'β가 정책을 기준 근처에 묶어 지름길의 확률이 작습니다.'}<br>행동별 점수와 만족도는 가정값이고, π ∝ π_ref·exp(R/β)를 정확히 계산했습니다.`);});
};
})();
