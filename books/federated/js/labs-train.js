/* 1부(1~3장)와 4장 실험: 학습 방식 비교, FedAvg, 통신량, non-IID, 기기 표류 모형. 계산은 FLMath, 여기서는 입력을 읽고 그린다. */
(()=>{
'use strict';
const M=FLMath,U=FLUI,L=FLLabs;
const users=()=>M.users(1);
/* 같은 설정의 학습은 한 번만 계산해 둔다(실험을 오갈 때 다시 계산하지 않도록). */
const memo=new Map();
function once(key,fn){if(!memo.has(key))memo.set(key,fn());return memo.get(key);}
const centralRun=()=>once('central',()=>M.central(users(),{epochs:40}));
const fedRun=(opts,h=1)=>once(JSON.stringify([opts,h]),()=>M.train(M.users(h),opts));
const Bval=v=>v==='inf'?Infinity:Number(v);
const STY=M.STYLES;

Object.assign(FLLabText,{
 where:['세 학습 방식에서 기기를 떠나는 것과 정확도 비교하기','중앙 학습, 데이터센터 데이터 병렬, 연합학습을 같은 사용자 1,000명으로 돌려 기기를 떠나는 원문 바이트, 서버가 받는 바이트, 첫 추천 적중률을 나란히 놓습니다.','데이터센터 데이터 병렬에서 작업기를 2대에서 16대로 늘리면, 묶음 하나의 평균 기울기는 한 대로 계산한 기울기와 얼마나 달라질까요? 0에 가까울지, 작업기 수에 따라 커질지 먼저 적어 보세요.','학습 횟수를 10에서 40으로 바꾸며 연합학습이 서버로 올리고 내려받는 바이트가 원문 전체(577,169바이트)를 처음 넘는 횟수를 찾아보세요. 그래도 연합학습을 쓰는 이유를 한 문장으로 적어 보세요.'],
 fedavg:['기기 안 학습 횟수 E·묶음 B·참여 비율 C로 FedAvg 곡선 그리기','서버가 라운드마다 기기 100대(C = 0.1)를 골라 모델을 보내고, 기기가 E번 훑으며 B개씩 학습한 업데이트를 학습 쌍 수로 가중 평균합니다. 40라운드 동안의 첫 추천 적중률을 중앙 학습과 비교합니다.','FedSGD(E 1, B ∞)는 40라운드 안에 첫 추천 적중률 0.60에 닿을까요? 닿는다면 몇 라운드쯤일지, 닿지 못한다면 40라운드 뒤 값이 얼마쯤일지 적어 보세요.','E를 1에서 20까지 바꾸며 0.60에 닿는 라운드 수가 더 줄지 않는 E를 찾고, E 20에서 줄임말 사용자의 적중이 E 5보다 낮아지는지 확인해 보세요(4장에서 이유를 다룹니다).'],
 comm:['목표 정확도까지 주고받는 바이트를 E와 업데이트 비트 수로 계산하기','라운드마다 기기 100대가 모델 900바이트를 받고 업데이트를 올립니다. 업데이트 숫자 하나를 32·8·4·2비트로 줄이고(확률적 반올림), 목표 적중률에 닿을 때까지 오간 바이트를 셉니다.','E 1, B 10으로 업데이트를 32비트에서 2비트로 줄이면 목표 0.60까지의 라운드 수는 늘까요? 오간 바이트는 몇 분의 몇이 될지 적어 보세요.','E 5에서 비트 수를 32 → 8 → 4 → 2로 내리며 목표까지의 바이트가 가장 작은 비트 수를 찾고, 2비트가 오히려 커지는 이유를 라운드 수로 설명해 보세요.'],
 noniid:['말투가 사용자마다 다를 때 E와 μ로 말투별 적중 비교하기','h는 사용자마다 말투가 얼마나 다른지(0 = 모두 같은 섞임, 1 = 자기 말투만)입니다. 같은 씨앗으로 사용자를 다시 만들고 40라운드 FedAvg를 돌려 말투별 첫 추천 적중률과 정답 확률을 봅니다.','h 1에서 E를 5에서 20으로 늘리면 줄임말 사용자의 적중은 오를까요, 내릴까요? h 0에서는 같은 변화가 일어날지도 함께 적어 보세요.','h 1, E 20에서 μ를 0 → 0.1 → 1로 바꾸며 줄임말 적중이 가장 높은 μ를 찾고, μ 1에서 전체 정답 확률이 왜 떨어지는지 “받은 모델 근처에 묶는다”는 말로 설명해 보세요.'],
 drift:['기기 셋의 2차원 손실에서 FedAvg·FedProx·SCAFFOLD의 경로 그리기','기기 셋의 손실은 최적점이 서로 다른 그릇 모양입니다(이 책이 정한 축소 모형). 기기가 라운드마다 K걸음 학습하고 서버가 평균하는 40라운드의 경로와, 전체 최적점까지 남은 거리를 봅니다.','FedAvg에서 기기 안 걸음 K를 1에서 20으로 늘리면 40라운드 뒤 전체 최적점까지의 거리는 줄까요, 늘까요?','K 20에서 FedProx의 μ를 0, 0.5, 1, 2로 바꾸며 거리를 적고, μ를 키워도 거리가 0이 되지 않는 이유를 SCAFFOLD와 비교해 설명해 보세요.','실제 계산 · 이 책이 정한 2차원 손실(기기 셋)']
});

L.where=el=>{
 U.setup(el,U.select('wmode','살펴볼 방식',[['central','중앙 학습'],['dc','데이터센터 데이터 병렬'],['fl','연합학습(FedAvg)']],'fl')+U.range('wn','학습 횟수(훑기 또는 라운드)',10,40,10,20)+U.range('wk','데이터 병렬의 작업기 수',2,16,2,4));
 U.bind(el,()=>{
  const mode=el.querySelector('#wmode').value,n=U.value(el,'wn'),k=U.value(el,'wk'),c=centralRun(),f=fedRun({C:.1,E:5,B:10,rounds:40}),raw=M.rawBytes(users());
  const batch=users().flatMap(u=>u.train).slice(0,100),gap=M.dataParallelGap(c.w,batch,k),fb=f.logs.slice(0,n).reduce((s,l)=>s+l.bytes,0);
  const rows=[['중앙 학습','회사 서버',U.bytes(raw),U.bytes(raw),U.fmt(c.curve[n-1],3)],['데이터센터 데이터 병렬',`데이터센터(작업기 ${k}대)`,U.bytes(raw),U.bytes(raw),U.fmt(c.curve[n-1],3)],['연합학습(FedAvg)','사용자 기기','0바이트',U.bytes(fb),U.fmt(f.curve[n-1],3)]];
  const pick=['central','dc','fl'].indexOf(mode);
  const say=[`중앙 학습은 학습 쌍 ${U.int(c.pairs)}개를 모두 서버로 모읍니다. 원문 ${U.bytes(raw)}가 기기를 떠나고, ${n}번 훑은 뒤 첫 추천 적중률은 <b>${U.fmt(c.curve[n-1],3)}</b>입니다.`,
   `데이터 병렬도 원문을 먼저 데이터센터로 모은 뒤 운영자가 작업기 ${k}대에 나눕니다. 묶음 100쌍의 기울기를 ${k}대가 나눠 계산해 몫만큼 평균하면 한 대가 계산한 기울기와 가장 크게 다른 칸이 <b>${gap.toExponential(1)}</b>로, 컴퓨터의 반올림 오차 수준입니다. 그래서 정확도는 중앙 학습과 같습니다.`,
   `연합학습은 원문을 기기에 두고, 라운드마다 기기 100대가 모델(900바이트)을 받아 업데이트(900바이트)를 올립니다. ${n}라운드 동안 오간 바이트는 <b>${U.bytes(fb)}</b>이고 적중률은 <b>${U.fmt(f.curve[n-1],3)}</b>입니다.`][pick];
  U.result(el,U.table(['방식','원문이 있는 곳','기기를 떠나는 원문','서버와 오간 바이트','첫 추천 적중률'],rows,{caption:`학습 ${n}번 뒤 · 합성 사용자 1,000명`,mark:i=>i===pick}),`${say}<br>세 방식 모두 같은 모델(가중치 225개)과 같은 시험 쌍 20,000개로 채점했습니다. 연합학습이 오간 바이트가 원문보다 많을 수도 있다는 점도 확인해 보세요.`);
 });
};

L.fedavg=el=>{
 U.setup(el,U.select('fe','기기 안에서 훑는 횟수 E',[1,2,5,10,20].map(x=>[x,String(x)]),1)+U.select('fb','기기 안 묶음 크기 B',[['inf','∞ (전체 한 묶음)'],['50','50'],['10','10']],'10')+U.select('fc','참여 비율 C',[['0.02','0.02 (20대)'],['0.05','0.05 (50대)'],['0.1','0.1 (100대)'],['0.3','0.3 (300대)']],'0.1'));
 U.bind(el,()=>{
  const E=Number(el.querySelector('#fe').value),B=Bval(el.querySelector('#fb').value),C=Number(el.querySelector('#fc').value),r=fedRun({C,E,B,rounds:40}),c=centralRun(),k=M.roundsTo(r.curve,.6);
  const name=E===1&&B===Infinity?'FedSGD':'FedAvg';
  U.result(el,U.lines([{name:`${name} (E ${E}, B ${B===Infinity?'∞':B}, C ${C})`,values:r.curve},{name:'중앙 학습(한 번 훑기 = 1)',values:c.curve,dash:true}],{ymin:.3,ymax:.7,ylabel:'첫 추천 적중률',target:.6}),
   `${name} 40라운드 뒤 첫 추천 적중률 <b>${U.fmt(r.final.acc,3)}</b>(존댓말 ${U.fmt(r.final.byStyle[0],3)} · 반말 ${U.fmt(r.final.byStyle[1],3)} · 줄임말 ${U.fmt(r.final.byStyle[2],3)}), 정답 확률 ${U.fmt(r.final.prob,3)}. 중앙 학습은 ${U.fmt(c.final.acc,3)}입니다.<br>0.60에 닿은 라운드: <b>${k?k+'라운드':'40라운드 안에 닿지 못함'}</b>. 라운드마다 참여한 기기 ${U.int(r.logs[0].used)}대가 학습 쌍 수 n<sub>k</sub>로 가중 평균되었고, 분모는 그 라운드 참여 기기의 쌍 수 합 m<sub>t</sub>입니다.`);
 },{heavy:true});
};

L.comm=el=>{
 U.setup(el,U.select('ce','기기 안에서 훑는 횟수 E (B 10)',[[1,'1'],[5,'5'],[20,'20']],5)+U.select('cb','업데이트 숫자 하나의 비트 수',[[32,'32비트(그대로)'],[8,'8비트'],[4,'4비트'],[2,'2비트']],32)+U.select('ct','목표 첫 추천 적중률',[['0.6','0.60'],['0.62','0.62']],'0.6'));
 U.bind(el,()=>{
  const E=Number(el.querySelector('#ce').value),b=Number(el.querySelector('#cb').value),target=Number(el.querySelector('#ct').value),r=fedRun({C:.1,E,B:10,rounds:60,quantBits:b}),k=M.roundsTo(r.curve,target);
  const per=M.commBytes({rounds:1,devices:1,bits:b}),raw=M.rawBytes(users());
  if(!k)return U.result(el,'',`<b>목표에 닿지 못함</b> E ${E}, ${b}비트로는 60라운드 안에 ${U.fmt(target,2)}에 닿지 못했습니다(60라운드 뒤 ${U.fmt(r.final.acc,3)}). 목표를 낮추거나 E를 바꿔 보세요.`);
  const total=r.logs.slice(0,k).reduce((s,l)=>s+l.bytes,0),up=k*100*per.up;
  U.result(el,U.bars(['목표까지 오간 바이트','그중 올린 업데이트','원문 전체(참고)'],[total,up,raw],{format:U.bytes,mark:i=>i===0}),
   `목표 ${U.fmt(target,2)}까지 <b>${k}라운드</b>, 기기 100대 × ${k}라운드 = 참여 ${U.int(k*100)}번. 한 번 참여에 모델 받기 ${U.int(per.down)}바이트 + 업데이트 올리기 ${U.int(per.up)}바이트(${b<32?`숫자 225개 × ${b}비트 + 눈금 폭 4바이트`:'숫자 225개 × 4바이트'}).<br>모두 <b>${U.bytes(total)}</b>입니다. 통신량 = 라운드 수 × 기기 수 × (받기 + 올리기)이므로, 업데이트를 줄여도 라운드가 늘면 이득이 줄어듭니다.`);
 },{heavy:true});
};

L.noniid=el=>{
 U.setup(el,U.select('nh','말투가 사용자마다 다른 정도 h',[['0','0 (모두 같은 섞임)'],['0.5','0.5'],['1','1 (자기 말투만)']],'1')+U.select('ne','기기 안에서 훑는 횟수 E (B 10)',[[1,'1'],[5,'5'],[20,'20']],5)+U.select('nm','근접 항 μ (FedProx)',[['0','0 (FedAvg)'],['0.1','0.1'],['1','1']],'0'));
 U.bind(el,()=>{
  const h=Number(el.querySelector('#nh').value),E=Number(el.querySelector('#ne').value),mu=Number(el.querySelector('#nm').value),r=fedRun({C:.1,E,B:10,rounds:40,mu},h),low=r.final.byStyle.indexOf(Math.min(...r.final.byStyle));
  U.result(el,U.bars(STY.map(s=>s+' 적중'),r.final.byStyle,{digits:3,max:1,mark:i=>i===low}),
   `h ${h}, E ${E}, μ ${mu}: 전체 첫 추천 적중률 <b>${U.fmt(r.final.acc,3)}</b>, 정답 확률 ${U.fmt(r.final.prob,3)}(존댓말 ${U.fmt(r.final.probByStyle[0],3)} · 반말 ${U.fmt(r.final.probByStyle[1],3)} · 줄임말 ${U.fmt(r.final.probByStyle[2],3)}).<br>가장 낮은 말투: ${STY[low]} ${U.fmt(r.final.byStyle[low],3)} ✓. 사용자 1,000명 가운데 존댓말 ${U.int(M.users(h).filter(u=>u.style===0).length)}명, 반말 ${U.int(M.users(h).filter(u=>u.style===1).length)}명, 줄임말 ${U.int(M.users(h).filter(u=>u.style===2).length)}명입니다.`);
 },{heavy:true});
};

/* 2차원 경로 그림: 기기 셋의 최적점(c_i), 전체 최적점(★), 서버 모델의 라운드별 위치를 잇는다. 좌표 범위 −3~4. */
function pathPlot(run){
 const S=40,X=x=>40+(x+3)*S,Y=y=>270-(y+3)*S,T=M.DRIFT;
 let g='';for(let v=-3;v<=4;v++)g+=`<path d="M${X(v)} ${Y(-3)}V${Y(4)}M${X(-3)} ${Y(v)}H${X(4)}" stroke="var(--line)"/>`;
 g+=T.c.map((c,i)=>`<circle cx="${X(c[0])}" cy="${Y(c[1])}" r="7" fill="var(--blue)"/><text x="${X(c[0])+10}" y="${Y(c[1])-8}" font-size="12">기기 ${i+1}의 최적점</text>`).join('');
 g+=`<text x="${X(run.opt[0])+10}" y="${Y(run.opt[1])+18}" font-size="12" fill="var(--accent)">★ 전체 최적점</text><text x="${X(run.opt[0])}" y="${Y(run.opt[1])+5}" text-anchor="middle" font-size="16" fill="var(--accent)">★</text>`;
 const last=run.ends.at(-1).map(y=>`<circle cx="${X(y[0])}" cy="${Y(y[1])}" r="4" fill="none" stroke="var(--orange)" stroke-width="2"/>`).join('');
 const path=`<path d="${run.path.map((p,i)=>`${i?'L':'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('')}" fill="none" stroke="var(--orange)" stroke-width="2.5"/><circle cx="${X(run.x[0])}" cy="${Y(run.x[1])}" r="6" fill="var(--orange)"/>`;
 return `<svg viewBox="0 0 360 310" role="img" aria-label="서버 모델이 (3, 3)에서 출발해 40라운드 뒤 (${U.fmt(run.x[0],2)}, ${U.fmt(run.x[1],2)})에 있습니다. 전체 최적점은 (${U.fmt(run.opt[0],2)}, ${U.fmt(run.opt[1],2)})입니다.">${g}${path}${last}</svg>`;
}
L.drift=el=>{
 U.setup(el,U.select('dm','방법',[['fedavg','FedAvg'],['fedprox','FedProx'],['scaffold','SCAFFOLD']],'fedavg')+U.range('dk','라운드마다 기기 안 걸음 K',1,40,1,5)+U.range('du','FedProx의 μ',0,2,.1,.5));
 U.bind(el,()=>{
  const method=el.querySelector('#dm').value,steps=U.value(el,'dk'),mu=U.value(el,'du');el.querySelector('#du').disabled=method!=='fedprox';const run=M.driftRun({steps,eta:.1,rounds:40,method,mu});
  U.result(el,pathPlot(run),`${{fedavg:'FedAvg',fedprox:`FedProx(μ ${mu})`,scaffold:'SCAFFOLD'}[method]}, K ${steps}: 40라운드 뒤 서버 모델 (${U.fmt(run.x[0],3)}, ${U.fmt(run.x[1],3)}), 전체 최적점까지 거리 <b>${U.fmt(run.dist,3)}</b>, 전체 손실 차이 ${U.fmt(run.gap,4)}.<br>주황 동그라미 셋은 마지막 라운드에서 기기 셋이 K걸음 뒤 도착한 곳입니다. 서버 모델은 그 셋의 평균입니다.${method==='fedprox'?'':' μ 막대는 FedProx에서만 씁니다.'}`);
 });
};

Object.assign(FLGuideData,{
 where:['원문이 어디에 있는지와 서버로 무엇이 가는지로 세 학습 방식을 구분합니다.',[['중앙 학습 20번',{wmode:'central',wn:20,wk:4}],['데이터 병렬 16대',{wmode:'dc',wn:20,wk:16}],['연합학습 40라운드',{wmode:'fl',wn:40,wk:4}]],'중앙 학습과 데이터 병렬은 학습 쌍 32,716개(원문 577.2 KB)를 모두 모으고, 두 번째 훑기부터 첫 추천 적중률이 0.654에서 멈춥니다. 데이터 병렬에서 작업기를 2대에서 16대로 늘려도 평균 기울기는 한 대의 기울기와 10⁻¹⁶ 수준의 반올림 차이만 납니다. 연합학습은 원문을 기기에 두고 20라운드 뒤 0.630, 40라운드 뒤 0.649이며, 40라운드 동안 7.20 MB가 오갑니다. 이 작은 모델에서는 오간 바이트가 원문보다 많습니다. 연합학습을 쓰는 이유는 바이트를 아끼는 데 있지 않고 원문을 기기 밖으로 내보내지 않는 데 있습니다.'],
 fedavg:['기기 안에서 몇 번, 몇 개씩 학습하고 몇 대가 참여하느냐에 따라 같은 40라운드의 적중률이 어떻게 달라지는지 봅니다.',[['FedSGD',{fe:1,fb:'inf',fc:'0.1'}],['E 1 · B 10',{fe:1,fb:'10',fc:'0.1'}],['E 5 · B 10',{fe:5,fb:'10',fc:'0.1'}],['E 20 · B 10',{fe:20,fb:'10',fc:'0.1'}]],'FedSGD(E 1, B ∞)는 기기마다 기울기를 한 번만 계산해 40라운드 뒤 0.397로, 0.60에 닿지 못합니다. 같은 E 1이라도 B 10으로 나눠 여러 걸음 가면 17라운드에 0.60에 닿고 40라운드 뒤 0.630입니다. E 5는 4라운드, E 10과 E 20은 3라운드에 닿습니다. E 20은 40라운드 뒤 0.641로 E 5(0.649)보다 낮고, 줄임말 사용자는 0.319에서 0.227로 내려갑니다. C를 0.02로 줄여도 E 1·B 10은 21라운드에 0.60에 닿습니다.'],
 comm:['목표 적중률까지 오간 바이트를 기기 안 학습 횟수와 업데이트 비트 수로 비교합니다.',[['E 1 · 32비트',{ce:1,cb:32,ct:'0.6'}],['E 1 · 2비트',{ce:1,cb:2,ct:'0.6'}],['E 5 · 8비트',{ce:5,cb:8,ct:'0.6'}],['E 5 · 2비트',{ce:5,cb:2,ct:'0.6'}]],'E 1, 32비트로는 0.60까지 17라운드, 3.06 MB가 오갑니다. 같은 E 1을 2비트로 줄여도 라운드는 17번 그대로라 1.63 MB로 줄어듭니다. 줄어든 몫은 올리기뿐이고 내려받는 모델 900바이트는 그대로이기 때문에 절반 조금 넘게 남습니다. E 5에서는 32비트 4라운드(720.0 KB), 8비트 4라운드(451.6 KB), 4비트 5라운드(508.3 KB), 2비트 8라운드(768.2 KB)라 8비트가 가장 적습니다. 비트를 너무 줄이면 양자화 잡음 때문에 라운드가 늘어 바이트가 다시 커집니다.'],
 noniid:['말투가 사용자마다 다를수록 기기 안에서 오래 학습하는 것이 왜 드문 말투에 불리한지 봅니다.',[['h 0 · E 20',{nh:'0',ne:20,nm:'0'}],['h 1 · E 5',{nh:'1',ne:5,nm:'0'}],['h 1 · E 20',{nh:'1',ne:20,nm:'0'}],['h 1 · E 20 · μ 0.1',{nh:'1',ne:20,nm:'0.1'}]],'h 0이면 모든 사용자가 같은 섞임으로 말하므로 E 20이어도 세 말투가 0.658·0.655·0.654로 고르고, 정답 확률은 E 5의 0.463에서 0.502로 오히려 오릅니다. h 1에서는 E 5의 줄임말 적중 0.319가 E 20에서 0.227로 내려갑니다. 기기마다 자기 말투 쪽으로 오래 학습한 모델을 평균하면 존댓말 기기가 많은 쪽으로 끌리기 때문입니다. μ 0.1을 더하면 줄임말이 0.265로 일부 돌아오지만, μ 1은 기기 모델을 받은 모델 근처에 너무 묶어 정답 확률이 0.298로 떨어지고 줄임말 적중도 0.056이 됩니다. 이 모델에서는 μ가 표류를 줄이는 대신 학습도 느리게 만듭니다.'],
 drift:['기기마다 최적점이 다를 때 기기 안 걸음이 늘면 평균이 전체 최적점에서 벗어나는 모습(기기 표류)을 경로로 봅니다.',[['FedAvg K 1',{dm:'fedavg',dk:1,du:.5}],['FedAvg K 20',{dm:'fedavg',dk:20,du:.5}],['FedProx K 20 μ 1',{dm:'fedprox',dk:20,du:1}],['SCAFFOLD K 20',{dm:'scaffold',dk:20,du:.5}]],'기기 셋의 최적점 평균은 (−1.125, 0.063)입니다. FedAvg에서 K 1이면 40라운드 뒤 거리가 0.056, K 5면 0.181, K 20이면 0.589로 멀어집니다. 기기마다 자기 최적점으로 많이 걸어간 뒤의 평균은 전체 손실의 최적점과 다르기 때문입니다. K 20에서 FedProx는 μ 0.5에서 0.481, μ 1에서 0.394, μ 2에서 0.278로 줄지만 0이 되지는 않습니다. SCAFFOLD는 기기마다 자기 기울기와 전체 기울기의 차이를 빼며 걸어 K 20에서도 거리가 0.000(소수 셋째 자리까지)입니다. 이 손실은 이 책이 정한 축소 모형이라 정확한 기울기를 씁니다. 실제 기기는 표본 기울기를 쓰므로 SCAFFOLD도 잡음만큼 흔들립니다.']
});
})();
