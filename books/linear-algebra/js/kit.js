/* 여러 실험이 함께 쓰는 노래 그리기와 표 만들기. */
(function () {
  'use strict';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // f로 옮긴 위치에 노래 점을 그립니다. hi는 강조할 노래 id 목록입니다.
  function drawSongs(plane, f, opts) {
    opts = opts || {};
    const hi = new Set(opts.hi || []);
    for (const s of SONGS.songs) {
      const p = f ? f(s.v, s) : s.v;
      const cls = hi.has(s.id) ? 'hi' : opts.dim ? 'dim' : '';
      plane.point(p, cls, opts.labels === false ? '' : s.name, hi.has(s.id) ? 6 : 4.5);
    }
    return plane;
  }

  // rows: [{cells:[...], top:boolean}] 를 표로 그립니다. 숫자 열은 num 클래스로 정렬합니다.
  function table(el, head, rows, numCols) {
    const nums = new Set(numCols || []);
    const th = head.map((h) => `<th scope="col">${esc(h)}</th>`).join('');
    const body = rows.map((r) => `<tr class="${r.top ? 'top-pick' : ''}">${r.cells.map((c, i) =>
      `<td class="${nums.has(i) ? 'num' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('');
    el.innerHTML = `<table class="data"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`;
  }

  const nameOf = (id) => (SONGS.songs.find((s) => s.id === id) || {}).name || id;
  const songById = (id) => SONGS.songs.find((s) => s.id === id);

  function nearest(v, skip) {
    let best = null;
    for (const s of SONGS.songs) {
      if (skip && skip.includes(s.id)) continue;
      const d = LA.norm(LA.sub(s.v, v));
      if (!best || d < best.d) best = { song: s, d };
    }
    return best;
  }

  function fillSongSelect(select, chosen) {
    select.innerHTML = SONGS.songs.map((s) => `<option value="${s.id}"${s.id === chosen ? ' selected' : ''}>${esc(s.name)} ${UI.vec(s.v)}</option>`).join('');
  }

  window.KIT = { drawSongs, table, nameOf, songById, nearest, fillSongSelect, esc };
})();
