/* 지식 지도의 동작: 섬 지도와 책 중심 보기를 오가고, 고른 섬·다리·개념을 밝히고, 옆 설명판을 채웁니다.
   계산은 atlas-model.mjs, 그리기는 atlas-view.js가 맡습니다. */
import { buildGraph } from './atlas-model.mjs?v=20261008-islands1';
import { drawMap, drawFocus } from './atlas-view.js?v=20261008-islands1';

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'text') node.textContent = v;
    else if (k === 'on') node.addEventListener('click', v);
    else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  });
  node.append(...children.filter(Boolean));
  return node;
}

const kicker = text => el('p', { class: 'stop-kicker', text });
const chip = (text, on, extra = {}) => el('button', { type: 'button', class: 'atlas-chip', on, ...extra }, text);
const chips = items => el('div', { class: 'atlas-chips' }, ...items);

function partners(graph, name) {
  return graph.bridges.filter(b => b.a === name || b.b === name)
    .map(b => ({ bridge: b, other: b.a === name ? b.b : b.a }))
    .sort((x, y) => y.bridge.concepts.length - x.bridge.concepts.length);
}

function panelIntro(ctx) {
  const top = [...ctx.graph.bridges].sort((a, b) => b.concepts.length - a.concepts.length).slice(0, 3);
  return [kicker('지도 읽는 법'), el('h4', { text: '섬을 눌러 보세요', tabindex: '-1' }),
    el('p', { text: `섬 하나가 분야 하나이고, 섬 위에 그 분야의 책이 섭니다. 분야 ${ctx.graph.fields.length}개, 책 ${ctx.graph.books.length}권, 개념 ${ctx.graph.concepts.length}개가 이어져 있습니다. 가운데 섬은 다른 분야와 개념을 가장 많이 함께 쓰는 분야입니다.` }),
    kicker('가장 굵은 다리'),
    chips(top.map(b => chip(`${b.a} ↔ ${b.b} · ${b.concepts.length}`, () => select(ctx, { type: 'bridge', id: b.id })))),
    el('p', { class: 'atlas-tip', text: '책등을 누르면 그 책 하나를 가운데 두고 이어지는 개념과 책만 보여 줍니다.' })];
}

function panelIsland(ctx, name) {
  const g = ctx.graph;
  const field = g.fields.find(f => f.name === name);
  const concepts = g.concepts.filter(c => c.fields.includes(name));
  return [kicker('섬 · 분야'), el('h4', { text: name, tabindex: '-1' }),
    el('p', { text: `책 ${field.books.length}권이 서 있고, 다른 분야와 개념 ${concepts.length}개를 함께 씁니다.` }),
    kicker('섬 위의 책 · 누르면 그 책 중심으로'),
    chips(field.books.map(id => chip(g.bookById.get(id).short, () => focusOn(ctx, id, true), { class: `atlas-chip is-book tone-${g.bookById.get(id).color}` }))),
    kicker('함께 쓰는 분야'),
    chips(partners(g, name).map(p => chip(`${p.other} · 개념 ${p.bridge.concepts.length}`, () => select(ctx, { type: 'bridge', id: p.bridge.id })))),
    kicker('이 분야를 지나는 개념'),
    chips(concepts.map(c => chip(c.name, () => select(ctx, { type: 'concept', id: c.id })))),
    backButton(ctx)];
}

function panelBridge(ctx, id) {
  const b = ctx.graph.bridges.find(x => x.id === id);
  const far = ctx.layout?.bridges.find(x => x.id === id)?.shown === false;
  return [kicker(`다리 · ${b.a} ↔ ${b.b}`), el('h4', { text: `두 분야가 함께 쓰는 개념 ${b.concepts.length}개`, tabindex: '-1' }),
    el('p', { text: far ? '두 섬이 지도 건너편에 있어 평소에는 이 다리를 감춰 두고, 고를 때만 점선으로 보여 줍니다.'
      : '개념을 누르면 두 분야의 어느 장에서 만나는지 보입니다.' }),
    chips(b.concepts.map(cid => chip(ctx.graph.concepts.find(c => c.id === cid).name, () => select(ctx, { type: 'concept', id: cid })))),
    backButton(ctx)];
}

