/* 적분 책의 모든 계산. 화면 코드는 여기서 값을 받아 그리기만 한다.
   공통 사례: 수빈의 빗물 탱크. 비가 오는 10분 동안 유입 속도 r(t) = 6t − 0.6t² (L/분), 고인 양 A(t) = 3t² − 0.2t³ (L).
   설명용으로 정한 가상 값이며 0~10분의 합은 정확히 100 L이다. 단위: 시간 분, 유량 L/분, 양 L, 길이 dm(1 dm³ = 1 L). */
(function(root){
'use strict';
/* ── 공통 사례 ── */
const RAIN={a:0,b:10,total:100,peak:15,drain:8};
const rate=t=>6*t-0.6*t*t;
const stored=t=>3*t*t-0.2*t*t*t;
/* 배수구를 연 날: 들어오는 속도에서 일정한 배수 8 L/분을 뺀 순변화 속도와 그 누적 */
const net=t=>rate(t)-RAIN.drain;
const netStored=t=>stored(t)-RAIN.drain*t;
/* 순변화 속도가 0이 되는 두 시각 (0.6t² − 6t + 8 = 0) */
const NET_ZERO=[(6-Math.sqrt(36-19.2))/1.2,(6+Math.sqrt(36-19.2))/1.2];

/* ── 리만 합 ── rule: left | right | mid. rects는 그림용 [x0, 폭, 높이]. */
function riemann(f,a,b,n,rule){
 const dx=(b-a)/n,shift=rule==='left'?0:rule==='right'?1:0.5,rects=[];let sum=0;
 for(let i=0;i<n;i++){const h=f(a+(i+shift)*dx);sum+=h*dx;rects.push([a+i*dx,dx,h]);}
 return {sum,dx,rects};
}
function trapezoid(f,a,b,n){const dx=(b-a)/n;let s=(f(a)+f(b))/2;for(let i=1;i<n;i++)s+=f(a+i*dx);return s*dx;}
/* 심프슨 1/3 공식. n은 짝수여야 하며 홀수이면 1을 더한다. */
function simpson(f,a,b,n){if(n%2)n+=1;const dx=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*dx);return s*dx/3;}
function integrate(f,a,b,n,method){return method==='trap'?trapezoid(f,a,b,n):method==='simpson'?simpson(f,a,b,n):riemann(f,a,b,n,method).sum;}
/* 양수 부분과 음수 부분의 넓이를 따로 센다(가운데점 2000칸). */
function signedParts(f,a,b){const n=2000,dx=(b-a)/n;let pos=0,neg=0;for(let i=0;i<n;i++){const v=f(a+(i+0.5)*dx)*dx;if(v>=0)pos+=v;else neg-=v;}return {pos,neg,net:pos-neg};}
/* 평균 변화율 (F(x+h) − F(x))/h */
const quotient=(F,x,h)=>(F(x+h)-F(x))/h;

/* ── 5장: 원시함수 표 ── f, 원시함수 F(적분상수 0), 식, 그림 구간 */
const FAMILY={
 rain:{name:'r(t) = 6t − 0.6t² (빗물 유입 속도)',f:rate,F:stored,fs:'6t − 0.6t²',Fs:'3t² − 0.2t³',dom:[0,10],rule:'거듭제곱 규칙을 항마다: 6t → 6·t²/2, 0.6t² → 0.6·t³/3'},
 square:{name:'f(x) = x²',f:x=>x*x,F:x=>x*x*x/3,fs:'x²',Fs:'x³/3',dom:[-3,3],rule:'거듭제곱 규칙: 지수를 1 올리고 올린 지수로 나눈다'},
 poly:{name:'f(x) = 3x² − 2x + 1',f:x=>3*x*x-2*x+1,F:x=>x*x*x-x*x+x,fs:'3x² − 2x + 1',Fs:'x³ − x² + x',dom:[-2,3],rule:'합과 상수배는 항마다 따로 적분한다'},
 root:{name:'f(x) = √x',f:x=>Math.sqrt(Math.max(x,0)),F:x=>2/3*Math.pow(Math.max(x,0),1.5),fs:'√x = x^(1/2)',Fs:'(2/3)·x^(3/2)',dom:[0,9],rule:'거듭제곱 규칙은 분수 지수에도 쓴다: 1/2 + 1 = 3/2로 나눈다'},
 cos:{name:'f(x) = cos x',f:Math.cos,F:Math.sin,fs:'cos x',Fs:'sin x',dom:[-6,6],rule:'sin x를 미분하면 cos x이므로 거꾸로 읽는다'},
 exp:{name:'f(x) = eˣ',f:Math.exp,F:Math.exp,fs:'eˣ',Fs:'eˣ',dom:[-3,2],rule:'eˣ는 미분해도 그대로이므로 적분해도 그대로다'},
 recip:{name:'f(x) = 1/x (x > 0)',f:x=>1/x,F:x=>Math.log(x),fs:'1/x',Fs:'ln x',dom:[0.2,6],rule:'지수가 −1이면 거듭제곱 규칙을 쓸 수 없고 ln x가 된다'}
};

/* ── 6장: 치환적분 ── 원래 적분 ∫ f(x)dx (0~b)와 u = u(x)로 바꾼 ∫ g(u)du (u(0)~u(b)) */
const SUBST={
 unit:{name:'단위 바꾸기: ∫ r(t) dt, u = 60t (분 → 초)',f:rate,u:t=>60*t,du:()=>60,g:u=>rate(u/60)/60,exact:stored,bmax:10,xs:'t (분)',us:'u (초)',fs:'6t − 0.6t² (L/분)',gs:'r(u/60)/60 (L/초)',ds:'du = 60 dt'},
 cos:{name:'∫ 2x·cos(x²) dx, u = x²',f:x=>2*x*Math.cos(x*x),u:x=>x*x,du:x=>2*x,g:Math.cos,exact:b=>Math.sin(b*b),bmax:2.5,xs:'x',us:'u = x²',fs:'2x·cos(x²)',gs:'cos u',ds:'du = 2x dx'},
 gauss:{name:'∫ x·e^(−x²) dx, u = x²',f:x=>x*Math.exp(-x*x),u:x=>x*x,du:x=>2*x,g:u=>Math.exp(-u)/2,exact:b=>(1-Math.exp(-b*b))/2,bmax:2.5,xs:'x',us:'u = x²',fs:'x·e^(−x²)',gs:'e^(−u)/2',ds:'du = 2x dx'}
};
/* x축을 n칸으로 똑같이 나눈 왼쪽 합과, 같은 점을 u로 옮긴 합(칸 폭이 u(x_{i+1}) − u(x_i)로 달라진다). */
function substitution(key,b,n){
 const d=SUBST[key],dx=b/n,rows=[];let sx=0,su=0;
 for(let i=0;i<n;i++){const x=i*dx,x1=x+dx,u0=d.u(x),u1=d.u(x1),hx=d.f(x),hu=d.g(u0);sx+=hx*dx;su+=hu*(u1-u0);rows.push({x,dx,hx,u0,du:u1-u0,hu});}
 return {sumX:sx,sumU:su,exact:d.exact(b)-d.exact(0),ua:d.u(0),ub:d.u(b),rows};
}

/* ── 7장: 부분적분 ── ∫ u dv = [uv] − ∫ v du, 구간 0(또는 1)~b */
const STORM={a:8,tau:2}; /* 소나기형 유입 s(t) = 8t·e^(−t/2) (L/분). 0에서 ∞까지 32 L */
const storm=t=>STORM.a*t*Math.exp(-t/STORM.tau);
const stormStored=t=>32-16*(t+2)*Math.exp(-t/2);
const PARTS={
 storm:{name:'∫ 8t·e^(−t/2) dt (소나기형 유입)',lo:0,bmax:12,f:storm,u:t=>8*t,v:t=>-2*Math.exp(-t/2),vdu:t=>-16*Math.exp(-t/2),us:'u = 8t',dvs:'dv = e^(−t/2) dt',dus:'du = 8 dt',vs:'v = −2e^(−t/2)',exact:b=>stormStored(b)},
 xex:{name:'∫ x·eˣ dx',lo:0,bmax:2,f:x=>x*Math.exp(x),u:x=>x,v:x=>Math.exp(x),vdu:x=>Math.exp(x),us:'u = x',dvs:'dv = eˣ dx',dus:'du = dx',vs:'v = eˣ',exact:b=>(b-1)*Math.exp(b)+1},
 ln:{name:'∫ ln x dx (1에서 b까지)',lo:1,bmax:5,f:x=>Math.log(x),u:x=>Math.log(x),v:x=>x,vdu:()=>1,us:'u = ln x',dvs:'dv = dx',dus:'du = dx/x',vs:'v = x',exact:b=>b*Math.log(b)-b+1},
 xcos:{name:'∫ x·cos x dx',lo:0,bmax:6,f:x=>x*Math.cos(x),u:x=>x,v:x=>Math.sin(x),vdu:x=>Math.sin(x),us:'u = x',dvs:'dv = cos x dx',dus:'du = dx',vs:'v = sin x',exact:b=>b*Math.sin(b)+Math.cos(b)-1}
};
function parts(key,b){
 const d=PARTS[key],lo=d.lo,uv=d.u(b)*d.v(b)-d.u(lo)*d.v(lo),vdu=simpson(d.vdu,lo,b,400);
 return {uv,vdu,value:uv-vdu,exact:d.exact(b),numeric:simpson(d.f,lo,b,400)};
}

/* ── 8장: 수치적분 ── 참값이 알려진 네 적분 */
const erf=x=>{/* Abramowitz–Stegun 7.1.26, 절대 오차 1.5e-7 이하 */const s=x<0?-1:1,t=1/(1+0.3275911*Math.abs(x));return s*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x));};
const NUMERIC={
 rain:{name:'∫ (6t − 0.6t²) dt, 0~5분',f:rate,a:0,b:5,exact:50,unit:'L',note:'이차식이라 심프슨 공식은 칸 수와 상관없이 참값을 낸다'},
 gauss:{name:'∫ e^(−x²) dx, 0~1',f:x=>Math.exp(-x*x),a:0,b:1,exact:0.7468241328124271,unit:'',note:'원시함수를 다항식·지수·삼각함수의 유한한 조합으로 쓸 수 없는 적분'},
 sin:{name:'∫ sin x dx, 0~π',f:Math.sin,a:0,b:Math.PI,exact:2,unit:'',note:'원시함수 −cos x로 참값 2를 안다'},
 root:{name:'∫ √x dx, 0~1',f:x=>Math.sqrt(x),a:0,b:1,exact:2/3,unit:'',note:'x = 0에서 기울기가 끝없이 커져 오차가 느리게 준다'}
};
const METHODS=[['left','왼쪽 직사각형'],['mid','가운데점'],['trap','사다리꼴'],['simpson','심프슨']];
function numeric(key,n){const d=NUMERIC[key];return METHODS.map(([m,name])=>{const v=integrate(d.f,d.a,d.b,n,m),v2=integrate(d.f,d.a,d.b,2*n,m),e=Math.abs(v-d.exact),e2=Math.abs(v2-d.exact);return {method:m,name,value:v,error:e,ratio:e2>1e-14?e/e2:null};});}

