/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   공통 사례: 조명 명령 세 가지('켜', '꺼', '밝게')를 알아듣는 작은 음성 명령 인식기 '말귀'. */
(function(root){
'use strict';
const sum=a=>a.reduce((s,x)=>s+x,0);
const COMMANDS=['켜','꺼','밝게'];

/* ── 1장 신호: 성분을 더해 신호를 만들고 DFT로 다시 나눈다 ── */
/* parts=[[주파수 k(N 샘플당 주기 수), 진폭, 위상(rad)]] */
function synth(parts,N){return Array.from({length:N},(_,n)=>sum(parts.map(([k,a,ph])=>a*Math.cos(2*Math.PI*k*n/N+ph))));}
/* 직접 정의대로 계산하는 O(N²) DFT. 실수 입력이면 0..N/2의 진폭만 쓰면 된다. */
function dft(x){
 const N=x.length,re=[],im=[];
 for(let k=0;k<N;k++){let r=0,i=0;for(let n=0;n<N;n++){const t=-2*Math.PI*k*n/N;r+=x[n]*Math.cos(t);i+=x[n]*Math.sin(t);}re.push(r);im.push(i);}
 return {re,im,mag:re.map((r,k)=>Math.hypot(r,im[k]))};
}
/* 단측 진폭: k=0과 N/2는 |X|/N, 그 밖은 2|X|/N → 성분의 원래 진폭과 같다. */
function amplitudes(x){const N=x.length,{mag}=dft(x);return mag.slice(0,N/2+1).map((m,k)=>(k===0||k===N/2?1:2)*m/N);}
function energy(x){return sum(x.map(v=>v*v));}

/* ── 2장 텐서와 거리 ── */
const prod=s=>s.reduce((p,x)=>p*x,1);
/* 오른쪽 끝부터 맞춘다. 같거나 한쪽이 1이면 통과, 아니면 null. */
function broadcast(a,b){
 const n=Math.max(a.length,b.length),out=[];
 for(let i=1;i<=n;i++){const x=a[a.length-i]??1,y=b[b.length-i]??1;if(x!==y&&x!==1&&y!==1)return null;out.unshift(Math.max(x,y));}
 return out;
}
/* 행 우선(row-major) 메모리에서 축마다 건너뛸 원소 수 */
function strides(shape){const s=[];let k=1;for(let i=shape.length-1;i>=0;i--){s.unshift(k);k*=shape[i];}return s;}
/* 말귀의 한 묶음이 지나가는 모양: 소리(B,T,F) → 층 W(F,H) → (B,T,H) → 시간 평균 (B,H) → 출력 (B,3) */
function pipeline(B,T,F,H){
 const steps=[['스펙트로그램 묶음',[B,T,F]],['층 통과 X·W',[B,T,H]],['시간 평균',[B,H]],['명령 점수(logit)',[B,3]]];
 return {steps:steps.map(([n,s])=>({name:n,shape:s,count:prod(s)})),params:F*H+H+H*3+3,macs:B*T*F*H+B*H*3};
}
const norm={
 l1:v=>sum(v.map(Math.abs)),l2:v=>Math.sqrt(sum(v.map(x=>x*x))),linf:v=>Math.max(...v.map(Math.abs))
};
const dot=(a,b)=>sum(a.map((x,i)=>x*b[i]));
function cosine(a,b){const d=norm.l2(a)*norm.l2(b);return d?dot(a,b)/d:0;}
function distances(q,t){const d=q.map((x,i)=>x-t[i]);return {l1:norm.l1(d),l2:norm.l2(d),linf:norm.linf(d),cos:1-cosine(q,t)};}
/* 세 명령의 기준 특징(저·중·고 주파수 에너지) */
const TEMPLATES=[[0.9,0.3,0.1],[0.15,0.5,0.2],[0.3,0.4,0.9]];
function nearest(q,metric){const ds=TEMPLATES.map(t=>distances(q,t)[metric]);const i=ds.indexOf(Math.min(...ds));return {ds,i};}

/* ── 3장 미분: 수치 미분의 오차 ── */
const sigmoid=z=>1/(1+Math.exp(-z));
/* 말귀의 한 뉴런 손실: 입력 x=2, 정답 y=1, 편향 0. L(w)=(σ(2w)-1)² */
const lossW=w=>(sigmoid(2*w)-1)**2;
function lossWGrad(w){const a=sigmoid(2*w);return 2*(a-1)*a*(1-a)*2;}
function numDiff(f,x,h,centered){return centered?(f(x+h)-f(x-h))/(2*h):(f(x+h)-f(x))/h;}
/* log10(h)마다 두 방식의 상대 오차 */
function diffErrors(w,logs){const g=lossWGrad(w);return logs.map(L=>{const h=10**L,e=v=>Math.abs(v-g)/Math.abs(g);return {log:L,forward:e(numDiff(lossW,w,h,false)),centered:e(numDiff(lossW,w,h,true))};});}
function taylor(f,g,x0,dx){return f(x0)+g(x0)*dx;}

/* ── 4장 자동미분: 계산 그래프의 전진·후진 ── */
function backprop({x,w,b,y}){
 const z=w*x+b,a=sigmoid(z),L=(a-y)**2;
 const dLda=2*(a-y),dadz=a*(1-a),dLdz=dLda*dadz;
 return {z,a,L,dLda,dadz,dLdz,dLdw:dLdz*x,dLdb:dLdz,dLdx:dLdz*w};
}
function gradCheck(p,h=1e-6){
 const L=q=>backprop(q).L,g=backprop(p);
 const nw=(L({...p,w:p.w+h})-L({...p,w:p.w-h}))/(2*h);
 return {analytic:g.dLdw,numeric:nw,rel:Math.abs(nw-g.dLdw)/Math.max(1e-12,Math.abs(nw)+Math.abs(g.dLdw))};
}

/* ── 5장 최적화: 좁은 골짜기 f=½(a·x²+b·y²) ── */
const RAVINE={a:1,b:12,start:[-4,1.5]};
const ravine=([x,y])=>.5*(RAVINE.a*x*x+RAVINE.b*y*y);
const ravineGrad=([x,y])=>[RAVINE.a*x,RAVINE.b*y];
/* beta=0이면 기본 경사하강, beta>0이면 모멘텀(속도 누적) */
function descend(lr,steps,beta=0){
 let p=[...RAVINE.start],v=[0,0];const path=[p.slice()];
 for(let t=0;t<steps;t++){const g=ravineGrad(p);v=v.map((vi,i)=>beta*vi+g[i]);p=p.map((pi,i)=>pi-lr*v[i]);path.push(p.slice());if(!p.every(Number.isFinite)||Math.abs(p[0])+Math.abs(p[1])>1e6)break;}
 return {path,loss:path.map(ravine),final:ravine(path[path.length-1])};
}
/* 기본 경사하강이 이 골짜기에서 수렴하는 학습률 상한 = 2 / 가장 큰 곡률 */
const lrLimit=()=>2/Math.max(RAVINE.a,RAVINE.b);
/* 처음으로 thr 아래로 내려간 걸음 번호. 끝까지 못 내려가면 -1. */
const firstBelow=(a,thr)=>a.findIndex(v=>v<thr);

/* 표지 실험: 1차원 손실 L(w)=(w−2)²+0.5를 w=−2에서 경사하강. 곡률 2라 η<1이어야 수렴. */
function descend1d(lr,steps=30){let w=-2;const ws=[w];for(let t=0;t<steps;t++){w=w-lr*2*(w-2);ws.push(w);if(Math.abs(w)>1e6)break;}return {ws,loss:ws.map(v=>(v-2)**2+.5)};}

/* ── 6장 정보이론 ── */
const log2=x=>Math.log(x)/Math.LN2;
function entropy(p){return -sum(p.map(x=>x>0?x*log2(x):0));}
function crossEntropy(p,q){return -sum(p.map((x,i)=>x>0?x*log2(q[i]):0));}
function kl(p,q){return crossEntropy(p,q)-entropy(p);}
/* 정답 '켜'에 확신도 c를 주고 나머지는 2:1로 나눈 예측 */
function prediction(c){return [c,(1-c)*2/3,(1-c)/3];}
function smoothTarget(eps,k=3,i=0){return Array.from({length:k},(_,j)=>j===i?1-eps+eps/k:eps/k);}

/* ── 7장 수치 안정성 ── */
/* 반올림해 16비트 부동소수점(float16)으로 저장한 값. 범위를 넘으면 Infinity. */
function toHalf(x){
 if(!Number.isFinite(x))return x;const s=Math.sign(x),a=Math.abs(x);if(a===0)return 0;
 if(a>=65520)return s*Infinity;if(a<2**-24/2)return 0;
 const e=Math.max(Math.floor(Math.log2(a)),-14),q=2**(e-10);let r=Math.round(a/q)*q;if(r>65504)r=Infinity;return s*r;
}
const ROUND={f64:x=>x,f32:Math.fround,f16:toHalf};
/* 그대로 지수를 취하는 softmax와 최댓값을 빼는 softmax를 같은 정밀도로 계산 */
function softmaxIn(z,fmt,stable){
 const r=ROUND[fmt],m=stable?Math.max(...z):0,e=z.map(v=>r(Math.exp(r(v-m)))),s=r(sum(e));
 return e.map(v=>r(v/s));
}
function logSumExp(z){const m=Math.max(...z);return m+Math.log(sum(z.map(v=>Math.exp(v-m))));}
const isBad=a=>a.some(v=>!Number.isFinite(v));
/* 값이 무너졌거나 합이 1에서 벗어난 확률표 */
const broken=a=>isBad(a)||Math.abs(sum(a)-1)>1e-2;
/* e^s를 그 정밀도로 저장할 수 있는가 */
const expFits=(s,fmt)=>Number.isFinite(ROUND[fmt](Math.exp(s)));

/* ── 8장 샘플링 ── */
function softmaxT(z,T){const s=z.map(v=>v/T),m=Math.max(...s),e=s.map(v=>Math.exp(v-m)),t=sum(e);return e.map(v=>v/t);}
/* 누적 확률이 p를 넘는 가장 작은 상위 집합만 남기고 다시 정규화 */
function topP(probs,p){
 const order=probs.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]),keep=new Set();let c=0;
 for(const [v,i] of order){keep.add(i);c+=v;if(c>=p-1e-12)break;}
 const kept=probs.map((v,i)=>keep.has(i)?v:0),t=sum(kept);return kept.map(v=>v/t);
}
/* 재현 가능한 의사난수(mulberry32) */
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
/* 몬테카를로로 원 넓이 비율 π/4를 추정 */
function monteCarloPi(n,seed=17){const r=rng(seed);let inside=0;const pts=[];for(let i=0;i<n;i++){const x=r(),y=r(),ok=x*x+y*y<=1;if(ok)inside++;if(i<400)pts.push([x,y,ok]);}const est=4*inside/n;return {est,err:Math.abs(est-Math.PI),se:4*Math.sqrt((Math.PI/4)*(1-Math.PI/4)/n),pts};}

