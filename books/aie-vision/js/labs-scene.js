/* 4~6장 실험: NMS, 검출 AP, 분할 지표, 칼만 필터. 입력 상자·검출 위치는 미리 정한 예시다. */
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

/* 같은 장면의 정답 상자(사람이 그린 라벨이라고 정한 예시). 자전거 A·B와 사람 P. */
const GTS=[{id:'A',box:[44,112,194,232]},{id:'B',box:[196,122,338,242]},{id:'P',box:[333,34,418,242]}];
function apScene(r){
 const st=i=>{const row=r.rows.find(x=>x.i===i);return row?(row.tp?'tp':'fp'):'out';};
 let b=`<rect x="8" y="8" width="464" height="264" rx="6" fill="var(--panel2)"/>`;
 GTS.forEach(g=>{const [x1,y1,x2,y2]=g.box;b+=`<rect x="${x1}" y="${y1}" width="${x2-x1}" height="${y2-y1}" fill="none" stroke="var(--text)" stroke-width="4" stroke-dasharray="2 5" opacity=".75"/><text x="${x1+4}" y="${y2+18}" style="fill:var(--text)">정답 ${g.id}</text>`;});
 CANDS.forEach((c,i)=>{const [x1,y1,x2,y2]=c.box,s=st(i);
  const style=s==='tp'?'stroke="var(--accent)" stroke-width="3"':s==='fp'?'stroke="var(--orange)" stroke-width="2" stroke-dasharray="8 4"':'stroke="var(--muted)" stroke-width="1" stroke-dasharray="2 4" opacity=".45"';
  b+=`<rect x="${x1}" y="${y1}" width="${x2-x1}" height="${y2-y1}" fill="none" ${style}/>`;
  if(s==='tp')b+=`<rect x="${x1}" y="${y1-22}" width="80" height="22" fill="var(--accent)"/><text x="${x1+5}" y="${y1-5}" style="fill:var(--bg)">${c.id} TP</text>`;});
 b+=`<text x="16" y="30">실선 TP · 점선 FP</text>`;
 const tps=r.rows.filter(x=>x.tp).map(x=>`${CANDS[x.i].id}→${GTS[x.gt].id}`);
 return U.svg(b,`정답 상자 3개와 예측 상자. TP ${r.tp}개(${tps.join(', ')||'없음'}), FP ${r.fp}개, 놓친 정답 ${r.fn}개`);
}
function apCurve(r){
 const pts=r.rows.map(x=>[x.recall,x.precision,x.tp?'var(--accent)':'var(--orange)',x.tp?6:4]),line=[];let prev=0;
 r.rows.forEach((x,k)=>{if(x.recall>prev){line.push([prev,r.env[k]],[x.recall,r.env[k]]);prev=x.recall;}});
 return U.plot({lines:line.length?[{data:line,color:'var(--accent)'}]:[],points:pts,xmin:0,xmax:1,ymin:0,ymax:1,xlabel:'재현율',ylabel:'정밀도',
  label:`정밀도-재현율 점 ${r.rows.length}개와 보간 포락선. AP ${F(r.ap,3)}`});
}
A05Labs.ap=el=>{
 U.setup(el,S('apm','맞음으로 셀 IoU 문턱 (판정)',[['0.5','0.5 · AP50'],['0.75','0.75 · AP75 (엄격)']],'0.5')+R('aps','점수 문턱 (이상만 셈)',0.1,0.95,0.05,0.3)+S('apn','판정 전 NMS',[['none','끄기 · 후보 7개 그대로'],['0.45','켜기 · NMS 임계값 0.45']],'none'));
 U.bind(el,()=>{const m=V(el,'apm'),s=V(el,'aps'),nm=U.text(el,'apn'),on=nm!=='none',r=M.detEval(CANDS,GTS.map(g=>g.box),{match:m,minScore:s,nmsThr:on?0.45:null});
  const id=i=>CANDS[i].id,list=r.rows.map((x,k)=>`<li>${k+1}. ${id(x.i)} 점수 ${F(x.score,2)} · ${x.tp?`정답 ${GTS[x.gt].id}와 IoU ${F(x.iou,2)} → <b>TP</b>`:`가장 가까운 남은 정답과 IoU ${F(x.iou,2)} → FP`} · 정밀도 ${F(x.precision,2)}, 재현율 ${F(x.recall,2)}</li>`).join('');
  const dup=r.rows.map((x,k)=>k).filter(k=>{const x=r.rows[k];return !x.tp&&r.rows.slice(0,k).some(y=>y.tp&&M.iou(CANDS[x.i].box,GTS[y.gt].box)>=m);});
  const missed=GTS.filter((g,k)=>!r.rows.some(x=>x.tp&&x.gt===k)).map(g=>g.id);
  let verdict;
  if(!r.rows.length)verdict=`점수 ${F(s,2)} 이상인 예측이 하나도 없습니다. 정밀도는 나눌 예측이 없어 정의되지 않고, 재현율과 AP는 0입니다. 점수 문턱을 내려 보세요.`;
  else if(r.lost.length)verdict=`NMS가 점수가 더 높은 상자를 남기면서 정답 ${missed.join(', ')}와 IoU ${F(m,2)} 이상으로 겹치던 ${r.lost.map(id).join(', ')}를 지웠습니다. NMS는 중복을 지울 뿐, 위치가 가장 정확한 상자를 고르지 않습니다.`;
  else if(dup.length){const last=r.rows.map(x=>x.tp).lastIndexOf(true),early=dup.filter(k=>k<last).map(k=>id(r.rows[k].i));
   const alt=on?null:M.detEval(CANDS,GTS.map(g=>g.box),{match:m,minScore:s,nmsThr:0.45}),cure=alt&&alt.lost.length?`판정 전에 NMS 0.45를 켜면 이 중복은 사라지지만, 이 판정 문턱에서는 NMS가 정답과 더 잘 맞던 ${alt.lost.map(id).join(', ')}까지 지워 AP가 오히려 ${F(alt.ap,3)}까지 내려갑니다.`:'판정 전에 NMS로 중복을 지우면 이 손실이 사라집니다.';
   verdict=`정답 하나는 한 번만 맞출 수 있으므로, FP ${r.fp}개${dup.length===r.fp?(r.fp>1?'는 모두':'는'):` 가운데 ${dup.length}개는`} 이미 짝이 정해진 정답을 다시 가리킨 중복으로 셉니다. ${early.length?`그중 ${early.join(', ')}는 마지막 TP보다 순위가 높아 AP를 깎습니다. ${cure}`:'중복이 모두 마지막 TP보다 아래라 AP는 그대로지만, 이 문턱의 정밀도는 낮아집니다.'}`;}
  else if(r.fn)verdict=`정답 ${missed.join(', ')}를 IoU ${F(m,2)} 이상으로 맞춘 예측이 남아 있지 않아 놓쳤습니다.`;
  else verdict=r.fp?`정답 셋을 모두 맞췄고 FP ${r.fp}개는 순위가 TP보다 아래라 AP를 깎지 않습니다. 대신 이 문턱의 정밀도를 낮춥니다.`:'정답 셋을 하나씩, 남는 예측 없이 맞췄습니다.';
  U.result(el,apScene(r)+apCurve(r),
  `점수 ${F(s,2)} 이상 ${r.pass.length}개 → ${on?`NMS 0.45 뒤 ${r.kept.length}개`:'NMS 없이 그대로'} → 판정 IoU ${F(m,2)}로 점수 순서대로 정답과 맞춤<ol class="ap-rank">${list}</ol>TP <b>${r.tp}</b> · FP <b>${r.fp}</b> · FN <b>${r.fn}</b> → 이 문턱의 정밀도 <b>${F(r.precision,3)}</b>, 재현율 <b>${F(r.recall,3)}</b><br>AP${m===0.5?'50':'75'}(모든 점 보간) = <strong>${F(r.ap,3)}</strong><br>${verdict}<br>후보 상자·점수·정답 상자는 미리 정한 예시이고, IoU·맞춤·AP는 실제 계산입니다. 정답이 셋뿐인 장면 하나라 재현율이 1/3씩만 움직입니다.`);});
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
