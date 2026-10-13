/* 자산배분 계산. DOM을 만지지 않으며 tests/math.test.cjs가 대표값·경계값·불변 조건을 검사한다.
   「금융과 투자 처음부터」 9권 「자산배분 · 상관으로 포트폴리오 위험을 계산하고 조건에 맞는 비중 찾기」의 계산 원본이다.
   책 사이 코드 의존을 두지 않는다(8권의 표준편차, 「벡터와 행렬」의 고윳값이 있어도 여기서 새로 쓴다).
   단위와 표기:
   - 비율·수익률·표준편차·비중은 소수다(0.18 = 18%). 화면에서 %로 바꾸고 소수 둘째 자리로 쓴다. 베타·샤프 비율은 소수 셋째~넷째 자리.
   - 금액은 만 원이다(1억 원 = 10,000만 원). 화면에서 “1억 2,511만 원”처럼 쓴다.
   - 반올림은 5에서 올림(round). −14.325% → −14.33%, −11.725% → −11.73%. 부동소수 오차는 1e-9만큼 밀어서 막는다.
   - 다섯 자산(새벽전자·누리200·해외주식 묶음·채권 묶음·현금)의 μ·σ·ρ는 미리 정한 가정이다(ASSETS, research V-0).
     예측이 아니며 실제 시장 자료에서 추정하지 않았다. 하린과 윤 씨, 12개월·4년 가상 자료, 위기 시나리오도 가상이다(ASSUME).
   - 시점에 묶인 실제 숫자(⏱)는 넷뿐이고 MARKET 한 곳에만 둔다. 연구 결과의 숫자는 등급과 함께 FACTS에 둔다.
   - 실제 계산(분산·고윳값·투자선·베타·매매 금액·켈리·위기 재계산)과 미리 정한 가정(ASSETS·ASSUME)을 구분한다.
     어느 결과도 권하는 비중이 아니다. 효율적 투자선·접점·풀이 예시의 비중은 V-0 가정에서 계산한 값이며 권하는 비중이 아니다. */
