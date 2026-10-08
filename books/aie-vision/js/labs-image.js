/* 1~3장 실험: 합성곱 출력 크기, 전처리 실수, 잔차 기울기, ViT 패치, 소프트맥스 온도.
   계산은 A05Math가 하고 이 파일은 그리기와 결과 문장만 맡는다. */
(()=>{
'use strict';
const U=A05UI,M=A05Math,R=U.range,S=U.select,V=U.value,F=U.fmt;
const sci=n=>n===0?'0':(Math.abs(n)>=1e6||Math.abs(n)<1e-3)?n.toExponential(2).replace('e','×10^').replace('+',''):F(n,Math.abs(n)<1?4:2);
const int=n=>Math.round(n).toLocaleString('en-US');

A05Labs.convsize=el=>{
 U.setup(el,S('cvh','입력 한 변 H (px)',[[224,'224'],[480,'480 (대여소 프레임 세로)'],[640,'640 (가로)']],480)+R('cvk','커널 크기 K',1,7,2,3)+R('cvp','패딩 P',0,3,1,1)+R('cvs','보폭 S',1,4,1,1));
 U.bind(el,()=>{const H=V(el,'cvh'),K=V(el,'cvk'),P=V(el,'cvp'),S2=V(el,'cvs');
  const sizes=[H];for(let i=0;i<3;i++)sizes.push(Math.max(0,M.convOut(sizes[i],K,P,S2)));
  const rf=M.receptive([{k:K,s:S2},{k:K,s:S2},{k:K,s:S2}]),num=H-K+2*P,rem=num%S2;
  const note=rem?`(H − K + 2P) = ${num}이 보폭 ${S2}로 나누어떨어지지 않아 내림 때문에 마지막 ${rem}칸이 쓰이지 않습니다.`:`나누어떨어지므로 버려지는 칸이 없습니다.`;
  const same=P===(K-1)/2&&S2===1?' K와 P가 same 패딩 조건 P = (K−1)/2를 만족해 크기가 유지됩니다.':'';
  U.result(el,U.bars(['입력','1층','2층','3층'],sizes,'출력 한 변 (px)',null,0),
  `첫 층: ⌊(${H} − ${K} + 2×${P}) / ${S2}⌋ + 1 = <strong>${sizes[1]}</strong>px. ${note}${same}<br>같은 층 세 번: ${sizes.join(' → ')}px · 수용 영역 ${rf.join(' → ')}px<br>RGB 입력 → 64채널 첫 층 파라미터: 64×3×${K}×${K} + 64 = <b>${int(M.convParams(3,64,K))}</b>개. 식 그대로의 실제 계산입니다.`);});
};

A05Labs.standardize=el=>{
 const modes=[['ok','올바른 순서 (÷255 → 표준화)'],['raw','÷255 빠뜨림'],['nostd','표준화 빠뜨림 (÷255만)'],['bgr','BGR 순서로 넣음']];
 U.setup(el,S('stmode','전처리 방식',modes,'ok')+R('str','자전거 몸체 픽셀의 빨강 값 R (0~255)',0,255,5,200));
 U.bind(el,()=>{const mode=U.text(el,'stmode'),r=V(el,'str'),rgb=[r,60,40],x=M.preprocess(rgb,mode),name=modes.find(m=>m[0]===mode)[1];
  const labels=['R 정상','R 이번 방식','G 정상','G 이번 방식','B 정상','B 이번 방식'],vals=[x.ok[0],x.got[0],x.ok[1],x.got[1],x.ok[2],x.got[2]];
  const verdict=x.gap<1e-9?'정상 입력과 같습니다.':x.gap>10?'모델이 학습 때 본 범위(대략 −2~+2)를 수백 배 벗어납니다. 오류는 나지 않지만 예측은 무의미해집니다.':'값의 범위나 채널 뜻이 달라져 모델이 다른 색으로 봅니다.';
  U.result(el,U.bars(labels,vals,'모델 입력값 (막대 길이는 절댓값)',null,2),
  `픽셀 (R, G, B) = (${r}, 60, 40), 방식: <b>${name}</b><br>정상 입력: (${x.ok.map(v=>F(v,2)).join(', ')}) · 이번 방식: (${x.got.map(v=>F(v,2)).join(', ')})<br>채널별 최대 차이 <strong>${F(x.gap,2)}</strong>. ${verdict}<br>ImageNet 평균·표준편차로 계산한 실제 값이며, 픽셀은 예시입니다.`);});
};

A05Labs.residual=el=>{
 U.setup(el,R('resl','블록 수 L',2,60,1,30)+R('resa','블록 하나의 기울기 배율 a',0.3,0.95,0.05,0.8));
 U.bind(el,()=>{const L=V(el,'resl'),a=V(el,'resa'),r=M.residual(L,a),lg=Math.log10;
  const ymin=Math.min(-1,Math.floor(L*lg(a)));
  const xs=Array.from({length:L+1},(_,d)=>d);
  const chart=U.plot({lines:[{data:xs.map(d=>[d,d*lg(a)]),color:'var(--orange)'},{data:xs.map(d=>[d,0]),color:'var(--accent)'},{data:xs.map(d=>[d,d/2*lg(a)]),color:'var(--blue)',dashed:true}],
   xmin:0,xmax:L,ymin,ymax:0.5,xlabel:'지나온 블록 수',ylabel:'log₁₀ 기울기 크기',label:`블록 수에 따른 기울기: 평범한 망은 ${sci(r.plain)}로 줄고 잔차 망의 지름길은 1을 유지`});
  U.result(el,chart,
  `평범한 망: a^L = ${a}^${L} = <strong>${sci(r.plain)}</strong> (주황 선). 앞쪽 층은 거의 배우지 못합니다.<br>잔차 망: 블록마다 1 + a를 곱하는 셈이라 경로가 2^${L} ≈ ${sci(r.paths)}개로 갈라지고, 모든 블록을 덧셈으로 건너는 경로는 언제나 <b>1</b>을 그대로 전합니다(초록 선). 평균 길이 L/2 경로의 기여는 ${sci(r.typical)}입니다(파란 점선).<br>층마다 같은 배율을 곱하는 선형 장난감 모형의 실제 계산입니다. 실제 망에서는 정규화가 크기를 함께 조절합니다.`);});
};

A05Labs.patches=el=>{
 U.setup(el,S('vimg','입력 한 변 (px)',[[224,'224'],[336,'336'],[448,'448'],[640,'640']],224)+S('vpatch','패치 한 변 p (px)',[[8,'8'],[14,'14'],[16,'16'],[32,'32']],16));
 U.bind(el,()=>{const H=V(el,'vimg'),p=V(el,'vpatch'),r=M.vit(H,p),base=M.vit(224,16).pairs;
  const g=r.grid,cell=200/g;let b=`<rect x="20" y="44" width="200" height="200" fill="var(--panel2)" stroke="var(--line)"/>`;
  if(g<=64)for(let i=1;i<g;i++)b+=`<path d="M${20+i*cell} 44V244M20 ${44+i*cell}H220" stroke="var(--accent)" stroke-width="${g>40?.4:.8}"/>`;
  b+=`<rect x="20" y="44" width="${cell}" height="${cell}" fill="var(--orange)" opacity=".8"/><text x="20" y="28">${H}×${H} → ${g}×${g} 격자</text>`;
  b+=`<text x="250" y="80">패치 ${r.patches.toLocaleString('en-US')}개</text><text x="250" y="112">+ [CLS] 1개</text><text x="250" y="144">= ${r.seq.toLocaleString('en-US')} 토큰</text><text x="250" y="190">어텐션 쌍</text><text x="250" y="218">${r.pairs.toLocaleString('en-US')}</text><text x="250" y="250">기준의 ${F(r.pairs/base,1)}배</text>`;
  const drop=r.dropped?`<br>${H}이 ${p}로 나누어떨어지지 않아 가장자리 ${r.dropped}px은 패치에 들어가지 못합니다(보통은 입력 크기를 맞춰 피함).`:'';
  U.result(el,U.svg(b,`${H}×${H} 입력을 패치 ${p}로 자르면 ${g}×${g}개 패치와 토큰 ${r.seq}개`),
  `격자 ⌊${H}/${p}⌋ = ${g}, 패치 ${g}² = ${r.patches}개, [CLS] 포함 <strong>${r.seq}</strong>토큰.<br>어텐션이 비교하는 쌍: ${r.seq}² = <b>${r.pairs.toLocaleString('en-US')}</b> (기준 224·패치 16의 197² = 38,809쌍의 ${F(r.pairs/base,2)}배).${drop}<br>실제 계산입니다. 쌍의 수는 헤드 수·폭과 무관한 비교 횟수의 비율만 보여 줍니다.`);});
};

A05Labs.softmax=el=>{
 const z=[2,0.5,-1],names=['자전거','사람','빈 칸'];
 U.setup(el,R('smt','온도 T',0.25,4,0.25,1)+S('sme','라벨 스무딩 ε',[[0,'0 (원-핫)'],[0.1,'0.1'],[0.2,'0.2']],0));
 U.bind(el,()=>{const T=V(el,'smt'),eps=V(el,'sme'),p=M.softmax(z,T),t=M.smoothTarget(3,eps,0),ce=M.crossEntropy(p,t),hard=-Math.log(p[0]);
  U.result(el,U.bars(names.map((n,i)=>`${n} (z=${z[i]})`),p,'확률',null,3),
  `p = softmax(z / ${T}) = (${p.map(v=>F(v,3)).join(', ')})<br>목표 분포(정답 자전거, ε=${eps}): (${t.map(v=>F(v,3)).join(', ')})<br>교차 엔트로피 <strong>${F(ce,3)}</strong> · 원-핫 기준 −log p(자전거) = ${F(hard,3)}<br>T가 작을수록 가장 큰 logit 쪽으로 확률이 몰리고, ε가 크면 정답 확률이 1에 가까울수록 오히려 손실이 커져 과신을 막습니다. logit은 예시 값, 계산은 실제입니다.`);});
};
})();
