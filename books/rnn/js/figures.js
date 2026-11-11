/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 기울기 크기 같은 숫자는 RNMath로 실제로 계산해 그린다.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다. */
window.RNFigures=(()=>{
'use strict';
const M=RNMath,f=(n,d=2)=>Number(n).toFixed(d),int=n=>Math.round(n).toLocaleString('en-US');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const svg=(label,body,h=280)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}${o.cls?` class="${o.cls}"`:''}${o.style?` style="${o.style}"`:''}>${esc(s)}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='',style='')=>`<rect${cls?` class="${cls}"`:''}${style?` style="${style}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const pkt=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const seq=(i,body)=>`<g class="fig-seq" style="animation-delay:${(i*0.6).toFixed(1)}s">${body}</g>`;
/* 점과 선으로 그린 곡선 하나. pts는 [0,1] 범위로 정규화된 [x,y]. */
function curve(pts,color,{L=70,R=600,T=50,B=230,dash=false}={}){
 const p=pts.map(([x,y])=>[L+x*(R-L),B-Math.max(0,Math.min(1,y))*(B-T)]);
 return `<path class="fig-draw" d="${p.map((q,i)=>`${i?'L':'M'}${f(q[0],1)} ${f(q[1],1)}`).join('')}" fill="none" stroke="${color}" stroke-width="2.6"${dash?' stroke-dasharray="6 5"':''}/>`+p.map(q=>`<circle cx="${f(q[0],1)}" cy="${f(q[1],1)}" r="4" fill="${color}"/>`).join('');
}
const A='var(--accent)',BL='var(--blue)',OR='var(--orange)',MU='var(--muted)',LN='var(--line)';
/* 은닉 상태 h는 모든 그림에서 강조색 둥근 상자, 입력 x는 파란 글자, 기울기는 주황 점선으로 그린다. */
const hbox=(x,y,label='h',w=70)=>box(x,y,w,40,A,'var(--panel)',20)+t(x+w/2,y+26,label,{w:700,fill:A});
const arrow=(d,c=MU,cls='fig-dash')=>line(d,c,cls);
const LINE=['RNN','LSTM','Seq2Seq','어텐션','트랜스포머','BERT·GPT·T5'];
function lineage(from,to,note){
 return LINE.map((n,i)=>{const x=14+i*104,on=i>=from&&i<=to;return box(x,70,92,50,on?A:LN,on?'var(--panel)':'var(--panel2)',8,on?'fig-pulse':'')+t(x+46,101,n,{size:n.length>6?12:14,w:on?700:400,fill:on?A:'var(--text)'})+(i<5?arrow(`M${x+92} 95H${x+104}`):'');}).join('')+t(320,40,'순서가 있는 자료를 다루는 모델의 계보',{w:700})+t(320,160,note,{size:13,fill:MU});
}
const draw={
 why(){return {svg:svg('RNN에서 LSTM, Seq2Seq, 어텐션, 트랜스포머, BERT·GPT·T5로 이어지는 계보. 이 책은 앞의 두 칸 RNN과 LSTM을 다룬다',lineage(0,1,'강조한 두 칸이 이 책의 범위입니다. 오른쪽 네 칸은 다른 책이 다룹니다.'),180),caption:'순서가 있는 자료를 다루는 모델은 RNN에서 출발해 트랜스포머와 그 위의 언어 모델로 이어졌습니다. 이 책은 맨 앞의 RNN과 LSTM을 계산합니다.'};},
 cell(){
  const body=hbox(285,100,'h_t')+box(250,80,140,80,LN,'none',10)+t(320,72,'RNN 셀 (한 시점의 연산)',{size:13,fill:MU})
   +t(320,236,'입력 x_t',{fill:BL})+arrow('M320 220V164',BL)+pkt(320,220,0,-56,BL,0)
   +t(110,125,'앞 시점의 h_(t−1)',{fill:A})+arrow('M180 120H246',A)+pkt(180,120,66,0,A,0.4)
   +arrow('M394 120H470',A)+t(540,125,'다음 시점으로',{fill:A})+pkt(394,120,76,0,A,1.2)
   +t(320,36,'h_t = tanh(W_hh·h_(t−1) + W_xh·x_t)',{w:700});
  return {svg:svg('RNN 셀 하나. 입력 x_t와 앞 시점의 은닉 상태 h_(t−1)가 들어와 새 은닉 상태 h_t가 나가고, h_t는 다음 시점의 셀로 넘어간다',body,250),caption:'셀은 지금 입력과 앞 시점의 은닉 상태 두 가지를 받아 새 은닉 상태 하나를 냅니다.'};
 },
 unroll(){
  const body=[0,1,2,3].map(i=>{const x=60+i*150;return seq(i,hbox(x,90,`h${i+1}`)+t(x+35,190,`x${i+1}`,{fill:BL})+arrow(`M${x+35} 174V134`,BL,'')+t(x+35,74,'W',{size:12,fill:MU}))+(i<3?arrow(`M${x+70} 110H${x+150}`,A):'');}).join('')+t(320,36,'같은 셀, 같은 가중치 W를 시점마다 다시 쓴다',{w:700})+t(320,226,'길이가 늘어도 W의 개수는 그대로',{size:13,fill:MU});
  return {svg:svg('RNN을 시간 축으로 펼친 그림. 네 시점의 셀이 왼쪽에서 오른쪽으로 은닉 상태를 넘기며 모두 같은 가중치 W를 쓴다',body,240),caption:'펼친 그림의 셀 네 개는 서로 다른 층이 아니라 같은 셀을 네 번 쓴 것입니다.'};
 },
 shapes(){
  const mini=(x0,title,ins,outs,n)=>t(x0+90,36,title,{size:13,w:700})+Array.from({length:n},(_,i)=>{const x=x0+i*(180/n);return box(x,90,180/n-8,30,A,'var(--panel)',6)+(ins(i)?arrow(`M${x+(180/n-8)/2} 150V124`,BL,'')+t(x+(180/n-8)/2,166,'x',{size:12,fill:BL}):'')+(outs(i)?arrow(`M${x+(180/n-8)/2} 86V62`,OR,'')+t(x+(180/n-8)/2,56,'y',{size:12,fill:OR}):'');}).join('');
  const body=mini(20,'여러 입력 → 출력 하나',()=>true,i=>i===3,4)+mini(230,'입력마다 출력 하나',()=>true,()=>true,4)+mini(440,'다 읽은 뒤 출력',i=>i<3,i=>i>=3,6)+`<circle class="fig-pulse" cx="176" cy="60" r="5" fill="${OR}"/>`;
  return {svg:svg('입출력 형태 세 가지. 왼쪽은 네 입력을 읽고 마지막에 출력 하나, 가운데는 입력마다 출력 하나, 오른쪽은 세 입력을 다 읽은 뒤 세 출력을 차례로 낸다',body,180),caption:'같은 셀을 쓰더라도 입력 x와 출력 y를 어느 시점에 붙이느냐에 따라 형태가 갈립니다.'};
 },
 bptt(){
  const body=[0,1,2].map(i=>{const x=90+i*170;return hbox(x,70,`h${i+1}`)+t(x+35,170,`x${i+1}`,{fill:BL})+arrow(`M${x+35} 154V114`,BL,'')+(i<2?arrow(`M${x+70} 84H${x+170}`,A,''):'');}).join('')
   +box(540,62,80,56,OR,'var(--panel)',8)+t(580,95,'손실 L',{fill:OR,w:700})+arrow('M500 90H536',MU,'')
   +[1,0].map((i,k)=>arrow(`M${90+(i+1)*170} 100H${90+i*170+74}`,OR)+pkt(90+(i+1)*170,100,-96,0,OR,k*0.8)).join('')+pkt(540,100,-40,0,OR,0)
   +t(320,36,'순전파는 왼쪽에서 오른쪽, 기울기는 오른쪽에서 왼쪽',{w:700})+t(320,216,'주황 점: 시점을 하나씩 거슬러 오르는 ∂L/∂h',{size:13,fill:OR});
  return {svg:svg('세 시점으로 펼친 RNN에서 손실의 기울기가 마지막 시점에서 첫 시점 쪽으로 한 단계씩 거슬러 오르는 그림',body,230),caption:'손실에서 출발한 기울기는 펼친 그림을 거꾸로 따라가며 시점마다 가중치의 몫을 남깁니다.'};
 },
 vanish(){
  const a=M.gradNorms({rho:0.9,T:13,act:'tanh'}).norms,b=M.gradNorms({rho:1.3,T:13,act:'none'}).norms,top=Math.log10(b[12]);
  const bars=(arr,y,c,label)=>t(20,y+16,label,{a:'start',size:13})+arr.map((v,k)=>{const h=Math.max(2,(Math.log10(v)+5)/(top+5)*60);return `<rect class="fig-grow fig-up" style="animation-delay:${(k*0.08).toFixed(2)}s" x="${600-k*36}" y="${y+64-h}" width="26" height="${h}" rx="3" fill="${c}"/>`;}).join('');
  const body=t(320,30,'마지막 시점(오른쪽)에서 앞 시점(왼쪽)으로 갈수록',{w:700})+bars(a,50,A,'ρ = 0.9, tanh: 줄어든다')+bars(b,150,OR,'ρ = 1.3, 선형: 커진다')+t(320,246,`12단계 앞에서 ${a[12].toExponential(1)}배와 ${b[12].toFixed(1)}배 (막대 높이는 로그 눈금)`,{size:13,fill:MU});
  return {svg:svg(`기울기 크기를 시점별 막대로 그린 그림. 순환 가중치 크기 0.9와 tanh에서는 12단계 앞에서 ${a[12].toExponential(1)}배로 줄고, 1.3과 선형에서는 ${b[12].toFixed(1)}배로 커진다`,body,256),caption:'같은 값을 단계마다 곱하므로 1보다 작으면 사라지고 1보다 크면 폭발합니다.'};
 },
 truncate(){
  const body=t(320,30,'긴 기록을 창으로 자르면',{w:700})+[0,1,2].map(i=>{const x=30+i*200;return box(x,60,180,60,LN,'var(--panel2)',8)+t(x+90,82,`창 ${i+1}`,{size:13})+arrow(`M${x+170} 104H${x+14}`,OR)+pkt(x+170,104,-150,0,OR,i*0.5)+(i<2?arrow(`M${x+180} 76H${x+200}`,A,'')+t(x+190,68,'h',{size:12,fill:A}):'');}).join('')
   +t(320,156,'주황: 기울기는 창 안에서만 거슬러 오른다',{size:13,fill:OR})+t(320,180,'초록 h: 은닉 상태의 값은 다음 창으로 넘긴다 (기울기는 끊는다)',{size:13,fill:A});
  return {svg:svg('긴 기록을 창 세 개로 자른 그림. 기울기는 각 창 안에서만 거슬러 오르고 은닉 상태의 값만 다음 창으로 넘어간다',body,196),caption:'잘라서 학습하면 기울기가 닿는 거리는 창 길이로 묶이고, 은닉 상태의 값은 창을 넘어 이어집니다.'};
 },
 lstm(){
  const g=(x,label,name,c)=>box(x,150,84,40,c,'var(--panel)',8)+t(x+42,175,label,{fill:c,w:700})+t(x+42,210,name,{size:12,fill:MU});
  const body=t(320,30,'셀 상태 C는 곱하기 한 번, 더하기 한 번만 거쳐 지나간다',{w:700})
   +arrow('M30 80H610',A)+pkt(30,80,560,0,A,0,7)+t(34,66,'C_(t−1)',{a:'start',fill:A})+t(606,66,'C_t',{a:'end',fill:A})
   +`<circle cx="190" cy="80" r="14" fill="var(--panel)" stroke="${OR}" stroke-width="2"/>`+t(190,86,'×',{fill:OR,w:700})+`<circle cx="360" cy="80" r="14" fill="var(--panel)" stroke="${BL}" stroke-width="2"/>`+t(360,86,'+',{fill:BL,w:700})
   +g(148,'f','망각 게이트',OR)+arrow('M190 150V96',OR,'')+g(270,'i · g̃','입력 게이트 × 후보',BL)+arrow('M330 150L352 94',BL,'')+g(470,'o','출력 게이트',MU)+arrow('M512 150V110',MU,'')+t(560,128,'h_t = o·tanh(C_t)',{size:12});
  return {svg:svg('LSTM 셀. 위쪽 선을 따라 셀 상태 C가 지나가며 망각 게이트 f를 곱하고 입력 게이트와 후보의 곱을 더한다. 출력 게이트 o가 은닉 상태 h를 정한다',body,224),caption:'셀 상태는 망각 게이트로 덜어 내고 입력 게이트로 더하는 두 연산만 거칩니다.'};
 },
 gru(){
  const lane=(y,label,c,mark,note)=>t(20,y-26,label,{a:'start',size:13,w:700})+arrow(`M40 ${y}H600`,c)+[0,1,2,3,4].map(i=>`<circle cx="${110+i*110}" cy="${y}" r="15" fill="var(--panel)" stroke="${c}" stroke-width="2"/>`+t(110+i*110,y+5,mark,{size:11,fill:c})).join('')+pkt(600,y,-560,0,c,0)+t(620,y+34,note,{a:'end',size:12,fill:MU});
  const body=t(320,28,'기울기가 지나는 길 (오른쪽에서 왼쪽)',{w:700})+lane(86,'단순 RNN: 시점마다 W_hh와 tanh의 미분을 곱한다',MU,'W·t′','게이트가 없어 줄이는 값을 고를 수 없다')+lane(176,'LSTM·GRU: 시점마다 게이트 값(0~1)을 곱한다',A,'×f','게이트가 1에 가까우면 거의 그대로 지나간다');
  return {svg:svg('단순 RNN과 LSTM·GRU에서 기울기가 지나는 길의 비교. 단순 RNN은 시점마다 가중치와 tanh의 미분을 곱하고, LSTM과 GRU는 시점마다 게이트 값을 곱한다',body,226),caption:'LSTM과 GRU에는 게이트 값만 곱해지는 길이 따로 있습니다. 그 게이트가 얼마나 열리느냐가 기울기가 닿는 거리를 정합니다.'};
 },
 embed(){
  const st=[['문장','맛이 좋지 않다'],['토큰','맛 / 이 / 좋 / 지 / 않 / 다'],['번호 (인코딩)',`[${M.encode('맛 이 좋 지 않 다'.split(' ')).join(', ')}]`],['벡터 (임베딩)','번호마다 4차원'],['LSTM','한 토큰씩 읽기'],['긍정 확률','0~1']];
  const body=t(320,30,'문장이 숫자가 되어 LSTM에 들어가기까지',{w:700})+st.map(([a,b],i)=>{const x=10+i*105;return seq(i,box(x,60,96,70,i===3?A:LN,'var(--panel)',8)+t(x+48,86,a,{size:12,w:700,fill:i===3?A:'var(--text)'})+t(x+48,110,b.length>14?b.slice(0,13)+'…':b,{size:10,fill:MU}))+(i<5?arrow(`M${x+96} 95H${x+105}`,MU,''):'');}).join('')+t(320,160,'인코딩은 문자를 숫자로 바꾸는 일 전체, 임베딩은 그 가운데 번호를 벡터로 바꾸는 방법 하나',{size:13,fill:MU});
  return {svg:svg('문장이 토큰, 번호, 벡터를 거쳐 LSTM에 들어가 긍정 확률이 되는 여섯 단계',body,176),caption:'문장은 토큰으로 나뉘고, 토큰은 번호가 되고, 번호는 벡터가 되어 한 시점에 하나씩 셀에 들어갑니다.'};
 },
 validate(){
  const tr=Array.from({length:12},(_,i)=>[i/11,0.85*Math.exp(-i/3)+0.08]),va=Array.from({length:12},(_,i)=>[i/11,0.55*Math.exp(-i/2)+0.3+0.035*i]);
  const body=t(320,30,'학습 오차는 계속 줄고, 검증 오차는 줄다가 다시 는다',{w:700})+line('M70 230H600M70 50V230',LN,'')+curve(tr,BL)+curve(va,A)+`<circle class="fig-pulse" cx="${70+3/11*530}" cy="${230-va[3][1]*180}" r="8" fill="none" stroke="${OR}" stroke-width="3"/>`+t(70+3/11*530,230-va[3][1]*180-16,'여기서 저장',{size:13,fill:OR})+t(596,230-tr[11][1]*180-10,'학습',{a:'end',size:13,fill:BL})+t(596,230-va[11][1]*180-10,'검증',{a:'end',size:13,fill:A})+t(335,252,'반복 수',{size:13,fill:MU});
  return {svg:svg('반복 수에 따른 학습 오차와 검증 오차의 모양. 학습 오차는 계속 줄지만 검증 오차는 줄다가 다시 늘며, 가장 낮은 지점에 저장 표시가 있다',body,262),caption:'검증 오차가 가장 낮은 반복에서 모델을 저장합니다. 곡선의 모양만 그린 것이며 실제 값은 아래 실험이 계산합니다.'};
 },
 limits(){
  const n=6,xs=i=>70+i*100,dots=(y,c)=>Array.from({length:n},(_,i)=>`<circle cx="${xs(i)}" cy="${y}" r="13" fill="var(--panel)" stroke="${c}" stroke-width="2"/>`).join('');
  const body=t(320,28,'첫 토큰의 정보가 마지막 토큰에 닿는 길',{w:700})+t(20,60,'RNN: 5단계를 차례로',{a:'start',size:13,w:700})+arrow(`M${xs(0)+13} 90H${xs(5)-13}`,MU)+dots(90,MU)+pkt(xs(0),90,500,0,A,0,6)
   +t(20,150,'어텐션: 1단계로 바로',{a:'start',size:13,w:700})+dots(200,A)+arrow(`M${xs(0)} 187C${xs(1)} 140 ${xs(4)} 140 ${xs(5)} 187`,A)+`<circle class="fig-pkt" style="--dx:500px;--dy:0px;animation-duration:1s" cx="${xs(0)}" cy="176" r="6" fill="${A}"/>`+t(320,240,'다음 책: Seq2Seq과 어텐션, 트랜스포머',{size:13,fill:MU});
  return {svg:svg('토큰 여섯 개에서 첫 토큰의 정보가 마지막 토큰에 닿는 길의 비교. RNN은 다섯 단계를 차례로 거치고 어텐션은 한 단계로 바로 잇는다',body,250),caption:'RNN에서는 두 토큰 사이의 거리만큼 단계를 거쳐야 하고, 어텐션은 어느 두 토큰이든 한 단계로 잇습니다.'};
 },
 final(){
  const steps=[['출력 개수','4장'],['기울기 크기','6·7장'],['먼 입력','8·9장'],['패딩','10장'],['학습·검증 오차','11장']];
  const body=t(320,34,'학습 기록을 읽는 순서',{w:700})+steps.map(([n,c],i)=>{const x=20+i*124;return seq(i,box(x,70,112,90,A,'var(--panel)',8)+t(x+56,104,`${i+1}`,{size:22,w:700,fill:A})+t(x+56,130,n,{size:12})+t(x+56,150,c,{size:11,fill:MU}))+(i<4?line(`M${x+112} 115H${x+124}`,MU,''):'');}).join('')+t(320,200,'기록의 숫자가 어느 장의 실험에서 나오는지부터 찾는다',{size:13});
  return {svg:svg('학습 기록을 읽는 다섯 단계: 출력 개수, 기울기 크기, 먼 입력, 패딩, 학습·검증 오차',body,220),caption:'원인을 고르기 전에 기록의 숫자가 무엇을 잰 것인지부터 확인합니다.'};
 }
};
const COMPUTED=new Set(['vanish']);
function render(id){const r=draw[id]?draw[id]():null;if(r)r.caption+=COMPUTED.has(id)?' 막대의 값은 브라우저에서 RNMath로 실제로 계산한 것입니다.':' 이 그림은 구조를 나타낸 도식입니다.';return r;}
return {render};
})();
