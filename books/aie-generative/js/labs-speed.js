/* 9~12장 실험: 플로 매칭 단계 수, VAR 척도, FID, 마지막 과제 판정. 계산은 A09Math에서 한다. */
(()=>{
'use strict';
const U=A09UI,M=A09Math,R=U.range,S=U.select,F=U.fmt;
const pct=x=>F(x*100,0)+'%';
A09Labs.flowsteps=el=>{
 U.setup(el,S('fpath','경로',[['independent','독립 짝짓기 (첫 플로 모델)'],['rectified','재흐름 후 (곧게 편 경로)']],'independent')+R('fsteps','오일러 단계 수',1,20,1,4));
 U.bind(el,()=>{const p=U.text(el,'fpath'),n=U.value(el,'fsteps'),r=M.flow(n,p);
  U.result(el,U.hist(r.bins,{marks:[[-2,'낮'],[2,'밤']],label:`${n}단계 오일러로 뽑은 샘플 200개의 분포`}),`${p==='rectified'?'재흐름으로 곧게 편 경로':'독립 짝짓기로 배운 평균 속도장'}, 오일러 <b>${n}</b>단계<br>400단계 기준 도착점과의 평균 거리 <strong>${F(r.err,3)}</strong>, 장면에 닿은 비율 <b>${pct(r.scene)}</b>, 흐릿한 중간 ${pct(r.blur)}<br>경로의 곧음(출발–도착 직선 거리 ÷ 실제 경로 길이) <b>${F(r.straight,3)}</b>. ${p==='rectified'?'곧은 길이라 한 걸음으로도 같은 곳에 도착합니다(학습이 완벽하다는 가정).':n<=2?'휜 길을 큰 걸음으로 걸어 평균 쪽으로 떨어집니다.':'걸음을 나눌수록 휜 길을 따라갑니다.'}<br>정확한 주변 속도장 E[x₁ − x₀ | x_t]로 한 실제 계산입니다.`);});
};
A09Labs.scales=el=>{
 U.setup(el,R('kscale','사용한 척도 수 K',1,5,1,2));
 U.bind(el,()=>{const k=U.value(el,'kscale'),r=M.varScales(k),xs=r.row.map((_,i)=>i);
  const step=a=>a.flatMap((v,i)=>[[i,v],[i+1,v]]);
  const chart=U.plot({lines:[{data:step(r.row),color:'var(--muted)',dashed:true},{data:step(r.approx)}],xmin:0,xmax:16,ymin:0,ymax:1,xlabel:'그림 한 줄의 칸 (16칸)',ylabel:'밝기',label:`척도 ${k}개로 쌓은 근사(실선)와 원래 밝기(점선)`});
  const sizes=Array.from({length:k},(_,s)=>2**s).join(' · ');
  U.result(el,chart,`척도 <b>${k}</b>개 (블록 ${sizes}칸) → 평균 제곱 오차 <strong>${F(r.mse,4)}</strong>${k>1?` (척도 1개일 때 ${F(r.errs[0],4)})`:''}<br>각 척도는 앞 척도들이 남긴 잔차의 블록 평균만 더합니다. 2차원 16×16 격자로 옮기면 토큰 <b>${r.tokens2d}</b>개를 패스 <b>${r.passes}</b>번에 냅니다. 래스터 자기회귀라면 패스 ${r.raster}번입니다.<br>코드북 양자화를 뺀 잔차 다중 척도 분해로 한 실제 계산이며, 밝기 값은 교육용 예입니다.`);});
};
A09Labs.fid=el=>{
 U.setup(el,R('fshift','생성 특징의 평균 이동',0,2,0.1,0)+R('fsigma','생성 특징의 표준편차 σ (다양성)',0.2,1.5,0.05,1)+S('fn','표본 수 N (진짜·생성 각각)',[[50,'50장'],[200,'200장'],[1000,'1,000장'],[10000,'10,000장']],1000));
 U.bind(el,()=>{const sh=U.value(el,'fshift'),sg=U.value(el,'fsigma'),n=U.value(el,'fn'),r=M.fidLab(sh,sg,n);
  const chart=U.scatter(r.real,{xmin:-4,xmax:5,ymin:-4,ymax:4,color:'var(--blue)',extra:[[r.gen,'var(--orange)']],label:`진짜 특징(파랑)과 생성 특징(주황) 각 150개. 정확한 FID ${F(r.exact,3)}`});
  U.result(el,chart,`정확한 FID = 이동² + 2(1 − σ)² = ${F(sh,1)}² + 2(1 − ${F(sg,2)})² = <b>${F(r.exact,3)}</b><br>표본 ${n.toLocaleString('ko-KR')}장씩, 시드 5개로 추정한 FID: 평균 <strong>${F(r.est,3)}</strong>, 범위 ${F(r.min,3)} ~ ${F(r.max,3)} (치우침 ${r.bias>=0?'+':''}${F(r.bias,3)})<br>${n<=200?'표본이 적어 같은 모델도 시드에 따라 값이 크게 흔들립니다.':'표본이 많아 추정이 참값에 가깝습니다.'} ${sg<0.8?'다양성이 줄면(σ < 1) 평균이 맞아도 FID가 커집니다.':''}<br>2차원 가우스 특징으로 한 실제 계산입니다. 실제 FID는 2048차원이라 같은 N에서 흔들림이 훨씬 큽니다.`);});
};
const SYM={blur:'일부 샘플이 낮도 밤도 아닌 흐릿한 회색 그림이다',samey:'“밤의 도토리”가 거의 같은 그림만 나오고 색이 번들거린다',slow:'한 장에 15초가 걸린다',fid:'새 버전의 FID가 좋아졌다(표본 500장, 한 번 측정)'};
const ACT={steps:'샘플링 단계 수를 늘린다',cfg:'가이던스 w를 3~7로 낮춘다',psi:'절단 ψ를 바꾼다',distill:'증류된 플로 모델(1~4단계)로 바꾼다',moreN:'표본 1만 장·시드 3개로 다시 잰다'};
const VERDICT={good:'원인을 겨냥한 조치',partial:'일부만 맞는 조치',wrong:'원인을 겨냥하지 못한 조치'};
A09Labs.triage=el=>{
 U.setup(el,S('symptom','들어온 보고',Object.entries(SYM),'blur')+S('action','바꿀 손잡이 하나',Object.entries(ACT),'steps'));
 U.bind(el,()=>{const s=U.text(el,'symptom'),a=U.text(el,'action'),r=M.triage(s,a);
  const keys=Object.keys(ACT),order=keys.map(k=>[ACT[k],k===a?'지금 고른 손잡이':M.TRIAGE[s][k][0]==='good'?'원인을 겨냥':'다른 손잡이']);
  U.result(el,U.cards(order,keys.indexOf(a)),`보고: <b>${SYM[s]}</b><br>고른 손잡이: <b>${ACT[a]}</b> → 판정 <strong>${VERDICT[r.verdict]}</strong><br>이유: ${r.why}<br>더 필요한 증거: ${r.need}${r.verdict!=='good'?`<br>이 보고에서 먼저 확인할 손잡이: <b>${ACT[r.best]}</b>`:''}<br>이 책의 장 내용을 바탕으로 미리 정한 시나리오 판정입니다.`);});
};
})();
