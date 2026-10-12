/* 1~6장 실험: 다음 토큰, 임베딩 이웃, 부드러운 찾기, Q·K 점수, 인과 마스크, 헤드별 어텐션. 계산은 TMath, 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=TUI,M=TMath,F=U.fmt,esc=U.esc;
const cutMsg=()=>`<strong>문장이 너무 깁니다</strong> · 토리는 맨 앞 &lt;s&gt;를 포함해 ${M.dims().T}토큰까지만 읽습니다. 뒤쪽 낱말이 잘리면 다른 문장을 계산하게 되므로, 낱말을 ${M.dims().T-1}개 이하로 줄여 주세요.`;
const unknownMsg=t=>`<strong>사전에 없는 낱말</strong> · ${t.unknown.map(esc).join(', ')}. 토리는 낱말 32개만 압니다: 동물 6, 먹이 6, 집 6, 숫자 1~9, 기호(&lt;s&gt; . 목록 먹이 집). 낱말 사이는 띄어 씁니다.`;
const HEADS=[0,1].flatMap(l=>[0,1,2,3].map(h=>[`${l}.${h}`,`${l}층 헤드 ${h}`]));
const PRESETS=[['목록 곰 꿀 숲 토끼 포도 곰 꿀','목록 · 곰 꿀 숲 토끼 포도 곰 꿀'],['곰 먹이 꿀 . 토끼 집','사실 · 곰 먹이 꿀 . 토끼 집'],['3 4 5 6 7','세기 · 3 4 5 6 7']];
TLabs.next=el=>{
 U.setup(el,U.text('prompt','토리에게 줄 앞 문장 (띄어쓰기로 낱말 구분)','곰 먹이','예: 토끼 집 · 3 4 5 · 목록 곰 꿀 곰')+U.text('target','실제로 나올 다음 낱말 (손실 계산용)','꿀')+U.range('temp','온도 T (로짓 ÷ T)',.5,3,.1,1));
 U.bind(el,()=>{
  const p=M.predict(el.querySelector('#prompt').value,U.value(el,'temp'));
  if(p.unknown.length)return U.result(el,'',unknownMsg(p));
  if(p.cut)return U.result(el,'',cutMsg());
  const tgt=el.querySelector('#target').value.trim(),ti=M.index(tgt);
  const chart=U.chips(p.ids.map(i=>M.vocab()[i]))+U.bars(p.top.map(t=>t.token),p.top.map(t=>t.p),{mark:i=>p.top[i].token===tgt});
  const loss=ti>=0?`정답을 “${esc(tgt)}”${U.josa(tgt,'으로','로')} 보면 확률 ${U.pct(p.probs[ti],2)}, 교차 엔트로피 −ln p = <b>${F(M.crossEntropy(p.probs,ti),3)}</b> nat입니다.`:'정답 낱말 칸이 비었거나 사전에 없어 손실은 계산하지 않았습니다.';
  U.result(el,chart,`1위 <b>${esc(p.top[0].token)}</b> ${U.pct(p.top[0].p,1)} · 2위 ${esc(p.top[1].token)} ${U.pct(p.top[1].p,1)}<br>${loss}<br>토큰 ${p.ids.length}개를 넣었고 마지막 위치의 출력만 봅니다. 학습된 토리 가중치로 브라우저에서 실제로 계산했습니다.`);
 });
};
TLabs.similar=el=>{
 const opts=M.vocab().slice(5).map(t=>[t,t]);
 U.setup(el,U.select('tok','기준 낱말',opts,'곰'));
 U.bind(el,()=>{
  const t=el.querySelector('#tok').value,nb=M.neighbors(t,5),W=M.weights(),groups=[['동물',5,11],['먹이',11,17],['집',17,23],['숫자',23,32]];
  const mean=(a,b)=>{let s=0,c=0;for(let i=a[1];i<a[2];i++)for(let j=b[1];j<b[2];j++)if(i!==j){s+=M.cosine(W.E[i],W.E[j]);c++;}return s/c;};
  const table=`<table class="cos-table"><caption>무리끼리 평균 코사인(임베딩 E)</caption><tr><th></th>${groups.map(g=>`<th>${g[0]}</th>`).join('')}</tr>${groups.map(a=>`<tr><th>${a[0]}</th>${groups.map(b=>{const v=mean(a,b);return `<td style="--o:${Math.max(0,v)/.25}"${a===b?' class="diag"':''}>${F(v,2)}</td>`;}).join('')}</tr>`).join('')}</table>`;
  const g=M.groupOf(M.index(t)),same=nb.filter(n=>M.groupOf(M.index(n.token))===g).length;
  U.result(el,U.bars(nb.map(n=>`${n.token} · ${M.groupOf(M.index(n.token))}`),nb.map(n=>n.cos),{digits:2,max:1,mark:i=>M.groupOf(M.index(nb[i].token))===g})+table,`“${esc(t)}”(${g})와 가장 닮은 다섯 낱말 중 같은 무리는 <b>${same}개</b>입니다. 가장 가까운 이웃의 코사인도 ${F(nb[0].cos,2)}에 그칩니다.<br>표의 대각선(같은 무리끼리)이 다른 칸보다 조금 큽니다. 32차원 임베딩에 무리 구조가 약하게 들어 있다는 뜻입니다. 실제 계산.`);
 });
};
TLabs.softlookup=el=>{
 U.setup(el,U.range('angle','질문 방향 (도)',0,345,15,30)+U.range('sharp','질문 길이 (뾰족함)',.5,8,.5,2));
 U.bind(el,()=>{
  const r=M.softLookup(U.value(el,'angle'),U.value(el,'sharp')),best=r.reduce((a,b)=>a.weight>b.weight?a:b);
  const chart=U.bars(r.map(e=>`${e.key} → ${e.v}`),r.map(e=>e.weight),{digits:2,max:1,mark:i=>r[i]===best});
  U.result(el,chart,`가장 큰 가중치: <b>${esc(best.key)}</b> ${U.pct(best.weight,0)}. 출력은 값 넷을 이 비율로 섞은 것입니다.<br>${best.weight>.9?'질문이 길면(뾰족하면) 거의 한 칸만 꺼내는 보통 사전처럼 됩니다.':best.weight<.4?'질문이 짧거나 두 열쇠 사이를 가리키면 여러 값을 고르게 섞습니다.':'가장 가까운 열쇠가 많이 가져가지만 이웃 값도 섞입니다.'}<br>손으로 정한 2차원 교육용 모형입니다. 토리의 실제 벡터는 4장부터 씁니다.`);
 });
};
TLabs.qktrace=el=>{
 U.setup(el,U.select('qp','문장',PRESETS,PRESETS[0][0])+U.select('qh','헤드',HEADS,'1.1')+U.range('qpos','질문을 던지는 위치',1,9,1,9)+U.select('qd','점수 나누기',[['1','√8로 나눈다 (토리가 학습한 방식)'],['0','나누지 않는다']],'1'));
 U.bind(el,()=>{
  const text=el.querySelector('#qp').value,[l,h]=el.querySelector('#qh').value.split('.').map(Number),ids=M.tokenize(text).ids,input=el.querySelector('#qpos');
  input.max=ids.length-1;if(+input.value>ids.length-1)input.value=ids.length-1;el.querySelector('#qpos-value').textContent=input.value;
  const tr=M.attentionTrace(text,l,h,+input.value,el.querySelector('#qd').value==='1'),best=tr.weights.indexOf(Math.max(...tr.weights));
  const rows=tr.tokens.slice(0,tr.pos+1).map((t,s)=>`<tr${s===best?' class="on"':''}><td>${s} ${esc(t)}</td><td>${F(tr.raw[s],2)}</td><td>${F(tr.scores[s],2)}</td><td><i style="width:${tr.weights[s]*100}%"></i>${F(tr.weights[s],2)}</td></tr>`).join('');
  U.result(el,U.chips(tr.tokens,i=>i===tr.pos?'q':i===best?'k':i>tr.pos?'future':'')+`<table class="qk-table"><tr><th>열쇠 위치</th><th>q·k</th><th>점수</th><th>가중치</th></tr>${rows}</table>`,`위치 ${tr.pos} “${esc(tr.tokens[tr.pos])}”의 질문이 가장 많이 본 곳은 위치 ${best} “${esc(tr.tokens[best])}”(${U.pct(tr.weights[best],0)})입니다. 질문 벡터 길이 |q| = ${F(tr.qNorm,2)}.<br>${el.querySelector('#qd').value==='1'?'점수 = q·k ÷ √8. 토리는 이 나눗셈을 전제로 학습했습니다.':'나누지 않으면 점수 차이가 √8 ≈ 2.83배 커져 softmax가 한 칸에 더 몰립니다. 학습 때와 다른 계산이라 다음 토큰 예측도 달라질 수 있습니다.'} 실제 계산.`);
 });
};
TLabs.mask=el=>{
 const text='목록 곰 꿀 숲 토끼 포도 곰 꿀';
 U.setup(el,U.select('mh','헤드',HEADS,'1.1')+U.range('mpos','지금 위치',1,8,1,7)+U.select('mm','인과 마스크',[['on','켬 (과거만 본다)'],['off','끔 (미래도 본다)']],'on'));
 U.bind(el,()=>{
  const [l,h]=el.querySelector('#mh').value.split('.').map(Number),pos=U.value(el,'mpos'),on=el.querySelector('#mm').value==='on',r=M.maskCompare(text,l,h,pos),w=on?r.masked:r.open;
  const future=w.slice(pos+1).reduce((a,b)=>a+b,0);
  U.result(el,U.bars(r.tokens.map((t,i)=>`${i} ${t}${i>pos?' (미래)':''}`),w,{digits:2,max:1,mark:i=>i===pos+1}),`위치 ${pos} “${esc(r.tokens[pos])}”에서 미래 칸(${pos+1}~${r.tokens.length-1})이 받는 가중치 합: <b>${U.pct(future,1)}</b>. ✓ 표시는 바로 다음 칸, 곧 맞혀야 할 정답이 있는 자리입니다.<br>${on?'마스크가 미래 점수를 −∞로 바꾸어 softmax 뒤 0이 됩니다.':'마스크를 끄면 학습 때는 가려졌던 미래를 보게 됩니다. 학습 중이라면 정답을 엿보는 셈이고, 생성할 때는 아직 없는 토큰이라 볼 수도 없습니다.'} 같은 점수표에서 마스크만 바꾼 실제 계산.`);
 });
};
TLabs.heads=el=>{
 U.setup(el,U.select('hp','문장',PRESETS,PRESETS[0][0])+U.select('hh','헤드',HEADS,'0.2'));
 U.bind(el,()=>{
  const text=el.querySelector('#hp').value,[l,h]=el.querySelector('#hh').value.split('.').map(Number),ids=M.tokenize(text).ids,r=M.run(ids),A=r.attn[l][h],tok=ids.map(i=>M.vocab()[i]);
  const mat=A.map((row,t)=>row.map((v,s)=>s<=t?v:NaN)),prev=A.slice(1).reduce((s,row,t)=>s+row[t],0)/(A.length-1);
  const firstRep=tok.indexOf(tok[2],3),n=firstRep>0?firstRep-2:0;
  let ind=0;if(n)for(let t=2+n;t<tok.length;t++)ind+=A[t][t-n+1];ind=n?ind/(tok.length-2-n):0;
  const sink=A.slice(1).reduce((s,row)=>s+row[0],0)/(A.length-1);
  U.result(el,U.heatmap(mat,tok.map((t,i)=>`${i} ${t}`),tok,{caption:`${l}층 헤드 ${h}의 어텐션 표. 행은 지금 위치, 열은 보는 위치`,hi:(i,j)=>j===i-1}),`<b>${l}층 헤드 ${h}</b> · 바로 앞 칸(주황 테두리)에 주는 평균 가중치 ${U.pct(prev,0)}, 첫 칸 &lt;s&gt;에 주는 평균 ${U.pct(sink,0)}${n?` · 반복 구간에서 “앞선 같은 낱말의 다음 칸”에 주는 평균 ${U.pct(ind,0)}`:''}.<br>행마다 합이 1이고, 빈칸은 마스크로 가려진 미래입니다. 실제 계산.`);
 });
};
})();
