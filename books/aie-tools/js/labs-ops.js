/* 3~4부 실험: 서술자 심사, 토큰 검사, 트레이스 폭포, 스킬 목록 예산, 라우팅 평가, 사고 조사 순서.
   실험 하나당 함수 하나. 계산은 A14Math, 여기서는 입력을 읽고 그리기만 한다. */
(()=>{
'use strict';
const U=A14UI,M=A14Math;

const ADMIT=[['ok','어제와 같은 서술자'],['poisoned','설명에 숨은 지시 추가'],['rugpull','스키마에 recipient 필드만 추가'],['warning','설명에 무해한 경고 문장 추가'],['newTool','처음 보는 도구'],['shadow','다른 서버도 export를 내놓음']];
const DECIDE={admit:['그대로 허용',true],review:['사람 검토로 보냄',false],'quarantine-drift':['격리: 다시 승인할 때까지',false],'quarantine-new':['격리: 처음 보는 도구',false],namespace:['허용하되 이름공간을 붙임',null]};
A14Labs.admit=el=>{
 U.setup(el,U.select('av','오늘 받은 export 서술자',ADMIT,'ok'));
 U.bind(el,()=>{
  const v=U.text(el,'av'),r=M.admitDescriptor(v),[label,good]=DECIDE[r.decision];
  const items=[['승인 목록에 있는 도구',r.known?'예':'아니오','',r.known],['설명 스캐너',r.scanner?`경고 ${r.scanner}건`:'경고 없음','정규식 패턴',!r.scanner],['다이제스트',r.digest,`고정값 ${r.pin}`,r.known?!r.changed:null],['이름 충돌',r.collision?'있음':'없음',r.collision?`공개 이름 ${r.publicName}`:'',r.collision?null:true],['결정',label,'',good]];
  U.result(el,U.rows(items,'서술자 심사 결과',label),
   `결정: <b>${label}</b>. 다이제스트는 서술자를 키 정렬 JSON으로 만든 뒤 해시한 값으로, 브라우저에서 실제로 계산했습니다.<br>`+
   '원본 레슨 15·30은 SHA-256을 쓰지만 이 책은 짧게 보이려고 FNV-1a 32비트를 썼습니다. 무해한 경고 문장도 스캐너에 걸릴 수 있으므로 스캐너 결과는 판정이 아니라 사람 검토의 신호입니다. 서술자 변형은 교육용 시나리오입니다.');
 });
};

const TOKENS=[['valid','정상 토큰'],['wrongAud','할 일 서버를 위한 토큰(aud 다름)'],['missingAud','aud 없음'],['wrongIss','모르는 발급자'],['expired','만료된 토큰'],['noScope','notes:read만 있음'],['newKid','새로 바뀐 서명 키'],['badKid','어디에도 없는 서명 키']];
A14Labs.token=el=>{
 U.setup(el,U.select('tv','토큰 상태',TOKENS,'valid')+U.select('tt','부를 도구',[['notes_search','notes_search (notes:read 필요)'],['notes_delete','notes_delete (notes:delete 필요)']],'notes_search'));
 U.bind(el,()=>{
  const r=M.checkToken(U.text(el,'tv'),U.text(el,'tt'));
  const items=r.steps.map(s=>[s.name,s.ok?'통과':'멈춤',s.note||'',s.ok]);
  items.push(['응답',`HTTP ${r.status}`,r.error||'통과',r.status===200]);
  const hint=r.status===401?'401은 토큰을 다시 받아야 한다는 뜻이고, WWW-Authenticate 머리글로 이유를 알립니다.':r.status===403?'403 insufficient_scope는 토큰은 유효하지만 범위가 모자란다는 뜻이라, 필요한 범위를 붙여 단계적으로 다시 동의를 받습니다.':'모든 검사를 통과해 도구를 실행합니다.';
  U.result(el,U.rows(items,'토큰 검사 단계',`HTTP ${r.status}`),
   `결과: <b>HTTP ${r.status}${r.error?' '+r.error:''}</b> · ${r.desc}. JWKS 다시 받기 <b>${r.refreshes}번</b>.<br>${hint} 검사 순서는 원본 레슨 16·18의 규칙을 실제로 따라간 것이고, 토큰 내용과 주소는 예시입니다.`);
 });
};

A14Labs.trace=el=>{
 U.setup(el,U.select('xs','MCP 서버 상태',[['warm','평소(웜)'],['cold','콜드 스타트']],'warm')+U.select('xp','trace 문맥 전파',[['on','traceparent 전달'],['off','전달하지 않음']],'on'));
 U.bind(el,()=>{
  const cold=U.text(el,'xs')==='cold',prop=U.text(el,'xp')==='on',r=M.traceSpans(cold?'cold':'warm',prop);
  const shown=r.spans.filter(s=>!s.orphan),other=r.spans.filter(s=>s.orphan);
  U.result(el,U.waterfall(r.spans,r.total,'스팬 폭포'),
   `노트 비서 트레이스 전체 <b>${U.fmt(r.total,0)} ms</b>, mcp.call은 <b>${U.fmt(r.mcp,0)} ms</b>(${U.fmt(r.share*100,1)}%)입니다. `+
   (prop?`가장 긴 스팬은 ${r.biggest}입니다.`:`전파하지 않으면 mcp.call 스팬이 다른 트레이스로 떨어져, 이 트레이스에서는 tool.execute 안의 <b>${U.fmt(r.unexplained,0)} ms</b>를 설명할 수 없습니다.`)+
   `<br>이 트레이스에 보이는 스팬 ${shown.length}개${other.length?`, 떨어진 스팬 ${other.length}개`:''}. 스팬 지연은 원본 레슨 20의 “3초와 30초” 사례를 본뜬 교육용 가정값이고, 합계와 비율은 실제 계산입니다.`);
 });
};

A14Labs.disclosure=el=>{
 U.setup(el,U.range('sn','설치한 스킬 수',1,300,1,50)+U.select('sw','문맥 창 크기',[['32000','32k 토큰'],['128000','128k 토큰'],['200000','200k 토큰'],['1000000','1M 토큰']],'200000'));
 U.bind(el,()=>{
  const n=U.value(el,'sn'),w=Number(U.text(el,'sw')),r=M.disclosure(n,w);
  U.result(el,U.bars(['목록 전체','목록 예산 2%','점진 공개','모두 올림'],[r.catalog,r.budget,r.progressive,r.eager],'토큰',null,0),
   `목록은 ${n} × 100 = <b>${U.fmt(r.catalog,0)}토큰</b>, 예산은 ${U.fmt(w,0)} × 2% = ${U.fmt(r.budget,0)}토큰이라 <b>${r.fits}개</b>까지 들어가고 <b>${r.omitted}개</b>가 빠집니다.<br>`+
   `점진 공개(목록 + 본문 하나 + 참고 파일 하나)는 ${U.fmt(r.progressive,0)}토큰(창의 ${U.fmt(r.progShare*100,2)}%), 모든 본문을 올리면 ${U.fmt(r.eager,0)}토큰(창의 ${U.fmt(r.eagerShare*100,1)}%)입니다. `+
   '항목당 약 100토큰은 Agent Skills 명세의 어림값, 2%는 원본 레슨 24가 소개한 한 호스트의 정책(원본 커리큘럼 기준, 확인일 2026-10-08), 본문 3,000·참고 1,500토큰은 교육용 가정값입니다.');
 });
};

A14Labs.routeval=el=>{
 U.setup(el,U.select('rver','설명 판',[['v1','v1 (경계 문장 없음)'],['v2','v2 (쓰지 않을 때를 적음)']],'v1')+U.range('rth','발동 문턱',0.3,0.9,0.05,0.6));
 U.bind(el,()=>{
  const v=U.text(el,'rver'),th=U.value(el,'rth'),r=M.routeEval(v,th);
  const items=[['맞게 발동(TP)',String(r.tp),'가야 할 8개 중',r.fn===0],['놓침(FN)',String(r.fn),'',r.fn===0],['잘못 발동(FP)',String(r.fp),`근접 오답 ${r.nearFp}`,r.fp===0],['맞게 쉼(TN)',String(r.tn),'가지 말아야 할 8개 중',null],
   ['정밀도',U.fmt(r.precision,3),'기준 0.95 이상',r.precision>=.95],['재현율',U.fmt(r.recall,3),'기준 0.90 이상',r.recall>=.90],['출시 기준',r.pass?'통과':'불합격',`근접 오답 오발동 ${r.nearFp} (1 이하)`,r.pass]];
  U.result(el,U.rows(items,'라우팅 평가',`${v} · 문턱 ${U.fmt(th,2)}`),
   `정밀도 = ${r.tp}/(${r.tp}+${r.fp}) = <b>${U.fmt(r.precision,3)}</b>, 재현율 = ${r.tp}/(${r.tp}+${r.fn}) = <b>${U.fmt(r.recall,3)}</b>, F1 ${U.fmt(r.f1,3)}. 출시 기준은 <b>${r.pass?'통과':'불합격'}</b>입니다.<br>`+
   '기준(정밀도 0.95, 재현율 0.90, 근접 오답 오발동 1개 이하)은 원본 레슨 27의 예이고, 16개 사례의 점수는 미리 정한 시나리오입니다. 혼동 행렬과 비율은 실제 계산입니다.');
 });
};

const INC=[['confirm','확인 창 없이 노트가 지워짐'],['proxy500','프록시 뒤에서만 500 오류'],['crossToken','할 일 서버 토큰으로 노트가 열림'],['slow','어떤 날만 30초 걸림'],['double','보고서가 두 번 만들어짐']];
const ORD=[['wire','선 위 기록부터'],['trust','신뢰 경계부터'],['time','시간·재시도부터']];
A14Labs.incident=el=>{
 U.setup(el,U.select('ii','이상 보고',INC,'confirm')+U.select('io','확인 순서',ORD,'wire'));
 U.bind(el,()=>{
  const i=U.text(el,'ii'),o=U.text(el,'io'),r=M.triage(i,o),all=ORD.map(([k])=>M.triage(i,k).minutes);
  const items=M.ORDERS[o].map((k,j)=>[`${j+1}. ${M.CHECKS[k][0]}`,j<r.position?(k===r.root?'원인 발견':'이상 없음'):'하지 않음',`${M.CHECKS[k][1]}분`,j<r.position?(k===r.root?true:null):null]);
  U.result(el,U.rows(items,'점검 순서',`${r.minutes}분 · ${r.position}번째 점검`),
   `원인은 <b>${M.CHECKS[r.root][0]}</b>에서 드러납니다. 이 순서로는 <b>${r.minutes}분</b>(${r.position}번째 점검), 세 순서는 각각 ${ORD.map(([,n],j)=>`${n} ${all[j]}분`).join(', ')}입니다.<br>`+
   '점검별 시간과 보고별 원인은 미리 정한 시나리오이고, 누적 시간은 실제 계산입니다. 실제 사고에서는 원인을 모르므로, 증상이 가리키는 계약부터 보는 습관이 평균 시간을 줄입니다.');
 });
};
})();
