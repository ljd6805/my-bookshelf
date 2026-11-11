/* 1~3장 실험: 텐서 모양, 예측선과 손실, 손실의 기울기, 경사하강 한 걸음, 배치와 모멘텀.
   계산은 모두 NCMath가 하고, 여기서는 입력을 읽어 그림과 결과 문장을 그린다. */
(()=>{
'use strict';
const U=NCUI,M=NCMath,F=U.fmt,R=U.range,S=U.select;
const int=n=>n.toLocaleString('en-US');
const bytes=b=>b<1024?`${int(b)}바이트`:b<1048576?`${F(b/1024,1)}KB`:`${F(b/1048576,1)}MB`;

NCLabs.shape=el=>{
 U.setup(el,S('sh-kind','데이터 종류',[['table','표 (카페 기록, 기온 1열)'],['gray','흑백 이미지'],['color','컬러 이미지'],['text','문장 (토큰 12개, 벡터 길이 64)']],'gray')+R('sh-batch','한 묶음의 표본 수',1,64,1,32)+S('sh-side','이미지 한 변 (픽셀)',[[28,'28'],[64,'64'],[224,'224']],28)+S('sh-layout','채널 축의 자리 (컬러만)',[['first','채널 먼저 (PyTorch)'],['last','채널 마지막 (Keras 기본)']],'first'));
 U.bind(el,()=>{const k=U.text(el,'sh-kind'),B=U.value(el,'sh-batch'),side=U.value(el,'sh-side'),last=U.text(el,'sh-layout')==='last';
  const r=M.tensorShape(k,B,{features:1,side,last}),img=k==='gray'||k==='color';
  const cards=U.cards(r.axes.map((a,i)=>[`축 ${i} · ${a}`,`크기 ${int(r.shape[i])}`]),0);
  U.result(el,cards,`모양 <strong>(${r.shape.join(', ')})</strong> · 축 ${r.rank}개(${r.rank}차원 텐서)<br>표본 하나의 모양 (${r.one.join(', ')}${r.one.length===1?',':''}) 앞에 묶음 축 ${B}이 붙었습니다.<br>원소 수 ${r.shape.join(' × ')} = <b>${int(r.elements)}개</b> · float32로 <b>${bytes(r.bytes)}</b><br>`+
  (img?'':'이 데이터에는 "이미지 한 변"이 쓰이지 않습니다. ')+(k==='color'?(last?'채널 축이 맨 뒤에 있습니다. 원소 수는 같지만 PyTorch 합성곱 층에 그대로 넣으면 축의 뜻이 어긋납니다.':'채널 축이 묶음 축 바로 뒤에 있습니다.'):'"채널 축의 자리"는 컬러 이미지에서만 쓰입니다.')+'<br>축 크기를 곱한 실제 계산입니다.');});
};

/* 여덟 점, 예측선, 점에서 선까지의 오차 선분 */
function lineChart(D,w,b){
 const res=D.x.map((x,i)=>({data:[[x,D.y[i]],[x,w*x+b]],color:'var(--orange)',dashed:true}));
 return U.plot({lines:[{data:[[-0.5,b-0.5*w],[7.5,b+7.5*w]],color:'var(--accent)'},...res],points:D.x.map((x,i)=>[x,D.y[i],'var(--blue)',5]),xmin:-0.5,xmax:7.5,ymin:0,ymax:50,xlabel:'기온 − 20 (℃)',ylabel:'판매 (잔)',label:`여덟 날의 판매와 예측선 ŷ = ${F(w)}x + ${F(b,1)}, 점에서 선까지의 오차`});
}
NCLabs.lineloss=el=>{
 U.setup(el,R('ll-w','기울기 w (잔/℃)',0,8,0.05,3)+R('ll-b','절편 b (잔)',0,24,0.5,12)+S('ll-data','8일째 기록',[['normal','41잔 (기록 그대로)'],['outlier','9잔 (기계가 고장 난 날)']],'normal'));
 U.bind(el,()=>{const w=U.value(el,'ll-w'),b=U.value(el,'ll-b'),D=M.lineData(U.text(el,'ll-data')==='outlier'),l=M.lineLoss(w,b,D),best=M.lineFit(D),bl=M.lineLoss(best.w,best.b,D);
  const worst=l.res.reduce((k,e,i)=>Math.abs(e)>Math.abs(l.res[k])?i:k,0);
  U.result(el,lineChart(D,w,b),`ŷ = ${F(w)}·x + ${F(b,1)} · MSE <strong>${F(l.mse)}</strong> 잔² · MAE <b>${F(l.mae)}</b>잔 · RMSE <b>${F(l.rmse)}</b>잔<br>오차가 가장 큰 날: ${worst+1}일째, 예측 ${F(w*D.x[worst]+b,1)}잔 − 실제 ${D.y[worst]}잔 = <b>${F(l.res[worst],1)}잔</b> (이 하루가 제곱 합의 ${F(l.res[worst]**2/(l.mse*8)*100,0)}%)<br>이 데이터에서 MSE가 가장 작은 선: w = ${F(best.w)}, b = ${F(best.b)} (MSE ${F(bl.mse)}, MAE ${F(bl.mae)})<br>`+
  (l.mse<=bl.mse*1.1?'지금 선은 MSE가 가장 작은 선과 거의 같습니다.':l.bias>0?'예측이 평균적으로 실제보다 큽니다. w나 b를 줄여 보세요.':'예측이 평균적으로 실제보다 작습니다. w나 b를 키워 보세요.')+'<br>가상 기록 8개로 실제 계산한 값입니다.');});
};

NCLabs.lossgrad=el=>{
 U.setup(el,R('lg-p','예측 확률 p (정답은 1)',0.01,0.99,0.01,0.3));
 U.bind(el,()=>{const p=U.value(el,'lg-p'),l=M.lossAt(p),ps=Array.from({length:99},(_,i)=>(i+1)/100);
  U.result(el,U.plot({lines:[{data:ps.map(q=>[q,Math.abs(M.lossAt(q).gBce)]),color:'var(--orange)'},{data:ps.map(q=>[q,Math.abs(M.lossAt(q).gMse)]),color:'var(--blue)',dashed:true}],points:[[p,Math.abs(l.gBce),'var(--orange)',6],[p,Math.abs(l.gMse),'var(--blue)',6]],xmin:0,xmax:1,ymin:0,ymax:1,xlabel:'예측 확률 p',ylabel:'|∂L/∂z|',label:'예측 확률에 따른 교차 엔트로피(실선)와 제곱 오차(점선)의 로짓 기울기 크기'}),
  `p = ${F(p)} · 손실: 교차 엔트로피 <b>${F(l.bce,3)}</b>, 제곱 오차 <b>${F(l.mse,3)}</b><br>로짓 기울기: 교차 엔트로피 p − 1 = <strong>${F(l.gBce,3)}</strong>, 제곱 오차 2(p − 1)p(1 − p) = <strong>${F(l.gMse,4)}</strong><br>`+
  (p<0.2?`크게 틀린 예측입니다. 교차 엔트로피 기울기가 제곱 오차보다 <b>${F(Math.abs(l.gBce/l.gMse),1)}배</b> 커서 훨씬 크게 고칩니다.`:p>0.8?'거의 맞힌 예측이라 두 기울기가 모두 작습니다.':'가운데 구간에서는 두 기울기의 차이가 비교적 작습니다.')+'<br>실선은 교차 엔트로피, 점선은 제곱 오차입니다. 표본 하나에 대한 공식 계산입니다.');});
};

NCLabs.slope=el=>{
 U.setup(el,S('sl-lr','학습률 η',[[0.005,'0.005'],[0.02,'0.02'],[0.05,'0.05'],[0.06,'0.06']],0.02)+R('sl-steps','걸음 수',1,12,1,6));
 U.bind(el,()=>{const lr=U.value(el,'sl-lr'),n=U.value(el,'sl-steps'),r=M.slopeWalk(0,lr,n),lim=M.slopeLimit(),L=w=>M.lineLoss(w,12).mse;
  const ws=Array.from({length:161},(_,i)=>-4+i*0.1),path=r.path,end=path[path.length-1],g=M.lineGrad(end,12).gw;
  U.result(el,U.plot({lines:[{data:ws.map(w=>[w,L(w)]),color:'var(--accent)'},{data:path.map(w=>[w,L(w)]),color:'var(--orange)',dashed:true}],points:path.map((w,i)=>[w,L(w),'var(--orange)',i===path.length-1?7:4]),xmin:-4,xmax:12,ymin:0,ymax:400,xlabel:'기울기 w (b = 12 고정)',ylabel:'MSE (잔²)',label:`손실 포물선과 학습률 ${lr}로 ${n}걸음 걸은 길`}),
  `η = ${lr} · ${n}걸음 · w: ${path.map(w=>F(w)).join(' → ')}<br>마지막 w = <strong>${F(end)}</strong>, MSE <b>${F(L(end))}</b> (출발 w = 0에서 ${F(L(0))}), 그 자리의 기울기 <b>${F(g)}</b><br>`+
  (lr>lim.limit?`<strong>걸을수록 최솟값에서 멀어집니다.</strong> η가 한계 2/35 ≈ ${F(lim.limit,3)}보다 커서 한 걸음마다 최솟값을 넘어 더 먼 곳에 떨어집니다.`:lr>lim.limit/2?`최솟값(w ≈ 3.96)을 넘어갔다가 돌아오기를 되풀이하며 다가갑니다. η가 한계 ${F(lim.limit,3)}의 절반보다 커서 생기는 지그재그입니다.`:Math.abs(end-3.964)<0.05?'최솟값(w ≈ 3.96)에 거의 닿았습니다. 기울기가 0에 가까워져 걸음도 작아집니다.':'최솟값(w ≈ 3.96) 쪽으로 같은 방향으로 다가가는 중입니다. 걸음 수를 늘려 보세요.')+'<br>카페 기록의 MSE로 실제 계산한 경로입니다.');});
};

NCLabs.batch=el=>{
 U.setup(el,S('bt-b','배치 크기 B (8일 중)',[[8,'8 (전체 배치)'],[4,'4'],[2,'2'],[1,'1 (하루씩)']],8)+S('bt-lr','학습률 η',[[0.01,'0.01'],[0.02,'0.02'],[0.05,'0.05'],[0.06,'0.06']],0.02)+S('bt-beta','모멘텀 β',[[0,'0 (없음)'],[0.9,'0.9']],0)+R('bt-epochs','epoch 수',10,200,10,30));
 U.bind(el,()=>{const B=U.value(el,'bt-b'),lr=U.value(el,'bt-lr'),beta=U.value(el,'bt-beta'),epochs=U.value(el,'bt-epochs'),r=M.descend({B,lr,beta,epochs});
  const lg=v=>Math.log10(Math.max(v,1e-3)),line=[[0,lg(r.first)],...r.steps.map((v,k)=>[(k+1)/r.perEpoch,lg(v)])],blown=r.diverged||!(r.mse<r.first);
  U.result(el,U.plot({lines:[{data:line,color:'var(--accent)'},{data:[[0,lg(r.floor)],[epochs,lg(r.floor)]],color:'var(--orange)',dashed:true}],xmin:0,xmax:epochs,ymin:0,ymax:4,xlabel:'epoch',ylabel:'log₁₀ MSE',label:`배치 크기 ${B}, 학습률 ${lr}, 모멘텀 ${beta}로 ${epochs} epoch 동안의 손실(로그 눈금)과 가장 잘 맞는 선의 손실(점선)`}),
  `B = ${B} · η = ${lr} · β = ${beta} · ${epochs} epoch = 1 epoch에 ${r.perEpoch}번 × ${epochs} = <b>${r.updates}번 갱신</b><br>`+
  (blown?`<strong>손실이 출발점(${F(r.first,1)})보다 커졌습니다.</strong> 걸음이 너무 커서 갱신할수록 최솟값에서 멀어집니다. 학습률을 낮추거나 모멘텀을 꺼 보세요.`:
  `마지막 선: w = <b>${F(r.w)}</b>, b = <b>${F(r.b)}</b>, MSE <strong>${F(r.mse)}</strong> (가장 잘 맞는 선 w = ${F(r.best.w)}, b = ${F(r.best.b)}의 MSE ${F(r.floor)})<br>갱신 뒤 손실이 오른 비율 <b>${F(r.upFrac*100,1)}%</b>. `+(r.upFrac>0.2?(B<8?'표본 몇 개로 어림한 기울기가 걸음마다 조금씩 달라 손실이 오르내립니다.':'모멘텀의 속도 때문에 최솟값을 지나쳤다 돌아오며 손실이 출렁입니다.'):'손실이 거의 매번 줄어듭니다.'))+
  '<br>세로축은 로그 눈금이고 점선은 가장 잘 맞는 선의 MSE입니다. 고정 시드로 실제 계산했습니다.');});
};
})();
