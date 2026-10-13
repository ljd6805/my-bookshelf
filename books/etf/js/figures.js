/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 모두 EMath(js/math.js)로 실제로 계산해 그린다. 규칙 숫자는 EMath.RULES에서만 읽는다.
   가상 사례(새벽전자·A사·B사, 누리200·가람200·누리 해외100, 나라 3년)는 tests/math.test.cjs와 같은 정의다.
   움직임은 style.css의 fig-* 애니메이션이며 동작 줄이기에서 멈춘다. 색 말고도 막대마다 숫자와 이름표를 붙인다. */
(function(root){
'use strict';
const M=root.EMath||(typeof require==='function'?require('./math.js'):null);
const fx=(n,d=0)=>{const r=Number(Number(n).toFixed(d));return (r<0?'−':'')+Math.abs(r).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});};
const W=n=>fx(Math.round(n))+'원',P=(x,d=2)=>(x>0?'+':'')+fx(x*100,d)+'%',E=n=>fx(Math.round(n/1e8))+'억 원';
const svg=(label,body,h=260)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||13}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const up=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow fig-up" style="animation-delay:${delay}s" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(w,1).toFixed(1)}" height="${Math.max(h,1).toFixed(1)}" rx="2" fill="${color}"/>`;
const box=(x,y,w,h,stroke='var(--line)')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="var(--panel2)" stroke="${stroke}"/>`;
const S=[{price:20000,shares:1e7,float:.5},{price:50000,shares:2e6,float:.8},{price:10000,shares:1e7,float:1}];
const up10=S.map((s,i)=>({...s,price:s.price*(i===0?1.1:1)}));
/* 막대 묶음: items=[[이름, 값, 강조, 글]], 바닥 bottom. */
function bars(items,{x0=70,gap=140,bw=86,top=50,bottom=210,max}={}){
 const hi=max||Math.max(...items.map(i=>i[1]),1),Y=v=>bottom-v/hi*(bottom-top);let s=`<path d="M${x0-20} ${bottom}H${Math.min(620,x0+gap*items.length)}" stroke="var(--line)"/>`;
 items.forEach(([n,v,on,label],i)=>{const x=x0+i*gap;s+=up(x,Y(v),bw,bottom-Y(v),on?'var(--accent)':'var(--blue)',i*.2)+t(x+bw/2,Y(v)-8,(on?'▲ ':'')+(label||W(v)),{size:13,w:700})+t(x+bw/2,bottom+20,n,{size:12});});
 return s;
}
const F={};
F.index=()=>{
 const base=M.totalCap(S),today=M.totalCap(up10),lvl=M.indexLevel(today,base),after=today-1000e8+1500e8,fixed=M.rebase(base,today,after),jump=M.indexLevel(after,base);
 let s=bars([['새벽전자',2200e8,true,'2,200억'],['A사',1000e8,false,'1,000억'],['B사',1000e8,false,'1,000억'],['합',today,true,fx(today/1e8)+'억']],{x0:50,gap:120,bw:80,max:today,top:56,bottom:200});
 s+=`<path d="M${50+3*120-10} ${(200-base/today*144).toFixed(1)}H${50+3*120+90}" stroke="var(--orange)" stroke-dasharray="6 4"/>`+t(560,(200-base/today*144-6).toFixed(1),`┅ 기준 ${E(base)} = 100`,{size:12,a:'end'});
 s+=t(20,26,`지수 = ${fx(today/1e8)}억 ÷ ${fx(base/1e8)}억 × 100 = ${fx(lvl,2)}`,{size:14,w:700,a:'start'})+t(20,44,`B사 → C사(1,500억): 기준을 약 ${E(fixed)}으로 고치면 ${fx(M.indexLevel(after,fixed),2)}, 그대로면 ${fx(jump,2)}`,{size:12,a:'start',fill:'var(--muted)'});
 return {svg:svg(`세 종목 지수: 합 ${E(today)}, 기준 ${E(base)}, 지수 ${fx(lvl,2)}`,s,240),caption:`기준일 세 종목 합 ${E(base)}을 100으로 두고, 새벽전자만 10% 오르면 합이 ${E(today)}이 되어 지수는 ${fx(lvl,2)}입니다. 이날 B사를 C사(1,500억 원)로 바꾸면 기준 시가총액을 약 ${E(fixed)}으로 고쳐 ${fx(M.indexLevel(after,fixed),2)}을 잇고, 고치지 않으면 ${fx(jump,2)}로 뜁니다.`};
};
F.weight=()=>{
 const r=[.1,-.05,0],ms=[['cap','시가총액'],['float','유동시가총액'],['equal','동일']],w=ms.map(([m])=>M.weights(S,m)),ret=w.map(x=>M.indexReturn(x,r)),cols=['var(--accent)','var(--blue)','var(--orange)'];
 let s=t(20,24,'세 종목 비중(새벽전자 · A사 · B사)과 같은 하루(+10% · −5% · 0%)의 지수 수익률',{size:13,w:700,a:'start'});
 ms.forEach(([,n],k)=>{const y=52+k*58;let x=150;s+=t(140,y+22,n+' 가중',{size:12,a:'end'});w[k].forEach((v,i)=>{const ww=v*330;s+=`<rect class="fig-grow" style="animation-delay:${k*.2}s" x="${x.toFixed(1)}" y="${y}" width="${ww.toFixed(1)}" height="34" fill="${cols[i]}" fill-opacity=".8"/>`+t(x+ww/2,y+22,fx(v*100,v*100%1?2:0)+'%',{size:11,fill:'var(--bg)',w:700});x+=ww;});s+=t(620,y+22,`→ ${P(ret[k])}`,{size:14,w:700,a:'end'});});
 return {svg:svg(`세 가중 방식의 비중과 지수 수익률: ${ms.map(([,n],k)=>`${n} ${P(ret[k])}`).join(', ')}`,s,230),caption:`같은 하루(새벽전자 +10%, A사 −5%, B사 0%)를 시가총액 가중 ${w[0].map(v=>fx(v*100,0)+'%').join('·')}로 계산하면 ${P(ret[0])}, 유동시가총액 가중 ${w[1].map(v=>fx(v*100,2)+'%').join('·')}로는 ${P(ret[1])}, 동일 가중 33.33%씩으로는 ${P(ret[2])}입니다. 수익률 목록은 같고 비중 목록만 다릅니다.`};
};
F.creation=()=>{
 const r=M.createRedeem(3000e8,1e7,3),col=(x,title,u,a,n,on)=>box(x,60,170,130,on?'var(--accent)':'var(--line)')+t(x+85,84,title,{size:13,w:700})+t(x+85,114,fx(u/1e4)+'만 좌',{size:13})+t(x+85,140,E(a),{size:13})+t(x+85,166,'NAV '+W(n),{size:13,w:700});
 let s=col(20,'처음',1e7,3000e8,M.nav(3000e8,1e7))+col(450,'3 CU 설정 뒤',r.units,r.assets,r.nav,true);
 s+=`<path class="fig-draw" d="M196 112H444" stroke="var(--accent)" stroke-width="3"/>`+t(320,100,`AP가 바구니 ${E(3*M.CU*r.nav)}어치를 넣음`,{size:12})+t(320,134,`+${fx(3*M.CU)}좌 (CU ${fx(M.CU)}좌 × 3, 가정)`,{size:12,fill:'var(--muted)'});
 s+=t(320,222,'거래소에서 투자자끼리 사고팔면 좌수·순자산·NAV는 그대로',{size:12,fill:'var(--muted)'})+t(20,32,'설정은 좌수와 순자산을 함께 늘리고 1좌당 NAV는 바꾸지 않습니다',{size:13,w:700,a:'start'});
 return {svg:svg(`3 CU 설정: ${fx(r.units/1e4)}만 좌, ${E(r.assets)}, NAV ${W(r.nav)}`,s,240),caption:`순자산 3,000억 원, 1,000만 좌인 ETF의 1좌당 NAV는 ${W(M.nav(3000e8,1e7))}입니다. AP가 3 CU를 설정하면 ${E(3*M.CU*r.nav)}어치 바구니가 들어와 ${fx(r.units/1e4)}만 좌, ${E(r.assets)}이 되고 NAV는 ${W(r.nav)} 그대로입니다.`};
};
F.nav=()=>{
 const lp=M.gapScene({time:'10:30',index:303.6,lp:true,qty:100}),au=M.gapScene({time:'15:25',index:303.6,lp:true,qty:1000}),asks=M.askBook(au.inav,false),Y=p=>210-(p-au.inav)/(asks.at(-1)[0]-au.inav+120)*170;
 let s=`<path d="M60 ${Y(au.inav).toFixed(1)}H600" stroke="var(--accent)" stroke-width="2.5"/>`+t(600,(Y(au.inav)-6).toFixed(1),`━ iNAV ${W(au.inav)}`,{size:12,a:'end',w:700});
 s+=box(70,Y(lp.price)-14,170,26,'var(--accent)')+t(155,Y(lp.price)+4,`10:30 LP 매도 ${W(lp.price)}`,{size:12});
 asks.forEach(([p,q],i)=>{const on=i<4;s+=up(330,Y(p)-9,q/1000*150,18,on?'var(--orange)':'var(--blue)',i*.15)+t(320,Y(p)+5,`${fx(p)}`,{size:12,a:'end'})+t(330+q/1000*150+8,Y(p)+5,`${fx(q)}주${on?' ✓':''}`,{size:11,a:'start'});});
 s+=t(20,24,`LP 호가 있음: 100주 → ${W(lp.price)}, ${P(lp.gap)}   ·   15:25 LP 의무 면제: 1,000주 → ${W(au.price)}, ${P(au.gap)}`,{size:13,w:700,a:'start'});
 return {svg:svg(`괴리율: LP 호가가 있을 때 ${P(lp.gap)}, 15:25 단일가에서 ${P(au.gap)}`,s,230),caption:`누리200 지수 303.60이면 iNAV는 ${W(lp.inav)}입니다. LP가 호가를 내는 10:30에는 시장가 매수 100주가 ${W(lp.price)}에 체결되어 괴리율 ${P(lp.gap)}이고, LP 의무가 면제되는 15:25 단일가에서는 1,000주가 매도 호가 네 칸을 먹어 ${W(au.price)}, ${P(au.gap)}가 됩니다(가상 호가창). 이때 AP의 비용 전 차익은 1좌 ${W(au.ap.perUnit)}, CU 하나에 ${fx(au.ap.perCU/1e4)}만 원입니다.`};
};
F.cost=()=>{
 const g=M.costGap(1e7,.05,M.etfCost('nuri').total,M.etfCost('garam').total,10),c=M.etfCost('nuri'),X=y=>70+y*52,Y=v=>210-(v-1e7)/(g.b-1e7)*150;
 let s=`<path d="M70 210H600" stroke="var(--line)"/>`;const d=k=>[...Array(11).keys()].map(y=>`${y?'L':'M'}${X(y)} ${Y(M.grow(1e7,.05,M.etfCost(k).total,y)).toFixed(1)}`).join('');
 s+=`<path class="fig-draw" d="${d('garam')}" fill="none" stroke="var(--accent)" stroke-width="2.5"/><path class="fig-draw" d="${d('nuri')}" fill="none" stroke="var(--orange)" stroke-width="2.5" stroke-dasharray="6 4"/>`;
 s+=t(X(10)-6,Y(g.b)-8,`━ 가람200 ${W(g.b)}`,{size:12,a:'end',w:700})+t(X(10)-6,Y(g.a)+18,`┅ 누리200 ${W(g.a)}`,{size:12,a:'end',w:700})+t(70,228,'0년',{size:11})+t(X(10),228,'10년',{size:11});
 s+=t(20,24,`추적 괴리 7.80% − 8.00% = ${fx(M.trackingDiff(.078,.08)*100,2)}%p · 누리200 총비용 ${fx(c.total*100,2)}%(TER ${fx(c.ter*100,2)}%) · 가람200 ${fx(M.etfCost('garam').total*100,2)}%`,{size:12.5,w:700,a:'start'});
 return {svg:svg(`1,000만 원 10년(연 5% 가정): 누리200 ${W(g.a)}, 가람200 ${W(g.b)}, 차이 ${W(g.diff)}`,s,240),caption:`추적 괴리는 7.80% − 8.00% = ${fx(M.trackingDiff(.078,.08)*100,2)}%p입니다. 누리200의 TER은 ${fx(c.ter*100,2)}%, 총비용은 ${fx(c.total*100,2)}%이고 가람200은 ${fx(M.etfCost('garam').total*100,2)}%입니다. 1,000만 원을 10년 두고 비용 전 수익률을 연 5%로 놓으면 ${W(g.a)}과 ${W(g.b)}으로 ${W(g.diff)}이 벌어집니다.`};
};
F.leverage=()=>{
 const a=M.rebalance(100,2,.1),b=M.rebalance(100,2,-.1),k=v=>fx(v)+'억';
 let s=bars([['아침 노출',a.exposure,false,k(a.exposure)],['+10% 뒤',a.after,false,k(a.after)],['목표',a.target,true,k(a.target)],['−10% 뒤',b.after,false,k(b.after)],['목표',b.target,true,k(b.target)]],{x0:40,gap:118,bw:76,max:a.target,top:60,bottom:200});
 s+=t(20,24,`순자산 100억 원 2배: +10%인 날 ${k(a.trade)} 원어치 매수, −10%인 날 ${k(-b.trade)} 원어치 매도`,{size:13,w:700,a:'start'})+t(20,44,`재조정 매매 = 배수 × (배수 − 1) × 지수 수익률 × 순자산 · 가격제한폭 ±${fx(M.priceLimit(2)*100)}%`,{size:12,a:'start',fill:'var(--muted)'});
 return {svg:svg(`2배 재조정: 노출 ${k(a.exposure)} → ${k(a.after)} → 목표 ${k(a.target)}, ${k(b.after)} → 목표 ${k(b.target)}`,s,240),caption:`순자산 100억 원인 누리200 2배는 노출 ${fx(a.exposure)}억 원으로 시작합니다. 지수 +10%인 날 노출 ${fx(a.after)}억 원, 순자산 ${fx(a.nav)}억 원이 되어 목표 ${fx(a.target)}억 원에 맞추려고 ${fx(a.trade)}억 원어치를 사고, −10%인 날에는 ${fx(b.after)}억 원·${fx(b.nav)}억 원·${fx(b.target)}억 원이 되어 ${fx(-b.trade)}억 원어치를 팝니다.`};
};
F.assets=()=>{
 const k=Math.round(M.navFromIndex(303.6)),bm=M.bondMove(.03875,.03961,3,.01),f=M.foreignInav(12000,.01);
 const items=[['국내 주식 · 누리200',`지수 +1.2%`,`iNAV ${W(k)}`,'장중 지수로 계산'],['국채 · 누리 국채3년',`금리 +1%p`,`${fx(bm.p0,2)} → ${fx(bm.p1,2)}원`,`NAV 약 ${P(bm.change)}`],['해외 지수 · 누리 해외100',`환율 +1%`,`${W(12000)} → ${W(f)}`,'추정값(이 책의 단순화)']];
 let s=t(20,26,'기초자산이 다르면 iNAV를 계산하는 재료가 다릅니다',{size:13,w:700,a:'start'});
 items.forEach(([a,b,c,d],i)=>{const x=20+i*206;s+=box(x,50,190,150,i===2?'var(--orange)':'var(--line)')+t(x+95,76,a,{size:12.5,w:700})+t(x+95,110,b,{size:12,fill:'var(--muted)'})+t(x+95,140,c,{size:13,w:700})+t(x+95,170,d,{size:11.5,fill:'var(--muted)'});});
 return {svg:svg(`기초자산별 iNAV: 국내 ${W(k)}, 국채 ${P(bm.change)}, 해외 ${W(f)}`,s,220),caption:`국내 주식 ETF는 지수가 1.2% 오르면 iNAV가 ${W(k)}입니다. 누리 국채3년은 금리가 1%p 오르면 나라 3년이 ${fx(bm.p0,2)}원에서 ${fx(bm.p1,2)}원으로 내려 NAV도 약 ${fx(Math.abs(bm.change)*100,2)}% 내립니다. 누리 해외100은 한국 장중에 해외 시장이 닫혀 있어 환율이 1% 오르면 ${W(12000)} × 1.01 = ${W(f)}으로 추정합니다.`};
};
F.tax=()=>{
 const T=M.RULES.tax,k=M.taxType('kstock'),o=M.taxType('fstock'),f=M.taxType('fstock','foreign');
 let s=box(220,14,200,40,'var(--accent)')+t(320,39,'상장 시장은?',{size:13,w:700});
 s+=`<path class="fig-draw" d="M280 54V80H130V100M360 54V80H520V100" fill="none" stroke="var(--muted)" stroke-width="2"/>`+t(200,74,'국내',{size:12})+t(440,74,'해외',{size:12});
 s+=box(20,100,220,40)+t(130,125,'국내 주식 60% 이상?',{size:13})+box(410,100,210,40,'var(--orange)')+t(515,125,`해외 상장 · ${fx(f.gainRate*100)}% 양도소득`,{size:12.5,w:700});
 s+=`<path d="M80 140V176M180 140V160H360V176" fill="none" stroke="var(--muted)" stroke-width="2"/>`+t(70,162,'예',{size:12,a:'end'})+t(270,154,'아니요',{size:12});
 s+=box(20,176,210,40,'var(--accent)')+t(125,201,`국내주식형 · 매매차익 비과세`,{size:12.5,w:700})+box(250,176,370,40,'var(--blue)')+t(435,201,`그 밖의 국내 상장 · ${fx(o.gainRate*100,1)}% 배당소득`,{size:12.5,w:700});
 return {svg:svg(`과세 유형: 국내주식형 비과세, 그 밖의 국내 상장 ${fx(o.gainRate*100,1)}%, 해외 상장 ${fx(f.gainRate*100)}%`,s,230),caption:`상장 시장을 먼저 보고, 국내 상장이면 기초자산을 봅니다. 국내 주식을 60% 이상 담은 국내주식형은 매매차익이 비과세(${fx(k.gainRate*100)}%), 그 밖의 국내 상장 ETF는 ${fx(o.gainRate*100,1)}% 배당소득, 해외 상장 ETF는 ${fx(f.gainRate*100)}% 양도소득 유형입니다. ETF를 팔 때 증권거래세는 ${fx(T.stt)}원입니다(보도 기준).`};
};
F.choose=()=>{
 const one=M.comparePurpose({amount:6e6,years:10,trips:1}),many=M.comparePurpose({amount:6e6,years:10,trips:18});
 let s=bars([['보유 비용 차 (10년)',one.hold.diff,true],['거래 비용 차 (1번)',one.trade.diff],['거래 비용 차 (18번)',many.trade.diff]],{x0:80,gap:180,bw:110,max:many.trade.diff,top:56});
 s+=t(20,26,`600만 원 · 10년: 누리200 ${W(one.hold.a)} 대 가람200 ${W(one.hold.b)}`,{size:13,w:700,a:'start'});
 return {svg:svg(`보유 비용 차 ${W(one.hold.diff)}, 거래 비용 차 1번 ${W(one.trade.diff)}, 18번 ${W(many.trade.diff)}`,s,250),caption:`600만 원을 10년 두면 누리200 ${W(one.hold.a)}, 가람200 ${W(one.hold.b)}으로 보유 비용 차가 ${W(one.hold.diff)}입니다. 한 번 왕복하는 스프레드 비용은 ${W(one.trade.a)}과 ${W(one.trade.b)}이라 차이가 ${W(one.trade.diff)}이지만, 10년 동안 왕복이 18번이 되면 ${W(many.trade.diff)}으로 보유 비용 차보다 커집니다.`};
};
F.final=()=>{
 const f=M.finalTask(1e7,30900,30000),steps=[['(가) 지금 15:25',`${fx(f.shares)}주 × 30,900원`,W(f.paid),`현금 ${W(f.cash)}`],['(나) 다음 거래일',`${fx(f.shares)}주 × 30,000원`,W(f.value),`${fx(f.loss)}원 (${P(f.lossRate)})`],['(다) 1년 보유, 괴리 0','웃돈 몫이 남음',W(f.premium),`NAV였다면 ${fx(f.navShares)}주`]];
 let s=`<path class="fig-draw" d="M40 70H600" stroke="var(--muted)" stroke-width="2"/>`+t(20,26,`괴리율 (30,900 − 30,000) ÷ 30,000 × 100 = ${P(f.gap)}`,{size:13,w:700,a:'start'});
 steps.forEach(([a,b,c,d],i)=>{const x=30+i*200;s+=`<circle cx="${x+90}" cy="70" r="7" fill="var(--accent)"/>`+box(x,92,180,120,i===1?'var(--orange)':'var(--line)')+t(x+90,118,a,{size:12.5,w:700})+t(x+90,146,b,{size:11.5,fill:'var(--muted)'})+t(x+90,172,c,{size:13,w:700})+t(x+90,198,d,{size:11.5});});
 return {svg:svg(`세 시점: 낸 돈 ${W(f.paid)}, 다음 거래일 ${W(f.value)}, 웃돈 몫 ${W(f.premium)}`,s,230),caption:`15:25 예상 체결가 30,900원, iNAV 30,000원이면 괴리율 ${P(f.gap)}입니다. 1,000만 원으로 ${fx(f.shares)}주 ${W(f.paid)}을 사고 ${W(f.cash)}은 현금으로 둡니다. 다음 거래일에 시장가가 NAV로 돌아오면(지수 그대로) ${W(f.value)}, ${fx(f.loss)}원(${P(f.lossRate)})이고, 1년 뒤 괴리가 0이어도 웃돈 몫 ${W(f.premium)}이 그대로 남습니다.`};
};
function render(id){return F[id]?F[id]():null;}
root.EFigures={render};
})(typeof window!=='undefined'?window:this);
