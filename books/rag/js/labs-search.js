/* 1~4장 실험: 근거 넣기, 역색인, BM25, 조각 나누기. 계산은 RMath에 있고 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=RUI,M=RMath,F=U.fmt,esc=U.esc;
const ASK=M.QUESTIONS.slice(0,8);
/* 근거 없이 답할 때 흔히 나오는 그럴듯한 오답. 실제 모델 출력이 아닌 미리 적어 둔 시나리오다. */
const GUESS=['보통 공공도서관은 한 번에 5권, 2주 동안 빌릴 수 있습니다.','하루에 100원씩 연체료가 붙습니다.','대부분의 도서관은 연중무휴로 운영합니다.','열람실 좌석은 선착순이라 예약할 수 없습니다.','도서관 규정에 따라 책값의 두 배를 물어야 합니다.','전자책도 연체료가 하루 100원입니다.','밤에는 도서관이 문을 닫아 반납할 수 없습니다.','컬러 출력은 한 장에 500원입니다.'];
RLabs.grounding=el=>{
 U.setup(el,U.questions('ask','이용자의 질문',ASK,1)+U.select('mode','답을 만드는 방식',[['closed','근거 없이 답하기'],['open','근거를 찾아 함께 넣기']],'closed'));
 U.bind(el,()=>{
  const i=U.value(el,'ask'),q=ASK[i],open=el.querySelector('#mode').value==='open',docs=M.corpus(true);
  const top=M.hybrid(q.text,docs)[0],right=q.rel.includes(top.id),sentence=M.bestSentence(q.text,top.doc);
  const chart=`<div class="answer-card ${open?'grounded':'guess'}"><p class="who">이용자</p><p>${esc(q.text)}</p><p class="who">도우미 ${open?'· 근거 '+top.id:'· 근거 없음'}</p><p class="said">${esc(open?sentence:GUESS[i])}</p>${open?`<p class="cite">[${top.id}] ${esc(top.doc.title)}</p>`:'<p class="cite">출처를 댈 수 없습니다</p>'}</div>`;
  U.result(el,chart,open?`검색 1위 <b>${top.id} · ${esc(top.doc.title)}</b>에서 질문과 가장 잘 맞는 문장을 보여 줍니다. 정답 문서 ${q.rel.join(', ')} 중 하나${right?'가 맞습니다':'가 아닙니다'}. 이 도서관의 실제 규칙은 “${esc(q.answer)}”입니다.<br>근거 검색은 실제 계산(6장의 혼합 검색), 답 문장은 문서 원문 발췌입니다.`:`<strong>출처 없는 답</strong> · 이 도서관의 실제 규칙은 “${esc(q.answer)}”입니다. 왼쪽 답은 흔한 도서관 상식을 흉내 낸 미리 적은 시나리오이며 실제 언어 모델 출력이 아닙니다.`);
 });
};
RLabs.invert=el=>{
 U.setup(el,U.text('query','질문 낱말 (공백으로 구분)','책 반납')+U.select('combine','목록을 합치는 방법',[['or','OR · 하나라도 있으면'],['and','AND · 모두 있어야']],'or'));
 U.bind(el,()=>{
  const docs=M.corpus(false),r=M.match(el.querySelector('#query').value,docs,el.querySelector('#combine').value);
  const lists=r.terms.length?r.terms.map(t=>`<div class="posting"><b>${esc(t.term)}</b><span>${t.docs.length?t.docs.map(id=>`<i class="${r.hits.includes(id)?'on':''}">${id}</i>`).join(''):'<em>목록 없음</em>'}</span></div>`).join(''):'<p class="caption">낱말을 입력하세요.</p>';
  const chart=`<div class="index-view"><p class="caption">역색인에서 꺼낸 목록 · 굵은 칸은 최종 결과</p>${lists}<div class="doc-chips">${docs.map(d=>`<span class="${r.hits.includes(d.id)?'hit':''}" title="${esc(d.title)}">${d.id}</span>`).join('')}</div></div>`;
  U.result(el,chart,`분석된 낱말: <b>${r.terms.map(t=>esc(t.term)).join(' · ')||'없음'}</b><br>걸린 문서 <strong>${r.hits.length}개</strong> / 13개${r.hits.length?' · '+r.hits.map(id=>`${id} ${esc(docs.find(d=>d.id===id).title)}`).join(', '):''}<br>13개 문서를 다시 읽지 않고 목록만 합쳤습니다. 순서는 아직 없습니다.`);
 });
};
RLabs.bm25=el=>{
 U.setup(el,U.text('bq','질문','대출 기간')+U.range('k1','k1 · 반복의 포화',0,3,.1,1.2)+U.range('b','b · 길이 보정',0,1,.05,.75));
 U.bind(el,()=>{
  const k1=U.value(el,'k1'),b=U.value(el,'b'),rows=M.bm25(el.querySelector('#bq').value,M.corpus(false),{k1,b}).slice(0,5);
  const top=rows[0],detail=top.parts.filter(p=>p.tf).map(p=>`${esc(p.term)} tf=${p.tf} → ${F(p.score,2)}`).join(', ');
  U.result(el,U.bars(rows.map(r=>`${r.id} · ${r.length}어절`),rows.map(r=>r.score),'BM25',null,2,rows.map(r=>r.id==='D13'?'var(--orange)':'var(--accent)')),`1위 <b>${top.id} ${esc(top.doc.title)}</b> · 점수 <strong>${F(top.score,2)}</strong><br>낱말별 기여: ${detail||'일치하는 낱말 없음'}<br>주황 막대는 76어절짜리 이용 규정 전문입니다. 평균 길이는 ${F(M.index(M.corpus(false)).avg,1)}어절입니다. 실제 BM25 계산입니다.`);
 });
};
RLabs.chunk=el=>{
 U.setup(el,U.range('size','조각 크기 (문장)',1,5,1,2)+U.range('overlap','겹침 (문장)',0,2,1,0));
 U.bind(el,()=>{
  let size=U.value(el,'size'),overlap=U.value(el,'overlap');
  const note=overlap>=size?`겹침은 크기보다 작아야 해서 ${size-1}로 맞췄습니다. `:'';overlap=Math.min(overlap,size-1);
  const chunks=M.chunk(M.RULES,size,overlap),docs=chunks.map((c,i)=>({id:'C'+(i+1),title:`${c.from}~${c.to}문장`,text:c.text}));
  const whole=chunks.findIndex(c=>c.from<=4&&c.to>=5),ranked=M.bm25('연체로 대출이 정지되면 최대 며칠인가요?',docs),rank=whole<0?-1:ranked.findIndex(r=>r.id==='C'+(whole+1))+1;
  const avg=chunks.reduce((s,c)=>s+M.tokens(c.text),0)/chunks.length;
  const rows=M.RULES.map((s,i)=>`<div class="sentence ${i===3||i===4?'key':''}"><b>${i+1}</b><span>${esc(s)}</span><em>${chunks.map((c,k)=>c.from<=i+1&&c.to>=i+1?'C'+(k+1):'').filter(Boolean).join(' ')}</em></div>`).join('');
  U.result(el,`<div class="chunk-view"><p class="caption">문장 오른쪽에 그 문장이 들어간 조각 번호를 적었습니다. 강조한 4·5번 문장이 함께 있어야 답이 완성됩니다.</p>${rows}</div>`,`${note}조각 <strong>${chunks.length}개</strong> · 조각당 평균 약 ${F(avg,0)}토큰 · 문장 중복 ${chunks.reduce((s,c)=>s+c.to-c.from+1,0)-M.RULES.length}번<br>${whole<0?'<b>4번과 5번 문장이 서로 다른 조각으로 갈라졌습니다.</b> 어느 조각을 찾아도 “그 기간”이 무엇인지 알 수 없습니다.':`4·5번 문장이 <b>C${whole+1}</b>에 함께 있습니다. 질문으로 조각을 BM25 검색하면 C${whole+1}은 <b>${rank}위</b>입니다.`}<br>실제로 자르고 검색한 결과입니다.`);
 });
};
})();
