/* 4부(10~12장)와 마지막 과제 실험: 개인화, 묶음별 연합 평가, LoRA 어댑터 통신량, 하린의 설정 보고서. 계산은 FLMath, 여기서는 입력을 읽고 그린다. */
(()=>{
'use strict';
const M=FLMath,U=FLUI,L=FLLabs;
const users=()=>M.users(1);
const memo=new Map();
function once(key,fn){if(!memo.has(key))memo.set(key,fn());return memo.get(key);}
/* 공용 모델(기기 100대, E 5, B 10, 40라운드)과, 5장의 새벽 조건(충전·와이파이·유휴)으로만 고른 기기로 학습한 모델. */
const shared=()=>once('shared',()=>M.train(users(),{C:.1,E:5,B:10,rounds:40}));
const nightRun=()=>once('night',()=>M.train(users(),{C:.1,E:5,B:10,rounds:40,select:{night:true,charging:true,wifi:true,idle:true}}));
const mean=(a,f)=>a.length?a.reduce((s,x)=>s+f(x),0)/a.length:0;
const S3=M.STYLES;

Object.assign(FLLabText,{
 personal:['기기에서 더 학습한 횟수와 섞는 비율 λ로 말투별 적중 비교하기','기기마다 공용 모델을 받아 자기 학습 쌍으로 몇 번 더 학습하고(묶음 10, 학습률 0.3), 다음 단어 확률을 λ × 공용 + (1 − λ) × 개인으로 섞어 추천합니다. 시험 쌍 20개는 학습에 쓰지 않고 채점에만 씁니다.','더 학습하는 횟수를 2로 두고 λ를 0(개인 모델만)으로 내리면 줄임말 사용자의 적중은 0.319에서 얼마쯤으로 오를까요? 적중이 오히려 떨어지는 사용자도 생길지 적어 보세요.','더 학습하는 횟수를 5로 올리고 λ를 1 → 0.5 → 0으로 내리며, 나빠진 사용자 수와 가입 30일 이내 사용자의 평균 적중을 적어 보세요. 신규 사용자가 줄임말 사용자보다 덜 좋아지는 이유를 학습 쌍 수로 설명해 보세요.'],
 groups:['기기 안 채점 결과를 메타데이터 묶음별로 더해 적중과 구간 보기','기기는 시험 쌍 20개를 자기 안에서 채점해 (맞힌 수, 시험 수)만 보냅니다. 서버는 기기 등급·가입 시기·충전 습관·집 와이파이 같은 메타데이터로 묶어 더하고 윌슨 95% 구간을 붙입니다. 기기 수가 최소 크기보다 적은 묶음은 숫자를 감춥니다. 말투는 서버가 모르는 값이라 정답지로만 보여 줍니다.','5장의 새벽 조건으로만 학습한 모델에서 “집 와이파이 없음” 묶음(160대)의 적중은 모든 기기로 학습한 모델의 0.523보다 오를까요, 내릴까요? 얼마쯤일지 적어 보세요.','최소 크기를 150으로 올리면 어느 묶음이 감춰지는지 열쇠마다 확인하고, 그 묶음이 가장 낮은 적중을 받은 묶음과 겹치는지 적어 보세요. 작은 묶음을 감추는 규칙의 득과 실을 한 문장씩 써 보세요.','실제 계산 · 메타데이터 비율은 이 책이 정한 시나리오, 구간은 시험 쌍을 서로 독립으로 본 근사'],
 lora:['층 수·폭·랭크로 전체 모델과 LoRA 어댑터의 라운드당 통신량 비교하기','층마다 정사각 행렬 둘(Hu 외 2021의 대부분 실험처럼 W_q와 W_v)에 랭크 r의 B(d×r)·A(r×k, 여기서는 k = d)를 붙이면 어댑터 숫자는 층 수 × 2 × 2dr입니다. 라운드마다 참여 기기가 모델이나 어댑터를 받고 같은 크기를 올린다고 보고 바이트를 셉니다.','층 24개, 폭 2,048, 랭크 8이면 어댑터 숫자는 전체 10억 개의 몇 퍼센트일까요? 0.1%보다 클지 작을지 먼저 적어 보세요.','랭크를 1에서 64까지 바꾸며 어댑터가 전체의 1%를 넘는 랭크를 찾아보세요. 그리고 Gboard 2018 모델(매개변수 약 140만 개, 32비트)을 한 번 받는 데 드는 바이트와, 지금 설정의 어댑터 하나를 비교해 보세요.','실제 계산 · 전체 모델 크기 1억·10억·70억 개는 이 책이 정한 예시 크기'],
 final:['참여 확률·기기 안 학습·잡음·섞는 비율로 하린의 보고서 초안 채우기','네 설정으로 DP-FedAvg(S 1, 40라운드, 묶음 10)를 학습하고, 기기마다 2번 더 학습한 개인 모델과 λ로 섞습니다. 전체·줄임말·가입 30일 이내 사용자의 적중, 기기 한 대의 기대 통신량, ε(δ = 10⁻⁵)를 함께 계산해 보고서 칸을 채웁니다.','q 0.1, E 1, z 2, λ 0.25로 두면 ε와 줄임말 사용자의 적중은 처음 설정(q 0.1, E 1, z 1, λ 0.5)보다 각각 좋아질까요, 나빠질까요? 두 값을 먼저 적어 보세요.','보고서의 “결정과 이유”에 ε 3 이하, 기기 한 대의 기대 통신량 10 KB 이하를 지키면서 줄임말 사용자 적중이 가장 높은 설정을 적어 보세요. “남은 위험”에는 이 책의 모델과 합성 사용자로는 확인할 수 없는 것을 하나 이상 적어 보세요.','실제 계산 · 잡음은 씨앗을 정한 의사 난수, ε는 정수 차수 2~256과 Mironov(2017) 명제 3 변환, 포아송 표집 가정']
});

L.personal=el=>{
 U.setup(el,U.range('pe','기기에서 더 학습하는 횟수',0,5,1,1)+U.range('pl','공용 모델 비율 λ',0,1,.25,.75));
 U.bind(el,()=>{
  const ep=U.value(el,'pe'),lam=U.value(el,'pl'),p=M.personalize(shared().w,users(),{epochs:ep,lambda:lam});
  const g=[0,1,2].map(s=>mean(p.users.filter(u=>u.style===s),u=>u.global)),fr=p.users.filter(u=>u.fresh);
  const labels=[],vals=[];S3.forEach((s,i)=>{labels.push(`${s} · 공용`,`${s} · 섞음`);vals.push(g[i],p.byStyle[i]);});
  U.result(el,U.bars(labels,vals,{digits:3,max:1,mark:i=>i%2===1&&vals[i]>vals[i-1]+1e-9}),`전체 사용자 1,000명의 평균 적중: 공용 모델 ${U.fmt(p.global,3)} → 섞은 추천 <b>${U.fmt(p.mine,3)}</b><br>좋아진 사용자 ${p.better}명 · 나빠진 사용자 ${p.worse}명 · 그대로 ${1000-p.better-p.worse}명<br>가입 30일 이내 ${fr.length}명(학습 쌍 4~15개): ${U.fmt(mean(fr,u=>u.global),3)} → ${U.fmt(mean(fr,u=>u.mine),3)}${ep===0||lam===1?'<br>더 학습하지 않거나 λ가 1이면 추천이 공용 모델과 같습니다.':''}`);
 });
};

const GKEYS=[['tier','기기 등급'],['fresh','가입 시기'],['night','충전 습관'],['wifi','집 와이파이'],['style','말투(정답지 · 서버는 모름)']];
L.groups=el=>{
 U.setup(el,U.select('gm','평가할 모델',[['all','모든 기기에서 학습(공용 모델)'],['night','새벽 충전·와이파이·유휴 기기만으로 학습']],'all')+U.select('gk','묶는 열쇠',GKEYS,'tier')+U.range('gs','공개할 최소 기기 수',10,200,10,20));
 U.bind(el,()=>{
  const m=el.querySelector('#gm').value==='all'?shared():nightRun(),key=el.querySelector('#gk').value,min=U.value(el,'gs');
  const pred=M.predict(m.w),rep=M.groupReport(users(),u=>M.correct(pred,u.testCount),key,min);
  const shown=rep.rows.filter(r=>!r.hidden),low=shown.length?shown.reduce((a,b)=>b.acc<a.acc?b:a):null;
  const rows=rep.rows.map(r=>r.hidden?[r.group,'숨김','숨김','숨김']:[r.group,U.int(r.devices),U.fmt(r.acc,3),`${U.fmt(r.ci[0],3)} ~ ${U.fmt(r.ci[1],3)}`]);
  const hid=rep.rows.filter(r=>r.hidden);
  U.result(el,U.table(['묶음','기기 수','첫 추천 적중','윌슨 95% 구간'],rows,{caption:`${rep.label}${U.josa(rep.label,'으로','로')} 묶은 연합 평가`,mark:i=>low&&rep.rows[i]===low}),`전체 적중 ${U.fmt(m.final.acc,3)}${low?` · 공개된 묶음 가운데 가장 낮은 곳: <b>${low.group} ${U.fmt(low.acc,3)}</b>(${U.int(low.devices)}대)`:''}<br>${hid.length?`기기 ${min}대 미만이라 감춘 묶음 ${hid.length}개: ${hid.map(r=>r.group).join(', ')}`:`기기 ${min}대 미만인 묶음이 없어 모든 묶음을 공개합니다.`}${key==='style'?'<br>말투는 기기가 서버에 보내지 않는 값입니다. 이 표는 합성 자료라서 볼 수 있는 정답지입니다.':''}`);
 });
};

const FULL=[[1e8,'1억 개(예시)'],[1e9,'10억 개(예시)'],[7e9,'70억 개(예시)']];
L.lora=el=>{
 U.setup(el,U.select('lfull','전체 모델 매개변수',FULL,1e9)+U.range('lL','층 수 L',12,48,4,24)+U.select('ld','폭 d',[[1024,'1,024'],[2048,'2,048'],[4096,'4,096'],[8192,'8,192']],2048)+U.range('lr','랭크 r',1,64,1,8)+U.select('lbits','숫자 하나의 비트',[[16,'16비트'],[32,'32비트']],16)+U.range('ldev','라운드당 참여 기기',100,1000,100,300));
 U.bind(el,()=>{
  const full=Number(el.querySelector('#lfull').value),Ln=U.value(el,'lL'),d=Number(el.querySelector('#ld').value),r=U.value(el,'lr'),bits=Number(el.querySelector('#lbits').value),devices=U.value(el,'ldev');
  const c=M.loraComm({full,L:Ln,d,r,bits,devices,rounds:1}),gb=1.4e6*4;
  const warn=c.lora>full?'<br><b>설정 확인</b> 어댑터 숫자가 전체 모델보다 큽니다. 폭이나 층 수가 이 예시 크기와 맞지 않습니다.':'';
  U.result(el,U.bars(['전체 모델','LoRA 어댑터'],[c.fullRound,c.loraRound],{format:U.bytes,mark:i=>i===1}),`어댑터 숫자 ${U.int(c.lora)}개 = 전체의 <b>${U.pct(c.share,3)}</b> · 기기 한 대가 한 라운드에 주고받는 양: 전체 ${U.bytes(2*full*bits/8)}, 어댑터 ${U.bytes(2*c.lora*bits/8)}<br>라운드당 서버가 주고받는 양(기기 ${devices}대): 전체 ${U.bytes(c.fullRound)} → 어댑터 <b>${U.bytes(c.loraRound)}</b>, ${U.fmt(c.fullRound/c.loraRound,0)}분의 1<br>비교: Gboard 2018 모델(매개변수 약 140만 개)을 32비트로 한 번 받으면 ${U.bytes(gb)}입니다.${warn}`);
 });
};

/* 마지막 과제: DP 학습과 개인화는 같은 설정이면 한 번만 계산한다. */
function finalRun(q,E,z,lam){
 return once(`final:${q}:${E}:${z}:${lam}`,()=>{
  const d=once(`fdp:${q}:${E}:${z}`,()=>M.dpTrain(users(),{q,E,B:10,S:1,z,rounds:40})),p=M.personalize(d.w,users(),{epochs:2,lambda:lam});
  const short=p.users.filter(u=>u.style===2),fresh=p.users.filter(u=>u.fresh),e=M.epsilon({q,z,T:40,delta:1e-5}),per=(M.DIM*4)*2;
  return {d,p,short:mean(short,u=>u.mine),fresh:mean(fresh,u=>u.mine),eps:e.eps,device:40*q*per,server:q*1000*per};
 });
}
L.final=el=>{
 U.setup(el,U.range('fq','참여 확률 q',.05,.3,.05,.1)+U.select('fE','기기 안 학습 E',[[1,'E 1'],[2,'E 2'],[5,'E 5']],1)+U.range('fz','잡음 배수 z',0,4,.5,1)+U.range('fl','공용 모델 비율 λ',0,1,.25,.5));
 U.bind(el,()=>{
  const q=U.value(el,'fq'),E=Number(el.querySelector('#fE').value),z=U.value(el,'fz'),lam=U.value(el,'fl'),r=finalRun(q,E,z,lam);
  const eps=Number.isFinite(r.eps)?U.fmt(r.eps,2):'∞ (보장 없음)';
  const rows=[['공용 모델 첫 추천 적중',U.fmt(r.d.final.acc,3)],['섞은 추천 · 전체',U.fmt(r.p.mine,3)],['섞은 추천 · 줄임말 사용자 98명',U.fmt(r.short,3)],['섞은 추천 · 가입 30일 이내 143명',U.fmt(r.fresh,3)],['잘린 업데이트(S 1)',U.pct(r.d.clippedShare)],['기기 한 대의 기대 통신량(40라운드)',U.bytes(r.device)],['서버의 라운드당 기대 통신량',U.bytes(r.server)],['ε (δ = 10⁻⁵)',eps]];
  const report=`<div class="report"><h4>보고서 초안 · 다음 단어 추천 출시 설정</h4><dl><dt>설정</dt><dd>q ${q} · E ${E} · B 10 · S 1 · z ${z} · λ ${lam} · 40라운드</dd><dt>전체 적중</dt><dd>${U.fmt(r.p.mine,3)} (공용 모델만 ${U.fmt(r.d.final.acc,3)})</dd><dt>줄임말 사용자</dt><dd>${U.fmt(r.short,3)}</dd><dt>가입 30일 이내</dt><dd>${U.fmt(r.fresh,3)}</dd><dt>기기당 통신량</dt><dd>${U.bytes(r.device)} (40라운드 기대값)</dd><dt>프라이버시 예산</dt><dd>ε ${eps}, δ 10⁻⁵, 사용자 수준</dd><dt>결정과 이유</dt><dd>(직접 적기)</dd><dt>남은 위험</dt><dd>(직접 적기)</dd></dl></div>`;
  U.result(el,U.table(['항목','값'],rows,{caption:'합성 사용자 1,000명에서 계산한 값'})+report,`이 설정에서 줄임말 사용자의 적중은 <b>${U.fmt(r.short,3)}</b>, ε는 <b>${eps}</b>, 기기 한 대가 40라운드 동안 주고받을 기대 바이트는 <b>${U.bytes(r.device)}</b>입니다.${E>1?` E ${E}에서는 업데이트가 길어져 ${U.pct(r.d.clippedShare)}가 S 1에서 잘립니다.`:''}${z===0?' 잡음이 없으면 차등 프라이버시 보장이 없습니다.':''}`);
 },{heavy:true});
};

Object.assign(FLGuideData,{
 personal:['공용 모델을 기기에서 조금 더 학습하고 섞으면 말투가 드문 사용자와 데이터가 적은 사용자가 얼마나 좋아지는지 확인합니다.',[['공용 모델 그대로',{pe:2,pl:1}],['2번 · λ 0.5',{pe:2,pl:.5}],['2번 · λ 0',{pe:2,pl:0}],['5번 · λ 0',{pe:5,pl:0}]],'λ가 1이면 추천이 공용 모델과 같아 전체 0.649, 줄임말 0.319입니다. 2번 더 학습하고 λ 0.5로 섞으면 전체 0.659, 줄임말 0.376이 되고 108명이 좋아지고 5명이 나빠집니다. λ 0(개인 모델만)이면 전체 0.682, 반말 0.598, 줄임말 0.412, 좋아진 사용자 228명·나빠진 사용자 7명입니다. 5번 더 학습하고 λ 0이면 전체 0.715, 줄임말 0.497까지 오르지만 나빠진 사용자도 16명으로 늘어납니다. 가입 30일 이내 143명은 0.570에서 2번·λ 0에 0.585, 5번·λ 0에 0.607로 덜 오릅니다. 학습 쌍이 4~15개뿐이기 때문입니다.'],
 groups:['기기 안에서 채점한 결과만 모아도 어떤 사용자 묶음이 뒤처지는지 찾을 수 있는지, 작은 묶음을 감추면 무엇을 놓치는지 확인합니다.',[['공용 모델 · 기기 등급',{gm:'all',gk:'tier',gs:20}],['공용 모델 · 집 와이파이',{gm:'all',gk:'wifi',gs:20}],['새벽 모델 · 말투(정답지)',{gm:'night',gk:'style',gs:20}],['최소 150대 · 가입 시기',{gm:'all',gk:'fresh',gs:150}]],'공용 모델을 기기 등급으로 묶으면 중급 0.687, 고급 0.659, 보급 0.584입니다. 보급형 기기에는 줄임말 사용자가 많아(이 책의 시나리오) 낮게 나옵니다. 집 와이파이로 묶으면 있음 0.673, 없음 0.523(160대, 구간 0.506~0.540)입니다. 새벽 조건으로만 학습한 모델은 와이파이 없음 묶음이 0.430으로 더 떨어지고, 정답지로 보면 줄임말 사용자가 0.063입니다. 최소 크기를 150대로 올리면 가입 30일 이내 묶음(143대, 0.570)이 감춰집니다. 가장 낮은 묶음이 가장 먼저 사라질 수 있다는 뜻입니다. 구간은 한 사람의 시험 쌍 20개를 서로 독립으로 본 근사라 실제로는 더 넓습니다.'],
 lora:['대형 모델 전체 대신 LoRA 어댑터만 주고받으면 라운드마다 오가는 바이트가 얼마나 줄어드는지 계산합니다.',[['처음 설정',{lfull:1e9,lL:24,ld:2048,lr:8,lbits:16,ldev:300}],['랭크 64',{lfull:1e9,lL:24,ld:2048,lr:64,lbits:16,ldev:300}],['70억 · 폭 4,096 · 32층',{lfull:7e9,lL:32,ld:4096,lr:8,lbits:16,ldev:300}]],'처음 설정(10억 개 예시, 24층, 폭 2,048, 랭크 8, 16비트, 기기 300대)에서 어댑터는 1,572,864개로 전체의 0.157%입니다. 기기 한 대가 한 라운드에 주고받는 양은 전체 모델이면 4.00 GB, 어댑터면 6.29 MB이고, 서버 쪽은 1,200.00 GB에서 1.89 GB로 636분의 1이 됩니다. 랭크를 64로 올리면 어댑터가 12,582,912개(1.258%)가 됩니다. 70억 개 예시에 32층·폭 4,096·랭크 8이면 어댑터 4,194,304개로 전체의 0.060%입니다. 비교로 Gboard 2018 모델(약 140만 개)을 32비트로 한 번 받으면 5.60 MB입니다.'],
 final:['네 설정이 정확도, 줄임말·신규 사용자, 통신량, ε에 함께 미치는 영향을 계산하고 보고서 칸을 채웁니다.',[['처음 설정',{fq:.1,fE:1,fz:1,fl:.5}],['z 2 · λ 0.25',{fq:.1,fE:1,fz:2,fl:.25}],['q 0.05 · z 2 · λ 0.25',{fq:.05,fE:1,fz:2,fl:.25}],['E 2 · z 2 · λ 0.25',{fq:.1,fE:2,fz:2,fl:.25}]],'처음 설정(q 0.1, E 1, z 1, λ 0.5)에서 공용 모델은 0.630, 섞은 추천은 전체 0.653, 줄임말 0.126, 가입 30일 이내 0.506이고 ε는 6.18, 기기 한 대의 기대 통신량은 7.2 KB입니다. z 2·λ 0.25로 바꾸면 ε가 2.01로 줄고 공용 모델은 0.617로 조금 내려가지만, 섞은 추천의 줄임말 적중은 0.206으로 오릅니다. 통신량은 같습니다. q를 0.05로 내리면 ε 1.02, 통신량 3.6 KB가 되지만 공용 모델이 0.598로 떨어지고 줄임말은 0.180입니다. E 2·z 2·λ 0.25는 ε 2.01, 줄임말 0.250, 공용 0.628이며 업데이트의 16.9%가 잘립니다. 이 값들은 합성 사용자 1,000명과 가중치 225개 모델에서만 성립합니다.']
});
})();
