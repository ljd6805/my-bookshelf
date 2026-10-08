/* 8~9장 실험: 어텐션 정렬, BLEU, 청킹과 답 구간. 계산은 A06Math에서 한다. */
(()=>{
'use strict';
const U=A06UI,M=A06Math,S=U.select,R=U.range,F=U.fmt,E=U.esc;

A06Labs.align=el=>{
 U.setup(el,S('word','디코더가 지금 쓰는 영어 단어',[['When','When'],['exchange','exchange'],['damaged','damaged'],['book','book']],'When')+R('beta','날카로움 β (점수에 곱하는 수)',0,8,0.5,3));
 U.bind(el,()=>{const w=U.text(el,'word'),b=U.value(el,'beta'),r=M.attend(w,b),flat=Math.max(...r.weights)-Math.min(...r.weights)<1e-9;
  el.querySelector('#beta-value').textContent=F(b,1);
  U.result(el,U.bars(M.ALIGN.src,r.weights,'가중치',null,3),
  `질의 “${E(w)}”와 원문 다섯 어절 키의 내적에 β = ${F(b,1)}을 곱한 점수: [${r.scores.map(x=>F(x,2)).join(', ')}]<br>소프트맥스 가중치: ${M.ALIGN.src.map((s,i)=>`${s} ${F(r.weights[i],2)}`).join(', ')}<br>${flat?'β = 0이면 모든 점수가 0이라 다섯 어절을 똑같이 0.20씩 봅니다. 문맥 벡터는 원문 전체의 평균일 뿐입니다.':`가장 크게 보는 어절은 <strong>${M.ALIGN.src[r.best]}</strong> (${F(r.weights[r.best]*100,0)}%)입니다. β를 키울수록 한 어절에 더 몰립니다.`} 문맥 벡터 = [${r.context.map(x=>F(x,2)).join(', ')}]. 4차원 키와 질의는 교육용 가정값이고, 점수와 가중치는 실제 계산입니다.`);});
};

const REF='when can i exchange the damaged book';
const CANDS=[[REF,'참조와 똑같은 번역'],['when can i exchange the book','“damaged”를 빠뜨린 번역'],['the damaged book can i exchange when','낱말은 같고 어순만 뒤섞은 번역'],['when is exchange of the broken book possible','뜻은 비슷하지만 표현이 다른 번역']];
A06Labs.bleu=el=>{
 U.setup(el,S('cand','후보 번역',CANDS.map((c,i)=>[i,c[1]]),1)+R('maxn','최대 n-gram',1,4,1,4));
 U.bind(el,()=>{const c=CANDS[U.value(el,'cand')][0],n=U.value(el,'maxn'),r=M.bleu(c,REF,n);
  U.result(el,U.bars(r.prec.map(p=>`${p.n}-gram ${p.match}/${p.total}`),r.prec.map(p=>p.p),'수정 정밀도',null,3),
  `참조: <i>${REF}</i><br>후보: <i>${E(c)}</i> (${r.clen}낱말, 참조 ${r.rlen}낱말)<br>간결성 벌점 BP = <b>${F(r.bp,3)}</b>, 1~${n}-gram 정밀도의 기하 평균에 곱한 BLEU = <strong>${F(r.score,1)}</strong><br>${r.prec.some(p=>p.match===0)?'겹치는 n-gram이 하나도 없는 단계는 0 대신 1/(개수+1)로 평활했습니다. 평활하지 않으면 BLEU는 0이 됩니다. ':''}${n===1?'1-gram만 보면 어순을 전혀 따지지 않습니다.':'긴 n-gram까지 보면 어순과 표현이 참조와 얼마나 같은지가 점수를 좌우합니다.'} 참조 하나로 센 실제 계산이며, 뜻이 같은 다른 표현은 낮게 나올 수 있습니다.`);});
};

function chunkSvg(r){
 const X=v=>30+v/r.total*420,[a0,a1]=r.answer;
 let b=`<text x="30" y="34">약관 ${r.total}토큰과 문장 경계</text>`;
 r.starts.forEach(s=>{b+=`<path d="M${X(s)} 60V96" stroke="var(--muted)" stroke-width="1"/>`;});
 b+=`<rect x="30" y="64" width="420" height="28" rx="3" fill="var(--panel2)"/>`;
 b+=`<rect x="${X(a0)}" y="64" width="${X(a1)-X(a0)}" height="28" fill="var(--orange)" opacity=".75"/><text x="${(X(a0)+X(a1))/2}" y="83" text-anchor="middle" fill="#111">답 구간</text>`;
 r.chunks.forEach(([s,e],i)=>{const y=118+(i%2)*34,hit=e>a0&&s<a1,hold=i===r.holder;b+=`<rect x="${X(s)+1}" y="${y}" width="${Math.max(2,X(e)-X(s)-2)}" height="26" rx="3" fill="${hold?'var(--accent)':hit?'var(--blue)':'var(--panel2)'}" stroke="var(--line)"/>`;if(X(e)-X(s)>26)b+=`<text x="${(X(s)+X(e))/2}" y="${y+18}" text-anchor="middle" fill="${hold||hit?'#111':'var(--text)'}">${i+1}</text>`;});
 b+=`<text x="30" y="214">초록: 답 전체 · 파랑: 답 일부</text><text x="30" y="240">${r.whole?`답이 ${r.holder+1}번 조각에 온전히 있음`:`답이 조각 ${r.touched}개로 갈라짐`}</text>`;
 return U.svg(b,`조각 ${r.chunks.length}개, ${r.whole?'답이 한 조각에 온전히 들어감':'답이 '+r.touched+'개 조각으로 갈라짐'}`);
}
A06Labs.chunk=el=>{
 U.setup(el,R('size','조각 크기 (토큰)',50,400,10,150)+S('strategy','자르는 방식',[['fixed','고정 길이로 자르기'],['sentence','문장 경계에서 자르기']],'fixed'));
 U.bind(el,()=>{const s=U.value(el,'size'),st=U.text(el,'strategy'),r=M.chunkDoc(s,st);
  U.result(el,chunkSvg(r),
  `약관 12문장(${r.total}토큰)을 ${st==='fixed'?'고정 길이':'문장 경계'}로 자르면 조각 <b>${r.chunks.length}개</b>가 됩니다. 답은 7~8번째 문장(${r.answer[0]}~${r.answer[1]}번째 토큰, ${r.answer[1]-r.answer[0]}토큰)에 걸쳐 있습니다.<br>판정: <strong>${r.whole?`답이 ${r.holder+1}번 조각 안에 온전히 있음`:`답이 조각 ${r.touched}개로 갈라짐`}</strong> · 상위 3개 조각을 넣으면 생성기에 들어가는 토큰은 최대 <b>${r.top3}</b>개입니다.<br>${r.whole?(s>=300?'조각이 크면 답은 온전하지만, 답과 상관없는 문장도 함께 들어가 검색 점수가 흐려집니다.':'답을 담을 만큼 크고 경계를 존중한 조각입니다.'):'답의 앞뒤 절반이 다른 조각으로 나뉘면 검색이 한쪽만 가져와 답이 반쪽이 됩니다.'} 문장 길이는 교육용 값이고, 경계 판정은 실제 계산입니다.`);});
};
})();
