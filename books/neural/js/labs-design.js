/* 8장과 마지막 과제 실험: 구조별 파라미터 수, 원 안팎 판별기 설계.
   판별기 학습은 NCMath.train이 실제로 계산한다(전체 배치 경사하강, 고정 시드). */
(()=>{
'use strict';
const U=NCUI,M=NCMath,F=U.fmt,S=U.select;
const int=n=>n.toLocaleString('en-US');

NCLabs.archparams=el=>{
 U.setup(el,S('ap-kind','입력 종류',[['gray','흑백 이미지 (채널 1)'],['color','컬러 이미지 (채널 3)'],['sequence','문장 (토큰 벡터 길이 32)']],'color')+S('ap-size','크기: 이미지 한 변(픽셀) 또는 문장 길이(토큰)',[[12,'12'],[28,'28'],[64,'64'],[224,'224'],[512,'512']],28));
 U.bind(el,()=>{const k=U.text(el,'ap-kind'),n=U.value(el,'ap-size'),img=k!=='sequence',C=k==='color'?3:1;
  const r=img?M.archParams('image',n,{channels:C}):M.archParams('sequence',n);
  const labels=img?['완전 연결','합성곱 3×3']:['완전 연결(펼침)','순환(RNN)','셀프 어텐션'],values=img?[r.dense,r.conv]:[r.dense,r.rnn,r.attention];
  U.result(el,U.bars(labels,values,'파라미터 (개)',null,0),
  (img?`${n}×${n} ${C===3?'컬러':'흑백'} 이미지 = 입력 숫자 <b>${int(r.inputs)}개</b>, 뉴런(필터) 64개<br>완전 연결: ${int(r.inputs)} × 64 + 64 = <strong>${int(r.dense)}개</strong><br>합성곱 3×3: 9 × ${C} × 64 + 64 = <strong>${int(r.conv)}개</strong> (완전 연결의 ${F(r.conv/r.dense*100,r.conv/r.dense<0.001?4:2)}%)<br>이미지 한 변을 바꿔도 합성곱 층의 수는 그대로입니다. 필터 하나를 모든 자리에서 다시 쓰기 때문입니다.`:
  `${n} 토큰 × 벡터 길이 32 = 입력 숫자 <b>${int(r.inputs)}개</b>, 은닉 크기 64<br>펼쳐서 완전 연결: ${int(r.inputs)} × 64 + 64 = <strong>${int(r.dense)}개</strong><br>순환: 32 × 64 + 64 × 64 + 64 = <strong>${int(r.rnn)}개</strong> · 셀프 어텐션: 4 × (32² + 32) = <strong>${int(r.attention)}개</strong><br>문장 길이를 바꿔도 순환 층과 어텐션 층의 수는 그대로입니다. 대신 어텐션은 토큰 쌍 ${int(n*n)}개의 점수를 계산합니다.`)+
  '<br>첫 층 하나의 파라미터 수를 식으로 센 값이며, 정확도나 속도를 잰 것이 아닙니다.');});
};

/* 판별 지도: 격자마다 원 안일 확률, 학습점, 실제 원(점선) */
function map(r,act){
 const n=20,g=M.decisionGrid(r.net,act,n),c=280/n,ox=100;let b='';
 g.forEach((row,i)=>row.forEach((p,j)=>{b+=`<rect x="${ox+j*c}" y="${i*c}" width="${c+.5}" height="${c+.5}" fill="${p>=0.5?'var(--accent)':'var(--blue)'}" opacity="${(0.12+Math.abs(p-0.5)*0.7).toFixed(2)}"/>`;}));
 b+=`<circle cx="${ox+140}" cy="140" r="${0.8*140}" fill="none" stroke="var(--text)" stroke-width="2" stroke-dasharray="6 5"/>`;
 r.data.X.forEach((p,i)=>{b+=`<circle cx="${(ox+140+p[0]*140).toFixed(1)}" cy="${(140-p[1]*140).toFixed(1)}" r="4" fill="${r.data.Y[i]?'var(--accent)':'var(--blue)'}" stroke="var(--bg)" stroke-width="1"/>`;});
 return U.svg(b,'판별 지도. 초록 영역은 모델이 원 안, 파란 영역은 원 밖으로 판단한 곳이고 점선이 실제 원, 점은 학습에 쓴 80개입니다. 숫자 결과는 아래 결과 문장에 있습니다.');
}
const ACT={tanh:'tanh',relu:'ReLU',sigmoid:'시그모이드',linear:'없음(항등)'};
NCLabs.design=el=>{
 U.setup(el,S('ds-width','은닉 뉴런 수',[[0,'0 (선 하나)'],[2,'2'],[3,'3'],[8,'8'],[16,'16']],0)+S('ds-act','은닉층 활성화',[['tanh','tanh'],['relu','ReLU'],['sigmoid','시그모이드'],['linear','없음(항등)']],'tanh')+S('ds-loss','손실',[['bce','교차 엔트로피'],['mse','제곱 오차']],'bce'));
 U.bind(el,()=>{const w=U.value(el,'ds-width'),a=U.text(el,'ds-act'),loss=U.text(el,'ds-loss');
  const r=M.train({depth:w?1:0,width:w||1,act:a,init:a==='relu'?'he':'xavier',loss,lr:1,epochs:600,seed:1}),line=M.train({depth:0,lr:1,epochs:600,seed:1,loss});
  const same=w>0&&Math.abs(r.valAcc-line.valAcc)<1e-9&&Math.abs(r.trainAcc-line.trainAcc)<1e-9,gap=(r.trainAcc-r.valAcc)*100;
  U.result(el,map(r,a),`${w?`은닉 뉴런 ${w}개 · ${ACT[a]}`:'은닉층 없음(선 하나)'} · ${loss==='bce'?'교차 엔트로피':'제곱 오차'} · 파라미터 <b>${r.params}개</b><br>학습점 80개 정확도 <b>${F(r.trainAcc*100,1)}%</b> · 새 점 200개 정확도 <strong>${F(r.valAcc*100,1)}%</strong> (차이 ${F(gap,1)}%p)<br>교차 엔트로피로 잰 손실: 학습 ${F(r.trainLoss,3)}, 새 점 ${F(r.valLoss,3)}<br>`+
  (!w?'선 하나는 평면을 둘로만 나눕니다. 원 안팎은 선 하나로 가를 수 없어 새 점에서는 절반쯤만 맞힙니다.':same?(a==='linear'?'활성화가 없어 은닉층과 출력층이 선형층 하나로 합쳐졌습니다. 뉴런을 늘려도 결과가 선 하나와 같습니다(5장).':'결과가 선 하나와 같습니다. 은닉 뉴런이 학습점 전체에서 꺼져 있거나 전체에서 켜져 있어, 꺾이는 곳이 학습점 사이에 없습니다(7장의 죽은 뉴런).'):r.valAcc>=0.85?'목표인 새 점 정확도 85%를 넘었습니다. 학습 정확도와의 차이가 왜 남는지는 「딥러닝 핵심」에서 다룹니다.':r.valAcc<0.65?'600 epoch 안에 경계가 원 모양으로 굽지 못했습니다. 기울기가 작아 학습이 느린 조합인지 2장과 7장의 계산으로 따져 보세요.':'경계가 굽기 시작했지만 목표 85%에는 못 미칩니다. 은닉 뉴런 수나 활성화를 바꿔 보세요.')+
  '<br>η = 1, 600 epoch, 시드 1로 실제 학습한 한 번의 결과입니다.');});
};
})();
