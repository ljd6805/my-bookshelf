(()=>{
'use strict';
const U=EUI,B=EBook,main=document.querySelector('main'),BOOK_TITLE='지수와 ETF · 기초지수·NAV·괴리율로 ETF 비교하기';let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측 질문(L2)은 본문이 계산하지 않은 새 사례이며, 조작 전에 읽도록 실험 위에 둔다.
   L2 문장은 docs/index.html #chapters 표의 L2 칸에서 괄호 속 답을 뺀 질문과 같아야 하고(tests/routes.test.cjs), 답은 EMath 계산과 같다(tests/guides.test.cjs). */
const info={
 'index-level':['세 종목의 시가총액으로 지수 계산하기','세 종목의 주가 변화와 상장주식수를 바꾸면 종목별 시가총액, 합, 기준 시가총액, 지수가 막대와 표에 나옵니다. B사를 C사로 바꾸는 상자를 켜면 기준 시가총액을 고칠 때와 고치지 않을 때의 지수를 견줍니다.','같은 세 종목 지수(기준일 100)에서 새벽전자는 그대로이고 A사가 6% 오르고 B사가 20% 내리면 지수는 얼마일까요?','새벽전자와 B사를 같은 비율로 올려 지수가 각각 얼마나 움직이는지 견주고, 주가가 가장 높은 A사보다 시가총액이 큰 새벽전자가 지수를 더 움직이는 까닭을 표의 숫자로 적어 보세요. 교체 상자를 켠 채 “기준 시가총액 고치기”를 끄면 지수가 어떻게 되는지도 확인해 보세요.'],
 weighting:['가중 방식별 지수 수익률 비교','세 종목의 하루 수익률과 유동비율을 바꾸면 시가총액·유동시가총액·동일 가중의 비중, 비중 × 수익률 내역, 세 지수의 수익률이 나옵니다. “하루가 지난 뒤의 비중 보기”를 켜면 방식마다 다음에 할 일이 표에 나옵니다.','새벽전자 −8%, A사 +4%, B사 +2%인 하루라면 시가총액 가중, 유동시가총액 가중(유동비율 50%·80%·100%), 동일 가중 지수의 수익률은 각각 얼마일까요?','새벽전자의 유동비율을 50%에서 100%로 올려 유동시가총액 가중 수익률이 시가총액 가중 쪽으로 다가가는 것을 확인하고, 하루 뒤 비중 표에서 다시 맞춰야 하는 방식이 어느 것인지 적어 보세요.'],
 'creation-unit':['설정·환매에 따른 좌수·순자산·NAV 계산','설정·환매 CU 수, 처음 순자산과 좌수, CU 크기를 바꾸면 좌수·순자산·1좌당 NAV의 전후가 표에 나오고, 그림에서 운용사와 AP 사이의 설정·환매와 투자자 사이의 거래소 매매를 나눠 봅니다.','순자산 1,500억 원, 500만 좌인 ETF에 AP가 설정단위 10만 좌를 네 번 설정하면 좌수·순자산·1좌당 NAV는 각각 얼마가 될까요(지수는 그대로)?','CU 수를 −5에서 +5까지 옮기며 NAV 칸이 한 번이라도 바뀌는지 확인하고, “거래소에서 10주 사기”를 켰을 때 표의 어느 칸이 바뀌는지 적어 보세요. 처음 좌수를 줄여 환매할 수 없게 되는 자리도 찾아보세요.'],
 'gap-lab':['지수·iNAV·시장가 괴리율 실험','1단계에서 지수와 시장가로 괴리율을 계산하고, 2단계에서 장중 시각·LP 호가·시장가 매수 수량·기초자산을 바꿔 장중 iNAV와 시장가, LP 호가 띠와 면제 시간을 그림으로, 주문이 먹은 호가를 표로 봅니다. 3단계에서는 그 가격을 본 AP가 설정과 환매 가운데 무엇을 할 수 있는지와 비용 전 차익을 계산합니다.','누리 해외100의 그날 NAV가 12,000원이고 종가가 12,270원이라면 괴리율은 얼마이고, 보도된 공시 기준을 넘을까요?','LP 호가를 켠 채 시각을 10:30에서 15:25로 옮기며 매수 1,000주의 체결가와 괴리율이 바뀌는 자리를 찾고, 그때 3단계의 AP 화살표가 어떻게 바뀌는지 적어 보세요. 1단계 시장가를 iNAV보다 낮게 넣고 3단계를 “1단계 시장가”로 바꾸면 AP가 무엇을 하는지도 확인해 보세요.'],
 'tracking-cost':['추적 괴리·추적 오차와 총비용 계산','1단계에서 닷새 수익률 기록을 골라 하루 차이 막대, 추적 괴리, 추적 오차를 계산하고, 2단계에서 총보수·기타비용·매매중개수수료와 원금·햇수·비용 전 수익률을 바꿔 TER·총비용과 가람200과의 n년 뒤 금액 차이를 봅니다.','2,000만 원을 20년 두고 비용 전 수익률을 연 5%로 놓으면, 총비용이 0.22%인 누리200과 0.13%인 가람200의 20년 뒤 금액 차이는 얼마일까요?','기록 ①과 ②를 번갈아 골라 추적 괴리와 추적 오차 가운데 어느 쪽이 0에 가까운지 적고, 2단계에서 햇수를 10년에서 30년으로 늘리며 두 금액의 차이가 햇수에 비례하는지 확인해 보세요.'],
 rebalance:['레버리지·인버스 ETF의 하루 재조정 매매 금액 계산','순자산, 배수(2배·인버스), 하루 지수 수익률을 바꾸면 아침 노출 → 하루 뒤 노출 → 새 순자산 → 목표 노출과 장 마감 뒤 재조정 매매 금액이 막대와 표에 나옵니다. 하루 한 번의 재조정만 계산합니다.','순자산 100억 원인 인버스(−1배) ETF가 지수 +5%인 날 장 마감 뒤 −1배를 다시 맞추려면 무엇을 얼마만큼 해야 할까요?','지수 수익률을 +10%와 −10%로 옮기며 2배와 인버스가 각각 사는 쪽인지 파는 쪽인지 표의 재조정 매매 칸으로 확인하고, 두 상품 모두 오른 날 뒤에 사는 쪽으로 움직이는 까닭을 식 배수 × (배수 − 1)로 설명해 보세요.'],
 underlying:['기초자산별 iNAV와 복제 방식별 위험 비교','1단계에서 기초자산과 시각, 지수·금리·금 가격·환율·해외 선물 변화를 바꾸면 네 ETF의 iNAV(또는 NAV 변화)와 기초자산 시장이 열렸는지가 표에 나옵니다. 2단계에서 복제 방식을 고르면 위험 항목이 있음·없음으로 나옵니다.','누리 해외100의 전날 NAV가 12,000원이고, 밤사이 원/달러 환율이 0.5% 내리고 해외100 지수 선물이 0.8% 올랐다면 한국 장중의 추정 iNAV는 얼마일까요(원 미만 반올림)?','시각을 10:30에서 23:30으로 바꾸며 표의 “기초자산 시장”과 “iNAV의 성격” 칸이 어떻게 바뀌는지 적고, 금리 변화를 −1%p와 +1%p로 옮겨 누리 국채3년의 NAV 변화가 대칭인지 확인해 보세요.'],
 'etf-tax-type':['기초자산·상장 시장으로 ETF 과세 유형 가리기','담은 기초자산, 상장된 거래소, 국내 주식 비중을 바꾸면 갈림길 그림에 지나온 길이 ▲로 표시되고, 과세 유형과 매매차익 세율, 팔 때 거래세가 나옵니다. 세금 금액은 계산하지 않습니다.','가람200, 누리 국채3년, 금 현물 ETF, 누리 해외100, 먼바다500 가운데 매매차익이 15.4% 배당소득세로 과세되는 것은 몇 개일까요?','기초자산을 해외 주식으로 두고 상장된 거래소만 국내와 해외로 바꿔 유형이 갈리는 것을 확인하고, 국내 주식 비중을 60% 바로 아래와 60%로 옮겨 국내주식형으로 바뀌는 자리를 찾아보세요.'],
 'compare-table':['목적별로 두 ETF의 보유 비용과 거래 비용 비교하기','투자 금액, 보유 햇수, 왕복 횟수와 그 기간, 비용 전 수익률을 바꾸면 누리200과 가람200의 n년 뒤 금액과 거래 비용, 두 차이 가운데 더 큰 항목, 순서가 뒤집히는 왕복 수가 나옵니다. 아래에는 다섯 항목 비교표가 있습니다.','목적을 바꿔 450만 원으로 한 달에 서른 번 사고파는 격자 매매를 한다면, 누리200과 가람200의 한 달 스프레드 비용은 각각 얼마일까요(30,000원에 150주, 왕복마다 스프레드 한 칸 몫을 낸다고 가정)?','보유 기간 전체의 왕복 횟수를 1번에서 늘려 거래 비용 차가 보유 비용 차를 넘는 자리를 찾고, 그 자리가 투자 금액을 바꿔도 같은지 확인해 보세요. 결론은 “이 목적에서는 이 항목의 차이가 크다”는 조건이 붙은 문장으로 적습니다.'],
 'final-gap':['마지막 과제: 15:25 괴리율 +3%의 시점별 손익과 확인 순서','매수 금액, ETF, 15:25 예상 체결가와 iNAV, 다음 거래일 지수 변화를 바꾸면 (가) 지금 (나) 다음 거래일 (다) 1년 보유 세 시점의 금액과 손익, 공시 기준과 LP 종가 관리 기준과의 비교가 나옵니다. 확인 순서표의 칸을 채우면 몇 칸을 확인했는지가 표에 남습니다.','같은 날 15:25, 누리 해외100의 예상 체결가가 12,300원이고 iNAV가 12,000원입니다. 괴리율은 얼마이고, 500만 원으로 그 가격에 산 뒤 다음 거래일에 iNAV가 그대로인 채 가격이 NAV로 돌아오면 손익은 얼마일까요?','ETF·예상 체결가·다음 거래일 지수 변화 가운데 하나만 바꿔 결론이 달라지는 조건을 셋 이상 숫자와 함께 적고(14시 접속매매처럼 시각에 따른 조건은 4장 괴리율 실험에서 시각을 옮겨 확인), 규칙의 확인일(2026-10-13)도 함께 적어 보세요. 적을 것은 매수 여부가 아니라 확인한 순서와 결론이 바뀌는 조건입니다.']
};
const GUESS={'index-level':'예: ○○.○○',weighting:'예: −○.○○% / −○.○○% / −○.○○%','creation-unit':'예: ○○○만 좌, ○,○○○억 원, ○○,○○○원','gap-lab':'예: +○.○○%, 기준을 넘는다 / 넘지 않는다','tracking-cost':'예: ○○○,○○○원',
 rebalance:'예: ○○억 원어치를 사거나 판다',underlying:'예: ○○,○○○원','etf-tax-type':'예: ○개','compare-table':'예: ○○,○○○원 / ○○○,○○○원','final-gap':'예: +○.○○%, ○○○주, −○○○,○○○원'};
const pad=i=>String(i+1).padStart(2,'0');
/* 다음 장으로 가는 이유: 이 장을 마친 뒤 남는 질문. */
const NEXT_WHY={
 index:'유동주식으로 가중하면 같은 하루의 지수 수익률이 어떻게 달라지는지는 아직 계산하지 않았습니다. 비중을 정하는 방식 셋을 같은 하루의 숫자로 견줍니다.',
 weight:'지수를 비중대로 담은 상품은 누가 만들고, 하린은 그 상품을 누구에게서 사는지 아직 모릅니다. 설정·환매와 거래소 매매를 구분합니다.',
 creation:'NAV는 설정·환매로 바뀌지 않았는데, 앱에 찍히는 시장가는 NAV와 다를 수 있습니다. 그 차이인 괴리율과 LP 호가를 계산합니다.',
 nav:'괴리율이 날마다 0이어도 ETF가 지수를 그대로 따라갔는지는 따로 재야 합니다. 추적 괴리·추적 오차와 총비용을 계산합니다.',
 cost:'하루 수익률의 2배를 약속한 ETF는 비용 말고 무엇 때문에 지수의 2배와 다른 결과를 내는지 남았습니다. 장 마감 뒤 재조정 매매 금액을 계산합니다.',
 leverage:'지금까지 본 ETF는 모두 주식이나 주가지수에 묶여 있었습니다. 채권·금·해외 지수를 담은 ETF의 iNAV와 복제 방식의 위험을 봅니다.',
 assets:'담은 자산과 상장 시장이 ETF마다 달랐습니다. 그 차이가 매매차익의 과세 유형도 가르는지 확인합니다.',
 tax:'비교표의 다섯 칸이 모두 찼습니다. 목적을 정해 비용이 가장 크게 갈리는 항목을 계산합니다.',
 choose:'비교표의 평균 괴리율로는 어느 날 15:25에 본 +3% 괴리를 설명할 수 없습니다. 마지막 과제에서 시점별 손익과 확인 순서를 적습니다.'
};
/* 출처가 비어 있으면 조사 노트로 안내한다. */
function sourceLinks(ids){if(!ids.length)return '<p class="caption">이 장의 출처와 확인일은 <a href="docs/research.html">조사 노트</a>에 모아 두었습니다.</p>';return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">지수와 ETF에서 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}</a>`).join('');}
const PATHS=[
 ['ETF가 따라가는 지수부터 알고 싶다면','지수의 계산과 가중 방식, ETF 좌수를 만드는 설정·환매를 차례로 계산합니다.',['index','weight','creation']],
 ['화면의 가격과 괴리율을 읽고 싶다면','괴리율과 LP 호가, 추적 괴리와 비용, 해외 기초자산의 추정 iNAV를 계산하고 마지막 과제로 이어 갑니다.',['nav','cost','assets','final']],
 ['ETF 여러 개를 같은 표에 놓고 견주려면','레버리지 구조와 과세 유형을 가린 뒤 목적별 비교표로 비용이 갈리는 항목을 계산합니다.',['leverage','tax','choose']]
];
function paths(){return `<div class="path-grid">${PATHS.map(([t,d,ids])=>`<div class="path"><h3>${t}</h3><p>${d}</p>${ids.map(id=>{const i=B.chapters.findIndex(c=>c.id===id);return `<a href="#${id}" aria-label="${pad(i)}장 ${U.esc(B.chapters[i].title)}">${pad(i)}</a>`;}).join('')}</div>`).join('')}</div>`;}
const SERIES='이 책은 시리즈 「금융과 투자 처음부터」의 7권입니다. 본문에 나오는 n권은 같은 시리즈의 다른 권이며, 지금은 1권 「돈의 시간 가치」, 3권 「금리와 채권」, 4권 「주문 한 장이 체결되기까지」, 8권 「가격은 어떻게 흔들리는가」, 11권 「세금과 계좌」, 12권 「격자 하나에서 손익이 갈리기까지」가 공개되어 있습니다.';
const GLOSSARY=[['지수','구성 종목의 오늘 시가총액 합을 기준시점의 합으로 나눠 100을 곱한 값(시가총액 방식). 주가의 평균이 아니다.'],['시가총액','주가 × 상장주식수. 시장이 매긴 회사 전체의 값.'],['유동주식 · 유동비율','상장주식 가운데 시장에서 사고팔린다고 보는 주식과 그 비율. 코스피200은 유동주식수로 가중한다.'],['비중','한 종목의 시가총액(또는 유동시가총액)을 전체 합으로 나눈 몫. 다 더하면 1.'],['리밸런싱','가격이 움직여 달라진 비중을 정해진 때 다시 맞추는 일.'],['ETF','지수를 따라가도록 만든 펀드를 거래소에서 주식처럼 사고팔게 한 상품(상장지수펀드).'],['AP (지정참가회사)','운용사와 설정·환매를 직접 하는 증권사.'],['CU (설정단위)','AP가 설정·환매하는 좌수의 묶음. 이 책은 10만 좌로 놓았다(가정).'],['NAV (순자산가치)','펀드의 순자산을 좌수로 나눈 1좌의 몫. 하루 한 번 계산된다.'],['iNAV (장중 추정 순자산가치)','장중에 담은 자산의 지금 가격으로 추정한 NAV.'],['괴리율','(시장가 − NAV) ÷ NAV × 100. 플러스는 프리미엄(웃돈), 마이너스는 디스카운트(할인).'],['LP (유동성공급자)','매수·매도 양쪽에 호가를 내야 하는 증권사. 장 시작 직후와 장 마감 단일가 시간에는 호가 의무가 면제된다고 안내된다(보도 기준).'],['장 마감 단일가','15:20~15:30에 주문을 모았다가 15:30에 가격 하나로 체결하는 방식. 그사이 화면의 가격은 예상 체결가다.'],['추적 괴리','일정 기간 ETF 수익률 − 지수 수익률.'],['추적 오차','하루 수익률 차이의 표준편차 σ × √250. 흔들림을 잰다.'],['총보수 · TER · 총비용','총보수 + 기타비용 = 합성총보수(TER), TER + 매매중개수수료 = 총비용(보도 기준 정의).'],['스프레드','가장 낮은 매도 호가와 가장 높은 매수 호가의 차이. 왕복마다 한 칸 몫을 낸다고 놓는다.'],['노출','지수가 1% 움직일 때 그 금액의 1%만큼 손익이 생기는 금액. 2배 상품은 순자산의 2배.'],['재조정','레버리지·인버스 ETF가 장 마감 뒤 노출을 새 순자산의 배수로 다시 맞추는 매매.'],['합성 ETF · ETN','합성 ETF는 스왑으로 수익률을 받아 거래상대방 위험이 있고, ETN은 증권사가 자기 신용으로 발행해 발행사 신용위험과 만기가 있다.'],['과세 유형','국내주식형(매매차익 비과세), 그 밖의 국내 상장(15.4% 배당소득), 해외 상장(22% 양도소득). 2026-10-13 보도 기준.']];
function sourcesSection(){
 return `<section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">코스피·코스피200의 계산 규칙, ETF 호가단위와 가격제한폭, 괴리율 공시 기준, LP 의무, 비용의 정의, 과세 유형처럼 바깥에서 가져온 사실은 조사 노트에 확인일과 등급(공식 원문·보도·안내·백과사전)과 함께 적었습니다. 호가단위·가격제한폭·매매수량단위는 한국거래소 규정포털 원문으로 확인했고, 괴리율 기준·LP 의무·과세 유형은 2026-10-13 보도·안내로만 확인했습니다.</p><div class="note"><b>${U.RULE_NOTE}</b><br>하린, 가상의 회사 새벽전자·A사·B사·C사, 가상 지수 누리200 지수, 가상의 ETF 누리200·가람200·누리200 2배·누리 해외100·누리 국채3년·먼바다500, 가상의 채권 나라 3년은 이 책을 위해 지어낸 것입니다. 이 책은 학습용이며 투자 권유가 아닙니다. 어느 ETF가 독자에게 맞는다고 말하지 않고, 결과 문장은 “이 가정에서는 숫자가 어떻게 되는가”만 말합니다. 모든 실험은 js/math.js의 식대로 브라우저에서 실제로 계산하고, 결과 끝의 꼬리표로 무엇 위에서 계산했는지 밝힙니다. “한국거래소 규정포털 원문”은 공식 원문으로 확인한 규칙, “규칙은 2026-10-13 보도·안내 기준”은 보도와 안내로만 확인한 규칙, “미리 정한 가상 시나리오”는 장중 지수 경로·다른 투자자의 호가·비용 전 수익률처럼 이 책이 정한 값, “확인 못함 · 이 책의 단순화”는 해외 iNAV 추정식·CU 크기처럼 출처로 확인하지 못해 이 책이 단순화한 것입니다. 그림의 색은 돕는 표시일 뿐이며, 같은 내용을 글자와 기호(▲ 고른 칸, ✓ 체결·확인, ✗ 오류, 실선·점선 이름표, ⏱ 바뀔 수 있어 확인일을 붙인 규칙·수치)와 “프리미엄·디스카운트”, “LP 호가 의무 있음·면제” 같은 낱말로도 적었습니다. 출처와 단순화한 부분은 <a href="docs/research.html">조사 노트</a>에 있습니다.<br>${SERIES}</div>${B.sources.length?sourceLinks(B.sources.map((_,i)=>i)):''}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary">${GLOSSARY.map(([t,d])=>`<p><b>${t}</b> ${d}</p>`).join('')}</div></section>`;
}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">INDEX, ETF, NAV, PREMIUM</div><h1>지수와 ETF<br><em>기초지수·NAV·괴리율로 ETF 비교하기</em></h1><p class="lead">하린의 앱에는 누리200 ETF와 가람200 ETF가 둘 다 “누리200 지수를 따라간다”고 적혀 있습니다. 그런데 가격도 보수도 다르고, 어느 날 15:25에는 시장가가 NAV보다 3% 높게 찍힙니다. 이 책은 세 종목으로 지수를 직접 계산하는 데서 시작해, 가중 방식, 설정·환매로 늘고 주는 ETF 좌수, NAV와 iNAV로 구하는 괴리율과 LP 호가, 추적 괴리와 총비용, 레버리지 ETF의 재조정 매매, 기초자산과 복제 방식, 과세 유형을 차례로 계산합니다. 마지막에는 15:25에 본 +3% 괴리를 시점별 손익으로 나누고 확인할 순서를 적습니다.</p><p class="caption rate-note">${U.RULE_NOTE}</p><div class="hero-links"><a class="button primary" href="#index">01장부터 읽기</a><a class="button" href="#nav">괴리율 실험</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span>투자 권유 없음</span></div><p class="caption">지수 계산 → ETF의 구조와 가격 → ETF 비교 → 마지막 과제<br>모든 계산은 브라우저 안에서 하며, 회사·지수·상품·인물은 모두 가상입니다.</p><p class="caption series-note">${SERIES}</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>지수·NAV·괴리율·비용·과세 유형을 장마다 하나씩 계산합니다</h2><p>1~2장에서 지수를 계산하고, 3~6장에서 ETF의 좌수·NAV·괴리율·비용·재조정을 계산하며, 7~9장에서 기초자산·과세 유형·목적별 비용으로 ETF를 견줍니다. 마지막 과제에서는 15:25 괴리율 +3%를 세 시점의 손익으로 나눕니다.</p></div>${flow(['지수 계산|세 종목 지수 · 가중 방식 (1~2장)','ETF의 구조와 가격|설정·환매 · 괴리율 · 비용 · 재조정 (3~6장)','ETF 비교|기초자산 · 과세 유형 · 목적별 비교표 (7~9장)','마지막 과제|15:25 괴리율 +3%의 손익과 확인 순서 (10장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 바꾸어 보고, 숫자와 그림으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${pad(i)} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 질문 중심으로 돌아보세요.</p></div>${paths()}</section>
 ${sourcesSection()}`;
 cleanup=EHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${pad(index)}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}<label class="my-guess" for="guess-${id}"><span>내 예측 적어 두기</span><input id="guess-${id}" type="text" autocomplete="off" placeholder="${GUESS[id]||'짐작한 답을 짧게'}"></label></div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross||!c.cross.length)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=window.EFigures?.render(c.id),caption=art?art.caption:`${c.subtitle}`;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. data-* 값은 원래 번호다. */
function choices(q,target,attr){return U.choiceOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function navLinks(index){
 const prev=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${NEXT_WHY[B.chapters[index].id]}</small></a>`:'<a href="../volatility/#measure">다른 책 · 가격은 어떻게 흔들리는가 · 흔들림을 재는 세 가지 계산: 표준편차·연율화·ATR<small>이동 이유: 이 책은 ETF의 가격이 정해지는 구조까지 계산했습니다. 시리즈 8권의 이 장은 같은 상품의 가격이 하루에 얼마나 흔들리는지를 표준편차와 연율화로 재므로, 5장에서 추적 오차에 쓴 σ × √250을 가격 자체의 흔들림에 다시 써 볼 수 있습니다.</small></a>';
 return `<nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${pad(index)}. ${c.title} · 지수와 ETF`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>${index?'앞 장 떠올리기':'먼저 떠올리기'}</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${body.includes('<table')?body.replace(/<table>/,'<div class="table-wrap" tabindex="0" role="region" aria-label="'+U.esc(title)+' · 좁은 화면에서는 옆으로 밀어 볼 수 있습니다"><table>').replace(/<\/table>/,'</table></div>'):body}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source||[])}${cross(c)}</section>${navLinks(index)}</div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);ELabs[id](el);EGuides.mount(id,el);});
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
