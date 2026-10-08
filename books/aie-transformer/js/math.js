/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   규칙과 상수의 출처는 원본 커리큘럼 rohitg00/ai-engineering-from-scratch Phase 7 레슨(확인일 2026-10-08)이고,
   책이 정한 가정값은 각 함수 위에 적었다. 무작위 값은 모두 시드를 고정해 같은 입력이면 같은 결과가 나온다. */
(function(root){
'use strict';
const TOKENS=['나는','어제','산','책을','오늘','다','읽었다'];
/* 시드 고정 난수(mulberry32)와 표준정규분포(Box–Muller) */
function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function normal(r){let u=0;while(u===0)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r());}
const vec=(r,d)=>Array.from({length:d},()=>normal(r));
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
function softmax(xs){const m=Math.max(...xs);if(m===-Infinity)return xs.map(()=>0);const e=xs.map(x=>x===-Infinity?0:Math.exp(x-m)),s=e.reduce((a,b)=>a+b,0);return e.map(x=>x/s);}
const entropy=p=>{const h=-p.reduce((s,x)=>s+(x>0?x*Math.log2(x):0),0);return h===0?0:h;};

/* 1장: 직렬 깊이. RNN은 토큰 수만큼 차례로 계산하고, 어텐션은 한 번의 행렬곱(합을 트리로 모으면 log2 N 단계)으로 끝난다.
   대신 어텐션 점수표는 N×N 칸이다. fp16(2바이트) 한 헤드 기준. */
function depth(N){const tree=Math.max(1,Math.ceil(Math.log2(N)));return {N,rnn:N,tree,entries:N*N,scoreMB:N*N*2/1e6,ratio:N/tree};}

/* 2장: 점수를 √d_k로 나누는지에 따른 softmax 포화. 질문 하나와 열쇠 7개를 표준정규분포에서 뽑아 trials번 평균한다.
   grad는 softmax 야코비안 대각합 Σp(1−p): 0에 가까우면 기울기가 거의 흐르지 않는다. */
function attnRow(dk,scaled,trials=200,seed=7){
 const r=rng(seed+dk);let maxSum=0,entSum=0,gradSum=0,sq=0,n=0,example=null;
 for(let t=0;t<trials;t++){
  const q=vec(r,dk),scores=TOKENS.map(()=>dot(q,vec(r,dk))/(scaled?Math.sqrt(dk):1)),w=softmax(scores);
  scores.forEach(s=>{sq+=s*s;n++;});maxSum+=Math.max(...w);entSum+=entropy(w);gradSum+=w.reduce((s,p)=>s+p*(1-p),0);
  if(!example)example={scores,weights:w};
 }
 return {dk,scaled,example,std:Math.sqrt(sq/n),maxW:maxSum/trials,entropy:entSum/trials,grad:gradSum/trials,maxEntropy:Math.log2(TOKENS.length)};
}

/* 3장: 헤드 나누기. 투영 행렬 Q·K·V·O는 헤드 수와 무관하게 4·d_model² 개다. 점수표는 헤드마다 N×N(fp16). */
function heads(dModel,nHeads,N=2048){
 const ok=dModel%nHeads===0,dHead=dModel/nHeads;
 return {dModel,nHeads,ok,dHead,proj:4*dModel*dModel,maps:nHeads,scoreMB:nHeads*N*N*2/1e6,scale:Math.sqrt(dHead),zone:!ok?'invalid':dHead<32?'small':dHead>256?'large':'ok'};
}

/* 4장: 사인 위치 인코딩과 RoPE. 차원 쌍 (2i, 2i+1)마다 θ_i = base^(−2i/d). */
function sinusoid(pos,d,base=10000){const pe=[];for(let i=0;i<d/2;i++){const a=pos/Math.pow(base,2*i/d);pe.push(Math.sin(a),Math.cos(a));}return pe;}
function rope(x,pos,base=10000){const d=x.length,o=x.slice();for(let i=0;i<d/2;i++){const a=pos/Math.pow(base,2*i/d),c=Math.cos(a),s=Math.sin(a);o[2*i]=x[2*i]*c-x[2*i+1]*s;o[2*i+1]=x[2*i]*s+x[2*i+1]*c;}return o;}
function posScore(method,q,k,m,n){
 if(method==='rope')return dot(rope(q,m),rope(k,n));
 const d=q.length,pm=sinusoid(m,d),pn=sinusoid(n,d);return dot(q.map((x,i)=>x+pm[i]),k.map((x,i)=>x+pn[i]));
}
const POS_QK=(()=>{const r=rng(404);return {q:vec(r,8),k:vec(r,8)};})();
/* 질문 위치 m, 열쇠 위치 n을 함께 shift만큼 옮겼을 때의 점수. RoPE는 m−n에만 의존해야 한다. */
function positionShift(method,shift,m=6,n=3){const {q,k}=POS_QK;return {base:posScore(method,q,k,m,n),moved:posScore(method,q,k,m+shift,n+shift),gap:m-n};}

/* 5장: 블록 파라미터. 어텐션 4d², FFN은 ReLU 4배 폭(2행렬)이면 8d², SwiGLU 8/3배 폭(3행렬)이면 8d²로 같다.
   임베딩은 어휘 32,000개를 출력층과 공유한다고 가정한다(묶은 임베딩). 노름의 작은 파라미터는 뺀다. */
function blockParams(d,L,vocab=32000){const attn=4*d*d,ffn=8*d*d,emb=vocab*d;return {d,L,attn:attn*L,ffn:ffn*L,emb,perLayer:attn+ffn,total:(attn+ffn)*L+emb};}
function layerNorm(x,eps=1e-5){const m=x.reduce((a,b)=>a+b,0)/x.length,v=x.reduce((a,b)=>a+(b-m)**2,0)/x.length;return x.map(t=>(t-m)/Math.sqrt(v+eps));}
function rmsNorm(x,eps=1e-6){const r=Math.sqrt(x.reduce((a,b)=>a+b*b,0)/x.length+eps);return x.map(t=>t/r);}

/* 6장: BERT 마스킹. 15%를 고르고, 고른 것의 80%는 [MASK], 10%는 무작위 토큰, 10%는 그대로 둔다. */
function mlm(n,seed=11){
 const r=rng(seed);let sel=0,mask=0,rand=0,keep=0;const marks=[];
 for(let i=0;i<n;i++){let m='';if(r()<0.15){sel++;const u=r();if(u<0.8){mask++;m='mask';}else if(u<0.9){rand++;m='rand';}else{keep++;m='keep';}}if(i<TOKENS.length)marks.push(m);}
 return {n,sel,mask,rand,keep,expect:{sel:n*0.15,mask:n*0.12,rand:n*0.015,keep:n*0.015},marks};
}
/* 6장: 인과 마스크의 세 단계. 1 접두 평균, 2 학습된 고정 점수, 3 내용에 따른 점수(QKᵀ/√d). masked=false면 미래도 본다. */
function causalMatrix(stage,masked=true,seed=21){
 const n=TOKENS.length,r=rng(seed),X=TOKENS.map(()=>vec(r,8)),S=TOKENS.map(()=>TOKENS.map(()=>normal(r)));
 return TOKENS.map((_,i)=>{
  const raw=TOKENS.map((_,j)=>stage===1?0:stage===2?S[i][j]:dot(X[i],X[j])/Math.sqrt(8));
  return softmax(raw.map((s,j)=>masked&&j>i?-Infinity:s));
 });
}

/* 7장: 인코더-디코더의 세 가지 어텐션. step은 디코더가 지금까지 만든 출력 토큰 수(1~nTgt). */
function maskGrid(type,step,nSrc=7,nTgt=5){
 if(type==='encoder')return Array.from({length:nSrc},()=>Array(nSrc).fill(1));
 if(type==='decoder')return Array.from({length:nTgt},(_,i)=>Array.from({length:nTgt},(_,j)=>i<step&&j<=i?1:0));
 return Array.from({length:nTgt},(_,i)=>Array(nSrc).fill(i<step?1:0));
}
/* 7장: ViT 패치 수. 나누어떨어지지 않으면 남는 가장자리를 잘라 낸다고 가정한다. 숨은 차원 768(ViT-Base). */
function patches(size,P,C=3,d=768){const g=Math.floor(size/P),N=g*g;return {size,P,grid:g,N,tokens:N+1,dim:P*P*C,crop:size-g*P,entries:(N+1)**2,embedParams:P*P*C*d};}
/* 7장: Whisper 입력. 16kHz, 10ms 간격 → 초당 100프레임, 30초(3,000프레임)로 채운 뒤 합성곱 줄기가 절반(1,500)으로 줄인다. */
function whisperFrames(sec){const frames=Math.round(sec*100);return {sec,frames,padded:3000,tokens:1500,padShare:1-Math.min(frames,3000)/3000};}

/* 8장: MoE 라우터. 전문가 E개, 토큰 T개. 라우터 점수에 치우침(base)이 있다고 가정한다.
   보조 손실 없는 균형: 라운드마다 많이 쓰인 전문가의 편향을 −γ, 적게 쓰인 쪽을 +γ. 선택에만 편향을 더하고 게이트는 원래 점수로. */
const MOE_BASE=[1.2,0.8,0.5,0.2,0,-0.2,-0.4,-0.6];
function moeRoute(k,rounds,{T=256,gamma=0.05,seed=31}={}){
 const E=MOE_BASE.length,r=rng(seed),scores=Array.from({length:T},()=>MOE_BASE.map(b=>b+0.5*normal(r))),bias=Array(E).fill(0),target=T*k/E;
 const assign=()=>{const c=Array(E).fill(0);let gate=0;for(const s of scores){const top=s.map((v,e)=>[v+bias[e],e]).sort((a,b)=>b[0]-a[0]).slice(0,k).map(x=>x[1]);top.forEach(e=>c[e]++);gate+=Math.max(...softmax(top.map(e=>s[e])));}return {c,gate:gate/T};};
 const first=assign().c;let res=assign();
 for(let t=0;t<rounds;t++){res.c.forEach((x,e)=>{bias[e]+=x>target?-gamma:x<target?gamma:0;});res=assign();}
 return {k,rounds,E,T,target,counts:res.c,before:first,imbalance:Math.max(...res.c)/target,imbalanceBefore:Math.max(...first)/target,bias:bias.slice(),topGate:res.gate,active:k/E};
}

/* 9장: FlashAttention식 타일 softmax. 질문 하나와 열쇠·값 N개를 tile개씩 읽으며 (최댓값, 합)을 이어 간다. */
function tiledAttention(tile,N=16,d=4,seed=41){
 const r=rng(seed),q=vec(r,d),K=Array.from({length:N},()=>vec(r,d)),V=Array.from({length:N},()=>vec(r,d));
 const sc=K.map(k=>dot(q,k)/Math.sqrt(d)),w=softmax(sc),ref=Array.from({length:d},(_,j)=>w.reduce((s,p,i)=>s+p*V[i][j],0));
 let m=-Infinity,s=0,out=Array(d).fill(0);const steps=[];
 for(let st=0;st<N;st+=tile){
  const blk=sc.slice(st,st+tile),nm=Math.max(m,...blk),old=m===-Infinity?0:Math.exp(m-nm),ex=blk.map(x=>Math.exp(x-nm));
  s=s*old+ex.reduce((a,b)=>a+b,0);out=out.map((o,j)=>o*old+ex.reduce((a,e,i)=>a+e*V[st+i][j],0));m=nm;steps.push({from:st,to:Math.min(st+tile,N)-1,max:m,sum:s});
 }
 out=out.map(o=>o/s);
 return {tile,N,out,ref,err:Math.max(...out.map((o,j)=>Math.abs(o-ref[j]))),steps,held:tile,full:N};
}
/* 9장: 점수표를 HBM에 통째로 쓰는 양과 128×128 타일 하나의 양(fp16, 헤드 하나). */
function scoreMemory(N,tile=128){return {N,fullMB:N*N*2/1e6,tileKB:tile*tile*2/1e3};}
/* 9장: 어텐션 변형별 KV 캐시. 기본 설정은 원본 레슨의 70B급 예: 80층, 질문 헤드 64, d_head 128, fp16.
   SWA는 5층 중 창 1,024 + 1층 전역(5:1), 차등 어텐션은 K·V를 두 벌 둔다. */
const KV_VARIANTS={mha:{label:'MHA (KV 헤드 64)',kv:64},gqa:{label:'GQA (KV 헤드 8)',kv:8},mqa:{label:'MQA (KV 헤드 1)',kv:1},swa:{label:'GQA + SWA 5:1',kv:8,window:1024},diff:{label:'GQA + 차등',kv:8,copies:2}};
function kvCache(variant,N,{layers=80,dHead=128,bytes=2,batch=1}={}){
 const v=KV_VARIANTS[variant],perTokLayer=2*v.kv*dHead*bytes*(v.copies||1);
 const eff=v.window?(N/6+5*Math.min(N,v.window)/6):N;
 return {variant,label:v.label,N,perTokLayer,gb:perTokLayer*layers*eff*batch/1e9,effTokens:eff};
}

/* 10장: Chinchilla(Hoffmann 2022) 손실 L(N,D)=A/N^α + B/D^β + E와 계산량 C≈6ND. */
const CH={A:406.4,B:410.7,alpha:0.34,beta:0.28,E:1.69};
const chLoss=(N,D)=>CH.A/Math.pow(N,CH.alpha)+CH.B/Math.pow(D,CH.beta)+CH.E;
function chOptimal(C){let best=null;for(let e=6;e<=13.5;e+=0.005){const N=Math.pow(10,e),D=C/(6*N),L=chLoss(N,D);if(!best||L<best.L)best={N,D,L};}best.ratio=best.D/best.N;return best;}
function chAtRatio(C,ratio){const N=Math.sqrt(C/(6*ratio)),D=ratio*N;return {N,D,L:chLoss(N,D),ratio};}

/* 11장: 추측 디코딩. 수락률 α, 초안 n개, 초안 한 번 비용 c(큰 모델 대비). 한 번 검증에서 얻는 기대 토큰 (1−α^(n+1))/(1−α). */
function spec(alpha,n,c=0.1){const E=alpha>=1?n+1:(1-Math.pow(alpha,n+1))/(1-alpha),cost=1+n*c;return {alpha,n,c,tokens:E,cost,speedup:E/cost,callsPer100:100/E};}
function specBest(alpha,c=0.1,maxN=12){let b=spec(alpha,1,c);for(let n=2;n<=maxN;n++){const s=spec(alpha,n,c);if(s.speedup>b.speedup)b=s;}return b;}
/* 두 분포의 수락률 α = Σ min(p_i, q_i)와 거절 뒤에 뽑는 잔여 분포 (q−p)+ 정규화 */
const acceptRate=(p,q)=>p.reduce((s,x,i)=>s+Math.min(x,q[i]),0);
function residual(q,p){const raw=q.map((x,i)=>Math.max(0,x-p[i])),s=raw.reduce((a,b)=>a+b,0);return s?raw.map(x=>x/s):raw;}

/* 12장: 설계표 다시 짜기. 기준 모델 '도란': d 2048, 16층, 헤드 16(KV 16), d_head 128, 어휘 32,000, fp16, 학습 토큰 = 파라미터×20.
   메모리 = 가중치 + KV 캐시. 디코드 속도는 토큰마다 읽는 바이트(가중치 + KV)에 반비례한다고 가정한다(메모리 대역폭 병목). */
const REQS={
 long:{label:'문맥 32K · 동시 8명 · 24GB GPU 하나',ctx:32768,batch:8},
 fast:{label:'생성 속도 1.5배 이상 (문맥 4K)',ctx:4096,batch:1},
 quality:{label:'토큰당 계산은 그대로, 손실은 낮게',ctx:4096,batch:1}
};
const CHANGES={none:'바꾸지 않음',gqa:'GQA: KV 헤드 16 → 4',swa:'슬라이딩 창 1,024 (5:1)',spec:'추측 디코딩 (α 0.7, 초안 4개)',moe:'MoE: 반폭 전문가 8개 중 2개',tokens:'학습 토큰 10배 (과잉 학습)'};
function design(change){
 const d=2048,L=16,dHead=128,vocab=32000,kv=change==='gqa'?4:16;
 const attn=2*d*d+2*d*kv*dHead,ffn=8*d*d,emb=vocab*d,moe=change==='moe';
 const total=(attn+(moe?4*ffn:ffn))*L+emb,active=(attn+ffn)*L+emb+(moe?8*d*L:0);
 const base=(4*d*d+ffn)*L+emb;
 return {d,L,kv,dHead,total,active,tokens:base*20*(change==='tokens'?10:1),window:change==='swa'?1024:null,kvPerTok:2*kv*dHead*2*L};
}
function redesign(req,change){
 const R=REQS[req],D=design(change),weightsGB=D.total*2/1e9+(change==='spec'?0.2:0);
 const eff=D.window?(R.ctx/6+5*Math.min(R.ctx,D.window)/6):R.ctx,kvGB=D.kvPerTok*eff*R.batch/1e9,memGB=weightsGB+kvGB;
 const B=design('none'),baseRead=B.active*2/1e9+B.kvPerTok*R.ctx*R.batch/1e9,read=D.active*2/1e9+kvGB;
 let speed=baseRead/read;if(change==='spec')speed=spec(0.7,4).speedup*baseRead/(baseRead+0.2);
 const loss=change==='moe'?null:chLoss(D.active,D.tokens),baseLoss=chLoss(B.active,B.tokens);
 const pass=req==='long'?memGB<=24:req==='fast'?speed>=1.5:(loss===null?null:loss<baseLoss-1e-9&&D.active<=B.active*1.001);
 return {req,change,label:CHANGES[change],reqLabel:R.label,total:D.total,active:D.active,weightsGB,kvGB,memGB,speed,loss,baseLoss,pass};
}

const A08Math={TOKENS,rng,normal,softmax,entropy,dot,depth,attnRow,heads,sinusoid,rope,posScore,positionShift,blockParams,layerNorm,rmsNorm,mlm,causalMatrix,maskGrid,patches,whisperFrames,MOE_BASE,moeRoute,tiledAttention,scoreMemory,KV_VARIANTS,kvCache,CH,chLoss,chOptimal,chAtRatio,spec,specBest,acceptRate,residual,REQS,CHANGES,design,redesign};
if(typeof module!=='undefined')module.exports=A08Math;else root.A08Math=A08Math;
})(typeof window!=='undefined'?window:globalThis);
