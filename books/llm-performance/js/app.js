(()=>{
'use strict';
const U=PUI,B=PBook,main=document.querySelector('main');let cleanup=()=>{};
const info={
 mapping:['원소에 스레드 배정하기','원소 수와 block 크기를 바꾸며 마지막 warp를 봅니다.','원소 100개에 block 크기 32와 128을 쓰면 범위 밖 스레드 수가 같을까요?'],
 sectors:['주소 패턴과 sector','32개 lane의 접근 간격과 시작 위치를 바꿉니다.','간격을 1에서 8로 바꾸기 전에 sector가 몇 개가 될지 예상하세요.'],
 occupancy:['타일이 차지한 자리','타일 크기와 레지스터 수를 바꾸며 자원 상한을 봅니다.','타일 폭32·register128에서 왜 block 하나도 배치하지 못할까요?'],
 fusion:['중간 벡터의 왕복 없애기','길이와 bias를 바꾸며 트래픽 모형과 실제 출력을 비교합니다.','bias만 바꾸면 저장·재적재량도 변할까요?'],
 attention:['어텐션 score 버퍼 비교','문맥과 타일 크기가 각 저장 항목에 주는 영향을 봅니다.','문맥을 네 배로 늘리면 전체 score와 고정 타일은 각각 몇 배가 될까요?'],
 paging:['페이지 크기와 남는 자리','세 요청의 KV를 블록 단위로 할당합니다.','세 번째 요청을 513에서 512로 줄이면 블록16에서 몇 자리가 반환될까요?'],
 schedule:['빈 실행 슬롯 채우기','고정 배치와 단계별 투입의 완료 시각을 비교합니다.','슬롯이 네 개여도 두 정책의 차이가 남을까요?'],
 parallel:['분할 계산에 통신 더하기','GPU 수와 메시지·링크 조건을 바꾸며 전체 시간을 봅니다.','메시지가 커질 때 1 GPU보다 느려지는 다중 GPU 조건을 찾아 설명하세요.'],
 decision:['마지막 과제: 변경 하나 고르기','고정 가상 기록을 지연·메모리·품질 목표와 비교합니다.','TTFT 목표를 500 ms로 강화하면 네 조건을 모두 만족하는 후보가 남을까요?'],

 metrics:['시간 지표를 따로 바꾸기','첫 토큰 대기와 이후 간격이 전체 시간에 주는 영향을 비교합니다.','TTFT를 절반으로 줄이면 전체 시간도 절반이 될까요? 먼저 예상하세요.'],
 timing:['언제 시계를 멈출까','제출 비용과 GPU 계산 비용을 바꾸며 완료 시점을 봅니다.','커널 시간이 절반이 되어도 CPU 제출 시간은 바뀔까요?'],
 pipeline:['두 엔진의 시간표','복사·계산과 실행 방식을 바꾸며 작업 구간을 겹칩니다.','묶음 하나와 여섯 개에서 겹침의 효과가 같을까요?'],
 roofline:['숫자 세 개로 근거 확인하기','이동량·연산량·시간에서 처리율을 계산합니다.','이동량이 4 GB일 때 2 ms라는 기록을 받았다면 어떤 조건부터 확인할까요?']
};
function sourceLinks(ids){return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${a}</b><span>${b}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">추론 최적화 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${String(i+1).padStart(2,'0')}</span>${c.title}</a>`).join('');}
function home(){
 document.body.classList.remove('reading');document.title='LLM 추론은 어디서 느려지는가';
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">LLM PERFORMANCE / VOLUME 02</div><h1>느리다는 관찰에서<br><em>검증한 개선까지.</em></h1><p class="lead">회의록을 요약하는 모델은 메모리에 들어갑니다. 그런데 왜 기다려야 할까요? 시간을 재고, 데이터가 이동하는 길을 조사하고, 근거를 남기며 개선하세요.</p><div class="hero-links"><a class="button primary" href="#metrics">01장부터 읽기</a><a class="button" href="#review">개선안 검증 과제</a></div><div class="stats"><span><b>12</b>장</span><span><b>13</b>실험</span><span><b>2</b>실행 예제</span></div><p class="caption">구현·프로파일링편 · 선행: <a href="../llm-gpu/">LLM 시스템 이해편</a><br>본문 실험은 GPU 설치 없이 동작합니다.</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>같은 요약 요청을 끝까지 조사합니다</h2><p>한 번에 한 조건을 바꾸고, 같은 작업을 비교합니다. 각 단계가 아래 장과 연결됩니다.</p></div>${flow(['측정|지표·완료 시점·타임라인','커널|스레드·접근·자원 제한','메모리|처리율·융합·KV 페이지','서비스|배치·통신·개선안 검증'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>예측하고 조작한 뒤, 숫자가 달라진 이유를 설명해 보세요.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${String(i+1).padStart(2,'0')} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음에는 순서대로 읽고, 다시 읽을 때는 증상이 생긴 곳으로 돌아오세요.</p></div><div class="path-grid"><div class="path"><h3>측정부터 시작한다면</h3><p>지표와 측정 경계를 정하고 trace로 원인을 좁힙니다.</p><a href="#metrics">01</a><a href="#timing">02</a><a href="#timeline">03</a><a href="#evidence">07</a></div><div class="path"><h3>GPU 코드를 읽으려면</h3><p>스레드의 주소와 재사용, 자원 제한을 연결합니다.</p><a href="#threads">04</a><a href="#coalescing">05</a><a href="#tiling">06</a><a href="#fusion">08</a></div><div class="path"><h3>서비스를 운영한다면</h3><p>KV 할당·배치·통신을 보고 변경을 검증합니다.</p><a href="#paging">09</a><a href="#batching">10</a><a href="#parallel">11</a><a href="#review">12</a></div></div></section>
 <section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">공식 문서와 원 논문을 2026-10-08에 확인했습니다.</p><div class="note">브라우저 실험은 산술·스케줄 계산 또는 명시한 가상 기록입니다. 실제 LLM 벤치마크나 GPU 에뮬레이터가 아닙니다. NVIDIA CUDA의 실행 모델을 기준으로 하며 다른 하드웨어의 세부 수치는 다릅니다. <a href="examples/index.html">PyTorch·CUDA 실행 예제</a>에서 실제 장비로 이어갈 수 있습니다. 오픈웨이트 모델의 revision·정밀도·문맥·모드도 함께 기록하세요.</div>${sourceLinks(B.sources.map((_,i)=>i))}<p>독자의 실제 학습 효과와 장비별 최적 설정은 아직 검증하지 않았습니다. 제작·검증 범위는 <a href="docs/index.html">프로젝트 문서</a>에 남겼습니다.</p></section>`;
 cleanup=PHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${String(index+1).padStart(2,'0')}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=PFigures.render(c.id),caption=art?art.caption:`${c.subtitle} 위치와 크기를 단순화한 개념도입니다.`;
 return `<figure class="concept-diagram">${art?`<div class="figure-art">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${String(index+1).padStart(2,'0')}. ${c.title} · 추론 최적화`;
 const previous=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>${B.chapters[index+1].desc}</small></a>`:'<a href="#chapters">전체 목차 · 궁금한 원리 다시 살펴보기</a>';
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${String(index+1).padStart(2,'0')} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 1개</span></div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${c.details.map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${body}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${c.quiz[1].map((a,i)=>`<button type="button" data-answer="${i}">${i+1}. ${a}</button>`).join('')}<div class="quiz-feedback" role="status" aria-live="polite"></div></section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source)}${cross(c)}</section><nav class="chapter-nav" aria-label="이전·다음 장">${previous}${next}</nav></div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);PLabs[id](el);PGuides.mount(id,el);});
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
