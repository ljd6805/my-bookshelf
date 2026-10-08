/* 9~12장 실험: 교차로의 두 로봇, 도메인 랜덤화, PUCT, GRPO, 마지막 과제 진단. 계산은 A10Math에서 한다. */
(()=>{
'use strict';
const U=A10UI,M=A10Math,R=U.range,S=U.select,F=U.fmt;
const SPEED=['나란히 질주','보통 속도','천천히'];
A10Labs.coop=el=>{
 U.setup(el,S('cmode','학습 방식',[['indep','각자 독립 학습'],['joint','행동 조합을 함께 학습(중앙)']],'indep')+S('xeps','탐험 확률 ε',[[0.05,'0.05'],[0.1,'0.1'],[0.2,'0.2']],0.1)+R('cepi','학습 횟수',100,2000,100,2000));
 U.bind(el,()=>{const mode=U.text(el,'cmode'),e=U.value(el,'xeps'),n=U.value(el,'cepi'),r=M.coopGame(n,e,mode),sh=r.share;
  const other=1-sh[0]-sh[4]-sh[8];
  U.result(el,`<h4 class="a10-sub">학습 뒤 정착한 조합의 비율</h4>`+U.bars(['둘 다 질주 (11점)','둘 다 보통 (7점)','둘 다 천천히 (5점)','엇갈린 조합'],[sh[0],sh[4],sh[8],other].map(x=>x*100),'%',null,1),
  `${mode==='joint'?'중앙 학습':'독립 학습'}, ε = ${e}, ${n}번 학습, 60번 반복<br>최선(둘 다 질주, 11점)에 정착한 비율 <strong>${F(sh[0]*100,1)}%</strong> · 둘 다 천천히(5점) <b>${F(sh[8]*100,1)}%</b><br>학습 마지막 100번의 평균 보상 <b>${F(r.tailAvg,2)}</b><br>${mode==='joint'?'아홉 가지 조합의 Q를 한 표에 두므로 “둘 다 질주”의 진짜 값 11을 그대로 배웁니다.':'상대가 탐험으로 가끔 속도를 바꾸면 “질주”의 평균 결과에 −30이 섞여, 둘 다 안전한 쪽으로 몰립니다.'} 보상표는 가정값이고 학습은 실제 계산입니다.`);});
};
let narrowCache=null;
A10Labs.dr=el=>{
 U.setup(el,R('width','훈련 미끄러짐 범위 w (걸음마다 균등 0~w)',0,0.5,0.05,0.2));
 U.bind(el,()=>{const w=U.value(el,'width'),r=M.drEval(w),env=M.cliffWorld(),nar=narrowCache||(narrowCache=r.narrow);el.querySelector('#width-value').textContent=F(w,2);
  const pts=r.slips.map((s,i)=>[s,r.dr[i]]),nl=r.slips.map((s,i)=>[s,nar[i]]);
  const board=U.warehouseBoard(env,{policy:r.policy,V:null,wide:true},`w ${F(w,2)}로 훈련한 정책의 화살표`);
  U.result(el,U.plot({lines:[{data:nl,color:'var(--orange)',dashed:true},{data:pts}],points:pts.map(([x,y])=>[x,y,'var(--accent)',4]),xmin:0,xmax:0.5,ymin:-220,ymax:0,xlabel:'실제 바닥의 미끄러짐',ylabel:'출발 칸의 기대 이득',label:`훈련 범위 w ${F(w,2)} 정책(실선)과 마른 바닥만 본 정책(점선)의 실제 미끄러짐별 기대 이득`})+`<h4 class="a10-sub">w = ${F(w,2)}로 훈련한 정책</h4>`+board,
  `훈련 범위 0~${F(w,2)} → 평균 미끄러짐 <b>${F(w/2,3)}</b>로 훈련한 것과 같은 정책<br>실제 바닥 0 / 0.3 / 0.5에서 기대 이득: <strong>${F(r.dr[0],1)} / ${F(r.dr[3],1)} / ${F(r.dr[5],1)}</strong><br>마른 바닥만 본 정책(점선): ${F(nar[0],1)} / ${F(nar[3],1)} / ${F(nar[5],1)}<br>${r.steps>=80?'출발 칸에서 벽 쪽으로 버티며 미끄러지기만 기다려, 마른 바닥에서는 출발하지 못합니다. 지나친 무작위화입니다.':`마른 바닥에서의 경로는 ${r.steps}걸음입니다.`} γ=0.99의 가치 반복과 정책 평가로 정확히 계산했습니다.`);});
};
A10Labs.puct=el=>{
 U.setup(el,R('cpuct','탐험 상수 c',0,5,0.1,1));
 U.bind(el,()=>{const c=U.value(el,'cpuct'),r=M.puct(c);el.querySelector('#cpuct-value').textContent=F(c,1);
  U.result(el,`<h4 class="a10-sub">40번 탐색 중 수마다 방문한 횟수</h4>`+U.bars(M.MOVES.map(m=>`${m.name} (Q ${m.q}, p ${m.prior})`),r.visits,'번',null,0),
  `c = <b>${F(c,1)}</b> · 방문 ${r.visits.join(' / ')} → 가장 많이 방문한 수 <strong>${M.MOVES[r.best].name}</strong><br>방문 비율 ${r.share.map(x=>F(x*100,0)+'%').join(' · ')} (사전 확률 15% · 60% · 25%)<br>${c===0?'탐험 항이 없어 처음 고른 수만 계속 봅니다. 가치가 가장 높은 수 A를 우연히 먼저 골랐을 뿐입니다.':c>=3?'사전 확률 항이 커서 방문 분포가 정책 망의 사전 확률을 닮아 갑니다.':'가치와 사전 확률이 함께 방문을 나눕니다.'} 이 방문 비율이 AlphaZero의 정책 학습 목표가 됩니다. 결정적 계산입니다.`);});
};
A10Labs.grpo=el=>{
 U.setup(el,R('gsize','묶음 크기 G',2,64,1,8)+S('gp','검증기 성공 확률 p',[[0.1,'0.1 (어려운 주문)'],[0.5,'0.5'],[0.9,'0.9 (쉬운 주문)']],0.5));
 U.bind(el,()=>{const G=U.value(el,'gsize'),p=U.value(el,'gp'),r=M.grpoGroup(G,p),cols=Math.min(G,8);
  const grid=U.board(Math.ceil(G/cols),cols,i=>i<G?{t:`${r.rewards[i]?'✓':'✗'}<small>${F(r.adv[i],2)}</small>`,a:Math.min(1,Math.abs(r.adv[i])/2),h:r.adv[i]>=0?'var(--accent)':'var(--orange)'}:{t:''},`묶음 ${G}개의 검증 결과와 이점`);
  const pos=r.adv.find((_,i)=>r.rewards[i]===1),neg=r.adv.find((_,i)=>r.rewards[i]===0);
  U.result(el,grid,`G = <b>${G}</b>, p = ${p} · 이번 묶음 성공 ${r.rewards.filter(x=>x).length}/${G}, 평균 ${F(r.mean,3)}, 표준편차 ${F(r.std,3)}<br>${r.std>0?`성공한 시도의 이점 <b>${F(pos,2)}</b>, 실패한 시도의 이점 <b>${F(neg,2)}</b>`:'<strong>모든 시도의 점수가 같아 이점이 전부 0입니다. 이 묶음에서는 배우지 못합니다.</strong>'}<br>묶음 전체가 같은 점수일 확률 p^G + (1−p)^G = <strong>${F(r.noSignal*100,2)}%</strong><br>표본은 시드를 고정해 뽑았고, 확률은 정확한 식입니다.`);});
};
const REPORT_LABEL={slip:'젖은 바닥에서 낙하',hack:'점수는 오르는데 작업자 불만',stuck:'늘 같은 통로만 씀'};
const FIX_LABEL={dr:'미끄러짐 무작위화 넓히기',beta:'KL 벌점 β 올리기',eps:'탐험 ε 올리기',gamma:'할인율 γ 올리기'};
const MISSING={slip:'실제 바닥의 미끄러짐을 잰 값, 바퀴 마모 여부, 낙하가 일어난 칸',hack:'KL 곡선, 작업자 평가 추이, 보상 모델이 본 적 없는 행동의 비율',stuck:'통로별 방문 횟수, 다른 통로의 실제 배송 시간 표본'};
A10Labs.diagnose=el=>{
 U.setup(el,S('report','운영 보고',Object.entries(REPORT_LABEL),'slip')+S('fix','처방',Object.entries(FIX_LABEL),'beta'));
 U.bind(el,()=>{const rep=U.text(el,'report'),fx=U.text(el,'fix'),r=M.finalCase(rep,fx);
  U.result(el,`<h4 class="a10-sub">${r.metric} (막대 길이는 값의 크기)</h4>`+U.bars(['처방 전','처방 후'],[r.before,r.after],'',null,2),
  `보고: <b>${REPORT_LABEL[rep]}</b> · 처방: <b>${FIX_LABEL[fx]}</b><br>${r.metric}: ${F(r.before,2)} → <strong>${F(r.after,2)}</strong><br>${r.matched?'이 처방은 실패한 지표를 움직입니다. 이제 왜 이 원인이라고 판단했는지와 부족한 증거를 적어 보세요.':'이 처방이 바꾸는 변수는 이 지표의 계산에 들어가지 않아 값이 그대로입니다. 다른 원인을 찾아야 합니다.'}<br>확정하려면 더 필요한 증거: ${MISSING[rep]}.<br>앞 장의 계산을 그대로 다시 돌린 결과이며, 실제 창고를 진단한 것은 아닙니다.`);});
};
})();
