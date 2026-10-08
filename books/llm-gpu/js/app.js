(()=>{
'use strict';
const U=GUI,B=GBook,main=document.querySelector('main');let cleanup=()=>{};
const info={
 bundle:['모델 구성요소 펼쳐 보기','네 구성요소의 역할을 선택하며 구분합니다.','가중치를 그대로 두고 토크나이저만 임의로 바꾸면 왜 문제가 생길지 설명해 보세요.'],
 params:['층의 폭과 개수로 숫자 세기','폭과 층 수를 바꾸며 학습 가능한 숫자를 셉니다.','폭 4·층 2개와 폭 8·층 1개 중 어느 쪽이 클지 먼저 예상하세요.'],
 weights:['가중치 용량 계산하기','모델 크기와 저장 bit를 바꾸며 GB와 GiB를 함께 봅니다.','32B·4bit와 8B·16bit의 저장량은 같을까요?'],
 quant:['정밀도를 줄여 보기','같은 숫자를 더 적은 눈금으로 표현합니다.','2bit를 8bit로 바꾸면 어떤 값이 달라지고 무엇은 이 실험에서 알 수 없을까요?'],
 journey:['한 요청의 데이터 경로','단계를 옮기며 가중치·입력·출력의 이동을 따라갑니다.','첫 로드 이후 decode에서 PCIe를 반드시 건너야 하는 데이터와 GPU 내부 데이터를 구분해 보세요.'],
 hierarchy:['GPU 안으로 한 단계씩','메모리 접근과 타일 재사용의 한 가지 경로를 살펴봅니다.','KV 캐시는 이 그림의 어느 큰 저장소에 텐서로 놓일 수 있을까요?'],
 matrix:['같은 행렬곱, 적은 중복 적재','타일 크기를 바꾸고 결과와 데이터 적재 횟수를 비교합니다.','타일을 1에서 4로 키우기 전에 Y[0,0]과 적재 횟수가 각각 변할지 예상하세요.'],
 phases:['과거 토큰을 다시 계산한다면','생성 길이를 늘리며 새로 투영하는 위치 수를 비교합니다.','출력 하나일 때 KV 사용 유무의 차이가 왜 없을까요?'],
 cache:['문맥과 동시 요청의 가격','층과 차원은 고정하고 문맥·요청·KV head를 바꿉니다.','문맥을 절반으로 줄이고 요청을 두 배로 늘리면 KV 용량은 어떻게 될까요?'],
 roofline:['병목 바꾸어 보기','가상의 유효 대역폭·연산 처리량·배치가 시간 하한에 주는 영향을 봅니다.','연산 두 배 버튼을 누르기 전에 단계 시간도 절반이 될지 예측하세요.'],
 moe:['전체와 활성 파라미터 분리하기','전체 expert 수와 토큰당 선택 수를 따로 조절합니다.','선택 수를 고정하고 전체 expert만 네 배로 늘리면 저장량과 활성량은 어떻게 달라질까요?'],
 transfer:['옮기는 시간 계산하기','전송량과 링크 대역폭을 바꾸며 단순 전송 시간을 봅니다.','4 GB를 32 GB/s로 매 토큰마다 옮긴다면 전송만으로 100 tokens/s가 가능할까요?'],
 cards:['공식 사양으로 두 모델 비교하기','같은 문맥·정밀도에서 가중치와 KV의 크기를 나누어 봅니다.','더 큰 모델을 선택할 때 어느 막대가 커지고 어느 막대가 작아질지 먼저 예상하세요.'],
 budget:['최종 과제: 24 GiB에 맞추기','가중치·KV·실행 여유를 합산하며 실행 조건을 설계합니다.','과제 시작 조건에서 변수 하나만 바꾸어 용량 예산을 만족시키고, 바꾼 조건의 대가를 설명하세요.']
};
function sourceLinks(ids){return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${a}</b><span>${b}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">LLM 시스템 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${String(i+1).padStart(2,'0')}</span>${c.title}</a>`).join('');}
function home(){
 document.body.classList.remove('reading');document.title='LLM은 컴퓨터에서 어떻게 실행되는가';
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">INSIDE LLM SYSTEMS / 01</div><h1>모델 파일에서<br><em>다음 토큰까지.</em></h1><p class="lead">수십억 개의 숫자가 메모리에 올라가고, GPU가 읽고 계산하고, 답변이 나옵니다. 데이터의 이동을 따라가며 내 장비의 한계를 이해하세요.</p><div class="hero-links"><a class="button primary" href="#files">01장부터 읽기</a><a class="button" href="#design">메모리 예산 실험</a></div><div class="stats"><span><b>12</b>장</span><span><b>14</b>인터랙티브 실험</span><span><b>2</b>공식 모델 사례</span></div><p class="caption">시스템 이해편 · 원리 → 실행 → 제약 → 선택<br>장비나 모델 설치 없이 읽고 실험할 수 있습니다.</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>한 질문을 끝까지 따라갑니다</h2><p>“오늘 회의 내용을 요약해 줘.” 각 단계가 아래 장과 연결됩니다.</p></div>${flow(['모델의 실체|파일·파라미터·저장량','응답의 과정|CPU·GPU·텐서 연산','하드웨어 제약|KV·대역폭·전송','실제 선택|사양 읽기·실행 예산'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>예상하고, 바꾸어 보고, 숫자와 그림으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${String(i+1).padStart(2,'0')} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 질문 중심으로 돌아보세요.</p></div><div class="path-grid"><div class="path"><h3>모델 크기가 궁금하다면</h3><p>B·bit·KV를 구분하고 전체 메모리를 계산합니다.</p><a href="#parameters">02</a><a href="#weights">03</a><a href="#cache">08</a><a href="#design">12</a></div><div class="path"><h3>GPU 내부를 이해하려면</h3><p>데이터 이동, 저장소, 연산과 생성의 반복을 따라갑니다.</p><a href="#journey">04</a><a href="#hierarchy">05</a><a href="#transformer">06</a><a href="#phases">07</a></div><div class="path"><h3>오픈웨이트를 고르려면</h3><p>느린 원인과 구조 차이를 구분한 뒤 실제 사양을 읽습니다.</p><a href="#bottleneck">09</a><a href="#tradeoffs">10</a><a href="#modelcards">11</a><a href="#design">12</a></div></div></section>
 <section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">NVIDIA·Hugging Face·MLX의 공식 문서와 원 논문을 확인했습니다. 공식 자료 확인일: 2026-10-08.</p><div class="note">본문은 NVIDIA 분리형 GPU의 일반적인 autoregressive 추론을 기준으로 합니다. 가상 8B 모델과 실제 Qwen 사례를 구분합니다. 모든 실험은 브라우저의 교육용 계산 또는 명시된 시나리오이며 실제 LLM·GPU 벤치마크가 아닙니다. 입력을 외부 모델로 보내지 않습니다. 구현·프로파일링·분산 학습은 후속 심화편 후보입니다.</div>${sourceLinks(B.sources.map((_,i)=>i))}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary"><p><b>파라미터</b> 학습으로 정해지는 숫자.</p><p><b>텐서</b> 모양과 자료형을 가진 수치 배열.</p><p><b>활성값</b> 이번 입력을 계산하며 생긴 중간 결과.</p><p><b>커널</b> GPU에서 실행하는 함수.</p><p><b>KV 캐시</b> 과거 토큰의 Key·Value 저장 상태.</p><p><b>대역폭</b> 단위 시간에 옮기는 데이터량.</p><p><b>FLOP</b> 부동소수점 연산 횟수.</p><p><b>FLOP/s</b> 초당 부동소수점 연산 처리량.</p></div></section>`;
 cleanup=GHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${String(index+1).padStart(2,'0')}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${String(index+1).padStart(2,'0')}. ${c.title} · LLM 시스템`;
 const previous=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>${B.chapters[index+1].desc}</small></a>`:'<a href="#chapters">전체 목차 · 궁금한 원리 다시 살펴보기</a>';
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${String(index+1).padStart(2,'0')} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 1개</span></div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}<figure class="concept-diagram">${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${c.subtitle} 위치와 크기를 단순화한 개념도입니다.</figcaption></figure><div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${c.details.map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${body}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${c.quiz[1].map((a,i)=>`<button type="button" data-answer="${i}">${i+1}. ${a}</button>`).join('')}<div class="quiz-feedback" role="status" aria-live="polite"></div></section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source)}${cross(c)}</section><nav class="chapter-nav" aria-label="이전·다음 장">${previous}${next}</nav></div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);GLabs[id](el);GGuides.mount(id,el);});
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
