/* 9~12장 실험: SVD 압축, 조건수, 마르코프 연쇄, 새 버전 판정. 계산은 A02Math. */
(()=>{
'use strict';
const U=A02UI,M=A02Math,R=U.range,S=U.select,V=U.value,F=U.fmt;

function heat(A,x0,y0,max){return A.map((row,t)=>row.map((v,f)=>`<rect x="${x0+f*16}" y="${y0+t*16}" width="15" height="15" fill="var(--accent)" fill-opacity="${Math.max(0,Math.min(1,v/max)).toFixed(3)}"/>`).join('')).join('');}
A02Labs.compress=el=>{
 U.setup(el,R('cp-k','남길 층 수 k',1,10,1,2));
 U.bind(el,()=>{
  const k=V(el,'cp-k'),A=M.spectrogram(),c=M.compress(A,k),max=Math.max(...A.flat());
  const body=`<text x="40" y="26">원래 표 (12×10)</text><text x="270" y="26">랭크 ${k} 근사</text>${heat(A,40,40,max)}${heat(c.R,270,40,max)}<text x="12" y="272">세로: 시간 · 가로: 주파수 · 진할수록 큼</text>`;
  U.result(el,U.svg(body,`원래 스펙트로그램과 큰 특잇값 ${k}개로 다시 만든 근사. 상대 오차 ${F(c.rel*100,1)}%.`),`특잇값 σ = [${c.s.map(v=>F(v,3)).join(', ')}]<br>k = ${k} · 남긴 에너지 Σσ²(앞 ${k}개)/Σσ² = <strong>${F(c.kept*100,2)}%</strong> · 상대 오차 ‖A−A_k‖/‖A‖ = <b>${F(c.rel*100,2)}%</b><br>저장할 숫자 k(12+10+1) = <b>${c.store}</b>개, 원래 ${c.full}개 ${c.store>c.full?'→ 원래보다 많아져 압축의 의미가 없습니다.':`→ ${F(c.store/c.full*100,0)}% 크기`}<br>가상 스펙트로그램으로 SVD를 실제 계산했습니다.`);
 });
};

A02Labs.condition=el=>{
 U.setup(el,R('cd-a','두 특징 열 사이의 각도 θ (°)',2,90,1,30)+S('cd-l','릿지 λ',[[0,'0 (그대로)'],[0.01,'0.01'],[0.1,'0.1']],0));
 U.bind(el,()=>{
  const d=V(el,'cd-a'),l=V(el,'cd-l'),r=M.conditioning(d,l),th=d*Math.PI/180;
  const ox=40,oy=220,sc=150,P=([x,y])=>[300+(x-1)*300,140-(y-1)*300],cl=v=>Math.max(-0.4,Math.min(0.4,v));
  const xs=[r.x,r.xp].map(([a,b])=>[1+cl(a-1),1+cl(b-1)]);
  const body=`<text x="20" y="24">특징 열 u, v</text><path d="M${ox} ${oy}H${ox+sc}" stroke="var(--blue)" stroke-width="3"/><path d="M${ox} ${oy}L${ox+sc*Math.cos(th)} ${oy-sc*Math.sin(th)}" stroke="var(--orange)" stroke-width="3"/><text x="${ox+sc-10}" y="${oy+22}">u</text><text x="${ox+sc*Math.cos(th)+6}" y="${oy-sc*Math.sin(th)}">v</text><text x="250" y="24">해 x의 위치 (±0.4 범위)</text><path d="M180 140H420M300 20V260" stroke="var(--line)"/><circle cx="${P(xs[0])[0]}" cy="${P(xs[0])[1]}" r="7" fill="var(--accent)"/><circle cx="${P(xs[1])[0]}" cy="${P(xs[1])[1]}" r="7" fill="none" stroke="var(--orange)" stroke-width="3"/><text x="300" y="276" text-anchor="middle">가운데 = 정답 (1, 1)</text>`;
  U.result(el,U.svg(body,`각도 ${d}°, λ=${l}. 잡음 전 해(초록)와 잡음 후 해(주황 원)의 거리 ${F(r.shift,4)}.`),`σmax = ${F(r.smax,3)}, σmin = ${F(r.smin,3)} → 조건수 κ(A) = <strong>${F(r.kappa,1)}</strong><br>풀 행렬 AᵀA${l?` + ${l}I`:''}의 조건수 ${F(r.kappaNormal,1)}<br>해 x = (${F(r.x[0],3)}, ${F(r.x[1],3)}) → b에 0.01 잡음 뒤 (${F(r.xp[0],3)}, ${F(r.xp[1],3)})<br>해가 움직인 거리 <b>${F(r.shift,4)}</b> = 잡음의 ${F(r.shift/.01,1)}배${l?'. 릿지는 흔들림을 줄이는 대신 해를 정답 (1, 1)에서 조금 당깁니다.':''} 실제 계산입니다.`);
 });
};

A02Labs.chain=el=>{
 U.setup(el,R('ch-q','‘켜’ 다음에 ‘밝게’가 올 확률 q',0,0.8,0.05,0.5)+R('ch-n','걸음 수 n',0,20,1,5));
 U.bind(el,()=>{
  const q=V(el,'ch-q'),n=V(el,'ch-n'),P=M.commandChain(q),tr=M.evolve(P,[1,0,0],20),pi=M.stationary(P),colors=['var(--accent)','var(--orange)','var(--blue)'];
  const lines=[0,1,2].flatMap(j=>[{data:tr.map((p,t)=>[t,p[j]]),color:colors[j]},{data:[[0,pi[j]],[20,pi[j]]],color:colors[j],dashed:true}]);
  const chart=U.plot({lines,points:[0,1,2].map(j=>[n,tr[n][j],colors[j],6]),xmin:0,xmax:20,ymin:0,ymax:1,xlabel:'걸음 수',ylabel:'확률',label:'켜(초록)·꺼(주황)·밝게(파랑)의 확률이 걸음마다 정상 분포(점선)로 모이는 모습'});
  U.result(el,chart,`P의 ‘켜’ 행 = [${P[0].map(v=>F(v)).join(', ')}]<br>${n}걸음 뒤: 켜 ${F(tr[n][0],3)} · 꺼 ${F(tr[n][1],3)} · 밝게 ${F(tr[n][2],3)} (정상 분포와의 차이 ${F(M.tv(tr[n],pi),4)})<br>정상 분포 π: 켜 <b>${F(pi[0],3)}</b> · 꺼 <b>${F(pi[1],3)}</b> · 밝게 <b>${F(pi[2],3)}</b><br>차이가 0.001 아래로 내려가는 데 <strong>${M.mixingSteps(P,[1,0,0])}걸음</strong>. 초록 켜, 주황 꺼, 파랑 밝게. 가상 전이 확률의 실제 계산입니다.`);
 });
};

A02Labs.verdict=el=>{
 U.setup(el,R('vd-n','버전마다 시험한 녹음 수 n',50,5000,50,200)+S('vd-p2','새 버전 정확도',[[0.87,'87%'],[0.89,'89%'],[0.92,'92%']],0.89));
 U.bind(el,()=>{
  const n=V(el,'vd-n'),p2=V(el,'vd-p2'),r=M.diffInterval(.86,p2,n),X=v=>40+(v+.1)/.25*400,cl=v=>Math.max(-.1,Math.min(.15,v)),post=M.posterior(.05,.95,.03);
  const ticks=[-.1,-.05,0,.05,.1,.15].map(v=>`<path d="M${X(v)} 150v8" stroke="var(--muted)"/><text x="${X(v)}" y="178" text-anchor="middle">${v>0?'+':''}${Math.round(v*100)}</text>`).join('');
  const body=`<text x="20" y="30">정확도 차이 (새 − 이전, %p)의 95% 구간</text><path d="M40 150H440" stroke="var(--line)"/><path d="M${X(0)} 60V160" stroke="var(--text)" stroke-dasharray="4 4"/>${ticks}<rect x="${X(cl(r.lo))}" y="96" width="${Math.max(2,X(cl(r.hi))-X(cl(r.lo)))}" height="20" rx="4" fill="${r.clear?'var(--accent)':'var(--orange)'}" fill-opacity=".55"/><circle cx="${X(cl(r.d))}" cy="106" r="7" fill="var(--text)"/><text x="20" y="226">${r.clear?'구간 전체가 0보다 큼':'구간이 0을 포함함'}</text>`;
  U.result(el,U.svg(body,`n=${n}일 때 정확도 차이 ${F(r.d*100,1)}%p, 95% 구간 ${F(r.lo*100,1)}~${F(r.hi*100,1)}%p`),`이전 86% · 새 ${F(p2*100,0)}% · 녹음 ${n}개씩<br>차이 <b>${F(r.d*100,1)}%p</b> · 표준오차 ${F(r.se*100,2)}%p · 95% 구간 <strong>${F(r.lo*100,1)} ~ ${F(r.hi*100,1)}%p</strong><br>${r.clear?'구간이 0을 넘으므로 우연만으로 설명하기 어려운 차이입니다. 그래도 오경보율과 다른 방의 결과는 따로 확인해야 합니다.':'구간이 0을 포함하므로 이 시험만으로는 새 버전이 낫다고 말할 수 없습니다.'}<br>참고: 부엌 소리 중 5%만 명령이고 민감도 95%, 오경보율 3%라면 ‘켜’ 판정 중 실제 명령은 ${F(post*100,1)}%입니다. 가정한 값으로 계산한 정규 근사입니다.`);
 });
};
})();
