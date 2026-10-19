/* 표지의 살아 있는 실험: 원문을 모으지 않는 FedAvg가 라운드마다 중앙 학습에 얼마나 다가가는지. 실제 계산이다. */
window.FLHome=(()=>{
let cache=null;
function runs(){if(!cache){const M=FLMath,L=M.users(1);cache={f:M.train(L,{C:.1,E:5,B:10,rounds:40}),c:M.central(L,{epochs:40}),raw:M.rawBytes(L)};}return cache;}
function mount(el){
 const U=FLUI;
 el.innerHTML=`<div class="lab-top"><span>원문을 모으지 않는 FedAvg가 중앙 학습에 몇 라운드 만에 다가갈까</span><span>FEDAVG / 실제 계산</span></div><div class="home-graphic"></div><div class="network-controls">${U.range('home-r','라운드',1,40,1,10)}<div class="buttons"><button type="button" data-r="1">1라운드</button><button type="button" data-r="4">4라운드</button><button type="button" data-r="40">40라운드</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>합성 사용자 1,000명(이 책을 위해 지어낸 자료)의 기기에 학습 쌍을 둔 채, 라운드마다 100대가 모델을 받아 다섯 번 훑으며 학습하고 업데이트만 올립니다. 서버는 학습 쌍 수로 가중 평균합니다. 점선은 같은 자료를 서버에 모두 모아 학습한 중앙 학습입니다. 정확도는 시험 쌍 20,000개에서 첫 번째 추천이 맞은 비율입니다.</p></details>`;
 const input=el.querySelector('#home-r'),box=el.querySelector('.home-graphic');
 function update(){
  const r=Number(input.value),{f,c,raw}=runs(),sent=f.logs.slice(0,r).reduce((s,l)=>s+l.bytes,0);
  el.querySelector('#home-r-value').textContent=`${r}라운드`;
  box.innerHTML=U.lines([{name:'연합학습(FedAvg)',values:f.curve.slice(0,r)},{name:'중앙 학습',values:c.curve.slice(0,r),dash:true}],{ymin:.3,ymax:.7,ylabel:'첫 추천 적중률'});
  el.querySelector('.home-result').innerHTML=`${r}라운드 뒤 연합학습 <b>${U.fmt(f.curve[r-1],3)}</b>, 중앙 학습 ${U.fmt(c.curve[r-1],3)}. 기기를 떠난 원문 0바이트(중앙 학습은 ${U.bytes(raw)}), 모델과 업데이트로 오간 바이트 ${U.bytes(sent)}.`;
 }
 const click=e=>{const b=e.target.closest('[data-r]');if(b){input.value=b.dataset.r;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
