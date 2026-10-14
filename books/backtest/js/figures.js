/* 장마다 “먼저 개념 잡기”에 들어가는 핵심 그림. 숫자는 모두 BMath(js/math.js)로 실제로 계산해 그린다.
   그림은 본문이 이미 계산한 숫자만 쓰고, 예측 질문(L2)과 확인 문제의 답은 그리지 않는다(6장은 설정 수에 따른 기대 최대 샤프의 방향도 그리지 않고,
   8장은 3/8 부분 체결의 다음 상태를, 10장은 40일째 값을, 마지막 과제는 풀이 칸의 원인별 금액을 그리지 않는다). 6장 그림은 표본 안 숫자만 쓴다(표본 밖은 실험에서 고른 뒤에 열림).
   선은 색 말고도 점 모양(● ▲ ◆ ○)과 선 무늬, 글자로 가린다. */
(function(root){
'use strict';const M=root.BMath||(typeof require==='function'?require('./math.js'):null);
const fx=(n,d=0)=>{const r=M.round(Number(n),d);return (r<0?'−':'')+Math.abs(r).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});};
const P=(x,d=2)=>fx(x*100,d)+'%',W=640;
const svg=(label,body,h=300)=>`<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" text-anchor="${o.a||'middle'}" font-size="${o.size||13}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const dot=(x,y,c,sh='●')=>sh==='▲'?`<path d="M${x.toFixed(1)} ${(y-6).toFixed(1)}l5.5 10h-11z" fill="${c}"/>`:sh==='◆'?`<path d="M${x.toFixed(1)} ${(y-6).toFixed(1)}l5 6l-5 6l-5-6z" fill="${c}"/>`:sh==='○'?`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="var(--chart)" stroke="${c}" stroke-width="2"/>`:`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${c}"/>`;
/* 선 그림. o={x:[lo,hi], y:[lo,hi,step,fmt], lines:[[pts, 색, 무늬]], refs:[[y, 글]], box:[L,R,T,B], xl, yl}. */
function plot(o){
 const [L,R,T,B]=o.box||[72,620,30,240],[x0,x1]=o.x,[y0,y1,ys,yf]=o.y,X=v=>L+(v-x0)/(x1-x0)*(R-L),Y=v=>B-(v-y0)/(y1-y0)*(B-T);
 let s=`<path d="M${L} ${T}V${B}H${R}" fill="none" stroke="var(--muted)"/>`;
 for(let v=y0;v<=y1+1e-9;v+=ys)s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--line)" stroke-dasharray="2 5"/>`+t(L-8,Y(v)+4,yf(v),{a:'end',size:12,fill:'var(--muted)'});
 (o.refs||[]).forEach(([v,txt,below])=>{s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--orange)" stroke-dasharray="7 4"/>`+t(R,below?Y(v)+16:Y(v)-6,txt,{a:'end',size:12,fill:'var(--orange)'});});
 (o.lines||[]).forEach(([pts,c,dash])=>{s+=`<path d="M${pts.map(p=>`${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('L')}" fill="none" stroke="${c}" stroke-width="2.2"${dash?` stroke-dasharray="${dash}"`:''}/>`;});
 if(o.xl)s+=t(R,B+30,o.xl,{a:'end',size:12,fill:'var(--muted)'});if(o.yl)s+=t(L,T-12,o.yl,{a:'start',size:12,fill:'var(--muted)'});
 return {s,X,Y};
}
function bars(vals,labels,o){
 const [L,R,T,B]=o.box||[72,620,40,230],lo=o.lo??0,hi=o.hi,Y=v=>B-(v-lo)/(hi-lo)*(B-T),w=(R-L)/vals.length,bw=Math.min(56,w*.62);let s=`<path d="M${L} ${Y(Math.max(lo,0)).toFixed(1)}H${R}" stroke="var(--muted)"/>`;
 vals.forEach((v,i)=>{const x=L+i*w+(w-bw)/2,y=Math.min(Y(v),Y(Math.max(lo,0))),h=Math.max(1,Math.abs(Y(v)-Y(Math.max(lo,0))));s+=`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${(o.colors&&o.colors[i])||'var(--blue)'}"/>`+t(x+bw/2,(v>=0?y-7:y+h+16),o.fmt(v),{size:12})+t(x+bw/2,B+18,labels[i],{size:12,fill:'var(--muted)'});});
 return s;
}
const legend=(items,y)=>items.map(([c,txt,dash],k)=>`<path d="M${72+k*210} ${y}h26" stroke="${c}" stroke-width="2.4"${dash?` stroke-dasharray="${dash}"`:''}/>`+t(104+k*210,y+4,txt,{a:'start',size:12})).join('');
function figBacktest(){
 const R=M.records(),pts=R.bars.filter((_,d)=>d%3===0).map((b,k)=>[k*3,b[3]]),p=plot({x:[0,750],y:[16000,24000,2000,v=>fx(v)],lines:[[pts,'var(--blue)']],refs:[[22000,'격자 위 끝 22,000원'],[18000,'격자 아래 끝 18,000원'],[17500,'멈춤 17,500원',1]],xl:'일째(0일째부터)',yl:'원'});
 const y3=p.X(500);return {svg:svg('새벽전자 750거래일 종가와 12권 격자의 범위',p.s+`<path d="M${y3.toFixed(1)} 30V240" stroke="var(--muted)" stroke-dasharray="3 4"/>`+t(y3+6,48,M.TEXT.madeYear3,{a:'start',size:12,fill:'var(--muted)'})+legend([['var(--blue)','새벽전자 종가(가상, 사흘마다)'],['var(--orange)','격자 범위와 멈춤 가격','7 4']],282),300),
  caption:`새벽전자의 750거래일 종가(가상 기록)와 12권 하린의 격자 범위(18,000~22,000원, 200원 간격 20칸), 멈춤 가격 17,500원입니다. 1장의 가정으로 3년을 이어 돌리면 왕복 ${fx(M.step('A1').trips)}번, 연 ${P(M.step('A1').ann)}입니다. ${M.TEXT.year3Note}.`};
}
function figData(){
 const R=M.records(),A=M.adjust(),n=250,pts=k=>k.slice(0,n).filter((_,d)=>d%2===0).map((b,i)=>[i*2,b[3]]),p=plot({x:[0,n],y:[16000,24000,2000,v=>fx(v)],lines:[[pts(R.bars),'var(--blue)'],[pts(A.bars),'var(--orange)','7 4']],refs:[[18000,'격자 칸 18,000원']],xl:'일째(1년째)',yl:'원'});
 return {svg:svg('1년째의 실제 종가와 수정 종가',p.s+legend([['var(--blue)','실제 거래 가격'],['var(--orange)','수정 종가(배당 세 번으로 거꾸로 맞춤)','7 4']],282),300),
  caption:`1년째의 실제 종가(실선)와 수정 종가(점선)입니다. 수정 종가는 뒤에 올 배당 세 번만큼 과거 가격을 낮춰 첫날 시가 ${fx(R.bars[0][0])}원이 ${fx(A.bars[0][0])}원이 되므로, 격자의 18,000원 칸이 그날 실제 가격과 다른 자리에 놓입니다.`};
}
function figLookahead(){
 const c=M.dayCompare(430),p=plot({x:[0,7],y:[17000,18800,400,v=>fx(v)],lines:[[c.points.map((v,i)=>[i,v]),'var(--blue)']],refs:[[17500,'멈춤 17,500원']],box:[72,600,40,230],xl:'하루 안의 점(0 = 장 시작, 7 = 장 마감)',yl:'원'});
 const pt=c.points,lo=pt.indexOf(Math.min(...pt));let s=p.s+pt.map((v,i)=>dot(p.X(i),p.Y(v),'var(--blue)')).join('')+dot(p.X(0),p.Y(pt[0]),'var(--accent)','▲')+t(p.X(0)+10,p.Y(pt[0])-10,`장 시작 ${fx(pt[0])}원(주문 시각)`,{a:'start',size:12})+dot(p.X(lo),p.Y(pt[lo]),'var(--orange)','◆')+t(p.X(lo),p.Y(pt[lo])+22,`저가 ${fx(c.bar[2])}원은 장 마감 뒤에 확정`,{size:12});
 return {svg:svg('430일째 하루 안 경로: 장 시작 가격과 장 마감 뒤에 확정되는 저가',s,280),caption:`430일째 하루 안 경로(가상)입니다. ▲는 장 시작 가격 ${fx(c.bar[0])}원, ◆는 그날의 저가 ${fx(c.bar[2])}원입니다. 버그 줄은 장이 끝나야 알 수 있는 저가를 보고 장 시작 가격에 팔았습니다.`};
}
function figFills(){
 const W5=M.waterfall().filter(s=>['A2','A3','A4','A5','T'].includes(s.key)),v=W5.map(s=>s.ann*100);
 return {svg:svg('가정을 하나씩 바꾼 연 수익률',bars(v,['코드 고침','하루 한 번','한 눈금','비용','하루 안 경로'],{hi:14,fmt:x=>fx(x,2)+'%',colors:['var(--blue)','var(--blue)','var(--blue)','var(--accent)','var(--orange)']})+t(72,22,'연 수익률(%) · 왼쪽부터 가정을 하나씩 더 바꿈',{a:'start',size:12,fill:'var(--muted)'}),270),
  caption:`3장을 고친 연 ${P(W5[0].ann)}에서 한 칸 하루 한 번, 한 눈금 지나야 체결, 수수료·거래세를 차례로 켜면 ${W5.slice(1,4).map(s=>P(s.ann)).join(' → ')}이고, 하루 안 경로로 계산하면 ${P(W5[4].ann)}입니다. ${M.TEXT.notExpected}.`};
}
function figMetrics(){
 const c=M.step('A5').curve,m=M.a5Stats(),pts=c.filter((_,i)=>i%3===0).map((v,k)=>[k*3+1,v/1e4]),p=plot({x:[1,750],y:[280,400,20,v=>fx(v)],lines:[[pts,'var(--accent)']],refs:[[300,'시작 300만 원']],xl:'번째 거래일',yl:'만 원'});
 const pk=m.peakDay,tr=m.troughDay;
 return {svg:svg('4장 현실 가정의 평가 금액과 최대 낙폭',p.s+dot(p.X(pk),p.Y(c[pk-1]/1e4),'var(--blue)','▲')+t(p.X(pk),p.Y(c[pk-1]/1e4)-12,`고점(${pk}번째)`,{size:12})+dot(p.X(tr),p.Y(c[tr-1]/1e4),'var(--orange)','◆')+t(p.X(tr)-8,p.Y(c[tr-1]/1e4)+20,`저점(${tr}번째)`,{a:'end',size:12}),280),
  caption:`4장 현실 가정의 평가 금액입니다. 연 ${P(m.ann)}, 샤프 비율 ${fx(m.sharpe,3)}, 최대 낙폭 ${P(m.mdd)}이며 ▲ 고점에서 ◆ 저점까지 떨어진 뒤 끝까지 되찾지 못했습니다.`};
}
function figOverfit(){
 const o=M.overfit(402),IS=[...o.IS].sort((a,b)=>b-a),top=IS.slice(0,10).map(x=>x*100);
 return {svg:svg('설정 402개의 표본 안 상위 10개 연 수익률',bars(top,top.map((_,i)=>`${i+1}위`),{hi:26,fmt:x=>fx(x,1),colors:top.map((_,i)=>i?'var(--blue)':'var(--accent)')})+t(72,22,`표본 안(1~2년째) 연 수익률(%), 설정 402개 가운데 상위 10개 · 중앙값 ${P(o.isMedian)}`,{a:'start',size:12,fill:'var(--muted)'}),270),
  caption:`설정 402개를 1~2년째 기록으로 돌려 줄 세운 상위 10개입니다. 1등은 연 ${P(o.isBest)}이고 402개의 중앙값은 ${P(o.isMedian)}입니다. 이 그림은 표본 안 숫자만 보입니다. 3년째 성적은 실험에서 설정을 고른 뒤에 열립니다.`};
}
function figApi(){
 const sc=M.schedule(16),secs=sc.total,L=72,w=(600-L)/secs;let s=t(L,24,'초 구간마다 나가는 주문(초당 2건, 가상)',{a:'start',size:12,fill:'var(--muted)'});
 for(let k=0;k<secs;k++){s+=t(L+k*w+w/2,214,`${k}초`,{size:12,fill:'var(--muted)'});sc.at.forEach((a,i)=>{if(a===k){const j=i%2;s+=`<rect x="${(L+k*w+6).toFixed(1)}" y="${150-j*52}" width="${(w-12).toFixed(1)}" height="44" rx="5" fill="var(--panel2)" stroke="var(--accent)"/>`+t(L+k*w+w/2,177-j*52,`칸 ${i+1}`,{size:12});}});}
 return {svg:svg('칸 16개의 주문을 초당 2건씩 보내는 순서',s+`<path d="M${L} 198H600" stroke="var(--muted)"/>`,230),caption:`칸 16개의 주문을 초당 2건만 받는 모의 서버(가상)에 다시 걸면 두 건씩 ${sc.total}초에 걸쳐 나갑니다. 실제 증권사의 한도는 증권사마다 다르고 공식 문서에서 확인합니다.`};
}
function figOrders(){
 const E=(...a)=>a.map((x,i)=>({...x,id:'e'+i})),ev=E({type:'ack'},{type:'timeout'},{type:'fill',qty:10}),blind=M.orderFlow(19000,10,ev,{resend:'blind'}),rid=M.orderFlow(19000,10,ev,{resend:'rid'});
 const lane=(y,name,r)=>`<rect x="20" y="${y}" width="600" height="70" rx="8" fill="var(--panel2)" stroke="var(--line)"/>`+t(32,y+22,name,{a:'start',size:13,w:600})+['요청','응답 없음','다시 보냄','체결 통보'].map((x,i)=>`<rect x="${40+i*140}" y="${y+32}" width="120" height="28" rx="5" fill="var(--chart)" stroke="${i===2?'var(--orange)':'var(--accent)'}"/>`+t(100+i*140,y+51,x,{size:12})).join('')+t(612,y+22,`나간 주문 ${r.orders.length}건 · 계좌 ${r.account.shares}주 · 장부 ${r.ledger.shares}주 ${r.diff.shares?'✗':'✓'}`,{a:'end',size:12});
 return {svg:svg('응답 없음 뒤 다시 보내는 두 방식',lane(14,'요청 ID 없이 다시 보냄',blind)+lane(100,'같은 요청 ID로 다시 보냄',rid),186),caption:`19,000원 10주 매수의 응답이 없을 때 요청 ID 없이 다시 보내면 주문이 ${blind.orders.length}건 나가 계좌 ${blind.account.shares}주, 장부 ${blind.ledger.shares}주로 어긋납니다. 같은 요청 ID로 보내면 서버가 첫 주문만 처리합니다(모의 서버, 가상).`};
}
function figLimits(){
 const r=M.stopCheck(M.STOP_LOGS.dup,{loss:60000,count:20,same:true,hold:128,recon:true,delay:5}),rows=r.rows,n=rows.length,L=72,R=600,X=i=>L+i*(R-L)/(n-1),Y=v=>230-v/140*190;
 let s=`<path d="M${L} 40V230H${R}" fill="none" stroke="var(--muted)"/><path d="M${L} ${Y(128).toFixed(1)}H${R}" stroke="var(--orange)" stroke-dasharray="7 4"/>`+t(R,Y(128)-6,'보유 한도 128주',{a:'end',size:12,fill:'var(--orange)'});
 [0,40,80,120].forEach(v=>{s+=t(L-8,Y(v)+4,`${v}`,{a:'end',size:12,fill:'var(--muted)'});});
 s+=`<path d="M${rows.map((x,i)=>`${X(i).toFixed(1)} ${Y(x.acct).toFixed(1)}`).join('L')}" fill="none" stroke="var(--accent)" stroke-width="2.2"/><path d="M${rows.map((x,i)=>`${X(i).toFixed(1)} ${Y(x.ledger).toFixed(1)}`).join('L')}" fill="none" stroke="var(--blue)" stroke-width="2.2" stroke-dasharray="7 4"/>`;
 rows.forEach((x,i)=>{s+=dot(X(i),Y(x.acct),'var(--accent)')+dot(X(i),Y(x.ledger),'var(--blue)','○');if(x.why&&x.why.length)s+=t(X(i),Y(x.acct)-14,'▲ '+x.why.map(w=>w==='same'?'같은 칸':w==='recon'?'대사':w).join('·'),{size:12,fill:'var(--orange)'});s+=t(X(i),250,x.check?'대사':x.open!=null?'시가':`${x.n}`,{size:12,fill:'var(--muted)'});});
 return {svg:svg('밤사이 같은 칸 세 번: 계좌와 장부의 주식 수',s+legend([['var(--accent)','계좌(서버가 아는 사실)'],['var(--blue)','봇 장부','7 4']],282),300),caption:`밤사이 같은 칸 세 번 기록에서 계좌(●)와 봇 장부(○)의 주식 수입니다. 보유 한도 128주는 걸리지 않고, 같은 칸 검사(▲)와 장 시작 전 대사(▲)가 걸립니다. 아래 숫자는 요청 번호입니다.`};
}
function figMonitor(){
 const rows=M.monitorDays(20),p=plot({x:[1,20],y:[-4000,1000,1000,v=>fx(v)],lines:[[rows.map(r=>[r.day+1,r.diffPnl]),'var(--accent)']],refs:[[0,'0원']],xl:'번째 거래일',yl:'누적 손익 차이(원)'});
 return {svg:svg('모의 서버 운용 앞 20거래일의 누적 손익 차이',p.s+rows.map(r=>dot(p.X(r.day+1),p.Y(r.diffPnl),r.missed||r.extra?'var(--orange)':'var(--accent)',r.missed||r.extra?'◆':'●')).join(''),280),
  caption:`모의 서버 운용 앞 20거래일의 누적 손익 차이(모의 서버 − 백테스트)입니다. ◆는 놓친 체결이나 더 생긴 체결이 있던 날이고, 20일째 누적 차이는 ${fx(rows[19].diffPnl)}원입니다.`};
}
function figFinal(){
 const steps=[['계좌·장부 대사','단단한 증거'],['주문 기록','단단한 증거'],['같은 60일 백테스트','가정에 기댐'],['60일 체결 짝짓기','규칙에 기댐'],['설정을 고른 과정','기대치의 출처']];let s='';
 steps.forEach(([a,b],i)=>{const x=20+i*124;s+=`<rect x="${x}" y="40" width="112" height="70" rx="8" fill="var(--panel2)" stroke="${i<2?'var(--accent)':'var(--line)'}" stroke-width="${i<2?2.4:1}"/>`+t(x+56,68,a,{size:12,w:600})+t(x+56,92,b,{size:12,fill:'var(--muted)'})+(i<4?`<path d="M${x+112} 75h12" stroke="var(--muted)"/>`:'');});
 s+=t(320,150,`합 확인: 원인 금액의 합 = 실제 손익 −89,061원(−2.97%)`,{size:13});
 return {svg:svg('증거를 보는 순서와 합 확인',s,180),caption:`증거는 해석 없이 확인되는 대사·주문 기록(굵은 테두리)부터 봅니다. 표본 안 연 23.23%가 어디서 왔는지는 마지막에 묻고, 원인 금액의 합이 실제 손익과 같은지로 조사를 끝냅니다.`};
}
const MAP={backtest:figBacktest,data:figData,lookahead:figLookahead,fills:figFills,metrics:figMetrics,overfit:figOverfit,api:figApi,orders:figOrders,limits:figLimits,monitor:figMonitor,final:figFinal};
const cache={};
function render(id){if(!MAP[id])return null;return cache[id]||(cache[id]=MAP[id]());}
const api={render};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.BFigures=api;
})(typeof window!=='undefined'?window:globalThis);
