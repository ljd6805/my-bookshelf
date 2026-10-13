/* 1~3장 실험: GDP 지출 네 갈래와 실질 성장률·연율, 장바구니 물가지수, 실업률·고용률과 GDP 갭의 국면.
   계산은 MMath.gdp·realGrowth·annualize·priceIndex·inflation·labor·discourage·phase만 쓴다. 모형 경제·장바구니·가상 동네·갭 곡선은 미리 정한 가상 시나리오다.
   이례적 값(명목 GDP 26.4%, 디플레이터 21.9%)은 계산에 넣지 않고, 1장 확인 칸을 켤 때만 “이례적 값” 상자로 보인다.
   1장 기본 분기 성장률은 1.0%(본문 값)이고 확인 문제의 0.6%는 비교 예제에 넣지 않는다. 3장 비교 예제는 확인 문제의 경우(실업자 10명이 일자리를 구함: 취업자 590·실업자 10)를 넣지 않는다. */
(()=>{
'use strict';
const U=MUI,M=MMath,A=M.ASSUME,G=M.MARKET.gdp;
const jo=n=>U.sfmt(n,Number.isInteger(Math.round(n*10)/10)?0:1);
MLabs['gdp-expenditure']=el=>{
 const E=A.economy;
 U.setup(el,U.group('한 해 지출 (조 원)',U.number('gc','소비 C',0,100000,1,E.c)+U.number('gi','투자 I',-10000,100000,1,E.i)+U.number('gg','정부 지출 G',0,100000,1,E.g)+U.number('gx','수출 X',0,100000,1,E.x)+U.number('gm','수입 M',0,100000,1,E.m,'소비·투자 안의 외국 생산 몫이라 뺍니다'))
  +U.group('성장률 (%)',U.number('gnom','명목 GDP 성장률',-50,100,0.1,A.growth.nominal*100)+U.number('gdef','GDP 디플레이터 상승률',-50,100,0.1,A.growth.deflator*100)+U.number('gq','전기 대비 분기 성장률',-20,20,0.1,1,'연율은 이 속도가 네 분기 이어진다고 놓은 환산'))
  +U.check('greal','실제 2026년 2분기 숫자도 견주기',false,'이례적 값이라 계산에 넣지 않고 상자로만 보입니다'));
 U.bind(el,()=>{
  const c=U.num(el,'gc'),i=U.num(el,'gi'),g=U.num(el,'gg'),x=U.num(el,'gx'),m=U.num(el,'gm'),nom=U.num(el,'gnom'),def=U.num(el,'gdef'),q=U.num(el,'gq');
  for(const [v,name,w] of [[c,'소비','0 이상의 숫자(조 원)를 넣어야 합니다.'],[i,'투자','숫자(조 원)를 넣어야 합니다.'],[g,'정부 지출','0 이상의 숫자(조 원)를 넣어야 합니다.'],[x,'수출','0 이상의 숫자(조 원)를 넣어야 합니다.'],[m,'수입','0 이상의 숫자(조 원)를 넣어야 합니다.'],[nom,'명목 성장률','−50%에서 100% 사이로 넣어야 합니다.'],[def,'디플레이터 상승률','−50%에서 100% 사이로 넣어야 합니다.'],[q,'분기 성장률','−20%에서 20% 사이로 넣어야 합니다.']])if(v===null)return U.result(el,'',U.problem(name,w));
  let d;try{d=M.gdp({c,i,g,x,m});}catch(e){return U.result(el,'',U.problem('지출',U.why(e)));}
  const real=M.realGrowth(nom/100,def/100),ann=M.annualize(q/100),sh=d.shares;
  const chart=U.columns({labels:['소비 C','투자 I','정부 G','순수출|X − M','GDP'],values:[c,i,g,d.net,d.gdp],mark:k=>k===4,fmt:v=>jo(v),title:'지출 네 갈래와 GDP (조 원) · ▲ GDP',twoLine:true,h:270,label:`소비 ${jo(c)}, 투자 ${jo(i)}, 정부 지출 ${jo(g)}, 순수출 ${jo(d.net)}, GDP ${jo(d.gdp)}조 원`})
   +U.table(['갈래','금액(조 원)','GDP에서의 비중'],[['소비 C',jo(c),U.pct(sh.c,1)],['투자 I',jo(i),U.pct(sh.i,1)],['정부 지출 G',jo(g),U.pct(sh.g,1)],[`순수출 X − M`,`${jo(x)} − ${jo(m)} = ${jo(d.net)}`,U.pct(sh.net,1)],['<b>GDP</b>',`<b>${jo(d.gdp)}</b>`,'100%']],'모형 경제의 지출 표',true)
   +U.table(['같은 분기를 재는 숫자','계산','값'],[['실질 성장률',`(1 + ${U.sfmt(nom,1)}%) ÷ (1 + ${U.sfmt(def,1)}%) − 1`,`<b>${U.pct(real)}</b>`],['어림(명목 − 디플레이터)',`${U.sfmt(nom,1)}% − ${U.sfmt(def,1)}%`,U.pct((nom-def)/100)],['연율',`(1 + ${U.sfmt(q,1)}%)⁴ − 1`,`<b>${U.pct(ann)}</b>`],['네 번 더한 값(복리 뺌)',`${U.sfmt(q,1)}% × 4`,U.pct(q*4/100)]],'성장률 계산',true);
  const box=U.checked(el,'greal')?U.unusual('공식 원문(재게시)과 보도 기준',`2026년 2분기 명목 GDP는 1년 전보다 ${U.sfmt(G.nominalYoY.value,1)}%(${G.nominalYoY.grade}), GDP 디플레이터는 ${U.sfmt(G.deflator.value,1)}%(${G.deflator.grade}) 올랐습니다. 같은 식에 넣으면 1.264 ÷ 1.219 − 1 = ${U.pct(M.realGrowth(G.nominalYoY.value/100,G.deflator.value/100))}로 발표된 실질 ${U.sfmt(G.realYoY,1)}%(전년 동기 대비)와 맞습니다. 숫자끼리 앞뒤가 맞는다는 뜻일 뿐 디플레이터의 출처를 대신하지 않습니다. 이 값은 위 계산에 넣지 않았습니다.`):'';
  U.result(el,chart,`GDP = ${jo(c)} + ${jo(i)} + ${jo(g)} + (${jo(x)} − ${jo(m)}) = <b>${jo(d.gdp)}조 원</b>, 순수출 <b>${jo(d.net)}조 원</b>. 비중은 소비 ${U.pct(sh.c,1)}, 투자 ${U.pct(sh.i,1)}, 정부 지출 ${U.pct(sh.g,1)}, 순수출 ${U.pct(sh.net,1)}입니다.<br>명목 ${U.sfmt(nom,1)}%, 디플레이터 ${U.sfmt(def,1)}%면 실질 성장률 = ${U.sfmt(1+nom/100,3)} ÷ ${U.sfmt(1+def/100,3)} − 1 = <b>${U.pct(real)}</b>(어림 ${U.pct((nom-def)/100)}).<br>전기 대비 ${U.sfmt(q,1)}%가 네 분기 이어지면 연율 = (1 + ${U.sfmt(q,1)}%)⁴ − 1 = <b>${U.pct(ann)}</b>입니다. 같은 속도를 놓은 환산이며 앞으로의 성장률 예상이 아닙니다.${box}${U.kind(['real','scenario','textbook'],'지출 항등식과 최종 생산의 정의는 대학 교재로 확인했습니다.')}`);
 });
};
const NAMES=A.basket.map(b=>b.name);
MLabs['cpi-basket']=el=>{
 const C=M.MARKET.cpi;
 U.setup(el,A.basket.map((b,k)=>U.group(`${b.name}`,U.number('cw'+k,'가중치 (%)',0,100,1,b.w*100)+U.number('ca'+k,'기준 해 가격 (원)',1,10000000,1,b.p0)+U.number('cb'+k,'올해 가격 (원)',1,10000000,1,b.p1))).join('')
  +U.group('지수 수준과 상승률',U.number('cnow','지금 지수',1,1000,0.01,C.index,`9월 ${C.index}(2020 = 100), ${C.released} 발표`)+U.number('crate','다음 1년의 상승률 (%)',-20,50,0.1,2,'상승률이 내려도 지수는 오르는지 봅니다')),true);
 U.bind(el,()=>{
  const v=[0,1,2].map(k=>[U.num(el,'cw'+k),U.num(el,'ca'+k),U.num(el,'cb'+k)]),now=U.num(el,'cnow'),r=U.num(el,'crate');
  for(let k=0;k<3;k++){const [w,a,b]=v[k];if(w===null)return U.result(el,'',U.problem(NAMES[k]+' 가중치','0%에서 100% 사이로 넣어야 합니다.'));if(a===null||b===null)return U.result(el,'',U.problem(NAMES[k]+' 가격','1원 이상으로 넣어야 합니다.'));}
  if(now===null)return U.result(el,'',U.problem('지금 지수','1에서 1,000 사이로 넣어야 합니다.'));if(r===null)return U.result(el,'',U.problem('다음 1년의 상승률','−20%에서 50% 사이로 넣어야 합니다.'));
  const items=v.map(([w,p0,p1],k)=>({name:NAMES[k],w:w/100,p0,p1}));let x;
  try{x=M.priceIndex(items);}catch(e){const sum=v.reduce((s,a)=>s+a[0],0);return U.result(el,'',U.problem('가중치',`${U.why(e)} 지금 합은 ${U.sfmt(sum,0)}%입니다.`));}
  const next=now*(1+r/100),parts=x.parts,max=Math.max(1e-9,...parts.map(p=>Math.abs(p.contribution)));
  const chart=U.hbars({label:`품목별로 지수 상승에 보탠 몫: ${parts.map(p=>`${p.name} ${U.ppt(p.contribution*100,1)}`).join(', ')}, 합 ${U.pct(x.inflation,1)}`,max:[max],groups:[{title:'지수 상승에 보탠 몫 (%p) = 가중치 × (가격 비율 − 1)',rows:parts.map(p=>[p.name,p.contribution,U.ppt(p.contribution*100,1),p.contribution===Math.max(...parts.map(q=>q.contribution))&&p.contribution>0])}]})
   +U.table(['품목','가중치','가격 비율','보탠 몫'],parts.map(p=>[p.name,U.pct(p.w,0),U.sfmt(p.ratio,3),U.ppt(p.contribution*100,1)]).concat([['합계','100%','',`<b>${U.pct(x.inflation,1)}</b>`]]),'장바구니 품목별 계산',true);
  const top=parts.reduce((a,b)=>b.contribution>a.contribution?b:a);
  U.result(el,chart,`지수 = ${parts.map(p=>`${U.sfmt(p.w,2)} × ${U.sfmt(p.ratio,3)}`).join(' + ')} = ${U.sfmt(x.index/100,3)} → <b>${U.sfmt(x.index,1)}</b>, 물가 상승률 <b>${U.pct(x.inflation,1)}</b>.${top.contribution>0?` 가장 크게 보탠 품목은 ▲ ${top.name}(${U.ppt(top.contribution*100,1)})입니다.`:''}<br>지금 지수 ${U.sfmt(now,2)}에서 다음 1년 상승률이 ${U.sfmt(r,1)}%면 지수는 <b>${U.sfmt(next,2)}</b>입니다. ${r>0?'상승률이 낮아져도 0보다 크면 지수는 계속 오릅니다.':r<0?'상승률이 0보다 작을 때만 지수가 내려갑니다.':'상승률이 0이면 지수는 그대로입니다.'}${U.kind(['real','scenario','official'],`9월 지수 ${C.index}${U.josa(String(C.index),'은','는')} ${C.released} 발표(공식 원문 재게시)이고, 장바구니 세 품목은 미리 정한 가상 시나리오입니다.`)}`);
 });
};
/* 가상 갭 곡선과 고른 분기. */
function gapChart(t){
 const P=M.phase(A.gapCurve,t);
 return U.lines({series:[{name:'GDP 갭(잠재 GDP 대비 %)',values:A.gapCurve}],labels:A.gapCurve.map((_,i)=>`${i+1}분기`),mark:i=>i===t,tick:v=>U.sfmt(v,1),title:`가상 GDP 갭 · ▲ ${t+1}분기: ${P.phase}`,h:260,legend:false,label:`가상 GDP 갭 12분기 ${A.gapCurve.map(v=>U.sfmt(v,1)).join(', ')}. ${t+1}분기는 ${P.level}, ${P.direction}, ${P.phase}`});
}
MLabs['labor-gap']=el=>{
 const T=A.town;
 U.setup(el,U.group('가상 동네 (명)',U.number('lpop','15세 이상 인구',1,10000000,1,T.pop15)+U.number('lemp','취업자',0,10000000,1,T.employed)+U.number('lun','실업자 (일자리를 찾는 사람)',0,10000000,1,T.unemployed)+U.number('ldis','그 가운데 구직을 포기한 사람',0,10000000,1,0,'비경제활동인구로 옮겨 갑니다'))+U.range('lq','국면을 볼 분기',1,12,1,4,'가상 GDP 갭 곡선의 분기'));
 U.bind(el,()=>{
  const pop=U.num(el,'lpop'),emp=U.num(el,'lemp'),un=U.num(el,'lun'),dis=U.num(el,'ldis'),t=Number(U.value(el,'lq'))-1;
  for(const [v,name] of [[pop,'15세 이상 인구'],[emp,'취업자'],[un,'실업자'],[dis,'구직을 포기한 사람']])if(v===null||!Number.isInteger(v))return U.result(el,'',U.problem(name,'0 이상의 정수(명)로 넣어야 합니다.'));
  let a,b;try{a=M.labor({pop15:pop,employed:emp,unemployed:un});b=M.discourage({pop15:pop,employed:emp,unemployed:un},dis);}catch(e){return U.result(el,'',U.problem(/n must/.test(e.message)?'구직을 포기한 사람':'인구와 취업자·실업자',U.why(e)));}
  const P=M.phase(A.gapCurve,t),moved=dis>0,R=x=>U.pct(x,2);
  const chart=U.hbars({label:`실업률 ${R(a.unemployment)}${moved?` → ${R(b.unemployment)}`:''}, 참가율 ${R(a.participation)}, 고용률 ${R(a.employment)}`,max:[1,1],groups:[{title:moved?'구직 포기 전':'세 비율 (%)',rows:[['실업률',a.unemployment,R(a.unemployment)],['참가율',a.participation,R(a.participation)],['고용률',a.employment,R(a.employment)]]}].concat(moved?[{title:`${U.fmt(dis)}명이 구직을 포기한 뒤`,rows:[['실업률',b.unemployment,R(b.unemployment),true],['참가율',b.participation,R(b.participation),true],['고용률',b.employment,R(b.employment)]]}]:[])})
   +gapChart(t)+U.table(['','경제활동인구','실업률','참가율','고용률'],[['처음',U.fmt(a.force)+'명',R(a.unemployment),R(a.participation),R(a.employment)]].concat(moved?[['구직 포기 뒤',U.fmt(b.force)+'명',`<b>${R(b.unemployment)}</b>`,R(b.participation),`${R(b.employment)} ${b.employment===a.employment?'(그대로)':''}`]]:[]),'고용 비율',true);
  const change=moved?`<br>${U.fmt(dis)}명이 구직을 포기하면 실업률은 <b>${R(a.unemployment)} → ${R(b.unemployment)}</b>로 내려가지만, 취업자 ${U.fmt(emp)}명은 그대로라 고용률은 ${R(b.employment)}${b.employment===a.employment?'로 바뀌지 않습니다':''}. 늘어난 일자리는 없습니다.`:'';
  U.result(el,chart,`경제활동인구 = ${U.fmt(emp)} + ${U.fmt(un)} = ${U.fmt(a.force)}명, 실업률 = ${U.fmt(un)} ÷ ${U.fmt(a.force)} = <b>${R(a.unemployment)}</b>, 참가율 ${R(a.participation)}, 고용률 = ${U.fmt(emp)} ÷ ${U.fmt(pop)} = <b>${R(a.employment)}</b>.${change}<br>▲ ${t+1}분기의 GDP 갭은 ${U.sfmt(P.gap,1)}%로 ${P.level}에 있고, ${t?`앞 분기에서 ${P.direction==='오르는 중'?'올라왔으며':'내려왔으며'}`:`다음 분기로 ${P.direction==='오르는 중'?'올라가며':'내려가며'}`}${P.phase==='정점'||P.phase==='저점'?' 다음 분기에 방향이 꺾이므로':''} 국면은 <b>${P.phase}</b>입니다. 국면은 갭의 수준과 방향을 함께 봐야 정할 수 있습니다.${U.kind(['real','scenario','textbook'],'실업률의 정의는 대학 교재(미국 기준 서술)로 확인했고, 한국의 실업자 기준은 확인하지 못했습니다.')}`);
 });
};
})();
