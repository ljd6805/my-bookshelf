(()=>{
'use strict';
const U=GUI,M=GMath,R=U.range,S=U.select,V=U.value,F=U.fmt;
const bits=(v=4)=>S('bits','가중치 정밀도 (bit)',[[4,'4bit'],[8,'8bit'],[16,'16bit']],v);
const modelOptions=Object.entries(M.models).map(([k,m])=>[k,m.name]);
GLabs.cache=el=>{
 U.setup(el,R('tokens','저장한 문맥 토큰 수',1024,32768,1024,8192)+R('batch','독립 요청 수',1,8,1,1)+S('heads','KV head 수',[[4,'4'],[8,'8'],[32,'32']],8));
 U.bind(el,()=>{const t=V(el,'tokens'),b=V(el,'batch'),h=V(el,'heads'),kv=M.kvBytes({layers:32,headDim:128,kvHeads:h,tokens:t,batch:b});
 U.result(el,U.bars(['요청 하나','모든 요청'],[kv/b/M.GiB,kv/M.GiB]),`2 × 32층 × ${h} heads × 128 × ${t}토큰 × ${b}요청 × 2byte = <strong>${F(kv/M.GiB,3)} GiB</strong><br>가중치와 별도로 필요한 논리적 KV입니다. 가중치 정밀도를 바꾸는 실험과 독립적이며 KV는 16bit입니다.`);});
};
GLabs.roofline=el=>{
 U.setup(el,R('batch','한 단계의 배치 수 B',1,128,1,1)+R('bandwidth','유효 메모리 대역폭 (GB/s)',100,2000,100,500)+R('compute','유효 연산 처리량 (TFLOP/s)',10,200,10,50));
 U.bind(el,()=>{const r=M.roofline({batch:V(el,'batch'),bandwidth:V(el,'bandwidth'),compute:V(el,'compute')});
 U.result(el,U.bars(['가중치 이동','선형 연산','단계 하한'],[r.memory*1000,r.math*1000,r.seconds*1000],'ms'),
 `<strong>${r.bottleneck} 제한</strong> · 이상적 단계 시간 ≥ ${F(r.seconds*1000,3)} ms.<br>가중치 4 GB를 단계마다 한 번 읽는 가상 8B 4bit 모델. 전체 처리량의 모형 상한 ${F(r.tokensPerSecond,1)} tokens/s.<br>연산 집약도 ${F(r.intensity,1)} FLOP/byte. KV·Attention·중간값·실행 비용을 생략한 값입니다.`);});
};
GLabs.moe=el=>{
 U.setup(el,S('experts','전체 expert 수',[[8,'8'],[16,'16'],[32,'32'],[64,'64']],16)+S('chosen','토큰당 선택 expert 수',[[1,'1'],[2,'2'],[4,'4'],[8,'8']],2));
 U.bind(el,()=>{const r=M.moe(V(el,'experts'),V(el,'chosen'));
 U.result(el,U.bars(['전체 P','활성 P'],[r.total,r.active],'B'),`가상 모델: 공통 2B + expert당 0.5B.<br>전체 <strong>${r.total}B</strong>, 활성 <strong>${r.active}B</strong>.<br>모든 가중치의 4bit 저장량은 ${F(M.weightBytes(r.total,4)/M.GiB)} GiB입니다. 활성 수로 저장량을 계산하면 누락됩니다.`);});
};
GLabs.transfer=el=>{
 U.setup(el,R('gb','이번에 옮길 데이터 (GB)',0,16,1,4)+R('link','가정한 유효 전송 대역폭 (GB/s)',8,128,8,32));
 U.bind(el,()=>{const n=V(el,'gb'),bw=V(el,'link'),ms=M.transfer(n,bw)*1000;
 U.result(el,U.bars(['32 GB/s','선택한 링크','128 GB/s'],[M.transfer(n,32)*1000,ms,M.transfer(n,128)*1000],'ms'),`<strong>${n} GB / ${bw} GB/s = ${F(ms,2)} ms</strong>의 순수 전송 시간.<br>만약 같은 전송을 decode 단계마다 반복한다면 매번 이 비용을 고려해야 합니다. 실제 중첩·프로토콜·시작 지연·CPU 연산은 제외했습니다.`);});
};
GLabs.cards=el=>{
 U.setup(el,S('model','공식 모델 사례',modelOptions.filter(([k])=>k!=='toy'),'q8')+bits()+R('tokens','동일한 저장 문맥 길이',1024,32768,1024,8192));
 U.bind(el,()=>{const m=M.models[el.querySelector('#model').value],b=V(el,'bits'),t=V(el,'tokens'),w=M.weightBytes(m.params,b),k=M.kvBytes({...m,tokens:t});
 U.result(el,U.bars(['가중치','KV'],[w/M.GiB,k/M.GiB]),`<strong>${m.name}</strong> · 전체 약 ${m.params}B / 활성 약 ${m.active}B<br>${m.layers}층 × KV ${m.kvHeads} heads × 차원 ${m.headDim}.<br>가중치 근사 ${F(w/M.GiB,3)} GiB (${b}bit), KV ${F(k/M.GiB,3)} GiB (16bit, 요청 1개).<br>공식 카드·설정 확인일 2026-10-08. 부가정보와 실행 공간은 제외했습니다.`);});
};
GLabs.budget=el=>{
 U.setup(el,S('model','모델',modelOptions,'toy')+bits(16)+R('tokens','문맥 토큰 수',1024,32768,1024,32768)+R('batch','동시 독립 요청 수',1,8,1,4)+R('capacity','모델 실행에 할당할 용량 (GiB)',4,96,4,24)+R('reserve','실행 여유 가정 (GiB)',1,8,1,2)+R('extra','가중치 부가정보 가정 (%)',0,20,1,10));
 U.bind(el,()=>{const r=M.budget({model:el.querySelector('#model').value,bits:V(el,'bits'),tokens:V(el,'tokens'),batch:V(el,'batch'),capacity:V(el,'capacity'),reserve:V(el,'reserve'),overhead:V(el,'extra')/100});
 U.result(el,U.bars(['가중치','부가정보','KV','실행 여유','합계'],[r.weights,r.metadata,r.kv,r.workspace,r.total].map(x=>x/M.GiB), 'GiB',r.available/M.GiB),
 `<strong>${r.fits?'이 가정에서 용량 조건 만족':'이 가정에서 용량 초과'}</strong><br>합계 ${F(r.total/M.GiB,2)} / 가용 ${F(r.available/M.GiB,0)} GiB · ${r.fits?'남는 용량':'부족한 용량'} <b>${F(Math.abs(r.remaining)/M.GiB,2)} GiB</b>.<br>가중치 ${F(r.weights/M.GiB)} + 부가정보 ${F(r.metadata/M.GiB)} + KV ${F(r.kv/M.GiB)} + 여유 ${F(r.workspace/M.GiB)} GiB.<br>점선은 가용 용량입니다. 입력한 부가정보·여유는 실측이 아니며 실제 속도와 성공 여부는 별도 검증해야 합니다.`);});
};
})();
