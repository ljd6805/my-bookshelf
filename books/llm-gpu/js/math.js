/* 단위: byte, second. 장비 수치는 교육용 가정이며 실제 성능 예측값이 아니다. */
(function(root){
'use strict';
const GiB=2**30;
const models={
 toy:{name:'가상 Dense 8B',params:8,active:8,layers:32,kvHeads:8,headDim:128,qHeads:32,hidden:4096},
 q8:{name:'Qwen3-8B',params:8.2,active:8.2,layers:36,kvHeads:8,headDim:128,qHeads:32,hidden:4096},
 q30:{name:'Qwen3-30B-A3B',params:30.5,active:3.3,layers:48,kvHeads:4,headDim:128,qHeads:32,hidden:2048}
};
function nonnegative(n){if(!Number.isFinite(n)||n<0)throw new RangeError('0 이상의 유한수가 필요합니다.');return n;}
function positive(n){nonnegative(n);if(n===0)throw new RangeError('0보다 큰 수가 필요합니다.');return n;}
function weightBytes(params,bits){return nonnegative(params)*1e9*positive(bits)/8;}
function kvBytes({layers,kvHeads,headDim,tokens,batch=1,bits=16}){
 return 2*positive(layers)*positive(kvHeads)*positive(headDim)*nonnegative(tokens)*positive(batch)*positive(bits)/8;
}
function linearParams(input,output,layers=1){return positive(layers)*(positive(input)*positive(output)+output);}
function quantize(values,bits){
 const levels=2**positive(bits)-1,rounded=values.map(x=>Math.round((Math.max(-1,Math.min(1,x))+1)*levels/2)*2/levels-1);
 return {rounded,mse:values.reduce((sum,x,i)=>sum+(x-rounded[i])**2,0)/values.length,levels:levels+1};
}
function matrix(tile){
 const A=[[1,2,0,1],[0,1,2,1],[2,0,1,1],[1,1,1,1]],B=[[1,0,2,1],[0,1,1,0],[1,1,0,2],[2,0,1,1]];
 const C=A.map(row=>B[0].map((_,j)=>row.reduce((s,x,k)=>s+x*B[k][j],0)));
 if(![1,2,4].includes(tile))throw new RangeError('타일 크기 1, 2, 4만 지원합니다.');
 return {A,B,C,loads:2*4**3/tile,naive:128,flops:128,shared:2*tile*tile*4};
}
function phases(prompt,generated){
 positive(prompt);positive(generated);
 // 첫 출력은 prefill 끝에 선택한다. 나머지 출력에 G-1번의 decode가 필요하다.
 return {prefill:prompt,decode:generated-1,cached:prompt+generated-1,
 uncached:generated*prompt+generated*(generated-1)/2};
}
function roofline({params=8,bits=4,batch=1,bandwidth=500,compute=50,extraBytes=0}){
 const bytes=weightBytes(params,bits)+nonnegative(extraBytes),flops=2*params*1e9*positive(batch);
 const memory=bytes/(positive(bandwidth)*1e9),math=flops/(positive(compute)*1e12),seconds=Math.max(memory,math);
 return {bytes,flops,memory,math,seconds,intensity:flops/bytes,tokensPerSecond:batch/seconds,
 bottleneck:memory>=math?'메모리 대역폭':'연산 처리량'};
}
function moe(experts,chosen){
 positive(experts);positive(chosen);if(chosen>experts)throw new RangeError('활성 expert 수가 전체보다 큽니다.');
 // 가상 모형: 공통 2B + expert당 0.5B, 토큰당 선택한 expert만 계산한다.
 return {total:2+experts*.5,active:2+chosen*.5};
}
function transfer(gb,bandwidth){return nonnegative(gb)/positive(bandwidth);}
function budget({model='toy',bits=4,tokens=8192,batch=1,capacity=24,reserve=2,overhead=.1}){
 const m=models[model];if(!m)throw new RangeError('알 수 없는 모델입니다.');
 const weights=weightBytes(m.params,bits),metadata=weights*nonnegative(overhead);
 const kv=kvBytes({...m,tokens,batch}),workspace=nonnegative(reserve)*GiB,total=weights+metadata+kv+workspace;
 const available=positive(capacity)*GiB;
 return {weights,metadata,kv,workspace,total,available,remaining:available-total,fits:total<=available};
}
const api={GiB,models,weightBytes,kvBytes,linearParams,quantize,matrix,phases,roofline,moe,transfer,budget};
if(typeof module!=='undefined')module.exports=api;else root.GMath=api;
})(typeof window==='undefined'?globalThis:window);
