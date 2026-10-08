/* 2부 실험: MCP 요청 검사 순서, 복제본과 숨은 상태, 캐시 범위, MRTR 재시도 검증, 작업 상태, 두 시계.
   실험 하나당 함수 하나. 계산은 A14Math, 여기서는 입력을 읽고 그리기만 한다. */
(()=>{
'use strict';
const U=A14UI,M=A14Math;

const DEFECTS=[['ok','결함 없음'],['notification','id 없는 알림'],['noMeta','_meta 빠짐'],['nameMismatch','Mcp-Name 헤더와 본문 이름이 다름'],['mismatchUnsupported','헤더와 본문 버전이 다르고 본문 버전도 미지원'],['unsupported','지원하지 않는 버전'],['unknownMethod','없는 메서드'],['missingCap','필요한 클라이언트 기능 없음'],['noToken','토큰 없음'],['toolFails','도구가 실패(isError)']];
const STATE={pass:['통과',true],fail:['멈춤',false],skip:['건너뜀',null],na:['해당 없음',null]};
A14Labs.lifecycle=el=>{
 U.setup(el,U.select('ldef','요청의 결함',DEFECTS,'ok')+U.select('ltr','전송 방식',[['http','Streamable HTTP (POST)'],['stdio','stdio (표준 입출력)']],'http'));
 U.bind(el,()=>{
  const d=U.text(el,'ldef'),tr=U.text(el,'ltr'),r=M.lifecycle(d,tr),o=r.out,http=tr==='http';
  const items=r.stages.map((s,i)=>[`${i+1}. ${s.name}`,STATE[s.state][0],'',STATE[s.state][1]]);
  const status=http?(o.http===null?'HTTP 상태: 원본에 명시 없음':`HTTP ${o.http}`):'HTTP 없음(stdio)';
  const body=o.kind==='notification'?'응답 본문 없음(알림)':o.kind==='auth'?'JSON-RPC 이전에 인증 단계에서 거절':o.code!==null?`JSON-RPC error.code ${o.code}`:o.isError?'resultType complete · 결과 안에 isError: true':`resultType ${o.result}`;
  let note='';
  if(!http&&(d==='nameMismatch'||d==='noToken'))note=' stdio에는 HTTP 헤더와 베어러 토큰이 없으므로 이 결함은 생기지 않아 요청이 끝까지 갑니다.';
  if(d==='mismatchUnsupported')note=http?' 헤더와 본문 일치 검사가 버전 검사보다 먼저이므로 -32020이 먼저 나옵니다.':' stdio에는 헤더가 없으므로 본문 버전만 보고 -32022로 답합니다.';
  if(d==='toolFails')note=' 도구 실행 실패는 프로토콜 오류가 아니라 결과 안의 isError로 알려서, 모델이 읽고 고칠 수 있게 합니다.';
  U.result(el,U.rows(items,'요청 검사 단계',`${status} · ${body}`),
   `응답: <b>${status}</b>, <b>${body}</b>.${note}<br>검사 순서와 오류 코드는 원본 레슨 06·07·09가 정리한 MCP 2026-07-28 규칙을 실제로 계산한 것입니다(원본 커리큘럼 기준, 확인일 2026-10-08). 실제 서버는 부르지 않습니다.`);
 });
};

const DESIGNS=[['memory','복제본 메모리에 초안 보관'],['sticky','고정 경로(sticky)로 같은 복제본에 보냄'],['shared','공유 저장소에 초안 보관']];
A14Labs.replica=el=>{
 U.setup(el,U.range('rn','복제본 수',1,8,1,3)+U.select('rd','초안을 두는 곳',DESIGNS,'memory'));
 U.bind(el,()=>{
  const n=U.value(el,'rn'),d=U.text(el,'rd'),all=DESIGNS.map(([k])=>M.replicaState(n,k)),r=M.replicaState(n,d);
  U.result(el,U.bars(['복제본 메모리','고정 경로','공유 저장소'],all.map(x=>x.pFound*100),'% 찾음',null,1),
   `복제본 ${n}개에서 다음 요청이 초안을 찾을 확률은 <b>${U.fmt(r.pFound*100,1)}%</b>, 1,000번 중 실패는 <b>${U.fmt(r.failPer1000,1)}번</b>입니다.<br>`+
   `요청이 복제본에 고르게 간다고 가정한 실제 계산입니다. 메모리 설계는 1/${n}만 맞힙니다. 고정 경로는 재시작·배포·장애 조치로 경로가 바뀌는 작업을 ${U.fmt(M.MOVE_SHARE*100,0)}%로 가정했으며 이 값은 교육용입니다. 공유 저장소는 어느 복제본이든 같은 상태를 읽습니다.`);
 });
};

A14Labs.cache=el=>{
 U.setup(el,U.select('cs','cacheScope',[['public','public (모두가 공유)'],['private','private (사용자별)']],'public')+U.range('ct','ttlMs(초 단위로 표시)',0,120,10,30));
 U.bind(el,()=>{
  const s=U.text(el,'cs'),ttl=U.value(el,'ct'),r=M.cacheRun(s,ttl);
  const L={fetch:['서버에서 읽음',true],hit:['캐시 적중',true],leak:['남의 내용',false],stale:['낡은 내용',false]};
  const items=r.rows.map(x=>[`${x.t}초 · ${x.u}`,L[x.kind][0],x.kind==='fetch'?'':`${x.at}초에 ${x.from}가 받은 것`,L[x.kind][1]]);
  U.result(el,U.rows(items,'캐시 요청 기록',`notes://inbox · ${s} · ${ttl}초`),
   `요청 ${r.total}개 중 캐시 적중 <b>${r.hits}</b>(남의 내용 <b>${r.leaks}</b>, 낡은 내용 <b>${r.stale}</b>), 서버 읽기 ${r.fetches}번입니다.<br>`+
   `지우가 50초에 노트를 하나 더합니다. 요청 시각과 사용자는 미리 정한 시나리오이고, 적중·누출·낡음 판정은 캐시 키와 유효 시간 규칙으로 실제 계산했습니다. 사용자마다 다른 내용에 public을 붙이면 공유 캐시가 남의 노트를 보여 줍니다.`);
 });
};

const VARIANTS=[['ok','정상: 2번 노트 선택(accept)'],['decline','사용자가 거절(decline)'],['cancel','사용자가 창을 닫음(cancel)'],['tamper','requestState 변조'],['expired','만료된 requestState'],['principal','다른 사용자가 재시도'],['args','인자를 바꿔 재시도'],['malformed','응답 형식 오류'],['notCandidate','후보에 없던 노트 id'],['replay','같은 응답을 다시 보냄']];
A14Labs.rebind=el=>{
 U.setup(el,U.select('rv','다시 보낸 요청',VARIANTS,'ok'));
 U.bind(el,()=>{
  const v=U.text(el,'rv'),r=M.rebind(v);
  const S={pass:['통과',true],fail:['멈춤',false],skip:['건너뜀',null],stop:['여기서 끝',null]};
  const items=r.checks.map((c,i)=>[`${i+1}. ${c.name}`,S[c.state][0],'',S[c.state][1]]);
  const out={deleted:'노트 1개 삭제',decline:'지우지 않고 끝냄',cancel:'지우지 않고 나중에 다시 물을 수 있음',reject:'거절',replay:'재생 공격으로 거절'}[r.outcome];
  U.result(el,U.rows(items,'requestState 검사 단계',out),
   `결과: <b>${out}</b>${r.code!==null?` (JSON-RPC ${r.code})`:''}. 노트 변경 <b>${r.mutation?'있음':'없음'}</b>, nonce 사용 <b>${r.nonceConsumed?'함':'안 함'}</b>, 같은 상태로 다시 시도 <b>${r.retryable?'가능':'불가'}</b>.<br>`+
   '검사 순서는 원본 레슨 11·12가 설명한 서명된 requestState와 일회용 nonce 규칙을 실제로 따라간 것이며, 어떤 변조를 고를지는 시나리오입니다. 형식이 틀린 응답과 cancel은 nonce를 쓰지 않아 만료 전까지 다시 시도할 수 있고, decline은 끝난 결정이므로 아무것도 지우지 않은 채 nonce만 차지합니다.');
 });
};

const STORIES=[['normal','보통: 끝까지 진행'],['input','중간에 사용자 입력 필요'],['cancel','작업 취소'],['late','이미 끝난 뒤 늦은 취소'],['toolError','도구 실패(isError)'],['failed','작업 자체 실패(failed)']];
A14Labs.tasklife=el=>{
 U.setup(el,U.select('tstory','작업 이야기',STORIES,'normal')+U.range('tstep','단계',0,4,1,0));
 U.bind(el,()=>{
  const s=U.text(el,'tstory'),k=U.value(el,'tstep'),r=M.taskStep(s,k),rows=M.TASK_STORIES[s];
  const items=rows.slice(0,r.index+1).map(([m,rt,st,ex],i)=>[`${i}. ${m}`,st,`resultType ${rt}${ex?' · '+ex:''}`,st==='completed'?(ex==='isError'?false:true):st==='failed'||st==='cancelled'?false:null]);
  U.result(el,U.rows(items,'작업 상태 기록',`task_42 · ${r.index+1}/${r.length}단계`),
   `${r.index}단계: <b>${r.method}</b> 호출의 resultType은 <b>${r.resultType}</b>, 작업 status는 <b>${r.status}</b>입니다${r.terminal?' (끝난 상태라 더 바뀌지 않습니다)':''}.${r.beyond?` 이 이야기는 ${r.length}단계에서 끝나므로 마지막 단계를 보여 줍니다.`:''}<br>`+
   'RPC 하나의 결과 모양(resultType)과 작업의 진행 상태(status)는 다른 층입니다. 단계 순서는 Tasks 확장 규칙을 따른 미리 정한 시나리오입니다.');
 });
};

A14Labs.deadline=el=>{
 U.setup(el,U.range('dp','진행 알림 간격(ms)',100,1000,100,400)+U.range('dw','작업 길이(ms)',200,3000,100,1500));
 U.bind(el,()=>{
  const p=U.value(el,'dp'),w=U.value(el,'dw'),r=M.deadline(p,w),idleAt=r.last+500;
  const label={complete:'완료',idle:'유휴 시계로 취소',max:'최대 시계로 취소'}[r.outcome];
  const items=[['받은 진행 알림',`${r.progress}개`,`${p}ms 간격`,null],['마지막 알림 시각',`${r.last} ms`,'유휴 시계를 다시 맞춤',null],['유휴 마감',`${idleAt} ms`,'마지막 알림 + 500',r.outcome!=='idle'],['최대 마감','2000 ms','처음부터 고정',r.outcome!=='max'],['결과',label,`${r.at} ms`,r.outcome==='complete']];
  U.result(el,U.rows(items,'두 시계 계산',label),
   `결과: <b>${label}</b> (${r.at} ms).<br>진행 알림은 유휴 시계만 다시 맞추고 최대 시계는 늘리지 않습니다. 유휴 500ms·최대 2000ms·알림 400ms는 원본 레슨 29의 예시값이며 실제 계산입니다. 취소된 뒤에는 멱등 키로 같은 작업을 안전하게 다시 보낼 수 있습니다.`);
 });
};
})();