(function(root){
'use strict';
const CHECKED='2026-10-13';

/* 다섯 자산의 가정(미리 정한 가정 · 예측 아님 · 실제 시장 자료에서 추정하지 않음). 상관 순서: 새벽, 누리, 해외, 채권, 현금. */
const ASSETS={
 ids:['saebyeok','nuri','global','bond','cash'],
 names:['새벽전자','누리200','해외주식 묶음','채권 묶음','현금'],
 mu:[0.09,0.07,0.065,0.035,0.025],
 sigma:[0.35,0.18,0.16,0.06,0],
 corr:[
  [1,0.67,0.4,-0.1,0],
  [0.67,1,0.6,-0.2,0],
  [0.4,0.6,1,0,0],
  [-0.1,-0.2,0,1,0],
  [0,0,0,0,1]
 ],
 crisis:{stocks:0.9,stockBond:0.3},   // 위기 상관 가정: 주식끼리 0.9, 주식·채권 +0.3(σ는 평상시 그대로)
 risky:[true,true,true,false,false],   // 주식형(위험자산) 여부. IRP 한도 확인에 쓴다
 label:'미리 정한 가정 · 예측 아님 · 실제 시장 자료에서 추정하지 않음',
 weightsNote:'V-0 가정에서 계산한 값이며 권하는 비중이 아닙니다'
};

/* 가상의 사례(미리 정한 가상 시나리오). */
const ASSUME={
 assets:ASSETS,
 rf:0.025,                                         // 모형의 무위험 금리 = 현금의 기대수익
 diversify:{sigma:0.30,rho:0.3,ns:[1,2,5,10,30,Infinity]},   // 1장 본문 표
 four:{n:4,rho:0.5},                               // 2장 네 종목 같은 상관
 impossible:[[1,0.9,0.9],[0.9,1,-0.9],[0.9,-0.9,1]],  // 2장 “불가능한 상관 표”(L2 뒤에 여는 예제)
 grid:0.001,                                       // 4장 σ ≤ 8% 점을 찾는 격자 간격(0.1%p)
 frontierTarget:0.08, cashTarget:0.05,             // 4장 σ ≤ 8%에서 μ가 가장 큰 점, 접점 + 현금으로 σ 5%
 muShift:0.01,                                     // 4장 4.5절: 기대수익 1%p를 바꾸는 비교 예제
 months:{                                          // 5장 12개월 가상 월간 수익률(%). 새벽전자 = 누리200 × 1.3 + 작은 개별 움직임 + 0.2
  market:[2,-1,3,-4,1,5,-2,0,4,-3,2,1],
  stock:[3.8,-3.1,4.1,-3.0,0.5,7.7,-2.4,-0.8,6.4,-3.7,0.8,2.5]
 },
 mixes:[[0.8,0.1,0.1],[0.6,0.3,0.1],[0.4,0.5,0.1],[0.2,0.7,0.1]],   // 6장 주식(누리200)·채권·현금 배분표
 rebalance:{start:10000,target:0.6,band:0.05,stock:[0.30,-0.25,0.20,0.10],bond:[0.02,0.06,0.01,0.03]},  // 7장 1억 원 60/40, 4년 가상 경로
 kelly:{p:0.55,b:1,n:100,multiples:[0.5,1,2,3],streak:5,misread:0.05},   // 8장 동전 내기(계산 연습)
 continuous:{mu:0.07,r:0.025,sigma:0.18,wrongMu:[0.05,0.04]},          // 8장 8.5절 연속형 식(누리200 가정)
 crisisFour:{n:4,sigma:0.25,rho:[0.3,0.8]},                              // 9장 네 종목
 crisis6040:{normal:{s1:0.18,s2:0.06,rho:-0.2},crisis:{s1:0.30,s2:0.08,rho:0.5}},  // 9장 60/40 평상시와 위기
 yoon:{                                            // 마지막 과제의 윤 씨(가상, 55세, 은퇴까지 10년)
  age:55,yearsToRetire:10,total:30000,general:20000,irp:10000,
  scenario:[-0.50,-0.35,-0.30,0.02,0.025],         // 위기 시나리오 한 해 수익률(가정)
  lossLimit:4500,livingCost:3000,years:3,          // 조건 1: 손실 4,500만 원 이내, 조건 2: 생활비 연 3,000만 원 × 3년 = 9,000만 원 이상을 채권·현금으로
  plans:{                                          // 비중(새벽·누리·해외·채권·현금)과 IRP 1억 원 안(누리 펀드·해외 펀드·채권·현금, 만 원)
   A:{w:[0.30,0.30,0.20,0.10,0.10],irp:[0,4000,3000,2000,1000]},
   B:{w:[0.05,0.20,0.20,0.40,0.15],irp:[0,3000,3000,4000,0]}
  }
 }
};

/* 시점에 묶인 실제 값(⏱)은 이 넷뿐이다. 바뀌면 같은 커밋에서 이 표, 화면 꼬리표, 마지막 과제 (라)를 함께 고친다. */
const MARKET={
 pensionLimit:{value:0.70,timeSensitive:true,checked:'2026-10-13',reported:'2026-06-23',grade:'보도',source:'S13',
  label:'보도 기준 · 법령 원문 확인 못함',note:'퇴직연금(DC·IRP) 위험자산 한도. 보도 시점(reported)에 완화 검토 중, 2026-08-12 보도(비즈니스워치)는 논의 중단으로 전함. 2026-10-13 G3 재확인(은재): 값 그대로'},
 tdfException:{value:true,timeSensitive:true,checked:'2026-10-13',reported:'2026-03-31',effective:'2026-04-01',grade:'보도',source:'S14',
  label:'보도 기준 · 법령 원문 확인 못함',note:'적격 TDF는 70% 한도의 예외(상품 이름은 쓰지 않는다)'},
 rf10y:{value:0.044,raw:0.04395,timeSensitive:true,checked:'2026-10-08',grade:'서재 안 재인용',source:'S22',label:'6권 확인값 · 서재 안 재인용'},
 erp:{value:0.049,raw:0.0487,timeSensitive:true,checked:'2026-01-05',grade:'서재 안 재인용',source:'S22',label:'6권 확인값 · 서재 안 재인용',note:'2026-10-13 G3 재확인(은재): Damodaran 국가별 표는 아직 2026-01-05 판, 한국 4.87% 그대로. 다음 판에서 바뀔 수 있음'},
 recheck:'한도와 금리는 바뀌므로 확인일을 보고 다시 확인하세요',
 nextRecheck:'2027-04-13'
};

/* 연구 결과와 보도의 숫자(시점에 묶이지 않음). 등급을 화면에 함께 적는다. */
const FACTS={
 tenStocks:{n:10,year:1968,grade:'2차 자료'},                       // Evans·Archer: 열 종목이면 충분
 statman:{borrow:30,lend:40,year:1987,grade:'2차 자료'},             // Statman: 30·40종목
 brinson:{explained:0.936,funds:91,years:[1974,1983],year:1986,grade:'전문가 단체 글'},
 ibbotson:{time:0.90,between:0.40,level:1.00,year:2000,balancedFunds:94,pensionFunds:58,grade:'전문가 단체 글'},   // 1986년 연구와 다른 자료(혼합형 펀드 94개, 연금 58곳)
 nuttall:{wrong:49,of:50,year:1998,grade:'전문가 단체 글'},
 vanguard:{monthlyTrades:1008,annualTrades:83,years:[1926,2009],year:2010,grade:'운용사 연구'},
 sixtyForty2022:{loss:0.17,since:1937,grade:'보도(미국 자료 인용)'},
 normalTail:0.023                                                     // 정규분포에서 μ − 2σ 아래로 떨어질 확률(약 2.3%)
};

function need(cond,msg){if(!cond)throw new RangeError(msg);}
function num(x,name){need(typeof x==='number'&&Number.isFinite(x),name+' must be a finite number');}
const round=(x,d)=>{const f=Math.pow(10,d);return Math.round(x*f+(x>=0?1e-9:-1e-9))/f;};
const pct=(x,d=2)=>round(x*100,d);
const sum=a=>a.reduce((s,x)=>s+x,0);
/* 만 원 금액을 “1억 2,511만 원”처럼 적는다(화면용, 만 원 단위 반올림). */
function wonText(man){num(man,'amount');const m=Math.round(Math.abs(man)),eok=Math.floor(m/1e4),rest=m%1e4,sign=man<0?'−':'';
 return sign+(eok?eok.toLocaleString('en-US')+'억'+(rest?' ':''):'')+(rest||!eok?rest.toLocaleString('en-US')+'만':'')+' 원';}
function checkWeights(w){need(Array.isArray(w)&&w.length>0,'need weights');w.forEach(x=>num(x,'weight'));need(Math.abs(sum(w)-1)<1e-9,'weights must add up to 1');}

/* ── 1장 ── 동일 비중 N종목, 각 σ, 모든 쌍 ρ: σₚ = √(σ²/N + (1 − 1/N)ρσ²). N = Infinity면 바닥 σ√ρ. */
function equalSigma(sigma,rho,n){
 num(sigma,'sigma');need(sigma>=0,'sigma must be ≥ 0');num(rho,'rho');need(n===Infinity||(Number.isInteger(n)&&n>=1),'n must be a whole number ≥ 1');
 need(rho>=-1/(n===Infinity?Infinity:Math.max(n-1,1))-1e-12||n===1,'rho below −1/(N − 1) is impossible');need(rho<=1,'rho must be ≤ 1');
 if(n===Infinity){need(rho>=0,'the floor needs rho ≥ 0');return sigma*Math.sqrt(rho);}
 return Math.sqrt(sigma*sigma/n+(1-1/n)*rho*sigma*sigma);
}

/* ── 2장 ── 공분산 = ρσᵢσⱼ, 공분산 행렬, wᵀΣw. 상관 행렬은 대칭·대각 1·|ρ| ≤ 1이고 고윳값이 모두 0 이상이어야 한다. */
function covariance(rho,s1,s2){num(rho,'rho');num(s1,'sigma');num(s2,'sigma');return rho*s1*s2;}
function covMatrix(sigma=ASSETS.sigma,corr=ASSETS.corr){
 need(corr.length===sigma.length&&corr.every(r=>r.length===sigma.length),'matrix size must match');
 return corr.map((row,i)=>row.map((r,j)=>r*sigma[i]*sigma[j]));
}
function matVec(m,v){return m.map(row=>sum(row.map((x,j)=>x*v[j])));}
function portVar(w,cov){need(w.length===cov.length,'weights and matrix size must match');return sum(w.map((x,i)=>x*matVec(cov,w)[i]));}
function portMu(w,mu=ASSETS.mu){return sum(w.map((x,i)=>x*mu[i]));}
function portSigma(w,cov=covMatrix()){return Math.sqrt(Math.max(0,portVar(w,cov)));}
/* 대칭 행렬의 고윳값·고유벡터(야코비 회전). 고윳값은 작은 것부터. */
function eigen(m){
 const n=m.length;need(n>0&&m.every(r=>r.length===n),'need a square matrix');
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){num(m[i][j],'entry');need(Math.abs(m[i][j]-m[j][i])<1e-12,'matrix must be symmetric');}
 const a=m.map(r=>r.slice()),v=m.map((r,i)=>r.map((_,j)=>i===j?1:0));
 for(let sweep=0;sweep<100;sweep++){
  let off=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)off+=a[i][j]*a[i][j];if(off<1e-24)break;
  for(let p=0;p<n;p++)for(let q=p+1;q<n;q++){
   if(Math.abs(a[p][q])<1e-300)continue;
   const th=(a[q][q]-a[p][p])/(2*a[p][q]),t=Math.sign(th||1)/(Math.abs(th)+Math.sqrt(th*th+1)),c=1/Math.sqrt(t*t+1),s=t*c;
   for(let k=0;k<n;k++){const akp=a[k][p],akq=a[k][q];a[k][p]=c*akp-s*akq;a[k][q]=s*akp+c*akq;}
   for(let k=0;k<n;k++){const apk=a[p][k],aqk=a[q][k];a[p][k]=c*apk-s*aqk;a[q][k]=s*apk+c*aqk;}
   for(let k=0;k<n;k++){const vkp=v[k][p],vkq=v[k][q];v[k][p]=c*vkp-s*vkq;v[k][q]=s*vkp+c*vkq;}
  }
 }
 const pairs=a.map((r,i)=>({value:r[i],vector:v.map(row=>row[i])})).sort((x,y)=>x.value-y.value);
 return {values:pairs.map(p=>p.value),vectors:pairs.map(p=>p.vector)};
}
/* 상관 표가 상관 행렬로 가능한지: 모양 검사 뒤 고윳값이 모두 0 이상(−1e-10 허용)인지 본다. 첫 고윳값의 몫 = 최대 ÷ N. */
function checkCorr(corr){
 const n=corr.length;need(n>=2&&corr.every(r=>r.length===n),'need a square table');
 for(let i=0;i<n;i++){need(Math.abs(corr[i][i]-1)<1e-12,'diagonal must be 1');for(let j=0;j<n;j++){num(corr[i][j],'rho');need(Math.abs(corr[i][j])<=1,'|rho| must be ≤ 1');}}
 const e=eigen(corr),min=e.values[0],max=e.values[n-1];
 return {ok:min>=-1e-10,values:e.values,min,max,maxShare:max/n,first:e.vectors[n-1],reason:min>=-1e-10?'모든 고윳값이 0 이상':'고윳값에 음수가 있어 상관 행렬이 될 수 없음'};
}
/* 같은 상관 ρ의 N×N 상관 행렬과 그 첫 고윳값의 식 1 + (N − 1)ρ. */
const equalCorr=(n,rho)=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:rho));
const firstEigen=(n,rho)=>1+(n-1)*rho;
/* 위기 상관 행렬: 주식끼리 stocks, 주식·채권 stockBond, 현금은 0. risky의 순서를 따른다. */
function crisisCorr(c=ASSETS.crisis,size=5){
 const kind=['s','s','s','b','c'].slice(0,size);
 return kind.map((a,i)=>kind.map((b,j)=>i===j?1:a==='c'||b==='c'?0:a==='s'&&b==='s'?c.stocks:c.stockBond));
}

