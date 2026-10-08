(()=>{
'use strict';
const U=RUI,B=RBook,main=document.querySelector('main');let cleanup=()=>{};
const info={
 grounding:['근거 없이 답할 때와 근거를 넣을 때','같은 질문을 두 방식으로 답하게 하고 출처가 붙는지 봅니다.','“책을 잃어버리면”을 근거와 함께 답하게 하기 전에, 검색이 맞는 문서를 찾을지 예상해 보세요.'],
 invert:['역색인으로 문서 걸러 내기','질문 낱말의 문서 목록을 꺼내 OR·AND로 합칩니다.','“전자책 연체”를 AND로 찾으면 몇 개가 걸릴지 먼저 예상한 뒤 입력해 보세요.'],
 bm25:['k1과 b로 순위 바꾸기','같은 질문에서 반복의 포화(k1)와 길이 보정(b)을 하나씩 바꿉니다.','b를 0.75에서 1로 올리면 76어절짜리 규정 문서의 순위가 오를지 내려갈지 예측하세요.'],
 chunk:['자르는 크기와 겹침 정하기','이용 규정 10문장을 잘라 답에 필요한 두 문장이 한 조각에 남는지 봅니다.','크기 1, 겹침 0으로 자르면 “최대 며칠”이라는 질문에 답할 수 있는 조각이 생길까요?'],
 embed:['질문 벡터와 가까운 문서','질문을 바꾸고 축 두 개를 골라 벡터의 방향을 봅니다.','“밤에 책을 반납할 수 있나요?”는 어느 두 축에서 질문 화살표가 가장 길게 보일지 먼저 골라 보세요.'],
 hybrid:['α로 키워드와 의미 섞기','질문을 고르고 α를 움직이며 1위 문서가 바뀌는 지점을 찾습니다.','“그림책 읽어 주기는 언제 하나요?”에서 α=0으로 내리면 어떤 일이 생길지 예측하세요.'],
 metrics:['검색 방식 성적표 만들기','방식과 k를 바꾸며 질문 10개의 정밀도·재현율·MRR을 계산합니다.','k를 1에서 5로 늘리면 세 지표 중 어느 것이 오르고 어느 것이 내릴지 먼저 적어 보세요.'],
 rerank:['후보 N개만 다시 읽기','N을 바꾸며 재순위가 정답을 끌어올리는지, 후보에 없어서 못 하는지 봅니다.','N을 8로 늘려도 1위 적중률이 더 오르지 않는 이유를 상한과 연결해 설명해 보세요.'],
 pack:['토큰 예산 안에 근거 채우기','예산을 바꾸며 들어가는 근거와 KV 캐시 크기를 봅니다.','“A-3 열람실” 질문에서 정답이 들어가는 가장 작은 예산을 찾아보세요.'],
 abstain:['마지막 과제: 답할 문턱 정하기','문턱과 1위 근거를 고르는 방법을 바꾸며 네 가지 결과를 셉니다.','틀린 답을 0으로 만드는 문턱이 있나요? 없다면 노트북 질문을 막으려면 무엇을 바꿔야 하는지, 어떤 증거(문서·평가 질문)가 더 필요한지 적어 보세요.']
};
function sourceLinks(ids){return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${a}</b><span>${b}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">검색과 RAG 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${String(i+1).padStart(2,'0')}</span>${c.title}</a>`).join('');}
function home(){
 document.body.classList.remove('reading');document.title='검색과 RAG · 질문에서 근거까지';
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">RETRIEVAL AUGMENTED GENERATION / 01</div><h1>질문에서<br><em>근거까지.</em></h1><p class="lead">도서관 안내 도우미에게 “책을 늦게 돌려주면?”이라고 물었더니 이 도서관에 없는 연체료를 말합니다. 문서를 쪼개고, 찾고, 섞고, 평가하고, 모르면 보류하는 과정을 직접 조작하며 믿을 수 있는 답을 만드세요.</p><div class="hero-links"><a class="button primary" href="#question">01장부터 읽기</a><a class="button" href="#hybrid">혼합 검색 실험</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>13</b>질문 평가 집합</span></div><p class="caption">찾기 → 의미 → 평가 → 답하기<br>모든 계산은 브라우저 안에서 하며 외부 모델을 부르지 않습니다.</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>한 도우미를 끝까지 만듭니다</h2><p>가상의 한빛시립도서관 안내 문서 13개와 질문 13개가 모든 장에 이어집니다. 각 단계가 아래 장과 연결됩니다.</p></div>${flow(['찾기|역색인·BM25·조각 (1~4장)','의미|임베딩·혼합 검색 (5~6장)','평가|지표·재순위 (7~8장)','답하기|컨텍스트·보류 (9~10장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>예상하고, 바꾸어 보고, 숫자와 그림으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${String(i+1).padStart(2,'0')} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 질문 중심으로 돌아보세요.</p></div><div class="path-grid"><div class="path"><h3>검색 엔진의 기본부터</h3><p>낱말 목록에서 점수와 조각까지, 키워드 검색이 어디서 막히는지 봅니다.</p><a href="#keywords">02</a><a href="#bm25">03</a><a href="#chunking">04</a><a href="#hybrid">06</a></div><div class="path"><h3>RAG를 바로 만들어야 한다면</h3><p>의미 검색과 혼합, 근거 예산, 보류 정책만 골라 읽습니다.</p><a href="#question">01</a><a href="#embedding">05</a><a href="#context">09</a><a href="#final">10</a></div><div class="path"><h3>검색 품질을 증명하려면</h3><p>평가 집합을 만들고 지표로 비교한 뒤 재순위와 문턱을 정합니다.</p><a href="#evaluation">07</a><a href="#rerank">08</a><a href="#final">10</a><a href="../probability/#testing">확률 07</a></div></div></section>
 <section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">RAG·BM25·의미 검색·재순위·평가의 원 논문과 교과서를 확인했습니다. 확인일: 2026-10-08.</p><div class="note">한빛시립도서관과 안내 문서 13개, 질문 13개는 이 책을 위해 지어낸 가상의 자료입니다. 역색인·BM25·조각·혼합·평가 지표는 실제 계산입니다. 임베딩은 손으로 정한 7차원 교육용 벡터이고, 재순위는 학습하지 않은 교육용 모형입니다. 언어 모델은 부르지 않으며, 1장의 “근거 없는 답”은 미리 적어 둔 시나리오입니다. 토큰 수는 어절 × 1.5로 어림합니다.</div>${sourceLinks(B.sources.map((_,i)=>i))}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary"><p><b>RAG</b> 답하기 전에 문서를 찾아 입력에 넣는 방법.</p><p><b>역색인</b> 낱말마다 등장 문서를 적어 둔 목록.</p><p><b>BM25</b> 드문 낱말·반복·길이를 반영한 키워드 점수.</p><p><b>조각(chunk)</b> 검색 단위로 자른 문서의 일부.</p><p><b>임베딩</b> 글을 의미 공간의 좌표로 바꾼 벡터.</p><p><b>코사인 유사도</b> 두 벡터 방향이 비슷한 정도.</p><p><b>재순위</b> 후보 몇 개만 다시 읽어 순서를 고치는 단계.</p><p><b>MRR</b> 첫 정답 순위의 역수 평균.</p></div></section>`;
 cleanup=RHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${String(index+1).padStart(2,'0')}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=RFigures.render(c.id),caption=art?art.caption:`${c.subtitle} 위치와 크기를 단순화한 개념도입니다.`;
 return `<figure class="concept-diagram">${art?`<div class="figure-art">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${String(index+1).padStart(2,'0')}. ${c.title} · 검색과 RAG`;
 const previous=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${B.chapters[index+1].desc}</small></a>`:'<a href="#chapters">전체 목차 · 다시 볼 장 고르기<small>문서 사이의 관계를 구조로 잇는 법은 다음 책 후보인 지식 그래프에서 이어집니다.</small></a>';
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${String(index+1).padStart(2,'0')} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 1개</span></div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${body}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${c.quiz[1].map((a,i)=>`<button type="button" data-answer="${i}">${i+1}. ${a}</button>`).join('')}<div class="quiz-feedback" role="status" aria-live="polite"></div></section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source)}${cross(c)}</section><nav class="chapter-nav" aria-label="이전·다음 장">${previous}${next}</nav></div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);RLabs[id](el);RGuides.mount(id,el);});
 main.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const ok=+b.dataset.answer===c.quiz[2];main.querySelector('.quiz-feedback').textContent=`${ok?'정답입니다.':'다시 생각해 보세요.'} ${c.quiz[3]}`;});
}
function route(){
 cleanup();cleanup=()=>{};const hash=location.hash.slice(1)||'home',i=B.chapters.findIndex(c=>c.id===hash);
 document.body.classList.remove('menu-open');document.querySelector('#menu').setAttribute('aria-expanded','false');
 if(i>=0)chapter(B.chapters[i],i);else home();
 document.querySelectorAll('[data-chapter]').forEach(a=>{const on=a.dataset.chapter===hash;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(['chapters','sources'].includes(hash))document.getElementById(hash).scrollIntoView();else window.scrollTo(0,0);
}
side();window.addEventListener('hashchange',route);
document.querySelector('#theme').onclick=()=>{const dark=document.documentElement.dataset.theme==='dark';document.documentElement.dataset.theme=dark?'light':'dark';const b=document.querySelector('#theme');b.textContent=dark?'어두운 화면':'밝은 화면';b.setAttribute('aria-label',b.textContent+'으로 전환');};
document.querySelector('#menu').onclick=()=>{const open=document.body.classList.toggle('menu-open');document.querySelector('#menu').setAttribute('aria-expanded',String(open));};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('menu-open');document.querySelector('#menu').setAttribute('aria-expanded','false');}});
route();
})();
