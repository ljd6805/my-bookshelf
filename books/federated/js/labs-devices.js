/* 2부 5·6장 실험: 참여 기기 고르기와 성능이 다른 기기. 기기 상태 확률과 등급별 속도는 이 책이 정한 시나리오이고, 학습과 평균은 실제 계산이다. */
(()=>{
'use strict';
const M=FLMath,U=FLUI,L=FLLabs,STY=M.STYLES;
const memo=new Map();
const run=opts=>{const k=JSON.stringify(opts);if(!memo.has(k))memo.set(k,M.train(M.users(1),{C:.1,E:5,B:10,rounds:40,...opts}));return memo.get(k);};

Object.assign(FLLabText,{
 select:['참여 조건과 시각을 바꾸며 라운드에 뽑히는 사용자 구성 재기','서버는 라운드마다 조건을 만족해 체크인한 기기 가운데 100대를 고릅니다. 조건(충전 중·와이파이·유휴)과 라운드 시각(새벽 3시·오후 3시)을 바꾸며 40라운드 동안 참여한 기기의 말투 구성, 한 번도 뽑히지 않은 사용자 수, 말투별 적중을 봅니다.','새벽 3시에 세 조건을 모두 켜면, 40라운드 동안 참여한 기기 가운데 줄임말 사용자의 몫은 전체 사용자 속 몫(9.8%)보다 클까요, 작을까요? 대략 몇 %일지 적어 보세요.','오후 3시에 세 조건을 모두 켜고 체크인한 기기 수를 확인한 뒤, 이 시각에는 라운드를 열지 않는 편이 나은 이유를 한 번도 뽑히지 않은 사용자 수로 설명해 보세요.','실제 계산 · 기기 상태 확률은 이 책이 정한 시나리오'],
 hetero:['마감 시간 안에 못 끝내는 기기를 버리기·부분 학습·작은 모델로 처리해 비교하기','기기 등급(고급·중급·보급)마다 같은 시간에 할 수 있는 걸음 수가 3·2·1배라고 둡니다. E 5·B 10의 학습을 마감까지 끝내지 못하는 기기를 버리거나, 할 수 있는 만큼만 학습하게 하거나, 숫자 117개짜리 작은 모델을 주는 세 방법을 40라운드 동안 비교합니다.','마감 10에서 느린 기기를 버리면, 40라운드 동안 보급형 기기의 참여는 버리지 않을 때(1,100번)의 몇 %쯤 될까요? 그때 줄임말 사용자의 정답 확률은 오를지 내릴지도 적어 보세요.','마감 20에서 세 방법의 줄임말 정답 확률과 오간 바이트를 적고, 작은 모델이 바이트를 줄이는 대신 무엇을 학습하지 못하는지 “뜻마다 자주 쓰는 앞 단어 넷”이라는 말로 설명해 보세요.','실제 계산 · 기기 등급별 속도는 이 책이 정한 시나리오']
});

L.select=el=>{
 U.setup(el,U.select('stime','라운드 시각',[['night','새벽 3시'],['day','오후 3시']],'night')+U.check('scharge','충전 중인 기기만',true)+U.check('swifi','와이파이에 연결된 기기만',false)+U.check('sidle','쓰지 않고 있는(유휴) 기기만',false));
 U.bind(el,()=>{
  const night=el.querySelector('#stime').value==='night',sel={night,charging:U.checked(el,'scharge'),wifi:U.checked(el,'swifi'),idle:U.checked(el,'sidle')},any=sel.charging||sel.wifi||sel.idle;
  const r=run({select:any?sel:null}),list=M.users(1),pop=[0,1,2].map(s=>list.filter(u=>u.style===s).length/list.length);
  const share=[0,1,2].map(s=>r.logs.reduce((a,l)=>a+l.styles[s],0)),tot=share.reduce((a,b)=>a+b,0),part=M.participation(r.logs,list),never=part.filter(x=>!x).length;
  const el0=r.logs.map(l=>l.eligible),avg=el0.reduce((a,b)=>a+b,0)/el0.length,neverBy=[0,1,2].map(s=>list.filter((u,i)=>u.style===s&&!part[i]).length);
  const labels=STY.flatMap(s=>[`${s} · 전체 사용자`,`${s} · 참여 기기`]),vals=[0,1,2].flatMap(s=>[pop[s],share[s]/tot]);
  U.result(el,U.bars(labels,vals,{max:.8,format:v=>U.pct(v,1),mark:i=>i===5}),
   `라운드마다 체크인한 기기 평균 <b>${U.fmt(avg,1)}대</b>(가장 적은 라운드 ${Math.min(...el0)}대), 고른 기기 ${r.logs[0].picked}대. 40라운드 동안 한 번도 뽑히지 않은 사용자 <b>${U.int(never)}명</b>(존댓말 ${neverBy[0]} · 반말 ${neverBy[1]} · 줄임말 ${neverBy[2]}).<br>참여 기기 속 줄임말 몫 ${U.pct(share[2]/tot,1)} ✓(전체 ${U.pct(pop[2],1)}). 말투별 첫 추천 적중: 존댓말 ${U.fmt(r.final.byStyle[0],3)} · 반말 ${U.fmt(r.final.byStyle[1],3)} · 줄임말 <b>${U.fmt(r.final.byStyle[2],3)}</b>, 정답 확률 줄임말 ${U.fmt(r.final.probByStyle[2],3)}.`);
 },{heavy:true});
};

const MODES={drop:'버리기',partial:'부분 학습',small:'작은 모델'};
L.hetero=el=>{
 U.setup(el,U.select('hmode','마감을 넘기는 기기 처리',Object.entries(MODES),'partial')+U.range('hdl','마감(고급 기기 기준 걸음 수 ÷ 3)',10,40,10,20));
 U.bind(el,()=>{
  const mode=el.querySelector('#hmode').value,deadline=U.value(el,'hdl'),r=run({hetero:{mode,deadline}}),base=run({});
  const sum=k=>r.logs.reduce((a,l)=>a+l[k],0),tiers=[0,1,2].map(t=>r.logs.reduce((a,l)=>a+l.tiers[t],0)),btiers=[0,1,2].map(t=>base.logs.reduce((a,l)=>a+l.tiers[t],0));
  const rows=M.TIERS.map((t,i)=>[`${t}(${M.SPEED[i]}배)`,U.int(btiers[i]),U.int(tiers[i]),U.pct(tiers[i]/btiers[i],0)]);
  const note={drop:`버린 참여 ${U.int(sum('dropped'))}번`,partial:`할 수 있는 걸음만 학습한 참여 ${U.int(sum('partial'))}번`,small:`작은 모델(숫자 ${M.SMALL_DIM}개)로 학습한 참여 ${U.int(sum('small'))}번`}[mode];
  U.result(el,U.table(['기기 등급(속도)','마감 없을 때 참여','이 설정의 참여','비율'],rows,{caption:`${MODES[mode]} · 마감 ${deadline} · 40라운드`,mark:i=>i===2})+U.bars(STY.map(s=>s+' 정답 확률'),r.final.probByStyle,{max:.6,digits:3,mark:i=>i===2}),
   `${note}. 오간 바이트 ${U.bytes(r.bytes)}(마감 없을 때 ${U.bytes(base.bytes)}).<br>첫 추천 적중 ${U.fmt(r.final.acc,3)}(줄임말 ${U.fmt(r.final.byStyle[2],3)}), 정답 확률 ${U.fmt(r.final.prob,3)}, 줄임말 정답 확률 <b>${U.fmt(r.final.probByStyle[2],3)}</b> ✓(마감 없을 때 ${U.fmt(base.final.probByStyle[2],3)}).`);
 },{heavy:true});
};

Object.assign(FLGuideData,{
 select:['참여 조건이 누구의 기기를 라운드에서 빼는지, 그 결과가 말투별 적중에 어떻게 남는지 봅니다.',[['조건 없음',{stime:'night',scharge:false,swifi:false,sidle:false}],['새벽 · 충전만',{stime:'night',scharge:true,swifi:false,sidle:false}],['새벽 · 세 조건',{stime:'night',scharge:true,swifi:true,sidle:true}],['오후 · 세 조건',{stime:'day',scharge:true,swifi:true,sidle:true}]],'조건이 없으면 참여 기기 속 줄임말 몫이 10.1%로 전체(9.8%)와 비슷하고, 40라운드 동안 뽑히지 않은 사용자는 11명입니다. 새벽 3시에 충전만 요구하면 체크인 기기가 평균 727.2대, 줄임말 몫 5.2%, 뽑히지 않은 사용자 153명입니다. 세 조건을 모두 켜면 체크인 565.1대, 줄임말 몫 3.0%, 뽑히지 않은 사용자 224명(줄임말 98명 중 62명)이고, 줄임말 첫 추천 적중이 0.319에서 0.063으로 떨어집니다. 줄임말 사용자는 이 시나리오에서 밤 충전(40%)과 집 와이파이(45%) 비율이 낮게 정해져 있기 때문입니다. 오후 3시에 세 조건을 켜면 체크인이 평균 23.8대라 라운드마다 20대 안팎만 참여하고, 뽑히지 않은 사용자가 380명입니다.'],
 hetero:['느린 기기를 버리면 보급형 기기가 많은 사용자들이 평균에서 빠집니다. 부분 학습과 작은 모델이 그 몫을 얼마나 되살리는지 봅니다.',[['버리기 · 마감 10',{hmode:'drop',hdl:10}],['부분 학습 · 마감 10',{hmode:'partial',hdl:10}],['작은 모델 · 마감 10',{hmode:'small',hdl:10}],['버리기 · 마감 20',{hmode:'drop',hdl:20}]],'마감 10에서 버리기는 참여 4,000번 가운데 1,308번을 버려 보급형 기기 참여가 1,100번에서 438번(40%)으로 줄고, 줄임말 정답 확률은 0.114(마감 없을 때 0.164)입니다. 같은 마감에서 부분 학습은 모두 참여시켜 0.133, 작은 모델은 0.140입니다. 오간 바이트는 버리기 6.02 MB(버린 기기도 모델은 내려받음), 부분 학습 7.20 MB, 작은 모델 6.07 MB입니다. 마감 20이면 버리는 참여가 405번으로 줄어 버리기도 0.133이 됩니다. 작은 모델은 뜻마다 자주 쓰는 앞 단어 넷의 줄과 편향만 가지므로, 나머지 줄은 고급·중급 기기만 학습합니다.']
});
})();
