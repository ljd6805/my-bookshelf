/* 1~6장 실험: 모델을 어디서, 어떤 형식으로, 어떤 엔진 설정으로 돌릴지. 계산은 모두 A18Math가 하고 여기서는 그리기만 한다. */
(()=>{
'use strict';
const U=A18UI,M=A18Math,L=A18Labs,pct=(x,d=1)=>U.fmt(x*100,d)+'%';

L.breakeven=el=>{
 U.setup(el,U.range('util','GPU 지속 사용률',0.05,1,0.01,0.68)+U.select('price','토큰 단가 ($/100만 토큰)',[[0.9,'$0.90'],[1.6,'$1.60'],[3,'$3.00']],1.6));
 U.bind(el,()=>{
  const u=U.value(el,'util'),p=U.value(el,'price'),r=M.breakeven(u,p),curve=[];
  for(let x=0.05;x<=1.0001;x+=0.05)curve.push([x,M.breakeven(x,p).dedicated]);
  const chart=U.plot({lines:[{data:curve},{data:[[0.05,p],[1,p]],color:'var(--blue)',dashed:true}],points:[[u,r.dedicated],[r.breakEvenU,p,'var(--blue)',4]],xmin:0,xmax:1,ymin:0,ymax:6,xlabel:'GPU 지속 사용률',ylabel:'$ / 100만 토큰',label:`사용률 ${pct(u,0)}에서 전용 GPU ${U.fmt(r.dedicated)}달러, 토큰 단가 ${U.fmt(p)}달러`});
  const win=r.cheaper==='dedicated'?'전용 GPU가 더 쌉니다':'토큰으로 사는 쪽이 더 쌉니다';
  U.result(el,chart,`<b>${win}</b> · 전용 GPU ${U.fmt(r.dedicated)}달러 대 토큰 ${U.fmt(p)}달러(100만 토큰당)<br>손익분기 사용률은 <b>${pct(r.breakEvenU)}</b>입니다. 이 사용률에서 한 달 처리량은 ${U.fmt(r.monthTokensM,0)}백만 토큰이고, 전용 GPU 한 대의 월 고정비는 ${U.fmt(r.monthDedicated,0)}달러입니다.<br>실제 계산입니다. GPU 시간당 4달러, 70B FP8 한 대 처리량 2,300 tok/s는 원본 레슨 범위에서 고른 교육용 가정이며, 운영 인력과 여유 용량 비용은 넣지 않았습니다.`);
 });
};

L.hbm=el=>{
 const fmts=Object.entries(M.FORMATS).map(([k,v])=>[k,`${v[0]} · ${v[1]}바이트/파라미터`]);
 U.setup(el,U.select('fmt','가중치 형식',fmts,'fp8')+U.select('kvb','KV 캐시 정밀도',[[2,'BF16 (2바이트)'],[1,'FP8 (1바이트)']],1)+U.range('conc','동시 대화 수 (각 2,048토큰)',1,160,1,8));
 U.bind(el,()=>{
  const f=U.text(el,'fmt'),kb=U.value(el,'kvb'),c=U.value(el,'conc'),r=M.hbmBudget(f,kb,c);
  const chart=`<p class="caption">점선은 HBM 80GB</p>`+U.bars(['가중치','활성값·작업 공간','KV 캐시','합계'],[r.weights,r.act,r.kv,r.total],'GB',80,1);
  const verdict=r.maxConc<0?`<b>가중치만으로 ${U.fmt(r.weights,0)}GB라서 80GB 한 장에 올라가지 않습니다.</b> 텐서 병렬로 여러 GPU에 나누어야 합니다.`:(r.fits?`<b>들어갑니다.</b> 합계 ${U.fmt(r.total,1)}GB, 남은 자리 ${U.fmt(r.hbm-r.total,1)}GB`:`<b>넘칩니다.</b> 합계 ${U.fmt(r.total,1)}GB가 80GB를 ${U.fmt(r.total-r.hbm,1)}GB 넘습니다`);
  const room=r.maxConc<0?'':`<br>이 설정에서 2,048토큰 대화를 최대 <b>${r.maxConc}개</b> 받을 수 있습니다. 대화 하나의 KV는 ${U.fmt(r.kvSeq,3)}GB입니다.`;
  U.result(el,chart,`${verdict}${room}<br>실제 계산입니다. KV = 2 × 80층 × KV 헤드 8 × 헤드 차원 128 × 바이트 × 토큰 수(Llama 3 70B 구조)이고, 활성값 5GB는 교육용 가정입니다. 페이지 단편화와 CUDA 그래프 메모리는 넣지 않았습니다.`);
 });
};

L.edge=el=>{
 U.setup(el,U.range('bw','메모리 대역폭 (GB/s)',50,3000,10,90)+U.select('model','모델 크기 (4비트 양자화)',[[3,'3B'],[8,'8B'],[70,'70B']],8));
 U.bind(el,()=>{
  const bw=U.value(el,'bw'),p=U.value(el,'model'),r=M.edgeCeiling(bw,p),sizes=[3,8,70],v=sizes.map(s=>M.edgeCeiling(bw,s).tokS);
  const chart=`<p class="caption">초당 토큰 상한</p>`+U.bars(sizes.map(s=>`${s}B${s===p?' (선택)':''}`),v,'tok/s',null,1);
  U.result(el,chart,`${p}B 모델을 4비트로 담으면 <b>${U.fmt(r.modelGB,1)}GB</b>이고, 대역폭 ${bw}GB/s에서 상한은 <b>초당 ${U.fmt(r.tokS,1)}토큰</b>(토큰당 ${U.fmt(r.msPerTok,1)}ms)입니다.<br>실제 계산이지만 상한입니다. 토큰마다 가중치를 한 번 모두 읽는다는 가정만 넣었고, 실제 기기는 발열·KV 읽기·커널 효율 때문에 이보다 느립니다.`);
 });
};

L.chunk=el=>{
 const sizes=[[0,'끔'],[256,'256'],[512,'512'],[1024,'1,024'],[2048,'2,048'],[4096,'4,096']];
 U.setup(el,U.select('chunkSize','조각 크기 (토큰)',sizes,512)+U.select('plen','긴 프롬프트 길이',[[4000,'4,000토큰'],[16000,'16,000토큰'],[32000,'32,000토큰']],32000));
 U.bind(el,()=>{
  const c=U.value(el,'chunkSize'),len=U.value(el,'plen'),r=M.chunkedPrefill(len,c),all=sizes.map(s=>M.chunkedPrefill(len,s[0]));
  const labels=sizes.map(s=>s[0]===c?`${s[1]} (선택)`:s[1]);
  const chart=`<p class="caption">이웃 손님이 토큰 하나를 기다리는 시간(ms, 점선은 TPOT 목표 25ms)</p>${U.bars(labels,all.map(x=>x.stall),'ms',25,1)}<p class="caption">긴 프롬프트의 첫 토큰 시간(ms)</p>${U.bars(labels,all.map(x=>x.ttft),'ms',null,0)}`;
  const tail=r.stall>25?'TPOT 목표 25ms를 넘으므로 이웃 손님의 스트리밍이 눈에 띄게 멈춥니다.':'TPOT 목표 25ms 안이라 이웃 손님은 끊김을 거의 느끼지 않습니다.';
  U.result(el,chart,`<b>${c?`조각 ${r.chunks}개`:'청크 프리필 끔'}</b> · 긴 프롬프트의 첫 토큰 ${U.fmt(r.ttft,0)}ms(프리필만 하면 ${U.fmt(r.prefillOnly,0)}ms) · 이웃의 한 반복 ${U.fmt(r.stall,1)}ms<br>${tail} 조각마다 디코드 한 번(7ms)이 끼어들기 때문에 조각을 잘게 할수록 긴 손님의 첫 토큰은 늦어집니다.<br>실제 계산입니다. 프리필 속도 초당 4만 토큰과 디코드 한 반복 7ms는 원본 레슨 04의 “32K 프롬프트 약 800ms”에 맞춘 교육용 가정입니다.`);
 });
};

L.goodput=el=>{
 U.setup(el,U.range('tpotSlo','TPOT 목표 (ms)',5,40,1,25)+U.select('chunked','청크 프리필',[['off','끔'],['on','켬']],'off'));
 U.bind(el,()=>{
  const t=U.value(el,'tpotSlo'),on=U.text(el,'chunked')==='on',slo={ttft:800,tpot:t,e2e:3000},r=M.goodput(slo,on);
  const chart=`<p class="caption">토큰 간격 TPOT, 점선은 목표 ${t}ms</p>`+U.bars(['평균','P50','P90','P99'],[r.meanTpot,r.p50,r.p90,r.p99],'ms',t,1);
  U.result(el,chart,`<b>goodput ${pct(r.goodput,2)}</b> · 요청 ${r.n.toLocaleString('en-US')}개 중 세 목표(TTFT 800ms, TPOT ${t}ms, 전체 3,000ms)를 모두 지킨 비율<br>평균 TPOT ${U.fmt(r.meanTpot,1)}ms, P99 ${U.fmt(r.p99,1)}ms. 목표를 어긴 요청 수: TTFT ${r.fail.ttft}개, TPOT ${r.fail.tpot}개, 전체 시간 ${r.fail.e2e}개(한 요청이 여러 목표를 함께 어길 수 있음).<br>미리 정한 시나리오입니다. 시드를 고정한 합성 분포에서 요청 5%가 긴 프롬프트와 겹쳐 느려진다고 가정했으며 실제 측정값이 아닙니다.`);
 });
};

L.spec=el=>{
 U.setup(el,U.range('alpha','수락률 α',0,0.95,0.05,0.7)+U.select('specK','초안 길이 K',[[1,'1'],[2,'2'],[3,'3'],[5,'5'],[8,'8']],5)+U.select('load','서버가 붐비는 정도',[['low','한가함'],['mid','보통'],['high','붐빔']],'mid'));
 U.bind(el,()=>{
  const a=U.value(el,'alpha'),K=U.value(el,'specK'),ld=U.text(el,'load'),r=M.specSpeedup(a,K,ld),curve=[];
  for(let x=0;x<=0.9501;x+=0.05)curve.push([x,M.specSpeedup(x,K,ld).speedup]);
  const ymax=Math.max(2,Math.ceil(Math.max(...curve.map(p=>p[1]))));
  const chart=U.plot({lines:[{data:curve},{data:[[0,1],[0.95,1]],color:'var(--blue)',dashed:true}],points:[[a,r.speedup]],xmin:0,xmax:0.95,ymin:0,ymax,xlabel:'수락률 α',ylabel:'속도 향상 배수',label:`α ${a}, K ${K}에서 속도 향상 ${U.fmt(r.speedup)}배`});
  const verdict=r.speedup>=1?`<b>${U.fmt(r.speedup)}배 빨라집니다.</b>`:`<b>오히려 ${U.fmt(1/r.speedup)}배 느려집니다.</b>`;
  U.result(el,chart,`${verdict} 검증 한 번에 기대 토큰 ${U.fmt(r.E,3)}개, 한 번의 상대 비용 ${U.fmt(r.cost,2)}<br>이 설정의 손익분기 수락률은 <b>α = ${U.fmt(r.breakEven,3)}</b>입니다. 흔히 쓰는 근사 1 + Kα(${U.fmt(r.naive,2)})는 거절된 뒤의 초안도 받아들인다고 세므로 기대값보다 큽니다.<br>기대 토큰 수는 실제 계산입니다. 초안 모델 비용(토큰당 0.05)과 붐빌 때 검증 비용(한가함 0.01·보통 0.06·붐빔 0.14)은 교육용 가정입니다.`);
 });
};

L.kvtransfer=el=>{
 U.setup(el,U.range('plen2','프롬프트 길이 (토큰)',256,32768,256,4096)+U.select('link','풀 사이 링크',Object.entries(M.LINKS).map(([k,v])=>[k,`${v[0]} · ${v[1]}GB/s`]),'rdma'));
 U.bind(el,()=>{
  const P=U.value(el,'plen2'),k=U.text(el,'link'),r=M.kvTransfer(P,k);
  const chart=U.bars(['프리필 계산','KV 전송','분리했을 때 첫 토큰'],[r.prefill,r.ms,r.ttftDis],'ms',null,1);
  const rule=r.shortRule?'<br>512토큰보다 짧은 프롬프트는 옮기는 수고가 아까우므로 원본 레슨 17의 규칙대로 같은 GPU에서 처리합니다.':'';
  U.result(el,chart,`KV ${U.fmt(r.mb,0)}MB를 보내는 데 <b>${U.fmt(r.ms,1)}ms</b>, 프리필 시간의 <b>${pct(r.ratio,0)}</b>입니다.${rule}<br>분리하면 첫 토큰이 ${U.fmt(r.ttftCo,1)}ms에서 ${U.fmt(r.ttftDis,1)}ms로 늦어지는 대신, 디코드 GPU는 긴 프리필에 끊기지 않습니다.<br>KV 크기는 실제 계산입니다(FP8 KV, 70B 구조). 링크 속도는 원본의 “4K 프롬프트 20~80ms”에 맞춘 교육용 가정입니다.`);
 });
};

L.router=el=>{
 U.setup(el,U.select('strategy','라우팅 방식',[['rr','라운드 로빈'],['aware','캐시를 아는 라우터']],'rr')+U.range('replicas','복제본 수',1,8,1,4)+U.select('order','프롬프트 순서',[['fixed','고정 부분이 앞'],['dynamic','날짜·사용자 ID가 앞']],'fixed'));
 U.bind(el,()=>{
  const s=U.text(el,'strategy'),n=U.value(el,'replicas'),o=U.text(el,'order'),r=M.routeSim(s,n,o),other=M.routeSim(s==='rr'?'aware':'rr',n,o);
  const chart=`<p class="caption">복제본마다 받은 요청 수(1,200개 중)</p>`+U.bars(r.load.map((_,i)=>`복제본 ${i+1}`),r.load,'건',null,0);
  U.result(el,chart,`<b>캐시 적중률 ${pct(r.hitRate)}</b> · 평균 TTFT ${U.fmt(r.meanTtft,0)}ms · P90 ${U.fmt(r.p90,0)}ms · 가장 바쁜 복제본 몫 ${pct(r.maxShare)}<br>같은 조건에서 ${s==='rr'?'캐시를 아는 라우터':'라운드 로빈'}의 적중률은 ${pct(other.hitRate)}입니다.<br>미리 정한 시나리오입니다. 고정 접두부 6종, 복제본마다 접두부 2개만 기억, 적중 80ms·실패 800ms로 단순화한 시뮬레이션입니다.`);
 });
};
})();
