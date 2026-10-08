/* 1~5장 실험: 단계 신뢰도, STaR 고리, 평가기와 진화 고리, 자동 연구 파이프라인, 복리 경주, 자기 개선 관문.
   계산은 A16Math에서 하고 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=A16UI,M=A16Math,R=U.range,S=U.select,F=U.fmt,pct=x=>F(x*100,1)+'%';

A16Labs.chain=el=>{
 U.setup(el,R('steps','단계 수 n',1,300,1,70)+S('pstep','한 단계 성공 확률 p',[[0.99,'0.99'],[0.995,'0.995'],[0.999,'0.999']],0.99));
 U.bind(el,()=>{const n=U.value(el,'steps'),p=U.value(el,'pstep'),r=M.chain(p,n),ps=[0.99,0.995,0.999];
  const lines=ps.map(q=>({data:M.chainCurve(q,300),color:q===p?'var(--accent)':'var(--muted)',dashed:q!==p}));
  U.result(el,U.plot({lines,points:[[n,r.P,'var(--orange)',6]],xmin:0,xmax:300,ymin:0,ymax:1,xlabel:'단계 수 n',ylabel:'끝까지 성공할 확률',label:`p ${p}에서 단계 수에 따른 끝까지 성공할 확률 곡선. 점선은 다른 p`}),
  `p = <b>${p}</b>, n = <b>${n}</b> · 끝까지 성공할 확률 pⁿ = <strong>${pct(r.P)}</strong> (적어도 한 번 실패 ${pct(r.fail)})<br>끝까지 성공할 확률이 절반이 되는 단계 수 n₅₀ = ln 0.5 ÷ ln p ≈ <b>${F(r.n50,1)}</b> · 첫 실패까지 평균 <b>${F(r.expectedFirstFail,0)}</b>단계<br>단계 실패가 서로 독립이라는 가정 위에서 실제로 계산한 값입니다. 실선이 고른 p, 점선이 나머지 두 p입니다.`);});
};

A16Labs.star=el=>{
 U.setup(el,R('short','처음 지름길 풀이 비율',0,0.5,0.05,0.4)+R('rounds','고리를 돈 횟수',0,10,1,8)+S('filter','거르는 방식',[['answer','정답만 확인(STaR)'],['process','과정 검사 추가(지름길·찍기 80% 거름)']],'answer'));
 U.bind(el,()=>{const h=U.value(el,'short'),k=U.value(el,'rounds'),f=U.text(el,'filter'),r=M.starLoop(h,k,f),h0=r.hist[0];
  el.querySelector('#short-value').textContent=F(h,2);
  const inL=r.hist.map(x=>[x.round,x.inD]),outL=r.hist.map(x=>[x.round,x.outD]);
  U.result(el,U.plot({lines:[{data:inL},{data:outL,color:'var(--orange)',dashed:true}],points:[[k,r.inD,'var(--accent)',5],[k,r.outD,'var(--orange)',5]],xmin:0,xmax:Math.max(k,1),ymin:0,ymax:1,xlabel:'고리 횟수',ylabel:'정답률 (실선 분포 안, 점선 분포 밖)',label:`STaR 고리 ${k}바퀴 동안 분포 안 정답률과 분포 밖 정답률`}),
  `지름길 ${F(h,2)}, ${k}바퀴, ${f==='answer'?'정답만 확인':'과정 검사 추가'} · 분포 안 정답률 <b>${pct(h0.inD)}</b> → <strong>${pct(r.inD)}</strong>, 분포 밖 <b>${pct(h0.outD)}</b> → <strong>${pct(r.outD)}</strong><br>마지막 비율: 바른 추론 <b>${pct(r.w[0])}</b>, 지름길 <b>${pct(r.w[1])}</b>, 찍기 <b>${pct(r.w[2])}</b> · 안팎 차이 <b>${F(r.gap*100,1)}%p</b><br>풀이 종류별 정답률(분포 안 0.9·0.9·0.25, 밖 0.9·0.1·0.25)은 교육용 가정값이고, 비율 갱신은 실제로 계산한 장난감 모형입니다.`);});
};

A16Labs.evolve=el=>{
 U.setup(el,S('judge','채점 방식',[['visible','공개 테스트로만 채점'],['holdout','평가 때 새로 만든 숨긴 입력'],['editable','숨긴 입력, 평가 코드는 누리 저장소 안']],'visible')+R('gens','세대 수',0,40,1,40));
 U.bind(el,()=>{const m=U.text(el,'judge'),g=U.value(el,'gens'),r=M.evolve(m,g);
  const top=Math.max(1.2,Math.ceil(r.finalReported*2)/2);
  U.result(el,U.plot({lines:[{data:r.reported},{data:r.truth,color:'var(--orange)',dashed:true}],xmin:0,xmax:Math.max(g,1),ymin:0,ymax:top,xlabel:'세대',ylabel:'점수 (실선 보고, 점선 실제 품질)',label:`${g}세대 동안 보고된 점수와 실제 품질`}),
  `${g}세대 · 보고된 점수 <strong>${F(r.finalReported,3)}</strong>, 실제 품질 <strong>${F(r.finalTrue,3)}</strong> (시작 0.500) · 차이 <b>${F(r.gap,3)}</b><br>받아들인 변형 <b>${r.accepted}</b>개 · 공개 테스트 암기 h = <b>${F(r.h,2)}</b>, 평가 코드 손대기 t = <b>${F(r.t,2)}</b><br>${m==='visible'?'점수에 암기가 섞여 있어 고리가 암기를 키웁니다.':m==='editable'?'입력은 숨겼지만 평가 코드를 고칠 수 있어 고리가 평가기를 고칩니다.':'점수가 실제 품질만 보므로 둘이 함께 움직입니다.'} 시드를 고정한 진화 고리의 실제 계산이며, 품질 단위와 암기의 대가는 교육용 가정값입니다.`);});
};

A16Labs.scientist=el=>{
 U.setup(el,R('retries','실패 뒤 재시도 횟수',0,5,1,1)+S('review','심사 깊이',[['shallow','그림·문장 위주 심사'],['deep','주장과 실험까지 재현하는 심사']],'shallow'));
 U.bind(el,()=>{const k=U.value(el,'retries'),v=U.text(el,'review'),r=M.scientist(k,v);
  U.result(el,U.bars(['건전한 새 결과','결함 있는 투고','이미 알려진 투고','실행 시도 수'],[r.goodNovel,r.flawedPass,r.knownPass,r.attempts],'아이디어 100개당 기댓값',null,1),
  `재시도 <b>${k}</b>번, ${v==='deep'?'깊은':'얕은'} 심사 · 실행 성공 확률 1 − 0.42^${k+1} = <b>${pct(r.runOk)}</b>, 실행 시도 <b>${F(r.attempts,1)}</b>번<br>투고 <strong>${F(r.submitted,1)}</strong>편 중 결함 있거나 이미 알려진 것 <strong>${F(r.flawedPass+r.knownPass,1)}</strong>편(<b>${pct(r.badShare)}</b>) · 돌아간 실험의 결함률 <b>${pct(r.flawRate)}</b><br>실패율 0.42는 원본이 인용한 독립 평가 값이고, 알려진 아이디어 30%, 새로움 오판 70%, 결함률, 심사가 잡는 비율은 교육용 가정값입니다. 기댓값은 실제로 계산했습니다.`);});
};

A16Labs.race=el=>{
 U.setup(el,R('ra','정렬 성장률 r_a (주기당 %)',0,15,1,5));
 U.bind(el,()=>{const ra=U.value(el,'ra')/100,r=M.race(ra,20);
  const top=Math.ceil(Math.max(r.C,r.A)+0.5);
  U.result(el,U.plot({lines:[{data:r.pts.map(x=>[x[0],x[1]])},{data:r.pts.map(x=>[x[0],x[2]]),color:'var(--orange)',dashed:true}],points:r.first===null?[]:[[r.first,r.pts[r.first][1],'var(--blue)',6]],xmin:0,xmax:20,ymin:0,ymax:top,xlabel:'주기',ylabel:'크기 (실선 능력, 점선 정렬)',label:`능력 10%와 정렬 ${F(ra*100,0)}% 성장의 20주기 곡선`}),
  `r_c = <b>10%</b>, r_a = <b>${F(ra*100,0)}%</b> · 20주기 뒤 능력 <b>${F(r.C,2)}</b>, 정렬 <b>${F(r.A,2)}</b> · 상대 격차 C/A − 1 = <strong>${F(r.relGap*100,1)}%</strong><br>${r.first===null?'20주기 안에 상대 격차가 25%를 넘지 않아 멈춤 신호가 켜지지 않습니다.':`상대 격차가 25%를 처음 넘는 주기: <strong>${r.first}</strong>주기째(파란 점)에서 멈춤 신호가 켜집니다.`}<br>잡음 없는 복리 계산입니다. 성장률과 25% 문턱은 교육용 가정값입니다.`);});
};

A16Labs.gates=el=>{
 U.setup(el,S('level','켠 관문',[[0,'없음(점수만 확인)'],[1,'불변식'],[2,'불변식 + 정렬 닻'],[3,'+ 다목적 제약'],[4,'+ 회귀 감지(네 관문 모두)']],0)+R('tol','회귀 허용치(점)',0,10,1,3));
 U.bind(el,()=>{const l=U.value(el,'level'),t=U.value(el,'tol'),r=M.gates(l,t);
  const rows=r.rows.map(e=>[e.name,e.good?'좋은 편집':'나쁜 편집',`+${e.perf}`,e.accepted?'<b>들어옴</b>':`막힘 · ${e.by}`]);
  U.result(el,U.table(['편집 후보','실제 성격','점수 변화','판정'],rows,`관문 ${l}개, 회귀 허용치 ${t}점에서 편집 후보 여섯 개의 판정`),
  `켠 관문 <b>${l}</b>개, 회귀 허용치 <b>${t}</b>점 · 들어온 편집 <strong>${r.accepted}</strong>개<br>들어온 나쁜 편집 <strong>${r.badIn}</strong>개 · 막힌 좋은 편집 <b>${r.goodOut}</b>개<br>관문은 불변식(평가기 해시) → 정렬 닻(목표 문장) → 다목적(안전 축) → 회귀(과제별 최악 하락) 순서로 판정합니다. 편집 후보의 성질은 교육용 가정값이고 판정은 규칙 계산입니다.`);});
};
})();
