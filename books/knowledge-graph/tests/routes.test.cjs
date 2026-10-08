const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'js/content.js'),'utf8'),context);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const book=context.window.KGBook;
const routes=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');

test('declared hash routes match all chapter IDs and entry routes',()=>{
 assert.deepEqual([...routes].sort(),['home','chapters','sources',...book.chapters.map(c=>c.id)].sort());
});

test('every chapter fills the standard fields from docs/08',()=>{
 for(const c of book.chapters){
  for(const key of ['id','title','subtitle','desc','time','group','labs','source','paragraphs','formula','formulaNote','flow','warning','quiz'])assert.ok(c[key],`${c.id}.${key}`);
  assert.equal(c.paragraphs.length,2,c.id);assert.equal(c.quiz[1].length,3,c.id);assert.ok(c.quiz[2]>=0&&c.quiz[2]<3,c.id);
  assert.ok(c.labs.length>=1&&c.labs.length<=2,c.id);for(const i of c.source)assert.ok(book.sources[i],`${c.id} source ${i}`);
 }
});

test('every lab has a renderer, an info row and a guide',()=>{
 const labs=book.chapters.flatMap(c=>c.labs),app=fs.readFileSync(path.join(root,'js/app.js'),'utf8'),guides=fs.readFileSync(path.join(root,'js/lab-guides.js'),'utf8');
 const code=['labs-structure.js','labs-use.js'].map(f=>fs.readFileSync(path.join(root,'js',f),'utf8')).join('');
 for(const id of labs){assert.match(code,new RegExp(`L\\.${id}=`),id);assert.match(app,new RegExp(`\\n${id}:\\[`),id);assert.match(guides,new RegExp(`\\n${id}:\\[`),id);}
});

test('catalog book and chapter links resolve inside the book',()=>{
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'../../data/catalog.json'),'utf8'));
 const entry=catalog.books.find(b=>b.id==='knowledge-graph-ontology');
 const base=new URL('https://example.test/my-bookshelf/');
 assert.equal(new URL(entry.url,base).pathname,'/my-bookshelf/books/knowledge-graph/');
 for(const chapter of entry.chapters){const url=new URL(chapter.url,base);assert.equal(url.pathname,'/my-bookshelf/books/knowledge-graph/');assert.ok(routes.includes(url.hash.slice(1)),chapter.url);}
 assert.ok(html.includes('href="../../index.html#books"'));
});

test('cross links to other books carry a reason and use ../topic/#chapter',()=>{
 for(const c of book.chapters)for(const [label,url,why] of c.cross||[]){assert.match(url,/^\.\.\/[a-z-]+\/#[\w-]+$/,url);assert.ok(label&&why.length>20,url);}
 assert.ok(book.chapters.filter(c=>c.cross).length>=5);
});
