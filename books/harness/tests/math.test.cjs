/* 계산 모델 검증: 바이트 세기, 공식 문서의 찾기·합치기 규칙, 크기 한도, 점검과 어림 규칙의 대표값·경계값·불변 조건.
   안내 상자(lab-guides.js)의 결과 읽기와 본문 확인 문제에 적은 숫자가 실제 계산과 같은지도 여기서 대조한다. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const M=require(path.resolve(__dirname,'../js/math.js'));
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../js/lab-guides.js'),'utf8'),ctx);
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../js/content.js'),'utf8'),ctx);
const G=ctx.window.HNGuides.guides,B=ctx.window.HNBook,reading=id=>G[id][2],int=n=>n.toLocaleString('en-US');
const has=(id,...xs)=>{for(const x of xs)assert.ok(reading(id).includes(x),`${id}: "${x}" not in guide`);};
const chapter=id=>JSON.stringify(B.chapters.find(c=>c.id===id));
const ids=r=>r.loaded.map(o=>o.file.id).join();

test('UTF-8 bytes: ASCII 1, Hangul syllable 3, emoji 4; characters count code points',()=>{
 assert.equal(M.utf8('abc'),3);assert.equal(M.utf8('가'),3);assert.equal(M.utf8('é'),2);assert.equal(M.utf8('😀'),4);
 assert.equal(M.chars('가😀a'),3);assert.equal(M.lines(''),0);assert.equal(M.lines('a\nb\n'),2);
 const ko=M.SAMPLE_LINES.ko+'\n',en=M.SAMPLE_LINES.en+'\n';assert.equal(M.utf8(ko),110);assert.equal(M.chars(ko),64);assert.equal(M.utf8(en),81);assert.equal(M.chars(en),81);
});
test('Claude Code default: a root CLAUDE.md turns off AGENTS.md discovery, but its @import still brings the root AGENTS.md',()=>{
 assert.equal(ids(M.load('claude',{cwd:''})),'user-claude,root-claude,root-agents');
 assert.equal(ids(M.load('claude',{cwd:'',touched:'apps/web/src/page.tsx'})),'user-claude,root-claude,root-agents');
 const ui=M.load('claude',{cwd:'',touched:'packages/ui/src/Button.tsx'});assert.equal(ids(ui),'user-claude,root-claude,root-agents,ui-claude');assert.equal(ui.onDemand,1);
 assert.equal(ids(M.load('claude',{cwd:'',rootClaude:false,touched:'apps/web/src/page.tsx'})),'user-claude,root-agents,web-agents');
 assert.equal(ids(M.load('claude-and',{cwd:'apps/api'})),'user-claude,root-claude,root-agents,api-agents');
 assert.equal(ids(M.load('claude-only',{cwd:'',rootClaude:false})),'user-claude');
 assert.ok(!M.load('claude',{cwd:'apps/api',override:true}).loaded.some(o=>o.file.id==='api-override'));
});
test('CLAUDE.local.md alone also counts as a CLAUDE file and stops AGENTS.md under the default setting',()=>{
 assert.equal(ids(M.load('claude',{cwd:'',rootClaude:false,local:true})),'user-claude,root-local');
 assert.equal(ids(M.load('claude',{cwd:'',local:true})),'user-claude,root-claude,root-agents,root-local');
});
test('Codex: one file per folder from the root down to the working folder, override first, never re-reads during work',()=>{
 assert.equal(ids(M.load('codex',{cwd:'apps/web'})),'user-codex,root-agents,web-agents');
 assert.equal(ids(M.load('codex',{cwd:''})),'user-codex,root-agents');
 assert.equal(ids(M.load('codex',{cwd:'',touched:'apps/web/src/page.tsx'})),'user-codex,root-agents');
 assert.equal(ids(M.load('codex',{cwd:'apps/api',override:true})),'user-codex,root-agents,api-override');
 for(const d of M.DIRS)assert.ok(!M.load('codex',{cwd:d}).loaded.some(o=>o.file.name.startsWith('CLAUDE')),d);
});
test('merging keeps root-first order and reports the conflicting test commands',()=>{
 const c=M.conflicts(M.load('codex',{cwd:'apps/api'}));assert.equal(c.length,1);assert.equal(c[0].topic,'test');
 assert.deepEqual(c[0].rows.map(r=>r.value),['pnpm test','pnpm --filter api test:int']);assert.equal(c[0].last.file.id,'api-agents');
 assert.equal(M.conflicts(M.load('codex',{cwd:'apps/api',override:true}))[0].last.value,'pnpm --filter api test:unit');
 assert.equal(M.conflicts(M.load('claude',{cwd:'apps/api'})).length,0);
 assert.equal(M.conflicts(M.load('claude-and',{cwd:'apps/api'})).length,1);
});
test('Codex size limit: the file that crosses 32,768 bytes is marked, later files are left out',()=>{
 const ko=M.budget({lang:'ko'}),en=M.budget({lang:'en'});
 assert.equal(ko.codexTotal,33080);assert.equal(en.codexTotal,24380);
 const st=(b,id)=>{const o=b.codex.loaded.find(x=>x.file.id===id);return o?(o.cut?'cut':'in'):'out';};
 assert.equal(st(ko,'api-agents'),'cut');assert.equal(st(en,'api-agents'),'in');
 const big=M.budget({lang:'ko',rootLines:300});assert.equal(big.codexTotal,49580);assert.equal(st(big,'root-agents'),'cut');assert.equal(st(big,'api-agents'),'out');assert.ok(big.claudeRootWarn);
 assert.equal(M.budget({lang:'ko',rootLines:100,subLines:100}).codexTotal,22080);
 const edge=M.budget({lang:'en',rootLines:200,subLines:200});assert.equal(edge.codexTotal,32480);assert.equal(st(edge,'api-agents'),'in');
 assert.equal(st(M.budget({lang:'en',rootLines:225,subLines:225}),'api-agents'),'cut');
 const sub=M.budget({lang:'en',rootLines:600,subLines:600});assert.equal(sub.sub.chars,48600);assert.equal(sub.subMissingLines,107);
 assert.equal(M.budget({lang:'en',rootLines:600,subLines:600,windowSize:'1m'}).subMissingLines,0);
});
test('bridge: @AGENTS.md works under every setting; a sentence or CLAUDE.local.md alone does not bring AGENTS.md',()=>{
 for(const setting of ['claude-md-or-agents-md','claude-md-and-agents-md','claude-md'])for(const local of [false,true]){assert.ok(M.bridge({claude:'import',local,setting}).agents,setting);assert.ok(M.bridge({claude:'symlink',local,setting}).agents,setting);}
 assert.ok(!M.bridge({claude:'sentence'}).agents);assert.ok(!M.bridge({claude:'none',local:true}).agents);assert.ok(M.bridge({claude:'none'}).agents);
 assert.ok(!M.bridge({claude:'none',setting:'claude-md'}).agents);assert.ok(M.bridge({claude:'sentence',setting:'claude-md-and-agents-md'}).agents);
 assert.deepEqual(M.importChain(6).map(x=>x.loaded),[true,true,true,true,false,false]);assert.ok(M.importChain(4).every(x=>x.loaded));
});
test('placement of the six rules: two stay as guidance, four go to the harness',()=>{
 assert.equal(M.placementScore({}).ok,2);
 assert.equal(M.placementScore({env:'deny',migrations:'deny',format:'hook',tests:'ci'}).ok,6);
 assert.equal(M.placementScore({env:'hook',migrations:'hook',format:'hook',tests:'ci'}).ok,6);
 assert.equal(M.placementScore(Object.fromEntries(M.RULES6.map(r=>[r.id,'hook']))).ok,3);
});
test('task scenario: derivable sections never change the solved count; commands and gotchas solve all twelve',()=>{
 const all=M.taskModel({commands:1,gotchas:1,overview:1,lint:1,extra:1});assert.deepEqual([all.solved,all.lines,all.bytes,all.bytesRead,all.extraSteps],[12,85,7020,84240,24]);
 const derivable=M.taskModel({overview:1,lint:1});assert.deepEqual([derivable.solved,derivable.lines,derivable.bytes],[1,70,5700]);
 const core=M.taskModel({commands:1,gotchas:1});assert.deepEqual([core.solved,core.lines,core.bytes],[12,11,940]);
 assert.equal(M.taskModel({commands:1}).solved,5);assert.equal(M.taskModel({}).solved,1);
 for(const on of [{},{commands:1},{gotchas:1},{commands:1,gotchas:1}])assert.equal(M.taskModel({...on,overview:1,lint:1}).solved,M.taskModel(on).solved);
});
test('security scan finds invisible characters, decodes tag characters, flags outside imports and pipe-to-shell',()=>{
 const clean=M.scan(M.SAMPLES.clean);assert.equal(clean.flagged,0);assert.equal(clean.hidden,0);
 const h=M.scan(M.SAMPLES.hidden);assert.equal(h.hidden,104);assert.equal(h.tags,102);assert.equal(h.flagged,1);assert.equal(h.decoded,M.HIDDEN_ORDER);
 assert.equal(M.decodeTags(M.encodeTags('abc')),'abc');assert.match(M.reveal('a​b'),/⟦U\+200B⟧/);assert.match(M.reveal(M.encodeTags('hi')),/태그 문자 2개: “hi”/);
 const x=M.scan(M.SAMPLES.external);assert.deepEqual(x.imports,['@~/notes/deploy.md']);assert.equal(x.pipes,1);assert.equal(x.flagged,2);
 assert.deepEqual(M.scan('`@~/x` 는 코드').imports,[]);
});
test('writing heuristics: draft has no checkable line, revised has five with three reasons',()=>{
 const d=M.lint(M.WRITING.draft),r=M.lint(M.WRITING.revised);
 assert.deepEqual([d.rows.length,d.checkable,d.vague,d.derivable,d.shout,d.reason,d.bytes],[6,0,4,2,1,0,292]);
 assert.deepEqual([r.rows.length,r.checkable,r.vague,r.derivable,r.shout,r.reason,r.bytes],[5,5,0,0,0,3,519]);
 assert.equal(M.lintLine('# 제목').kind,'skip');assert.equal(M.lintLine('@AGENTS.md').kind,'skip');assert.equal(M.lintLine('- 테스트: `pnpm test`').kind,'checkable');
});
test('placeLine follows the four questions in order',()=>{
 const name=id=>M.placeLine(M.CANDIDATES.find(c=>c.id===id).a).place;
 assert.deepEqual(['pnpm-test','migrations','release','sandbox','react','stories'].map(name),['project','enforce','skill','local','none','scoped']);
 assert.equal(M.placeLine({derivable:'yes',exceptions:'no'}).place,'none');assert.equal(M.placeLine({exceptions:'no',owner:'me'}).place,'enforce');
});
test('evolve: three policies over eight weeks',()=>{
 const e=M.evolve('every'),s=M.evolve('second'),h=M.evolve('hooks');
 assert.deepEqual([e.lines,e.stale,e.conflicts,e.hooks],[11,1,1,0]);assert.deepEqual([s.lines,s.stale,s.conflicts,s.hooks],[5,0,0,0]);assert.deepEqual([h.lines,h.stale,h.conflicts,h.hooks],[4,0,0,1]);
 assert.deepEqual(s.rules,['npm','gen','vitest','mig','db']);assert.deepEqual([M.evolve('every',5).lines,M.evolve('every',5).stale],[7,1]);
 assert.equal(M.evolve('every',4).stale,0);for(const p of ['every','second','hooks'])assert.equal(M.evolve(p,8).series.length,8);
 for(const k of [...e.rules,...s.rules])assert.ok(M.RULE_NAMES[k],k);
});
test('diagnose: every incident has exactly one answer and the fix text',()=>{
 assert.equal(M.diagnose({}).ok,0);assert.equal(M.diagnose(Object.fromEntries(M.INCIDENTS.map(x=>[x.id,String(x.answer)]))).ok,5);
 for(const x of M.INCIDENTS){assert.ok(x.answer>=0&&x.answer<x.options.length);assert.ok(x.fix.length>20);}
 const order=M.choiceOrder(4,2,0);assert.equal(order[0],2);assert.equal(new Set(order).size,4);
});
test('guide readings quote the computed numbers',()=>{
 has('session','5개','2개','6개');
 const r=M.load('claude',{cwd:''}),ui=M.load('claude',{cwd:'',touched:'packages/ui/src/Button.tsx'}),cw=M.load('codex',{cwd:'apps/web'}),cr=M.load('codex',{cwd:''});
 has('discovery',`3개(${r.bytes}바이트)`,`4개(${ui.bytes}바이트)`,`3개(${cw.bytes}바이트)`,`2개(${cr.bytes}바이트)`);
 has('budget','64자, 110바이트','81자, 81바이트',int(33080),int(24380),int(22080),int(49580),int(48600),int(40000),'107줄');
 has('enforce','2개만','3개가');
 has('length','85줄',int(7020),'24개','70줄',int(5700),'1개만','11줄',int(940),'5개가');
 has('security','104개','102개','2줄');
 has('writing','0개','4개','2개','3개',`${M.lint(M.WRITING.draft).bytes}바이트에서 ${M.lint(M.WRITING.revised).bytes}바이트`);
 has('evolve','11줄','7줄','5줄','4줄');
 for(const id of Object.keys(G))assert.ok(G[id][1].length>=3,id+' presets');
});
test('chapter quizzes quote the computed numbers',()=>{
 assert.ok(chapter('budget').includes(int(33080))&&chapter('budget').includes(int(24380)));
 assert.ok(chapter('length').includes(int(5700)));
 assert.ok(chapter('evolve').includes('줄 수는 11개'));
 assert.ok(chapter('budget').includes('73%'));const repo={bytes:23972,limit:32768};assert.equal(Math.round(repo.bytes/repo.limit*100),73);assert.equal(repo.limit-repo.bytes,8796);
});
