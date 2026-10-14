/* 7·8장 실험: 모의 주문 요청·응답 실험(7장)과 주문 상태와 잔고 대사 실험(8장).
   모의 서버는 책 안의 가상 함수(BMath.mockSend·orderFlow)이며 실제 증권사에 연결하지 않는다. 키 칸은 읽기 전용 “가상 키”이고 실제 키를 넣는 칸이 없다(책 AGENTS.md).
   7장 기본값은 주문 4건, 8장 기본값은 10주 주문의 접수 → 전량 체결이다(L2의 20건·18,750원 4주 체결 뒤 취소와 다름). */
(()=>{
'use strict';
const U=BUI,M=BMath,S=BData.SCENARIO;
const W=x=>`${U.splus(x)}원`;
const CODE_TEXT={OK:'✓ 접수',RATE_LIMIT:'✗ 초당 한도 초과',NO_TOKEN:'✗ 토큰 없음',TOKEN_EXPIRED:'✗ 토큰 만료',BAD_TICK:'✗ 호가 눈금이 아님',BAD_QTY:'✗ 수량 오류',SAME_ID:'▲ 같은 요청 ID(첫 응답을 다시 돌려줌)'};
function requests(el){
 const n=U.num(el,'an',true),p=U.num(el,'ap',true),q=U.num(el,'aq',true);if(n===null||p===null||q===null)return null;
 const rid=U.checked(el,'ar'),out=Array.from({length:n},(_,k)=>({side:'B',price:p-250*k,qty:q,rid:rid?`req-${k+1}`:null}));
 if(U.checked(el,'aa')&&n)out.push({...out[n-1],again:true});
 return out;
}
BLabs['mock-api']=el=>{
 U.setup(el,`<p class="assume-banner"><b>${M.TEXT.mockOnly}.</b><br>${M.TEXT.brokerDocs}.</p>`
  +U.group('토큰과 보내는 방식',`<p class="caption">앱 키: <code>가상 키(읽기 전용)</code></p>`+U.select('at','접근 토큰',[['ok','받음(유효)'],['expired','만료됨'],['none','받지 않음']],'ok')+U.select('as','보내는 방식',[['paced','초당 한도에 맞춰 나눠 보냄'],['burst','한꺼번에 보냄']],'paced'))
  +U.group('주문 요청',U.number('an','주문 수(칸마다 1건)',0,40,1,4)+U.number('ap','첫 주문 가격(원, 다음 칸은 250원씩 아래)',1,1000000,1,19500)+U.number('aq','주문마다 수량(주)',0,10000,1,8)
   +U.check('ar','요청 ID 붙이기',true)+U.check('aa','마지막 요청을 한 번 더 보내기(응답이 늦었다고 보고)',false))
  +U.group('호출 횟수 계산기(직접 입력)',U.number('cm','몇 분마다',1,1440,1,15)+U.number('cp','한 번에 받는 곳 수',1,1000,1,4)+U.number('cl','하루 호출 한도',1,10000000,1,1000)),true);
 U.bind(el,()=>{
  const reqs=requests(el),cm=U.num(el,'cm',true),cp=U.num(el,'cp',true),cl=U.num(el,'cl',true);
  let calc=cm===null||cp===null||cl===null?U.problem('호출 횟수 계산기','1 이상의 정수로 넣어 주세요.'):(()=>{const c=M.callsPerDay(cm,cp);return `호출 횟수 계산기: 하루 1,440분 ÷ ${U.fmt(cm)}분 = ${U.fmt(Math.floor(1440/cm))}번, × ${U.fmt(cp)}곳 = <b>${U.fmt(c)}번</b>, 한도 ${U.fmt(cl)}번 ${U.verdict(c<=cl,'안','넘음')}.`;})();
  if(reqs===null){U.result(el,'',`${U.problem('주문 칸','주문 수·가격·수량을 정수로 넣어 주세요.')}<br>${calc}`);return;}
  const r=M.mockSend(reqs,{pace:U.value(el,'as'),token:U.value(el,'at')}),sc=M.schedule(reqs.length);
  const secs=Math.max(1,...r.log.map(x=>x.sec+1)),counts=Array.from({length:secs},(_,s)=>r.log.filter(x=>x.sec===s&&x.code==='OK').length);
  const chart=U.columns({labels:counts.map((_,s)=>`${s}초`),values:counts,fmt:v=>`${v}건`,tick:v=>U.fmt(v),label:'초 구간마다 접수된 요청 수',title:`초 구간마다 접수된 요청(한도 초당 ${S.mock.rate}건, 가상)`,h:220,ref:{value:S.mock.rate,text:'초당 한도'}});
  const table=U.table(['번호','초 구간','요청','요청 ID','응답','주문번호','통보'],r.log.map(x=>[x.k,`${x.sec}초`,`매수 ${U.fmt(x.price)}원 × ${U.fmt(x.qty)}주${x.again?' (다시 보냄)':''}`,x.rid||'없음',CODE_TEXT[x.code],x.orderNo||'—',x.notice]),'요청마다 모의 서버의 응답(가상 응답 코드)','cards');
  const last=r.log.length?r.log[r.log.length-1]:null;
  U.result(el,chart+table,`요청 ${U.fmt(r.log.length)}건: 접수 <b>${r.accepted}건</b>, 거절 ${r.rejected}건${r.log.some(x=>x.code==='SAME_ID')?', 같은 요청 ID로 돌아온 응답 1건(주문이 두 번 나가지 않음)':reqs.some(x=>x.again)?', 요청 ID 없이 다시 보낸 요청은 새 주문으로 접수됨 ✗':''}.`
   +(last?` 마지막 요청은 <b>${last.sec}초째 구간</b>(시작 뒤 ${last.sec}~${last.sec+1}초)에 나갔습니다.`:'')+` 한도에 맞춰 나눠 보내면 ${U.fmt(reqs.length)}건이 모두 나가는 데 ${U.fmt(sc.total)}초 걸립니다.`
   +`<br>${calc}<br>모의 서버의 체결 규칙(${S.mock.rule})과 초당 ${S.mock.rate}건 한도는 미리 정한 시나리오입니다. 실제 대기열과 내 주문이 가격에 주는 영향은 이 모의 서버가 보여 주지 못합니다.${U.kind(['real','scenario'])}`);
 });
};

/* ── 8장: 주문 상태와 잔고 대사 실험 ── */
const EV=[['','(없음)'],['ack','접수'],['fill','체결'],['cancelReq','취소 요청'],['cancelAck','취소 확인'],['reject','거부'],['timeout','응답 없음']];
const EV_NAME=Object.fromEntries(EV);
const START=[['ack',0],['fill',10],['',0],['',0],['',0],['',0]];
function events(el){
 const out=[];for(let k=0;k<6;k++){const t=U.value(el,'ot'+k);if(!t)continue;const q=U.num(el,'oq'+k,true);out.push({type:t,qty:t==='fill'?q:undefined,id:'e'+k});}
 if(U.checked(el,'od')){const f=[...out].reverse().find(e=>e.type!=='timeout');if(f)out.push({...f,again:true});}
 return out;
}
/* 상태 그림: 일곱 상태 상자, 지나온 상태는 굵은 테두리, 지금 상태는 ▲. */
function stateChart(hist,now){
 const pos={pendingNew:[10,40],new:[130,40],partial:[250,40],filled:[370,40],pendingCancel:[250,130],canceled:[370,130],rejected:[130,130]},seen=new Set(['pendingNew',...hist.map(h=>h.state)]);
 let s=`<path d="M100 58H128M220 58H248M340 58H368M295 76V128M340 148H368M70 76V148H128" fill="none" stroke="var(--muted)"/>`;
 for(const [k,[x,y]] of Object.entries(pos)){const on=k===now;s+=`<rect x="${x}" y="${y}" width="${k==='pendingCancel'?92:90}" height="36" rx="6" fill="var(--panel2)" stroke="${on?'var(--orange)':seen.has(k)?'var(--accent)':'var(--line)'}" stroke-width="${on?3:seen.has(k)?2:1}"/><text x="${x+45}" y="${y+23}" text-anchor="middle" class="price">${on?'▲ ':''}${M.STATES[k]}</text>`;}
 return U.svg(`주문 상태 그림: 지금 ${M.STATES[now]}`,s,190);
}
BLabs['order-recon']=el=>{
 const rows=START.map(([t,q],k)=>`<div class="ev-row">${U.select('ot'+k,`사건 ${k+1}`,EV,t)}${U.number('oq'+k,'체결 수량(주)',0,100000,1,q||0)}</div>`).join('');
 U.setup(el,U.group('주문',U.number('op','가격(원)',1,1000000,1,19000)+U.number('oqty','수량(주)',1,100000,1,10))+U.group('서버 사건의 순서(체결 수량은 체결 사건에만 씀)',rows)
  +U.group('봇과 다시 보내기',U.select('ob','봇이 장부에 적는 방식',[['naive','취소를 요청하면 0주, 전량 체결 통보만 반영'],['correct','체결 통보마다 반영하고 취소 확인의 취소 수량만 지움']],'naive')
   +U.select('or','응답 없음 뒤',[['none','다시 보내지 않음'],['blind','요청 ID 없이 다시 보냄'],['rid','같은 요청 ID로 다시 보냄'],['query','미체결·체결 조회 뒤 보냄']],'none')+U.check('od','마지막 사건을 한 번 더 받기(같은 사건 번호)',false)),true);
 U.bind(el,()=>{
  const p=U.num(el,'op',true),q=U.num(el,'oqty',true),evs=events(el);
  if(p===null||q===null||evs.some(e=>e.type==='fill'&&(e.qty===null||e.qty<1))){U.result(el,'',U.problem('주문과 체결 수량','가격과 수량은 1 이상의 정수, 체결 사건의 수량은 1주 이상으로 넣어 주세요.'));return;}
  if(!evs.length){U.result(el,'',U.problem('서버 사건','사건을 하나 이상 골라 주세요.'));return;}
  const r=M.orderFlow(p,q,evs,{bot:U.value(el,'ob'),resend:U.value(el,'or')}),o0=r.orders[0];
  const hist=U.table(['차례','사건','상태','체결','취소','미체결','나간 주문'],r.hist.map((h,i)=>[i+1,`${EV_NAME[h.ev.type]}${h.ev.type==='fill'?` ${U.fmt(h.ev.qty)}주`:''}${h.ev.again?' (같은 사건 다시)':''}`,M.STATES[h.state]||'—',`${h.filled}주`,`${h.canceled}주`,`${h.open}주`,`${h.orders}건${h.orders>1?' ✗':''}`]),'사건마다 바뀐 상태','cards');
  const ok=r.diff.shares===0&&r.diff.cash===0;
  const recon=U.table(['','주식 수','현금 변화'],[['계좌(서버가 아는 사실)',`${U.fmt(r.account.shares)}주`,W(r.account.cash)],['봇 장부',`${U.fmt(r.ledger.shares)}주`,W(r.ledger.cash)],['차이(계좌 − 장부)',`<b>${U.splus(r.diff.shares)}주</b> ${ok?'✓':'✗'}`,`<b>${W(r.diff.cash)}</b>`]],'장부와 계좌 대사','fit');
  const sum=o0.filled+o0.canceled+M.openQty(o0);
  U.result(el,stateChart(r.hist,o0.state)+hist+recon,`첫 주문: <b>${M.STATES[o0.state]}</b>, 체결 ${o0.filled}주 + 취소 ${o0.canceled}주 + 미체결 ${M.openQty(o0)}주 = ${sum}주 ${U.verdict(sum===q||o0.state==='rejected','주문 수량과 같음','주문 수량과 다름')}.${r.orders.length>1?` 응답 없음 뒤 요청 ID 없이 다시 보내 <b>주문이 ${r.orders.length}건</b> 나갔습니다 ✗.`:''}`
   +`<br>대사: 계좌 ${U.fmt(r.account.shares)}주, 장부 ${U.fmt(r.ledger.shares)}주 → 주식 수 차이 <b>${U.splus(r.diff.shares)}주</b>, 현금 차이 <b>${W(r.diff.cash)}</b>(매수 금액과 수수료). ${ok?'✓ 장부와 계좌가 맞습니다.':'✗ 장부와 계좌가 다릅니다. 체결 통보를 장부에 반영하고 취소 확인의 취소 수량만큼만 지우면 맞습니다.'}`
   +`<br>같은 사건 번호를 두 번 받으면 상태는 바뀌지 않습니다. 수수료는 살 때 금액 × 15 ÷ 100,000(버림, 가정)입니다.${U.kind(['real','scenario'])} ${U.timed('fee')}`);
 });
};
})();
