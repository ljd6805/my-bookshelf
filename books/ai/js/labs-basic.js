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
L.overfit=el=>{
 const xs=[-1,-.72,-.43,-.14,.14,.43,.72,1],ys=xs.map((x,i)=>Math.sin(x*3)+[.2,-.13,.18,-.15,.12,-.17,.14,-.23][i]);
 const mean=M.sum(ys)/8,slope=M.dot(xs,ys)/M.dot(xs,xs);
 U.setup(el,U.range('complexity','補간 곡선의 반영 비율',0,1,.02,0).replace('補간','보간'));
 U.bind(el,()=>{const a=U.value(el,'complexity'),fn=x=>(1-a)*(slope*x+mean)+a*M.lagrange(xs,ys,x),train=M.sum(xs.map((x,i)=>(fn(x)-ys[i])**2))/8,val=M.sum(U.series(x=>(fn(x)-Math.sin(3*x))**2,-1,1,100).map(p=>p[1]))/101;
 el.querySelector('.chart').innerHTML=U.plot({lines:[{data:U.series(fn,-1,1,160)},{data:U.series(x=>Math.sin(3*x),-1,1),color:'var(--blue)',dashed:true}],points:xs.map((x,i)=>[x,ys[i]]),xmin:-1.1,xmax:1.1,ymin:-1.8,ymax:1.8,xlabel:'입력 x',ylabel:'출력 y'});
 el.querySelector('.readout').innerHTML=`훈련 MSE <b>${U.fmt(train,4)}</b> · 검증 MSE <b>${U.fmt(val,4)}</b><br>청록: 직선과 7차 보간 다항식의 혼합 · 파란 점선: 실제 기저 함수. 비율 1에서는 훈련 점을 모두 통과합니다.`;});
};
})();
