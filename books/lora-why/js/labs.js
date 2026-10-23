/* 열두 실험. 계산은 LWMath가 브라우저에서 실제로 하고, 작업 계열과 씨앗은 이 책이 정한 장난감 세계다.
   같은 계산을 되풀이하지 않도록 결과를 캐시한다(입력이 같으면 결과도 같다). */
(()=>{
'use strict';
const M=LWMath,U=LWUI,L=LWLabs,cache={};
const memo=(key,f)=>key in cache?cache[key]:(cache[key]=f());
const world=(family='tone',m=null)=>memo(`w-${family}-${m}`,()=>M.makeWorld({family,m}));
const tuned=(family='tone',steps=300)=>memo(`ft-${family}-${steps}`,()=>M.fullFinetune(world(family),{steps}));
const FAMILY=[['tone','말투 계열 (다른 방향 3개)'],['format','형식 계열 (다른 방향 5개)'],['skill','새 능력 계열 (다른 방향 12개)']];
const sv=s=>U.bars(s.map((_,i)=>`σ${i+1}`),s,{digits:2});
L.delta=el=>{
 U.setup(el,U.select('fam','새 작업이 속한 계열',FAMILY,'tone')+U.range('steps','경사하강 걸음 수',0,300,25,300));
 U.bind(el,()=>{
  const fam=el.querySelector('#fam').value,steps=U.value(el,'steps'),w=world(fam),ft=tuned(fam,steps),ratio=M.frob(ft.dW)/M.frob(w.W0);
  const pics=`<div class="lw-grids"><figure>${U.grid(w.W0,{label:'사전학습 가중치 W₀의 칸 그림'})}<figcaption class="caption">W₀ (사전학습)</figcaption></figure><figure>${U.grid(ft.W,{label:'미세조정 뒤 가중치 W₁의 칸 그림'})}<figcaption class="caption">W₁ (${steps}걸음 뒤)</figcaption></figure><figure>${U.grid(ft.dW,{label:'변화량 ΔW = W₁ − W₀의 칸 그림'})}<figcaption class="caption">ΔW = W₁ − W₀</figcaption></figure></div>`;
  U.result(el,pics+U.bars(['‖W₀‖','‖ΔW‖'],[M.frob(w.W0),M.frob(ft.dW)],{digits:2,mark:i=>i===1}),`${steps}걸음 뒤 변화량의 크기 ‖ΔW‖ = <b>${U.fmt(M.frob(ft.dW),2)}</b>로 W₀(${U.fmt(M.frob(w.W0),2)})의 <b>${U.pct(ratio,1)}</b>입니다. ${steps===0?`새 입력에서 잰 손실은 출발점 그대로 ${U.fmt(ft.start,3)}입니다.`:`새 입력에서 잰 손실은 ${U.fmt(ft.start,3)}에서 <b>${U.fmt(ft.loss,3)}</b>까지 줄어, 출발점과 정답 사이를 ${U.pct(M.gain(ft.W,w),1)} 메웠습니다.`}<br>${steps===0?'0걸음에서는 아직 아무것도 바꾸지 않아 W₁이 W₀과 같고 ΔW는 0입니다. 걸음 수를 올려 줄무늬가 생기는 모습을 보세요.':'세 칸 그림을 비교하면 W₁은 W₀와 거의 같고, 바뀐 부분 ΔW에는 가로·세로 줄무늬가 보입니다. 다음 장에서 이 줄무늬가 몇 개의 성분인지 셉니다.'}`);
 });
};
L.svd=el=>{
 U.setup(el,U.select('mat','나눌 행렬',[['dW','미세조정 변화량 ΔW (말투 작업)'],['W0','사전학습 가중치 W₀'],['scratch','0에서 학습한 변화량']],'dW')+U.range('k','남길 성분 수 k',0,16,1,3));
 U.bind(el,()=>{
  const kind=el.querySelector('#mat').value,k=U.value(el,'k'),w=world('tone');
  const A=memo('mat-'+kind,()=>kind==='W0'?w.W0:kind==='dW'?tuned('tone').dW:M.fullFinetune(w,{start:M.zeros(16,16)}).dW),dec=memo('dec-'+kind,()=>M.svd(A));
  const Ak=M.truncate(A,k,dec),rel=M.frob(M.add(A,Ak,-1))/M.frob(A),e=M.energy(dec.s,k);
  const pics=`<div class="lw-grids"><figure>${U.grid(A,{label:'원래 행렬의 칸 그림'})}<figcaption class="caption">원래 행렬</figcaption></figure><figure>${U.grid(Ak,{label:`성분 ${k}개로 만든 근사의 칸 그림`})}<figcaption class="caption">성분 ${k}개 근사</figcaption></figure></div>`;
  U.result(el,pics+U.bars(dec.s.map((_,i)=>`σ${i+1}`),dec.s,{digits:2,mark:i=>i<k}),`큰 성분 ${k}개가 제곱합(에너지)의 <b>${U.pct(e,1)}</b>를 담고, 버린 성분 때문에 생기는 상대 오차는 <b>${U.pct(rel,1)}</b>입니다. 저장할 수는 k·(16 + 16) = ${k*32}개(원래 256개).<br>에너지 90%를 담는 데 필요한 성분 수: <b>${M.rankFor(dec.s,0.9)}개</b>, 99%: ${M.rankFor(dec.s,0.99)}개. ${kind==='dW'?'미세조정 변화량은 앞 세 성분 뒤로 특잇값이 0.06 아래로 떨어집니다.':kind==='W0'?'사전학습 가중치는 특잇값이 고르게 퍼져 있어 성분을 많이 남겨야 합니다.':'0에서 학습하면 변화량이 곧 정답 행렬 전체라 특잇값이 고르게 퍼집니다.'}`);
 });
};
L.gradient=el=>{
 U.setup(el,U.range('batch','한 걸음에 쓰는 예제 수 b',1,32,1,4)+U.range('dims','입력이 놓인 방향 수 k',1,16,1,16));
 U.bind(el,()=>{
  const b=U.value(el,'batch'),k=U.value(el,'dims'),w=world('tone'),g=M.gradientRank(w,{batch:b,inputDims:k}),span=memo('span-'+k,()=>M.inputSpanCheck(w,{inputDims:k}));
  U.result(el,U.bars(g.s.map((_,i)=>`σ${i+1}`),g.s.map(x=>x/g.s[0]),{digits:3,mark:i=>i<g.rank}),`예제 ${b}개로 계산한 한 걸음의 기울기는 특잇값이 σ₁의 백만분의 1보다 큰 것이 <b>${g.rank}개</b>, 곧 랭크 ${g.rank}입니다. 이론상 한계는 min(b, k, 16) = ${g.bound}입니다(막대는 σ₁에 대한 비율).<br>입력을 ${k}개 방향에만 두고 자료 64개로 300걸음 학습하면 ΔW의 랭크는 <b>${span.rank}</b>이고, 입력이 없는 방향으로 나간 변화의 크기는 <b>${U.fmt(span.outside,6)}</b>입니다(‖ΔW‖ = ${U.fmt(span.norm,3)}). 기울기 δxᵀ의 행은 언제나 입력 x가 있는 방향에 놓이기 때문입니다.`);
 });
};
L.pretrain=el=>{
 U.setup(el,U.select('from','미세조정의 출발점',[['pre','사전학습한 W₀ (같은 계열 작업 20개의 평균)'],['zero','0 행렬 (사전학습 없음)']],'pre')+U.range('m','작업 계열이 서로 다른 방향 수 m',1,12,1,3));
 U.bind(el,()=>{
  const from=el.querySelector('#from').value,m=U.value(el,'m'),w=world('skill',m);
  const ft=memo(`pre-${from}-${m}`,()=>M.fullFinetune(w,{start:from==='pre'?w.W0:M.zeros(16,16)})),s=memo(`pres-${from}-${m}`,()=>M.svd(ft.dW).s);
  U.result(el,sv(s),`${from==='pre'?'사전학습한 W₀':'0 행렬'}에서 출발한 미세조정의 변화량 ‖ΔW‖ = <b>${U.fmt(M.frob(ft.dW),2)}</b>. 에너지 90%를 담는 성분은 <b>${M.rankFor(s,0.9)}개</b>, 99%는 <b>${M.rankFor(s,0.99)}개</b>입니다.<br>${from==='pre'?`계열의 작업들이 ${m}개 방향에서만 서로 다르므로, 공통 부분을 이미 배운 W₀에서는 남은 변화도 그 방향 안에 놓입니다(가정한 계열 구조 위의 계산).`:'출발점이 0이면 공통 부분까지 새로 배워야 해서, 변화량이 정답 행렬 전체가 되고 특잇값이 고르게 퍼집니다.'}`);
 });
};
L.intrinsic=el=>{
 U.setup(el,U.range('d','무작위로 고른 방향 수 d (전체 256)',0,256,8,96)+U.select('lr','비교할 LoRA 랭크',[1,2,3,4].map(r=>[String(r),`r = ${r} (학습하는 수 ${r*32}개)`]),'3'));
 U.bind(el,()=>{
  const d=U.value(el,'d'),r=Number(el.querySelector('#lr').value),w=world('tone'),c=memo('ic',()=>M.intrinsicCurve(w)),p=M.randomSubspace(w,d);
  const lora=[1,2,3,4].map(k=>[k*32,memo('lo-'+k,()=>M.trainLora(w,{r:k})).gain]);
  const chart=U.lines([{name:'무작위 부분공간 d개',pts:c.pts,color:'var(--blue)',dots:3},{name:'LoRA r = 1·2·3·4',pts:lora,color:'var(--accent)',dots:5},{name:`d = ${d}`,pts:[[d,p]],color:'var(--orange)',dots:6,only:true}],{xLabel:'학습하는 수 (무작위 d 또는 LoRA 32r)',yLabel:'필요한 변화를 메운 비율',yMax:1,xMax:256,hline:0.9,hlineLabel:'90%'});
  U.result(el,chart,`무작위로 고른 방향 <b>${d}개</b> 안에서 고칠 수 있는 최선은 필요한 변화의 <b>${U.pct(p,1)}</b>입니다. 90%에 처음 닿는 d(d90)는 <b>${c.d90}</b>입니다.<br>같은 작업에서 r = ${r}인 LoRA는 수 ${r*32}개를 학습해 <b>${U.pct(lora[r-1][1],1)}</b>를 메웁니다. 무작위 방향은 변화가 저랭크라는 것을 쓰지 못하고, LoRA는 방향 자체를 학습으로 고르기 때문입니다.`);
 });
};
L.dynamics=el=>{
 U.setup(el,U.select('r','랭크 r',[1,2,3,4,8].map(r=>[String(r),'r = '+r]),'3')+U.range('t','걸음',0,290,10,0));
 U.bind(el,()=>{
  const r=Number(el.querySelector('#r').value),t=U.value(el,'t'),w=world('tone'),run=memo('dyn-'+r,()=>M.trainLora(w,{r,steps:300,track:10})),log=run.log,cur=log.find(x=>x.t===t)||log[0];
  const chart=U.lines([{name:'A가 정답 입력 방향을 덮는 정도',pts:log.map(x=>[x.t,x.cover]),color:'var(--accent)'},{name:'B가 정답 출력 방향을 덮는 정도',pts:log.map(x=>[x.t,x.coverB]),color:'var(--blue)',dash:true},{name:'LoRA 한 걸음과 전체 기울기의 코사인',pts:log.map(x=>[x.t,Math.max(0,x.cos)]),color:'var(--orange)'},{name:`${t}걸음`,pts:[[t,cur.cover]],color:'var(--accent)',dots:6,only:true}],{xLabel:'걸음',yLabel:'0~1',yMax:1});
  U.result(el,chart,`${t}걸음: A의 행 ${r}개가 펼치는 공간이 정답 입력 방향 3개를 <b>${U.pct(cur.cover,0)}</b> 덮고, B는 정답 출력 방향을 <b>${U.pct(cur.coverB,0)}</b> 덮습니다. LoRA가 이 걸음에 W를 바꾸는 방향과 전체 기울기의 코사인은 <b>${U.fmt(cur.cos,2)}</b>입니다.<br>${t===0?`0걸음에는 B = 0이라 B만 움직이고, W의 변화는 기울기 G를 A의 무작위 행공간에 투영한 G·AᵀA뿐입니다. 무작위 ${r}차원이 3방향을 덮는 기댓값은 ${U.pct(Math.min(r,16)/16,0)} 안팎입니다.`:`0걸음의 덮는 정도(${U.pct(log[0].cover,0)})에서 지금까지 A가 정답 방향으로 돌아간 만큼이 늘었습니다.`}${t>0&&cur.cos<0.1?' 코사인이 0 가까이 떨어진 것은 랭크 안에서 더 줄일 손실이 거의 남지 않아 LoRA의 한 걸음이 0에 가까워졌기 때문입니다. 전체 기울기는 아직 남아 있지만 B·A로는 그 방향을 나타내지 못합니다.':''}`);
 });
};
L.expressivity=el=>{
 U.setup(el,U.select('fam','작업 계열',FAMILY,'tone')+U.range('r','LoRA 랭크 r',1,16,1,3));
 U.bind(el,()=>{
  const fam=el.querySelector('#fam').value,r=U.value(el,'r'),w=world(fam),ft=tuned(fam),dec=memo('xd-'+fam,()=>M.svd(ft.dW)),full=M.gain(ft.W,w);
  const best=Array.from({length:16},(_,k)=>[k+1,M.gain(M.add(w.W0,M.truncate(ft.dW,k+1,dec)),w)]),lo=memo(`x-${fam}-${r}`,()=>M.trainLora(w,{r}));
  const chart=U.lines([{name:'전체 미세조정 ΔW를 랭크 r로 자른 값',pts:best,color:'var(--blue)',dots:3},{name:`LoRA r = ${r} 학습`,pts:[[r,lo.gain]],color:'var(--accent)',dots:7,only:true}],{xLabel:'랭크 r',yLabel:'필요한 변화를 메운 비율',yMax:1.08,hline:full,hlineLabel:`전체 미세조정 ${U.pct(full,1)}`});
  U.result(el,chart,`r = ${r}인 LoRA를 600걸음 학습하면 <b>${U.pct(lo.gain,1)}</b>를 메웁니다. 학습하는 수는 ${r*32}개, 전체 미세조정은 256개로 ${U.pct(full,1)}입니다.<br>r = 16이면 B·A가 모든 16×16 행렬을 나타낼 수 있어 전체 미세조정과 같은 해에 닿습니다. ${fam==='skill'?'새 능력 계열은 다른 방향이 많아, r이 작으면 전체 미세조정과의 차이가 큽니다.':'이 계열은 앞 몇 성분이 변화를 거의 다 담아, 작은 r에서 이미 전체 미세조정과 비슷합니다.'}`);
 });
};
L.subspace=el=>{
 U.setup(el,U.select('r1','첫째 LoRA 랭크 (씨앗 21)',[1,2,4].map(r=>[String(r),'r = '+r]),'2')+U.select('r2','둘째 LoRA 랭크 (씨앗 22)',[4,8,16].map(r=>[String(r),'r = '+r]),'8'));
 U.bind(el,()=>{
  const r1=Number(el.querySelector('#r1').value),r2=Number(el.querySelector('#r2').value),w=world('tone');
  const a=memo(`sa-${r1}`,()=>M.trainLora(w,{r:r1,seed:21}).A),b=memo(`sb-${r2}`,()=>M.trainLora(w,{r:r2,seed:22}).A),phi=M.subspaceSimilarity(a,b);
  const rand=M.subspaceSimilarity(M.randn(r1,16,M.rng(41)),M.randn(r2,16,M.rng(42)));
  const head=['i \\ j',...phi[0].map((_,j)=>String(j+1))];
  U.result(el,U.table(head,phi.map((row,i)=>[String(i+1),...row.map(x=>U.fmt(x,2))]))+U.table(['비교 기준: 무작위 행렬끼리',...rand[0].map((_,j)=>String(j+1))],rand.map((row,i)=>[String(i+1),...row.map(x=>U.fmt(x,2))])),`φ(1, 1) = <b>${U.fmt(phi[0][0],2)}</b>: 첫째(r = ${r1})와 둘째(r = ${r2}) LoRA가 각각 가장 크게 쓰는 입력 방향이 거의 같습니다. 무작위 행렬끼리는 φ(1, 1) = ${U.fmt(rand[0][0],2)}입니다.<br>표의 칸 (i, j)는 첫째 A의 앞 i개 방향과 둘째 A의 앞 j개 방향이 겹치는 정도(0~1)입니다. 특잇값이 비슷한 둘째·셋째 성분(0.53과 0.50)은 실행마다 다르게 섞이고, A의 나머지 행에는 무작위 시작값이 많이 남아 있어, 아래쪽 칸으로 갈수록 값이 1에서 멀어집니다. 그래도 무작위 기준보다는 큽니다.`);
 });
};
L.energy=el=>{
 U.setup(el,U.range('count','자료 수',16,256,8,128)+U.range('noise','출력 잡음 σ',0,1,0.1,0.1));
 U.bind(el,()=>{
  const n=U.value(el,'count'),s=U.value(el,'noise'),rep=memo(`en-${n}-${s}`,()=>M.rankReport(world('tone'),{count:n,noise:s})),ks=[...Array(17).keys()];
  const chart=U.lines([{name:'에너지: 앞 k개 성분이 담는 비율',pts:ks.map(k=>[k,M.energy(rep.s,k)]),color:'var(--blue)',dots:3},{name:'성능: ΔW를 랭크 k로 잘랐을 때 메운 비율',pts:ks.map(k=>[k,Math.max(0,rep.perf[k])]),color:'var(--accent)',dots:3}],{xLabel:'남긴 성분 수 k',yLabel:'0~1',yMax:1});
  U.result(el,chart,`자료 ${n}개, 잡음 σ = ${s}: 전체 미세조정이 메운 비율 <b>${U.pct(rep.full,1)}</b>. 에너지 90%에 필요한 성분 수는 <b>${rep.k90}개</b>이고, 잘라도 전체 미세조정 성능의 99%를 지키는 성분 수는 <b>${rep.kPerf<0?'16개로도 없음':rep.kPerf+'개'}</b>입니다.<br>${rep.kPerf<0||rep.k90<rep.kPerf?'에너지로 센 랭크가 성능에 필요한 랭크보다 작습니다. 제곱합으로는 작은 성분도 새 입력의 손실을 줄이는 데 쓰이므로, 에너지 90%만 보고 r을 고르면 성능을 잃습니다.':rep.k90>rep.kPerf?'잡음을 맞춘 작은 성분들이 에너지를 나눠 가져, 에너지로 센 랭크가 성능에 필요한 랭크보다 큽니다. 그 성분들은 버려도 새 입력에서의 성능이 거의 그대로이거나 오히려 좋아집니다.':'이 설정에서는 두 랭크가 같습니다. 같은지 다른지는 미리 알 수 없어 둘 다 재야 합니다.'}`);
 });
};
L.regularize=el=>{
 U.setup(el,U.select('r','LoRA 랭크 r',[1,2,3,4,8].map(r=>[String(r),'r = '+r]),'3')+U.select('noise','출력 잡음 σ',[['0.3','0.3'],['0.6','0.6'],['1','1.0']],'0.6'));
 U.bind(el,()=>{
  const r=Number(el.querySelector('#r').value),s=Number(el.querySelector('#noise').value),rows=memo(`rg-${r}-${s}`,()=>M.dataSweep(world('tone'),{r,noise:s,counts:[12,16,24,32,48,64,128]}));
  const clip=v=>Math.max(-1,v),chart=U.lines([{name:'전체 미세조정',pts:rows.map(x=>[x.count,clip(x.full)]),color:'var(--blue)',dots:4},{name:`LoRA r = ${r}`,pts:rows.map(x=>[x.count,clip(x.lora)]),color:'var(--accent)',dots:4}],{xLabel:'자료 수 (12~128)',yLabel:'새 입력에서 메운 비율 (−1 아래는 −1로 그림)',yMin:-1,yMax:1,hline:0,hlineLabel:'출발점과 같음'});
  const at=x=>rows.find(q=>q.count===x);
  U.result(el,chart+U.table(['자료 수','전체 미세조정','LoRA'],rows.map(x=>[String(x.count),U.pct(x.full,1),U.pct(x.lora,1)]),i=>rows[i].lora>rows[i].full),`잡음 σ = ${s}, 자료 24개에서 메운 비율은 전체 미세조정 <b>${U.pct(at(24).full,1)}</b>, r = ${r}인 LoRA <b>${U.pct(at(24).lora,1)}</b>입니다. ${at(24).full<0||at(24).lora<0?'음수인 쪽은 미세조정 전보다 새 입력에서 오히려 나빠졌습니다.':'메운 비율이 0% 아래로 내려가면 미세조정 전보다 새 입력에서 나빠졌다는 뜻입니다.'}<br>자료가 적으면 256개를 모두 고치는 전체 미세조정이 잡음까지 맞추고, 랭크를 묶은 LoRA는 맞출 수 있는 방향이 적어 잡음을 덜 배웁니다. 자료가 128개로 많아지면 두 방법의 차이가 줄어듭니다.`);
 });
};
L.limits=el=>{
 U.setup(el,U.select('fam','새 작업의 계열',[['tone','말투 계열'],['skill','새 능력 계열']],'tone')+U.range('r','변화에 허락한 랭크 r',1,16,1,2));
 U.bind(el,()=>{
  const fam=el.querySelector('#fam').value,r=U.value(el,'r'),w=world(fam),pts=memo('to-'+fam,()=>M.tradeoff(w,[...Array(16)].map((_,i)=>i+1))),cur=pts[r-1];
  const chart=U.lines([{name:'랭크 1~16',pts:pts.map(p=>[p.learned*100,p.forgot]),color:'var(--blue)',dots:3},{name:`r = ${r}`,pts:[[cur.learned*100,cur.forgot]],color:'var(--accent)',dots:7,only:true}],{xLabel:'새 작업에서 배운 비율(%)',yLabel:'원래 작업 20개에서 늘어난 평균 손실',xMax:100,yMax:Math.max(...pts.map(p=>p.forgot))*1.05});
  U.result(el,chart,`${fam==='tone'?'말투':'새 능력'} 계열, 랭크를 ${r} 이하로 묶은 최선의 변화: 새 작업에 필요한 변화의 <b>${U.pct(cur.learned,1)}</b>를 배우고, 원래 작업 20개의 평균 손실이 <b>${U.fmt(cur.forgot,3)}</b> 늘어납니다. 제한이 없으면 ${U.pct(pts[15].learned,1)}와 ${U.fmt(pts[15].forgot,3)}입니다.<br>${fam==='tone'?'말투 계열은 r = 3이면 거의 다 배웁니다. 그 뒤로는 r을 올려도 배우는 양도 잊는 양도 늘지 않습니다.':'새 능력 계열은 r을 올릴 때마다 배우는 양과 잊는 양이 함께 늘어, 작은 r에서는 덜 배우고 덜 잊습니다.'} 잊은 양은 ‖ΔW‖²/16과 같습니다(원래 작업들의 평균이 W₀이므로).`);
 });
};
L.final=el=>{
 U.setup(el,U.select('task','시험할 작업',Object.entries(M.PROBES).map(([k,p])=>[k,p.name]),'a')+U.select('r','고를 LoRA 랭크 r',[1,2,3,4,6,8,12,16].map(r=>[String(r),'r = '+r]),'3'));
 U.bind(el,()=>{
  const key=el.querySelector('#task').value,r=Number(el.querySelector('#r').value),v=memo(`fin-${key}-${r}`,()=>M.probeVerdict(key,r)),p=M.PROBES[key];
  U.result(el,sv(v.rep.s),`시험 미세조정(자료 128개, σ = 0.1)의 ΔW: 에너지 90%에 성분 <b>${v.rep.k90}개</b>, 잘라도 성능 99%를 지키는 성분 <b>${v.rep.kPerf}개</b>. 전체 미세조정은 ${U.pct(v.rep.full,1)}를 메웁니다.<br>r = ${r}인 LoRA(학습하는 수 ${v.params}개)는 <b>${U.pct(v.lora.gain,1)}</b>를 메우고, 원래 작업의 평균 손실을 ${U.fmt(v.forgot,3)} 늘립니다(전체 미세조정은 ${U.fmt(v.fullForgot,3)}). 판정: <b>${v.enough?`r = ${r}에서 충분 ✓ (전체 미세조정의 95% 이상)`:`r = ${r}에서는 부족 ✗ (r을 키우거나 전체 미세조정과 비교)`}</b>. 이 판정은 장난감 세계의 「${p.name}」에 대한 것이며, 실제 모델에서는 평가 세트로 다시 확인합니다.`);
 });
};
})();