/* ── 3장 ── 두 자산: μₚ = wμ₁ + (1 − w)μ₂, σₚ² = w²σ₁² + (1 − w)²σ₂² + 2w(1 − w)ρσ₁σ₂. */
function twoAsset(w,a,b,rho){
 num(w,'weight');num(rho,'rho');need(rho>=-1&&rho<=1,'rho must be between −1 and 1');
 const v=w*w*a.sigma*a.sigma+(1-w)*(1-w)*b.sigma*b.sigma+2*w*(1-w)*rho*a.sigma*b.sigma;
 return {w,mu:a.mu!=null?w*a.mu+(1-w)*b.mu:null,sigma:Math.sqrt(Math.max(0,v))};
}
/* 최소분산 비중 w* = (σ₂² − ρσ₁σ₂) ÷ (σ₁² + σ₂² − 2ρσ₁σ₂). longOnly면 0~1로 자른다. 분모가 0(같은 자산)이면 계산하지 않는다. */
function minVar2(s1,s2,rho,longOnly=true){
 const den=s1*s1+s2*s2-2*rho*s1*s2;need(den>1e-15,'the two assets move as one; no unique minimum');
 const w=(s2*s2-rho*s1*s2)/den;return longOnly?Math.min(1,Math.max(0,w)):w;
}
const asset=i=>({mu:ASSETS.mu[i],sigma:ASSETS.sigma[i]});

