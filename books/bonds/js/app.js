(()=>{
'use strict';
const U=BUI,B=BBook,main=document.querySelector('main'),BOOK_TITLE='금리와 채권 · 기준금리에서 채권 가격까지';let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측 질문(L2)은 본문이 계산하지 않은 새 사례이며, 조작 전에 읽도록 실험 위에 둔다. 답은 BMath 계산과 같다(tests/math.test.cjs). */
const info={
 'who-pays':['누가 누구에게 내는 금리인가','거래를 고르면 누가 빌려주고 누가 이자를 내는지 화살표로 보이고, 광고의 만기 총수익을 단순 평균과 해마다 복리로 붙는 금리로 나눠 예금 3.5%와 견줍니다. 아래 칸에서 1권의 피셔 관계로 물가를 뺀 실질 금리도 계산합니다.','총수익이 23.58%인 5년물 광고가 “연평균 4.7%”라고 적었다면, 해마다 복리로 붙는 금리는 몇 %일까요?','거래를 세 가지로 바꿔 화살표의 방향을 말로 적고, 만기를 3년·10년·20년으로 바꿔 단순 평균과 복리 금리가 언제 더 벌어지는지 확인해 보세요. 물가를 명목 금리보다 높게 넣어 실질 금리가 음수가 되는 것도 확인해 보세요.'],
 ladder:['기준금리 사다리','기준금리 변화, 발표 전 시장이 미리 반영한 변화, 발표 뒤 남은 기대, 시점을 바꾸며 콜·CD·COFIX·예금·대출 금리와 국고 3년·10년 금리가 사다리에서 어떻게 움직이는지 봅니다. 짧은 칸은 정해 둔 전달 속도로, 긴 칸은 6장 모형으로 계산합니다.','시장이 0.50%p 인하를 믿고 있었는데 0.25%p만 내리고 추가 인하 기대도 없어졌다면, 국고 3년 금리(모형)는 내릴까요, 오를까요? 얼마나 움직일까요?','기준금리 변화는 그대로 두고 “발표 전 시장이 미리 반영한 변화”만 바꿔 보며, 같은 결정이 어떤 날에는 3년 금리를 올리고 어떤 날에는 내리는 까닭을 한 문장으로 적어 보세요. 시점을 12개월 뒤로 옮겨 예금과 대출 금리가 언제 다 따라오는지도 보세요.'],
 cashflow:['받을 돈의 표 쓰기','표면금리, 만기, 이자 주기, 채권 종류를 바꾸며 액면 10,000원 채권의 현금흐름표와 막대, 받을 돈의 합을 봅니다.','새벽전자 3년 회사채가 이자를 반년마다가 아니라 1년에 한 번 준다면, 3년 동안 받는 이자의 합은 1,500원보다 늘어날까요, 줄어들까요?','표면금리를 0.125%씩 움직여 국고채 관행의 배수를 확인하고, 만기를 30년으로 늘려 이자의 합이 원금보다 커지는 표면금리를 찾아보세요. 할인채로 바꾸면 표에서 무엇이 빠지는지 적어 보세요.'],
 price:['가격과 만기수익률 오가기','채권과 시장 금리를 고르면 칸마다 할인한 값과 가격을 계산하고, 계산 방향을 바꾸면 가격에서 만기수익률을 찾습니다. 직전 이자 지급일부터 지난 날을 옮기면 경과이자와 깨끗한·더러운 가격을 봅니다.','나라 10년을 시장 금리 3.5%로 할인하면 가격은 몇 원일까요? 액면보다 비쌀까요, 쌀까요?','계산 방향을 “가격 → 만기수익률”로 바꿔 9,800원을 넣고 4.596%(약 4.60%)가 나오는지 확인한 뒤, 100원이나 0원을 넣어 오류가 어떻게 나오는지 보세요. 지난 날을 0에서 181까지 옮기며 깨끗한 가격과 더러운 가격 가운데 어느 쪽이 매끄럽게 움직이는지 적어 보세요.'],
 sensitivity:['금리 1%p에 몇 % 움직이나','채권을 고르고 금리 변화 Δy를 옮기며 정확한 가격 변화와 듀레이션 어림(접선), 볼록성까지 더한 어림을 견주고, 현금흐름의 무게중심을 시소로 봅니다.','나라 10년에 금리 +3%p를 주면 정확한 가격 변화는 몇 %이고, 듀레이션만 쓴 어림과 볼록성까지 더한 어림은 각각 몇 %일까요?','세 채권을 하나씩 끄고 켜며 시소의 받침점을 견주고, Δy를 −3%p에서 +3%p까지 옮기며 듀레이션 어림이 언제나 정확한 값보다 낮은지, 곧 하락은 부풀리고 상승은 덜 잡는지 확인해 보세요.'],
 'curve-board':['수익률 곡선 놀이판','기준금리, 앞으로 1년의 기대 경로, 기대 물가, 기간 프리미엄을 움직이며 3개월~10년 곡선과 장단기 금리차, 곡선 위 채권 값의 변화를 봅니다. 2026-10-07 실제 금리는 점으로만 찍습니다.','“한 번 인상” 곡선에서 실제로 0.25%p를 올리고 추가 기대가 없어지면, 10년 금리는 얼마나 움직일까요?','기간 프리미엄을 0으로 내린 뒤 기대 경로만 움직여 곡선이 평평·역전으로 바뀌는 자리를 찾고, 다시 1.5%p로 올려 같은 기대에서도 곡선이 정상으로 돌아오는지 보세요. 실제 점과 모형 곡선이 비슷해 보이는 설정을 찾았다면, 그것이 시장의 기대를 말해 주지 않는 까닭을 적어 보세요.'],
 spread:['회사채 = 국채 + 스프레드','국고 3년 금리, 새벽전자의 신용 스프레드, 회수율, 묶어 든 회사채 수를 바꾸며 두 채권의 값과 기준과 견준 변화, 스프레드로 어림한 부도 확률과 하나라도 부도날 확률을 봅니다.','스프레드가 3.00%p로 벌어지면 새벽전자 회사채의 값은 몇 원이 되고, 회수율 40%로 어림한 부도 확률 p는 몇 %일까요?','“국채 금리 +0.5%p”와 “스프레드 +0.5%p” 버튼을 차례로 눌러 두 채권 가운데 어느 쪽이 움직이는지 견주고, 회수율을 0%와 80%로 바꿔 같은 스프레드가 말하는 p가 얼마나 달라지는지 적어 보세요.'],
 gordon:['고든 모형과 할인율','배당, 할인율 r, 성장률 g를 바꾸며 고든 값과 할인율 민감도 1 ÷ (r − g)를 나라 10년의 수정 듀레이션과 견줍니다. 할인율이 움직일 때 성장률도 함께 움직이게 할 수 있습니다.','성장률이 5%여서 값이 66.67일 때 할인율을 1%p 내리면 값은 얼마가 되고, 몇 % 오를까요?','g를 r에 가깝게 올리며 할인율 민감도가 나라 10년의 몇 배까지 커지는지 보고, “함께 움직임”을 켜고 k를 1로 올리면 할인율을 내려도 값이 그대로인 까닭을 설명해 보세요.'],
 routes:['만기까지, 혹은 중간에','갖는 방법과 팔 때의 금리 변화를 바꾸며 나라 3년에서 받는 돈과 1년 수익을 계산하고, 장외·장내·개인투자용 국채의 구조 차이를 탭에서 글로 읽습니다.','같은 +1%p 충격이라도 남은 만기 2년에 팔 때와 1년에 팔 때, 금리가 그대로일 때보다 판 값은 각각 몇 % 깎일까요?','갖는 방법을 바꿔 가며 금리 변화 슬라이더가 결과를 바꾸는지 확인하고, 세 창구 탭을 읽은 뒤 만기까지 들 계획인지, 중간에 팔 수도 있는지에 따라 창구마다 무엇이 달라지는지 적어 보세요.'],
 'final-table':['마지막 과제: 세 갈래의 1년','산 날의 곡선, 1년 뒤 갈래, 누리200 성장률의 움직임, 새벽전자 스프레드의 변화를 바꾸며 다섯 상품의 산 값·1년 뒤 값·받은 이자·1년 수익과 (가)와의 차이를 한 표에 적습니다.','(다)에서 새벽전자의 스프레드까지 0.5%p 벌어지면 새벽전자의 1년 수익은 몇 %이고, (가)보다 몇 %p 낮을까요?','산 날의 곡선을 “동결 곡선”으로 바꿔 같은 (가)에서 나라 10년의 1년 수익이 얼마나 달라지는지 보고, 누리200의 성장률을 함께 움직였을 때 (나)의 합이 어떻게 바뀌는지 적어 보세요. 어느 갈래가 올지가 아니라, 상품마다 무엇이 차이를 만들었는지를 적는 과제입니다.']
};
const GUESS={'who-pays':'예: 약 ○.○○○%',ladder:'내린다 / 오른다, 약 ○%p',cashflow:'늘어난다 / 같다 / 줄어든다',price:'예: 약 ○○,○○○원, 비싸다 / 싸다',sensitivity:'예: 정확 −○%, 어림 −○% / −○%',
 'curve-board':'예: 약 +○.○○%p',spread:'예: 약 ○,○○○원, p ○%',gordon:'예: ○○○, +○○%',routes:'예: −○% / −○%','final-table':'예: +○%, −○%p'};
const pad=i=>String(i+1).padStart(2,'0');
/* 출처가 비어 있으면 조사 노트로 안내한다. */
function sourceLinks(ids){if(!ids.length)return '<p class="caption">이 장의 출처와 확인일은 <a href="docs/research.html">조사 노트</a>에 모아 두었습니다.</p>';return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">금리와 채권에서 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}</a>`).join('');}
const PATHS=[
 ['광고와 뉴스의 금리를 읽고 싶다면','“평균 연 6.0%”와 기준금리 3.00%가 각각 누구의 숫자인지 가리고, 그 숫자를 손에 쥐는 길까지 따라갑니다.',['rate','transmit','holding']],
 ['채권 값이 왜 움직이는지 알고 싶다면','현금흐름을 할인해 가격을 구하고, 금리 1%p에 값이 몇 % 움직이는지 잽니다.',['bond','price','duration']],
 ['금리 인하 소식이 자산에 주는 영향을 따지려면','곡선에 이미 들어 있는 기대와 신용 스프레드를 거쳐, 마지막 과제의 세 갈래를 계산합니다.',['curve','credit','final']]
];
function paths(){return `<div class="path-grid">${PATHS.map(([t,d,ids])=>`<div class="path"><h3>${t}</h3><p>${d}</p>${ids.map(id=>{const i=B.chapters.findIndex(c=>c.id===id);return `<a href="#${id}" aria-label="${pad(i)}장 ${U.esc(B.chapters[i].title)}">${pad(i)}</a>`;}).join('')}</div>`).join('')}</div>`;}
const SERIES='이 책은 시리즈 「금융과 투자 처음부터」의 3권입니다. 본문에 나오는 n권은 같은 시리즈의 다른 권이며, 지금은 1권 「돈의 시간 가치」, 4권 「주문 한 장이 체결되기까지」, 8권 「가격은 어떻게 흔들리는가」, 12권 「격자 하나에서 손익이 갈리기까지」가 공개되어 있습니다.';
const GLOSSARY=[['금리 r','빌린 돈 1원에 1년 동안 붙는 값. 계산할 때는 3.5%를 0.035처럼 소수로 쓴다.'],['%p · bp','두 백분율의 뺄셈은 %p(퍼센트포인트)로 적는다. 1bp는 0.01%p.'],['기준금리','한국은행 금융통화위원회가 정하는 정책금리. 하린이 이 금리로 직접 빌리거나 맡기지는 않는다.'],['CD · COFIX','CD는 석 달짜리 양도성예금증서의 금리, COFIX는 은행이 돈을 모으는 비용을 모은 지수.'],['액면 · 표면금리 · 이표','액면은 만기에 돌려받는 원금(이 책은 10,000원), 표면금리는 액면에 대한 연 이자 비율, 이표는 한 번에 받는 이자.'],['할인채','중간 이자 없이 만기에 액면만 주는 채권. 처음에 액면보다 싸게 팔린다.'],['만기수익률','받을 돈을 할인한 합을 시장 가격과 같게 만드는 금리. 채권 한 장의 내부수익률.'],['할증 · 액면가 · 할인 채권','시장 금리가 표면금리보다 낮아 액면보다 비싼 채권, 같아서 액면과 같은 채권, 높아서 싼 채권.'],['경과이자','직전 이자 지급일부터 쌓인 이표의 몫. 더러운 가격 = 깨끗한 가격 + 경과이자.'],['듀레이션 D','현금흐름의 오늘 값으로 무게를 단 평균 시점(해). 할인채는 만기와 같다.'],['수정 듀레이션 D_mod','D ÷ (1 + y/2). 금리가 1%p 오를 때 가격이 대략 몇 % 내리는지.'],['볼록성 C','가격과 금리 곡선의 휘어진 정도. ½ × C × (Δy)²로 어림을 고친다.'],['DV01','금리가 1bp 움직일 때 가격이 움직이는 원 단위 크기.'],['수익률 곡선','만기별 금리를 이은 선. 정상(길수록 높음)·평평·역전으로 나눈다.'],['기간 프리미엄','긴 채권의 가격 위험을 지는 대가로 더 얹는 금리. 이 책의 놀이판에서는 가정이다.'],['장단기 금리차','긴 금리 − 짧은 금리. 이 책의 놀이판은 10년 − 3개월로 잰다.'],['신용 스프레드','같은 만기 국채 금리 위에 회사채가 더 얹는 금리.'],['회수율 R','부도가 났을 때 돌려받는 비율. 기대 손실 ≈ p × (1 − R).'],['고든 성장 모형','P = D₁ ÷ (r − g). g가 r보다 작을 때만 뜻이 있다.'],['롤다운 · 액면 수렴','만기가 짧아지며 곡선의 더 낮은 금리 자리로 내려가는 몫, 액면과 다른 값에 산 채권이 만기의 액면으로 다가가는 몫.'],['피셔 관계','(1 + 명목 금리) = (1 + 실질 금리) × (1 + 물가 상승률).']];
function sourcesSection(){
 return `<section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">기준금리와 결정일, CD·국고채 금리, COFIX와 예금·대출 금리, 개인투자용 국채 조건처럼 바깥에서 가져온 사실은 조사 노트에 확인일과 함께 적었습니다. 공식 원문을 연 것과 보도나 2차 자료로만 확인한 것을 나눠 두었습니다.</p><div class="note">하린, 가상의 은행 물결은행, 가상의 국채 나라 3년·나라 10년, 가상의 새벽전자 3년 회사채, 가상의 ETF 누리200은 이 책을 위해 지어낸 것입니다. 이 책은 특정 상품이나 매매 시점을 권하지 않으며, 금리의 방향을 예측하지 않습니다. 결과 문장은 “이 가정에서는 숫자가 어떻게 되는가”만 말합니다. 모든 실험은 js/math.js의 식대로 브라우저에서 실제로 계산하고, 결과 끝의 꼬리표로 무엇 위에서 계산했는지 밝힙니다. “실제 금리를 가상 채권에 넣은 값”은 2026-10-07 국고채 금리 같은 실제 숫자를 가상의 채권에 넣은 것이고, “교육용 모형, 예측이 아님”은 6장 수익률 곡선 놀이판의 가정 위에서 계산한 것이며, “미리 정한 가상 시나리오”는 이 책이 정한 전달 속도나 1년 뒤 갈래입니다. 그림의 색은 돕는 표시일 뿐이며, 같은 내용을 글자와 기호(▲ 할증·고른 값, ▼ 할인, ↗·→·↘ 곡선 모양, 실선·점선 이름표)로도 적었습니다. 출처와 단순화한 부분은 <a href="docs/research.html">조사 노트</a>에 있습니다.<br>${SERIES}</div>${B.sources.length?sourceLinks(B.sources.map((_,i)=>i)):''}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary">${GLOSSARY.map(([t,d])=>`<p><b>${t}</b> ${d}</p>`).join('')}</div></section>`;
}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">BASE RATE, YIELD CURVE, BOND PRICE</div><h1>금리와 채권<br><em>기준금리에서 채권 가격까지</em></h1><p class="lead">하린은 1권에서 모아 둔 1,000만 원과 신용대출을 같은 날로 옮겨 저울에 올렸습니다. 이번에는 그 돈의 일부를 3년 동안 맡길 곳을 찾다가, 같은 주에 예금 3.5%와 신용대출 6%대, 국채 광고의 “평균 연 6.0%”, 뉴스의 기준금리 3.00%를 듣습니다. 이 책은 그 숫자들이 누가 누구에게 내는 값인지 가리는 데서 시작해, 기준금리가 시장으로 번지는 길과 채권의 현금흐름·가격·민감도, 수익률 곡선과 신용 스프레드, 할인율로 본 주식까지 차례로 계산합니다. 마지막에는 금리 인하가 예고된 해에 다섯 상품이 1년 뒤 어떻게 달라지는지 세 갈래로 나누어 적습니다.</p><div class="hero-links"><a class="button primary" href="#rate">01장부터 읽기</a><a class="button" href="#curve">수익률 곡선 놀이판</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>0</b>금리 예측</span></div><p class="caption">금리를 읽다 → 채권 한 장을 계산하다 → 곡선과 신용, 그리고 내 자산 → 마지막 과제<br>모든 계산은 브라우저 안에서 하며, 은행·채권·회사·인물은 모두 가상입니다.</p><p class="caption series-note">${SERIES}</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>하린의 표 한 장을 끝까지 채웁니다</h2><p>예금, 나라 3년, 나라 10년, 새벽전자 회사채, 누리200이 장마다 하나씩 표에 오르고, 마지막 과제에서 한 해를 함께 지납니다.</p></div>${flow(['금리를 읽다|누가 내는 금리인가 · 기준금리가 번지는 길 (1~2장)','채권 한 장을 계산하다|현금흐름 · 가격과 만기수익률 · 듀레이션 (3~5장)','곡선과 신용, 그리고 내 자산|수익률 곡선 · 스프레드 · 주식 · 보유 (6~9장)','마지막 과제|인하가 예고된 해의 세 갈래 (10장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 바꾸어 보고, 숫자와 그림으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${pad(i)} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 질문 중심으로 돌아보세요.</p></div>${paths()}</section>
 ${sourcesSection()}`;
 cleanup=BHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${pad(index)}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}<label class="my-guess" for="guess-${id}"><span>내 예측 적어 두기</span><input id="guess-${id}" type="text" autocomplete="off" placeholder="${GUESS[id]||'짐작한 답을 짧게'}"></label></div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross||!c.cross.length)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=window.BFigures?.render(c.id),caption=art?art.caption:`${c.subtitle}`;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. data-* 값은 원래 번호다. */
function choices(q,target,attr){return U.choiceOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function navLinks(index){
 const prev=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${B.chapters[index+1].desc}</small></a>`:'<a href="../market/#route">다른 책 · 주문 한 장이 체결되기까지 · 주문은 어디로 가는가<small>이동 이유: 이 책에서 계산한 채권 값은 실제로 사고팔 때 주문이 되어 시장으로 갑니다. 시리즈 4권은 주문이 증권사를 거쳐 거래소로 가 체결되는 길을 따라가므로, 9장에서 글로만 견준 장내·장외의 차이를 그 길 위에서 다시 볼 수 있습니다.</small></a>';
 return `<nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${pad(index)}. ${c.title} · 금리와 채권`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>${index?'앞 장 떠올리기':'먼저 떠올리기'}</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${body}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source||[])}${cross(c)}</section>${navLinks(index)}</div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);BLabs[id](el);BGuides.mount(id,el);});
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
