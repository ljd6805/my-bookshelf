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
/* 12장 마지막 과제 계산서: 처방 하나를 바꾸고 네 부분의 숫자를 함께 본다. 계산은 A13Math.finalPlan. */
const FP_POOL=[[1,'없음 (27×27 = 729)'],[2,'2×2 (14×14 = 196)'],[3,'3×3 (9×9 = 81)'],[6,'6×6 (5×5 = 25)']];
A13Labs.finalplan=el=>{
 U.setup(el,S('fpfps','영상 FPS',[[0.5,'0.5'],[1,'1'],[2,'2'],[4,'4'],[8,'8']],1)+S('fppool','프레임 안 풀링',FP_POOL,3)+S('fpaudio','영상 읽는 방식',[[0,'6분 전체를 같은 FPS로'],[1,'소리로 사건 구간을 찾고 그 10초만 촘촘히']],0)
  +S('fpdoc','보증서 해상도 전략',[['square','336 정사각형 (576토큰)'],['native','원래 비율 · 1,280토큰 상한']],'square')+S('fpretr','설명서 검색',[['maxsim','쪽 이미지 + MaxSim'],['mean','텍스트 한 벡터']],'maxsim')+S('fpbytes','색인 값당 바이트',[[4,'4 (float32)'],[2,'2 (float16)'],[1,'1 (8비트)']],4)
  +R('fpp','한 단계 성공률 p',0.8,0.99,0.01,0.95)+R('fpn','예약 단계 수 n',1,40,1,20)+R('fpd','실패 감지율 d',0,1,0.05,0));
 U.bind(el,()=>{const o={fps:V(el,'fpfps'),pool:V(el,'fppool'),audio:V(el,'fpaudio')===1,doc:U.text(el,'fpdoc'),retr:U.text(el,'fpretr'),bytes:V(el,'fpbytes'),p:V(el,'fpp'),n:V(el,'fpn'),d:V(el,'fpd')};
  const r=M.finalPlan(o),A=M.FINAL,ok=b=>b?'통과':'부족',big=r.doc.h>=1000;
  const cards=U.cards([
   [`영상 · ${ok(r.fits&&r.catchP>=1)}`,`${F(r.tokens,0)}토큰 (예산의 ${F(r.share*100,1)}%) · 불꽃 포착 ${F(r.catchP,2)}`],
   [`보증서 · ${big?'읽을 만함':'작음'}`,`${r.doc.w}×${r.doc.h}px로 읽음 · ${F(r.doc.tokens,0)}토큰`],
   [`설명서 색인 · ${o.retr==='maxsim'?'그림 쪽 찾음':'그림 묻힘'}`,`${F(r.index/1e6,2)}MB`],
   [`예약 · ${ok(r.success>=0.7)}`,`단계 ${F(r.agent.step,3)} → ${o.n}단계 ${F(r.success,3)}`]]);
  U.result(el,U.bars(['영상 시각 토큰'],[r.tokens],'토큰 (점선 = 예산 32,768)',A.budget,0)+cards,
  `영상: ${o.audio?`전체 ${A.seconds}초를 ${A.scanFps} FPS로 훑고 소리로 찾은 ${A.window}초만 ${o.fps} FPS`:`${A.seconds}초 × ${o.fps} FPS`} × 프레임당 ${r.per}토큰 = <strong>${F(r.tokens,0)}토큰</strong>, ${r.fits?'예산 안':'예산 초과'}입니다. 0.3초 불꽃을 잡을 확률 min(1, 0.3 × ${o.fps}) = <b>${F(r.catchP,2)}</b>이고, 확실히 잡으려면 ${F(r.needFps,2)} FPS 이상이 필요합니다. 전체를 같은 FPS로 읽을 때 예산 안의 최대 FPS는 ${F(r.fpsMax,2)}입니다.<br>보증서: 3024×4032 사진을 ${r.doc.w}×${r.doc.h}로 줄여 읽습니다(원래의 ${F(r.doc.scale*100,1)}%).<br>설명서: ${A.pages}쪽 ${o.retr==='maxsim'?`× 1,030벡터 × 128차원 × ${o.bytes}바이트`:'× 768차원 × 4바이트'} = <b>${F(r.index/1e6,2)}MB</b>.<br>예약: p ${F(o.p,2)}, d ${F(o.d,2)}이면 ${o.n}단계 끝까지 <strong>${F(r.success,3)}</strong>입니다.<br>식은 6·5·11·12장의 실제 계산이고, 영상 길이·사진 크기·쪽 수·감지율과 소리로 구간을 정확히 찾는다는 점은 이 과제의 가정입니다.`);});
};
})();
