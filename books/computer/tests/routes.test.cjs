const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/content.js'), 'utf8'), context);
const book = context.window.CompBook;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const routes = html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');

test('선언한 hash 경로가 장 ID·진입 경로와 같다', () => {
  assert.deepEqual([...routes].sort(), ['home', 'chapters', 'sources', ...book.chapters.map((c) => c.id)].sort());
});

test('모든 장이 AI Book과 같은 필드를 갖고 실험·자료가 실제로 있다', () => {
  for (const c of book.chapters) {
    for (const key of ['id', 'title', 'subtitle', 'desc', 'time', 'group', 'paragraphs', 'flow', 'formula', 'formulaNote', 'predict', 'warning', 'quiz']) assert.ok(c[key], `${c.id}.${key}`);
    for (const lab of c.labs) assert.ok(book.labs[lab], `${c.id} 실험 ${lab}`);
    for (const s of c.source) assert.ok(book.sources[s], `${c.id} 자료 ${s}`);
    assert.ok(c.quiz[2] >= 0 && c.quiz[2] < c.quiz[1].length, `${c.id} 정답 번호`);
  }
});

test('카탈로그의 목차 링크가 책 안의 경로로 이어진다', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, '../../data/catalog.json'), 'utf8'));
  const entry = catalog.books.find((b) => b.id === 'how-computers-work');
  const base = new URL('https://example.test/my-bookshelf/');
  assert.equal(new URL(entry.url, base).pathname, '/my-bookshelf/books/computer/');
  for (const ch of entry.chapters) assert.ok(routes.includes(new URL(ch.url, base).hash.slice(1)), ch.url);
  assert.ok(html.includes('href="../../index.html#books"'));
});
