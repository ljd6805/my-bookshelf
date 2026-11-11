/* 「순환 신경망」의 계산 모델. DOM을 만지지 않으며 tests/math.test.cjs가 Node에서 검증한다.
   기온 기록과 후기 문장은 이 책이 지은 합성 자료다. RNN·LSTM·GRU의 순전파와 시간 방향 역전파(BPTT)는
   여기서 실제로 계산하고, 수치 미분과 대조해 검증한다. 단위: 기온은 °C, 신경망 입력은 (기온−20)/5로 정규화한 값. */
(function(root){
'use strict';
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function gauss(r){let u=0;while(u===0)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r());}
const sigmoid=x=>1/(1+Math.exp(-x));
const norm=v=>{let s=0;for(let i=0;i<v.length;i++)s+=v[i]*v[i];return Math.sqrt(s);};
const BASE=20,AMP=5,toUnit=c=>(c-BASE)/AMP,toC=u=>u*AMP+BASE;

/* 유나의 온실 기온(°C), 한 시간 간격. 하루 주기(오후 3시에 가장 높음) + 닷새 주기의 느린 날씨 변화 + 잡음. */
function series(n,{seed=7,noise=0.6,start=0}={}){
 const r=rng(seed),out=[];
 for(let k=0;k<start+n;k++){const e=gauss(r);if(k>=start)out.push(BASE+AMP*Math.sin(2*Math.PI*(k-9)/24)+1.5*Math.sin(2*Math.PI*k/120)+noise*e);}
 return out;
}
/* 연립방정식 A·w = y (가우스 소거, 부분 피벗). */
function solve(A,y){
 const n=y.length,M=A.map((row,i)=>[...row,y[i]]);
 for(let c=0;c<n;c++){
  let p=c;for(let i=c+1;i<n;i++)if(Math.abs(M[i][c])>Math.abs(M[p][c]))p=i;
  [M[c],M[p]]=[M[p],M[c]];
  for(let i=c+1;i<n;i++){const f=M[i][c]/M[c][c];for(let j=c;j<=n;j++)M[i][j]-=f*M[c][j];}
 }
 const w=new Array(n).fill(0);
 for(let i=n-1;i>=0;i--){let s=M[i][n];for(let j=i+1;j<n;j++)s-=M[i][j]*w[j];w[i]=s/M[i][i];}
 return w;
}
/* 창 k개의 값(순서대로)과 상수항으로 다음 값을 맞히는 최소제곱 직선 모델. */
function fitWindow(xs,k){
 const n=k+1,A=Array.from({length:n},()=>new Array(n).fill(0)),y=new Array(n).fill(0);
 for(let t=k;t<xs.length;t++){const f=[...xs.slice(t-k,t),1];for(let i=0;i<n;i++){y[i]+=f[i]*xs[t];for(let j=0;j<n;j++)A[i][j]+=f[i]*f[j];}}
 for(let i=0;i<n;i++)A[i][i]+=1e-6;
 return solve(A,y);
}
function shuffled(a,r){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
const rmse=(p,t)=>Math.sqrt(p.reduce((s,v,i)=>s+(v-t[i])**2,0)/p.length);
/* 1장: 같은 창을 순서대로 넣을 때와 섞어 넣을 때, 그리고 순서를 쓰지 않는 평균 예측의 오차(°C). */
function whyOrder({k=6,noise=0.6,seed=7}={}){
 const all=series(240+96,{seed,noise}),train=all.slice(0,240),w=fitWindow(train,k),r=rng(seed+1),rows=[];
 for(let t=240;t<all.length;t++){
  const win=all.slice(t-k,t),pred=f=>f.reduce((s,v,i)=>s+v*w[i],w[k]);
  rows.push({t,actual:all[t],mean:win.reduce((s,v)=>s+v,0)/k,ordered:pred(win),mixed:pred(shuffled(win,r)),last:win[k-1]});
 }
 const act=rows.map(x=>x.actual),e=key=>rmse(rows.map(x=>x[key]),act);
 return {k,rows,weights:w,rmse:{mean:e('mean'),ordered:e('ordered'),mixed:e('mixed'),last:e('last')}};
}
/* 2장: 은닉 상태가 숫자 하나인 RNN 셀. h_t = act(wh·h_(t−1) + wx·x_t + b). */
const CELL_INPUTS={pulse:[1,0,0,0,0,0,0,0,0,0,0,0],temp:series(12,{seed:7,noise:0}).map(toUnit)};
function scalarRun({wh=0.8,wx=1,b=0,xs=CELL_INPUTS.pulse,act='tanh',h0=0}={}){
 const f=act==='tanh'?Math.tanh:v=>v,hs=[];let h=h0;
 for(const x of xs){h=f(wh*h+wx*x+b);hs.push(h);}
 return hs;
}
/* 3장: 파라미터 수. RNN은 길이 T와 무관, 창 전체를 받는 완전 연결층은 T에 비례. */
function paramCount({T=24,D=1,H=10,O=1}={}){
 const readout=O*H+O;
 return {rnnCell:H*D+H*H+H,rnn:H*D+H*H+H+readout,torchRnn:H*D+H*H+2*H,dense:T*D*H+H+readout,readout};
}
/* 4장: 과제와 입출력 형태. */
const FORMS={m2o:'여러 입력 → 출력 하나 (many-to-one)',m2m:'입력마다 출력 하나 (many-to-many)',encdec:'다 읽은 뒤 다른 길이로 출력 (encoder-decoder)',o2m:'입력 하나 → 여러 출력 (one-to-many)'};
const TASKS=[
 {id:'next',name:'지난 24시간 기온으로 다음 한 시간 기온 예측',form:'m2o',why:'24개 값을 다 읽은 뒤 숫자 하나만 냅니다. 손실은 마지막 단계의 출력 하나에서 잽니다.'},
 {id:'each',name:'기온 기록의 시각마다 난방기를 켤지 표시',form:'m2m',why:'입력 한 시각마다 켬·끔 하나를 냅니다. 손실은 모든 단계의 출력에서 재어 더합니다.'},
 {id:'review',name:'후기 한 문장이 긍정인지 부정인지 분류',form:'m2o',why:'문장을 끝까지 읽은 뒤 분류 하나를 냅니다. 마지막 은닉 상태가 문장 전체의 요약입니다.'},
 {id:'translate',name:'한국어 후기를 영어 문장으로 번역',form:'encdec',why:'원문과 번역문은 길이가 다르고 낱말 순서도 다릅니다. 인코더가 원문을 다 읽은 뒤 디코더가 출력을 하나씩 냅니다.'},
 {id:'caption',name:'온실 사진 한 장을 설명하는 문장 쓰기',form:'o2m',why:'입력은 사진 벡터 하나이고 출력은 낱말 여러 개입니다. 앞에서 낸 낱말이 다음 단계의 입력이 됩니다.'},
 {id:'tag',name:'후기 문장의 낱말마다 품사 붙이기',form:'m2m',why:'낱말 하나에 품사 하나가 짝을 이룹니다. 입력과 출력의 길이가 같습니다.'}
];
function shape(taskId,choice,T=6,Tout=4){
 const task=TASKS.find(x=>x.id===taskId),f=task.form;
 const ins=f==='o2m'?1:T,outs=f==='m2o'?1:f==='m2m'?T:Tout,steps=f==='encdec'?T+Tout:f==='o2m'?Tout:T;
 const cells=[];for(let s=0;s<steps;s++)cells.push({input:f==='o2m'?s===0:s<T,output:f==='m2o'?s===T-1:f==='m2m'?true:f==='encdec'?s>=T:true});
 return {task,ok:choice===f,ins,outs,steps,lossTerms:outs,cells};
}
/* 5장: 숫자 하나짜리 RNN의 시간 방향 역전파. 출력은 마지막 은닉 상태, 손실 L = ½(h_T − target)². */
const BPTT_INPUTS=[0.5,-0.3,0.8,0.2,-0.6,0.4];
function scalarLoss(wh,wx,xs,target){const hs=scalarRun({wh,wx,xs});return 0.5*(hs[hs.length-1]-target)**2;}
function scalarBptt({wh=0.9,wx=0.7,T=3,target=0.5,xs=BPTT_INPUTS}={}){
 xs=xs.slice(0,T);const hs=scalarRun({wh,wx,xs}),rows=[];let delta=hs[T-1]-target,gwh=0,gwx=0;
 for(let t=T-1;t>=0;t--){
  const local=1-hs[t]**2,da=delta*local,prev=t?hs[t-1]:0;
  rows.unshift({t:t+1,x:xs[t],h:hs[t],delta,local,da,partWh:da*prev,partWx:da*xs[t]});
  gwh+=da*prev;gwx+=da*xs[t];delta=da*wh;
 }
 const e=1e-5,numWh=(scalarLoss(wh+e,wx,xs,target)-scalarLoss(wh-e,wx,xs,target))/(2*e),numWx=(scalarLoss(wh,wx+e,xs,target)-scalarLoss(wh,wx-e,xs,target))/(2*e);
 return {rows,loss:scalarLoss(wh,wx,xs,target),gwh,gwx,numWh,numWx};
}
/* 6장: 직교 행렬 Q(그람-슈미트)에 크기 rho를 곱한 순환 가중치. 선형이면 기울기 크기가 단계마다 정확히 rho배. */
function orthogonal(H,seed){
 const r=rng(seed),Q=[];
 for(let i=0;i<H;i++){
  let v=Array.from({length:H},()=>gauss(r));
  for(const q of Q){const d=v.reduce((s,x,j)=>s+x*q[j],0);v=v.map((x,j)=>x-d*q[j]);}
  const n=norm(v);Q.push(v.map(x=>x/n));
 }
 return Q;
}
function gradNorms({rho=0.9,T=30,act='tanh',H=8,seed=3,clip=0}={}){
 const Q=orthogonal(H,seed),r=rng(seed+11),u=Array.from({length:H},()=>gauss(r)*0.5),xs=Array.from({length:T},()=>gauss(r)*0.5);
 const f=act==='tanh'?Math.tanh:v=>v,hs=[new Array(H).fill(0)];
 for(let t=0;t<T;t++){const p=hs[t];hs.push(Q.map((row,i)=>f(rho*row.reduce((s,q,j)=>s+q*p[j],0)+u[i]*xs[t])));}
 let delta=Array.from({length:H},()=>gauss(r));const n0=norm(delta);delta=delta.map(v=>v/n0);
 const norms=[],gW=Array.from({length:H},()=>new Array(H).fill(0));
 for(let t=T;t>=1;t--){
  norms.push(norm(delta));
  const da=delta.map((d,i)=>d*(act==='tanh'?1-hs[t][i]**2:1));
  for(let i=0;i<H;i++)for(let j=0;j<H;j++)gW[i][j]+=da[i]*hs[t-1][j];
  delta=Q[0].map((_,j)=>rho*da.reduce((s,d,i)=>s+d*Q[i][j],0));
 }
 const gradNorm=norm(gW.flat()),scale=clip>0?Math.min(1,clip/gradNorm):1;
 return {norms,gradNorm,scale,clipped:gradNorm*scale,first:norms[0],last:norms[T-1]};
}

/* ── 벡터 셀: RNN·LSTM·GRU. 가중치 W는 (게이트 행 수)×(D+H) 행렬 하나, 입력은 [x; h_(t−1)]을 이어 붙인 벡터. ──
   LSTM 행 순서: 입력 i, 망각 f, 후보 g, 출력 o. GRU 행 순서: 갱신 z, 재설정 r, 후보 n (Cho et al. 2014의 식). */
function initCell(type,D,H,seed,{gateBias=0,scale=null,linear=false}={}){
 const G={rnn:1,lstm:4,gru:3}[type]*H,Z=D+H,r=rng(seed),s=scale??1/Math.sqrt(H),W=new Float64Array(G*Z),b=new Float64Array(G);
 for(let i=0;i<W.length;i++)W[i]=(r()*2-1)*s;
 if(type==='lstm')for(let j=0;j<H;j++)b[H+j]=gateBias;
 if(type==='gru')for(let j=0;j<H;j++)b[j]=gateBias;
 return {type,D,H,G,Z,W,b,linear};
}
function affine(cell,z,row0,rows){
 const {W,b,Z}=cell,out=new Float64Array(rows);
 for(let j=0;j<rows;j++){let s=b[row0+j];const o=(row0+j)*Z;for(let k=0;k<Z;k++)s+=W[o+k]*z[k];out[j]=s;}
 return out;
}
function stepForward(cell,x,hPrev,cPrev){
 const {type,D,H,Z}=cell,z=new Float64Array(Z);z.set(x,0);z.set(hPrev,D);
 if(type==='rnn'){const a=affine(cell,z,0,H),h=cell.linear?a:a.map(Math.tanh);return {h,c:null,cache:{z,h}};}
 if(type==='lstm'){
  const a=affine(cell,z,0,4*H),i=new Float64Array(H),f=new Float64Array(H),g=new Float64Array(H),o=new Float64Array(H),c=new Float64Array(H),tc=new Float64Array(H),h=new Float64Array(H);
  for(let j=0;j<H;j++){i[j]=sigmoid(a[j]);f[j]=sigmoid(a[H+j]);g[j]=Math.tanh(a[2*H+j]);o[j]=sigmoid(a[3*H+j]);c[j]=f[j]*cPrev[j]+i[j]*g[j];tc[j]=Math.tanh(c[j]);h[j]=o[j]*tc[j];}
  return {h,c,cache:{z,i,f,g,o,c,tc,cPrev}};
 }
 const a=affine(cell,z,0,2*H),zg=new Float64Array(H),r=new Float64Array(H),z2=new Float64Array(Z),h=new Float64Array(H);
 z2.set(x,0);
 for(let j=0;j<H;j++){zg[j]=sigmoid(a[j]);r[j]=sigmoid(a[H+j]);z2[D+j]=r[j]*hPrev[j];}
 const n=affine(cell,z2,2*H,H).map(Math.tanh);
 for(let j=0;j<H;j++)h[j]=(1-zg[j])*n[j]+zg[j]*hPrev[j];
 return {h,c:null,cache:{z,z2,zg,r,n,hPrev}};
}
/* 행 묶음의 기울기를 더하고, 입력 쪽으로 넘길 기울기 W^T·da를 돌려준다. */
function backRows(cell,g,row0,da,z){
 const {W,Z}=cell,dz=new Float64Array(Z);
 for(let j=0;j<da.length;j++){const o=(row0+j)*Z,d=da[j];g.b[row0+j]+=d;for(let k=0;k<Z;k++){g.W[o+k]+=d*z[k];dz[k]+=W[o+k]*d;}}
 return dz;
}
function stepBackward(cell,cache,dh,dc,g){
 const {type,D,H}=cell;
 if(type==='rnn'){
  const da=dh.map((d,j)=>d*(cell.linear?1:1-cache.h[j]**2)),dz=backRows(cell,g,0,da,cache.z);
  return {dh:dz.slice(D),dc:null,dx:dz.slice(0,D)};
 }
 if(type==='lstm'){
  const {i,f,g:gg,o,tc,cPrev,z}=cache,da=new Float64Array(4*H),dcPrev=new Float64Array(H);
  for(let j=0;j<H;j++){
   const dct=dc[j]+dh[j]*o[j]*(1-tc[j]**2);
   da[j]=dct*gg[j]*i[j]*(1-i[j]);da[H+j]=dct*cPrev[j]*f[j]*(1-f[j]);da[2*H+j]=dct*i[j]*(1-gg[j]**2);da[3*H+j]=dh[j]*tc[j]*o[j]*(1-o[j]);dcPrev[j]=dct*f[j];
  }
  const dz=backRows(cell,g,0,da,z);
  return {dh:dz.slice(D),dc:dcPrev,dx:dz.slice(0,D)};
 }
 const {z,z2,zg,r,n,hPrev}=cache,dan=new Float64Array(H),da=new Float64Array(2*H),dhPrev=new Float64Array(H);
 for(let j=0;j<H;j++){dan[j]=dh[j]*(1-zg[j])*(1-n[j]**2);dhPrev[j]=dh[j]*zg[j];}
 const dz2=backRows(cell,g,2*H,dan,z2);
 for(let j=0;j<H;j++){da[j]=dh[j]*(hPrev[j]-n[j])*zg[j]*(1-zg[j]);da[H+j]=dz2[D+j]*hPrev[j]*r[j]*(1-r[j]);dhPrev[j]+=dz2[D+j]*r[j];}
 const dz=backRows(cell,g,0,da,z);
 for(let j=0;j<H;j++)dhPrev[j]+=dz[D+j];
 const dx=new Float64Array(D);for(let k=0;k<D;k++)dx[k]=dz[k]+dz2[k];
 return {dh:dhPrev,dc:null,dx};
}
/* 모델 = 셀 + 읽어 내는 층 y = V·h + bv. */
function initModel(type,D,H,O,seed,opts={}){
 const cell=initCell(type,D,H,seed,opts),r=rng(seed+101),V=new Float64Array(O*H);
 for(let i=0;i<V.length;i++)V[i]=(r()*2-1)/Math.sqrt(H);
 return {cell,V,bv:new Float64Array(O),O};
}
const zeroGrads=m=>({W:new Float64Array(m.cell.W.length),b:new Float64Array(m.cell.b.length),V:new Float64Array(m.V.length),bv:new Float64Array(m.bv.length)});
const paramsOf=m=>[m.cell.W,m.cell.b,m.V,m.bv],gradsOf=g=>[g.W,g.b,g.V,g.bv];
function readout(m,h){const {V,bv,O}=m,H=m.cell.H,y=new Float64Array(O);for(let o=0;o<O;o++){let s=bv[o];for(let j=0;j<H;j++)s+=V[o*H+j]*h[j];y[o]=s;}return y;}
/* 한 구간의 순전파와 BPTT. targets[t]가 null이면 그 단계는 손실에 넣지 않는다.
   kind 'mse': 평균 제곱 오차, 'bce': 시그모이드 뒤 이진 교차 엔트로피. masks는 읽어 내는 층 앞의 드롭아웃 배율. */
function bptt(m,xs,targets,{h0=null,c0=null,kind='mse',masks=null}={}){
 const H=m.cell.H,T=xs.length,caches=[],hs=[],ys=[],g=zeroGrads(m);
 let h=h0||new Float64Array(H),c=c0||new Float64Array(H),loss=0,count=0;
 for(let t=0;t<T;t++){const s=stepForward(m.cell,xs[t],h,c);h=s.h;c=s.c||c;caches.push(s.cache);hs.push(masks?h.map((v,j)=>v*masks[t][j]):h);ys.push(readout(m,hs[t]));if(targets[t]!=null)count+=m.O;}
 const dys=ys.map((y,t)=>{
  if(targets[t]==null)return null;
  return Array.from(y,(v,o)=>{const tg=targets[t][o];if(kind==='bce'){const p=sigmoid(v);loss-=(tg*Math.log(p+1e-12)+(1-tg)*Math.log(1-p+1e-12))/count;return (p-tg)/count;}loss+=(v-tg)**2/count;return 2*(v-tg)/count;});
 });
 let dh=new Float64Array(H),dc=new Float64Array(H);const dxs=new Array(T),stateNorms=new Array(T);
 for(let t=T-1;t>=0;t--){
  if(dys[t])for(let o=0;o<m.O;o++){g.bv[o]+=dys[t][o];for(let j=0;j<H;j++){g.V[o*H+j]+=dys[t][o]*hs[t][j];dh[j]+=dys[t][o]*m.V[o*H+j]*(masks?masks[t][j]:1);}}
  stateNorms[t]=Math.hypot(norm(dh),m.cell.type==='lstm'?norm(dc):0);
  const b=stepBackward(m.cell,caches[t],dh,dc,g);dh=b.dh;dc=b.dc||dc;dxs[t]=b.dx;
 }
 return {loss,grads:g,ys,h,c,dxs,stateNorms};
}
function clipGrads(arrs,limit){
 let s=0;for(const a of arrs)for(let i=0;i<a.length;i++)s+=a[i]*a[i];
 const n=Math.sqrt(s),k=limit>0&&n>limit?limit/n:1;
 if(k<1)for(const a of arrs)for(let i=0;i<a.length;i++)a[i]*=k;
 return n;
}
function adam(params,grads,st,lr){
 st.t=(st.t||0)+1;st.m=st.m||params.map(p=>new Float64Array(p.length));st.v=st.v||params.map(p=>new Float64Array(p.length));
 const b1=0.9,b2=0.999,c1=1-b1**st.t,c2=1-b2**st.t;
 params.forEach((p,k)=>{const g=grads[k],mm=st.m[k],vv=st.v[k];for(let i=0;i<p.length;i++){mm[i]=b1*mm[i]+(1-b1)*g[i];vv[i]=b2*vv[i]+(1-b2)*g[i]*g[i];p[i]-=lr*(mm[i]/c1)/(Math.sqrt(vv[i]/c2)+1e-8);}});
}
/* 9장: 마지막 단계에서 출발한 기울기가 k단계 앞의 상태에 닿을 때의 크기. 가중치는 PyTorch 기본과 같은 ±1/√H 균등 분포. */
function gradFlow({type='rnn',T=30,H=8,gateBias=0,seed=5}={}){
 const cell=initCell(type,2,H,seed,{gateBias}),r=rng(seed+7),g={W:new Float64Array(cell.W.length),b:new Float64Array(cell.b.length)};
 let h=new Float64Array(H),c=new Float64Array(H);const caches=[];
 for(let t=0;t<T;t++){const s=stepForward(cell,[gauss(r)*0.5,gauss(r)*0.5],h,c);h=s.h;c=s.c||c;caches.push(s.cache);}
 let dh=Float64Array.from({length:H},()=>gauss(r)),dc=new Float64Array(H);const n0=norm(dh);dh=dh.map(v=>v/n0);
 const norms=[];let gate=0;
 for(let t=T-1;t>=0;t--){
  norms.push(Math.hypot(norm(dh),type==='lstm'?norm(dc):0));
  if(type==='lstm')gate+=caches[t].f.reduce((s,v)=>s+v,0)/H/T;if(type==='gru')gate+=caches[t].zg.reduce((s,v)=>s+v,0)/H/T;
  const b=stepBackward(cell,caches[t],dh,dc,g);dh=b.dh;dc=b.dc||dc;
 }
 return {norms,last:norms[T-1],gate:type==='rnn'?null:gate};
}

/* 7·11장: 기온 기록으로 다음 한 시간을 맞히는 모델을 잘라서 학습한다.
   window: 한 번에 거슬러 오르는 단계 수, carry: 창이 바뀔 때 은닉 상태 값을 이어받는지(기울기는 끊는다). */
function trainSeries({type='rnn',H=8,window=24,carry=true,epochs=30,lr=0.01,seed=1,clip=1,noise=0.6,nTrain=240,nEval=96,dropout=0,dataSeed=7}={}){
 const all=series(nTrain+nEval+1,{seed:dataSeed,noise}),u=all.map(toUnit),m=initModel(type,1,H,1,seed),st={},r=rng(seed+500),curve=[];
 const run=(from,to,train)=>{
  let h=null,c=null,sum=0,n=0;
  for(let s=from;s<to;s+=window){
   const e=Math.min(s+window,to),xs=[],ts=[];for(let t=s;t<e;t++){xs.push([u[t]]);ts.push([u[t+1]]);}
   const masks=train&&dropout>0?xs.map(()=>Float64Array.from({length:H},()=>r()<dropout?0:1/(1-dropout))):null;
   const out=bptt(m,xs,ts,{h0:carry?h:null,c0:carry?c:null,masks});h=out.h;c=out.c;
   out.ys.forEach((y,i)=>{sum+=(toC(y[0])-all[s+i+1])**2;n++;});
   if(train){clipGrads(gradsOf(out.grads),clip);adam(paramsOf(m),gradsOf(out.grads),st,lr);}
  }
  return Math.sqrt(sum/n);
 };
 let best={epoch:0,val:Infinity};
 for(let ep=1;ep<=epochs;ep++){let tr=run(0,nTrain,true);if(dropout>0)tr=run(0,nTrain,false);const val=run(nTrain,nTrain+nEval,false);curve.push({epoch:ep,train:tr,val});if(val<best.val)best={epoch:ep,val};}
 const act=all.slice(nTrain+1,nTrain+nEval+1),persist=rmse(all.slice(nTrain,nTrain+nEval),act);
 return {model:m,curve,best,final:curve[curve.length-1],persist,updates:Math.ceil(nTrain/window),stored:Math.min(window,nTrain),reach:Math.min(window,nTrain)};
}

/* 11장: 사흘(72시간)로 학습하고 다음 사흘로 검증한다. 같은 설정은 한 번만 학습한다. */
const validateMemo={};
function validateRun({H=16,dropout=0,epochs=200}={}){
 const key=[H,dropout,epochs].join();
 return validateMemo[key]||(validateMemo[key]=trainSeries({type:'rnn',H,dropout,epochs,nTrain:72,nEval:72,window:24,lr:0.02}));
}
function bestUpTo(curve,epoch){let best=curve[0];for(const c of curve)if(c.epoch<=epoch&&c.val<best.val)best=c;return best;}

/* 10장: 유나의 토마토 후기. 토큰은 이 책이 미리 나눈 것(형태소 분석기를 쓰지 않음). 1 = 긍정, 0 = 부정. */
const PAIRS=[['토마토 가','달',1],['토마토 가','신선 하',1],['토마토 가','시',0],['토마토 가','무르',0],['맛 이','좋',1],['맛 이','달',1],['맛 이','나쁘',0],['맛 이','시',0],['배송 이','빠르',1],['배송 이','느리',0],['포장 이','꼼꼼 하',1],['포장 이','나쁘',0],['향 이','좋',1],['향 이','나쁘',0],['값 이','싸',1],['값 이','비싸',0],['껍질 이','얇',1],['껍질 이','질기',0]];
const HELD_KEYS=['토마토 가 무르 지 않 다','맛 이 달 지 않 다','배송 이 느리 다','포장 이 꼼꼼 하 지 않 다','향 이 좋 다','값 이 비싸 지 않 다','껍질 이 질기 다','토마토 가 신선 하 다'];
const ALL_REVIEWS=[...PAIRS.flatMap(([s,a,y])=>[[`${s} ${a} 다`,y],[`${s} ${a} 지 않 다`,1-y]]),['토마토 가 달 고 신선 하 다',1],['토마토 가 시 고 무르 다',0],['배송 이 빠르 고 포장 이 꼼꼼 하 다',1],['값 이 비싸 고 맛 이 나쁘 다',0]].map(([s,y])=>({text:s,tokens:s.split(' '),y}));
const REVIEWS=ALL_REVIEWS.filter(x=>!HELD_KEYS.includes(x.text)),HELD_OUT=ALL_REVIEWS.filter(x=>HELD_KEYS.includes(x.text));
const VOCAB=['<pad>','<unk>',...[...new Set(REVIEWS.flatMap(x=>x.tokens))]];
const encode=tokens=>tokens.map(t=>{const i=VOCAB.indexOf(t);return i<0?1:i;});
function pad(ids,len,side='post'){const k=Math.max(0,len-ids.length),p=new Array(k).fill(0);return side==='pre'?[...p,...ids]:[...ids,...p];}
const sentimentMemo={};
/* 임베딩 표(낱말 수×E)와 LSTM을 함께 학습한다. 손실은 문장의 마지막 실제 토큰에서 잰다. */
function trainSentiment({E=4,H=8,epochs=200,lr=0.02,seed=10}={}){
 const key=[E,H,epochs,lr,seed].join();if(sentimentMemo[key])return sentimentMemo[key];
 const r=rng(seed),emb=Float64Array.from({length:VOCAB.length*E},()=>(r()*2-1)*0.5),m=initModel('lstm',E,H,1,seed+1,{gateBias:1}),st={},gE=new Float64Array(emb.length),curve=[];
 const vecs=ids=>ids.map(i=>emb.subarray(i*E,i*E+E));
 for(let ep=1;ep<=epochs;ep++){
  let loss=0;
  for(const ex of REVIEWS){
   const ids=encode(ex.tokens),ts=ids.map((_,t)=>t===ids.length-1?[ex.y]:null),out=bptt(m,vecs(ids),ts,{kind:'bce'});loss+=out.loss/REVIEWS.length;
   gE.fill(0);ids.forEach((id,t)=>{for(let k=0;k<E;k++)gE[id*E+k]+=out.dxs[t][k];});
   const gs=[...gradsOf(out.grads),gE];clipGrads(gs,1);adam([...paramsOf(m),emb],gs,st,lr);
  }
  curve.push(loss);
 }
 return sentimentMemo[key]={model:m,emb,E,H,curve};
}
/* 문장 하나를 분류한다. padTo로 길이를 맞추고, useLastReal이면 마지막 실제 토큰의 은닉 상태에서, 아니면 맨 끝 단계에서 읽는다. */
function classify(tokens,{padTo=0,side='post',useLastReal=true,S=trainSentiment()}={}){
 const raw=encode(tokens),ids=pad(raw,Math.max(padTo,raw.length),side),m=S.model,H=S.H;
 let h=new Float64Array(H),c=new Float64Array(H);const steps=[];
 ids.forEach((id,t)=>{const s=stepForward(m.cell,S.emb.subarray(id*S.E,id*S.E+S.E),h,c);h=s.h;c=s.c;steps.push({t,id,token:VOCAB[id],p:sigmoid(readout(m,h)[0])});});
 const lastReal=side==='pre'?ids.length-1:raw.length-1,at=useLastReal?lastReal:ids.length-1;
 return {ids,raw,steps,at,p:steps[at].p,vectors:ids.map(id=>Array.from(S.emb.subarray(id*S.E,id*S.E+S.E))),unknown:raw.filter(i=>i===1).length};
}
function sentimentAccuracy(set,opts){const rows=set.map(ex=>{const r=classify(ex.tokens,opts);return {...ex,p:r.p,ok:(r.p>=0.5?1:0)===ex.y};});return {rows,acc:rows.filter(x=>x.ok).length/rows.length};}

/* 12장: 층 하나의 계산량 비교 (Vaswani et al. 2017, 표 1의 차수를 숫자로 옮긴 것. 상수 배는 생략). */
function complexity({T=50,H=64,layers=1,bi=false}={}){
 const dirs=bi?2:1,cellParams=(D)=>H*D+H*H+H;
 let params=0;for(let l=0;l<layers;l++)params+=dirs*cellParams(l===0?H:H*dirs);
 return {rnn:{ops:T*H*H*dirs*layers,serial:T,path:T-1,params,seesFuture:bi},attn:{ops:T*T*H*layers,serial:1,path:1,scores:T*T},lstmParams:params*4};
}

/* 마지막 과제: 학습 기록 다섯 건. 기록과 판정은 이 책이 정한 시나리오다. */
const CASES=[
 {id:'nan',text:'단순 RNN으로 168시간 기록을 통째로 거슬러 학습했더니 3번째 반복에서 손실이 NaN이 되었다. 직전 반복의 기울기 크기는 4.1×10⁷이었다.',options:['학습률이 너무 작다','기울기가 폭발했다','은닉 크기가 너무 작다','검증 자료가 부족하다'],answer:1,chapter:'vanish',fix:'기울기 크기에 한도를 두어 자르고(6장), 한 번에 거슬러 오르는 길이를 줄입니다(7장). 순환 가중치의 크기도 확인합니다.'},
 {id:'far',text:'후기의 첫 낱말이 판정을 가르는 긴 문장(40토큰)에서만 정확도가 50%다. 마지막 단계에서 출발한 기울기는 40단계 앞에서 10⁻⁹배가 된다.',options:['임베딩 차원이 너무 크다','출력 형태가 many-to-many라서','기울기가 사라져 먼 입력의 영향을 배우지 못한다','패딩이 없어서'],answer:2,chapter:'gru',fix:'셀을 LSTM이나 GRU로 바꾸고 망각(갱신) 게이트의 편향을 1 근처로 둡니다(8·9장). 그래도 길면 어텐션을 씁니다(12장).'},
 {id:'pad',text:'길이를 12로 맞추려고 문장 뒤에 패딩을 붙이고 맨 끝 단계의 은닉 상태로 분류했더니, 짧은 문장의 정확도만 떨어졌다.',options:['패딩을 읽는 동안 은닉 상태가 바뀌었다','낱말 사전이 너무 작다','학습률이 너무 크다','기울기가 폭발했다'],answer:0,chapter:'embed',fix:'마지막 실제 토큰의 은닉 상태에서 읽거나, 패딩을 건너뛰게 길이를 함께 넘깁니다(10장).'},
 {id:'over',text:'학습 오차는 300번 반복 내내 줄어 0.2°C가 되었는데, 검증 오차는 40번째에 1.1°C로 가장 낮았다가 300번째에는 1.9°C다.',options:['기울기가 사라졌다','학습 자료를 외우기 시작했다','입출력 형태가 틀렸다','은닉 상태를 이어받지 않았다'],answer:1,chapter:'validate',fix:'검증 오차가 가장 낮았던 반복의 모델을 저장해 쓰고, 은닉 크기를 줄이거나 드롭아웃을 둡니다(11장).'},
 {id:'shape',text:'시각마다 난방기를 켤지 표시해야 하는데, 모델은 24시간을 다 읽고 켬·끔 하나만 낸다.',options:['셀을 GRU로 바꿔야 한다','기울기를 잘라야 한다','입출력 형태를 입력마다 출력 하나로 바꿔야 한다','임베딩을 써야 한다'],answer:2,chapter:'shapes',fix:'읽어 내는 층을 모든 단계에 달고 손실을 단계마다 재어 더합니다(4장).'}
];
function diagnose(choices){const rows=CASES.map(x=>({...x,choice:choices[x.id],ok:Number(choices[x.id])===x.answer}));return {rows,ok:rows.filter(r=>r.ok).length};}
/* 보기 순서: 정답을 target 자리로 옮긴다(화면에서만). */
const choiceOrder=(n,answer,target)=>{const order=[...Array(n).keys()].filter(i=>i!==answer);order.splice(Math.min(target,n-1),0,answer);return order;};
const api={rng,gauss,sigmoid,norm,BASE,AMP,toUnit,toC,series,solve,fitWindow,rmse,whyOrder,CELL_INPUTS,scalarRun,paramCount,FORMS,TASKS,shape,BPTT_INPUTS,scalarLoss,scalarBptt,orthogonal,gradNorms,initCell,stepForward,stepBackward,initModel,zeroGrads,paramsOf,gradsOf,readout,bptt,clipGrads,adam,gradFlow,trainSeries,validateRun,bestUpTo,REVIEWS,HELD_OUT,VOCAB,encode,pad,trainSentiment,classify,sentimentAccuracy,complexity,CASES,diagnose,choiceOrder};
root.RNMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
