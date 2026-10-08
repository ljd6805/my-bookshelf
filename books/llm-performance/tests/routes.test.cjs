const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(base,'js/content.js'),'utf8'),ctx);
const B=ctx.window.PBook,html=fs.readFileSync(path.join(base,'index.html'),'utf8');
test('12 unique chapters and 13 labs',()=>{assert.equal(B.chapters.length,12);assert.equal(new Set(B.chapters.map(c=>c.id)).size,12);assert.equal(B.chapters.flatMap(c=>c.labs).length,13);});
test('chapter fields, question choices and source references are complete',()=>{for(const c of B.chapters){for(const k of ['id','title','subtitle','desc','time','group','labs','source','paragraphs','formula','formulaNote','flow','warning','quiz'])assert.ok(c[k],c.id+':'+k);assert.equal(c.paragraphs.length,2);assert.equal(c.quiz[1].length,3);assert.ok(c.quiz[2]>=0&&c.quiz[2]<3);for(const i of c.source)assert.ok(B.sources[i]);}});
test('all chapter IDs are registered stable hash routes',()=>{const routes=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');for(const c of B.chapters)assert.ok(routes.includes(c.id));});
test('every HTML script and asset exists locally',()=>{for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(url.startsWith('http')||url.startsWith('../'))continue;assert.ok(fs.existsSync(path.join(base,url.split('?')[0])),url);}});
test('header has the standard bookshelf return and accessible inputs rely on labels',()=>{assert.match(html,/<header>[\s\S]*data-shelf-return href="\.\.\/\.\.\/index.html#books"[\s\S]*<\/header>/);});
test('source URLs are HTTPS',()=>B.sources.forEach(s=>assert.match(s[1],/^https:\/\//)));

test('all lab model/render/guide entries exist',()=>{const c={window:{},PUI:{},PMath:{}};vm.runInNewContext(fs.readFileSync(path.join(base,'js/visual.js'),'utf8'),c);c.PLabs=c.window.PLabs;for(const f of ['labs-measure.js','labs-kernel.js','labs-serving.js','lab-guides.js'])vm.runInNewContext(fs.readFileSync(path.join(base,'js',f),'utf8'),c);for(const id of B.chapters.flatMap(x=>x.labs)){assert.equal(typeof c.PLabs[id],'function',id);assert.equal(c.window.PGuides.guides[id].length,3,id);}});
