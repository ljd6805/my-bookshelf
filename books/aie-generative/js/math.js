/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   공통 사례: 그림책 작업실의 여우 '도토리' 그림 데이터. 한 가지 특징값(밝기 축)으로 줄이면
   낮 장면(평균 -2)과 밤 장면(평균 +2)이 반씩 섞인 두 봉우리 분포이고, 두 봉우리의 표준편차는 0.5다.
   신경망 대신 이 분포에서 정확히 계산되는 최적 잡음 예측기·속도장을 쓴다(원본 레슨의 1차원 장난감 실험과 같은 발상).
   원본: rohitg00/ai-engineering-from-scratch Phase 8(확인일 2026-10-08). */
(function(root){
'use strict';
/* ── 공통 도구 ── */
function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function gauss(r){let u=0;while(u<1e-12)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r());}
function erf(x){const s=x<0?-1:1,a=Math.abs(x),t=1/(1+0.3275911*a);const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-a*a);return s*y;}
const Phi=x=>0.5*(1+erf(x/Math.SQRT2));
const npdf=(x,m,v)=>Math.exp(-(x-m)*(x-m)/(2*v))/Math.sqrt(2*Math.PI*v);
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const std=a=>{const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/a.length);};
/* 도토리 데이터: 낮 장면 N(-2, 0.5²)과 밤 장면 N(2, 0.5²)이 반반 */
const MIX=[{mu:-2,s:0.5,w:0.5},{mu:2,s:0.5,w:0.5}];
const NIGHT=[{mu:2,s:0.5,w:1}];
function mixSamples(n,seed,comps=MIX){const r=rng(seed);return Array.from({length:n},()=>{const c=r()<comps[0].w?comps[0]:comps[comps.length-1];return c.mu+c.s*gauss(r);});}
const mixPdf=(x,comps=MIX)=>comps.reduce((s,c)=>s+c.w*npdf(x,c.mu,c.s*c.s),0);
const mixProb=(a,b,comps=MIX)=>comps.reduce((s,c)=>s+c.w*(Phi((b-c.mu)/c.s)-Phi((a-c.mu)/c.s)),0);

/* 1장: 명시적 밀도(히스토그램·커널 밀도)와 암시적 생성기. '밤 장면 한가운데' 구간 [1.5, 2.5]의 확률을 묻는다. */
function density(h,n=400,seed=7){
 const xs=mixSamples(n,seed),a=1.5,b=2.5;
 const hist=xs.filter(x=>x>=a&&x<=b).length/n;
 const kde=mean(xs.map(x=>Phi((b-x)/h)-Phi((a-x)/h)));
 const truth=mixProb(a,b);
 const grid=[];for(let i=0;i<=80;i++){const x=-5+i*10/80;grid.push([x,mean(xs.map(s=>npdf(x,s,h*h))),mixPdf(x)]);}
 const peaks=grid.filter((g,i)=>i>0&&i<grid.length-1&&g[1]>grid[i-1][1]&&g[1]>=grid[i+1][1]).length;
 return {n,h,hist,kde,truth,errKde:Math.abs(kde-truth),errHist:Math.abs(hist-truth),grid,peaks};
}

/* 2장: 특징 8개의 분산(교육용 가정값). 선형 오토인코더의 최적해는 PCA라서 버린 분산의 합이 재구성 오차다. */
const LAMBDA=[5,2.4,1.2,0.6,0.3,0.15,0.08,0.04];
function bottleneck(k){const total=LAMBDA.reduce((s,x)=>s+x,0),kept=LAMBDA.slice(0,k).reduce((s,x)=>s+x,0);return {k,total,kept,error:total-kept,retained:kept/total};}
/* 2장: 선형 가우스 β-VAE의 닫힌 해. 차원 i는 λᵢ > β/2일 때만 쓰이고(활성), 그때 재구성 오차 β/2와 KL ½·ln(2λᵢ/β)를 낸다.
   λᵢ ≤ β/2이면 잠재 차원이 사전분포로 붕괴해 재구성 오차가 λᵢ, KL이 0이다. 손실 = 재구성 + β·KL. */
