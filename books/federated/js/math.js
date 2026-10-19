/* 실험에 쓰는 순수 계산 함수(1): 합성 사용자, 다음 단어 모델, 기기 안 학습, 서버의 평균(FedSGD·FedAvg·FedProx),
   참여 기기 고르기, 성능이 다른 기기, 양자화, 통신량. DOM을 만지지 않으며 tests/math.test.cjs가 검사한다.
   모든 자료는 고정 씨앗으로 만든 합성 자료다. 하린, 키보드 앱 회사, 사용자 1,000명과 그들의 단어 쌍은 이 책을 위해 지어냈다.
   모델: 앞 단어(24개) 하나를 보고 다음 단어(9개)를 고르는 소프트맥스 선형 모델. 가중치 W(24×9)와 편향 b(9), 모두 225개 숫자.
   단위: 정확도는 0~1 비율, 통신량은 바이트(1 KB = 1,000바이트, 1 MB = 1,000,000바이트), 숫자 하나는 따로 적지 않으면 32비트(4바이트). */
(function(root){
'use strict';
/* ---------- 씨앗 난수 ---------- */
function rng(seed){let a=seed>>>0;return function(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function gauss(r){let u=0;while(u===0)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r());}
function pick(r,p){let x=r(),i=0;for(;i<p.length-1;i++){x-=p[i];if(x<0)return i;}return i;}
function shuffle(r,a){for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
/* 확인 문제 보기 순서: 데이터의 정답 번호는 그대로 두고 화면에서만 정답을 target 자리로 옮긴다. */
const choiceOrder=(n,answer,target)=>{const order=[...Array(n).keys()].filter(i=>i!==answer);order.splice(Math.min(target,n-1),0,answer);return order;};

/* ---------- 단어와 말투 ---------- */
/* 앞 단어 24개. 뜻(가다·알다·고맙다)마다 여덟이고, 뜻 안에서 앞쪽일수록 자주 쓴다(1, 1/2, …, 1/8).
   CUE는 말투 단서: 0 모두 비슷하게 씀, 1 존댓말 쪽, 2 반말 쪽, 3 줄임말 쪽(그 말투가 4배, 다른 말투는 0.25배). */
const CONTEXTS=['지금','곧','바로','이따','먼저','금방','일찍','내일','네','응','넵','ㅇㅇ','그래','예','아','오','정말','진짜','너무','완전','늘','항상','미리','다시'];
const MEANING=CONTEXTS.map((_,c)=>Math.floor(c/8));
const CUE=[0,0,0,2,0,3,0,1,1,2,1,3,2,1,0,3,1,2,0,3,2,1,1,0];
const WORDS=['갈게요','갈게','ㄱㄱ','알겠습니다','알겠어','ㅇㅋ','감사합니다','고마워','ㄱㅅ'];
const STYLES=['존댓말','반말','줄임말'];
const P=CONTEXTS.length,K=WORDS.length,DIM=P*K+K;
/* 말투마다 앞 단어를 쓰는 비율(합 1). */
const CONTEXT_MIX=[0,1,2].map(s=>{const w=CONTEXTS.map((_,c)=>1/(c%8+1)*(CUE[c]===0?1:CUE[c]===s+1?4:.25)),t=w.reduce((x,y)=>x+y,0);return w.map(x=>x/t);});
/* 같은 뜻에서 자기 말투 단어 0.8, 같은 뜻 다른 말투 단어 0.06씩, 다른 뜻 단어 여섯에 나머지 0.08을 나눈다. */
function nextDist(c,s){const m=MEANING[c],p=new Array(K).fill(.08/6);for(let t=0;t<3;t++)p[3*m+t]=t===s?.8:.06;return p;}
/* 사용자 특성은 말투에 따라 비율이 다르다(미리 정한 시나리오). */
const TRAITS={share:[.6,.3,.1],lowTier:[.2,.3,.5],nightCharge:[.85,.7,.4],homeWifi:[.9,.8,.45],newUser:[.1,.15,.4]};
const TIERS=['고급','중급','보급'],SPEED=[3,2,1];

/* 사용자 N명. h는 말투가 사용자마다 얼마나 다른지(0 = 모두 같은 섞임, 1 = 자기 말투만). 메시지마다 말투를
   (1−h)·전체 비율 + h·자기 말투로 뽑는다. 학습 쌍 n개(신규 사용자는 4~15개)와 시험 쌍 20개를 기기에 둔다. */
function population({N=1000,h=1,seed=7}={}){
 const r=rng(seed),list=[];
 for(let u=0;u<N;u++){
  const style=pick(r,TRAITS.share),tier=r()<TRAITS.lowTier[style]?2:(r()<.5?0:1),fresh=r()<TRAITS.newUser[style];
  const night=r()<TRAITS.nightCharge[style],wifi=r()<TRAITS.homeWifi[style];
  const n=fresh?4+Math.floor(r()*12):12+Math.floor(100*r()*r());
  const mix=TRAITS.share.map((x,s)=>(1-h)*x+(s===style?h:0));
  const draw=()=>{const s=pick(r,mix),c=pick(r,CONTEXT_MIX[s]);return [c,pick(r,nextDist(c,s))];};
  const train=Array.from({length:n},draw),test=Array.from({length:20},draw);
  list.push({id:u,style,tier,fresh,night,wifi,train,test,testCount:countTable(test)});
 }
 return list;
}
function countTable(pairs){const t=new Array(P*K).fill(0);for(const [c,k] of pairs)t[c*K+k]++;return t;}
const POP=new Map();
/* 같은 h·씨앗의 사용자는 한 번만 만든다(화면이 여러 번 부르므로). */
function users(h=1,seed=7,N=1000){const key=h+':'+seed+':'+N;if(!POP.has(key))POP.set(key,population({N,h,seed}));return POP.get(key);}

/* ---------- 모델 ---------- */
/* 앞 단어를 원-핫 벡터 x(24칸, 그 단어 자리만 1)로 넣으면 점수 z = W x + b는 W의 그 단어 줄 + b가 된다.
   확률 = softmax(z). w는 [W(24×9) 216개, b 9개]를 한 줄로 이은 225개 숫자다. */
const zeros=()=>new Float64Array(DIM);
function probs(w,c){const z=new Array(K);let m=-Infinity;for(let k=0;k<K;k++){z[k]=w[c*K+k]+w[P*K+k];if(z[k]>m)m=z[k];}let s=0;for(let k=0;k<K;k++){z[k]=Math.exp(z[k]-m);s+=z[k];}return z.map(x=>x/s);}
/* 작은 모델(6장): 뜻마다 자주 쓰는 앞 단어 넷(c % 8 < 4)의 줄 12개와 편향 9개, 모두 117개 숫자만 가진다.
   HeteroFL(Diao 외 2021)이 큰 모델의 왼쪽 위 부분 행렬을 작은 기기에 주는 생각을 이 모델 크기에 맞게 줄인 것이다. */
const SMALL_ROWS=CONTEXTS.map((_,c)=>c%8<4),SMALL_DIM=SMALL_ROWS.filter(Boolean).length*K+K;
const rowOn=(mask,c)=>mask!=='small'||SMALL_ROWS[c];
/* 쌍 묶음의 평균 교차 엔트로피 기울기 ∂L/∂W = (p − y) xᵀ, ∂L/∂b = p − y. mask가 'small'이면 작은 모델의 칸만. */
function gradient(w,pairs,mask){
 const g=zeros(),cache=[];
 for(const [c,k] of pairs){const p=cache[c]||(cache[c]=probs(w,c));for(let j=0;j<K;j++){const d=(p[j]-(j===k?1:0))/pairs.length;if(rowOn(mask,c))g[c*K+j]+=d;g[P*K+j]+=d;}}
 return g;
}
function loss(w,pairs){let s=0;const cache=[];for(const [c,k] of pairs){const p=cache[c]||(cache[c]=probs(w,c));s-=Math.log(p[k]);}return pairs.length?s/pairs.length:0;}
function predict(w){return CONTEXTS.map((_,c)=>{const p=probs(w,c);return p.indexOf(Math.max(...p));});}
/* 시험 쌍에서 맞힌 수: 앞 단어마다 확률이 가장 큰 단어 하나를 추천했을 때(첫 번째 추천의 적중). */
function correct(pred,testCount){let s=0;for(let c=0;c<P;c++)s+=testCount[c*K+pred[c]];return s;}
/* 정답 확률: 시험 쌍마다 모델이 실제 다음 단어에 준 확률의 합. 첫 번째 추천의 적중보다 작은 변화도 드러난다. */
function chance(ps,testCount){let s=0;for(let c=0;c<P;c++)for(let k=0;k<K;k++)if(testCount[c*K+k])s+=testCount[c*K+k]*ps[c][k];return s;}
function evaluate(w,list){
 const pred=predict(w),ps=CONTEXTS.map((_,c)=>probs(w,c)),by=[[0,0,0],[0,0,0],[0,0,0]];let hit=0,all=0,pr=0;
 for(const u of list){const h=correct(pred,u.testCount),q=chance(ps,u.testCount),n=u.test.length;hit+=h;all+=n;pr+=q;const b=by[u.style];b[0]+=h;b[1]+=n;b[2]+=q;}
 return {acc:all?hit/all:0,byStyle:by.map(([h,n])=>n?h/n:0),prob:all?pr/all:0,probByStyle:by.map(([,n,q])=>n?q/n:0),hit,all};
}

/* ---------- 기기 안 학습 ---------- */
/* E번 훑기, 묶음 B개(B=Infinity면 전체 한 묶음), 학습률 lr. mu>0이면 FedProx의 근접 항 μ(w − w_t)를 더한다.
   steps를 주면 그만큼만 학습한다(부분 학습). mask가 'small'이면 작은 모델의 칸만 학습한다. 같은 씨앗이면 같은 순서다. */
function localTrain(w0,pairs,{E=1,B=10,lr=.3,mu=0,steps=Infinity,mask,seed=1}={}){
 const w=Float64Array.from(w0),r=rng(seed),n=pairs.length,bs=Math.min(B,n)||1,order=pairs.slice(),g=new Float64Array(DIM),rows=new Set();let done=0;
 for(let e=0;e<E&&done<steps;e++){
  shuffle(r,order);
  for(let i=0;i<n&&done<steps;i+=bs,done++){
   const end=Math.min(i+bs,n),m=end-i,cache=new Map();rows.clear();
   for(let q=i;q<end;q++){const [c,k]=order[q];let p=cache.get(c);if(!p){p=probs(w,c);cache.set(c,p);}rows.add(c);for(let j=0;j<K;j++){const d=(p[j]-(j===k?1:0))/m;g[c*K+j]+=d;g[P*K+j]+=d;}}
   if(mu){for(let d=0;d<DIM;d++){if(d>=P*K||rowOn(mask,Math.floor(d/K)))w[d]-=lr*(g[d]+mu*(w[d]-w0[d]));g[d]=0;}continue;}
   for(const c of rows)for(let j=0;j<K;j++){if(rowOn(mask,c))w[c*K+j]-=lr*g[c*K+j];g[c*K+j]=0;}
   for(let j=0;j<K;j++){w[P*K+j]-=lr*g[P*K+j];g[P*K+j]=0;}
  }
 }
 return {w,steps:done};
}
const stepsNeeded=(n,E,B)=>E*Math.ceil(n/Math.min(B,n));
function sub(a,b){const d=new Float64Array(a.length);for(let i=0;i<a.length;i++)d[i]=a[i]-b[i];return d;}
function norm(v){let s=0;for(const x of v)s+=x*x;return Math.sqrt(s);}

/* ---------- 참여 기기 고르기 ---------- */
/* 라운드 시각(night: 새벽 3시, 아니면 오후 3시)에 기기 상태를 뽑는다. 밤에 충전하는 기기는 새벽에 95%가 충전 중(아니면 10%),
   집 와이파이가 있는 기기는 새벽에 95%가 와이파이(아니면 5%), 새벽 유휴 95%. 오후에는 충전 20%, 와이파이 40%, 유휴 30%.
   켠 조건을 모두 만족하는 기기만 후보가 된다(미리 정한 시나리오). */
function eligible(list,{night=true,charging=true,wifi=true,idle=true}={},r){
 return list.filter(u=>{const ch=r()<(night?(u.night?.95:.1):.2),wf=r()<(night?(u.wifi?.95:.05):.4),id=r()<(night?.95:.3);return (!charging||ch)&&(!wifi||wf)&&(!idle||id);});
}
function sample(r,list,m){return shuffle(r,list.slice()).slice(0,Math.min(m,list.length));}

/* ---------- 서버 한 라운드 ---------- */
/* 작은 모델은 숫자가 225개 중 117개라 한 걸음의 계산이 약 절반이라고 둔다(가정: 계산량이 숫자 수에 비례). */
const SMALL_SPEEDUP=2;
/* opts: C(참여 비율: 한 라운드에 고를 기기 = C × 전체), E, B, lr, mu, select(조건), hetero({mode:'drop'|'partial'|'small', deadline}),
   quantBits, seed. 서버는 학습 쌍 수 n_k로 가중 평균한다(McMahan 외 2017). 작은 모델 기기의 몫은 그 모델이 가진 칸에만 더한다(칸마다 그 칸을 가진 기기끼리 평균). */
function fedRound(w,list,opts,t){
 const {C=.1,E=1,B=10,lr=.3,mu=0,select=null,hetero=null,quantBits=32,seed=1}=opts,r=rng(seed*1000003+t);
 const pool=select?eligible(list,select,r):list,cohort=sample(r,pool,Math.max(1,Math.round(C*list.length)));
 const sum=zeros(),wsum=zeros(),log={ids:[],eligible:pool.length,picked:cohort.length,used:0,dropped:0,small:0,partial:0,styles:[0,0,0],tiers:[0,0,0],bytes:0};
 for(const u of cohort){
  const need=stepsNeeded(u.train.length,E,B);let steps=Infinity,mask;
  if(hetero){const can=Math.floor(hetero.deadline*SPEED[u.tier]);
   if(can<need){if(hetero.mode==='drop'){log.dropped++;continue;}if(hetero.mode==='partial'){steps=Math.max(1,can);log.partial++;}if(hetero.mode==='small'){mask='small';log.small++;if(can*SMALL_SPEEDUP<need)steps=Math.max(1,can*SMALL_SPEEDUP);}}}
  let d=sub(localTrain(w,u.train,{E,B,lr,mu,steps,mask,seed:seed*7919+t*131+u.id}).w,w);
  if(quantBits<32)d=quantize(d,quantBits,rng(seed+u.id*17+t*7));
  const n=u.train.length;for(let i=0;i<DIM;i++){if(i<P*K&&!rowOn(mask,Math.floor(i/K)))continue;sum[i]+=n*d[i];wsum[i]+=n;}
  log.used++;log.ids.push(u.id);log.styles[u.style]++;log.tiers[u.tier]++;const dim=mask==='small'?SMALL_DIM:DIM;log.bytes+=dim*4+updateBytes(dim,quantBits);
 }
 const next=Float64Array.from(w);for(let i=0;i<DIM;i++)if(wsum[i])next[i]+=sum[i]/wsum[i];
 return {w:next,log};
}
/* 기기가 올리는 업데이트 크기: 숫자 dim개 × b비트, b < 32이면 눈금 폭(최댓값) 하나를 32비트로 더 보낸다. */
const updateBytes=(dim,b=32)=>dim*b/8+(b<32?4:0);
/* 확률적 반올림 양자화: 기기마다 최댓값 r로 [−r, r]을 2^b − 1 칸으로 나누고 확률적으로 위·아래 눈금에 둔다(평균은 원래 값). */
function quantize(d,b,r){let top=0;for(const x of d)top=Math.max(top,Math.abs(x));top=top||1;const L=2**b-1,q=new Float64Array(d.length);for(let i=0;i<d.length;i++){const x=(d[i]+top)/(2*top)*L,f=Math.floor(x);q[i]=(f+(r()<x-f?1:0))/L*2*top-top;}return q;}

/* FedAvg를 rounds번 돌려 라운드마다 정확도를 남긴다. 같은 입력이면 같은 결과다. */
function train(list,opts){
 const rounds=opts.rounds||40,curve=[],logs=[];let w=opts.w0?Float64Array.from(opts.w0):zeros(),bytes=0;
 for(let t=0;t<rounds;t++){const s=fedRound(w,list,opts,t);w=s.w;bytes+=s.log.bytes;logs.push(s.log);curve.push(evaluate(w,list).acc);}
 return {w,curve,logs,bytes,final:evaluate(w,list)};
}
/* 중앙 학습: 모든 학습 쌍을 서버에 모아 같은 크기 묶음으로 SGD. 한 번 훑기를 한 라운드로 센다. */
function central(list,{epochs=40,B=100,lr=.3,seed=3}={}){
 const all=list.flatMap(u=>u.train),curve=[];let w=zeros();const r=rng(seed);
 for(let e=0;e<epochs;e++){shuffle(r,all);for(let i=0;i<all.length;i+=B){const g=gradient(w,all.slice(i,i+B));for(let d=0;d<DIM;d++)w[d]-=lr*g[d];}curve.push(evaluate(w,list).acc);}
 return {w,curve,final:evaluate(w,list),pairs:all.length};
}
/* 데이터센터 데이터 병렬(동기식): 한 묶음을 작업기 workers대에 나눠 각자 기울기를 내고 몫만큼 평균한다.
   그 평균은 한 대가 묶음 전체로 계산한 기울기와 같다. 같은 묶음에서 둘을 함께 계산해 가장 큰 차이를 돌려준다. */
function dataParallelGap(w,batch,workers){
 const one=gradient(w,batch),size=Math.ceil(batch.length/workers),avg=zeros();
 for(let k=0;k<workers;k++){const part=batch.slice(k*size,(k+1)*size);if(!part.length)continue;const g=gradient(w,part);for(let d=0;d<DIM;d++)avg[d]+=g[d]*part.length/batch.length;}
 let gap=0;for(let d=0;d<DIM;d++)gap=Math.max(gap,Math.abs(avg[d]-one[d]));return gap;
}
function roundsTo(curve,target){const i=curve.findIndex(a=>a>=target);return i<0?null:i+1;}

/* ---------- 통신량 ---------- */
/* 라운드마다 내려보내는 모델(dim × 4바이트)과 올리는 업데이트(dim × b비트)를 기기 수만큼 더한다. */
function commBytes({rounds,devices,dim=DIM,bits=32}){const down=dim*4,up=updateBytes(dim,bits);return {down,up,perRound:devices*(down+up),total:rounds*devices*(down+up)};}
/* 원문을 서버로 모을 때: 단어 쌍 하나를 UTF-8로 적은 두 단어 + 띄어쓰기와 줄바꿈 2바이트. */
function rawBytes(list){let s=0;const enc=t=>new TextEncoder().encode(t).length;for(const u of list)for(const [c,k] of u.train)s+=enc(CONTEXTS[c])+enc(WORDS[k])+2;return s;}

const api={rng,gauss,pick,shuffle,choiceOrder,CONTEXTS,WORDS,STYLES,MEANING,CUE,P,K,DIM,CONTEXT_MIX,TRAITS,TIERS,SPEED,SMALL_SPEEDUP,SMALL_ROWS,SMALL_DIM,nextDist,population,users,countTable,zeros,probs,gradient,loss,predict,correct,chance,evaluate,localTrain,stepsNeeded,sub,norm,eligible,sample,fedRound,updateBytes,quantize,train,central,dataParallelGap,roundsTo,commBytes,rawBytes};
root.FLMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
