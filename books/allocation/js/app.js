(()=>{
'use strict';
const U=AUI,B=ABook,main=document.querySelector('main'),BOOK_TITLE='자산배분 · 상관으로 포트폴리오 위험을 계산하고 조건에 맞는 비중 찾기';let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 제목은 독자가 계산하는 것을 말한다(K7). 예측 질문(L2)은 본문이 계산하지 않은 새 사례이며, 문장은 docs/index.html #chapters 표의 L2 칸과 같고(tests/routes.test.cjs) 답은 AMath 계산과 같다(tests/browser.cjs). ALIAS는 본문(content.js)이 그 실험을 부르는 이름이다. */
const info={
 'stock-count':['종목 수와 상관을 바꿔 같은 비중 포트폴리오의 표준편차와 바닥 계산하기','종목마다의 표준편차 σ, 모든 짝의 상관 ρ, 종목 수 N을 넣으면 N 1·2·5·10·30과 지금 N의 표준편차가 막대와 표에 나오고, 종목을 끝없이 늘려도 남는 바닥 σ√ρ가 점선으로 그려집니다.','종목마다 표준편차 20%, 모든 쌍의 상관 0.5인 종목 4개를 같은 비중으로 담으면 포트폴리오 표준편차는 몇 %일까요? 종목 수를 아무리 늘리면 몇 %에 다가갈까요?','상관을 0.3에서 0.8로 올리고 종목 수를 30으로 두어 바닥까지 남은 차이가 얼마나 줄어드는지 적어 보세요. 상관을 −0.2로 둔 채 종목 수를 늘리면 어떤 안내가 나오는지도 확인해 보세요.'],
 'covariance-matrix':['공분산 행렬로 포트폴리오 분산을 계산하고 고윳값으로 상관 표가 가능한지 확인하기','자산 셋의 표준편차와 짝마다의 상관, 비중을 넣으면 공분산 행렬 Σ와 wᵀΣw, 포트폴리오 표준편차가 나오고, 실험이 계산한 상관 표의 고윳값이 막대로 그려집니다. 아래 칸은 같은 상관 ρ의 N종목에서 첫 고윳값 1 + (N − 1)ρ를 실험 값과 견줍니다. 비교 예제는 예측을 적은 뒤에 열립니다.','표준편차가 25%와 10%인 두 자산의 상관이 0.4입니다. 공분산은 얼마일까요?','상관 하나를 −0.9 쪽으로 조금씩 내리며 고윳값 가운데 가장 작은 것이 언제 0 아래로 내려가는지 적어 보세요. 같은 상관 칸의 종목 수를 늘리면 첫 고윳값이 전체에서 차지하는 몫이 어떻게 되는지도 확인해 보세요.'],
 'two-asset-curve':['두 자산의 비중과 상관을 바꿔 기대수익–표준편차 곡선을 그리고 최소분산 비중 찾기','두 자산의 기대수익·표준편차와 상관, 첫 자산 비중을 고르면 기대수익–표준편차 평면에 지금 상관의 곡선과 상관 −1·0·1의 비교선, 지금 비중의 점과 최소분산 점이 그려지고, 최소분산 비중(공매도 없음)을 계산합니다.','표준편차 20%와 10%, 상관 0인 두 자산을 반씩 섞으면 표준편차는 몇 %일까요? 최소분산 비중(첫 자산)과 그때의 표준편차는?','상관만 1에서 −1까지 옮기며 같은 60/40의 점이 어느 쪽으로 움직이는지 적고, 최소분산 비중이 0%가 되는 상관이 언제부터인지 찾아보세요.'],
 'efficient-frontier':['세 자산의 효율적 투자선을 그리고 샤프 비율로 접점 포트폴리오 찾기','누리200·해외주식·채권 비중(남는 몫은 현금)과 무위험 금리를 고르면 만들 수 있는 점들, 효율적 투자선, 자본시장선, 접점·최소분산·지금 비중의 점이 그려지고 샤프 비율을 계산합니다. 누리200 기대수익과 공매도 금지 손잡이를 바꿔 접점이 얼마나 움직이는지 보고, 아래 칸에서 두 자산의 샤프 비율과 현금 섞기를 견줍니다.','무위험 금리가 3%입니다. 자산 X는 기대수익 8%·표준편차 20%, Y는 5%·10%입니다. 샤프 비율이 더 높은 쪽은? Y와 현금을 섞어 표준편차 5%를 만들면 Y의 비중과 기대수익은?','누리200 기대수익을 6.5%와 7.5%로 바꿔 접점 비중이 각각 어떻게 움직이는지 적고, 맞출 표준편차를 접점의 σ보다 크게 넣었을 때 어떤 안내가 나오는지 확인해 보세요.'],
 'beta-estimate':['월간 수익률로 베타를 추정하고 CAPM 요구수익률 계산하기','시장과 종목의 월간 수익률(쉼표로 나눈 숫자)을 넣으면 산점도와 회귀선, 베타·상관이 나오고, 달 하나씩 빼고 다시 추정한 베타의 범위와 CAPM 요구수익률을 계산합니다. CAPM의 국고채 금리와 주식 위험 프리미엄은 확인일이 있는 ⏱ 값입니다.','6개월의 시장 수익률이 1, −2, 3, 0, −1, 2(%), 종목 수익률이 1, −1, 2, 0, −1, 2(%)입니다. 베타는?','종목 수익률을 모두 시장의 두 배로 바꿔 베타와 상관이 어떻게 되는지 적고, 달 하나를 크게 바꿨을 때 베타의 범위가 얼마나 넓어지는지 확인해 보세요.'],
 'target-mix':['목표 표준편차에 맞는 주식·채권·현금 비중 계산하기','주식(누리200)·채권 묶음·현금 비중을 넣으면 기대수익·표준편차·나쁜 해 어림(μ − 2σ)이 배분표와 함께 나오고, 목표 표준편차와 현금 비중을 정하면 그에 맞는 주식·채권 비중을 계산합니다.','누리200(σ 18%)과 채권(σ 6%), 상관 −0.2만 써서 표준편차 8%를 만들려면 주식 비중은 약 몇 %일까요? 그때 기대수익은?','현금 비중을 0%, 20%, 40%로 바꾸며 같은 목표 표준편차의 주식 비중과 기대수익이 어떻게 달라지는지 적고, 목표를 4%로 낮췄을 때 어떤 안내가 나오는지 확인해 보세요.'],
 'rebalance-rules':['비중이 벗어난 계좌를 연 1회·허용 폭 규칙으로 되돌리고 매매 금액 계산하기','시작 금액·목표 주식 비중·허용 폭과 해마다의 가상 수익률을 넣으면 세 규칙(되돌리지 않음, 연 1회, 허용 폭)의 연말 주식 비중이 선으로 그려지고, 해마다 팔고 살 금액과 끝 금액이 표에 나옵니다.','2,000만 원을 주식·채권 50/50으로 시작했습니다. 1년 뒤 주식은 +30%, 채권은 0%입니다. 50/50으로 되돌리려면 주식을 얼마 팔아야 할까요? 되돌리기 전 주식 비중은?','허용 폭을 3%p와 8%p로 바꿔 몇 번 되돌리는지 세고, 주식 경로를 모두 같은 수익률로 바꾸면 세 규칙의 끝 금액이 어떻게 되는지 적어 보세요.'],
 'kelly-growth':['켈리 비율과 성장률을 계산하고 과대 베팅 때의 하위 10% 재산과 절반 아래로 떨어지는 경로 비율 확인하기(계산 연습)','이길 확률·배당·거는 비율을 넣으면 g(f) 곡선과 켈리 비율이 그려지고, f*의 절반·1배·2배·3배와 내가 거는 비율의 100번 뒤 중앙값 바로 옆에 하위 10% 재산과 한 번이라도 절반 아래로 떨어진 경로의 비율이 표로 나옵니다. 믿은 승률이 실제와 다를 때도 계산합니다.','이기면 건 돈의 2배를 받고(b = 2) 질 확률이 55%(p = 0.45)인 내기에서 켈리 비율은?','거는 비율을 켈리 비율에서 0.05씩 키우며 하위 10% 재산과 절반 아래로 떨어진 경로의 비율이 어떻게 바뀌는지 적고, 믿은 승률을 실제보다 0.05 높게 두면 실제 켈리 비율의 몇 배를 거는지 확인해 보세요.'],
 'crisis-correlation':['같은 비중을 평상시와 위기 상관으로 다시 계산해 표준편차 견주기','같은 비중의 네 종목과 주식·채권 섞은 계좌에 평상시와 위기의 상관·표준편차를 따로 넣으면 두 표준편차와 그 차이가 막대에 나오고, 커진 폭을 σ가 커진 몫과 상관이 오른 몫으로 나눕니다.','주식 σ 30%, 채권 σ 6%, 상관 +0.3일 때 60/40의 표준편차는 몇 %일까요?','위기의 주식·채권 상관을 −0.2에서 +0.5까지 옮기며 표준편차가 얼마나 커지는지 적고, 주식 비중을 줄이면 위기와 평상시의 차이가 어떻게 바뀌는지 확인해 보세요.'],
 'plan-conditions':['윤 씨의 비중이 두 조건과 IRP 한도를 만족하는지 계산해 판정하기','윤 씨(가상)의 다섯 자산 비중과 IRP 1억 원 안의 금액을 넣으면, 위기 상관 행렬이 가능한지 고윳값으로 확인한 뒤 “계산 결과와 풀이 펼치기”를 켰을 때 기대수익·표준편차·위기 상관 표준편차·위기 시나리오 손실·채권과 현금 금액·위험 기여·IRP 위험자산 비중과 두 조건의 판정이 나옵니다. 리밸런싱 규칙과 다음 점검일은 이 브라우저에만 남습니다.','윤 씨가 안 C(새벽전자·누리200·해외·채권·현금 10·25·25·30·10%)를 생각합니다. 위기 시나리오(−50, −35, −30, +2, +2.5%)에서 한 해 손실은 몇 %, 몇 원이고, 두 조건을 만족할까요?','두 조건을 모두 만족하는 비중을 하나 이상 찾아 같은 숫자를 계산하고, 그 비중의 IRP 안 주식형 펀드 금액을 바꿔 한도 판정이 언제 바뀌는지 확인해 보세요. 찾은 비중은 조건을 만족하는 예이며 정답이 아닙니다.']
};
const ALIAS={'stock-count':'포트폴리오 비중 실험 · 종목 수 보기','covariance-matrix':'공분산 행렬·고윳값 실험','two-asset-curve':'포트폴리오 비중 실험 · 두 자산 보기','efficient-frontier':'포트폴리오 비중 실험','beta-estimate':'베타 추정 실험','target-mix':'목표 표준편차 배분 실험','rebalance-rules':'리밸런싱 실험','kelly-growth':'켈리 비율과 성장률 실험','crisis-correlation':'위기 상관 재계산 실험','plan-conditions':'포트폴리오 비중 실험 · 조건 판정 보기'};
const GUESS={'stock-count':'예: ○○.○○%, 바닥 ○○.○○%','covariance-matrix':'예: 0.0○○○','two-asset-curve':'예: ○○.○○%, 첫 자산 ○○%, ○.○○%','efficient-frontier':'예: ○가 높음, Y ○○%, μ ○.○○%','beta-estimate':'예: 0.○○○','target-mix':'예: 주식 ○○.○○%, μ ○.○○%','rebalance-rules':'예: ○○○만 원, ○○.○○%','kelly-growth':'예: 0.○○○','crisis-correlation':'예: ○○.○○%','plan-conditions':'예: −○○.○○%, −○,○○○만 원, 조건 1 ○, 조건 2 ○'};
const pad=i=>String(i+1).padStart(2,'0');
/* 다음 장으로 가는 이유: 이 장을 마친 뒤 남는 질문. */
const NEXT_WHY={
 diversify:'종목마다 σ와 ρ가 다르면 1장의 식을 쓸 수 없습니다. 짝마다 다른 상관을 한 표에 담는 공분산 행렬로 계산을 넓힙니다.',
 matrix:'행렬 계산을 두 자산에 써서, 비중을 옮길 때 기대수익과 표준편차가 그리는 곡선과 표준편차가 가장 작은 비중을 찾습니다.',
 pair:'자산이 셋이고 현금도 있으면 비중의 조합이 무수히 많습니다. 버려도 되는 비중과 남길 비중을 효율적 투자선과 샤프 비율로 가릅니다.',
 frontier:'비중마다 위험을 표준편차로 쟀습니다. 그 위험 가운데 시장 전체와 함께 움직이는 몫인 베타를 12개월 수익률로 추정합니다.',
 beta:'개별 몫은 여러 종목을 섞어 줄일 수 있다면, 계좌 전체의 위험 수준은 어디에 둘까요? 목표 표준편차에 맞춰 주식·채권·현금 비중을 정합니다.',
 mix:'한 번 정한 비중도 시간이 지나면 시장이 움직여 바뀝니다. 언제 얼마를 되돌릴지 두 규칙으로 계산합니다.',
 rebalance:'6·7장은 기대수익·표준편차·상관을 안다고 놓았습니다. 4부는 그 가정을 깹니다. 먼저 승률을 잘못 잡았을 때 거는 비율이 얼마나 위험해지는지 켈리 기준의 계산 연습으로 봅니다.',
 kelly:'승률 대신 상관을 잘못 잡았다면 어떻게 될까요? 위기 때 상관이 커지면 같은 비중의 표준편차가 얼마나 커지는지 계산합니다.',
 crisis:'1~9장의 계산을 다른 사람의 계좌와 조건에 옮겨 씁니다. 가상 인물 윤 씨의 두 조건을 만족하는 비중을 찾고 위기 상관에서 다시 계산합니다.'
};
/* 출처가 비어 있으면 조사 노트로 안내한다. */
function sourceLinks(ids){if(!ids.length)return '<p class="caption">이 장의 출처와 확인일은 <a href="docs/research.html">조사 노트</a>에 모아 두었습니다.</p>';return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">자산배분에서 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}</a>`).join('');}
const PATHS=[
 ['나눠 산 것이 소용 있었는지 계산하려면','종목 수와 상관으로 표준편차의 바닥을 계산하고, 공분산 행렬로 넓힌 뒤 두 자산 곡선에서 최소분산 비중을 찾습니다.',['diversify','matrix','pair']],
 ['비중을 정하고 유지하는 계산을 하려면','효율적 투자선과 샤프 비율, 베타와 CAPM을 계산하고, 목표 표준편차에 맞춘 비중과 되돌리는 규칙의 매매 금액을 구합니다.',['frontier','beta','mix','rebalance']],
 ['가정이 틀렸을 때를 다시 계산하려면','승률을 잘못 잡은 켈리 계산과 위기 상관의 재계산을 거쳐, 윤 씨의 두 조건을 만족하는 비중을 찾습니다.',['kelly','crisis','final']]
];
function paths(){return `<div class="path-grid">${PATHS.map(([t,d,ids])=>`<div class="path"><h3>${t}</h3><p>${d}</p>${ids.map(id=>{const i=B.chapters.findIndex(c=>c.id===id);return `<a href="#${id}" aria-label="${pad(i)}장 ${U.esc(B.chapters[i].title)}">${pad(i)}</a>`;}).join('')}</div>`).join('')}</div>`;}
const SERIES='이 책은 시리즈 「금융과 투자 처음부터」의 9권입니다. 본문에 나오는 n권은 같은 시리즈의 다른 권이며, 반드시 필요한 앞 권은 8권 「가격은 어떻게 흔들리는가」의 표준편차와 연율화(3장) 하나입니다. 투자자의 마음을 다루는 10권(준비 중)과 13권(준비 중)은 아직 없어 링크를 걸지 않습니다.';
const GLOSSARY=[['표준편차 σ','수익률이 평균에서 퍼진 정도. 이 책은 1년 단위(연율)로 쓰고, 표준편차를 뜻할 때 “변동성” 대신 “표준편차”라고 쓴다.'],['상관 ρ','두 수익률이 함께 움직이는 정도(−1~1). 원인을 말하지 않는다.'],['기대수익 μ','한 해 수익률의 산술 평균으로 기대하는 값. 이 책의 다섯 자산 값은 미리 정한 가정이다.'],['공분산','ρσᵢσⱼ. 상관에 두 표준편차를 곱한 값.'],['공분산 행렬 Σ','대각선에 분산, 나머지에 공분산을 둔 표. 포트폴리오 분산은 wᵀΣw.'],['고윳값','행렬이 방향을 바꾸지 않고 늘이는 배율. 상관 표의 고윳값이 모두 0 이상이어야 상관 행렬로 가능하다(이 책은 실험이 계산한다).'],['바닥 σ√ρ','같은 σ·같은 ρ의 종목을 끝없이 늘려도 남는 표준편차.'],['최소분산 비중','두 자산을 섞어 표준편차가 가장 작은 비중.'],['공매도','빌린 자산을 팔아 비중을 0 아래로 두는 거래. 이 책은 4장 비교 손잡이 말고는 공매도 없이 계산한다.'],['효율적 투자선','같은 표준편차에서 기대수익이 가장 높은 비중들의 모임(이 책은 공매도 없이).'],['샤프 비율','(μ − r_f) ÷ σ. 위험 한 단위당 초과수익.'],['접점 포트폴리오','무위험 금리에서 그은 직선이 효율적 투자선에 닿는 점. 샤프 비율이 가장 크다.'],['자본시장선','현금과 접점 포트폴리오를 섞은 점들이 놓이는 직선.'],['베타 β','종목이 시장과 함께 움직이는 정도. Cov(종목, 시장) ÷ Var(시장).'],['회귀선','점들에 가장 가깝게 그은 직선. 베타는 종목–시장 수익률 점들의 회귀선 기울기다.'],['주식 위험 프리미엄','시장 기대수익 − 무위험 금리. 이 책은 6권 확인값 4.9%를 ⏱ 값으로 다시 쓴다.'],['CAPM','요구수익률 = 무위험 금리 + β × 주식 위험 프리미엄.'],['μ − 2σ','정규분포를 가정한 나쁜 해 어림. 실제 꼬리는 더 두꺼울 수 있다.'],['리밸런싱','벗어난 비중을 목표로 되돌리는 일. 연 1회 규칙과 허용 폭(±%p) 규칙.'],['%p (퍼센트포인트)','두 백분율의 차이. 65.66%와 60%의 차이는 5.66%p.'],['켈리 비율 f*','장기 성장률이 가장 높은 거는 비율. 이산형 p − q ÷ b. 이 책은 계산 연습으로만 쓴다.'],['하위 10% 재산','100번 뒤 재산을 작은 것부터 늘어놓았을 때 아래 10%에 해당하는 값.'],['위험 기여','wᵢ(Σw)ᵢ ÷ σₚ². 자산이 포트폴리오 분산에서 차지하는 몫. 합이 100%.'],['위기 시나리오','이 책이 정한 한 해 수익률 가정(새벽전자 −50%, 누리200 −35%, 해외 −30%, 채권 +2%, 현금 +2.5%).'],['IRP','개인형 퇴직연금 계좌. 위험자산 한도는 시점에 묶인 ⏱ 값이라 확인일과 함께 적는다.']];
function sourcesSection(){
 return `<section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">분산투자·체계적 위험·CAPM·베타 회귀는 대학 교재로, 연구 결과는 학술 서지·초록과 2차 자료로 확인한 수준을 적었습니다. 시점에 묶인 값(⏱)은 넷뿐입니다: 퇴직연금 위험자산 70% 한도와 적격 TDF 예외(${AMath.MARKET.pensionLimit.label}, ${AMath.MARKET.pensionLimit.checked} 확인 기준), 국고채 금리 4.4%와 주식 위험 프리미엄 4.9%(${AMath.MARKET.rf10y.label}, 국고채 금리 ${AMath.MARKET.rf10y.checked} 확인, 주식 위험 프리미엄 ${AMath.MARKET.erp.edition} 판·${AMath.MARKET.erp.checked} 확인). ${U.RECHECK}</p><div class="note"><b>이 책은 학습용이며 투자 권유가 아닙니다.</b><br>하린, 윤 씨, 새벽전자·누리200·해외주식 묶음·채권 묶음·현금의 기대수익·표준편차·상관, 12개월·4년 가상 자료, 위기 시나리오는 이 책을 위해 정한 가정입니다(${U.LABEL}). 어느 결과도 실제 독자에게 권하는 비중이 아니며, 효율적 투자선·접점·풀이 예시의 비중은 ${U.WEIGHTS}. 실험은 js/math.js의 식대로 브라우저에서 실제로 계산하고, 결과 끝의 꼬리표로 무엇 위에서 계산했는지 밝힙니다. “미리 정한 가정”은 다섯 자산과 가상 자료·시나리오, “서재 안 재인용”은 6권이 확인한 값, “보도 기준”은 법령 원문을 확인하지 못하고 보도로만 확인한 값, “교재 정의”는 대학 교재로 확인한 식, “학술 서지”는 서지와 초록만 확인한 연구, “확인 못함”은 출처로 확인하지 못한 것, “시각적 비유”는 숫자 없이 위치만 보이는 그림입니다. 그림의 색은 돕는 표시일 뿐이며, 같은 내용을 글자와 기호(▲ 지금 값·강조, ✓ 만족, ✗ 만족하지 못함·오류, ● ■ ▲ ◆ ○ 점 모양, 선 무늬)로도 적었습니다. 출처와 단순화한 부분은 <a href="docs/research.html">조사 노트</a>에 있습니다.<br>${SERIES}</div>${B.sources.length?sourceLinks(B.sources.map((_,i)=>i)):''}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary">${GLOSSARY.map(([t,d])=>`<p><b>${t}</b> ${d}</p>`).join('')}</div></section>`;
}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">CORRELATION, WEIGHTS, CONDITIONS</div><h1>자산배분<br><em>상관으로 포트폴리오 위험을 계산하고 조건에 맞는 비중 찾기</em></h1><p class="lead">가상 인물 하린은 새벽전자 주식 하나만 갖고 있기 불안해 누리200 상품도 샀는데, 시장이 크게 내린 날 두 기록이 거의 같이 떨어졌습니다. 이 책은 종목 수와 상관으로 표준편차가 얼마나 줄어드는지 계산하고, 공분산 행렬과 효율적 투자선, 베타를 거쳐 목표 표준편차에 맞는 비중과 되돌리는 규칙을 계산합니다. 4부에서는 승률과 상관을 잘못 잡았을 때를 다시 계산하고, 마지막 과제에서 가상 인물 윤 씨가 밝힌 두 조건을 만족하는 비중을 찾아 위기 상관에서 다시 계산합니다.</p><p class="caption rate-note">다섯 자산의 숫자는 ${U.LABEL}입니다. ⏱ 값은 ${AMath.CHECKED} 확인 기준이며, ${U.RECHECK}</p><div class="hero-links"><a class="button primary" href="#diversify">01장부터 읽기</a><a class="button" href="#frontier">포트폴리오 비중 실험</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span>투자 권유 없음</span></div><p class="caption">분산 계산 → 투자선과 베타 → 비중과 리밸런싱 → 가정이 틀렸을 때 → 마지막 과제<br>모든 계산은 브라우저 안에서 하며, 인물과 회사, 다섯 자산의 숫자는 모두 가상입니다.</p><p class="caption series-note">${SERIES}</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>상관으로 위험을 계산하고, 조건에 맞는 비중을 찾고, 가정이 틀렸을 때를 다시 계산합니다</h2><p>1~3장에서 분산의 효과와 한계를 계산하고, 4~5장에서 효율적 투자선과 베타를, 6~7장에서 계좌 비중과 리밸런싱을 계산합니다. 8~9장은 그 가정을 깨고, 마지막 과제에서 윤 씨의 조건을 판정합니다.</p></div>${flow(['1부 · 상관과 비중으로 위험 계산하기|종목 수 · 공분산 행렬 · 두 자산 (1~3장)','2부 · 효율적 투자선과 시장 위험 계산하기|투자선 · 샤프 비율 · 베타 (4~5장)','3부 · 계좌 비중을 정하고 유지하기|목표 표준편차 · 리밸런싱 (6~7장)','4부 · 승률과 상관을 잘못 잡았을 때 다시 계산하기|켈리 계산 연습 · 위기 상관 (8~9장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 바꾸어 보고, 숫자와 그림으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${pad(i)} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 질문 중심으로 돌아보세요.</p></div>${paths()}</section>
 ${sourcesSection()}`;
 cleanup=AHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${pad(index)}</span><h3>${title}</h3><small class="lab-alias">본문의 “${ALIAS[id]}”</small></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}<label class="my-guess" for="guess-${id}"><span>내 예측 적어 두기</span><input id="guess-${id}" type="text" autocomplete="off" placeholder="${GUESS[id]||'짐작한 답을 짧게'}"></label></div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross||!c.cross.length)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=window.AFigures?.render(c.id),caption=art?art.caption:`${c.subtitle}`;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
/* 본문 표: 칸이 다섯 개 이상이면 좁은 화면에서 행마다 카드로 묶도록 칸 이름을 붙인다(첫 칸은 행 이름이라 그대로 보인다). */
function detailTable(title,body){
 if(!body.includes('<table'))return body;
 const head=[...body.matchAll(/<th scope="col">(.*?)<\/th>/g)].map(m=>m[1].replace(/<[^>]+>/g,'')),cards=head.length>=5;
 const html=body.replace(/<tbody>([\s\S]*?)<\/tbody>/,(m,rows)=>'<tbody>'+rows.replace(/<tr>([\s\S]*?)<\/tr>/g,(r,cells)=>{let k=0;return '<tr>'+cells.replace(/<(td|th)([^>]*)>/g,(c,tag,attr)=>`<${tag}${attr} data-label="${U.esc(head[k++]||'')}">`)+'</tr>';})+'</tbody>');
 return html.replace(/<table>/,`<div class="table-wrap${cards?' cards':' fit'}" tabindex="0" role="region" aria-label="${U.esc(title)}"><table>`).replace(/<\/table>/,'</table></div>');
}
/* 깊이 읽기 상자. “풀이”로 시작하는 상자(마지막 과제)는 과제를 마친 뒤 펼치도록 접어 둔다(책 AGENTS.md: (가)의 숫자는 풀이에만). */
function deep([title,body]){return /^풀이/.test(title)?`<details class="deep-reading solution"><summary><h3>${title}</h3></summary>${detailTable(title,body)}</details>`:`<div class="deep-reading"><h3>${title}</h3>${detailTable(title,body)}</div>`;}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. data-* 값은 원래 번호다. */
function choices(q,target,attr){return U.choiceOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function navLinks(index){
 const prev=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${NEXT_WHY[B.chapters[index].id]}</small></a>`:'<a href="../tax/#order">다른 책 · 세금과 계좌 09 · 계좌별 세후 수익 비교<small>이동 이유: 깊이 보기 (뒤 권). 이 과제는 일반 계좌와 IRP에 비중을 나누기만 했고, 계좌마다 어떤 자산을 둘지 세후로 정하는 계산은 하지 않았습니다. 그 계산은 시리즈 11권의 이 장에서 합니다. 비중을 되돌리는 규칙을 지키기 어렵게 만드는 마음의 함정은 10권(준비 중)에서 다룹니다.</small></a>';
 return `<nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${pad(index)}. ${c.title} · 자산배분`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>${index?'앞 장 떠올리기':'먼저 떠올리기'}</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(deep).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source||[])}${cross(c)}</section>${navLinks(index)}</div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);ALabs[id](el);AGuides.mount(id,el);});
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
