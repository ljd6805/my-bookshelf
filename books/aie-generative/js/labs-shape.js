/* 1~4장 실험: 커널 밀도, 병목 크기, β-VAE, GAN 균형, L1·L2, 절단 ψ. 계산은 A09Math에서 하고 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=A09UI,M=A09Math,R=U.range,F=U.fmt;
const pct=x=>F(x*100,0)+'%';
A09Labs.density=el=>{
 U.setup(el,R('bw','커널 폭 h (특징값 단위)',0.05,2,0.05,0.3));
 U.bind(el,()=>{const h=U.value(el,'bw'),r=M.density(h);
  const chart=U.plot({lines:[{data:r.grid.map(g=>[g[0],g[2]]),color:'var(--muted)',dashed:true},{data:r.grid.map(g=>[g[0],g[1]])}],xmin:-5,xmax:5,ymin:0,ymax:0.8,xlabel:'특징값 (낮 −2, 밤 +2)',ylabel:'밀도',label:`커널 폭 ${F(h,2)}의 커널 밀도 곡선과 참 밀도(점선). 봉우리 ${r.peaks}개.`});
  U.result(el,chart,`구간 [1.5, 2.5] 확률 — 참값 <b>${F(r.truth,3)}</b>, 히스토그램(400장 중 세기) <b>${F(r.hist,3)}</b>, 커널 밀도 <strong>${F(r.kde,3)}</strong> (오차 ${F(r.errKde,3)})<br>커널 밀도 곡선의 봉우리: <b>${r.peaks}개</b>. ${r.peaks>2?'폭이 좁아 표본 하나하나에 봉우리가 생겼습니다(과적합).':r.peaks<2?'폭이 넓어 두 장면이 하나로 뭉개졌습니다.':'두 장면이 두 봉우리로 드러납니다.'}<br>두 방식 모두 “이 구간은 얼마나 그럴듯한가”에 답하는 명시적 밀도입니다. 표본만 뽑는 생성기는 이 질문에 답하지 못합니다. 시드를 고정한 400장으로 한 실제 계산입니다.`);});
};
A09Labs.bottleneck=el=>{
 U.setup(el,R('zdim','잠재 차원 k (개)',1,8,1,2));
 U.bind(el,()=>{const k=U.value(el,'zdim'),r=M.bottleneck(k),labels=M.LAMBDA.map((_,i)=>`특징 방향 ${i+1}${i<k?' (남김)':''}`);
  U.result(el,U.bars(labels,M.LAMBDA.map((l,i)=>i<k?l:0),'남긴 분산',null,2),`잠재 차원 <b>${k}</b>개 → 남긴 분산 <b>${F(r.kept,2)}</b> / 전체 ${F(r.total,2)} = <strong>${pct(r.retained)}</strong><br>재구성 오차(버린 분산의 합) <b>${F(r.error,2)}</b>. 분산이 큰 방향부터 남기는 선형 오토인코더의 최적해(주성분 분석과 같음)로 한 실제 계산입니다.<br>압축은 잘해도, 잠재 공간에서 아무 점이나 골라 디코딩할 규칙은 아직 없습니다. 분산 값은 교육용 가정입니다.`);});
};
A09Labs.beta=el=>{
 U.setup(el,R('beta','KL 가중치 β',0.1,12,0.1,1));
 U.bind(el,()=>{const b=U.value(el,'beta'),r=M.betaVae(b),grid=[];for(let v=0.1;v<=12.01;v+=0.1){const g=M.betaVae(v);grid.push([v,g.recon,g.kl]);}
  const chart=U.plot({lines:[{data:grid.map(g=>[g[0],g[1]])},{data:grid.map(g=>[g[0],g[2]]),color:'var(--blue)',dashed:true}],points:[[b,r.recon,'var(--orange)',6],[b,r.kl,'var(--orange)',6]],xmin:0,xmax:12,ymin:0,ymax:12,xlabel:'β',ylabel:'재구성 오차(실선)·KL(점선)',label:`β ${F(b,1)}에서 재구성 오차 ${F(r.recon,2)}, KL ${F(r.kl,2)}`});
  const dead=r.dims.filter(d=>!d.active).map(d=>d.lam).join(', ');
  U.result(el,chart,`β = <b>${F(b,1)}</b> · 살아 있는 잠재 차원 <strong>${r.active} / 8</strong> (문턱 β/2 = ${F(b/2,2)})<br>재구성 오차 <b>${F(r.recon,2)}</b>, KL <b>${F(r.kl,2)}</b>, 손실 = 재구성 + β·KL = <b>${F(r.loss,2)}</b><br>${r.active<8?`분산 ${dead}인 방향은 사전분포로 붕괴해 아무 정보도 싣지 않습니다(사후 붕괴). `:'모든 방향이 정보를 싣지만 KL이 커서 잠재 공간이 사전분포에서 멉니다. '}선형 가우스 β-VAE의 닫힌 해로 한 실제 계산입니다.`);});
};
A09Labs.balance=el=>{
 U.setup(el,R('etag','생성자 학습률 ηG',0.5,16,0.5,2)+R('etad','판별자 학습률 ηD',0.4,4,0.2,2));
 U.bind(el,()=>{const g=U.value(el,'etag'),d=U.value(el,'etad'),r=M.ganSim(g,d);
  const chart=U.plot({lines:[{data:[[0,0.5],[300,0.5]],color:'var(--muted)',dashed:true},{data:r.trace.map(p=>[p[0],p[1]])},{data:[[0,0.1],[300,0.1]],color:'var(--orange)',dashed:true},{data:[[0,0.9],[300,0.9]],color:'var(--orange)',dashed:true}],xmin:0,xmax:300,ymin:0,ymax:1,xlabel:'학습 단계',ylabel:'생성자가 내는 밤 장면 비율',label:`300단계 동안 밤 장면 비율의 변화. 마지막 비율 ${F(r.final,2)}`});
  U.result(el,chart,`ηG = <b>${F(g,1)}</b>, ηD = <b>${F(d,1)}</b> · 마지막 밤 장면 비율 <b>${pct(r.final)}</b><br>마지막 150단계에서 덜 나온 장면의 최소 비율 <strong>${pct(r.minShare)}</strong>, 흔들린 폭 <b>${F(r.swing,2)}</b> → ${r.collapse?'<strong>모드 붕괴</strong>: 한 장면이 10% 아래로 굶는 순간이 있습니다. 생성자가 판별자가 약한 쪽으로 몰렸다가 반대로 튀기를 반복합니다.':r.swing>0.05?'반반 근처에서 흔들리지만 두 장면을 모두 냅니다.':'반반(0.5)에 수렴했습니다. 판별자는 두 장면 모두에 0.5 근처를 줍니다.'}<br>생성자·판별자를 숫자 세 개로 줄인 교육용 시뮬레이션이며, 기울기는 실제 손실식에서 계산했습니다.`);});
};
A09Labs.l1l2=el=>{
 U.setup(el,R('pred','목도리가 빨강일 확률 p',0,1,0.05,0.7));
 U.bind(el,()=>{const p=U.value(el,'pred'),r=M.l1l2(p),hue=y=>`rgb(${Math.round(220*(1-y)+40*y)},60,${Math.round(60*(1-y)+220*y)})`;
  const box=(x,y,label)=>`<rect x="${x}" y="70" width="120" height="110" rx="10" fill="${hue(y)}" stroke="var(--line)"/><text x="${x+60}" y="205" text-anchor="middle">${label}</text><text x="${x+60}" y="230" text-anchor="middle">색값 ${F(y,2)}</text>`;
  const chart=U.svg(`<text x="240" y="40" text-anchor="middle">색값 0 = 빨강, 1 = 파랑</text>${box(40,r.l2,'L2가 고른 색')}${box(180,r.l1,'L1이 고른 색')}<rect x="340" y="70" width="50" height="50" rx="8" fill="${hue(0)}"/><rect x="340" y="130" width="50" height="50" rx="8" fill="${hue(1)}"/><text x="400" y="100">빨강 ${pct(p)}</text><text x="400" y="160">파랑 ${pct(1-p)}</text>`,`L2는 색값 ${F(r.l2,2)}, L1은 ${F(r.l1,2)}를 고릅니다`);
  U.result(el,chart,`L2 최적 답 = 평균 = <b>${F(r.l2,2)}</b> → 가장 가까운 실제 색과의 거리 ${F(r.gapL2,2)}, ${r.plausibleL2?'있을 법한 색':'<strong>데이터에 없는 중간색(보라 쪽)</strong>'}<br>L1 최적 답 = 중앙값 = <b>${F(r.l1,2)}</b> → 거리 ${F(r.gapL1,2)}, ${r.plausibleL1?'있을 법한 색':'<strong>두 답이 반반이라 중앙값도 가운데</strong>'}<br>정답이 갈리는 곳에서 L2는 흐리고 L1은 더 흔한 쪽을 고릅니다. 그래서 Pix2Pix는 L1에 “진짜 같은가”를 묻는 적대 손실을 더합니다. 두 점 분포로 한 실제 계산입니다.`);});
};
A09Labs.truncation=el=>{
 U.setup(el,R('psi','절단 ψ',0,1.2,0.05,1));
 U.bind(el,()=>{const p=U.value(el,'psi'),r=M.truncation(p),base=M.truncation(1);
  const chart=U.scatter(r.pts,{xmin:-3,xmax:4,ymin:-3,ymax:3,ring:[r.center[0],r.center[1],r.radius],label:`ψ ${F(p,2)}로 당긴 스타일 점 300개와 평균 근처 원`});
  U.result(el,chart,`ψ = <b>${F(p,2)}</b> · 다양성(평균에서의 평균 거리) <b>${F(r.diversity,2)}</b> = ψ=1일 때의 <strong>${F(r.diversity/base.diversity,2)}배</strong><br>평균 근처(점선 원 안)에 있는 비율 <b>${pct(r.inside)}</b>. 평균 근처는 학습 데이터가 많아 그림이 깨끗하게 나오는 영역으로 봅니다.<br>${p<0.6?'깨끗하지만 비슷한 그림만 나옵니다.':p>1?'ψ > 1은 평균에서 더 멀리 밀어 어색한 그림이 늘어납니다.':'품질과 다양성을 맞바꾸는 구간입니다. 원본은 ψ ≈ 0.7을 흔한 값으로 듭니다.'} W 공간은 2차원 교육용 분포이며 계산은 실제입니다.`);});
};
})();
