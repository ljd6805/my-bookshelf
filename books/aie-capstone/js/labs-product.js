/* 8~12장 실험: 검색 지표, 패치 토큰 예산, 부트스트랩 구간, 차단 문턱, 출시 사양표. 계산은 A20Math에서 한다. */
(()=>{
'use strict';
const U=A20UI,M=A20Math,R=U.range,S=U.select,F=U.fmt;
const r2=v=>Math.round(v*100)/100;
/* 순위 목록: 정답 문서는 관련도 숫자와 굵은 테두리, k 밖은 흐리게. 색만으로 구분하지 않도록 글자도 적는다. */
function rankStrip(list,gold,k){
 let b='';list.forEach((d,i)=>{const x=24+i*44,g=gold[d]||0,inK=i<k;
  b+=`<rect x="${x}" y="70" width="38" height="70" rx="5" fill="${g?'var(--accent)':'var(--panel2)'}" fill-opacity="${inK?(g?0.85:1):0.25}" stroke="${g?'var(--accent)':'var(--line)'}" stroke-width="${g?3:1}"/><text x="${x+19}" y="62" text-anchor="middle">${i+1}</text><text x="${x+19}" y="104" text-anchor="middle" fill="${g&&inK?'var(--bg)':'var(--text)'}">${d}</text><text x="${x+19}" y="128" text-anchor="middle" fill="${g&&inK?'var(--bg)':'var(--muted)'}">${g}</text>`;});
 const cx=24+k*44-3;b+=`<path d="M${cx} 40V170" stroke="var(--orange)" stroke-width="2.5" stroke-dasharray="6 4"/><text x="${cx}" y="190" text-anchor="middle" fill="var(--orange)">k = ${k}까지 보여 줌</text><text x="24" y="30">순위</text><text x="24" y="230">아래 숫자 = 관련도(정답 3·2·1, 무관 0), 점선 오른쪽은 넣지 않음</text>`;
 return U.svg(b,`순위 목록 10개 중 상위 ${k}개를 보여 줌. 정답 조각의 순위는 ${Object.keys(gold).map(d=>list.indexOf(d)+1).join(', ')}`);
}
A20Labs.ragmetrics=el=>{
 U.setup(el,S('rg-run','파이프라인',[['base','기본 벡터 검색'],['hybrid','하이브리드 (BM25 + 벡터, RRF)'],['rerank','하이브리드 + 교차 인코더 재순위']],'base')+R('rg-k','보여 줄 조각 수 k',1,10,1,5));
 U.bind(el,()=>{const name=U.text(el,'rg-run'),k=U.value(el,'rg-k'),r=M.ragRun(name,k);
  U.result(el,rankStrip(M.RAG_RUNS[name],M.RAG_GOLD,k),
  `상위 ${k}개 · 정밀도 <b>${F(r.precision,2)}</b> · 재현율 <strong>${F(r.recall,2)}</strong> · MRR <b>${F(r.mrr,2)}</b> · nDCG@${k} <b>${F(r.ndcg,3)}</b><br>첫 정답 순위 ${r.firstHit}등 · 정답 셋을 모두 담으려면 k = <b>${r.fullAt}</b> 이상 (${F(r.fullAt*400,0)}토큰)<br>모델에 넣는 문맥 약 <b>${F(r.ctxTokens,0)}토큰</b> (조각 하나 400토큰)<br>${r.recall<1?'정답 일부가 k 밖에 있어 모델은 그 근거를 볼 수 없습니다.':r.precision<0.5?'정답은 모두 담았지만 무관한 조각도 함께 넣어 문맥 비용을 더 냅니다.':'적은 조각으로 정답을 모두 담았습니다.'}<br>세 순위 목록은 교육용 가정값이고, 지표는 그 목록에서 정확히 계산했습니다.`);});
};
A20Labs.patches=el=>{
 U.setup(el,S('pt-side','그림 한 변(픽셀)',[[224,'224'],[336,'336'],[448,'448'],[672,'672'],[896,'896']],224)+S('pt-p','패치 한 변 P',[[14,'14'],[16,'16'],[32,'32']],16));
 U.bind(el,()=>{const side=U.value(el,'pt-side'),p=U.value(el,'pt-p'),r=M.patchTokens(side,p),b=M.patchTokens(224,16);
  U.result(el,U.bars(['패치 토큰','자기 어텐션 쌍','글과의 교차 쌍'],[r.patches/b.patches,r.rel,r.crossPairs/b.crossPairs],'배 (224·16 기준 = 1)',1,2),
  `${side} × ${side} 그림, 패치 ${p} × ${p}<br>격자 ${r.grid} × ${r.grid} = 패치 <strong>${F(r.patches,0)}개</strong>, CLS를 더한 시퀀스 ${F(r.seq,0)}${r.cut?` · 나누어떨어지지 않아 가장자리 ${r.cut}픽셀을 잘라 냄`:''}<br>자기 어텐션 쌍 ${F(r.selfPairs,0)} (기준 ${F(b.selfPairs,0)}의 <b>${F(r.rel,2)}배</b>) · 글 64토큰과의 교차 쌍 ${F(r.crossPairs,0)}<br>패치 하나를 펴면 3 × ${p}² = ${F(3*p*p,0)}개의 숫자가 됩니다. ${p>16?'패치가 커서 토큰은 적지만, 작은 글씨는 한 패치 안에서 뭉개질 수 있습니다.':''}<br>정사각형 그림의 실제 계산이고, 글 토큰 64개는 교육용 가정값입니다.`);});
};
/* 부트스트랩 구간: 과제 수마다 한 줄, 0 기준선, 지금 고른 n을 굵게. */
function ciChart(rows,n,gap){
 const x=v=>60+(v+0.1)/0.25*380;let b=`<path d="M${x(0)} 20V250" stroke="var(--muted)" stroke-width="1.5"/><text x="${x(0)}" y="270" text-anchor="middle">0</text><text x="${x(-0.1)}" y="270" text-anchor="middle">−0.10</text><text x="${x(0.15)}" y="270" text-anchor="middle">0.15</text>`;
 b+=`<path d="M${x(gap)} 20V250" stroke="var(--orange)" stroke-width="1.5" stroke-dasharray="5 4"/>`;
 rows.forEach(([m,r],i)=>{const y=40+i*36,on=m===n,lo=Math.max(-0.1,r.lo),hi=Math.min(0.15,r.hi);b+=`<text x="52" y="${y+5}" text-anchor="end"${on?' font-weight="700"':''}>n ${m}</text><path d="M${x(lo)} ${y}H${x(hi)}" stroke="${r.verdict==='tie'?'var(--blue)':'var(--accent)'}" stroke-width="${on?8:4}" stroke-linecap="round"/><circle cx="${x(r.mean)}" cy="${y}" r="${on?6:4}" fill="var(--text)"/>`;});
 return U.svg(b,`과제 수별 95% 구간. 지금 n ${n}의 구간은 ${rows.filter(r=>r[0]===n).map(r=>F(r[1].lo,3)+'에서 '+F(r[1].hi,3)).join('')}`);
}
A20Labs.bootstrap=el=>{
 const ns=[20,50,100,200,400,800];
 U.setup(el,S('bs-n','과제 수 n',ns.map(n=>[n,String(n)]),50)+R('bs-gap','참 차이 (새 − 옛)',-0.05,0.1,0.01,0.02));
 U.bind(el,()=>{const n=U.value(el,'bs-n'),gap=r2(U.value(el,'bs-gap')),rows=ns.map(m=>[m,M.bootstrapDiff(m,gap)]),r=rows.find(x=>x[0]===n)[1],need=rows.find(x=>x[1].verdict!=='tie');
  const v={better:'나아졌다',worse:'나빠졌다',tie:'이 과제 수로는 차이를 말할 수 없다'}[r.verdict];
  U.result(el,ciChart(rows,n,gap),
  `과제 ${n}개, 참 차이 ${F(gap,2)}<br>관찰된 평균 차이 ${F(r.mean,3)} · 95% 구간 <b>[${F(r.lo,3)}, ${F(r.hi,3)}]</b> · 폭 ${F(r.width,3)}<br>판정: <strong>${v}</strong> ${r.verdict==='tie'?'(구간이 0을 포함)':'(구간이 0을 지나지 않음)'}<br>${gap===0?'참 차이가 0이면 과제를 늘려도 구간은 0 둘레에서 좁아질 뿐입니다.':need?`이 참 차이에서는 과제 ${need[0]}개부터 판정이 나옵니다.`:'이 참 차이는 800개로도 0과 구별되지 않습니다.'}<br>과제별 잡음은 교육용 가정 분포이고, 부트스트랩 500번은 시드 11로 고정한 실제 계산입니다.`);});
};
/* 탐지기 점수 띠: 위는 공격, 아래는 정상. 문턱 오른쪽이 차단. 모양(원·네모)으로도 구분한다. */
function scoreStrip(thr){
 const {att,ben}=M.gateFixture(),x=v=>40+v*400;let b=`<rect x="${x(thr)}" y="20" width="${x(1)-x(thr)}" height="210" fill="var(--orange)" fill-opacity=".12"/><path d="M${x(thr)} 20V230" stroke="var(--orange)" stroke-width="2.5"/><text x="${x(thr)+4}" y="16">차단 ≥ ${F(thr,2)}</text><path d="M${x(0.5)} 20V230" stroke="var(--muted)" stroke-dasharray="4 4"/><text x="${x(0.5)-4}" y="16" text-anchor="end">경고 ≥ 0.50</text>`;
 att.forEach((s,i)=>{b+=`<circle cx="${x(s)}" cy="${50+(i%5)*14}" r="5" fill="var(--accent)"/>`;});
 ben.forEach((s,i)=>{b+=`<rect x="${x(s)-4.5}" y="${146+(i%5)*14}" width="9" height="9" fill="var(--blue)"/>`;});
 b+=`<text x="40" y="250">0</text><text x="440" y="250" text-anchor="end">1</text><text x="40" y="272">위: 공격 50개(원) · 아래: 정상 50개(네모) · 가로축은 탐지기 점수</text>`;
 return U.svg(b,`탐지기 점수 분포와 차단 문턱 ${F(thr,2)}`);
}
A20Labs.gate=el=>{
 U.setup(el,R('gt-thr','차단 문턱',0.5,0.95,0.05,0.7)+S('gt-base','공격 기저율',[[0.001,'0.1%'],[0.01,'1%'],[0.1,'10%']],0.01));
 U.bind(el,()=>{const thr=r2(U.value(el,'gt-thr')),base=U.value(el,'gt-base'),r=M.gateStats(thr,base);
  U.result(el,scoreStrip(thr),
  `문턱 ${F(thr,2)}, 공격 기저율 ${F(base*100,1)}%<br>공격을 막는 비율(탐지율) <b>${F(r.tpr*100,0)}%</b> · 경고만 달고 통과 ${F(r.attWarn*100,0)}% · 그대로 통과 ${F(r.miss*100,0)}%<br>정상을 막는 비율(오탐률) <b>${F(r.fpr*100,0)}%</b> · 정상에 경고 ${F(r.benWarn*100,0)}%<br>“막았다” 중 진짜 공격의 비율(정밀도) <strong>${F(r.precision*100,1)}%</strong><br>요청 1만 건당 정상 차단 <b>${F(r.benignBlocked10k,0)}건</b> · 막지 못한 공격 <b>${F(r.notBlocked10k,0)}건</b>${r.fpr===0?'<br>정상 50개 중 차단 0건은 오탐률 0%가 아니라 “이 표본에서 보지 못했다”는 뜻입니다.':''}<br>점수 100개는 교육용 가정 분포의 고정값이고, 비율과 정밀도는 그 위에서 정확히 계산했습니다.`);});
};
A20Labs.launch=el=>{
 U.setup(el,R('ln-k','최대 시도 횟수 k',1,4,1,3)+S('ln-mode','시도 방식',[['seq','차례로 (통과하면 멈춤)'],['par','k개 병렬']],'seq')+S('ln-ctx','문맥 조각 수',[[3,'3개'],[5,'5개'],[10,'10개']],10)+R('ln-thr','입력 차단 문턱',0.5,0.95,0.05,0.7)+S('ln-out','출력 쪽 분류기·규칙 층',[[0,'끔'],[1,'켬']],0));
 U.bind(el,()=>{const k=U.value(el,'ln-k'),mode=U.text(el,'ln-mode'),ctx=U.value(el,'ln-ctx'),thr=r2(U.value(el,'ln-thr')),out=U.value(el,'ln-out'),r=M.launchSheet(k,mode,ctx,thr,out),T=M.LAUNCH_TARGET;
  const rows=[['월 비용',r.monthly,T.monthly,'달러',0,r.monthly<=T.monthly,r.monthly/T.monthly],['p95 지연',r.p95,T.p95,'초',1,r.p95<=T.p95,r.p95/T.p95],['통과율',r.pass,T.pass,'',3,r.pass>=T.pass,T.pass/r.pass],['정상 차단',r.benignBlocked,T.benignBlocked,'건/월',0,r.benignBlocked<=T.benignBlocked,r.benignBlocked/T.benignBlocked],['막지 못한 공격',r.attackNotBlocked,T.attackNotBlocked,'건/월',0,r.attackNotBlocked<=T.attackNotBlocked,r.attackNotBlocked/T.attackNotBlocked]];
  const okN=rows.filter(x=>x[5]).length;
  U.result(el,U.bars(rows.map(x=>x[0]),rows.map(x=>x[6]),'목표 대비 (1 이하가 지킴)',1,2),
  `월 과제 ${F(r.tasks,0)}개, ${mode==='seq'?'차례로':'병렬'} 최대 ${k}번, 조각 ${ctx}개, 문턱 ${F(thr,2)}, 출력 층 ${out?'켬':'끔'}<br>${rows.map(x=>`${x[5]?'[지킴]':'[넘김]'} ${x[0]} <b>${F(x[1],x[4])}${x[3]?' '+x[3]:''}</b> (목표 ${x[0]==='통과율'?'≥':'≤'} ${F(x[2],x[0]==='통과율'?2:0)})`).join('<br>')}<br><strong>${okN}/5줄을 지킵니다.</strong> ${okN===5?'이 조합이 기대는 가정 중 가장 의심스러운 것을 골라 보세요.':''}<br>기대 시도 ${F(r.tries,2)}번, 한 번 통과율 ${F(r.p,2)}, 탐지율 ${F(r.tpr,2)}, 오탐률 ${F(r.fpr,2)}. 통과율·가격·시간·층 효과는 교육용 가정값이고, 조합 계산은 실제 계산입니다.`);});
};
})();
