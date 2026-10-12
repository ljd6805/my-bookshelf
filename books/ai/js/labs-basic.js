(()=>{
const U=AIUI,M=AIMath,L=AILabs;
L.neuron=el=>{
 U.setup(el,U.range('x1','입력 x₁',-2,2,.1,1)+U.range('w1','가중치 w₁',-3,3,.1,1)+U.range('w2','가중치 w₂ (x₂=1)',-3,3,.1,-.5)+U.range('bias','편향 b',-3,3,.1,0));
 U.bind(el,()=>{const a=U.value(el,'x1'),w=U.value(el,'w1'),v=U.value(el,'w2'),b=U.value(el,'bias'),z=a*w+v+b;
 el.querySelector('.chart').innerHTML=U.plot({lines:[{data:U.series(x=>M.sigmoid(w*x+v+b),-2,2)}],points:[[a,M.sigmoid(z)]],xmin:-2,xmax:2,ymin:0,ymax:1,xlabel:'입력 x₁',ylabel:'출력 y'});
 el.querySelector('.readout').innerHTML=`z = ${U.fmt(a)} × ${U.fmt(w)} + ${U.fmt(v)} + ${U.fmt(b)} = <b>${U.fmt(z)}</b><br>sigmoid(z) = <b>${U.fmt(M.sigmoid(z),3)}</b>`;});
};
L.activation=el=>{
 U.setup(el,'<label class="control">활성화 함수<select id="fn"><option value="relu">ReLU</option><option value="sigmoid">Sigmoid</option><option value="tanh">Tanh</option></select></label>'+U.range('ax','입력 z',-5,5,.1,1));
 U.bind(el,()=>{const name=el.querySelector('#fn').value,fn={relu:x=>Math.max(0,x),sigmoid:M.sigmoid,tanh:Math.tanh}[name],x=U.value(el,'ax');
 el.querySelector('.chart').innerHTML=U.plot({lines:[{data:U.series(fn,-5,5)}],points:[[x,fn(x)]],xmin:-5,xmax:5,ymin:-1.2,ymax:name==='relu'?5:1.2,xlabel:'z',ylabel:name});
 el.querySelector('.readout').innerHTML=`f(${U.fmt(x)}) = <b>${U.fmt(fn(x),3)}</b><br>${name==='relu'?'ReLU는 음수 입력을 0으로 만듭니다. 양수 구간에서는 입력을 그대로 전달합니다.':'입력의 절댓값을 크게 하면 출력이 포화되어 기울기가 작아집니다.'}`;});
};
L.regression=el=>{
 const pts=[[-2,-2.8],[-1,-1.1],[0,1.2],[1,2.7],[2,5.1]];
 U.setup(el,U.range('slope','기울기 w',-1,4,.1,.5)+U.range('intercept','절편 b',-3,3,.1,0));
 U.bind(el,()=>{const w=U.value(el,'slope'),b=U.value(el,'intercept'),mse=M.sum(pts.map(([x,y])=>(w*x+b-y)**2))/pts.length;
 el.querySelector('.chart').innerHTML=U.plot({lines:[{data:[[-2,w*-2+b],[2,w*2+b]]}],points:pts,xmin:-2.5,xmax:2.5,ymin:-5,ymax:8,xlabel:'입력 x',ylabel:'정답·예측 y'});
 el.querySelector('.readout').innerHTML=`예측 = ${U.fmt(w)}x + ${U.fmt(b)}<br>평균 제곱 오차 MSE = <b>${U.fmt(mse,3)}</b> · 주황 점은 정답, 청록 선은 예측입니다.`;});
};
L.descent=el=>{
 let w=-3,steps=0,history=[[-3,36]];
 U.setup(el,U.range('lr','학습률 η',.02,1.1,.02,.1)+'<div class="buttons"><button id="one">한 번 학습</button><button id="ten">10번 학습</button><button id="reset">초기화</button></div>');
 const render=()=>{el.querySelector('#one').disabled=el.querySelector('#ten').disabled=Math.abs(w)>1e6;el.querySelector('.chart').innerHTML=U.plot({lines:[{data:U.series(x=>(x-3)**2,-5,8)}],points:history.slice(-10).map((p,i)=>[...p,i===history.slice(-10).length-1?'var(--orange)':'var(--blue)']),xmin:-5,xmax:8,ymin:0,ymax:65,xlabel:'파라미터 w',ylabel:'손실 L'});el.querySelector('.readout').innerHTML=`${steps}회 갱신 · w = <b>${U.fmt(w,4)}</b> · L = <b>${U.fmt((w-3)**2,4)}</b><br>${Math.abs(w)>8?'손실이 커져 점이 차트 범위를 벗어났습니다. |w|가 100만을 넘으면 발산으로 보고 계산을 멈춥니다. 학습률을 낮추고 초기화해 보세요.':'최솟값은 w=3입니다. 주황 점이 현재 위치입니다.'}`;};
 function run(n){for(let i=0;i<n&&Math.abs(w)<=1e6;i++){w=w-U.value(el,'lr')*2*(w-3);steps++;history.push([w,(w-3)**2]);history=history.slice(-10);if(Math.abs(w)>1e6)break;}render();}
 el.querySelector('#one').onclick=()=>run(1);el.querySelector('#ten').onclick=()=>run(10);el.querySelector('#reset').onclick=()=>{w=-3;steps=0;history=[[-3,36]];render();};U.bind(el,render);
};
L.backprop=el=>{
 // 실제 계산: x=1, t=3로 고정한 두 층 모형의 순전파·역전파·갱신. 슬라이더는 시작점을 정하고, 버튼이 내부 상태를 갱신한다.
 let w1=.5,w2=2,steps=0;
 U.setup(el,U.range('bw1','첫 층 가중치 w₁ (시작값)',-1,2,.1,.5)+U.range('bw2','둘째 층 가중치 w₂ (시작값)',-1,3,.1,2)+U.range('blr','학습률 η',.01,.3,.01,.05)+'<div class="buttons"><button id="bp-step">한 걸음 갱신</button><button id="bp-ten">10걸음 갱신</button></div><p class="caption">입력 x=1, 정답 t=3으로 고정합니다. h=ReLU(w₁x), y=w₂h, L=(y−t)². 슬라이더를 움직이면 그 값에서 다시 시작합니다.</p>');
 const render=()=>{const g=M.backprop(w1,w2),num=M.numericGrad(v=>M.backprop(v,w2).loss,w1),big=!(g.loss<1e6);
 el.querySelector('#bp-step').disabled=el.querySelector('#bp-ten').disabled=big;
 el.querySelector('.chart').innerHTML=U.plot({lines:[{data:U.series(v=>M.backprop(v,w2).loss,Math.min(-1,w1-.5),Math.max(3,w1+.5),140)}],points:[[w1,g.loss]],xmin:Math.min(-1,w1-.5),xmax:Math.max(3,w1+.5),ymin:0,ymax:12,xlabel:'첫 층 가중치 w₁ (w₂는 현재값 고정)',ylabel:'손실 L'});
 const dead=g.a<=0?'<br>ReLU가 꺼져 h=0입니다. ∂L/∂h가 0이 아니어도 ReLU를 지나며 0이 곱해져 ∂L/∂w₁=0, h=0이라 ∂L/∂w₂=0입니다. 두 가중치 모두 움직이지 않습니다(죽은 ReLU).':'';
 const kink=Math.abs(g.a)<1e-9?' 꺾이는 점이라 수치 미분과 해석 기울기가 다릅니다.':'';
 el.querySelector('.readout').innerHTML=`${steps}회 갱신 · w₁ = <b>${U.fmt(w1,3)}</b>, w₂ = <b>${U.fmt(w2,3)}</b><br>순전파: h = ${U.fmt(g.h,3)} → y = ${U.fmt(g.y,3)} → 손실 L = <b>${U.fmt(g.loss,4)}</b><br>역전파: ∂L/∂y = ${U.fmt(g.dy,3)} → ∂L/∂w₂ = ${U.fmt(g.dw2,3)}, ∂L/∂h = ${U.fmt(g.dh,3)} → ∂L/∂w₁ = <b>${U.fmt(g.dw1,3)}</b> · 수치 미분(ε=0.01) ${U.fmt(num,3)}${kink}${dead}${big?'<br>손실이 100만을 넘어 계산을 멈춥니다. 학습률을 낮추고 시작값을 다시 고르세요.':''}`;};
 function run(n){const eta=U.value(el,'blr');for(let i=0;i<n&&M.backprop(w1,w2).loss<1e6;i++){({w1,w2}=M.backpropStep(w1,w2,eta));steps++;}render();}
 el.querySelector('#bp-step').onclick=()=>run(1);el.querySelector('#bp-ten').onclick=()=>run(10);
 U.bind(el,()=>{w1=U.value(el,'bw1');w2=U.value(el,'bw2');steps=0;render();});
};
L.overfit=el=>{
 const xs=[-1,-.72,-.43,-.14,.14,.43,.72,1],ys=xs.map((x,i)=>Math.sin(x*3)+[.2,-.13,.18,-.15,.12,-.17,.14,-.23][i]);
 const mean=M.sum(ys)/8,slope=M.dot(xs,ys)/M.dot(xs,xs);
 U.setup(el,U.range('complexity','보간 곡선의 반영 비율',0,1,.02,0));
 U.bind(el,()=>{const a=U.value(el,'complexity'),fn=x=>(1-a)*(slope*x+mean)+a*M.lagrange(xs,ys,x),train=M.sum(xs.map((x,i)=>(fn(x)-ys[i])**2))/8,val=M.sum(U.series(x=>(fn(x)-Math.sin(3*x))**2,-1,1,100).map(p=>p[1]))/101;
 el.querySelector('.chart').innerHTML=U.plot({lines:[{data:U.series(fn,-1,1,160)},{data:U.series(x=>Math.sin(3*x),-1,1),color:'var(--blue)',dashed:true}],points:xs.map((x,i)=>[x,ys[i]]),xmin:-1.1,xmax:1.1,ymin:-1.8,ymax:1.8,xlabel:'입력 x',ylabel:'출력 y'});
 el.querySelector('.readout').innerHTML=`훈련 MSE <b>${U.fmt(train,4)}</b> · 검증 MSE <b>${U.fmt(val,4)}</b><br>청록: 직선과 7차 보간 다항식의 혼합 · 파란 점선: 실제 기저 함수. 비율 1에서는 훈련 점을 모두 통과합니다.`;});
};
})();
