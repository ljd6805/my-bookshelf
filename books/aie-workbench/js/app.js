/* 해시 경로로 표지(#home·#chapters·#sources)와 장(#장ID)을 그린다. 글은 모두 content.js에 있다.
   화면 구조는 docs/08-book-template.html(AI Book 기준)을 따른다. */
(()=>{
'use strict';
const U=A01UI,B=A01Book,M=B.meta,info=B.info,main=document.querySelector('main');let cleanup=()=>{};
const two=i=>String(i+1).padStart(2,'0');
function sourceLinks(ids){return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${a}</b><span>${b}</span></div>`;}).join('')}</div>`;}
function cross(c){if(!c.cross||!c.cross.length)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list cross-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><br><span class="caption">이동 이유: ${why}</span></li>`).join('')}</ul>`;}
function side(){document.querySelector('#sidebar').innerHTML=`<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">${M.short} 처음으로</a>`+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${two(i)}</span>${c.title}</a>`).join('');}
function series(){const s=M.series;if(!s)return '';return `<div class="series-nav"><span class="eyebrow">SERIES · ${s.name} ${String(s.no).padStart(2,'0')} / ${s.total}</span>${s.prev?`<a href="${s.prev[0]}">이전 권 · ${s.prev[1]}</a>`:''}${s.next?`<a href="${s.next[0]}">다음 권 · ${s.next[1]}</a>`:''}<a href="../../index.html#curation">서가의 읽기 노선 보기</a></div>`;}
function home(){
 document.body.classList.remove('reading');document.title=M.title;
 const labs=B.chapters.reduce((n,c)=>n+c.labs.length,0);
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">${M.eyebrow}</div><h1>${M.hero[0]}<br><em>${M.hero[1]}</em></h1><p class="lead">${M.lead}</p><div class="hero-links"><a class="button primary" href="#${B.chapters[0].id}">01장부터 읽기</a><a class="button" href="#${M.feature[0]}">${M.feature[1]}</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>${M.stat[0]}</b>${M.stat[1]}</span></div>${series()}</div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>${M.flowTitle}</h2><p>${M.flowLead} 각 단계가 아래 장과 연결됩니다.</p></div>${flow(M.flow)}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>예상하고, 직접 바꾸어 보고, 숫자와 그림으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${two(i)} / ${c.group}</span>${U.thumbnail(c,i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음이라면 순서대로, 궁금한 질문이 있다면 그 질문에서 출발하세요.</p></div><div class="path-grid">${M.paths.map(p=>`<div class="path"><h3>${p.title}</h3><p>${p.desc}</p>${p.chapters.map(id=>`<a href="#${id}">${two(B.chapters.findIndex(c=>c.id===id))}</a>`).join('')}</div>`).join('')}</div></section>
 <section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">${M.sourcesLead}</p><div class="note">${M.note}</div>${sourceLinks(B.sources.map((_,i)=>i))}${M.glossary?`<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary">${M.glossary.map(([a,b])=>`<p><b>${a}</b> ${b}</p>`).join('')}</div>`:''}</section>`;
 cleanup=A01Home.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${two(index)}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function figure(c,index){const art=A01Figures.render(c);return `<figure class="concept-diagram"><div class="figure-art">${art.svg}</div>${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${art.caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${two(index)}. ${c.title} · ${M.short}`;
 const prev=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>${B.chapters[index+1].desc}</small></a>`:`<a href="#chapters">전체 목차 · 궁금한 장 다시 살펴보기</a>`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${two(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 1개</span></div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(([t,body])=>`<div class="deep-reading"><h3>${t}</h3>${body}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${c.quiz[1].map((a,i)=>`<button type="button" data-answer="${i}">${i+1}. ${a}</button>`).join('')}<div class="quiz-feedback" role="status" aria-live="polite"></div></section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source)}${cross(c)}</section><nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav></div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);A01Labs[id](el);A01Guides.mount(id,el);});
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
