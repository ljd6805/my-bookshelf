/* 5~8장 실험: 비평가와 검증자, 공유 기억 오염, 공유 대기열, 흔적 길잡이, 다수결, 세 가지 집계. 계산은 A17Math에서 한다. */
(()=>{
'use strict';
const U=A17UI,M=A17Math,R=U.range,S=U.select,F=U.fmt;
const sub=t=>`<h4 class="a17-sub">${t}</h4>`;
const pct=(x,d=1)=>F(x*100,d)+'%';

const MODES=[['none','검사 없음'],['critic','비평가만 (글을 읽고 판단)'],['verifier','검증자만 (테스트 실행)'],['both','둘 다']];
A17Labs.verifier=el=>{
 U.setup(el,R('bug','실행자가 버그를 낼 확률 b',0,0.6,0.05,0.3)+S('check','검사 방식',MODES,'critic'));
 U.bind(el,()=>{const b=U.value(el,'bug'),m=U.text(el,'check'),r=M.verify(b,m),all=MODES.map(([x])=>M.verify(b,x).bug*100);
  el.querySelector('#bug-value').textContent=F(b,2);
  U.result(el,sub('검사 방식별 버그가 섞여 나갈 확률(%)')+U.bars(MODES.map(x=>x[1].split(' (')[0]),all,'%',null,2),
  `b = <b>${F(b,2)}</b>, 지금 방식: ${MODES.find(x=>x[0]===m)[1]}<br>검사가 버그를 놓칠 확률 <b>${pct(r.miss)}</b> · 버그가 섞여 나감 <strong>${pct(r.bug,2)}</strong> · 깨끗하게 나감 <b>${pct(r.clean)}</b> · 수정 왕복 2번 뒤 사람에게 넘김 <b>${pct(r.escalate,2)}</b><br>평균 시도 ${F(r.attempts,2)}번, 모델 호출 ${F(r.calls,2)}번<br>비평가 30%, 검증자 90%라는 잡는 비율은 가정값이고, 확률은 그 가정으로 정확히 계산했습니다.`);});
};

const PM=[['none','장치 없음'],['provenance','출처 기록 + 덧붙이기만'],['readonly','읽기 전용 검증자'],['writer','풀에 직접 쓰는 검증자'],['privilege','권한 분리 (바깥 글의 명령문은 데이터로만)']];
const PS=[['error','옮겨 적기 실수 (4.2% → 42%)'],['inject','민원 글 속 남의 지시 (가상 시나리오)']];
function poisonNote(r,m,n){
 if(r.scenario==='inject'){
  const fin=r.final===null?' · 최종 보고서는 아직 쓰지 않았습니다.':r.final==='clean'?' · 최종 보고서: <strong>지시가 빠진 보고서</strong>(찬성·반대 수만 인용)':' · 최종 보고서: <strong>“30곳 확대는 시민 합의”</strong>가 들어감';
  const why=r.caught?'작성자가 바깥 글 꼬리표가 붙은 명령문을 지시로 따르지 않고 인용으로만 다루어 경로가 끊겼습니다.':m==='readonly'&&n>=4?'검증자는 옮겨 적기가 원문과 같은지를 확인했고, 실제로 같았습니다. 독립 검증은 정확성을 보지 누가 시킨 말인지는 보지 않습니다.':m==='writer'&&n>=4?'검증자가 “확인됨”을 풀에 써서 남의 지시를 사실처럼 굳혔습니다.':m==='provenance'?'출처 꼬리표로 글 #318까지는 바로 닿지만, 작성자가 그 기록을 여전히 동료의 말로 따릅니다.':'아직 이 경로를 끊는 장치가 없습니다.';
  return `${PM.find(x=>x[0]===m)[1]} · 민원 글 속 지시, ${n}단계까지 진행<br>풀에서 남의 지시를 실어 나른 기록 <strong>${r.carried}개</strong>${fin}<br>지시가 들어온 곳을 찾으려면 기록을 <b>${r.traceSteps}개</b> 거슬러 올라가야 합니다.<br>${why}<br>글 #318과 기록 내용은 이 책이 만든 가상 시나리오이며, 기록 수와 추적 단계는 그 시나리오에서 실제로 셌습니다.`;
 }
 return `${PM.find(x=>x[0]===m)[1]}, ${n}단계까지 진행<br>공유 풀에서 42%를 담은 기록 <strong>${r.wrong}개</strong>${r.final===null?' · 최종 보고서는 아직 쓰지 않았습니다.':` · 최종 보고서의 증가율 <strong>${r.final}%</strong> (원문은 4.2%)`}<br>잘못이 어디서 시작됐는지 찾으려면 기록을 <b>${r.traceSteps}개</b> 거슬러 올라가야 합니다${m==='none'?'(출처가 없어 하나씩 열어 봐야 함)':'(출처를 따라 바로 1번 기록에 닿음)'}.<br>${r.caught?'검증자가 풀이 아니라 원문과 대조했기 때문에 잡았습니다.':m==='writer'&&n>=4?'검증자가 풀의 기록끼리만 맞춰 보아 “확인됨”을 붙였습니다. 같은 오류를 세 번 읽은 것뿐입니다.':m==='privilege'?'권한 분리는 남이 심은 지시를 막는 장치라, 조사원 자신의 옮겨 적기 실수는 막지 못합니다.':'원문과 따로 대조한 에이전트가 아직 없습니다.'}<br>미리 정한 시나리오이며, 기록 수와 추적 단계는 그 시나리오에서 실제로 셌습니다.`;
}
A17Labs.poison=el=>{
 U.setup(el,S('pscen','무엇이 풀에 들어오나',PS,'error')+S('pmode','공유 기억 장치',PM,'none')+R('pstep','진행한 단계',1,5,1,5));
 U.bind(el,()=>{const sc=U.text(el,'pscen'),m=U.text(el,'pmode'),n=U.value(el,'pstep'),r=M.poison(m,n,sc);
  const items=r.pool.map(x=>[`${x.who}${x.side?' · 별도 채널':''}`,`${U.esc(x.text)}${x.value!==null?` <b>(${x.value}%)</b>`:''}${x.carries?' <b>[지시가 실림]</b>':''}${x.source?`<br>출처: ${x.source}`:''}${x.flag?`<br>표시: ${x.flag}`:''}`]);
  U.result(el,U.cards(items,items.length-1),poisonNote(r,m,n));});
};

const QM=[['sequential','한 명이 차례로'],['fixed','미리 번갈아 나눠 줌'],['queue','공유 대기열 (빈 사람이 가져감)'],['lpt','대기열 + 긴 일부터']];
A17Labs.queue=el=>{
 U.setup(el,R('qworkers','일꾼 수 w',1,6,1,3)+S('qmode','나누는 방식',QM,'fixed'));
 U.bind(el,()=>{const w=U.value(el,'qworkers'),m=U.text(el,'qmode'),r=M.schedule(w,m);
  U.result(el,sub('일꾼별 일한 시간(분), 점선은 하한')+U.bars(r.load.map((_,i)=>`일꾼 ${i+1} · 문서 ${r.count[i]}개`),r.load,'분',r.lower,0),
  `문서 12개(${M.DOCS.join(', ')}분, 합 46분, 가정값) · ${QM.find(x=>x[0]===m)[1]}${m==='sequential'&&w>1?' (일꾼 수와 상관없이 한 명)':''}<br>모두 끝나는 시간 <strong>${r.makespan}분</strong> · 하한 max(46/${r.w}, 가장 긴 문서 9) = <b>${F(r.lower,1)}분</b><br>쉬는 시간 합 <b>${r.idle}분</b> · 가동률 <b>${pct(r.utilization)}</b><br>배정은 실제로 계산했습니다. 한 문서는 쪼갤 수 없다고 가정하므로 가장 긴 9분 문서가 바닥을 정합니다.`);});
};

const TYPES=['통계 찾기','법규 확인','지도 분석','인터뷰 요약'],AG=['조사원 A','조사원 B','조사원 C(빠름)'];
A17Labs.pheromone=el=>{
 U.setup(el,S('gate','품질 문',[['off','없음 (끝낸 일마다 흔적)'],['on','있음 (검사 통과한 일에만)']],'off')+R('evap','증발률 ρ',0.02,0.5,0.02,0.1));
 U.bind(el,()=>{const g=U.text(el,'gate')==='on',rho=U.value(el,'evap'),r=M.pheromone(g,rho);
  el.querySelector('#evap-value').textContent=F(rho,2);
  const tot=TYPES.map((_,t)=>r.tau.reduce((s,row)=>s+row[t],0)),norm=r.tau.map(row=>row.map((v,t)=>v/tot[t]));
  U.result(el,sub('일감 종류(열)별 흔적 몫: 행은 A, B, C')+U.grid(norm,'일감 종류별로 각 조사원에게 쌓인 흔적의 비율',2)+sub('마지막 60건을 맡은 비율(%)')+U.bars(AG,r.share.map(x=>x*100),'%',null,1),
  `${g?'품질 문 있음':'품질 문 없음'}, ρ = <b>${F(rho,2)}</b>, 일 300건(시드 17)<br>마지막 60건의 평균 품질 <strong>${F(r.quality,3)}</strong> · 무작위 배정 ${F(r.random,3)} · 가장 좋은 배정 0.875<br>흔적이 가장 많은 조사원: ${r.best.map((a,t)=>`${TYPES[t]} ${'ABC'[a]}`).join(', ')} (가장 좋은 답: A, B, B, A)<br>${g?'검사를 통과한 일에만 흔적을 남기니 품질 좋은 길이 굳습니다.':'빠른 조사원 C가 같은 시간에 세 배 많은 흔적을 남겨 길을 차지합니다.'} 품질표와 처리 시간은 가정값이고 시뮬레이션은 실제 계산입니다.`);});
};

A17Labs.vote=el=>{
 U.setup(el,R('voters','투표자 수 N',1,9,2,5)+S('rho','같은 답을 따라갈 확률 ρ (단일 문화)',[[0,'0 (서로 다른 모델)'],[0.1,'0.1'],[0.3,'0.3'],[0.6,'0.6 (같은 모델)']],0.6)+S('pacc','한 명이 맞힐 확률 p',[[0.55,'0.55'],[0.65,'0.65'],[0.75,'0.75']],0.65));
 U.bind(el,()=>{const n=U.value(el,'voters'),rho=U.value(el,'rho'),p=U.value(el,'pacc'),r=M.vote(n,p,rho),cur=[],ind=[];
  for(let i=1;i<=9;i+=2){cur.push([i,M.vote(i,p,rho).acc]);ind.push([i,M.vote(i,p,0).acc]);}
  U.result(el,U.plot({lines:[{data:ind,color:'var(--blue)',dashed:true},{data:cur}],points:[[n,r.acc,'var(--orange)',7]],xmin:1,xmax:9,ymin:0.5,ymax:1,xlabel:'투표자 수 N',ylabel:'다수결이 맞을 확률',label:`투표자 수에 따른 정확도. ρ ${rho}에서 N ${n}이면 ${F(r.acc,3)}`}),
  `N = <b>${n}</b>, p = ${p}, ρ = ${rho}<br>모두 독립일 때 다수결 정확도(이항분포) <b>${F(r.independent,3)}</b><br>ρ를 섞은 정확도 ρ·p + (1−ρ)·독립값 = <strong>${F(r.acc,3)}</strong> · 한 명보다 <b>${r.gain>=0?'+':''}${F(r.gain,3)}</b><br>모델 호출 ${r.calls}번. 파란 점선은 ρ = 0일 때입니다. p와 ρ는 가정값이고 정확도는 정확히 계산했습니다.`);});
};

const AT=[['honest','모두 정직'],['byzantine','배신자 1명 (자신감 0.95)'],['sycophancy','동조 2명 (42%를 따라 함)'],['monoculture','같은 모델 3명이 같은 실수']];
A17Labs.bft=el=>{
 U.setup(el,S('attack','상황',AT,'byzantine')+R('thresh','받아들일 문턱(몫)',0.4,0.8,0.05,0.5));
 U.bind(el,()=>{const a=U.text(el,'attack'),th=U.value(el,'thresh'),r=M.consensus(a,th),rows=[['다수결',r.plural],['자신감 가중',r.weighted],['중앙값',r.geo]];
  el.querySelector('#thresh-value').textContent=F(th,2);
  const votes=r.votes.map(([v,c],i)=>[`에이전트 ${i+1}`,`답 <b>${v}%</b> · 자신감 ${c}`]);
  U.result(el,U.cards(votes,-1)+sub('집계별 결론')+U.cards(rows.map(([n,x])=>[n,`${x.value}% · 몫 ${F(x.share,3)} · ${x.accept?'받아들임':'보류'} · ${x.correct?'맞음':'틀림'}`]),-1),
  `${AT.find(x=>x[0]===a)[1]}, 문턱 <b>${F(th,2)}</b>, 정답 4.2%<br>${rows.map(([n,x])=>`${n} <b>${x.value}%</b>(${x.correct?'맞음':'틀림'}, 몫 ${F(x.share,3)}, ${x.accept?'받아들임':'보류'})`).join(' · ')}<br>틀린 답을 낸 에이전트 <strong>${r.f}명</strong> · 비잔틴 내결함 한계 ⌊(5−1)/3⌋ = <b>${r.bftLimit}명</b><br>다섯 답과 자신감은 미리 정한 시나리오이고, 묶기와 집계는 실제 계산입니다.`);});
};
})();
