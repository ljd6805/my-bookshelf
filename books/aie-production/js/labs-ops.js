/* 7~12장 실험: 늘리고 줄이기, 청구서, 게이트웨이, 배포, 사고 대응, 마지막 진단. 계산은 A18Math가 한다. */
(()=>{
'use strict';
const U=A18UI,M=A18Math,L=A18Labs,pct=(x,d=1)=>U.fmt(x*100,d)+'%';

L.coldstart=el=>{
 U.setup(el,U.select('node','노드 공급',[['ca','Cluster Autoscaler'],['karp','Karpenter']],'ca')+U.select('image','컨테이너 이미지',[['pull','그때 내려받기'],['seeded','노드에 미리 심기']],'pull')+U.select('weights','가중치 적재',[['plain','파일 전체를 읽은 뒤 적재'],['stream','스트리밍 적재'],['snapshot','GPU 스냅숏 복원']],'plain')+U.select('warm','늘 켜 둔 웜 풀',[[0,'0대'],[1,'1대'],[2,'2대']],0));
 U.bind(el,()=>{
  const o={node:U.text(el,'node'),image:U.text(el,'image'),weights:U.text(el,'weights'),warm:U.value(el,'warm')},r=M.coldStart(o);
  const chart=`<p class="caption">0대에서 깨어날 때 단계별 시간</p>`+U.bars(r.parts.map(p=>p[0]),r.parts.map(p=>p[1]),'초',null,1);
  const warm=o.warm>0?`웜 풀 ${o.warm}대가 있으므로 첫 요청은 <b>${r.first}초</b> 안에 답을 받기 시작합니다. 대신 매달 <b>${U.fmt(r.warmMonth,0)}달러</b>를 냅니다.`:`웜 풀이 없으므로 첫 요청이 <b>${U.fmt(r.first,1)}초</b>를 기다립니다.`;
  U.result(el,chart,`0대에서 깨어나는 데 걸리는 시간 <b>${U.fmt(r.cold,1)}초</b><br>${warm}<br>단계별 시간은 원본 레슨 10의 70B 예시 표를 바탕으로 한 시나리오 값이고, 웜 풀 비용(GPU 시간당 4달러 × 730시간)만 실제 계산입니다.`);
 });
};

L.bill=el=>{
 U.setup(el,U.range('hit','프롬프트 캐시 적중률',0,0.99,0.01,0.07)+U.select('lane','처리 차선',[['sync','즉시 응답'],['batch','배치 API (24시간 안)']],'sync'));
 U.bind(el,()=>{
  const h=U.value(el,'hit'),lane=U.text(el,'lane'),r=M.dailyBill(h,lane);
  const chart=U.bars(['고정 접두부 2,000토큰','고객별 입력 500토큰','출력 200토큰','하루 합계','기준(캐시·배치 없음)'],[r.parts.prefix,r.parts.dynamic,r.parts.output,r.day,r.base],'달러',null,2);
  const cmp=r.ratio<1?`기준보다 <b>${pct(1-r.ratio)} 쌉니다</b>`:`기준보다 <b>${pct(r.ratio-1)} 비쌉니다</b>`;
  U.result(el,chart,`요청 1만 건의 하루 청구액 <b>${U.fmt(r.day,2)}달러</b> · ${cmp}<br>캐시에서 읽으면 입력 단가의 10%, 캐시에 쓰면 125%를 냅니다. 적중률이 낮으면 쓰기 할증 때문에 캐시를 켜지 않은 것보다 비쌀 수 있습니다.<br>실제 계산입니다. 단가(입력 3달러, 캐시 읽기 0.30달러, 쓰기 3.75달러, 출력 15달러, 100만 토큰당)와 배치 50% 할인은 원본 레슨 15를 따른 교육용 가정이며 현재 가격표가 아닙니다.`);
 });
};

L.cascade=el=>{
 U.setup(el,U.range('frac','작은 모델로 먼저 보내는 비율',0,1,0.05,0.7)+U.select('cmode','방식',[['cascade','계단식 (확신이 낮으면 올려 보냄)'],['pre','미리 분류 (올려 보내지 않음)']],'cascade'));
 U.bind(el,()=>{
  const f=U.value(el,'frac'),m=U.text(el,'cmode'),r=M.cascade(f,m);
  const chart=`<p class="caption">모든 요청을 큰 모델로 보낼 때를 100으로 둔 비율</p>`+U.bars(['상대 비용','품질 손실','올려 보낸 요청'],[r.cost*100,r.loss*100,r.esc*100],'%',null,1);
  U.result(el,chart,`비용 <b>${pct(r.cost)}</b>(절약 ${pct(r.savings)}) · 품질 손실 <b>${pct(r.loss)}</b> · 작은 모델로 보낸 것 가운데 올려 보낸 비율 ${pct(r.escRate)}<br>요청의 70%만 정말 쉬운 질문이라고 가정했으므로, 그보다 많이 작은 모델로 보내면 어려운 질문 ${pct(r.complexRouted)}가 섞여 들어갑니다.<br>미리 정한 시나리오입니다. 작은 모델 비용 3%, 확신도 검사가 어려운 질문의 80%를 잡고 쉬운 질문의 10%도 조심스레 올려 보낸다는 가정을 넣었습니다.`);
 });
};

L.fallback=el=>{
 U.setup(el,U.range('p429','첫 공급자 실패율 (429·5xx)',0,1,0.05,0.3)+U.range('burst','실패 가운데 장애형의 몫 (재시도해도 다시 실패)',0,1,0.1,0)+U.select('retries','재시도 횟수',[[0,'0번'],[1,'1번'],[2,'2번'],[3,'3번'],[5,'5번']],2)+U.select('fb','대체 공급자',[['no','없음'],['yes','있음']],'no'));
 U.bind(el,()=>{
  const p=U.value(el,'p429'),s=U.value(el,'burst'),k=U.value(el,'retries'),fb=U.text(el,'fb')==='yes',r=M.gatewayFallback(p,k,fb,{burst:s});
  const chart=`<p class="caption">점선은 전체 시간 목표 3,000ms</p>`+U.bars(['성공한 요청의 평균 지연','가장 늦게 성공한 경우'],[r.meanLatency,r.worst],'ms',3000,0);
  const lat=r.success>0?`성공한 요청의 평균 지연 ${U.fmt(r.meanLatency,0)}ms, 가장 늦게 성공한 경우 ${U.fmt(r.worst,0)}ms(점선은 전체 시간 목표 3,000ms)`:'성공한 요청이 없어 지연을 잴 수 없습니다';
  const kind=s===0?'실패가 시도마다 독립이라고 둔 계산입니다. 실제 장애는 몰려 오므로 이 값은 낙관적인 쪽입니다.':(s===1?'실패가 모두 장애형이므로 재시도는 같은 실패를 다시 만날 뿐이고, 실패율은 재시도 횟수와 상관없이 첫 시도의 실패율과 같습니다.':`실패의 ${pct(s,0)}는 장애형, 나머지는 시도마다 독립이라고 둔 계산입니다.`);
  U.result(el,chart,`손님이 보는 실패율 <b>${pct(r.failRate,3)}</b> · 첫 공급자에서 끝까지 실패할 확률 ${pct(r.allFail,3)}<br>첫 공급자에 보내는 호출은 요청 하나당 평균 <b>${U.fmt(r.calls,2)}번</b>(재시도로 불어난 부하)입니다. ${lat}.<br>${kind}<br>실제 계산입니다. 호출 900ms, 재시도 대기 250ms에서 두 배씩, 대체 공급자 실패율 2%는 교육용 가정입니다.`);
 });
};

L.canary=el=>{
 U.setup(el,U.select('metric','관문을 거는 지표',Object.entries(M.CANARY).map(([k,v])=>[k,`${v.label} (관문 ${v.gate}배)`]),'refusal')+U.range('ratio','새 버전의 실제 악화 (배)',1,2.5,0.05,1.3));
 U.bind(el,()=>{
  const m=U.text(el,'metric'),x=U.value(el,'ratio'),r=M.canary(m,x),g=M.CANARY[m].gate;
  const chart=`<p class="caption">그 단계까지 왔을 때 관문이 울릴 확률</p>`+U.bars(r.stages.map(s=>`${s.share}% 단계`),r.stages.map(s=>s.trip*100),'%',null,1);
  const truth=x>=g?'실제로 관문을 넘는 악화이므로 멈추는 것이 옳습니다':(x<=1.0001?'실제 악화가 없으므로 울리면 모두 잘못된 경보입니다':'실제 악화가 관문보다 작으므로 계속 가는 것이 옳습니다');
  U.result(el,chart,`관문이 어디선가 울려 멈출 확률 <b>${pct(r.haltBy)}</b> · 100%까지 가 버릴 확률 <b>${pct(r.reachFull)}</b><br>${truth}. 앞 단계일수록 카나리 쪽 요청이 적어 비율의 표준오차가 커지므로 관문이 우연히 울리기 쉽습니다.<br>실제 계산입니다(정규 근사). 단계마다 한 시간 동안 요청 3,000건, 기준 거절률 2%·싫어요 5%·요청당 비용 변동계수 0.8은 교육용 가정입니다.`);
 });
};

L.abpower=el=>{
 U.setup(el,U.range('abp','기준 만족률 p (0.05~0.95)',0.05,0.95,0.01,0.6)+U.range('abdelta','최소 검출 차이 δ (%p, 0.5~10)',0.5,10,0.5,3)
  +U.select('abalpha','유의수준 α (양측)',[[0.01,'0.01'],[0.05,'0.05'],[0.1,'0.10']],0.05)+U.select('abpow','검정력 1 − β',[[0.8,'80%'],[0.9,'90%']],0.8)
  +U.range('abdaily','하루 요청 (건, 1만~20만)',10000,200000,10000,50000)+U.range('abfeed','피드백 비율 (가정, 0.01~0.5)',0.01,0.5,0.01,0.05)
  +U.range('abrho','CUPED 상관 ρ (0~0.9)',0,0.9,0.05,0));
 U.bind(el,()=>{
  const o={p:U.value(el,'abp'),delta:U.value(el,'abdelta')/100,alpha:U.value(el,'abalpha'),power:U.value(el,'abpow'),daily:U.value(el,'abdaily'),feedback:U.value(el,'abfeed'),rho:U.value(el,'abrho')},r=M.abSample(o);
  if(!r.valid){U.result(el,'<p class="caption">계산할 수 없어 그래프를 비웠습니다.</p>',`<b>계산할 수 없습니다.</b> 새 버전의 만족률 p + δ = ${pct(o.p+o.delta,1)}가 100%에 닿거나 넘습니다. 비율은 100%를 넘을 수 없으므로 기준 만족률을 낮추거나 δ를 줄이세요.`);return;}
  const days=[r.days,r.daysCuped],chart=`<p class="caption">50:50으로 나눌 때 필요한 날 수 · 점선은 7일</p>`+U.bars(['CUPED 없이',`CUPED 뒤 (ρ ${U.fmt(o.rho,2)})`],days,'일',7,1);
  const week=r.days<=7?`일주일 안에 끝납니다.`:(r.daysCuped<=7?`CUPED 없이는 일주일을 넘기지만 CUPED로 일주일 안에 들어옵니다.`:`일주일을 넘깁니다. δ를 키우거나, 피드백을 더 모으거나, CUPED 상관을 높여야 줄어듭니다.`);
  const cu=o.rho>0?`ρ ${U.fmt(o.rho,2)}이면 분산이 (1 − ρ²) = ${pct(r.saved,0)}로 줄어 집단당 <b>${U.fmt(r.nCuped,0)}명</b>, <b>${U.fmt(r.daysCuped,1)}일</b>입니다.`:'CUPED 상관이 0이면 표본은 줄지 않습니다.';
  U.result(el,chart,`집단당 필요한 표본 <b>${U.fmt(r.n,0)}명</b> · 하루 집단당 ${U.fmt(r.perDay,0)}명 · 필요한 기간 <b>${U.fmt(r.days,1)}일</b> (날짜로 세면 ${r.wholeDays}일)<br>만족률 ${pct(o.p,0)}에서 ${pct(r.p2,1)}로 나아진 것을 알아채려는 계산입니다(z ${U.fmt(r.zA,3)} + ${U.fmt(r.zB,3)}). ${cu} ${week}<br>실제 계산입니다(두 비율 양측 검정의 정규 근사, p₂ = p + δ). 피드백 비율과 CUPED 상관은 교육용 가정이고, 원본이 권한 비결정성 여유(1.3~1.5배)와 여러 번 들여다보는 순차 검정의 보정은 넣지 않았습니다.`);
 });
};

L.burnrate=el=>{
 U.setup(el,U.select('blast','영향 범위 (트래픽 비율)',[[0.01,'1%'],[0.05,'5%'],[0.2,'20%'],[1,'100%']],0.05)+U.range('inj','주입한 오류율',0,1,0.05,0.2));
 U.bind(el,()=>{
  const b=U.value(el,'blast'),i=U.value(el,'inj'),r=M.burnRate(b,i);
  const chart=`<p class="caption">점선은 중단 기준 2배</p>`+U.bars(['소진 속도'],[r.burn],'배',2,2);
  U.result(el,chart,`전체 오류율 ${pct(r.overall,2)} · 소진 속도 <b>${U.fmt(r.burn,2)}배</b> · ${r.abort?'<b>중단합니다.</b>':'<b>계속해도 됩니다.</b>'}<br>이 속도면 한 달(720시간) 오류 예산을 ${U.fmt(r.hoursToEmpty,0)}시간 만에 다 씁니다.<br>실제 계산입니다. SLO 가용성 99.5%(예산 0.5%), 평소 오류율 0.1%, 소진 속도 2배를 넘으면 실험을 멈춘다는 규칙은 원본 레슨 23을 따른 교육용 가정입니다.`);
 });
};

L.sampling=el=>{
 U.setup(el,U.range('srate','성공 추적의 표본 비율',0.01,1,0.01,0.05)+U.select('rule','보관 규칙',[['uniform','모두 같은 비율'],['rules','오류·고비용은 모두 남김']],'uniform'));
 U.bind(el,()=>{
  const s=U.value(el,'srate'),ru=U.text(el,'rule'),r=M.traceSampling(s,ru);
  const chart=U.bars(['보관하는 추적','남는 오류 추적','드문 문제를 하루에 한 번이라도 잡을 확률'],[r.share*100,r.errKept*100,r.rareCatch*100],'%',null,1);
  U.result(el,chart,`하루 100만 건 중 <b>${U.fmt(r.kept/1e4,1)}만 건</b>(${pct(r.share,2)})을 남깁니다. 오류 추적은 ${pct(r.errKept,0)}가 남습니다.<br>하루 20번 나타나는 드문 문제를 한 번이라도 잡을 확률은 ${pct(r.rareCatch)}입니다. 이 확률은 규칙과 상관없이 성공 추적의 표본 비율만으로 정해집니다.<br>실제 계산입니다. 오류 2%, 고비용 요청 5%, 표본 추출이 요청마다 독립이라는 가정을 넣었습니다.`);
 });
};

L.diagnose=el=>{
 const reports=[['cold','① “주말 뒤 첫 손님이 몇 분을 기다렸다”'],['cache','② “외부 API 청구서가 예상보다 크다”'],['tail','③ “답이 가끔 뚝뚝 끊긴다”'],['canary','④ “새 프롬프트를 1%에 올리자마자 거절률 관문이 울렸다”'],['outage','⑤ “공급자 429 장애 20분 동안 실패율이 30%였다”']];
 const fixes=[['warm','웜 풀 1대'],['reorder','프롬프트 순서 바꾸기'],['chunk','청크 프리필 켜기'],['route','캐시를 아는 라우터'],['window','카나리 관찰 창을 1시간에서 4시간으로'],['fallback','대체 공급자 켜기'],['retry5','재시도를 2번에서 5번으로']];
 U.setup(el,U.select('report','운영 보고',reports,'cold')+U.select('fix','처방',fixes,'warm'));
 U.bind(el,()=>{
  const rep=U.text(el,'report'),fix=U.text(el,'fix'),r=M.finalCase(rep,fix);
  const chart=`<p class="caption">${r.metric}</p>`+U.bars(['처방 전','처방 후'],[r.before,r.after],'',null,2);
  const moved=r.after!==r.before,good=r.lowerBetter?r.after<r.before:r.after>r.before;
  const msg=r.matched?'<b>지표가 움직였습니다.</b> 보고된 증상과 처방이 같은 원인을 겨눕니다.':(moved?'지표가 움직였지만 다른 원인입니다.':'<b>지표가 그대로입니다.</b> 이 처방은 다른 장의 문제를 겨눕니다.');
  U.result(el,chart,`${r.metric}: ${U.fmt(r.before,2)} → <b>${U.fmt(r.after,2)}</b> ${good?'(개선)':''}<br>${msg}<br>실제 계산입니다. 7장(콜드 스타트), 8장(청구서), 4장(goodput), 10장(카나리 관문), 9장(재시도와 대체)의 같은 함수를 다시 돌린 결과이며, 각 장의 교육용 가정을 그대로 씁니다.`);
 });
};
})();
