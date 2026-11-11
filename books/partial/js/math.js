/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   공통 사례는 도윤의 카페 8일 기록에 그은 예측선 ŷ = w·x + b의 손실 L(w, b)이다.
   x = 최고 기온 − 20 (℃), y = 아이스 음료 판매(잔). 설명용 가상 값이며 「신경망의 계산」 2~3장과 같은 숫자를 쓴다(코드는 가져오지 않는다).
   L은 오차 제곱의 평균(MSE, 잔²)이다. 8장의 뉴런과 마지막 과제의 2-2-1 망은 시그모이드와 제곱 오차를 쓴다. */
(function(root){
'use strict';
const DATA={x:[0,1,2,3,4,5,6,7],y:[12,15,21,22,28,33,34,41]};
const N=DATA.x.length;
/* 3차원 그림과 지도가 보여 주는 창. w와 b의 폭을 같게 잡아 위에서 본 지도에서 각도가 일그러지지 않게 한다. */
const WINDOW={x:[0,8],y:[8,16],z:[0,420]};
const B0=12;

function loss(w,b){let s=0;for(let i=0;i<N;i++){const e=w*DATA.x[i]+b-DATA.y[i];s+=e*e;}return s/N;}
/* L = A·w² + B·b² + C·w·b + D·w + E·b + F 로 전개한 계수. 카페 기록이면 17.5, 1, 7, −222.75, −51.5, 750.5 */
function coef(){
 let sx=0,sxx=0,sy=0,sxy=0,syy=0;
 for(let i=0;i<N;i++){const x=DATA.x[i],y=DATA.y[i];sx+=x;sxx+=x*x;sy+=y;sxy+=x*y;syy+=y*y;}
 return {A:sxx/N,B:1,C:2*sx/N,D:-2*sxy/N,E:-2*sy/N,F:syy/N};
}
/* 편미분 두 개를 모은 기울기 벡터. ∂L/∂w = 2A·w + C·b + D, ∂L/∂b = 2B·b + C·w + E */
function grad(w,b){const k=coef(),gw=2*k.A*w+k.C*b+k.D,gb=2*k.B*b+k.C*w+k.E;return {gw,gb,norm:Math.hypot(gw,gb),deg:Math.atan2(gb,gw)*180/Math.PI};}
/* 두 편미분이 모두 0인 점(손실이 가장 작은 선) */
function best(){const k=coef(),det=4*k.A*k.B-k.C*k.C,w=(-2*k.B*k.D+k.C*k.E)/det,b=(-2*k.A*k.E+k.C*k.D)/det;return {w,b,loss:loss(w,b)};}

/* 1장: 한 변수 함수의 차분. forward는 앞 차분, central은 가운데 차분 */
function diff(f,x,h){return {forward:(f(x+h)-f(x))/h,central:(f(x+h)-f(x-h))/(2*h)};}
/* b를 고정한 손실 곡선 위에서 w와 w+h를 잇는 할선. 이차식이라 할선 기울기 − 접선 기울기 = A·h 가 정확히 성립한다. */
function secant(w,h,b=B0){const L0=loss(w,b),L1=loss(w+h,b),slope=(L1-L0)/h,exact=grad(w,b).gw;return {L0,L1,slope,exact,gap:slope-exact};}

/* 2장: 한 변수만 움직인 단면. which = 'w'이면 b를 고정하고 w를 움직인다. 단면은 p·t² + q·t + r 꼴의 포물선이다. */
function slice(w,b,which){
 const k=coef(),g=grad(w,b),h=1e-4;
 if(which==='w'){const f=t=>loss(t,b);return {which,at:w,fixed:b,p:k.A,q:k.C*b+k.D,r:k.B*b*b+k.E*b+k.F,slope:g.gw,numeric:diff(f,w,h).central,other:g.gb,bottom:-(k.C*b+k.D)/(2*k.A),value:loss(w,b)};}
 const f=t=>loss(w,t);return {which,at:b,fixed:w,p:k.B,q:k.C*w+k.E,r:k.A*w*w+k.D*w+k.F,slope:g.gb,numeric:diff(f,b,h).central,other:g.gw,bottom:-(k.C*w+k.E)/(2*k.B),value:loss(w,b)};
}

/* 3장: 모양이 다른 두 변수 함수 다섯 개. fx는 y를 상수로 보고 x로, fy는 x를 상수로 보고 y로 미분한 식이다. rule은 그때 쓴 규칙을 글로 적은 것 */
const SURFACES={
 bowl:{name:'x² + y²',f:(x,y)=>x*x+y*y,fx:(x,y)=>2*x,fy:(x,y)=>2*y,tx:'2x',ty:'2y',rx:'y²은 상수라 0이 되고 x²만 2x로 바뀝니다',ry:'x²은 상수라 0이 되고 y²만 2y로 바뀝니다',z:[0,8]},
 plane:{name:'3x + 2y',f:(x,y)=>3*x+2*y,fx:()=>3,fy:()=>2,tx:'3',ty:'2',rx:'2y는 상수라 0이 되고 3x는 3이 됩니다',ry:'3x는 상수라 0이 되고 2y는 2가 됩니다',z:[-10,10]},
 product:{name:'x·y',f:(x,y)=>x*y,fx:(x,y)=>y,fy:(x,y)=>x,tx:'y',ty:'x',rx:'y를 x에 곱해진 상수로 보면 (상수)·x의 미분이라 그 상수 y가 남습니다',ry:'x를 y에 곱해진 상수로 보면 그 상수 x가 남습니다',z:[-4,4]},
 saddle:{name:'x² − y²',f:(x,y)=>x*x-y*y,fx:(x,y)=>2*x,fy:(x,y)=>-2*y,tx:'2x',ty:'−2y',rx:'−y²은 상수라 0이 되고 x²만 2x로 바뀝니다',ry:'x²은 상수라 0이 되고 −y²이 −2y로 바뀝니다',z:[-4,4]},
 mixed:{name:'x²·y',f:(x,y)=>x*x*y,fx:(x,y)=>2*x*y,fy:(x,y)=>x*x,tx:'2xy',ty:'x²',rx:'y를 상수 배로 보면 y·x²의 미분이라 y·2x입니다',ry:'x²을 상수 배로 보면 x²·y의 미분이라 x²입니다',z:[-8,8]}
};
const SURFACE_WINDOW=k=>({x:[-2,2],y:[-2,2],z:SURFACES[k].z});
function partials(kind,x,y){
 const s=SURFACES[kind],h=1e-4;
 return {value:s.f(x,y),fx:s.fx(x,y),fy:s.fy(x,y),nx:diff(t=>s.f(t,y),x,h).central,ny:diff(t=>s.f(x,t),y,h).central};
}

/* 4장: 접평면으로 어림한 변화 = ∂L/∂w·Δw + ∂L/∂b·Δb. L이 이차식이라 실제 변화와의 차이는 A·Δw² + B·Δb² + C·Δw·Δb 로 정확히 떨어진다. */
function planeEstimate(w,b,dw,db){
 const g=grad(w,b),k=coef(),partW=g.gw*dw,partB=g.gb*db,estimate=partW+partB,actual=loss(w+dw,b+db)-loss(w,b);
 return {...g,L:loss(w,b),partW,partB,estimate,actual,error:actual-estimate,curve:k.A*dw*dw+k.B*db*db+k.C*dw*db};
}

/* 5장: (cos θ, sin θ) 방향으로 한 단위 움직일 때 손실이 변하는 빠르기 = ∂L/∂w·cos θ + ∂L/∂b·sin θ */
function directional(w,b,deg){
 const g=grad(w,b),t=deg*Math.PI/180,rate=g.gw*Math.cos(t)+g.gb*Math.sin(t),h=1e-4;
 const numeric=(loss(w+h*Math.cos(t),b+h*Math.sin(t))-loss(w-h*Math.cos(t),b-h*Math.sin(t)))/(2*h);
 let off=((deg-g.deg)%360+360)%360;if(off>180)off=360-off;
 return {...g,rate,numeric,off};
}

/* 6장: 경사하강. 걸음마다 두 편미분을 같은 자리에서 구한 뒤 w와 b를 함께 옮긴다. */
function walk(w0,b0,lr,steps){
 const path=[{w:w0,b:b0,L:loss(w0,b0)}];let w=w0,b=b0;
 for(let i=0;i<steps;i++){const g=grad(w,b);w-=lr*g.gw;b-=lr*g.gb;path.push({w,b,L:loss(w,b)});}
 const last=path[path.length-1];
 return {path,first:grad(w0,b0),last,diverged:!(last.L<=path[0].L)||!Number.isFinite(last.L)};
}
/* 걸음이 발산하지 않는 학습률의 한계 = 2 ÷ (가장 큰 곡률). 곡률 표 [[2A, C], [C, 2B]]의 큰 고윳값을 쓴다. */
function stepLimit(){const k=coef(),tr=2*k.A+2*k.B,det=4*k.A*k.B-k.C*k.C,big=(tr+Math.sqrt(tr*tr-4*det))/2;return {big,small:det/big,limit:2/big};}

/* 7장: 하루치 손실 ℓ = u², u = w·x + b − y. 안쪽 변화율 x와 바깥 변화율 2u를 곱한다. dw만큼 움직였을 때의 실제 변화도 함께 낸다. */
function chainDay(day,w,b=B0,dw=0.1){
 const x=DATA.x[day],y=DATA.y[day],u=w*x+b-y,inner=x,outer=2*u,slope=outer*inner;
 const du=inner*dw,u2=(w+dw)*x+b-y,actual=u2*u2-u*u;
 const f=t=>{const e=t*x+b-y;return e*e;};
 return {x,y,u,l:u*u,inner,outer,slope,du,estimate:slope*dw,actual,numeric:diff(f,w,1e-4).central};
}
/* 그림과 본문 예: y = k·x, z = y² */
function chainSimple(x,k=3,dx=0.1){const y=k*x,z=y*y,dy=k*dx,dz=(y+dy)*(y+dy)-z;return {y,z,inner:k,outer:2*y,slope:2*y*k,dy,dz,estimate:2*y*k*dx};}

/* 8장: 뉴런 하나의 계산 그래프. z = w·x + b, a = σ(z), L = (a − y)². 「신경망의 계산」 6장 실험 1과 같은 고정값(x = 1.5, b = −0.5, y = 1) */
const sigmoid=z=>1/(1+Math.exp(-z));
const NEURON={x:1.5,b:-0.5,y:1};
function neuron(w,o=NEURON){
 const {x,b,y}=o,z=w*x+b,a=sigmoid(z),L=(a-y)*(a-y),dLda=2*(a-y),dadz=a*(1-a),dLdz=dLda*dadz;
 const f=t=>{const q=sigmoid(t*x+b)-y;return q*q;};
 return {x,b,y,z,a,L,dLda,dadz,dLdz,dzdw:x,dzdb:1,dzdx:w,dLdw:dLdz*x,dLdb:dLdz,dLdx:dLdz*w,numeric:diff(f,w,1e-5).central};
}

/* 9장: 앞의 n일만 쓴 평균 손실에서 w의 기울기. w는 날마다 한 번씩 쓰이므로 날마다의 몫 (2/n)·eᵢ·xᵢ를 더한다. */
function pathSum(w,n,b=B0){
 const parts=[];let total=0;
 for(let i=0;i<n;i++){const e=w*DATA.x[i]+b-DATA.y[i],c=2*e*DATA.x[i]/n;parts.push({x:DATA.x[i],e,c});total+=c;}
 const f=t=>{let s=0;for(let i=0;i<n;i++){const e=t*DATA.x[i]+b-DATA.y[i];s+=e*e;}return s/n;};
 return {parts,total,numeric:diff(f,w,1e-4).central};
}
/* 같은 w를 T번 곱하는 계산 h_T = w^T·x. w가 쓰인 자리마다 경로가 하나씩 생기고, 경로 하나의 몫은 w^(T−1)·x 이다. */
function shared(w,T,x=2){
 const h=Math.pow(w,T)*x,each=Math.pow(w,T-1)*x,f=t=>Math.pow(t,T)*x;
 return {h,each,paths:T,total:T*each,numeric:diff(f,w,1e-5).central};
}

/* 10장: 한 줄로 이어진 n개 층. aₖ = act(w·aₖ₋₁), 층 하나를 거슬러 갈 때 곱해지는 값은 w·act′(zₖ) */
const ACT={sigmoid:[sigmoid,a=>a*(1-a)],tanh:[Math.tanh,a=>1-a*a],relu:[z=>Math.max(0,z),a=>a>0?1:0],linear:[z=>z,()=>1]};
const ACT_NAME={sigmoid:'시그모이드',tanh:'tanh',relu:'ReLU',linear:'활성화 없음'};
function deepChain(kind,w,n,x=0.5){
 const [f,d]=ACT[kind],factors=[],running=[];let a=x,p=1;
 for(let k=0;k<n;k++){a=f(w*a);const local=w*d(a);factors.push(local);}
 /* 출력 쪽에서부터 곱해 온 값: running[j] = 마지막 층에서 j번째 층 입력까지의 곱 */
 for(let k=n-1;k>=0;k--){p*=factors[k];running.unshift(p);}
 return {factors,running,product:p,out:a};
}

/* 마지막 과제: 2-2-1 시그모이드 망과 제곱 오차. 가중치는 고정한 값이다. */
const NET={x:[1,0.5],y:1,W1:[[0.5,-0.4],[0.3,0.8]],b1:[0.1,-0.2],W2:[0.7,-0.6],b2:0.2};
function netForward(net=NET){
 const h=[0,1].map(j=>sigmoid(net.W1[j][0]*net.x[0]+net.W1[j][1]*net.x[1]+net.b1[j]));
 const o=sigmoid(net.W2[0]*h[0]+net.W2[1]*h[1]+net.b2);
 return {h,o,L:(o-net.y)*(o-net.y)};
}
const AUDIT_TARGETS=['v1','w11','x1'],AUDIT_MODES=['correct','skipact','onepath','multiply'];
function netLoss(target,value){
 const n=JSON.parse(JSON.stringify(NET));
 if(target==='v1')n.W2[0]=value;else if(target==='w11')n.W1[0][0]=value;else n.x[0]=value;
 return netForward(n).L;
}
/* target의 기울기를 mode 방식으로 계산한다. correct가 바른 계산이고 나머지는 흔한 실수다.
   skipact: 시그모이드 미분 하나를 빠뜨림 · onepath: 두 경로 가운데 h₁ 쪽만 셈 · multiply: 두 경로의 값을 더하지 않고 곱함 */
function audit(target,mode='correct'){
 const {h,o,L}=netForward(),dLdo=2*(o-NET.y),do_=o*(1-o),dh=h.map(v=>v*(1-v)),delta=dLdo*do_;
 const p1=NET.W2[0]*dh[0]*NET.W1[0][0],p2=NET.W2[1]*dh[1]*NET.W1[1][0];
 const correct={v1:delta*h[0],w11:delta*NET.W2[0]*dh[0]*NET.x[0],x1:delta*(p1+p2)}[target];
 let value=correct;
 if(mode==='skipact')value={v1:dLdo*h[0],w11:delta*NET.W2[0]*NET.x[0],x1:delta*(NET.W2[0]*NET.W1[0][0]+NET.W2[1]*NET.W1[1][0])}[target];
 if(mode==='onepath'&&target==='x1')value=delta*p1;
 if(mode==='multiply'&&target==='x1')value=delta*p1*p2;
 const at={v1:NET.W2[0],w11:NET.W1[0][0],x1:NET.x[0]}[target],numeric=diff(t=>netLoss(target,t),at,1e-5).central;
 const applies=mode==='correct'||mode==='skipact'||target==='x1';
 return {h,o,L,dLdo,do_,dh,delta,p1,p2,correct,value,numeric,applies,paths:target==='x1'?2:1,relError:Math.abs(value-numeric)/Math.max(Math.abs(numeric),1e-12)};
}

/* 3차원 그림: (w, b, L)을 −1~1, −1~1, 0~1로 맞춘 뒤 yaw(세로축 둘레), pitch(내려다보는 각, 90이면 바로 위)로 돌려 화면 좌표를 낸다.
   b가 커질수록 화면 안쪽(위에서 보면 위쪽)으로 간다. depth가 클수록 보는 사람에게 가깝다. */
function unit(x,y,z,win=WINDOW){return [(x-win.x[0])/(win.x[1]-win.x[0])*2-1,-((y-win.y[0])/(win.y[1]-win.y[0])*2-1),Math.max(0,Math.min(1,(z-win.z[0])/(win.z[1]-win.z[0])))];}
function project(u,v,t,yaw,pitch,o={}){
 const s=o.scale||120,cx=o.cx||240,cy=o.cy||195,H=o.height||0.8,ya=yaw*Math.PI/180,pa=pitch*Math.PI/180;
 const X=u*Math.cos(ya)-v*Math.sin(ya),Y=u*Math.sin(ya)+v*Math.cos(ya);
 return {x:cx+s*X,y:cy+s*(Y*Math.sin(pa)-t*H*Math.cos(pa)),depth:Y*Math.cos(pa)+t*H*Math.sin(pa)};
}

/* 확인 문제 보기 순서: 화면 자리 k에 원래 보기 번호를 돌려 놓아 정답이 target 자리에 오게 한다. */
function quizOrder(n,answer,target){return Array.from({length:n},(_,k)=>((answer-target+k)%n+n)%n);}
const DXMath={quizOrder,DATA,N,WINDOW,B0,loss,coef,grad,best,diff,secant,slice,SURFACES,SURFACE_WINDOW,partials,planeEstimate,directional,walk,stepLimit,chainDay,chainSimple,sigmoid,NEURON,neuron,pathSum,shared,ACT,ACT_NAME,deepChain,NET,netForward,netLoss,AUDIT_TARGETS,AUDIT_MODES,audit,unit,project};
if(typeof module!=='undefined')module.exports=DXMath;else root.DXMath=DXMath;
})(typeof window!=='undefined'?window:globalThis);