/* ── 9장: 회전체 부피 ── 높이 h(dm)에서의 반지름 ρ(h)(dm)를 세로축 둘레로 돌린다. V = π∫ρ² dh (dm³ = L) */
const SOLIDS={
 bowl:{name:'빗물 탱크 (포물면): ρ = √(1.2h), 깊이 8 dm',rho:h=>Math.sqrt(1.2*h),H:8,exact:h=>0.6*Math.PI*h*h,rs:'√(1.2h)',Vs:'0.6π·h²'},
 cone:{name:'원뿔: ρ = h/2, 높이 6 dm',rho:h=>h/2,H:6,exact:h=>Math.PI*h*h*h/12,rs:'h/2',Vs:'π·h³/12'},
 sphere:{name:'구: ρ = √(4h − h²), 지름 4 dm',rho:h=>Math.sqrt(Math.max(4*h-h*h,0)),H:4,exact:h=>Math.PI*(2*h*h-h*h*h/3),rs:'√(4h − h²)',Vs:'π(2h² − h³/3)'},
 jar:{name:'항아리: ρ = 2 + sin(πh/5), 높이 8 dm',rho:h=>2+Math.sin(Math.PI*h/5),H:8,exact:h=>{const k=Math.PI/5;return Math.PI*(4.5*h-4*(Math.cos(k*h)-1)/k-Math.sin(2*k*h)/(4*k));},rs:'2 + sin(πh/5)',Vs:'π[4.5h − (20/π)(cos(πh/5) − 1) − (5/(4π))·sin(2πh/5)]'}
};
/* 0~level 구간을 원판 n개로 나눈 부피(가운데점 반지름). disks는 [아래 높이, 두께, 반지름]. */
function diskVolume(key,n,level){
 const d=SOLIDS[key],top=level===undefined?d.H:level,dh=top/n,disks=[];let sum=0;
 for(let i=0;i<n;i++){const r=d.rho((i+0.5)*dh);sum+=Math.PI*r*r*dh;disks.push([i*dh,dh,r]);}
 return {sum,exact:d.exact(top),disks,dh};
}
/* 탱크에 V 리터가 고였을 때의 수위 (포물면 탱크, V = 0.6πh²의 역) */
const bowlLevel=V=>Math.sqrt(V/(0.6*Math.PI));

