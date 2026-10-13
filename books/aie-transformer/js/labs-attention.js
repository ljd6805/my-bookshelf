/* 1~4장 실험: 직렬 깊이, √d_k 나누기, 헤드 나누기, RoPE. 계산은 A08Math에서 하고 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=A08UI,M=A08Math,S=U.select,R=U.range,F=U.fmt,T=M.TOKENS;
const int=n=>Math.round(n).toLocaleString('en-US');

A08Labs.depth=el=>{
 U.setup(el,R('seqexp','문장 길이 N = 2의 거듭제곱 (2³~2¹⁷ 토큰)',3,17,1,10));
 U.bind(el,()=>{const e=U.value(el,'seqexp'),r=M.depth(2**e);el.querySelector('#seqexp-value').textContent=int(r.N);
  const xs=[];for(let x=3;x<=17;x++)xs.push(x);const lg=v=>Math.log10(v);
  const chart=U.plot({lines:[{data:xs.map(x=>[x,lg(2**x)]),color:'var(--accent)'},{data:xs.map(x=>[x,lg(Math.ceil(x))]),color:'var(--blue)'},{data:xs.map(x=>[x,lg(4**x)]),color:'var(--orange)',dashed:true}],points:[[e,lg(r.rnn),'var(--accent)'],[e,lg(r.tree),'var(--blue)'],[e,lg(r.entries),'var(--orange)']],xmin:3,xmax:17,ymin:0,ymax:11,xlabel:'log₂ N (문장 길이)',ylabel:'log₁₀ 값',label:`N = ${r.N}에서 RNN 직렬 단계 ${r.rnn}, 어텐션 트리 깊이 ${r.tree}, 점수표 ${r.entries}칸`});
  U.result(el,chart,`N = <b>${int(r.N)}</b> 토큰 · RNN 직렬 단계 <b>${int(r.rnn)}</b> (초록 선) · 어텐션 직렬 깊이 <b>1</b>번의 행렬곱, 합을 트리로 모아도 <b>${r.tree}</b>단계 (파란 선)<br>대신 점수표는 N² = <strong>${int(r.entries)}칸</strong> (주황 점선), 헤드 하나 fp16로 <b>${F(r.scoreMB,r.scoreMB<1?3:1)} MB</b>입니다. 직렬 단계 비는 ${F(r.ratio,0)}배입니다.<br>깊이와 칸 수를 세는 실제 계산이며, 실행 시간을 잰 값은 아닙니다.`);});
};

A08Labs.scale=el=>{
 U.setup(el,S('dk','열쇠 차원 d_k',[4,8,16,32,64,128,256,512].map(v=>[v,String(v)]),64)+S('scaled','점수를 √d_k로 나누기',[['yes','나눈다'],['no','나누지 않는다']],'no'));
 U.bind(el,()=>{const dk=U.value(el,'dk'),sc=U.text(el,'scaled')==='yes',r=M.attnRow(dk,sc);
  U.result(el,U.bars(T,r.example.weights.map(w=>w*100),'% (‘읽었다’의 가중치, 첫 시행)',null,1),
  `d_k = ${dk}, ${sc?'√'+dk+' = '+F(Math.sqrt(dk),1)+'로 나눔':'나누지 않음'} · 점수 표준편차 <b>${F(r.std,2)}</b> (이론값 ${sc?'1':'√d_k = '+F(Math.sqrt(dk),2)})<br>200번 평균: 가장 큰 가중치 <strong>${F(r.maxW*100,1)}%</strong> · 엔트로피 <b>${F(r.entropy,2)}</b> / 최대 ${F(r.maxEntropy,2)}비트 · softmax 기울기 Σp(1−p) <b>${F(r.grad,3)}</b><br>${r.grad<0.2?'softmax가 한 토큰에 몰려 기울기가 거의 흐르지 않습니다.':'가중치가 여러 토큰에 퍼져 있어 기울기가 살아 있습니다.'} 표준정규분포에서 뽑은 q·k로 한 실제 계산입니다(학습된 모델의 가중치가 아님).`);});
};

function headArt(r){
 const n=r.nHeads,w=440/n;let b=`<text x="20" y="34">d_model = ${r.dModel}</text>`;
 for(let i=0;i<n;i++)b+=`<rect x="${20+i*w}" y="46" width="${Math.max(w-1,0.6)}" height="44" fill="${i%2?'var(--blue)':'var(--accent)'}" opacity="${r.ok?0.85:0.35}"/>`;
 b+=`<text x="20" y="118">${r.ok?`헤드 ${n}개 × d_head ${r.dHead}`:`${r.dModel}은 ${n}으로 나누어떨어지지 않음`}</text><text x="20" y="160">헤드마다 N×N 점수표 하나</text>`;
 const per=16,s=Math.min(24,440/per-4);
 for(let i=0;i<Math.min(n,64);i++){const x=20+(i%per)*(s+4),y=176+Math.floor(i/per)*(s+4);b+=`<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="2" fill="none" stroke="var(--orange)" stroke-width="2"/>`;}
 return U.chart(b,`d_model ${r.dModel}을 헤드 ${n}개로 나눈 그림. d_head ${r.ok?r.dHead:'정의되지 않음'}`);
}
A08Labs.heads=el=>{
 U.setup(el,S('dmodel','d_model',[512,768,1024,2048,4096].map(v=>[v,String(v)]),2048)+S('nheads','헤드 수',[1,2,4,8,12,16,32,64].map(v=>[v,String(v)]),16));
 U.bind(el,()=>{const r=M.heads(U.value(el,'dmodel'),U.value(el,'nheads'));
  const zone={ok:'원본이 권하는 64~128 근처의 무난한 범위입니다.',small:'d_head가 32보다 작아 헤드 하나가 볼 공간이 좁습니다.',large:'d_head가 256보다 커서 여러 작은 헤드로 나누는 이점이 줄어듭니다.',invalid:'d_model이 헤드 수로 나누어떨어지지 않아 이 설정은 만들 수 없습니다.'}[r.zone];
  U.result(el,headArt(r),r.ok?`d_head = ${r.dModel} ÷ ${r.nHeads} = <strong>${r.dHead}</strong> · 점수 나누기 √d_head = <b>${F(r.scale,2)}</b><br>Q·K·V·O 투영 파라미터 4·d² = <b>${int(r.proj)}</b>개 (헤드 수와 무관) · 점수표 <b>${r.maps}</b>개, N = 2,048에서 층 하나 fp16 <b>${F(r.scoreMB,0)} MB</b><br>${zone} 크기를 세는 실제 계산이며, 헤드가 배우는 역할은 다루지 않습니다.`:`<strong>나눌 수 없음</strong> · ${zone}`);});
};

A08Labs.rope=el=>{
 U.setup(el,S('posmethod','위치 방식',[['abs','사인 인코딩을 임베딩에 더함'],['rope','RoPE로 q·k 회전']],'abs')+R('shift','두 위치를 함께 옮긴 양 (토큰)',0,200,1,0));
 U.bind(el,()=>{const m=U.text(el,'posmethod'),s=U.value(el,'shift'),r=M.positionShift(m,s),other=m==='rope'?'abs':'rope';
  const xs=[];for(let x=0;x<=200;x+=2)xs.push(x);const mine=xs.map(x=>[x,M.positionShift(m,x).moved]),oth=xs.map(x=>[x,M.positionShift(other,x).moved]);
  const ys=mine.concat(oth).map(p=>p[1]),lo=Math.floor(Math.min(...ys)),hi=Math.ceil(Math.max(...ys));
  const chart=U.plot({lines:[{data:oth,color:'var(--muted)',dashed:true},{data:mine,color:'var(--accent)'}],points:[[s,r.moved,'var(--orange)',6]],xmin:0,xmax:200,ymin:lo,ymax:hi,xlabel:'함께 옮긴 양',ylabel:'‘읽었다’→‘책을’ 점수',label:`${m==='rope'?'RoPE':'사인 인코딩'}에서 옮긴 양에 따른 점수 곡선`});
  const same=Math.abs(r.moved-r.base)<1e-9;
  U.result(el,chart,`${m==='rope'?'RoPE':'사인 인코딩 더하기'} · 위치 (6, 3) 점수 <b>${F(r.base,4)}</b> → (${6+s}, ${3+s}) 점수 <strong>${F(r.moved,4)}</strong> · 차이 <b>${F(Math.abs(r.moved-r.base),6)}</b><br>${same?'상대 거리 3이 같으므로 점수가 그대로입니다. 회전한 두 벡터의 내적은 각도 차이에만 의존합니다.':'절대 위치 신호를 임베딩에 더했기 때문에 같은 거리라도 놓인 자리에 따라 점수가 흔들립니다.'}<br>d = 8짜리 고정 벡터로 한 실제 계산입니다. 초록 선이 고른 방식, 회색 점선이 다른 방식입니다.`);});
};
const LONG={none:'그대로 (위치를 그대로 씀)',pi:'위치 보간 PI (위치 ÷ 배율)',base10:'추론 때 base만 10배',base100:'추론 때 base만 100배'};
A08Labs.ropelong=el=>{
 U.setup(el,S('ldhead','헤드 차원 d_head',[[64,'64 (쌍 32개)'],[128,'128 (쌍 64개)']],128)+S('ltrain','학습 길이 L_train (토큰)',[[2048,'2,048'],[4096,'4,096'],[8192,'8,192']],4096)+S('ltarget','목표 길이 (토큰)',[[8192,'8,192'],[16384,'16,384'],[32768,'32,768'],[131072,'131,072']],32768)+S('lmethod','늘리는 방법',Object.entries(LONG),'none'));
 U.bind(el,()=>{const p={dHead:U.value(el,'ldhead'),lTrain:U.value(el,'ltrain'),lTarget:U.value(el,'ltarget'),method:U.text(el,'lmethod')},r=M.ropeExtend(p),n=r.pairs.length;
  const lg=v=>Math.max(-2,Math.min(6,Math.log10(v)));
  const chart=U.plot({lines:[{data:[[0,lg(2*Math.PI)],[n-1,lg(2*Math.PI)]],color:'var(--muted)',dashed:true},{data:r.pairs.map(q=>[q.i,lg(q.train)]),color:'var(--accent)'},{data:r.pairs.map(q=>[q.i,lg(q.target)]),color:'var(--orange)',dashed:true}],points:r.pairs.filter(q=>q.unseen).map(q=>[q.i,lg(q.target),'var(--orange)',4]),xmin:0,xmax:n-1,ymin:-2,ymax:6,xlabel:'차원 쌍 번호 i (오른쪽일수록 느리게 돎)',ylabel:'log₁₀ 최대 각도 (rad)',label:`차원 쌍마다 학습 중 본 최대 각도(실선)와 목표 길이의 최대 각도(점선). 본 적 없는 각도를 받는 쌍 ${r.unseen}개.`});
  const sl=r.slow,warn=r.unseen?`<strong>${r.unseen}쌍</strong>이 학습 때 한 바퀴도 돌지 못한 채 처음 보는 각도를 받습니다(가장 크게는 학습 최대 각도의 ${F(r.worst,2)}배).`:'<strong>모든 쌍</strong>이 학습 때 본 각도 범위 안에 머뭅니다.';
  U.result(el,chart,`d_head ${p.dHead}, 학습 base 10,000 · 쌍 ${n}개 · 배율 s = ${F(p.lTarget,0)} ÷ ${F(p.lTrain,0)} = <b>${F(r.s,0)}</b><br>가장 느린 쌍의 각속도 <b>${sl.theta.toExponential(2)}</b> rad/토큰(한 바퀴 ${F(sl.wave,0)}토큰) · 학습 최대 각도 <b>${F(sl.train,2)}</b> rad → 목표 최대 각도 <b>${F(sl.target,2)}</b> rad<br>${LONG[p.method]}: ${warn} ${p.method==='pi'?`대신 이웃한 두 토큰의 각도 차이가 1/${F(r.s,0)}로 좁아지므로, 원 논문처럼 짧게 다시 학습해 이 촘촘한 간격에 익숙해지게 합니다.`:p.method==='none'?'학습 길이를 넘는 순간 위치 감각이 깨지는 이유입니다.':'느린 쌍은 덜 돌게 되지만 빠른 쌍은 거의 그대로라, 쌍마다 늘어나는 정도가 다릅니다.'}<br>각도는 식으로 바로 계산한 실제 값이고, 실제 모델의 정확도 변화는 계산하지 않습니다.`);});
};
})();
