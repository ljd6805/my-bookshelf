/* 표지 오른쪽의 대표 실험: 카페 8일 기록에 예측선을 직접 긋고 손실(MSE·RMSE)을 읽는다. 계산은 NCMath.lineLoss. */
window.NCHome=(()=>{
const M=NCMath,F=NCUI.fmt;
function chart(w,b){
 const D=M.LINE,X=x=>40+(x+0.5)*32.5,Y=y=>250-y*4.6;let s=`<path d="M40 250H300M40 20V250" stroke="var(--line)"/>`;
 [0,10,20,30,40,50].forEach(v=>s+=`<text x="34" y="${Y(v)+4}" text-anchor="end" font-size="12" fill="var(--muted)">${v}</text>`);
 D.x.forEach(x=>s+=`<text x="${X(x)}" y="266" text-anchor="middle" font-size="12" fill="var(--muted)">${20+x}℃</text>`);
 s+=`<defs><clipPath id="nc-home-clip"><rect x="40" y="20" width="260" height="230"/></clipPath></defs><g clip-path="url(#nc-home-clip)"><path d="M${X(-0.5)} ${Y(b-0.5*w)}L${X(7.5)} ${Y(b+7.5*w)}" stroke="var(--accent)" stroke-width="3"/>`;
 D.x.forEach((x,i)=>s+=`<path d="M${X(x)} ${Y(D.y[i])}V${Y(w*x+b)}" stroke="var(--orange)" stroke-width="2" stroke-dasharray="4 3"/>`);
 s+='</g>'+D.x.map((x,i)=>`<circle cx="${X(x)}" cy="${Y(D.y[i])}" r="5" fill="var(--blue)" stroke="var(--bg)"/>`).join('');
 return `<svg viewBox="0 0 312 276" role="img" aria-label="카페 8일 기록의 기온과 판매 점 여덟 개, 예측선, 점에서 선까지의 오차. 숫자는 아래 결과에 있습니다.">${s}</svg>`;
}
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>카페 8일 기록 · 예측선 긋기</span><span>REAL CALCULATION</span></div><div class="home-graphic nc-home-map"></div><div class="network-controls">${NCUI.range('home-w','기울기 w (기온 1℃에 늘어나는 잔 수)',0,8,0.05,2)}${NCUI.range('home-b','절편 b (20℃인 날의 잔 수)',0,24,0.5,8)}<div class="buttons"><button type="button" data-fit="1">MSE가 가장 작은 선</button><button type="button" data-fit="0">처음으로</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>기온이 20℃에서 27℃까지였던 여덟 날의 아이스 음료 판매(12, 15, 21, 22, 28, 33, 34, 41잔, 설명용 가상 값)에 선 ŷ = w·x + b를 긋습니다. 주황 점선은 날마다의 오차이고, MSE는 오차를 제곱해 평균한 값, RMSE는 그 제곱근(잔)입니다. 3장에서는 이 선을 손으로 찾지 않고 경사하강으로 찾습니다.</p></details>`;
 const iw=el.querySelector('#home-w'),ib=el.querySelector('#home-b'),best=M.lineFit(),bl=M.lineLoss(best.w,best.b);
 function update(){const w=Number(iw.value),b=Number(ib.value),l=M.lineLoss(w,b);
  el.querySelector('#home-w-value').textContent=w;el.querySelector('#home-b-value').textContent=b;el.querySelector('.home-graphic').innerHTML=chart(w,b);
  el.querySelector('.home-result').innerHTML=`ŷ = ${F(w)}·x + ${F(b,1)} · MSE <b>${F(l.mse)}</b> · RMSE <b>${F(l.rmse)}잔</b><br>${l.mse<=bl.mse*1.15?`가장 잘 맞는 선(w ${F(best.w)}, b ${F(best.b)}, MSE ${F(bl.mse)})과 거의 같습니다.`:l.bias<0?'예측이 평균적으로 실제보다 작습니다. w나 b를 키워 보세요.':'예측이 평균적으로 실제보다 큽니다. w나 b를 줄여 보세요.'}`;}
 const click=e=>{const t=e.target.closest('[data-fit]');if(!t)return;if(t.dataset.fit==='1'){iw.value=4.05;ib.value=11.5;}else{iw.value=2;ib.value=8;}update();};
 iw.addEventListener('input',update);ib.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{iw.removeEventListener('input',update);ib.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
