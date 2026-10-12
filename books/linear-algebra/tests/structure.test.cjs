// AI Book과 같은 한 페이지 구성(해시 경로·장 데이터·실험 안내)과 이 서재의 학습 흐름을 갖췄는지 검사합니다.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const context = { window: {} };
vm.runInNewContext(read('js/content.js') + read('js/lab-views.js'), context);
const { chapters, sources } = context.window.LABook;
const views = context.window.LAViews;
const html = read('index.html');
const CHAPTERS = ['vectors', 'similarity', 'projection', 'matrix', 'compose', 'determinant',
  'inverse', 'eigen', 'pca', 'layer', 'challenge'];

test('declared hash routes match all chapter IDs and entry routes', () => {
  const declared = html.match(/name="book-routes" content="([^"]+)"/)[1].split(',');
  assert.deepEqual(declared, ['home', 'chapters', 'sources', ...CHAPTERS]);
  assert.deepEqual([...chapters.map((c) => c.id)], CHAPTERS);
});

test('header matches the AI Book shell and keeps the shelf return', () => {
  assert.ok(html.includes('<header><a class="brand" href="#home">'));
  assert.ok(html.includes('<a class="shelf-return" data-shelf-return href="../../index.html#books"'));
  for (const part of ['href="#chapters"', 'href="#sources"', 'id="theme"', 'id="menu"', '<aside id="sidebar"', '<main id="main"'])
    assert.ok(html.includes(part), part);
});

test('every chapter carries the chapter parts and the learning flow', () => {
  for (const c of chapters) {
    for (const key of ['title', 'subtitle', 'desc', 'time', 'group', 'warning', 'next']) assert.ok(c[key], `${c.id}: ${key}`);
    assert.equal(c.map.length, 5, `${c.id}: chapter map (문제·이전 결과·새 도구·해결·남은 질문)`);
    assert.ok(c.concept.html.includes('<p>') && c.figure.svg.startsWith('<svg'), `${c.id}: concept and figure`);
    assert.ok(c.predict.question && c.predict.options.length >= 2, `${c.id}: prediction`);
    assert.ok(c.observe.html && c.transfer.html, `${c.id}: observe and transfer`);
    assert.ok(c.checks.length >= 2, `${c.id}: understanding checks`);
    // 마지막 과제는 새 도구 없이 판단을 쓰는 장이므로 공식 대신 과제 질문을 둡니다.
    if (c.id === 'challenge') assert.ok(c.extra.some((e) => e.heading.startsWith('과제')), 'challenge: task');
    else assert.ok(c.formula && c.formulaNote && c.example && c.question, `${c.id}: formula, worked example, next question`);
    const [q, options, answer, why] = c.quiz;
    assert.ok(q && options.length === 3 && options[answer] && why, `${c.id}: quiz`);
    assert.ok(c.sources.length && c.sources.every((i) => sources[i]), `${c.id}: sources`);
    assert.ok(c.labs.length >= 1 && c.labs.every((id) => views[id]), `${c.id}: labs`);
  }
});

test('every chapter has a multiple-choice transfer question in its transfer section', () => {
  for (const c of chapters) {
    const [q, options, answer, why] = c.transfer.quiz || [];
    assert.ok(typeof q === 'string' && q.length > 10, `${c.id}: transfer question`);
    assert.equal(options.length, 3, `${c.id}: three transfer options`);
    assert.ok(Number.isInteger(answer) && answer >= 0 && answer <= 2, `${c.id}: transfer answer`);
    assert.ok(typeof why === 'string' && why.length > 20, `${c.id}: transfer explanation`);
  }
});

test('quiz options rotate so the answer lands on the chosen slot', () => {
  const Q = require('../js/quiz.js');
  assert.deepEqual(Q.order(3, 1, 0), [1, 2, 0]);
  assert.deepEqual(Q.order(3, 0, 2), [1, 2, 0]);
  for (let a = 0; a < 3; a++) for (let t = 0; t < 3; t++) assert.equal(Q.order(3, a, t)[t], a);
  // 장 순서대로 확인 문제 정답 자리가 1·2·3번에 고르게 놓입니다.
  const slots = chapters.map((c, i) => Q.order(3, c.quiz[2], i % 3).indexOf(c.quiz[2]));
  assert.deepEqual(slots, chapters.map((_, i) => i % 3));
});

test('every lab has a guide with presets, a task, a readout and labelled inputs', () => {
  for (const c of chapters) for (const id of c.labs) {
    const v = views[id];
    assert.ok(v.title && v.desc && v.task, `${id}: heading, description, task`);
    const [purpose, presets, reading] = v.guide;
    assert.ok(purpose && reading && presets.length >= 2, `${id}: guide`);
    const names = new Set([...v.html.matchAll(/name="([^"]+)"/g)].map((m) => m[1]));
    for (const [, values] of presets) for (const key of Object.keys(values)) assert.ok(names.has(key), `${id}: preset input ${key}`);
    assert.ok(v.html.includes('class="readout" role="status"'), `${id}: readout`);
    for (const m of v.html.matchAll(/<input type="range" id="([^"]+)"/g)) assert.ok(v.html.includes(`for="${m[1]}"`), `${id}: label for ${m[1]}`);
    for (const svg of v.html.match(/<svg[^>]*>/g) || []) assert.ok(/aria-labelledby=|aria-label=/.test(svg), `${id}: ${svg}`);
  }
});

test('internal links use hash routes that exist', () => {
  const routes = new Set(['home', 'chapters', 'sources', ...CHAPTERS]);
  const text = read('js/content.js');
  assert.ok(!/href="[a-z]+\.html/.test(text), 'no links to removed chapter files');
  for (const m of text.matchAll(/href=\\"#([a-z-]+)\\"/g)) assert.ok(routes.has(m[1]), m[1]);
});

test('catalog entry points inside this book with hash chapter routes', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, '../../data/catalog.json'), 'utf8'));
  const book = catalog.books.find((b) => b.id === 'linear-algebra-world');
  const base = new URL('https://example.test/my-bookshelf/');
  const routes = new Set(html.match(/name="book-routes" content="([^"]+)"/)[1].split(','));
  assert.equal(new URL(book.url, base).pathname, '/my-bookshelf/books/linear-algebra/');
  for (const ch of book.chapters) {
    const url = new URL(ch.url, base);
    assert.equal(url.pathname, '/my-bookshelf/books/linear-algebra/', ch.url);
    assert.ok(routes.has(url.hash.slice(1)), ch.url);
  }
});
