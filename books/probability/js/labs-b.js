/* 5~8장 실험: 베이즈 격자, 신뢰구간 반복, 가설검정과 검정력, 우도와 손실. */
(function () {
  'use strict';
  const S = window.ProbStats, I = window.ProbInference, U = window.ProbUI, C = U.chart;
  const labs = window.ProbLabs = window.ProbLabs || {};

  /* 1,000칸 격자를 고장/정상(모양)과 경보 여부(채움)로 나눈다. 반올림 후에도 합이 1,000이 되게 맞춘다. */
  function gridCounts(b) {
    const faulty = Math.round(b.tp + b.fn), tp = Math.min(faulty, Math.round(b.tp));
    const fp = Math.min(1000 - faulty, Math.round(b.fp));
    return { tp, fn: faulty - tp, fp, tn: 1000 - faulty - fp };
  }

  function bayesGrid(g) {
    const cols = 40, size = 13, kinds = [['tp', g.tp], ['fn', g.fn], ['fp', g.fp], ['tn', g.tn]];
    let s = '', i = 0;
    for (const [kind, count] of kinds) {
      for (let j = 0; j < count; j += 1, i += 1) {
        const cx = 6 + (i % cols) * size + size / 2, cy = 6 + Math.floor(i / cols) * size + size / 2;
        s += kind === 'tp' || kind === 'fn'
          ? `<circle class="cell ${kind}" cx="${cx}" cy="${cy}" r="5"/>`
          : `<rect class="cell ${kind}" x="${cx - 4.5}" y="${cy - 4.5}" width="9" height="9"/>`;
      }
    }
    return `<svg viewBox="0 0 532 337" role="img" aria-label="모터 1,000대: 진짜 경보 ${g.tp}, 놓친 고장 ${g.fn}, 오경보 ${g.fp}, 조용한 정상 ${g.tn}">${s}</svg>`;
  }

  labs.bayes = {
    title: '모터 1,000대로 세어 보는 베이즈', kind: '정확한 계산(자연 빈도로 표시)',
    units: '고장률: 0.1~20% · 민감도(고장일 때 울릴 확률): 50~100% · 오경보율: 0~30%',
    assumptions: '모든 모터의 고장 여부와 센서 반응은 서로 독립입니다. 격자는 기대 개수를 반올림해 그립니다.',
    mount(root) {
      const pct = (d) => (v) => `${(v * 100).toFixed(d)}%`;
      const prev = U.slider({ id: 'by-prev', label: '고장률 (기저율)', min: 0.001, max: 0.2, step: 0.001, value: 0.01, format: pct(1) }, render);
      const sens = U.slider({ id: 'by-sens', label: '민감도', min: 0.5, max: 1, step: 0.01, value: 0.9, format: pct(0) }, render);
      const fa = U.slider({ id: 'by-fa', label: '오경보율', min: 0, max: 0.3, step: 0.005, value: 0.05, format: pct(1) }, render);
      const grid = U.h('div', { class: 'chart grid-chart' }), meter = U.h('div', { class: 'meter', 'aria-hidden': 'true' });
      const readout = U.h('p', { class: 'readout', 'aria-live': 'polite' }), note = U.h('p', { class: 'reading' });
      function render() {
        const b = I.bayes({ prevalence: prev.get(), sensitivity: sens.get(), falseAlarmRate: fa.get(), population: 1000 });
        const g = gridCounts(b);
        grid.innerHTML = bayesGrid(g);
        meter.innerHTML = `<span class="meter-tp" style="width:${(b.posterior * 100).toFixed(1)}%">진짜</span><span class="meter-fp">오경보</span>`;
        readout.textContent = `경보 ${b.alarms.toFixed(1)}건 중 진짜 고장 ${b.tp.toFixed(1)}건, 오경보 ${b.fp.toFixed(1)}건 → 경보가 울렸을 때 실제 고장일 확률 ${U.fmt.pct(b.posterior, 1)}`;
        note.textContent = b.alarms === 0 ? '경보가 한 번도 울리지 않는 설정입니다. 민감도나 오경보율을 올려 보세요.'
          : b.posterior < 0.3 ? '경보의 대부분이 오경보입니다. 정상 모터가 워낙 많아서 작은 오경보율도 큰 개수가 됩니다.'
          : b.posterior < 0.8 ? '경보가 울리면 확인할 가치가 있지만, 아직 상당수가 오경보입니다.'
          : '경보 대부분이 진짜 고장입니다. 기저율이 높거나 오경보율이 아주 낮은 경우입니다.';
      }
      const preset = (p, s, f) => () => { prev.set(p); sens.set(s); fa.set(f); render(); };
      root.append(U.h('div', { class: 'controls' }, [prev.wrap, sens.wrap, fa.wrap, U.h('div', { class: 'buttons' }, [
        U.button('새 공장 (1%)', preset(0.01, 0.9, 0.05)), U.button('오래된 설비 (10%)', preset(0.1, 0.9, 0.05)),
        U.button('드문 질병 검사', preset(0.001, 0.99, 0.01)), U.button('초기화', preset(0.01, 0.9, 0.05), 'ghost')])]),
        grid, U.h('p', { class: 'legend' }, [U.h('span', { class: 'key tp-key', text: '● 진짜 경보(고장·울림)' }), U.h('span', { class: 'key fn-key', text: '○ 놓친 고장' }),
          U.h('span', { class: 'key fp-key', text: '■ 오경보(정상·울림)' }), U.h('span', { class: 'key tn-key', text: '□ 조용한 정상' })]),
        meter, readout, note);
      render();
      return () => {};
    }
  };

  function intervalChart(list, p, maxX) {
    const rows = 30, x = C.scale(0, maxX, C.PAD.l, C.W - C.PAD.r), rowH = (C.H - C.PAD.t - C.PAD.b) / rows;
    let s = C.frame(C.ticks(0, maxX, 5, (v) => `${Math.round(v * 100)}%`), [], x, () => 0, { x: '이상 비율' });
    list.slice(-rows).reverse().forEach((iv, i) => {
      const y = C.PAD.t + i * rowH + rowH / 2, hit = I.intervalCovers(iv, p);
      s += `<line class="${hit ? 'ci hit' : 'ci miss'}" x1="${x(iv.low)}" x2="${x(Math.min(maxX, iv.high))}" y1="${y}" y2="${y}"/><circle class="ci-dot" r="2.5" cx="${x(Math.min(maxX, iv.phat))}" cy="${y}"/>`;
      if (!hit) s += `<text class="miss-mark" x="${x(Math.min(maxX, iv.high)) + 6}" y="${y + 4}">✕</text>`;
    });
    s += `<line class="target" x1="${x(p)}" x2="${x(p)}" y1="${C.PAD.t}" y2="${C.H - C.PAD.b}"/>`;
    return C.svg(s, `최근 ${Math.min(rows, list.length)}개의 95% 신뢰구간. 세로선은 진짜 비율 ${U.fmt.pct(p, 0)}`);
  }

  labs.interval = {
    title: '구간을 스무 번 그려 보기', kind: '시뮬레이션 · Wilson 95% 점수 구간',
    units: '진짜 이상 비율: 2~50% · 표본 크기: 10~500대 · 최근 30개 구간만 표시',
    assumptions: '표본의 모터들은 공장 전체에서 서로 독립으로 뽑습니다. 진짜 비율을 아는 가상의 공장입니다.',
    mount(root) {
      let random = S.rng(12), list = [], cancel = () => {};
      const pS = U.slider({ id: 'ci-p', label: '진짜 이상 비율 (실제로는 모르는 값)', min: 0.02, max: 0.5, step: 0.01, value: 0.12, format: (v) => `${Math.round(v * 100)}%` }, () => reset());
      const nS = U.slider({ id: 'ci-n', label: '표본 크기 n', min: 10, max: 500, step: 10, value: 40, unit: '대' }, () => reset());
      const chart = U.h('div', { class: 'chart' }), readout = U.h('p', { class: 'readout', 'aria-live': 'polite' }), note = U.h('p', { class: 'reading' });
      function render() {
        const p = pS.get(), maxX = Math.min(1, Math.max(0.3, p * 2.5));
        chart.innerHTML = intervalChart(list, p, maxX);
        if (!list.length) { readout.textContent = '버튼을 눌러 표본을 뽑아 보세요. 표본마다 구간이 하나씩 생깁니다.'; note.textContent = '세로선을 지나지 못하는 구간은 ✕로 표시됩니다.'; return; }
        const misses = list.filter((iv) => !I.intervalCovers(iv, p)).length, last = list[list.length - 1];
        readout.textContent = `구간 ${list.length}개 중 빗나감 ${misses}개 · 포함률 ${U.fmt.pct(1 - misses / list.length, 1)} · 마지막 표본 ${last.k}/${nS.get()} → [${U.fmt.pct(last.low)}, ${U.fmt.pct(last.high)}], 폭 ${U.fmt.pct(last.high - last.low)}`;
        note.textContent = list.length < 40 ? '아직 구간이 적어서 포함률이 크게 흔들립니다. 100개 이상 모아 보세요.'
          : '구간이 많아질수록 포함률이 95% 근처에 머뭅니다. 표본 크기를 바꾸면 폭은 변해도 포함률은 그대로인지 보세요.';
      }
      function draw(k) {
        cancel();
        if (list.length + k > 2000) { readout.textContent = '구간은 최대 2,000개까지 모읍니다. 초기화하세요.'; return; }
        const n = nS.get(), p = pS.get();
        cancel = U.animate(k, k > 20 ? 4 : 1, () => { const c = S.binomialSample(n, p, random); list.push({ ...I.wilson(c, n), k: c, phat: c / n }); render(); }, render);
      }
      function reset() { cancel(); random = S.rng(12); list = []; render(); }
      root.append(U.h('div', { class: 'controls' }, [pS.wrap, nS.wrap, U.h('div', { class: 'buttons' }, [
        U.button('표본 1번', () => draw(1)), U.button('표본 20번', () => draw(20)), U.button('표본 100번', () => draw(100)), U.button('초기화', () => { pS.set(0.12); nS.set(40); reset(); }, 'ghost')])]),
        chart, U.h('p', { class: 'legend' }, [U.h('span', { class: 'key ci-key', text: '실선: 진짜 값을 포함한 구간' }), U.h('span', { class: 'key miss-key', text: '점선과 ✕: 빗나간 구간' }), U.h('span', { class: 'key target-key', text: '세로선: 진짜 비율' })]),
        readout, note);
      reset();
      return () => cancel();
    }
  };

  const P0 = 0.1, ALPHA = 0.05;

  function nullChart(n, k) {
    const dist = S.binomialDistribution(n, P0), show = Math.min(n, Math.ceil(n * P0 * 2.6 + 6));
    const maxY = Math.max(...dist) * 1.15, bw = (C.W - C.PAD.l - C.PAD.r) / (show + 1);
    const x = (i) => C.PAD.l + i * bw, y = C.scale(0, maxY, C.H - C.PAD.b, C.PAD.t), step = Math.max(1, Math.ceil(show / 10));
    let s = C.frame(Array.from({ length: Math.floor(show / step) + 1 }, (_, i) => ({ v: i * step, label: String(i * step) })), C.ticks(0, maxY, 3, (v) => U.fmt.pct(v, 0)), (v) => x(v) + bw / 2, y, { x: '오경보가 있었던 날 수', y: '오경보율이 10%일 때의 확률' });
    for (let i = 0; i <= show; i += 1) s += `<rect class="${k !== null && i <= k ? 'bar hot' : 'bar exact-fill'}" x="${x(i) + 1}" width="${Math.max(1, bw - 2)}" y="${y(dist[i])}" height="${y(0) - y(dist[i])}"/>`;
    if (k !== null && k <= show) s += `<line class="target" x1="${x(k + 1)}" x2="${x(k + 1)}" y1="${C.PAD.t}" y2="${C.H - C.PAD.b}"/><text class="tick strong" x="${x(k + 1) + 4}" y="${C.PAD.t + 12}">관찰 ${k}일</text>`;
    return C.svg(s, `귀무가설(오경보율 10%)에서 ${n}일 중 오경보 일수의 분포${k !== null ? `, 관찰값 ${k}일 이하를 빗금으로 표시` : ''}`);
  }

  labs.testing = {
    title: '시험 기간과 검정력', kind: '정확한 계산(p값) + 시뮬레이션(반복 시험)',
    units: '새 센서의 진짜 오경보율: 2~15% · 시험 일수: 20~500일 · 기준: 기존 10%, 유의수준 α = 0.05',
    assumptions: '날마다 오경보 여부는 독립입니다. 한쪽 정확 이항검정 P(X ≤ k | 10%)를 씁니다.',
    mount(root) {
      let random = S.rng(21), observed = null, power = null;
      const rS = U.slider({ id: 'ts-r', label: '새 센서의 진짜 오경보율 (실제로는 모르는 값)', min: 0.02, max: 0.15, step: 0.01, value: 0.05, format: (v) => `${Math.round(v * 100)}%` }, reset);
      const nS = U.slider({ id: 'ts-n', label: '시험 일수', min: 20, max: 500, step: 10, value: 60, unit: '일' }, reset);
      const chart = U.h('div', { class: 'chart' }), readout = U.h('p', { class: 'readout', 'aria-live': 'polite' }), powerOut = U.h('p', { class: 'readout' }), note = U.h('p', { class: 'reading' });
      function render() {
        const n = nS.get();
        chart.innerHTML = nullChart(n, observed && observed.k);
        readout.textContent = observed ? `시험 결과: ${n}일 중 오경보 ${observed.k}일(${U.fmt.pct(observed.k / n)}) → p값 = ${observed.p.toFixed(4)} → ${observed.p <= ALPHA ? '유의함: "오경보가 줄었다"고 판단' : '유의하지 않음: 줄었다는 증거가 부족'}` : '시험을 한 번 해 보세요. 막대는 "새 센서도 10%"라고 가정했을 때의 분포입니다.';
        powerOut.textContent = power ? `같은 시험 ${power.reps}번 반복 → 유의한 결과 ${U.fmt.pct(power.rate, 1)} (${rS.get() >= P0 ? '실제로 나아지지 않았으므로 이 비율은 잘못된 결론의 비율' : '이 비율이 검정력'})` : '';
        note.textContent = !power ? '반복 시험 버튼으로 이 시험 설계가 차이를 얼마나 자주 잡아내는지 확인하세요.'
          : rS.get() >= P0 ? '진짜로는 나아지지 않았는데도 가끔 유의한 결과가 나옵니다. α = 0.05는 이 실수를 5% 이하로 묶겠다는 약속입니다.'
          : power.rate < 0.8 ? '실제로 나아졌는데도 대부분의 시험이 이를 확인하지 못합니다. 시험 일수를 늘려 보세요. 흔히 80% 이상을 목표로 합니다.'
          : '이 시험 설계는 실제 차이를 대부분 잡아냅니다.';
      }
      function once() { const k = S.binomialSample(nS.get(), rS.get(), random); observed = { k, p: I.lowerTailTest(k, nS.get(), P0) }; render(); }
      function repeat() { power = { ...I.rejectionRate(rS.get(), nS.get(), P0, ALPHA, 400, random), reps: 400 }; render(); }
      function reset() { random = S.rng(21); observed = null; power = null; render(); }
      root.append(U.h('div', { class: 'controls' }, [rS.wrap, nS.wrap, U.h('div', { class: 'buttons' }, [
        U.button('시험 1번 하기', once), U.button('같은 시험 400번 반복', repeat), U.button('초기화', () => { rS.set(0.05); nS.set(60); reset(); }, 'ghost')])]),
        chart, U.h('p', { class: 'legend' }, [U.h('span', { class: 'key exact-key', text: '막대: 오경보율 10%를 가정한 확률' }), U.h('span', { class: 'key hot-key', text: '빗금: 관찰값 이하(합이 p값)' })]),
        readout, powerOut, note);
      render();
      return () => {};
    }
  };

  const LR95 = 1.92;

  function lossChart(k, n, q) {
    const qs = Array.from({ length: 200 }, (_, i) => 0.0025 + i * 0.0025), best = I.mle(k, n);
    const minLoss = -I.logLikelihood(k, n, Math.min(0.999, Math.max(0.001, best)));
    const x = C.scale(0, 0.5, C.PAD.l, C.W - C.PAD.r), y = C.scale(0, 10, C.H - C.PAD.b, C.PAD.t);
    let s = C.frame(C.ticks(0, 0.5, 5, (v) => v.toFixed(1)), C.ticks(0, 10, 5, (v) => String(v)), x, y, { x: '후보 확률 q', y: '최소 손실보다 큰 정도' });
    s += `<rect class="band" x="${C.PAD.l}" width="${C.W - C.PAD.l - C.PAD.r}" y="${y(LR95)}" height="${y(0) - y(LR95)}"/>`;
    const d = qs.map((v, i) => `${i ? 'L' : 'M'}${x(v).toFixed(1)},${y(Math.min(10, -I.logLikelihood(k, n, v) - minLoss)).toFixed(1)}`).join('');
    s += `<path class="curve" d="${d}"/><line class="target" x1="${x(Math.min(0.5, best))}" x2="${x(Math.min(0.5, best))}" y1="${C.PAD.t}" y2="${C.H - C.PAD.b}"/>`;
    const cur = Math.min(10, -I.logLikelihood(k, n, q) - minLoss);
    s += `<circle class="dot" r="6" cx="${x(q)}" cy="${y(cur)}"/>`;
    return C.svg(s, `오경보 ${k}일/${n}일의 손실 곡선. 바닥은 q = ${best.toFixed(3)}, 현재 후보 q = ${q.toFixed(2)}`);
  }

  labs.likelihood = {
    title: '손실 곡선의 바닥 찾기', kind: '정확한 계산',
    units: '시험 일수 n: 10~600일 · 오경보 일수 k: 0~n · 후보 확률 q: 0.01~0.50',
    assumptions: '날마다 오경보 여부는 독립이고 같은 확률 q를 따릅니다. 세로축은 전체 손실(−로그우도)이 최솟값보다 큰 정도입니다.',
    mount(root) {
      const nS = U.slider({ id: 'lk-n', label: '시험 일수 n', min: 10, max: 600, step: 10, value: 60, unit: '일' }, () => { kS.input.max = nS.get(); if (kS.get() > nS.get()) kS.set(nS.get()); render(); });
      const kS = U.slider({ id: 'lk-k', label: '오경보가 있었던 날 k', min: 0, max: 60, step: 1, value: 3, unit: '일' }, render);
      const qS = U.slider({ id: 'lk-q', label: '후보 확률 q', min: 0.01, max: 0.5, step: 0.01, value: 0.1, format: (v) => v.toFixed(2) }, render);
      const chart = U.h('div', { class: 'chart' }), readout = U.h('p', { class: 'readout', 'aria-live': 'polite' }), note = U.h('p', { class: 'reading' });
      function render() {
        const n = nS.get(), k = kS.get(), q = qS.get(), best = I.mle(k, n);
        chart.innerHTML = lossChart(k, n, q);
        const ce = I.crossEntropy(k, n, q), ceBest = I.crossEntropy(k, n, Math.min(0.999, Math.max(0.001, best)));
        const inside = n * (ce - ceBest) <= LR95;
        readout.textContent = `후보 q = ${q.toFixed(2)}: 하루 평균 손실 ${ce.toFixed(3)} · 바닥 q = k/n = ${best.toFixed(3)}의 평균 손실 ${ceBest.toFixed(3)} · 전체 손실 차이 ${(n * (ce - ceBest)).toFixed(2)}`;
        note.textContent = inside ? '이 후보는 회색 띠 안에 있습니다. 데이터와 크게 어긋나지 않아 아직 버릴 수 없는 후보입니다.'
          : '이 후보는 회색 띠 밖에 있습니다. 데이터가 이 확률과 잘 맞지 않습니다. 시험 일수를 늘리면 띠 안에 남는 범위가 어떻게 변하는지 보세요.';
      }
      const preset = (n, k) => () => { nS.set(n); kS.input.max = n; kS.set(k); render(); };
      root.append(U.h('div', { class: 'controls' }, [nS.wrap, kS.wrap, qS.wrap, U.h('div', { class: 'buttons' }, [
        U.button('60일 중 3일', preset(60, 3)), U.button('600일 중 30일', preset(600, 30)),
        U.button('초기화', () => { preset(60, 3)(); qS.set(0.1); render(); }, 'ghost')])]),
        chart, U.h('p', { class: 'legend' }, [U.h('span', { class: 'key curve-key', text: '곡선: 손실' }), U.h('span', { class: 'key target-key', text: '세로선: 바닥(k/n)' }), U.h('span', { class: 'key band-key', text: '회색 띠: 차이 1.92 이하(약 95% 범위)' })]),
        readout, note);
      render();
      return () => {};
    }
  };
})();
