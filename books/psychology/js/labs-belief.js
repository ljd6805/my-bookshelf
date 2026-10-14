/* 2부 실험: 추천 1,000종목 실험(4장), 증거별 우도비로 확신 계산 실험(5장), 적중률과 비용 실험(6장).
   계산은 PMath.bayes·oddsUpdate·intervals·binomCdf·turnover·costDrag·roundTrip·growthAfter만 쓴다.
   기본값은 L2와 확인 문제의 입력과 다르다: 4장 2%·60%·10%, 5장 선우의 증거 다섯 개, 6장 범위 9개·6개 맞음·연 회전율 300%.
   6장의 증권거래세·수수료는 ⏱ 값이라 꼬리표와 확인일, 재확인 문장을 함께 적는다. */
(()=>{
'use strict';
const U=PUI,M=PMath,J=M.JOURNAL;
const p1=x=>U.pct(x,1),c1=x=>U.sfmt(x,Number.isInteger(M.round(x,6))?0:1);
/* ── 4장 ── 1,000칸 격자. 맞은 추천 ▲, 틀린 추천 ■, 추천받지 못한 두 배 종목 ○. */
function grid(g){
 const cols=40,size=11,cells=[],hits=Math.round(g.hits),miss=Math.round(g.doubles)-hits,fh=Math.round(g.falseHits);
 for(let i=0;i<1000;i++)cells.push(i<hits?'hit':i<hits+miss?'miss':i<hits+miss+fh?'false':'none');
 const fill={hit:'var(--accent)',miss:'var(--chart)',false:'var(--orange)',none:'var(--panel2)'};let s='';
 cells.forEach((c,i)=>{const x=10+(i%cols)*size,y=10+Math.floor(i/cols)*size;s+=`<rect x="${x}" y="${y}" width="${size-2}" height="${size-2}" fill="${fill[c]}"${c==='miss'?' stroke="var(--accent)"':''}/>`;});
 const ly=10+25*size+20;[['hit','▲ 두 배가 된 추천 종목'],['false','■ 두 배가 되지 않은 추천 종목'],['miss','○ 추천받지 못한 두 배 종목']].forEach(([c,t],k)=>{s+=`<rect x="10" y="${ly+k*20-9}" width="10" height="10" fill="${fill[c]}"${c==='miss'?' stroke="var(--accent)"':''}/><text x="28" y="${ly+k*20}" class="axis">${t}</text>`;});
 return U.svg(`1,000종목 격자: 맞은 추천 ${hits}칸, 틀린 추천 ${fh}칸`,s,ly+56,460);
}
PLabs['base-rate-grid']=el=>{
 const B0=M.ASSUME.baserate;
 U.setup(el,U.number('bb','기저율: 두 배가 되는 종목의 비율 (%)',0,100,0.1,B0.base*100,'가정이며 실제 비율이 아닙니다')+U.number('bh','적중률: 두 배가 될 종목을 추천하는 비율 (%)',0,100,0.1,B0.hit*100)+U.number('bf','오경보율: 두 배가 되지 않을 종목을 추천하는 비율 (%)',0,100,0.1,B0.falseAlarm*100));
 U.bind(el,()=>{
  const b=U.num(el,'bb'),h=U.num(el,'bh'),f=U.num(el,'bf');
  if(b===null)return U.result(el,'',U.problem('기저율','0%에서 100% 사이로 넣어 주세요.'));if(h===null)return U.result(el,'',U.problem('적중률','0%에서 100% 사이로 넣어 주세요.'));if(f===null)return U.result(el,'',U.problem('오경보율','0%에서 100% 사이로 넣어 주세요.'));
  const r=M.bayes(b/100,h/100,f/100),g=r.grid;
  if(r.posterior==null)return U.result(el,'',U.problem('적중률과 오경보율','추천받는 종목이 하나도 없어 맞을 확률을 계산할 수 없습니다.'));
  const lr=r.lr==null?'오경보율이 0이라 우도비를 계산하지 않습니다':`우도비(적중률 ÷ 오경보율) = ${U.sfmt(r.lr,2)}`;
  U.result(el,grid(g),`1,000종목 가운데 두 배가 되는 종목 ${c1(g.doubles)}개, 추천받은 종목은 맞은 추천 ${c1(g.hits)} + 틀린 추천 ${c1(g.falseHits)} = ${c1(g.flagged)}개입니다.<br>추천이 맞을 확률 = ${c1(g.hits)} ÷ ${c1(g.flagged)} = <b>${p1(r.posterior)}</b>. ${lr}.<br>격자는 비율을 칸 수로 바꿔 그린 것이며, 칸 수는 가장 가까운 정수로 반올림했습니다.${U.kind(['real','scenario'],'세 비율은 이 책의 가정입니다.')}`);
 });
};
/* ── 5장 ── 증거마다 켜기와 우도비. 지지/반대는 일지 앞면 메모대로 고정한다. */
PLabs['likelihood-odds']=el=>{
 const C=J.memo.confirm,E=C.evidence;
 const rows=E.map((e,i)=>U.check('ce'+i,`${e.name} (${e.side==='for'?'지지':'반대'})`,true)+U.number('cl'+i,`우도비 · ${e.name}`,0.01,100,0.01,e.lr)).join('');
 U.setup(el,U.number('cp','사전 확률 (%)',1,99,0.1,C.prior*100,'증거를 보기 전의 확신')+U.group('증거 다섯 개 (일지 앞면 메모, 우도비는 가정)',rows),true);
 U.bind(el,()=>{
  const prior=U.num(el,'cp');if(prior===null)return U.result(el,'',U.problem('사전 확률','1%에서 99% 사이로 넣어 주세요.'));
  const on=E.map((_,i)=>U.checked(el,'ce'+i)),lrs=E.map((_,i)=>U.num(el,'cl'+i));
  for(let i=0;i<E.length;i++)if(lrs[i]===null)return U.result(el,'',U.problem(`${E[i].name}의 우도비`,'0.01에서 100 사이로 넣어 주세요.'));
  const used=E.map((e,i)=>({e,lr:lrs[i],on:on[i]})).filter(x=>x.on),all=M.oddsUpdate(prior/100,used.map(x=>x.lr)),sup=M.oddsUpdate(prior/100,used.filter(x=>x.e.side==='for').map(x=>x.lr));
  const prod=xs=>xs.length?xs.map(x=>U.sfmt(x,2)).join(' × '):'1(켜진 증거 없음)';
  const chart=U.columns({labels:['사전','켜진 지지 증거만','켜진 증거 모두'],values:[prior,sup.p*100,all.p*100],fmt:v=>U.sfmt(v,1)+'%',tick:v=>U.sfmt(v,0)+'%',title:'확신 (%)',h:250,label:`사전 ${U.sfmt(prior,1)}%, 지지만 ${p1(sup.p)}, 모두 ${p1(all.p)}`,colors:['var(--muted)','var(--orange)','var(--blue)']})
   +U.table(['증거','쪽','우도비','켜짐'],E.map((e,i)=>[e.name,e.side==='for'?'지지':'반대',U.sfmt(lrs[i],2),on[i]?'✓ 켬':'– 끔']),'증거와 우도비','fit');
  U.result(el,chart,`사전 오즈 = ${U.sfmt(prior,1)} ÷ ${U.sfmt(100-prior,1)} = ${U.sfmt(all.priorOdds,2)}.<br>켜진 증거 모두: 오즈 ${U.sfmt(all.priorOdds,2)} × ${prod(used.map(x=>x.lr))} = ${U.sfmt(all.odds,2)} → 확신 <b>${p1(all.p)}</b>.<br>켜진 지지 증거만: 오즈 ${U.sfmt(sup.odds,2)} → 확신 <b>${p1(sup.p)}</b>. 두 확신의 차이는 ${U.ppt(sup.p-all.p,1)}입니다.<br>우도비 1인 증거는 켜도 꺼도 확신이 그대로입니다.${U.kind(['real','scenario'],'증거가 서로 독립이라고 놓아야 우도비를 곱할 수 있습니다.')}`);
 });
};
/* ── 6장 ── */
function intervalTable(iv){return U.table(['거래','종목','90% 범위 (원)','4주 뒤 종가','채점'],iv.rows.map(r=>[r.n,r.name,`${U.fmt(r.range[0])}~${U.fmt(r.range[1])}`,U.fmt(r.price),r.hit?'✓ 맞음':'✗ 벗어남']),'선우가 적은 90% 범위 9개','cards');}
PLabs['interval-cost']=el=>{
 const iv=M.intervals(),C=M.ASSUME.cost;
 U.setup(el,U.group('90% 범위 채점',U.number('in','적은 범위 수 n',1,200,1,iv.n,'선우의 일지는 9개')+U.number('ik','맞은 수 k',0,200,1,iv.hits,'선우의 일지는 6개'))
  +U.group('매매 비용',U.number('ct','연 회전율 (%)',0,5000,1,C.turnovers[1]*100,'한 해 매도 금액 ÷ 평균 평가액')+U.check('cetf','ETF만 사고팔기 (거래세 없음)',false)+U.number('cg','비용 전 연 수익률 (%, 가정)',-20,30,0.1,C.gross*100)+U.number('cy','기간 (년)',1,40,1,C.years)+U.number('cs','시작 금액 (만 원)',100,100000,10,C.start)),true);
 U.bind(el,()=>{
  const n=U.num(el,'in',true),k=U.num(el,'ik',true),tv=U.num(el,'ct'),g=U.num(el,'cg'),y=U.num(el,'cy',true),s=U.num(el,'cs'),etf=U.checked(el,'cetf');
  if(n===null)return U.result(el,'',U.problem('범위 수','1에서 200 사이의 정수로 넣어 주세요.'));if(k===null)return U.result(el,'',U.problem('맞은 수','0 이상의 정수로 넣어 주세요.'));
  if(k>n)return U.result(el,'',U.problem('맞은 수',`맞은 수 k(${k})가 범위 수 n(${n})보다 많습니다.`));
  for(const [v,name,why] of [[tv,'연 회전율','0%에서 5,000% 사이로 넣어 주세요.'],[g,'비용 전 연 수익률','−20%에서 30% 사이로 넣어 주세요.'],[y,'기간','1년에서 40년 사이의 정수로 넣어 주세요.'],[s,'시작 금액','100만 원에서 100,000만 원 사이로 넣어 주세요.']])if(v===null)return U.result(el,'',U.problem(name,why));
  const pk=M.binomCdf(k,n,M.ASSUME.interval),to=M.turnover(),rt=M.roundTrip(etf),drag=M.costDrag(tv/100,etf),free=M.growthAfter(s,g/100,0,y),net=M.growthAfter(s,g/100,drag,y),yearCost=Math.round(s*1e4*tv/100*rt);
  const chart=intervalTable(iv)+U.columns({labels:['비용 없을 때',`비용 ${U.sfmt(drag*100,2)}%p`],values:[free,net],fmt:v=>U.sfmt(v,1)+'만',tick:v=>U.sfmt(v,0),title:`${U.sfmt(s,0)}만 원이 ${y}년 뒤 (만 원)`,h:240,label:`비용 없을 때 ${U.sfmt(free,1)}만 원, 비용을 빼면 ${U.sfmt(net,1)}만 원`,colors:['var(--muted)','var(--blue)']});
  const text=`적중률 = ${k} ÷ ${n} = <b>${p1(k/n)}</b>. 진짜 90% 범위라면 ${n}개 중 ${U.sfmt(n*0.9,1)}개쯤 맞아야 하고, ${k}개 이하만 맞을 확률 P(X ≤ ${k}) = <b>${p1(pk)}</b>입니다.${n<30?' 범위 수가 적어 이 결과만으로 확정하지 못합니다.':''}`
   +`<br>선우의 실제 매매: 26주 매도 ${U.won(to.sells)} ÷ 평균 평가액 ${U.won(Math.round(to.avgEquity))} = ${U.sfmt(to.half*100,1)}%(연으로 ${U.sfmt(to.annual*100,1)}%), 실제 비용 ${U.won(to.cost)}(수수료 ${U.won(to.fees)}, 거래세 ${U.won(to.taxes)}).`
   +`<br>왕복 비용률 = 수수료 ${U.sfmt(M.MARKET.fee.value*100,3)}% × 2${etf?'(ETF는 거래세 없음)':` + 거래세 ${U.sfmt(M.MARKET.tradeTax.value*100,2)}%`} = ${U.sfmt(rt*100,2)}%. 연 비용 = ${U.sfmt(tv,0)}% × ${U.sfmt(rt*100,2)}% = <b>${U.sfmt(drag*100,2)}%p</b>(한 해 약 ${U.won(yearCost)}). ${U.sfmt(s,0)}만 원은 ${y}년 뒤 비용 없이 ${U.sfmt(free,1)}만 원, 비용을 빼면 <b>${U.sfmt(net,1)}만 원</b>입니다.`
   +`<br>${U.timed('tradeTax')} ${U.timed('fee')} ${U.RECHECK}`;
  U.result(el,chart,`${text}${U.kind(['real','scenario','news'],'비용 전 수익률과 회전율은 가정입니다.')}`);
 });
};
})();
