/* 이 책의 모든 계산. 화면 코드는 없다. 브라우저에서는 window.ELMath, 검사에서는 같은 파일을 vm으로 읽는다.
   카페·음료·재료 값·민준의 취향 가중치는 이 책을 위해 지어낸 것이다. 벡터는 [샷(잔), 우유(100 mL), 시럽(펌프)] 순서다. */
window.ELMath=(()=>{
'use strict';
const AXES=['샷','우유','시럽'],UNITS=['잔','×100 mL','펌프'];
const DRINKS=[
 {id:'espresso',name:'에스프레소',v:[1,0,0]},
 {id:'americano',name:'아메리카노',v:[2,0,0]},
 {id:'latte',name:'라테',v:[2,2,0]},
 {id:'vanilla',name:'바닐라라테',v:[2,2,2]},
 {id:'flat',name:'플랫화이트',v:[3,1,0]},
 {id:'steamer',name:'바닐라우유',v:[0,3,2]}
];
const drink=id=>DRINKS.find(d=>d.id===id);
/* 재료 한 단위마다의 값(이 책이 정한 값). 행 하나가 가중합 하나다. */
const RATES={cost:{name:'원가',unit:'원',w:[500,300,100]},kcal:{name:'열량',unit:'kcal',w:[5,65,20]},caff:{name:'카페인',unit:'mg',w:[75,0,0]}};
const MENU=[RATES.cost.w,RATES.kcal.w,RATES.caff.w];
/* 민준의 취향 뉴런(5장)과 2층 신경망(13·14장). */
const TASTE={w:[1,0.5,-1],b:-1.5};
const NET={W1:[[1,-0.5,0],[0,0.5,1]],b1:[-0.5,-1],hidden:['진한 맛','단맛'],w2:[2,-1],b2:-0.5};
const NEWDRINK={name:'신메뉴',v:[3,2,1]};

/* ── 벡터 ── */
const add=(a,b)=>a.map((x,i)=>x+b[i]);
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const scale=(a,k)=>a.map(x=>x*k);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const norm=a=>Math.sqrt(dot(a,a));
const dist=(a,b)=>norm(sub(a,b));
/* 영벡터가 끼면 방향이 없으므로 null. */
function cosine(a,b){const n=norm(a)*norm(b);return n<1e-12?null:Math.max(-1,Math.min(1,dot(a,b)/n));}
function angleDeg(a,b){const c=cosine(a,b);return c===null?null:Math.acos(c)*180/Math.PI;}
function nearest(v,skip){let best=null;for(const d of DRINKS){if(d.id===skip)continue;const r=dist(v,d.v);if(!best||r<best.d)best={drink:d,d:r};}return best;}
const same=(a,b,eps=1e-9)=>a.length===b.length&&a.every((x,i)=>Math.abs(x-b[i])<eps);
const matchDrink=v=>DRINKS.find(d=>same(d.v,v))||null;

/* ── 행렬 ── 행렬은 행의 배열이다. */
const shape=M=>[M.length,M[0].length];
const matVec=(M,v)=>M.map(r=>dot(r,v));
const transpose=M=>M[0].map((_,j)=>M.map(r=>r[j]));
function matMul(A,B){
 if(A[0].length!==B.length)throw new Error(`모양이 맞지 않습니다: (${shape(A)}) × (${shape(B)})`);
 const Bt=transpose(B);return A.map(r=>Bt.map(c=>dot(r,c)));
}
const identity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j)));
const lerpMat=(A,B,t)=>A.map((r,i)=>r.map((x,j)=>x+(B[i][j]-x)*t));
const column=(M,j)=>M.map(r=>r[j]);
function det3(M){const [[a,b,c],[d,e,f],[g,h,i]]=M;return a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);}
const det2=M=>M[0][0]*M[1][1]-M[0][1]*M[1][0];
/* 3×3 역행렬(여인수). 행렬식이 0에 가까우면 null. */
function inv3(M){
 const d=det3(M);if(Math.abs(d)<1e-9)return null;
 const [[a,b,c],[e,f,g],[h,i,j]]=M;
 const C=[[f*j-g*i,c*i-b*j,b*g-c*f],[g*h-e*j,a*j-c*h,c*e-a*g],[e*i-f*h,b*h-a*i,a*f-b*e]];
 return C.map(r=>r.map(x=>x/d));
}
/* 랭크: 행 사다리꼴로 줄였을 때 남는 0 아닌 행의 수. */
function rank(M,eps=1e-9){
 const A=M.map(r=>r.slice()),rows=A.length,cols=A[0].length;let r=0;
 for(let c=0;c<cols&&r<rows;c++){
  let p=r;for(let i=r+1;i<rows;i++)if(Math.abs(A[i][c])>Math.abs(A[p][c]))p=i;
  if(Math.abs(A[p][c])<eps)continue;
  [A[r],A[p]]=[A[p],A[r]];
  for(let i=r+1;i<rows;i++){const k=A[i][c]/A[r][c];for(let j=c;j<cols;j++)A[i][j]-=k*A[r][j];}
  r++;
 }
 return r;
}
const rotZ=deg=>{const t=deg*Math.PI/180,c=Math.cos(t),s=Math.sin(t);return [[c,-s,0],[s,c,0],[0,0,1]];};
const rotX=deg=>{const t=deg*Math.PI/180,c=Math.cos(t),s=Math.sin(t);return [[1,0,0],[0,c,-s],[0,s,c]];};
/* 7·8장의 변환 보기. 숫자는 이 책이 고른 예다. */
const TRANSFORMS={
 identity:{name:'그대로 두기',M:identity(3)},
 grow:{name:'모든 방향 1.5배',M:[[1.5,0,0],[0,1.5,0],[0,0,1.5]]},
 stretch:{name:'샷 축만 2배',M:[[2,0,0],[0,1,0],[0,0,1]]},
 turn:{name:'시럽 축 둘레로 90° 돌리기',M:rotZ(90)},
 shear:{name:'우유만큼 샷 쪽으로 밀기',M:[[1,1,0],[0,1,0],[0,0,1]]},
 flatten:{name:'시럽 축을 0으로 눌러 납작하게',M:[[1,0,0],[0,1,0],[0,0,0]]},
 flip:{name:'샷 축 뒤집기',M:[[-1,0,0],[0,1,0],[0,0,1]]}
};

