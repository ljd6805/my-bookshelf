/* 1~4장 실험: 퍼셉트론, 손으로 정한 XOR 망, 연쇄법칙, XOR 학습, 활성화와 깊이.
   계산은 모두 A04Math가 하고, 여기서는 입력을 읽어 그림과 결과 문장을 그린다. */
(()=>{
'use strict';
const U=A04UI,M=A04Math,F=U.fmt,R=U.range,S=U.select;
const ACTS=[['sigmoid','시그모이드'],['tanh','tanh'],['relu','ReLU'],['leaky','Leaky ReLU'],['gelu','GELU'],['swish','Swish']];
const name=k=>(ACTS.find(a=>a[0]===k)||[k,k])[1];

/* 네 모서리 점과 경계선, 오른쪽에 학습 회차별 틀린 점 수 */
function gateChart(gate,r){
 const ox=30,oy=30,s=200,X=v=>ox+20+v*(s-40),Y=v=>oy+s-20-v*(s-40),Yv=M.GATES[gate];let b=`<defs><clipPath id="a04-pc-clip"><rect x="${ox}" y="${oy}" width="${s}" height="${s}"/></clipPath></defs><rect x="${ox}" y="${oy}" width="${s}" height="${s}" rx="6" fill="var(--panel2)" stroke="var(--line)"/>`;
 const [w1,w2]=r.w,bb=r.b;let d='';
 if(Math.abs(w1)+Math.abs(w2)>1e-9){if(Math.abs(w2)<1e-9){const x0=-bb/w1;d=`M${X(x0)} ${oy}V${oy+s}`;}else{const y=x=>(-bb-w1*x)/w2;d=`M${X(-0.3)} ${Y(y(-0.3))}L${X(1.3)} ${Y(y(1.3))}`;}}
 if(d)b+=`<path clip-path="url(#a04-pc-clip)" d="${d}" stroke="var(--orange)" stroke-width="3" fill="none"/>`;
 M.CORNERS.forEach(([a,c],i)=>{const ok=r.predict[i]===Yv[i];b+=`<circle cx="${X(a)}" cy="${Y(c)}" r="13" fill="${Yv[i]?'var(--accent)':'var(--chart)'}" stroke="${ok?'var(--accent)':'var(--orange)'}" stroke-width="${ok?2:4}"/><text x="${X(a)}" y="${Y(c)+5}" text-anchor="middle" fill="${Yv[i]?'var(--bg)':'var(--text)'}">${Yv[i]}</text>`;});
 b+=`<text x="${ox+s/2}" y="${oy+s+24}" text-anchor="middle">정답 1·0 · 주황 테두리 = 틀린 점</text>`;
 const n=r.hist.length,bw=Math.min(14,190/n);b+=`<text x="262" y="40">회차별 틀린 점 수</text><path d="M262 230H462" stroke="var(--line)"/>`;
 r.hist.forEach((h,i)=>{const hh=h.errors*40;b+=`<rect x="${262+i*(190/n)}" y="${230-hh}" width="${Math.max(2,bw-2)}" height="${hh}" fill="${h.errors?'var(--orange)':'var(--accent)'}"/>`;});
 b+=`<text x="262" y="252">1회</text><text x="462" y="252" text-anchor="end">${n}회</text>`;
 return U.svg(b,`${gate} 네 점과 ${n}회 학습 뒤의 결정 경계, 회차별 틀린 점 수`);
}
A04Labs.perceptron=el=>{
 U.setup(el,S('pc-gate','배울 게이트',[['AND','AND'],['OR','OR'],['NAND','NAND'],['XOR','XOR']],'AND')+R('pc-epochs','학습 횟수 (네 점을 한 바퀴 = 1회)',1,30,1,3));
 U.bind(el,()=>{const g=U.text(el,'pc-gate'),e=U.value(el,'pc-epochs'),r=M.perceptron(g,e),last=r.hist[e-1];
  const msg=r.converged?`<strong>${r.convergedAt}회째에 틀린 점 0개</strong>로 수렴했습니다. 그 뒤로는 오류가 없어 가중치가 바뀌지 않습니다.`:g==='XOR'?`<strong>아직 수렴하지 않았습니다.</strong> XOR은 직선 하나로 나눌 수 없어서 횟수를 늘려도 오류가 0이 되지 않습니다.`:`<strong>아직 수렴하지 않았습니다.</strong> 학습 횟수를 더 늘려 보세요.`;
  U.result(el,gateChart(g,r),`${g} · ${e}회 학습 뒤 w = (<b>${F(r.w[0])}</b>, <b>${F(r.w[1])}</b>), b = <b>${F(r.b)}</b>, 마지막 회차에 틀린 점 <b>${last.errors}개</b><br>경계선: ${F(r.w[0])}·x₁ + ${F(r.w[1])}·x₂ + ${F(r.b)} = 0<br>${msg}<br>퍼셉트론 학습 규칙(η = 0.1, 0에서 시작)을 실제로 계산한 결과입니다.`);});
};

A04Labs.xorforward=el=>{
 U.setup(el,R('xf-k','가중치 크기 k',1,20,1,5)+S('xf-act','은닉·출력 활성화',[['sigmoid','시그모이드'],['linear','없음(항등)']],'sigmoid'));
 U.bind(el,()=>{const k=U.value(el,'xf-k'),a=U.text(el,'xf-act'),rows=M.xorForward(k,a),target=M.GATES.XOR;
  const pred=rows.map(r=>r.out>=0.5?1:0),ok=pred.every((p,i)=>p===target[i]),same=rows.every(r=>Math.abs(r.out-rows[0].out)<1e-9);
  U.result(el,U.bars(rows.map((r,i)=>`${r.x.join(',')} → 정답 ${target[i]}`),rows.map(r=>r.out),'출력',a==='sigmoid'?0.5:null,3),
  `k = ${k}, ${a==='sigmoid'?'시그모이드':'활성화 없음'}<br>${rows.map(r=>`(${r.x.join(',')}): h₁ ${F(r.h1,3)}, h₂ ${F(r.h2,3)} → 출력 <b>${F(r.out,3)}</b>`).join('<br>')}<br>`+
  (a==='linear'?`<strong>네 출력이 ${same?'모두 같습니다':'직선 위에 놓입니다'}.</strong> 활성화가 없으면 h₁ + h₂가 늘 ${F(k,0)}로 일정해 출력이 입력과 무관해집니다. 선형층을 쌓아도 선형층 하나입니다.`:`0.5 기준 판정 ${pred.join(', ')} → <strong>${ok?'XOR과 일치':'아직 XOR이 아님'}</strong>. k가 클수록 시그모이드가 계단처럼 날카로워져 출력이 0과 1에 붙습니다.`)+'<br>손으로 정한 가중치로 실제 계산한 순전파입니다.');});
};

A04Labs.chain=el=>{
 U.setup(el,R('ch-w','가중치 w',-3,3,0.1,0.8));
 U.bind(el,()=>{const w=U.value(el,'ch-w'),c=M.chain(w),ws=Array.from({length:61},(_,i)=>-3+i*0.1),line=ws.map(v=>[v,M.chain(v).L]);
  const tan=[[w-0.8,c.L-0.8*c.dLdw],[w+0.8,c.L+0.8*c.dLdw]];
  U.result(el,U.plot({lines:[{data:line,color:'var(--accent)'},{data:tan,color:'var(--orange)',dashed:true}],points:[[w,c.L,'var(--orange)',6]],xmin:-3,xmax:3,ymin:0,ymax:1,xlabel:'w',ylabel:'손실 L',label:`w에 따른 손실 곡선과 w = ${F(w,1)}에서의 접선`}),
  `순전파: z = ${F(w,1)}×1.5 − 0.5 = <b>${F(c.z,3)}</b>, a = σ(z) = <b>${F(c.a,3)}</b>, L = (a − 1)² = <b>${F(c.L,4)}</b><br>역전파: dL/da = 2(a − 1) = <b>${F(c.dLda,4)}</b> · da/dz = a(1 − a) = <b>${F(c.dadz,4)}</b> · dz/dw = x = 1.5<br>곱하면 dL/dw = <strong>${F(c.dLdw,5)}</strong>, 수치 미분 = <b>${F(c.numeric,5)}</b> (차이 ${Math.abs(c.dLdw-c.numeric).toExponential(1)})<br>주황 점선은 이 기울기를 가진 접선입니다. 실제 계산입니다.`);});
};

A04Labs.xortrain=el=>{
 U.setup(el,R('xt-lr','학습률 η',0.1,8,0.1,2)+S('xt-seed','시작 가중치 시드',[[1,'시드 1'],[3,'시드 3'],[6,'시드 6'],[8,'시드 8']],1));
 U.bind(el,()=>{const lr=U.value(el,'xt-lr'),seed=U.value(el,'xt-seed'),r=M.train({data:'xor',width:2,act:'sigmoid',opt:'sgd',lr,epochs:1000,seed});
  const outs=M.CORNERS.map(x=>M.predict(r.net,x,'sigmoid')),ok=outs.every((p,i)=>(p>=0.5?1:0)===M.GATES.XOR[i]);
  const L=r.loss.map((v,i)=>[i+1,v]);
  U.result(el,U.plot({lines:[{data:L,color:'var(--accent)'}],xmin:0,xmax:1000,ymin:0,ymax:0.8,xlabel:'갱신 횟수',ylabel:'교차 엔트로피',label:'XOR 학습 손실 곡선'}),
  `η = ${F(lr,1)}, 시드 ${seed} · 1,000번 갱신 뒤 손실 <strong>${F(r.trainLoss,3)}</strong><br>출력: ${M.CORNERS.map((x,i)=>`(${x.join(',')}) ${F(outs[i],3)}`).join(', ')} → <b>${ok?'XOR을 배웠습니다':'XOR을 아직 못 배웠습니다'}</b><br>`+
  (ok?'':r.trainLoss>0.6?'손실이 0.69(반반 찍기) 근처면 기울기가 너무 작아 거의 움직이지 못한 경우입니다. 학습률을 키우거나 시드를 바꿔 보세요.':'손실이 0.35 근처에서 멈췄다면 네 점 중 일부만 맞히는 지점(국소 최솟값이나 시그모이드 포화)에 빠진 경우입니다.')+
  '<br>시그모이드 2-2-1 망, 전체 배치 SGD로 실제 학습한 결과입니다.');});
};

A04Labs.actcurve=el=>{
 U.setup(el,S('ac-act','활성화 함수',ACTS,'sigmoid')+R('ac-z','입력 z',-5,5,0.1,1));
 U.bind(el,()=>{const a=U.text(el,'ac-act'),z=U.value(el,'ac-z'),xs=Array.from({length:101},(_,i)=>-5+i*0.1);
  const fv=M.act(a,z),dv=M.dact(a,z);
  U.result(el,U.plot({lines:[{data:xs.map(x=>[x,M.act(a,x)]),color:'var(--accent)'},{data:xs.map(x=>[x,M.dact(a,x)]),color:'var(--orange)',dashed:true}],points:[[z,fv,'var(--accent)',6],[z,dv,'var(--orange)',6]],xmin:-5,xmax:5,ymin:-1.5,ymax:2.5,xlabel:'z',ylabel:'값(실선)·기울기(점선)',label:`${name(a)} 함수와 도함수`}),
  `${name(a)} · z = ${F(z,1)}에서 값 <b>${F(fv,4)}</b>, 기울기 <strong>${F(dv,4)}</strong><br>`+(Math.abs(dv)<0.05?'기울기가 0에 가까워 이 지점의 뉴런은 역전파 신호를 거의 전달하지 못합니다(포화 또는 꺼짐).':dv>=0.9?'기울기가 1 근처라 역전파 신호가 거의 줄지 않고 지나갑니다.':'기울기가 1보다 작아 역전파 신호가 이 비율로 줄어듭니다.')+'<br>공식으로 실제 계산한 값입니다.');});
};

A04Labs.depthgrad=el=>{
 U.setup(el,S('dg-act','활성화 함수',[['sigmoid','시그모이드'],['tanh','tanh'],['relu','ReLU'],['gelu','GELU']],'sigmoid')+R('dg-depth','층 수 L',2,30,1,10));
 U.bind(el,()=>{const a=U.text(el,'dg-act'),L=U.value(el,'dg-depth'),s=M.deepStats(a,'he',L).bwd,lg=s.map(v=>Math.log10(Math.max(v,1e-300)));
  const lo=Math.min(-2,Math.floor(Math.min(...lg))),hi=Math.max(1,Math.ceil(Math.max(...lg))),ratio=s[0]/s[L-1];
  U.result(el,U.plot({lines:[{data:lg.map((v,i)=>[i+1,v]),color:'var(--accent)'}],points:[[1,lg[0],'var(--orange)',6]],xmin:1,xmax:Math.max(2,L),ymin:lo,ymax:hi,xlabel:'층 번호 (1 = 입력 쪽)',ylabel:'log₁₀ 기울기 크기',label:`${name(a)} ${L}층에서 층별 기울기 크기`}),
  `${name(a)} · ${L}층 · He 초기화<br>마지막 층 기울기 <b>${s[L-1].toExponential(2)}</b>, 첫 층 기울기 <b>${s[0].toExponential(2)}</b><br>첫 층 ÷ 마지막 층 = <strong>${ratio.toExponential(1)}</strong>. `+(ratio<1e-3?'앞쪽 층은 사실상 배우지 못합니다(기울기 소실).':ratio>10?'앞쪽으로 갈수록 기울기가 커집니다(폭주 경향).':'층을 지나도 기울기 크기가 크게 변하지 않습니다.')+'<br>폭 48, 무작위 입력 12개로 실제 계산한 학습 시작 시점의 값입니다.');});
};
})();
