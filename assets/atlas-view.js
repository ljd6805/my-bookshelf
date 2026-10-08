/* 지식 지도 화면. 좌표는 atlas-model.mjs가 계산하고, 여기서는 SVG를 그리고 고른 것을 밝히고
   옆 설명판을 채웁니다. 스크립트가 없으면 build_catalog.py가 만든 개념 목록이 그대로 보입니다. */
import { buildGraph, layoutIslands, layoutFocus, blob } from './atlas-model.mjs?v=20261008-islands1';

const NS = 'http://www.w3.org/2000/svg';

function svg(tag, attrs, parent) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs || {}).forEach(([k, v]) => { if (v !== undefined && v !== null) node.setAttribute(k, v); });
  if (parent) parent.append(node);
  return node;
}

function label(parent, x, y, text, cls, anchor = 'middle') {
  const t = svg('text', { x, y, class: cls, 'text-anchor': anchor }, parent);
  t.textContent = text;
  return t;
}

function stacked(parent, x, y, text, step, cls) {
  const t = svg('text', { x, y, class: cls, 'text-anchor': 'middle' }, parent);
  [...text.replace(/\s/g, '')].forEach((ch, i) => {
    const span = svg('tspan', { x, dy: i ? step : 0 }, t);
    span.textContent = ch;
  });
  return t;
}

const asButton = (node, name) => { node.setAttribute('role', 'button'); node.setAttribute('tabindex', '0'); node.setAttribute('aria-label', name); return node; };

function drawSpine(parent, spine, book, big) {
  const g = svg('g', { class: `atlas-spine tone-${book.color}`, 'data-book': book.id }, parent);
  svg('title', {}, g).textContent = `${book.short} · 이 책 중심으로 보기`;
  svg('rect', { x: spine.x, y: spine.y, width: spine.w, height: spine.h, rx: 4, class: 'spine-glass' }, g);
  svg('rect', { x: spine.x + 3, y: spine.y + 5, width: spine.w - 6, height: spine.h - 10, rx: 2, class: 'spine-paper' }, g);
  if (big) stacked(g, spine.x + spine.w / 2, spine.y + 17, [...book.spine.replace(/\s/g, '')].slice(0, 6).join(''), 11.5, 'spine-text');
}

function drawIsland(parent, island, ctx) {
  const concepts = ctx.graph.concepts.filter(c => c.fields.includes(island.name)).length;
  const g = asButton(svg('g', { class: `atlas-island tone-${island.tone}${island.hub ? ' is-hub' : ''}`, 'data-field': island.name }, parent),
    `${island.name} 섬, 책 ${island.count}권, 다른 분야와 함께 쓰는 개념 ${concepts}개`);
  svg('path', { d: blob(island.x, island.y, island.r + 9, island.name.length), class: 'isl-halo' }, g);
  svg('path', { d: island.outline, class: 'isl-base' }, g);
  svg('path', { d: island.outline, class: 'isl-land' }, g);
  label(g, island.x, island.titleY, island.name, 'isl-name');
  label(g, island.x, island.countY, `${island.count}권 · 개념 ${concepts}개`, 'isl-count');
  island.spines.forEach(s => drawSpine(g, s, ctx.graph.bookById.get(s.book), island.big));
}

function drawBadge(parent, bridge) {
  const [a, b] = [bridge.a, bridge.b];
  const g = asButton(svg('g', { class: `atlas-badge${bridge.shown ? '' : ' is-far'}`, 'data-bridge': bridge.id }, parent),
    `${a}와 ${b}가 함께 쓰는 개념 ${bridge.concepts.length}개`);
  svg('rect', { x: bridge.badge.x - 36, y: bridge.badge.y - 13, width: 72, height: 26, rx: 13 }, g);
  label(g, bridge.badge.x, bridge.badge.y + 4.5, `개념 ${bridge.concepts.length}`, 'badge-text');
}

