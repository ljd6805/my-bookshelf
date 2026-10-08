/* 실험에 쓰는 순수 계산 함수. DOM을 만지지 않으므로 tests/math.test.cjs로 검증한다.
   규칙의 출처는 원본 커리큘럼 rohitg00/ai-engineering-from-scratch Phase 0 레슨(확인일 2026-10-08)이고,
   시간·크기 같은 숫자 가정은 각 함수 위에 적었다. */
(function(root){
'use strict';
/* 1장: 경로별 사전 점검. 원본 verify.py의 경로 표(필수·선택)를 옮겼다. */
const ROUTES={
 beginner:{label:'입문 과정',required:['python','git'],optional:['node','npx','numpy','matplotlib','jupyter','torch','gpu','cargo','julia']},
 'ml-foundations':{label:'수학·ML 기초',required:['python','git','numpy'],optional:['matplotlib','jupyter','torch','gpu','julia']},
 agents:{label:'에이전트',required:['python','git'],optional:['node','npx','numpy','torch']},
 'agent-skills':{label:'에이전트 스킬',required:['python','git','node','npx'],optional:[]}
};
function preflight(route,missing){
 const r=ROUTES[route],gone=missing==='node'?['node','npx']:[missing];
 const required=r.required.map(k=>({key:k,ok:!gone.includes(k)}));
 const passed=required.filter(x=>x.ok).length,optionalMissing=r.optional.filter(k=>gone.includes(k)).length;
 return {label:r.label,required,passed,total:required.length,optionalCount:r.optional.length,optionalMissing,exit:passed===required.length?0:1};
}
/* 2장: 전역 설치와 가상 환경. 버전은 PyTorch 2.x의 둘째 자리(예: 4 = 2.4)로 적는다.
   전역 설치는 A를 깔고 B를 나중에 깔아 덮어쓴다고 가정한다. */
function resolveEnv({aMin,aMax,bPin,mode}){
 const common=[];for(let v=aMin;v<=aMax;v++)if(v===bPin)common.push(v);
 if(mode==='separate')return {mode,installedA:aMax,installedB:bPin,okA:true,okB:true,common};
 const installed=bPin;return {mode,installedA:installed,installedB:installed,okA:installed>=aMin&&installed<=aMax,okB:true,common};
}
/* 2장: 드라이버가 지원하는 CUDA와 PyTorch 빌드의 CUDA. 원본의 단순 규칙: 빌드 CUDA ≤ 드라이버 CUDA. */
function cudaCheck(driver,wheel){
 if(wheel==='cpu')return {runs:true,gpu:false,reason:'CPU용 빌드라 실행은 되지만 GPU를 쓰지 않습니다.'};
 const w=Number(wheel);
 if(driver==='none')return {runs:true,gpu:false,reason:'GPU 드라이버가 없어 CUDA를 쓸 수 없습니다. torch.cuda.is_available()은 False입니다.'};
 const d=Number(driver);
 return w<=d?{runs:true,gpu:true,reason:`빌드 CUDA ${w.toFixed(1)} ≤ 드라이버 CUDA ${d.toFixed(1)}이므로 GPU를 씁니다.`}:{runs:true,gpu:false,reason:`빌드 CUDA ${w.toFixed(1)}이 드라이버 CUDA ${d.toFixed(1)}보다 높아 GPU를 쓰지 못합니다.`};
}
/* 3장: 브랜치 병합. main에 base개 커밋이 있을 때 갈라진 뒤 main m개, experiment e개를 만든다. */
function gitMerge(base,m,e){
 const ff=m===0,total=base+m+e+(ff?0:1);
 return {type:ff?'fast-forward':'merge',mergeCommit:ff?0:1,logCount:total,mainBefore:base+m,expTip:base+e};
}
/* 3장: .gitignore 규칙을 0~4개 차례로 적용했을 때 커밋되는 파일. 크기(MB)는 교육용 가정값이다. */
const FILES=[
 {name:'train.py',mb:0.02,rule:99},{name:'pyproject.toml · uv.lock',mb:0.3,rule:99},
 {name:'.venv/ (가상 환경)',mb:800,rule:1},{name:'checkpoints/model.pt',mb:500,rule:2},
 {name:'data/reviews.csv',mb:84,rule:3},{name:'.env (API 키)',mb:0.001,rule:4}
];
const RULES=['규칙 없음','.venv/','*.pt *.safetensors','data/*.csv','.env'];
function ignoreRules(level){
 const kept=FILES.filter(f=>f.rule>level),ignored=FILES.filter(f=>f.rule<=level);
 const mb=kept.reduce((s,f)=>s+f.mb,0);
 return {kept,ignored,mb,secret:kept.some(f=>f.rule===4),rules:RULES.slice(1,level+1)};
}
/* 4장: 가중치 메모리 어림셈(10⁹ 바이트 = 1 GB). 원본 규칙: fp16은 파라미터당 2바이트.
   실행 여유 20%는 이 책의 가정값이며 학습용 기울기·옵티마이저 상태는 넣지 않았다. */
function vramFit(paramsB,bytes,vram,reserve=0.2){
 const weights=paramsB*bytes,need=weights*(1+reserve),maxB=vram/(bytes*(1+reserve));
 return {weights,need,fits:need<=vram,share:weights/vram,maxB};
}
/* 4장: 클라우드 GPU 비용. 원본 예: CPU 8시간 학습이 GPU 10분. 가격 범위 시간당 0.20~2.00달러. */
function cloudCost(price,runs,idle,runMin=10){
 const runH=runs*runMin/60,cost=price*(runH+idle);
 return {runH,idleH:idle,cost,runCost:price*runH,idleCost:price*idle,idleShare:cost?price*idle/cost:0,cpuH:runs*8};
}
/* 5장: 원격 학습을 띄우는 네 방법이 접속 끊김을 견디는가. 원본 표를 그대로 판정한다. */
const METHODS={fg:{survive:false,reattach:false,log:false},bg:{survive:false,reattach:false,log:false},nohup:{survive:true,reattach:false,log:true},tmux:{survive:true,reattach:true,log:true}};
function survive(method){
 const m=METHODS[method];
 const steps=[['학습 시작','ok'],['노트북 닫음 · SSH 끊김',m.survive?'ok':'dead'],['다시 접속',m.survive?'ok':'dead'],['진행 확인',m.reattach?'attach':m.log?'log':'dead']];
 return {...m,steps};
}
/* 5장: 권한 숫자 하나(0~7)를 rwx 세 비트로 읽는다. */
function rwx(d){return (d&4?'r':'-')+(d&2?'w':'-')+(d&1?'x':'-');}
function chmod(o,g,t,who){
 const digit={owner:o,group:g,other:t}[who];
 return {mode:`${o}${g}${t}`,text:'-'+rwx(o)+rwx(g)+rwx(t),canRead:!!(digit&4),canWrite:!!(digit&2),canExec:!!(digit&1)&&!!(digit&4),bits:rwx(digit)};
}
/* 6장: 도커 층 캐시. 바뀐 층부터 끝까지 다시 만든다. 초 단위 시간은 교육용 가정값이다. */
const LAYERS={base:['FROM 기본 이미지',120],apt:['RUN apt-get 시스템 도구',90],torch:['RUN pip PyTorch',300],reqs:['RUN pip 나머지 라이브러리',120],code:['COPY 코드',2]};
const ORDERS={good:['base','apt','torch','reqs','code'],bad:['base','apt','code','torch','reqs']};
function dockerBuild(changed,order){
 const seq=ORDERS[order],i=seq.indexOf(changed);
 const layers=seq.map((k,j)=>({key:k,name:LAYERS[k][0],sec:LAYERS[k][1],rebuilt:j>=i}));
 const sec=layers.filter(l=>l.rebuilt).reduce((s,l)=>s+l.sec,0),full=layers.reduce((s,l)=>s+l.sec,0);
 return {layers,sec,full,cached:layers.filter(l=>!l.rebuilt).length};
}
/* 7장: API 키 노출 판정. 키가 Git 기록에 들어가는가와 저장소를 누가 보는가를 곱해 판단한다. */
function keyLeak(storage,repo){
 const inHistory=storage==='literal'||storage==='tracked';
 const level=!inHistory||repo==='local'?0:repo==='private'?1:2;
 const action=['키를 그대로 써도 됩니다. .env가 계속 무시되는지만 확인합니다.','저장소 접근 권한이 있는 모든 사람이 키를 볼 수 있습니다. 키를 폐기하고 새로 발급하는 편이 안전합니다.','누구나 키를 볼 수 있습니다. 즉시 키를 폐기하고 새로 발급합니다. 기록 정리는 그다음입니다.'][level];
 return {inHistory,level,action};
}
/* 8장: 노트북 커널. 셀 1 x = 1, 셀 2 x = x + 1, 셀 3 y = x * 10을 주어진 순서로 실행한다. */
const CELLS={1:s=>{s.x=1;},2:s=>{if(s.x===undefined)throw 'x';s.x=s.x+1;},3:s=>{if(s.x===undefined)throw 'x';s.y=s.x*10;}};
function runCells(order){
 const s={};let error=null;
 for(const c of order){try{CELLS[c](s);}catch(e){error=`셀 ${c}에서 NameError: ${e}가 정의되지 않음`;}}
 return {x:s.x,y:s.y,error};
}
const SEQS={top:{run:[1,2,3],visible:[1,2,3]},twice:{run:[1,2,2,3],visible:[1,2,3]},early:{run:[3,1,2],visible:[1,2,3]},deleted:{run:[1,2,3],visible:[1,3]}};
function kernel(seq){
 const q=SEQS[seq],now=runCells(q.run),fresh=runCells(q.visible);
 return {run:q.run,visible:q.visible,now,fresh,same:now.y===fresh.y&&!now.error};
}
/* 9장: 시드로 섞어 70·10·20으로 나눈다(원본: test 0.2, 남은 것의 0.125를 검증). 시드 난수는 mulberry32. */
function rng(seed){let a=seed>>>0;return ()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function shuffle(n,seed){const r=rng(seed),a=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function split(n,seed){
 const a=shuffle(n,seed),nTest=Math.round(n*0.2),rest=a.slice(nTest),nVal=Math.round(rest.length*0.125);
 return {test:a.slice(0,nTest),val:rest.slice(0,nVal),train:rest.slice(nVal)};
}
function leak(n,oldSeed,newSeed){
 const o=split(n,oldSeed),nw=split(n,newSeed),train=new Set(o.train);
 const overlap=nw.test.filter(i=>train.has(i)).length;
 return {sizes:[nw.train.length,nw.val.length,nw.test.length],overlap,rate:overlap/nw.test.length};
}
/* 10장: 한 단계 시간(ms). 일꾼이 없으면 로딩과 계산이 이어지고, 있으면 미리 읽기가 계산과 겹친다고 가정한다. */
function stepTime(load,compute,workers){
 const loadEff=workers?load/workers:load,step=workers?Math.max(loadEff,compute):load+compute;
 return {loadEff,step,idle:step-compute,gpuUse:compute/step,bottleneck:loadEff>compute?'데이터 로딩':'계산'};
}
/* 10장: 손실 L = w² 에 경사하강 w ← w − η·2w 를 적용한다. 손실이 100을 넘는 첫 단계를 조건부 중단점으로 본다. */
function lossCurve(lr,steps=30,w0=1){
 const out=[];let w=w0,stop=-1;
 for(let t=0;t<=steps;t++){const L=w*w;out.push(L);if(stop<0&&L>100)stop=t;w=w-lr*2*w;}
 const f=Math.abs(1-2*lr),kind=f>=1?(f>1?'발산':'제자리'):lr>0.5?'출렁이며 수렴':lr<0.15?'느린 수렴':'수렴';
 return {loss:out,factor:f,kind,stop,final:out[steps]};
}
/* 11장: 확인 순서 전략과 원인까지 걸리는 시간. 분 단위 시간은 교육용 가정값이다. */
const CHECKS=[['사전 점검',3,'사전 점검'],['가상 환경·잠금 파일',5,'가상 환경'],['드라이버·CUDA 빌드',5,'CUDA'],['커밋·이미지 태그',3,'커밋·태그'],['분할·시드·누수',10,'분할·시드'],['구간별 시간·장치',15,'구간 시간'],['손실 곡선',20,'손실 곡선']];
const CAUSE={importfail:1,nocuda:2,acc99:4,slow:5};
const SYMPTOM={importfail:[1,0,2,3,4,5,6],nocuda:[2,1,0,3,4,5,6],acc99:[4,3,6,0,1,2,5],slow:[5,2,1,0,3,4,6]};
function triage(scenario,strategy){
 const order=strategy==='bottom'?[0,1,2,3,4,5,6]:strategy==='top'?[6,5,4,3,2,1,0]:SYMPTOM[scenario];
 const cause=CAUSE[scenario],k=order.indexOf(cause),path=order.slice(0,k+1);
 return {path:path.map(i=>CHECKS[i]),minutes:path.reduce((s,i)=>s+CHECKS[i][1],0),checks:k+1,cause:CHECKS[cause][0]};
}
const A01Math={ROUTES,preflight,resolveEnv,cudaCheck,gitMerge,FILES,ignoreRules,vramFit,cloudCost,survive,rwx,chmod,LAYERS,dockerBuild,keyLeak,runCells,kernel,rng,shuffle,split,leak,stepTime,lossCurve,CHECKS,triage};
if(typeof module!=='undefined')module.exports=A01Math;else root.A01Math=A01Math;
})(typeof window!=='undefined'?window:globalThis);
