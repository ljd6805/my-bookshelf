(()=>{
'use strict';
const U=GUI,M=GMath,R=U.range,S=U.select,V=U.value,F=U.fmt;
const bits=(v=4)=>S('bits','가중치 정밀도 (bit)',[[4,'4bit'],[8,'8bit'],[16,'16bit']],v);
const modelOptions=Object.entries(M.models).map(([k,m])=>[k,m.name]);
GLabs.journey=el=>{
 const steps=[
 ['가중치 로드','SSD → RAM → VRAM','초기 준비입니다. 엔진과 파일 형식에 따라 읽기 경로는 달라집니다.'],
 ['입력 준비','문장 → 토큰 ID','CPU에서 대화 템플릿과 토크나이저를 적용하는 예입니다.'],
 ['입력 전송','RAM → VRAM','작은 입력 텐서를 보냅니다. 상주 가중치 전체를 다시 보내지 않습니다.'],
 ['Prefill','VRAM ↔ GPU 연산 유닛','프롬프트를 처리해 KV를 저장하고 첫 출력 후보 점수를 만듭니다.'],
 ['토큰 선택','logits → 토큰 ID','이 시나리오는 GPU에서 선택합니다. 선택 위치는 엔진마다 다릅니다.'],
 ['다음 토큰 계산','새 ID + 과거 KV → logits','2번째 이후 출력을 위해 decode를 반복합니다. 가중치는 계속 재사용합니다.'],
 ['화면 표시','GPU ID → CPU 문자열','작은 출력 ID를 전달해 문자열로 복원합니다. 실제 엔진은 출력과 계산을 겹칠 수 있습니다.']
 ];
 U.setup(el,R('stage','실행 단계',0,6,1,0));
 U.bind(el,()=>{const i=V(el,'stage'),x=steps[i];U.result(el,U.cards(steps.map(s=>[s[0],s[1]]),i),`<strong>${i+1}. ${x[0]}</strong><br><b>${x[1]}</b><br>${x[2]}<br>순서 이해를 위한 시나리오이며 타이밍을 측정하지 않습니다.`);});
};
GLabs.hierarchy=el=>{
 const labels=['VRAM의 입력·가중치','L2에서 요청 처리','SM의 shared memory에 타일 적재','레지스터의 피연산자·누적값','연산 후 결과 저장'];
 const detail=['HBM 또는 GDDR에 큰 텐서가 저장되어 있습니다.','캐시에 있으면 재사용하고, 없으면 메모리에서 가져옵니다.','타일을 함께 쓰는 스레드들이 작은 작업 공간에서 재사용합니다.','레지스터와 연산 유닛이 값을 주고받으며 곱하고 누적합니다.','결과는 다음 연산에 전달하거나 메모리에 씁니다. 중간값을 항상 VRAM에 저장하지는 않습니다.'];
 U.setup(el,R('level','데이터 이동 단계',0,4,1,0));
 U.bind(el,()=>{const i=V(el,'level');
 const chart=`<div class="chip-map"><div class="chip-box ${i===0?'current':''}"><b>VRAM</b><small>가중치 · KV · 활성값</small></div><div class="chip-link">↓ 메모리 접근 ↑</div><div class="chip-frame"><b>GPU 칩</b><div class="chip-box ${i===1?'current':''}">공유 L2 캐시</div><div class="sm-grid"><div class="sm"><b>SM 0</b><div class="chip-box ${i===2?'current':''}">L1 / shared memory</div><div class="chip-box ${i===3?'current':''}">레지스터</div><div class="chip-box ${i===4?'current':''}">Tensor Core · 연산 유닛</div></div><div class="sm"><b>SM 1 …</b><p>다른 블록도 병렬 실행</p></div></div></div></div>`;
 U.result(el,chart,`<strong>${i+1}. ${labels[i]}</strong><br>${detail[i]}<br>타일 적재의 개념 경로입니다. 물리 배치·용량·지연 비율을 재현하지 않습니다.`);});
};
GLabs.matrix=el=>{
 U.setup(el,S('tile','타일 한 변',[[1,'1: 재사용 없음'],[2,'2: 작은 타일'],[4,'4: 전체 타일']],1)+R('cell','출력 원소 번호 (0~15)',0,15,1,0));
 U.bind(el,()=>{const n=V(el,'tile'),r=M.matrix(n),i=V(el,'cell'),row=Math.floor(i/4),col=i%4;
 U.result(el,`<div class="matrices">${U.matrixTable(r.A,'입력 X')}${U.matrixTable(r.B,'가중치 W')}${U.matrixTable(r.C,'출력 Y',i)}</div>`,
 `선택한 Y[${row},${col}] = ${r.A[row].map((x,k)=>`${x}×${r.B[k][col]}`).join(' + ')} = <strong>${r.C[row][col]}</strong><br>연산량: ${r.flops} FLOP(곱·누적 관례). A·B 적재: <b>${r.loads}개</b> / 재사용 없는 기준 ${r.naive}개.<br>두 입력 타일의 작업 공간: ${r.shared} byte(FP32). 타일이 커져도 출력 행렬은 같습니다.`);});
};
GLabs.phases=el=>{
 U.setup(el,R('prompt','프롬프트 토큰 수 T',16,512,16,128)+R('generated','생성 토큰 수 G',1,64,1,16));
 U.bind(el,()=>{const t=V(el,'prompt'),g=V(el,'generated'),r=M.phases(t,g);
 U.result(el,U.bars(['KV 재사용','전체 재계산'],[r.cached,r.uncached],'투영 위치 수'),
 `<strong>Prefill 1회(${t}개 위치) + decode ${r.decode}회</strong><br>새로 투영한 위치 합계: KV 재사용 <b>${r.cached}</b>, 매번 전체 재계산 <b>${r.uncached}</b>.<br>과거 KV를 읽는 Attention 작업은 이 합계에서 제외했습니다. 막대의 비율을 속도 향상 배수로 해석하지 마세요.`);});
};
})();
