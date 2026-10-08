/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   모든 데이터는 공통 사례(가상의 작은 온라인 서점 결제 기록)를 흉내 낸 교육용 값이며, 시드를 고정해 매번 같은 결과가 나온다. */
(function(root){
'use strict';
/* ---------- 난수와 기초 통계 ---------- */
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function gauss(r){let u=0;while(u===0)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r());}
const sum=a=>a.reduce((s,x)=>s+x,0);
const mean=a=>a.length?sum(a)/a.length:0;
const variance=a=>{const m=mean(a);return a.length?mean(a.map(x=>(x-m)**2)):0;};
const std=a=>Math.sqrt(variance(a));
function quantile(a,q){const s=[...a].sort((x,y)=>x-y),p=(s.length-1)*q,i=Math.floor(p),f=p-i;return i+1<s.length?s[i]+(s[i+1]-s[i])*f:s[i];}
const sigmoid=z=>1/(1+Math.exp(-z));
const dist2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
function accuracy(pred,truth){let ok=0;pred.forEach((p,i)=>{if(p===truth[i])ok++;});return pred.length?ok/pred.length:0;}

/* ---------- 데이터: 두 무리(정상 0 · 사기 1) ---------- */
/* 중심 거리 sep만큼 떨어진 두 정규 무리. x=결제 금액(표준화), y=한 시간 결제 시도(표준화) */
function twoBlobs(seed,nPer,sep,spread=1){const r=rng(seed),out=[];
 for(let c=0;c<2;c++)for(let i=0;i<nPer;i++){const s=c?1:-1;out.push({x:s*sep/2*0.8+gauss(r)*spread,y:s*sep/2*0.6+gauss(r)*spread,c});}
 return out;}

/* ---------- 1장: 최근접 중심 분류기와 기준선 ---------- */
function centroids(points){const cs=[0,1].map(c=>{const p=points.filter(q=>q.c===c);return {x:mean(p.map(q=>q.x)),y:mean(p.map(q=>q.y))};});return cs;}
function centroidLab(sep){
 const train=twoBlobs(11,60,sep),test=twoBlobs(29,100,sep),cs=centroids(train);
 const pred=test.map(p=>dist2(p,cs[1])<dist2(p,cs[0])?1:0),truth=test.map(p=>p.c);
 const r=rng(5),guess=test.map(()=>r()<0.5?1:0);
 return {train,test,cs,acc:accuracy(pred,truth),random:accuracy(guess,truth),majority:0.5};}

/* ---------- 2장: 로지스틱 회귀(경사하강) ---------- */
function bce(points,m,weights){let s=0,wsum=0;points.forEach((p,i)=>{const w=weights?weights[i]:1,q=Math.min(1-1e-12,Math.max(1e-12,sigmoid(m.w[0]*p.x+m.w[1]*p.y+m.b)));s+=-w*(p.c*Math.log(q)+(1-p.c)*Math.log(1-q));wsum+=w;});return s/wsum;}
/* 표본 가중치 weights(없으면 1)로 epochs번 전체 배치 경사하강 */
function trainLogistic(points,epochs,lr=0.5,weights=null){
 const m={w:[0,0],b:0},W=weights||points.map(()=>1),wsum=sum(W);
 for(let e=0;e<epochs;e++){let g0=0,g1=0,gb=0;
  points.forEach((p,i)=>{const d=(sigmoid(m.w[0]*p.x+m.w[1]*p.y+m.b)-p.c)*W[i];g0+=d*p.x;g1+=d*p.y;gb+=d;});
  m.w[0]-=lr*g0/wsum;m.w[1]-=lr*g1/wsum;m.b-=lr*gb/wsum;}
 return m;}
function logisticLab(epochs){
 const data=twoBlobs(41,40,2.2),m=trainLogistic(data,epochs,0.5);
 const pred=data.map(p=>sigmoid(m.w[0]*p.x+m.w[1]*p.y+m.b)>=0.5?1:0);
 return {data,model:m,loss:bce(data,m),acc:accuracy(pred,data.map(p=>p.c))};}

/* ---------- 3장: 지니·엔트로피·정보 이득 ---------- */
function gini(counts){const n=sum(counts);return n?1-sum(counts.map(c=>(c/n)**2)):0;}
function entropy(counts){const n=sum(counts);return n?Math.max(0,-sum(counts.filter(c=>c>0).map(c=>c/n*Math.log2(c/n)))):0;}
/* 결제 시도 횟수(1~9)와 사기 여부 24건 */
const SPLIT_DATA=[[1,0],[1,0],[2,0],[2,0],[2,0],[3,0],[3,0],[3,1],[3,0],[4,0],[4,0],[4,1],[5,0],[5,1],[5,0],[6,1],[6,1],[6,0],[7,1],[7,1],[8,1],[8,1],[9,1],[9,0]];
function splitScores(t,data=SPLIT_DATA){
 const cnt=rows=>[rows.filter(r=>r[1]===0).length,rows.filter(r=>r[1]===1).length];
 const L=data.filter(r=>r[0]<=t),R=data.filter(r=>r[0]>t),P=cnt(data),cl=cnt(L),cr=cnt(R),n=data.length;
 const wg=(L.length*gini(cl)+R.length*gini(cr))/n,we=(L.length*entropy(cl)+R.length*entropy(cr))/n;
 return {left:cl,right:cr,parentGini:gini(P),parentEntropy:entropy(P),childGini:wg,childEntropy:we,gainGini:gini(P)-wg,gainEntropy:entropy(P)-we};}
function bestSplit(data=SPLIT_DATA){let best=null;for(let t=1.5;t<9;t+=1){const s=splitScores(t,data);if(!best||s.gainEntropy>best.gain)best={t,gain:s.gainEntropy};}return best;}

/* ---------- 4장: kNN과 선형 SVM ---------- */
/* 사기 무리가 두 곳(금액 큰 결제, 새벽 반복 시도)에 있는 데이터: 중심 하나로는 설명되지 않는다 */
function knnData(seed,n){const r=rng(seed),out=[];
 for(let i=0;i<n;i++){const k=r();let p;
  if(k<0.55)p={x:gauss(r)*0.9,y:gauss(r)*0.9,c:0};
  else if(k<0.78)p={x:2.1+gauss(r)*0.6,y:1.6+gauss(r)*0.6,c:1};
  else p={x:-2+gauss(r)*0.6,y:1.9+gauss(r)*0.6,c:1};
  out.push(p);}
 return out;}
function knnPredict(train,q,k){const near=train.map(p=>[dist2(p,q),p.c]).sort((a,b)=>a[0]-b[0]).slice(0,k);const v=sum(near.map(x=>x[1]));return v*2>near.length?1:0;}
function knnLab(k){
 const train=knnData(71,60),test=knnData(73,200);
 const accTest=accuracy(test.map(p=>knnPredict(train,p,k)),test.map(p=>p.c));
 const accTrain=accuracy(train.map(p=>knnPredict(train,p,k)),train.map(p=>p.c));
 const grid=[];for(let j=0;j<14;j++){const row=[];for(let i=0;i<24;i++)row.push(knnPredict(train,{x:-4+i*8/23,y:-3+j*6.5/13},k));grid.push(row);}
 return {train,accTest,accTrain,grid};}
/* 쌍대 좌표 하강법(Hsieh 외 2008)으로 푸는 L1 손실 선형 SVM. 편향은 상수 특성 1로 붙여 약하게 규제되는 단순화 */
function svmData(){const r=rng(97),out=[];
 for(let i=0;i<14;i++)out.push({x:-1.4+gauss(r)*0.55,y:-0.9+gauss(r)*0.55,c:-1});
 for(let i=0;i<14;i++)out.push({x:1.4+gauss(r)*0.55,y:0.9+gauss(r)*0.55,c:1});
 out.push({x:-0.7,y:-0.5,c:1});return out;}
function trainSVM(points,C,sweeps=3000){
 const a=points.map(()=>0);let w=[0,0,0];
 for(let s=0;s<sweeps;s++)points.forEach((p,i)=>{const xi=[p.x,p.y,1],q=p.x*p.x+p.y*p.y+1,G=p.c*(w[0]*xi[0]+w[1]*xi[1]+w[2])-1;
  const na=Math.min(C,Math.max(0,a[i]-G/q)),d=(na-a[i])*p.c;if(d!==0){w=[w[0]+d*xi[0],w[1]+d*xi[1],w[2]+d];a[i]=na;}});
 return {w:[w[0],w[1]],b:w[2],alpha:a};}
function svmLab(logC){
 const data=svmData(),C=10**logC,m=trainSVM(data,C),norm=Math.hypot(m.w[0],m.w[1]);
 const f=p=>m.w[0]*p.x+m.w[1]*p.y+m.b,margins=data.map(p=>p.c*f(p));
 return {data,model:m,C,width:norm>0?2/norm:Infinity,support:m.alpha.filter(v=>v>1e-6).length,inside:margins.filter(v=>v<1-1e-6).length,errors:margins.filter(v=>v<0).length,hinge:mean(margins.map(v=>Math.max(0,1-v)))};}

/* ---------- 5장: k-평균과 실루엣 ---------- */
function clusterData(){const r=rng(131),cs=[[-2,-1.2],[2.2,-0.8],[0.2,2.2]],out=[];cs.forEach(c=>{for(let i=0;i<20;i++)out.push({x:c[0]+gauss(r)*0.7,y:c[1]+gauss(r)*0.7});});return out;}
/* K개 중심을 고정된 초기값에서 시작해 steps번 할당·갱신한다. 초기값은 일부러 한쪽에 몰아 둔다 */
function kmeans(points,K,steps){
 let cs=points.slice(0,K).map(p=>({x:p.x+0.3*K,y:p.y}));const hist=[];
 const assign=()=>points.map(p=>{let b=0;cs.forEach((c,j)=>{if(dist2(p,c)<dist2(p,cs[b]))b=j;});return b;});
 let lab=assign();hist.push({cs:cs.map(c=>({...c})),lab,inertia:sum(points.map((p,i)=>dist2(p,cs[lab[i]])))});
 for(let s=0;s<steps;s++){cs=cs.map((c,j)=>{const m=points.filter((_,i)=>lab[i]===j);return m.length?{x:mean(m.map(p=>p.x)),y:mean(m.map(p=>p.y))}:c;});
  const nl=assign(),moved=nl.filter((v,i)=>v!==lab[i]).length;lab=nl;hist.push({cs:cs.map(c=>({...c})),lab,moved,inertia:sum(points.map((p,i)=>dist2(p,cs[lab[i]])))});}
 return hist;}
function silhouette(points,lab){const K=Math.max(...lab)+1;if(K<2)return 0;
 return mean(points.map((p,i)=>{const d=k=>{const o=points.filter((_,j)=>lab[j]===k&&j!==i);return o.length?mean(o.map(q=>Math.sqrt(dist2(p,q)))):0;};
  if(points.filter((_,j)=>lab[j]===lab[i]).length<2)return 0;const a=d(lab[i]);let b=Infinity;for(let k=0;k<K;k++)if(k!==lab[i]&&lab.includes(k))b=Math.min(b,d(k));
  return b===Infinity?0:(b-a)/Math.max(a,b);}));}

/* ---------- 6장: 나이브 베이즈와 라플라스 평활 ---------- */
const NB={words:['급히','환불','계좌','배송','감사'],counts:[[30,40,25,10,5],[8,20,0,70,52]],prior:[0.1,0.9],message:[1,1,1,0,0]};
function naiveBayes(alpha,nb=NB){
 const V=nb.words.length;
 const probs=nb.counts.map(row=>{const tot=sum(row);return row.map(c=>(c+alpha)/(tot+alpha*V));});
 const logs=probs.map((p,k)=>Math.log(nb.prior[k])+sum(nb.message.map((m,i)=>m?m*Math.log(p[i]):0)));
 const mx=Math.max(...logs);let post;
 if(!Number.isFinite(mx))post=[0.5,0.5];else{const e=logs.map(l=>Number.isFinite(l)?Math.exp(l-mx):0);post=e.map(x=>x/sum(e));}
 return {probs,logs,post};}

/* ---------- 7장: 특성 척도와 거리 ---------- */
function scaleData(seed,n){const r=rng(seed),out=[];for(let i=0;i<n;i++){const c=r()<0.4?1:0,att=c?Math.round(5+r()*4):Math.round(1+r()*3),amt=Math.round((c?40000+r()*120000:20000+r()*230000)/1000)*1000;out.push({amt,att,c});}return out;}
function scaler(mode,train){
 const A=train.map(p=>p.amt),T=train.map(p=>p.att);
 if(mode==='won')return p=>({x:p.amt,y:p.att});
 if(mode==='man')return p=>({x:p.amt/10000,y:p.att});
 if(mode==='z'){const ma=mean(A),sa=std(A),mt=mean(T),st=std(T);return p=>({x:(p.amt-ma)/sa,y:(p.att-mt)/st});}
 const a0=Math.min(...A),a1=Math.max(...A),t0=Math.min(...T),t1=Math.max(...T);return p=>({x:(p.amt-a0)/(a1-a0),y:(p.att-t0)/(t1-t0)});}
function scalingLab(mode){
 const train=scaleData(151,50),test=scaleData(157,200),f=scaler(mode,train),T=train.map(p=>({...f(p),c:p.c}));
 const query={amt:52000,att:8},q=f(query);let best=0;T.forEach((p,i)=>{if(dist2(p,q)<dist2(T[best],q))best=i;});
 const share=mean(T.map(p=>{const dx=(p.x-q.x)**2,dy=(p.y-q.y)**2;return dx+dy>0?dx/(dx+dy):0.5;}));
 const acc=accuracy(test.map(p=>knnPredict(T,{...f(p)},5)),test.map(p=>p.c));
 return {query,neighbor:train[best],share,acc,pred:knnPredict(T,q,5)};}
/* 특성 선택 보조: 피어슨 상관과 구간 상호정보 */
function pearson(x,y){const mx=mean(x),my=mean(y);let a=0,b=0,c=0;x.forEach((v,i)=>{a+=(v-mx)*(y[i]-my);b+=(v-mx)**2;c+=(y[i]-my)**2;});return b&&c?a/Math.sqrt(b*c):0;}
function mutualInfo(x,y,bins=6){const bin=a=>{const lo=Math.min(...a),hi=Math.max(...a);return a.map(v=>Math.min(bins-1,Math.floor((v-lo)/((hi-lo)||1)*bins)));};
 const bx=bin(x),by=bin(y),n=x.length,J={},px={},py={};bx.forEach((v,i)=>{const k=v+','+by[i];J[k]=(J[k]||0)+1;px[v]=(px[v]||0)+1;py[by[i]]=(py[by[i]]||0)+1;});
 return sum(Object.entries(J).map(([k,c])=>{const [a,b]=k.split(',');return c/n*Math.log2(c*n/(px[a]*py[b]));}));}

/* ---------- 8장: 점수·문턱·혼동 행렬·ROC ---------- */
function scoreData(shift=0,seed=211,n=1000){const r=rng(seed),out=[];
 for(let i=0;i<n;i++){const c=i%100<3?1:0,z=c?0.2-shift+gauss(r)*1.1:-2.2+gauss(r);out.push({s:sigmoid(z),c});}return out;}
function confusion(data,t){let TP=0,FP=0,FN=0,TN=0;data.forEach(d=>{const p=d.s>=t;if(p&&d.c)TP++;else if(p)FP++;else if(d.c)FN++;else TN++;});return {TP,FP,FN,TN};}
function rates(cm){const {TP,FP,FN,TN}=cm,n=TP+FP+FN+TN,precision=TP+FP?TP/(TP+FP):0,recall=TP+FN?TP/(TP+FN):0;
 const den=Math.sqrt((TP+FP)*(TP+FN)*(TN+FP)*(TN+FN));
 return {precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0,accuracy:(TP+TN)/n,fpr:FP+TN?FP/(FP+TN):0,mcc:den?(TP*TN-FP*FN)/den:0};}
function rocCurve(data){const pts=[[0,0]];for(let i=100;i>=0;i--){const r=rates(confusion(data,i/100));pts.push([r.fpr,r.recall]);}pts.push([1,1]);return pts;}
function auc(data){const pos=data.filter(d=>d.c).map(d=>d.s),neg=data.filter(d=>!d.c).map(d=>d.s);let w=0;pos.forEach(p=>neg.forEach(q=>{w+=p>q?1:p===q?0.5:0;}));return w/(pos.length*neg.length);}
function stratifiedCounts(data,K,stratified){const pos=data.filter(d=>d.c).length,r=rng(7),idx=data.map((_,i)=>i);
 if(stratified){const p=[],n=[];idx.forEach(i=>(data[i].c?p:n).push(i));const fold=new Array(K).fill(0);p.forEach((_,j)=>fold[j%K]++);return {pos,folds:fold};}
 for(let i=idx.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]];}
 const fold=new Array(K).fill(0);idx.forEach((v,j)=>{if(data[v].c)fold[Math.floor(j*K/idx.length)]++;});return {pos,folds:fold};}

