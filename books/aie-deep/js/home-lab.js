/* 표지 오른쪽의 살아 있는 대표 실험: 은닉 뉴런 수를 바꾸며 원 판별기를 실제로 학습시키고 판별 지도를 그린다. */
window.A04Home=(()=>{
const M=A04Math;
function map(r){
 const n=18,g=M.decisionGrid(r.net,'tanh',n),c=300/n;let b='';
 g.forEach((row,i)=>row.forEach((p,j)=>{b+=`<rect x="${j*c}" y="${i*c}" width="${c+.5}" height="${c+.5}" fill="${p>=0.5?'var(--accent)':'var(--blue)'}" opacity="${(0.12+Math.abs(p-0.5)*0.7).toFixed(2)}"/>`;}));
 const X=v=>150+v*150;
 b+=`<circle cx="150" cy="150" r="${0.8*150}" fill="none" stroke="var(--text)" stroke-width="2" stroke-dasharray="6 5"/>`;
 r.data.X.forEach((p,i)=>{b+=`<circle cx="${X(p[0]).toFixed(1)}" cy="${(150-p[1]*150).toFixed(1)}" r="4" fill="${r.data.Y[i]?'var(--accent)':'var(--blue)'}" stroke="var(--bg)" stroke-width="1"/>`;});
 return `<svg viewBox="-6 -6 312 312" role="img" aria-label="원 판별기의 판별 지도. 초록은 원 안, 파랑은 원 밖으로 판단한 영역이고 점선이 실제 원입니다.">${b}</svg>`;
}
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>원 판별기 · 은닉 뉴런 수</span><span>REAL TRAINING</span></div><div class="home-graphic a04-home-map"></div><div class="network-controls">${A04UI.range('home-width','은닉 뉴런 수',1,16,1,4)}<div class="buttons"><button type="button" data-w="1">뉴런 1개</button><button type="button" data-w="16">뉴런 16개</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>[-1, 1]² 안의 무작위 점 80개(반지름 0.8 원 안이면 1)로, 은닉층 하나(tanh)와 시그모이드 출력을 가진 망을 AdamW(η = 0.05)·전체 배치로 200번 실제 학습합니다. 정확도는 학습에 쓰지 않은 새 점 200개로 잽니다. 색은 격자마다 계산한 "원 안일 확률"이며, 시드 1로 고정한 한 번의 결과입니다.</p></details>`;
 const input=el.querySelector('#home-width');
 function update(){const w=Number(input.value),r=M.train({width:w,epochs:200,seed:1});
  el.querySelector('#home-width-value').textContent=w;el.querySelector('.home-graphic').innerHTML=map(r);
  el.querySelector('.home-result').innerHTML=`은닉 뉴런 <b>${w}개</b> · 새 점 정확도 <b>${A04UI.fmt(r.valAcc*100,1)}%</b> · 학습 손실 ${A04UI.fmt(r.trainLoss,3)}<br>${w<3?'경계가 직선 몇 개로 각져 원을 따라가지 못합니다.':w<8?'뉴런이 늘수록 경계가 원에 가까워집니다.':'경계가 원을 거의 따라갑니다. 더 늘리면 외우기(9장)를 걱정할 차례입니다.'}`;}
 const click=e=>{const b=e.target.closest('[data-w]');if(b){input.value=b.dataset.w;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
