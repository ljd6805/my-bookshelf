(()=>{
'use strict';
const U=GUI,B=GBook,main=document.querySelector('main'),BOOK_TITLE='격자 하나에서 손익이 갈리기까지 · 그리드 매매의 원리';let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측 질문(L2)은 본문이 계산하지 않은 새 사례이며, 조작 전에 읽도록 실험 위에 둔다. 답은 GMath 계산과 같다(tests/math.test.cjs). */
const info={
 ladder:['칸 스무 개에 주문 걸기','지나온 가격과 마지막 가격을 바꾸며 칸마다 매도 대기·매수 대기·주문 없음 가운데 어느 상태인지, 지금 어떤 주문이 걸려 있는지 봅니다.','19,900원에서 주식 없이 시작한 가격이 19,100원까지 내려갔다가 19,700원으로 돌아오면 매수와 매도는 각각 몇 번 체결되고, 끝에 몇 칸이 주식을 들고 있을까요?','가격을 19,900 → 20,500 → 19,900원으로 바꿔 위쪽 칸에 주문이 언제 걸리는지 확인하고, 마지막 가격을 18,000원까지 내려 “주문 없음” 칸이 몇 개 남는지 세어 보세요.'],
 cellpl:['한 칸 왕복의 손익 계산서','매수가·간격·수량·종목을 바꾸며 수수료와 거래세를 뺀 남는 몫, 본전 매도가, 가장 좁은 이익 간격, 눈금 판정을 봅니다.','21,800원에 5주를 사서 50원 위인 21,850원에 팔면 비용을 내고 얼마가 남을까요? 이 매수가에서 남는 가장 좁은 간격은 몇 원일까요?','매수가를 18,000원에 두고 간격을 40원과 50원으로 바꿔 손익의 부호가 바뀌는 자리를 찾은 뒤, 종목을 ETF로 바꾸면 그 자리가 어떻게 달라지는지 적어 보세요.'],
 spacing:['등차와 등비 가격표 만들기','하단·상단·칸 수·나누는 방식을 바꾸며 눈금에 맞춘 뒤의 가격표, 칸마다 간격(원과 %), 튀는 칸, 한 바퀴 몫과 묶이는 돈을 봅니다.','같은 18,000~22,000원을 등비로 40칸 나누면, 2만 원 위의 칸들은 모두 같은 간격일까요?','등비 20칸에서 튀는 칸 두 개를 찾고, 칸 수를 바꿔 가며 2만 원 위의 튀는 칸이 사라지는 칸 수가 있는지 찾아보세요.'],
 range:['범위와 칸 수의 맞바꿈','범위와 칸 수를 바꾸며 간격, 최악의 경우 묶이는 돈과 한도 300만 원, 박스권 경로에서 격자가 쉬는 시간을 봅니다. 박스권 경로는 20,000원을 가운데 두고 ±7% 안에서 80거래일 동안 오르내리는 가상의 가격이고, 5장에서 이 길을 처음부터 걸어 봅니다.','범위를 19,000~21,000원으로 좁혀 20칸을 깔면, 80거래일 박스권 경로에서 가격이 범위 밖에 있는 시간은 전체의 몇 %쯤일까요?','묶이는 돈이 300만 원을 넘지 않는 안에서 칸 수를 가장 많이 늘려 보고, 그때 간격이 2장의 최소 간격 50원보다 넓은지 확인해 보세요.'],
 box:['박스권에서 칸 왕복 세기','간격과 경로를 바꾸며 칸이 몇 번 왕복하는지, 실현 손익과 수수료·거래세, 끝에 남은 주식을 봅니다.','같은 세 번 오가는 경로에 간격 400원(10칸) 격자를 깔면 왕복은 몇 번이고, 실현 손익은 200원 간격의 38,614원보다 많을까요, 적을까요?','경로를 80거래일 박스권으로 바꿔 세 간격의 손익과 남은 주식을 견주고, 가장 많이 남긴 간격이 세 번 오가는 경로와 같은지 적어 보세요.'],
 rally:['오르막에서 비어 가는 격자','시작 방식과 볼 날짜를 바꾸며 격자의 실현 손익과 현금, 범위 위에서 쉰 시간, 같은 돈으로 들고만 있었을 때의 손익을 봅니다.','같은 상승 경로를 주식 없이 빈손으로 시작하면, 실현 손익은 채워서 시작한 105,927원과 견주어 얼마가 될까요?','볼 날짜를 11거래일 근처로 옮겨 가격이 범위 위로 빠져나가는 때를 찾고, 그 뒤로 격자와 보유의 차이가 어떻게 벌어지는지 적어 보세요.'],
 slide:['내리막에 쌓이는 재고','하락 경로와 곧장 내려가는 길을 바꾸며 들고 있는 칸과 주식 수, 평균 단가, 평가·실현 손익, 가장 많이 들어간 현금을 봅니다.','19,900원에서 18,900원까지 곧장 내려가면 몇 칸이 차고, 평균 단가와 평가 손익은 얼마일까요?','곧장 내려갈 가격을 16,000원과 15,000원으로 바꿔 평균 단가가 그대로인 까닭과 평가 손실이 커지는 폭을 설명해 보세요.'],
 gap:['시가가 건너뛴 날의 체결','첫날 종가, 다음 날 시가, 그날 이어진 가격을 바꾸며 걸려 있던 주문의 체결가와 이어지는 매도, 갭이 없을 때와의 차이를 봅니다.','19,900원으로 끝난 다음 날 시가가 19,300원에 열렸다가 그날 19,900원으로 돌아오면, 몇 칸이 시가에 체결되고 실현 손익은 갭이 없을 때보다 얼마나 많을까요?','시가를 13,000원으로 넣고 이어진 가격을 13,930원에 두어 하한가로 열린 날의 체결가와 들어간 돈을 확인하고, 첫 칸이 팔리려면 얼마나 돌아와야 하는지 적어 보세요.'],
 ledger:['장부 양쪽 맞추기','경로와 분모를 바꾸며 현금 + 주식 평가액 = 시작 자금 + 실현 손익 + 평가 손익이 맞는지, 청산 금액과 기간·연 수익률을 봅니다.','박스권 80거래일의 같은 손익 77,967원을 하린의 한도 300만 원으로 나누면 기간 수익률과 연 수익률은 얼마일까요?','세 경로와 세 분모를 모두 바꿔 두 합이 늘 같은지 확인하고, 연 수익률이 가장 크게 부풀려지는 조합을 그 까닭과 함께 적어 보세요.'],
 capital:['한도 안의 칸당 수량과 최악의 손실','한도, 칸당 수량, 내려갈 가격을 바꾸며 수량마다 묶이는 돈, 한도 안의 최대 수량, 남는 돈, 최악의 손실을 봅니다.','칸당 6주로 깔았는데 최악의 경우 가격이 17,000원까지 내려가 그 값에 모두 판다면 손실은 얼마일까요?','칸당 수량을 7주로 올린 뒤 남는 돈과 16,000원 최악 손실을 5주일 때와 견주고, 손실 비율이 왜 그대로인지 설명해 보세요.'],
 compare:['같은 돈, 같은 길, 네 가지 방법','경로와 종목, 적립식의 횟수·간격, 리밸런싱의 비중·간격을 바꾸며 격자·보유·적립식·리밸런싱의 끝 손익, 비용, 거래 수, 최대 낙폭을 봅니다.','80거래일 박스권에 같은 1,990,289원을 두고 적립식은 20거래일마다 네 번, 리밸런싱은 20거래일마다 50%로 맞추면, 네 방법 가운데 무엇이 가장 많이 남길까요?','경로를 상승·하락·박스권으로 바꿔 격자가 몇 번째에 오는지 적고, 종목을 ETF로 바꿀 때 격자의 비용이 얼마나 줄어드는지 확인해 보세요.'],
 exit:['멈춤 가격과 손실 한도 시험하기','멈춤 가격, 손실 한도, 옮길 범위를 바꾸며 하락 경로에서 멈추는 날과 가격, 손익, 한도를 넘어선 폭, 범위를 옮길 때 더 묶이는 돈을 봅니다.','하락 경로에 손실 한도 5만 원을 붙이면 손익은 −5만 원에서 정확히 멈출까요? 넘는다면 얼마나 넘을까요?','멈춤 가격을 18,000원, 17,500원, 17,000원으로 바꿔 손익을 적고, 멈춤 가격이 낮을수록 늘 더 잃는지 확인해 보세요.'],
 final6m:['마지막 과제: 6개월 장부와 네 가지 결정','격자 범위, 지금 고르는 결정, 처음부터 붙인 규칙을 바꾸며 달마다 장부와 갭 체결, 결정마다 더 드는 돈·최악의 손실·확정 손익을 한 표에 놓습니다.','처음부터 범위를 16,000~24,000원으로 넓혀 같은 20칸을 깔았다면, 6개월 끝 장부의 합은 −125,006원보다 나았을까요?','결정 네 가지와 규칙 세 가지를 차례로 바꿔 더 드는 돈·최악의 손실·지금 확정되는 손익을 표로 옮기고, 미리 적은 규칙과 어긋나는 결정이라면 그 까닭을 한 문장으로 적어 보세요.']
};
const GUESS={ladder:'예: 매수 ○번, 매도 ○번, ○칸',cellpl:'예: ○원 남음, 최소 ○원',spacing:'같다 / 다르다',range:'예: ○%',box:'예: ○번, 많다 / 적다',rally:'예: 약 ○만 원',slide:'예: ○칸, ○원, −○원',gap:'예: ○칸, ○원 더',ledger:'예: ○%, 연 ○%',capital:'예: 약 ○만 원',compare:'예: 격자 / 보유 / 적립식 / 리밸런싱',exit:'예: 정확히 멈춤 / ○원 넘음',final6m:'예: 나았다 / 나빴다, 약 ○원'};
const pad=i=>String(i+1).padStart(2,'0');
/* 출처가 비어 있으면 조사 노트로 안내한다. */
function sourceLinks(ids){if(!ids.length)return '<p class="caption">이 장의 출처와 확인일은 <a href="docs/research.html">조사 노트</a>에 모아 두었습니다.</p>';return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">격자 하나에서 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}</a>`).join('');}
const PATHS=[
 ['지금 격자를 깔아 두었다면','칸이 비용을 넘는지, 최악의 경우 얼마가 묶이고 얼마를 잃을 수 있는지부터 확인합니다.',['cell','range','capital']],
 ['가격이 범위를 벗어났다면','내리막에 쌓인 재고를 장부로 읽고, 멈춤 규칙을 미리 숫자로 적어 시험합니다.',['slide','ledger','exit']],
 ['격자를 다른 방법과 견주고 싶다면','오르막과 내리막에서 보유·적립식·리밸런싱과 같은 돈, 같은 길로 견줍니다.',['rally','slide','compare']]
];
function paths(){return `<div class="path-grid">${PATHS.map(([t,d,ids])=>`<div class="path"><h3>${t}</h3><p>${d}</p>${ids.map(id=>{const i=B.chapters.findIndex(c=>c.id===id);return `<a href="#${id}" aria-label="${pad(i)}장 ${U.esc(B.chapters[i].title)}">${pad(i)}</a>`;}).join('')}</div>`).join('')}</div>`;}
const SERIES='이 책은 시리즈 「금융과 투자 처음부터」의 12권입니다. 본문에 나오는 n권은 같은 시리즈의 다른 권이며, 지금은 1권 「돈의 시간 가치」와 4권 「주문 한 장이 체결되기까지」가 공개되어 있습니다.';
const GLOSSARY=[['격자(그리드)','일정한 간격으로 늘어선 가격과 그 사이 칸 전체. 칸마다 아래 가격에 사고 위 가격에 판다.'],['매수 대기·매도 대기','빈 칸은 아래 가격에 매수 주문을, 산 칸은 위 가격에 매도 주문을 걸어 두고 기다린다.'],['호가단위','주문할 수 있는 가격의 눈금. 2만 원 아래는 10원, 2만 원 이상 5만 원 미만은 50원.'],['비용률','한 번 왕복할 때 가격에서 빠지는 비율. 주식은 약 0.23%, 국내 주식형 ETF는 약 0.03%.'],['등차 격자','칸마다 같은 원 간격으로 나눈 격자.'],['등비 격자','칸마다 같은 비율 간격으로 나눈 뒤 눈금에 맞춘 격자.'],['박스권','가격이 일정한 범위 안에서 오르내리기만 하는 시장.'],['왕복','한 칸을 사서 판 것 한 번.'],['실현 손익','판 칸에서 확정된 손익. 매도 금액에서 비용과 산 돈을 뺀다.'],['평가 손익','들고 있는 주식을 지금 값으로 쳤을 때의 손익. 팔 때 비용은 빼지 않는다.'],['평균 단가','들고 있는 칸 매수가의 평균. 이 책은 수수료를 빼고 계산한다.'],['갭','전날 종가와 다음 날 시가 사이가 벌어진 것. 그사이 가격에서는 거래가 없다.'],['가격제한폭','하루에 움직일 수 있는 폭. 국내 주식은 전날 기준가의 ±30%.'],['최대 낙폭','지나온 최고 금액에서 가장 크게 떨어진 비율.'],['적립식','돈을 여러 번으로 나눠 정해진 간격마다 사는 방법.'],['리밸런싱','정해진 간격마다 주식과 현금의 비율을 처음 정한 비중으로 되돌리는 방법.'],['연 수익률(연환산)','기간 수익률을 곱해서 1년(거래일 250일)으로 늘린 값.']];
function sourcesSection(){
 return `<section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">호가단위·가격제한폭·거래세 같은 바깥 사실은 조사 노트에 확인일과 확인 수준을 함께 적었습니다. 거래소 규정 원문을 열 수 있었던 것과 증권사 안내나 보도로만 확인한 것을 나눠 두었습니다.</p><div class="note">하린, 가상의 회사 새벽전자, 가상의 ETF 누리200과 모든 가격 경로는 이 책을 위해 지어낸 것입니다. 이 책은 특정 종목·매매 시점·간격 설정을 권하지 않으며, 결과 문장은 “이 가정에서는 숫자가 어떻게 되는가”만 말합니다. 모든 실험은 js/math.js의 규칙대로 브라우저에서 실제로 계산합니다. 5장부터 13장까지의 가격 경로는 미리 정해 둔 가상 시나리오이고 실제 시세가 아닙니다. 그림의 색은 상태를 돕는 표시일 뿐이며, 같은 내용을 글자와 기호(● 매수 · ■ 매도 · ○ 매수 대기 · – 주문 없음 · ✓ · ✗)로도 적었습니다. 수수료 0.015%는 가정이고, 거래세 0.20%는 2026년 코스피·코스닥 주식의 세율입니다. 출처와 단순화한 부분은 <a href="docs/research.html">조사 노트</a>에 있습니다.<br>${SERIES}</div>${B.sources.length?sourceLinks(B.sources.map((_,i)=>i)):''}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary">${GLOSSARY.map(([t,d])=>`<p><b>${t}</b> ${d}</p>`).join('')}</div></section>`;
}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">GRID TRADING, CELL BY CELL</div><h1>격자 하나에서<br><em>손익이 갈리기까지</em></h1><p class="lead">하린은 가상의 회사 새벽전자 주식에 18,000원부터 22,000원까지 200원마다 주문을 걸어 두려 합니다. 칸마다 5주를 사고팔고, 최악의 경우에도 300만 원 안에 머무는 것이 목표입니다. 가격이 오르내리기만 하면 칸들은 정말 몫을 쌓아 줄까요? 칸 하나의 손익에서 시작해 박스권과 오르막, 내리막, 건너뛰는 시가를 차례로 지나고, 마지막에는 6개월 장부를 읽고 다음 결정을 숫자로 적어 봅니다.</p><div class="hero-links"><a class="button primary" href="#rule">01장부터 읽기</a><a class="button" href="#box">박스권 실험</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>0</b>매매 권유</span></div><p class="caption">격자를 깔다 → 시장을 지나가다 → 장부를 읽다 → 마지막 과제<br>모든 계산은 브라우저 안에서 하며, 회사·인물·가격 경로는 모두 가상입니다.</p><p class="caption series-note">${SERIES}</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>하린의 격자 한 장을 끝까지 따라갑니다</h2><p>18,000~22,000원 · 200원 · 20칸 · 칸당 5주의 격자가 모든 장에 이어집니다. 각 단계가 아래 장과 연결됩니다.</p></div>${flow(['격자를 깔다|칸의 규칙·한 칸의 손익·등차와 등비·범위 (1~4장)','시장을 지나가다|박스권·오르막·내리막·갭 (5~8장)','장부를 읽다|실현과 평가·자금 한도·다른 방법·멈춤 규칙 (9~12장)','마지막 과제|6개월 장부와 다음 결정 (13장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 바꾸어 보고, 숫자와 그림으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${pad(i)} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 질문 중심으로 돌아보세요.</p></div>${paths()}</section>
 ${sourcesSection()}`;
 cleanup=GHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${pad(index)}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}<label class="my-guess" for="guess-${id}"><span>내 예측 적어 두기</span><input id="guess-${id}" type="text" autocomplete="off" placeholder="${GUESS[id]||'짐작한 답을 짧게'}"></label></div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross||!c.cross.length)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=window.GFigures?.render(c.id),caption=art?art.caption:`${c.subtitle}`;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. data-* 값은 원래 번호다. */
function choices(q,target,attr){return U.choiceOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function navLinks(index){
 const prev=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${B.chapters[index+1].desc}</small></a>`:'<a href="../market/#final">다른 책 · 주문 한 장이 체결되기까지 · 하린의 격자 주문표 진단<small>이동 이유: 이 책의 격자는 4권 마지막 과제에서 고친 주문표에서 출발했습니다. 6개월 장부를 읽은 지금 그 주문표를 다시 펼치면, 눈금과 비용 말고도 범위·자금·멈춤 규칙이라는 빈칸이 보입니다.</small></a>';
 return `<nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${pad(index)}. ${c.title} · 격자 하나에서 손익이 갈리기까지`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>${index?'앞 장 떠올리기':'먼저 떠올리기'}</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${body}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source||[])}${cross(c)}</section>${navLinks(index)}</div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);GLabs[id](el);GGuides.mount(id,el);});
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
