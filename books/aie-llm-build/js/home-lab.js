/* 표지 오른쪽의 살아 있는 대표 실험: 모델 크기를 고르면 Chinchilla 20토큰 규칙의 데이터·계산량과
   학습·추론 메모리를 계산해 80GB GPU 한 장과 견준다. */
window.A11Home=(()=>{
const M=A11Math,U=A11UI,F=U.fmt;
const SIZES=[0.124,0.35,1,3,7,8,13,34,70,175,405];
const sci=n=>{const e=Math.floor(Math.log10(n));return `${F(n/Math.pow(10,e),2)} × 10<sup>${e}</sup>`;};
const tok=n=>n>=1e12?F(n/1e12,2)+'조':F(n/1e8,0)+'억';
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>서재봇 크기 고르기 · 학습과 추론 예산</span><span>CALCULATED</span></div><div class="home-graphic"></div><div class="network-controls">${U.range('home-n','모델 크기 단계',0,SIZES.length-1,1,5)}<div class="buttons"><button type="button" data-k="0">124M</button><button type="button" data-k="8">70B</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>파라미터 N개에 Chinchilla 경험칙대로 20N 토큰을 주고, 학습 계산량을 6·N·D FLOPs로 셉니다. 학습 메모리는 혼합 정밀도 Adam의 파라미터당 16바이트(활성값 제외), 추론 가중치는 BF16 2바이트와 INT4 0.5바이트로 계산합니다. 손실은 Hoffmann 등(2022)의 적합식 값이고, 실제 학습 결과가 아닙니다.</p></details>`;
 const input=el.querySelector('#home-n');
 function update(){
  const P=SIZES[Number(input.value)],b=M.budget(P),need=M.minGpus(P,3),label=P<1?F(P*1000,0)+'M':F(P,0)+'B';
  el.querySelector('#home-n-value').textContent=label;
  el.querySelector('.home-graphic').innerHTML=U.bars(['학습 상태 16N','BF16 가중치','INT4 가중치'],[b.trainGB,b.bf16GB,b.int4GB],'GB (점선 = GPU 한 장 80GB)',80,1);
  el.querySelector('.home-result').innerHTML=`<b>${label}</b> 파라미터 · 학습 토큰 20N = <b>${tok(b.D)}</b> · 계산량 ${sci(b.flops)} FLOPs · 식의 손실 ${F(b.loss,3)}<br>`+
   (b.trainGB<=80?'학습 상태가 GPU 한 장에 들어갑니다.':`학습 상태만 ${F(b.trainGB,0)}GB라 ZeRO 3단계로 나눠도 80GB GPU가 최소 ${need}장 필요합니다.`)+(b.int4GB>80?' 4비트로 줄여도 추론에 GPU 여러 장이 필요합니다.':b.bf16GB>80?' 추론은 4비트로 줄이면 한 장에 들어갑니다.':' 추론 가중치는 한 장에 넉넉히 들어갑니다.');
 }
 const click=e=>{const b=e.target.closest('[data-k]');if(b){input.value=b.dataset.k;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