/* ── 10장: 확률밀도 ── 기다리는 시간 X(분), 0~20분 구간에서 본다 */
const DENSITY={
 normal:{name:'정규분포 (평균 10분, 표준편차 3분)',f:x=>Math.exp(-0.5*((x-10)/3)**2)/(3*Math.sqrt(2*Math.PI)),cdf:x=>0.5*(1+erf((x-10)/(3*Math.SQRT2))),mean:10,sd:3,ymax:0.26},
 expo:{name:'지수분포 (평균 4분)',f:x=>x<0?0:Math.exp(-x/4)/4,cdf:x=>x<0?0:1-Math.exp(-x/4),mean:4,sd:4,ymax:0.26},
 uniform:{name:'균등분포 (0~20분)',f:x=>x>=0&&x<=20?0.05:0,cdf:x=>Math.min(Math.max(x/20,0),1),mean:10,sd:20/Math.sqrt(12),ymax:0.26}
};
const DOMAIN=[0,20];
function density(key,a,b){
 const d=DENSITY[key],lo=Math.min(a,b),hi=Math.max(a,b),N=2000;
 const prob=simpson(d.f,lo,hi,N),total=simpson(d.f,DOMAIN[0],DOMAIN[1],N),mean=simpson(x=>x*d.f(x),DOMAIN[0],DOMAIN[1],N);
 const second=simpson(x=>x*x*d.f(x),DOMAIN[0],DOMAIN[1],N);
 return {prob,cdf:d.cdf(hi)-d.cdf(lo),total,mean,sd:Math.sqrt(Math.max(second-mean*mean,0)),height:d.f((lo+hi)/2)};
}

