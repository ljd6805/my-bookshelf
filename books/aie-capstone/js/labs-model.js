/* 5~7장 실험: GPT 매개변수, DPO의 β, ZeRO 단계별 메모리, 파이프라인 거품. 계산은 A20Math에서 한다. */
(()=>{
'use strict';
const U=A20UI,M=A20Math,R=U.range,S=U.select,F=U.fmt;
const r2=v=>Math.round(v*100)/100;
A20Labs.gptparams=el=>{
 U.setup(el,R('gp-L','층 수 L',2,48,1,12)+S('gp-d','폭 d',[[256,'256'],[512,'512'],[768,'768'],[1024,'1024'],[1600,'1600']],768)+S('gp-tie','출력층',[[1,'토큰 임베딩과 묶음'],[0,'따로 둠']],1));
 U.bind(el,()=>{const L=U.value(el,'gp-L'),d=U.value(el,'gp-d'),tied=U.value(el,'gp-tie')===1,r=M.gptParams(L,d,50257,1024,tied),mil=x=>x/1e6;
  U.result(el,U.bars(['블록 전체','토큰 임베딩','위치 임베딩','따로 둔 출력층'],[mil(r.blocks),mil(r.tok),mil(r.pos),mil(r.head)],'백만 개',null,1),
  `L = ${L}, d = ${d}, 출력층 ${tied?'묶음':'따로'}<br>블록 하나 12d² + 13d = <b>${F(r.block,0)}</b>개 · 블록 전체 ${F(r.blocks,0)}개 (전체의 ${F(r.blocks/r.total*100,1)}%)<br>전체 <strong>${F(r.total,0)}</strong>개 ≈ ${F(r.total/1e6,1)}M<br>bf16 가중치 <b>${F(r.bf16GB,2)} GB</b> · 혼합 정밀도 Adam 학습 상태(16바이트/개) <b>${F(r.trainGB,2)} GB</b>, 활성값은 따로입니다.<br>어휘 50,257, 문맥 1,024를 고정한 실제 계산입니다.`);});
};
A20Labs.dpo=el=>{
 U.setup(el,R('dpo-beta','β (규제 세기)',0.05,2,0.05,1)+R('dpo-dr','두 응답의 보상 차 Δr',0,3,0.1,1));
 U.bind(el,()=>{const b=r2(U.value(el,'dpo-beta')),dr=Math.round(U.value(el,'dpo-dr')*10)/10,r=M.dpoPolicy(b,dr),pw=[],kl=[];
  for(let x=0.05;x<=2.0001;x+=0.05){const s=M.dpoPolicy(x,dr);pw.push([x,s.pw]);kl.push([x,s.kl/Math.log(2)]);}
  U.result(el,U.plot({lines:[{data:pw},{data:kl,color:'var(--blue)',dashed:true}],points:[[b,r.pw,'var(--orange)',6]],xmin:0,xmax:2,ymin:0,ymax:1,xlabel:'β',ylabel:'선호 확률(실선) · KL ÷ ln2(점선)',label:`β에 따른 선호 응답 확률과 KL. 지금 β ${F(b,2)}에서 선호 확률 ${F(r.pw,3)}`}),
  `β = ${F(b,2)}, Δr = ${F(dr,1)} → Δr/β = ${F(r.margin,2)}<br>KL 규제 최적 정책이 선호 응답을 고를 확률 σ(Δr/β) = <strong>${F(r.pw,3)}</strong><br>기준 정책(0.5 : 0.5)으로부터의 KL = <b>${F(r.kl,3)}</b> (최대 ln 2 ≈ 0.693)<br>학습 시작점(정책 = 기준)의 DPO 손실은 ln 2 ≈ 0.693, 선호 쪽 기울기 크기는 β/2 = ${F(r.startGrad,3)}입니다.<br>${r.pw>0.99?'β가 작아 정책이 거의 한쪽 답만 고릅니다. 라벨의 잡음과 편향도 그대로 극단까지 밀립니다.':r.pw<0.6?'β가 커서 기준 정책 근처에 머뭅니다.':'선호와 거리 사이의 중간입니다.'}<br>응답 두 개짜리 문제의 닫힌 식을 그대로 계산했습니다.`);});
};
A20Labs.zero=el=>{
 U.setup(el,S('z-model','모델 크기',[[1.3,'1.3B'],[7,'7B'],[13,'13B'],[70,'70B']],7)+S('z-n','데이터 병렬 장비 수 N',[[1,'1'],[2,'2'],[4,'4'],[8,'8'],[16,'16'],[64,'64']],8)+S('z-stage','방식',[['ddp','DDP (나누지 않음)'],['z1','ZeRO-1 (옵티마이저 상태)'],['z2','ZeRO-2 (+ 기울기)'],['z3','ZeRO-3 (+ 가중치)']],'z1'));
 U.bind(el,()=>{const P=U.value(el,'z-model'),N=U.value(el,'z-n'),st=U.text(el,'z-stage'),r=M.zeroMem(P,N,st),all=['ddp','z1','z2','z3'].map(s=>M.zeroMem(P,N,s));
  const names={ddp:'DDP',z1:'ZeRO-1',z2:'ZeRO-2',z3:'ZeRO-3'};
  U.result(el,U.bars(['DDP','ZeRO-1','ZeRO-2','ZeRO-3'],all.map(a=>a.gb),'GB / 장비 (주황 점선 80GB)',80,1),
  `${F(P,1)}B 모델, 장비 ${N}대, ${names[st]}<br>매개변수 하나당 장비가 드는 바이트 <b>${F(r.bytes,3)}</b> → 장비당 <strong>${F(r.gb,1)} GB</strong> (DDP ${F(r.ddpGb,1)} GB보다 ${F(r.saving*100,1)}% 적음)<br>80GB 장비에 ${r.gb<=80?'<b>들어갑니다</b>':'<b>들어가지 않습니다</b>'}. 활성값과 작업 공간은 빠져 있으니 실제로는 여유가 더 필요합니다.<br>걸음당 장비 하나가 주고받는 양 약 <b>${F(r.commGB,1)} GB</b>${st==='z3'?' (가중치를 모으는 몫까지 DDP의 약 1.5배)':N>1?' (DDP와 같음)':' (장비가 하나라 통신 없음)'}<br>바이트 식은 실제 계산이고, 80GB 장비는 비교용 가정입니다.`);});
};
A20Labs.bubble=el=>{
 U.setup(el,R('bb-s','파이프라인 단계 수 S',2,16,1,4)+R('bb-m','마이크로배치 수 M',1,128,1,8));
 U.bind(el,()=>{const s=U.value(el,'bb-s'),m=U.value(el,'bb-m'),r=M.bubble(s,m),curve=[];
  for(let x=1;x<=128;x++)curve.push([x,M.bubble(s,x).fraction]);
  U.result(el,U.plot({lines:[{data:curve},{data:[[1,0.1],[128,0.1]],color:'var(--orange)',dashed:true}],points:[[m,r.fraction,'var(--orange)',6]],xmin:0,xmax:128,ymin:0,ymax:1,xlabel:'마이크로배치 수 M',ylabel:'거품 비율 (점선 10%)',label:`마이크로배치 수에 따른 거품 비율. 단계 ${s}, M ${m}에서 ${F(r.fraction,3)}`}),
  `단계 ${s}개, 마이크로배치 ${m}개<br>거품 (S−1)/(M+S−1) = ${s-1}/${m+s-1} = <strong>${F(r.fraction*100,1)}%</strong><br>단계 하나의 시간 칸 ${r.slots}칸 중 일하는 칸 ${r.useful}칸 (앞·뒤 계산 각 1칸)<br>들고 있어야 하는 활성값: GPipe <b>${r.gpipeAct}개</b> · 1F1B <b>${r.ofobAct}개</b><br>${r.fraction<=0.1?'거품이 10% 이하입니다. 그 대가로 GPipe는 마이크로배치 수만큼 활성값을 들고 있습니다.':'거품을 줄이려면 마이크로배치를 늘리거나 단계를 줄입니다.'}<br>앞·뒤 계산 시간이 단계마다 같다는 이상적 가정 위의 실제 계산입니다.`);});
};
})();
