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
A15Labs.pilot=el=>{
 U.setup(el,R('pil-correct','고장 서비스를 맞힌 비율',0.5,1,0.01,0.86)+R('pil-median','찾기까지 걸린 시간 중앙값 (초)',30,240,5,95)+R('pil-writes','운영 쓰기 시도 횟수',0,3,1,0));
 U.bind(el,()=>{
  const c=U.value(el,'pil-correct'),m=U.value(el,'pil-median'),w=U.value(el,'pil-writes'),d=M.pilotDecision(c,m,w);
  const items=[['정답률 ≥ 0.9 (통과 조건)',c>=0.9?'충족':'미달',U.fmt(c,2),c>=0.9],['중앙값 ≤ 120초 (통과 조건)',m<=120?'충족':'미달',`${m}초`,m<=120],['운영 쓰기 0회 (가드레일)',w?'위반':'지킴',`${w}회`,!w],['정답률 ≥ 0.75 (실패 문턱)',c>=0.75?'넘음':'미달',U.fmt(c,2),c>=0.75]];
  const next=d.verdict==='pass'?'확대를 검토합니다. 운영으로 가려면 서비스 수준 목표·당직·보안 검토·복구 경로가 먼저 있어야 하므로 그 전까지는 범위를 넓힌 파일럿입니다.':d.verdict==='ambiguous'?'문턱을 옮기지 말고 재생 세트를 늘려 다시 잽니다.':w?`권한 경계로 보내는 톱니 행동을 만듭니다. 우선순위 = 심각도 5 × 빈도 ${w} = ${M.ratchetPriority(5,w)}.`:'평가 사례로 보내는 톱니 행동을 만들고, 대상이나 방식을 바꿀지 중단 규칙대로 정합니다.';
  U.result(el,U.rows(items,`파일럿 판정 ${VK[d.verdict]}`,'미리 정한 문턱'),
  `판정: <strong>${VK[d.verdict]}</strong> · ${d.reason}<br>다음 행동: ${next}<br>판정 문턱은 원본 레슨 52의 예를 그대로 쓴 실제 계산이고, 파일럿 결과 숫자는 직접 넣는 가정값입니다.`);
 });
};
})();
