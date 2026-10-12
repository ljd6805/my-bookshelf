const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8'),html=read('index.html');
const load=()=>{const ctx={window:{}};vm.runInNewContext(read('js/content.js'),ctx);return JSON.parse(JSON.stringify(ctx.window.MBook));};
const B=load(),routes=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');
const IDS=['today','compound','rule72','discount','loan','npv','inflation','cagr','fees','final'],LABS=['scale','compound','double','discount','schedule','npv','real','cagr','fees','decide'];
test('chapter ids are stable, unique and listed in book-routes in order',()=>{assert.deepEqual(B.chapters.map(c=>c.id),IDS);assert.deepEqual(routes,['home','chapters','sources',...IDS]);});
test('ten chapters, one lab each, with the agreed lab ids',()=>{assert.deepEqual(B.chapters.map(c=>c.labs),LABS.map(l=>[l]));assert.equal(new Set(LABS).size,10);});
test('every lab has a renderer, a guide and an info row',()=>{
 const ctx={window:{},document:{}};vm.runInNewContext(read('js/lab-guides.js'),ctx);const G=ctx.window.MGuides.guides;
 const labs=['labs-grow','labs-today','labs-weigh'].map(f=>read(`js/${f}.js`)).join(''),app=read('js/app.js');
 for(const id of LABS){assert.match(labs,new RegExp(`MLabs\\.${id}=`),id);assert.ok(G[id],id);assert.match(app,new RegExp(`\\b${id}:\\['[^']+','[^']+','[^']+','[^']+'\\]`),id);assert.match(app,new RegExp(`GUESS=\\{[^}]*\\b${id}:`),id);}
 assert.deepEqual(Object.keys(G).sort(),[...LABS].sort());
});
test('every chapter has a figure',()=>{const ctx={window:{MMath:require('../js/math.js')}};ctx.window.window=ctx.window;vm.runInNewContext(read('js/figures.js'),ctx.window);for(const id of IDS){const f=ctx.window.MFigures.render(id);assert.ok(f&&f.svg.startsWith('<svg')&&f.caption.length>20,id);assert.doesNotMatch(f.svg+f.caption,/NaN|undefined|Infinity/,id);}});
test('chapter fields and choices are complete; empty source/cross arrays are allowed',()=>{for(const c of B.chapters){for(const k of ['id','title','subtitle','desc','time','group','labs','recall','paragraphs','formula','formulaNote','flow','warning','quiz','transfer'])assert.ok(c[k],c.id+':'+k);assert.ok(Array.isArray(c.source)&&Array.isArray(c.cross),c.id);assert.equal(c.flow.length,4,c.id);for(const q of [c.quiz,c.transfer]){assert.equal(q[1].length,3,c.id);assert.ok(q[2]>=0&&q[2]<3,c.id);assert.ok(q[3].length>10,c.id);}for(const i of c.source)assert.ok(B.sources[i],c.id+' source '+i);}});
test('every HTML script and asset exists locally and shares one version',()=>{const v=new Set();for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(url.startsWith('http')||url.startsWith('../'))continue;assert.ok(fs.existsSync(path.join(base,url.split('?')[0])),url);if(url.includes('?v='))v.add(url.split('?v=')[1]);}assert.equal(v.size,1,[...v].join());});
test('header has the shelf return, light theme, type and study scripts',()=>{assert.match(html,/<header>[\s\S]*class="shelf-return" data-shelf-return href="\.\.\/\.\.\/index.html#books"[\s\S]*<\/header>/);assert.match(html,/<html[^>]*data-typeset="book"[^>]*data-theme="light"/);assert.match(html,/\.\.\/\.\.\/assets\/type\.css/);assert.match(html,/<head>[\s\S]*book-theme\.js[\s\S]*book-study\.js\?v=[^"]+" data-book-study data-review="review\.json"[\s\S]*<\/head>/);assert.match(html,/id="theme"[^>]*>어두운 화면</);});
test('sources are HTTPS',()=>{B.sources.forEach(s=>assert.match(s[1],/^https:\/\//));});
test('cross links point to existing books and routes with a reason',()=>{for(const c of B.chapters)for(const [name,url,why] of c.cross){assert.match(url,/^\.\.\/[a-z0-9-]+\/(#[a-z0-9-]+)?$/);assert.ok(name&&why.length>20,c.id);const dir=url.split('/')[1],idx=path.join(base,'..',dir,'index.html');if(!fs.existsSync(idx))continue;const r=fs.readFileSync(idx,'utf8').match(/name="book-routes" content="([^"]+)"/);if(r&&url.includes('#'))assert.ok(r[1].split(',').includes(url.split('#')[1]),url);}});
test('the last chapter link leads to an existing route in another book',()=>{const m=read('js/app.js').match(/href="(\.\.\/([a-z0-9-]+)\/#([a-z0-9-]+))"/);assert.ok(m);const r=fs.readFileSync(path.join(base,'..',m[2],'index.html'),'utf8').match(/name="book-routes" content="([^"]+)"/)[1].split(',');assert.ok(r.includes(m[3]));});
test('art files follow the cover and shelf rules',()=>{
 const cover=read('assets/cover-art.svg').trim(),shelf=read('assets/shelf-illustration.svg');
 assert.match(cover,/^<svg class="cover-art" viewBox="0 0 320 150"[^>]*aria-label="[^"]{8,}"/);assert.doesNotMatch(cover,/@keyframes|<animate|animation|<style|<script|href=|<image/i);
 for(const [,c] of cover.matchAll(/class="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok==='cover-art'||tok.startsWith('cv-'),tok);
 assert.match(shelf,/@keyframes/);assert.match(shelf,/animation\s*:/);assert.match(shelf,/prefers-reduced-motion/);assert.match(shelf,/html\[data-motion=reduce\]/);
 for(const [,c] of shelf.matchAll(/(?:class|id)="([^"]+)"/g))for(const tok of c.split(' '))assert.ok(tok.startsWith('mn-'),tok);
});
