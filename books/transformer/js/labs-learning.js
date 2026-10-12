/* 12~14장 실험: 학습 체크포인트, 중첩 장난감 모형, 마지막 과제의 조사 도구. */
(()=>{
'use strict';
const U=TUI,M=TMath,F=U.fmt,esc=U.esc;
TLabs.timeline=el=>{
 const C=TCheckpoints,S=C.steps;
 U.setup(el,U.range('ts','체크포인트 (학습 단계)',0,S.length-1,1,8));
 U.bind(el,()=>{
  const i=U.value(el,'ts'),s=S[i];el.querySelector('#ts-value').textContent=`${s.step}단계`;
  const W=420,H=110,x=k=>20+k/(S.length-1)*(W-40),y=v=>12+(1-Math.min(v,4)/4)*(H-30);
  const line=S.map((z,k)=>`${k?'L':'M'}${x(k)} ${y(z.list_second)}`).join(''),line2=S.map((z,k)=>`${k?'L':'M'}${x(k)} ${y(z.list_first)}`).join('');
  const curve=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="반복 구간 손실이 400단계 무렵 급히 떨어지는 곡선"><path d="${line2}" fill="none" stroke="var(--muted)" stroke-dasharray="4 3" stroke-width="2"/><path d="${line}" fill="none" stroke="var(--accent)" stroke-width="3"/><path d="M${x(i)} 8V${H-14}" stroke="var(--orange)" stroke-width="2"/><text x="20" y="${H-2}" font-size="12">0단계</text><text x="${W-20}" y="${H-2}" font-size="12" text-anchor="end">${S.at(-1).step}단계</text></svg><p class="caption">가로축은 체크포인트 순서입니다. 실선: 반복 구간 손실 · 점선: 첫 목록 구간 손실 (위 = 4 nat)</p>`;
  const tok=C.probe.slice(0,14),cut=m=>m.slice(0,14).map((r,t)=>r.slice(0,14).map((v,k)=>k<=t?v:NaN));
  const maps=`<div class="two-maps"><div><b>0층 헤드 2</b>${U.heatmap(cut(s.map_prev),tok,tok,{caption:'0층 헤드 2 어텐션',showValues:false,hi:(a,b)=>b===a-1})}</div><div><b>1층 헤드 1</b>${U.heatmap(cut(s.map_ind),tok,tok,{caption:'1층 헤드 1 어텐션',showValues:false})}</div></div>`;
  U.result(el,curve+maps,`<b>${s.step}단계</b> · 반복 구간 손실 ${F(s.list_second,2)} nat(첫 구간 ${F(s.list_first,2)}) · 사실 정답률 ${U.pct(s.fact_acc,0)} · 세기 정답률 ${U.pct(s.count_acc,0)}<br>0층 헤드 2의 바로 앞 칸 점수 ${F(s.prev[0][2],2)}, 1층 헤드 1의 유도 점수 ${F(s.induction[1][1],2)}. 탐침 문장 앞 14토큰의 어텐션 표입니다. 학습 중 저장한 실제 값.`);
 });
};
TLabs.superpose=el=>{
 U.setup(el,U.select('sp','특징이 꺼져 있을 확률 (희소성)',[[0,'0 · 늘 켜짐'],[.5,'0.5'],[.8,'0.8'],[.9,'0.9'],[.95,'0.95 · 거의 꺼짐']],.95));
 U.bind(el,()=>{
  const sp=Number(el.querySelector('#sp').value),r=M.superposition(sp,{steps:8000}),c=150,k=95;
  const arrows=r.cols.map((v,i)=>{const on=r.lengths[i]>.5;return `<path d="M${c} ${c}L${c+v[0]*k} ${c-v[1]*k}" stroke="${on?'var(--accent)':'var(--muted)'}" stroke-width="${on?3.5:2}" ${on?'':'stroke-dasharray="4 3"'}/><text x="${c+v[0]*k*1.15}" y="${c-v[1]*k*1.15+4}" text-anchor="middle" font-size="14">f${i+1}</text>`;}).join('');
  const svg=`<svg viewBox="0 0 300 300" role="img" aria-label="특징 다섯 개의 방향을 2차원 평면에 그린 화살표. 실선은 담긴 특징"><circle cx="${c}" cy="${c}" r="${k}" fill="none" stroke="var(--line)" stroke-dasharray="3 4"/><path d="M${c-120} ${c}H${c+120}M${c} ${c-120}V${c+120}" stroke="var(--line)"/>${arrows}</svg>`;
  U.result(el,svg+U.bars(r.lengths.map((_,i)=>`f${i+1} (중요도 ${F(r.importance[i],2)})`),r.lengths,{digits:2,max:1.2,mark:i=>r.lengths[i]>.5}),`특징 5개를 2차원에 담는 작은 모형을 8,000번 학습했습니다. 길이가 0.5를 넘는 특징(담긴 특징): <b>${r.represented}개</b>.<br>${r.represented>2?'차원(2)보다 많은 특징을 서로 비스듬한 방향에 겹쳐 담았습니다. 이것이 중첩입니다. 대신 둘이 함께 켜지면 서로 간섭합니다.':'특징이 자주 함께 켜지면 겹쳐 담을 때 간섭이 커서, 중요한 특징 2개만 직교 방향에 담고 나머지는 버립니다.'}<br>토리가 아닌 별도의 장난감 모형이며, 학습은 브라우저에서 실제로 합니다(고정 씨앗).`);
 });
};
TLabs.investigate=el=>{
 const parts=[['0.0','0층 헤드 0'],['0.1','0층 헤드 1'],['0.2','0층 헤드 2'],['0.3','0층 헤드 3'],['mlp0','0층 MLP'],['1.0','1층 헤드 0'],['1.1','1층 헤드 1'],['1.2','1층 헤드 2'],['1.3','1층 헤드 3'],['mlp1','1층 MLP']];
 U.setup(el,U.text('ip','조사할 문장','3 4 5','세기·사실·목록 무엇이든 됩니다')+U.text('ia','기대하는 다음 낱말','6')+`<fieldset class="checks"><legend>지울 부품</legend>${parts.map(([k,l])=>U.check('i'+k.replace('.','-'),l)).join('')}</fieldset>`);
 U.bind(el,()=>{
  const text=el.querySelector('#ip').value,ans=el.querySelector('#ia').value.trim(),t=M.tokenize(text);
  if(t.unknown.length||M.index(ans)<0)return U.result(el,'',`<strong>사전에 없는 낱말</strong> · ${[...t.unknown,...(M.index(ans)<0?[ans||'(빈칸)']:[])].map(esc).join(', ')}. 토리가 아는 낱말 32개 안에서 써 주세요.`);
  const off=parts.map(p=>p[0]).filter(k=>el.querySelector('#i'+k.replace('.','-')).checked),a=M.ablate(text,ans,off);
  U.result(el,U.bars(a.top.map(x=>x.token),a.top.map(x=>x.p),{digits:3,max:1,mark:i=>a.top[i].token===ans}),`“${esc(ans)}”의 확률: 지우기 전 ${U.pct(a.before,1)} → 지운 뒤 <b>${U.pct(a.after,1)}</b> · 지운 부품: ${off.length?off.join(', '):'없음'}.<br>한 번에 하나씩 지워 보고, 그다음 여럿을 함께 지워 보세요. 하나씩은 별일 없는데 함께 지우면 무너진다면, 그 부품들은 같은 일을 나눠 맡은 것입니다. 실제 계산.`);
 });
};
})();