export function drawMap(ctx) {
  const portrait = Boolean(ctx.portrait);
  if (!ctx.layout || ctx.layout.portrait !== portrait) ctx.layout = layoutIslands(ctx.graph, { portrait });
  const L = ctx.layout;
  const root = svg('svg', { viewBox: `0 0 ${L.width} ${L.height}`, class: `atlas-svg is-map${portrait ? ' is-portrait' : ''}`, role: 'group',
    'aria-label': `분야 섬 지도: 분야 ${L.islands.length}개, 다리 ${L.bridges.length}개` });
  const defs = svg('defs', {}, root);
  const sea = svg('pattern', { id: 'atlas-sea', width: 24, height: 24, patternUnits: 'userSpaceOnUse' }, defs);
  svg('path', { d: 'M0 12 Q6 8 12 12 T24 12', class: 'sea-wave' }, sea);
  svg('rect', { width: L.width, height: L.height, fill: 'url(#atlas-sea)', class: 'sea' }, root);
  const under = svg('g', { class: 'atlas-bridges' }, root);
  L.bridges.filter(b => b.shown).forEach(b => svg('path', { d: b.d, class: 'atlas-bridge', 'data-bridge': b.id, 'stroke-width': b.width }, under));
  const lands = svg('g', { class: 'atlas-islands' }, root);
  L.islands.forEach(i => drawIsland(lands, i, ctx));
  const over = svg('g', { class: 'atlas-bridges is-over' }, root);
  L.bridges.filter(b => !b.shown).forEach(b => svg('path', { d: b.d, class: 'atlas-bridge is-far', 'data-bridge': b.id, 'stroke-width': b.width }, over));
  const badges = svg('g', { class: 'atlas-badges' }, root);
  L.bridges.forEach(b => drawBadge(badges, b));
  return root;
}

function drawCore(parent, F, book) {
  const g = svg('g', { class: `atlas-core tone-${book.color}` }, parent);
  svg('rect', { x: F.cx - 30, y: F.cy - 62, width: 60, height: 124, rx: 9, class: 'spine-glass' }, g);
  svg('rect', { x: F.cx - 21, y: F.cy - 50, width: 42, height: 100, rx: 4, class: 'spine-paper' }, g);
  stacked(g, F.cx, F.cy - 26, [...book.spine.replace(/\s/g, '')].slice(0, 6).join(''), 15.5, 'core-text');
  label(g, F.cx, F.cy + 86, book.short, 'core-name');
}

function drawOrbit(parent, F, ctx) {
  const crowded = F.books.length > 16;
  F.books.forEach(p => {
    const book = ctx.graph.bookById.get(p.id);
    const tone = ctx.graph.fields.find(f => f.name === book.field).tone;
    const g = asButton(svg('g', { class: `atlas-orbit tone-${tone}${crowded ? ' is-crowded' : ''}`, 'data-book': p.id }, parent),
      `${book.short} · ${book.field}, 이 책을 가운데로`);
    svg('title', {}, g).textContent = `${book.short} · ${book.field}`;
    svg('rect', { x: p.x - 9, y: p.y - 17, width: 18, height: 34, rx: 3, class: 'spine-glass' }, g);
    svg('rect', { x: p.x - 5.5, y: p.y - 13, width: 11, height: 26, rx: 2, class: 'spine-paper' }, g);
    label(g, p.lx, p.ly, book.short, 'orbit-name', p.anchor);
  });
}

export function drawFocus(ctx, bookId) {
  const F = layoutFocus(ctx.graph, bookId);
  const book = ctx.graph.bookById.get(bookId);
  const root = svg('svg', { viewBox: `0 0 ${F.width} ${F.height}`, class: 'atlas-svg is-focus', role: 'group',
    'aria-label': `${book.short} 중심 지도: 개념 ${F.concepts.length}개, 이어지는 책 ${F.books.length}권` });
  svg('circle', { cx: F.cx, cy: F.cy, r: F.R, class: 'orbit-ring' }, root);
  F.arcs.forEach(a => {
    svg('path', { d: a.d, class: `atlas-arc tone-${a.tone}` }, root);
    label(root, a.lx, a.ly, a.name, `arc-name tone-${a.tone}`);
  });
  const lines = svg('g', { class: 'atlas-links' }, root);
  F.concepts.forEach(c => svg('path', { d: `M${F.cx} ${F.cy} L${c.x} ${c.y}`, class: 'atlas-spoke', 'data-concept': c.id }, lines));
  const toneOf = id => ctx.graph.fields.find(f => f.name === ctx.graph.bookById.get(id).field).tone;
  F.links.forEach(l => svg('path', { d: l.d, class: `atlas-link tone-${toneOf(l.book)}`, 'data-concept': l.concept, 'data-book': l.book }, lines));
  drawOrbit(svg('g', { class: 'atlas-orbits' }, root), F, ctx);
  const pills = svg('g', { class: 'atlas-pills' }, root);
  F.concepts.forEach(c => {
    const g = asButton(svg('g', { class: 'atlas-pill', 'data-concept': c.id }, pills), `${c.name} 개념 보기`);
    svg('rect', { x: c.x - c.w / 2, y: c.y - 15, width: c.w, height: 30, rx: 15 }, g);
    label(g, c.x, c.y + 5, c.name, 'pill-text');
  });
  drawCore(root, F, book);
  if (!F.concepts.length) label(root, F.cx, F.cy + 120, '아직 다른 책과 함께 쓰는 개념이 없습니다', 'empty-note');
  return root;
}
