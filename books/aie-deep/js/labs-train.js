/* 5~9장 실험: 손실의 기울기, 옵티마이저 경로, 학습률 일정, 초기화와 신호, 드롭아웃과 감쇠.
   원 판별기 학습은 A04Math.train이 실제로 계산한다(전체 배치, 고정 시드). */
(()=>{
'use strict';
const U=A04UI,M=A04Math,F=U.fmt,R=U.range,S=U.select;
const pairs=a=>a.map((v,i)=>[i+1,v]).filter(p=>p[1]!==null&&Number.isFinite(p[1]));
const sci=v=>Math.abs(v)<1e-3||Math.abs(v)>=1e4?v.toExponential(2):F(v,3);

A04Labs.lossgrad=el=>{
 U.setup(el,R('lg-p','예측 확률 p (정답은 1)',0.01,0.99,0.01,0.3));
 U.bind(el,()=>{const p=U.value(el,'lg-p'),l=M.lossAt(p),ps=Array.from({length:99},(_,i)=>(i+1)/100);
  U.result(el,U.plot({lines:[{data:ps.map(q=>[q,Math.abs(M.lossAt(q).gBce)]),color:'var(--orange)'},{data:ps.map(q=>[q,Math.abs(M.lossAt(q).gMse)]),color:'var(--blue)',dashed:true}],points:[[p,Math.abs(l.gBce),'var(--orange)',6],[p,Math.abs(l.gMse),'var(--blue)',6]],xmin:0,xmax:1,ymin:0,ymax:1,xlabel:'예측 확률 p',ylabel:'|∂L/∂z|',label:'예측 확률에 따른 교차 엔트로피(실선)와 제곱 오차(점선)의 로짓 기울기 크기'}),
  `p = ${F(p)} · 손실: 교차 엔트로피 <b>${F(l.bce,3)}</b>, 제곱 오차 <b>${F(l.mse,3)}</b><br>로짓 기울기: 교차 엔트로피 p − 1 = <strong>${F(l.gBce,3)}</strong>, 제곱 오차 2(p − 1)p(1 − p) = <strong>${F(l.gMse,4)}</strong><br>`+
  (p<0.2?`크게 틀린 상황입니다. 교차 엔트로피 기울기가 제곱 오차보다 <b>${F(Math.abs(l.gBce/l.gMse),1)}배</b> 커서 훨씬 강하게 고칩니다.`:p>0.8?'거의 맞힌 상황이라 두 기울기가 모두 작습니다.':'중간 영역에서는 두 기울기의 차이가 비교적 작습니다.')+'<br>표본 하나에 대한 공식 계산입니다.');});
};

/* 골짜기 등고선 위에 경로를 그린다. */
function valleyChart(r){
 const X=x=>240+x*52,Y=y=>140-y*80;let b='';
 [0.5,2,4.5,8,12].forEach(l=>b+=`<ellipse cx="240" cy="140" rx="${Math.sqrt(2*l)*52}" ry="${Math.sqrt(2*l/25)*80}" fill="none" stroke="var(--line)"/>`);
 const pts=r.path.map(([x,y])=>[X(x),Y(y)].map(v=>Math.max(-500,Math.min(1000,v))));
 b+=`<defs><clipPath id="a04-vl-clip"><rect x="0" y="0" width="480" height="280"/></clipPath></defs><polyline clip-path="url(#a04-vl-clip)" points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="var(--orange)" stroke-width="2.5"/>`;
 pts.forEach((p,i)=>{if(i%4===0&&p[0]>0&&p[0]<480&&p[1]>0&&p[1]<280)b+=`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="var(--orange)"/>`;});
 b+=`<circle cx="${X(-4)}" cy="${Y(1.2)}" r="6" fill="var(--text)"/><text x="${X(-4)}" y="${Y(1.2)-12}" text-anchor="middle">출발</text><circle cx="240" cy="140" r="5" fill="var(--accent)"/><text x="250" y="132">최솟값</text><text x="12" y="270">f(x, y) = ½(x² + 25y²) · 점은 4걸음마다</text>`;
 return U.svg(b,'골짜기 등고선 위 옵티마이저 경로. 숫자 결과는 아래 결과 문장에 있습니다.');
}
A04Labs.valley=el=>{
 U.setup(el,S('vl-opt','옵티마이저',[['sgd','SGD'],['momentum','모멘텀 (β = 0.9)'],['adam','Adam']],'sgd')+R('vl-lr','학습률 η',0.01,0.3,0.01,0.05));
 U.bind(el,()=>{const o=U.text(el,'vl-opt'),lr=U.value(el,'vl-lr'),r=M.valley(o,lr,40),end=r.path[r.path.length-1];
  const name={sgd:'SGD',momentum:'모멘텀',adam:'Adam'}[o];
  const f0=0.5*(16+25*1.44),grew=r.diverged||r.f>f0;U.result(el,valleyChart(r),grew?`${name} · η = ${F(lr)} · <strong>${r.diverged?r.diverged+'걸음째에 발산했습니다':'40걸음 뒤 손실이 출발점보다 커졌습니다(발산)'}.</strong> 가파른 세로 방향에서 한 걸음이 골짜기 폭보다 커져 점점 멀리 튕겨 나갑니다.${o==='sgd'?' SGD는 η가 2/25 = 0.08을 넘으면 이렇게 됩니다.':''}<br>실제 계산입니다.`:
  `${name} · η = ${F(lr)} · 40걸음 뒤 위치 (${F(end[0])}, ${F(end[1])}), 손실 f = <strong>${sci(0.5*(end[0]**2+25*end[1]**2))}</strong> (출발 f = ${F(0.5*(16+25*1.44))})<br>`+
  (o==='sgd'?'SGD는 학습률을 세로 방향에 맞춰 작게 잡아야 해서 가로 방향 진행이 느립니다.':o==='momentum'?'모멘텀은 부호가 바뀌는 세로 성분을 평균으로 지우고 가로 성분을 쌓아 속도를 냅니다.':'Adam은 방향마다 기울기 크기로 나누어 보폭을 학습률 근처로 맞춥니다. 그래서 η가 작으면 출발점에서 4만큼 떨어진 최솟값까지 오래 걸립니다.')+'<br>2차원 교육용 함수에서 실제로 계산한 경로입니다.');});
};

A04Labs.schedule=el=>{
 const KINDS=[['const','상수'],['step','계단 감쇠'],['cosine','코사인'],['warmcos','워밍업 + 코사인'],['onecycle','1cycle']];
 U.setup(el,S('sc-kind','학습률 일정',KINDS,'const')+S('sc-peak','최대 학습률',[[0.02,'0.02'],[0.1,'0.1'],[0.3,'0.3'],[1,'1.0']],0.3));
 U.bind(el,()=>{const k=U.text(el,'sc-kind'),peak=U.value(el,'sc-peak'),r=M.train({schedule:k,lr:peak,epochs:150,seed:1});
  const early=Math.max(...r.loss.slice(1,30)),start=r.loss[0];
  U.result(el,U.plot({lines:[{data:pairs(r.loss),color:'var(--accent)'},{data:r.lrs.map((v,i)=>[i+1,v/peak]),color:'var(--orange)',dashed:true}],xmin:0,xmax:150,ymin:0,ymax:Math.max(1,Math.ceil(Math.max(...r.loss)*5)/5),xlabel:'학습 단계',ylabel:'손실(실선) · 학습률/최대(점선)',label:`${KINDS.find(x=>x[0]===k)[1]} 일정의 학습률과 학습 손실`}),
  `${KINDS.find(x=>x[0]===k)[1]} · 최대 η = ${peak}<br>학습률: 1단계 ${sci(r.lrs[0])}, 75단계 ${sci(r.lrs[74])}, 150단계 ${sci(r.lrs[149])}<br>첫 손실 ${F(start,3)} · 2~30단계 최대 손실 <b>${F(early,3)}</b>${early>start+0.01?' (초반에 손실이 한 번 튀었습니다)':''}<br>150단계 뒤 학습 손실 <strong>${F(r.trainLoss,3)}</strong>, 검증 정확도 <strong>${F(r.valAcc*100,1)}%</strong><br>은닉 8개 tanh 원 판별기를 AdamW로 실제 학습한 한 번의 결과(시드 1)입니다.`);});
};

A04Labs.depthsignal=el=>{
 const INITS=[['small','작은 값 N(0, 0.01²)'],['std','표준정규 N(0, 1)'],['xavier','Xavier'],['he','He']];
 U.setup(el,S('ds-init','초기화',INITS,'small')+S('ds-act','활성화',[['tanh','tanh'],['relu','ReLU']],'tanh')+R('ds-depth','층 수',5,50,5,20));
 U.bind(el,()=>{const init=U.text(el,'ds-init'),a=U.text(el,'ds-act'),L=U.value(el,'ds-depth'),s=M.deepStats(a,init,L).fwd,lg=s.map(v=>Math.log10(Math.max(v,1e-300)));
  const lo=Math.min(-3,Math.floor(Math.min(...lg))),hi=Math.max(1,Math.ceil(Math.max(...lg))),mid=Math.floor(L/2);
  const verdict=s[L-1]<1e-3?'신호가 사라졌습니다. 다음 층과 출력이 입력과 거의 무관해집니다.':s[L-1]>1e3?'신호가 폭발했습니다. 값이 커져 계산이 불안정해집니다.':s[L-1]<0.05?'신호가 꽤 줄었습니다. 층을 더 쌓으면 사라질 수 있습니다.':'신호 크기가 층을 지나도 유지됩니다.';
  U.result(el,U.plot({lines:[{data:lg.map((v,i)=>[i+1,v]),color:'var(--accent)'}],xmin:1,xmax:L,ymin:lo,ymax:hi,xlabel:'층 번호',ylabel:'log₁₀ 활성값 표준편차',label:'층마다 활성값 표준편차(로그 눈금)'}),
  `${INITS.find(x=>x[0]===init)[1]} · ${a==='relu'?'ReLU':'tanh'} · ${L}층<br>활성값 표준편차: 1층 <b>${sci(s[0])}</b>, ${mid+1}층 <b>${sci(s[mid])}</b>, ${L}층 <strong>${sci(s[L-1])}</strong><br>${verdict}<br>폭 48 정방 층에 표준정규 입력 12개를 흘려 실제로 잰 학습 전 값입니다.`);});
};

A04Labs.dropout=el=>{
 U.setup(el,R('do-p','드롭아웃 비율 p',0,0.6,0.1,0)+S('do-wd','가중치 감쇠 λ',[[0,'0 (없음)'],[0.3,'0.3'],[1,'1.0']],0));
 U.bind(el,()=>{const p=U.value(el,'do-p'),wd=U.value(el,'do-wd'),r=M.train({n:40,noise:0.15,width:32,epochs:400,lr:0.03,dropout:p,wd,seed:2}),gap=r.trainAcc-r.valAcc;
  U.result(el,U.plot({lines:[{data:pairs(r.loss),color:'var(--blue)'},{data:pairs(r.val),color:'var(--accent)',dashed:true}],xmin:0,xmax:400,ymin:0,ymax:2.5,xlabel:'epoch',ylabel:'손실',label:'학습 손실(실선)과 검증 손실(점선)'}),
  `드롭아웃 p = ${F(p,1)}, 감쇠 λ = ${wd}<br>학습 정확도 <b>${F(r.trainAcc*100,1)}%</b> (라벨 15%가 뒤집힌 학습점 40개 기준) · 검증 정확도 <strong>${F(r.valAcc*100,1)}%</strong> (깨끗한 새 점 200개)<br>일반화 격차 <strong>${F(gap*100,1)}%p</strong>, 최종 검증 손실 ${F(r.valLoss,3)}<br>`+
  (r.trainAcc>0.97?'학습 정확도가 100% 가까이면 뒤집힌 라벨까지 외웠다는 뜻입니다.':gap<0.05?'격차가 작습니다. 이제는 학습 점수도 함께 낮지 않은지(과소적합) 확인하세요.':'규제가 외우기를 일부 막고 있습니다.')+'<br>은닉 32개 tanh 망을 AdamW로 실제 학습한 한 번의 결과(시드 2)입니다.');});
};
})();
