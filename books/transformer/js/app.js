(()=>{
'use strict';
const U=TUI,B=TBook,main=document.querySelector('main');let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측 질문은 조작 전에 읽도록 실험 위에 둔다. */
const info={
 next:['다음 낱말의 확률표 읽기','앞 문장과 온도를 바꾸며 토리가 내는 확률과 손실을 봅니다.','“곰” 하나만 넣으면 토리는 무엇을 몇 %쯤 고를까요? 먹이와 집 중 하나를 고르고 대략의 확률을 적어 두세요.','온도를 0.5와 3으로 바꿔 “곰 먹이”의 꿀 확률이 어떻게 변하는지 보고, 온도가 로짓의 순서를 바꾸는지 설명해 보세요.'],
 similar:['임베딩 이웃 찾기','기준 낱말을 바꾸며 가장 닮은 낱말과 무리별 평균 코사인을 봅니다.','“꿀”의 가장 가까운 이웃은 같은 먹이 무리일까요, 다른 무리일까요? 먼저 짐작해 보세요.','숫자 “3”의 이웃을 보고, 토리의 숫자 임베딩에 순서 구조가 있는지 판단해 보세요. 그 판단이 맞다면 토리는 세기를 어떻게 할 수 있었을지 14장에서 확인합니다.'],
 softlookup:['질문 방향과 길이로 섞는 비율 바꾸기','2차원 질문 화살표로 열쇠 넷에 가중치를 나눠 줍니다.','45도(먹이와 집 사이) 방향이면 두 열쇠의 가중치는 어떻게 될까요? 길이를 0.5에서 8로 키우면 무엇이 변할지도 예측해 보세요.','가중치 하나가 0.9를 넘게 하려면 질문 길이가 최소 얼마여야 하는지 0도 방향에서 찾아보세요.'],
 qktrace:['질문과 열쇠의 내적 따라가기','한 위치의 q가 앞선 칸들의 k와 내적해 가중치가 되는 과정을 표로 봅니다.','목록의 두 번째 “곰”(위치 7)에서 1층 헤드 1은 곰이 있던 위치 2를 볼까요, 다른 칸을 볼까요?','같은 위치에서 헤드를 0층 헤드 2로 바꿔 보고, 두 헤드가 보는 칸이 왜 다른지 한 문장으로 적어 보세요.'],
 mask:['인과 마스크 켜고 끄기','같은 점수표에서 마스크만 바꿔 미래 칸이 가져가는 가중치를 봅니다.','마스크를 끄면 0층 헤드 2는 위치 7에서 미래 칸에 가중치를 많이 줄까요, 거의 주지 않을까요?','1층 헤드 1은 마스크를 꺼도 미래 칸에 거의 주지 않습니다. 0층 헤드 2와 무엇이 다른지 4장의 점수 계산으로 설명해 보세요.'],
 heads:['헤드 여덟 개의 어텐션 표 비교','문장과 헤드를 바꾸며 표의 모양과 요약 점수를 봅니다.','목록 문장에서 바로 앞 칸만 보는 헤드가 몇 개쯤 있을지 먼저 세어 보세요.','세기 문장에서 바로 앞 칸 점수가 가장 큰 헤드를 찾고, 목록 문장의 결과와 같은 헤드인지 확인해 보세요.'],
 lens:['단계마다 출력층에 비춰 보기','잔차 스트림의 다섯 단계에서 마지막 답의 확률을 봅니다.','“3 4 5”의 답 6은 어느 단계에서 처음 50%를 넘을까요? 목록 문장과 같을지 다를지 예측해 보세요.','“고양이 먹이 생선 . 펭귄 집”에서 빙하가 일찍 나타나는 이유를, 이 문장에 무엇이 이미 들어 있는지와 연결해 설명해 보세요.'],
 ov:['헤드가 옮겨 쓰는 낱말 읽기','헤드와 원천 낱말을 바꾸며 출력에서 올라가는 낱말과 자기 순위를 봅니다.','1층 헤드 1이 “꿀”을 보면 꿀이 1위로 올라갈까요? 곰일 때와 같을지 먼저 짐작해 보세요.','1층 헤드 0·1·3 가운데 “숲”을 가장 잘 베끼는 헤드를 찾고, 무리별 평균 순위 표와 맞는지 확인해 보세요.'],
 repeat:['반복 목록과 헤드 지우기','목록의 위치마다 손실을 보고 헤드를 지워 원인을 확인합니다.','0층 헤드 2 하나만 지우면 반복 구간 손실은 찍기(2.89)보다 좋을까요, 나쁠까요?','1층 헤드 0을 지웠을 때 손실이 거의 변하지 않는 이유를, 8장에서 본 헤드 0이 베끼는 낱말 무리와 연결해 보세요. 목록에 집 낱말이 있는 아홉 낱말 목록에서도 확인해 보세요.'],
 neurons:['사실을 꺼내는 뉴런 끄기','효과가 큰 1층 MLP 뉴런부터 하나씩 끄며 정답 확률을 봅니다.','“곰 먹이”의 꿀이 50% 아래로 떨어지려면 뉴런을 몇 개쯤 꺼야 할까요?','“곰 집”과 “펭귄 먹이”에서 확률이 50% 아래로 떨어지는 뉴런 수를 찾아 비교하고, 사실마다 다른 이유를 추측해 보세요.'],
 patching:['부품 하나만 바꿔 끼우기','깨끗한 입력과 망가진 입력 쌍을 고르고, 부품별 회복률을 봅니다.','동물만 바꾼 쌍(곰 ↔ 토끼)에서 가장 많이 되돌릴 부품은 어텐션 헤드일까요, MLP일까요?','세기 쌍(3 4 5 ↔ 3 4 7)의 결과를 보고, 14장의 두 가설 중 어느 쪽을 지지하는지 적어 보세요.'],
 timeline:['학습 체크포인트 넘기기','슬라이더로 학습 단계를 옮기며 손실 곡선과 두 헤드의 어텐션 표를 봅니다.','세기·사실·반복 목록 가운데 토리가 가장 늦게 익히는 것은 무엇일까요?','반복 구간 손실이 1 아래로 처음 내려가는 체크포인트를 찾고, 그때 두 헤드의 표에서 무엇이 새로 보이는지 적어 보세요.'],
 superpose:['2차원에 특징 다섯 개 담기','특징이 꺼져 있을 확률을 바꾸며 담기는 특징 수를 봅니다.','특징이 늘 켜져 있으면 2차원에 몇 개를 담을까요? 거의 꺼져 있으면요?','희소성 0.9에서 담긴 특징들의 화살표 사이 각도를 보고, 두 특징이 동시에 켜지면 무슨 일이 생길지 설명해 보세요.'],
 investigate:['마지막 과제: 부품을 지우며 세기 조사하기','문장과 기대하는 낱말을 정하고 부품을 골라 지웁니다.','헤드 여덟 개를 모두 지우면 “3 4 5” 다음 6의 확률은 얼마나 남을까요? 가설 A와 B가 각각 무엇을 예측하는지 먼저 적으세요.','“2 4 6”과 기대 낱말 8을 넣어 보고, 토리가 왜 실패하는지 지금까지의 증거로 설명하세요. 무엇을 바꾸면 8을 맞힐지, 그 주장을 확인하려면 어떤 증거가 더 필요한지 적어 보세요.']
};
function sourceLinks(ids){return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">트랜스포머 속 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${String(i+1).padStart(2,'0')}</span>${c.title}</a>`).join('');}
function home(){
 document.body.classList.remove('reading');document.title='트랜스포머 속을 열어 보기 · 학습된 작은 모델의 회로를 추적하다';
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">INSIDE A TRAINED TRANSFORMER</div><h1>트랜스포머 속을<br><em>열어 봅니다.</em></h1><p class="lead">직접 학습시킨 작은 언어 모델 ‘토리’는 “곰 먹이” 뒤에 꿀을, 두 번째 “곰” 뒤에 앞에서 본 낱말을 맞힙니다. 어텐션의 질문·열쇠·값부터 유도 헤드와 사실을 꺼내는 뉴런까지, 학습된 가중치를 브라우저에서 계산하며 그 답이 어디서 오는지 추적하세요.</p><div class="hero-links"><a class="button primary" href="#predict">01장부터 읽기</a><a class="button" href="#induction">유도 헤드 실험</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>28,064</b>토리의 매개변수, 전부 공개</span></div><p class="caption">다음 낱말 → 어텐션 → 회로 → 기억과 원인 → 학습과 한계<br>모든 계산은 브라우저 안에서 하며 외부 모델을 부르지 않습니다.</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>모델 하나를 끝까지 열어 봅니다</h2><p>2층 트랜스포머 토리와 세 종류의 학습 문장(사실·세기·반복 목록)이 모든 장에 이어집니다. 각 단계가 아래 장과 연결됩니다.</p></div>${flow(['다음 낱말|확률표와 임베딩 (1~2장)','어텐션|부드러운 찾기·Q·K·V·마스크·멀티헤드 (3~6장)','회로|잔차 스트림·QK와 OV·유도 헤드 (7~9장)','기억과 원인|MLP 뉴런·활성 패칭 (10~11장)','학습과 한계|회로가 생기는 순간·중첩·마지막 과제 (12~14장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 바꾸어 보고, 숫자와 그림으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${String(i+1).padStart(2,'0')} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 질문 중심으로 돌아보세요.</p></div><div class="path-grid"><div class="path"><h3>어텐션을 처음부터 제대로</h3><p>부드러운 찾기에서 질문·열쇠·값, 마스크, 헤드까지 어텐션 한 층을 실제 숫자로 익힙니다.</p><a href="#lookup">03</a><a href="#qkv">04</a><a href="#mask">05</a><a href="#multihead">06</a></div><div class="path"><h3>모델 속을 해석하는 도구</h3><p>렌즈, QK·OV 회로, 절제와 패칭으로 답이 어디서 오는지 추적합니다.</p><a href="#stream">07</a><a href="#qkov">08</a><a href="#patch">11</a><a href="#final">14</a></div><div class="path"><h3>맥락 내 학습은 어떻게 생기나</h3><p>유도 헤드의 두 단계와, 학습 중 그 회로가 갑자기 생기는 순간을 봅니다.</p><a href="#induction">09</a><a href="#training">12</a><a href="#limits">13</a><a href="../aie-transformer/#multihead">깊이 03</a></div></div></section>
 <section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">트랜스포머 원 논문과 해석 가능성 연구의 원문을 확인했습니다. 확인일: 2026-10-12.</p><div class="note">토리와 학습 문장(사실·세기·반복 목록)은 이 책을 위해 만든 것입니다. 1~2장과 4~12장, 14장의 숫자는 학습된 토리의 가중치(소수 넷째 자리로 반올림)를 브라우저에서 실제로 계산한 값입니다. 3장의 부드러운 찾기는 손으로 정한 2차원 교육용 모형이고, 13장의 중첩 실험은 토리와 별개인 장난감 모형을 브라우저에서 실제로 학습시킨 결과입니다. 12장의 학습 기록은 학습 중에 저장한 실제 측정값입니다. 토리는 실제 언어 모델보다 수천에서 수백만 배 작으므로, 이 책의 회로가 큰 모델에 그대로 있다고 볼 수는 없습니다. 같은 현상이 큰 모델에서 보고된 경우 본문에 출처를 적었습니다.</div>${sourceLinks(B.sources.map((_,i)=>i))}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary"><p><b>로짓</b> softmax 전에 낱말마다 내는 점수.</p><p><b>임베딩</b> 낱말을 벡터로 바꾸는 표의 한 줄.</p><p><b>질문·열쇠·값(Q·K·V)</b> 어텐션이 칸 벡터에서 만드는 세 벡터.</p><p><b>인과 마스크</b> 미래 칸의 점수를 지우는 규칙.</p><p><b>잔차 스트림</b> 부품들이 읽고 더해 쓰는 칸마다의 벡터.</p><p><b>로짓 렌즈</b> 중간 스트림을 출력층에 비춰 보는 방법.</p><p><b>QK·OV 회로</b> 어디를 볼지와 무엇을 옮길지를 정하는 행렬 쌍.</p><p><b>유도 헤드</b> 앞에서 본 [A][B]를 찾아 B를 베끼는 헤드.</p><p><b>절제·패칭</b> 부품 출력을 지우거나 다른 실행의 값으로 바꿔 원인을 찾는 실험.</p><p><b>중첩</b> 차원보다 많은 특징을 겹쳐 담는 현상.</p></div></section>`;
 cleanup=THome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${String(index+1).padStart(2,'0')}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}</div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=TFigures.render(c.id),caption=art?art.caption:`${c.subtitle}`;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. data-* 값은 원래 번호다. */
function choices(q,target,attr){return TMath.choiceOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${String(index+1).padStart(2,'0')}. ${c.title} · 트랜스포머 속을 열어 보기`;
 const previous=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${B.chapters[index+1].desc}</small></a>`:'<a href="../aie-transformer/#final">다른 책 · 트랜스포머 깊이 보기 마지막 과제<small>이동 이유: 학습된 모델이 무엇을 하는지 보았으니, 이제 설계자의 자리에서 모델을 어떻게 만들지 판단해 봅니다.</small></a>';
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${String(index+1).padStart(2,'0')} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>앞 장 떠올리기</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${body}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source)}${cross(c)}</section><nav class="chapter-nav" aria-label="이전·다음 장">${previous}${next}</nav></div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);TLabs[id](el);TGuides.mount(id,el);});
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