/* ── 가중합·뉴런·층 ── */
const terms=(w,x)=>w.map((wi,i)=>wi*x[i]);
const relu=x=>Math.max(0,x);
const sigmoid=x=>1/(1+Math.exp(-x));
const step=x=>x>0?1:0;
const ACT={none:x=>x,step,relu,sigmoid};
function neuron(w,b,x,act='none'){const z=dot(w,x)+b;return {z,out:ACT[act](z)};}
function layer(W,b,x,act='relu'){const z=add(matVec(W,x),b);return {z,out:z.map(ACT[act])};}
function forward(x,net=NET){const h=layer(net.W1,net.b1,x,'relu'),y=dot(net.w2,h.out)+net.b2;return {z1:h.z,h:h.out,y};}
/* 여러 음료를 한꺼번에: X(음료 수×3) · Wᵀ(3×출력 수) + b. */
function batch(X,W,b){return matMul(X,transpose(W)).map(r=>add(r,b));}

/* ── 야코비안(13장) ── ReLU 층 h=ReLU(W x+b)의 야코비안은 꺼진 뉴런의 행을 0으로 만든 W다. */
function layerJacobian(W,b,x){const z=add(matVec(W,x),b);return W.map((r,i)=>r.map(v=>z[i]>0?v:0));}
/* 점수 y의 입력에 대한 기울기 = w2ᵀ·J (행벡터). */
function scoreGradient(x,net=NET){const J=layerJacobian(net.W1,net.b1,x);return transpose(J).map(col=>dot(col,net.w2));}
function numericGradient(f,x,h=1e-6){return x.map((_,i)=>{const p=x.slice(),m=x.slice();p[i]+=h;m[i]-=h;return (f(p)-f(m))/(2*h);});}

/* ── 고유 방향(12장): 2×2 실수 고윳값 ── */
function eig2(M){
 const tr=M[0][0]+M[1][1],d=det2(M),disc=tr*tr-4*d;
 if(disc<-1e-12)return {real:false,values:[],vectors:[]};
 const s=Math.sqrt(Math.max(disc,0)),values=[(tr+s)/2,(tr-s)/2];
 const vectors=values.map(l=>{let v=Math.abs(M[0][1])>1e-12?[M[0][1],l-M[0][0]]:Math.abs(M[1][0])>1e-12?[l-M[1][1],M[1][0]]:(Math.abs(l-M[0][0])<1e-12?[1,0]:[0,1]);const n=norm(v);v=scale(v,1/n);return v[0]<0||(v[0]===0&&v[1]<0)?scale(v,-1):v;});
 return {real:true,values,vectors};
}
function powers(M,v,n){const out=[v];for(let i=0;i<n;i++)out.push(matVec(M,out[i]));return out;}
const REPEAT={
 regulars:{name:'단골 이동표',M:[[0.9,0.3],[0.1,0.7]],start:[50,50],labels:['라테 단골','아메리카노 단골']},
 grow:{name:'길이를 늘리는 행렬',M:[[1,0.2],[0.2,1]],start:[1,0],labels:['첫째 칸','둘째 칸']},
 shrink:{name:'길이를 줄이는 행렬',M:[[0.5,0.2],[0.2,0.5]],start:[1,0],labels:['첫째 칸','둘째 칸']}
};