/* ── 4장 ── 샤프 비율, 접점 포트폴리오, 효율적 투자선(위험 자산 셋). */
function sharpe(mu,sigma,rf=ASSUME.rf){num(mu,'mu');num(sigma,'sigma');need(sigma>0,'sigma must be > 0');return (mu-rf)/sigma;}
function solve(m,b){
 const n=m.length,a=m.map((r,i)=>[...r,b[i]]);
 for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(a[r][c])>Math.abs(a[p][c]))p=r;need(Math.abs(a[p][c])>1e-15,'singular matrix');[a[c],a[p]]=[a[p],a[c]];
  for(let r=0;r<n;r++)if(r!==c){const f=a[r][c]/a[c][c];for(let k=c;k<=n;k++)a[r][k]-=f*a[c][k];}}
 return a.map((r,i)=>r[n]/r[i]);
}
const pick=(m,idx)=>idx.map(i=>idx.map(j=>m[i][j]));
const RISKY3=[1,2,3];   // 4장의 세 자산: 누리200·해외주식·채권
/* 부분집합마다 Σ⁻¹(μ − r_f) 또는 Σ⁻¹1을 풀고, longOnly면 비중이 모두 0 이상인 해만 남겨 목표(샤프 최대 또는 분산 최소)로 고른다. */
function bestSubset(idx,score,dir,longOnly){
 const cov=covMatrix(),mu=ASSETS.mu,n=idx.length;let best=null;
 for(let mask=1;mask<(1<<n);mask++){
  const sub=idx.filter((_,k)=>mask>>k&1);if(!longOnly&&sub.length<n)continue;
  const raw=solve(pick(cov,sub),sub.map(i=>dir==='tan'?mu[i]-ASSUME.rf:1)),tot=sum(raw);if(Math.abs(tot)<1e-15)continue;
  const ws=raw.map(x=>x/tot);if(longOnly&&ws.some(x=>x<-1e-12))continue;
  const w=idx.map(i=>{const k=sub.indexOf(i);return k<0?0:ws[k];}),full=ASSETS.ids.map((_,i)=>{const k=idx.indexOf(i);return k<0?0:w[k];});
  const s=portSigma(full),m=portMu(full),val=score(m,s);if(!best||val>best.val)best={w,mu:m,sigma:s,sharpe:sharpe(m,s),val};
 }
 return best;
}
function tangency(longOnly=true,idx=RISKY3){return bestSubset(idx,(m,s)=>sharpe(m,s),'tan',longOnly);}
function minVariance(longOnly=true,idx=RISKY3){return bestSubset(idx,(m,s)=>-s,'min',longOnly);}
/* σ ≤ target에서 μ가 가장 큰 점(공매도 없음, 격자 탐색). 세 자산 비중 합 1. */
function bestUnderSigma(target=ASSUME.frontierTarget,step=ASSUME.grid,idx=RISKY3){
 need(step>0&&step<=0.1,'step must be between 0 and 0.1');const n=Math.round(1/step),cov=covMatrix();let best=null;
 for(let i=0;i<=n;i++)for(let j=0;i+j<=n;j++){
  const w=[i/n,j/n,(n-i-j)/n],full=[0,0,0,0,0];idx.forEach((a,k)=>{full[a]=w[k];});
  const s=portSigma(full,cov);if(s>target+1e-12)continue;const m=portMu(full);if(!best||m>best.mu+1e-15)best={w,mu:m,sigma:s};
 }
 return best;
}
/* 효율적 투자선의 한 점: 목표 μ에서 분산이 가장 작은 비중(세 자산, 공매도 없음이면 선분 위의 이차식 최소). */
function frontierPoint(target,longOnly=true,idx=RISKY3){
 const mu=idx.map(i=>ASSETS.mu[i]),cov=pick(covMatrix(),idx);
 // 합 1·μ = target을 만족하는 직선 w = a + t·d (세 자산)
 const d=[mu[1]-mu[2],mu[2]-mu[0],mu[0]-mu[1]];need(Math.abs(mu[0]-mu[2])>1e-12,'need different expected returns');
 const a0=[(target-mu[2])/(mu[0]-mu[2]),0,(mu[0]-target)/(mu[0]-mu[2])];
 const qa=portVar(d,cov),qb=2*sum(d.map((x,i)=>x*matVec(cov,a0)[i]));let t=-qb/(2*qa),lo=-Infinity,hi=Infinity;
 if(longOnly){for(let i=0;i<3;i++){if(Math.abs(d[i])<1e-15){if(a0[i]<-1e-12)return null;continue;}const r=-a0[i]/d[i];if(d[i]>0)lo=Math.max(lo,r);else hi=Math.min(hi,r);}if(lo>hi+1e-12)return null;t=Math.min(hi,Math.max(lo,t));}
 const w=a0.map((x,i)=>x+t*d[i]);return {w,mu:target,sigma:Math.sqrt(Math.max(0,portVar(w,cov)))};
}
function frontier(points=21,longOnly=true,idx=RISKY3){
 const mu=idx.map(i=>ASSETS.mu[i]),lo=minVariance(longOnly,idx).mu,hi=longOnly?Math.max(...mu):lo+2*(Math.max(...mu)-lo),out=[];
 for(let k=0;k<points;k++){const p=frontierPoint(lo+(hi-lo)*k/(points-1),longOnly,idx);if(p)out.push(p);}
 return out;
}
/* 접점과 현금을 섞어 σ를 목표에 맞춘다. 샤프 비율은 그대로다. */
function cashMix(tan,target){num(target,'target');need(target>=0,'target must be ≥ 0');const share=target/tan.sigma;
 return {share,cash:1-share,mu:ASSUME.rf+share*(tan.mu-ASSUME.rf),sigma:target,sharpe:target>0?tan.sharpe:null};}
