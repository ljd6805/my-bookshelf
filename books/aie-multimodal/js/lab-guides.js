/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A13Guides=(()=>{
const guides={
 patches:['사진 한 변과 패치 크기를 바꾸면 시각 토큰 수와 어텐션 쌍 수가 어떻게 커지는지, 파라미터는 왜 거의 그대로인지 확인합니다.',[['기준 224 · P16',{ptside:224,ptpatch:16}],['표시창 확대 448',{ptside:448,ptpatch:16}],['고해상도 896 · P14',{ptside:896,ptpatch:14}]],'한 변을 두 배로 하면 토큰은 약 네 배, 어텐션 쌍은 약 열여섯 배가 됩니다. 파라미터 합계는 위치 표만큼만 달라집니다.'],
 contrast:['온도 τ와 편향 b가 같은 유사도 표에서 손실과 짝 확률을 얼마나 바꾸는지 봅니다.',[['날카로운 τ 0.03',{ctau:0.03,cbias:-10}],['기본 τ 0.07',{ctau:0.07,cbias:-10}],['무딘 τ 0.5',{ctau:0.5,cbias:-10}]],'τ가 작을수록 대각 확률이 1에 가까워지고 손실이 줄지만, 표 속 유사도와 순위는 그대로입니다. 닮은 오답 칸이 손실을 붙잡는 모습을 보세요.'],
 qformer:['쿼리 수와 사진 장수에 따라 언어 모델로 넘어가는 시각 토큰이 얼마나 줄어드는지 계산합니다.',[['쿼리 32 · 사진 8장',{qfq:32,qfimg:8}],['쿼리 8 · 사진 32장',{qfq:8,qfimg:32}],['쿼리 256 · 사진 8장',{qfq:256,qfimg:8}]],'쿼리 256개면 압축률이 1배라 아끼는 토큰이 없습니다. 쿼리를 줄일수록 문맥은 남지만 요약에 담기는 정보는 줄어듭니다.'],
 gate:['0에서 시작한 tanh 게이트가 학습률에 따라 얼마나 빨리 열리는지 봅니다.',[['느린 η 0.05',{glr:0.05}],['보통 η 0.3',{glr:0.3}],['큰 η 2',{glr:2}]],'처음 손실은 언제나 0.36이고 첫 기울기는 −1.2입니다. 학습률이 너무 크면 게이트가 목표 0.6을 지나쳤다가 돌아옵니다.'],
 budget:['연결 방식과 사진 장수가 문맥 창의 얼마를 먼저 차지하는지 계산합니다.',[['Q-Former · 3장',{bdconn:32,bdimg:3,bdctx:8192}],['MLP 576 · 3장',{bdconn:576,bdimg:3,bdctx:8192}],['AnyRes · 3장',{bdconn:2880,bdimg:3,bdctx:8192}]],'AnyRes로 세 장을 넣으면 사진만으로 8,640토큰이 되어 8,192 문맥을 넘습니다. 남는 글 자리가 음수면 그 설정은 들어가지 않습니다.'],
 anyres:['세로로 긴 문서 사진을 정사각형, AnyRes 타일, 원래 비율로 넣을 때 토큰 수와 빈칸을 비교합니다.',[['세로 영수증 600×1800',{arw:600,arh:1800,arcap:1280}],['표시창 사진 1008×672',{arw:1008,arh:672,arcap:1280}],['큰 스캔 2480×3508',{arw:2480,arh:3508,arcap:1280}]],'정사각형은 언제나 576토큰이지만 빈칸 비율이 커집니다. 원래 비율 방식은 상한을 넘으면 해상도를 줄여 맞춥니다.'],
 videobudget:['90초 드럼 영상을 FPS와 풀링에 따라 몇 토큰으로 읽게 되는지, 예산 안에 드는지 확인합니다.',[['2 FPS · 3×3 풀링',{vbsec:90,vbfps:2,vbpool:3}],['4 FPS · 풀링 없음',{vbsec:90,vbfps:4,vbpool:1}],['10분 · 1 FPS · 6×6',{vbsec:600,vbfps:1,vbpool:6}]],'풀링을 하지 않으면 프레임당 729토큰이라 짧은 영상도 예산을 넘습니다. 아래 줄의 최대 FPS가 지금 설정의 한계입니다.'],
 eventcatch:['짧은 사건이 표본 프레임에 한 장이라도 잡힐 확률을 FPS와 사건 길이로 계산합니다.',[['0.4초 · 1 FPS',{ecdur:0.4,ecfps:1}],['0.3초 · 2 FPS',{ecdur:0.3,ecfps:2}],['0.3초 · 4 FPS',{ecdur:0.3,ecfps:4}]],'확률은 사건 길이 × FPS이고 1을 넘으면 반드시 잡힙니다. 마지막 과제의 0.3초 불꽃은 4 FPS에서야 확실해집니다.'],
 omni:['Thinker 크기와 Talker 속도가 첫 소리까지의 시간과 끊김에 어떻게 영향을 주는지 봅니다.',[['7B · 80개/초',{omsize:'7',omrate:80}],['70B · 80개/초',{omsize:'70',omrate:80}],['7B · 40개/초',{omsize:'7',omrate:40}]],'합계가 500ms를 넘으면 대답이 늦게 느껴집니다. Talker가 초당 50개보다 느리면 첫 소리가 빨라도 말이 끊깁니다.'],
 vqtokens:['그림을 토큰으로 바꿀 때 해상도, 축소 배율, 코드북 크기가 토큰 수와 생성 시간을 어떻게 정하는지 계산합니다.',[['512 · f16 · 8,192',{vqres:512,vqf:16,vqk:8192}],['512 · f8 · 32,768',{vqres:512,vqf:8,vqk:32768}],['1024 · f8 · 256',{vqres:1024,vqf:8,vqk:256}]],'축소 배율을 반으로 줄이면 토큰은 네 배가 됩니다. 코드북을 키우면 토큰 수는 그대로이고 토큰당 비트와 양자화 오차만 달라집니다.'],
 maskgit:['가린 토큰을 코사인 일정으로 몇 단계에 걸쳐 확정하는지, 순전파가 몇 번 필요한지 봅니다.',[['1,024 · 8단계',{mgn:1024,mgt:8}],['1,024 · 2단계',{mgn:1024,mgt:2}],['4,096 · 16단계',{mgn:4096,mgt:16}]],'처음 단계는 조금만 확정하고 뒤로 갈수록 많이 확정합니다. 순전파 횟수는 T번이라 토큰 수 N과 무관합니다.'],
 vla:['로봇 관절 값을 칸으로 나눌 때 생기는 오차와, 제어 주기에 필요한 토큰 속도를 계산합니다.',[['256칸 · 10Hz',{vlbins:256,vlhz:10}],['256칸 · 5Hz',{vlbins:256,vlhz:5}],['16칸 · 5Hz',{vlbins:16,vlhz:5}]],'칸 수는 정밀도만 바꾸고 필요한 토큰 수는 바꾸지 않습니다. 필요한 디코딩이 가능한 속도를 넘으면 그 주기로는 움직일 수 없습니다.'],
 maxsim:['질의 토큰마다 가장 잘 맞는 패치를 고르는 MaxSim과, 평균 벡터 하나로 비교하는 방식이 같은 쪽을 고르는지 봅니다.',[['필터 그림 · MaxSim',{msq:0,msmode:'max'}],['필터 그림 · 평균',{msq:0,msmode:'mean'}],['보증 기간 · MaxSim',{msq:2,msmode:'max'}]],'“배수 필터 그림”에서 두 방식의 1등이 다릅니다. 작은 그림 패치 하나의 강한 신호가 평균에서는 묻힙니다.'],
 storage:['쪽 이미지를 패치 벡터로 색인할 때 저장 공간이 글 한 벡터 색인보다 얼마나 커지는지 계산합니다.',[['48쪽 · float32',{stpages:48,stvec:1030,stbytes:4}],['48쪽 · 8비트',{stpages:48,stvec:1030,stbytes:1}],['원본 예 50쪽 · 729',{stpages:50,stvec:729,stbytes:4}]],'쪽 수를 늘려도 비율은 그대로이고, 값당 바이트를 줄이면 비율이 그만큼 줄어듭니다.'],
 agentloop:['화면을 누르는 단계가 많아질수록 끝까지 성공할 확률이 어떻게 줄고, 검증과 재시도가 얼마나 되살리는지 계산합니다.',[['p 0.95 · 20단계',{agp:0.95,agn:20,agd:0.8}],['p 0.95 · 10단계',{agp:0.95,agn:10,agd:0.8}],['검증 없음',{agp:0.95,agn:20,agd:0}]],'단계 성공률이 0.95여도 20단계면 그대로는 0.36 정도입니다. 감지율 0이면 두 선이 겹칩니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A13Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
