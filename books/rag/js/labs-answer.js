/* 7~10장 실험: 평가 지표, 재순위, 컨텍스트 예산, 답 보류. */
(()=>{
'use strict';
const U=RUI,M=RMath,F=U.fmt,esc=U.esc;
const METHODS=[['keyword','키워드 (BM25)'],['meaning','의미 (임베딩)'],['hybrid','혼합 (α=0.5)']];
const OUT={correct:['맞게 답함','var(--accent)'],wrong:['틀리게 답함','var(--orange)'],missed:['놓침','var(--blue)'],abstain:['바르게 보류','var(--muted)']};
RLabs.metrics=el=>{
 U.setup(el,U.select('method','검색 방식',METHODS,'keyword')+U.range('k','상위 k개',1,5,1,1));
 U.bind(el,()=>{
  const m=el.querySelector('#method').value,k=U.value(el,'k'),r=M.benchmark(m,k);
  const table=`<div class="table-wrap"><table><thead><tr><th>질문</th><th>상위 ${k}개</th><th>첫 정답</th></tr></thead><tbody>${r.rows.map(x=>`<tr><td>${esc(x.q.text)}</td><td>${x.top.map(id=>x.q.rel.includes(id)?`<b>${id}</b>`:id).join(' ')}</td><td>${x.rr?F(1/x.rr,0)+'위':'—'}</td></tr>`).join('')}</tbody></table></div>`;
  U.result(el,U.bars([`P@${k}`,`R@${k}`,'MRR'],[r.precision,r.recall,r.mrr],'0~1',null,2,['var(--accent)','var(--blue)','var(--orange)'])+table,`${METHODS.find(x=>x[0]===m)[1]} · 질문 10개 평균<br>정밀도@${k} <strong>${F(r.precision,2)}</strong> · 재현율@${k} <strong>${F(r.recall,2)}</strong> · MRR <strong>${F(r.mrr,2)}</strong><br>표의 굵은 문서는 정답 표시 문서입니다. MRR은 k와 상관없이 전체 순위로 계산합니다. 실제 계산입니다.`);
 });
};
RLabs.rerank=el=>{
 U.setup(el,U.range('pool','다시 읽을 후보 수 N',1,8,1,3)+U.questions('rq','자세히 볼 질문',M.QUESTIONS.slice(0,10),4));
 U.bind(el,()=>{
  const n=U.value(el,'pool'),q=M.QUESTIONS[U.value(el,'rq')],one=M.rerank(q.text,M.corpus(true),n),all=M.rerankBenchmark(n);
  const before=one.first.slice(0,n),after=one.second,mark=r=>q.rel.includes(r.id)?'right':'';
  const chart=`<div class="rerank-cols"><div><p class="caption">1차 혼합 검색 상위 ${n}개</p>${U.docs(before,mark)}</div><div><p class="caption">재순위 후</p>${U.docs(after,mark)}</div></div>`;
  const pos=after.findIndex(r=>q.rel.includes(r.id));
  U.result(el,chart,`이 질문: 재순위 후 정답 ${pos<0?'<b>후보에 없음</b>':`<b>${pos+1}위</b>`} (1차 검색에서는 ${one.first.findIndex(r=>q.rel.includes(r.id))+1}위)<br>질문 10개 평균 · 1위 적중 <strong>${F(all.hitBefore*100,0)}% → ${F(all.hitAfter*100,0)}%</strong> · MRR ${F(all.before,2)} → ${F(all.after,2)} · 후보 안에 정답이 있는 비율(상한) ${F(all.ceiling*100,0)}%<br>초록 테두리는 정답 문서입니다. 재순위 점수는 교육용 모형의 실제 계산입니다.`);
 });
};
RLabs.pack=el=>{
 U.setup(el,U.questions('pq','질문',M.QUESTIONS.slice(0,10),1)+U.range('budget','토큰 예산',60,400,20,160));
 U.bind(el,()=>{
  const q=M.QUESTIONS[U.value(el,'pq')],budget=U.value(el,'budget'),r=M.packContext(q.text,budget),fixed=40+M.tokens(q.text);
  const parts=[['지시문·질문',fixed,'var(--muted)'],...r.chosen.map(c=>[c.id+(q.rel.includes(c.id)?' ✓':''),c.tokens,q.rel.includes(c.id)?'var(--accent)':'var(--blue)'])];
  const bar=`<div class="pack-bar" role="img" aria-label="토큰 예산 ${budget} 중 ${r.used} 사용">${parts.map(([n,t,c])=>`<span style="flex:${t};background:${c}">${n}</span>`).join('')}<span class="empty" style="flex:${Math.max(budget-r.used,0)}"></span></div><p class="caption">막대 전체가 예산 ${budget}토큰입니다. 빠진 후보: ${r.skipped.map(s=>s.id+'('+s.tokens+')').join(', ')||'없음'}</p>`;
  const has=r.chosen.some(c=>q.rel.includes(c.id)),noise=r.chosen.filter(c=>!q.rel.includes(c.id)).length;
  U.result(el,bar,`사용 <strong>${r.used} / ${budget}토큰</strong> · 근거 ${r.chosen.length}개 중 정답 ${has?'<b>포함</b>':'<b>없음</b>'}, 관련 없는 조각 ${noise}개<br>요청 하나의 KV 캐시 약 <b>${F(r.kvBytes/2**20,1)} MiB</b> (토큰당 128 KiB, LLM 시스템 책의 가상 8B 모델)<br>토큰은 어절 × 1.5 어림값입니다. 실제 모델 호출은 없습니다.`);
 });
};
RLabs.abstain=el=>{
 U.setup(el,U.range('threshold','답할 문턱',0,1,.05,.3)+U.select('ranker','1위 근거를 고르는 방법',[['hybrid','혼합 검색 점수'],['rerank','재순위 점수 (N=5)']],'hybrid'));
 U.bind(el,()=>{
  const t=U.value(el,'threshold'),re=el.querySelector('#ranker').value==='rerank',d=M.decide(t,{reranked:re});
  const list=`<ul class="verdicts">${d.rows.map(r=>`<li class="${r.outcome}"><span>${OUT[r.outcome][0]}</span><b>${esc(r.q.text)}</b><small>1위 ${r.top.id} · ${F(r.top.score,2)}${r.answer?' → '+esc(r.sentence):''}</small></li>`).join('')}</ul>`;
  const keys=Object.keys(OUT);
  U.result(el,U.bars(keys.map(k=>OUT[k][0]),keys.map(k=>d[k]),'질문 수',null,0,keys.map(k=>OUT[k][1]))+list,`문턱 ${F(t,2)} · 질문 13개 중 맞게 답함 <strong>${d.correct}</strong> · 틀리게 답함 <strong>${d.wrong}</strong> · 놓침 <strong>${d.missed}</strong> · 바르게 보류 <strong>${d.abstain}</strong><br>답이 없는 질문은 주차 대수·노트북 대여·와이파이 3개입니다. 점수가 높은데 답이 없는 질문을 목록에서 찾아보세요. 실제 계산입니다.`);
 });
};
})();
