/* 1~3장 실험: 세금을 내는 네 시점, 증권거래세, 이자·배당 원천징수와 고배당 분리과세.
   계산은 TMath.stt·withholding·highDividendTax·foreignGainTax만 쓰고, 세율은 TMath.RATES에서 읽는다. */
(()=>{
'use strict';
const U=TUI,M=TMath,F=U.fmt,W=U.won0,R=M.RATES;
const w154=x=>M.floor(x*M.withholdRate());
const note=()=>`<span class="rate-note">${U.RATE_NOTE}</span><br>`;
/* 1장: 사건 네 개(산다·받는다·판다·해가 바뀐다)마다 붙는 세금과 떼는 쪽. */
const EVENTS=[['buy','산다'],['receive','받는다'],['sell','판다'],['year','해가 바뀐다']];
function timeline(kind,prin,income,gain){
 const recv=kind==='stock'?'배당소득세 15.4%':kind==='bond'?'이자소득세 15.4%':'분배금 배당소득세 15.4%',sale=prin+gain;
 const rows={buy:['살 때 붙는 세금 없음(수수료는 4권)',0,'—'],receive:[recv,w154(income),'증권사가 뗌(원천징수)']};
 if(kind==='stock'){const s=M.stt('kospi',sale);rows.sell=[`증권거래세 ${W(s.tax)} + 농어촌특별세 ${W(s.rural)} · 소액주주라 양도세 없음`,s.each,'증권사가 뗌'];}
 if(kind==='kequity')rows.sell=['ETF라 거래세 없음 · 국내주식형이라 차익 비과세',0,'—'];
 if(kind==='kother')rows.sell=['차익에 배당소득세 15.4% · ETF라 거래세 없음',w154(gain),'증권사가 뗌(원천징수)'];
 if(kind==='foreign')rows.sell=['팔 때는 떼지 않음 · 차익은 해가 바뀐 뒤 신고',0,'—'];
 if(kind==='bond')rows.sell=['가격 몫은 개인에게 비과세(보도 기준) · 채권 매도의 거래세는 확인 못함, 0으로 둠',0,'—'];
 const total=income+(kind==='kother'?gain:0),over=total>R.threshold;
 rows.year=kind==='foreign'?[`양도소득세: (차익 − 250만 원) × 22% · 다음 해 5월 본인 신고`,M.foreignGainTax(gain).tax,'본인이 신고']:[over?'이자·배당 합계가 2,000만 원을 넘어 넘는 몫은 종합과세(5장)':'이자·배당 합계가 2,000만 원 이하라 더 낼 세금 없음',0,over?'본인이 신고':'—'];
 return rows;
}
function timelineChart(rows,pick){
 let s=`<text x="12" y="18" class="series">투자 한 건의 네 사건 · ▲ 고른 사건</text><path d="M30 92H450" stroke="var(--line)" stroke-width="2"/>`;
 EVENTS.forEach(([k,name],i)=>{const x=40+i*136,on=k===pick,tax=rows[k][1];s+=`<rect x="${x}" y="60" width="116" height="64" rx="8" fill="var(--panel2)" stroke="${on?'var(--accent)':'var(--line)'}" stroke-width="${on?2.5:1}"/><text x="${x+58}" y="84" text-anchor="middle" class="mark-t">${on?'▲ ':''}${name}</text><text x="${x+58}" y="108" text-anchor="middle" class="axis">${tax?W(tax):'0원'}</text>`;});
 return U.svg(`네 사건의 세금: ${EVENTS.map(([k,n])=>`${n} ${W(rows[k][1])}`).join(', ')}`,s,150);
}
TLabs['tax-map']=el=>{
 U.setup(el,U.select('mprod','상품',Object.keys(U.PRODUCTS).map(k=>[k,`${U.pname(k)} (${U.PRODUCTS[k][1]})`]),'stock')+U.number('mprin','산 금액 (원)',0,10000000000,10000,10000000)+U.number('mincome','받은 배당·분배금·이자 합계 (원)',0,1000000000,1000,200000)+U.number('mgain','판 차익 (원)',0,10000000000,1000,1248640,'손해를 본 매도는 2장에서')+U.select('mevent','자세히 볼 사건',EVENTS,'receive')+`<div class="buttons" aria-label="사건 단추">${EVENTS.map(([k,n])=>`<button type="button" data-event="${k}">${n}</button>`).join('')}</div>`);
 el.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>{const x=el.querySelector('#mevent');x.value=b.dataset.event;x.dispatchEvent(new Event('change',{bubbles:true}));});
 U.bind(el,()=>{
  const kind=U.value(el,'mprod'),prin=U.num(el,'mprin'),income=U.num(el,'mincome'),gain=U.num(el,'mgain'),pick=U.value(el,'mevent');
  if(prin===null)return U.result(el,'',U.problem('산 금액','0 이상의 원 단위 숫자를 넣어야 합니다.'));
  if(income===null)return U.result(el,'',U.problem('받은 돈','0 이상의 원 단위 숫자를 넣어야 합니다.'));
  if(gain===null)return U.result(el,'',U.problem('판 차익','0 이상의 원 단위 숫자를 넣어야 합니다.'));
  const rows=timeline(kind,prin,income,gain),list=EVENTS.filter(([k])=>rows[k][1]>0),total=list.reduce((s,[k])=>s+rows[k][1],0),name=EVENTS.find(([k])=>k===pick)[1];
  const tbl=U.table(['사건','붙는 세금','금액','떼는 쪽'],EVENTS.map(([k,n])=>[(k===pick?'▲ ':'')+n,rows[k][0],`<b>${W(rows[k][1])}</b>`,rows[k][2]]),`${U.pname(kind)} · 받은 돈 ${W(income)}, 차익 ${W(gain)}`);
  U.result(el,timelineChart(rows,pick)+tbl,`${note()}<b>${U.pname(kind)}</b>: “${name}”에서 붙는 세금은 ${rows[pick][0]}이고 <b>${W(rows[pick][1])}</b>입니다.${rows[pick][2]==='—'?'':` 떼는 쪽: ${rows[pick][2]}.`}<br>네 사건을 모두 지나면 세금은 <b>${list.length}번</b> 빠지고 합계 <b>${W(total)}</b>입니다${list.length?`(${list.map(([k,n])=>`${n} ${W(rows[k][1])}`).join(', ')})`:''}. 어떤 세금을 내는지는 사건이 정하고, 떼는 쪽은 원천징수가 있는지가 정합니다.${U.kind(['real','news'],kind==='bond'?'채권 매도의 거래세는 확인하지 못해 0으로 두었습니다.':'수수료는 0으로 두었습니다(4권 #cost).')}`);
 });
};
/* 2장: 증권거래세. 시장 × 매도 금액 × 1년 매도 횟수. */
const MARKETS=[['kospi','코스피'],['kosdaq','코스닥'],['konex','코넥스'],['etf','국내 상장 ETF']];
TLabs.stt=el=>{
 U.setup(el,U.select('smarket','시장',MARKETS,'kospi')+U.number('samt','한 번 매도 금액 (원)',0,10000000000,10000,10000000)+U.number('stimes','1년 매도 횟수 (번)',0,500,1,1,'손익과 상관없이 매도할 때마다 붙습니다'));
 U.bind(el,()=>{
  const mk=U.value(el,'smarket'),amt=U.num(el,'samt'),n=U.num(el,'stimes');
  if(amt===null)return U.result(el,'',U.problem('매도 금액','0 이상의 원 단위 숫자를 넣어야 합니다.'));
  if(n===null||!Number.isInteger(n))return U.result(el,'',U.problem('매도 횟수','0에서 500 사이의 정수를 넣어야 합니다.'));
  const t=M.stt(mk,amt,n),name=MARKETS.find(m=>m[0]===mk)[1],all=MARKETS.map(([k])=>M.stt(k,amt,n).total);
  const chart=U.columns({labels:MARKETS.map(m=>m[1].replace('국내 상장 ','')),values:all,mark:i=>MARKETS[i][0]===mk,fmt:v=>`${F(v)}원`,tick:v=>F(v),title:`1년 거래세 합계 · 한 번 ${F(amt)}원 × ${F(n)}번`,label:`시장별 1년 거래세: ${MARKETS.map((m,i)=>`${m[1]} ${W(all[i])}`).join(', ')}`});
  const one=mk==='kospi'?`거래세 ${W(t.tax)} + 농어촌특별세 ${W(t.rural)} = <b>${W(t.each)}</b>`:mk==='etf'?'<b>0원</b>(ETF를 팔 때는 거래세가 없습니다)':`<b>${W(t.each)}</b>`;
  U.result(el,chart,`${note()}${name}에서 ${W(amt)}을 한 번 팔면 ${one}입니다(매도 금액의 ${U.rp(t.rate,2)}).<br>1년에 ${F(n)}번 팔면 <b>${W(t.total)}</b>입니다. 이 금액은 손익이 0이든 손해든 같습니다. 세금이 수익이 아니라 매도 금액에 붙기 때문입니다.${U.kind(['real','news'],'2026-01-01 양도분부터의 세율입니다. 수수료는 넣지 않았습니다(4권 #cost).')}`);
 });
};
/* 3장: 원천징수 14% + 1.4%, 고배당 기업 배당 분리과세(구간 14·20·25·30%, 지방소득세 별도). */
const WKINDS=[['interest','예금·채권 이자'],['dividend','주식 배당'],['distribution','ETF 분배금']];
function withholdChart(amount,t){const parts=[['입금액',t.net,'var(--accent)'],['소득세',t.income,'var(--orange)'],['지방소득세',t.local,'var(--blue)']];
 return U.columns({labels:parts.map(p=>p[0]),values:parts.map(p=>p[1]),colors:parts.map(p=>p[2]),fmt:v=>`${F(v)}원`,tick:v=>F(v),title:`세전 ${F(amount)}원이 나뉘는 곳`,h:230,label:`세전 ${W(amount)}: 입금 ${W(t.net)}, 소득세 ${W(t.income)}, 지방소득세 ${W(t.local)}`});}
TLabs.withhold=el=>{
 U.setup(el,U.select('wkind','받은 돈의 종류',WKINDS,'dividend')+U.number('wamt','세전 금액 (원)',0,100000000000,1000,200000)+U.check('whigh','고배당 기업 배당으로 분리과세 (새벽전자가 요건을 채웠다고 가정)',false,'2026~2028년에 받는 배당, 보도 기준'));
 U.bind(el,()=>{
  const k=U.value(el,'wkind'),amt=U.num(el,'wamt'),high=U.checked(el,'whigh');
  if(amt===null)return U.result(el,'',U.problem('세전 금액','0 이상의 원 단위 숫자를 넣어야 합니다.'));
  const t=M.withholding(amt),name=WKINDS.find(x=>x[0]===k)[1];
  let more='';
  if(high&&k!=='dividend')more=`<br>✗ 고배당 기업 분리과세는 요건을 채운 기업의 <b>배당</b>에만 고를 수 있어 ${name}에는 적용하지 않았습니다.`;
  else if(high){const h=M.highDividendTax(amt);more=`<br>고배당 기업 배당 분리과세를 고르면: ${h.parts.map(p=>`${F(p.from/10000)}만~${F(p.to/10000)}만 원 ${U.rp(p.rate,0)}`).join(' + ')} → 소득세 <b>${W(h.tax)}</b>(지방소득세 별도). ${amt<=R.highDividend[0][0]?'2,000만 원까지는 원천징수와 같은 14%라 차이가 없습니다.':'2,000만 원을 넘는 몫은 다른 소득과 합치지 않고 구간 세율로 끝납니다.'}`;}
  U.result(el,withholdChart(amt,t),`${note()}${name} <b>${W(amt)}</b>에서 소득세 14% ${W(t.income)}과 지방소득세 1.4% ${W(t.local)}을 증권사·은행이 먼저 떼어 <b>${W(t.net)}</b>이 들어옵니다. 한 해 이자·배당 합계가 2,000만 원 이하면 세금은 이것으로 끝나고, 다음 해에 따로 신고하지 않습니다.${more}${U.kind(['real','news'],high?'고배당 기업 요건은 가정이며, ETF·펀드 분배금이 대상에서 빠지는지는 확인 못함입니다.':'')}`);
 });
};
})();
