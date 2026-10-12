(()=>{
'use strict';
const U=MUI,B=MBook,main=document.querySelector('main'),BOOK_TITLE='돈의 시간 가치 · 이자와 복리에서 현재가치까지';let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측 질문은 조작 전에 읽도록 실험 위에 둔다. 숫자는 MMath 계산과 같다. */
const info={
 scale:['시간 저울에 오늘과 1년 뒤 올리기','오늘 받는 돈, 나중에 받는 돈, 기간, 맡길 수 있는 금리를 바꾸며 두 접시 중 어느 쪽이 무거운지 봅니다.','하린이 맡길 수 있는 금리가 연 4%라면 “오늘 1,000만 원”과 “1년 뒤 1,030만 원” 중 어느 쪽이 무거울까요? 차이는 몇 원일까요?','기간을 10년으로 늘리고 나중에 받는 돈을 1,300만 원으로 바꾼 뒤, 두 제안이 같아지는 금리를 찾아보세요. 3%보다 높을까요, 낮을까요?'],
 compound:['단리 직선과 복리 곡선 겹쳐 보기','원금, 금리, 기간을 바꾸며 단리와 복리가 언제부터 크게 벌어지는지 봅니다.','1,000만 원을 연 3%로 10년 두면 복리는 단리 1,300만 원보다 얼마나 많을까요? 10만 원, 40만 원, 100만 원 가운데 가까운 것을 적어 두세요.','금리를 −3%로 바꿔 10년 뒤 얼마나 남는지 확인하고, 줄어드는 쪽에서도 복리가 단리와 다른 이유를 한 문장으로 설명해 보세요.'],
 double:['두 배가 되는 해와 실효 금리','금리와 한 해에 이자를 붙이는 횟수를 바꾸며 72의 법칙의 오차와 실효 연 금리를 봅니다.','연 6%로 돈이 두 배가 되는 데 몇 년이 걸릴까요? 72의 법칙의 답과 정확한 값은 몇 달쯤 차이 날지도 적어 두세요.','금리를 1%와 20%로 바꿔 72의 법칙의 오차가 어떻게 달라지는지 보고, 같은 연 3%를 날마다 붙여도 실효 금리가 3.05%를 넘지 않는 이유를 설명해 보세요.'],
 discount:['미래의 돈을 오늘로 데려오기','미래 금액, 기간, 할인율을 바꾸며 현재가치가 어떻게 줄어드는지 봅니다.','“3년 뒤 1,100만 원”의 현재가치는 할인율 3%에서 1,000만 원보다 클까요, 작을까요?','할인율을 3%에서 5%로 올렸을 때 3년 뒤 돈과 30년 뒤 돈의 현재가치가 각각 몇 %씩 줄어드는지 비교해 보세요.'],
 schedule:['상환 방식 세 가지의 상환표','빌린 돈, 금리, 기간, 상환 방식을 바꾸며 달마다 낼 돈과 이자 합계, 미리 갚을 때 아끼는 이자를 봅니다.','600만 원을 연 6%로 36개월 갚을 때 이자 합계가 가장 큰 방식은 무엇일까요? 달마다 내는 돈이 가장 작은 방식과 같을까요?','원리금균등에서 미리 갚는 달을 12, 24로 바꾸고 중도상환수수료율을 1%로 넣어, 수수료를 빼고도 아끼는 돈이 어떻게 달라지는지 적어 보세요.'],
 npv:['현금흐름표의 NPV 곡선과 IRR','현금흐름과 할인율을 바꾸며 순현재가치가 0을 지나는 곳, 곧 내부수익률을 찾습니다.','[−100, 60, 60]을 할인율 5%로 할인해 더하면 0보다 클까요? IRR은 5%보다 높을까요, 낮을까요?','[−100, 230, −132]를 넣고 할인율을 5%, 15%, 25%로 바꿔 NPV의 부호를 적은 뒤, 이 흐름에서 “IRR이 몇 %”라고 말할 수 없는 이유를 설명해 보세요.'],
 real:['세금과 물가를 빼고 남는 구매력','명목 금리, 물가 상승률, 세율을 바꾸며 세후 금리와 실질 수익률을 봅니다.','연 3% 예금에서 세금 15.4%를 떼고 물가 2%를 빼면 실질 수익률은 1%보다 클까요, 작을까요?','실질 수익률이 0에 가장 가까워지는 물가 상승률을 찾아보고, 그 값이 세후 금리와 거의 같은 이유를 설명해 보세요.'],
 cagr:['평균 수익률과 연환산 수익률','해마다 수익률과 흔들림 크기를 바꾸며 산술 평균, 연환산 수익률(CAGR), 끝 금액을 봅니다.','+50%와 −50%를 한 번씩 겪으면 1,000만 원은 얼마가 남을까요? 산술 평균 0%라는 말과 견주어 적어 두세요.','5년 경로를 넣고 흔들림 크기를 0%에서 150%까지 옮기며 끝 금액이 어떻게 변하는지 보고, 산술 평균이 그대로인데 끝 금액이 줄어드는 까닭을 한 문장으로 적어 보세요.'],
 fees:['비용률 두 개를 30년 동안 나란히','처음 금액, 수익률, 기간, 두 비용률, 매매 회전 수를 바꾸며 비용이 쌓인 돈을 얼마나 깎는지 봅니다.','연 6%로 30년 불어나는 1,000만 원에서 해마다 1%를 떼면, 비용이 없을 때보다 몇 %쯤 적게 쌓일까요? 1%, 10%, 26% 가운데 골라 보세요.','비용률 ①을 0으로 두고 한 해 회전 수만 늘려, 비용률 1%와 비슷한 피해를 내는 회전 수를 찾아보세요.'],
 decide:['마지막 과제: 상환과 투자를 같은 시점에서','쓸 돈, 대출 금리, 비교 시점, 투자 시나리오, 비용률, 세금, 중도상환수수료를 바꾸며 확실한 숫자와 가정한 숫자를 한 표에 놓습니다.','600만 원으로 연 6% 대출을 갚는 것과 같아지려면, 비용 0.1%를 떼기 전 수익률로 투자에서 해마다 몇 %를 벌어야 할까요?','시나리오 하나를 손실로 두고 중도상환수수료와 세금을 바꿔 가며, 상환 효과·시나리오별 결과·같아지는 수익률·비상금·계산 밖의 사정 다섯 줄로 “어떤 조건이면 숫자가 어느 쪽을 가리키는지” 적어 보세요.']
};
const GUESS={scale:'예: ○○ 쪽이 ○원 무겁다',compound:'예: 약 ○만 원',double:'예: ○년, ○달 차이',discount:'크다 / 작다',schedule:'예: ○○ 방식',npv:'예: 0보다 크다, IRR은 ○%쯤',real:'크다 / 작다',cagr:'예: ○만 원',fees:'예: ○%',decide:'예: 연 ○%'};
const pad=i=>String(i+1).padStart(2,'0');
/* 출처는 조사 노트에서 채운다. 비어 있으면 조사 노트로 안내한다. */
function sourceLinks(ids){if(!ids.length)return '<p class="caption">이 장의 출처와 확인일은 <a href="docs/research.html">조사 노트</a>에 모아 두었습니다.</p>';return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">돈의 시간 가치 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}</a>`).join('');}
const PATHS=[
 ['대출을 미리 갚을지 고민한다면','상환표와 할인, 같은 시점 비교로 상환과 투자를 한 표에 놓습니다.',['loan','discount','final']],
 ['펀드·ETF 수익률을 읽고 싶다면','평균 수익률과 연환산 수익률, 비용의 복리로 광고 숫자를 다시 잽니다.',['compound','cagr','fees']],
 ['예금·적금 금리를 비교한다면','실효 금리와 적금 이자, 세금과 물가를 뺀 구매력을 계산합니다.',['rule72','loan','inflation']]
];
function paths(){return `<div class="path-grid">${PATHS.map(([t,d,ids])=>`<div class="path"><h3>${t}</h3><p>${d}</p>${ids.map(id=>{const i=B.chapters.findIndex(c=>c.id===id);return `<a href="#${id}" aria-label="${pad(i)}장 ${U.esc(B.chapters[i].title)}">${pad(i)}</a>`;}).join('')}</div>`).join('')}</div>`;}
function sourcesSection(){
 return `<section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">세율·물가·신용점수 같은 바깥 사실은 공식 자료로 확인해 조사 노트에 확인일과 함께 적었습니다.</p><div class="note">하린과 누리200 ETF, 모든 금리·물가·수익률·비용률은 이 책을 위해 정한 가정입니다. 이 책은 특정 예금·대출·투자 상품을 권하지 않으며, 결과 문장은 “이 가정에서는 숫자가 어떻게 되는가”만 말합니다. 시간 저울·복리·72의 법칙·현재가치·상환표·NPV와 IRR·실질 수익률·연환산 수익률·비용 실험은 공식을 브라우저에서 실제로 계산합니다. 8장의 수익률 경로는 정해 둔 예시이고, 마지막 과제의 투자 수익률은 가정한 시나리오입니다. 저울 그림은 시각적 비유입니다. 세율 15.4%는 이자소득 원천징수 세율 한 가지로만 계산했으며, 실제 세금은 계좌와 소득에 따라 다릅니다. 출처와 단순화한 부분은 <a href="docs/research.html">조사 노트</a>에 있습니다.</div>${B.sources.length?sourceLinks(B.sources.map((_,i)=>i)):''}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary"><p><b>기회비용</b> 한 선택 때문에 포기한 다른 선택의 값.</p><p><b>복리</b> 지난 이자까지 원금에 합쳐 다음 이자를 계산하는 방식.</p><p><b>실효 연 금리</b> 이자를 붙이는 횟수까지 넣어 한 해에 실제로 불어나는 비율.</p><p><b>현재가치</b> 미래의 돈을 할인율로 나누어 오늘로 데려온 값.</p><p><b>할인율</b> 현재가치를 구할 때 쓰는 금리. 다른 곳에서 벌 수 있었던 수익률.</p><p><b>원리금균등</b> 이자와 원금을 합쳐 달마다 같은 금액을 갚는 방식.</p><p><b>NPV</b> 해마다의 현금흐름을 할인해 모두 더한 값.</p><p><b>IRR</b> NPV를 0으로 만드는 할인율.</p><p><b>실질 수익률</b> 물가를 빼고 남는 구매력의 증가율.</p><p><b>CAGR</b> 처음과 끝 금액만으로 계산한 연환산 수익률.</p></div></section>`;
}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">THE TIME VALUE OF MONEY</div><h1>돈의 시간 가치<br><em>오늘과 내일을 한 저울에</em></h1><p class="lead">하린의 통장에 1,000만 원이 모였고, 갚아야 할 신용대출 600만 원이 남아 있습니다. 친구는 오늘 1,000만 원 대신 1년 뒤 1,030만 원을 주겠다고 합니다. 어느 쪽이 더 무거울까요? 이자와 복리, 할인과 상환표, 물가와 비용을 저울의 추로 하나씩 얻으며, 서로 다른 때의 돈을 같은 시점에 올려 직접 계산해 보세요.</p><div class="hero-links"><a class="button primary" href="#today">01장부터 읽기</a><a class="button" href="#loan">상환표 실험</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>0</b>금융상품 추천</span></div><p class="caption">돈을 미래로 보내기 → 미래를 오늘로 데려오기 → 무게를 다시 재기 → 마지막 과제<br>모든 계산은 브라우저 안에서 하며, 인물과 금리는 모두 가정입니다.</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>하린의 1,000만 원을 끝까지 따라갑니다</h2><p>하린의 1,000만 원과 600만 원 대출이 모든 장에 이어집니다. 각 단계가 아래 장과 연결됩니다.</p></div>${flow(['돈을 미래로 보내기|기회비용·단리와 복리·72의 법칙과 실효 금리 (1~3장)','미래를 오늘로 데려오기|현재가치·상환표·NPV와 IRR (4~6장)','무게를 다시 재기|물가와 세금·연환산 수익률·비용의 복리 (7~9장)','마지막 과제|상환과 투자를 같은 저울에 (10장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 바꾸어 보고, 숫자와 그림으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${pad(i)} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 질문 중심으로 돌아보세요.</p></div>${paths()}</section>
 ${sourcesSection()}`;
 cleanup=MHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${pad(index)}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}<label class="my-guess" for="guess-${id}"><span>내 예측 적어 두기</span><input id="guess-${id}" type="text" autocomplete="off" placeholder="${GUESS[id]||'짐작한 답을 짧게'}"></label></div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross||!c.cross.length)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=window.MFigures?.render(c.id),caption=art?art.caption:`${c.subtitle}`;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. data-* 값은 원래 번호다. */
function choices(q,target,attr){return MMath.choiceOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function navLinks(index){
 const prev=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${B.chapters[index+1].desc}</small></a>`:'<a href="../market/#final">다른 책 · 주문 한 장이 체결되기까지 · 하린의 격자 주문표 진단<small>이동 이유: 4권 마지막 과제의 격자 주문표에서 한 칸의 이익은 몇십 원이지만, 체결이 쌓이면 이 책 8장의 연환산과 9장의 비용 복리로 다시 재야 합니다. 같은 하린의 주문표를 시간 저울로 다시 읽어 봅니다.</small></a>';
 return `<nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${pad(index)}. ${c.title} · 돈의 시간 가치`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>앞 장 떠올리기</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${body}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source||[])}${cross(c)}</section>${navLinks(index)}</div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);MLabs[id](el);MGuides.mount(id,el);});
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
