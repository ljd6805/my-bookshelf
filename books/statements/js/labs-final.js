/* 10장 마지막 과제: 2025 사업연도 값으로 세 재무제표를 맞추고, 두 해를 견주어 신호·근거·확인 시점 표를 채운다.
   계산은 SMath.saebyeok·linkedYear·ratios·change·interestEstimate·finalTask만 쓴다. 2025년 기말 매출채권과 2026년 단기차입금 금리만 바꿀 수 있다.
   신호 기준(영업현금흐름 < 0, 매출채권 회전일수 10일 넘게 증가, 단기차입금 증가, 이자보상배율 1배 미만)은 판정이 아니라 더 확인할 신호이며 이 책의 단순화다. */
(()=>{
'use strict';
const U=SUI,M=SMath,E=U.ek,N=U.n1,P=U.pct;
const VIEWS=[['both','2024와 2025 나란히'],['2025','2025만'],['2024','2024만']];
const signal=(on,name,why,when)=>[`${on?'▲ 위험 신호 있음':'위험 신호 없음'} · ${name}`,why,when];
function compute(ar,rate){
 const s=M.saebyeok(),a=s.y2024,b=M.linkedYear(a.close,{...M.YEARS[2025],ar}),ra=M.ratios(M.OPENING,a.close,a.is,a.cf.cfo),rb=M.ratios(a.close,b.close,b.is,b.cf.cfo);
 const interest=M.interestEstimate(M.ASSUME.bond,M.ASSUME.bondRate,b.close.std,rate),dl=M.finalTask().deadlines;
 return {a,b,ra,rb,ni:M.change(a.is.ni,b.is.ni),cash:M.change(a.close.cash,b.close.cash),interest,cover:b.is.op/interest,dl};
}
/* 결론이 바뀌는 조건: 독자마다 이 브라우저에만 남긴다. 저장소가 막힌 환경(사생활 보호 창 등)에서는 저장 없이 그대로 쓴다. */
const NOTE_KEY='bookshelf:statements:v1:final-notes';
function notes(el){
 const boxes=[1,2,3].map(i=>el.querySelector('#fnote'+i));
 try{const saved=JSON.parse(localStorage.getItem(NOTE_KEY)||'[]');if(Array.isArray(saved))boxes.forEach((b,i)=>{b.value=typeof saved[i]==='string'?saved[i]:'';});}catch(e){}
 boxes.forEach(b=>b.addEventListener('input',()=>{try{localStorage.setItem(NOTE_KEY,JSON.stringify(boxes.map(x=>x.value)));}catch(e){}}));
}
const clearSig=el=>{el.querySelector('[data-signals]').innerHTML='<p>입력을 고치면 신호 표가 다시 나옵니다.</p>';};
SLabs['final-check']=el=>{
 U.setup(el,`<p class="rate-banner"><b>${U.ADVICE_NOTE}</b><br>${U.RULE_NOTE}</p>`+U.select('fview','보는 해',VIEWS,'both')+U.number('far','2025년 기말 매출채권 (억 원)',0,2000,1,430,'본문 값 430. 바꾸면 2025년 세 재무제표를 다시 맞춥니다')+U.number('frate','2026년 단기차입금 금리 (%, 가정)',0,20,0.1,4,'사채 200억 원 × 5.0%는 그대로')+`<fieldset class="cards"><legend>결론이 바뀌는 조건 적어 두기 (이 브라우저에만 남고 다른 사람에게 보이지 않음)</legend>${[1,2,3].map(i=>`<label class="control" for="fnote${i}"><span>조건 ${i}</span><textarea id="fnote${i}" rows="2" placeholder="예: 1분기 매출채권이 ○○○억 원 아래로 줄면"></textarea></label>`).join('')}</fieldset><details class="fs-more fs-signals"><summary>신호·근거·확인 시점 표 펼치기</summary><div data-signals></div></details>`);
 notes(el);
 U.bind(el,()=>{
  const ar=U.num(el,'far'),rate=U.num(el,'frate'),view=U.value(el,'fview');
  if(ar===null)return clearSig(el),U.result(el,'',U.problem('2025년 기말 매출채권','0에서 2,000 사이의 숫자(억 원)를 넣어야 합니다.'));
  if(rate===null)return clearSig(el),U.result(el,'',U.problem('2026년 단기차입금 금리','0에서 20 사이의 숫자(%)를 넣어야 합니다.'));
  const c=compute(ar,rate/100),{a,b,ra,rb,dl}=c,gap=M.r1(b.is.ni-b.cf.cfo),show=y=>view==='both'||view===y;
  const line=(name,x,y,more='')=>[name,...(show('2024')?[x]:[]),...(show('2025')?[`<b>${y}</b>`]:[]),more];
  const rows=[line('순이익',E(a.is.ni),E(b.is.ni),U.ppct(c.ni)),line('기말 현금',E(a.close.cash),E(b.close.cash),U.ppct(c.cash)),line('영업활동 현금흐름',E(a.cf.cfo),E(b.cf.cfo),`순이익과 차이 ${E(gap)}`),line('영업현금흐름 ÷ 순이익',U.sfmt(ra.cfoToNi,2),U.sfmt(rb.cfoToNi,2)),line('매출채권 회전일수',U.times(ra.arDays,'일'),U.times(rb.arDays,'일')),line('재고 회전일수',U.times(ra.invDays,'일'),U.times(rb.invDays,'일')),line('발생액 비율',P(ra.accrualRatio),P(rb.accrualRatio),U.pp(rb.accrualRatio-ra.accrualRatio)),line('단기차입금',E(a.close.std),E(b.close.std),b.cf.borrow?`2025년 차입 ${E(b.cf.borrow)}`:'2025년 차입 없음'),line('이자보상배율',U.times(ra.interestCover),U.times(rb.interestCover),`2026 추정 ${U.times(c.cover)}`)];
  const head=['항목',...(show('2024')?['FY2024']:[]),...(show('2025')?['FY2025']:[]),'변화·비고'];
  const sig=[signal(b.cf.cfo<0&&b.is.ni>0,'순이익은 났는데 영업현금흐름이 음수',`순이익 ${E(b.is.ni)}, 영업현금흐름 ${E(b.cf.cfo)}`,`2026 1분기 보고서(${dl.q1.date}까지)의 누적 영업현금흐름`),signal(rb.arDays-ra.arDays>10,'매출채권 회전일수가 10일 넘게 늘어남',`${U.times(ra.arDays,'일')} → ${U.times(rb.arDays,'일')}`,`1분기(${dl.q1.date})·반기(${dl.half.date}) 보고서의 매출채권`),signal(b.close.std>a.close.std,'단기차입금이 늘어남',`${E(a.close.std)} → ${E(b.close.std)}`,`반기보고서(${dl.half.date}까지)의 차입금 주석`),signal(c.cover<1,'2026 추정 이자보상배율이 1배 미만',`이자비용 ${E(c.interest)}, ${U.times(c.cover)}`,`2026 사업보고서(${dl.annual.date}까지)`)];
  const hz=[['(가) 2026년 4월','2025 사업보고서 공시 직후 (미리 정한 가상 시나리오)','두 해 연간 숫자: 영업현금흐름, 매출채권, 단기차입금'],['(나) 2026 1분기·반기',`1분기 보고서 <b>${dl.q1.date}(${dl.q1.weekday})</b>, 반기보고서 <b>${dl.half.date}(${dl.half.weekday})</b>, 3분기 ${dl.q3.date}(${dl.q3.weekday}, 휴일 처리 확인 못함)`,'매출채권이 줄며 현금으로 들어오는지, 누적 영업현금흐름, 단기차입금'],['(다) 2026 사업연도',`2026 사업보고서 <b>${dl.annual.date}(${dl.annual.weekday})</b>`,`이자비용 ${E(c.interest)}(추정), 이자보상배율 ${U.times(c.cover)}`]];
  const chart=U.columns({labels:['순이익|2024','순이익|2025','영업현금|2024','영업현금|2025','현금|2024','현금|2025','단기차입|2024','단기차입|2025'],values:[a.is.ni,b.is.ni,a.cf.cfo,b.cf.cfo,a.close.cash,b.close.cash,a.close.std,b.close.std],mark:i=>i%2===1,colors:[0,1,2,3,4,5,6,7].map(i=>i%2?'var(--accent)':'var(--blue)'),fmt:v=>N(v),title:'FY2024와 ▲FY2025 (억 원)',twoLine:true,h:270,vw:640,label:`순이익 ${N(a.is.ni)} → ${N(b.is.ni)}, 영업현금흐름 ${N(a.cf.cfo)} → ${N(b.cf.cfo)}, 기말 현금 ${N(a.close.cash)} → ${N(b.close.cash)}, 단기차입금 ${N(a.close.std)} → ${N(b.close.std)}`});
  const ok=b.checks.every(x=>x.ok),t=b.totals;
  const text=`2025 사업연도에 순이익은 ${E(a.is.ni)} → <b>${E(b.is.ni)}</b>(<b>${U.ppct(c.ni)}</b>), 기말 현금은 ${E(a.close.cash)} → <b>${E(b.close.cash)}</b>(<b>${U.ppct(c.cash)}</b>)입니다. 영업활동 현금흐름 ${N(a.cf.cfo)} → <b>${E(b.cf.cfo)}</b>, 순이익과의 차이 <b>${E(gap)}</b>, 매출채권 회전일수 ${U.times(ra.arDays,'일')} → <b>${U.times(rb.arDays,'일')}</b>, 단기차입금 ${N(a.close.std)} → <b>${E(b.close.std)}</b>(차입 전 현금 ${E(b.cf.cashBeforeBorrow)}에서 ${E(b.cf.borrow)} 차입).<br>2025 대조: ${N(b.close.re)} · ${N(b.close.cash)} · ${N(b.close.ppe)} · <b>${N(t.assets)} = ${N(t.liabilities)} + ${N(t.equity)}</b> ${ok?'네 줄 모두 ✓ 맞음':'✗ 어긋난 줄이 있음'}.<br>2026 이자비용 추정: 사채 ${E(M.ASSUME.bond)} × 5.0% + 단기차입금 ${E(b.close.std)} × ${U.fmt(rate,1)}% = <b>${E(c.interest)}</b>, 이자보상배율 ${U.times(rb.interestCover)} → <b>${U.times(c.cover)}</b>.<br>확인 시점: 1분기 보고서 <b>${dl.q1.date}</b>, 반기보고서 <b>${dl.half.date}</b>, 2026 사업보고서 <b>${dl.annual.date}</b>까지. ${sig.filter(x=>x[0].startsWith('▲')).length}개 항목에 위험 신호 있음(판정이 아니라 더 확인할 신호). 학습용 계산, 투자 권유 아님.${U.kind(['real','scenario','simple','guide'],'반기·분기 45일 기한은 회계법인 안내 기준이고 휴일 처리는 확인하지 못했습니다. 신호 기준은 이 책의 단순화입니다.')}`;
  el.querySelector('[data-signals]').innerHTML=U.table(['신호','근거 숫자','다음에 확인할 곳과 시점'],sig,'신호·근거·확인 시점',true);
  U.result(el,chart+U.table(head,rows,'두 해 비교')+U.checkList(b.checks,'2025 대조 네 줄')+U.table(['시점','확인할 것','보고서와 기한'],hz.map(([a,b,c])=>[a,c,b]),'확인 시점 세 가지',true),text);
 });
};
})();