function betaVae(beta,lams=LAMBDA){
 const dims=lams.map(l=>l>beta/2?{lam:l,active:true,recon:beta/2,kl:0.5*Math.log(2*l/beta)}:{lam:l,active:false,recon:l,kl:0});
 const recon=dims.reduce((s,d)=>s+d.recon,0),kl=dims.reduce((s,d)=>s+d.kl,0);
 return {beta,dims,recon,kl,loss:recon+beta*kl,active:dims.filter(d=>d.active).length};
}

/* 3장: GAN 학습 균형의 축소 모형. 생성자는 '밤 장면을 낼 비율 g=σ(θ)' 하나만, 판별자는 두 장면에 매기는 진짜 확률 D_낮=σ(a), D_밤=σ(b)만 갖는다.
   판별자는 이진 교차 엔트로피(진짜 반반, 가짜 1−g : g)의 기울기로, 생성자는 비포화 손실 −[(1−g)log D_낮 + g log D_밤]의 기울기로
   동시에 ηD, ηG만큼 움직인다. 300단계, 시작값 g=0.4. 신경망을 뺀 교육용 시뮬레이션이다. */
function ganSim(etaG,etaD,steps=300){
 const sg=x=>1/(1+Math.exp(-x));let th=-0.4,a=0,b=0;const trace=[];
 for(let i=0;i<steps;i++){
  const g=sg(th),A=sg(a),B=sg(b);
  const ga=0.5*(1-A)-(1-g)*A,gb=0.5*(1-B)-g*B,gt=g*(1-g)*(Math.log(B)-Math.log(A));
  a+=etaD*ga;b+=etaD*gb;th+=etaG*gt;trace.push([i+1,sg(th)]);
 }
 const tail=trace.slice(-150).map(p=>p[1]);
 const minShare=Math.min(...tail.map(x=>Math.min(x,1-x)));
 return {trace,final:trace[steps-1][1],minShare,collapse:minShare<0.1,swing:Math.max(...tail)-Math.min(...tail),dDay:sg(a),dNight:sg(b)};
}
/* 3장 그림: 판별자가 가짜에 준 점수 D에서 생성자가 받는 기울기 크기(로짓 기준). 포화형은 D, 비포화형은 1-D. */
const ganGrad=d=>({saturating:d,nonSaturating:1-d});

/* 4장: 목도리 색 하나에 그럴듯한 정답이 둘(빨강=0, 파랑=1). 빨강일 확률 p. L2는 평균, L1은 중앙값을 고른다. */
function l1l2(p){
 const l2=1-p,l1=p>0.5?0:p<0.5?1:0.5;
 const near=y=>Math.min(Math.abs(y),Math.abs(1-y));
 const lossL1=y=>p*Math.abs(y)+(1-p)*Math.abs(1-y),lossL2=y=>p*y*y+(1-p)*(1-y)*(1-y);
 return {p,l2,l1,gapL2:near(l2),gapL1:near(l1),plausibleL2:near(l2)<=0.15,plausibleL1:near(l1)<=0.15,lossL1:lossL1(l1),lossL2:lossL2(l2)};
}
/* 4장: StyleGAN 절단 기법 w' = ŵ + ψ(w − ŵ). W 공간은 매핑망이 비튼 2차원 분포로 흉내 낸다(교육용). */
function truncation(psi,n=300,seed=11){
 const r=rng(seed),raw=[];for(let i=0;i<n;i++){const a=gauss(r),b=gauss(r);raw.push([a+0.35*b*b-0.35,0.8*b]);}
 const c=[mean(raw.map(p=>p[0])),mean(raw.map(p=>p[1]))];
 const pts=raw.map(([x,y])=>[c[0]+psi*(x-c[0]),c[1]+psi*(y-c[1])]);
 const dist=pts.map(([x,y])=>Math.hypot(x-c[0],y-c[1]));
 return {psi,pts,center:c,diversity:mean(dist),inside:dist.filter(d=>d<=0.8).length/n,radius:0.8};
}

