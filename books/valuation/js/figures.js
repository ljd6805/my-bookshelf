/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 모두 VMath(js/math.js)로 실제로 계산해 그린다.
   8장 그림은 L2(운전자본 32.2% + 영업이익률 13%)를, 10장 그림은 L2(할인율 먼저 바꾼 B)를 미리 보이지 않도록 본문 순서의 숫자만 그린다.
   움직임은 style.css의 fig-* 애니메이션이며 동작 줄이기에서 멈춘다. 색 말고도 막대마다 숫자와 이름표를 붙인다. */
(function(root){
'use strict';
const M=root.VMath||(typeof require==='function'?require('./math.js'):null);
const fx=(n,d=0)=>{const r=Number(Number(n).toFixed(d));return (r<0?'−':'')+Math.abs(r).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});};
const N=x=>{const r=M.r1(x);return fx(r,Number.isInteger(r)?0:1);},E=x=>N(x)+'억 원',Wn=x=>fx(Math.round(x))+'원',P=(x,d=1)=>fx(x*100,d)+'%',SW=x=>(x>0?'+':'')+fx(Math.round(x));
const svg=(label,body,h=260)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||13}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const up=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow fig-up" style="animation-delay:${delay}s" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(w,1).toFixed(1)}" height="${Math.max(h,1).toFixed(1)}" rx="2" fill="${color}"/>`;
const A=M.ASSUME,D=M.dcf();
/* 막대 묶음(0선 기준, 음수는 아래로): items=[[이름, 값, 강조, 글]]. */
function bars(items,{x0=60,gap=110,bw=70,top=60,zero=200,scale,f=N}={}){
 const hi=scale||Math.max(...items.map(i=>Math.abs(i[1])),1),H=v=>v/hi*(zero-top);let s=`<path d="M${x0-20} ${zero}H${Math.min(630,x0+gap*items.length)}" stroke="var(--line)"/>`;
 items.forEach(([n,v,on,label],i)=>{const x=x0+i*gap,h=Math.abs(H(v)),y=v>=0?zero-h:zero;s+=up(x,y,bw,h,on?'var(--accent)':'var(--blue)',i*.15)+t(x+bw/2,v>=0?y-8:y+h+16,(on?'▲ ':'')+(label||f(v)),{size:13,w:700})+t(x+bw/2,v>=0?zero+20:zero-8,n,{size:12});});
 return s;
}
const F={};
F.price=()=>{
 const b=M.basics(),s=M.split({},5);
 let st=t(20,26,'1주를 5주로 나누면: 한 주의 숫자는 5분의 1, 회사 전체는 그대로',{size:13,w:700,a:'start'})+bars([['주가',b.price],['주가(분할 뒤)',s.price,true],['EPS ×10',b.eps*10,false,Wn(b.eps)],['EPS ×10(분할 뒤)',s.eps*10,true,Wn(s.eps)]],{x0:40,gap:150,bw:80,top:60,zero:190,scale:b.price,f:Wn});
 st+=t(320,232,`시가총액 ${fx(b.price)}원 × 1,000만 주 = ${E(b.cap)} = ${fx(s.price)}원 × 5,000만 주`,{size:13,w:700});
 return {svg:svg(`주가 ${Wn(b.price)}, EPS ${Wn(b.eps)}이 분할 뒤 ${Wn(s.price)}, ${Wn(s.eps)}; 시가총액 ${E(b.cap)} 그대로`,st,246),caption:`새벽전자의 시가총액은 ${fx(b.price)}원 × 1,000만 주 = ${E(b.cap)}이고, EPS는 ${Wn(b.eps)}, BPS는 ${Wn(b.bps)}입니다. 1주를 5주로 나누면 주가 ${Wn(s.price)}, EPS ${Wn(s.eps)}, BPS ${Wn(s.bps)}으로 한 주의 숫자만 5분의 1이 되고 시가총액은 ${E(s.cap)} 그대로입니다(EPS 막대는 10배로 늘려 그렸습니다).`};
};
F.per=()=>{
 const T=M.peerTable(),m=M.multiples(),pv=M.peerValues(),items=[...T.map(p=>[`비교 회사 ${p.name}`,p.per]),['새벽전자',m.per,true]];
 let s=t(20,26,'PER(배)과 비교 회사 중앙값',{size:13,w:700,a:'start'})+bars(items,{x0:40,gap:120,bw:70,top:50,zero:190,scale:20,f:v=>fx(v,2)+'배'});
 const y=190-pv.median.per/20*140;s+=`<path class="fig-dash" d="M20 ${y.toFixed(1)}H630" stroke="var(--orange)" stroke-width="2"/>`+t(630,y-6,`중앙값 ${fx(pv.median.per,2)}배`,{size:12,a:'end',fill:'var(--orange)',w:700});
 s+=t(320,232,`PBR = ROE × PER: ${fx(m.roe,3)} × ${fx(m.per,2)} = ${fx(m.pbr,2)}배`,{size:13,w:700});
 return {svg:svg(`PER: ${items.map(i=>`${i[0]} ${fx(i[1],2)}배`).join(', ')}; 중앙값 ${fx(pv.median.per,2)}배`,s,246),caption:`새벽전자 2025는 PER ${fx(m.per,2)}배, PBR ${fx(m.pbr,2)}배, ROE ${P(m.roe)}이고 ${fx(m.roe,3)} × ${fx(m.per,2)} = ${fx(m.pbr,2)}로 맞습니다. 가상의 비교 회사 가·나·다·라의 PER 중앙값 ${fx(pv.median.per,2)}배를 EPS ${Wn(m.eps)}에 곱하면 ${Wn(pv.values.per)}, PBR 중앙값 ${fx(pv.median.pbr,3)}배를 BPS에 곱하면 ${Wn(pv.values.pbr)}입니다.`};
};
F.dividend=()=>{
 const d=M.dividend(),r=M.impliedR(A.dps,A.price,A.dividendGrowth),W=v=>v/0.1*420;
 let s=t(20,26,'r = D₁ ÷ P + g (배당이 해마다 7%씩 영원히 자란다고 놓을 때)',{size:13,w:700,a:'start'});
 s+=`<rect class="fig-grow" x="40" y="60" width="${W(r.yield1).toFixed(1)}" height="40" fill="var(--blue)"/><rect class="fig-grow" style="animation-delay:.3s" x="${(40+W(r.yield1)).toFixed(1)}" y="60" width="${W(A.dividendGrowth).toFixed(1)}" height="40" fill="var(--accent)" fill-opacity=".7"/>`;
 s+=t(40+W(r.yield1)/2,128,`D₁ ÷ P ${P(r.yield1,2)}`,{size:12,w:700})+t(40+W(r.yield1)+W(A.dividendGrowth)/2,128,`g ${P(A.dividendGrowth,0)}`,{size:12,w:700})+t(40+W(r.r)+8,86,`= r ${P(r.r,2)}`,{size:14,w:700,a:'start'});
 s+=t(20,172,`배당수익률 400 ÷ 20,000 = ${P(d.yield,1)} · 배당성향 400 ÷ ${fx(d.eps)} = ${P(d.payout)} · 지속 가능 성장률 ${P(d.retention)} × ${P(M.multiples().roe)} = ${P(d.sustainableG)}`,{size:12,a:'start',fill:'var(--muted)'});
 return {svg:svg(`D₁ ÷ P ${P(r.yield1,2)} + g 7% = r ${P(r.r,2)}`,s,190),caption:`새벽전자의 배당수익률은 ${P(d.yield,1)}, 배당성향은 ${P(d.payout)}입니다. 배당이 해마다 7%씩 영원히 자란다고 놓으면 1년 뒤 배당 ${Wn(r.d1)}을 주가로 나눈 ${P(r.yield1,2)}에 7%를 더해 요구수익률 ${P(r.r,2)}가 나옵니다. 남긴 이익으로 계산한 지속 가능 성장률 ${P(d.sustainableG)}는 영원히 이어질 수 없는 값입니다.`};
};
F.ev=()=>{
 const a=M.evBridge(2024),b=M.evBridge(2025),pv=M.peerValues(),H=v=>v/2500*150;
 let s=t(20,26,'EV = 시가총액 + 차입금 − 현금 (억 원)',{size:13,w:700,a:'start'});
 [[a,'2024년 말',40],[b,'2025년 말',340]].forEach(([e,n,x0],k)=>{const z=200;s+=up(x0,z-H(e.cap),70,H(e.cap),'var(--blue)',k*.2)+t(x0+35,z-H(e.cap)-6,`시총 ${N(e.cap)}`,{size:12})+up(x0+90,z-H(e.cap+e.debt),70,H(e.debt),'var(--orange)',k*.2+.1)+t(x0+125,z-H(e.cap+e.debt)-6,`+차입 ${N(e.debt)}`,{size:12})+up(x0+180,z-H(e.ev),70,H(e.ev),'var(--accent)',k*.2+.2)+t(x0+215,z-H(e.ev)-6,`EV ${N(e.ev)}`,{size:12,w:700})+t(x0+125,z+20,`${n} · 현금 ${N(e.cash)} 뺌`,{size:12})+`<path d="M${x0-10} ${z}H${x0+260}" stroke="var(--line)"/>`;});
 s+=t(320,246,`EV/EBITDA ${fx(a.evEbitda,2)}배 → ${fx(b.evEbitda,2)}배 · 중앙값 ${fx(pv.median.evEbitda,1)}배로 매기면 ${Wn(pv.values.evEbitda)}`,{size:12,fill:'var(--muted)'});
 return {svg:svg(`2024년 말 EV ${N(a.ev)}, 2025년 말 EV ${N(b.ev)}억 원`,s,260),caption:`주가가 20,000원으로 같아도 순차입금이 ${E(a.netDebt)}에서 ${E(b.netDebt)}으로 늘어 EV는 ${E(a.ev)}에서 ${E(b.ev)}이 되었습니다. EBITDA ${E(b.ebitda)}으로 나누면 ${fx(b.evEbitda,2)}배이고, 비교 회사 중앙값 ${fx(pv.median.evEbitda,1)}배로 매긴 기업가치 ${E(pv.evValue)}에서 순차입금을 빼면 주당 ${Wn(pv.values.evEbitda)}입니다. 배수 세 가지 범위는 ${Wn(pv.low)}~${Wn(pv.high)}입니다.`};
};
F.fcf=()=>{
 const a=M.actualFcff(2024),b=M.actualFcff(2025),f=M.forecast();
 let s=t(20,26,'FCFF: 실적 두 해와 기준안 예측 다섯 해 (억 원)',{size:13,w:700,a:'start'})+bars([['2024 실적',a.fcff],['2025 실적',b.fcff],...f.rows.map(r=>[`${r.year}`,r.fcff,true])],{x0:30,gap:86,bw:56,top:50,zero:150,scale:240});
 s+=t(320,286,`예측 다섯 해를 8.3%로 할인한 현재가치 합 ${E(f.pvSum)}`,{size:13,w:700});
 return {svg:svg(`FCFF 실적 ${N(a.fcff)}, ${N(b.fcff)}; 예측 ${f.rows.map(r=>N(r.fcff)).join(', ')}; 현재가치 합 ${N(f.pvSum)}`,s,298),caption:`2024년 FCFF는 ${N(a.nopat)} + ${N(a.dep)} − ${N(a.capex)} − ${N(a.dNwc)} = ${E(a.fcff)}, 2025년은 운전자본이 ${N(b.dNwc)}억 원 늘어 ${E(b.fcff)}입니다. 기준안의 2026년 FCFF는 ${E(f.rows[0].fcff)}(운전자본 ${N(-f.rows[0].dNwc)}억 원 회수 포함)이고, 2027~2030년 ${N(f.rows[1].fcff)}~${N(f.rows[4].fcff)}억 원을 할인율 8.3%로 할인해 더하면 ${E(f.pvSum)}입니다.`};
};
F.wacc=()=>{
 const w=M.wacc(),W=v=>v*560;
 let s=t(20,26,'시장가 비중으로 두 비용을 섞기',{size:13,w:700,a:'start'});
 s+=`<rect class="fig-grow" x="40" y="50" width="${W(w.wE).toFixed(1)}" height="44" fill="var(--blue)"/><rect class="fig-grow" style="animation-delay:.3s" x="${(40+W(w.wE)).toFixed(1)}" y="50" width="${W(w.wD).toFixed(1)}" height="44" fill="var(--orange)"/>`;
 s+=t(40+W(w.wE)/2,77,`주식 2,000억 원 ${P(w.wE)}`,{size:13,w:700,fill:'var(--bg)'})+t(40+W(w.wE)+W(w.wD)/2,77,`부채 ${P(w.wD)}`,{size:12,w:700,fill:'var(--bg)'});
 s+=t(40+W(w.wE)/2,124,`자기자본비용 ${P(w.rf)} + ${fx(w.beta,1)} × ${P(w.erp)} = ${P(w.ke,1)}`,{size:12})+t(40+W(w.wE)+W(w.wD)/2,124,`세후 ${P(w.kd,2)}`,{size:12});
 s+=t(320,170,`WACC = ${P(w.wE)} × ${P(w.ke,1)} + ${P(w.wD)} × ${P(w.kd,2)} = ${P(w.wacc,3)} → 8.3%`,{size:14,w:700})+t(320,196,'국고채 금리 확인일 2026-10-08 · 위험 프리미엄 2026-01-05 추정',{size:12,fill:'var(--muted)'});
 return {svg:svg(`주식 ${P(w.wE)}, 부채 ${P(w.wD)}; 자기자본비용 ${P(w.ke,1)}, 세후 부채 비용 ${P(w.kd,2)}; WACC ${P(w.wacc,3)}`,s,210),caption:`자기자본비용은 국고채 금리 ${P(w.rf)} + 베타 ${fx(w.beta,1)} × 위험 프리미엄 ${P(w.erp)} = ${P(w.ke,1)}, 세후 부채 비용은 ${P(w.kdPre,2)} × (1 − 20%) = ${P(w.kd,2)}입니다. 주식 2,000억 원과 차입금 450억 원의 비중 ${P(w.wE)} : ${P(w.wD)}로 섞으면 WACC ${P(w.wacc,3)}이고, 이 책은 8.3%를 씁니다(확인일 2026-10-08).`};
};
F.terminal=()=>{
 const H=v=>v/2800*170,z=210;let s=t(20,26,'기업가치 = 5년 현재가치 + 영구가치의 현재가치 (억 원)',{size:13,w:700,a:'start'});
 s+=up(60,z-H(D.pvSum),90,H(D.pvSum),'var(--blue)')+t(105,z-H(D.pvSum)-8,N(D.pvSum),{w:700})+t(105,z+18,'5년 현재가치',{size:12});
 s+=up(200,z-H(D.tvPv),90,H(D.tvPv),'var(--accent)',.2)+t(245,z-H(D.tvPv)-8,`▲ ${N(D.tvPv)} (${P(D.tvShare)})`,{w:700})+t(245,z+18,'영구가치의 현재가치',{size:12});
 s+=up(340,z-H(D.firm),90,H(D.firm),'var(--blue)',.4)+t(385,z-H(D.firm)-8,N(D.firm),{w:700})+t(385,z+18,'기업가치',{size:12});
 s+=up(480,z-H(D.equity),90,H(D.equity),'var(--accent)',.6)+t(525,z-H(D.equity)-8,N(D.equity),{w:700})+t(525,z+18,`주주 몫 (순차입금 ${N(D.netDebt)} 뺌)`,{size:12})+`<path d="M40 ${z}H600" stroke="var(--line)"/>`;
 return {svg:svg(`5년 현재가치 ${N(D.pvSum)} + 영구가치의 현재가치 ${N(D.tvPv)} = 기업가치 ${N(D.firm)}; 주주 몫 ${N(D.equity)}`,s,236),caption:`2031년 FCFF ${E(D.next.fcff)}을 (8.3% − 2%)로 나눈 영구가치 ${E(D.tv)}은 현재가치 ${E(D.tvPv)}으로, 기업가치 ${E(D.firm)}의 ${P(D.tvShare)}를 차지합니다. 순차입금 ${E(D.netDebt)}을 빼면 주주 몫 ${E(D.equity)}, 1,000만 주로 나눈 주당 가치는 ${Wn(D.perShare)}입니다.`};
};
F.sensitivity=()=>{
 const tor=M.tornado(),mid=tor[0].base,lo=Math.min(...tor.map(r=>r.low)),hi=Math.max(...tor.map(r=>r.high)),X=v=>210+(v-lo)/(hi-lo)*360,K={r:'할인율',margin:'영업이익률',wcRatio:'운전자본 비율',growth:'매출 성장률',gT:'영구성장률'};
 let s=t(20,24,'가정 하나씩 바꾼 폭 (원, 큰 순서)',{size:13,w:700,a:'start'})+`<path class="fig-dash" d="M${X(mid).toFixed(1)} 36V214" stroke="var(--orange)" stroke-width="2"/>`+t(X(mid),232,`기준안 ${Wn(mid)}`,{size:12,fill:'var(--orange)',w:700});
 tor.forEach((r,i)=>{const y=40+i*34;s+=t(120,y+16,K[r.key],{size:12,a:'end'})+`<rect class="fig-grow" style="animation-delay:${i*.15}s" x="${X(r.low).toFixed(1)}" y="${y+2}" width="${(X(r.high)-X(r.low)).toFixed(1)}" height="20" fill="${i?'var(--blue)':'var(--accent)'}"/>`+t(X(r.low)-6,y+16,fx(Math.round(r.low)),{size:11,a:'end'})+t(X(r.high)+6,y+16,fx(Math.round(r.high)),{size:11,a:'start'});});
 return {svg:svg(`가정별 변화 폭: ${tor.map(r=>`${K[r.key]} ${fx(Math.round(r.low))}~${fx(Math.round(r.high))}`).join(', ')}`,s,244),caption:`할인율 ±1%p는 ${Wn(tor[0].valueAtFrom)} ↔ ${Wn(tor[0].valueAtTo)}, 영업이익률 ±1%p는 ${Wn(tor[1].valueAtFrom)} ↔ ${Wn(tor[1].valueAtTo)}으로 움직입니다. 운전자본 32.2% ↔ 18%, 성장률 3% ↔ 7%, 영구성장률 ±0.5%p로 고르면 막대는 할인율 → 영업이익률 → 운전자본 → 성장률 → 영구성장률 순서이고, 범위를 다르게 고르면 순서도 바뀝니다.`};
};
F.implied=()=>{
 const g=M.implied('growth'),r=M.implied('r'),pts=[];for(let i=0;i<=24;i++){const x=-0.02+i*0.005;pts.push([x,M.value({growth:x})]);}
 const X=x=>60+(x+0.02)/0.12*520,Y=v=>200-(v-17000)/9000*150;
 let s=t(20,24,'매출 성장률만 바꾼 DCF 주당 가치와 주가 20,000원',{size:13,w:700,a:'start'})+`<path class="fig-draw" d="M${pts.map(p=>`${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('L')}" fill="none" stroke="var(--blue)" stroke-width="3"/>`;
 s+=`<path d="M60 ${Y(20000).toFixed(1)}H590" stroke="var(--orange)" stroke-dasharray="5 4" stroke-width="2"/>`+t(590,Y(20000)-8,'주가 20,000원',{size:12,a:'end',fill:'var(--orange)',w:700})+`<circle class="fig-pulse" cx="${X(g).toFixed(1)}" cy="${Y(20000).toFixed(1)}" r="7" fill="var(--accent)"/>`+t(X(g),Y(20000)+26,`성장률 ${P(g,2)}`,{size:12,w:700})+`<circle cx="${X(0.05).toFixed(1)}" cy="${Y(D.perShare).toFixed(1)}" r="5" fill="var(--text)"/>`+t(X(0.05)+8,Y(D.perShare)-8,`기준안 5% · ${Wn(D.perShare)}`,{size:12,a:'start'});
 [0,0.04,0.08].forEach(x=>{s+=t(X(x),222,P(x,0),{size:11,fill:'var(--muted)'});});
 return {svg:svg(`주가 20,000원에 맞는 매출 성장률 ${P(g,2)}, 기준안 5%에서 ${Wn(D.perShare)}`,s,236),caption:`나머지를 기준안으로 두면 DCF 주당 가치가 주가 20,000원과 같아지는 매출 성장률은 ${P(g,2)}이고, 성장률을 5%로 두면 할인율 ${P(r,1)}가 주가를 설명합니다. 같은 주가가 “성장이 거의 없다”는 가정으로도, “할인율이 더 높다”는 가정으로도 설명된다는 뜻입니다.`};
};
F.final=()=>{
 const f=M.finalTask(),K={wcRatio:'운전자본',margin:'영업이익률',growth:'성장률',r:'할인율'},H=v=>v/34000*170,z=210,w=78;let run=f.gap.start,x=30;
 let s=t(20,24,'B에서 A로 본문 순서대로 하나씩 (원)',{size:13,w:700,a:'start'})+up(x,z-H(run),w-20,H(run),'var(--blue)')+t(x+29,z-H(run)-8,fx(Math.round(run)),{size:12,w:700})+t(x+29,z+18,'B',{size:12});
 f.gap.steps.forEach((st,i)=>{x+=w+24;s+=up(x,z-H(st.value),w-20,H(st.delta),'var(--accent)',(i+1)*.2)+t(x+29,z-H(st.value)-8,SW(st.delta),{size:12,w:700})+t(x+29,z+18,K[st.key],{size:12});run=st.value;});
 x+=w+24;s+=up(x,z-H(f.A.perShare),w-20,H(f.A.perShare),'var(--blue)',1.1)+t(x+29,z-H(f.A.perShare)-8,fx(Math.round(f.A.perShare)),{size:12,w:700})+t(x+29,z+18,'A',{size:12})+`<path d="M20 ${z}H630" stroke="var(--line)"/>`;
 return {svg:svg(`B ${Wn(f.B.perShare)}에서 ${f.gap.steps.map(st=>`${K[st.key]} ${SW(st.delta)}`).join(', ')}를 더해 A ${Wn(f.A.perShare)}`,s,236),caption:`분석가 B ${Wn(f.B.perShare)}에서 운전자본 비율, 영업이익률, 성장률, 할인율을 본문 순서대로 A의 것으로 바꾸면 ${f.gap.steps.map(st=>`${SW(st.delta)}원`).join(', ')}이 더해져 A ${Wn(f.A.perShare)}에 닿습니다. 몫의 합은 차이 ${Wn(f.diff)}과 같고, 각 몫은 바꾸는 순서에 따라 달라집니다.`};
};
function render(id){return F[id]?F[id]():null;}
root.VFigures={render};
})(typeof window!=='undefined'?window:this);
