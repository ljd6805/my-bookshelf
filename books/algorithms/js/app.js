(()=>{
'use strict';
const U=ALUI,B=ALBook,main=document.querySelector('main');let cleanup=()=>{};
const NAME='찾고 정렬하고 잇기';
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측 질문은 조작 전에 읽도록 실험 위에 둔다. */
const info={
 count:['책 수를 바꾸며 단계 세기','할 일과 책 수를 바꾸며 실제로 센 단계와 n 선을 견줍니다.','책이 1,000권에서 2,000권이 되면 중복 등록 찾기의 단계는 몇 배가 될까요? 반씩 줄이기는요? 두 숫자를 먼저 적어 두세요.','세 가지 일을 2,000권에서 세어 보고, 1만 권과 100만 권일 때 각각 몇 단계일지 규모 장부 줄을 읽어 적어 보세요. 100만 권에서 중복 찾기가 왜 쓸 수 없는 방법인지 한 문장으로 설명해 보세요.'],
 ops:['배열과 연결 리스트의 비용','같은 일을 두 구조로 하며 옮긴 칸과 따라간 연결을 셉니다.','길이 1,000인 대출 목록에서 맨 앞에 한 권을 끼울 때, 배열과 연결 리스트는 각각 몇 단계일까요?','네 가지 일 가운데 두 구조의 합계가 거의 같은 일을 찾고, 그 이유를 “그 자리까지 가는 비용”이라는 말로 설명해 보세요.'],
 cart:['반납 카트와 예약 대기열','들어오는 책과 처리하는 책의 속도를 바꾸며 누가 오래 기다리는지 봅니다.','차례마다 2권이 들어오고 1권만 처리한다면, 스택에서 1번 책은 언제쯤 나올까요?','들어옴과 처리를 같게(1과 1) 맞추면 두 상자의 결과가 같아지는지 확인하고, 예약 명단에 큐를 써야 하는 이유를 설명해 보세요.'],
 sort:['세 정렬의 비교 횟수와 하한','서가 상태와 책 수를 바꾸며 세 정렬의 비교 횟수를 하한선과 견줍니다.','이미 정렬된 서가 128권에서 가장 적게 견주는 방법은 셋 중 무엇일까요? 하한(717번)보다 적게 나올 수 있을까요?','뒤섞인 서가에서 책 수를 64, 128, 256으로 바꾸며 병합 정렬의 비교 수가 하한에 얼마나 붙어 있는지 보고, 하한보다 적은 칸이 나온 서가는 왜 가능한지 설명해 보세요.'],
 bsearch:['범위를 반씩 줄이기','서가 크기와 찾는 책의 자리를 바꾸며 이진 탐색이 지나간 범위를 봅니다.','1만 권에서 100만 권으로 늘리면 비교는 몇 번 늘까요? 찾는 책이 맨 앞에 있으면 더 빨리 끝날까요?','서가를 100만 권으로 두고 자리를 0%, 50%, 100%로 바꿔 비교 횟수가 20번을 넘는 자리가 있는지 찾아보세요.'],
 tree:['넣는 순서와 트리 높이','넣는 순서와 트리 종류를 바꾸며 높이와 평균 깊이를 봅니다.','청구기호 순서대로 31권을 그냥 트리에 넣으면 높이는 몇이 될까요?','255권에서 그냥 트리와 AVL의 평균 깊이를 견주고, 100만 권이라면 두 트리에서 한 권을 찾는 데 각각 몇 번쯤 걸릴지 어림해 보세요.'],
 hash:['부하율과 두 배 늘리기','넣는 책 수, 늘리는 기준, 늘리기 여부를 바꾸며 찾기와 넣기 비용을 봅니다.','칸 8개로 시작해 늘리지 않고 2,000권을 넣으면 한 권을 찾을 때 평균 몇 번 확인할까요?','늘리는 기준 α를 0.5와 3으로 바꿔 보고, 찾기가 빨라지는 쪽과 다시 나누는 횟수가 줄어드는 쪽이 어떻게 맞바뀌는지 설명해 보세요.'],
 heap:['인기 책 k권 고르기','책 수와 k를 바꾸며 세 방법의 비교 횟수를 견줍니다.','책 2,000권에서 인기 10권을 고를 때, 힙은 전체 정렬보다 몇 배쯤 적게 견줄까요?','k를 1, 10, 50으로 바꿔 세 막대의 순위가 바뀌는 지점을 찾고, k가 커질 때 “가장 큰 것을 k번 찾기”가 왜 가장 비싸지는지 설명해 보세요.'],
 graph:['분관 지도를 큐와 스택으로 돌기','출발 분관과 상자를 바꾸며 방문 순서와 차례를 기다리는 분관을 봅니다.','본관에서 BFS로 돌면 세 번째로 방문하는 분관은 어디일까요? DFS라면요?','방문한 분관 수를 3에 두고 BFS와 DFS를 번갈아 바꿔, 세 번째 방문지와 차례를 기다리는 분관이 어떻게 다른지 비교하고 그 차이를 큐와 스택으로 설명해 보세요.'],
 route:['배송 경로 세 가지 방법','출발·도착과 길 고르는 방법을 바꾸며 경로와 걸린 시간을 견줍니다.','본관에서 호수 분관까지, 도로 수가 가장 적은 길이 가장 빠른 길일까요?','본관→학교를 세 방법으로 구해 보고, 눈앞 탐욕이 왜 43분을 도는지 지나간 분관 순서로 설명해 보세요.'],
 edit:['편집 거리 표 채우기','입력한 제목과 가장 가까운 책을 찾고, 두 제목의 편집 거리 표를 봅니다.','“별을 새는 고양이”와 「별을 세는 고양이」의 편집 거리는 얼마일까요? “바다로 가는 기차”는요?','“고양이 탐정”을 넣고 표의 오른쪽 아래 칸과 그 왼쪽·위·왼쪽 위 칸의 값을 읽어, 거리가 4인 이유를 고친 내용으로 설명하고, 목록이 100만 권이면 칸이 몇 개일지 어림해 보세요.'],
 invert:['훑기 대 역색인','서가 크기와 찾는 낱말을 바꾸며 두 방법의 단계를 견줍니다.','10만 권에서 흔한 낱말 ‘고양이’로 찾으면 역색인이 훑기보다 100배 빠를까요?','‘등대’와 ‘고양이’를 1만 권과 10만 권에서 각각 찾아, 역색인의 단계가 서가 크기와 목록 길이 가운데 무엇을 따라가는지 설명해 보세요.'],
 ann:['격자로 가까운 책 찾기','격자 칸 수와 살펴볼 범위, 질문 위치를 바꾸며 계산량과 재현율을 봅니다.','격자를 32×32로 잘게 나누고 질문 칸만 보면, 계산은 줄겠지만 1위는 얼마나 자주 맞힐까요?','재현율이 95% 이상이면서 평균 거리 계산이 가장 적은 설정을 찾고, 그 설정이 왜 둘레 칸을 필요로 하는지 설명해 보세요.'],
 design:['마지막 과제: 질문마다 자료구조 고르기','도서관 규모와 다섯 질문의 자료구조를 바꾸며 하루 단계 수를 어림합니다.','1만 권에서 하루 3초 남짓인 지금 설계가 100만 권이 되면 하루 몇 초를 쓸까요? 다섯 질문 가운데 가장 비싼 것은 무엇일까요?','막대가 가장 큰 질문부터 하나씩 바꾸며 하루 합계가 줄어드는 순서를 적으세요. 가장 좋은 조합에서도 남는 가장 큰 비용은 무엇이고, 그것을 더 줄이려면 어떤 증거(실제 질문 기록, 대출이 바뀌는 빈도, 오타 후보 비율)가 필요한지 적어 보세요.']
};
function sourceLinks(ids){return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML=`<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">${NAME} 처음으로</a>`+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${String(i+1).padStart(2,'0')}</span>${c.title}</a>`).join('');}
/* 규모 장부: 장마다 1만 권 → 100만 권일 때의 단계 한 줄. 마지막 장은 지금까지의 장부 전체를 보여 준다. */
function ledgerLine(id){const r=ALMath.ledgerRow(id);return `<tr><td>${U.esc(r.label)}</td><td>${U.big(r.small)}</td><td>${U.big(r.large)}</td><td>${r.ratio<1.05?'거의 그대로':U.big(r.ratio)+'배'}</td></tr>`;}
function ledger(c,index){
 const ids=c.id==='final'?Object.keys(ALMath.LEDGER):[c.id];
 return `<div class="ledger"><h3>규모 장부${c.id==='final'?' · 1~10장 모음':` · ${String(index+1).padStart(2,'0')}장의 한 줄`}</h3><div class="table-wrap"><table><tr><th>일</th><th>1만 권</th><th>100만 권</th><th>늘어난 배수</th></tr>${ids.map(ledgerLine).join('')}</table></div><p class="caption">한 번 할 때의 단계 수입니다. 식과 가정은 위 식 상자와 각 장 본문에 있고, 마지막 장의 설계 과제가 이 줄들을 씁니다.</p></div>`;
}
function home(){
 document.body.classList.remove('reading');document.title=`${NAME} · 알고리즘과 자료구조 실험실`;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">ALGORITHMS AND DATA STRUCTURES LAB</div><h1>찾고 정렬하고<br><em>잇습니다.</em></h1><p class="lead">책 1만 권의 솔내도서관이 내년에 100만 권으로 커집니다. 지금은 순식간에 끝나는 검색이 그때도 버틸까요? 배열·정렬·이진 탐색·해시·힙·그래프·편집 거리·색인을 브라우저에서 실제로 돌리며 비교 횟수를 세고, 장마다 규모 장부에 한 줄씩 남겨 마지막에 100만 권 도서관의 검색 설계를 고칩니다.</p><div class="hero-links"><a class="button primary" href="#steps">01장부터 읽기</a><a class="button" href="#hash">해시 실험</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>1만→100만</b>장마다 규모 장부 한 줄</span></div><p class="caption">세기 → 찾기 → 잇기 → 큰 도서관<br>모든 실험은 브라우저 안에서 알고리즘을 실제로 실행하고 횟수를 셉니다.</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>한 도서관이 커지는 이야기</h2><p>가상의 솔내도서관과 분관 일곱 곳이 모든 장에 이어집니다. 각 단계가 아래 장과 연결됩니다.</p></div>${flow(['세기|단계 세기·담는 법·정렬 (1~3장)','찾기|이진 탐색·트리·해시·힙 (4~6장)','잇기|분관 지도 탐색·최단 경로 (7~8장)','큰 도서관|오타 찾기·색인·설계 과제 (9~11장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 바꾸어 보고, 센 횟수로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${String(i+1).padStart(2,'0')} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 질문 중심으로 돌아보세요.</p></div><div class="path-grid"><div class="path"><h3>빠른 찾기만 골라서</h3><p>정렬된 서가, 해시, 색인이 각각 몇 단계에 찾는지 견줍니다.</p><a href="#steps">01</a><a href="#search">04</a><a href="#hash">05</a><a href="#index">10</a></div><div class="path"><h3>지도와 경로</h3><p>큐와 스택으로 지도를 돌고, 가중치가 붙으면 무엇이 달라지는지 봅니다.</p><a href="#lists">02</a><a href="#graph">07</a><a href="#shortest">08</a><a href="../knowledge-graph/#walk">그래프 02</a></div><div class="path"><h3>설계 과제를 먼저</h3><p>마지막 과제를 먼저 풀어 보고, 막힌 질문의 장으로 돌아갑니다.</p><a href="#final">11</a><a href="#heap">06</a><a href="#edit">09</a><a href="#index">10</a></div></div></section>
 <section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">알고리즘 교과서와 원 논문 서지, 공개 교과서의 해당 절을 확인했습니다. 확인일: 2026-10-12.</p><div class="note">솔내도서관, 청구기호·제목·대출 횟수, 분관 지도와 배송 시간은 이 책을 위해 지어낸 가상의 자료이며, 제목과 대출 횟수는 고정 시드의 의사 난수로 만들었습니다. 모든 실험은 정렬·탐색·해시·힙·BFS·DFS·다익스트라·편집 거리·역색인·격자 근사 이웃을 브라우저에서 실제로 실행하고 비교·이동·확인 횟수를 셉니다. 10장의 주제 지도는 2차원 교육용 모형이고, 실제 임베딩은 수백 차원입니다. 규모 장부의 1만·100만 권 값은 실험으로 확인한 식으로 늘린 예측이고, 11장의 하루 질문 수와 ‘1초에 1억 단계’는 과제를 위한 가정입니다. 단계 수는 컴퓨터의 실제 시간과 다릅니다.</div>${sourceLinks(B.sources.map((_,i)=>i))}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary"><p><b>단계</b> 이 책이 세는 일의 단위: 비교 한 번, 칸 이동 한 번, 연결 따라가기 한 번.</p><p><b>빅오(O)</b> 입력이 커질 때 단계가 자라는 꼴.</p><p><b>배열·연결 리스트</b> 붙은 칸에 담기와 쪽지로 이어 담기.</p><p><b>스택·큐</b> 나중에 넣은 것부터, 먼저 넣은 것부터 꺼내는 상자.</p><p><b>이진 탐색</b> 정렬된 범위를 가운데와 견주어 반씩 줄이는 찾기.</p><p><b>부하율</b> 해시 표의 책 수 ÷ 칸 수.</p><p><b>분할 상환</b> 드문 큰 비용을 전체 횟수로 나눠 보는 셈법.</p><p><b>힙</b> 부모가 자식보다 앞선다는 약속만 지키는 트리.</p><p><b>BFS·DFS</b> 큐로 넓게, 스택으로 깊게 도는 그래프 탐색.</p><p><b>동적 계획법</b> 겹치는 작은 문제의 답을 표에 적어 다시 쓰는 방법.</p><p><b>역색인</b> 낱말마다 그 낱말이 든 책 번호를 적은 목록.</p><p><b>재현율</b> 근사 검색이 정확한 1위를 맞힌 비율.</p></div></section>`;
 cleanup=ALHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${String(index+1).padStart(2,'0')}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}</div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=ALFigures.render(c.id),caption=art?art.caption:c.subtitle;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. data-* 값은 원래 번호다. */
function choices(q,target,attr){return ALMath.choiceOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${String(index+1).padStart(2,'0')}. ${c.title} · ${NAME}`;
 const previous=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${B.chapters[index+1].desc}</small></a>`:'<a href="../rag/#evaluation">다른 책 · 검색과 RAG 07장<small>이동 이유: 빨라진 검색이 맞는 책을 위에 올리는지는 단계 수로 알 수 없습니다. 정답 기준 지표로 품질을 재는 법을 이어서 봅니다.</small></a>';
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${String(index+1).padStart(2,'0')} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>앞 장 떠올리기</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${ledger(c,index)}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source)}${cross(c)}</section><nav class="chapter-nav" aria-label="이전·다음 장">${previous}${next}</nav></div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);ALLabs[id](el);ALGuides.mount(id,el);});
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
document.querySelector('#theme').onclick=()=>{const dark=document.documentElement.dataset.theme==='dark';document.documentElement.dataset.theme=dark?'light':'dark';};/* 저장과 버튼 문구는 ../../assets/book-theme.js가 맞춘다 */
document.querySelector('#menu').onclick=()=>{const open=document.body.classList.toggle('menu-open');document.querySelector('#menu').setAttribute('aria-expanded',String(open));};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('menu-open');document.querySelector('#menu').setAttribute('aria-expanded','false');}});
route();
})();