/* ── 11장: 이중적분 ── 바닥 직사각형 위의 높이 z = f(x, y)를 n×n 기둥(가운데점)으로 더한다 */
const SURFACES={
 dome:{name:'둥근 지붕: z = 4 − x² − y², −1 ≤ x, y ≤ 1',f:(x,y)=>4-x*x-y*y,ax:-1,bx:1,ay:-1,by:1,exact:40/3,zmax:4,area:x=>2*(4-x*x)-2/3,As:'A(x) = 2(4 − x²) − 2/3'},
 ramp:{name:'휘어진 비탈: z = x²·y, 0 ≤ x, y ≤ 2',f:(x,y)=>x*x*y,ax:0,bx:2,ay:0,by:2,exact:16/3,zmax:8,area:x=>2*x*x,As:'A(x) = 2x²'},
 plane:{name:'기운 평면: z = 1 + 0.5x + 0.25y, 0 ≤ x, y ≤ 2',f:(x,y)=>1+0.5*x+0.25*y,ax:0,bx:2,ay:0,by:2,exact:7,zmax:2.5,area:x=>2.5+x,As:'A(x) = 2.5 + x'}
};
function columns(key,n){
 const d=SURFACES[key],dx=(d.bx-d.ax)/n,dy=(d.by-d.ay)/n,cols=[],slices=[];let sum=0;
 for(let i=0;i<n;i++){const x=d.ax+(i+0.5)*dx;let row=0;
  for(let j=0;j<n;j++){const y=d.ay+(j+0.5)*dy,z=d.f(x,y);row+=z*dy;cols.push([d.ax+i*dx,d.ay+j*dy,dx,dy,z]);}
  slices.push({x,area:row,exact:d.area(x)});sum+=row*dx;}
 return {sum,exact:d.exact,cols,slices,dx,dy};
}

