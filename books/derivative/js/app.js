/* 화면 조립: 표지, 장 화면 일곱 블록, 해시 경로. 글은 content.js, 계산은 math.js, 실험은 labs-*.js에 있다. */
(()=>{
'use strict';
const U=DVUI,B=DVBook,MT=B.meta,main=document.querySelector('main');let cleanup=()=>{};
const BOOK=MT.short,FULL=MT.title,num=i=>String(i+1).padStart(2,'0');
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측은 처음 놓인 값이나 본문만 읽어서는 답할 수 없는 질문으로 쓴다. */
const info={
 interval:['두 시각을 골라 로켓의 평균 속도 계산하기','시작 시각 a와 끝 시각 b를 고르면 두 높이의 차이를 걸린 시간으로 나눠 평균 속도를 계산하고, 그래프 위 두 점을 잇는 할선을 그립니다.','처음 놓인 1초~2초 구간의 평균 속도는 5 m/s입니다. 구간을 양쪽으로 0.5초씩 넓힌 0.5초~2.5초의 평균 속도는 5 m/s보다 클까요, 작을까요, 같을까요?','평균 속도가 0 m/s인 구간을 0초~4초 말고 두 개 더 찾아, 세 구간의 a + b가 얼마인지 적어 보세요. 그 이유를 식 20 − 5(a + b)로 설명해 보세요.'],
 shrink:['구간을 줄이며 평균 속도가 다가가는 값 보기','기준 시각에서 시작하는 구간의 길이 Δt를 1초에서 0.0001초까지 줄이며 평균 속도를 표에 한 줄씩 더합니다.','기준 시각을 최고점인 t = 2초로 바꾸고 오른쪽 구간을 줄이면 평균 속도는 어떤 수에 다가갈까요? 그 값들은 양수일까요 음수일까요?','t = 1초에서 오른쪽 구간과 왼쪽 구간의 표를 각각 끝까지 채우고, 두 표가 같은 수에 다가가는지, 다가가는 방향이 어떻게 다른지 적어 보세요.'],
 approach:['한 점에 양쪽에서 다가가며 함숫값 비교하기','함수 하나를 고르고 한 점까지의 거리 d를 10분의 1씩 줄이며, 왼쪽과 오른쪽의 함숫값과 그 점의 값을 나란히 봅니다.','sin x ÷ x는 x = 0에서 0 ÷ 0이라 값을 정할 수 없습니다. x를 0에 양쪽에서 가까이 가져가면 값은 0, 1, “다가가는 수 없음” 가운데 어느 쪽일까요?','세 함수에서 각각 “극한이 있는가”와 “그 점에서 값이 정의되는가”를 표로 적고, 두 질문의 답이 서로 다른 함수를 고르세요.'],
 secant:['둘째 점을 끌어와 할선을 접선으로 만들기','접점의 시각 a와 간격 Δt를 고르면 두 점을 잇는 할선의 기울기를 계산합니다. Δt를 줄이거나 재생 단추를 누르면 할선이 접선에 다가갑니다.','처음에는 t = 3초, Δt = 1초이고 할선의 기울기는 −15 m/s입니다. Δt를 0.01초까지 줄이면 기울기는 −20과 −10 가운데 어느 쪽으로 움직일까요?','a를 0, 1, 2, 3초로 바꾸며 Δt = 0.01일 때의 기울기를 적고, 접선을 켜서 나온 h′(a)와의 차이가 네 번 모두 같은 이유를 식 20 − 10a − 5Δt로 설명해 보세요.'],
 zoom:['한 점을 확대해 곡선이 직선에 가까워지는지 보기','한 점을 가운데 두고 그래프를 2배씩 여덟 번까지 확대하며, 곡선과 접선의 차이가 창 높이의 몇 %인지 잽니다.','f(x) = |x|의 꺾인 점 x = 0을 256배까지 확대하면 꺾인 자리가 펴져 직선처럼 보일까요?','로켓 높이와 x³ − 3x에서 차이가 창 높이의 1% 아래로 내려가는 확대 횟수를 각각 찾고, 두 함수에서 그 횟수가 다른 이유를 짐작해 적어 보세요.'],
 trace:['접선의 기울기를 점마다 찍어 도함수 그래프 그리기','위 그래프의 점을 왼쪽에서 오른쪽으로 옮기면 그 점의 접선 기울기를 아래 그래프에 찍어 이어 갑니다.','함수를 sin x로 바꾸면, 위 그래프가 가장 높은 자리에서 아래 그래프(기울기)의 값은 얼마일까요? 아래 그래프가 가장 높은 자리는 위 그래프의 어디일까요?','x³ − 3x에서 아래 그래프가 가로축을 지나는 x 두 곳을 찾고, 그 x에서 위 그래프가 어떤 모양인지 적어 보세요.'],
 cube:['정육면체의 한 변을 늘려 덧붙는 조각으로 3x² 확인하기','한 변이 x인 정육면체의 한 변을 dx만큼 늘리면 덧붙는 판 세 개, 막대 세 개, 모서리 조각 하나를 3D로 보여 주고 부피를 표로 계산합니다. 그림은 끌거나 방향키로 돌릴 수 있습니다.','처음 놓인 x = 2, dx = 1에서는 주황 판 세 개가 늘어난 부피의 63.2%입니다. dx를 0.5로 줄이면 이 비율은 올라갈까요 내려갈까요? 몇 %쯤일지도 적어 보세요.','dx를 1, 0.5, 0.1, 0.05로 줄이며 “늘어난 양 ÷ dx”를 적고, 이 값이 다가가는 수를 3x²에 x = 2를 넣은 값과 비교하세요. 도형을 정사각형으로 바꿔 2x도 같은 방법으로 확인하세요.'],
 poly:['계수를 바꾸며 다항식과 도함수 그래프 비교하기','삼차 이하 다항식의 계수 네 개를 정하면 거듭제곱·상수배·합의 규칙으로 도함수를 구해 두 그래프를 함께 그리고, 한 점의 기울기를 차분으로 검산합니다.','상수항을 0에서 10으로 올리면 f의 그래프는 위로 10만큼 올라갑니다. 이때 파란 점선인 f′의 그래프는 어떻게 될까요?','x³의 계수를 1, x²의 계수를 0, x의 계수를 −3으로 놓아 f(x) = x³ − 3x를 만들고, f′(x) = 0인 x 두 개를 기울기 읽는 점을 옮겨 찾아보세요.'],
 rect:['직사각형의 넓이가 늘어나는 빠르기로 곱의 규칙 확인하기','가로 u와 세로 v가 저마다의 속도로 늘어날 때 Δt초 동안 덧붙는 띠 두 개와 모서리 조각의 넓이를 계산합니다.','처음 놓인 값(u = 3, v = 2, u′ = 1, v′ = 2)에서 Δt = 1초일 때 넓이의 평균 변화율은 10 cm²/초입니다. Δt를 0.01초로 줄이면 이 값은 2, 5, 8 가운데 어느 수에 다가갈까요?','u′를 0으로 놓았을 때와 v′를 0으로 놓았을 때 남는 띠가 각각 어느 것인지 보고, 곱의 규칙의 두 항이 그림의 어느 조각인지 적어 보세요.'],
 balloon:['부푸는 풍선의 부피 변화율을 겉넓이 × 반지름 속도로 계산하기','반지름이 일정한 속도로 늘어나는 풍선을 3D로 보여 주고, dV/dr과 dr/dt를 곱한 값을 실제로 늘어난 껍질의 부피와 비교합니다.','반지름이 늘어나는 속도는 0.5 cm/초로 그대로 둡니다. 바람을 넣은 시간이 1초일 때와 4초일 때, 부피가 늘어나는 빠르기 dV/dt는 같을까요? 다르다면 몇 배쯤일까요?','t = 2초에서 껍질을 볼 시간 Δt를 1, 0.5, 0.1초로 줄이며 “실제로 늘어난 부피”와 “겉넓이 × 두께”의 차이(%)를 적어 보세요.'],
 machines:['함수 두 개를 이어 안쪽·바깥 변화율의 곱을 차분 검산값과 견주기','안쪽 함수와 바깥 함수를 고르고 입력 x를 정하면 각 기계의 변화율과 그 곱을 계산하고, 차분으로 검산한 값과 견줍니다.','안쪽을 u = x², 바깥을 y = sin u로 바꾸고 x = 1.5를 넣습니다. cos 1.5는 양수(약 0.07)입니다. 그러면 sin(x²)은 x = 1.5에서 증가하는 중일까요, 감소하는 중일까요?','안쪽 u = 3x + 1, 바깥 y = u²으로 놓고 x = 0.5에서 3, 5, 15가 각각 화면의 어느 값인지 찾아 적어 보세요.'],
 expbase:['밑을 바꾸며 지수함수의 기울기 ÷ 함숫값 재기','밑 a와 점 x를 정하면 aˣ의 값과 기울기를 계산하고 둘의 비를 보여 줍니다.','밑이 2일 때 기울기 ÷ 함숫값은 0.693입니다. 밑을 4로 바꾸면 이 비는 0.693의 몇 배가 될까요?','비가 1.000이 되는 밑을 소수 셋째 자리까지 찾고, 그때 두 곡선이 어떻게 보이는지 적어 보세요.'],
 circle:['원 위를 도는 점의 높이가 변하는 빠르기 보기','단위원 위의 점을 각도 θ로 옮기면 점이 움직이는 방향의 화살표를 그리고, 화살표의 세로 성분이 sin 그래프의 접선 기울기와 같은지 견줍니다.','점이 원 위를 일정한 빠르기로 돕니다. 높이 sin θ가 가장 빠르게 줄어드는 각도는 90°, 180°, 270° 가운데 어디일까요?','θ = 90°와 270°에서 접선의 기울기를 읽고, sin θ의 값과 cos θ의 값이 각각 얼마인지 적어 보세요.'],
 signs:['도함수와 이계도함수의 부호로 그래프의 모양 읽기','점을 옮기면 그 점의 f′과 f″의 부호를 읽어 증가·감소와 휘는 방향을 알려 주고, f′ = 0인 점마다 극대·극소·극값 아님을 판정합니다.','함수를 sin x(0부터 2π까지)로 바꿉니다. f′ = 0인 점은 몇 개이고 각각 극대일까요 극소일까요? 그래프가 휘는 방향이 바뀌는 x는 어디일까요?','x³ − 3x와 x³에서 f′ = 0인 점마다 f″의 부호를 적고, f″의 부호와 극대·극소·극값 아님이 어떻게 짝지어지는지 정리하세요.'],
 box:['귀퉁이를 잘라 접은 상자의 부피가 가장 큰 길이 찾기','종이 네 귀퉁이에서 한 변이 x인 정사각형을 잘라 내고 날개를 접어 올린 상자를 3D로 보여 주고, 부피 그래프와 그 점의 접선을 함께 그립니다.','30 cm × 30 cm 종이에서 자르는 길이를 2 cm에서 8 cm로 늘리면 상자는 깊어지고 바닥은 좁아집니다. 부피는 2 cm일 때보다 클까요 작을까요? 그때 부피 그래프의 접선은 오르막일까요 내리막일까요?','접선이 수평이 되는 x를 30 × 30 종이와 30 × 20 종이에서 각각 찾고, 그때 부피를 적어 보세요.'],
 approx:['접선으로 어림한 값과 실제 값의 차이 재기','기준점에서 그은 접선으로 가까운 점의 함숫값을 어림하고 실제 값과의 차이를 잽니다.','√x를 x = 25에서 그은 접선으로 어림합니다. 기준점에서 오른쪽으로 8만큼 간 x = 33과 왼쪽으로 8만큼 간 x = 17 가운데 어느 쪽의 오차가 더 클까요, 아니면 같을까요?','eˣ를 x = 0에서 어림할 때 오차가 실제 값의 1% 아래인 x의 범위를 찾아보세요.'],
 newton:['접선이 가로축과 만나는 점을 되풀이해 구해 방정식의 해 찾기','시작점에서 접선을 긋고 접선이 가로축과 만나는 곳을 다음 점으로 삼는 일을 걸음 수만큼 되풀이합니다.','로켓이 12 m를 지나는 시각을 찾습니다. 시작점을 2.5초로 놓으면 첫걸음에서 x는 가까운 해 3.26초보다 작은 쪽에 놓일까요, 큰 쪽으로 넘어갈까요?','방정식을 x³ − 2x + 2 = 0으로 바꾸고 시작점 0에서 걸음을 6까지 늘려 표의 x가 어떻게 되는지 적으세요. 시작점을 −2로 옮기면 어떻게 달라지나요?'],
 can:['330 mL 캔의 반지름을 바꾸며 재료 넓이가 가장 작은 모양 찾기','부피 330 mL를 지키는 원기둥 캔을 3D로 보여 주고, 반지름에 따른 비용 넓이 그래프와 그 점의 접선을 그립니다.','뚜껑과 바닥의 재료 값이 옆면의 2배(k = 2)가 되면, 비용이 가장 적은 캔은 k = 1일 때보다 길쭉해질까요 납작해질까요? 그때 높이는 지름의 몇 배쯤일까요?','k = 1, 2, 3에서 접선이 수평이 되는 반지름을 찾아 “높이 ÷ 지름”을 적고, k와 어떤 관계인지 한 문장으로 쓰세요. 끝으로 본문의 결정문 네 칸을 채워 보세요.']
};
const ROCKET='실제 계산 · 로켓 모형 h(t) = 20t − 5t²',SCALE='실제 계산 · 3D 그림의 길이는 축척대로';
const KIND={interval:ROCKET,shrink:ROCKET,secant:ROCKET,cube:SCALE,balloon:SCALE,box:SCALE,can:SCALE,approach:'실제 계산 · 주차 요금표는 이 책이 정한 가상 값'};
function sourceLinks(ids){return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML=`<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">${BOOK} 처음으로</a>`+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${num(i)}</span>${c.title}</a>`).join('');}
/* 장마다 "먼저 개념 잡기" 맨 앞에 두는 쉬운 설명(js/easy.js). 새 블록이 아니라 같은 블록 안의 첫 칸이다. */
function easy(c){const e=(window.DVEasy||{})[c.id];if(!e)return '';return `<div class="easy-first"><h3>쉬운 말로 먼저</h3>${e.easy.map(p=>`<p>${p}</p>`).join('')}<h4>이 장에서 처음 나오는 말</h4><dl>${e.words.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl></div>`;}
const VOLUMES=[['1권','미분','이 책',''],['2권','편미분과 연쇄 법칙','준비 중',''],['3권','적분','준비 중','']];
function series(){return `<section class="section"><div class="section-heading"><h2>${MT.series.name} 시리즈 ${MT.series.total}권 가운데 ${MT.series.no}권</h2><p>변수가 하나인 함수의 미분을 먼저 익히면, 변수가 여럿인 함수의 편미분과 변화율을 다시 쌓는 적분으로 이어 갈 수 있습니다.</p></div><div class="dv-series">${VOLUMES.map(([n,t,s,url])=>`<div class="${s==='이 책'?'on':''}"><b>${n}</b>${url?`<a href="${url}">${t}</a>`:`<span>${t}</span>`}<small>${s}</small></div>`).join('')}</div></section>`;}
function home(){
 document.body.classList.remove('reading');document.title=FULL;
 const labs=B.chapters.flatMap(c=>c.labs).length,idOf=id=>B.chapters.findIndex(c=>c.id===id);
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">${MT.eyebrow}</div><h1>${MT.hero[0]}<br><em>${MT.hero[1]}</em></h1><p class="lead">${MT.lead}</p><div class="hero-links"><a class="button primary" href="#average">1장부터 읽기</a><a class="button" href="#${MT.feature[0]}">${MT.feature[1]}</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span><b>${MT.stat[0]}</b>${MT.stat[1]}</span></div><p class="caption">${MT.flow.map(x=>x.split('|')[0]).join(' → ')}<br>모든 계산은 브라우저 안에서 하며 외부 서버를 부르지 않습니다.</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>${MT.flowTitle}</h2><p>${MT.flowLead}</p></div>${flow(MT.flow)}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 값을 바꿔 보고, 식과 그림으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${num(i)} / ${c.group}</span>${U.thumbnail(c,i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개 · 예제 ${c.examples.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 필요한 장만 골라 읽으세요.</p></div><div class="path-grid">${MT.paths.map(p=>`<div class="path"><h3>${p.title}</h3><p>${p.desc}</p>${p.chapters.map(id=>`<a href="#${id}">${num(idOf(id))}</a>`).join('')}</div>`).join('')}</div></section>
 ${series()}
 <section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">${MT.sourcesLead}</p><div class="note">${MT.note}</div>${sourceLinks(B.sources.map((_,i)=>i))}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary">${MT.glossary.map(([a,b])=>`<p><b>${a}</b> ${b}</p>`).join('')}</div></section>`;
 cleanup=DVHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${String(index+1).padStart(2,'0')}</span><h3>${title}</h3><small class="lab-kind">${KIND[id]||'실제 계산 · 식에 수를 넣어 브라우저에서 계산'}</small></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}</div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=window.DVFigures?DVFigures.render(c.id):null,caption=art?art.caption:c.subtitle;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
/* 예제: 풀이를 한 줄씩 펼친다. 셋째 값이 true이면 첫 줄도 가려 두고 독자가 먼저 풀게 한다. */
function examples(c){
 return `<div class="dv-examples"><h3>${c.id==='final'?'실험을 해 본 뒤 펼쳐 볼 풀이':'식을 따라 풀어 보기'}</h3><p class="caption">풀이는 한 줄씩 펼쳐집니다. 다음 줄을 먼저 머릿속으로 계산한 뒤 단추를 눌러 맞춰 보세요.</p>${c.examples.map(([title,steps,hide])=>`<article class="dv-example" data-shown="${hide?0:1}"><h4>${title}</h4><ol class="dv-steps">${steps.map((s,i)=>`<li${i>=(hide?0:1)?' hidden':''}>${s}</li>`).join('')}</ol><div class="buttons"><button type="button" data-step>다음 줄 보기</button><button type="button" data-all>풀이 모두 보기</button><span class="caption" role="status" aria-live="polite">${hide?0:1} / ${steps.length}줄</span></div></article>`).join('')}</div>`;
}
function stepExample(e){
 const b=e.target.closest('[data-step],[data-all]');if(!b)return;
 const box=b.closest('.dv-example'),items=[...box.querySelectorAll('li')],shown=b.hasAttribute('data-all')?items.length:Math.min(items.length,Number(box.dataset.shown)+1);
 box.dataset.shown=shown;items.forEach((li,i)=>{li.hidden=i>=shown;});
 box.querySelector('[role=status]').textContent=`${shown} / ${items.length}줄`;
 if(shown===items.length)box.querySelectorAll('button').forEach(x=>{x.disabled=true;});
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 고르게 오게 한다. data-* 값은 원래 번호다. */
function choices(q,target,attr){return DVMath.quizOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
const AFTER=`<a href="${MT.next[0]}">다른 책 · ${MT.next[1]}<small>이동 이유: ${MT.next[2]}</small></a>`;
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${num(index)}. ${c.title} · ${BOOK}`;
 const previous=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${B.chapters[index+1].desc}</small></a>`:AFTER;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${num(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험 · 예제 ${c.examples.length}개</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>${index?'앞 장 떠올리기':'이 책의 공통 사례'}</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${easy(c)}${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${examples(c)}${(c.details||[]).map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${body}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source)}${cross(c)}</section><nav class="chapter-nav" aria-label="이전·다음 장">${previous}${next}</nav></div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);DVLabs[id](el);if(window.DVGuides)DVGuides.mount(id,el);});
 main.querySelector('.dv-examples').addEventListener('click',stepExample);
 const retry='다시 생각해 보세요. 본문과 실험을 한 번 더 보고 다른 보기를 골라 보세요.';
 main.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const ok=+b.dataset.answer===c.quiz[2];main.querySelector('.quiz-feedback').textContent=ok?`정답입니다. ${c.quiz[3]}`:retry;});
 main.querySelectorAll('[data-transfer]').forEach(b=>b.onclick=()=>{const ok=+b.dataset.transfer===c.transfer[2];main.querySelector('.transfer-feedback').textContent=ok?`정답입니다. ${c.transfer[3]}`:retry;});
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
