/* 5~7장 실험: FCFF 실적과 2026~2030 예측표, CAPM과 WACC, 영구가치와 주당 가치 계단.
   계산은 VMath.forecast·actualFcff·fcff·wacc·dcf·terminal만 쓴다. 할인율 8.3%와 영구성장률 2%는 ASSUME.base 값이다.
   g ≥ r이면 VMath가 'g ≥ r' 오류를 던지고, 화면은 값 대신 ✗ 글자 문장을 보인다. */
(()=>{
'use strict';
const U=VUI,M=VMath,A=M.ASSUME,B=A.base,E=U.ek,W=U.won,N=U.n1,F=U.n1f;
VLabs['fcff-forecast']=el=>{
 U.setup(el,`<p class="rate-banner">할인율은 <b>${U.pct(B.r)}</b>로 고정합니다. 6장에서 이 숫자를 국고채 금리·위험 프리미엄·베타로 계산합니다. 법인세는 영업이익 × 20%(5권과 같은 가정)입니다.</p>`+U.group('2026~2030 예측 가정',U.number('fgrowth','매출 성장률 (%)',-30,50,0.1,B.growth*100)+U.number('fmargin','영업이익률 (%)',-50,80,0.1,B.margin*100,'2024·2025 실적 12%')+U.number('fwc','운전자본 ÷ 매출 (%)',0,100,0.1,B.wcRatio*100,'2024년 18%, 2025년 32.2%')+U.select('fppe','유형자산 ÷ 매출',[['base','708 ÷ 1,800 = 39.3% 유지'],['0.35','35%'],['0.45','45%']],'base','설비투자 = 유형자산 증가 + 감가상각'))+U.group('한 해 FCFF 직접 계산',U.number('fop','영업이익 (억 원)',-100000,1000000,0.1,A.years[2024].op)+U.number('fdep','감가상각 (억 원)',0,1000000,0.1,A.years[2024].dep)+U.number('fcapex','설비투자 (억 원)',0,1000000,0.1,A.years[2024].capex)+U.number('fdnwc','운전자본 증가 (억 원)',-1000000,1000000,0.1,A.years[2024].nwc-A.years[2024].nwcOpen,'줄면 음수')+U.number('fr1','1년 뒤에 받는다고 놓을 때 할인율 (%)',0,50,0.1,B.r*100)),true);
 U.bind(el,()=>{
  const g=U.num(el,'fgrowth'),mg=U.num(el,'fmargin'),wc=U.num(el,'fwc'),ppe=U.value(el,'fppe'),op=U.num(el,'fop'),dep=U.num(el,'fdep'),cx=U.num(el,'fcapex'),dn=U.num(el,'fdnwc'),r1=U.num(el,'fr1');
  for(const [v,name,why] of [[g,'매출 성장률','−30%에서 50% 사이로 넣어야 합니다.'],[mg,'영업이익률','−50%에서 80% 사이로 넣어야 합니다.'],[wc,'운전자본 비율','0%에서 100% 사이로 넣어야 합니다.'],[op,'영업이익','숫자(억 원)를 넣어야 합니다.'],[dep,'감가상각','0 이상의 숫자(억 원)를 넣어야 합니다.'],[cx,'설비투자','0 이상의 숫자(억 원)를 넣어야 합니다.'],[dn,'운전자본 증가','숫자(억 원)를 넣어야 합니다.'],[r1,'할인율','0%에서 50% 사이로 넣어야 합니다.']])if(v===null)return U.result(el,'',U.problem(name,why));
  const f=M.forecast({growth:g/100,margin:mg/100,wcRatio:wc/100,...(ppe==='base'?{}:{ppeRatio:Number(ppe)})}),a4=M.actualFcff(2024),a5=M.actualFcff(2025),one=M.fcff({op,dep,capex:cx,dNwc:dn}),pv1=one*M.discountFactor(r1/100,1),r0=f.rows[0];
  const act=U.table(['실적','세후 영업이익','감가상각','설비투자','운전자본 증가','FCFF'],[a4,a5].map(a=>[`${a.year} (할인하지 않음)`,F(a.nopat),F(a.dep),F(a.capex),F(a.dNwc),`<b>${F(a.fcff)}</b>`]),'실적 FCFF (억 원, 5권 숫자)',true);
  const fc=U.table(['예측','매출','영업이익','감가상각','설비투자','운전자본 증가','FCFF','할인계수','현재가치'],f.rows.map(x=>[String(x.year),F(x.sales),F(x.op),F(x.dep),F(x.capex),F(x.dNwc),`<b>${F(x.fcff)}</b>`,U.sfmt(x.df,4),F(x.pv)]).concat([['합계','','','','','','','',`<b>${F(f.pvSum)}</b>`]]),`2026~2030 예측과 현재가치 (억 원, 할인율 ${U.pct(B.r)})`,true);
  const chart=U.columns({labels:['2024|실적','2025|실적',...f.rows.map(x=>`${x.year}|예측`)],values:[a4.fcff,a5.fcff,...f.rows.map(x=>x.fcff)],mark:i=>i>=2,fmt:v=>N(v),title:'FCFF (억 원) · ▲ 예측',twoLine:true,h:270,vw:640,label:`FCFF 실적 ${N(a4.fcff)}, ${N(a5.fcff)}; 예측 ${f.rows.map(x=>N(x.fcff)).join(', ')}`})+act+fc;
  const wcNote=r0.dNwc<0?`운전자본 증가 ${N(r0.dNwc)}억 원, 곧 ${N(-r0.dNwc)}억 원이 회수되어 FCFF에 더해집니다`:`운전자본이 ${N(r0.dNwc)}억 원 늘어 FCFF에서 빠집니다`;
  U.result(el,chart,`실적 FCFF: 2024년 ${F(a4.nopat)} + ${N(a4.dep)} − ${N(a4.capex)} − ${N(a4.dNwc)} = <b>${E(a4.fcff)}</b>, 2025년 ${F(a5.nopat)} + ${N(a5.dep)} − ${N(a5.capex)} − ${N(a5.dNwc)} = <b>${E(a5.fcff)}</b>(실적이라 할인하지 않습니다).<br>2026년 예측 FCFF <b>${E(r0.fcff)}</b>(${wcNote}), 2027~2030년 ${f.rows.slice(1).map(x=>N(x.fcff)).join(' → ')}억 원. 할인율 ${U.pct(B.r)}로 할인한 5년 현재가치 합 <b>${E(f.pvSum)}</b>.<br>한 해 FCFF = ${N(op)} × (1 − 20%) + ${N(dep)} − ${N(cx)} − ${U.sfmt(dn,1)} = <b>${E(one)}</b>, 1년 뒤에 받는다면 ${U.pct(r1/100)}로 할인해 오늘의 값 <b>${E(pv1)}</b>.${U.kind(['real','scenario','simple'],'감가상각 = 기초 유형자산 × 10%, 유형자산 ÷ 매출 일정, 연말 할인은 이 책의 단순화입니다.')}`);
 });
};
VLabs['wacc-build']=el=>{
 U.setup(el,`<p class="rate-banner"><b>확인일 2026-10-08</b> · 이야기 시점 2026년 4월의 금리가 아니라 이 책이 확인한 10월 값입니다. 4월에 계산한다면 4월의 국고채 금리를 넣어야 합니다. ${U.RATE_NOTE}<br>${U.rateTag('rf')} ${U.rateTag('erp')} ${U.rateTag('kd')}</p>`+U.number('wrf','무위험 금리: 국고채 10년 (%)',-5,30,0.01,M.MARKET.rf.value*100,'4.395%를 4.4%로 둠. 오늘의 금리를 넣어 보세요')+U.number('werp','주식 위험 프리미엄 (%)',0,30,0.01,M.MARKET.erp.value*100,'4.87%를 4.9%로 둠')+U.range('wbeta','베타 β (시장과 함께 움직이는 정도)',0,2.5,0.1,M.MARKET.beta.value.toFixed(1),'1.0은 이 책의 가정, 추정은 9권(준비 중)')+U.number('wkd','세전 부채 비용 (%)',0,50,0.01,M.MARKET.kd.value*100,'3년 회사채 5.061%(3권)')+U.number('wtax','법인세율 (%)',0,100,1,A.tax*100)+U.number('wE','주식 시장가 (억 원, 또는 비중)',0,10000000,1,M.basics().cap,'주가 20,000원으로 고정. 계산에는 두 칸의 비율만 쓰므로 70처럼 비중으로 넣어도 됩니다')+U.number('wD','부채 (억 원, 또는 비중)',0,10000000,1,A.years[2025].debt,'2025년 말 차입금. 30처럼 비중으로 넣어도 됩니다'));
 U.bind(el,()=>{
  const rf=U.num(el,'wrf'),erp=U.num(el,'werp'),beta=Number(U.value(el,'wbeta')),kd=U.num(el,'wkd'),tax=U.num(el,'wtax'),Eq=U.num(el,'wE'),D=U.num(el,'wD');
  for(const [v,name,why] of [[rf,'무위험 금리','−5%에서 30% 사이로 넣어야 합니다.'],[erp,'주식 위험 프리미엄','0%에서 30% 사이로 넣어야 합니다.'],[kd,'세전 부채 비용','0%에서 50% 사이로 넣어야 합니다.'],[tax,'법인세율','0%에서 100% 사이로 넣어야 합니다.'],[Eq,'주식 시장가','0 이상의 숫자(억 원)를 넣어야 합니다.'],[D,'부채','0 이상의 숫자(억 원)를 넣어야 합니다.']])if(v===null)return U.result(el,'',U.problem(name,why));
  if(Eq+D<=0)return U.result(el,'',U.problem('주식 시장가와 부채',U.why(new RangeError('not both 0'))));
  const w=M.wacc({rf:rf/100,erp:erp/100,beta,kdPre:kd/100,tax:tax/100,equity:Eq,debt:D}),r=Math.round(w.wacc*1000)/1000;
  const same=[...el.querySelectorAll('.controls input')].every(x=>x.value===x.defaultValue);
  let ps;try{ps=same?`소수 첫째 자리 ${U.pct(r)}로 7장 DCF를 계산하면 주당 <b>${W(M.value({r}))}</b>`:`이 할인율을 소수 첫째 자리 ${U.pct(r)}로 반올림해 새벽전자 기준안 DCF(7장)에 넣으면 주당 <b>${W(M.value({r}))}</b>입니다. 넣은 숫자가 다른 회사의 것이어도 이 주당 가치는 새벽전자 기준안으로 계산한 값입니다`;}catch(e){ps=`할인율 ${U.pct(r)}로는 DCF를 계산하지 않습니다(${U.why(e)})`;}
  const max=Math.max(w.ke,w.kdPre,w.wacc,w.rf,beta*w.erp,1e-9);
  const chart=U.hbars({label:`자기자본비용 ${U.pct(w.ke,2)}, 세후 부채 비용 ${U.pct(w.kd,3)}, WACC ${U.pct(w.wacc,3)}`,max:[max,max,max],groups:[{title:'자기자본비용 = 무위험 금리 + β × 위험 프리미엄',rows:[['무위험 금리',w.rf,U.pct(w.rf,2)],['β × 프리미엄',beta*w.erp,U.pct(beta*w.erp,2)],['자기자본비용',w.ke,U.pct(w.ke,2),true]]},{title:'부채 비용',rows:[['세전',w.kdPre,U.pct(w.kdPre,2)],['세후',w.kd,U.pct(w.kd,3)]]},{title:`시장가 비중 ${U.pct(w.wE)} : ${U.pct(w.wD)}`,rows:[['WACC',w.wacc,U.pct(w.wacc,3),true]]}]});
  U.result(el,chart,`자기자본비용 = ${U.pct(w.rf,2)} + ${U.sfmt(beta,1)} × ${U.pct(w.erp,2)} = <b>${U.pct(w.ke,2)}</b>, 세후 부채 비용 = ${U.pct(w.kdPre,2)} × (1 − ${U.pct(tax/100,0)}) = <b>${U.pct(w.kd,3)}</b>(약 ${U.pct(w.kd,2)}).<br>${same?`시장가 비중 주식 ${N(Eq)}억 원 ${U.pct(w.wE)} : 부채 ${N(D)}억 원 ${U.pct(w.wD)}`:`시장가 비중 주식 ${N(Eq)} : 부채 ${N(D)} → ${U.pct(w.wE)} : ${U.pct(w.wD)}`}, WACC = ${U.pct(w.wE)} × ${U.pct(w.ke,2)} + ${U.pct(w.wD)} × ${U.pct(w.kd,2)} = <b>${U.pct(w.wacc,3)}</b>(약 ${U.pct(w.wacc,2)}). ${ps}.<br>${U.RATE_NOTE}${U.kind(['real','news','estimate','simple'],'베타 1.0과 주가 20,000원으로 정한 비중, 3년 회사채 금리를 세전 부채 비용으로 쓴 것은 이 책의 단순화입니다.')}`);
 });
};
/* 영구가치 계단: 기준안 모드는 VMath.dcf, 직접 넣기 모드는 VMath.terminal로 계산한다. */
function terminalBase(el,g,r){
 const d=M.dcf({gT:g,r}),L=d.rows[d.rows.length-1],n=d.next,re=x=>x.capex-x.dep+x.dNwc;
 const steps=[[`2031년 FCFF`,E(n.fcff),`2030년 ${N(L.fcff)}억 원 → 재투자 ${N(re(L))} → ${N(re(n))}억 원`],['영구가치 (2030년 말)',E(d.tv),`${N(n.fcff)} ÷ (${U.pct(r)} − ${U.pct(g)})`],['영구가치의 현재가치',E(d.tvPv),`기업가치의 ${U.pct(d.tvShare)}`],['기업가치',E(d.firm),`5년 현재가치 ${N(d.pvSum)} + ${N(d.tvPv)}`],['주주 몫',E(d.equity),`순차입금 ${N(d.netDebt)}억 원을 뺌`],['주당 가치',W(d.perShare),'1,000만 주로 나눔']];
 const list=`<ol class="stage-list">${steps.map(([a,b,c],i)=>`<li${i===5?' class="current"':''}><span>${i+1}. ${a}</span><b>${b}</b><span>${c}</span></li>`).join('')}</ol>`;
 const chart=list+U.columns({labels:['5년|현재가치','영구가치|현재가치','기업가치','순차입금','주주 몫'],values:[d.pvSum,d.tvPv,d.firm,-d.netDebt,d.equity],mark:i=>i===1,fmt:v=>N(v),title:'억 원 · ▲ 영구가치의 현재가치',twoLine:true,h:270,label:`5년 현재가치 ${N(d.pvSum)}, 영구가치의 현재가치 ${N(d.tvPv)}, 기업가치 ${N(d.firm)}, 순차입금 ${N(d.netDebt)}, 주주 몫 ${N(d.equity)}`});
 const more=re(n)<re(L)?`성장률이 ${U.pct(B.growth)}에서 ${U.pct(g)}로 낮아져 재투자(설비투자 − 감가상각 + 운전자본 증가)가 ${N(re(L))}억 원에서 ${N(re(n))}억 원으로 줄어, 2031년 FCFF ${N(n.fcff)}억 원이 2030년 ${N(L.fcff)}억 원보다 큽니다.`:`영구성장률 ${U.pct(g)}${g>=B.growth?`가 예측 기간 성장률 ${U.pct(B.growth)} 이상이라`:`가 예측 기간 성장률 ${U.pct(B.growth)}에 가까워 2031년 매출 증가분이 2030년보다 커서`} 재투자가 ${N(re(L))}억 원에서 ${N(re(n))}억 원으로 늘었습니다.`;
 return [chart,`영구성장률 ${U.pct(g)}, 할인율 ${U.pct(r)}: 2031년 FCFF <b>${E(n.fcff)}</b>, 영구가치 = ${N(n.fcff)} ÷ (${U.pct(r)} − ${U.pct(g)}) = <b>${E(d.tv)}</b>, 현재가치 <b>${E(d.tvPv)}</b>(기업가치의 <b>${U.pct(d.tvShare)}</b>), 기업가치 <b>${E(d.firm)}</b>, 주주 몫 <b>${E(d.equity)}</b>, 주당 <b>${W(d.perShare)}</b>.<br>${more}${U.kind(['real','scenario','simple'])}`];
}
VLabs['terminal-steps']=el=>{
 U.setup(el,U.select('tmode','계산할 회사',[['base','새벽전자 기준안 (2026~2030 예측 뒤)'],['direct','다음 해 FCFF를 직접 넣는 가상의 회사']],'base')+U.number('tnext','예측 마지막 해 다음 해 FCFF (억 원)',-100000,1000000,0.1,194,'직접 넣기를 고르면 씁니다')+U.range('tg','영구성장률 g (%)',-2,9,0.1,(B.gT*100).toFixed(1),'할인율 이상이면 계산하지 않습니다')+U.number('tr','할인율 r (%)',0.1,50,0.1,B.r*100,'6장의 8.3%')+'<p class="caption">명시 예측은 5년(2026~2030년)이고, 영구가치는 5년 말에서 현재로 할인합니다.</p>');
 U.bind(el,()=>{
  const direct=U.value(el,'tmode')==='direct',nx=el.querySelector('#tnext');nx.disabled=!direct;nx.closest('.control').classList.toggle('dim',!direct);
  const g=Number(U.value(el,'tg'))/100,r=U.num(el,'tr'),next=U.num(el,'tnext');
  if(r===null)return U.result(el,'',U.problem('할인율','0.1%에서 50% 사이로 넣어야 합니다.'));
  if(direct&&next===null)return U.result(el,'',U.problem('다음 해 FCFF','숫자(억 원)를 넣어야 합니다.'));
  try{
   if(!direct){const [chart,text]=terminalBase(el,g,r/100);return U.result(el,chart,text);}
   const t=M.terminal(next,r/100,g,5);
   const chart=U.columns({labels:['다음 해|FCFF','영구가치','현재가치'],values:[next,t.tv,t.pv],mark:i=>i===1,fmt:v=>N(v),title:'억 원',twoLine:true,h:250,label:`다음 해 FCFF ${N(next)}, 영구가치 ${N(t.tv)}, 현재가치 ${N(t.pv)}`});
   U.result(el,chart,`영구가치(예측 마지막 해 말) = ${N(next)} ÷ (${U.pct(r/100)} − ${U.pct(g)}) = <b>${E(t.tv)}</b>, 현재가치 = ${N(t.tv)} ÷ (1 + ${U.pct(r/100)})^5 = <b>${E(t.pv)}</b>.${U.kind(['real','simple'],'명시 예측 5년, 연말 할인은 이 책의 단순화입니다.')}`);
  }catch(e){U.result(el,'',U.problem('영구성장률',U.why(e))+(/g ≥ r/.test(e.message)?` 지금 g ${U.pct(g)}, r ${U.pct(r/100)}입니다. 값은 내지 않습니다.`:''));}
 });
};
})();
