/* 표지의 살아 있는 실험: 말하기 속도와 답 길이로 낱말 수를 계산하고, 네 덩어리(도입 15%·세부 40%·예 30%·마무리 15%)로 나눈 답 막대를 그린다.
   비율은 이 책이 4장에서 쓰는 예시 비율이며 오픽이 정한 값이 아니다. */
window.OHome=(()=>{
const SHARE=[['open','도입',.15],['detail','세부',.40],['example','예·이야기',.30],['close','마무리',.15]];
function mount(el){
 const U=OUI,T=OText;
 el.innerHTML=`<div class="lab-top"><span>같은 길이로 답해도 말하는 속도에 따라 낱말 수는 얼마나 달라질까요?</span><span>PACE / 답 길이</span></div><div class="network-diagram home-bar"></div><div class="network-controls">${U.range('ho-rate','말하기 속도(낱말/분)',40,160,5,60)}${U.range('ho-sec','답 길이(초)',30,150,5,90)}<div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>낱말 수 = 속도 × 초 ÷ 60입니다. 막대는 그 낱말을 이 책이 4장에서 쓰는 네 덩어리 예시 비율(15·40·30·15%)로 나눈 것입니다. 오픽은 낱말 수로 채점하지 않습니다. 자기 녹음으로 속도를 재는 법은 10장에서 다룹니다.</p></details>`;
 const bar=el.querySelector('.home-bar'),out=el.querySelector('.home-result');
 const update=()=>{
  el.querySelectorAll('input[type=range]').forEach(x=>{el.querySelector('#'+x.id+'-value').textContent=x.value;});
  const rate=+el.querySelector('#ho-rate').value,sec=+el.querySelector('#ho-sec').value,w=Math.round(rate*sec/60);
  const rows=SHARE.map(([key,name,s])=>({key,name,seconds:sec*s,present:true}));
  bar.innerHTML=U.blocksBar(rows,{scale:150,label:`${sec}초 답의 네 덩어리`});
  out.innerHTML=`1분에 ${rate}낱말로 ${sec}초 말하면 약 <b>${w}낱말</b>, 한 문장을 12낱말로 잡으면 약 ${Math.max(1,Math.round(w/12))}문장입니다. 세부 덩어리에는 약 ${Math.round(w*.4)}낱말이 들어갑니다. ${U.KINDS.real}`;
 };
 el.addEventListener('input',update);update();
 return ()=>el.removeEventListener('input',update);
}
return {mount};
})();
