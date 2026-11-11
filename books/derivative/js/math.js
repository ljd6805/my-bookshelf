/* 「미분」 책의 모든 계산. 화면 코드는 여기 값을 읽어 그리기만 한다.
   공통 사례: 위로 쏜 물로켓의 높이 h(t) = 20t − 5t² (m, 초).
   가정: 물을 다 뿜은 순간을 t = 0, 그때 속도 20 m/s, 중력가속도 10 m/s²(실제 약 9.8), 공기 저항 없음. 0 ≤ t ≤ 4.
   길이 단위는 본문에 적은 대로(m, cm), 각도는 따로 말하지 않으면 라디안이다. */
(root=>{
'use strict';
const V0=20,G=10,T_END=4;
const rocket={h:t=>V0*t-G/2*t*t,v:t=>V0-G*t,a:()=>-G,V0,G,T_END,top:{t:V0/G,h:V0*V0/(2*G)}};

/* 평균 변화율 (f(b) − f(a)) / (b − a). a = b이면 0/0이라 정의되지 않으므로 NaN을 돌려준다. */
function avgRate(f,a,b){return a===b?NaN:(f(b)-f(a))/(b-a);}
/* 가운데 차분으로 어림한 순간 변화율. 규칙으로 구한 값을 검산할 때만 쓴다. */
function numDiff(f,x,h=1e-5){return (f(x+h)-f(x-h))/(2*h);}
/* a에서 시작하는 구간 [a, a+dt]를 줄여 가며 평균 변화율을 적은 표. dt가 음수이면 왼쪽 구간이다. */
function shrinkTable(f,a,dts){return dts.map(dt=>({dt,avg:avgRate(f,a,a+dt)}));}

/* 2장 실험 2: 그 점의 값과 극한이 다른 세 경우. at은 다가갈 점, value는 그 점의 함숫값(없으면 NaN). */
const LIMITS={
 hole:{name:'(x² − 1)/(x − 1), x → 1',at:1,f:x=>x===1?NaN:(x*x-1)/(x-1),value:NaN,left:2,right:2},
 jump:{name:'주차 요금(원): 1시간 미만 1,000, 1시간부터 1,500, x → 1',at:1,f:x=>x<1?1000:1500,value:1500,left:1000,right:1500},
 sinc:{name:'sin x / x (x는 라디안), x → 0',at:0,f:x=>x===0?NaN:Math.sin(x)/x,value:NaN,left:1,right:1}
};
function limitProbe(id,d){const L=LIMITS[id];return {left:L.f(L.at-d),right:L.f(L.at+d),value:L.value,exists:L.left===L.right,limit:L.left===L.right?L.left:NaN,leftLimit:L.left,rightLimit:L.right};}

/* 그래프 실험에 쓰는 함수 목록. d1·d2는 손으로 미분한 식이고 tests에서 numDiff와 대조한다. crit는 f′ = 0인 점. */
const FUNCS={
 rocket:{name:'로켓 높이 h(t) = 20t − 5t²',x:'t (초)',y:'h (m)',f:rocket.h,d1:rocket.v,d2:()=>-G,dom:[0,4],range:[0,22],drange:[-22,22],crit:[2],unit:'m/s'},
 cubic:{name:'f(x) = x³ − 3x',x:'x',y:'f(x)',f:x=>x**3-3*x,d1:x=>3*x*x-3,d2:x=>6*x,dom:[-2.2,2.2],range:[-5,5],drange:[-4,12],crit:[-1,1],unit:''},
 cube:{name:'f(x) = x³',x:'x',y:'f(x)',f:x=>x**3,d1:x=>3*x*x,d2:x=>6*x,dom:[-2,2],range:[-8,8],drange:[-2,12],crit:[0],unit:''},
 sine:{name:'f(x) = sin x',x:'x (라디안)',y:'f(x)',f:Math.sin,d1:Math.cos,d2:x=>-Math.sin(x),dom:[0,2*Math.PI],range:[-1.3,1.3],drange:[-1.3,1.3],crit:[Math.PI/2,3*Math.PI/2],unit:''},
 abs:{name:'f(x) = |x|',x:'x',y:'f(x)',f:Math.abs,d1:x=>x===0?NaN:Math.sign(x),d2:x=>x===0?NaN:0,dom:[-2,2],range:[-0.5,2.5],drange:[-1.5,1.5],crit:[],unit:''}
};
/* 한 점에서 증가·감소와 휘는 방향을 판정한다. eps 안쪽은 0으로 본다. */
function shapeAt(id,x,eps=1e-9){
 const F=FUNCS[id],d1=F.d1(x),d2=F.d2(x);
 const trend=Math.abs(d1)<eps?'flat':d1>0?'up':'down',bend=Math.abs(d2)<eps?'none':d2>0?'cup':'cap';
 return {f:F.f(x),d1,d2,trend,bend};
}
/* f′ = 0인 점마다 앞뒤 부호를 보고 극대·극소·극값 아님을 가른다. */
function classify(id,delta=1e-3){
 const F=FUNCS[id];
 return F.crit.map(c=>{const l=F.d1(c-delta),r=F.d1(c+delta);return {x:c,f:F.f(c),kind:l>0&&r<0?'max':l<0&&r>0?'min':'none'};});
}

/* 5장: xⁿ이 (x+dx)ⁿ으로 자랄 때 늘어난 양을 조각으로 나눈다. n = 2는 정사각형 넓이, n = 3은 정육면체 부피. */
function powerPieces(n,x,dx){
 if(n===2){const slabs=2*x*dx,corner=dx*dx;return {base:x*x,slabs,rods:0,corner,exact:slabs+corner,linear:slabs,ratio:dx?(slabs+corner)/dx:NaN,rule:2*x};}
 const slabs=3*x*x*dx,rods=3*x*dx*dx,corner=dx**3;
 return {base:x**3,slabs,rods,corner,exact:slabs+rods+corner,linear:slabs,ratio:dx?(slabs+rods+corner)/dx:NaN,rule:3*x*x};
}
/* 다항식: 계수 배열 [a₀, a₁, a₂, …] = a₀ + a₁x + a₂x² + … */
function polyEval(c,x){return c.reduceRight((s,a)=>s*x+a,0);}
function polyDeriv(c){return c.length<2?[0]:c.slice(1).map((a,i)=>a*(i+1));}

/* 6장: 두 변 u, v가 초당 du, dv씩 자라는 직사각형. dt초 동안의 넓이 변화를 세 조각으로 나눈다. */
function productRect(u,v,du,dv,dt){
 const a=u*dv*dt,b=v*du*dt,c=du*dv*dt*dt;
 return {area:u*v,stripU:a,stripV:b,corner:c,delta:a+b+c,avg:dt?(a+b+c)/dt:NaN,rule:u*dv+v*du,wrong:du*dv};
}
/* 몫의 규칙 (u/v)′ = (u′v − uv′)/v² */
function quotientRule(u,v,du,dv){return (du*v-u*dv)/(v*v);}

/* 7장: 안쪽 함수 g와 바깥 함수 f. 식 문자열은 화면 표시에 쓴다. */
const INNER={
 lin:{name:'u = 3x + 1',g:x=>3*x+1,d:()=>3,ds:'3'},
 sq:{name:'u = x²',g:x=>x*x,d:x=>2*x,ds:'2x'},
 half:{name:'u = x/2',g:x=>x/2,d:()=>0.5,ds:'1/2'}
};
const OUTER={
 sq:{name:'y = u²',f:u=>u*u,d:u=>2*u,ds:'2u'},
 cube:{name:'y = u³',f:u=>u**3,d:u=>3*u*u,ds:'3u²'},
 sin:{name:'y = sin u',f:Math.sin,d:Math.cos,ds:'cos u'},
 exp:{name:'y = eᵘ',f:Math.exp,d:Math.exp,ds:'eᵘ'}
};
function chainAt(inner,outer,x){
 const I=INNER[inner],O=OUTER[outer],u=I.g(x),gu=I.d(x),fu=O.d(u);
 return {u,y:O.f(u),inner:gu,outer:fu,product:fu*gu,wrong:O.d(x)*gu,numeric:numDiff(t=>O.f(I.g(t)),x)};
}
/* 풍선: 반지름 r(t) = r0 + rate·t (cm), 부피 V = 4/3·πr³ (cm³). dV/dt = 4πr² · dr/dt. */
function balloon(t,rate,r0=2){
 const r=r0+rate*t,sphere=x=>4/3*Math.PI*x**3,dVdr=4*Math.PI*r*r;
 return {r,V:sphere(r),dVdr,drdt:rate,dVdt:dVdr*rate,next:sphere(r+rate)-sphere(r)};
}
/* 반지름이 dr만큼 늘 때 실제로 늘어난 부피와 겉넓이 × 두께 어림 */
function shell(r,dr){const exact=4/3*Math.PI*((r+dr)**3-r**3),approx=4*Math.PI*r*r*dr;return {exact,approx,error:exact-approx,rel:exact?(exact-approx)/exact:0};}

/* 8장: 밑이 a인 지수함수. 도함수는 aˣ·ln a이므로 f′/f = ln a로 x와 무관하다. */
function expBase(a,x){const f=a**x,k=Math.log(a);return {f,d:f*k,ratio:k,numeric:numDiff(t=>a**t,x)};}
/* 단위원 위의 점. 각도 theta(라디안)가 1만큼 늘 때 높이 sin은 cos만큼, 가로 cos은 −sin만큼 변한다. */
function circlePoint(theta){return {x:Math.cos(theta),y:Math.sin(theta),dy:Math.cos(theta),dx:-Math.sin(theta),deg:theta*180/Math.PI,perDegree:Math.cos(theta)*Math.PI/180};}
/* 낙하산을 편 뒤의 속도 v(t) = −vT(1 − e^(−t/τ)), 가속도 a(t) = −(vT/τ)e^(−t/τ). vT = 8 m/s, τ = 0.8초이면 a(0) = −10. */
const CHUTE={vT:8,tau:0.8};
function chute(t){const e=Math.exp(-t/CHUTE.tau);return {v:-CHUTE.vT*(1-e),a:-CHUTE.vT/CHUTE.tau*e};}
/* 발사각 θ(도)로 쏜 로켓의 수평 도달 거리 R = (v²/g)·sin 2θ (m). 공기 저항 없음, 평지. */
function launchRange(deg){const th=deg*Math.PI/180,k=V0*V0/G;return {R:k*Math.sin(2*th),dRdTheta:2*k*Math.cos(2*th),dRdDeg:2*k*Math.cos(2*th)*Math.PI/180};}
/* 시그모이드와 그 도함수 σ(1 − σ) */
function sigmoid(x){const s=1/(1+Math.exp(-x));return {s,d:s*(1-s)};}

/* 10장: 가로 a, 세로 b (cm)인 종이의 네 귀퉁이에서 한 변 x인 정사각형을 잘라 접은 뚜껑 없는 상자. */
function box(x,a=30,b=30){
 const w=a-2*x,l=b-2*x;
 return {x,w,l,V:x*w*l,dV:a*b-4*(a+b)*x+12*x*x,d2V:-4*(a+b)+24*x,max:Math.min(a,b)/2};
}
function boxBest(a=30,b=30){const x=((a+b)-Math.sqrt(a*a-a*b+b*b))/6;return {...box(x,a,b),other:((a+b)+Math.sqrt(a*a-a*b+b*b))/6};}

/* 11장: 접선 L(x) = f(a) + f′(a)(x − a)로 어림한 값과 실제 값. */
const APPROX={
 sqrt:{name:'√x, 기준점 a = 25',f:Math.sqrt,d:x=>1/(2*Math.sqrt(x)),a:25,dom:[9,49],range:[2.5,7.5],x:'x',step:0.5},
 rocket:{name:'로켓 높이 h(t), 기준점 a = 1초',f:rocket.h,d:rocket.v,a:1,dom:[0,2.4],range:[0,26],x:'t (초)',step:0.05},
 exp:{name:'eˣ, 기준점 a = 0',f:Math.exp,d:Math.exp,a:0,dom:[-1.5,1.5],range:[-0.6,4.6],x:'x',step:0.05}
};
function linearApprox(id,x){const A=APPROX[id],L=A.f(A.a)+A.d(A.a)*(x-A.a),f=A.f(x);return {L,f,error:L-f,slope:A.d(A.a),base:A.f(A.a)};}
/* 뉴턴 방법 x ← x − f(x)/f′(x). f′가 0이면 멈추고 stopped에 걸음 번호를 적는다. */
const NEWTON={
 rocket12:{name:'20t − 5t² = 12 (로켓이 12 m를 지나는 시각)',f:t=>20*t-5*t*t-12,d:t=>20-10*t,dom:[0,4],range:[-14,10],x:'t (초)',roots:[2-Math.sqrt(1.6),2+Math.sqrt(1.6)]},
 sqrt2:{name:'x² − 2 = 0 (√2 구하기)',f:x=>x*x-2,d:x=>2*x,dom:[0,4],range:[-3,14],x:'x',roots:[Math.SQRT2]},
 cycle:{name:'x³ − 2x + 2 = 0 (시작점 0이면 되돌아옴)',f:x=>x**3-2*x+2,d:x=>3*x*x-2,dom:[-2.5,2],range:[-6,8],x:'x',roots:[-1.7692923542386314]}
};
function newton(id,x0,steps){
 const N=NEWTON[id],xs=[x0];let stopped=-1;
 for(let i=0;i<steps;i++){const x=xs[i],d=N.d(x);if(Math.abs(d)<1e-12){stopped=i;break;}xs.push(x-N.f(x)/d);}
 const last=xs[xs.length-1];
 return {xs,stopped,last,residual:N.f(last),converged:stopped<0&&Math.abs(N.f(last))<1e-6};
}

/* 12장: 부피 vol (cm³ = mL)인 원기둥 캔. 뚜껑·바닥의 재료 값이 옆면의 k배일 때 비용 넓이 S = k·2πr² + 2πrh. */
function can(r,k=1,vol=330){
 const h=vol/(Math.PI*r*r),ends=2*Math.PI*r*r,side=2*vol/r;
 return {r,h,ends,side,area:ends+side,cost:k*ends+side,dCost:4*Math.PI*k*r-2*vol/(r*r),d2Cost:4*Math.PI*k+4*vol/r**3,ratio:h/(2*r)};
}
function canBest(k=1,vol=330){return can(Math.cbrt(vol/(2*Math.PI*k)),k,vol);}

/* 확인 문제 보기 순서: 화면 자리 k에 원래 보기 번호를 돌려 놓아 정답이 target 자리에 오게 한다. */
function quizOrder(n,answer,target){return Array.from({length:n},(_,k)=>((answer-target+k)%n+n)%n);}

const DVMath={rocket,avgRate,numDiff,shrinkTable,LIMITS,limitProbe,FUNCS,shapeAt,classify,powerPieces,polyEval,polyDeriv,productRect,quotientRule,INNER,OUTER,chainAt,balloon,shell,expBase,circlePoint,CHUTE,chute,launchRange,sigmoid,box,boxBest,APPROX,linearApprox,NEWTON,newton,can,canBest,quizOrder};
if(typeof module!=='undefined')module.exports=DVMath;else root.DVMath=DVMath;
})(typeof window!=='undefined'?window:globalThis);
