/* 1~5장 실험: 무작위 정책 가치, 가치 반복, ε-탐욕 통로, 절벽 걷기, 최대화 편향. 계산은 A10Math에서 한다. */
(()=>{
'use strict';
const U=A10UI,M=A10Math,R=U.range,S=U.select,F=U.fmt;
A10Labs.randwalk=el=>{
 U.setup(el,R('gamma','할인율 γ',0.5,1,0.01,0.9));
 U.bind(el,()=>{const g=U.value(el,'gamma'),r=M.mdpRandom(g),env=M.warehouse();el.querySelector('#gamma-value').textContent=F(g,2);
  U.result(el,U.warehouseBoard(env,{V:r.V},`무작위 정책의 칸별 가치, γ ${F(g,2)}. 출발 칸 ${F(r.start,2)}`),
  `γ = <b>${F(g,2)}</b> · 지평 약 <b>${Number.isFinite(r.horizon)?F(r.horizon,0)+'걸음':'제한 없음(출고대가 끝을 보장)'}</b><br>무작위 정책의 출발 칸 가치 V(S) = <strong>${F(r.start,2)}</strong>, 최단 경로 6걸음의 할인 이득 = <b>${F(r.optimal,2)}</b>, 차이 <b>${F(r.optimal-r.start,2)}</b><br>반복 정책 평가가 ${r.sweeps}번 훑어 수렴했습니다. 4×4 창고(한 걸음 −1)에서 벨만 방정식을 실제로 계산한 값입니다.`);});
};
A10Labs.valueiter=el=>{
 U.setup(el,R('sweeps','가치 반복 훑기 횟수 k',0,20,1,3)+S('vgamma','할인율 γ',[[0.9,'0.9'],[0.99,'0.99'],[1,'1.0']],1)+S('slip','바닥 미끄러짐 확률',[[0,'0 (마른 바닥)'],[0.1,'0.1'],[0.3,'0.3 (젖은 바닥)']],0));
 U.bind(el,()=>{const k=U.value(el,'sweeps'),g=U.value(el,'vgamma'),p=U.value(el,'slip'),env=M.warehouse(p),r=M.valueSweeps(env,g,k),full=M.valueIteration(env,g,1e-6);
  U.result(el,U.warehouseBoard(env,{V:r.V,policy:r.policy,hideArrows:k===0},`가치 반복 ${k}번 뒤의 칸별 가치와 탐욕 화살표`),
  `${k}번 훑은 뒤 출발 칸 V(S) = <strong>${F(r.V[0],2)}</strong> · 이번 훑기의 최대 변화 <b>${F(r.delta,3)}</b><br>끝까지 수렴하면 V*(S) = <b>${F(full.V[0],2)}</b> (최대 변화 10⁻⁶ 미만까지 ${full.sweeps}번 훑기)<br>${k===0?'아직 아무 정보가 없어 모든 칸이 0이고 행동이 모두 동점입니다.':r.delta<1e-6?'더 이상 바뀌지 않습니다. 화살표가 최적 정책입니다.':'출고대에서 가까운 칸부터 값이 자리 잡고 있습니다.'} 미끄러짐 ${p}에서 동기식 가치 반복을 실제로 계산했습니다.`);});
};
const smooth=(a,w)=>a.map((_,i)=>{const s=Math.max(0,i-w+1);let t=0;for(let j=s;j<=i;j++)t+=a[j];return [i+1,t/(i-s+1)];}).filter((_,i)=>i%5===4);
let greedyCache=null;
A10Labs.egreedy=el=>{
 U.setup(el,R('eps','탐험 확률 ε',0,0.5,0.01,0.1));
 U.bind(el,()=>{const e=U.value(el,'eps'),r=M.banditEps(e),g=greedyCache||(greedyCache=M.banditEps(0));el.querySelector('#eps-value').textContent=F(e,2);
  U.result(el,U.plot({lines:[{data:smooth(g.avg,25),color:'var(--orange)',dashed:true},{data:smooth(r.avg,25)}],xmin:0,xmax:500,ymin:0.8,ymax:1.6,xlabel:'배송 횟수',ylabel:'평균 배송 점수(25회 이동 평균)',label:`ε ${F(e,2)}의 평균 배송 점수 곡선과 ε 0(점선) 비교`}),
  `ε = <b>${F(e,2)}</b> · 마지막 100번 평균 점수 <strong>${F(r.lastAvg,3)}</strong> (가장 좋은 통로의 평균 ${F(r.bestMean,1)})<br>마지막 100번에서 가장 좋은 통로를 고른 비율 <b>${F(r.lastOpt*100,1)}%</b> · 500번 누적 점수 <b>${F(r.total,1)}</b><br>비교: 순수 탐욕(ε=0, 점선)은 ${F(g.lastOpt*100,1)}%, 누적 ${F(g.total,1)}. 세 통로의 평균 1.0·1.5·1.2는 가정값이고, 시드를 고정해 200번 반복한 실제 계산입니다.`);});
};
A10Labs.cliff=el=>{
 U.setup(el,R('ceps','탐험 확률 ε',0,0.3,0.05,0.1));
 U.bind(el,()=>{const e=U.value(el,'ceps'),r=M.cliffCompare(e),env=M.cliffWorld();el.querySelector('#ceps-value').textContent=F(e,2);
  const b=(x,name)=>`<div><h4>${name} · 탐욕 경로 ${x.reached?x.steps+'걸음':'출고대에 못 닿음'}</h4>${U.warehouseBoard(env,{path:x.path,wide:true,marks:Object.fromEntries(x.path.filter(s=>s!==env.start&&s!==47).map(s=>[s,{t:'•',cls:'path'}]))},`${name}의 탐욕 경로 ${x.steps}걸음`)}</div>`;
  const row=x=>x.topRow===0?'맨 윗줄로 돌아감':x.topRow===2?'낭떠러지 바로 위 줄을 따라감':'가운데 줄로 감';
  U.result(el,`<div class="a10-pair">${b(r.q,'Q-learning')}${b(r.sarsa,'SARSA')}</div>`,
  `ε = <b>${F(e,2)}</b><br>Q-learning: 탐욕 경로 <b>${r.q.steps}걸음</b>(${row(r.q)}), 가장자리 경로를 배운 시드 ${r.q.edgeRuns}/${r.q.runs}, 훈련 마지막 100번 평균 보상 <strong>${F(r.q.lastAvg,1)}</strong><br>SARSA: 탐욕 경로 <b>${r.sarsa.steps}걸음</b>(${row(r.sarsa)}), 가장자리 경로 ${r.sarsa.edgeRuns}/${r.sarsa.runs}, 마지막 100번 평균 <strong>${F(r.sarsa.lastAvg,1)}</strong><br>α=0.5, 500 에피소드, 시드 10개로 실제 학습한 결과입니다. 경로 그림은 첫 번째 시드입니다.`);});
};
A10Labs.overest=el=>{
 U.setup(el,R('acts','행동 수 K',1,20,1,10)+S('noise','추정 잡음 표준편차 σ',[[0.5,'0.5'],[1,'1'],[2,'2']],1));
 U.bind(el,()=>{const k=U.value(el,'acts'),s=U.value(el,'noise'),r=M.maxBias(k,s);
  U.result(el,`<h4 class="a10-sub">고른 행동의 추정 가치 평균 (참값은 모두 0)</h4>`+U.bars(['단일 추정 max','이중 추정','참값'],[r.single,r.double,0],'',null,3),
  `행동 ${k}개, 모두 참값 0, 추정 잡음 σ = ${s}<br>max로 고른 추정값의 평균 <strong>${F(r.single,3)}</strong> → 참값보다 ${F(r.single,2)}만큼 부풀려짐<br>고르기와 값 매기기를 다른 추정으로 나눈 이중 추정의 평균 <b>${F(r.double,3)}</b><br>4,000번 반복한 실제 계산입니다. 이중 DQN은 온라인 망으로 고르고 타깃 망으로 값을 매겨 같은 일을 합니다.`);});
};
})();
