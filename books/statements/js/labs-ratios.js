/* 6~7장 실험: 세 재무제표로 비율 열한 개 계산하기(평균·기말 분모, ROE 셋으로 나누기, 다른 회사의 안정성 비율),
   발생액 비율 계산과 경보 1,000건 세기. 계산은 SMath.ratios·stability·dupont·accrualRatio·accrualParts·alarm만 쓴다.
   발생액 비율 (순이익 − 영업현금흐름) ÷ 평균 총자산과 "영업현금흐름이 순이익보다 적으면 더 확인할 신호"라는 기준은 이 책의 단순화다. */
(()=>{
'use strict';
const U=SUI,M=SMath,E=U.ek,N=U.n1,P=U.pct;
const YEAR=y=>{const s=M.saebyeok();return y==='2025'?{open:s.y2024.close,lk:s.y2025}:{open:M.OPENING,lk:s.y2024};};
const stabIn=y=>{const {lk}=YEAR(y),t=lk.totals;return {so:lk.is.op,si:lk.is.interestExpense,sl:t.liabilities,se:t.equity,sca:t.currentAssets,scl:t.currentLiabilities};};
const STAB=[['so','영업이익'],['si','이자비용'],['sl','부채'],['se','자본'],['sca','유동자산'],['scl','유동부채']];
/* ROE를 순이익률 × 총자산회전율 × 자기자본승수 네 칸으로 그린다. */
function dupontArt(d){
 const box=(x,title,val)=>`<rect x="${x}" y="40" width="96" height="70" rx="8" fill="var(--panel2)" stroke="var(--line)"/><text x="${x+48}" y="66" text-anchor="middle" class="axis">${title}</text><text x="${x+48}" y="94" text-anchor="middle" class="price">${val}</text>`;
 const op=(x,s)=>`<text x="${x}" y="82" text-anchor="middle" class="series">${s}</text>`;
 const s=`<text x="10" y="22" class="series">ROE를 셋으로 나누기 (듀폰 분해)</text>`+box(6,'순이익률',P(d.margin,2))+op(114,'×')+box(124,'자산회전',U.times(d.turnover,'회',2))+op(232,'×')+box(242,'자본승수',U.times(d.leverage,'배',2))+op(350,'=')+box(360,'ROE',P(d.roe));
 return U.svg(`ROE ${P(d.roe)} = 순이익률 ${P(d.margin,2)} × 총자산회전율 ${U.fmt(d.turnover,2)}회 × 자기자본승수 ${U.fmt(d.leverage,2)}배`,s,130);
}
SLabs['ratio-table']=el=>{
 U.setup(el,U.select('ryear','사업연도',[['2024','2024'],['2025','2025']],'2024')+U.select('rden','ROE·ROA·회전율의 분모',[['avg','평균 (기초 + 기말) ÷ 2'],['end','기말']],'avg')+U.select('rgroup','보일 비율 묶음',[['all','셋 모두'],['profit','수익성'],['stability','안정성'],['activity','활동성']],'all')+U.number('rshift','자본 대신 부채로 조달한 금액 (억 원, 듀폰 칸만)',0,500,1,0,'이자 변화는 무시하는 이 책의 단순화')+`<fieldset class="cards"><legend>다른 회사 숫자로 안정성 비율 셋 (억 원)</legend>${STAB.map(([id,n])=>U.number(id,n,0,100000,0.1,stabIn('2024')[id])).join('')}</fieldset>`);
 U.bind(el,e=>{
  if(e&&e.type==='change'&&e.target.id==='ryear')U.fill(el,stabIn(U.value(el,'ryear')));
  const y=U.value(el,'ryear'),den=U.value(el,'rden'),grp=U.value(el,'rgroup'),shift=U.num(el,'rshift'),st=Object.fromEntries(STAB.map(([id])=>[id,U.num(el,id)]));
  if(shift===null)return U.result(el,'',U.problem('부채로 조달한 금액','0에서 500 사이의 숫자(억 원)를 넣어야 합니다.'));
  const bad=STAB.find(([id])=>st[id]===null);if(bad)return U.result(el,'',U.problem(bad[1],'0에서 100,000 사이의 숫자(억 원)를 넣어야 합니다.'));
  const {open,lk}=YEAR(y),is=lk.is,c=lk.close,ct=lk.totals,r=M.ratios(open,c,is,lk.cf.cfo),end=den==='end';
  let other,d;
  try{other=M.stability({op:st.so,interest:st.si,liabilities:st.sl,equity:st.se,currentAssets:st.sca,currentLiabilities:st.scl});}catch(err){return U.result(el,'',U.problem('다른 회사 숫자',U.why(err)+' 이자비용·자본·유동부채는 0보다 커야 합니다.'));}
  const A=end?ct.assets:r.avgAssets,Q=end?ct.equity:r.avgEquity;
  if(shift>=Q)return U.result(el,'',U.problem('부채로 조달한 금액',`${end?'기말':'평균'} 자본 ${E(Q)}보다 작아야 합니다.`));
  d=M.dupont(is.ni,is.sales,A,Q-shift);
  const rows=[
   ['profit','영업이익률','영업이익 ÷ 매출',P(r.opMargin)],['profit','순이익률','순이익 ÷ 매출',P(r.netMargin,2)],['profit','ROE',`순이익 ÷ ${end?'기말':'평균'} 자본`,`<b>${P(end?r.roeEnd:r.roeAvg)}</b>`],['profit','ROA',`순이익 ÷ ${end?'기말':'평균'} 총자산`,P(end?is.ni/ct.assets:r.roa)],
   ['stability','부채비율','부채 ÷ 자본 (기말)',P(r.debtRatio)],['stability','유동비율','유동자산 ÷ 유동부채 (기말)',P(r.currentRatio)],['stability','이자보상배율','영업이익 ÷ 이자비용',U.times(r.interestCover)],
   ['activity','매출채권회전율',`매출 ÷ ${end?'기말':'평균'} 매출채권`,U.times(end?is.sales/c.ar:r.arTurnover,'회',2)],['activity','매출채권 회전일수','기말 매출채권 ÷ 매출 × 365',U.times(r.arDays,'일')],['activity','재고자산회전율',`매출원가 ÷ ${end?'기말':'평균'} 재고`,U.times(end?is.cogs/c.inv:r.invTurnover,'회',2)],['activity','재고 회전일수','기말 재고 ÷ 매출원가 × 365',U.times(r.invDays,'일')]];
  const G={profit:'수익성',stability:'안정성',activity:'활동성'},shown=rows.filter(x=>grp==='all'||x[0]===grp).map(([g,n,def,v])=>[G[g],n,def,v]);
  const tab2=U.table(['비율','계산','값'],[['이자보상배율','영업이익 ÷ 이자비용',`<b>${U.times(other.interestCover)}</b>`],['부채비율','부채 ÷ 자본',`<b>${P(other.debtRatio)}</b>`],['유동비율','유동자산 ÷ 유동부채',`<b>${P(other.currentRatio)}</b>`]],'입력한 회사의 안정성 비율');
  const text=`새벽전자 ${y}년(${end?'기말':'평균'} 분모): 영업이익률 <b>${P(r.opMargin)}</b>, 순이익률 ${P(r.netMargin,2)}, ROE <b>${P(end?r.roeEnd:r.roeAvg)}</b>, 부채비율 <b>${P(r.debtRatio)}</b>, 유동비율 ${P(r.currentRatio)}, 이자보상배율 <b>${U.times(r.interestCover)}</b>, 매출채권 회전일수 <b>${U.times(r.arDays,'일')}</b>, 재고 회전일수 ${U.times(r.invDays,'일')}입니다.<br>ROE = 순이익률 ${P(d.margin,2)} × 총자산회전율 ${U.fmt(d.turnover,2)}회 × 자기자본승수 ${U.fmt(d.leverage,2)}배 = <b>${P(d.roe)}</b>${shift?`(자본 ${E(shift)}을 부채로 바꾼 경우, 이자 변화는 무시)`:''}입니다.<br>입력한 회사의 안정성 비율은 이자보상배율 <b>${U.times(other.interestCover)}</b>, 부채비율 <b>${P(other.debtRatio)}</b>, 유동비율 <b>${P(other.currentRatio)}</b>입니다.${U.kind(['real','scenario'],'평균은 (기초 + 기말) ÷ 2, 매출채권회전율은 외상 매출을 나누지 않고 전체 매출로 계산한 단순화입니다.')}`;
  U.result(el,dupontArt(d)+U.table(['묶음','비율','정의','값'],shown,`새벽전자 ${y}년 비율 (${end?'기말':'평균'} 분모)`)+tab2,text);
 });
};
/* 7장: 발생액 비율과 경보 세기. 격자는 회사 1,000개를 40 × 25칸에 차례로 칠한다(기대 개수를 반올림해 칠함). */
const PARTS=y=>{const {open,lk}=YEAR(y),c=lk.close;return {dAR:M.r1(c.ar-open.ar),dInv:M.r1(c.inv-open.inv),dAP:M.r1(c.ap-open.ap),dep:lk.dep};};
const QIN=y=>{const {open,lk}=YEAR(y);return {qni:lk.is.ni,qcfo:lk.cf.cfo,qavg:M.r1((M.totals(open).assets+lk.totals.assets)/2)};};
function grid(a){
 const n=[Math.round(a.tp),Math.round(a.bad)-Math.round(a.tp),Math.round(a.fp)],cols=40,cw=11,ch=7,X=20,Y=34;n.push(Math.max(0,1000-n[0]-n[1]-n[2]));
 const C=['var(--orange)','var(--muted)','var(--blue)','var(--panel2)'],NAMES=['문제·경보','문제·경보 없음','정상·경보','정상·경보 없음'];
 let s=`<text x="10" y="18" class="series">회사 1,000개 (한 칸 = 한 회사)</text>`,k=0;
 n.forEach((cnt,ci)=>{let left=cnt;while(left>0){const row=Math.floor(k/cols),col=k%cols,run=Math.min(left,cols-col);s+=`<rect x="${X+col*cw}" y="${Y+row*ch}" width="${run*cw-1}" height="${ch-1}" fill="${C[ci]}"${ci===3?' stroke="var(--line)" stroke-width=".5"':''}/>`;k+=run;left-=run;}});
 NAMES.forEach((nm,i)=>{const x=i%2?250:20,y=Y+25*ch+22+Math.floor(i/2)*20;s+=`<rect x="${x}" y="${y-10}" width="12" height="12" fill="${C[i]}" stroke="var(--line)"/><text x="${x+18}" y="${y}" class="axis">${nm} ${U.fmt(n[i])}</text>`;});
 return U.svg(`회사 1,000개 가운데 문제·경보 ${n[0]}, 문제·경보 없음 ${n[1]}, 정상·경보 ${n[2]}, 정상·경보 없음 ${n[3]}`,s,Y+25*ch+64);
}
SLabs['accrual-alarm']=el=>{
 U.setup(el,`<fieldset class="step"><legend>1단계 · 발생액 비율</legend>${U.select('qyear','새벽전자 사업연도로 채우기',[['2024','2024'],['2025','2025']],'2024')}${U.number('qni','순이익 (억 원)',-10000,10000,0.1,136)}${U.number('qcfo','영업활동 현금흐름 (억 원)',-10000,10000,0.1,156)}${U.number('qavg','평균 총자산 (억 원)',1,100000,0.1,1103)}</fieldset><fieldset class="step"><legend>2단계 · 회사 1,000개에서 경보 세기</legend>${U.number('qbase','기저율: 실제로 문제가 있는 회사 비율 (%)',0,100,0.1,3)}${U.number('qhit','적중률: 문제 회사에서 경보가 울릴 확률 (%)',0,100,0.1,80)}${U.number('qfalse','오경보율: 정상 회사에서 경보가 울릴 확률 (%)',0,100,0.1,10)}</fieldset>`);
 U.bind(el,e=>{
  if(e&&e.type==='change'&&e.target.id==='qyear')U.fill(el,QIN(U.value(el,'qyear')));
  const nm={qni:'순이익',qcfo:'영업활동 현금흐름',qavg:'평균 총자산',qbase:'기저율',qhit:'적중률',qfalse:'오경보율'},v=Object.fromEntries(Object.keys(nm).map(k=>[k,U.num(el,k)])),bad=Object.keys(nm).find(k=>v[k]===null);
  if(bad)return U.result(el,'',U.problem(nm[bad],`${U.fmt(el.querySelector('#'+bad).min)}에서 ${U.fmt(el.querySelector('#'+bad).max)} 사이의 숫자를 넣어야 합니다.`));
  const y=U.value(el,'qyear'),ratio=M.accrualRatio(v.qni,v.qcfo,v.qavg),cn=v.qni?v.qcfo/v.qni:null,a=M.alarm(v.qbase/100,v.qhit/100,v.qfalse/100);
  const same=Object.entries(QIN(y)).every(([k,x])=>M.r1(x)===M.r1(v[k])),p=PARTS(y),pa=M.accrualParts(p),signal=v.qcfo<v.qni;
  const parts=same?U.columns({labels:['매출채권|증가','재고|증가','매입채무|증가(−)','감가상각|(−)','순이익 −|영업현금'],values:[p.dAR,p.dInv,-p.dAP,-p.dep,pa.gap],mark:i=>i===4,fmt:v=>N(v),title:`${y}년 순이익과 영업현금흐름의 차이를 만든 줄`,twoLine:true,h:250,label:`매출채권 증가 ${E(p.dAR)}, 재고 증가 ${E(p.dInv)}, 매입채무 증가 ${E(p.dAP)}, 감가상각 ${E(p.dep)}, 차이 ${E(pa.gap)}`}):'<p class="caption chart-note">직접 넣은 숫자라 차이를 만든 줄의 내역은 그리지 않습니다. 사업연도를 다시 고르면 그 해의 내역이 나옵니다.</p>';
  const share=same&&pa.gap>0?` 차이 ${E(pa.gap)} 가운데 매출채권·재고 증가가 ${E(pa.arInv)}(${P(pa.share,0)})입니다.`:same?` 차이는 ${E(pa.gap)}이고, 매출채권·재고 증가는 ${E(pa.arInv)}입니다.`:'';
  const t2=U.table(['','경보 울림','경보 안 울림','합계'],[['실제 문제',N(a.tp),N(M.r1(a.bad-a.tp)),N(a.bad)],['정상',N(a.fp),N(M.r1(a.good-a.fp)),N(a.good)],['합계',`<b>${N(a.alarms)}</b>`,N(M.r1(1000-a.alarms)),'1,000']],'회사 1,000개와 경보 표 (기대 개수)');
  const text=`영업현금흐름 ÷ 순이익 = <b>${cn===null?'순이익이 0이라 계산하지 않음':U.sfmt(cn,2)}</b>, 발생액 비율 = (${N(v.qni)} − ${v.qcfo<0?`(${N(v.qcfo)})`:N(v.qcfo)}) ÷ ${N(v.qavg)} = <b>${P(ratio)}</b>입니다.${share} <span class="${signal?'is-bad':'is-ok'}">${signal?'▲ 위험 신호 있음: 영업현금흐름이 순이익보다 적어 더 확인할 신호입니다':'위험 신호 없음: 영업현금흐름이 순이익 이상입니다'}</span>(판정이 아니라 더 확인할 신호).<br>회사 1,000개에 기저율 ${U.fmt(v.qbase,1)}%면 실제 문제 ${N(a.bad)}개, 경보는 적중 ${N(a.tp)} + 오경보 ${N(a.fp)} = <b>${N(a.alarms)}건</b>이고, 경보가 울린 회사 가운데 실제 문제 비율은 <b>${a.precision===null?'경보가 없어 계산하지 않음':P(a.precision)}</b>입니다. ${U.ADVICE_NOTE}${U.kind(['real','scenario','simple'],'발생액 비율의 정의와 신호 기준, 적중률·오경보율은 이 책의 단순화와 가정입니다. 격자는 기대 개수를 반올림해 칠합니다.')}`;
  U.result(el,parts+grid(a)+t2,text);
 });
};
})();
