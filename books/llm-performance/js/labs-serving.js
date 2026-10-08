(()=>{const U=PUI,M=PMath,L=PLabs;
L.paging=el=>{
 U.setup(el,U.range('length','세 번째 요청의 KV 길이 (tokens)',1,2048,1,513)+U.select('block','블록당 토큰 자리',[[16,'16'],[64,'64'],[256,'256']],16));
 U.bind(el,()=>{const block=U.value(el,'block'),r=M.paging(U.value(el,'length'),block);
 U.result(el,U.bars(['사용 토큰','페이지 할당','최대 길이 예약'],[r.used,r.allocated,r.reserved],'토큰 자리')+U.table(['요청','길이','블록','빈 자리'],r.lengths.map((n,i)=>[i+1,n,r.pages[i],r.pages[i]*block-n])),`<b>${r.allocated}자리 할당 · ${r.waste}자리 비어 있음</b><br>Qwen3-8B의 16bit KV 구성으로 환산하면 ${U.fmt(r.miB,2)} MiB입니다. 사용한 ${r.used}토큰의 의미와 할당한 자리를 구분하세요. 블록 메타데이터·prefix 공유·여유 예약은 제외한 계산입니다.`);});
};
L.schedule=el=>{
 U.setup(el,U.range('slots','동시 실행 슬롯',1,4,1,2)+U.range('step','한 decode 단계 (ms)',5,30,5,10)+U.select('policy','빈자리 채우기',[[0,'같은 배치가 모두 끝난 뒤'],[1,'매 단계에서 새 요청 투입']],0));
 U.bind(el,()=>{const r=M.schedule(U.value(el,'slots'),U.value(el,'step'),Boolean(U.value(el,'policy')));
 U.result(el,U.timeline(r.events,['요청 1','요청 2','요청 3','요청 4'],r.total)+U.table(['요청','출력 수','완료 ms'],r.ends.map((v,i)=>[i+1,[2,6,3,5][i],v])),`<b>마지막 완료 ${r.total} ms · ${U.fmt(r.tps,2)} tokens/s</b><br>16개 추가 토큰을 모두 생성했습니다. 시간×슬롯 중 사용한 비율은 ${U.fmt(r.utilization*100,1)}%입니다. 단계 시간이 활성 요청 수와 무관하다는 가정이며 실제 GPU 사용률 지표는 아닙니다.`);});
};
L.parallel=el=>{
 U.setup(el,U.select('devices','GPU 수',[[1,'1개'],[2,'2개'],[4,'4개'],[8,'8개']],1)+U.range('payload','collective당 메시지 (MB)',.25,8,.25,.25)+U.range('link','가정한 링크 처리율 (GB/s)',25,200,25,50));
 U.bind(el,()=>{const r=M.parallel(U.value(el,'devices'),U.value(el,'payload'),U.value(el,'link'));
 U.result(el,U.bars(['직렬','분할 계산','통신','합계'],[r.serial,r.compute,r.communication,r.total],'ms'),`<b>전체 ${U.fmt(r.total)} ms · 1 GPU 대비 ${U.fmt(r.speedup)}배</b><br>직렬 2 ms, 계산 16/n ms, ring collective 64회 비용을 합쳤습니다. 실제 장비의 NCCL 알고리즘·겹침·경합을 재현하지 않습니다.`);});
};
L.decision=el=>{
 U.setup(el,U.select('variant','비교할 후보',M.trials.map((r,i)=>[i,r.name]),0)+U.range('ttft','p95 TTFT 목표 (ms 이하)',400,800,50,600)+U.range('itl','p95 ITL 목표 (ms 이하)',20,50,5,30)+U.range('capacity','최고 메모리 한도 (GiB)',16,32,1,24));
 U.bind(el,()=>{const r=M.decision(U.value(el,'variant'),U.value(el,'ttft'),U.value(el,'itl'),U.value(el,'capacity'));
 const labels=[`TTFT ${r.ttft} ms`,`ITL ${r.itl} ms`,`메모리 ${r.memory} GiB`,`품질 점검 ${r.passed}/20`];
 U.result(el,`<div class="metric-cards"><div><small>전체 출력 처리량</small><strong>${r.tps}</strong>tokens/s</div><div><small>후보 판정</small><strong>${r.accepted?'조건 충족':'보류'}</strong>${r.name}</div></div>${labels.map((v,i)=>`<div class="check-row"><span>${v}</span><b>${r.checks[i]?'통과':'미충족'}</b></div>`).join('')}`,
 `<b>${r.name}: ${r.accepted?'네 조건을 모두 만족합니다. 실제 반복 측정으로 확인하세요.':'만족하지 못한 조건을 해결한 뒤 다시 비교하세요.'}</b><br>미리 만든 가상 집계값을 조건과 비교한 결과입니다. 모델의 실제 성능이나 일반 품질을 보장하지 않습니다.`);});
};
})();
