/* 7~9장 실험: 도구 호출 지연, MCP 요청 판정, Wilson 구간, 판정자 카파, 주입 탐지 임계값. 계산은 A12Math. */
(()=>{
'use strict';
const U=A12UI,M=A12Math,F=U.fmt,R=U.range,S=U.select;

A12Labs.toolloop=el=>{
 U.setup(el,R('tl-n','도구 호출 수 n',1,8,1,3)+R('tl-tool','도구 하나의 실행 시간 (ms)',100,2000,100,500)+S('tl-mode','실행 방식',[['sequential','순차 (도구마다 왕복)'],['parallel','병렬 (한 차례에 모두)']],'sequential'));
 U.bind(el,()=>{const n=U.value(el,'tl-n'),t=U.value(el,'tl-tool'),mode=U.text(el,'tl-mode'),r=M.toolLatency(n,t,mode);
  U.result(el,U.bars(['순차','병렬'],[r.seq,r.par],'ms',null,0),
  `순차: (${n} + 1) × 800 + ${n} × ${t} = <b>${F(r.seq,0)}ms</b> · 병렬: 2 × 800 + ${t} = <b>${F(r.par,0)}ms</b><br>`+
  `지금 고른 ${mode==='parallel'?'병렬':'순차'} 방식의 대기 시간 <strong>${F(r.total/1000,2)}초</strong>, 모델 왕복 ${r.trips}차례 · 병렬로 바꾸면 ${F(r.saved*100,0)}% 줄어듭니다.<br>`+
  (n===1?'도구가 하나면 두 방식이 같습니다. 병렬 호출의 이득은 서로 독립인 호출이 여러 개일 때 생깁니다.':'병렬은 호출들이 서로의 결과를 기다리지 않을 때만 쓸 수 있습니다. 주문 조회 결과로 환불을 정하는 일처럼 앞뒤가 있으면 순차가 필요합니다.')+
  ` 원본 레슨은 대화마다 호출 상한(10~20회)을 두라고 합니다.<br>모델 한 차례 800ms를 가정한 교육용 지연 모형으로 실제 계산한 값입니다.`);});
};

const VARIANTS=[['ok','올바른 tools/list'],['call','올바른 tools/call'],['nometa','_meta 없음'],['noversion','protocolVersion 빠짐'],['oldversion','버전 2025-11-25 요청'],['header','HTTP 헤더 버전만 다름']];
const WHY={'-32602':'메타데이터가 없거나 필수 필드(protocolVersion, clientCapabilities)가 빠졌거나 자료형이 틀리면 형식이 잘못된 요청으로 봅니다.','-32022':'형식은 올바르지만 서버가 지원하지 않는 버전입니다. Streamable HTTP에서는 HTTP 400과 함께 돌아옵니다. data의 supported 목록에서 버전을 골라 다시 보내면 됩니다.','-32020':'HTTP에서는 MCP-Protocol-Version 헤더가 _meta의 버전과, Mcp-Method가 method와 같아야 합니다. 다르면 HTTP 400으로 거절합니다.'};
A12Labs.mcp=el=>{
 U.setup(el,S('mc-variant','요청 종류',VARIANTS,'ok')+S('mc-transport','전송 방식',[['stdio','stdio (헤더 없음)'],['http','Streamable HTTP (POST)']],'stdio'));
 U.bind(el,()=>{const v=U.text(el,'mc-variant'),tr=U.text(el,'mc-transport'),r=M.mcpCheck(v,tr),esc=U.esc;
  const head=tr==='http'?`POST /mcp\n${Object.entries(r.headers).map(([k,x])=>`${k}: ${x}`).join('\n')}\n\n`:'';
  const resp=r.ok?{jsonrpc:'2.0',id:7,result:r.result}:{jsonrpc:'2.0',id:7,error:{code:r.code,message:r.name,...(r.data?{data:r.data}:{})}};
  U.result(el,`<div class="kit-panel"><b>요청</b><pre>${esc(head+JSON.stringify(r.body,null,1))}</pre><b>응답${r.http?` · HTTP ${r.http}`:''}</b><pre>${esc(JSON.stringify(resp,null,1))}</pre></div>`,
  (r.ok?`<strong>처리됨</strong> · resultType <b>${r.result.resultType}</b>`+(r.result.ttlMs?` · 목록을 ${r.result.ttlMs/1000}초 동안 ${r.result.cacheScope==='public'?'공유 캐시':'개인 캐시'}에 둘 수 있음`:'')+'<br>'+(v==='header'?'stdio에는 HTTP 헤더가 없으므로 같은 요청이 통과합니다. 헤더 일치 규칙은 Streamable HTTP에만 적용됩니다.':'요청마다 _meta에 버전과 기능을 실었으므로 서버는 이전 연결 기록 없이 이 요청 하나만 보고 처리합니다.')
  :`<strong>오류 ${r.code} · ${r.name}</strong>${r.http?` (HTTP ${r.http})`:''}<br>${WHY[String(r.code)]}`)+
  '<br>네트워크 없이 원본 커리큘럼이 설명한 2026-07-28 규칙만 평가하는 시나리오입니다. 실제 서버의 세부 동작은 명세에서 확인하세요.');});
};

A12Labs.wilson=el=>{
 U.setup(el,R('wl-n','평가 사례 수 n',20,1000,10,50)+R('wl-acc','관측 통과율',0.5,0.99,0.01,0.9));
 U.bind(el,()=>{const n=U.value(el,'wl-n'),acc=U.value(el,'wl-acc'),k=Math.round(n*acc),w=M.wilson(k,n),ns=[20,50,100,200,300,500,700,1000];
  const lo=ns.map(x=>[x,M.wilson(Math.round(x*acc),x).lo]),hi=ns.map(x=>[x,M.wilson(Math.round(x*acc),x).hi]),ymin=Math.max(0,Math.floor((acc-0.35)*10)/10);
  U.result(el,U.plot({lines:[{data:lo,color:'var(--blue)'},{data:hi,color:'var(--blue)'},{data:[[20,acc],[1000,acc]],color:'var(--accent)',dashed:true}],points:[[n,w.lo,'var(--orange)',6],[n,w.hi,'var(--orange)',6]],xmin:0,xmax:1000,ymin,ymax:1,xlabel:'사례 수 n',ylabel:'통과율 95% 구간',label:`통과율 ${acc}에서 사례 수에 따른 Wilson 95% 구간의 위아래 경계. 현재 n = ${n}에서 ${F(w.lo,3)}부터 ${F(w.hi,3)}`}),
  `${n}개 중 ${k}개 통과(관측 ${F(w.p*100,1)}%) · Wilson 95% 구간 <strong>[${F(w.lo*100,1)}%, ${F(w.hi*100,1)}%]</strong> · 폭 <b>${F(w.width*100,1)}%p</b><br>`+
  (w.width/2>0.05?'구간의 반폭이 5%p보다 넓어서, 5%p 정도의 퇴보는 우연한 흔들림과 구별하기 어렵습니다.':'구간의 반폭이 5%p 이내라서 5%p 정도의 퇴보를 알아챌 여지가 생깁니다.')+
  ` 원본 레슨은 배포 결정에 최소 200개, 비슷한 두 시스템 비교에 500개 이상을 권합니다.<br>Wilson 공식으로 실제 계산했습니다. 반폭과 5%p의 비교는 판단을 돕는 어림이며 정식 검정이 아닙니다.`);});
};

A12Labs.judge=el=>{
 U.setup(el,R('jg-pass','사람의 통과 비율',0.5,0.95,0.05,0.8)+R('jg-sens','판정자 민감도 (사람이 통과시킨 답을 통과)',0.5,1,0.05,0.9)+R('jg-spec','판정자 특이도 (사람이 떨어뜨린 답을 탈락)',0,1,0.05,0.7));
 U.bind(el,()=>{const r=M.kappa(200,U.value(el,'jg-pass'),U.value(el,'jg-sens'),U.value(el,'jg-spec'));
  U.result(el,U.grid([[r.a,r.b],[r.c,r.d]],`사례 200개의 기대 표. 사람 통과·판정자 통과 ${F(r.a,1)}, 사람 통과·판정자 탈락 ${F(r.b,1)}, 사람 탈락·판정자 통과 ${F(r.c,1)}, 사람 탈락·판정자 탈락 ${F(r.d,1)}`,1)+'<p class="caption">윗줄: 사람 통과(판정자 통과 · 탈락), 아랫줄: 사람 탈락(판정자 통과 · 탈락)</p>',
  `일치율 p_o = (${F(r.a,1)} + ${F(r.d,1)}) ÷ 200 = <b>${F(r.po,3)}</b> · 우연 일치 p_e = <b>${F(r.pe,3)}</b> · 카파 <strong>${F(r.kappa,3)}</strong><br>`+
  `판정자의 통과율은 ${F(r.judgePass*100,1)}%로 사람(${F(U.value(el,'jg-pass')*100,0)}%)과 ${Math.abs(r.judgePass-U.value(el,'jg-pass'))<0.005?'같습니다':'다릅니다'}.<br>`+
  (r.kappa<0.2?'일치율이 높아 보여도 카파가 0 근처라면 판정자는 우연 이상으로 사람과 맞추지 못한 것입니다.':r.kappa<0.6?'우연보다는 낫지만, 판정자 혼자 배포를 막고 풀기에는 아직 약한 일치도입니다. 기준표를 다듬고 다시 맞춰 보세요.':'사람과 상당히 일치합니다. 그래도 정기적으로 사람 판정과 다시 맞춰 봐야 합니다.')+
  '<br>사람 판정을 기준으로 민감도·특이도를 가정해 만든 기대 표로 실제 계산했습니다. 판정 모델은 부르지 않습니다.');});
};

A12Labs.guard=el=>{
 U.setup(el,R('gd-thr','탐지 임계값',0.1,0.95,0.05,0.5)+S('gd-share','공격 비율 (기저율)',[['0.001','0.1%'],['0.01','1%'],['0.1','10%']],'0.01'));
 U.bind(el,()=>{const th=U.value(el,'gd-thr'),sh=Number(U.text(el,'gd-share')),g=M.guard(th,sh),xs=[];for(let x=0.1;x<=0.951;x+=0.05)xs.push(+x.toFixed(2));
  U.result(el,U.plot({lines:[{data:xs.map(x=>[x,M.guard(x,sh).tpr])},{data:xs.map(x=>[x,M.guard(x,sh).fpr]),color:'var(--orange)',dashed:true}],points:[[th,g.tpr,'var(--accent)',6],[th,g.fpr,'var(--orange)',6]],xmin:0.1,xmax:0.95,ymin:0,ymax:1,xlabel:'임계값',ylabel:'잡는 비율(실선) · 잘못 막는 비율(점선)',label:`임계값에 따른 공격 탐지율과 정상 문의 오차단율. 현재 ${th}에서 탐지율 ${F(g.tpr,2)}, 오차단율 ${F(g.fpr,3)}`}),
  `하루 1만 건 중 공격 ${F(10000*sh,0)}건 · 잡은 공격 <b>${F(g.tp,1)}건</b>(${F(g.tpr*100,0)}%) · 놓친 공격 ${F(g.fn,1)}건 · 잘못 막은 정상 문의 <b>${F(g.fp,1)}건</b>(${F(g.fpr*100,1)}%)<br>`+
  `막은 요청 가운데 실제 공격의 비율(정밀도) <strong>${F(g.precision*100,1)}%</strong><br>`+
  (g.precision<0.1?'공격이 드물어서 막힌 요청 대부분이 정상 고객입니다. 한 층에 다 맡기지 말고 다른 층과 감시로 나누어야 합니다.':'공격 비율이 높아질수록 같은 탐지기라도 정밀도가 올라갑니다. 기저율이 정밀도를 좌우합니다.')+
  '<br>교육용 탐지 점수 60개로 실제 계산했습니다. 실제 탐지기의 성능 수치가 아닙니다.');});
};
})();
