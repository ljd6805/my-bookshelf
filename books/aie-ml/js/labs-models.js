/* 1~6장 실험: 모델이 경계를 긋는 방식. 계산은 A03Math, 여기서는 입력을 읽고 그림과 결과 문장만 만든다. */
(()=>{
'use strict';
const U=A03UI,M=A03Math,L=A03Labs,f=U.fmt,p=U.pct;
const KIND='<br><small>실제 계산 · 시드를 고정한 가상 결제 데이터</small>';

L.centroid=el=>{
 U.setup(el,U.range('sep','두 무리 중심 거리(표준편차 단위)',0,3,0.25,1.5));
 U.bind(el,()=>{const sep=U.value(el,'sep'),r=M.centroidLab(sep),[c0,c1]=r.cs;
  const a=c1.x-c0.x,b=c1.y-c0.y,c=-(a*(c0.x+c1.x)/2+b*(c0.y+c1.y)/2);
  const over=(sx,sy)=>U.boundary(a,b,c,sx,sy)+[c0,c1].map((q,i)=>`<circle cx="${sx(q.x)}" cy="${sy(q.y)}" r="13" fill="var(--chart)" stroke="${i?'var(--orange)':'var(--blue)'}" stroke-width="3"/><path d="M${sx(q.x)-8} ${sy(q.y)}h16M${sx(q.x)} ${sy(q.y)-8}v16" stroke="var(--text)" stroke-width="3"/>`).join('');
  const chart=U.scatter({points:r.train,xmin:-4,xmax:4,ymin:-3.5,ymax:3.5,xlabel:'결제 금액(표준화)',ylabel:'한 시간 결제 시도(표준화)',over,label:`학습 결제 120건과 두 중심, 그 사이 경계선. 시험 정확도 ${p(r.acc)}`});
  U.result(el,chart,`중심 거리 <b>${f(sep,2)}</b>에서 학습 결제 120건으로 두 중심(+)을 구하고, 새 결제 200건을 더 가까운 중심 쪽으로 판정했습니다. 시험 정확도 <strong>${p(r.acc)}</strong>, 동전을 던지는 기준선 <b>${p(r.random)}</b>, 한쪽만 고르는 기준선 <b>50.0%</b>입니다. 기준선보다 <b>${f((r.acc-Math.max(r.random,0.5))*100,1)}%p</b> 높습니다.${KIND}`);});
};

L.logistic=el=>{
 U.setup(el,U.range('epochs','경사하강 반복 횟수',0,300,10,20));
 U.bind(el,()=>{const n=U.value(el,'epochs'),r=M.logisticLab(n),[w0,w1]=r.model.w,b=r.model.b;
  const over=(sx,sy)=>U.boundary(w0,w1,b,sx,sy);
  const chart=U.scatter({points:r.data,xmin:-4,xmax:4,ymin:-3.5,ymax:3.5,xlabel:'결제 금액(표준화)',ylabel:'결제 시도(표준화)',over,label:`결제 80건과 반복 ${n}번 뒤의 결정경계. 손실 ${f(r.loss,3)}`});
  const line=Math.hypot(w0,w1)>1e-9?`결정경계는 <b>${f(w0,2)}·금액 + ${f(w1,2)}·시도 + ${f(b,2)} = 0</b>인 직선입니다.`:'아직 가중치가 모두 0이라 모든 결제에 p=0.5를 주고 경계선이 없습니다.';
  U.result(el,chart,`반복 <b>${n}</b>번(학습률 0.5, 전체 배치). ${line} 교차 엔트로피 <strong>${f(r.loss,3)}</strong>, p≥0.5를 사기로 본 학습 정확도 <b>${p(r.acc)}</b>. 반복 0번의 손실은 ln 2 = 0.693입니다.${KIND}`);});
};

L.split=el=>{
 U.setup(el,U.range('cut','분할 기준: 한 시간 결제 시도 ≤',1.5,8.5,1,4.5));
 U.bind(el,()=>{const t=U.value(el,'cut'),s=M.splitScores(t),best=M.bestSplit(),stack={};
  const sx=v=>52+(v-0.5)/9*400;let dots='';
  M.SPLIT_DATA.forEach(([x,c])=>{const k=stack[x]=(stack[x]||0)+1,y=225-k*22,X=sx(x);dots+=c?`<rect x="${X-7}" y="${y-7}" width="14" height="14" fill="var(--orange)"/>`:`<circle cx="${X}" cy="${y}" r="7" fill="var(--blue)"/>`;});
  let axis='';for(let v=1;v<=9;v++)axis+=`<text x="${sx(v)}" y="252" text-anchor="middle">${v}</text>`;
  const body=`<path d="M52 235H452" stroke="var(--line)"/>${axis}${dots}<path d="M${sx(t)} 46V240" stroke="var(--accent)" stroke-width="3" stroke-dasharray="7 5"/><text x="52" y="34">왼쪽 사기 ${s.left[1]}/${s.left[0]+s.left[1]}</text><text x="452" y="34" text-anchor="end">오른쪽 사기 ${s.right[1]}/${s.right[0]+s.right[1]}</text><text x="452" y="274" text-anchor="end">한 시간 결제 시도(회)</text>`;
  const chart=U.svg(body,`결제 24건을 시도 횟수 ${t} 이하와 초과로 나눈 그림. 왼쪽 사기 ${s.left[1]}건, 오른쪽 사기 ${s.right[1]}건`);
  U.result(el,chart,`기준 <b>시도 ≤ ${t}</b>. 왼쪽 정상 ${s.left[0]}·사기 ${s.left[1]}, 오른쪽 정상 ${s.right[0]}·사기 ${s.right[1]}. 지니는 부모 ${f(s.parentGini,3)}에서 자식 가중 평균 ${f(s.childGini,3)}로, 이득 <strong>${f(s.gainGini,3)}</strong>. 엔트로피는 ${f(s.parentEntropy,3)}에서 ${f(s.childEntropy,3)}로, 정보 이득 <strong>${f(s.gainEntropy,3)}</strong>비트. 모든 기준 중 정보 이득이 가장 큰 곳은 ${best.t}입니다.<br><small>실제 계산 · 가상 결제 24건(사기 10건)</small>`);});
};
L.boost=el=>{
 U.setup(el,U.range('bs-m','부스팅 라운드 수 M(그루터기 개수)',1,200,1,50)+U.select('bs-nu','학습률 ν(한 그루터기를 얼마나 믿을까)',[[0.05,'0.05'],[0.1,'0.1'],[0.3,'0.3'],[1,'1.0 (줄이지 않음)']],0.1));
 U.bind(el,()=>{const m=U.value(el,'bs-m'),nu=U.value(el,'bs-nu'),r=M.boosting(m,nu),g=Array.from({length:161},(_,i)=>-1+i/80);
  const fitChart=U.plot({lines:[{data:g.map(x=>[x,M.trueCurve(x)]),color:'var(--text)',dashed:true},{data:g.map(x=>[x,r.predict(x)]),color:'var(--orange)'}],points:r.train.map(d=>[d.x,d.y,'var(--blue)',3.5]),xmin:-1,xmax:1,ymin:-2.5,ymax:2.5,xlabel:'입력 x',ylabel:'예측',label:`그루터기 ${m}개를 더한 계단 예측(주황), 참 곡선(점선), 학습점 40개(파랑)`});
  const ms=r.trainCurve.map((v,k)=>[k,v]),vs=r.valCurve.map((v,k)=>[k,v]);
  const errChart=U.plot({lines:[{data:ms,color:'var(--blue)'},{data:vs,color:'var(--accent)',dashed:true}],points:[[m,r.valMSE,'var(--orange)',7],[r.bestM,r.bestVal,'var(--text)',5]],xmin:0,xmax:200,ymin:0,ymax:0.8,xlabel:'라운드 수 M',ylabel:'평균제곱오차',label:`학습 MSE(실선)와 검증 MSE(점선). 검증 최저점은 M=${r.bestM}에서 ${f(r.bestVal,3)}`});
  const after=m>r.bestM+10?`지금 M은 검증 최저점(M=${r.bestM})을 지나 검증 오차가 다시 ${f(r.valMSE-r.bestVal,3)} 올랐습니다. 여기서 멈추는 것이 조기 종료입니다.`:m<r.bestM-10?`검증 오차는 M=${r.bestM}까지 더 내려갑니다. 아직 덜 맞은(편향이 남은) 상태입니다.`:'검증 최저점 근처입니다.';
  U.result(el,fitChart+errChart,`학습률 ν=<b>${nu}</b>, 그루터기 <b>${m}</b>개. 학습 MSE <b>${f(r.trainMSE,3)}</b>, 검증 MSE <strong>${f(r.valMSE,3)}</strong>(잡음만으로 생기는 바닥 ${f(r.noise,4)}). 200라운드 안의 검증 최저점은 <b>M=${r.bestM}</b>에서 <strong>${f(r.bestVal,3)}</strong>입니다. ${after}<br><small>실제 계산 · 참 곡선 sin(4.2x)+0.3x에 잡음 0.35를 더한 학습 40점·검증 200점, 깊이 1 회귀 그루터기를 잔차에 맞춤</small>`);});
};


L.knn=el=>{
 U.setup(el,U.range('k','이웃 수 k',1,29,2,7));
 U.bind(el,()=>{const k=U.value(el,'k'),r=M.knnLab(k),cw=400/24,ch=210/14;
  const under=()=>r.grid.map((row,j)=>row.map((v,i)=>v?`<rect x="${(52+i*cw).toFixed(1)}" y="${(235-(j+1)*ch).toFixed(1)}" width="${(cw+.4).toFixed(1)}" height="${(ch+.4).toFixed(1)}" fill="var(--orange)" opacity=".2"/>`:'').join('')).join('');
  const chart=U.scatter({points:r.train,xmin:-4,xmax:4,ymin:-3,ymax:3.5,xlabel:'결제 금액(표준화)',ylabel:'새벽 결제 비율(표준화)',under,label:`k=${k}의 판정 지도. 주황 칸은 사기로 판정되는 영역. 시험 정확도 ${p(r.accTest)}`});
  U.result(el,chart,`k=<b>${k}</b>: 새 결제마다 학습 결제 60건 중 가장 가까운 ${k}건의 다수결을 따릅니다. 학습 정확도 <b>${p(r.accTrain)}</b>, 시험 결제 200건 정확도 <strong>${p(r.accTest)}</strong>, 둘의 차이 ${f((r.accTrain-r.accTest)*100,1)}%p. 주황 칸이 사기로 판정되는 영역입니다.${KIND}`);});
};

L.svm=el=>{
 U.setup(el,U.range('logc','규제 C의 상용로그 log₁₀C',-2,2,0.5,0));
 U.bind(el,()=>{const lc=U.value(el,'logc'),r=M.svmLab(lc),[a,b]=r.model.w,c=r.model.b;
  const pts=r.data.map(q=>({x:q.x,y:q.y,c:q.c>0?1:0}));
  const over=(sx,sy)=>U.boundary(a,b,c-1,sx,sy,{color:'var(--muted)',dashed:true})+U.boundary(a,b,c+1,sx,sy,{color:'var(--muted)',dashed:true})+U.boundary(a,b,c,sx,sy);
  const chart=U.scatter({points:pts,xmin:-3,xmax:3,ymin:-2.5,ymax:2.5,xlabel:'금액(표준화)',ylabel:'시도(표준화)',over,ring:(q,i)=>r.model.alpha[i]>1e-6,label:`C=${f(r.C,2)}의 결정경계와 마진. 서포트 벡터 ${r.support}개를 테두리로 표시`});
  const width=Number.isFinite(r.width)?f(r.width,3):'무한대(경계 없음)';
  U.result(el,chart,`C = 10^${f(lc,1)} = <b>${f(r.C,2)}</b>. 마진 폭(점선 사이) <strong>${width}</strong>, 서포트 벡터(테두리) <b>${r.support}</b>개, 길 안이나 반대편에 선 결제 <b>${r.inside}</b>건, 경계 반대편에서 틀린 결제 <b>${r.errors}</b>건, 평균 힌지 손실 ${f(r.hinge,3)}. C가 작을수록 길 침범을 싸게 쳐서 길이 넓어집니다.<br><small>실제 계산 · 쌍대 좌표 하강 3,000회 · 가상 결제 29건</small>`);});
};

const SHAPES=['circle','rect','tri','diamond','cross'],CC=['var(--accent)','var(--orange)','var(--blue)','var(--text)','var(--muted)'];
function shape(k,x,y,s=5){const col=CC[k];if(k===0)return `<circle cx="${x}" cy="${y}" r="${s}" fill="${col}"/>`;if(k===1)return `<rect x="${x-s}" y="${y-s}" width="${2*s}" height="${2*s}" fill="${col}"/>`;
 if(k===2)return `<path d="M${x} ${y-s-1}L${x+s+1} ${y+s}H${x-s-1}Z" fill="${col}"/>`;if(k===3)return `<path d="M${x} ${y-s-1}L${x+s+1} ${y}L${x} ${y+s+1}L${x-s-1} ${y}Z" fill="${col}"/>`;return `<path d="M${x-s} ${y-s}L${x+s} ${y+s}M${x+s} ${y-s}L${x-s} ${y+s}" stroke="${col}" stroke-width="3"/>`;}
L.kmeans=el=>{
 U.setup(el,U.range('kk','무리 수 K',2,5,1,3)+U.range('step','반복 단계(할당과 중심 이동 한 번씩)',0,8,1,0));
 U.bind(el,()=>{const K=U.value(el,'kk'),st=U.value(el,'step'),P=M.clusterData(),h=M.kmeans(P,K,8),now=h[st],sil=M.silhouette(P,now.lab);
  const sx=v=>52+(v+4.5)/9*400,sy=v=>235-(v+3.5)/7*210;
  const body=`<rect x="52" y="25" width="400" height="210" fill="none" stroke="var(--line)"/>`+P.map((q,i)=>shape(now.lab[i],+sx(q.x).toFixed(1),+sy(q.y).toFixed(1),5)).join('')+now.cs.map((c,k)=>`<circle cx="${sx(c.x)}" cy="${sy(c.y)}" r="13" fill="var(--chart)" stroke="${CC[k]}" stroke-width="3"/><text x="${sx(c.x)}" y="${sy(c.y)+5}" text-anchor="middle">${k+1}</text>`).join('')+`<text x="452" y="262" text-anchor="end">고객 특성 1</text><text x="52" y="16">고객 특성 2</text>`;
  const chart=U.svg(body,`K=${K}, ${st}단계의 k-평균. 무리마다 모양이 다르고 번호 원이 중심. 관성 ${f(now.inertia,1)}`);
  const moved=st?`이번 단계에서 무리를 바꾼 고객 <b>${now.moved}</b>명.`:'0단계는 일부러 한쪽에 몰아 둔 초기 중심입니다.';
  U.result(el,chart,`K=<b>${K}</b>, <b>${st}</b>단계. ${moved} 관성(각 점과 자기 중심의 거리 제곱 합) <strong>${f(now.inertia,1)}</strong>, 실루엣 점수 <b>${f(sil,3)}</b>(1에 가까울수록 무리가 또렷함). 관성은 K를 늘리면 늘 줄어들지만 실루엣은 그렇지 않습니다.<br><small>실제 계산 · 가상 고객 60명</small>`);});
};

L.smoothing=el=>{
 U.setup(el,U.range('alpha','라플라스 평활값 α',0,5,0.5,1));
 U.bind(el,()=>{const a=U.value(el,'alpha'),r=M.naiveBayes(a),W=M.NB.words,idx=[0,1,2];
  const labels=idx.flatMap(i=>[`의심 · ${W[i]}`,`정상 · ${W[i]}`]),vals=idx.flatMap(i=>[r.probs[0][i]*100,r.probs[1][i]*100]);
  const chart=U.bars(labels,vals,'%',null,1);
  const lg=v=>Number.isFinite(v)?f(v,2):'−∞(확률 0)';
  U.result(el,chart,`α=<b>${f(a,1)}</b>. 문의 “급히 환불 계좌”의 로그 점수: 의심 <b>${lg(r.logs[0])}</b>, 정상 <b>${lg(r.logs[1])}</b>. 막대는 각 부류 문의에서 그 단어가 나올 확률입니다. 정상 문의의 단어 기록에 “계좌”가 한 번도 없었기 때문에 α=0이면 정상 쪽 확률이 0이 됩니다. 사기 의심 사후확률 <strong>${p(r.post[0])}</strong>(사전확률 10.0%).<br><small>실제 계산 · 가상 고객 문의 단어 빈도표</small>`);});
};
})();
