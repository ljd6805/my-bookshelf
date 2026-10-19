/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 LRMath로 공개 모델 구조와 고정 씨앗 장난감을 실제로 계산해 그린다.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다. */
window.LRFigures=(()=>{
'use strict';
const M=LRMath,f=(n,d=2)=>Number(n).toFixed(d),num=n=>Math.round(n).toLocaleString('en-US');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const svg=(label,body,h=280)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${esc(s)}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const pkt=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const up=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow fig-up" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${w}" height="${Math.max(h,1)}" rx="3" fill="${color}"/>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const gpuLine=(y,label)=>line(`M40 ${y}H620`,'var(--orange)','')+t(616,y-6,label,{size:12,fill:'var(--orange)',a:'end'});
/* 세로 막대 묶음: 값·이름·색을 받아 바닥선 위에 세운다. */
function columns(vals,names,colors,{x0=70,base=230,scale=30,w=60,step=0,digits=2,unit=''}={}){
 const s=step||((560-x0)/vals.length);
 return vals.map((v,i)=>{const x=x0+i*s,h=v*scale;return up(x,base-h,w,h,colors[i%colors.length],i*.15)+t(x+w/2,base-h-8,`${f(v,digits)}${unit}`,{size:13,w:700})+t(x+w/2,base+20,names[i],{size:13,fill:'var(--muted)'});}).join('')+line(`M${x0-20} ${base}H620`,'var(--line)','');
}
/* 점과 선으로 그린 곡선 하나. pts는 [0,1] 범위로 정규화된 [x,y]. */
function curve(pts,color,{L=70,R=600,T=50,B=230,dash=false}={}){
 const p=pts.map(([x,y])=>[L+x*(R-L),B-y*(B-T)]);
 return `<path class="fig-draw" d="${p.map((q,i)=>`${i?'L':'M'}${f(q[0],1)} ${f(q[1],1)}`).join('')}" fill="none" stroke="${color}" stroke-width="2.6"${dash?' stroke-dasharray="6 5"':''}/>`+p.map(q=>`<circle cx="${f(q[0],1)}" cy="${f(q[1],1)}" r="4" fill="${color}"/>`).join('');
}
const L7=()=>M.MODELS.llama7,L13=()=>M.MODELS.llama13,ALL=M.MODULES;
const draw={
 cost(){const N=M.countParams(L7()).total,parts=[['가중치',2],['기울기',2],['fp32 원본',4],['Adam 두 모멘트',8]].map(([n,b])=>[n,N*b/1e9]);
  const body=t(320,28,`Llama 2 7B 전체 미세조정: 파라미터 ${num(N)}개 × 16바이트`,{w:700})+columns(parts.map(p=>p[1]),parts.map(p=>p[0]),['var(--blue)','var(--orange)','#9b87d9','var(--accent)'],{x0:90,scale:2.6,w:80,digits:1,unit:'GB'})+gpuLine(230-24*2.6,'GPU 24GB');
  return {svg:svg('7B 모델 전체 미세조정의 메모리를 네 부분으로 나눈 막대와 24GB 선',body),caption:`네 부분을 더하면 ${f(N*16/1e9,1)}GB로, 가중치(${f(N*2/1e9,1)}GB)는 그 8분의 1입니다. 활성값은 따로 더해야 합니다.`};},
 rank(){const s=M.svd(M.targetDelta()).s;
  const body=t(320,28,'목표 변화량 ΔW(16×16)의 특잇값 σ₁ ≥ σ₂ ≥ …',{w:700})+s.map((v,i)=>{const x=60+i*34,h=v*55;return up(x,230-h,24,h,i<3?'var(--accent)':'var(--muted)',i*.06)+t(x+12,250,`σ${i+1}`,{size:11,fill:'var(--muted)'});}).join('')+line('M40 230H620','var(--line)','')+t(150,70,`큰 성분 3개: ${s.slice(0,3).map(x=>f(x,2)).join(' · ')}`,{size:13,fill:'var(--accent)',a:'start'})+t(330,200,`넷째부터는 ${f(s[3],2)} 아래`,{size:13,fill:'var(--muted)',a:'start'});
  return {svg:svg('ΔW의 특잇값 16개 막대, 앞의 세 개가 크다',body,270),caption:'고정 씨앗으로 지은 장난감 ΔW의 특잇값입니다. 앞 세 성분만 남겨도 제곱합의 98.4%를 담습니다.'};},
 intrinsic(){const a=M.intrinsicCurve('focused'),b=M.intrinsicCurve('spread'),n=pts=>pts.map(([d,p])=>[d/40,Math.max(0,p)]);
  const body=t(320,28,'무작위 d차원에서만 학습해 낸 성능 (파라미터 40개)',{w:700})+line('M70 68H600','var(--orange)','')+t(604,72,'90%',{size:12,fill:'var(--orange)',a:'start'})+curve(n(a.pts),'var(--accent)')+curve(n(b.pts),'var(--blue)',{dash:true})+line('M70 230H600','var(--line)','')+t(70,250,'d = 0',{size:12,fill:'var(--muted)'})+t(600,250,'d = 40',{size:12,fill:'var(--muted)'})+t(200,110,`몰린 문제: d90 = ${a.d90}`,{size:13,fill:'var(--accent)',a:'start'})+t(380,200,`퍼진 문제: d90 = ${b.d90}`,{size:13,fill:'var(--blue)',a:'start'});
  return {svg:svg('입력이 몰린 문제와 퍼진 문제의 부분공간 차원별 성능 곡선',body,270),caption:'입력 분산이 몇 방향에 몰린 문제는 4차원만 움직여도 90%를 넘고, 고르게 퍼진 문제는 40차원을 다 써야 합니다.'};},
 formula(){
  const body=t(320,28,'h = W·x + (α/r)·B·(A·x)',{w:700})+box(40,60,150,150,'var(--muted)')+t(115,140,'W (얼림)',{w:700})+t(115,160,'d × k',{size:12,fill:'var(--muted)'})+t(220,140,'+',{size:26})+box(250,60,34,150,'var(--accent)','var(--panel)')+t(267,230,'B',{w:700,fill:'var(--accent)'})+t(267,250,'d × r',{size:11,fill:'var(--muted)'})+t(300,140,'·',{size:26})+box(316,118,150,34,'var(--accent)','var(--panel)')+t(391,140,'A',{w:700,fill:'var(--accent)'})+t(391,170,'r × k',{size:11,fill:'var(--muted)'})+box(500,100,110,74,'var(--blue)')+t(555,132,'B = 0에서',{size:13})+t(555,152,'시작 → h = W·x',{size:13})+line('M470 137H496','var(--blue)')+pkt(330,135,120,0,'var(--accent)',0)+pkt(267,80,0,110,'var(--accent)',.8);
  return {svg:svg('얼린 W 옆에 작은 B와 A를 곱해 더하는 LoRA 구조',body,270),caption:'W는 바꾸지 않고, 세로로 긴 B와 가로로 긴 A만 학습합니다. 학습할 수는 d·k가 아니라 r·(d + k)입니다.'};},
 params(){const m=L7(),s=M.shapes(m),vals=ALL.map(k=>8*(s[k][0]+s[k][1])*m.layers/1e6);
  const body=t(320,28,'Llama 2 7B, r = 8일 때 층 종류마다 더해지는 학습 파라미터(백만 개)',{w:700})+columns(vals,ALL,ALL.map(k=>['q','v'].includes(k)?'var(--accent)':'var(--blue)'),{x0:70,scale:30,w:52,digits:2});
  return {svg:svg('7B 모델의 일곱 선형층에 r = 8을 붙일 때 층별 학습 파라미터 수',body),caption:`q·v(보라)만 붙이면 ${f(vals[0]+vals[2],2)}M개, 일곱 층 모두면 ${f(vals.reduce((a,b)=>a+b,0),2)}M개입니다. MLP 층은 입력·출력 합이 커서 한 층에 붙여도 수가 큽니다.`};},
 scaling(){const D=M.targetDelta(),rs=[1,2,4,8,16],a=rs.map(r=>M.firstStep({target:D,r,mode:'r'})),b=rs.map(r=>M.firstStep({target:D,r,mode:'sqrt'}));
  const body=t(320,28,'첫 걸음에 γ·B·A가 움직인 크기 (α = 8, 학습률 0.02)',{w:700})+rs.map((r,i)=>{const x=80+i*110;return up(x,230-a[i]*170,36,a[i]*170,'var(--muted)',i*.1)+up(x+40,230-b[i]*170,36,b[i]*170,'var(--accent)',i*.1+.05)+t(x+38,252,`r = ${r}`,{size:13,fill:'var(--muted)'});}).join('')+line('M50 230H620','var(--line)','')+t(470,70,'회색 α/r · 보라 α/√r',{size:13,a:'start'});
  return {svg:svg('랭크별 첫 걸음 크기를 α/r과 α/√r로 비교한 막대',body,270),caption:`α/r에서는 r = 1의 ${f(a[0],3)}이 r = 16에서 ${f(a[4],3)}로 줄고, α/√r에서는 r = 2부터 16까지 ${f(Math.min(...b.slice(1)),3)}~${f(Math.max(...b.slice(1)),3)} 사이에 머뭅니다.`};},
 merge(){
  const body=t(320,28,'W′ = W + γ·B·A 로 합치면 추론 계산이 원래와 같다',{w:700})+box(40,80,110,110,'var(--muted)')+t(95,140,'W',{w:700})+t(170,140,'+',{size:24})+box(190,100,90,70,'var(--accent)','var(--panel)')+t(235,140,'γBA',{w:700,fill:'var(--accent)'})+line('M290 135H350','var(--accent)')+box(360,80,110,110,'var(--blue)')+t(415,140,'W′',{w:700})+line('M480 135H510','var(--muted)')+`<g class="fig-turn">${box(520,90,90,40,'var(--accent)','var(--panel)')+t(565,116,'말투 어댑터',{size:12})}</g><g class="fig-turn" style="animation-delay:2.4s">${box(520,140,90,40,'var(--orange)','var(--panel)')+t(565,166,'요약 어댑터',{size:12})}</g>`+t(565,215,'빼고 다른 것을 더해 갈아 끼움',{size:12,fill:'var(--muted)'});
  return {svg:svg('W에 γBA를 더한 W′와, 어댑터를 빼고 다른 어댑터로 바꾸는 흐름',body,250),caption:'합친 W′는 원래 W와 같은 크기라 추론 때 곱셈이 늘지 않습니다. 빼고 다시 더할 때마다 반올림 오차가 조금씩 쌓일 수 있습니다.'};},
 qlora(){const m=L13(),p=['full','lora','qlora'].map(k=>M.memoryPlan({model:m,method:k,r:16,targets:ALL,activationGB:4}).total/1e9),sc=440/40,names=['전체 미세조정','fp16 LoRA','QLoRA'];
  const body=t(320,28,'Llama 2 13B, 일곱 층 r = 16, 활성값 4GB 가정',{w:700})+p.map((v,i)=>{const y=60+i*58,w=Math.min(v,40)*sc;return t(150,y+22,names[i],{size:14,a:'end'})+grow(160,y,w,30,i===2?'var(--accent)':'var(--blue)',i*.2)+t(Math.min(160+w+8,560),y+22,`${f(v,2)}GB${v>40?' →':''}`,{size:13,w:700,a:'start'});}).join('')+line(`M${160+24*sc} 48V236`,'var(--orange)','')+t(160+24*sc,254,'GPU 24GB',{size:12,fill:'var(--orange)'});
  return {svg:svg('13B 모델을 세 방법으로 학습할 때의 메모리와 24GB 선',body,270),caption:'QLoRA만 24GB 선 안쪽에 들어옵니다. 전체 미세조정 막대는 40GB에서 잘라 그렸습니다.'};},
 variants(){const v=M.variants(L7(),{r:8,targets:['q','v'],bottleneck:64,prefix:10}),lg=x=>Math.log10(x);
  const body=t(320,28,'Llama 2 7B에서 방법마다 학습하는 수 (로그 눈금)',{w:700})+v.map((x,i)=>{const y=52+i*40,w=(lg(x.params)-4)/4*400;return t(160,y+20,x.name,{size:13,a:'end'})+grow(170,y,w,26,x.id==='lora'?'var(--accent)':'var(--blue)',i*.12)+t(176+w,y+19,num(x.params),{size:12,w:700,a:'start'});}).join('')+[4,5,6,7,8].map(e=>t(170+(e-4)*100,262,`10^${e}`,{size:11,fill:'var(--muted)'})).join('');
  return {svg:svg('LoRA, DoRA, 어댑터, 프리픽스, 프롬프트 튜닝의 학습 파라미터 수 막대',body,270),caption:'LoRA·DoRA는 q·v r = 8, 어댑터는 병목 64, 프리픽스와 프롬프트 튜닝은 10토큰입니다. 개수가 적다고 성능이 같은 것은 아닙니다.'};},
 forgetting(){const pts=[1,2,3,4,'full'].map(k=>M.forgetRun({rank:k,overlap:3})),Y=Math.max(...pts.map(p=>p.forgot));
  const body=t(320,28,'배운 양(가로)과 잊은 양(세로), 랭크 1·2·3·4·전체',{w:700})+curve(pts.map(p=>[p.learned,p.forgot/Y]),'var(--accent)')+pts.map((p,i)=>t(70+p.learned*530,222-p.forgot/Y*180-12,i<4?`r=${i+1}`:'전체',{size:12,fill:'var(--muted)'})).join('')+line('M70 230H600M70 50V230','var(--line)','')+t(335,256,'작업 B에서 배운 양 →',{size:12,fill:'var(--muted)'});
  return {svg:svg('랭크가 클수록 더 배우고 더 잊는 교환 곡선',body,270),caption:'12차원 선형 장난감에서 두 작업이 3방향을 함께 쓸 때의 닫힌 식 계산입니다. 랭크를 줄이면 덜 배우고 덜 잊습니다.'};},
 serving(){const s=M.serving({model:L7(),r:8,targets:['q','v'],users:100,active:8,gbps:10}),cols=['var(--accent)','var(--orange)','var(--blue)','#9b87d9'];
  const body=t(320,28,`기본 모델 하나(${f(s.baseBytes/1e9,2)}GB) + 사용자별 어댑터(${f(s.adapterBytes/1e6,2)}MB)`,{w:700})+box(250,100,140,80,'var(--muted)')+t(320,138,'Llama 2 7B',{w:700})+t(320,158,'공유, 한 번만 저장',{size:12,fill:'var(--muted)'})+[0,1,2,3].map(i=>{const x=60+i*150,y=i%2?210:50;return box(x,y,70,30,cols[i],'var(--panel)',6)+t(x+35,y+20,`사용자 ${i+1}`,{size:11})+pkt(x+35,y+15,320-(x+35),140-(y+15),cols[i],i*.5,5);}).join('');
  return {svg:svg('기본 모델 하나에 사용자 어댑터 네 개가 붙는 서빙 구조',body,260),caption:`어댑터 하나는 기본 모델의 ${num(s.ratio)}분의 1입니다. 요청이 오면 서버가 그 사용자의 어댑터를 골라 기본 모델과 함께 계산합니다.`};},
 federated(){const c=M.fedComm({model:L7(),method:'lora',r:8,targets:['q','v'],clients:100,rounds:50}),full=M.fedComm({model:L7(),method:'full',r:8,targets:['q','v'],clients:100,rounds:50});
  const body=t(320,28,'라운드마다 어댑터만 올리고 평균한 어댑터를 내려받기',{w:700})+box(255,60,130,56,'var(--blue)')+t(320,92,'서버: 평균',{w:700})+[0,1,2,3,4].map(i=>{const x=40+i*120;return box(x,200,90,40,'var(--muted)','var(--panel)',6)+t(x+45,225,`기기 ${i+1}`,{size:12})+pkt(x+45,198,320-(x+45),-80,'var(--accent)',i*.3,5)+pkt(320,118,x+45-320,80,'var(--orange)',1.2+i*.3,5);}).join('')+t(320,150,`한 번 ${f(c.perUpdate/1e6,2)}MB (모델 전체는 ${f(full.perUpdate/1e9,2)}GB)`,{size:13,fill:'var(--accent)'});
  return {svg:svg('기기 다섯 대가 서버와 어댑터를 주고받는 연합학습 라운드',body,260),caption:`보라 점은 기기가 올리는 어댑터, 주황 점은 내려받는 평균입니다. 기기 100대, 50라운드면 어댑터로 ${f(c.total/1e9,2)}GB, 모델 전체로 ${num(full.total/1e9)}GB입니다.`};},
 final(){const rows=[['13B 전체',{model:L13(),method:'full'}],['13B fp16 LoRA r16',{model:L13(),method:'lora',r:16,targets:ALL}],['13B QLoRA r16',{model:L13(),method:'qlora',r:16,targets:ALL}],['7B QLoRA r16',{model:L7(),method:'qlora',r:16,targets:ALL}]].map(([n,o])=>[n,M.memoryPlan({...o,activationGB:4}).total/1e9]),sc=420/40;
  const body=t(320,28,'하린의 조건: GPU 24GB 한 장, 활성값 4GB 가정',{w:700})+rows.map(([n,v],i)=>{const y=54+i*46,w=Math.min(v,40)*sc,ok=v<=24;return t(176,y+20,n,{size:13,a:'end'})+grow(186,y,w,26,ok?'var(--accent)':'var(--muted)',i*.15)+t(Math.min(192+w,560),y+19,`${f(v,2)}GB ${ok?'✓':'✗'}`,{size:13,w:700,a:'start'});}).join('')+line(`M${186+24*sc} 44V236`,'var(--orange)','')+t(186+24*sc,254,'24GB',{size:12,fill:'var(--orange)'});
  return {svg:svg('하린의 GPU에서 네 가지 계획의 메모리 비교',body,270),caption:'✓는 24GB 안에 들어가는 계획입니다. 막대는 40GB에서 잘라 그렸고, 어떤 계획을 고를지는 메모리와 함께 목표와 평가 계획으로 정합니다.'};}
};
function render(id){const r=draw[id]?draw[id]():null;if(r)r.caption+=' 그림의 숫자는 브라우저에서 실제로 계산한 값입니다.';return r;}
return {render};
})();