/* ---------- 9장: 편향-분산 분해와 앙상블 투표 ---------- */
const trueCurve=x=>Math.sin(4.2*x)+0.3*x;
function solve(A,b){const n=b.length,M=A.map((r,i)=>[...r,b[i]]);
 for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;[M[c],M[p]]=[M[p],M[c]];
  for(let r=c+1;r<n;r++){const f=M[r][c]/M[c][c];for(let k=c;k<=n;k++)M[r][k]-=f*M[c][k];}}
 const x=new Array(n).fill(0);for(let i=n-1;i>=0;i--){let s=M[i][n];for(let k=i+1;k<n;k++)s-=M[i][k]*x[k];x[i]=s/M[i][i];}return x;}
function polyFit(xs,ys,deg,ridge=1e-8){const d=deg+1,A=Array.from({length:d},()=>new Array(d).fill(0)),b=new Array(d).fill(0);
 xs.forEach((x,i)=>{const p=[];for(let k=0;k<d;k++)p.push(x**k);for(let r=0;r<d;r++){b[r]+=p[r]*ys[i];for(let c=0;c<d;c++)A[r][c]+=p[r]*p[c];}});
 for(let r=0;r<d;r++)A[r][r]+=ridge;return solve(A,b);}
const polyEval=(w,x)=>w.reduce((s,c,k)=>s+c*x**k,0);
function biasVariance(deg,{n=12,reps=80,noise=0.35,seed=301}={}){
 const r=rng(seed),grid=Array.from({length:41},(_,i)=>-1+i/20),xs=Array.from({length:n},(_,i)=>-1+2*i/(n-1)),preds=grid.map(()=>[]),fits=[];
 for(let k=0;k<reps;k++){const ys=xs.map(x=>trueCurve(x)+gauss(r)*noise),w=polyFit(xs,ys,deg);if(k<6)fits.push(w);grid.forEach((x,i)=>preds[i].push(polyEval(w,x)));}
 const bias2=mean(grid.map((x,i)=>(mean(preds[i])-trueCurve(x))**2)),vari=mean(preds.map(p=>variance(p)));
 return {bias2,variance:vari,noise:noise*noise,total:bias2+vari+noise*noise,grid,meanFit:grid.map((x,i)=>mean(preds[i])),fits};}
