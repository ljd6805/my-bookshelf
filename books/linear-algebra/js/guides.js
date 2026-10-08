/* 실험 위의 안내 상자: 무엇을 확인하는지, 비교 예제 버튼, 실험 초기화, 결과 읽기.
   예제는 실제 입력 값을 바꾼 뒤 input 이벤트를 보내므로 손으로 조작한 것과 같은 계산을 거칩니다. */
window.LAGuides = (() => {
  'use strict';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function apply(el, values) {
    let first = null;
    for (const [name, value] of Object.entries(values)) {
      const input = el.querySelector(`[name="${name}"]`);
      if (!input) continue;
      if (input.type === 'checkbox') input.checked = Boolean(value); else input.value = value;
      first = first || input;
    }
    if (first) first.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function mount(id, el, guide) {
    if (!guide) return;
    const [purpose, presets, reading] = guide;
    const box = document.createElement('div');
    box.className = 'lab-guide';
    box.innerHTML = `<p><b>무엇을 확인하나요?</b> ${purpose}</p><div class="buttons" role="group" aria-label="비교 예제">` +
      presets.map((p, i) => `<button type="button" data-preset="${i}">${esc(p[0])}</button>`).join('') +
      `<button type="button" data-initialize>실험 초기화</button></div><p class="guide-reading"><b>결과 읽기</b> ${reading}</p>`;
    el.parentElement.insertBefore(box, el);
    const clear = () => box.querySelectorAll('[aria-pressed]').forEach((b) => b.removeAttribute('aria-pressed'));
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-initialize')) { el.dispatchEvent(new CustomEvent('lab-request-reset')); clear(); return; }
      el.dispatchEvent(new CustomEvent('lab-reset'));
      apply(el, presets[Number(b.dataset.preset)][1]);
      box.querySelectorAll('[data-preset]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    el.addEventListener('input', (e) => { if (e.isTrusted) clear(); });
  }

  return { mount, apply };
})();
