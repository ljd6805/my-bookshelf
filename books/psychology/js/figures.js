/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 모두 PMath(js/math.js)로 실제로 계산해 그린다.
   그림은 본문이 이미 계산한 숫자만 쓰고, 예측 질문(L2)과 확인 문제의 답은 그리지 않는다(1장 B·D의 끝 금액 두 갈래, 6장 1억 원의 비용, 9장 26주 비중 등).
   선은 색 말고도 점 모양(● ■ ▲ ◆ ○)과 선 무늬, 범례로 가린다. 움직임은 style.css의 fig-* 애니메이션이며 동작 줄이기에서 멈춘다. */
(function(root){
'use strict';const M=root.PMath||(typeof require==='function'?require('./math.js'):null);
const fx=(n,d=0)=>{const r=M.round(Number(n),d);return (r<0?'−':'')+Math.abs(r).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});};
const P=(x,d=2)=>fx(x*100,d)+'%';
const W=640,svg=(label,body,h=300)=>`<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" text-anchor="${o.a||'middle'}" font-size="${o.size||13}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const MARK={'●':(x,y,c)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${c}"/>`,'○':(x,y,c)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.8" fill="var(--chart)" stroke="${c}" stroke-width="2"/>`,'■':(x,y,c)=>`<rect x="${(x-4).toFixed(1)}" y="${(y-4).toFixed(1)}" width="8" height="8" fill="${c}"/>`,
 '▲':(x,y,c)=>`<path d="M${x.toFixed(1)} ${(y-5.5).toFixed(1)}l5 9h-10z" fill="${c}"/>`,'◆':(x,y,c)=>`<path d="M${x.toFixed(1)} ${(y-6).toFixed(1)}l5 6l-5 6l-5-6z" fill="${c}"/>`};
const DASH={dot:'2 5',dash:'8 5'},ORDER=['◆','■','▲','○','●'];/* 점은 선을 다 그린 뒤 큰 모양부터 찍어 같은 자리의 작은 점(○ ●)도 보인다. */
/* 수치 축 그림. o={x:[lo,hi,step,fmt], y:[lo,hi,step,fmt], series:[[이름, pts, 색, 무늬, 점 모양, 점 번호]], points:[[이름, x, y, 색, 모양, 글, dx, dy, 정렬]], refs:[[y, 글]], xl, yl, box:[L,R,T,B]}.
   범례는 그림 아래에 한 줄에 하나씩 둔다. */
