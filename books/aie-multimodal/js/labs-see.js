/* 1~4장 실험: 패치 토큰, 대조 손실, Q-Former 압축, tanh 게이트, 문맥 예산. 계산은 A13Math, 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=A13UI,M=A13Math,R=U.range,S=U.select,V=U.value,F=U.fmt;

A13Labs.patches=el=>{
 U.setup(el,R('ptside','정사각형 한 변 H = W (px)',112,1344,16,224)+S('ptpatch','패치 크기 P (px)',[[14,'14 (SigLIP·DINOv2 계열)'],[16,'16 (ViT-B/16)'],[32,'32']],16));
 U.bind(el,()=>{const H=V(el,'ptside'),P=V(el,'ptpatch'),r=M.patchTokens(H,H,P,1),base=M.patchTokens(224,224,16,1),par=M.vitParams(768,12,P,r.seq);
  U.result(el,U.bars(['기준 224·P16','현재 설정'],[base.seq,r.seq],'토큰 ([CLS] 포함)',null,0),
  `격자 ⌊${H}/${P}⌋ = ${r.gh} → ${r.gh}×${r.gw} = <b>${F(r.patches,0)}</b>개 패치, [CLS]를 더해 <strong>${F(r.seq,0)}토큰</strong> (기준 197의 ${F(r.seq/base.seq,2)}배)<br>어텐션이 비교하는 쌍 N² = ${F(r.pairs,0)} (기준의 ${F(r.pairs/base.pairs,1)}배)${r.dropped?` · 나누어떨어지지 않아 버려지는 픽셀 ${F(r.dropped,0)}개`:''}<br>ViT-B 크기(D = 768, 12블록) 파라미터: 패치 투영 ${F(par.patchEmbed,0)} + 위치 표 ${F(par.pos,0)} + 블록 ${F(par.blocks,0)} ≈ <b>${F(par.total/1e6,1)}M</b>. 해상도를 바꿔도 위치 표만 달라집니다.<br>식 그대로의 실제 계산이며, 실제 사진을 처리하지는 않습니다.`);});
};

/* 4차원 장난감 임베딩: [배수·필터, 오류 표시, 호스, 정상 운전]. 막힌 필터와 꺾인 호스는 서로 닮은 어려운 오답이다. */
const IMG=[[0.2,0.95,0.1,0.05],[0.9,0.25,0.35,0.05],[0.45,0.2,0.9,0.05],[0.1,0.1,0.1,0.95]];
const TXT=[[0.25,0.9,0.15,0.1],[0.85,0.3,0.45,0.1],[0.5,0.25,0.85,0.1],[0.15,0.05,0.15,0.9]];
const NAMES=['E-21 표시창','막힌 필터','꺾인 호스','정상 운전'];
A13Labs.contrast=el=>{
 U.setup(el,R('ctau','온도 τ',0.03,1,0.01,0.07)+R('cbias','시그모이드 편향 b (SigLIP만)',-15,5,0.5,-10));
 U.bind(el,()=>{const tau=V(el,'ctau'),b=V(el,'cbias'),Sm=M.simMatrix(IMG,TXT),c=M.infoNCE(Sm,tau),s=M.sigmoidLoss(Sm,tau,b);
  const chart=`<div class="kit-panel"><p style="margin:0 0 8px">행 = 사진, 열 = 설명서 문장 (${NAMES.join(' · ')}) · 코사인 유사도</p>${U.grid(Sm,'4×4 코사인 유사도 표. 대각선이 짝이 맞는 쌍',2)}</div>`;
  U.result(el,chart,
  `τ = ${F(tau,2)}: InfoNCE 사진→글 ${F(c.i2t,3)}, 글→사진 ${F(c.t2i,3)}, 평균 <strong>${F(c.loss,3)}</strong><br>소프트맥스 대각 확률: ${c.diag.map((p,i)=>`${NAMES[i]} ${F(p,2)}`).join(' · ')}<br>SigLIP (b = ${F(b,1)}): 손실 <strong>${F(s.loss,3)}</strong>, 짝 칸의 σ(s/τ + b): ${s.diag.map(p=>F(p,2)).join(' · ')}<br>유사도 표는 τ와 무관하므로 순위는 그대로입니다. 막힌 필터와 꺾인 호스처럼 닮은 오답이 손실의 큰 몫을 만듭니다. 임베딩은 예시, 계산은 실제입니다.`);});
};

