/* 7~11장 실험: 안쪽·바깥 변화율의 곱, 계산 그래프를 단계별로 거슬러 가기, 경로마다 더하기, 같은 가중치를 여러 번 쓴 계산,
   긴 연쇄의 곱, 2-2-1 망의 기울기 계산 점검. 계산은 모두 DXMath가 하고 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=DXUI,M=DXMath,F=U.fmt,J=U.josa,R=U.range,S=U.select,A='var(--accent)';
const SUP={'-':'⁻',0:'⁰',1:'¹',2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶',7:'⁷',8:'⁸',9:'⁹'};
/* 아주 작거나 큰 수는 a×10ⁿ 꼴로 적는다. */
const sci=n=>{if(n===0)return '0';const a=Math.abs(n);if(a>=0.001&&a<10000)return F(n,a<1?4:2);const e=Math.floor(Math.log10(a));return `${F(n/10**e,2)}×10${String(e).split('').map(c=>SUP[c]).join('')}`;};
const node=(x,y,name,val,on=true,w=96)=>`<rect x="${x-w/2}" y="${y-26}" width="${w}" height="52" rx="8" fill="var(--panel2)" stroke="${on?'var(--blue)':'var(--line)'}" stroke-width="2"/><text x="${x}" y="${y-5}" text-anchor="middle" font-size="13" fill="var(--muted)">${name}</text><text x="${x}" y="${y+15}" text-anchor="middle" font-size="15" font-weight="700" fill="var(--text)">${on?val:'?'}</text>`;
const edge=(x1,y1,x2,y2,top,bottom,back)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${back?A:'var(--muted)'}" stroke-width="${back?3:1.6}"/><text x="${(x1+x2)/2}" y="${(y1+y2)/2-9}" text-anchor="middle" font-size="12" fill="var(--muted)">${top||''}</text>${bottom?`<text x="${(x1+x2)/2}" y="${(y1+y2)/2+19}" text-anchor="middle" font-size="12.5" font-weight="700" fill="${A}">${bottom}</text>`:''}`;

DXLabs.rates=el=>{
 U.setup(el,S('rt-day','어느 날의 기록',M.DATA.x.map((x,i)=>[i,`${i+1}일째 (기온 ${20+x}℃, ${M.DATA.y[i]}잔)`]),7)+R('rt-w','기울기 w (잔/℃)',0,8,0.1,3));
 U.bind(el,()=>{const day=U.value(el,'rt-day'),w=U.value(el,'rt-w'),r=M.chainDay(day,w);
  const body=`<g class="dx-graph">${edge(108,80,192,80,'× x',`du/dw = ${r.inner}`,true)}${edge(288,80,372,80,'제곱',`dℓ/du = ${F(r.outer)}`,true)}${node(60,80,'w',F(w,1))}${node(240,80,'u = w·x + 12 − y',F(r.u),true,150)}${node(420,80,'ℓ = u²',F(r.l))}`+
  `<text x="240" y="150" text-anchor="middle" font-size="14" fill="var(--text)">곱: ${F(r.outer)} × ${r.inner} = ${F(r.slope)}</text>`+
  [['w를 0.1 늘림','+0.10'],['u의 변화',F(r.du)],['ℓ의 실제 변화',F(r.actual)],['곱으로 어림한 ℓ의 변화',F(r.estimate)]].map(([a,b],i)=>`<text x="80" y="${188+i*22}" font-size="13" fill="var(--muted)">${a}</text><text x="400" y="${188+i*22}" text-anchor="end" font-size="14" font-weight="${i>1?700:400}" fill="${i===3?A:'var(--text)'}">${b}</text>`).join('')+'</g>';
  U.result(el,U.svg(body,`w에서 오차 u로, u에서 하루치 손실 ℓ로 이어지는 두 단계와 단계마다의 변화율 ${r.inner}, ${F(r.outer)}`),
  `${day+1}일째: x = ${r.x}, y = ${r.y} · 오차 u = ${F(w,1)} × ${r.x} + 12 − ${r.y} = <b>${F(r.u)}</b>, 하루치 손실 ℓ = u² = <b>${F(r.l)}</b><br>안쪽 변화율 du/dw = x = ${r.inner} · 바깥 변화율 dℓ/du = 2u = ${F(r.outer)}<br>곱: dℓ/dw = ${F(r.outer)} × ${r.inner} = <strong>${F(r.slope)}</strong> (수치 미분 ${F(r.numeric,4)})<br>`+
  (r.inner===0?'이날은 x = 0이라 w를 바꿔도 u가 변하지 않습니다. 안쪽 변화율이 0이면 바깥 변화율이 얼마든 곱은 0입니다.':r.u===0?'이날은 예측이 실제와 같아 오차 u가 0입니다. 바깥 변화율 2u가 0이라 곱도 0입니다.':`w를 0.1 늘리면 u는 ${F(r.du)}, ℓ은 실제로 ${F(r.actual)} 변합니다. 곱으로 어림한 값은 ${F(r.estimate)}이고, 차이는 ℓ이 곡선이기 때문에 생깁니다.`)+
  '<br>절편 b는 12로 고정했습니다. 가상 기록으로 실제 계산한 값입니다.');});
};

