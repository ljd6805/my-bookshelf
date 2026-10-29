/* 표지의 살아 있는 실험: 도구와 작업 폴더를 고르면 윤서의 저장소에서 읽히는 지침 파일 목록. 공식 문서의 찾기 규칙을 옮긴 실제 계산이다. */
window.HNHome=(()=>{
function mount(el){
 const M=HNMath,U=HNUI,NAMES={claude:'Claude Code',codex:'Codex'};let tool='claude';
 el.innerHTML=`<div class="lab-top"><span>어떤 지침 파일이 읽힐까</span><span>booking-app / 실제 계산</span></div><div class="home-graphic"></div><div class="network-controls">${U.select('home-cwd','실행한 작업 폴더',M.DIRS.map(d=>[d,d||'저장소 루트']),'apps/api')}<div class="buttons"><button type="button" data-tool="claude" aria-pressed="true">Claude Code</button><button type="button" data-tool="codex" aria-pressed="false">Codex</button></div><div class="home-result" role="status" aria-live="polite"></div></div><details class="network-explain"><summary>무엇을 계산하나요?</summary><p>윤서의 저장소 booking-app에는 지침 파일이 아홉 개 있습니다(개인 파일 둘, 루트 셋, 하위 폴더 넷). 고른 도구가 그 작업 폴더에서 세션을 시작할 때 읽는 파일을, Claude Code·Codex 공식 문서(확인일 2026-10-29)의 찾기 규칙대로 계산합니다. Claude Code는 기본 설정, 루트 CLAUDE.md가 @AGENTS.md를 가져오는 경우입니다. 저장소와 파일 내용은 이 책이 지은 예입니다.</p></details>`;
 const cwd=el.querySelector('#home-cwd'),box=el.querySelector('.home-graphic');
 function update(){
  const r=M.load(tool,{cwd:cwd.value,local:true}),ids=new Set(r.loaded.map(o=>o.file.id));
  box.innerHTML=`<ul class="hn-tree" aria-label="읽히는 파일">${M.FILES.filter(f=>f.id!==(tool==='claude'?'user-codex':'user-claude')).map(f=>`<li class="${ids.has(f.id)?'on':'off'}"><span>${U.esc(f.path)}</span><span class="badge">${ids.has(f.id)?'읽음':'—'}</span></li>`).join('')}</ul>`;
  el.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===tool)));
  el.querySelector('.home-result').innerHTML=`${NAMES[tool]}를 ${U.esc(cwd.value||'저장소 루트')}에서 시작하면 지침 파일 <b>${r.loaded.length}개</b>(${U.int(r.bytes)}바이트)를 읽습니다. 같은 저장소라도 도구와 작업 폴더에 따라 목록이 달라집니다.`;
 }
 const click=e=>{const b=e.target.closest('[data-tool]');if(b){tool=b.dataset.tool;update();}};
 cwd.addEventListener('input',update);el.addEventListener('click',click);update();
 return ()=>{cwd.removeEventListener('input',update);el.removeEventListener('click',click);};
}
return {mount};
})();
