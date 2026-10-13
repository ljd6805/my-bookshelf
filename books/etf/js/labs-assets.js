/* 7~8장 실험: 기초자산별 iNAV와 복제 방식별 위험(두 단계), 기초자산·상장 시장으로 과세 유형 가리기.
   계산은 EMath.navFromIndex·bondMove·foreignInav·riskTable·taxType. 세율은 EMath.RULES.tax에서만 읽는다(금액 계산은 11권).
   해외 iNAV 식(전날 NAV × 환율 변화 × 선물 변화)과 금 현물 ETF를 금 가격 변화 하나로 둔 것은 이 책의 단순화다. */
(()=>{
'use strict';
const U=EUI,M=EMath,F=U.fmt,W=U.won0;
const ASSETS=[['kstock','누리200 (국내 주식)'],['bond','누리 국채3년 (국채)'],['gold','금 현물 ETF (금)'],['foreign','누리 해외100 (해외 지수)']];
const TIMES=[['day','10:30 · 한국 정규장'],['night','23:30 · 한국 장 마감 뒤 (해외 시장이 열렸다고 가정)']];
const REPS=[['physical','실물 ETF'],['synthetic','합성 ETF (스왑)'],['etn','ETN (상장지수증권)']];
const yes=b=>b?'예':'아니요';
/* 기초자산마다 iNAV(또는 NAV 변화)를 계산하고, 그 시각에 기초자산 시장이 열렸는지와 iNAV의 성격을 적는다. */
function navRows(o){
 const lvl=300*(1+o.idx),k=Math.round(M.navFromIndex(lvl)),b=M.bondMove(.03875,.03961,3,o.rate),f=M.foreignInav(M.ETFS.overseas.nav,o.fx,o.fut),raw=M.ETFS.overseas.nav*(1+o.fx)*(1+o.fut),day=o.time==='day';
 return {
  kstock:{change:o.idx,value:W(k),how:`지수 300.00 × (1 ${o.idx<0?'−':'+'} ${F(Math.abs(o.idx)*100,1)}%) = ${F(lvl,2)} → ${W(k)}`,open:day?'열림':'닫힘',kind:day?'장중 지수로 계산':'장 마감 값 그대로'},
  bond:{change:b.change,value:U.ppct(b.change),how:`나라 3년 ${F(b.p0,2)}원 → ${F(b.p1,2)}원(금리 ${U.splus(o.rate*100,2)}%p)`,open:day?'열림(가정)':'닫힘(가정)',kind:'담은 채권 가격으로 계산'},
  gold:{change:o.gold,value:U.ppct(o.gold),how:`금 가격 변화 ${U.ppct(o.gold,1)}를 그대로 씀`,open:'—',kind:'금 가격 하나로 단순화'},
  foreign:{change:f/M.ETFS.overseas.nav-1,value:W(f),how:`${F(M.ETFS.overseas.nav)} × (1 ${o.fx<0?'−':'+'} ${F(Math.abs(o.fx)*100,1)}%) × (1 ${o.fut<0?'−':'+'} ${F(Math.abs(o.fut)*100,1)}%) = ${F(raw,2)} → ${W(f)}`,open:day?'닫힘':'열림(가정)',kind:day?'추정값(이 책의 단순화)':'해외 시장 가격이 생기는 시각'}
 };
}
ELabs.underlying=el=>{
 U.setup(el,`<fieldset class="step"><legend>1단계 · 기초자산별 iNAV</legend>${U.select('uasset','자세히 볼 ETF',ASSETS,'foreign')+U.select('utime','시각',TIMES,'day')+U.range('uidx','누리200 지수 변화 (%)',-10,10,0.1,1.2)+U.range('urate','국채 금리 변화 (%p)',-3,3,0.25,1)+U.range('ugold','금 가격 변화 (%, 원화)',-10,10,0.5,0)+U.number('ufx','원/달러 환율 변화 (%)',-20,20,0.1,1)+U.number('ufut','해외100 지수 선물 변화 (%)',-20,20,0.1,0)}</fieldset><fieldset class="step"><legend>2단계 · 복제 방식별 위험</legend>${U.select('urep','복제 방식',REPS,'physical')}</fieldset>`);
 U.bind(el,()=>{
  const pick=U.value(el,'uasset'),time=U.value(el,'utime'),fx=U.num(el,'ufx'),fut=U.num(el,'ufut'),rep=U.value(el,'urep');
  if(fx===null)return U.result(el,'',U.problem('환율 변화','−20에서 20 사이의 숫자(%)를 넣어야 합니다.'));
  if(fut===null)return U.result(el,'',U.problem('선물 변화','−20에서 20 사이의 숫자(%)를 넣어야 합니다.'));
  const rows=navRows({idx:+U.value(el,'uidx')/100,rate:+U.value(el,'urate')/100,gold:+U.value(el,'ugold')/100,fx:fx/100,fut:fut/100,time}),r=rows[pick],name=ASSETS.find(a=>a[0]===pick)[1];
  const chart=U.columns({labels:['누리200','국채3년','금 현물','해외100'],values:ASSETS.map(([k])=>rows[k].change*100),mark:i=>ASSETS[i][0]===pick,fmt:v=>U.splus(v,2)+'%',tick:v=>U.sfmt(v,1)+'%',title:'NAV(iNAV) 변화 (%) · ▲ 고른 ETF',h:230,label:ASSETS.map(([k,n])=>`${n} ${U.ppct(rows[k].change)}`).join(', ')});
  const tbl=U.table(['ETF','계산','iNAV·변화','기초자산 시장','iNAV의 성격'],ASSETS.map(([k,n])=>[(k===pick?'▲ ':'')+n,rows[k].how,`<b>${rows[k].value}</b>`,rows[k].open,rows[k].kind]),`${TIMES.find(x=>x[0]===time)[1]} · 기초자산별 iNAV`);
  const risk=M.riskTable(rep),rtbl=U.table(['방식','자산을 직접 담음','거래상대방 위험','발행사 신용위험','만기'],REPS.map(([k,n])=>{const x=M.riskTable(k);return [(k===rep?'▲ ':'')+n,yes(x.holds),yes(x.counterparty),yes(x.issuerCredit),x.maturity?'있음':'없음'];}),'복제 방식별 위험 항목 (있음·없음만, 크기는 재지 않음)');
  const repName=REPS.find(x=>x[0]===rep)[1],rtext=`<b>2단계</b> ${repName}: 자산을 직접 담음 ${yes(risk.holds)}, 거래상대방 위험 <b>${risk.counterparty?'있음':'없음'}</b>, 발행사 신용위험 <b>${risk.issuerCredit?'있음':'없음'}</b>, 만기 <b>${risk.maturity?'있음':'없음'}</b>.`;
  const sum=`네 ETF: 누리200 ${rows.kstock.value} · 누리 국채3년 ${rows.bond.value} · 금 현물 ${rows.gold.value} · 누리 해외100 ${rows.foreign.value}.`;
  const why=pick==='foreign'&&time==='day'?' 한국 장중에는 해외 시장이 닫혀 실시간 지수가 없어 이 값은 추정값이고, 시장가와의 차이가 국내 주식 ETF보다 커질 수 있습니다.':'';
  U.result(el,chart+tbl+rtbl,`<b>1단계</b> ${name}: ${r.how}. 기초자산 시장: ${r.open} · iNAV: ${r.kind}.${why}<br>${sum}<br>${rtext}${U.kind(['real','unknown'].concat(pick==='foreign'||pick==='gold'?[]:['scenario']),'해외 iNAV 식은 출처가 직접 적은 방식이 아니라 이 책의 단순화이고(환헤지 없음, 원 미만 반올림), 금 현물 ETF는 금 가격 변화 하나로 단순화했습니다. 나라 3년은 표면금리 3.875%, 반년 이표, 만기 3년, 금리 3.961%로 다시 계산한 값입니다.')}`);
 });
};
/* 8장: 상장 시장 → (국내면) 기초자산과 국내 주식 비중 → 과세 유형과 매매차익 세율. 금액은 계산하지 않는다(11권 #etf). */
const UNDERS=[['kstock','국내 주식'],['bond','채권'],['commodity','원자재 (금 등)'],['fstock','해외 주식'],['derivative','파생 (레버리지·인버스 등)']];
const TYPES={kequity:['국내주식형','국내 상장 + 국내 주식 60% 이상','매매차익 비과세'],kother:['그 밖의 국내 상장','국내 상장 + 채권·원자재·해외 주식·파생 등','매매차익 15.4% 배당소득'],foreign:['해외 상장','해외 거래소 상장','22% 양도소득']};
function treeChart(list,isK,type){
 const t=(x,y,s,c='axis',a='middle')=>`<text x="${x}" y="${y}" text-anchor="${a}" class="${c}">${s}</text>`,node=(x,y,w,label,on)=>`<rect x="${x}" y="${y}" width="${w}" height="38" rx="8" fill="var(--panel2)" stroke="${on?'var(--accent)':'var(--line)'}" stroke-width="${on?2.5:1}"/>`+t(x+w/2,y+24,(on?'▲ ':'')+label,on?'series':'axis');
 const ln=(d,on)=>`<path d="${d}" fill="none" stroke="${on?'var(--accent)':'var(--line)'}" stroke-width="${on?3:1.5}"/>`;
 let s=node(150,8,180,'상장 시장은?',true);
 s+=ln('M200 46V70H90V92',list==='domestic')+ln('M280 46V70H390V92',list==='foreign')+t(130,64,'국내','axis')+t(350,64,'해외','axis');
 s+=node(12,92,200,'국내 주식 60% 이상?',list==='domestic')+node(300,92,168,'해외 상장 · 22%',type==='foreign');
 s+=ln('M60 130V152H60V170',list==='domestic'&&isK)+ln('M160 130V152H250V170',list==='domestic'&&!isK)+t(48,160,'예','axis','end')+t(200,160,'아니요','axis');
 s+=node(12,170,170,'국내주식형 · 비과세',type==='kequity')+node(196,170,272,'그 밖의 국내 상장 · 15.4%',type==='kother');
 return U.svg(`과세 유형 가리기: ${TYPES[type][0]}, ${TYPES[type][2]}`,s,216);
}
ELabs['etf-tax-type']=el=>{
 U.setup(el,`<p class="rate-banner"><b>과세 유형과 세율은 ${M.CHECKED} 보도·안내 기준입니다(국세청·법령 원문 미확인).</b> 금액과 공제는 이 실험에서 계산하지 않습니다.</p>`+U.select('xunder','담은 기초자산',UNDERS,'kstock')+U.select('xlist','상장된 거래소',[['domestic','국내 거래소'],['foreign','해외 거래소']],'domestic')+U.number('xshare','국내 주식 비중 (%)',0,100,1,100,'기초자산이 국내 주식일 때만 씁니다. 60% 이상이면 국내주식형'));
 U.bind(el,()=>{
  const under=U.value(el,'xunder'),list=U.value(el,'xlist'),share=U.num(el,'xshare');
  if(share===null)return U.result(el,'',U.problem('국내 주식 비중','0에서 100 사이의 숫자(%)를 넣어야 합니다.'));
  const low=under==='kstock'&&share<60,isK=under==='kstock'&&!low,t=M.taxType(low?'fstock':under,list),T=TYPES[t.type],uname=UNDERS.find(u=>u[0]===under)[1];
  const tbl=U.table(['유형','조건','매매차익','팔 때 거래세'],Object.entries(TYPES).map(([k,v])=>[(k===t.type?'▲ ':'')+v[0],v[1],`<b>${v[2]}</b>`,'0원']),'ETF 과세 유형 세 가지 (보도 기준)');
  const extra=t.type==='kequity'?' 매매차익이 비과세인 국내주식형이라도 분배금에는 15.4%가 붙는다는 안내가 있습니다.':t.type==='foreign'?' 해외 상장 ETF의 250만 원 공제와 세금 금액은 11권이 계산합니다.':'';
  U.result(el,treeChart(list,isK,t.type)+tbl,`<b>${uname}</b>${under==='kstock'?`(비중 ${F(share)}%)`:''}${U.josa(uname.replace(/\s*\(.*\)$/,''),'을','를')} 담고 <b>${list==='domestic'?'국내':'해외'} 거래소</b>에 상장된 ETF는 <b>${T[0]}</b> 유형입니다. 매매차익은 ${t.gainRate?`${t.income}으로 보아 <b>${U.pct(t.gainRate,t.gainRate*100%1?1:0)}</b>`:'<b>비과세</b>'}이고, 팔 때 증권거래세는 ${W(t.stt)}입니다.${low?` 국내 주식 비중이 60%보다 작아(${F(share)}%) 국내주식형이 아니므로 그 밖의 국내 상장 유형으로 가렸습니다.`:''}${extra}<br>같은 세율이 같은 차익에서 얼마의 세금이 되는지는 <a href="../tax/#etf">세금과 계좌 06 · ETF와 채권: 담은 자산과 상장 시장에 따른 과세</a>(깊이 보기, 뒤 권)에서 계산합니다.${U.kind(['news'],'상장 시장을 먼저 보고, 국내 상장이면 기초자산을 봅니다. 금 현물 ETF의 과세는 블로그 한 곳과 원자재 보도로만 확인했습니다.')}`);
 });
};
})();
