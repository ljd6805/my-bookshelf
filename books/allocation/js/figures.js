/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 모두 AMath(js/math.js)로 실제로 계산해 그린다.
   막대와 선은 값에 비례하고(축은 0 또는 표시한 범위에서 시작), 점은 실제 꺾이는 곳(최소분산 점, 성장률이 가장 큰 f*)과 본문이 계산한 점에만 둔다.
   그림은 본문이 이미 계산한 숫자만 쓰고, 예측 질문(L2)과 확인 문제의 답은 그리지 않는다(3장 상관 1의 60/40, 10장 안 A·B의 계산 결과 등).
   선은 색 말고도 점 모양(● ■ ▲ ◆ ○)과 선 무늬, 범례로 가린다. 움직임은 style.css의 fig-* 애니메이션이며 동작 줄이기에서 멈춘다. */
(function(root){
'use strict';const M=root.AMath||(typeof require==='function'?require('./math.js'):null);
const fx=(n,d=0)=>{const r=M.round(Number(n),d);return (r<0?'−':'')+Math.abs(r).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});};
const P=(x,d=2)=>fx(x*100,d)+'%';
const W=640,svg=(label,body,h=300)=>`<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" text-anchor="${o.a||'middle'}" font-size="${o.size||13}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const MARK={'●':(x,y,c)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${c}"/>`,'○':(x,y,c)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.8" fill="var(--chart)" stroke="${c}" stroke-width="2"/>`,'■':(x,y,c)=>`<rect x="${(x-4).toFixed(1)}" y="${(y-4).toFixed(1)}" width="8" height="8" fill="${c}"/>`,
 '▲':(x,y,c)=>`<path d="M${x.toFixed(1)} ${(y-5.5).toFixed(1)}l5 9h-10z" fill="${c}"/>`,'◆':(x,y,c)=>`<path d="M${x.toFixed(1)} ${(y-6).toFixed(1)}l5 6l-5 6l-5-6z" fill="${c}"/>`};
const DASH={dot:'2 5',dash:'8 5'};
/* 수치 축 그림. o={x:[lo,hi,step,fmt], y:[lo,hi,step,fmt], series:[[이름, pts, 색, 무늬, 점 모양, 점 번호]], points:[[이름, x, y, 색, 모양, 글, dx, dy, 정렬]], refs:[[y, 글]], xl, yl, box:[L,R,T,B]}.
   범례는 그림 아래에 한 줄에 하나씩 둔다. */
