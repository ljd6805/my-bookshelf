/* 8·9장 실험: 선행·동행 지수의 시차 상관과 발표 달력, 세 위기의 지표 순서.
   계산은 MMath.lagCorr·lagTable·fxMove·annualize·crisisNumbers만 쓴다. 8장 12개월 자료는 미리 정한 가상 시나리오(동행 = 세 달 전 선행 × 0.8 + 작은 흔들림)이고,
   위기 숫자는 보도·학술 요약 기준(MARKET.crisis)이다. 9장 환율 칸의 기본값은 2020년 스와프 전날 종가(1,246.5 + 39.2 = 1,285.7원으로 계산, 장중 고점 아님) → 다음 날 종가 1,246.5원이며 확인 문제의 900원 → 1,962원은 비교 예제에 넣지 않는다. */
(()=>{
'use strict';
const U=MUI,M=MMath,A=M.ASSUME,CLI=M.MARKET.cli,CAL=M.MARKET.calendar,CR=M.MARKET.crisis;
const show=a=>a.map(v=>U.sfmt(v,Math.min(2,(String(v).split('.')[1]||'').length))).join(', ');
MLabs['lag-correlation']=el=>{
 U.setup(el,U.text('llead','선행 변화 (쉼표로 나눔)',show(A.lead),'본문 가상 자료 12개월')+U.text('lcoin','동행 변화 (쉼표로 나눔, 같은 개수)',show(A.coin))+U.range('llag','동행을 늦출 달 수 k',0,4,1,0,'선행의 t월과 동행의 t + k월을 짝지음'),true);
 U.bind(el,()=>{
  const lead=U.list(el,'llead'),coin=U.list(el,'lcoin'),k=Number(U.value(el,'llag'));
  if(lead===null)return U.result(el,'',U.problem('선행 변화','쉼표로 나눈 숫자를 세 개 이상 넣어야 합니다.'));if(coin===null)return U.result(el,'',U.problem('동행 변화','쉼표로 나눈 숫자를 세 개 이상 넣어야 합니다.'));
  if(lead.length!==coin.length)return U.result(el,'',U.problem('두 목록의 개수',`${U.why(new RangeError('same length'))} 지금 선행 ${lead.length}개, 동행 ${coin.length}개입니다.`));
  const maxLag=Math.min(4,lead.length-3);if(k>maxLag)return U.result(el,'',U.problem('늦출 달 수',`${U.why(new RangeError('lag must be'))} 숫자 ${lead.length}개로는 ${maxLag}달까지 늦출 수 있습니다.`));
  let tb,cur;try{tb=M.lagTable(lead,coin,maxLag);cur=M.lagCorr(lead,coin,k);}catch(e){return U.result(el,'',U.problem('두 목록',U.why(e)));}
  const r2=x=>U.sfmt(x,2),best=tb.best;
  const chart=U.hbars({label:`시차별 상관계수 ${tb.rows.map(x=>`${x.k}달 ${r2(x.r)}`).join(', ')}; 가장 큰 r은 ${best.k}달`,max:[1],groups:[{title:'시차별 상관계수 r (▲ 가장 큰 r)',rows:tb.rows.map(x=>[`${x.k===k?'◆ ':''}${x.k}달 (쌍 ${x.n}개)`,x.r,r2(x.r),x.k===best.k])}],left:150})
   +U.lines({series:[{name:'선행 t월',values:lead.slice(0,lead.length-k),color:'var(--blue)',shape:'●'},{name:`동행 t + ${k}월`,values:coin.slice(k),color:'var(--orange)',shape:'■',dash:true}],labels:lead.slice(0,lead.length-k).map((_,t)=>`${t+1}`),tick:v=>U.sfmt(v,1),title:`${k}달 늦춰 짝지은 두 줄 (쌍 ${cur.n}개)`,h:240,label:`선행 ${show(lead.slice(0,lead.length-k))}; 동행 ${show(coin.slice(k))}`})
   +U.table(['시차 k','쌍의 수','상관계수 r'],tb.rows.map(x=>[`${x.k===k?'◆ ':''}${x.k}달`,String(x.n),`${x.k===best.k?'▲ ':''}${r2(x.r)}`]),'시차별 상관계수',true)
   +U.table(['날짜','발표','등급'],CAL.map(c=>[c.date,c.what,c.grade]).concat([['확인 필요','9월 고용동향, 3분기 GDP 속보치','날짜 확인 못함']]),'2026년 10월 발표 달력 (이야기 시점 기준)',true);
  const book=show(lead)===show(A.lead)&&show(coin)===show(A.coin);
  U.result(el,chart,`◆ 동행을 ${k}달 늦추면 쌍 ${cur.n}개, r = <b>${r2(cur.r)}</b>. 0~${maxLag}달 가운데 r이 가장 큰 시차는 ▲ <b>${best.k}달</b>(r = ${r2(best.r)}, 쌍 ${best.n}개)입니다.${book?` 본문 자료는 동행을 세 달 전 선행 × 0.8에 작은 흔들림을 더해 만들었으므로, 세 달에서 가장 큰 r이 나오는 것은 만든 방식대로입니다.`:''}<br>가장 큰 r의 시차를 찾았다고 원인이 정해지지는 않습니다. 두 지표를 함께 움직이는 공통 원인을 따로 확인합니다. 시차가 길수록 짝지을 수 있는 달이 줄어듭니다.<br>실제 8월 경기종합지수(순환변동치): 동행 ${U.sfmt(CLI.coincident,1)}(${U.splus(CLI.coincidentChange,1)}), 선행 ${U.sfmt(CLI.leading,1)}(${U.splus(CLI.leadingChange,1)}), ${CLI.released} 발표를 전한 보도 기준, 확인 ${CLI.checked}.${U.kind(['real','scenario','news'],'상관계수는 피어슨 상관계수로 실제로 계산합니다. 순환변동치의 공식 산출 방법은 확인하지 못했습니다.')}`);
 });
};
const CASES={
 '1997':{title:'1997 외환위기',grade:'보도',steps:[[CR.y1997.request,'정부, IMF 구제금융 신청 발표'],[CR.y1997.imfDate,`IMF 이사회, 약 ${CR.y1997.imf}억 달러 승인(워싱턴 시각, IMF 보도자료)`],[CR.y1997.peakDate,`원/달러 ${U.fmt(CR.y1997.usdkrwPeak,1)}원(11월까지 ${CR.y1997.usdkrwBefore}원대)`],['1998년',`성장률 ${U.sfmt(CR.y1997.growth1998.first,1)}%(이전 계열, 2020·2023년 보도)·${U.sfmt(CR.y1997.growth1998.current,1)}%(현재 계열, 2025년 보도, 차이의 까닭 확인 중)`]]},
 '2008':{title:'2008 세계 금융위기',grade:'학술 요약·보도',steps:[[CR.y2008.raised,`기준금리 ${U.sfmt(CR.y2008.rateBefore,2)}% → ${U.sfmt(CR.y2008.rateFrom,2)}%(물가 때문에 올린 상태)`],['2008-09~2009-02',`기준금리 ${U.sfmt(CR.y2008.rateFrom,2)}% → ${U.sfmt(CR.y2008.rateTo,2)}%`],[CR.y2008.swapDate,`한미 통화스와프 ${CR.y2008.swap}억 달러`],['2008년 4분기',`산출 전기 대비 ${U.sfmt(CR.y2008.q4QoQ,1)}%(연율 약 ${CR.y2008.q4Annualized}%로 요약됨)`]]},
 '2020':{title:'2020 코로나19 충격',grade:'보도',steps:[[CR.y2020.cutDate,`임시 회의, 기준금리 ${U.sfmt(CR.y2020.rateFrom,2)}% → ${U.sfmt(CR.y2020.rateTo,2)}%`],[CR.y2020.swapDate,`한미 통화스와프 ${CR.y2020.swap}억 달러`],['다음 날',`원/달러 종가 ${U.fmt(CR.y2020.nextDayClose,1)}원(${U.sfmt(CR.y2020.nextDayChange,1)}원)`],['2020년',`연간 성장률 ${U.sfmt(CR.y2020.growth2020,1)}%`]]}
};
MLabs['crisis-timeline']=el=>{
 const before=M.r2(CR.y2020.nextDayClose-CR.y2020.nextDayChange);
 U.setup(el,U.select('ccase','위기',Object.entries(CASES).map(([k,c])=>[k,c.title]),'2008')+U.group('환율 변화를 두 기준으로 (원/달러)',U.number('cbefore','이전',1,100000,0.1,before,'기본값: 2020년 스와프 전날 종가(다음 날 1,246.5원 + 39.2원)')+U.number('cafter','이후',1,100000,0.1,CR.y2020.nextDayClose))+U.number('cq','분기 성장률, 전기 대비 (%)',-30,30,0.1,CR.y2008.q4QoQ,'네 분기 이어진다고 놓고 연율로'),true);
 U.bind(el,()=>{
  const key=U.value(el,'ccase'),c=CASES[key],b=U.num(el,'cbefore'),a=U.num(el,'cafter'),q=U.num(el,'cq');
  for(const [v,name,w] of [[b,'이전 환율','1원 이상으로 넣어야 합니다.'],[a,'이후 환율','1원 이상으로 넣어야 합니다.'],[q,'분기 성장률','−30%에서 30% 사이로 넣어야 합니다.']])if(v===null)return U.result(el,'',U.problem(name,w));
  const mv=M.fxMove(b,a),ann=M.annualize(q/100),N=M.crisisNumbers();
  const list=`<ol class="stage-list">${c.steps.map(([d,t],i)=>`<li${i===0?' class="current"':''}><span>${i+1}. ${d}</span><b>${t}</b></li>`).join('')}</ol>`;
  const comp=U.table(['위기','환율','기준금리 변화','성장률'],[['1997',`${CR.y1997.usdkrwBefore}원대 → ${U.fmt(CR.y1997.usdkrwPeak,1)}원, 1달러당 원화 ${U.spct(N.fx1997.perDollar,1)}`,'이 책에서 다루지 않음',`1998년 ${U.sfmt(CR.y1997.growth1998.first,1)}%·${U.sfmt(CR.y1997.growth1998.current,1)}%(계열 차이 ${U.sfmt(N.growth1998Gap,1)}%p, 확인 중)`],['2008',`원화 약 ${CR.y2008.krwWeaker}% 약세(계산 기준 확인 못함)`,`${U.splus(N.rate2008,2)}%p`,`4분기 ${U.sfmt(CR.y2008.q4QoQ,1)}%, 연율 ${U.pct(N.annual2008,1)}`],['2020',`스와프 다음 날 종가 ${U.fmt(CR.y2020.nextDayClose,1)}원(${U.sfmt(CR.y2020.nextDayChange,1)}원)`,`${U.splus(N.rate2020,2)}%p`,`연간 ${U.sfmt(CR.y2020.growth2020,1)}%`]].map(r=>r[0]===key?[`▲ ${r[0]}`,...r.slice(1)]:r),'세 위기 비교 (보도·학술 기준)',true);
  const chart=`<p class="caption"><b>${c.title}</b> · 일어난 차례 (${c.grade} 기준)</p>`+list+comp+U.columns({labels:['1달러당|원화','원화 1원의|달러 가치'],values:[mv.perDollar*100,mv.wonValue*100],fmt:v=>U.per(v),tick:v=>U.sfmt(v,0)+'%',title:`${U.fmt(b,1)}원 → ${U.fmt(a,1)}원 (%)`,twoLine:true,h:230,label:`1달러당 원화 ${U.spct(mv.perDollar)}, 원화 1원의 달러 가치 ${U.spct(mv.wonValue)}`});
  U.result(el,chart,`▲ ${c.title}: ${c.steps.map(s=>`${s[0]} ${s[1]}`).join(' → ')}.<br>환율 칸의 원/달러 ${U.fmt(b,1)}원 → ${U.fmt(a,1)}원: 1달러당 원화 = ${U.fmt(a,1)} ÷ ${U.fmt(b,1)} − 1 = <b>${U.spct(mv.perDollar)}</b>, 원화 1원의 달러 가치 = ${U.fmt(b,1)} ÷ ${U.fmt(a,1)} − 1 = <b>${U.spct(mv.wonValue)}</b>.<br>분기 성장률 ${U.sfmt(q,1)}%가 네 분기 이어지면 연율 = (1 ${q<0?'−':'+'} ${U.sfmt(Math.abs(q),1)}%)⁴ − 1 = <b>${U.pct(ann,1)}</b>.<br>세 위기에서 먼저 크게 움직인 것은 환율과 외화 자금 사정이었고, 성장률은 분기가 지난 뒤 숫자로 나왔습니다(이 책이 보도 기준으로 정리한 순서). 출처끼리 어긋나는 값(1997년 12월 외환보유액, 2020년 3월 장중 고점)은 쓰지 않았습니다.${U.kind(['real','news','unknown'],'1998년 성장률 두 계열의 차이와 2008년 “약 40% 약세”의 계산 기준은 확인하지 못했습니다.')}`);
 });
};
})();
