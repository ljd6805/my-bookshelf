/* 백테스트와 자동 매매의 가상 기록. 이 파일 한 곳에만 둔다(책 AGENTS.md). DOM을 만지지 않는다.
   모든 기록은 작성 세션이 지어낸 미리 정한 시나리오이며 실제 종목·실제 계좌·실제 증권사의 기록이 아니다.
   - 새벽전자(4권부터의 가상 회사) 750거래일, 하루 여덟 점 경로와 하루 막대. 난수 mulberry32 씨앗 13, 생성 식은 docs/research.html V-0.
     1~2년째는 평균 20,000원으로 되돌아오는 경로(2년째 400~469일째는 평균 17,600원의 침체 70일), 3년째는 첫 60일 동안 평균이
     20,000원에서 18,450원으로 곧게 내려가고 변동이 작아지도록(일중 σ 0.012 → 0.007) 지어냈다. 그래서 표본 밖(3년째) 성적이 나쁘게 나온다.
   - 배당락 240·490·740일째, 주당 400원(세전). 배당락 날 아침 가격에서 400원을 뺀다.
   - 6장 다른 3년째: 같은 씨앗, 500일째부터 평균 20,000원·σ 0.012(1·2년째와 같은 성질). 0~499일째는 위 기록과 똑같다.
   - 2장 가상 종목 01~20: 씨앗 2027, 하루 표준편차 2.0%, 시작가 10,000원의 40%(4,000원) 이하가 되면 상장폐지.
   - 7~10장·마지막 과제의 모의 서버 운용 창(500~559일째)과 11번째 거래일 아침 19,500원 칸의 중복 매수 세 건.
   자료 생성 식이나 씨앗을 고치면 research.html V-0~V-11의 기준값을 같은 커밋에서 다시 계산한다(tests/math.test.cjs가 대조). */
(function(root){
'use strict';
/* 32비트 정수 난수(mulberry32). Python 기준 계산(calc13.py)과 같은 수열을 낸다. */
function mulberry32(seed){
 let a=seed>>>0;
 return function(){
  a=(a+0x6D2B79F5)>>>0;
  let t=Math.imul(a^(a>>>15),a|1);
  t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;
 };
}
/* 표준정규 난수(박스-뮬러, 난수 두 개를 쓴다). */
function gauss(rnd){const u=1-rnd(),v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
/* 호가 눈금(4권 표의 서재 안 재인용, ⏱ 값은 math.js MARKET.tick에 확인일과 함께 있다). */
const TICKS=[[2000,1],[5000,5],[20000,10],[50000,50],[200000,100],[500000,500]];
function tick(p){for(const [up,t] of TICKS)if(p<up)return t;return 1000;}
function rtick(p){p=Math.max(1,p);const t=tick(Math.trunc(p));return Math.round(p/t)*t;}

const DIV=400,EX=[240,490,740],START=20000,DAYS=750,PER=8;
function muBase(d){if(d>=400&&d<470)return 17600;if(d<500)return 20000;if(d<560)return 20000-(20000-18450)*(d-500)/60;return 18450;}
function sigBase(d){return d<500?0.012:0.007;}
function muAlt(d){return d<500?muBase(d):20000;}
function sigAlt(){return 0.012;}
/* 하루 여덟 점 경로. 첫 점이 시가, 마지막 점이 종가. 로그 가격이 평균 쪽으로 κ = 0.06씩 되돌아오고, 밤사이 σ 0.006의 갭이 있다. */
function makePath(muOf,sigOf,seed=13){
 const rnd=mulberry32(seed),out=[];let x=Math.log(START);
 for(let d=0;d<DAYS;d++){
  const mu=Math.log(muOf(d));
  if(d>0){x+=0.006*gauss(rnd);if(EX.includes(d))x=Math.log(Math.exp(x)-DIV);}
  const row=[];
  for(let k=0;k<PER;k++){if(k>0)x+=0.06*(mu-x)+sigOf(d)*gauss(rnd);row.push(rtick(Math.exp(x)));}
  out.push(row);
 }
 return out;
}
const bars=path=>path.map(r=>[r[0],Math.max(...r),Math.min(...r),r[r.length-1]]);
/* 2장 가상 종목 01~20의 3년 수익률(소수 넷째 자리)과 상장폐지된 날(없으면 null). */
function universe(){
 const rnd=mulberry32(2027),out=[];
 for(let k=0;k<20;k++){
  let p=10000,dl=null;
  for(let d=0;d<DAYS;d++){p*=Math.exp(0.02*gauss(rnd)-0.5*0.02*0.02);if(p<=4000){dl=d;break;}}
  out.push({name:'가상 종목 '+String(k+1).padStart(2,'0'),ret:Math.round((p/10000-1)*1e4)/1e4,delisted:dl});
 }
 return out;
}
let cache=null;
function records(){
 if(cache)return cache;
 const path=makePath(muBase,sigBase),alt=makePath(muAlt,sigAlt);
 cache={path,bars:bars(path),altPath:alt,altBars:bars(alt),universe:universe()};
 return cache;
}
const SCENARIO={
 label:'미리 정한 가상 시나리오 · 하린과 새벽전자는 가상',
 person:'하린',stock:'새벽전자',etf:'가람200',capital:3000000,div:DIV,ex:EX,days:DAYS,per:PER,start:START,
 years:[[0,250],[250,500],[500,750]],
 v12:{low:18000,high:22000,step:200,qty:5},                 // 12권 하린의 격자(18,000~22,000원 · 200원 · 20칸 · 칸당 5주)
 stop:17500,resume:18500,                                   // 12권 #exit의 멈춤 가격과 다시 시작 가격
 grid:{qs:[5,6,7,8,10],steps:[100,150,200,250,300,400],lows:[17000,17500,18000,18500,19000],ns:[10,16,20,26,30,40]},
 mock:{from:500,to:560,rate:2,                              // 모의 서버 운용 창(3년째 첫 60거래일), 초당 요청 2건(가상)
  rule:'하루 안 여덟 점 경로에서 가격이 칸 가격을 한 눈금 지나면 그 칸 가격에, 시가 갭이면 시가에 체결',
  dup:{day:10,cell:19500,extra:2,qty:8,note:'11번째 거래일 전날 밤 응답 없음 뒤 요청 ID 없이 두 번 다시 보냄'}},
 boot:{seed:2026},mc:{seed:2028,trials:2000}
};
const api={mulberry32,gauss,tick,rtick,makePath,bars,muBase,sigBase,muAlt,sigAlt,universe,records,SCENARIO,DIV,EX};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.BData=api;
})(typeof window!=='undefined'?window:globalThis);
