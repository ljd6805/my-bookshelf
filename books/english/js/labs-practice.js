/* 10장과 마지막 과제 실험: 말하기 속도와 군말 세기, 지우의 첫 점심 대화 복기. */
(function(L,U,M){
'use strict';
L.fluency=el=>{
 U.setup(el,U.text('fl-text','말한 내용 (받아 적은 글)',M.INTRO.after,'녹음을 들으며 군말(um·uh)까지 그대로 적습니다.',true)+U.range('fl-sec','걸린 시간 (초)',5,120,1,25)+'<div class="buttons"><button type="button" id="fl-timer">⏱ 초시계 시작</button></div><small class="hint" id="fl-timer-note">초시계를 누르고 말한 뒤 다시 누르면 걸린 초가 위 칸에 들어갑니다.</small>');
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 U.bind(el,()=>{
  const text=el.querySelector('#fl-text').value,sec=+el.querySelector('#fl-sec').value,r=M.fluency(text,sec);
  chart.innerHTML=U.bars(['군말을 뺀 낱말 수','군말 수','분당 낱말 수','분당 군말'],[r.words,r.fillers,r.wpm,r.fillerPerMin]);
  out.innerHTML=r.total?`${sec}초 동안 모두 ${r.total}낱말을 말했고, 그 가운데 군말이 <b>${r.fillers}개</b>입니다. 군말을 뺀 ${r.words}낱말 ÷ ${(sec/60).toFixed(2)}분 = <b>분당 ${r.wpm}낱말</b>, 분당 군말은 ${r.fillerPerMin}개입니다.${U.kind('real','셈은 화면이 하고, 걸린 시간은 직접 잰 값입니다.')} 이 숫자는 고치기 전과 후를 견주는 데 씁니다. 문장이 맞는지는 따로 확인하세요.`:'아직 적은 말이 없습니다.';
 });
 let start=0;const btn=el.querySelector('#fl-timer');
 btn.onclick=()=>{
  if(!start){start=Date.now();btn.textContent='⏹ 초시계 멈추기';btn.setAttribute('aria-pressed','true');return;}
  const sec=Math.max(5,Math.min(120,Math.round((Date.now()-start)/1000))),x=el.querySelector('#fl-sec');start=0;
  btn.textContent='⏱ 초시계 시작';btn.removeAttribute('aria-pressed');x.value=sec;x.dispatchEvent(new Event('input',{bubbles:true}));
  el.querySelector('#fl-timer-note').textContent=`방금 잰 시간 ${sec}초를 넣었습니다(5~120초 범위로 맞춤).`;
 };
};
const MOMENT_OPTS=[['A','A · 주말을 묻는 질문에 “Yes.”'],['B','B · 어제 한 일 “Yesterday I go …”'],['C','C · 경복궁 질문에 “Yes.”']];
const TOOL={followup:'6장 이어 갈 거리',time:'5장 시간 표지와 시제',repair:'8장 되묻기'};
const UNKNOWN={A:'Sam이 등산 이야기를 이어 물을지는 이 기록으로 알 수 없습니다.',B:'고친 문장을 지우가 실제로 막힘없이 말할 수 있는지는 녹음해 봐야 압니다.',C:'Sam이 다시 말해 준 뒤 지우가 알아들을지는 이 기록으로 알 수 없습니다.'};
L.review=el=>{
 U.setup(el,U.select('rv-moment','복기할 순간',MOMENT_OPTS,'A')+U.select('rv-cand','고친 말 후보',[[0,'후보 1'],[1,'후보 2'],[2,'후보 3']],0)+'<div class="rv-cands"></div>');
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 U.bind(el,()=>{
  const m=el.querySelector('#rv-moment').value,i=+el.querySelector('#rv-cand').value,mo=M.MOMENTS[m],r=M.review(m,i),st=M.lunchStats();
  const at=M.LUNCH.findIndex(l=>l[2]===m),lines=M.LUNCH.map(l=>[l[0],l[1]]);
  el.querySelector('.rv-cands').innerHTML=`<ol class="caption">${mo.cands.map((c,k)=>`<li${k===i?' aria-current="true"':''}>${U.esc(c)}${k===i?' ◀':''}</li>`).join('')}</ol>`;
  chart.innerHTML=`<p class="caption">말차례 ${st.turns} · 지우 ${st.jiwooTurns}번 ${st.jiwooWords}낱말 · 지우의 질문 ${st.jiwooQuestions} · 멈춤 ${st.gaps}번</p>${U.talk(lines,{mark:at})}`;
  out.innerHTML=`${r.ok?'<span class="ew-ok">✓ 대화를 잇는 말</span>':'<span class="ew-no">✗ 대화가 멈추는 말</span>'} <b>${U.esc(r.text)}</b><br>쓴 도구: ${TOOL[r.tool]} · 판정: ${U.esc(r.detail)}${U.kind(r.tool==='repair'?'preset':'real',r.tool==='repair'?'되묻기 판정은 미리 정했습니다.':'js/english.js의 규칙으로 판정합니다.')}<br><b>복기 한 줄</b>: ${m} · ${U.esc(mo.cands[0])} → ${U.esc(r.text)} · ${TOOL[r.tool]} · ${UNKNOWN[m]}${U.kind('story','대화 기록은 이 책이 지어낸 것입니다.')}`;
 });
};
})(window.ELabs,window.EUI,window.EModel);
