/* 표지의 살아 있는 실험: 낱말을 고르면 한글 표기와 영어의 음절 수를 실제로 세어 견주고, 브라우저 목소리로 읽는다. 1장 syllable 실험과 같은 계산(EModel.syllables)이다. */
window.EHome=(()=>{
function mount(el){
 const M=EModel,U=EUI,S=ESpeak,PICK=['street','Christmas','schedule','banana'];let word='street';
 el.innerHTML=`<div class="lab-top"><span>한글로 적은 대로 말하면 박자가 몇 개 늘어날까</span><span>SYLLABLES / 음절</span></div><div class="home-lab-body"><div class="buttons" role="group" aria-label="낱말 고르기">${PICK.map(w=>`<button type="button" data-word="${U.esc(w)}" aria-pressed="${w===word}">${U.esc(w)}</button>`).join('')}</div><div class="home-chart"></div>${S.button('home-play')}<div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 세나요?</summary><p>한글 표기의 음절은 화면이 글자 수를 셉니다. 영어 음절 수와 강세(●)는 영어 사전 표기를 옮긴 값입니다. 1장에서 낱말 열두 개로 다시 셉니다.</p></details>`;
 const chart=el.querySelector('.home-chart'),out=el.querySelector('.home-result');
 function update(){
  const r=M.syllables(word);
  chart.innerHTML=`<div class="ew-chips">${[...r.ko].map(c=>`<span class="ew-chip">${U.esc(c)}</span>`).join('')}</div><div class="ew-chips">${r.parts.map((p,i)=>`<span class="ew-chip"${i===r.stress?' aria-pressed="true"':''}>${U.esc(p)}${i===r.stress?' ●':''}</span>`).join('')}</div>`;
  out.innerHTML=`한글 표기(${U.esc(r.ko)}) <b>${r.ko_count}음절</b>, 영어 <b>${r.en_count}음절</b>. ${r.extra>0?`한글대로 말하면 <b>${r.extra}박자</b>가 늘어납니다.`:'박자 수는 같습니다. 영어에서는 ●표 음절을 세게 말합니다.'}`;
  el.querySelectorAll('[data-word]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.word===word)));
 }
 const click=e=>{const b=e.target.closest('[data-word]');if(b){word=b.dataset.word;update();}if(e.target.closest('#home-play'))S.say(word,0.9);};
 el.addEventListener('click',click);update();
 return ()=>{el.removeEventListener('click',click);S.stop();};
}
return {mount};
})();
