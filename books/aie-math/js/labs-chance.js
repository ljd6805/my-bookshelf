/* 6~8장 실험: 교차 엔트로피, softmax 넘침, 온도와 top-p, 몬테카를로. 계산은 A02Math. */
(()=>{
'use strict';
const U=A02UI,M=A02Math,R=U.range,S=U.select,V=U.value,F=U.fmt;
const show=v=>Number.isFinite(v)?F(v,4):(Number.isNaN(v)?'숫자 아님':'무한대');

A02Labs.surprise=el=>{
 U.setup(el,R('en-c','정답 ‘켜’에 준 확률',0.05,0.99,0.01,0.7)+S('en-eps','라벨 스무딩 ε',[[0,'0 (원-핫 정답)'],[0.1,'0.1']],0));
 U.bind(el,()=>{
  const c=V(el,'en-c'),eps=V(el,'en-eps'),p=M.smoothTarget(eps),q=M.prediction(c),H=M.entropy(p),CE=M.crossEntropy(p,q),KL=M.kl(p,q);
  U.result(el,U.bars(['엔트로피 H(P)','교차 엔트로피','KL 발산'],[H,CE,KL],'비트',null,3),`정답 분포 P = [${p.map(v=>F(v,3)).join(', ')}] · 예측 Q = [${q.map(v=>F(v,3)).join(', ')}]<br>H(P) = <b>${F(H,3)}</b>비트 · H(P,Q) = <strong>${F(CE,3)}</strong>비트 · KL = <b>${F(KL,3)}</b>비트<br>H(P) + KL = ${F(H+KL,3)} = 교차 엔트로피 · 퍼플렉서티 2^H(P,Q) = ${F(2**CE,2)}<br>오답 둘에 남은 확률을 2:1로 나눈다고 가정한 실제 계산입니다.`);
 });
};

A02Labs.softmax=el=>{
 U.setup(el,R('sm-s','가장 큰 점수 s',1,120,1,10)+S('sm-fmt','숫자 정밀도',[['f16','float16 (최대 65,504)'],['f32','float32 (최대 약 3.4×10³⁸)'],['f64','float64']],'f16'));
 U.bind(el,()=>{
  const s=V(el,'sm-s'),fmt=U.text(el,'sm-fmt'),z=[s-2,s-1,s],naive=M.softmaxIn(z,fmt,false),stable=M.softmaxIn(z,fmt,true),bad=M.broken(naive);
  const bar=(x,v,c)=>Number.isFinite(v)?`<rect x="${x}" y="${230-v*190}" width="44" height="${Math.max(v*190,1)}" fill="${c}"/><text x="${x+22}" y="${222-v*190}" text-anchor="middle">${F(v,2)}</text>`:`<text x="${x+22}" y="220" text-anchor="middle" fill="var(--orange)">✕</text>`;
  const body=`<text x="20" y="20">그대로 계산</text><text x="260" y="20">최댓값을 빼고 계산</text><path d="M16 230H464" stroke="var(--line)"/>${naive.map((v,i)=>bar(30+i*66,v,'var(--orange)')).join('')}${stable.map((v,i)=>bar(270+i*66,v,'var(--accent)')).join('')}<text x="20" y="262">s−2, s−1, s 순서 · ✕는 무너진 값</text>`;
  U.result(el,U.svg(body,`점수 ${z.join(', ')}의 softmax. 그대로 계산 ${bad?'무너짐':'정상'}, 최댓값을 빼면 정상.`),`점수 z = [${z.join(', ')}], 정밀도 ${fmt}<br>그대로: e^${s} ${M.expFits(s,fmt)?'은 표현 범위 안':'이 표현 범위를 넘어 무한대가 됨'} → [${naive.map(show).join(', ')}]<br>최댓값 빼기: e^0 = 1이 최대 → <strong>[${stable.map(v=>F(v,4)).join(', ')}]</strong><br>${bad?'지수나 그 합이 표현 범위를 넘어 확률이 0이나 숫자가 아닌 값으로 무너졌습니다. 이 값으로 로그를 취하면 손실 전체가 무너집니다.':'아직은 두 방법이 같은 확률을 냅니다.'} 고른 정밀도로 매 연산 반올림한 실제 계산입니다(float16은 흉내).`);
 });
};

const REPLIES=['불을 켤게요','네, 켰어요','조명 켜는 중','밝아졌죠?','좋은 하루예요'],LOGITS=[2.2,1.8,1.1,.2,-.8];
A02Labs.temperature=el=>{
 U.setup(el,R('tp-t','온도 T',0.1,2,0.1,1)+R('tp-p','top-p',0.5,1,0.05,1));
 U.bind(el,()=>{
  const T=V(el,'tp-t'),p=V(el,'tp-p'),raw=M.softmaxT(LOGITS,T),fin=M.topP(raw,p),kept=fin.filter(v=>v>0).length;
  U.result(el,U.bars(REPLIES,fin,'뽑힐 확률',null,3),`점수 [${LOGITS.join(', ')}] ÷ T=${F(T,1)} → softmax → top-p ${F(p)}<br>남은 문장 <strong>${kept}개</strong> · 1등 확률 <b>${F(fin[0],3)}</b> · 엔트로피 ${F(M.entropy(fin),3)}비트<br>온도 적용 직후 1등 확률은 ${F(raw[0],3)}이고, top-p가 꼬리를 자른 뒤 다시 합이 1이 되게 나눴습니다. 실제 계산이며 문장과 점수는 가상 값입니다.`);
 });
};

A02Labs.montecarlo=el=>{
 U.setup(el,R('mc-n','표본 수 n = 2의 거듭제곱',4,14,1,8));
 U.bind(el,()=>{
  const k=V(el,'mc-n'),n=2**k,r=M.monteCarloPi(n);
  const dots=r.pts.map(([x,y,ok])=>`<circle cx="${40+x*210}" cy="${250-y*210}" r="2.6" fill="${ok?'var(--accent)':'var(--orange)'}"/>`).join('');
  const body=`<rect x="40" y="40" width="210" height="210" fill="none" stroke="var(--line)"/><path d="M40 40A210 210 0 0 1 250 250" fill="none" stroke="var(--text)" stroke-width="2"/>${dots}<text x="270" y="80">n = ${n.toLocaleString('en-US')}</text><text x="270" y="112">추정 π = ${F(r.est,4)}</text><text x="270" y="144">오차 ${F(r.err,4)}</text><text x="270" y="176">표준오차 ${F(r.se,4)}</text><text x="270" y="230">점은 처음 400개까지</text>`;
  U.result(el,U.svg(body,`표본 ${n}개로 π를 ${F(r.est,4)}로 추정. 사분원 안 점은 초록, 밖은 주황.`),`n = 2^${k} = <b>${n.toLocaleString('en-US')}</b>개 점 중 사분원 안 비율 × 4 = <strong>${F(r.est,4)}</strong><br>실제 π와의 차이 ${F(r.err,4)} · 이론 표준오차 4√(π/4·(1−π/4)/n) = ${F(r.se,4)}<br>n을 4배로 늘리면 표준오차는 절반이 됩니다. 시드 17로 고정한 의사난수의 실제 계산입니다.`);
 });
};
})();
