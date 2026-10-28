/* 6~9장 실험: 대화 이어 가기 시나리오, 공손함 단계, 되묻기, 받아쓰기 낱말 오류율. */
(function(L,U,M,S){
'use strict';
const KIND_OPTS=[['short','짧은 대답만'],['info','정보 한 문장 더하기'],['ask','정보 + 되묻기']];
L.followup=el=>{
 U.setup(el,M.TOPICS.map((t,i)=>U.select(`fo-${i}`,`화제 ${i+1} · ${t.q}`,KIND_OPTS,'short')).join(''));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 U.bind(el,()=>{
  const choices=M.TOPICS.map((_,i)=>el.querySelector(`#fo-${i}`).value),r=M.talk(choices);
  chart.innerHTML=U.talk(r.lines);
  out.innerHTML=`세 화제에서 지우가 남긴 이어 갈 거리는 <b>${r.hooks}개</b>, 대화가 끊긴 곳은 <b>${r.gaps}번</b>, 지우가 Sam에게 되물은 질문은 ${r.asked}개입니다. 말차례는 멈춤을 빼고 ${r.turns}번 오갔습니다.${r.gaps?' 짧은 대답 뒤에는 Sam이 새 화제를 찾아야 했습니다.':' 모든 화제에서 Sam이 지우의 말을 이어 받았습니다.'}${U.kind('preset','Sam의 반응은 정해 둔 시나리오입니다.')} 이어 갈 거리는 이 책의 셈법(정보 1 + 되묻기 1)입니다.`;
 });
};
const TASK_OPTS=[['way','역 가는 길을 알려 달라'],['file','파일을 보내 달라'],['meeting','회의를 금요일로 옮겨 달라']];
L.requests=el=>{
 U.setup(el,U.range('rq-d','상대와의 거리 (0 친구 · 1 동료 · 2 처음 보는 사람)',0,2,1,0)+U.range('rq-p','상대의 힘 (0 같음 · 1 조금 위 · 2 상사나 고객)',0,2,1,0)+U.range('rq-r','부탁의 부담 (0 작음 · 2 큼)',0,2,1,0)+U.select('rq-task','부탁할 일',TASK_OPTS,'way'));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 U.bind(el,()=>{
  const [d,p,r]=['d','p','r'].map(k=>+el.querySelector('#rq-'+k).value),task=el.querySelector('#rq-task').value,x=M.politeness(d,p,r,task);
  chart.innerHTML=`<div class="cbars">${M.LEVELS.map((l,i)=>`<div class="cbar"><div><b>${i+1}단계 · ${U.esc(l)}${i===x.level?' ◀ 고른 틀':''}</b><span>${['0~1','2~3','4~5','6'][i]}점</span></div><div class="cbar-track"><i style="width:${(i+1)*25}%"${i===x.level?' class="on"':''}></i></div></div>`).join('')}</div>`;
  out.innerHTML=`<div class="ew-sent">${U.esc(x.text)}</div>공손 점수는 거리 ${d} + 힘 ${p} + 부담 ${r} = <b>${x.sum}점</b>이라 <b>${x.level+1}단계(${U.esc(x.frame)})</b>를 고릅니다.${x.level===2?' Would you mind 뒤에는 동사의 -ing 형태가 옵니다.':''}${U.kind('preset','점수와 단계 문턱은 이 책이 정한 학습용 규칙입니다.')} 실제 대화에서는 말투와 상황도 함께 작용합니다.`;
 });
};
const MISS=[['all','전부 놓쳤다'],['speed','너무 빨랐다'],['word','한 낱말만 놓쳤다'],['meaning','낱말은 들었지만 뜻이 확실하지 않다']];
L.repair=el=>{
 U.setup(el,U.select('rp-line','Sam의 말',M.SAM_LINES.map((l,i)=>[i,`${i+1}번 문장`]),0)+U.range('rp-rate','읽는 속도 (1 = 보통)',0.6,1.4,0.1,1.2)+S.button('rp-play','Sam의 말 듣기')+U.select('rp-miss','무엇을 놓쳤나요?',MISS,'all')+U.check('rp-show','Sam의 말을 글로 보기'));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');let measured=null;
 const draw=()=>{
  const i=+el.querySelector('#rp-line').value,line=M.SAM_LINES[i],kind=el.querySelector('#rp-miss').value,show=el.querySelector('#rp-show').checked,r=M.repair(kind,i);
  chart.innerHTML=U.talk([['Sam',show?line.text:'(소리로만 들었습니다. 글로 보려면 왼쪽 상자를 켜세요.)'],['지우',r.phrase]]);
  const time=measured&&measured.line===i?` 방금 이 기기의 목소리가 속도 ${measured.rate} 설정으로 읽는 데 <b>${measured.sec.toFixed(1)}초</b>가 걸렸습니다(분당 약 ${M.wpmOf(line.text,measured.sec)}낱말).${U.kind('measure')}`:'';
  out.innerHTML=`<div class="ew-sent">${U.esc(r.phrase)}</div>${U.esc(r.why)}${U.kind('preset','되묻기 표현은 놓친 종류별로 미리 정했습니다.')}${time}`;
 };
 U.bind(el,()=>{measured=null;draw();});
 el.querySelector('#rp-play').onclick=()=>{const i=+el.querySelector('#rp-line').value,rate=+el.querySelector('#rp-rate').value;S.say(M.SAM_LINES[i].text,rate,sec=>{if(sec){measured={line:i,rate,sec};draw();}});};
};
L.linking=el=>{
 U.setup(el,U.select('li-sent','들을 문장',M.LINKED.map((s,i)=>[i,`${i+1}번 문장`]),0)+U.range('li-rate','읽는 속도 (1 = 보통)',0.7,1.2,0.1,1)+S.button('li-play','문장 듣기')+U.text('li-typed','들은 대로 적기','', '대소문자와 문장부호는 무시합니다.')+U.check('li-hint','원래 문장과 이어진 소리 보기'));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 U.bind(el,()=>{
  const s=M.LINKED[+el.querySelector('#li-sent').value],typed=el.querySelector('#li-typed').value,hint=el.querySelector('#li-hint').checked;
  const w=M.wer(s.text,typed),ref=M.norm(s.text),hyp=M.norm(typed);
  chart.innerHTML=(hint?`<div class="ew-sent">${U.esc(s.text)}<br><span class="ew-small">이어진 소리: ${U.esc(s.heard)}</span></div><p class="caption">${U.esc(s.note)}</p>`:'<p class="caption">원래 문장은 숨겨 두었습니다. 듣고 적은 뒤 왼쪽 상자를 켜서 견주세요.</p>')+U.bars(['원래 문장 낱말 수','적은 낱말 수','오류 수'],[w.n,hyp.length,w.errors]);
  out.innerHTML=typed.trim()?`원래 문장 ${w.n}낱말 가운데 오류(바뀜·빠짐·더함) <b>${w.errors}개</b>, 낱말 오류율은 <b>${Math.round(w.rate*100)}%</b>입니다.${hint?` 원래 낱말: ${ref.map(U.esc).join(' · ')}`:''}${U.kind('real','편집 거리로 낱말을 맞춥니다.')}`:`아직 적은 글이 없습니다. 문장을 듣고 들은 대로 적어 보세요. 지금은 원래 문장 ${w.n}낱말이 모두 빠진 것으로 세어 오류율 100%입니다.${U.kind('real')}`;
 });
 el.querySelector('#li-play').onclick=()=>S.say(M.LINKED[+el.querySelector('#li-sent').value].text,+el.querySelector('#li-rate').value);
};
})(window.ELabs,window.EUI,window.EModel,window.ESpeak);
