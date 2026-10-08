/* 첫 화면의 작은 실험: 센서 20대의 하루 경보를 하루씩 흉내 내고, 경보 개수의 분포를 쌓는다.
   막대는 모의 실험 비율, 테두리는 이항분포 계산값이다. */
(function () {
  'use strict';
  const S = window.ProbStats, I = window.ProbInference, U = window.ProbUI;
  const N = 20, MAX_BIN = 10, SEED = 11;

  function sensorsSvg(today) {
    let s = '';
    for (let i = 0; i < N; i += 1) {
      const cx = 46 + (i % 10) * 52, cy = 34 + Math.floor(i / 10) * 44, on = today && today[i];
      s += `<circle class="sensor${on ? ' on' : ''}" cx="${cx}" cy="${cy}" r="15"/>`;
      if (on) s += `<text class="sensor-mark" x="${cx}" y="${cy + 5}" text-anchor="middle">!</text>`;
    }
    return s;
  }

  function histogramSvg(counts, days, p) {
    const exact = S.binomialDistribution(N, p);
    const ex = I.capTail(exact, MAX_BIN), sim = I.frequencies(I.capTail(counts, MAX_BIN), days);
    const top = 120, bottom = 268, bw = 46, maxY = Math.max(0.3, ...ex, ...sim) * 1.05;
    const y = (v) => bottom - (v / maxY) * (bottom - top);
    let s = `<line class="axis" x1="24" x2="540" y1="${bottom}" y2="${bottom}"/>`;
    ex.forEach((v, i) => {
      const x = 28 + i * bw;
      if (days) s += `<rect class="bar${i >= 5 ? ' hot' : ''}" x="${x + 3}" width="${bw - 6}" y="${y(sim[i])}" height="${bottom - y(sim[i])}"/>`;
      s += `<rect class="exact" x="${x + 3}" width="${bw - 6}" y="${y(v)}" height="${bottom - y(v)}"/>`;
      s += `<text class="tick" x="${x + bw / 2}" y="${bottom + 16}" text-anchor="middle">${i === MAX_BIN ? '10+' : i}</text>`;
    });
    s += `<line class="target" x1="${28 + 5 * bw}" x2="${28 + 5 * bw}" y1="${top - 6}" y2="${bottom}"/><text class="tick strong" x="${32 + 5 * bw}" y="${top + 6}">5번 이상</text>`;
    return s;
  }

  function mount(root) {
    let random = S.rng(SEED), counts = new Array(N + 1).fill(0), days = 0, today = null, cancel = () => {};
    const chart = U.h('div', { class: 'home-chart' });
    const readout = U.h('p', { class: 'caption', 'aria-live': 'polite' });
    const pS = U.slider({ id: 'home-p', label: '센서별 하루 경보 확률', min: 0.02, max: 0.3, step: 0.01, value: 0.1, format: (v) => v.toFixed(2) }, () => reset());
    function render() {
      const p = pS.get(), rare = days ? S.sum(counts.slice(5)) / days : 0;
      const label = `센서 20대의 오늘 경보와 지금까지 ${days}일의 경보 개수 분포`;
      chart.innerHTML = `<svg viewBox="0 0 560 290" role="img" aria-label="${label}">${sensorsSvg(today)}${histogramSvg(counts, days, p)}</svg>`;
      const exact = S.binomialUpper(N, 5, p);
      readout.textContent = days
        ? `오늘 경보 ${today.filter(Boolean).length}번 · 지금까지 ${days}일 중 5번 이상인 날 ${U.fmt.pct(rare, 0)} · 계산한 P(5번 이상) = ${U.fmt.pct(exact, 1)}`
        : `버튼을 눌러 하루를 보내 보세요. 평소 상태에서 5번 이상 울리는 날의 확률은 계산상 ${U.fmt.pct(exact, 1)}입니다.`;
    }
    function run(d) {
      cancel();
      const p = pS.get();
      cancel = U.animate(d, 1, () => {
        today = S.flips(N, p, random);
        counts[S.sum(today)] += 1; days += 1;
        render();
      });
    }
    function reset() { cancel(); random = S.rng(SEED); counts = new Array(N + 1).fill(0); days = 0; today = null; render(); }
    root.append(
      U.h('div', { class: 'lab-top' }, [U.h('span', { text: 'ALARM SIMULATOR' }), U.h('span', { text: '센서 20대 · 1장과 2장의 실험' })]),
      chart, pS.wrap,
      U.h('div', { class: 'buttons' }, [U.button('하루 지나기', () => run(1)), U.button('30일 지나기', () => run(30)), U.button('초기화', () => { pS.set(0.1); reset(); }, 'ghost')]),
      U.h('p', { class: 'legend' }, [U.h('span', { text: '테두리: 이항분포로 계산한 확률' }), U.h('span', { text: '채운 막대: 모의 실험 비율' }), U.h('span', { text: '점선 오른쪽 주황 막대: 5번 이상인 날' })]),
      readout,
      U.h('p', { class: 'caption lab-meta' }, [U.h('b', { text: '시뮬레이션 · 씨앗 고정 난수' }), ' 경보 확률 0.02~0.30, 0.01 간격. 센서 20대는 서로 독립이고 모두 같은 확률로 울린다고 가정합니다.']));
    render();
    return () => cancel();
  }

  window.ProbHomeLab = { mount };
})();
