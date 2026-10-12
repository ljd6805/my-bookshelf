/* 7~9장 실험: 분산비, 구간 통과 횟수, 최대 낙폭과 회복 기간. 기록(새벽전자·제자리 경로)과 생성기 경로를 같은 자로 잰다.
   생성기 설정을 움직이면 기록 선택이 “생성기”로 바뀐다. 몬테카를로 경로는 4,000개 이하이며 결과는 VUI.memo에 남는다. */
(()=>{
'use strict';
const U=VUI,M=VMath,F=U.fmt,P=U.pct,PP=U.ppct,D=U.DATA;
const KAPPAS=[0,.05,.2];
const toGen=(el,e,ids,sel)=>{if(e&&ids.includes(e.target.id))el.querySelector('#'+sel).value='gen';return el.querySelector('#'+sel).value;};
const zf=z=>U.sfmt(z,2);
/* 7장: VR(q)와 z. 기록이면 q = 2~12의 분산비를 함께, 생성기면 경로마다 잰 z의 분포와 |z| > 1.96인 비율. */
function vrGen(kappa,q,N){return U.memo(`vr|${kappa}|${q}|${N}`,()=>M.monteCarlo({n:250,seed:11,kappa},N,p=>M.varianceRatio(M.logReturns(p),q)));}
VLabs.vratio=el=>{
 U.setup(el,U.select('vsrc','기록',[['sy120','새벽전자 앞 120일'],['sy','새벽전자 1년'],['gen','생성기 경로 (시드 11부터, 하루 1%, 250일)']],'sy120')+U.range('vq','묶는 날 수 q',2,20,1,8,'방향키로 하루씩')+U.range('vkappa','κ: 시작가 쪽으로 당기는 비율',0,.5,.01,0,'움직이면 생성기 경로로 바뀝니다')+U.select('vpaths','생성기 경로 수',[['300','300개'],['1000','1,000개'],['4000','4,000개']],'4000','바꾸면 생성기 경로로 바뀝니다'));
 U.bind(el,e=>{
  const src=toGen(el,e,['vkappa','vpaths'],'vsrc'),q=Number(U.value(el,'vq')),kappa=Number(U.value(el,'vkappa')),N=Number(U.value(el,'vpaths'));
  if(src!=='gen'){
   const c=src==='sy'?D.closes():D.closes().slice(0,120),r=M.logReturns(c),v=M.varianceRatio(r,q),qs=Array.from({length:11},(_,i)=>i+2),prof=qs.map(k=>M.varianceRatio(r,k).vr);
   const word=Math.abs(v.z)<=1.96?'무작위 보행과 구별되지 않음':v.vr<1?'되돌림 쪽':'같은 방향이 이어지는 쪽',three=[2,5,8].map(k=>`q = ${k}: ${F(M.varianceRatio(r,k).vr,3)}`).join(' · ');
   const chart=U.columns({labels:qs.map(String),values:prof,base:1,mark:i=>qs[i]===q,fmt:v=>F(v,2),tick:v=>F(v,1),title:`q마다의 VR(q) · 기준선 1 (▲ 고른 q = ${q})`,label:`VR 막대. 고른 q ${q}에서 ${F(v.vr,3)}`});
   return U.result(el,chart,`${src==='sy'?'새벽전자 1년':'새벽전자 앞 120일'}, 하루 수익률 T = ${r.length}개, q = ${q}: VR(${q}) = <b>${F(v.vr,3)}</b>, z = <b>${zf(v.z)}</b> → ${Math.abs(v.z)>1.96?'|z| > 1.96, ':'|z| ≤ 1.96, '}<b>${word}</b>.<br>같은 기록에서 ${three}. q를 무엇으로 잡느냐에 따라 판정이 달라지므로 VR에는 늘 q를 함께 적습니다.${src==='sy'?U.kind(['real','scenario','gen'],'앞 120일의 80일은 8거래일 주기 박스권(12권 13장 가상 시나리오), 뒤 130일은 생성기(시드 20)입니다.'):U.kind(['real','scenario'],'12권 13장 가상 시나리오입니다(앞 80일은 8거래일 주기 박스권).')}`);
  }
  const s=vrGen(kappa,q,N),z=s.map(x=>x.z),rej=z.filter(v=>Math.abs(v)>1.96).length/N,mvr=M.mean(s.map(x=>x.vr));
  const chart=U.histogram({values:z,bins:28,lines:[[-1.96,'−1.96'],[1.96,'+1.96']],outside:v=>Math.abs(v)>1.96,fmt:v=>U.sfmt(v,1),range:[Math.min(-4,...z),Math.max(4,...z)],title:`경로 ${F(N)}개의 z · VR(${q})`,label:`생성기 z 분포. |z| > 1.96 비율 ${P(rej,1)}`});
  U.result(el,chart,`생성기 κ = ${F(kappa,2)}, 경로 ${F(N)}개(시드 11부터), q = ${q}: VR(${q}) 평균 <b>${F(mvr,3)}</b>, |z| > 1.96으로 무작위 보행을 기각한 경로 <b>${P(rej,1)}</b>(${F(Math.round(rej*N))}개).<br>${kappa===0?'이 경로들은 실제로 무작위 보행이므로 기각은 모두 잘못된 판정이고, 5% 문턱이면 스무 번에 한 번쯤 나옵니다.':`이 경로들은 시작가로 끌려가는 경로인데, 그 성질을 알아챈(기각한) 비율이 ${P(rej,1)}입니다.`}${U.kind(['real','gen'],'z의 분모는 수익률이 독립·동분산이라는 가정의 표준오차입니다.')}`);
 });
};
/* 8장: 시작가 선을 건넌 횟수(생성기) 또는 하린의 격자 선 21개를 종가가 건넌 횟수(새벽전자). */
function crossGen(kappa,vol,n){return U.memo(`cr|${kappa}|${vol}|${n}`,()=>M.monteCarlo({n,vol,kappa},300,q=>M.levelCrossings(q,q[0]).count));}
VLabs.crossing=el=>{
 U.setup(el,U.select('xsrc','기록',[['gen','생성기 경로 300개 · 시작가 선'],['sy','새벽전자 1년 · 하린의 격자 선 21개']],'gen')+U.range('xkappa','κ: 시작가 쪽으로 당기는 비율',0,.3,.01,0,'움직이면 생성기 경로로 바뀝니다')+U.range('xvol','하루 변동성 σ (%)',.5,3,.1,1)+U.select('xdays','거래일 수',[['250','250일'],['1000','1,000일']],'250'));
 U.bind(el,e=>{
  const src=toGen(el,e,['xkappa','xvol','xdays'],'xsrc'),kappa=Number(U.value(el,'xkappa')),vol=Number(U.value(el,'xvol'))/100,n=Number(U.value(el,'xdays'));
  if(src==='sy'){
   const c=D.closes(),L=M.HARIN_LINES,all=M.crossingsOfLevels(c,L),T=x=>M.crossingsOfLevels(x,L).total,parts=[T(c.slice(0,80)),T(c.slice(79,120)),T(c.slice(119))],l2=M.levelCrossings(c,20000).count;
   const chart=U.lines({series:[{values:c,name:'새벽전자 종가 (원)'}],band:[18000,22000,'격자 18,000~22,000원'],vspan:[0,79,'앞 80일 박스권'],xunit:'일',h:240,label:`새벽전자 1년 종가와 격자 범위. 선 21개 통과 ${all.total}회`})
    +U.columns({labels:L.map(v=>U.fmt(v/1000,1)),values:all.each,fmt:v=>F(v),tick:v=>F(v),mark:i=>L[i]===20000,title:'선마다 통과 횟수 (천 원, ▲ 20,000원 선)',label:`선마다 통과 횟수. 20,000원 선 ${l2}회`});
   return U.result(el,chart,`새벽전자 1년 종가가 하린의 격자 선 21개(18,000~22,000원, 200원 간격)를 건넌 횟수는 모두 <b>${F(all.total)}회</b>입니다. 앞 80일 박스권에서 <b>${parts[0]}회</b>, 81~120일 <b>${parts[1]}회</b>, 생성한 130일 <b>${parts[2]}회</b>입니다.<br>20,000원 선 하나만 보면 <b>${l2}회</b>이고, 앞 80일에 ${M.levelCrossings(c.slice(0,80),20000).count}회를 건넜습니다.${U.kind(['real','scenario','gen'],'종가 기준. 선과 같은 값은 직전 쪽을 유지합니다. 12권 13장 시나리오 120일 + 생성기(시드 20) 130일.')}`);
  }
  const s=crossGen(kappa,vol,n),avg=M.mean(s),rows=KAPPAS.map(k=>[`κ = ${F(k,2)}`,F(M.mean(crossGen(k,vol,n)),1),F(U.median(crossGen(k,vol,n)),0)]);
  const chart=U.histogram({values:s,bins:20,lines:[[avg,`평균 ${F(avg,1)}`]],fmt:v=>F(v,0),title:`경로 300개의 시작가 선 통과 횟수 · κ = ${F(kappa,2)}`,label:`통과 횟수 분포. 평균 ${F(avg,1)}회`})+U.table(['당기는 힘','평균','중앙값'],rows,`같은 σ ${F(vol*100,1)}% · ${F(n)}일에서 κ만 바꾼 값`);
  U.result(el,chart,`생성기 κ = ${F(kappa,2)}, 하루 σ ${F(vol*100,1)}%, ${F(n)}일, 경로 300개(시드 1부터): 시작가 선을 건넌 횟수는 평균 <b>${F(avg,1)}회</b>, 중앙값 ${F(U.median(s),0)}회, 가장 많은 경로 ${Math.max(...s)}회입니다.<br>같은 σ와 날 수에서 κ = 0 · 0.05 · 0.2이면 평균 ${rows.map(r=>`<b>${r[1]}회</b>`).join(' · ')}입니다. 무작위 보행(κ = 0)의 통과 횟수는 날 수가 아니라 대략 √n을 따라 자랍니다.${U.kind(['real','gen'],'정규 잡음, 추세 0, 하루 종가 기준.')}`);
 });
};
/* 9장: 낙폭 곡선과 최대 낙폭. 새벽전자 1년, 제자리 경로(지수·2배·인버스 2배, a = 1.5%), 생성기 경로 300개의 중앙값. */
function mddGen(kappa,n){return U.memo(`dd|${kappa}|${n}`,()=>M.monteCarlo({n,vol:.01,kappa},300,q=>M.maxDrawdown(q).mdd));}
function underwaterRecord(src){
 if(src==='sy'){
  const c=D.closes(),d=M.maxDrawdown(c);
  return {chart:U.lines({series:[{values:M.drawdownSeries(c).map(v=>v*100),name:'새벽전자 낙폭 (%)',color:'var(--accent)',dash:''}],vmark:[[d.peak,`${d.peak+1}일째 고점`],[d.trough,`${d.trough+1}일째 저점`]],hlines:[[0,'']],xunit:'일',yfmt:v=>`${U.sfmt(v,0)}%`,label:`새벽전자 낙폭 곡선. 최대 낙폭 ${P(d.mdd,1)}`}),
   text:`새벽전자 1년 종가의 최대 낙폭은 <b>${P(d.mdd,1)}</b>입니다. ${d.peak+1}일째 종가 <b>${F(c[d.peak])}원</b>이 고점, ${d.trough+1}일째 <b>${F(c[d.trough])}원</b>이 저점이었고, ${d.recovery===null?'<b>250일째까지 고점 값으로 돌아오지 못했습니다(✗ 회복 못 함)</b>':`${d.recovery+1}일째에 회복했습니다`}. 되찾으려면 저점에서 <b>${PP(M.recoveryNeeded(d.mdd),1)}</b>가 올라야 하고, 고점 아래에 머문 가장 긴 기간은 <b>${d.longestUnderwater}거래일</b>입니다.${U.kind(['real','scenario','gen'],'종가 기준, 12권 13장 시나리오 120일 + 생성기(시드 20) 130일.')}`};
 }
 const R=D.flat(.015),idx=M.pathFromReturns(100,R),two=M.leveragedPath(R,2,{start:100}),inv=M.leveragedPath(R,-2,{start:100}),dd=x=>M.maxDrawdown(x).mdd;
 return {chart:U.lines({series:[{values:M.drawdownSeries(idx).map(v=>v*100),name:'지수'},{values:M.drawdownSeries(two).map(v=>v*100),name:'2배'},{values:M.drawdownSeries(inv).map(v=>v*100),name:'인버스 2배'}].map(x=>({...x,values:x.values.filter((_,i)=>i%2===0)})),hlines:[[0,'']],xunit:'쌍',yfmt:v=>`${U.sfmt(v,0)}%`,label:`제자리 경로의 낙폭. 지수 ${P(dd(idx),3)}, 2배 ${P(dd(two))}, 인버스 2배 ${P(dd(inv))}`}),
  text:`2장의 제자리 경로(a = 1.5%, 250거래일)에서 지수의 최대 낙폭은 하루 내린 <b>${P(dd(idx),3)}</b>뿐이지만, 날마다 다시 맞춘 2배 상품은 <b>${P(dd(two))}</b>, 인버스 2배는 <b>${P(dd(inv))}</b>까지 빠졌습니다. 2배 상품은 첫날 고점 ${F(two[1],2)} 뒤로 ${Math.max(...two.slice(2))<two[1]?'1년 내내 그 아래에 있었습니다(✗ 회복 못 함)':'회복했습니다'}.${U.kind(['real','scenario'],'지어낸 제자리 경로, 보수·비용 없음.')}`};
}
VLabs.underwater=el=>{
 U.setup(el,U.select('usrc','기록',[['sy','새벽전자 1년'],['flat','제자리 경로의 지수·2배·인버스 2배'],['gen','생성기 경로 300개 (하루 1%)']],'sy')+U.range('ukappa','κ: 시작가 쪽으로 당기는 비율',0,.3,.01,0,'움직이면 생성기 경로로 바뀝니다')+U.select('udays','생성기 거래일 수',[['250','250일'],['1000','1,000일']],'250','바꾸면 생성기 경로로 바뀝니다')+U.number('udd','되찾을 낙폭 (%)',-95,0,.1,-20,'−95~0. 되찾는 데 필요한 상승률을 계산합니다'));
 U.bind(el,e=>{
  const src=toGen(el,e,['ukappa','udays'],'usrc'),kappa=Number(U.value(el,'ukappa')),n=Number(U.value(el,'udays')),dd=U.num(el,'udd');
  if(dd===null)return U.result(el,'',U.problem('되찾을 낙폭','−95에서 0 사이의 숫자(%)를 넣어야 합니다. 예: −20'));
  const need=`<br>낙폭 <b>${U.sfmt(dd,1)}%</b>를 되찾으려면 <b>${PP(M.recoveryNeeded(dd/100),1)}</b>가 올라야 합니다(1 / (1 + 낙폭) − 1).`;
  if(src!=='gen'){const r=underwaterRecord(src);return U.result(el,r.chart,r.text+need);}
  const s=mddGen(kappa,n),med=U.median(s),deeper=s.filter(v=>v<med).length,rows=KAPPAS.map(k=>[`κ = ${F(k,2)}`,P(U.median(mddGen(k,n)),1),P(Math.min(...mddGen(k,n)),1)]);
  const chart=U.histogram({values:s.map(v=>v*100),bins:20,lines:[[med*100,`중앙값 ${P(med,1)}`]],fmt:v=>`${U.sfmt(v,0)}%`,title:`경로 300개의 최대 낙폭 · κ = ${F(kappa,2)} · ${F(n)}일`,label:`최대 낙폭 분포. 중앙값 ${P(med,1)}`})+U.table(['당기는 힘','중앙값','가장 깊은 경로'],rows,`같은 하루 1% · ${F(n)}일에서 κ만 바꾼 값`);
  U.result(el,chart,`생성기 κ = ${F(kappa,2)}, 하루 1%, ${F(n)}일, 경로 300개(시드 1부터): 최대 낙폭의 중앙값은 <b>${P(med,1)}</b>이고, 가장 깊은 경로는 ${P(Math.min(...s),1)}입니다. ${deeper}개 경로가 중앙값보다 깊이 빠졌습니다.<br>같은 날 수에서 κ = 0 · 0.05 · 0.2의 중앙값은 ${rows.map(r=>`<b>${r[1]}</b>`).join(' · ')}입니다. 중앙값은 손실의 상한이 아닙니다.${U.kind(['real','gen'],'정규 잡음, 추세 0, 종가 기준.')}`+need);
 });
};
})();
