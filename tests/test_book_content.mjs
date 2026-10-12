// 모든 책의 js/content.js를 읽어 화면에 넣기 전 글을 검사한다.
// 1) innerHTML로 들어가는 문자열에 알 수 없는 태그가 없어야 한다(예: 수식 x_<t가 태그로 읽혀 글이 사라짐).
// 2) 전이 문항(transfer)이 있으면 [질문, 보기 3개, 정답 번호, 해설] 형식이어야 한다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const TAGS = new Set(('a b i em strong code ul ol li p br small sub sup span div table caption tr td th thead tbody '
  + 'h2 h3 h4 kbd var mark abbr figure figcaption pre blockquote dl dt dd s u details summary section '
  + 'svg g title desc rect text tspan line polyline polygon path circle ellipse defs marker use '
  + 'lineargradient stop clippath animate animatetransform pattern mask foreignobject').split(' '));

function loadBook(id) {
  const file = `books/${id}/js/content.js`;
  if (!existsSync(file)) return null;
  const window = {};
  const context = { window };
  context.globalThis = context;
  vm.runInNewContext(readFileSync(file, 'utf8'), context);
  const key = Object.keys(window).find(k => window[k] && window[k].chapters);
  return key ? window[key] : null;
}

function unknownTags(value, path, found) {
  if (typeof value === 'string') {
    for (const m of value.matchAll(/<\/?([A-Za-z][A-Za-z0-9]*)/g)) {
      if (!TAGS.has(m[1].toLowerCase())) found.push(`${path}: …${value.slice(Math.max(0, m.index - 20), m.index + 20)}…`);
    }
  } else if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) unknownTags(value[k], `${path}.${k}`, found);
  }
  return found;
}

const books = readdirSync('books').filter(id => existsSync(`books/${id}/js/content.js`));

test('every book content.js loads and has chapters', () => {
  for (const id of books) assert.ok(loadBook(id), `${id}: chapters를 찾지 못함`);
});

test('content strings contain no unknown HTML tags (escape < as &lt;)', () => {
  const found = [];
  for (const id of books) unknownTags(loadBook(id).chapters, id, found);
  assert.deepEqual(found, []);
});

test('transfer questions use [question, 3 options, answer index, explanation]', () => {
  for (const id of books) {
    for (const c of loadBook(id).chapters) {
      if (!Array.isArray(c.transfer)) continue;
      const [q, options, answer, why] = c.transfer;
      const where = `${id}#${c.id}`;
      assert.equal(typeof q, 'string', where);
      assert.ok(Array.isArray(options) && options.length === 3, `${where}: 보기 3개`);
      assert.ok(Number.isInteger(answer) && answer >= 0 && answer < 3, `${where}: 정답 번호`);
      assert.ok(typeof why === 'string' && why.length > 10, `${where}: 해설`);
    }
  }
});

test('catalog cover_meta matches chapter and experiment counts in content.js', () => {
  const catalog = JSON.parse(readFileSync('data/catalog.json', 'utf8'));
  for (const book of catalog.books.filter(b => b.status === 'published' && b.cover_meta)) {
    const id = book.url.replace(/^books\/|\/$/g, '');
    const data = loadBook(id);
    const labs = new Set();
    for (const c of data.chapters) {
      (c.labs || []).forEach(l => labs.add(l));
      if (c.lab) labs.add(typeof c.lab === 'string' ? c.lab : (c.lab.id || c.id));
    }
    assert.equal(book.cover_meta, `${data.chapters.length}장 · ${labs.size}개 실험`, `${book.id} cover_meta`);
  }
});

test('quiz explanations name options by wording, not by position (options are rotated on screen)', () => {
  const position = /(첫째|둘째|셋째|첫 번째|두 번째|세 번째|[123]번) ?(보기|답|선택지)|보기 ?[123①②③]/;
  const found = [];
  for (const id of books) {
    for (const c of loadBook(id).chapters) {
      for (const key of ['quiz', 'transfer']) {
        if (Array.isArray(c[key]) && position.test(JSON.stringify(c[key]))) found.push(`${id}#${c.id}.${key}`);
      }
    }
  }
  assert.deepEqual(found, []);
});
