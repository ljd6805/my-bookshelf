/* 5~6장 실험: 손으로 정한 임베딩과 혼합 검색. */
(()=>{
'use strict';
const U=RUI,M=RMath,F=U.fmt,esc=U.esc;
const ASK=M.QUESTIONS;
function scatter(qv,rows,ax,ay){
 const x=v=>60+v[ax]*380,y=v=>240-v[ay]*210,top=rows.slice(0,3).map(r=>r.id);
 const dots=rows.map(r=>`<circle cx="${x(r.vector)}" cy="${y(r.vector)}" r="${top.includes(r.id)?7:5}" fill="${top.includes(r.id)?'var(--accent)':'var(--muted)'}" opacity="${top.includes(r.id)?1:.55}"/><text x="${x(r.vector)+9}" y="${y(r.vector)-6}">${r.id}</text>`).join('');
 const arrow=`<path d="M60 240L${x(qv)} ${y(qv)}" stroke="var(--orange)" stroke-width="3"/><circle cx="${x(qv)}" cy="${y(qv)}" r="8" fill="var(--orange)"/><text x="${x(qv)+10}" y="${y(qv)+18}" fill="var(--orange)">질문</text>`;
 return U.svg(`<path d="M60 20V240H450" stroke="var(--line)" fill="none"/><text x="250" y="270" text-anchor="middle">${M.AXES[ax]} 축 →</text><text x="14" y="22">${M.AXES[ay]}</text>${dots}${arrow}`,`질문 벡터와 문서 벡터를 ${M.AXES[ax]} 축과 ${M.AXES[ay]} 축에 그린 그림. 상위 3개: ${top.join(', ')}`);
}
RLabs.embed=el=>{
 const axes=M.AXES.map((a,i)=>[i,a]);
 U.setup(el,U.questions('eq','질문',ASK,1)+U.select('ax','가로축',axes,1)+U.select('ay','세로축',axes,0));
 U.bind(el,()=>{
  const q=ASK[U.value(el,'eq')],qv=M.embed(q.text),rows=M.semantic(q.text,M.corpus(true)),ax=U.value(el,'ax'),ay=U.value(el,'ay');
  const vec=qv.map((v,i)=>v>0?`${M.AXES[i]} ${F(v,2)}`:'').filter(Boolean).join(' · ')||'모든 축이 0 (사전에 없는 낱말뿐)';
  U.result(el,scatter(qv,rows,ax,ay)+U.docs(rows.slice(0,4),r=>q.rel.includes(r.id)?'right':''),`질문 벡터: <b>${vec}</b><br>1위 <strong>${rows[0].id} ${esc(rows[0].doc.title)}</strong> · cos ${F(rows[0].score,2)} ${q.rel.length?(q.rel.includes(rows[0].id)?'· 정답 문서입니다':'· 정답 문서('+q.rel.join(', ')+')가 아닙니다'):'· 이 질문은 답이 문서에 없습니다'}<br>그림은 7차원 중 두 축만 보여 줍니다. 순위는 7차원 전체의 코사인으로 계산합니다. 손으로 정한 교육용 임베딩입니다.`);
 });
};
RLabs.hybrid=el=>{
 U.setup(el,U.questions('hq','질문',ASK,3)+U.range('alpha','α · 키워드 비중',0,1,.05,.5));
 U.bind(el,()=>{
  const q=ASK[U.value(el,'hq')],a=U.value(el,'alpha'),rows=M.hybrid(q.text,M.corpus(true),a).slice(0,5);
  const right=q.rel.includes(rows[0].id);
  U.result(el,U.bars(rows.map(r=>`${r.id}${q.rel.includes(r.id)?' ✓':''}`),rows.map(r=>r.score),'혼합 점수',null,2,rows.map(r=>q.rel.includes(r.id)?'var(--accent)':'var(--blue)')),`α=${F(a,2)} · 1위 <strong>${rows[0].id} ${esc(rows[0].doc.title)}</strong> ${q.rel.length?(right?'· 정답':'· 오답'):'· 답 없는 질문'}<br>1위의 키워드 점수 ${F(rows[0].keyword,2)} × ${F(a,2)} + 의미 점수 ${F(rows[0].meaning,2)} × ${F(1-a,2)} = <b>${F(rows[0].score,2)}</b><br>✓는 정답 표시 문서입니다. α=1은 키워드만, α=0은 의미만 쓴 결과와 같습니다. 실제 계산입니다.`);
 });
};
})();
