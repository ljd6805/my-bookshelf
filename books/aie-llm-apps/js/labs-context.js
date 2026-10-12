/* 4~6장 실험: 컨텍스트 창 예산, 벡터 저장소 크기, LoRA 학습량과 메모리. 계산은 A12Math. */
(()=>{
'use strict';
const U=A12UI,M=A12Math,F=U.fmt,R=U.range,S=U.select;
const STRATS=[['none','압축 없음'],['prune','도구 가지치기'],['summary','대화 요약'],['both','가지치기 + 요약']];

A12Labs.budget=el=>{
 U.setup(el,S('cb-window','창 크기',[['32000','32K'],['128000','128K'],['200000','200K']],'128000')+R('cb-tools','도구 수',0,60,5,50)+R('cb-turns','대화 턴 수',0,80,1,20)+R('cb-chunks','검색 청크 수',0,20,1,10)+S('cb-strategy','압축 전략',STRATS,'none'));
 U.bind(el,()=>{const r=M.contextBudget({window:Number(U.text(el,'cb-window')),tools:U.value(el,'cb-tools'),turns:U.value(el,'cb-turns'),chunks:U.value(el,'cb-chunks'),strategy:U.text(el,'cb-strategy')});
  const big=r.parts.slice().sort((a,b)=>b[1]-a[1])[0];
  U.result(el,U.bars([...r.parts.map(p=>p[0]),'합계'],[...r.parts.map(p=>p[1]),r.used],'토큰',null,0),
  `사용 <strong>${F(r.used,0)}토큰</strong> / 창 ${F(r.window,0)}토큰 = <b>${F(r.share*100,1)}%</b> · `+(r.over?`<b>${F(-r.free,0)}토큰 넘침</b>. 답변 예약 4,000토큰을 지키려면 줄여야 합니다.`:`남은 자리 ${F(r.free,0)}토큰`)+'<br>'+
  `가장 큰 몫은 <b>${big[0]}</b>(${F(big[1],0)}토큰)입니다. `+(big[0]==='도구 정의'?'질문 의도에 맞는 도구만 넣는 가지치기가 먼저입니다.':big[0]==='대화 기록'?'오래된 턴을 요약하면 가장 많이 줄어듭니다.':big[0]==='검색 근거'?'관련도가 낮은 청크를 버리세요. 3개의 좋은 근거가 10개의 애매한 근거보다 낫습니다.':'고정 항목이 가장 큽니다. 다른 항목은 이미 작습니다.')+'<br>'+
  '이 장의 단위 가정(도구 150, 턴 200, 청크 400토큰)으로 실제 계산한 예산입니다. 가운데 위치의 주의 저하처럼 품질은 계산하지 않습니다.');});
};

A12Labs.embedstore=el=>{
 U.setup(el,S('es-dims','임베딩 차원',[256,512,768,1024,1536,3072].map(d=>[d,String(d)]),1536)+S('es-prec','저장 정밀도',[['float32','float32 (차원당 4바이트)'],['binary','이진 양자화 (차원당 1비트)']],'float32')+R('es-n','문서 조각 수 (백만 개)',1,20,1,10));
 U.bind(el,()=>{const d=Number(U.text(el,'es-dims')),p=U.text(el,'es-prec'),n=U.value(el,'es-n'),r=M.vectorStore(d,p,n),f32=M.vectorStore(d,'float32',n),base=M.vectorStore(1536,'float32',n);
  U.result(el,U.bars(['지금 설정','같은 차원 float32','1536 · float32 기준'],[r.totalGB,f32.totalGB,base.totalGB],'GB',null,2),
  `벡터 하나 <b>${F(r.bytesPer,0)}바이트</b> × ${F(n,0)}백만 개 = <strong>${F(r.totalGB,2)} GB</strong> (1536 · float32 기준의 ${F(r.totalGB/base.totalGB*100,1)}%)<br>`+
  `전수 비교라면 질문 하나에 곱셈·덧셈 <b>${F(r.macs/1e8,0)}억 번</b>이 필요합니다. 실제 서비스는 HNSW 같은 근사 색인으로 이 비교를 크게 줄입니다.<br>`+
  (p==='binary'?'원본 레슨은 이진 양자화의 재현율 손실을 5~10%로 소개하고, 상위 1,000개를 원래 정밀도로 다시 채점하라고 권합니다.':d<1536?'원본 레슨은 Matryoshka 임베딩을 256차원으로 자를 때 표준 벤치마크 정확도 손실을 대략 3~5%로 소개합니다.':'차원을 줄이거나 양자화하면 저장과 계산이 함께 줄어듭니다.')+
  '<br>저장량과 계산량은 실제 계산이고, 정확도 손실은 계산하지 않고 원본 레슨의 대략값을 인용한 것입니다. 색인 자체의 메모리는 넣지 않았습니다.');});
};

A12Labs.lora=el=>{
 U.setup(el,S('lr-target','LoRA를 붙일 층',[['q','q만'],['qv','q · v'],['qkvo','q · k · v · o'],['all','모든 선형층 (어텐션 + MLP)']],'qv')+S('lr-rank','랭크 r',[1,2,4,8,16,32,64,128].map(r=>[r,String(r)]),16)+S('lr-method','학습 방식',[['full','전체 미세조정'],['lora','LoRA (fp16 기본 모델)'],['qlora','QLoRA (4비트 기본 모델)']],'lora'));
 U.bind(el,()=>{const tg=U.text(el,'lr-target'),r=Number(U.text(el,'lr-rank')),m=U.text(el,'lr-method'),x=M.lora(tg,r,m),one=M.loraMatrix(4096,4096,r);
  const all=['full','lora','qlora'].map(k=>M.lora(tg,r,k).memGB);
  U.result(el,U.bars(['전체 미세조정','LoRA','QLoRA'],all,'GB',null,2),
  `학습 파라미터 <strong>${F(x.trainable,0)}개</strong> = 전체 ${F(x.base,0)}개의 <b>${F(x.share*100,3)}%</b><br>`+
  `4096×4096 층 하나에 랭크 ${r}이면 ${F(one.lora,0)}개(원래 층의 ${F(one.share*100,2)}%)입니다.<br>`+
  `메모리 하한 <b>${F(x.memGB,2)} GB</b>`+(m==='full'?' (학습 파라미터마다 8바이트)':` (얼린 가중치 ${F(x.frozenGB,2)} GB + 어댑터 학습분 ${F(x.memGB-x.frozenGB,2)} GB)`)+'<br>'+
  (r>64?'원본 레슨은 랭크 64를 넘으면 품질 이득이 거의 없고 LoRA의 메모리 이점이 줄기 시작한다고 말합니다.':m==='full'?'전체 미세조정은 모든 가중치의 기울기와 Adam 상태까지 올려야 해서 메모리가 가장 큽니다.':'얼린 기본 모델이 메모리 대부분을 차지하므로, 랭크보다 기본 모델의 정밀도(fp16 대 4비트)가 메모리를 좌우합니다.')+
  '<br>Llama 2 7B 모양으로 실제 계산한 하한이며, 활성값과 프레임워크 부가 메모리는 넣지 않았습니다.');});
};
})();
