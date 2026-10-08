const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'js/content.js'),'utf8'),context);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('declared hash routes match all chapter IDs and entry routes',()=>{
 const declared=html.match(/name="book-routes" content="([^"]+)"/)[1].split(',').sort();
 const expected=['home','chapters','sources',...context.window.AIBook.chapters.map(c=>c.id)].sort();
 assert.deepEqual(declared,expected);
});

test('catalog book and chapter links resolve inside the integrated book',()=>{
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'../../data/catalog.json'),'utf8'));
 const book=catalog.books.find(b=>b.id==='ai-book-interactive');
 const base=new URL('https://example.test/my-bookshelf/');
 const routes=new Set(html.match(/name="book-routes" content="([^"]+)"/)[1].split(','));
 assert.equal(new URL(book.url,base).pathname,'/my-bookshelf/books/ai/');
 for(const chapter of book.chapters){
  const url=new URL(chapter.url,base);
  assert.equal(url.pathname,'/my-bookshelf/books/ai/');
  assert.ok(routes.has(url.hash.slice(1)),chapter.url);
 }
 assert.ok(html.includes('href="../../index.html#books"'));
});
