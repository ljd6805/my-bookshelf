/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 LWMath로 16×16 장난감 세계를 실제로 계산해 그린다.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다. */
window.LWFigures=(()=>{
'use strict';
const M=LWMath,f=(n,d=2)=>Number(n).toFixed(d),pc=(p,d=1)=>`${(p*100).toFixed(d)}%`;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const svg=(label,body,h=280)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${esc(s)}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const pkt=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const up=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow fig-up" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${w}" height="${Math.max(h,1)}" rx="3" fill="${color}"/>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const base=(y=230)=>line(`M40 ${y}H620`,'var(--line)','');
/* 행렬 칸 그림: 진하기는 크기, 색은 부호. x·y는 왼쪽 위, cell은 칸 한 변. */
function cells(A,x,y,cell=8,cls=''){const top=Math.max(...A.flat().map(Math.abs),1e-9);return `<g class="${cls}">${A.map((row,i)=>row.map((v,j)=>`<rect x="${x+j*cell}" y="${y+i*cell}" width="${cell-1}" height="${cell-1}" fill="${v<0?'var(--orange)':'var(--accent)'}" fill-opacity="${Math.min(1,Math.abs(v)/top).toFixed(2)}"/>`).join('')).join('')}</g>`;}
/* 특잇값 막대 한 묶음: 앞 on개를 강조색으로 세운다. */
function sigmas(s,x0,{on=0,scale=30,w=14,step=18,top=230,color='var(--blue)'}={}){return s.map((v,i)=>up(x0+i*step,top-v*scale,w,v*scale,i<on?'var(--accent)':color,i*.04)).join('');}
/* 점과 선으로 그린 곡선 하나. pts는 [0,1] 범위로 정규화된 [x,y]. */
function curve(pts,color,{L=70,R=600,T=50,B=230,dash=false}={}){
 const p=pts.map(([x,y])=>[L+x*(R-L),B-Math.max(0,Math.min(1,y))*(B-T)]);
 return `<path class="fig-draw" d="${p.map((q,i)=>`${i?'L':'M'}${f(q[0],1)} ${f(q[1],1)}`).join('')}" fill="none" stroke="${color}" stroke-width="2.6"${dash?' stroke-dasharray="6 5"':''}/>`+p.map(q=>`<circle cx="${f(q[0],1)}" cy="${f(q[1],1)}" r="4" fill="${color}"/>`).join('');
}
let toneCache=null;
const tone=()=>toneCache||(toneCache=(()=>{const w=M.makeWorld({family:'tone'}),ft=M.fullFinetune(w);return {w,ft,dec:M.svd(ft.dW)};})());
const draw={
 overview(){const {w}=tone(),lo=M.trainLora(w,{r:3}),BA=M.scale(M.matmul(lo.B,lo.A),lo.gamma);
  const body=t(320,26,'새 가중치 = W₀(그대로) + B·A(학습), 말투 작업 r = 3',{w:700})+cells(w.W0,30,56,8)+t(94,206,'W₀ · 그대로 둠',{size:13})+t(178,124,'+',{size:26})+cells(lo.B,200,56,8,'fig-seq')+t(212,206,'B 16×3',{size:13,fill:'var(--accent)'})+t(246,124,'×',{size:22})+cells(lo.A,266,108,8,'fig-seq')+t(330,148,'A 3×16',{size:13,fill:'var(--accent)'})+t(410,124,'=',{size:26})+cells(BA,434,56,8,'fig-seq')+t(498,206,'B·A · 변화량',{size:13,fill:'var(--accent)'})+t(320,246,`학습하는 수 ${lo.params}개 (층 전체 256개의 ${pc(lo.params/256)}) · 필요한 변화의 ${pc(lo.gain)}를 메움`,{size:14});
  return {svg:svg('사전학습 가중치 W₀은 그대로 두고, 세로로 긴 B와 가로로 긴 A를 곱해 만든 변화량을 더하는 LoRA의 칸 그림',body,265),caption:`W₀은 그대로 두고 B(16×3)와 A(3×16)의 숫자 ${lo.params}개만 학습합니다. 둘을 곱한 변화량은 줄무늬가 많아야 3개 겹친 모양이고, 말투 작업에 필요한 변화의 ${pc(lo.gain)}를 메웁니다.`};},
 delta(){const {w,ft}=tone(),r=M.frob(ft.dW)/M.frob(w.W0);
  const body=t(320,26,'W₁ − W₀ = ΔW (말투 작업, 300걸음)',{w:700})+cells(w.W0,40,50,8)+t(104,198,`W₀ · 크기 ${f(M.frob(w.W0))}`,{size:13})+t(190,118,'→',{size:26})+cells(ft.W,220,50,8)+t(284,198,'W₁ (미세조정 뒤)',{size:13})+t(372,118,'−  W₀  =',{size:18})+cells(ft.dW,440,50,8,'fig-seq')+t(504,198,`ΔW · 크기 ${f(M.frob(ft.dW))}`,{size:13,fill:'var(--accent)'})+grow(220,224,400*r,14,'var(--accent)')+grow(220,244,400,14,'var(--blue)',.2)+t(212,236,'‖ΔW‖',{size:12,a:'end'})+t(212,256,'‖W₀‖',{size:12,a:'end'})+t(226+400*r,236,pc(r),{size:12,w:700,a:'start'});
  return {svg:svg('사전학습 가중치, 미세조정 뒤 가중치, 그 차이 ΔW의 칸 그림과 크기 막대',body,270),caption:`W₀와 W₁은 눈으로 구별하기 어렵지만, 둘을 빼면 줄무늬가 있는 ΔW가 남습니다. 크기는 W₀의 ${pc(r)}입니다.`};},
 svd(){const {w,dec}=tone(),s0=M.svd(w.W0).s;
  const body=t(320,26,'특잇값 σ₁ ≥ σ₂ ≥ … (왼쪽 ΔW, 오른쪽 W₀, 같은 눈금 아님)',{w:700})+sigmas(dec.s,50,{on:3,scale:58})+t(190,252,`ΔW: 앞 3개가 에너지 ${pc(M.energy(dec.s,3))}`,{size:13,fill:'var(--accent)'})+sigmas(s0,340,{on:3,scale:24})+t(480,252,`W₀: 앞 3개가 ${pc(M.energy(s0,3))}`,{size:13})+base();
  return {svg:svg('ΔW와 W₀의 특잇값 16개 막대. ΔW는 앞 세 개만 크다',body,270),caption:`ΔW의 특잇값은 ${dec.s.slice(0,4).map(x=>f(x)).join(', ')}로 넷째부터 거의 0이고, W₀은 90%를 담는 데 ${M.rankFor(s0,.9)}개가 필요합니다.`};},
 gradient(){const {w}=tone(),g=M.gradientRank(w,{batch:4,inputDims:16});
  const body=t(320,26,'예제 하나의 기울기 δ·xᵀ는 랭크 1, b개를 더하면 랭크 ≤ b',{w:700})+[0,1,2,3].map(i=>{const x=40+i*70;return box(x,60,10,64,'var(--orange)','var(--panel)',3)+box(x+16,60,44,10,'var(--blue)','var(--panel)',3)+t(x+30,146,`δ${i+1}x${i+1}ᵀ`,{size:12})+pkt(x+30,100,330-(x+30),0,'var(--accent)',i*.4,5);}).join('')+t(320,100,'+ … =',{size:16,a:'start'})+box(380,56,72,72,'var(--accent)','var(--panel)',4)+t(416,150,'기울기',{size:13})+g.s.map((v,i)=>up(470+i*9,220-(v/g.s[0])*70,6,(v/g.s[0])*70,i<g.rank?'var(--accent)':'var(--muted)',i*.05)).join('')+t(540,244,`예제 4개 → 랭크 ${g.rank}`,{size:13,fill:'var(--accent)'})+line('M460 220H620','var(--line)','');
  return {svg:svg('오차 열벡터와 입력 행벡터의 바깥곱 네 개가 더해져 랭크 4 기울기가 되는 그림',body,260),caption:`예제 4개의 기울기는 특잇값 16개 가운데 ${g.rank}개만 0이 아닙니다. 걸음마다 다른 예제를 쓰면 쌓인 ΔW의 랭크는 더 커질 수 있습니다.`};},
 pretrain(){const w=M.makeWorld({family:'skill',m:3}),a=M.svd(M.fullFinetune(w).dW).s,b=M.svd(M.fullFinetune(w,{start:M.zeros(16,16)}).dW).s,top=Math.max(a[0],b[0]);
  const body=t(320,26,'같은 작업, 다른 출발점 (계열이 3방향에서만 다름)',{w:700})+sigmas(a,50,{on:M.rankFor(a,.9),scale:150/top})+t(190,252,`W₀에서: 90%에 ${M.rankFor(a,.9)}개`,{size:13,fill:'var(--accent)'})+sigmas(b,340,{on:M.rankFor(b,.9),scale:150/top})+t(480,252,`0에서: 90%에 ${M.rankFor(b,.9)}개`,{size:13})+base();
  return {svg:svg('사전학습 출발점과 0 출발점의 변화량 특잇값 비교',body,270),caption:`두 묶음은 같은 눈금입니다. 0에서 출발한 변화량은 크기 ${f(M.frob(M.fullFinetune(w,{start:M.zeros(16,16)}).dW))}로 사전학습 출발점(${f(M.frob(M.fullFinetune(w).dW))})보다 훨씬 크고 고르게 퍼집니다.`};},
 intrinsic(){const {w}=tone(),c=M.intrinsicCurve(w),lo=[1,2,3,4].map(r=>[r*32/256,M.trainLora(w,{r}).gain]);
  const body=t(320,26,'학습하는 수(가로, 0~256)와 메운 비율(세로)',{w:700})+line('M70 68H600','var(--orange)','')+t(604,72,'90%',{size:12,fill:'var(--orange)',a:'start'})+curve(c.pts.map(([d,p])=>[d/256,p]),'var(--blue)',{dash:true})+curve(lo,'var(--accent)')+line('M70 230H600','var(--line)','')+t(150,110,`LoRA r = 1~4`,{size:13,fill:'var(--accent)',a:'start'})+t(360,190,`무작위 d개: d90 = ${c.d90}`,{size:13,fill:'var(--blue)',a:'start'});
  return {svg:svg('무작위 부분공간 곡선과 LoRA 점 네 개의 비교',body,260),caption:`LoRA는 수 32개(r = 1)로 ${pc(lo[0][1])}를 메우고, 무작위 방향은 ${c.d90}개가 있어야 90%에 닿습니다.`};},
 dynamics(){const {w}=tone(),a=M.trainLora(w,{r:3,steps:300,track:10}).log,b=M.trainLora(w,{r:1,steps:300,track:10}).log;
  const body=t(320,26,'A가 정답 입력 방향 세 개를 덮는 정도 (가로: 걸음 0~290)',{w:700})+curve(a.map(x=>[x.t/290,x.cover]),'var(--accent)')+curve(b.map(x=>[x.t/290,x.cover]),'var(--blue)',{dash:true})+line('M70 230H600','var(--line)','')+t(330,72,`r = 3: 100걸음에 ${pc(a[10].cover)}`,{size:13,fill:'var(--accent)',a:'start'})+t(330,200,`r = 1: ${pc(b[b.length-1].cover)}에 머묾`,{size:13,fill:'var(--blue)',a:'start'})+t(76,214,`시작 ${pc(a[0].cover)}`,{size:12,fill:'var(--muted)',a:'start'});
  return {svg:svg('학습 걸음에 따라 A가 정답 방향을 덮는 비율이 오르는 곡선',body,260),caption:'B = 0에서 시작하면 첫 걸음에는 B만 움직이고, 그다음부터 A의 행이 정답 입력 방향으로 돌아갑니다. 행이 하나인 r = 1은 세 방향 가운데 하나만 덮습니다.'};},
 expressivity(){const pts=fam=>{const w=M.makeWorld({family:fam}),ft=M.fullFinetune(w),d=M.svd(ft.dW);return Array.from({length:16},(_,k)=>[k/15,M.gain(M.add(w.W0,M.truncate(ft.dW,k+1,d)),w)]);};const a=pts('tone'),b=pts('skill');
  const body=t(320,26,'ΔW를 랭크 r로 자른 최선값 (가로: r = 1~16)',{w:700})+curve(a,'var(--accent)')+curve(b,'var(--blue)',{dash:true})+line('M70 230H600','var(--line)','')+t(110,112,`말투: r = 3에 ${pc(a[2][1])}`,{size:13,fill:'var(--accent)',a:'start'})+t(250,170,`새 능력: r = 3에 ${pc(b[2][1])}, r = 8에 ${pc(b[7][1])}`,{size:13,fill:'var(--blue)',a:'start'});
  return {svg:svg('말투 계열과 새 능력 계열에서 랭크별 최선 성능 곡선',body,260),caption:'r = 16이면 두 계열 모두 전체 미세조정과 같습니다. 그 전에 얼마나 빨리 따라잡는지는 작업이 바꾸는 방향 수에 달렸습니다.'};},
 subspace(){const {w}=tone(),phi=M.subspaceSimilarity(M.trainLora(w,{r:2,seed:21}).A,M.trainLora(w,{r:8,seed:22}).A);
  const body=t(320,26,'φ(i, j): r = 2의 앞 i개 방향과 r = 8의 앞 j개 방향',{w:700})+phi.map((row,i)=>row.map((v,j)=>`<rect class="${i+j===0?'fig-pulse':''}" x="${80+j*60}" y="${60+i*70}" width="56" height="64" rx="4" fill="var(--accent)" fill-opacity="${Math.max(.06,v).toFixed(2)}" stroke="var(--line)"/>`+t(108+j*60,98+i*70,f(v),{size:13,w:700})).join('')).join('')+[0,1].map(i=>t(70,98+i*70,`i=${i+1}`,{size:12,a:'end',fill:'var(--muted)'})).join('')+[...Array(8)].map((_,j)=>t(108+j*60,218,`j=${j+1}`,{size:12,fill:'var(--muted)'})).join('');
  return {svg:svg('두 LoRA의 A가 쓰는 방향의 겹침을 칸 16개로 그린 표',body,240),caption:`가장 크게 쓰는 방향끼리는 ${f(phi[0][0])}로 겹치고, 앞 두 방향끼리는 ${f(phi[1][1])}입니다. 진할수록 많이 겹칩니다.`};},
 energy(){const {w}=tone(),r=M.rankReport(w,{count:32,noise:.5}),ks=[...Array(17).keys()];
  const body=t(320,26,'자료 32개, 잡음 0.5: ΔW를 k개 성분으로 잘랐을 때 (가로 k = 0~16)',{w:700})+curve(ks.map(k=>[k/16,M.energy(r.s,k)]),'var(--blue)',{dash:true})+curve(ks.map(k=>[k/16,r.perf[k]/r.perf[16]]),'var(--accent)')+line('M70 230H600','var(--line)','')+t(330,150,`에너지 90%: ${r.k90}개`,{size:13,fill:'var(--blue)',a:'start'})+t(150,104,`성능 99%: ${r.kPerf}개`,{size:13,fill:'var(--accent)',a:'start'});
  return {svg:svg('에너지 곡선과 성능 곡선이 다른 k에서 목표에 닿는 그림',body,260),caption:'성능 곡선은 전체 미세조정 성능을 1로 둔 비율입니다. 잡음을 맞춘 작은 성분이 에너지를 차지해, 에너지로 센 랭크가 성능에 필요한 랭크보다 커집니다.'};},
 regularize(){const {w}=tone(),rows=M.dataSweep(w,{r:3,noise:.6,counts:[24,128]}),y=v=>150-Math.max(-1,v)*90;
  const body=t(320,26,'잡음 σ = 0.6, 새 입력에서 메운 비율 (0% 선 아래는 출발점보다 나쁨)',{w:700})+line('M60 150H620','var(--muted)','')+t(64,144,'0%',{size:12,fill:'var(--muted)',a:'start'})+rows.map((x,i)=>{const X=150+i*260,bar=(v,dx,c,dl)=>{const top=Math.min(150,y(v)),h=Math.abs(y(v)-150);return `<rect class="fig-pulse" style="animation-delay:${dl}s" x="${X+dx}" y="${top}" width="60" height="${Math.max(h,1)}" rx="3" fill="${c}"/>`+t(X+dx+30,v>=0?top-6:top+h+16,pc(v),{size:13,w:700});};return bar(x.full,0,'var(--blue)',i*.3)+bar(x.lora,70,'var(--accent)',i*.3+.15)+t(X+65,262,`자료 ${x.count}개`,{size:13});}).join('')+t(70,64,'왼쪽 초록: 전체 미세조정 · 오른쪽 파랑: LoRA r = 3',{size:12,a:'start'});
  return {svg:svg('자료 24개와 128개에서 전체 미세조정과 LoRA의 새 입력 성능 막대',body,275),caption:`자료 24개에서 전체 미세조정은 ${pc(rows[0].full)}, LoRA r = 3은 ${pc(rows[0].lora)}입니다. 128개가 되면 ${pc(rows[1].full)}와 ${pc(rows[1].lora)}로 차이가 줄어듭니다.`};},
 limits(){const pts=M.tradeoff(M.makeWorld({family:'skill'}),[...Array(16)].map((_,i)=>i+1)),Y=pts[15].forgot;
  const body=t(320,26,'새 능력 계열: 배운 양(가로)과 잊은 양(세로), r = 1~16',{w:700})+curve(pts.map(p=>[p.learned,p.forgot/Y]),'var(--accent)')+line('M70 230H600M70 50V230','var(--line)','')+t(70+pts[2].learned*530+8,230-pts[2].forgot/Y*180+4,`r = 3: ${pc(pts[2].learned)} 배우고 ${f(pts[2].forgot,3)} 잊음`,{size:12,a:'start'})+t(560,40,`r = 16: ${f(Y,3)}`,{size:12,a:'end'})+t(335,254,'새 작업에서 배운 비율 →',{size:12,fill:'var(--muted)'});
  return {svg:svg('새 능력 계열에서 랭크 r을 1부터 16까지 키울수록 배운 양과 잊은 양이 함께 늘어나는 곡선',body,265),caption:'잊은 양은 원래 작업 20개에서 늘어난 평균 손실이며 ‖ΔW‖²/16과 같습니다. 랭크를 묶으면 두 양이 함께 줄어듭니다.'};},
 final(){const rows=Object.entries(M.PROBES).map(([k,p])=>{const r=M.rankReport(M.makeWorld({family:p.family,seed:p.seed}));return [p.name,r];}),top=Math.max(...rows.map(x=>x[1].s[0]));
  const body=t(320,26,'시험 미세조정 ΔW의 특잇값과 두 랭크',{w:700})+rows.map(([n,r],i)=>{const x0=40+i*200;return sigmas(r.s.slice(0,10),x0,{on:r.kPerf,scale:140/top,w:12,step:16,top:210})+t(x0+80,234,n,{size:13,w:700})+t(x0+80,254,`에너지 ${r.k90}개 · 성능 ${r.kPerf}개`,{size:12,fill:'var(--accent)'});}).join('')+line('M30 210H620','var(--line)','');
  return {svg:svg('세 작업의 시험 미세조정 특잇값 막대와 에너지 랭크, 성능 랭크',body,265),caption:'강조색은 성능을 지키는 데 필요한 성분입니다(앞 10개만 그림). 어떤 r이 충분한지는 이 두 랭크를 보고 LoRA를 직접 학습해 판정합니다.'};}
};
function render(id){const r=draw[id]?draw[id]():null;if(r)r.caption+=' 그림의 숫자는 브라우저에서 실제로 계산한 값입니다.';return r;}
return {render};
})();
