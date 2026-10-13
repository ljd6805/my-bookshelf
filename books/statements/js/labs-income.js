/* 3~4장 실험: 매출액·매출원가율·판매비와관리비·이자비용·법인세율로 단계별 이익 계산하기, 순이익에서 영업활동 현금흐름까지 조정 단계별 막대 그림 그리기.
   계산은 SMath.incomeStatement·change·linkedYear(간접법 조정 줄은 cfoBridge가 만든다)만 쓴다. 원가율·판매비와관리비율·세율은 이 책의 가정이다. */
(()=>{
'use strict';
const U=SUI,M=SMath,E=U.ek,N=U.n1;
/* 3장: 단계별 이익. 판매비와관리비는 매출 비례(%)와 고정 금액 가운데 하나를 쓴다. */
SLabs['income-steps']=el=>{
 U.setup(el,U.number('isales','매출액 (억 원)',0,100000,1,1500)+U.number('icogs','매출원가율 (%)',0,100,0.1,70,'이 책의 가정은 70%')+U.select('isgamode','판매비와관리비 계산 방식',[['rate','매출 비례 (매출의 %)'],['fixed','고정 금액 (억 원)']],'rate')+U.number('isgarate','판매비와관리비율 (%, 매출 비례일 때)',0,100,0.1,18)+U.number('isgafix','판매비와관리비 (억 원, 고정일 때)',0,100000,1,270)+U.number('iint','이자비용 (억 원)',0,10000,0.1,12,'사채 200 × 5.0% + 단기차입금 50 × 4%')+U.number('itax','법인세율 (%, 가정)',0,100,1,20,'실제 세율이 아닌 이 책의 가정. 손실이면 0'));
 const base=M.incomeStatement();
 U.bind(el,()=>{
  const fixed=U.value(el,'isgamode')==='fixed';el.querySelector('#isgarate').disabled=fixed;el.querySelector('#isgafix').disabled=!fixed;
  el.querySelector('#isgarate').closest('.control').classList.toggle('dim',fixed);el.querySelector('#isgafix').closest('.control').classList.toggle('dim',!fixed);
  const v=Object.fromEntries(['isales','icogs','isgarate','isgafix','iint','itax'].map(k=>[k,U.num(el,k)]));
  const names={isales:'매출액',icogs:'매출원가율',isgarate:'판매비와관리비율',isgafix:'판매비와관리비',iint:'이자비용',itax:'법인세율'};
  const bad=Object.keys(v).find(k=>v[k]===null&&!(k==='isgarate'&&fixed)&&!(k==='isgafix'&&!fixed));
  if(bad)return U.result(el,'',U.problem(names[bad],`${el.querySelector('#'+bad).min}에서 ${U.fmt(el.querySelector('#'+bad).max)} 사이의 숫자를 넣어야 합니다.`));
  const s=M.incomeStatement({sales:v.isales,cogsRate:v.icogs/100,...(fixed?{sga:v.isgafix}:{sgaRate:v.isgarate/100}),interestExpense:v.iint,taxRate:v.itax/100});
  const ch=M.change(base.op,s.op),margin=s.opMargin===null?'매출이 0이라 계산하지 않음':U.pct(s.opMargin);
  const chart=U.columns({labels:['매출','매출총이익','영업이익','세전이익','순이익'],values:[s.sales,s.gross,s.op,s.pretax,s.ni],mark:i=>i===2,fmt:v=>N(v),title:`단계별 이익 (억 원) · ▲영업이익률 ${margin}`,h:250,label:`매출 ${E(s.sales)}, 매출총이익 ${E(s.gross)}, 영업이익 ${E(s.op)}, 세전이익 ${E(s.pretax)}, 순이익 ${E(s.ni)}`});
  const rows=[['매출',N(s.sales),'—'],['− 매출원가',N(s.cogs),`매출 × ${U.fmt(v.icogs,1)}%`],['= 매출총이익',`<b>${N(s.gross)}</b>`,''],['− 판매비와관리비',N(s.sga),fixed?'고정 금액':`매출 × ${U.fmt(v.isgarate,1)}%`],['= 영업이익',`<b>${N(s.op)}</b>`,`영업이익률 ${margin}`],['− 이자비용 + 이자수익',`${N(s.interestExpense)} · ${N(s.interestIncome)}`,'이자수익 2는 가정'],['= 세전이익',`<b>${N(s.pretax)}</b>`,''],['− 법인세',N(s.tax),`세전이익 × ${U.fmt(v.itax)}%${s.pretax<0?' (손실이라 0)':''}`],['= 당기순이익',`<b>${N(s.ni)}</b>`,'']];
  U.result(el,chart+U.table(['줄','억 원','계산'],rows,'손익계산서 (억 원)'),`매출 ${N(s.sales)} − 매출원가 ${N(s.cogs)} = 매출총이익 <b>${E(s.gross)}</b>, 판매비와관리비 ${N(s.sga)}${U.josa(N(s.sga),'을','를')} 빼면 영업이익 <b>${E(s.op)}</b>(영업이익률 <b>${margin}</b>)입니다. 이자비용 ${N(s.interestExpense)}${U.josa(N(s.interestExpense),'을','를')} 빼고 이자수익 ${N(s.interestIncome)}${U.josa(N(s.interestIncome),'을','를')} 더하면 세전이익 <b>${E(s.pretax)}</b>, 법인세 ${N(s.tax)}${U.josa(N(s.tax),'을','를')} 빼면 당기순이익 <b>${E(s.ni)}</b>입니다.<br>2024년 영업이익 ${E(base.op)}과 비교하면 <b>${U.ppct(ch)}</b> 변했습니다${s.sales!==base.sales&&s.sales>0?` (매출은 ${U.ppct(M.change(base.sales,s.sales))})`:''}. 감가상각비는 매출원가와 판매비와관리비 안에 들어 있습니다.${U.kind(['real','scenario'],'원가율·판매비와관리비율·이자수익·법인세율은 이 책의 가정입니다.')}`);
 });
};
/* 4장: 간접법 조정 단계별 막대. 조정 줄을 켜고 끄며, 투자·재무까지 이어 재무상태표의 현금과 대조한다. */
const ADJ=['감가상각 더하기','매출채권 증가 빼기','재고 증가 빼기','매입채무 증가 더하기'];
const yearOf=y=>{const s=M.saebyeok();return y==='2025'?{open:s.y2024.close,input:M.YEARS[2025]}:{open:M.OPENING,input:M.YEARS[2024]};};
const deltas=y=>{const {open,input}=yearOf(y);return {cdar:M.r1(input.ar-open.ar),cdinv:M.r1(input.inv-open.inv),cdap:M.r1(input.ap-open.ap)};};
SLabs['cfo-bridge']=el=>{
 U.setup(el,U.select('cyear','사업연도',[['2024','2024 (기초 2023년 말)'],['2025','2025 (기초 2024년 말)']],'2024','바꾸면 아래 세 증가액이 그해 값으로 바뀝니다')+U.number('cdar','매출채권 증가 (억 원)',-1000,1000,1,30)+U.number('cdinv','재고자산 증가 (억 원)',-1000,1000,1,20)+U.number('cdap','매입채무 증가 (억 원)',-1000,1000,1,10)+`<fieldset class="cards"><legend>켜 둘 조정 줄</legend>${ADJ.map((n,i)=>U.check('con'+(i+1),n,true)).join('')}</fieldset>`+U.check('clink','투자활동·재무활동까지 이어 현금과 대조하기',true));
 U.bind(el,e=>{
  if(e&&e.type==='change'&&e.target.id==='cyear')U.fill(el,deltas(U.value(el,'cyear')));
  const y=U.value(el,'cyear'),{open,input}=yearOf(y),d={cdar:U.num(el,'cdar'),cdinv:U.num(el,'cdinv'),cdap:U.num(el,'cdap')},on=[true,...[1,2,3,4].map(i=>U.checked(el,'con'+i))],link=U.checked(el,'clink');
  const nm={cdar:'매출채권 증가',cdinv:'재고자산 증가',cdap:'매입채무 증가'},bad=Object.keys(d).find(k=>d[k]===null);
  if(bad)return U.result(el,'',U.problem(nm[bad],'−1,000에서 1,000 사이의 숫자(억 원)를 넣어야 합니다.'));
  let lk;try{lk=M.linkedYear(open,{...input,ar:M.r1(open.ar+d.cdar),inv:M.r1(open.inv+d.cdinv),ap:M.r1(open.ap+d.cdap)});}catch(err){return U.result(el,'',U.problem('증가액',`기말 잔액이 0보다 작아집니다(기초 매출채권 ${N(open.ar)}, 재고 ${N(open.inv)}, 매입채무 ${N(open.ap)}).`));}
  let run=0;const used=lk.cf.steps.map((s,i)=>({...s,on:on[i]})),bars=[];
  used.forEach((s,i)=>{if(!s.on)return;run=M.r1(run+s.value);bars.push([['순이익','+감가|상각','−매출|채권','−재고','+매입|채무'][i],run,['순이익','감가상각을 더한 뒤','매출채권 증가를 뺀 뒤','재고 증가를 뺀 뒤','매입채무 증가를 더한 뒤'][i]]);});
  const cfo=run,full=lk.cf.cfo,cf=lk.cf;
  const nOp=bars.length;if(link)bars.push(['투자|활동 뒤',M.r1(cfo+cf.cfi),'투자활동 뒤'],['재무|활동 뒤',M.r1(cfo+cf.cfi+cf.cff),'재무활동 뒤']);
  const net=M.r1(cfo+cf.cfi+cf.cff),ok=M.r1(open.cash+net)===lk.close.cash;
  const chart=U.columns({labels:bars.map(b=>b[0]),values:bars.map(b=>b[1]),mark:i=>i===used.filter(s=>s.on).length-1,fmt:v=>N(v),vtext:(v,i)=>i>=nOp?`누적 ${N(v)}`:N(v),title:`조정 단계별 누적 (억 원) · ▲영업활동 ${N(cfo)}`,twoLine:true,h:260,label:bars.map(b=>`${b[2]} 누적 ${E(b[1])}`).join(', ')});
  const path=used.map((s,i)=>i===0?`순이익 <b>${N(s.value)}</b>`:s.on?`${s.value>=0?'+':'−'} ${s.label} ${N(Math.abs(s.value))}`:`(${s.label} 줄은 꺼 둠)`).join(' ');
  const steps=used.filter(s=>s.on).reduce((a,s)=>{a.t=M.r1(a.t+s.value);a.list.push(N(a.t));return a;},{t:0,list:[]}).list.join(' → ');
  const rows=used.map((s,i)=>[i?s.label:'당기순이익',s.on?U.splus(s.value,Number.isInteger(s.value)?0:1):'꺼 둠',s.on?N(used.slice(0,i+1).filter(x=>x.on).reduce((t,x)=>M.r1(t+x.value),0)):'—']);
  rows.push(['영업활동 현금흐름',`<b>${N(cfo)}</b>`,N(cfo)],['투자활동 (설비투자)',N(cf.cfi),N(M.r1(cfo+cf.cfi))],[`재무활동 (배당 ${N(cf.dividend)}${cf.borrow?`, 단기차입 +${N(cf.borrow)}`:''})`,`${N(cf.cff)}`,N(net)],[`현금 증감 (기초 ${N(open.cash)} → 기말 ${N(M.r1(open.cash+net))})`,`<b>${U.splus(net,Number.isInteger(net)?0:1)}</b>`,'—']);
  const tie=link?`<br>투자활동 ${N(cf.cfi)}, 재무활동 ${N(cf.cff)}${cf.borrow?`(배당 ${N(cf.dividend)}, 단기차입 +${N(cf.borrow)})`:''}${U.josa(cf.borrow?'차입':N(cf.cff),'을','를')} 더하면 현금 증감 <b>${U.sek(net)}</b>, 기초 현금 ${N(open.cash)} → ${E(M.r1(open.cash+net))}입니다. 재무상태표 ${y}년 말 현금 ${E(lk.close.cash)}과 대조: ${ok?'✓ 맞음':`✗ 어긋남 · 꺼 둔 조정 줄 때문에 ${E(M.r1(full-cfo))}만큼 모자라거나 남습니다`}.`:'<br>투자·재무를 잇지 않아 아직 재무상태표의 현금과 대조하지 않았습니다.';
  U.result(el,chart+U.table(['줄','금액','누적'],rows,`${y}년 현금흐름표 (간접법, 억 원)`),`${path} = 영업활동 현금흐름 <b>${E(cfo)}</b>. 단계별 누적은 ${steps}입니다.${cfo!==full?` 모든 조정을 켜면 ${E(full)}입니다.`:''}${tie}${U.kind(['real','scenario'],'이자 지급은 영업활동, 배당 지급은 재무활동에 둔 이 책의 선택이고, 법인세는 그해에 모두 낸다고 놓았습니다.')}`);
 });
};
})();