/* ── 텐서(10장): 중첩 배열과 모양 ── */
function tensorShape(T){const s=[];let t=T;while(Array.isArray(t)){s.push(t.length);t=t[0];}return s;}
const count=s=>s.reduce((a,b)=>a*b,1);
/* 모양 s인 텐서를 값 함수 f(i,j,k)로 채운다(3축). */
function fill3(s,f){return Array.from({length:s[0]},(_,i)=>Array.from({length:s[1]},(_,j)=>Array.from({length:s[2]},(_,k)=>f(i,j,k))));}
/* 3축 텐서를 축 하나를 따라 더한다. 결과는 2축(행렬)이다. */
function sumAxis(T,axis){
 const [a,b,c]=tensorShape(T);
 if(axis===0)return Array.from({length:b},(_,j)=>Array.from({length:c},(_,k)=>T.reduce((s,m)=>s+m[j][k],0)));
 if(axis===1)return Array.from({length:a},(_,i)=>Array.from({length:c},(_,k)=>T[i].reduce((s,r)=>s+r[k],0)));
 return Array.from({length:a},(_,i)=>Array.from({length:b},(_,j)=>T[i][j].reduce((s,x)=>s+x,0)));
}
const dropAxis=(s,axis)=>s.filter((_,i)=>i!==axis);
/* 이틀치 주문 기록(지어낸 값): 축은 [날, 음료, 재료]. 하루에 팔린 잔 수 × 레시피. */
const SOLD=[[4,10,12,6,5,3],[2,14,9,8,4,6]];
function orders(days=2,drinks=6){return fill3([days,drinks,3],(i,j,k)=>SOLD[i][j]*DRINKS[j].v[k]);}
/* 행렬 곱 모양 규칙: (m×n)(p×q)는 n=p일 때만 되고 결과는 m×q, 곱셈 횟수는 m·n·q. */
function mulShape(a,b){return a[1]===b[0]?{ok:true,shape:[a[0],b[1]],mults:a[0]*a[1]*b[1]}:{ok:false,inner:[a[1],b[0]]};}

/* ── 되돌리기(11장) ── */
const OUTPUTS={
 full:{name:'원가·열량·카페인',rows:['원가','열량','카페인'],M:MENU},
 double:{name:'원가·원가의 2배·열량',rows:['원가','원가×2','열량'],M:[RATES.cost.w,scale(RATES.cost.w,2),RATES.kcal.w]},
 same:{name:'원가·원가의 2배·원가의 3배',rows:['원가','원가×2','원가×3'],M:[RATES.cost.w,scale(RATES.cost.w,2),scale(RATES.cost.w,3)]}
};
/* 같은 출력을 내는 다른 레시피를 찾는다: M·n=0인 방향 n(행 두 개의 외적). 랭크 3이면 null. */
function nullDirection(M){
 if(rank(M)===3)return null;
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){const n=cross(M[i],M[j]);if(norm(n)>1e-9&&norm(matVec(M,n))<1e-6*norm(n)*1000)return scale(n,1/Math.max(...n.map(Math.abs)));}
 /* 랭크 1: 한 행에 수직인 방향 하나. */
 const r=M.find(x=>norm(x)>1e-9),n=Math.abs(r[0])>1e-9?[-r[1],r[0],0]:[1,0,0];return scale(n,1/Math.max(...n.map(Math.abs)));
}
function recover(key,v){
 const M=OUTPUTS[key].M,y=matVec(M,v),inv=inv3(M),r=rank(M);
 if(inv)return {y,rank:r,det:det3(M),ok:true,x:matVec(inv,y)};
 const n=nullDirection(M),other=add(v,n);
 return {y,rank:r,det:det3(M),ok:false,dir:n,other,otherY:matVec(M,other)};
}
/* 확인 문제·표지 보기를 화면에서만 돌려 정답 자리가 고르게 오게 한다. */
function choiceOrder(n,answer,target){const order=[...Array(n).keys()],shift=((order.indexOf(answer)-target)%n+n)%n;return order.map((_,k)=>order[(k+shift)%n]);}
const round=(x,d=2)=>{const p=10**d,r=Math.round(x*p)/p;return Object.is(r,-0)?0:r;};
return {AXES,UNITS,DRINKS,drink,RATES,MENU,TASTE,NET,NEWDRINK,add,sub,scale,dot,norm,dist,cosine,angleDeg,nearest,same,matchDrink,shape,matVec,transpose,matMul,identity,lerpMat,column,det3,det2,inv3,rank,rotZ,rotX,TRANSFORMS,terms,relu,sigmoid,step,ACT,neuron,layer,forward,batch,layerJacobian,scoreGradient,numericGradient,eig2,powers,REPEAT,tensorShape,count,fill3,sumAxis,dropAxis,SOLD,orders,mulShape,OUTPUTS,nullDirection,recover,choiceOrder,round};
})();
