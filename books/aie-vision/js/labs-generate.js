/* 10~12장 실험: 확산 일정, CFG, 정류 흐름 오일러 단계, 엣지 지연 예산. 벡터와 지연 기준값은 미리 정한 예시다. */
(()=>{
'use strict';
const U=A05UI,M=A05Math,R=U.range,S=U.select,V=U.value,F=U.fmt;

A05Labs.noise=el=>{
 U.setup(el,R('nt','확산 시점 t (0~1000)',0,1000,10,250));
 U.bind(el,()=>{const t=V(el,'nt'),ab=M.alphaBar(t),sig=Math.sqrt(ab),noi=Math.sqrt(1-ab);
  const curve=Array.from({length:51},(_,i)=>{const s=i*20,a=M.alphaBar(s);return [s,Math.sqrt(a),Math.sqrt(1-a)];});
  const chart=U.plot({lines:[{data:curve.map(c=>[c[0],c[1]]),color:'var(--accent)'},{data:curve.map(c=>[c[0],c[2]]),color:'var(--orange)',dashed:true}],points:[[t,sig,'var(--accent)',6],[t,noi,'var(--orange)',6]],
   xmin:0,xmax:1000,ymin:0,ymax:1,xlabel:'시점 t',ylabel:'계수',label:`시점 ${t}에서 신호 계수 ${F(sig,3)}, 잡음 계수 ${F(noi,3)}`});
  const words=sig>0.9?'원본이 거의 그대로입니다.':sig>0.5?'원본 신호가 아직 잡음보다 큽니다.':sig>0.05?'잡음이 신호보다 커졌습니다. 윤곽 정도만 남습니다.':'거의 순수 잡음입니다.';
  U.result(el,chart,
  `ᾱ_${t} = Π(1 − β_s) = <b>${F(ab,4)}</b><br>x_t = <strong>${F(sig,3)}</strong>·x₀ + <strong>${F(noi,3)}</strong>·ε (초록 실선: 신호, 주황 점선: 잡음). ${words}<br>두 계수의 제곱합은 언제나 ${F(sig*sig+noi*noi,3)}입니다. DDPM 선형 일정의 실제 계산입니다.`);});
};

const EU=[0.40,0.10],EC=[0.55,0.30];
A05Labs.cfg=el=>{
 U.setup(el,R('cw','가이던스 배율 w',0,12,0.5,7.5));
 U.bind(el,()=>{const w=V(el,'cw'),g=M.cfg(EU,EC,w),len=Math.hypot(...g),dist=Math.hypot(g[0]-EC[0],g[1]-EC[1]);
  const sc=v=>v*90,ox=60,oy=240,P=([x,y])=>[ox+sc(x),oy-sc(y)];
  const clamp=([x,y])=>[Math.max(10,Math.min(470,x)),Math.max(10,Math.min(270,y))];
  const arrow=(v,c,lab,dy=0)=>{const [x,y]=clamp(P(v));return `<path d="M${ox} ${oy}L${x} ${y}" stroke="${c}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="5" fill="${c}"/><text x="${Math.min(x+8,400)}" y="${y+4+dy}" style="fill:${c}">${lab}</text>`;};
  let b=`<path d="M${ox} 20V${oy}H470" stroke="var(--line)"/>`;
  const [ux,uy]=P(EU),[gx,gy]=clamp(P(g));b+=`<path d="M${ux} ${uy}L${gx} ${gy}" stroke="var(--muted)" stroke-dasharray="5 5"/>`;
  b+=arrow(EU,'var(--muted)','ε_u',14)+arrow(EC,'var(--blue)','ε_c',-6)+arrow(g,'var(--accent)','ε̂');
  const out=(P(g)[0]>470||P(g)[1]<10)?' 화살표 끝이 그림 밖으로 나가 가장자리에 붙여 그렸습니다.':'';
  U.result(el,U.svg(b,`가이던스 배율 ${w}에서 최종 예측 (${F(g[0],2)}, ${F(g[1],2)})`),
  `ε̂ = ε_u + w(ε_c − ε_u) = (0.40, 0.10) + ${w} × (0.15, 0.20) = <strong>(${F(g[0],2)}, ${F(g[1],2)})</strong><br>길이 ${F(len,2)}, 조건부 예측 ε_c에서 ${F(dist,2)}만큼 더 나갔습니다.${out}<br>w = 0이면 무조건부, 1이면 조건부 그대로, 1보다 크면 둘의 차이 방향으로 더 밀어 글 조건을 세게 따릅니다. 너무 크면 이 밀어내기가 과포화와 다양성 손실로 이어집니다. 벡터는 2차원 예시, 계산은 실제입니다.`);});
};

A05Labs.flowsteps=el=>{
 U.setup(el,R('fbend','길의 휜 정도 (0 = 곧은 정류 흐름)',0,1,0.1,0.5)+R('fsteps','오일러 단계 수 N',1,50,1,4));
 U.bind(el,()=>{const bend=V(el,'fbend'),n=V(el,'fsteps'),r=M.flowEuler(n,bend);
  const path=Array.from({length:41},(_,i)=>M.flowPath(i/40,bend));
  const chart=U.plot({lines:[{data:path,color:'var(--muted)',dashed:true},{data:r.pts,color:'var(--accent)'}],points:[[0.1,0.5,'var(--blue)',7],[0.9,0.5,'var(--orange)',7],...r.pts.slice(1).map(p=>[p[0],p[1],'var(--accent)',4])],
   xmin:0,xmax:1,ymin:0,ymax:1,xlabel:'← 데이터 x₀ (파랑) · 잡음 ε (주황) →',ylabel:'두 번째 좌표',label:`휜 정도 ${bend}, ${n}단계 오일러 적분의 도착 오차 ${F(r.err,4)}`});
  const verdict=r.err<1e-9?'곧은 길에서는 속도가 일정해 단계 수와 관계없이 정확히 도착합니다.':r.err<0.01?'오차가 0.01보다 작아 거의 도착했습니다.':'아직 데이터에서 눈에 띄게 빗나갑니다. 단계를 늘리거나 길을 곧게 펴야 합니다.';
  U.result(el,chart,
  `t = 1(잡음)에서 0(데이터)까지 h = 1/${n}씩 ${n}번 걸었습니다.<br>도착점 (${F(r.pts[n][0],3)}, ${F(r.pts[n][1],3)}), 데이터 (0.100, 0.500) → 오차 <strong>${F(r.err,4)}</strong><br>${verdict} 정확한 속도를 아는 장난감 모형의 실제 계산이며, 학습된 망의 속도 오차는 포함하지 않습니다.`);});
};

const STAGE=[['decode','디코드'],['pre','전처리'],['det','검출'],['nms','NMS'],['cls','분류']];
A05Labs.latency=el=>{
 U.setup(el,R('lside','모델 입력 한 변 (px)',320,1280,32,1280)+S('lprec','모델 정밀도',[['fp32','FP32'],['fp16','FP16'],['int8','INT8']],'fp32'));
 U.bind(el,()=>{const side=V(el,'lside'),prec=U.text(el,'lprec'),r=M.latency(side,prec),ok=r.total<=r.budget;
  const big=STAGE.reduce((a,s)=>r[s[0]]>r[a[0]]?s:a);
  U.result(el,U.bars([...STAGE.map(s=>s[1]),'합계'],[...STAGE.map(s=>r[s[0]]),r.total],'ms',r.budget,1),
  `입력 ${side}px, ${prec.toUpperCase()}: ${STAGE.map(s=>`${s[1]} ${F(r[s[0]],1)}`).join(' + ')} = <strong>${F(r.total,1)}ms</strong><br>주황 점선은 예산 ${F(r.budget,1)}ms(초당 30프레임)입니다. ${ok?`합계가 예산 안쪽입니다(여유 ${F(r.budget-r.total,1)}ms).`:`합계가 예산을 ${F(r.total-r.budget,1)}ms 넘습니다.`} 가장 큰 덩어리는 <b>${big[1]}</b>입니다.<br>이 숫자는 640·FP32 기준으로 가정한 시나리오와 단순 배율(픽셀 수 비례, INT8 0.4배, FP16 0.6배)의 계산입니다. 실제 장비의 p95와 해상도를 줄였을 때의 정확도 변화는 따로 재야 합니다.`);});
};
})();
