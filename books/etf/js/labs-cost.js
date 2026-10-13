/* 5~6장 실험: 추적 괴리·추적 오차와 총비용, 레버리지·인버스 ETF의 하루 재조정 매매 금액.
   계산은 EMath.periodReturn·trackingError·costs·grow·costGap·rebalance·priceLimit. 가람200의 총비용은 EMath.ETFS에서 읽는다.
   닷새 지수 기록과 두 ETF 기록, 비용 전 수익률은 미리 정한 가상 시나리오다. 6장은 하루 한 번의 재조정만 계산한다.
   여러 날을 이어 붙여 2배 상품의 값이 깎이는 크기는 8권 #drag가 계산하므로 여기에는 그런 예제를 두지 않는다. */
(()=>{
'use strict';
const U=EUI,M=EMath,F=U.fmt,W=U.won0;
const IDX=[.010,-.005,.008,-.003,.006],RECS={rec1:IDX.map(r=>r-0.0001),rec2:IDX.map((r,i)=>r+[.0005,-.0005,.0005,-.0005,0][i])};
const RNAMES=[['rec1','기록 ① · 날마다 0.01%p씩 덜 움직임'],['rec2','기록 ② · +0.05·−0.05%p로 엇갈림']];
const ppv=(x,d)=>`${U.splus(x*100+Math.sign(x)*1e-12,d??(Math.abs(x)<0.0005&&Math.abs(x)>1e-12?3:2))}%p`;
/* 5장: 1단계 추적 괴리·추적 오차, 2단계 총비용과 n년 뒤 금액. */
function trackPart(rec){
 const etf=RECS[rec],te=M.trackingError(etf,IDX),td=M.periodReturn(etf)-M.periodReturn(IDX);
 const chart=U.columns({labels:['1일','2일','3일','4일','5일'],values:te.diffs.map(d=>d*100),fmt:v=>U.splus(v,2),tick:v=>U.sfmt(v,2),title:'하루 차이 (ETF − 지수, %p)',h:210,label:`하루 차이 ${te.diffs.map(d=>ppv(d,2)).join(', ')}`,mark:()=>false});
 const text=`<b>1단계</b> ${RNAMES.find(r=>r[0]===rec)[1].split(' · ')[0]}: 닷새 지수 수익률 ${U.pct(M.periodReturn(IDX),3)}, ETF ${U.pct(M.periodReturn(etf),3)}라 추적 괴리는 <b>${ppv(td)}</b>입니다. 하루 차이의 표준편차 σ는 ${U.sfmt(te.daily*100,2)}%p이고, × √250 = 추적 오차 연 <b>${U.sfmt(te.annual*100,2)}%p</b>입니다. ${te.annual<1e-9?'날마다 똑같이 뒤처지면 흔들림(추적 오차)은 0이어도 기간 차이(추적 괴리)는 쌓입니다.':'차이가 엇갈려 기간 차이(추적 괴리)는 거의 0이어도 흔들림(추적 오차)은 큽니다.'}`;
 return {chart,text};
}
ELabs['tracking-cost']=el=>{
 U.setup(el,`<fieldset class="step"><legend>1단계 · 추적 괴리와 추적 오차</legend>${U.select('trec','하루 수익률 기록 (가상)',RNAMES,'rec1')}</fieldset><fieldset class="step"><legend>2단계 · 총비용과 10년 뒤 금액</legend>${U.number('tfee','총보수 (%)',0,9.99,0.01,0.15)+U.number('tother','기타비용 (%)',0,9.99,0.01,0.03)+U.number('ttrade','매매중개수수료 (%)',0,9.99,0.01,0.04)+U.number('tprin','원금 (만 원)',1,100000,1,1000)+U.number('tyears','둘 햇수 (년)',1,50,1,10)+U.range('tr','비용 전 수익률 (연 %, 가상)',-5,15,0.5,5)}</fieldset>`);
 U.bind(el,()=>{
  const rec=U.value(el,'trec'),fee=U.num(el,'tfee'),other=U.num(el,'tother'),trade=U.num(el,'ttrade'),p=U.num(el,'tprin'),n=U.num(el,'tyears'),r=+U.value(el,'tr')/100;
  for(const [v,name] of [[fee,'총보수'],[other,'기타비용'],[trade,'매매중개수수료']])if(v===null)return U.result(el,'',U.problem(name,'0에서 9.99 사이의 숫자(%)를 넣어야 합니다.'));
  if(p===null)return U.result(el,'',U.problem('원금','1에서 100,000 사이의 숫자(만 원)를 넣어야 합니다.'));
  if(n===null||!Number.isInteger(n))return U.result(el,'',U.problem('둘 햇수','1에서 50 사이의 정수(년)를 넣어야 합니다.'));
  const c=M.costs(fee/100,other/100,trade/100),cg=M.etfCost('garam'),P=p*1e4,g=M.costGap(P,r,c.total,cg.total,n),T=trackPart(rec);
  const years=[...Array(n+1).keys()],line=U.xy({series:[{name:`입력한 비용 ${U.pct(c.total)}`,pts:years.map(y=>[y,M.grow(P,r,c.total,y)/1e4])},{name:`가람200 ${U.pct(cg.total)}`,pts:years.map(y=>[y,M.grow(P,r,cg.total,y)/1e4])}],xlab:'년',yfmt:v=>F(v),h:240,label:`${n}년 뒤 입력한 비용의 ETF ${W(g.a)}, 가람200 ${W(g.b)}`,dots:[{x:n,y:g.a/1e4,label:`${F(g.a)}원`,left:true,dy:14},{x:n,y:g.b/1e4,label:`${F(g.b)}원`,left:true,shape:'square'}]});
  const s2=`<b>2단계</b> 총보수 ${U.pct(fee/100)} + 기타비용 ${U.pct(other/100)} = TER <b>${U.pct(c.ter)}</b>, + 매매중개수수료 ${U.pct(trade/100)} = 총비용 <b>${U.pct(c.total)}</b>입니다. ${U.man(P,'원')}을 ${F(n)}년 두고 비용 전 수익률을 연 ${F(r*100,1)}%로 놓으면 ${F(n)}년 뒤 이 ETF는 <b>${W(g.a)}</b>, 가람200(총비용 ${U.pct(cg.total)})은 <b>${W(g.b)}</b>이고, 두 금액의 차이는 <b>${W(g.diff)}</b>입니다(반올림 전 차이를 반올림).`;
  U.result(el,T.chart+line,`${T.text}<br>${s2}<br>추적 괴리에는 비용 밖의 요인도 들어가므로 총비용과 꼭 같지 않습니다.${U.kind(['real','scenario'],'닷새 기록과 비용 전 수익률은 가상이고, 비용은 해마다 끝에 뗀다는 단순화입니다. 250거래일 연율화는 이 책의 가정입니다.')}`);
 });
};
/* 6장: 순자산·배수·하루 지수 수익률 → 아침 노출, 하루 뒤 노출, 새 순자산, 목표 노출, 재조정 매매. 하루만 계산한다. */
const eokv=v=>`${U.sfmt(v,Number.isInteger(Math.round(v*100)/100)?0:2)}억 원`;
function tradeWords(m,trade){
 if(Math.abs(trade)<1e-9)return '재조정 매매가 필요 없습니다';
 if(m>0)return trade>0?`장 마감 뒤 <b>${eokv(trade)}어치를 삽니다(매수)</b>`:`장 마감 뒤 <b>${eokv(-trade)}어치를 팝니다(매도)</b>`;
 return trade>0?`<b>${eokv(trade)}어치를 되삽니다</b>(매도 노출을 줄임)`:`<b>${eokv(-trade)}어치를 더 팝니다</b>(매도 노출을 늘림)`;
}
ELabs.rebalance=el=>{
 U.setup(el,U.number('rnav','아침 순자산 (억 원)',1,100000,1,100)+U.select('rmult','배수',[['2','2배 (레버리지)'],['-1','−1배 (인버스)']],'2')+U.range('rret','하루 지수 수익률 (%)',-10,10,1,10));
 U.bind(el,()=>{
  const nav=U.num(el,'rnav'),m=+U.value(el,'rmult'),r=+U.value(el,'rret')/100;
  if(nav===null)return U.result(el,'',U.problem('아침 순자산','1에서 100,000 사이의 숫자(억 원)를 넣어야 합니다.'));
  const d=M.rebalance(nav,m,r),inv=m<0,ex=inv?'매도 노출':'노출',abs=v=>eokv(Math.abs(v));
  const chart=U.columns({labels:['아침 노출','하루 뒤 노출','목표 노출'],values:[d.exposure,d.after,d.target],mark:i=>i===2,fmt:v=>U.sfmt(v,Number.isInteger(Math.round(v*100)/100)?0:2),tick:v=>U.sfmt(v,0),title:`노출 (억 원)${inv?' · 음수는 매도 노출':''} · 재조정 ${U.splus(d.trade,Number.isInteger(Math.round(d.trade*100)/100)?0:2)}억`,h:240,label:`아침 ${ex} ${abs(d.exposure)}, 하루 뒤 ${abs(d.after)}, 새 순자산 ${eokv(d.nav)}, 목표 ${abs(d.target)}`});
  const tbl=U.table(['단계','금액','계산'],[['아침 '+ex,abs(d.exposure),`${U.sfmt(m)} × ${eokv(nav)}`],['하루 뒤 '+ex,abs(d.after),`${abs(d.exposure)} × (1 ${r<0?'−':'+'} ${F(Math.abs(r)*100)}%)`],['새 순자산',`<b>${eokv(d.nav)}</b>`,`${eokv(nav)} × (1 ${m*r<0?'−':'+'} ${F(Math.abs(m*r)*100)}%)`],['▲ 목표 '+ex,`<b>${abs(d.target)}</b>`,`${Math.abs(m)} × ${eokv(d.nav)}`],['재조정 매매',`<b>${U.splus(d.trade,Number.isInteger(Math.round(d.trade*100)/100)?0:2)}억 원</b>`,`${U.sfmt(m)} × (${U.sfmt(m)} − 1) × ${U.splus(r*100,0)}% × ${eokv(nav)}`]],`${m===2?'2배':'인버스(−1배)'} · 지수 ${U.splus(r*100,0)}%인 하루`);
  const lim=M.priceLimit(m);
  U.result(el,chart+tbl,`아침 순자산 ${eokv(nav)}인 ${m===2?'2배':'인버스(−1배)'} 상품은 ${ex} <b>${abs(d.exposure)}</b>${U.josa(abs(d.exposure),'으로','로')} 시작합니다. 지수 ${U.splus(r*100,0)}%인 날 ${ex}은 <b>${abs(d.after)}</b>, 순자산은 <b>${eokv(d.nav)}</b>이 됩니다. 다음 날에도 ${m===2?'2배':'−1배'}가 되려면 ${ex}이 ${abs(d.target)}이어야 하므로 ${tradeWords(m,d.trade)}.<br>${r>0?'지수가 오른 날 뒤에는 사는 쪽(인버스는 되사는 쪽)으로':r<0?'지수가 내린 날 뒤에는 파는 쪽(인버스는 더 파는 쪽)으로':'지수가 그대로면 어느 쪽으로도'} 움직입니다. 이 상품의 가격제한폭은 기준가격 ±${U.pct(M.RULES.priceLimit,0)} × ${Math.abs(m)} = ±${U.pct(lim,0)}입니다.<br>이 실험은 하루 한 번의 재조정만 계산합니다. 여러 날을 이어 붙였을 때 값이 얼마나 깎이는지는 <a href="../volatility/#drag">가격은 어떻게 흔들리는가 02 · −50% 다음 +50%: 변동성 손실과 레버리지 ETF의 일일 재조정</a>(깊이 보기, 뒤 권)에서 계산합니다.${U.kind(['real','official'],'가격제한폭은 한국거래소 규정포털 원문입니다. 비용·차입 이자·추적 괴리는 넣지 않았고, 실제 상품이 선물·스왑을 언제 얼마나 거래하는지는 상품마다 다릅니다.')}`);
 });
};
})();
