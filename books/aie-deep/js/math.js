/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   핵심은 브라우저 안에서 실제로 학습하는 작은 신경망(train)이다. 책 전체의 공통 사례인
   "평면 위 점이 원 안(1)인지 밖(0)인지 판별하는 작은 신경망"을 이 함수 하나가 계산한다.
   단위: 입력 좌표는 [-1,1] 범위, 손실은 표본 평균, 학습은 전체 배치 경사하강(한 epoch = 한 번 갱신). */
(function(root){
'use strict';
const CIRCLE_R2=0.64; /* 반지름 0.8: 정사각형 [-1,1]² 안에서 원 안과 밖이 거의 반반이 된다(π·0.64/4 ≈ 0.503). */

/* 재현 가능한 난수(mulberry32)와 표준정규분포(Box-Muller) */
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function normal(r){const u=1-r(),v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}

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

/* 1장: 퍼셉트론 학습 규칙. w←w+lr·(y−ŷ)·x, 가중치와 편향은 0에서 출발한다. */
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

/* 2장: 손으로 정한 2-2-1 XOR 망. k는 가중치 크기, 은닉 1은 OR, 은닉 2는 NAND, 출력은 AND를 흉내 낸다. */
function xorForward(k,name='sigmoid'){
 const f=z=>name==='linear'?z:sigmoid(z);
 return CORNERS.map(([a,b])=>{const h1=f(k*a+k*b-k/2),h2=f(-k*a-k*b+1.5*k),o=f(k*h1+k*h2-1.5*k);return {x:[a,b],h1,h2,out:o};});
}

/* 3장: 뉴런 하나의 연쇄법칙. L=(σ(w·x+b)−y)². 국소 도함수를 곱해 dL/dw를 구하고 중앙 차분과 비교한다. */
function chain(w,x=1.5,b=-0.5,y=1){
 const z=w*x+b,a=sigmoid(z),L=(a-y)**2,dLda=2*(a-y),dadz=a*(1-a),dLdz=dLda*dadz;
 const h=1e-5,Lw=v=>(sigmoid(v*x+b)-y)**2,num=(Lw(w+h)-Lw(w-h))/(2*h);
 return {z,a,L,dLda,dadz,dLdz,dLdw:dLdz*x,dLdb:dLdz,numeric:num};
}

/* 데이터: 원 판별(가로세로 [-1,1], 반지름 0.8) 또는 XOR 네 점. noise는 학습 라벨을 뒤집을 확률. */
function dataset(kind,n,seed,noise=0){
 if(kind==='xor')return {X:CORNERS.map(p=>[...p]),Y:[...GATES.XOR]};
 const r=rng(seed),X=[],Y=[];
 for(let i=0;i<n;i++){const p=[r()*2-1,r()*2-1];let y=p[0]**2+p[1]**2<CIRCLE_R2?1:0;if(r()<noise)y=1-y;X.push(p);Y.push(y);}
 return {X,Y};
}

/* 초기화: 표준편차 std로 정규분포를 뽑는다. Xavier는 2/(fan_in+fan_out), He는 2/fan_in 분산. */
function initStd(init,nin,nout){return {zero:0,small:0.01,std:1,xavier:Math.sqrt(2/(nin+nout)),he:Math.sqrt(2/nin)}[init];}
function build(sizes,init,seed){
 const r=rng(seed*7919+13);
 return sizes.slice(1).map((nout,l)=>{const nin=sizes[l],s=initStd(init,nin,nout);
  const W=new Float64Array(nout*nin);for(let i=0;i<W.length;i++)W[i]=s*normal(r);return {W,b:new Float64Array(nout),nin,nout};});
}

/* 순전파: 은닉층은 선택한 활성화(+역드롭아웃), 출력층은 시그모이드 확률.
   속도를 위해 층마다 미리 만든 작업 공간(ws)에 z·a·마스크·δ를 담는다. */
function workspace(net){return net.map(L=>({z:new Float64Array(L.nout),a:new Float64Array(L.nout),m:new Float64Array(L.nout).fill(1),d:new Float64Array(L.nout)}));}
function forward(net,ws,x,af,drop=0,r=null){
 let a=x;const last=net.length-1;
 for(let l=0;l<=last;l++){const L=net[l],w=ws[l],n=L.nin;
  for(let o=0;o<L.nout;o++){let s=L.b[o];const off=o*n;for(let i=0;i<n;i++)s+=L.W[off+i]*a[i];w.z[o]=s;
   if(l===last)w.a[o]=sigmoid(s);else{const m=drop>0&&r?(r()<drop?0:1/(1-drop)):1;w.m[o]=m;w.a[o]=af(s)*m;}}
  a=w.a;}
 return a[0];
}
function predict(net,x,name){return forward(net,workspace(net),Float64Array.from(x),ACT[name][0]);}

/* 역전파: BCE+시그모이드면 출력 δ=p−y, MSE면 δ=2(p−y)p(1−p). 기울기를 합산하고 나중에 배치 크기로 나눈다. */
function backward(net,ws,x,y,df,loss,grads){
 const last=net.length-1,p=ws[last].a[0];ws[last].d[0]=loss==='mse'?2*(p-y)*p*(1-p):p-y;
 for(let l=last;l>=0;l--){const L=net[l],w=ws[l],g=grads[l],a=l?ws[l-1].a:x,n=L.nin;
  for(let o=0;o<L.nout;o++){const d=w.d[o],off=o*n;g.b[o]+=d;for(let i=0;i<n;i++)g.W[off+i]+=d*a[i];}
  if(l===0)break;const pw=ws[l-1];
  for(let i=0;i<n;i++){let s=0;for(let o=0;o<L.nout;o++)s+=L.W[o*n+i]*w.d[o];pw.d[i]=s*df(pw.z[i])*pw.m[i];}}
}

/* 옵티마이저: SGD(+L2), 모멘텀(β=0.9), AdamW(β1=0.9, β2=0.999, 가중치 감쇠 분리) */
function step(p,g,st,opt,lr,t,wd){
 const c1=1-0.9**t,c2=1-0.999**t;
 for(let i=0;i<p.length;i++){
  if(opt==='sgd')p[i]-=lr*(g[i]+wd*p[i]);
  else if(opt==='momentum'){st.v[i]=0.9*st.v[i]+g[i]+wd*p[i];p[i]-=lr*st.v[i];}
  else{st.m[i]=0.9*st.m[i]+0.1*g[i];st.v[i]=0.999*st.v[i]+0.001*g[i]*g[i];p[i]-=lr*((st.m[i]/c1)/(Math.sqrt(st.v[i]/c2)+1e-8)+wd*p[i]);}
 }
}

/* 학습률 스케줄. t는 0부터, T는 전체 단계, warm은 워밍업 비율(0~1). */
function lrAt(kind,t,T,peak,warm=0.05){
 const lo=peak*0.01,cos=(s,n)=>lo+0.5*(peak-lo)*(1+Math.cos(Math.PI*Math.min(1,s/Math.max(1,n))));
 if(kind==='step')return peak*0.1**Math.floor(t/Math.ceil(T/3));
 if(kind==='cosine')return cos(t,T);
 if(kind==='warmcos'){const W=Math.max(1,Math.round(T*warm));return t<W?peak*(t+1)/W:cos(t-W,T-W);}
 if(kind==='onecycle'){const h=T/2;return t<h?peak/25+(peak-peak/25)*t/h:peak-(peak-peak/1000)*(t-h)/h;}
 return peak;
}

const bce=(p,y)=>{const q=Math.min(1-1e-7,Math.max(1e-7,p));return -(y*Math.log(q)+(1-y)*Math.log(1-q));};
function evaluate(net,D,name){const ws=workspace(net),af=ACT[name][0];let loss=0,hit=0;D.X.forEach((x,i)=>{const p=forward(net,ws,x,af);loss+=bce(p,D.Y[i]);hit+=(p>=0.5?1:0)===D.Y[i]?1:0;});return {loss:loss/D.X.length,acc:hit/D.X.length};}

/* 공통 사례의 학습기. cfg 기본값은 아래 DEFAULT. bug는 디버깅 장의 의도적 고장이다. */
const DEFAULT={data:'circle',n:80,valN:200,noise:0,width:8,depth:1,act:'tanh',init:'xavier',opt:'adam',lr:0.05,epochs:200,wd:0,dropout:0,schedule:'const',warm:0.05,loss:'bce',bug:'none',seed:1};
function train(options){
 const c={...DEFAULT,...options},r=rng(c.seed*31+7),D=dataset(c.data,c.n,c.seed,c.noise),V=c.data==='xor'?D:dataset('circle',c.valN,c.seed+1000,0);
 if(c.bug==='labels'){for(let i=D.Y.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[D.Y[i],D.Y[j]]=[D.Y[j],D.Y[i]];}}
 const scale=c.bug==='scale'?50:1,X=D.X.map(p=>Float64Array.from(p,v=>v*scale)),VX={X:V.X.map(p=>Float64Array.from(p,v=>v*scale)),Y:V.Y};
 const net=build([2,...Array(c.depth).fill(c.width),1],c.init,c.seed),params=net.flatMap(L=>[L.W,L.b]);
 const ws=workspace(net),af=ACT[c.act][0],df=ACT[c.act][1],st=params.map(p=>({m:new Float64Array(p.length),v:new Float64Array(p.length)})),acc=params.map(p=>new Float64Array(p.length));
 const out={loss:[],val:[],lrs:[],diverged:0};
 for(let t=0;t<c.epochs;t++){
  const grads=net.map(L=>({W:new Float64Array(L.W.length),b:new Float64Array(L.b.length)}));let loss=0;
  X.forEach((x,i)=>{const p=forward(net,ws,x,af,c.dropout,r);loss+=c.loss==='mse'?(p-D.Y[i])**2:bce(p,D.Y[i]);backward(net,ws,x,D.Y[i],df,c.loss,grads);});
  loss/=X.length;if(!Number.isFinite(loss)){out.diverged=t+1;break;}
  if(t===0)out.gradNorm=grads.map(g=>Math.sqrt(g.W.reduce((s,v)=>s+v*v,0)/g.W.length)/X.length);
  const lr=lrAt(c.schedule,t,c.epochs,c.lr,c.warm)*(c.bug==='lr'?200:1);
  grads.flatMap(g=>[g.W,g.b]).forEach((g,k)=>{for(let i=0;i<g.length;i++){g[i]/=X.length;if(c.bug==='nozero'){acc[k][i]+=g[i];g[i]=acc[k][i];}}step(params[k],g,st[k],c.opt,lr,t+1,c.wd);});
  const every=Math.ceil(c.epochs/100);out.loss.push(c.loss==='mse'?evaluate(net,{X,Y:D.Y},c.act).loss:loss);out.val.push(t%every===0||t===c.epochs-1?evaluate(net,VX,c.act).loss:null);out.lrs.push(lr);
  if(!params.every(p=>p.every(Number.isFinite))){out.diverged=t+1;break;}
 }
 const tr=evaluate(net,{X,Y:D.Y},c.act),va=evaluate(net,VX,c.act);
 return {...out,net,cfg:c,trainAcc:tr.acc,valAcc:va.acc,trainLoss:tr.loss,valLoss:va.loss,data:D};
}

/* 판별 지도: 격자마다 원 안일 확률 */
function decisionGrid(net,name,n=20,scale=1){const g=[],ws=workspace(net),af=ACT[name][0];for(let r=0;r<n;r++){const row=[];for(let c=0;c<n;c++){const x=-1+(c+.5)*2/n,y=1-(r+.5)*2/n;row.push(forward(net,ws,Float64Array.of(x*scale,y*scale),af));}g.push(row);}return g;}

/* 4·8장: 폭 width인 깊은 망에 무작위 입력을 흘려 층마다 활성값 표준편차(순방향)와 기울기 크기(역방향)를 잰다. */
function deepStats(name,init,depth,width=48,seed=3,batch=12){
 const r=rng(seed),Ws=[];for(let l=0;l<depth;l++){const s=initStd(init,width,width),W=new Float64Array(width*width);for(let i=0;i<W.length;i++)W[i]=s*normal(r);Ws.push(W);}
 const fwd=new Array(depth).fill(0),bwd=new Array(depth).fill(0);
 for(let n=0;n<batch;n++){let a=Array.from({length:width},()=>normal(r));const zs=[];
  Ws.forEach((W,l)=>{const z=new Array(width);for(let o=0;o<width;o++){let s=0;for(let i=0;i<width;i++)s+=W[o*width+i]*a[i];z[o]=s;}zs.push(z);a=z.map(v=>act(name,v));fwd[l]+=std(a)/batch;});
  let g=Array.from({length:width},()=>normal(r));
  for(let l=depth-1;l>=0;l--){const d=g.map((v,i)=>v*dact(name,zs[l][i]));bwd[l]+=Math.sqrt(d.reduce((s,v)=>s+v*v,0)/width)/batch;const W=Ws[l],ng=new Array(width).fill(0);for(let i=0;i<width;i++){let s=0;for(let o=0;o<width;o++)s+=W[o*width+i]*d[o];ng[i]=s;}g=ng;}
 }
 return {fwd,bwd};
}
function std(a){const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/a.length);}

/* 5장: 정답이 1인 표본에서 예측 확률 p에 대한 손실과, 로짓 z에 대한 기울기 */
function lossAt(p,y=1){const q=Math.min(1-1e-7,Math.max(1e-7,p));return {mse:(q-y)**2,bce:bce(q,y),gMse:2*(q-y)*q*(1-q),gBce:q-y,focal:(1-(y?q:1-q))**2*bce(q,y)};}
function smooth(k,alpha){return Array.from({length:k},(_,i)=>i===0?1-alpha+alpha/k:alpha/k);}

/* 6장: 좁고 긴 골짜기 f(x,y)=½(x²+25y²)에서 옵티마이저 경로 */
const VALLEY=[1,25];
function valley(opt,lr,steps=40,start=[-4,1.2]){
 let p=[...start];const path=[[...p]],m=[0,0],v=[0,0];
 for(let t=1;t<=steps;t++){const g=[VALLEY[0]*p[0],VALLEY[1]*p[1]];
  for(let i=0;i<2;i++){if(opt==='sgd')p[i]-=lr*g[i];else if(opt==='momentum'){m[i]=0.9*m[i]+g[i];p[i]-=lr*m[i];}else{m[i]=0.9*m[i]+0.1*g[i];v[i]=0.999*v[i]+0.001*g[i]**2;p[i]-=lr*(m[i]/(1-0.9**t))/(Math.sqrt(v[i]/(1-0.999**t))+1e-8);}}
  if(!p.every(Number.isFinite)||Math.abs(p[0])>1e6||Math.abs(p[1])>1e6)return {path,diverged:t,f:Infinity};path.push([...p]);}
 return {path,diverged:0,f:0.5*(VALLEY[0]*p[0]**2+VALLEY[1]*p[1]**2)};
}

/* 10장: 작은 자동미분 엔진. 노드는 [이름, 연산, 부모 목록]이고, 역위상 순서로 기울기를 더해 내려간다. */
const EXPR={
 reuse:{vars:{a:2,b:-3},nodes:[['c','a*b',['a','b']],['f','c+a',['c','a']]]},
 neuron:{vars:{w:0.8,x:1.5,b:-0.5,y:1},nodes:[['z1','w*x',['w','x']],['z','z1+b',['z1','b']],['s','σ(z)',['z']],['e','s−y',['s','y']],['L','e²',['e']]]}
};
function autodiff(name){
 const E=EXPR[name],val={...E.vars},local={};
 for(const [id,op,ps] of E.nodes){const [p,q]=ps.map(k=>val[k]);
  if(op.includes('*')){val[id]=p*q;local[id]=[q,p];}else if(op.includes('+')){val[id]=p+q;local[id]=[1,1];}
  else if(op.includes('−')){val[id]=p-q;local[id]=[1,-1];}else if(op.startsWith('σ')){val[id]=sigmoid(p);local[id]=[val[id]*(1-val[id])];}else{val[id]=p*p;local[id]=[2*p];}}
 const order=[...E.nodes].reverse(),grad=Object.fromEntries(Object.keys(val).map(k=>[k,0])),snaps=[];
 grad[order[0][0]]=1;snaps.push({node:null,grad:{...grad}});
 order.forEach(([id,,ps])=>{ps.forEach((k,i)=>{grad[k]+=grad[id]*local[id][i];});snaps.push({node:id,grad:{...grad}});});
 return {val,order:order.map(n=>n[0]),nodes:E.nodes,vars:Object.keys(E.vars),snaps,grad};
}

/* 10장: MLP 784-h1-h2-10의 파라미터 수와 메모리(바이트). 학습 중 Adam은 가중치·기울기·m·v 네 벌을 둔다. */
function mlpParams(sizes){let n=0;for(let i=1;i<sizes.length;i++)n+=sizes[i-1]*sizes[i]+sizes[i];return n;}
const DTYPE={float32:4,bfloat16:2,int8:1};
function memory(sizes,dtype){const n=mlpParams(sizes),b=DTYPE[dtype];return {params:n,weights:n*b,trainAdam:n*4*4};}

/* 11장: 기울기 검사. L(w)=(σ(w·x+b)−y)², 해석적 기울기와 중앙 차분의 상대 차이 */
function gradCheck(eps,bug='none'){
 const w=[0.4,-0.7,0.25],x=[1,0.5,-1.5],b=0.1,y=1,L=v=>(sigmoid(v.reduce((s,wi,i)=>s+wi*x[i],b))-y)**2;
 const s=sigmoid(w.reduce((s,wi,i)=>s+wi*x[i],b)),k=bug==='factor'?1:2,sign=bug==='sign'?-1:1;
 const ana=x.map(xi=>sign*k*(s-y)*s*(1-s)*xi),num=w.map((_,i)=>{const p=[...w],m=[...w];p[i]+=eps;m[i]-=eps;return (L(p)-L(m))/(2*eps);});
 const rel=ana.map((a,i)=>Math.abs(a-num[i])/Math.max(1e-12,Math.abs(a)+Math.abs(num[i])));
 return {ana,num,rel,max:Math.max(...rel)};
}

const A04Math={rng,normal,sigmoid,act,dact,ACT,GATES,CORNERS,perceptron,xorForward,chain,dataset,initStd,build,forward,predict,workspace,lrAt,bce,evaluate,train,decisionGrid,deepStats,std,lossAt,smooth,valley,VALLEY,autodiff,EXPR,mlpParams,memory,DTYPE,gradCheck,CIRCLE_R2,DEFAULT};
if(typeof module!=='undefined')module.exports=A04Math;else root.A04Math=A04Math;
})(typeof window!=='undefined'?window:globalThis);