function logChoose(n,k){let s=0;for(let i=1;i<=k;i++)s+=Math.log(n-k+i)-Math.log(i);return s;}
function majorityVote(N,p){let s=0;for(let k=Math.floor(N/2)+1;k<=N;k++)s+=Math.exp(logChoose(N,k)+k*Math.log(p)+(N-k)*Math.log(1-p));return s;}
/* 상관 rho: 확률 rho로 모든 모델이 같은 판단(정답 확률 p)을 내리고, 나머지는 서로 독립이라는 단순 모형 */
const ensembleAccuracy=(N,p,rho)=>rho*p+(1-rho)*majorityVote(N,p);

/* ---------- 10장: 목표 인코딩 누설과 시계열 누설 ---------- */
function targetEncodingLab(nCat,{rows=600,folds=5,seed=401}={}){
 const r=rng(seed),D=Array.from({length:rows},()=>({k:Math.floor(r()*nCat),c:r()<0.5?1:0}));
 const enc=rowsIn=>{const m={};rowsIn.forEach(d=>{(m[d.k]=m[d.k]||[0,0]);m[d.k][0]+=d.c;m[d.k][1]++;});return m;};
 const decide=(m,g,k)=>{const e=m[k];const v=e?e[0]/e[1]:g;return v===0.5?(g>=0.5?1:0):(v>0.5?1:0);};
 const all=enc(D),g=mean(D.map(d=>d.c));let leak=0,honest=0;
 for(let f=0;f<folds;f++){const test=D.filter((_,i)=>i%folds===f),train=D.filter((_,i)=>i%folds!==f),mt=enc(train),gt=mean(train.map(d=>d.c));
  test.forEach(d=>{if(decide(all,g,d.k)===d.c)leak++;if(decide(mt,gt,d.k)===d.c)honest++;});}
 return {leaky:leak/rows,honest:honest/rows,perCat:rows/nCat};}
