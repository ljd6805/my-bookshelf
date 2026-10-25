/* 3차원 특징 공간 그리기(11장). 바닥면 = 1~10장의 (빠르기, 에너지) 지도, 위로 솟는 축 = 가사 비중.
   계산(코사인·각도)은 LA가 맡고, 여기서는 회전과 투영(정사영)만 합니다. 값은 모두 실제 계산이며 길이는 축척대로입니다.
   처음 열면 위에서 내려다본 2차원 지도에서 시작해 셋째 축이 책장 위로 일어서도록 기울어집니다(동작 줄이기에서는 바로 마지막 각도). */
(function () {
  'use strict';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const DEG = Math.PI / 180;
  const START = { yaw: -35, pitch: 28 };

  function Space3D(svg, opts) {
    this.svg = svg;
    this.size = 400;
    this.unit = this.size / 9.5;
    this.yaw = START.yaw;
    this.pitch = 90;
    this.labels = (opts && opts.labels) || ['x', 'y', 'z'];
    this.onView = (opts && opts.onView) || (() => {});
    this.head = [...svg.querySelectorAll('title, desc')].map((n) => n.outerHTML).join('');
    svg.setAttribute('viewBox', `0 0 ${this.size} ${this.size}`);
    this.scene = null;
  }

  /** 점 하나를 화면 좌표와 깊이로 바꿉니다. yaw: 세로축(가사) 둘레 회전, pitch: 90°면 위에서 내려다봄. */
  Space3D.prototype.project = function (p) {
    const a = this.yaw * DEG, b = this.pitch * DEG;
    const x1 = p[0] * Math.cos(a) - p[1] * Math.sin(a), y1 = p[0] * Math.sin(a) + p[1] * Math.cos(a);
    const sy = y1 * Math.sin(b) + p[2] * Math.cos(b);
    return { x: this.size / 2 + x1 * this.unit, y: this.size / 2 + 20 - sy * this.unit, d: p[2] * Math.sin(b) - y1 * Math.cos(b) };
  };

  Space3D.prototype.line = function (a, b, cls) {
    const p = this.project(a), q = this.project(b);
    return { d: (p.d + q.d) / 2, s: `<line class="${cls}" x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}"/>` };
  };

  Space3D.prototype.arrow = function (to, cls) {
    const p = this.project([0, 0, 0]), q = this.project(to), len = Math.hypot(q.x - p.x, q.y - p.y);
    if (len < 1) return { d: q.d, s: '' };
    const ux = (q.x - p.x) / len, uy = (q.y - p.y) / len, h = Math.min(12, len * 0.5), bx = q.x - ux * h, by = q.y - uy * h;
    return { d: q.d, s: `<g class="arrow ${cls}"><line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}"/>`
      + `<polygon points="${q.x.toFixed(1)},${q.y.toFixed(1)} ${(bx - uy * h * 0.45).toFixed(1)},${(by + ux * h * 0.45).toFixed(1)} ${(bx + uy * h * 0.45).toFixed(1)},${(by - ux * h * 0.45).toFixed(1)}"/></g>` };
  };

  Space3D.prototype.text = function (p3, str, cls, dx, dy) {
    const p = this.project(p3), right = p.x > this.size * 0.62;
    // 오른쪽 끝의 이름은 점의 왼쪽에 붙여 그림 밖으로 잘리지 않게 합니다.
    const x = right ? p.x - (dx || 6) : p.x + (dx || 6);
    return { d: p.d + 0.01, s: `<text class="${cls}" x="${x.toFixed(1)}" y="${(p.y + (dy || -6)).toFixed(1)}"${right ? ' text-anchor="end"' : ''}>${esc(str)}</text>` };
  };

  /** 바닥(책장 면)의 격자와 세 축. */
  Space3D.prototype.frame = function () {
    const out = [], [lx, ly, lz] = this.labels;
    for (let k = -3; k <= 3; k++) {
      out.push(this.line([k, -3, 0], [k, 3, 0], 'floor'), this.line([-3, k, 0], [3, k, 0], 'floor'));
    }
    out.push(this.line([-3.6, 0, 0], [3.6, 0, 0], 'axis'), this.line([0, -3.6, 0], [0, 3.6, 0], 'axis'), this.line([0, 0, -3.2], [0, 0, 3.4], 'axis lift'));
    out.push(this.text([3.7, 0, 0], lx, 'axis-label'), this.text([0, 3.7, 0], ly, 'axis-label'), this.text([0, 0, 3.5], `${lz} ↑`, 'axis-label lift'));
    return out;
  };

  /** scene: {songs:[{name, v:[x,y,z], top, mark}], user:[x,y,z]} */
  Space3D.prototype.draw = function (scene) {
    if (scene) this.scene = scene;
    const sc = this.scene;
    if (!sc) return this;
    const parts = this.frame();
    sc.songs.forEach((s) => {
      const [x, y, z] = s.v, p = this.project(s.v), f = this.project([x, y, 0]);
      parts.push(this.line([x, y, 0], s.v, 'drop'));
      parts.push({ d: f.d - 0.01, s: `<circle class="shadow" cx="${f.x.toFixed(1)}" cy="${f.y.toFixed(1)}" r="2.5"/>` });
      parts.push({ d: p.d, s: `<circle class="pt${s.top ? ' hi' : ''}${s.mark ? ' res' : ''}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${s.top ? 6.5 : 5}"><title>${esc(s.name)} ${esc(s.label)}</title></circle>` });
      if (s.top || s.mark) parts.push(this.text(s.v, s.name, `pt-label${s.top ? ' hi' : ''}`, 8, s.top ? 22 : -8));
      if (s.top) parts.push(this.line([0, 0, 0], s.v, 'guide'));
    });
    if (sc.user.some((n) => n !== 0)) {
      parts.push(this.arrow([sc.user[0], sc.user[1], 0], 'shadow-arrow'));
      parts.push(this.arrow(sc.user, 'me'));
      parts.push(this.text(sc.user.map((n) => n * 0.55), '취향', 'label me', 8, -12));
    }
    parts.sort((a, b) => a.d - b.d);
    this.svg.innerHTML = this.head + parts.map((x) => x.s).join('');
    this.onView(this);
    return this;
  };

  Space3D.prototype.turn = function (dYaw, dPitch) {
    this.yaw = ((this.yaw + dYaw + 540) % 360) - 180;
    this.pitch = Math.max(0, Math.min(90, this.pitch + dPitch));
    return this.draw();
  };

  Space3D.prototype.set = function (yaw, pitch) { this.yaw = yaw; this.pitch = pitch; return this.draw(); };

  /** 위에서 본 2차원 지도에서 셋째 축이 일어서는 장면. */
  Space3D.prototype.rise = function () {
    this.yaw = 0; this.pitch = 90;
    UI.animate(1600, (t) => { this.yaw = START.yaw * t; this.pitch = 90 - (90 - START.pitch) * t; this.draw(); });
    return this;
  };

  /** 끌기·방향키로 돌리기. 버튼 [data-turn="yaw,pitch"], [data-view=start|top|side]도 연결합니다. */
  Space3D.prototype.controls = function (root) {
    const svg = this.svg;
    let last = null;
    svg.addEventListener('pointerdown', (e) => { last = [e.clientX, e.clientY]; svg.setPointerCapture(e.pointerId); });
    svg.addEventListener('pointermove', (e) => {
      if (!last) return;
      const k = 360 / Math.max(200, svg.getBoundingClientRect().width);
      this.turn((e.clientX - last[0]) * k, (e.clientY - last[1]) * k);
      last = [e.clientX, e.clientY];
    });
    ['pointerup', 'pointercancel'].forEach((n) => svg.addEventListener(n, () => { last = null; }));
    const keys = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] };
    svg.addEventListener('keydown', (e) => { if (keys[e.key]) { this.turn(...keys[e.key]); e.preventDefault(); } });
    root.querySelectorAll('[data-turn]').forEach((b) => b.addEventListener('click', () => this.turn(...b.dataset.turn.split(',').map(Number))));
    const views = { start: [START.yaw, START.pitch], top: [0, 90], side: [0, 0] };
    root.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => this.set(...views[b.dataset.view])));
    return this;
  };

  Space3D.START = START;
  window.Space3D = Space3D;
})();
