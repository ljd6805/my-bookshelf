/* 4·5장 실험: 정책 시나리오 모형(미리 정한 시나리오 모형 · 예측 아님 · 계수는 가정 · 12분기만 계산 · 금리 하한과 중앙은행의 재반응은 넣지 않음).
   계산은 MMath.scenario·peaks·addPaths·multiplier만 쓴다. 4장은 정책 금리 손잡이 하나(stage policy, 기본값 0)만 열고, 5장은 정부 지출을 더한다(stage fiscal).
   통화량 손잡이는 10장에서만 연다. 4장의 인상·인하 비교 예제는 예측을 적은 뒤에 열린다(js/lab-guides.js). 결과 문장은 크기를 “이 모형에서”로 한정하고 순서와 모양을 말한다. */
(()=>{
'use strict';
const U=MUI,M=MMath,MD=M.MODEL,Q=MD.quarters;
const NAME={i:'시장 금리',e:'환율',y:'GDP',pi:'물가 상승률'},UNIT={i:'%p',e:'%',y:'%',pi:'%p'};
const f2=(k,v)=>k==='e'||k==='y'?U.per(v):U.ppt(v);
const f3=v=>U.sfmt(M.r3(v),3);
/* 네 줄 가운데 움직인 줄의 가장 큰 편차와 그 분기, 그리고 반응이 가장 큰 분기의 순서. */
function peakText(s,keys=['e','y','pi']){
 const p=M.peaks(s),moved=keys.filter(k=>p[k].q!==null&&Math.abs(p[k].value)>1e-12);
 if(!moved.length)return {text:'네 줄이 모두 기준선(편차 0)에 있습니다. 손잡이를 움직여 보세요',order:''};
 const order=[...moved].sort((a,b)=>p[a].q-p[b].q).map(k=>NAME[k].replace(' 상승률',''));
 return {p,text:`이 모형에서 ${moved.map(k=>`${NAME[k]}${U.josa(NAME[k],'은','는')} ${p[k].q}분기째 <b>${f2(k,p[k].value)}</b>`).join(', ')}가 가장 큰 편차입니다`,order:order.join(' → ')};
}
/* 그림 두 장(GDP·물가, 시장 금리·환율)과 분기 표. extra는 표에 더할 열 [[이름, 값 배열]]. */
function modelView(s,title,extra=[]){
 const labels=s.y.map((_,t)=>`${t+1}`),tk=v=>U.sfmt(v,2);
 const top=U.lines({h:300,series:[{name:'GDP (%)',values:s.y,color:'var(--blue)',shape:'●'},{name:'물가 상승률 (%p)',values:s.pi,color:'var(--orange)',shape:'■',dash:true}],labels,tick:tk,title:`${title} · 기준선 대비 GDP와 물가 (분기)`,label:`GDP 편차 ${s.y.map(f3).join(', ')}; 물가 편차 ${s.pi.map(f3).join(', ')}`});
 const low=U.lines({series:[{name:'시장 금리 (%p)',values:s.i,color:'var(--accent)',shape:'▲'},{name:'환율 (%, + = 원화 약세)',values:s.e,color:'var(--muted)',shape:'◆',dash:true}],labels,tick:tk,title:'기준선 대비 시장 금리와 원/달러 환율 (분기)',h:270,label:`시장 금리 편차 ${s.i.map(f3).join(', ')}; 환율 편차 ${s.e.map(f3).join(', ')}`});
 const head=['분기','시장 금리','환율','GDP','물가',...extra.map(x=>x[0])];
 const rows=s.y.map((_,t)=>[`${t+1}분기`,f3(s.i[t]),f3(s.e[t]),f3(s.y[t]),f3(s.pi[t]),...extra.map(x=>x[1][t])]);
 return top+low+U.table(head,rows,`모형의 네 줄: 기준선 대비 편차 (시장 금리·물가 %p, 환율·GDP %, 소수 셋째 자리)`,extra.length?'cards':'compact');
}
MLabs['policy-model']=el=>{
 const P=M.MARKET.policyRate;
 U.setup(el,U.modelBanner(`${MD.fixedNote}. 시차는 식에 넣은 가정(금리 i(q−2), 지속 계수 0.6·0.7)이라 모형은 가정한 시차를 보여 줄 뿐 찾아내지 않습니다.`)
  +`<p class="rate-banner">${U.RATE_FACT} ${U.RATE_NOTE}<br>회의 주기: 지표를 본다 → 결정한다 → 다음 회의에서 결정 뒤의 지표를 다시 본다(연 8회, 2026년 회의 ${P.meetings2026.length}번, ${P.meetingsGrade}).</p>`
  +U.range('prate','정책 금리 변경 (%p)',MD.ranges.rate[0],MD.ranges.rate[1],0.25,0,'기본값 0. 인상·인하 비교 예제는 예측을 적은 뒤에 열립니다')+U.range('plen','변경을 유지하는 분기 수',1,MD.maxLen.rate,1,4,'1분기부터 시작'),true);
 U.bind(el,()=>{
  const size=Number(U.value(el,'prate')),len=Number(U.value(el,'plen'));let s;
  try{s=M.scenario({rate:{size,start:1,len}},{stage:'policy'});}catch(e){return U.result(el,'',U.problem('정책 금리 변경',U.why(e)));}
  const pk=peakText(s);
  const word=size>0?'올려':size<0?'내려':'그대로 두어';
  U.result(el,modelView(s,`정책 금리 ${U.ppt(size)} · ${len}분기`),`정책 금리를 ${size?`${U.ppt(size)} ${word} ${len}분기 두면`:'바꾸지 않으면'}: ${pk.text}.${pk.order?`<br>가장 크게 반응하는 순서는 <b>${pk.order}</b>입니다. 크기는 이 모형의 가정 계수에서 나온 값이고, 이 장이 보는 것은 순서와 모양입니다.`:''}<br>${MD.fixedNote}.${U.kind(['model','real'],'계수는 교재의 방향과 시차에 맞춰 고른 가정이며 통계로 추정하지 않았습니다.')}`);
 });
};
MLabs['fiscal-mix']=el=>{
 U.setup(el,U.modelBanner(`장기 승수 ${U.sfmt(M.multiplier(),1)}(= 0.32 ÷ (1 − 0.6))은 이 책의 가정입니다.`)
  +U.group('정부 지출',U.range('fspend','지출 변경 (GDP 대비 %)',MD.ranges.spend[0],MD.ranges.spend[1],0.5,1)+U.range('flen','지출을 유지하는 분기 수',1,MD.maxLen.spend,1,4))
  +U.group('정책 금리',U.range('frate','정책 금리 변경 (%p)',MD.ranges.rate[0],MD.ranges.rate[1],0.25,0,'0이 아니면 따로 넣은 결과의 합과 견줍니다')+U.range('frlen','금리 변경을 유지하는 분기 수',1,MD.maxLen.rate,1,4)),true);
 U.bind(el,()=>{
  const sp=Number(U.value(el,'fspend')),sl=Number(U.value(el,'flen')),rt=Number(U.value(el,'frate')),rl=Number(U.value(el,'frlen'));let both,a,b;
  try{const spend={size:sp,start:1,len:sl},rate={size:rt,start:1,len:rl};both=M.scenario({spend,rate},{stage:'fiscal'});a=M.scenario({spend},{stage:'fiscal'});b=M.scenario({rate},{stage:'fiscal'});}catch(e){return U.result(el,'',U.problem('지출과 금리 변경',U.why(e)));}
  const sum=M.addPaths(a,b),ok=sum.y.every((v,t)=>Math.abs(v-both.y[t])<1e-9)&&sum.pi.every((v,t)=>Math.abs(v-both.pi[t])<1e-9);
  const mix=rt!==0&&sp!==0,pk=peakText(both,['y','pi']);
  const extra=mix?[['지출만 GDP',a.y.map(f3)],['금리만 GDP',b.y.map(f3)],['합과 같나',sum.y.map((v,t)=>Math.abs(v-both.y[t])<1e-9?'✓ 맞음':'✗ 어긋남')]]:[];
  let mixText='';
  if(mix){const t=both.y.reduce((m,v,k)=>Math.abs(v)>Math.abs(both.y[m])?k:m,0),above=both.y.findIndex(v=>v<0);mixText=`<br>둘을 함께 넣으면 ${above<0?'12분기 내내 GDP가 기준선 위에 있습니다':above===0?'첫 분기부터 GDP가 기준선 아래입니다':`GDP가 ${above}분기까지 기준선 위에 있다가 ${above+1}분기부터 아래로 내려갑니다`}. ${t+1}분기: 금리만 ${f3(b.y[t])} + 지출만 ${f3(a.y[t])} = ${U.sfmt(M.r3(b.y[t])+M.r3(a.y[t]),3)}, 함께 넣은 값 ${f3(both.y[t])}(차이는 반올림 몫). 분기마다 함께 = 따로의 합 <b>${ok?'✓ 맞음':'✗ 어긋남'}</b>. 선형 모형이라 언제나 맞고, 실제 경제에서는 정책끼리 반응이 얽혀 맞지 않을 수 있습니다.`;}
  const moved=sp!==0&&Math.abs(both.i[0])>1e-12&&rt===0?'<br>지출만 바꿨는데 시장 금리와 환율 줄도 움직입니다. 그 까닭은 확인 문제에서 식으로 따져 봅니다.':'';
  U.result(el,modelView(both,`지출 ${U.per(sp,1)} · ${sl}분기${rt?`, 금리 ${U.ppt(rt)} · ${rl}분기`:''}`,extra),`정부 지출 ${U.per(sp,1)}(GDP 대비)를 ${sl}분기${rt?`, 정책 금리 ${U.ppt(rt)}를 ${rl}분기`:''} 넣으면: ${pk.text}.${pk.order?` 반응이 가장 큰 순서는 ${pk.order}입니다.`:''}${moved}${mixText}<br>지출이 아주 오래 이어진다면 GDP 편차는 0.32 ÷ (1 − 0.6) = ${U.sfmt(M.multiplier(),1)}배에 다가갑니다(이 모형의 승수, 가정).${U.kind(['model','real'],'승수 0.8의 근거가 되는 추정치는 확인하지 못했습니다.')}`);
 });
};
})();
