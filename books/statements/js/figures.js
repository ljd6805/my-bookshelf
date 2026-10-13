/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 모두 SMath(js/math.js)로 실제로 계산해 그린다. 기한 일수는 SMath.RULES에서만 읽는다.
   새벽전자와 9장의 가상 회사는 tests/math.test.cjs와 같은 정의다. 8장 그림은 L2(2026년 1분기 기한)를 미리 보이지 않도록 다른 보고서의 기한만 그린다.
   움직임은 style.css의 fig-* 애니메이션이며 동작 줄이기에서 멈춘다. 색 말고도 막대마다 숫자와 이름표를 붙인다. */
(function(root){
'use strict';
const M=root.SMath||(typeof require==='function'?require('./math.js'):null);
const fx=(n,d=0)=>{const r=Number(Number(n).toFixed(d));return (r<0?'−':'')+Math.abs(r).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});};
const N=x=>{const r=M.r1(x);return fx(r,Number.isInteger(r)?0:1);},E=x=>N(x)+'억 원',P=(x,d=1)=>fx(x*100,d)+'%',SP=(x,d=1)=>(x>0?'+':'')+P(x,d);
const svg=(label,body,h=260)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||13}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const up=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow fig-up" style="animation-delay:${delay}s" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(w,1).toFixed(1)}" height="${Math.max(h,1).toFixed(1)}" rx="2" fill="${color}"/>`;
const box=(x,y,w,h,stroke='var(--line)')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="var(--panel2)" stroke="${stroke}"/>`;
const J=(w,a,b)=>{const ch=String(w).at(-1),d='영일이삼사오육칠팔구'['0123456789'.indexOf(ch)]||ch,c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const S=M.saebyeok(),Y4=S.y2024,Y5=S.y2025;
/* 막대 묶음(0선 기준, 음수는 아래로): items=[[이름, 값, 강조]]. */
function bars(items,{x0=60,gap=110,bw=70,top=60,zero=200,scale}={}){
 const hi=scale||Math.max(...items.map(i=>Math.abs(i[1])),1),H=v=>v/hi*(zero-top);let s=`<path d="M${x0-20} ${zero}H${Math.min(630,x0+gap*items.length)}" stroke="var(--line)"/>`;
 items.forEach(([n,v,on],i)=>{const x=x0+i*gap,h=Math.abs(H(v)),y=v>=0?zero-h:zero;s+=up(x,y,bw,h,on?'var(--accent)':'var(--blue)',i*.15)+t(x+bw/2,v>=0?y-8:y+h+16,(on?'▲ ':'')+N(v),{size:13,w:700})+t(x+bw/2,v>=0?zero+20:zero-8,n,{size:12});});
 return s;
}
const F={};
F.basics=()=>{
 const r=M.accrual([{type:'creditSale',amount:30,date:'2024-12-20'},{type:'collect',amount:30,date:'2025-02-20'}]),X=d=>40+d*1.5;
 let s=`<path d="M40 120H620" stroke="var(--muted)" stroke-width="2"/><path class="fig-dash" d="M${X(180)} 50V200" stroke="var(--orange)" stroke-width="2"/>`+t(X(180),44,'결산일 12-31',{size:12,fill:'var(--orange)',w:700});
 s+=t(140,70,'2024 회계연도',{size:14,w:700})+t(480,70,'2025 회계연도',{size:14,w:700});
 s+=`<circle class="fig-pulse" cx="${X(170)}" cy="120" r="7" fill="var(--accent)"/><circle cx="${X(232)}" cy="120" r="7" fill="var(--blue)"/>`+t(X(170)-8,150,'2024-12-20 외상 판매',{size:12,a:'end'})+t(X(232)+8,150,'2025-02-20 대금 회수',{size:12,a:'start'});
 s+=t(140,190,`매출 ${E(r[2024].revenue)} · 현금 ${E(r[2024].cashIn)}`,{size:13,w:700})+t(480,190,`매출 ${E(r[2025].revenue)} · 현금 ${E(r[2025].cashIn)}`,{size:13,w:700})+t(140,212,'남는 것: 매출채권 30억 원',{size:12,fill:'var(--muted)'});
 return {svg:svg(`외상 판매 30억 원: 2024 회계연도 매출 ${E(r[2024].revenue)}, 현금 0; 2025 회계연도 현금 ${E(r[2025].cashIn)}`,s,230),caption:`2024-12-20에 외상으로 판 30억 원은 2024 회계연도 매출이고, 대금은 2025-02-20에 들어와 2025 회계연도 현금 ${E(r[2025].cashIn)}으로 적힙니다. 2024년 말 재무상태표에는 받을 돈 30억 원이 매출채권으로 남습니다. 결산일이 12-15인 회사라면 같은 판매가 다음 회계연도 매출입니다.`};
};
F.balance=()=>{
 const o=M.OPENING,T=M.totals(o),b=M.applyTx(o,{kind:'borrow',amount:50}),T2=M.totals(b),H=v=>v/T2.assets*170;
 const col=(x,parts,title)=>{let y=210,s=t(x+70,30,title,{size:13,w:700});parts.forEach(([n,v],i)=>{const h=H(v);y-=h;s+=`<rect class="fig-grow fig-up" style="animation-delay:${i*.1}s" x="${x}" y="${y.toFixed(1)}" width="140" height="${h.toFixed(1)}" fill="${['var(--accent)','var(--blue)','var(--orange)','var(--muted)'][i]}" fill-opacity=".35" stroke="var(--line)"/>`+(h>16?t(x+70,y+h/2+5,`${n} ${N(v)}`,{size:12}):'');});return s;};
 let s=col(40,[['현금',o.cash],['매출채권',o.ar],['재고자산',o.inv],['유형자산',o.ppe]],`자산 ${N(T.assets)}`)+t(215,130,'=',{size:22,w:700})+col(250,[['매입채무',o.ap],['단기차입금',o.std],['사채',o.bond],['자본',T.equity]],`부채 ${N(T.liabilities)} + 자본 ${N(T.equity)}`);
 s+=box(430,70,190,110,'var(--accent)')+t(525,96,'50억 원 차입',{size:13,w:700})+t(525,120,'현금 +50 · 단기차입금 +50',{size:12})+t(525,146,`${N(T2.assets)} = ${N(T2.liabilities)} + ${N(T2.equity)}`,{size:13,w:700})+t(525,168,'두 줄이 함께 움직임',{size:11,fill:'var(--muted)'});
 return {svg:svg(`2023년 말 자산 ${N(T.assets)} = 부채 ${N(T.liabilities)} + 자본 ${N(T.equity)}`,s,230),caption:`2023년 말 새벽전자는 자산 ${E(T.assets)} = 부채 ${E(T.liabilities)} + 자본 ${E(T.equity)}입니다. 50억 원을 빌리면 현금과 단기차입금이 함께 늘어 ${N(T2.assets)} = ${N(T2.liabilities)} + ${N(T2.equity)}${J(N(T2.equity),'이','가')} 됩니다. 2023년 말 유동자산은 ${E(T.currentAssets)}, 유동부채는 ${E(T.currentLiabilities)}입니다.`};
};
F.income=()=>{
 const i=Y4.is,s=t(20,28,`매출 ${N(i.sales)}에서 비용을 한 종류씩 빼 내려갑니다 (억 원)`,{size:13,w:700,a:'start'})+bars([['매출',i.sales],['매출총이익',i.gross],['영업이익',i.op,true],['세전이익',i.pretax],['순이익',i.ni,true]],{x0:50,gap:116,bw:76,scale:i.sales});
 return {svg:svg(`매출 ${N(i.sales)}, 매출총이익 ${N(i.gross)}, 영업이익 ${N(i.op)}, 세전이익 ${N(i.pretax)}, 순이익 ${N(i.ni)}`,s,230),caption:`2024년 매출 ${E(i.sales)}에서 매출원가 ${N(i.cogs)}${J(N(i.cogs),'을','를')} 빼면 매출총이익 ${N(i.gross)}, 판매비와관리비 ${N(i.sga)}${J(N(i.sga),'을','를')} 빼면 영업이익 ${N(i.op)}(${P(i.opMargin)}), 이자를 반영하면 세전이익 ${N(i.pretax)}, 법인세 ${N(i.tax)}${J(N(i.tax),'을','를')} 빼면 당기순이익 ${E(i.ni)}입니다.`};
};
F.cashflow=()=>{
 const c=Y4.cf,run=c.steps.map(x=>x.total),s=t(20,28,`순이익에서 영업활동 현금흐름까지 조정 단계별 누적 (억 원)`,{size:13,w:700,a:'start'})+bars([['순이익',run[0]],['+감가상각',run[1]],['−매출채권',run[2]],['−재고',run[3]],['+매입채무',run[4],true],['현금 증감',c.net,true]],{x0:40,gap:100,bw:66,scale:run[1]});
 return {svg:svg(`조정 단계별 누적 ${run.map(N).join(' → ')}, 현금 증감 ${N(c.net)}`,s,230),caption:`2024년 순이익 ${N(run[0])}에 감가상각을 더하면 ${N(run[1])}, 매출채권 증가를 빼면 ${N(run[2])}, 재고 증가를 빼면 ${N(run[3])}, 매입채무 증가를 더하면 영업활동 현금흐름 ${E(c.cfo)}입니다. 설비투자 ${N(-c.cfi)}${J(N(-c.cfi),'과','와')} 배당 ${N(-c.dividend)}${J(N(-c.dividend),'을','를')} 빼면 현금은 +${N(c.net)}, ${N(M.OPENING.cash)} → ${N(Y4.close.cash)}입니다.`};
};
F.link=()=>{
 const y=Y4,o=M.OPENING,ar=M.linkedYear(o,{...M.YEARS[2024],ar:430}),ok=y.checks.every(c=>c.ok)?'✓':'✗';
 let s=box(20,40,180,150)+box(230,40,180,150)+box(440,40,180,150)+t(110,64,'손익계산서',{w:700})+t(320,64,'현금흐름표',{w:700})+t(530,64,'재무상태표',{w:700});
 s+=t(110,100,`순이익 ${N(y.is.ni)}`,{w:700})+t(320,100,`영업 ${N(y.cf.cfo)} · 투자 ${N(y.cf.cfi)}`,{size:12})+t(320,124,`재무 ${N(y.cf.cff)} → 증감 +${N(y.cf.net)}`,{size:12})+t(530,100,`이익잉여금 ${N(y.close.re)}`,{size:12,w:700})+t(530,124,`현금 ${N(y.close.cash)}`,{size:12,w:700})+t(530,148,`유형자산 ${N(y.close.ppe)}`,{size:12,w:700});
 s+=`<path class="fig-dash" d="M200 96C300 20 380 20 440 96" fill="none" stroke="var(--accent)" stroke-width="2"/><path class="fig-dash" d="M410 120H440" stroke="var(--accent)" stroke-width="2"/>`+t(320,30,`${N(o.re)} + ${N(y.is.ni)} − ${N(-y.cf.dividend)} = ${N(y.close.re)}`,{size:12,fill:'var(--accent)'});
 s+=t(530,176,`${N(y.totals.assets)} = ${N(y.totals.liabilities)} + ${N(y.totals.equity)} ${ok}`,{size:12})+t(320,220,`기말 매출채권 430이면: 영업 ${N(ar.cf.cfo)}, 차입 전 현금 ${N(ar.cf.cashBeforeBorrow)} → ${N(ar.cf.borrow)} 차입 → 현금 ${N(ar.close.cash)}`,{size:12,fill:'var(--muted)'});
 return {svg:svg(`세 재무제표 대조: 이익잉여금 ${N(y.close.re)}, 현금 ${N(y.close.cash)}, 유형자산 ${N(y.close.ppe)}, ${N(y.totals.assets)} = ${N(y.totals.liabilities)} + ${N(y.totals.equity)}`,s,236),caption:`2024년 순이익 ${N(y.is.ni)}은 이익잉여금을 ${N(o.re)}에서 ${N(y.close.re)}으로, 현금흐름 합계 +${N(y.cf.net)}은 현금을 ${N(y.close.cash)}으로, 설비투자와 감가상각은 유형자산을 ${N(y.close.ppe)}으로 만들고 ${N(y.totals.assets)} = ${N(y.totals.liabilities)} + ${N(y.totals.equity)}${J(N(y.totals.equity),'이','가')} 맞습니다. 기말 매출채권이 430이면 영업활동 ${N(ar.cf.cfo)}, 차입 전 현금 ${N(ar.cf.cashBeforeBorrow)}${J(N(ar.cf.cashBeforeBorrow),'이라','라')} ${N(ar.cf.borrow)}${J(N(ar.cf.borrow),'을','를')} 빌려 기말 현금 ${N(ar.close.cash)}${J(N(ar.close.cash),'이','가')} 됩니다.`};
};
F.ratios=()=>{
 const r=M.ratios(M.OPENING,Y4.close,Y4.is,Y4.cf.cfo),d=M.dupont(Y4.is.ni,Y4.is.sales,r.avgAssets,r.avgEquity),cell=(x,a,b,i)=>`<g class="fig-seq" style="animation-delay:${i*.4}s">${box(x,70,120,80)}${t(x+60,100,a,{size:12})}${t(x+60,130,b,{size:15,w:700})}</g>`;
 let s=t(20,30,'ROE를 셋으로 나누기 (2024, 평균 분모)',{size:13,w:700,a:'start'})+cell(20,'순이익률',P(d.margin,2),0)+t(160,116,'×',{size:20})+cell(180,'총자산회전율',fx(d.turnover,2)+'회',1)+t(320,116,'×',{size:20})+cell(340,'자기자본승수',fx(d.leverage,2)+'배',2)+t(480,116,'=',{size:20})+cell(500,'ROE',P(d.roe),3);
 s+=t(320,190,`영업이익률 ${P(r.opMargin)} · 부채비율 ${P(r.debtRatio)} · 이자보상배율 ${fx(r.interestCover,1)}배 · 매출채권 ${fx(r.arDays,1)}일`,{size:12,fill:'var(--muted)'});
 return {svg:svg(`ROE ${P(d.roe)} = ${P(d.margin,2)} × ${fx(d.turnover,2)} × ${fx(d.leverage,2)}`,s,210),caption:`2024년 새벽전자의 영업이익률은 ${P(r.opMargin)}, ROE는 ${P(r.roeAvg)}(기말 분모면 ${P(r.roeEnd)}), 부채비율 ${P(r.debtRatio)}, 유동비율 ${P(r.currentRatio)}, 이자보상배율 ${fx(r.interestCover,1)}배, 매출채권 회전일수 ${fx(r.arDays,1)}일, 재고 회전일수 ${fx(r.invDays,1)}일입니다. ROE는 ${P(d.margin,2)} × ${fx(d.turnover,2)} × ${fx(d.leverage,2)} = ${P(d.roe)}로 나뉩니다.`};
};
F.quality=()=>{
 const r=M.ratios(M.OPENING,Y4.close,Y4.is,Y4.cf.cfo),a=M.alarm(0.03,0.8,0.1),W=v=>v/a.alarms*520;
 let s=t(20,30,`영업현금흐름 ${N(Y4.cf.cfo)} ÷ 순이익 ${N(Y4.is.ni)} = ${fx(r.cfoToNi,2)} · 발생액 비율 ${P(r.accrualRatio)}`,{size:13,w:700,a:'start'});
 s+=t(20,78,`회사 1,000개, 기저율 3%: 경보 ${fx(a.tp)} + ${fx(a.fp)} = ${fx(a.alarms)}건`,{size:13,a:'start'})+`<rect class="fig-grow" x="40" y="96" width="${W(a.tp).toFixed(1)}" height="40" fill="var(--orange)"/><rect class="fig-grow" style="animation-delay:.3s" x="${(40+W(a.tp)).toFixed(1)}" y="96" width="${W(a.fp).toFixed(1)}" height="40" fill="var(--blue)" fill-opacity=".6"/>`;
 s+=t(40+W(a.tp)/2,122,`문제 ${fx(a.tp)}`,{size:12,w:700})+t(40+W(a.tp)+W(a.fp)/2,122,`정상인데 경보 ${fx(a.fp)}`,{size:12,w:700})+t(320,170,`경보가 울린 회사 가운데 실제 문제 ${fx(a.tp)} ÷ ${fx(a.alarms)} = ${P(a.precision)}`,{size:13,w:700});
 return {svg:svg(`경보 ${fx(a.alarms)}건 가운데 실제 문제 ${fx(a.tp)}건, ${P(a.precision)}`,s,200),caption:`2024년 영업현금흐름 ${N(Y4.cf.cfo)} ÷ 순이익 ${N(Y4.is.ni)} = ${fx(r.cfoToNi,2)}, 발생액 비율 (${N(Y4.is.ni)} − ${N(Y4.cf.cfo)}) ÷ ${fx(r.avgAssets)} = ${P(r.accrualRatio)}입니다. 회사 1,000개 가운데 3%에 문제가 있고 적중률 80%, 오경보율 10%라면 경보는 ${fx(a.tp)} + ${fx(a.fp)} = ${fx(a.alarms)}건이고 그 가운데 실제 문제는 ${P(a.precision)}입니다.`};
};
F.dart=()=>{
 const items=[['2024 사업보고서',M.deadline('2024-12-31','annual'),'2024-12-31'],['2026 반기보고서',M.deadline('2026-06-30','half'),'2026-06-30'],['2026 3분기 보고서',M.deadline('2026-09-30','quarter'),'2026-09-30'],['2026 사업보고서',M.deadline('2026-12-31','annual'),'2026-12-31']];
 let s=t(20,28,'기간 끝 + 법정 일수 = 제출 기한',{size:13,w:700,a:'start'});
 items.forEach(([n,d,end],i)=>{const y=56+i*40;s+=t(20,y+18,n,{size:12,a:'start'})+t(190,y+18,end,{size:12,a:'start',fill:'var(--muted)'})+`<path class="fig-draw" d="M290 ${y+13}H400" stroke="var(--accent)" stroke-width="2"/>`+t(345,y+8,`+${d.days}일`,{size:11})+t(410,y+18,`${d.date}(${d.weekday})${d.weekend?' ▲ 휴일 처리 확인 못함':''}`,{size:12,a:'start',w:700});});
 return {svg:svg(items.map(([n,d])=>`${n} ${d.date}`).join(', '),s,226),caption:`2024 사업보고서는 2024-12-31 + ${M.RULES.annualDays}일 = ${items[0][1].date}, 2026 반기보고서는 2026-06-30 + ${M.RULES.interimDays}일 = ${items[1][1].date}까지 냅니다. 2026 3분기 보고서 기한 ${items[2][1].date}${J(items[2][1].date,'은','는')} 토요일이라 휴일 처리를 확인하지 못했습니다. 90일은 한국거래소 안내, 45일은 회계법인 안내 기준입니다(확인 ${M.CHECKED}).`};
};
F.industry=()=>{
 const T=M.industryTable(),K=[['saebyeok','새벽전자'],['retail','유통 회사'],['software','소프트웨어']],W=v=>v/80*300;
 let s=t(20,26,'재고 회전일수와 매출채권 회전일수 (일)',{size:13,w:700,a:'start'});
 K.forEach(([k,n],i)=>{const y=50+i*58,r=T[k];s+=t(130,y+24,n,{size:12,a:'end'})+(r.invDays?`<rect class="fig-grow" x="140" y="${y}" width="${W(r.invDays).toFixed(1)}" height="20" fill="var(--accent)"/>`:'')+t(146+(r.invDays?W(r.invDays):0),y+15,`재고 ${r.invDays?fx(r.invDays,1)+'일':'없음'}`,{size:11,a:'start'})+`<rect class="fig-grow" x="140" y="${y+24}" width="${W(r.arDays).toFixed(1)}" height="20" fill="var(--blue)"/>`+t(146+W(r.arDays),y+39,`매출채권 ${fx(r.arDays,1)}일 · 유형자산 ${P(r.ppeShare,k==='saebyeok'?1:0)}`,{size:11,a:'start'});});
 return {svg:svg(K.map(([k,n])=>`${n} 재고 ${T[k].invDays?fx(T[k].invDays,1):'없음'}, 매출채권 ${fx(T[k].arDays,1)}일`).join('; '),s,230),caption:`새벽전자(제조)는 재고 ${fx(T.saebyeok.invDays,1)}일, 매출채권 ${fx(T.saebyeok.arDays,1)}일, 유형자산 ${P(T.saebyeok.ppeShare)}이고, 가상의 유통 회사는 재고 ${fx(T.retail.invDays,1)}일, 매출채권 ${fx(T.retail.arDays,1)}일, 유형자산 ${P(T.retail.ppeShare,0)}, 가상의 소프트웨어 회사는 재고 없음, 매출채권 ${fx(T.software.arDays,1)}일, 유형자산 ${P(T.software.ppeShare,0)}입니다.`};
};
F.final=()=>{
 const f=M.finalTask(),a=f.y2024,b=f.y2025;
 let s=t(20,28,`FY2024 → FY2025: 순이익 ${SP(f.niChange)}, 현금 ${SP(f.cashChange)}`,{size:13,w:700,a:'start'})+bars([['순이익 24',a.is.ni],['순이익 25',b.is.ni,true],['영업현금 24',a.cf.cfo],['영업현금 25',b.cf.cfo,true],['현금 24',a.close.cash],['현금 25',b.close.cash,true]],{x0:36,gap:100,bw:64,top:50,zero:150,scale:170});
 s+=t(320,232,`2026 이자 추정 ${E(f.interest2026)} → 이자보상배율 ${fx(f.r2025.interestCover,1)}배 → ${fx(f.cover2026,1)}배`,{size:12,fill:'var(--muted)'});
 return {svg:svg(`순이익 ${N(a.is.ni)} → ${N(b.is.ni)}, 영업현금흐름 ${N(a.cf.cfo)} → ${N(b.cf.cfo)}, 현금 ${N(a.close.cash)} → ${N(b.close.cash)}`,s,246),caption:`순이익은 ${N(a.is.ni)} → ${N(b.is.ni)}(${SP(f.niChange)}), 기말 현금은 ${N(a.close.cash)} → ${N(b.close.cash)}(${SP(f.cashChange)})입니다. 영업활동 현금흐름은 ${N(a.cf.cfo)} → ${N(b.cf.cfo)}, 단기차입금은 ${N(a.close.std)} → ${N(b.close.std)}이고, 2026년 이자비용을 ${E(f.interest2026)}으로 놓으면 이자보상배율은 ${fx(f.r2025.interestCover,1)}배에서 ${fx(f.cover2026,1)}배가 됩니다.`};
};
function render(id){return F[id]?F[id]():null;}
root.SFigures={render};
})(typeof window!=='undefined'?window:this);