/* 4.5절: 한 자산의 기대수익만 바꿨을 때의 접점(μ를 잠시 바꿔 계산하고 되돌린다). */
function tangencyShift(assetIndex,delta){
 const keep=ASSETS.mu[assetIndex];ASSETS.mu[assetIndex]=keep+delta;try{return tangency(true);}finally{ASSETS.mu[assetIndex]=keep;}
}

/* ── 5장 ── 베타 = Cov(종목, 시장) ÷ Var(시장)(표본, n − 1). 회귀 기울기와 같다. */
function beta(market=ASSUME.months.market,stock=ASSUME.months.stock){
 need(Array.isArray(market)&&market.length===stock.length&&market.length>=3,'need two series of the same length (≥ 3)');[...market,...stock].forEach(x=>num(x,'return'));
 const n=market.length,mm=sum(market)/n,ms=sum(stock)/n;let c=0,vm=0,vs=0;
 for(let t=0;t<n;t++){c+=(market[t]-mm)*(stock[t]-ms);vm+=(market[t]-mm)**2;vs+=(stock[t]-ms)**2;}
 need(vm>0,'the market series has no variation');
 return {beta:c/vm,corr:c/Math.sqrt(vm*vs),cov:c/(n-1),varM:vm/(n-1),alpha:ms-(c/vm)*mm,n};
}
const capm=(rf,b,erp)=>{num(rf,'rf');num(b,'beta');num(erp,'premium');return rf+b*erp;};
/* V-0 가정의 베타·체계적 몫(= ρ²)·개별 표준편차. */
function riskSplit(rho=ASSETS.corr[0][1],s=ASSETS.sigma[0],sm=ASSETS.sigma[1]){const b=rho*s/sm,sys=(b*sm)**2/(s*s);return {beta:b,systematic:sys,idio:s*Math.sqrt(1-sys)};}

