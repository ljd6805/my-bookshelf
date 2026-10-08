/* 지식 지도의 계산 모델. 화면을 그리지 않고 좌표만 셉니다(단위: SVG viewBox의 px).
   - buildGraph: 카탈로그에서 뽑은 책·분야·개념으로 분야 사이 다리(함께 쓰는 개념)를 셉니다.
   - layoutIslands: 분야를 섬으로 놓습니다. 다리가 가장 많은 분야가 가운데, 나머지는 서가
     순서대로 고리에 섭니다. 섬 크기는 책 수가, 고리 반지름은 섬끼리 겹치지 않을 거리가 정합니다.
   - layoutFocus: 책 한 권을 가운데 두고 그 책의 개념(안쪽)과 이어지는 책(바깥, 분야별)을 놓습니다.
   좌표를 손으로 넣지 않으므로 책과 분야가 늘어도 같은 규칙으로 다시 계산됩니다. */

const HEADER = 46;           // 섬 이름과 권수 줄의 높이
const BRIDGE_GAP = 74;       // 이웃한 섬 사이에 다리 이름표가 들어갈 틈
const MARGIN = 26;           // 섬 테두리 장식이 viewBox 밖으로 나가지 않게 두는 여백

export function buildGraph(data) {
  const books = data.books.map(b => ({ ...b }));
  const bookById = new Map(books.map(b => [b.id, b]));
  const fields = data.fields.map(f => ({ ...f, books: books.filter(b => b.field === f.name).map(b => b.id) }));
  const order = fields.map(f => f.name);
  const concepts = data.concepts.map(c => {
    const ids = [...new Set(c.chapters.map(ch => ch.book))];
    const touched = new Set(ids.map(id => bookById.get(id).field));
    return { ...c, books: ids, fields: order.filter(name => touched.has(name)) };
  });
  const bridges = [];
  order.forEach((a, i) => order.slice(i + 1).forEach(b => {
    const shared = concepts.filter(c => c.fields.includes(a) && c.fields.includes(b)).map(c => c.id);
    if (shared.length) bridges.push({ id: `${a}|${b}`, a, b, concepts: shared });
  }));
  return { fields, books, bookById, concepts, bridges };
}

/* 섬 위에 세울 책등 격자. 여섯 권까지는 제목을 쓸 수 있는 큰 책등, 그보다 많으면 작은 책등을 여러 줄로. */
export function spineGrid(count) {
  const big = count <= 6;
  const size = big ? { w: 24, h: 84, gap: 5 } : { w: 15, h: 46, gap: 4 };
  const cols = big ? Math.max(count, 1) : Math.ceil(count / Math.ceil(count / 8));
  const rows = Math.ceil(count / cols) || 1;
  const width = cols * (size.w + size.gap) - size.gap;
  const height = rows * (size.h + size.gap) - size.gap;
  return { ...size, big, cols, rows, width, height };
}

export function islandRadius(count) {
  const g = spineGrid(count);
  return Math.max(64, Math.round(Math.hypot(g.width / 2, (HEADER + g.height) / 2) + 20));
}

function hubOf(graph) {
  const weight = name => graph.bridges.reduce((sum, b) => sum + (b.a === name || b.b === name ? b.concepts.length : 0), 0);
  return graph.fields.reduce((best, f) => {
    const key = [weight(f.name), f.books.length];
    const top = [weight(best.name), best.books.length];
    return key[0] > top[0] || (key[0] === top[0] && key[1] > top[1]) ? f : best;
  }, graph.fields[0]);
}

/* 고리에 설 섬들이 가운데 섬과도, 고리 위 이웃과도 겹치지 않는 가장 작은 반지름. */
export function ringRadius(hubR, ringR) {
  const k = ringR.length;
  let r = Math.max(0, ...ringR.map(x => hubR + x + BRIDGE_GAP));
  if (k >= 2) {
    const chord = 2 * Math.sin(Math.PI / k);
    ringR.forEach((x, i) => {
      const y = ringR[(i + 1) % k];
      if (k > 2 || i === 0) r = Math.max(r, (x + y + BRIDGE_GAP) / chord);
    });
  }
  return r;
}

function ringAngles(k) {
  if (k === 1) return [0];
  return Array.from({ length: k }, (_, i) => -Math.PI / 2 + Math.PI / k + (2 * Math.PI * i) / k);
}

