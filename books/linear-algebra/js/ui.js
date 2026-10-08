/* 공통 화면 도우미: 숫자 표시, 슬라이더 연결, 애니메이션, 예측 버튼, 읽은 장 기록. */
(function () {
  'use strict';
  const KEY = 'bookshelf:linear-algebra-world:v1:progress';
  const labs = {};

  const fmt = (x, d) => {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    const s = (Math.abs(x) < 0.5 * Math.pow(10, -(d === undefined ? 2 : d)) ? 0 : x).toFixed(d === undefined ? 2 : d);
    return s.replace('-', '−');
  };
  const vec = (v, d) => `(${v.map((x) => fmt(x, d === undefined ? 1 : d)).join(', ')})`;
  const mat = (M, d) => `[${M.map((r) => r.map((x) => fmt(x, d)).join(', ')).join(' ; ')}]`;
  const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // t는 0→1로 진행합니다. 동작 줄이기 설정에서는 마지막 장면만 바로 그립니다.
  function animate(ms, frame, done) {
    if (reducedMotion()) { frame(1); if (done) done(); return () => {}; }
    let start = null, id = 0, stopped = false;
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const step = (now) => {
      if (stopped) return;
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / ms);
      frame(ease(t));
      if (t < 1) id = requestAnimationFrame(step); else if (done) done();
    };
    id = requestAnimationFrame(step);
    return () => { stopped = true; cancelAnimationFrame(id); };
  }

  // 실험 안의 슬라이더 값을 읽고, 옆의 output에 값을 표시합니다.
  function ranges(root, onChange) {
    const inputs = [...root.querySelectorAll('input[type=range], select, input[type=checkbox]')];
    const values = () => Object.fromEntries(inputs.map((el) => [el.name,
      el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' ? el.value : Number(el.value)]));
    const show = () => {
      for (const el of inputs) {
        const out = root.querySelector(`output[for="${el.id}"]`);
        if (out && el.type === 'range') out.textContent = fmt(Number(el.value), Number(el.dataset.digits || 1)) + (el.dataset.unit || '');
      }
    };
    const update = () => { show(); onChange(values()); };
    inputs.forEach((el) => el.addEventListener('input', update));
    const resetBtn = root.querySelector('[data-reset]');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      inputs.forEach((el) => {
        if (el.type === 'checkbox') el.checked = el.defaultChecked;
        else if (el.tagName === 'SELECT') el.value = ([...el.options].find((o) => o.defaultSelected) || el.options[0]).value;
        else el.value = el.defaultValue;
      });
      root.dispatchEvent(new CustomEvent('lab-reset'));
      update();
    });
    const set = (name, value) => {
      const el = inputs.find((i) => i.name === name);
      if (el) el.value = value;
    };
    show();
    return { values, update, set };
  }

  function predictions(root) {
    root.querySelectorAll('.predict').forEach((box) => {
      const note = box.querySelector('.predict-note');
      box.querySelectorAll('button[data-choice]').forEach((btn) => btn.addEventListener('click', () => {
        box.querySelectorAll('button[data-choice]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        if (note) note.textContent = `내 예측: “${btn.textContent.trim()}”. 이제 아래 실험으로 확인해 보세요. 정답과 이유는 실험 뒤에 있습니다.`;
      }));
    });
  }

  function progress() {
    let state = {};
    try { state = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { state = {}; }
    const chapter = document.body.dataset.chapter;
    if (chapter) {
      state[chapter] = true;
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 저장할 수 없어도 읽기는 계속됩니다. */ }
    }
    document.querySelectorAll('[data-progress]').forEach((li) => {
      if (state[li.dataset.progress]) {
        li.classList.add('visited');
        const mark = li.querySelector('.visit-mark');
        if (mark) mark.textContent = '읽음';
      }
    });
  }

  const lab = (name, fn) => { labs[name] = fn; };

  function start() {
    document.documentElement.classList.add('js');
    predictions(document);
    progress();
    document.querySelectorAll('[data-lab]').forEach((root) => {
      const fn = labs[root.dataset.lab];
      if (!fn) return;
      try { fn(root); root.classList.add('ready'); } catch (e) {
        const msg = document.createElement('p');
        msg.className = 'lab-error';
        msg.setAttribute('role', 'alert');
        msg.textContent = '실험을 불러오지 못했습니다. 위의 글과 예시 숫자로 내용을 확인할 수 있습니다.';
        root.appendChild(msg);
        console.error(e);
      }
    });
  }

  window.UI = { fmt, vec, mat, animate, ranges, lab, reducedMotion };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start);
})();
