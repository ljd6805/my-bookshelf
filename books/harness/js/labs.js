/* 열두 실험. 찾기·합치기·크기·점검 계산은 HNMath가 브라우저에서 실제로 하고, 저장소와 작업·기록은 이 책이 지은 예다.
   모델이 지침을 따르는지는 계산하지 않는다. 화면 글은 실험이 실제 계산인지 시나리오인지 app.js의 KIND가 밝힌다. */
(()=>{
'use strict';
const M=HNMath,U=HNUI,L=HNLabs,esc=U.esc;
const TOOLS=[['claude','Claude Code · 기본 설정'],['claude-and','Claude Code · 둘 다 읽기 설정'],['claude-only','Claude Code · CLAUDE.md만 읽기 설정'],['codex','Codex']];
const DIRS=M.DIRS.map(d=>[d,d?`booking-app/${d}`:'booking-app (저장소 루트)']);
const TOUCH=[['','(아무 파일도 열지 않음)'],['apps/web/src/page.tsx','apps/web/src/page.tsx'],['apps/api/src/routes.ts','apps/api/src/routes.ts'],['packages/ui/src/Button.tsx','packages/ui/src/Button.tsx']];
const toolName=t=>TOOLS.find(x=>x[0]===t)[1];
/* 읽힌 파일과 빠진 파일을 한 목록으로: 순번·파일·언제·이유. */
function tree(r){
 const on=r.loaded.map((o,i)=>`<li class="on"><span>${i+1}. ${esc(o.file.path)}${o.depth?' (가져옴)':''}${o.cut?' · 한도에 걸림':''}</span><span class="badge">${esc(o.when)}</span></li><li><span class="caption">${esc(o.why)}</span></li>`).join('');
 const off=r.skipped.filter(s=>s.file).map(s=>`<li class="off"><span>${esc(s.file.path)}</span><span class="badge">읽지 않음</span></li><li><span class="caption">${esc(s.why)}</span></li>`).join('');
 const notes=r.skipped.filter(s=>!s.file).map(s=>`<li><span class="caption">※ ${esc(s.why)}</span></li>`).join('');
 return `<ul class="hn-tree" aria-label="읽힌 파일과 읽지 않은 파일">${on}${off}${notes}</ul>`;
}
L.session=el=>{
 U.setup(el,U.check('file','저장소에 지침 파일(AGENTS.md)이 있음',false)+U.select('sess','다음 작업을 여는 세션',[['new','다음 날 새 세션'],['same','어제 대화를 이어 가는 같은 세션']],'new'));
 U.bind(el,()=>{
  const file=el.querySelector('#file').checked,session=el.querySelector('#sess').value,rows=M.sessionFacts({file,session}),known=rows.filter(r=>r.known).length;
  const fromFile=rows.filter(r=>r.from==='지침 파일').length,lost=rows.filter(r=>!r.known);
  U.result(el,U.table(['사실','에이전트가 아는가','어디서 알았나'],rows.map(r=>[r.text,r.known?'안다':'모른다',r.from||'—']),i=>rows[i].known),
   `세션을 시작할 때 에이전트는 사실 여섯 개 가운데 <b>${known}개</b>를 압니다. 저장소를 읽어 아는 것이 ${rows.filter(r=>r.from==='저장소').length}개, 지침 파일에서 아는 것이 ${fromFile}개${session==='same'?', 지난 대화에서 아는 것이 '+rows.filter(r=>r.from==='지난 대화').length+'개':''}입니다.`+
   (lost.length?`<br>모르는 사실: ${lost.map(r=>esc(r.text)).join(' · ')}. ${session==='new'?'새 세션에는 어제 대화가 들어가지 않습니다.':''}${!file?' 지침 파일이 없으면 저장소에 적히지 않은 명령과 함정도 모릅니다.':''}`:'<br>같은 세션이라 어제 대화도 컨텍스트에 남아 있습니다. 세션이 끝나면 이 사실은 사라집니다.'));
 });
};
L.discovery=el=>{
 U.setup(el,U.select('tool','도구와 설정',TOOLS,'claude')+U.select('cwd','실행한 작업 폴더',DIRS,'')+U.select('touch','작업 중에 연 파일',TOUCH,'')+U.check('rootc','루트에 CLAUDE.md가 있음 (첫 줄 @AGENTS.md)',true));
 U.bind(el,()=>{
  const tool=el.querySelector('#tool').value,cwd=el.querySelector('#cwd').value,touched=el.querySelector('#touch').value||null,rootClaude=el.querySelector('#rootc').checked;
  const r=M.load(tool,{cwd,touched,rootClaude});
  U.result(el,tree(r),`${esc(toolName(tool))}, 작업 폴더 ${esc(cwd||'저장소 루트')}: 지침 파일 <b>${r.loaded.length}개</b>가 읽힙니다(시작할 때 ${r.startup}개${r.onDemand?`, 작업 중 ${r.onDemand}개`:''}, 합계 ${U.int(r.bytes)}바이트). 읽지 않은 프로젝트 파일은 ${r.skipped.filter(s=>s.file).length}개입니다.`+
   (tool==='codex'?'<br>Codex는 실행할 때 한 번 목록을 만들고, 작업 중에 연 파일의 폴더는 다시 보지 않습니다.':'<br>Claude Code는 작업 중에 하위 폴더의 파일을 열면 그 폴더의 CLAUDE.md를 더 읽습니다.'));
 });
};
L.order=el=>{
 U.setup(el,U.select('tool','도구와 설정',[['codex','Codex'],['claude','Claude Code · 기본 설정'],['claude-and','Claude Code · 둘 다 읽기 설정']],'codex')+U.select('cwd','실행한 작업 폴더',DIRS,'apps/api')+U.check('ovr','apps/api에 임시 AGENTS.override.md가 있음',false));
 U.bind(el,()=>{
  const tool=el.querySelector('#tool').value,cwd=el.querySelector('#cwd').value,override=el.querySelector('#ovr').checked;
  const r=M.load(tool,{cwd,override}),cs=M.conflicts(r),hot=new Set(cs.flatMap(c=>c.rows.map(x=>x.text)));
  const merged=r.loaded.map((o,i)=>`<span class="head"># ${i+1}. ${esc(o.file.path)}</span>\n${o.file.rules.map(x=>hot.has(x.text)?`<mark>${esc(x.text)}</mark>`:esc(x.text)).join('\n')}`).join('\n\n');
  const say=cs.map(c=>`주제 “${esc(M.TOPIC_NAMES[c.topic]||c.topic)}”: ${c.rows.map(x=>`${esc(x.file.path)}의 <code>${esc(x.value)}</code>`).join(', ')} → 합친 글의 마지막 줄은 ${esc(c.last.file.path)}${c.declared?'. 이 줄은 “루트의 pnpm test를 대신한다”고 적어 두어 어느 줄을 따를지 글에 드러납니다':'. 어느 줄을 대신하는지 적혀 있지 않습니다'}`).join('<br>');
  U.result(el,`<pre class="hn-merged" aria-label="루트 쪽부터 이어 붙인 지침">${merged}</pre>`,`파일 ${r.loaded.length}개를 루트 쪽부터 이어 붙였습니다. 같은 주제를 다른 값으로 말하는 곳은 <b>${cs.length}개</b>입니다.${cs.length?'<br>'+say+(tool==='codex'?'<br>Codex 문서는 뒤에 오는 가까운 파일이 앞의 지침을 덮어쓴다고 설명합니다.':'<br>Claude Code 문서는 부딪히는 두 지시 가운데 하나를 임의로 고를 수 있다고 적습니다.'):'<br>같은 주제를 다르게 말하는 줄이 함께 들어가지 않았습니다.'}`);
 });
};
L.budget=el=>{
 U.setup(el,U.select('lang','지침을 쓴 언어',[['ko','한국어 (한 줄 64자)'],['en','영어 (한 줄 81자)']],'ko')+U.range('rootN','루트 AGENTS.md 줄 수',50,600,25,100)+U.range('subN','apps/api/AGENTS.md 줄 수',50,600,25,100)+U.select('win','Claude Code 컨텍스트 창',[['200k','20만 토큰 (하위 폴더 파일 40,000자)'],['1m','100만 토큰 (150,000자로 계산)']],'200k'));
 U.bind(el,()=>{
  const lang=el.querySelector('#lang').value,rootLines=U.value(el,'rootN'),subLines=U.value(el,'subN'),windowSize=el.querySelector('#win').value;
  const b=M.budget({lang,rootLines,subLines,windowSize}),c=b.codex,cum=[b.user,b.user+b.root.bytes,b.codexTotal];
  const status=id=>{const o=c.loaded.find(x=>x.file.id===id);return o?(o.cut?'한도에 걸림':'들어감'):'빠짐';},verb={'들어감':'들어갑니다','한도에 걸림':'한도에 걸립니다','빠짐':'아예 빠집니다'};
  const chart=U.bars(['개인','+ 루트','+ apps/api'],cum,{digits:0,limit:b.codexLimit,limitLabel:'32,768바이트',show:(v,i)=>`${U.int(v)}B ${['들어감',status('root-agents'),status('api-agents')][i].replace('한도에 ','')}`});
  U.result(el,chart,`한 줄이 ${b.lineChars}자, <b>${b.lineBytes}바이트</b>입니다(글자당 ${U.fmt(b.bytesPerChar,2)}바이트). 개인 파일과 두 지침 파일을 모두 더하면 <b>${U.int(b.codexTotal)}바이트</b>로 Codex 한도 ${U.int(b.codexLimit)}바이트의 ${U.pct(b.codexTotal/b.codexLimit,0)}입니다. Codex를 apps/api에서 실행하면 앞에서부터 이어 붙이다 한도에 닿는 곳에서 멈춥니다. 루트 파일은 ${verb[status('root-agents')]}. apps/api 파일은 <b>${verb[status('api-agents')]}</b>.`+
   `<br>Claude Code: 루트 파일 ${rootLines}줄은 ${b.claudeRootWarn?'200줄 권고를 넘지만 통째로 들어갑니다':'200줄 권고 안입니다'}. apps/api 파일의 글을 작업 중에 읽는 하위 폴더 CLAUDE.md로 두면 ${U.int(b.sub.chars)}자${b.subDelivered<1?' 가운데 ':'로 '} ${b.subDelivered<1?`${U.int(b.claudeSubLimit)}자까지만 들어가고 뒤쪽 약 ${b.subMissingLines}줄은 Read로 따로 읽기 전까지 보이지 않습니다`:`한도 ${U.int(b.claudeSubLimit)}자 안이라 모두 들어갑니다`}.`);
 });
};
L.bridge=el=>{
 U.setup(el,U.select('cl','루트 CLAUDE.md를 두는 방식',[['import','첫 줄에 @AGENTS.md'],['sentence','“AGENTS.md를 읽어라” 문장만'],['symlink','AGENTS.md로 가는 심볼릭 링크'],['none','CLAUDE.md 없음']],'import')+U.check('loc','개인 메모용 CLAUDE.local.md가 있음',false)+U.select('set','Project instructions 설정',[['claude-md-or-agents-md','claude-md-or-agents-md (기본)'],['claude-md-and-agents-md','claude-md-and-agents-md'],['claude-md','claude-md']],'claude-md-or-agents-md')+U.range('hops','@가져오기로 이어 가져온 파일 수',1,6,1,2));
 U.bind(el,()=>{
  const claude=el.querySelector('#cl').value,local=el.querySelector('#loc').checked,setting=el.querySelector('#set').value,n=U.value(el,'hops');
  const b=M.bridge({claude,local,setting}),ch=M.importChain(n),lost=ch.filter(x=>!x.loaded).length,hasChain=claude==='import'||claude==='symlink';
  const chain=`<p class="caption">Claude Code가 읽는 순서</p><div class="hn-chain">${b.reads.length?b.reads.map(x=>`<span class="on">${esc(x)}</span>`).join(''):'<span class="off">(지침 없음)</span>'}${b.agents?'':'<span class="off">AGENTS.md</span>'}</div>${hasChain?`<p class="caption">CLAUDE.md에서 시작한 @가져오기 사슬 (최대 네 홉)</p><div class="hn-chain"><span class="on">CLAUDE.md</span>${ch.map(x=>`<span class="${x.loaded?'on':'off'}">${x.hop}홉 · ${esc(x.name)}</span>`).join('')}</div>`:'<p class="caption">이 방식에는 CLAUDE.md에서 시작하는 @가져오기 사슬이 없습니다</p>'}`;
  U.result(el,chain,`설정 ${esc(setting)}에서 Claude Code가 읽는 파일: <b>${esc(b.label)}</b>. AGENTS.md의 규칙은 ${b.agents?'<b>컨텍스트에 들어갑니다</b>':'<b>컨텍스트에 없습니다</b>'}.${b.notes.length?'<br>'+b.notes.map(esc).join('<br>'):''}<br>${hasChain?`이어 가져온 파일 ${n}개 가운데 ${n-lost}개가 들어가고${lost?` ${lost}개(${ch.filter(x=>!x.loaded).map(x=>x.hop+'홉').join(', ')})는 네 홉 한도를 넘어 들어가지 않습니다`:', 모두 네 홉 안입니다'}.`:'CLAUDE.md에 @가져오기 줄이 없어 가져온 파일 수는 이 방식에 영향을 주지 않습니다.'}`);
 });
};
L.enforce=el=>{
 U.setup(el,M.RULES6.map(r=>U.select('p-'+r.id,r.text,Object.entries(M.PLACES),'md')).join(''));
 U.bind(el,()=>{
  const choices=Object.fromEntries(M.RULES6.map(r=>[r.id,el.querySelector('#p-'+r.id).value])),s=M.placementScore(choices);
  U.result(el,U.table(['규칙','고른 자리','판정'],s.rows.map(r=>[r.rule.text,M.PLACES[r.choice],r.ok?'맞음':'다시']),i=>s.rows[i].ok),
   `여섯 규칙 가운데 <b>${s.ok}개</b>를 알맞은 자리에 두었습니다.<br>${s.rows.filter(r=>!r.ok).slice(0,2).map(r=>`“${esc(r.rule.text)}”: ${esc(r.why)}`).join('<br>')||'모두 맞았습니다. 예외가 있는 둘은 지침에, 나머지 넷은 하네스가 적용하는 자리에 두었습니다.'}`);
 });
};
L.length=el=>{
 U.setup(el,Object.entries(M.SECTIONS).map(([k,s])=>U.check('s-'+k,`${s.name} · ${s.lines}줄`,true)).join(''));
 U.bind(el,()=>{
  const on=Object.fromEntries(Object.keys(M.SECTIONS).map(k=>[k,el.querySelector('#s-'+k).checked])),m=M.taskModel(on);
  const chart=U.table(['작업','풀림','빠진 사실'],m.rows.map(r=>[r.name,r.ok?'풀림':'막힘',r.missing.map(n=>M.FACT_NAMES[n]).join(', ')||'—']),i=>m.rows[i].ok);
  U.result(el,chart,`지침 ${m.lines}줄(${U.int(m.bytes)}바이트)로 작업 열두 개 가운데 <b>${m.solved}개</b>가 풀립니다. 작업마다 지침 ${U.int(m.bytes)}바이트를 읽어 열두 작업에서 모두 ${U.int(m.bytesRead)}바이트를 읽고, 작업에 필요 없는 단계가 ${m.extraSteps}개 더해집니다.<br>저장소 개요와 린터 규칙은 코드에서 알 수 있는 내용이라 풀리는 작업 수를 바꾸지 않습니다. 이 결과는 이 책이 정한 시나리오의 계산입니다.`);
 });
};
L.security=el=>{
 U.setup(el,U.select('sample','점검할 견본',[['clean','루트 AGENTS.md (그대로)'],['hidden','외부 PR이 더한 apps/web 줄'],['external','포크에서 받은 CLAUDE.md']],'clean')+U.check('show','숨은 글자 드러내기',false));
 U.bind(el,()=>{
  const key=el.querySelector('#sample').value,show=el.querySelector('#show').checked,text=M.SAMPLES[key],s=M.scan(text);
  const body=s.rows.filter(r=>r.line).map(r=>r.flag?`<mark>${esc(show?M.reveal(r.line):r.line)}</mark>`:esc(show?M.reveal(r.line):r.line)).join('\n');
  const found=[s.hidden?`보이지 않는 글자 ${s.hidden}개(그 가운데 태그 문자 ${s.tags}개)`:'',s.imports.length?`작업 폴더 밖 @가져오기 ${s.imports.map(esc).join(', ')}`:'',s.pipes?`내려받은 스크립트를 셸에 바로 넘기는 줄 ${s.pipes}개`:'',s.urls.length?`외부 주소 ${s.urls.map(esc).join(', ')}`:''].filter(Boolean);
  U.result(el,`<pre class="hn-merged" aria-label="견본 파일 내용">${body}</pre>`,`${s.rows.filter(r=>r.line).length}줄 가운데 <b>${s.flagged}줄</b>에 점검할 것이 있습니다.${found.length?'<br>'+found.join('<br>'):'<br>보이지 않는 글자, 작업 폴더 밖 가져오기, 셸로 넘기는 명령이 없습니다.'}${s.tags&&!show?'<br>화면에는 평범한 한 줄이지만 숨은 글자가 있습니다. “숨은 글자 드러내기”를 켜 보세요.':''}${s.tags&&show?`<br>숨긴 글을 되돌리면: “${esc(s.decoded)}”`:''}${show&&!s.hidden?'<br>숨은 글자 드러내기를 켰지만 이 견본에는 드러낼 글자가 없습니다.':''}`);
 });
};
L.writing=el=>{
 U.setup(el,U.select('wsample','견본',[['draft','윤서의 첫 초안'],['revised','고친 파일'],['mine','직접 붙여 넣기']],'revised')+U.area('wtext','검사할 지침 (고치면 바로 다시 검사합니다)',M.WRITING.revised,8));
 let last='revised';
 U.bind(el,()=>{
  const sel=el.querySelector('#wsample'),area=el.querySelector('#wtext');
  if(sel.value!==last){if(sel.value!=='mine')area.value=M.WRITING[sel.value];last=sel.value;}
  else if(sel.value!=='mine'&&area.value!==M.WRITING[sel.value]){sel.value='mine';last='mine';}
  const r=M.lint(area.value),NAME={checkable:'검사할 수 있음',vague:'모호함',unclear:'구체 표지 없음',derivable:'코드에서 알 수 있음'};
  U.result(el,r.rows.length?U.table(['줄','분류','강조어','이유'],r.rows.map(x=>[x.line,NAME[x.kind],x.shout?'있음':'—',x.reason?'있음':'—']),i=>r.rows[i].kind==='checkable'):'<p class="caption">검사할 줄이 없습니다. 지침을 한 줄 이상 적어 보세요.</p>',
   `${r.lines}줄, ${U.int(r.bytes)}바이트입니다. 규칙 줄 ${r.rows.length}개 가운데 검사할 수 있는 줄 <b>${r.checkable}개</b>, 모호한 줄 ${r.vague}개, 구체 표지가 없는 줄 ${r.unclear}개, 코드에서 알 수 있는 줄 ${r.derivable}개입니다. 강조어가 든 줄은 ${r.shout}개, 이유를 붙인 줄은 ${r.reason}개입니다.<br>분류는 이 책의 정규식 어림 규칙입니다. 놓치거나 잘못 가르는 줄이 있습니다.`);
 });
};
L.placement=el=>{
 const Q=[['need','이 줄이 필요한 작업',[['all','거의 모든 작업'],['path','일부 폴더의 파일을 다룰 때'],['procedure','가끔 하는 여러 단계 절차']]],['exceptions','예외가 있을 수 있나',[['yes','있다 (상황에 따라 판단)'],['no','없다 (어기면 안 됨)']]],['owner','누구의 것인가',[['team','팀 공통'],['me','나만의 취향이나 내 환경 값']]],['derivable','코드에서 알 수 있나',[['no','없다'],['yes','있다']]]];
 U.setup(el,U.select('cand','후보 줄',M.CANDIDATES.map(c=>[c.id,c.text]),'pnpm-test')+Q.map(([id,label,opts])=>U.select('q-'+id,label,opts,M.CANDIDATES[0].a[id])).join(''));
 let last='pnpm-test';
 U.bind(el,()=>{
  const cand=el.querySelector('#cand').value,c=M.CANDIDATES.find(x=>x.id===cand);
  if(cand!==last){Q.forEach(([id])=>{el.querySelector('#q-'+id).value=c.a[id];});last=cand;}
  const a=Object.fromEntries(Q.map(([id])=>[id,el.querySelector('#q-'+id).value])),p=M.placeLine(a),book=M.placeLine(c.a),same=p.place===book.place;
  const flow=`<div class="flow">${Q.map(([id,label,opts])=>`<div><b>${esc(label)}</b><span>${esc(opts.find(o=>o[0]===a[id])[1])}</span></div>`).join('')}<div><b>둘 자리</b><span>${esc(p.name)}</span></div></div>`;
  U.result(el,flow,`“${esc(c.text)}” → <b>${esc(p.name)}</b>. ${esc(p.why)}${same?'':`<br>이 책의 답(${esc(book.name)})과 다릅니다. 네 질문의 답을 이 줄에 맞게 다시 골라 보세요.`}`);
 });
};
L.evolve=el=>{
 const POL=[['every','실수마다 한 줄 더하기'],['second','두 번째 실수부터 더하고 4주마다 정리'],['hooks','위와 같되 예외 없는 규칙은 훅으로']];
 U.setup(el,U.select('pol','운영 방식',POL,'second')+U.range('wk','지난 주 수',1,8,1,8)+U.check('cmp','다른 두 방식도 겹쳐 그리기',false));
 U.bind(el,()=>{
  const policy=el.querySelector('#pol').value,weeks=U.value(el,'wk'),e=M.evolve(policy,weeks),colors={every:'var(--orange)',second:'var(--blue)',hooks:'var(--accent)'};
  const cmp=el.querySelector('#cmp').checked,series=POL.filter(([k])=>cmp||k===policy).map(([k,n])=>({name:n,color:colors[k],width:k===policy?3.4:1.6,dash:k!==policy,dots:k===policy?3:0,pts:M.evolve(k,weeks).series.map(s=>[s.w,s.lines])}));
  const log=M.LOG.filter(x=>x.w<=weeks);
  U.result(el,U.lines(series,{xLabel:'주',yLabel:'지침 파일의 규칙 줄 수',yMax:12,xMax:Math.max(weeks,2)}),`${weeks}주 동안 기록이 ${log.length}건입니다. 이 방식이면 지침 파일에 <b>${e.lines}줄</b>이 남고, 낡은 줄 ${e.stale}개, 서로 부딪히는 줄 ${e.conflicts}쌍, 훅으로 옮긴 규칙 ${e.hooks}개입니다.<br>남은 줄: ${e.rules.map(k=>esc(M.RULE_NAMES[k]||k)).join(', ')||'없음'}. 기록과 5주 차의 도구 교체(jest → vitest)는 이 책이 정한 시나리오입니다.`);
 });
};
L.final=el=>{
 U.setup(el,M.INCIDENTS.map((x,i)=>U.select('i-'+x.id,`사고 ${i+1}. ${x.text}`,[['-1','원인을 고르세요'],...x.options.map((o,k)=>[String(k),o])],'-1')).join(''));
 U.bind(el,()=>{
  const choices=Object.fromEntries(M.INCIDENTS.map(x=>[x.id,el.querySelector('#i-'+x.id).value])),d=M.diagnose(choices),picked=d.rows.filter(r=>r.choice!=='-1').length;
  U.result(el,U.table(['사고','고른 원인','판정','고칠 곳'],d.rows.map((r,i)=>[`사고 ${i+1}`,r.choice==='-1'?'—':r.options[+r.choice],r.choice==='-1'?'아직':r.ok?'맞음':'다시',r.ok?r.fix:'—']),i=>d.rows[i].ok),
   (picked?`다섯 건 가운데 ${picked}건을 골랐고 <b>${d.ok}건</b>이 맞았습니다.`:'아직 고른 원인이 없습니다. 사고마다 원인을 하나씩 골라 보세요.')+`${d.ok===5?' 다섯 건 가운데 넷은 지침이 컨텍스트에 없었거나 온전히 들어가지 않았고, 하나는 지침으로 막을 수 없는 규칙이었습니다. 이제 건마다 결정문 네 칸을 써 보세요.':picked>d.ok?' 틀린 건은 진단 순서(도구와 작업 폴더 → 읽힌 파일 → 크기와 부딪힘 → 강제할 규칙인가 → 대화와 압축)를 따라 다시 보세요.':''}`);
 });
};
})();