function permutations(items) {
  if (items.length <= 1) return [items];
  return items.flatMap((x, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map(rest => [x, ...rest]));
}

/* 고리 순서: 개념을 많이 함께 쓰는 분야끼리 이웃하게 둡니다. 동률이면 서가 순서에 가까운 쪽.
   분야가 여덟 개를 넘으면 계산을 줄이려고 서가 순서를 그대로 씁니다. */
export function ringOrder(ring, bridges) {
  if (ring.length <= 3 || ring.length > 8) return ring;
  const shared = (a, b) => bridges.find(x => (x.a === a.name && x.b === b.name) || (x.a === b.name && x.b === a.name))?.concepts.length || 0;
  const score = order => order.reduce((sum, f, i) => sum + shared(f, order[(i + 1) % order.length]), 0);
  let best = ring, top = score(ring);
  permutations(ring.slice(1)).forEach(rest => {
    const order = [ring[0], ...rest];
    if (score(order) > top) { best = order; top = score(order); }
  });
  return best;
}

/* 세로 화면(portrait)에서는 가로를 좁히고, 섬끼리 다리 틈이 남을 때까지 세로를 늘립니다. */
function ringPlaces(hub, ring, R, radius, portrait, stretch) {
  const turn = portrait && ring.length <= 2 ? Math.PI / 2 : 0;
  const angles = ringAngles(ring.length).map(a => a + turn);
  const place = (sx, sy) => [{ field: hub, x: 0, y: 0, r: radius(hub), hub: true, slot: -1 },
    ...ring.map((f, i) => ({ field: f, x: R * Math.cos(angles[i]) * sx, y: R * Math.sin(angles[i]) * sy, r: radius(f), hub: false, slot: i }))];
  if (!portrait) return place(stretch, 1);
  const clear = ps => ps.every((a, i) => ps.slice(i + 1).every(b => Math.hypot(a.x - b.x, a.y - b.y) >= a.r + b.r + 44));
  let sy = 1;
  while (!clear(place(0.72, sy)) && sy < 3) sy += 0.05;
  return place(0.72, sy);
}

export function layoutIslands(graph, { stretch = 1.3, portrait = false } = {}) {
  if (!graph.fields.length) return { width: 0, height: 0, islands: [], bridges: [] };
  const hub = hubOf(graph);
  const ring = ringOrder(graph.fields.filter(f => f !== hub), graph.bridges);
  const radius = f => islandRadius(f.books.length);
  const R = ringRadius(radius(hub), ring.map(radius));
  const placed = ringPlaces(hub, ring, R, radius, portrait, stretch);
  const draft = connect(placed, graph, ring.length);
  const boxes = [...placed.map(p => [p.x - p.r, p.y - p.r, p.x + p.r, p.y + p.r]),
    ...draft.filter(b => b.shown).map(b => [b.badge.x - 40, b.badge.y - 16, b.badge.x + 40, b.badge.y + 16])];
  const minX = Math.min(...boxes.map(b => b[0])) - MARGIN, minY = Math.min(...boxes.map(b => b[1])) - MARGIN;
  const shifted = placed.map(p => ({ ...p, x: p.x - minX, y: p.y - minY }));
  const width = Math.max(...boxes.map(b => b[2])) - minX + MARGIN;
  const height = Math.max(...boxes.map(b => b[3])) - minY + MARGIN;
  return { width: Math.ceil(width), height: Math.ceil(height), portrait, islands: shifted.map(p => islandShape(p, graph)), bridges: connect(shifted, graph, ring.length) };
}

/* 가운데 섬과 잇는 다리, 고리에서 이웃한 섬끼리 잇는 다리는 늘 그립니다. 고리 건너편 섬끼리의
   다리는 지도를 가로지르므로 둘 중 한 섬을 고를 때만 보입니다(shown: false). */
function connect(placed, graph, k) {
  const byName = new Map(placed.map(p => [p.field.name, p]));
  const bridges = graph.bridges.map(b => {
    const p = byName.get(b.a), q = byName.get(b.b);
    const gap = Math.abs(p.slot - q.slot);
    const shown = p.hub || q.hub || gap === 1 || gap === k - 1;
    return { ...bridgeCurve(b, p, q, placed[0], !shown), shown };
  });
  separateBadges(bridges.filter(b => b.shown));
  return bridges;
}

function islandShape(p, graph) {
  const grid = spineGrid(p.field.books.length);
  const top = p.y - (HEADER + grid.height) / 2;
  const left = p.x - grid.width / 2;
  const spines = p.field.books.map((id, n) => ({
    book: id,
    x: left + (n % grid.cols) * (grid.w + grid.gap),
    y: top + HEADER + Math.floor(n / grid.cols) * (grid.h + grid.gap),
    w: grid.w, h: grid.h,
  }));
  const inner = graph.concepts.filter(c => c.fields.length === 1 && c.fields[0] === p.field.name).map(c => c.id);
  return { name: p.field.name, tone: p.field.tone, x: p.x, y: p.y, r: p.r, hub: p.hub, count: p.field.books.length,
    titleY: top + 18, countY: top + 36, big: grid.big, spines, inner, outline: blob(p.x, p.y, p.r, p.field.name.length) };
}

/* 둥근 섬 모양. 같은 분야는 늘 같은 모양이 되도록 이름 길이로 흔들림을 정합니다. */
export function blob(cx, cy, r, seed) {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const a = (2 * Math.PI * i) / 16;
    const k = 1 + 0.05 * Math.sin(3 * a + seed) + 0.035 * Math.cos(5 * a + seed * 2);
    return [cx + r * k * Math.cos(a), cy + r * k * Math.sin(a)];
  });
  const f = n => Math.round(n * 10) / 10;
  let d = `M${f((pts[0][0] + pts[1][0]) / 2)} ${f((pts[0][1] + pts[1][1]) / 2)}`;
  for (let i = 1; i <= pts.length; i += 1) {
    const p = pts[i % pts.length], q = pts[(i + 1) % pts.length];
    d += ` Q${f(p[0])} ${f(p[1])} ${f((p[0] + q[0]) / 2)} ${f((p[1] + q[1]) / 2)}`;
  }
  return `${d}Z`;
}

