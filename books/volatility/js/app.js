(()=>{
'use strict';
const U=VUI,B=VBook,main=document.querySelector('main'),BOOK_TITLE='가격은 어떻게 흔들리는가 · 수익률과 변동성의 수학';let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측 질문(L2)은 본문이 계산하지 않은 새 사례이며, 조작 전에 읽도록 실험 위에 둔다. 답은 VMath 계산과 같다(tests/math.test.cjs). */
const info={
 returns:['단순 수익률과 로그 수익률로 이어 보기','가격을 직접 적거나 새벽전자 앞 120일 종가를 골라 기간마다 단순·로그 수익률을 적고, 산술 평균과 기간 전체 수익률(단순 수익률을 곱해 이은 값, 로그 수익률을 더해 되돌린 값)을 견줍니다.','가격이 100 → 80 → 100으로 움직였다면 두 단순 수익률의 산술 평균은 몇 %이고, 기간 전체 수익률은 몇 %일까요?','가격을 100, 120, 90으로 바꿔 확인 문제의 −10%를 확인하고, “단순 수익률을 더해 이은 값” 선이 실제 가격과 어디서 갈라지는지 그림에서 찾아보세요.'],
 reset:['날마다 다시 맞추는 2배 상품','흔들림 폭 a, 거래일 수, 배율 k를 바꾸며 제자리로 돌아오는 지수 위에서 날마다 k배로 맞춘 상품의 끝 값, 한 쌍마다 곱해지는 배수, “기간 수익률 × k”와의 차이를 봅니다.','흔들림 폭 a를 2.5%로 키우면 250거래일 뒤 2배 상품의 손실은 몇 %일까요?','a를 1%, 2%, 3%로 바꿔 손실을 적고, 폭이 두 배가 될 때 손실이 몇 배가 되는지 계산해 보세요. 배율을 인버스 2배와 3배로 바꾸면 끝 값이 같은 까닭도 설명해 보세요.'],
 ruler:['표준편차·연율화·ATR 세 자','창(20일·60일·1년), 기준 날, ATR 기간을 바꾸며 새벽전자 기록의 하루 σ와 연율 변동성, 81일째 참범위, ATR이 갭에 얼마나 뛰는지 봅니다.','ATR 기간을 14일에서 5일로 줄이면 81일째 갭에 ATR은 몇 원 뛸까요? 14일 ATR의 +60원보다 클까요, 작을까요?','기준 날을 81일째 앞뒤로 옮기며 20일 창과 60일 창의 연율 변동성이 언제 뛰고 언제 가라앉는지 적어 보세요.'],
 coin:['동전으로 만든 1년','시드, 하루 추세 μ, 하루 변동성 σ, 경로 수를 바꾸며 한 경로의 모양과, 시드 1부터 만든 경로 묶음의 1년 끝값이 얼마나 퍼지는지 봅니다.','하루 1%, 추세 0인 경로 200개(시드 1부터) 가운데 끝값이 시작가에서 20% 넘게 벗어난 경로는 몇 개쯤일까요?','시드를 바꿔 가며 추세가 0인데도 “오르는 종목”처럼 보이는 경로를 하나 더 찾고, σ를 2%로 키우면 ±σ√250 밖 경로의 비율이 달라지는지 확인해 보세요.'],
 tails:['3σ 밖의 날 세기','잡음을 정규분포와 t분포로 바꾸고 자유도 ν를 움직이며 3σ 밖의 날 비율, 초과 첨도, 가장 나빴던 하루를 새벽전자 기록과 함께 봅니다.','t분포의 자유도 ν를 30으로 올리면 3σ 밖의 날 비율은 정규(0.25%)와 t(6)(1.01%) 사이 어디쯤일까요?','ν를 3부터 30까지 옮기며 3σ 밖 비율과 초과 첨도가 어떻게 바뀌는지 적고, 새벽전자의 초과 첨도가 음수인데도 3σ 밖의 날이 있는 까닭을 설명해 보세요.'],
 acf:['자기상관 막대와 띠','새벽전자 기록 또는 φ·κ를 단 생성기를 골라 시차 1~10의 자기상관과 ±1.96/√n 띠, 띠 밖으로 나간 경로의 비율을 봅니다.','κ를 0.05로 약하게 켜면 경로 300개의 ρ₁ 평균은 얼마이고, 띠 밖으로 나간 경로는 몇 %쯤일까요?','φ = 0.3과 κ = 0.2를 차례로 켜 ρ₁의 부호와 띠 밖 비율을 견주고, 새벽전자 앞 120일의 ρ₁이 양수인데도 박스권인 까닭을 ρ₄와 ρ₈로 설명해 보세요.'],
 vratio:['분산비 VR(q)와 z','기록과 q, 생성기의 κ와 경로 수를 바꾸며 VR(q)와 z, 무작위 보행을 기각하는 비율을 봅니다.','κ = 0.05로 약하게 끌려가는 경로 1,000개(시드 11부터)에 VR(5) 검정을 하면 몇 %에서 무작위 보행을 기각할까요?','새벽전자 앞 120일에서 q를 2부터 12까지 옮기며 VR이 1을 위아래로 넘나드는 자리를 찾고, q를 미리 정해야 하는 까닭을 적어 보세요.'],
 crossing:['가격선을 건넌 횟수','생성기의 κ·변동성·날 수를 바꾸거나 새벽전자와 하린의 격자 선 21개를 골라 선을 건넌 횟수를 셉니다.','하루 변동성을 1%에서 2%로 두 배 키우면 시작가 선을 건너는 평균 횟수는 어떻게 될까요?','κ를 0, 0.05, 0.2로 바꿔 평균 통과 횟수를 적고, 날 수를 1,000일로 늘리면 κ = 0의 횟수가 몇 배가 되는지 확인해 보세요.'],
 underwater:['낙폭 곡선과 회복 기간','새벽전자 1년, 제자리 경로의 2배 상품, 생성기 경로를 골라 낙폭 곡선과 최대 낙폭, 회복 여부, 되찾는 데 필요한 상승률을 봅니다.','하루 1%, 추세 0인 무작위 보행의 기간을 250일에서 1,000일로 늘리면 최대 낙폭의 중앙값은 얼마나 깊어질까요?','κ를 0, 0.05, 0.2로 바꿔 중앙값을 적고, 되찾을 낙폭에 −30%와 −50%를 넣어 필요한 상승률이 낙폭보다 빨리 커지는 것을 확인해 보세요.'],
 records:['마지막 과제: 기록 두 장과 우연','첫 장의 배율, 둘째 장의 구간, 견줄 무작위 보행 수를 바꾸며 1~9장의 숫자를 한 번에 계산하고, 같은 σ의 무작위 보행에서 그만한 값이 나오는 비율을 봅니다.','같은 누리200의 1년을 날마다 −2배로 맞춘 인버스 2배 상품은 100에서 얼마가 되었을까요?','구간을 “생성한 130일”로 바꿔 ρ₁·VR(5)·VR(8)이 어떻게 바뀌는지 적고, 1년 전체의 숫자가 최근 여섯 달에 대해 말해 주지 못하는 것을 한 문장으로 적어 보세요.']
};
const GUESS={returns:'예: 평균 ○%, 전체 ○%',reset:'예: 약 −○%',ruler:'예: 약 ○원, 크다 / 작다',coin:'예: 약 ○개',tails:'예: 약 0.○%',acf:'예: ρ₁ 약 ○, ○%',vratio:'예: 약 ○%',crossing:'늘어난다 / 그대로 / 줄어든다',underwater:'예: 약 −○%',records:'예: 약 ○'};
const pad=i=>String(i+1).padStart(2,'0');
/* 출처가 비어 있으면 조사 노트로 안내한다. */
function sourceLinks(ids){if(!ids.length)return '<p class="caption">이 장의 출처와 확인일은 <a href="docs/research.html">조사 노트</a>에 모아 두었습니다.</p>';return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">가격의 흔들림에서 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}</a>`).join('');}
const PATHS=[
 ['레버리지 상품의 1년이 궁금하다면','수익률이 곱해진다는 것에서 출발해, 날마다 다시 맞추는 상품이 오르내림만으로 깎이는 크기를 계산합니다.',['returns','drag','final']],
 ['흔들림을 숫자로 재고 싶다면','표준편차와 ATR로 흔들림을 재고, 그 숫자가 감추는 꼬리와 낙폭을 따로 셉니다.',['measure','tails','drawdown']],
 ['박스권인지 추세인지 묻고 싶다면','자기상관, 분산비, 통과 횟수를 같은 흔들림의 무작위 보행과 견주어 읽습니다.',['revert','trend','cross']]
];
function paths(){return `<div class="path-grid">${PATHS.map(([t,d,ids])=>`<div class="path"><h3>${t}</h3><p>${d}</p>${ids.map(id=>{const i=B.chapters.findIndex(c=>c.id===id);return `<a href="#${id}" aria-label="${pad(i)}장 ${U.esc(B.chapters[i].title)}">${pad(i)}</a>`;}).join('')}</div>`).join('')}</div>`;}
const SERIES='이 책은 시리즈 「금융과 투자 처음부터」의 8권입니다. 본문에 나오는 n권은 같은 시리즈의 다른 권이며, 지금은 1권 「돈의 시간 가치」, 4권 「주문 한 장이 체결되기까지」, 12권 「격자 하나에서 손익이 갈리기까지」가 공개되어 있습니다.';
const GLOSSARY=[['단순 수익률','P_t / P_{t−1} − 1. 기간을 이을 때는 (1 + R)을 곱한다.'],['로그 수익률','ln(P_t / P_{t−1}). 기간을 이을 때는 더한다. 되돌릴 때는 e^r − 1.'],['일일 재조정','날마다 배율을 다시 맞추는 방식. k배 상품은 그날 지수 수익률의 k배만큼 움직인다.'],['변동성 손실','오르내림만으로 생기는 손실. 대략 흔들림의 제곱(분산)을 따라 커진다.'],['표준편차 σ','평균에서 벗어난 거리를 제곱해 평균하고 제곱근을 씌운 값. 이 책은 n − 1로 나눈다.'],['연율화','하루 σ에 √250을 곱해 1년 단위로 바꾸는 것. 하루하루가 독립이고 흔들림이 같다는 가정에 기댄다.'],['참범위·ATR','참범위는 고가 − 저가와 전날 종가와의 차이 가운데 가장 큰 값. ATR은 그 평균(Wilder 방식).'],['무작위 보행','서로 독립인 걸음을 이어 붙인 경로. 끝값은 날 수의 제곱근만큼 퍼진다.'],['시드','난수의 시작 숫자. 같은 시드면 같은 경로가 나온다.'],['몬테카를로','같은 설정으로 시드만 바꿔 여러 번 돌려 숫자의 분포를 세는 방법.'],['초과 첨도','네제곱 평균을 σ⁴로 나눈 값에서 3을 뺀 것. 정규분포는 0, 꼬리가 두꺼우면 커진다.'],['t분포·자유도 ν','ν가 작을수록 꼬리가 두꺼운 분포. 이 책은 분산이 1이 되도록 맞춰 쓴다.'],['자기상관 ρ_k','같은 기록을 k일 밀어 놓고 잰 상관. 독립이면 95%가 ±1.96/√n 안에 든다.'],['φ와 κ','φ는 어제 수익률을 이어받는 정도(추세처럼 보임), κ는 가격을 시작가 쪽으로 당기는 비율(박스권처럼 보임).'],['분산비 VR(q)','q일 수익률의 분산을 하루 분산의 q배로 나눈 값. 1보다 크면 같은 방향이 이어지는 쪽, 작으면 되돌림 쪽.'],['구간 통과','가격이 한 선의 한쪽에서 반대쪽으로 넘어간 것. 닿기만 하고 돌아가면 세지 않는다.'],['최대 낙폭','지나온 최고 값에서 가장 깊이 떨어진 비율. 되찾으려면 1 / (1 + 낙폭) − 1만큼 올라야 한다.']];
function sourcesSection(){
 return `<section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">레버리지 상품의 거래 요건, 실제 지수의 꼬리, 분산비 연구처럼 바깥에서 가져온 사실은 조사 노트에 확인일과 확인 수준을 함께 적었습니다. 공식 원문을 연 것과 보도나 증권사 안내로만 확인한 것을 나눠 두었습니다.</p><div class="note">하린, 가상의 회사 새벽전자, 가상의 ETF 누리200과 누리200 2배, 모든 가격 기록은 이 책을 위해 지어낸 것입니다. 이 책은 특정 종목·상품·매매 시점을 권하지 않으며, 다음 가격의 방향을 말하지 않습니다. 결과 문장은 “이 가정에서는 숫자가 어떻게 되는가”만 말합니다. 모든 실험은 js/math.js의 식대로 브라우저에서 실제로 계산하고, 결과 끝의 꼬리표로 무엇 위에서 계산했는지 밝힙니다. “미리 정한 가상 경로”는 새벽전자 기록과 제자리 경로, “생성기”는 시드를 밝힌 난수로 뽑은 가상 경로입니다. 그림의 색은 돕는 표시일 뿐이며, 같은 내용을 글자와 기호(▲ 띠 밖·고른 값, ✓, ✗, 실선·점선 이름표)로도 적었습니다. 출처와 단순화한 부분은 <a href="docs/research.html">조사 노트</a>에 있습니다.<br>${SERIES}</div>${B.sources.length?sourceLinks(B.sources.map((_,i)=>i)):''}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary">${GLOSSARY.map(([t,d])=>`<p><b>${t}</b> ${d}</p>`).join('')}</div></section>`;
}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">RETURNS, VOLATILITY, RANDOM WALKS</div><h1>가격은 어떻게<br><em>흔들리는가</em></h1><p class="lead">하린은 12권에서 새벽전자 주식에 격자를 깔고 6개월 장부를 읽었습니다. 그때 감으로만 답한 질문이 남았습니다. 이 종목은 앞으로도 오르내릴까, 한쪽으로 갈까. 이 책은 그 질문을 숫자로 따져 봅니다. −50% 다음 +50%가 왜 −25%인지에서 시작해, 날마다 2배로 맞추는 상품이 제자리 지수에서 잃는 까닭, 흔들림을 재는 자, 동전으로 만든 가격과 견주는 법을 차례로 익히고, 마지막에는 하린의 1년 기록 두 장에 모든 자를 댑니다.</p><div class="hero-links"><a class="button primary" href="#returns">01장부터 읽기</a><a class="button" href="#drag">2배 상품 실험</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>0</b>방향 예측</span></div><p class="caption">수익률을 세다 → 흔들림의 모형 → 경로를 읽다 → 마지막 과제<br>모든 계산은 브라우저 안에서 하며, 회사·상품·인물·가격 기록은 모두 가상입니다.</p><p class="caption series-note">${SERIES}</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>하린의 기록 두 장을 끝까지 따라갑니다</h2><p>누리200과 누리200 2배의 1년, 새벽전자의 1년이 모든 장에 이어집니다. 각 단계가 아래 장과 연결됩니다.</p></div>${flow(['수익률을 세다|단순·로그 수익률·일일 재조정·σ와 ATR (1~3장)','흔들림의 모형|무작위 보행·두꺼운 꼬리·자기상관 (4~6장)','경로를 읽다|분산비·통과 횟수·최대 낙폭 (7~9장)','마지막 과제|기록 두 장과 같은 흔들림의 우연 (10장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 바꾸어 보고, 숫자와 그림으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${pad(i)} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 질문 중심으로 돌아보세요.</p></div>${paths()}</section>
 ${sourcesSection()}`;
 cleanup=VHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${pad(index)}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}<label class="my-guess" for="guess-${id}"><span>내 예측 적어 두기</span><input id="guess-${id}" type="text" autocomplete="off" placeholder="${GUESS[id]||'짐작한 답을 짧게'}"></label></div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross||!c.cross.length)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=window.VFigures?.render(c.id),caption=art?art.caption:`${c.subtitle}`;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. data-* 값은 원래 번호다. */
function choices(q,target,attr){return U.choiceOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function navLinks(index){
 const prev=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${B.chapters[index+1].desc}</small></a>`:'<a href="../grid/#final">다른 책 · 격자 하나에서 손익이 갈리기까지 · 하린의 6개월 격자 장부<small>이동 이유: 이 책의 질문은 12권 마지막 과제의 6개월 장부 앞에서 시작했습니다. 분산비와 통과 횟수, 최대 낙폭을 손에 쥔 지금 그 장부를 다시 펼치면, 범위를 옮길지 멈출지 정한 결정을 숫자로 다시 따져 볼 수 있습니다.</small></a>';
 return `<nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${pad(index)}. ${c.title} · 가격은 어떻게 흔들리는가`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>${index?'앞 장 떠올리기':'먼저 떠올리기'}</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${body}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source||[])}${cross(c)}</section>${navLinks(index)}</div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);VLabs[id](el);VGuides.mount(id,el);});
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