/* x 방향으로 n장의 판으로 자른 합: 판마다 단면 넓이 A(x) = ∫ f(x, y) dy(닫힌 식)에 두께를 곱한다. curve는 그림용 단면 [[y, z]]. */
function slabs(key,n){
 const d=SURFACES[key],dx=(d.bx-d.ax)/n,list=[];let sum=0;
 for(let i=0;i<n;i++){const x=d.ax+(i+0.5)*dx,A=d.area(x),curve=[];for(let k=0;k<=12;k++){const y=d.ay+(d.by-d.ay)*k/12;curve.push([y,d.f(x,y)]);}sum+=A*dx;list.push({x0:d.ax+i*dx,dx,x,area:A,curve});}
 return {sum,exact:d.exact,list,dx};
}

/* ── 마지막 과제 ── 식을 모르는 날의 유량계 기록. 실제 유입은 소나기형 s(t) = 8t·e^(−t/2)에 2.36을 곱한 값이지만
   독자에게는 표로만 준다. 측정 간격(분)을 고르면 그 간격으로 읽은 값만 쓴다. 탱크 용량 CAPACITY L, 처음에 START L 고여 있음. */
const FINAL={T:12,k:2.36,capacity:120.6,start:48.2};
const finalRate=t=>FINAL.k*storm(t);
const finalExact=()=>FINAL.k*stormStored(FINAL.T);
function finalTable(step){const n=Math.round(FINAL.T/step),rows=[];for(let i=0;i<=n;i++){const t=i*step;rows.push([t,Math.round(finalRate(t)*10)/10]);}return rows;}
/* 표의 값만으로 네 방법의 추정값을 낸다. 심프슨은 칸 수가 짝수일 때만 쓴다. */
function finalEstimate(step){
 const rows=finalTable(step),y=rows.map(r=>r[1]),n=y.length-1;let left=0,right=0;
 for(let i=0;i<n;i++){left+=y[i]*step;right+=y[i+1]*step;}
 let s=y[0]+y[n];for(let i=1;i<n;i++)s+=(i%2?4:2)*y[i];
 const est={left,right,trap:(left+right)/2,simpson:n%2?null:s*step/3};
 const vals=Object.values(est).filter(v=>v!==null),room=FINAL.capacity-FINAL.start;
 const lo=Math.min(...vals),hi=Math.max(...vals);
 return {rows,est,lo,hi,room,verdict:lo>room?'over':hi<room?'under':'split'};
}

/* 확인 문제 보기 순서: 정답(answer)이 화면의 target번째 칸에 오도록 돌린다. */
function quizOrder(n,answer,target){return Array.from({length:n},(_,k)=>((answer-target+k)%n+n)%n);}
const IGMath={quizOrder,RAIN,rate,stored,net,netStored,NET_ZERO,riemann,trapezoid,simpson,integrate,signedParts,quotient,FAMILY,SUBST,substitution,STORM,storm,stormStored,PARTS,parts,erf,NUMERIC,METHODS,numeric,SOLIDS,diskVolume,bowlLevel,DENSITY,DOMAIN,density,SURFACES,columns,slabs,FINAL,finalRate,finalExact,finalTable,finalEstimate};
if(typeof module!=='undefined')module.exports=IGMath;else root.IGMath=IGMath;
})(typeof window!=='undefined'?window:globalThis);
