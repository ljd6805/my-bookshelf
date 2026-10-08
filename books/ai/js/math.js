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
const api={networkForward,sum,dot,sigmoid,softmax,cosine,filterDistribution,quantize,metrics,bpe,convolve,lagrange};
root.AIMath=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
