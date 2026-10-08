/* 표지 오른쪽의 살아 있는 대표 실험: 스킬 목록 예산. 실제 계산 결과를 그림과 글로 함께 보이고 슬라이더 하나로 조작한다. */
window.A14Home=(()=>{
function mount(el){
 const U=A14UI,M=A14Math,W=200000;
 el.innerHTML=`<div class="lab-top"><span>스킬 목록은 문맥에 얼마나 들어갈까</span><span>TOKENS</span></div><div class="home-graphic"></div><div class="network-controls">${U.range('home-n','설치한 스킬 수',1,300,1,50)}<div class="buttons"><button type="button" data-n="10">10개</button><button type="button" data-n="200">200개</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>문맥 창을 200k 토큰으로 두고, 스킬마다 이름과 설명만 약 100토큰씩 목록에 올린다고 계산합니다(Agent Skills 명세의 어림값). 목록 예산 2%는 원본 레슨 24가 소개한 한 호스트의 정책입니다(원본 커리큘럼 기준, 확인일 2026-10-08). 점진 공개는 목록에 고른 스킬 본문 하나(3,000토큰)와 참고 파일 하나(1,500토큰)를 더한 값이고, 이 두 값은 교육용 가정값입니다.</p></details>`;
 const input=el.querySelector('#home-n');
 function update(){
  const n=Number(input.value),r=M.disclosure(n,W);el.querySelector('#home-n-value').textContent=n;
  el.querySelector('.home-graphic').innerHTML=U.bars(['목록 전체','예산 2%','점진 공개'],[r.catalog,r.budget,r.progressive],'토큰',null,0);
  el.querySelector('.home-result').innerHTML=`목록 <b>${U.fmt(r.catalog,0)}</b>토큰 · 예산 안에 <b>${Math.min(n,r.fits)}</b>개, 빠지는 설명 <b>${r.omitted}</b>개 · 모두 올리면 창의 ${U.fmt(r.eagerShare*100,1)}%`;
 }
 const click=e=>{const b=e.target.closest('[data-n]');if(b){input.value=b.dataset.n;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
