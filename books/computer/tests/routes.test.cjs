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

test('장마다 전이 문항이 질문·보기 3개·정답 번호·해설 형식이다', () => {
  for (const c of book.chapters) {
    const [q, options, answer, why] = c.transfer || [];
    assert.ok(typeof q === 'string' && q.length > 10, `${c.id} 전이 질문`);
    assert.equal(options.length, 3, `${c.id} 전이 보기`);
    assert.ok(Number.isInteger(answer) && answer >= 0 && answer <= 2, `${c.id} 전이 정답`);
    assert.ok(typeof why === 'string' && why.length > 20, `${c.id} 전이 해설`);
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

test('7장 번역 표의 칸·명령·바이트가 실제 곱셈 프로그램과 같다', () => {
  const C = require('../js/cpu.js');
  const aside = book.chapters.find((c) => c.id === 'programs').aside;
  const rows = [...aside.matchAll(/<td>(\d+)<\/td><td>([A-Z]+(?: \d+)?)<\/td><td>(\d+)<\/td>/g)];
  assert.equal(rows.length, 11);
  for (const [, cell, label, byte] of rows) {
    const mem = C.PROGRAMS.multiply.memory[Number(cell)];
    assert.equal(mem, Number(byte), `${cell}번 칸 바이트`);
    assert.equal(C.decode(mem).label, label, `${cell}번 칸 명령`);
  }
});