/* 다리는 두 섬 중심을 잇는 2차 곡선입니다. 가운데 섬과 잇는 다리는 살짝 휘고, 고리 위 이웃끼리는
   가운데 섬을 피해 바깥으로 휩니다. 고리 건너편끼리는 곧은 점선으로 가운데 섬 위를 지나고,
   이름표는 고른 섬과 가운데 섬 사이 바다에 둡니다. */
export function bridgeCurve(bridge, p, q, hub, far = false) {
  const span = Math.hypot(q.x - p.x, q.y - p.y) || 1;
  const ux = (q.x - p.x) / span, uy = (q.y - p.y) / span;
  const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
  let c, at;
  if (far) {
    c = mid;
    const s0 = (hub.x - p.x) * ux + (hub.y - p.y) * uy;
    const off = Math.abs((hub.x - p.x) * uy - (hub.y - p.y) * ux);
    const entry = off < hub.r ? s0 - Math.sqrt(hub.r * hub.r - off * off) : span - q.r;
    at = Math.min(0.45, Math.max(0.1, (p.r + (entry - p.r) / 2) / span));
  } else {
    if (p.hub || q.hub) c = { x: mid.x - uy * 18, y: mid.y + ux * 18 };
    else {
      let dx = mid.x - hub.x, dy = mid.y - hub.y, d = Math.hypot(dx, dy);
      if (d < 1) { dx = -uy; dy = ux; d = 1; }
      const t = Math.max(2 * (hub.r + 34) - Math.hypot(mid.x - hub.x, mid.y - hub.y), Math.hypot(mid.x - hub.x, mid.y - hub.y) * 1.15);
      c = { x: hub.x + (dx / d) * t, y: hub.y + (dy / d) * t };
    }
    at = Math.min(0.8, Math.max(0.2, (p.r + (span - p.r - q.r) / 2) / span));
  }
  const point = quad(p, c, q, at);
  return { ...bridge, d: `M${r1(p.x)} ${r1(p.y)} Q${r1(c.x)} ${r1(c.y)} ${r1(q.x)} ${r1(q.y)}`,
    badge: { x: point.x, y: point.y }, width: Math.min(16, 2 + 3 * Math.sqrt(bridge.concepts.length)) };
}

const r1 = n => Math.round(n * 10) / 10;

export function quad(p, c, q, t) {
  const u = 1 - t;
  return { x: u * u * p.x + 2 * u * t * c.x + t * t * q.x, y: u * u * p.y + 2 * u * t * c.y + t * t * q.y };
}

