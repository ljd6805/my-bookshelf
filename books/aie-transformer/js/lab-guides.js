/* 실험 위 안내 상자: 확인할 것, 비교 예제, 초기화, 결과 읽기.
   guides[실험ID]=[무엇을 확인하나요, [[예제 이름,{입력ID:값}], …], 결과 읽기].
   예제는 입력값을 바꾼 뒤 실제 input 이벤트를 보내 사람이 조작한 것과 같은 경로로 계산한다. */
window.A08Guides=(()=>{
const guides={
 depth:['문장이 길어질 때 RNN의 직렬 단계와 어텐션의 점수표가 각각 어떤 속도로 커지는지 비교합니다.',[['8토큰',{seqexp:3}],['1,024토큰',{seqexp:10}],['131,072토큰',{seqexp:17}]],'1,024토큰에서 RNN은 1,024단계, 트리 합은 10단계, 점수표는 1,048,576칸(헤드 하나 약 2.1MB)이어야 합니다. 초록 선은 기울기 1, 주황 점선은 기울기 2로 올라갑니다.'],
 scale:['같은 d_k에서 √d_k로 나눌 때와 나누지 않을 때 가중치가 한 토큰에 몰리는 정도를 비교합니다.',[['d_k 64, 나누지 않음',{dk:64,scaled:'no'}],['d_k 64, 나눔',{dk:64,scaled:'yes'}],['d_k 512, 나누지 않음',{dk:512,scaled:'no'}]],'d_k 64에서 나누지 않으면 평균 최대 가중치가 약 89%, 나누면 약 40%여야 합니다. d_k 512에서 나누지 않으면 약 97%가 한 토큰에 몰리고 기울기 합은 0.04 근처로 떨어집니다.'],
 heads:['헤드 수를 바꿀 때 무엇이 바뀌고 무엇이 그대로인지 봅니다.',[['768 ÷ 12 (GPT-2 크기)',{dmodel:768,nheads:12}],['512 ÷ 64',{dmodel:512,nheads:64}],['1024 ÷ 12',{dmodel:1024,nheads:12}]],'768을 12로 나누면 d_head 64로 무난하고, 512를 64로 나누면 d_head 8로 너무 작다는 경고가 나와야 합니다. 1024는 12로 나누어떨어지지 않습니다. 어느 경우든 투영 파라미터는 4·d²입니다.'],
 rope:['두 토큰을 같은 양만큼 옮겨도 점수가 그대로인 방식이 어느 쪽인지 확인합니다.',[['사인 인코딩, 100칸 이동',{posmethod:'abs',shift:100}],['RoPE, 100칸 이동',{posmethod:'rope',shift:100}],['RoPE, 이동 없음',{posmethod:'rope',shift:0}]],'사인 인코딩에서는 100칸 옮기면 점수가 −0.94에서 2.68로 바뀌고, RoPE는 2.5040 그대로(차이 10⁻¹⁵ 수준)여야 합니다. RoPE의 초록 선은 수평입니다.'],
 params:['층 수와 d_model이 전체 파라미터를 어떻게 키우는지, 어느 부품이 가장 큰지 봅니다.',[['GPT-2 small 크기',{dm:768,layers:12}],['도란',{dm:2048,layers:16}],['Llama 3 8B 근처',{dm:4096,layers:32}]],'768·12층은 약 0.11B, 도란은 약 0.87B, 4096·32층은 약 6.57B여야 합니다. 세 경우 모두 FFN 막대가 어텐션의 두 배입니다.'],
 norm:['모든 값에 같은 상수를 더할 때 두 정규화의 반응이 어떻게 다른지 봅니다.',[['c = 0',{shift:0}],['c = 3',{shift:3}],['c = −5',{shift:-5}]],'c를 바꿔도 LayerNorm 행은 변화 0.0000이어야 하고, RMSNorm 행은 값이 달라져야 합니다. c = 3이면 RMSNorm 출력이 모두 양수가 됩니다.'],
 mlm:['토큰이 많아질수록 실제로 뽑힌 수가 15%와 80·10·10 비율에 가까워지는지 봅니다.',[['100토큰',{ntok:100}],['1,000토큰',{ntok:1000}],['10,000토큰',{ntok:10000}]],'100토큰에서는 고른 수 16개처럼 기대값 15에서 흔들리고, 10,000토큰에서는 고름 1,525, [MASK] 1,238로 기대값 1,500과 1,200에 가까워져야 합니다.'],
 causal:['세 단계 모두 마스크를 켜면 하삼각, 끄면 미래 칸에 가중치가 새는지 확인합니다.',[['1단계, 마스크 켬',{stage:1,cmask:'on'}],['3단계, 마스크 켬',{stage:3,cmask:'on'}],['3단계, 마스크 끔',{stage:3,cmask:'off'}]],'마스크를 켜면 1단계 ‘읽었다’ 행이 모두 14%, ‘나는’ 행은 자기 자신 100%여야 합니다. 마스크를 끄면 미래 칸 가중치 합이 0보다 커지고 ‘나는’ 행이 문장 전체로 퍼집니다.'],
 masks:['같은 디코더 단계에서 디코더 셀프 어텐션과 교차 어텐션이 볼 수 있는 칸을 비교합니다.',[['인코더 셀프',{atype:'encoder',dstep:3}],['디코더 셀프, 3단계',{atype:'decoder',dstep:3}],['교차, 3단계',{atype:'cross',dstep:3}]],'인코더는 49칸 모두, 디코더 셀프 3단계는 1+2+3 = 6칸, 교차 3단계는 3행 × 7열 = 21칸이 열려야 합니다.'],
 patch:['패치를 작게 자를수록 토큰과 점수표가 얼마나 빨리 커지는지 봅니다.',[['224, 패치 16',{imgsize:224,psize:16}],['224, 패치 8',{imgsize:224,psize:8}],['384, 패치 14',{imgsize:384,psize:14}]],'224·16은 197토큰, 224·8은 785토큰으로 약 4배이고 점수표는 약 16배여야 합니다. 384·14는 27×27 = 729패치이며 가장자리 6픽셀이 잘립니다.'],
 router:['편향 조정이 없을 때의 쏠림과, 조정을 반복한 뒤의 균형을 비교합니다.',[['top-1, 조정 없음',{topk:1,rounds:0}],['top-2, 조정 없음',{topk:2,rounds:0}],['top-2, 40회 조정',{topk:2,rounds:40}]],'조정 없이 top-1이면 가장 바쁜 전문가가 목표의 약 4.9배, top-2면 약 3.4배를 맡아야 합니다. 40회 조정하면 약 1.1배로 내려갑니다.'],
 tiled:['타일 크기가 달라도 최종 출력이 한 번에 계산한 값과 같은지 확인합니다.',[['타일 1',{tile:1}],['타일 4',{tile:4}],['타일 16 (한 번에)',{tile:16}]],'세 경우 모두 최대 차이가 10⁻¹⁶ 수준이어야 합니다. 타일 1에서는 합 ℓ이 16번에 걸쳐 오르고, 최댓값이 바뀔 때 앞의 합이 줄어들었다가 다시 쌓이는 모습이 보입니다.'],
 kvvar:['같은 문맥 길이에서 K·V 헤드 수와 창이 KV 캐시를 얼마나 줄이는지 비교합니다.',[['32K, GQA',{ctxexp:15,kvsel:'gqa'}],['128K, MHA',{ctxexp:17,kvsel:'mha'}],['128K, GQA + SWA',{ctxexp:17,kvsel:'swa'}]],'32K에서 GQA는 약 10.74GB, 128K에서 MHA는 약 343.6GB로 GPU 하나를 크게 넘고, GQA + SWA는 약 7.44GB여야 합니다.'],
 chinchilla:['같은 계산량에서 토큰/파라미터 비율을 바꿀 때 손실과 모델 크기가 어떻게 움직이는지 봅니다.',[['10²³, 최적',{logc:23,ratio:'opt'}],['10²³, GPT-3식 1.7',{logc:23,ratio:'1.7'}],['10²³, 과잉 학습 1,875',{logc:23,ratio:'1875'}]],'10²³에서 이 식의 최적 비율은 약 78, 손실 약 2.005여야 합니다. 비율 1.7은 손실이 약 0.055 높고 모델이 6.8배 크며, 1,875는 손실이 약 0.040 높지만 모델은 0.2배입니다.'],
 spec:['수락률이 낮을 때 초안을 길게 쓰면 왜 손해인지 확인합니다.',[['α 0.75, 초안 5',{alpha:0.75,ndraft:5}],['α 0.5, 초안 8',{alpha:0.5,ndraft:8}],['α 0.9, 초안 8',{alpha:0.9,ndraft:8}]],'α 0.75·초안 5는 기대 토큰 3.29개, 약 2.19배여야 합니다. α 0.5·초안 8은 약 1.11배로 최적(초안 2, 1.46배)보다 느리고, α 0.9·초안 8은 약 3.40배입니다.'],
 redesign:['요구마다 통과하는 칸과 통과해도 남는 증거의 빈틈을 함께 확인합니다.',[['문맥 32K, GQA',{req:'long',change:'gqa'}],['속도, 추측 디코딩',{req:'fast',change:'spec'}],['품질, MoE',{req:'quality',change:'moe'}]],'문맥 요구에서 GQA는 약 10.1GB로 통과, 추측 디코딩 속도는 약 1.82배로 통과해야 합니다. MoE는 손실을 이 식으로 계산할 수 없어 “판정 불가”가 나와야 정상입니다.']
};
function mount(id,el){
 const [purpose,presets,reading]=guides[id],box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}" type="button">${p[0]}</button>`).join('')}<button data-initialize type="button">실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
 el.parentElement.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-initialize')){A08Labs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
  const values=presets[+b.dataset.preset][1];Object.entries(values).forEach(([key,value])=>el.querySelector('#'+key).value=value);
  el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));
  box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
