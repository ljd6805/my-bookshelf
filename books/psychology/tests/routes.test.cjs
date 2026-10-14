/* 화면 쪽 구조 검사: 장 ID와 book-routes, 실험 렌더러·안내·info 행, 함수 길이, 장 그림, 머리말·글꼴·테마·진도 스크립트, 스크립트 순서와 버전, 다른 책 링크, 삽화 규칙,
   색 토큰(테마마다 --accent 한 번), 권유 표현 금지와 고정 문장, 1장 선택을 저장하지 않는 코드, 그리고 app.js의 예측 질문(L2)이 docs/index.html #chapters 표의 L2 칸(괄호 속 답을 뺀 질문)과 같은지. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8'),html=read('index.html');
const load=()=>{const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);return JSON.parse(JSON.stringify(ctx.window.PBook));};
const B=load(),routes=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');
const IDS=['frame','prospect','disposition','baserate','confirm','overconfidence','herd','outcome','rules','final'];
const LABS=['two-frame-choice','value-function','disposition-count','base-rate-grid','likelihood-odds','interval-cost','info-cascade','loss-by-trials','rule-replay','journal-audit'];
const NAMES=['같은 선택지 두 틀 실험','가치 함수 실험','처분 효과 측정 실험','추천 1,000종목 실험','증거별 우도비로 확신 계산 실험','적중률과 비용 실험','정보 폭포 실험','횟수별 손실 확률 실험','규칙 대입 실험','일지 점검 실험'];
const LAB_FILES=['labs-choice','labs-belief','labs-crowd','labs-rules','labs-final'],VERSION='20261014bf7';
const UI_FILES=['index.html','js/app.js','js/visual.js','js/figures.js','js/home-lab.js','js/lab-guides.js',...LAB_FILES.map(f=>`js/${f}.js`)];
const ADVICE=/(사세요|파세요|손절하세요|정답 규칙|이기는 습관|오를 것|내릴 것|추천합니다|추천해 드|권합니다|권해 드|사 두세요|팔아 두세요|매수하세요|매도하세요|반드시 오른|반드시 내린|저평가|고평가|최적의 규칙|좋은 규칙입니다)/;
const esc=s=>s.replace(/[-]/g,'\\-');
const figures=()=>{const ctx={window:{PMath:require('../js/math.js')}};ctx.window.window=ctx.window;vm.runInNewContext(read('js/figures.js'),ctx.window);return ctx.window.PFigures;};
test('chapter ids are stable, unique and listed in book-routes in order',()=>{assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(routes,['home','chapters','sources',...IDS]);});
test('ten chapters, one lab each, with the agreed lab ids',()=>{assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);});
test('every lab has a renderer, a guide and an info row with a prediction placeholder',()=>{
 const ctx={window:{},document:{},PMath:require('../js/math.js')};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.PGuides.guides;
 const labs=LAB_FILES.map(f=>read(`js/${f}.js`)).join(''),app=read('js/app.js');
 for(const id of LABS){
  assert.match(labs,new RegExp(`PLabs\\['${esc(id)}'\\]=`),id);assert.ok(G[id],id);
  assert.match(app,new RegExp(`(^|[{,\\s])'${esc(id)}':\\['[^']+','[^']+','[^']+','[^']+'\\]`,'m'),id);assert.match(app,new RegExp(`GUESS=\\{[^}]*'${esc(id)}':`),id);
 }
 assert.deepEqual(Object.keys(G).sort(),[...LABS].sort());
});
test('lab titles start with the lab names fixed at G2, and the body calls each lab by that name',()=>{
 const app=read('js/app.js'),content=read('js/content.js');
 LABS.forEach((id,i)=>{const t=app.match(new RegExp(`'${esc(id)}':\\['([^']+)'`))[1];assert.ok(t.startsWith(NAMES[i]+': '),t);assert.match(app,new RegExp(`'${esc(id)}':'${NAMES[i]}'`),id+' alias');if(i!==5)assert.ok(content.includes(NAMES[i]),NAMES[i]);});
});
test('every function in the book scripts stays under 100 lines',()=>{
 for(const f of ['app','visual','figures','home-lab','lab-guides',...LAB_FILES]){
  const lines=read(`js/${f}.js`).split('\n');let depth=0,start=null;
  lines.forEach((line,i)=>{const opens=(line.match(/\{/g)||[]).length,closes=(line.match(/\}/g)||[]).length;if(start===null&&/(function\b|=>\s*\{)/.test(line)&&depth<=2)start=[i,depth];depth+=opens-closes;if(start&&depth<=start[1]){assert.ok(i-start[0]+1<=100,`${f}.js:${start[0]+1} ${i-start[0]+1} lines`);start=null;}});
 }
});
test('every chapter has a figure without broken numbers',()=>{const G=figures();for(const id of IDS){const f=G.render(id);assert.ok(f&&f.svg.startsWith('<svg')&&f.caption.length>20,id);assert.doesNotMatch(f.svg+f.caption,/NaN|undefined|Infinity/,id);}});
test('figures never draw their chapter’s L2 answer or quiz answer',()=>{
 const G=figures(),A={frame:['−600만','1,600만 원 또는'],prospect:['225.00','+10.92','195.5','214.21'],disposition:['0.250','0.150','1.51배'],baserate:['17.4%','19.7%','60.0%'],confirm:['33.3%','66.7%','31.0%'],
  overconfidence:['55.0%','18.0개','23만','1.15%p'],herd:['56.7%','6.0%'],outcome:['26.2%','23.4%','24.3%'],rules:['45만','39.4%','61만 2,510','28만 5,555'],final:['0.714','0.111','4.8주','19주','44만 4,934']};
 for(const id of IDS){const f=G.render(id),all=f.svg+' '+f.caption;for(const s of A[id])assert.ok(!all.includes(s),id+' figure shows '+s);}
});
test('chapter fields and choices are complete',()=>{for(const c of B.chapters){for(const k of ['id','title','subtitle','desc','time','group','labs','recall','paragraphs','formula','formulaNote','flow','warning','quiz','transfer'])assert.ok(c[k],c.id+':'+k);assert.ok(Array.isArray(c.source)&&Array.isArray(c.cross),c.id);for(const q of [c.quiz,c.transfer]){assert.ok(q[1].length>=3&&q[1].length<=4,c.id);assert.ok(q[2]>=0&&q[2]<q[1].length,c.id);}}});
test('every HTML script and asset exists locally and shares one version',()=>{const v=new Set();for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(url.startsWith('http')||url.startsWith('../'))continue;assert.ok(fs.existsSync(path.join(base,url.split('?')[0])),url);if(url.includes('?v='))v.add(url.split('?v=')[1]);}for(const [,u] of html.matchAll(/(?:src|href)="\.\.\/\.\.\/assets\/[^"?]+\?v=([^"]+)"/g))v.add(u);assert.deepEqual([...v],[VERSION]);});
test('header has the shelf return, menu order, light theme, type and study scripts',()=>{
 assert.match(html,/<header>[\s\S]*class="shelf-return" data-shelf-return href="\.\.\/\.\.\/index.html#books"[\s\S]*<\/header>/);
 assert.match(html,/<nav aria-label="주 메뉴"><a class="shelf-return"[^>]*>[\s\S]*?<\/a><a href="#chapters">전체 목차<\/a><a href="#sources">참고 자료<\/a><button id="theme"[^>]*>어두운 화면<\/button><button id="menu"/);
 assert.match(html,/<html[^>]*data-typeset="book"[^>]*data-theme="light"/);assert.match(html,/\.\.\/\.\.\/assets\/type\.css/);
 assert.match(html,/<head>[\s\S]*book-theme\.js[\s\S]*book-study\.js\?v=[^"]+" data-book-study data-review="review\.json"[\s\S]*<\/head>/);
 assert.match(html,/<title>행동재무학 · 매매 기록에서 손실 회피와 과신의 흔적을 세고 규칙을 시험하기<\/title>/);
});
test('script load order: math → content → visual → figures → labs → home → guides → app',()=>{const order=[...html.matchAll(/<script src="js\/([a-z-]+)\.js/g)].map(m=>m[1]);assert.deepEqual(order,['math','content','visual','figures',...LAB_FILES,'home-lab','lab-guides','app']);});
test('links point to existing books and routes; no link to this book or an unpublished vol 13 folder',()=>{
 for(const c of B.chapters)for(const [name,url,why] of c.cross){assert.match(url,/^\.\.\/[a-z0-9-]+\/(#[a-z0-9-]+)?$/);assert.ok(name&&why.length>10,c.id);}
 for(const f of UI_FILES){
  const src=read(f);assert.doesNotMatch(src,/\.\.\/psychology\b/,f);
  for(const [,dir,anchor] of src.matchAll(/href="\.\.\/([a-z0-9-]+)\/(?:#([a-z0-9-]+))?"/g)){const idx=path.join(base,'..',dir,'index.html');assert.ok(fs.existsSync(idx),f+': '+dir);if(anchor){const r=fs.readFileSync(idx,'utf8').match(/name="book-routes" content="([^"]+)"/);assert.ok(r&&r[1].split(',').includes(anchor),f+': '+dir+'#'+anchor);}}
 }
 assert.match(read('js/app.js'),/13권\(준비 중\)/);
});
test('CSS defines the blue tokens once: --accent exactly once in :root and once in [data-theme=light], and uses only font tokens',()=>{
 const css=read('css/style.css').replace(/\/\*[\s\S]*?\*\//g,''),blocks=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m=>/--accent:/.test(m[2])).map(m=>m[1].trim());
 assert.deepEqual(blocks,[':root','[data-theme=light]']);assert.equal((css.match(/--accent:/g)||[]).length,2);
 for(const k of ['--bg','--panel','--text','--muted','--line','--orange','--blue','--chart'])assert.equal((css.match(new RegExp(k+':','g'))||[]).length,2,k);
 for(const [,v] of css.matchAll(/font-family:([^;}]+)/g))assert.match(v.trim(),/^(var\(--font-(sans|serif|mono)\)|inherit)$/,v);
 const alloc=fs.readFileSync(path.join(base,'..','allocation','css','style.css'),'utf8').match(/\[data-theme=light\]\{([^}]*)\}/)[1];assert.ok(!css.includes(alloc),'tokens are not copied from another book');
});
test('art files follow the cover and shelf rules',()=>{
 const cover=read('assets/cover-art.svg').trim(),shelf=read('assets/shelf-illustration.svg');
 assert.match(cover,/^<svg class="cover-art" viewBox="0 0 320 150"[^>]*aria-label="[^"]{8,}"/);assert.doesNotMatch(cover,/@keyframes|<animate|<set\b|animation|<style|<script|href=|<image|<foreignObject|\sstyle=/i);
 for(const [,c] of cover.matchAll(/class="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok==='cover-art'||tok.startsWith('cv-'),tok);
 for(const [,x] of cover.matchAll(/\sx="([\d.]+)"/g))assert.ok(+x>=14&&+x<=306,'cover x '+x);
 for(const [,y] of cover.matchAll(/\sy="([\d.]+)"/g))assert.ok(+y>=14&&+y<=136,'cover y '+y);
 assert.match(shelf,/viewBox="0 0 340 180"/);assert.match(shelf,/@keyframes/);assert.match(shelf,/animation\s*:/);assert.match(shelf,/prefers-reduced-motion/);assert.match(shelf,/html\[data-motion=reduce\]/);
 for(const [,c] of shelf.matchAll(/(?:class|id)="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok.startsWith('bf-'),tok);
 for(const [,c] of shelf.matchAll(/@keyframes\s+([\w-]+)/g))assert.ok(c.startsWith('bf-'),c);
 for(const [,c] of shelf.matchAll(/\.([a-z][\w-]*)\s*[{,]/g))assert.ok(c.startsWith('bf-'),'css class '+c);
});
test('the cover is a different scene from the shelf illustration, and both carry numbers from the journal',()=>{
 const M=require('../js/math.js'),cover=read('assets/cover-art.svg'),shelf=read('assets/shelf-illustration.svg');
 const words=s=>new Set([...s.replace(/<style[\s\S]*?<\/style>/,'').replace(/<title[\s\S]*?<\/title>/,'').matchAll(/>([^<>]+)</g)].map(m=>m[1].trim()).filter(Boolean));
 assert.deepEqual([...words(cover)].filter(w=>words(shelf).has(w)),[],'no shared captions');
 const d=M.disposition(1,13);for(const t of [d.pgr.toFixed(3),d.plr.toFixed(3),String(d.RG),String(d.PG),String(d.PL)])assert.ok(words(cover).has(t),'cover '+t);
 const h=M.holding();for(const w of [...h.gains,...h.losses])assert.doesNotMatch(shelf,new RegExp(`(?<![\\d.])${w}주`),'shelf must not show the 10장 holding-period answer '+w);   // 서가 삽화가 확인 문제의 답(보유 기간)을 미리 보이지 않게
 assert.doesNotMatch(cover,/bf-/);
});
/* 예측 질문(L2)은 docs/index.html #chapters 표의 L2 칸에서 괄호 속 답을 뺀 질문과 app.js info[lab][2]가 같아야 한다. */
const L2=()=>Object.fromEntries(LABS.map(id=>[id,read('js/app.js').match(new RegExp(`(?:^|[{,\\s])'${esc(id)}':\\['[^']+','[^']+','([^']+)'`,'m'))?.[1]]));
test('every lab has an L2 prediction question that is a question',()=>{for(const [id,q] of Object.entries(L2())){assert.ok(q&&q.length>20,id);assert.match(q,/\?$/,id);assert.doesNotMatch(q,ADVICE,id);}});
test('prediction questions in app.js match the design table in docs/index.html',()=>{
 const doc=read('docs/index.html');
 const rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
 IDS.forEach((ch,i)=>{const cell=rows[ch].match(/<b>L2<\/b> (.*?)<\/td>/)[1],q=cell.slice(0,cell.lastIndexOf('? (')+1);assert.ok(q.length>20,ch);assert.equal(L2()[LABS[i]],q,LABS[i]);});
});
test('K7: lab titles name what the reader does; no metaphor props',()=>{
 const app=read('js/app.js'),titles=LABS.map(id=>app.match(new RegExp(`'${esc(id)}':\\['([^']+)'`))[1]);
 for(const t of [...titles,...B.chapters.map(c=>c.title)])assert.doesNotMatch(t,/(거울|저울|마음의 지도|함정|덫|울타리|지갑)/,t);
 for(const t of titles)assert.match(t.split(': ')[1],/(계산|견주|찾기|확인|구하|기록)/,t);
});
test('the UI never advises a rule or a trade, and carries the fixed sentences',()=>{
 const all=UI_FILES.map(read).join('\n'),M=require('../js/math.js');
 const lines=all.split('\n').filter(l=>ADVICE.test(l));assert.deepEqual(lines.map(l=>l.match(ADVICE)[0]),[]);
 const vis=read('js/visual.js'),choice=read('js/labs-choice.js'),crowd=read('js/labs-crowd.js'),rules=read('js/labs-rules.js'),belief=read('js/labs-belief.js'),fin=read('js/labs-final.js');
 assert.match(vis,/M\.TEXT\.disclaimer/);assert.match(vis,/M\.MARKET\.recheck/);assert.match(vis,/M\.JOURNAL\.label/);
 assert.match(choice,/M\.TEXT\.frameNote/);assert.equal(M.TEXT.frameNote,'새로고침하면 선택이 사라집니다');assert.match(choice,/F\.framing\.people\[0\]/);
 assert.match(crowd,/M\.TEXT\.cascadeNote/);assert.match(rules,/M\.TEXT\.ifThen/);assert.match(rules,/U\.DISCLAIMER/);assert.match(rules,/'rebound','반등 경로\(가정\)'/);assert.match(rules,/'journal','선우의 일지'/);
 for(const src of [belief,fin]){assert.match(src,/timed\('tradeTax'\)/);assert.match(src,/timed\('fee'\)/);assert.match(src,/U\.RECHECK/);}
 assert.match(choice,/U\.check\('pw','확률 가중 켜기',false/);assert.match(choice,/\['1-13','선우의 일지 1~13주'\],\['14-26','선우의 일지 14~26주'\],\['direct'/);
});
test('the first chapter keeps the reader’s choices out of every storage, and no lab writes to storage',()=>{
 for(const f of UI_FILES)assert.doesNotMatch(read(f),/localStorage|sessionStorage|indexedDB|document\.cookie/,f);
});
