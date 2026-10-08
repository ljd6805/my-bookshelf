/* 표지 오른쪽의 살아 있는 대표 실험: 두 후보 상자의 IoU와 NMS 판정을 실제로 계산한다. */
window.A05Home=(()=>{
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>같은 자전거를 두 번 찾았을까?</span><span>IoU · NMS 0.45</span></div><div class="home-graphic"></div><div class="network-controls">${A05UI.range('home-shift','둘째 상자를 오른쪽으로 민 거리 (px)',0,160,5,40)}<div class="buttons"><button type="button" data-shift="10">거의 겹침</button><button type="button" data-shift="120">옆 자전거</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>첫 상자 A는 (60, 70)–(220, 190), 둘째 상자 B는 같은 크기를 오른쪽으로 민 것입니다. IoU = 교집합 넓이 / 합집합 넓이를 계산하고, NMS 임계값 0.45보다 크면 점수가 낮은 B를 같은 물체의 중복으로 보고 지웁니다. 상자 좌표는 예시이고 계산은 실제입니다.</p></details>`;
 const input=el.querySelector('#home-shift');
 function update(){
  const d=Number(input.value),A=[60,70,220,190],B=[60+d,80,220+d,200],iou=A05Math.iou(A,B),drop=iou>0.45;
  const w=Math.max(0,Math.min(A[2],B[2])-Math.max(A[0],B[0])),h=Math.max(0,Math.min(A[3],B[3])-Math.max(A[1],B[1]));
  el.querySelector('#home-shift-value').textContent=d;
  el.querySelector('.home-graphic').innerHTML=`<svg viewBox="0 0 440 230" role="img" aria-label="두 상자의 IoU ${A05UI.fmt(iou,2)}, ${drop?'NMS가 둘째 상자를 지움':'두 상자 모두 남음'}"><rect x="0" y="0" width="440" height="230" rx="8" fill="var(--panel2)"/><path d="M0 205H440" stroke="var(--line)" stroke-width="2"/>${w&&h?`<rect x="${Math.max(A[0],B[0])}" y="${Math.max(A[1],B[1])}" width="${w}" height="${h}" fill="var(--accent)" opacity=".35"/>`:''}<rect x="${A[0]}" y="${A[1]}" width="160" height="120" fill="none" stroke="var(--accent)" stroke-width="3"/><text x="${A[0]+6}" y="${A[1]-8}" font-size="15">A 0.91</text><rect x="${B[0]}" y="${B[1]}" width="160" height="120" fill="none" stroke="var(--orange)" stroke-width="3" ${drop?'stroke-dasharray="7 5" opacity=".7"':''}/><text x="${Math.min(B[0]+6,360)}" y="${B[3]+20}" font-size="15">B 0.74${drop?' · 지움':' · 남김'}</text></svg>`;
  el.querySelector('.home-result').innerHTML=`교집합 ${w}×${h} = ${w*h}px² · IoU <b>${A05UI.fmt(iou,2)}</b><br>${drop?'0.45보다 커서 B는 A의 중복으로 지워집니다.':'0.45 이하라 B는 다른 물체로 남습니다.'}`;
 }
 const click=e=>{const b=e.target.closest('[data-shift]');if(b){input.value=b.dataset.shift;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
