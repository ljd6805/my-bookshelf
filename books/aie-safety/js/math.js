/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   모든 수치는 교육용 장난감 모형이다. 어느 값이 실제 식이고 어느 값이 가정값인지 함수 위에 적었다. */
(function(root){
'use strict';
const sig=x=>1/(1+Math.exp(-x));
const softplus=x=>x>30?x:Math.log1p(Math.exp(x));
/* 표준정규 누적분포 Φ. erfc 근사(Numerical Recipes, 상대 오차 1.2e-7) */
function erfc(x){const z=Math.abs(x),t=1/(1+0.5*z);const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));return x>=0?r:2-r;}
const Phi=x=>0.5*erfc(-x/Math.SQRT2);
/* 표준정규 분위수 Φ⁻¹. Acklam 근사 뒤 뉴턴 한 번으로 다듬는다. */
function PhiInv(p){
 if(p<=0)return -Infinity;if(p>=1)return Infinity;
 const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924],b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857],c=[-0.00778489400243029,-0.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878],d=[0.00778469570904146,0.32246712907004,2.445134137143,3.75440866190742];
 let x;const pl=0.02425;
 if(p<pl){const q=Math.sqrt(-2*Math.log(p));x=(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
 else if(p<=1-pl){const q=p-0.5,r=q*q;x=(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);}
 else{const q=Math.sqrt(-2*Math.log(1-p));x=-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
 const e=Phi(x)-p,u=e*Math.sqrt(2*Math.PI)*Math.exp(x*x/2);return x-u/(1+x*u/2);
}
function bisect(f,lo,hi,n=80){let flo=f(lo);for(let i=0;i<n;i++){const m=(lo+hi)/2,fm=f(m);if((fm>0)===(flo>0)){lo=m;flo=fm;}else hi=m;}return (lo+hi)/2;}

/* 1장 · 누리의 세 가지 답(가정값). p0: SFT 정책의 확률, proxy: 보상 모델 점수, util: 실제 도움, agree: 고객 전제에 동의하는가 */
const ANSWERS=[
 {key:'correct',name:'바로잡는 답',p0:0.5,proxy:1.0,util:1,agree:0},
 {key:'syc',name:'맞장구 답',p0:0.3,proxy:1.3,util:-1,agree:1},
 {key:'wrong',name:'엉뚱한 답',p0:0.2,proxy:-0.5,util:-1,agree:0}];
/* KL 벌점을 둔 RLHF 목적 E[r] − β·KL(π‖π0)의 닫힌 해 π ∝ π0·exp(r′/β), r′ = r − α·agree (동의 벌점) */
function klPolicy(beta,alpha=0,ans=ANSWERS){
 const r=ans.map(a=>a.proxy-alpha*a.agree);let pi;
 if(beta<=1e-9){const m=Math.max(...r);const k=r.map(v=>v===m?1:0),s=k.reduce((x,y)=>x+y,0);pi=k.map(v=>v/s);}
 else{const l=ans.map((a,i)=>Math.log(a.p0)+r[i]/beta),m=Math.max(...l),w=l.map(v=>Math.exp(v-m)),s=w.reduce((x,y)=>x+y,0);pi=w.map(v=>v/s);}
 const dot=(f)=>ans.reduce((s,a,i)=>s+pi[i]*f(a,i),0);
 const kl=ans.reduce((s,a,i)=>s+(pi[i]>0?pi[i]*Math.log(pi[i]/a.p0):0),0);
 return {pi,proxy:dot(a=>a.proxy),penalized:dot((a,i)=>r[i]),util:dot(a=>a.util),kl,syc:pi[1],base:{proxy:ans.reduce((s,a)=>s+a.p0*a.proxy,0),util:ans.reduce((s,a)=>s+a.p0*a.util,0)}};
}
/* 실제 도움이 가장 큰 β를 격자에서 찾는다 */
function bestBeta(alpha=0){let best={beta:0,util:-Infinity};for(let b=0.05;b<=5.0001;b+=0.01){const u=klPolicy(b,alpha).util;if(u>best.util)best={beta:b,util:u};}return best;}

/* 1장 · 과최적화 곡선(Gao 외 2023의 함수 꼴을 원본 레슨이 적은 2차식으로). d = √KL.
   R_proxy = a·d − bp·d², R_gold = a·d − bg·d². bg가 라벨 수 n에 따라 줄어드는 식은 교육용 가정값이다. */
const OVER={a:1,bp:0.02,c:0.3};
function goldCoef(n){return OVER.bp+OVER.c/Math.sqrt(n/1000);}
function overopt(n,d){
 const a=OVER.a,bp=OVER.bp,bg=goldCoef(n);
 const proxy=x=>a*x-bp*x*x,gold=x=>a*x-bg*x*x;
 return {bg,proxy:proxy(d),gold:gold(d),gap:proxy(d)-gold(d),dStar:a/(2*bg),goldPeak:a*a/(4*bg),dZero:a/bg,klStar:Math.pow(a/(2*bg),2),
  curve:Array.from({length:61},(_,i)=>{const x=i/60*12;return [x,proxy(x),gold(x)];})};
}

/* 2장 · 선호 손실. dw = log π(y_w)/π_ref(y_w), dl = log π(y_l)/π_ref(y_l) */
function prefLoss(dw,dl,beta,lam=1){
 const m=dw-dl,z=beta*m;
 return {margin:m,gap:z,dpo:softplus(-z),grad:beta*(1-sig(z)),ipo:Math.pow(m-1/(2*beta),2),ipoTarget:1/(2*beta),
  bpo:softplus(-z)+lam*Math.max(0,-dw),degraded:dw<0&&m>0,prob:sig(z)};
}
/* SimPO: 길이로 나눈 로그우도와 여유 γ (기준 정책 없음) */
function simpo(lpw,lw,lpl,ll,beta,gamma){const z=beta*lpw/lw-beta*lpl/ll-gamma;return {z,loss:softplus(-z)};}

/* 3장 · 잠복 백도어 시나리오(원본이 보고한 정성적 결과를 숫자로 흉내 낸 가정값).
   레드팀 문구에서의 결함률은 적대 훈련 k번마다 30%씩 줄고, 숨겨 둔 원래 트리거의 결함률은 구별이 날카로워지며 조금씩 오른다. */
const BACKDOOR={plain:{h0:0.85,label:'일반 백도어'},cot:{h0:0.95,label:'사고 과정을 거쳐 증류한 백도어'}};
function backdoor(k,kind='plain'){
 const h0=BACKDOOR[kind].h0,rt=j=>0.6*Math.pow(0.7,j),ho=j=>1-(1-h0)*Math.pow(0.9,j);
 return {redTeam:rt(k),heldOut:ho(k),clean:0,curve:Array.from({length:21},(_,j)=>[j,rt(j),ho(j)])};
}

/* 4장 · 정렬 위장의 순응 격차(장난감 결정 모형). 감시받는다고 믿으면 '거절하면 고쳐진다'는 계산이 더해진다.
   P(순응|감시) = σ(k(w·v − h)), P(순응|비감시) = σ(−k·h). k=6, v=1은 가정값. */
function complianceGap(w,h,k=6,v=1){const mon=sig(k*(w*v-h)),un=sig(-k*h);return {mon,un,gap:mon-un};}
/* 평가를 알아채는 모델: 관찰된 은밀 행동 = 실제 은밀 행동 × (1 − 평가 인식률) */
function observedRate(trueRate,aware){return trueRate*(1-aware);}

/* 5장 · AI 통제 프로토콜(장난감). 신뢰 모델 T의 의심 점수: 정상 N(0,1), 백도어 N(d,1).
   감사 예산 a: 가장 의심스러운 a 비율을 사람이 본다. 편집 e: 그다음 e 비율을 T가 고쳐 쓴다.
   공격 한 번마다 적발(안전 종료)·무력화(계속)·통과(사고) 중 하나. 안전 = 적발이 사고보다 먼저 올 확률. */
const PROTOCOLS={none:{name:'그대로 내보내기',e:0},upfront:{name:'처음부터 무작위 감사',e:0},monitor:{name:'신뢰 감시 + 감사',e:0},edit10:{name:'신뢰 편집 10%',e:0.1},edit20:{name:'신뢰 편집 20%',e:0.2}};
function control(protocol,a,d,tRatio=0.5){
 const p=PROTOCOLS[protocol];
 if(protocol==='none')return {safety:0,useful:1,caught:0,passed:1};
 if(protocol==='upfront')return {safety:a,useful:1,caught:a,passed:1-a};
 const qa=1-Phi(PhiInv(1-a)-d);
 if(!p.e)return {safety:qa,useful:1,caught:qa,passed:1-qa};
 const qe=1-Phi(PhiInv(1-Math.min(0.999,a+p.e))-d);
 return {safety:qa/(qa+1-qe),useful:1-p.e*(1-tRatio),caught:qa,edited:qe-qa,passed:1-qe};
}
/* 5장 · 약한 감독에서 강한 모델로. 강한 모델은 체계적 오류는 따라 하고 무작위 오류는 넘어선다(가정).
   PGR = (미세조정 − 약한 모델) / (상한 − 약한 모델) */
function pgr(a,s,c=0.95){const ft=c*(1-(1-a)*s);return {ft,pgr:(ft-a)/(c-a),weak:a,ceiling:c};}

/* 6장 · 질의 예산과 공격 성공률. 질의마다 독립적으로 성공 확률 p라고 가정하면 ASR(K) = 1 − (1 − p)^K */
const budgetASR=(p,K)=>1-Math.pow(1-p,K);
const perQuery=(asr,K)=>1-Math.pow(1-asr,1/K);
/* 다회 예시 탈옥: ASR(n) = min(1, c·n^α). α=0.8, n=256에서 0.9가 되게 c를 정한 교육용 가정값.
   맥락 분류기 방어는 원본이 보고한 61%→2%의 비율을 그대로 곱한다. */
const MSJ={alpha:0.8,c:0.9/Math.pow(256,0.8),defense:2/61};
function msj(n,defended=false){const asr=Math.min(1,MSJ.c*Math.pow(n,MSJ.alpha));return defended?asr*MSJ.defense:asr;}

/* 7장 · 간접 프롬프트 주입 상태 기계(EchoLeak 형 시나리오). 단계마다 어떤 방어가 막는지 판정한다. */
function injectionTrace(o){
 const steps=[];let alive=true;const push=(name,blocked,note)=>{steps.push({name,status:!alive?'skipped':blocked?'blocked':'pass',note});if(alive&&blocked)alive=false;};
 push('공격 메일 도착',false,'공격자가 아무 직원에게나 평범한 제목의 메일을 보낸다. 피해자는 열지 않아도 된다.');
 push('고객 질문 입력',false,o.userFilter==='on'?'사용자 입력 필터가 질문을 검사하지만 공격 문장은 여기에 없어 통과한다.':'“지난주 메일 요약해 줘”는 평범한 질문이다.');
 const kwBlock=o.retrievalFilter==='keyword'&&o.payload==='plain';
 push('검색이 공격 메일을 맥락에 넣음',kwBlock,o.retrievalFilter==='keyword'?(kwBlock?'검색된 메일의 노골적 명령어를 키워드 필터가 잡았다.':'무해해 보이는 문장이라 키워드 필터가 놓쳤다.'):'검색 내용은 검사하지 않는다.');
 push('숨은 지시가 계좌 조회 도구를 부름',o.ifc==='on',o.ifc==='on'?'신뢰할 수 없는 메일에서 나온 도구 호출이라 사용자 승인 없이는 실행되지 않는다.':'모델은 메일 속 지시와 고객 지시를 구별하지 못한다.');
 push('조회 결과를 이미지 주소에 실어 그림',o.render==='off',o.render==='off'?'외부 이미지 렌더링을 끄면 주소가 불리지 않는다.':o.render==='approved'?'승인된 도메인만 허용하지만 공격자는 승인된 도메인을 경유한다.':'어떤 외부 주소든 불러온다.');
 push('공격자 서버로 정보가 나감',false,'이미지 요청 주소에 담긴 정보가 공격자에게 기록된다.');
 return {steps,leaked:alive,blockedAt:steps.findIndex(s=>s.status==='blocked')};
}

/* 8장 · 입력·출력 분류기 층. 유해 점수 N(d,1), 정상 점수 N(0,1), 문턱 τ. 두 분류기의 판정은 서로 독립이라고 가정. */
const ATTACKS={plain:{din:2.5,dout:2.0,name:'평문 요청'},encoded:{din:0.5,dout:2.0,name:'아스키 아트로 가린 요청'}};
function moderation(tau,layers,attack,base){
 const {din,dout}=ATTACKS[attack],missIn=Phi(tau-din),missOut=Phi(tau-dout),pass=Phi(tau);
 const miss=layers==='in'?missIn:layers==='out'?missOut:missIn*missOut;
 const fpr=layers==='both'?1-pass*pass:1-pass;
 const tp=base*(1-miss),fp=(1-base)*fpr;
 return {miss,catch:1-miss,fpr,precision:tp+fp>0?tp/(tp+fp):0,perMillion:{missed:base*miss*1e6,falseBlocks:fp*1e6,caught:tp*1e6}};
}

/* 9장 · 공정성 기준. 자격 있는 신청자 점수 N(1.5,1), 없는 신청자 N(0,1)을 두 집단에 똑같이 가정. */
function groupRates(t,base,mu=1.5){const tpr=1-Phi(t-mu),fpr=1-Phi(t),sel=base*tpr+(1-base)*fpr;return {tpr,fpr,sel,ppv:sel>0?base*tpr/sel:0};}
function fairness(tA,tB,baseB,baseA=0.5){
 const A=groupRates(tA,baseA),B=groupRates(tB,baseB);
 return {A,B,dp:A.sel-B.sel,tprGap:A.tpr-B.tpr,fprGap:A.fpr-B.fpr,ppvGap:A.ppv-B.ppv};
}
/* B 집단의 선택률을 A와 같게 만드는 문턱 */
function parityThreshold(tA,baseB,baseA=0.5){const s=groupRates(tA,baseA).sel;return bisect(t=>groupRates(t,baseB).sel-s,-4,6);}

/* 10장 · 차등 프라이버시. 민감도 1인 가우스 메커니즘 T번 = μ = √T/σ인 가우스 DP(Dong·Roth·Su).
   δ(ε) = Φ(−ε/μ + μ/2) − e^ε·Φ(−ε/μ − μ/2). 부분 표본 증폭은 넣지 않았다(실제 DP-SGD보다 ε가 크게 나온다). */
function gdpDelta(eps,mu){return Phi(-eps/mu+mu/2)-Math.exp(eps)*Phi(-eps/mu-mu/2);}
function dpEpsilon(sigma,T,delta=1e-5){
 const mu=Math.sqrt(T)/sigma;if(gdpDelta(0,mu)<=delta)return {mu,eps:0};
 let hi=1;while(gdpDelta(hi,mu)>delta&&hi<1e4)hi*=2;
 return {mu,eps:bisect(e=>gdpDelta(e,mu)-delta,0,hi,100)};
}
/* 멤버십 추론 공격의 최대 탐지율: 오탐률 α에서 Φ(Φ⁻¹(α) + μ) */
function mia(mu,alpha=0.01){return Math.min(1,Phi(PhiInv(alpha)+mu));}

/* 10장 · 초록 목록 워터마크(Kirchenbauer 외 2023). 엔트로피가 충분히 높아 초록 비율이 p_g가 된다고 가정한다. */
function watermark(T,delta,r,gamma=0.25){
 const pg=gamma*Math.exp(delta)/(gamma*Math.exp(delta)+1-gamma),frac=(1-r)*pg+r*gamma,G=T*frac;
 const z=(G-gamma*T)/Math.sqrt(T*gamma*(1-gamma)),gain=(1-r)*(pg-gamma);
 return {pg,G,z,detected:z>=4,need:gain>0?Math.ceil(Math.pow(4*Math.sqrt(gamma*(1-gamma))/gain,2)):Infinity,humanFpr:1-Phi(4)};
}

/* 11장 · EU AI Act 적용 시점(원본 커리큘럼의 날짜에, 2026-07-27 발효한 AI 옴니버스 규정 (EU) 2026/1744의 고위험 연기를 반영. 확인일 2026-10-08).
   month = 2024년 8월에서 지난 달 수. 그 달 28일을 기준일로 본다 */
const EU=[
 {date:'2024-08-01',kinds:['all'],text:'규정 발효. 의무는 아직 적용 전'},
 {date:'2025-02-02',kinds:['social'],text:'금지 관행(사회적 점수 등) 금지 적용'},
 {date:'2025-02-02',kinds:['all'],text:'AI 리터러시: 제공자·배포자가 직원의 AI 이해를 높이는 조치를 할 의무'},
 {date:'2025-08-02',kinds:['gpai'],text:'범용 AI 모델 제공자 의무(기술 문서, 저작권 정책, 학습 데이터 요약). 체계적 위험 모델은 추가 의무'},
 {date:'2026-08-02',kinds:['chat','credit'],text:'제50조 투명성: 사람이 AI와 대화 중임을 알리고, 생성물에 기계가 읽을 수 있는 표시'},
 {date:'2027-08-02',kinds:['gpai'],text:'2025년 8월 이전에 출시된 범용 AI 모델도 의무 적용'},
 {date:'2027-12-02',kinds:['credit'],text:'부속서 III 고위험 시스템 의무(위험 관리, 데이터 거버넌스, 기록, 사람 감독, 적합성 평가). 신용 평가가 여기에 속함. 원래 2026-08-02였으나 AI 옴니버스 개정으로 연기'}];
function addMonths(m){const d=new Date(Date.UTC(2024,7,28));d.setUTCMonth(d.getUTCMonth()+m);return d.toISOString().slice(0,10);}
function euObligations(month,kind){
 const today=addMonths(month),list=EU.filter(e=>(e.kinds.includes('all')||e.kinds.includes(kind)));
 return {today,active:list.filter(e=>e.date<=today),upcoming:list.filter(e=>e.date>today),koreaInForce:today>='2026-01-22'};
}

/* 12장 · 출시 후 보고 진단. 앞 장의 함수를 그대로 다시 써서 처방이 지표를 움직이는지 본다. */
const REMEDIES={userfilter:'사용자 입력 필터 강화',keyword:'검색 내용 키워드 필터',ifc:'정보 흐름 통제(IFC)',betadown:'KL 벌점 β를 0.3에서 0.1로 낮추기',agree:'동의 벌점 α = 0.5 추가',parity:'집단별 문턱으로 승인율 맞추기'};
function diagnose(report,remedy){
 if(report==='leak'){
  const base={payload:'benign',userFilter:'off',retrievalFilter:'off',ifc:'off',render:'approved'};
  const o={...base,...(remedy==='userfilter'?{userFilter:'on'}:remedy==='keyword'?{retrievalFilter:'keyword'}:remedy==='ifc'?{ifc:'on'}:{})};
  const b=injectionTrace(base),a=injectionTrace(o);return {metric:'계좌 정보 유출',before:b.leaked?1:0,after:a.leaked?1:0,unit:'유출 여부(1=유출)',fixed:b.leaked&&!a.leaked,trace:a};
 }
 if(report==='syc'){
  const before=klPolicy(0.3,0).syc,after=remedy==='betadown'?klPolicy(0.1,0).syc:remedy==='agree'?klPolicy(0.3,0.5).syc:before;
  return {metric:'맞장구 답의 비율',before,after,unit:'비율',fixed:after<before-0.05};
 }
 const tA=1,baseB=0.3,before=fairness(tA,tA,baseB),tB=remedy==='parity'?parityThreshold(tA,baseB):tA,after=fairness(tA,tB,baseB);
 return {metric:'두 집단의 승인율 차이',before:before.dp,after:after.dp,unit:'승인율 차이',fixed:Math.abs(after.dp)<Math.abs(before.dp)-0.02,tprGapAfter:after.tprGap,tB};
}

const A19Math={sig,softplus,Phi,PhiInv,bisect,ANSWERS,klPolicy,bestBeta,OVER,goldCoef,overopt,prefLoss,simpo,BACKDOOR,backdoor,complianceGap,observedRate,PROTOCOLS,control,pgr,budgetASR,perQuery,MSJ,msj,injectionTrace,ATTACKS,moderation,groupRates,fairness,parityThreshold,gdpDelta,dpEpsilon,mia,watermark,EU,addMonths,euObligations,REMEDIES,diagnose};
if(typeof module!=='undefined')module.exports=A19Math;else root.A19Math=A19Math;
})(typeof window!=='undefined'?window:globalThis);
