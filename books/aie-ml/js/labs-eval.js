/* 7~9장 실험: 특성 척도, 평가 지표, 편향-분산과 앙상블. 계산은 A03Math. */
(()=>{
'use strict';
const U=A03UI,M=A03Math,L=A03Labs,f=U.fmt,p=U.pct;
const SCALES=[['won','원 단위 그대로'],['man','금액만 만 원 단위로'],['z','z-점수 표준화'],['mm','최소-최대 정규화']];

L.scaling=el=>{
 U.setup(el,U.select('scale','금액과 시도 횟수의 척도',SCALES,'won'));
 U.bind(el,()=>{const mode=U.text(el,'scale'),r=M.scalingLab(mode),n=r.neighbor;
  const chart=U.bars(['거리 중 금액 몫','5-NN 시험 정확도'],[r.share*100,r.acc*100],'%',null,1);
  U.result(el,chart,`척도 <b>${SCALES.find(s=>s[0]===mode)[1]}</b>. 새 결제(52,000원, 시도 8회)와 학습 결제 사이 거리 제곱에서 금액 차이가 차지하는 평균 몫 <strong>${p(r.share)}</strong>. 가장 가까운 학습 결제는 ${n.amt.toLocaleString('ko-KR')}원·시도 ${n.att}회(${n.c?'사기':'정상'}), 5-최근접 이웃 판정은 <b>${r.pred?'사기':'정상'}</b>. 시험 결제 200건 정확도 <b>${p(r.acc)}</b>.<br><small>실제 계산 · 척도 기준은 학습 결제 50건에서만 구함</small>`);});
};

function confusionTable(cm){return `<div class="kit-panel" role="img" aria-label="혼동 행렬: 잡은 사기 ${cm.TP}, 오경보 ${cm.FP}, 놓친 사기 ${cm.FN}, 정상 통과 ${cm.TN}"><div class="kit-grid" style="grid-template-columns:1fr 1fr;padding:0;border:0"><span style="--a:.9;--h:var(--accent)">잡은 사기 ${cm.TP}</span><span style="--a:.6;--h:var(--orange)">오경보 ${cm.FP}</span><span style="--a:.6;--h:var(--orange)">놓친 사기 ${cm.FN}</span><span style="--a:.15;--h:var(--accent)">정상 통과 ${cm.TN}</span></div></div>`;}

L.threshold=el=>{
 U.setup(el,U.range('thr','경보 문턱(사기 점수 ≥)',0.05,0.95,0.05,0.5));
 U.bind(el,()=>{const t=U.value(el,'thr'),D=M.scoreData(),cm=M.confusion(D,t),r=M.rates(cm),roc=M.rocCurve(D),a=M.auc(D);
  const chart=U.plot({lines:[{data:roc},{data:[[0,0],[1,1]],color:'var(--muted)',dashed:true}],points:[[r.fpr,r.recall,'var(--orange)',8]],xlabel:'오경보율(FPR)',ylabel:'재현율(TPR)',label:`ROC 곡선(AUC ${f(a,3)})과 문턱 ${f(t,2)}의 위치`})+confusionTable(cm);
  U.result(el,chart,`문턱 <b>${f(t,2)}</b>, 결제 1,000건 중 사기 30건. 잡은 사기 <b>${cm.TP}</b>, 오경보 <b>${cm.FP}</b>, 놓친 사기 <b>${cm.FN}</b>. 정밀도 <strong>${p(r.precision)}</strong>, 재현율 <strong>${p(r.recall)}</strong>, F1 <b>${f(r.f1,3)}</b>, MCC <b>${f(r.mcc,3)}</b>, 정확도 <b>${p(r.accuracy)}</b>(“항상 정상”은 97.0%). AUC <b>${f(a,3)}</b>는 문턱과 상관없는 값입니다.<br><small>실제 계산 · 가상 사기 점수 1,000건</small>`);});
};

L.biasvar=el=>{
 U.setup(el,U.range('deg','다항식 차수',0,11,1,3));
 U.bind(el,()=>{const d=U.value(el,'deg'),r=M.biasVariance(d),g=r.grid;
  const lines=r.fits.map(w=>({data:g.map(x=>[x,M.polyEval(w,x)]),color:'var(--blue)'})).concat([{data:g.map((x,i)=>[x,r.meanFit[i]]),color:'var(--orange)'},{data:g.map(x=>[x,M.trueCurve(x)]),color:'var(--text)',dashed:true}]);
  const chart=U.plot({lines,xmin:-1,xmax:1,ymin:-2.5,ymax:2.5,xlabel:'입력 x',ylabel:'예측',label:`차수 ${d}: 학습 데이터 6벌로 맞춘 곡선(파랑), 80벌 평균(주황), 참 곡선(점선)`});
  U.result(el,chart,`차수 <b>${d}</b>, 점 12개짜리 학습 데이터를 80벌 새로 뽑아 각각 맞췄습니다. 편향² <b>${f(r.bias2,3)}</b> + 분산 <b>${f(r.variance,3)}</b> + 잡음 <b>${f(r.noise,3)}</b> = 기대 오차 <strong>${f(r.total,3)}</strong>. 파란 곡선 여섯 개가 서로 많이 다를수록 분산이 큽니다.<br><small>실제 계산 · 참 곡선 sin(4.2x)+0.3x, 잡음 표준편차 0.35</small>`);});
};

L.vote=el=>{
 U.setup(el,U.range('n','모델 수 N(홀수)',1,101,2,11)+U.range('rho','모델 사이 상관 ρ',0,1,0.1,0));
 U.bind(el,()=>{const N=U.value(el,'n'),rho=U.value(el,'rho'),pp=0.6,acc=M.ensembleAccuracy(N,pp,rho),Ns=Array.from({length:51},(_,i)=>2*i+1);
  const chart=U.plot({lines:[{data:Ns.map(n=>[n,M.ensembleAccuracy(n,pp,0)]),color:'var(--muted)',dashed:true},{data:Ns.map(n=>[n,M.ensembleAccuracy(n,pp,rho)])}],points:[[N,acc,'var(--orange)',8]],xmin:1,xmax:101,ymin:0.5,ymax:1,xlabel:'모델 수 N',ylabel:'다수결 정확도',label:`상관 ${f(rho,1)}일 때 모델 수에 따른 다수결 정확도. N=${N}에서 ${p(acc)}`});
  U.result(el,chart,`정확도 60%인 모델 <b>${N}</b>개, 상관 ρ=<b>${f(rho,1)}</b>. 다수결 정확도 = ρ·0.6 + (1−ρ)·(독립 다수결 ${p(M.majorityVote(N,pp))}) = <strong>${p(acc)}</strong>. N이 무한히 커져도 넘지 못하는 값은 ${p(rho*pp+(1-rho))}입니다. 점선은 서로 독립(ρ=0)인 경우입니다.<br><small>실제 계산 · 이항분포 다수결과 단순한 상관 모형(가정)</small>`);});
};
})();