/* ── 6장 ── 주식(누리200)·채권·현금 배분. 현금은 σ 0이라 표준편차를 비례로 줄인다. μ − 2σ는 정규분포 어림. */
function mix(ws,wb,wc){checkWeights([ws,wb,wc]);const w=[0,ws,0,wb,wc],m=portMu(w),s=portSigma(w);return {w:[ws,wb,wc],mu:m,sigma:s,bad:m-2*s};}
/* 목표 σ에 맞는 주식 비중(채권과 현금의 비율은 고정, 현금 비중 cash). 최소분산보다 주식이 많은 쪽 근을 쓴다. */
function targetStock(target,cash=0){
 num(target,'target');need(cash>=0&&cash<1,'cash must be between 0 and 1');const s1=ASSETS.sigma[1],s2=ASSETS.sigma[3],r=ASSETS.corr[1][3],k=1-cash;
 const A=s1*s1+s2*s2-2*r*s1*s2,B=2*(r*s1*s2-s2*s2)*k,C=s2*s2*k*k-target*target,D=B*B-4*A*C;
 need(D>=0,'this target is below the minimum σ of the mix');const w=(-B+Math.sqrt(D))/(2*A);need(w<=k+1e-12,'this target is above the stock-only σ');
 return mix(w,k-w,cash);
}

