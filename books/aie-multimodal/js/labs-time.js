/* 5~6장 실험: 해상도 전략, 영상 토큰 예산, 짧은 사건 포착 확률. 계산은 A13Math, 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=A13UI,M=A13Math,R=U.range,S=U.select,V=U.value,F=U.fmt;

A13Labs.anyres=el=>{
 U.setup(el,R('arw','문서 가로 (px)',224,4096,2,600)+R('arh','문서 세로 (px)',224,4096,2,1800)+R('arcap','원래 비율 토큰 상한',256,4096,64,1280));
 U.bind(el,()=>{const W=V(el,'arw'),H=V(el,'arh'),cap=V(el,'arcap'),sq=M.squarePad(W,H),ar=M.anyres(W,H),nv=M.nativeTokens(W,H,28,cap*784);
  U.result(el,U.bars(['정사각형 336','AnyRes','원래 비율'],[sq.tokens,ar.tokens,nv.tokens],'시각 토큰',null,0),
  `정사각형: 긴 변을 336으로 ${F(sq.scale,3)}배 줄이고 빈칸을 채움 → 576토큰, 칸의 <b>${F(sq.pad*100,1)}%</b>가 채움<br>AnyRes: 격자 ${ar.grid.r}행×${ar.grid.c}열 타일 ${ar.tiles}개 + 썸네일 → (${ar.tiles} + 1) × 576 = <strong>${F(ar.tokens,0)}토큰</strong><br>원래 비율: ${nv.w}×${nv.h}px(28 단위) → ${nv.gw}×${nv.gh} = <strong>${F(nv.tokens,0)}토큰</strong>${nv.w*nv.h<Math.round(W/28)*28*Math.round(H/28)*28?` (상한 ${F(cap,0)}토큰에 맞춰 줄임)`:''}<br>격자 선택은 줄인 뒤 유효 해상도가 가장 큰 것, 원래 비율은 28픽셀 반올림 규칙의 실제 계산입니다. 글자가 읽힐지는 계산하지 않습니다.`);});
};

const POOL=[[1,'없음 (27×27 = 729)'],[2,'2×2 (14×14 = 196)'],[3,'3×3 (9×9 = 81)'],[6,'6×6 (5×5 = 25)']];
A13Labs.videobudget=el=>{
 U.setup(el,R('vbsec','영상 길이 (초)',10,600,10,90)+S('vbfps','표본 FPS',[[0.5,'0.5'],[1,'1'],[2,'2'],[4,'4'],[8,'8']],2)+S('vbpool','프레임 안 풀링',POOL,3));
 U.bind(el,()=>{const T=V(el,'vbsec'),fps=V(el,'vbfps'),k=V(el,'vbpool'),per=M.pooled(27,k),B=32768,r=M.videoBudget(T,fps,per,B);
  U.result(el,U.bars(['영상 시각 토큰'],[r.tokens],'토큰 (점선 = 예산 32,768)',B,0),
  `${T}초 × ${fps} FPS = <b>${F(r.frames,0)}</b>프레임 × 프레임당 ${per}토큰 = <strong>${F(r.tokens,0)}토큰</strong> (예산의 ${F(r.share*100,1)}%)<br>${r.fits?'예산 안에 들어갑니다.':'예산을 넘습니다. FPS를 낮추거나 풀링을 세게 하거나, 구간을 나눠 읽어야 합니다.'}<br>이 풀링에서 예산 안의 최대 FPS = 32,768 ÷ (${T} × ${per}) = <b>${F(r.fpsMax,2)}</b><br>384 해상도·패치 14(27×27 격자)를 가정한 실제 계산이며, 예산 값은 가정입니다.`);});
};

A13Labs.eventcatch=el=>{
 U.setup(el,R('ecdur','사건 길이 d (초)',0.1,2,0.1,0.4)+S('ecfps','표본 FPS',[[0.5,'0.5'],[1,'1'],[2,'2'],[4,'4'],[8,'8']],1));
 U.bind(el,()=>{const d=V(el,'ecdur'),fps=V(el,'ecfps'),r=M.eventCatch(d,fps),curve=[];for(let x=0.25;x<=8.001;x+=0.25)curve.push([x,M.eventCatch(d,x).p]);
  const chart=U.plot({lines:[{data:curve,color:'var(--accent)'}],points:[[fps,r.p,'var(--orange)',7]],xmin:0,xmax:8,ymin:0,ymax:1.05,xlabel:'표본 FPS',ylabel:'포착 확률',label:`길이 ${d}초 사건을 ${fps} FPS로 잡을 확률 ${F(r.p,2)}`});
  U.result(el,chart,
  `프레임 간격 1 / ${fps} = ${F(r.gap,2)}초, 사건 길이 ${F(d,1)}초<br>포착 확률 = min(1, ${F(d,1)} × ${fps}) = <strong>${F(r.p*100,0)}%</strong>, 사건 안에 들어오는 평균 프레임 ${F(r.expected,2)}장<br>${r.p<1?`${F((1-r.p)*100,0)}% 확률로 영상 표본에서는 이 사건이 보이지 않습니다. 같은 순간의 소리나 더 높은 FPS가 필요합니다.`:'간격보다 사건이 길어 반드시 한 장 이상 잡힙니다.'}<br>표본 시작 위치가 균일하게 무작위라는 가정의 실제 계산입니다.`);});
};
})();
