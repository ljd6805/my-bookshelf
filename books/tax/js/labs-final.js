/* 10장 마지막 과제: 하린의 1,000만 원을 세 계좌에 나눈 세 가지 배분안(X·Y·Z)의 세후 금액. 계산은 TMath.planOutcome(누리 해외100, 분배 연 2%, 3년).
   3년 뒤 꺼낼 금액이 연금 아닌 몫보다 크면 연금 몫 전체를 중도 인출한다고 놓는다(나눠 꺼내기는 다루지 않음). 배분안은 계산의 예이고 권유가 아니다. */
(()=>{
'use strict';
const U=TUI,M=TMath,F=U.fmt,W=U.won0;
const NAMES={X:'X · 연금저축 600만 + ISA 400만',Y:'Y · ISA 1,000만',Z:'Z · 일반 400만 + 연금저축 600만'};
function partsText(o){return Object.entries(o.parts).map(([k,p])=>k==='pension'?`연금저축 몫: 세전 ${W(p.pretax)} + 공제 ${W(p.credit)} − ${o.early?'중도 인출 세금 16.5%':'연금소득세 5.5%'} ${W(p.tax)} = ${W(p.after)}`:k==='isa'?`ISA 몫: 세전 ${W(p.pretax)} − 세금 ${W(p.tax)}${p.tax?'':'(비과세 한도 안)'} = ${W(p.after)}`:`일반계좌 몫: 세전 ${W(p.pretax)} − 세금 15.4% ${W(p.tax)} = ${W(p.after)}`).join(' · ');}
TLabs['final-order']=el=>{
 U.setup(el,`<p class="rate-banner"><b>하린의 조건에서 계산한 배분안이며, 독자에게 권하는 배분이 아닙니다.</b><br>${U.RATE_NOTE}. 2026년 세제개편안(생산적금융 ISA 신설 등)이 통과되면 이 표는 바뀝니다.</p>`+U.select('fplan','자세히 볼 배분안',Object.entries(NAMES),'X')+U.select('fband','총급여 구간',[['under','4,800만 원 · 5,500만 원 이하 (공제 16.5%)'],['over','5,500만 원 초과 (공제 13.2%)']],'under')+U.number('fneed','3년 뒤 꺼낼 금액 (원)',0,10000000,100000,4000000,'연금 아닌 몫보다 많으면 연금 몫을 중도 인출합니다')+U.range('fgrowth','연 가격 상승률 (%, 가정)',-4,10,1,4,'분배는 연 2%로 고정'));
 U.bind(el,()=>{
  const pick=U.value(el,'fplan'),band=U.value(el,'fband'),need=U.num(el,'fneed'),g=+U.value(el,'fgrowth')/100;
  if(need===null)return U.result(el,'',U.problem('꺼낼 금액','0에서 1,000만 원 사이의 원 단위 숫자를 넣어야 합니다.'));
  const outs=['X','Y','Z'].map(k=>M.planOutcome(k,{band,need,growth:g})),me=outs.find(o=>o.key===pick),best=Math.max(...outs.map(o=>o.after)),tops=outs.filter(o=>o.after===best).map(o=>o.key);
  const anyEarly=outs.some(o=>o.early),head=anyEarly?'3년 동안 생긴 수익의 세후 금액(연금 몫은 3년 뒤 중도 인출해 16.5%를 낸다고 정산)':'3년 동안 생긴 수익의 세후 금액(연금 몫은 55세 이후 연금으로 받아 5.5%를 낸다고 정산, 3년 뒤 손에 쥐는 금액 아님)';
  const chart=U.columns({labels:['X','Y','Z'],values:outs.map(o=>o.after),mark:i=>outs[i].key===pick,fmt:v=>F(v),tick:v=>F(v/10000)+'만',title:'세 배분안의 세후 금액 (원) · ▲ 고른 배분안',h:230,label:outs.map(o=>`${o.key} ${W(o.after)}`).join(', ')});
  const tbl=U.table(['배분안','세전 수익','세금','받은 공제','세후 금액'],outs.map(o=>[(o.key===pick?'▲ ':'')+NAMES[o.key],W(o.pretax),W(Object.values(o.parts).reduce((s,p)=>s+p.tax,0)),o.parts.pension?W(o.parts.pension.credit):'—',`<b>${W(o.after)}</b>${o.early?' (연금 몫 중도 인출)':''}`]),head);
  const cond=anyEarly?`3년 뒤 꺼낼 금액 ${W(need)}이 X·Z의 연금 아닌 몫 400만 원보다 많아 연금 몫 600만 원 전체를 중도 인출한다고 놓았습니다.`:'X·Z의 연금 몫 600만 원은 55세 이후까지 둔다고 놓았습니다.';
  U.result(el,chart+tbl,`<span class="rate-note">${head}</span><br>${outs.map(o=>`<b>${o.key}</b> ${W(o.after)}`).join(' · ')}. ${cond}<br><b>${NAMES[pick]}</b>: ${partsText(me)}.<br>이 조건(공제율 ${band==='over'?'13.2%':'16.5%'}, 가격 상승 연 ${F(g*100)}%, 분배 2%)에서 ${tops.length>1?`세후 금액이 가장 큰 배분안은 ${tops.slice(0,-1).join(', ')}와 ${tops.at(-1)}이고, ${tops.length===3?'세':'두'} 배분안의 세후 금액이 ${W(best)}으로 같습니다.`:`세후 금액이 가장 큰 배분안은 ${tops[0]}입니다.`} 공제율, 꺼낼 금액, 가격 상승률 가운데 하나만 바뀌어도 순위와 차이가 달라집니다.${U.kind(['real','news','scenario','unknown'],'연금 몫이 55세까지 더 불어나는 몫과 시간 가치는 넣지 않았습니다. X·Z의 600만 원은 모두 공제받은 돈이라 공제받지 않은 원금의 과세 문제는 생기지 않지만, 연금계좌에서 돈이 빠지는 순서는 확인 못함입니다.')}`);
 });
};
})();
