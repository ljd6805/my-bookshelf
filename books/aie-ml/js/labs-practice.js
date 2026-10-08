/* 10~12장 실험: 누설, 이상 탐지, 불균형, 분포 이동. 계산은 A03Math. */
(()=>{
'use strict';
const U=A03UI,M=A03Math,L=A03Labs,f=U.fmt,p=U.pct;

L.leak=el=>{
 U.setup(el,U.range('cats','우편번호 범주 수',5,300,5,50));
 U.bind(el,()=>{const k=U.value(el,'cats'),r=M.targetEncodingLab(k);
  const chart=U.bars(['전체 데이터로 인코딩(누설)','겹마다 인코딩(정직)'],[r.leaky*100,r.honest*100],'%',50,1);
  U.result(el,chart,`라벨은 동전 던지기로 정했으니 어떤 방법도 50%(막대 위 점선)를 넘을 근거가 없습니다. 범주 <b>${k}</b>개, 범주당 결제 약 <b>${f(r.perCat,1)}</b>건. 5겹 교차 검증 정확도는 전체 600건으로 미리 맞춘 인코딩이 <strong>${p(r.leaky)}</strong>, 학습 겹에서만 맞춘 인코딩이 <strong>${p(r.honest)}</strong>입니다. 차이 ${f((r.leaky-r.honest)*100,1)}%p가 시험 정답이 특성 속으로 새어 든 몫입니다.<br><small>실제 계산 · 무작위 라벨 600건</small>`);});
};

L.timeseries=el=>{
 U.setup(el,U.range('win','이동 평균 창 길이(일)',1,14,1,7));
 U.bind(el,()=>{const k=U.value(el,'win'),y=M.orderSeries(),r=M.forecasts(y,k),days=r.actual.map((_,i)=>91+i),m=r.mae;
  const ser=a=>a.map((v,i)=>[days[i],v]);
  const chart=U.plot({lines:[{data:ser(r.actual),color:'var(--text)'},{data:ser(r.trailing)},{data:ser(r.leaky),color:'var(--orange)',dashed:true}],xmin:91,xmax:120,ymin:230,ymax:350,xlabel:'날짜(일)',ylabel:'주문 수',label:`마지막 30일의 실제 주문(흰 선), 과거 ${k}일 평균(청록), 앞뒤 평균(주황 점선)`});
  U.result(el,chart,`창 <b>${k}</b>일, 마지막 30일 예측의 평균 절대 오차(주문 건수). 과거 ${k}일 평균 <strong>${f(m.trailing,1)}</strong>, 앞뒤 ${k}일 평균(미래 포함·누설) <strong>${f(m.leaky,1)}</strong>, 어제 값 그대로 <b>${f(m.persist,1)}</b>, 지난주 같은 요일 <b>${f(m.seasonal,1)}</b>. 누설된 예측은 실제로는 쓸 수 없는 미래 값을 본 덕분에 이깁니다.<br><small>실제 계산 · 추세와 요일 효과가 있는 가상 일별 주문 120일</small>`);});
};

L.outlier=el=>{
 U.setup(el,U.range('inj','기준 기간에 섞인 큰 이상값(건)',0,30,1,0));
 U.bind(el,()=>{const n=U.value(el,'inj'),r=M.outlierLab(n);
  const chart=U.bars(['z-점수 적중','z-점수 오경보','IQR 적중','IQR 오경보'],[r.zHit,r.zFalse,r.iqrHit,r.iqrFalse],'건',null,0);
  U.result(el,chart,`정상 결제 300건(평균 5만 원 안팎)에 큰 결제 <b>${n}</b>건을 섞어 기준을 잡았습니다. 평균 ${f(r.mean,2)}, 표준편차 <b>${f(r.std,2)}</b>(만 원)이라 z-점수 경보선은 ${f(r.mean+3*r.std,2)}입니다. IQR 울타리는 ${f(r.lo,2)}~${f(r.hi,2)}. 진짜 이상 ${r.anomalies}건 중 z-점수는 <strong>${r.zHit}</strong>건, IQR은 <strong>${r.iqrHit}</strong>건을 찾았고, 새 정상 결제 200건의 오경보는 각각 ${r.zFalse}건, ${r.iqrFalse}건입니다.<br><small>실제 계산 · 가상 결제 금액</small>`);});
};

const METHODS=[['none','처방 없음'],['over','사기 복제 과대표본'],['smote','SMOTE 합성'],['under','정상 과소표본'],['weight','클래스 가중치']];
L.resample=el=>{
 U.setup(el,U.select('method','불균형 처방',METHODS,'none'));
 U.bind(el,()=>{const m=U.text(el,'method'),r=M.imbalanceLab(m),cm=r.cm;
  const chart=U.bars(['정밀도','재현율','F1'],[r.precision*100,r.recall*100,r.f1*100],'%',null,1);
  U.result(el,chart,`처방 <b>${METHODS.find(x=>x[0]===m)[1]}</b>. 학습에 쓴 행 <b>${r.trainSize}</b>개(사기 ${r.positives}개). 시험 결제 420건(사기 20건)에서 잡은 사기 <b>${cm.TP}</b>, 놓친 사기 <b>${cm.FN}</b>, 오경보 <b>${cm.FP}</b>. 정밀도 <strong>${p(r.precision)}</strong>, 재현율 <strong>${p(r.recall)}</strong>, F1 ${f(r.f1,3)}.<br><small>실제 계산 · 로지스틱 회귀 300회 학습, 문턱 0.5</small>`);});
};

const POLICIES=[['keep','옛 문턱 유지'],['retune','최근 라벨로 문턱만 다시 고르기'],['retrain','새 특성으로 재학습(시나리오)']];
L.drift=el=>{
 U.setup(el,U.range('shift','사기 점수의 이동량',0,2,0.25,0)+U.select('policy','대응',POLICIES,'keep'));
 U.bind(el,()=>{const s=U.value(el,'shift'),pol=U.text(el,'policy'),r=M.driftLab(s,pol),cm=r.cm;
  const chart=U.bars(['놓친 사기 비용','오경보 비용','합계'],[cm.FN*20,cm.FP,r.cost],'',null,1);
  const note=pol==='retrain'?'재학습은 이동의 75%를 되찾는다고 가정한 시나리오입니다.':'점수 분포와 문턱 선택은 실제 계산입니다.';
  U.result(el,chart,`이동량 <b>${f(s,2)}</b>, 대응 <b>${POLICIES.find(x=>x[0]===pol)[1]}</b>. 문턱 ${f(r.t,2)}(처음 ${f(r.t0,2)}). 결제 1,000건당 놓친 사기 <b>${f(cm.FN,1)}</b>, 오경보 <b>${f(cm.FP,1)}</b>, 재현율 <strong>${p(r.recall)}</strong>. 오경보 1건의 비용을 1, 놓친 사기 1건을 20으로 치면 결제 1,000건당 비용 <strong>${f(r.cost,1)}</strong>. 지금 점수의 AUC ${f(r.auc,3)}.<br><small>${note}</small>`);});
};
})();
