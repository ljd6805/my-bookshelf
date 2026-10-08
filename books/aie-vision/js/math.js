/* 실험과 그림에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   단위: 길이는 픽셀(px), 깊이는 미터(m), 시간은 밀리초(ms). 입력 예시 값은 각 실험 파일에 있다. */
(function(root){
'use strict';
const sum=a=>a.reduce((s,x)=>s+x,0);
const IMAGENET={mean:[0.485,0.456,0.406],std:[0.229,0.224,0.225]};
const A05Math={
 IMAGENET,
 /* 1장: 합성곱 출력 한 변 = ⌊(H − K + 2P)/S⌋ + 1 */
 convOut:(H,K,P,S)=>Math.floor((H-K+2*P)/S)+1,
 /* 같은 층을 여러 번 쌓을 때 수용 영역: r ← r + (k−1)·j, j ← j·s */
 receptive(layers){let r=1,j=1;return layers.map(({k,s})=>{r+=(k-1)*j;j*=s;return r;});},
 convParams:(cin,cout,k)=>cout*cin*k*k+cout,
 /* 유효(valid) 합성곱, 보폭 1. 그림의 Sobel 예시에 쓴다. */
 conv2d(img,k){const n=k.length,H=img.length-n+1,W=img[0].length-n+1,out=[];
  for(let y=0;y<H;y++){const row=[];for(let x=0;x<W;x++){let s=0;for(let i=0;i<n;i++)for(let j=0;j<n;j++)s+=img[y+i][x+j]*k[i][j];row.push(s);}out.push(row);}return out;},
 /* 전처리: 올바른 표준화와 흔한 실수 세 가지가 모델에 넘기는 값 */
 preprocess(rgb,mode){
  const std=(v,c)=>(v/255-IMAGENET.mean[c])/IMAGENET.std[c];
  const ok=rgb.map(std);let got;
  if(mode==='raw')got=rgb.map((v,c)=>(v-IMAGENET.mean[c])/IMAGENET.std[c]);
  else if(mode==='nostd')got=rgb.map(v=>v/255);
  else if(mode==='bgr')got=[rgb[2],rgb[1],rgb[0]].map(std);
  else got=ok.slice();
  return {ok,got,gap:Math.max(...got.map((v,i)=>Math.abs(v-ok[i])))};
 },
 /* 2장: 층마다 기울기 배율 a를 곱하는 선형 장난감 모형 */
 residual(L,a){return {plain:a**L,identity:1,typical:a**(L/2),paths:2**L};},
 vit(img,p,cls=1){const g=Math.floor(img/p),n=g*g,seq=n+cls;return {grid:g,patches:n,seq,pairs:seq*seq,dropped:img-g*p};},
 /* 3장: 온도 소프트맥스(수치 안정형), 라벨 스무딩 목표, 교차 엔트로피 */
 softmax(z,T=1){const m=Math.max(...z.map(v=>v/T)),e=z.map(v=>Math.exp(v/T-m)),s=sum(e);return e.map(v=>v/s);},
 smoothTarget(C,eps,idx){return Array.from({length:C},(_,i)=>i===idx?1-eps:eps/(C-1));},
 crossEntropy(p,t){return -sum(t.map((ti,i)=>ti?ti*Math.log(Math.max(p[i],1e-300)):0));},
 /* 4장: 상자 [x1,y1,x2,y2]의 IoU와 탐욕 NMS */
 iou(a,b){const w=Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0])),h=Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1])),inter=w*h;
  const u=(a[2]-a[0])*(a[3]-a[1])+(b[2]-b[0])*(b[3]-b[1])-inter;return u>0?inter/u:0;},
 nms(cands,thr,minScore=0){
  const order=cands.map((c,i)=>i).filter(i=>cands[i].score>=minScore).sort((i,j)=>cands[j].score-cands[i].score);
  const kept=[],removed=[];
  for(const i of order){let by=-1,best=0;for(const k of kept){const v=A05Math.iou(cands[i].box,cands[k].box);if(v>thr&&v>best){best=v;by=k;}}
   if(by<0)kept.push(i);else removed.push({i,by,iou:best});}
  return {kept,removed,below:cands.map((c,i)=>i).filter(i=>cands[i].score<minScore)};
 },
 /* 5장: 픽셀 수로 센 분할 지표. 정의되지 않는 0/0은 완전 일치(1)로 둔다. */
 segMetrics(total,fg,tp,fp){const fn=fg-tp,tn=total-fg-fp,den=tp+fp+fn;
  return {acc:(tp+tn)/total,iou:den?tp/den:1,dice:den?2*tp/(2*tp+fp+fn):1,fn,tn};},
 diceFromIou:i=>2*i/(1+i),
 /* 6장: 1차원 등속 칼만 필터. meas의 null은 가려진 프레임(예측만). */
 kalman(meas,q,r){
  let x=[meas.find(v=>v!==null),0],P=[[r,0],[0,25]];const out=[];
  meas.forEach((z,t)=>{
   if(t>0){x=[x[0]+x[1],x[1]];P=[[P[0][0]+P[0][1]+P[1][0]+P[1][1]+q/4,P[0][1]+P[1][1]+q/2],[P[1][0]+P[1][1]+q/2,P[1][1]+q]];}
   const pred=x[0];let k=0;
   if(z!==null){const S=P[0][0]+r;k=P[0][0]/S;const k1=P[1][0]/S,y=z-x[0];x=[x[0]+k*y,x[1]+k1*y];
    P=[[(1-k)*P[0][0],(1-k)*P[0][1]],[P[1][0]-k1*P[0][0],P[1][1]-k1*P[0][1]]];}
   out.push({t,z,pred,x:x[0],v:x[1],k,var:P[0][0]});
  });return out;},
 attnCost(T,hw){return {joint:(T*hw)**2,divided:T*hw*hw+hw*T*T};},
 /* 7장: 코사인 유사도, 온도 소프트맥스 InfoNCE(행·열 평균) */
 cosine(a,b){const d=sum(a.map((v,i)=>v*b[i])),na=Math.hypot(...a),nb=Math.hypot(...b);return d/(na*nb);},
 simMatrix(A,B){return A.map(a=>B.map(b=>A05Math.cosine(a,b)));},
 infoNCE(S,tau){
  const rows=S.map(r=>A05Math.softmax(r,tau)),cols=S[0].map((_,j)=>A05Math.softmax(S.map(r=>r[j]),tau));
  const n=S.length,li=-sum(rows.map((r,i)=>Math.log(r[i])))/n,lt=-sum(cols.map((c,j)=>Math.log(c[j])))/n;
  return {rows,diag:rows.map((r,i)=>r[i]),imageToText:li,textToImage:lt,loss:(li+lt)/2};
 },
 maeTokens(n,ratio){const visible=Math.round(n*(1-ratio));return {visible,masked:n-visible,pairs:visible*visible,full:n*n,share:visible*visible/(n*n)};},
 /* 8장: 편집 거리와 정렬 연산, CER, CTC 접기 */
 editOps(a,b){
  a=Array.from(a);b=Array.from(b);const m=a.length,n=b.length,D=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i?j?0:i:j));
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)D[i][j]=Math.min(D[i-1][j]+1,D[i][j-1]+1,D[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  const ops=[];let i=m,j=n;
  while(i>0||j>0){
   if(i>0&&j>0&&D[i][j]===D[i-1][j-1]+(a[i-1]===b[j-1]?0:1)){ops.unshift({op:a[i-1]===b[j-1]?'=':'S',a:a[i-1],b:b[j-1]});i--;j--;}
   else if(i>0&&D[i][j]===D[i-1][j]+1){ops.unshift({op:'D',a:a[i-1],b:''});i--;}
   else{ops.unshift({op:'I',a:'',b:b[j-1]});j--;}
  }
  return {distance:D[m][n],ops};
 },
 cer(ref,hyp){const n=Array.from(ref).length;return n?A05Math.editOps(ref,hyp).distance/n:0;},
 ctcCollapse(seq,blank='ε'){const out=[];seq.forEach((c,i)=>{if(c!==blank&&c!==seq[i-1])out.push(c);});return out.join('');},
 /* 9장: 깊이 지표, 핀홀 역투영, 알파 합성, 가우시안 크기 */
 depthMetrics(pred,gt){const r=pred.map((p,i)=>Math.max(p/gt[i],gt[i]/p));
  return {absRel:sum(pred.map((p,i)=>Math.abs(p-gt[i])/gt[i]))/gt.length,delta:r.filter(v=>v<1.25).length/gt.length};},
 lift(u,v,d,fx,fy,cx,cy){return [(u-cx)*d/fx,(v-cy)*d/fy,d];},
 composite(alphas,colors){let T=1;const w=alphas.map(a=>{const x=T*a;T*=1-a;return x;});
  const c=colors?colors[0].map((_,k)=>sum(colors.map((col,i)=>w[i]*col[k]))):null;return {w,rest:T,color:c};},
 splatFloats:deg=>3+4+3+1+3*(deg+1)**2,
 /* 10장: DDPM 선형 β 일정의 누적 곱 ᾱ_t, 분류기 없는 가이던스 */
 alphaBar(t,T=1000,b0=1e-4,b1=0.02){let a=1;for(let s=1;s<=t;s++)a*=1-(b0+(b1-b0)*(s-1)/(T-1));return a;},
 cfg(eu,ec,w){return eu.map((u,i)=>u+w*(ec[i]-u));},
 /* 11장: 데이터(0.1,0.5)와 잡음(0.9,0.5)을 잇는 길. bend=0이면 직선(정류 흐름).
    정확한 속도 v(t)를 알 때 t=1에서 0으로 오일러 적분한 경로와 도착 오차 */
 flowPath(t,bend){return [0.1+0.8*t,0.5+0.4*bend*Math.sin(Math.PI*t)];},
 flowEuler(steps,bend){const h=1/steps;let p=A05Math.flowPath(1,bend);const pts=[p.slice()];
  for(let k=0;k<steps;k++){const t=1-k*h,v=[0.8,0.4*bend*Math.PI*Math.cos(Math.PI*t)];p=[p[0]-h*v[0],p[1]-h*v[1]];pts.push(p.slice());}
  const end=A05Math.flowPath(0,bend);return {pts,err:Math.hypot(p[0]-end[0],p[1]-end[1])};},
 /* 12장: 단계별 지연 시나리오. 기준은 입력 한 변 640·FP32에서 가정한 ms 값.
    전처리·검출은 픽셀 수((side/640)²)에 비례, 모델 단계는 정밀도 배율을 곱한다. */
 LATENCY_BASE:{decode:6,pre:3,det:18,nms:1.5,cls:6},PRECISION:{fp32:1,fp16:0.6,int8:0.4},
 latency(side,prec){const B=A05Math.LATENCY_BASE,f=A05Math.PRECISION[prec],px=(side/640)**2;
  const st={decode:B.decode,pre:B.pre*px,det:B.det*px*f,nms:B.nms,cls:B.cls*f};return {...st,total:sum(Object.values(st)),budget:1000/30};}
};
if(typeof module!=='undefined')module.exports=A05Math;else root.A05Math=A05Math;
})(typeof window!=='undefined'?window:globalThis);
