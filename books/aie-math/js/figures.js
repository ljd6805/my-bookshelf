/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A02Math로 계산한다. */
window.A02Figures=(()=>{
'use strict';
const M=A02Math,f=(n,d=2)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const turn=(body,i)=>blink(body,i*1.2,i?'fig-turn':'fig-turn fig-first');
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const H={svg,t,box,line,dot,blink,grow,pulse};
const A='var(--accent)',O='var(--orange)',B='var(--blue)',MU='var(--muted)';
const F={};

F.signal=()=>{
 const amp=M.amplitudes(M.synth([[3,1,0],[6,.5,0]],64)),x=M.synth([[3,1,0],[6,.5,0]],64);
 let b=t(90,30,'회전하는 화살표',{fill:MU,size:14})+`<circle cx="90" cy="140" r="62" fill="none" stroke="var(--line)" stroke-width="2"/><path d="M20 140H160M90 70V210" stroke="var(--line)"/>`;
 b+=`<g class="a02-spin" style="transform-origin:90px 140px"><path d="M90 140H152" stroke="${A}" stroke-width="4"/><circle cx="152" cy="140" r="7" fill="${A}"/></g>`+t(90,232,'e^(iθ) = cos θ + i·sin θ',{size:14})+t(90,256,'그림자가 코사인 파동',{size:13,fill:MU});
 b+=t(330,30,'‘켜’ = k3 + k6 성분',{fill:MU,size:14})+`<path d="M200 140H460" stroke="var(--line)"/>`+line(x.map((v,n)=>`${n?'L':'M'}${200+n*4.1} ${140-v*48}`).join(''),B,'fig-draw');
 b+=line('M466 140H500',MU)+dot(462,140,34,0,O,0,5);
 b+=t(570,30,'DFT 진폭',{fill:MU,size:14})+`<path d="M506 230H636" stroke="var(--line)"/>`;
 for(let k=0;k<=10;k++){const h=amp[k]*150;b+=k===3||k===6?`<rect class="fig-grow" style="animation-delay:${k*.1}s;transform-origin:center bottom" x="${508+k*11.6}" y="${230-h}" width="8" height="${h}" fill="${A}"/>`:`<rect x="${508+k*11.6}" y="228" width="8" height="2" fill="var(--line)"/>`;}
 b+=t(546,252,'k=3',{size:13})+t(581,252,'k=6',{size:13})+t(570,278,`진폭 ${f(amp[3],1)} · ${f(amp[6],1)}`,{size:13,fill:MU});
 return {svg:svg('복소수 화살표가 돌며 만든 두 성분의 합 신호를 DFT가 k=3과 k=6 두 막대로 다시 나누는 그림',b),caption:'왼쪽 화살표의 회전 그림자가 코사인이고, 가운데 ‘켜’ 신호는 두 회전의 합입니다. 오른쪽 막대는 그 신호를 64샘플 DFT로 실제 계산한 진폭이며, 회전 애니메이션은 시각적 비유입니다.'};
};

F.tensor=()=>{
 const p=M.pipeline(8,50,40,16);let b='';
 for(let i=5;i>=0;i--)b+=box(28+i*8,60+i*8,120,120,i?'var(--line)':B,'var(--panel2)',6);
 b+=t(98,210+40,'(B, T, F)',{w:700})+t(98,272,`${p.steps[0].shape.join('×')} = ${f(p.steps[0].count,0)}`,{size:13,fill:MU});
 b+=t(205,140,'·',{size:30})+box(225,90,70,100,O)+t(260,145,'W',{w:700})+t(260,216,'(F, H)',{size:14})+t(260,236,'40×16',{size:13,fill:MU});
 b+=line('M300 140H352',MU)+dot(300,140,52,0,A,0,5);
 for(let i=5;i>=0;i--)b+=box(360+i*8,70+i*8,90,100,i?'var(--line)':A,'var(--panel2)',6);
 b+=t(415,232,'(B, T, H)',{w:700})+t(415,254,`${f(p.steps[1].count,0)}개`,{size:13,fill:MU});
 b+=t(560,46,'편향 (H)',{size:14,fill:MU})+box(512,58,96,18,O,'var(--panel2)',4);
 for(let i=0;i<4;i++)b+=blink(box(512,92+i*26,96,18,'var(--line)','color-mix(in srgb,var(--orange) 30%,transparent)',4),i*.5);
 b+=t(560,222,'늘려서 더하기',{size:14})+t(560,244,'오른쪽 축부터 맞춤',{size:13,fill:MU});
 return {svg:svg('소리 여덟 개의 스펙트로그램 텐서에 가중치 행렬을 곱하고 편향을 늘려 더하는 모양 그림',b),caption:`(8, 50, 40) 텐서에 (40, 16) 가중치를 곱하면 (8, 50, 16)이 되고, 편향 (16)은 앞의 두 축으로 늘어나 더해집니다. 숫자는 실제 원소 수이고 쌓인 상자는 축을 보여 주는 그림입니다.`};
};

F.derivative=()=>{
 const X=w=>60+(w+2)*90,Y=v=>250-v*220,w0=.5,g=M.lossWGrad(w0),L0=M.lossW(w0);
 let b=`<path d="M60 250H520M60 30V250" stroke="var(--line)"/>`+t(530,256,'w',{a:'start',size:14,fill:MU})+t(66,26,'L(w)',{a:'start',size:14,fill:MU});
 b+=`<path d="${Array.from({length:51},(_,i)=>{const w=-2+i*.1;return `${i?'L':'M'}${X(w)} ${Y(M.lossW(w))}`;}).join('')}" fill="none" stroke="${B}" stroke-width="3"/>`;
 [1.2,.6,.25].forEach((h,i)=>{const a=w0-h,c=w0+h;b+=blink(`<path d="M${X(a)} ${Y(M.lossW(a))}L${X(c)} ${Y(M.lossW(c))}" stroke="${O}" stroke-width="2"/><circle cx="${X(a)}" cy="${Y(M.lossW(a))}" r="4" fill="${O}"/><circle cx="${X(c)}" cy="${Y(M.lossW(c))}" r="4" fill="${O}"/>`,i*.8);});
 b+=`<path d="M${X(w0-1)} ${Y(L0-g)}L${X(w0+1)} ${Y(L0+g)}" stroke="${A}" stroke-width="3"/>`+pulse(X(w0),Y(L0),7,A);
 b+=box(450,40,180,96,'var(--line)','var(--chart)')+t(540,68,'w = 0.5에서',{size:14,fill:MU})+t(540,96,`기울기 ${f(g,4)}`,{size:16,w:700,fill:A})+t(540,122,'h가 줄면 할선 → 접선',{size:13,fill:O});
 return {svg:svg('말귀 뉴런의 손실 곡선 위 w=0.5에서 간격 h가 줄어들며 할선이 접선에 가까워지는 그림',b),caption:`주황 할선은 h=1.2, 0.6, 0.25일 때의 가운데 차분이고, 초록 접선이 해석적 기울기 ${f(g,4)}입니다. 곡선과 기울기는 L(w)=(σ(2w)−1)²의 실제 계산입니다.`};
};

F.autodiff=()=>{
 const r=M.backprop({x:2,w:.5,b:0,y:1}),xs=[60,200,340,480,600],labels=['w, x','z = wx','a = σ(z)','L','∂L/∂L=1'];
 let b=t(320,28,'앞방향: 값을 계산하며 기록',{size:14,fill:O})+t(320,286,'뒷방향: 국소 미분을 곱하며 거슬러 감',{size:14,fill:A});
 [[60,'w, x','0.5, 2'],[200,'z = wx',f(r.z)],[340,'a = σ(z)',f(r.a,3)],[480,'L = (a−1)²',f(r.L,3)]].forEach(([x,n,v],i)=>{b+=box(x-56,110,112,60,i===3?A:'var(--line)')+t(x,136,n,{size:14,w:700})+t(x,158,v,{size:13,fill:O});});
 [[116,144,'×2'],[256,284,`σ′=${f(r.dadz,3)}`],[396,424,`2(a−y)=${f(r.dLda,3)}`]].forEach(([a,c,g],i)=>{b+=line(`M${a} 90H${c+28}`,O)+dot(a,90,c+28-a,0,O,i*.5,5)+line(`M${c+28} 196H${a}`,A)+dot(c+28,196,a-c-28,0,A,1.6+(2-i)*.5,5)+t((a+c+28)/2+0,226,g,{size:13,fill:A});});
 b+=box(540,240,96,34,A,'var(--chart)',6)+t(588,262,`∂L/∂w ${f(r.dLdw,3)}`,{size:13,w:700});
 return {svg:svg('뉴런 하나의 계산 그래프에서 값은 왼쪽에서 오른쪽으로, 기울기는 오른쪽에서 왼쪽으로 흐르는 그림',b),caption:`w=0.5, x=2, y=1일 때 앞방향 값(주황)과 뒷방향 국소 미분(초록)을 실제로 계산했습니다. 세 국소 미분과 x=2를 곱하면 ∂L/∂w=${f(r.dLdw,4)}입니다. 움직이는 점은 계산 순서를 보여 주는 비유입니다.`};
};

F.optimize=()=>{
 const X=x=>320+x*62,Y=y=>150-y*62,gd=M.descend(.15,14),mo=M.descend(.05,30,.8),pts=p=>p.path.map(([x,y],i)=>`${i?'L':'M'}${X(x)} ${Y(y)}`).join('');
 let b=[.5,2,4.5,8].map(c=>`<ellipse cx="320" cy="150" rx="${Math.sqrt(2*c)*62}" ry="${Math.sqrt(2*c/12)*62}" fill="none" stroke="var(--line)"/>`).join('');
 b+=`<path class="fig-draw" d="${pts(gd)}" fill="none" stroke="${O}" stroke-width="2.5"/><path class="fig-draw" style="animation-delay:.8s" d="${pts(mo)}" fill="none" stroke="${A}" stroke-width="2.5"/>`;
 b+=`<circle cx="${X(-4)}" cy="${Y(1.5)}" r="7" fill="${B}"/>`+pulse(320,150,6,'var(--text)');
 b+=t(24,34,'f = ½(x² + 12y²)',{a:'start',size:15})+t(24,272,`주황: 경사하강 η=0.15 (손실 ${f(gd.final,3)}, 14걸음)`,{a:'start',size:14,fill:O})+t(24,292,`초록: 모멘텀 η=0.05, β=0.8 (손실 ${f(mo.final,4)}, 30걸음)`,{a:'start',size:14,fill:A});
 return {svg:svg('좁은 타원 골짜기에서 기본 경사하강은 좌우로 튀고 모멘텀은 부드럽게 바닥으로 가는 두 경로',b,300),caption:'같은 출발점에서 기본 경사하강(주황)은 가파른 y 방향으로 튀고, 모멘텀(초록)은 지난 속도를 쌓아 완만한 x 방향으로 빨리 나아갑니다. 경로는 두 변수 이차 함수에서 실제로 반복 계산한 것입니다.'};
};

F.entropy=()=>{
 const X=p=>70+p*300,Y=s=>250-s*45,q=M.prediction(.7);
 let b=`<path d="M70 250H380M70 40V250" stroke="var(--line)"/>`+t(380,272,'정답에 준 확률 p',{a:'end',size:14,fill:MU})+t(76,34,'놀람 −log₂p (비트)',{a:'start',size:14,fill:MU});
 b+=`<path d="${Array.from({length:60},(_,i)=>{const p=.04+i*.016;return `${i?'L':'M'}${X(p)} ${Y(-M.log2(p))}`;}).join('')}" fill="none" stroke="${B}" stroke-width="3"/>`;
 [[.9,O],[.45,A]].forEach(([p,c],i)=>{b+=blink(`<path d="M${X(p)} 250V${Y(-M.log2(p))}H70" stroke="${c}" stroke-dasharray="4 4" fill="none"/><circle cx="${X(p)}" cy="${Y(-M.log2(p))}" r="6" fill="${c}"/>`+(i?t(X(p)+8,Y(-M.log2(p))-10,`p=${p} → ${f(-M.log2(p),2)}비트`,{a:'start',size:13,fill:c}):t(X(p),Y(-M.log2(p))-20,`p=${p}: ${f(-M.log2(p),2)}비트`,{size:13,fill:c})),i*1.2);});
 b+=t(520,40,'말귀의 예측 Q',{size:14,fill:MU});
 M.COMMANDS.forEach((c,i)=>{const y=62+i*48;b+=t(440,y+22,c,{a:'start',size:15})+`<rect x="490" y="${y+6}" width="130" height="22" rx="3" fill="var(--panel2)"/>`+grow(490,y+6,q[i]*130,22,i?MU:A,i*.2)+t(626,y+22,f(q[i],2),{a:'end',size:13});});
 b+=box(430,214,200,62,A,'var(--chart)')+t(530,238,'교차 엔트로피',{size:14})+t(530,262,`−log₂ 0.70 = ${f(M.crossEntropy([1,0,0],q),2)}비트`,{size:14,w:700,fill:A});
 return {svg:svg('정답 확률이 작아질수록 놀람이 커지는 곡선과 말귀의 세 명령 예측 막대',b),caption:'놀람 곡선에서 확률이 0.9에서 0.45로 절반이 되면 놀람은 정확히 1비트 늘어납니다. 오른쪽은 정답 ‘켜’에 0.7을 준 예측의 교차 엔트로피이며 모두 실제 계산입니다.'};
};

F.stability=()=>{
 const z=[10,11,12],m=12,raw=z.map(Math.exp),sh=z.map(v=>Math.exp(v-m)),LX=v=>40+v*4.2;
 let b=t(24,30,'e^z의 크기 (가로는 z)',{a:'start',size:14,fill:MU})+`<path d="M40 90H600" stroke="var(--line)" stroke-width="2"/>`;
 [[Math.log(65504),'float16 최대 65,504',O],[Math.log(3.4e38),'float32 최대 3.4×10³⁸',B]].forEach(([v,s,c])=>{b+=`<path d="M${LX(v)} 60V100" stroke="${c}" stroke-width="3"/>`+t(LX(v)+6,56,s,{a:'start',size:13,fill:c});});
 z.forEach((v,i)=>{b+=`<circle cx="${LX(v)}" cy="90" r="6" fill="${A}"/>`;});
 b+=pulse(LX(12),90,9,O)+t(LX(11),122,'z = 10, 11, 12',{size:13})+t(LX(0),122,'0',{size:13,fill:MU})+t(LX(120),122,'120',{size:13,fill:MU});
 b+=t(160,164,'그대로: e^z',{size:14,fill:O})+t(470,164,'최댓값 빼기: e^(z−12)',{size:14,fill:A});
 raw.forEach((v,i)=>{b+=t(90,196+i*30,`e^${z[i]} = ${f(v,0)}`,{a:'start',size:14})+(v>65504?t(290,196+i*30,'float16 넘침',{a:'end',size:13,fill:O}):'');});
 sh.forEach((v,i)=>{const y=182+i*30;b+=grow(380,y,v*120,18,A,i*.3)+t(510,y+15,`e^${z[i]-m} = ${f(v,3)}`,{a:'start',size:13});});
 b+=line('M300 220H370',MU)+dot(300,220,70,0,A,0,5);
 return {svg:svg('점수 10·11·12의 지수가 float16 한계를 넘는 모습과, 최댓값을 빼면 모두 1 이하가 되는 모습',b),caption:'위 줄은 지수의 크기를 z 축에 놓고 float16·float32의 최댓값을 표시한 것입니다. 아래 왼쪽은 그대로 계산한 지수, 오른쪽은 최댓값 12를 뺀 지수로 모두 실제 값입니다.'};
};

F.sampling=()=>{
 const L=[2.2,1.8,1.1,.2,-.8],temps=[.3,.7,1,2];let b=t(24,30,'확인 문장 다섯 개의 확률 (온도별)',{a:'start',size:14,fill:MU});
 temps.forEach((T,k)=>{const p=M.softmaxT(L,T);let g=t(320,62,`T = ${T}`,{size:18,w:700,fill:A});p.forEach((v,i)=>{const x=90+i*100,h=v*170;g+=`<rect x="${x}" y="${250-h}" width="60" height="${h}" rx="3" fill="${i?B:A}"/>`+t(x+30,244-h,f(v,2),{size:14});});g+=t(320,288,`1등 확률 ${f(p[0],2)} · 엔트로피 ${f(M.entropy(p),2)}비트`,{size:14,fill:MU});b+=turn(g,k);});
 b+=`<path d="M70 250H600" stroke="var(--line)"/>`;
 ['문장1','문장2','문장3','문장4','문장5'].forEach((s,i)=>b+=t(120+i*100,268,s,{size:13,fill:MU}));
 return {svg:svg('온도를 0.3, 0.7, 1, 2로 바꿀 때 다섯 문장의 확률 막대가 뾰족했다가 평평해지는 그림',b),caption:'같은 점수에서 온도만 0.3→0.7→1→2로 바꾼 확률을 실제로 계산해 차례로 보여 줍니다. 온도가 낮으면 1등이 거의 독차지하고, 높으면 다섯 문장이 비슷해집니다.'};
};

F.svd=()=>{
 const A0=M.spectrogram(),d=M.svd(A0),R1=M.lowRank(d,1),R2=M.lowRank(d,2),max=Math.max(...A0.flat()),L2=R2.map((r,i)=>r.map((v,j)=>v-R1[i][j]));
 const heat=(X,x0,y0)=>X.map((row,i)=>row.map((v,j)=>`<rect x="${x0+j*11}" y="${y0+i*11}" width="10" height="10" fill="${v<0?O:A}" fill-opacity="${Math.min(1,Math.abs(v)/max).toFixed(3)}"/>`).join('')).join('');
 let b=t(85,40,'원래 표 A',{size:14})+heat(A0,30,60);
 b+=t(160,130,'≈',{size:30})+blink(t(255,40,`σ₁ = ${f(d.s[0],2)}`,{size:14,fill:A})+heat(R1,200,60),0);
 b+=t(330,130,'+',{size:30})+blink(t(425,40,`σ₂ = ${f(d.s[1],2)}`,{size:14,fill:A})+heat(L2,370,60),.8);
 b+=t(500,130,'+ …',{size:22,fill:MU});
 b+=d.s.slice(0,8).map((s,i)=>grow(530,58+i*22,s/d.s[0]*90,14,i<2?A:MU,i*.15)).join('')+t(580,246,'특잇값 크기',{size:13,fill:MU});
 b+=t(320,266,'층 하나 = 시간 모양 u × 주파수 모양 vᵀ',{size:14})+t(320,288,`앞 두 층이 에너지의 ${f(M.compress(A0,2).kept*100,1)}%`,{size:14,fill:A});
 return {svg:svg('‘켜’ 스펙트로그램을 특잇값 순서대로 층 두 개의 합으로 나누는 그림',b),caption:'가상 스펙트로그램(12×10)의 SVD를 실제로 계산해 첫째 층 σ₁u₁v₁ᵀ와 둘째 층을 따로 그렸습니다. 주황은 음수 칸이며, 오른쪽 막대는 특잇값이 얼마나 빨리 줄어드는지 보여 줍니다.'};
};

F.linsys=()=>{
 const degs=[90,30,10,5];let b=t(24,30,'특징 열 u, v와 조건수',{a:'start',size:14,fill:MU});
 degs.forEach((d,k)=>{const r=M.conditioning(d),th=d*Math.PI/180,ox=110,oy=230;let g=`<path d="M${ox} ${oy}H${ox+170}" stroke="${B}" stroke-width="4"/><path d="M${ox} ${oy}L${ox+170*Math.cos(th)} ${oy-170*Math.sin(th)}" stroke="${O}" stroke-width="4"/>`+t(ox+186,oy+5,'u',{size:15})+t(ox+170*Math.cos(th)+14,oy-170*Math.sin(th),'v',{size:15})+t(ox+40,oy-14,`${d}°`,{size:15,fill:MU});
  g+=box(380,70,240,150,A,'var(--chart)')+t(500,104,`θ = ${d}°`,{size:16,w:700})+t(500,140,`조건수 κ = ${f(r.kappa,1)}`,{size:16,fill:A})+t(500,174,`잡음 0.01 → 해 이동 ${f(r.shift,3)}`,{size:14})+t(500,200,`(${f(r.shift/.01,1)}배로 커짐)`,{size:13,fill:MU});b+=turn(g,k);});
 b+=t(320,286,'열이 닮을수록 σmin이 0에 가까워집니다',{size:14,fill:MU});
 return {svg:svg('두 특징 열 사이 각도가 90도에서 5도로 줄어들 때 조건수와 해의 흔들림이 커지는 그림',b),caption:'각도가 90°, 30°, 10°, 5°로 줄 때마다 조건수와, b에 0.01의 잡음이 섞였을 때 해가 움직이는 거리를 실제로 계산해 차례로 보여 줍니다.'};
};

F.markov=()=>{
 const P=M.commandChain(.5),pi=M.stationary(P),pos=[[120,90],[320,230],[120,230]],names=M.COMMANDS;
 let b=`<defs><marker id="a02-mk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs>`;const arrow=(i,j,dy)=>{const [x1,y1]=pos[i],[x2,y2]=pos[j],mx=(x1+x2)/2+dy,my=(y1+y2)/2-dy,e=(x,y)=>{const dx=x-mx,dy2=y-my,l=Math.hypot(dx,dy2);return [x-dx/l*32,y-dy2/l*32];},[sx,sy]=e(x1,y1),[ex,ey]=e(x2,y2);return `M${sx} ${sy}Q${mx} ${my} ${ex} ${ey}`;};
 [[0,1,30],[1,0,-30],[0,2,40],[2,1,30],[1,2,-30],[2,0,-40]].forEach(([i,j,dy],k)=>{b+=`<path d="${arrow(i,j,dy)}" fill="none" stroke="var(--muted)" stroke-width="1.6" marker-end="url(#a02-mk)"/>`;const [x1,y1]=pos[i],[x2,y2]=pos[j];b+=dot(x1,y1,x2-x1,y2-y1,[A,O,B][i],k*.4,5);const mx=(x1+x2)/2+dy*.55,my=(y1+y2)/2-dy*.55;b+=t(mx,my+5,f(P[i][j],1),{size:13,fill:MU});});
 pos.forEach(([x,y],i)=>{b+=`<circle cx="${x}" cy="${y}" r="30" fill="var(--panel2)" stroke="${[A,O,B][i]}" stroke-width="3"/>`+t(x,y+6,names[i],{size:16,w:700});});
 b+=t(510,40,'정상 분포 π',{size:15,fill:MU});
 pi.forEach((v,i)=>{const y=70+i*56;b+=t(420,y+20,names[i],{a:'start',size:15})+`<rect x="470" y="${y+4}" width="150" height="22" rx="3" fill="var(--panel2)"/>`+grow(470,y+4,v*150/.5,22,[A,O,B][i],i*.3)+t(620,y+44,f(v,3),{a:'end',size:13});});
 b+=t(510,270,'πP = π',{size:16,w:700,fill:A});
 return {svg:svg('켜·꺼·밝게 세 상태 사이를 확률 화살표로 오가는 마르코프 연쇄와 그 정상 분포 막대',b),caption:`화살표의 숫자는 그 방향으로 옮겨 갈 가상 전이 확률(q=0.5)이며 제자리에 머무는 확률은 생략했고, 오른쪽 막대는 거듭 곱해 실제로 계산한 정상 분포입니다. 움직이는 점은 명령이 옮겨 가는 흐름을 보여 주는 비유입니다.`};
};

F.final=()=>{
 const rows=[[200,.89],[2000,.89]].map(([n,p])=>[n,M.diffInterval(.86,p,n)]),X=v=>80+(v+.1)/.25*480;
 let b=t(24,32,'정확도 차이(새 − 이전)의 95% 구간',{a:'start',size:14,fill:MU})+`<path d="M80 220H560" stroke="var(--line)"/><path d="M${X(0)} 50V230" stroke="var(--text)" stroke-dasharray="5 5"/>`;
 [-.1,-.05,0,.05,.1,.15].forEach(v=>b+=t(X(v),246,`${v>0?'+':''}${Math.round(v*100)}%p`,{size:13,fill:MU}));
 rows.forEach(([n,r],i)=>{const y=80+i*70;b+=t(24,y+16,`n=${n.toLocaleString('en-US')}`,{a:'start',size:14})+grow(X(r.lo),y,X(r.hi)-X(r.lo),24,r.clear?A:O,i*.6)+`<circle cx="${X(r.d)}" cy="${y+12}" r="7" fill="var(--text)"/>`+t(X(r.hi)+8,y+17,`${f(r.lo*100,1)}~${f(r.hi*100,1)}`,{a:'start',size:13,fill:r.clear?A:O});});
 b+=pulse(X(0),115,10,O)+t(320,282,'같은 3%p 차이도 녹음 수에 따라 0을 포함하거나 넘습니다',{size:14});
 return {svg:svg('녹음 200개와 2,000개일 때 정확도 차이 3%p의 95% 구간을 0과 비교하는 그림',b),caption:'86%에서 89%로의 차이를 정규 근사로 실제 계산했습니다. 녹음 200개(주황)는 구간이 0을 포함하고, 2,000개(초록)는 0을 넘습니다. 정확도와 녹음 수는 가정한 값입니다.'};
};

function fallback(c){
 const steps=c.flow.map(x=>x.split('|')),n=steps.length,w=(600-(n-1)*20)/n;
 let b='';steps.forEach(([a,s],i)=>{const x=20+i*(w+20);b+=blink(box(x,90,w,110,A),i*.6)+t(x+w/2,140,a,{w:700})+t(x+w/2,168,s.length>14?s.slice(0,14)+'…':s,{size:13,fill:MU});if(i<n-1)b+=line(`M${x+w} 145H${x+w+20}`)+dot(x+w-4,145,24,0,A,i*.6,5);});
 return {svg:svg(`${c.title}의 흐름: ${steps.map(s=>s[0]).join(', ')}`,b),caption:`${c.subtitle}`};
}
function render(c){return F[c.id]?F[c.id](H):fallback(c);}
return {render,F,H};
})();