const STEPS=['시작: 입력 x, 가중치 w, 편향 b, 정답 y만 정해져 있습니다. 단계를 1로 올려 보세요.',
 r=>`순전파 1: z = w·x + b = ${F(r.w,1)} × ${r.x} + (${r.b}) = <b>${F(r.z,3)}</b>`,
 r=>`순전파 2: a = σ(z) = 1 ÷ (1 + e^(−${F(r.z,3)})) = <b>${F(r.a,4)}</b>`,
 r=>`순전파 3: L = (a − y)² = (${F(r.a,4)} − ${r.y})² = <b>${F(r.L,4)}</b>. 이제 거꾸로 갑니다.`,
 r=>`역방향 1: L에서 a로. ∂L/∂a = 2(a − y) = <b>${F(r.dLda,4)}</b>`,
 r=>`역방향 2: a에서 z로. 넘어온 ${F(r.dLda,4)}에 σ의 국소 미분 a(1 − a) = ${F(r.dadz,4)}를 곱해 ∂L/∂z = <b>${F(r.dLdz,4)}</b>`,
 r=>`역방향 3: z에서 w와 b로. ∂L/∂w = ${F(r.dLdz,4)} × x = <strong>${F(r.dLdw,4)}</strong>, ∂L/∂b = ${F(r.dLdz,4)} × 1 = <strong>${F(r.dLdb,4)}</strong> (w의 수치 미분 ${F(r.numeric,4)})`];
DXLabs.backstep=el=>{
 U.setup(el,R('bs-w','가중치 w',-3,3,0.1,0.8)+R('bs-step','계산 단계 (0~6)',0,6,1,0));
 const sl=()=>el.querySelector('#bs-step');
 el.onclick=e=>{if(!e.target.closest('[data-play]'))return;clearInterval(el._spin);sl().value=0;sl().dispatchEvent(new Event('input',{bubbles:true}));
  el._spin=setInterval(()=>{if(!document.body.contains(el)||Number(sl().value)>=6){clearInterval(el._spin);el._spin=null;return;}sl().value=Number(sl().value)+1;sl().dispatchEvent(new Event('input',{bubbles:true}));},1100);};
 U.bind(el,()=>{const w=U.value(el,'bs-w'),k=U.value(el,'bs-step'),r={...M.neuron(w),w};
  const body=`<g class="dx-graph">${edge(98,70,150,134,'','',false)}${edge(98,140,150,140,'× x',k>=6?`∂L/∂w = ${F(r.dLdw,4)}`:'',k>=6)}${edge(98,210,150,146,'',k>=6?`∂L/∂b = ${F(r.dLdb,4)}`:'',k>=6)}${edge(238,140,274,140,'σ',k>=5?`∂L/∂z = ${F(r.dLdz,4)}`:'',k>=5)}${edge(362,140,386,140,'',k>=4?`∂L/∂a = ${F(r.dLda,4)}`:'',k>=4)}`+
  `${node(56,70,'x',r.x,true,84)}${node(56,140,'w',F(w,1),true,84)}${node(56,210,'b',F(r.b,1),true,84)}${node(194,140,'z = w·x + b',F(r.z,3),k>=1,88)}${node(318,140,'a = σ(z)',F(r.a,4),k>=2,88)}${node(432,140,'L = (a − y)²',F(r.L,4),k>=3,92)}`+
  `<text x="240" y="262" text-anchor="middle" font-size="13" fill="var(--muted)">${k<=3?'값은 왼쪽에서 오른쪽으로 계산합니다':'기울기는 오른쪽에서 왼쪽으로 곱해 갑니다'}</text></g>`;
  U.result(el,`${U.svg(body,`뉴런 하나의 계산 그래프. 단계 ${k}까지의 값과 기울기가 적혀 있습니다.`)}<div class="s3d-tools"><button type="button" data-play>0단계부터 자동으로 넘기기</button></div>`,
  `단계 ${k} / 6 · ${typeof STEPS[k]==='string'?STEPS[k]:STEPS[k](r)}<br>`+(k===6?(Math.abs(r.dadz)<0.05?`a가 ${r.a>0.5?'1':'0'}에 가까워 가운데 국소 미분 a(1 − a)가 ${F(r.dadz,4)}로 작습니다. 이 값이 곱해져 w의 기울기도 작아집니다.`:'국소 미분 세 개 2(a − y), a(1 − a), x를 뒤에서부터 곱한 값이 수치 미분과 같습니다.'):'단계를 하나씩 올리면 이미 계산한 값은 그대로 두고 새 값 하나만 더합니다.')+
  `<br>x = ${r.x}, b = ${F(r.b,1)}, y = ${r.y}로 고정한 뉴런 하나의 실제 계산입니다.`);});
};

