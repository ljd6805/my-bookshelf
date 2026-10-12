/* 9장 실험: 진동과 온도의 산점도, 부하 단계로 나눠 본 상관, 온도를 무작위로 정한 실험.
   계산(가상 데이터 생성, r)은 inference.js·stats.js가 하고 여기서는 그리기만 한다. */
(function () {
  'use strict';
  const I = window.ProbInference, U = window.ProbUI, C = U.chart;
  const labs = window.ProbLabs = window.ProbLabs || {};
  const T_RANGE = [25, 65], V_RANGE = [0, 6], SHAPES = ['●', '■', '▲'];

  /* 점 하나의 모양: 나눠 보기가 켜지면 부하 단계마다 모양과 색을 다르게 한다(색만으로 구분하지 않도록). */
  function mark(d, x, y, split) {
    const cx = x(d.temp).toFixed(1), cy = y(d.vib).toFixed(1);
    if (!split) return `<circle class="cr-pt" cx="${cx}" cy="${cy}" r="3.2"/>`;
    if (d.level === 0) return `<circle class="cr-pt lv0" cx="${cx}" cy="${cy}" r="3.4"/>`;
    if (d.level === 1) return `<rect class="cr-pt lv1" x="${cx - 3}" y="${cy - 3}" width="6" height="6"/>`;
    return `<path class="cr-pt lv2" d="M${cx},${cy - 4}l3.6,6.6h-7.2z"/>`;
  }

  function scatter(rows, split, summary) {
    const x = C.scale(T_RANGE[0], T_RANGE[1], C.PAD.l, C.W - C.PAD.r), y = C.scale(V_RANGE[0], V_RANGE[1], C.H - C.PAD.b, C.PAD.t);
    const clampT = (t) => Math.min(T_RANGE[1], Math.max(T_RANGE[0], t));
    let s = C.frame(C.ticks(T_RANGE[0], T_RANGE[1], 4, (v) => `${v}°C`), C.ticks(V_RANGE[0], V_RANGE[1], 3, (v) => v.toFixed(0)), x, y, { x: '모터 온도 (°C)', y: '진동 (mm/s)' });
    for (const d of rows) s += mark({ ...d, temp: clampT(d.temp), vib: Math.min(V_RANGE[1], d.vib) }, x, y, split);
    const label = `모터·하루 기록 ${summary.n}개의 온도와 진동 산점도. 전체 r = ${fmtR(summary.r)}${split ? `. 부하 단계별 r: ${summary.groups.map((g) => `${g.label} ${fmtR(g.r)}`).join(', ')}` : ''}`;
    return C.svg(s, label);
  }

  const fmtR = (r) => (Number.isNaN(r) ? '계산 불가(기록 부족)' : r.toFixed(2));

  labs.correlation = {
    title: '부하로 나누면 상관이 남을까', kind: '시뮬레이션 · 씨앗 고정 가상 데이터 + 정확한 계산(r)',
    units: '교란 강도: 0~100% · 기록 일수: 5~30일(모터 20대이므로 기록 100~600개) · 진동 mm/s, 온도 °C',
    assumptions: '가상 공장입니다. 부하(가동률)는 40%·70%·100% 세 단계 중 하나로 날마다 같은 확률(1/3)로 무작위로 정해지고, 진동과 온도를 함께 올립니다. 온도는 진동에 아무 영향도 주지 않습니다. 진동 = 3.0 + 4·강도·(부하 − 0.7) + 잡음(표준편차 0.6), 온도 = 45 + 30·강도·(부하 − 0.7) + 잡음(표준편차 3). 진동은 0.1 mm/s 아래로 내려가지 않게 자릅니다(30일 기록에서도 몇 개뿐이라 r에 주는 영향은 무시할 만합니다). 무작위 실험에서는 온도 조절 장치가 온도를 부하와 상관없는 무작위 단계에 맞춘다고 가정합니다(이상적인 개입).',
    mount(root) {
      const cS = U.slider({ id: 'cr-c', label: '교란 강도 (부하가 진동·온도에 주는 영향)', min: 0, max: 1, step: 0.05, value: 1, format: (v) => `${Math.round(v * 100)}%` }, render);
      const dS = U.slider({ id: 'cr-days', label: '기록 일수 (모터 20대)', min: 5, max: 30, step: 5, value: 10, unit: '일' }, render);
      const split = U.h('input', { type: 'checkbox', id: 'cr-split', onchange: () => render() });
      const rand = U.h('input', { type: 'checkbox', id: 'cr-rand', onchange: () => render() });
      const box = (input, text) => U.h('label', { class: 'check-label', for: input.id }, [input, U.h('span', { text })]);
      const chart = U.h('div', { class: 'chart' }), note = U.h('p', { class: 'reading' });
      const readout = U.h('p', { class: 'readout', role: 'status', 'aria-live': 'polite' });
      const legend = U.h('p', { class: 'legend' });
      function render() {
        const c = cS.get(), randomized = rand.checked, rows = I.sensorDays({ strength: c, days: dS.get(), randomized });
        const sum = I.correlationSummary(rows);
        chart.innerHTML = scatter(rows, split.checked, sum);
        legend.textContent = split.checked ? SHAPES.map((sh, i) => `${sh} ${I.LOAD_LEVELS[i].label}`).join(' · ') : '● 모터·하루 기록 하나';
        const mode = randomized ? '무작위 실험' : '관찰 기록';
        const theory = randomized ? 0 : I.correlationTheory(c);
        readout.textContent = `${mode} ${sum.n}개 · 전체 r = ${fmtR(sum.r)} (모델의 기대값 ${theory.toFixed(2)})`
          + (split.checked ? ` · 부하 단계별 r: ${sum.groups.map((g) => `${g.label}(${g.n}개) ${fmtR(g.r)}`).join(', ')}` : '');
        note.textContent = randomized ? '온도를 부하와 상관없이 정하자 전체 r도 0 근처입니다. 이 공장에서 온도는 진동의 원인이 아니라는 뜻입니다.'
          : c === 0 ? '부하가 두 값에 영향을 주지 않으면 r은 0 근처입니다. 남는 것은 측정 흔들림뿐입니다.'
          : split.checked ? '부하가 같은 날끼리는 r이 0 근처입니다. 세 무리의 위치 차이가 전체 상관을 만들었습니다.'
          : '점들이 오른쪽 위로 기운 띠를 이룹니다. "부하 단계로 나눠 보기"를 켜서 이 기울기가 어디서 오는지 확인하세요.';
      }
      const preset = (c, s, r) => () => { cS.set(c); dS.set(10); split.checked = s; rand.checked = r; render(); };
      root.append(U.h('div', { class: 'controls' }, [cS.wrap, dS.wrap, box(split, ' 부하 단계로 나눠 보기 (모양: ● 낮음 ■ 보통 ▲ 높음)'), box(rand, ' 온도를 무작위로 정하는 실험으로 바꾸기'),
        U.h('div', { class: 'buttons' }, [
          U.button('예제: 부하 영향 없음(강도 0%)', preset(0, false, false)), U.button('예제: 부하 단계로 나눠 보기', preset(1, true, false)),
          U.button('예제: 온도를 무작위로 정하기', preset(1, false, true)), U.button('초기화', preset(1, false, false), 'ghost')])]),
        chart, legend, readout, note);
      render();
      return () => {};
    }
  };
})();
