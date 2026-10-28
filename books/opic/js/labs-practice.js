/* 9~11장 실험: 준비한 이야기로 질문 덮기, 말하기 속도와 멈춤 재기(실제 초시계), 민서의 답 진단. */
(function(){
'use strict';
const L=OLabs,U=OUI,T=OText,S=OSamples;
const USE_KO={place:'장소 묘사',routine:'습관',past:'경험',compare:'비교'};
const STATUS={fit:['✓','그대로 씀'],adapt:['△','쓰임만 맞춰 바꿈'],none:['✕','준비한 이야기 없음']};

/* 9장: 준비한 이야기를 골라, 질문 여덟 개 가운데 그대로 쓸 질문·바꿔 쓸 질문·덮지 못한 질문을 센다. */
L.reuse=el=>{
 U.setup(el,S.STORIES.map(s=>U.check('ru-'+s.id,`${s.name} <small>(${s.uses.map(u=>USE_KO[u]).join('·')})</small>`,S.REUSE_PRESETS.park_only.includes(s.id))).join(''));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 U.bind(el,()=>{
  const prepared=S.STORIES.filter(s=>el.querySelector('#ru-'+s.id).checked).map(s=>s.id),r=T.reuse(S.STORIES,S.QUESTIONS,prepared);
  chart.innerHTML=U.table(['질문','종류','쓰임','판정'],r.rows.map(x=>[`<span lang="en">${U.esc(x.q.text)}</span>`,x.q.kind,USE_KO[x.q.use],`${STATUS[x.status][0]} ${STATUS[x.status][1]}${x.fit.length?` · ${x.fit[0].name}`:x.near.length?` · ${x.near[0].name}에서`:''}`]),'질문 여덟 개와 준비한 이야기');
  out.innerHTML=`준비한 이야기 ${prepared.length}개로 질문 8개 가운데 <b>그대로 씀 ${r.fit}개</b>, <b>쓰임만 바꿈 ${r.adapt}개</b>, <b>덮지 못함 ${r.none}개</b>. “쓰임만 바꿈”은 같은 쓰임(장소·습관·경험·비교)의 이야기를 질문 주제에 맞게 고쳐 말한다는 뜻이고, 고쳐 말할 문장은 시험장에서 새로 만들어야 합니다.${U.kind('real','story')}`;
 });
};

/* 10장: 녹음 길이·낱말 수·멈춘 시간으로 말하기 속도를 계산한다. 초시계 단추는 실제로 시간을 재어 길이 칸에 넣는다. */
L.pace=el=>{
 U.setup(el,`<div class="timer" role="group" aria-label="초시계"><button type="button" data-manual data-timer="start">초시계 시작</button><button type="button" data-manual data-timer="stop" disabled>멈추고 길이에 넣기</button><output class="timer-out" aria-live="off">0분 00초</output></div>`+U.range('pc-sec','녹음 길이(초)',20,180,1,80)+U.range('pc-words','말한 낱말 수',10,250,1,58,'대본이 있으면 아래 칸에 붙이고 “대본 낱말 세기”를 누릅니다.')+U.range('pc-pause','2초 넘게 멈춘 시간의 합(초)',0,60,1,18)+U.select('pc-target','문항당 목표 시간',[[60,'1분'],[90,'1분 30초'],[120,'2분']],90)+`<label class="control" for="pc-text"><span>대본 (선택)</span><textarea id="pc-text" rows="3" data-manual lang="en" spellcheck="false"></textarea></label><button type="button" data-manual data-count>대본 낱말 세기</button>`);
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout'),sec=el.querySelector('#pc-sec'),wordsIn=el.querySelector('#pc-words');
 let t0=0,tick=0;const tOut=el.querySelector('.timer-out'),bStart=el.querySelector('[data-timer=start]'),bStop=el.querySelector('[data-timer=stop]');
 const setVal=(x,v)=>{x.value=Math.max(+x.min,Math.min(+x.max,Math.round(v)));x.dispatchEvent(new Event('input',{bubbles:true}));};
 bStart.onclick=()=>{t0=performance.now();bStart.disabled=true;bStop.disabled=false;clearInterval(tick);tick=setInterval(()=>{tOut.textContent=U.clock((performance.now()-t0)/1000);},250);};
 bStop.onclick=()=>{clearInterval(tick);const s=(performance.now()-t0)/1000;tOut.textContent=U.clock(s);bStart.disabled=false;bStop.disabled=true;setVal(sec,s);};
 el.querySelector('[data-count]').onclick=()=>{const n=T.words(el.querySelector('#pc-text').value);if(n)setVal(wordsIn,n);};
 U.bind(el,()=>{
  const s=+sec.value,w=+wordsIn.value,p=Math.min(+el.querySelector('#pc-pause').value,s-1),target=+el.querySelector('#pc-target').value;
  const rate=T.wpm(w,s),flow=T.wpm(w,s-p),share=T.pauseShare(p,s),need=Math.round(rate*target/60),fifteen=15*target+15*20;
  chart.innerHTML=`<svg viewBox="0 0 620 150" role="img" aria-label="녹음 ${s}초 가운데 말한 시간 ${s-p}초, 멈춘 시간 ${p}초"><text x="10" y="24">녹음 ${U.clock(s)} 가운데 말한 시간과 멈춘 시간</text><rect x="10" y="40" width="600" height="34" rx="5" class="pc-pause"/><rect x="10" y="40" width="${(600*(s-p)/s).toFixed(1)}" height="34" rx="5" class="pc-talk"/><text x="18" y="62" class="pc-in">말함 ${s-p}초</text><text x="604" y="96" text-anchor="end">멈춤 ${p}초 (${Math.round(share*100)}%)</text><text x="10" y="132">1분당 낱말: 녹음 전체 ${rate.toFixed(1)} · 말한 구간만 ${flow.toFixed(1)}</text></svg>`;
  out.innerHTML=`${w}낱말을 ${s}초에 말했으니 <b>1분에 ${rate.toFixed(1)}낱말</b>입니다. 멈춘 ${p}초를 빼면 말한 구간의 속도는 1분에 ${flow.toFixed(1)}낱말이고, 녹음의 ${Math.round(share*100)}%가 멈춘 시간입니다. 같은 속도로 목표 ${U.clock(target)}를 채우려면 약 <b>${need}낱말</b>이 필요합니다. 15문항을 모두 ${U.clock(target)}씩 답하고 질문마다 20초를 듣는다고 하면 ${U.clock(fifteen)}로, 40분의 ${Math.round(fifteen/T.TEST_SECONDS*100)}%입니다.${U.kind('real')}`;
 });
 return ()=>clearInterval(tick);
};

/* 11장: 민서의 첫 주 답과 고친 답을 2·4·6·7·8·10장의 계산으로 진단하고, 이 책의 규칙으로 고칠 곳 하나를 고른다. */
const FIX={length:'답이 1분보다 짧습니다. 4장의 네 덩어리 가운데 빠진 덩어리를 채워 길이를 늘립니다.',link:'연결어가 3개보다 적습니다. because·so·when·after that으로 문장을 이어 문단으로 만듭니다(2·4장).',past:'경험 질문인데 과거 시간틀 표시가 3개보다 적습니다. 동사를 과거형으로 맞춥니다(6장).',frames:'비교 질문인데 시간틀이 하나뿐입니다. used to·back then으로 과거를, will로 앞으로를 더합니다(7장).',ask:'롤플레이에서 물어야 할 것을 “I want to know”로만 말했습니다. 의문문 세 개로 바꿉니다(8장).',keep:'이 책의 다섯 점검을 모두 넘었습니다. 다음 녹음에서는 정확성(관사, 동사 형태)과 발음을 녹음으로 다시 들어 봅니다.'};
L.diagnose=el=>{
 U.setup(el,U.select('dg-answer','민서의 답',S.ANSWERS.map(a=>[a.id,a.q]),'home')+U.select('dg-version','녹음',[['before','첫 주 녹음'],['after','책을 마친 뒤 다시 녹음']],'before'));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 U.bind(el,()=>{
  const a=S.ANSWERS.find(x=>x.id===el.querySelector('#dg-answer').value),v=a[el.querySelector('#dg-version').value],d=T.diagnose(v.text,v.seconds,a.target);
  const q=T.questionsCheck(T.sentenceLines(v.text)).questions,past=T.timeFrames(v.text).past;
  const checks=[['길이 60초 이상',`${v.seconds}초`,v.seconds>=60],['연결어 3개 이상',`${d.connectors}개`,d.connectors>=3],['경험 질문: 과거 표시 3개 이상',a.target==='past'?`${past}개`:'해당 없음',a.target!=='past'||past>=3],['비교 질문: 시간틀 2개 이상',a.target==='compare'?`${d.frames.length}개`:'해당 없음',a.target!=='compare'||d.frames.length>=2],['롤플레이: 질문 3개 이상',a.target==='roleplay'?`${q}개`:'해당 없음',a.target!=='roleplay'||q>=3]];
  chart.innerHTML=U.table(['이 책의 점검','이 답','판정'],checks.map(([n,val,ok])=>[n,val,ok?'✓ 넘음':'✕ 고칠 곳'])) + `<p class="answer-text" lang="en">${U.esc(v.text)}</p>`;
  out.innerHTML=`${v.seconds}초, 낱말 ${d.words}개(1분에 ${d.rate.toFixed(1)}낱말), 문장 ${d.sentences}개, 연결어 ${d.connectors}개, 시간틀 ${d.frames.length}개, 글 모양 어림 <b>${d.name}</b>. 고칠 곳(점검 순서대로 첫 번째): <b>${FIX[d.fix]}</b>${U.kind('real','rule','story')}`;
 });
};
})();
