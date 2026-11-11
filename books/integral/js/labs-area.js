/* 1~4장 실험: 직사각형으로 어림하기, 칸 수를 늘린 극한, 부호 있는 넓이, 쌓인 양 함수, 쌓인 양의 기울기, F(b) − F(a).
   계산은 모두 IGMath가 하고, 여기서는 입력을 읽어 그림과 결과 문장을 그린다. */
(()=>{
'use strict';
const U=IGUI,M=IGMath,F=U.num,R=U.range,S=U.select;
const RULES=[['left','왼쪽 끝 높이'],['right','오른쪽 끝 높이'],['mid','가운데 높이']];
const ruleName=k=>RULES.find(r=>r[0]===k)[1];
const rateCurve=(a,b)=>({data:U.curve(M.rate,a,b),color:'var(--accent)'});

IGLabs.rects=el=>{
 U.setup(el,S('rc-end','어디까지 잴까요',[[5,'처음 5분 (유입이 늘어나는 동안)'],[10,'10분 전체']],5)+R('rc-n','직사각형 수 n',1,40,1,5)+S('rc-rule','직사각형의 높이',RULES,'left'));
 U.bind(el,()=>{const end=U.value(el,'rc-end'),n=U.value(el,'rc-n'),rule=U.text(el,'rc-rule'),r=M.riemann(M.rate,0,end,n,rule),exact=M.stored(end),diff=r.sum-exact;
  const chart=U.plot({lines:[rateCurve(0,end)],rects:r.rects,xmin:0,xmax:end,ymin:0,ymax:16,xlabel:'시간 t (분)',ylabel:'유입 속도 (L/분)',label:`유입 속도 곡선 아래를 직사각형 ${n}개로 채운 그림. 높이는 각 칸의 ${ruleName(rule)}`});
  U.result(el,chart,`직사각형 ${n}개 · 한 칸의 폭 Δt = ${end}/${n} = <b>${F(r.dx,3)}분</b> · ${ruleName(rule)}<br>직사각형 넓이의 합 <strong>${F(r.sum)} L</strong> · 실제로 고인 양 ${F(exact)} L · 차이 <b>${F(diff)} L</b> (${F(Math.abs(diff)/exact*100,1)}%)<br>`+
  (Math.abs(diff)<0.005?'합이 실제 값과 소수 둘째 자리까지 같습니다.':diff<0?'직사각형이 곡선 아래 빈틈을 남겨 실제보다 적게 셌습니다.':'직사각형이 곡선 위로 튀어나와 실제보다 많이 셌습니다.')+
  (end===10&&rule!=='mid'?' 10분 전체에서는 유입 속도가 5분을 기준으로 좌우 대칭이라 왼쪽 끝과 오른쪽 끝 높이의 합이 같습니다.':'')+'<br>넓이 한 칸 = 높이(L/분) × 폭(분)이라 단위가 L입니다. 실제 계산입니다.');});
};

IGLabs.limit=el=>{
 U.setup(el,S('lm-n','직사각형 수 n',[5,10,20,50,100,200,500,1000].map(v=>[v,String(v)]),10)+S('lm-rule','그림에 보일 높이',RULES,'left'));
 U.bind(el,()=>{const n=U.value(el,'lm-n'),rule=U.text(el,'lm-rule'),v=k=>M.riemann(M.rate,0,5,n,k),l=v('left'),r=v('right'),m=v('mid'),shown=v(rule);
  const chart=U.plot({lines:[rateCurve(0,5)],rects:n<=100?shown.rects:[],fills:n>100?[{data:U.curve(M.rate,0,5)}]:[],xmin:0,xmax:5,ymin:0,ymax:16,xlabel:'시간 t (분)',ylabel:'유입 속도 (L/분)',label:`처음 5분의 유입 속도 곡선 아래를 직사각형 ${n}개로 채운 그림`});
  U.result(el,chart,`n = ${n}, Δt = ${F(5/n,3)}분<br>왼쪽 끝 합 <b>${F(l.sum,4)} L</b> · 오른쪽 끝 합 <b>${F(r.sum,4)} L</b> · 가운데 합 <b>${F(m.sum,4)} L</b><br>오른쪽 합 − 왼쪽 합 = <strong>${F(r.sum-l.sum,4)} L</strong> = (r(5) − r(0)) × Δt = 15 × ${F(5/n,3)}<br>정적분의 값 50 L는 언제나 두 합 사이에 있습니다. n을 두 배로 하면 두 합의 차이는 절반(${F((r.sum-l.sum)/2,4)} L)이 되고, 가운데 합의 오차 ${F(m.sum-50,4)} L는 약 4분의 1이 됩니다.`+(n>100?'<br>칸이 너무 가늘어 그림에서는 넓이 전체를 칠했습니다.':'')+'<br>실제 계산입니다.');});
};

IGLabs.signed=el=>{
 U.setup(el,R('sg-a','시작 시각 a (분)',0,10,0.5,0)+R('sg-b','끝 시각 b (분)',0,10,0.5,10));
 U.bind(el,()=>{const a=U.value(el,'sg-a'),b=U.value(el,'sg-b'),lo=Math.min(a,b),hi=Math.max(a,b),p=M.signedParts(M.net,lo,hi),value=M.netStored(b)-M.netStored(a);
  const seg=U.curve(M.net,lo,hi,160),pos=seg.map(([x,y])=>[x,Math.max(y,0)]),neg=seg.map(([x,y])=>[x,Math.min(y,0)]);
  const chart=U.plot({lines:[{data:U.curve(M.net,0,10),color:'var(--accent)'}],fills:lo<hi?[{data:pos,color:'var(--accent)',opacity:.38},{data:neg,color:'var(--orange)',opacity:.42}]:[],marks:[[a,'var(--blue)'],[b,'var(--blue)']],xmin:0,xmax:10,ymin:-9,ymax:8,xlabel:'시간 t (분)',ylabel:'순변화 속도 (L/분)',label:'들어오는 속도에서 배수 8 L/분을 뺀 순변화 속도 곡선. 0보다 위는 물이 느는 구간, 아래는 주는 구간'});
  U.result(el,chart,`구간 ${F(a,1)}분 → ${F(b,1)}분<br>0보다 위쪽 넓이(물이 는 양) <b>${F(p.pos)} L</b> · 아래쪽 넓이(물이 준 양) <b>${F(p.neg)} L</b><br>정적분 ∫ q(t) dt = <strong>${F(value)} L</strong>`+(a<b?` = ${F(p.pos)} − ${F(p.neg)}`:a>b?` (끝이 시작보다 앞이라 부호가 뒤집혔습니다: −(${F(p.pos)} − ${F(p.neg)}))`:' (구간의 폭이 0)')+`<br>`+
  (a===b?'시작과 끝이 같으면 더할 것이 없어 0입니다.':`탱크의 물은 이 구간에서 ${value>=0?F(value)+' L 늘었습니다':F(-value)+' L 줄었습니다'}. 순변화 속도가 0인 시각은 ${F(M.NET_ZERO[0])}분과 ${F(M.NET_ZERO[1])}분입니다.`)+'<br>넓이는 가운데점 2,000칸의 합, 정적분은 닫힌 식으로 계산했습니다.');});
};

IGLabs.accum=el=>{
 U.setup(el,S('ac-fn','어떤 날의 기록',[['rain','배수구를 닫은 날 · 유입 속도 r(t)'],['net','배수구를 연 날 · 순변화 속도 q(t) = r(t) − 8']],'rain')+R('ac-x','지금 시각 x (분)',0,10,0.25,4));
 U.bind(el,()=>{const net=U.text(el,'ac-fn')==='net',x=U.value(el,'ac-x'),f=net?M.net:M.rate,A=net?M.netStored:M.stored,h=0.25;
  const seg=U.curve(f,0,x,Math.max(2,Math.round(x*16)));
  const top=U.plot({lines:[{data:U.curve(f,0,10)}],fills:x>0?(net?[{data:seg.map(([a,b])=>[a,Math.max(b,0)]),opacity:.38},{data:seg.map(([a,b])=>[a,Math.min(b,0)]),color:'var(--orange)',opacity:.42}]:[{data:seg,opacity:.38}]):[],marks:[[x,'var(--blue)']],xmin:0,xmax:10,ymin:net?-9:0,ymax:net?8:16,xlabel:'시간 t (분)',ylabel:net?'순변화 속도 (L/분)':'유입 속도 (L/분)',label:`속도 곡선과 0분부터 ${x}분까지 칠한 넓이`});
  const bottom=U.plot({lines:[{data:U.curve(A,0,10),color:'var(--blue)'}],points:[[x,A(x),'var(--orange)',6]],marks:[[x,'var(--blue)']],xmin:0,xmax:10,ymin:net?-10:0,ymax:net?30:100,xlabel:'시간 x (분)',ylabel:'쌓인 양 A(x) (L)',label:`쌓인 양 함수 A(x)의 그래프와 x = ${x}에서의 점`});
  U.result(el,U.stack(top,bottom),`x = ${F(x)}분 · 지금 속도 ${net?'q':'r'}(x) = <b>${F(f(x))} L/분</b> · 0분부터 쌓인 양 A(x) = <strong>${F(A(x))} L</strong><br>`+(x+h>10?'기록이 10분에서 끝나므로 여기서 더 지난 뒤의 변화는 계산하지 않습니다.':`여기서 0.25분 더 지나면 A는 ${F(A(x+h)-A(x),3)} L 변합니다. 지금 속도 × 0.25분 = ${F(f(x)*h,3)} L와 견주어 보세요.`)+'<br>'+
  (f(x)>0.005?'속도가 0보다 크므로 A(x)는 오르는 중입니다.':f(x)<-0.005?'속도가 0보다 작으므로 A(x)는 내려가는 중입니다.':'속도가 0이라 A(x)는 이 순간 오르지도 내리지도 않습니다.')+' 위 그림에서 칠한 넓이가 아래 그림의 점 높이입니다. 실제 계산입니다.');});
};

IGLabs.slope=el=>{
 U.setup(el,R('sl-x','시각 x (분)',0,8,0.5,3)+S('sl-h','시간 간격 h (분)',[[2,'2'],[1,'1'],[0.5,'0.5'],[0.1,'0.1'],[0.01,'0.01'],[0.001,'0.001']],1));
 U.bind(el,()=>{const x=U.value(el,'sl-x'),h=U.value(el,'sl-h'),q=M.quotient(M.stored,x,h),r=M.rate(x),x1=Math.min(x+h,10.9);
  const top=U.plot({lines:[rateCurve(0,10)],fills:[{data:U.curve(M.rate,x,x+h,24),color:'var(--orange)',opacity:.55}],rects:[[x,h,q,'var(--blue)']],xmin:0,xmax:11,ymin:0,ymax:16,xlabel:'시간 t (분)',ylabel:'유입 속도 (L/분)',label:`x = ${x}에서 x + h = ${F(x+h,3)}까지 새로 쌓인 띠와, 같은 넓이의 직사각형`});
  const bottom=U.plot({lines:[{data:U.curve(M.stored,0,11),color:'var(--blue)'},{data:[[x-1,M.stored(x)-q],[x1+1,M.stored(x)+q*(x1+1-x)]],color:'var(--orange)',dashed:true}],points:[[x,M.stored(x)],[x+h,M.stored(x+h)]],xmin:0,xmax:11,ymin:0,ymax:110,xlabel:'시간 x (분)',ylabel:'쌓인 양 A(x) (L)',label:'쌓인 양 그래프 위의 두 점을 이은 직선'});
  U.result(el,U.stack(top,bottom),`A(${F(x,1)} + ${h}) − A(${F(x,1)}) = ${F(M.stored(x+h),4)} − ${F(M.stored(x),4)} = <b>${F(M.stored(x+h)-M.stored(x),4)} L</b><br>h로 나눈 평균 변화율 <strong>${F(q,4)} L/분</strong> · 그 시각의 유입 속도 r(${F(x,1)}) = <b>${F(r,4)} L/분</b> · 차이 ${F(q-r,4)}<br>`+
  (Math.abs(q-r)<0.01?'h가 작아 평균 변화율이 유입 속도와 소수 둘째 자리까지 같습니다. A′(x) = r(x)입니다.':'h를 줄이면 주황색 띠가 가늘어져 높이가 거의 r(x)인 직사각형이 되고, 평균 변화율이 r(x)에 가까워집니다.')+'<br>위 그림의 파란 직사각형은 주황 띠와 넓이가 같고 높이가 평균 변화율입니다. 실제 계산입니다.');});
};

IGLabs.evaluate=el=>{
 U.setup(el,R('ev-a','아래끝 a (분)',0,10,0.5,2)+R('ev-b','위끝 b (분)',0,10,0.5,7));
 U.bind(el,()=>{const a=U.value(el,'ev-a'),b=U.value(el,'ev-b'),Fa=M.stored(a),Fb=M.stored(b),lo=Math.min(a,b),hi=Math.max(a,b),sign=a<=b?1:-1;
  const r10=sign*M.riemann(M.rate,lo,hi,10,'mid').sum,r1000=sign*M.riemann(M.rate,lo,hi,1000,'mid').sum;
  const top=U.plot({lines:[rateCurve(0,10)],fills:lo<hi?[{data:U.curve(M.rate,lo,hi,80),opacity:.38}]:[],marks:[[a,'var(--blue)'],[b,'var(--orange)']],xmin:0,xmax:10,ymin:0,ymax:16,xlabel:'시간 t (분)',ylabel:'유입 속도 (L/분)',label:`유입 속도 곡선 아래 ${lo}분에서 ${hi}분까지의 넓이`});
  const bottom=U.plot({lines:[{data:U.curve(M.stored,0,10),color:'var(--blue)'},{data:[[b,Fa],[b,Fb]],color:'var(--orange)',w:4},{data:[[a,Fa],[b,Fa]],color:'var(--muted)',dashed:true}],points:[[a,Fa,'var(--blue)'],[b,Fb,'var(--orange)']],xmin:0,xmax:10,ymin:0,ymax:100,xlabel:'시간 t (분)',ylabel:'원시함수 F(t) (L)',label:'원시함수 F(t) = 3t² − 0.2t³의 그래프와 두 점의 높이 차'});
  U.result(el,U.stack(top,bottom),`F(t) = 3t² − 0.2t³ · F(${F(b,1)}) = ${F(Fb,3)} · F(${F(a,1)}) = ${F(Fa,3)}<br>∫ r(t) dt (${F(a,1)}분 → ${F(b,1)}분) = F(b) − F(a) = <strong>${F(Fb-Fa,3)} L</strong><br>같은 구간의 가운데 합: 10칸 <b>${F(r10,3)} L</b> · 1,000칸 <b>${F(r1000,3)} L</b><br>`+
  (a===b?'아래끝과 위끝이 같아 값이 0입니다.':a>b?'위끝이 아래끝보다 작아 값의 부호가 뒤집혔습니다.':'직사각형 1,000개를 더한 값과, 원시함수에 두 번 대입해 뺀 값이 소수 셋째 자리까지 같습니다.')+' 아래 그림의 주황 선분 길이가 위 그림에서 칠한 넓이입니다. 실제 계산입니다.');});
};
})();
