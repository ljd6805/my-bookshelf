import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGraph, spineGrid, islandRadius, ringRadius, ringOrder, layoutIslands, layoutFocus } from '../assets/atlas-model.mjs';

const TONES = ['aqua', 'blue', 'violet', 'sage', 'amber', 'rose'];

/* fields: [[이름, 권수]], links: [[개념 id, [책 id…]]] → atlas_payload와 같은 모양의 자료 */
function payload(fields, links) {
  const books = fields.flatMap(([name, n]) => Array.from({ length: n }, (_, i) => ({ id: `${name}${i}`, short: `${name} ${i}`, spine: `${name}${i}`, field: name, color: 'aqua', url: '#' })));
  return {
    fields: fields.map(([name], i) => ({ name, tone: TONES[i % 6] })),
    books,
    concepts: links.map(([id, ids]) => ({ id, name: id, aliases: [], summary: '', chapters: ids.map(book => ({ book, url: '#', title: '01 · 장' })) })),
  };
}

const SMALL = payload([['가', 3], ['나', 1], ['다', 2]], [['x', ['가0', '나0']], ['y', ['가1', '나0', '다0']], ['z', ['다0', '다1']]]);

function noOverlap(islands) {
  islands.forEach((a, i) => islands.slice(i + 1).forEach(b => {
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= a.r + b.r, `${a.name}·${b.name} 겹침`);
  }));
}

function inside(layout) {
  layout.islands.forEach(i => {
    assert.ok(i.x - i.r >= 0 && i.y - i.r >= 0 && i.x + i.r <= layout.width && i.y + i.r <= layout.height, `${i.name} 판 밖`);
  });
}

test('bridges count the concepts two fields share, and a one-field concept stays inside its island', () => {
  const g = buildGraph(SMALL);
  assert.deepEqual(g.bridges.map(b => [b.id, b.concepts]), [['가|나', ['x', 'y']], ['가|다', ['y']], ['나|다', ['y']]]);
  assert.deepEqual(g.concepts.find(c => c.id === 'z').fields, ['다']);
  assert.deepEqual(layoutIslands(g).islands.find(i => i.name === '다').inner, ['z']);
});

test('spine grid switches to small spines after six books and island radius grows with the books', () => {
  assert.equal(spineGrid(6).big, true);
  assert.equal(spineGrid(7).big, false);
  assert.equal(spineGrid(15).cols * spineGrid(15).rows >= 15, true);
  assert.ok(islandRadius(1) >= 64);
  assert.ok(islandRadius(20) > islandRadius(6));
});

test('ring radius keeps every ring island clear of the hub and of its neighbours', () => {
  const r = ringRadius(100, [80, 80, 80, 80]);
  assert.ok(r >= 100 + 80);
  assert.ok(2 * r * Math.sin(Math.PI / 4) >= 160);
  assert.equal(ringRadius(100, []), 0);
});

test('the most connected field sits in the middle and nothing overlaps or leaves the board', () => {
  const layout = layoutIslands(buildGraph(SMALL));
  assert.equal(layout.islands.find(i => i.hub).name, '가');
  noOverlap(layout.islands);
  inside(layout);
  assert.deepEqual(layoutIslands(buildGraph(SMALL)), layout);
});

test('ring order puts the fields that share most concepts next to each other', () => {
  const fields = ['a', 'b', 'c', 'd'].map(name => ({ name }));
  const bridges = [{ a: 'a', b: 'c', concepts: [1, 2, 3] }, { a: 'b', b: 'd', concepts: [1, 2, 3] }, { a: 'a', b: 'b', concepts: [1] }];
  const order = ringOrder(fields, bridges).map(f => f.name);
  const next = (x, y) => Math.abs(order.indexOf(x) - order.indexOf(y)) % 2 === 1;
  assert.ok(next('a', 'c') && next('b', 'd'));
});

test('thirty-three books in nine fields still lay out without overlaps, and only far ring pairs hide their bridge', () => {
  const fields = [['AI', 15], ['기초', 3], ['수학', 2], ['컴', 1], ['지식', 1], ['물리', 4], ['경제', 2], ['언어', 3], ['생물', 2]];
  const books = fields.flatMap(([n, k]) => Array.from({ length: k }, (_, i) => `${n}${i}`));
  const links = Array.from({ length: 40 }, (_, n) => [`k${n}`, [books[n % 15], books[15 + (n * 7) % 18], books[(n * 5) % 33]]]);
  const layout = layoutIslands(buildGraph(payload(fields, links)));
  noOverlap(layout.islands);
  inside(layout);
  const hub = layout.islands.find(i => i.hub).name;
  layout.bridges.forEach(b => { if (b.a === hub || b.b === hub) assert.equal(b.shown, true); });
  assert.ok(layout.bridges.some(b => !b.shown));
});

test('a single field becomes one island with no bridges', () => {
  const layout = layoutIslands(buildGraph(payload([['하나', 2]], [['x', ['하나0', '하나1']]])));
  assert.equal(layout.islands.length, 1);
  assert.deepEqual(layout.bridges, []);
  inside(layout);
});

test('focus view keeps only books one concept away, on one ring, grouped by field', () => {
  const g = buildGraph(SMALL);
  const f = layoutFocus(g, '가0');
  assert.deepEqual(f.concepts.map(c => c.id), ['x']);
  assert.deepEqual(f.books.map(b => b.id), ['나0']);
  const wide = layoutFocus(g, '나0');
  assert.deepEqual(wide.books.map(b => b.id), ['가0', '가1', '다0']);
  wide.books.forEach(b => assert.ok(Math.abs(Math.hypot(b.x - wide.cx, b.y - wide.cy) - wide.R) < 1e-6));
  assert.deepEqual(wide.arcs.map(a => [a.name, a.count]), [['가', 2], ['다', 1]]);
  assert.equal(wide.links.length, 3);
});

test('focus view separates concept labels from each other', () => {
  const ids = Array.from({ length: 10 }, (_, i) => `b${i}`);
  const data = payload([['b', 10]], ids.slice(1).map((id, n) => [`개념 이름 ${n}`, ['b0', id, ids[(n + 3) % 10]]]));
  const f = layoutFocus(buildGraph(data), 'b0');
  f.concepts.forEach((a, i) => f.concepts.slice(i + 1).forEach(b => {
    assert.ok(Math.abs(a.x - b.x) >= (a.w + b.w) / 2 + 7 || Math.abs(a.y - b.y) >= 33, `${a.id}·${b.id} 겹침`);
  }));
});
