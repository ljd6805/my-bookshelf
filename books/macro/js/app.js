(()=>{
'use strict';
const U=MUI,B=MBook,main=document.querySelector('main'),BOOK_TITLE='거시경제 · GDP·물가·고용 지표를 계산하고 발표 뒤 금리·환율·물가의 경로를 가설로 세우기';let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측 질문(L2)은 본문이 계산하지 않은 새 사례이며, 조작 전에 읽도록 실험 위에 둔다.
   L2 문장은 docs/index.html #chapters 표의 L2 칸에서 괄호 속 답을 뺀 질문과 같아야 하고(tests/routes.test.cjs), 답은 MMath 계산과 같다(tests/guides.test.cjs). */
const info={
 'gdp-expenditure':['지출 네 갈래로 GDP와 순수출을 계산하고 실질 성장률·연율 구하기','소비·투자·정부 지출·수출·수입을 넣으면 GDP와 갈래별 비중이 막대와 표에 나오고, 명목 성장률과 디플레이터 상승률로 실질 성장률을, 전기 대비 분기 성장률로 연율을 계산합니다. 확인 칸을 켜면 실제 2분기 숫자가 “이례적 값” 상자로 나옵니다.','가상의 다른 경제가 소비 300, 투자 120, 정부 지출 90, 수출 250, 수입 260(조 원)입니다. GDP와 순수출은 얼마일까요? 다음 해 명목 GDP가 8%, 디플레이터가 5% 오르면 실질 성장률은 몇 %일까요?','수입을 400조 원으로 올려 순수출과 GDP가 어떻게 되는지 보고, 디플레이터를 명목 성장률과 같은 6%로 바꿔 실질 성장률이 0%가 되는 것을 확인해 보세요. 분기 성장률을 바꿔 연율과 “네 번 더한 값”의 차이가 언제 커지는지도 적어 보세요.'],
 'cpi-basket':['품목 가중치와 가격으로 물가지수와 상승률을 계산하고 지수 수준과 상승률 구별하기','쌀·전기 요금·외식의 가중치와 두 해의 가격을 넣으면 물가지수와 상승률, 품목마다 지수 상승에 보탠 몫(%p)이 막대와 표에 나옵니다. 아래 칸에서는 지금 지수에 다음 1년의 상승률을 얹어 상승률이 내려도 지수가 오르는지 봅니다.','가상 장바구니가 두 품목뿐입니다. 가중치 40% 품목의 값이 10% 오르고 60% 품목의 값은 그대로라면 지수(기준 100)와 상승률은 얼마일까요?','외식 가격을 9,000원 그대로 두어 지수가 얼마나 내려가는지 보고, 가중치 합을 99%로 바꿔 어떤 안내가 나오는지 확인해 보세요. 다음 1년의 상승률을 1%와 0%로 바꿔 지수가 어떻게 되는지도 적어 보세요.'],
 'labor-gap':['실업률·참가율·고용률을 계산하고 GDP 갭의 수준과 방향으로 국면 나누기','15세 이상 인구·취업자·실업자와 구직을 포기한 사람 수를 넣으면 세 비율이 막대와 표에 나오고, 구직 포기 전후를 나란히 견줍니다. 분기를 고르면 가상 GDP 갭 곡선에서 그 분기의 수준과 방향, 국면이 나옵니다.','가상 마을의 경제활동인구가 1,000명(취업 950, 실업 50)입니다. 실업자 가운데 20명이 구직을 포기해 경제활동인구에서 빠지면 실업률은 몇 %에서 몇 %가 될까요?','구직을 포기한 사람을 5명씩 늘리며 실업률과 고용률이 각각 어떻게 되는지 적고, 분기를 7과 8로 옮겨 갭이 잠재 GDP 위에 있어도 수축 국면일 수 있는 까닭을 설명해 보세요.'],
 'policy-model':['정책 시나리오 모형에 정책 금리 변경을 넣어 환율·GDP·물가가 가장 크게 반응하는 분기 찾기','정책 금리 변경(기본값 0)과 유지 분기 수를 고르면 미리 정한 시나리오 모형이 12분기 동안 시장 금리·환율·GDP·물가의 기준선 대비 편차를 계산해 꺾은선 두 장과 분기 표에 보여 주고, 반응이 가장 큰 분기와 그 순서를 문장으로 적습니다. 인상·인하 비교 예제는 예측을 적은 뒤에 열립니다.','같은 모형에서 정책 금리를 0.25%p 올리는 대신 0.5%p 내려 4분기 둔다면 GDP 줄과 물가 줄은 어느 쪽으로, 가장 크게 몇 분기째에 움직일까요?','유지 분기 수만 1분기와 8분기로 바꿔 GDP가 가장 크게 반응하는 분기가 어떻게 달라지는지 적고, 크기를 바꿔도 순서(환율 → GDP → 물가)가 그대로인지 확인해 보세요.'],
 'fiscal-mix':['정부 지출 변경을 모형에 넣고, 금리 정책과 함께 넣은 결과가 따로 넣은 결과의 합인지 확인하기','정부 지출 변경(GDP 대비 %)과 기간, 정책 금리 변경과 기간을 고르면 모형이 네 줄을 계산합니다. 금리 변경이 0이 아니면 분기마다 지출만·금리만 넣은 GDP와 둘의 합, 함께 넣은 값을 표에 나란히 놓고 ✓로 견줍니다.','정부 지출을 GDP 대비 +2%로 두 배 키우는 대신 기간을 2분기로 줄이면, 모형에서 GDP의 가장 큰 편차는 몇 분기째이고 얼마일까요?','지출을 4분기에서 8분기로 늘려 GDP 편차가 승수 0.8에 얼마나 다가가는지 보고, 정책 금리를 +0.5%p로 함께 넣어 GDP가 기준선 아래로 내려가는 분기가 언제인지 적어 보세요.'],
 'fx-won-amount':['환율 변화를 수출·수입 대금의 원화 금액으로 계산하고 두 기준의 변화율 견주기','새벽전자의 수출 대금과 온결식품의 수입 대금(달러), 이전·이후 원/달러 환율을 넣으면 두 회사의 원화 금액과 차이가 막대와 표에 나오고, 같은 변화를 1달러당 원화와 원화 1원의 달러 가치로 나눠 계산합니다. 모형 손잡이로 정책 금리가 환율 줄을 움직이는 방향도 봅니다.','온결식품이 밀가루 대금 50만 달러를 내야 합니다. 원/달러가 1,300원에서 1,365원이 되면 원화로 내는 돈은 얼마에서 얼마로, 몇 % 늘까요?','이후 환율을 이전보다 높게 바꿔 두 회사의 차이가 반대로 바뀌는 것을 확인하고, 이전과 이후를 맞바꿔 두 변화율이 어떻게 되는지 적어 보세요.'],
 'current-account':['네 수지를 더해 경상수지를 계산하고 저축 − 투자가 순수출과 같은지 확인하기','상품·서비스·본원소득·이전소득 수지를 넣으면 경상수지와 상품수지를 뺀 세 수지의 합이 막대와 문장에 나오고, 아래 칸의 가상 경제로 국민저축 − 투자와 순수출을 견줍니다. 확인 칸을 켜면 8월 실제 경상수지와 2분기 저축률이 “이례적 값” 상자로 나옵니다.','가상의 나라가 한 달에 상품수지 +30, 서비스수지 −8, 본원소득수지 +5, 이전소득수지 −2(억 달러)입니다. 경상수지는 얼마일까요?','상품수지는 그대로 두고 서비스수지만 바꿔 경상수지가 적자가 되는 값을 찾고, 아래 가상 경제의 숫자를 아무렇게나 바꿔도 S − I와 순수출이 같은지 확인해 보세요.'],
 'lag-correlation':['동행지수를 늦춰 가며 시차 상관계수를 계산하고 가장 큰 r의 시차 찾기','선행·동행 변화(쉼표로 나눈 숫자)와 늦출 달 수를 고르면 시차 0~4달의 상관계수와 쌍의 수가 막대와 표에 나오고, 고른 시차로 짝지은 두 줄을 그립니다. 아래 표는 2026년 10월 발표 달력입니다.','가상의 선행 변화가 1, 2, 3, 2, 1, 0, −1, −2이고 동행 변화가 0, 0, 0.8, 1.6, 2.4, 1.6, 0.8, 0입니다. 동행을 몇 달 늦출 때 r이 가장 클까요?','늦출 달 수를 0에서 4까지 옮기며 쌍의 수가 어떻게 줄어드는지 적고, 동행 목록의 숫자 하나를 크게 바꿔 r이 얼마나 흔들리는지 확인해 보세요.'],
 'crisis-timeline':['세 위기의 사건 순서를 보고 환율 변화율·원화 가치·연율 성장률 계산하기','위기를 고르면 사건과 정책 대응이 일어난 차례대로 나오고, 세 위기의 환율·기준금리·성장률을 한 표에서 견줍니다. 이전·이후 환율로 1달러당 원화와 원화 1원의 달러 가치 변화를, 분기 성장률로 연율을 계산합니다.','가상의 나라에서 산출이 네 분기 연속 전기 대비 3.0%씩 줄었습니다. 이 속도를 연율로 바꾸면 몇 %일까요?','세 위기를 차례로 골라 먼저 움직인 지표와 정책 수단을 적고, 환율 칸에 같은 사건을 다룬 두 숫자를 넣어 기준 시점이 다르면 변화율이 얼마나 달라지는지 확인해 보세요.'],
 'release-hypotheses':['발표와 예상의 차이를 계산하고 두 가설의 8분기 물가 경로를 모형에서 견주기','발표된 물가 상승률과 예상을 넣으면 차이를 계산하고, 가설(A 수입 물가 충격 한 번, B 물가 압력 네 분기)과 정책 금리·통화량 변경을 고르면 모형이 8분기 물가·GDP 경로를 그립니다. 시장 가격은 계산하지 않고 방향의 가설과 버릴 관찰을 표로 적으며, 내 가설표는 이 브라우저에만 남습니다.','가설 B에서 정책 금리를 0.25%p가 아니라 0.5%p 올려(다음 분기부터 4분기) 두면, 모형에서 4분기째와 8분기째 물가 편차는 얼마일까요?','가설을 A와 B로 번갈아 고르며 같은 +0.25%p가 두 경로를 어떻게 바꾸는지 적고, 시간 범위 셋마다 가설·틀렸다고 볼 관찰·확인할 지표와 발표일을 가설표에 한 줄씩 채워 보세요.']
};
const GUESS={'gdp-expenditure':'예: ○○○조 원, −○○조 원, ○.○○%','cpi-basket':'예: ○○○.○, ○.○%','labor-gap':'예: ○.○○% → ○.○○%','policy-model':'예: GDP는 ○분기째 ○쪽, 물가는 ○분기째','fiscal-mix':'예: ○분기째 +○.○○%','fx-won-amount':'예: ○억 ○,○○○만 원 → ○억 ○,○○○만 원, ○%','current-account':'예: +○○억 달러','lag-correlation':'예: ○달','crisis-timeline':'예: −○○.○%','release-hypotheses':'예: 4분기 +○.○○%p, 8분기 +○.○○%p'};
const pad=i=>String(i+1).padStart(2,'0');
/* 다음 장으로 가는 이유: 이 장을 마친 뒤 남는 질문. */
const NEXT_WHY={
 gdp:'디플레이터로 가격이 오른 몫을 걷어 냈지만, 내가 사는 물건의 장바구니로 가격을 재면 어떻게 되는지는 아직 보지 않았습니다. 소비자물가지수를 계산합니다.',
 prices:'물가를 재는 법을 알았으니, 일자리를 재는 실업률·고용률과 경기가 지금 어느 국면인지 나누는 법으로 넘어갑니다.',
 cycle:'물가가 목표보다 높고 경기가 확장 국면이라면 중앙은행은 무엇을 할까요? 기준금리를 정하는 근거와 파급 경로를 모형으로 읽습니다.',
 policy:'금리는 돈을 빌리는 값을 바꿔 수요를 움직입니다. 정부가 지출로 수요를 직접 바꾸면 어떻게 되는지, 금리와 함께 쓰면 결과가 합이 되는지 계산합니다.',
 fiscal:'4장과 5장의 모형에서 금리를 올리면 환율 줄이 내려갔습니다. 환율이 왜, 어느 쪽으로 움직이고 원화 금액은 얼마나 바뀌는지 계산합니다.',
 fx:'수출입 대금을 원화로 바꿔 보았으니, 서비스와 배당·이자까지 더한 나라 밖과의 거래 결과인 경상수지를 계산합니다.',
 trade:'지표마다 발표일을 장부에 적었습니다. 무엇이 먼저 움직이는지 시차 상관으로 재고, 먼저 움직인 것이 원인이라고 말해도 되는지 따집니다.',
 leading:'무엇이 먼저 움직이는지 재는 법을 알았으니, 실제로 큰 충격이 왔던 세 시기에 지표가 어떤 순서로 움직였는지 표로 견줍니다.',
 crisis:'지표 계산, 모형, 발표 달력, 위기의 순서를 갖췄습니다. 물가 발표 하나가 예상과 다르게 나온 날 무엇을 가설로 세우고 무엇으로 확인할지 마지막 과제에서 적습니다.'
};
/* 출처가 비어 있으면 조사 노트로 안내한다. */
function sourceLinks(ids){if(!ids.length)return '<p class="caption">이 장의 출처와 확인일은 <a href="docs/research.html">조사 노트</a>에 모아 두었습니다.</p>';return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">거시경제에서 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}</a>`).join('');}
const PATHS=[
 ['경제의 상태를 숫자로 재려면','GDP를 지출 네 갈래로 나눠 계산하고, 소비자물가지수와 실업률·고용률을 계산한 뒤 GDP 갭으로 경기 국면을 나눕니다.',['gdp','prices','cycle']],
 ['정책이 수요를 바꾸는 과정을 보려면','기준금리를 정하는 근거와 파급 경로를 읽고, 정책 시나리오 모형에 금리와 정부 지출을 넣어 반응의 순서와 합을 확인합니다.',['policy','fiscal','fx']],
 ['발표 뒤의 경로를 가설로 세우려면','시차 상관과 발표 달력, 세 위기의 순서를 본 뒤, 예상과 다르게 나온 물가 발표로 가설표를 채웁니다.',['leading','crisis','final']]
];
function paths(){return `<div class="path-grid">${PATHS.map(([t,d,ids])=>`<div class="path"><h3>${t}</h3><p>${d}</p>${ids.map(id=>{const i=B.chapters.findIndex(c=>c.id===id);return `<a href="#${id}" aria-label="${pad(i)}장 ${U.esc(B.chapters[i].title)}">${pad(i)}</a>`;}).join('')}</div>`).join('')}</div>`;}
const SERIES='이 책은 시리즈 「금융과 투자 처음부터」의 2권입니다. 본문에 나오는 n권은 같은 시리즈의 다른 권이며, 이 책은 1권 「돈의 시간 가치」에서 출발하고 3권 「금리와 채권」으로 이어집니다. 위험을 나누는 9권(준비 중)과 투자자의 마음을 다루는 10권(준비 중)은 아직 없어 링크를 걸지 않습니다.';
const GLOSSARY=[['GDP · 최종 생산','국내총생산. 한 나라 안에서 한 기간에 생산된 최종 재화·서비스의 값이며, 중간재는 두 번 세지 않는다.'],['C + I + G + (X − M)','소비·투자·정부 지출·순수출. 소비와 투자 안의 외국 생산 몫을 빼려고 수입을 뺀다.'],['명목 · 실질 · 디플레이터','명목은 값이 늘어난 비율, 디플레이터는 가격이 오른 비율, 실질은 (1 + 명목) ÷ (1 + 디플레이터) − 1.'],['전기 대비 · 전년 동기 대비 · 연율','바로 앞 분기와, 1년 전 같은 분기와 견준 값. 연율은 (1 + 분기 성장률)⁴ − 1로 바꾼 환산.'],['소비자물가지수(CPI)','정해 둔 장바구니의 가격을 가계가 쓰는 비중으로 가중해 기준연도를 100으로 놓은 지수.'],['근원물가','값이 크게 출렁이는 품목(식료품·에너지, 농산물·석유류)을 뺀 지수로 잰 상승률.'],['%p (퍼센트포인트)','두 백분율의 차이. 3.4%와 3.0%의 차이는 0.4%p다.'],['경제활동인구','취업자와 일자리를 찾는 실업자의 합. 구직을 그만둔 사람은 비경제활동인구로 센다.'],['실업률 · 고용률','실업자 ÷ 경제활동인구와 취업자 ÷ 15세 이상 인구. 분모가 다르다.'],['잠재 GDP · GDP 갭','물가를 크게 끌어올리지 않고 낼 수 있는 생산 수준과, 실제 GDP가 그보다 위나 아래에 있는 정도.'],['확장 · 정점 · 수축 · 저점','GDP 갭이 오르는 동안, 오르다 꺾인 꼭대기, 내리는 동안, 내리다 꺾인 바닥.'],['기준금리 · 금융통화위원회','한국은행이 정하는 정책 금리와 그것을 정하는 위원회(총재·부총재를 포함한 7명, 연 8회).'],['파급 경로','기준금리의 변화가 금리·자산가격·환율·신용·기대 다섯 경로로 퍼지는 것.'],['3년 국채 금리','정부가 3년 뒤 갚기로 하고 빌린 돈에 붙는 시장 금리. 정책 금리에 대한 기대가 바뀌면 함께 움직인다.'],['정책 시나리오 모형','이 책이 계수를 미리 정한 선형 모형. 예측이 아니며 시차는 식에 넣은 가정이다.'],['재정 승수','지출 1이 GDP를 얼마나 늘리는지. 이 책 모형의 0.8은 가정이다.'],['중첩','선형 모형에서 함께 넣은 결과가 따로 넣은 결과의 합인 성질.'],['원/달러 환율','1달러를 사는 데 드는 원화. 숫자가 오르면 원화 약세, 내리면 원화 강세.'],['원화 1원의 달러 가치 변화','이전 ÷ 이후 − 1. 1달러당 원화의 변화(이후 ÷ 이전 − 1)와 비율이 다르다.'],['경상수지','상품·서비스·본원소득·이전소득 수지의 합.'],['저축 − 투자 = 순수출','국민저축 S = Y − C − G로 놓으면 GDP 항등식에서 S − I = X − M이 나온다.'],['순환변동치','장기 추세를 100으로 놓고 지금이 추세보다 얼마나 위나 아래인지 보이는 숫자로 이 책은 읽는다.'],['시차 상관','한 지표를 k달 늦춰 다른 지표와 짝지은 상관계수. 쌍의 수는 길이 − k.'],['상관과 인과','상관이 높아도 공통 원인이 둘을 함께 움직일 수 있어 원인은 따로 확인한다.'],['통화스와프','두 중앙은행이 자기 통화를 맡기고 상대 통화를 빌려 오기로 한 약속.'],['예상과의 차이','발표 − 예상. 예상까지는 이미 가격에 들어 있었을 수 있다.'],['반증 관찰','가설이 틀렸다고 볼 관찰. 가설표에서 가설과 짝으로 적는다.']];
function sourcesSection(){
 return `<section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">GDP·물가·실업률의 정의, 통화정책의 시차와 환율 방향, 재정정책의 효과처럼 바깥에서 가져온 사실은 조사 노트에 확인일과 등급(대학 교재, 공식 원문 재게시, 중앙은행 직원 기고, 보도, 학술 요약, 확인 못함)과 함께 적었습니다. 시점에 민감한 숫자는 2026-10-13 확인 기준이고 발표일을 함께 적었습니다. ${U.RATE_FACT} ${U.RATE_NOTE}</p><div class="note"><b>이 책은 학습용이며 투자 권유가 아닙니다.</b><br>하린, 가상의 회사 새벽전자와 온결식품, 이름 없는 모형 경제와 그 숫자, 마지막 과제의 발표(물가 3.4%, 예상 3.0%)는 이 책을 위해 지어낸 것입니다. 금리·환율·주가의 움직임을 예측하지 않고, 장마다 경로 가설과 확인할 지표·발표일만 적습니다. 실험은 js/math.js의 식대로 브라우저에서 실제로 계산하고, 결과 끝의 꼬리표로 무엇 위에서 계산했는지 밝힙니다. “미리 정한 가상 시나리오”는 모형 경제·장바구니·가상 동네·가상의 나라처럼 지어낸 숫자, “미리 정한 시나리오 모형”은 계수를 가정으로 정한 정책 시나리오 모형(${U.M.MODEL.label}), “공식 원문(재게시)”과 “보도 기준”은 실제 통계의 출처 등급, “교재 정의”는 대학 교재로 확인한 식, “확인 못함”은 출처로 확인하지 못한 것, “시각적 비유”는 숫자 없이 위치만 보이는 그림입니다. 평소 범위를 크게 벗어난 실제 값(2분기 명목 GDP·디플레이터·총저축률, 8월 경상수지 등)은 계산에 넣지 않고 “이례적 값” 상자에만 둡니다. 그림의 색은 돕는 표시일 뿐이며, 같은 내용을 글자와 기호(▲ 고른 칸·강조, ✓ 맞음, ✗ 어긋남·오류, ● ■ ▲ ◆ 선의 점 모양)로도 적었습니다. 출처와 단순화한 부분은 <a href="docs/research.html">조사 노트</a>에 있습니다.<br>${SERIES}</div>${B.sources.length?sourceLinks(B.sources.map((_,i)=>i)):''}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary">${GLOSSARY.map(([t,d])=>`<p><b>${t}</b> ${d}</p>`).join('')}</div></section>`;
}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">OUTPUT, PRICES, JOBS, POLICY</div><h1>거시경제<br><em>GDP·물가·고용 지표를 계산하고 발표 뒤 금리·환율·물가의 경로를 가설로 세우기</em></h1><p class="lead">2026년 10월 둘째 주, 하린은 몇 주 동안 본 경제 뉴스를 장부에 옮겨 적습니다. 같은 2분기를 두고 기사마다 다른 성장률이 세 개 나왔고, 9월 물가는 2.9%, 8월 실업률은 2.0%였으며, 10월 22일에는 기준금리 결정이 있습니다. 이 책은 GDP·물가·고용 지표를 직접 계산하고, 미리 정한 정책 시나리오 모형으로 금리와 정부 지출이 환율·GDP·물가를 움직이는 순서를 읽으며, 환율 변화를 원화 금액으로 계산하고 경상수지를 나눕니다. 마지막에는 물가가 예상보다 높게 발표된 날의 경로를 가설로 세우고, 그 가설을 확인할 지표와 발표일을 고릅니다.</p><p class="caption rate-note">시점에 민감한 숫자는 ${U.M.CHECKED} 확인 기준입니다. ${U.RATE_FACT} ${U.RATE_NOTE}</p><div class="hero-links"><a class="button primary" href="#gdp">01장부터 읽기</a><a class="button" href="#policy">정책 시나리오 모형</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span>투자 권유 없음</span></div><p class="caption">지표 계산 → 정책 모형 → 나라 밖과의 거래 → 지표로 가설 세우기<br>모든 계산은 브라우저 안에서 하며, 인물과 회사, 모형 경제의 숫자는 모두 가상입니다.</p><p class="caption series-note">${SERIES}</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>지표를 계산하고, 정책이 반응하는 순서를 모형에서 읽고, 발표 뒤의 경로를 가설로 세웁니다</h2><p>1~3장에서 GDP·물가·고용을 계산하고, 4~5장에서 정책 시나리오 모형으로 금리와 지출의 효과를 읽으며, 6~7장에서 환율과 경상수지를 계산합니다. 8~9장에서 시차 상관과 위기의 순서를 본 뒤 마지막 과제에서 가설표를 채웁니다.</p></div>${flow(['경제의 상태를 숫자로 재기|GDP · 물가 · 고용과 국면 (1~3장)','정책이 수요를 바꾸는 과정|기준금리 · 정부 지출 · 모형 (4~5장)','나라 밖과의 거래|환율과 원화 금액 · 경상수지 (6~7장)','지표로 가설 세우기|시차 상관 · 위기 · 마지막 과제 (8~10장)'])}</section>
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
/* 본문 표: 칸이 다섯 개 이상이면 좁은 화면에서 행마다 카드로 묶도록 칸 이름을 붙인다(첫 칸은 행 이름이라 그대로 보인다). */
function detailTable(title,body){
 if(!body.includes('<table'))return body;
 const head=[...body.matchAll(/<th scope="col">(.*?)<\/th>/g)].map(m=>m[1].replace(/<[^>]+>/g,'')),cards=head.length>=5;
 const html=body.replace(/<tbody>([\s\S]*?)<\/tbody>/,(m,rows)=>'<tbody>'+rows.replace(/<tr>([\s\S]*?)<\/tr>/g,(r,cells)=>{let k=0;return '<tr>'+cells.replace(/<(td|th)([^>]*)>/g,(c,tag,attr)=>`<${tag}${attr} data-label="${U.esc(head[k++]||'')}">`)+'</tr>';})+'</tbody>');
 return html.replace(/<table>/,`<div class="table-wrap${cards?' cards':' fit'}" tabindex="0" role="region" aria-label="${U.esc(title)}"><table>`).replace(/<\/table>/,'</table></div>');
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. data-* 값은 원래 번호다. */
function choices(q,target,attr){return U.choiceOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function navLinks(index){
 const prev=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${NEXT_WHY[B.chapters[index].id]}</small></a>`:'<a href="../bonds/#transmit">다른 책 · 금리와 채권 02 · 기준금리가 시장금리에 반영되는 과정<small>이동 이유: 이 책은 기준금리를 정하는 근거와 모형의 순서를 다뤘고, 그 결정이 콜·CD·COFIX·예금·대출 금리에 어떤 순서로 반영되는지는 계산하지 않았습니다. 시리즈 3권의 이 장이 그 계산을 이어서 맡고, 마지막 과제에서 세운 금리 경로 가설을 실제 시장 금리의 움직임과 견줄 수 있습니다.</small></a>';
 return `<nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${pad(index)}. ${c.title} · 거시경제`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>${index?'앞 장 떠올리기':'먼저 떠올리기'}</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${detailTable(title,body)}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source||[])}${cross(c)}</section>${navLinks(index)}</div>`;
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
