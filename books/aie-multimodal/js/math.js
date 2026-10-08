/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   단위: 픽셀(px), 토큰(개), 초(s), 밀리초(ms), 바이트(B). 모든 함수는 교육용 단순 모형이다. */
(function(root){
'use strict';
const sum=a=>a.reduce((s,x)=>s+x,0);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=a=>Math.sqrt(dot(a,a));
const cos=(a,b)=>dot(a,b)/(norm(a)*norm(b));
const logSumExp=a=>{const m=Math.max(...a);return m+Math.log(sum(a.map(x=>Math.exp(x-m))));};
const sigmoid=x=>1/(1+Math.exp(-x));

/* 1장: 패치 토큰 수. H×W 이미지를 P×P 패치로 자른다. 나머지 픽셀은 버린다(dropped). */
function patchTokens(H,W,P,extra=0){
 const gh=Math.floor(H/P),gw=Math.floor(W/P),patches=gh*gw,seq=patches+extra;
 return {gh,gw,patches,seq,pairs:seq*seq,dropped:H*W-gh*gw*P*P,raw:H*W*3};
}
/* 1장: ViT 파라미터 수. 블록 하나 = QKV·O(4D²+4D) + MLP(8D²+5D) + LN 두 개(4D) = 12D²+13D */
function vitParams(D,L,P,seq){
 const patchEmbed=3*P*P*D+D,pos=seq*D+D,block=12*D*D+13*D,blocks=L*block,finalLN=2*D;
 return {patchEmbed,pos,block,blocks,finalLN,total:patchEmbed+pos+blocks+finalLN};
}

/* 2장: 유사도 표 S(행=사진, 열=글)에서 CLIP식 대칭 InfoNCE와 SigLIP식 시그모이드 손실 */
function simMatrix(A,B){return A.map(a=>B.map(b=>cos(a,b)));}
function infoNCE(S,tau){
 const n=S.length,row=S.map(r=>r.map(s=>s/tau)),col=S[0].map((_,j)=>S.map(r=>r[j]/tau));
 const i2t=sum(row.map((r,i)=>logSumExp(r)-r[i]))/n,t2i=sum(col.map((c,j)=>logSumExp(c)-c[j]))/n;
 const diag=row.map((r,i)=>Math.exp(r[i]-logSumExp(r)));
 return {i2t,t2i,loss:(i2t+t2i)/2,diag};
}
function sigmoidLoss(S,tau,b){
 const n=S.length;let total=0;const diag=[];
 S.forEach((r,i)=>r.forEach((s,j)=>{const z=s/tau+b,y=i===j?1:-1;total+=Math.log1p(Math.exp(-y*z));if(i===j)diag.push(sigmoid(z));}));
 return {loss:total/n,diag};
}

/* 3장: Q-Former 압축. 이미지마다 패치 N개를 그대로 넣을지(MLP), 학습된 쿼리 Q개로 줄일지 */
function qformer(N,Q,images){
 const mlp=N*images,qf=Q*images;
 return {mlp,qf,ratio:N/Q,saved:mlp-qf,crossPairs:Q*N*images};
}
/* 3장: tanh 게이트 학습. y = a + tanh(α)·c 를 목표 T에 맞춘다. α는 0에서 시작. */
function gateTrain(lr,steps,a=0.2,c=1,T=0.8){
 let alpha=0;const hist=[];
 for(let k=0;k<=steps;k++){
  const g=Math.tanh(alpha),err=a+g*c-T,loss=err*err;hist.push({step:k,alpha,gate:g,loss});
  alpha-=lr*2*err*c*(1-g*g);
 }
 return hist;
}

/* 4장: 문맥 예산. 연결 방식별 이미지 토큰을 빼고 남는 글 토큰 */
function contextBudget(ctx,perImage,images,prompt=200){
 const visual=perImage*images,left=ctx-visual-prompt;
 return {visual,left,share:visual/ctx,fits:left>=0};
}

/* 5장: 해상도 전략 비교. tile=타일 한 변(336), tok=타일당 토큰(576) */
const GRIDS=[[1,1],[1,2],[2,1],[1,3],[3,1],[2,2]];
function bestGrid(W,H,tile=336,grids=GRIDS){
 let best=null;
 for(const [r,c] of grids){
  const s=Math.min(c*tile/W,r*tile/H),eff=Math.min(W*H*s*s,W*H),waste=r*c*tile*tile-eff;
  if(!best||eff>best.eff+1e-6||(Math.abs(eff-best.eff)<=1e-6&&waste<best.waste))best={r,c,eff,waste};
 }
 return best;
}
function anyres(W,H,tile=336,tok=576){const g=bestGrid(W,H,tile);return {grid:g,tiles:g.r*g.c,tokens:(g.r*g.c+1)*tok};}
/* 고정 정사각형: 긴 변을 side로 줄이고 짧은 쪽을 채운다. 채움(pad) 비율과 축소 배율을 낸다. */
function squarePad(W,H,side=336,tok=576){const s=side/Math.max(W,H);return {tokens:tok,scale:s,pad:1-(W*s*H*s)/(side*side)};}
/* 원본 비율(M-RoPE 계열): 28px 단위로 반올림, maxPixels를 넘으면 비율을 지키며 줄인다. */
function nativeTokens(W,H,unit=28,maxPixels=1003520,minPixels=3136){
 let h=Math.max(unit,Math.round(H/unit)*unit),w=Math.max(unit,Math.round(W/unit)*unit);
 if(h*w>maxPixels){const b=Math.sqrt(H*W/maxPixels);h=Math.max(unit,Math.floor(H/b/unit)*unit);w=Math.max(unit,Math.floor(W/b/unit)*unit);}
 else if(h*w<minPixels){const b=Math.sqrt(minPixels/(H*W));h=Math.ceil(H*b/unit)*unit;w=Math.ceil(W*b/unit)*unit;}
 return {w,h,gw:w/unit,gh:h/unit,tokens:(w/unit)*(h/unit)};
}

/* 6장: 영상 토큰 예산. 프레임 격자 g×g를 k×k로 풀링하면 ceil(g/k)² 토큰 */
function pooled(grid,k){const s=Math.ceil(grid/k);return s*s;}
function videoBudget(seconds,fps,perFrame,budget){
 const frames=Math.max(1,Math.floor(seconds*fps)),tokens=frames*perFrame,fpsMax=budget/(seconds*perFrame);
 return {frames,tokens,fits:tokens<=budget,fpsMax,share:tokens/budget};
}
/* 6장: 길이 d초 사건을 fps로 고르게 뽑을 때 적어도 한 프레임이 걸릴 확률(시작 위상은 균일) */
function eventCatch(d,fps){const gap=1/fps;return {p:Math.min(1,d/gap),expected:d*fps,gap};}

/* 7장: 이미지 토큰화 비용. 한 변 R, 축소 배율 f, 코드북 K, 디코딩 속도 v(tok/s) */
function imageTokens(R,f,K,v){const side=Math.floor(R/f),tokens=side*side;return {side,tokens,bits:tokens*Math.log2(K),seconds:tokens/v};}
/* 7장: 1차원 장난감 벡터 양자화. [0,1] 위 K개 균등 코드북에서 가장 가까운 칸을 고른다. */
function quantize(values,K){
 const code=v=>Math.min(K-1,Math.max(0,Math.round(v*(K-1)))),rec=values.map(v=>code(v)/(K-1));
 const mse=sum(values.map((v,i)=>(v-rec[i])**2))/values.length;
 return {ids:values.map(code),rec,mse,psnr:mse>0?10*Math.log10(1/mse):Infinity};
}

/* 8장: MaskGIT 코사인 일정. t단계 뒤 가려진 비율 cos(πt/2T). 단계마다 새로 확정하는 토큰 수 */
function maskSchedule(N,T){
 const masked=[];for(let t=0;t<=T;t++)masked.push(Math.floor(N*Math.cos(Math.PI*t/(2*T))+1e-9));
 masked[T]=0;const commit=masked.slice(1).map((m,i)=>masked[i]-m);
 return {masked,commit,passes:T};
}
/* 8장: 하이브리드 어텐션 마스크. kinds=['t','i',...], block=같은 이미지 묶음 번호 */
function hybridMask(kinds,block){
 return kinds.map((ki,i)=>kinds.map((kj,j)=>(j<=i||(ki==='i'&&kj==='i'&&block[i]===block[j]))?1:0));
}

/* 9장: 스트리밍 음성 응답 지연(첫 소리까지)과 Talker 속도 점검 */
function ttfab(parts){return sum(parts.map(p=>p[1]));}
function talkerRate(rate,need=50){return {factor:rate/need,ok:rate>=need,lagPerSec:rate>=need?0:(need/rate-1)};}

/* 10장: 행동 토큰화. [-1,1] 구간을 bins칸으로 나눈다. 칸 가운데 값으로 되돌린다. */
function actionBin(x,bins){const w=2/bins,i=Math.min(bins-1,Math.max(0,Math.floor((x+1)/w)));return {index:i,value:-1+(i+0.5)*w,maxErr:w/2,err:Math.abs(x-(-1+(i+0.5)*w))};}
function actionRate(dof,hz,decode,chunk=1){const need=dof*hz/chunk;return {need,maxHz:decode*chunk/dof,ok:need<=decode};}

/* 11장: ColBERT·ColPali의 MaxSim. 질의 토큰마다 가장 닮은 패치 하나를 골라 더한다. */
function maxSim(Q,Pp){return {score:sum(Q.map(q=>Math.max(...Pp.map(p=>cos(q,p))))),picks:Q.map(q=>{const s=Pp.map(p=>cos(q,p));return s.indexOf(Math.max(...s));})};}
function mean(V){return V[0].map((_,k)=>sum(V.map(v=>v[k]))/V.length);}
function pooledScore(Q,Pp){return cos(mean(Q),mean(Pp));}
/* 11장: 색인 저장량(바이트). 페이지마다 벡터 n개 × 차원 d × 값당 바이트 */
function storage(pages,vecs,dim,bytes){return pages*vecs*dim*bytes;}

/* 12장: 에이전트 성공률. 단계 성공 p, 단계 n. 실패를 감지율 det로 알아채면 한 번 다시 시도 */
function agentSuccess(p,n,det=0){const step=p+(1-p)*det*p;return {plain:p**n,retry:step**n,step};}

const A13Math={sum,dot,norm,cos,logSumExp,sigmoid,patchTokens,vitParams,simMatrix,infoNCE,sigmoidLoss,qformer,gateTrain,contextBudget,GRIDS,bestGrid,anyres,squarePad,nativeTokens,pooled,videoBudget,eventCatch,imageTokens,quantize,maskSchedule,hybridMask,ttfab,talkerRate,actionBin,actionRate,maxSim,mean,pooledScore,storage,agentSuccess};
if(typeof module!=='undefined')module.exports=A13Math;else root.A13Math=A13Math;
})(typeof window!=='undefined'?window:globalThis);
