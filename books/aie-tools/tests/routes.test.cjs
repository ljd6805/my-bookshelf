/* 장 데이터·경로·자산·실험 표의 일관성 검사. 루트 validate.py와 함께 CI에서 실행한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const html=read('index.html'),prefix=(read('js/content.js').match(/window\.(\w+)Book=/)||[])[1];
const ctx={document:{}};ctx.window=ctx;vm.createContext(ctx);
for(const [,src] of html.matchAll(/<script src="(js\/(?:math|content|visual|figures|labs-[\w-]+|lab-guides)\.js)[^"]*"/g))vm.runInContext(read(src),ctx);
const B=ctx.window[prefix+'Book'],labs=ctx.window[prefix+'Labs'],guides=ctx.window[prefix+'Guides'].guides,figures=ctx.window[prefix+'Figures'];
test('8~12 unique chapters with every field',()=>{
 assert.ok(B.chapters.length>=8&&B.chapters.length<=12,'chapter count');
 assert.equal(new Set(B.chapters.map(c=>c.id)).size,B.chapters.length);
 for(const c of B.chapters){
  for(const k of ['id','title','subtitle','desc','time','group','labs','source','paragraphs','formula','formulaNote','flow','warning','quiz'])assert.ok(c[k]!==undefined&&c[k]!=='',c.id+':'+k);
  assert.match(c.id,/^[a-z][a-z0-9-]*$/);assert.equal(c.paragraphs.length,2,c.id);assert.ok(c.labs.length>=1&&c.labs.length<=2,c.id+' labs');
  assert.equal(c.quiz[1].length,3);assert.ok(c.quiz[2]>=0&&c.quiz[2]<3);assert.ok(c.flow.length>=3&&c.flow.length<=4,c.id+' flow');
  for(const i of c.source)assert.ok(B.sources[i],c.id+' source '+i);
 }
});
test('every lab has info, guide with presets, and a renderer',()=>{
 const ids=B.chapters.flatMap(c=>c.labs);assert.equal(new Set(ids).size,ids.length,'lab ids unique');
 for(const id of ids){assert.equal(B.info[id].length,3,id);assert.equal(typeof labs[id],'function',id);assert.ok(guides[id]&&guides[id][1].length>=2,id+' presets');}
});
test('every chapter has its own animated figure with a caption',()=>{
 for(const c of B.chapters){assert.ok(figures.F[c.id],c.id+' needs a custom figure');const f=figures.render(c);assert.match(f.svg,/role="img" aria-label="[^"]{8,}"/);assert.match(f.svg,/fig-(pkt|seq|turn|pulse|grow|draw|dash)/,c.id+' figure must move');assert.ok(f.caption.length>10);}
});
test('book routes list every chapter and the home paths point to chapters',()=>{
 const routes=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');
 assert.deepEqual(routes,['home','chapters','sources',...B.chapters.map(c=>c.id)]);
 for(const p of B.meta.paths)for(const id of p.chapters)assert.ok(B.chapters.some(c=>c.id===id),id);
 assert.ok(B.chapters.some(c=>c.id===B.meta.feature[0]));
});
test('every local script and asset exists',()=>{for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|\.\.\/)/.test(url))continue;assert.ok(fs.existsSync(path.join(base,url.split('?')[0])),url);}});
test('header keeps the standard shelf return and the original curriculum is credited',()=>{assert.match(html,/<header>[\s\S]*data-shelf-return href="\.\.\/\.\.\/index.html#books"[\s\S]*<\/header>/);assert.match(html,/rohitg00\/ai-engineering-from-scratch/);assert.ok(B.sources.some(s=>s[1].includes('rohitg00/ai-engineering-from-scratch')));});
test('sources are HTTPS and cross links name a reason',()=>{B.sources.forEach(s=>assert.match(s[1],/^https:\/\//));for(const c of B.chapters)for(const x of c.cross||[]){assert.match(x[1],/^\.\.\/[a-z0-9-]+\/(#[a-z0-9-]+)?$/);assert.ok(x[2].length>8);}});