A13Labs.qformer=el=>{
 U.setup(el,R('qfq','쿼리 수 Q',8,256,8,32)+R('qfimg','한 상담의 사진 장수',1,32,1,8));
 U.bind(el,()=>{const Q=V(el,'qfq'),n=V(el,'qfimg'),r=M.qformer(256,Q,n);
  U.result(el,U.bars(['패치 그대로 (MLP)','Q-Former'],[r.mlp,r.qf],'언어 모델이 받는 시각 토큰',null,0),
  `사진당 패치 256개(ViT-g/14, 224 해상도 가정) × ${n}장 = <b>${F(r.mlp,0)}</b>토큰<br>Q-Former: 쿼리 ${Q}개 × ${n}장 = <strong>${F(r.qf,0)}토큰</strong>, 압축률 256 / ${Q} = ${F(r.ratio,1)}배, 아낀 토큰 ${F(r.saved,0)}<br>대신 교차 어텐션이 쿼리×패치 ${F(r.crossPairs,0)}쌍을 계산합니다. 쿼리가 적을수록 문맥은 아끼지만 요약에 담기는 정보도 줄어듭니다.<br>토큰 수는 실제 계산이고, 정보가 얼마나 남는지는 계산하지 않습니다.`);});
};

A13Labs.gate=el=>{
 U.setup(el,R('glr','학습률 η',0.05,2,0.05,0.3));
 U.bind(el,()=>{const lr=V(el,'glr'),h=M.gateTrain(lr,30),last=h[h.length-1],hit=h.find(x=>x.loss<1e-3);
  const chart=U.plot({lines:[{data:h.map(x=>[x.step,x.gate]),color:'var(--accent)'},{data:h.map(x=>[x.step,x.loss]),color:'var(--orange)',dashed:true}],points:[[0,0,'var(--accent)',5],[30,last.gate,'var(--accent)',5]],xmin:0,xmax:30,ymin:-0.2,ymax:1.2,xlabel:'학습 단계',ylabel:'게이트 tanh(α) · 손실(점선)',label:`학습률 ${lr}에서 게이트가 0에서 ${F(last.gate,2)}로 열리는 그래프`});
  U.result(el,chart,
  `시작: α = 0, 게이트 tanh(0) = 0, 출력 y = 0.2(글만), 손실 (0.2 − 0.8)² = 0.36<br>첫 기울기 ∂L/∂α = 2·(−0.6)·1·(1 − 0²) = −1.2 → α₁ = ${F(h[1].alpha,3)}, 게이트 ${F(h[1].gate,3)}<br>30단계 뒤 게이트 <strong>${F(last.gate,3)}</strong> (목표 0.6), 손실 ${last.loss<1e-4?last.loss.toExponential(1):F(last.loss,4)}${hit?` · 손실 0.001 미만 도달 ${hit.step}단계`:' · 30단계 안에 손실 0.001 미만에 이르지 못함'}<br>게이트 출력은 0에서 시작해도 tanh의 기울기는 1이라 첫 단계부터 움직입니다. 값 하나짜리 장난감 모형의 실제 계산입니다.`);});
};

A13Labs.budget=el=>{
 U.setup(el,S('bdconn','연결 방식 (사진당 시각 토큰)',[[32,'Q-Former 32'],[576,'LLaVA MLP 576'],[2880,'AnyRes 2×2 + 썸네일 2,880']],576)+R('bdimg','사진 장수',1,8,1,3)+S('bdctx','문맥 길이',[[2048,'2,048'],[4096,'4,096'],[8192,'8,192'],[32768,'32,768']],8192));
 U.bind(el,()=>{const per=V(el,'bdconn'),n=V(el,'bdimg'),ctx=V(el,'bdctx'),r=M.contextBudget(ctx,per,n,200);
  U.result(el,U.bars(['이미지 토큰','프롬프트','남는 글 자리'],[r.visual,200,Math.max(0,r.left)],'토큰',ctx,0),
  `${F(per,0)} × ${n}장 = <b>${F(r.visual,0)}</b>토큰 (문맥의 ${F(r.share*100,1)}%), 시스템·질문 200토큰(가정)<br>남는 글 자리 = ${F(ctx,0)} − ${F(r.visual,0)} − 200 = <strong>${F(r.left,0)}</strong>${r.fits?'':' → 문맥을 넘어 사진을 줄이거나 연결 방식을 바꿔야 합니다'}<br>주황 점선이 문맥 길이입니다. 연결 방식은 품질보다 먼저 이 예산을 정합니다. 실제 계산입니다.`);});
};
})();
