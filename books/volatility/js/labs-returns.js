/* 1~3장 실험: 단순·로그 수익률, 일일 재조정, 흔들림을 재는 세 자. 계산은 VMath, 여기서는 입력을 읽고 그리기만 한다.
   수익률은 소수로 계산하고 화면에서 %로 적는다. 새벽전자 기록은 VUI.DATA(12권 13장 시나리오 120일 + 생성기 시드 20의 130일)다. */
(()=>{
'use strict';
const U=VUI,M=VMath,F=U.fmt,P=U.pct,PP=U.ppct,D=U.DATA;
const arrow=a=>a.map(v=>F(v,v%1?2:0)).join(' → ');
/* 1장: 직접 적은 가격 또는 새벽전자 앞 120일 종가의 두 수익률과 이어 붙인 값. */
function returnsText(p,sy){
 const R=M.simpleReturns(p),r=M.logReturns(p),tot=M.compound(R),lsum=M.compound(r,'log'),avg=M.mean(R),d=sy?4:3;
 if(sy)return `새벽전자 첫날 종가 ${F(p[0])}원, 둘째 날 ${F(p[1])}원: 둘째 날의 단순 수익률은 <b>${P(R[0],3)}</b>, 로그 수익률은 <b>${P(r[0],3)}</b>로 거의 같습니다.<br>첫날부터 120일째 종가 ${F(p.at(-1))}원까지 하루 로그 수익률 <b>${r.length}개</b>를 모두 더하면 <b>${U.sfmt(lsum,d)}</b>이고, 되돌리면 e^${U.sfmt(lsum,d)} − 1 = <b>${P(Math.expm1(lsum))}</b>입니다. 두 종가를 직접 나눈 ${F(p.at(-1))} / ${F(p[0])} − 1 = ${P(p.at(-1)/p[0]-1)}와 같습니다. 단순 수익률을 그냥 더하면 ${P(R.reduce((s,v)=>s+v,0))}가 되어 어긋납니다.${U.kind(['real','scenario'],'12권 13장의 6개월 가상 시나리오에서 하루 마지막 가격 점을 종가로 썼습니다.')}`;
 const gap=avg-tot;
 return `가격 ${arrow(p)}: 단순 수익률은 ${R.map(v=>`<b>${PP(v)}</b>`).join(', ')}이고 산술 평균은 <b>${PP(avg)}</b>입니다. (1 + R)을 모두 곱하면 ${F(1+tot,4)}배, 곧 기간 전체 <b>${PP(tot)}</b>입니다.<br>로그 수익률은 ${r.map(v=>U.splus(v,d)).join(', ')}이고 모두 더하면 <b>${U.sfmt(lsum,d)}</b>, 되돌리면 e^${U.sfmt(lsum,d)} − 1 = <b>${PP(Math.expm1(lsum))}</b>로 곱한 값과 같습니다.<br>${Math.abs(gap)<5e-5?'✓ 산술 평균과 기간 전체 수익률이 같습니다.':`▲ 산술 평균이 기간 전체 수익률보다 <b>${U.splus(gap*100,2)}%p</b> ${gap>0?'큽니다':'작습니다'}. 단순 수익률을 더하거나 평균 내면 시작 금액이 바뀐 것을 놓칩니다.`}${U.kind('real','적은 가격을 그대로 계산했습니다. 배당과 비용은 넣지 않았습니다.')}`;
}
VLabs.returns=el=>{
 U.setup(el,U.select('rsrc','가격 기록',[['manual','직접 적은 가격'],['sy120','새벽전자 1~120일 종가']],'manual')+U.text('rprices','가격 (쉼표로 구분)','100, 50, 75','양수 2~12개. 가격을 고치면 “직접 적은 가격”으로 바뀝니다'));
 U.bind(el,e=>{
  const src=el.querySelector('#rsrc');if(e&&e.target.id==='rprices')src.value='manual';
  const sy=src.value==='sy120',p=sy?D.closes().slice(0,120):U.list(el,'rprices',{min:1e-6,max:1e9,count:[2,12]});
  if(p===null)return U.result(el,'',U.problem('가격','0보다 큰 숫자를 쉼표로 2~12개 적어야 합니다. 예: 100, 50, 75'));
  const R=M.simpleReturns(p),add=[p[0]],logBack=[p[0]];let s=0,l=0;
  R.forEach((v,i)=>{s+=v;l+=Math.log1p(v);add.push(p[0]*(1+s));logBack.push(p[0]*Math.exp(l));});
  const chart=U.lines({series:[{values:p,name:'실제 가격'},{values:logBack,name:'로그 수익률을 더해 되살린 값'},{values:add,name:'단순 수익률을 더해 이은 값'}],xunit:sy?'일':'',label:`실제 가격과 두 방식으로 이은 값. 로그 수익률을 더한 값은 실제 가격과 겹치고, 단순 수익률을 더한 값은 마지막에 ${F(add.at(-1),2)}로 실제 ${F(p.at(-1),2)}와 다릅니다.`});
  const rows=sy?[]:R.map((v,i)=>[`${i+1} → ${i+2}`,PP(v),U.splus(Math.log1p(v),4)]);
  U.result(el,chart+(rows.length?U.table(['기간','단순 수익률','로그 수익률'],rows,'기간마다의 두 수익률'):''),returnsText(p,sy));
 });
};
/* 2장: 제자리로 돌아오는 지수(+a와 1/(1+a)−1을 되풀이) 위에서 날마다 k배로 다시 맞춘 값. */
VLabs.reset=el=>{
 U.setup(el,U.range('da','흔들림 폭 a (%)',.5,5,.1,1.5,'하루 +a%, 다음 날 제자리로. 방향키로 0.1%p씩')+U.number('ddays','거래일 수',2,2000,2,250,'짝수(오르고 내리는 한 쌍이 이틀)')+U.select('dk','배율 k',[['2','2배'],['-2','인버스 2배 (−2배)'],['3','3배']],'2'));
 U.bind(el,()=>{
  const a=Number(U.value(el,'da'))/100,n=U.num(el,'ddays'),k=Number(U.value(el,'dk'));
  if(n===null||n%2)return U.result(el,'',U.problem('거래일 수','2에서 2,000 사이의 짝수를 넣어야 합니다. 하루 오르고 다음 날 돌아오는 한 쌍이 이틀이기 때문입니다.'));
  const R=D.flat(a).length===n?D.flat(a):M.flatVolatileReturns(a,n/2),idx=M.pathFromReturns(100,R),val=kk=>M.leveragedPath(R,kk,{start:100});
  const L=val(k),end=L.at(-1)/100-1,pair=1-(k*k-k)*a*a/(1+a),stat=M.staticLeverage(M.compound(R),k);
  const ap=M.leveragedApprox(idx.at(-1)/100,k,M.variance(M.logReturns(idx),0),n)-1,name={2:'2배','-2':'인버스 2배',3:'3배'};
  const all=[2,-2,3].map(kk=>[name[kk],F(val(kk).at(-1),2),PP(val(kk).at(-1)/100-1),F(1-(kk*kk-kk)*a*a/(1+a),5)]);
  const chart=U.lines({series:[{values:U.pairEnds(idx),name:'지수 (한 쌍이 끝난 날마다)'},{values:U.pairEnds(L),name:`날마다 ${name[k]}`}],xunit:'쌍',hlines:[[100,'처음 값 100']],label:`지수는 ${n}거래일 뒤 ${F(idx.at(-1),2)}로 제자리, ${name[k]} 상품은 ${F(L.at(-1),2)}`})+U.table(['배율','끝 값','기간 수익률','한 쌍마다'],all,`같은 경로에서 세 배율 · ${n}거래일`);
  const same=k!==2?' 이 경로에서는 (k² − k)가 6으로 같아서 3배와 인버스 2배의 끝 값이 같습니다.':'';
  U.result(el,chart,`지수는 하루 <b>+${F(a*100,1)}%</b>, 다음 날 1/(1 + a) − 1 = <b>${P(1/(1+a)-1,3)}</b>를 ${F(n/2)}번 되풀이해 ${F(n)}거래일 뒤 <b>${F(idx.at(-1),2)}</b>${U.josa(F(idx.at(-1),2),'으로','로')} 제자리입니다.<br>날마다 ${name[k]}로 다시 맞춘 상품은 한 쌍마다 × <b>${F(pair,5)}</b>배가 되어 ${F(n)}거래일 뒤 <b>${F(L.at(-1),2)}</b>, 곧 <b>${PP(end)}</b>입니다. 처음에 ${name[k]}로 한 번만 샀다면 기간 수익률 ${PP(M.compound(R))} × ${U.sfmt(k)} = ${PP(stat)}였습니다. ${end<-1e-9?`▼ 오르내림만으로 ${P(-end)}를 잃었습니다.`:''}<br>분산으로 어림한 값(Avellaneda·Zhang): ${PP(ap)}. 표: 2배 ${all[0][2]} · 인버스 2배 ${all[1][2]} · 3배 ${all[2][2]}.${same}${U.kind(['real','scenario'],'지어낸 제자리 경로, 누리200 2배는 가상의 상품, 보수·차입 비용·괴리율 없음.')}`);
 });
};
/* 3장: 새벽전자 1년 기록의 표준편차(창), 연율화, 참범위와 Wilder ATR. 하루 수익률 r[i]는 i+1일째 종가에서 i+2일째 종가로 가는 값이다. */
function windowVol(r,day,n){if(n==='all')return M.sd(r);const k=Number(n);return day-1-k<0?null:M.sd(r.slice(day-1-k,day-1));}
VLabs.ruler=el=>{
 U.setup(el,U.select('mwin','표준편차를 잴 창',[['20','지난 20일'],['60','지난 60일'],['all','1년 전체 (수익률 249개)']],'20')+U.range('mday','기준 날 (몇 일째 종가까지)',21,250,1,120,'방향키로 하루씩')+U.number('matr','ATR 기간 n (일)',1,60,1,14,'Wilder 방식, 첫 값은 처음 n개 참범위의 평균'));
 U.bind(el,()=>{
  const win=U.value(el,'mwin'),day=Number(U.value(el,'mday')),n=U.num(el,'matr'),y=D.year(),c=D.closes(),r=D.returns();
  if(n===null||!Number.isInteger(n))return U.result(el,'',U.problem('ATR 기간','1에서 60 사이의 정수를 넣어야 합니다.'));
  const s=windowVol(r,day,win);
  if(s===null)return U.result(el,'',U.problem('기준 날',`지난 ${win}일 수익률을 쓰려면 ${Number(win)+1}일째부터 잴 수 있습니다. 기준 날을 늦추거나 창을 줄여 주세요.`));
  const tr=M.trueRange(y),atr=M.atrWilder(y,n),ann=v=>v===null?'잴 수 없음':P(M.annualizeVol(v),1),label=win==='all'?'1년 전체':`지난 ${win}일`;
  const rows=[['지난 20일',`${day}일째까지`,ann(windowVol(r,day,'20'))],['지난 60일',`${day}일째까지`,ann(windowVol(r,day,'60'))],['1년 전체','수익률 249개',ann(M.sd(r))]];
  const span=win==='all'?[0,249,'1년 전체']:[day-1-Number(win),day-1,label];
  const chart=U.lines({series:[{values:c,name:'새벽전자 종가 (원)'}],vspan:span,vmark:[[80,'81일째 갭']],xunit:'일',h:240,label:`새벽전자 1년 종가와 표준편차를 잰 창(${label})`})
   +U.lines({series:[{values:atr,name:`${n}일 ATR (원)`,color:'var(--accent)',dash:''}],vmark:[[day-1,`${day}일째`]],xunit:'일',h:200,label:`${n}일 ATR. 81일째 ${atr[80]===null?'값 없음':F(atr[80],1)+'원'}`})
   +U.table(['창','기준','연율 변동성'],rows,'창마다 잰 연율 변동성');
  const jump=atr[79]!==null&&atr[80]!==null?`${n}일 ATR은 80일째 <b>${F(atr[79],1)}원</b>에서 81일째 <b>${F(atr[80],1)}원</b>으로 <b>${U.splus(Math.round(atr[80]-atr[79]))}원</b> 뛰었습니다.`:`${n}일 ATR은 ${n}일째부터 값이 있습니다.`;
  U.result(el,chart,`${day}일째까지 ${label} 창: 하루 σ <b>${P(s)}</b>, × √250 = 연율 <b>${P(M.annualizeVol(s),1)}</b>(√252면 ${P(M.annualizeVol(s,252),1)}). 같은 날 20일 창 ${rows[0][2]}, 60일 창 ${rows[1][2]}, 1년 전체 ${rows[2][2]}입니다.<br>81일째: 고가 ${F(y[80].high)}원 − 저가 ${F(y[80].low)}원 = ${F(y[80].high-y[80].low)}원이지만 전날 종가 ${F(y[79].close)}원에서 저가까지 비어 참범위는 <b>${F(tr[80])}원</b>입니다. ${jump}<br>${day===250?'':`${day}일째 ATR ${atr[day-1]===null?'값 없음':`<b>${F(atr[day-1],1)}원</b>`}, `}250일째 ATR <b>${F(atr[249],1)}원</b>은 그날 종가 ${F(c[249])}원의 <b>${P(atr[249]/c[249])}</b>입니다.${U.kind(['real','scenario','gen'],'12권 13장 시나리오 120일 + 생성기(시드 20) 130일의 가상 기록. 고가·저가는 하루 8개 가격 점의 최대·최소입니다.')}`);
 });
};
})();
