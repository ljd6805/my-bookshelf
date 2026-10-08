/* 10~12장 실험: 네 층 우선순위, 방어 겹의 곱, 로지스틱 시간 지평 적합, 마지막 과제의 사고 처방.
   계산과 판정은 A16Math에 있고 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=A16UI,M=A16Math,R=U.range,S=U.select,F=U.fmt;

A16Labs.tiers=el=>{
 U.setup(el,S('tcase','사례',M.tierCases.map((c,i)=>[i,c.name]),3)+S('operator','운영자 설정',[['default','기본 설정'],['narrow','책 관련만, 답은 짧게'],['unlock','“모두 허용”을 시도']],'default'));
 U.bind(el,()=>{const i=U.value(el,'tcase'),o=U.text(el,'operator'),r=M.tiers(i,o);
  const names=['하드코딩 금지','1층 안전·감독 지원','2층 윤리','3층 지침','4층 도움'],cur=names.findIndex(n=>r.tier.startsWith(n));
  const state=[r.hard?'걸림':'해당 없음',r.safety?'통과':'걸림',r.ethics?'통과':'걸림',r.guide==='ok'?'통과':r.guide==='scope'?'주제 범위 기본값':'말투·길이 기본값','도울 수 있음'];
  U.result(el,U.cards(names.map((n,k)=>[n,state[k]]),cur),
  `사례: <b>${r.name}</b> · 운영자: <b>${o==='default'?'기본':o==='narrow'?'좁힘':'모두 허용 시도'}</b><br>결정: <strong>${r.decision}</strong> · 결정한 층: <strong>${r.tier}</strong>${r.note?`<br>${r.note}`:''}<br>위층부터 차례로 보고 처음 걸리는 층이 결정합니다. 사례별 판정은 이 책의 교육용 가정이고, 층 순서는 원본이 정리한 2026년 헌법의 우선순위를 따릅니다.`);});
};

A16Labs.layers=el=>{
 const nm=['분류기','헌법 학습 모델','런타임 권한','사람 승인'];
 U.setup(el,S('attack','공격 변형',[['plain','평문 요청'],['homoglyph','동형 문자 바꾸기'],['emoji','이모지 숨기기'],['paraphrase','의미 바꿔 말하기']],'emoji')+R('nl','쌓은 층 수',1,4,1,1));
 U.bind(el,()=>{const a=U.text(el,'attack'),n=U.value(el,'nl'),r=M.layers(a,n);let acc=1;
  const cum=r.each.map(p=>(acc*=p)*1000);
  U.result(el,U.bars(r.used.map((_,k)=>`${k+1}층까지 · ${nm[k]}`),cum,'공격 1,000번 중 통과 수',null,1),
  `${n}층 · 층별 통과율 ${r.each.map((p,k)=>`${nm[k]} <b>${F(p,2)}</b>`).join(', ')}<br>모든 층 통과 확률 = <strong>${F(r.pass,4)}</strong> · 공격 1,000번 중 약 <strong>${F(r.per1000,1)}</strong>번<br>층이 서로 독립이라는 낙관적 가정의 곱입니다. 이모지 숨기기의 분류기 통과율 1.00은 원본이 인용한 논문 값이고, 나머지 통과율은 교육용 가정값입니다.`);});
};

const hm=m=>m<90?`${F(m,0)}분`:`${F(m/60,1)}시간`;
A16Labs.horizonfit=el=>{
 U.setup(el,R('inflate','평가 상황 부풀림(%p)',0,20,1,0)+S('level','요구 신뢰도',[[0.5,'50%'],[0.8,'80%'],[0.9,'90%']],0.8));
 U.bind(el,()=>{const inf=U.value(el,'inflate'),lv=U.value(el,'level'),r=M.horizon(inf,lv);
  const curve=(f)=>Array.from({length:45},(_,i)=>{const x=i*11/44;return [x,M.sigmoid(f.a-f.b*x)];});
  const base=M.logisticFit(M.horizonData(0));
  U.result(el,U.plot({lines:[{data:curve(r.fit)},{data:curve(base),color:'var(--muted)',dashed:true},{data:[[0,lv],[11,lv]],color:'var(--blue)',dashed:true}],points:r.data.map(d=>[d.x,d.k/d.n,'var(--orange)',4]),xmin:0,xmax:11,ymin:0,ymax:1,xlabel:'전문가 소요 시간 log₂(분): 0=1분, 6=64분, 11=2,048분',ylabel:'성공 확률',label:`부풀림 ${inf}%p에서 적합한 로지스틱 곡선과 요구 신뢰도 ${F(lv*100,0)}% 선`}),
  `적합 결과 a = <b>${F(r.fit.a,3)}</b>, b = <b>${F(r.fit.b,3)}</b> · 50% 지평 <strong>${hm(r.h50)}</strong>, ${F(lv*100,0)}% 지평 <strong>${hm(r.hLevel)}</strong><br>부풀림이 없을 때의 값: 50% <b>${hm(r.true50)}</b>, ${F(lv*100,0)}% <b>${hm(r.trueLevel)}</b> · 부풀림으로 50% 지평이 <b>${F(r.h50/r.true50,2)}배</b>로 보입니다<br>가상 모델(참 50% 지평 240분, 기울기 0.6)의 과제 12묶음×20번 시도에 뉴턴법으로 실제 적합한 값입니다. METR의 실제 데이터가 아닙니다.`);});
};

A16Labs.incident=el=>{
 const O=M.incidentOptions;
 U.setup(el,S('fixcost','사고 1 · 비용 네 배(주문 상태 폴링 고리)',O.cost,'none')+S('fixinject','사고 2 · 숨은 지시로 낯선 계좌 환불',O.inject,'none')+S('fiximprove','사고 3 · 평가기 검사를 지운 자기 개선',O.improve,'none'));
 U.bind(el,()=>{const c=U.text(el,'fixcost'),i=U.text(el,'fixinject'),s=U.text(el,'fiximprove'),r=M.incident(c,i,s);
  const lab=(k,v)=>O[k].find(x=>x[0]===v)[1];
  const rows=[['1 · 비용 고리',lab('cost',c),`${r.cost.toLocaleString('en-US')}달러`,r.costNote],['2 · 숨은 지시 환불',lab('inject',i),r.inject===0?'막힘':r.inject===1?'뚫림':'절반쯤 뚫림',r.injectNote],['3 · 평가기 편집',lab('improve',s),r.improve===0?'막힘':r.improve===1?'뚫림':'절반쯤 뚫림',r.improveNote]];
  U.result(el,U.table(['사고','고른 통제','남는 피해','이유'],rows,'사고 세 건에 고른 통제와 남는 피해'),
  `남은 비용 피해 <strong>${r.cost.toLocaleString('en-US')}달러</strong> · 숨은 지시 환불 <strong>${r.inject===0?'막힘':r.inject===1?'뚫림':'절반'}</strong> · 평가기 편집 <strong>${r.improve===0?'막힘':r.improve===1?'뚫림':'절반'}</strong><br>아직 열려 있는 사고 <b>${r.open}</b>건 · ${r.open===0?'세 경로가 모두 끊겼습니다. 이제 각 선택의 근거가 된 장과 부족한 증거를 적으세요.':'열린 사고의 경로를 다시 따라가 어느 장의 통제가 그 경로를 끊는지 찾아보세요.'}<br>피해액과 “절반” 판정은 교육용 가정값이며, 판정은 이 책의 규칙 계산입니다.`);});
};
})();
