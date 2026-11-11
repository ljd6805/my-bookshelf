/* 장 데이터·경로·자산·실험·그림·복습 문항의 일관성 검사. 루트 validate.py와 함께 CI에서 실행한다. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(base,f),'utf8');
const html=read('index.html'),app=read('js/app.js');
const ctx={document:{documentElement:{dataset:{}},querySelector:()=>null},console};ctx.window=ctx;vm.createContext(ctx);
for(const [,src] of html.matchAll(/<script src="(js\/(?:math|content|visual|scene3d|figures|labs-[\w-]+|lab-guides|easy)\.js)[^"]*"/g))vm.runInContext(read(src),ctx);
const B=ctx.DVBook,labs=ctx.DVLabs,guides=ctx.DVGuides.guides,figures=ctx.DVFigures,easy=ctx.DVEasy,M=ctx.DVMath;
const info=vm.runInContext('('+app.slice(app.indexOf('const info=')+11,app.indexOf('};',app.indexOf('const info='))+1)+')',ctx);
test('12 unique chapters with every field and three worked examples',()=>{
 assert.equal(B.chapters.length,12);assert.equal(new Set(B.chapters.map(c=>c.id)).size,12);
 for(const c of B.chapters){
  for(const k of ['id','title','subtitle','desc','time','group','labs','source','thumb','recall','paragraphs','formula','formulaNote','flow','examples','warning','quiz','transfer'])assert.ok(c[k]!==undefined&&c[k]!=='',c.id+':'+k);
  assert.match(c.id,/^[a-z][a-z0-9-]*$/);assert.equal(c.paragraphs.length,2,c.id);assert.ok(c.labs.length>=1&&c.labs.length<=2,c.id+' labs');assert.equal(c.thumb.length,3);
  assert.equal(c.quiz[1].length,3);assert.ok(c.quiz[2]>=0&&c.quiz[2]<3);assert.ok(c.flow.length>=3&&c.flow.length<=5,c.id+' flow');
  assert.equal(c.examples.length,3,c.id+' examples');for(const e of c.examples){assert.ok(e[0].length>4);assert.ok(e[1].length>=3&&e[1].every(s=>typeof s==='string'&&s.length>5),c.id+' steps');}
  for(const i of c.source)assert.ok(B.sources[i],c.id+' source '+i);
 }
});
test('every lab has a title, prediction, task, guide with presets, and a renderer',()=>{
 const ids=B.chapters.flatMap(c=>c.labs);assert.equal(ids.length,18);assert.equal(new Set(ids).size,18,'lab ids unique');assert.deepEqual(Object.keys(info).sort(),[...ids].sort());
 for(const id of ids){assert.equal(info[id].length,4,id);assert.ok(info[id].every(s=>s.length>10),id);assert.equal(typeof labs[id],'function',id);
  const g=guides[id];assert.ok(g&&g[1].length>=3,id+' presets');const text=g[2]();assert.ok(text.length>80&&!/NaN|undefined|정의되지 않음/.test(text),id+' reading');
  const src=fs.readdirSync(path.join(base,'js')).filter(f=>f.startsWith('labs-')).map(f=>read('js/'+f)).join('');
  for(const p of g[1])for(const key of Object.keys(p[1]))assert.ok(src.includes(`'${key}'`),id+' preset control '+key);}
});
test('every chapter has an animated figure, a caption, and an easy box',()=>{
 for(const c of B.chapters){const f=figures.render(c.id);assert.ok(f,c.id+' figure');assert.match(f.svg,/role="img" aria-label="[^"]{8,}"/);assert.match(f.svg,/dvf-(seq|turn|draw|swing|spin|pkt|pulse-soft)/,c.id+' figure must move');assert.ok(f.caption.length>20&&!/NaN|undefined/.test(f.svg+f.caption));
  const e=easy[c.id];assert.ok(e&&e.easy.length===2&&e.words.length>=3,c.id+' easy');}
 const css=read('assets/style.css');for(const k of ['seq','turn','draw','swing','spin','pkt'])assert.ok(css.includes('@keyframes dvf-'+k),k);assert.match(css,/html\[data-motion=reduce\] \.dvf-seq/);
});
test('book routes list every chapter and the home paths point to chapters',()=>{
 const routes=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');
 assert.deepEqual(routes,['home','chapters','sources',...B.chapters.map(c=>c.id)]);
 for(const p of B.meta.paths)for(const id of p.chapters)assert.ok(B.chapters.some(c=>c.id===id),id);
 assert.ok(B.chapters.some(c=>c.id===B.meta.feature[0]));assert.match(B.meta.next[0],/^\.\.\/[a-z-]+\/#[a-z-]+$/);
});
test('every local script and asset exists and shares one version',()=>{
 const versions=new Set();for(const [,url] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|\.\.\/)/.test(url))continue;const [file,v]=url.split('?v=');assert.ok(fs.existsSync(path.join(base,file)),url);if(v)versions.add(v);}
 assert.equal(versions.size,1,'one asset version');
});
test('header keeps the standard shelf return, light theme and study script',()=>{
 assert.match(html,/<header>[\s\S]*class="shelf-return" data-shelf-return href="\.\.\/\.\.\/index.html#books"[\s\S]*<\/header>/);assert.match(html,/<html lang="ko" data-typeset="book" data-theme="light">/);assert.match(html,/data-book-study data-review="review.json"/);
});
test('sources are HTTPS and cross links name a reason',()=>{B.sources.forEach(s=>{assert.match(s[1],/^https:\/\//);assert.ok(s[2].length>10);});for(const c of B.chapters){assert.ok((c.cross||[]).length>=1,c.id+' cross');for(const x of c.cross){assert.match(x[1],/^\.\.\/[a-z0-9-]+\/#[a-z0-9-]+$/);assert.ok(x[2].length>20);}}});
test('transfer questions and rotated quiz order',()=>{
 B.chapters.forEach((c,i)=>{const [q,o,a,why]=c.transfer;assert.ok(q.length>15&&o.length===3&&Number.isInteger(a)&&a>=0&&a<3&&why.length>20,c.id);assert.notEqual(q,c.quiz[0]);
  assert.equal(M.quizOrder(3,c.quiz[2],i%3)[i%3],c.quiz[2]);assert.equal(M.quizOrder(3,a,(i+1)%3)[(i+1)%3],a);});
});
test('review quiz covers every chapter with mixed answer slots',()=>{
 const r=JSON.parse(read('review.json')),count=[0,0,0,0];assert.equal(r.book,'derivative');assert.equal(Object.keys(r.chapters).join(),B.chapters.map(c=>c.id).join());
 for(const [id,qs] of Object.entries(r.chapters)){assert.ok(qs.length>=2,id);for(const q of qs){assert.ok(q.choices.length>=3&&new Set(q.choices).size===q.choices.length,id);assert.ok(q.answer>=0&&q.answer<q.choices.length);assert.ok(q.why.length>20);count[q.answer]++;}}
 assert.ok(Math.max(...count.slice(0,3))-Math.min(...count.slice(0,3))<=2,'answers spread');
});
test('numbers quoted in the prose match the model',()=>{
 const text=JSON.stringify(B.chapters),has=s=>assert.ok(text.includes(s),s);
 has('9.95');has('2,000 cm³');has('3.92');has('1,056');has('0.7351');has('56.5');has('3.74');has('264.4');has('11.89');has('−35.6');
 assert.equal(M.box(5,30,30).V,2000);assert.ok(Math.abs(M.canBest(1).cost-264.4)<0.05);assert.ok(Math.abs(M.can(3,1).dCost+35.6)<0.05);
});
