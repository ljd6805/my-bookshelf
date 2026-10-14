/* 행동재무학 계산. DOM을 만지지 않으며 tests/math.test.cjs가 대표값·경계값·불변 조건을 검사한다.
   「금융과 투자 처음부터」 10권 「행동재무학 · 매매 기록에서 손실 회피와 과신의 흔적을 세고 규칙을 시험하기」의 계산 원본이다.
   책 사이 코드 의존을 두지 않는다(확률과 통계의 이항분포, 9권의 켈리, 12권의 장부가 있어도 여기서 새로 쓴다).
   단위와 표기:
   - 확률·비율은 소수다(0.109 = 10.9%). 화면에서 %로 바꾸고 소수 첫째 자리로 쓴다. PGR·PLR은 소수 셋째 자리.
   - 일지의 금액은 원(정수)이다. 수수료·거래세는 정수 연산으로 원 단위 버림한다(수수료 = 금액 × 15 ÷ 100,000의 몫,
     거래세 = 금액 × 2 ÷ 1,000의 몫). 소수 곱셈으로 버리면 600만 원 × 0.00015 = 899.999…처럼 1원이 어긋난다.
   - 1장·2장의 금액은 만 원이다. 가치 함수는 단위에 따라 값이 달라지므로 화면마다 단위를 적는다.
   - 반올림은 5에서 올림(round). 부동소수 오차는 1e-9만큼 밀어서 막는다.
   - 선우의 26주 일지(JOURNAL)는 이 파일 한 곳에만 있는 미리 정한 가상 시나리오다(research V-0). 본문의 사례 숫자는 모두 여기서 나온다.
     일지 숫자를 고치면 V-0~V-10의 기준값을 같은 커밋에서 다시 계산한다.
   - 시점에 묶인 실제 숫자(⏱)는 둘뿐이고 MARKET 한 곳에만 둔다(증권거래세 0.20%, 수수료 0.015%). 연구 결과의 숫자는 등급과 함께 FACTS에 둔다.
   - 실제 계산(기대값·전망 가치·PGR/PLR·베이즈·우도비·적중률과 이항 확률·회전율 비용·정보 폭포 확률·손실 확률·규칙 대입 손익)과
     미리 정한 가정(JOURNAL·ASSUME)을 구분한다. 어느 결과도 규칙·종목·매매 시점을 권하지 않는다. */
