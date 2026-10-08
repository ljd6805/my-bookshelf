// 각 장이 서사 연결(장 지도·예측·실험·설명·확인·다음 장 이유)과 접근성 요소를 갖췄는지 검사합니다.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const CHAPTERS = ['vectors', 'similarity', 'projection', 'matrix', 'compose', 'determinant',
  'inverse', 'eigen', 'pca', 'layer', 'challenge'];
const count = (html, re) => (html.match(re) || []).length;

test('table of contents lists every chapter once, in order', () => {
  const toc = [...read('index.html').matchAll(/data-progress="([a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(toc, CHAPTERS);
});

test('every chapter carries the learning-flow parts and a reasoned next link', () => {
  CHAPTERS.forEach((id, i) => {
    const html = read(`${id}.html`);
    assert.ok(html.includes(`data-chapter="${id}"`), id);
    assert.equal(count(html, /<dt>/g), 5, `${id}: chapter map needs 5 parts`);
    assert.ok(html.includes('class="predict"'), `${id}: prediction`);
    assert.equal(count(html, /data-lab="/g), 1, `${id}: one lab`);
    // 마지막 과제는 새 도구 없이 판단을 쓰는 장이므로 설명 대신 과제 질문을 둡니다.
    if (id === 'challenge') assert.ok(html.includes('id="task"'), 'challenge: task questions');
    else assert.ok(/class="explain"[\s\S]*?<li>[\s\S]*?<li>[\s\S]*?<li>[\s\S]*?<li>/.test(html), `${id}: 4-step explanation`);
    assert.ok(count(html, /class="check"/g) >= 2, `${id}: understanding checks`);
    assert.ok(html.includes('class="today"') && html.includes('data-reset'), `${id}: today lab and reset`);
    const next = html.match(/<a class="next" href="([^"]+)"><span>([^<]+)<\/span>/);
    assert.ok(next && next[2].length > 15, `${id}: next link with reason`);
    assert.equal(next[1], i + 1 < CHAPTERS.length ? `${CHAPTERS[i + 1]}.html` : 'index.html');
    const prev = html.match(/<a class="prev" href="([^"]+)"/)[1];
    assert.equal(prev, i ? `${CHAPTERS[i - 1]}.html` : 'index.html');
    assert.ok(html.includes('class="shelf-return" data-shelf-return href="../../index.html#books"'), `${id}: shelf return`);
  });
});

test('every svg has an accessible name and every range input a label', () => {
  for (const f of ['index.html', ...CHAPTERS.map((c) => `${c}.html`)]) {
    const html = read(f);
    for (const svg of html.match(/<svg[^>]*>/g) || []) assert.ok(/aria-labelledby=|aria-label=/.test(svg), `${f}: ${svg}`);
    for (const m of html.matchAll(/<input type="range" id="([^"]+)"/g)) assert.ok(html.includes(`for="${m[1]}"`), `${f}: label for ${m[1]}`);
    assert.ok(html.includes('<figcaption>'), `${f}: figure caption`);
  }
});

test('catalog entry points inside this book with stable chapter files', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, '../../data/catalog.json'), 'utf8'));
  const book = catalog.books.find((b) => b.id === 'linear-algebra-world');
  const base = new URL('https://example.test/my-bookshelf/');
  assert.equal(new URL(book.url, base).pathname, '/my-bookshelf/books/linear-algebra/');
  for (const ch of book.chapters) {
    const u = new URL(ch.url, base);
    assert.ok(u.pathname.startsWith('/my-bookshelf/books/linear-algebra/'), ch.url);
    const file = u.pathname.endsWith('/') ? 'index.html' : u.pathname.split('/').pop();
    assert.ok(fs.existsSync(path.join(root, file)), ch.url);
    if (u.hash) assert.ok(read(file).includes(`id="${u.hash.slice(1)}"`), ch.url);
  }
});
