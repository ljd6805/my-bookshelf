window.PGuides=(()=>{
'use strict';
const guides={
 why:['타입 단계와 DB 단계 중 어디에서 요청이 거절되는지 확인합니다.',[['정상',{'why-case':'normal'}],['고유 키 중복',{'why-case':'unique'}],['타입 오류',{'why-case':'type'}]],'Int 타입이 맞아도 고유 키 중복과 없는 부모 참조는 DB 상태에 따라 거절됩니다.'],
 schema:['관계 필드와 저장 열을 구분하고 참조의 유효성을 확인합니다.',[['정상 참조',{'schema-parent':1,'schema-duplicate':false}],['없는 부모',{'schema-parent':99,'schema-duplicate':false}],['중복 ID',{'schema-parent':1,'schema-duplicate':true}]],'기본값은 존재하는 Project 1을 참조하는 새 작업입니다.'],
 setup:['명령마다 schema·Client·DB 중 바뀌는 대상을 확인합니다.',[['필드만 추가',{schema:2,client:1,db:1}],['Client만 갱신',{schema:2,client:2,db:1}],['셋 모두 갱신',{schema:2,client:2,db:2}]],'필드 추가 뒤 generate와 migrate를 각각 눌러 보세요. db pull은 DB를 읽어 schema 쪽으로 반영합니다.'],
 crud:['필터를 적용한 행 수와 선택한 열 수를 따로 셉니다.',[['전체 작업',{'crud-project':'all','crud-status':'all','crud-fields':'all','crud-order':'asc'}],['완료 제목만',{'crud-project':'all','crud-status':'DONE','crud-fields':'title','crud-order':'asc'}],['빈 결과',{'crud-project':2,'crud-status':'DONE','crud-fields':'all','crud-order':'asc'}]],'전체는 3행 4열, 완료된 작업 제목만 고르면 1행 1열입니다.'],
 relations:['부모의 포함 조건과 반환할 자식의 조건을 구분합니다.',[['자식만 필터',{'relations-parent':'all','relations-child':'failed'}],['부모도 필터',{'relations-parent':'failed','relations-child':'failed'}],['모두 조회',{'relations-parent':'all','relations-child':'all'}]],'자식만 필터하면 Task 3개가 남습니다. some 조건까지 걸면 실패 Run이 있는 Task 1개만 남습니다.'],
 migrations:['기존 값과 구 버전 앱이 있는 상황에서 변경 순서를 비교합니다.',[['즉시 필수화',{'migrations-plan':'direct'}],['단계적 변경',{'migrations-plan':'expand'}],['먼저 삭제',{'migrations-plan':'drop'}]],'선택 열을 추가하고 값을 채운 뒤 제약을 강화합니다. 옛 열 삭제는 구 코드가 더 이상 쓰지 않는지 확인한 뒤 진행합니다.'],
 transactions:['부분 실패와 순차 중복 요청이 서로 다른 문제인지 확인합니다.',[['중복 방지',{'tx-atomic':true,'tx-fail':false,'tx-dedupe':true,'tx-repeat':2}],['부분 저장',{'tx-atomic':false,'tx-fail':true,'tx-dedupe':true,'tx-repeat':1}],['중복 저장',{'tx-atomic':true,'tx-fail':false,'tx-dedupe':false,'tx-repeat':2}]],'부분 저장 예제는 DONE/Run 0, 중복 저장 예제는 DONE/Run 2입니다.'],
 performance:['명시적으로 정한 두 조회 계획의 호출 횟수를 계산합니다.',[['작업 10개',{'perf-n':10,'perf-fields':4,'perf-offset':20}],['작업 100개',{'perf-n':100,'perf-fields':4,'perf-offset':20}],['열 줄이기',{'perf-n':10,'perf-fields':1,'perf-offset':20}]],'작업 10개에서 호출은 11회와 2회입니다. 열 수만 줄이면 이 계획의 호출 수는 그대로이고 반환 셀 수만 줄어듭니다. 페이지네이션은 별도의 고정 100행에서 10행을 고르는 모형입니다.'],
 testing:['타입이 맞는 ID도 프로젝트 경계를 넘는지 따로 검사합니다.',[['정상 요청',{'test-trusted':1,'test-owner':1,'test-id':'1','test-scope':true}],['다른 프로젝트',{'test-trusted':2,'test-owner':1,'test-id':'1','test-scope':true}],['잘못된 ID',{'test-trusted':1,'test-owner':1,'test-id':'abc','test-scope':true}]],'다른 프로젝트 예제에서 범위 검사를 끄면 모형의 변경 건수가 0에서 1로 바뀝니다.'],
 final:['세 실패 시나리오를 각각 막는 조건을 찾습니다.',[['세 조건 적용',{'final-atomic':true,'final-dedupe':true,'final-scope':true}],['중복 검사 빠짐',{'final-atomic':true,'final-dedupe':false,'final-scope':true}],['모두 빠짐',{'final-atomic':false,'final-dedupe':false,'final-scope':false}]],'체크 하나가 어떤 실패를 막는지 설명하고 실제 DB에서 수행할 추가 테스트를 적어 보세요.']
};
function mount(id,el){
 const [goal,examples,reading]=guides[id];
 const initial=[...el.querySelectorAll('input,select')].map(x=>[x.id,x.type==='checkbox'?x.checked:x.value]);
 const box=document.createElement('div');box.className='lab-guide';box.innerHTML=`<p><b>무엇을 확인하나요?</b> ${goal}</p><div class="buttons">${examples.map(([name],i)=>`<button type="button" data-preset="${i}" aria-pressed="false">${name}</button>`).join('')}<button type="button" data-reset>실험 초기화</button></div><details class="guide-reading"><summary>결과 읽기</summary><p>${reading}</p></details>`;el.before(box);
 function apply(values){for(const [key,v]of Object.entries(values)){const x=el.querySelector('#'+key);if(!x)continue;if(x.type==='checkbox')x.checked=!!v;else x.value=v;x.dispatchEvent(new Event('input',{bubbles:true}));}}
 box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;box.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed','false'));if(b.hasAttribute('data-reset')){apply(Object.fromEntries(initial));el.dispatchEvent(new Event('lab-reset'));}else{const values=examples[+b.dataset.preset][1];apply(values);if(id==='setup')el.dispatchEvent(new CustomEvent('lab-preset',{detail:values}));b.setAttribute('aria-pressed','true');}});
 el.addEventListener('input',()=>box.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed','false')));
}
return {guides,mount};
})();