DXLabs.paths=el=>{
 U.setup(el,R('pt-n','손실에 넣은 날 수 n (앞에서부터)',1,8,1,8)+R('pt-w','기울기 w (잔/℃)',0,8,0.1,3));
 U.bind(el,()=>{const n=U.value(el,'pt-n'),w=U.value(el,'pt-w'),r=M.pathSum(w,n);
  U.result(el,U.bars(r.parts.map((p,i)=>`${i+1}일째 (x = ${p.x})`),r.parts.map(p=>p.c),'날마다의 몫 (2/n)·오차·x',null,2),
  `앞의 ${n}일 평균 손실에서 w는 날마다 한 번씩, 모두 ${n}번 쓰입니다. w에서 L로 가는 경로가 ${n}개입니다.<br>경로마다의 몫을 더하면 ∂L/∂w = ${r.parts.map(p=>F(p.c)).join(' + ').replace(/\+ −/g,'− ')} = <strong>${F(r.total)}</strong> (수치 미분 ${F(r.numeric,4)})<br>`+
  (n===8?`3장에서 식을 전개해 얻은 35 × ${F(w,1)} + 7 × 12 − 222.75 = ${F(M.grad(w,M.B0).gw)}와 같습니다.`:n===1?'1일째는 x = 0이라 w가 손실에 영향을 주지 못합니다. 경로는 있지만 몫이 0입니다.':'날 수를 늘리면 경로가 하나씩 늘고, 새 경로의 몫이 합에 더해집니다.')+
  ' 막대 길이는 몫의 크기이고 부호는 숫자에 적었습니다.<br>절편 b는 12로 고정했습니다. 가상 기록으로 실제 계산한 값입니다.');});
};

DXLabs.shared=el=>{
 U.setup(el,R('sh-t','같은 w를 곱한 횟수 T',1,8,1,3)+R('sh-w','가중치 w',0.5,1.5,0.05,0.9));
 U.bind(el,()=>{const T=U.value(el,'sh-t'),w=U.value(el,'sh-w'),r=M.shared(w,T);
  U.result(el,U.bars(Array.from({length:T},(_,i)=>`${i+1}번째 곱셈의 w`),Array.from({length:T},()=>r.each),'경로 하나의 몫 w^(T−1)·x',null,3),
  `x = 2에 같은 w = ${J(F(w),'를')} ${T}번 곱하면 h = w^${T}·x = <b>${F(r.h,3)}</b><br>w가 쓰인 자리가 ${T}곳이라 경로도 ${T}개이고, 경로 하나의 몫은 나머지 ${T-1}번의 곱 w^${T-1}·x = ${F(r.each,3)}입니다.<br>모두 더하면 dh/dw = ${T} × ${F(r.each,3)} = <strong>${F(r.total,3)}</strong> (수치 미분 ${F(r.numeric,3)})<br>`+
  (T===1?'한 번만 쓰이면 경로가 하나라 더할 것이 없습니다.':w>1?`w가 1보다 커서 곱하는 횟수가 늘수록 경로 하나의 몫도 커집니다. T를 8까지 올려 보세요.`:w<1?'w가 1보다 작아 곱하는 횟수가 늘수록 경로 하나의 몫이 작아집니다.':'w가 1이면 경로 하나의 몫이 x와 같고, 합은 T에 비례합니다.')+
  '<br>식 h = w^T·x를 실제로 계산했습니다. 순환 신경망이 시간마다 같은 가중치를 쓰는 계산을 가장 작게 줄인 모형입니다.');});
};

