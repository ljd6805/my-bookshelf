const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8'),html=read('index.html');
const load=()=>{const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);return JSON.parse(JSON.stringify(ctx.window.TBook));};
const B=load(),routes=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');
const IDS=['map','trade','dividend','gains','threshold','etf','isa','pension','order','final'],LABS=['tax-map','stt','withhold','gains','threshold','etf-tax','isa','pension','after-tax','final-order'];
const LAB_FILES=['labs-events','labs-gains','labs-accounts','labs-calc','labs-final'];
const key=id=>/-/.test(id)?`'${id}'`:id,esc=s=>s.replace(/[-]/g,'\\-');
const figures=()=>{const ctx={window:{TMath:require('../js/math.js')}};ctx.window.window=ctx.window;vm.runInNewContext(read('js/figures.js'),ctx.window);return ctx.window.TFigures;};
test('chapter ids are stable, unique and listed in book-routes in order',()=>{assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(routes,['home','chapters','sources',...IDS]);});
test('ten chapters, one lab each, with the agreed lab ids',()=>{assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);});
test('every lab has a renderer, a guide and an info row with a prediction placeholder',()=>{
 const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.TGuides.guides;
 const labs=LAB_FILES.map(f=>read(`js/${f}.js`)).join(''),app=read('js/app.js');
 for(const id of LABS){
  assert.match(labs,new RegExp(/-/.test(id)?`TLabs\\['${esc(id)}'\\]=`:`TLabs\\.${id}=`),id);assert.ok(G[id],id);
  assert.match(app,new RegExp(`(^|[{,\\s])${esc(key(id))}:\\['[^']+','[^']+','[^']+','[^']+'\\]`,'m'),id);assert.match(app,new RegExp(`GUESS=\\{[^}]*${esc(key(id))}:`),id);
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
 const G=figures(),want={map:['30,800원','169,200원','22,497원','1,248,640원'],trade:['5,000원','15,000원','20,000원','10,000원','480,000원'],dividend:['28,000원','2,800원','169,200원'],gains:['274,700원','1,650,000원'],threshold:['1,000,000원','110,000원'],etf:['1,756,240원','1,563,950원','833만 원'],isa:['284,690원','3,166,529원','115,486원','487,645원'],pension:['990,000원','2,406,965원','1,543,615원','744,093원'],order:['1,563,950원','1,848,640원','2,406,965원','1,543,615원'],final:['2,447,635원','1,848,640원','2,333,759원','1,665,625원','1,551,749원']};
 for(const [id,list] of Object.entries(want))for(const s of list)assert.ok(G.render(id).caption.includes(s),`${id}: ${s} in ${G.render(id).caption}`);
});
test('chapter fields and choices are complete',()=>{for(const c of B.chapters){for(const k of ['id','title','subtitle','desc','time','group','labs','recall','paragraphs','formula','formulaNote','flow','warning','quiz','transfer'])assert.ok(c[k],c.id+':'+k);assert.ok(Array.isArray(c.source)&&Array.isArray(c.cross),c.id);assert.equal(c.flow.length,4,c.id);for(const q of [c.quiz,c.transfer]){assert.equal(q[1].length,3,c.id);assert.ok(q[2]>=0&&q[2]<3,c.id);assert.ok(q[3].length>10,c.id);}for(const i of c.source)assert.ok(B.sources[i],c.id+' source '+i);}});
test('every HTML script and asset exists locally and shares one version',()=>{const v=new Set();for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(url.startsWith('http')||url.startsWith('../'))continue;assert.ok(fs.existsSync(path.join(base,url.split('?')[0])),url);if(url.includes('?v='))v.add(url.split('?v=')[1]);}assert.equal(v.size,1,[...v].join());});
test('header has the shelf return, menu order, light theme, type and study scripts',()=>{
 assert.match(html,/<header>[\s\S]*class="shelf-return" data-shelf-return href="\.\.\/\.\.\/index.html#books"[\s\S]*<\/header>/);
 assert.match(html,/<nav aria-label="주 메뉴"><a class="shelf-return"[^>]*>[\s\S]*?<\/a><a href="#chapters">전체 목차<\/a><a href="#sources">참고 자료<\/a><button id="theme"[^>]*>어두운 화면<\/button><button id="menu"/);
 assert.match(html,/<html[^>]*data-typeset="book"[^>]*data-theme="light"/);assert.match(html,/\.\.\/\.\.\/assets\/type\.css/);
 assert.match(html,/<head>[\s\S]*book-theme\.js[\s\S]*book-study\.js\?v=[^"]+" data-book-study data-review="review\.json"[\s\S]*<\/head>/);
});
test('script load order: math → content → visual → figures → labs → home → guides → app',()=>{const order=[...html.matchAll(/<script src="js\/([a-z-]+)\.js/g)].map(m=>m[1]);assert.deepEqual(order,['math','content','visual','figures',...LAB_FILES,'home-lab','lab-guides','app']);});
test('sources are HTTPS',()=>{B.sources.forEach(s=>assert.match(s[1],/^https:\/\//));});
test('cross links point to existing books and routes with a reason',()=>{for(const c of B.chapters)for(const [name,url,why] of c.cross){assert.match(url,/^\.\.\/[a-z0-9-]+\/(#[a-z0-9-]+)?$/);assert.ok(name&&why.length>10,c.id);const dir=url.split('/')[1],idx=path.join(base,'..',dir,'index.html');if(!fs.existsSync(idx))continue;const r=fs.readFileSync(idx,'utf8').match(/name="book-routes" content="([^"]+)"/);if(r&&url.includes('#'))assert.ok(r[1].split(',').includes(url.split('#')[1]),url);}});
test('the last chapter link leads to an existing route in another book',()=>{const m=read('js/app.js').match(/href="(\.\.\/([a-z0-9-]+)\/#([a-z0-9-]+))"/);assert.ok(m);const r=fs.readFileSync(path.join(base,'..',m[2],'index.html'),'utf8').match(/name="book-routes" content="([^"]+)"/)[1].split(',');assert.ok(r.includes(m[3]));});
test('art files follow the cover and shelf rules',()=>{
 const cover=read('assets/cover-art.svg').trim(),shelf=read('assets/shelf-illustration.svg');
 assert.match(cover,/^<svg class="cover-art" viewBox="0 0 320 150"[^>]*aria-label="[^"]{8,}"/);assert.doesNotMatch(cover,/@keyframes|<animate|<set\b|animation|<style|<script|href=|<image|<foreignObject|\sstyle=/i);
 for(const [,c] of cover.matchAll(/class="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok==='cover-art'||tok.startsWith('cv-'),tok);
 assert.match(shelf,/@keyframes/);assert.match(shelf,/animation\s*:/);assert.match(shelf,/prefers-reduced-motion/);assert.match(shelf,/html\[data-motion=reduce\]/);
 for(const [,c] of shelf.matchAll(/(?:class|id)="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok.startsWith('tx-'),tok);
 for(const [,c] of shelf.matchAll(/@keyframes\s+([\w-]+)/g))assert.ok(c.startsWith('tx-'),c);
 for(const [,c] of shelf.matchAll(/\.([a-z][\w-]*)\s*[{,]/g))assert.ok(c.startsWith('tx-'),'css class '+c);
});
test('the cover is a different scene from the shelf illustration',()=>{
 const cover=read('assets/cover-art.svg'),shelf=read('assets/shelf-illustration.svg'),words=s=>new Set([...s.replace(/<style[\s\S]*?<\/style>/,'').matchAll(/>([^<>]+)</g)].map(m=>m[1].trim()).filter(Boolean));
 const shared=[...words(cover)].filter(w=>words(shelf).has(w));assert.deepEqual(shared,[],'no shared captions');
 assert.match(cover,/배당/);assert.match(cover,/원천징수/);assert.match(cover,/169,200/);assert.match(shelf,/공제/);assert.doesNotMatch(cover,/tx-|공제/);
});
/* 예측 질문(L2)은 docs/index.html #chapters 표의 L2 칸과 app.js info[lab][2]가 같아야 한다. */
const L2=()=>Object.fromEntries(LABS.map(id=>[id,read('js/app.js').match(new RegExp(`(?:^|[{,\\s])${esc(key(id))}:\\['[^']+','[^']+','([^']+)'`,'m'))?.[1]]));
test('every lab has an L2 prediction question that is a question',()=>{for(const [id,q] of Object.entries(L2())){assert.ok(q&&q.length>20,id);assert.match(q,/\?$/,id);assert.doesNotMatch(q,/(사세요|파세요|추천|권합니다|유리|드세요|넣으세요|가입하세요)/,id);}});
test('prediction questions in app.js match the design table in docs/index.html',()=>{
 const doc=read('docs/index.html');
 for(const [id,q] of Object.entries(L2()))assert.ok(doc.includes(`<b>L2</b> ${q}</td>`),id);
});
