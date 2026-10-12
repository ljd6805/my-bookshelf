/* 순수 수치 계산: 화면과 분리하여 테스트한다. */
(function(root){
'use strict';
const sum = a => a.reduce((s,v)=>s+v,0);
const dot = (a,b) => sum(a.map((v,i)=>v*b[i]));
const sigmoid = x => 1/(1+Math.exp(-x));
function softmax(values,temperature=1){
  if(temperature<=0) throw new RangeError('temperature must be positive');
  const m=Math.max(...values), e=values.map(x=>Math.exp((x-m)/temperature)), s=sum(e);
  return e.map(x=>x/s);
}
function cosine(a,b){const d=Math.hypot(...a)*Math.hypot(...b);return d?dot(a,b)/d:0;}
function filterDistribution(probs,k,p){
  const sorted=probs.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v).slice(0,k);
  let total=0; const keep=[];
  for(const item of sorted){keep.push(item);total+=item.v;if(total>=p)break;}
  return probs.map((_,i)=>keep.some(x=>x.i===i)?probs[i]/total:0);
}
function quantize(values,bits){
  const levels=2**bits-1;
  return values.map(v=>Math.round((Math.max(-1,Math.min(1,v))+1)/2*levels)/levels*2-1);
}
function metrics(tp,fp,fn,tn){
  const divide=(a,b)=>b?a/b:0;
  return {precision:divide(tp,tp+fp),recall:divide(tp,tp+fn),accuracy:divide(tp+tn,tp+fp+fn+tn),f1:divide(2*tp,2*tp+fp+fn)};
}
function bpe(words,steps){
  let pieces=words.map(w=>Array.from(w)); const history=[];
  for(let n=0;n<steps;n++){
    const counts=new Map();
    pieces.forEach(w=>w.slice(0,-1).forEach((a,i)=>{const k=JSON.stringify([a,w[i+1]]);counts.set(k,(counts.get(k)||0)+1);}));
    if(!counts.size)break;
    const [key,count]=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
    const [a,b]=JSON.parse(key);history.push({a,b,count});
    pieces=pieces.map(w=>{const out=[];for(let i=0;i<w.length;i++){if(w[i]===a&&w[i+1]===b){out.push(a+b);i++;}else out.push(w[i]);}return out;});
  }
  return {pieces,history};
}
function convolve(image,kernel){
  const out=[];
  for(let r=1;r<image.length-1;r++)for(let c=1;c<image[0].length-1;c++){
    let v=0;for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)v+=image[r+i][c+j]*kernel[i+1][j+1];out.push(v);
  }
  return out;
}
function lagrange(xs,ys,x){
  return sum(xs.map((xi,i)=>ys[i]*xs.reduce((p,xj,j)=>i===j?p:p*(x-xj)/(xi-xj),1)));
}
// 학습된 모델이 아닌 고정 가중치의 1→2→2 순전파 예제입니다.
function networkForward(x){
  if(!Number.isFinite(x)||x<0||x>1)throw new RangeError('input must be between 0 and 1');
  const hidden=[sigmoid(8*x-4),sigmoid(-8*x+4)];
  const logits=[3*(hidden[0]-hidden[1]),3*(hidden[1]-hidden[0])];
  return {input:x,hidden,logits,probabilities:softmax(logits)};
}
// 두 층 모형 x → h=ReLU(w₁x) → y=w₂h, L=(y−t)²의 순전파와 연쇄 법칙 역전파. ReLU의 꺾이는 점(w₁x=0)에서는 기울기를 0으로 둔다.
function backprop(w1,w2,t=3,x=1){
  const a=w1*x,h=Math.max(0,a),y=w2*h,loss=(y-t)**2,dy=2*(y-t),dw2=dy*h,dh=dy*w2,dw1=dh*(a>0?1:0)*x;
  return {a,h,y,loss,dy,dw2,dh,dw1};
}
// 중앙 차분 수치 미분: (f(w+ε) − f(w−ε)) / 2ε
const numericGrad=(f,w,eps=.01)=>(f(w+eps)-f(w-eps))/(2*eps);
function backpropStep(w1,w2,eta,t=3,x=1){const g=backprop(w1,w2,t,x);return {w1:w1-eta*g.dw1,w2:w2-eta*g.dw2};}
// 확인 문제 보기의 화면 순서: 원래 번호 배열을 돌려 정답(answer)이 target번째 자리에 오게 한다.
function choiceOrder(n,answer,target){const shift=((answer-target)%n+n)%n;return Array.from({length:n},(_,k)=>(k+shift)%n);}
// 추론 메모리의 두 항목. KV 구조는 10장 계산기와 같은 고정 가정(32층, KV head 8개, head 차원 128, FP16, 배치 1)이라 토큰 하나에 131072 byte입니다.
const KV_BYTES_PER_TOKEN=2*32*8*128*2;
function inferenceMemory(params,bits,tokens){
  const weightBytes=params*1e9*bits/8,kvBytes=KV_BYTES_PER_TOKEN*tokens;
  return {weightBytes,kvBytes,weightGiB:weightBytes/2**30,kvGiB:kvBytes/2**30,totalGiB:(weightBytes+kvBytes)/2**30};
}
// 13장 현장 노트북 예산 계산서. 모든 기본값은 가정입니다(측정값이 아님).
// 입력 = 기본 지시·질문 base + 매뉴얼 조각 docs×chunk 토큰, 출력 answer 토큰. 사용 가능 메모리 = ramGiB − reserveGiB(운영체제·다른 프로그램·런타임 여유).
// 앞부분 읽기(prefill) ≈ 2·N·입력 토큰 / 유효 연산 속도, 답 쓰기(decode) ≈ 답 토큰 × (가중치 + 전체 KV byte) / 메모리 대역폭. KV는 마지막 길이로 넉넉히 세지만 대역폭은 최대치라고 보므로 실제 시간의 상한도 하한도 아닌 어림.
// ranks: 시험 질문마다 정답 매뉴얼 조각이 검색 결과 몇 위에 오는지(null = 매뉴얼에 답이 없는 질문).
function fieldBudget({params,bits,docs,ranks=[],chunk=400,base=512,answer=200,ramGiB=16,reserveGiB=6,bandwidthGBs=100,tflops=5,limitS=20}){
  if(![params,bits,docs].every(Number.isFinite)||params<=0||bits<=0||docs<0)throw new RangeError('invalid budget input');
  const prompt=base+docs*chunk,tokens=prompt+answer,mem=inferenceMemory(params,bits,tokens),availableGiB=ramGiB-reserveGiB;
  const prefillS=2*params*1e9*prompt/(tflops*1e12),decodeS=answer*(mem.weightBytes+mem.kvBytes)/(bandwidthGBs*1e9),totalS=prefillS+decodeS;
  const answerable=ranks.filter(r=>r!==null).length,hits=ranks.filter(r=>r!==null&&r<=docs).length;
  return {prompt,tokens,...mem,availableGiB,prefillS,decodeS,totalS,limitS,answerable,hits,hitRate:answerable?hits/answerable:0,
    fitsMemory:mem.totalGiB<=availableGiB,fitsTime:totalS<=limitS};
}
// 13장 경보 문턱과 점검 시간 예산. samples=[[점수,실제 이상 0/1]]. shift는 센서 교체로 모든 점수가 함께 올라간 양이며, 점수는 소수 둘째 자리로 반올림하고 1에서 자릅니다.
function alarmBudget(samples,threshold,shift=0,minutesPerAlarm=15,budgetMin=120){
  let tp=0,fp=0,fn=0,tn=0;
  const scored=samples.map(([p,y])=>{const s=Math.min(1,Math.round((p+shift)*100)/100),alarm=s>=threshold;if(alarm){if(y)tp++;else fp++;}else{if(y)fn++;else tn++;}return {score:s,anomaly:!!y,alarm};});
  const minutes=(tp+fp)*minutesPerAlarm;
  return {tp,fp,fn,tn,...metrics(tp,fp,fn,tn),scored,minutes,budgetMin,withinBudget:minutes<=budgetMin,meetsPlan:fn===0&&minutes<=budgetMin};
}
const api={inferenceMemory,fieldBudget,alarmBudget,backprop,numericGrad,backpropStep,choiceOrder,networkForward,sum,dot,sigmoid,softmax,cosine,filterDistribution,quantize,metrics,bpe,convolve,lagrange};
root.AIMath=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
