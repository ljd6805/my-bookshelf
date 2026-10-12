/* 7~11장 실험: 로짓 렌즈, OV 회로, 유도 헤드 절제, MLP 뉴런, 활성 패칭. 계산은 TMath, 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=TUI,M=TMath,F=U.fmt,esc=U.esc;
const ANIMALS=['고양이','강아지','토끼','곰','펭귄','여우'];
TLabs.lens=el=>{
 U.setup(el,U.select('lp','문장',[['곰 먹이','사실 · 곰 먹이'],['목록 곰 꿀 숲 토끼 포도 곰 꿀','목록 · … 곰 꿀'],['3 4 5','세기 · 3 4 5'],['고양이 먹이 생선 . 펭귄 집','사실 둘째 · … 펭귄 집']],'곰 먹이'));
 U.bind(el,()=>{
  const text=el.querySelector('#lp').value,st=M.logitLens(text),final=st.at(-1).top[0].token,fi=M.index(final);
  const ids=M.tokenize(text).ids,r=M.run(ids),probs=r.stages.map(s=>M.softmax(M.unembed(s.x.at(-1)))[fi]);
  const table=`<table class="lens-table"><tr><th>단계</th><th>1위</th><th>2위</th><th>3위</th></tr>${st.map(s=>`<tr><td>${s.name}</td>${s.top.map(t=>`<td${t.token===final?' class="on"':''}>${esc(t.token)} <small>${F(t.p*100,0)}%</small></td>`).join('')}</tr>`).join('')}</table>`;
  const first=probs.findIndex(p=>p>.5);
  U.result(el,U.bars(st.map(s=>s.name),probs,{digits:3,max:1,mark:i=>i===st.length-1})+table,`마지막 답 “${esc(final)}”의 확률이 단계마다 어떻게 자라는지 봅니다. 처음으로 50%를 넘는 단계: <b>${first>=0?st[first].name:'없음'}</b>.<br>중간 단계의 잔차를 곧바로 최종 정규화와 출력 행렬에 통과시킨 값입니다(로짓 렌즈). 중간 단계는 그 출력층에 맞춰 학습되지 않았으므로 “그때의 생각”이 아니라 대략적인 엿보기입니다. 실제 계산.`);
 });
};
TLabs.ov=el=>{
 const heads=[['1.1','1층 헤드 1'],['1.3','1층 헤드 3'],['1.0','1층 헤드 0'],['1.2','1층 헤드 2'],['0.2','0층 헤드 2']];
 U.setup(el,U.select('oh','헤드',heads,'1.1')+U.select('ot','원천 낱말 (그 헤드가 보고 있는 칸의 낱말)',M.vocab().slice(5).map(t=>[t,t]),'곰'));
 U.bind(el,()=>{
  const [l,h]=el.querySelector('#oh').value.split('.').map(Number),t=el.querySelector('#ot').value,o=M.ovRow(l,h,t);
  const groups=[['동물',5,11],['먹이',11,17],['집',17,23],['숫자',23,32]],avg=groups.map(([g,a,b])=>{let s=0;for(let i=a;i<b;i++)s+=M.ovRow(l,h,M.vocab()[i]).rank;return [g,s/(b-a)];});
  const table=`<table class="cos-table"><caption>무리별 평균 자기 순위 (1이면 늘 자기 자신을 가장 밀어 올림)</caption><tr>${avg.map(a=>`<th>${a[0]}</th>`).join('')}</tr><tr>${avg.map(a=>`<td style="--o:${Math.max(0,(12-a[1])/11)}">${F(a[1],1)}</td>`).join('')}</tr></table>`;
  U.result(el,U.bars(o.top.map(x=>x.token),o.top.map(x=>x.v),{digits:2,mark:i=>o.top[i].token===t})+table,`${l}층 헤드 ${h}가 “${esc(t)}”${U.josa(t,'을','를')} 보고 옮기면 출력에서 가장 크게 밀어 올리는 낱말은 <b>${esc(o.top[0].token)}</b>이고, “${esc(t)}” 자신은 32개 중 <b>${o.rank}위</b>입니다.<br>${o.rank<=2?'보는 낱말을 그대로 베끼는 복사 헤드처럼 행동합니다.':'이 낱말은 그대로 베끼지 않습니다.'} 계산: 원천 낱말의 임베딩(위치 5) → 정규화 → W_V → W_O → 출력 행렬 U. 최종 정규화의 크기 조정은 뺀 근사입니다.`);
 });
};
const LISTS=[['곰 꿀 숲 토끼 포도 고양이 빙하','일곱 낱말 · 곰 꿀 숲 …'],['펭귄 생선 마당 여우 당근','다섯 낱말 · 펭귄 생선 …'],['동굴 새우 강아지 골목 뼈다귀 풀밭 곰 꿀 토끼','아홉 낱말 · 동굴 새우 …']];
TLabs.repeat=el=>{
 U.setup(el,U.select('rl','반복할 목록',LISTS,LISTS[0][0])+`<fieldset class="checks"><legend>지울 헤드 (출력을 0으로)</legend>${U.check('r02','0층 헤드 2 (바로 앞 칸을 보는 헤드)')}${U.check('r10','1층 헤드 0')}${U.check('r11','1층 헤드 1')}${U.check('r13','1층 헤드 3')}</fieldset>`);
 U.bind(el,()=>{
  const items=el.querySelector('#rl').value.split(' '),off=[['r02','0.2'],['r10','1.0'],['r11','1.1'],['r13','1.3']].filter(([id])=>el.querySelector('#'+id).checked).map(x=>x[1]);
  const r=M.repeatLoss(items,off),n=items.length,labels=r.tokens.slice(1).map((t,i)=>`${i+1} ${t}`);
  U.result(el,U.bars(labels,r.loss,{digits:2,max:7,mark:i=>i>=n+1}),`첫 목록 구간 평균 손실 <b>${F(r.first,2)}</b> nat, 반복 구간 평균 <b>${F(r.second,2)}</b> nat · 반복 구간에서 1위로 맞힌 토큰 ${r.correct}/${r.total}개.<br>막연히 찍으면 손실은 ln 18 ≈ 2.89(목록 낱말 18개 중 하나)입니다. ${off.length?`지운 헤드: ${off.join(', ')}.`:'아무것도 지우지 않았습니다. ✓ 표시가 반복 구간입니다.'} 실제 계산.`);
 });
};
TLabs.neurons=el=>{
 const opts=ANIMALS.flatMap(a=>['먹이','집'].map(r=>[`${a} ${r}`,`${a} ${r}`]));
 U.setup(el,U.select('np','사실 질문',opts,'곰 먹이')+U.range('nk','끌 뉴런 수 (효과가 큰 순서)',0,10,1,0));
 U.bind(el,()=>{
  const text=el.querySelector('#np').value,ans=M.predict(text).top[0].token,k=U.value(el,'nk'),ns=M.neurons(text,ans,1,10),kill=ns.slice(0,k).map(n=>`n1.${n.n}`),a=M.ablate(text,ans,kill);
  U.result(el,U.bars(ns.map(n=>`뉴런 ${n.n}`),ns.map(n=>n.effect),{digits:2,mark:i=>i<k}),`정답 “${esc(ans)}”에 직접 더하는 양이 큰 1층 MLP 뉴런 10개입니다(활성 × 출력 방향). ✓ 표시가 끈 뉴런입니다.<br>정답 확률 ${U.pct(a.before,1)} → <b>${U.pct(a.after,1)}</b>, 끈 뒤 1위: ${esc(a.top[0].token)}.<br>${k===1?'가장 센 뉴런 하나만 꺼도 답은 거의 그대로입니다. 사실은 여러 뉴런에 나뉘어 있습니다.':k>=5?'여러 개를 함께 꺼야 답이 무너집니다.':'뉴런을 하나씩 늘려 끄며 확률이 무너지는 지점을 찾아보세요.'} 실제 계산.`);
 });
};
const PAIRS=[['곰 먹이|토끼 먹이|꿀|당근','동물만 바꿈 · 곰 먹이 ↔ 토끼 먹이'],['곰 먹이|곰 집|꿀|동굴','관계만 바꿈 · 곰 먹이 ↔ 곰 집'],['목록 곰 꿀 숲 토끼 곰|목록 곰 숲 꿀 토끼 곰|꿀|숲','목록 순서 바꿈 · 곰 꿀 숲 ↔ 곰 숲 꿀'],['3 4 5|3 4 7|6|8','세기 · 3 4 5 ↔ 3 4 7']];
TLabs.patching=el=>{
 U.setup(el,U.select('pp','깨끗한 입력 ↔ 망가진 입력',PAIRS,PAIRS[0][0]));
 U.bind(el,()=>{
  const [c,x,g,b]=el.querySelector('#pp').value.split('|'),r=M.patching(c,x,g,b),best=r.rows.reduce((a,z)=>z.rate>a.rate?z:a);
  U.result(el,U.bars(r.rows.map(z=>z.label),r.rows.map(z=>z.rate),{digits:2,max:1,signed:true,mark:i=>r.rows[i]===best}),`깨끗한 입력 “${esc(c)}”의 로짓 차이(${esc(g)} − ${esc(b)}) ${F(r.clean,1)}, 망가진 입력 “${esc(x)}” ${F(r.corrupt,1)}.<br>부품 하나의 출력만 깨끗한 값으로 바꿔 끼웠을 때 가장 많이 되돌아온 부품: <b>${best.label}</b> ${U.pct(best.rate,0)}.<br>회복률 = (패치 후 차이 − 망가진 차이) ÷ (깨끗한 차이 − 망가진 차이). 여러 부품이 나눠 맡으면 하나씩은 다 못 돌려놓습니다. 실제 계산.`);
 });
};
})();
