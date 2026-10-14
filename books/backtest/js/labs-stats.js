/* 5·6장 실험: 샤프·최대 낙폭·부트스트랩 구간 실험(5장)과 표본 안 1등의 표본 밖 성적 실험(6장).
   계산은 BMath.a5Stats·hold·bootstrap·yearSharpe·monthly·overfit·emax·emaxSim·walkForward·isBestDetail·rankCheck만 쓴다.
   6장은 독자가 표본 안 다섯 설정 가운데 하나를 고른 뒤에만 표본 밖 수익률·순위·순위 상관·걷기 전진을 연다(책 AGENTS.md).
   기대 최대 샤프 칸의 기본값은 설정 10개이며, 1,000개 값은 독자가 그 칸을 고를 때만 나온다(확인 문제의 답을 미리 보이지 않음).
   기본값과 계산기의 예제 목록은 L2·확인 문제의 입력과 다르다. 3년째 숫자에는 “지어낸 3년째” 꼬리표를 붙인다. */
(()=>{
'use strict';
const U=BUI,M=BMath,S=BData.SCENARIO;
const p2=x=>U.pct(x,2),s3=x=>U.sfmt(x,3),MADE=M.TEXT.madeYear3;
/* 평가 금액 곡선(만 원)과 최대 낙폭의 고점(▲)·저점(◆). 날 번호는 시작 금액을 0번으로 센 “번째 거래일”. */
function curveChart(curve,m,name){
 const pts=curve.map((v,i)=>[i+1,v/1e4]);
 return U.xy({series:[{name,pts,color:'var(--accent)',width:1.8}],points:[{name:`최대 낙폭의 고점(${m.peakDay}번째 거래일)`,x:m.peakDay,y:(m.peakDay?curve[m.peakDay-1]:S.capital)/1e4,shape:'▲',color:'var(--blue)'},{name:`최대 낙폭의 저점(${m.troughDay}번째 거래일)`,x:m.troughDay,y:curve[m.troughDay-1]/1e4,shape:'◆',color:'var(--orange)'}],
  refs:[{y:300,text:'시작 300만 원'},{x:500,text:MADE}],xlabel:'번째 거래일',ylabel:'만 원',ytick:v=>U.sfmt(v),h:310,label:`${name}: 최대 낙폭 ${p2(m.mdd)}`});
}
/* 다시 뽑은 연 수익률의 막대 그림(14칸). 0 아래 칸은 주황. */
function histogram(b){
 const v=b.values,lo=v[0],hi=v[v.length-1],k=14,w=(hi-lo)/k||1,bins=Array(k).fill(0);
 v.forEach(x=>{bins[Math.min(k-1,Math.floor((x-lo)/w))]++;});
 return U.columns({labels:bins.map((_,i)=>i%3===0?U.sfmt((lo+i*w)*100,0)+'%':''),values:bins,fmt:v=>v?U.fmt(v):'',tick:v=>U.fmt(v),colors:bins.map((_,i)=>lo+(i+1)*w<=0?'var(--orange)':'var(--blue)'),
  label:`다시 뽑은 연 수익률 ${U.fmt(b.n)}개의 분포`,title:`다시 뽑은 3년 ${U.fmt(b.n)}개의 연 수익률(주황: 0 아래)`,h:250});
}
const memo={};
function picked(kind,n){const key=kind+n;if(memo[key])return memo[key];const A=M.a5Stats(),m=kind==='hold'?A.hold:A;return memo[key]={m,boot:M.bootstrap(m.r,n),years:M.yearSharpe(m.r),lag1:M.autocorr1(m.r)};}
function monthlyText(el){
 const r=U.list(el,'mr',2),v=U.list(el,'mv',2);
 if(r===null)return U.problem('월 수익률','쉼표로 나눈 숫자(%)를 두 개 이상 넣어 주세요.');
 const o=M.monthly(r.map(x=>x/100),v);
 if(!(o.sd>0))return U.problem('월 수익률','값이 모두 같으면 표준편차가 0이라 샤프 비율을 계산할 수 없습니다.');
 return `월 수익률 ${r.length}개: 평균 ${U.sfmt(o.mean*100,3)}%, 모표준편차 ${U.sfmt(o.sd*100,3)}%, 월 샤프 <b>${s3(o.sharpe)}</b>, √12로 연율화 <b>${s3(o.annual)}</b>`+(v===null?`. ${U.problem('평가 금액','쉼표로 나눈 금액을 두 개 이상 넣어 주세요.')}`:`, 평가 금액 ${v.length}개의 최대 낙폭 <b>${U.pct(o.mdd,2)}</b>.`);
}
BLabs['sharpe-boot']=el=>{
 U.setup(el,U.select('sc','평가 금액 곡선',[['grid','격자(4장 현실 가정, 연 5.62%)'],['hold','같은 기간 보유(첫날 시가에 사서 들고 있음)']],'grid')+U.select('sn','부트스트랩 횟수',[['1000','1,000번'],['10000','1만 번']],'1000','난수 씨앗 2026, 날마다 수익률 750개를 복원 추출')
  +U.group('월 수익률 계산기(직접 입력)',U.text('mr','월 수익률(%, 쉼표로 나눔)','+1, −2, +2, +1, 0, −1')+U.text('mv','평가 금액(만 원, 쉼표로 나눔)','100, 101, 99, 101, 102, 102, 101','최대 낙폭은 그때까지의 고점에서 잰 가장 깊은 낙폭입니다')),true);
 U.bind(el,()=>{
  const kind=U.value(el,'sc'),n=+U.value(el,'sn'),{m,boot,years,lag1}=picked(kind,n),A=M.a5Stats(),name=kind==='hold'?'같은 기간 보유의 평가 금액':'격자의 평가 금액(4장 현실 가정)';
  const yt=U.table(['해','샤프 비율(무위험 0)','꼬리표'],years.map((s,i)=>[`${i+1}년째`,`<b>${s3(s)}</b>`,i===2?`<span class="kind-tag warn-tag">${MADE}</span>`:'—']),'해마다 나눈 샤프 비율','fit');
  const cmp=U.table(['곡선','연 수익률','연 변동성','샤프','최대 낙폭'],[['격자(4장 현실 가정)',p2(A.ann),p2(A.vol),s3(A.sharpe),p2(A.mdd)],['같은 기간 보유(세전)',p2(A.hold.ann),p2(A.hold.vol),s3(A.hold.sharpe),p2(A.hold.mdd)]],'같은 기간의 두 곡선','cards');
  const text=`${kind==='hold'?`같은 기간 보유(첫날 시가에 ${U.fmt(A.hold.shares)}주를 사서 배당을 받으며 들고 있음, 세전): 3년 ${U.spct(A.hold.total,2)}, `:'격자(4장 현실 가정): '}연 수익률 <b>${p2(m.ann)}</b>, 연 변동성 ${p2(m.vol)}, 샤프 비율 <b>${s3(m.sharpe)}</b>(무위험 수익률 0 가정), 최대 낙폭 <b>${p2(m.mdd)}</b>(${m.peakDay}번째 거래일 고점 → ${m.troughDay}번째 거래일 저점).`
   +`<br>부트스트랩 ${U.fmt(boot.n)}번: 95% 구간 <b>${U.spct(boot.lo,2)} ~ ${U.spct(boot.hi,2)}</b>, 0 아래 <b>${p2(boot.pNeg)}</b>. 날마다 수익률의 1차 자기상관 ${U.sfmt(lag1,2)}.`
   +`<br>해마다 샤프 ${years.map((s,i)=>`${i+1}년째 ${s3(s)}${i===2?`(${MADE})`:''}`).join(', ')}. ${M.TEXT.year3Note}.`
   +`<br>0 아래 비율은 날마다 수익률이 지난 3년과 같은 분포에서 서로 독립으로 나온다고 놓고 다시 만든 3년 가운데 손실로 끝난 것의 비율이며, 다음 3년의 손실 확률이 아닙니다.<br>${monthlyText(el)}${U.kind(['real','scenario'])}`;
  U.result(el,curveChart(kind==='hold'?m.curve:M.step('A5').curve,m,name)+histogram(boot)+yt+cmp,text);
 });
};

/* ── 6장: 표본 안 1등의 표본 밖 성적 실험 ── */
const cfgName=c=>`${U.fmt(c.low)}~${U.fmt(c.top)}원 · ${U.fmt(c.step)}원 · ${c.n}칸 · 칸당 ${c.q}주`;
const ENS=[10,100,402,1000];let SIM=null;/* 모의실험은 N = 10·100·402·1,000을 한 난수 줄(씨앗 2028)로 차례로 돌린 값(BMath.emaxSim(), 본문·tests/math.test.cjs와 같은 값) */
function emaxPart(el){
 const N=+U.value(el,'en'),shown=ENS.filter(x=>x<=N),sim=SIM||(SIM=M.emaxSim());
 const chart=U.columns({labels:shown.map(x=>`${U.fmt(x)}개`),values:shown.map(x=>M.emax(x).sharpe),fmt:v=>U.sfmt(v,3),tick:v=>U.sfmt(v,1),mark:i=>i===shown.length-1,label:'실력이 0인 설정들의 1등 연 샤프 기대값(500거래일 기준)',title:'1등 연 샤프 기대값(실력 0, 500거래일, ▲ 고른 칸)',h:230});
 return {chart,text:`기대 최대 샤프 칸: 실력이 0인 설정 ${U.fmt(N)}개를 500거래일로 재면 1등의 연 샤프 기대값 <b>${U.sfmt(M.emax(N).sharpe,3)}</b>(식, 접힌 상자), 모의실험 2,000번의 평균 ${U.sfmt(sim[N],3)}(난수 씨앗 2028).${N===1000?' 1,000개는 이 칸에만 있고, 실제로 시험한 설정은 402개입니다.':''}`};
}
function revealPart(o,pick,alt){
 const W=M.walkForward(),top=topFive(o),me=top[pick];
 const scatter=U.xy({series:[],dots:o.IS.map((x,i)=>[x*100,o.OOS[i]*100]),dotsName:`설정 ${o.N}개(점 하나가 설정 하나)`,points:[{name:'표본 안 1등(▲)',x:o.isBest*100,y:o.oosBest*100,shape:'▲',color:'var(--orange)'},{name:'내가 고른 설정(◆)',x:o.IS[me]*100,y:o.OOS[me]*100,shape:'◆',color:'var(--accent)'}],
  refs:[{y:0,text:'0%'}],xlabel:'표본 안(1~2년째) 연 수익률 %',ylabel:`표본 밖(3년째${alt?', 다른 기록':`, ${MADE}`}) 연 수익률 %`,xtick:v=>U.sfmt(v,0),ytick:v=>U.sfmt(v,0),h:330,label:`표본 안과 표본 밖 연 수익률, 설정 ${o.N}개`});
 const rows=top.map((i,k)=>[`${k+1}위${k===pick?' ◆':''}`,cfgName(M.combos()[o.idx[i]]),p2(o.IS[i]),`<b>${p2(o.OOS[i])}</b>`,`${o.OOS.filter(x=>x>o.OOS[i]).length+1}위`]);
 const wf=U.table(['고른 해','그해 1등 설정','고른 해 연 수익률','다음 해 연 수익률'],W.map(w=>[`${w.trainYear}년째`,cfgName(w.cfg),p2(w.trainBest),`<b>${p2(w.test)}</b>${w.trainYear===2?` (${MADE})`:''}`]),'걷기 전진(1년으로 고르기 → 다음 1년 시험, 설정 402개)','cards');
 return {chart:scatter+U.table(['표본 안 순위','설정','표본 안','표본 밖','표본 밖 순위'],rows,'표본 안 다섯 설정의 표본 밖 성적','cards')+wf,
  text:`고른 설정(표본 안 ${pick+1}위): 표본 안 ${p2(o.IS[me])} → 표본 밖 <b>${p2(o.OOS[me])}</b>.<br>표본 안 1등 ${cfgName(o.cfg)}: 표본 안 <b>${p2(o.isBest)}</b> → 표본 밖 <b>${p2(o.oosBest)}</b>(${o.N}개 중 <b>${o.oosRank}위</b>). 표본 안 중앙값 ${p2(o.isMedian)}, 표본 밖 중앙값 ${p2(o.oosMedian)}, 순위 상관 <b>${U.sfmt(o.rho,3)}</b>.`
   +`<br>걷기 전진: ${W.map(w=>`${w.trainYear}년째 1등 ${p2(w.trainBest)} → ${w.trainYear+1}년째 ${p2(w.test)}`).join(', ')}.${alt?' 다른 3년째는 1·2년째와 같은 성질로 지은 가정의 기록입니다.':` ${M.TEXT.year3Note}.`}`};
}
const topFive=o=>o.IS.map((_,i)=>i).sort((a,b)=>o.IS[b]-o.IS[a]||a-b).slice(0,5);
BLabs['is-oos']=el=>{
 U.setup(el,U.select('on','시험할 설정 수',[['10','10개'],['100','100개'],['402','402개(전체)']],'10','402개 목록에서 고르게 건너뛰어 고릅니다')+U.select('od','3년째 자료',[['made',`${MADE}(하락·낮은 변동성)`],['alt','1·2년째와 같은 성질의 3년째(가정)']],'made')
  +U.select('op','표본 안 다섯 설정 가운데 3년째에 돌릴 설정',[['','먼저 고르기'],['0','표본 안 1위'],['1','표본 안 2위'],['2','표본 안 3위'],['3','표본 안 4위'],['4','표본 안 5위']],'','고른 뒤에 표본 밖 결과가 열립니다')
  +U.group('기대 최대 샤프 칸',U.select('en','실력이 0인 설정 수',ENS.map(x=>[String(x),`${U.fmt(x)}개`]),'10'))
  +U.group('표본 안·밖 순위 계산기(직접 입력)',U.text('rI','표본 안 수익률(%, 쉼표로 나눔)','14, 11, 9, 7, 5')+U.text('rO','표본 밖 수익률(%, 같은 순서)','2, 6, 1, 8, 5')),true);
 U.bind(el,()=>{
  const N=+U.value(el,'on'),alt=U.value(el,'od')==='alt',pick=U.value(el,'op'),o=M.overfit(N,alt),top=topFive(o),C=M.combos(),e=emaxPart(el);
  const list=U.table(['표본 안 순위','설정','표본 안(1~2년째) 연 수익률'],top.map((i,k)=>[`${k+1}위`,cfgName(C[o.idx[i]]),`<b>${p2(o.IS[i])}</b>`]),`설정 ${o.N}개의 표본 안 다섯 설정`,'cards');
  const I=U.list(el,'rI',2),O=U.list(el,'rO',2);let calc;
  if(I===null||O===null)calc=U.problem('순위 계산기','쉼표로 나눈 숫자를 두 개 이상 넣어 주세요.');
  else if(I.length!==O.length)calc=U.problem('순위 계산기','표본 안과 표본 밖 수익률의 개수를 같게 넣어 주세요.');
  else{const r=M.rankCheck(I,O);calc=`순위 계산기: 표본 안 1등은 ${r.best+1}번째 설정(${U.sfmt(I[r.best],2)}%), 표본 밖 <b>${r.oosRank}위</b>(${U.sfmt(O[r.best],2)}%), 두 수익률의 차이 <b>${U.sfmt(r.gap,2)}%p</b>.`;}
  const head=`설정 ${o.N}개를 1~2년째(표본 안)로 돌려 줄 세웠습니다. 표본 안 1등 ${p2(o.isBest)}, 중앙값 ${p2(o.isMedian)}.`;
  if(pick===''){U.result(el,list+e.chart,`${head}<br>▲ 다섯 설정 가운데 하나를 고르면 3년째(표본 밖) 결과가 열립니다.<br>${e.text}<br>${calc}${U.kind(['real','scenario','paper'])}`);return;}
  const R=revealPart(o,+pick,alt);
  U.result(el,list+R.chart+e.chart,`${head}<br>${R.text}<br>${e.text}<br>${calc}<br>${M.TEXT.notExpected}.${U.kind(['real','scenario','paper'])}`);
 });
};
})();
