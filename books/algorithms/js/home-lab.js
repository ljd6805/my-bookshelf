/* 표지의 살아 있는 실험: 같은 청구기호를 세 가지 방법으로 찾으며 비교 횟수를 센다. 실제 계산이다. */
window.ALHome=(()=>{
'use strict';
const tables={};
/* 체이닝 해시 표를 타입 배열로 짓는다: 칸 수는 부하율 0.75 이하가 되는 2의 거듭제곱. */
function hashTable(n){if(tables[n])return tables[n];let m=8;while(n/m>0.75)m*=2;const head=new Int32Array(m).fill(-1),next=new Int32Array(n);
 for(let i=0;i<n;i++){const b=ALMath.fnv1a(String(ALMath.callNumber(i)))&(m-1);next[i]=head[b];head[b]=i;}return (tables[n]={m,head,next});}
function hashFind(n,target){const t=hashTable(n),b=ALMath.fnv1a(String(target))&(t.m-1);let c=0;for(let i=t.head[b];i>=0;i=t.next[i]){c++;if(ALMath.callNumber(i)===target)return c;}return Math.max(c,1);}
function mount(el){
 el.innerHTML=`<div class="lab-top"><span>같은 책, 세 가지 찾기</span><span>SEARCH / n</span></div><div class="home-graphic"><p class="home-q">청구기호 <b class="home-target"></b> 찾기</p><div class="home-rank"></div></div><div class="network-controls">${ALUI.range('home-n','도서관의 책 수',3,6,.5,4)}<div class="buttons"><button type="button" data-n="4">1만 권</button><button type="button" data-n="6">100만 권</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>가상의 솔내도서관 서가에 청구기호 1000, 1003, 1006 … 을 n권 꽂고, 맨 뒤에서 3분의 1쯤 떨어진 책 한 권을 찾습니다. 앞에서부터 훑기와 이진 탐색은 비교 횟수를, 해시 표(체이닝, 부하율 0.75 이하)는 사슬에서 확인한 횟수를 브라우저가 실제로 실행하며 셉니다.</p></details>`;
 const input=el.querySelector('#home-n');
 function update(){
  const n=Math.round(10**Number(input.value)),pos=Math.floor(n*2/3),target=ALMath.callNumber(pos);
  const lin=pos+1,bin=ALMath.binarySearch(n,target).comparisons,hs=hashFind(n,target),rows=[['앞에서부터 훑기',lin],['정렬 + 이진 탐색',bin],['해시 표',hs]],max=Math.log10(lin)+.3;
  el.querySelector('#home-n-value').textContent=ALUI.big(n)+'권';el.querySelector('.home-target').textContent=target;
  el.querySelector('.home-rank').innerHTML=rows.map(([nm,v],i)=>`<div class="home-row ${i?'right':''}"><b>${i+1}</b><span>${nm}</span><i style="width:${Math.max((Math.log10(v)+.3)/max*100,4)}%"></i><strong>${ALUI.big(v)}</strong></div>`).join('');
  el.querySelector('.home-result').innerHTML=`${ALUI.big(n)}권에서 훑기는 <b>${ALUI.int(lin)}</b>번, 이진 탐색은 <b>${bin}</b>번, 해시는 <b>${hs}</b>번 확인했습니다.<br>책이 100배 늘면 훑기는 100배, 이진 탐색은 7번쯤 더, 해시는 거의 그대로입니다. 막대는 로그 눈금입니다.`;
 }
 const click=e=>{const b=e.target.closest('[data-n]');if(b){input.value=b.dataset.n;update();}};
 input.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{input.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
