(()=>{
'use strict';
const U=PUI,B=PBook,M=PMath,main=document.querySelector('main'),BOOK_TITLE='행동재무학 · 매매 기록에서 손실 회피와 과신의 흔적을 세고 규칙을 시험하기';let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 제목은 G2에서 정한 실험 이름 뒤에 독자가 계산하는 것을 적는다(K7). 예측 질문(L2)은 본문이 계산하지 않은 새 사례이며,
   문장은 docs/index.html #chapters 표의 L2 칸에서 괄호 속 답을 뺀 질문과 같고(tests/routes.test.cjs) 답은 PMath 계산과 같다(tests/browser.cjs). ALIAS는 본문(content.js)이 그 실험을 부르는 이름이다. */
const info={
 'two-frame-choice':['같은 선택지 두 틀 실험: 두 선택지의 기대값과 끝 금액을 계산하고 두 틀에서 고른 쪽 기록하기','시작 금액, 확실한 쪽의 금액, 모험하는 쪽의 확률과 금액을 넣으면 이익 틀(A·B)과 손실 틀(C·D)의 문항이 표로 나옵니다. 두 틀에서 하나씩 고르면 고른 쪽이 같은지 다른지만 글자로 나오고, 선택은 저장하지 않습니다. 기대값과 끝 금액은 펼치기를 켜야 나옵니다.','확실히 600만 원을 잃는 선택지와, 1/4 확률로 잃지 않고 3/4 확률로 800만 원을 잃는 선택지가 있습니다. 두 번째 선택지의 기대 손익은 얼마이고, 첫 번째와 견주면 어떤가요?','확률을 1/4로, 모험하는 쪽의 금액을 800만 원으로 바꾸고 손실 틀의 확실한 쪽이 −600만 원이 되게 확실한 쪽의 금액을 맞춘 뒤 펼쳐 보세요. 이어서 시작 금액만 바꾸면 기대 손익과 끝 금액 기대값 가운데 어느 것이 그대로인지 적어 보세요.'],
 'value-function':['가치 함수 실험: 이익과 손실의 가치를 계산하고 반반 내기를 받아들이는 최소 이익 구하기','이익 G와 손실 L(만 원), 손실 회피 계수 λ와 굽음 α·β를 넣으면 가치 함수 곡선 위의 두 점, 반반 내기의 전망 가치, 받아들이는 최소 이익이 나옵니다. 확률 가중은 켜기 단추를 눌러야 곡선과 표가 나옵니다.','손실을 같은 크기의 이익보다 2.25배 크게 느끼고 금액에 비례해 느낀다면(α = β = 1, 확률 가중 끔), 반반 확률로 100만 원을 잃는 내기에서 이길 때 최소 얼마를 받아야 받아들일까요?','λ를 2.25에서 1로 낮췄을 때 최소 이익이 얼마로 내려가는지 적고, α와 β를 1로 둔 채 λ만 바꾸면 최소 이익이 λ × L과 같아지는지 확인해 보세요.'],
 'disposition-count':['처분 효과 측정 실험: 매도한 날마다 네 칸을 세어 PGR과 PLR 계산하기','일지 범위를 1~13주와 14~26주 가운데 하나로 고르면 매도한 날마다 RG·PG·RL·PL이 표로 채워지고 PGR·PLR과 그 차이가 나옵니다. 일지에 없는 기록은 “직접 입력”으로 네 칸을 넣습니다.','어떤 사람의 기록에서 매도한 날들을 모두 더하니 실현 이익 2, 평가 이익 6, 실현 손실 1, 평가 손실 9였습니다. PGR과 PLR, 그 차이는?','두 범위의 PGR·PLR을 적고, 직접 입력에서 실현 손실을 0으로 두면 어떤 안내가 나오는지 확인해 보세요.'],
 'base-rate-grid':['추천 1,000종목 실험: 기저율·적중률·오경보율로 추천이 맞을 확률 계산하기','기저율, 추천 적중률, 오경보율을 바꾸면 1,000종목 격자에서 추천받은 칸과 그 가운데 실제로 두 배가 된 칸이 칠해지고 추천이 맞을 확률이 나옵니다.','기저율 5%, 적중률 80%, 오경보율 20%인 추천이 “두 배 오를 종목”이라고 했습니다. 실제로 두 배가 될 확률은?','적중률을 60%에서 99%로 올렸을 때와 오경보율을 10%에서 1%로 낮췄을 때 맞을 확률이 각각 얼마나 바뀌는지 적어 보세요.'],
 'likelihood-odds':['증거별 우도비로 확신 계산 실험: 증거를 켜고 끄며 지지 증거만 넣은 확신과 견주기','사전 확률과 증거마다의 우도비를 넣고 증거를 켜고 끄면 사전·지지 증거만·켜진 증거 모두의 확신이 막대와 숫자로 나옵니다.','사전 확률이 40%입니다. 지지 증거 하나의 우도비가 3, 반대 증거 하나의 우도비가 0.25입니다. 둘 다 넣은 확신과 지지 증거만 넣은 확신은?','반대 증거 하나의 우도비를 0.4에서 1로 바꾸면 두 확신의 차이가 어떻게 되는지 적고, 지지 증거를 모두 끄면 어떤 값이 나오는지 확인해 보세요.'],
 'interval-cost':['적중률과 비용 실험: 90% 범위의 적중률과 이항 확률, 회전율의 비용 계산하기','선우가 적은 90% 범위 9개와 4주 뒤 종가가 표로 나오고, 범위 수와 맞은 수를 넣으면 적중률과 이항 확률이 계산됩니다. 연 회전율과 ETF 여부를 바꾸면 연 비용과 기간 뒤 금액이 나옵니다. 세율과 수수료는 확인일이 있는 ⏱ 값입니다.','어떤 사람이 90% 예상 범위 20개를 적었고 11개가 맞았습니다. 적중률은 몇 %이고, 진짜 90% 범위였다면 몇 개쯤 맞았어야 하나요?','연 회전율을 두 배로 올리면 연 비용과 10년 뒤 금액의 차이가 어떻게 바뀌는지 적고, 맞은 수를 하나씩 줄이며 P(X ≤ k)가 언제 5% 아래로 내려가는지 확인해 보세요.'],
 'info-cascade':['정보 폭포 실험: 차례로 고르는 줄에서 폭포가 시작되는 자리와 틀린 폭포의 확률 계산하기','신호 정확도 p와 사람마다의 신호(G·B)를 넣으면 차례로 사거나 사지 않는 줄이 그려지고, 폭포가 시작된 자리와 모형의 맞는 폭포·틀린 폭포 확률이 나옵니다. 가정을 단순하게 둔 모형입니다.','신호 정확도가 0.7입니다. 첫째 사람은 자기 신호대로 사고, 둘째 사람은 자기 신호가 좋으면 사고 나쁘면 반반으로 고릅니다. 두 사람이 모두 샀고 셋째 사람의 신호는 “나쁘다”입니다. 셋째 사람이 “좋은 종목”이라고 볼 확률은?','첫 두 사람의 신호만 바꿔 보며 뒤의 줄이 어떻게 바뀌는지 적고, 신호를 공개하기를 켜면 폭포가 생기는지 확인해 보세요.'],
 'loss-by-trials':['횟수별 손실 확률 실험: 기대값이 양수인 규칙이 손실로 끝날 확률 계산하기','승률, 이길 때와 질 때의 금액, 횟수 n을 바꾸면 합계의 분포와 합계가 음수·0·양수일 확률이 나옵니다. 이항분포로 계산하며 모의실험을 쓰지 않습니다.','승률 55%, 이기면 +1, 지면 −1인 규칙을 10번 했습니다. 합계가 음수로 끝날 확률은? 정확히 0일 확률은?','횟수를 20번에서 늘리며 손실 확률이 10% 아래로 내려가는 횟수를 찾고, 승률을 52%로 낮추면 같은 횟수에서 어떻게 되는지 적어 보세요.'],
 'rule-replay':['규칙 대입 실험: 규칙이 걸린 주를 찾고 지켰을 때의 손익을 경로별로 계산하기','R1(손실 한도)·R2(비중 한도)를 켜고 값을 바꾸면 규칙이 걸린 주가 일지에 표시되고, 규칙을 지켰을 때의 끝 금액과 실제의 차이가 종목별로 나옵니다. 경로를 “선우의 일지”와 “반등 경로(가정)”로 바꿀 수 있습니다. 비교 예제는 예측을 적은 뒤에 열립니다.','300주를 갖고 있고 평균 단가 기준 −10% 가격이 18,000원입니다. 규칙대로 18,000원에 팔지 않고 기다리다 16,500원에 팔았다면, 비용을 빼고 손실이 얼마나 더 커졌나요?','R1 한도를 바꿔 가며 지켰다면의 차이가 양수에서 음수로 바뀌는 곳을 찾고, 같은 한도를 반등 경로(가정)에 대면 어떻게 되는지 적어 보세요. 어느 결과도 그 한도를 권하는 값이 아닙니다.'],
 'journal-audit':['일지 점검 실험: 일지 전체의 점검표를 계산하고 규칙 하나를 고쳐 다시 계산하기','26주 일지 전체의 PGR·PLR, 보유 기간, 적중률, 회전율과 비용, 남의 행동을 이유로 쓴 매수, 규칙 위반이 한 표로 나오고, 규칙 하나의 값을 고치면 다시 계산됩니다. 결과 칸은 접혀 있고, 일지 양식의 칸을 고르면 선우의 매수에서 빠진 칸 수가 나옵니다. 비교 예제는 예측을 적은 뒤에 열립니다.','26주 전체에서 매도한 날들을 모두 더하면 실현 이익 5, 평가 이익 2, 실현 손실 1, 평가 손실 8입니다. PGR과 PLR은?','과제지 (가)~(사)를 먼저 손으로 채운 뒤 점검표를 펼쳐 견주고, R1 한도 하나를 골라 지켰다면의 끝 금액과 그 한도가 손해일 수 있는 경로를 적어 보세요. 고른 한도는 계산 연습의 예이며 정답이 아닙니다.']
};
const ALIAS={'two-frame-choice':'같은 선택지 두 틀 실험','value-function':'가치 함수 실험','disposition-count':'처분 효과 측정 실험','base-rate-grid':'추천 1,000종목 실험','likelihood-odds':'증거별 우도비로 확신 계산 실험','interval-cost':'적중률과 비용 실험','info-cascade':'정보 폭포 실험','loss-by-trials':'횟수별 손실 확률 실험','rule-replay':'규칙 대입 실험','journal-audit':'일지 점검 실험'};
const GUESS={'two-frame-choice':'예: −○○○만 원, 같음/다름','value-function':'예: ○○○만 원','disposition-count':'예: 0.○○○, 0.○○○, 0.○○○','base-rate-grid':'예: ○○.○%','likelihood-odds':'예: ○○.○%, ○○.○%','interval-cost':'예: ○○%, ○○개','info-cascade':'예: ○○.○%','loss-by-trials':'예: ○○.○%, ○○.○%','rule-replay':'예: ○○만 원','journal-audit':'예: 0.○○○, 0.○○○'};
const pad=i=>String(i+1).padStart(2,'0');
/* 다음 장으로 가는 이유: 이 장을 마친 뒤 남는 질문. */
const NEXT_WHY={
 frame:'말만 바꿔도 선택이 갈릴 수 있다는 것을 기대값과 원 연구로 보았습니다. 손실을 이익보다 얼마나 더 크게 느끼는지 가치 함수로 크기를 잽니다.',
 prospect:'손실을 크게 느끼는 마음이 실제 매매 기록에도 남을까요? 선우가 판 날마다 네 칸을 세어 확인합니다.',
 disposition:'선우가 다시 산 새벽전자의 매수 이유는 “두 배 오를 종목” 추천이었습니다. 그 추천이 맞을 확률을 기저율로 계산합니다.',
 baserate:'추천 말고 선우가 모은 증거 다섯 개는 확신을 얼마나 바꿔야 했을까요? 우도비로 증거마다 계산합니다.',
 confirm:'부풀어 오른 확신은 매수 때 적은 90% 범위에도 남았을까요? 적중률을 세고, 그 확신으로 사고판 비용도 계산합니다.',
 overconfidence:'거래 8의 이유에는 “다들 샀다”는 댓글도 있었습니다. 남을 따르는 선택이 언제 합리적이고 얼마나 자주 틀리는지 계산합니다.',
 herd:'결과가 나쁘면 결정이 나빴던 걸까요? 기대값이 양수인 규칙을 몇 번만 했을 때 손실로 끝날 확률을 계산합니다.',
 outcome:'결과 대신 미리 정한 규칙으로 판단한다면 무엇이 달라질까요? 선우가 처음 적은 규칙을 일지에 대입해 봅니다.',
 rules:'1~9장의 계산을 선우의 일지 전체에 함께 씁니다. 숫자로 찾은 흔적에서 규칙 하나를 고치고, 그 규칙이 손해일 수 있는 경로까지 적습니다.'
};
/* 출처가 비어 있으면 조사 노트로 안내한다. */
function sourceLinks(ids){if(!ids.length)return '<p class="caption">이 장의 출처와 확인일은 <a href="docs/research.html">조사 노트</a>에 모아 두었습니다.</p>';return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">행동재무학에서 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}</a>`).join('');}
const PATHS=[
 ['같은 선택지 앞에서 왜 고르는 쪽이 바뀌는지 계산하려면','틀에 따라 갈린 선택을 기대값으로 확인하고, 가치 함수로 손실 회피의 크기를 잰 뒤, 매매 기록에서 처분 효과의 흔적을 셉니다.',['frame','prospect','disposition']],
 ['믿음이 증거보다 앞설 때를 숫자로 확인하려면','기저율로 추천이 맞을 확률을, 우도비로 증거마다 확신을, 이항 확률로 90% 범위의 적중을 계산하고 매매 비용까지 셉니다.',['baserate','confirm','overconfidence']],
 ['정해 둔 규칙을 기록에서 시험하려면','남을 따를 때 틀릴 확률과 결과만 볼 때 틀릴 확률을 계산하고, 처음 적은 규칙을 일지와 다른 경로에 대입한 뒤 일지 전체를 점검합니다.',['herd','outcome','rules','final']]
];
function paths(){return `<div class="path-grid">${PATHS.map(([t,d,ids])=>`<div class="path"><h3>${t}</h3><p>${d}</p>${ids.map(id=>{const i=B.chapters.findIndex(c=>c.id===id);return `<a href="#${id}" aria-label="${pad(i)}장 ${U.esc(B.chapters[i].title)}">${pad(i)}</a>`;}).join('')}</div>`).join('')}</div>`;}
const SERIES='이 책은 시리즈 「금융과 투자 처음부터」의 10권입니다. 본문에 나오는 n권은 같은 시리즈의 다른 권이며, 반드시 필요한 앞 권은 없습니다. 기대값과 이항분포는 확률과 통계 책에서, 수수료와 거래세는 4권에서 다시 볼 수 있습니다. 13권(준비 중)은 아직 없어 링크를 걸지 않습니다.';
const GLOSSARY=[['틀','같은 선택지를 이익의 말로 들려주느냐 손실의 말로 들려주느냐의 차이. 사실은 같고 말만 다르다.'],['기대값','확률과 금액을 곱해 더한 값. 같은 선택을 아주 많이 되풀이했을 때의 평균.'],['끝 금액','시작 금액에 손익을 더한 금액. 두 틀을 같은 기준점에서 견줄 때 쓴다.'],['가치 함수 v(x)','이익 x^α, 손실 −λ(−x)^β로 이익과 손실을 느끼는 크기를 적은 식(단위 만 원).'],['손실 회피 계수 λ','손실을 같은 크기의 이익보다 몇 배 크게 느끼는지. 이 책의 기본값 2.25는 한 연구의 중앙값이다.'],['전망 가치','확률(또는 확률 가중)과 가치 함수 값을 곱해 더한 값. 0보다 크면 받아들인다고 본다.'],['확률 가중 w(p)','작은 확률은 크게, 큰 확률은 작게 느끼는 무게. 2장에서 켜기 단추 안에서만 쓴다.'],['확실성 등가','확실히 받으면 같다고 느끼는 금액.'],['처분 효과','오른 종목은 일찍 팔고 내린 종목은 오래 들고 있는 경향.'],['RG·PG·RL·PL','매도한 날에 센 실현 이익·평가 이익·실현 손실·평가 손실 종목 수.'],['PGR·PLR','이익 난 종목 가운데 판 것의 비율 RG ÷ (RG + PG)와 손실 난 종목 가운데 판 것의 비율 RL ÷ (RL + PL).'],['기저율','대상이 전체에서 얼마나 흔한지. 4장에서는 두 배가 되는 종목의 비율(가정).'],['적중률·오경보율','두 배가 될 종목을 추천하는 비율과 두 배가 되지 않을 종목을 추천하는 비율.'],['오즈','p ÷ (1 − p). 확률 50%의 오즈는 1.'],['우도비','참일 때 그 증거가 나올 확률 ÷ 거짓일 때 나올 확률. 1이면 확신을 바꾸지 않는다.'],['90% 예상 범위','“90% 확률로 이 안”이라고 적은 범위. 많이 적으면 열에 아홉쯤 맞아야 한다.'],['이항 확률','성공 확률이 같은 시도를 n번 할 때 성공이 k번 이하일 확률 같은 값.'],['회전율','매도 금액 ÷ 평균 평가액. 1년으로 바꾼 값을 연 회전율이라 한다.'],['%p (퍼센트포인트)','백분율끼리의 차이. 0.69%p는 계좌에서 한 해 0.69%가 줄어든다는 뜻.'],['정보 폭포','앞사람들의 행동만 보일 때 뒤의 사람이 자기 신호를 버리고 따르는 상태. 이 책은 단순한 모형으로만 계산한다.'],['결과 편향','결과가 나쁠 때 같은 결정을 더 나쁘게 평가하는 경향.'],['R1·R2·R3','선우가 처음 적은 규칙: 손실 한도 −10%, 한 종목 비중 35% 이하, 매수 기록에 반대 증거 적기(계산 연습에 쓰는 예).'],['반등 경로(가정)','9장에서 같은 규칙을 시험하려고 이 책이 정한 가상 가격 경로.']];
function sourcesSection(){
 const T=M.MARKET.tradeTax,Fe=M.MARKET.fee;
 return `<section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">틀 효과·전망 이론·처분 효과·기저율·과신·정보 폭포·결과 편향은 학술 원문이나 초록으로, 강의 노트는 2차 자료로 확인한 수준을 적었습니다. 시점에 묶인 값(⏱)은 둘뿐입니다: 증권거래세 ${U.sfmt(T.value*100,2)}%(${T.label}, ${T.checked} 확인 기준)와 수수료 ${U.sfmt(Fe.value*100,3)}%(${Fe.label}, ${Fe.checked} 확인 기준). ${U.RECHECK}</p><div class="note"><b>이 책은 학습용이며 투자 권유가 아닙니다.</b><br>${U.DISCLAIMER} 선우, 하린, 선우의 26주 일지(가격·거래·이유·예상 범위·메모), 4장의 비율, 5장의 우도비, 9장의 반등 경로는 이 책이 정한 가상 시나리오입니다(${U.LABEL}). 새벽전자·온결식품·가람200·누리 해외100은 앞선 권의 가상 이름입니다. 실험은 js/math.js의 식대로 브라우저에서 실제로 계산하고, 결과 끝의 꼬리표로 무엇을 바탕으로 계산했는지 밝힙니다. “실제 계산”은 브라우저가 식으로 계산한 값, “미리 정한 시나리오”는 이 책이 정한 일지와 가정, “학술 원문”·“학술 초록”은 연구를 확인한 수준, “서재 안 재인용”은 다른 권이 확인한 값, “보도 기준”은 법령 원문을 확인하지 못하고 보도로만 확인한 값, “확인 못함”은 출처로 확인하지 못한 것, “시각적 비유”는 숫자 없이 위치만 보이는 그림입니다. 자아 고갈·돈 점화·파워 포즈처럼 재현에 실패한 효과는 쓰지 않습니다. 그림의 색은 돕는 표시일 뿐이며, 같은 내용을 글자와 기호(✓ 맞음·받아들임, ✗ 벗어남·거절·오류, ▲ 지금 값·규칙이 걸림, ● ■ ○ 점 모양, 선 무늬)로도 적었습니다. 출처와 단순화한 부분은 <a href="docs/research.html">조사 노트</a>에 있습니다.<br>${SERIES}</div>${B.sources.length?sourceLinks(B.sources.map((_,i)=>i)):''}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary">${GLOSSARY.map(([t,d])=>`<p><b>${t}</b> ${d}</p>`).join('')}</div></section>`;
}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">LOSS, BELIEF, RULES</div><h1>행동재무학<br><em>매매 기록에서 손실 회피와 과신의 흔적을 세고 규칙을 시험하기</em></h1><p class="lead">가상 인물 선우는 가상 계좌 2,000만 원으로 26주 동안 사고판 기록을 일지에 적었습니다. 처음에 “평균 단가보다 10% 내리면 판다”는 규칙도 적었지만 온결식품이 그만큼 내린 8주에는 오히려 더 샀고, 26주 뒤에는 “운이 나빴다”고 썼습니다. 이 책은 그 일지를 장마다 다시 읽으며 틀에 따라 갈린 선택, 손실 회피의 크기, 이익 종목만 먼저 판 흔적, 추천과 증거로 부풀어 오른 확신, 90% 범위의 적중과 매매 비용, 남을 따를 때와 결과만 볼 때 틀릴 확률을 계산합니다. 마지막에는 처음 적은 규칙을 일지와 다른 경로에 대입하고, 일지 양식을 설계해 시험합니다.</p><p class="caption rate-note">${U.DISCLAIMER} ⏱ 값은 ${M.CHECKED} 확인 기준이며, ${U.RECHECK}</p><div class="hero-links"><a class="button primary" href="#frame">01장부터 읽기</a><a class="button" href="#disposition">처분 효과 측정 실험</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span>투자 권유 없음</span></div><p class="caption">틀과 손실 회피 → 기저율·증거·과신 → 남을 따를 때와 결과만 볼 때 → 규칙 대입 → 마지막 과제<br>모든 계산은 브라우저 안에서 하며, 인물과 일지, 회사 이름은 모두 가상입니다.</p><p class="caption series-note">${SERIES}</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>손실 앞의 선택을 계산하고, 믿음을 증거로 다시 계산하고, 정해 둔 규칙을 기록에 대입합니다</h2><p>1~3장에서 틀과 손실 회피, 처분 효과를 계산하고, 4~6장에서 기저율·우도비·적중률과 비용을, 7~9장에서 정보 폭포·결과의 우연·규칙 대입을 계산합니다. 마지막 과제에서 일지 전체를 점검합니다.</p></div>${flow(['1부 · 이익과 손실 앞에서 선택이 바뀌는 크기 계산하기|두 틀 · 가치 함수 · 처분 효과 (1~3장)','2부 · 믿음을 증거와 기저율로 다시 계산하기|기저율 · 우도비 · 적중률과 비용 (4~6장)','3부 · 남을 따를 때와 결과만 볼 때 틀릴 확률 계산하고 규칙 대입하기|정보 폭포 · 손실 확률 · 규칙 대입 (7~9장)','마지막 과제|일지 점검표 · 규칙 하나 고치기 · 일지 양식 (10장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 바꾸어 보고, 숫자와 그림으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${pad(i)} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 질문 중심으로 돌아보세요.</p></div>${paths()}</section>
 ${sourcesSection()}`;
 cleanup=PHome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${pad(index)}</span><h3>${title}</h3><small class="lab-alias">본문의 “${ALIAS[id]}”</small></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}<label class="my-guess" for="guess-${id}"><span>내 예측 적어 두기</span><input id="guess-${id}" type="text" autocomplete="off" placeholder="${GUESS[id]||'짐작한 답을 짧게'}"></label></div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross||!c.cross.length)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=window.PFigures?.render(c.id),caption=art?art.caption:`${c.subtitle}`;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
/* 본문 표: 칸이 다섯 개 이상이면 좁은 화면에서 행마다 카드로 묶도록 칸 이름을 붙인다(첫 칸은 행 이름이라 그대로 보인다). */
function detailTable(title,body){
 if(!body.includes('<table'))return body;
 const head=[...body.matchAll(/<th scope="col">(.*?)<\/th>/g)].map(m=>m[1].replace(/<[^>]+>/g,'')),cards=head.length>=5;
 const html=body.replace(/<tbody>([\s\S]*?)<\/tbody>/,(m,rows)=>'<tbody>'+rows.replace(/<tr>([\s\S]*?)<\/tr>/g,(r,cells)=>{let k=0;return '<tr>'+cells.replace(/<(td|th)([^>]*)>/g,(c,tag,attr)=>`<${tag}${attr} data-label="${U.esc(head[k++]||'')}">`)+'</tr>';})+'</tbody>');
 return html.replace(/<table>/,`<div class="table-wrap${cards?' cards':' fit'}" tabindex="0" role="region" aria-label="${U.esc(title)}"><table>`).replace(/<\/table>/,'</table></div>');
}
/* 깊이 읽기 상자. “풀이”로 시작하는 상자(마지막 과제)는 과제를 마친 뒤 펼치도록 접어 둔다(책 AGENTS.md: 44만 4,934원과 반등 경로의 숫자는 풀이에만). */
function deep([title,body]){return /^풀이/.test(title)?`<details class="deep-reading solution"><summary><h3>${title}</h3></summary>${detailTable(title,body)}</details>`:`<div class="deep-reading"><h3>${title}</h3>${detailTable(title,body)}</div>`;}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. data-* 값은 원래 번호다. */
function choices(q,target,attr){return U.choiceOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function navLinks(index){
 const prev=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${NEXT_WHY[B.chapters[index].id]}</small></a>`:'<a href="../tax/#map">다음 권 · 세금과 계좌 01 · 투자 수익에 붙는 세금 네 가지<small>이동 이유: 매매 기록에서 처분 효과와 매매 비용을 계산했으니, 같은 수익을 세후로 지키는 세금과 계좌를 정리합니다. 기록 15건과 경로 하나로 말할 수 있는 것의 한계, 실전과 백테스트의 차이는 13권(준비 중)에서 다룹니다.</small></a>';
 return `<nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${pad(index)}. ${c.title} · 행동재무학`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>${index?'앞 장 떠올리기':'먼저 떠올리기'}</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(deep).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source||[])}${cross(c)}</section>${navLinks(index)}</div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);PLabs[id](el);PGuides.mount(id,el);});
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
document.querySelector('#theme').onclick=()=>{const dark=document.documentElement.dataset.theme==='dark';document.documentElement.dataset.theme=dark?'light':'dark';};document.querySelector('#menu').onclick=()=>{const open=document.body.classList.toggle('menu-open');document.querySelector('#menu').setAttribute('aria-expanded',String(open));};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.body.classList.remove('menu-open');document.querySelector('#menu').setAttribute('aria-expanded','false');}});
route();
})();
