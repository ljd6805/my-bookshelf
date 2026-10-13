(()=>{
'use strict';
const U=MUI,B=MBook,main=document.querySelector('main'),BOOK_TITLE='주문 한 장이 체결되기까지 · 한국 증권시장의 구조와 규칙';let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측 질문은 조작 전에 읽도록 실험 위에 둔다. 숫자는 MMath 계산과 같다. */
const info={
 claims:['채권자 몫과 주주 몫 나누기','회사의 한 해 이익과 약속한 이자를 바꾸며 누가 얼마를 가져가는지 봅니다.','이익이 100억 원에서 300억 원으로 세 배가 되면 채권자 몫은 어떻게 될까요? 주주 몫은 몇 배가 될지도 먼저 적어 두세요.','이익을 −50억 원까지 내려 보고, 주주 몫이 음수가 된다는 것이 주가에 무슨 뜻인지 한 문장으로 설명해 보세요.'],
 venue:['두 시장 중 덜 내는 곳 고르기','KRX와 NXT의 매도1호가와 수수료율을 바꾸며 같은 주문의 합계 금액을 비교합니다.','호가가 10원 싼 시장과 수수료율이 0.0005%포인트 싼 시장 중, 100주를 살 때 어느 쪽이 더 많이 아껴 줄까요?','두 시장의 호가를 같게 맞춘 뒤 수량을 1,000주까지 늘려 보고, 수수료율 차이가 몇 원이 되는지 확인해 보세요.'],
 sweep:['시장가 주문의 평균 체결가와 미끄러짐','새벽전자 호가창에 시장가 매수 수량을 늘려 넣으며 평균 체결가와 미끄러짐을 봅니다.','1,000주를 시장가로 사면 평균 체결가는 맨 위 매도호가 19,960원보다 몇 원쯤 비싸질까요? 짐작한 숫자를 적어 두세요.','미끄러짐이 0.1%를 넘기 시작하는 수량을 찾아보고, 큰 주문을 여러 번에 나눠 내면 무엇이 달라질지 생각해 보세요.'],
 queue:['같은 가격의 대기열에서 내 차례 세기','내 앞에 선 수량, 내 수량, 들어온 매도 수량을 바꾸며 내 주문이 체결되는지 봅니다.','같은 가격에 800주가 먼저 서 있고 내가 100주를 냈습니다. 매도 500주가 들어오면 내 주문은 몇 주 체결될까요?','내 주문이 전부 체결되는 가장 작은 매도 수량을 찾고, 그 수가 앞 수량과 내 수량의 합과 같은지 확인해 보세요.'],
 auction:['단일가 매매의 체결가 찾기','주문 묶음을 고르고 시장가 매수를 더해 넣으며, 한 가격에 몇 주가 체결되는지 봅니다.','장 시작 묶음에 시장가 매수 600주를 더하면 체결가는 오를까요, 그대로일까요, 내릴까요?','장 마감 묶음에서 체결가가 기준가(전날 종가) 19,950원을 벗어나기 시작하는 시장가 매수 수량을 찾아보세요.'],
 tick:['주문 가격이 호가단위에 맞는지 판정하기','가격과 종류를 바꾸며 호가단위, 가장 가까운 유효 가격, 한 칸이 가격에서 차지하는 비율을 봅니다.','19,995원은 주식으로 주문할 수 있을까요? 같은 가격을 ETF로 내면 어떨까요?','가격을 1,999원, 2,000원, 4,995원, 5,000원으로 바꿔 보며 한 칸의 비율이 경계에서 어떻게 뛰는지 적어 보세요.'],
 vi:['VI가 걸리는 지점 찾기','가격 경로와 동적 VI 문턱, 기준가를 바꾸며 어디서 단일가 매매로 바뀌는지와 그날의 상한가·하한가를 봅니다.','한 번에 3.24% 뛰는 경로에서 문턱이 3%이면 VI가 걸릴까요? 4.5%로 올리면요?','급락 경로에서 정적 VI와 동적 VI 중 무엇이 먼저 걸리는지 문턱을 2%와 3%로 바꿔 비교하고, 기준가를 52,300원으로 바꿔 상한가가 왜 52,300원의 30%를 그대로 더한 67,990원이 아닌지 설명해 보세요.'],
 rights:['증자·분할·배당 뒤의 새 기준가 계산하기','유상증자·무상증자·액면분할·현금배당을 고르고 숫자를 바꾸며 다음 날 기준가와 가격제한폭을 봅니다.','종가 20,000원인 주식이 기존 1주당 0.25주를 15,000원에 새로 발행하면 기준가는 20,000원보다 높을까요, 낮을까요?','발행가를 종가와 같은 20,000원으로 올려 보고, 기준가가 왜 그대로인지 설명해 보세요.'],
 settle:['결제일과 미수 계산하기','체결한 날을 고르고 계좌의 돈을 바꾸며 결제일과 모자란 돈, 반대매매 수량을 봅니다.','추석 연휴 바로 전날인 9월 23일 수요일에 산 주식은 며칠에 결제될까요? 달력을 보기 전에 적어 두세요.','계좌의 돈을 늘려 미수가 0이 되는 금액을 찾고, 반대매매 가격을 낮추면 팔리는 수량이 왜 늘어나는지 설명해 보세요.'],
 roundtrip:['한 번 사고파는 데 드는 돈','산 가격, 판 가격, 수량, 수수료율, 거래세를 바꾸며 남는 돈과 본전 매도가를 봅니다.','19,950원에 10주를 사서 20,000원에 팔면 차익 500원 가운데 얼마가 남을까요?','수수료율을 0.0036%까지 낮췄을 때와 0.5%까지 올렸을 때 본전 매도가가 각각 얼마인지 찾아보세요.'],
 gridstep:['격자 한 칸의 호가단위와 비용 판정하기','매수 가격, 간격, 수량, 종류를 바꾸며 한 칸이 눈금에 맞는지와 비용을 넘는지 봅니다.','19,970원에 사서 30원 위에 파는 칸은 이익일까요? 2만 원 경계가 끼어 있다는 점을 떠올려 보세요.','매수 가격을 19,950원, 19,970원, 20,000원으로 바꾸며 가장 좁은 이익 간격이 어떻게 달라지는지 표로 적어 보세요.'],
 hours:['지금 열려 있는 시장 찾기','시각을 옮기며 KRX와 NXT의 거래 시간 가운데 무엇이 열려 있는지 봅니다.','오후 3시 30분에 주문을 내면 KRX와 NXT 중 어느 시장에서 바로 체결될 수 있을까요? 둘 다 아닐 수도 있습니다.','두 시장이 모두 닫혀 있는 시간대를 모두 찾아 적고, 그때 낸 주문이 어떻게 되는지 설명해 보세요.'],
 scam:['투자 권유 메시지의 위험 신호 찾기','지어낸 메시지를 읽고 수상한 부분을 골라 점수와 설명을 봅니다.','이 메시지에서 위험 신호는 몇 개쯤 있을까요? 고르기 전에 개수를 적어 두세요.','놓친 신호의 설명을 읽고, 진짜 업체인지 확인하려면 어디서 무엇을 조회해야 하는지 적어 보세요.'],
 diagnose:['마지막 과제: 하린의 격자 주문표 진단','시작가, 간격, 칸 수, 수량, 수수료율, 종류를 바꾸며 칸마다 거부·손해·이익을 판정합니다.','하린의 원래 표(19,970원부터 30원 간격 6칸) 가운데 실제로 이익을 낼 수 있는 칸은 몇 칸일까요?','모든 칸이 이익이 되도록 표를 고치고, 바꾼 값마다 지금까지 배운 규칙(호가단위·왕복 비용) 중 어느 것 때문인지 근거를 적어 보세요.']
};
const GUESS={claims:'예: 채권자 ○억, 주주 ○배',venue:'예: ○○ 쪽이 ○원 덜 낸다',sweep:'예: ○원쯤',queue:'예: ○주',auction:'오른다 / 그대로 / 내린다',tick:'예: 주식은 ○, ETF는 ○',vi:'예: 3%면 ○, 4.5%면 ○',rights:'높다 / 낮다',settle:'예: ○월 ○일',roundtrip:'예: ○원쯤',gridstep:'이익 / 손해 / 거부',hours:'예: ○○ 시장',scam:'예: ○개',diagnose:'예: ○칸'};
const pad=i=>String(i+1).padStart(2,'0');
function sourceLinks(ids){return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">증권시장 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}</a>`).join('');}
const PATHS=[
 ['격자 주문이 궁금하다면','호가단위와 가격제한, 왕복 비용으로 내 격자 간격이 정말 이익인지 따집니다.',['tick','limits','cost','final']],
 ['처음 증권 계좌를 열었다면','주식이 무엇인지에서 시작해 주문이 거래소에 닿고 결제되기까지를 따라갑니다.',['map','route','book','settle']],
 ['장 시작과 마감이 궁금하다면','단일가 매매와 가격제한, 시간외 시장으로 하루의 시작과 끝을 읽습니다.',['auction','limits','hours']]
];
function paths(){return `<div class="path-grid">${PATHS.map(([t,d,ids])=>`<div class="path"><h3>${t}</h3><p>${d}</p>${ids.map(id=>{const i=B.chapters.findIndex(c=>c.id===id);return `<a href="#${id}" aria-label="${pad(i)}장 ${U.esc(B.chapters[i].title)}">${pad(i)}</a>`;}).join('')}</div>`).join('')}</div>`;}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">HOW AN ORDER GETS FILLED</div><h1>주문 한 장이<br><em>체결되기까지</em></h1><p class="lead">하린은 증권사 앱에서 가상 종목 새벽전자를 19,950원에 사려고 주문 버튼을 눌렀습니다. 그 주문 한 장은 거래소의 호가창에 줄을 서고, 가격과 시간 순서대로 체결되고, 이틀 뒤에야 결제됩니다. 호가단위와 가격제한, 단일가 매매와 수수료까지 주문에 적용되는 규칙을 직접 계산해 보세요.</p><div class="hero-links"><a class="button primary" href="#map">01장부터 읽기</a><a class="button" href="#queue">대기열 실험</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>0</b>실제 종목 추천</span></div><p class="caption">주문이 체결되는 과정 → 가격이 정해지는 법 → 체결 뒤 → 마지막 과제<br>모든 계산은 브라우저 안에서 하며, 회사와 인물은 모두 가상입니다.</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>주문에서 결제까지, 네 단계로 읽습니다</h2><p>모든 장이 하린의 주문과 새벽전자, 누리200 ETF를 같은 예로 씁니다. 단계마다 괄호 안에 해당 장을 적었습니다.</p></div>${flow(['주문이 체결되는 과정|증권의 뜻·주문 경로·호가창·대기열 (1~4장)','가격이 정해지는 법|단일가·호가단위·가격제한과 VI·기준가 조정 (5~8장)','체결 뒤|결제와 미수·왕복 비용·시간외 시장·투자자 보호 (9~12장)','마지막 과제|하린의 격자 주문표 진단 (13장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 바꾸어 보고, 숫자와 그림으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${pad(i)} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 질문 중심으로 돌아보세요.</p></div>${paths()}</section>
 <section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">한국거래소와 금융당국의 공식 자료를 확인했습니다. 확인일: 2026-10-12.</p><div class="note">거래 규칙은 2026-10-12에 확인한 한국거래소 공식 규정과 안내를 교육용으로 단순화한 것입니다. 원문과 단순화한 부분은 <a href="docs/research.html">조사 노트</a>에 적었습니다. 하린, 새벽전자, 누리200 ETF를 비롯한 회사·ETF·인물은 모두 가상이며, 이 책은 투자 권유가 아닙니다. 호가창 쓸기·대기열·단일가·호가단위·VI·기준가 조정·결제일·왕복 비용·격자 판정·거래 시간 실험은 규칙을 실제로 계산하고, 그 안의 호가·주문 수량·가격 경로는 정해 둔 예시입니다. 1장의 채권자·주주 몫과 2장의 두 시장 비교는 고정한 예시 숫자로 계산한 단순 모형이고, 12장의 투자 권유 메시지는 이 책이 지어낸 시나리오입니다. 규칙은 바뀔 수 있으니 실제 거래 전에는 거래소와 증권사의 최신 안내를 확인하세요.</div>${sourceLinks(B.sources.map((_,i)=>i))}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary"><p><b>호가</b> 사거나 팔겠다고 부른 가격과 수량.</p><p><b>스프레드</b> 최우선 매도호가와 매수호가의 차이.</p><p><b>미끄러짐</b> 평균 체결가가 맨 위 호가에서 벗어난 정도.</p><p><b>단일가 매매</b> 주문을 모아 한 가격에 한꺼번에 체결하는 방식.</p><p><b>호가단위</b> 가격대마다 정해진 주문 가격의 최소 눈금.</p><p><b>VI</b> 가격이 급히 움직일 때 잠시 단일가로 바꾸는 장치.</p><p><b>기준가</b> 그날 가격제한폭을 계산하는 출발 가격.</p><p><b>T+2 결제</b> 체결일에서 영업일 이틀 뒤에 돈과 주식이 오가는 것.</p><p><b>미수·반대매매</b> 결제일까지 못 낸 돈과, 그것을 메우려고 증권사가 파는 일.</p><p><b>최선집행</b> 고객 주문을 더 나은 조건의 시장으로 보내야 하는 의무.</p></div></section>`;
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
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${B.chapters[index+1].desc}</small></a>`:'<a href="../aie-autonomy/#budget">다른 책 · 자율 시스템의 예산과 한도<small>이동 이유: 하린의 격자 주문표처럼 규칙에 따라 스스로 주문을 내는 시스템에는 손실과 비용의 한도가 꼭 필요합니다. 자동으로 움직이는 시스템에 예산과 멈춤 조건을 어떻게 거는지 이어서 봅니다.</small></a>';
 return `<nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${pad(index)}. ${c.title} · 주문 한 장이 체결되기까지`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>앞 장 떠올리기</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${body}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source)}${cross(c)}</section>${navLinks(index)}</div>`;
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
