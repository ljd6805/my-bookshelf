(function(root){
'use strict';
const valid=(n,min=0)=>{if(!Number.isFinite(n)||n<min)throw new RangeError('입력 범위를 확인하세요');return n;};
function metrics(ttft,gap,count){valid(ttft);valid(gap);valid(count,1);const total=ttft+(count-1)*gap;return {ttft,gap:count>1?gap:null,total,tps:total?count*1000/total:0};}
function timing(count,launch,gpu){valid(count,1);valid(launch);valid(gpu);let end=0;for(let i=1;i<=count;i++)end=Math.max(end,i*launch)+gpu;return {enqueue:count*launch,event:end-launch,wall:end};}
function pipeline(count,copy,compute,overlap){
 valid(count,1);valid(copy);valid(compute);let copyEnd=0,gpuEnd=0;const events=[];
 for(let i=0;i<count;i++){const start=overlap?copyEnd:gpuEnd;copyEnd=start+copy;events.push({lane:0,start,end:copyEnd,label:'복사 '+(i+1)});const gs=Math.max(copyEnd,gpuEnd);gpuEnd=gs+compute;events.push({lane:1,start:gs,end:gpuEnd,label:'계산 '+(i+1)});}
 return {events,total:gpuEnd,serial:count*(copy+compute)};
}
function mapping(n,block){valid(n,1);valid(block,1);const blocks=Math.ceil(n/block);return {blocks,total:blocks*block,idle:blocks*block-n,warps:Math.ceil(block/32)*blocks};}
function sectors(stride,offset){valid(stride,1);valid(offset);const addresses=Array.from({length:32},(_,i)=>(offset+i*stride)*4);const bins=[...new Set(addresses.map(a=>Math.floor(a/32)))];return {addresses,bins,count:bins.length,requested:128,covered:bins.length*32,efficiency:128/(bins.length*32)};}
function occupancy(tile,registers){
 valid(tile,1);valid(registers,1);const threads=tile*tile,shared=2*threads*4;
 const limits=[16,Math.floor(2048/threads),Math.floor(65536/(threads*registers)),Math.floor(65536/shared)];const blocks=threads>1024?0:Math.min(...limits);
 return {threads,shared,limits,blocks,warps:blocks*Math.ceil(threads/32),ratio:blocks*threads/2048,loads:2*512**3/tile};
}
function roofline(gb,gflop,ms){valid(gb,.001);valid(gflop,.001);valid(ms,.001);const memory=gb/500*1000,compute=gflop/50;return {memory,compute,bound:Math.max(memory,compute),intensity:gflop/gb,gbps:gb/ms*1000,tflops:gflop/ms,consistent:ms+1e-9>=Math.max(memory,compute)};}
function fusion(n,bias){valid(n,1);const x=Array.from({length:8},(_,i)=>i-4),y=x.map(v=>Math.max(0,v+bias));return {x,y,separate:n*5*4,fused:n*3*4,saved:n*2*4};}
function attention(tokens,tile){valid(tokens,1);valid(tile,1);return {full:tokens*tokens*2,tile:Math.min(tile,tokens)**2*4,row:Math.min(tile,tokens)*2*4};}
function paging(length,block){valid(length,1);valid(block,1);const lengths=[129,257,length],pages=lengths.map(n=>Math.ceil(n/block)),used=lengths.reduce((a,b)=>a+b,0),allocated=pages.reduce((a,b)=>a+b,0)*block;return {lengths,pages,used,allocated,waste:allocated-used,reserved:3*2048,miB:allocated*144/1024};}
function schedule(slots,step,continuous){
 valid(slots,1);valid(step,.001);const lengths=[2,6,3,5],ends=Array(4).fill(0),events=[];let next=0,tick=0,active=[];
 while(next<4||active.length){
  if(continuous||active.length===0)while(active.length<slots&&next<4){active.push({id:next,left:lengths[next]});next++;}
  for(const a of active){events.push({lane:a.id,start:tick*step,end:(tick+1)*step,label:String(a.id+1)});a.left--;if(!a.left)ends[a.id]=(tick+1)*step;}
  active=active.filter(a=>a.left>0);tick++;
 }
 return {events,ends,total:tick*step,tokens:16,tps:16000/(tick*step),utilization:16/(tick*slots)};
}
function parallel(n,payload,bandwidth){valid(n,1);valid(payload);valid(bandwidth,.001);const compute=16/n,serial=2,communication=n===1?0:64*(2*(n-1)*.005+2*(n-1)/n*payload/bandwidth);return {compute,serial,communication,total:compute+serial+communication,speedup:18/(compute+serial+communication)};}
function percentile(values,p){if(!values.length)throw new RangeError('빈 표본');const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.max(0,Math.ceil(p*sorted.length)-1)];}
const trials=[
 {name:'기준 실행',ttft:650,itl:25,tps:40,memory:20,passed:20},
 {name:'연산 융합',ttft:550,itl:22,tps:45,memory:19,passed:20},
 {name:'배치 확대',ttft:500,itl:42,tps:80,memory:23,passed:20},
 {name:'4bit 전환',ttft:430,itl:20,tps:60,memory:15,passed:18}
];
function decision(index,ttft,itl,capacity){const r=trials[index];if(!r)throw new RangeError('없는 후보');const checks=[r.ttft<=ttft,r.itl<=itl,r.memory<=capacity,r.passed===20];return {...r,checks,accepted:checks.every(Boolean)};}
/* 확인 문제 화면 순서(학습 내용의 계산이 아님): 원래 번호 answer인 보기가 화면 target번째(0부터)에 오도록 n개 보기를 돌린 원래 번호 목록. */
function choiceOrder(n,answer,target){const s=((answer-target)%n+n)%n;return Array.from({length:n},(_,k)=>(k+s)%n);}
/* 10장 깊이 읽기: 추측 디코딩의 이론값(Leviathan·Kalman·Matias 2023, 식 1과 정리 3.8). 수락률 alpha는 토큰마다 독립이라고 가정한다.
   초안 모델 한 번의 비용은 큰 모델 한 단계의 cost배이고, 큰 모델이 gamma+1개 위치를 검증하는 시간은 한 단계와 같다고 가정한다. */
function speculative(alpha,gamma,cost){
 valid(alpha);if(alpha>=1)throw new RangeError('수락률은 0 이상 1 미만입니다');valid(gamma,1);valid(cost);
 const at=g=>{const expected=(1-alpha**(g+1))/(1-alpha);return {gamma:g,expected,speedup:expected/(g*cost+1)};};
 const curve=Array.from({length:8},(_,i)=>at(i+1)),best=curve.reduce((a,b)=>b.speedup>a.speedup?b:a);
 return {...at(gamma),curve,best};
}
/* 10장 꼬리 지연 실험: 고정 시드로 만든 미리 정한 시나리오의 시뮬레이션(실측 아님).
   요청은 평균 간격 1/rate초의 무작위(지수) 간격으로 도착하고, 먼저 온 순서대로 가장 먼저 비는 슬롯에 들어간다(FIFO, 슬롯 slots개).
   처리 시간은 spread 0 = 모두 service ms, 1 = service의 0.5~1.5배 균등, 2 = 평균 service ms의 지수 분포.
   같은 seed면 결과가 같고, 요청마다 난수를 두 개씩 쓰므로 rate·spread를 바꿔도 같은 난수열을 다시 쓴다. */
function seeded(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function timeAverage(points,horizon){/* 계단 함수(+1 도착, −1 떠남)를 시간으로 적분해 평균 개수를 얻는다. */
 points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);let level=0,last=0,area=0;
 for(const [t,d] of points){area+=level*(t-last);level+=d;last=t;}
 return area/horizon;
}
function queue(rate,service,slots,spread=0,options={}){
 valid(rate,.001);valid(service,.001);valid(slots,1);if(!Number.isInteger(slots)||![0,1,2].includes(spread))throw new RangeError('입력 범위를 확인하세요');
 const count=options.count||4000,prefill=options.prefill??100,next=seeded(options.seed??20261012),free=Array(slots).fill(0),rows=[];let clock=0;
 for(let i=0;i<count;i++){
  clock+=-Math.log(1-next())/rate*1000;const u=next(),s=spread===0?service:spread===1?service*(.5+u):-Math.log(1-u)*service;
  let k=0;for(let j=1;j<slots;j++)if(free[j]<free[k])k=j;
  const start=Math.max(clock,free[k]);free[k]=start+s;rows.push({arrival:clock,start,end:start+s});
 }
 const waits=rows.map(r=>r.start-r.arrival),horizon=rows.reduce((m,r)=>Math.max(m,r.end),0),mean=waits.reduce((a,b)=>a+b,0)/count;
 const rho=rate*service/1000/slots,observed=count/horizon*1000,quarter=Math.floor(count/4),avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
 const queued=timeAverage(rows.flatMap(r=>[[r.arrival,1],[r.start,-1]]),horizon),inSystem=timeAverage(rows.flatMap(r=>[[r.arrival,1],[r.end,-1]]),horizon);
 const sojourn=avg(rows.map(r=>r.end-r.arrival));
 return {rho,stable:rho<1,count,prefill,waits,mean,p50:percentile(waits,.5),p95:percentile(waits,.95),max:waits.reduce((m,w)=>Math.max(m,w),0),waited:waits.filter(w=>w>1e-9).length/count,
  horizon,observed,queued,inSystem,littleQueued:observed*mean/1000,littleSystem:observed*sojourn/1000,nominalQueued:rate*mean/1000,
  early:avg(waits.slice(0,quarter)),late:avg(waits.slice(count-quarter))};
}
/* 대기 시간 막대: 기다리지 않은 요청(0 ms)을 첫 칸에 따로 두고, 나머지를 0~top ms의 bins칸에 나눈다. top을 넘는 값은 마지막 칸에 넣는다. */
function histogram(waits,bins=8,top=null){
 valid(bins,1);const positive=waits.filter(w=>w>1e-9),upper=top??Math.max(1,percentile(positive.length?positive:[1],.99)),width=upper/bins,counts=Array(bins).fill(0);
 for(const w of positive)counts[Math.min(bins-1,Math.floor(w/width))]++;
 return {zero:waits.length-positive.length,counts,width,upper};
}
/* 같은 S·슬롯·흔들림에서 사용률 0.5·0.7·0.9가 되도록 도착률만 바꾼 비교표. */
function tailSweep(service,slots,spread=0,levels=[.5,.7,.9]){return levels.map(r=>{const q=queue(r*slots*1000/service,service,slots,spread);return {rho:r,rate:q.rho*slots*1000/service,mean:q.mean,p50:q.p50,p95:q.p95};});}
const api={seeded,queue,histogram,tailSweep,choiceOrder,speculative,metrics,timing,pipeline,mapping,sectors,occupancy,roofline,fusion,attention,paging,schedule,parallel,percentile,trials,decision};
if(typeof module==='object'&&module.exports)module.exports=api;else root.PMath=api;
})(typeof window==='object'?window:globalThis);
