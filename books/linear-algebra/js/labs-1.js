/* 1~3장 실험: 벡터 섞기, 유사도, 투영. 그리고 표지의 노래 지도. */
(function () {
  'use strict';
  const { fmt, vec } = UI;
  const F = SONGS.features;

  // 표지: 여덟 곡과 '나'를 한 평면에 놓고, 취향 방향을 돌리면 코사인 1위 노래가 바뀝니다.
  UI.lab('songs-map', (root) => {
    const p = new Plane(root.querySelector('svg'), { range: 4 });
    const out = root.querySelector('.readout');
    const len = LA.norm(SONGS.me);
    const draw = (v) => {
      const me = LA.scale(len, LA.fromDeg(v.theta));
      const best = SONGS.songs.map((s) => ({ s, c: LA.cosine(me, s.v) })).sort((x, y) => y.c - x.c)[0];
      p.clear().grid().axes(F);
      KIT.drawSongs(p, null, { hi: [best.s.id] }).arrow(me, 'me', '나').render();
      out.innerHTML = `<p>취향 방향 ${fmt(v.theta, 0)}° → 가장 닮은 노래는 <strong>${best.s.name}</strong>(코사인 ${fmt(best.c)})입니다.</p>`;
    };
    UI.ranges(root, draw).update();
  });

  // 1장: 두 노래를 비율 t로 섞은 재생목록의 평균 특징 (1−t)·a + t·b
  UI.lab('vector-mix', (root) => {
    const p = new Plane(root.querySelector('svg'), { range: 4 });
    const [selA, selB] = root.querySelectorAll('select');
    KIT.fillSongSelect(selA, 'jazz');
    KIT.fillSongSelect(selB, 'festival');
    const out = root.querySelector('.readout');
    let stop = () => {};
    const draw = (v, sumT) => {
      const a = KIT.songById(v.a).v, b = KIT.songById(v.b).v;
      const m = LA.add(LA.scale(1 - v.t, a), LA.scale(v.t, b));
      p.clear().grid().axes(F);
      KIT.drawSongs(p, null, { dim: true, labels: false, hi: [v.a, v.b] });
      p.arrow(a, 'a', 'a').arrow(b, 'b', 'b');
      if (sumT > 0) {
        const tip = LA.add(a, LA.scale(sumT, b));
        p.arrow(tip, 'b ghost', '', a).arrow(tip, 'res ghost', sumT === 1 ? 'a+b' : '');
      }
      p.arrow(m, 'res', 'm').render();
      const near = KIT.nearest(m);
      out.innerHTML = `<p>a = ${KIT.nameOf(v.a)} ${vec(a)}, b = ${KIT.nameOf(v.b)} ${vec(b)}</p>` +
        `<p><strong>m = ${fmt(1 - v.t)}·a + ${fmt(v.t)}·b = ${vec(m, 2)}</strong></p>` +
        `<p>m에 가장 가까운 노래는 <strong>${near.song.name}</strong>이며 거리는 ${fmt(near.d)}입니다.</p>`;
    };
    const ctl = UI.ranges(root, (v) => { stop(); draw(v, 0); });
    root.querySelector('[data-play]').addEventListener('click', () => {
      stop();
      stop = UI.animate(1600, (t) => draw(ctl.values(), t));
    });
    root.addEventListener('lab-reset', () => stop());
    ctl.update();
  });

  // 2장: '나'와 B의 내적·코사인. B는 각도와 길이로 정하거나 평면을 눌러 정합니다.
  UI.lab('similarity', (root) => {
    const p = new Plane(root.querySelector('svg'), { range: 4 });
    const me = SONGS.me, out = root.querySelector('.readout'), tbl = root.querySelector('.ranking');
    const draw = (v) => {
      const b = LA.scale(v.len, LA.fromDeg(v.angle));
      const d = LA.dot(me, b), c = LA.cosine(me, b), ang = LA.angleDeg(me, b);
      p.clear().grid().axes(F).arrow(me, 'me', '나').arrow(b, 'b', 'B').render();
      const sign = d > 0.05 ? '같은 쪽을 향합니다' : d < -0.05 ? '반대쪽을 향합니다' : '서로 직각에 가깝습니다';
      out.innerHTML = `<p>B = ${vec(b, 2)}, 길이 |B| = ${fmt(LA.norm(b))}, |나| = ${fmt(LA.norm(me))}</p>` +
        `<p><strong>내적 나·B = ${fmt(d)}</strong> · 코사인 유사도 = ${c === null ? '정의되지 않음(B의 길이가 0)' : fmt(c)} · 사잇각 = ${ang === null ? '—' : fmt(ang, 0) + '°'}</p>` +
        `<p>${c === null ? '길이가 0인 화살표는 방향이 없어서 각도를 잴 수 없습니다.' : `두 화살표는 ${sign}.`}</p>`;
    };
    const ctl = UI.ranges(root, draw);
    p.draggable((pt) => {
      const len = Math.min(4, LA.norm(pt));
      let ang = (Math.atan2(pt[1], pt[0]) * 180) / Math.PI;
      if (ang < 0) ang += 360;
      ctl.set('angle', Math.round(ang));
      ctl.set('len', Math.round(len * 10) / 10);
      ctl.update();
    });
    const rows = SONGS.songs.map((s) => ({ s, d: LA.dot(me, s.v), c: LA.cosine(me, s.v) }));
    const byDot = [...rows].sort((x, y) => y.d - x.d), byCos = [...rows].sort((x, y) => y.c - x.c);
    KIT.table(tbl, ['순위', '내적 기준', '내적', '코사인 기준', '코사인'],
      byDot.map((r, i) => ({ top: i === 0, cells: [i + 1, r.s.name, fmt(r.d), byCos[i].s.name, fmt(byCos[i].c)] })), [0, 2, 4]);
    ctl.update();
  });

  // 3장: 방향 θ의 단위벡터 u 위로 모든 노래를 투영한 점수 s·u
  UI.lab('projection', (root) => {
    const p = new Plane(root.querySelector('svg'), { range: 4 });
    const out = root.querySelector('.readout'), tbl = root.querySelector('.ranking');
    let stop = () => {};
    const draw = (v, drop) => {
      const u = LA.fromDeg(v.theta);
      p.clear().grid().axes(F).line(LA.scale(-6, u), LA.scale(6, u), 'guide');
      const scored = SONGS.songs.map((s) => ({ s, pr: LA.project(s.v, u) })).sort((a, b) => b.pr.scalar - a.pr.scalar);
      for (const { s, pr } of scored) {
        const at = LA.add(s.v, LA.scale(drop, LA.sub(pr.vector, s.v)));
        p.line(s.v, pr.vector, 'drop').point(s.v, 'dim', '', 3.5).point(at, s === scored[0].s ? 'hi' : '', s.name, 4.5);
      }
      p.arrow(u, 'me', 'u').render();
      KIT.table(tbl, ['순위', '노래', '점수 s·u'], scored.map((r, i) => ({ top: i === 0, cells: [i + 1, r.s.name, fmt(r.pr.scalar)] })), [0, 2]);
      out.innerHTML = `<p>u = ${vec(u, 2)} (θ = ${v.theta}°)</p><p>가장 높은 점수: <strong>${scored[0].s.name}</strong> ${fmt(scored[0].pr.scalar)}, ` +
        `가장 낮은 점수: ${scored[scored.length - 1].s.name} ${fmt(scored[scored.length - 1].pr.scalar)}</p>`;
    };
    const ctl = UI.ranges(root, (v) => { stop(); draw(v, 0); });
    root.querySelector('[data-play]').addEventListener('click', () => {
      stop();
      stop = UI.animate(1400, (t) => draw(ctl.values(), t));
    });
    root.addEventListener('lab-reset', () => stop());
    ctl.update();
  });
})();
