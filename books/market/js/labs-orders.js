/* 1~4장 실험: 증권의 몫, 주문이 가는 시장, 호가창 쓸기, 시간 우선 대기열. 계산은 MMath, 여기서는 입력을 읽고 그리기만 한다. */
(()=>{
'use strict';
const U=MUI,M=MMath,F=U.fmt,W=U.won;
MLabs.claims=el=>{
 U.setup(el,U.range('cprofit','회사의 한 해 이익 (억 원)',-50,300,10,100)+U.range('cint','채권자에게 약속한 이자 (억 원)',0,100,5,30));
 U.bind(el,()=>{
  const profit=U.value(el,'cprofit'),interest=U.value(el,'cint'),r=M.claims(profit,interest),top=Math.max(300,interest,Math.abs(r.toEquity));
  const chart=U.bars(['이익에서 낸 이자','이익으로 못 낸 이자','주주 몫(이 해 이익 기준)'],[r.toBond,-r.bondShort,r.toEquity],{unit:'억',max:top,signed:true,mark:i=>i===2&&r.toEquity>0});
  const head=r.toBond>0?`회사 이익 ${F(profit,0)}억 원에서 채권자 이자 <b>${F(r.toBond,0)}억 원</b>을 먼저 내고, 주주에게는 <b>${F(r.toEquity,0)}억 원</b>이 남습니다.`:`이 해에는 이익이 없어 이자를 이익에서 한 푼도 내지 못합니다.`;
  const shortNote=r.bondShort>0?`<br>이자 <b>${F(r.bondShort,0)}억 원</b>은 이익으로 내지 못했습니다. 채권자는 이 돈을 받을 권리가 있으므로 회사는 모아 둔 돈이나 새 빚으로 내야 하고, 그만큼 회사의 순자산, 곧 주주의 몫이 더 줄어듭니다. 이런 해가 이어지면 연체와 부도 위험이 커집니다.`:'';
  const lossNote=r.toEquity<0?`<br>이 해 이익 기준 주주 몫은 <b>${F(r.toEquity,0)}억 원</b>입니다. 손실만큼 회사의 순자산이 줄어 주주가 가진 지분의 값도 줄어듭니다.`:'';
  U.result(el,chart,`${head}${shortNote}${lossNote}${U.kind('example','가상의 회사 숫자로 계산했고 세금과 재투자는 뺐습니다.')}`);
 });
};
const PRICES=[[19950,'19,950원'],[19960,'19,960원'],[19970,'19,970원']];
MLabs.venue=el=>{
 U.setup(el,U.select('vkrx','KRX 매도1호가',PRICES,19950)+U.select('vnxt','NXT 매도1호가',PRICES,19960)+U.range('vfk','KRX로 보낼 때 수수료율 (%)',.01,.02,.0005,.015)+U.range('vfn','NXT로 보낼 때 수수료율 (%)',.01,.02,.0005,.0145)+U.range('vqty','사려는 수량 (주)',10,1000,10,100));
 U.bind(el,()=>{
  const qty=U.value(el,'vqty'),venues=[{name:'KRX',ask:U.value(el,'vkrx'),fee:U.value(el,'vfk')},{name:'NXT',ask:U.value(el,'vnxt'),fee:U.value(el,'vfn')}];
  const r=M.bestVenue(venues,qty),best=r[0],other=r[1],diff=other.total-best.total,byName=n=>r.find(v=>v.name===n);
  const rows=['KRX','NXT'].map(n=>{const v=byName(n),fee=v.total-v.ask*qty;return [n,W(v.ask),W(v.ask*qty),W(fee),`<b>${W(v.total)}</b>`];});
  const chart=U.bars(['KRX가 더 내는 돈','NXT가 더 내는 돈'],['KRX','NXT'].map(n=>byName(n).total-best.total),{unit:'원',max:Math.max(diff,1),mark:i=>['KRX','NXT'][i]===best.name})+U.table(['시장','매도1호가','주식값','수수료','합계'],rows,`${F(qty,0)}주를 살 때`);
  const verdict=diff?`<b>${best.name}</b>가 ${W(diff)} 쌉니다.`:'두 시장의 합계가 같습니다. 이럴 때는 체결 가능성이나 속도 같은 다른 기준이 순서를 정합니다.';
  U.result(el,chart,`${F(qty,0)}주를 사면 ${best.name} ${W(best.total)}, ${other.name} ${W(other.total)}입니다. ${verdict}<br>증권사는 고객 주문을 가격·비용·체결 가능성을 따져 더 나은 곳으로 보내야 합니다(최선집행 의무). 여기서는 매도1호가에 수량이 충분하다고 가정했습니다.${U.kind('example','두 시장의 호가와 수수료율은 설명을 위해 정한 값입니다.')}`);
 });
};
MLabs.sweep=el=>{
 const B=U.BOOK;
 U.setup(el,U.range('sqty','시장가 매수 수량 (주)',0,3000,10,500));
 U.bind(el,()=>{
  const qty=U.value(el,'sqty'),r=M.sweep(B.asks,qty),s=M.spread(B.bids[0][0],B.asks[0][0]);
  const chart=U.orderBook(B.asks,B.bids,r.fills,{label:`새벽전자 호가창. 시장가 매수 ${F(qty,0)}주가 매도 호가 ${r.fills.length}단계를 먹었습니다.`});
  const head=`최우선 매수호가 ${W(B.bids[0][0])}, 최우선 매도호가 ${W(B.asks[0][0])}이라 스프레드는 <b>${W(s.won)}</b>(${F(s.pct,3)}%)입니다.`;
  if(!qty)return U.result(el,chart,`${head}<br>주문 수량이 0이라 아직 아무것도 체결되지 않았습니다.${U.kind('real','가상 호가창에 체결 순서 규칙을 그대로 적용했습니다.')}`);
  const rest=r.unfilled?`<br>호가창에 남은 매도 물량이 ${F(r.filled,0)}주뿐이라 <b>${F(r.unfilled,0)}주</b>는 체결되지 않았습니다. 남은 수량을 어떻게 처리할지는 주문 조건에 따라 다릅니다.`:'';
  U.result(el,chart,`${head}<br>시장가 매수 ${F(r.filled,0)}주는 매도 호가 ${r.fills.length}단계를 차례로 먹어 평균 <b>${W(r.avg,2)}</b>에 체결됩니다. 맨 위 호가 ${W(B.asks[0][0])}보다 <b>${W(r.slip,2)}</b>(${F(r.slipPct,3)}%) 비싸게 산 셈이고, 이 차이를 미끄러짐이라 부릅니다. 총 ${W(r.cost)}이 듭니다.${rest}${U.kind('real','가상 호가창에 체결 순서 규칙을 그대로 적용했습니다.')}`);
 });
};
function queueChart(ahead,mine,incoming,r){
 const total=Math.max(ahead+mine,incoming,1),x=v=>20+v/total*440,y=110;
 const seg=(a,b,fill,op)=>b>a?`<rect x="${x(a)}" y="${y}" width="${Math.max(1,x(b)-x(a))}" height="56" rx="3" fill="${fill}" fill-opacity="${op}"/>`:'';
 const body=seg(0,ahead,'var(--blue)',.25)+seg(ahead,ahead+mine,'var(--accent)',.3)+seg(0,r.toAhead,'var(--blue)',1)+seg(ahead,ahead+r.toMine,'var(--accent)',1)
  +`<text x="20" y="${y-16}">19,950원 매수 대기열 · 앞에서부터 체결 →</text><text x="${x(ahead/2)}" y="${y+84}" text-anchor="middle">앞 사람 ${F(ahead,0)}주</text><text x="${x(ahead+mine)}" y="${y+104}" text-anchor="end">내 주문 ${F(mine,0)}주</text>`
  +`<path d="M20 70H${x(incoming)}" stroke="var(--orange)" stroke-width="3" marker-end="url(#mq-arrow)"/><defs><marker id="mq-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--orange)"/></marker></defs><text x="20" y="58">들어온 매도 ${F(incoming,0)}주</text>`;
 return U.svg(`대기열 그림. 앞 사람 ${ahead}주, 내 주문 ${mine}주, 들어온 매도 ${incoming}주. 내 주문 ${r.toMine}주 체결.`,body);
}
MLabs.queue=el=>{
 U.setup(el,U.range('qahead','같은 가격에 내 앞에 선 수량 (주)',0,2000,10,800)+U.range('qmine','내 매수 수량 (주)',1,500,1,100)+U.range('qin','그 가격에 들어온 매도 수량 (주)',0,3000,10,500));
 U.bind(el,()=>{
  const ahead=U.value(el,'qahead'),mine=U.value(el,'qmine'),incoming=U.value(el,'qin'),r=M.queueFill(ahead,mine,incoming),more=Math.max(0,r.need-incoming);
  const tail=more?`내 주문이 모두 체결되려면 같은 가격에 매도가 <b>${F(more,0)}주</b> 더 들어와야 합니다.`:'내 주문은 모두 체결되었습니다.';
  U.result(el,queueChart(ahead,mine,incoming,r),`들어온 매도 ${F(incoming,0)}주는 먼저 앞 사람에게 ${F(r.toAhead,0)}주, 내 주문에 <b>${F(r.toMine,0)}주</b> 돌아갑니다. 결과: <b>${r.status}</b>.<br>${tail} 같은 가격에서는 먼저 낸 주문이 먼저 체결되므로(시간 우선), 가격을 바꾸지 않는 한 순서를 앞당길 방법은 없습니다.${U.kind('real','가격·시간 우선 원칙을 그대로 계산했고, 수량은 정해 둔 예시입니다.')}`);
 });
};
})();