function orderSeries(seed=503,days=120){const r=rng(seed),week=[0,-6,-10,-4,6,28,20];return Array.from({length:days},(_,t)=>Math.round(200+0.8*t+week[t%7]+gauss(r)*12));}
function forecasts(y,k,from=90){const out={trailing:[],leaky:[],persist:[],seasonal:[],actual:[]},h=Math.floor(k/2);
 for(let t=from;t<y.length;t++){out.actual.push(y[t]);out.trailing.push(mean(y.slice(t-k,t)));out.leaky.push(mean(y.slice(Math.max(0,t-h),Math.min(y.length,t+h+1))));out.persist.push(y[t-1]);out.seasonal.push(y[t-7]);}
 const mae=a=>mean(a.map((v,i)=>Math.abs(v-out.actual[i])));
 return {...out,mae:{trailing:mae(out.trailing),leaky:mae(out.leaky),persist:mae(out.persist),seasonal:mae(out.seasonal)}};}

/* ---------- 11장: 이상 탐지와 불균형 ---------- */
function outlierLab(injected){
 const r=rng(601),base=Array.from({length:300},()=>5+gauss(r)*1.2);for(let i=0;i<injected;i++)base.push(30+r()*30);
 const normal=Array.from({length:200},()=>5+gauss(r)*1.2),anom=Array.from({length:10},(_,i)=>10.5+i*0.6);
 const m=mean(base),s=std(base),q1=quantile(base,0.25),q3=quantile(base,0.75),iqr=q3-q1,lo=q1-1.5*iqr,hi=q3+1.5*iqr;
 const z=v=>Math.abs(v-m)/s>3,q=v=>v<lo||v>hi;
 return {mean:m,std:s,lo,hi,zHit:anom.filter(z).length,zFalse:normal.filter(z).length,iqrHit:anom.filter(q).length,iqrFalse:normal.filter(q).length,anomalies:anom.length};}
