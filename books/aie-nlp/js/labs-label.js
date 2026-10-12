/* 5~7장 실험: 부정 범위와 나이브 베이즈, 비터비 품사 줄, 평활과 퍼플렉서티. 계산은 A06Math에서 한다. */
(()=>{
'use strict';
const U=A06UI,M=A06Math,S=U.select,R=U.range,F=U.fmt,E=U.esc;
const big=v=>Number.isFinite(v)?F(v,2):'무한대';
const SENTS=['표지가 나쁘지 않아요','번역이 좋지 않아요','내용이 안 좋아요','배송 좋아요'];
const GOLD=['긍정','부정','부정','긍정'];

A06Labs.negation=el=>{
 U.setup(el,S('sent','시험 문장',SENTS.map((s,i)=>[i,s]),2)+S('scope','부정 범위 처리',[['off','하지 않음'],['on','NOT_ 표시 붙이기']],'off')+R('alpha','더하기 평활 α',0.1,2,0.1,1));
 U.bind(el,()=>{const i=U.value(el,'sent'),on=U.text(el,'scope')==='on',a=U.value(el,'alpha'),r=M.nbClassify(SENTS[i],on,a),prior=r.score-M.sum(r.parts.map(p=>p.llr));
  const lab=r.label?'긍정':'부정',ok=lab===GOLD[i];
  const rows=`<div class="a06-rows" role="img" aria-label="낱말별 로그 비율: ${r.parts.map(p=>`${p.w} ${F(p.llr,2)}`).join(', ')}">${[{w:'사전 비율',llr:prior,seen:true},...r.parts].map(p=>`<div class="a06-diverge ${p.llr>=0?'pos':'neg'}"><span>${E(p.w)}${p.seen?'':' (처음 봄)'}</span><i style="--w:${Math.min(100,Math.abs(p.llr)/3*100)}%"></i><b>${p.llr>=0?'+':''}${F(p.llr,2)}</b></div>`).join('')}</div>`;
  U.result(el,rows,
  `토큰: ${r.tokens.map(E).join(' · ')}<br>로그 비율 합 = <b>${F(r.score,2)}</b>, 긍정일 확률 <b>${F(r.pPos*100,0)}%</b> → 판정 <strong>${lab}</strong> (사람이 붙인 답: ${GOLD[i]}, ${ok?'맞음':'틀림'})<br>${on?'부정 범위 안의 낱말은 NOT_가 붙어 다른 낱말로 학습되므로, “안 좋아요”의 “좋아요”가 더는 칭찬의 증거가 되지 않습니다.':'부정 범위를 처리하지 않으면 “안”과 “않아요” 뒤에 있는 “좋아요”도 칭찬 증거로 셉니다.'} 학습 리뷰 12개(교육용)로 한 실제 나이브 베이즈 계산입니다.`);});
};

const PAIRS=[['can I book the book',['AUX','PRON','VERB','DET','NOUN']],['you can book a table',['PRON','AUX','VERB','DET','NOUN']]];
const KO={PRON:'대명사',AUX:'조동사',VERB:'동사',DET:'관사',NOUN:'명사'};
A06Labs.viterbi=el=>{
 U.setup(el,R('pv','P(book | 동사): 동사가 book으로 나올 확률',0.005,0.2,0.005,0.1));
 U.bind(el,()=>{const p=U.value(el,'pv');
  const res=PAIRS.map(([s,g])=>{const w=s.split(' '),v=M.viterbi(w,p),b=w.map(M.mostFrequentTag);return {w,g,v,b,okV:v.tags.filter((t,i)=>t===g[i]).length,okB:b.filter((t,i)=>t===g[i]).length};});
  const table=res.map(r=>`<div class="a06-tagrow"><div class="a06-tagwords">${r.w.map((x,i)=>`<span class="${r.v.tags[i]!==r.g[i]?'bad':''}"><b>${x}</b><small>${KO[r.v.tags[i]]}</small><em>${KO[r.b[i]]}</em></span>`).join('')}</div></div>`).join('');
  U.result(el,`<div class="kit-panel a06-panel"><p class="a06-label">윗줄: 비터비가 고른 품사 · 아랫줄(흐린 글자): 낱말마다 가장 흔한 품사</p>${table}</div>`,
  `P(book | 동사) = <b>${F(p,3)}</b> (명사로 나올 확률은 0.30으로 고정)<br>${res.map(r=>`“${r.w.join(' ')}”: 비터비 <strong>${r.okV}/5</strong>, 최빈 품사 기준선 ${r.okB}/5 (로그 확률 ${F(r.v.logp,2)})`).join('<br>')}<br>${res.every(r=>r.okV===5)?'앞뒤 품사의 전이 확률이 “조동사 다음 동사”를 강하게 밀어서, 방출 확률이 작아도 두 문장의 book을 동사로 고릅니다.':res.some(r=>r.okV===5)?'전이 확률이 약하게 미는 문장부터 book이 명사로 바뀝니다. 같은 확률이라도 앞뒤 줄 전체가 판정을 정합니다.':'방출 확률이 너무 작아져 전이의 도움으로도 동사를 지키지 못합니다.'} 확률표는 교육용 가정값이고 경로 탐색은 실제 계산입니다.`);});
};

const LM_SENTS=['환불은 언제 되나요','배송비 환불 되나요','교환 신청했는데 안 됐어요'];
const LM=M.bigramModel(M.INBOX);
A06Labs.perplexity=el=>{
 U.setup(el,S('sent','시험 문장',LM_SENTS.map((s,i)=>[i,s]),0)+R('k','더하기-k 평활의 k',0,2,0.05,0));
 U.bind(el,()=>{const s=LM_SENTS[U.value(el,'sent')],k=U.value(el,'k'),r=M.perplexity(LM,s,k),zero=r.steps.filter(x=>x.p===0);
  el.querySelector('#k-value').textContent=F(k,2);
  U.result(el,U.bars(r.steps.map(x=>`${x.from}→${x.to}`),r.steps.map(x=>x.p),'확률',null,3),
  `“${E(s)}”의 바이그램 ${r.steps.length}개, 어휘 ${LM.V}개, k = ${F(k,2)}<br>퍼플렉서티 <strong>${big(r.pp)}</strong>, 낱말당 <b>${big(r.bits)}</b>비트${zero.length?` · 학습 자료에 없던 쌍 ${zero.length}개(${zero.map(x=>`${E(x.from)}→${E(x.to)}`).join(', ')})가 확률 0을 받아 문장 전체 확률이 0이 됩니다.`:''}<br>${k===0?'k = 0은 본 적 있는 쌍에 확률을 모두 몰아줍니다. 본 문장에는 점수가 좋지만 처음 보는 쌍 하나에 무너집니다.':'k를 키우면 처음 보는 쌍도 확률을 조금 받지만, 본 적 있는 쌍의 확률은 그만큼 깎입니다.'} 문의함 여덟 통으로 센 실제 계산입니다.`);});
};
})();
