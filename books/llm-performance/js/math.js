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
const api={metrics,timing,pipeline,mapping,sectors,occupancy,roofline,fusion,attention,paging,schedule,parallel,percentile,trials,decision};
if(typeof module==='object'&&module.exports)module.exports=api;else root.PMath=api;
})(typeof window==='object'?window:globalThis);
