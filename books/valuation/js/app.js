(()=>{
'use strict';
const U=VUI,B=VBook,main=document.querySelector('main'),BOOK_TITLE='기업 가치 평가 · 배수 비교와 현금흐름 할인으로 주당 가치의 범위 계산하기';let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측 질문(L2)은 본문이 계산하지 않은 새 사례이며, 조작 전에 읽도록 실험 위에 둔다.
   L2 문장은 docs/index.html #chapters 표의 L2 칸에서 괄호 속 답을 뺀 질문과 같아야 하고(tests/routes.test.cjs), 답은 VMath 계산과 같다(tests/guides.test.cjs). */
const info={
 'price-basics':['주가·주식 수·순이익·자본으로 시가총액·EPS·BPS 계산하고 액면분할 해 보기','주가, 주식 수, 한 해 순이익, 기말 자본을 넣으면 시가총액·EPS·BPS가 계산되고, 액면분할로 1주를 여러 주로 나누면 한 주의 숫자와 회사 전체의 숫자가 각각 어떻게 되는지 막대와 표에 나옵니다.','가상의 회사가 주가 15,000원, 주식 400만 주, 한 해 순이익 48억 원, 기말 자본 360억 원입니다. 시가총액, EPS, BPS는 각각 얼마일까요?','액면분할을 “1주를 2주로”와 “1주를 10주로”로 바꿔 시가총액이 그대로인 것을 확인하고, 주가만 30,000원으로 올리면 시가총액과 EPS 가운데 무엇이 바뀌는지 적어 보세요.'],
 'multiple-compare':['PER·ROE로 PBR 계산하고 비교 회사 가·나·다·라와 새벽전자 견주기','새벽전자의 사업연도, PER의 이익(후행·선행), ROE를 계산하는 자본의 시점을 고르면 PER·PBR·ROE와 PBR = ROE × PER 검산이 가상의 비교 회사 넷과 함께 표와 점 그림(가로 ROE, 세로 PBR)에 나오고, 중앙값으로 매긴 주당 가치가 계산됩니다. 직접 넣는 회사의 PER·ROE로 PBR도 계산합니다.','가상의 회사가 PER 10배, ROE 15%(PER과 같은 해 이익, 같은 시점 자본)입니다. PBR은 얼마일까요? 이 회사의 ROE가 10%로 내려가도 PBR이 그대로라면 PER은 몇 배일까요?','“ROE를 같은 해 이익·같은 시점 자본으로 계산” 칸을 끄고 켜며 검산이 ✓에서 ✗로 바뀌는 까닭을 적고, PER이 가장 낮은 회사와 가장 높은 회사의 ROE·성장률을 표에서 읽어 PER 차이를 설명해 보세요.'],
 'dividend-yield':['주당 배당·주가·EPS·배당 성장률로 배당수익률·배당성향·요구수익률 계산하기','주가, 주당 배당, EPS, 배당 성장률, ROE를 넣으면 배당수익률·배당성향과 고든 모형을 거꾸로 푼 요구수익률 r = D₁ ÷ P + g, 지속 가능 성장률이 막대와 문장에 나옵니다. 배당 성장률이 지속 가능 성장률 이상이면 ▲ 안내 문장이 나옵니다.','가상의 회사가 주가 50,000원, 주당 배당 1,500원, EPS 5,000원이고, 배당이 해마다 4%씩 영원히 자란다고 가정합니다. 배당수익률, 배당성향, 주가에 담긴 요구수익률은 각각 얼마일까요?','주가만 18,000원으로 내려 배당수익률이 어떻게 되는지 보고, 배당 성장률을 1%p씩 바꿔 요구수익률이 얼마나 움직이는지 적어 보세요. 배당 성장률을 15%로 올리면 어떤 안내가 나오는지도 확인해 보세요.'],
 'ev-bridge':['시가총액·차입금·현금으로 EV를, 영업이익·감가상각으로 EBITDA를 계산해 EV/EBITDA 견주기','결산일을 고르거나 시가총액·차입금·현금·EBITDA를 넣으면 순차입금, EV, EV/EBITDA가 계단 막대와 문장에 나오고, 매길 때 쓰는 배수로 기업가치를 계산해 순차입금을 뺀 주당 가치와 배수 세 가지의 범위를 보여 줍니다.','시가총액 1,000억 원, EBITDA 150억 원으로 같은 가상의 두 회사가 있습니다. 한 회사는 차입금도 현금도 없고, 다른 회사는 차입금 500억 원, 현금 50억 원입니다. 두 회사의 EV/EBITDA는 각각 몇 배일까요?','결산일을 2024년 말과 2025년 말로 바꿔 주가가 같아도 EV가 달라지는 까닭을 순차입금으로 설명하고, 현금만 100억 원 늘리면 EV/EBITDA와 주당 가치가 각각 어떻게 되는지 적어 보세요.'],
 'fcff-forecast':['2024·2025 실적 FCFF를 계산하고 2026~2030년 FCFF를 예측해 현재가치 더하기','매출 성장률·영업이익률·운전자본 비율·유형자산 비율을 넣으면 2026~2030년 매출부터 FCFF·할인계수·현재가치까지 한 표에 계산되고(할인율 8.3% 고정), 실적 FCFF 두 해와 함께 막대로 나옵니다. 아래 칸에서는 영업이익·감가상각·설비투자·운전자본 증가로 한 해 FCFF를 직접 계산합니다.','가상의 회사가 한 해 영업이익 100억 원, 법인세율 20%, 감가상각 30억 원, 설비투자 50억 원, 운전자본 증가 10억 원입니다. FCFF는 얼마이고, 이 돈을 1년 뒤에 받는다면 할인율 8%로 오늘의 값은 얼마일까요?','운전자본 비율을 18%와 32.2%로 바꿔 2026년 FCFF와 5년 현재가치 합이 얼마나 달라지는지 적고, 2025년 실적 FCFF가 음수인데도 예측 FCFF가 양수인 까닭을 운전자본 증가 칸으로 설명해 보세요.'],
 'wacc-build':['국고채 금리·위험 프리미엄·베타·회사채 금리·비중으로 자기자본비용과 WACC 계산하기','무위험 금리, 주식 위험 프리미엄, 베타, 세전 부채 비용, 법인세율, 주식과 부채의 시장가를 넣으면 CAPM 자기자본비용, 세후 부채 비용, WACC가 막대와 문장에 나오고, 그 할인율로 계산한 주당 가치가 나옵니다. 시장 숫자에는 확인일과 출처 등급이 붙습니다.','가상의 회사가 베타 1.3, 주식 70%·부채 30%(시장가), 세전 부채 비용 6%, 법인세율 20%입니다. 무위험 금리 4.4%, 위험 프리미엄 4.9%라면 자기자본비용과 WACC는 각각 얼마일까요?','국고채 금리 칸에 오늘의 국고채 10년 금리를 넣어 WACC와 주당 가치가 어떻게 바뀌는지 적고, 베타 막대를 0.5에서 1.5까지 옮기며 자기자본비용이 얼마씩 움직이는지 확인해 보세요.'],
 'terminal-steps':['영구성장률을 바꿔 2031년 FCFF·영구가치·주당 가치를 차례로 계산하고 g ≥ r 오류 확인하기','영구성장률과 할인율을 바꾸면 2031년 FCFF, 영구가치, 그 현재가치와 비중, 기업가치, 주주 몫, 주당 가치가 단계 목록과 막대에 차례로 나옵니다. “다음 해 FCFF를 직접 넣는 가상의 회사”를 고르면 영구가치와 현재가치만 계산합니다. 영구성장률이 할인율 이상이면 값 대신 ✗ 오류 문장이 나옵니다.','가상의 회사의 예측 마지막 해 다음 해 FCFF가 100억 원, 할인율 9%, 영구성장률 3%, 명시 예측 5년입니다. 예측 마지막 해 말의 영구가치와 그 현재가치는 얼마일까요? 영구성장률이 4%라면 영구가치는 몇 % 커질까요?','영구성장률 막대를 0%에서 8%까지 옮기며 영구가치 비중과 주당 가치가 어떻게 커지는지 적고, 8.3%로 옮겼을 때 무엇이 나오는지 확인해 보세요. 2031년 FCFF가 2030년보다 큰 까닭도 재투자 줄로 설명해 보세요.'],
 'dcf-sensitivity':['DCF 민감도 표: 두 가정을 함께 바꾼 주당 가치 표와 가정별 변화 폭 막대 만들기','표의 가로축(매출 성장률·영업이익률·영구성장률)과 세로축 할인율 간격을 고르면 5 × 5 칸의 주당 가치가 계산되고(10원 반올림, g ≥ r 칸은 글자), 가정 다섯 개를 하나씩 바꾼 폭이 큰 순서의 막대로, 1%p당 변화가 표로, 배수 범위와 DCF 범위가 주가 20,000원 선과 함께 한 축에 나옵니다. 기준안과 막대의 범위도 바꿀 수 있습니다.','기준안에서 운전자본 비율이 28%가 아니라 2025년 수준 32.2%로 남고, 동시에 영업이익률이 12%가 아니라 13%가 된다면(할인율 8.3%, 나머지 기준안) 주당 가치는 22,750원보다 오를까요 내릴까요, 얼마일까요?','막대의 범위를 바꿔(예: 영구성장률 ±1%p, 할인율 ±0.5%p) 막대 순서가 바뀌는 조합을 하나 찾아 적고, 표에서 할인율 한 칸과 가로축 한 칸 가운데 어느 쪽이 주당 가치를 더 크게 움직이는지 견주어 보세요.'],
 'implied-assumption':['주가에 담긴 성장률·할인율을 거꾸로 계산하고 비교 회사 PER에 담긴 성장률 풀기','받아들일 주가와 거꾸로 풀 가정을 고르면 나머지를 기준안으로 둔 채 DCF 주당 가치가 주가와 같아지는 값을 이분법으로 찾아 곡선 그림과 표에 보여 줍니다. 아래 칸에서는 PER·배당성향·요구수익률로 PER에 담긴 성장률을 풀어 지속 가능 성장률 b × ROE와 나란히 놓습니다.','가상의 회사가 선행 PER 25배, 배당성향 40%이고 투자자가 요구하는 수익률이 9%라고 가정합니다. 이 주가에 담긴 영구 성장률은 얼마일까요?','주가를 18,000원과 22,000원으로 바꿔 주가에 담긴 매출 성장률이 어떻게 달라지는지 적고, 거꾸로 풀 가정을 영구성장률로 바꿨을 때 그 값을 경제 성장률과 견주어 설명해 보세요.'],
 'analyst-gap':['분석가 A·B의 가정을 하나씩 바꿔 주당 가치 차이 15,966원을 가정별로 나누기','가상의 분석가 A·B의 가정과 중간 숫자가 한 표에 나오고, B에서 A로 바꿀 순서와 바꾼 가정 수(단계 단추)를 고르면 몫이 계단 막대와 가정·몫·확인 시점 표에 나옵니다. 어떤 순서든 몫의 합이 A − B와 같은지 ✓로 확인하고, 내 범위와 결론이 바뀌는 조건을 적어 둡니다.','분석가 B의 가정(성장률 3%, 영업이익률 11%, 운전자본 비율 32.2%, 영구성장률 2%)에서 할인율만 9.0%가 아니라 A와 같은 8.0%로 바꾸면 B의 주당 가치는 얼마가 될까요?','순서를 두 가지 이상 바꿔 각 가정의 몫이 어떻게 달라지는지 적고, 몫의 합이 언제나 15,966원인지 확인해 보세요. 그다음 “이 가정 범위에서 약 ○원~○원”과 결론이 바뀌는 조건 셋을 적어 두세요.']
};
const GUESS={'price-basics':'예: ○○○억 원, ○,○○○원, ○,○○○원','multiple-compare':'예: PBR ○.○배, PER ○○배','dividend-yield':'예: ○.○%, ○○%, ○.○○%','ev-bridge':'예: ○.○○배, ○.○○배','fcff-forecast':'예: ○○억 원, ○○.○억 원','wacc-build':'예: ○○.○○%, ○.○○%','terminal-steps':'예: ○,○○○.○억 원, ○,○○○.○억 원, ○○%','dcf-sensitivity':'예: 오른다, ○○,○○○원','implied-assumption':'예: ○.○%','analyst-gap':'예: ○○,○○○원'};
const pad=i=>String(i+1).padStart(2,'0');
/* 다음 장으로 가는 이유: 이 장을 마친 뒤 남는 질문. */
const NEXT_WHY={
 price:'한 주의 숫자 EPS 1,648원과 BPS 9,008원을 얻었지만, 주가를 이 둘과 견주는 숫자 하나로 줄이는 법은 아직 보지 않았습니다. PER·PBR·ROE를 계산하고 비교 회사와 견줍니다.',
 per:'배수로 비교 회사와 견주었으니, 배당을 받는 주주에게 주가 20,000원이 어떤 수익률인지 계산할 차례입니다.',
 dividend:'주주 쪽 배수만으로는 빚과 현금이 다른 회사를 같은 잣대로 견줄 수 없습니다. 채권자 몫까지 넣은 EV와 EBITDA를 계산합니다.',
 ev:'배수는 다른 회사의 값을 빌려 왔습니다. 이 회사가 앞으로 낼 현금으로 값을 직접 계산하려면 FCFF를 예측해야 합니다.',
 fcf:'5년 현재가치를 계산하며 할인율 8.3%를 미리 썼습니다. 이 숫자를 국고채 금리·위험 프리미엄·베타로 세웁니다.',
 wacc:'할인율을 세웠으니, 2030년 뒤에도 이어지는 현금흐름을 영구가치로 묶어 주당 가치까지 계산합니다.',
 terminal:'주당 22,750원을 얻었지만, 가정 하나만 바꿔도 이 숫자가 얼마나 움직이는지는 아직 재지 않았습니다. DCF 민감도 표를 만듭니다.',
 sensitivity:'가정을 바꿔 범위를 쟀으니, 거꾸로 주가 20,000원에는 어떤 가정이 담겨 있는지 풉니다.',
 implied:'주가에 담긴 가정을 풀 수 있게 되었으니, 같은 회사를 두 분석가가 두 배 다르게 매긴 까닭을 가정별로 나눌 차례입니다.'
};
/* 출처가 비어 있으면 조사 노트로 안내한다. */
function sourceLinks(ids){if(!ids.length)return '<p class="caption">이 장의 출처와 확인일은 <a href="docs/research.html">조사 노트</a>에 모아 두었습니다.</p>';return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">기업 가치 평가에서 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}</a>`).join('');}
const PATHS=[
 ['배수로 비교 회사와 견주려면','시가총액·EPS·BPS에서 출발해 PER·PBR·ROE, 배당수익률, EV/EBITDA로 가상의 비교 회사와 견주고 배수 세 가지의 범위를 얻습니다.',['price','per','dividend','ev']],
 ['현금흐름을 할인해 직접 계산하려면','FCFF를 예측하고 WACC로 할인한 뒤 영구가치를 더해 주당 가치를 구하고, DCF 민감도 표로 범위를 잽니다.',['fcf','wacc','terminal','sensitivity']],
 ['같은 회사의 두 값이 왜 다른지 알고 싶다면','DCF 민감도 표에서 가정별 변화 폭을 보고, 주가에 담긴 가정을 거꾸로 푼 뒤, 두 분석가의 차이를 가정별로 나눕니다.',['sensitivity','implied','final']]
];
function paths(){return `<div class="path-grid">${PATHS.map(([t,d,ids])=>`<div class="path"><h3>${t}</h3><p>${d}</p>${ids.map(id=>{const i=B.chapters.findIndex(c=>c.id===id);return `<a href="#${id}" aria-label="${pad(i)}장 ${U.esc(B.chapters[i].title)}">${pad(i)}</a>`;}).join('')}</div>`).join('')}</div>`;}
const SERIES='이 책은 시리즈 「금융과 투자 처음부터」의 6권입니다. 본문에 나오는 n권은 같은 시리즈의 다른 권이며, 지금은 1권 「돈의 시간 가치」, 3권 「금리와 채권」, 4권 「주문 한 장이 체결되기까지」, 5권 「재무제표 읽기」, 7권 「지수와 ETF」, 8권 「가격은 어떻게 흔들리는가」, 11권 「세금과 계좌」, 12권 「격자 하나에서 손익이 갈리기까지」가 공개되어 있습니다. 위험을 나누는 9권(준비 중)과 투자자의 마음을 다루는 10권(준비 중)은 아직 없어 링크를 걸지 않습니다.';
const GLOSSARY=[['시가총액','주가 × 주식 수. 시장에서 매겨진 회사 전체 주식의 값이다.'],['EPS · BPS','주당순이익(순이익 ÷ 주식 수)과 주당순자산(자본 ÷ 주식 수).'],['PER · 후행 · 선행','주가 ÷ EPS. 지난 한 해 이익으로 나누면 후행, 내년 이익 예상으로 나누면 선행 PER이다.'],['PBR · ROE','주가 ÷ BPS와 순이익 ÷ 자본. 같은 해 이익·같은 시점 자본이면 PBR = ROE × PER.'],['배당수익률 · 배당성향','주당 배당 ÷ 주가와 주당 배당 ÷ EPS.'],['지속 가능 성장률','(1 − 배당성향) × ROE. 남긴 이익을 같은 ROE로 다시 굴릴 때의 성장률이며 영원히 이어지는 값이 아니다.'],['고든 모형','1년 뒤 배당 ÷ (r − g). 3권 8장에서 계산했고, 이 책은 거꾸로 풀어 주가에 담긴 r을 구한다.'],['EV · 순차입금','기업가치 = 시가총액 + 차입금 − 현금. 순차입금 = 차입금 − 현금.'],['EBITDA','이자·세금·감가상각을 빼기 전 이익. 이 책은 영업이익 + 감가상각으로 계산하며 현금 그 자체가 아니다.'],['FCFF','기업 잉여현금흐름. 영업이익 × (1 − 세율) + 감가상각 − 설비투자 − 운전자본 증가.'],['운전자본','매출채권 + 재고 − 매입채무. 늘면 FCFF가 줄고 줄면 FCFF가 는다.'],['할인율 · 할인계수','미래의 돈을 오늘의 값으로 바꾸는 비율과 1 ÷ (1 + r)^t.'],['CAPM · 베타','자기자본비용 = 무위험 금리 + 베타 × 주식 위험 프리미엄. 베타는 시장과 함께 움직이는 정도이며 이 책은 1.0으로 가정한다.'],['WACC','가중평균자본비용. 자기자본비용과 세후 부채 비용을 시장가 비중으로 섞은 할인율.'],['영구가치 · 영구성장률','명시 예측이 끝난 뒤의 현금흐름을 다음 해 FCFF ÷ (r − g)로 묶은 값과 그때 쓰는 성장률 g.'],['g ≥ r','영구성장률이 할인율 이상이면 영구가치가 유한한 값이 되지 않아 이 책은 계산하지 않는다.'],['DCF 민감도 표','두 가정을 함께 바꾸고 나머지는 기준안으로 둔 주당 가치 표.'],['1%p당 변화','가정을 1%p(퍼센트포인트) 바꿀 때 주당 가치가 움직이는 폭. 두 방향이 다를 수 있다.'],['주가에 담긴 가정','주가를 받아들이고 DCF를 거꾸로 풀어, 그 주가가 맞으려면 필요한 성장률이나 할인율.'],['정당화 PER','고든 모형으로 쓴 PER. 후행 PER = 배당성향 × (1 + g) ÷ (r − g).'],['평가 시점','값을 매기는 기준 날짜. 이 책의 마지막 과제는 2025-12-31 기준 현재가치를 견준다.']];
function sourcesSection(){
 return `<section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">PER·PBR·EPS의 정의, 고든 모형과 정당화 PER, FCFF와 CAPM·WACC의 식, 국고채 금리와 한국 주식 위험 프리미엄처럼 바깥에서 가져온 사실은 조사 노트에 확인일과 등급(대학 교재·강의 원문, 감독기관 투자자 안내, 보도·2차 자료, 교수 추정치, 확인 못함)과 함께 적었습니다. 시장 숫자는 2026-10-13 확인 기준이고, 국고채 10년 금리는 2026-10-08 장 마감 값입니다. ${U.RATE_NOTE}</p><div class="note"><b>이 책은 학습용이며 투자 권유가 아닙니다.</b><br>하린, 가상의 회사 새벽전자, 가상의 비교 회사 가·나·다·라, 가상의 분석가 A·B는 이 책을 위해 지어낸 것이고, 재무 숫자와 가정은 모두 미리 정한 가상 시나리오입니다. 실제 상장회사의 값·배수·목표주가를 쓰지 않으며 어느 주식도 권하지 않습니다. 결과 문장은 판정이 아니라 “이 가정에서는 …”과 “이 가정 범위에서 약 ○원~○원”으로만 말합니다. 모든 실험은 js/math.js의 식대로 브라우저에서 실제로 계산하고, 결과 끝의 꼬리표로 무엇 위에서 계산했는지 밝힙니다. “미리 정한 가상 시나리오”는 새벽전자·비교 회사·분석가의 숫자, “이 책의 단순화”는 감가상각 = 기초 유형자산 × 10%, 연말 할인, 평가 시점 2025년 말, 주가 20,000원으로 고정한 비중처럼 이 책이 줄인 것, “보도·2차 자료”와 “교수 추정치”는 시장 숫자의 출처 등급, “확인 못함”은 출처로 확인하지 못한 것(목표주가의 기간 관행 등), “시각적 비유”는 숫자 없이 위치만 보이는 그림입니다. 그림의 색은 돕는 표시일 뿐이며, 같은 내용을 글자와 기호(▲ 고른 칸·강조, ✓ 맞음, ✗ 어긋남·오류)로도 적었습니다. 출처와 단순화한 부분은 <a href="docs/research.html">조사 노트</a>에 있습니다.<br>${SERIES}</div>${B.sources.length?sourceLinks(B.sources.map((_,i)=>i)):''}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary">${GLOSSARY.map(([t,d])=>`<p><b>${t}</b> ${d}</p>`).join('')}</div></section>`;
}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">MULTIPLES, CASH FLOW, DISCOUNT RATE</div><h1>기업 가치 평가<br><em>배수 비교와 현금흐름 할인으로 주당 가치의 범위 계산하기</em></h1><p class="lead">2026년 4월, 하린은 가상의 회사 새벽전자를 두고 가상의 분석가 A는 주당 31,833원, B는 15,867원으로 계산했다는 글을 봅니다. 같은 회사, 같은 실적에서 두 배 차이가 어떻게 나올까요? 이 책은 시가총액·EPS·BPS에서 출발해 PER·PBR·EV/EBITDA로 비교 회사와 견주고, 5권의 재무제표로 기업 잉여현금흐름(FCFF)을 예측해 할인율(WACC)로 할인한 뒤 영구가치를 더해 주당 가치를 계산합니다. 이어서 DCF 민감도 표로 가정이 바뀔 때 값이 움직이는 폭을 재고, 주가에 담긴 가정을 거꾸로 풉니다. 마지막에는 두 분석가의 차이를 가정·숫자·평가 시점으로 나눠 설명합니다.</p><p class="caption rate-note">시장 숫자는 2026-10-13 확인 기준이고 국고채 10년 금리는 2026-10-08 값입니다. ${U.RATE_NOTE}</p><div class="hero-links"><a class="button primary" href="#price">01장부터 읽기</a><a class="button" href="#sensitivity">DCF 민감도 표</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span>투자 권유 없음</span></div><p class="caption">배수로 견주기 → 현금흐름 할인 → 가정의 폭 재기 → 마지막 과제<br>모든 계산은 브라우저 안에서 하며, 회사와 인물, 재무 숫자는 모두 가상입니다.</p><p class="caption series-note">${SERIES}</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>배수로 견주고, 현금흐름을 할인해 계산하고, 가정이 바뀔 때 값이 움직이는 폭을 잽니다</h2><p>1~4장에서 배수로 비교 회사와 견주고, 5~7장에서 FCFF·할인율·영구가치로 주당 가치를 계산하며, 8~9장에서 가정의 폭과 주가에 담긴 가정을 잽니다. 마지막 과제에서는 두 분석가의 차이를 나눕니다.</p></div>${flow(['배수로 비교 회사와 견주기|시가총액·PER·PBR·배당·EV/EBITDA (1~4장)','현금흐름을 할인해 주당 가치 계산하기|FCFF · WACC · 영구가치 (5~7장)','가정이 바뀔 때 결론이 움직이는 폭 재기|DCF 민감도 표 · 주가에 담긴 가정 (8~9장)','마지막 과제|두 값의 차이를 가정·숫자·평가 시점으로 나누기 (10장)'])}</section>
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
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${NEXT_WHY[B.chapters[index].id]}</small></a>`:'<a href="../etf/#index">다른 책 · 지수와 ETF · 코스피와 코스피200 지수를 계산하는 방법<small>이동 이유: 한 회사의 값을 매겨 보았으니, 여러 회사를 한 번에 담는 지수로 넘어갑니다. 시리즈 7권의 이 장은 주가 × 상장주식수로 회사마다 시가총액을 계산하고 그 합으로 지수를 만듭니다. 이 책 1장의 시가총액 2,000억 원이 지수 안에서 어떻게 쓰이는지 이어서 볼 수 있습니다.</small></a>';
 return `<nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${pad(index)}. ${c.title} · 기업 가치 평가`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>${index?'앞 장 떠올리기':'먼저 떠올리기'}</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${detailTable(title,body)}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source||[])}${cross(c)}</section>${navLinks(index)}</div>`;
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