DXLabs.depth=el=>{
 U.setup(el,S('dp-act','활성화 함수',Object.entries(M.ACT_NAME),'sigmoid')+R('dp-w','가중치 w (모든 층이 같은 값)',0.5,3,0.1,1)+R('dp-n','층 수 n',1,20,1,5));
 U.bind(el,()=>{const kind=U.text(el,'dp-act'),w=U.value(el,'dp-w'),n=U.value(el,'dp-n'),r=M.deepChain(kind,w,n),lg=v=>Math.max(-16,Math.min(6,Math.log10(Math.max(Math.abs(v),1e-16))));
  const pts=r.running.map((v,i)=>[i+1,lg(v)]),shown=r.factors.slice(0,5).map(v=>F(v,3)).join(', ')+(n>5?', …':''),p=Math.abs(r.product);
  U.result(el,U.plot({lines:[{data:n>1?pts:[[0.5,pts[0][1]],[1.5,pts[0][1]]],color:A},{data:[[0,0],[21,0]],color:'var(--muted)',dashed:true}],points:pts.map(q=>[q[0],q[1],A,4]),xmin:1,xmax:Math.max(n,2),ymin:-16,ymax:6,xlabel:'층 번호 (1이 입력 쪽)',ylabel:'log₁₀ |그 층까지 곱한 값|',label:`${M.ACT_NAME[kind]}, w = ${w}, ${n}층에서 출력 쪽부터 곱해 온 값의 크기(로그 눈금)`}),
  `${M.ACT_NAME[kind]} · w = ${F(w,1)} · ${n}층 · 층 하나를 거슬러 갈 때 곱해지는 값 w·act′(z): ${shown}<br>출력에서 첫 층 입력까지 ${n}개를 모두 곱하면 <strong>${sci(r.product)}</strong><br>`+
  (p<1e-3?`<b>기울기 소실</b>: 1보다 작은 값을 ${n}번 곱해 첫 층에 닿는 기울기가 ${sci(r.product)}배로 줄었습니다. 앞쪽 층의 가중치는 거의 고쳐지지 않습니다.`:p>1e3?`<b>기울기 폭발</b>: 1보다 큰 값을 ${n}번 곱해 ${sci(r.product)}배로 커졌습니다. 한 걸음이 지나치게 커져 학습이 흔들립니다.`:`곱이 ${J(sci(r.product),'로')}, 첫 층까지 닿는 기울기가 지나치게 작거나 크지 않습니다.`)+
  '<br>점선은 곱이 1인 자리(세로축 값 0)입니다. 입력 0.5, 편향 0, 층마다 뉴런 하나인 줄을 실제로 계산했습니다. 실제 신경망은 층마다 가중치가 다르고 뉴런이 여러 개라 숫자는 달라집니다.');});
};

