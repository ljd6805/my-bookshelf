/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   책의 공통 사례는 "점에 선을 긋는 일"이다. 2~3장은 카페 8일 기록(기온 → 아이스 음료 판매)에 예측선을 긋고,
   4~6장은 네 모서리 점을 가르는 경계선을, 마지막 과제는 선 하나로 가를 수 없는 원 모양 경계를 다룬다.
   단위: 기온 x는 20℃보다 몇 ℃ 높은지, 판매 y는 잔. 분류 입력 좌표는 [-1,1], 손실은 표본 평균이다. */
(function(root){
'use strict';

/* 재현 가능한 난수(mulberry32)와 표준정규분포(Box-Muller) */
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function normal(r){const u=1-r(),v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}

/* 1장: 데이터 종류별 텐서 모양. 원소 수는 축 크기의 곱이고, float32는 원소 하나에 4바이트다.
   table: (표본 k, 특징 n) · gray: (묶음, 높이, 너비) · color: 채널 우선 (묶음, 채널, 높이, 너비) 또는 채널 마지막 · text: (묶음, 토큰 수, 임베딩 차원) */
const TENSOR_KINDS=['table','gray','color','text'];
function tensorShape(kind,batch,o={}){
 const n=o.features||4,h=o.side||28,d=o.dim||64,T=o.tokens||12;
 const shape={table:[batch,n],gray:[batch,h,h],color:o.last?[batch,h,h,3]:[batch,3,h,h],text:[batch,T,d]}[kind];
 const axes={table:['표본 수','특징 수'],gray:['이미지 수','높이','너비'],color:o.last?['이미지 수','높이','너비','채널']:['이미지 수','채널','높이','너비'],text:['문장 수','토큰 수','임베딩 차원']}[kind];
 const one=shape.slice(1),elements=shape.reduce((a,b)=>a*b,1);
 return {shape,axes,rank:shape.length,one,elements,bytes:elements*4};
}
/* 문장 길이를 가장 긴 문장에 맞출 때 채워 넣는 패딩 토큰 수 */
function padding(lengths){const T=Math.max(...lengths);return {T,pads:lengths.map(l=>T-l),total:lengths.reduce((s,l)=>s+T-l,0)};}

/* 2~3장: 카페 8일 기록. x = 최고 기온 − 20 (℃), y = 아이스 음료 판매(잔). 설명용으로 정한 가상 값이다.
   outlier를 켜면 마지막 날(x = 7)의 판매를 41잔에서 9잔으로 바꾼다(기계 고장으로 오후에 팔지 못한 날). */
const LINE={x:[0,1,2,3,4,5,6,7],y:[12,15,21,22,28,33,34,41]};
const OUTLIER_Y=9;
function lineData(outlier=false){const y=[...LINE.y];if(outlier)y[7]=OUTLIER_Y;return {x:[...LINE.x],y};}
function lineLoss(w,b,D=LINE){
 const res=D.x.map((x,i)=>w*x+b-D.y[i]),n=res.length,mse=res.reduce((s,e)=>s+e*e,0)/n,mae=res.reduce((s,e)=>s+Math.abs(e),0)/n;
 return {res,mse,mae,rmse:Math.sqrt(mse),bias:res.reduce((s,e)=>s+e,0)/n};
}
/* MSE를 가장 작게 하는 선(최소제곱). 닫힌 식으로 구해 경사하강의 도착점과 비교한다. */
function lineFit(D=LINE){
 const n=D.x.length,mx=D.x.reduce((a,b)=>a+b,0)/n,my=D.y.reduce((a,b)=>a+b,0)/n;
 let sxy=0,sxx=0;D.x.forEach((x,i)=>{sxy+=(x-mx)*(D.y[i]-my);sxx+=(x-mx)**2;});
 const w=sxy/sxx;return {w,b:my-w*mx};
}
/* MSE의 기울기: ∂L/∂w = 2·평균(오차·x), ∂L/∂b = 2·평균(오차). idx는 기울기를 어림할 표본 번호(미니배치). */
function lineGrad(w,b,D=LINE,idx=null){
 const I=idx||D.x.map((_,i)=>i);let gw=0,gb=0;
 I.forEach(i=>{const e=w*D.x[i]+b-D.y[i];gw+=2*e*D.x[i];gb+=2*e;});
 return {gw:gw/I.length,gb:gb/I.length};
}
/* 3장 실험 1: b를 고정하고 w만 움직인다. L(w)는 포물선이고 걸음은 w ← w − η·dL/dw. */
function slopeWalk(w0,lr,steps,b=12,D=LINE){
 const path=[w0];let w=w0;
 for(let t=0;t<steps;t++){w-=lr*lineGrad(w,b,D).gw;if(!Number.isFinite(w)||Math.abs(w)>1e6)return {path,diverged:t+1,b};path.push(w);}
 return {path,diverged:0,b};
}
/* w 방향 곡률: d²L/dw² = 2·평균(x²). 학습률이 2/곡률을 넘으면 걸음마다 멀어진다. */
function slopeLimit(D=LINE){const c=2*D.x.reduce((s,x)=>s+x*x,0)/D.x.length;return {curvature:c,limit:2/c};}
/* 3장 실험 2: w와 b를 함께 찾는다. B = 8이면 전체 배치(epoch마다 1번 갱신), 작으면 epoch마다 섞어 8/B번 갱신한다.
   beta > 0이면 모멘텀 v ← βv + g, 걸음은 η·v. 갱신마다 8점 전체의 MSE를 다시 재어 기록한다. */
function descend({B=8,lr=0.02,epochs=30,beta=0,seed=1,start=[0,0]}={},D=LINE){
 const n=D.x.length,r=rng(seed*97+5),idx=D.x.map((_,i)=>i);let [w,b]=start,vw=0,vb=0;
 const steps=[],first=lineLoss(w,b,D).mse,epochLoss=[first];let diverged=0;
 outer:for(let e=0;e<epochs;e++){
  if(B<n)for(let i=n-1;i>0;i--){const j=Math.floor(r()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]];}
  for(let s=0;s<n;s+=B){const g=lineGrad(w,b,D,B<n?idx.slice(s,s+B):null);
   vw=beta*vw+g.gw;vb=beta*vb+g.gb;w-=lr*vw;b-=lr*vb;
   const L=lineLoss(w,b,D).mse;if(!Number.isFinite(L)||L>1e9){diverged=steps.length+1;break outer;}steps.push(L);}
  epochLoss.push(steps[steps.length-1]);
 }
 let up=0;for(let i=1;i<steps.length;i++)if(steps[i]>steps[i-1])up++;
 const best=lineFit(D),floor=lineLoss(best.w,best.b,D).mse;
 return {B,lr,beta,epochs,perEpoch:Math.ceil(n/B),updates:steps.length,steps,epochLoss,first,w,b,mse:diverged?Infinity:lineLoss(w,b,D).mse,floor,best,upFrac:up/Math.max(1,steps.length-1),diverged};
}

/* 활성화 함수와 도함수 */
const SQ=Math.sqrt(2/Math.PI);
const sigmoid=z=>{if(z>=0)return 1/(1+Math.exp(-z));const e=Math.exp(z);return e/(1+e);};
const ACT={
 sigmoid:[sigmoid,z=>{const s=sigmoid(z);return s*(1-s);}],
 tanh:[Math.tanh,z=>1-Math.tanh(z)**2],
 relu:[z=>z>0?z:0,z=>z>0?1:0],
 leaky:[z=>z>0?z:0.01*z,z=>z>0?1:0.01],
 gelu:[z=>0.5*z*(1+Math.tanh(SQ*(z+0.044715*z**3))),z=>{const u=SQ*(z+0.044715*z**3),t=Math.tanh(u);return 0.5*(1+t)+0.5*z*(1-t*t)*SQ*(1+3*0.044715*z*z);}],
 swish:[z=>z*sigmoid(z),z=>{const s=sigmoid(z);return s+z*s*(1-s);}],
 linear:[z=>z,()=>1]
};
const act=(name,z)=>ACT[name][0](z),dact=(name,z)=>ACT[name][1](z);

/* 4장: 퍼셉트론 학습 규칙. w←w+lr·(y−ŷ)·x, 가중치와 편향은 0에서 출발한다. */
const GATES={AND:[0,0,0,1],OR:[0,1,1,1],NAND:[1,1,1,0],XOR:[0,1,1,0]};
const CORNERS=[[0,0],[0,1],[1,0],[1,1]];
function perceptron(gate,epochs,lr=0.1){
 let w=[0,0],b=0;const hist=[];const Y=GATES[gate];
 for(let e=0;e<epochs;e++){let err=0;
  CORNERS.forEach((x,i)=>{const yh=w[0]*x[0]+w[1]*x[1]+b>=0?1:0,d=Y[i]-yh;if(d){err++;w=[w[0]+lr*d*x[0],w[1]+lr*d*x[1]];b+=lr*d;}});
  hist.push({w:[...w],b,errors:err});}
 const conv=hist.findIndex(h=>h.errors===0);
 return {w,b,hist,converged:conv>=0,convergedAt:conv+1,predict:CORNERS.map(x=>w[0]*x[0]+w[1]*x[1]+b>=0?1:0)};
}

/* 5장: 손으로 정한 2-2-1 XOR 망. k는 가중치 크기, 은닉 1은 OR, 은닉 2는 NAND, 출력은 AND를 흉내 낸다. */
function xorForward(k,name='sigmoid'){
 const f=z=>name==='linear'?z:sigmoid(z);
 return CORNERS.map(([a,b])=>{const h1=f(k*a+k*b-k/2),h2=f(-k*a-k*b+1.5*k),o=f(k*h1+k*h2-1.5*k);return {x:[a,b],h1,h2,out:o};});
}
/* 층의 파라미터 수: 층마다 (앞 층 뉴런 수 × 이 층 뉴런 수) 가중치와 이 층 뉴런 수만큼의 편향 */
function mlpParams(sizes){let n=0;for(let i=1;i<sizes.length;i++)n+=sizes[i-1]*sizes[i]+sizes[i];return n;}

/* 6장: 뉴런 하나의 연쇄법칙. L=(σ(w·x+b)−y)². 국소 도함수를 곱해 dL/dw를 구하고 중앙 차분과 비교한다. */
function chain(w,x=1.5,b=-0.5,y=1){
 const z=w*x+b,a=sigmoid(z),L=(a-y)**2,dLda=2*(a-y),dadz=a*(1-a),dLdz=dLda*dadz;
 const h=1e-5,Lw=v=>(sigmoid(v*x+b)-y)**2,num=(Lw(w+h)-Lw(w-h))/(2*h);
 return {z,a,L,dLda,dadz,dLdz,dLdw:dLdz*x,dLdb:dLdz,numeric:num};
}

/* 분류 데이터: 원 모양 경계(가로세로 [-1,1], 반지름 0.8이면 원 안과 밖이 거의 반반: π·0.64/4 ≈ 0.503) 또는 XOR 네 점 */
const CIRCLE_R2=0.64;
function dataset(kind,n,seed){
 if(kind==='xor')return {X:CORNERS.map(p=>[...p]),Y:[...GATES.XOR]};
 const r=rng(seed),X=[],Y=[];
 for(let i=0;i<n;i++){const p=[r()*2-1,r()*2-1];X.push(p);Y.push(p[0]**2+p[1]**2<CIRCLE_R2?1:0);r();}
 return {X,Y};
}

/* 초기화: Xavier는 분산 2/(fan_in+fan_out), He는 2/fan_in */
function initStd(init,nin,nout){return {xavier:Math.sqrt(2/(nin+nout)),he:Math.sqrt(2/nin)}[init];}
function build(sizes,init,seed){
 const r=rng(seed*7919+13);
 return sizes.slice(1).map((nout,l)=>{const nin=sizes[l],s=initStd(init,nin,nout);
  const W=new Float64Array(nout*nin);for(let i=0;i<W.length;i++)W[i]=s*normal(r);return {W,b:new Float64Array(nout),nin,nout};});
}

/* 순전파: 은닉층은 선택한 활성화, 출력층은 시그모이드 확률. 층마다 작업 공간(ws)에 z·a·δ를 담는다. */
function workspace(net){return net.map(L=>({z:new Float64Array(L.nout),a:new Float64Array(L.nout),d:new Float64Array(L.nout)}));}
function forward(net,ws,x,af){
 let a=x;const last=net.length-1;
 for(let l=0;l<=last;l++){const L=net[l],w=ws[l],n=L.nin;
  for(let o=0;o<L.nout;o++){let s=L.b[o];const off=o*n;for(let i=0;i<n;i++)s+=L.W[off+i]*a[i];w.z[o]=s;w.a[o]=l===last?sigmoid(s):af(s);}
  a=w.a;}
 return a[0];
}
function predict(net,x,name){return forward(net,workspace(net),Float64Array.from(x),ACT[name][0]);}

/* 역전파: 교차 엔트로피+시그모이드면 출력 δ=p−y, 제곱 오차면 δ=2(p−y)p(1−p). 기울기를 합산하고 나중에 표본 수로 나눈다. */
function backward(net,ws,x,y,df,loss,grads){
 const last=net.length-1,p=ws[last].a[0];ws[last].d[0]=loss==='mse'?2*(p-y)*p*(1-p):p-y;
 for(let l=last;l>=0;l--){const L=net[l],w=ws[l],g=grads[l],a=l?ws[l-1].a:x,n=L.nin;
  for(let o=0;o<L.nout;o++){const d=w.d[o],off=o*n;g.b[o]+=d;for(let i=0;i<n;i++)g.W[off+i]+=d*a[i];}
  if(l===0)break;const pw=ws[l-1];
  for(let i=0;i<n;i++){let s=0;for(let o=0;o<L.nout;o++)s+=L.W[o*n+i]*w.d[o];pw.d[i]=s*df(pw.z[i]);}}
}

const bce=(p,y)=>{const q=Math.min(1-1e-7,Math.max(1e-7,p));return -(y*Math.log(q)+(1-y)*Math.log(1-q));};
function evaluate(net,D,name){const ws=workspace(net),af=ACT[name][0];let loss=0,hit=0;D.X.forEach((x,i)=>{const p=forward(net,ws,x,af);loss+=bce(p,D.Y[i]);hit+=(p>=0.5?1:0)===D.Y[i]?1:0;});return {loss:loss/D.X.length,acc:hit/D.X.length};}

/* 작은 분류망의 학습기: 전체 배치 경사하강(한 epoch = 한 번 갱신). 6장 XOR 학습과 마지막 과제가 쓴다.
   depth 0이면 은닉층이 없는 선 하나(로지스틱 회귀)다. 기록하는 손실은 어떤 손실로 학습하든 교차 엔트로피로 잰다. */
const DEFAULT={data:'circle',n:80,valN:200,width:8,depth:1,act:'tanh',init:'xavier',lr:0.5,epochs:300,loss:'bce',seed:1};
function train(options){
 const c={...DEFAULT,...options},D=dataset(c.data,c.n,c.seed),V=c.data==='xor'?D:dataset('circle',c.valN,c.seed+1000);
 const X=D.X.map(p=>Float64Array.from(p)),VX={X:V.X.map(p=>Float64Array.from(p)),Y:V.Y};
 const net=build([2,...Array(c.depth).fill(c.width),1],c.init,c.seed),params=net.flatMap(L=>[L.W,L.b]);
 const ws=workspace(net),af=ACT[c.act][0],df=ACT[c.act][1],out={loss:[],diverged:0};
 for(let t=0;t<c.epochs;t++){
  const grads=net.map(L=>({W:new Float64Array(L.W.length),b:new Float64Array(L.b.length)}));let loss=0;
  X.forEach((x,i)=>{const p=forward(net,ws,x,af);loss+=bce(p,D.Y[i]);backward(net,ws,x,D.Y[i],df,c.loss,grads);});
  loss/=X.length;if(!Number.isFinite(loss)){out.diverged=t+1;break;}
  if(t===0)out.gradNorm=grads.map(g=>Math.sqrt(g.W.reduce((s,v)=>s+v*v,0)/g.W.length)/X.length);
  grads.flatMap(g=>[g.W,g.b]).forEach((g,k)=>{const p=params[k];for(let i=0;i<g.length;i++)p[i]-=c.lr*g[i]/X.length;});
  out.loss.push(loss);
  if(!params.every(p=>p.every(Number.isFinite))){out.diverged=t+1;break;}
 }
 const tr=evaluate(net,{X,Y:D.Y},c.act),va=evaluate(net,VX,c.act);
 return {...out,net,cfg:c,params:mlpParams([2,...Array(c.depth).fill(c.width),1]),trainAcc:tr.acc,valAcc:va.acc,trainLoss:tr.loss,valLoss:va.loss,data:D};
}

/* 판별 지도: 격자마다 원 안일 확률 */
function decisionGrid(net,name,n=20){const g=[],ws=workspace(net),af=ACT[name][0];for(let r=0;r<n;r++){const row=[];for(let c=0;c<n;c++){const x=-1+(c+.5)*2/n,y=1-(r+.5)*2/n;row.push(forward(net,ws,Float64Array.of(x,y),af));}g.push(row);}return g;}

/* 7장: 폭 width인 깊은 망에 무작위 입력을 흘려 층마다 활성값 표준편차(순방향)와 기울기 크기(역방향)를 잰다. He 초기화로 고정. */
function deepStats(name,depth,width=48,seed=3,batch=12){
 const r=rng(seed),Ws=[],s=initStd('he',width,width);for(let l=0;l<depth;l++){const W=new Float64Array(width*width);for(let i=0;i<W.length;i++)W[i]=s*normal(r);Ws.push(W);}
 const fwd=new Array(depth).fill(0),bwd=new Array(depth).fill(0);
 for(let n=0;n<batch;n++){let a=Array.from({length:width},()=>normal(r));const zs=[];
  Ws.forEach((W,l)=>{const z=new Array(width);for(let o=0;o<width;o++){let t=0;for(let i=0;i<width;i++)t+=W[o*width+i]*a[i];z[o]=t;}zs.push(z);a=z.map(v=>act(name,v));fwd[l]+=std(a)/batch;});
  let g=Array.from({length:width},()=>normal(r));
  for(let l=depth-1;l>=0;l--){const d=g.map((v,i)=>v*dact(name,zs[l][i]));bwd[l]+=Math.sqrt(d.reduce((t,v)=>t+v*v,0)/width)/batch;const W=Ws[l],ng=new Array(width).fill(0);for(let i=0;i<width;i++){let t=0;for(let o=0;o<width;o++)t+=W[o*width+i]*d[o];ng[i]=t;}g=ng;}
 }
 return {fwd,bwd};
}
function std(a){const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/a.length);}
/* 활성화 미분의 상한만 곱한 값: 시그모이드 층 L개를 거슬러 가면 기울기는 많아야 0.25^L배가 된다(가중치 크기는 뺀 계산). */
function vanish(layers,slope=0.25){return slope**layers;}