function imbalanceData(seed,neg,pos){const r=rng(seed),out=[];for(let i=0;i<neg;i++)out.push({x:gauss(r),y:gauss(r),c:0});for(let i=0;i<pos;i++)out.push({x:1.5+gauss(r)*0.8,y:1.1+gauss(r)*0.8,c:1});return out;}
function smote(minority,need,k=5,seed=707){const r=rng(seed),out=[];
 for(let i=0;i<need;i++){const a=minority[i%minority.length],nb=minority.filter(p=>p!==a).sort((p,q)=>dist2(p,a)-dist2(q,a)).slice(0,k),b=nb[Math.floor(r()*nb.length)],u=r();out.push({x:a.x+u*(b.x-a.x),y:a.y+u*(b.y-a.y),c:1});}
 return out;}
function resample(train,method){const pos=train.filter(p=>p.c),neg=train.filter(p=>!p.c),r=rng(709);
 if(method==='over')return {data:[...neg,...Array.from({length:neg.length},(_,i)=>pos[i%pos.length])],weights:null};
 if(method==='smote')return {data:[...neg,...pos,...smote(pos,neg.length-pos.length)],weights:null};
 if(method==='under'){const s=[...neg];for(let i=s.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[s[i],s[j]]=[s[j],s[i]];}return {data:[...s.slice(0,pos.length),...pos],weights:null};}
 if(method==='weight'){const n=train.length;return {data:train,weights:train.map(p=>n/(2*(p.c?pos.length:neg.length)))};}
 return {data:train,weights:null};}
