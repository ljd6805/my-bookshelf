/* 표지 오른쪽의 살아 있는 대표 실험: 침묵 대기 시간을 바꾸면 말이 끝난 뒤 솔이의 첫 소리까지 몇 ms인지 실제로 더한다. */
window.A07Home=(()=>{
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>솔이가 대답하기까지</span><span>SILENCE → VOICE / ms</span></div><div class="home-graphic"></div><div class="network-controls">${A07UI.range('home-hang','침묵 대기 시간 (ms)',0,1500,50,700)}<div class="buttons"><button type="button" data-h="300">300 ms</button><button type="button" data-h="1200">1,200 ms</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>원본 레슨의 스트리밍 예산(마이크 20 + VAD 10 + 음성 인식 150 + LLM 첫 토큰 100 + TTS 첫 조각 100 + 출력 20 = 400 ms)에, 말이 멈춘 뒤 끝났다고 판정하기까지 기다리는 침묵 대기 시간을 더합니다. 사용자의 말 속 쉼은 300 ms와 650 ms라고 가정해, 대기 시간이 그보다 짧으면 말 중간에 끼어든 것으로 셉니다. 230·500·1,500 ms 기준은 원본 레슨이 든 사람의 체감 기준입니다. 단계별 값은 실제 측정이 아니라 예산표의 값입니다.</p></details>`;
 const input=el.querySelector('#home-hang');
 function update(){
  const h=Number(input.value),r=A07Math.turnLatency({ttsAfter:1,hangover:h}),cut=A07Math.hangoverRun([300,650],h).cuts,max=2000;
  const lanes=[['침묵 대기',h,'var(--orange)'],['처리 예산',r.total-h,'var(--blue)'],['합계',r.total,'var(--accent)']];
  el.querySelector('#home-hang-value').textContent=h;
  el.querySelector('.home-graphic').innerHTML=`<div class="home-chip"><span>“솔아, 타이머 오 분 맞춰 줘” 뒤</span><div class="memory-lanes">${lanes.map(([n,v,c])=>`<div><b>${n}</b><div><i style="width:${Math.min(100,v/max*100)}%;background:${c}"></i></div><strong>${A07UI.fmt(v,0)}</strong></div>`).join('')}</div><div class="home-total">${A07UI.fmt(r.total,0)}<small> ms · ${r.feel}</small></div></div>`;
  el.querySelector('.home-result').innerHTML=`침묵 대기 ${h} ms · 첫 소리까지 <b>${A07UI.fmt(r.total,0)} ms</b> · 말 중간 끼어듦 <b>${cut}번</b><br>${cut?'대기가 짧아 “음…” 같은 쉼에서 사용자의 말을 끊습니다.':r.total>1500?'끊지는 않지만 고장 난 듯이 늦습니다.':'쉼에서 끊지 않습니다. 대기를 줄일수록 빨라지지만 끼어들 위험이 커집니다.'}`;
 }
 const click=e=>{const b=e.target.closest('[data-h]');if(b){input.value=b.dataset.h;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
