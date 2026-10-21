window.PHome={mount(el){
 el.innerHTML='<div class="lab-top"><span>LIVE QUERY / 합성 작업 3개</span><span>JS 모형</span></div><div class="home-model">'+PUI.select('home-status','조회할 상태',[['all','모든 상태'],['TODO','TODO만'],['DONE','DONE만']],'all')+'<div class="home-output"></div><p class="caption">where 조건을 바꾸면 반환 행이 달라집니다. 실제 Prisma 연결은 로컬 실습에서 실행합니다.</p></div>';
 const draw=()=>{const rows=PMath.query({status:el.querySelector('select').value});el.querySelector('.home-output').innerHTML=PUI.table(['ID','작업','상태'],rows.map(t=>[t.id,t.title,t.status]))+`<div class="home-count"><strong>${rows.length}</strong><span>반환된 작업 / 전체 3개</span></div>`;};el.querySelector('select').onchange=draw;draw();return ()=>{};
}};