function imbalanceLab(method){
 const train=imbalanceData(801,400,20),test=imbalanceData(803,400,20),{data,weights}=resample(train,method),m=trainLogistic(data,300,0.5,weights);
 const cm=confusion(test.map(p=>({s:sigmoid(m.w[0]*p.x+m.w[1]*p.y+m.b),c:p.c})),0.5);
 return {cm,...rates(cm),trainSize:data.length,positives:data.filter(p=>p.c).length};}

/* ---------- 12장: 분포 이동과 비용 기준 문턱 ---------- */
function expectedCost(cm,costFN=20,costFP=1){return cm.FN*costFN+cm.FP*costFP;}
function bestThreshold(data,costFN=20,costFP=1){let best=null;for(let i=1;i<100;i++){const t=i/100,c=expectedCost(confusion(data,t),costFN,costFP);if(!best||c<best.cost)best={t,cost:c};}return best;}
/* policy: keep(옛 문턱 유지) · retune(최근 라벨로 문턱만 다시 고름) · retrain(새 특성으로 재학습해 이동의 75%를 되찾는다고 가정한 시나리오) */
function driftLab(shift,policy){
 const eff=policy==='retrain'?shift*0.25:shift,t0=bestThreshold(scoreData(0,211,5000)).t,t=policy==='keep'?t0:bestThreshold(scoreData(eff,227,5000)).t,after=scoreData(eff,223,5000);
 const c=confusion(after,t),cm={TP:c.TP/5,FP:c.FP/5,FN:c.FN/5,TN:c.TN/5};return {t,t0,cm,...rates(cm),cost:expectedCost(cm),auc:auc(after)};}

const A03Math={rng,gauss,sum,mean,variance,std,quantile,sigmoid,accuracy,twoBlobs,centroids,centroidLab,bce,trainLogistic,logisticLab,
 gini,entropy,splitScores,bestSplit,SPLIT_DATA,knnData,knnPredict,knnLab,svmData,trainSVM,svmLab,clusterData,kmeans,silhouette,NB,naiveBayes,
 scaleData,scaler,scalingLab,pearson,mutualInfo,scoreData,confusion,rates,rocCurve,auc,stratifiedCounts,trueCurve,solve,polyFit,polyEval,biasVariance,
 majorityVote,ensembleAccuracy,targetEncodingLab,orderSeries,forecasts,outlierLab,imbalanceData,smote,resample,imbalanceLab,expectedCost,bestThreshold,driftLab};
if(typeof module!=='undefined')module.exports=A03Math;else root.A03Math=A03Math;
})(typeof window!=='undefined'?window:globalThis);
