/* 4~6장 실험: NMS, 분할 지표, 칼만 필터. 입력 상자·검출 위치는 미리 정한 예시다. */
(()=>{
'use strict';
const U=A05UI,M=A05Math,R=U.range,S=U.select,V=U.value,F=U.fmt;
const int=n=>Math.round(n).toLocaleString('en-US');

/* 480×280 그림 좌표의 후보 상자. 자전거 두 대(a·b)와 사람 한 명(p) 주변. */
const CANDS=[
 {id:'a1',box:[40,110,190,230],score:.92},{id:'a2',box:[52,118,200,236],score:.81},{id:'a3',box:[30,100,175,225],score:.55},
 {id:'b1',box:[172,114,318,234],score:.88},{id:'b2',box:[185,120,330,240],score:.40},
 {id:'p1',box:[335,30,420,238],score:.76},{id:'p2',box:[322,42,410,250],score:.35}];
A05Labs.nms=el=>{
 U.setup(el,R('nmst','NMS 임계값 (IoU)',0.05,0.9,0.05,0.45)+R('nmss','점수 문턱',0.1,0.9,0.05,0.3));
 U.bind(el,()=>{const thr=V(el,'nmst'),ms=V(el,'nmss'),r=M.nms(CANDS,thr,ms);
  const state=i=>r.kept.includes(i)?'kept':r.below.includes(i)?'low':'gone';
  let b=`<rect x="8" y="8" width="464" height="264" rx="6" fill="var(--panel2)"/><path d="M8 240H472" stroke="var(--line)" stroke-width="2"/>`;
  CANDS.forEach((c,i)=>{const [x1,y1,x2,y2]=c.box,s=state(i);
   const st=s==='kept'?'stroke="var(--accent)" stroke-width="3"':s==='gone'?'stroke="var(--orange)" stroke-width="1.5" stroke-dasharray="6 4"':'stroke="var(--muted)" stroke-width="1" stroke-dasharray="2 4" opacity=".6"';
   b+=`<rect x="${x1}" y="${y1}" width="${x2-x1}" height="${y2-y1}" fill="none" ${st}/>`;
   if(s==='kept')b+=`<rect x="${x1}" y="${y1-22}" width="86" height="22" fill="var(--accent)"/><text x="${x1+5}" y="${y1-5}" style="fill:var(--bg)">${c.id} ${F(c.score,2)}</text>`;});
  const kept=r.kept.map(i=>CANDS[i].id),gone=r.removed.map(x=>`${CANDS[x.i].id}(${CANDS[x.by].id}와 IoU ${F(x.iou,2)})`);
  const lost=['a1','b1','p1'].filter(id=>!kept.some(k=>k[0]===id[0]));
  const verdict=lost.length?`실제 물체 ${lost.length}개(${lost.join(', ')} 쪽)가 통째로 사라졌습니다. 임계값이나 점수 문턱이 지나칩니다.`:kept.length>3?`물체는 3개인데 상자가 ${kept.length}개 남아 중복이 있습니다.`:'물체 셋에 상자 셋, 깔끔하게 정리되었습니다.';
  U.result(el,U.svg(b,`NMS 결과: 남은 상자 ${kept.join(', ')}`),
  `점수 ${F(ms,2)} 미만 ${r.below.length}개 제외 → 점수 순서로 NMS(임계값 ${F(thr,2)})<br>남은 상자 <strong>${kept.length}개</strong>: ${kept.join(', ')}<br>지운 상자: ${gone.length?gone.join(', '):'없음'}<br>${verdict}<br>후보 상자와 점수는 미리 정한 예시이고, IoU와 NMS는 실제 계산입니다.`);});
};

A05Labs.dice=el=>{
 const total=10000,fp=50;
 U.setup(el,R('dfg','전경(넘어진 자전거) 비율 (%)',1,40,1,5)+R('drec','모델이 찾아낸 전경 비율 (%)',0,100,5,60));
 U.bind(el,()=>{const fgp=V(el,'dfg'),rec=V(el,'drec'),fg=fgp*100,tp=Math.round(fg*rec/100),m=M.segMetrics(total,fg,tp,fp),base=M.segMetrics(total,fg,0,0);
  U.result(el,U.bars(['픽셀 정확도','IoU','Dice','“모두 배경”의 정확도'],[m.acc,m.iou,m.dice,base.acc],'0~1',null,3),
  `100×100 = ${int(total)}픽셀 중 전경 ${int(fg)}픽셀. 찾은 전경 TP ${int(tp)}, 놓친 FN ${int(m.fn)}, 오탐 FP ${fp}(고정).<br>픽셀 정확도 (TP+TN)/전체 = <b>${F(m.acc,3)}</b> · IoU = TP/(TP+FP+FN) = <strong>${F(m.iou,3)}</strong> · Dice = <strong>${F(m.dice,3)}</strong><br>아무것도 찾지 않고 “모두 배경”이라 답해도 정확도는 ${F(base.acc,3)}입니다. 전경이 작을수록 정확도는 높게 나오고 IoU·Dice만 실패를 드러냅니다.<br>픽셀 개수는 시나리오, 지표 계산은 실제입니다.`);});
};

/* 오른쪽으로 프레임당 12px 걷는 사람. 7~9프레임은 기둥에 가려 검출 없음. 측정 오프셋은 고정 예시. */
const OFF=[3,-4,5,-2,4,-5,2,null,null,null,-3,4,-2,3],TRUTH=OFF.map((_,t)=>40+12*t),MEAS=OFF.map((o,t)=>o===null?null:TRUTH[t]+o);
A05Labs.kalman=el=>{
 U.setup(el,R('kr','검출 오차 분산 R (px²)',1,200,1,25));
 U.bind(el,()=>{const r=V(el,'kr'),q=0.5,out=M.kalman(MEAS,q,r);
  const err=out.map((o,t)=>Math.abs(o.x-TRUTH[t])),rmse=Math.sqrt(err.reduce((s,e)=>s+e*e,0)/err.length);
  const pts=MEAS.map((z,t)=>z===null?null:[t,z,'var(--orange)',5]).filter(Boolean);
  const chart=U.plot({lines:[{data:TRUTH.map((x,t)=>[t,x]),color:'var(--muted)',dashed:true},{data:out.map(o=>[o.t,o.x]),color:'var(--accent)'}],points:pts,
   xmin:0,xmax:13,ymin:0,ymax:240,xlabel:'프레임',ylabel:'가로 위치 (px)',label:`칼만 추적 궤적. 가림 구간 7~9프레임은 예측만으로 이어짐, 평균 오차 ${F(rmse,1)}px`});
  const o9=out[9],o10=out[10];
  U.result(el,chart,
  `Q = ${q}, R = ${r}. 마지막 프레임의 위치 이득 K = <b>${F(out[13].k,2)}</b> (R이 클수록 검출을 덜 믿음).<br>가림 끝(9프레임) 예측 ${F(o9.x,1)}px, 실제 ${TRUTH[9]}px → 오차 <strong>${F(Math.abs(o9.x-TRUTH[9]),1)}px</strong>. 10프레임 검출 ${MEAS[10]}px 뒤 궤적 ${F(o10.x,1)}px(K = ${F(o10.k,2)}).<br>전체 14프레임 평균제곱근 오차 <strong>${F(rmse,2)}px</strong>. 1차원 등속 칼만 필터의 실제 계산이며, 검출 위치는 미리 정한 시나리오입니다.`);});
};
})();
