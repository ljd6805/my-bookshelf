/* 8~9장 실험: 결산일과 보고서 종류로 제출 기한 계산하고 감사의견별 거래소 조치 확인하기, 제조·유통·소프트웨어 회사의 회전일수와 유형자산 비중 나란히 계산하기.
   계산은 SMath.deadline·auditAction·industryRow·industryTable만 쓴다. 기한 일수와 조치 문구는 SMath.RULES 한 곳에서 읽고, 출처 등급(RULES.grade)을 결과에 붙인다.
   DART 화면 구성도는 어디에서 무엇을 찾는지만 보이는 시각적 비유이며 실제 회사의 숫자는 없다. */
(()=>{
'use strict';
const U=SUI,M=SMath,E=U.ek,N=U.n1;
const KINDS=[['annual','사업보고서 (사업연도 끝 + 90일)'],['half','반기보고서 (반기 끝 + 45일)'],['quarter','분기보고서 (분기 끝 + 45일)']];
const OPS=[['unqualified','적정'],['qualifiedScope','한정 · 감사범위 제한 (처음)'],['qualifiedScopeAgain','한정 · 감사범위 제한 (관리종목 상태에서 다시)'],['qualifiedOther','한정 · 감사범위 제한이 아닌 사유'],['adverse','부적정'],['disclaimer','의견거절']];
const GRADE={official:'official',news:'guide',unknown:'unknown'};
/* DART 공시 유형 구성도: 고른 보고서와 감사보고서에 ▲ 표시. */
function dartMap(kind){
 const t=(x,y,s,c='axis',a='middle')=>`<text x="${x}" y="${y}" text-anchor="${a}" class="${c}">${s}</text>`,box=(x,y,w,label,on)=>`<rect x="${x}" y="${y}" width="${w}" height="30" rx="6" fill="${on?'var(--panel2)':'var(--chart)'}" stroke="${on?'var(--accent)':'var(--line)'}" stroke-width="${on?2.5:1}"/>`+t(x+w/2,y+20,(on?'▲ ':'')+label,on?'price':'axis');
 const pick={annual:0,half:1,quarter:2}[kind];
 let s=t(10,20,'DART 공시 유형 (화면 구성도)','series','start')+box(16,36,200,'정기공시',false)+box(264,36,200,'외부감사관련',false);
 ['사업보고서','반기보고서','분기보고서'].forEach((n,i)=>{s+=`<path d="M60 66V${92+i*40}H70" stroke="var(--line)" fill="none"/>`+box(70,78+i*40,146,n,i===pick);});
 ['감사보고서','연결감사보고서'].forEach((n,i)=>{s+=`<path d="M308 66V${92+i*40}H318" stroke="var(--line)" fill="none"/>`+box(318,78+i*40,146,n,i===0);});
 s+=t(318,180,'감사의견은 감사보고서에','axis','start')+t(318,198,'숫자의 근거는 주석에','axis','start');
 return U.svg('DART 공시 유형 구성도: 정기공시 아래 사업·반기·분기보고서, 외부감사관련 아래 감사보고서와 연결감사보고서',s,210);
}
SLabs['filing-deadline']=el=>{
 U.setup(el,`<p class="rate-banner"><b>${U.RULE_NOTE}</b></p>`+U.date('dend','기간 끝 날짜 (결산일·반기 끝·분기 끝)','2024-12-31')+U.select('dkind','보고서 종류',KINDS,'annual')+U.select('dop','감사의견 (유가증권시장)',OPS,'unqualified','코스닥·이의신청·개선기간은 다루지 않습니다'));
 U.bind(el,()=>{
  const end=U.day(el,'dend'),kind=U.value(el,'dkind'),op=U.value(el,'dop');
  if(end===null)return U.result(el,'',U.problem('기간 끝 날짜','2000-01-01에서 2099-12-31 사이의 실제 날짜를 골라야 합니다.'));
  const d=M.deadline(end,kind),a=M.auditAction(op),name=KINDS.find(k=>k[0]===kind)[1].split(' (')[0],opName=OPS.find(o=>o[0]===op)[1];
  const src=kind==='annual'?'한국거래소 안내 원문':'회계법인 안내(2012), 공식 원문·현행 여부 확인 못함';
  const rows=[[name,end,`${d.days}일`,`<b>${d.date}</b>`,`${d.weekday}요일${d.weekend?' ▲ 주말':''}`,src],['감사의견에 따른 조치',opName,'—',`<b>${a.action}</b>`,'—','한국거래소 안내 원문 (유가증권시장)']];
  const text=`${end} + ${d.days}일 = <b>${d.date}(${d.weekday})</b>까지 ${name}${U.josa(name,'을','를')} 냅니다.${d.weekend?` <strong>▲ 기한이 ${d.weekday}요일입니다. 휴일 처리 확인 못함</strong>(다음 영업일로 미뤄지는지 확인하지 못했습니다).`:''}${kind==='annual'?` 연장신고를 하면 ${M.RULES.extensionBizDays}영업일 안에서 늘릴 수 있습니다(한국거래소 안내).`:''}<br>감사의견 “${opName}” → <b>${a.action}</b>.${/사실 확인일/.test(a.action)?' 사실 확인일은 그 감사의견이 확인된 날입니다(이 책의 풀이, 안내에 뜻이 적혀 있지 않아 정확한 기준일 확인 못함). 관리종목은 상장을 유지하는 데 문제가 될 사유가 생겨 거래소가 따로 표시해 둔 종목입니다(이 책의 풀이, 규정의 정의 원문 확인 못함).':''}${U.kind([...new Set([GRADE[d.grade],...(d.weekend?['unknown']:[]),'official','real'])],`날짜 더하기는 실제 계산입니다. ${kind==='annual'?'90일':'45일'} 기한의 출처 등급: ${src}. 조치 문구는 ${a.market} 기준(확인 ${a.checked}).`)}`;
  U.result(el,dartMap(kind)+U.table(['항목','입력','법정 일수','기한·조치','요일','출처 등급'],rows,'제출 기한과 감사의견에 따른 조치')+`<p class="caption chart-note">위 구성도는 DART에서 어디를 누르면 무엇이 나오는지 보이는 시각적 비유이며, 실제 회사의 숫자는 담지 않았습니다.</p>`,text);
 });
};
/* 9장: 업종 비교. 고른 가상 회사(유통·소프트웨어)의 값을 바꿀 수 있고, 새벽전자는 세 재무제표 모델에서 계산한 값을 쓴다. */
const NAMES={saebyeok:'새벽전자(제조)',retail:'가상의 유통 회사',software:'가상의 소프트웨어 회사'},SHORT={saebyeok:'새벽전자',retail:'유통',software:'소프트웨어'};
const turn=x=>x===null?'재고 없음':`${U.fmt(x,Number.isInteger(M.r1(x*100)/100)?0:2)}회`,days=x=>x===null?'재고 없음':U.times(x,'일');
const inputsOf=k=>{if(k==='saebyeok'){const y=M.saebyeok().y2024;return {nsales:y.is.sales,ncogs:y.is.cogs,ninv:y.close.inv,nar:y.close.ar,nppe:M.r1(y.close.ppe/y.totals.assets*1000)/10};}const c=M.INDUSTRY[k];return {nsales:c.sales,ncogs:c.cogs,ninv:c.invClose,nar:c.arClose,nppe:c.ppeShare*100};};
SLabs['industry-compare']=el=>{
 U.setup(el,U.select('nfocus','값을 바꿀 회사',[['retail',NAMES.retail],['software',NAMES.software],['saebyeok',NAMES.saebyeok+' · 모델 값, 바꿀 수 없음']],'retail')+`<fieldset class="cards"><legend>고른 가상 회사의 값</legend>${U.number('nsales','매출 (억 원)',1,100000,1,2000)+U.number('ncogs','매출원가 (억 원)',0,100000,1,1600)+U.number('ninv','재고자산 (억 원, 기초 = 기말 가정)',0,100000,1,100)+U.number('nar','기말 매출채권 (억 원)',0,100000,1,50)+U.number('nppe','유형자산 비중 (%, 총자산 대비)',0,100,0.1,30)}</fieldset>`);
 const IDS=['nsales','ncogs','ninv','nar','nppe'],NM={nsales:'매출',ncogs:'매출원가',ninv:'재고자산',nar:'기말 매출채권',nppe:'유형자산 비중'};
 U.bind(el,e=>{
  const focus=U.value(el,'nfocus');if(e&&e.type==='change'&&e.target.id==='nfocus')U.fill(el,inputsOf(focus));
  IDS.forEach(id=>{el.querySelector('#'+id).disabled=focus==='saebyeok';});
  const v=Object.fromEntries(IDS.map(id=>[id,U.num(el,id)])),bad=IDS.find(id=>v[id]===null);
  if(bad)return U.result(el,'',U.problem(NM[bad],`${el.querySelector('#'+bad).min}에서 ${U.fmt(el.querySelector('#'+bad).max)} 사이의 숫자를 넣어야 합니다.`));
  if(v.ninv>0&&v.ncogs===0)return U.result(el,'',U.problem('매출원가','재고가 있는데 매출원가가 0이면 재고 회전일수를 계산할 수 없습니다.'));
  const T=M.industryTable(),row=k=>focus===k?M.industryRow({name:NAMES[k],sales:v.nsales,cogs:v.ncogs,invOpen:v.ninv,invClose:v.ninv,arClose:v.nar,ppeShare:v.nppe/100}):T[k],R={saebyeok:T.saebyeok,retail:row('retail'),software:row('software')},K=Object.keys(R);
  const groups=[{title:'재고 회전일수 (일, 기말 재고 ÷ 매출원가 × 365)',rows:K.map(k=>[SHORT[k],R[k].invDays,days(R[k].invDays),focus===k])},{title:'매출채권 회전일수 (일, 기말 매출채권 ÷ 매출 × 365)',rows:K.map(k=>[SHORT[k],R[k].arDays,days(R[k].arDays),focus===k])},{title:'유형자산 비중 (%, 유형자산 ÷ 총자산)',rows:K.map(k=>[SHORT[k],R[k].ppeShare*100,U.pct(R[k].ppeShare),focus===k])}];
  const maxD=Math.max(100,...K.flatMap(k=>[R[k].invDays||0,R[k].arDays]));
  const chart=U.hbars({groups,max:[maxD,maxD,100],label:K.map(k=>`${NAMES[k]}: 재고 ${days(R[k].invDays)}, 매출채권 ${days(R[k].arDays)}, 유형자산 ${U.pct(R[k].ppeShare)}`).join('; ')});
  const rows=K.map(k=>[(focus===k?'▲ ':'')+NAMES[k],turn(R[k].invTurnover),days(R[k].invDays),days(R[k].arDays),U.pct(R[k].ppeShare)]);
  const text=`${K.map(k=>`${NAMES[k]}: 재고자산회전율 <b>${turn(R[k].invTurnover)}</b>, 재고 회전일수 <b>${days(R[k].invDays)}</b>, 매출채권 회전일수 <b>${days(R[k].arDays)}</b>, 유형자산 비중 ${U.pct(R[k].ppeShare)}`).join('<br>')}<br>업종마다 재고와 매출채권, 설비가 차지하는 몫이 달라 같은 숫자를 같은 잣대로 읽을 수 없습니다. 같은 회사의 다른 해, 같은 업종 회사끼리 견주고, 비율의 정의(평균·기말, 매출·매출원가)를 맞춥니다.${U.kind(['real','scenario'],'유통·소프트웨어 회사의 숫자는 미리 정한 가상 시나리오이고, 두 회사의 영업이익은 정하지 않았습니다. 재고는 기초와 기말이 같다고 놓았습니다.')}`;
  U.result(el,chart+U.table(['회사','재고자산회전율','재고 회전일수','매출채권 회전일수','유형자산 비중'],rows,'제조·유통·소프트웨어 비교'),text);
 });
};
})();
