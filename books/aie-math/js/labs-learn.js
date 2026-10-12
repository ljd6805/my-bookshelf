/* 3~5장 실험: 수치 미분, 역전파, 경사하강, 모멘텀. 계산은 A02Math, 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=A02UI,M=A02Math,R=U.range,S=U.select,V=U.value,F=U.fmt;
const ex=v=>Number.isFinite(v)?v.toExponential(2).replace('e','×10^'):'정의되지 않음';

A02Labs.numdiff=el=>{
 U.setup(el,R('nd-h','간격 h = 10의 거듭제곱',-14,-1,1,-5));
 U.bind(el,()=>{
  const L=V(el,'nd-h'),h=10**L,w=.5,logs=Array.from({length:14},(_,i)=>-14+i),rows=M.diffErrors(w,logs);
  const lg=v=>Math.log10(Math.max(v,1e-16)),now=M.diffErrors(w,[L])[0],g=M.lossWGrad(w);
  const chart=U.plot({lines:[{data:rows.map(r=>[r.log,lg(r.forward)]),color:'var(--orange)'},{data:rows.map(r=>[r.log,lg(r.centered)]),color:'var(--accent)'}],points:[[L,lg(now.forward),'var(--orange)',6],[L,lg(now.centered),'var(--accent)',6]],xmin:-14,xmax:-1,ymin:-12,ymax:0,xlabel:'log₁₀ h',ylabel:'log₁₀ 상대 오차',label:'h에 따른 앞 차분(주황)과 가운데 차분(초록)의 상대 오차. 둘 다 너무 크거나 너무 작은 h에서 커집니다.'});
  U.result(el,chart,`w = 0.5, h = 10^${L}<br>해석적 기울기 2(a−1)·a(1−a)·2 = <b>${F(g,8)}</b><br>앞 차분 ${F(M.numDiff(M.lossW,w,h,false),8)} · 상대 오차 <strong>${ex(now.forward)}</strong><br>가운데 차분 ${F(M.numDiff(M.lossW,w,h,true),8)} · 상대 오차 <strong>${ex(now.centered)}</strong><br>주황은 앞 차분, 초록은 가운데 차분입니다. 64비트 부동소수점으로 실제 계산했습니다.`);
 });
};

A02Labs.backprop=el=>{
 U.setup(el,R('bp-w','가중치 w',-3,3,0.1,0.5)+S('bp-y','정답 y',[[1,'1 (‘켜’가 맞음)'],[0,'0 (‘켜’가 아님)']],1));
 U.bind(el,()=>{
  const p={x:2,w:V(el,'bp-w'),b:0,y:V(el,'bp-y')},r=M.backprop(p),c=M.gradCheck(p);
  const node=(x,label,val)=>`<rect x="${x-38}" y="96" width="76" height="52" rx="8" fill="var(--panel2)" stroke="var(--line)" stroke-width="2"/><text x="${x}" y="118" text-anchor="middle" fill="var(--text)">${label}</text><text x="${x}" y="140" text-anchor="middle" fill="var(--orange)">${val}</text>`;
  const arrow=(x1,x2,g)=>`<path d="M${x1} 122H${x2}" stroke="var(--muted)" stroke-width="2"/><path d="M${x2} 122l-7-5v10z" fill="var(--muted)"/><text x="${(x1+x2)/2}" y="186" text-anchor="middle" fill="var(--accent)">${g}</text>`;
  const body=`<text x="8" y="22">앞방향 값(주황) · 뒷방향 국소 미분(초록)</text>${node(48,'w, x',`${F(p.w,1)}, 2`)}${arrow(86,124,'×x = 2')}${node(162,'z=wx',F(r.z))}${arrow(200,238,`σ′ ${F(r.dadz,3)}`)}${node(276,'a=σ(z)',F(r.a,3))}${arrow(314,352,`2(a−y) ${F(r.dLda,3)}`)}${node(420,'L',F(r.L,4))}<text x="240" y="236" text-anchor="middle" fill="var(--text)">∂L/∂w = ${F(r.dLda,3)} × ${F(r.dadz,3)} × 2 = ${F(r.dLdw,4)}</text><path d="M440 205H40" stroke="var(--accent)" stroke-width="2" stroke-dasharray="5 4"/><path d="M40 205l8-5v10z" fill="var(--accent)"/>`;
  U.result(el,U.svg(body,`w=${F(p.w,1)}일 때 계산 그래프. 손실 ${F(r.L,4)}, 기울기 ∂L/∂w ${F(r.dLdw,4)}.`),`앞방향: z = ${F(p.w,1)}×2 = ${F(r.z)}, a = σ(z) = ${F(r.a,4)}, L = (a−${p.y})² = <b>${F(r.L,4)}</b><br>뒷방향: ∂L/∂a = ${F(r.dLda,4)}, ∂a/∂z = a(1−a) = ${F(r.dadz,4)}, ∂z/∂w = x = 2<br>∂L/∂w = <strong>${F(r.dLdw,5)}</strong> · ∂L/∂b = ${F(r.dLdb,5)}<br>가운데 차분 검사 ${F(c.numeric,5)} · 상대 오차 ${ex(c.rel)}. 실제 계산입니다.`);
 });
};

/* 골짜기 f=½(x²+12y²)의 등고선과 경로. 1단위 = 44px, 원점 = (240,140) */
function valley(paths,label){
 const X=x=>240+x*44,Y=y=>140-y*44,cl=v=>Math.max(-2000,Math.min(2000,v)),id='vc'+Math.random().toString(36).slice(2);
 const rings=[.5,2,4.5,8,12.5].map(c=>`<ellipse cx="240" cy="140" rx="${Math.sqrt(2*c)*44}" ry="${Math.sqrt(2*c/12)*44}" fill="none" stroke="var(--line)"/>`).join('');
 const lines=paths.map(({path,color,dashed})=>`<polyline points="${path.map(([x,y])=>`${cl(X(x))},${cl(Y(y))}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.4"${dashed?' stroke-dasharray="6 5"':''}/>`).join('');
 return U.svg(`<defs><clipPath id="${id}"><rect x="0" y="0" width="480" height="280"/></clipPath></defs><g clip-path="url(#${id})">${rings}<circle cx="240" cy="140" r="5" fill="var(--text)"/><circle cx="${X(-4)}" cy="${Y(1.5)}" r="6" fill="var(--blue)"/>${lines}</g><text x="12" y="270">출발 (−4, 1.5) · 바닥 (0, 0)</text>`,label);
}
A02Labs.descent=el=>{
 U.setup(el,R('gd-lr','학습률 η',0.01,0.2,0.01,0.1));
 U.bind(el,()=>{
  const lr=V(el,'gd-lr'),r=M.descend(lr,40),lim=M.lrLimit(),start=r.loss[0],end=r.final,diverged=!(end<start);
  const verdict=diverged?'손실이 오히려 커졌습니다. y 방향(곡률 12)에서 매 걸음 더 크게 튀며 발산합니다.':lr>.15?'줄어들기는 하지만 y 방향에서 크게 흔들립니다.':lr<.04?'안정적이지만 x 방향(곡률 1)으로 아주 느리게 갑니다.':'두 방향의 절충입니다.';
  U.result(el,valley([{path:r.path,color:'var(--orange)'}],`학습률 ${lr}로 40걸음 경사하강한 경로`),`η = ${F(lr)} · 수렴 한계 2/12 = <b>${F(lim,3)}</b><br>손실 ${F(start)} → 40걸음 뒤 <strong>${Number.isFinite(end)&&end<1e6?F(end,4):'발산'}</strong><br>${verdict}<br>이차 함수에서의 실제 반복 계산입니다.`);
 });
};
A02Labs.momentum=el=>{
 U.setup(el,R('mo-beta','모멘텀 β',0,0.95,0.05,0.8));
 U.bind(el,()=>{
  const b=V(el,'mo-beta'),base=M.descend(.05,40),mo=M.descend(.05,40,b),t0=M.firstBelow(base.loss,.01),t1=M.firstBelow(mo.loss,.01),w=t=>t<0?'40걸음 안에 못 내려감':`${t}걸음`;
  U.result(el,valley([{path:base.path,color:'var(--muted)',dashed:true},{path:mo.path,color:'var(--accent)'}],`학습률 0.05에서 기본 경사하강(점선)과 모멘텀 β=${b}(실선)의 경로`),`η = 0.05 고정, β = ${F(b)}<br>기본 경사하강: 40걸음 뒤 손실 ${F(base.final,4)} · 손실 0.01 아래까지 ${w(t0)}<br>모멘텀: 40걸음 뒤 손실 <strong>${F(mo.final,4)}</strong> · 손실 0.01 아래까지 <b>${w(t1)}</b><br>${b>=.9?'β가 너무 크면 지난 속도가 오래 남아 바닥을 지나쳐 맴돕니다.':'지난 속도가 x 방향으로 쌓여 느린 방향을 빨리 지납니다.'} 실제 반복 계산입니다.`);
 });
};
})();
