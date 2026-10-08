(()=>{const U=PUI,M=PMath,L=PLabs;
L.mapping=el=>{
 U.setup(el,U.range('elements','배열 원소 수 N',1,256,1,100)+U.select('block','block당 스레드',[[32,'32개'],[64,'64개'],[128,'128개'],[256,'256개']],64));
 U.bind(el,()=>{const n=U.value(el,'elements'),b=U.value(el,'block'),r=M.mapping(n,b),start=r.total-32;
 const grid=`<p class="caption">마지막 warp의 전역 인덱스 i. 실선은 처리, 점선은 범위 밖입니다.</p><div class="lane-grid">${Array.from({length:32},(_,j)=>`<span class="${start+j<n?'active':'inactive'}">${start+j}<small>${start+j<n?'처리':'건너뜀'}</small></span>`).join('')}</div>`;
 U.result(el,grid,`<b>${r.blocks}개 block · ${r.total}개 스레드 제출</b><br>유효 원소 ${n}개, 범위 밖 ${r.idle}개. 각 block은 ${b/32}개 warp로 나뉩니다. 마지막 warp는 i=${start}…${r.total-1}입니다. 실제 인덱스 계산이며 실행 속도 모형은 아닙니다.`);});
};
L.sectors=el=>{
 U.setup(el,U.range('stride','lane 사이 간격 (float 원소)',1,16,1,1)+U.range('offset','시작 위치 (float 원소)',0,7,1,0));
 U.bind(el,()=>{const r=M.sectors(U.value(el,'stride'),U.value(el,'offset'));
 const grid=`<p class="caption">lane 0…31이 접근한 sector 번호 (sector당 32 byte)</p><div class="lane-grid">${r.addresses.map((a,i)=>`<span class="active">${Math.floor(a/32)}<small>lane ${i}</small></span>`).join('')}</div>`;
 U.result(el,grid+U.bars(['요청한 byte','sector 포함량'],[r.requested,r.covered],'byte'),`<b>${r.count}개 sector · ${r.covered} byte 구간</b><br>요청 ${r.requested} byte / 포함량 ${r.covered} byte = ${U.fmt(r.efficiency*100,1)}%. 캐시와 warp 사이 재사용을 생략한 주소 계산이며 DRAM 실측 전송량이 아닙니다.`);});
};
L.occupancy=el=>{
 U.setup(el,U.select('tile','정사각 타일 폭',[[8,'8 × 8'],[16,'16 × 16'],[32,'32 × 32']],16)+U.range('registers','스레드당 32bit register 수',16,128,16,32));
 U.bind(el,()=>{const r=M.occupancy(U.value(el,'tile'),U.value(el,'registers'));
 U.result(el,U.bars(['모형 occupancy','최대 상주량'],[r.ratio*100,100],'%')+U.table(['자원 제한','수용 block 수'],['block 한도','thread 한도','register 한도','shared 한도'].map((v,i)=>[v,r.limits[i]])),`<b>${r.blocks?r.blocks+'개 block 상주 · '+U.fmt(r.ratio*100,0)+'%':'블록 배치 불가: 자원 한도를 넘습니다.'}</b><br>block당 ${r.threads} thread · 공유 메모리 ${U.fmt(r.shared/1024,1)} KiB. 512×512 행렬곱의 입력 적재 모형은 ${U.fmt(r.loads/1e6,2)}백만 원소입니다. 이 수치들로 실행 시간을 예측하지 않습니다.`);});
};
L.fusion=el=>{
 U.setup(el,U.range('million','벡터 길이 (백만 원소)',1,16,1,4)+U.range('bias','bias 벡터의 모든 원소 값',-2,4,1,1));
 U.bind(el,()=>{const r=M.fusion(U.value(el,'million')*1e6,U.value(el,'bias'));
 U.result(el,U.bars(['분리 커널','융합 커널'],[r.separate/1e6,r.fused/1e6],'MB')+U.table(['x','x+b 후 ReLU'],r.x.map((x,i)=>[x,r.y[i]])),`<b>중간 z의 write/read ${U.fmt(r.saved/1e6,0)} MB를 생략</b><br>float32 벡터 x와 b를 읽는 단순 트래픽 모형입니다. 표의 8개 출력은 실제 산술 결과이며 두 방식에서 같습니다. 입력·출력의 캐시와 커널 자원 차이는 생략하므로 속도 배율은 표시하지 않습니다.`);});
};
L.attention=el=>{
 U.setup(el,U.select('tokens','문맥 길이 (tokens)',[[512,'512'],[2048,'2,048'],[8192,'8,192'],[32768,'32,768']],2048)+U.select('tile','score 타일 폭',[[32,'32'],[64,'64'],[128,'128']],64));
 U.bind(el,()=>{const r=M.attention(U.value(el,'tokens'),U.value(el,'tile'));
 U.result(el,U.bars(['전체 score','score 타일','행 m·l 상태'],[r.full/1024,r.tile/1024,r.row/1024],'KiB'),`단일 head·단일 요청에서 FP16 전체 score는 <b>${U.fmt(r.full/2**20,2)} MiB</b>, FP32 타일은 ${U.fmt(r.tile/1024,1)} KiB입니다. 행별 최대값 m과 정규화 합 l은 ${U.fmt(r.row/1024,2)} KiB입니다.<br>저장 항목별 계산입니다. Q/K/V·누적 출력·기타 작업 공간은 빠져 있으며 전체 FlashAttention 메모리 비교가 아닙니다.`);});
};
})();
