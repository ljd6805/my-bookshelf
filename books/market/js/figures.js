/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자가 있는 그림은 MMath(js/math.js)로 새벽전자(전일 종가 19,950원)의 값을 실제로 계산해 그린다.
   움직임은 style.css의 fig-* 애니메이션(fig-dash·fig-pkt·fig-seq·fig-grow·fig-pulse)이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   9장 달력과 11장 시간표는 미리 정한 예시이고, 1장 권리 지도와 2장 주문 경로는 개념 그림이다. */
(function(root){
'use strict';
const M=root.MMath||(typeof require==='function'?require('./math.js'):null);
const won=n=>Number(n).toLocaleString('ko-KR');
const svg=(label,body,h=260)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||14}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const arrow=(x1,y,x2,stroke='var(--muted)')=>line(`M${x1} ${y}H${x2}`,stroke)+`<path d="M${x2-7} ${y-5}L${x2} ${y}L${x2-7} ${y+5}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay)=>`<g class="fig-seq" style="animation-delay:${delay}s">${body}</g>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const note=(s,y=248)=>t(320,y,s,{size:12,fill:'var(--muted)'});
const F={};
F.map=()=>{
 const cards=[['주식','회사의 한 조각을 소유','이익이 나면 몫이 커짐','var(--accent)'],['채권','회사에 돈을 빌려줌','약속한 이자와 원금','var(--blue)'],['펀드 · ETF','바구니에 맡김','누리200 = 여러 종목 묶음','var(--orange)'],['파생상품','미래 가격의 약속','기초자산 값에 따라 정산','var(--muted)']];
 let s='';
 cards.forEach(([n,a,b,c],i)=>{const x=20+(i%2)*310,y=20+Math.floor(i/2)*110;s+=box(x,y,290,92,c)+t(x+18,y+34,n,{a:'start',size:17,w:700,fill:c})+t(x+18,y+60,a,{a:'start',size:14})+t(x+18,y+80,b,{a:'start',size:12,fill:'var(--muted)'});});
 s+=blink(`<circle cx="320" cy="121" r="22" fill="var(--panel2)" stroke="var(--accent)" stroke-width="2"/>`+t(320,126,'증권',{size:13,w:700}),0);
 return {svg:svg('주식은 소유, 채권은 빌려준 돈, 펀드와 ETF는 맡긴 바구니, 파생상품은 약속이라는 네 칸 권리 지도',s+note('증권은 종이가 아니라 권리입니다. 무엇을 받을 권리인지가 칸을 가릅니다.',250)),caption:'증권 네 가지를 "무엇을 받을 권리인가"로 나눈 지도입니다. 새벽전자 주식은 소유, 누리200은 여러 종목을 담은 바구니입니다.'};
};
F.route=()=>{
 const st=[['하린의 앱','주문 입력'],['증권사','증거금 확인'],['거래소','KRX · NXT'],['체결','가격·수량 일치'],['예탁결제원','T+2 결제']].map(([a,b],i)=>[a,b,14+i*126]);
 let s='';
 st.forEach(([a,b,x],i)=>{const c=i===2?'var(--accent)':i===4?'var(--blue)':'var(--line)';s+=box(x,70,104,70,c)+t(x+52,100,a,{size:14,w:700})+t(x+52,122,b,{size:12,fill:'var(--muted)'});if(i<4)s+=arrow(x+106,105,x+123);});
 s+=dot(66,58,504,0,'var(--accent)',0,7)+t(70,40,'매수 10주 · 19,950원',{a:'start',size:12,fill:'var(--accent)'});
 s+=box(276,170,104,30,'var(--line)','none',6)+t(328,190,'두 시장 중 선택',{size:12,fill:'var(--muted)'})+line('M328 142V168','var(--line)','');
 return {svg:svg('주문이 하린의 앱에서 증권사의 증거금 확인을 거쳐 거래소 KRX나 넥스트레이드로 가서 체결되고, 이틀 뒤 예탁결제원에서 결제되는 경로',s+note('체결은 거래소에서, 돈과 주식이 실제로 바뀌는 결제는 이틀 뒤 예탁결제원에서 일어납니다.',240)),caption:'하린이 누른 매수 주문이 지나는 다섯 정거장입니다. 체결과 결제는 서로 다른 날, 다른 기관에서 일어납니다.'};
};
F.book=()=>{
 const L=M.ladder(19950,3),asks=[...L.up.slice(0,3)].reverse(),bids=[19950,...L.down.slice(-2).reverse()],aq=[320,410,150],bq=[800,560,240],y0=24,h=28;
 let s=t(150,18,'매도 수량',{size:12,fill:'var(--muted)'})+t(320,18,'가격',{size:12,fill:'var(--muted)'})+t(490,18,'매수 수량',{size:12,fill:'var(--muted)'});
 asks.forEach((p,i)=>{const y=y0+i*h;s+=grow(250-aq[i]/4,y+5,aq[i]/4,h-10,'var(--blue)',.15*i)+t(240-aq[i]/4,y+20,aq[i],{a:'end',size:12})+box(270,y+2,100,h-4,'var(--blue)','var(--panel2)',4)+t(320,y+21,won(p),{size:14});});
 const gy=y0+3*h;s+=`<rect class="fig-pulse" x="270" y="${gy+4}" width="100" height="22" rx="4" fill="var(--orange)" fill-opacity=".18"/>`+t(320,gy+20,'스프레드 10원',{size:12,fill:'var(--orange)',w:700});
 bids.forEach((p,i)=>{const y=gy+30+i*h;s+=box(270,y+2,100,h-4,'var(--accent)','var(--panel2)',4)+t(320,y+21,won(p),{size:14})+grow(390,y+5,bq[i]/4,h-10,'var(--accent)',.15*i+.4)+t(400+bq[i]/4,y+20,bq[i],{a:'start',size:12});});
 s+=t(40,y0+50,'팔려는 쪽',{a:'start',size:13,fill:'var(--blue)',w:700})+t(40,gy+80,'사려는 쪽',{a:'start',size:13,fill:'var(--accent)',w:700});
 return {svg:svg('새벽전자 호가창. 위에는 19,960원부터 매도호가, 아래에는 19,950원부터 매수호가가 쌓이고 그 사이에 10원 스프레드가 있다',s+note('가장 싼 매도호가와 가장 비싼 매수호가 사이의 틈이 스프레드입니다.',250)),caption:'새벽전자 호가창입니다. 매도호가는 위, 매수호가는 아래에 쌓이고, 19,960원과 19,950원 사이 한 칸(10원)이 스프레드입니다.'};
};
F.queue=()=>{
 const r=M.queueFill(800,10,810);
 let s=t(30,40,'19,950원 매수 줄',{a:'start',size:14,w:700})+t(30,60,'가격이 같으면 먼저 온 주문이 먼저 체결됩니다',{a:'start',size:12,fill:'var(--muted)'});
 const q=[['A','300주'],['B','200주'],['C','300주'],['하린','10주']];
 q.forEach(([n,v],i)=>{const x=150+i*110,me=n==='하린';s+=blink(box(x,90,96,56,me?'var(--accent)':'var(--line)')+t(x+48,114,n,{size:14,w:me?700:400})+t(x+48,134,v,{size:12,fill:'var(--muted)'}),.4+i*.5);});
 s+=box(20,90,100,56,'var(--blue)')+t(70,114,'매도 810주',{size:13,w:700})+t(70,134,'19,950원',{size:12,fill:'var(--muted)'})+arrow(122,118,146,'var(--blue)');
 s+=t(150,180,'← 앞에서부터 채움',{a:'start',size:12,fill:'var(--blue)'})+`<path d="M150 160H580" stroke="var(--line)"/>`;
 s+=t(320,210,`앞의 800주가 다 채워진 뒤에야 하린의 10주가 ${r.status}됩니다.`,{size:13});
 return {svg:svg('19,950원 매수 줄에 A, B, C 800주가 먼저 서 있고 하린의 10주가 맨 뒤에 있어, 매도 810주가 들어와야 하린까지 체결되는 그림',s+note('줄 앞의 수량을 알면 내 차례까지 필요한 매도 수량을 셀 수 있습니다.',245)),caption:`같은 19,950원이라도 줄에 선 순서가 있습니다. 매도가 ${won(r.need)}주 들어와야 맨 뒤 하린의 10주까지 체결됩니다.`};
};
F.auction=()=>{
 const buys=[[20000,30],[19990,40],[19980,50],[19960,40]],sells=[[19950,20],[19960,30],[19970,40],[19990,50],[20000,40]],A=M.auction(buys,sells,19950);
 const P=A.table.map(r=>r.price),x=p=>110+(p-19950)/50*440,y=v=>210-v/200*170;
 const step=(key)=>A.table.map((r,i)=>{const x0=x(r.price)-44,x1=x(r.price)+44;return `${i?'L':'M'}${x0} ${y(r[key])}H${x1}`;}).join('');
 let s=`<path d="M60 210H600M60 30V210" stroke="var(--line)"/>`+[0,100,200].map(v=>t(52,y(v)+4,v,{a:'end',size:11,fill:'var(--muted)'})).join('');
 P.forEach(p=>{s+=t(x(p),228,won(p),{size:11,fill:'var(--muted)'});});
 s+=`<path class="fig-draw" d="${step('demand')}" fill="none" stroke="var(--accent)" stroke-width="3"/>`+`<path class="fig-draw" d="${step('supply')}" fill="none" stroke="var(--blue)" stroke-width="3" stroke-dasharray="6 4"/>`;
 const b=A.best;s+=`<rect class="fig-pulse" x="${x(b.price)-44}" y="30" width="88" height="180" fill="var(--orange)" fill-opacity=".14"/>`+t(x(b.price),24,`체결가 ${won(b.price)}원 · ${b.volume}주`,{size:13,fill:'var(--orange)',w:700});
 s+=t(590,y(160)+4,'누적 매수',{a:'end',size:12,fill:'var(--accent)'})+t(590,y(180)-8,'누적 매도',{a:'end',size:12,fill:'var(--blue)'});
 return {svg:svg(`누적 매수 계단은 가격이 오를수록 내려가고 누적 매도 계단은 올라가며, 체결 수량이 가장 많은 ${won(b.price)}원에서 ${b.volume}주가 한꺼번에 체결되는 단일가 그림`,s+note('세로축: 그 가격에서 체결될 수 있는 누적 수량(주)',250)),caption:`주문을 모았다가 한 가격에 체결하는 단일가 매매입니다. 두 계단이 겹쳐 가장 많이 체결되는 ${won(b.price)}원에서 ${b.volume}주가 한꺼번에 체결됩니다(같은 수량이면 기준가에 가까운 쪽).`};
};
F.tick=()=>{
 const prices=[19980,19990,20000,20050,20100],x=p=>50+(p-19970)/130*540;
 let s=`<path d="M40 120H610" stroke="var(--line)" stroke-width="2"/>`;
 prices.forEach((p,i)=>{const v=M.isValidPrice(p);s+=`<path d="M${x(p)} 90V150" stroke="${p>=20000?'var(--accent)':'var(--blue)'}" stroke-width="3"/>`+t(x(p),p===19990?196:176,won(p),{size:13,w:p===20000?700:400});});
 s+=t(x(19985),78,'10원',{size:12,fill:'var(--blue)'})+t(x(19995),78,'10원',{size:12,fill:'var(--blue)'})+t(x(20025),78,'50원',{size:12,fill:'var(--accent)',w:700})+t(x(20075),78,'50원',{size:12,fill:'var(--accent)',w:700});
 s+=`<path d="M${x(20000)} 40V200" stroke="var(--orange)" stroke-dasharray="4 4"/>`+t(x(20000),32,'2만 원 경계',{size:12,fill:'var(--orange)'});
 s+=blink(`<circle cx="${x(20030)}" cy="120" r="7" fill="none" stroke="var(--orange)" stroke-width="2"/>`+t(x(20030),208,'20,030원 ✕ 놓을 수 없는 가격',{size:12,fill:'var(--orange)'}),.3);
 s+=t(30,232,'2만 원 미만 10원 · 2만~5만 원 50원 (2023년부터 코스피·코스닥 공통)',{a:'start',size:12,fill:'var(--muted)'});
 return {svg:svg('19,980원과 19,990원 사이는 10원이지만 20,000원을 넘으면 20,050원, 20,100원처럼 눈금이 50원으로 넓어지는 가격 사다리',s,250),caption:`새벽전자 가격 사다리입니다. 2만 원 아래는 10원씩, 위는 50원씩 놓을 수 있어서 20,030원 주문은 받지 않습니다(${M.isValidPrice(20030)?'유효':'유효하지 않음'}).`};
};
F.limits=()=>{
 const L=M.priceLimits(19950),x=p=>60+(p-12000)/16000*520;
 let s=`<rect x="${x(L.lower)}" y="90" width="${x(L.upper)-x(L.lower)}" height="40" rx="6" fill="var(--accent)" fill-opacity=".14" stroke="var(--accent)" stroke-width="2"/>`;
 s+=`<rect class="fig-pulse" x="${x(19950*.9)}" y="94" width="${x(19950*1.1)-x(19950*.9)}" height="32" rx="4" fill="var(--blue)" fill-opacity=".16"/>`;
 s+=`<path d="M${x(19950)} 70V130" stroke="var(--text)" stroke-width="2"/>`+t(x(19950),62,'기준가 19,950',{size:13,w:700});
 s+=t(x(L.upper),160,`상한가 ${won(L.upper)}`,{size:13,fill:'var(--accent)',w:700})+t(x(L.lower),160,`하한가 ${won(L.lower)}`,{size:13,fill:'var(--accent)',w:700});
 s+=t(x(L.upper),178,`+${L.upPct.toFixed(1)}%`,{size:11,fill:'var(--muted)'})+t(x(L.lower),178,`${L.downPct.toFixed(1)}%`,{size:11,fill:'var(--muted)'});
 s+=t(x(19950),148,'정적 VI ±10%',{size:12,fill:'var(--blue)'});
 s+=box(200,196,240,32,'var(--orange)')+blink(t(320,217,'VI 발동 → 2분 단일가로 멈춤',{size:13,fill:'var(--orange)',w:700}),0);
 return {svg:svg(`기준가 19,950원에서 상한가 ${won(L.upper)}원과 하한가 ${won(L.lower)}원 사이의 하루 가격 띠와, 그 안쪽 ±10% 정적 VI 구간에서 2분 단일가로 멈추는 표시`,s+note('하루 동안 움직일 수 있는 가격은 기준가의 ±30% 띠 안입니다.',250)),caption:`기준가 19,950원의 ±30%를 호가단위에 맞추면 상한가 ${won(L.upper)}원, 하한가 ${won(L.lower)}원입니다. 그 안에서 급하게 움직이면 VI가 걸려 2분 동안 단일가로 모읍니다.`};
};
F.events=()=>{
 const R=M.rightsBase(19950,1,0),x0=60,x1=320,x2=590,y=v=>220-(v-8000)/14000*180;
 let s=`<path d="M40 220H610" stroke="var(--line)"/>`+[10000,15000,20000].map(v=>t(36,y(v)+4,won(v),{a:'end',size:11,fill:'var(--muted)'})).join('');
 s+=`<path class="fig-draw" d="M${x0} ${y(19950)}H${x1}V${y(R.base)}H${x2}" fill="none" stroke="var(--accent)" stroke-width="3"/>`;
 s+=t(190,y(19950)-10,'전일 종가 19,950원',{size:13})+t(455,y(R.base)-10,`권리락 기준가 ${won(R.base)}원`,{size:13,fill:'var(--accent)',w:700});
 s+=`<path d="M${x1} 30V220" stroke="var(--orange)" stroke-dasharray="4 4"/>`+t(x1,26,'권리락일',{size:12,fill:'var(--orange)'});
 s+=t(190,238,'주식 1주',{size:12,fill:'var(--muted)'})+t(455,238,'주식 2주 (무상증자 1:1)',{size:12,fill:'var(--muted)'});
 return {svg:svg(`무상증자 1주당 1주 권리락일에 기준가가 19,950원에서 ${won(R.base)}원으로 한 계단 내려가는 그림`,s+note('주식 수가 두 배가 되어 기준가가 절반이 될 뿐, 하린의 몫은 그대로입니다.',262),268),caption:`1주당 1주 무상증자의 권리락일에는 기준가가 19,950 ÷ 2 = 9,975원을 호가단위로 맞춘 ${won(R.base)}원으로 내려갑니다. 가격이 떨어진 것이 아니라 주식이 나뉜 것입니다.`};
};
F.settle=()=>{
 const T='2026-10-15',S=M.addBusinessDays(T,2),days=['월','화','수','목','금','토','일','월','화'];
 let s='';
 days.forEach((d,i)=>{const x=24+i*66,date=12+i,key=`2026-10-${date}`,we=i===5||i===6,tag=key===T?'T 체결':key===M.addBusinessDays(T,1)?'T+1':key===S?'T+2 결제':'';
  const c=tag.startsWith('T+2')?'var(--blue)':tag==='T 체결'?'var(--accent)':tag?'var(--muted)':'var(--line)';
  s+=box(x,60,58,80,c,we?'none':'var(--panel2)',6)+t(x+29,84,d,{size:13,fill:we?'var(--muted)':'var(--text)'})+t(x+29,112,`10/${date}`,{size:12,fill:'var(--muted)'});
  if(tag)s+=blink(t(x+29,164,tag,{size:13,w:700,fill:c}),i*.2);if(we)s+=t(x+29,132,'휴장',{size:11,fill:'var(--muted)'});});
 s+=dot(24+3*66+29,40,4*66,0,'var(--accent)',0,6);
 return {svg:svg(`2026년 10월 15일 목요일에 체결한 주문이 금요일 T+1을 지나 주말을 건너뛰고 ${S.slice(5).replace('-','월 ')}일 월요일 T+2에 결제되는 달력`,s+note('결제일은 달력 날짜가 아니라 영업일로 셉니다. 공휴일도 건너뜁니다.',220),240),caption:`목요일(10월 15일)에 체결하면 금요일이 T+1, 주말을 건너뛴 월요일(${S.slice(5).replace('-','월 ')}일)이 T+2 결제일입니다. 예시 날짜이며 공휴일은 따로 확인해야 합니다.`};
};
F.cost=()=>{
 const R=M.roundTrip(19950,20000,10),k=440/R.gross;
 let s=t(20,40,'19,950원에 10주 사서 20,000원에 팔면',{a:'start',size:14,w:700});
 s+=t(110,90,'차익',{a:'end',size:13})+grow(120,74,R.gross*k,24,'var(--accent)')+t(130+R.gross*k,91,`${won(R.gross)}원`,{a:'start',size:13,w:700});
 const parts=[['매수 수수료',R.buyFee,'var(--blue)'],['매도 수수료',R.sellFee,'var(--blue)'],['거래세',R.tax,'var(--orange)']];let x=120;
 s+=t(110,140,'비용',{a:'end',size:13});parts.forEach(([n,v,c],i)=>{s+=grow(x,124,v*k,24,c,.3+i*.3);x+=v*k;});s+=t(x+10,141,`${won(R.costs)}원`,{a:'start',size:13,w:700});
 s+=t(120,170,`수수료 ${R.buyFee}+${R.sellFee} · 거래세 ${R.tax}`,{a:'start',size:12,fill:'var(--muted)'});
 s+=t(110,210,'남는 돈',{a:'end',size:13})+grow(120,194,Math.max(R.net*k,2),24,'var(--accent)',1.2)+t(130+R.net*k,211,`${won(R.net)}원`,{a:'start',size:13,w:700,fill:'var(--accent)'});
 return {svg:svg(`차익 ${R.gross}원 가운데 수수료 ${R.buyFee + R.sellFee}원과 거래세 ${R.tax}원을 빼면 ${R.net}원만 남는 왕복 비용 막대`,s+note('가정: 수수료 매수·매도 각 0.015%, 증권거래세 매도 금액의 0.2%, 원 미만 버림',248)),caption:`50원 오른 차익 ${won(R.gross)}원에서 왕복 비용 ${won(R.costs)}원을 빼면 ${won(R.net)}원이 남습니다. 비용의 대부분은 팔 때 내는 거래세입니다.`};
};
F.hours=()=>{
 const x=h=>60+(h-8)/12*560,seg=(a,b,y,label,c,op=.22)=>`<rect x="${x(a)}" y="${y}" width="${x(b)-x(a)}" height="34" rx="4" fill="${c}" fill-opacity="${op}" stroke="${c}"/>`+(x(b)-x(a)>40?t((x(a)+x(b))/2,y+22,label,{size:12}):'');
 let s=[8,9,10,12,14,15.5,16,20].map(h=>`<path d="M${x(h)} 40V170" stroke="var(--line)" stroke-dasharray="2 4"/>`+t(x(h),188,`${Math.floor(h)}:${h%1?'30':'00'}`,{size:11,fill:'var(--muted)'})).join('');
 s+=t(50,82,'KRX',{a:'end',size:13,w:700})+seg(8.5,9,60,'',`var(--muted)`)+seg(9,15+20/60,60,'정규장 09:00~15:30','var(--accent)')+seg(15+20/60,15.5,60,'','var(--orange)',.5)+seg(15+40/60,16,60,'','var(--muted)')+seg(16,20,60,'애프터마켓 16:00~20:00','var(--accent)',.12);
 s+=t(50,142,'NXT',{a:'end',size:13,w:700})+seg(8,8+50/60,120,'프리마켓','var(--blue)')+seg(9,15+20/60,120,'메인마켓','var(--blue)',.3)+seg(15+40/60,20,120,'애프터마켓 15:40~20:00','var(--blue)');
 s+=t(x(8.75),54,'장전 단일가',{size:11,fill:'var(--muted)'})+t(x(15.42),54,'마감 단일가',{size:11,fill:'var(--orange)'});
 return {svg:svg('오전 8시부터 저녁 8시까지 한국거래소는 정규장·시간외 종가·애프터마켓, 넥스트레이드는 프리마켓·메인마켓·애프터마켓으로 나뉘는 하루 시간표',s+note('같은 새벽전자도 시간에 따라 거래할 수 있는 시장과 방식이 다릅니다. 세부 시각은 본문 표를 따릅니다.',222),236),caption:'하루 동안 두 시장이 여는 시간을 겹쳐 본 그림입니다. 오전 8시대에는 넥스트레이드에서만 연속 매매가 열립니다. 2026년 9월 14일부터는 거래소도 16:00~20:00 애프터마켓을 열어 저녁에는 두 시장이 함께 거래합니다(거래소 애프터마켓은 ETF 제외).'};
};
F.protect=()=>{
 const st=[['투자주의','알림만 붙음',''],['투자경고','신용 매수 제한 등',''],['투자위험','더 강한 제한',''],['거래정지','매매 멈춤','']];
 let s='';
 st.forEach(([a,b],i)=>{const x=30+i*150,y=140-i*32,c=i===3?'var(--orange)':'var(--accent)';s+=blink(`<rect x="${x}" y="${y}" width="130" height="${210-y}" rx="6" fill="${c}" fill-opacity="${.12+i*.1}" stroke="${c}" stroke-width="2"/>`+t(x+65,y+24,a,{size:15,w:700})+t(x+65,y+44,b,{size:12,fill:'var(--muted)'}),i*.5);if(i<3)s+=arrow(x+132,y-6,x+148,'var(--muted)');});
 s+=`<path d="M30 210H610" stroke="var(--line)"/>`+t(30,232,'과열이 이어질수록 한 단계씩 올라가고, 조건이 풀리면 내려옵니다',{a:'start',size:12,fill:'var(--muted)'});
 return {svg:svg('투자주의에서 투자경고, 투자위험, 거래정지로 한 단계씩 올라가는 시장경보 사다리',s,250),caption:'가격이 짧은 기간에 지나치게 오르면 거래소가 경보를 단계별로 올립니다. 단계가 높을수록 매매에 붙는 제한이 강해집니다.'};
};
F.final=()=>{
 const G=M.gridSheet(19970,30,6,10);
 let s=t(20,30,'하린의 격자 주문표 · 30원 간격 · 10주씩',{a:'start',size:14,w:700});
 G.forEach((c,i)=>{const x=20+i*102,ok=M.isValidPrice(c.buy),col=ok?'var(--accent)':'var(--orange)';
  s+=box(x,56,94,70,col,ok?'var(--panel2)':'none',6)+t(x+47,86,won(c.buy),{size:14,w:700})+t(x+47,110,ok?'접수':'✕ 거부',{size:13,fill:col,w:ok?400:700});
  if(!ok)s+=`<path d="M${x+8} 64L${x+86} 118" stroke="var(--orange)" stroke-width="1.5" opacity=".5"/>`;});
 s+=t(20,160,'2만 원 위에서는 50원 눈금에 맞는 가격만 받습니다.',{a:'start',size:13});
 s+=t(20,186,`눈금에 맞는 첫 칸(19,970 → 20,000)도 30원 × 10주 = 300원 차익이 비용에 밀려 ${won(G[0].net)}원입니다.`,{a:'start',size:13,fill:'var(--orange)'});
 return {svg:svg('19,970원부터 30원 간격으로 놓은 격자 주문 가운데 19,970원과 20,000원만 접수되고 20,030원부터는 호가단위에 맞지 않아 거부되는 주문표',s+note('호가단위와 왕복 비용을 함께 넣어 격자를 다시 짜는 것이 마지막 과제입니다.',236),250),caption:`마지막 과제의 출발점입니다. 30원 간격 격자는 2만 원을 넘자마자 거부되고, 접수된 칸도 한 번 오가면 ${won(G[0].net)}원입니다.`};
};
function render(id){return F[id]?F[id]():null;}
root.MFigures={render};
})(typeof window!=='undefined'?window:this);