function chapterGroups(ctx, concept) {
  const g = ctx.graph;
  const order = [...concept.books].sort((a, b) => (a === ctx.book ? -1 : b === ctx.book ? 1 : 0));
  return order.map(id => {
    const book = g.bookById.get(id);
    const links = concept.chapters.filter(ch => ch.book === id).map(ch => el('li', {}, el('a', { href: ch.url, text: ch.title })));
    const head = id === ctx.book ? el('strong', { text: book.short })
      : el('button', { type: 'button', class: 'atlas-book-link', on: () => focusOn(ctx, id, true), title: `${book.short} 중심으로 보기` }, book.short);
    return el('div', { class: `atlas-book-group tone-${book.color}` },
      el('p', { class: 'atlas-book-head' }, el('span', { class: 'step-book', text: book.field }), head), el('ul', {}, ...links));
  });
}

function panelConcept(ctx, id) {
  const c = ctx.graph.concepts.find(x => x.id === id);
  return [kicker(ctx.mode === 'focus' ? `개념 · ${ctx.graph.bookById.get(ctx.book).short}에서 출발` : '개념'),
    el('h4', { text: c.name, tabindex: '-1' }),
    c.aliases.length ? el('p', { class: 'concept-alias', lang: 'en', text: c.aliases.join(', ') }) : null,
    el('p', { class: 'concept-summary', text: c.summary }),
    kicker(`${c.books.length}권 · ${c.chapters.length}개 장에서 만납니다`),
    ...chapterGroups(ctx, c), backButton(ctx)];
}

function panelFocus(ctx) {
  const g = ctx.graph, book = g.bookById.get(ctx.book);
  const concepts = g.concepts.filter(c => c.books.includes(book.id));
  const reach = new Set(concepts.flatMap(c => c.books)); reach.delete(book.id);
  return [kicker(`가운데 책 · ${book.field}`), el('h4', { text: book.title, tabindex: '-1' }),
    el('p', { text: `개념 ${concepts.length}개로 다른 책 ${reach.size}권과 이어집니다. 개념을 누르면 만나는 장이 나오고, 바깥 고리의 책을 누르면 그 책이 가운데로 옵니다.` }),
    el('a', { class: 'button primary atlas-open', href: book.url }, '이 책 펼치기 ', el('span', { 'aria-hidden': 'true', text: '→' })),
    kicker('이 책의 개념'),
    chips(concepts.map(c => chip(c.name, () => select(ctx, { type: 'concept', id: c.id })))),
    backButton(ctx)];
}

function backButton(ctx) {
  if (ctx.mode === 'focus' && ctx.sel) return el('button', { type: 'button', class: 'atlas-back', on: () => select(ctx, null) }, `← ${ctx.graph.bookById.get(ctx.book).short} 중심으로`);
  if (ctx.mode === 'focus') return el('button', { type: 'button', class: 'atlas-back', on: () => toMap(ctx, null, true) }, '← 전체 섬 지도로');
  return el('button', { type: 'button', class: 'atlas-back', on: () => select(ctx, null) }, '← 처음 설명으로');
}

function updatePanel(ctx, moveFocus = false) {
  const s = ctx.sel;
  const body = s?.type === 'concept' ? panelConcept(ctx, s.id)
    : s?.type === 'bridge' ? panelBridge(ctx, s.id)
      : s?.type === 'island' ? panelIsland(ctx, s.id)
        : ctx.mode === 'focus' ? panelFocus(ctx) : panelIntro(ctx);
  ctx.panel.replaceChildren(...body.filter(Boolean));
  if (moveFocus) ctx.panel.querySelector('h4')?.focus();
}

