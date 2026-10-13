const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8'),html=read('index.html');
const load=()=>{const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);return JSON.parse(JSON.stringify(ctx.window.BBook));};
const B=load(),routes=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');
const IDS=['rate','transmit','bond','price','duration','curve','credit','equity','holding','final'],LABS=['who-pays','ladder','cashflow','price','sensitivity','curve-board','spread','gordon','routes','final-table'];
const LAB_FILES=['labs-rate','labs-price','labs-curve','labs-credit','labs-final'];
const key=id=>/-/.test(id)?`'${id}'`:id,esc=s=>s.replace(/[-]/g,'\\-');
const figures=()=>{const ctx={window:{BMath:require('../js/math.js')}};ctx.window.window=ctx.window;vm.runInNewContext(read('js/figures.js'),ctx.window);return ctx.window.BFigures;};
test('chapter ids are stable, unique and listed in book-routes in order',()=>{assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(routes,['home','chapters','sources',...IDS]);});
test('ten chapters, one lab each, with the agreed lab ids',()=>{assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);});
test('every lab has a renderer, a guide and an info row with a prediction placeholder',()=>{
 const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.BGuides.guides;
 const labs=LAB_FILES.map(f=>read(`js/${f}.js`)).join(''),app=read('js/app.js');
 for(const id of LABS){
  assert.match(labs,new RegExp(/-/.test(id)?`BLabs\\['${esc(id)}'\\]=`:`BLabs\\.${id}=`),id);assert.ok(G[id],id);
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
 const G=figures(),want={rate:['59.66%','5.97%','4.79%'],transmit:['3.240%','3.961%','4.376%'],bond:['193.75원','10,193.75원','11,162.50원'],price:['10,249.25원','9,975.90원','9,690.17원'],duration:['8.17년','8.00','−7.63%'],curve:['3.763%','4.200%','3.346%','3.725%','3.971%','4.438%'],credit:['9,983.22원','9,846.94원','−1.37%'],equity:['40','50','44.44','+11.1%','20'],holding:['9,983.62원','+3.96%','9,795.63원','+2.08%','10,176.23원','+5.89%'],final:['−0.06%','+4.17%','+1.87%p','−3.63%p']};
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
 for(const [,c] of shelf.matchAll(/(?:class|id)="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok.startsWith('bo-'),tok);
 for(const [,c] of shelf.matchAll(/@keyframes\s+([\w-]+)/g))assert.ok(c.startsWith('bo-'),c);
 for(const [,c] of shelf.matchAll(/\.([a-z][\w-]*)\s*[{,]/g))assert.ok(c.startsWith('bo-'),'css class '+c);
});
test('the cover is a different scene from the shelf illustration',()=>{
 const cover=read('assets/cover-art.svg'),shelf=read('assets/shelf-illustration.svg'),words=s=>new Set([...s.replace(/<style[\s\S]*?<\/style>/,'').matchAll(/>([^<>]+)</g)].map(m=>m[1].trim()).filter(Boolean));
 const shared=[...words(cover)].filter(w=>words(shelf).has(w));assert.deepEqual(shared,[],'no shared captions');
 assert.match(cover,/이표/);assert.match(shelf,/금리/);assert.doesNotMatch(cover,/시소|bo-/);
});
/* 예측 질문(L2)은 app.js가 원본이다. 설계 문서 docs/index.html의 #chapters 표가 생기면 같은 문장을 <b>L2</b> 칸에 그대로 옮겨야 한다.
   그 표는 다른 세션이 나중에 쓰므로, 표가 아직 없으면 이 검사만 건너뛴다(표가 생긴 뒤에는 어긋나면 실패한다). */
const L2=()=>Object.fromEntries(LABS.map(id=>[id,read('js/app.js').match(new RegExp(`(?:^|[{,\\s])${esc(key(id))}:\\['[^']+','[^']+','([^']+)'`,'m'))?.[1]]));
test('every lab has an L2 prediction question that is a question',()=>{for(const [id,q] of Object.entries(L2())){assert.ok(q&&q.length>20,id);assert.match(q,/\?$/,id);assert.doesNotMatch(q,/(사세요|파세요|사라|팔라|추천|권합니다|오를 것|내릴 것)/,id);}});
test('prediction questions in app.js match the design table in docs/index.html',t=>{
 const docPath=path.join(base,'docs/index.html'),doc=fs.existsSync(docPath)?fs.readFileSync(docPath,'utf8'):'';
 if(!/id="chapters"/.test(doc)||!doc.includes('<b>L2</b>')){t.skip('docs/index.html has no #chapters design table with L2 cells yet');return;}
 for(const [id,q] of Object.entries(L2()))assert.ok(doc.includes(`<b>L2</b> ${q}</td>`),id);
});
