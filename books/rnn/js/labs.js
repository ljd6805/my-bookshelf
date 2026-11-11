/* 열세 실험. 순전파·시간 방향 역전파·학습은 RNMath가 브라우저에서 실제로 계산한다. 기온 기록과 후기 문장은 이 책이 지은 합성 자료이고,
   4장의 과제 분류와 마지막 과제의 학습 기록은 이 책이 정한 시나리오다. 실험마다 어느 쪽인지는 app.js의 KIND가 밝힌다. */
(()=>{
'use strict';
const M=RNMath,U=RNUI,L=RNLabs,esc=U.esc,f=U.fmt;
const SUP={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
/* 아주 작거나 큰 수를 a×10ⁿ으로 쓴다. */
const sci=x=>{if(x===0)return '0';const e=Math.floor(Math.log10(Math.abs(x)));if(e>=-2&&e<3)return f(x,e<0?3:2);return `${f(x/10**e,1)}×10${String(e).split('').map(c=>SUP[c]).join('')}`;};
const lg=x=>Math.max(-16,Math.log10(Math.max(x,1e-300)));
const val=(el,id)=>el.querySelector('#'+id).value,num=(el,id)=>Number(val(el,id)),on=(el,id)=>el.querySelector('#'+id).checked;
const C={h:'var(--accent)',in:'var(--blue)',warn:'var(--orange)',mute:'var(--muted)'};

L.why=el=>{
 U.setup(el,U.range('k','한 번에 보는 지난 시간 수 k',2,12,1,3)+U.range('noise','측정 잡음의 크기 (°C)',0,1.5,0.1,0.6)+U.check('mix','맞춘 뒤의 96시간에서 창 안의 값 순서를 섞어 넣기',false));
 U.bind(el,()=>{
  const k=num(el,'k'),noise=num(el,'noise'),mix=on(el,'mix'),r=M.whyOrder({k,noise}),rows=r.rows.slice(0,48),key=mix?'mixed':'ordered';
  const chart=U.lines([{name:'실제 기온',pts:rows.map((x,i)=>[i+1,x.actual]),color:C.mute},{name:mix?'순서를 섞어 넣은 예측':'순서대로 넣은 예측',pts:rows.map((x,i)=>[i+1,x[key]]),color:mix?C.warn:C.h},{name:'지난 k시간의 평균',pts:rows.map((x,i)=>[i+1,x.mean]),color:C.in,dash:true}],{xLabel:'기록을 맞춘 뒤 96시간의 시각 (시간)',yLabel:'기온 (°C)',yMin:8,yMax:30});
  U.result(el,chart,`지난 ${k}시간의 값으로 다음 한 시간을 맞힌 오차(96시간 평균, RMSE)입니다. 순서대로 넣으면 <b>${f(r.rmse.ordered)}°C</b>, 같은 값을 섞어 넣으면 <b>${f(r.rmse.mixed)}°C</b>, 순서를 쓰지 않는 평균은 ${f(r.rmse.mean)}°C입니다. 직전 값을 그대로 내는 기준선은 ${f(r.rmse.last)}°C입니다.<br>${r.rmse.ordered<0.005?'순서대로 넣은 오차가 0에 가까워 배수는 계산하지 않습니다.':r.rmse.mixed>r.rmse.ordered*1.5?`순서를 섞으면 오차가 ${f(r.rmse.mixed/r.rmse.ordered,1)}배가 됩니다. 값은 그대로인데 놓인 자리가 달라졌기 때문입니다.`:'이 설정에서는 순서를 섞어도 오차가 크게 달라지지 않습니다.'}${noise===0?' 잡음이 없으면 순서대로 넣은 예측은 거의 틀리지 않습니다.':''}`);
 });
};
L.cell=el=>{
 U.setup(el,U.range('wh','순환 가중치 W_hh (앞 은닉 상태에 곱하는 값)',0,1.5,0.1,0.5)+U.select('xin','입력 x',[['pulse','첫 단계에만 1, 그 뒤는 0'],['temp','유나의 기온 12시간 (정규화한 값)']],'pulse')+U.select('act','활성 함수',[['tanh','tanh (출력을 −1~1로 제한)'],['none','없음 (가중합을 그대로)']],'tanh'));
 U.bind(el,()=>{
  const wh=num(el,'wh'),key=val(el,'xin'),act=val(el,'act'),xs=M.CELL_INPUTS[key],hs=M.scalarRun({wh,wx:1,xs,act}),top=Math.max(1.2,...hs.map(Math.abs));
  const below=hs.findIndex(h=>Math.abs(h)<Math.abs(hs[0])*0.1);
  const chart=U.lines([{name:'은닉 상태 h',pts:hs.map((h,i)=>[i+1,h]),color:C.h,dots:3},{name:'입력 x',pts:xs.map((x,i)=>[i+1,x]),color:C.in,dash:true}],{xLabel:'시점 t',yLabel:'값',yMin:-top,yMax:top});
  U.result(el,chart,`h_t = ${act==='tanh'?'tanh(':'('}${f(wh,1)}·h_(t−1) + 1·x_t)를 12번 계산했습니다. h: ${hs.map(h=>f(h,2)).join(', ')}.<br>`+
   (key==='pulse'?(below>0?`첫 입력의 흔적은 ${below+1}번째 시점에 처음 값 ${f(hs[0],2)}의 10%(${f(Math.abs(hs[0])*0.1,3)}) 아래로 줄어듭니다.`:(Math.abs(hs[11])>Math.abs(hs[0])?`12번째 시점의 h는 처음 값의 ${f(Math.abs(hs[11]/hs[0]),1)}배로 커졌습니다.`:`12번째 시점에도 첫 입력의 흔적이 처음 값의 ${f(Math.abs(hs[11]/hs[0])*100,0)}% 남아 있습니다.`))+(act==='none'&&wh>1?' 활성 함수가 없고 W_hh가 1보다 크면 h가 단계마다 커집니다.':act==='tanh'&&wh>1?' tanh가 값을 1 아래로 묶어 두어 h는 끝없이 커지지 않고 한 값 근처에 머뭅니다.':''):(wh===0?'W_hh가 0이라 h는 지금 입력만 따라가고 앞 시점의 입력을 담지 않습니다. W_hh를 올리면 앞 시점들의 입력이 함께 담깁니다.':'h는 지금 입력과 앞 시점들의 입력을 함께 담습니다. W_hh를 0으로 두면 h는 지금 입력만 따라갑니다.')));
 });
};
L.unroll=el=>{
 U.setup(el,U.range('T','시퀀스 길이 T (시간)',1,200,1,12)+U.range('H','은닉 크기 H',2,64,1,10));
 U.bind(el,()=>{
  const T=num(el,'T'),H=num(el,'H'),p=M.paramCount({T,H});
  U.result(el,U.bars(['RNN (같은 셀을 T번)','완전 연결 (창 T개를 한 번에)'],[p.rnn,p.dense],{digits:0,mark:i=>i===0,unit:'개'}),
   `입력 1개, 은닉 ${H}개, 출력 1개일 때 파라미터 수입니다.<br>RNN: W_xh ${H}×1 + W_hh ${H}×${H} + 편향 ${H} + 출력층 ${p.readout} = <b>${U.int(p.rnn)}개</b>. 길이 T가 얼마든 같습니다.<br>완전 연결: 첫 층 ${T}×${H} + 편향 ${H} + 출력층 ${p.readout} = <b>${U.int(p.dense)}개</b>. T에 비례하고, T와 다른 길이의 입력은 받을 수 없습니다.<br>PyTorch의 nn.RNN은 편향을 두 벌(b_ih, b_hh) 두어 셀이 ${U.int(p.torchRnn)}개입니다.`);
 });
};
function shapeGrid(s){
 const w=Math.min(52,440/s.steps),cells=s.cells.map((c,i)=>{const x=20+i*w;return `<rect x="${x}" y="70" width="${w-6}" height="34" rx="5" fill="var(--panel2)" stroke="${C.h}" stroke-width="2"/><text x="${x+(w-6)/2}" y="92" text-anchor="middle">h</text>${c.input?`<path d="M${x+(w-6)/2} 132V108" stroke="${C.in}" stroke-width="2"/><text x="${x+(w-6)/2}" y="148" text-anchor="middle" fill="${C.in}">x</text>`:''}${c.output?`<path d="M${x+(w-6)/2} 66V42" stroke="${C.warn}" stroke-width="2"/><text x="${x+(w-6)/2}" y="34" text-anchor="middle" fill="${C.warn}">y</text>`:''}${i?`<path d="M${x-6} 87H${x}" stroke="${C.h}" stroke-width="2"/>`:''}`;}).join('');
 return `<svg viewBox="0 0 480 160" role="img" aria-label="${esc(`${s.steps}단계 가운데 입력을 받는 단계 ${s.ins}개, 출력을 내는 단계 ${s.outs}개`)}">${cells}</svg>`;
}
L.shapes=el=>{
 U.setup(el,U.select('task','과제',M.TASKS.map(t=>[t.id,t.name]),'each')+U.select('form','내가 고른 입출력 형태',[['none','형태를 고르세요'],...Object.entries(M.FORMS)],'none')+U.range('len','입력 길이 T',3,8,1,6));
 U.bind(el,()=>{
  const choice=val(el,'form'),s=M.shape(val(el,'task'),choice,num(el,'len'),4);
  U.result(el,choice==='none'?'<p class="caption">형태를 고르면 단계마다 입력 x와 출력 y가 어디에 붙는지 그립니다.</p>':shapeGrid(M.shape(val(el,'task'),choice,num(el,'len'),4)),
   choice==='none'?`과제: ${esc(s.task.name)} (입력 길이 T = ${num(el,'len')}). 입력이 몇 개이고 출력이 몇 개인지 먼저 세어 보고 형태를 고르세요.`:s.ok?`<b>맞습니다.</b> ${esc(M.FORMS[s.task.form])}. ${esc(s.task.why)} 입력 ${s.ins}개, 출력 ${s.outs}개, 손실을 재는 곳 ${s.lossTerms}곳입니다.`:`<b>다시 골라 보세요.</b> 이 과제는 입력이 ${s.ins}개이고 출력이 ${s.outs}개여야 합니다. 그림은 맞는 형태를 그린 것입니다. 고른 형태는 ${esc(M.FORMS[choice])}입니다.`);
 });
};
L.bptt=el=>{
 U.setup(el,U.range('wh','순환 가중치 W_hh',0.1,1.5,0.1,0.5)+U.range('T','시퀀스 길이 T (시점 수)',2,6,1,2)+U.range('target','마지막 시점의 정답',-0.9,0.9,0.1,0.5));
 U.bind(el,()=>{
  const r=M.scalarBptt({wh:num(el,'wh'),T:num(el,'T'),target:num(el,'target')});
  U.result(el,U.table(['시점 t','입력 x','은닉 h','∂L/∂h','1−h²','W_hh 몫'],r.rows.map(x=>[x.t,f(x.x,1),f(x.h,4),f(x.delta,4),f(x.local,4),f(x.partWh,5)])),
   `손실 L = ½(h_T − 정답)² = ${f(r.loss,5)}. 마지막 시점에서 출발한 ∂L/∂h를 한 시점씩 앞으로 넘기며 시점마다 W_hh의 몫을 구했습니다.<br>시점별 몫의 합 ∂L/∂W_hh = <b>${f(r.gwh,5)}</b>. W_hh를 0.00001만큼 흔들어 손실 차이로 구한 값은 ${f(r.numWh,5)}로, 차이는 ${sci(Math.abs(r.gwh-r.numWh))}입니다.<br>같은 W_hh가 모든 시점에 쓰이므로 기울기는 시점마다의 몫을 더한 값입니다. 첫 시점은 앞 은닉 상태가 0이라 몫이 0입니다.${r.rows.length>1&&Math.abs(r.rows[0].delta)>0?` 첫 시점의 ∂L/∂h는 마지막 시점의 약 ${f(Math.abs(r.rows[r.rows.length-1].delta/r.rows[0].delta),r.rows[r.rows.length-1].delta/r.rows[0].delta<10?1:0)}분의 1입니다.`:''}`);
 });
};
L.vanish=el=>{
 U.setup(el,U.range('rho','순환 가중치의 크기 ρ',0.3,1.5,0.05,0.7)+U.range('T','시퀀스 길이 T',5,60,5,20)+U.select('act','활성 함수',[['tanh','tanh'],['none','없음 (선형)']],'tanh')+U.range('clip','기울기 크기 한도 (0이면 자르지 않음)',0,5,0.5,0));
 U.bind(el,()=>{
  const rho=num(el,'rho'),T=num(el,'T'),act=val(el,'act'),clip=num(el,'clip'),r=M.gradNorms({rho,T,act,clip}),lo=Math.min(-2,Math.floor(lg(r.last))),hi=Math.max(1,Math.ceil(Math.max(...r.norms.map(lg))));
  const chart=U.lines([{name:'∂L/∂h의 크기 (10의 거듭제곱 지수)',pts:r.norms.map((n,k)=>[k,lg(n)]),color:C.h,dots:T<=30?2.5:0}],{xLabel:'마지막 시점에서 거슬러 오른 단계 수',yLabel:'log₁₀ 기울기 크기',yMin:lo,yMax:hi,hline:0,hlineLabel:'크기 1'});
  U.result(el,chart,`마지막 시점에서 크기 1로 출발한 기울기의 크기는 ${T-1}단계 앞에서 <b>${sci(r.last)}</b>입니다(은닉 8개, ρ = ${f(rho,2)}, ${act==='tanh'?'tanh':'활성 함수 없음'}).${act==='none'?` 선형일 때는 단계마다 정확히 ρ배이므로 ${f(rho,2)}^${T-1} = ${sci(rho**(T-1))}입니다.`:' tanh의 미분 1−h²이 1 이하라서 ρ만 곱할 때보다 더 빨리 줄어듭니다.'}<br>모든 가중치의 기울기를 합친 크기는 ${sci(r.gradNorm)}입니다.${r.last<1e-3?' 이 크기는 주로 마지막 쪽 시점들의 몫이고 먼 시점의 몫은 거의 0입니다.':''}${clip>0?(r.scale<1?` 한도 ${f(clip,1)}을 넘어 ${sci(r.scale)}배로 줄여 크기를 한도 ${f(r.clipped,2)}에 맞춥니다. 방향은 그대로이고 크기만 줄어듭니다. 그래프의 선은 자르기 전의 ∂L/∂h라서 한도를 바꿔도 그대로입니다.`:` 한도 ${f(clip,1)} 안이라 자르지 않습니다.`):''}${r.last<1e-6?' 이만큼 작아지면 먼 시점의 입력은 가중치를 거의 움직이지 못합니다.':r.last>1e3&&!(clip>0&&r.scale<1)?' 이만큼 커지면 한 번의 갱신이 가중치를 크게 흔듭니다.':''}`);
 });
};
const memo={};
const truncRun=(window,carry)=>memo[window+':'+carry]||(memo[window+':'+carry]=M.trainSeries({window,carry,epochs:30}));
L.truncate=el=>{
 U.setup(el,U.select('window','한 번에 거슬러 오르는 길이 (시간)',[4,8,12,24,48,120,240].map(w=>[w,w===240?'240 (자르지 않음)':String(w)]),'12')+U.check('carry','창이 바뀔 때 은닉 상태 값을 이어받기',true));
 U.bind(el,()=>{
  const window=num(el,'window'),carry=on(el,'carry'),r=truncRun(window,carry);
  U.result(el,U.bars(['검증 오차','학습 오차','기준선 (직전 값)'],[r.final.val,r.final.train,r.persist],{unit:'°C',mark:i=>i===0,max:1.5}),
   `240시간 기록을 ${window}시간씩 잘라 30번 반복 학습했습니다(단순 RNN, 은닉 8개). 다음 96시간의 검증 오차는 <b>${f(r.final.val)}°C</b>이고, 직전 값을 그대로 내는 기준선은 ${f(r.persist)}°C입니다.<br>한 번 반복에 가중치를 ${r.updates}번 고치고, 역전파를 위해 은닉 상태를 ${r.stored}개 기억하며, 기울기는 ${r.reach}시간 앞까지만 닿습니다.${carry?'':' 창마다 은닉 상태를 0으로 되돌려, 창의 첫 시점들은 앞 기록을 모르는 채 예측합니다.'}${window>=120?' 창이 길면 한 번 반복에 가중치를 고치는 횟수가 적어 같은 30번으로는 덜 배웁니다.':''}`);
 });
};
L.lstm=el=>{
 U.setup(el,U.range('f','망각 게이트 f (앞 셀 상태를 남기는 비율)',0,1,0.05,0.5)+U.range('i','입력 게이트 i (새 후보를 들이는 비율)',0,1,0.05,0.5)+U.range('g','새 후보 값 g̃',-1,1,0.1,0.8)+U.range('o','출력 게이트 o',0,1,0.05,1)+U.range('c0','앞 시점의 셀 상태 C',-2,2,0.1,1));
 U.bind(el,()=>{
  const fg=num(el,'f'),ig=num(el,'i'),g=num(el,'g'),o=num(el,'o'),c0=num(el,'c0'),cs=[],keep=[];let c=c0;
  for(let t=1;t<=12;t++){c=fg*c+ig*g;cs.push(c);keep.push(c0*fg**t);}
  const c1=cs[0],h1=o*Math.tanh(c1),top=Math.max(1.2,Math.abs(c0),...cs.map(Math.abs));
  const chart=U.lines([{name:'셀 상태 C',pts:[[0,c0],...cs.map((v,t)=>[t+1,v])],color:C.h,dots:3},{name:'처음 C에서 남은 몫',pts:[[0,c0],...keep.map((v,t)=>[t+1,v])],color:C.in,dash:true}],{xLabel:'같은 게이트 값으로 지난 시점 수',yLabel:'값',yMin:-top,yMax:top});
  U.result(el,chart,`한 시점의 계산: C_t = f·C_(t−1) + i·g̃ = ${f(fg)}×${f(c0,1)} + ${f(ig)}×${f(g,1)} = <b>${f(c1,3)}</b>, h_t = o·tanh(C_t) = ${f(o)}×${f(Math.tanh(c1),3)} = <b>${f(h1,3)}</b>.<br>같은 게이트 값으로 12시점이 지나면 처음 셀 상태 ${f(c0,1)}에서 남은 몫은 f¹² = ${sci(fg**12)}배인 ${sci(keep[11])}이고, 셀 상태는 ${f(cs[11],3)}입니다.${fg>=0.95?' f가 1에 가까우면 처음 값이 거의 그대로 남습니다.':fg<=0.5?' f가 0.5 이하이면 몇 시점 만에 처음 값이 사라집니다.':''}${fg<1?` 새 후보가 같은 값으로 계속 들어오면 셀 상태는 i·g̃/(1−f) = ${f(ig*g/(1-fg),2)}에 가까워집니다.`:''}`);
 });
};
const ratio=x=>x>=1e8?`약 ${sci(x)}배`:x>=1e4?`약 ${U.int(Number(x.toPrecision(1)))}배`:x>=10?`약 ${U.int(Number(x.toPrecision(2)))}배`:`${f(x,1)}배`;
L.gru=el=>{
 U.setup(el,U.range('bias','망각·갱신 게이트의 편향',0,4,0.5,0)+U.range('T','시퀀스 길이 T',10,60,10,10));
 U.bind(el,()=>{
  const gateBias=num(el,'bias'),T=num(el,'T'),R=Object.fromEntries(['rnn','lstm','gru'].map(type=>[type,M.gradFlow({type,T,gateBias})])),lo=Math.min(-2,Math.floor(Math.min(...Object.values(R).map(r=>lg(r.last)))));
  const chart=U.lines([{name:'단순 RNN',pts:R.rnn.norms.map((n,k)=>[k,lg(n)]),color:C.mute,dash:true},{name:'LSTM',pts:R.lstm.norms.map((n,k)=>[k,lg(n)]),color:C.h},{name:'GRU',pts:R.gru.norms.map((n,k)=>[k,lg(n)]),color:C.warn}],{xLabel:'마지막 시점에서 거슬러 오른 단계 수',yLabel:'log₁₀ 기울기 크기',yMin:lo,yMax:1,hline:0,hlineLabel:'크기 1'});
  U.result(el,chart+U.table(['셀',`${T-1}단계 앞의 기울기 크기`,'게이트 평균'],[['단순 RNN',sci(R.rnn.last),'—'],['LSTM',sci(R.lstm.last),`망각 f ${f(R.lstm.gate)}`],['GRU',sci(R.gru.last),`갱신 z ${f(R.gru.gate)}`]]),
   `학습하기 전의 무작위 가중치(은닉 8개)에서 마지막 시점의 기울기가 ${T-1}단계 앞에 닿을 때의 크기입니다. 단순 RNN은 <b>${sci(R.rnn.last)}</b>, LSTM은 <b>${sci(R.lstm.last)}</b>, GRU는 <b>${sci(R.gru.last)}</b>입니다. LSTM은 단순 RNN의 ${ratio(R.lstm.last/R.rnn.last)}입니다.<br>게이트 편향이 ${f(gateBias,1)}이면 망각·갱신 게이트는 평균 ${f(R.lstm.gate)}쯤 열립니다. ${R.lstm.gate<0.6?'게이트가 절반만 열리면 LSTM과 GRU의 기울기도 단순 RNN처럼 빨리 사라집니다.':'게이트가 1에 가까울수록 상태가 그대로 넘어가는 길이 생겨 기울기가 멀리 닿습니다.'}${R.lstm.last>1?' LSTM의 값이 1보다 큰 것은 셀 상태 길 말고 게이트를 거쳐 가는 길의 몫이 더해졌기 때문입니다.':''} 단순 RNN에는 이 게이트가 없어 편향을 바꿔도 그대로입니다.`);
 });
};
const SAMPLE=['맛 이 좋 다','맛 이 좋 지 않 다','맛 이 나쁘 지 않 다','토마토 가 무르 지 않 다','배송 이 느리 다','값 이 비싸 지 않 다','배송 이 빠르 고 포장 이 꼼꼼 하 다','수박 이 달 다'];
L.embed=el=>{
 U.setup(el,U.select('sent','후기 문장 (토큰은 띄어 쓴 대로)',SAMPLE.map(s=>[s,s+(M.HELD_OUT.some(x=>x.text===s)?' · 학습에 없던 문장':s.startsWith('수박')?' · 사전에 없는 낱말':'')]),'맛 이 좋 지 않 다')+U.range('padTo','길이를 맞출 토큰 수 (문장보다 짧으면 그대로)',0,12,1,8)+U.select('side','패딩을 붙이는 쪽',[['post','문장 뒤'],['pre','문장 앞']],'post')+U.select('read','분류에 쓰는 은닉 상태',[['real','마지막 실제 토큰'],['end','맨 끝 단계']],'real'));
 U.bind(el,()=>{
  const tokens=val(el,'sent').split(' '),opts={padTo:num(el,'padTo'),side:val(el,'side'),useLastReal:val(el,'read')==='real'},r=M.classify(tokens,opts),all=[...M.REVIEWS,...M.HELD_OUT],acc=M.sentimentAccuracy(all,opts),held=M.sentimentAccuracy(M.HELD_OUT,opts);
  U.result(el,U.table(['단계','토큰','번호','임베딩 벡터 (4차원)','여기까지 읽은 긍정 확률'],r.steps.map((s,i)=>[i+1,s.token,s.id,r.vectors[i].map(v=>f(v,2)).join(', '),f(s.p,2)]),i=>i===r.at),
   `인코딩: ${esc(tokens.join(' / '))} → 번호 [${r.raw.join(', ')}]${r.unknown?` (사전에 없는 낱말 ${r.unknown}개는 번호 1 &lt;unk&gt;)`:''}. 임베딩: 번호마다 4차원 벡터 하나를 표에서 꺼냅니다. 원-핫으로 쓰면 낱말마다 ${M.VOCAB.length}차원입니다.<br>✓ 표시한 ${r.at+1}번째 단계의 은닉 상태로 분류한 긍정 확률은 <b>${f(r.p,2)}</b>, 판정은 <b>${r.p>=0.5?'긍정':'부정'}</b>입니다.<br>이 설정으로 문장 40개(학습 32, 학습에 없던 8)를 분류하면 ${acc.rows.filter(x=>x.ok).length}개가 맞고, 학습에 없던 8개 가운데는 ${held.rows.filter(x=>x.ok).length}개가 맞습니다.${r.ids.length>r.raw.length&&!opts.useLastReal&&opts.side==='post'?' 패딩은 학습 때 읽은 적이 없어서, 패딩을 읽는 동안 확률이 어떻게 바뀔지 정해져 있지 않습니다.':''}`);
 });
};
L.validate=el=>{
 U.setup(el,U.select('H','은닉 크기 H',[[4,'4'],[16,'16'],[32,'32']],'4')+U.select('drop','드롭아웃 (출력층 앞)',[[0,'없음'],[0.3,'0.3']],'0')+U.range('ep','학습을 멈출 반복 수',10,200,2,20));
 U.bind(el,()=>{
  const H=num(el,'H'),dropout=num(el,'drop'),ep=num(el,'ep'),r=M.validateRun({H,dropout}),curve=r.curve.slice(0,ep),best=M.bestUpTo(r.curve,ep),now=curve[ep-1];
  const chart=U.lines([{name:'학습 오차',pts:curve.map(c=>[c.epoch,c.train]),color:C.in},{name:'검증 오차',pts:curve.map(c=>[c.epoch,c.val]),color:C.h},{name:'검증 오차가 가장 낮은 반복',pts:[[best.epoch,best.val]],color:C.warn,dots:6,only:true}],{xLabel:'반복 수 (에포크)',yLabel:'오차 RMSE (°C)',yMin:0,yMax:2.5,xMax:Math.max(ep,20),hline:r.persist,hlineLabel:'기준선 (직전 값)'});
  U.result(el,chart,`사흘(72시간)로 학습하고 그다음 사흘로 검증했습니다(단순 RNN, 은닉 ${H}개${dropout?`, 드롭아웃 ${dropout}`:''}). ${ep}번째 반복에서 학습 오차는 ${f(now.train)}°C, 검증 오차는 <b>${f(now.val)}°C</b>입니다.<br>여기까지 검증 오차가 가장 낮았던 것은 <b>${best.epoch}번째 반복의 ${f(best.val)}°C</b>입니다. ${now.val>best.val*1.15?`그 뒤로 학습 오차는 ${now.train<curve[best.epoch-1].train?'더 줄었지만':'비슷하지만'} 검증 오차는 ${f(now.val-best.val)}°C 늘었습니다. 가장 낮았던 반복의 모델을 저장해 두었다가 씁니다.`:'지금 모델과 가장 좋았던 모델의 차이는 크지 않습니다.'} 기준선은 ${f(r.persist)}°C입니다.`);
 });
};
L.limits=el=>{
 U.setup(el,U.range('T','시퀀스 길이 T (토큰)',5,200,5,20)+U.select('H','은닉 크기 d',[[16,'16'],[64,'64'],[256,'256']],'64')+U.range('layers','층 수',1,3,1,1)+U.check('bi','양방향 (뒤에서 앞으로 읽는 RNN을 하나 더)',false));
 U.bind(el,()=>{
  const T=num(el,'T'),H=num(el,'H'),layers=num(el,'layers'),bi=on(el,'bi'),c=M.complexity({T,H,layers,bi});
  U.result(el,U.table(['견줄 것','순환층 (RNN)','셀프 어텐션층'],[['곱셈 수의 차수 (T·d² 대 T²·d)',U.int(c.rnn.ops),U.int(c.attn.ops)],['차례로 기다려야 하는 단계',`${c.rnn.serial}`,`${c.attn.serial}`],['가장 먼 두 토큰 사이의 경로',`${c.rnn.path}단계`,`${c.attn.path}단계`],['뒤쪽 토큰을 보고 앞 토큰을 처리',c.rnn.seesFuture?'가능 (양방향)':'불가','가능']]),
   `길이 ${T}, 은닉 크기 ${H}, ${layers}층${bi?', 양방향':''}일 때입니다. 순환층은 앞 시점의 결과를 기다려야 해서 <b>${c.rnn.serial}단계</b>를 차례로 계산하고, 첫 토큰과 마지막 토큰 사이에는 ${c.rnn.path}단계가 놓입니다. 셀프 어텐션층은 모든 토큰 쌍 ${U.int(c.attn.scores)}개의 점수를 한꺼번에 계산해 경로가 1단계입니다.<br>곱셈 수는 ${T<H?`T가 d보다 작아 어텐션 쪽이 적습니다`:T===H?'T와 d가 같아 두 쪽이 같습니다':`T가 d보다 커서 순환층 쪽이 적습니다`}. 단순 RNN의 파라미터는 ${U.int(c.rnn.params)}개, 같은 크기의 LSTM은 게이트 네 벌이라 ${U.int(c.lstmParams)}개입니다. 이 표는 Vaswani 등(2017)의 표 1에 있는 차수에 숫자를 넣은 것이며 상수 배는 뺐습니다.`);
 });
};
L.final=el=>{
 U.setup(el,M.CASES.map((x,i)=>U.select('c-'+x.id,`기록 ${i+1}. ${x.text}`,[['-1','원인을 고르세요'],...x.options.map((o,k)=>[String(k),o])],'-1')).join(''));
 U.bind(el,()=>{
  const choices=Object.fromEntries(M.CASES.map(x=>[x.id,val(el,'c-'+x.id)])),d=M.diagnose(choices),picked=d.rows.filter(r=>r.choice!=='-1').length;
  U.result(el,U.table(['기록','고른 원인','판정','고칠 곳'],d.rows.map((r,i)=>[`기록 ${i+1}`,r.choice==='-1'?'—':r.options[+r.choice],r.choice==='-1'?'아직':r.ok?'맞음':'다시',r.ok?r.fix:'—']),i=>d.rows[i].ok),
   (picked?`다섯 건 가운데 ${picked}건을 골랐고 <b>${d.ok}건</b>이 맞았습니다.`:'아직 고른 원인이 없습니다. 기록마다 원인을 하나씩 골라 보세요.')+`${d.ok===5?' 다섯 건은 기울기 폭발, 기울기 소실, 패딩, 과적합, 입출력 형태가 하나씩입니다. 이제 건마다 결정문 네 칸을 써 보세요.':picked>d.ok?' 틀린 건은 기록에 적힌 숫자(기울기 크기, 학습·검증 오차, 문장 길이, 출력 개수)가 어느 장의 실험에서 나온 것인지부터 찾아보세요.':''}`);
 });
};
})();
