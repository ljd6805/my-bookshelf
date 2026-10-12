/* 1~2장 실험: 스펙트럼, 텐서 모양, 거리. 계산은 A02Math, 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=A02UI,M=A02Math,R=U.range,S=U.select,V=U.value,F=U.fmt;

A02Labs.spectrum=el=>{
 U.setup(el,R('sp-k','소음 주파수 k (64샘플당 주기 수)',4,40,0.5,12)+R('sp-a','소음 진폭',0,1.5,0.1,0.6)+S('sp-w','창 함수',[[0,'창 없음 (구간을 그대로 자름)'],[1,'한(Hann) 창 적용']],0));
 U.bind(el,()=>{
  const k=V(el,'sp-k'),a=V(el,'sp-a'),win=V(el,'sp-w')===1,x=M.synth([[3,1,0],[6,.5,0],[k,a,0]],64),amp=M.amplitudes(x,win),nl=M.noiseLeak(k,64,win),f=nl.fold;
  const wave=x.map((v,n)=>`${40+n*6.6},${70-v*22}`).join(' ');
  const bars=amp.map((v,i)=>{const h=Math.min(v,2)*55,on=v>.01;return `<rect x="${36+i*12.6}" y="${250-h}" width="9" height="${Math.max(h,1)}" fill="${i===3||i===6?'var(--accent)':on?'var(--orange)':'var(--line)'}"/>`;}).join('');
  const ticks=[0,8,16,24,32].map(i=>`<text x="${40+i*12.6}" y="270" text-anchor="middle">${i}</text>`).join('');
  const chart=U.svg(`<text x="8" y="16">시간 신호 (64샘플)</text><path d="M40 70H460" stroke="var(--line)"/><polyline points="${wave}" fill="none" stroke="var(--blue)" stroke-width="2"/><text x="8" y="146">DFT 진폭 |X[k]| (단측${win?', 한 창':''})</text><path d="M36 250H460" stroke="var(--line)"/>${bars}${ticks}`,`위는 64샘플 시간 신호, 아래는 k=0부터 32까지의 DFT 진폭 막대${win?'(한 창 적용)':''}. k=3과 6은 ‘켜’ 성분, 소음 k=${k}은 k=${f} 자리에 나타납니다.`);
  const top=amp.map((v,i)=>[v,i]).filter(p=>p[0]>.01).sort((p,q)=>q[0]-p[0]).slice(0,6).sort((p,q)=>p[1]-q[1]).map(([v,i])=>`k=${i}: <b>${F(v)}</b>`).join(', ');
  const lit=amp.filter(v=>v>.01).length;
  const alias=k>32?`<br>k=${k}은 64샘플로 나타낼 수 있는 가장 빠른 k=32(나이퀴스트)보다 빨라서 <b>k=${f}</b> 자리로 접혀 보입니다(에일리어싱). 막대만 보고는 원래 k가 ${f}인지 ${k}인지 가릴 수 없습니다.`:'';
  const near=[3,6].filter(c=>a>0&&Math.abs(f-c)<(win?2:1)),merged=near.length?`<br>소음이 ‘켜’의 k=${near.join('·')} 성분과 같은 자리(또는 ${win?'창이 넓힌 막대가 닿는 ':''}바로 옆)에 서서 두 성분이 섞였습니다. 이 경우 주파수만으로는 소음을 떼어 낼 수 없습니다.`:'';
  const leakTxt=a===0?'소음 진폭이 0이라 번질 에너지가 없습니다.':Number.isInteger(f)&&!win?`소음이 구간 안에서 정수 바퀴를 돌아 막대 하나에만 섭니다(두 칸 이상 번진 비율 ${F(nl.leak*100,2)}%).`:`소음 에너지 가운데 두 칸 이상 떨어진 막대로 번진 비율(누출)은 <strong>${F(nl.leak*100,2)}%</strong>입니다.${!win&&!Number.isInteger(f)?' 구간 끝에서 파동이 이어지지 않아 없는 주파수로 에너지가 번졌습니다. 한 창을 켜고 같은 k를 비교해 보세요.':''}${win?' 한 창은 구간 양 끝을 0으로 줄여 먼 누출을 낮추는 대신, 막대 하나가 양옆 한 칸씩 넓어집니다.':''}`;
  U.result(el,chart,`0.01보다 큰 막대 ${lit}개 · 큰 막대: ${top}<br>‘켜’ 성분: k=3 진폭 <b>${F(amp[3])}</b>(원래 1), k=6 진폭 <b>${F(amp[6])}</b>(원래 0.5)<br>${leakTxt}${alias}${merged}<br>시간 신호의 에너지는 ${F(M.energy(x))}입니다. N=64 DFT를 정의대로 실제 계산했고, 한 창은 창의 합으로 나누어 정수 k의 막대 높이를 맞췄습니다.`);
 });
};

A02Labs.shape=el=>{
 const bias=[['h','(H)'],['t1','(T, 1)'],['b11','(B, 1, 1)'],['t','(T)']];
 U.setup(el,R('sh-b','묶음 크기 B (소리 수)',1,32,1,8)+R('sh-t','시간 구간 T',10,100,10,50)+R('sh-h','층 폭 H',4,64,4,16)+S('sh-bias','편향의 모양',bias,'h'));
 U.bind(el,()=>{
  const B=V(el,'sh-b'),Tn=V(el,'sh-t'),H=V(el,'sh-h'),kind=U.text(el,'sh-bias'),p=M.pipeline(B,Tn,40,H);
  const shape={h:[H],t1:[Tn,1],b11:[B,1,1],t:[Tn]}[kind],out=M.broadcast([B,Tn,H],shape),fmt=s=>`(${s.join(', ')})`;
  const cards=U.cards(p.steps.map(s=>[fmt(s.shape),`${s.name} · 숫자 ${F(s.count,0)}개`]),1);
  const why={h:'층 폭 축마다 편향 하나씩, 의도한 계산입니다.',t1:'오류는 없지만 편향이 시간 구간마다 달라져, 층 폭 방향 편향이라는 의도와 다릅니다.',b11:'오류는 없지만 소리마다 같은 수를 더할 뿐이라 층 폭 방향 편향이 아닙니다.',t:'오른쪽 축 H와 T를 맞추는데 크기가 다르고 둘 다 1이 아니어서 계산할 수 없습니다.'}[kind];
  const bc=out?`편향 ${fmt(shape)} + 출력 ${fmt([B,Tn,H])} → <b>${fmt(out)}</b>. ${why}`:`편향 ${fmt(shape)} + 출력 ${fmt([B,Tn,H])} → <b>모양 오류</b>. ${why}`;
  U.result(el,cards,`매개변수: F·H + H + H·3 + 3 = 40·${H} + ${H} + ${H}·3 + 3 = <strong>${F(p.params,0)}개</strong> (묶음 크기와 무관)<br>곱셈-덧셈 횟수: B·T·F·H + B·H·3 = <b>${F(p.macs,0)}</b><br>${bc}<br>모양과 개수는 실제 계산이며, 층 구조는 설명을 위한 가상의 작은 모델입니다.`);
 });
};

A02Labs.distance=el=>{
 const metrics=[['l2','L2 (직선 거리)'],['l1','L1 (절댓값 합)'],['linf','L∞ (가장 큰 차이)'],['cos','코사인 거리']];
 U.setup(el,R('ds-scale','소리 크기 배율',0.2,3,0.1,1)+S('ds-metric','거리 재는 법',metrics,'l2'));
 U.bind(el,()=>{
  const s=V(el,'ds-scale'),m=U.text(el,'ds-metric'),q=[.8,.33,.12].map(v=>v*s),{ds,i}=M.nearest(q,m);
  const name=metrics.find(x=>x[0]===m)[1],ok=i===0;
  U.result(el,U.bars(M.COMMANDS.map((c,j)=>`${c}${j===i?' ◀':''}`),ds,'거리 (작을수록 가까움)',null,3),`‘켜’ 특징 = [0.80, 0.33, 0.12] × ${F(s,1)} = [${q.map(v=>F(v)).join(', ')}]<br>${name}: ${M.COMMANDS.map((c,j)=>`${c} ${F(ds[j],3)}`).join(' · ')}<br>가장 가까운 명령: <strong>${M.COMMANDS[i]}</strong> ${ok?'(맞음)':'(틀림: 작은 소리가 크기가 작은 기준 쪽으로 끌렸습니다)'}<br>기준 특징 세 개는 가상 값이고, 거리는 실제 계산입니다. 코사인 거리는 배율을 바꿔도 같은 값입니다.`);
 });
};
})();
