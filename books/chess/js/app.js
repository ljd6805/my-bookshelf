(()=>{
'use strict';
const U=CUI,B=CBook,main=document.querySelector('main'),BOOK_TITLE='체스 입문 · 규칙을 익히고 기초 원칙으로 한 판 두기';let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측 질문은 조작 전에 읽도록 실험 위에 두며, 답은 결과 읽기에만 있다. */
const info={
 coords:['좌표로 칸 찾기 실험','판을 보는 쪽과 기물 배치를 바꾸며 칸을 눌러 이름과 색을 읽고, 정해 둔 칸 여섯 개를 찾습니다.','판을 검은 쪽에서 보면 화면 왼쪽 아래 구석에는 어느 칸이 올까요?','검은 쪽에서 보기로 바꾼 뒤 찾을 칸 여섯 개를 모두 찾고, 흰 퀸과 검은 퀸이 서 있는 칸의 색을 적어 보세요.'],
 reach:['기물이 닿는 칸 세기 실험','기물과 놓을 칸을 바꾸며 빈 판에서 닿는 칸 수를 세고, 다른 폰이 길을 막을 때를 견줍니다.','나이트를 구석 a1에 놓으면 닿는 칸은 몇 개일까요? 가운데 d4와 견주어 적어 두세요.','비숍을 a1, c3, d4에 차례로 놓고 닿는 칸 수를 적은 뒤, 비숍이 가운데에 있을 때 더 많은 칸에 닿는 이유를 대각선의 길이로 설명해 보세요.'],
 special:['특수한 수 세 가지 두어 보기 실험','앙파상·승진·캐슬링 국면을 골라 실제로 두고, 캐슬링 조건 다섯 개를 표에서 하나씩 확인합니다.','f1을 상대 비숍이 공격하는 국면에서 흰색은 킹 쪽 캐슬링과 퀸 쪽 캐슬링을 각각 할 수 있을까요?','캐슬링 두 방향 국면에서 흰 룩 h1을 한 번 움직였다가 제자리로 돌린다면 킹 쪽 캐슬링 조건 표가 어떻게 바뀔지 예측하고, 검은 수를 사이에 두어 직접 확인해 보세요.'],
 legal:['규칙상 움직임에서 합법 수 걸러 내기 실험','국면을 바꾸며 규칙상 움직임과 합법 수의 개수를 세고, 기물을 눌러 빠진 칸(⊘)을 봅니다.','핀 국면에서 c3의 흰 나이트는 몇 칸으로 갈 수 있을까요?','체크 국면에서 남은 합법 수를 킹 옮기기·잡기·막기로 나누어 적고, 이중 체크 국면에서 잡기와 막기가 빠지는 이유를 설명해 보세요.'],
 ending:['게임이 끝났는지 판정하기 실험','국면을 바꾸며 합법 수·체크·같은 국면 횟수·50수 기록으로 결과를 판정합니다.','검은 킹만 남은 스테일메이트 국면은 흰색의 승리일까요, 무승부일까요?','스테일메이트 국면에서 흰 퀸이 다른 칸에 있었다면 검은 킹이 체크메이트였을지 생각해 보고, 10장의 체크메이트 실험에서 그런 국면을 직접 만들어 보세요.'],
 notation:['기보로 적고 다시 두기 실험','국면을 고르고 판을 누르거나 기보를 입력해 두면서, 수가 대수 기보와 FEN으로 어떻게 적히는지 봅니다.','b1과 f1의 나이트가 모두 d2로 갈 수 있을 때, b1 나이트를 d2로 옮긴 수는 어떻게 적을까요?','시작 국면에서 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. 0-0을 입력 칸으로 두고, 마지막 FEN에서 캐슬링 권리 부분이 어떻게 바뀌었는지 적어 보세요.'],
 exchange:['한 칸의 교환 득실 계산 실험','국면을 바꾸며 d5를 두고 서로 잡아 들어갈 때 흰색이 얻는 점수를 계산하고, 멈출 때와 끝까지 잡을 때를 견줍니다.','지켜진 폰을 룩으로 잡으면 흰색은 몇 점을 얻거나 잃을까요?','공격 둘·수비 둘 국면에서 “끝까지 잡는다고 보기”를 켰다 끄며 결과를 견주고, 흰색이 어느 잡기에서 멈추는 편이 나은지 한 문장으로 적어 보세요.'],
 opening:['오프닝 원칙 세기 실험','세 가지 오프닝 기보를 한 반수씩 넘기며 가운데 공격 수, 나온 나이트·비숍 수, 캐슬링 여부를 셉니다.','퀸을 일찍 꺼낸 판에서 8반수 뒤 흰색과 검은색 가운데 나이트·비숍을 더 많이 내보낸 쪽은 어디일까요?','원칙대로 둔 판을 0반수부터 한 칸씩 넘기며 흰색의 전개 수가 늘어나는 반수를 적고, 퀸을 일찍 꺼낸 판과 같은 반수에서 견주어 보세요.'],
 tactics:['전술로 기물 얻기 퍼즐 실험','퍼즐을 골라 흰색 한 수를 두면, 검은색의 가장 좋은 대답 뒤 기물 점수로 맞았는지 판정합니다.','나이트 포크 퍼즐에서 흰 나이트가 체크를 걸면서 동시에 공격할 수 있는 검은 기물은 무엇일까요?','네 퍼즐을 모두 푼 뒤, 퍼즐마다 “두 목표가 무엇이었는지”와 “상대가 둘 다 지킬 수 없었던 이유”를 한 줄씩 적어 보세요.'],
 mates:['기본 체크메이트 만들기 실험','퍼즐을 골라 한 수나 두 수 안에 체크메이트를 만들고, 판정이 체크와 합법 수 0으로 나오는지 확인합니다.','마지막 줄 국면에서 검은 킹이 앞으로 나오지 못하는 이유는 무엇일까요?','킹과 퀸 국면에서 일부러 퀸을 g7이 아닌 다른 칸에 두어 검은 킹이 둘 수 없게만 만들어 보고, 그 결과가 스테일메이트인지 판정을 확인해 보세요.'],
 search:['미니맥스와 알파베타 노드 세기 실험','국면과 탐색 깊이, 수 정렬을 바꾸며 두 방법이 방문한 노드 수와 고른 수를 견줍니다.','포크 퍼즐을 깊이 3으로 읽을 때 알파베타는 미니맥스보다 노드를 몇 분의 1쯤 볼까요?','룩 둘 외통 국면에서 깊이를 1부터 4까지 올리며 고른 수와 점수를 적고, 외통이 처음 보이는 깊이와 그 이유를 설명해 보세요.'],
 review:['하준의 대국 복기 실험','복기할 순간과 후보 수를 바꾸며, 검은색의 대답까지 본 기물 점수와 원칙 숫자를 함께 견줍니다.','6수에서 Qg3 대신 Nxd4를 두었다면 기물 점수는 어떻게 바뀌었을까요?','세 순간마다 “둔 수 → 더 나은 후보 · 근거(원칙 숫자 또는 엔진 점수) · 이 계산으로 모르는 것”을 한 줄씩 적어 보세요. 2수에서는 엔진 점수만으로 후보를 가를 수 없는 이유도 함께 적습니다.']
};
const GUESS={coords:'예: ○○',reach:'예: ○칸, d4는 ○칸',special:'예: 0-0 ○, 0-0-0 ○',legal:'예: ○칸',ending:'승리 / 무승부',notation:'예: N○○',exchange:'예: ○점',opening:'흰색 / 검은색',tactics:'예: ○○',mates:'짧게 적기',search:'예: ○분의 1',review:'예: ○점'};
const pad=i=>String(i+1).padStart(2,'0');
function sourceLinks(ids){if(!ids.length)return '<p class="caption">이 장의 근거와 확인일은 <a href="docs/research.html">조사 노트</a>에 모아 두었습니다.</p>';return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">체스 입문 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}</a>`).join('');}
const PATHS=[
 ['체스를 처음 둔다면','칸 이름과 기물의 움직임, 합법 수, 게임의 끝을 차례로 익혀 혼자 한 판을 규칙대로 둡니다.',['board','moves','check','ending']],
 ['규칙은 알고 첫 대국을 앞두었다면','오프닝 원칙과 전술, 기본 체크메이트로 수를 고르는 기준을 세웁니다.',['opening','tactics','mates','final']],
 ['체스 프로그램이 궁금하다면','합법 수, 기물 점수, 미니맥스와 알파베타로 컴퓨터가 수를 고르는 방법을 봅니다.',['check','value','engine']]
];
function paths(){return `<div class="path-grid">${PATHS.map(([t,d,ids])=>`<div class="path"><h3>${t}</h3><p>${d}</p>${ids.map(id=>{const i=B.chapters.findIndex(c=>c.id===id);return `<a href="#${id}" aria-label="${pad(i)}장 ${U.esc(B.chapters[i].title)}">${pad(i)}</a>`;}).join('')}</div>`).join('')}</div>`;}
function sourcesSection(){
 return `<section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">규칙 문장은 국제체스연맹(FIDE)의 공식 규칙 2023년 시행판과 대조했습니다. 기물 가치와 오프닝 원칙은 규칙이 아니라 입문서들이 권하는 관례이며, 그렇다고 본문에 밝혔습니다.</p><div class="note">하준과 그의 첫 대국, 퍼즐 국면은 모두 이 책이 지어낸 것입니다. 1~6장과 10장의 판정(합법 수, 체크, 체크메이트, 스테일메이트, 같은 국면 횟수, 기보)은 브라우저 안의 규칙 엔진이 실제로 계산합니다. 엔진의 수 생성은 공개된 perft 값(시작 국면 깊이 4에서 197,281)과 일치하는지 시험했습니다. 7·9·11장과 마지막 과제의 점수는 관례 가치 1·3·3·5·9로 센 기물 점수이고, 국면의 좋고 나쁨 전체를 재지는 않습니다. 대회 규정(시간 제한, 기록지, 심판의 판단)과 FIDE의 경기 규칙 가운데 대회 운영 부분은 다루지 않습니다. 출처와 확인하지 못한 것은 <a href="docs/research.html">조사 노트</a>에 있습니다.</div>${sourceLinks(B.sources.map((_,i)=>i))}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary"><p><b>세로줄·가로줄</b> 세로줄(file)은 a~h, 가로줄(rank)은 1~8.</p><p><b>반수</b> 한 사람이 한 번 두는 것. 흰 수 하나와 검은 수 하나를 합쳐 한 수 번호를 매긴다.</p><p><b>체크</b> 킹이 상대 기물에게 공격받는 상태.</p><p><b>합법 수</b> 규칙대로 움직이면서 둔 뒤 자기 킹이 공격받지 않는 수.</p><p><b>핀</b> 기물이 비키면 뒤의 자기 킹이나 더 비싼 기물이 공격받아 움직이기 어려운 상태.</p><p><b>체크메이트</b> 체크인데 합법 수가 없는 상태. 체크를 건 쪽이 이긴다.</p><p><b>스테일메이트</b> 체크가 아닌데 합법 수가 없는 상태. 무승부.</p><p><b>앙파상</b> 두 칸 나온 폰을 바로 다음 수에 한 칸만 나온 것처럼 잡는 수.</p><p><b>승진</b> 마지막 줄에 닿은 폰을 퀸·룩·비숍·나이트로 바꾸는 것.</p><p><b>캐슬링</b> 킹이 룩 쪽으로 두 칸 가고 룩이 킹을 넘어 옆에 서는 한 수.</p><p><b>전개</b> 나이트·비숍을 처음 자리에서 내보내는 것.</p><p><b>FEN</b> 국면 하나를 글자 한 줄로 적는 표기.</p><p><b>노드</b> 탐색에서 펼친 국면 하나.</p></div></section>`;
}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">CHESS FROM THE RULES UP</div><h1>체스 입문<br><em>규칙을 익히고 한 판 두기</em></h1><p class="lead">동네 체스 모임에 들어가 4주 뒤 첫 15분 대국을 두는 하준(지어낸 인물)을 사례로, 칸 이름과 기물의 움직임, 특수한 수, 체크와 합법 수, 게임이 끝나는 조건을 익힙니다. 이어서 기보를 적고, 기물 점수와 오프닝 원칙과 전술로 수를 고릅니다. 마지막에는 하준의 첫 대국을 복기하며 실수 세 개를 찾아 더 나은 수를 고릅니다. 판 위의 모든 판정은 브라우저 안의 규칙 엔진이 계산합니다.</p><div class="hero-links"><a class="button primary" href="#board">01장부터 읽기</a><a class="button" href="#tactics">전술 퍼즐 실험</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>197,281</b>시작 국면 4반수 수순(검산값)</span></div><p class="caption">규칙 → 기록과 계산 → 전략 → 엔진 → 마지막 과제<br>인물과 대국은 지어낸 것이며, 계산은 모두 이 기기 안에서 합니다.</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>판 읽기에서 대국 복기까지, 다섯 단계로 읽습니다</h2><p>모든 장이 하준의 첫 대국 준비를 같은 예로 씁니다. 단계마다 괄호 안에 해당 장을 적었습니다.</p></div>${flow(['규칙|좌표·움직임·특수한 수·합법 수·게임의 끝 (1~5장)','기록과 계산|기보·기물 점수와 교환 (6~7장)','전략|오프닝 원칙·전술·기본 체크메이트 (8~10장)','엔진|미니맥스와 알파베타 (11장)','마지막 과제|하준의 첫 대국 복기 (12장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 판에서 두어 보고, 판정과 숫자로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${pad(i)} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 목적에 맞는 장만 골라 보세요.</p></div>${paths()}</section>
 ${sourcesSection()}`;
 cleanup=CHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${pad(index)}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}<label class="my-guess" for="guess-${id}"><span>내 예측 적어 두기</span><input id="guess-${id}" type="text" autocomplete="off" placeholder="${GUESS[id]||'짐작한 답을 짧게'}"></label></div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross||!c.cross.length)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=window.CFigures?.render(c.id),caption=art?art.caption:c.subtitle;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. */
function choices(q,target,attr){return CRules.choiceOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function navLinks(index){
 const prev=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${B.chapters[index+1].desc}</small></a>`:'<a href="../algorithms/#graph">다른 책 · 찾고 정렬하고 잇기 · 그래프 탐색: BFS·DFS<small>이동 이유: 11장의 미니맥스는 게임 트리를 깊이 우선으로 방문했습니다. 같은 방문 순서를 스택과 큐로 직접 바꿔 보며, 나무가 아닌 그래프에서도 노드를 빠짐없이 도는 방법을 이어 배웁니다.</small></a>';
 return `<nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${pad(index)}. ${c.title} · 체스 입문`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>${index?'앞 장 떠올리기':'먼저 떠올리기'}</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div></section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source||[])}${cross(c)}</section>${navLinks(index)}</div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);CLabs[id](el);CGuides.mount(id,el);});
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
