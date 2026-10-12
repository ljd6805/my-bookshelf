/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자는 모두 ITMath로 윤슬·도윤 메시지(합성 데이터)를 실제로 계산해 그린다.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다. */
window.ITFigures=(()=>{
'use strict';
const M=ITMath,f=(n,d=2)=>Number(n).toFixed(d);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const sci=x=>{const e=Math.floor(Math.log10(x));const sup=String(e).split('').map(c=>'⁻⁰¹²³⁴⁵⁶⁷⁸⁹'['-0123456789'.indexOf(c)]).join('');return `${(x/10**e).toFixed(1)} × 10${sup}`;};
const show=ch=>ch==='\n'?'↵':ch===' '?'␣':ch;
const svg=(label,body,h=280)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${esc(s)}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const blink=(body,delay)=>`<g class="fig-seq" style="animation-delay:${delay}s">${body}</g>`;
const up=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow fig-up" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${w}" height="${Math.max(h,1)}" rx="3" fill="${color}"/>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
/* 세로 막대 묶음: 값·이름·색을 받아 바닥선 위에 세운다. */
function columns(vals,names,colors,{x0=70,base=230,scale=30,gap=0,w=60,digits=2,unit='비트'}={}){
 const step=gap||((560-x0)/vals.length);
 return vals.map((v,i)=>{const x=x0+i*step,h=v*scale;return up(x,base-h,w,h,colors[i%colors.length],i*.15)+t(x+w/2,base-h-8,`${f(v,digits)}${unit}`,{size:13,w:700})+t(x+w/2,base+20,names[i],{size:13,fill:'var(--muted)'});}).join('')+line(`M${x0-20} ${base}H620`,'var(--line)','');
}
let cache=null;
function data(){
 if(cache)return cache;
 const y=M.corpus.yunseul(),s=M.stats(y),tr=M.corpus.train(),te=M.corpus.test();
 cache={s,F:new Map(s.counts),ctx:[0,1,2].map(k=>M.condEntropy(y,k).H),ppl:[0,1,2].map(o=>{const m=M.model(o,tr,0.01);return [M.codeLength(m,tr).perChar,M.codeLength(m,te).perChar];})};
 return cache;
}
const draw={
 surprise(){const {s,F}=data(),c=M.chars('응 지금 가는 중'),b=c.map(x=>M.info(F.get(x)/s.n)),tot=b.reduce((a,x)=>a+x,0);
  const body=c.map((x,i)=>{const X=40+i*64,h=b[i]*19;return up(X,220-h,46,h,b[i]>6?'var(--orange)':'var(--accent)',i*.12)+t(X+23,214-h,f(b[i],1),{size:12,w:700})+t(X+23,246,show(x),{size:18});}).join('')+line('M24 220H620','var(--line)','')+t(320,30,`“응 지금 가는 중” = ${f(tot)}비트 (UTF-8은 168비트)`,{w:700})+t(320,272,'막대 높이 = −log₂(그 글자의 비율), 드문 글자일수록 높다',{size:12,fill:'var(--muted)'});
  return {svg:svg(`메시지 한 줄의 글자마다 정보량 막대. 합계 ${f(tot)}비트`,body),caption:`윤슬 묶음 618글자의 빈도로 잰 글자별 정보량입니다. 공백은 2.3비트, “지”는 ${f(b[2],1)}비트입니다.`};},
 entropy(){const sets=[[20,15,10,5],[25,25,25,25],[70,10,10,10],[30,30,0,0]],names=['처음 횟수','넷이 같게','한쪽 쏠림','둘만 반반'],H=sets.map(v=>M.entropy(v));
  const bars=sets.map((v,i)=>{const tot=v.reduce((a,x)=>a+x,0);let x=60;return t(20,62+i*52,names[i],{a:'start',size:12,fill:'var(--muted)'})+v.map((n,j)=>{const w=n/tot*380,r=w?grow(x,70+i*52,Math.max(w-2,1),22,['var(--accent)','var(--blue)','var(--orange)','var(--muted)'][j],i*.2):'';x+=w;return r;}).join('')+t(470,87+i*52,`H = ${f(H[i],3)}비트`,{a:'start',size:14,w:700});}).join('');
  return {svg:svg('답장 네 가지의 비율 띠와 엔트로피',t(320,30,'비율이 고를수록 평균 놀라움이 커진다 (최대 log₂4 = 2비트)',{w:700})+bars),caption:'네 띠는 답장 응·ㅋㅋ·알겠어·나중에의 비율입니다. 넷이 같을 때 2비트로 가장 크고, 둘만 반반이면 1비트입니다.'};},
 context(){const {ctx}=data();
  const body=t(320,30,'앞 글자를 볼수록 다음 글자가 덜 놀랍다',{w:700})+columns(ctx,['H(지금)','H(지금 | 앞 1)','H(지금 | 앞 2)'],['var(--muted)','var(--accent)','var(--blue)'],{x0:110,scale:30,w:90,digits:3})+line('M215 120C260 80 300 80 330 150','var(--orange)')+line('M395 160C440 120 480 120 510 200','var(--orange)');
  return {svg:svg(`조건부 엔트로피 ${ctx.map(x=>f(x,3)).join(', ')}비트`,body),caption:`윤슬 70개 전부에서 계산했습니다. 앞 1글자를 보면 ${f(ctx[0]-ctx[1])}비트가 줄고, 앞 2글자는 자료가 적어 실제보다 더 작게 나옵니다.`};},
 huffman(){const top=data().s.counts.slice(0,6),h=M.huffman(top.map(([sym,w])=>({sym,w})));let q=top.map(([s,w])=>({label:show(s),w}));const rows=[q.map(x=>`${x.label} ${x.w}`)];
  while(q.length>1){q.sort((a,b)=>a.w-b.w);const [a,b]=q.splice(0,2);q.push({label:'('+a.label+b.label+')',w:a.w+b.w});rows.push(q.slice().sort((a,b)=>b.w-a.w).map(x=>`${x.label} ${x.w}`));}
  const body=t(320,24,'가장 드문 둘을 합치기를 한 덩어리가 될 때까지',{w:700})+rows.map((r,i)=>blink(t(20,52+i*34,`${i}단계`,{a:'start',size:12,fill:'var(--muted)'})+t(80,52+i*34,r.join('   '),{a:'start',size:13}),i*.6)).join('')+t(320,270,[...h.codes].map(([k,v])=>`${show(k)}=${v}`).join('  '),{size:13,w:700,fill:'var(--accent)'});
  return {svg:svg('허프만 합치기 단계와 완성된 부호',body),caption:`자주 나오는 여섯 글자만으로 지은 허프만 부호입니다. 평균 길이 ${f(h.L,3)}비트, 엔트로피 ${f(h.H,3)}비트입니다.`};},
 mismatch(){const m=M.model(0,M.corpus.yunseul(),0.1),t2=M.corpus.doyoonB(),cross=M.codeLength(m,t2).perChar,self=M.stats(t2).H;
  const body=t(320,30,'남의 빈도로 지은 부호는 길다',{w:700})+columns([self,cross],['도윤 자신의 엔트로피','윤슬 빈도로 지은 부호'],['var(--accent)','var(--orange)'],{x0:170,scale:22,w:110})+line(`M420 ${230-self*22}H560`,'var(--accent)')+t(560,230-(self+cross)/2*22,`KL ≈ ${f(cross-self)}비트`,{a:'end',size:14,w:700,fill:'var(--orange)'});
  return {svg:svg(`도윤 메시지의 엔트로피 ${f(self,3)}비트와 교차 엔트로피 ${f(cross,3)}비트`,body),caption:`도윤 뒤 15개를 윤슬 빈도(α = 0.1)로 지은 부호로 보내면 ${f(cross,3)}비트/글자가 듭니다. 차이 ${f(cross-self)}비트가 KL입니다.`};},
 arithmetic(){const m=M.model(1,M.corpus.train(),1),e=M.arithEncode(m,'응 지금'),st=e.steps.slice(0,4);
  const body=t(320,24,'글자마다 구간을 그 글자의 확률만큼 좁힌다',{w:700})+st.map((s,i)=>{const y=44+i*52,lo=40+s.lo*480,w=Math.max((s.hi-s.lo)*480,3);return blink(box(40,y,480,26,'var(--line)','var(--chart)',4)+`<rect x="${lo}" y="${y}" width="${w}" height="26" fill="var(--accent)"/>`+t(30,y+18,show(s.ch),{a:'end',size:15,w:700})+t(610,y+18,`p = ${f(s.p,3)}`,{a:'end',size:12,fill:'var(--muted)'}),i*.7);}).join('')+t(320,268,`네 글자를 거치면 남은 구간 폭은 ${sci(st.reduce((a,s)=>a*s.p,1))}, 이를 가리키는 데 약 ${f(-Math.log2(st.reduce((a,s)=>a*s.p,1)),1)}비트가 든다`,{size:13});
  return {svg:svg('산술 부호에서 구간이 좁아지는 네 단계',body),caption:'줄마다 지금까지 좁힌 구간을 다시 펼쳐 그렸습니다. 색칠한 칸이 다음 글자가 차지하는 몫이고, 앞 글자 모델(윤슬 앞 50개, α = 1)의 확률입니다.'};},
 dictionary(){const r=M.lz78(M.corpus.first(4)),ph=r.phrases.slice(0,18);
  const body=t(320,24,'처음 보는 구절만 사전에 더하고, 본 구절은 번호로 가리킨다',{w:700})+ph.map((p,i)=>{const x=24+(i%6)*100,y=46+Math.floor(i/6)*74;return blink(box(x,y,92,56,p.index?'var(--orange)':'var(--line)')+t(x+46,y+24,M.chars(p.text).map(show).join(''),{size:16,w:700})+t(x+46,y+46,`${i+1}: (${p.index}, ${show(p.ch)||'끝'})`,{size:11,fill:'var(--muted)'}),i*.2);}).join('');
  return {svg:svg('LZ78이 첫 메시지들을 구절로 나눈 모습',body),caption:'윤슬의 첫 메시지 넷을 LZ78로 나눈 앞 18개 구절입니다. 주황 테두리는 앞에서 본 구절 번호를 다시 쓴 경우입니다. (번호, 새 글자) 한 쌍이 부호 하나입니다.'};},
 perplexity(){const {ppl}=data(),vals=ppl.flat(),names=['빈도·학습','빈도·시험','앞1·학습','앞1·시험','앞2·학습','앞2·시험'];
  const body=t(320,30,'학습 자료에서 짧아진 만큼 시험에서도 짧아질까',{w:700})+columns(vals,names,['var(--accent)','var(--orange)'],{x0:60,scale:24,w:62,gap:92});
  return {svg:svg('모델별 학습·시험 비트 수',body),caption:`α = 0.01일 때 앞 50개(학습)와 뒤 20개(시험)를 적는 비트 수입니다. 앞 2글자 모델은 학습 ${f(ppl[2][0])}비트지만 시험은 ${f(ppl[2][1])}비트입니다.`};},
 channel(){const c=M.hammingEncode([1,0,1,1]),y=c.map((v,i)=>i===4?v^1:v),r=M.hammingDecode(y),P=['p1','p2','d1','p4','d2','d3','d4'];
  const row=(bits,yy,mark,label,d)=>blink(t(70,yy+26,label,{a:'end',size:13,fill:'var(--muted)'})+bits.map((v,i)=>box(90+i*70,yy,58,40,i===0||i===1||i===3?'var(--blue)':'var(--line)',i===mark?'var(--orange)':'var(--panel2)',6)+t(119+i*70,yy+27,v,{size:18,w:700,fill:i===mark?'var(--bg)':'var(--text)'})).join(''),d);
  const body=P.map((p,i)=>t(119+i*70,30,`${i+1} ${p}`,{size:12,fill:'var(--muted)'})).join('')+row(c,44,-1,'보냄',0)+row(y,110,4,'받음',.8)+row(r.fixed,176,-1,'고침',1.6)+t(320,262,`증후 = ${r.syndrome} → 자리 ${r.syndrome}을 뒤집어 데이터 ${r.data.join('')}를 되찾는다`,{size:14,w:700});
  return {svg:svg('해밍(7,4) 부호가 한 자리 오류를 고치는 과정',body),caption:'파란 테두리 칸(자리 1·2·4)이 검사 비트입니다. 검사 셋의 성공·실패를 이진수로 읽으면 뒤집힌 자리 번호가 됩니다.'};},
 quantize(){const m=M.model(1,M.corpus.train(),0.1),te=M.corpus.test(),base=M.codeLength(m,te).perChar,bs=[2,3,4,5,6,8,10,12],v=bs.map(b=>M.codeLength(M.quantized(m,b),te).perChar),Y=x=>230-(x-5.3)*260,X=i=>80+i*70;
  const body=t(320,30,'표를 거칠게 적을수록 압축이 길어진다, 하지만 4비트까지는 거의 그대로',{w:700,size:14})+line(`M60 ${Y(base)}H600`,'var(--muted)')+t(64,Y(base)+18,`점선: 원래 표 ${f(base,3)}비트`,{a:'start',size:12,fill:'var(--muted)'})+`<path class="fig-draw" d="${v.map((x,i)=>`${i?'L':'M'}${X(i)} ${Y(x)}`).join('')}" fill="none" stroke="var(--accent)" stroke-width="3"/>`+v.map((x,i)=>`<circle cx="${X(i)}" cy="${Y(x)}" r="5" fill="var(--accent)"/>`+t(X(i),Y(x)-10,f(x,3),{size:11})+t(X(i),258,`${bs[i]}비트`,{size:12,fill:'var(--muted)'})).join('');
  return {svg:svg('한 칸의 비트 수에 따른 시험 자료 압축 길이',body),caption:'앞 글자 표(윤슬 앞 50개, α = 0.1)를 칸마다 b비트로 반올림했을 때 뒤 20개를 적는 비트/글자입니다.'};},
 final(){const tr=M.corpus.yunseul()+'\n'+M.corpus.doyoonA(),t2=M.corpus.doyoonB(),n=M.chars(t2).length,ms=[-1,0,1].map(o=>M.model(o,tr,0.01)),v=ms.map(m=>M.codeLength(m,t2).bits/n),cost=ms.map(m=>M.tableBits(m,8));
  const body=t(320,30,'메시지만 보내면 C, 모델까지 보내면 A',{w:700})+columns(v,['A 고정 길이','B 글자 빈도','C 앞 글자'],['var(--muted)','var(--blue)','var(--accent)'],{x0:110,scale:20,w:100})+cost.map((c,i)=>t(160+i*163,266,`표 ${c.toLocaleString('en-US')}비트`,{size:12,fill:'var(--orange)'})).join('');
  return {svg:svg('도윤 새 메시지를 세 모델로 적은 비트 수와 표 크기',body,280),caption:`도윤 뒤 15개(${n}글자)를 윤슬 70개와 도윤 앞 15개로 센 모델(α = 0.01)로 적은 길이입니다. 아래 주황 숫자는 그 모델의 표를 칸당 8비트로 함께 보낼 때 더해지는 비트입니다.`};}
};
function render(id){const r=draw[id]?draw[id]():null;if(r)r.caption+=' 그림의 숫자는 브라우저에서 실제로 계산한 값입니다.';return r;}
return {render};
})();
