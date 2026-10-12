/* 장마다 "먼저 개념 잡기"에 들어가는 움직이는 핵심 그림.
   움직임은 style.css의 fig-* 애니메이션이며 prefers-reduced-motion과 html[data-motion=reduce]에서 멈춘다.
   그림마다 caption 한 문장과 aria-label을 둔다. 숫자가 있는 그림은 A03Math로 계산한다. */
window.A03Figures=(()=>{
'use strict';
const svg=(label,body,h=300)=>`<svg viewBox="0 0 640 ${h}" role="img" aria-label="${label}">${body}</svg>`;
const t=(x,y,s,o={})=>`<text x="${x}" y="${y}" text-anchor="${o.a||'middle'}" font-size="${o.size||15}" fill="${o.fill||'var(--text)'}"${o.w?` font-weight="${o.w}"`:''}>${s}</text>`;
const box=(x,y,w,h,stroke,fill='var(--panel2)',r=8,cls='')=>`<rect${cls?` class="${cls}"`:''} x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const line=(d,stroke='var(--muted)',cls='fig-dash')=>`<path class="${cls}" d="${d}" fill="none" stroke="${stroke}" stroke-width="2"/>`;
/* 점 하나가 (x,y)에서 (x+dx,y+dy)로 반복 이동한다. */
const dot=(x,y,dx,dy,color,delay=0,r=6)=>`<circle class="fig-pkt" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const blink=(body,delay,cls='fig-seq')=>`<g class="${cls}" style="animation-delay:${delay}s">${body}</g>`;
const grow=(x,y,w,h,color,delay=0)=>`<rect class="fig-grow" style="animation-delay:${delay}s" x="${x}" y="${y}" width="${Math.max(w,1)}" height="${h}" rx="3" fill="${color}"/>`;
const pulse=(x,y,r,color)=>`<circle class="fig-pulse" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="3"/>`;
const H={svg,t,box,line,dot,blink,grow,pulse};
const F={};
const Mx=A03Math,f2=(v,d=2)=>A03UI.fmt(v,d),pc=v=>(v*100).toFixed(1)+'%';
const AC='var(--accent)',BL='var(--blue)',OR='var(--orange)',MU='var(--muted)';
const sq=(x,y,c=OR,s=6)=>`<rect x="${x-s}" y="${y-s}" width="${2*s}" height="${2*s}" fill="${c}"/>`;
const ci=(x,y,c=BL,r=6)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;

F.framing=H=>{const r=Mx.centroidLab(1.5),vals=[['동전 던지기',r.random,MU],['한쪽만 고르기',0.5,MU],['최근접 중심',r.acc,AC]];
 let b=H.t(160,30,'과거 결제(라벨 있음)',{w:700})+H.box(30,45,260,170,BL);
 r.train.filter((_,i)=>i%3===0).forEach((q,i)=>{const x=160+q.x*30,y=130-q.y*28;if(x>40&&x<280&&y>55&&y<205)b+=q.c?sq(x,y,OR,4):ci(x,y,BL,4);});
 b+=H.pulse(160+r.cs[0].x*30,130-r.cs[0].y*28,9,BL)+H.pulse(160+r.cs[1].x*30,130-r.cs[1].y*28,9,OR);
 b+=H.line('M295 130H345',MU)+H.dot(300,130,40,0,AC,0,5)+H.t(475,30,'새 결제 200건의 정확도',{w:700});
 vals.forEach(([n,v,c],i)=>{const y=60+i*58;b+=H.t(355,y+22,n,{a:'start',size:14})+H.grow(355,y+30,v*260,16,c,i*.4)+H.t(625,y+44,pc(v),{a:'end',size:14,w:700});});
 b+=H.t(320,280,'두 무리의 중심(원)을 구하고, 새 결제를 더 가까운 쪽으로 판정한 뒤 기준선과 비교합니다.',{size:13,fill:MU});
 return {svg:H.svg(`최근접 중심 분류기의 시험 정확도 ${pc(r.acc)}가 무작위 기준선 ${pc(r.random)}보다 높은지 비교하는 그림`,b),caption:'시드를 고정한 가상 결제로 실제 계산한 값입니다. 모델의 숫자는 기준선 옆에 놓였을 때 비로소 의미가 생깁니다.'};};

F.lines=H=>{const sx=z=>60+(z+6)*24,sy=p=>230-p*170;let path='';for(let z=-6;z<=6.01;z+=0.25)path+=(path?'L':'M')+sx(z).toFixed(1)+' '+sy(Mx.sigmoid(z)).toFixed(1);
 let b=`<path d="M60 230H348M204 50V236" stroke="var(--line)"/>`+`<path class="fig-draw" d="${path}" fill="none" stroke="${AC}" stroke-width="3"/>`+H.line(`M60 ${sy(.5)}H348`,MU)+H.t(56,sy(1)+5,'1',{a:'end',size:13})+H.t(56,sy(.5)+5,'0.5',{a:'end',size:13})+H.t(56,sy(0)+5,'0',{a:'end',size:13})+H.t(204,262,'가중합 z = w·x + b',{size:14})+H.t(204,32,'p = σ(z)',{w:700});
 [-4,-1.5,1,3.5].forEach((z,i)=>{b+=H.blink((i<2?ci:sq)(sx(z),sy(Mx.sigmoid(z)),i<2?BL:OR,6),i*.5);});
 const L=[0,20,300].map(e=>Mx.logisticLab(e));b+=H.t(500,40,'반복에 따른 교차 엔트로피',{w:700,size:14});
 L.forEach((r,i)=>{const y=70+i*60;b+=H.t(390,y+18,['0번','20번','300번'][i],{a:'start',size:14})+H.grow(450,y+4,r.loss/0.7*120,20,i?AC:MU,i*.5)+H.t(625,y+20,f2(r.loss,3),{a:'end',size:14,w:700});});
 b+=H.t(500,270,'0번은 ln 2 = 0.693에서 출발',{size:13,fill:MU});
 return {svg:H.svg('시그모이드 곡선이 가중합을 0과 1 사이 확률로 접고, 경사하강 반복에 따라 손실이 0.693에서 줄어드는 그림',b),caption:'왼쪽 곡선은 시그모이드 함수 그대로이고, 오른쪽 손실 값은 가상 결제 80건으로 실제 학습해 계산했습니다.'};};

F.trees=H=>{const s=Mx.splitScores(5.5);
 let b=H.box(220,20,200,62,AC)+H.t(320,48,'시도 ≤ 5.5회?',{w:700})+H.t(320,70,`지니 ${f2(s.parentGini,3)} · 24건`,{size:13,fill:MU});
 b+=H.line('M280 82L150 150',MU)+H.line('M360 82L490 150',MU)+H.dot(280,84,-120,62,BL,0,6)+H.dot(360,84,120,62,OR,.8,6);
 b+=H.t(185,112,'예',{size:14})+H.t(478,112,'아니오',{size:14});
 const leaf=(x,cnt,c)=>{const n=cnt[0]+cnt[1];return H.blink(H.box(x,150,200,80,c)+H.t(x+100,180,`정상 ${cnt[0]} · 사기 ${cnt[1]}`,{w:700})+H.t(x+100,208,`지니 ${f2(Mx.gini(cnt),3)} · ${n}건`,{size:13,fill:MU}),c===BL?.4:1.2);};
 b+=leaf(50,s.left,BL)+leaf(390,s.right,OR)+H.t(320,268,`가중 평균 지니 ${f2(s.childGini,3)}, 줄어든 만큼(${f2(s.gainGini,3)})이 이 질문의 이득`,{size:14});
 return {svg:H.svg(`결정트리의 첫 질문 시도 5.5회 이하가 결제 24건을 정상 ${s.left[0]} 사기 ${s.left[1]}, 정상 ${s.right[0]} 사기 ${s.right[1]}로 나누는 그림`,b),caption:'가상 결제 24건으로 실제 계산한 지니 값입니다. 나무는 이득이 가장 큰 질문을 고르고, 양쪽 칸에서 같은 일을 되풀이합니다.'};};

F.neighbors=H=>{const tr=Mx.knnData(71,60),q={x:0.9,y:1.1},near=tr.map(p=>({...p,d:Math.hypot(p.x-q.x,p.y-q.y)})).sort((a,b)=>a.d-b.d).slice(0,7),R=near[6].d;
 const sx=v=>155+v*42,sy=v=>150-v*36;let b=H.t(155,24,'kNN: 가까운 7건의 투표',{w:700})+H.box(20,36,270,228,MU,'none');
 tr.forEach(p=>{const x=sx(p.x),y=sy(p.y);if(x>26&&x<284&&y>42&&y<258)b+=p.c?sq(x,y,OR,4):ci(x,y,BL,4);});
 b+=`<ellipse class="fig-pulse" cx="${sx(q.x)}" cy="${sy(q.y)}" rx="${R*42}" ry="${R*36}" fill="none" stroke="${AC}" stroke-width="2.5"/>`+`<path d="M${sx(q.x)-8} ${sy(q.y)}h16M${sx(q.x)} ${sy(q.y)-8}v16" stroke="var(--text)" stroke-width="3"/>`;
 const v=near.filter(p=>p.c).length;b+=H.t(155,284,`이웃 7건 중 사기 ${v}건이므로 ${v*2>7?'사기':'정상'}로 판정`,{size:14});
 b+=H.t(480,24,'SVM: 가장 넓은 길',{w:700})+H.box(340,36,280,228,MU,'none');
 const d=Mx.svmData(),m=Mx.trainSVM(d,1,800),X=v=>480+v*42,Y=v=>150-v*40;
 d.forEach(p=>{const x=X(p.x),y=Y(p.y);if(x>346&&x<614&&y>42&&y<258)b+=p.c>0?sq(x,y,OR,4):ci(x,y,BL,4);});
 const seg=c=>{const [a,bb]=m.w,n=Math.hypot(a,bb),x0=-a*c/(n*n),y0=-bb*c/(n*n),dx=-bb/n*3.2,dy=a/n*3.2;return `M${X(x0-dx).toFixed(1)} ${Y(y0-dy).toFixed(1)}L${X(x0+dx).toFixed(1)} ${Y(y0+dy).toFixed(1)}`;};
 b+=`<clipPath id="a03-fig-svm"><rect x="340" y="36" width="280" height="228"/></clipPath><g clip-path="url(#a03-fig-svm)">`+H.line(seg(m.b-1),MU)+H.line(seg(m.b+1),MU)+`<path d="${seg(m.b)}" stroke="${AC}" stroke-width="3"/></g>`+H.t(480,284,'점선 사이가 마진, 그 위의 점이 서포트 벡터',{size:14});
 return {svg:H.svg('왼쪽은 새 결제 주변 7개 이웃을 원으로 묶어 투표하는 kNN, 오른쪽은 두 무리 사이에 가장 넓은 길을 낸 선형 SVM 그림',b),caption:'두 그림 모두 가상 결제로 실제 계산했습니다. kNN은 판단을 이웃에게 맡기고, SVM은 경계 가까운 몇 점만으로 길을 정합니다.'};};

F.clusters=H=>{const P=Mx.clusterData(),h=Mx.kmeans(P,3,8),end=h[8],st=h[0],sx=v=>200+v*44,sy=v=>152-v*34,C=[AC,OR,BL];
 let b=H.box(20,20,370,260,MU,'none');P.forEach((p,i)=>{const k=end.lab[i],x=sx(p.x),y=sy(p.y);b+=k===1?sq(x,y,C[k],4):ci(x,y,C[k],4.5);});
 st.cs.forEach((c,k)=>{const e=end.cs[k];b+=`<circle cx="${sx(c.x)}" cy="${sy(c.y)}" r="9" fill="none" stroke="${C[k]}" stroke-dasharray="3 3" stroke-width="2"/>`+`<circle cx="${sx(e.x)}" cy="${sy(e.y)}" r="10" fill="none" stroke="${C[k]}" stroke-width="3"/>`+H.dot(sx(c.x),sy(c.y),sx(e.x)-sx(c.x),sy(e.y)-sy(c.y),C[k],k*.3,9);});
 b+=H.t(510,40,'관성(거리 제곱 합)',{w:700});const iv=[0,1,2,8].map(i=>h[i].inertia),mx=iv[0];
 iv.forEach((v,i)=>{const y=60+i*50;b+=H.t(410,y+18,`${[0,1,2,8][i]}단계`,{a:'start',size:14})+H.grow(470,y+4,v/mx*105,20,i?AC:MU,i*.4)+H.t(630,y+20,f2(v,1),{a:'end',size:14,w:700});});
 b+=H.t(510,272,'점선 원은 처음 중심, 굵은 원은 마지막 중심',{size:13,fill:MU});
 return {svg:H.svg(`k-평균에서 처음 몰려 있던 중심 세 개가 무리 평균으로 이동하고 관성이 ${f2(mx,1)}에서 ${f2(iv[3],1)}로 줄어드는 그림`,b),caption:'가상 고객 60명으로 실제 계산했습니다. 움직이는 원은 중심이 처음 자리에서 마지막 자리로 가는 길입니다.'};};

F.bayes=H=>{const r=Mx.naiveBayes(1),W=Mx.NB.words;
 let b=H.t(130,34,'문의: “급히 환불 계좌”',{w:700});[0,1,2].forEach(i=>{b+=H.blink(H.box(30,52+i*62,200,46,AC)+H.t(130,82+i*62,W[i],{w:700}),i*.5);});
 b+=H.line('M235 140H300',MU)+H.dot(240,140,56,0,AC,0,5);
 const row=(y,name,pr,ps,lg,c)=>H.box(310,y,310,90,c)+H.t(325,y+28,name,{a:'start',w:700})+H.t(325,y+54,`사전 ${pc(pr)} × 단어 확률 곱`,{a:'start',size:14})+H.t(325,y+78,`로그 점수 ${f2(lg,2)}`,{a:'start',size:14,fill:MU})+H.t(605,y+28,pc(ps),{a:'end',w:700});
 b+=row(40,'사기 의심',Mx.NB.prior[0],r.post[0],r.logs[0],OR)+row(150,'정상 문의',Mx.NB.prior[1],r.post[1],r.logs[1],BL)+H.grow(310,250,r.post[0]*310,14,OR,.6)+H.t(320,284,'α=1 평활 뒤 사후확률(합 100%)',{size:13,fill:MU});
 return {svg:H.svg(`단어 세 개의 확률을 곱해 사기 의심 사후확률 ${pc(r.post[0])}를 얻는 나이브 베이즈 그림`,b),caption:'가상 문의 단어 빈도표로 실제 계산했습니다. 사전확률은 의심 쪽이 10%로 작지만 단어 증거가 판정을 뒤집습니다.'};};

F.features=H=>{const w=Mx.scalingLab('won'),z=Mx.scalingLab('z');
 let b=H.t(320,30,'새 결제 52,000원·시도 8회와 이웃 사이의 거리',{w:700});
 const panel=(x,name,r,c,d)=>H.box(x,50,280,170,c)+H.t(x+140,78,name,{w:700})+H.t(x+20,112,'금액 몫',{a:'start',size:14})+H.grow(x+90,98,r.share*170,18,OR,d)+H.t(x+20,146,'시도 몫',{a:'start',size:14})+H.grow(x+90,132,(1-r.share)*170+1,18,AC,d+.3)+H.t(x+140,180,`가장 가까운 결제: ${r.neighbor.c?'사기':'정상'}`,{size:14})+H.t(x+140,204,`5-NN 정확도 ${pc(r.acc)}`,{size:14,w:700});
 b+=panel(30,'원 단위 그대로',w,MU,0)+panel(330,'z-점수 표준화',z,AC,.8)+H.line('M312 135H328',MU);
 b+=H.t(320,252,'금액 1,000원 차이가 시도 1회 차이보다 1,000배 커 보이면 시도라는 신호가 사라집니다.',{size:14})+H.t(320,278,'척도 기준은 학습 데이터에서만 구합니다.',{size:13,fill:MU});
 return {svg:H.svg(`원 단위에서는 거리의 ${pc(w.share)}를 금액이 차지하지만 표준화하면 ${pc(z.share)}로 줄어 판정이 바뀌는 그림`,b),caption:'가상 결제 50건으로 실제 계산했습니다. 거리 기반 모델에서 단위는 곧 가중치입니다.'};};

F.metrics=H=>{const D=Mx.scoreData(),bins=20,hn=new Array(bins).fill(0),hf=new Array(bins).fill(0);D.forEach(d=>{const i=Math.min(bins-1,Math.floor(d.s*bins));(d.c?hf:hn)[i]++;});
 const mn=Math.max(...hn),mf=Math.max(...hf);let b=`<path d="M40 230H360" stroke="var(--line)"/>`;
 for(let i=0;i<bins;i++){const x=40+i*16;b+=`<rect x="${x}" y="${230-hn[i]/mn*150}" width="7" height="${hn[i]/mn*150}" fill="${BL}" opacity=".8"/><rect x="${x+8}" y="${230-hf[i]/mf*150}" width="7" height="${hf[i]/mf*150}" fill="${OR}"/>`;}
 b+=H.t(200,30,'사기 점수 분포(부류마다 높이를 따로 맞춤)',{size:14,w:700})+H.t(40,252,'0',{size:13})+H.t(360,252,'1',{size:13})+H.t(200,276,'파랑 정상 970건 · 주황 사기 30건',{size:13,fill:MU});
 b+=H.blink(`<path d="M120 50V236" stroke="${AC}" stroke-width="3"/>`+H.t(120,48,'0.3',{size:13}),0,'fig-turn fig-first')+H.blink(`<path d="M200 50V236" stroke="${AC}" stroke-width="3"/>`+H.t(200,48,'0.5',{size:13}),1.2,'fig-turn')+H.blink(`<path d="M264 50V236" stroke="${AC}" stroke-width="3"/>`+H.t(264,48,'0.7',{size:13}),2.4,'fig-turn')+H.blink(`<path d="M200 50V236" stroke="${AC}" stroke-width="3"/>`+H.t(200,48,'0.5',{size:13}),3.6,'fig-turn');
 const cm=Mx.confusion(D,0.5),cell=(x,y,n,v,c)=>H.box(x,y,120,70,c)+H.t(x+60,y+30,n,{size:14})+H.t(x+60,y+56,String(v),{w:700});
 b+=H.t(500,30,'문턱 0.5의 혼동 행렬',{size:14,w:700})+cell(380,50,'잡은 사기',cm.TP,AC)+cell(505,50,'오경보',cm.FP,OR)+cell(380,130,'놓친 사기',cm.FN,OR)+cell(505,130,'정상 통과',cm.TN,MU);
 const r=Mx.rates(cm);b+=H.t(505,232,`정밀도 ${pc(r.precision)} · 재현율 ${pc(r.recall)}`,{size:14})+H.t(505,258,`정확도 ${pc(r.accuracy)}`,{size:14});
 return {svg:H.svg(`정상과 사기의 점수 분포 위에서 문턱이 움직이고, 문턱 0.5의 혼동 행렬은 잡은 사기 ${cm.TP}, 오경보 ${cm.FP}, 놓친 사기 ${cm.FN}`,b),caption:'가상 사기 점수 1,000건으로 실제 계산했습니다. 문턱 선이 0.3, 0.5, 0.7로 옮겨 가는 동안 두 분포의 어느 부분이 경보가 되는지 보세요.'};};

F.tradeoff=H=>{const R=Array.from({length:12},(_,d)=>Mx.biasVariance(d,{reps:40})),sx=d=>60+d*30,sy=v=>240-Math.min(v,1.2)/1.2*190;
 const path=k=>R.map((r,d)=>(d?'L':'M')+sx(d)+' '+sy(r[k]).toFixed(1)).join('');
 let b=`<path d="M60 240H400M60 50V240" stroke="var(--line)"/>`+`<path class="fig-draw" d="${path('bias2')}" fill="none" stroke="${BL}" stroke-width="3"/>`+`<path class="fig-draw" d="${path('variance')}" fill="none" stroke="${OR}" stroke-width="3" style="animation-delay:.6s"/>`+`<path class="fig-draw" d="${path('total')}" fill="none" stroke="${AC}" stroke-width="4" style="animation-delay:1.2s"/>`;
 [0,5,11].forEach(d=>{b+=H.t(sx(d),262,String(d),{size:13});});const best=R.reduce((a,r,d)=>r.total<R[a].total?d:a,0);b+=H.pulse(sx(best),sy(R[best].total),8,AC);
 b+=H.t(230,286,'다항식 차수',{size:14})+H.t(60,38,'오차(1.2에서 자름)',{a:'start',size:13,fill:MU});
 b+=H.t(430,80,'편향²',{a:'start',fill:BL,w:700})+H.t(430,110,'분산',{a:'start',fill:OR,w:700})+H.t(430,140,'기대 오차',{a:'start',fill:AC,w:700})+H.t(430,184,`가장 낮은 곳: ${best}차`,{a:'start',size:14})+H.t(430,210,`편향² ${f2(R[best].bias2,3)} + 분산 ${f2(R[best].variance,3)}`,{a:'start',size:14})+H.t(430,236,`+ 잡음 ${f2(R[best].noise,3)}`,{a:'start',size:14});
 return {svg:H.svg(`다항식 차수가 오르면 편향²은 줄고 분산은 커져 기대 오차가 ${best}차에서 가장 낮은 U자를 그리는 그림`,b),caption:'점 12개짜리 데이터를 40벌 뽑아 실제로 맞춘 결과입니다(실험은 80벌). 차수가 높을수록 왼쪽 파란 선은 내려가고 주황 선은 치솟습니다.'};};

F.pipeline=H=>{let b=H.t(320,30,'시간 순서대로 놓인 결제 기록',{w:700});
 const seg=[[30,300,'학습',BL],[335,140,'검증',AC],[480,130,'시험',OR]];seg.forEach(([x,w,n,c],i)=>{b+=H.blink(H.box(x,50,w,60,c)+H.t(x+w/2,86,n,{w:700}),i*.6);});
 b+=H.t(130,140,'변환은 여기서만 맞춤',{size:14})+H.line('M130 150V190',AC)+H.dot(130,152,0,36,AC,0,5);
 b+=H.box(30,195,220,56,AC)+H.t(140,228,'파이프라인(변환 + 모델)',{size:14,w:700});
 b+=`<path class="fig-dash" d="M545 112C545 200 330 200 300 114" fill="none" stroke="${OR}" stroke-width="2.5"/>`+H.dot(545,116,-245,0,OR,1,5)+H.t(440,206,'누설: 미래나 시험 정답이 학습으로 새어 듦',{size:14,fill:OR});
 b+=H.t(450,236,'막는 법: 나누기를 먼저, 시간은 앞으로만,',{size:14})+H.t(450,258,'겹마다 변환을 새로 맞추기',{size:14})+H.t(320,288,'검증 점수는 이 경계가 지켜졌을 때만 미래 성능의 추정이 됩니다.',{size:13,fill:MU});
 return {svg:H.svg('학습, 검증, 시험 구간을 시간 순서로 놓고 변환은 학습 구간에서만 맞추며, 미래 정보가 거꾸로 새어 드는 누설 경로를 점선으로 보인 그림',b),caption:'개념을 보여 주는 비유 그림입니다. 숫자 증거는 아래 두 실험(무작위 라벨의 목표 인코딩, 미래를 엿본 이동 평균)에서 실제로 계산합니다.'};};

F.rare=H=>{const o0=Mx.outlierLab(0),o20=Mx.outlierLab(20),sx=v=>40+v/16*280;
 let b=H.t(180,30,'이상 탐지: 기준이 오염되면',{w:700})+`<path d="M40 150H320" stroke="var(--line)"/>`;
 [0,4,8,12,16].forEach(v=>{b+=H.t(sx(v),170,String(v),{size:13});});
 for(let i=0;i<10;i++)b+=sq(sx(10.5+i*.6),150,OR,4);
 const fence=(v,y,c,n,d)=>H.blink(`<path d="M${sx(v)} ${y}V150" stroke="${c}" stroke-width="3"/>`+H.t(sx(v),y-6,n,{size:13,fill:c}),d);
 b+=fence(o0.mean+3*o0.std,70,AC,'깨끗한 z 경계',0)+fence(o0.hi,105,BL,'IQR 경계',.6);
 b+=H.dot(sx(o0.mean+3*o0.std),88,sx(Math.min(16,o20.mean+3*o20.std))-sx(o0.mean+3*o0.std),0,OR,1.2,6)+H.t(180,200,`큰 값 20건이 섞이면 z 경계가 ${f2(o20.mean+3*o20.std,1)}까지 밀려`,{size:14})+H.t(180,222,`진짜 이상 10건을 모두 놓침(IQR은 ${o20.iqrHit}건 탐지)`,{size:14});
 b+=H.t(500,30,'불균형: 사기 20건 vs 정상 400건',{w:700})+H.grow(370,60,250,22,BL,0)+H.t(380,77,'정상 400',{a:'start',size:13,fill:'var(--bg)'})+H.grow(370,90,12.5,22,OR,.3)+H.t(390,107,'사기 20',{a:'start',size:13});
 const a={x:420,y:200},c={x:590,y:160};b+=sq(a.x,a.y)+sq(c.x,c.y)+H.line(`M${a.x} ${a.y}L${c.x} ${c.y}`,MU)+H.dot(a.x,a.y,c.x-a.x,c.y-a.y,OR,0,5)+H.t(505,240,'SMOTE: 두 사기 사이에 새 점',{size:14});
 b+=H.t(320,282,'가중치나 재표본은 재현율을 올리고 오경보를 늘립니다.',{size:13,fill:MU});
 return {svg:H.svg('왼쪽은 오염된 기준에서 z-점수 경계가 밀려나 이상을 놓치는 모습, 오른쪽은 사기 20건 대 정상 400건의 불균형과 SMOTE가 두 사기 사이에 새 점을 만드는 모습',b),caption:'왼쪽 경계값은 가상 결제 금액(만 원)으로 실제 계산했고, 오른쪽 SMOTE 그림은 원리를 보여 주는 비유입니다.'};};

F.final=H=>{const P=['keep','retune','retrain'].map(p=>Mx.driftLab(2,p)),N=['문턱 유지','문턱만 재조정','재학습(가정)'],mx=Math.max(...P.map(r=>r.cost));
 const curve=(mu,c,extra='',sd=1.1)=>{let d='';for(let x=-5;x<=5.01;x+=.25){const y=Math.exp(-((x-mu)**2)/(2*sd*sd));d+=(d?'L':'M')+(40+(x+5)*28).toFixed(1)+' '+(200-y*110).toFixed(1);}return `<path d="${d}" fill="none" stroke="${c}" stroke-width="3"${extra}/>`;};
 let b=H.t(180,30,'사기 점수 분포가 정상 쪽으로 이동',{w:700})+`<path d="M40 200H320" stroke="var(--line)"/>`+curve(-2.2,BL,'',1)+curve(0.2,OR,' stroke-dasharray="6 5"')+H.blink(curve(-1.8,OR),.4,'fig-seq')+H.dot(40+5.2*28,92,-2*28,0,OR,0,6);
 b+=H.t(180,226,'파랑 정상 · 점선 사기(전) · 실선 사기(후)',{size:13,fill:MU});
 b+=H.t(480,30,'이동량 2의 결제 1,000건당 비용',{w:700});
 P.forEach((r,i)=>{const y=56+i*62;b+=H.t(350,y+16,N[i],{a:'start',size:14})+H.grow(350,y+24,r.cost/mx*210,18,i===2?AC:OR,i*.4)+H.t(625,y+40,f2(r.cost,1),{a:'end',size:14,w:700});});
 b+=H.t(320,268,'관찰하고 가설을 세운 뒤 실험으로 고릅니다. 재학습 숫자는 가정입니다.',{size:14})+H.t(320,290,'놓친 사기 1건 = 오경보 20건으로 계산',{size:13,fill:MU});
 return {svg:H.svg(`사기 점수 분포가 이동했을 때 문턱 유지 ${f2(P[0].cost,1)}, 문턱 재조정 ${f2(P[1].cost,1)}, 재학습 ${f2(P[2].cost,1)}의 비용을 비교하는 그림`,b),caption:'왼쪽 분포는 실험에 쓰는 점수 생성 가정(로짓 공간의 정규분포)을 그린 것이고, 오른쪽 비용은 실제 계산입니다. 재학습 효과는 가정한 시나리오입니다.'};};

/* 기본 그림: flow 단계를 상자로 놓고 점이 차례로 지나간다. 장마다 F[장ID]로 고유 그림을 만든다. */
function fallback(c){
 const steps=c.flow.map(x=>x.split('|')),n=steps.length,w=(600-(n-1)*20)/n,colors=['var(--accent)','var(--blue)','var(--orange)','var(--accent)'];
 let b='';steps.forEach(([a,s],i)=>{const x=20+i*(w+20);b+=blink(box(x,90,w,110,colors[i%4]),i*.6)+t(x+w/2,140,a,{w:700})+t(x+w/2,168,s.length>14?s.slice(0,14)+'…':s,{size:12,fill:'var(--muted)'});if(i<n-1)b+=line(`M${x+w} 145H${x+w+20}`)+dot(x+w-4,145,24,0,colors[i%4],i*.6,5);});
 return {svg:svg(`${c.title}의 흐름: ${steps.map(s=>s[0]).join(', ')}`,b),caption:`${c.subtitle}`};
}
function render(c){return F[c.id]?F[c.id](H):fallback(c);}
return {render,F,H};
})();
