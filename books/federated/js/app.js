(()=>{
'use strict';
const U=FLUI,B=FLBook,T=FLLabText,main=document.querySelector('main');let cleanup=()=>{};
const BOOK_TITLE='연합학습 · 데이터를 기기에 두고 업데이트만 모아 모델 학습하기',SHORT='연합학습';
function sourceLinks(ids){return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML=`<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">${SHORT} 처음으로</a>`+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${String(i+1).padStart(2,'0')}</span>${c.title}</a>`).join('');}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">FEDERATED LEARNING</div><h1>데이터는 기기에,<br><em>업데이트만 서버로.</em></h1><p class="lead">${B.intro}</p><div class="hero-links"><a class="button primary" href="#why">01장부터 읽기</a><a class="button" href="#fedavg">FedAvg 실험</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>1,000</b>합성 사용자</span></div><p class="caption">FedAvg와 통신 → 기기와 데이터의 차이 → 업데이트가 드러내는 것과 막는 법 → 개인화·평가·배포 → 마지막 과제<br>모든 계산은 브라우저 안에서 하며 외부 서버를 부르지 않습니다.</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>원문을 모으지 않고 다음 단어 추천을 학습하는 과정을 계산합니다</h2><p>하린과 사용자 1,000명(이 책을 위해 지어낸 합성 자료)이 모든 장에 이어지고, 마지막 과제에서 하린이 출시 설정을 정합니다.</p></div>${flow(B.parts)}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 설정을 바꾸어 보고, 정확도·바이트·ε로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${String(i+1).padStart(2,'0')} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 질문 하나를 골라 그 장들만 돌아보세요.</p></div><div class="path-grid">${B.paths.map(([title,desc,links])=>`<div class="path"><h3>${title}</h3><p>${desc}</p>${links.map(([href,label])=>`<a href="${href}">${label}</a>`).join('')}</div>`).join('')}</div></section>
 <section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">${B.sourcesLead}</p><div class="note">${B.boundary}</div>${sourceLinks(B.sources.map((_,i)=>i))}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary">${B.glossary.map(([w,d])=>`<p><b>${w}</b> ${d}</p>`).join('')}</div></section>`;
 cleanup=FLHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task,kind]=T[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${String(index+1).padStart(2,'0')}</span><h3>${title}</h3><small class="lab-kind">${kind||'실제 계산 · 합성 사용자 1,000명(씨앗 7)'}</small></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}</div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li>${url?`<a href="${url}">${name}</a>`:`<span>${name}</span>`}<p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=FLFigures.render(c.id),caption=art?art.caption:c.subtitle;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. data-* 값은 원래 번호다. */
function choices(q,target,attr){return FLMath.choiceOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${String(index+1).padStart(2,'0')}. ${c.title} · ${SHORT}`;
 const previous=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${B.chapters[index+1].desc}</small></a>`:`<a href="${B.after[0]}">다른 책 · ${B.after[1]}<small>이동 이유: ${B.after[2]}</small></a>`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${String(index+1).padStart(2,'0')} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>앞 장 떠올리기</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${body}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source)}${cross(c)}</section><nav class="chapter-nav" aria-label="이전·다음 장">${previous}${next}</nav></div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);FLLabs[id](el);FLGuides.mount(id,el);});
 main.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const ok=+b.dataset.answer===c.quiz[2];main.querySelector('.quiz-feedback').textContent=`${ok?'정답입니다.':'다시 생각해 보세요.'} ${c.quiz[3]}`;});
 main.querySelectorAll('[data-transfer]').forEach(b=>b.onclick=()=>{const ok=+b.dataset.transfer===c.transfer[2];main.querySelector('.transfer-feedback').textContent=`${ok?'정답입니다.':'다시 생각해 보세요.'} ${c.transfer[3]}`;});
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
