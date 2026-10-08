window.GGuides=(()=>{
const guides={
 bundle:['구성요소'+'를 하나씩 선택하고, 무엇을 저장하거나 실행하는지 구분합니다.',[['가중치 보기',{part:0}],['실행 엔진 보기',{part:3}]],'강조된 카드와 결과 설명이 함께 바뀝니다. 파일 역할을 보여 주는 고정 시나리오입니다.'],
 params:['폭과 층 수가 파라미터 합계에 주는 영향을 따로 확인합니다.',[['폭 4',{width:4,layers:1}],['폭 8',{width:8,layers:1}],['층 2개',{width:4,layers:2}]],'폭 4·층 1은 20개, 폭 8·층 1은 72개입니다. 실제 계산이며 전체 LLM 구조를 재현하지 않습니다.'],
 weights:['같은 파라미터를 다른 bit로 저장한 순수 가중치 크기를 비교합니다.',[['8B·16bit',{params:8,bits:16}],['8B·4bit',{params:8,bits:4}],['32B·4bit',{params:32,bits:4}]],'8B·16bit와 32B·4bit는 순수 가중치가 모두 16 GB입니다. 같은 파일 크기가 같은 품질이나 속도를 뜻하지는 않습니다.'],
 quant:['같은 숫자 여덟 개를 적은 눈금으로 표현합니다.',[['2bit',{qbits:2}],['4bit',{qbits:4}],['8bit',{qbits:8}]],'원본은 실선, 복원은 점선과 점입니다. 그래프가 겹치면 아래 오차 수치를 비교하세요. 실제 수치 계산이며 모델 품질 평가는 아닙니다.'],
 journey:['초기 가중치 로드와 매 요청·매 토큰 작업을 구분합니다.',[['최초 로드',{stage:0}],['입력 전송',{stage:2}],['Decode',{stage:5}]],'CPU↔GPU 전송과 GPU 내부 읽기를 구분하세요. 단계는 미리 정한 시나리오이며 소요 시간 비율이 아닙니다.'],
 hierarchy:['현재 데이터가 어느 계층에서 쓰이는지 확인합니다.',[['큰 저장소',{level:0}],['타일 재사용',{level:2}],['연산 직전',{level:3}]],'현재 저장소에 테두리가 생깁니다. 타일 적재의 개념 경로이며 물리 크기·지연을 측정하지 않습니다.'],
 matrix:['입력 재사용을 늘려도 같은 행렬곱 결과가 나오는지 확인합니다.',[['타일 1',{tile:1,cell:0}],['타일 2',{tile:2,cell:0}],['타일 4',{tile:4,cell:15}]],'적재 원소 수는 128→64→32로 줄어듭니다. 출력 4×4 행렬은 동일합니다. 실제 행렬곱과 캐시를 생략한 적재 모형입니다.'],
 phases:['KV를 사용할 때 새로 투영하는 토큰 위치 수를 비교합니다.',[['출력 하나',{prompt:128,generated:1}],['출력 16개',{prompt:128,generated:16}],['긴 입력',{prompt:512,generated:16}]],'출력 하나에서는 두 방식 모두 128개입니다. 출력 16개에서는 143 대 2168입니다. 전체 Attention 연산량이나 시간 비교가 아닙니다.'],
 cache:['문맥·요청 수·KV head 수가 저장량에 주는 영향을 분리합니다.',[['기준 1 GiB',{tokens:8192,batch:1,heads:8}],['문맥 두 배',{tokens:16384,batch:1,heads:8}],['요청 네 개',{tokens:8192,batch:4,heads:8}]],'기준 1 GiB, 문맥 두 배 2 GiB, 요청 네 개 4 GiB입니다. 실제 공식 계산이며 물리 할당량은 아닙니다.'],
 roofline:['같은 작업의 메모리 시간과 계산 시간을 따로 봅니다.',[['기준',{batch:1,bandwidth:500,compute:50}],['연산 두 배',{batch:1,bandwidth:500,compute:100}],['배치 128',{batch:128,bandwidth:500,compute:50}]],'기준과 연산 두 배는 모두 8 ms입니다. 배치 128에서는 이 모형의 제한 요인이 연산으로 바뀝니다. 가상 유효 처리율을 이용한 하한 계산입니다.'],
 moe:['전체 expert 수와 토큰당 선택 수를 따로 바꿉니다.',[['16개 중 2개',{experts:16,chosen:2}],['64개 중 2개',{experts:64,chosen:2}],['64개 중 8개',{experts:64,chosen:8}]],'전체 expert를 늘려도 선택 수가 같으면 이 모형의 활성 파라미터는 같습니다. 전체 가중치 저장량은 증가합니다.'],
 transfer:['지정한 데이터를 한 번 옮기는 순수 시간 하한을 계산합니다.',[['4 GB·32 GB/s',{gb:4,link:32}],['전송량 두 배',{gb:8,link:32}],['전송 없음',{gb:0,link:32}]],'4/32초는 125 ms입니다. 전송량 0은 이 비용만 0이라는 뜻이며 전체 추론이 0 ms라는 뜻은 아닙니다.'],
 cards:['실제 사양에서 가중치와 KV를 각각 계산합니다.',[['Qwen3-8B',{model:'q8',bits:4,tokens:8192}],['Qwen3-30B-A3B',{model:'q30',bits:4,tokens:8192}]],'같은 문맥에서 KV는 1.125와 0.750 GiB입니다. 더 큰 모델이 더 작은 KV를 가질 수 있습니다. 가중치는 카드의 반올림 파라미터로 계산한 근사값입니다.'],
 budget:['같은 과제에서 조건 하나씩 바꾸며 초과 원인을 찾습니다.',[['과제 시작',{model:'toy',bits:16,tokens:32768,batch:4,capacity:24,reserve:2,extra:10}],['4bit 전환',{model:'toy',bits:4,tokens:32768,batch:4,capacity:24,reserve:2,extra:10}],['요청 한 개',{model:'toy',bits:16,tokens:32768,batch:1,capacity:24,reserve:2,extra:10}]],'과제 시작은 약 34.39 GiB로 초과합니다. 4bit 전환은 약 22.10 GiB로 예산을 만족합니다. 여유·부가정보는 가정이며 실제 실행 성공 보장은 아닙니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){GLabs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',()=>box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed')));
}
return {mount,guides};
})();
