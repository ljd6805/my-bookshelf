/* 9장 실험(규칙 대입 실험): 사전 규칙이 걸린 주를 일지에서 찾고, 지켰을 때(R1대로 팔고 그 종목의 이후 일지 매매를 따르지 않음)의 끝 금액을 종목별로 계산한다.
   경로 선택 칸은 “선우의 일지”와 “반등 경로(가정)” 둘이다. 반등 경로는 PMath.ASSUME.rebound 한 곳에 있다.
   계산은 PMath.ledger·ruleReplay·r1Weeks·r2Weeks·r3Count·pathRule·stopGap만 쓴다. R2는 걸린 주를 세기만 하고 매매를 바꾸지 않는다.
   26주의 R2 비중(확인 문제의 답)은 화면에 숫자로 적지 않고, 넘은 주를 표시만 한다. 어떤 결과도 규칙을 권하지 않는다(면책 문장). */
(()=>{
'use strict';
const U=PUI,M=PMath,J=M.JOURNAL,RB=M.ASSUME.rebound;
const W=x=>U.won(x),SW=x=>(x>0?'+':'')+U.won(x),pc=x=>U.pct(x,2);
/* 4종목 × 26주 띠: 보유한 주는 칠하고, R1이 걸린 주 ▲, R2를 넘은 주 ■, 일지 매매 ●(삼)·○(팖). */
function timeline(L,r1,r2){
 const cw=14,x0=96,rows=J.names;let s=`<text x="10" y="16" class="series">주마다의 보유와 규칙 표시</text>`;
 rows.forEach((n,k)=>{const y=30+k*30;s+=`<text x="${x0-8}" y="${y+15}" text-anchor="end" class="axis">${n}</text>`;
  L.weeks.forEach(w=>{const x=x0+(w.week-1)*cw,held=!!w.hold[n];s+=`<rect x="${x}" y="${y}" width="${cw-2}" height="20" fill="${held?'var(--panel2)':'var(--chart)'}" stroke="var(--line)" stroke-width=".5"/>`;});
  (r2||[]).filter(h=>h.name===n).forEach(h=>{s+=`<rect x="${x0+(h.week-1)*cw+2}" y="${y+2}" width="${cw-6}" height="16" fill="none" stroke="var(--accent)" stroke-width="1.6"/>`;});
  (r1||[]).filter(h=>h.name===n).forEach(h=>{const cx=x0+(h.week-1)*cw+(cw-2)/2;s+=`<path d="M${cx} ${y+4}l5 10h-10z" fill="var(--orange)"/>`;});
  J.trades.filter(t=>t.name===n).forEach(t=>{const cx=x0+(t.week-1)*cw+(cw-2)/2;s+=t.side==='B'?`<circle cx="${cx}" cy="${y+25}" r="2.6" fill="var(--blue)"/>`:`<circle cx="${cx}" cy="${y+25}" r="2.6" fill="var(--chart)" stroke="var(--blue)" stroke-width="1.4"/>`;});});
 [1,5,10,15,20,26].forEach(w=>{s+=`<text x="${x0+(w-1)*cw+6}" y="${30+rows.length*30+12}" text-anchor="middle" class="axis">${w}주</text>`;});
 const ly=30+rows.length*30+34;s+=`<text x="10" y="${ly}" class="axis">칠한 칸 보유 · ▲ R1 걸림 · ■ 테두리 R2 넘음 · ● 삼 · ○ 팖</text>`;
 return U.svg('선우의 일지 26주의 보유와 규칙 표시',s,ly+12,480);
}
function journalPart(el,o){
 const L=M.ledger(),R=M.ruleReplay({r1:o.l1,r2:o.l2,r1off:!o.r1}),r1=o.r1?R.r1:null,r2=o.r2?R.r2:null;
 const split=Object.entries(R.split).filter(([,v])=>v.diff!==0);
 let chart=timeline(L,r1&&r1.hits,r2);
 if(o.r1)chart+=U.table(['종목','일지대로','규칙대로','차이'],Object.entries(R.split).map(([n,v])=>[n,SW(v.actual),SW(v.rule),v.diff?`<b>${SW(v.diff)}</b>`:'0원']),'종목별 손익 (실현 + 평가)','fit');
 let text=o.r1?(r1.first.length?`R1(평균 단가보다 ${U.sfmt(o.l1*100,1)}% 낮으면 팔기)이 처음 걸린 보유: ${r1.first.map(x=>`${x.week}주 ${x.name} ${pc(x.drop)}`).join(', ')}. 주 종가로 확인하므로 한도보다 더 내린 가격에 팝니다. 걸린 주를 모두 세면 ${r1.hits.length}번입니다.`:`R1(−${U.sfmt(o.l1*100,1)}%)은 26주 동안 한 번도 걸리지 않았습니다.`)
  +`<br>지켰다면 끝 금액 <b>${W(R.rule)}</b>, 일지대로 ${W(R.actual)}, 차이 <b>${SW(R.diff)}</b>${split.length?`(${split.map(([n,v])=>`${n} ${SW(v.diff)}`).join(', ')})`:''}. “지켰다면”은 R1이 처음 걸린 주의 종가에 그 보유를 모두 팔고, 그 종목의 이후 일지 매매(다시 사기와 물타기)는 하지 않는다고 놓은 계산입니다.`:`R1을 끄면 일지대로의 끝 금액 ${W(R.actual)}만 나옵니다.`;
 if(o.r2)text+=`<br>R2(한 종목 ${U.sfmt(o.l2*100,0)}% 이하)를 넘은 주: ${r2.length?`${r2.length}번(처음 ${r2[0].week}주 ${r2[0].name} ${U.pct(r2[0].share,1)})`:'없음'}. R2는 세기만 하고 매매를 바꾸지 않습니다.`;
 text+=`<br>R3(매수 기록에 반대 증거 적기): 매수 ${R.r3.buys}건 중 ${R.r3.missing}건에서 지키지 않았습니다.`;
 return {chart,text,kinds:['real','scenario']};
}
function reboundPart(o){
 const r=M.pathRule(RB,o.l1),pts=RB.prices.map((p,i)=>[RB.firstWeek+i,p]),lim=r.avg*(1-o.l1),last=RB.firstWeek+RB.prices.length-1;
 const points=o.r1&&r.trigger!=null?[{name:`R1이 걸린 ${RB.firstWeek+r.trigger}주 (${pc(r.triggerDrop)})`,x:RB.firstWeek+r.trigger,y:RB.prices[r.trigger],shape:'▲',color:'var(--orange)'}]:[];
 const chart=U.xy({series:[{name:`${RB.name} 종가 · ${RB.label}`,pts,color:'var(--blue)',marks:pts.map((_,i)=>i),shape:'●'},{name:'평균 단가 (수수료 포함)',pts:[[RB.firstWeek,r.avg],[last,r.avg]],color:'var(--muted)',dash:'dash'},...(o.r1?[{name:`R1 선 (−${U.sfmt(o.l1*100,1)}%)`,pts:[[RB.firstWeek,lim],[last,lim]],color:'var(--orange)',dash:'dot'}]:[])],points,
  xlabel:'주',ylabel:'원',xtick:v=>U.sfmt(v,0),ytick:v=>U.sfmt(v,0),h:330,label:`반등 경로: 규칙대로 ${W(r.rule)}, 들고 있으면 ${W(r.hold)}`});
 const head=`${RB.label}: ${RB.firstWeek}주 종가 ${U.fmt(RB.prices[0])}원에 ${RB.qty}주(평균 단가 ${U.sfmt(r.avg,2)}원), 15주부터 반등해 ${last}주 ${U.fmt(RB.prices.at(-1))}원.`;
 const text=!o.r1?`${head}<br>R1을 끄면 들고 있다 ${last}주에 판 손익 <b>${SW(r.hold)}</b>만 나옵니다.`:r.trigger==null?`${head}<br>R1(−${U.sfmt(o.l1*100,1)}%)이 걸리지 않아 규칙대로 해도 들고 있는 것과 같습니다: <b>${SW(r.hold)}</b>.`
  :`${head}<br>R1이 ${RB.firstWeek+r.trigger}주 ${U.fmt(RB.prices[r.trigger])}원(${pc(r.triggerDrop)})에서 걸려 팔면 <b>${SW(r.rule)}</b>, 들고 있다 ${last}주에 팔면 <b>${SW(r.hold)}</b>입니다. 이 경로에서는 ${r.rule<r.hold?'R1을 지킨 쪽이 손해입니다':'R1을 지킨 쪽이 손실이 작습니다'}.`;
 return {chart,text,kinds:['real','scenario']};
}
PLabs['rule-replay']=el=>{
 U.setup(el,U.select('rpath','경로',[['journal','선우의 일지'],['rebound','반등 경로(가정)']],'journal','같은 규칙을 다른 경로에 대 봅니다')
  +U.group('규칙 (계산 연습에 쓰는 예)',U.check('rr1','R1 손실 한도 켜기',true)+U.number('rl1','R1: 평균 단가보다 몇 % 낮으면 팔기',1,50,0.5,J.rules.R1.limit*100)+U.check('rr2','R2 비중 한도 켜기',true)+U.number('rl2','R2: 한 종목 비중 한도 (%)',5,100,1,J.rules.R2.limit*100))
  +U.group('규칙 가격과 실제로 판 가격 (비용 제외)',U.number('gq','주식 수',1,100000,1,250)+U.number('gr','규칙 가격 (원)',1,1000000,1,19000)+U.number('gs','실제로 판 가격 (원)',1,1000000,1,17600)),true);
 U.bind(el,()=>{
  const l1=U.num(el,'rl1'),l2=U.num(el,'rl2'),q=U.num(el,'gq',true),gr=U.num(el,'gr',true),gs=U.num(el,'gs',true);
  if(l1===null)return U.result(el,'',U.problem('R1 한도','1%에서 50% 사이로 넣어 주세요.'));if(l2===null)return U.result(el,'',U.problem('R2 한도','5%에서 100% 사이로 넣어 주세요.'));
  for(const [v,n] of [[q,'주식 수'],[gr,'규칙 가격'],[gs,'실제로 판 가격']])if(v===null)return U.result(el,'',U.problem(n,'1 이상의 정수로 넣어 주세요.'));
  const o={l1:l1/100,l2:l2/100,r1:U.checked(el,'rr1'),r2:U.checked(el,'rr2')},part=U.value(el,'rpath')==='rebound'?reboundPart(o):journalPart(el,o),gap=M.stopGap(q,gr,gs);
  const gapText=`규칙 가격 ${U.fmt(gr)}원 대신 ${U.fmt(gs)}원에 ${U.fmt(q)}주를 팔면 (${U.fmt(gr)} − ${U.fmt(gs)}) × ${U.fmt(q)} = <b>${W(Math.abs(gap))}</b>${gap>=0?'만큼 손실이 더 큽니다':'만큼 덜 잃습니다'}(비용 제외).`;
  U.result(el,part.chart,`${part.text}<br>${gapText}<br>${U.DISCLAIMER} 사전 계획(if-then)의 효과를 보고한 연구는 ${M.TEXT.ifThen}.${U.kind(part.kinds)}`);
 });
};
})();
