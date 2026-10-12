/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 모두 GMath(js/math.js)로 하린의 격자(18,000~22,000원 · 200원 · 20칸 · 칸당 5주)를 실제로 계산해 그린다.
   5장부터의 가격 경로는 tests/math.test.cjs와 같은 정의의 가상 시나리오다. 움직임은 style.css의 fig-* 애니메이션이며 동작 줄이기에서 멈춘다. */
(function(root){
'use strict';
const M=root.GMath||(typeof require==='function'?require('./math.js'):null);
const won=n=>(n<0?'−':'')+Math.abs(Math.round(n)).toLocaleString('ko-KR');
const plus=n=>(n>0?'+':'')+won(n);
const svg=(label,body,h=260)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||13}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const note=(s,y=250)=>t(320,y,s,{size:12,fill:'var(--muted)'});
const up=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow fig-up" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${Math.max(h,1)}" rx="2" fill="${color}"/>`;
const LV=M.arithmeticLevels(18000,22000,20);
const BOX=()=>M.wave({start:20000,days:80,perDay:8,amp:7,period:64});
const UP=()=>M.wave({start:20000,days:30,perDay:8,amp:2,period:8,drift:.8});
const DOWN=()=>M.wave({start:20000,days:30,perDay:8,amp:2,period:8,drift:-.8});
const FINAL=()=>[...BOX(),...M.wave({start:20000,days:20,perDay:8,amp:2,period:16,drift:-.5,gaps:{0:-8}}),...M.wave({start:16700,days:20,perDay:8,amp:2,period:16})];
const SWING=[19900,17900,22100,17900,22100,17900,22100];
/* 가격 경로 그리기: 격자선(levels)과 가격 선, 선택한 점의 표시. 좌표 상자 x0~x1, y0~y1, 가격 범위 lo~hi. */
function plot(prices,{x0=70,x1=600,y0=30,y1=210,lo,hi,levels=LV,band=true}={}){
 const X=i=>x0+i/Math.max(1,prices.length-1)*(x1-x0),Y=v=>y1-(v-lo)/(hi-lo)*(y1-y0);
 let s=band?`<rect x="${x0}" y="${Y(levels.at(-1))}" width="${x1-x0}" height="${Y(levels[0])-Y(levels.at(-1))}" fill="var(--accent)" opacity=".08"/>`:'';
 levels.forEach((v,i)=>{if(v>=lo&&v<=hi)s+=`<path d="M${x0} ${Y(v).toFixed(1)}H${x1}" stroke="var(--accent)" stroke-opacity="${i%5?.25:.55}" stroke-dasharray="2 3"/>`+(i%5?'':t(x0-6,Y(v)+4,won(v),{a:'end',size:11,fill:'var(--muted)'}));});
 s+=`<path class="fig-draw" d="${prices.map((p,i)=>`${i?'L':'M'}${X(i).toFixed(1)} ${Y(p).toFixed(1)}`).join('')}" fill="none" stroke="var(--text)" stroke-width="${prices.length>200?1.3:2.4}"/>`;
 return {s,X,Y};
}
const F={};
F.rule=()=>{
 const st=LV.slice(0,-1).map(L=>19900>L?'armed':'idle'),Y=v=>230-(v-18000)/4000*200;
 let s='';
 st.forEach((k,i)=>{const y=Y(LV[i+1]);s+=`<rect x="210" y="${y+1}" width="150" height="8" rx="2" class="cell-${k}"/>`;if(i%5===0)s+=t(202,Y(LV[i])+4,won(LV[i]),{a:'end',size:11,fill:'var(--muted)'});});
 s+=t(202,Y(22000)+4,'22,000',{a:'end',size:11,fill:'var(--muted)'})+`<path class="fig-pulse" d="M372 ${Y(19900)}l14 -6v12z" fill="var(--orange)"/>`+t(392,Y(19900)+4,'지금 19,900원',{a:'start',size:13,fill:'var(--orange)',w:700});
 s+=t(392,Y(21000),'– 위쪽 열 칸: 주문 없음',{a:'start',size:13})+t(392,Y(21000)+18,'가격이 한 번 위로 다녀와야 매수가 걸림',{a:'start',size:11,fill:'var(--muted)'})+t(392,Y(18900),'○ 아래쪽 열 칸: 매수 대기',{a:'start',size:13})+t(392,Y(18900)+18,'19,800원부터 18,000원까지 매수 지정가',{a:'start',size:11,fill:'var(--muted)'});
 s+=t(285,22,'칸 20개 · 칸마다 5주',{size:13,w:700});
 return {svg:svg('18,000원부터 22,000원까지 200원 간격 20칸 격자. 19,900원에서 빈손으로 시작하면 아래 열 칸에는 매수 주문이 걸리고 위 열 칸에는 주문이 없다',s,250),caption:'19,900원에서 주식 없이 시작하면 매수가가 19,800원 이하인 아래 열 칸에만 매수 주문이 걸립니다. 위 열 칸은 가격이 그 위로 한 번 올라가야 주문이 걸립니다.'};
};
F.cell=()=>{
 const r=M.roundTrip(19800,20000,5),items=[['차익',r.gross],['매수 수수료',-r.buyFee],['매도 수수료',-r.sellFee],['거래세',-r.tax],['남는 몫',r.net]],Y=v=>200-v/1000*160;
 let s=`<path d="M60 200H600" stroke="var(--line)"/>`,run=0;
 items.forEach(([n,v],i)=>{const x=80+i*104,last=i===items.length-1,from=last?0:run,to=last?r.net:run+v;if(!last)run=to;
  s+=up(x,Y(Math.max(from,to)),70,Math.abs(Y(from)-Y(to)),last?'var(--accent)':v<0?'var(--orange)':'var(--blue)',i*.2)+t(x+35,Y(Math.max(from,to))-8,plus(v),{size:13,w:700})+t(x+35,222,n,{size:12});});
 return {svg:svg('19,800원 칸 5주의 한 번 왕복: 차익 1,000원에서 매수 수수료 14원, 매도 수수료 15원, 거래세 200원을 빼면 771원이 남는 폭포 그림',s+note('수수료 0.015%는 가정, 거래세 0.20%는 2026년 코스피·코스닥 주식 기준입니다.',248)),caption:`19,800원에 5주를 사서 20,000원에 팔면 차익 ${won(r.gross)}원에서 비용 ${won(r.costs)}원이 빠져 ${won(r.net)}원이 남습니다. 비용의 대부분은 팔 때 붙는 거래세입니다.`};
};
F.spacing=()=>{
 const G=M.geometricLevels(18000,22000,20),rows=[['등차',LV,'var(--blue)'],['등비',G,'var(--accent)']];
 let s='';
 rows.forEach(([n,lv,c],r)=>{const y=r?200:100,steps=lv.slice(1).map((p,i)=>p-lv[i]);s+=t(56,y-20,n,{a:'end',size:13,w:700});steps.forEach((v,i)=>{const h=v/250*70,odd=r&&(v===250);s+=up(70+i*26,y-h,20,h,odd?'var(--orange)':c,i*.04)+(odd?t(80+i*26,y-h-6,'◆ 250',{size:11,fill:'var(--orange)',w:700}):'');});s+=t(600,y-20,(Math.min(...steps)===Math.max(...steps)?`${steps[0]}원`:`${Math.min(...steps)}~${Math.max(...steps)}원`),{a:'end',size:12,fill:'var(--muted)'});});
 s+=t(70,222,'18,000원',{a:'start',size:11,fill:'var(--muted)'})+t(330,222,'20,000원 (눈금 10원 → 50원)',{size:11,fill:'var(--muted)'})+t(600,222,'22,000원',{a:'end',size:11,fill:'var(--muted)'});
 return {svg:svg('18,000~22,000원 20칸을 등차로 나누면 칸마다 200원, 등비로 나눠 눈금에 맞추면 180원에서 250원까지 벌어지고 2만 원 위 두 칸이 250원으로 튀는 막대그래프',s+note('막대 높이는 칸의 간격(원)입니다.',246)),caption:'등차 격자는 칸마다 200원입니다. 등비 격자는 아래 칸 180원에서 시작해 2만 원 근처에서 200원이 되고, 2만 원 위 50원 눈금에서는 20,900원과 21,550원 칸이 250원으로 튑니다.'};
};
F.range=()=>{
 const items=[['18,000~22,000 · 20칸',M.gridBudget(LV,5)],['18,000~22,000 · 40칸',M.gridBudget(M.arithmeticLevels(18000,22000,40),5)],['16,000~24,000 · 20칸',M.gridBudget(M.arithmeticLevels(16000,24000,20),5)]],Y=v=>210-v/4.5e6*180;
 let s=`<path d="M60 210H600" stroke="var(--line)"/><path class="fig-dash" d="M60 ${Y(3e6)}H600" stroke="var(--orange)" stroke-width="1.5"/>`+t(600,Y(3e6)-6,'한도 300만 원',{a:'end',size:12,fill:'var(--orange)',w:700});
 items.forEach(([n,v],i)=>{const x=100+i*170,over=v>3e6;s+=up(x,Y(v),100,210-Y(v),over?'var(--orange)':'var(--accent)',i*.25)+t(x+50,Y(v)-8,`${won(v)}원${over?' ✗':' ✓'}`,{size:12,w:700})+t(x+50,228,n,{size:12});});
 return {svg:svg('최악의 경우 묶이는 돈: 20칸 1,990,289원, 같은 범위 40칸 3,990,579원으로 300만 원 초과, 16,000~24,000원 20칸 1,980,288원',s+note('모든 칸이 한 번씩 사진 채 하나도 팔리지 않은 경우입니다. 칸당 5주.',248)),caption:'칸을 40개로 늘리면 최악의 경우 묶이는 돈이 두 배가 되어 한도 300만 원을 넘습니다. 범위를 두 배로 넓히고 칸 수를 그대로 두면 돈은 비슷하지만 간격이 400원이 됩니다.'};
};
F.box=()=>{
 const {s:base,X,Y}=plot(SWING,{lo:17600,hi:22400}),cum=[3,5,7].map(k=>M.simulate({path:SWING.slice(0,k),levels:LV,qty:5}).realized);
 let s=base;[2,4,6].forEach((i,k)=>{s+=`<circle class="fig-pulse" cx="${X(i)}" cy="${Y(SWING[i])}" r="5" fill="var(--orange)"/>`+t(X(i),Y(SWING[i])-12,`${k+1}바퀴 뒤 ${plus(cum[k])}원`,{size:12,fill:'var(--orange)',w:700});});
 return {svg:svg('19,900원에서 17,900원과 22,100원 사이를 세 번 오가는 경로. 실현 손익이 7,816원, 23,215원, 38,614원으로 쌓인다',s+note('지어낸 경로입니다. 첫 바퀴는 아래 열 칸만, 둘째·셋째 바퀴는 스무 칸 모두 왕복합니다.',246)),caption:`첫 바퀴 뒤 실현 손익은 ${won(cum[0])}원이고, 스무 칸이 한 바퀴 돌 때마다 15,399원이 더해져 세 바퀴 뒤 ${won(cum[2])}원이 됩니다.`};
};
F.rally=()=>{
 const d=UP(),p=d.flat(),g=M.simulate({days:d,levels:LV,qty:5,start:'filled'}),h=M.buyHold(d,g.capital),k=g.series.findIndex(x=>x.price>22000);
 const {s:base,X,Y}=plot(p,{lo:19400,hi:25400});
 const s=base+`<path class="fig-dash" d="M${X(k)} 30V210" stroke="var(--orange)" stroke-width="1.5"/>`+t(X(k)+6,44,`${g.series[k].day+1}거래일째 범위 위로`,{a:'start',size:12,fill:'var(--orange)',w:700})+t(600,70,`보유 ${plus(h.pnl)}원`,{a:'end',size:13,fill:'var(--blue)',w:700})+t(600,90,`격자 ${plus(g.pnl)}원`,{a:'end',size:13,fill:'var(--accent)',w:700});
 return {svg:svg('20,000원에서 24,950원까지 오르는 30거래일 가상 경로. 11거래일째 범위 위로 빠져나간 뒤 격자는 현금만 들고 쉬고, 보유 489,753원 대 격자 105,927원',s+note('채워서 시작. 가로축은 시간(30거래일)입니다.',246)),caption:`가격이 범위 위로 빠져나간 뒤 격자는 모든 칸을 판 채 쉬었습니다. 끝에 격자는 ${won(g.pnl)}원, 같은 돈으로 들고만 있었다면 ${won(h.pnl)}원입니다.`};
};
F.slide=()=>{
 const d=DOWN(),r=M.simulate({days:d,levels:LV,qty:5}),{s:base,Y}=plot(d.flat(),{lo:15400,hi:22200});
 const s=base+`<path class="fig-dash" d="M70 ${Y(r.avgCost)}H600" stroke="var(--orange)" stroke-width="1.5"/>`+t(600,Y(r.avgCost)-6,`평균 단가 ${won(r.avgCost)}원`,{a:'end',size:12,fill:'var(--orange)',w:700})+t(600,200,`끝: ${r.heldCells}칸 ${r.shares}주 · 평가 ${won(r.unrealized)}원`,{a:'end',size:12,w:700});
 return {svg:svg('20,000원에서 15,690원까지 내려가는 30거래일 가상 경로. 끝에 열두 칸 60주를 들고 평균 단가 19,100원, 평가 손익 −204,766원',s+note('빈손 시작. 최고가 20,400원 위의 여덟 칸은 주문이 한 번도 걸리지 않았습니다.',246)),caption:`내려가는 동안 칸이 하나씩 차서 끝에 ${r.heldCells}칸 ${r.shares}주가 남았습니다. 실현 손익 ${plus(r.realized)}원에 평가 손익 ${won(r.unrealized)}원을 더하면 ${won(r.pnl)}원입니다.`};
};
root.GFigures={render:id=>F[id]?F[id]():null,F,kit:{M,won,plus,svg,t,note,up,LV,BOX,UP,DOWN,FINAL,SWING,plot}};
})(typeof window!=='undefined'?window:this);
/* 8~13장 그림. 위 블록의 도구(kit)를 그대로 쓴다. */
(function(root){
'use strict';
const {F,kit}=root.GFigures,{M,won,plus,svg,t,note,up,LV,DOWN,FINAL,UP,plot}=kit;
F.gap=()=>{
 const r=M.simulate({days:[[19900,19950],[19500,19900]],levels:LV,qty:5}),P=[19900,19950,19500,19900],X=[90,250,390,560],Y=v=>210-(v-19300)/800*170;
 let s=[19400,19600,19800,20000].map(v=>`<path d="M60 ${Y(v)}H600" stroke="var(--accent)" stroke-opacity=".4" stroke-dasharray="2 3"/>`+t(54,Y(v)+4,won(v),{a:'end',size:11,fill:'var(--muted)'})).join('');
 s+=`<path d="M320 30V215" stroke="var(--line)" stroke-dasharray="4 4"/>`+t(170,26,'첫날',{size:12,fill:'var(--muted)'})+t(470,26,'다음 날',{size:12,fill:'var(--muted)'});
 s+=`<path class="fig-draw" d="M${X[0]} ${Y(P[0])}L${X[1]} ${Y(P[1])}" stroke="var(--text)" stroke-width="2.4" fill="none"/><path class="fig-dash" d="M${X[1]} ${Y(P[1])}L${X[2]} ${Y(P[2])}" stroke="var(--orange)" stroke-width="1.5" fill="none"/><path class="fig-draw" d="M${X[2]} ${Y(P[2])}L${X[3]} ${Y(P[3])}" stroke="var(--text)" stroke-width="2.4" fill="none"/>`;
 s+=`<circle class="fig-pulse" cx="${X[2]}" cy="${Y(19500)}" r="6" fill="var(--blue)"/>`+t(X[2],Y(19500)+22,'● 19,800 · 19,600 매수 → 시가 19,500원에 체결',{size:12,fill:'var(--blue)',w:700})+t(320,Y(19700),'갭',{size:13,fill:'var(--orange)',w:700});
 const sell=r.fills.find(f=>f.side==='sell');s+=`<rect x="${X[3]-40}" y="${Y(sell.price)-4}" width="8" height="8" fill="var(--orange)"/>`+t(X[3]-46,Y(sell.price)-8,`■ 19,600원 칸 ${won(sell.price)}원에 매도`,{a:'end',size:12,fill:'var(--orange)',w:700});
 return {svg:svg('첫날 19,950원으로 끝나고 다음 날 시가 19,500원에 열려 19,800원과 19,600원 매수 주문이 모두 19,500원에 체결되고, 19,800원에서 19,600원 칸이 팔리는 그림',s,240),caption:`시가가 걸려 있던 지정가 아래에서 열리면 두 매수 주문이 모두 시가 19,500원에 체결됩니다. 19,600원 칸은 칸의 매도가 19,800원에 팔려 ${won(r.realized)}원을 남겼습니다.`};
};
F.ledger=()=>{
 const r=M.simulate({days:DOWN(),levels:LV,qty:5}),v=r.shares*r.last,Y=v2=>220-v2/2.2e6*190;
 let s=`<path d="M60 220H600" stroke="var(--line)"/>`;
 s+=up(130,Y(r.cash),110,220-Y(r.cash),'var(--blue)')+up(130,Y(r.cash+v),110,Y(r.cash)-Y(r.cash+v),'var(--accent)',.2)+t(185,Y(r.cash)+(220-Y(r.cash))/2,`현금 ${won(r.cash)}`,{size:12,fill:'var(--bg)',w:700})+t(185,Y(r.cash+v)+(Y(r.cash)-Y(r.cash+v))/2,`주식 ${won(v)}`,{size:12,fill:'var(--bg)',w:700});
 s+=up(400,Y(r.capital),110,220-Y(r.capital),'var(--panel2)',.4)+`<rect x="400" y="${Y(r.capital)}" width="110" height="${Y(r.capital+r.realized+r.unrealized)-Y(r.capital)}" fill="var(--orange)" opacity=".45"/>`+t(455,Y(r.capital)-8,`시작 자금 ${won(r.capital)}`,{size:12,w:700})+t(455,Y(r.capital)+34,`실현 ${plus(r.realized)}`,{size:12})+t(455,Y(r.capital)+52,`평가 ${won(r.unrealized)}`,{size:12});
 s+=`<path class="fig-dash" d="M130 ${Y(r.cash+v)}H510" stroke="var(--text)" stroke-width="1.5"/>`+t(320,Y(r.cash+v)-8,`= ${won(r.cash+v)}원`,{size:13,w:700});
 return {svg:svg('하락 경로 끝 장부. 현금 866,096원과 주식 평가액 941,400원의 합 1,807,496원이 시작 자금 1,990,289원에 실현 21,973원과 평가 −204,766원을 더한 값과 같다',s,240),caption:`현금과 주식 평가액을 더한 ${won(r.cash+v)}원은 시작 자금에 실현 손익과 평가 손익을 더한 값과 원 단위까지 같습니다.`};
};
F.capital=()=>{
 const qs=[5,6,7,8],Y=v=>210-v/3.6e6*180;
 let s=`<path d="M60 210H600" stroke="var(--line)"/><path class="fig-dash" d="M60 ${Y(3e6)}H600" stroke="var(--orange)" stroke-width="1.5"/>`+t(600,Y(3e6)-6,'한도 300만 원',{a:'end',size:12,fill:'var(--orange)',w:700});
 qs.forEach((q,i)=>{const b=M.gridBudget(LV,q),over=b>3e6;s+=up(90+i*130,Y(b),90,210-Y(b),over?'var(--orange)':'var(--accent)',i*.2)+t(135+i*130,Y(b)-8,`${won(b)}${over?' ✗':' ✓'}`,{size:12,w:700})+t(135+i*130,228,`칸당 ${q}주`,{size:12})+t(135+i*130,244,`16,000원 손실 ${won(M.lossAt(LV,q,16000).loss)}`,{size:11,fill:'var(--muted)'});});
 return {svg:svg('칸당 5주 1,990,289원, 6주 2,388,349원, 7주 2,786,408원은 300만 원 안이고 8주 3,184,468원은 넘는다. 16,000원 최악 손실도 수량에 비례해 커진다',s,256),caption:'300만 원 안에 들어오는 가장 큰 칸당 수량은 7주입니다. 수량을 늘리면 최악의 손실도 같은 비율로 커져, 손실 비율은 어느 수량이든 약 19.8%입니다.'};
};
F.compare=()=>{
 const cap=M.gridBudget(LV,5),o={parts:6,every:5},b={weight:50,every:5},Y=v=>120-v/5e5*90;
 const sets=[['오르는 길',UP(),'filled'],['내리는 길',DOWN(),'empty']].map(([n,d,st])=>[n,[M.simulate({days:d,levels:LV,qty:5,start:st}).pnl,M.buyHold(d,cap).pnl,M.periodic(d,cap,undefined,o).pnl,M.rebalance(d,cap,undefined,b).pnl]]);
 const names=['격자','보유','적립식','리밸런싱'],colors=['var(--accent)','var(--blue)','var(--orange)','var(--muted)'];
 let s=`<path d="M60 120H600" stroke="var(--text)"/>`;
 sets.forEach(([n,v],g)=>{s+=t(190+g*270,236,n,{size:13,w:700});v.forEach((x,i)=>{const X0=90+g*270+i*52,y=x>=0?Y(x):120;s+=up(X0,y,40,Math.abs(Y(x)-120),colors[i],i*.1)+t(X0+20,x>=0?y-6:Y(x)+14,`${names[i]}`,{size:10,fill:'var(--muted)'});});});
 return {svg:svg('같은 1,990,289원으로 오르는 길에서는 보유 489,753원이 가장 크고 격자 105,927원이 가장 작으며, 내리는 길에서는 보유 −426,987원이 가장 크게 잃고 격자 −182,793원이 가장 적게 잃는 막대',s+note('가운데 선이 0원입니다. 막대 위아래 글자가 방법 이름입니다.',252),262),caption:`오르는 길에서는 보유(${plus(sets[0][1][1])}원)가, 내리는 길에서는 격자(${won(sets[1][1][0])}원)가 앞섭니다. 어떤 길에서 어느 방법이 앞서는지를 보여 주는 지도이지 결론이 아닙니다.`};
};
F.exit=()=>{
 const d=DOWN(),a=M.simulate({days:d,levels:LV,qty:5,stop:{below:17500}}),w=M.simulate({days:d,levels:LV,qty:5}),{s:base,X,Y}=plot(d.flat(),{lo:15400,hi:22200});
 const s=base+`<path class="fig-dash" d="M70 ${Y(17500)}H600" stroke="var(--orange)" stroke-width="1.5"/>`+t(600,Y(17500)-6,'멈춤 가격 17,500원',{a:'end',size:12,fill:'var(--orange)',w:700})+`<circle class="fig-pulse" cx="${X(a.stopped.t)}" cy="${Y(17500)}" r="6" fill="var(--orange)"/>`+t(X(a.stopped.t),Y(17500)+22,`${a.series[a.stopped.t].day+1}거래일째 모두 팔고 멈춤 · ${won(a.pnl)}원`,{size:12,fill:'var(--orange)',w:700})+t(600,206,`끝까지 기다리면 ${won(w.pnl)}원`,{a:'end',size:12,w:700});
 return {svg:svg('하락 경로에서 17,500원에 닿으면 모두 팔고 멈추는 규칙. 16거래일째 멈춰 손익 −76,449원, 끝까지 기다리면 −182,793원',s+note('규칙은 범위를 벗어나기 전에 숫자로 적어 둡니다.',246)),caption:`17,500원 멈춤 규칙은 ${a.series[a.stopped.t].day+1}거래일째 손익을 ${won(a.pnl)}원으로 확정해, 끝까지 기다린 ${won(w.pnl)}원보다 ${won(a.pnl-w.pnl)}원 덜 잃습니다.`};
};
F.final=()=>{
 const d=FINAL(),r=M.simulate({days:d,levels:LV,qty:5}),{s:base,X,Y}=plot(d.flat(),{lo:16000,hi:22200});
 let s=base;[1,2,3,4,5].forEach(m=>{s+=`<path d="M${X(m*160)} 30V210" stroke="var(--line)" stroke-dasharray="3 4"/>`;});
 [0,1,2,3,4,5].forEach(m=>{s+=t(X(m*160+80),226,`${m+1}달째`,{size:11,fill:'var(--muted)'});});
 s+=`<circle class="fig-pulse" cx="${X(640)}" cy="${Y(18400)}" r="6" fill="var(--orange)"/>`+t(X(640)+8,Y(18400)+20,'5달째 첫날 시가 18,400원 · 일곱 칸 체결',{a:'start',size:12,fill:'var(--orange)',w:700})+t(600,44,`끝 장부의 합 ${won(r.pnl)}원`,{a:'end',size:13,w:700});
 return {svg:svg('120거래일 6개월 가상 경로. 넉 달은 박스권, 다섯째 달 첫날 18,400원 갭 뒤 범위 아래로 빠지고 여섯째 달은 옆으로 간다. 끝 장부의 합 −125,006원',s+note('넉 달 동안 +77,967원이던 장부가 마지막 두 달에 뒤집힙니다.',248)),caption:`넉 달 동안 132번 왕복해 쌓은 장부가 다섯째 달 갭과 하락으로 뒤집혀, 120거래일 끝에 합 ${won(r.pnl)}원이 되었습니다. 들고 있는 주식은 ${r.shares}주입니다.`};
};
})(typeof window!=='undefined'?window:this);
