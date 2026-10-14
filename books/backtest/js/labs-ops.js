/* 9·10장 실험: 봇 멈춤 조건 시험 실험(9장)과 모의 서버·백테스트 체결 차이 기록 실험(10장).
   계산은 BMath.stopCheck·lossLimit·parseRequests·STOP_LOGS·monitorDays·alerts·matchFills·parseFills만 쓴다.
   9장 기본값은 “평소의 하루”, 계좌 300만 원·손실 2%·주문 20건(L2의 8건·확인 문제의 500만 원·1.5%와 다름).
   10장은 모의 서버 운용 앞 20거래일까지만 열고(60일 전체는 마지막 과제), 기본값은 첫 5일이다. 직접 입력 예제는 L2의 체결 넷과 다르다.
   멈춤 조건은 “이 기록에서 몇 번째 요청에 걸린다”를 계산하는 예이며, 그 조건이 실제 사고를 막는다고 쓰지 않는다. */
(()=>{
'use strict';
const U=BUI,M=BMath,S=BData.SCENARIO;
const W=x=>`${U.splus(x)}원`;
const COND={loss:'하루 손실 한도',count:'주문 수 한도',same:'같은 칸 미체결·보유 중복 검사',hold:'보유 한도',recon:'장 시작 전 대사 불일치',delay:'시세 지연'};
function reqText(r){return `${r.side==='B'?'매수':'매도'} ${r.cell<1000?`칸 ${r.cell}`:`${U.fmt(r.cell)}원 칸`} ${U.fmt(r.qty)}주${r.resend?' (요청 ID 없이 다시 보냄)':''}${r.later?' · 아직 체결 없음':r.fill!=null?` · ${U.fmt(r.fill)}원에 체결`:''}`;}
function conditions(el){
 const cap=U.num(el,'kc',true),lp=U.num(el,'kl'),cn=U.num(el,'kn',true),hd=U.num(el,'kh',true),dl=U.num(el,'kd');
 if([cap,lp,cn,hd,dl].some(v=>v===null))return null;
 return {cap,lp,c:{loss:U.checked(el,'kL')?M.lossLimit(cap,lp):null,count:U.checked(el,'kN')?cn:null,same:U.checked(el,'kS'),hold:U.checked(el,'kH')?hd:null,recon:U.checked(el,'kR'),delay:U.checked(el,'kD')?dl:null}};
}
function scenario(el){
 const k=U.value(el,'ks');if(k!=='direct'){U.flag(el.querySelector('#kt'),'');return M.STOP_LOGS[k];}
 const p=M.parseRequests(U.value(el,'kt'));U.flag(el.querySelector('#kt'),p?'':'B·S와 칸 번호를 쉼표로 나눠 넣어 주세요');if(!p)return null;
 return {label:'직접 입력(아직 체결 없음)',mark0:0,held:{},requests:p.requests.map(r=>({...r,cell:r.cell,later:true}))};
}
const EXCHANGE=[['가격제한폭','종목 가격이 하루에 움직일 수 있는 폭','시장 전체 · 종목','4권 #limits'],['변동성 완화장치(VI)','짧은 시간에 크게 움직인 종목을 잠시 단일가 매매로','종목','4권 #limits'],['서킷브레이커','지수가 크게 떨어지면 시장 전체 매매를 멈춤','시장 전체','4권 #limits'],['봇의 멈춤 조건','내 봇의 주문 기록·손익·대사','내 계좌 하나','이 장']];
BLabs['stop-rules']=el=>{
 U.setup(el,U.group('주문 기록',U.select('ks','가상 주문 기록',[['normal','평소의 하루'],['dup','밤사이 같은 칸 세 번'],['crash','급락한 하루'],['direct','직접 입력']],'normal')
   +U.text('kt','직접 입력(B·S와 칸 번호, 쉼표로 나눔)','B4, B5, B6, B7','“직접 입력”을 고르면 씁니다. 모두 아직 체결되지 않은 요청으로 봅니다'))
  +U.group('멈춤 조건(켜고 값 바꾸기)',U.number('kc','계좌 금액(원)',1,1000000000,1,S.capital)+U.check('kL','하루 손실 한도 켜기',true)+U.number('kl','하루 손실 한도(계좌의 %)',0.1,100,0.1,2)
   +U.check('kN','주문 수 한도 켜기',true)+U.number('kn','하루(밤사이) 주문 수 한도(건)',1,1000,1,20)+U.check('kS','같은 칸 미체결·보유 중복 검사 켜기',true)
   +U.check('kH','보유 한도 켜기',true)+U.number('kh','보유 한도(주)',1,100000,1,128,'16칸 × 8주')+U.check('kR','장 시작 전 대사 불일치 켜기',true)+U.check('kD','시세 지연 켜기',true)+U.number('kd','시세 지연 한도(초)',1,600,1,5)),true);
 U.bind(el,()=>{
  const cc=conditions(el),sc=scenario(el);
  if(!cc){U.result(el,'',U.problem('조건 칸','숫자를 범위 안으로 넣어 주세요.'));return;}
  if(!sc){U.result(el,'',U.problem('직접 입력','B2, S3처럼 방향(B·S)과 칸 번호를 쉼표로 나눠 넣어 주세요.'));return;}
  const r=M.stopCheck(sc,cc.c),on=Object.keys(COND).filter(k=>k==='same'||k==='recon'?cc.c[k]:cc.c[k]!=null);
  const rows=r.rows.map(x=>x.check?['—','장 시작 전 대사',`계좌 ${x.acct}주 · 장부 ${x.ledger}주 ${x.acct===x.ledger?'✓':'✗'}`,'—','—']:x.open!=null?['—',`아침 시가 ${U.fmt(x.open)}원(남은 주문 체결)`,`계좌 ${x.acct}주 · 장부 ${x.ledger}주`,'—','—']
   :[`${x.n}번째`,reqText(x.r),`계좌 ${x.acct}주 · 장부 ${x.ledger}주`,W(x.pnl),x.why.length?x.why.map(w=>`▲ ${COND[w]}`).join(', '):'—']);
  const log=U.table(['요청','내용','주식 수','그때 손익','걸린 조건'],rows,`${sc.label}: 요청마다 조건 판정`,'cards');
  const sum=U.table(['조건','보는 값','처음 걸린 요청','그때 손익'],on.map(k=>[COND[k],k==='loss'?`손실 ${U.fmt(cc.c.loss)}원`:k==='count'?`${cc.c.count}건 넘음`:k==='hold'?`장부 ${cc.c.hold}주 넘음`:k==='delay'?`${cc.c.delay}초 넘음`:k==='same'?'같은 칸 미체결·보유':'계좌 ≠ 장부',r.hit[k]?`<b>${r.hit[k].n}번째</b>`:'걸리지 않음',r.hit[k]?W(r.hit[k].pnl):'—']),'조건마다 처음 걸린 자리','cards');
  const ex=U.table(['장치','보는 것','범위','자세히'],EXCHANGE,'거래소 장치와 봇의 멈춤 조건','cards');
  U.result(el,sum+log+ex,`${sc.label}: 요청 ${r.count}건. ${r.first?`가장 먼저 걸린 조건은 <b>${COND[r.first.cond]}</b>, <b>${r.first.n}번째 요청</b>(그때 손익 ${W(r.first.pnl)}).`:'✓ 켜 둔 조건이 하나도 걸리지 않았습니다.'}`
   +`<br>하루 손실 한도: 계좌 ${U.fmt(cc.cap)}원 × ${U.sfmt(cc.lp,1)}% = <b>${U.fmt(M.lossLimit(cc.cap,cc.lp))}원</b>. 끝에 계좌 ${r.acct}주, 장부 ${r.ledger}주${r.acct!==r.ledger?' ✗':''}, 손익 ${W(r.pnl)}.`
   +`<br>조건은 요청을 보내기 직전에 봅니다. 이 계산은 이 기록에서 조건이 몇 번째 요청에 걸리는지 보여 줄 뿐, 그 조건이 실제 사고를 막는다는 뜻이 아닙니다. 거래소 장치는 시장 전체나 종목을 멈추고, 봇의 조건은 내 계좌 하나를 멈춥니다.${U.kind(['real','scenario'])}`);
 });
};

/* ── 10장: 모의 서버·백테스트 체결 차이 기록 실험 ── */
function directPart(el){
 const q=U.num(el,'fq',true),bt=M.parseFills(U.value(el,'fb')),mk=M.parseFills(U.value(el,'fm'));
 if(q===null)return U.problem('주식 수','1 이상의 정수로 넣어 주세요.');
 U.flag(el.querySelector('#fb'),bt?'':'B·S, 칸, 체결 가격을 넣어 주세요');U.flag(el.querySelector('#fm'),mk?'':'B·S, 칸, 체결 가격을 넣어 주세요');
 if(!bt||!mk)return U.problem('체결 목록','줄마다(또는 ;로 나눠) “B 19000 18950”처럼 방향, 칸, 체결 가격을 넣어 주세요.');
 const m=M.matchFills(mk,bt,q);
 return `직접 입력: 백테스트 체결 ${m.btFills}건, 모의 서버 체결 ${m.mockFills}건 → 맞음 ${m.matched} · 놓침 ${m.missed} · 더 생김 ${m.extra}, 체결률 <b>${m.rate==null?'계산 못함(백테스트 체결 0건)':U.pct(m.rate,2)}</b>, 맞은 체결의 가격 차이 합계 <b>${W(m.priceDiff)}</b>((모의 서버 가격 − 백테스트 가격) × ${U.fmt(q)}주).`;
}
BLabs['fill-match']=el=>{
 U.setup(el,U.range('fd','모의 서버 운용 첫 며칠(이 장은 20거래일까지)',1,20,1,5)
  +U.group('경보 기준',U.number('fr','그날 체결률이 몇 % 아래면',1,100,1,80)+U.number('fn','그런 날이 며칠 연속이면',1,20,1,3)+U.number('fc','누적 차이가 계좌의 몇 %를 넘으면',0.01,100,0.01,0.5)+U.check('fk','대사 차이(주식 수) ≠ 0이면 그날',true))
  +U.group('직접 입력: 같은 날의 두 체결 목록',U.number('fq','체결마다 주식 수',1,100000,1,8)+U.text('fb','백테스트 체결(줄은 ;로 나눔)','B 19500 19500; S 19500 19750','B·S, 칸(그 칸의 매수 가격), 체결 가격')+U.text('fm','모의 서버 체결','B 19500 19500')),true);
 U.bind(el,()=>{
  const d=+U.value(el,'fd'),rows=M.monitorDays(d),last=rows[rows.length-1],th=[U.num(el,'fr'),U.num(el,'fn',true),U.num(el,'fc')];
  const al=th.some(v=>v===null)?null:M.alerts(rows,{rate:th[0]/100,runs:th[1],cum:th[2],recon:U.checked(el,'fk')});
  const WHY={recon:'대사 차이',rate:'체결률이 연속으로 낮음',cum:'누적 차이가 기준을 넘음'};
  const t=U.table(['날(번째 거래일)','백테스트','모의 서버','맞음','놓침','더 생김','가격 차이','누적 손익 차이','대사 차이'],rows.map(r=>[`${r.day+1}번째`,`${r.btFills}건`,`${r.mockFills}건`,r.matched,r.missed?`${r.missed} ✗`:0,r.extra?`${r.extra} ▲`:0,W(r.priceDiff),`<b>${W(r.diffPnl)}</b>`,r.recon?`${r.recon}주 ✗`:'0']),`첫 ${d}거래일의 짝짓기(같은 날·같은 칸·같은 방향이면 맞음)`,'cards');
  const chart=U.xy({series:[{name:'누적 손익 차이(모의 서버 − 백테스트)',pts:rows.map(r=>[r.day+1,r.diffPnl]),color:'var(--accent)',marks:rows.map((_,i)=>i),shape:'●'}],refs:[{y:0,text:'0원'}],xmin:1,xmax:Math.max(2,d),xlabel:'번째 거래일',ylabel:'원',ytick:v=>U.sfmt(v),h:270,label:`첫 ${d}거래일의 누적 손익 차이`});
  U.result(el,chart+t,`첫 ${d}거래일: 모의 서버 ${W(last.mockPnl)}, 같은 기간 백테스트(4장 현실 가정) ${W(last.btPnl)}, 누적 차이 <b>${W(last.diffPnl)}</b>. 백테스트 체결 ${last.cumBt}건, 모의 서버 체결 ${last.cumMock}건 가운데 맞음 ${last.cumMatched}건, 체결률 <b>${U.pct(last.cumRate,2)}</b>.`
   +`<br>${th.some(v=>v===null)?U.problem('경보 기준','숫자를 범위 안으로 넣어 주세요.'):al?`▲ 처음 경보가 울린 날: <b>${al.day+1}번째 거래일</b>(${al.why.map(w=>WHY[w]).join(', ')}). 경보는 조사를 시작할 때를 알려 줄 뿐 원인을 알려 주지 않습니다.`:'✓ 이 기간에는 경보가 울리지 않았습니다.'}`
   +`<br>11번째 거래일의 중복 매수는 체결 짝짓기가 아니라 대사 차이 칸에만 적습니다. 이 장은 모의 서버 운용 앞 20거래일까지만 엽니다.<br>${directPart(el)}<br>모의 서버의 체결 규칙(${S.mock.rule})은 미리 정한 시나리오입니다.${U.kind(['real','scenario'])}`);
 });
};
})();