function netSvg(target,r){
 const P={x1:[60,90],x2:[60,200],h1:[220,90],h2:[220,200],o:[380,145],L:[450,145]},hot=(a,b)=>target==='v1'?(a==='h1'&&b==='o'):target==='w11'?((a==='x1'&&b==='h1')||(a==='h1'&&b==='o')):(a==='x1'||b==='o');
 const E=[['x1','h1','w₁₁ = 0.5'],['x1','h2','w₂₁ = 0.3'],['x2','h1','w₁₂ = −0.4'],['x2','h2','w₂₂ = 0.8'],['h1','o','v₁ = 0.7'],['h2','o','v₂ = −0.6']];
 let s=E.map(([a,b,t])=>{const on=hot(a,b),[x1,y1]=P[a],[x2,y2]=P[b];return `<path d="M${x1+28} ${y1}L${x2-28} ${y2}" stroke="${on?A:'var(--line)'}" stroke-width="${on?3.5:1.5}"/><text x="${(x1*0.62+x2*0.38)}" y="${(y1*0.62+y2*0.38)-6}" text-anchor="middle" font-size="11.5" fill="${on?A:'var(--muted)'}">${t}</text>`;}).join('');
 s+=`<path d="M408 145H424" stroke="${A}" stroke-width="3.5"/>`;
 const N=[['x1','x₁','1'],['x2','x₂','0.5'],['h1','h₁',F(r.h[0],3)],['h2','h₂',F(r.h[1],3)],['o','o',F(r.o,3)]];
 s+=N.map(([k,n,v])=>`<circle cx="${P[k][0]}" cy="${P[k][1]}" r="28" fill="var(--panel2)" stroke="var(--blue)" stroke-width="2"/><text x="${P[k][0]}" y="${P[k][1]-3}" text-anchor="middle" font-size="12" fill="var(--muted)">${n}</text><text x="${P[k][0]}" y="${P[k][1]+13}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--text)">${v}</text>`).join('');
 s+=`<text x="450" y="140" text-anchor="middle" font-size="12" fill="var(--muted)">L</text><text x="450" y="158" text-anchor="middle" font-size="13" font-weight="700" fill="var(--text)">${F(r.L,3)}</text><text x="240" y="262" text-anchor="middle" font-size="13" fill="var(--muted)">분홍 선: 고른 대상에서 손실 L까지 가는 경로 ${r.paths}개</text>`;
 return `<g class="dx-graph">${s}</g>`;
}
const TARGET_NAME={v1:'출력층 가중치 v₁',w11:'은닉층 가중치 w₁₁',x1:'입력 x₁'};
function auditFormula(t,m,r){
 const d=`${F(r.dLdo,4)} × ${F(r.do_,4)}`;
 if(t==='v1')return m==='skipact'?`2(o − y) × h₁ = ${F(r.dLdo,4)} × ${F(r.h[0],4)} (o(1 − o)가 빠짐)`:`2(o − y) × o(1 − o) × h₁ = ${d} × ${F(r.h[0],4)}`;
 if(t==='w11')return m==='skipact'?`${d} × v₁ × x₁ = ${d} × 0.7 × 1 (h₁(1 − h₁)가 빠짐)`:`2(o − y) × o(1 − o) × v₁ × h₁(1 − h₁) × x₁ = ${d} × 0.7 × ${F(r.dh[0],4)} × 1`;
 if(m==='skipact')return `${d} × (v₁·w₁₁ + v₂·w₂₁) = ${d} × (0.35 − 0.18) (h(1 − h) 두 개가 빠짐)`;
 if(m==='onepath')return `${d} × v₁·h₁(1 − h₁)·w₁₁ = ${d} × ${F(r.p1,4)} (h₂ 경로가 빠짐)`;
 if(m==='multiply')return `${d} × ${F(r.p1,4)} × (${F(r.p2,4)}) (두 경로를 곱함)`;
 return `${d} × (v₁·h₁(1 − h₁)·w₁₁ + v₂·h₂(1 − h₂)·w₂₁) = ${d} × (${F(r.p1,4)} + (${F(r.p2,4)}))`;
}
DXLabs.audit=el=>{
 U.setup(el,S('au-target','기울기를 구할 대상',[['v1','출력층 가중치 v₁ (h₁ → o)'],['w11','은닉층 가중치 w₁₁ (x₁ → h₁)'],['x1','입력 x₁ (경로 두 개)']],'w11')+S('au-mode','계산한 방식',[['correct','국소 미분을 빠짐없이 곱하고 경로를 더함'],['skipact','시그모이드의 미분을 빠뜨림'],['onepath','h₁을 지나는 경로만 셈'],['multiply','두 경로의 값을 더하지 않고 곱함']],'correct'));
 U.bind(el,()=>{const t=U.text(el,'au-target'),m=U.text(el,'au-mode'),r=M.audit(t,m),ok=r.relError<1e-6;
  U.result(el,U.svg(netSvg(t,r),`입력 둘, 은닉 뉴런 둘, 출력 하나인 망. ${TARGET_NAME[t]}에서 손실까지 가는 경로 ${r.paths}개를 굵게 그렸습니다.`),
  `순전파: h₁ = ${F(r.h[0],4)}, h₂ = ${F(r.h[1],4)}, o = ${F(r.o,4)}, L = (o − 1)² = ${F(r.L,4)}<br>${TARGET_NAME[t]}의 기울기를 이 방식으로 계산하면: ${auditFormula(t,m,r)} = <strong>${F(r.value,5)}</strong><br>대상을 10⁻⁵만큼 흔들어 잰 수치 미분 = <b>${F(r.numeric,5)}</b> · 상대 오차 ${r.relError<1e-6?'10⁻⁶ 미만':F(r.relError*100,0)+'%'}<br>`+
  (!r.applies?'이 대상은 손실까지 가는 경로가 하나뿐이라 이 실수가 생길 자리가 없습니다. 값은 빠짐없이 계산한 것과 같습니다.':ok?'수치 미분과 같습니다. 경로 위의 국소 미분을 모두 곱했고, 경로가 둘이면 더했습니다.':m==='skipact'?'수치 미분과 다릅니다. 시그모이드를 지날 때 곱해야 할 국소 미분이 빠져 값이 몇 배로 커졌습니다.':m==='onepath'?'수치 미분과 다릅니다. x₁은 h₁과 h₂ 두 곳에 쓰이는데 한 경로의 몫만 셌습니다.':'수치 미분과 다르고 부호까지 바뀌었습니다. 경로 안에서는 곱하고, 경로끼리는 더해야 합니다.')+
  '<br>가중치와 입력을 고정한 2-2-1 시그모이드 망(정답 y = 1)의 실제 계산입니다.');});
};
})();
