/* 1~4장 실험: 칸의 규칙, 한 칸의 손익, 등차·등비 간격, 범위 정하기. 계산은 GMath, 여기서는 입력을 읽고 그리기만 한다.
   기본 격자는 하린의 18,000~22,000원 · 200원 · 20칸 · 칸당 5주, 비용은 수수료 양쪽 0.015%(가정)와 거래세 0.20%. */
(()=>{
'use strict';
const U=GUI,M=GMath,F=U.fmt,W=U.won,P=U.pct,LV=U.PATH.LV,ETF={tax:0,kind:'etf'};
const costsOf=k=>k==='etf'?ETF:undefined;
const short=a=>a.length>4?`${F(a[0])}원부터 ${F(a.at(-1))}원까지 ${a.length}개`:a.map(v=>`${F(v)}원`).join(' · ');
GLabs.ladder=el=>{
 U.setup(el,U.text('lapath','지나온 가격 (원, 쉼표로 구분)','19900, 19500','첫 가격에서 주식 없이 시작합니다. 14,000~26,000원, 1~10개')+U.range('lanext','마지막으로 옮길 가격 (원)',17000,23000,100,19900,'방향키로 100원씩 옮길 수 있습니다'));
 U.bind(el,()=>{
  const head=U.list(el,'lapath',{min:14000,max:26000,count:[1,10]}),next=U.value(el,'lanext');
  if(head===null)return U.result(el,'',U.problem('지나온 가격','14,000원에서 26,000원 사이의 가격을 쉼표로 1~10개 적어야 합니다. 예: 19900, 19500'));
  const bad=head.find(v=>!M.isValidPrice(v));
  if(bad!==undefined)return U.result(el,'',U.problem('지나온 가격',`${F(bad)}원은 호가단위 눈금에 맞지 않습니다. 2만 원 아래는 10원, 2만 원 이상은 50원 단위로 적어 주세요.`));
  const path=[...head,next],lv=LV(),r=M.simulate({path,levels:lv,qty:5}),st=U.cellStates(lv,path,r.fills);
  const idx=k=>st.map((s,i)=>s===k?i:-1).filter(i=>i>=0),held=idx('held'),armed=idx('armed'),idle=idx('idle');
  const log=r.fills.length?r.fills.map(f=>`${f.side==='buy'?'● 매수':'■ 매도'} ${F(f.price)}원(${F(lv[f.cell])}원 칸)`).join(', '):'아직 체결된 주문이 없습니다';
  const orders=[held.length?`매도 ${held.map(i=>`${F(lv[i+1])}원`).join(' · ')}`:'',armed.length?`매수 ${short(armed.map(i=>lv[i]).reverse())}`:''].filter(Boolean).join(' / ')||'걸린 주문이 없습니다';
  const chart=U.ladder(lv,st,path,{label:`가격 ${path.map(v=>F(v)).join(' → ')}원. 매도 대기 ${held.length}칸, 매수 대기 ${armed.length}칸, 주문 없음 ${idle.length}칸.`});
  U.result(el,chart,`가격이 ${path.map(v=>F(v)).join(' → ')}원으로 움직이는 동안 매수 <b>${r.buys}번</b>, 매도 <b>${r.sells}번</b>이 체결되었습니다. 체결 순서: ${log}.<br>지금 ● 매도 대기 <b>${held.length}칸</b>${held.length?`(${held.map(i=>`${F(lv[i])}원`).join(' · ')} 칸)`:''}, ○ 매수 대기 <b>${armed.length}칸</b>, – 주문 없음 <b>${idle.length}칸</b>입니다. 걸려 있는 주문: ${orders}.${idle.length?` 주문이 없는 칸은 가격이 한 번도 그 칸 위로 올라가 본 적이 없는 칸입니다.`:''}${U.kind('real','닿으면 체결, 빈손 시작. 같은 가격의 대기열과 일부 체결은 넣지 않았습니다.')}`);
 });
};
GLabs.cellpl=el=>{
 U.setup(el,U.number('cbuy','매수가 (원)',100,500000,1,19800,'칸의 아래 가격')+U.number('cstep','간격 (원)',1,10000,1,200,'매도가 = 매수가 + 간격')+U.number('cqty','수량 (주)',1,10000,1,5)+U.select('ckind','종목',[['stock','주식 (거래세 0.20%)'],['etf','국내 주식형 ETF (거래세 없음)']],'stock'));
 U.bind(el,()=>{
  const buy=U.num(el,'cbuy'),step=U.num(el,'cstep'),qty=U.num(el,'cqty'),k=el.querySelector('#ckind').value,c=costsOf(k);
  if(buy===null||step===null||qty===null)return U.result(el,'',U.problem('입력 값','매수가는 100~500,000원, 간격은 1~10,000원, 수량은 1~10,000주 사이의 숫자로 넣어야 합니다.'));
  const sell=buy+step,rt=M.roundTrip(buy,sell,qty,c),x=M.cell(buy,sell,qty,c),be=M.breakEven(buy,qty,c),ms=M.minStep(buy,qty,c);
  const tick=p=>M.tickSize(p,k),ok=(v,p)=>v?`✓ 눈금에 맞음(이 가격대 눈금 ${F(tick(p))}원)`:`✗ 눈금이 아님(이 가격대 눈금 ${F(tick(p))}원, 주문이 접수되지 않습니다)`;
  const chart=U.bars(['차익','매수 수수료','매도 수수료','거래세','남는 몫'],[rt.gross,-rt.buyFee,-rt.sellFee,-rt.tax,rt.net],{signed:true,mark:i=>i===4&&x.profitable,show:v=>U.pwon(v)});
  const verdict=!x.valid?'<strong>✗ 눈금에 맞지 않는 가격이 있어 이 칸은 주문할 수 없습니다.</strong>':rt.net>0?`✓ 비용을 내고도 <b>${W(rt.net)}</b>이 남습니다.`:rt.net===0?'남는 돈이 <b>정확히 0원</b>이라 이 칸은 왕복해도 남기지 못합니다.':`✗ 비용이 차익보다 커서 왕복할 때마다 <b>${W(-rt.net)}</b>을 잃습니다.`;
  U.result(el,chart,`${F(buy)}원에 ${F(qty)}주를 사서 ${F(sell)}원에 팔면 차익 ${W(rt.gross)}에서 매수 수수료 ${W(rt.buyFee)}, 매도 수수료 ${W(rt.sellFee)}, 거래세 ${W(rt.tax)}, 합계 ${W(rt.costs)}이 빠집니다. ${verdict}<br>매수가 ${ok(x.validBuy,buy)}, 매도가 ${ok(x.validSell,sell)}. 간격은 매수가의 ${P(x.stepPct)}이고, 이 종목의 비용률은 약 ${P(M.costRate(c))}입니다.<br>본전 매도가는 <b>${be===null?'찾지 못함':W(be)}</b>, 이 매수가에서 남는 가장 좁은 간격은 <b>${ms===null?'찾지 못함':W(ms)}</b>입니다.${U.kind('real','수수료 0.015%는 가정이며, 수수료·세금의 원 미만은 주문마다 버립니다.')}`);
 });
};
/* 튀는 칸: 바로 아래 칸과도 위 칸과도 간격이 다른 칸. 눈금 반올림이 간격을 흔든 자리다. */
const spikes=steps=>steps.map((s,i)=>i>0&&i<steps.length-1&&s!==steps[i-1]&&s!==steps[i+1]);
function bandText(rep,flag,kind){
 const bands=[...new Set(rep.cells.map(c=>M.tickSize(c.buy,kind)))];
 return bands.map(t=>{const idx=rep.cells.map((c,i)=>M.tickSize(c.buy,kind)===t?i:-1).filter(i=>i>=0),st=idx.map(i=>rep.cells[i].step),odd=idx.filter(i=>flag[i]);
  const list=odd.length&&odd.length<=4?` (${odd.map(i=>`${F(rep.cells[i].buy)}→${F(rep.cells[i].sell)}원 ${F(rep.cells[i].step)}원`).join(', ')})`:'';
  return `눈금 ${F(t)}원 구간 ${idx.length}칸: 간격 ${Math.min(...st)===Math.max(...st)?F(st[0]):`${F(Math.min(...st))}~${F(Math.max(...st))}`}원, ◆ 튀는 칸 ${odd.length}개${list}`;}).join('<br>');
}
GLabs.spacing=el=>{
 U.setup(el,U.number('slo','하단 가격 (원)',1000,200000,10,18000)+U.number('shi','상단 가격 (원)',1000,200000,10,22000)+U.range('scells','칸 수',2,60,1,20)+U.select('smode','나누는 방식',[['arith','등차 · 칸마다 같은 원'],['geo','등비 · 칸마다 같은 %']],'arith'));
 U.bind(el,()=>{
  const lo=U.price(el,'slo'),hi=U.price(el,'shi'),n=U.value(el,'scells'),geo=el.querySelector('#smode').value==='geo';
  if(lo===null||hi===null||Number.isNaN(lo)||Number.isNaN(hi)||lo>=hi)return U.result(el,'',U.problem('가격 범위','하단과 상단은 1,000~200,000원 사이의 눈금에 맞는 가격이고, 하단이 상단보다 낮아야 합니다.'));
  const lv=geo?M.geometricLevels(lo,hi,n):M.arithmeticLevels(lo,hi,n),rep=M.gridReport(lv,5),steps=rep.cells.map(c=>c.step),flag=spikes(steps);
  const merged=n-rep.count,bw=Math.min(18,380/rep.count),top=Math.max(...steps),sy=v=>190-v/top*150;
  let s=`<path d="M60 190H470" stroke="var(--line)"/><text x="60" y="18" class="series">칸마다 간격(원) · ◆ 튀는 칸</text><text x="56" y="${sy(top)+4}" text-anchor="end" class="axis">${F(top)}</text>`;
  steps.forEach((v,i)=>{const x=64+i*(400/rep.count);s+=`<rect x="${x.toFixed(1)}" y="${sy(v).toFixed(1)}" width="${(bw*.8).toFixed(1)}" height="${(190-sy(v)).toFixed(1)}" fill="${flag[i]?'var(--orange)':'var(--blue)'}"/>${flag[i]?`<text x="${(x+bw*.4).toFixed(1)}" y="${sy(v)-6}" text-anchor="middle" class="mark-t">◆</text>`:''}`;});
  s+=`<text x="64" y="210" class="axis">${F(lo)}원</text><text x="468" y="210" text-anchor="end" class="axis">${F(hi)}원</text>`;
  const rows=rep.cells.map((c,i)=>[`${i+1}${flag[i]?' ◆':''}`,F(c.buy),F(c.sell),F(c.step),P(c.stepPct),U.pwon(c.net)+(c.valid?'':' ✗')]);
  const chart=U.svg(`칸마다 간격. 가장 좁은 칸 ${F(rep.minStep)}원, 가장 넓은 칸 ${F(rep.maxStep)}원, 튀는 칸 ${flag.filter(Boolean).length}개.`,s,220)+U.table(['칸','매수가','매도가','간격(원)','간격(%)','칸 몫'],rows,'눈금에 맞춘 뒤의 가격표 (칸당 5주)');
  U.result(el,chart,`${F(lo)}~${F(hi)}원을 ${geo?'등비':'등차'}로 ${n}칸 나눠 눈금에 맞추면 칸 ${rep.count}개, 간격은 <b>${rep.minStep===rep.maxStep?F(rep.minStep):`${F(rep.minStep)}~${F(rep.maxStep)}`}원</b>, 비율로는 <b>${P(rep.minStepPct)}~${P(rep.maxStepPct)}</b>입니다.${merged>0?` 반올림하다 같은 가격이 겹쳐 ${merged}칸을 합쳤습니다.`:''}<br>${bandText(rep,flag,'stock')}<br>칸당 5주로 ${rep.count}칸이 모두 한 바퀴 돌 때의 몫은 <b>${U.pwon(rep.netPerCycle)}</b>, 모든 칸이 사졌을 때 묶이는 돈은 <b>${W(rep.budget)}</b>입니다.${rep.invalid||rep.unprofitable?` <strong>✗ 눈금이 맞지 않는 칸 ${rep.invalid}개, 비용을 못 넘는 칸 ${rep.unprofitable}개</strong>`:' ✓ 모든 칸이 눈금에 맞고 비용을 넘습니다.'}${U.kind('real','눈금은 2023년 1월 개편된 호가단위 표, 가운데면 올림.')}`);
 });
};
GLabs.range=el=>{
 U.setup(el,U.number('rlo','하단 가격 (원)',1000,200000,10,18000)+U.number('rhi','상단 가격 (원)',1000,200000,10,22000)+U.range('rcells','칸 수 (등차)',2,60,1,20));
 U.bind(el,()=>{
  const lo=U.price(el,'rlo'),hi=U.price(el,'rhi'),n=U.value(el,'rcells');
  if(lo===null||hi===null||Number.isNaN(lo)||Number.isNaN(hi)||lo>=hi)return U.result(el,'',U.problem('가격 범위','하단과 상단은 1,000~200,000원 사이의 눈금에 맞는 가격이고, 하단이 상단보다 낮아야 합니다.'));
  const lv=M.arithmeticLevels(lo,hi,n),rep=M.gridReport(lv,5),box=U.PATH.BOX(),r=M.simulate({days:box,levels:lv,qty:5}),o=r.outside,out=(o.below+o.above)/o.points*100,limit=3e6;
  const stepText=rep.minStep===rep.maxStep?`${F(rep.minStep)}원`:`${F(rep.minStep)}~${F(rep.maxStep)}원`;
  const chart=U.pathChart({prices:box.flat(),perDay:8,levels:lv,band:[lo,hi],label:`80거래일 박스권 가상 경로와 ${F(lo)}~${F(hi)}원 격자. 범위 밖 점 ${F(out,3)}%.`});
  const money=rep.budget<=limit?`✓ 한도 300만 원 안이고 ${W(limit-rep.budget)}이 남습니다`:`<strong>✗ 한도 300만 원을 ${W(rep.budget-limit)} 넘습니다</strong>`;
  U.result(el,chart,`${F(lo)}~${F(hi)}원을 ${rep.count}칸으로 나누면 간격은 <b>${stepText}</b>입니다. 칸당 5주로 모든 칸이 사지는 최악의 경우 <b>${W(rep.budget)}</b>이 묶여, ${money}.<br>5장의 80거래일 박스권 경로 640개 점 가운데 범위 아래 ${o.below}개, 위 ${o.above}개로 <b>${F(out,3)}%</b>의 시간 동안 격자가 쉽니다.<br>한 바퀴 몫은 ${U.pwon(rep.netPerCycle)}입니다. ${rep.invalid||rep.unprofitable?`<strong>✗ 눈금이 맞지 않는 칸 ${rep.invalid}개, 비용을 못 넘는 칸 ${rep.unprofitable}개</strong>`:'✓ 모든 칸이 눈금에 맞고 비용을 넘습니다.'}${U.kind('scenario','범위 밖 시간은 지어낸 경로에서 잰 값이며 실제 시세가 아닙니다.')}`);
 });
};
})();
