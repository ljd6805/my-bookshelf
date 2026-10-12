/* 표지의 대표 실험: 폴로늄에서 출발해 걸음 수를 늘리며 마지막 질문의 답에 닿는지 실제 탐색으로 보여 준다. */
window.KGHome=(()=>{
const U=KGUI,G=KGGraph;
function mount(host){
 host.innerHTML=`<div class="lab-top"><span>폴로늄에서 몇 걸음이면 답에 닿을까?</span><span>사실 ${G.triples.length}개</span></div><div class="home-graph"></div><div class="network-controls">${U.range('home-hops','폴로늄에서 걸은 걸음 수',0,3,1,1)}<div class="buttons"><button data-hops="1">1걸음</button><button data-hops="2">2걸음</button><button data-hops="3">3걸음</button></div><div class="network-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>퀴리 가족 그래프에서 폴로늄을 출발점으로 너비 우선 탐색을 합니다. 밝은 점은 지금 걸음 수 안에 닿은 개체이고, 굵은 선은 함께 모인 사실입니다. 그다음 “폴로늄을 발견한 사람의 딸이 받은 상” 패턴이 모인 사실 안에서 완성되는지 확인합니다. 화살표 방향은 무시하고 양쪽으로 걷습니다.</p></details>`;
 const input=host.querySelector('#home-hops');
 const draw=()=>{
  const hops=+input.value,r=G.reach(G.triples,'polonium',hops),chain=G.chainComplete(r.used);
  host.querySelector('#home-hops-value').textContent=hops;
  host.querySelector('.home-graph').innerHTML=U.graph(G.triples,{on:new Set(Object.keys(r.dist)),edges:r.used,title:`폴로늄에서 ${hops}걸음 안에 닿은 그래프`});
  host.querySelector('.network-result').innerHTML=`${hops}걸음: 닿은 개체 <b>${r.count}</b>개 · 모인 사실 <b>${r.used.length}</b>개<br>${chain.length?`<b>답 완성</b>: ${U.label(chain[0]['?x'])} → 딸 ${U.label(chain[0]['?y'])} → <b>${U.label(chain[0]['?z'])}</b>`:'아직 “발견한 사람 → 딸 → 받은 상” 사슬이 이어지지 않았습니다.'}`;
  host.querySelectorAll('[data-hops]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.hops===hops)));
 };
 input.addEventListener('input',draw);
 host.querySelectorAll('[data-hops]').forEach(b=>b.onclick=()=>{input.value=b.dataset.hops;draw();});
 draw();
 return ()=>{};
}
return {mount};
})();
