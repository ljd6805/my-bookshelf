(()=>{
'use strict';
const U=EUI,B=EBook,main=document.querySelector('main'),BOOK_TITLE='영어 회화 기초 · 기본 문장 틀로 묻고 답하며 3분 대화 이어 가기';let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측 질문은 조작 전에 읽도록 실험 위에 두며, 답은 결과 읽기에만 있다. */
const info={
 syllable:['한글 표기와 영어의 음절 수 견주기 실험','낱말을 골라 한글 표기의 음절 수와 영어 사전의 음절 수를 세고, 강세 음절을 확인한 뒤 브라우저 목소리로 발음을 들어 봅니다.','한글 표기 크리스마스는 5음절입니다. 영어 Christmas는 몇 음절이고, 한글 표기대로 말하면 박자가 몇 개 늘어날까요?','열두 낱말 가운데 한글 표기와 영어의 음절 수가 같은 낱말을 모두 찾고, 그 낱말들의 강세 음절을 적은 뒤 목소리로 들으며 따라 말해 보세요.'],
 stress:['세게 말할 내용어 고르기 실험','문장을 고르고 세게 말할 낱말을 눌러 고른 뒤, 이 책의 규칙이 고른 내용어와 견주고 목소리로 들어 봅니다.','“I usually have lunch at noon.”의 여섯 낱말 가운데 세게 말하는 낱말은 몇 개일까요?','다섯 문장마다 내용어를 먼저 고르고 규칙과 견준 뒤, 빠뜨린 내용어와 잘못 고른 기능어를 한 줄씩 적어 보세요. 그다음 내용어에서만 손뼉을 크게 치며 문장을 읽어 봅니다.'],
 frame:['주어와 동사를 골라 문장 틀 맞추기 실험','주어와 동사·나머지를 골라 평서문을 만들고, be동사를 함께 넣었을 때 무엇이 틀리는지 판정을 봅니다.','Sam을 주어로 하고 study를 고르면 동사 자리에는 어떤 모양이 올까요?','주어 일곱 개를 차례로 바꾸며 go와 have의 모양을 적고, 3인칭 단수에서만 모양이 바뀐다는 것을 확인한 뒤 자기소개 첫 두 문장을 이 틀로 만들어 보세요.'],
 questions:['평서문을 질문으로 바꾸기 실험','주어·평서문·시제를 바꾸며 do·does·did나 be동사가 앞으로 오는 질문과, 의문사 질문이 만들어지는 순서를 봅니다.','“Sam works in Seoul.”을 where로 묻는 질문으로 바꾸면 works는 어떻게 될까요?','Sam에게 첫 점심에서 물을 질문 세 개(출신, 일하는 곳, 좋아하는 음식)를 실험으로 만들어 적고, 현재와 과거를 바꿔 does와 did가 어떻게 달라지는지 견주어 보세요.'],
 time:['시간 표지에 맞춰 동사 모양 바꾸기 실험','주어·동사·시간 표지를 골라 문장을 만들고, 시간선 위에서 현재·과거·현재진행·be going to 가운데 무엇이 되는지 봅니다.','Sam이 주어이고 동사 go, 시간 표지 yesterday를 고르면 문장은 어떻게 될까요?','동사 여덟 개의 과거형을 모두 만들어 -ed를 붙이는 동사와 모양이 바뀌는 동사로 나누어 적고, 지난 주말에 한 일을 과거형 두 문장으로 말해 보세요.'],
 followup:['대답 방식에 따라 끊기는 횟수 세기 실험','세 화제마다 지우의 대답을 짧은 대답·정보 한 문장·정보와 되묻기 가운데서 골라, 대화가 몇 번 끊기는지 셉니다.','세 화제에 모두 정보 한 문장만 더하면(되묻기 없이) 대화는 몇 번 끊길까요?','세 화제에 지우 대신 내 대답을 정보 한 문장과 되묻기로 직접 써 보고, 되묻기가 앞 질문을 그대로 되풀이하지 않는지 확인해 보세요.'],
 requests:['공손 점수로 부탁 틀 고르기 실험','상대와의 거리·상대의 힘·부탁의 부담을 0~2점으로 고르고, 점수의 합에 따라 네 단계 부탁 틀 가운데 무엇을 쓰는지 봅니다.','동료 상사(거리 1, 힘 2)에게 파일을 보내 달라는 작은 부탁(부담 0)을 하면 어느 틀을 고를까요?','부탁할 일 세 가지를 친구·동료·처음 보는 사람에게 각각 해 본다고 하고, 점수의 합과 고른 틀을 표로 적은 뒤 Would you mind 문장에 어떻게 답할지도 적어 보세요.'],
 repair:['놓친 종류에 맞는 되묻기 고르기 실험','Sam의 말을 속도를 바꿔 듣고, 무엇을 놓쳤는지(전부·속도·한 낱말·뜻) 골라 알맞은 되묻기 표현을 봅니다.','1번 문장에서 Gyeongbokgung은 들었지만 뜻이 확실하지 않다면 어떤 표현을 고를까요?','글 보기를 끈 채 다섯 문장을 속도 1.2로 들으며 놓친 종류를 먼저 적고, 그다음 글을 켜서 내가 고른 되묻기가 놓친 부분을 다시 듣게 해 주는지 확인해 보세요.'],
 linking:['받아쓰기 낱말 오류율 계산 실험','문장을 듣고 들은 대로 적으면, 원래 문장과 낱말 단위로 맞춰 바뀜·빠짐·더함을 세고 낱말 오류율을 계산합니다.','“What do you want to do?”를 “what do you wanna do”로 적으면 낱말 오류율은 몇 %일까요?','다섯 문장을 속도 0.8과 1.2로 한 번씩 듣고 받아 적어 오류율을 표로 적은 뒤, 빨라질 때 가장 자주 사라진 낱말이 기능어인지 내용어인지 확인해 보세요.'],
 fluency:['분당 낱말 수와 군말 세기 실험','받아 적은 말과 걸린 시간을 넣어 군말 수와 분당 낱말 수를 세고, 초시계로 직접 잰 내 자기소개와 견줍니다.','지우가 처음 자기소개(22낱말 가운데 군말 6개)를 30초가 아니라 20초에 말했다면 분당 몇 낱말일까요?','내 1분 자기소개를 녹음해 받아 적고 초시계로 잰 시간과 함께 넣은 뒤, 군말 하나와 틀린 문장 하나를 고쳐 다시 재어 두 결과를 견주어 보세요.'],
 review:['지우의 점심 대화 세 순간 복기 실험','복기할 순간과 고친 말 후보를 바꾸며, 앞 장의 도구(이어 갈 거리·시제·되묻기)가 내는 판정과 복기 한 줄을 봅니다.','순간 B에서 yesterday에 맞는 후보는 몇 번일까요?','세 순간마다 “순간 · 원래 말 → 고친 말 · 쓴 도구 · 이 기록으로 알 수 없는 것”을 한 줄씩 적고, 마지막 Sam의 질문 “Which part did you like best?”에 내가 할 대답을 5장의 과거형으로 써 보세요.']
};
const GUESS={syllable:'예: ○음절, ○박자',stress:'예: ○개',frame:'예: Sam ○○',questions:'예: Where ○○ Sam ○○?',time:'예: Sam ○○ to the gym …',followup:'예: ○번',requests:'예: ○○ you',repair:'예: Do you …?',linking:'예: ○%',fluency:'예: 분당 ○낱말',review:'예: 후보 ○'};
const pad=i=>String(i+1).padStart(2,'0');
function sourceLinks(ids){if(!ids.length)return '<p class="caption">이 장의 근거와 확인일은 <a href="docs/research.html">조사 노트</a>에 모아 두었습니다.</p>';return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">영어 회화 기초 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}</a>`).join('');}
const PATHS=[
 ['영어로 처음 말해 본다면','낱말의 박자와 문장 강세를 익히고, 주어와 동사 하나로 평서문을 만들어 대답에 한 문장을 더합니다.',['syllable','stress','frame','followup']],
 ['문장은 아는데 대화가 끊긴다면','대답에 정보와 되묻는 질문을 붙이고, 못 알아들었을 때 다시 묻는 말을 고르고, 이어진 소리를 받아 적습니다.',['followup','repair','linking','final']],
 ['1분 자기소개를 준비한다면','문장 틀과 시제로 자기소개 문장을 만들고, 군말과 속도를 재어 다듬습니다.',['frame','time','fluency','final']]
];
function paths(){return `<div class="path-grid">${PATHS.map(([t,d,ids])=>`<div class="path"><h3>${t}</h3><p>${d}</p>${ids.map(id=>{const i=B.chapters.findIndex(c=>c.id===id);return `<a href="#${id}" aria-label="${pad(i)}장 ${U.esc(B.chapters[i].title)}">${pad(i)}</a>`;}).join('')}</div>`).join('')}</div>`;}
function sourcesSection(){
 return `<section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">목표 수준은 유럽 공통 참조 기준(CEFR) 자기 평가표의 A2 말하기 설명에 맞췄고, 대화의 말차례와 되묻기는 대화 분석 연구의 용어를 빌렸습니다.</p><div class="note">지우와 Sam, 두 사람의 대화 기록은 모두 이 책이 지어낸 것입니다. 3~5장의 문장 판정과 9장의 낱말 오류율, 10장의 분당 낱말 수는 브라우저 안의 규칙(js/english.js)이 실제로 계산합니다. 규칙은 현재·과거·현재진행·be going to와 낱말 목록에 있는 동사만 다루며, 영어 문법 전체를 판정하지 않습니다. 1장의 영어 음절 수와 강세 자리, 6장의 Sam 반응, 7장의 공손 점수 문턱, 8장의 되묻기 표현은 미리 정한 값과 시나리오입니다. 듣기 단추는 브라우저의 음성 합성을 쓰므로 목소리와 실제 속도가 기기마다 다르고, 원어민의 실제 발음을 대신하지 않습니다. 이 책은 발음을 녹음해 채점하지 않습니다. 출처와 확인하지 못한 것은 <a href="docs/research.html">조사 노트</a>에 있습니다.</div>${sourceLinks(B.sources.map((_,i)=>i))}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary"><p><b>음절</b> 모음 하나를 중심으로 한 번에 내는 소리 덩어리. street는 1음절, banana는 3음절.</p><p><b>강세</b> 낱말이나 문장에서 더 길고 크고 높게 말하는 부분.</p><p><b>내용어·기능어</b> 내용어는 명사·본동사·형용사·부사·의문사처럼 뜻을 싣는 낱말, 기능어는 관사·전치사·대명사·조동사처럼 문장을 잇는 낱말.</p><p><b>be동사</b> am·is·are·was·were. 상태나 정체, 있는 곳을 말한다.</p><p><b>3인칭 단수</b> I·you가 아닌 한 사람이나 한 가지(he, she, Sam). 현재 시제에서 일반동사에 -s가 붙는다.</p><p><b>시간 표지</b> yesterday·every day·next week처럼 언제인지 알리는 말.</p><p><b>말차례</b> 대화에서 한 사람이 말하는 한 번. 영어로 turn.</p><p><b>되묻기</b> 이 책은 두 가지를 이렇게 부른다. 6장의 되묻는 질문은 대답 끝에 같은 화제를 상대에게 물어 말차례를 넘기는 말(How about you?), 8장의 되묻기는 못 알아들은 말을 다시 말해 달라거나 뜻을 확인하는 말로 대화 분석의 수리(repair)에 해당한다.</p><p><b>연음</b> 앞 낱말의 끝소리와 뒤 낱말의 첫소리가 이어져 한 덩어리로 들리는 현상.</p><p><b>낱말 오류율(WER)</b> 받아 적은 글과 원래 문장을 맞춰 센 오류 수를 원래 낱말 수로 나눈 값.</p><p><b>군말</b> um·uh처럼 생각할 시간을 벌려고 넣는 소리.</p></div></section>`;
}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">SPEAKING ENGLISH FROM THE BASICS</div><h1>영어 회화 기초<br><em>묻고 답하며 3분 대화 이어 가기</em></h1><p class="lead">6주 뒤 싱가포르에서 오는 동료 Sam과 점심을 먹게 된 회사원 지우(지어낸 인물)를 사례로, 낱말의 박자와 문장 강세, 주어와 동사의 기본 틀, 질문과 시제를 익힙니다. 이어서 대답에 정보 한 문장과 되묻는 질문을 더해 대화를 잇고, 상대와 부탁 크기에 맞춰 부탁하는 틀을 고릅니다. 못 알아들었을 때 다시 묻는 말을 고르고 이어진 소리를 받아 적는 법을 익힌 뒤, 내 말의 속도와 군말을 잽니다. 마지막에는 지우의 첫 점심 대화 기록에서 대화를 멈추게 하거나 시제가 틀린 세 순간을 고칩니다.</p><div class="hero-links"><a class="button primary" href="#syllable">01장부터 읽기</a><a class="button" href="#followup">대화 이어 가기 실험</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>A2</b>목표 말하기 수준(CEFR 자기 평가표)</span></div><p class="caption">소리 → 문장 → 대화 → 연습 → 마지막 과제<br>인물과 대화는 지어낸 것이며, 듣기는 브라우저의 음성 합성을 씁니다.</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>낱말 박자에서 대화 복기까지, 다섯 단계로 읽습니다</h2><p>모든 장이 지우의 첫 점심 대화 준비를 같은 예로 씁니다. 단계마다 괄호 안에 해당 장을 적었습니다.</p></div>${flow(['소리|음절 수와 문장 강세 (1~2장)','문장|기본 틀·질문·시제 (3~5장)','대화|이어 가기·부탁·되묻기·연음 (6~9장)','연습|속도와 군말 재기 (10장)','마지막 과제|첫 점심 대화 복기 (11장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 문장을 만들거나 들어 보고, 판정과 숫자로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${pad(i)} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 목적에 맞는 장만 골라 보세요.</p></div>${paths()}</section>
 ${sourcesSection()}`;
 cleanup=EHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${pad(index)}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}<label class="my-guess" for="guess-${id}"><span>내 예측 적어 두기</span><input id="guess-${id}" type="text" autocomplete="off" placeholder="${GUESS[id]||'짐작한 답을 짧게'}"></label></div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross||!c.cross.length)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=window.EFigures?.render(c.id),caption=art?art.caption:c.subtitle;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
function choices(q,target,attr){return U.choiceOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function navLinks(index){
 const prev=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${B.chapters[index+1].desc}</small></a>`:'<a href="../opic/#test">다음 권 · 오픽 대비 · 오픽 시험의 진행 순서와 문항 구성 확인하기<small>이동 이유: 짧은 대화를 이어 갈 수 있게 되었으니, 질문 하나에 1~2분 동안 내 이야기를 이어 말하는 말하기 시험 형식으로 넘어갑니다. 이 책의 문장 틀·시제·분당 낱말 수를 답변 시간 안에서 다시 씁니다.</small></a>';
 return `<nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${pad(index)}. ${c.title} · 영어 회화 기초`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>${index?'앞 장 떠올리기':'먼저 떠올리기'}</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div></section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source||[])}${cross(c)}</section>${navLinks(index)}</div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);ELabs[id](el);EGuides.mount(id,el);});
 main.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const ok=+b.dataset.answer===c.quiz[2];main.querySelector('.quiz-feedback').textContent=`${ok?'✓ 정답입니다.':'✗ 다시 생각해 보세요.'} ${c.quiz[3]}`;});
 main.querySelectorAll('[data-transfer]').forEach(b=>b.onclick=()=>{const ok=+b.dataset.transfer===c.transfer[2];main.querySelector('.transfer-feedback').textContent=`${ok?'✓ 정답입니다.':'✗ 다시 생각해 보세요.'} ${c.transfer[3]}`;});
 cleanup=()=>ESpeak.stop();
}
function route(){
 cleanup();cleanup=()=>{};const hash=location.hash.slice(1)||'home',i=B.chapters.findIndex(c=>c.id===hash);
 document.body.classList.remove('menu-open');document.querySelector('#menu').setAttribute('aria-expanded','false');
 if(i>=0)chapter(B.chapters[i],i);else home();
 document.querySelectorAll('[data-chapter]').forEach(a=>{const on=a.dataset.chapter===hash;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(['chapters','sources'].includes(hash))document.getElementById(hash).scrollIntoView();else window.scrollTo(0,0);
}
side();window.addEventListener('hashchange',route);
/* 본문 건너뛰기 링크는 주소를 바꾸지 않고 지금 화면의 본문으로 초점만 옮긴다. */
document.querySelector('.skip').onclick=e=>{e.preventDefault();const m=document.getElementById('main');m.setAttribute('tabindex','-1');m.focus();};
document.querySelector('#theme').onclick=()=>{const dark=document.documentElement.dataset.theme==='dark';document.documentElement.dataset.theme=dark?'light':'dark';};
document.querySelector('#menu').onclick=()=>{const open=document.body.classList.toggle('menu-open');document.querySelector('#menu').setAttribute('aria-expanded',String(open));};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('menu-open');document.querySelector('#menu').setAttribute('aria-expanded','false');}});
route();
})();
