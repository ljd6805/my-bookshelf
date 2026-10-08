/* 장마다 "먼저 개념 잡기"에 들어가는 핵심 그림. 숫자가 있는 그림은 RMath로 계산한다.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다. */
window.RFigures=(()=>{
'use strict';
const M=RMath,f=(n,d=2)=>n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const svg=(label,body,h=280)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay)=>`<g class="fig-seq" style="animation-delay:${delay}s">${body}</g>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const F={};
F.question=()=>{
 let b=box(20,30,170,70,'var(--blue)')+t(105,60,'질문',{w:700})+t(105,84,'늦게 돌려주면?',{size:13,fill:'var(--muted)'});
 b+=line('M190 65C240 65 240 40 290 40','var(--orange)')+box(290,14,150,52,'var(--orange)')+t(365,46,'기억만으로',{size:14});
 b+=line('M440 40H480','var(--orange)')+box(480,14,140,52,'var(--orange)','var(--chart)')+t(550,38,'연체료 100원?',{size:13,fill:'var(--orange)'})+t(550,57,'출처 없음',{size:12,fill:'var(--muted)'});
 b+=line('M190 65C240 65 240 150 290 150','var(--accent)')+box(290,110,150,80,'var(--accent)')+t(365,138,'검색',{w:700})+t(365,162,'문서 13개 중',{size:13,fill:'var(--muted)'})+t(365,180,'D2를 찾음',{size:13,fill:'var(--muted)'});
 for(let i=0;i<4;i++)b+=`<rect x="${300+i*34}" y="210" width="26" height="34" rx="3" fill="${i===1?'var(--accent)':'var(--panel2)'}" stroke="var(--line)"/>`;
 b+=dot(347,210,0,-40,'var(--accent)',0,5)+line('M440 150H480','var(--accent)')+box(480,110,140,80,'var(--accent)','var(--chart)')+t(550,140,'대출 정지,',{size:13,fill:'var(--accent)'})+t(550,160,'최대 30일',{size:13,fill:'var(--accent)'})+t(550,180,'[D2]',{size:12,fill:'var(--muted)'});
 b+=dot(442,150,36,0,'var(--accent)',.6);
 return {svg:svg('질문이 기억만 거치면 출처 없는 오답이 나오고, 검색으로 D2 문서를 찾아 넣으면 출처가 붙은 바른 답이 나오는 그림',b),caption:'같은 질문이 위쪽 길(기억만)에서는 흔한 오답이 되고, 아래쪽 길(검색 → 근거)에서는 문서 번호가 붙은 답이 됩니다.'};
};
F.keywords=()=>{
 const D=M.corpus(false),ix=M.index(D).postings,words=['책','반납','대출','연체'];let b=t(70,26,'낱말',{fill:'var(--muted)',size:13})+t(390,26,'그 낱말이 나오는 문서 (포스팅 목록)',{fill:'var(--muted)',size:13});
 words.forEach((w,i)=>{const y=44+i*56,ids=Object.keys(ix[w]||{});b+=box(20,y,100,40,'var(--blue)')+t(70,y+26,w,{w:700});
  ids.forEach((id,k)=>{b+=blink(box(150+k*62,y+4,54,32,'var(--accent)','var(--chart)',6)+t(177+k*62,y+25,id,{size:13}),i*.6+k*.15);});});
 return {svg:svg('낱말 책, 반납, 대출, 연체마다 그 낱말이 나오는 문서 번호가 차례로 켜지는 역색인 그림',b,270),caption:`실제 역색인의 일부입니다. “대출”은 ${Object.keys(ix['대출']).length}개 문서, “연체”는 ${Object.keys(ix['연체']||{}).length}개 문서에 그대로 나옵니다(“연체입니다”, “연체한” 같은 형태는 다른 낱말로 셉니다).`};
};
F.bm25=()=>{
 const pts=k1=>Array.from({length:31},(_,i)=>{const tf=i/5;return `${60+tf*80},${230-tf*(k1+1)/(tf+k1)*90}`;}).join(' ');
 let b='<path d="M60 20V230H560" stroke="var(--line)" fill="none"/>'+t(310,262,'같은 낱말이 문서에 나온 횟수 tf',{size:13,fill:'var(--muted)'})+t(64,16,'점수 기여(IDF 1 기준)',{a:'start',size:13,fill:'var(--muted)'});
 [[.5,'var(--blue)'],[1.2,'var(--accent)'],[3,'var(--orange)']].forEach(([k,c],i)=>{b+=`<polyline class="fig-draw" style="animation-delay:${i*.4}s" points="${pts(k)}" fill="none" stroke="${c}" stroke-width="3"/>`+t(565,230-6*(k+1)/(6+k)*90+4,'k1='+k,{a:'start',size:13,fill:c});});
 for(let i=1;i<=6;i++)b+=t(60+i*80,248,i,{size:12,fill:'var(--muted)'});
 return {svg:svg('같은 낱말이 늘어날 때 BM25 점수 기여가 k1에 따라 빨리 또는 천천히 포화하는 세 곡선',b,270),caption:'tf·(k1+1)/(tf+k1)을 실제로 계산한 곡선입니다(b=0). 횟수가 늘어도 기여는 k1+1을 넘지 않으며, k1이 작을수록 빨리 포화합니다.'};
};
F.chunking=()=>{
 let b='';for(let i=0;i<10;i++)b+=box(20+i*60,40,52,40,i===3||i===4?'var(--orange)':'var(--line)')+t(46+i*60,66,i+1,{size:14,w:700,fill:i===3||i===4?'var(--orange)':'var(--text)'});
 b+=t(20,28,'이용 규정 10문장 · 4·5번이 함께 있어야 답이 완성됨',{a:'start',size:13,fill:'var(--muted)'});
 M.chunk(M.RULES,3,1).forEach((c,i)=>{const x=20+(c.from-1)*60,w=(c.to-c.from+1)*60-8,y=104+i*30,ok=c.from<=4&&c.to>=5;
  b+=blink(`<rect x="${x}" y="${y}" width="${w}" height="22" rx="5" fill="${ok?'var(--accent)':'var(--blue)'}" opacity=".85"/>`+t(x+w/2,y+16,`R${i+1} · ${c.from}~${c.to}`,{size:12,fill:'var(--bg)',w:700}),i*.5);});
 return {svg:svg('10문장을 3문장씩 1문장 겹쳐 R1부터 R5까지 자르는 모습. R2가 4번과 5번 문장을 함께 담는다',b,264),caption:'크기 3, 겹침 1로 실제로 자른 조각입니다. 다음 장부터 쓰는 R1~R5이며, 초록 R2가 답에 필요한 4·5번 문장을 함께 담습니다.'};
};
F.embedding=()=>{
 const q=M.QUESTIONS[1].text,qv=M.embed(q),x=v=>70+v[1]*330,y=v=>230-v[0]*190;
 let b='<path d="M70 30V230H440" stroke="var(--line)" fill="none"/>'+t(255,262,'늦음·반납 축 →',{size:13,fill:'var(--muted)'})+t(74,22,'빌리기 축',{a:'start',size:13,fill:'var(--muted)'});
 ['D1','D2','D3','D6','D8','D9'].forEach((id,i)=>{const v=M.embed(M.DOCS.find(d=>d.id===id).text);b+=blink(`<circle cx="${x(v)}" cy="${y(v)}" r="7" fill="${id==='D2'?'var(--accent)':'var(--muted)'}"/>`+t(x(v)+12,y(v)+5,id,{a:'start',size:13}),i*.2);});
 b+=`<path class="fig-draw" d="M70 230L${x(qv)} ${y(qv)}" stroke="var(--orange)" stroke-width="3"/>`+t(x(qv)-6,y(qv)-12,'질문',{size:13,fill:'var(--orange)'});
 const sims=M.semantic(q,M.corpus(false)).slice(0,3);
 b+=box(470,60,150,140,'var(--line)','var(--chart)')+t(545,88,'cos 상위',{size:13,fill:'var(--muted)'})+sims.map((s,i)=>t(545,118+i*28,`${s.id}  ${f(s.score)}`,{size:15})).join('');
 return {svg:svg('질문 “책을 늦게 돌려주면 어떻게 되나요?”의 벡터가 늦음·반납 축 쪽을 가리키고 D2 문서가 그 방향 가까이 놓인 그림',b,270),caption:'“책을 늦게 돌려주면 어떻게 되나요?”의 실제 임베딩을 두 축에 그렸습니다. 흔한 낱말 “책” 말고는 겹치는 낱말이 없어도 D2 연체 문서가 질문과 같은 방향에 놓입니다.'};
};
F.hybrid=()=>{
 const rows=M.hybrid(M.QUESTIONS[1].text,M.corpus(true),.5).slice(0,4);
 let b=t(20,24,'“늦게 돌려주면” · α=0.5',{a:'start',size:13,fill:'var(--muted)'});
 rows.forEach((r,i)=>{const y=44+i*52,k=.5*r.keyword*360,m=.5*r.meaning*360;b+=t(20,y+22,r.id,{a:'start',w:700})+grow(80,y,k,30,'var(--blue)',i*.2)+grow(80+k,y,m,30,'var(--accent)',.4+i*.2)+t(80+k+m+10,y+21,f(r.score),{a:'start',size:14});});
 b+=`<rect x="80" y="258" width="14" height="10" fill="var(--blue)"/>`+t(100,267,'키워드 몫 α·BM25/최고',{a:'start',size:12,fill:'var(--muted)'})+`<rect x="300" y="258" width="14" height="10" fill="var(--accent)"/>`+t(320,267,'의미 몫 (1−α)·cos',{a:'start',size:12,fill:'var(--muted)'});
 return {svg:svg('혼합 점수 막대가 키워드 몫과 의미 몫으로 나뉘어 자라고, D2가 의미 몫을 더해 1위가 되는 그림',b,276),caption:`실제 계산입니다. D2는 흔한 낱말 “책”만 겹쳐 키워드 몫은 ${f(.5*rows[0].keyword)}에 그치지만, 의미 몫 ${f(.5*rows[0].meaning)}이 더해져 ${f(rows[0].score)}점으로 1위입니다. ${rows[1].id}는 “책” 일치로 키워드 몫(${f(.5*rows[1].keyword)})이 더 크지만 의미 몫이 작아 ${f(rows[1].score)}점입니다.`};
};
F.evaluation=()=>{
 const q=M.QUESTIONS[4],r=M.hybrid(q.text,M.corpus(true)).slice(0,5);
 let b=t(20,24,'“책을 잃어버리면” · 혼합 검색 순위',{a:'start',size:13,fill:'var(--muted)'});
 r.forEach((x,i)=>{const ok=q.rel.includes(x.id),y=40+i*42;b+=box(20,y,300,34,ok?'var(--accent)':'var(--line)')+t(36,y+23,`${i+1}위  ${x.id} ${x.doc.title}`,{a:'start',size:14})+(ok?t(300,y+23,'✓',{fill:'var(--accent)',w:700}):'');});
 [1,3,5].forEach((k,i)=>{const h=k*42-8;b+=blink(`<path d="M332 40h10v${h}h-10" fill="none" stroke="var(--orange)" stroke-width="3"/>`+t(352,40+h/2+5,`k=${k}`,{a:'start',size:14,fill:'var(--orange)'})+t(420,40+h/2-8,`P@${k} = ${f(M.evaluate(r,q.rel,k).precision)}`,{a:'start',size:14})+t(420,40+h/2+14,`R@${k} = ${f(M.evaluate(r,q.rel,k).recall)}`,{a:'start',size:14}),i*1.4);});
 b+=t(420,262,`RR = 1/4 = ${f(M.evaluate(r,q.rel,5).rr)}`,{a:'start',size:14,fill:'var(--muted)'});
 return {svg:svg('정답 R3가 4위에 있는 순위 목록에서 k를 1, 3, 5로 넓히며 정밀도와 재현율을 재는 그림',b,276),caption:'실제 순위입니다. k=1·3에서는 정답 R3가 빠져 재현율이 0이고, k=5에서 들어와 재현율 1, 정밀도 0.2가 됩니다. 첫 정답이 4위라 RR은 0.25입니다.'};
};
F.rerank=()=>{
 const q=M.QUESTIONS[4],r=M.rerank(q.text,M.corpus(true),5);
 let b=t(90,24,'1차 혼합 검색',{size:13,fill:'var(--muted)'})+t(520,24,'재순위 (N=5)',{size:13,fill:'var(--muted)'});
 r.first.slice(0,5).forEach((x,i)=>{const ok=q.rel.includes(x.id),y=36+i*44;b+=box(20,y,140,34,ok?'var(--accent)':'var(--line)')+t(90,y+23,`${i+1}. ${x.id}`,{size:14});
  const j=r.second.findIndex(s=>s.id===x.id),y2=36+j*44;b+=line(`M160 ${y+17}C300 ${y+17} 300 ${y2+17} 450 ${y2+17}`,ok?'var(--accent)':'var(--line)')+(ok?dot(160,y+17,290,y2-y,'var(--accent)',0,6):'');});
 r.second.forEach((x,i)=>{const ok=q.rel.includes(x.id),y=36+i*44;b+=box(450,y,140,34,ok?'var(--accent)':'var(--line)')+t(520,y+23,`${i+1}. ${x.id} ${f(x.score)}`,{size:14});});
 return {svg:svg('1차 검색에서 4위였던 정답 R3가 재순위 후 1위로 올라가는 그림',b,264),caption:`“책을 잃어버리면”의 실제 계산입니다. 1차 검색 4위였던 R3가 “잃어버리거나 훼손하면 … 변상합니다” 문장 덕분에 재순위 점수 ${f(r.second[0].score)}로 1위가 됩니다.`};
};
F.context=()=>{
 const r=M.packContext(M.QUESTIONS[1].text,200),q=M.QUESTIONS[1];let x=20,b=t(20,30,'토큰 예산 200 · “늦게 돌려주면”',{a:'start',size:13,fill:'var(--muted)'});
 const parts=[['지시문·질문',r.used-r.chosen.reduce((s,c)=>s+c.tokens,0),'var(--muted)'],...r.chosen.map(c=>[c.id,c.tokens,q.rel.includes(c.id)?'var(--accent)':'var(--blue)'])];
 parts.forEach(([n,tk,c],i)=>{const w=tk*3;b+=grow(x,46,w-3,46,c,i*.35)+t(x+w/2,74,n,{size:12,fill:'var(--bg)',w:700});x+=w;});
 b+=`<rect x="20" y="44" width="600" height="50" rx="4" fill="none" stroke="var(--line)" stroke-dasharray="4 4"/>`;
 b+=t(20,130,`사용 ${r.used}토큰 → KV 캐시 ${f(r.kvBytes/2**20,1)} MiB (토큰당 128 KiB)`,{a:'start',size:15})+t(20,160,'초록은 정답 조각, 파랑은 관련 없는 조각입니다.',{a:'start',size:13,fill:'var(--muted)'});
 [1,10,100].forEach((u,i)=>{const mb=r.kvBytes*u/2**20,w=Math.min(560,Math.log10(mb+1)*150);b+=t(20,198+i*26,`${u}명`,{a:'start',size:13})+grow(80,186+i*26,w,16,'var(--orange)',1.4+i*.3)+t(90+w,199+i*26,`${f(mb,1)} MiB`,{a:'start',size:12,fill:'var(--muted)'});});
 return {svg:svg('예산 200토큰 안에 지시문과 근거 조각이 차례로 채워지고, 사용자 수에 따라 KV 캐시가 커지는 그림',b,270),caption:'실제 계산입니다. 위 막대는 순위대로 채운 입력이고, 아래 막대는 동시 이용자 수에 따른 KV 캐시입니다(로그 눈금).'};
};
F.final=()=>{
 const d=M.decide(.4),col={correct:'var(--accent)',wrong:'var(--orange)',missed:'var(--blue)',abstain:'var(--muted)'};
 let b='<path d="M40 30V230H620" stroke="var(--line)" fill="none"/>'+t(44,22,'1위 혼합 점수',{a:'start',size:13,fill:'var(--muted)'});
 d.rows.forEach((r,i)=>{const h=r.top.score*190,x=52+i*44;b+=grow(x,230-h,30,h,col[r.outcome],i*.1).replace('fig-grow','fig-grow fig-up')+t(x+15,248,r.q.id.toUpperCase(),{size:11,fill:'var(--muted)'});});
 b+=`<path class="fig-seq" d="M40 ${230-.4*190}H620" stroke="var(--text)" stroke-width="2" stroke-dasharray="6 4"/>`+t(616,230-.4*190-8,'문턱 0.4',{a:'end',size:13});
 return {svg:svg('질문 13개의 1위 점수 막대와 문턱 0.4 선. 답이 없는 U2 노트북 질문의 막대가 문턱보다 훨씬 높다',b,264),caption:'실제 계산입니다. Q는 답할 수 있는 질문, U는 답이 없는 질문입니다. 초록은 맞게 답함, 주황은 틀리게 답함, 회색은 바르게 보류입니다. U2(노트북)는 점수가 0.96이라, 문턱으로 막으면 답할 수 있는 질문 대부분도 함께 막힙니다.'};
};
function render(id){return F[id]?F[id]():null;}
return {render};
})();
