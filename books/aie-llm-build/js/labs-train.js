/* 3~5장 실험: 바이그램 학습, Chinchilla 배분, 학습 메모리, 활성값 재계산, 파이프라인 거품.
   계산은 모두 A11Math가 하고, 여기서는 입력을 읽어 그림과 결과 문장을 그린다. */
(()=>{
'use strict';
const U=A11UI,M=A11Math,F=U.fmt,R=U.range,S=U.select;
const big=n=>Number(n).toExponential(2).replace(/e\+?(-?\d+)/,(_,e)=>` × 10<sup>${e}</sup>`);
const human=n=>n>=1e12?F(n/1e12,2)+'조':n>=1e8?F(n/1e8,1)+'억':F(n,0);
let bigram=null;

A11Labs.nextchar=el=>{
 U.setup(el,R('nc-steps','경사하강 갱신 횟수',0,400,20,100)+S('nc-lr','학습률',[[5,'5 (느림)'],[20,'20'],[100,'100 (너무 큼)']],20));
 U.bind(el,()=>{
  const d=bigram||(bigram=M.bigramData(M.DATA.corpus.ko)),steps=U.value(el,'nc-steps'),lr=U.value(el,'nc-lr'),r=M.bigramTrain(d,steps,lr),floor=M.bigramFloor(d),xmax=Math.max(steps,20);
  const loss=r.hist[steps],sample=M.bigramGreedy(d,r.W,'서',12);
  const chart=U.plot({lines:[{data:r.hist.map((v,i)=>[i,v])},{data:[[0,floor],[xmax,floor]],color:'var(--orange)',dashed:true}],points:[[steps,loss,'var(--orange)',6]],xmin:0,xmax,ymin:0,ymax:4.5,xlabel:'갱신 횟수',ylabel:'평균 교차 엔트로피 (nat)',label:`학습률 ${lr}로 ${steps}번 갱신한 바이그램 손실 곡선. 마지막 손실 ${F(loss,3)}, 바닥 ${F(floor,3)}`});
  const note=lr>=100&&steps>=100?'한 걸음이 커서 손실이 내려가다 다시 튀어 오르기를 되풀이합니다.':steps===0?'아직 학습 전이라 모든 글자에 같은 확률(1/57)을 줍니다.':'손실이 바닥(주황 점선)을 향해 내려갑니다.';
  U.result(el,chart,`글자 ${d.V}종, 이웃한 글자 쌍 ${d.N}개 · 시작 손실 ln ${d.V} = <b>${F(r.hist[0],3)}</b><br>${steps}번 갱신 뒤 손실 <b>${F(loss,3)}</b>, 빈도로 센 바닥 ${F(floor,3)}, 남은 차이 ${F(loss-floor,3)}<br>${note}<br>"서"에서 시작해 가장 높은 글자만 고르면: <b>${U.esc(sample)}</b><br>0으로 시작한 로짓 표를 전체 배치 경사하강으로 실제 학습한 결과입니다.`);
 });
};

A11Labs.chinchilla=el=>{
 U.setup(el,S('cc-budget','학습 계산량 C (FLOPs)',[['1e21','10²¹ (작은 실험)'],['5.04e23','5.04 × 10²³ (Gopher 280B·3천억 토큰)'],['5.88e23','5.88 × 10²³ (Chinchilla 70B·1.4조 토큰)']],'5.88e23')+R('cc-logn','모델 크기 log₁₀ N',8,12.5,0.05,10));
 U.bind(el,()=>{
  const C=Number(U.text(el,'cc-budget')),lg=U.value(el,'cc-logn'),N=Math.pow(10,lg),D=C/(6*N),L=M.chinchillaLoss(N,D),opt=M.chinchillaOptimal(C);
  const N20=Math.sqrt(C/120),L20=M.chinchillaLoss(N20,20*N20),curve=Array.from({length:91},(_,i)=>{const x=8+i*0.05,n=Math.pow(10,x);return [x,M.chinchillaLoss(n,C/(6*n))];});
  const ymin=Math.floor((opt.L-0.05)*10)/10;
  const chart=U.plot({lines:[{data:curve}],points:[[lg,L,'var(--orange)',7],[Math.log10(opt.N),opt.L,'var(--accent)',5],[Math.log10(N20),L20,'var(--blue)',5]],xmin:8,xmax:12.5,ymin,ymax:ymin+1.5,xlabel:'log₁₀ 파라미터 수',ylabel:'Chinchilla 식 손실',label:`계산량 고정에서 모델 크기에 따른 손실. 지금 ${F(L,3)}, 식의 최솟값 ${F(opt.L,3)}`});
  U.result(el,chart,`C = ${big(C)} FLOPs, N = <b>${human(N)}</b> 파라미터 → D = C ÷ 6N = <b>${human(D)}</b> 토큰 (파라미터당 ${F(D/N,1)}토큰)<br>손실 L = 1.69 + 406.4/N<sup>0.34</sup> + 410.7/D<sup>0.28</sup> = <b>${F(L,3)}</b><br>이 식의 최솟값(노란 점): N ≈ ${human(opt.N)}, D ≈ ${human(opt.D)} (파라미터당 ${F(opt.D/opt.N,0)}토큰), L = ${F(opt.L,3)}<br>파라미터당 20토큰 규칙(파란 점): N ≈ ${human(N20)}, L = ${F(L20,3)}<br>두 점이 다른 것은 경험칙과 적합식의 차이입니다. 논문 계수로 식을 계산한 값이며 실제 학습이 아닙니다.`);
 });
};

const MODELS=[['0.124','GPT-2 Small (0.124B)'],['7.5','7.5B (ZeRO 논문의 예)'],['8','서재봇 8B'],['70','70B']];
A11Labs.trainmem=el=>{
 U.setup(el,S('tm-model','모델 크기',MODELS,'8')+S('tm-stage','상태 나누기',[[0,'복제 (데이터 병렬)'],[1,'ZeRO 1단계'],[2,'ZeRO 2단계'],[3,'ZeRO 3단계']],0)+R('tm-gpus','데이터 병렬 GPU 수 N',1,64,1,8));
 U.bind(el,()=>{
  const P=Number(U.text(el,'tm-model')),st=U.value(el,'tm-stage'),n=U.value(el,'tm-gpus'),m=M.trainMemory(P,st,n),need=M.minGpus(P,3);
  const chart=U.bars(['가중치 (16비트)','기울기 (16비트)','옵티마이저 상태','합계'],[m.weights,m.grads,m.optimizer,m.total],'GB, GPU 한 장 (점선 = 80GB)',80,2);
  const fit=m.total<=80?`80GB 안에 들어갑니다(활성값 제외, 남는 자리 ${F(80-m.total,1)}GB).`:`80GB를 ${F(m.total-80,1)}GB 넘습니다.`;
  U.result(el,chart,`Ψ = ${P}B, ${['복제','ZeRO 1단계','ZeRO 2단계','ZeRO 3단계'][st]}, GPU ${n}장<br>가중치 2Ψ${st>=3?' ÷ N':''} + 기울기 2Ψ${st>=2?' ÷ N':''} + 옵티마이저 12Ψ${st>=1?' ÷ N':''} = <b>${F(m.total,2)}GB</b><br>${fit}<br>${need===Infinity?'':`이 모델을 ZeRO 3단계로 80GB 아래에 넣으려면 GPU가 최소 ${need}장 필요합니다. `}ZeRO 논문의 혼합 정밀도 Adam 셈(파라미터당 16바이트)으로 계산했습니다.`);
 });
};

const CK={h:4096,a:32,L:32,b:1};
A11Labs.ckpt=el=>{
 U.setup(el,S('ck-mode','재계산 방식',[['none','버리지 않음'],['selective','선택적 재계산'],['full','전체 재계산']],'none')+S('ck-seq','시퀀스 길이 s',[[2048,'2,048'],[8192,'8,192'],[32768,'32,768']],8192)+R('ck-k','전체 재계산의 구간 k (층)',1,32,1,1));
 U.bind(el,()=>{
  const mode=U.text(el,'ck-mode'),s=U.value(el,'ck-seq'),k=U.value(el,'ck-k'),c={...CK,s};
  const none=M.checkpointPlan(c,'none'),sel=M.checkpointPlan(c,'selective'),full=M.checkpointPlan(c,'full',k),cur={none,selective:sel,full}[mode];
  const chart=U.bars(['버리지 않음','선택적 재계산',`전체 재계산 (k = ${k})`],[none.bytes/1e9,sel.bytes/1e9,full.bytes/1e9],'GB, 시퀀스 하나의 16비트 활성값 (점선 = 80GB)',80,1);
  const name={none:'버리지 않음',selective:'선택적 재계산',full:`전체 재계산 (구간 ${k}층, 저장 구간 ${full.segments}개)`}[mode];
  U.result(el,chart,`은닉 4,096, 헤드 32, 층 32, s = ${s.toLocaleString('en-US')}, 배치 1 · 층 하나 = s·b·h·(34 + 5·a·s/h) = ${F(none.perLayer/1e9,2)}GB<br>지금 방식: ${name} → 활성값 <b>${F(cur.bytes/1e9,2)}GB</b>, 추가 계산 <b>${F(cur.overhead*100,1)}%</b><br>`+
   (mode==='full'?'저장량 = 구간 입력(층마다 2·s·b·h) + 다시 펼친 구간 k층의 활성값이라 k가 크면 오히려 늘어납니다.':mode==='selective'?`길이의 제곱으로 크는 5·a·s/h 항만 버려 ${F(none.bytes/sel.bytes,1)}배 줄였습니다.`:'모든 중간값을 붙잡아 둡니다.')+
   '<br>Korthikanti 등(2022)의 식으로 계산한 값이며, FlashAttention처럼 점수 행렬을 저장하지 않는 커널을 쓰면 실제 값은 더 작습니다.');
 });
};

function timeline(g,P){
 const W=440,cw=W/g.T,rh=Math.min(40,200/P),y0=30;let b='';
 for(let s=0;s<P;s++){const y=y0+s*rh;b+=`<text x="8" y="${y+rh*0.65}">GPU ${s+1}</text><rect x="36" y="${y}" width="${W}" height="${rh-3}" fill="var(--panel2)"/>`;}
 for(const c of g.cells){const x=36+c.t*cw,y=y0+c.stage*rh;b+=`<rect x="${x+0.5}" y="${y}" width="${Math.max(cw-1,0.5)}" height="${rh-3}" fill="${c.kind==='F'?'var(--accent)':'var(--blue)'}"/>`;if(cw>=16&&rh>=18)b+=`<text x="${x+cw/2}" y="${y+rh*0.62}" text-anchor="middle" fill="var(--bg)">${c.mb}</text>`;}
 b+=`<text x="36" y="${y0+P*rh+20}">시간 → (칸 ${g.T}개) · 노랑 = 순전파, 파랑 = 역전파, 회색 = 거품</text>`;
 return U.svg(b,`GPipe 일정표: 단계 ${P}개, 시간 칸 ${g.T}개, 거품 ${F(g.bubble*100,1)}%`);
}
A11Labs.bubble=el=>{
 U.setup(el,R('pp-p','파이프라인 단계 수 P',1,8,1,4)+R('pp-m','마이크로배치 수 M',1,32,1,4));
 U.bind(el,()=>{
  const P=U.value(el,'pp-p'),Mb=U.value(el,'pp-m'),g=M.gpipeSchedule(P,Mb);
  U.result(el,timeline(g,P),`P = ${P}, M = ${Mb} → 시간 칸 2(M + P − 1) = ${g.T}개, GPU마다 일하는 칸 ${2*Mb}개<br>거품 비율 (P − 1)/(M + P − 1) = <b>${F(g.bubble*100,1)}%</b> · 일하는 시간에 견주면 (P − 1)/M = ${F(g.relative*100,2)}%<br>동시에 붙잡는 마이크로배치 활성값: GPipe ${g.peakGpipe}개, 1F1B ${g.peak1f1b}개<br>순전파와 역전파 한 칸의 시간이 같고 통신이 0이라고 가정한 일정표를 실제로 채운 결과입니다.`);
 });
};
})();
