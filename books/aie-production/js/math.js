/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   공통 사례 누리봇의 가정값(교육용): 70B 모델(Llama 3 70B 구조: 80층, KV 헤드 8개, 헤드 차원 128), H100 80GB,
   GPU 1대 시간당 $4, 70B FP8 한 대 처리량 2,300 tok/s(원본 레슨 04의 2,200~2,400 범위 가운데). */
(function(root){
'use strict';
const NURI={params:70e9,layers:80,kvHeads:8,headDim:128,hbm:80,act:5,ctx:2048,gpuHour:4,tput:2300,bw:3350,
 prefillRate:40,decodeMs:7,daily:50000,prefix:2000,dynamic:500,output:200};
/* 시드를 고정한 난수(mulberry32)와 정규분포 표본 */
function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function gauss(r){let u=0,v=0;while(u===0)u=r();v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function percentile(a,p){const s=[...a].sort((x,y)=>x-y);return s[Math.max(0,Math.ceil(p*s.length)-1)];}
function mean(a){return a.reduce((s,x)=>s+x,0)/a.length;}
function erf(x){const s=Math.sign(x);x=Math.abs(x);const t=1/(1+0.3275911*x);const y=1-((((1.061405429*t-1.453152027)*t+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);return s*y;}
function phi(z){return 0.5*(1+erf(z/Math.SQRT2));}

/* 1장: GPU를 시간으로 빌릴 때와 토큰으로 살 때의 100만 토큰당 비용 */
function breakeven(u,price,o={}){
 const hour=o.hour||NURI.gpuHour,tput=o.tput||NURI.tput;
 const perHourM=tput*3600/1e6,dedicated=hour/(perHourM*u),beU=hour/(perHourM*price);
 const monthTokensM=perHourM*u*730;
 return {dedicated,api:price,breakEvenU:beU,monthDedicated:hour*730,monthApi:monthTokensM*price,monthTokensM,cheaper:dedicated<price?'dedicated':'api'};
}
function nuriUtil(){const perDay=NURI.daily*(NURI.prefix+NURI.dynamic+NURI.output);return {tokensPerDay:perDay,tokPerSec:perDay/86400,util:perDay/86400/NURI.tput};}

/* 2장: 청크 프리필. 긴 프롬프트 하나가 들어올 때 이웃 디코드가 겪는 토큰 간격 */
function chunkedPrefill(len,chunk,o={}){
 const rate=o.rate||NURI.prefillRate,d0=o.d0||NURI.decodeMs,c=chunk>0?Math.min(chunk,len):len,n=Math.ceil(len/c);
 const iter=d0+c/rate,ttft=n*d0+len/rate;
 return {chunk:c,chunks:n,iter,ttft,stall:iter,neighborTokens:n,prefillOnly:len/rate};
}

/* 3장: HBM 예산. 가중치 형식, KV 정밀도, 동시 요청 수 */
const FORMATS={bf16:['BF16',2],fp8:['FP8',1],int4:['INT4 (AWQ·GPTQ)',0.5],nvfp4:['NVFP4 (16개마다 FP8 배율)',0.5625]};
function kvBytesPerToken(bytes,cfg=NURI){return 2*cfg.layers*cfg.kvHeads*cfg.headDim*bytes;}
function hbmBudget(fmt,kvB,conc,o={}){
 const cfg=Object.assign({},NURI,o),w=cfg.params*FORMATS[fmt][1]/1e9,kvSeq=kvBytesPerToken(kvB,cfg)*cfg.ctx/1e9,kv=conc*kvSeq,total=w+cfg.act+kv;
 const room=cfg.hbm-w-cfg.act;
 return {weights:w,act:cfg.act,kvSeq,kv,total,fits:total<=cfg.hbm,maxConc:room<0?-1:Math.floor(room/kvSeq),hbm:cfg.hbm};
}
/* 3장: 대역폭이 정하는 디코드 상한. 토큰 하나마다 가중치를 한 번 다 읽는다고 가정 */
function edgeCeiling(bw,paramsB,bits=4){const gb=paramsB*bits/8;return {modelGB:gb,tokS:bw/gb,msPerTok:gb/bw*1000};}

/* 4장: 합성 지연 분포에서 goodput 계산 */
function latencySample(chunked,n=2000,seed=17){
 const r=rng(seed),out=[];
 for(let i=0;i<n;i++){
  const ttft=250*Math.exp(0.4*gauss(r));
  const slow=r()<0.05,tpot=slow?(chunked?15+3*gauss(r):55+10*gauss(r)):7+1*gauss(r);
  const toks=50+Math.floor(r()*251);
  const t=Math.max(3,tpot);out.push({ttft,tpot:t,toks,e2e:ttft+t*toks});
 }
 return out;
}
function goodput(slo,chunked){
 const s=latencySample(chunked),tp=s.map(x=>x.tpot),ok=s.filter(x=>x.ttft<=slo.ttft&&x.tpot<=slo.tpot&&x.e2e<=slo.e2e).length;
 const fail={ttft:s.filter(x=>x.ttft>slo.ttft).length,tpot:s.filter(x=>x.tpot>slo.tpot).length,e2e:s.filter(x=>x.e2e>slo.e2e).length};
 return {n:s.length,goodput:ok/s.length,meanTpot:mean(tp),p50:percentile(tp,0.5),p90:percentile(tp,0.9),p99:percentile(tp,0.99),ttftP99:percentile(s.map(x=>x.ttft),0.99),fail};
}
/* 4장: 같은 요청 기록을 두 도구가 다르게 재는 토큰 간격(원본 레슨 08의 예) */
function itlByTool(ttft,decode,tokens){return {excl:decode/(tokens-1),incl:(ttft+decode)/tokens};}

/* 5장: 추측 디코딩. 수락이 서로 독립이라고 보면 검증 한 번에 얻는 토큰 수의 기댓값은 (1−α^(K+1))/(1−α) */
const SPEC_LOAD={low:0.01,mid:0.06,high:0.14};
function specTokens(a,K){return a>=1?K+1:(1-Math.pow(a,K+1))/(1-a);}
function specSpeedup(a,K,load,draft=0.05){
 const v=SPEC_LOAD[load]!==undefined?SPEC_LOAD[load]:load,cost=1+K*draft+K*v,E=specTokens(a,K);
 let lo=0,hi=0.999;for(let i=0;i<60;i++){const m=(lo+hi)/2;if(specTokens(m,K)/cost<1)lo=m;else hi=m;}
 return {E,cost,speedup:E/cost,naive:1+K*a,breakEven:specTokens(0,K)/cost>=1?0:(lo+hi)/2,v};
}
/* 5장: 프리필 풀에서 디코드 풀로 KV를 보내는 시간. 링크 속도는 원본의 “4K 프롬프트 20~80ms”에 맞춘 값 */
const LINKS={rdma:['RDMA·InfiniBand',33.6],tcp:['TCP 대체 경로',8.4]};
function kvTransfer(P,link,kvB=1){
 const bytes=kvBytesPerToken(kvB)*P,gbs=LINKS[link][1],ms=bytes/(gbs*1e9)*1000,prefill=P/NURI.prefillRate;
 return {mb:bytes/1e6,ms,prefill,ratio:ms/prefill,ttftCo:prefill,ttftDis:prefill+ms,shortRule:P<512};
}

/* 6장: 접두부 캐시를 보는 라우터와 라운드 로빈을 같은 요청 줄로 비교 */
function routeSim(strategy,replicas,order,o={}){
 const n=o.n||1200,prefixes=o.prefixes||6,cap=o.cap||2,r=rng(o.seed||5),caches=Array.from({length:replicas},()=>[]),load=new Array(replicas).fill(0);
 let hits=0,uid=0;const ttft=[];
 for(let i=0;i<n;i++){
  const unique=order==='dynamic'&&r()<0.9,key=unique?'u'+(uid++):'p'+Math.floor(r()*prefixes);
  let k;
  if(strategy==='rr')k=i%replicas;
  else{const own=caches.map((c,j)=>c.includes(key)?j:-1).filter(j=>j>=0);const pool=own.length?own:caches.map((_,j)=>j);k=pool.reduce((b,j)=>load[j]<load[b]?j:b,pool[0]);}
  const c=caches[k],at=c.indexOf(key),hit=at>=0;
  if(hit){hits++;c.splice(at,1);}c.unshift(key);if(c.length>cap)c.pop();
  load[k]++;ttft.push(hit?80:800);
 }
 return {hitRate:hits/n,meanTtft:mean(ttft),p50:percentile(ttft,0.5),p90:percentile(ttft,0.9),maxShare:Math.max(...load)/n,load};
}
/* 6장: 다른 리전의 뜨거운 캐시로 보낼 때 아끼는 프리필과 늘어나는 왕복 시간 */
function crossRegion(rtt,hitMs=80,missMs=800){return {local:missMs,remote:hitMs+2*rtt,better:hitMs+2*rtt<missMs};}

/* 7장: 콜드 스타트 단계별 시간(원본 레슨 10의 70B 예시 표)과 완화책 */
function coldStart(o){
 const node=o.node==='ca'?105:50,pull=o.image==='seeded'?0:180;
 let weights=75,init=20;if(o.weights==='stream')weights=37.5;if(o.weights==='snapshot'){weights=7.5;init=2;}
 const parts=[['노드 준비',node],['이미지 내려받기',pull],['가중치를 HBM으로',weights],['엔진 초기화',init],['첫 순전파',3]];
 const cold=parts.reduce((s,p)=>s+p[1],0),warm=Number(o.warm)||0;
 return {parts,cold,first:warm>0?3:cold,warmMonth:warm*NURI.gpuHour*730};
}
/* 7장: GPU 사용률(작동 비율)과 대기열 길이가 동시 요청에 따라 어떻게 다른지 */
function scaleSignals(conc,capacity=64){return {duty:conc>0?1:0,queue:Math.max(0,conc-capacity),kvUse:Math.min(1,conc/capacity)};}

/* 8장: 프롬프트 캐시와 배치 API를 겹친 하루 청구서(외부 API로 가는 요청 1만 건, 단가는 교육용 가정) */
const PRICE={input:3,read:0.3,write:3.75,output:15};
function dailyBill(hit,lane,o={}){
 const n=o.n||10000,pre=NURI.prefix,dyn=NURI.dynamic,out=NURI.output,disc=lane==='batch'?0.5:1;
 const per=(pre*(hit*PRICE.read+(1-hit)*PRICE.write)+dyn*PRICE.input+out*PRICE.output)/1e6*disc;
 const base=((pre+dyn)*PRICE.input+out*PRICE.output)/1e6;
 const parts={prefix:n*pre*(hit*PRICE.read+(1-hit)*PRICE.write)/1e6*disc,dynamic:n*dyn*PRICE.input/1e6*disc,output:n*out*PRICE.output/1e6*disc};
 return {day:n*per,base:n*base,ratio:per/base,parts};
}
/* 8장: 병렬 호출 N개가 첫 캐시 쓰기 전에 도착할 때 접두부 비용 */
function parallelWrites(N,prefix=NURI.prefix){const naive=N*prefix*PRICE.write/1e6,seq=(prefix*PRICE.write+(N-1)*prefix*PRICE.read)/1e6;return {naive,seq,ratio:naive/seq};}
/* 8장: 값싼 모델 먼저 보내고 확신이 낮으면 올려 보내는 계단식 라우팅 */
function cascade(f,mode,o={}){
 const simple=o.simple||0.7,cheap=o.cheap||0.03,catchRate=o.catch||0.8,hedge=o.hedge||0.1;
 const cx=Math.max(0,f-simple),sp=Math.min(f,simple);
 const esc=mode==='cascade'?sp*hedge+cx*catchRate:0,loss=mode==='cascade'?cx*(1-catchRate):cx;
 const cost=(1-f)+f*cheap+esc;
 return {cost,savings:1-cost,loss,esc,escRate:f>0?esc/f:0,complexRouted:cx};
}

/* 9장: 게이트웨이 재시도와 대체 공급자 */
function gatewayFallback(p,retries,fallback,o={}){
 const L=o.call||900,fast=o.fast||120,q2=o.q2||0.02;
 let succ=0,lat=0,acc=0,worst=0;
 for(let i=0;i<=retries;i++){
  const reach=Math.pow(p,i),t=acc+L;succ+=reach*(1-p);lat+=reach*(1-p)*t;if(reach*(1-p)>0)worst=t;
  acc+=fast+250*Math.pow(2,i);
 }
 const allFail=Math.pow(p,retries+1);
 if(fallback){const t=acc+L;succ+=allFail*(1-q2);lat+=allFail*(1-q2)*t;if(allFail>0)worst=Math.max(worst,t);}
 return {success:succ,failRate:1-succ,meanLatency:succ>0?lat/succ:0,worst,allFail};
}

/* 10장: 카나리 단계별로 관문이 울릴 확률(정규 근사). 관찰 창 한 시간에 요청 3,000건 가정 */
const CANARY={cost:{gate:1.2,cv:0.8,label:'요청당 비용'},refusal:{gate:2,base:0.02,label:'거절·오류율'},feedback:{gate:1.5,base:0.05,label:'싫어요 비율'}};
const STAGES=[1,10,25,50,75];
function ratioSE(metric,ratio,nc,nb){const m=CANARY[metric];if(metric==='cost')return ratio*Math.sqrt(m.cv*m.cv/nc+m.cv*m.cv/nb);const pc=Math.min(0.99,m.base*ratio),pb=m.base;return ratio*Math.sqrt((1-pc)/(nc*pc)+(1-pb)/(nb*pb));}
function canary(metric,ratio,N=3000){
 const m=CANARY[metric];let survive=1;const stages=STAGES.map(s=>{const nc=N*s/100,nb=N-nc,se=ratioSE(metric,ratio,nc,nb),trip=1-phi((m.gate-ratio)/se),haltHere=survive*trip;survive*=1-trip;return {share:s,nc,se,trip,haltHere};});
 return {stages,reachFull:survive,haltBy:1-survive,gate:m.gate};
}

/* 11장: 카오스 실험의 오류 예산 소진 속도 */
function burnRate(blast,injected,o={}){
 const slo=o.slo||0.995,base=o.base||0.001,budget=1-slo,overall=base+blast*injected,burn=overall/budget;
 return {overall,burn,abort:burn>2,budgetPerHour:burn/720,hoursToEmpty:720/burn};
}
/* 11장: 추적 기록 표본 추출. 하루 100만 건, 오류 2%, 고비용 5% */
function traceSampling(s,rule,o={}){
 const n=o.n||1e6,err=0.02,hi=0.05,rest=1-err-hi,k=o.rare||20;
 const kept=rule==='rules'?n*(err+hi+s*rest):n*s,errKept=rule==='rules'?1:s;
 return {kept,share:kept/n,errKept,rareCatch:1-Math.pow(1-s,k)};
}

/* 12장: 마지막 과제. 앞 장의 계산을 다시 돌려 처방이 지표를 움직이는지 본다 */
function finalCase(report,fix){
 const SLO={ttft:800,tpot:25,e2e:3000};
 if(report==='cold'){const b=coldStart({node:'ca',image:'pull',weights:'plain',warm:0}).first,a=fix==='warm'?coldStart({node:'ca',image:'pull',weights:'plain',warm:1}).first:b;return {metric:'월요일 첫 요청의 대기(초)',before:b,after:a,matched:fix==='warm',lowerBetter:true};}
 if(report==='cache'){const b=dailyBill(0.07,'sync').day,a=fix==='reorder'?dailyBill(0.74,'sync').day:b;return {metric:'외부 API 하루 청구액($)',before:b,after:a,matched:fix==='reorder',lowerBetter:true};}
 const b=goodput(SLO,false).goodput*100,a=fix==='chunk'?goodput(SLO,true).goodput*100:b;return {metric:'goodput(%)',before:b,after:a,matched:fix==='chunk',lowerBetter:false};
}

/* 표지: 동시 요청 수에 따른 HBM 사용과 디코드 토큰 간격의 이론 하한(INT4 가중치 + FP8 KV) */
function homeDecode(conc){
 const h=hbmBudget('int4',1,conc),tpot=(h.weights+h.kv)/NURI.bw*1000;
 return {...h,tpot,tput:conc/tpot*1000,slo:25,meets:tpot<=25&&h.fits};
}

const A18Math={NURI,rng,gauss,percentile,mean,phi,breakeven,nuriUtil,chunkedPrefill,FORMATS,kvBytesPerToken,hbmBudget,edgeCeiling,latencySample,goodput,itlByTool,SPEC_LOAD,specTokens,specSpeedup,LINKS,kvTransfer,routeSim,crossRegion,coldStart,scaleSignals,PRICE,dailyBill,parallelWrites,cascade,gatewayFallback,CANARY,STAGES,canary,burnRate,traceSampling,finalCase,homeDecode};
if(typeof module!=='undefined')module.exports=A18Math;else root.A18Math=A18Math;
})(typeof window!=='undefined'?window:globalThis);
