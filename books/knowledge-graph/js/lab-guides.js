/* 비교 조건과 해석을 실험 바로 위에 둔다. 예제 선택은 실제 입력 이벤트를 사용한다(AI Book과 같은 방식). */
window.KGGuides=(()=>{
const guides={
triples:['문장을 하나씩 더할 때 점·간선·떨어진 덩어리의 수가 어떻게 바뀌는지 확인합니다.',[['문장 4개',{facts:4}],['문장 6개',{facts:6}],['문장 9개',{facts:9}],['21개 모두',{facts:21}]],'문장 4개까지는 서로 다른 사람과 장소라서 덩어리가 네 개입니다. 6번째 문장 “이렌은 마리의 딸”이 두 덩어리를 잇고, 9번째에서 하나가 됩니다. 이미 있는 이름을 다시 쓰는 문장은 점을 늘리지 않고 간선만 더합니다.'],
walk:['걸음 수를 늘리며 폴로늄에서 닿는 점과 1935 화학상까지의 최단 경로를 확인합니다.',[['1걸음',{start:'polonium',hops:1,target:'nobel1935'}],['2걸음',{start:'polonium',hops:2,target:'nobel1935'}],['3걸음',{start:'polonium',hops:3,target:'nobel1935'}]],'폴로늄에서 1걸음에 3개, 2걸음에 9개, 3걸음에 13개의 점에 닿습니다. 1935 화학상은 3걸음에서 처음 닿고, 그때 모인 사실은 21개 전부입니다. 필요한 사실보다 훨씬 많은 사실이 함께 따라온다는 점을 눈여겨보세요.'],
resolve:['이름의 글자 조각만으로 같은 사람을 묶을 때 문턱에 따라 어떤 오류가 생기는지 비교합니다.',[['낮은 문턱 0.15',{threshold:.15,method:'name'}],['중간 문턱 0.5',{threshold:.5,method:'name'}],['높은 문턱 0.7',{threshold:.7,method:'name'}],['식별자 사용',{threshold:.5,method:'id'}]],'문턱 0.15에서는 “curie”와 “퀴리” 조각 때문에 마리·피에르·이렌이 두 묶음에 섞입니다. 0.5에서도 “M. Curie”와 “P. Curie”(J 0.67)가 붙어 마리와 피에르가 섞입니다. 0.7에서는 섞임이 없지만 아홉 이름이 모두 따로 떨어집니다. 어떤 문턱도 정답(세 사람, 섞임 0)을 만들지 못하고, 식별자 표만 정확히 묶습니다.'],
schema:['관계의 정의역·치역 규칙이 어떤 트리플을 잡아내고, RDFS에서는 같은 규칙이 무엇을 결론으로 내는지 비교합니다.',[['맞는 트리플',{subject:'marie',predicate:'awarded',object:'nobel1911',mode:'validate'}],['목적어 위반',{subject:'marie',predicate:'awarded',object:'paris',mode:'validate'}],['RDFS로 보기',{subject:'marie',predicate:'awarded',object:'paris',mode:'rdfs'}]],'과학자는 사람의 하위 클래스이므로 마리는 “수상”의 주어 규칙을 통과합니다. 목적어가 파리이면 검사 모드는 위반을 보고하지만, RDFS 모드는 “파리는 상이다”라는 결론을 냅니다. 같은 규칙이 쓰는 방식에 따라 다르게 작동합니다.'],
infer:['규칙과 라운드 수를 바꾸며 새 사실이 몇 개 생기고 언제 고정점에 도달하는지 확인합니다.',[['위치 1라운드',{rules:'located',rounds:1}],['위치 2라운드',{rules:'located',rounds:2}],['세 규칙 고정점',{rules:'all',rounds:3}]],'위치 규칙은 1라운드에 5개(마리·피에르·이렌이 태어난 나라, 바르샤바·파리가 속한 유럽)를, 2라운드에 3개(세 사람이 유럽에서 태어남)를 만들고 멈춥니다. 세 규칙을 모두 켜면 9개, 3개가 생긴 뒤 3라운드에는 새 사실이 없습니다. 점선이 추론으로 생긴 사실입니다.'],
query:['패턴을 한 줄에서 두 줄로 늘리고 추론을 포함할 때 답이 어떻게 달라지는지 확인합니다.',[['발견한 사람',{p1:'discovered',o1:'polonium',p2:'none',reason:'no'}],['그 사람의 배우자',{p1:'discovered',o1:'polonium',p2:'spouse',reason:'no'}],['추론 포함',{p1:'discovered',o1:'polonium',p2:'spouse',reason:'yes'}]],'패턴 한 줄이면 마리와 피에르 두 명입니다. 배우자 패턴을 더하면 적힌 사실만으로는 “마리 배우자 피에르” 하나만 맞습니다. 추론을 포함하면 대칭 규칙이 “피에르 배우자 마리”를 더해 답이 두 개가 됩니다.'],
extract:['확신도 문턱을 움직이며 정밀도와 재현율이 어떻게 맞바뀌는지 확인합니다.',[['느슨한 문턱 0.30',{cut:.3}],['중간 문턱 0.50',{cut:.5}],['엄격한 문턱 0.85',{cut:.85}]],'문턱 0.30이면 맞는 사실 9개를 모두 넣지만 틀린 후보 3개도 들어옵니다(정밀도 75.0%). 0.50에서는 정밀도와 재현율이 모두 88.9%입니다. 0.85에서는 넣은 3개가 모두 맞지만 재현율은 33.3%로 떨어집니다. 점수가 0.62인 틀린 후보 때문에 어떤 문턱도 완벽하지 않습니다.'],
transe:['관계 화살표 r을 움직여 학습 쌍 네 개의 거리와 처음 보는 마드리드의 순위가 어떻게 바뀌는지 확인합니다.',[['화살표 없음 · 바르샤바',{rx:0,ry:0,head:'warsaw'}],['학습된 화살표 · 마드리드',{rx:1.5,ry:1.2,head:'madrid'}],['틀린 방향 · 베를린',{rx:1.5,ry:-.5,head:'berlin'}]],'화살표가 0이면 바르샤바 자리에서 가장 가까운 나라는 스페인이고 폴란드는 5위입니다. 네 쌍의 평균 화살표(약 1.5, 1.2)를 쓰면 학습 쌍 네 개를 모두 1위로 맞히고, 처음 보는 마드리드도 스페인을 1위로 고릅니다. 방향이 틀리면 베를린에서 독일이 5위로 떨어집니다. 좌표는 손으로 정한 2차원 예시입니다.'],
graphrag:['같은 질문을 문장 검색과 그래프 걷기로 풀 때 근거 사슬이 언제 완성되고 문맥이 얼마나 커지는지 비교합니다.',[['둘 다 좁게',{k:3,ghops:2,limit:'all'}],['그래프 3걸음',{k:3,ghops:3,limit:'all'}],['관계를 좁힌 3걸음',{k:3,ghops:3,limit:'asked'}],['문장 12개',{k:12,ghops:2,limit:'all'}]],'문장 검색은 “폴로늄·발견”이 많은 문장부터 가져와서, 이렌의 수상 문장은 12번째에야 들어옵니다. 그래프는 3걸음에서 사슬이 완성되지만 모든 관계를 따라가면 사실 21개 전부를 문맥에 넣습니다. 질문의 관계(발견·자녀·수상)만 따라가면 사실 11개로 같은 답을 얻습니다.']
};
function mount(id,el){
 const [purpose,presets,interpretation]=guides[id],host=el.parentElement;
 const box=document.createElement('div');box.className='lab-guide';
 box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" aria-label="비교 예제">${presets.map((p,i)=>`<button data-preset="${i}">${p[0]}</button>`).join('')}<button data-initialize>실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${interpretation}</p>`;
 host.insertBefore(box,el);
 box.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-initialize')){KGLabs[id](el);box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));return;}
 const [,values,action]=presets[+b.dataset.preset];for(const [key,value] of Object.entries(values))el.querySelector('#'+key).value=value;
 el.querySelector('#'+Object.keys(values)[0]).dispatchEvent(new Event('input',{bubbles:true}));if(action)el.querySelector('#'+action).click();
 box.querySelectorAll('[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 };
 el.addEventListener('input',e=>{if(e.isTrusted)box.querySelectorAll('[aria-pressed]').forEach(x=>x.removeAttribute('aria-pressed'));});
}
return {mount,guides};
})();
