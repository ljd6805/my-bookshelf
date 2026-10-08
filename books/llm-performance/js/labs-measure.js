(()=>{const U=PUI,M=PMath,L=PLabs;
L.metrics=el=>{
 U.setup(el,U.range('ttft','첫 토큰까지 (ms)',100,1000,50,400)+U.range('gap','일정한 토큰 간격 (ms)',5,50,5,20)+U.range('count','출력 토큰 수',1,64,1,32));
 U.bind(el,()=>{const r=M.metrics(U.value(el,'ttft'),U.value(el,'gap'),U.value(el,'count'));
 U.result(el,U.bars(['첫 토큰 대기','이후 생성','전체 시간'],[r.ttft,r.total-r.ttft,r.total],'ms'),`<b>전체 ${U.fmt(r.total,0)} ms</b> · 한 요청의 출력 처리율 ${U.fmt(r.tps)} tokens/s<br>TTFT ${r.ttft} ms, ITL ${r.gap===null?'정의되지 않음':r.gap+' ms'}. 일정한 간격을 가정한 계산입니다.`);});
};
L.timing=el=>{
 U.setup(el,U.range('count','제출하는 커널 수',1,40,1,20)+U.range('launch','커널당 CPU 제출 (ms)',.01,.2,.01,.02)+U.range('gpu','커널당 GPU 계산 (ms)',.1,4,.1,2));
 U.bind(el,()=>{const r=M.timing(U.value(el,'count'),U.value(el,'launch'),U.value(el,'gpu'));
 U.result(el,U.bars(['제출만 측정','GPU 구간','완료까지'],[r.enqueue,r.event,r.wall],'ms'),`CPU가 큐에 제출하는 구간은 <b>${U.fmt(r.enqueue)} ms</b>입니다. GPU 구간은 ${U.fmt(r.event)} ms, 첫 제출부터 완료까지는 ${U.fmt(r.wall)} ms입니다. 비동기 제출의 일정 비용 모형이며 실측값이 아닙니다.`);});
};
L.pipeline=el=>{
 U.setup(el,U.range('chunks','입력 묶음 수',1,6,1,4)+U.range('copy','묶음당 복사 (ms)',1,8,1,3)+U.range('compute','묶음당 계산 (ms)',1,12,1,6)+U.select('overlap','실행 방식',[[0,'직렬 실행'],[1,'복사·계산 겹침']],0));
 U.bind(el,()=>{const r=M.pipeline(U.value(el,'chunks'),U.value(el,'copy'),U.value(el,'compute'),Boolean(U.value(el,'overlap')));
 U.result(el,U.timeline(r.events,['복사','계산'],r.total)+U.table(['구간','시작 ms','끝 ms'],r.events.map(e=>[e.label,U.fmt(e.start,0),U.fmt(e.end,0)])),`<b>마지막 묶음 완료 ${r.total} ms</b> · 직렬 기준 ${r.serial} ms · ${U.fmt(r.serial/r.total)}배. 엔진 간 경합이 없는 교육용 시간표입니다. 표의 각 작업은 자신의 복사 완료 후에 계산을 시작합니다.`);});
};
L.roofline=el=>{
 U.setup(el,U.range('gb','해당 구간의 이동량 (GB)',.25,8,.25,4)+U.range('gflop','해당 구간의 연산량 (GFLOP)',16,1024,16,16)+U.range('elapsed','입력한 경과 시간 (ms)',1,100,1,10));
 U.bind(el,()=>{const r=M.roofline(U.value(el,'gb'),U.value(el,'gflop'),U.value(el,'elapsed'));
 U.result(el,U.bars(['메모리 하한','연산 하한','입력한 시간'],[r.memory,r.compute,U.value(el,'elapsed')],'ms'),`산술 집약도 ${U.fmt(r.intensity)} FLOP/byte · 계산한 처리율 ${U.fmt(r.gbps)} GB/s, ${U.fmt(r.tflops)} TFLOP/s.<br><b>${r.consistent?'모형 하한 이상입니다. 차이만으로 원인을 확정할 수 없습니다.':'가정 또는 측정 범위를 재확인하세요. 설정한 처리율 상한과 양립하지 않습니다.'}</b> 가상의 상한 500 GB/s·50 TFLOP/s를 사용합니다.`);});
};
})();
