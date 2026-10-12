/* 토리 계산 모듈. DOM을 만지지 않는다. 브라우저에서는 window.TMath, Node 테스트에서는 module.exports로 쓴다.
   모든 실험의 숫자는 이 파일이 학습된 가중치(TWeights)로 실제로 계산한다. 예외: softLookup(3장 교육용 2차원 모형), superposition(13장 장난감 모형). */
(function(root){
'use strict';
let W=null;
function weights(){if(!W)W=root.TWeights||(typeof require==='function'?(require('./weights.js'),root.TWeights):null);return W;}
const dims=()=>weights().dims;
const vocab=()=>weights().vocab;
const index=t=>vocab().indexOf(t);
/* 띄어쓰기로 나눈 낱말을 토큰 번호로 바꾼다. 처음에 <s>가 없으면 붙이고, 사전에 없는 낱말은 unknown으로 돌려준다. */
function tokenize(text){
 const words=String(text).trim().split(/\s+/).filter(Boolean),ids=[],unknown=[];
 if(words[0]!=='<s>')ids.push(0);
 words.forEach(w=>{const i=index(w);if(i<0)unknown.push(w);else ids.push(i);});
 return {ids:ids.slice(0,dims().T),unknown,cut:ids.length>dims().T};
}
const zeros=n=>new Array(n).fill(0);
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const dot=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s;};
const norm=a=>Math.sqrt(dot(a,a));
const cosine=(a,b)=>dot(a,b)/(norm(a)*norm(b)||1);
/* 벡터 × 행렬: v[n] · M[n][m] → [m] */
function vm(v,M){const m=M[0].length,out=zeros(m);for(let i=0;i<v.length;i++){const vi=v[i];if(!vi)continue;const row=M[i];for(let j=0;j<m;j++)out[j]+=vi*row[j];}return out;}
function layerNorm(x,g,b){const n=x.length,m=x.reduce((s,v)=>s+v,0)/n,v=x.reduce((s,y)=>s+(y-m)**2,0)/n,r=1/Math.sqrt(v+1e-5);return x.map((y,i)=>(y-m)*r*g[i]+b[i]);}
function softmax(xs,temp=1){const t=Math.max(temp,1e-6),m=Math.max(...xs.filter(Number.isFinite));const e=xs.map(x=>Number.isFinite(x)?Math.exp((x-m)/t):0),s=e.reduce((a,b)=>a+b,0);return e.map(x=>x/s);}
function unembed(x){const w=weights();return add(vm(layerNorm(x,w.gf,w.bf),w.U),w.bU);}
/* 한 층의 어텐션. opts.keepHead(l,h)가 0이면 그 헤드의 출력을 지운다(절제). opts.patch가 있으면 헤드 출력을 바꿔 끼운다. */
function attention(xs,l,q,opts,rec){
 const {H,dh}=dims(),T=xs.length,hs=xs.map(x=>layerNorm(x,q.g1,q.b1)),out=xs.map(()=>zeros(dims().D));
 rec.attn[l]=[];rec.scores[l]=[];rec.head[l]=[];
 for(let h=0;h<H;h++){
  const Q=hs.map(x=>vm(x,q.Q[h])),K=hs.map(x=>vm(x,q.K[h])),V=hs.map(x=>vm(x,q.Vw[h]));
  const S=Q.map((qi,t)=>K.map((k,s)=>s<=t?dot(qi,k)/Math.sqrt(dh)*(opts.scale??1):-Infinity));
  const A=S.map(row=>softmax(row));
  let O=A.map(row=>vm(row.reduce((z,a,s)=>a?add(z,V[s].map(v=>v*a)):z,zeros(dh)),q.O[h]));
  const keep=opts.keepHead?opts.keepHead(l,h):1;
  if(keep!==1)O=O.map(o=>o.map(v=>v*keep));
  if(opts.patchHead){const p=opts.patchHead(l,h);if(p)O=O.map((o,t)=>p[t]||o);}
  rec.attn[l][h]=A;rec.scores[l][h]=S;rec.head[l][h]=O;
  O.forEach((o,t)=>{out[t]=add(out[t],o);});
 }
 return out;
}
function mlp(xs,l,q,opts,rec){
 rec.act[l]=[];rec.mlp[l]=[];
 return xs.map((x,t)=>{
  let a=add(vm(layerNorm(x,q.g2,q.b2),q.W1),q.c1).map(v=>v>0?v:0);
  if(opts.killNeurons)a=a.map((v,n)=>opts.killNeurons(l,n)?0:v);
  let o=add(vm(a,q.W2),q.c2);
  const keep=opts.keepMlp?opts.keepMlp(l):1;if(keep!==1)o=o.map(v=>v*keep);
  if(opts.patchMlp){const p=opts.patchMlp(l);if(p&&p[t])o=p[t];}
  rec.act[l][t]=a;rec.mlp[l][t]=o;return o;
 });
}
/* 순전파 전체. 돌려주는 값: logits[t][V], probs[t][V], attn[l][h][t][s], 단계별 잔차 stages[{name,x[t][D]}], 헤드·MLP 출력, 뉴런 활성. */
function run(ids,opts={}){
 const w=weights(),rec={attn:[],scores:[],head:[],act:[],mlp:[],stages:[]};
 let xs=ids.map((id,t)=>add(w.E[id],w.P[t]));
 rec.embed=ids.map(id=>w.E[id].slice());rec.pos=ids.map((_,t)=>w.P[t].slice());
 rec.stages.push({name:'임베딩',x:xs.map(x=>x.slice())});
 w.layers.forEach((q,l)=>{
  const a=attention(xs,l,q,opts,rec);xs=xs.map((x,t)=>add(x,a[t]));rec.stages.push({name:`${l}층 어텐션 뒤`,x:xs.map(x=>x.slice())});
  const m=mlp(xs,l,q,opts,rec);xs=xs.map((x,t)=>add(x,m[t]));rec.stages.push({name:`${l}층 MLP 뒤`,x:xs.map(x=>x.slice())});
 });
 rec.logits=xs.map(unembed);rec.probs=rec.logits.map(r=>softmax(r,opts.temperature||1));rec.ids=ids;
 return rec;
}
function top(probs,k=5){return probs.map((p,i)=>({token:vocab()[i],id:i,p})).sort((a,b)=>b.p-a.p).slice(0,k);}
/* 다음 토큰 확률. 온도 temperature는 로짓을 나누는 수(1이 학습한 그대로). */
function predict(text,temperature=1,k=5){const t=tokenize(text),r=run(t.ids,{temperature});return {...t,top:top(r.probs.at(-1),k),probs:r.probs.at(-1),logits:r.logits.at(-1)};}
/* 교차 엔트로피(자연로그, nat): 정답 토큰 확률의 -ln. */
const crossEntropy=(probs,id)=>-Math.log(Math.max(probs[id],1e-12));
/* 로짓 렌즈: 각 단계의 잔차를 바로 출력층에 통과시켜 그때까지의 예측을 읽는다. */
function logitLens(text,pos){const t=tokenize(text),r=run(t.ids),i=pos??t.ids.length-1;return r.stages.map(s=>({name:s.name,top:top(softmax(unembed(s.x[i])),3)}));}
/* 토큰 임베딩의 코사인 이웃 */
function neighbors(token,k=4){const w=weights(),i=index(token);return vocab().map((t,j)=>({token:t,cos:cosine(w.E[i],w.E[j])})).filter(x=>x.token!==token).sort((a,b)=>b.cos-a.cos).slice(0,k);}
/* 주성분 분석: 거듭제곱법으로 첫 두 축을 구해 각 토큰을 2차원 좌표로 놓는다. */
function pca2(rows){
 const n=rows.length,d=rows[0].length,mean=zeros(d);rows.forEach(r=>r.forEach((v,i)=>mean[i]+=v/n));
 const X=rows.map(r=>r.map((v,i)=>v-mean[i])),C=Array.from({length:d},(_,i)=>Array.from({length:d},(_,j)=>X.reduce((s,r)=>s+r[i]*r[j],0)/n));
 const axes=[],vals=[];
 for(let k=0;k<2;k++){let v=Array.from({length:d},(_,i)=>Math.sin(i+1+k*7));for(let it=0;it<200;it++){let u=vm(v,C);axes.forEach(a=>{const p=dot(u,a);u=u.map((x,i)=>x-p*a[i]);});const s=norm(u);v=u.map(x=>x/s);}axes.push(v);vals.push(dot(vm(v,C),v));}
 const total=C.reduce((s,r,i)=>s+r[i],0);
 return {points:X.map(r=>axes.map(a=>dot(r,a))),explained:vals.map(v=>v/total)};
}
function embeddingMap(){const w=weights(),p=pca2(w.E);return {explained:p.explained,points:vocab().map((t,i)=>({token:t,x:p.points[i][0],y:p.points[i][1],group:groupOf(i)}))};}
function groupOf(i){return i<5?'기호':i<11?'동물':i<17?'먹이':i<23?'집':'숫자';}
/* 3장 교육용 모형: 2차원 질문 벡터로 열쇠 넷을 부드럽게 찾는다. 학습된 값이 아니라 손으로 정한 값이다. */
const LOOKUP=[{key:'먹이',k:[1,0],v:'꿀'},{key:'집',k:[0,1],v:'동굴'},{key:'이름',k:[-1,0],v:'곰'},{key:'색',k:[0,-1],v:'갈색'}];
function softLookup(angle,sharp){const q=[Math.cos(angle*Math.PI/180),Math.sin(angle*Math.PI/180)].map(x=>x*sharp),s=LOOKUP.map(e=>dot(q,e.k)),a=softmax(s);return LOOKUP.map((e,i)=>({...e,score:s[i],weight:a[i]}));}
/* 한 위치의 질문 벡터와 앞선 위치들의 열쇠 벡터로 점수를 직접 풀어 보인다. scale은 √dh로 나눌지(1) 말지(√dh 배). */
function attentionTrace(text,l,h,pos,divide=true){
 const t=tokenize(text),r=run(t.ids),w=weights(),q=w.layers[l],i=pos??t.ids.length-1;
 const xs=r.stages[l*2].x.map(x=>layerNorm(x,q.g1,q.b1)),Q=vm(xs[i],q.Q[h]),K=xs.slice(0,i+1).map(x=>vm(x,q.K[h]));
 const raw=K.map(k=>dot(Q,k)),d=Math.sqrt(dims().dh),scores=raw.map(s=>divide?s/d:s),weightsA=softmax(scores);
 return {ids:t.ids,tokens:t.ids.map(id=>vocab()[id]),pos:i,q:Q,raw,scores,weights:weightsA,qNorm:norm(Q)};
}
/* 마스크를 끄면(미래도 보게 하면) 어떤 일이 생기는지: 같은 점수표에서 미래 칸을 살렸을 때의 가중치 */
function maskCompare(text,l,h,pos){
 const t=tokenize(text),w=weights(),q=w.layers[l],r=run(t.ids),xs=r.stages[l*2].x.map(x=>layerNorm(x,q.g1,q.b1));
 const Q=xs.map(x=>vm(x,q.Q[h])),K=xs.map(x=>vm(x,q.K[h])),d=Math.sqrt(dims().dh),row=K.map(k=>dot(Q[pos],k)/d);
 return {tokens:t.ids.map(id=>vocab()[id]),masked:softmax(row.map((s,j)=>j<=pos?s:-Infinity)),open:softmax(row)};
}
/* 헤드 점수: 목록 문장에서 바로 앞 토큰을 보는 정도(prev)와 앞선 같은 토큰의 다음 칸을 보는 정도(induction) */
function listSentence(items,len){const ids=[0,index('목록')],it=items.map(index);while(ids.length<(len||dims().T))ids.push(...it);return ids.slice(0,len||dims().T);}
function headScores(ids,n){
 const r=run(ids),{L,H}=dims(),T=ids.length,res=[];
 for(let l=0;l<L;l++)for(let h=0;h<H;h++){const A=r.attn[l][h];let p=0,c=0,ind=0,ci=0;for(let t=2;t<T;t++){p+=A[t][t-1];c++;}for(let t=2+n;t<T;t++){ind+=A[t][t-n+1];ci++;}res.push({l,h,prev:p/c,induction:ci?ind/ci:0});}
 return res;
}
/* 반복 목록에서 위치마다 손실. ablate: ['0.2'] 처럼 지울 헤드 목록 */
function repeatLoss(items,ablate=[],len){
 const ids=listSentence(items,len),off=new Set(ablate),r=run(ids,{keepHead:(l,h)=>off.has(`${l}.${h}`)?0:1}),n=items.length;
 const loss=ids.slice(1).map((id,t)=>crossEntropy(r.probs[t],id));
 const first=loss.slice(2,1+n),second=loss.slice(1+n);const avg=a=>a.reduce((s,x)=>s+x,0)/Math.max(a.length,1);
 return {ids,tokens:ids.map(i=>vocab()[i]),loss,first:avg(first),second:avg(second),correct:ids.slice(1+n+1).filter((id,k)=>top(r.probs[1+n+k],1)[0].id===id).length,total:ids.length-2-n};
}
/* OV 회로: 원천 토큰이 그 헤드를 거쳐 잔차에 쓰는 벡터를 출력층에 곧바로 비춰(최종 정규화의 크기 조정은 빼고 방향만) 어떤 토큰을 밀어 올리는지 본다. */
function ovRow(l,h,token,pos=5){
 const w=weights(),q=w.layers[l],x=layerNorm(add(w.E[index(token)],w.P[pos]),q.g1,q.b1),o=vm(vm(x,q.Vw[h]),q.O[h]),lg=vm(o,w.U);
 const sorted=lg.map((v,i)=>({token:vocab()[i],v})).sort((a,b)=>b.v-a.v);return {top:sorted.slice(0,4),rank:sorted.findIndex(s=>s.token===token)+1,self:lg[index(token)]};
}
/* QK 회로(위치만): 위치 임베딩끼리의 점수표. 바로 앞 칸을 보는 헤드라면 대각선 바로 아래가 밝다. */
function positionalQK(l,h,n=10){
 const w=weights(),q=w.layers[l],d=Math.sqrt(dims().dh),base=w.E[index('곰')];
 const xs=Array.from({length:n},(_,t)=>layerNorm(add(base,w.P[t]),q.g1,q.b1));
 return xs.map((x,t)=>softmax(xs.map((y,s)=>s<=t?dot(vm(x,q.Q[h]),vm(y,q.K[h]))/d:-Infinity)));
}
/* 뉴런: 사실 문장의 마지막 위치에서 1층 MLP 뉴런 활성과, 그 뉴런이 정답 로짓에 직접 더하는 양(활성 × W2 행 · U 열) */
function neurons(text,answer,layer=1,k=6){
 const t=tokenize(text),r=run(t.ids),w=weights(),q=w.layers[layer],a=r.act[layer].at(-1),ans=index(answer);
 const col=w.U.map(row=>row[ans]);
 return a.map((v,n)=>({n,act:v,effect:v*dot(q.W2[n],col)})).filter(x=>x.act>0).sort((x,y)=>y.effect-x.effect).slice(0,k);
}
function probOf(text,token,opts={}){const t=tokenize(text),r=run(t.ids,opts);return r.probs.at(-1)[index(token)];}
/* 절제: 지울 부품 목록(['0.2','mlp1','n1.37'])을 받아 정답 확률을 다시 잰다. */
function ablate(text,token,parts=[]){
 const off=new Set(parts);
 const opts={keepHead:(l,h)=>off.has(`${l}.${h}`)?0:1,keepMlp:l=>off.has(`mlp${l}`)?0:1,killNeurons:(l,n)=>off.has(`n${l}.${n}`)};
 return {before:probOf(text,token),after:probOf(text,token,opts),top:top(run(tokenize(text).ids,opts).probs.at(-1),3)};
}
/* 활성 패칭: 망가진 입력(corrupt)으로 돌리면서 부품 하나의 출력만 깨끗한 입력(clean)의 것으로 바꿔 끼워 로짓 차이가 얼마나 돌아오는지 잰다.
   회복률 = (패치 후 차이 - 망가진 차이) / (깨끗한 차이 - 망가진 차이). 차이 = 정답 로짓 - 오답 로짓. */
function patching(clean,corrupt,good,bad){
 const c=tokenize(clean).ids,x=tokenize(corrupt).ids,{L,H}=dims(),g=index(good),b=index(bad);
 if(c.length!==x.length)return null;
 const rc=run(c),rx=run(x),diff=r=>r.logits.at(-1)[g]-r.logits.at(-1)[b],dc=diff(rc),dx=diff(rx),rows=[];
 const rate=r=>(diff(r)-dx)/((dc-dx)||1);
 for(let l=0;l<L;l++){for(let h=0;h<H;h++)rows.push({part:`${l}.${h}`,label:`${l}층 헤드 ${h}`,rate:rate(run(x,{patchHead:(ll,hh)=>ll===l&&hh===h?rc.head[l][h]:null}))});rows.push({part:`mlp${l}`,label:`${l}층 MLP`,rate:rate(run(x,{patchMlp:ll=>ll===l?rc.mlp[l]:null}))});}
 return {clean:dc,corrupt:dx,rows};
}
/* 13장 장난감 모형(중첩): 특징 n개를 m차원에 담고 ReLU(WᵀWx+b)로 되살리도록 경사하강법으로 학습한다. 실제 계산이지만 토리가 아닌 별도 모형이다. */
function superposition(sparsity,{n=5,m=2,steps=3000,lr=.05,seed=3}={}){
 let s=seed;const rnd=()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};
 const imp=Array.from({length:n},(_,i)=>Math.pow(.8,i)),Wm=Array.from({length:m},()=>Array.from({length:n},()=>(rnd()-.5)*.6)),b=zeros(n);
 for(let it=0;it<steps;it++){
  const x=Array.from({length:n},()=>rnd()<1-sparsity?rnd():0),h=Wm.map(r=>dot(r,x)),pre=Array.from({length:n},(_,i)=>Wm.reduce((z,r,k)=>z+r[i]*h[k],0)+b[i]);
  const y=pre.map(v=>v>0?v:0),gy=y.map((v,i)=>2*imp[i]*(v-x[i])*(pre[i]>0?1:0));
  const gh=Wm.map(r=>dot(r,gy));
  for(let k=0;k<m;k++)for(let i=0;i<n;i++)Wm[k][i]-=lr*(gy[i]*h[k]+gh[k]*x[i]);
  for(let i=0;i<n;i++)b[i]-=lr*gy[i];
 }
 const cols=Array.from({length:n},(_,i)=>Wm.map(r=>r[i]));
 return {cols,lengths:cols.map(norm),bias:b,represented:cols.filter(c=>norm(c)>.5).length,importance:imp};
}
const choiceOrder=(n,answer,target)=>{const order=[...Array(n).keys()].filter(i=>i!==answer);order.splice(Math.min(target,n-1),0,answer);return order;};
const api={weights,dims,vocab,index,tokenize,run,top,predict,softmax,crossEntropy,logitLens,neighbors,cosine,dot,norm,embeddingMap,groupOf,softLookup,attentionTrace,maskCompare,listSentence,headScores,repeatLoss,ovRow,positionalQK,neurons,probOf,ablate,patching,superposition,choiceOrder,unembed,layerNorm,vm};
root.TMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
