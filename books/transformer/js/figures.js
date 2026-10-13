/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자가 있는 그림은 TMath로 학습된 토리를 실제로 계산해 그린다(3장은 교육용 모형, 13장은 장난감 모형).
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다. */
window.TFigures=(()=>{
'use strict';
const M=TMath,f=(n,d=2)=>Number(n).toFixed(d);
const svg=(label,body,h=280)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${String(s).replace(/<s>/g,'&lt;s&gt;')}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay)=>`<g class="fig-seq" style="animation-delay:${delay}s">${body}</g>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const cell=(x,y,s,v,color='var(--accent)')=>`<rect x="${x}" y="${y}" width="${s-2}" height="${s-2}" rx="2" fill="${color}" fill-opacity="${Math.max(.05,Math.min(1,v))}"/>`;
const LIST='목록 곰 꿀 숲 토끼 포도 곰 꿀';
const F={};
F.predict=()=>{
 const a=M.predict('곰 먹이'),b=M.predict('곰');
 let s=['<s>','곰','먹이'].map((w,i)=>box(20+i*62,40,56,40,'var(--blue)')+t(48+i*62,66,w,{size:14})).join('');
 s+=line('M206 60H252','var(--accent)')+box(252,30,120,60,'var(--accent)')+t(312,57,'토리',{w:700})+t(312,77,'2층 · 헤드 8개',{size:12,fill:'var(--muted)'})+dot(208,60,40,0,'var(--accent)');
 a.top.slice(0,3).forEach((p,i)=>{s+=t(400,48+i*22,p.token,{a:'start',size:13})+grow(450,36+i*22,p.p*150,14,'var(--accent)',.3*i)+t(612,48+i*22,f(p.p),{a:'end',size:12});});
 s+=['<s>','곰'].map((w,i)=>box(20+i*62,170,56,40,'var(--blue)')+t(48+i*62,196,w,{size:14})).join('');
 s+=line('M144 190H252','var(--orange)')+box(252,160,120,60,'var(--orange)')+t(312,187,'토리',{w:700})+t(312,207,'같은 가중치',{size:12,fill:'var(--muted)'})+dot(146,190,100,0,'var(--orange)',.8);
 b.top.slice(0,3).forEach((p,i)=>{s+=t(400,178+i*22,p.token,{a:'start',size:13})+grow(450,166+i*22,p.p*150,14,'var(--orange)',.3*i+.6)+t(612,178+i*22,f(p.p),{a:'end',size:12});});
 return {svg:svg(`곰 먹이를 넣으면 꿀 ${f(a.top[0].p)}, 곰만 넣으면 집 ${f(b.top[0].p)}과 먹이 ${f(b.top[1].p)}로 갈리는 그림`,s+t(320,262,'출력은 낱말 32개에 대한 확률 분포이고, 합은 1입니다',{size:13,fill:'var(--muted)'})),caption:`같은 토리가 “곰 먹이” 뒤에는 꿀에 ${f(a.top[0].p)}, “곰” 뒤에는 집 ${f(b.top[0].p)}·먹이 ${f(b.top[1].p)}을 줍니다. 앞 문장이 바뀌면 분포가 바뀝니다.`};
};
F.embed=()=>{
 const W=M.weights(),rows=['곰','토끼','꿀','3'];let s=t(20,26,'임베딩 표 E (32 낱말 × 32차원 중 앞 20차원)',{a:'start',size:13,fill:'var(--muted)'});
 rows.forEach((w,r)=>{const v=W.E[M.index(w)],y=50+r*48;s+=t(60,y+22,w,{a:'end',size:14,w:700});s+=blink(v.slice(0,20).map((x,k)=>cell(74+k*26,y,26,Math.abs(x)/1.2,x<0?'var(--orange)':'var(--accent)')).join(''),r*.7);});
 const c1=M.cosine(W.E[M.index('곰')],W.E[M.index('토끼')]),c2=M.cosine(W.E[M.index('곰')],W.E[M.index('3')]);
 s+=t(320,262,`cos(곰, 토끼) = ${f(c1)}   ·   cos(곰, 3) = ${f(c2)}`,{size:14});
 return {svg:svg(`곰 토끼 꿀 3의 임베딩 벡터 앞 20차원을 색 칸으로 보여 주는 그림. 곰과 토끼의 코사인은 ${f(c1)}, 곰과 3은 ${f(c2)}`,s),caption:`낱말은 표의 한 줄(32개 숫자)을 꺼내 쓰는 것으로 벡터가 됩니다. 초록은 양수, 주황은 음수, 진할수록 큽니다. 같은 동물인 곰·토끼가 곰·3보다 조금 더 닮았습니다.`};
};
F.lookup=()=>{
 const r=M.softLookup(30,2),c=[160,140],pos=[[1,0],[0,1],[-1,0],[0,-1]];let s=`<circle cx="${c[0]}" cy="${c[1]}" r="96" fill="none" stroke="var(--line)" stroke-dasharray="3 4"/>`;
 r.forEach((e,i)=>{const x=c[0]+pos[i][0]*96,y=c[1]-pos[i][1]*96;s+=box(x-34,y-16,68,32,'var(--blue)')+t(x,y+5,e.key,{size:13});s+=line(`M${c[0]} ${c[1]}L${x} ${y}`,'var(--accent)','fig-dash').replace('stroke-width="2"',`stroke-width="${1+e.weight*10}"`);});
 const qx=c[0]+Math.cos(Math.PI/6)*70,qy=c[1]-Math.sin(Math.PI/6)*70;s+=`<path d="M${c[0]} ${c[1]}L${qx} ${qy}" stroke="var(--orange)" stroke-width="4"/><circle class="fig-pulse" cx="${qx}" cy="${qy}" r="6" fill="var(--orange)"/>`+t(qx+18,qy-6,'질문',{size:13,fill:'var(--orange)'});
 r.forEach((e,i)=>{s+=t(380,70+i*34,`${e.key} → ${e.v}`,{a:'start',size:14})+grow(500,58+i*34,e.weight*120,16,'var(--accent)',.2*i)+t(630,70+i*34,f(e.weight),{a:'end',size:13});});
 s+=t(470,230,'출력 = 0.63·꿀 + 0.30·동굴 + …',{size:14,fill:'var(--accent)'});
 return {svg:svg('질문 화살표가 열쇠 넷과 내적해 가중치를 얻고 값을 섞는 부드러운 찾기 그림',s),caption:'질문(주황)과 가까운 방향의 열쇠일수록 굵은 선, 큰 가중치를 받습니다. 보통 사전은 한 칸만 꺼내지만, 어텐션은 모든 값을 가중치대로 섞습니다. 손으로 정한 교육용 모형입니다.'};
};
F.qkv=()=>{
 const tr=M.attentionTrace(LIST,1,1,7);let s='';
 const steps=[['x','잔차 → 정규화',20],['q k v','W_Q W_K W_V',150],['q·k ÷ √8','점수',280],['softmax','가중치',410],['Σ a·v','→ W_O',530]];
 steps.forEach(([a,b,x],i)=>{s+=box(x,24,96,58,i===2?'var(--orange)':'var(--accent)')+t(x+48,50,a,{w:700,size:14})+t(x+48,70,b,{size:11,fill:'var(--muted)'});if(i<4)s+=line(`M${x+96} 53H${x+130}`,'var(--accent)')+dot(x+98,53,30,0,'var(--accent)',i*.4,4);});
 tr.tokens.forEach((w,i)=>{const x=40+i*72;s+=t(x+28,130,w,{size:13,fill:i===tr.pos?'var(--orange)':'var(--text)'})+grow(x,140,56*tr.weights[i]+1,12,i===3?'var(--accent)':'var(--blue)',.15*i)+t(x+28,170,f(tr.weights[i]),{size:12,fill:'var(--muted)'});});
 [8,64,512].forEach((d,i)=>{s+=t(80+i*190,214,`d = ${d}`,{size:13})+grow(40+i*190,224,Math.sqrt(d)*5,12,'var(--orange)',.3*i)+t(80+i*190,256,`q·k의 표준편차 ≈ √d = ${f(Math.sqrt(d),1)}`,{size:12,fill:'var(--muted)'});});
 return {svg:svg('어텐션 다섯 단계와 실제 가중치, 차원이 커질수록 내적이 퍼지는 정도를 보여 주는 그림',s),caption:`위: 한 헤드의 계산 순서. 가운데: 목록 위치 7(두 번째 곰)에서 1층 헤드 1의 실제 가중치, 위치 3 “꿀”이 ${f(tr.weights[3])}. 아래: 성분이 평균 0·분산 1인 무작위 벡터라면 내적의 표준편차는 √d로 커지므로 √d로 나눠 되돌립니다.`};
};
F.mask=()=>{
 const n=8,sz=26,x0=40,y0=30;let s='';
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){const ok=j<=i;s+=ok?blink(cell(x0+j*sz,y0+i*sz,sz,.25+.6*(j===i-1)),i*.45):`<rect x="${x0+j*sz}" y="${y0+i*sz}" width="${sz-2}" height="${sz-2}" rx="2" fill="none" stroke="var(--line)" stroke-dasharray="2 2"/>`;}
 s+=t(x0+n*sz/2,y0+n*sz+24,'행: 지금 위치 · 열: 보는 위치',{size:12,fill:'var(--muted)'});
 const r=M.maskCompare(LIST,0,2,7);
 s+=t(330,46,'0층 헤드 2 · 위치 7(곰)의 가중치',{a:'start',size:13,fill:'var(--muted)'});
 r.tokens.forEach((w,i)=>{const y=60+i*22;s+=t(370,y+12,w,{a:'end',size:12,fill:i>7?'var(--orange)':'var(--text)'})+`<rect x="380" y="${y}" width="${r.masked[i]*110+1}" height="8" fill="var(--accent)"/><rect x="500" y="${y}" width="${r.open[i]*110+1}" height="8" fill="${i>7?'var(--orange)':'var(--blue)'}"/>`;});
 s+=t(435,262,'마스크 켬',{size:12})+t(555,262,'마스크 끔',{size:12});
 return {svg:svg('아래 삼각형 칸만 한 줄씩 켜지는 인과 마스크와, 마스크를 끄면 미래 칸이 가중치를 가져가는 막대 비교',s),caption:`왼쪽: 위치마다 자기와 과거만 봅니다(점선 칸은 가려진 미래). 오른쪽: 같은 헤드에서 마스크를 끄면 위치 7이 다음 정답 칸 “꿀”에 ${f(r.open[8])}를 줍니다. 학습 중이라면 답을 엿보는 지름길입니다.`};
};
F.multihead=()=>{
 const ids=M.tokenize(LIST).ids,r=M.run(ids),n=ids.length,sz=13;let s='';
 for(let l=0;l<2;l++)for(let h=0;h<4;h++){const x0=20+h*156,y0=30+l*124;s+=t(x0+n*sz/2,y0-8,`${l}층 헤드 ${h}`,{size:12,fill:(l===0&&h===2)||(l===1&&h!==2)?'var(--accent)':'var(--muted)'});
  s+=blink(r.attn[l][h].map((row,i)=>row.map((v,j)=>j<=i?cell(x0+j*sz,y0+i*sz,sz,v):'').join('')).join(''),(l*4+h)*.25);}
 return {svg:svg('목록 문장에서 헤드 여덟 개의 어텐션 표를 작게 나란히 놓은 그림',s,272),caption:'같은 문장, 같은 층인데 헤드마다 표의 모양이 다릅니다. 0층 헤드 2는 대각선 바로 아래(바로 앞 칸), 1층 헤드 0·1·3은 반복 구간에서 비스듬한 줄을 봅니다. 실제 계산.'};
};
F.stream=()=>{
 const ids=M.tokenize(LIST).ids,r=M.run(ids),fin=M.index('숲'),ps=r.stages.map(z=>M.softmax(M.unembed(z.x.at(-1)))[fin]);
 let s=`<path class="fig-dash" d="M120 20V250" stroke="var(--accent)" stroke-width="5" fill="none"/>`+t(120,268,'잔차 스트림 (위치 8 “꿀”)',{size:12,fill:'var(--muted)'});
 const parts=['임베딩','0층 어텐션','0층 MLP','1층 어텐션','1층 MLP'];
 parts.forEach((p,i)=>{const y=34+i*48;s+=box(180,y-16,130,32,i===3?'var(--orange)':'var(--blue)')+t(245,y+5,p+' +',{size:13})+line(`M180 ${y}H124`,'var(--blue)')+dot(178,y,-52,0,'var(--blue)',i*.5,4);
  s+=t(360,y+5,'렌즈 →',{a:'start',size:12,fill:'var(--muted)'})+grow(420,y-7,ps[i]*180+1,14,i===3?'var(--orange)':'var(--accent)',.4*i)+t(630,y+5,`숲 ${f(ps[i])}`,{a:'end',size:12});});
 return {svg:svg('모든 부품이 잔차 스트림에 더해 쓰고, 단계마다 출력층에 비추면 숲의 확률이 1층 어텐션에서 뛰어오르는 그림',s),caption:`부품은 잔차를 덮어쓰지 않고 자기 몫을 더합니다. 목록 마지막 위치에서 단계마다 출력층에 비추면 “숲”의 확률이 ${ps.map(p=>f(p)).join(' → ')}로 자랍니다. 1층 어텐션이 답을 들여왔습니다.`};
};
F.qkov=()=>{
 const P=M.positionalQK(0,2,8),o=M.ovRow(1,1,'곰');let s=t(150,24,'QK: 어디를 볼까 (0층 헤드 2, 위치만)',{size:13});
 P.forEach((row,i)=>row.forEach((v,j)=>{if(j<=i)s+=cell(60+j*24,40+i*24,24,v,j===i-1?'var(--orange)':'var(--accent)');}));
 s+=t(470,24,'OV: 무엇을 옮길까 (1층 헤드 1, 곰)',{size:13});
 o.top.forEach((x,i)=>{s+=t(380,64+i*36,x.token,{a:'start',size:14})+grow(440,52+i*36,x.v/o.top[0].v*150,16,i===0?'var(--accent)':'var(--blue)',.25*i)+t(630,64+i*36,f(x.v),{a:'end',size:12});});
 s+=line('M300 140H360','var(--muted)')+t(320,262,'한 헤드 = 위치를 고르는 QK 회로 × 내용을 옮기는 OV 회로',{size:13,fill:'var(--muted)'});
 return {svg:svg('왼쪽은 바로 앞 칸이 밝은 위치 점수표, 오른쪽은 곰을 보면 곰을 가장 크게 밀어 올리는 막대',s),caption:`QK 회로는 위치 임베딩만으로도 바로 앞 칸(주황)에 점수를 몰아줍니다. OV 회로는 본 낱말 “곰”을 출력의 “곰”(${f(o.top[0].v)})으로 옮깁니다. 둘은 서로 다른 행렬 쌍(W_Q·W_K와 W_V·W_O)입니다.`};
};
F.induction=()=>{
 const tok=['…','곰','꿀','…','곰','?'];let s='';
 tok.forEach((w,i)=>{s+=box(30+i*100,150,76,40,i===5?'var(--orange)':'var(--blue)')+t(68+i*100,176,w,{size:15,w:i===5?700:400});});
 s+=`<path class="fig-draw" d="M268 148Q218 96 168 148" fill="none" stroke="var(--blue)" stroke-width="3"/>`+t(218,96,'① 0층 헤드 2: 꿀 칸에 “앞은 곰” 적기',{size:12,fill:'var(--blue)'});
 s+=`<path class="fig-draw" style="animation-delay:.8s" d="M468 148Q368 40 268 148" fill="none" stroke="var(--accent)" stroke-width="3"/>`+t(368,52,'② 1층 유도 헤드: “앞이 곰인 칸”을 찾음',{size:12,fill:'var(--accent)'});
 s+=dot(268,170,300,0,'var(--accent)',1.4)+t(568,226,'③ 꿀을 베껴 예측',{size:13,fill:'var(--orange)'});
 return {svg:svg('바로 앞 칸 헤드가 꿀 칸에 앞은 곰이라고 적고, 두 번째 곰에서 유도 헤드가 그 칸을 찾아 꿀을 베끼는 그림',s,250),caption:'유도 헤드는 두 층의 협업입니다. 0층의 바로 앞 칸 헤드가 각 칸에 “내 앞 낱말”을 적어 두면, 1층 헤드는 지금 낱말과 같은 “앞 낱말”을 가진 칸을 찾아 그 칸의 낱말을 베낍니다. 한 층으로는 만들 수 없는 회로입니다.'};
};
F.mlp=()=>{
 const ns=M.neurons('곰 먹이','꿀',1,5);let s=box(20,90,90,40,'var(--blue)')+t(65,115,'곰 먹이',{size:14})+line('M110 110H170','var(--blue)');
 ns.forEach((n,i)=>{const y=40+i*40;s+=`<circle class="fig-pulse" style="animation-delay:${i*.3}s" cx="200" cy="${y}" r="${6+n.act*3}" fill="var(--accent)" fill-opacity=".8"/>`+t(230,y+5,`뉴런 ${n.n} · 활성 ${f(n.act,1)}`,{a:'start',size:12})+line(`M${380} ${y}L470 110`,'var(--accent)');});
 s+=box(470,90,140,40,'var(--accent)')+t(540,115,'꿀 로짓 ↑',{size:14,w:700});
 s+=t(320,262,'키(W1)가 “곰·먹이” 패턴에 반응하고, 값(W2)이 “꿀” 방향을 씁니다',{size:13,fill:'var(--muted)'});
 return {svg:svg('곰 먹이 입력에 1층 MLP 뉴런 다섯 개가 켜지고 각자 꿀 로짓을 올리는 그림',s),caption:`“곰 먹이”에서 꿀에 가장 크게 기여하는 1층 MLP 뉴런 다섯 개(${ns.map(n=>n.n).join('·')}번)입니다. 원의 크기가 활성입니다. 한 뉴런이 아니라 여럿이 나눠 꿀을 밀어 올립니다.`};
};
F.patch=()=>{
 const r=M.patching('곰 먹이','토끼 먹이','꿀','당근');let s=box(20,30,170,40,'var(--accent)')+t(105,55,'깨끗한: 곰 먹이',{size:13})+box(20,90,170,40,'var(--orange)')+t(105,115,'망가진: 토끼 먹이',{size:13});
 s+=line('M190 50C230 50 230 110 270 110','var(--accent)')+dot(192,50,76,58,'var(--accent)')+t(230,160,'부품 하나만 바꿔 끼우기',{size:12,fill:'var(--muted)'});
 r.rows.forEach((z,i)=>{const y=24+i*23;s+=t(400,y+12,z.label,{a:'end',size:11})+`<rect x="408" y="${y}" width="180" height="14" rx="2" fill="var(--panel2)"/>`+grow(408,y,Math.max(z.rate,0)*180+1,14,z.rate>.45?'var(--accent)':'var(--blue)',.1*i)+t(632,y+12,f(z.rate),{a:'end',size:11});});
 return {svg:svg('곰 먹이의 부품 출력을 토끼 먹이 실행에 하나씩 끼워 넣으면 얼마나 되돌아오는지 보여 주는 막대',s,262),caption:'망가진 입력으로 돌리되 부품 하나의 출력만 깨끗한 실행의 것으로 바꿉니다. 막대는 정답−오답 로짓 차이가 되돌아온 비율입니다. 1층 MLP, 0층 MLP, 0층 헤드 0이 크게 돌려놓습니다.'};
};
F.training=()=>{
 const S=TCheckpoints.steps,x=k=>40+k/(S.length-1)*560,y=v=>30+(1-Math.min(v,4)/4)*190;
 let s=`<path d="M40 220H600" stroke="var(--line)"/>`+[0,1,2,3,4].map(v=>t(32,y(v)+4,v,{a:'end',size:11,fill:'var(--muted)'})).join('');
 s+=`<path class="fig-draw" d="${S.map((z,k)=>`${k?'L':'M'}${x(k)} ${y(z.list_second)}`).join('')}" fill="none" stroke="var(--accent)" stroke-width="3"/>`;
 s+=`<path class="fig-draw" d="${S.map((z,k)=>`${k?'L':'M'}${x(k)} ${y(4-z.fact_acc*4)}`).join('')}" fill="none" stroke="var(--blue)" stroke-width="2" stroke-dasharray="5 4"/>`;
 const k400=S.findIndex(z=>z.step===400);s+=`<rect class="fig-pulse" x="${x(k400)-8}" y="24" width="16" height="200" fill="var(--orange)" fill-opacity=".15"/>`+t(x(k400),20,'400단계 무렵 급락',{size:12,fill:'var(--orange)'});
 S.forEach((z,k)=>{if([0,6,8,12,20].includes(k))s+=t(x(k),240,z.step,{size:11,fill:'var(--muted)'});});
 s+=t(320,266,'초록: 반복 구간 손실(nat) · 파랑 점선: 사실 오답률(위=100%)',{size:12,fill:'var(--muted)'});
 return {svg:svg('반복 구간 손실이 300단계까지 천천히 내려오다가 400~500단계에 급히 떨어지는 학습 곡선',s),caption:'가로축은 체크포인트 순서입니다(눈금 숫자가 학습 단계). 사실은 200단계까지 익히지만, 반복 목록을 잇는 능력은 한참 뒤 짧은 구간에 갑자기 생깁니다. 이때 유도 헤드가 만들어집니다.'};
};
F.limits=()=>{
 const a=M.superposition(0,{steps:8000}),b=M.superposition(.95,{steps:8000}),draw=(r,cx,label)=>{let s=`<circle cx="${cx}" cy="140" r="80" fill="none" stroke="var(--line)" stroke-dasharray="3 4"/>`+t(cx,252,label,{size:13});r.cols.forEach((v,i)=>{const on=r.lengths[i]>.5;s+=`<path class="${on?'fig-draw':''}" style="animation-delay:${i*.3}s" d="M${cx} 140L${cx+v[0]*80} ${140-v[1]*80}" stroke="${on?'var(--accent)':'var(--muted)'}" stroke-width="${on?3:1.5}" ${on?'':'stroke-dasharray="3 3"'}/>`+t(cx+v[0]*96,140-v[1]*96+4,`f${i+1}`,{size:12});});return s;};
 return {svg:svg('특징이 늘 켜지면 2차원에 둘만 담고, 드물게 켜지면 넷을 비스듬히 겹쳐 담는 두 그림',draw(a,170,`늘 켜짐 · 담긴 특징 ${a.represented}개`)+draw(b,470,`희소성 0.95 · 담긴 특징 ${b.represented}개`)),caption:`특징 5개를 2차원에 담는 장난감 모형을 실제로 학습시킨 결과입니다. 특징이 드물게 켜지면 차원보다 많은 특징(${b.represented}개)을 겹쳐 담습니다. 그래서 뉴런 하나가 여러 뜻에 반응하게 됩니다.`};
};
F.final=()=>{
 const A=M.ablate('3 4 5','6',[]),H=M.ablate('3 4 5','6',['0.0','0.1','0.2','0.3','1.0','1.1','1.2','1.3']),P=M.ablate('3 4 5','6',['mlp0']);
 let s=['3','4','5','?'].map((w,i)=>box(30+i*64,30,54,40,i===3?'var(--orange)':'var(--blue)')+t(57+i*64,56,w,{size:15})).join('');
 const rows=[['그대로',A.after,'var(--accent)'],['헤드 8개 모두 지움',H.after,'var(--accent)'],['0층 MLP 지움',P.after,'var(--orange)']];
 rows.forEach(([l,v,c],i)=>{const y=110+i*46;s+=t(200,y+14,l,{a:'end',size:13})+`<rect x="212" y="${y}" width="320" height="20" rx="3" fill="var(--panel2)"/>`+grow(212,y,v*320+1,20,c,.4*i)+t(600,y+15,`6: ${f(v*100,1)}%`,{a:'end',size:13});});
 s+=t(320,262,'어떤 부품이 일을 하는지는 지워 보고 확인합니다',{size:13,fill:'var(--muted)'});
 return {svg:svg('3 4 5 다음 6의 확률이 헤드를 모두 지워도 남고 0층 MLP를 지우면 무너지는 막대',s),caption:`마지막 과제의 출발점입니다. 헤드 여덟 개를 모두 지워도 6은 ${f(H.after*100,1)}%로 남지만, 0층 MLP를 지우면 ${f(P.after*100,1)}%로 무너집니다. 이 증거로 무엇까지 말할 수 있을까요?`};
};
function render(id){return F[id]?F[id]():null;}
return {render};
})();
