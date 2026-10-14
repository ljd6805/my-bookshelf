/* 마지막 과제 실험: 격자 봇 손실 원인 조사 실험. 모의 서버 60일(500~559일째)의 계좌·장부·주문 기록·체결 목록과 같은 기간 백테스트를 증거 단추로 연다.
   같은 60일의 백테스트 재실행과 60일 전체의 체결 차이는 독자가 이 과제에서 처음 낸다(단추를 누를 때 BMath.audit로 계산). 단단한 증거(대사·주문 기록)를 먼저 열었는지 ✓·▲로 적는다.
   원인별 금액 세 칸을 모두 채워야 풀이 칸이 열린다. 화면 머리에 고정 문장(TEXT.window60·disclaimer·noVerdict)을 같은 말로 둔다.
   대사 계산기와 나머지 계산기의 기본값은 L2(75주·60주·35,150원)와 확인 문제(−52,140·−38,600·−4,920원)와 다르다. */
(()=>{
'use strict';
const U=BUI,M=BMath,S=BData.SCENARIO;
const W=x=>`${U.splus(x)}원`,p2=x=>U.pct(x,2);
const EVIDENCE=[['recon','계좌·장부 대사',true],['orders','주문 기록',true],['rerun','같은 60일 백테스트 다시 돌리기',false],['match','60일 체결 짝짓기',false],['pick','설정을 고른 과정',false]];
function evidenceText(k,A,opened){
 if(k==='recon')return `(가) 대사: 계좌 <b>${A.account}주</b>, 봇 장부 <b>${A.ledger}주</b>, 차이 ${A.account-A.ledger}주 ✗. 끝 종가 ${U.fmt(A.last)}원으로 친 차이의 평가 금액 ${U.fmt((A.account-A.ledger)*A.last)}원.`;
 if(k==='orders')return `(가) 주문 기록: 11번째 거래일 전날 밤 ${U.fmt(S.mock.dup.cell)}원 칸 매수 요청 <b>3건</b>(첫 요청의 응답이 없자 요청 ID 없이 두 번 다시 보냄). 아침 시가 ${U.fmt(A.open)}원에 모두 체결. 더 산 ${A.dupShares}주의 금액(수수료 포함) ${U.fmt(A.dupCost)}원.`;
 if(k==='rerun')return `(나) 같은 60일을 4장의 현실 가정(한 칸 하루 한 번, 한 눈금 지나야, 비용)으로 다시 백테스트: 손익 <b>${W(A.bt)}</b>, 체결 ${A.btStats.fills}건, 끝에 ${A.btStats.shares}주.`;
 if(k==='match')return opened.includes('rerun')?`(다) 60일 체결 짝짓기: 백테스트 ${A.match.btFills}건, 모의 서버 ${A.match.mockFills}건, 맞음 ${A.match.matched} · 놓침 ${A.match.missed} · 더 생김 ${A.match.extra}, 가격 차이 ${W(A.match.priceDiff)}. 모의 서버 손익(중복 매수 제외) ${W(A.live)} − 백테스트 ${W(A.bt)} = 체결 차이 <b>${W(A.fillDiff)}</b>.`
  :`(다) 60일 체결 짝짓기: 모의 서버 체결 ${A.match.mockFills}건. ▲ 짝지을 백테스트 체결이 아직 없습니다. “같은 60일 백테스트 다시 돌리기”를 먼저 여세요.`;
 return `(라) 설정을 고른 과정: 설정 ${A.N}개 가운데 표본 안 1등(연 ${p2(A.isBest)}). 이 숫자를 60거래일로 줄인 기대치 ${W(A.expected)}. 같은 설정의 3년째 전체 ${p2(A.oosBest)}(${A.N}개 중 ${A.oosRank}위), 실력이 0인 설정 ${A.N}개의 1등 샤프 기대값 ${U.sfmt(A.emax,3)}. 1장의 낙관 가정으로 같은 60일을 돌려도 ${W(A.optimistic)}(체결 ${A.optFills}건).`;
}
function amounts(el){const v=['xa','xb','xc'].map(id=>{const s=U.value(el,id).trim().replace(/,/g,'').replace(/^−/,'-');return s===''?null:Number(s);});return v;}
function solution(A){
 const st=M.stopCheck(M.STOP_LOGS.dup,{loss:M.lossLimit(S.capital,2),count:20,same:true,hold:128,recon:true,delay:5});
 return U.table(['원인','근거','금액'],[['시장 경로','(나) 같은 60일 현실 가정 백테스트',W(A.bt)],['체결 차이','(다) 모의 서버 − 백테스트(중복 매수 제외)',W(A.fillDiff)],['중복 매수',`(가) ${A.dupShares}주 × ${U.fmt(A.last)}원 − ${U.fmt(A.dupCost)}원`,W(A.dupPnl)],['합',`${U.verdict(A.bt+A.fillDiff+A.dupPnl===A.total,'실제 손익과 같음','다름')}`,`<b>${W(A.total)}</b> (${U.spct(A.totalPct,2)})`]],'풀이: 원인별 금액','fit')
  +`<p>(바) 9장의 조건을 같은 밤에 대면 ${Object.entries(st.hit).map(([k,h])=>`${k==='same'?'같은 칸 중복 검사':k==='recon'?'장 시작 전 대사':k} ${h.n}번째 요청`).join(', ')}에서 걸립니다. ${M.TEXT.window60}. ${M.TEXT.noVerdict}.</p>`;
}
function calcs(el){
 const a=[U.num(el,'va',true),U.num(el,'vl',true),U.num(el,'vc',true)],b=[U.num(el,'ra',true),U.num(el,'rb',true),U.num(el,'rf',true)];
 const r1=a.some(v=>v===null)?U.problem('대사 계산기','주식 수와 종가를 정수로 넣어 주세요.'):(()=>{const r=M.reconValue(...a);return `대사 계산기: 주식 수 차이 <b>${U.splus(r.shares)}주</b>, 그 차이의 평가 금액 <b>${W(r.value)}</b>.`;})();
 const r2=b.some(v=>v===null)?U.problem('나머지 계산기','금액을 원 단위 정수로 넣어 주세요.'):`나머지 계산기: ${W(b[0])} − (${W(b[1])}) − (${W(b[2])}) = 설명되지 않은 나머지 <b>${W(M.residual(...b))}</b>.`;
 return r1+'<br>'+r2;
}
BLabs['loss-audit']=el=>{
 const opened=[];
 U.setup(el,`<p class="assume-banner"><b>${M.TEXT.window60}.</b><br>${U.DISCLAIMER} ${M.TEXT.noVerdict}.</p>`
  +U.group('증거 열기(고른 순서대로 표가 채워집니다)',`<div class="buttons evidence">${EVIDENCE.map(([k,t])=>`<button type="button" data-evidence="${k}">${t}</button>`).join('')}</div>`)
  +U.group('원인별 금액(원, 직접 계산해 넣기)',U.text('xa','시장 경로의 몫','','(나)에서')+U.text('xb','체결 차이','','(다)에서')+U.text('xc','중복 매수의 몫','','(가)에서: 더 산 주식 수 × 끝 종가 − 더 산 금액'))
  +U.group('대사 계산기(직접 입력)',U.number('va','계좌 주식 수',0,1000000,1,30)+U.number('vl','장부 주식 수',0,1000000,1,30)+U.number('vc','종가(원)',1,10000000,1,20000))
  +U.group('나머지 계산기(직접 입력)',U.number('ra','실제 손익(원)',-100000000,100000000,1,-60000)+U.number('rb','같은 기간 백테스트(원)',-100000000,100000000,1,-45000)+U.number('rf','체결 차이(원)',-100000000,100000000,1,-5000)),true);
 el.querySelectorAll('[data-evidence]').forEach(b=>b.onclick=()=>{if(!opened.includes(b.dataset.evidence))opened.push(b.dataset.evidence);b.setAttribute('aria-pressed','true');el.dispatchEvent(new Event('lab-refresh'));});
 U.bind(el,()=>{
  const A=opened.length?M.audit():null,hard=EVIDENCE.filter(e=>e[2]).map(e=>e[0]),firstSoft=opened.findIndex(k=>!hard.includes(k)),hardFirst=firstSoft<0||hard.every(k=>{const i=opened.indexOf(k);return i>=0&&i<firstSoft;});
  const rows=opened.map((k,i)=>[`${i+1}`,EVIDENCE.find(e=>e[0]===k)[1]+(hard.includes(k)?' (단단한 증거)':''),evidenceText(k,A,opened)]);
  const table=rows.length?U.table(['순서','증거','찾은 것'],rows,'고른 순서대로 채운 조사표','cards'):'<p class="caption">아직 연 증거가 없습니다. 어느 것부터 열지 먼저 정해 보세요.</p>';
  const v=amounts(el),filled=v.every(x=>x!==null&&Number.isFinite(x));let check='▲ 원인별 금액 세 칸을 모두 채우면 합을 확인하고 풀이가 열립니다.';
  if(filled){const t=v.reduce((s,x)=>s+x,0),goal=-89061;check=`넣은 금액의 합 ${W(t)} ${U.verdict(t===goal,`실제 손익 ${W(goal)}과 같음`,`실제 손익 ${W(goal)}과 다름(차이 ${W(t-goal)})`)}.`;}
  const order=opened.length?(hardFirst?'✓ 단단한 증거(대사·주문 기록)부터 보았습니다.':'▲ 해석에 기대는 증거를 먼저 열었습니다. 대사와 주문 기록은 해석 없이 확인되는 사실이라 먼저 봅니다.'):'';
  const sol=filled?`<details class="deep-reading solution"><summary><h3>풀이 열기</h3></summary>${solution(M.audit())}</details>`:'';
  U.result(el,table+sol,`${order}${order?'<br>':''}${check}<br>${calcs(el)}<br>${M.TEXT.noVerdict}. 모의 서버 60일과 중복 매수 사건은 미리 정한 시나리오입니다.${U.kind(['real','scenario'])} ${U.timed('fee')} ${U.timed('tradeTax')} ${U.RECHECK}`);
 });
};
})();
