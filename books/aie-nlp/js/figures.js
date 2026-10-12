/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A06Math로 계산한다. */
window.A06Figures=(()=>{
'use strict';
const M=A06Math;
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
/* 네 장면 중 i번째만 보이게 한다. 동작 줄이기에서는 첫 장면만 남는다. */
const turn=(body,i)=>blink(body,i*1.2,i?'fig-turn':'fig-turn fig-first');
/* 장면 2~4개를 4.8초 주기의 네 칸에 고르게 나눠 빈 칸 없이 돌린다. */
const cycle=list=>[0,1,2,3].map(k=>turn(list[Math.floor(k*list.length/4)],k)).join('');
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const chip=(x,y,s,c,size=15)=>{const w=Math.max(34,Array.from(s).length*size+16);return {w,svg:box(x,y,w,32,c,'var(--panel2)',5)+t(x+w/2,y+21,s,{size})};};
const chipRow=(x,y,list,c,size=15)=>{let b='',cx=x;for(const s of list){const k=chip(cx,y,s,c,size);b+=k.svg;cx+=k.w+8;}return b;};
const H={svg,t,box,line,dot,blink,turn,cycle,grow,pulse,chipRow};
const F={};
const C=['var(--accent)','var(--blue)','var(--orange)','var(--muted)'];

F.clean=()=>{
 const s=M.INBOX[4],modes=[['space','어절 그대로'],['josa','끝 조사 떼기'],['char2','글자 두 개씩']];
 let b=t(30,36,`5번 문의: “${s}”`,{a:'start',w:700});
 b+=cycle(modes.map(([m,name],i)=>{const tok=M.tokenize(s,m),V=M.vocab(M.INBOX,m).length;return t(30,92,name,{a:'start',w:700,fill:C[i]})+chipRow(30,110,tok.slice(0,9),C[i],m==='char2'?14:15)+t(30,186,`토큰 ${tok.length}개 · 문의함 어휘 ${V}개`,{a:'start',size:15})+t(30,214,m==='space'?'“환불”과 “환불이”가 다른 토큰입니다':m==='josa'?'두 “환불”이 같은 토큰이 됩니다':'철자 조각이 늘어 어휘가 커집니다',{a:'start',size:14,fill:'var(--muted)'});}));
 const W=M.BPE_WORDS,r=M.learnBpe(W,8);
 b+=box(30,236,580,50,'var(--line)','var(--chart)',8)+t(46,267,`BPE 8번 병합: 글자 ${r.chars} → 토큰 ${r.tokens}개, 새 낱말 “배송료” → ${M.applyBpe('배송료',r.merges).join(' · ')}`,{a:'start',size:14})+pulse(596,261,8,'var(--accent)');
 return {svg:svg('같은 문의를 어절, 조사 떼기, 글자 두 개 단위로 차례로 잘라 보이고 아래에 BPE 병합 결과를 적은 그림',b),caption:'세 줄이 차례로 바뀌며 같은 문장이 단위에 따라 다른 토큰이 되는 모습을 보여 줍니다. 토큰 수와 어휘 크기, BPE 결과는 문의함으로 한 실제 계산입니다.'};
};
F.tfidf=()=>{
 const rows=M.tfidfDoc(M.INBOX,4),df=rows.find(x=>x.word==='환불').df;let b=t(30,34,`“환불”이 든 문의 ${df}통 / 8통`,{a:'start',w:700});
 M.INBOX.forEach((d,i)=>{const has=M.tokenize(d,'josa').includes('환불'),x=30+(i%4)*70,y=52+Math.floor(i/4)*62;b+=(has?blink(box(x,y,58,50,'var(--accent)'),i*.3):box(x,y,58,50,'var(--line)','var(--chart)'))+t(x+29,y+31,`${i+1}번`,{size:14,fill:has?'var(--accent)':'var(--muted)'});});
 b+=t(30,206,'IDF = ln(9 / (df+1)) + 1',{a:'start',size:15})+t(30,234,`df=${df} → ${M.idf(df,8).toFixed(2)},  df=8 → ${M.idf(8,8).toFixed(2)}`,{a:'start',size:15,fill:'var(--muted)'});
 b+=t(330,34,'5번 문의의 TF-IDF',{a:'start',w:700});
 const mx=Math.max(...rows.map(x=>x.w));rows.forEach((r,i)=>{const y=54+i*44;b+=t(330,y+22,r.word,{a:'start',size:14})+grow(430,y+6,r.w/mx*140,22,i?'var(--blue)':'var(--accent)',i*.25)+t(600,y+22,r.w.toFixed(2),{a:'end',size:14});});
 return {svg:svg('여덟 문의 중 환불이 든 문의가 깜박이고, 오른쪽에 5번 문의 낱말들의 TF-IDF 막대가 자라는 그림',b),caption:'왼쪽은 “환불”이 든 문의(문서 빈도)를, 오른쪽은 5번 문의 안에서 낱말마다 받은 가중치를 보여 줍니다. 모든 숫자는 문의함으로 한 실제 계산입니다.'};
};
F.vectors=()=>{
 const X=v=>110+v[0]*190,Y=v=>258-v[1]*120,words=['소설','소설가','시','시인','만화','만화가'];let b=t(30,30,'축: 사람(가로) · 이야기(세로)',{a:'start',size:14,fill:'var(--muted)'});
 b+=`<path d="M90 258H560M110 270V40" stroke="var(--line)" stroke-width="1.5"/>`;
 [['소설','소설가'],['시','시인'],['만화','만화가']].forEach(([a,c],i)=>{const A=M.VEC[a],B=M.VEC[c];b+=line(`M${X(A)} ${Y(A)}L${X(B)} ${Y(B)}`,C[i])+dot(X(A),Y(A),X(B)-X(A),Y(B)-Y(A),C[i],i*.6,5);});
 words.forEach(w=>{const v=M.VEC[w];b+=`<circle cx="${X(v)}" cy="${Y(v)}" r="6" fill="var(--text)"/>`+t(X(v)+(v[0]?12:-12),Y(v)-10,w,{a:v[0]?'start':'end',size:15,w:700});});
 const r=M.analogy('소설','소설가','시','cos');
 b+=box(430,60,190,96,'var(--line)','var(--chart)',10)+t(525,88,'소설가 − 소설 + 시',{size:14})+t(525,124,`→ ${r.list[0].word}`,{size:22,w:700,fill:'var(--accent)'})+t(525,146,`코사인 ${r.list[0].score.toFixed(3)}`,{size:13,fill:'var(--muted)'});
 return {svg:svg('소설에서 소설가, 시에서 시인, 만화에서 만화가로 가는 화살표가 거의 평행하고, 유추 결과가 시인으로 나오는 그림',b),caption:'“작품에서 그 작품을 쓰는 사람으로”라는 관계가 같은 방향의 이동으로 나타납니다. 벡터는 교육용 가정값이고, 유추 결과는 그 값으로 한 실제 계산입니다.'};
};
F.topics=()=>{
 const cases=[[2,1,0,0,0,0,0,0,0],[2,1,0,2,0,0,0,0,0],[0,0,0,1,0,0,1,1,1]],labels=['배송 배송 늦어요','배송 배송 늦어요 환불 환불','환불 신간 작가 언제'];
 let b=t(30,34,'한 문의 = 여러 주제의 섞임',{a:'start',w:700});
 b+=cycle(cases.map((c,i)=>{const th=M.topicMix(c,1);return box(30,60,580,46,C[i],'var(--chart)',8)+t(46,90,`문의: ${labels[i]}`,{a:'start',size:15})+M.TOPICS.names.map((n,k)=>{const y=130+k*50;return t(30,y+22,n,{a:'start',size:15})+box(150,y,380,30,'var(--line)','var(--panel2)',4)+grow(150,y,th[k]*380,30,C[k],k*.2)+t(600,y+22,th[k].toFixed(2),{a:'end',size:15,w:700});}).join('');}));
 return {svg:svg('문의 세 개가 차례로 바뀌며 배송, 환불·교환, 신간·작가 세 주제의 비율 막대가 달라지는 그림',b),caption:'같은 주제 분포를 두고 문의의 낱말만 바꾸면 주제 비율 θ가 옮겨 갑니다. 주제별 낱말 분포는 교육용 가정값이고, 비율은 EM으로 한 실제 계산(α = 1)입니다.'};
};
F.sentiment=()=>{
 const s='내용이 안 좋아요';let b=t(30,34,`시험 문장: “${s}” (사람의 답: 부정)`,{a:'start',w:700});
 b+=cycle([false,true].map((on,i)=>{const r=M.nbClassify(s,on,1);return t(30,74,on?'부정 범위 처리: NOT_ 붙이기':'부정 범위 처리 없음',{a:'start',w:700,fill:C[i]})+r.parts.map((p,k)=>{const y=96+k*48,w=Math.min(200,Math.abs(p.llr)*70);return t(150,y+22,p.w,{a:'end',size:15})+`<path d="M330 ${y-4}V${y+34}" stroke="var(--line)"/>`+grow(p.llr>=0?330:330-w,y,w,28,p.llr>=0?'var(--accent)':'var(--orange)',k*.2)+t(p.llr>=0?340+w:320-w,y+20,(p.llr>=0?'+':'')+p.llr.toFixed(2),{a:p.llr>=0?'start':'end',size:14});}).join('')+t(30,270,`합계 ${r.score.toFixed(2)} → ${r.label?'긍정 (틀림)':'부정 (맞음)'}`,{a:'start',size:17,w:700,fill:r.label?'var(--orange)':'var(--accent)'});}));
 b+=t(610,270,'← 부정 증거 · 긍정 증거 →',{a:'end',size:13,fill:'var(--muted)'});
 return {svg:svg('같은 문장을 부정 범위 처리 없이, 그리고 NOT_ 표시를 붙여 분류할 때 낱말별 증거 막대와 판정이 바뀌는 그림',b),caption:'처리 없이는 “좋아요”가 긍정 증거로 남아 판정이 틀리고, NOT_를 붙이면 부정 증거로 바뀝니다. 학습 리뷰 12개로 한 실제 나이브 베이즈 계산입니다.'};
};
F.tagging=()=>{
 const w='can I book the book'.split(' '),r=M.viterbi(w,0.1),T=M.HMM.tags,ko=['대명사','조동사','동사','관사','명사'],X=i=>170+i*100,Y=k=>62+k*44;
 let b=w.map((x,i)=>t(X(i),36,x,{w:700,size:16})).join('')+T.map((g,k)=>t(30,Y(k)+5,ko[k],{a:'start',size:14,fill:'var(--muted)'})).join('');
 w.forEach((_,i)=>T.forEach((_,k)=>{b+=`<circle cx="${X(i)}" cy="${Y(k)}" r="7" fill="var(--panel2)" stroke="var(--line)"/>`;}));
 const path=r.tags.map(g=>T.indexOf(g));b+=line(path.map((k,i)=>`${i?'L':'M'}${X(i)} ${Y(k)}`).join(''),'var(--accent)');
 path.forEach((k,i)=>{b+=blink(`<circle cx="${X(i)}" cy="${Y(k)}" r="10" fill="var(--accent)"/>`,i*.5);});
 b+=pulse(X(2),Y(2),16,'var(--orange)')+t(X(2),Y(4)+30,'같은 book, 다른 품사',{size:14,fill:'var(--orange)'});
 b+=t(30,294,`비터비가 고른 줄: ${r.tags.map(g=>ko[T.indexOf(g)]).join(' · ')}`,{a:'start',size:14});
 return {svg:svg('다섯 낱말과 다섯 품사의 격자 위에서 비터비가 조동사, 대명사, 동사, 관사, 명사 줄을 고르는 그림',b),caption:'첫 book은 “조동사 다음 대명사 다음”이라는 줄의 흐름 덕분에 동사로, 둘째 book은 관사 뒤라 명사로 고릅니다. 확률표는 교육용 가정값이고, 경로는 비터비로 한 실제 계산입니다.'};
};
F.sequence=()=>{
 const m=M.bigramModel(M.INBOX),a=M.perplexity(m,'환불은 언제 되나요',0),z=M.perplexity(m,'배송비 환불 되나요',0),z2=M.perplexity(m,'배송비 환불 되나요',0.05);
 const row=(r,y,c)=>{let b='';const words=[r.steps[0].from,...r.steps.map(s=>s.to)];words.forEach((w,i)=>{b+=box(20+i*122,y,96,34,c,'var(--panel2)',6)+t(68+i*122,y+23,w.replace(/</g,'&lt;').replace(/>/g,'&gt;'),{size:14});if(i<r.steps.length){const p=r.steps[i].p;b+=t(128+i*122,y-8,p.toFixed(2),{size:13,fill:p?'var(--muted)':'var(--orange)',w:p?400:700});}});return b;};
 let b=t(20,30,'바이그램: 앞 낱말만 보고 다음 낱말의 확률을 셉니다',{a:'start',w:700});
 b+=row(a,60,'var(--accent)')+dot(116,77,366,0,'var(--accent)',0,5)+t(20,124,`퍼플렉서티 ${a.pp.toFixed(2)} (학습에서 본 문장)`,{a:'start',size:14});
 b+=row(z,170,'var(--orange)')+pulse(250,187,22,'var(--orange)')+t(20,234,'처음 보는 쌍이 확률 0을 받아 퍼플렉서티가 무한대가 됩니다',{a:'start',size:14,fill:'var(--orange)'});
 b+=t(20,270,`k = 0.05로 평활하면 ${z2.pp.toFixed(1)}로 유한해집니다`,{a:'start',size:14,fill:'var(--muted)'});
 return {svg:svg('본 문장은 바이그램 확률이 모두 양수여서 퍼플렉서티가 작고, 처음 보는 쌍이 든 문장은 확률 0을 받아 퍼플렉서티가 무한대가 되는 그림',b),caption:'위 줄은 학습 자료에 있던 문장, 아래 줄은 “배송비→환불”이라는 처음 보는 쌍이 든 문장입니다. 확률과 퍼플렉서티는 문의함 여덟 통으로 센 실제 계산입니다.'};
};
F.seq2seq=()=>{
 const src=M.ALIGN.src,tg=['When','exchange','damaged','book'],X=i=>80+i*120;let b=t(20,30,'디코더가 영어 단어를 쓸 때마다 원문의 다른 어절을 봅니다 (β = 3)',{a:'start',size:14,w:700});
 src.forEach((s,i)=>{b+=box(X(i)-48,226,96,36,'var(--blue)','var(--panel2)',6)+t(X(i),250,s,{size:15});});
 b+=cycle(tg.map((w,j)=>{const r=M.attend(w,3);let g=box(250,58,140,36,'var(--accent)','var(--panel2)',6)+t(320,82,w,{w:700,size:16});r.weights.forEach((p,i)=>{g+=`<path d="M320 94L${X(i)} 226" stroke="var(--accent)" stroke-width="${(0.5+p*12).toFixed(1)}" opacity="${(0.2+p*0.8).toFixed(2)}"/>`+t(X(i),214,p.toFixed(2),{size:13,fill:i===r.best?'var(--accent)':'var(--muted)',w:i===r.best?700:400});});return g;}));
 b+=t(20,290,'선 굵기 = 어텐션 가중치',{a:'start',size:13,fill:'var(--muted)'});
 return {svg:svg('디코더가 When, exchange, damaged, book을 차례로 쓸 때 원문 파본 책 교환은 언제 되나요 중 가장 굵은 선이 언제, 교환은, 파본, 책으로 옮겨 가는 그림',b),caption:'단계마다 질의가 바뀌어 원문에서 보는 곳이 옮겨 갑니다. 벡터는 교육용 가정값이고, 가중치는 소프트맥스로 한 실제 계산입니다.'};
};
F.answer=()=>{
 const rows=[[150,'fixed','고정 150토큰'],[150,'sentence','문장 경계 150토큰']],X=v=>40+v/555*560;let b=t(20,30,'약관 12문장 · 주황 구간이 답(7~8번째 문장)',{a:'start',w:700});
 const r0=M.chunkDoc(150,'fixed');b+=`<rect class="fig-pulse" x="${X(r0.answer[0])}" y="48" width="${X(r0.answer[1])-X(r0.answer[0])}" height="20" fill="var(--orange)" opacity=".8"/>`;
 r0.starts.forEach(s=>{b+=`<path d="M${X(s)} 46V70" stroke="var(--muted)"/>`;});
 rows.forEach(([n,st,name],j)=>{const r=M.chunkDoc(n,st),y=104+j*86;b+=t(40,y-8,`${name}: ${r.whole?'답이 한 조각에 온전히':'답이 '+r.touched+'조각으로 갈라짐'}`,{a:'start',size:14,fill:r.whole?'var(--accent)':'var(--orange)',w:700});r.chunks.forEach(([s,e],i)=>{const hit=e>r.answer[0]&&s<r.answer[1];b+=blink(box(X(s)+2,y,X(e)-X(s)-4,36,hit?(r.whole?'var(--accent)':'var(--orange)'):'var(--line)',hit?'var(--panel2)':'var(--chart)',5),i*.3+j*.15)+t((X(s)+X(e))/2,y+24,String(i+1),{size:14});});});
 b+=t(20,290,'답을 담은 조각을 찾은 뒤 요약하거나 근거 구간을 뽑아 답합니다',{a:'start',size:13,fill:'var(--muted)'});
 return {svg:svg('같은 150토큰이라도 고정 길이로 자르면 답이 두 조각으로 갈라지고, 문장 경계에서 자르면 한 조각에 온전히 들어가는 그림',b),caption:'조각 경계가 답을 가르면 검색이 반쪽만 가져옵니다. 문장 길이는 교육용 값이고, 경계 판정은 실제 계산입니다.'};
};
F.links=()=>{
 const ctx=['한강 신간 소설 언제 나오나요','한강 다리 사진집 있나요'];let b='';
 b+=cycle(ctx.map((c,j)=>{const r=M.linkEntity(c,0.3);let g=box(20,40,600,40,'var(--line)','var(--chart)',8)+t(36,66,`문의: “${c}” → 연결: ${r.pick}`,{a:'start',size:15,w:700});
  r.list.forEach((e,i)=>{const x=40+i*200,on=e.id===r.pick;g+=`<path d="M320 120L${x+80} 190" stroke="${on?'var(--accent)':'var(--line)'}" stroke-width="${on?4:2}"/>`+box(x,190,160,54,on?'var(--accent)':'var(--line)','var(--panel2)',8)+t(x+80,214,e.id,{size:15,w:on?700:400})+t(x+80,236,`점수 ${e.score.toFixed(2)}`,{size:13,fill:'var(--muted)'});});
  return g;}));
 b+=box(270,98,100,32,'var(--orange)','var(--panel2)',16)+t(320,120,'한강',{w:700})+pulse(320,114,24,'var(--orange)');
 b+=t(20,280,'점수 = 0.3 × 사전 확률 + 0.7 × 문맥 겹침',{a:'start',size:14,fill:'var(--muted)'});
 return {svg:svg('같은 이름 한강이 신간 문의에서는 작가 한강으로, 다리 사진집 문의에서는 강 한강으로 연결되는 그림',b),caption:'언급은 같아도 문맥 낱말이 후보 설명과 겹치는 정도에 따라 연결 대상이 바뀝니다. 사전 확률과 설명 낱말은 교육용 가정값이고, 점수는 실제 계산입니다.'};
};
F.dialog=()=>{
 const r=M.dstStates('full');let b=t(20,30,'대화 상태: 턴마다 슬롯을 고치고 지웁니다',{a:'start',w:700});
 b+=cycle([0,2,4].map((i,j)=>{const st=r.gold[i];let g=box(20,52,600,40,'var(--blue)','var(--chart)',8)+t(36,78,`${i+1}턴 손님: “${M.DIALOG[i].say}”`,{a:'start',size:14});
  Object.entries(st).forEach(([k,v],n)=>{const y=110+n*40;g+=box(40,y,130,32,'var(--line)','var(--panel2)',5)+t(105,y+21,k,{size:14})+box(180,y,190,32,'var(--accent)','var(--panel2)',5)+t(275,y+21,v,{size:14,w:700});});
  return g;}));
 b+=line('M390 170H430','var(--muted)')+dot(392,170,36,0,'var(--accent)',0,5);
 b+=box(440,110,180,130,'var(--accent)','var(--chart)',10)+t(530,138,'백엔드로 보낼 값',{size:14,fill:'var(--muted)'})+t(530,172,'형식이 보장된',{size:15})+t(530,198,'JSON',{size:22,w:700,fill:'var(--accent)'})+t(530,226,'제약 디코딩',{size:13,fill:'var(--muted)'});
 return {svg:svg('1턴에 배송지 부산, 3턴에 대구로 고침, 5턴에 날짜를 지운 대화 상태가 차례로 보이고 그 상태가 JSON으로 백엔드에 넘어가는 그림',b),caption:'다섯 턴 대화 가운데 1, 3, 5턴의 상태를 보여 줍니다. 대화는 시나리오이고, 상태 갱신은 규칙대로 한 실제 계산입니다.'};
};
F.final=()=>{
 const L=M.LENGTHS,d=[0,0.25,0.5,0.75,1],X=i=>140+i*78,Y=k=>56+k*38;let b=t(20,30,'두 사실을 이어 추론하는 과제 · 길이와 깊이별 정답률',{a:'start',size:14,w:700});
 d.forEach((v,k)=>{b+=t(120,Y(k)+24,`깊이 ${v*100}%`,{a:'end',size:13,fill:'var(--muted)'});});
 L.forEach((n,i)=>{b+=t(X(i)+36,270,`${n}k`,{size:14});const g=M.needleGrid(n,'multi');g.acc.forEach((a,k)=>{const ok=a>=0.9;b+=blink(box(X(i),Y(k),72,32,ok?'var(--accent)':'var(--orange)',ok?'var(--panel2)':'var(--chart)',4)+t(X(i)+36,Y(k)+22,Math.round(a*100),{size:14,w:ok?700:400,fill:ok?'var(--accent)':'var(--orange)'}),i*.35);});});
 const e=M.effectiveLength('multi');b+=pulse(X(L.indexOf(e))+36,Y(2)+16,30,'var(--accent)')+t(620,292,`유효 길이 ${e}k (모든 깊이 90% 이상)`,{a:'end',size:13,fill:'var(--accent)'});
 return {svg:svg(`두 사실을 이어 추론하는 과제의 정답률이 길이가 늘수록, 특히 가운데 깊이에서 먼저 떨어져 유효 길이가 ${e}k에 머무는 격자 그림`,b),caption:'광고된 길이와 실제로 믿을 수 있는 길이는 다릅니다. 원본이 설명한 경향을 흉내 낸 교육용 모형이며 실제 모델을 측정한 값이 아닙니다.'};
};
function fallback(c){
 const steps=c.flow.map(x=>x.split('|')),n=steps.length,w=(600-(n-1)*20)/n;
 let b='';steps.forEach(([a],i)=>{const x=20+i*(w+20);b+=blink(box(x,90,w,110,C[i%4]),i*.6)+t(x+w/2,150,a,{w:700});});
 return {svg:svg(`${c.title}의 흐름`,b),caption:`${c.subtitle}`};
}
function render(c){return F[c.id]?F[c.id](H):fallback(c);}
return {render,F,H};
})();
