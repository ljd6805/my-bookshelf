/* 1~4장 실험: 쪼개는 단위, BPE 병합, IDF, 문맥 창, 벡터 유추, 주제 비율. 계산은 A06Math에서 한다. */
(()=>{
'use strict';
const U=A06UI,M=A06Math,S=U.select,R=U.range,F=U.fmt,E=U.esc;
const chips=(list,cls='')=>`<div class="tokens a06-chips ${cls}">${list.map(x=>`<span class="token">${E(x)}</span>`).join('')}</div>`;
const MODE={space:'어절 그대로',josa:'끝 조사 떼기',char2:'글자 두 개씩'};

A06Labs.split=el=>{
 U.setup(el,S('q','손님 질문',[['환불 언제 돼요','환불 언제 돼요'],['배송비 얼마예요','배송비 얼마예요'],['작가 신간 나왔나요','작가 신간 나왔나요']],'환불 언제 돼요')+S('mode','쪼개는 단위',Object.entries(MODE),'space'));
 U.bind(el,()=>{const q=U.text(el,'q'),m=U.text(el,'mode'),tq=M.tokenize(q,m),V=M.vocab(M.INBOX,m).length,hits=M.matchDocs(q,M.INBOX,m).filter(x=>x.hits>0);
  const list=hits.slice(0,3).map(h=>`<li><b>${h.i+1}번</b> ${E(h.text)} <small>(겹친 토큰 ${h.hits}개: ${E(h.words.join(', '))})</small></li>`).join('');
  const panel=`<div class="kit-panel a06-panel"><p class="a06-label">질문을 자른 결과</p>${chips(tq)}<p class="a06-label">문의함 여덟 통의 어휘 크기 <b>${V}개</b></p><p class="a06-label">질문과 토큰이 겹치는 문의</p>${hits.length?`<ol class="a06-list">${list}</ol>`:'<p class="a06-empty">겹치는 문의가 없습니다.</p>'}</div>`;
  U.result(el,panel,`${MODE[m]} 방식으로 “${E(q)}”를 자르면 토큰 <b>${tq.length}개</b>가 됩니다. 문의함 전체의 어휘는 <b>${V}개</b>입니다.<br>질문과 토큰이 하나라도 겹치는 문의는 <strong>${hits.length}통</strong>입니다.${hits.length?` 가장 많이 겹친 문의는 ${hits[0].i+1}번입니다.`:''}<br>${m==='space'?'어절을 그대로 쓰면 “환불은”과 “환불”이 다른 토큰이라 같은 뜻의 문의를 놓칩니다.':m==='josa'?'조사를 떼면 어휘가 줄고 더 많은 문의가 걸리지만, “작가”처럼 끝 글자가 조사와 같은 낱말은 잘못 잘립니다.':'글자 두 개 조각은 철자가 조금 달라도 겹치지만, 어휘가 커지고 뜻 없는 조각끼리도 겹칩니다.'} 규칙대로 자르고 세는 실제 계산입니다.`);});
};

A06Labs.bpe=el=>{
 U.setup(el,R('merges','병합 횟수',0,8,1,3));
 U.bind(el,()=>{const k=U.value(el,'merges'),r=M.learnBpe(M.BPE_WORDS,k),last=r.merges[r.merges.length-1];
  const words=Object.keys(M.BPE_WORDS),unseen=['배송료','환불금','교환권'];
  const rows=words.map(w=>`<div class="a06-seg"><small>${E(w)} ×${M.BPE_WORDS[w]}</small>${chips(M.applyBpe(w,r.merges))}</div>`).join('');
  const test=unseen.map(w=>`<div class="a06-seg"><small>${E(w)}${w==='배송료'?' (처음 봄)':''}</small>${chips(M.applyBpe(w,r.merges),'alt')}</div>`).join('');
  U.result(el,`<div class="kit-panel a06-panel"><p class="a06-label">학습 낱말의 분할</p><div class="a06-segs">${rows}</div><p class="a06-label">새 낱말에 같은 병합 규칙 적용</p><div class="a06-segs">${test}</div></div>`,
  `병합 ${k}번: 글자 ${r.chars}개가 토큰 <b>${r.tokens}개</b>로 줄었고, 어휘는 글자 11개에 병합 ${r.merges.length}개를 더한 <b>${r.vocabSize}개</b>입니다.<br>${last?`마지막 병합은 “${E(last[0])}”+“${E(last[1])}” (함께 나온 횟수 ${last[2]}번)입니다.`:'아직 병합하지 않아 모든 글자가 따로 있습니다.'} 처음 보는 “배송료”는 <strong>${E(M.applyBpe('배송료',r.merges).join(' · '))}</strong>로 나뉩니다.<br>가장 잦은 이웃 쌍을 차례로 합치는 실제 계산입니다. 낱말 빈도는 교육용으로 정한 값입니다.`);});
};

A06Labs.tfidf=el=>{
 U.setup(el,R('df','“환불”이 든 문의 수 (df, 8통 중)',1,8,1,2));
 U.bind(el,()=>{const d=U.value(el,'df'),N=8,base=M.tfidfDoc(M.INBOX,4),h=base.find(x=>x.word==='환불'),s=M.idf(d,N,true),raw=M.idf(d,N,false);
  const others=base.filter(x=>x.word!=='환불');
  const labels=['환불 (평활 IDF)','환불 (평활 없음)',...others.map(x=>x.word)],vals=[h.tf*s,h.tf*raw,...others.map(x=>x.w)];
  U.result(el,U.bars(labels,vals,'가중치',null,2),
  `5번 문의 “${E(M.INBOX[4])}”에서 “환불”의 TF는 5토큰 중 2번이라 <b>${F(h.tf,2)}</b>입니다.<br>df = ${d}이면 평활 IDF = ln(9/${d+1}) + 1 = <b>${F(s,3)}</b>, 평활 없는 IDF = ln(8/${d}) = <b>${F(raw,3)}</b>입니다. 가중치는 각각 <strong>${F(h.tf*s,2)}</strong>, <strong>${F(h.tf*raw,2)}</strong>입니다.<br>${d===N?'모든 문의에 나오는 낱말은 평활 없는 식에서 무게가 0이 됩니다. 평활 식은 1을 더해 0이 되지 않게 막습니다.':d===1?'한 문의에만 나오는 낱말은 가장 큰 IDF를 받습니다.':'df가 커질수록 IDF가 줄어 흔한 낱말의 무게가 내려갑니다.'} 다른 낱말 막대는 실제 문의함(df 그대로)으로 계산했고, “환불”의 df만 가정해 바꾼 실제 계산입니다.`);});
};

A06Labs.skipgram=el=>{
 U.setup(el,R('win','문맥 창 크기 (좌우 낱말 수)',1,4,1,2)+S('target','가운데 낱말',[['환불','환불'],['배송','배송'],['교환','교환']],'환불'));
 U.bind(el,()=>{const w=U.value(el,'win'),t=U.text(el,'target'),r=M.contextCounts(M.INBOX,t,w),n=M.sum(r.counts.map(x=>x[1]));
  U.result(el,U.bars(r.counts.map(x=>x[0]),r.counts.map(x=>x[1]),'번',null,0),
  `창 크기 ${w}: 문의함 여덟 통에서 (가운데, 주변) 학습 쌍이 모두 <b>${r.total}개</b> 만들어집니다.<br>그중 가운데가 “${E(t)}”인 쌍은 <b>${n}개</b>이고, 주변 낱말은 ${r.counts.map(x=>`${E(x[0])} ${x[1]}번`).join(', ')}입니다.<br>${w===1?'창이 좁으면 바로 옆 낱말만 남아 문법적 짝이 많이 잡힙니다.':'창을 넓히면 쌍이 늘고 주제가 같은 먼 낱말도 문맥으로 들어옵니다.'} 조사를 뗀 뒤 쌍을 세는 실제 계산이며, 벡터 학습 자체는 하지 않습니다.`);});
};

const SETS=[['소설','소설가','시'],['시','시인','만화'],['만화','만화가','소설']];
A06Labs.analogy=el=>{
 U.setup(el,S('set','유추 문제',SETS.map(([a,b,c],i)=>[i,`${b} − ${a} + ${c}`]),0)+S('measure','순위 기준',[['cos','코사인 유사도'],['dot','내적']],'cos'));
 U.bind(el,()=>{const [a,b,c]=SETS[U.value(el,'set')],m=U.text(el,'measure'),r=M.analogy(a,b,c,m),top=r.list.slice(0,5);
  U.result(el,U.bars(top.map(x=>x.word),top.map(x=>x.score),m==='cos'?'코사인 유사도':'내적',null,3),
  `${b} − ${a} + ${c} = [${r.target.map(x=>F(x,2)).join(', ')}]입니다(축: 사람, 이야기, 운율).<br>${m==='cos'?'코사인':'내적'} 기준 1위는 <strong>${E(top[0].word)}</strong> (${F(top[0].score,3)}), 2위는 ${E(top[1].word)} (${F(top[1].score,3)})입니다.<br>${m==='dot'?'내적은 벡터 길이도 함께 곱하므로, 자주 나와 길이가 긴 “책”이 방향이 달라도 위로 올라옵니다.':'코사인은 길이를 나누어 방향만 비교하므로 관계가 맞는 낱말이 1위가 됩니다.'} 3차원 벡터는 교육용 가정값이고, 순위는 그 값으로 한 실제 계산입니다.`);});
};

A06Labs.lda=el=>{
 U.setup(el,R('nref','“환불”을 더한 개수',0,6,1,0)+S('alpha','α (주제를 고르게 섞으려는 정도)',[['0.1','0.1 · 한 주제로 몰림'],['1','1 · 중간'],['5','5 · 고르게 섞임']],'1'));
 U.bind(el,()=>{const n=U.value(el,'nref'),a=Number(U.text(el,'alpha')),counts=[2,1,0,n,0,0,0,0,0],th=M.topicMix(counts,a),top=th.indexOf(Math.max(...th));
  U.result(el,U.bars(M.TOPICS.names,th,'비율',null,3),
  `문의 낱말: 배송 2, 늦어요 1${n?`, 환불 ${n}`:''} (모두 ${3+n}개), α = ${a}<br>주제 비율: ${M.TOPICS.names.map((x,i)=>`${x} <b>${F(th[i],3)}</b>`).join(', ')}. 가장 큰 주제는 <strong>${M.TOPICS.names[top]}</strong>입니다.<br>${a<1?'α가 작으면 한 문의가 적은 수의 주제로 몰립니다.':a>1?'α가 크면 낱말이 적은 문의도 세 주제에 고르게 퍼집니다.':'α = 1이면 낱말 증거와 고른 섞임이 반씩 힘을 냅니다.'} 주제별 낱말 분포는 교육용 가정값으로 고정하고, 이 문의의 비율만 EM으로 추정한 실제 계산입니다.`);});
};
})();