/* 5장: 노이즈 스케줄. 선형 β(1e-4 → 0.02, T=1000)와 코사인(Nichol & Dhariwal, s=0.008). */
const T=1000,SCHED={};
function alphaBars(kind){
 if(SCHED[kind])return SCHED[kind];const ab=[];
 if(kind==='cosine'){const f=t=>Math.cos(((t/T)+0.008)/1.008*Math.PI/2)**2,f0=f(0);let prev=1;for(let t=1;t<=T;t++){let a=f(t)/f0;const beta=Math.min(1-a/prev,0.999);a=prev*(1-beta);ab.push(a);prev=a;}}
 else{let c=1;for(let t=0;t<T;t++){c*=1-(1e-4+(0.02-1e-4)*t/(T-1));ab.push(c);}}
 return SCHED[kind]=ab;
}
function schedule(kind,t){
 const ab=alphaBars(kind),a=ab[Math.max(0,Math.min(T-1,t-1))],snr=a/(1-a);
 const cross=ab.findIndex(x=>x<0.5)+1;
 return {kind,t,alphaBar:a,signal:Math.sqrt(a),noise:Math.sqrt(1-a),snr,logSnr:Math.log10(snr),cross};
}
/* 5장: 섞인 분포에서 정확한 잡음 예측 ε*(x_t) = −√(1−ᾱ)·∇log p(x_t). 신경망이 배우려는 바로 그 값이다. */
function epsStar(x,a,comps=MIX){
 let num=0,den=0;for(const c of comps){const m=Math.sqrt(a)*c.mu,v=a*c.s*c.s+(1-a),p=c.w*npdf(x,m,v);num+=p*(-(x-m)/v);den+=p;}
 const score=den>1e-300?num/den:-x;return -Math.sqrt(1-a)*score;
}
/* 5~6장: 결정적 DDIM 샘플러(η=0). steps번 거꾸로 걷는다. w>0이면 분류기 없는 가이던스(밤 장면 조건)를 쓴다. */
function ddim(steps,{n=200,seed=5,w=null,kind='linear'}={}){
 const ab=alphaBars(kind),r=rng(seed),ts=[];for(let i=0;i<steps;i++)ts.push(Math.round((T-1)*(1-i/steps)));
 return Array.from({length:n},()=>{let x=gauss(r);
  ts.forEach((t,i)=>{const a=ab[t],ap=i+1<steps?ab[ts[i+1]]:1;
   const e=w===null?epsStar(x,a):(1+w)*epsStar(x,a,NIGHT)-w*epsStar(x,a);
   const x0=(x-Math.sqrt(1-a)*e)/Math.sqrt(a);x=Math.sqrt(ap)*x0+Math.sqrt(1-ap)*e;});
  return x;});
}
function sampleStats(xs){
 const n=xs.length,bins=Array(16).fill(0);xs.forEach(x=>{const b=Math.floor((x+4)/0.5);if(b>=0&&b<16)bins[b]++;});
 return {n,mean:mean(xs),std:std(xs),scene:xs.filter(x=>Math.abs(Math.abs(x)-2)<1).length/n,blur:xs.filter(x=>Math.abs(x)<1).length/n,day:xs.filter(x=>x<0).length/n,over:xs.filter(x=>x>3).length/n,bins};
}
const steps=(k,o)=>sampleStats(ddim(k,o));
const cfg=w=>sampleStats(ddim(20,{w}));

/* 6장: 잠재 공간 압축. 한 변 H 픽셀 RGB 이미지를 f배 줄이고 채널 c개로 둔 잠재. */
function latentSize(H,f,c){const px=H*H*3,lat=(H/f)*(H/f)*c;return {px,lat,ratio:px/lat};}
/* 7장: LoRA. d×d 가중치를 얼려 두고 B(d×r)·A(r×d)만 학습한다. 2바이트(fp16) 저장 가정. */
function lora(d,r){const full=d*d,ada=2*d*r;return {d,r,full,ada,ratio:full/ada,share:ada/full,kb:ada*2/1024};}
/* 7장: SDEdit. 낮 장면 x0=-2를 강도 s(=t/T)까지 노이즈 낸 뒤 결정적으로 되돌린다.
   1차원 확률 흐름은 순서를 보존하고 대칭이므로 x_t<0이면 낮 장면으로 돌아온다: P = Φ(2√ᾱ / √(1−ᾱ)). */