function mapTargets(graph, s) {
  if (!s) return {};
  if (s.type === 'island') {
    const ps = partners(graph, s.id);
    return { fields: new Set([s.id, ...ps.map(p => p.other)]), bridges: new Set(ps.map(p => p.bridge.id)) };
  }
  if (s.type === 'bridge') {
    const b = graph.bridges.find(x => x.id === s.id);
    return { fields: new Set([b.a, b.b]), bridges: new Set([b.id]) };
  }
  const c = graph.concepts.find(x => x.id === s.id);
  return { fields: new Set(c.fields), books: new Set(c.books),
    bridges: new Set(graph.bridges.filter(b => c.fields.includes(b.a) && c.fields.includes(b.b)).map(b => b.id)) };
}

function mark(nodes, test, cls) { nodes.forEach(n => n.classList.toggle(cls, test(n))); }

function highlight(ctx) {
  const root = ctx.canvas.firstElementChild;
  const s = ctx.hover ? { type: 'concept', id: ctx.hover } : ctx.sel;
  const all = q => root.querySelectorAll(q);
  root.classList.toggle('has-selection', Boolean(s));
  if (ctx.mode === 'map') {
    const t = mapTargets(ctx.graph, s);
    mark(all('.atlas-island'), n => Boolean(t.fields) && !t.fields.has(n.dataset.field), 'is-dim');
    mark(all('.atlas-island'), n => s?.type === 'island' && n.dataset.field === s.id, 'is-on');
    mark(all('[data-bridge]'), n => Boolean(t.bridges) && t.bridges.has(n.dataset.bridge), 'is-on');
    mark(all('[data-bridge]'), n => Boolean(t.bridges) && !t.bridges.has(n.dataset.bridge), 'is-dim');
    mark(all('.atlas-spine'), n => Boolean(t.books) && t.books.has(n.dataset.book), 'is-lit');
    return;
  }
  const c = s?.type === 'concept' ? ctx.graph.concepts.find(x => x.id === s.id) : null;
  mark(all('[data-concept]'), n => Boolean(c) && n.dataset.concept === c.id, 'is-on');
  mark(all('[data-concept]'), n => Boolean(c) && n.dataset.concept !== c.id, 'is-dim');
  mark(all('.atlas-orbit'), n => Boolean(c) && c.books.includes(n.dataset.book), 'is-lit');
  mark(all('.atlas-orbit'), n => Boolean(c) && !c.books.includes(n.dataset.book), 'is-dim');
}

function select(ctx, sel, moveFocus = false) {
  ctx.sel = sel;
  highlight(ctx);
  updatePanel(ctx, moveFocus);
}

function render(ctx, moveFocus = false) {
  ctx.canvas.replaceChildren(ctx.mode === 'focus' ? drawFocus(ctx, ctx.book) : drawMap(ctx));
  ctx.canvas.dataset.mode = ctx.mode;
  ctx.pick.value = ctx.mode === 'focus' ? ctx.book : '';
  ctx.canvas.scrollLeft = (ctx.canvas.scrollWidth - ctx.canvas.clientWidth) / 2;
  select(ctx, ctx.sel, moveFocus);
}

function focusOn(ctx, bookId, moveFocus = false) {
  Object.assign(ctx, { mode: 'focus', book: bookId, sel: null, hover: null });
  render(ctx, moveFocus);
}

function toMap(ctx, sel = null, moveFocus = false) {
  Object.assign(ctx, { mode: 'map', book: null, sel, hover: null });
  render(ctx, moveFocus);
}

