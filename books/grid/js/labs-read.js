/* 9~12장 실험: 장부 맞추기, 자금 배분과 최대 손실, 다른 방법과 견주기, 범위를 벗어났을 때의 규칙. 계산은 GMath, 경로는 GUI.PATH(가상 경로). */
(()=>{
'use strict';
const U=GUI,M=GMath,F=U.fmt,W=U.won,S=U.pwon,P=U.pct,LV=U.PATH.LV,ETF={tax:0,kind:'etf'};
const PATHS={down:['30거래일 하락 경로',()=>U.PATH.DOWN()],box:['80거래일 박스권',()=>U.PATH.BOX()],up:['30거래일 상승 경로',()=>U.PATH.UP()],final:['120거래일 6개월 경로',()=>U.PATH.FINAL()]};
GLabs.ledger=el=>{
 U.setup(el,U.select('lgpath','가격 경로',[['down',PATHS.down[0]],['box',PATHS.box[0]],['final',PATHS.final[0]]],'down')+U.select('lgden','수익률의 분모',[['cap','시작 자금 (격자의 최대 소요액)'],['max','실제로 가장 많이 들어간 현금'],['limit','하린의 한도 300만 원']],'cap'));
 U.bind(el,()=>{
  const key=el.querySelector('#lgpath').value,den=el.querySelector('#lgden').value,days=PATHS[key][1](),r=M.simulate({days,levels:LV(),qty:5});
  const value=r.shares*r.last,left=r.cash+value,right=r.capital+r.realized+r.unrealized,same=Math.abs(left-right)<1e-6;
  const base={cap:r.capital,max:r.maxCashUsed,limit:3e6}[den],name={cap:'시작 자금',max:'가장 많이 들어간 현금',limit:'한도'}[den],period=r.pnl/base*100,year=M.annualize(period,days.length);
  const chart=U.bars(['현금','주식 평가액','왼쪽 합','시작 자금','실현 손익','평가 손익','오른쪽 합'],[r.cash,value,left,r.capital,r.realized,r.unrealized,right],{signed:true,mark:i=>i===2||i===6,show:v=>U.pwon(v)});
  U.result(el,chart,`${PATHS[key][0]} 끝: 현금 <b>${W(r.cash)}</b> + 주식 ${r.shares}주 × ${W(r.last)} = ${W(value)}, 합 <b>${W(left)}</b>.<br>시작 자금 ${W(r.capital)} + 실현 손익 ${S(r.realized)} + 평가 손익 ${S(r.unrealized)} = <b>${W(right)}</b>. ${same?'✓ 두 합이 원 단위까지 같습니다.':'<strong>✗ 두 합이 다릅니다. 장부를 확인해야 합니다.</strong>'}<br>지금 모두 판다면 팔 때 비용 ${W(left-r.liquidation)}을 더 내고 손에 쥐는 돈은 ${W(r.liquidation)}입니다.<br>손익 ${S(r.pnl)}을 ${name} ${W(base)}으로 나누면 ${days.length}거래일 동안 <b>${P(period)}</b>, 1년을 250거래일로 보고 곱해서 늘리면 연 <b>${P(year)}</b>입니다.${U.kind('scenario','지어낸 경로 위의 장부입니다. 짧은 기간을 연으로 늘리면 우연한 결과도 크게 부풀려집니다.')}`);
 });
};
GLabs.capital=el=>{
 U.setup(el,U.number('kcap','격자에 맡길 한도 (원)',100000,100000000,10000,3000000)+U.range('kqty','칸당 수량 (주)',1,15,1,5)+U.number('kfall','최악의 경우 내려갈 가격 (원)',5000,17990,10,16000,'5,000~17,990원, 범위 맨 아래 18,000원보다 낮게'));
 U.bind(el,()=>{
  const limit=U.num(el,'kcap'),q=U.value(el,'kqty'),fall=U.price(el,'kfall'),lv=LV();
  if(limit===null)return U.result(el,'',U.problem('한도','한도는 100,000원에서 100,000,000원 사이의 숫자로 넣어야 합니다.'));
  if(fall===null||Number.isNaN(fall))return U.result(el,'',U.problem('내려갈 가격','5,000원에서 17,990원 사이에서 눈금(5천~2만 원은 10원)에 맞는 가격을 넣어야 합니다.'));
  const maxQ=M.qtyForBudget(lv,limit),need=M.gridBudget(lv,q),loss=M.lossAt(lv,q,fall),s=M.simulate({path:[19900,fall],levels:lv,qty:q}),fits=need<=limit;
  const qs=Array.from({length:Math.min(15,Math.max(8,q,maxQ+1))},(_,i)=>i+1);
  const chart=U.bars(qs.map(k=>`칸당 ${k}주`),qs.map(k=>M.gridBudget(lv,k)),{mark:i=>qs[i]===q,show:(v,i)=>`${U.won(v)} ${v<=limit?'✓':'✗'}`})+U.table(['칸당','묶이는 돈','남는 돈',`${F(fall)}원 최악 손실`],qs.map(k=>{const b=M.gridBudget(lv,k);return [`${k}주${k===q?' ✓':''}`,W(b),b<=limit?W(limit-b):'✗ 한도 초과',W(M.lossAt(lv,k,fall).loss)];}),`한도 ${W(limit)} · 18,000~22,000원 20칸`);
  const fit=fits?`✓ 한도 안이고 <b>${W(limit-need)}</b>이 남습니다`:`<strong>✗ 한도를 ${W(need-limit)} 넘습니다</strong>`;
  U.result(el,chart,`한도 ${W(limit)} 안에 들어오는 가장 큰 칸당 수량은 <b>${maxQ}주</b>입니다. 칸당 ${q}주면 모든 칸이 찼을 때 <b>${W(need)}</b>이 묶여 ${fit}. 한 바퀴 몫은 ${S(M.gridReport(lv,q).netPerCycle)}입니다.<br>모든 칸이 찬 최악의 장부에서 ${F(fall)}원에 모두 판다면 <b>${W(loss.loss)}</b>, 들인 돈의 <b>${P(loss.lossPct,1)}</b>를 잃습니다.<br>견주어 19,900원에서 곧장 ${F(fall)}원까지 내려가는 길이면 ${s.heldCells}칸만 차서, 그 값에 모두 팔 때 ${S(s.liquidation-s.capital)}입니다. 어느 길로 내려갈지는 미리 알 수 없어 한도는 최악의 장부로 정합니다.${U.kind('real','최악의 손실은 모든 칸이 한 번씩 사진 채 하나도 팔리지 않은 경우이며, 팔 때 수수료와 거래세를 뺍니다.')}`);
 });
};
function methods(days,cap,c,o,filled){
 const g=M.simulate({days,levels:LV(),qty:5,costs:c,start:filled?'filled':'empty'});
 const list=[['격자',g,g.fills.length,U.dayCloses(g)],['보유',M.buyHold(days,cap,c)],['적립식',M.periodic(days,cap,c,{parts:o.parts,every:o.every})],['리밸런싱',M.rebalance(days,cap,c,{weight:o.weight,every:o.reb})]];
 return list.map(([name,x,trades,closes])=>({name,pnl:x.pnl,pct:(x.equity/cap-1)*100,costs:x.fees+x.taxes,trades:trades??x.trades,mdd:M.maxDrawdown(closes||x.series).mdd}));
}
GLabs.compare=el=>{
 U.setup(el,U.select('mpath','가격 경로',[['up',PATHS.up[0]],['down',PATHS.down[0]],['box',PATHS.box[0]]],'up')+U.select('mkind','종목',[['stock','주식 (거래세 0.20%)'],['etf','국내 주식형 ETF (거래세 없음)']],'stock')+U.range('mparts','적립식: 나눠 사는 횟수',1,12,1,6)+U.range('mevery','적립식: 사는 간격 (거래일)',1,40,1,5)+U.range('mweight','리밸런싱: 주식 비중 (%)',0,100,10,50)+U.range('mreb','리밸런싱: 되돌리는 간격 (거래일)',1,40,1,5));
 U.bind(el,()=>{
  const key=el.querySelector('#mpath').value,etf=el.querySelector('#mkind').value==='etf',days=PATHS[key][1](),cap=M.gridBudget(LV(),5);
  const o={parts:U.value(el,'mparts'),every:U.value(el,'mevery'),weight:U.value(el,'mweight'),reb:U.value(el,'mreb')};
  const rows=methods(days,cap,etf?ETF:undefined,o,key==='up'),best=rows.reduce((a,b)=>b.pnl>a.pnl?b:a),order=[...rows].sort((a,b)=>b.pnl-a.pnl).map(x=>x.name).join(' > ');
  const chart=U.bars(rows.map(x=>x.name),rows.map(x=>x.pnl),{signed:true,mark:i=>rows[i]===best,show:v=>U.pwon(v)})+U.table(['방법','끝 손익','수익률','비용','거래 수','최대 낙폭'],rows.map(x=>[`${x.name}${x===best?' ✓':''}`,S(x.pnl),P(x.pct),W(x.costs),F(x.trades),P(x.mdd)]),`${PATHS[key][0]} · 같은 돈 ${W(cap)}`);
  const g=rows[0],h=rows[1];
  U.result(el,chart,`${PATHS[key][0]}에 같은 ${W(cap)}을 두면 끝 손익은 격자 <b>${S(g.pnl)}</b>(${P(g.pct)}), 보유 <b>${S(h.pnl)}</b>(${P(h.pct)}), 적립식 <b>${S(rows[2].pnl)}</b>, 리밸런싱 <b>${S(rows[3].pnl)}</b>입니다. 순서: ${order}.<br>비용은 격자 ${W(g.costs)}(체결 ${g.trades}번), 보유 ${W(h.costs)}입니다. 하루 끝 금액으로 잰 최대 낙폭은 격자 ${P(g.mdd)}, 보유 ${P(h.mdd)}입니다.${key==='up'?' 상승 경로의 격자는 6장처럼 채워서 시작합니다.':''}<br>이 순서는 이 한 경로에서의 결과이며, 어느 방법이 낫다는 결론이 아닙니다.${U.kind('scenario','보유·적립식·리밸런싱은 하루 시가에만 거래하고 그날 금액은 종가로 칩니다. 팔 때 비용은 빼지 않았습니다.')}`);
 });
};
const stopDay=r=>r.stopped?r.series[r.stopped.t].day+1:null;
GLabs.exit=el=>{
 U.setup(el,U.number('xstop','멈춤 가격 (원)',10000,19990,10,17500,'이 가격에 닿으면 모두 팔고 멈춤')+U.select('xlimon','손실 한도 규칙',[['on','켬'],['off','끔']],'on')+U.number('xlimit','손실 한도 (원)',1000,2000000,1000,100000)+U.number('xlo','옮길 범위 하단 (원)',5000,30000,10,16000,'같은 20칸 · 칸당 5주로 새로 깔 때')+U.number('xhi','옮길 범위 상단 (원)',5000,30000,10,20000));
 U.bind(el,()=>{
  const stop=U.price(el,'xstop'),on=el.querySelector('#xlimon').value==='on',lim=U.num(el,'xlimit'),lo=U.price(el,'xlo'),hi=U.price(el,'xhi');
  if(stop===null||Number.isNaN(stop))return U.result(el,'',U.problem('멈춤 가격','10,000원에서 19,990원 사이에서 10원 눈금에 맞는 가격을 넣어야 합니다.'));
  if(lim===null)return U.result(el,'',U.problem('손실 한도','1,000원에서 2,000,000원 사이의 숫자로 넣어야 합니다.'));
  if([lo,hi].some(x=>x===null||Number.isNaN(x))||lo>=hi)return U.result(el,'',U.problem('옮길 범위','하단과 상단은 5,000~30,000원 사이의 눈금에 맞는 가격이고, 하단이 상단보다 낮아야 합니다.'));
  const days=U.PATH.DOWN(),lv=LV(),wait=M.simulate({days,levels:lv,qty:5}),a=M.simulate({days,levels:lv,qty:5,stop:{below:stop}}),b=on?M.simulate({days,levels:lv,qty:5,stop:{maxLoss:lim}}):null;
  const k=wait.series.find(s=>s.price<lv[0]),move=M.gridBudget(M.arithmeticLevels(lo,hi,20),5);
  const rows=[['끝까지 기다림','—',S(wait.pnl)],[`멈춤 가격 ${F(stop)}원`,a.stopped?`${stopDay(a)}거래일째 ${F(a.stopped.price)}원`:'닿지 않음',S(a.pnl)]];
  if(b)rows.push([`손실 한도 ${F(lim)}원`,b.stopped?`${stopDay(b)}거래일째 ${F(b.stopped.price)}원`:'닿지 않음',S(b.pnl)]);
  const chart=U.pathChart({prices:days.flat(),perDay:8,levels:lv,band:[lv[0],lv.at(-1)],fills:a.fills,lines:[[stop,`멈춤 ${F(stop)}`]],label:`하락 경로와 멈춤 가격 ${F(stop)}원. 멈춤 규칙의 손익 ${S(a.pnl)}.`})+U.table(['규칙','멈춘 때','손익'],rows,'하락 경로 · 같은 격자');
  const stopText=a.stopped?`${stopDay(a)}거래일째 가격이 ${F(stop)}원에 닿아 남은 주식을 ${W(a.stopped.price)}에 모두 팔고 멈춥니다. 손익은 <b>${S(a.pnl)}</b>으로, 끝까지 기다린 ${S(wait.pnl)}보다 ${W(Math.abs(a.pnl-wait.pnl))} ${a.pnl>wait.pnl?'덜 잃습니다':'더 잃습니다'}.`:`이 경로는 ${F(stop)}원까지 내려가지 않아 멈춤 규칙이 한 번도 쓰이지 않았고, 손익은 끝까지 기다린 것과 같은 <b>${S(a.pnl)}</b>입니다.`;
  const over=b&&b.stopped?Math.max(0,-b.pnl-lim):0,limText=!b?'손실 한도 규칙은 꺼 두었습니다.':b.stopped?`손실 한도 ${W(lim)}이면 ${stopDay(b)}거래일째 ${W(b.stopped.price)}에서 멈추고 손익은 <b>${S(b.pnl)}</b>입니다.${over?` 한도보다 <b>${W(over)}</b>을 더 잃었습니다. 점과 점 사이에서 넘어선 만큼이 그대로 손실에 더해진 것입니다.`:' 한도 안에서 멈췄습니다.'}`:`손익이 한 번도 −${W(lim)}에 닿지 않아 손실 한도 규칙은 쓰이지 않았습니다.`;
  U.result(el,chart,`${k?`가격은 ${k.day+1}거래일째 ${W(k.price)}으로 범위 아래로 빠집니다. `:''}${stopText}<br>${limText}<br>범위를 ${F(lo)}~${F(hi)}원으로 옮겨 같은 20칸 · 칸당 5주를 새로 깔면 최악의 경우 <b>${W(move)}</b>이 더 묶일 수 있습니다.${U.kind('scenario','하락 경로는 지어낸 시나리오입니다. 손실 한도는 경로의 점마다 확인합니다.')}`);
 });
};
})();