function sdedit(s,kind='linear'){
 const t=Math.max(1,Math.round(s*T)),a=alphaBars(kind)[t-1],keep=Phi(2*Math.sqrt(a)/Math.sqrt(1-a));
 return {s,t,alphaBar:a,signal:Math.sqrt(a),keep,change:1-keep};
}
/* 8장: 비디오 토큰. 3D VAE가 공간 8배·시간 4배로 줄이고, 잠재를 p×p 조각으로 자른다고 가정한다(교육용 설정). */
function video(sec,height,patch,fps=24){
 const width=Math.round(height*16/9),frames=sec*fps,raw=frames*height*width*3;
 const lf=Math.ceil(frames/4),side=8*patch,perFrame=Math.ceil(height/side)*Math.ceil(width/side),N=lf*perFrame;
 const full=N*N,fact=N*(perFrame+lf);
 return {frames,raw,rawGB:raw/1e9,latentFrames:lf,perFrame,tokens:N,full,fact,saving:full/fact};
}
/* 8장: 오디오 코덱 토큰(프레임률 Hz × 코드북 수)과 비트율, 3D 가우시안 저장량(가우시안당 59개 값, 4바이트). */
function codec(K,hz=75,book=1024){const tps=hz*K;return {tps,bps:tps*Math.log2(book)};}
const splatMB=(count,params=59,bytes=4)=>count*params*bytes/1e6;

/* 9장: 플로 매칭. x_t=(1−t)x0 + t·x1, x0~도토리 데이터, x1~N(0,1). 정확한 주변 속도 v(x,t)=E[x1−x0 | x_t=x]. */
function flowVel(x,t,comps=MIX){
 let w=0,e0=0,e1=0;
 for(const c of comps){const m=(1-t)*c.mu,v=(1-t)*(1-t)*c.s*c.s+t*t,p=c.w*npdf(x,m,v);
  w+=p;e0+=p*(c.mu+(1-t)*c.s*c.s/v*(x-m));e1+=p*(t/v*(x-m));}
 return w>1e-300?(e1-e0)/w:x;
}
function flowRun(x1,steps){let x=x1,len=0;const dt=1/steps;for(let i=0;i<steps;i++){const t=1-i*dt,dx=dt*flowVel(x,t);x-=dx;len+=Math.abs(dx);}return {x,len};}
/* 그림용: x1에서 출발한 경로를 n등분한 점들 [t, x] */
function flowPath(x1,n=40){let x=x1;const pts=[[1,x]];for(let i=0;i<n;i++){const t=1-i/n;x-=flowVel(x,t)/n;pts.push([t-1/n,x]);}return pts;}
function flow(steps,path='independent',n=200,seed=9){
 const r=rng(seed),x1=Array.from({length:n},()=>gauss(r));
 const ref=x1.map(z=>flowRun(z,400));
 const xs=path==='rectified'?ref.map(o=>o.x):x1.map(z=>flowRun(z,steps).x);
 const err=mean(xs.map((x,i)=>Math.abs(x-ref[i].x)));
 const straight=mean(ref.map((o,i)=>Math.abs(o.x-x1[i])/Math.max(o.len,1e-9)));
 return {steps,path,err,straight:path==='rectified'?1:straight,...sampleStats(xs),xs};
}

/* 10장: VAR 다중 척도 잔차. 도토리 그림 한 줄의 밝기 16칸을 1·2·4·8·16칸 평균으로 차례로 덧붙여 근사한다. */
const ROW=[0.2,0.3,0.45,0.7,0.9,0.95,0.85,0.75,0.5,0.35,0.3,0.25,0.2,0.15,0.1,0.1];
function varScales(k){
 let approx=Array(16).fill(0);const errs=[];
 for(let s=0;s<k;s++){const size=2**s,block=16/size;const res=ROW.map((v,i)=>v-approx[i]);
  const add=ROW.map((_,i)=>{const b=Math.floor(i/block)*block;return mean(res.slice(b,b+block));});
  approx=approx.map((v,i)=>v+add[i]);errs.push(mean(ROW.map((v,i)=>(v-approx[i])**2)));}
 const tokens=Array.from({length:k},(_,s)=>4**s).reduce((a,b)=>a+b,0);
 return {k,approx,row:ROW,mse:errs[errs.length-1],errs,passes:k,tokens2d:tokens,raster:256};
}