/* ── 9장 SVD: 대칭 행렬의 야코비 고유분해로 AᵀA를 풀어 특잇값을 얻는다 ── */
function jacobiEigen(S){
 const n=S.length,A=S.map(r=>r.slice()),V=A.map((_,i)=>A.map((_,j)=>i===j?1:0));
 for(let sweep=0;sweep<60;sweep++){
  let off=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)off+=A[i][j]**2;if(off<1e-22)break;
  for(let p=0;p<n;p++)for(let q=p+1;q<n;q++){
   if(Math.abs(A[p][q])<1e-300)continue;
   const th=(A[q][q]-A[p][p])/(2*A[p][q]),t=Math.sign(th||1)/(Math.abs(th)+Math.sqrt(th*th+1)),c=1/Math.sqrt(t*t+1),s=t*c;
   for(let k=0;k<n;k++){const akp=A[k][p],akq=A[k][q];A[k][p]=c*akp-s*akq;A[k][q]=s*akp+c*akq;}
   for(let k=0;k<n;k++){const apk=A[p][k],aqk=A[q][k];A[p][k]=c*apk-s*aqk;A[q][k]=s*apk+c*aqk;}
   for(let k=0;k<n;k++){const vkp=V[k][p],vkq=V[k][q];V[k][p]=c*vkp-s*vkq;V[k][q]=s*vkp+c*vkq;}
  }
 }
 return {values:A.map((r,i)=>r[i]),vectors:V};
}
const T=A=>A[0].map((_,j)=>A.map(r=>r[j]));
const matmul=(A,B)=>A.map(r=>B[0].map((_,j)=>sum(r.map((x,k)=>x*B[k][j]))));
function svd(A){
 const {values,vectors}=jacobiEigen(matmul(T(A),A)),order=values.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]);
 const s=order.map(([v])=>Math.sqrt(Math.max(v,0))),V=order.map(([,i])=>vectors.map(r=>r[i]));
 const U=V.map((v,k)=>A.map(r=>s[k]>1e-12?dot(r,v)/s[k]:0));
 return {s,U,V};
}
function lowRank({s,U,V},k){const m=U[0].length,n=V[0].length;return Array.from({length:m},(_,i)=>Array.from({length:n},(_,j)=>{let v=0;for(let r=0;r<k;r++)v+=s[r]*U[r][i]*V[r][j];return v;}));}
const fro=A=>Math.sqrt(sum(A.flat().map(x=>x*x)));
/* 말귀가 듣는 '켜'의 가상 스펙트로그램(시간 12칸 × 주파수 10칸)과 잡음 */
function spectrogram(noise=0.06,seed=3){
 const r=rng(seed);
 return Array.from({length:12},(_,t)=>Array.from({length:10},(_,f)=>{const g=(u,c,w)=>Math.exp(-(((u-c)/w)**2)),env=g(t,5,3.2),low=g(f,2,1.4),mid=.55*g(f,6,1.2)*g(t,8,2);return Math.max(0,env*low+mid+noise*(r()-.5));}));
}
function compress(A,k){
 const d=svd(A),R=lowRank(d,k),m=A.length,n=A[0].length,E=A.map((r,i)=>r.map((x,j)=>x-R[i][j]));
 const kept=sum(d.s.slice(0,k).map(x=>x*x))/sum(d.s.map(x=>x*x));
 return {s:d.s,R,rel:fro(E)/fro(A),kept,store:k*(m+n+1),full:m*n};
}

