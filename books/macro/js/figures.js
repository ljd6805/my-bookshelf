/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 모두 MMath(js/math.js)로 실제로 계산해 그린다.
   그림은 본문이 이미 계산한 숫자만 쓰고, 예측 질문(L2)과 확인 문제의 답은 그리지 않는다(7장 저축 250조 원, 9장 원화 가치 −54.1%, 10장 두 가설의 첫 분기 등).
   움직임은 style.css의 fig-* 애니메이션이며 동작 줄이기에서 멈춘다. 색 말고도 막대와 선마다 숫자와 이름표를 붙인다. */
(function(root){
'use strict';
const M=root.MMath||(typeof require==='function'?require('./math.js'):null);
const fx=(n,d=0)=>{const r=Number((Number(n)+(n>=0?1e-9:-1e-9)).toFixed(d));return (r<0?'−':'')+Math.abs(r).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});};
const sp=(n,d=2)=>{const r=Number((n+(n>=0?1e-9:-1e-9)).toFixed(d));return (r>0?'+':'')+fx(r,d);};
const P=(x,d=2)=>fx(x*100,d)+'%';
const svg=(label,body,h=260)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||13}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const up=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow fig-up" style="animation-delay:${delay}s" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(w,1).toFixed(1)}" height="${Math.max(h,1).toFixed(1)}" rx="2" fill="${color}"/>`;
const A=M.ASSUME;
/* 막대 묶음(0선 기준, 음수는 아래로): items=[[이름, 값, 강조, 글]]. */
function bars(items,{x0=60,gap=110,bw=70,top=60,zero=200,scale,f=v=>fx(v)}={}){
 const hi=scale||Math.max(...items.map(i=>Math.abs(i[1])),1),H=v=>v/hi*(zero-top);let s=`<path d="M${x0-20} ${zero}H${Math.min(630,x0+gap*items.length)}" stroke="var(--line)"/>`;
 items.forEach(([n,v,on,label],i)=>{const x=x0+i*gap,h=Math.abs(H(v)),y=v>=0?zero-h:zero;s+=up(x,y,bw,h,on?'var(--accent)':v<0?'var(--orange)':'var(--blue)',i*.15)+t(x+bw/2,v>=0?y-8:y+h+16,(on===true?'▲ ':'')+(label||f(v)),{size:13,w:700})+t(x+bw/2,v>=0?zero+20:zero-8,n,{size:12});});
 return s;
}
/* 분기 꺾은선: series=[[이름, 값 배열, 색, 점선]], 0선과 분기 눈금. */
function path(series,{L=60,R=600,T=50,B=200,lo,hi,n}={}){
 const Y=v=>B-(v-lo)/(hi-lo)*(B-T),X=i=>L+i/(n-1)*(R-L);let s=`<path d="M${L} ${Y(0).toFixed(1)}H${R}" stroke="var(--line)"/>`;
 for(let i=0;i<n;i++)s+=t(X(i),B+18,String(i+1),{size:11,fill:'var(--muted)'});
 series.forEach(([name,vals,c,dash])=>{s+=`<path class="fig-dash" d="M${vals.map((v,i)=>`${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join('L')}" fill="none" stroke="${c}" stroke-width="2.6"${dash?' stroke-dasharray="6 4"':''}/>`;});
 return {s,X,Y};
}
const F={};
F.gdp=()=>{
 const E=A.economy,g=M.gdp(),real=M.realGrowth(A.growth.nominal,A.growth.deflator),ann=M.annualize(0.01);
 let s=t(20,26,'최종 생산을 누가 샀는지로 나누면 (조 원)',{size:13,w:700,a:'start'})+bars([['소비 C',E.c],['투자 I',E.i],['정부 G',E.g],['순수출 X − M',g.net],['GDP',g.gdp,true]],{x0:40,gap:120,bw:72,top:50,zero:190,scale:g.gdp});
 s+=t(320,232,`실질 1.06 ÷ 1.04 − 1 = ${P(real)} · 연율 1.01⁴ − 1 = ${P(ann)}`,{size:13,w:700});
 return {svg:svg(`소비 ${E.c}, 투자 ${E.i}, 정부 지출 ${E.g}, 순수출 ${g.net}, GDP ${g.gdp}조 원; 실질 성장률 ${P(real)}, 연율 ${P(ann)}`,s,246),caption:`모형 경제의 GDP는 ${E.c} + ${E.i} + ${E.g} + (${E.x} − ${E.m}) = ${g.gdp}조 원이고, 비중은 소비 ${P(g.shares.c,1)}, 투자 ${P(g.shares.i,1)}, 정부 지출 ${P(g.shares.g,1)}, 순수출 ${P(g.shares.net,1)}입니다. 명목 6%, 디플레이터 4%면 실질 성장률은 ${P(real)}이고, 분기 1%가 네 분기 이어지면 연율 ${P(ann)}입니다.`};
};
F.prices=()=>{
 const x=M.priceIndex(),alt=M.priceIndex(A.basket.map(b=>({...b,w:b.name==='전기 요금'?0.1:b.name==='외식'?0.7:b.w}))),top=x.parts.reduce((a,b)=>b.contribution>a.contribution?b:a);
 let s=t(20,26,'지수 상승에 보탠 몫 = 가중치 × (가격 비율 − 1) (%p)',{size:13,w:700,a:'start'})+bars([...x.parts.map(p=>[`${p.name} ${fx(p.w*100)}%`,p.contribution*100,p===top,fx(p.contribution*100,1)+'%p']),['합 = 상승률',x.inflation*100,false,fx(x.inflation*100,1)+'%']],{x0:50,gap:150,bw:80,top:50,zero:190,scale:x.inflation*100});
 s+=t(320,232,`지수 ${fx(x.index,1)} · 가중치를 전기 요금 10%, 외식 70%로 바꾸면 ${fx(alt.index,1)}`,{size:13,w:700});
 return {svg:svg(`품목별 몫 ${x.parts.map(p=>`${p.name} ${fx(p.contribution*100,1)}%p`).join(', ')}, 지수 ${fx(x.index,1)}`,s,246),caption:`가상 장바구니의 지수는 0.2 × 1.04 + 0.3 × 1.10 + 0.5 × 1.05 = ${fx(x.index/100,3)}에 100을 곱한 ${fx(x.index,1)}이고 상승률은 ${P(x.inflation,1)}입니다. 가장 크게 보탠 품목은 ▲ ${top.name}(${fx(top.contribution*100,1)}%p)이고, 가중치를 전기 요금 10%, 외식 70%로 바꾸면 같은 가격 변화로도 ${fx(alt.index,1)}입니다.`};
};
F.cycle=()=>{
 const g=A.gapCurve,a=M.labor(),b=M.discourage(A.town,10),peak=g.indexOf(Math.max(...g)),low=g.indexOf(Math.min(...g)),{s:ps,X,Y}=path([['GDP 갭',g,'var(--blue)']],{L:60,R:600,T:56,B:196,lo:-1.4,hi:1.6,n:g.length});
 let s=t(20,26,'가상 GDP 갭(잠재 GDP 대비 %): 수준과 방향으로 국면을 나눔',{size:13,w:700,a:'start'})+ps;
 s+=`<circle cx="${X(peak)}" cy="${Y(g[peak])}" r="6" fill="var(--accent)"/>`+t(X(peak),Y(g[peak])-12,`▲ 정점 ${peak+1}분기 +${fx(g[peak],1)}%`,{size:12,w:700});
 s+=`<circle cx="${X(low)}" cy="${Y(g[low])}" r="6" fill="var(--orange)"/>`+t(X(low),Y(g[low])+22,`▼ 저점 ${low+1}분기 ${fx(g[low],1)}%`,{size:12,w:700});
 s+=t(320,240,`실업률 20 ÷ 600 = ${P(a.unemployment)} → 10명 구직 포기 뒤 ${P(b.unemployment)} (고용률 ${P(a.employment,1)} 그대로)`,{size:13,w:700});
 return {svg:svg(`가상 GDP 갭 12분기, 정점 ${peak+1}분기, 저점 ${low+1}분기; 실업률 ${P(a.unemployment)}에서 ${P(b.unemployment)}`,s,256),caption:`가상 동네의 실업률은 20 ÷ 600 = ${P(a.unemployment)}, 고용률은 ${P(a.employment,1)}이고, 10명이 구직을 포기하면 실업률만 ${P(b.unemployment)}로 내려갑니다. 가상 GDP 갭은 ${peak+1}분기에 +${fx(g[peak],1)}%로 정점, ${low+1}분기에 ${fx(g[low],1)}%로 저점입니다(▲ 정점, ▼ 저점).`};
};
F.policy=()=>{
 const s0=M.scenario({rate:{size:0.25,start:1,len:4}},{stage:'policy'}),p=M.peaks(s0),rows=[['환율',p.e,'%'],['GDP',p.y,'%'],['물가',p.pi,'%p']],L=110,R=610,X=q=>L+(q-1)/11*(R-L);
 let s=t(20,26,'정책 금리 +0.25%p · 4분기: 가장 크게 반응하는 분기 (모형의 가정)',{size:13,w:700,a:'start'});
 for(let q=1;q<=12;q++)s+=t(X(q),220,String(q),{size:11,fill:'var(--muted)'});s+=t(L-10,220,'분기',{size:11,fill:'var(--muted)',a:'end'});
 rows.forEach(([n,pk,u],k)=>{const y=70+k*50;s+=`<path d="M${L} ${y}H${R}" stroke="var(--line)"/>`+t(L-12,y+5,n,{size:13,w:700,a:'end'})+`<circle class="fig-grow" style="animation-delay:${k*.3}s" cx="${X(pk.q).toFixed(1)}" cy="${y}" r="8" fill="${['var(--muted)','var(--blue)','var(--orange)'][k]}"/>`+t(X(pk.q)+14,y-10,`▲ ${pk.q}분기 ${sp(pk.value)}${u}`,{size:12,w:700,a:'start'});});
 s+=t(320,246,'순서: 환율 → GDP → 물가 · 시차는 식에 넣은 것',{size:13,w:700});
 return {svg:svg(`정책 금리 +0.25%p 4분기: 환율 ${p.e.q}분기 ${sp(p.e.value)}%, GDP ${p.y.q}분기 ${sp(p.y.value)}%, 물가 ${p.pi.q}분기 ${sp(p.pi.value)}%p`,s,258),caption:`미리 정한 시나리오 모형에 정책 금리 +0.25%p를 4분기 넣으면 환율은 ${p.e.q}분기째 ${sp(p.e.value)}%(원화 강세), GDP는 ${p.y.q}분기째 ${sp(p.y.value)}%, 물가는 ${p.pi.q}분기째 ${sp(p.pi.value)}%p가 가장 큰 편차입니다. 예측이 아니며, 크기는 가정한 계수에서 나온 값이고 시차는 식에 넣은 것입니다.`};
};
F.fiscal=()=>{
 const sp1=M.scenario({spend:{size:1,start:1,len:4}},{stage:'fiscal',quarters:8}),rt=M.scenario({rate:{size:1,start:1,len:4}},{stage:'fiscal',quarters:8}),both=M.scenario({spend:{size:1,start:1,len:4},rate:{size:1,start:1,len:4}},{stage:'fiscal',quarters:8});
 const {s:ps,X,Y}=path([['지출만',sp1.y,'var(--blue)'],['금리만',rt.y,'var(--orange)',true],['함께',both.y,'var(--accent)']],{L:60,R:600,T:50,B:196,lo:-0.8,hi:0.8,n:8}),r=x=>fx(M.r3(x),3);
 let s=t(20,26,'GDP 편차(%): 지출 +1% · 금리 +1%p · 둘을 함께 (각 4분기)',{size:13,w:700,a:'start'})+ps;
 s+=t(X(3),Y(sp1.y[3])-10,`● 지출만 4분기 +${fx(sp1.y[3],2)}`,{size:12,w:700})+`<path d="M${X(5)} ${Y(both.y[5])-14}V${Y(both.y[5])+14}" stroke="var(--accent)" stroke-width="2"/>`;
 s+=t(320,240,`6분기: 금리만 ${r(rt.y[5])} + 지출만 ${r(sp1.y[5])} = ${fx(M.r3(rt.y[5])+M.r3(sp1.y[5]),3)} ≈ 함께 ${r(both.y[5])}`,{size:13,w:700});
 return {svg:svg(`지출만, 금리만, 함께 넣은 GDP 편차 8분기; 6분기 ${r(rt.y[5])} + ${r(sp1.y[5])} ≈ ${r(both.y[5])}`,s,256),caption:`정부 지출 +1%를 4분기 넣으면 이 모형에서 GDP는 첫 분기 +${fx(sp1.y[0],2)}%, 4분기째 +${fx(sp1.y[3],2)}%로 가장 큽니다(● 실선). 금리 +1%p(점선)와 함께 넣으면 6분기째 ${r(rt.y[5])} + ${r(sp1.y[5])} = ${fx(M.r3(rt.y[5])+M.r3(sp1.y[5]),3)}가 함께 넣은 ${r(both.y[5])}와 반올림 차이만큼만 다릅니다.`};
};
F.fx=()=>{
 const R=M.fxAfter(M.MARKET.usdkrw.value,-A.saebyeok.fall).rounded,ex=M.fxAmounts(A.saebyeok.usd,M.MARKET.usdkrw.value,R),im=M.fxAmounts(A.onkyeol.usd,M.MARKET.usdkrw.value,R),e=x=>fx(x/1e8,2);
 let s=t(20,26,`원/달러 ${fx(M.MARKET.usdkrw.value,1)}원 → ${fx(R,1)}원일 때 원화 금액 (억 원)`,{size:13,w:700,a:'start'})+bars([['새벽전자 이전',ex.before/1e8,false,e(ex.before)],['새벽전자 이후',ex.after/1e8,true,e(ex.after)],['온결식품 이전',im.before/1e8,false,e(im.before)],['온결식품 이후',im.after/1e8,true,e(im.after)]],{x0:40,gap:150,bw:80,top:50,zero:190,scale:ex.before/1e8});
 s+=t(320,232,`매출 ${M.wonText(-ex.diff)} 감소(받는 쪽) · 비용 ${M.wonText(-im.diff)} 감소(내는 쪽)`,{size:13,w:700});
 return {svg:svg(`새벽전자 ${M.wonText(ex.before)}에서 ${M.wonText(ex.after)}, 온결식품 ${M.wonText(im.before)}에서 ${M.wonText(im.after)}`,s,246),caption:`새벽전자의 수출 대금 100만 달러는 ${M.wonText(ex.before)}에서 ${M.wonText(ex.after)}로, 온결식품의 수입 대금 40만 달러는 ${M.wonText(im.before)}에서 ${M.wonText(im.after)}로 바뀝니다(▲ 이후, 1,311.7원으로 반올림한 환율). 같은 원화 강세가 받는 쪽의 매출과 내는 쪽의 비용을 함께 줄입니다.`};
};
F.trade=()=>{
 const T=A.trade,ca=M.currentAccount(),items=[['상품',T.goods],['서비스',T.services],['본원소득',T.primary],['이전소득',T.secondary]],k=150/T.goods,zero=190;
 let run=0,s=t(20,26,'네 수지를 차례로 더하면 (억 달러)',{size:13,w:700,a:'start'})+`<path d="M20 ${zero}H630" stroke="var(--line)"/>`;
 items.forEach(([n,v],i)=>{const x=40+i*115,a=run,b=run+v,y=zero-Math.max(a,b)*k,h=Math.abs(v)*k;s+=up(x,y,70,h,v<0?'var(--orange)':'var(--blue)',i*.15)+t(x+35,y-8,sp(v,0),{size:13,w:700})+t(x+35,zero+20,n,{size:12});run=b;});
 s+=up(500,zero-ca.ca*k,80,ca.ca*k,'var(--accent)',.6)+t(540,zero-ca.ca*k-8,`▲ ${sp(ca.ca,0)}`,{size:13,w:700})+t(540,zero+20,'경상수지',{size:12});
 s+=t(320,232,`상품수지를 뺀 세 수지 ${sp(ca.nonGoods,0)}억 달러 · 항등식 S − I = X − M`,{size:13,w:700});
 return {svg:svg(`상품 ${T.goods}, 서비스 ${T.services}, 본원소득 ${T.primary}, 이전소득 ${T.secondary}, 경상수지 ${ca.ca}억 달러`,s,246),caption:`가상의 나라는 상품수지 ${T.goods}억 달러에 서비스 ${fx(T.services)}, 본원소득 +${T.primary}, 이전소득 ${fx(T.secondary)}억 달러를 더해 경상수지 ${sp(ca.ca,0)}억 달러입니다. 상품수지를 뺀 세 수지의 합이 ${sp(ca.nonGoods,0)}억 달러라 상품수지와 경상수지는 다른 숫자입니다.`};
};
F.leading=()=>{
 const tb=M.lagTable(),best=tb.best;
 let s=t(20,26,'동행을 k달 늦춘 상관계수 r (가상 자료, 12개월)',{size:13,w:700,a:'start'})+bars(tb.rows.map(x=>[`${x.k}달 (쌍 ${x.n})`,x.r,x.k===best.k,(x.k===best.k?'▲ ':'')+fx(x.r,2)]),{x0:50,gap:115,bw:66,top:50,zero:130,scale:1});
 s+=t(320,240,'가장 큰 r의 시차 ≠ 원인 · 공통 원인을 따로 확인',{size:13,w:700});
 return {svg:svg(`시차별 r ${tb.rows.map(x=>`${x.k}달 ${fx(x.r,2)}`).join(', ')}`,s,256),caption:`가상 자료의 r은 시차 0에서 ${fx(tb.rows[0].r,2)}, 2달 ${fx(tb.rows[2].r,2)}, ${best.k}달 ${fx(best.r,2)}(쌍 ${best.n}개), 4달 ${fx(tb.rows[4].r,2)}입니다. 동행을 세 달 전 선행 × 0.8로 만든 자료라 ▲ 세 달에서 가장 큰 r이 나오는 것은 만든 방식대로이고, 원인은 따로 확인합니다.`};
};
F.crisis=()=>{
 const C=M.MARKET.crisis,N=M.crisisNumbers(),lanes=[['1997',[`11-21 구제금융 신청`,`12-03 IMF ${C.y1997.imf}억 달러`,`12-23 ${fx(C.y1997.usdkrwPeak,1)}원`]],['2008',[`8월 ${fx(C.y2008.rateFrom,2)}%로 인상`,`${fx(C.y2008.rateFrom,2)}% → ${fx(C.y2008.rateTo,2)}%`,`10-30 스와프 ${C.y2008.swap}억 달러`]],['2020',[`03-16 ${fx(C.y2020.rateFrom,2)}% → ${fx(C.y2020.rateTo,2)}%`,`03-19 스와프 ${C.y2020.swap}억 달러`,`다음 날 ${fx(C.y2020.nextDayClose,1)}원`]]];
 let s=t(20,26,'세 위기에서 일어난 차례 (보도·학술 기준)',{size:13,w:700,a:'start'});
 lanes.forEach(([y,ev],k)=>{const yy=66+k*56;s+=t(30,yy+5,y,{size:14,w:700,a:'start'})+`<path class="fig-dash" d="M90 ${yy}H620" stroke="var(--line)"/>`;ev.forEach((e,i)=>{const x=110+i*175;s+=`<circle cx="${x}" cy="${yy}" r="6" fill="${i===ev.length-1?'var(--accent)':'var(--blue)'}"/>`+t(x+10,yy-9,e,{size:12,a:'start'});});});
 s+=t(320,240,`1997년 1달러당 원화 ${sp(N.fx1997.perDollar*100,1)}% · 2008년 4분기 연율 ${fx(N.annual2008*100,1)}%`,{size:13,w:700});
 return {svg:svg(`1997, 2008, 2020년의 사건 차례; 1997년 1달러당 원화 ${sp(N.fx1997.perDollar*100,1)}%, 2008년 4분기 연율 ${fx(N.annual2008*100,1)}%`,s,256),caption:`1997년에는 구제금융 신청 뒤 원/달러가 ${fx(C.y1997.usdkrwPeak,1)}원이 되어 1달러당 원화가 ${sp(N.fx1997.perDollar*100,1)}% 늘었고, 2008년에는 기준금리를 ${fx(-N.rate2008,2)}%p 내리고 스와프를 맺었으며 4분기 산출 −4.5%는 연율 ${fx(N.annual2008*100,1)}%입니다. 2020년에는 기준금리를 ${fx(-N.rate2020,2)}%p 내리고 스와프를 맺었습니다.`};
};
F.final=()=>{
 const R=A.release,sup=M.surprise(),k=40,zero=200;
 let s=t(20,26,'발표 = 예상 + 예상에서 벗어난 몫 (모형 경제, %)',{size:13,w:700,a:'start'});
 s+=up(60,zero-R.expected*k,90,R.expected*k,'var(--blue)',0)+up(60,zero-R.actual*k,90,sup*k,'var(--accent)',.3)+t(105,zero-R.expected*k/2,`예상 ${fx(R.expected,1)}`,{size:13,w:700,fill:'var(--bg)'})+t(160,zero-R.actual*k+12,`▲ ${sp(sup,1)}%p`,{size:13,w:700,a:'start'})+t(105,zero+20,`발표 ${fx(R.actual,1)}%`,{size:12});
 [['(가) 발표 당일','방향의 가설 · 버릴 관찰'],['(나) 6주','근원물가 · 다음 달 물가'],['(다) 8분기','모형의 두 가설 경로']].forEach(([a,b],i)=>{const x=260+i*124;s+=`<rect class="fig-grow" style="animation-delay:${.4+i*.2}s" x="${x}" y="80" width="114" height="84" rx="8" fill="var(--panel2)" stroke="var(--line)"/>`+t(x+57,112,a,{size:13,w:700})+t(x+57,140,b,{size:11,fill:'var(--muted)'});});
 s+=t(320,240,'시장 가격은 계산하지 않음 · 가설과 확인할 지표·발표일을 적음',{size:13,w:700});
 return {svg:svg(`예상 ${fx(R.expected,1)}%에 벗어난 몫 ${sp(sup,1)}%p를 더해 발표 ${fx(R.actual,1)}%, 시간 범위 셋`,s,256),caption:`모형 경제의 발표 ${fx(R.actual,1)}%는 예상 ${fx(R.expected,1)}%에 예상에서 벗어난 몫 ${sp(sup,1)}%p(▲)를 더한 것입니다. 예상까지는 이미 가격에 들어 있었을 수 있어, 경로를 가르는 것은 ${sp(sup,1)}%p와 그 몫이 이어질지입니다. 시간 범위 셋마다 가설과 버릴 관찰, 확인할 지표와 발표일을 적습니다.`};
};
function render(id){return F[id]?F[id]():null;}
root.MFigures={render};
})(typeof window!=='undefined'?window:this);
