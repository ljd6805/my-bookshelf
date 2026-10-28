/* 1~3장 실험: 시험 시간 나누기, 답의 글 모양 어림, 배경 설문 묶기. 계산은 js/opic.js(OText), 자료는 js/samples.js(OSamples). */
(function(){
'use strict';
const L=OLabs,U=OUI,T=OText,S=OSamples;

/* 1장: 자기 평가 단계·질문 듣는 시간·다시 듣기에 따라 문항 수와 문항당 말할 시간을 계산한다. */
L.plan=el=>{
 U.setup(el,U.range('pl-level','자기 평가 단계',1,6,1,4,'1~2단계는 12문항, 3~6단계는 15문항(국내 시험 안내 기준)')+U.range('pl-listen','질문 하나를 듣는 시간(초)',10,40,5,20,'이 책의 가정값입니다. 실제 질문 길이는 문항마다 다릅니다.')+U.check('pl-replay','매번 다시 듣기를 한 번 쓴다'));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 U.bind(el,()=>{
  const level=+el.querySelector('#pl-level').value,listen=+el.querySelector('#pl-listen').value,replay=el.querySelector('#pl-replay').checked;
  const p=T.plan(level,listen,replay),groups=T.layout(level),w=600/15;
  const boxes=groups.flatMap((g,k)=>Array.from({length:g.count},(_,j)=>{const n=g.from+j,x=10+(n-1)*w;return `<rect x="${x.toFixed(1)}" y="40" width="${(w-4).toFixed(1)}" height="46" rx="4" class="pl-g${k}"/><text x="${(x+w/2-2).toFixed(1)}" y="68" text-anchor="middle">${n}</text>`;})).join('');
  const names=groups.map((g,k)=>{const x=10+(g.from-1)*w;return `<text x="${(x+2).toFixed(1)}" y="${k%2?130:106}" class="pl-name">${g.name}</text>`;}).join('');
  const speakW=p.speakTotal/T.TEST_SECONDS*600;
  chart.innerHTML=`<svg viewBox="0 0 620 190" role="img" aria-label="${p.questions}문항의 묶음과 40분 가운데 듣는 시간 ${U.clock(p.listenTotal)}, 말할 시간 ${U.clock(p.speakTotal)}">${boxes}${names}<text x="10" y="26">문항 ${p.questions}개 · 흔한 묶음(시험마다 다를 수 있음)</text><rect x="10" y="140" width="600" height="26" rx="4" class="pl-listen"/><rect x="10" y="140" width="${speakW.toFixed(1)}" height="26" rx="4" class="pl-speak"/><text x="16" y="158" class="pl-in">말할 시간 ${U.clock(p.speakTotal)}</text><text x="604" y="182" text-anchor="end">듣는 시간 ${U.clock(p.listenTotal)} · 모두 40분</text></svg>`;
  out.innerHTML=`자기 평가 ${level}단계 → <b>${p.questions}문항</b>. 질문 하나를 듣는 데 ${p.listenEach}초${replay?'(다시 듣기 포함)':''}가 들면, 40분에서 듣는 시간 ${U.clock(p.listenTotal)}을 빼고 남는 말할 시간은 ${U.clock(p.speakTotal)}입니다. 문항당 평균 <b>${Math.round(p.speakEach)}초</b>(${U.clock(p.speakEach)})를 말할 수 있습니다. 듣는 시간을 빼지 않으면 문항당 ${Math.round(p.perQuestion)}초입니다.${U.kind('real','source')}`;
 });
};

/* 2장: 표본 답이나 직접 쓴 답의 낱말·문장·연결어·시간틀을 세어 글 모양을 어림한다. */
L.shape=el=>{
 U.setup(el,U.select('sh-sample','답 고르기',[...S.PARK.map(p=>[p.id,p.name]),['mine','직접 쓰기(아래 칸을 고칩니다)']],'p2')+U.area('sh-text','답 대본 (영어)',S.PARK[1].text,'문장 끝에 . ! ? 를 찍으면 문장 수가 정확해집니다.'));
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout'),pick=el.querySelector('#sh-sample'),box=el.querySelector('#sh-text');
 const fill=()=>{const p=S.PARK.find(x=>x.id===pick.value);if(p)box.value=p.text;};
 pick.addEventListener('input',fill);pick.addEventListener('change',fill);
 box.addEventListener('input',e=>{if(e.isTrusted&&pick.value!=='mine')pick.value='mine';});
 U.bind(el,()=>{
  const s=T.shape(box.value),c=T.connectorsIn(box.value),f=T.framesUsed(T.timeFrames(box.value));
  const steps=T.SHAPES.map((n,i)=>`<rect x="${20+i*148}" y="${150-i*34}" width="140" height="${30+i*34}" rx="4" class="${i===s.level?'sh-on':'sh-off'}"/><text x="${90+i*148}" y="${172-i*34}" text-anchor="middle" class="${i===s.level?'sh-on-t':''}">${n}${i===s.level?' ◀':''}</text>`).join('');
  chart.innerHTML=`<svg viewBox="0 0 620 220" role="img" aria-label="글 모양 어림: ${s.name}. 문장 ${s.sentences}개, 연결어 ${s.connectors}개, 시간틀 ${s.frames}개">${steps}<text x="20" y="24">낱말 ${s.words} · 문장 ${s.sentences} · 문장당 낱말 ${s.avgWords.toFixed(1)} · 연결어 ${s.connectors} · 시간틀 ${s.frames}</text></svg>`;
  const nextNeed=[['문장 2개 이상, 문장당 평균 3낱말 이상',s.sentences>=2&&s.avgWords>=3],['문장 4개 이상, 연결어 2개 이상',s.sentences>=4&&s.connectors>=2],['문장 6개 이상, 연결어 4개 이상, 시간틀 2개 이상',s.sentences>=6&&s.connectors>=4&&s.frames>=2]];
  const gap=s.level<3?`다음 칸(${T.SHAPES[s.level+1]})의 조건: ${nextNeed[s.level][0]}.`:'네 칸 가운데 마지막 칸입니다.';
  out.innerHTML=`글 모양 어림: <b>${s.name}</b>. 낱말 ${s.words}개, 문장 ${s.sentences}개(문장당 ${s.avgWords.toFixed(1)}낱말), 연결어 ${s.connectors}개${c.length?`(${c.join(', ')})`:''}, 시간틀 ${f.length}개${f.length?`(${f.map(k=>({past:'과거',present:'현재',future:'미래'})[k]).join('·')})`:''}. ${gap} 이 어림은 정확성·발음·질문과 맞는지를 보지 않으며 오픽 등급이 아닙니다.${U.kind('real','rule')}`;
 });
};

/* 3장: 설문 항목을 골라 준비할 이야기 묶음 수와 최소 선택 조건을 계산한다. */
L.survey=el=>{
 const groups=Object.entries(S.SECTION_NAMES).map(([sec,name])=>`<fieldset class="sv-set"><legend>${name}</legend>${S.SURVEY.filter(i=>i.section===sec).map(i=>U.check('sv-'+i.id,`${i.name} <small>(${i.story})</small>`,S.SURVEY_PRESETS.short.includes(i.id))).join('')}</fieldset>`).join('');
 U.setup(el,groups);
 const chart=el.querySelector('.chart'),out=el.querySelector('.readout');
 U.bind(el,()=>{
  const picked=S.SURVEY.filter(i=>el.querySelector('#sv-'+i.id).checked).map(i=>i.id),r=T.survey(S.SURVEY,picked);
  const groups=r.clusters.map(c=>({c,items:S.SURVEY.filter(i=>picked.includes(i.id)&&i.story===c)})),rowH=[];
  groups.forEach((g,k)=>{const row=Math.floor(k/3);rowH[row]=Math.max(rowH[row]||0,34+g.items.length*22);});
  const top=row=>40+rowH.slice(0,row).reduce((a,h)=>a+h+12,0),height=top(rowH.length)+4;
  const cols=groups.map(({c,items},k)=>{const x=10+(k%3)*204,y=top(Math.floor(k/3));return `<rect x="${x}" y="${y}" width="194" height="${rowH[Math.floor(k/3)]}" rx="6" class="sv-box"/><text x="${x+12}" y="${y+22}" class="sv-head">${c} 이야기</text>${items.map((i,j)=>`<text x="${x+12}" y="${y+46+j*22}" class="sv-item">${i.name}</text>`).join('')}`;}).join('');
  chart.innerHTML=`<svg viewBox="0 0 620 ${Math.max(height,80)}" role="img" aria-label="고른 항목 ${r.count}개가 이야기 묶음 ${r.stories}개로 모였습니다: ${r.clusters.join(', ')}"><text x="10" y="24">고른 항목 ${r.count}개 → 준비할 이야기 ${r.stories}개</text>${cols}</svg>`;
  const shortNames=r.short.map(k=>S.SECTION_NAMES[k]);
  const rule=r.valid?'✓ 최소 선택 조건을 채웠습니다.':`✗ 아직 제출할 수 없습니다${r.need?`: ${r.need}개를 더 골라야 합니다`:''}${shortNames.length?`${r.need?', ':': '}${shortNames.join('·')}에서 더 골라야 합니다`:''}.`;
  out.innerHTML=`고른 항목 <b>${r.count}개</b>(여가 ${r.bySection.leisure} · 취미 ${r.bySection.hobby} · 운동 ${r.bySection.sport} · 휴가·여행 ${r.bySection.travel}), 준비할 이야기 <b>${r.stories}개</b>: ${r.clusters.join(', ')||'없음'}. ${rule} 항목 목록과 묶음은 이 책이 실제 설문을 본떠 만든 것이고, 최소 선택 조건(여가 2·취미 1·운동 1·휴가·여행 1 이상, 모두 12개 이상)은 응시 후기 정리 기준입니다.${U.kind('real','story','source')}`;
 });
};
})();
