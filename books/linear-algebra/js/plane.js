/* 좌표평면 SVG 그리기. 계산은 LA(linalg.js)가 맡고 여기서는 화면 좌표만 다룹니다. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function Plane(svg, opts) {
    this.svg = svg;
    this.range = (opts && opts.range) || 4;
    this.size = 400;
    this.unit = this.size / (2 * this.range);
    svg.setAttribute('viewBox', `0 0 ${this.size} ${this.size}`);
    svg.classList.add('plane');
    this.head = [...svg.querySelectorAll('title, desc')].map((n) => n.outerHTML).join('');
    this.parts = [];
  }

  Plane.prototype.px = function (v) {
    return [this.size / 2 + v[0] * this.unit, this.size / 2 - v[1] * this.unit];
  };

  Plane.prototype.add = function (markup) { this.parts.push(markup); return this; };
  Plane.prototype.clear = function () { this.parts = []; return this; };
  Plane.prototype.render = function () { this.svg.innerHTML = this.head + this.parts.join(''); return this; };

  Plane.prototype.line = function (a, b, cls) {
    const [x1, y1] = this.px(a), [x2, y2] = this.px(b);
    return this.add(`<line class="${cls || ''}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`);
  };

  // 행렬 M으로 변형한 격자. M을 생략하면 원래 격자입니다.
  Plane.prototype.grid = function (M, cls) {
    const r = this.range * 2, f = M ? (v) => LA.matVec(M, v) : (v) => v;
    for (let k = -r; k <= r; k++) {
      const c = k === 0 ? 'axis' : 'gridline';
      this.line(f([k, -r]), f([k, r]), `${cls || ''} ${c}`);
      this.line(f([-r, k]), f([r, k]), `${cls || ''} ${c}`);
    }
    return this;
  };

  Plane.prototype.axes = function (labels) {
    const R = this.range;
    this.line([-R, 0], [R, 0], 'axis').line([0, -R], [0, R], 'axis');
    if (labels) {
      this.text([R - 0.15, -0.35], labels[0], 'axis-label end');
      this.text([0.15, R - 0.3], labels[1], 'axis-label');
    }
    return this;
  };

  Plane.prototype.text = function (v, str, cls) {
    const [x, y] = this.px(v);
    return this.add(`<text class="${cls || ''}" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${esc(str)}</text>`);
  };

  // 화살표: 몸통과 머리를 직접 계산해 그립니다(마커 기능 차이를 피하기 위해).
  Plane.prototype.arrow = function (to, cls, label, from) {
    from = from || [0, 0];
    const [x1, y1] = this.px(from), [x2, y2] = this.px(to);
    const len = Math.hypot(x2 - x1, y2 - y1);
    let g = `<g class="arrow ${cls || ''}">`;
    if (len > 0.5) {
      const ux = (x2 - x1) / len, uy = (y2 - y1) / len, h = Math.min(12, len * 0.6);
      const bx = x2 - ux * h, by = y2 - uy * h;
      g += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}"/>`;
      g += `<polygon points="${x2.toFixed(1)},${y2.toFixed(1)} ${(bx - uy * h * 0.45).toFixed(1)},${(by + ux * h * 0.45).toFixed(1)} ${(bx + uy * h * 0.45).toFixed(1)},${(by - ux * h * 0.45).toFixed(1)}"/>`;
    }
    g += '</g>';
    this.add(g);
    if (label) this.text([to[0] + 0.12, to[1] + 0.18], label, `label ${cls || ''}`);
    return this;
  };

  Plane.prototype.point = function (v, cls, label, r) {
    const [x, y] = this.px(v);
    this.add(`<circle class="pt ${cls || ''}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r || 5}"/>`);
    if (label) this.text([v[0] + 0.14, v[1] + 0.14], label, `pt-label ${cls || ''}`);
    return this;
  };

  Plane.prototype.poly = function (pts, cls) {
    const s = pts.map((p) => this.px(p).map((n) => n.toFixed(1)).join(',')).join(' ');
    return this.add(`<polygon class="${cls || ''}" points="${s}"/>`);
  };

  // 끌어서 옮기기. 키보드 사용자는 같은 값을 슬라이더로 바꿀 수 있습니다.
  Plane.prototype.draggable = function (onMove) {
    const svg = this.svg;
    let active = false;
    const toCoord = (e) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      return [(p.x - this.size / 2) / this.unit, (this.size / 2 - p.y) / this.unit];
    };
    svg.addEventListener('pointerdown', (e) => {
      active = true; svg.setPointerCapture(e.pointerId); onMove(toCoord(e), e); e.preventDefault();
    });
    svg.addEventListener('pointermove', (e) => { if (active) onMove(toCoord(e), e); });
    const stop = () => { active = false; };
    svg.addEventListener('pointerup', stop);
    svg.addEventListener('pointercancel', stop);
    svg.classList.add('draggable');
    return this;
  };

  window.Plane = Plane;
  window.SVGNS = NS;
})();
