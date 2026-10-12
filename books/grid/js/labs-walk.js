/* 5~8장 실험: 박스권, 오르기만 하는 장, 내리기만 하는 장, 갭과 가격제한폭. 계산은 GMath.simulate, 경로는 GUI.PATH(미리 정한 가상 경로).
   격자는 하린의 18,000~22,000원 · 칸당 5주, 시작 자금은 그 격자가 최대로 묶을 수 있는 돈 1,990,289원이다. */
(()=>{
'use strict';
const U=GUI,M=GMath,F=U.fmt,W=U.won,S=U.pwon,LV=U.PATH.LV;
GLabs.box=el=>{
 U.setup(el,U.select('bstep','칸 간격 (18,000~22,000원)',[['100','100원 · 40칸'],['200','200원 · 20칸'],['400','400원 · 10칸']],'200')+U.select('bpath','가격 경로',[['swing','17,900↔22,100원 세 번 오가기 (하루짜리)'],['box','80거래일 박스권 (20,000원 ±7%)']],'swing'));
 U.bind(el,()=>{
  const step=+el.querySelector('#bstep').value,box=el.querySelector('#bpath').value==='box',lv=M.arithmeticLevels(18000,22000,4000/step);
  const r=box?M.simulate({days:U.PATH.BOX(),levels:lv,qty:5}):M.simulate({path:U.PATH.SWING,levels:lv,qty:5});
  const prices=box?U.PATH.BOX().flat():U.PATH.SWING;
  const chart=U.pathChart({prices,perDay:box?8:0,levels:lv,fills:r.fills,label:`${step}원 간격 ${lv.length-1}칸 격자가 ${box?'80거래일 박스권':'세 번 오가는 경로'}에서 ${r.roundTrips}번 왕복.`});
  const end=r.shares?`<br>끝에 ${r.heldCells}칸 ${r.shares}주가 남아 평가 손익 ${S(r.unrealized)}이 더해지므로 이 경로의 손익은 <b>${S(r.pnl)}</b>입니다.`:'<br>끝에 주식이 남지 않아 실현 손익이 그대로 이 경로의 손익입니다.';
  U.result(el,chart,`${step}원 간격(${lv.length-1}칸)으로 ${box?'80거래일 박스권 경로':'19,900원에서 17,900원과 22,100원 사이를 세 번 오가는 경로'}를 지나면 칸이 <b>${r.roundTrips}번</b> 왕복하고 실현 손익은 <b>${S(r.realized)}</b>입니다. 그동안 수수료 ${W(r.fees)}, 거래세 ${W(r.taxes)}을 냈습니다.${end}<br>이 격자가 최대로 묶을 수 있는 돈은 ${W(r.capital)}입니다.${U.kind('scenario','지어낸 경로이며, 하루 안에서는 가격이 점과 점 사이를 빠짐없이 지나간다고 봅니다.')}`);
 });
};
GLabs.rally=el=>{
 U.setup(el,U.select('rstart','시작 방식',[['filled','채워서 시작 · 위쪽 열 칸을 20,000원에 사 둠'],['empty','빈손 시작 · 주식 없이']],'filled')+U.range('rday','며칠째까지 볼까 (거래일)',1,30,1,30));
 U.bind(el,()=>{
  const filled=el.querySelector('#rstart').value==='filled',d=U.value(el,'rday'),days=U.PATH.UP().slice(0,d),lv=LV();
  const r=M.simulate({days,levels:lv,qty:5,start:filled?'filled':'empty'}),h=M.buyHold(days,r.capital),first=r.series.find(s=>s.price>lv.at(-1));
  const chart=U.pathChart({prices:days.flat(),perDay:8,levels:lv,band:[lv[0],lv.at(-1)],fills:r.fills,label:`상승 가상 경로 ${d}거래일. 격자 손익 ${S(r.pnl)}, 보유 손익 ${S(h.pnl)}.`});
  const start=filled?`시작하자마자 ${r.fills.filter(f=>f.how==='start').length}칸을 20,000원에 사 두었고, `:'주식 없이 시작했고, ';
  const held=r.shares?` 아직 ${r.shares}주를 들고 있어 평가 손익 ${S(r.unrealized)}을 더하면 <b>${S(r.pnl)}</b>입니다.`:'';
  U.result(el,chart,`20,000원에서 하루 0.8%씩 오르는 경로의 ${d}거래일째까지, ${start}칸은 <b>${r.roundTrips}번</b> 왕복해 실현 손익 <b>${S(r.realized)}</b>, 현금 <b>${W(r.cash)}</b>, 주식 ${r.shares}주입니다.${held}<br>${first?`${first.day+1}거래일째 가격이 22,000원을 넘었고, `:''}${r.outside.points}개 점 가운데 <b>${r.outside.above}개</b>에서 가격이 범위 위에 있어 격자는 현금만 들고 쉬었습니다.<br>같은 ${W(r.capital)}으로 첫 가격 20,000원에 ${h.shares}주를 사서 들고 있었다면 손익은 <b>${S(h.pnl)}</b>입니다(팔 때 비용 제외).${U.kind('scenario','지어낸 상승 시나리오입니다. 쉬는 현금의 이자는 0으로 봅니다.')}`);
 });
};
function slideText(r,lv,st,what){
 const idle=st.filter(s=>s==='idle').length,avgFee=r.shares?r.openCost/r.shares:0;
 return `${what}: 매수 ${r.buys}번, 매도 ${r.sells}번. 끝에 <b>${r.heldCells}칸 ${r.shares}주</b>를 들고 있고 평균 단가는 <b>${W(r.avgCost)}</b>(수수료를 넣으면 한 주 ${F(avgFee,1)}원)입니다. 마지막 가격 ${W(r.last)}으로 친 평가 손익 <b>${S(r.unrealized)}</b>, 실현 손익 <b>${S(r.realized)}</b>, 합해서 <b>${S(r.pnl)}</b>입니다. 가장 많이 들어간 현금은 ${W(r.maxCashUsed)}이고, 한 번도 주문이 걸리지 않은 칸이 ${idle}칸입니다.`;
}
GLabs.slide=el=>{
 U.setup(el,U.select('spath','가격 경로',[['down','30거래일 하락 경로 (하루 −0.8%, ±2%)'],['straight','19,900원에서 곧장 내려가기']],'down')+U.number('sto','곧장 내려갈 가격 (원)',10000,19890,10,16000,'10,000~19,890원, 2만 원 아래는 10원 눈금'));
 U.bind(el,()=>{
  const down=el.querySelector('#spath').value==='down',to=U.price(el,'sto'),lv=LV();
  if(to===null||Number.isNaN(to))return U.result(el,'',U.problem('곧장 내려갈 가격','10,000원에서 19,890원 사이에서 10원 눈금에 맞는 가격을 넣어야 합니다.'));
  const dn=U.PATH.DOWN(),a=M.simulate({days:dn,levels:lv,qty:5}),b=M.simulate({path:[19900,to],levels:lv,qty:5});
  const main=down?a:b,prices=down?dn.flat():[19900,to];
  const sa=U.cellStates(lv,dn.flat(),a.fills),sb=U.cellStates(lv,[19900,to],b.fills);
  const chart=U.pathChart({prices,perDay:down?8:0,levels:lv,band:[lv[0],lv.at(-1)],fills:main.fills,lines:[[main.avgCost,`평균 단가 ${F(main.avgCost)}`]],label:`${down?'하락 경로':'곧장 내려가는 길'}. ${main.heldCells}칸 ${main.shares}주, 합 ${S(main.pnl)}.`});
  const one=slideText(down?a:b,lv,down?sa:sb,down?'30거래일 하락 경로':`19,900원에서 ${F(to)}원까지 곧장`),two=slideText(down?b:a,lv,down?sb:sa,down?`견주어 19,900원에서 ${F(to)}원까지 곧장 내려가면`:'견주어 30거래일 하락 경로라면');
  U.result(el,chart,`${one}<br>${two}<br>평가 손익은 매수 수수료를 넣은 원가로, 팔 때 낼 비용은 빼지 않고 계산했습니다.${U.kind('scenario','하락 경로는 지어낸 시나리오입니다.')}`);
 });
};
GLabs.gap=el=>{
 U.setup(el,U.number('gclose','첫날 종가 (원, 첫날은 19,900원에서 시작)',10000,30000,10,19950)+U.number('gopen','다음 날 시가 (원)',5000,40000,10,19500,'기준가격(보통 전날 종가)의 ±30% 밖이면 상·하한가로 자릅니다')+U.number('gback','그날 이어서 움직인 가격 (원)',5000,40000,10,19900));
 U.bind(el,()=>{
  const ids=['gclose','gopen','gback'],v=ids.map(id=>U.price(el,id));
  if(v.some(x=>x===null||Number.isNaN(x)))return U.result(el,'',U.problem('가격','종가는 10,000~30,000원, 시가와 이어진 가격은 5,000~40,000원 사이에서 눈금(2만 원 아래 10원, 2만 원 이상 50원)에 맞게 넣어야 합니다.'));
  const [close,open,back]=v,days=[[19900,close],[open,back]],prep=M.prepareDays(days).days,[o2,b2]=prep[1],lim=M.priceLimits(close);
  const r=M.simulate({days,levels:LV(),qty:5}),n=M.simulate({path:[19900,close,o2,b2],levels:LV(),qty:5});
  const gaps=r.fills.filter(f=>f.how==='gap'),after=r.fills.filter(f=>f.side==='sell'&&f.t===3),lv=LV();
  const clip=o2!==open||b2!==back?`<br><strong>가격제한폭</strong> · 전날 종가 ${W(close)}의 하루 범위는 ${W(lim.lower)}~${W(lim.upper)}이라 시가 ${W(o2)}, 이어진 가격 ${W(b2)}으로 잘랐습니다.${o2===lim.lower?` 하한가로 열려 걸려 있던 ${gaps.length}칸이 모두 ${W(o2)}에 사졌고, 지금 들고 있는 주식을 사는 데 든 돈은 ${W(r.openCost)}입니다.`:''}`:'';
  const gapText=gaps.length?`시가 ${W(o2)}에서 걸려 있던 지정가 ${gaps.map(f=>`${f.side==='buy'?'● 매수':'■ 매도'} ${F(f.side==='buy'?lv[f.cell]:lv[f.cell+1])}원`).join(', ')}이 모두 시가 <b>${W(o2)}</b>에 체결되었습니다(<b>${gaps.length}칸</b>).`:'시가가 걸려 있던 지정가를 넘지 않아 갭 체결은 없습니다.';
  const sellText=after.length?` 이어서 ${after.map(f=>`${F(lv[f.cell])}원 칸이 칸의 매도가 ${W(f.price)}`).join(', ')}에 팔렸습니다.`:'';
  const chart=U.pathChart({prices:[19900,close,o2,b2],levels:lv,fills:r.fills,lines:[[close,`전날 종가 ${F(close)}`]],label:`19,900 → ${F(close)}원, 다음 날 ${F(o2)} → ${F(b2)}원. 갭 체결 ${gaps.length}칸.`});
  U.result(el,chart,`${gapText}${sellText}<br>갭이 있을 때 실현 손익 <b>${S(r.realized)}</b>, 평가 손익 ${S(r.unrealized)}입니다. 같은 움직임이 하루 안에서 매끄럽게 일어났다면 실현 ${S(n.realized)}, 평가 ${S(n.unrealized)}입니다.${clip}${U.kind('real','갭에서는 매수 = min(지정가, 시가), 매도 = max(지정가, 시가). 체결 뒤 새로 거는 주문은 격자 가격에 겁니다.')}`);
 });
};
})();