/* ── 7장 ── 리밸런싱: 해마다 연말 비중을 보고 규칙대로 되돌린다. trade > 0이면 주식을 판 금액(만 원). */
function rebalance(rule='annual',o=ASSUME.rebalance){
 need(['none','annual','band'].includes(rule),'rule must be none, annual or band');need(o.stock.length===o.bond.length,'paths must have the same length');
 let s=o.start*o.target,b=o.start*(1-o.target);const rows=[];
 for(let y=0;y<o.stock.length;y++){
  s*=1+o.stock[y];b*=1+o.bond[y];const tot=s+b,weight=s/tot,drift=weight-o.target;
  const go=rule==='annual'||(rule==='band'&&Math.abs(drift)>o.band+1e-12),trade=go?s-o.target*tot:0;
  s-=trade;b+=trade;rows.push({year:y+1,weight,drift,trade,total:tot});
 }
 return {rule,rows,end:s+b};
}

/* ── 8장 ── 켈리 기준(계산 연습). 이기면 건 돈의 b배, 지면 건 돈을 잃는 내기. */
function kellyF(p,b){num(p,'p');num(b,'b');need(p>0&&p<1&&b>0,'need 0 < p < 1 and b > 0');return p-(1-p)/b;}
function growth(f,p,b){need(f>=0&&f<1,'f must be between 0 and 1');return p*Math.log(1+b*f)+(1-p)*Math.log(1-f);}
const medianMultiple=(f,p,b,n)=>Math.exp(n*growth(f,p,b));   // 이 책의 “중앙값” 배수 e^(n·g)(research V-8의 정의)
function binomPmf(n,p){const out=[];let lp=n*Math.log(1-p);out.push(Math.exp(lp));for(let k=1;k<=n;k++){lp+=Math.log((n-k+1)/k)+Math.log(p/(1-p));out.push(Math.exp(lp));}return out;}
/* n번 뒤 재산의 q 분위(이긴 횟수의 이항분포에서 누적 확률이 처음 q 이상이 되는 횟수). */
function wealthQuantile(f,p,b,n,q=0.1){const pm=binomPmf(n,p);let c=0;for(let k=0;k<=n;k++){c+=pm[k];if(c>=q-1e-12)return Math.pow(1+b*f,k)*Math.pow(1-f,n-k);}return Math.pow(1+b*f,n);}
/* n번 안에 한 번이라도 재산이 처음의 level배 아래(<)로 떨어진 경로의 비율(정확한 동적 계획법). */
function everBelow(f,p,b,n,level=0.5){
 need(f>0&&f<1,'f must be between 0 and 1');const lw=Math.log(1+b*f),ll=Math.log(1-f),lim=Math.log(level);let alive=new Map([[0,1]]),hit=0;
 for(let t=1;t<=n;t++){const next=new Map();
  for(const [k,pr] of alive)for(const [dk,q] of [[1,p],[0,1-p]]){const k2=k+dk,lv=k2*lw+(t-k2)*ll;if(lv<lim-1e-12)hit+=pr*q;else next.set(k2,(next.get(k2)||0)+pr*q);}
  alive=next;}
 return hit;
}
function kellyTable(o=ASSUME.kelly){
 const f0=kellyF(o.p,o.b);
 return o.multiples.map(m=>{const f=f0*m;return {multiple:m,f,g:growth(f,o.p,o.b),median:medianMultiple(f,o.p,o.b,o.n),low10:wealthQuantile(f,o.p,o.b,o.n,0.1),
  belowHalf:everBelow(f,o.p,o.b,o.n,0.5),streak:Math.pow(1-f,o.streak)};});
}
const kellyContinuous=(mu,r,sigma)=>{need(sigma>0,'sigma must be > 0');return (mu-r)/(sigma*sigma);};
/* 승률을 잘못 알았을 때: 믿은 승률로 계산한 f를 실제 승률의 켈리 비율과 견준다. */
function misread(believed,actual,b){const f=kellyF(believed,b),fa=kellyF(actual,b);return {f,actualKelly:fa,times:fa>0?f/fa:null,g:growth(Math.max(0,f),actual,b)};}

