/* 4~8장 실험: 묘사 답 짜기, 습관 문장 잇기, 경험 이야기 순서와 시제, 비교의 시간틀, 롤플레이 질문과 대안. */
(function(){
'use strict';
const L=OLabs,U=OUI,T=OText,S=OSamples;
const FRAME_KO={past:'과거',present:'현재',future:'미래'};
const quote=t=>`<p class="answer-text" lang="en">${U.esc(t)||'(아직 문장이 없습니다)'}</p>`;

/* 4장: 문장 은행에서 네 덩어리를 골라 답을 짜고, 말하기 속도로 답 길이를 계산한다. */
L.builder=el=>{
 const B=S.BANK,p=S.BANK_PRESETS.start,opt=k=>B[k].map(([,n],i)=>[i,n]);
 U.setup(el,U.select('bd-open','도입',opt('open'),p[0])+U.select('bd-d1','세부 1',opt('detail'),p[1])+U.select('bd-d2','세부 2',opt('detail'),p[2])+U.select('bd-ex','예·이야기',opt('example'),p[3])+U.select('bd-close','마무리',opt('close'),p[4])+U.range('bd-rate','말하기 속도(낱말/분)',40,140,5,60,'민서의 첫 주 녹음은 녹음 전체로 1분에 43.5낱말, 멈춘 시간을 빼면 56.1낱말입니다(10장).'));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 U.bind(el,()=>{
  const pick=['bd-open','bd-d1','bd-d2','bd-ex','bd-close'].map(id=>+el.querySelector('#'+id).value),rate=+el.querySelector('#bd-rate').value;
  const parts=T.bankParts(B,pick),st=T.structure(parts,rate),text=T.partsText(parts),c=T.connectorsIn(text);
  chart.innerHTML=U.blocksBar(st.rows,{scale:Math.max(90,Math.ceil(st.seconds/30)*30),label:`말하기 속도 ${rate}낱말/분으로 말한 답`})+quote(text);
  out.innerHTML=`낱말 <b>${st.words}개</b>, 1분에 ${rate}낱말로 말하면 <b>${Math.round(st.seconds)}초</b>입니다. 덩어리별 낱말: ${st.rows.map(r=>`${r.name} ${r.words}`).join(' · ')}. ${st.complete?'✓ 네 덩어리가 모두 있습니다.':`✗ 빠진 덩어리: ${st.missing.join(', ')}.`} 연결어 ${c.length}개${c.length?`(${c.join(', ')})`:''}.${U.kind('real','story')}`;
 });
};

/* 5장: 주말 아침 일과를 골라 빈도 표현과 순서 표현으로 잇는다. */
L.routine=el=>{
 U.setup(el,S.ROUTINE.map(([k,v],i)=>U.check('rt-'+k,`<span lang="en">${v}</span>`,i<3)).join('')+U.select('rt-adv','빈도 표현',[['','(넣지 않음)'],['usually','usually'],['often','often'],['sometimes','sometimes'],['always','always']],'')+U.check('rt-seq','순서 표현(Then, After that, Finally) 넣기'));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 U.bind(el,()=>{
  const keys=S.ROUTINE.map(([k])=>k).filter(k=>el.querySelector('#rt-'+k).checked),adv=el.querySelector('#rt-adv').value,seq=el.querySelector('#rt-seq').checked;
  const text=T.routineText(S.ROUTINE,keys,adv,seq),s=T.shape(text),c=T.connectorsIn(text),f=T.timeFrames(text);
  const steps=S.ROUTINE.filter(([k])=>keys.includes(k));
  chart.innerHTML=`<svg viewBox="0 0 620 120" role="img" aria-label="고른 일과 ${steps.length}개를 차례로 놓은 시간 줄">${steps.map(([,v],i)=>{const x=14+i*(592/Math.max(steps.length,1));return `<circle cx="${x+10}" cy="50" r="8" class="rt-dot"/><text x="${x}" y="${80+(i%2)*24}" class="rt-t" lang="en">${i+1}. ${U.esc(v)}</text>${i?`<text x="${x}" y="30" class="rt-seq">${seq?U.esc(T.SEQ[i===steps.length-1?4:(i-1)%3+1].replace(',','')):''}</text>`:''}`;}).join('')}<line x1="20" y1="50" x2="604" y2="50" class="rt-line"/></svg>`+quote(text);
  out.innerHTML=`일과 ${steps.length}개, 낱말 ${s.words}개, 문장 ${s.sentences}개. 연결어 <b>${c.length}개</b>${c.length?`(${c.join(', ')})`:''}, 현재 시간틀 표시 ${f.present}개${adv?`(빈도 표현 ${adv} 포함)`:''}. 글 모양 어림: <b>${s.name}</b>. 1분에 60낱말로 말하면 ${Math.round(T.secondsFor(s.words,60))}초입니다.${U.kind('real','rule')}`;
 });
};

/* 6장: 제주 여행 이야기의 다섯 조각을 칸에 놓고 현재형·과거형을 바꾼다. */
L.story=el=>{
 const opts=S.STORY.map(([r],i)=>[i,`조각 ${String.fromCharCode(65+i)} · ${r}`]),start=[1,0,3,2,4];
 U.setup(el,start.map((v,i)=>U.select('st-'+i,`${i+1}번째로 말할 조각`,opts,v)).join('')+U.check('st-past','동사를 과거형으로 말하기'));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout'),ROLES=['배경','사건','문제','해결','느낌'];
 U.bind(el,()=>{
  const order=[0,1,2,3,4].map(i=>+el.querySelector('#st-'+i).value),past=el.querySelector('#st-past').checked;
  const text=T.storyText(S.STORY,order,past),f=T.timeFrames(text),c=T.connectorsIn(text),ok=T.storyInOrder(order),dup=new Set(order).size<5;
  chart.innerHTML=`<svg viewBox="0 0 620 120" role="img" aria-label="다섯 칸에 놓인 조각: ${order.map(i=>ROLES[i]).join(', ')}">${order.map((v,i)=>`<rect x="${10+i*122}" y="30" width="112" height="52" rx="6" class="${v===i?'st-ok':'st-off'}"/><text x="${66+i*122}" y="54" text-anchor="middle">${ROLES[v]}</text><text x="${66+i*122}" y="73" text-anchor="middle" class="st-mark">${v===i?'✓':'✕'} ${i+1}번째</text>`).join('')}<text x="10" y="20">기대하는 순서: 배경 → 사건 → 문제 → 해결 → 느낌</text></svg>`+quote(text);
  out.innerHTML=`${dup?'✗ 같은 조각이 두 칸에 들어 있습니다. ':''}순서: <b>${ok?'배경 → 사건 → 문제 → 해결 → 느낌 ✓':'기대하는 순서와 다릅니다 ✕'}</b>. 과거 시간틀 표시 <b>${f.past}개</b>, 현재 시간틀 표시 ${f.present}개, 연결어 ${c.length}개. ${past?'':'과거에 일어난 일을 현재형으로 말하면, 맨 앞의 Last spring 말고는 언제 일어난 일인지 동사로 알 수 없습니다.'}${U.kind('real','rule','story')}`;
 });
};

/* 7장: 비교 축과 시간틀을 골라 문장을 엮고, 쓴 시간틀 수를 센다. */
L.compare=el=>{
 U.setup(el,U.select('cp-topic','비교할 대상',Object.entries(S.COMPARE).map(([k,v])=>[k,v.name]),'phone')+Object.entries(S.AXIS_NAMES).map(([k,n])=>U.check('cp-'+k,`축: ${n}`,k!=='problem')).join('')+U.check('cp-past','과거(used to, back then)',false)+U.check('cp-now','현재(these days, now)',true)+U.check('cp-future','미래(will, be going to)',false));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 U.bind(el,()=>{
  const topic=S.COMPARE[el.querySelector('#cp-topic').value],axes=Object.keys(S.AXIS_NAMES).filter(k=>el.querySelector('#cp-'+k).checked);
  const frames=[['cp-past',0],['cp-now',1],['cp-future',2]].filter(([id])=>el.querySelector('#'+id).checked).map(([,f])=>f);
  const text=T.compareText(topic,axes,frames),used=T.framesUsed(T.timeFrames(text)),s=T.shape(text);
  const cols=['과거','현재','미래'].map((n,f)=>`<rect x="${14+f*202}" y="34" width="190" height="${20+axes.length*26}" rx="6" class="${frames.includes(f)?'cp-on':'cp-off'}"/><text x="${109+f*202}" y="26" text-anchor="middle">${n}</text>${axes.map((a,j)=>`<text x="${24+f*202}" y="${56+j*26}" class="cp-t">${frames.includes(f)?'● ':'○ '}${S.AXIS_NAMES[a]}</text>`).join('')}`).join('');
  chart.innerHTML=`<svg viewBox="0 0 620 ${60+axes.length*26}" role="img" aria-label="${topic.name} 비교: 축 ${axes.length}개, 고른 시간틀 ${frames.length}개">${cols}</svg>`+quote(text);
  out.innerHTML=`${topic.name} 비교, 축 ${axes.length}개 × 시간틀 ${frames.length}개 = 문장 ${axes.length*frames.length}개. 글에서 센 시간틀: <b>${used.length}개</b>${used.length?`(${used.map(k=>FRAME_KO[k]).join('·')})`:''}. 낱말 ${s.words}개, 글 모양 어림 <b>${s.name}</b>.${U.kind('real','rule','story')}`;
 });
};

/* 8장: 롤플레이 대사를 골라 질문 수·의문사 종류·공손한 표현·대안 수를 센다. */
L.roleplay=el=>{
 U.setup(el,U.select('rp-sit','상황',Object.entries(S.ROLEPLAY).map(([k,v])=>[k,v.name]),'ask')+Array.from({length:8},(_,i)=>U.check('rp-'+i,'',i===0||i===6||i===7)).join(''));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout'),sit=el.querySelector('#rp-sit');
 const label=()=>{const lines=S.ROLEPLAY[sit.value].lines;for(let i=0;i<8;i++){const box=el.querySelector('#rp-'+i),row=box.closest('label');row.hidden=i>=lines.length;row.querySelector('span').textContent=lines[i]||'';row.querySelector('span').lang='en';if(i>=lines.length)box.checked=false;}};
 sit.addEventListener('input',e=>{if(e.isTrusted)for(let i=0;i<8;i++)el.querySelector('#rp-'+i).checked=i===0;label();});
 sit.addEventListener('change',label);label();
 U.bind(el,()=>{
  const key=sit.value,lines=S.ROLEPLAY[key].lines,chosen=lines.filter((_,i)=>el.querySelector('#rp-'+i).checked);
  const q=T.questionsCheck(chosen),alt=T.alternatives(chosen.join(' ')),problem=chosen.some(l=>/\b(sorry|have to|can't|cannot)\b/i.test(l));
  const goal=key==='ask'?(q.questions>=3&&q.kinds.length>=2):(problem&&alt>=2);
  chart.innerHTML=`<svg viewBox="0 0 620 ${24+chosen.length*38}" role="img" aria-label="고른 대사 ${chosen.length}개 가운데 질문 ${q.questions}개, 대안 ${alt}개">${chosen.map((l,i)=>{const isQ=/\?\s*$/.test(l);return `<rect x="${isQ?40:10}" y="${12+i*38}" width="${isQ?570:570}" height="30" rx="15" class="${isQ?'rp-q':'rp-s'}"/><text x="${(isQ?54:24)}" y="${32+i*38}" class="rp-t" lang="en">${isQ?'? ':''}${U.esc(l.length>64?l.slice(0,62)+'…':l)}</text>`;}).join('')}</svg>`;
  const need=key==='ask'?'목표: 서로 다른 질문 3개 이상, 질문 종류 2가지 이상':'목표: 문제를 한 문장으로 말하고 대안 2개 이상';
  out.innerHTML=`대사 ${chosen.length}개 가운데 질문 <b>${q.questions}개</b>(종류: ${q.kinds.join(', ')||'없음'}), 공손하게 여는 질문 ${q.polite}개, 대안을 내는 문장 <b>${alt}개</b>${key==='solve'?`, 문제를 말한 문장 ${problem?'있음':'없음'}`:''}. ${need} → ${goal?'✓ 채웠습니다.':'✗ 아직 모자랍니다.'}${U.kind('real','rule','story')}`;
 });
};
})();
