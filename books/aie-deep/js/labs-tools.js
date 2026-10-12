/* 10~12장 실험: 자동미분 엔진의 순서, 모델 크기, 고장 진단, 기울기 검사, 마지막 과제. */
(()=>{
'use strict';
const U=A04UI,M=A04Math,F=U.fmt,R=U.range,S=U.select;
const pairs=a=>a.map((v,i)=>[i+1,v]).filter(p=>p[1]!==null&&Number.isFinite(p[1]));

A04Labs.autodiff=el=>{
 U.setup(el,S('ad-expr','식',[['reuse','f = a·b + a (a를 두 번 씀)'],['neuron','L = (σ(w·x + b) − y)²']],'reuse')+R('ad-step','역방향 단계 (끝을 넘으면 완료)',0,5,1,0));
 U.bind(el,()=>{const e=U.text(el,'ad-expr'),k=U.value(el,'ad-step'),r=M.autodiff(e),n=r.order.length,i=Math.min(k,n),snap=r.snaps[i];
  const names=[...r.order,...r.vars],cur=i>0?r.order[i-1]:null;
  const items=names.map(id=>[`${id}${r.vars.includes(id)?' (입력)':''}`,`값 ${F(r.val[id],3)} · 기울기 ${F(snap.grad[id],3)}`]);
  const node=r.nodes.find(x=>x[0]===cur);
  U.result(el,U.cards(items,cur?names.indexOf(cur):0),
  `역위상 순서: ${r.order.join(' → ')} (순전파의 반대)<br>`+(i===0?`0단계: 출력 ${r.order[0]}의 기울기를 1로 두고 시작합니다.`:`${i}단계: <b>${cur} = ${node[1]}</b>를 처리해 ${node[2].join(', ')}에 "위에서 온 기울기 × 국소 도함수"를 <b>더했습니다</b>.`)+
  (i>=n?`<br><strong>완료.</strong> ${r.vars.map(v=>`∂/∂${v} = ${F(r.grad[v],4)}`).join(', ')}`+(e==='reuse'?'<br>a는 c = a·b와 f = c + a 두 경로에서 기울기를 받아 b + 1 = −2가 됩니다. 덮어쓰지 않고 더해야 하는 이유입니다.':'<br>3장에서 손으로 곱한 dL/dw와 같은 값이 그래프 순회만으로 나옵니다.'):'')+'<br>작은 자동미분 엔진을 실제로 실행한 결과입니다.');});
};

A04Labs.memory=el=>{
 U.setup(el,R('mm-h1','첫 은닉층 폭 h1',16,512,16,256)+R('mm-h2','둘째 은닉층 폭 h2',16,256,16,128)+S('mm-dtype','가중치 자료형',[['float32','float32 (4바이트)'],['bfloat16','bfloat16 (2바이트)'],['int8','int8 (1바이트)']],'float32'));
 U.bind(el,()=>{const h1=U.value(el,'mm-h1'),h2=U.value(el,'mm-h2'),d=U.text(el,'mm-dtype'),sizes=[784,h1,h2,10],m=M.memory(sizes,d),MB=1e6;
  U.result(el,U.bars(['가중치','Adam 학습'],[m.weights/MB,m.trainAdam/MB],'MB',null,2),
  `784·${h1} + ${h1} + ${h1}·${h2} + ${h2} + ${h2}·10 + 10 = <strong>${m.params.toLocaleString('en-US')}개</strong> 파라미터<br>${d} 가중치 <b>${F(m.weights/MB,2)} MB</b> · Adam 학습 중(float32 가중치·기울기·m·v 4벌) 약 <b>${F(m.trainAdam/MB,2)} MB</b><br>`+
  (h1===256&&h2===128?'원본 레슨의 MNIST MLP와 같은 크기(235,146개)입니다.':`784-256-128-10 기준(235,146개)의 ${F(m.params/235146,2)}배입니다.`)+' 활성값과 프레임워크 부가 메모리는 넣지 않은 계산입니다.');});
};

const BUGS=[['none','정상'],['lr','학습률 과다 (×200)'],['nozero','기울기 비우기 누락 (zero_grad 없음)'],['labels','라벨 뒤섞임'],['scale','입력 정규화 누락 (×50)']];
const DIAG={none:'학습·검증 손실이 함께 내려갑니다. 이것이 비교 기준선입니다.',lr:'손실이 크게 출렁이며 내려가지 못합니다. 첫 대응은 학습률을 10분의 1로 낮추는 것입니다.',nozero:'지난 기울기가 계속 쌓여 갈수록 큰 걸음을 걷게 되어 손실이 오르내립니다. 루프에 기울기 비우기가 있는지 확인합니다.',labels:'학습 손실은 천천히 내려가지만 검증 손실은 오르고 검증 정확도는 반반 찍기보다 나쁩니다. 입력과 라벨의 짝을 확인합니다.',scale:'입력이 커서 tanh가 포화되어 학습점은 외우지만 새 점의 경계가 거칩니다. 입력을 평균 0, 표준편차 1 근처로 맞춥니다.'};
A04Labs.symptoms=el=>{
 U.setup(el,S('sy-bug','넣을 고장',BUGS,'none'));
 U.bind(el,()=>{const bug=U.text(el,'sy-bug'),r=M.train({bug,epochs:150,seed:1}),L=r.loss.slice(-30),swing=Math.max(...L)-Math.min(...L);
  U.result(el,U.plot({lines:[{data:pairs(r.loss),color:'var(--orange)'},{data:pairs(r.val),color:'var(--accent)',dashed:true},{data:[[0,0.693],[150,0.693]],color:'var(--muted)',dashed:true}],xmin:0,xmax:150,ymin:0,ymax:2,xlabel:'epoch',ylabel:'손실',label:'고장별 학습 손실(실선)과 검증 손실(점선), 회색 0.693'}),
  `${BUGS.find(b=>b[0]===bug)[1]}<br>최종 학습 손실 <b>${F(r.trainLoss,3)}</b>, 검증 손실 <b>${F(r.valLoss,3)}</b>, 마지막 30 epoch의 출렁임 폭 <b>${F(swing,3)}</b><br>학습 정확도 ${F(r.trainAcc*100,1)}% · 검증 정확도 <strong>${F(r.valAcc*100,1)}%</strong><br>진단: ${DIAG[bug]}<br>은닉 8개 tanh 원 판별기를 실제로 학습한 결과입니다(시드 1).`);});
};

A04Labs.gradcheck=el=>{
 U.setup(el,S('gc-eps','차분 간격 ε',[[0.1,'1e-1'],[0.001,'1e-3'],[0.00001,'1e-5'],[1e-7,'1e-7']],0.00001)+S('gc-bug','역전파 구현',[['none','올바름'],['sign','부호를 뒤집은 버그'],['factor','제곱의 2를 빠뜨린 버그']],'none'));
 U.bind(el,()=>{const eps=U.value(el,'gc-eps'),bug=U.text(el,'gc-bug'),r=M.gradCheck(eps,bug),lg=r.rel.map(v=>-Math.log10(Math.max(v,1e-16)));
  const verdict=r.max<1e-5?'정상 범위(1e-5 미만)입니다.':r.max>1e-3?'버그가 거의 확실합니다(1e-3 초과).':'애매한 범위입니다. ε를 바꿔 다시 확인합니다.';
  U.result(el,U.bars(['w₁','w₂','w₃'],lg,'일치 자릿수 = −log₁₀(상대 차이)',null,1),
  `ε = ${eps.toExponential(0)} · ${{none:'올바른 구현',sign:'부호 버그',factor:'계수 버그'}[bug]}<br>${['w₁','w₂','w₃'].map((n,i)=>`${n}: 해석 ${F(r.ana[i],6)} / 수치 ${F(r.num[i],6)} / 상대 차이 ${r.rel[i].toExponential(1)}`).join('<br>')}<br>최대 상대 차이 <strong>${r.max.toExponential(1)}</strong> → ${verdict}<br>`+(bug==='none'&&eps<1e-6?'ε가 너무 작으면 반올림 오차 때문에 오히려 일치도가 떨어질 수 있습니다.':'')+'막대가 길수록 두 기울기가 많은 자릿수까지 같습니다. 실제 계산입니다.');});
};

A04Labs.rescue=el=>{
 U.setup(el,S('rs-act','활성화',[['sigmoid','시그모이드'],['tanh','tanh'],['relu','ReLU']],'sigmoid')+S('rs-init','초기화',[['small','작은 값 N(0, 0.01²)'],['xavier','Xavier'],['he','He']],'small')+S('rs-opt','옵티마이저',[['sgd','SGD (η = 0.5)'],['adam','AdamW (η = 0.02)']],'sgd'));
 U.bind(el,()=>{const act=U.text(el,'rs-act'),init=U.text(el,'rs-init'),opt=U.text(el,'rs-opt'),r=M.train({depth:6,width:8,act,init,opt,lr:opt==='sgd'?0.5:0.02,epochs:200,seed:1});
  const g=r.gradNorm,ratio=g[0]/g[g.length-1],stuck=r.trainLoss>0.65;
  U.result(el,U.plot({lines:[{data:pairs(r.loss),color:'var(--orange)'},{data:pairs(r.val),color:'var(--accent)',dashed:true},{data:[[0,0.693],[200,0.693]],color:'var(--muted)',dashed:true}],xmin:0,xmax:200,ymin:0,ymax:1,xlabel:'epoch',ylabel:'손실',label:'깊은 판별기의 학습 손실(실선)과 검증 손실(점선)'}),
  `증거: 첫 epoch 기울기 크기 첫 층 <b>${g[0].toExponential(1)}</b>, 출력층 <b>${g[g.length-1].toExponential(1)}</b> (비율 ${ratio.toExponential(1)})<br>결과: 학습 손실 <strong>${F(r.trainLoss,3)}</strong>, 검증 정확도 <strong>${F(r.valAcc*100,1)}%</strong><br>`+
  (stuck?(ratio<1e-4?'아직 멈춰 있습니다. 앞층 기울기가 출력층보다 수만 배 이상 작으니 신호가 앞층까지 오지 못하는 것이 원인 후보입니다.':(g[g.length-1]<1e-3?'아직 멈춰 있습니다. 층 사이 비율은 괜찮지만 출력층 기울기부터 아주 작습니다. 활성값이 0 근처에 몰려 출력이 입력에 반응하지 않는지(초기화 크기) 의심해 보세요.':'아직 멈춰 있습니다. 앞층 기울기는 살아 있으니 걸음 크기나 다른 원인을 의심해 보세요.')):'학습이 되살아났습니다. 어떤 변경이 기울기 비율을 바꾸었는지 설명해 보세요.')+
  '<br>폭 8 × 6층, 시드 1의 실제 학습입니다. 다른 시드에서도 같은지는 확인하지 않았습니다.');});
};
})();