/* ── 9장 ── 같은 비중을 평상시와 위기 상관으로 다시 계산한다. */
function crisisSigma(w,corr=crisisCorr(),sigma=ASSETS.sigma){return portSigma(w,covMatrix(sigma,corr));}

/* ── 마지막 과제 ── 비중 다섯과 IRP 1억 원 안(만 원)을 받아 숫자와 두 조건, IRP 위험자산 비중을 계산한다. */
function riskContrib(w,cov=covMatrix()){const v=portVar(w,cov),mv=matVec(cov,w);need(v>0,'a zero-risk plan has no risk contributions');return w.map((x,i)=>x*mv[i]/v);}
function evaluatePlan(plan,y=ASSUME.yoon){
 const w=plan.w;checkWeights(w);w.forEach(x=>need(x>=0,'weights must be ≥ 0 (no short selling)'));
 const amount=w.map(x=>x*y.total),scen=sum(w.map((x,i)=>x*y.scenario[i])),lossPct=round(scen*100,2),loss=Math.round(scen*y.total+(scen<0?-1e-9:1e-9));
 const safe=amount[3]+amount[4],irp=plan.irp||null;let irpRisky=null,general=null;
 if(irp){need(irp.length===5&&irp[0]===0,'IRP holds funds, bonds and cash only (no single stock)');need(Math.abs(sum(irp)-y.irp)<1e-6,'IRP holdings must add up to the IRP balance');
  general=amount.map((a,i)=>a-irp[i]);need(general.every(g=>g>=-1e-6),'IRP cannot hold more of an asset than the plan has');need(Math.abs(sum(general)-y.general)<1e-6,'general account must add up to its balance');
  irpRisky=(irp[1]+irp[2])/y.irp;}
 const crisisEig=checkCorr(crisisCorr(undefined,4)).values;
 return {w,mu:portMu(w),sigma:portSigma(w),crisisSigma:crisisSigma(w),scenario:scen,lossPct,loss,safe,need:y.livingCost*y.years,
  cond1:-loss<=y.lossLimit,cond2:safe>=y.livingCost*y.years-1e-9,contrib:riskContrib(w),irpRisky,general,limitOk:irpRisky==null?null:irpRisky<=MARKET.pensionLimit.value+1e-12,crisisEig};
}

const assumptions={
 assets:'다섯 자산의 기대수익·표준편차·상관은 미리 정한 가정이며 실제 시장 자료에서 추정하지 않았다(예측 아님)',
 crisis:'위기 상관(주식끼리 0.9, 주식·채권 +0.3)과 위기 시나리오 수익률은 가정이다. “위기에는 상관이 1이 된다”는 사실이 아니다',
 normal:'μ − 2σ는 정규분포를 가정한 어림이다. 실제 꼬리는 더 두꺼울 수 있다',
 kelly:'켈리 계산은 승률과 배당을 안다고 놓은 계산 연습이며 계좌 비중을 정하는 도구로 쓰지 않는다. 이 책은 돈을 빌려 이 비율을 채우는 계산을 하지 않는다',
 rebalance:'4년 경로는 가상이고 매매 비용·세금은 넣지 않았다. 끝 금액의 순서는 이 경로에서만 성립한다',
 irp:'IRP는 개별 주식을 담지 않고 누리200 지수 펀드·해외주식 펀드와 채권·현금만 담는다고 정한 과제의 가정이다(원문 확인 전)',
 rounding:'반올림은 5에서 올린다(−14.325% → −14.33%). CAPM 10.82%는 베타를 1.31로 반올림해 계산한 값이다'
};
const api={CHECKED,ASSETS,ASSUME,MARKET,FACTS,assumptions,round,pct,wonText,checkWeights,equalSigma,covariance,covMatrix,portVar,portMu,portSigma,eigen,checkCorr,
 equalCorr,firstEigen,crisisCorr,twoAsset,minVar2,asset,sharpe,tangency,minVariance,bestUnderSigma,frontierPoint,frontier,cashMix,tangencyShift,beta,capm,riskSplit,
 mix,targetStock,rebalance,kellyF,growth,medianMultiple,wealthQuantile,everBelow,kellyTable,kellyContinuous,misread,crisisSigma,riskContrib,evaluatePlan};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.AMath=api;
})(typeof window!=='undefined'?window:globalThis);
