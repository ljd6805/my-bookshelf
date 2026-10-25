/* 8~11장 실험: 고유벡터, 주성분, 신경망 한 층, 마지막 과제. */
(function () {
  'use strict';
  const { fmt, vec, mat } = UI;
  const F = SONGS.features;
  const EIGEN_PRESETS = {
    sym: [[2, 1], [1, 2]],
    stretch: [[2, 0], [0, 0.5]],
    shear: [[1, 1], [0, 1]],
    rotate: LA.rotation(45)
  };
  const signedAngle = (a, b) => (Math.atan2(a[0] * b[1] - a[1] * b[0], LA.dot(a, b)) * 180) / Math.PI;

  // 8장: 단위벡터 v를 돌리며 Mv가 v와 같은 직선 위에 오는 순간을 찾습니다.
  UI.lab('eigen', (root) => {
    const p = new Plane(root.querySelector('svg'), { range: 3.5 });
    const out = root.querySelector('.readout');
    let stop = () => {};
    const draw = (v) => {
      const M = EIGEN_PRESETS[v.preset], u = LA.fromDeg(v.phi), Mu = LA.matVec(M, u);
      const ring = [], image = [];
      for (let k = 0; k < 72; k++) { const w = LA.fromDeg(k * 5); ring.push(w); image.push(LA.matVec(M, w)); }
      p.clear().grid().axes().poly(ring, 'unit').poly(image, 'mid');
      if (v.show) for (const e of LA.eigen2(M)) p.line(LA.scale(-6, e.vector), LA.scale(6, e.vector), 'axis-pc');
      p.arrow(Mu, 'b', 'Mv').arrow(u, 'a', 'v').render();
      const ang = signedAngle(u, Mu), len = LA.norm(Mu);
      const aligned = len > 1e-6 && (Math.abs(ang) < 0.5 || Math.abs(Math.abs(ang) - 180) < 0.5);
      const lambda = LA.dot(Mu, u);
      out.innerHTML = `<p>M = ${mat(M, 2)}, v = ${vec(u, 2)} (φ = ${v.phi}°)</p>` +
        `<p>Mv = ${vec(Mu, 2)}, 길이 ${fmt(len)}, v에서 ${fmt(ang, 0)}° 돌아감</p>` +
        `<p class="${aligned ? 'status-ok' : ''}"><strong>${aligned ? `방향이 그대로입니다. Mv ≈ ${fmt(lambda)}·v 이므로 이 v는 고유벡터에 가깝고 고윳값은 약 ${fmt(lambda)}입니다.`
          : '방향이 바뀌었습니다. 이 v는 고유벡터가 아닙니다.'}</strong></p>`;
    };
    const ctl = UI.ranges(root, (v) => draw(v));
    root.querySelector('[data-play]').addEventListener('click', () => {
      stop();
      const from = ctl.values().phi;
      stop = UI.animate(6000, (t) => { ctl.set('phi', Math.round(from + t * 360) % 360); ctl.update(); });
    });
    root.addEventListener('lab-reset', () => stop());
    ctl.update();
  });

  // 8장 두 번째 실험: 같은 행렬을 거듭 곱하면(거듭제곱법) 방향이 가장 큰 고윳값의 고유벡터로 끌려갑니다.
  const POWER_PRESETS = {
    sym: [[2, 1], [1, 2]],
    close: [[2.95, 0.05], [0.05, 2.95]],
    rotate: LA.rotation(45)
  };
  // 큰 수는 지수 표기로 줄입니다(3³⁰ ≈ 2×10¹⁴까지 나옵니다).
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sup = (k) => String(k).split('').map((c) => SUP[c]).join('');
  const powName = (k) => (k === 0 ? 'v' : k === 1 ? 'Mv' : `M${sup(k)}v`);
  const big = (x) => {
    if (Math.abs(x) < 1e5) return fmt(x, Math.abs(x) < 100 ? 2 : 0);
    const e = Math.floor(Math.log10(Math.abs(x)));
    return `${fmt(x / 10 ** e, 2)}×10${sup(e)}`;
  };
  const bigVec = (v) => `(${v.map(big).join(', ')})`;
  // 두 방향이 이루는 직선 사이 각도(0°~90°). 고유벡터는 방향이 아니라 직선이므로 부호를 따지지 않습니다.
  const lineGap = (a, b) => { const c = Math.abs(LA.cosine(a, b)); return (Math.acos(Math.min(1, c)) * 180) / Math.PI; };

  function powerVerdict(M, steps, n) {
    const last = steps[steps.length - 1], pairs = LA.eigen2(M).sort((p, q) => Math.abs(q.value) - Math.abs(p.value));
    if (n === 0) return '<p>아직 한 번도 곱하지 않았습니다. 곱하는 횟수 n을 늘려 보세요.</p>';
    if (!pairs.length) return `<p><strong>수렴하지 않습니다.</strong> 곱할 때마다 ${fmt(last.turn, 0)}°씩 돌기만 하고 길이 배율은 ${fmt(last.ratio)}입니다. 실수 고유벡터가 없어 끌려갈 방향이 없습니다.</p>`;
    const [p1, p2] = pairs, d1 = (Math.atan2(p1.vector[1], p1.vector[0]) * 180) / Math.PI;
    const gap = lineGap(last.v, p1.vector), q = p2 ? Math.abs(p2.value / p1.value) : 0;
    if (gap < 0.5) return `<p class="status-ok"><strong>방향이 자리를 잡았습니다.</strong> ${powName(n)}는 가장 큰 고윳값 λ₁ = ${fmt(p1.value)}의 고유벡터 직선(${fmt(((d1 % 180) + 180) % 180, 0)}°)에서 ${fmt(gap, 1)}° 안에 있고, 배율 ${fmt(last.ratio)}도 λ₁에 다가갔습니다.</p>`;
    if (p2 && lineGap(steps[0].v, p2.vector) < 1e-6) return `<p><strong>처음부터 λ₂ = ${fmt(p2.value)}인 고유벡터 위에서 시작해 방향이 끝까지 바뀌지 않습니다.</strong> λ₁ 방향 성분이 정확히 0이라 거듭 곱해도 끌려갈 것이 없습니다.</p>`;
    return `<p><strong>아직 움직이는 중입니다.</strong> 마지막 한 번에 ${fmt(Math.abs(last.turn), 1)}° 돌았고, λ₁ = ${fmt(p1.value)}의 고유벡터 직선까지 ${fmt(gap, 1)}° 남았습니다. ` +
      `둘째 방향 성분은 곱할 때마다 λ₂/λ₁ = ${fmt(q)}배로 상대적으로 줄어듭니다.</p>`;
  }

  UI.lab('power', (root) => {
    const p = new Plane(root.querySelector('svg'), { range: 3 });
    const out = root.querySelector('.readout'), tbl = root.querySelector('.ranking');
    let stop = () => {};
    const draw = (v) => {
      const M = POWER_PRESETS[v.preset] || POWER_PRESETS.sym, steps = LA.powerSteps(M, [v.v1, v.v2], v.n);
      p.clear().grid().axes();
      for (const e of LA.eigen2(M)) p.line(LA.scale(-6, e.vector), LA.scale(6, e.vector), 'axis-pc');
      if (!steps) {
        p.render(); tbl.innerHTML = '';
        out.innerHTML = '<p class="status-bad"><strong>시작 벡터가 (0, 0)입니다.</strong> 길이가 0인 화살표에는 방향이 없어서 몇 번을 곱해도 (0, 0)입니다. v₁이나 v₂를 0이 아닌 값으로 바꾸세요.</p>';
        return;
      }
      const dir = (s) => LA.scale(2.2 / LA.norm(s.v), s.v), last = steps[steps.length - 1];
      steps.slice(0, -1).forEach((s) => p.point(dir(s), 'dim', '', 3.5));
      p.arrow(dir(steps[0]), 'a', 'v');
      if (last.k) p.arrow(dir(last), 'b', powName(last.k));
      p.render();
      const shown = steps.length > 9 ? [...steps.slice(0, 3), null, ...steps.slice(-4)] : steps;
      KIT.table(tbl, ['k', 'Mᵏv', '방향', '돈 각도', '배율'], shown.map((s) => (s ? {
        top: s === last, cells: [String(s.k), bigVec(s.v), `${fmt(s.angle, 1)}°`, s.turn === null ? '—' : `${fmt(s.turn, 1)}°`, s.ratio === null ? '—' : fmt(s.ratio)]
      } : { cells: ['…', '', '', '', ''] })), [0, 2, 3, 4]);
      out.innerHTML = `<p>M = ${mat(M, 2)}, 시작 v = ${vec([v.v1, v.v2])}, ${v.n}번 곱함</p>` +
        `<p>${powName(last.k)} = ${bigVec(last.v)} · 방향 <strong>${fmt(last.angle, 1)}°</strong>${last.ratio === null ? '' : ` · 마지막 배율 <strong>${fmt(last.ratio)}</strong>`}</p>` +
        powerVerdict(M, steps, v.n);
    };
    const ctl = UI.ranges(root, draw);
    root.querySelector('[data-play]').addEventListener('click', () => {
      stop();
      const max = Number(root.querySelector('[name=n]').max);
      stop = UI.animate(8000, (t) => { ctl.set('n', Math.round(t * max)); ctl.update(); });
    });
    root.addEventListener('lab-reset', () => stop());
    ctl.update();
  });

  // 9장: 방향 θ로 투영했을 때 점수의 분산. 가장 큰 분산의 방향이 첫째 주성분입니다.
  UI.lab('pca', (root) => {
    const [svg, chart] = root.querySelectorAll('svg');
    const p = new Plane(svg, { range: 4 });
    const out = root.querySelector('.readout');
    const pts = SONGS.songs.map((s) => s.v), C = LA.covariance(pts), m = LA.mean(pts), pc = LA.pca(pts);
    const total = C[0][0] + C[1][1];
    const varAt = (deg) => { const u = LA.fromDeg(deg); return LA.dot(u, LA.matVec(C, u)); };
    const best = ((Math.atan2(pc.axis[1], pc.axis[0]) * 180) / Math.PI + 180) % 180;
    const maxV = varAt(best);
    const curve = Array.from({ length: 181 }, (_, d) => `${(d * 2).toFixed(0)},${(110 - (varAt(d) / maxV) * 95).toFixed(1)}`).join(' ');
    const draw = (v) => {
      const u = LA.fromDeg(v.theta), varU = varAt(v.theta);
      p.clear().grid().axes(F).line(LA.add(m, LA.scale(-7, u)), LA.add(m, LA.scale(7, u)), 'guide');
      if (v.show) p.line(LA.add(m, LA.scale(-7, pc.axis)), LA.add(m, LA.scale(7, pc.axis)), 'axis-pc');
      for (const s of SONGS.songs) {
        const foot = LA.add(m, LA.project(LA.sub(s.v, m), u).vector);
        p.line(s.v, foot, 'drop').point(s.v, '', '', 4.5).point(foot, 'hi', '', 3);
      }
      p.point(m, 'res', '평균', 4).render();
      const x = v.theta * 2, y = 110 - (varU / maxV) * 95;
      chart.innerHTML = `<polyline class="curve" points="${curve}"/><line class="marker" x1="${x}" y1="10" x2="${x}" y2="112"/>` +
        `<circle class="dot" cx="${x}" cy="${y.toFixed(1)}" r="5"/><text x="4" y="12">분산</text><text x="356" y="118" class="end">θ = 180°</text><text x="4" y="118">0°</text>`;
      out.innerHTML = `<p>θ = ${v.theta}° 방향으로 잰 점수의 분산: <strong>${fmt(varU)}</strong> / 전체 분산 ${fmt(total)}</p>` +
        `<p>이 방향 하나로 전체 퍼짐의 <strong>${fmt((100 * varU) / total, 0)}%</strong>를 설명합니다. ` +
        `가장 큰 값은 θ ≈ ${fmt(best, 0)}°에서 ${fmt((100 * maxV) / total, 0)}%입니다.</p>` +
        `<p>공분산 행렬 C = ${mat(C, 2)}</p>`;
    };
    const ctl = UI.ranges(root, draw);
    root.querySelector('[data-snap]').addEventListener('click', () => { ctl.set('theta', Math.round(best)); ctl.update(); });
    ctl.update();
  });

  // 10장: h = ReLU(W·x + b). W의 두 행은 3장의 '내 취향 방향'과 그에 수직인 방향입니다.
  UI.lab('layer', (root) => {
    const [left, right] = [...root.querySelectorAll('svg')].map((s) => new Plane(s, { range: 4 }));
    const out = root.querySelector('.readout'), tbl = root.querySelector('.ranking');
    const W = [[0.45, 0.89], [0.89, -0.45]];
    const draw = (v) => {
      const b = [v.b1, v.b2], f = (x) => { const z = LA.layer(W, b, x); return v.relu ? LA.relu(z) : z; };
      left.clear().grid().axes(F);
      W.forEach((w, i) => {
        const [a, c] = [w[0], w[1]], n2 = a * a + c * c, p0 = LA.scale(-b[i] / n2, w), d = LA.scale(8, [-c, a]);
        left.line(LA.add(p0, d), LA.sub(p0, d), i ? 'axis-pc' : 'guide');
      });
      KIT.drawSongs(left, null, { labels: false }).render();
      right.clear().grid().axes(['h₁', 'h₂']);
      KIT.drawSongs(right, (x) => f(x), { labels: false }).render();
      const rows = SONGS.songs.map((s) => ({ s, h: f(s.v) })).sort((x, y) => y.h[0] - x.h[0]);
      const zeros = rows.filter((r) => r.h[0] === 0).length;
      KIT.table(tbl, ['노래', 'h₁ 취향 신호', 'h₂ 빠르지만 차분함'], rows.map((r, i) => ({ top: i === 0, cells: [r.s.name, fmt(r.h[0]), fmt(r.h[1])] })), [1, 2]);
      out.innerHTML = `<p>W = ${mat(W, 2)}, b = ${vec(b, 1)}, ReLU ${v.relu ? '켬' : '끔'}</p>` +
        `<p>${v.relu ? `h₁이 정확히 0이 된 노래: <strong>${zeros}곡</strong>. 경계선(붉은 점선) 아래쪽 노래는 모두 같은 값 0으로 접힙니다.`
          : 'ReLU를 끄면 이 층은 행렬 곱 하나에 덧셈만 더한 직선 변환입니다. 오른쪽 그림의 노래들은 돌고 밀릴 뿐 어느 축에도 접히지 않습니다.'}</p>`;
    };
    UI.ranges(root, draw).update();
  });

  // 11장의 3차원 그림. 그림을 그릴 수 없는 환경이면 null을 돌려주고 표만 씁니다.
  function make3D(root) {
    const svg = root.querySelector('.space3d svg');
    if (!svg || !window.Space3D) return null;
    const read = root.querySelector('.space3d-read');
    const space = new Space3D(svg, { labels: ['빠르기', '에너지', '가사'],
      onView: (s) => {
        const view = s.pitch >= 89 ? '위에서 본 2차원 지도' : s.pitch <= 1 ? '옆에서 본 가사 축' : `돌린 각도 ${Math.round(s.yaw)}°, 기울기 ${Math.round(s.pitch)}°`;
        read.textContent = `${read.dataset.base || ''} 지금 보는 방향: ${view}.`;
      } });
    space.controls(root);
    // 그림이 처음 화면에 들어올 때 2차원 지도에서 셋째 축이 일어서는 장면을 한 번 보여 줍니다.
    if ('IntersectionObserver' in window) {
      const seen = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { seen.disconnect(); space.rise(); }
      }, { threshold: 0.4 });
      seen.observe(svg);
    } else space.set(Space3D.START.yaw, Space3D.START.pitch);
    return space;
  }

  const deg = (c) => (c === null ? '—' : `${Math.round(Math.acos(Math.max(-1, Math.min(1, c))) / Math.PI * 180)}°`);
  function drawSpace(space, root, user, rows) {
    const rock = rows.find((r) => r.s.id === 'rock'), top = rows[0];
    const read = root.querySelector('.space3d-read');
    read.dataset.base = top.c3 === null ? '취향 화살표의 길이가 0이라 방향을 그릴 수 없습니다.'
      : `취향 화살표와 1위 ${top.s.name} 사이의 각도는 ${deg(top.c3)}, 옥상 록 공연과는 ${deg(rock.c3)}입니다. 가사를 지운 바닥 위에서는 옥상 록 공연과 ${deg(rock.c2)}입니다.`;
    space.draw({ user, songs: rows.map((r, i) => ({ name: r.s.name, v: r.s3, top: i === 0 && r.c3 !== null, mark: r.s.id === 'rock' && i !== 0,
      label: `(${r.s3.map((n) => fmt(n, 1)).join(', ')})` })) });
  }

  // 11장: 셋째 특징(가사 비중)이 생긴 뒤의 추천. 3차원 코사인과 2차원 코사인을 비교합니다.
  UI.lab('challenge', (root) => {
    const tbl = root.querySelector('.ranking'), out = root.querySelector('.readout');
    const space = make3D(root);
    const draw = (v) => {
      const user = [v.u1, v.u2, v.u3];
      const rows = SONGS.songs.map((s) => {
        const s3 = [s.v[0], s.v[1], SONGS.lyrics[s.id]];
        return { s, s3, c3: LA.cosine(user, s3), c2: LA.cosine(user.slice(0, 2), s.v), d3: LA.dot(user, s3) };
      }).sort((x, y) => (y.c3 === null ? -2 : y.c3) - (x.c3 === null ? -2 : x.c3));
      const rank2 = [...rows].sort((x, y) => (y.c2 === null ? -2 : y.c2) - (x.c2 === null ? -2 : x.c2)).map((r) => r.s.id);
      KIT.table(tbl, ['노래', '(빠르기, 에너지, 가사)', '3D 코사인', '2D 코사인 순위', '3D 내적'],
        rows.map((r, i) => ({ top: i === 0, cells: [r.s.name, vec(r.s3), fmt(r.c3), `${rank2.indexOf(r.s.id) + 1}위`, fmt(r.d3)] })), [2, 3, 4]);
      const top = rows[0];
      if (space) drawSpace(space, root, user, rows);
      out.innerHTML = rows[0].c3 === null ? '<p class="status-bad">취향 벡터의 길이가 0입니다. 방향이 없으니 코사인 유사도를 계산할 수 없습니다.</p>'
        : `<p>새 취향 ${vec(user)}의 1위는 <strong>${top.s.name}</strong>(3D 코사인 ${fmt(top.c3)})입니다. ` +
          `가사를 무시한 2D 기준에서는 ${KIT.nameOf(rank2[0])}가 1위입니다.</p>`;
    };
    UI.ranges(root, draw).update();
  });
})();
