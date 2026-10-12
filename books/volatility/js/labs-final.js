/* 10장 마지막 과제: 하린의 1년 기록 두 장. 첫 장은 누리200(생성기 시드 524, 하루 1.2%)과 날마다 k배로 맞춘 상품,
   둘째 장은 새벽전자 기록에 1~9장의 자를 모두 대고, 같은 σ의 무작위 보행(시작 20,000원, 시드 1부터)에서 그 값 이상이 나오는 비율을 센다. */
(()=>{
'use strict';
const U=VUI,M=VMath,F=U.fmt,P=U.pct,PP=U.ppct,D=U.DATA;
const PARTS={year:['1년 전체',0,250],first:['앞 120일',0,120],gen:['생성한 130일',119,250]};
function nuriSheet(k){
 const p=D.nuri(),R=M.simpleReturns(p),L=M.leveragedPath(R,k,{start:100}),lr=M.logReturns(p),v=M.variance(lr,0),g=p[250]/100;
 const ap=M.leveragedApprox(g,k,v,250),name={2:'2배','-2':'인버스 2배',3:'3배'}[k],coef=(k*k-k)/2;
 const chart=U.lines({series:[{values:p,name:'누리200 지수'},{values:L,name:`누리200 ${name}`}],hlines:[[100,'100']],xunit:'일',h:250,label:`누리200은 100에서 ${F(p[250],2)}, ${name} 상품은 ${F(L[250],2)}`});
 const text=`<b>첫 장 · 누리200</b>: 지수는 100에서 최저 ${F(Math.min(...p),1)}, 최고 ${F(Math.max(...p),1)}${U.josa(F(Math.max(...p),1),'을','를')} 지나 250일째 <b>${F(p[250],2)}</b>입니다. 날마다 ${name}로 다시 맞춘 상품은 100에서 <b>${F(L[250],2)}</b>(<b>${PP(L[250]/100-1)}</b>)이고, 처음에 ${name}로 한 번만 샀다면 ${PP(M.staticLeverage(g-1,k))}였습니다.<br>하루 로그 수익률 σ ${P(M.sd(lr))}(연율 ${P(M.annualizeVol(M.sd(lr)),1)}), 하루 분산의 합 Σσ² = ${F(v*250,4)}. 어림식 ${F(g,4)}^${k<0?`(${k})`:k} × e^(−${F(coef,0)} × ${F(v*250,4)}) ≈ <b>${F(ap,4)}</b>, 날마다 곱한 값 <b>${F(L[250]/100,4)}</b>. 최대 낙폭은 지수 ${P(M.maxDrawdown(p).mdd,1)}, 상품 ${P(M.maxDrawdown(L).mdd,1)}입니다.`;
 return {chart,text};
}
/* 같은 σ의 무작위 보행 N개에서 기록의 숫자만큼 치우친 값이 나온 개수. 시작 20,000원, 날 수는 기록의 종가 수와 같다. */
function chance(n,sd,N){return U.memo(`fin|${n}|${sd}|${N}`,()=>M.monteCarlo({n,vol:sd,start:20000,seed:1},N,q=>{const l=M.logReturns(q);return {z8:M.varianceRatio(l,8).z,ac:M.autocorr(l,1),cr:M.crossingsOfLevels(q,M.HARIN_LINES).total,md:M.maxDrawdown(q).mdd};}));}
function saebyeokSheet(part,N){
 const [name,a,b]=PARTS[part],c=D.closes().slice(a,b),r=M.logReturns(c),S=M.summarize(c),v8=M.varianceRatio(r,8),atr=M.atrWilder(D.year(),14)[b-1],cr=M.crossingsOfLevels(c,M.HARIN_LINES).total;
 const sim=chance(c.length,M.sd(r),N),cnt=f=>sim.filter(f).length,share=k=>`${F(k)}개 (${P(k/N,1)})`;
 const zC=cnt(s=>v8.z<0?s.z8<=v8.z:s.z8>=v8.z),aC=cnt(s=>S.ac1>=0?s.ac>=S.ac1:s.ac<=S.ac1),cC=cnt(s=>s.cr>=cr),dC=cnt(s=>s.md<S.mdd.mdd);
 const rows=[['VR(8)의 z',zf(v8.z),`${v8.z<0?'그 이하':'그 이상'} ${share(zC)}`],['ρ₁',U.splus(S.ac1,3),`${S.ac1>=0?'그 이상':'그 이하'} ${share(aC)}`],['격자 선 통과',`${F(cr)}회`,`그 이상 ${share(cC)}`],['최대 낙폭',P(S.mdd.mdd,1),`더 깊음 ${share(dC)}`]];
 const chart=U.lines({series:[{values:c,name:`새벽전자 ${name} 종가 (원)`}],band:[18000,22000,'격자 범위'],xunit:'일',h:230,label:`새벽전자 ${name} 종가`})+U.table(['숫자','기록','같은 σ의 무작위 보행 '+F(N)+'개'],rows,`우연과 견주기 · σ ${P(M.sd(r))}, 시드 1부터`);
 const text=`<b>둘째 장 · 새벽전자 ${name}</b>(하루 수익률 ${S.n}개): 연율 변동성 <b>${P(S.annualVol,1)}</b>, ${b}일째 14일 ATR <b>${F(atr,1)}원</b>(종가 ${F(c.at(-1))}원의 ${P(atr/c.at(-1))}), ρ₁ <b>${U.splus(S.ac1,3)}</b>(띠 ±${F(S.band,3)} ${Math.abs(S.ac1)>S.band?'밖 ▲':'안'}).<br>VR(5) = <b>${F(S.vr.vr,2)}</b>(z ${zf(S.vr.z)}) · VR(8) = <b>${F(v8.vr,3)}</b>(z ${zf(v8.z)}). 격자 선 21개 통과 <b>${F(cr)}회</b>, 최대 낙폭 <b>${P(S.mdd.mdd,1)}</b>${S.mdd.recovery===null?'(✗ 아직 회복 못 함)':'(✓ 회복)'}.<br>같은 σ의 무작위 보행 ${F(N)}개와 견주면: VR(8)의 z가 ${zf(v8.z)} ${v8.z<0?'이하':'이상'}인 경로 <b>${share(zC)}</b>, ρ₁이 ${U.splus(S.ac1,3)} ${S.ac1>=0?'이상':'이하'} <b>${share(aC)}</b>, 통과 ${F(cr)}회 이상 <b>${share(cC)}</b>, 더 깊은 낙폭 <b>${share(dC)}</b>.`;
 return {chart,text};
}
const zf=z=>U.sfmt(z,2);
VLabs.records=el=>{
 U.setup(el,U.select('fk','첫 장: 누리200 상품의 배율',[['2','2배'],['-2','인버스 2배 (−2배)'],['3','3배']],'2')+U.select('fpart','둘째 장: 새벽전자 구간',[['year','1년 전체 (250일)'],['first','앞 120일 (12권 시나리오)'],['gen','생성한 130일 (121~250일)']],'year')+U.select('fpaths','견줄 무작위 보행 수',[['200','200개'],['1000','1,000개']],'1000','시드 1부터, 기록과 같은 하루 σ'));
 U.bind(el,()=>{
  const k=Number(U.value(el,'fk')),part=U.value(el,'fpart'),N=Number(U.value(el,'fpaths')),a=nuriSheet(k),b=saebyeokSheet(part,N);
  U.result(el,a.chart+b.chart,`${a.text}<br><br>${b.text}<br>이 숫자들은 지난 기록이 무작위 보행과 얼마나 다른지를 말할 뿐, 다음 해의 방향이나 모양은 말해 주지 않습니다.${U.kind(['real','scenario','gen'],'누리200·누리200 2배·새벽전자는 모두 가상이고, 보수·비용은 넣지 않았습니다.')}`);
 });
};
})();