/* ── 10장 연립방정식: 두 특징 열 사이의 각도와 조건수 ── */
/* A의 열 u=(1,0), v=(cosθ, sinθ). 정답 x=(1,1)이 되도록 b=u+v. */
function conditioning(deg,lambda=0,delta=0.01){
 const th=deg*Math.PI/180,c=Math.cos(th),s=Math.sin(th);
 /* AᵀA=[[1,c],[c,1]]의 고윳값 1±c → 특잇값 √(1±c) */
 const smax=Math.sqrt(1+Math.abs(c)),smin=Math.sqrt(Math.max(1-Math.abs(c),0));
 const solve=b=>{const a11=1+lambda,a12=c,a22=1+lambda,r1=b[0],r2=c*b[0]+s*b[1],det=a11*a22-a12*a12;return [(a22*r1-a12*r2)/det,(a11*r2-a12*r1)/det];};
 const b=[1+c,s],x=solve(b),xp=solve([b[0],b[1]+delta]);
 return {kappa:smax/smin,kappaNormal:(1+Math.abs(c)+lambda)/(1-Math.abs(c)+lambda),x,xp,shift:Math.hypot(xp[0]-x[0],xp[1]-x[1]),smax,smin};
}

/* ── 11장 마르코프 연쇄 ── */
/* 명령 다음 명령. q = '켜' 다음에 '밝게'가 올 확률 */
function commandChain(q){return [[0.1,0.9-q,q],[0.6,0.3,0.1],[0.2,0.5,0.3]];}
const step=(p,P)=>P[0].map((_,j)=>sum(p.map((x,i)=>x*P[i][j])));
function stationary(P,iters=2000){let p=P.map(()=>1/P.length);for(let i=0;i<iters;i++)p=step(p,P);return p;}
const tv=(a,b)=>.5*sum(a.map((x,i)=>Math.abs(x-b[i])));
function evolve(P,start,n){const out=[start.slice()];let p=start.slice();for(let i=0;i<n;i++){p=step(p,P);out.push(p);}return out;}
function mixingSteps(P,start,eps=1e-3){const pi=stationary(P);let p=start.slice();for(let i=0;i<500;i++){if(tv(p,pi)<eps)return i;p=step(p,P);}return 500;}