/* 11장: 2차원 특징에서 FID = ‖μ_r−μ_g‖² + Tr(Σ_r + Σ_g − 2(Σ_rΣ_g)^½). 2×2에서는 Tr√M = √(trM + 2√detM). */
function fid2(m1,S1,m2,S2){
 const M=[[S1[0][0]*S2[0][0]+S1[0][1]*S2[1][0],S1[0][0]*S2[0][1]+S1[0][1]*S2[1][1]],[S1[1][0]*S2[0][0]+S1[1][1]*S2[1][0],S1[1][0]*S2[0][1]+S1[1][1]*S2[1][1]]];
 const tr=M[0][0]+M[1][1],det=Math.max(0,M[0][0]*M[1][1]-M[0][1]*M[1][0]),trSqrt=Math.sqrt(Math.max(0,tr+2*Math.sqrt(det)));
 return (m1[0]-m2[0])**2+(m1[1]-m2[1])**2+S1[0][0]+S1[1][1]+S2[0][0]+S2[1][1]-2*trSqrt;
}
function moments(pts){const m=[mean(pts.map(p=>p[0])),mean(pts.map(p=>p[1]))],n=pts.length;const S=[[0,0],[0,0]];pts.forEach(p=>{for(let i=0;i<2;i++)for(let j=0;j<2;j++)S[i][j]+=(p[i]-m[i])*(p[j]-m[j])/(n-1);});return {m,S};}
function fidOnce(shift,sigma,N,seed){
 const r=rng(seed),real=[],gen=[];for(let i=0;i<N;i++){real.push([gauss(r),gauss(r)]);gen.push([shift+sigma*gauss(r),sigma*gauss(r)]);}
 const a=moments(real),b=moments(gen);return {est:fid2(a.m,a.S,b.m,b.S),real,gen};
}
/* 진짜 특징 N(0, I), 생성 특징 N((shift,0), σ²I). 정확한 FID = shift² + 2(1−σ)². 시드 5개로 N장씩 뽑아 추정값의 평균과 범위를 본다. */
function fidLab(shift,sigma,N){
 const runs=[1,2,3,4,5].map(s=>fidOnce(shift,sigma,N,s)),ests=runs.map(r=>r.est),exact=shift*shift+2*(1-sigma)**2,avg=mean(ests);
 return {shift,sigma,N,exact,est:avg,min:Math.min(...ests),max:Math.max(...ests),bias:avg-exact,real:runs[0].real.slice(0,150),gen:runs[0].gen.slice(0,150)};
}
const cosine=(a,b)=>{const d=a.reduce((s,x,i)=>s+x*b[i],0);return d/Math.hypot(...a)/Math.hypot(...b);};

/* 표지: 순방향 과정에서 x_t의 분포. 두 봉우리가 언제 하나로 합쳐지는지 본다(선형 스케줄). */
function forward(t){
 const a=alphaBars('linear')[Math.max(0,t-1)],comps=MIX.map(c=>({mu:Math.sqrt(a)*c.mu,s:Math.sqrt(a*c.s*c.s+1-a),w:c.w}));
 const grid=[];for(let i=0;i<=60;i++){const x=-4+i*8/60;grid.push([x,mixPdf(x,comps)]);}
 const peak=mixPdf(comps[1].mu,comps),mid=mixPdf(0,comps);
 return {t,alphaBar:a,snr:a/(1-a),grid,twoPeaks:mid<peak*0.98,centers:comps.map(c=>c.mu)};
}