function plot(o){
 const [L,R,T,B]=o.box||[70,620,40,220],[x0,x1,xs,xf]=o.x,[y0,y1,ys,yf]=o.y,X=v=>L+(v-x0)/(x1-x0)*(R-L),Y=v=>B-(v-y0)/(y1-y0)*(B-T);
 let s=`<path d="M${L} ${T}V${B}H${R}" fill="none" stroke="var(--muted)"/>`;
 for(let v=y0;v<=y1+1e-9;v+=ys)s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--line)" stroke-dasharray="2 5"/>`+t(L-8,Y(v)+4,yf(v),{size:12,fill:'var(--muted)',a:'end'});
 for(let v=x0;v<=x1+1e-9;v+=xs)s+=t(X(v),B+18,xf(v),{size:12,fill:'var(--muted)'});
 if(o.xl)s+=t(R,B+36,o.xl,{size:12,fill:'var(--muted)',a:'end'});if(o.yl)s+=t(L,T-12,o.yl,{size:12,fill:'var(--muted)',a:'start'});
 (o.refs||[]).forEach(([v,label])=>{s+=`<path d="M${L} ${Y(v).toFixed(1)}H${R}" stroke="var(--orange)" stroke-dasharray="7 5"/>`+(label?t(R,Y(v)-6,label,{size:12,fill:'var(--orange)',a:'end',w:700}):'');});
 (o.series||[]).forEach(([,pts,c,dash,shape,idx])=>{s+=`<path${dash?'':' class="fig-draw"'} d="M${pts.map(p=>`${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('L')}" fill="none" stroke="${c}" stroke-width="${dash?2:2.8}"${dash?` stroke-dasharray="${DASH[dash]}"`:''}/>`;(idx||[]).forEach(i=>{s+=MARK[shape](X(pts[i][0]),Y(pts[i][1]),c);});});
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
const A=M.ASSETS,U=M.ASSUME,F={};
F.diversify=()=>{
 const D=U.diversify,pts=Array.from({length:30},(_,i)=>[i+1,M.equalSigma(D.sigma,D.rho,i+1)*100]),floor=M.equalSigma(D.sigma,D.rho,Infinity),ns=[1,2,5,10,30];
 const g=plot({x:[0,30,5,v=>`N ${v}`],y:[0,35,5,v=>`${v}%`],xl:'같은 비중으로 담은 종목 수 N',yl:'표준편차 (%)',refs:[[floor*100,`바닥 σ√ρ = ${P(floor)}`]],series:[['동일 비중 N종목의 표준편차 (σ 30%, ρ 0.3)',pts,'var(--blue)',null,'●',ns.map(n=>n-1)]],
  points:ns.map((n,k)=>[null,n,pts[n-1][1],'var(--blue)','●',P(pts[n-1][1]/100),...[[10,-8,'start'],[10,-8,'start'],[0,24,'middle'],[0,-12,'middle'],[-6,24,'end']][k]])});
 return {svg:svg(`종목 수에 따른 표준편차: ${ns.map(n=>`N ${n} ${P(pts[n-1][1]/100)}`).join(', ')}, 바닥 ${P(floor)}`,g.s,g.h),caption:`σ 30%, ρ 0.3인 종목을 같은 비중으로 담을 때 종목 수 N에 따른 포트폴리오 표준편차(%, 연율)입니다. N 1·2·5·10·30에서 ${ns.map(n=>fx(pts[n-1][1],2)).join('·')}%이고, 종목을 아무리 늘려도 점선의 바닥 ${P(floor)} 아래로 내려가지 않습니다. 실제 계산이며 σ와 ρ는 미리 정한 가정입니다.`};
};
F.matrix=()=>{
 const idx=[1,2,3],names=['누리200','해외','채권'],cov=M.covMatrix(),C=idx.map(i=>idx.map(j=>cov[i][j])),e=M.checkCorr(idx.map(i=>idx.map(j=>A.corr[i][j]))),w=[0,0.5,0.3,0.2,0],v=M.portVar(w,cov),mx=Math.max(...C.flat().map(Math.abs));
 let s=t(40,24,'공분산 행렬 Σ (연율, 소수)',{size:13,w:700,a:'start'})+t(400,24,'상관 표의 고윳값 (작은 것부터)',{size:13,w:700,a:'start'});
 names.forEach((n,k)=>{s+=t(130+k*80,52,n,{size:12,fill:'var(--muted)'})+t(84,92+k*48,n,{size:12,fill:'var(--muted)',a:'end'});});
 C.forEach((row,i)=>row.forEach((x,j)=>{const o=(0.12+0.5*Math.abs(x)/mx).toFixed(2);s+=`<rect x="${92+j*80}" y="${64+i*48}" width="76" height="44" rx="4" fill="${x<0?'var(--orange)':'var(--blue)'}" fill-opacity="${o}" stroke="var(--line)"/>`+t(130+j*80,91+i*48,fx(x,5),{size:13,w:i===j?700:500});}));
 const zero=200,top=60,hi=2;e.values.forEach((x,k)=>{const h=x/hi*(zero-top),bx=420+k*66;s+=up(bx,zero-h,40,h,'var(--accent)',k*.15)+t(bx+20,zero-h-8,fx(x,3),{size:13,w:700})+t(bx+20,zero+18,`${k+1}`,{size:12,fill:'var(--muted)'});});
 s+=`<path d="M404 ${zero}H630" stroke="var(--muted)"/>`+t(404,zero+40,'모두 0 이상 ✓ · 합 3 = 자산 수',{size:12,fill:'var(--muted)',a:'start'})+t(40,230,`비중 50·30·20%: wᵀΣw = ${fx(v,5)}, σ ${P(Math.sqrt(v))}`,{size:13,a:'start',w:600});
 return {svg:svg(`공분산 행렬과 고윳값 ${e.values.map(x=>fx(x,3)).join(', ')}`,s,250),caption:`누리200·해외주식·채권 묶음의 σ와 ρ로 채운 공분산 행렬입니다. 대각선은 분산(18%² = 0.03240), 나머지는 ρσᵢσⱼ이고 음수 칸은 주황으로 칠했습니다. 비중 50·30·20%의 wᵀΣw는 ${fx(v,5)}, σ ${P(Math.sqrt(v))}입니다. 오른쪽은 실험이 계산한 상관 표의 고윳값 ${e.values.map(x=>fx(x,3)).join('·')}으로, 모두 0 이상이라 가능한 상관 행렬입니다. 실제 계산이며 σ·ρ는 미리 정한 가정입니다.`};
};
F.pair=()=>{
 const a=M.asset(1),b=M.asset(3),cur=r=>Array.from({length:41},(_,k)=>{const p=M.twoAsset(k/40,a,b,r);return [p.sigma*100,p.mu*100];}),rho=A.corr[1][3],wm=M.minVar2(a.sigma,b.sigma,rho),mv=M.twoAsset(wm,a,b,rho),p64=M.twoAsset(0.6,a,b,rho);
 const g=plot({x:[0,20,5,v=>`${v}%`],y:[3,7.5,1,v=>`${v}%`],xl:'표준편차 σ',yl:'기대수익 μ',series:[['상관 −0.2 (본문)',cur(rho),'var(--blue)',null],['상관 −1 (비교)',cur(-1),'var(--muted)','dot'],['상관 +1 (비교, 두 점을 잇는 곧은 선)',cur(1),'var(--muted)','dash']],
  points:[['누리200 · 채권 (두 자산)',18,7,'var(--muted)','■','누리200',-10,-8,'end'],[null,6,3.5,'var(--muted)','■','채권',8,16],[`최소분산: 주식 ${P(wm)} · σ ${P(mv.sigma)} · μ ${P(mv.mu)}`,mv.sigma*100,mv.mu*100,'var(--accent)','◆'],[`60/40: σ ${P(p64.sigma)} · μ ${P(p64.mu)}`,p64.sigma*100,p64.mu*100,'var(--orange)','▲']]});
 return {svg:svg(`두 자산 곡선: 최소분산 주식 ${P(wm)}, σ ${P(mv.sigma)}`,g.s,g.h),caption:`누리200(μ 7%, σ 18%)과 채권 묶음(3.5%, 6%)을 섞을 때의 기대수익–표준편차입니다. 상관이 −0.2인 실선은 상관 +1의 곧은 선보다 왼쪽으로 휘고, 가장 왼쪽 점(◆)이 최소분산 비중 주식 ${P(wm)}(σ ${P(mv.sigma)}, μ ${P(mv.mu)})입니다. 60/40(▲)은 σ ${P(p64.sigma)}입니다. 실제 계산이며 μ·σ·ρ는 미리 정한 가정입니다.`};
};
F.frontier=()=>{
 const tan=M.tangency(true),fr=M.frontier(25,true),cm=M.cashMix(tan,U.cashTarget),st=[0,0.4,0.2,0.4,0],sm=M.portMu(st),ss=M.portSigma(st),rf=U.rf*100,end=20;
 const g=plot({x:[0,20,5,v=>`${v}%`],y:[2,7.5,1,v=>`${v}%`],xl:'표준편차 σ',yl:'기대수익 μ',series:[['효율적 투자선 (공매도 없음)',fr.map(p=>[p.sigma*100,p.mu*100]),'var(--blue)',null],[`자본시장선 (현금 ${fx(rf,1)}% ↔ 접점)`,[[0,rf],[end,rf+tan.sharpe*end]],'var(--accent)','dash']],
  points:[[null,18,7,'var(--muted)','■','누리200',-10,-8,'end'],[null,16,6.5,'var(--muted)','■','해외',-10,16,'end'],[null,6,3.5,'var(--muted)','■','채권',8,16],[`접점 ${tan.w.map(x=>fx(x*100,2)).join('·')}% · 샤프 ${fx(tan.sharpe,4)}`,tan.sigma*100,tan.mu*100,'var(--accent)','●'],
   [`접점 ${P(cm.share)} + 현금 ${P(cm.cash)} → σ 5%, μ ${P(cm.mu)}`,5,cm.mu*100,'var(--accent)','○'],[`처음 상태 40·20·40%: σ ${P(ss)}, μ ${P(sm)}`,ss*100,sm*100,'var(--orange)','▲']]});
 return {svg:svg(`효율적 투자선과 접점 ${tan.w.map(x=>P(x)).join('·')}`,g.s,g.h),caption:`누리200·해외주식·채권 묶음으로 만든 효율적 투자선(공매도 없음)과, 무위험 금리 ${fx(rf,1)}%에서 그 선에 닿는 자본시장선입니다. 접점(●)은 ${tan.w.map(x=>fx(x*100,2)).join('·')}%로 샤프 비율 ${fx(tan.sharpe,4)}이고, 현금과 섞어 σ 5%에 맞추면 μ ${P(cm.mu)}입니다. 비중은 ${A.weightsNote}.`};
};
F.beta=()=>{
 const m=U.months.market,st=U.months.stock,b=M.beta(),line=[[-5,b.alpha-5*b.beta],[6,b.alpha+6*b.beta]];
 const g=plot({x:[-5,6,1,v=>fx(v,0)],y:[-6,10,2,v=>fx(v,0)],xl:'시장(누리200) 월간 수익률 (%)',yl:'종목(새벽전자) 월간 수익률 (%)',box:[70,620,40,250],series:[[`회귀선: 기울기 = 베타 ${fx(b.beta,4)}`,line,'var(--accent)',null]],points:m.map((x,i)=>[i?null:'한 달의 (시장, 종목) 수익률 · 12개월',x,st[i],'var(--blue)','●'])});
 return {svg:svg(`산점도와 회귀선, 베타 ${fx(b.beta,4)}`,g.s,g.h),caption:`12개월 가상 자료의 산점도와 회귀선입니다. 회귀선의 기울기가 베타 ${fx(b.beta,4)}(공분산 ÷ 시장 분산, 표본 n − 1)이고 상관은 ${fx(b.corr,4)}입니다. 새벽전자는 시장이 1% 움직일 때 평균 약 ${fx(b.beta,2)}% 움직였습니다. 실제 계산이며 자료는 미리 정한 가상 자료입니다.`};
};
F.mix=()=>{
 const rows=U.mixes.map(w=>M.mix(...w)),lab=U.mixes.map(w=>w.map(x=>Math.round(x*100)).join('/')),items=[];
 rows.forEach((r,i)=>{items.push([lab[i],'σ',r.sigma*100,'var(--blue)',P(r.sigma)]);items.push([lab[i],'μ − 2σ',r.bad*100,'var(--orange)',P(r.bad)]);});
 const s=t(20,22,'배분별 표준편차(위)와 나쁜 해 어림 μ − 2σ(아래), %',{size:13,w:700,a:'start'})+bars(items,{L:30,R:630,T:50,zero:150,hi:25});
 return {svg:svg(`배분별 표준편차 ${rows.map((r,i)=>`${lab[i]} ${P(r.sigma)}`).join(', ')}`,s,290),caption:`주식(누리200)·채권 묶음·현금 비중별 표준편차(파랑, 위)와 μ − 2σ(주황, 아래)입니다. 80/10/10에서 20/70/10으로 갈수록 σ가 ${rows.map(r=>fx(r.sigma*100,2)).join('→')}%로 줄어듭니다. μ − 2σ는 정규분포를 가정한 어림이라 실제 나쁜 해는 더 나쁠 수 있습니다. 실제 계산이며 μ·σ·ρ는 미리 정한 가정입니다.`};
};
F.rebalance=()=>{
 const R=['none','annual','band'].map(k=>M.rebalance(k)),names=['되돌리지 않음','연 1회','±5%p'],cols=['var(--muted)','var(--blue)','var(--accent)'],shapes=['○','●','◆'],dash=['dot',null,'dash'];
 const g=plot({x:[0,4,1,v=>v?`${v}년`:'시작'],y:[50,70,5,v=>`${v}%`],xl:'연말 (되돌리기 전)',yl:'주식 비중 (%)',refs:[[65,'목표 + 5%p'],[55,'목표 − 5%p']],series:R.map((r,k)=>[`${names[k]} · 4년 뒤 ${M.wonText(r.end)}`,[[0,60],...r.rows.map(x=>[x.year,x.weight*100])],cols[k],dash[k],shapes[k],[1,2,3,4]])});
 return {svg:svg(`세 규칙의 연말 주식 비중과 끝 금액 ${R.map((r,k)=>`${names[k]} ${M.wonText(r.end)}`).join(', ')}`,g.s,g.h),caption:`1억 원 60/40으로 시작한 4년 가상 경로에서 연말 주식 비중(되돌리기 전)입니다. 1년째에는 세 규칙 모두 ${P(R[0].rows[0].weight)}로 같고, 그 뒤에는 되돌린 규칙만 목표 60% 가까이에서 출발합니다. 끝 금액은 범례에 있으며 그 순서는 이 경로에서만 성립합니다. 매매 비용·세금은 넣지 않았습니다.`};
};
F.kelly=()=>{
 const K=U.kelly,fs=M.kellyF(K.p,K.b),pts=Array.from({length:61},(_,k)=>{const f=0.33*k/60;return [f,M.growth(f,K.p,K.b)];}),tb=M.kellyTable();
 const at=m=>tb.find(r=>r.multiple===m),one=at(1),two=at(2),three=at(3);
 const g=plot({x:[0,0.33,0.05,v=>fx(v,2)],y:[-0.02,0.008,0.004,v=>fx(v,3)],xl:'거는 비율 f',yl:'한 번의 기대 로그 성장률 g(f)',refs:[[0,'성장률 0']],series:[['g(f) (p 0.55, b 1)',pts,'var(--blue)',null]],
  points:[[`f* ${fx(fs,3)}: g ${fx(one.g,4)} · 100번 뒤 중앙값 ${fx(one.median,3)}배 · 하위 10% ${fx(one.low10,3)}배`,fs,one.g,'var(--accent)','●','f* (가장 높음)',0,-12,'middle'],[`2배 ${fx(two.f,3)}: g ${fx(two.g,4)} · 하위 10% ${fx(two.low10,3)}배`,two.f,two.g,'var(--orange)','◆','2배',0,22,'middle'],[`3배 ${fx(three.f,3)}: g ${fx(three.g,4)}`,three.f,three.g,'var(--orange)','■','3배',-10,4,'end']]});
 return {svg:svg(`켈리 성장률 곡선, f* ${fx(fs,3)}`,g.s,g.h),caption:`이기면 건 돈만큼 받고 지면 건 돈을 잃는 내기(p 0.55, b 1)에서 거는 비율에 따른 장기 성장률입니다. 곡선은 켈리 비율 f* ${fx(fs,3)}에서 가장 높고, 2배로 걸면 0 근처(${fx(two.g,4)}), 3배면 ${fx(three.g,4)}로 내려갑니다. 100번 뒤 한 번이라도 절반 아래로 떨어진 경로는 f*에서 ${P(one.belowHalf,1)}, 2배에서 ${P(two.belowHalf,1)}입니다. 계산 연습입니다.`};
};
F.crisis=()=>{
 const C=U.crisis6040,F4=U.crisisFour,two=(c)=>M.twoAsset(0.6,{sigma:c.s1},{sigma:c.s2},c.rho).sigma,a=M.equalSigma(F4.sigma,F4.rho[0],F4.n),b=M.equalSigma(F4.sigma,F4.rho[1],F4.n),n0=two(C.normal),so=two({...C.crisis,rho:C.normal.rho}),c1=two(C.crisis);
 const items=[['네 종목','평상시',a*100,'var(--blue)',P(a)],['네 종목','위기',b*100,'var(--orange)',P(b)],['60/40','평상시',n0*100,'var(--blue)',P(n0)],['60/40','위기 σ만',so*100,'var(--muted)',P(so)],['60/40','위기',c1*100,'var(--orange)',P(c1)]];
 const s=t(20,22,'같은 비중의 표준편차 (%): 평상시(파랑)와 위기(주황)',{size:13,w:700,a:'start'})+bars(items,{L:40,R:630,T:50,zero:220,hi:25});
 return {svg:svg(`평상시와 위기의 표준편차: 네 종목 ${P(a)} → ${P(b)}, 60/40 ${P(n0)} → ${P(c1)}`,s,270),caption:`비중은 그대로 두고 상관과 σ만 위기 값으로 바꾼 표준편차입니다. 네 종목(σ 25%)은 상관 0.3 → 0.8에서 ${P(a)} → ${P(b)}, 60/40은 평상시 ${P(n0)}, 위기 σ만 넣으면 ${P(so)}, 위기 상관(+0.5)까지 넣으면 ${P(c1)}입니다. 위기 상관과 σ는 이 책의 가정이며 “위기에는 상관이 1이 된다”는 사실이 아닙니다.`};
};
F.final=()=>{
 const Y=U.yoon,e=M.checkCorr(M.crisisCorr(undefined,4)),items=Y.scenario.map((r,i)=>[A.names[i].replace(' 묶음',''),'',r*100,r<0?'var(--orange)':'var(--blue)',`${r>0?'+':''}${fx(r*100,1)}%`]);
 let s=t(20,22,'위기 시나리오 한 해 수익률 (가정, %)',{size:13,w:700,a:'start'})+bars(items,{L:20,R:400,T:40,zero:80,hi:20,gap:76});
 s+=t(420,22,'위기 상관 행렬의 고윳값',{size:13,w:700,a:'start'});e.values.forEach((x,k)=>{const h=x/3*(150-50),bx=430+k*50;s+=up(bx,150-h,30,h,'var(--accent)',k*.12)+t(bx+15,150-h-8,fx(x,3),{size:12,w:700})+t(bx+15,168,`${k+1}`,{size:12,fill:'var(--muted)'});});
 s+=`<path d="M420 150H630" stroke="var(--muted)"/>`+t(420,188,'모두 0 이상 ✓ (가능한 상관 행렬)',{size:12,fill:'var(--muted)',a:'start'});
 s+=`<rect x="20" y="214" width="600" height="58" rx="6" fill="none" stroke="var(--line)"/>`+t(34,238,`조건 1 · 위기 시나리오 한 해 손실 ≤ ${M.wonText(Y.lossLimit)} (자산 3억 원의 −15%)`,{size:13,a:'start',w:600})+t(34,260,`조건 2 · 채권·현금 ≥ ${M.wonText(Y.livingCost*Y.years)} (생활비 연 3,000만 원 × 3년, 가정)`,{size:13,a:'start',w:600});
 return {svg:svg(`위기 시나리오 수익률과 위기 상관 행렬의 고윳값 ${e.values.map(x=>fx(x,3)).join(', ')}, 두 조건`,s,290),caption:`윤 씨(가상)의 비중을 판정할 때 쓰는 재료입니다. 왼쪽은 위기 시나리오 한 해 수익률(가정)이고, 오른쪽은 위험자산 넷의 위기 상관 행렬(주식끼리 0.9, 주식·채권 +0.3)에 대해 실험이 계산한 고윳값 ${e.values.map(x=>fx(x,3)).join('·')}으로 모두 0 이상입니다. 아래 두 조건에 비중을 넣어 판정하는 일은 과제에서 직접 합니다.`};
};
function render(id){return F[id]?F[id]():null;}root.AFigures={render};
})(typeof window!=='undefined'?window:this);