/* ── 12장 마지막 과제: 정확도 차이의 95% 구간(정규 근사) ── */
function diffInterval(p1,p2,n,z=1.96){const d=p2-p1,se=Math.sqrt(p1*(1-p1)/n+p2*(1-p2)/n);return {d,se,lo:d-z*se,hi:d+z*se,clear:d-z*se>0};}
/* 오경보 문제: 기저율 base, 민감도 sens, 오경보율 fpr일 때 '켜'라고 판정된 소리 중 진짜 비율 */
function posterior(base,sens,fpr){const t=base*sens,f=(1-base)*fpr;return t/(t+f);}

const A02Math={COMMANDS,synth,dft,amplitudes,energy,prod,broadcast,strides,pipeline,norm,dot,cosine,distances,TEMPLATES,nearest,sigmoid,lossW,lossWGrad,numDiff,diffErrors,taylor,backprop,gradCheck,RAVINE,ravine,ravineGrad,descend,lrLimit,firstBelow,descend1d,log2,entropy,crossEntropy,kl,prediction,smoothTarget,toHalf,softmaxIn,logSumExp,isBad,broken,expFits,softmaxT,topP,rng,monteCarloPi,jacobiEigen,matmul,svd,lowRank,fro,spectrogram,compress,conditioning,commandChain,step,stationary,tv,evolve,mixingSteps,diffInterval,posterior};
if(typeof module!=='undefined')module.exports=A02Math;else root.A02Math=A02Math;
})(typeof window!=='undefined'?window:globalThis);