/* 12장: 마지막 과제의 판정 표(미리 정한 시나리오). [판정, 이유, 더 필요한 증거] */
const TRIAGE={
 blur:{steps:['good','1~2단계로 거꾸로 걸으면 최적 예측도 두 장면의 평균(흐릿한 중간)을 냅니다. 단계를 20 이상으로 늘리면 봉우리가 갈라집니다.','같은 시드로 단계 수만 바꾼 샘플 200장의 흐릿한 비율'],cfg:['wrong','가이던스는 조건 쪽으로 밀 뿐, 단계가 모자라 생긴 평균 흐림을 풀지 못합니다.','샘플러 단계 수와 스케줄 설정'],psi:['wrong','ψ는 GAN의 W 공간 손잡이라 디퓨전 샘플러와 관계가 없습니다.','어떤 모델 가족인지부터 확인'],distill:['partial','증류 모델은 적은 단계에서도 선명하게 학습되었지만, 지금 원인이 단계 수인지 먼저 확인해야 합니다.','같은 단계에서 기본 모델과 증류 모델의 비교'],moreN:['wrong','표본을 늘려도 흐린 샘플이 그대로 많이 나올 뿐입니다.','샘플러 설정']},
 samey:{steps:['wrong','단계 수는 샘플의 선명도를 바꿀 뿐 한 장면만 나오는 쏠림을 풀지 않습니다.','장면별 비율'],cfg:['good','가이던스가 너무 크면 무조건부 예측에서 멀어지는 쪽으로 밀려 다양성이 줄어듭니다. 3~7로 낮춥니다.','w별 장면 비율과 표준편차'],psi:['partial','StyleGAN이라면 ψ를 1에 가깝게 올리는 것이 맞지만, 디퓨전 파이프라인이라면 해당하지 않습니다.','모델 가족과 ψ 설정값'],distill:['wrong','증류는 속도를 위한 것이고 다양성을 늘려 주지 않습니다. 적대적 증류는 오히려 쏠림을 키울 수 있습니다.','증류 전후 장면 비율'],moreN:['partial','500장 이상에서 장면 비율을 세는 것은 꼭 필요한 증거지만, 그것만으로 고쳐지지는 않습니다.','500장 이상의 장면 비율']},
 slow:{steps:['wrong','단계를 늘리면 더 느려집니다. 지연 = 단계 수 × 단계 비용 + VAE 복원입니다.','단계별 시간 측정'],cfg:['partial','CFG는 단계마다 조건부·무조건부 두 번 계산하므로 끄면 단계 비용이 줄지만, 품질이 함께 바뀝니다.','CFG 끈 샘플의 품질 비교'],psi:['wrong','ψ는 속도와 관계가 없습니다.','단계별 시간'],distill:['good','플로 매칭 기반을 1~4단계로 증류한 모델은 같은 단계 비용으로 단계 수를 크게 줄입니다.','증류 전후 FID·CLIP 점수 재측정'],moreN:['wrong','평가 표본은 서비스 속도와 관계가 없습니다.','지연 분해(단계·VAE)']},
 fid:{steps:['wrong','모델을 바꾸기 전에 숫자가 믿을 만한지부터 확인해야 합니다.','표본 수와 시드 수'],cfg:['wrong','지표를 믿을 수 없는 상태에서 설정을 바꾸면 무엇이 좋아졌는지 알 수 없습니다.','표본 수'],psi:['wrong','ψ를 낮추면 FID가 좋아 보이게 만들 수도 있어 더 위험합니다.','다양성 지표'],distill:['wrong','속도 문제가 아닙니다.','표본 수'],moreN:['good','표본 500장의 FID는 아래로도 위로도 크게 흔들립니다. 1만 장 이상, 시드 3개로 다시 재야 주장이 됩니다.','1만 장 FID, 시드 3개의 표준편차, CLIP 점수, 사람 비교']}
};
function triage(symptom,action){const [verdict,why,need]=TRIAGE[symptom][action];return {symptom,action,verdict,why,need,best:Object.keys(TRIAGE[symptom]).find(k=>TRIAGE[symptom][k][0]==='good')};}

const A09Math={rng,gauss,erf,Phi,npdf,mean,std,MIX,NIGHT,mixSamples,mixPdf,mixProb,density,LAMBDA,bottleneck,betaVae,ganSim,ganGrad,l1l2,truncation,T,alphaBars,schedule,epsStar,ddim,sampleStats,steps,cfg,latentSize,lora,sdedit,video,codec,splatMB,flowVel,flowPath,flow,ROW,varScales,fid2,fidOnce,fidLab,cosine,forward,triage,TRIAGE};
if(typeof module!=='undefined')module.exports=A09Math;else root.A09Math=A09Math;
})(typeof window!=='undefined'?window:globalThis);
