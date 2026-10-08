const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/content.js'), 'utf8'), context);
const book = context.window.ProbBook;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const routes = html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');

test('declared hash routes match chapter IDs and entry routes', () => {
  assert.deepEqual([...routes].sort(), ['home', 'chapters', 'sources', 'final', ...book.chapters.map((c) => c.id)].sort());
});

test('every chapter carries the full learning flow and links forward', () => {
  for (const c of book.chapters) {
    for (const key of ['prev', 'problem', 'figureCaption', 'explain', 'remaining', 'nextWhy']) assert.ok(c[key] && c[key].length > 10, `${c.id}.${key}`);
    assert.ok(c.predict.answer < c.predict.options.length, c.id);
    assert.ok(c.transfer.q && c.transfer.a && c.check.q && c.check.a, c.id);
    for (const d of c.deeper) assert.ok(d.why.length > 10, `${c.id} cross link needs a reason`);
  }
});

test('every lab has a guide with purpose, reading and challenge', () => {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/guides.js'), 'utf8'), ctx);
  for (const c of book.chapters) {
    const g = ctx.window.ProbGuides[c.lab];
    assert.ok(g, `${c.lab} guide`);
    for (const key of ['purpose', 'reading', 'challenge']) assert.ok(g[key] && g[key].length > 20, `${c.lab}.${key}`);
  }
});

test('cross-book links point at declared routes of another book', () => {
  const routes = (dir) => new Set(fs.readFileSync(path.join(root, '..', dir, 'index.html'), 'utf8')
    .match(/name="book-routes" content="([^"]+)"/)[1].split(','));
  for (const c of book.chapters) for (const d of c.deeper) {
    const [, dir, hash] = d.href.match(/^\.\.\/([a-z-]+)\/#(.+)$/) || [];
    assert.ok(dir && dir !== 'probability', d.href);
    assert.ok(routes(dir).has(hash), d.href);
  }
});

test('catalog entry and chapter links resolve inside this book', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, '../../data/catalog.json'), 'utf8'));
  const entry = catalog.books.find((b) => b.id === book.id);
  const base = new URL('https://example.test/my-bookshelf/');
  assert.equal(new URL(entry.url, base).pathname, '/my-bookshelf/books/probability/');
  for (const ch of entry.chapters) {
    const url = new URL(ch.url, base);
    assert.equal(url.pathname, '/my-bookshelf/books/probability/');
    assert.ok(routes.includes(url.hash.slice(1)), ch.url);
  }
  assert.ok(html.includes('href="../../index.html#books"'));
});
