/* 실험 화면에서 공통으로 쓰는 작은 도구: 요소 만들기, 슬라이더, 버튼, 애니메이션, SVG 차트.
   계산은 하지 않고 화면만 그린다. */
(function () {
  'use strict';

  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function h(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'text') node.textContent = value;
      else if (key === 'html') node.innerHTML = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : value);
    }
    for (const child of [].concat(children || [])) if (child) node.append(child);
    return node;
  }

  /* 라벨·현재값·단위를 갖춘 슬라이더. 키보드 화살표로도 조절된다. */
  function slider(spec, onInput) {
    const input = h('input', { type: 'range', id: spec.id, min: spec.min, max: spec.max, step: spec.step, value: spec.value });
    const out = h('output', { for: spec.id });
    const fmt = spec.format || ((v) => String(v));
    const sync = () => { out.textContent = fmt(Number(input.value)) + (spec.unit ? ` ${spec.unit}` : ''); };
    input.addEventListener('input', () => { sync(); onInput && onInput(Number(input.value)); });
    sync();
    const wrap = h('div', { class: 'control' }, [
      h('label', { for: spec.id }, [h('span', { text: spec.label }), out]),
      input,
      spec.hint ? h('small', { text: spec.hint }) : null
    ]);
    return {
      wrap, input,
      get: () => Number(input.value),
      set: (v) => { input.value = v; sync(); }
    };
  }

  function button(label, onClick, kind) {
    return h('button', { type: 'button', class: kind ? `btn ${kind}` : 'btn', onclick: onClick, text: label });
  }

  /* total번의 작업을 프레임마다 perFrame개씩 실행한다. 동작 줄이기 설정이면 한 번에 끝낸다. */
  function animate(total, perFrame, step, done) {
    let doneCount = 0, frame = 0, cancelled = false;
    if (reduceMotion()) {
      for (let i = 0; i < total; i += 1) step(i);
      done && done();
      return () => {};
    }
    const tick = () => {
      if (cancelled) return;
      const end = Math.min(total, doneCount + perFrame);
      for (; doneCount < end; doneCount += 1) step(doneCount);
      if (doneCount < total) frame = requestAnimationFrame(tick);
      else if (done) done();
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }

  const fmt = {
    pct: (v, d = 1) => `${(v * 100).toFixed(d)}%`,
    num: (v, d = 2) => Number(v).toFixed(d),
    int: (v) => Math.round(v).toLocaleString('ko-KR')
  };

  /* ---- SVG 차트 ---- */
  const W = 560, H = 260, PAD = { l: 44, r: 14, t: 14, b: 34 };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function scale(d0, d1, r0, r1) {
    const span = d1 - d0 || 1;
    return (v) => r0 + ((v - d0) / span) * (r1 - r0);
  }

  function frame(xTicks, yTicks, x, y, labels) {
    let s = `<line class="axis" x1="${PAD.l}" y1="${H - PAD.b}" x2="${W - PAD.r}" y2="${H - PAD.b}"/>`;
    s += `<line class="axis" x1="${PAD.l}" y1="${PAD.t}" x2="${PAD.l}" y2="${H - PAD.b}"/>`;
    for (const t of yTicks) s += `<line class="grid" x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(t.v)}" y2="${y(t.v)}"/><text class="tick" x="${PAD.l - 6}" y="${y(t.v) + 4}" text-anchor="end">${esc(t.label)}</text>`;
    for (const t of xTicks) s += `<text class="tick" x="${x(t.v)}" y="${H - PAD.b + 16}" text-anchor="middle">${esc(t.label)}</text>`;
    if (labels && labels.x) s += `<text class="axis-label" x="${W - PAD.r}" y="${H - 4}" text-anchor="end">${esc(labels.x)}</text>`;
    if (labels && labels.y) s += `<text class="axis-label" x="${PAD.l + 4}" y="${PAD.t + 10}">${esc(labels.y)}</text>`;
    return s;
  }

  function svg(inner, label) {
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
  }

  function ticks(min, max, count, format) {
    return Array.from({ length: count + 1 }, (_, i) => {
      const v = min + ((max - min) * i) / count;
      return { v, label: format ? format(v) : String(Math.round(v * 100) / 100) };
    });
  }

  window.ProbUI = { h, slider, button, animate, fmt, reduceMotion, chart: { W, H, PAD, scale, frame, svg, ticks, esc } };
})();
