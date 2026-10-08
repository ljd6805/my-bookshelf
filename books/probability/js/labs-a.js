/* 1~4장 실험: 동전 던지기, 하루 경보 개수, 극단값과 요약값, 표본평균의 분포. */
(function () {
  'use strict';
  const S = window.ProbStats, I = window.ProbInference, U = window.ProbUI, C = U.chart;
  const labs = window.ProbLabs = window.ProbLabs || {};
  const MAX_FLIPS = 5000;

  function linePath(points, x, y) {
    const step = Math.max(1, Math.floor(points.length / 600));
    let d = '';
    for (let i = 0; i < points.length; i += step) d += `${d ? 'L' : 'M'}${x(i + 1).toFixed(1)},${y(points[i]).toFixed(1)}`;
    const last = points.length - 1;
    if (last >= 0 && last % step) d += `L${x(last + 1).toFixed(1)},${y(points[last]).toFixed(1)}`;
    return d;
  }

  function coinChart(props, p) {
    const n = props.length, maxX = Math.max(10, n);
    const x = C.scale(1, maxX, C.PAD.l, C.W - C.PAD.r), y = C.scale(0, 1, C.H - C.PAD.b, C.PAD.t);
    let s = C.frame(C.ticks(1, maxX, 4, (v) => U.fmt.int(v)), C.ticks(0, 1, 4, (v) => v.toFixed(2)), x, y, { x: '던진 횟수', y: '앞면 비율 p̂' });
    s += `<rect class="band" x="${C.PAD.l}" width="${C.W - C.PAD.l - C.PAD.r}" y="${y(Math.min(1, p + 0.05))}" height="${y(Math.max(0, p - 0.05)) - y(Math.min(1, p + 0.05))}"/>`;
    s += `<line class="target" x1="${C.PAD.l}" x2="${C.W - C.PAD.r}" y1="${y(p)}" y2="${y(p)}"/>`;
    if (n) s += `<path class="series" d="${linePath(props, x, y)}"/><circle class="dot" r="4" cx="${x(n)}" cy="${y(props[n - 1])}"/>`;
    const label = n ? `던진 ${n}번 동안 앞면 비율의 변화. 현재 ${props[n - 1].toFixed(3)}, 기준 확률 ${p}` : '아직 던지지 않았습니다';
    return C.svg(s, label);
  }

  labs.coin = {
    title: '동전을 던지며 비율 지켜보기', kind: '시뮬레이션 · 씨앗 고정 난수',
    units: '앞면 확률 p: 0.05~0.95, 0.05 간격 · 던진 횟수: 최대 5,000번',
    assumptions: '매번 던지기는 서로 독립이고 앞면 확률은 바뀌지 않습니다.',
    mount(root) {
      let random = S.rng(2026), outcomes = [], props = [], hits = 0, cancel = () => {};
      const pSlider = U.slider({ id: 'coin-p', label: '앞면 확률 p', min: 0.05, max: 0.95, step: 0.05, value: 0.5, format: (v) => v.toFixed(2) }, () => reset('확률을 바꿔서 기록을 새로 시작했습니다.'));
      const coin = U.h('div', { class: 'coin', 'aria-hidden': 'true' }, [U.h('span', { text: '?' })]);
      const chart = U.h('div', { class: 'chart' });
      const readout = U.h('p', { class: 'readout', 'aria-live': 'polite' });
      const note = U.h('p', { class: 'reading' });
      const buttons = [1, 10, 100, 1000].map((k) => U.button(`${k.toLocaleString('ko-KR')}번 던지기`, () => flip(k)));
      function render(msg) {
        const n = outcomes.length, p = pSlider.get();
        chart.innerHTML = coinChart(props, p);
        if (!n) { readout.textContent = msg || '버튼을 눌러 동전을 던져 보세요.'; note.textContent = '선이 점선(진짜 확률)에서 얼마나 멀리 출렁이는지 보세요. 회색 띠는 p ± 0.05입니다.'; return; }
        const k = U.fmt.int(hits), ph = props[n - 1];
        readout.textContent = `${msg ? msg + ' ' : ''}던진 횟수 ${U.fmt.int(n)}번 · 앞면 ${k}번 · 비율 p̂ = ${ph.toFixed(3)} · p와의 차이 ${Math.abs(ph - p).toFixed(3)}`;
        note.textContent = n < 30 ? '아직 횟수가 적어 비율이 크게 흔들릴 수 있습니다. 몇 번 더 던져 보세요.'
          : n < 500 ? '흔들림이 줄고 있습니다. 회색 띠 안에 머무는 시간이 늘어나는지 보세요.'
          : '횟수가 많아져 비율이 진짜 확률 근처에 머뭅니다. 큰 수의 법칙입니다.';
      }
      function flip(k) {
        if (outcomes.length + k > MAX_FLIPS) { render(`최대 ${MAX_FLIPS.toLocaleString('ko-KR')}번까지 던질 수 있습니다. 초기화한 뒤 다시 시작하세요.`); return; }
        cancel();
        const batch = S.flips(k, pSlider.get(), random);
        coin.classList.remove('spin'); void coin.offsetWidth; coin.classList.add('spin');
        coin.firstChild.textContent = batch[k - 1] ? '앞' : '뒤';
        cancel = U.animate(k, Math.max(1, Math.ceil(k / 40)), (i) => {
          outcomes.push(batch[i]);
          hits += batch[i];
          props.push(hits / outcomes.length);
          if (i % Math.max(1, Math.ceil(k / 40)) === 0) render();
        }, () => render(k === 1 ? `방금 ${batch[0] ? '앞면' : '뒷면'}이 나왔습니다.` : ''));
      }
      function reset(msg) { cancel(); random = S.rng(2026); outcomes = []; props = []; hits = 0; coin.firstChild.textContent = '?'; render(msg); }
      root.append(U.h('div', { class: 'controls' }, [pSlider.wrap, U.h('div', { class: 'buttons' }, [...buttons, U.button('초기화', () => reset('처음 상태로 돌렸습니다.'), 'ghost')])]),
        U.h('div', { class: 'stage' }, [coin, chart]), readout, note);
      render();
      return () => cancel();
    }
  };

  function alarmChart(n, p, counts, days, k) {
    const exact = S.binomialDistribution(n, p);
    const maxY = Math.max(0.05, ...exact, ...counts.map((c) => (days ? c / days : 0))) * 1.1;
    const bw = (C.W - C.PAD.l - C.PAD.r) / (n + 1);
    const x = (i) => C.PAD.l + i * bw, y = C.scale(0, maxY, C.H - C.PAD.b, C.PAD.t);
    const step = n > 25 ? 5 : n > 10 ? 2 : 1;
    let s = C.frame(Array.from({ length: Math.floor(n / step) + 1 }, (_, i) => ({ v: i * step, label: String(i * step) })),
      C.ticks(0, maxY, 4, (v) => U.fmt.pct(v, 0)), (v) => x(v) + bw / 2, y, { x: '하루 경보 개수', y: '하루의 비율' });
    for (let i = 0; i <= n; i += 1) {
      const cls = i >= k ? 'bar hot' : 'bar';
      if (days) { const v = counts[i] / days; s += `<rect class="${cls}" x="${x(i) + 1}" width="${Math.max(1, bw - 2)}" y="${y(v)}" height="${y(0) - y(v)}"/>`; }
      s += `<rect class="exact" x="${x(i) + 1}" width="${Math.max(1, bw - 2)}" y="${y(exact[i])}" height="${y(0) - y(exact[i])}"/>`;
    }
    s += `<line class="target" x1="${x(k)}" x2="${x(k)}" y1="${C.PAD.t}" y2="${C.H - C.PAD.b}"/><text class="tick strong" x="${x(k) + 4}" y="${C.PAD.t + 12}">${k}번 이상</text>`;
    return C.svg(s, `센서 ${n}대, 경보 확률 ${p}의 하루 경보 개수 분포. 모의 ${days}일.`);
  }

  labs.alarms = {
    title: '하루 경보 개수의 분포 만들기', kind: '정확한 계산(테두리) + 시뮬레이션(채운 막대)',
    units: '센서 수: 5~50대 · 센서별 하루 경보 확률: 0.02~0.50 · 기준 개수: 0~센서 수',
    assumptions: '센서들은 서로 독립이고 모두 같은 경보 확률을 가집니다.',
    mount(root) {
      let random = S.rng(7), counts = [], days = 0, last = null, cancel = () => {};
      const nS = U.slider({ id: 'al-n', label: '센서 수 n', min: 5, max: 50, step: 1, value: 20, unit: '대' }, () => { kS.input.max = nS.get(); if (kS.get() > nS.get()) kS.set(nS.get()); reset(); });
      const pS = U.slider({ id: 'al-p', label: '센서별 하루 경보 확률 p', min: 0.02, max: 0.5, step: 0.01, value: 0.1, format: (v) => v.toFixed(2) }, () => reset());
      const kS = U.slider({ id: 'al-k', label: '"이상한 날"로 볼 기준', min: 0, max: 20, step: 1, value: 5, unit: '번 이상' }, () => render());
      const chart = U.h('div', { class: 'chart' }), readout = U.h('p', { class: 'readout', 'aria-live': 'polite' }), note = U.h('p', { class: 'reading' });
      function render() {
        const n = nS.get(), p = pS.get(), k = kS.get();
        chart.innerHTML = alarmChart(n, p, counts, days, k);
        const exact = S.binomialUpper(n, k, p), sim = days ? S.sum(counts.slice(k)) / days : null;
        readout.textContent = `계산한 P(경보 ≥ ${k}) = ${U.fmt.pct(exact, 2)} · 평균 개수 n·p = ${(n * p).toFixed(1)}번` +
          (days ? ` · 모의 ${U.fmt.int(days)}일 중 ${k}번 이상인 날 ${U.fmt.pct(sim, 1)}${last !== null ? ` · 마지막 날 ${last}번` : ''}` : ' · 아직 모의 실험 전');
        note.textContent = exact < 0.01 ? '평소 상태라면 100일에 한 번꼴도 나오지 않을 날입니다. 이런 날이 오면 원인을 조사할 가치가 있습니다.'
          : exact < 0.1 ? '드물지만 몇 달에 한 번에서 한 달에 몇 번까지는 나올 수 있는 날입니다. 한 번 나왔다고 고장으로 단정하기는 이릅니다.'
          : '평소에도 자주 나오는 날입니다. 이 기준으로 경보를 울리면 오경보가 많아집니다.';
      }
      function run(d) {
        cancel();
        const n = nS.get(), p = pS.get();
        cancel = U.animate(d, Math.max(1, Math.ceil(d / 30)), () => { last = S.binomialSample(n, p, random); counts[last] += 1; days += 1; if (days % Math.ceil(d / 30) === 0) render(); }, render);
      }
      function reset() { cancel(); random = S.rng(7); counts = new Array(nS.get() + 1).fill(0); days = 0; last = null; render(); }
      root.append(U.h('div', { class: 'controls' }, [nS.wrap, pS.wrap, kS.wrap, U.h('div', { class: 'buttons' }, [
        U.button('하루 지나기', () => run(1)), U.button('100일 지나기', () => run(100)), U.button('1,000일 지나기', () => run(1000)), U.button('초기화', () => { nS.set(20); pS.set(0.1); kS.input.max = 20; kS.set(5); reset(); }, 'ghost')])]),
        chart, U.h('p', { class: 'legend' }, [U.h('span', { class: 'key exact-key', text: '테두리: 이항분포로 계산한 확률' }), U.h('span', { class: 'key sim-key', text: '채운 막대: 모의 실험 비율' }), U.h('span', { class: 'key hot-key', text: '기준선 오른쪽 주황 막대: 기준 이상인 날' })]),
        readout, note);
      reset();
      return () => cancel();
    }
  };

  const BASE = [4.8, 5.0, 5.1, 4.9, 5.2, 5.0, 4.9, 5.1];

  function outlierChart(data) {
    const m = S.mean(data), md = S.median(data), s = S.sd(data);
    const x = C.scale(0, 42, C.PAD.l, C.W - C.PAD.r), cy = 120;
    let g = C.frame(C.ticks(0, 40, 8, (v) => String(v)), [], x, () => 0, { x: '진동값 (mm/s)' });
    g += `<rect class="band" x="${x(Math.max(0, m - s))}" width="${x(Math.min(42, m + s)) - x(Math.max(0, m - s))}" y="${cy - 30}" height="60"/>`;
    data.forEach((v, i) => { g += `<circle class="${i === data.length - 1 ? 'dot movable' : 'dot'}" r="7" cx="${x(v)}" cy="${cy + (i % 3 - 1) * 9}"/>`; });
    g += `<path class="mark-mean" d="M${x(m)},${cy + 44} l-9,16 h18 z"/><text class="tick strong" x="${x(m)}" y="${cy + 76}" text-anchor="middle">평균 ${m.toFixed(2)}</text>`;
    g += `<path class="mark-median" d="M${x(md)},${cy - 58} l9,9 l-9,9 l-9,-9 z"/><text class="tick strong" x="${x(md)}" y="${cy - 64}" text-anchor="middle">중앙값 ${md.toFixed(2)}</text>`;
    return C.svg(g, `측정값 9개의 점그림. 평균 ${m.toFixed(2)}, 중앙값 ${md.toFixed(2)}, 표준편차 ${s.toFixed(2)}`);
  }

  labs.outlier = {
    title: '극단값 하나가 요약값을 흔드는 정도', kind: '정확한 계산',
    units: '진동값 단위: mm/s · 아홉 번째 측정값: 4~40, 0.5 간격',
    assumptions: '여덟 개 측정값은 고정되어 있고 아홉 번째 값 하나만 바꿉니다.',
    mount(root) {
      const outS = U.slider({ id: 'out-v', label: '아홉 번째 측정값', min: 4, max: 40, step: 0.5, value: 5, unit: 'mm/s', format: (v) => v.toFixed(1) }, render);
      const chart = U.h('div', { class: 'chart' }), readout = U.h('p', { class: 'readout', 'aria-live': 'polite' }), note = U.h('p', { class: 'reading' });
      const base = [...BASE, 5.0], ref = { m: S.mean(base), s: S.sd(base) };
      function render() {
        const data = [...BASE, outS.get()], m = S.mean(data), md = S.median(data), s = S.sd(data);
        chart.innerHTML = outlierChart(data);
        readout.textContent = `평균 ${m.toFixed(2)} (기준 대비 ${(m - ref.m >= 0 ? '+' : '')}${(m - ref.m).toFixed(2)}) · 중앙값 ${md.toFixed(2)} · 표준편차 ${s.toFixed(2)} (기준의 ${(s / ref.s).toFixed(1)}배)`;
        note.textContent = outS.get() > 8 ? `"평균 + 2×표준편차"로 경보 기준을 잡으면 ${(m + 2 * s).toFixed(1)} mm/s가 됩니다. 정상 진동 5.0의 ${((m + 2 * s) / 5).toFixed(1)}배라서 진짜 이상도 놓치기 쉽습니다.`
          : '모든 값이 5 근처에 있어 평균과 중앙값이 거의 같습니다. 오른쪽으로 슬라이더를 밀어 보세요.';
      }
      root.append(U.h('div', { class: 'controls' }, [outS.wrap, U.h('div', { class: 'buttons' }, [
        U.button('측정 실수 30 넣기', () => { outS.set(30); render(); }), U.button('초기화', () => { outS.set(5); render(); }, 'ghost')])]),
        chart, U.h('p', { class: 'legend' }, [U.h('span', { class: 'key tri-key', text: '▲ 평균' }), U.h('span', { class: 'key dia-key', text: '◆ 중앙값' }), U.h('span', { class: 'key band-key', text: '띠: 평균 ± 표준편차' })]),
        readout, note);
      render();
      return () => {};
    }
  };

  function cltChart(values, pop, n, bins) {
    const counts = I.histogram(values, pop.min, pop.max, bins), total = values.length || 1;
    const width = (pop.max - pop.min) / bins, density = counts.map((c) => c / total / width);
    const se = pop.sd / Math.sqrt(n), peak = S.normalPdf(pop.mean, pop.mean, se);
    const maxY = Math.max(0.1, ...density, Math.min(peak, 6)) * 1.1;
    const x = C.scale(pop.min, pop.max, C.PAD.l, C.W - C.PAD.r), y = C.scale(0, maxY, C.H - C.PAD.b, C.PAD.t);
    let s = C.frame(C.ticks(pop.min, pop.max, 5, (v) => v.toFixed(1)), C.ticks(0, maxY, 3, (v) => v.toFixed(2)), x, y, { x: '표본 평균 x̄', y: '밀도' });
    density.forEach((d, i) => { s += `<rect class="bar" x="${x(pop.min + i * width) + 0.5}" width="${Math.max(1, x(pop.min + width) - x(pop.min) - 1)}" y="${y(d)}" height="${y(0) - y(d)}"/>`; });
    if (n >= 2 && values.length) {
      let d = '';
      for (let i = 0; i <= 120; i += 1) { const v = pop.min + ((pop.max - pop.min) * i) / 120; d += `${i ? 'L' : 'M'}${x(v).toFixed(1)},${y(Math.min(maxY, S.normalPdf(v, pop.mean, se))).toFixed(1)}`; }
      s += `<path class="curve" d="${d}"/>`;
    }
    s += `<line class="target" x1="${x(pop.mean)}" x2="${x(pop.mean)}" y1="${C.PAD.t}" y2="${C.H - C.PAD.b}"/>`;
    return C.svg(s, `표본 크기 ${n}의 평균 ${values.length}개 히스토그램`);
  }

  labs.clt = {
    title: '평균을 모으면 나타나는 종 모양', kind: '시뮬레이션 · 씨앗 고정 난수',
    units: '표본 크기 n: 1~50개 · 평균을 만든 횟수: 최대 5,000개',
    assumptions: '각 표본은 같은 모집단에서 서로 독립으로 뽑습니다. 치우친 모집단은 화면에 0~10만 표시합니다.',
    mount(root) {
      let random = S.rng(4), means = [], cancel = () => {}, popName = 'skewed';
      const nS = U.slider({ id: 'clt-n', label: '표본 크기 n', min: 1, max: 50, step: 1, value: 1, unit: '개' }, () => reset());
      const choice = U.h('fieldset', { class: 'choice' }, [U.h('legend', { text: '모집단' }), ...Object.entries(I.POPULATIONS).map(([key, pop]) =>
        U.h('label', {}, [U.h('input', { type: 'radio', name: 'clt-pop', value: key, checked: key === popName, onchange: () => { popName = key; reset(); } }), U.h('span', { text: pop.label })]))]);
      const chart = U.h('div', { class: 'chart' }), readout = U.h('p', { class: 'readout', 'aria-live': 'polite' }), note = U.h('p', { class: 'reading' });
      function render() {
        const pop = I.population(popName), n = nS.get(), se = pop.sd / Math.sqrt(n);
        chart.innerHTML = cltChart(means, pop, n, popName === 'dice' && n === 1 ? 6 : 30);
        readout.textContent = means.length
          ? `평균 ${U.fmt.int(means.length)}개 · 평균들의 평균 ${S.mean(means).toFixed(3)} (모집단 μ = ${pop.mean.toFixed(2)}) · 평균들의 표준편차 ${S.sd(means).toFixed(3)} (계산값 σ/√n = ${se.toFixed(3)})`
          : `아직 평균을 만들지 않았습니다. 계산값 σ/√n = ${se.toFixed(3)}`;
        note.textContent = n === 1 ? 'n = 1이면 평균이 곧 값 하나라서 모집단 모양이 그대로 보입니다. n을 키운 뒤 다시 모아 보세요.'
          : n < 10 ? '모양이 가운데로 모이기 시작합니다. 곡선은 중심극한정리가 예측하는 정규분포입니다.'
          : '평균들이 좁은 종 모양으로 모였습니다. 원래 모집단이 치우쳐 있어도 마찬가지입니다.';
      }
      function run(k) {
        cancel();
        const n = nS.get();
        if (means.length + k > 5000) { readout.textContent = '평균은 최대 5,000개까지 모을 수 있습니다. 초기화하세요.'; return; }
        cancel = U.animate(k, Math.max(1, Math.ceil(k / 40)), (i) => { means.push(I.sampleMean(popName, n, random)); if (i % Math.ceil(k / 40) === 0) render(); }, render);
      }
      function reset() { cancel(); random = S.rng(4); means = []; render(); }
      root.append(U.h('div', { class: 'controls' }, [choice, nS.wrap, U.h('div', { class: 'buttons' }, [
        U.button('평균 1개 만들기', () => run(1)), U.button('평균 500개 만들기', () => run(500)), U.button('초기화', () => { nS.set(1); reset(); }, 'ghost')])]),
        chart, U.h('p', { class: 'legend' }, [U.h('span', { class: 'key sim-key', text: '막대: 모은 평균들의 분포' }), U.h('span', { class: 'key curve-key', text: '곡선: 정규분포 N(μ, σ/√n)' }), U.h('span', { class: 'key target-key', text: '세로 점선: 모집단 평균 μ' })]),
        readout, note);
      reset();
      return () => cancel();
    }
  };
})();
