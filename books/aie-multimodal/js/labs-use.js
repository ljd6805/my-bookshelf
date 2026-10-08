/* 11~12장 실험: MaxSim과 한 벡터 점수, 색인 저장량, 에이전트 성공률. 계산은 A13Math, 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=A13UI,M=A13Math,R=U.range,S=U.select,V=U.value,F=U.fmt;

/* 4차원 장난감 벡터: [필터·배수, 오류 코드, 보증·약관, 그림·도식]. 쪽마다 패치 4개. */
const PAGES=[
 ['설치 안내 본문',[[0.7,0.2,0.1,0.1],[0.6,0.2,0.2,0.1],[0.5,0.3,0.1,0.1],[0.6,0.1,0.2,0.2]]],
 ['필터 그림 쪽',[[0.2,0.1,0.6,0.1],[0.8,0.1,0.35,0.1],[0.2,0.1,0.55,0.1],[0.6,0.05,0.05,0.95]]],
 ['오류 코드 표',[[0.4,0.9,0.1,0.1],[0.3,0.9,0.1,0.1],[0.2,0.6,0.2,0.1],[0.4,0.4,0.1,0.1]]],
 ['보증 안내',[[0.1,0.1,0.95,0.05],[0.15,0.2,0.9,0.1],[0.2,0.1,0.8,0.1],[0.2,0.3,0.6,0.1]]]
];
const QUERIES=[
 ['배수 필터 그림',[['배수',[0.9,0.1,0.05,0.1]],['필터',[0.95,0.1,0.05,0.2]],['그림',[0.1,0.05,0.05,0.95]]]],
 ['E-21 오류 뜻',[['E-21',[0.1,0.95,0.05,0.05]],['오류',[0.2,0.9,0.1,0.05]],['뜻',[0.3,0.4,0.3,0.1]]]],
 ['보증 기간',[['보증',[0.05,0.1,0.95,0.05]],['기간',[0.1,0.2,0.9,0.05]]]]
];
A13Labs.maxsim=el=>{
 U.setup(el,S('msq','질의',QUERIES.map((q,i)=>[i,q[0]]),0)+S('msmode','점수 방식',[['max','MaxSim (토큰별 최댓값의 합)'],['mean','평균 한 벡터 (코사인 하나)']],'max'));
 U.bind(el,()=>{const [qname,toks]=QUERIES[V(el,'msq')],mode=U.text(el,'msmode'),Q=toks.map(x=>x[1]);
  const scores=PAGES.map(([,P])=>mode==='max'?M.maxSim(Q,P).score:M.pooledScore(Q,P)),best=scores.indexOf(Math.max(...scores));
  const other=PAGES.map(([,P])=>mode==='max'?M.pooledScore(Q,P):M.maxSim(Q,P).score),otherBest=other.indexOf(Math.max(...other));
  const picks=M.maxSim(Q,PAGES[best][1]).picks;
  U.result(el,U.bars(PAGES.map(p=>p[0]),scores,mode==='max'?'MaxSim 점수':'코사인',null,3),
  `질의 “${qname}” (토큰 ${toks.length}개) · ${mode==='max'?'MaxSim':'평균 한 벡터'} 1등: <strong>${PAGES[best][0]}</strong> (${F(scores[best],3)})<br>${mode==='max'?`1등 쪽에서 토큰마다 고른 패치: ${toks.map((x,i)=>`${x[0]} → 패치 ${picks[i]+1}`).join(', ')}`:'쪽과 질의를 각각 평균 벡터 하나로 줄여 비교했습니다.'}<br>다른 방식(${mode==='max'?'평균 한 벡터':'MaxSim'})의 1등: ${PAGES[otherBest][0]}${otherBest===best?' (같음)':' (다름: 작은 그림 패치가 평균에 묻히는지 확인해 보세요)'}<br>벡터는 미리 정한 4차원 예시이고 코사인과 합은 실제 계산입니다.`);});
};

A13Labs.storage=el=>{
 U.setup(el,R('stpages','설명서 쪽 수',1,1000,1,48)+S('stvec','쪽당 패치 벡터 수',[[729,'729 (원본 레슨 계산 예)'],[1030,'1,030 (ColPali 논문)']],1030)+S('stbytes','값당 바이트',[[4,'4 (float32)'],[2,'2 (float16)'],[1,'1 (8비트 양자화)']],4));
 U.bind(el,()=>{const p=V(el,'stpages'),v=V(el,'stvec'),bt=V(el,'stbytes'),col=M.storage(p,v,128,bt),txt=M.storage(p,1,768,4);
  U.result(el,U.bars(['쪽 이미지 색인','텍스트 RAG (쪽당 벡터 1개)'],[col/1e6,txt/1e6],'MB',null,3),
  `쪽 이미지 색인: ${p}쪽 × ${F(v,0)}벡터 × 128차원 × ${bt}바이트 = <strong>${F(col/1e6,2)}MB</strong><br>텍스트 RAG: ${p}쪽 × 768차원 × 4바이트 = ${F(txt/1e3,1)}kB (쪽당 조각 하나로 가정)<br>비율 <b>${F(col/txt,0)}배</b>. 원본 레슨 계산 예(50쪽, 729벡터, float32)는 약 18.7MB 대 154kB입니다.<br>실제 계산이며, 곱 양자화 같은 압축 효과는 값당 바이트로만 근사했습니다.`);});
};

A13Labs.agentloop=el=>{
 U.setup(el,R('agp','한 단계 성공률 p',0.8,0.99,0.01,0.95)+R('agn','단계 수 n',1,40,1,20)+R('agd','실패 감지율 d (화면 검증)',0,1,0.05,0.8));
 U.bind(el,()=>{const p=V(el,'agp'),n=V(el,'agn'),d=V(el,'agd'),r=M.agentSuccess(p,n,d),xs=Array.from({length:40},(_,i)=>i+1);
  const chart=U.plot({lines:[{data:xs.map(k=>[k,M.agentSuccess(p,k,d).plain]),color:'var(--orange)',dashed:true},{data:xs.map(k=>[k,M.agentSuccess(p,k,d).retry]),color:'var(--accent)'}],points:[[n,r.plain,'var(--orange)',6],[n,r.retry,'var(--accent)',6]],xmin:1,xmax:40,ymin:0,ymax:1,xlabel:'단계 수 n',ylabel:'끝까지 성공할 확률',label:`p ${p}, n ${n}에서 그대로 ${F(r.plain,2)}, 검증 후 재시도 ${F(r.retry,2)}`});
  U.result(el,chart,
  `그대로: ${F(p,2)}^${n} = <strong>${F(r.plain,3)}</strong> (주황 점선)<br>검증 후 한 번 재시도: 단계 성공 ${F(p,2)} + (1 − ${F(p,2)}) × ${F(d,2)} × ${F(p,2)} = ${F(r.step,4)} → ${F(r.step,4)}^${n} = <strong>${F(r.retry,3)}</strong> (청록 실선)<br>단계 수를 반으로 줄이면 그대로도 ${F(p**Math.ceil(n/2),3)}입니다.<br>단계가 서로 독립이라는 가정의 실제 계산이며, 감지율과 재시도 한 번은 가정한 시나리오입니다.`);});
};
})();
