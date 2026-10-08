/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   모든 수치는 원본 레슨(phases/10-llms-from-scratch)과 그 레슨이 인용한 논문의 식을 그대로 계산한다. */
(function(root){
'use strict';
/* 재현 가능한 난수(mulberry32)와 표준정규(Box-Muller) */
function rng(seed){let a=seed>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function gauss(r){let u=0;while(u===0)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r());}
const sigmoid=z=>1/(1+Math.exp(-z));
const softplus=z=>z>30?z:Math.log1p(Math.exp(z));

/* ---------- 1장: 바이트 단위 BPE ---------- */
/* UTF-8 인코딩·디코딩을 직접 구현한다(TextEncoder가 없는 실행 환경에서도 같은 결과). */
function utf8(s){const out=[];for(const ch of s){const c=ch.codePointAt(0);if(c<0x80)out.push(c);else if(c<0x800)out.push(0xC0|c>>6,0x80|c&63);else if(c<0x10000)out.push(0xE0|c>>12,0x80|c>>6&63,0x80|c&63);else out.push(0xF0|c>>18,0x80|c>>12&63,0x80|c>>6&63,0x80|c&63);}return out;}
function decodeStrict(b){let s='',i=0;while(i<b.length){const x=b[i],n=x<0x80?0:x>=0xC2&&x<0xE0?1:x>=0xE0&&x<0xF0?2:x>=0xF0&&x<0xF5?3:-1;if(n<0||i+n>=b.length+(n?0:1))return null;let c=n?x&(0x3F>>n):x;for(let k=1;k<=n;k++){const y=b[i+k];if((y&0xC0)!==0x80)return null;c=c<<6|y&63;}if((n===2&&c<0x800)||(n===3&&(c<0x10000||c>0x10FFFF)))return null;s+=String.fromCodePoint(c);i+=n+1;}return s;}
/* GPT-2처럼 앞 공백을 낱말에 붙여 조각으로 나눈다(조각 경계를 넘는 병합 금지). */
const chunks=s=>s.match(/ ?[^\s]+|\s+/g)||[];
function mergeSeq(seq,a,b,id){const out=[];for(let i=0;i<seq.length;i++){if(i<seq.length-1&&seq[i]===a&&seq[i+1]===b){out.push(id);i++;}else out.push(seq[i]);}return out;}
/* 가장 잦은 인접 쌍을 maxMerges번 합친다. 동률이면 말뭉치에서 먼저 나온 쌍을 고른다. */
function bpeTrain(text,maxMerges){
 let seqs=chunks(text).map(utf8);const vocab=new Map();for(let i=0;i<256;i++)vocab.set(i,[i]);
 const merges=[],tokens=[seqs.reduce((n,s)=>n+s.length,0)];
 for(let m=0;m<maxMerges;m++){
  const count=new Map();
  for(const s of seqs)for(let i=0;i<s.length-1;i++){const k=s[i]+','+s[i+1];count.set(k,(count.get(k)||0)+1);}
  if(!count.size)break;
  let top=null,topC=0;for(const [k,c] of count)if(c>topC){top=k;topC=c;}
  if(topC<2)break;
  const [a,b]=top.split(',').map(Number),id=256+m;vocab.set(id,vocab.get(a).concat(vocab.get(b)));
  merges.push({a,b,id,count:topC,bytes:vocab.get(id)});seqs=seqs.map(s=>mergeSeq(s,a,b,id));tokens.push(seqs.reduce((n,s)=>n+s.length,0));
 }
 return {merges,tokens,bytes:tokens[0]};
}
/* 배운 순서대로 병합을 적용한다. 병합표가 곧 토크나이저다. */
function bpeEncode(text,merges){let ids=[];for(const c of chunks(text)){let s=utf8(c);for(const m of merges)s=mergeSeq(s,m.a,m.b,m.id);ids=ids.concat(s);}return ids;}
function tokenBytes(id,merges){if(id<256)return [id];const m=merges.find(x=>x.id===id);return m?m.bytes:[];}
function showBytes(bytes){const s=decodeStrict(bytes);return s!==null?s.replace(/ /g,'·'):'‹'+bytes.map(b=>b.toString(16).toUpperCase().padStart(2,'0')).join(' ')+'›';}

/* ---------- 2장: MinHash 중복 탐지와 시퀀스 패킹 ---------- */
function shingles(text,n=3){const w=text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(Boolean),out=new Set();for(let i=0;i+n<=w.length;i++)out.add(w.slice(i,i+n).join(' '));return out;}
function jaccard(a,b){let inter=0;for(const x of a)if(b.has(x))inter++;const uni=a.size+b.size-inter;return uni?inter/uni:0;}
/* FNV-1a 32비트 해시에 해시 함수 번호를 씨앗으로 섞는다. */
function hash32(str,seed){let h=(2166136261^Math.imul(seed+1,16777619))>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}h^=h>>>13;h=Math.imul(h,0x5bd1e995)>>>0;h^=h>>>15;return h>>>0;}
function minhashSig(set,k){const sig=new Array(k).fill(Infinity);for(const s of set)for(let i=0;i<k;i++){const h=hash32(s,i);if(h<sig[i])sig[i]=h;}return sig;}
function minhashEstimate(a,b,k){const x=minhashSig(a,k),y=minhashSig(b,k);let same=0;for(let i=0;i<k;i++)if(x[i]===y[i])same++;return same/k;}
/* LSH: b개 띠, 띠마다 r행. 유사도 s인 쌍이 후보가 될 확률 1-(1-s^r)^b */
const lshProb=(s,bands,rows)=>1-Math.pow(1-Math.pow(s,rows),bands);
/* 문서마다 따로 채우기(패딩) vs 이어 붙이기(패킹). 두 방식 모두 문서 끝에 EOS 1개를 붙인다. */
function packing(lengths,L){
 const real=lengths.reduce((s,x)=>s+x+1,0),padSeq=lengths.reduce((s,x)=>s+Math.ceil((x+1)/L),0),packSeq=Math.ceil(real/L);
 return {real,padSeq,packSeq,padUtil:real/(padSeq*L),packUtil:real/(packSeq*L),padWaste:padSeq*L-real,packWaste:packSeq*L-real};
}

/* ---------- 3장: 글자 바이그램 언어 모델을 경사하강으로 학습 ---------- */
function bigramData(text){const chars=[...new Set([...text])].sort(),idx=new Map(chars.map((c,i)=>[c,i])),V=chars.length,C=Array.from({length:V},()=>new Array(V).fill(0));let N=0;const s=[...text];for(let i=0;i<s.length-1;i++){C[idx.get(s[i])][idx.get(s[i+1])]++;N++;}return {chars,idx,V,C,N};}
function rowSoftmax(r){const m=Math.max(...r),e=r.map(x=>Math.exp(x-m)),z=e.reduce((a,b)=>a+b,0);return e.map(x=>x/z);}
function bigramLoss(d,W){let L=0;for(let i=0;i<d.V;i++){const n=d.C[i].reduce((a,b)=>a+b,0);if(!n)continue;const p=rowSoftmax(W[i]);for(let j=0;j<d.V;j++)if(d.C[i][j])L-=d.C[i][j]*Math.log(p[j]);}return L/d.N;}
/* 0으로 시작한 로짓 표(균등 분포, 손실 = ln V)를 전체 배치 경사하강으로 학습한다. */
function bigramTrain(d,steps,lr){
 const W=Array.from({length:d.V},()=>new Array(d.V).fill(0)),hist=[bigramLoss(d,W)];
 for(let t=0;t<steps;t++){for(let i=0;i<d.V;i++){const n=d.C[i].reduce((a,b)=>a+b,0);if(!n)continue;const p=rowSoftmax(W[i]);for(let j=0;j<d.V;j++)W[i][j]-=lr*(n*p[j]-d.C[i][j])/d.N;}hist.push(bigramLoss(d,W));}
 return {W,hist};
}
/* 빈도를 세어 만든 최적 바이그램의 손실(학습이 다가갈 수 있는 바닥) */
function bigramFloor(d){let L=0;for(const row of d.C){const n=row.reduce((a,b)=>a+b,0);for(const c of row)if(c)L-=c*Math.log(c/n);}return L/d.N;}
function bigramGreedy(d,W,start,n){let c=start,out=start;for(let i=0;i<n;i++){const r=W[d.idx.get(c)];let best=0;for(let j=1;j<r.length;j++)if(r[j]>r[best])best=j;c=d.chars[best];out+=c;}return out;}

/* ---------- 3장: Chinchilla 손실 식(Hoffmann et al. 2022, 접근 3의 적합값) ---------- */
const CH={E:1.69,A:406.4,B:410.7,alpha:0.34,beta:0.28};
const chinchillaLoss=(N,D)=>CH.E+CH.A/Math.pow(N,CH.alpha)+CH.B/Math.pow(D,CH.beta);
const trainFlops=(N,D)=>6*N*D;
/* 계산량 C를 고정하고 N을 log 격자에서 훑어 손실이 가장 낮은 크기를 찾는다(D = C / 6N). */
function chinchillaOptimal(C){let best=null;for(let e=7;e<=13;e+=0.005){const N=Math.pow(10,e),D=C/(6*N),L=chinchillaLoss(N,D);if(!best||L<best.L)best={N,D,L};}return best;}

/* ---------- 4장: 학습 메모리(ZeRO 논문의 혼합 정밀도 Adam 회계)와 체크포인팅 ---------- */
/* Ψ개 파라미터: 16비트 가중치 2Ψ, 16비트 기울기 2Ψ, FP32 옵티마이저 상태 12Ψ(마스터 가중치·m·v) */
function trainMemory(paramsB,stage,gpus){
 const P=paramsB*1e9,n=gpus,w=2*P,g=2*P,o=12*P;
 const sh={0:[1,1,1],1:[1,1,n],2:[1,n,n],3:[n,n,n]}[stage];
 const parts={weights:w/sh[0]/1e9,grads:g/sh[1]/1e9,optimizer:o/sh[2]/1e9};
 return {...parts,total:parts.weights+parts.grads+parts.optimizer};
}
/* 모델 상태(활성값 제외)가 GPU 한 장 cap GB 아래로 들어가는 최소 GPU 수. 복제(0단계)는 장수와 무관하므로 안 들어가면 Infinity. */
function minGpus(paramsB,stage,cap=80,max=4096){for(let n=1;n<=max;n++)if(trainMemory(paramsB,stage,n).total<=cap)return n;return Infinity;}
/* Korthikanti et al. 2022: 층 하나의 16비트 활성값 = s·b·h·(34 + 5·a·s/h) 바이트 */
function activationLayer(c){return c.s*c.b*c.h*(34+5*c.a*c.s/c.h);}
function checkpointPlan(c,mode,k){
 const full=activationLayer(c),sel=34*c.s*c.b*c.h,input=2*c.s*c.b*c.h,f=24*c.b*c.s*c.h*c.h+4*c.b*c.s*c.s*c.h,att=4*c.b*c.s*c.s*c.h;
 if(mode==='selective')return {bytes:c.L*sel,overhead:att/(3*f),perLayer:sel};
 if(mode==='full'){const kk=Math.max(1,Math.min(c.L,k));return {bytes:Math.ceil(c.L/kk)*input+kk*full,overhead:1/3,perLayer:full,segments:Math.ceil(c.L/kk)};}
 return {bytes:c.L*full,overhead:0,perLayer:full};
}

/* ---------- 5장: 파이프라인 병렬의 거품(GPipe 일정) ---------- */
/* P단계, M개 마이크로배치. 순전파·역전파 한 칸의 시간이 같다고 가정한 일정표를 만든다. */
function gpipeSchedule(P,M){
 const cells=[],T=2*(M+P-1);
 for(let s=0;s<P;s++)for(let m=0;m<M;m++){cells.push({stage:s,t:s+m,kind:'F',mb:m+1});cells.push({stage:s,t:(M+P-1)+(P-1-s)+m,kind:'B',mb:m+1});}
 const busy=cells.length,total=P*T;
 return {cells,T,bubble:(total-busy)/total,formula:(P-1)/(M+P-1),relative:(P-1)/M,peakGpipe:M,peak1f1b:Math.min(P,M)};
}

/* ---------- 6장: SFT 손실 가리기 ---------- */
/* 응답 토큰 8개의 손실은 고정(교육용 값), 지시 토큰은 길이만큼 손실 3.0을 낸다고 가정한다. */
const RESP=[2.1,1.4,0.9,1.6,0.7,1.2,0.5,0.8];
function sftLoss(promptLen,mode){
 const prompt=new Array(promptLen).fill(3.0),all=prompt.concat(RESP),resp=RESP.reduce((a,b)=>a+b,0);
 if(mode==='all')return {loss:all.reduce((a,b)=>a+b,0)/all.length,counted:all.length,denom:all.length};
 if(mode==='seqlen')return {loss:resp/all.length,counted:RESP.length,denom:all.length};
 return {loss:resp/RESP.length,counted:RESP.length,denom:RESP.length};
}

/* ---------- 7장: Bradley-Terry와 DPO ---------- */
/* m = [log π(y_w)/π_ref(y_w)] − [log π(y_l)/π_ref(y_l)] (단위: nat) */
function dpo(m,beta){const z=beta*m;return {loss:softplus(-z),prob:sigmoid(z),weight:sigmoid(-z),grad:-beta*sigmoid(-z)};}
const bradleyTerry=diff=>({prob:sigmoid(diff),loss:softplus(-diff)});

/* ---------- 8장: GRPO 집단 상대 이점 ---------- */
function groupAdvantages(rewards){const n=rewards.length,mean=rewards.reduce((a,b)=>a+b,0)/n,sd=Math.sqrt(rewards.reduce((a,r)=>a+(r-mean)**2,0)/n);return {mean,sd,adv:rewards.map(r=>sd>0?(r-mean)/sd:0)};}
function grpoGroup(G,p,seed){const r=rng(seed),rewards=Array.from({length:G},()=>r()<p?1:0);return {rewards,...groupAdvantages(rewards)};}
/* 정답 여부만 보상할 때 G개가 모두 같아 신호가 0이 될 확률 */
const grpoZeroSignal=(G,p)=>Math.pow(p,G)+Math.pow(1-p,G);
/* 시드 1..trials 집단을 실제로 뽑아 신호가 0인 비율을 센다. */
function grpoEmpirical(G,p,trials){let zero=0;for(let t=1;t<=trials;t++){if(grpoGroup(G,p,t*7919).sd===0)zero++;}return zero/trials;}

/* ---------- 9장: ELO 점수 ---------- */
const eloExpected=(ra,rb)=>1/(1+Math.pow(10,(rb-ra)/400));
/* 실제 실력(true)으로 승패를 뽑고, 모두 1000점에서 시작해 K로 갱신한다. */
function eloRun(trueR,K,games,seed){
 const r=rng(seed),R=trueR.map(()=>1000),hist=[R.slice()],n=trueR.length;
 for(let g=0;g<games;g++){const i=Math.floor(r()*n);let j=Math.floor(r()*(n-1));if(j>=i)j++;const win=r()<eloExpected(trueR[i],trueR[j])?1:0,e=eloExpected(R[i],R[j]);R[i]+=K*(win-e);R[j]-=K*(win-e);hist.push(R.slice());}
 return {R,hist};
}

/* ---------- 10장: 양자화 ---------- */
/* 16행×64열 가중치(표준편차 0.02). 3번 행은 크기가 12배인 이상치 채널이다. */
function demoWeights(seed=11){const r=rng(seed);return Array.from({length:16},(_,i)=>Array.from({length:64},()=>gauss(r)*0.02*(i===3?12:1)));}
function quantize(W,bits,perChannel){
 const qmax=Math.pow(2,bits-1)-1,gmax=Math.max(...W.flat().map(Math.abs));let se=0,sw=0,dot=0,n1=0,n2=0;
 const scales=W.map(row=>(perChannel?Math.max(...row.map(Math.abs)):gmax)/qmax);
 const deq=W.map((row,i)=>row.map(w=>{const q=Math.max(-qmax-1,Math.min(qmax,Math.round(w/scales[i])));const d=q*scales[i];se+=(w-d)**2;sw+=w*w;dot+=w*d;n1+=w*w;n2+=d*d;return d;}));
 const rowErr=W.map((row,i)=>Math.sqrt(row.reduce((a,w,j)=>a+(w-deq[i][j])**2,0)/row.reduce((a,w)=>a+w*w,0)));
 return {mse:se/(W.length*W[0].length),snr:10*Math.log10(sw/Math.max(se,1e-30)),cos:dot/Math.sqrt(n1*n2),scales,rowErr,levels:2*qmax+2};
}
const weightGB=(paramsB,bits)=>paramsB*1e9*bits/8/1e9;

/* ---------- 11장: 추측 디코딩과 병렬 추론 ---------- */
/* α: 초안 토큰 하나가 받아들여질 확률, N: 초안 길이, c: 초안 한 번 / 검증 한 번 비용 */
function specDecode(alpha,N,c){const E=alpha>=1?N+1:(1-Math.pow(alpha,N+1))/(1-alpha),cost=N*c+1;return {E,cost,speedup:E/cost};}
function specBestN(alpha,c,maxN=12){let best={N:1,...specDecode(alpha,1,c)};for(let N=2;N<=maxN;N++){const s=specDecode(alpha,N,c);if(s.speedup>best.speedup)best={N,...s};}return best;}
/* Hogwild! 추론의 벽시계 시간(원본 레슨의 암달 식 + 조정 비용) */
function hogwild(T,p,N,c){const time=T*((1-p)+p/N)+c*N;return {time,speedup:T/time};}

/* ---------- 12장: 모델 설정 읽기 ---------- */
const MODELS={
 gpt2:{name:'GPT-2 Small',h:768,L:12,heads:12,kv:12,hd:64,V:50257,ctx:1024,mlp:'gelu',ff:3072,tied:true,bias:true,pos:1024},
 llama3:{name:'Llama 3 8B',h:4096,L:32,heads:32,kv:8,hd:128,V:128256,ctx:131072,mlp:'swiglu',ff:14336},
 mixtral:{name:'Mixtral 8x7B',h:4096,L:32,heads:32,kv:8,hd:128,V:32000,ctx:32768,mlp:'swiglu',ff:14336,experts:8,topk:2},
 deepseek:{name:'DeepSeek-V3',h:7168,L:61,heads:128,V:129280,ctx:131072,mla:{q:1536,kv:512,rope:64,nope:128,v:128},dense:3,ffDense:18432,ff:2048,experts:256,shared:1,topk:8},
 jamba:{name:'Jamba (하이브리드)',L:32,attn:4,kv:8,hd:128,ctx:262144,published:{total:52e9,active:12e9}}
};
function modelParams(m){
 if(m.published)return {total:m.published.total,active:m.published.active,computed:false};
 const h=m.h,emb=m.V*h*(m.tied?1:2)+(m.pos?m.pos*h:0);let attn,mlp,act,norms;
 if(m.mla){const a=m.mla;attn=h*a.q+a.q*m.heads*(a.nope+a.rope)+h*(a.kv+a.rope)+a.kv*m.heads*(a.nope+a.v)+m.heads*a.v*h+a.q+a.kv;
  const ex=3*h*m.ff,moe=(m.experts+m.shared)*ex+m.experts*h,moeAct=(m.topk+m.shared)*ex+m.experts*h,dense=3*h*m.ffDense,nL=m.L-m.dense;norms=2*h;
  const total=emb+m.L*(attn+norms)+m.dense*dense+nL*moe+h,active=emb+m.L*(attn+norms)+m.dense*dense+nL*moeAct+h;return {total,active,computed:true,attn,embed:emb};}
 attn=h*m.heads*m.hd+2*h*m.kv*m.hd+m.heads*m.hd*h+(m.bias?(m.heads*m.hd+2*m.kv*m.hd+h):0);
 if(m.mlp==='gelu'){mlp=2*h*m.ff+(m.bias?m.ff+h:0);norms=m.bias?4*h:2*h;}else{mlp=3*h*m.ff;norms=2*h;}
 const fin=m.bias?2*h:h;
 if(m.experts){const moe=m.experts*mlp+m.experts*h,moeAct=m.topk*mlp+m.experts*h;return {total:emb+m.L*(attn+moe+norms)+fin,active:emb+m.L*(attn+moeAct+norms)+fin,computed:true,attn,embed:emb};}
 const t=emb+m.L*(attn+mlp+norms)+fin;return {total:t,active:t,computed:true,attn,mlp,embed:emb};
}
/* 토큰 하나가 남기는 KV 캐시(바이트). MLA는 잠재 벡터 512 + RoPE 키 64를 층마다 저장한다. */
function kvPerToken(m,bytes=2){if(m.mla)return m.L*(m.mla.kv+m.mla.rope)*bytes;const layers=m.attn||m.L;return 2*layers*m.kv*m.hd*bytes;}
/* NSA가 쿼리 하나당 보는 키 수: 압축 N/l + 선택 k·b + 창 w */
function nsaKeys(N,l,k,b,w){const keys=N/l+k*b+w;return {keys,full:N,ratio:N/keys};}
/* 차등 어텐션 장난감: 신호 1개(점수 sig)와 무관한 토큰 n개(점수 0). 둘째 지도는 신호를 보지 못한다. */
function diffAttention(n,sig,lambda){const z1=Math.exp(sig)+n,a1s=Math.exp(sig)/z1,a1n=1/z1,a2=1/(n+1);return {stdSignal:a1s,stdNoise:n*a1n,diffSignal:a1s-lambda*a2,diffNoise:n*(a1n-lambda*a2)};}

/* ---------- 마지막 장: 파이프라인 단계와 되돌리기 ---------- */
const STAGES=[['tok','토크나이저',2],['data','데이터',24],['pre','사전학습',3000],['scale','확장 학습',1200],['sft','SFT',60],['rm','보상 모델',40],['dpo','DPO',50],['cai','자기개선',80],['eval','평가',10],['quant','양자화',4],['serve','서빙 설정',2]];
const EDGES={tok:['data'],data:['pre'],pre:['scale'],scale:['sft'],sft:['rm','dpo'],rm:['cai'],dpo:['cai'],cai:['eval','quant'],eval:[],quant:['serve'],serve:[]};
function rollback(id){const out=new Set(),stack=[id];while(stack.length){const s=stack.pop();if(out.has(s))continue;out.add(s);stack.push(...EDGES[s]);}const list=STAGES.filter(s=>out.has(s[0]));return {stages:list,hours:list.reduce((a,s)=>a+s[2],0),total:STAGES.reduce((a,s)=>a+s[2],0),gate:true};}

/* ---------- 표지: 모델 크기 하나로 보는 전 과정 예산 ---------- */
function budget(paramsB){const N=paramsB*1e9,D=20*N;return {N,D,flops:trainFlops(N,D),trainGB:16*N/1e9,bf16GB:2*N/1e9,int4GB:N/2/1e9,loss:chinchillaLoss(N,D)};}

/* ---------- 실험이 함께 쓰는 교육용 자료(서재봇 사례) ---------- */
const DATA={
 corpus:{
  ko:'서재봇은 서재의 책을 안내합니다. 서재봇에게 책을 물으면 서재봇은 책의 장과 실험을 알려 줍니다. 확률 책은 경보를 다루고, 선형대수 책은 벡터를 다룹니다. 책을 고르면 서재봇은 다음 장을 추천합니다. 서재에는 책이 많고, 책마다 실험이 있습니다. 서재봇은 질문을 읽고 책을 찾고 답을 씁니다.',
  en:'The library bot answers questions about the books. Ask the bot about a book and the bot shows the chapters and the labs of the book. The probability book covers alarms and the algebra book covers vectors. The bot reads the question, finds the book, and writes the answer.'
 },
 probes:{ko:'서재봇은 확률 책의 실험을 추천합니다.',en:'The bot finds the probability book.',code:'def find(book): return book.labs',emoji:'책 📚 추천!'},
 docs:{
  a:'서재에 새 책이 들어왔습니다. 이번 책은 언어 모델을 처음부터 만드는 과정을 다룹니다. 토크나이저에서 시작해 데이터 정제와 사전학습을 거쳐 정렬과 서빙까지 이어집니다. 각 장에는 직접 조작하는 실험이 있고 확인 문제가 하나씩 붙어 있습니다. 서재봇은 독자의 질문에 맞는 장을 골라 안내합니다.',
  b:'지금 가입하면 첫 달 무료! 서재에 새 책이 들어왔습니다. 이번 책은 언어 모델을 처음부터 만드는 과정을 다룹니다. 토크나이저에서 시작해 데이터 정제와 사전학습을 거쳐 정렬과 서빙까지 이어집니다. 각 장에는 직접 조작하는 실험이 있고 확인 문제가 하나씩 붙어 있습니다. 서재봇은 독자의 질문에 맞는 장을 골라 안내합니다.',
  c:'오늘 저녁 메뉴는 김치찌개입니다. 돼지고기와 두부를 넣고 오래 끓이면 국물이 깊어집니다. 밥은 미리 지어 두고 반찬으로 계란말이를 곁들입니다. 설거지는 식사가 끝난 뒤 함께 합니다.'
 },
 lengths:[50,120,900,30,2600,410,75,1500,220,60,3300,180]
};

const A11Math={DATA,rng,gauss,sigmoid,softplus,utf8,chunks,bpeTrain,bpeEncode,tokenBytes,showBytes,shingles,jaccard,hash32,minhashSig,minhashEstimate,lshProb,packing,
 bigramData,bigramTrain,bigramLoss,bigramFloor,bigramGreedy,CH,chinchillaLoss,trainFlops,chinchillaOptimal,trainMemory,minGpus,activationLayer,checkpointPlan,gpipeSchedule,
 RESP,sftLoss,dpo,bradleyTerry,groupAdvantages,grpoGroup,grpoZeroSignal,grpoEmpirical,eloExpected,eloRun,demoWeights,quantize,weightGB,specDecode,specBestN,hogwild,
 MODELS,modelParams,kvPerToken,nsaKeys,diffAttention,STAGES,EDGES,rollback,budget};
if(typeof module!=='undefined')module.exports=A11Math;else root.A11Math=A11Math;
})(typeof window!=='undefined'?window:globalThis);
