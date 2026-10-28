/* 1·2장 실험: 낱말의 음절 수, 문장의 내용어 강세. 계산은 EModel(js/english.js), 소리는 ESpeak가 맡는다. */
(function(L,U,M,S){
'use strict';
L.syllable=el=>{
 U.setup(el,U.select('sy-word','낱말 고르기',M.WORDS.map(w=>[w.en,`${w.en} · ${w.ko}`]),'coffee')+U.range('sy-rate','읽는 속도 (1 = 보통)',0.5,1.5,0.1,0.9,'브라우저 목소리의 속도 값입니다. 1이 그 목소리의 보통 속도입니다.')+S.button('sy-play'));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 const draw=()=>{
  const r=M.syllables(el.querySelector('#sy-word').value),ko=[...r.ko];
  chart.innerHTML=`<p class="caption">한글 표기 ${r.ko_count}음절</p><div class="ew-chips">${ko.map(c=>`<span class="ew-chip">${U.esc(c)}</span>`).join('')}</div><p class="caption">영어 ${r.en_count}음절 (굵은 칸이 강세 음절)</p><div class="ew-chips">${r.parts.map((p,i)=>`<span class="ew-chip"${i===r.stress?' aria-pressed="true"':''}>${U.esc(p)}${i===r.stress?' ●':''}</span>`).join('')}</div>${U.bars(['한글 표기 음절 수','영어 음절 수'],[r.ko_count,r.en_count])}`;
  out.innerHTML=`<b>${U.esc(r.en)}</b>: 한글 표기(${U.esc(r.ko)})는 <b>${r.ko_count}음절</b>, 영어 사전 표기는 <b>${r.en_count}음절</b>입니다. ${r.extra>0?`한글대로 말하면 <strong>${r.extra}박자</strong>가 늘어납니다.`:'음절 수는 같습니다.'} 강세는 ${r.stress+1}번째 음절 <b>${U.esc(r.parts[r.stress])}</b>에 옵니다(●).${U.kind('real','한글 음절 수는 화면이 셉니다.')} <span class="kind-tag">${U.KINDS.preset}</span> 영어 음절 수와 강세 자리는 사전 표기를 옮긴 값입니다.${r.note?` ${U.esc(r.note)}`:''}`;
 };
 U.bind(el,draw);
 el.querySelector('#sy-play').onclick=()=>S.say(el.querySelector('#sy-word').value,+el.querySelector('#sy-rate').value);
};
const SENTENCES=['Can you send me the file?','I want to go to the station.','Sam is from Singapore.','I usually have lunch at noon.','Where do you work?'];
L.stress=el=>{
 U.setup(el,U.select('st-sent','문장 고르기',SENTENCES.map(s=>[s,s]),SENTENCES[0])+U.check('st-show','이 책의 규칙이 고른 낱말 보기(점선)')+U.range('st-rate','읽는 속도',0.6,1.4,0.1,0.9)+S.button('st-play')+'<p class="hint">오른쪽 낱말을 눌러 세게 말할 낱말을 고르세요. 다시 누르면 취소됩니다.</p>');
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');let picked=new Set(),last='';
 const draw=()=>{
  const sent=el.querySelector('#st-sent').value,show=el.querySelector('#st-show').checked;
  if(sent!==last){picked=new Set();last=sent;}
  const r=M.stressScore(sent,[...picked]);
  chart.innerHTML=`<div class="ew-chips" role="group" aria-label="세게 말할 낱말 고르기">${r.words.map((w,i)=>`<button type="button" class="ew-chip${show&&r.content[i]?' ew-model':''}" data-w="${i}" aria-pressed="${picked.has(i)}">${U.esc(w)}</button>`).join('')}</div><div class="ew-beats" aria-hidden="true">${r.words.map((w,i)=>`<i class="${r.content[i]?'':'ew-weak'}" style="height:${r.content[i]?56:22}px"></i>`).join('')}</div><p class="caption">막대가 높은 낱말이 규칙상 세게 말하는 내용어입니다.</p>`;
  const words=r.words.map((w,i)=>r.content[i]?`<span class="ew-big">${U.esc(w.toUpperCase())}</span>`:`<span class="ew-small">${U.esc(w)}</span>`).join(' ');
  out.innerHTML=`<div class="ew-sent">${words}</div>낱말 ${r.words.length}개 가운데 규칙상 내용어는 <b>${r.beats}개</b>, 기능어는 ${r.weak}개입니다. 고른 낱말: 맞힌 내용어 <b>${r.hit}</b> · 빠뜨린 내용어 ${r.miss} · 기능어를 고른 것 ${r.extra}.${U.kind('real','기능어 목록으로 내용어를 가립니다.')} 대조하는 말에서는 강세가 옮겨 갈 수 있습니다.`;
 };
 U.bind(el,draw);
 el.querySelector('.chart').addEventListener('click',e=>{const b=e.target.closest('[data-w]');if(!b)return;const i=+b.dataset.w;picked.has(i)?picked.delete(i):picked.add(i);draw();el.querySelector(`[data-w="${i}"]`)?.focus();});
 el.querySelector('#st-play').onclick=()=>S.say(el.querySelector('#st-sent').value,+el.querySelector('#st-rate').value);
};
})(window.ELabs,window.EUI,window.EModel,window.ESpeak);
