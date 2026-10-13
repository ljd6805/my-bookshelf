(()=>{
'use strict';
const U=TUI,B=TBook,main=document.querySelector('main'),BOOK_TITLE='세금과 계좌 · 같은 수익, 다른 세후 수익';let cleanup=()=>{};
/* 실험 제목·설명·먼저 예측하기·직접 해 보기. 예측 질문(L2)은 본문이 계산하지 않은 새 사례이며, 조작 전에 읽도록 실험 위에 둔다.
   L2 문장은 docs/index.html #chapters 표의 L2 칸과 같아야 하고, 답은 TMath 계산과 같다(tests/math.test.cjs, tests/guides.test.cjs). */
const info={
 'tax-map':['세금이 빠지는 네 시점','상품을 고르면 산다·받는다·판다·해가 바뀐다 네 사건마다 붙는 세금의 이름과 금액, 그 세금을 떼는 쪽(증권사 원천징수·본인 신고)이 표에 한 줄씩 나옵니다. 사건 단추를 누르면 그 줄에 ▲가 붙고 결과 문장이 그 사건을 설명합니다.','누리 해외100을 1년 들고 분배금 2만 원을 받은 뒤 팔아 차익 10만 원을 얻었다면, 세금은 언제 몇 번 빠지고 합계는 얼마일까요?','상품을 새벽전자에서 먼바다500으로 바꿔 같은 네 단추를 누르고, 세금이 빠지는 시점과 떼는 쪽이 어떻게 달라지는지 표의 줄을 견주어 적어 보세요. 받은 돈과 차익을 0으로 두면 어느 줄이 0원이 되는지도 확인해 보세요.'],
 stt:['매도 금액에 붙는 거래세','시장, 한 번에 파는 금액, 1년 매도 횟수를 바꾸며 거래세와 농어촌특별세, 1년 동안 쌓인 합계를 계산합니다. 손익을 넣는 칸은 없습니다.','코넥스 종목을 한 번에 500만 원어치씩 1년에 24번 판다면, 손익이 0이어도 1년 동안 낸 거래세는 얼마일까요?','시장을 코스피로 두고 거래세와 농어촌특별세 두 줄을 각각 읽은 뒤, ETF로 바꿔 두 줄이 모두 0원이 되는 것을 확인해 보세요. 매도 횟수를 1에서 52로 늘리며 합계가 횟수에 정확히 비례하는지도 보세요.'],
 withhold:['들어오기 전에 빠지는 15.4%','받은 돈의 종류와 세전 금액을 바꾸며 소득세 14%와 지방소득세 1.4%, 통장에 들어오는 금액을 계산합니다. 고배당 기업 배당 분리과세를 켜면 구간마다 붙는 세율을 막대로 봅니다.','새벽전자가 고배당 기업 요건을 채우고 하린이 그 배당만 3,000만 원 받았다면, 분리과세를 고를 때의 소득세(지방소득세 제외)는 얼마일까요?','고배당 분리과세를 켠 채 금액을 2,000만 원 아래와 위로 옮겨, 세율이 바뀌는 자리가 받은 금액 전체가 아니라 넘는 몫에만 적용되는지 확인해 보세요. 받은 돈의 종류를 이자로 바꾸면 분리과세 칸이 어떻게 되는지도 적어 보세요.'],
 gains:['차익에 세금이 붙는 사람','자산, 차익, 같은 해 손실, 종목당 보유액과 지분율을 바꾸며 국내 상장주식 소액주주·대주주와 해외 상장 자산의 양도세를 계산하고, 누가 언제 내는지를 봅니다.','먼바다500(해외 상장)으로 한 해에 차익 600만 원을 내고, 같은 해 다른 해외 상장 주식에서 150만 원 손실을 봤습니다. 같은 해의 이익과 손실을 합쳐 계산한다고 가정하면(손익통산, 확인 못함) 양도세는 얼마이고, 누가 내나요?','자산을 국내 상장주식으로 두고 보유액을 50억 원 바로 아래와 50억 원으로 옮겨 판정이 바뀌는 자리를 찾고, 해외 상장 주식으로 바꿔 차익을 250만 원 아래와 위로 옮기며 세금이 0원에서 시작하는 자리를 확인해 보세요.'],
 threshold:['2,000만 원을 넘는 몫','한 해 이자·배당 합계와 한계세율(가정)을 바꾸며 원천징수 말고 더 낼 세금을 계산하고, 소득 카드를 켜고 끄며 어떤 소득이 2,000만 원 합계에 들어가는지 가립니다.','이자·배당이 1,950만 원인 해와 2,300만 원인 해 가운데 원천징수 말고 더 낼 세금이 생기는 해는 어느 쪽이고, 한계세율을 35%로 가정하면 얼마일까요?','합계를 정확히 2,000만 원으로 두었을 때와 1원을 더했을 때를 견주고, 한계세율을 14%로 내리면 넘는 몫이 있어도 더 낼 세금이 0원이 되는 까닭을 적어 보세요. 국내 주식 차익 카드를 켰을 때 합계가 바뀌는지도 확인해 보세요.'],
 'etf-tax':['ETF가 담은 자산과 상장된 거래소','상품, 차익, 분배금·이자를 바꾸며 누리200·누리 해외100·먼바다500·나라 3년의 세금을 계산하고, 차익이 금융소득 합계에 들어가는지와 두 해외 ETF의 세금이 같아지는 차익을 그래프로 봅니다.','같은 해 차익 800만 원을 누리 해외100(국내 상장)으로 낸 경우와 먼바다500(해외 상장)으로 낸 경우, 세금은 각각 얼마이고 어느 쪽이 클까요?','분배금을 0으로 두고 차익을 옮기며 그래프의 두 선이 만나는 자리를 찾고, 그 자리보다 작은 차익과 큰 차익에서 어느 ETF의 세금이 더 큰지 적어 보세요. 나라 3년을 골라 차익을 늘려도 세금이 바뀌지 않는 까닭도 설명해 보세요.'],
 isa:['비과세 한도와 9.9%','ISA 유형, 상품, 원금, 보유 기간, 3년 전 해지 여부를 바꾸며 ISA 안 순이익과 비과세 한도, 넘는 몫의 9.9%를 계산하고 같은 투자의 일반계좌 세금과 견줍니다.','누리 해외100 1,500만 원을 일반형 ISA에서 3년 들면(기준 사례 비율) 순이익과 세금은 얼마이고, 같은 투자를 일반계좌에서 했을 때보다 세금이 얼마 적을까요?','원금을 늘려 가며 순이익이 200만 원을 넘는 자리를 찾고, 그 자리에서 유형을 서민형으로 바꿔 세금이 어떻게 되는지 보세요. “3년 전에 해지”를 켜면 ISA 칸과 일반계좌 칸이 같아지는 것도 확인해 보세요.'],
 pension:['넣을 때 받는 세액공제, 꺼낼 때 내는 세금','1단계에서 계좌, 납입액, 총급여 구간을 바꿔 세액공제를 계산하고, 2단계에서 인출 방식과 세금을 내는 해까지 남은 해, 할인율을 바꿔 세후 수익과 늦게 내는 세금의 오늘 가치를 봅니다.','총급여가 6,000만 원이라 공제율이 13.2%인 사람이 연금저축에 600만 원을 넣고 3년 뒤 모두 꺼내면, 받은 공제와 원금 몫에 낸 기타소득세는 각각 얼마이고 차이는 얼마일까요?','1단계에서 납입액을 600만 원에서 1,000만 원으로 늘려도 공제가 그대로인 까닭을 계좌를 IRP로 바꿔 확인하고, 2단계에서 남은 해를 늘리며 같은 세금의 오늘 가치가 얼마나 줄어드는지 적어 보세요.'],
 'after-tax':['세후 수익 계산기','상품, 원금, 보유 기간, 연 가격 상승률, 연 분배·배당·이자율, 총급여 구간, ISA 유형, 연금저축을 꺼내는 방법을 바꾸며 같은 투자를 일반계좌·ISA·연금저축(연금 수령·중도 인출) 네 칸에서 계산합니다.','누리200 1,000만 원을 5년 들면(기준 사례 비율) 일반계좌와 ISA의 세후 수익은 각각 얼마이고, 차이는 얼마일까요?','상품을 다섯 가지로 차례로 바꾸며 네 칸의 세후 수익이 가장 크게 벌어지는 상품과 거의 같은 상품을 찾아 그 까닭을 표의 세금 칸으로 설명해 보세요. 먼바다500을 고르면 ISA·연금 칸에 무엇이 뜨는지도 확인해 보세요.'],
 'final-order':['마지막 과제: 세 배분안의 세후 금액','배분안, 총급여 구간, 3년 뒤 꺼낼 금액, 연 가격 상승률을 바꾸며 X·Y·Z 세 배분안의 세후 금액을 계산하고, 고른 배분안의 몫마다 세금과 공제를 나누어 봅니다.','3년 동안 가격이 오르지 않고(연 0%) 분배금 연 2%만 받는다면, 16.5% 구간에서 세 배분안의 세후 금액은 각각 얼마일까요?','총급여 구간, 3년 뒤 꺼낼 금액, 가격 상승률을 하나씩만 바꾸며 세 배분안의 순위가 바뀌는 조건을 찾아 숫자와 함께 적어 보세요. 적을 것은 어느 배분안이 낫다는 결론이 아니라, 어떤 조건에서 순위가 바뀌는지입니다.']
};
const GUESS={'tax-map':'예: ○번, 합계 ○○,○○○원',stt:'예: ○○○,○○○원',withhold:'예: ○,○○○,○○○원',gains:'예: ○○○,○○○원, 누가 내는지',threshold:'예: ○,○○○만 원 쪽, ○○○,○○○원','etf-tax':'예: ○,○○○,○○○원 / ○,○○○,○○○원',
 isa:'예: 순이익 ○,○○○,○○○원, 세금 ○○,○○○원',pension:'예: 공제 ○○○,○○○원, 세금 ○○○,○○○원','after-tax':'예: 일반 ○,○○○,○○○원 / ISA ○,○○○,○○○원, 차이 ○○○,○○○원','final-order':'예: X ○,○○○,○○○원 · Y … · Z …'};
const pad=i=>String(i+1).padStart(2,'0');
/* 다음 장으로 가는 이유: 이 장을 마친 뒤 남는 질문. */
const NEXT_WHY={
 map:'네 사건 가운데 “판다”에서 빠진 거래세가 시장마다 같은지, 1년 동안 여러 번 팔면 얼마가 쌓이는지는 아직 계산하지 않았습니다.',
 trade:'팔지 않아도 배당과 분배금이 들어온 날 15.4%가 빠졌습니다. 그 15.4%가 어떻게 나뉘고 언제 그것으로 끝나는지 계산합니다.',
 dividend:'받을 때와 팔 때 빠지는 세금은 계산했지만, 새벽전자 차익 1,248,640원에 양도세가 붙지 않은 까닭은 아직 모릅니다. 차익에 세금을 내는 사람이 누구인지 가립니다.',
 gains:'이자·배당은 15.4%로 끝난다고 했지만, 한 해 합계가 2,000만 원을 넘으면 넘는 몫에 세금을 더 냅니다. 그 금액을 계산합니다.',
 threshold:'같은 거래소에서 산 누리200과 누리 해외100의 세후 수익이 왜 다른지는 아직 설명하지 않았습니다. ETF와 채권의 과세 방식을 가립니다.',
 etf:'누리 해외100은 차익에도 15.4%가 붙었습니다. 같은 투자를 ISA에 두면 그 세금이 얼마나 줄어드는지 계산합니다.',
 isa:'동료가 말한 두 번째 계좌인 연금저축은 넣을 때 세금을 돌려받는다고 합니다. 돌려받는 금액과 꺼낼 때 내는 세금을 계산합니다.',
 pension:'ISA와 연금저축을 따로 계산했습니다. 같은 상품을 세 계좌에 나란히 놓으면 어느 조건에서 차이가 커지는지 계산기로 견줍니다.',
 order:'계산기로 계좌 하나씩 견주었습니다. 1,000만 원을 여러 계좌에 나누면 세후 금액이 어떻게 되는지 세 배분안으로 계산합니다.'
};
/* 출처가 비어 있으면 조사 노트로 안내한다. */
function sourceLinks(ids){if(!ids.length)return '<p class="caption">이 장의 출처와 확인일은 <a href="docs/research.html">조사 노트</a>에 모아 두었습니다.</p>';return `<ul class="source-list">${ids.map(i=>`<li><a href="${B.sources[i][1]}" target="_blank" rel="noreferrer">${B.sources[i][0]}</a><br><span class="caption">${B.sources[i][2]}</span></li>`).join('')}</ul>`;}
function flow(items){return `<div class="flow">${items.map(x=>{const [a,b]=x.split('|');return `<div><b>${U.esc(a)}</b><span>${U.esc(b)}</span></div>`;}).join('')}</div>`;}
function side(){document.querySelector('#sidebar').innerHTML='<div class="sidebar-title">CONTENTS / 전체 목차</div><a href="#home">세금과 계좌에서 처음으로</a>'+B.chapters.map((c,i)=>`<a href="#${c.id}" data-chapter="${c.id}"><span>${pad(i)}</span>${c.title}</a>`).join('');}
const PATHS=[
 ['거래 내역의 세금 줄을 읽고 싶다면','배당 입금액과 매도 정산서에서 빠진 금액이 어떤 세금이고 누가 뗐는지 가립니다.',['map','trade','dividend']],
 ['차익과 한 해 합계의 세금을 알고 싶다면','차익에 세금이 붙는 사람과 2,000만 원 합계, ETF마다 다른 과세 방식을 차례로 계산합니다.',['gains','threshold','etf']],
 ['같은 투자를 어느 계좌에 두느냐로 세후 수익이 어떻게 바뀌는지 따지려면','ISA와 연금저축의 규칙을 하나씩 익힌 뒤 계산기에 나란히 놓고, 마지막 과제의 세 배분안을 계산합니다.',['isa','pension','order','final']]
];
function paths(){return `<div class="path-grid">${PATHS.map(([t,d,ids])=>`<div class="path"><h3>${t}</h3><p>${d}</p>${ids.map(id=>{const i=B.chapters.findIndex(c=>c.id===id);return `<a href="#${id}" aria-label="${pad(i)}장 ${U.esc(B.chapters[i].title)}">${pad(i)}</a>`;}).join('')}</div>`).join('')}</div>`;}
const SERIES='이 책은 시리즈 「금융과 투자 처음부터」의 11권입니다. 본문에 나오는 n권은 같은 시리즈의 다른 권이며, 지금은 1권 「돈의 시간 가치」, 3권 「금리와 채권」, 4권 「주문 한 장이 체결되기까지」, 8권 「가격은 어떻게 흔들리는가」, 12권 「격자 하나에서 손익이 갈리기까지」가 공개되어 있습니다.';
const GLOSSARY=[['원천징수','소득을 주는 쪽(증권사·은행)이 세금을 먼저 떼고 나머지만 주는 방식. 하린이 따로 신고하지 않아도 세금이 빠져 있다.'],['증권거래세','주식을 팔 때 매도 금액에 붙는 세금. 손익과 상관없이 붙는다. 코스피는 농어촌특별세가 함께 붙는다.'],['15.4%','이자·배당에서 떼는 소득세 14%와 지방소득세 1.4%(소득세의 10%)를 더한 비율.'],['분리과세','그 소득을 다른 소득과 합치지 않고 정한 세율로 따로 매겨 끝내는 방식.'],['종합과세','여러 소득을 한 해 동안 합쳐 누진세율로 매기는 방식. 금융소득은 한 해 2,000만 원을 넘는 몫이 합쳐진다.'],['한계세율','소득이 1원 늘 때 그 1원에 붙는 세율. 이 책의 실험에서는 가정으로 넣는다.'],['양도소득세','자산을 팔아 남긴 차익에 붙는 세금. 국내 상장주식은 대주주만, 해외 상장 자산은 누구나 낸다.'],['대주주','종목당 보유액이나 지분율이 기준을 넘는 주주. 이 책은 2026-10-13 보도 기준(50억 원 또는 코스피 1%·코스닥 2%)을 쓴다.'],['기본공제 250만 원','해외 상장 자산의 한 해 차익에서 세금을 매기기 전에 빼는 금액.'],['보유기간과세','그 밖의 국내 상장 ETF의 차익에 세금을 매기는 방식. 실제 매매차익과 보유 기간의 과세표준 기준가격 차이 가운데 적은 쪽을 과세한다고 안내되어 있다(기준가격 산정 방식은 확인 못함).'],['손익통산','같은 기간의 이익과 손실을 합쳐 남은 순이익에만 세금을 매기는 것. ISA는 계좌 안에서 손익을 합친다. 해외 상장 자산끼리의 손익통산은 이 책에서 확인 못한 가정이다.'],['분배금','ETF가 담은 자산에서 생긴 이자·배당을 투자자에게 나눠 주는 돈. 배당소득으로 과세된다.'],['ISA','개인종합자산관리계좌. 계좌 안 순이익의 일정 금액까지 세금을 매기지 않고 넘는 몫은 9.9%로 분리과세한다. 3년 의무 기간이 있다.'],['순이익','계좌 안에서 생긴 이익에서 손실을 뺀 값. ISA는 이 순이익에 비과세 한도를 적용한다.'],['세액공제','계산된 세금에서 바로 빼 주는 금액. 소득에서 빼는 소득공제와 다르다.'],['연금저축 · IRP','넣을 때 세액공제를 받고 55세 이후 연금으로 받을 때 연금소득세를 내는 계좌. IRP는 퇴직연금 계좌다.'],['연금소득세','연금계좌에서 연금으로 받을 때 내는 세금. 이 책은 5.5%(70세 미만, 보도 기준)를 쓴다.'],['기타소득세 16.5%','연금계좌에서 연금이 아닌 방식으로 중도에 꺼낼 때 공제받은 원금과 수익에 붙는 세금.'],['과세이연','세금을 없애지 않고 내는 때를 뒤로 미루는 것. 늦게 내는 세금의 오늘 가치는 할인으로 잰다.'],['세후 수익','세전 수익에서 그 투자에 붙은 세금을 빼고, 받은 세액공제를 더한 금액.']];
function sourcesSection(){
 return `<section class="section" id="sources"><h2>참고 자료와 실험의 경계</h2><p class="lead">증권거래세율, 원천징수 세율, 고배당 분리과세 구간, 대주주 기준, 해외 양도세 공제, ISA 비과세 한도, 연금 세액공제 한도와 공제율처럼 바깥에서 가져온 사실은 조사 노트에 확인일과 함께 적었습니다. 이 책의 세율과 한도는 모두 2026-10-13에 보도·은행·법무법인 안내로 확인한 값이고, 법령과 국세청 원문으로는 확인하지 못했습니다.</p><div class="note"><b>${U.RATE_NOTE}.</b> ${U.LAW_NOTE}<br>하린, 가상의 새벽전자 주식, 가상의 ETF 누리200·누리 해외100·먼바다500, 가상의 채권 나라 3년은 이 책을 위해 지어낸 것입니다. 이 책은 학습용이며 세무 상담이 아닙니다. 어느 계좌나 상품이 독자에게 맞는다고 말하지 않고, 결과 문장은 “이 가정에서는 세후 금액이 어떻게 되는가”만 말합니다. 모든 실험은 js/math.js의 식대로 브라우저에서 실제로 계산하고, 결과 끝의 꼬리표로 무엇 위에서 계산했는지 밝힙니다. “세율·한도는 2026-10-13 보도 기준”은 보도와 안내로 확인한 세율을 쓴 계산이고, “확인 못함 · 가정으로만 계산”은 보도로도 확인하지 못한 규칙(ISA 안 주식 매도의 거래세, 연금계좌의 공제받지 않은 원금 과세, 같은 해 해외 자산끼리 손익 합산, 연금저축에서 개별 주식 매수)을 가정으로 둔 것이며, “미리 정한 가상 시나리오”는 이 책이 정한 가격 상승 연 4%·분배 연 2% 같은 값입니다. 그림의 색은 돕는 표시일 뿐이며, 같은 내용을 글자와 기호(▲ 고른 칸, ✓ 합계에 들어감, ✗ 살 수 없음·오류, 실선·점선 이름표)로도 적었습니다. 출처와 단순화한 부분은 <a href="docs/research.html">조사 노트</a>에 있습니다.<br>${SERIES}</div>${B.sources.length?sourceLinks(B.sources.map((_,i)=>i)):''}<h3>처음 보는 용어 빠르게 찾기</h3><div class="glossary">${GLOSSARY.map(([t,d])=>`<p><b>${t}</b> ${d}</p>`).join('')}</div></section>`;
}
function home(){
 document.body.classList.remove('reading');document.title=BOOK_TITLE;
 const labs=B.chapters.flatMap(c=>c.labs).length;
 main.innerHTML=`<section class="hero"><div><div class="eyebrow">TAX, ACCOUNT, AFTER-TAX RETURN</div><h1>세금과 계좌<br><em>같은 수익, 다른 세후 수익</em></h1><p class="lead">하린은 3권에서 1,000만 원의 일부를 어디에 맡길지 금리로 따져 보았습니다. 이번에는 거래 내역을 열어 보니 배당 20만 원이 169,200원으로 들어와 있고, 새벽전자를 판 정산서에는 거래세 줄이 있습니다. 동료는 같은 ETF를 ISA나 연금저축에 두었다면 세금이 달랐을 것이라고 합니다. 이 책은 투자 한 건에서 세금이 빠지는 네 시점을 가리는 데서 시작해, 거래세·원천징수·양도세·종합과세와 ETF·채권의 과세 방식, ISA와 연금저축의 규칙을 차례로 계산합니다. 마지막에는 1,000만 원을 세 계좌에 나눈 세 가지 배분안의 세후 금액을 계산하고, 결과가 바뀌는 조건을 숫자로 적습니다.</p><p class="caption rate-note">${U.RATE_NOTE}. ${U.LAW_NOTE}</p><div class="hero-links"><a class="button primary" href="#map">01장부터 읽기</a><a class="button" href="#order">세후 수익 계산기</a></div><div class="stats"><span><b>${B.chapters.length}</b>장</span><span><b>${labs}</b>인터랙티브 실험</span><span>계좌 권유 없음</span></div><p class="caption">세금이 빠지는 때와 종류 → ETF·채권의 과세 방식 → 계좌마다 다른 세금 → 마지막 과제<br>모든 계산은 브라우저 안에서 하며, 회사·상품·인물은 모두 가상입니다.</p><p class="caption series-note">${SERIES}</p></div><div class="hero-lab" id="home-lab"></div></section>
 <section class="section"><div class="section-heading"><h2>같은 투자에 붙는 세금을 장마다 하나씩 계산합니다</h2><p>새벽전자, 누리200, 누리 해외100, 먼바다500, 나라 3년에 붙는 세금을 1~6장에서 종류별로 계산하고, 7~9장에서 같은 투자를 계좌마다 계산해 세후 수익을 비교합니다. 마지막 과제에서는 1,000만 원을 세 계좌에 나눈 세 배분안의 세후 금액을 계산합니다.</p></div>${flow(['세금이 빠지는 때와 종류|네 시점 · 거래세 · 원천징수 · 양도세 · 2,000만 원 (1~5장)','ETF·채권의 과세 방식|담은 자산과 상장된 곳 (6장)','계좌마다 다른 세금|ISA · 연금저축 · 세후 수익 계산기 (7~9장)','마지막 과제|세 배분안의 세후 금액 (10장)'])}</section>
 <section class="section" id="chapters"><div class="section-heading"><div class="eyebrow">EXPLORE THE BOOK</div><p>먼저 예측하고, 바꾸어 보고, 숫자와 그림으로 이유를 확인합니다.</p></div><h2>전체 장</h2><div class="chapter-grid">${B.chapters.map((c,i)=>`<a class="chapter-card" href="#${c.id}"><span class="num">CHAPTER ${pad(i)} / ${c.group}</span>${U.thumbnail(i)}<h3>${c.title}</h3><p>${c.desc}</p><span class="tag">실험 ${c.labs.length}개</span><span class="caption">약 ${c.time}</span></a>`).join('')}</div></section>
 <section class="section"><div class="section-heading"><h2>나에게 맞는 학습 경로</h2><p>처음 읽을 때는 순서대로, 다시 읽을 때는 질문 중심으로 돌아보세요.</p></div>${paths()}</section>
 ${sourcesSection()}`;
 cleanup=THome.mount(document.querySelector('#home-lab'));
}
function renderLab(id,index){const [title,desc,predict,task]=info[id];return `<article class="lab" id="lab-${id}"><div class="lab-heading"><span>EXPERIMENT ${pad(index)}</span><h3>${title}</h3></div><p class="lab-desc">${desc}</p><div class="predict"><b>먼저 예측하기</b>${predict}<label class="my-guess" for="guess-${id}"><span>내 예측 적어 두기</span><input id="guess-${id}" type="text" autocomplete="off" placeholder="${GUESS[id]||'짐작한 답을 짧게'}"></label></div><div class="lab-inner" data-lab="${id}"></div><div class="challenge"><b>직접 해 보기</b>${task}</div></article>`;}
function cross(c){if(!c.cross||!c.cross.length)return '';return `<h3>다른 책으로 이어 읽기</h3><ul class="source-list">${c.cross.map(([name,url,why])=>`<li><a href="${url}">${name}</a><p>${why}</p></li>`).join('')}</ul>`;}
function figure(c,index){
 const art=window.TFigures?.render(c.id),caption=art?art.caption:`${c.subtitle}`;
 return `<figure class="concept-diagram">${art?`<div class="figure-art" tabindex="0" role="group" aria-label="그림 ${index+1}-1. 좁은 화면에서는 방향키로 옆으로 밀어 볼 수 있습니다">${art.svg}</div>`:''}${flow(c.flow)}<figcaption class="caption">그림 ${index+1}-1. ${caption} 아래 상자는 같은 흐름을 글로 적은 것입니다.</figcaption></figure>`;
}
/* 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 돌려 정답 자리가 장마다 1·2·3번에 고르게 오게 한다. data-* 값은 원래 번호다. */
function choices(q,target,attr){return U.choiceOrder(q[1].length,q[2],target).map((i,k)=>`<button type="button" data-${attr}="${i}">${k+1}. ${q[1][i]}</button>`).join('');}
function transferQuiz(c,index){if(!c.transfer)return '';return `<div class="transfer-quiz"><div class="eyebrow">TRY IT ELSEWHERE</div><h3>다른 상황에 써 보기</h3><p>${c.transfer[0]}</p>${choices(c.transfer,(index+1)%3,'transfer')}<div class="transfer-feedback" role="status" aria-live="polite"></div></div>`;}
function navLinks(index){
 const prev=index?`<a href="#${B.chapters[index-1].id}">이전 · ${B.chapters[index-1].title}</a>`:'<a href="#home">이전 · 표지</a>';
 const next=index<B.chapters.length-1?`<a href="#${B.chapters[index+1].id}">다음 · ${B.chapters[index+1].title}<small>이동 이유: ${NEXT_WHY[B.chapters[index].id]}</small></a>`:'<a href="../grid/#cell">다른 책 · 격자 하나에서 손익이 갈리기까지 · 격자 한 칸의 손익과 최소 간격<small>이동 이유: 이 책은 한 번 사고 3년 동안 들고 있는 투자에 붙는 세금을 계산했습니다. 시리즈 12권은 같은 종목을 정한 가격 간격마다 여러 번 사고파는 매매를 다루므로, 2장에서 매도 횟수만큼 쌓인 거래세가 격자 한 칸이 한 번 왕복할 때 남는 금액을 얼마나 깎는지 그 장의 계산으로 확인할 수 있습니다.</small></a>';
 return `<nav class="chapter-nav" aria-label="이전·다음 장">${prev}${next}</nav>`;
}
function chapter(c,index){
 document.body.classList.add('reading');document.title=`${pad(index)}. ${c.title} · 세금과 계좌`;
 main.innerHTML=`<div class="chapter-body"><div class="chapter-head"><div class="eyebrow">CHAPTER ${pad(index)} / ${c.group}</div><h1>${c.title}</h1><p class="lead subtitle">${c.subtitle}</p><span class="tag">${c.labs.length}개 실험</span><span class="caption">약 ${c.time} · 확인 문제 ${c.transfer?2:1}개</span></div><div class="recall"><b>${index?'앞 장 떠올리기':'먼저 떠올리기'}</b>${c.recall}</div><section><h2>먼저 개념 잡기</h2>${c.paragraphs.map(p=>`<p>${p}</p>`).join('')}${figure(c,index)}<div class="formula"><code>${c.formula}</code><p>${c.formulaNote}</p></div>${(c.details||[]).map(([title,body])=>`<div class="deep-reading"><h3>${title}</h3>${body}</div>`).join('')}</section>${c.labs.map(renderLab).join('')}<div class="note"><strong>혼동하지 마세요</strong><br>${c.warning}</div><section class="quiz"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h2>${c.quiz[0]}</h2>${choices(c.quiz,index%3,'answer')}<div class="quiz-feedback" role="status" aria-live="polite"></div>${transferQuiz(c,index)}</section><section><h2>더 읽어 보기</h2>${sourceLinks(c.source||[])}${cross(c)}</section>${navLinks(index)}</div>`;
 c.labs.forEach(id=>{const el=main.querySelector(`[data-lab="${id}"]`);TLabs[id](el);TGuides.mount(id,el);});
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
