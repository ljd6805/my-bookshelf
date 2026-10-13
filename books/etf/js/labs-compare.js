/* 9~10장 실험: 목적별 ETF 보유 비용·거래 비용 비교표, 마지막 과제(15:25 괴리율 +3%의 시점별 손익과 확인 순서).
   계산은 EMath.comparePurpose·costGap·spreadCost·shares·finalTask·gap·gapCheck. 두 ETF의 총비용·스프레드는 EMath.ETFS의 가정이다.
   두 실험 모두 가상의 ETF로 계산한 사례이며 고르거나 사고팔 시점을 권하지 않는다(계산 편의, 권유 아님). */
(()=>{
'use strict';
const U=EUI,M=EMath,F=U.fmt,W=U.won0,E=M.ETFS;
const banner=more=>`<p class="rate-banner"><b>${U.ADVICE_NOTE}</b>${more?`<br>${more}`:''}</p>`;
/* 9장: 금액·보유 햇수·왕복 횟수(기간 전체 또는 한 달)·비용 전 수익률 → 보유 비용 차, 거래 비용 차, 더 큰 항목, 순서가 뒤집히는 왕복 수. */
function fiveTable(){
 const c=k=>M.etfCost(k);
 return U.table(['ETF','기초지수','비용','괴리율','거래량·스프레드','세금(매매차익)'],[[E.nuri.name,`${E.nuri.index}(유동주식 가중 200종목)`,`총보수 ${U.pct(E.nuri.fee)}, 총비용 ${U.pct(c('nuri').total)}`,'평균과 최근 공시를 적는 칸',`스프레드 ${E.nuri.spread}원`,'비과세(국내주식형)'],[E.garam.name,E.garam.index,`총보수 ${U.pct(E.garam.fee)}, 총비용 ${U.pct(c('garam').total)}`,'평균과 최근 공시를 적는 칸',`거래가 적음, 스프레드 ${E.garam.spread}원`,'비과세(국내주식형)'],[E.overseas.name,E.overseas.index,'기초지수가 달라 비용 비교 전에 담을 것을 정함','해외 기초자산(공시 기준 2%, 보도 기준)','이 책에서 정하지 않음',`${U.pct(M.RULES.tax.kother,1)} 배당소득`]],'다섯 항목 비교표 (가상의 ETF, 값은 가정)');
}
ELabs['compare-table']=el=>{
 U.setup(el,banner()+U.number('pamt','투자 금액 (만 원)',3,100000,1,600)+U.number('pyears','보유 햇수 (년)',1,50,1,10)+U.number('ptrips','왕복 횟수 (번)',0,1000,1,1)+U.select('pper','왕복 횟수를 세는 기간',[['all','보유 기간 전체'],['month','한 달']],'all')+U.range('pr','비용 전 수익률 (연 %, 가상)',-5,15,0.5,5));
 U.bind(el,()=>{
  const a=U.num(el,'pamt'),n=U.num(el,'pyears'),trips=U.num(el,'ptrips'),per=U.value(el,'pper'),r=+U.value(el,'pr')/100;
  if(a===null)return U.result(el,'',U.problem('투자 금액','3에서 100,000 사이의 숫자(만 원)를 넣어야 합니다.'));
  if(n===null||!Number.isInteger(n))return U.result(el,'',U.problem('보유 햇수','1에서 50 사이의 정수(년)를 넣어야 합니다.'));
  if(trips===null||!Number.isInteger(trips))return U.result(el,'',U.problem('왕복 횟수','0에서 1,000 사이의 정수(번)를 넣어야 합니다.'));
  const P=a*1e4,c=M.comparePurpose({amount:P,years:n,trips,r}),sh=M.shares(P,30000),month=per==='month',tlabel=month?'한 달 거래 비용':'거래 비용';
  const chart=U.columns({labels:[`보유 비용 차(${F(n)}년)`,`${tlabel} 차`],values:[c.hold.diff,c.trade.diff],mark:i=>(i===0)===(c.bigger==='hold'),fmt:v=>F(v),tick:v=>F(v),title:'두 ETF의 비용 차이 (원) · ▲ 더 큰 항목',h:230,label:`보유 비용 차 ${W(c.hold.diff)}, ${tlabel} 차 ${W(c.trade.diff)}`});
  const cmp=U.table(['항목',E.nuri.name,E.garam.name,'차이'],[[`${F(n)}년 뒤 금액(연 ${F(r*100,1)}%)`,W(c.hold.a),W(c.hold.b),`<b>${W(c.hold.diff)}</b>`],[`${tlabel}(${F(sh)}주 × 스프레드 × ${F(trips)}번)`,W(c.trade.a),W(c.trade.b),`<b>${W(c.trade.diff)}</b>`]],`${U.man(P,'원')} · ${F(n)}년 · ${month?'한 달':'기간 전체'} ${F(trips)}번 왕복`);
  const big=c.bigger==='hold'?'보유 비용 쪽이 큽니다':'거래 비용 쪽이 큽니다';
  const cross=c.crossTrips?` 같은 금액·기간에서 ${month?'한 달 ':''}왕복이 <b>${F(c.crossTrips)}번</b>이 되면 거래 비용 차가 보유 비용 차보다 커집니다.`:'';
  U.result(el,chart+cmp+fiveTable(),`${U.man(P,'원')}을 ${F(n)}년 두고 비용 전 수익률을 연 ${F(r*100,1)}%로 놓으면 ${F(n)}년 뒤 ${E.nuri.name}${U.josa(E.nuri.name,'은','는')} <b>${W(c.hold.a)}</b>, ${E.garam.name}${U.josa(E.garam.name,'은','는')} <b>${W(c.hold.b)}</b>${U.josa(W(c.hold.b),'으로','로')} 보유 비용 차가 <b>${W(c.hold.diff)}</b>입니다. 30,000원에 ${F(sh)}주를 사고 ${month?'한 달에 ':''}${F(trips)}번 왕복하면 ${tlabel}은 ${E.nuri.name} <b>${W(c.trade.a)}</b>, ${E.garam.name} <b>${W(c.trade.b)}</b>입니다.<br>이 목적에서는 ${big}.${month?` 한 달 거래 비용 차만으로 ${F(n)}년 보유 비용 차와 견준 것입니다.`:''}${cross} ${E.overseas.name}은 기초지수가 달라 비용을 견주기 전에 무엇을 담을지부터 정합니다.${U.kind(['real','scenario'],'총비용·스프레드·시장가 30,000원·비용 전 수익률은 가정이고, 수수료·세금·시장가 주문이 여러 칸을 먹는 경우는 넣지 않았습니다. 계산 편의, 권유 아님.')}`);
 });
};
/* 10장 마지막 과제: 매수 금액·ETF·예상 체결가·iNAV·시점 (가)(나)(다)·다음 거래일 지수 변화, 확인 순서표 6칸. */
const ETF10={nuri:['누리200','domestic',30900,30000],overseas:['누리 해외100','foreign',12240,12000]};
const WHEN=[['now','(가) 지금 15:25'],['next','(나) 다음 거래일 09:05 이후'],['year','(다) 1년 보유, 괴리 0']];
const CHECKS=['시각: 단일가 시간인가, LP 의무 면제 시간인가','iNAV의 기준: 장중 지수인가, 추정값인가','호가창: LP 호가가 있는가','공시 기준·LP 종가 관리 기준을 넘는가','같은 지수의 다른 ETF(가람200)의 괴리율','그날 지수 변동과 운용사·거래소 공시'];
function finalText(o,f,chk,name,under){
 const pick=o.when,cash=`남은 ${W(f.cash)}은 현금으로 둡니다.`;
 const rows={now:`(가) 지금 15:25: 화면의 ${W(o.price)}은 장 마감 단일가 시간의 예상 체결가이고, LP 호가 의무가 면제되는 시간이라는 안내가 있습니다. ${W(o.amt)} ÷ ${W(o.price)}을 1주 단위로 버려 <b>${F(f.shares)}주</b>, <b>${W(f.paid)}</b>을 냅니다. ${cash}`,
  next:`(나) 다음 거래일 09:05 이후: 지수가 ${o.move?`${U.splus(o.move*100,1)}% 움직인`:'그대로인'} 채 시장가가 NAV로 돌아오면 평가액은 ${F(f.shares)} × ${F(o.nav)}${o.move?` × (1 ${o.move<0?'−':'+'} ${F(Math.abs(o.move)*100,1)}%)`:''} = <b>${W(f.value)}</b>, 손익 <b>${U.sfmt(f.loss)}원(${U.ppct(f.lossRate)})</b>입니다.`,
  year:`(다) 1년 보유: 1년 뒤 괴리율이 0이고 지수가 그대로라면, 같은 ${W(f.paid)}을 NAV ${W(o.nav)}에 낸 사람은 ${F(f.navShares)}주를 샀을 것입니다. 처음에 낸 웃돈 몫 <b>${W(f.premium)}</b>이 1년 뒤에도 그대로 남습니다.`};
 const head=`<b>${name}</b> 예상 체결가 ${W(o.price)}, iNAV ${W(o.nav)}: 괴리율 (${F(o.price)} − ${F(o.nav)}) ÷ ${F(o.nav)} × 100 = <b>${U.ppct(f.gap)}</b>, ${U.side(f.gap)}. ${under==='foreign'?'해외':'국내'} 기초자산 공시 기준 ${U.pct(chk.discloseLine,0)}${chk.disclose?'를 넘고':Math.abs(Math.abs(f.gap)-chk.discloseLine)<1e-9?'와 같아 넘지 않고':'를 넘지 않고'}, LP 종가 관리 기준 ${U.pct(chk.lpLine,0)}${chk.lpClose?'도 넘습니다':'는 넘지 않습니다'}(이 괴리가 종가로 굳는다면, 보도 기준).`;
 return {head,rows,pick};
}
ELabs['final-gap']=el=>{
 U.setup(el,banner(U.RULE_NOTE)+U.number('famt','매수 금액 (원)',0,1000000000,10000,10000000)+U.select('fetf','ETF',Object.entries(ETF10).map(([k,v])=>[k,v[0]]),'nuri','바꾸면 예상 체결가와 iNAV가 그 ETF의 예로 바뀝니다')+U.number('fprice','15:25 예상 체결가 (원)',1,1000000,5,30900)+U.number('fnav','iNAV (원)',1,1000000,1,30000)+U.select('fwhen','자세히 볼 시점',WHEN,'now')+`<div class="buttons" role="group" aria-label="시점 단추">${WHEN.map(([k,n])=>`<button type="button" data-when="${k}">${n.split(' ')[0]}</button>`).join('')}</div>`+U.range('fmove','(나) 다음 거래일 지수 변화 (%)',-5,5,0.5,0)+`<fieldset class="cards"><legend>확인 순서표</legend>${CHECKS.map((c,i)=>U.check('fc'+(i+1),`${'①②③④⑤⑥'[i]} ${c}`,false)).join('')}</fieldset>`);
 el.querySelectorAll('[data-when]').forEach(b=>b.onclick=()=>{const x=el.querySelector('#fwhen');x.value=b.dataset.when;x.dispatchEvent(new Event('change',{bubbles:true}));});
 U.bind(el,e=>{
  if(e&&e.target&&e.target.id==='fetf'){const d=ETF10[e.target.value];el.querySelector('#fprice').value=d[2];el.querySelector('#fnav').value=d[3];}
  const amt=U.num(el,'famt'),etf=U.value(el,'fetf'),price=U.num(el,'fprice'),nav=U.num(el,'fnav'),when=U.value(el,'fwhen'),move=+U.value(el,'fmove')/100,done=CHECKS.map((_,i)=>U.checked(el,'fc'+(i+1)));
  if(amt===null)return U.result(el,'',U.problem('매수 금액','0에서 10억 사이의 원 단위 숫자를 넣어야 합니다.'));
  if(price===null)return U.result(el,'',U.problem('예상 체결가','1에서 1,000,000 사이의 숫자(원)를 넣어야 합니다.'));
  if(nav===null)return U.result(el,'',U.problem('iNAV','1에서 1,000,000 사이의 숫자(원)를 넣어야 합니다.'));
  if(M.shares(amt,price)<1)return U.result(el,'',U.problem('매수 금액',`${W(amt)}으로는 ${W(price)}짜리를 한 주도 살 수 없습니다.`));
  el.querySelectorAll('[data-when]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.when===when)));
  const [name,under]=ETF10[etf],f=M.finalTask(amt,price,nav,move),chk=M.gapCheck(f.gap,under),T=finalText({amt,price,nav,move,when},f,chk,name,under);
  const chart=U.columns({labels:['(가) 낸 돈','(나) 평가액','(다) 1년 뒤'],values:[f.paid,f.value,f.shares*nav].map(v=>v/1e4),mark:i=>WHEN[i][0]===when,fmt:v=>F(v,v%1?1:0),tick:v=>F(v),title:'만 원 · ▲ 고른 시점',h:230,base:Math.floor(Math.min(f.paid,f.value,f.shares*nav)/1e4*0.97),label:`낸 돈 ${W(f.paid)}, 다음 거래일 평가액 ${W(f.value)}, 1년 뒤 ${W(f.shares*nav)}`});
  const tbl=U.table(['시점','금액','손익·웃돈'],[[(when==='now'?'▲ ':'')+'(가) 지금 15:25',`${F(f.shares)}주 · ${W(f.paid)}`,`현금 ${W(f.cash)}`],[(when==='next'?'▲ ':'')+'(나) 다음 거래일',W(f.value),`${U.sfmt(f.loss)}원 (${U.ppct(f.lossRate)})`],[(when==='year'?'▲ ':'')+'(다) 1년 보유',W(f.shares*nav),`웃돈 몫 ${W(f.premium)} · NAV였다면 ${F(f.navShares)}주`]],`${name} · ${W(amt)} · 세 시점`);
  const ctbl=U.table(['순서','확인할 것','상태'],CHECKS.map((c,i)=>['①②③④⑤⑥'[i],c,done[i]?'✓ 확인함':'○ 아직']),`확인 순서표 · ${done.filter(Boolean).length}/6칸 확인`);
  U.result(el,chart+tbl+ctbl,`<span class="rate-note">${U.RULE_NOTE}</span><br>${T.head}<br>▲ ${T.rows[T.pick]}<br>${WHEN.filter(w=>w[0]!==when).map(w=>T.rows[w[0]].replace(/<\/?b>/g,'')).join(' ')}<br>확인 순서표 ${done.filter(Boolean).length}/6칸을 확인했습니다. 같은 +괴리라도 시각(14시 접속매매), ETF(해외 기초자산은 기준 2%와 추정 iNAV), 그날 지수 급변에 따라 결론이 바뀝니다.${U.kind(['real','news','scenario'],'(나)는 시장가가 NAV로 돌아온다는 가정, (다)는 1년 뒤 괴리율 0과 지수 그대로라는 가정이며 수수료와 세금은 넣지 않았습니다. 계산 편의, 권유 아님.')}`);
 });
};
})();
