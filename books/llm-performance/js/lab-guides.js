window.PGuides=(()=>{
const guides={
 mapping:['마지막 warp에서 유효한 배열 인덱스와 범위 밖 스레드를 구분합니다.',[['100개·block64',{elements:100,block:64}],['정확히 128개',{elements:128,block:64}],['원소 하나',{elements:1,block:32}]],'100개에서는 128개 스레드 중 28개가 범위 밖입니다. 128개에서는 낭비가 0입니다. 실제 인덱스 계산입니다.'],
 sectors:['같은 128 byte 요청이 건드리는 서로 다른 sector를 셉니다.',[['연속·정렬',{stride:1,offset:0}],['연속·어긋남',{stride:1,offset:1}],['8칸씩',{stride:8,offset:0}]],'sector는 각각 4·5·32개입니다. 요청량은 모두 128 byte이며 실제 DRAM 전송량은 아닙니다.'],
 occupancy:['적재량 감소와 상주 자원 제한을 동시에 봅니다.',[['기준',{tile:16,registers:32}],['큰 타일·많은 register',{tile:32,registers:64}],['배치 불가',{tile:32,registers:128}]],'기준은 8개 block·100%, 큰 타일 예제는 1개·50%, 마지막은 0개입니다. 하드웨어 할당 단위를 생략한 가상 자원 계산입니다.'],
 fusion:['같은 출력을 유지하면서 중간 z의 저장·재적재를 줄입니다.',[['기준 4백만',{million:4,bias:1}],['길이 두 배',{million:8,bias:1}],['bias 변경',{million:4,bias:3}]],'기준은 분리 80 MB, 융합 48 MB입니다. bias를 바꾸면 출력 표가 달라지지만 트래픽 모형은 같습니다.'],
 attention:['전체 score와 한 타일이 차지하는 공간만 비교합니다.',[['2,048토큰',{tokens:2048,tile:64}],['8,192토큰',{tokens:8192,tile:64}],['타일 두 배',{tokens:8192,tile:128}]],'전체 score는 8 MiB에서 128 MiB로 늘고 폭64 타일은 16 KiB 그대로입니다. 이는 전체 메모리나 속도 비교가 아닙니다.'],
 paging:['같은 KV 길이에서 블록 크기가 만드는 남는 자리를 비교합니다.',[['블록 16',{length:513,block:16}],['블록 256',{length:513,block:256}],['경계에 맞추기',{length:512,block:16}]],'기준은 899토큰을 위해 944자리를 할당하고 45자리가 빕니다. 블록 256은 1,536자리를 할당합니다. 실제 엔진의 할당 오버헤드는 생략합니다.'],
 schedule:['완료한 요청의 빈자리를 언제 다시 사용하는지 확인합니다.',[['고정 배치',{slots:2,step:10,policy:0}],['매 단계 투입',{slots:2,step:10,policy:1}],['슬롯 하나',{slots:1,step:10,policy:1}]],'기본 고정 배치는 110 ms, 매 단계 투입은 100 ms입니다. 슬롯 하나는 두 정책 모두 160 ms입니다. 고정 단계 시간의 스케줄 계산입니다.'],
 parallel:['GPU 수가 늘 때 줄어드는 계산과 늘어나는 통신을 함께 봅니다.',[['1 GPU',{devices:1,payload:.25,link:50}],['4 GPU',{devices:4,payload:.25,link:50}],['8 GPU',{devices:8,payload:.25,link:50}]],'기본 조건은 18→8.40→9.04 ms입니다. 계산 분할이 이상적이어도 통신 지연 때문에 최적점이 생기는 가상 모형입니다.'],
 decision:['속도·메모리·품질 조건을 동시에 확인합니다.',[['기준 실행',{variant:0,ttft:600,itl:30,capacity:24}],['융합 후보',{variant:1,ttft:600,itl:30,capacity:24}],['큰 배치 후보',{variant:2,ttft:600,itl:30,capacity:24}]],'기본 목표에서는 융합 후보만 네 조건을 모두 통과합니다. 고정 가상 기록에 대한 판정이며 실측 벤치마크가 아닙니다.'],

 metrics:['첫 대기와 이후 간격을 따로 바꿔 전체 시간을 비교합니다.',[['기준',{ttft:400,gap:20,count:32}],['첫 대기 절반',{ttft:200,gap:20,count:32}],['토큰 하나',{ttft:400,gap:20,count:1}]],'기준은 1,020 ms, 첫 대기 절반은 820 ms입니다. 출력 하나에서는 ITL이 정의되지 않습니다. 실제 산술 계산입니다.'],
 timing:['CPU 제출 완료와 GPU 계산 완료를 구분합니다.',[['기준',{count:20,launch:.02,gpu:2}],['GPU 두 배 빠름',{count:20,launch:.02,gpu:1}],['제출이 더 느림',{count:20,launch:.2,gpu:.1}]],'기준은 제출 0.40 ms, GPU 구간 40 ms, 완료 40.02 ms입니다. 일정 비용을 가정한 스케줄 계산입니다.'],
 pipeline:['서로 독립인 묶음끼리 겹쳐 실행할 수 있는 부분을 찾습니다.',[['직렬',{chunks:4,copy:3,compute:6,overlap:0}],['겹침',{chunks:4,copy:3,compute:6,overlap:1}],['묶음 하나',{chunks:1,copy:3,compute:6,overlap:1}]],'네 묶음은 직렬 36 ms, 겹침 27 ms입니다. 묶음 하나는 두 방식 모두 9 ms입니다. 경합을 생략한 계산 모형입니다.'],
 roofline:['같은 측정 구간의 연산·이동·시간을 대응시킵니다.',[['기준',{gb:4,gflop:16,elapsed:10}],['연산 집약적',{gb:.25,gflop:1024,elapsed:25}],['범위 불일치',{gb:4,gflop:16,elapsed:2}]],'기준 메모리 하한은 8 ms입니다. 2 ms를 넣으면 가정한 상한과 맞지 않습니다. 입력 숫자는 가상 분석 사례입니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-initialize')){PLabs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
 const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
 el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',()=>box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed')));
}
return {mount,guides};})();
