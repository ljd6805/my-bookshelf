/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 모두 MMath(js/math.js)로 하린의 1,000만 원과 600만 원 대출을 실제로 계산해 그린다.
   움직임은 style.css의 fig-* 애니메이션(fig-dash·fig-pkt·fig-seq·fig-grow·fig-draw·fig-pulse)이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   1장과 10장의 저울은 시각적 비유이고, 8장 수익률 경로와 10장 투자 수익률은 정해 둔 예시다. */
(function(root){
'use strict';
const M=root.MMath||(typeof require==='function'?require('./math.js'):null);
const won=n=>Math.round(n).toLocaleString('ko-KR');
const man=n=>(Math.round(n/1e3)/10).toLocaleString('ko-KR');
const svg=(label,body,h=260)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||14}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const arrow=(x1,y,x2,stroke='var(--muted)')=>line(`M${x1} ${y}H${x2}`,stroke)+`<path d="M${x2+(x2>x1?-7:7)} ${y-5}L${x2} ${y}L${x2+(x2>x1?-7:7)} ${y+5}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay)=>`<g class="fig-seq" style="animation-delay:${delay}s">${body}</g>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const up=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow fig-up" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${Math.max(h,1)}" rx="2" fill="${color}"/>`;
const note=(s,y=248)=>t(320,y,s,{size:12,fill:'var(--muted)'});
const path=(pts,stroke,dash='',w=3)=>`<path class="fig-draw" d="${pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('')}" fill="none" stroke="${stroke}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
const coins=(x,y,n,c)=>Array.from({length:n},(_,i)=>`<ellipse cx="${x}" cy="${y-i*8}" rx="26" ry="7" fill="var(--panel2)" stroke="${c}" stroke-width="2"/>`).join('');
const F={};
F.today=()=>{
 const later=M.compoundFV(1e7,3,1);
 let s=`<path d="M320 70V210M280 210H360" stroke="var(--text)" stroke-width="3"/><path d="M150 70H490" stroke="var(--text)" stroke-width="4" stroke-linecap="round"/><circle class="fig-pulse" cx="320" cy="70" r="7" fill="var(--accent)"/>`;
 s+=`<path d="M150 70V120M490 70V120" stroke="var(--muted)"/><path d="M100 124H200M440 124H540" stroke="var(--text)" stroke-width="3"/>`+coins(150,116,4,'var(--accent)')+coins(490,116,4,'var(--blue)');
 s+=t(150,152,'오늘 1,000만 원',{size:14,w:700})+t(150,172,`연 3%로 1년 → ${won(later)}원`,{size:12,fill:'var(--muted)'})+t(490,152,'1년 뒤 1,030만 원',{size:14,w:700})+t(490,172,'친구의 약속',{size:12,fill:'var(--muted)'});
 s+=dot(176,60,288,0,'var(--accent)',0,6)+t(320,40,'금리라는 추: × (1 + 0.03)',{size:13,fill:'var(--accent)',w:700});
 return {svg:svg('오늘 1,000만 원을 연 3%로 1년 옮기면 1,030만 원이 되어, 친구가 약속한 1년 뒤 1,030만 원과 저울이 균형을 이루는 그림',s+note('같은 시점으로 옮긴 뒤에야 두 접시를 견줄 수 있습니다.',236)),caption:'오늘 1,000만 원을 연 3%로 1년 뒤로 옮기면 1,030만 원이 되어 친구의 약속과 균형을 이룹니다. 금리가 4%면 왼쪽이, 2%면 오른쪽이 무거워집니다.'};
};
F.compound=()=>{
 const X=y=>60+y/30*540,Y=v=>210-(v-1e7)/(1.5e7)*180,yrs=Array.from({length:31},(_,i)=>i);
 let s=`<path d="M60 30V210H600" stroke="var(--line)" fill="none"/>`+[1e7,1.5e7,2e7,2.5e7].map(v=>t(52,Y(v)+4,`${v/1e4}만`,{a:'end',size:11,fill:'var(--muted)'})).join('')+[0,10,20,30].map(y=>t(X(y),228,`${y}년`,{size:11,fill:'var(--muted)'})).join('');
 s+=path(yrs.map(y=>[X(y),Y(M.simpleFV(1e7,3,y))]),'var(--blue)','7 5')+path(yrs.map(y=>[X(y),Y(M.compoundFV(1e7,3,y))]),'var(--accent)');
 const c10=M.compoundFV(1e7,3,10),c30=M.compoundFV(1e7,3,30);
 s+=`<circle class="fig-pulse" cx="${X(10)}" cy="${Y(c10)}" r="5" fill="var(--orange)"/>`+t(X(10),Y(c10)-14,`10년: 복리 ${won(c10)}원 · 단리 1,300만`,{size:12,fill:'var(--orange)'});
 s+=t(X(30)-4,Y(c30)-10,`30년 복리 ${man(c30)}만`,{a:'end',size:12,fill:'var(--accent)',w:700})+t(X(30)-4,Y(1.9e7)+20,'단리 1,900만',{a:'end',size:12,fill:'var(--blue)'});
 return {svg:svg('1,000만 원을 연 3%로 30년 둘 때 단리는 1,900만 원까지 직선으로, 복리는 약 2,427만 원까지 점점 가팔라지는 곡선으로 늘어나는 그래프',s+note('세로축: 쌓인 돈. 점선은 단리, 실선은 복리입니다.',250)),caption:`단리는 해마다 30만 원씩 같은 기울기로, 복리는 이자가 붙는 바탕이 커지며 곡선으로 늘어납니다. 10년 뒤 차이는 ${won(c10-1.3e7)}원, 30년 뒤는 ${won(c30-1.9e7)}원입니다.`};
};
F.rule72=()=>{
 const rates=[3,6,9,12],Y=v=>210-v/25*170;
 let s=`<path d="M60 30V210H600" stroke="var(--line)" fill="none"/>`+[0,10,20].map(v=>t(52,Y(v)+4,`${v}년`,{a:'end',size:11,fill:'var(--muted)'})).join('');
 rates.forEach((r,i)=>{const x=110+i*130,a=M.rule72(r),b=M.doublingYears(r);s+=up(x,Y(a),40,210-Y(a),'var(--blue)',.2*i)+up(x+44,Y(b),40,210-Y(b),'var(--accent)',.2*i+.1)+t(x+42,228,`연 ${r}%`,{size:13,w:700})+t(x+20,Y(a)-6,a.toFixed(1),{size:11,fill:'var(--blue)'})+t(x+64,Y(b)-6,b.toFixed(1),{size:11,fill:'var(--accent)'});});
 s+=`<rect x="420" y="26" width="12" height="12" fill="var(--blue)"/>`+t(438,37,'72 ÷ 금리',{a:'start',size:12})+`<rect x="520" y="26" width="12" height="12" fill="var(--accent)"/>`+t(538,37,'정확한 값',{a:'start',size:12});
 return {svg:svg('연 3, 6, 9, 12%에서 72의 법칙으로 어림한 두 배 걸리는 해와 정확한 값을 나란히 놓은 막대그래프. 둘이 거의 같다',s+note(`달마다 붙이는 연 3%의 실효 금리는 ${M.ear(3,12).toFixed(4)}%입니다.`,250)),caption:`72의 법칙(파랑)과 정확한 값 ln 2 ÷ ln(1 + 금리)(초록)은 4~12% 근처에서 거의 겹칩니다. 연 6%면 12년과 ${M.doublingYears(6).toFixed(2)}년입니다.`};
};
F.discount=()=>{
 const vals=[3,2,1,0].map(k=>M.pv(1.1e7,3,k));
 let s='';
 vals.forEach((v,i)=>{const x=470-i*150,c=i===3?'var(--accent)':'var(--line)';s+=box(x,90,120,70,c)+t(x+60,118,i===0?'3년 뒤':i===3?'오늘':`${3-i}년 뒤`,{size:13,fill:'var(--muted)'})+t(x+60,144,`${won(v)}`,{size:14,w:700});if(i<3)s+=arrow(x-4,125,x-26,'var(--muted)')+t(x-15,112,'÷1.03',{size:11,fill:'var(--muted)'});});
 s+=dot(530,76,-450,0,'var(--accent)',0,6)+t(320,50,'복리를 거꾸로: 해마다 1.03으로 나눕니다',{size:13,fill:'var(--accent)',w:700});
 return {svg:svg('3년 뒤 1,100만 원을 해마다 1.03으로 나누어 오늘 10,066,558원으로 데려오는 그림',s+note('할인율 3%는 하린이 다른 곳에서 확실하게 받을 수 있는 금리라는 가정입니다.',220),240),caption:`3년 뒤 1,100만 원을 할인율 3%로 한 해씩 거꾸로 옮기면 오늘 ${won(vals[3])}원입니다.`};
};
F.loan=()=>{
 const S=M.schedule(6e6,6,36,'level'),sav=M.savings(5e5,12,3),lump=M.lumpInterest(6e6,3,12),bw=13,Y=v=>200-v/2e5*150;
 let s=`<path d="M40 200H520" stroke="var(--line)"/>`;
 S.rows.forEach((r,i)=>{const x=46+i*bw;s+=up(x,Y(r.principal),bw-2,r.principal/2e5*150,'var(--blue)',i*.03)+up(x,Y(r.interest+r.principal),bw-2,r.interest/2e5*150,'var(--orange)',i*.03);});
 s+=t(46,40,`원리금균등 600만 원 · 연 6% · 36개월: 달마다 ${won(S.first.pay)}원`,{a:'start',size:13,w:700})+t(46,218,`첫 달 이자 ${won(S.first.interest)}원`,{a:'start',size:11,fill:'var(--orange)'})+t(520,218,`36개월째 이자 ${won(S.last.interest)}원`,{a:'end',size:11,fill:'var(--orange)'});
 s+=box(536,70,96,110,'var(--accent)')+t(584,94,'적금 거울',{size:12,w:700})+t(584,116,'50만 × 12',{size:11,fill:'var(--muted)'})+t(584,140,`이자 ${won(sav.interest)}`,{size:12,fill:'var(--accent)'})+t(584,162,`(${won(lump)} 아님)`,{size:11,fill:'var(--muted)'});
 return {svg:svg(`600만 원을 연 6%로 36개월 원리금균등 상환할 때 달마다 내는 돈 가운데 이자 몫은 줄고 원금 몫은 늘어나는 막대그래프, 그리고 50만 원씩 12개월 적금의 이자가 ${won(sav.interest)}원이라는 상자`,s+note('주황은 이자, 파랑은 원금 몫입니다. 막대 높이는 같고 안의 비율만 바뀝니다.',246)),caption:`달마다 ${won(S.first.pay)}원을 내는 동안 이자 몫은 ${won(S.first.interest)}원에서 ${won(S.last.interest)}원으로 줄고 원금 몫이 커집니다. 3년 이자 합계는 ${won(S.totalInterest)}원입니다.`};
};
F.npv=()=>{
 const flows=[-100,60,60],X=r=>60+r/30*540,Y=v=>120-v/25*90,root=M.irr(flows)[0],grid=Array.from({length:61},(_,i)=>i*.5);
 let s=`<path d="M60 20V230M60 ${Y(0)}H600" stroke="var(--line)" fill="none"/>`+[0,10,20,30].map(r=>t(X(r),Y(0)+18,`${r}%`,{size:11,fill:'var(--muted)'})).join('')+[20,-20].map(v=>t(52,Y(v)+4,v,{a:'end',size:11,fill:'var(--muted)'})).join('');
 s+=path(grid.map(r=>[X(r),Y(M.npv(r,flows))]),'var(--accent)');
 const v5=M.npv(5,flows);s+=`<circle cx="${X(5)}" cy="${Y(v5)}" r="5" fill="var(--blue)"/>`+t(X(5)+8,Y(v5)-10,`5% → +${v5.toFixed(2)}만`,{a:'start',size:12,fill:'var(--blue)'});
 s+=`<circle class="fig-pulse" cx="${X(root)}" cy="${Y(0)}" r="6" fill="var(--orange)"/>`+t(X(root),Y(0)-14,`IRR ${root.toFixed(2)}%`,{size:13,fill:'var(--orange)',w:700});
 return {svg:svg(`현금흐름 −100, 60, 60의 순현재가치가 할인율이 오를수록 줄어들어 할인율 5%에서 약 11.56만 원, ${root.toFixed(2)}%에서 0이 되는 곡선`,s+note('가로축: 할인율, 세로축: NPV(만 원). 곡선이 0선을 지나는 곳이 IRR입니다.',250)),caption:`[−100, 60, 60]의 NPV는 할인율 5%에서 +${v5.toFixed(2)}만 원이고, ${root.toFixed(2)}%에서 0이 됩니다. 이 할인율이 내부수익률입니다.`};
};
F.inflation=()=>{
 const r=M.real(3,2,15.4),steps=[['명목',3,'var(--blue)'],['세금 15.4% 뗀 뒤',r.after,'var(--blue)'],['물가 2% 뺀 뒤',r.exact,'var(--accent)']],Y=v=>200-v/3.2*160;
 let s=`<path d="M60 200H600" stroke="var(--line)"/>`;
 steps.forEach(([n,v,c],i)=>{const x=110+i*170;s+=up(x,Y(v),100,200-Y(v),c,.3*i)+t(x+50,Y(v)-8,`${v.toFixed(3)}%`,{size:14,w:700,fill:c})+t(x+50,222,n,{size:12});if(i<2)s+=arrow(x+106,Y(v)+20,x+164,'var(--orange)');});
 return {svg:svg(`명목 금리 3%가 세금 15.4%를 떼면 2.538%, 물가 2%를 빼면 실질 ${r.exact.toFixed(3)}%로 줄어드는 계단 막대`,s+note('실질 수익률 = (1 + 세후 금리) ÷ (1 + 물가) − 1',246)),caption:`예금 금리 3%에서 세금을 떼면 ${r.after}%, 물가 2%를 빼면 손에 남는 구매력은 연 ${r.exact.toFixed(3)}%만 늘어납니다.`};
};
F.cagr=()=>{
 const R=M.cagr([50,-50],1e7),X=y=>120+y*200,Y=v=>200-v/1.6e7*170,pts=[[0,1e7],[1,1.5e7],[2,R.end]];
 let s=`<path d="M100 200H560" stroke="var(--line)"/>`+path(pts.map(([y,v])=>[X(y),Y(v)]),'var(--accent)')+path([[X(0),Y(1e7)],[X(2),Y(1e7)]],'var(--blue)','7 5',2);
 pts.forEach(([y,v],i)=>{s+=blink(`<circle cx="${X(y)}" cy="${Y(v)}" r="6" fill="var(--accent)"/>`+t(X(y),Y(v)-14,`${won(v/1e4)}만`,{size:13,w:700}),i*.5);s+=t(X(y),222,`${y}년`,{size:12,fill:'var(--muted)'});});
 s+=t(X(.5),Y(1.25e7)-24,'+50%',{size:13,fill:'var(--accent)'})+t(X(1.5),Y(1.1e7)-24,'−50%',{size:13,fill:'var(--orange)'})+t(X(2)+10,Y(1e7)+4,'산술 평균 0%라면',{a:'start',size:12,fill:'var(--blue)'})+t(X(2)+10,Y(R.end)+4,`CAGR ${R.cagr.toFixed(1)}%`,{a:'start',size:13,fill:'var(--orange)',w:700});
 return {svg:svg('1,000만 원이 +50%로 1,500만 원이 되었다가 −50%로 750만 원이 되어, 산술 평균은 0%인데 연환산 수익률은 약 −13.4%인 그림',s+note('수익률은 더하지 않고 곱합니다. 수익률 경로는 정해 둔 예시입니다.',250)),caption:`+50%와 −50%의 산술 평균은 0%지만 1,000만 원은 ${won(R.end)}원이 됩니다. 처음과 끝으로 계산한 연환산 수익률은 ${R.cagr.toFixed(1)}%입니다.`};
};
F.fees=()=>{
 const X=y=>60+y/30*480,Y=v=>210-v/6e7*180,yrs=Array.from({length:31},(_,i)=>i),cases=[[0,'var(--blue)','7 5','비용 0%'],[.1,'var(--accent)','','0.1%'],[1,'var(--orange)','','1%']];
 let s=`<path d="M60 30V210H540" stroke="var(--line)" fill="none"/>`+[1e7,3e7,5e7].map(v=>t(52,Y(v)+4,`${v/1e4}만`,{a:'end',size:11,fill:'var(--muted)'})).join('')+[0,10,20,30].map(y=>t(X(y),228,`${y}년`,{size:11,fill:'var(--muted)'})).join('');
 cases.forEach(([f,c,d,n])=>{const end=M.feeDrag(1e7,6,f,30).withFee;s+=path(yrs.map(y=>[X(y),Y(M.feeDrag(1e7,6,f,y).withFee)]),c,d)+t(546,Y(end)+(f===.1?14:4),`${n} ${man(end)}만`,{a:'start',size:12,fill:c,w:700});});
 const gap=M.feeDrag(1e7,6,1,30);s+=`<path class="fig-pulse" d="M${X(30)} ${Y(gap.noFee)}V${Y(gap.withFee)}" stroke="var(--orange)" stroke-width="4"/>`;
 return {svg:svg(`1,000만 원이 연 6%로 30년 불어날 때 비용이 없으면 약 5,743만 원, 비용 0.1%면 약 5,574만 원, 1%면 약 4,248만 원이 되는 세 곡선`,s+note('비용을 해마다 한 번 뗀다고 본 계산입니다. 수익률 6%는 가정입니다.',250)),caption:`비용 1%는 30년 뒤 쌓였어야 할 돈의 ${gap.lostShare.toFixed(0)}%(${won(gap.lost)}원)를 가져갑니다. 0.1%면 약 3%입니다.`};
};
F.final=()=>{
 const r=M.repayVsInvest(6e6,6,3,[-10,5,8],.1,0),Y=v=>210-v/8e6*180,items=[['상환',r.repay,'확실','var(--accent)'],...r.invest.map(x=>[`투자 ${x.rate}%`,x.end,'가정','var(--blue)'])];
 let s=`<path d="M60 210H600" stroke="var(--line)"/><path class="fig-dash" d="M60 ${Y(r.repay)}H600" stroke="var(--accent)" stroke-width="1.5"/>`;
 items.forEach(([n,v,k,c],i)=>{const x=90+i*130;s+=up(x,Y(v),80,210-Y(v),c,.25*i)+t(x+40,Y(v)-8,`${man(v)}만`,{size:13,w:700})+t(x+40,228,n,{size:12})+t(x+40,244,k,{size:11,fill:k==='확실'?'var(--accent)':'var(--muted)'});});
 s+=t(600,Y(r.repay)-8,`같아지는 수익률 연 ${r.breakEven.toFixed(2)}%`,{a:'end',size:12,fill:'var(--accent)'});
 return {svg:svg(`600만 원을 연 6% 대출 상환에 쓰면 3년 뒤 약 714.6만 원이 확실하고, 투자하면 −10%에서 약 436.1만, 5%에서 약 692.5만, 8%에서 약 753.6만 원이 되는 막대`,s,256),caption:`같은 3년 뒤로 옮기면 상환은 ${won(r.repay)}원으로 확실하고, 투자는 가정한 수익률에 따라 ${won(r.invest[0].end)}원에서 ${won(r.invest[2].end)}원까지 갈립니다. 비용 0.1%를 뗀 뒤 연 ${r.breakEven.toFixed(2)}%를 꾸준히 벌어야 같아집니다.`};
};
function render(id){return F[id]?F[id]():null;}
root.MFigures={render};
})(typeof window!=='undefined'?window:this);
