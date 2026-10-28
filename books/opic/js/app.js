(()=>{
'use strict';
const U=OUI,B=OBook,main=document.querySelector('main'),BOOK_TITLE='오픽 대비 · 질문 유형별로 답을 짜고 시간 안에 말하기';let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측 질문은 조작 전에 읽도록 실험 위에 두며, 답은 결과 읽기에만 있다. */
const info={
 plan:['문항 수와 문항당 말할 시간 계산 실험','자기 평가 단계, 질문 하나를 듣는 시간, 다시 듣기 여부를 바꾸며 40분 안에서 문항당 말할 수 있는 평균 시간을 계산합니다.','자기 평가를 4단계에서 2단계로 낮추면 문항당 말할 수 있는 평균 시간은 늘까요, 줄까요?','듣는 시간을 20초에 두고 다시 듣기를 켠 뒤 4단계와 5단계의 문항당 시간을 적고, 왜 두 값이 같은지 문항 수로 설명해 보세요.'],
 shape:['답의 낱말·문장·연결어·시간틀 세기 실험','공원 질문에 답한 표본 넷을 바꾸거나 직접 쓴 답을 넣어, 낱말·문장·연결어·시간틀을 세고 이 책의 글 모양 어림 네 칸 가운데 어디에 놓이는지 봅니다.','표본 3은 연결어로 문장을 이었는데도 “문단에 가까움” 칸에 놓이지 않습니다. 무엇이 모자랄까요?','표본 2를 고른 뒤 칸에서 문장 두 개를 because와 so로 이어 보고, 칸이 바뀌는 데 필요한 연결어 수를 적어 보세요.'],
 survey:['설문 항목을 이야기 묶음으로 모으기 실험','설문 항목을 고르고 빼며, 고른 항목 수와 최소 선택 조건, 준비할 이야기 묶음 수를 계산합니다.','지금 고른 11개에 운동 항목 하나를 더하면 제출할 수 있을까요? 그때 준비할 이야기 수는 몇 개가 될까요?','“흩어 고른 12개” 예제에서 시작해 이야기 묶음이 5개 이하가 될 때까지 항목을 바꾸고, 어떤 항목을 어떤 항목으로 바꿨는지 적어 보세요.'],
 builder:['묘사 답을 네 덩어리로 짜기 실험','도입·세부·예·마무리 칸마다 민서의 집 묘사 문장을 고르고, 말하기 속도를 바꾸며 낱말 수와 답 길이를 계산합니다.','처음 열린 답(아파트라는 사실 + 방·부엌·욕실 나열 + “That’s all.”)을 1분에 60낱말로 말하면 몇 초쯤 걸릴까요?','네 덩어리를 모두 채운 답에서 예 칸만 비우면 답이 몇 초 줄어드는지 1분에 60낱말로 계산하고, 줄어든 덩어리가 무슨 일을 하던 덩어리였는지 적어 보세요.'],
 routine:['습관 문장에 빈도·순서 표현 더하기 실험','민서의 토요일 아침 일과를 고르고 빈도 표현과 순서 표현을 넣었다 빼며, 연결어 수와 글 모양 어림이 어떻게 바뀌는지 봅니다.','처음 열린 문장 세 개에 usually와 순서 표현을 넣으면 글 모양 어림은 몇 칸 올라갈까요?','일과 여섯 개를 모두 고르고 순서 표현을 켠 뒤, 같은 순서 표현이 두 번 나오는 곳을 찾아 다른 표현으로 바꿔 말해 보세요.'],
 story:['경험 이야기 순서와 시제 맞추기 실험','제주 여행 이야기 다섯 조각을 칸에 놓고 동사를 현재형과 과거형으로 바꾸며, 순서 판정과 과거 시간틀 표시 수를 봅니다.','다섯 조각을 바른 순서로 놓기만 하고 동사는 현재형으로 두면, 과거 시간틀 표시는 몇 개로 셀까요?','바른 순서·과거형 답을 소리 내어 말한 뒤, 느낌 조각 앞에 이야기 하나(“the waiter gave us…”)를 과거형으로 더해 말해 보세요.'],
 compare:['과거·현재·미래 시간틀로 비교하기 실험','비교할 대상과 축, 시간틀을 고르며 엮인 문장과 글에서 센 시간틀 수를 봅니다.','처음 열린 답(현재만, 축 둘)에 과거 시간틀을 더하면 글 모양 어림이 “문단에 가까움”이 될까요?','동네를 고르고 세 축과 세 시간틀을 모두 켠 뒤 소리 내어 말하고, 1분에 60낱말이면 몇 초가 걸리는지 계산해 보세요.'],
 roleplay:['롤플레이 질문과 대안 고르기 실험','두 상황에서 대사를 고르고 빼며 질문 수, 질문 종류, 공손하게 여는 질문, 대안을 내는 문장 수를 셉니다.','처음 열린 대사 세 개(인사, “I want to know the price.”, 감사)에는 질문이 몇 개 있을까요?','“예약한 수업에 갈 수 없을 때” 상황에서 문제를 말한 문장 하나와 대안 두 개를 고른 뒤, 고르지 않은 대안 문장을 공손한 의문문으로 바꿔 말해 보세요.'],
 reuse:['준비한 이야기로 질문 덮기 실험','준비한 이야기를 고르고 빼며, 콤보·돌발 질문 여덟 개 가운데 그대로 쓰는 질문, 쓰임만 바꾸는 질문, 덮지 못하는 질문을 셉니다.','공원 이야기 하나만 준비했을 때, 덮지 못하는 질문은 몇 개일까요?','이야기를 세 개만 고를 수 있다면 덮지 못하는 질문이 0개가 되는 조합을 찾고, 그때 “쓰임만 바꿈” 질문 하나를 골라 고쳐 말할 첫 문장을 적어 보세요.'],
 pace:['말하기 속도와 멈춘 시간 재기 실험','녹음 길이·낱말 수·멈춘 시간을 넣거나 초시계로 직접 재어, 1분당 낱말 수와 목표 시간에 필요한 낱말 수를 계산합니다.','민서의 첫 녹음(80초, 58낱말)으로 1분 30초를 채우려면 낱말이 몇 개쯤 필요할까요?','초시계를 켜고 “Tell me about your home.”에 1분 동안 답한 뒤, 녹음을 받아 적어 낱말 수를 넣고 자기 속도와 멈춘 시간의 몫을 적어 보세요.'],
 diagnose:['민서의 답 네 개 진단하기 실험','민서가 첫 주에 녹음한 답 네 개와 책을 마친 뒤 다시 녹음한 답을 골라, 앞 장들의 계산과 이 책의 점검 다섯 가지로 고칠 곳 하나를 찾습니다.','제주 여행 답(첫 주)은 80초에 연결어도 4개입니다. 이 책의 점검에서 어디에 걸릴까요?','첫 주 답 넷의 “고칠 곳”을 한 줄씩 적고, 고친 답에서 그 점검의 숫자가 얼마로 바뀌었는지 옆에 적어 보세요.']
};
const GUESS={plan:'늘어난다 / 줄어든다',shape:'예: 문장 수',survey:'예: 된다, ○개',builder:'예: ○초',routine:'예: ○칸',story:'예: ○개',compare:'된다 / 안 된다',roleplay:'예: ○개',reuse:'예: ○개',pace:'예: ○낱말',diagnose:'예: 길이 / 연결어 / 과거형'};
const pad=i=>String(i+1).padStart(2,'0');
function sourceLinks(ids){if(!ids.length)return '<p class="caption">이 장의 근거와 확인일은 <a href="docs/research.html">조사 노트</a>에 모아 두었습니다.</p>';return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">오픽 대비 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}</a>`).join('');}
const PATHS=[
 ['시험이 처음이라면','시험이 어떻게 진행되고, 등급을 무엇으로 매기며, 설문과 자기 평가를 어떻게 고를지부터 정합니다.',['test','levels','survey','timing']],
 ['IM에서 IH로 올리고 싶다면','묘사·경험·비교 답을 문단으로 짜고, 시간틀을 바꾸며 말하는 연습에 집중합니다.',['describe','past','compare','final']],
 ['시험이 일주일 남았다면','준비한 이야기로 콤보·돌발 질문을 덮고, 롤플레이와 시간 배분을 점검합니다.',['roleplay','combo','timing','final']]
];
function paths(){return `<div class="path-grid">${PATHS.map(([t,d,ids])=>`<div class="path"><h3>${t}</h3><p>${d}</p>${ids.map(id=>{const i=B.chapters.findIndex(c=>c.id===id);return `<a href="#${id}" aria-label="${pad(i)}장 ${U.esc(B.chapters[i].title)}">${pad(i)}</a>`;}).join('')}</div>`).join('')}</div>`;}
function sourcesSection(){
 return `<section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">시험 형식과 채점 방식은 ACTFL이 공개한 OPIc 안내서·보고서·숙달도 지침 소개와 대조했습니다. 국내 시험의 문항 수·시간·다시 듣기·재조정 규칙은 국내 시험 안내 정리와 응시 후기 정리에서 확인했고, 공식 사이트는 이 책을 쓸 때 열지 못했습니다. 응시 전에는 공식 사이트에서 최신 규정을 확인하세요.</p><div class="note">민서와 민서의 녹음 대본, 공원 표본 답, 설문 항목 목록과 이야기 묶음, 질문 여덟 개는 모두 이 책이 지어낸 것입니다. 실험은 낱말·문장·연결어·시간틀·질문 수를 실제로 세고, 시간과 속도를 실제로 계산합니다. 다만 “글 모양 어림”과 “이 책의 점검 다섯 가지”는 연습 방향을 잡으려고 이 책이 정한 규칙이며, 오픽 채점 기준이나 등급 예측이 아닙니다. 오픽 등급은 ACTFL 인증 평가자가 답 전체를 들으며 기능·내용·텍스트 유형·정확성을 종합해 매깁니다. 발음과 문법 정확성은 이 책의 계산이 재지 못합니다. 출처와 확인하지 못한 것은 <a href="docs/research.html">조사 노트</a>에 있습니다.</div>${sourceLinks(B.sources.map((_,i)=>i))}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary"><p><b>OPIc</b> ACTFL의 말하기 인터뷰(OPI)를 컴퓨터로 옮긴 시험. 화면 속 진행자가 묻고, 응시자는 녹음으로 답한다.</p><p><b>ACTFL</b> 미국외국어교육협회. 숙달도 지침을 만들고 OPIc 채점자를 인증한다.</p><p><b>배경 설문</b> 시험 전에 일·집·여가·취미·운동·여행을 고르는 설문. 질문 주제의 바탕이 된다.</p><p><b>자기 평가</b> 자기 말하기 수준에 맞는 설명을 고르는 단계. 받을 질문의 난이도를 정한다.</p><p><b>콤보</b> 같은 주제의 질문이 두세 개 이어지는 묶음(응시 후기에서 쓰는 말).</p><p><b>돌발 주제</b> 설문에서 고르지 않은 주제의 질문(응시 후기에서 쓰는 말).</p><p><b>롤플레이</b> 상황을 주고 질문하기나 문제 해결을 시키는 문항.</p><p><b>시간틀</b> 과거·현재·미래 가운데 말하는 때. ACTFL은 고급 화자가 주요 시간틀로 이야기한다고 설명한다.</p><p><b>텍스트 유형</b> 말의 길이와 짜임: 낱말·구, 문장, 문단, 긴 담화.</p><p><b>연결어</b> because, so, when, after that처럼 문장과 문장을 잇는 말.</p><p><b>wpm</b> 1분에 말한 낱말 수(words per minute).</p></div></section>`;
}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">OPIc SPEAKING, ONE ANSWER AT A TIME</div><h1>오픽 대비<br><em>답을 짜고 시간 안에 말하기</em></h1><p class="lead">5주 뒤 오픽 IH를 받아야 하는 회사원 민서(지어낸 인물)를 사례로, 시험이 어떻게 진행되고 등급을 무엇으로 매기는지 확인한 뒤 묘사·습관·경험·비교·롤플레이 질문마다 답의 짜임을 세웁니다. 이어서 준비한 이야기로 콤보·돌발 질문을 덮고, 자기 녹음으로 말하기 속도를 잽니다. 마지막에는 민서가 첫 주에 녹음한 답 네 개를 진단하고 고친 답과 비교합니다.</p><div class="hero-links"><a class="button primary" href="#test">01장부터 읽기</a><a class="button" href="#describe">묘사 답 짜기 실험</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>40분</b>본시험 답변 시간(국내 시험 안내)</span></div><p class="caption">시험 이해 → 질문 유형 → 실전 운영 → 마지막 과제<br>인물과 대본은 지어낸 것이며, 계산은 모두 이 기기 안에서 합니다. 녹음은 하지 않습니다.</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>시험 구성에서 고친 답까지, 네 단계로 읽습니다</h2><p>모든 장이 민서의 시험 준비를 같은 예로 씁니다. 단계마다 괄호 안에 해당 장을 적었습니다.</p></div>${flow(['시험 이해|진행 순서·등급 기준·설문과 자기 평가 (1~3장)','질문 유형|묘사·습관·경험·비교·롤플레이 (4~8장)','실전 운영|콤보·돌발 주제, 속도와 시간 (9~10장)','마지막 과제|민서의 답 네 개 진단 (11장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 답을 짜거나 세어 보고, 숫자와 판정으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${pad(i)} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 목적에 맞는 장만 골라 보세요.</p></div>${paths()}</section>
 ${sourcesSection()}`;
 cleanup=OHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${pad(index)}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}<label class="my-guess" for="guess-${id}"><span>내 예측 적어 두기</span><input id="guess-${id}" type="text" autocomplete="off" placeholder="${GUESS[id]||'짐작한 답을 짧게'}"></label></div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross||!c.cross.length)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=window.OFigures?.render(c.id),caption=art?art.caption:c.subtitle;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. */
function order(n,answer,target){const rest=[...Array(n).keys()].filter(i=>i!==answer),out=[];let k=0;for(let p=0;p<n;p++)out.push(p===target%n?answer:rest[k++]);return out;}
function choices(q,target,attr){return order(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function navLinks(index){
 const prev=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${B.chapters[index+1].desc}</small></a>`:'<a href="../aie-audio/#asr">다른 책 · AI공학 7 · 음성과 오디오 · 소리를 글자로 옮기기<small>이동 이유: 자기 녹음을 받아 적어 낱말 수와 연결어를 셌습니다. 음성 인식 모델이 소리를 글자로 옮기는 과정과, 받아 적은 글이 틀리는 이유를 이어 배우면 자동 받아쓰기를 연습에 쓸 때 무엇을 다시 들어야 하는지 알 수 있습니다.</small></a>';
 return `<nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${pad(index)}. ${c.title} · 오픽 대비`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>${index?'앞 장 떠올리기':'먼저 떠올리기'}</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div></section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source||[])}${cross(c)}</section>${navLinks(index)}</div>`;
 const stops=c.labs.map(id=>{const el=main.querySelector(`[data-lab="${id}"]`);el._stop=OLabs[id](el);OGuides.mount(id,el);return ()=>{if(typeof el._stop==='function')el._stop();};});
 cleanup=()=>stops.forEach(f=>f());
 main.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const ok=+b.dataset.answer===c.quiz[2];main.querySelector('.quiz-feedback').textContent=`${ok?'✓ 정답입니다.':'✗ 다시 생각해 보세요.'} ${c.quiz[3]}`;});
 main.querySelectorAll('[data-transfer]').forEach(b=>b.onclick=()=>{const ok=+b.dataset.transfer===c.transfer[2];main.querySelector('.transfer-feedback').textContent=`${ok?'✓ 정답입니다.':'✗ 다시 생각해 보세요.'} ${c.transfer[3]}`;});
}
function route(){
 cleanup();cleanup=()=>{};const hash=location.hash.slice(1)||'home',i=B.chapters.findIndex(c=>c.id===hash);
 document.body.classList.remove('menu-open');document.querySelector('#menu').setAttribute('aria-expanded','false');
 if(i>=0)chapter(B.chapters[i],i);else home();
 document.querySelectorAll('[data-chapter]').forEach(a=>{const on=a.dataset.chapter===hash;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(['chapters','sources'].includes(hash))document.getElementById(hash).scrollIntoView();else window.scrollTo(0,0);
}
side();window.addEventListener('hashchange',route);
document.querySelector('#theme').onclick=()=>{const dark=document.documentElement.dataset.theme==='dark';document.documentElement.dataset.theme=dark?'light':'dark';};
document.querySelector('#menu').onclick=()=>{const open=document.body.classList.toggle('menu-open');document.querySelector('#menu').setAttribute('aria-expanded',String(open));};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('menu-open');document.querySelector('#menu').setAttribute('aria-expanded','false');}});
route();
})();