function activate(ctx, target, byKey) {
  if (ctx.mode === 'focus') {
    const orbit = target.closest('.atlas-orbit');
    const pill = target.closest('.atlas-pill');
    if (orbit) return focusOn(ctx, orbit.dataset.book, byKey);
    if (pill) return select(ctx, ctx.sel?.id === pill.dataset.concept ? null : { type: 'concept', id: pill.dataset.concept });
    return ctx.sel && select(ctx, null);
  }
  const spine = target.closest('.atlas-spine');
  const badge = target.closest('[data-bridge]');
  const island = target.closest('.atlas-island');
  if (spine && !byKey) return focusOn(ctx, spine.dataset.book);
  if (badge) return select(ctx, { type: 'bridge', id: badge.dataset.bridge });
  if (island) return select(ctx, ctx.sel?.type === 'island' && ctx.sel.id === island.dataset.field ? null : { type: 'island', id: island.dataset.field });
  return ctx.sel && select(ctx, null);
}

function wireCanvas(ctx) {
  ctx.canvas.addEventListener('click', event => activate(ctx, event.target, false));
  ctx.canvas.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key) || !event.target.closest('[role=button]')) return;
    event.preventDefault();
    activate(ctx, event.target, true);
  });
  ctx.canvas.addEventListener('pointerover', event => {
    const pill = event.target.closest('.atlas-pill');
    const id = pill ? pill.dataset.concept : null;
    if (ctx.mode === 'focus' && id !== ctx.hover) { ctx.hover = id; highlight(ctx); }
  });
  ctx.canvas.addEventListener('pointerleave', () => { if (ctx.hover) { ctx.hover = null; highlight(ctx); } });
}

function setView(ctx, view) {
  ctx.tools.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
  ctx.stage.hidden = view !== 'map';
  ctx.list.hidden = view !== 'list';
  ctx.pick.disabled = view !== 'map';
}

function filterList(list, field) {
  list.querySelectorAll('.atlas-item').forEach(item => item.classList.toggle('is-filtered', Boolean(field) && !item.dataset.fields.split('|').includes(field)));
  list.querySelectorAll('.atlas-list-group').forEach(group => group.classList.toggle('is-filtered', !group.querySelector('.atlas-item:not(.is-filtered)')));
}

/* 큐레이션 위 분야 단추: 그 분야의 섬을 고른 상태로 섬 지도를 보여 주고, 목록도 같은 분야로 거릅니다. */
export function filterAtlas(atlas, field) {
  const list = atlas.querySelector('[data-atlas-list]');
  if (list) filterList(list, field);
  const ctx = atlas.atlasContext;
  if (!ctx) return;
  if (field && ctx.graph.fields.some(f => f.name === field)) toMap(ctx, { type: 'island', id: field });
  else if (ctx.mode === 'map') select(ctx, null);
}

export function setupAtlas(atlas) {
  const data = atlas?.querySelector('[data-atlas-data]');
  if (!data) return;
  let graph;
  try { graph = buildGraph(JSON.parse(data.textContent)); } catch { return; }
  const q = s => atlas.querySelector(s);
  const ctx = { graph, mode: 'map', book: null, sel: null, hover: null, layout: null,
    canvas: q('[data-atlas-canvas]'), panel: q('[data-atlas-panel]'), pick: q('[data-atlas-pick]'),
    tools: q('[data-atlas-tools]'), stage: q('[data-atlas-stage]'), list: q('[data-atlas-list]') };
  atlas.atlasContext = ctx;
  atlas.classList.add('is-enhanced');
  ctx.tools.hidden = false;
  wireCanvas(ctx);
  ctx.tools.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => setView(ctx, b.dataset.view)));
  ctx.pick.addEventListener('change', () => (ctx.pick.value ? focusOn(ctx, ctx.pick.value) : toMap(ctx)));
  setView(ctx, 'map');
  const narrow = matchMedia('(max-width: 720px)');
  ctx.portrait = narrow.matches;
  narrow.addEventListener('change', () => { ctx.portrait = narrow.matches; if (ctx.mode === 'map') render(ctx); });
  const fromHash = graph.concepts.find(c => `#concept-${c.id}` === location.hash);
  toMap(ctx, fromHash ? { type: 'concept', id: fromHash.id } : null);
  if (fromHash) atlas.scrollIntoView({ block: 'start' });
}