/* 2장: 정답이 1인 표본에서 예측 확률 p에 대한 손실과, 로짓 z에 대한 기울기 */
function lossAt(p,y=1){const q=Math.min(1-1e-7,Math.max(1e-7,p));return {mse:(q-y)**2,bce:bce(q,y),gMse:2*(q-y)*q*(1-q),gBce:q-y};}

/* 8장: 같은 입력을 받는 첫 층의 파라미터 수를 구조별로 센다. hidden은 그 층이 내는 값의 수(필터 수·은닉 크기).
   image: 완전 연결은 (픽셀 수·채널)×hidden + hidden, 합성곱 3×3은 (9·채널)×hidden + hidden으로 이미지 크기와 무관하다.
   sequence: 펼쳐서 완전 연결하면 (길이·특징)×hidden + hidden, RNN은 특징×hidden + hidden² + hidden,
   셀프 어텐션 한 층(헤드 하나, 질의·열쇠·값·출력 네 행렬과 편향)은 4(특징² + 특징)로 둘 다 길이와 무관하다. */
function archParams(kind,size,o={}){
 const H=o.hidden||64;
 if(kind==='image'){const C=o.channels||1;return {dense:size*size*C*H+H,conv:9*C*H+H,inputs:size*size*C};}
 const D=o.features||32;return {dense:size*D*H+H,rnn:D*H+H*H+H,attention:4*(D*D+D),inputs:size*D};
}

/* 확인 문제 보기 순서: 화면 자리 k에 원래 보기 번호를 돌려 놓아 정답이 target 자리에 오게 한다. */
function quizOrder(n,answer,target){return Array.from({length:n},(_,k)=>((answer-target+k)%n+n)%n);}
const NCMath={quizOrder,rng,normal,TENSOR_KINDS,tensorShape,padding,LINE,OUTLIER_Y,lineData,lineLoss,lineFit,lineGrad,slopeWalk,slopeLimit,descend,sigmoid,act,dact,ACT,GATES,CORNERS,perceptron,xorForward,mlpParams,chain,dataset,initStd,build,forward,predict,workspace,bce,evaluate,train,decisionGrid,deepStats,std,vanish,lossAt,archParams,CIRCLE_R2,DEFAULT};
if(typeof module!=='undefined')module.exports=NCMath;else root.NCMath=NCMath;
})(typeof window!=='undefined'?window:globalThis);
