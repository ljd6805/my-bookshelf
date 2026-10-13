/* 화면 쪽 구조 검사: 장 ID와 book-routes, 실험 렌더러·안내·info 행, 함수 길이, 장 그림, 머리말·글꼴·테마·진도 스크립트, 스크립트 순서와 버전, 다른 책 링크, 삽화 규칙,
   그리고 app.js의 예측 질문(L2)이 docs/index.html #chapters 표의 L2 칸(괄호 속 답을 뺀 질문)과 같은지. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8'),html=read('index.html');
const load=()=>{const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);return JSON.parse(JSON.stringify(ctx.window.SBook));};
const B=load(),routes=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');
const IDS=['basics','balance','income','cashflow','link','ratios','quality','dart','industry','final'],LABS=['accrual-timeline','balance-sheet-tx','income-steps','cfo-bridge','three-statement-link','ratio-table','accrual-alarm','filing-deadline','industry-compare','final-check'];
const LAB_FILES=['labs-basic','labs-income','labs-link','labs-ratios','labs-dart','labs-final'];
const esc=s=>s.replace(/[-]/g,'\\-');
const figures=()=>{const ctx={window:{SMath:require('../js/math.js')}};ctx.window.window=ctx.window;vm.runInNewContext(read('js/figures.js'),ctx.window);return ctx.window.SFigures;};
test('chapter ids are stable, unique and listed in book-routes in order',()=>{assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(routes,['home','chapters','sources',...IDS]);});
test('ten chapters, one lab each, with the agreed lab ids',()=>{assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);});
test('every lab has a renderer, a guide and an info row with a prediction placeholder',()=>{
 const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.SGuides.guides;
 const labs=LAB_FILES.map(f=>read(`js/${f}.js`)).join(''),app=read('js/app.js');
 for(const id of LABS){
  assert.match(labs,new RegExp(`SLabs\\['${esc(id)}'\\]=`),id);assert.ok(G[id],id);
  assert.match(app,new RegExp(`(^|[{,\\s])'${esc(id)}':\\['[^']+','[^']+','[^']+','[^']+'\\]`,'m'),id);assert.match(app,new RegExp(`GUESS=\\{[^}]*'${esc(id)}':`),id);
 }
 assert.deepEqual(Object.keys(G).sort(),[...LABS].sort());
});
test('every function in the book scripts stays under 100 lines',()=>{
 for(const f of ['app','visual','figures','home-lab','lab-guides',...LAB_FILES]){
  const lines=read(`js/${f}.js`).split('\n');let depth=0,start=null;
  lines.forEach((line,i)=>{const opens=(line.match(/\{/g)||[]).length,closes=(line.match(/\}/g)||[]).length;if(start===null&&/(function\b|=>\s*\{)/.test(line)&&depth<=2)start=[i,depth];depth+=opens-closes;if(start&&depth<=start[1]){assert.ok(i-start[0]+1<=100,`${f}.js:${start[0]+1} ${i-start[0]+1} lines`);start=null;}});
 }
});
test('every chapter has a figure without broken numbers',()=>{const G=figures();for(const id of IDS){const f=G.render(id);assert.ok(f&&f.svg.startsWith('<svg')&&f.caption.length>20,id);assert.doesNotMatch(f.svg+f.caption,/NaN|undefined|Infinity/,id);}});
test('figures carry the numbers the prose uses',()=>{
 const G=figures(),want={basics:['30억 원','2025-02-20','12-15'],balance:['1,050억 원','370억 원','680억 원','1,100 = 420 + 680','450억 원','170억 원'],income:['1,500억 원','450','180(12.0%)','170','136억 원'],cashflow:['136','196','166','146','156억 원','+36','100 → 136'],link:['626','620','1,156 = 380 + 776','단계 3'],ratios:['12.0%','18.7%','17.5%','49.0%','297.8%','15.0배','56.0일','59.1일','9.07% × 1.36 × 1.52'],quality:['1.15','−1.8%','24 + 97 = 121건','19.8%'],dart:['2025-03-31','2026-08-14','2026-11-14'],industry:['59.1일','56.0일','53.6%','22.8일','9.1일','73.0일'],final:['+21.2%','−53.8%','156 → −83.2','50 → 250','20억 원','18.0배','10.8배']};
 for(const [id,list] of Object.entries(want))for(const s of list)assert.ok(G.render(id).caption.includes(s),`${id}: ${s} in ${G.render(id).caption}`);
 assert.ok(!G.render('dart').svg.includes('2026-05-15')&&!G.render('dart').caption.includes('2026-05-15'),'ch8 figure must not show the L2 date');
});
test('chapter fields and choices are complete',()=>{for(const c of B.chapters){for(const k of ['id','title','subtitle','desc','time','group','labs','recall','paragraphs','formula','formulaNote','flow','warning','quiz','transfer'])assert.ok(c[k],c.id+':'+k);assert.ok(Array.isArray(c.source)&&Array.isArray(c.cross),c.id);assert.equal(c.flow.length,4,c.id);for(const q of [c.quiz,c.transfer]){assert.equal(q[1].length,3,c.id);assert.ok(q[2]>=0&&q[2]<3,c.id);}}});
test('every HTML script and asset exists locally and shares one version',()=>{const v=new Set();for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(url.startsWith('http')||url.startsWith('../'))continue;assert.ok(fs.existsSync(path.join(base,url.split('?')[0])),url);if(url.includes('?v='))v.add(url.split('?v=')[1]);}for(const [,u] of html.matchAll(/(?:src|href)="\.\.\/\.\.\/assets\/[^"?]+\?v=([^"]+)"/g))v.add(u);assert.deepEqual([...v],['20261013s7']);});
test('header has the shelf return, menu order, light theme, type and study scripts',()=>{
 assert.match(html,/<header>[\s\S]*class="shelf-return" data-shelf-return href="\.\.\/\.\.\/index.html#books"[\s\S]*<\/header>/);
 assert.match(html,/<nav aria-label="주 메뉴"><a class="shelf-return"[^>]*>[\s\S]*?<\/a><a href="#chapters">전체 목차<\/a><a href="#sources">참고 자료<\/a><button id="theme"[^>]*>어두운 화면<\/button><button id="menu"/);
 assert.match(html,/<html[^>]*data-typeset="book"[^>]*data-theme="light"/);assert.match(html,/\.\.\/\.\.\/assets\/type\.css/);
 assert.match(html,/<head>[\s\S]*book-theme\.js[\s\S]*book-study\.js\?v=[^"]+" data-book-study data-review="review\.json"[\s\S]*<\/head>/);
});
test('script load order: math → content → visual → figures → labs → home → guides → app',()=>{const order=[...html.matchAll(/<script src="js\/([a-z-]+)\.js/g)].map(m=>m[1]);assert.deepEqual(order,['math','content','visual','figures',...LAB_FILES,'home-lab','lab-guides','app']);});
test('cross links point to existing books and routes with a reason, and never to vol. 6',()=>{
 for(const c of B.chapters)for(const [name,url,why] of c.cross){assert.match(url,/^\.\.\/[a-z0-9-]+\/(#[a-z0-9-]+)?$/);assert.ok(name&&why.length>10,c.id);const dir=url.split('/')[1],idx=path.join(base,'..',dir,'index.html');assert.ok(fs.existsSync(idx),url);const r=fs.readFileSync(idx,'utf8').match(/name="book-routes" content="([^"]+)"/);if(r&&url.includes('#'))assert.ok(r[1].split(',').includes(url.split('#')[1]),url);}
 for(const f of ['index.html','js/app.js',...LAB_FILES.map(f=>`js/${f}.js`),'js/lab-guides.js','js/figures.js','js/home-lab.js'])assert.doesNotMatch(read(f),/valuation\//,f);
});
test('the last chapter link leads to an existing route in another book',()=>{const m=read('js/app.js').match(/href="(\.\.\/([a-z0-9-]+)\/#([a-z0-9-]+))"/);assert.ok(m);const r=fs.readFileSync(path.join(base,'..',m[2],'index.html'),'utf8').match(/name="book-routes" content="([^"]+)"/)[1].split(',');assert.ok(r.includes(m[3]));});
test('art files follow the cover and shelf rules',()=>{
 const cover=read('assets/cover-art.svg').trim(),shelf=read('assets/shelf-illustration.svg');
 assert.match(cover,/^<svg class="cover-art" viewBox="0 0 320 150"[^>]*aria-label="[^"]{8,}"/);assert.doesNotMatch(cover,/@keyframes|<animate|<set\b|animation|<style|<script|href=|<image|<foreignObject|\sstyle=/i);
 for(const [,c] of cover.matchAll(/class="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok==='cover-art'||tok.startsWith('cv-'),tok);
 assert.match(shelf,/@keyframes/);assert.match(shelf,/animation\s*:/);assert.match(shelf,/prefers-reduced-motion/);assert.match(shelf,/html\[data-motion=reduce\]/);
 for(const [,c] of shelf.matchAll(/(?:class|id)="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok.startsWith('fs-'),tok);
 for(const [,c] of shelf.matchAll(/@keyframes\s+([\w-]+)/g))assert.ok(c.startsWith('fs-'),c);
 for(const [,c] of shelf.matchAll(/\.([a-z][\w-]*)\s*[{,]/g))assert.ok(c.startsWith('fs-'),'css class '+c);
});
test('the cover is a different scene from the shelf illustration',()=>{
 const cover=read('assets/cover-art.svg'),shelf=read('assets/shelf-illustration.svg'),words=s=>new Set([...s.replace(/<style[\s\S]*?<\/style>/,'').matchAll(/>([^<>]+)</g)].map(m=>m[1].trim()).filter(Boolean));
 const shared=[...words(cover)].filter(w=>words(shelf).has(w));assert.deepEqual(shared,[],'no shared captions');
 assert.match(cover,/순이익 136/);assert.match(cover,/이익잉여금 626/);assert.match(cover,/현금 136/);assert.match(shelf,/매출채권/);assert.match(shelf,/현금 ▼/);assert.doesNotMatch(cover,/fs-/);
});
/* 예측 질문(L2)은 docs/index.html #chapters 표의 L2 칸에서 괄호 속 답을 뺀 질문과 app.js info[lab][2]가 같아야 한다. */
const L2=()=>Object.fromEntries(LABS.map(id=>[id,read('js/app.js').match(new RegExp(`(?:^|[{,\\s])'${esc(id)}':\\['[^']+','[^']+','([^']+)'`,'m'))?.[1]]));
test('every lab has an L2 prediction question that is a question',()=>{for(const [id,q] of Object.entries(L2())){assert.ok(q&&q.length>20,id);assert.match(q,/\?$/,id);assert.doesNotMatch(q,/(사세요|파세요|추천|권합니다|유리|피하세요)/,id);}});
test('prediction questions in app.js match the design table in docs/index.html',()=>{
 const doc=read('docs/index.html');
 const rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
 IDS.forEach((ch,i)=>{const cell=rows[ch].match(/<b>L2<\/b> (.*?)<\/td>/)[1],q=cell.slice(0,cell.lastIndexOf('? (')+1);assert.ok(q.length>20,ch);assert.equal(L2()[LABS[i]],q,LABS[i]);});
});
test('chapter 4 lab is a step-by-step bar chart and chapter 5 lab is the three-statement link experiment',()=>{const app=read('js/app.js');assert.match(app,/'cfo-bridge':\['[^']*조정 단계별 막대 그림/);assert.doesNotMatch(app,/다리 그림/);assert.match(app,/'three-statement-link':\['[^']*세 재무제표 연동 실험/);});
