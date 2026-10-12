/* 11~12장 실험: 가정 위험 순위, 가장 작은 검증 조각, 파일럿 판정. 계산은 A15Math에서 한다. */
(()=>{
'use strict';
const U=A15UI,M=A15Math,S=U.select,R=U.range;

A15Labs.risk=el=>{
 U.setup(el,S('risk-tested','이미 검증을 마친 가정',[['none','아직 없음'],...M.ASSUMPTIONS.map(a=>[a.id,`${a.cls} 가정`])],'none')+R('risk-irr','안전 가정의 되돌리기 어려움 (1~5)',1,5,1,4));
 U.bind(el,()=>{
  const r=M.riskRank(U.text(el,'risk-tested'),U.value(el,'risk-irr'));
  const items=r.rows.map(a=>[`${a.cls} · ${a.text}`,a.status==='tested'?'검증됨':r.next&&a.id===r.next.id?'다음 실험':'열림',`${a.impact}×${a.uncertainty}+${a.irreversibility} = ${a.score}`,a.status==='tested']);
  U.result(el,U.rows(items,'다섯 가정의 위험 순위','가정 지도 (위험 높은 순)'),
  `다음에 확인할 가정: <strong>${r.next?`${r.next.cls} · ${r.next.text}`:'없음'}</strong>${r.next?` (위험 ${r.next.score})`:''}<br>점수가 높아도 이미 검증한 가정은 빠지고, 남은 것 가운데 가장 위험한 것을 고릅니다. 되돌리기 어려움이 크면 같은 영향·불확실성이라도 먼저 확인해야 합니다.<br>점수식(영향 × 불확실성 + 되돌리기 어려움)은 원본 레슨 49의 예시를 쓴 실제 계산이고, 각 가정의 1~5 값은 교육용 가정값입니다.`);
 });
};

const PN={usability:'사용성',feasibility:'실현성',safety:'안전',viability:'지속성'};
A15Labs.slice=el=>{
 U.setup(el,S('slice-need','증명해야 할 가정',[['usability','사용성만'],['feasibility,usability','실현성 + 사용성'],['feasibility,usability,safety','실현성 + 사용성 + 안전'],['viability','지속성 (어떤 후보도 증명 못 함)']],'feasibility,usability,safety'));
 U.bind(el,()=>{
  const need=U.text(el,'slice-need').split(','),r=M.chooseSlice(need);
  const items=r.rows.map(s=>[s.name,s.eligible?`점수 ${U.fmt(s.score,3)}`:'자격 없음',`증명: ${s.proves.map(p=>PN[p]).join('·')}`,s.eligible]);
  U.result(el,U.rows(items,`후보 네 개 가운데 자격 있는 후보 ${r.eligible}개`,'조각 후보'),
  `고른 조각: <strong>${r.choice?r.choice.name:'없음'}</strong> · 자격 있는 후보 ${r.eligible}개<br>${r.choice?`필요한 증명(${need.map(p=>PN[p]).join(', ')})을 모두 덮는 후보 가운데 점수가 가장 높습니다. 점수가 더 높아도 증명을 빠뜨린 후보는 고르지 않습니다.`:'필요한 증명을 덮는 후보가 없습니다. 후보를 새로 설계하거나, 중단 규칙에 따라 대상·방식·권한을 다시 정합니다.'}<br>자격 관문과 점수식은 원본 레슨 50 코드와 같은 실제 계산이고, 후보 네 개의 값은 교육용 가정값입니다.`);
 });
};

const VK={pass:'통과',fail:'실패',ambiguous:'모호'};
const PLACE={both:['두 문턱에 걸침','0.75와 0.9가 모두 구간 안에 있어 실제 정답률이 실패 쪽인지 통과 쪽인지 이 표본으로는 가를 수 없습니다. 사건을 늘려 다시 재는 것이 맞습니다.'],
 pass:['0.9 문턱에 걸침','실패 문턱 0.75보다는 확실히 위지만 0.9는 구간 안에 있습니다. 사건을 더 모으면 통과인지 아닌지 가려질 수 있습니다.'],
 fail:['0.75 문턱에 걸침','0.9보다는 확실히 아래이고 0.75가 구간 안에 있습니다. 실패에 가까운 쪽인지를 먼저 가려야 합니다.'],
 between:['두 문턱 사이','구간 전체가 0.75와 0.9 사이입니다. 실제 정답률은 실패 문턱보다 높지만 통과 문턱에는 못 미친다고 읽을 수 있습니다.'],
 above:['0.9 위','구간 전체가 0.9 위라 정답률이 통과 문턱을 넘는다는 판단을 표본의 우연으로 돌리기 어렵습니다.'],
 below:['0.75 아래','구간 전체가 0.75 아래라 정답률 실패는 우연이 아닙니다.']};
A15Labs.pilot=el=>{
 U.setup(el,R('pil-correct','고장 서비스를 맞힌 비율',0.5,1,0.01,0.86)+R('pil-median','찾기까지 걸린 시간 중앙값 (초)',30,240,5,95)+R('pil-writes','운영 쓰기 시도 횟수',0,3,1,0)+S('pil-n','판정한 사건 수 n',[20,50,100,200,500].map(n=>[n,`${n}건`]),50));
 U.bind(el,()=>{
  const c=U.value(el,'pil-correct'),m=U.value(el,'pil-median'),w=U.value(el,'pil-writes'),d=M.pilotDecision(c,m,w),n=Number(U.text(el,'pil-n')),iv=M.pilotInterval(c,n);
  const items=[['정답률 ≥ 0.9 (통과 조건)',c>=0.9?'충족':'미달',U.fmt(c,2),c>=0.9],['중앙값 ≤ 120초 (통과 조건)',m<=120?'충족':'미달',`${m}초`,m<=120],['운영 쓰기 0회 (가드레일)',w?'위반':'지킴',`${w}회`,!w],['정답률 ≥ 0.75 (실패 문턱)',c>=0.75?'넘음':'미달',U.fmt(c,2),c>=0.75],[`정답률의 95% 구간 (사건 ${n}건)`,PLACE[iv.place][0],`${U.fmt(iv.lo,2)} ~ ${U.fmt(iv.hi,2)}`,null]];
  const next=d.verdict==='pass'?'확대를 검토합니다. 운영으로 가려면 서비스 수준 목표·당직·보안 검토·복구 경로가 먼저 있어야 하므로 그 전까지는 범위를 넓힌 파일럿입니다.':d.verdict==='ambiguous'?(iv.place==='between'?'문턱을 옮기지 않습니다. 이미 사건이 넉넉해 재생 세트를 늘려도 0.9를 넘기기 어려우므로, 문맥이나 방식을 고친 판으로 다시 잽니다.':'문턱을 옮기지 말고 재생 세트를 늘려 다시 잽니다.'):w?`권한 경계로 보내는 톱니 행동을 만듭니다. 우선순위 = 심각도 5 × 빈도 ${w} = ${M.ratchetPriority(5,w)}.`:'평가 사례로 보내는 톱니 행동을 만들고, 대상이나 방식을 바꿀지 중단 규칙대로 정합니다.';
  U.result(el,U.rows(items,`파일럿 판정 ${VK[d.verdict]}`,'미리 정한 문턱'),
  `판정: <strong>${VK[d.verdict]}</strong> · ${d.reason}<br>다음 행동: ${next}<br>구간 읽기: 사건 ${n}건에서 나온 ${U.fmt(c,2)}의 Wilson 95% 구간은 <strong>${U.fmt(iv.lo,3)} ~ ${U.fmt(iv.hi,3)}</strong>입니다. ${PLACE[iv.place][1]} 판정 규칙은 그대로이고, 구간은 다음 행동을 고르는 데만 씁니다.<br>판정 문턱은 원본 레슨 52의 예를 그대로 쓴 실제 계산이고, 파일럿 결과 숫자와 사건 수는 직접 넣는 가정값입니다. 구간은 사건마다 맞힘이 독립이라고 가정한 Wilson 식으로 계산했습니다.`);
 });
};
})();
