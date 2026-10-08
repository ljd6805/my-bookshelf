/* 4~7장 실험: 행렬과 격자, 변환의 순서, 행렬식, 연립방정식. */
(function () {
  'use strict';
  const { fmt, vec, mat } = UI;
  const F = SONGS.features;
  const PRESETS = {
    identity: [[1, 0], [0, 1]],
    scores: [[0.45, 0.89], [-0.89, 0.45]],
    stretch: [[2, 0], [0, 0.5]],
    rotate: [[0.7, -0.7], [0.7, 0.7]],
    shear: [[1, 1], [0, 1]],
    flat: [[1, 0.5], [2, 1]]
  };
  const MOVES = {
    rot90: { name: '90° 회전', M: LA.rotation(90) },
    wide: { name: '가로 2배', M: LA.scaling(2, 1) },
    shear: { name: '오른쪽으로 밀기', M: LA.shear(1) },
    mirror: { name: '가로축 뒤집기', M: LA.scaling(1, -1) }
  };
  const FLAG = [[0, 0], [0, 2], [1.3, 1.6], [0, 1.2]];
  const close = (A, B) => A.every((r, i) => r.every((x, j) => Math.abs(x - B[i][j]) < 1e-9));

  // 4장: 행렬 [a b; c d]가 격자와 노래를 어디로 옮기는가
  UI.lab('matrix-grid', (root) => {
    const p = new Plane(root.querySelector('svg'), { range: 4 });
    const out = root.querySelector('.readout'), preset = root.querySelector('select[name=preset]');
    let stop = () => {};
    const M = (v) => [[v.a, v.b], [v.c, v.d]];
    const draw = (v, t) => {
      const T = LA.lerpMatrix(LA.identity(), M(v), t === undefined ? 1 : t);
      p.clear().grid(null, 'faint').grid(T, 'moved');
      KIT.drawSongs(p, (s) => LA.matVec(T, s), { labels: false });
      p.arrow(LA.matVec(T, [1, 0]), 'a', 'e₁ 도착').arrow(LA.matVec(T, [0, 1]), 'b', 'e₂ 도착')
        .arrow(LA.matVec(T, SONGS.me), 'me', '나').render();
      const m = LA.matVec(M(v), SONGS.me);
      out.innerHTML = `<p>M = ${mat(M(v), 2)}</p><p>e₁ = (1, 0) → <strong>${vec([v.a, v.c], 2)}</strong> (첫째 열), ` +
        `e₂ = (0, 1) → <strong>${vec([v.b, v.d], 2)}</strong> (둘째 열)</p>` +
        `<p>나 (1, 2) → 1·${vec([v.a, v.c], 2)} + 2·${vec([v.b, v.d], 2)} = <strong>${vec(m, 2)}</strong></p>`;
    };
    const ctl = UI.ranges(root, (v) => { stop(); draw(v); });
    preset.addEventListener('change', () => {
      const P = PRESETS[preset.value];
      ['a', 'b', 'c', 'd'].forEach((k, i) => ctl.set(k, P[Math.floor(i / 2)][i % 2]));
      ctl.update();
    });
    root.querySelector('[data-play]').addEventListener('click', () => {
      stop();
      stop = UI.animate(1800, (t) => draw(ctl.values(), t));
    });
    root.addEventListener('lab-reset', () => stop());
    ctl.update();
  });

  // 5장: 두 변환을 서로 다른 순서로 합성하기
  UI.lab('compose', (root) => {
    const planes = [...root.querySelectorAll('svg')].map((s) => new Plane(s, { range: 3 }));
    const out = root.querySelector('.readout');
    const paint = (p, first, both, title) => {
      p.clear().grid().axes().poly(FLAG, 'unit').poly(FLAG.map((q) => LA.matVec(first, q)), 'mid')
        .poly(FLAG.map((q) => LA.matVec(both, q)), 'area').arrow(LA.matVec(both, [1, 2]), 'me', '나')
        .text([-2.85, 2.6], title, 'axis-label').render();
    };
    const draw = (v) => {
      const A = MOVES[v.first], B = MOVES[v.second];
      const AB = LA.matMul(B.M, A.M), BA = LA.matMul(A.M, B.M);
      paint(planes[0], A.M, AB, `${A.name} → ${B.name}`);
      paint(planes[1], B.M, BA, `${B.name} → ${A.name}`);
      const same = close(AB, BA);
      out.innerHTML = `<p>왼쪽: ${A.name} 다음 ${B.name} = ${mat(AB, 2)}</p><p>오른쪽: ${B.name} 다음 ${A.name} = ${mat(BA, 2)}</p>` +
        `<p class="${same ? 'status-ok' : 'status-bad'}"><strong>${same ? '두 순서의 결과가 같습니다.' : '순서를 바꾸면 결과가 달라집니다.'}</strong></p>`;
    };
    UI.ranges(root, draw).update();
  });

  // 6장: 둘째 열의 방향 θ를 돌리며 넓이 배율(행렬식)을 관찰합니다. 첫째 열은 (1.5, 1.5)로 고정합니다.
  UI.lab('determinant', (root) => {
    const p = new Plane(root.querySelector('svg'), { range: 4 });
    const out = root.querySelector('.readout');
    const draw = (v) => {
      const c2 = LA.scale(1.5, LA.fromDeg(v.theta));
      const M = [[1.5, c2[0]], [1.5, c2[1]]], d = LA.det(M), flat = Math.abs(d) < 0.05;
      const sq = [[0, 0], [1, 0], [1, 1], [0, 1]];
      p.clear().grid().axes().poly(sq, 'unit').poly(sq.map((q) => LA.matVec(M, q)), d < 0 ? 'area flip' : 'area');
      KIT.drawSongs(p, (s) => LA.matVec(M, s), { labels: false });
      p.arrow([1.5, 1.5], 'a', '첫째 열').arrow(c2, 'b', '둘째 열').render();
      const how = flat ? '<span class="status-bad">평면이 한 직선으로 납작해졌습니다. 직선에 수직인 방향의 차이는 모두 사라집니다.</span>'
        : d < 0 ? '넓이는 남았지만 앞뒤가 뒤집혔습니다(점선 테두리). 시계 방향과 반시계 방향이 바뀝니다.'
          : '넓이가 남아 있고 방향도 그대로입니다.';
      out.innerHTML = `<p>M = ${mat(M, 2)}</p><p><strong>det M = ${fmt(d)}</strong> → 단위 정사각형의 넓이 1이 ${fmt(Math.abs(d))}가 됩니다.</p><p>${how}</p>`;
    };
    UI.ranges(root, draw).update();
  });

  function lineThrough(a, b, c) {
    const n2 = a * a + b * b;
    const p0 = [(c * a) / n2, (c * b) / n2], dir = LA.scale(12 / Math.sqrt(n2), [-b, a]);
    return [LA.add(p0, dir), LA.sub(p0, dir)];
  }

  // 7장: 기록된 점수 b에서 원래 노래 x를 찾기. M = [2 1; 1 d]
  UI.lab('solve', (root) => {
    const p = new Plane(root.querySelector('svg'), { range: 4 });
    const out = root.querySelector('.readout');
    const draw = (v) => {
      const M = [[2, 1], [1, v.d]], b = [v.b1, v.b2], x = LA.solve(M, b), d = LA.det(M);
      const [l1a, l1b] = lineThrough(2, 1, b[0]), [l2a, l2b] = lineThrough(1, v.d, b[1]);
      p.clear().grid().axes(F).line(l1a, l1b, 'guide').line(l2a, l2b, 'axis-pc');
      KIT.drawSongs(p, null, { dim: true, labels: false });
      let msg;
      if (!x || Math.abs(d) < 0.02) {
        msg = '<p class="status-bad"><strong>두 직선이 평행에 가깝습니다. 하나의 답을 정할 수 없습니다.</strong> 답이 없거나, 직선 위의 모든 점이 답이 됩니다.</p>';
      } else {
        const near = KIT.nearest(x);
        p.point(x, 'res', '되찾은 노래', 6);
        msg = `<p><strong>x = M⁻¹·b = ${vec(x, 2)}</strong></p><p>검산: M·x = ${vec(LA.matVec(M, x), 2)}</p>` +
          `<p>가장 가까운 노래: ${near.song.name} (거리 ${fmt(near.d)})</p>`;
      }
      p.render();
      out.innerHTML = `<p>식 ① 2x + y = ${fmt(b[0])} (주황 점선), 식 ② x + ${fmt(v.d)}y = ${fmt(b[1])} (보라 실선)</p>` +
        `<p>det M = 2·${fmt(v.d)} − 1 = <strong>${fmt(d)}</strong></p>${msg}`;
    };
    UI.ranges(root, draw).update();
  });
})();
