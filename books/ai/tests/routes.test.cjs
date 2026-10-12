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

test('every chapter has predict, remaining, next reason and a transfer question in [question, 3 options, answer, explanation] form',()=>{
 const chapters=context.window.AIBook.chapters;
 chapters.forEach((c,i)=>{
  for(const key of ['predict','remaining'])assert.ok(typeof c[key]==='string'&&c[key].length>20,`${c.id}.${key}`);
  if(i<chapters.length-1)assert.ok(typeof c.next==='string'&&c.next.length>20,`${c.id}.next`);
  const [q,options,answer,why]=c.transfer||[];
  assert.equal(typeof q,'string',`${c.id}.transfer question`);
  assert.ok(Array.isArray(options)&&options.length===3&&options.every(o=>typeof o==='string'&&o),`${c.id}.transfer options`);
  assert.ok(Number.isInteger(answer)&&answer>=0&&answer<=2,`${c.id}.transfer answer`);
  assert.ok(typeof why==='string'&&why.length>20,`${c.id}.transfer explanation`);
 });
});

test('final capstone chapter closes the book and the previous chapter leads into it',()=>{
 const chapters=context.window.AIBook.chapters,last=chapters[chapters.length-1];
 assert.equal(last.id,'final');assert.ok(/^[a-z]+$/.test(last.id));
 assert.match(chapters[chapters.length-2].next,/마지막 장/);
 assert.ok(last.cross.some(([,url])=>url.startsWith('../')),'cross link to another book');
 assert.ok(last.labs.length>=1&&last.labs.length<=2);
 assert.ok(html.includes('js/labs-final.js'));
});
