/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 모두 VMath(js/math.js)로 실제로 계산해 그린다.
   새벽전자·누리200·제자리 경로는 tests/math.test.cjs와 같은 정의의 가상 기록이다. 움직임은 style.css의 fig-* 애니메이션이며 동작 줄이기에서 멈춘다. */
(function(root){
'use strict';
const M=root.VMath||(typeof require==='function'?require('./math.js'):null);
const fx=(n,d=0)=>{const r=Number(Number(n).toFixed(d));return (r<0?'−':'')+Math.abs(r).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});};
const pc=(x,d=2)=>{const s=fx(x*100,d);return (Number((x*100).toFixed(d))>0?'+':'')+s+'%';};
const j=(w,a,b)=>{const x=String(w),d='영일이삼사오육칠팔구'['0123456789'.indexOf(x.at(-1))]||x.at(-1),c=d.charCodeAt(0)-0xac00,f=c>=0&&c<11172?c%28:0;return f&&!(a==='으로'&&f===8)?a:b;};
const svg=(label,body,h=260)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||13}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const up=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow fig-up" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${Math.max(h,1)}" rx="2" fill="${color}"/>`;
const closes=()=>M.saebyeokYear().map(b=>b.close);
/* 선 그래프: series = [[값들, 색, 이름, 점선]], 좌표 상자 x0~x1, y0~y1. 이름은 선 끝에 적는다. */
function plot(series,{x0=70,x1=560,y0=30,y1=210,lo,hi,marks=[]}={}){
 const all=series.flatMap(s=>s[0]),L=lo??Math.min(...all),H=hi??Math.max(...all),n=Math.max(...series.map(s=>s[0].length));
 const X=i=>x0+i/Math.max(1,n-1)*(x1-x0),Y=v=>y1-(v-L)/(H-L||1)*(y1-y0);
 let s=`<path d="M${x0} ${y0}V${y1}H${x1}" stroke="var(--line)" fill="none"/>`;
 marks.forEach(([v,label])=>{s+=`<path d="M${x0} ${Y(v).toFixed(1)}H${x1}" stroke="var(--muted)" stroke-dasharray="4 4"/>`+t(x0-6,Y(v)+4,label,{a:'end',size:11,fill:'var(--muted)'});});
 series.forEach(([v,color,name,dash],k)=>{s+=`<path class="fig-draw" d="${v.map((p,i)=>`${i?'L':'M'}${X(i).toFixed(1)} ${Y(p).toFixed(1)}`).join('')}" fill="none" stroke="${color}" stroke-width="${v.length>200?1.6:2.4}"${dash?' stroke-dasharray="6 4"':''}/>`;if(name)s+=t(x1+6,Y(v.at(-1))+4+(k===2?8:k===1?-4:0),name,{a:'start',size:12,fill:color,w:700});});
 return {s,X,Y};
}
const F={};
F.returns=()=>{
 const P=[100,50,75],Y=v=>210-v*1.6;let s='';
 P.forEach((v,i)=>{const x=110+i*190;s+=up(x,Y(v),80,210-Y(v),i?'var(--accent)':'var(--blue)',i*.3)+t(x+40,Y(v)-8,String(v),{size:15,w:700})+t(x+40,232,['처음','1기간 뒤','2기간 뒤'][i],{size:12,fill:'var(--muted)'});});
 s+=t(245,90,'−50%',{size:14,fill:'var(--orange)',w:700})+t(245,108,`ln 0.5 = ${fx(Math.log(.5),3)}`,{size:11,fill:'var(--muted)'})+t(435,90,'+50%',{size:14,fill:'var(--orange)',w:700})+t(435,108,`ln 1.5 = +${fx(Math.log(1.5),3)}`,{size:11,fill:'var(--muted)'});
 s+=t(320,24,`산술 평균 0% · 곱하면 0.5 × 1.5 = 0.75 → ${pc(M.compound(M.simpleReturns(P)),0)}`,{size:13,w:700});
 return {svg:svg('100이 50이 되었다가 75가 되는 막대 그림. 산술 평균은 0%이지만 실제로는 25% 줄었다',s,250),caption:`100이 −50%로 50, 다시 +50%로 75가 됩니다. 두 수익률의 산술 평균은 0%이지만 곱하면 0.75, 곧 −25%입니다. 로그로 적으면 ${fx(Math.log(.5),3)} + ${fx(Math.log(1.5),3)} = ${fx(Math.log(.75),3)}이고, 되돌리면 같은 −25%입니다.`};
};
F.drag=()=>{
 const R=M.flatVolatileReturns(.015,125),idx=M.pathFromReturns(100,R),two=M.leveragedPath(R,2,{start:100}),inv=M.leveragedPath(R,-2,{start:100});
 const ev=a=>a.filter((_,i)=>i%2===0),p=plot([[ev(idx),'var(--text)','지수'],[ev(two),'var(--accent)','2배'],[ev(inv),'var(--orange)','인버스 2배',true]],{lo:80,hi:102,marks:[[100,'100'],[90,'90']]});
 return {svg:svg(`제자리로 돌아오는 지수와 날마다 다시 맞춘 2배·인버스 2배 상품. 250거래일 뒤 지수 100, 2배 ${fx(two[250],2)}, 인버스 2배 ${fx(inv[250],2)}`,p.s+t(320,250,'하루 +1.5%, 다음 날 제자리 · 125쌍(한 쌍이 끝난 날마다 그림) · 보수 없음',{size:12,fill:'var(--muted)'})),caption:`지수가 하루 +1.5%, 다음 날 제자리로 돌아오는 일을 125번 되풀이하면 지수는 100으로 끝나지만, 날마다 다시 맞춘 2배 상품은 ${pc(two[250]/100-1)}, 인버스 2배는 ${pc(inv[250]/100-1)}입니다.`};
};
F.measure=()=>{
 const y=M.saebyeokYear(),c=y.map(b=>b.close),tr=M.trueRange(y),atr=M.atrWilder(y,14),p=plot([[c,'var(--text)','']],{x0:70,x1:600,marks:[[20000,'20,000'],[16000,'16,000']],lo:15000,hi:22000});
 const x=p.X(80);
 const s=p.s+`<path d="M${x} 30V210" stroke="var(--orange)" stroke-dasharray="3 3"/>`+t(x+6,46,`81일째 갭: 고가 − 저가 ${fx(y[80].high-y[80].low)}원 · 참범위 ${fx(tr[80])}원`,{a:'start',size:12,fill:'var(--orange)',w:700})+t(x+6,64,`14일 ATR ${fx(atr[79],1)}원 → ${fx(atr[80],1)}원`,{a:'start',size:12})+t(320,240,'새벽전자 1년 종가 (가상 기록)',{size:12,fill:'var(--muted)'});
 return {svg:svg(`새벽전자 1년 종가. 81일째 갭으로 참범위가 ${fx(tr[80])}원이 되었다`,s,250),caption:`81일째 새벽전자는 고가와 저가의 차이가 ${fx(y[80].high-y[80].low)}원뿐이지만, 전날 종가에서 저가까지 비어 참범위는 ${fx(tr[80])}원입니다. 14일 ATR은 ${fx(atr[79],1)}원에서 ${fx(atr[80],1)}원으로 뛰었습니다. 하루 σ 1.5%는 × √250으로 연율 ${fx(M.annualizeVol(.015)*100,1)}%가 됩니다.`};
};
F.walk=()=>{
 const one=M.randomWalk({n:250,vol:.01,seed:39}),others=[2,5,8,13,21,34].map(s=>M.randomWalk({n:250,vol:.01,seed:s}));
 const p=plot([...others.map(q=>[q,'var(--muted)','']),[one,'var(--accent)',`시드 39 ${pc(one[250]/100-1,0)}`]],{marks:[[100,'100']]});
 return {svg:svg(`추세 0, 하루 1% 생성기의 1년 경로 일곱 개. 시드 39 경로는 ${pc(one[250]/100-1,0)}`,p.s+t(320,240,'추세 μ = 0 · 하루 σ = 1% · 250일 · 시드만 바꿈',{size:12,fill:'var(--muted)'}),250),caption:`추세가 0인 동전에서도 시드 39의 경로는 1년 동안 ${pc(one[250]/100-1,0)} 올라 “오르는 종목”처럼 보입니다. 회색 선은 같은 설정에서 시드만 바꾼 경로입니다. 1년 끝값의 표준편차는 1% × √250 ≈ ${fx(M.annualizeVol(.01)*100,1)}%입니다.`};
};
F.tails=()=>{
 const mc=o=>M.mean(M.monteCarlo({n:250,vol:.01,seed:1,...o},400,q=>M.tailShare(M.logReturns(q),3)));
 const r=M.logReturns(closes()),sy=M.tailShare(r,3),items=[['정규 이론',.0027],['정규 생성기',mc({})],['t(6) 생성기',mc({tails:'t'})],['새벽전자 1년',sy]],Y=v=>210-v*100*140;
 let s=`<path d="M60 210H600" stroke="var(--line)"/>`;
 items.forEach(([n,v],i)=>{const x=90+i*130;s+=up(x,Y(v),80,210-Y(v),i===2?'var(--accent)':'var(--blue)',i*.2)+t(x+40,Y(v)-8,`${fx(v*100,2)}%`,{size:14,w:700})+t(x+40,230,n,{size:12});});
 s+=t(320,24,'평균에서 3σ 넘게 벗어난 날의 비율',{size:13,w:700});
 return {svg:svg(`3σ 밖의 날 비율. 정규 이론 0.27%, 정규 생성기 ${fx(items[1][1]*100,2)}%, t(6) ${fx(items[2][1]*100,2)}%`,s,250),caption:`정규분포라면 3σ 밖의 날은 0.27%입니다. 하루 1% 생성기 경로 400개에서 정규 잡음은 ${fx(items[1][1]*100,2)}%, 분산을 1로 맞춘 t(6) 잡음은 ${fx(items[2][1]*100,2)}%였습니다. 새벽전자 1년은 81일째 하루뿐이지만(${fx(sy*100,2)}%) 초과 첨도는 ${fx(M.moments(r).kurtosis,2)}입니다.`};
};
F.revert=()=>{
 const r=M.logReturns(closes().slice(0,120)),a=M.acf(r,8),b=M.acfBand(r.length),Y=v=>120-v*90;
 let s=`<rect x="70" y="${Y(b)}" width="520" height="${Y(-b)-Y(b)}" fill="var(--accent)" opacity=".12"/><path d="M70 120H590" stroke="var(--muted)"/>`+t(586,Y(b)-5,`띠 ±${fx(b,3)}`,{a:'end',size:11,fill:'var(--muted)'});
 a.forEach((v,i)=>{const x=95+i*62,out=Math.abs(v)>b;s+=`<rect class="fig-grow" style="animation-delay:${i*.1}s" x="${x}" y="${Math.min(Y(v),120)}" width="34" height="${Math.max(1,Math.abs(Y(v)-120))}" rx="2" fill="${out?'var(--accent)':'var(--blue)'}"/>`+t(x+17,v>=0?Y(v)-6:Y(v)+16,`${out?'▲':''}${fx(v,2)}`,{size:12,w:700})+t(x+17,232,`ρ${'₁₂₃₄₅₆₇₈'[i]}`,{size:12,fill:'var(--muted)'});});
 return {svg:svg(`새벽전자 앞 120일 수익률의 자기상관. ρ₁ ${fx(a[0],3)}, ρ₄ ${fx(a[3],2)}, ρ₈ ${fx(a[7],2)}`,s,250),caption:`새벽전자 앞 120일 하루 수익률의 ρ₁은 +${fx(a[0],3)}로 띠(±${fx(b,3)})를 넘지만, ρ₄는 ${fx(a[3],2)}, ρ₈은 +${fx(a[7],2)}입니다. 8거래일 주기의 박스권이 하루 시차에서는 같은 방향이 이어진 것처럼 보일 뿐입니다.`};
};
F.trend=()=>{
 const r=M.logReturns(closes().slice(0,120)),qs=[2,5,8],v=qs.map(q=>M.varianceRatio(r,q).vr),Y=x=>200-x*110;
 let s=`<path d="M70 ${Y(1)}H590" stroke="var(--muted)" stroke-dasharray="5 4"/>`+t(586,Y(1)-6,'VR = 1 (무작위 보행)',{a:'end',size:11,fill:'var(--muted)'});
 v.forEach((x,i)=>{const cx=140+i*170;s+=up(cx,Math.min(Y(x),Y(1)),90,Math.abs(Y(x)-Y(1)),x>1?'var(--blue)':'var(--accent)',i*.25)+t(cx+45,(x>1?Y(x):Y(1)+Math.abs(Y(x)-Y(1)))+(x>1?-8:18),fx(x,3),{size:14,w:700})+t(cx+45,236,`q = ${qs[i]}`,{size:13});});
 return {svg:svg(`새벽전자 앞 120일의 분산비. q = 2: ${fx(v[0],3)}, q = 5: ${fx(v[1],3)}, q = 8: ${fx(v[2],3)}`,s,250),caption:`같은 새벽전자 앞 120일인데 q = 2면 VR ${fx(v[0],3)}${j(fx(v[0],3),'으로','로')} 추세 쪽, q = 5면 ${fx(v[1],3)}${j(fx(v[1],3),'으로','로')} 1 근처, 박스권 한 주기인 q = 8이면 ${fx(v[2],3)}${j(fx(v[2],3),'으로','로')} 되돌림 쪽입니다. VR에는 언제나 q를 함께 적습니다.`};
};
F.cross=()=>{
 const P=[100,102,99,100,101,98,100,100,97],c=M.levelCrossings(P,100),X=i=>90+i*60,Y=v=>120-(v-100)*22;
 let s=`<path d="M70 ${Y(100)}H590" stroke="var(--accent)" stroke-dasharray="5 4"/>`+t(64,Y(100)+4,'100',{a:'end',size:12,fill:'var(--accent)'});
 s+=`<path class="fig-draw" d="${P.map((v,i)=>`${i?'L':'M'}${X(i)} ${Y(v)}`).join('')}" fill="none" stroke="var(--text)" stroke-width="2.4"/>`;
 let side=0;P.forEach((v,i)=>{const sd=v>100?1:v<100?-1:0;if(sd===0)s+=`<circle cx="${X(i)}" cy="${Y(v)}" r="5" fill="var(--panel)" stroke="var(--muted)" stroke-width="2"/>`;else{if(side&&sd!==side)s+=`<rect x="${X(i)-6}" y="${Y(v)-6}" width="12" height="12" fill="var(--orange)"/>`+t(X(i),sd>0?Y(v)-12:Y(v)+22,sd>0?'↑ 건넘':'↓ 건넘',{size:11,fill:'var(--orange)',w:700});side=sd;}s+=t(X(i),238,String(v),{size:12,fill:'var(--muted)'});});
 s+=t(320,22,`100인 날 ${P.filter(v=>v===100).length}번(○ 닿기만 함) · 건넌 횟수 ${c.count}번(■ 위로 ${c.up} · 아래로 ${c.down})`,{size:13,w:700});
 return {svg:svg(`100에 닿기만 한 날 네 번과 100을 건넌 세 번을 구분한 그림`,s,250),caption:`100, 102, 99, 100, 101, 98, 100, 100, 97로 움직인 가격은 값이 정확히 100인 날이 네 번이지만 100을 건넌 것은 ${c.count}번(위로 ${c.up}번, 아래로 ${c.down}번)입니다. 하루 1% 무작위 보행 250일은 시작가 선을 평균 약 9번 건넙니다.`};
};
F.drawdown=()=>{
 const c=closes(),dd=M.drawdownSeries(c),d=M.maxDrawdown(c),p=plot([[dd.map(v=>v*100),'var(--accent)','']],{lo:-30,hi:0,marks:[[0,'0%'],[-10,'−10%'],[-20,'−20%']]});
 const s=p.s+`<path d="M${p.X(d.peak)} 30V210M${p.X(d.trough)} 30V210" stroke="var(--orange)" stroke-dasharray="3 3"/>`+t(p.X(d.peak)-4,226,`${d.peak+1}일째 고점 ${fx(c[d.peak])}원`,{a:'end',size:11,fill:'var(--orange)'})+t(p.X(d.trough)+4,226,`${d.trough+1}일째 저점 ${fx(c[d.trough])}원`,{a:'start',size:11,fill:'var(--orange)'})+t(p.X(d.trough)+6,p.Y(d.mdd*100)+4,`최대 낙폭 ${fx(d.mdd*100,1)}%`,{a:'start',size:13,w:700});
 return {svg:svg(`새벽전자 1년 낙폭 곡선. 최대 낙폭 ${fx(d.mdd*100,1)}%, 250일째까지 회복하지 못함`,s,250),caption:`새벽전자 1년의 낙폭 곡선입니다. ${d.peak+1}일째 고점 ${fx(c[d.peak])}원에서 ${d.trough+1}일째 ${fx(c[d.trough])}원까지 빠진 ${fx(d.mdd*100,1)}%가 최대 낙폭이고, 되찾으려면 ${fx(M.recoveryNeeded(d.mdd)*100,1)}%가 올라야 합니다. −20%를 되찾는 데는 +25%가 필요합니다.`};
};
F.final=()=>{
 const p=M.randomWalk({n:250,vol:.012,seed:524}),two=M.leveragedPath(M.simpleReturns(p),2,{start:100}),pl=plot([[p,'var(--text)',`지수 ${fx(p[250],2)}`],[two,'var(--accent)',`2배 ${fx(two[250],2)}`]],{x1:540,marks:[[100,'100']]});
 return {svg:svg(`누리200 1년과 날마다 2배로 맞춘 상품. 지수 ${fx(p[250],2)}, 2배 ${fx(two[250],2)}`,pl.s+t(320,240,'누리200: 생성기 시드 524 · 하루 1.2% · 250일 (가상)',{size:12,fill:'var(--muted)'}),250),caption:`누리200은 1년 뒤 ${fx(p[250],2)}${j(fx(p[250],2),'으로','로')} 거의 제자리였지만 날마다 2배로 맞춘 누리200 2배는 ${fx(two[250],2)}${j(fx(two[250],2),'이','가')} 되었습니다. 지수가 1년 동안 흔들린 만큼, 곧 하루 분산의 합만큼 깎인 결과입니다.`};
};
function render(id){return F[id]?F[id]():null;}
root.VFigures={render};
})(typeof window!=='undefined'?window:this);