function plot(o){
 const [L,R,T,B]=o.box||[70,620,40,220],[x0,x1,xs,xf]=o.x,[y0,y1,ys,yf]=o.y,X=v=>L+(v-x0)/(x1-x0)*(R-L),Y=v=>B-(v-y0)/(y1-y0)*(B-T);
 let s=`<path d="M${L} ${T}V${B}H${R}" fill="none" stroke="var(--muted)"/>`;
 for(let v=y0;v<=y1+1e-9;v+=ys)s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--line)" stroke-dasharray="2 5"/>`+t(L-8,Y(v)+4,yf(v),{size:12,fill:'var(--muted)',a:'end'});
 for(let v=x0;v<=x1+1e-9;v+=xs)s+=t(X(v),B+18,xf(v),{size:12,fill:'var(--muted)'});
 if(o.xl)s+=t(R,B+36,o.xl,{size:12,fill:'var(--muted)',a:'end'});if(o.yl)s+=t(L,T-12,o.yl,{size:12,fill:'var(--muted)',a:'start'});
 (o.refs||[]).forEach(([v,label,pos])=>{s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--orange)" stroke-dasharray="7 5"/>`+(label?t(pos==='left'?L+6:R,Y(v)+(pos==='below'?16:-6),label,{size:12,fill:'var(--orange)',a:pos==='left'?'start':'end',w:700}):'');});
 (o.series||[]).forEach(([,pts,c,dash])=>{s+=`<path${dash?'':' class="fig-draw"'} d="M${pts.map(p=>`${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('L')}" fill="none" stroke="${c}" stroke-width="${dash?2:2.8}"${dash?` stroke-dasharray="${DASH[dash]}"`:''}/>`;});ORDER.forEach(sh=>(o.series||[]).forEach(([,pts,c,,shape,idx])=>{if(shape===sh)(idx||[]).forEach(i=>{s+=MARK[shape](X(pts[i][0]),Y(pts[i][1]),c);});}));
 (o.points||[]).forEach(([,x,y,c,shape,label,dx=10,dy=4,a='start'])=>{s+=MARK[shape](X(x),Y(y),c);if(label)s+=t(X(x)+dx,Y(y)+dy,label,{size:12,a,w:600});});
 const items=[...(o.series||[]).filter(x=>x[0]).map(([n,,c,dash,shape])=>({n,c,dash,shape,line:true})),...(o.points||[]).filter(x=>x[0]).map(([n,,,c,shape])=>({n,c,shape}))];
 items.forEach((it,k)=>{const y=B+56+k*21;s+=(it.line?`<path d="M${L} ${y-4}H${L+30}" stroke="${it.c}" stroke-width="2.4"${it.dash?` stroke-dasharray="${DASH[it.dash]}"`:''}/>`:'')+(it.shape?MARK[it.shape](L+15,y-4,it.c):'')+t(L+40,y,it.n,{size:12,a:'start'});});
 return {s,h:B+56+items.length*21,X,Y};
}
const up=(x,y,w,h,c,d=0)=>`<rect class="fig-grow fig-up" style="animation-delay:${d}s" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(1,h).toFixed(1)}" rx="2" fill="${c}"/>`;
/* 막대 묶음(0선 기준, 음수는 아래로). items=[[이름 위, 이름 아래, 값, 색, 글]]. */
function bars(items,{L=70,R=620,T=40,zero=200,hi,gap}={}){
 const n=items.length,step=gap||(R-L)/n,bw=Math.min(64,step*.6);let s=`<path d="M${L} ${zero}H${R}" stroke="var(--muted)"/>`;
 items.forEach(([a,b,v,c,label],i)=>{const x=L+i*step+(step-bw)/2,h=Math.abs(v)/hi*(zero-T),y=v>=0?zero-h:zero;s+=up(x,y,bw,h,c,i*.12)+t(x+bw/2,v>=0?y-8:y+h+16,label,{size:13,w:700});
  const ly=v>=0?zero+18:zero-26;s+=t(x+bw/2,ly,a,{size:12,fill:'var(--muted)'})+(b?t(x+bw/2,ly+15,b,{size:12,fill:'var(--muted)'}):'');});
 return s;
}
const J=M.JOURNAL,U=M.ASSUME,F={},man=x=>fx(x,0)+'만',WT=x=>M.wonText(x);
/* 1장: 두 틀의 기준점과 끝 금액 기대값. B·D의 끝 금액 두 갈래는 확인 문제의 답이라 그리지 않는다. */F.frame=()=>{const m=J.memo.frame,f=M.frames(m.start,m.sure,m.p,m.amount),X=v=>70+(v-800)/(1800-800)*540;let s=`<path d="M70 200H610" stroke="var(--muted)"/>`;
 [800,1000,1200,1400,1600,1800].forEach(v=>{s+=t(X(v),220,fx(v,0),{size:12,fill:'var(--muted)'});});s+=t(610,240,'끝 금액 (만 원)',{size:12,fill:'var(--muted)',a:'end'});
 [[f.gain.start,f.gain.A.ev,'이익 틀','A·B 기대값 +'+man(f.gain.A.ev),70,'var(--blue)','●'],[f.loss.start,f.loss.C.ev,'손실 틀','C·D 기대값 '+fx(f.loss.C.ev,0).replace('-','−')+'만',140,'var(--orange)','■']].forEach(([st,e,name,lab,y,c,sh],k)=>{
  s+=t(70,y-24,`${name} · 기준점 ${man(st)} 원`,{size:13,w:700,a:'start'})+MARK['○'](X(st),y,c)+`<path class="fig-dash" d="M${X(st).toFixed(1)} ${y}H${X(st+e).toFixed(1)}" stroke="${c}" stroke-width="2.4"/>`+MARK[sh](X(st+e),y,c);
  s+=t((X(st)+X(st+e))/2,y+22,lab,{size:12,fill:'var(--muted)'});});
 s+=`<path d="M${X(1200)} 40V200" stroke="var(--accent)" stroke-dasharray="4 4"/>`+t(X(1200)+8,190,'끝 금액 기대값 1,200만 원',{size:12,w:700,a:'start',fill:'var(--accent)'});
 return {svg:svg(`이익 틀은 기준점 1,000만 원에서 기대값 +200만 원, 손실 틀은 기준점 1,600만 원에서 기대값 −400만 원으로 둘 다 끝 금액 기대값 1,200만 원`,s,250),caption:`선우의 연습 문항 두 개를 끝 금액으로 옮긴 그림입니다. 이익 틀은 1,000만 원에서 출발해 기대값 +200만 원, 손실 틀은 600만 원을 더 받은 1,600만 원에서 출발해 기대값 −400만 원이며, 끝 금액 기대값은 둘 다 1,200만 원입니다. 실제 계산이며 문항은 미리 정한 시나리오입니다.`};
};
/* 2장: 가치 함수 곡선과 두 점. */F.prospect=()=>{const pts=[];for(let x=-300;x<=300;x+=10)pts.push([x,M.value(x)]);const g=M.value(200),l=M.value(-100),pv=M.prospect(200,100);
 const o=plot({x:[-300,300,100,v=>fx(v,0)],y:[-400,200,100,v=>fx(v,0)],xl:'이익·손실 x (만 원)',yl:'가치 v(x)',series:[['가치 함수 (α = β = 0.88, λ = 2.25)',pts,'var(--blue)']],
  points:[['v(200) = '+fx(g,2),200,g,'var(--accent)','●',fx(g,2),-10,-10,'end'],['v(−100) = '+fx(l,2).replace('-','−'),-100,l,'var(--orange)','■',fx(l,2).replace('-','−'),10,16,'start']],box:[70,620,40,250]});
 return {svg:svg(`이익과 손실(만 원)을 느끼는 크기를 그린 가치 함수 곡선, 손실 쪽이 더 가파름. v(200) ${fx(g,2)}, v(−100) ${fx(l,2)}`,o.s,o.h),caption:`이익 쪽은 완만하고 손실 쪽은 가파른 가치 함수입니다(단위 만 원). 반반 내기 +200만 / −100만 원의 전망 가치는 0.5 × ${fx(g,2)} + 0.5 × (${fx(l,2).replace('-','−')}) = ${fx(pv.value,2).replace('-','−')}로 음수입니다. 모수는 ${M.TEXT.paramNote}.`};
};
/* 3장: 두 범위의 PGR·PLR 막대. */F.disposition=()=>{const a=M.disposition(1,13),b=M.disposition(14,26),c3=v=>fx(v,3);
 const items=[['1~13주','PGR',a.pgr,'var(--blue)',c3(a.pgr)],['1~13주','PLR',a.plr,'var(--orange)',c3(a.plr)],['14~26주','PGR',b.pgr,'var(--blue)',c3(b.pgr)],['14~26주','PLR',b.plr,'var(--orange)',c3(b.plr)]];
 const s=t(70,24,'매도한 날에 센 비율 (선우의 일지)',{size:13,w:700,a:'start'})+bars(items,{L:70,R:620,T:50,zero:220,hi:1});
 return {svg:svg(`PGR과 PLR: 1~13주 ${c3(a.pgr)}·${c3(a.plr)}, 14~26주 ${c3(b.pgr)}·${c3(b.plr)}`,s,270),caption:`매도한 날마다 네 칸(RG·PG·RL·PL)을 세어 낸 두 비율입니다. 1~13주는 PGR ${c3(a.pgr)}·PLR ${c3(a.plr)}, 14~26주는 ${c3(b.pgr)}·${c3(b.plr)}로 두 범위 모두 이익 난 종목을 판 비율이 더 큽니다. 매도한 날이 세 번씩뿐이라 흔적일 뿐 확정하지 못합니다.`};
};
/* 4장: 1,000종목을 두 줄로 나눈 막대. */F.baserate=()=>{const b=U.baserate,r=M.bayes(b.base,b.hit,b.falseAlarm),gd=r.grid,X=v=>70+v/1000*540;let s=t(70,24,`1,000종목 · 기저율 ${fx(b.base*100,0)}%, 적중 ${fx(b.hit*100,0)}%, 오경보 ${fx(b.falseAlarm*100,0)}%`,{size:13,w:700,a:'start'});
 s+=`<rect class="fig-grow" x="70" y="50" width="${(X(gd.doubles)-70).toFixed(1)}" height="26" fill="var(--accent)"/><rect class="fig-grow" x="${X(gd.doubles).toFixed(1)}" y="50" width="${(X(1000)-X(gd.doubles)).toFixed(1)}" height="26" fill="var(--panel2)" stroke="var(--line)"/>`;
 s+=t(70,98,`실제로 두 배가 된 종목 ${fx(gd.doubles,0)}개 ▲`,{size:12,a:'start'})+t(610,98,`나머지 ${fx(1000-gd.doubles,0)}개`,{size:12,a:'end',fill:'var(--muted)'});
 const Y=140,w1=gd.hits/gd.flagged*540;s+=t(70,Y-10,`추천받은 ${fx(gd.flagged,0)}개`,{size:13,w:700,a:'start'});
 s+=`<rect class="fig-grow" x="70" y="${Y}" width="${w1.toFixed(1)}" height="26" fill="var(--accent)"/><rect class="fig-grow" x="${(70+w1).toFixed(1)}" y="${Y}" width="${(540-w1).toFixed(1)}" height="26" fill="var(--orange)" opacity=".75"/>`;
 s+=t(70,Y+48,`맞은 추천 ${fx(gd.hits,0)}개 ▲`,{size:12,a:'start'})+t(610,Y+48,`틀린 추천 ${fx(gd.falseHits,0)}개 ■`,{size:12,a:'end'})+t(70,Y+76,`추천이 맞을 확률 = ${fx(gd.hits,0)} ÷ ${fx(gd.flagged,0)} = ${P(r.posterior,1)}`,{size:13,w:700,a:'start'});
 return {svg:svg(`1,000종목 가운데 추천 ${gd.flagged}개, 맞은 추천 ${gd.hits}개, 맞을 확률 ${P(r.posterior,1)}`,s,240),caption:`아래 막대는 추천받은 ${fx(gd.flagged,0)}개만 다시 늘려 그린 것입니다. 기저율이 낮아 틀린 추천 ${fx(gd.falseHits,0)}개가 맞은 추천 ${fx(gd.hits,0)}개보다 훨씬 많고, 맞을 확률은 ${P(r.posterior,1)}입니다. 비율은 미리 정한 가정이며 실제 추천의 비율이 아닙니다.`};
};
/* 5장: 오즈 막대(로그 눈금 없이 확률로). */F.confirm=()=>{const e=M.evidence(),items=[['사전','확률',e.all.prior,'var(--muted)',P(e.all.prior,1)],['지지 증거','셋만',e.supportOnly.p,'var(--orange)',P(e.supportOnly.p,1)],['다섯 개','모두',e.all.p,'var(--blue)',P(e.all.p,1)]];
 const s=t(70,24,'새벽전자가 좋은 종목이라는 확신 (사전 50%)',{size:13,w:700,a:'start'})+bars(items,{L:70,R:520,T:50,zero:220,hi:1});
 return {svg:svg(`확신: 사전 ${P(e.all.prior,1)}, 지지 증거만 ${P(e.supportOnly.p,1)}, 다섯 개 모두 ${P(e.all.p,1)}`,s,270),caption:`사전 오즈 1에 지지 증거 셋의 우도비 곱 4.5를 곱하면 확신이 ${P(e.supportOnly.p,1)}까지 오르지만, 반대 증거 둘(곱 0.2)까지 넣으면 오즈 0.9로 ${P(e.all.p,1)}입니다. 우도비는 미리 정한 시나리오이며 증거가 서로 독립이라고 놓았습니다.`};
};
/* 6장: 90% 예상 범위 9개와 4주 뒤 종가. */F.overconfidence=()=>{const iv=M.intervals();let s=t(20,22,`매수 때 적은 4주 뒤 90% 범위와 실제 종가 · 맞음 ● ${iv.hits}개, 벗어남 ✗ ${iv.n-iv.hits}개`,{size:13,w:700,a:'start'});
 const yb=52+iv.n*24-10;/* 가운데 점선이 실제 종가, 눈금은 10%마다(−30%~+30%). */s+=`<path d="M450 38V${yb}" stroke="var(--muted)" stroke-dasharray="3 4"/><path d="M300 ${yb}H600" stroke="var(--muted)"/>`+[300,350,400,500,550,600].map(x=>`<path d="M${x} ${yb}v5" stroke="var(--muted)"/>`).join('');
 iv.rows.forEach((r,k)=>{const y=52+k*24,lo=r.range[0],hi=r.range[1],X=v=>300+(v/r.price-0.7)/0.6*300;
  s+=t(20,y+4,`거래 ${r.n} · ${r.name}`,{size:12,a:'start'})+`<path d="M${X(lo).toFixed(1)} ${y}H${X(hi).toFixed(1)}" stroke="var(--blue)" stroke-width="6" opacity=".55"/>`;
  s+=r.hit?MARK['●'](X(r.price),y,'var(--accent)'):t(X(r.price),y+5,'✗',{size:14,w:700,fill:'var(--orange)'});});
 s+=t(300,yb+18,'−30%',{size:11,fill:'var(--muted)'})+t(450,yb+18,'실제 종가',{size:11,fill:'var(--muted)'})+t(600,yb+18,'+30%',{size:11,fill:'var(--muted)'});
 return {svg:svg(`90% 범위 ${iv.n}개 가운데 ${iv.hits}개만 실제 종가를 담음`,s,52+iv.n*24+16),caption:`막대는 매수 때 적은 범위, 점은 4주 뒤 실제 종가입니다(가로축은 실제 종가를 가운데 둔 −30%~+30%). 진짜 90% 범위라면 9개 중 8.1개쯤 맞아야 하는데 ${iv.hits}개가 맞았고, 이렇게 적게 맞을 확률은 ${P(iv.pAtMost,1)}입니다. 범위가 9개뿐이라 확정하지는 못합니다.`};
};
/* 7장: 정보 폭포 줄(기본 p 0.6, 첫 두 사람이 산 예)과 틀린 폭포 확률. */F.herd=()=>{const sig=[true,true,false,false,true,false,true,false],run=M.cascadeRun(sig,()=>true);let s=t(20,22,'차례로 고르는 여덟 사람 · 위 칸은 자기 신호, 아래 칸은 남이 보는 행동',{size:13,w:700,a:'start'});
 sig.forEach((g,i)=>{const x=40+i*72,a=run.acts[i];s+=`<rect x="${x}" y="40" width="56" height="30" rx="5" fill="var(--panel2)" stroke="var(--line)"/>`+t(x+28,60,g?'G 좋음':'B 나쁨',{size:12});
  s+=`<rect class="fig-seq" style="animation-delay:${i*.3}s" x="${x}" y="84" width="56" height="30" rx="5" fill="${a.buy?'var(--blue)':'var(--panel)'}" stroke="${a.cascade?'var(--orange)':'var(--line)'}" stroke-width="${a.cascade?2.5:1}"/>`+t(x+28,104,a.buy?'● 삼':'○ 안 삼',{size:12,fill:a.buy?'var(--bg)':'var(--text)',w:700});});
 s+=t(40+2*72,136,'▲ 셋째부터 폭포: 자기 신호와 상관없이 따라 삼',{size:12,a:'start',fill:'var(--orange)',w:700});
 const items=U.cascade.ps.map(p=>[`p ${p}`,'',M.cascadeOdds(p).wrong,'var(--orange)',P(M.cascadeOdds(p).wrong,1)]);s+=t(40,170,'틀린 폭포의 확률',{size:13,w:700,a:'start'})+bars(items,{L:40,R:400,T:184,zero:290,hi:0.5});
 return {svg:svg('정보 폭포 줄과 신호 정확도 0.6·0.7·0.8의 틀린 폭포 확률 '+items.map(x=>x[4]).join(', '),s,330),caption:`첫째와 둘째가 좋은 신호를 받아 사면, 셋째부터는 나쁜 신호를 받아도 따라 사는 것이 합리적이 되어 뒤의 신호가 더는 드러나지 않습니다. 아래 막대는 강의 노트의 기본 모형으로 계산한 틀린 폭포 확률입니다. ${M.TEXT.cascadeNote}. 그림의 줄은 시각적 비유가 아니라 모형대로 계산한 한 예입니다.`};
};
/* 8장: 횟수별 손실 확률. */F.outcome=()=>{const o=U.outcome,items=o.ns.map(n=>{const d=M.outcomeDist(o.p,n);return [`${n}번`,'',d.neg,'var(--orange)',P(d.neg,1)];});
 const s=t(70,24,`승률 ${fx(o.p*100,0)}%, 이기면 +1·지면 −1인 규칙의 합계가 음수일 확률`,{size:13,w:700,a:'start'})+bars(items,{L:70,R:620,T:50,zero:220,hi:0.3});
 return {svg:svg(`승률 ${fx(o.p*100,0)}%, ±1인 규칙을 여러 번 했을 때 합계가 음수일 확률 `+items.map(x=>x[0]+' '+x[4]).join(', '),s,260),caption:`한 번 기대값이 +0.1인 규칙도 ${items.map(x=>x[0]+' '+x[4]).join(', ')}의 확률로 손실로 끝납니다. 이항분포로 실제 계산했으며 승률 55%와 ±1은 가정한 규칙입니다.`};
};
/* 9장: 온결식품 종가와 평균 단가, R1 선(−10%). */F.rules=()=>{const L=M.ledger(),px=J.prices['온결식품'],avg=[],hit=M.r1Weeks(L).first.find(x=>x.name==='온결식품');
 L.weeks.forEach(w=>{const h=w.hold['온결식품'];avg.push(h?h.cost/h.qty:null);});
 const pts=px.map((p,i)=>[i+1,p]),aw=avg.map((a,i)=>a==null?null:[i+1,a]).filter(Boolean),lim=aw.map(([x,a])=>[x,a*0.9]);
 const o=plot({x:[0,26,5,v=>`${v}주`],y:[23000,31000,2000,v=>fx(v,0)],xl:'주',yl:'원',series:[['온결식품 종가',pts,'var(--blue)'],['평균 단가 (수수료 포함)',aw,'var(--muted)','dash'],['R1 선: 평균 단가 × 0.9',lim,'var(--orange)','dot']],
  points:[['R1이 처음 걸린 8주',hit.week,px[hit.week-1],'var(--orange)','▲',`8주 ${P(hit.drop,2).replace('-','−')}`,10,-12,'start']],box:[70,620,40,230]});
 return {svg:svg(`온결식품 종가가 8주에 평균 단가보다 ${P(hit.drop,2)} 낮아 R1이 처음 걸림`,o.s,o.h),caption:`R1은 매매하기 전 그 주 종가로 확인하므로, 온결식품은 −10%가 아니라 ${P(hit.drop,2).replace('-','−')}인 8주 종가에서 처음 걸립니다. 선우는 이 주에 오히려 100주를 더 샀고, 평균 단가가 내려가 R1 선도 따라 내려갔습니다. 일지는 미리 정한 시나리오입니다.`};
};
/* 10장: 26주 계좌 평가액. 점검표의 답은 그리지 않는다. */F.final=()=>{const L=M.ledger(),pts=L.weeks.map(w=>[w.week,w.equity/1e4]),sells=J.trades.filter(t=>t.side==='S').map(t=>t.week-1),buys=J.trades.filter(t=>t.side==='B').map(t=>t.week-1);
 const o=plot({x:[0,26,5,v=>`${v}주`],y:[1850,2100,50,v=>fx(v,0)],xl:'주',yl:'계좌 평가액 (만 원)',refs:[[J.start/1e4,'시작 2,000만 원']],series:[['주말 계좌 평가액 (● 산 주)',pts,'var(--blue)',null,'●',[...new Set(buys)]]],points:[...new Set(sells)].map((i,k)=>[k?null:'판 주',pts[i][0],pts[i][1],'var(--orange)','■']),box:[70,620,40,230]});
 return {svg:svg(`계좌 평가액이 2,000만 원에서 26주 뒤 ${fx(L.end/1e4,1)}만 원`,o.s,o.h),caption:`선우의 계좌는 26주 뒤 ${WT(L.end)}으로 ${P(Math.abs(L.end/J.start-1),2)} 줄었습니다. 동그라미는 산 주, 네모는 판 주입니다. 이 줄어든 폭만으로는 결정의 좋고 나쁨을 말할 수 없고, 과제에서 일지의 칸을 하나씩 계산합니다.`};
};
function render(id){return F[id]?F[id]():null;}root.PFigures={render};
})(typeof window!=='undefined'?window:this);
