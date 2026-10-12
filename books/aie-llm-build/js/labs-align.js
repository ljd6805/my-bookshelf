/* 6~9장 실험: SFT 손실 마스크, DPO, GRPO 집단 이점, ELO.
   계산은 모두 A11Math가 하고, 여기서는 입력을 읽어 그림과 결과 문장을 그린다. */
(()=>{
'use strict';
const U=A11UI,M=A11Math,F=U.fmt,R=U.range,S=U.select;

A11Labs.lossmask=el=>{
 U.setup(el,R('sft-prompt','지시문 길이 (토큰)',0,60,1,20)+S('sft-mode','손실 계산 방식',[['all','모든 토큰 평균'],['seqlen','응답 손실 ÷ 전체 길이'],['resp','응답 손실 ÷ 응답 수']],'resp'));
 U.bind(el,()=>{
  const n=U.value(el,'sft-prompt'),mode=U.text(el,'sft-mode'),all=M.sftLoss(n,'all'),seq=M.sftLoss(n,'seqlen'),resp=M.sftLoss(n,'resp'),cur={all,seqlen:seq,resp}[mode];
  const strip=`<div class="a11-chips" aria-label="지시문 ${n}토큰은 마스크 0, 응답 8토큰은 마스크 1">${'<span class="off">0</span>'.repeat(n)}${M.RESP.map(v=>`<span class="on">${F(v,1)}</span>`).join('')}</div>`;
  const chart=U.bars(['모든 토큰 평균','응답 ÷ 전체 길이','응답 ÷ 응답 수'],[all.loss,seq.loss,resp.loss],'평균 손실 (nat)',null,3)+strip;
  U.result(el,chart,`지시문 ${n}토큰(손실 3.0, 마스크 0) + 응답 8토큰(마스크 1)<br>지금 방식: 센 토큰 ${cur.counted}개 ÷ 분모 ${cur.denom} → 손실 <b>${F(cur.loss,3)}</b><br>모든 토큰 ${F(all.loss,3)} · 응답 ÷ 전체 ${F(seq.loss,3)} · 응답만 ${F(resp.loss,3)}<br>`+
   (mode==='resp'?'지시문 길이를 바꿔도 이 값은 그대로입니다.':mode==='seqlen'?'지시문이 길수록 같은 응답의 손실이 작아져 학습 신호가 희석됩니다.':'지시문 토큰의 손실이 섞여 모델이 질문을 흉내 내는 데 기울기를 씁니다.')+'<br>토큰 손실은 미리 정한 교육용 값이며, 평균 계산만 실제로 합니다. 아래 띠의 0은 마스크 0인 지시문 토큰입니다.');
 });
};

A11Labs.dpo=el=>{
 U.setup(el,R('dpo-m','로그확률 비율 차이 m (nat)',-6,6,0.5,2)+S('dpo-beta','β',[[0.1,'0.1'],[0.3,'0.3'],[0.5,'0.5'],[1,'1.0']],0.1));
 U.bind(el,()=>{
  const m=U.value(el,'dpo-m'),beta=U.value(el,'dpo-beta'),r=M.dpo(m,beta),xs=Array.from({length:49},(_,i)=>-6+i*0.25);
  const lines=[0.1,0.3,0.5,1].filter(b=>b!==beta).map(b=>({data:xs.map(x=>[x,M.dpo(x,b).loss]),color:'var(--muted)',dashed:true})).concat([{data:xs.map(x=>[x,M.dpo(x,beta).loss])}]);
  const chart=U.plot({lines,points:[[m,r.loss,'var(--orange)',7]],xmin:-6,xmax:6,ymin:0,ymax:6.5,xlabel:'m = 선호 비율 − 비선호 비율',ylabel:'DPO 손실',label:`β = ${beta}에서 m에 따른 DPO 손실. m = ${m}일 때 ${F(r.loss,3)}`});
  U.result(el,chart,`β·m = ${F(beta*m,2)} → 선호 답이 나을 확률 σ(β·m) = <b>${F(r.prob,3)}</b><br>손실 −log σ(β·m) = <b>${F(r.loss,3)}</b>${m===0?' (= ln 2, 정책과 기준이 같을 때)':''}<br>기울기 크기 β·σ(−β·m) = <b>${F(Math.abs(r.grad),4)}</b> · `+
   (m<0?'모델이 비선호 답을 더 좋아하는 쌍이라 기울기가 큽니다.':m>3/beta?'이미 잘 구분하는 쌍이라 기울기가 거의 0입니다.':'구분할수록 기울기가 줄어듭니다.')+`<br>점선은 다른 β의 곡선입니다. m을 직접 정해 DPO 식을 계산한 값이며, 실제 모델의 로그확률을 잰 것이 아닙니다.`);
 });
};

A11Labs.grpo=el=>{
 U.setup(el,R('gr-g','집단 크기 G (답 수)',2,64,2,16)+R('gr-p','정책의 정답률 p',0.05,0.95,0.05,0.3));
 U.bind(el,()=>{
  const G=U.value(el,'gr-g'),p=U.value(el,'gr-p'),g=M.grpoGroup(G,p,11),z=M.grpoZeroSignal(G,p),emp=M.grpoEmpirical(G,p,500);
  const curve=Array.from({length:32},(_,i)=>[2+2*i,M.grpoZeroSignal(2+2*i,p)]);
  const answers=`<div class="a11-chips" aria-label="뽑은 답 ${G}개의 보상과 이점">${g.rewards.map((r,i)=>`<span class="${r?'on':'off'}">${r?'맞음':'틀림'} ${g.sd?(g.adv[i]>=0?'+':'')+F(g.adv[i],2):'0'}</span>`).join('')}</div>`;
  const chart=U.plot({lines:[{data:curve}],points:[[G,z,'var(--orange)',7]],xmin:2,xmax:64,ymin:0,ymax:1,xlabel:'집단 크기 G',ylabel:'신호 없는 집단의 확률',label:`정답률 ${F(p,2)}에서 집단 크기에 따른 신호 없음 확률. G = ${G}일 때 ${F(z,3)}`})+answers;
  const right=g.rewards.filter(Boolean).length;
  U.result(el,chart,`이번 집단(시드 고정): 맞음 ${right}개 / ${G}개, 평균 ${F(g.mean,3)}, 표준편차 ${F(g.sd,3)}<br>`+
   (g.sd?`맞은 답의 이점 (1 − ${F(g.mean,2)}) ÷ ${F(g.sd,2)} = <b>${F((1-g.mean)/g.sd,2)}</b>, 틀린 답 <b>${F(-g.mean/g.sd,2)}</b>`:'<b>모든 답의 점수가 같아 이점이 모두 0입니다.</b> 이 질문에서는 배울 신호가 없습니다.')+
   `<br>신호 없는 집단의 확률 p<sup>G</sup> + (1 − p)<sup>G</sup> = <b>${F(z,3)}</b> · 실제로 500번 뽑아 센 비율 ${F(emp,3)}<br>규칙 채점(맞으면 1)을 고정 시드로 뽑은 실제 계산입니다.`);
 });
};

const TRUE=[1200,1100,1000,900],NAMES=['서재봇 v4','서재봇 v3','서재봇 v2','서재봇 v1'],COLORS=['var(--accent)','var(--blue)','var(--orange)','var(--muted)'];
A11Labs.elo=el=>{
 U.setup(el,R('elo-k','갱신 폭 K',4,64,4,16)+R('elo-games','경기 수',10,1000,10,200));
 U.bind(el,()=>{
  const K=U.value(el,'elo-k'),n=U.value(el,'elo-games'),r=M.eloRun(TRUE,K,n,7),step=Math.max(1,Math.floor(n/200));
  const idx=[];for(let i=0;i<=n;i+=step)idx.push(i);if(idx[idx.length-1]!==n)idx.push(n);
  const lines=TRUE.map((_,j)=>({data:idx.map(i=>[i,r.hist[i][j]]),color:COLORS[j]}));
  const all=r.hist.flat(),lo=Math.min(...all,900),hi=Math.max(...all,1200);
  const chart=U.plot({lines,xmin:0,xmax:n,ymin:Math.floor(lo/50)*50-50,ymax:Math.ceil(hi/50)*50+50,xlabel:'경기 수',ylabel:'ELO 점수',label:`K = ${K}, 경기 ${n}번 동안 서재봇 네 버전의 ELO 점수 변화`});
  const order=r.R.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]),ok=order.every((o,i)=>o[1]===i);
  U.result(el,chart,`최종 점수: ${order.map(([v,i])=>`<span style="color:${COLORS[i]}">■</span> ${NAMES[i]} <b>${F(v,0)}</b>`).join(' · ')}<br>실제 실력 순서(v4 > v3 > v2 > v1)와 ${ok?'<b>같습니다</b>':'<b>다릅니다</b>'}. 점수 합은 ${F(r.R.reduce((a,b)=>a+b,0),0)}로 보존됩니다.<br>v4가 v1을 이길 기대 확률: 실제 실력으로 ${F(M.eloExpected(TRUE[0],TRUE[3])*100,1)}%, 지금 점수로 ${F(M.eloExpected(r.R[0],r.R[3])*100,1)}%<br>승패는 실제 실력에서 고정 시드로 뽑은 시뮬레이션입니다.`);
 });
};
})();
