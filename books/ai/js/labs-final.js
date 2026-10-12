/* 13장 마지막 과제: 현장 노트북 예산 계산서와 경보 문턱 예산. 계산은 AIMath, 여기서는 그리기만 한다. */
(()=>{
const U=AIUI,M=AIMath,L=AILabs;
// 가상 시나리오 데이터: 시험 질문 10개에서 정답 매뉴얼 조각의 검색 순위(null = 매뉴얼에 답이 없는 질문).
const RANKS=[1,1,1,2,3,3,5,7,null,null];
// 가상 시나리오 데이터: 한빛 공장 모터 20대의 하루 이상 점수와 정비팀이 확인한 실제 이상 여부(1 = 이상).
const MOTORS=[[.33,0],[.71,0],[.12,0],[.91,1],[.40,0],[.24,0],[.58,0],[.05,0],[.47,1],[.36,0],[.18,0],[.52,0],[.27,0],[.78,1],[.09,0],[.44,0],[.21,0],[.62,1],[.15,0],[.30,0]];
const mark=ok=>ok?'<b>예산 안</b>':'<b>예산 초과</b>';
L.fieldkit=el=>{
 U.setup(el,U.range('fk-params','모델 크기 (B parameters)',1,14,1,8)+'<label class="control">가중치 정밀도<select id="fk-bits"><option value="4">4 bit</option><option value="8">8 bit</option><option value="16">16 bit</option></select></label>'+U.range('fk-docs','넣을 매뉴얼 조각 수 k',1,8,1,3)+'<p class="caption">가정: 노트북 16 GiB 중 운영체제·다른 프로그램·런타임 여유 6 GiB를 빼고 10 GiB를 씁니다. 조각 하나 400토큰, 기본 지시와 질문 512토큰, 답 200토큰. 유효 연산 속도 5 TFLOPS, 메모리 대역폭 100 GB/s, 응답 시간 예산 20초. KV 구조는 10장 계산기와 같습니다.</p>',false);
 U.bind(el,()=>{
  const r=M.fieldBudget({params:U.value(el,'fk-params'),bits:U.value(el,'fk-bits'),docs:U.value(el,'fk-docs'),ranks:RANKS});
  const row=(name,value,limit,ok)=>`<tr><td>${name}</td><td>${value}</td><td>${ok===null?'—':limit+(ok?' 안':' 초과')}</td></tr>`;
  el.querySelector('.viz').innerHTML='<div class="table-wrap"><table><tr><th>항목</th><th>계산값</th><th>예산 판정</th></tr>'+
   row('가중치',U.fmt(r.weightGiB)+' GiB','',null)+row('KV 캐시 ('+r.tokens+'토큰)',U.fmt(r.kvGiB)+' GiB','',null)+row('메모리 합계',U.fmt(r.totalGiB)+' GiB',U.fmt(r.availableGiB,0)+' GiB',r.fitsMemory)+
   row('앞부분 읽기 ('+r.prompt+'토큰)',U.fmt(r.prefillS,1)+' s','',null)+row('답 쓰기 (200토큰)',U.fmt(r.decodeS,1)+' s','',null)+row('응답 시간',U.fmt(r.totalS,1)+' s',r.limitS+' s',r.fitsTime)+
   row('근거 적중 (답이 있는 질문)',r.hits+'/'+r.answerable,'',null)+'</table></div>'+U.bars(['메모리 / 10 GiB','응답 시간 / 20 s','근거 적중률'],[Math.min(1,r.totalGiB/r.availableGiB),Math.min(1,r.totalS/r.limitS),r.hitRate])+
   '<p class="caption">막대는 예산 대비 비율이며 100%에서 자릅니다. 시험 질문 10개 중 2개는 매뉴얼에 답이 없으므로 k와 상관없이 보류해야 맞습니다.</p>';
  el.querySelector('.readout').innerHTML=`메모리 ${U.fmt(r.totalGiB)} / ${U.fmt(r.availableGiB,0)} GiB · ${mark(r.fitsMemory)}<br>응답 시간 약 ${U.fmt(r.totalS,1)}초 / ${r.limitS}초 · ${mark(r.fitsTime)}<br>근거 적중률 <b>${U.fmt(r.hitRate*100,1)}%</b> (${r.hits}/${r.answerable})<br><span class="caption">가정에서 나온 어림값이며 실제 노트북에서 잰 값이 아닙니다.</span>`;
 });
};
L.alarmplan=el=>{
 U.setup(el,U.range('ap-threshold','경보 문턱',0,1,.05,.5)+'<label class="control">센서 상태<select id="ap-sensor"><option value="0">기존 센서</option><option value="0.15">새 센서로 교체 (모든 점수 +0.15)</option></select></label><p class="caption">가상 자료: 모터 20대의 하루 이상 점수와 실제 이상 여부(이상 4대)입니다. 경보 한 건마다 15분 점검, 하루 점검 시간 예산 120분. 목표는 놓친 이상 0건이면서 예산 안입니다.</p>',false);
 U.bind(el,()=>{
  const t=U.value(el,'ap-threshold'),r=M.alarmBudget(MOTORS,t,U.value(el,'ap-sensor'));
  el.querySelector('.viz').innerHTML=`<div class="table-wrap"><table><tr><th></th><th>실제 이상</th><th>실제 정상</th></tr><tr><th>경보</th><td>TP ${r.tp}</td><td>FP ${r.fp}</td></tr><tr><th>경보 없음</th><td>FN ${r.fn}</td><td>TN ${r.tn}</td></tr></table></div><br>`+U.bars(['정밀도','재현율','점검 시간 / 120분'],[r.precision,r.recall,Math.min(1,r.minutes/r.budgetMin)])+
   '<div class="sample-grid">'+r.scored.map((s,i)=>`<div class="sample ${s.alarm!==s.anomaly?'wrong':''}"><b>모터 ${i+1} · ${s.score.toFixed(2)}</b><br>실제 ${s.anomaly?'이상':'정상'}<br>${s.alarm?'경보':'조용'} · ${s.alarm?(s.anomaly?'TP':'FP'):(s.anomaly?'FN':'TN')}</div>`).join('')+'</div>';
  el.querySelector('.readout').innerHTML=`경보 <b>${r.tp+r.fp}건</b> × 15분 = <b>${r.minutes}분</b> (${r.withinBudget?'예산 안':'예산 초과'}) · 놓친 이상 <b>${r.fn}건</b><br>정밀도 ${U.fmt(r.precision,3)} · 재현율 ${U.fmt(r.recall,3)} · 계획 ${r.meetsPlan?'<b>충족</b>':'<b>미충족</b>'}${r.tp+r.fp===0?'<br>경보가 0건이라 정밀도는 정의할 수 없습니다. 막대에는 계산 규칙상 0을 표시합니다.':''}<br><span class="caption">주황 테두리는 틀린 판단입니다. 점수는 소수 둘째 자리로 반올림하고 1에서 자릅니다.</span>`;
 });
};
})();