(function(root){
'use strict';
const CHECKED='2026-10-14';

/* 선우의 26주 매매 일지(미리 정한 가상 시나리오, research V-0). 가격은 그 주 마지막 거래일의 종가이며 모든 매매는 그 종가에 체결된다. */
const JOURNAL={
 label:'미리 정한 가상 시나리오 · 선우는 가상 인물',
 person:'선우',start:20000000,weeks:26,
 names:['새벽전자','온결식품','가람200','누리 해외100'],
 etf:['가람200','누리 해외100'],
 prices:{
  '새벽전자':[20000,20600,21300,22100,22600,23000,22400,22800,22500,21500,20800,20200,19600,19000,18300,17600,17200,17500,17800,18100,18400,18200,18600,18900,19100,19300],
  '온결식품':[30000,29600,29100,28700,28200,27900,27300,26900,26600,26300,25800,25500,25100,24700,24500,24300,24600,24800,24500,24200,24400,24700,24900,25100,25000,25200],
  '가람200':[35000,35300,35500,35900,36200,36000,36400,36700,36300,36000,35700,36100,36500,36900,37200,37000,37400,37800,37500,37900,38200,38000,38300,38600,38400,38800],
  '누리 해외100':[12000,12100,12150,12250,12300,12400,12450,12550,12600,12700,12650,12800,12900,12850,12950,13000,12900,13050,13100,13000,12950,13050,13150,13100,13200,13250]
 },
 /* 거래 15건. range는 매수 때 적은 4주 뒤 90% 예상 범위(원), counter는 반대 증거를 적었는지, others는 남의 행동을 이유로 썼는지. */
 trades:[
  {n:1,week:1,side:'B',name:'새벽전자',qty:300,reason:'2분기 실적이 좋아질 것이라는 기사',range:[19000,23000],counter:false,others:false},
  {n:2,week:1,side:'B',name:'온결식품',qty:150,reason:'배당이 꾸준한 회사',range:[28500,32000],counter:false,others:false},
  {n:3,week:3,side:'B',name:'가람200',qty:100,reason:'시장 전체를 사 두기',range:[34500,37000],counter:true,others:false},
  {n:4,week:5,side:'S',name:'새벽전자',qty:300,reason:'+13% 올랐으니 이익을 지키자'},
  {n:5,week:6,side:'B',name:'누리 해외100',qty:300,reason:'해외 지수 분산',range:[12000,12900],counter:true,others:false},
  {n:6,week:8,side:'B',name:'온결식품',qty:100,reason:'싸졌으니 더 산다(평균 단가 낮추기)',range:[26500,29500],counter:false,others:false},
  {n:7,week:9,side:'S',name:'가람200',qty:100,reason:'+2% 났으니 판다'},
  {n:8,week:10,side:'B',name:'새벽전자',qty:250,reason:'신제품 영상의 ‘두 배 오를 종목’ 추천과 ‘다들 샀다’는 댓글',range:[21500,24500],counter:false,others:true},
  {n:9,week:13,side:'S',name:'누리 해외100',qty:300,reason:'+4% 이익 실현'},
  {n:10,week:14,side:'B',name:'가람200',qty:100,reason:'다시 담기',range:[36000,38500],counter:true,others:false},
  {n:11,week:15,side:'B',name:'새벽전자',qty:150,reason:'더 싸졌으니 평균 단가 낮추기',range:[17500,20000],counter:false,others:false},
  {n:12,week:18,side:'S',name:'가람200',qty:100,reason:'+2% 이익 실현'},
  {n:13,week:20,side:'S',name:'온결식품',qty:250,reason:'더는 못 버티겠다'},
  {n:14,week:21,side:'B',name:'누리 해외100',qty:300,reason:'다시 담기',range:[12600,13500],counter:true,others:false},
  {n:15,week:24,side:'S',name:'누리 해외100',qty:300,reason:'+1% 이익 실현'}
 ],
 /* 처음에 적은 규칙 셋(이 책이 계산 연습에 쓰는 규칙의 예, 권하는 규칙이 아님). */
 rules:{
  R1:{limit:0.10,text:'매매하기 전 그 주 종가가 평균 단가보다 10% 이상 낮으면 그 주 종가에 판다'},
  R2:{limit:0.35,text:'한 종목의 평가액은 계좌 평가액의 35% 이하로 둔다'},
  R3:{text:'매수 기록마다 반대 증거를 하나 이상 적는다'}
 },
 /* 일지 앞면 메모 넷(본문 사례의 출처). 금액은 만 원. 1장의 독자 선택은 저장하지 않으며 여기에는 선우의 답만 있다. */
 memo:{
  frame:{start:1000,sure:200,p:1/3,amount:600,gain:'sure',loss:'risky'},
  prospect:{gain:200,loss:100,p:0.5},
  confirm:{prior:0.5,evidence:[
   {name:'신제품 발표 기사',lr:2,side:'for'},{name:'업종 수출 증가 기사',lr:1.5,side:'for'},{name:'증권사 목표가 상향',lr:1.5,side:'for'},
   {name:'재고 증가 공시',lr:0.5,side:'against'},{name:'경쟁사 가격 인하',lr:0.4,side:'against'}]},
  herd:{trade:8}
 }
};

/* 미리 정한 가정(가상 시나리오). */
const ASSUME={
 journal:JOURNAL,
 prospect:{alpha:0.88,beta:0.88,lambda:2.25,gamma:0.61,delta:0.69},   // Tversky·Kahneman(1992) 실험 참가자 중앙값(한 연구의 값)
 weightTable:[0.01,0.05,0.1,0.5,0.9,0.99],                             // 2.3절 확률 가중 표
 ceExample:{amount:1000,ps:[0.01,0.99]},                                // 2.3절 확실성 등가(만 원)
 baserate:{base:0.02,hit:0.6,falseAlarm:0.1,n:1000},                   // 4장 “두 배 오를 종목” 비율과 추천 적중·오경보(가정 · 실제 비율 아님)
 cost:{turnovers:[0.75,3,12],gross:0.06,years:10,start:2000},           // 6장 연 회전율 75·300·1,200%, 비용 전 연 6%(가정), 10년, 2,000만 원
 cascade:{ps:[0.6,0.7,0.8],people:10},                                  // 7장 신호 정확도, 열 사람
 outcome:{p:0.55,ns:[20,50,100,250]},                                   // 8장 승률 55%, ±1
 interval:0.9,                                                          // 6장 90% 예상 범위
 horizon:4,                                                             // 매수 4주 뒤 가격으로 범위를 채점
 /* 9장 반등 경로(가정): 10~14주는 일지의 새벽전자 종가와 같고 15주부터 반등한다. 250주를 10주 종가에 산다. */
 rebound:{label:'반등 경로(가정)',name:'새벽전자',qty:250,firstWeek:10,prices:[21500,20800,20200,19600,19000,19800,21000,22200,23000]}
};

/* 시점에 묶인 실제 값(⏱)은 이 둘뿐이다. 바뀌면 같은 커밋에서 이 표, 화면 꼬리표, 6장과 마지막 과제의 재확인 문장을 함께 고친다. */
const MARKET={
 tradeTax:{value:0.002,num:2,den:1000,timeSensitive:true,checked:'2026-10-14',sourceChecked:['2026-10-12','2026-10-13'],grade:'보도 · 서재 안 재인용',source:'S32',
  label:'보도 기준 · 4권·11권 서재 안 재인용 · 법령 원문 확인 못함',note:'코스피·코스닥 주식 매도 금액의 0.20%(코스피는 농어촌특별세 포함). ETF 매도는 면제. 4권(확인 2026-10-12)·11권(확인 2026-10-13)의 확인값'},
 fee:{value:0.00015,num:15,den:100000,timeSensitive:true,checked:'2026-10-14',grade:'가정',source:'S32',
  label:'가정',note:'살 때·팔 때 0.015%. 12권·4권과 같은 가정이며 증권사 원문은 확인하지 못함'},
 recheck:'세율과 수수료는 바뀌므로 확인일을 보고 다시 확인하세요',
 owners:{G3:'은재',G6:'정민',G7:'한결',fixed:'한결(담당)·은재(확인 작업)'},
 nextRecheck:'2027-04-14'
};

/* 연구 결과의 숫자(시점에 묶이지 않음). 등급을 화면에 함께 적는다. */
const FACTS={
 framing:{sure:[0.72,0.22],people:[152,155],year:1981,grade:'학술 원문'},
 tk1992:{alpha:0.88,lambda:2.25,gamma:0.61,delta:0.69,participants:25,year:1992,grade:'학술 원문'},   // 식·모수는 research S25·S26으로 대조(은재 G3)
 klein:{samples:36,people:6271,d:{original:1.13,replication:0.6},year:2014,grade:'학술 원문'},   // Many Labs 1의 1981년 틀 효과 재현(research 1-3, S24)
 brown:{mean:1.955,ci:[1.82,2.102],estimates:607,papers:150,years:[1992,2017],year:2024,grade:'학술 초록'},
 ruggeri:{countries:19,people:4098,share:0.94,year:2020,grade:'학술 초록'},
 odean:{accounts:10000,years:[1987,1993],pgr:0.148,plr:0.098,dec:{pgr:0.108,plr:0.128},nextYear:0.034,year:1998,grade:'학술 원문'},
 tk1974:{engineers:70,lawyers:30,year:1974,grade:'학술 원문'},
 haran:{hit:0.7379,year:2010,grade:'학술 원문'},
 barber:{households:66465,years:[1991,1996],average:0.164,most:0.114,market:0.179,turnover:0.75,year:2000,grade:'학술 원문'},
 glaser:{survey:3000,traders:215,year:2007,grade:'학술 초록'},
 baron:{studies:5,year:1988,grade:'학술 원문'},
 fischhoff:{year:1975,grade:'2차 자료'},
 gollwitzer:{d:0.65,tests:94,year:2006,grade:'학술 초록'},
 statLib:{signal:{base:0.03,hit:0.8,falseAlarm:0.1},grade:'서재 안 재인용'}   // 5권 7장 위험 신호(L1에서 다시 계산)
};

/* 화면에 그대로 쓰는 고정 문장. */
const TEXT={
 disclaimer:'가상의 인물과 기록으로 만든 계산 연습이며, 어떤 규칙도 권하지 않습니다. 규칙이 손실을 줄이는지는 한 경로로 알 수 없습니다',
 frameNote:'새로고침하면 선택이 사라진다',
 cascadeNote:'가정을 단순하게 둔 모형의 계산이며 실제 시장의 거품을 설명하거나 예측하지 않음',
 paramNote:'한 연구의 중앙값(Tversky·Kahneman 1992)이며 사람마다·연구마다 다름',
 ifThen:'목표 달성 일반에 관한 메타분석이며 투자 맥락에서 검증된 것이 아님'
};

function need(cond,msg){if(!cond)throw new RangeError(msg);}
function num(x,name){need(typeof x==='number'&&Number.isFinite(x),name+' must be a finite number');}
function prob(p,name){num(p,name);need(p>=0&&p<=1,name+' must be between 0 and 1');}
const round=(x,d)=>{const f=Math.pow(10,d);return Math.round(x*f+(x>=0?1e-9:-1e-9))/f;};
const pct=(x,d=1)=>round(x*100,d);
const sum=a=>a.reduce((s,x)=>s+x,0);
const idiv=(a,b)=>(a-a%b)/b;   // 음이 아닌 정수의 몫(정수 연산)
/* 원 금액을 “44만 4,934원”처럼 적는다(화면용). */
function wonText(won){num(won,'amount');const w=Math.round(Math.abs(won)),man=Math.floor(w/1e4),rest=w%1e4,sign=won<0?'−':'';
 return sign+(man?man.toLocaleString('en-US')+'만'+(rest?' ':''):'')+(rest||!man?rest.toLocaleString('en-US'):'')+'원';}

/* ── 비용 ── 정수 연산으로 원 단위 버림. ETF 매도는 거래세가 없다. */
function fee(amount){need(Number.isInteger(amount)&&amount>=0,'amount must be a whole number of won');return idiv(amount*MARKET.fee.num,MARKET.fee.den);}
function tax(amount,name){need(Number.isInteger(amount)&&amount>=0,'amount must be a whole number of won');return JOURNAL.etf.includes(name)?0:idiv(amount*MARKET.tradeTax.num,MARKET.tradeTax.den);}
const roundTrip=(etf=false)=>2*MARKET.fee.value+(etf?0:MARKET.tradeTax.value);

/* ── 1장 ── 기대값과 끝 금액. outcomes = [[확률, 금액], …]. */
function ev(outcomes){need(Array.isArray(outcomes)&&outcomes.length>0,'need outcomes');outcomes.forEach(([p,x])=>{prob(p,'p');num(x,'amount');});
 need(Math.abs(sum(outcomes.map(o=>o[0]))-1)<1e-9,'probabilities must add up to 1');return round(sum(outcomes.map(([p,x])=>p*x)),9);}
/* 같은 선택지 두 틀: 이익 틀(시작 start에서 A 확실히 +sure / B 확률 p로 +amount)과, amount를 이미 받았다고 친 손실 틀(C 확실히 sure − amount / D 확률 p로 0, 나머지 −amount). */
function frames(start,sure,p,amount){
 num(start,'start');num(sure,'sure');prob(p,'p');num(amount,'amount');need(p>0&&p<1,'the risky option needs 0 < p < 1');
 const s2=start+amount,A=ev([[1,sure]]),B=ev([[p,amount],[1-p,0]]),C=ev([[1,sure-amount]]),D=ev([[p,0],[1-p,-amount]]);
 return {gain:{start,A:{ev:A,ends:[[1,start+sure]]},B:{ev:B,ends:[[p,start+amount],[1-p,start]]}},
  loss:{start:s2,C:{ev:C,ends:[[1,s2+sure-amount]]},D:{ev:D,ends:[[p,s2],[1-p,s2-amount]]}},
  sameEV:Math.abs(A-B)<1e-9&&Math.abs(C-D)<1e-9,endEV:round(start+A,9)};
}
/* 두 틀에서 고른 쪽(sure/risky)이 같은지만 말한다. 점수나 판정을 붙이지 않고, 아무것도 저장하지 않는다. */
function sameOrDiff(gainPick,lossPick){for(const k of [gainPick,lossPick])need(k==='sure'||k==='risky','pick must be sure or risky');return gainPick===lossPick?'같음':'다름';}

/* ── 2장 ── 가치 함수 v(x) = x^α(이익), −λ(−x)^β(손실). 확률 가중 w(p) = pᵞ ÷ (pᵞ + (1 − p)ᵞ)^(1/γ). 단위 만 원. */
function params(o){const q=Object.assign({},ASSUME.prospect,o||{});for(const k of ['alpha','beta','lambda'])num(q[k],k);need(q.alpha>0&&q.beta>0&&q.lambda>0,'α, β and λ must be > 0');return q;}
function value(x,o){num(x,'x');const q=params(o);return x>=0?Math.pow(x,q.alpha):-q.lambda*Math.pow(-x,q.beta);}
function weight(p,g){prob(p,'p');num(g,'γ');need(g>0.2&&g<=1,'γ must be between 0.2 and 1');if(p===0||p===1)return p;const a=Math.pow(p,g),b=Math.pow(1-p,g);return a/Math.pow(a+b,1/g);}
/* 두 갈래 혼합 내기: 확률 p로 +gain, 1 − p로 −loss. weighting이 켜지면 이익에 γ, 손실에 δ의 가중을 쓴다. */
function prospect(gain,loss,o={}){
 num(gain,'gain');num(loss,'loss');need(gain>=0&&loss>=0,'gain and loss are sizes ≥ 0');const q=params(o),p=o.p==null?0.5:o.p;prob(p,'p');
 const wg=o.weighting?weight(p,q.gamma):p,wl=o.weighting?weight(1-p,q.delta):1-p,vg=value(gain,q),vl=value(-loss,q);
 return {vg,vl,wg,wl,value:wg*vg+wl*vl,ev:p*gain-(1-p)*loss,accept:wg*vg+wl*vl>0};
}
/* 받아들이는 최소 이익: 전망 가치가 0이 되는 gain. */
function threshold(loss,o={}){num(loss,'loss');need(loss>0,'loss must be > 0');const q=params(o),p=o.p==null?0.5:o.p;need(p>0&&p<1,'need 0 < p < 1');
 const wg=o.weighting?weight(p,q.gamma):p,wl=o.weighting?weight(1-p,q.delta):1-p;return Math.pow(q.lambda*wl*Math.pow(loss,q.beta)/wg,1/q.alpha);}
/* 확률 p로 x(만 원)를 받거나 잃는 한 갈래 내기의 확실성 등가(가중을 켠 값). */
function certainty(p,x,o={}){prob(p,'p');num(x,'x');const q=params(o);
 return x>=0?Math.pow(weight(p,q.gamma),1/q.alpha)*x:-Math.pow(weight(p,q.delta),1/q.beta)*(-x);}
function weightTable(ps=ASSUME.weightTable,o={}){const q=params(o);return ps.map(p=>({p,gain:weight(p,q.gamma),loss:weight(p,q.delta)}));}

/* ── 장부 ── 26주를 주마다 돌린다. opts.r1 = 손실 한도(0.10)면 매매 전 종가로 R1을 확인해 걸린 보유를 그 주 종가에 모두 팔고,
   그 종목의 이후 일지 매매(다시 사기, 이미 판 주식 팔기)를 따르지 않는다(물타기를 하지 않음). path를 주면 일지 대신 그 거래를 쓴다. */
function sellAll(state,name,price,week,byRule){
 const h=state.hold[name],amount=price*h.qty,f=fee(amount),x=tax(amount,name),pnl=amount-f-x-h.cost;
 state.cash+=amount-f-x;state.fees+=f;state.taxes+=x;state.sells+=amount;
 state.realized.push({week,name,qty:h.qty,price,pnl,held:week-h.since,avg:h.cost/h.qty,byRule:!!byRule});delete state.hold[name];
}
function saleDay(state,name,week){
 const c={week,name,RG:0,RL:0,PG:0,PL:0};
 for(const [n,h] of Object.entries(state.hold)){const px=JOURNAL.prices[n][week-1]*h.qty;if(px===h.cost)continue;const up=px>h.cost;
  if(n===name)c[up?'RG':'RL']++;else c[up?'PG':'PL']++;}
 return c;
}
function ledger(opts={}){
 const trades=opts.trades||JOURNAL.trades,r1=opts.r1==null?null:opts.r1;if(r1!=null){num(r1,'R1 limit');need(r1>0&&r1<1,'R1 limit must be between 0 and 1');}
 const state={cash:JOURNAL.start,hold:{},fees:0,taxes:0,sells:0,realized:[]},blocked=new Set(),days=[],weeks=[],ruleSales=[];
 for(let wk=1;wk<=JOURNAL.weeks;wk++){
  const pre=r1==null?[]:Object.entries(state.hold).map(([n,h])=>({name:n,drop:JOURNAL.prices[n][wk-1]*h.qty/h.cost-1,avg:h.cost/h.qty})).filter(x=>x.drop<=-r1+1e-12);
  for(const x of pre){sellAll(state,x.name,JOURNAL.prices[x.name][wk-1],wk,true);blocked.add(x.name);ruleSales.push(Object.assign({week:wk},x));}
  for(const t of trades.filter(t=>t.week===wk)){
   if(blocked.has(t.name))continue;const px=JOURNAL.prices[t.name][wk-1],amount=px*t.qty;
   if(t.side==='B'){const f=fee(amount);state.cash-=amount+f;state.fees+=f;const h=state.hold[t.name]||(state.hold[t.name]={qty:0,cost:0,since:wk});h.qty+=t.qty;h.cost+=amount+f;}
   else{need(state.hold[t.name]&&state.hold[t.name].qty===t.qty,'the journal sells whole holdings only');days.push(saleDay(state,t.name,wk));sellAll(state,t.name,px,wk,false);}
  }
  const value=sum(Object.entries(state.hold).map(([n,h])=>JOURNAL.prices[n][wk-1]*h.qty)),equity=state.cash+value;
  weeks.push({week:wk,cash:state.cash,equity,shares:Object.fromEntries(Object.entries(state.hold).map(([n,h])=>[n,JOURNAL.prices[n][wk-1]*h.qty/equity])),
   hold:Object.fromEntries(Object.entries(state.hold).map(([n,h])=>[n,{qty:h.qty,cost:h.cost,since:h.since}]))});
 }
 const last=JOURNAL.weeks-1,unreal=Object.fromEntries(Object.entries(state.hold).map(([n,h])=>[n,JOURNAL.prices[n][last]*h.qty-h.cost])),pnl={};
 for(const r of state.realized)pnl[r.name]=(pnl[r.name]||0)+r.pnl;for(const [n,u] of Object.entries(unreal))pnl[n]=(pnl[n]||0)+u;
 return {end:weeks[last].equity,cash:state.cash,hold:state.hold,fees:state.fees,taxes:state.taxes,cost:state.fees+state.taxes,sells:state.sells,
  realized:state.realized,unreal,pnl,days,weeks,ruleSales,r1};
}

/* ── 3장 ── PGR = RG ÷ (RG + PG), PLR = RL ÷ (RL + PL). 분모가 0이면 null(“계산할 수 없음”). */
function pgrPlr(c){for(const k of ['RG','PG','RL','PL']){num(c[k],k);need(Number.isInteger(c[k])&&c[k]>=0,k+' must be a whole number ≥ 0');}
 const pgr=c.RG+c.PG?c.RG/(c.RG+c.PG):null,plr=c.RL+c.PL?c.RL/(c.RL+c.PL):null;return {RG:c.RG,PG:c.PG,RL:c.RL,PL:c.PL,pgr,plr,gap:pgr==null||plr==null?null:pgr-plr};}
/* 일지의 매도한 날을 from~to주에서 모아 센다. */
function disposition(from=1,to=13,L=ledger()){need(Number.isInteger(from)&&Number.isInteger(to)&&from>=1&&to<=JOURNAL.weeks&&from<=to,'weeks must be 1–26 in order');
 const days=L.days.filter(d=>d.week>=from&&d.week<=to),c={RG:0,PG:0,RL:0,PL:0};for(const d of days)for(const k in c)c[k]+=d[k];return Object.assign(pgrPlr(c),{days});}
/* 판 보유의 기간(주): 이익 난 매도와 손실 난 매도를 나눈다. */
function holding(L=ledger()){const g=L.realized.filter(r=>r.pnl>0).map(r=>r.held),l=L.realized.filter(r=>r.pnl<0).map(r=>r.held);
 return {gains:g,losses:l,avgGain:g.length?sum(g)/g.length:null,avgLoss:l.length?sum(l)/l.length:null};}

/* ── 4장 ── 베이즈: P(두 배 | 추천) = 기저율 × 적중률 ÷ (기저율 × 적중률 + (1 − 기저율) × 오경보율). n종목 격자로도 센다. */
function bayes(base,hit,falseAlarm,n=ASSUME.baserate.n){prob(base,'base rate');prob(hit,'hit rate');prob(falseAlarm,'false alarm rate');need(Number.isInteger(n)&&n>0,'n must be a whole number');
 const tp=base*hit,fp=(1-base)*falseAlarm,flagged=tp+fp;
 return {posterior:flagged>0?tp/flagged:null,lr:falseAlarm>0?hit/falseAlarm:null,grid:{n,doubles:round(n*base,6),hits:round(n*tp,6),falseHits:round(n*fp,6),flagged:round(n*flagged,6)}};}

/* ── 5장 ── 오즈 = p ÷ (1 − p), 사후 오즈 = 사전 오즈 × 우도비들의 곱(증거가 서로 독립이라는 가정). */
const odds=p=>{prob(p,'p');need(p<1,'p must be < 1');return p/(1-p);};
const fromOdds=o=>{num(o,'odds');need(o>=0,'odds must be ≥ 0');return o/(1+o);};
function oddsUpdate(prior,lrs){const o0=odds(prior);lrs.forEach(l=>{num(l,'likelihood ratio');need(l>0,'likelihood ratio must be > 0');});const o=o0*lrs.reduce((a,b)=>a*b,1);return {prior,priorOdds:o0,odds:o,p:fromOdds(o)};}
function evidence(memo=JOURNAL.memo.confirm,on){const ev=memo.evidence.filter((e,i)=>on?on[i]:true);
 return {all:oddsUpdate(memo.prior,ev.map(e=>e.lr)),supportOnly:oddsUpdate(memo.prior,ev.filter(e=>e.side==='for').map(e=>e.lr))};}

/* ── 6장 ── 예상 범위의 적중(매수 4주 뒤 종가가 범위 안인지)과 이항 확률, 회전율과 비용. */
function binomPmf(n,p){need(Number.isInteger(n)&&n>=0&&n<=5000,'n must be a whole number 0–5000');prob(p,'p');
 if(p===0||p===1)return Array.from({length:n+1},(_,k)=>(p===1?k===n:k===0)?1:0);
 const out=[];let lp=n*Math.log(1-p);out.push(Math.exp(lp));for(let k=1;k<=n;k++){lp+=Math.log((n-k+1)/k)+Math.log(p/(1-p));out.push(Math.exp(lp));}return out;}
function binomCdf(k,n,p){need(Number.isInteger(k),'k must be a whole number');return Math.min(1,sum(binomPmf(n,p).slice(0,Math.max(0,k+1))));}
function intervals(trades=JOURNAL.trades,h=ASSUME.horizon){
 const rows=trades.filter(t=>t.side==='B'&&t.range).map(t=>{const w=t.week+h;need(w<=JOURNAL.weeks,'the horizon runs past week 26');const price=JOURNAL.prices[t.name][w-1];
  return {n:t.n,week:t.week,name:t.name,range:t.range,price,hit:price>=t.range[0]&&price<=t.range[1]};});
 const hits=rows.filter(r=>r.hit).length;return {rows,hits,n:rows.length,rate:hits/rows.length,pAtMost:binomCdf(hits,rows.length,ASSUME.interval),expected:rows.length*ASSUME.interval};
}
function turnover(L=ledger()){const avg=sum(L.weeks.map(w=>w.equity))/L.weeks.length,half=L.sells/avg;return {sells:L.sells,avgEquity:avg,half,annual:half*52/JOURNAL.weeks,cost:L.cost,fees:L.fees,taxes:L.taxes};}
/* 연 비용(계좌의 %p) = 연 회전율 × 왕복 비용률. 한 해 매도 금액의 비용 = 금액 × 왕복 비용률(사고판 금액이 같다고 놓음). */
const costDrag=(annualTurnover,etf=false)=>{num(annualTurnover,'turnover');need(annualTurnover>=0,'turnover must be ≥ 0');return annualTurnover*roundTrip(etf);};
const tradeCost=(sold,etf=false)=>{num(sold,'amount');need(sold>=0,'amount must be ≥ 0');return round(sold*roundTrip(etf),6);};
function growthAfter(start,gross,drag,years){num(start,'start');num(gross,'gross return');num(drag,'drag');need(Number.isInteger(years)&&years>=0,'years must be a whole number');return start*Math.pow(1+gross-drag,years);}

/* ── 7장 ── 정보 폭포(S15 모형: 사전 반반, 정확도 p인 신호 하나, 앞사람들의 행동만 보임, 무관심하면 동전으로 고름). 가정을 단순하게 둔 모형. */
function cascadeOdds(p){prob(p,'p');need(p>=0.5&&p<1,'signal accuracy must be 0.5 ≤ p < 1');const d=2*(p*p-p+1);return {right:p*(1+p)/d,wrong:(2-p)*(1-p)/d};}
const noCascade=(p,n)=>{prob(p,'p');need(Number.isInteger(n)&&n>=0&&n%2===0,'n must be an even whole number');return Math.pow(p*(1-p),n/2);};
/* 첫째는 자기 신호대로 사고, 둘째는 신호가 좋으면 사고 나쁘면 반반으로 고른다. 두 사람이 다 샀고 셋째의 신호가 나쁠 때 “좋은 종목”일 확률. */
function thirdPerson(p){prob(p,'p');need(p>0&&p<1,'need 0 < p < 1');
 const joint=good=>{const q=good?p:1-p;return q*(q*1+(1-q)*0.5);};   // P(상태, 첫째 삼, 둘째 삼)
 const g=joint(true)*(1-p),b=joint(false)*p;return g/(g+b);}
/* 차례로 고르는 줄. signals[i] = true(좋음)/false(나쁨). coin(i)는 무관심할 때의 동전(사면 true). 공개한 행동만 보인다. */
function cascadeRun(signals,coin=()=>Math.random()<0.5){
 need(Array.isArray(signals)&&signals.length>0&&signals.length<=60,'need 1–60 signals');let d=0,start=null,dir=null;const acts=[];
 signals.forEach((s,i)=>{
  if(start===null&&Math.abs(d)>=2){start=i;dir=d>0;}
  if(start!==null){acts.push({buy:dir,cascade:true,tie:false});return;}
  const e=d+(s?1:-1),tie=e===0,buy=tie?!!coin(i):e>0;acts.push({buy,cascade:false,tie});d+=buy?1:-1;
 });
 return {acts,start,dir};
}
/* 행동 대신 신호를 공개하면: 다수결(신호 합)로 맞을 확률. 사람이 늘수록 1에 다가간다(동수는 반반). */
function publicSignals(p,n){const pm=binomPmf(n,p);let r=0;pm.forEach((q,k)=>{if(2*k>n)r+=q;else if(2*k===n)r+=q/2;});return r;}

/* ── 8장 ── 이긴 횟수 W ~ 이항(n, p). 합계 = W × win − (n − W) × lose. */
function outcomeDist(p,n,win=1,lose=1){prob(p,'p');num(win,'win');num(lose,'lose');need(win>0&&lose>0,'win and lose must be > 0');
 const pm=binomPmf(n,p);let neg=0,zero=0,pos=0;pm.forEach((q,k)=>{const t=k*win-(n-k)*lose;if(Math.abs(t)<1e-9)zero+=q;else if(t<0)neg+=q;else pos+=q;});
 return {p,n,neg,zero,pos,mean:n*(p*win-(1-p)*lose),each:p*win-(1-p)*lose,pmf:pm};}

/* ── 9장 ── 규칙 대입. R1은 매매 전 종가로, R2는 그 주 매매 뒤 평가액으로 주마다 센다. R3는 매수 기록의 반대 증거 칸을 센다. */
function r1Weeks(L=ledger(),limit=JOURNAL.rules.R1.limit){
 num(limit,'R1 limit');need(limit>0&&limit<1,'R1 limit must be between 0 and 1');const hits=[],first=[],seen=new Set();
 for(const w of L.weeks.slice(1))for(const [n,h] of Object.entries(L.weeks[w.week-2].hold)){
  const drop=JOURNAL.prices[n][w.week-1]*h.qty/h.cost-1;if(drop>-limit+1e-12)continue;
  const x={week:w.week,name:n,drop,avg:h.cost/h.qty};hits.push(x);if(!seen.has(n+'@'+h.since)){seen.add(n+'@'+h.since);first.push(x);}
 }
 return {hits,first};
}
function r2Weeks(L=ledger(),limit=JOURNAL.rules.R2.limit){num(limit,'R2 limit');need(limit>0&&limit<=1,'R2 limit must be between 0 and 1');
 return L.weeks.flatMap(w=>Object.entries(w.shares).filter(([,s])=>s>limit+1e-12).map(([n,s])=>({week:w.week,name:n,share:s,equity:w.equity})));}
function r3Count(trades=JOURNAL.trades){const buys=trades.filter(t=>t.side==='B');return {buys:buys.length,missing:buys.filter(t=>!t.counter).length,noted:buys.filter(t=>t.counter).length};}
/* 규칙을 지켰을 때(R1대로 팔고 물타기를 하지 않음)와 실제의 차이, 종목별로. R2는 걸린 주를 세기만 하고 끝 금액 계산에는 넣지 않는다. */
function ruleReplay(o={}){
 const r1=o.r1==null?JOURNAL.rules.R1.limit:o.r1,r2=o.r2==null?JOURNAL.rules.R2.limit:o.r2,A=ledger(),R=o.r1off?A:ledger({r1});
 const names=[...new Set([...Object.keys(A.pnl),...Object.keys(R.pnl)])],split=Object.fromEntries(names.map(n=>[n,{actual:A.pnl[n]||0,rule:R.pnl[n]||0,diff:(R.pnl[n]||0)-(A.pnl[n]||0)}]));
 return {actual:A.end,rule:R.end,diff:R.end-A.end,split,ruleSales:R.ruleSales,r1:r1Weeks(A,r1),r2:r2Weeks(A,r2),r3:r3Count()};
}
/* 한 종목 경로에서 R1: prices[0]에 qty주를 사고, 그 뒤 주마다 매매 전 종가로 확인해 걸리면 판다. 걸리지 않으면 마지막 종가에 판다고 놓는다. */
function pathRule(path=ASSUME.rebound,limit=JOURNAL.rules.R1.limit){
 const px=path.prices,qty=path.qty,name=path.name||'새벽전자';need(Array.isArray(px)&&px.length>=2&&px.every(x=>Number.isInteger(x)&&x>0),'need whole-won prices');need(Number.isInteger(qty)&&qty>0,'qty must be a whole number');
 const buy=px[0]*qty,cost=buy+fee(buy),close=p=>{const a=p*qty;return a-fee(a)-tax(a,name)-cost;};let at=null;
 for(let i=1;i<px.length;i++)if(px[i]*qty/cost-1<=-limit+1e-12){at=i;break;}
 return {avg:cost/qty,trigger:at,triggerDrop:at==null?null:px[at]*qty/cost-1,rule:at==null?close(px[px.length-1]):close(px[at]),hold:close(px[px.length-1])};
}
/* 규칙 가격에서 팔지 않고 더 낮은 가격에 판 손실 차이(비용 제외). */
const stopGap=(qty,rulePrice,soldPrice)=>{need(Number.isInteger(qty)&&qty>0,'qty must be a whole number');num(rulePrice,'price');num(soldPrice,'price');return (rulePrice-soldPrice)*qty;};

/* ── 마지막 과제 ── 26주 전체의 점검표와 일지 양식 시험. 규칙 하나의 값을 바꾸면 표를 다시 계산한다. */
const FORM=['reason','range','counter','rule'];   // 이유 · 4주 뒤 예상 범위 · 반대 증거 · 적용할 규칙
function formCheck(fields=FORM,trades=JOURNAL.trades){
 fields.forEach(f=>need(FORM.includes(f),'unknown form field: '+f));const buys=trades.filter(t=>t.side==='B');
 const has={reason:t=>!!t.reason,range:t=>!!t.range,counter:t=>!!t.counter,rule:t=>!!t.rule};
 return Object.fromEntries(fields.map(f=>[f,buys.filter(t=>!has[f](t)).length]));
}
function audit(o={}){
 const L=ledger(),R=ruleReplay(o),iv=intervals(),hd=holding(L),to=turnover(L),buys=JOURNAL.trades.filter(t=>t.side==='B');
 const gains=sum(L.realized.filter(r=>r.pnl>0).map(r=>r.pnl)),losses=sum(L.realized.filter(r=>r.pnl<0).map(r=>r.pnl)),unreal=sum(Object.values(L.unreal));
 return {disposition:disposition(1,JOURNAL.weeks,L),holding:hd,intervals:iv,turnover:to,others:buys.filter(t=>t.others).length,ownFirst:buys.filter(t=>!t.others).length,buys:buys.length,
  r1First:R.r1.first.length,r2Weeks:R.r2.length,r3:R.r3,replay:R,form:formCheck(),gains,losses,unreal,end:L.end,change:L.end-JOURNAL.start,ret:L.end/JOURNAL.start-1};
}

const assumptions={
 journal:'선우의 26주 일지(가격·거래·이유·예상 범위·메모)는 이 책이 지어낸 가상 시나리오다. 실제 종목·실제 인물의 기록이 아니다',
 prospect:'α = β = 0.88, λ = 2.25, γ = 0.61, δ = 0.69는 한 연구의 실험 참가자 중앙값이며 사람마다·연구마다 다르다(가정으로 쓰는 값)',
 baserate:'“두 배 오를 종목” 2%와 추천 적중 60%·오경보 10%는 가정이며 실제 비율이 아니다',
 confirm:'우도비는 이 책의 가정이며, 증거가 서로 독립일 때만 곱할 수 있다',
 cost:'비용 전 연 6%와 회전율 75·300·1,200%는 가정이다. 비용률이 바뀌면 같은 식으로 다시 계산한다',
 cascade:'정보 폭포는 가정을 단순하게 둔 모형의 계산이며 실제 시장의 거품을 설명하거나 예측하지 않는다',
 outcome:'승률 55%와 ±1은 가정한 규칙이다',
 rules:'규칙 대입은 R1에 걸린 보유를 그 주 종가에 팔고 그 종목의 이후 일지 매매를 따르지 않는다고 놓은 가상 계산이다. R2는 걸린 주를 세기만 한다. 반등 경로는 가정이다',
 rounding:'반올림은 5에서 올린다. 비용은 정수 연산으로 원 단위 버림한다'
};
const api={CHECKED,JOURNAL,ASSUME,MARKET,FACTS,TEXT,assumptions,FORM,round,pct,wonText,fee,tax,roundTrip,ev,frames,sameOrDiff,value,weight,prospect,threshold,certainty,weightTable,
 ledger,pgrPlr,disposition,holding,bayes,odds,fromOdds,oddsUpdate,evidence,binomPmf,binomCdf,intervals,turnover,costDrag,tradeCost,growthAfter,
 cascadeOdds,noCascade,thirdPerson,cascadeRun,publicSignals,outcomeDist,r1Weeks,r2Weeks,r3Count,ruleReplay,pathRule,stopGap,formCheck,audit};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.PMath=api;
})(typeof window!=='undefined'?window:globalThis);