/* 다리 이름표가 서로 겹치면 위아래로 조금씩 밀어 냅니다. 반복 횟수가 정해져 있어 결과가 늘 같습니다. */
export function separateBadges(bridges, w = 76, h = 28) {
  for (let round = 0; round < 60; round += 1) {
    let moved = false;
    for (let i = 0; i < bridges.length; i += 1) {
      for (let j = i + 1; j < bridges.length; j += 1) {
        const a = bridges[i].badge, b = bridges[j].badge;
        if (Math.abs(a.x - b.x) < w && Math.abs(a.y - b.y) < h) {
          const dir = b.y >= a.y ? 1 : -1;
          a.y -= dir * 3; b.y += dir * 3; moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return bridges;
}

const circularMean = angles => Math.atan2(angles.reduce((s, a) => s + Math.sin(a), 0), angles.reduce((s, a) => s + Math.cos(a), 0));
export const pillWidth = name => 26 + 13 * [...name.replace(/\s/g, '')].length + 4 * (name.split(' ').length - 1);

/* 책 한 권 중심 보기. 바깥 고리의 책은 분야 순서대로, 안쪽 개념은 이어지는 책들 쪽으로 기울여 놓습니다. */
export function layoutFocus(graph, bookId) {
  const mine = graph.concepts.filter(c => c.books.includes(bookId));
  const fieldOrder = graph.fields.map(f => f.name);
  const others = graph.books.filter(b => b.id !== bookId && mine.some(c => c.books.includes(b.id)))
    .sort((a, b) => fieldOrder.indexOf(a.field) - fieldOrder.indexOf(b.field));
  const R = Math.max(240, Math.min(320, 190 + 7 * others.length));
  const width = 2 * R + 220, height = 2 * R + 130, cx = width / 2, cy = height / 2;
  const step = (2 * Math.PI) / Math.max(others.length, 1);
  const books = others.map((b, i) => {
    const angle = -Math.PI / 2 + step * (i + 0.5);
    const cos = Math.cos(angle), sin = Math.sin(angle);
    return { id: b.id, field: b.field, angle, x: cx + R * cos, y: cy + R * sin,
      lx: cx + (R - 24) * cos, ly: cy + (R - 24) * sin + 4, anchor: cos > 0.25 ? 'end' : cos < -0.25 ? 'start' : 'middle' };
  });
  const at = new Map(books.map(b => [b.id, b]));
  const concepts = placeConcepts(mine, bookId, at, { cx, cy, R });
  const arcs = fieldArcs(graph, books, { cx, cy, R, step });
  const links = concepts.flatMap(c => graph.concepts.find(k => k.id === c.id).books.filter(id => id !== bookId).map(id => {
    const b = at.get(id);
    const mx = ((c.x + b.x) / 2 + cx) / 2, my = ((c.y + b.y) / 2 + cy) / 2;
    return { concept: c.id, book: id, d: `M${r1(c.x)} ${r1(c.y)} Q${r1(mx)} ${r1(my)} ${r1(b.x)} ${r1(b.y)}` };
  }));
  return { width, height, cx, cy, R, center: bookId, concepts, books, arcs, links };
}

function placeConcepts(mine, bookId, at, { cx, cy, R }) {
  const sorted = mine.map(c => ({ c, mean: circularMean(c.books.filter(id => id !== bookId).map(id => at.get(id).angle)) }))
    .sort((a, b) => a.mean - b.mean || a.c.id.localeCompare(b.c.id));
  const m = sorted.length, step = (2 * Math.PI) / Math.max(m, 1);
  const shift = m ? circularMean(sorted.map((s, i) => s.mean - (-Math.PI + step * (i + 0.5)))) : 0;
  const boxes = sorted.map((s, i) => {
    const angle = -Math.PI + step * (i + 0.5) + shift;
    const ring = m > 9 && i % 2 ? 0.74 : 1;
    return { id: s.c.id, name: s.c.name, w: pillWidth(s.c.name), angle,
      x: cx + R * 0.66 * ring * Math.cos(angle), y: cy + R * 0.6 * ring * Math.sin(angle) };
  });
  return separatePills(boxes, { cx, cy });
}

/* 개념 이름표끼리, 그리고 가운데 책과 겹치지 않게 밀어 냅니다. */
export function separatePills(boxes, center, h = 30) {
  for (let round = 0; round < 240; round += 1) {
    let moved = false;
    boxes.forEach((a, i) => {
      if (Math.abs(a.x - center.cx) < a.w / 2 + 44 && Math.abs(a.y - center.cy) < 80) {
        a.y += a.y >= center.cy ? 2 : -2; moved = true;
      }
      boxes.slice(i + 1).forEach(b => {
        if (Math.abs(a.x - b.x) < (a.w + b.w) / 2 + 8 && Math.abs(a.y - b.y) < h + 4) {
          const dx = b.x >= a.x ? 1.5 : -1.5, dy = b.y >= a.y ? 1.5 : -1.5;
          a.x -= dx; b.x += dx; a.y -= dy; b.y += dy; moved = true;
        }
      });
    });
    if (!moved) break;
  }
  return boxes;
}

function fieldArcs(graph, books, { cx, cy, R, step }) {
  const r = R + 22;
  return graph.fields.map(f => {
    const own = books.filter(b => b.field === f.name);
    if (!own.length) return null;
    const a0 = own[0].angle - step / 2 + 0.02, a1 = own[own.length - 1].angle + step / 2 - 0.02;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = a => `${r1(cx + r * Math.cos(a))} ${r1(cy + r * Math.sin(a))}`;
    const mid = (a0 + a1) / 2, lr = r + 24;
    const d = own.length === books.length && books.length > 1
      ? `M${p(a0)} A${r} ${r} 0 0 1 ${p(a0 + Math.PI)} A${r} ${r} 0 0 1 ${p(a1)}`
      : `M${p(a0)} A${r} ${r} 0 ${large} 1 ${p(a1)}`;
    return { name: f.name, tone: f.tone, d, lx: cx + lr * Math.cos(mid), ly: cy + lr * Math.sin(mid) + 5, count: own.length };
  }).filter(Boolean);
}
