/* 3~5장 실험: 문장 틀, 질문 만들기, 시간 표지와 시제. 모든 문장은 EModel의 규칙이 만든다. */
(function(L,U,M){
'use strict';
const SUBJ=['I','You','We','They','He','She','Sam'].map(s=>[s,s]);
const PRED=[['be|hungry','be동사 · hungry (배고프다)'],['be|from Singapore','be동사 · from Singapore (싱가포르 출신이다)'],['be|in the office','be동사 · in the office (사무실에 있다)'],['work|in marketing','일반동사 work · in marketing'],['live|in Suwon','일반동사 live · in Suwon'],['like|spicy food','일반동사 like · spicy food'],['have|two meetings today','일반동사 have · two meetings today'],['watch|movies on weekends','일반동사 watch · movies on weekends'],['study|English at night','일반동사 study · English at night'],['go|to the gym on Fridays','일반동사 go · to the gym on Fridays']];
L.frame=el=>{
 U.setup(el,U.select('fr-subj','주어',SUBJ,'I')+U.select('fr-pred','동사와 나머지',PRED,'work|in marketing')+U.check('fr-addbe','be동사도 함께 넣어 보기(흔한 실수 확인)'));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 U.bind(el,()=>{
  const subj=el.querySelector('#fr-subj').value,[w,rest]=el.querySelector('#fr-pred').value.split('|'),be=w==='be',add=el.querySelector('#fr-addbe').checked;
  const subjText=subj==='I'||subj==='Sam'?subj:subj;
  let r=be?M.frame(subjText,'be',null,rest):M.frame(subjText,'verb',w,rest,add);
  if(be&&add)r={...r,issues:['be동사 문장에는 be동사가 이미 들어 있어 더 넣을 것이 없습니다.']};
  const parts=r.text.replace(/\.$/,'').split(' '),n=subj.split(' ').length;
  chart.innerHTML=`<div class="ew-chips"><span class="ew-chip" aria-pressed="true">주어 · ${U.esc(parts.slice(0,n).join(' '))}</span><span class="ew-chip">동사 · ${U.esc(be?r.verb:(add?parts.slice(n,n+2).join(' '):r.verb))}</span><span class="ew-chip">나머지 · ${U.esc(rest)}</span></div><div class="ew-sent">${r.ok?'':'<span class="ew-bad">'}${U.esc(r.text)}${r.ok?'':'</span>'}</div>`;
  const third=M.SUBJECTS[subj].p===3;
  out.innerHTML=`${r.ok?'<span class="ew-ok">✓ 맞는 문장</span>':'<span class="ew-no">✗ 틀린 문장</span>'} <b>${U.esc(r.text)}</b><br>${be?`상태·정체를 말하므로 be동사를 쓰고, 주어 ${U.esc(subj)}에 맞는 형태는 <b>${M.SUBJECTS[subj].be}</b>입니다.`:add?r.issues.map(U.esc).join(' '):`행동을 말하므로 일반동사를 씁니다. ${third?`${U.esc(subj)}처럼 3인칭 단수인 주어 뒤에서는 동사에 -s를 붙입니다: ${U.esc(w)} → <b>${U.esc(M.VERBS[w].s)}</b>.`:`3인칭 단수가 아닌 주어 뒤에서는 동사를 원형 그대로 씁니다: <b>${U.esc(w)}</b>.`}`}${be&&add?' '+U.esc(r.issues[0]):''}${U.kind('real','현재 시제 평서문 규칙으로 판정합니다.')}`;
 });
};
const CLAUSE_OPTS=[['work','work in Seoul (서울에서 일한다)'],['like','like spicy food (매운 음식을 좋아한다)'],['get up','get up at seven (7시에 일어난다)'],['go','go to Busan (부산에 간다)'],['be_from','be from Singapore (싱가포르 출신이다)'],['be_hungry','be hungry (배고프다)']];
L.questions=el=>{
 U.setup(el,U.select('qu-subj','주어',SUBJ,'You')+U.select('qu-clause','평서문',CLAUSE_OPTS,'work')+U.select('qu-tense','시제',[['present','현재'],['past','과거']],'present')+U.check('qu-wh','의문사 질문도 만들기'));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 U.bind(el,()=>{
  const subj=el.querySelector('#qu-subj').value,key=el.querySelector('#qu-clause').value,tense=el.querySelector('#qu-tense').value,useWh=el.querySelector('#qu-wh').checked;
  const q=M.question(subj,key,tense,useWh),c=M.CLAUSES[key];
  const fixed=c.presentOnly&&tense==='past';
  chart.innerHTML=U.table(['단계','문장'],[['평서문',U.esc(q.statement)],['조동사·be동사 앞으로',`<b>${U.esc(q.yesno.split(' ')[0])}</b> ${U.esc(q.yesno.split(' ').slice(1).join(' '))}`],['의문사 질문',q.wh?`<b>${U.esc(q.wh)}</b>`:(useWh?'이 문장에는 의문사로 바꿀 부분을 정해 두지 않았습니다':'(꺼짐)')]]);
  const why=c.be?`be동사 문장이라 be동사(${U.esc(q.aux)})를 주어 앞으로 옮깁니다.`:`일반동사 문장이라 조동사(${q.aux==='did'?'과거 시제의 did':q.aux==='does'?'3인칭 단수 현재의 does':'do'})를 주어 앞에 두고, 동사는 원형으로 돌아갑니다: <b>${U.esc(q.base)}</b>.`;
  out.innerHTML=`<div class="ew-sent">${U.esc(q.yesno)}${q.wh?`<br>${U.esc(q.wh)}`:''}</div>${why}${q.wh?` 의문사(${U.esc(c.wh)})가 “${U.esc(c.slot)}” 자리를 대신해, 그 부분은 문장에서 빠집니다.`:''}${fixed?' 출신을 묻는 문장은 현재 시제로만 만듭니다.':''}${U.kind('real','낱말 목록의 동사와 미리 정한 여섯 문장만 바꿉니다.')}`;
 });
};
const MARK_OPTS=Object.keys(M.MARKERS).map(k=>[k,k]);
const WHERE={'now-habit':[60,'늘 (습관)'],past:[20,'지난 일'],now:[60,'지금'],future:[100,'앞으로 (계획)']};
L.time=el=>{
 U.setup(el,U.select('ti-subj','주어',SUBJ,'I')+U.select('ti-verb','동사',Object.keys(M.OBJ).map(v=>[v,`${v} · ${M.OBJ[v]}`]),'visit')+U.select('ti-marker','시간 표지',MARK_OPTS,'every day'));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 const NAMES={present:'현재',past:'과거',progressive:'현재진행',going:'be going to'};
 U.bind(el,()=>{
  const subj=el.querySelector('#ti-subj').value,verb=el.querySelector('#ti-verb').value,marker=el.querySelector('#ti-marker').value;
  const r=M.timed(subj,verb,marker),[x,label]=WHERE[r.where],px=40+x*5.2;
  chart.innerHTML=`<svg viewBox="0 0 640 140" role="img" aria-label="시간선: 지난 일, 지금, 앞으로 가운데 ${label}에 표시"><line x1="40" y1="70" x2="600" y2="70" stroke="var(--line)" stroke-width="3"/><text x="144" y="110" text-anchor="middle" fill="var(--muted)" font-size="14">지난 일</text><text x="352" y="110" text-anchor="middle" fill="var(--muted)" font-size="14">지금</text><text x="560" y="110" text-anchor="middle" fill="var(--muted)" font-size="14">앞으로</text><line x1="352" y1="58" x2="352" y2="82" stroke="var(--muted)" stroke-width="2"/>${r.where==='now-habit'?[144,248,352,456].map(p=>`<circle cx="${p}" cy="70" r="8" fill="var(--accent)"/>`).join(''):`<circle class="fig-pulse" cx="${px}" cy="70" r="12" fill="var(--accent)"/>`}<text x="${r.where==='now-habit'?300:px}" y="40" text-anchor="middle" fill="var(--text)" font-size="15" font-weight="700">${U.esc(marker)} → ${NAMES[r.tense]}</text></svg>`;
  out.innerHTML=`<div class="ew-sent">${U.esc(r.text)}</div>시간 표지(<b>${U.esc(marker)}</b>)는 시간선의 ‘${label}’ 자리를 가리키므로 <b>${NAMES[r.tense]}</b> 시제를 씁니다.${r.tense==='past'?` ${U.esc(verb)}의 과거형은 <b>${U.esc(M.VERBS[verb].past)}</b>입니다.${r.irregular?' -ed를 붙이지 않고 모양이 바뀌는 동사입니다.':' -ed를 붙여 만듭니다.'}`:''}${r.tense==='present'&&M.SUBJECTS[subj].p===3?` 주어가 3인칭 단수라 동사에 -s를 붙입니다: ${U.esc(M.VERBS[verb].s)}.`:''}${U.kind('real','시간 표지 일곱 개와 동사 여덟 개의 규칙입니다.')}`;
 });
};
})(window.ELabs,window.EUI,window.EModel);
