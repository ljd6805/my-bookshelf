(()=>{
'use strict';
/* 해시 경로를 읽어 표지 또는 장 화면을 그린다. 화면 구조는 AI Book(books/ai/js/app.js)과 같다. */
const U=KGUI,B=KGBook,main=document.querySelector('main'),NAME='지식 그래프와 온톨로지';let cleanup=()=>{};
const info={
triples:['문장을 하나씩 더해 그래프 만들기','퀴리 가족에 관한 문장을 하나씩 트리플로 더하며 점·간선·떨어진 덩어리의 수를 셉니다.','문장 5개에서 6개로 늘릴 때 떨어진 덩어리 수가 어떻게 될지 먼저 예측하고 확인해 보세요.'],
walk:['몇 걸음이면 닿을까','출발점과 걸음 수를 정하고, 닿는 점과 찾을 점까지의 가장 짧은 길을 봅니다.','이렌에서 출발하면 바르샤바까지 몇 걸음일까요? 예측한 뒤 출발점을 바꿔 확인하세요.'],
resolve:['이름으로 같은 사람 묶기','아홉 개의 이름을 글자 조각 겹침 J로 묶고, 문턱과 묶는 기준을 바꿉니다.','“마리 퀴리”와 “Marie Curie”를 한 묶음으로 만드는 문턱이 있을까요? 공식을 보고 예측한 뒤 확인하세요.'],
schema:['규칙에 맞는 트리플 조립하기','주어·관계·목적어를 골라 관계의 정의역·치역 규칙에 맞는지 검사합니다.','관계를 “이름 유래”로 두고 규칙을 통과하는 주어와 목적어를 찾아보세요. 둘 다 어떤 클래스여야 할까요?'],
infer:['규칙을 반복해 새 사실 만들기','추론 규칙을 고르고 라운드를 늘리며 새 사실과 고정점을 확인합니다.','배우자 규칙만 켜면 몇 라운드 만에 고정점에 도달할까요? 규칙의 모양을 보고 먼저 예측하세요.'],
query:['패턴으로 그래프에 묻기','트리플 패턴 두 줄을 조립해 그래프에 질의하고 변수에 들어갈 값을 찾습니다.','“?x 자녀 마리”와 “?x 수상 ?z”를 함께 쓰면 무엇을 묻는 질문이 될까요? 답을 예측한 뒤 조립해 보세요.'],
extract:['확신도 문턱 정하기','가상의 추출기가 낸 후보 13개에서 문턱 이상만 그래프에 넣고 정밀도와 재현율을 계산합니다.','F1이 가장 큰 문턱 구간을 찾아보세요. 그 구간에서도 남는 오류는 무엇일까요?'],
transe:['관계 화살표로 빈칸 짐작하기','관계 화살표 r을 움직여 도시 + r에 가장 가까운 나라를 고르고 순위를 봅니다.','가로만 1.5로 두고 세로를 0에서 1.2까지 올릴 때 1위로 맞힌 쌍이 몇 개씩 늘어날지 예측해 보세요.'],
graphrag:['문장 검색과 그래프 걷기 비교하기','같은 질문을 문장 검색(k개)과 그래프 걷기(걸음 수)로 풀고, 근거 사슬과 문맥 크기를 비교합니다.','마지막 과제: 그래프에서 “이렌 —자녀→ 마리”와 “이렌 —자녀→ 피에르”가 빠졌다고 가정해 보세요. 두 방법 중 무엇이 답을 잃고, 답을 되찾으려면 어떤 증거를 더 모아야 할까요? 근거와 함께 적어 보세요.']
};
function crossLinks(items=[]){return items.length?`<h3>다른 책으로 이어 읽기</h3><ul class="source-list cross-list">${items.map(([label,url,why])=>`<li><a href="${url}">${label}</a><br><span class="caption">이동 이유: ${why} 다 읽으면 이 장으로 돌아와 실험을 다시 해 보세요.</span></li>`).join('')}</ul>`:'';}
function sourceLinks(ids){return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${a}</b><span>${b}</span></div>`;}).join('')}</div>`;}
const num=i=>String(i+1).padStart(2,'0');
function side(){document.querySelector('#sidebar').innerHTML=`<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">${NAME} 처음으로</a>`+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${num(i)}</span>${c.title}</a>`).join('');}
function pathCard(title,text,ids){return `<div class="path"><h3>${title}</h3><p>${text}</p>${ids.map(id=>`<a href="#${id}">${num(B.chapters.findIndex(c=>c.id===id))}</a>`).join('')}</div>`;}
function home(){
 document.body.classList.remove('reading');document.title=`${NAME} · 의미를 구조로`;
 const labs=B.chapters.reduce((s,c)=>s+c.labs.length,0);
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">Meaning, made into structure</div><h1>흩어진 문장을<br><em>이어진 지식으로.</em></h1><p class="lead">퀴리 가족에 관한 문장 스물한 개를 트리플로 바꾸고, 이름을 정리하고, 규칙을 붙이고, 질문을 던집니다. 마지막에는 그래프와 언어 모델을 함께 써서 세 단계 질문에 근거를 갖춰 답합니다.</p><div class="hero-links"><a class="button primary" href="#triples">01장부터 읽기</a><a class="button" href="#graphrag">GraphRAG 실험하기</a></div><div class="stats"><span><b>${B.chapters.length}</b>챕터</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>21</b>퀴리 가족 사실</span></div></div><div class="hero-lab" id="home-graph"></div></section><section class="section"><div class="section-heading"><h2>지식 그래프의 흐름을 한눈에</h2><p>문장을 구조로 바꾸고, 뜻을 붙이고, 그 구조로 답을 찾습니다. 각 단계가 아래의 챕터와 연결됩니다.</p></div>${flow(['문장|흩어진 사실','트리플·식별자|1~3장','온톨로지·추론|4~5장','질의·추출|6~7장','임베딩·GraphRAG|8~9장'])}</section><section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>개념을 읽고, 그림을 보고, 직접 실험한 뒤 확인 문제로 마무리하세요.</p></div><h2>전체 챕터</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${num(i)} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section><section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음부터 순서대로 읽거나, 지금 궁금한 질문에서 출발해도 좋습니다.</p></div><div class="path-grid">${pathCard('지식 그래프가 처음이라면','사실을 트리플로 적고 걸어 다니는 법을 익힌 뒤, 질문을 패턴으로 적어 봅니다.',['triples','walk','identity','query'])}${pathCard('데이터 모델을 설계한다면','식별자와 클래스, 관계 규칙, 추론이 데이터 품질에 어떤 차이를 만드는지 봅니다.',['identity','ontology','reasoning','query'])}${pathCard('LLM과 함께 쓰려면','글에서 그래프를 뽑고, 빈칸을 짐작하고, 그래프를 근거로 답하는 흐름을 따라갑니다.',['extraction','embedding','graphrag'])}</div></section><section class="section" id="sources"><h2>읽을거리와 실험의 경계</h2><p class="lead">W3C 표준 문서와 지식 그래프 개론 논문, 노벨상 공식 기록을 바탕으로 설명했습니다. 실험에는 계산식과 가정, 생략한 부분을 함께 적었습니다.</p>${sourceLinks(B.sources.map((_,i)=>i))}<div class="note">모든 실험은 브라우저 안에서 실행됩니다. 1~6장과 9장은 퀴리 가족 그래프 위의 실제 계산이고, 7장의 추출 점수와 8장의 좌표는 교육용으로 미리 정한 값입니다. 9장은 언어 모델을 실행하지 않고, 근거 사슬이 문맥 안에서 완성되는지만 확인합니다. 지명은 오늘날 기준이며, 참고 링크는 2026-10-08 집필 환경의 네트워크 제한으로 직접 열어 확인하지 못했습니다.</div></section>`;
 cleanup=KGHome.mount(document.querySelector('#home-graph'));
}
function renderLab(id,index){const [title,desc,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${num(index)}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function chapterNav(index){
 const prev=B.chapters[index-1],next=B.chapters[index+1];
 return `<nav class="chapter-nav" aria-label="이전·다음 챕터">${prev?`<a href="#${prev.id}">이전 · ${prev.title}</a>`:'<a href="#home">책 표지로</a>'}${next?`<a href="#${next.id}">다음 · ${next.title}<br><span class="caption">이동 이유: ${next.desc}</span></a>`:'<a href="#chapters">목차로 돌아가기</a>'}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${num(index)}. ${c.title} · ${NAME}`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${num(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 1개</span></div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}<figure class="concept-diagram">${KGFigures.render(c.id,index)}${flow(c.flow)}</figure><div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div></section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${c.quiz[1].map((a,i)=>`<button data-answer="${i}">${i+1}. ${a}</button>`).join('')}<div class="quiz-feedback" role="status" aria-live="polite"></div></section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source)}${crossLinks(c.cross)}</section>${chapterNav(index)}</div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);KGLabs[id](el);KGGuides.mount(id,el);});
 main.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const correct=+b.dataset.answer===c.quiz[2];main.querySelectorAll('[data-answer]').forEach(x=>x.removeAttribute('aria-pressed'));b.setAttribute('aria-pressed','true');main.querySelector('.quiz-feedback').textContent=`${correct?'정답입니다.':'다시 생각해 보세요.'} ${c.quiz[3]}`;});
}
function route(){
 cleanup();cleanup=()=>{};const hash=location.hash.slice(1)||'home',index=B.chapters.findIndex(c=>c.id===hash);
 document.body.classList.remove('menu-open');document.querySelector('#menu').setAttribute('aria-expanded','false');
 if(index>=0)chapter(B.chapters[index],index);else home();
 document.querySelectorAll('[data-chapter]').forEach(a=>{const active=a.dataset.chapter===hash;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(hash==='chapters'||hash==='sources')document.getElementById(hash).scrollIntoView();else window.scrollTo(0,0);
}
side();window.addEventListener('hashchange',route);
document.querySelector('#theme').onclick=()=>{const root=document.documentElement,dark=root.dataset.theme==='dark';root.dataset.theme=dark?'light':'dark';const b=document.querySelector('#theme');b.textContent=dark?'어두운 화면':'밝은 화면';b.setAttribute('aria-label',b.textContent+'으로 전환');};
document.querySelector('#menu').onclick=()=>{const open=document.body.classList.toggle('menu-open');document.querySelector('#menu').setAttribute('aria-expanded',String(open));};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('menu-open');document.querySelector('#menu').setAttribute('aria-expanded','false');}});
route();
})();
