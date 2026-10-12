/* 10~11장 실험: 역색인, 근사 최근접 이웃, 마지막 과제 설계. 계산은 ALMath에 있고 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=ALUI,M=ALMath,int=U.int,big=U.big,esc=U.esc;
const cache={};
function shelf(n){if(!cache[n]){const titles=M.makeTitles(n);cache[n]={titles,post:M.buildIndex(titles)};}return cache[n];}
const W=w=>M.WORDS.indexOf(w);
const QUERIES=[['등대','등대 (드문 낱말)'],['고양이','고양이 (가장 흔한 낱말)'],['해','해 (드문 낱말)'],['고양이 바다','고양이 + 바다'],['등대 탐정','등대 + 탐정']];
ALLabs.invert=el=>{
 U.setup(el,U.select('iv-n','서가의 제목 수',[[1000,'1천 권'],[10000,'1만 권'],[100000,'10만 권']],10000)+U.select('iv-q','찾는 낱말 (모두 들어간 제목)',QUERIES,'등대'));
 U.bind(el,()=>{
  const n=U.value(el,'iv-n'),words=el.querySelector('#iv-q').value.split(' ').map(W),{titles,post}=shelf(n),s=M.scanSearch(titles,words),x=M.indexSearch(post,words);
  const lens=words.map(w=>`‘${M.WORDS[w]}’ 목록 ${int(post[w].length)}권`).join(', ');
  const chart=U.bars(['모든 제목 훑기','역색인 목록 맞물리기','찾은 제목 수'],[s.checks,x.steps,s.hits.length],'단계',{log:true,colors:['var(--orange)','var(--accent)','var(--muted)']});
  U.result(el,chart,`제목 <b>${int(n)}</b>권 · 찾은 제목 <strong>${int(s.hits.length)}</strong>권 (두 방법의 답이 ${s.hits.length===x.hits.length?'같음':'<b>다름</b>'})<br>훑기 <b>${int(s.checks)}</b>단계 · 역색인 <b>${int(x.steps)}</b>단계 → <strong>${U.fmt(s.checks/Math.max(x.steps,1),1)}배</strong> 적음 · ${lens}<br>역색인의 일은 서가 크기가 아니라 <b>낱말 목록의 길이</b>에 비례합니다. 흔한 낱말일수록 목록이 길어 이득이 줄어듭니다. 제목은 고정 시드로 만든 합성 자료(낱말 40개, 제목마다 셋)이고 단계는 실제로 센 값입니다.`);
 });
};
const PTS=M.makePoints(2000);
ALLabs.ann=el=>{
 U.setup(el,U.range('an-cells','격자 한 변의 칸 수',1,32,1,8)+U.select('an-rad','살펴볼 칸',[[0,'질문이 든 칸만'],[1,'질문 칸과 둘레 8칸']],0)+U.range('an-x','질문 위치 가로',0,100,1,52)+U.range('an-y','질문 위치 세로',0,100,1,48));
 U.bind(el,()=>{
  const c=U.value(el,'an-cells'),rad=U.value(el,'an-rad'),q=[U.value(el,'an-x')/100,U.value(el,'an-y')/100],e=M.exactNN(PTS,q),g=M.gridNN(PTS,q,c,rad),bm=M.annBenchmark(PTS,c,rad);
  const S=v=>20+v*240,cx=Math.min(c-1,Math.floor(q[0]*c)),cy=Math.min(c-1,Math.floor(q[1]*c));let b=`<rect x="${S(Math.max(0,cx-rad)/c)}" y="${S(Math.max(0,cy-rad)/c)}" width="${(Math.min(c,cx+rad+1)-Math.max(0,cx-rad))/c*240}" height="${(Math.min(c,cy+rad+1)-Math.max(0,cy-rad))/c*240}" fill="color-mix(in srgb,var(--accent) 18%,transparent)" stroke="var(--accent)"/>`;
  for(let k=1;k<c&&c<=32;k++)b+=`<path d="M${S(k/c)} 20V260M20 ${S(k/c)}H260" stroke="var(--line)" stroke-width=".6"/>`;
  b+=PTS.map(p=>`<circle cx="${S(p[0]).toFixed(1)}" cy="${S(p[1]).toFixed(1)}" r="1.6" fill="var(--muted)"/>`).join('');
  const ring=(i,col)=>i<0?'':`<circle cx="${S(PTS[i][0])}" cy="${S(PTS[i][1])}" r="7" fill="none" stroke="${col}" stroke-width="2.5"/>`;
  b+=ring(e.best,'var(--blue)')+ring(g.best,'var(--orange)')+`<path d="M${S(q[0])-6} ${S(q[1])}h12M${S(q[0])} ${S(q[1])-6}v12" stroke="var(--text)" stroke-width="2.5"/>`;
  b+=`<text x="276" y="40">파랑 원: 정확한 1위</text><text x="276" y="62">주황 원: 격자가 찾은 책</text><text x="276" y="84">+ 질문 위치</text><text x="276" y="120">질문 60개 평균</text><text x="276" y="142">거리 계산 ${U.fmt(bm.avgDistances,0)}번</text><text x="276" y="164">재현율 ${U.fmt(bm.recall*100,0)}%</text>`;
  const chart=U.svg(b,`책 2000권이 놓인 2차원 주제 지도와 ${c}×${c} 격자. 질문 칸에서 ${g.distances}권만 거리 계산`);
  const verdict=g.best<0?'<b>살펴본 칸이 비어 아무 책도 찾지 못했습니다.</b>':g.best===e.best?'정확한 1위와 같은 책을 찾았습니다.':`<b>정확한 1위가 아닌 다른 책</b>을 골랐습니다(거리 ${U.fmt(g.d,3)}, 1위는 ${U.fmt(e.d,3)}).`;
  U.result(el,chart,`정확한 검색: 책 <b>${int(e.distances)}</b>권과 모두 거리 계산 · 격자 ${c}×${c}: <strong>${int(g.distances)}</strong>권만 계산 (칸 ${g.visited}개)<br>${verdict}<br>질문 60개로 재면 평균 거리 계산 <b>${U.fmt(bm.avgDistances,0)}</b>번에 재현율 <strong>${U.fmt(bm.recall*100,0)}%</strong>. 칸을 잘게 나눌수록 빨라지지만 1위를 놓치는 일이 늘어납니다. 2차원 교육용 모형이며, 실제 임베딩(수백 차원)에서는 격자 대신 그래프나 군집 색인을 씁니다.`);
 },{'an-cells':v=>`${v}×${v}`,'an-x':v=>(v/100).toFixed(2),'an-y':v=>(v/100).toFixed(2)});
};
ALLabs.design=el=>{
 const qs=M.DESIGN.map(q=>U.select('ds-'+q.id,`${q.label} · 하루 ${int(q.daily)}번`,Object.entries(q.options).map(([k,[nm]])=>[k,nm]),Object.keys(q.options)[0])).join('');
 U.setup(el,U.select('ds-n','도서관 규모',[[10000,'1만 권 (지금)'],[1000000,'100만 권 (통합 뒤)']],10000)+qs);
 U.bind(el,()=>{
  const n=U.value(el,'ds-n'),choice=Object.fromEntries(M.DESIGN.map(q=>[q.id,el.querySelector('#ds-'+q.id).value])),r=M.designCost(choice,n),bestCost=M.designCost(Object.fromEntries(M.DESIGN.map(q=>[q.id,q.fix])),n);
  const chart=U.bars(r.rows.map(x=>x.label),r.rows.map(x=>Math.max(x.daily,1)),'하루 단계',{log:true,colors:r.rows.map(x=>x.best?'var(--accent)':'var(--orange)')});
  const warn=r.rows.filter(x=>!x.best).map(x=>x.id==='route'?'배송 경로: BFS는 도로 수가 적은 길을 줄 뿐 가장 빠른 길을 보장하지 않습니다(본관→호수 27분, 가장 빠른 길 26분)':`${x.label}: ${x.name} 1번에 ${big(x.per)}단계`);
  U.result(el,chart,`${int(n)}권 · 하루 합계 <strong>${big(r.total)}</strong>단계 ≈ <b>${r.seconds<1?U.fmt(r.seconds,3):U.fmt(r.seconds,1)}초</b> (가장 좋은 조합은 ${big(bestCost.total)}단계)<br>${warn.length?'고칠 곳: '+warn.map(esc).join(' · '):'다섯 질문 모두 이 책이 권하는 자료구조를 골랐습니다.'}<br>초록 막대는 권하는 선택, 주황 막대는 다시 볼 선택입니다. 단계 수는 각 장에서 확인한 식으로 어림한 값이고, 하루 질문 수와 ‘1초에 1억 단계’는 이 과제를 위한 가정입니다.`);
 });
};
})();
