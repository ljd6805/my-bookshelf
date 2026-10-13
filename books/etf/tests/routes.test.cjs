const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8'),html=read('index.html');
const load=()=>{const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);return JSON.parse(JSON.stringify(ctx.window.EBook));};
const B=load(),routes=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');
const IDS=['index','weight','creation','nav','cost','leverage','assets','tax','choose','final'],LABS=['index-level','weighting','creation-unit','gap-lab','tracking-cost','rebalance','underlying','etf-tax-type','compare-table','final-gap'];
const LAB_FILES=['labs-index','labs-gap','labs-cost','labs-assets','labs-compare'];
const key=id=>/-/.test(id)?`'${id}'`:id,esc=s=>s.replace(/[-]/g,'\\-');
const figures=()=>{const ctx={window:{EMath:require('../js/math.js')}};ctx.window.window=ctx.window;vm.runInNewContext(read('js/figures.js'),ctx.window);return ctx.window.EFigures;};
test('chapter ids are stable, unique and listed in book-routes in order',()=>{assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(routes,['home','chapters','sources',...IDS]);});
test('ten chapters, one lab each, with the agreed lab ids',()=>{assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);});
test('every lab has a renderer, a guide and an info row with a prediction placeholder',()=>{
 const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.EGuides.guides;
 const labs=LAB_FILES.map(f=>read(`js/${f}.js`)).join(''),app=read('js/app.js');
 for(const id of LABS){
  assert.match(labs,new RegExp(/-/.test(id)?`ELabs\\['${esc(id)}'\\]=`:`ELabs\\.${id}=`),id);assert.ok(G[id],id);
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
 const G=figures(),want={index:['4,000억 원','4,200억 원','105.00','4,476억 원','117.50'],weight:['+3.75%','+2.14%','+1.67%'],creation:['1,030만 좌','3,090억 원','30,000원','90억 원'],nav:['30,360원','30,400원','+0.13%','31,275원','+3.01%','915원','9,150만 원'],cost:['−0.20%p','0.18%','0.22%','0.13%','15,934,116원','16,078,424원','144,308원'],leverage:['200','220','240','20','180','160'],assets:['30,360원','9,975.90원','9,700.71원','2.76%','12,120원'],tax:['비과세','15.4%','22%','증권거래세는 0원'],choose:['9,560,470원','9,647,055원','86,585원','1,000원','6,000원','90,000원'],final:['+3.00%','323주','9,980,700원','19,300원','9,690,000원','−290,700원','−2.91%']};
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
 for(const [,c] of shelf.matchAll(/(?:class|id)="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok.startsWith('ef-'),tok);
 for(const [,c] of shelf.matchAll(/@keyframes\s+([\w-]+)/g))assert.ok(c.startsWith('ef-'),c);
 for(const [,c] of shelf.matchAll(/\.([a-z][\w-]*)\s*[{,]/g))assert.ok(c.startsWith('ef-'),'css class '+c);
});
test('the cover is a different scene from the shelf illustration',()=>{
 const cover=read('assets/cover-art.svg'),shelf=read('assets/shelf-illustration.svg'),words=s=>new Set([...s.replace(/<style[\s\S]*?<\/style>/,'').matchAll(/>([^<>]+)</g)].map(m=>m[1].trim()).filter(Boolean));
 const shared=[...words(cover)].filter(w=>words(shelf).has(w));assert.deepEqual(shared,[],'no shared captions');
 assert.match(cover,/누리200 지수/);assert.match(cover,/NAV 30,000원/);assert.match(cover,/class="cv-text/);assert.match(shelf,/LP 매도 호가/);assert.match(shelf,/iNAV/);assert.doesNotMatch(cover,/ef-|LP/);
});
/* 예측 질문(L2)은 docs/index.html #chapters 표의 L2 칸에서 괄호 속 답을 뺀 질문과 app.js info[lab][2]가 같아야 한다. */
const L2=()=>Object.fromEntries(LABS.map(id=>[id,read('js/app.js').match(new RegExp(`(?:^|[{,\\s])${esc(key(id))}:\\['[^']+','[^']+','([^']+)'`,'m'))?.[1]]));
test('every lab has an L2 prediction question that is a question',()=>{for(const [id,q] of Object.entries(L2())){assert.ok(q&&q.length>20,id);assert.match(q,/\?$/,id);assert.doesNotMatch(q,/(사세요|파세요|추천|권합니다|유리|드세요|넣으세요|가입하세요)/,id);}});
test('prediction questions in app.js match the design table in docs/index.html',()=>{
 const doc=read('docs/index.html');
 const rows=Object.fromEntries([...doc.matchAll(/<tr data-chapter="(\w+)">([\s\S]*?)<\/tr>/g)].map(m=>[m[1],m[2]]));
 IDS.forEach((ch,i)=>{const cell=rows[ch].match(/<b>L2<\/b> (.*?)<\/td>/)[1],q=cell.slice(0,cell.lastIndexOf('? (')+1);assert.ok(q.length>20,ch);assert.equal(L2()[LABS[i]],q,LABS[i]);});
});
test('the leverage lab stays on one day and sends multi-day questions to vol. 8',()=>{const src=read('js/labs-cost.js');assert.match(src,/\.\.\/volatility\/#drag/);const r=fs.readFileSync(path.join(base,'..','volatility','index.html'),'utf8').match(/name="book-routes" content="([^"]+)"/)[1].split(',');assert.ok(r.includes('drag'));});
