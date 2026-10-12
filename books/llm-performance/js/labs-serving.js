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
L.tail=el=>{
 U.setup(el,U.range('rate','도착률 λ (요청/s)',.5,6,.1,2)+U.range('service','요청 하나의 처리 시간 S (ms)',200,2000,100,1000)+U.range('servers','동시 실행 슬롯 c (개)',1,8,1,4)+U.select('spread','처리 시간 흔들림',[[0,'없음: 모두 S'],[1,'S의 0.5~1.5배 균등'],[2,'지수 분포: 평균 S']],1));
 U.bind(el,()=>{const rate=U.value(el,'rate'),S=U.value(el,'service'),c=U.value(el,'servers'),spread=U.value(el,'spread'),r=M.queue(rate,S,c,spread),sweep=M.tailSweep(S,c,spread),f0=n=>U.fmt(n,0);
 const cards=`<div class="metric-cards"><div><small>사용률 ρ = λ·S/c</small><strong>${U.fmt(r.rho,2)}</strong>${U.fmt(rate,1)} × ${U.fmt(S/1000,1)} s ÷ ${c}</div><div><small>대기열 상태</small><strong>${r.stable?'안정':'불안정'}</strong>${r.stable?'ρ < 1':'ρ ≥ 1 · 끝없이 길어짐'}</div></div>`;
 const table=U.table(['사용률 ρ','도착률 (요청/s)','평균 대기 ms','p50 ms','p95 ms'],sweep.map(x=>[U.fmt(x.rho,1),U.fmt(x.rate,2),f0(x.mean),f0(x.p50),f0(x.p95)]));
 if(!r.stable){
  U.result(el,cards+U.bars(['처음 1/4 평균 대기','마지막 1/4 평균 대기'],[r.early/1000,r.late/1000],'s')+table,
  `<b>ρ = ${U.fmt(r.rho,2)} ≥ 1 · 불안정: 대기열이 끝없이 길어집니다</b><br>들어오는 일의 양 λ × S = ${U.fmt(rate*S/1000,2)}은 슬롯 몇 개가 쉬지 않고 일해야 따라잡는지를 뜻하는데, ${rate*S/1000>c+1e-9?`슬롯은 ${c}개뿐입니다.`:`슬롯 ${c}개가 한순간도 쉬지 않아야 겨우 맞먹으므로 무작위로 몰린 요청을 따라잡을 여유가 없습니다.`} 처음 1/4 요청의 평균 대기는 ${U.fmt(r.early/1000,1)} s, 마지막 1/4은 ${U.fmt(r.late/1000,1)} s로 계속 커지므로, 이 상태의 평균·p95는 시뮬레이션을 얼마나 길게 돌렸는지에 따라 달라질 뿐 의미가 없습니다. 도착률을 낮추거나 슬롯을 늘리거나 처리 시간을 줄여 ρ를 1 아래로 내리세요. 아래 표는 같은 S·슬롯에서 ρ만 0.5·0.7·0.9로 둔 비교입니다.`);
  return;
 }
 const h=M.histogram(r.waits,8),top=Math.max(h.zero,...h.counts,1),col=(n,i)=>{const H=n/top*170,X=40+i*48;return `<rect x="${X}" y="${215-H}" width="40" height="${Math.max(H,n?1:0)}" rx="3" fill="${i?'var(--blue)':'var(--accent)'}"/>`;};
 const at=w=>Math.min(472,88+Math.min(w,h.upper)/h.width*48),mark=(w,label,y,dash)=>`<path d="M${at(w)} ${y+6}V218" stroke="var(--orange)" stroke-width="2" ${dash?'stroke-dasharray="5 4"':''}/><text x="${Math.min(at(w)+4,410)}" y="${y+4}">${label}</text>`;
 const svg=U.svg(`${[h.zero,...h.counts].map(col).join('')}${mark(r.mean,'평균 '+f0(r.mean),20,false)}${mark(r.p95,'p95 '+f0(r.p95),44,true)}<text x="60" y="238" text-anchor="middle">0</text><text x="280" y="238" text-anchor="middle">${f0(h.upper/2)}</text><text x="472" y="238" text-anchor="end">${f0(h.upper)}+</text><text x="12" y="268">대기 ms별 요청 수 · 첫 막대는 기다리지 않은 요청</text>`,
  `대기 시간 막대. 기다리지 않은 요청 ${h.zero}개, 이후 ${f0(h.width)} ms 폭 칸마다 ${h.counts.join(', ')}개. 마지막 칸은 ${f0(h.upper-h.width)} ms 이상. 평균 ${f0(r.mean)} ms(실선), p95 ${f0(r.p95)} ms(점선).`);
 const base=sweep[0],dm=r.mean-base.mean,dp=r.p95-base.p95;
 const trend=r.rho>.55&&dm>1?`같은 S·슬롯에서 ρ 0.5일 때와 비교하면 평균 대기는 ${f0(base.mean)} → ${f0(r.mean)} ms로 ${f0(dm)} ms 늘었고, p95는 ${f0(base.p95)} → ${f0(r.p95)} ms로 ${f0(dp)} ms 늘었습니다. ${dp>dm?`꼬리가 평균보다 ${U.fmt(dp/dm,1)}배 많이 늘었습니다.`:'이 조건에서는 평균과 꼬리가 비슷하게 늘었습니다.'}`:r.p95<1e-9?`요청의 95% 이상이 도착하자마자 슬롯을 얻어 p95 대기가 0 ms입니다. 기다린 요청은 ${U.fmt(r.waited*100,1)}%입니다.`:`기다린 요청은 ${U.fmt(r.waited*100,1)}%이고 나머지는 도착하자마자 슬롯을 얻었습니다. 평균은 작아도 기다린 요청의 몫이 p95를 만듭니다.`;
 U.result(el,cards+svg+table,`<b>ρ = ${U.fmt(r.rho,2)} · 평균 대기 ${f0(r.mean)} ms · p95 대기 ${f0(r.p95)} ms</b><br>${trend} 첫 토큰 계산 ${r.prefill} ms를 더하면 TTFT는 평균 ${f0(r.mean+r.prefill)} ms, p50 ${f0(r.p50+r.prefill)} ms, p95 ${f0(r.p95+r.prefill)} ms입니다.<br>리틀의 법칙 L = λW로 검산하면, 대기 중인 요청 수를 시간으로 평균한 값은 ${U.fmt(r.queued,3)}개이고 관측 도착률 ${U.fmt(r.observed,3)}/s × 평균 대기 ${U.fmt(r.mean/1000,3)} s도 ${U.fmt(r.littleQueued,3)}개입니다. 처리 중인 요청까지 세면 ${U.fmt(r.inSystem,2)}개입니다.<br>고정 시드(20261012)로 요청 ${U.fmt(r.count,0)}개를 만든 미리 정한 시나리오의 시뮬레이션입니다. 도착은 무작위(포아송)이고 먼저 온 순서대로 빈 슬롯에 들어갑니다. 배치 크기에 따른 단계 시간 변화와 prefill 간섭은 넣지 않았으며 실측이 아닙니다.`);});
};
L.speculate=el=>{
 U.setup(el,U.range('alpha','초안 토큰 수락률 α',.5,.95,.05,.8)+U.range('gamma','한 번에 제안하는 토큰 γ (개)',1,8,1,4)+U.range('cost','초안 한 번의 비용 c (큰 모델 한 단계 = 1)',0,.5,.05,.05));
 U.bind(el,()=>{const a=U.value(el,'alpha'),g=U.value(el,'gamma'),c=U.value(el,'cost'),r=M.speculative(a,g,c),top=Math.max(...r.curve.map(x=>x.speedup),1);
 const cols=r.curve.map((x,i)=>{const h=x.speedup/top*170,X=40+i*54;return `<rect x="${X}" y="${215-h}" width="38" height="${h}" rx="3" fill="${x.gamma===g?'var(--accent)':'var(--blue)'}" opacity="${x.gamma===g?1:.55}"/><text x="${X+19}" y="${208-h}" text-anchor="middle">${U.fmt(x.speedup,2)}</text><text x="${X+19}" y="236" text-anchor="middle">γ${x.gamma}</text>`;}).join('');
 const one=215-1/top*170;
 U.result(el,U.svg(`<path d="M30 ${one}H470" stroke="var(--orange)" stroke-dasharray="5 4"/><text x="470" y="${one-6}" text-anchor="end">1배(추측 없음)</text>${cols}<text x="12" y="270">γ별 이론 속도 향상(배) · 밝은 막대가 지금 γ</text>`,`γ 1~8의 이론 속도 향상: ${r.curve.map(x=>'γ'+x.gamma+' '+U.fmt(x.speedup,2)+'배').join(', ')}`),
 `<b>검증 한 번에 기대 토큰 ${U.fmt(r.expected,2)}개 · 이론 속도 향상 ${U.fmt(r.speedup,2)}배</b><br>(1 − ${a}<sup>${g+1}</sup>) ÷ (1 − ${a}) = ${U.fmt(r.expected,2)}, 속도 향상 = ${U.fmt(r.expected,2)} ÷ (${g} × ${c} + 1). 이 α·c에서 γ 1~8 중에서는 γ ${r.best.gamma}일 때 ${U.fmt(r.best.speedup,2)}배로 가장 큽니다.<br>Leviathan 외(2023)의 기대값 식으로 계산한 이론값입니다. 수락이 토큰마다 독립이고, 큰 모델이 γ+1개 위치를 검증하는 시간이 decode 한 단계와 같다고 가정했습니다. 실제 수락률과 초안 비용은 측정해야 합니다.`);});
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
