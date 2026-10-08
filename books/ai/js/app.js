(()=>{
'use strict';
const U=AIUI,B=AIBook,main=document.querySelector('main');let cleanup=()=>{};
const info={
neuron:['뉴런의 판단 조절하기','가중치와 편향을 바꾸고 출력 곡선이 어떻게 이동하는지 살펴보세요.','w₁을 음수로 바꾸면 입력이 증가할 때 출력은 어떻게 될까요?'],
activation:['활성화 함수 비교하기','같은 입력을 서로 다른 함수에 통과시킵니다.','sigmoid에서 입력을 1에서 2로, 4에서 5로 바꿀 때 출력 변화량을 비교하세요.'],
regression:['데이터에 직선 맞추기','주황 점에 청록색 직선이 가까워지도록 기울기와 절편을 움직여 보세요.','MSE를 0.05보다 작게 만들어 보세요.'],
descent:['한 걸음씩 경사하강법','파라미터가 손실 곡선을 따라 이동하는 과정을 관찰합니다.','학습률을 1.1로 설정하고 10번 학습하면 수렴할까요?'],
overfit:['훈련 점을 모두 맞히면?','직선에서 모든 훈련 점을 통과하는 보간 곡선으로 연속적으로 바꿉니다.','훈련 오차가 0에 가까워질 때 검증 오차도 가장 작아지는지 확인하세요.'],
bpe:['BPE 병합 실험','반복되는 인접 문자 쌍을 하나씩 합칩니다.','병합 횟수 0과 8에서 조각 수와 반복되는 조각을 비교하세요.'],
embedding:['벡터의 방향과 유사도','주황색 A를 기준으로 청록색 B의 방향과 길이를 조절합니다.','각도를 90°로 맞춘 뒤 길이만 바꿔 보세요.'],
attention:['Q·K로 가중치 만들기','Query가 바뀌면 어떤 Key의 비중이 커지는지 관찰합니다.','Query=[0,0]이면 네 가중치가 어떻게 될까요?'],
mask:['미래 토큰 가리기','모든 위치를 보는 행렬과 인과 마스크를 적용한 행렬을 비교합니다.','Query 위치 1에서는 몇 개의 Key를 참고할 수 있나요?'],
temperature:['확률 분포의 온도','같은 로짓에 temperature만 다르게 적용합니다.','T=0.1과 T=2.5의 최고 확률과 엔트로피를 비교하세요.'],
sampling:['후보를 줄이고 추출하기','Top-k와 Top-p를 번갈아 적용한 뒤 확률에 따라 후보를 추출합니다.','top-k=1에서 100회 추출하면 결과가 얼마나 다양할까요?'],
convolution:['픽셀에 필터 적용하기','7×7 픽셀을 클릭해 바꾸고 5×5 출력의 변화를 관찰합니다.','모두 지운 뒤 중앙 픽셀 하나만 켜고 두 커널의 결과를 비교하세요.'],
reward:['무엇을 보상할 것인가','유용성과 간결성의 비중에 따라 세 응답의 선택 확률이 바뀝니다.','평가 비중을 0과 1로 바꾼 뒤 β를 높이면 분포는 어떻게 바뀔까요?'],
quantization:['비트를 줄이는 대가','같은 숫자를 2·4·8 bit로 표현하며 오차를 확인합니다.','4 bit에서 8 bit로 바꿨을 때 MSE는 어떻게 변하나요?'],
memory:['추론 메모리 계산기','가중치 정밀도와 문맥 길이를 바꾸며 필요한 메모리의 부분 합계를 봅니다.','모델 크기를 고정하고 문맥 길이만 두 배로 늘려 보세요.'],
retrieval:['근거 문서 찾아보기','작은 문서 집합에서 질문과 겹치는 키워드를 찾아 순위를 매깁니다.','“우주선”을 검색하면 어떤 결과가 나와야 할까요?'],
agent:['도구 실행 흐름 따라가기','요청·행동·관찰·종료를 한 단계씩 진행합니다.','검색 도구의 첫 호출을 실패시키고 재시도 뒤의 흐름을 확인하세요.'],
evaluation:['임계값과 평가 지표','이상 판단의 문턱을 움직이고 오경보와 놓친 이상을 비교합니다.','이상을 한 건도 놓치지 않으려면 오경보를 얼마나 감수해야 할까요?']
};
function sourceLinks(ids){return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${a}</b><span>${b}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">AI Book 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${String(i+1).padStart(2,'0')}</span>${c.title}</a>`).join('');}
function home(){
 document.body.classList.remove('reading');document.title='AI Book · 직접 실험하는 AI 교과서';
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">An interactive field guide to AI</div><h1>숫자 하나에서<br><em>생각하는 도구까지.</em></h1><p class="lead">AI를 이해하는 가장 좋은 방법은 직접 바꿔 보는 것입니다. 가중치를 움직이고, 확률을 고르고, 도구를 실행하며 원리를 확인하세요.</p><div class="hero-links"><a class="button primary" href="#neuron">01장부터 읽기</a><a class="button" href="#attention">어텐션 실험하기</a></div><div class="stats"><span><b>12</b>챕터</span><span><b>18</b>인터랙티브 실험</span><span><b>0</b>외부 API 호출</span></div></div><div class="hero-lab" id="home-network"></div></section><section class="section"><div class="section-heading"><h2>AI의 흐름을 한눈에</h2><p>입력을 숫자로 바꾸고, 학습된 계산을 거쳐, 결과를 검증합니다. 각 단계가 아래의 챕터와 연결됩니다.</p></div>${flow(['입력|문장·이미지·센서','표현|토큰·벡터','모델|학습·어텐션','출력|생성·도구 사용','검증|근거·평가'])}</section><section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>개념을 읽고, 그림을 보고, 직접 실험한 뒤 확인 문제로 마무리하세요.</p></div><h2>전체 챕터</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${String(i+1).padStart(2,'0')} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section><section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음부터 순서대로 읽거나, 지금 궁금한 질문에서 출발해도 좋습니다.</p></div><div class="path-grid"><div class="path"><h3>AI가 처음이라면</h3><p>숫자 계산과 학습을 이해한 뒤 문장을 다루는 방법으로 넘어갑니다.</p><a href="#neuron">01</a><a href="#learning">02</a><a href="#generalization">03</a><a href="#tokens">04</a></div><div class="path"><h3>LLM의 내부가 궁금하다면</h3><p>토큰이 어텐션을 거쳐 다음 토큰의 확률이 되는 흐름을 따라갑니다.</p><a href="#tokens">04</a><a href="#embeddings">05</a><a href="#attention">06</a><a href="#generation">07</a></div><div class="path"><h3>업무에 적용한다면</h3><p>장비의 제약, 근거 검색, 도구 실행과 평가를 연결합니다.</p><a href="#inference">10</a><a href="#rag">11</a><a href="#agents">12</a></div></div></section><section class="section" id="sources"><h2>읽을거리와 실험의 경계</h2><p class="lead">원 논문과 공식 교육 자료를 바탕으로 개념을 설명했습니다. 실험에는 계산식, 가정과 생략한 부분을 함께 적었습니다.</p>${sourceLinks(B.sources.map((_,i)=>i))}<div class="note">모든 실험은 브라우저 안에서 실행됩니다. API 키나 로그인이 필요하지 않으며, 입력한 문장을 외부 모델로 보내지 않습니다. 이 사이트는 교육용 수치 모형이며 실제 모델의 성능을 측정하지 않습니다.</div></section>`;
 cleanup=AIHomeNetwork.mount(document.querySelector('#home-network'));
}
function renderLab(id,index){const [title,desc,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${String(index+1).padStart(2,'0')}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${String(index+1).padStart(2,'0')}. ${c.title} · AI Book`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${String(index+1).padStart(2,'0')} / ${c.group}</div><h1>${c.title}</h1><p class="lead">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 1개</span></div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}<figure class="concept-diagram">${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${c.title}의 핵심 관계를 순서대로 정리했습니다.</figcaption></figure><div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div></section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${c.quiz[1].map((a,i)=>`<button data-answer="${i}">${i+1}. ${a}</button>`).join('')}<div class="quiz-feedback" role="status" aria-live="polite"></div></section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source)}</section><nav class="chapter-nav" aria-label="이전·다음 챕터">${index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">전체 교과서</a>'}${index<11?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}</a>`:'<a href="#chapters">목차로 돌아가기</a>'}</nav></div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);AILabs[id](el);AIGuides.mount(id,el);});
 main.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const correct=+b.dataset.answer===c.quiz[2];main.querySelector('.quiz-feedback').textContent=`${correct?'정답입니다.':'다시 생각해 보세요.'} ${c.quiz[3]}`;});
}
function route(){
 cleanup();cleanup=()=>{};const hash=location.hash.slice(1)||'home',index=B.chapters.findIndex(c=>c.id===hash);
 document.body.classList.remove('menu-open');document.querySelector('#menu').setAttribute('aria-expanded','false');
 if(index>=0)chapter(B.chapters[index],index);else home();
 document.querySelectorAll('[data-chapter]').forEach(a=>{const active=a.dataset.chapter===hash;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(hash==='chapters'||hash==='sources')document.getElementById(hash).scrollIntoView();else window.scrollTo(0,0);
}
side();window.addEventListener('hashchange',route);
document.querySelector('#theme').onclick=()=>{const root=document.documentElement,dark=root.dataset.theme==='dark';root.dataset.theme=dark?'light':'dark';const b=document.querySelector('#theme');b.textContent=dark?'어두운 화면':'밝은 화면';b.setAttribute('aria-label',b.textContent+'으로 전환');if(document.querySelector('#network'))document.querySelector('#signal').dispatchEvent(new Event('input'));};
document.querySelector('#menu').onclick=()=>{const open=document.body.classList.toggle('menu-open');document.querySelector('#menu').setAttribute('aria-expanded',String(open));};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('menu-open');document.querySelector('#menu').setAttribute('aria-expanded','false');}});
route();
})();
