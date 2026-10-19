/* 3부(7~9장) 실험: 업데이트에서 단어 쌍 되찾기, 보안 집계, 차등 프라이버시. 계산은 FLMath, 여기서는 입력을 읽고 그린다. */
(()=>{
'use strict';
const M=FLMath,U=FLUI,L=FLLabs;
const users=()=>M.users(1);
const memo=new Map();
function once(key,fn){if(!memo.has(key))memo.set(key,fn());return memo.get(key);}
/* 모든 장이 함께 쓰는 공용 모델: 기기 100대(C 0.1), E 5, B 10으로 40라운드 FedAvg. */
const shared=()=>once('shared',()=>M.train(users(),{C:.1,E:5,B:10,rounds:40}));
/* 7장에서 고른 사용자 넷(합성 사용자 번호). */
const LEAK_USERS=[15,18,14,50];
/* 8장의 기기 다섯: 공용 모델에서 E 5, B 10으로 학습한 업데이트 가운데 편향 네 칸(갈게요·갈게·ㄱㄱ·알겠습니다)을 1,000배 해 반올림한 정수. */
const SEC_USERS=[15,18,14,50,3];
const secUpdates=()=>once('sec',()=>SEC_USERS.map(id=>{const d=M.userUpdate(shared().w,users()[id].train,{E:5,B:10,lr:.3});return [0,1,2,3].map(k=>Math.round(1000*d[M.P*M.K+k]));}));
const words=row=>row.map((n,k)=>n?`${M.WORDS[k]} ${n}`:'').filter(Boolean).join(' · ')||'—';

Object.assign(FLLabText,{
 leak:['기기가 올린 업데이트에서 사용자의 단어 쌍 횟수 되찾기','서버(여기서는 공격자 자리)는 자기가 보낸 모델 w, 학습률 0.3, 기기가 가중 평균용으로 함께 보낸 학습 쌍 수 n을 압니다. 기기가 올린 업데이트 Δ만 보고 앞 단어마다 사용자가 어떤 다음 단어를 몇 번 썼는지 계산해, 기기 안의 실제 횟수와 맞춥니다.','사용자 15가 FedSGD 대신 FedAvg(E 5, B 10)로 학습한 업데이트를 올리면, 서버는 87개 단어 쌍의 횟수를 여전히 정확히 되찾을 수 있을까요? 횟수는 못 찾더라도 사용자가 어떤 앞 단어를 썼는지는 알아낼 수 있을지 함께 적어 보세요.','네 사용자를 차례로 골라 FedSGD와 FedAvg에서 “앞 단어마다 가장 많이 쓴 다음 단어”가 몇 줄 맞는지 적어 보세요. 그리고 가입한 지 얼마 안 된 사용자 50(쌍 7개)이 왜 가장 쉽게 드러나는지 한 문장으로 설명해 보세요.','실제 계산 · 합성 사용자의 업데이트를 브라우저에서 만들고 같은 업데이트에서 되찾음'],
 secagg:['기기 다섯의 마스크한 업데이트를 더해 합만 되찾기','기기마다 다른 기기와 짝을 지어 같은 마스크를 한쪽은 더하고 한쪽은 뺀 값을 보냅니다. 서버가 받은 값을 모두 더하면 마스크가 지워져 합만 남습니다. 끊긴 기기와 비밀 조각 문턱 t를 바꾸며 합을 되찾을 수 있는지 봅니다.','기기 2와 4가 마스크한 값을 보내기 전에 끊기면, 서버가 받은 세 값을 더한 결과는 살아 있는 세 기기의 실제 합과 같을까요? 같지 않다면 서버는 무엇을 더 받아야 할지 적어 보세요.','t를 5까지 올리며 기기 둘이 끊겼을 때 합을 되찾지 못하게 되는 t를 찾아보세요. 그리고 이중 마스크를 끄면 서버가 받은 값을 더한 것만으로 무엇이 바로 나오는지 확인하고, 자기 마스크가 왜 필요한지 설명해 보세요.','실제 계산 · 작은 소수 65,537을 쓴 축소판이라 암호 강도는 없음'],
 dp:['업데이트 자르기 S·잡음 배수 z·참여 확률 q로 정확도와 ε 계산하기','라운드마다 사용자를 확률 q로 따로따로 뽑고, 기기마다 업데이트(E 1, B 10)를 길이 S로 자른 뒤, 서버가 합에 표준편차 zS인 잡음을 칸마다 더해 기대 인원 qN으로 나눕니다. 같은 설정에서 잡음만 뺀 곡선과 비교하고, 프라이버시 예산 ε(δ = 10⁻⁵)를 계산합니다.','잡음 배수 z를 1에서 2로 두 배 올리면 ε는 6.18에서 얼마쯤으로 내려갈까요? 그때 첫 추천 적중률은 0.630에서 얼마나 떨어질지 함께 적어 보세요.','S를 0.25로 줄였을 때 잘리는 업데이트의 비율과 반말 사용자의 적중을 S 1과 비교해 보세요. 그리고 아래 표에서 사용자 수가 763,430명이면 같은 z, 같은 기대 인원에서 ε가 얼마가 되는지 읽고, 왜 사용자가 많을수록 ε가 작아지는지 설명해 보세요.','실제 계산 · 잡음은 씨앗을 정한 의사 난수, ε는 정수 차수 2~256과 Mironov(2017) 명제 3 변환, 포아송 표집 가정']
});

L.leak=el=>{
 U.setup(el,U.select('lu','사용자(합성)',LEAK_USERS.map(id=>{const u=users()[id];return [id,`${id}번 · ${M.STYLES[u.style]} · 학습 쌍 ${u.train.length}개${u.fresh?' · 가입 30일 이내':''}`];}),15)+U.select('lmode','기기 안 학습',[['fedsgd','FedSGD · E 1, B ∞ (기울기 한 번)'],['fedavg','FedAvg · E 5, B 10']],'fedsgd')+U.select('lstart','서버가 보낸 모델',[['zero','처음 모델(모두 0)'],['shared','40라운드 공용 모델']],'zero'));
 U.bind(el,()=>{
  const id=Number(el.querySelector('#lu').value),mode=el.querySelector('#lmode').value,start=el.querySelector('#lstart').value,u=users()[id],n=u.train.length;
  const w=start==='zero'?M.zeros():shared().w,opt=mode==='fedsgd'?{E:1,B:Infinity}:{E:5,B:10};
  const d=M.userUpdate(w,u.train,{...opt,lr:.3}),r=M.recoverCounts(w,d,n,.3),a=M.countsOf(u.train);
  const rows=[];let used=0,seen=0,top=0,same=0;
  for(let c=0;c<M.P;c++){
   const has=a[c].some(x=>x),moved=a[c].some((_,k)=>Math.abs(d[c*M.K+k])>1e-12);if(moved)seen++;if(!has)continue;used++;
   const dr=a[c].map((_,k)=>d[c*M.K+k]),guess=dr.indexOf(Math.max(...dr)),mx=Math.max(...a[c]);if(a[c][guess]===mx)top++;
   const eq=a[c].every((x,k)=>x===r.table[c][k]);if(eq)same++;
   rows.push([M.CONTEXTS[c],words(a[c]),words(r.table[c]),M.WORDS[guess],eq?'✓ 같음':'다름']);
  }
  const one=M.recoverInput(M.gradient(w,[u.train[0]]),0),pos=one?one.findIndex(x=>Math.abs(x-1)<1e-9):-1;
  const chart=U.table(['앞 단어','기기 안의 실제 횟수','업데이트에서 되찾은 횟수','Δ가 가장 큰 다음 단어','횟수'],rows,{caption:`사용자 ${id}번이 쓴 앞 단어 ${used}개`,mark:i=>rows[i][4].startsWith('✓')});
  U.result(el,chart,`${mode==='fedsgd'?'FedSGD':'FedAvg(E 5, B 10)'} 업데이트에서 횟수가 그대로 맞은 앞 단어: <b>${same} / ${used}</b>${r.exact?' · 모든 쌍을 정확히 되찾음 ✓':' · 정수 조건을 만족하는 답이 없어 가장 가까운 값을 씀'}<br>업데이트가 0이 아닌 줄 ${seen}개 = 사용자가 쓴 앞 단어 ${used}개${seen===used?' ✓ (어떤 앞 단어를 썼는지는 그대로 드러남)':''} · 앞 단어마다 가장 많이 쓴 다음 단어를 Δ의 가장 큰 칸으로 맞힌 줄: <b>${top} / ${used}</b><br>쌍 하나만으로 계산한 기울기에서 x = ∂L/∂W ÷ ∂L/∂b를 계산하면 24칸 중 “${pos>=0?M.CONTEXTS[pos]:'?'}” 자리만 1입니다(실제 첫 쌍: ${M.CONTEXTS[u.train[0][0]]} → ${M.WORDS[u.train[0][1]]}).`);
 });
};

L.secagg=el=>{
 U.setup(el,`<fieldset class="checks"><legend>마스크한 값을 보내기 전에 끊긴 기기</legend>${SEC_USERS.map((_,i)=>U.check('drop'+i,`기기 ${i+1}`)).join('')}</fieldset>`+U.range('st','비밀 조각 문턱 t',2,5,1,3)+U.check('sdouble','자기 마스크도 더하기(이중 마스크)',true));
 U.bind(el,()=>{
  const x=secUpdates(),dropped=SEC_USERS.map((_,i)=>i).filter(i=>U.checked(el,'drop'+i)),t=U.value(el,'st'),double=U.checked(el,'sdouble');
  const r=M.secureAggregate(x,{dropped,t,double}),v=a=>a.map(n=>U.int(n)).join(', ');
  const rows=x.map((xi,i)=>[`기기 ${i+1}`,`[${v(xi)}]`,dropped.includes(i)?'보내기 전에 끊김':`[${v(r.masked[i])}]`]);
  const chart=U.table(['기기','기기 안의 업데이트(서버는 모름)','서버가 받은 값'],rows,{caption:'편향 네 칸 × 1,000, 반올림한 정수'});
  const ok=r.sum&&r.sum.every((s,i)=>s===r.truth[i]);
  const tail=!r.enough?`<b>되찾지 못함</b> 살아 있는 기기 ${r.alive.length}대가 조각 ${t}개에 모자라, 끊긴 기기의 마스크도 자기 마스크도 풀 수 없습니다. 서버에 남는 것은 마스크가 섞인 합뿐입니다.`:`마스크를 지운 합 [${v(r.sum)}] · 살아 있는 기기 ${r.alive.length}대의 실제 합 [${v(r.truth)}] ${ok?'✓ 같음':'다름'}`;
  U.result(el,chart,`서버가 받은 값을 더한 결과 [${v(r.raw)}]${!double&&!dropped.length?' = 실제 합(쌍 마스크만 있고 끊긴 기기가 없으면 더하기만으로 지워짐)':''}<br>${tail}${r.enough&&dropped.length?`<br>끊긴 기기 ${dropped.map(i=>i+1).join('·')}의 쌍 마스크는 살아 있는 기기 ${t}대가 낸 비밀 조각으로 키를 되살려 지웠습니다.`:''}${r.enough&&double?`<br>자기 마스크는 살아 있는 기기마다 조각 ${t}개로 되살려 뺐습니다. 같은 기기의 키 조각과 자기 마스크 조각을 둘 다 내주지는 않습니다.`:''}`);
 });
};

/* 같은 설정의 DP 학습과 잡음 없는 비교 학습은 한 번만 계산한다. */
const dpRun=(o)=>once('dp'+JSON.stringify(o),()=>M.dpTrain(users(),{E:1,B:10,...o}));
const epsText=e=>Number.isFinite(e.eps)?U.fmt(e.eps,2):'∞ (보장 없음)';
L.dp=el=>{
 U.setup(el,U.range('dz','잡음 배수 z',0,4,.5,1)+U.range('dS','자르는 길이 S',.25,2,.25,1)+U.range('dq','참여 확률 q',.05,.3,.05,.1)+U.range('dT','라운드 수 T',10,80,10,40));
 U.bind(el,()=>{
  const z=U.value(el,'dz'),S=U.value(el,'dS'),q=U.value(el,'dq'),T=U.value(el,'dT');
  const d=dpRun({q,S,z,rounds:T}),ref=dpRun({q,S,z:0,rounds:T}),e=M.epsilon({q,z,T,delta:1e-5}),cohort=q*1000;
  const tbl=[1000,100000,763430].map(N=>{const x=M.epsilon({q:cohort/N,z,T,delta:1e-5});return [U.int(N)+'명',U.fmt(cohort/N,6),epsText(x)];});
  const chart=U.lines([{name:`잡음 z ${z}`,values:d.curve},{name:'같은 설정, 잡음 없음',values:ref.curve,dash:true}],{ymin:0,ymax:.8,ylabel:'첫 추천 적중률'})+U.table(['사용자 수 N','참여 확률 q = '+U.fmt(cohort,0)+'명 ÷ N',`ε (z ${z}, T ${T})`],tbl,{caption:'기대 인원을 같게 두고 사용자 수만 바꾼 ε'});
  U.result(el,chart,`ε = <b>${epsText(e)}</b> (δ = 10⁻⁵${e.order?`, 가장 좋은 차수 α = ${e.order}`:''}) · 정수 차수 2~256, Mironov(2017) 명제 3의 변환, 포아송 표집 가정<br>T = ${T}라운드 뒤 첫 추천 적중률 <b>${U.fmt(d.final.acc,3)}</b>(잡음 없이 ${U.fmt(ref.final.acc,3)}) · 말투별 존댓말 ${U.fmt(d.final.byStyle[0],3)}, 반말 ${U.fmt(d.final.byStyle[1],3)}, 줄임말 ${U.fmt(d.final.byStyle[2],3)}<br>길이 S에서 잘린 업데이트 ${U.pct(d.clippedShare)} · 라운드마다 뽑힌 사용자 ${Math.min(...d.sizes)}~${Math.max(...d.sizes)}명(기대 ${U.fmt(cohort,0)}명)`);
 },{heavy:true});
};

Object.assign(FLGuideData,{
 leak:['기기가 올린 업데이트만으로 사용자가 어떤 앞 단어 뒤에 어떤 단어를 몇 번 썼는지 서버가 계산해 낼 수 있는지 확인합니다.',[['15번 · FedSGD',{lu:'15',lmode:'fedsgd',lstart:'zero'}],['15번 · FedAvg',{lu:'15',lmode:'fedavg',lstart:'zero'}],['14번(줄임말) · 공용 모델',{lu:'14',lmode:'fedsgd',lstart:'shared'}],['50번(신규) · FedAvg',{lu:'50',lmode:'fedavg',lstart:'shared'}]],'사용자 15번(존댓말, 학습 쌍 87개)의 FedSGD 업데이트에서는 앞 단어 14개의 횟수가 14개 모두 그대로 맞고, 87개 쌍을 정확히 되찾습니다. 40라운드 공용 모델에서 출발해도, 다른 세 사용자로 바꿔도 FedSGD에서는 결과가 같습니다. FedAvg(E 5, B 10)로 바꾸면 횟수가 맞는 앞 단어는 0개가 됩니다. 그래도 업데이트가 0이 아닌 줄은 사용자가 쓴 앞 단어 14개와 정확히 같고, 앞 단어마다 가장 많이 쓴 다음 단어를 Δ의 가장 큰 칸으로 14줄 모두 맞힙니다(공용 모델에서 출발하면 12줄). 신규 사용자 50번은 쌍이 7개뿐이라 FedAvg에서도 앞 단어 5개와 가장 많이 쓴 단어 5줄이 모두 드러납니다.'],
 secagg:['기기마다 서로 지워지는 마스크를 더해 보내면 서버가 합만 알게 되는지, 기기가 끊겨도 합을 되찾을 수 있는지 확인합니다.',[['끊긴 기기 없음',{drop0:false,drop1:false,drop2:false,drop3:false,drop4:false,st:3,sdouble:true}],['기기 2·4 끊김',{drop0:false,drop1:true,drop2:false,drop3:true,drop4:false,st:3,sdouble:true}],['셋이 끊김 · t 3',{drop0:true,drop1:true,drop2:false,drop3:true,drop4:false,st:3,sdouble:true}],['자기 마스크 끔',{drop0:false,drop1:false,drop2:false,drop3:false,drop4:false,st:3,sdouble:false}]],'끊긴 기기가 없으면 마스크를 지운 합이 [−49, −807, 811, 27]로 다섯 기기의 실제 합과 같습니다. 이중 마스크를 켠 상태에서 서버가 받은 값을 더하기만 하면 [29,879, 12,549, 4,310, −27,491]이라 자기 마스크를 풀기 전에는 뜻이 없습니다. 기기 2와 4가 끊기면 더한 값은 [23,675, −32,204, 24,478, 16,060]이지만, 살아 있는 세 기기의 조각으로 두 기기의 키를 되살려 [147, −952, 718, 379]를 얻고 이것이 세 기기의 실제 합과 같습니다. 셋이 끊기면 살아 있는 기기 두 대가 t 3에 모자라 합을 되찾지 못합니다. 자기 마스크를 끄면 더하기만으로 [−49, −807, 811, 27]이 바로 나옵니다.'],
 dp:['업데이트를 자르고 잡음을 더할 때 정확도가 얼마나 떨어지고 ε가 얼마나 작아지는지, 사용자 수가 ε를 어떻게 바꾸는지 확인합니다.',[['처음 설정',{dz:1,dS:1,dq:.1,dT:40}],['z 2',{dz:2,dS:1,dq:.1,dT:40}],['z 4',{dz:4,dS:1,dq:.1,dT:40}],['S 0.25',{dz:1,dS:.25,dq:.1,dT:40}]],'처음 설정(z 1, S 1, q 0.1, T 40)에서 ε는 6.18이고 40라운드 뒤 적중률은 0.630(잡음 없이 0.628)입니다. 업데이트의 2.1%만 잘립니다. z를 2로 올리면 ε가 2.01로 내려가고 적중률은 0.617, z 4면 ε 0.85에 적중률 0.607입니다. S를 0.25로 줄이면 잘리는 업데이트가 80.6%가 되고 적중률이 0.547, 반말 사용자는 0.328로 떨어집니다. ε는 S와 상관없이 6.18 그대로입니다. 아래 표에서 같은 z 1, 기대 인원 100명이면 사용자 10만 명에서 ε 0.90, 763,430명에서 0.68입니다. 사용자 1,000명으로는 같은 잡음이 약한 보장밖에 주지 못합니다.']
});
})();
