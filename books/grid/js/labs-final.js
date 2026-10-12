/* 13장 마지막 과제: 하린의 6개월 격자 장부. 경로는 GUI.PATH.FINAL(120거래일 가상 시나리오), 계산은 GMath.simulate.
   결정마다 더 드는 돈·최악의 손실·지금 확정되는 손익을 한 표에 놓는다. 이 실험은 정답을 고르지 않는다. */
(()=>{
'use strict';
const U=GUI,M=GMath,F=U.fmt,W=U.won,S=U.pwon,LIMIT=3e6;
const DECIDE=[['wait','그대로 기다리기'],['move','범위를 아래로 옮기기'],['geo','간격을 등비로 바꾸기'],['stop','지금 모두 팔고 멈추기']];
const RULES=[['none','규칙 없음'],['stop','17,500원에 닿으면 멈춤'],['limit','손실 한도 10만 원']];
/* 달마다(20거래일) 끝 가격, 장부의 합, 왕복 수, 갭 체결 수. */
function months(r){
 return [0,1,2,3,4,5].map(m=>{const end=r.series.filter(s=>s.day===m*20+19).slice(-1)[0]||r.series.at(-1),fs=r.fills.filter(x=>Math.floor(r.series[x.t].day/20)===m);
  return {price:end.price,pnl:end.equity-r.capital,trips:fs.filter(x=>x.side==='sell'&&x.how!=='stop').length,gaps:fs.filter(x=>x.how==='gap').length};});
}
function decisions(days,lo,hi,f){
 const wait=M.simulate({days:[...days,[15000]],levels:M.arithmeticLevels(lo,hi,20),qty:5}).pnl,w=(hi-lo)/2,nlo=M.roundToTick(lo-w),nhi=M.roundToTick(hi-w),need=M.gridBudget(M.arithmeticLevels(nlo,nhi,20),5),have=f.cash+Math.max(0,LIMIT-f.capital);
 return {
  wait:{extra:0,worst:wait,now:null,text:`더 드는 돈은 없습니다. 가격이 15,000원까지 더 내려가면 합은 ${S(wait)}이 됩니다(팔 때 비용 제외).`},
  move:{extra:need,worst:null,now:null,text:`${F(nlo)}~${F(nhi)}원에 같은 20칸 · 칸당 5주를 새로 깔면 최악의 경우 ${W(need)}이 더 묶입니다. 지금 현금 ${W(f.cash)}에 한도 300만 원의 나머지 ${W(Math.max(0,LIMIT-f.capital))}을 더해도 ${W(have)}이라 ${have>=need?'✓ 옛 주식을 든 채로 깔 수 있습니다':'✗ 옛 주식을 든 채로는 다 깔 수 없습니다'}. 옛 주식을 모두 팔면 ${W(f.liquidation)}을 손에 쥐지만 그 순간 ${S(f.liquidation-f.capital)}이 확정됩니다.`},
  geo:{extra:0,worst:null,now:null,pnl:M.simulate({days,levels:M.geometricLevels(lo,hi,20),qty:5}).pnl},
  stop:{extra:0,worst:null,now:f.liquidation-f.capital,text:`팔 때 수수료와 거래세 ${W(f.equity-f.liquidation)}까지 내고 ${S(f.liquidation-f.capital)}이 확정됩니다. 그 뒤로는 손익이 바뀌지 않습니다.`}
 };
}
function ruleRun(days,lv,rule){if(rule==='none')return null;return M.simulate({days,levels:lv,qty:5,stop:rule==='stop'?{below:17500}:{maxLoss:100000}});}
GLabs.final6m=el=>{
 U.setup(el,U.number('flo','격자 하단 (원)',5000,30000,10,18000,'처음부터 이 범위를 20칸 · 칸당 5주로 깔았다고 봅니다')+U.number('fhi','격자 상단 (원)',5000,40000,10,22000)+U.select('fdec','하린이 지금 고르는 결정',DECIDE,'wait')+U.select('frule','처음부터 붙여 둔 규칙',RULES,'none'));
 U.bind(el,()=>{
  const lo=U.price(el,'flo'),hi=U.price(el,'fhi'),dec=el.querySelector('#fdec').value,rule=el.querySelector('#frule').value;
  if([lo,hi].some(x=>x===null||Number.isNaN(x))||lo>=hi)return U.result(el,'',U.problem('격자 범위','하단은 5,000~30,000원, 상단은 5,000~40,000원 사이의 눈금에 맞는 가격이고, 하단이 상단보다 낮아야 합니다.'));
  const days=U.PATH.FINAL(),lv=M.arithmeticLevels(lo,hi,20),f=M.simulate({days,levels:lv,qty:5}),D=decisions(days,lo,hi,f),R=ruleRun(days,lv,rule),mf=months(f),mr=R?months(R):null;
  D.geo.text=`같은 6개월 경로를 같은 범위의 등비 격자로 처음부터 걸었다면 합은 ${S(D.geo.pnl)}이었습니다. 등비 격자는 2만 원 위 일부 칸이 250원으로 벌어집니다(3장).`;
  const head=['달','월말 가격','장부의 합','왕복','갭 체결',...(R?['규칙 장부의 합']:[])];
  const rows=mf.map((m,i)=>[`${i+1}월`,F(m.price),S(m.pnl),F(m.trips),F(m.gaps),...(R?[S(mr[i].pnl)]:[])]);
  const dRows=DECIDE.map(([k,n])=>[`${n}${k===dec?' ✓':''}`,W(D[k].extra),D[k].worst!=null?S(D[k].worst)+' (15,000원)':k==='geo'?S(D.geo.pnl)+' (등비)':'—',D[k].now!=null?S(D[k].now):'—']);
  const chart=U.pathChart({prices:days.flat(),perDay:8,levels:lv,band:[lo,hi],fills:f.fills,label:`120거래일 가상 경로와 ${F(lo)}~${F(hi)}원 격자. 끝 장부의 합 ${S(f.pnl)}.`})+U.table(head,rows,'달마다 장부 (20거래일 = 한 달)')+U.table(['결정','더 드는 돈','최악·비교 손익','지금 확정'],dRows,'결정마다 적을 숫자');
  const ruleText=!R?'처음부터 붙여 둔 규칙이 없습니다.':R.stopped?`“${RULES.find(x=>x[0]===rule)[1]}”를 처음부터 붙였다면 ${R.series[R.stopped.t].day+1}거래일째 ${W(R.stopped.price)}에서 멈춰 합은 <b>${S(R.pnl)}</b>였습니다. ${dec==='stop'?'지금 멈추는 결정은 이 규칙과 같은 쪽입니다.':'지금 고른 결정이 이 규칙과 어긋난다면 왜 어긋나는지 적어 두어야 합니다.'}`:`“${RULES.find(x=>x[0]===rule)[1]}” 규칙은 이 범위에서는 한 번도 쓰이지 않아 끝 장부와 같은 ${S(R.pnl)}입니다.`;
  U.result(el,chart,`120거래일 끝 장부: 왕복 <b>${f.roundTrips}번</b>, 실현 손익 ${S(f.realized)}, 들고 있는 칸 ${f.heldCells}칸 ${f.shares}주, 마지막 가격 ${W(f.last)}, 평가 손익 ${S(f.unrealized)}, 합 <b>${S(f.pnl)}</b>, 현금 ${W(f.cash)}. 가장 많이 들어간 현금은 ${W(f.maxCashUsed)}이고, 960개 점 가운데 <b>${f.outside.below}개</b>에서 가격이 범위 아래에 있었습니다.<br><b>${DECIDE.find(x=>x[0]===dec)[1]}</b> · ${D[dec].text}<br>${ruleText}${U.kind('scenario','6개월 경로는 지어낸 시나리오입니다. 시작 자금은 고른 격자의 최대 소요액이며, 이 실험은 결정의 정답을 고르지 않습니다.')}`);
 });
};
})();
