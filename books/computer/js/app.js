/* 실험 연결, 목차 현재 위치, 읽은 장 기록 */
(function () {
  'use strict';
  const Labs = window.CompLabs;
  const KEY = 'bookshelf:how-computers-work:v1:progress';

  document.querySelectorAll('[data-lab]').forEach((root) => {
    const mount = Labs[root.dataset.lab];
    if (!mount) { root.textContent = '이 실험을 불러오지 못했습니다.'; return; }
    try { mount(root); } catch (err) { root.textContent = `실험을 여는 중 오류가 났습니다: ${err.message}`; }
  });

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* 저장할 수 없는 환경에서는 화면 표시만 유지 */ } };
  const markToc = (read) => document.querySelectorAll('aside.toc a[href^="#"]').forEach((a) => {
    a.querySelector('.done')?.remove();
    if (read[a.getAttribute('href').slice(1)]) a.insertAdjacentHTML('beforeend', '<span class="done" aria-label="읽음">✓</span>');
  });
  const progress = load();
  document.querySelectorAll('section.chapter').forEach((section) => {
    const button = document.createElement('button');
    button.className = 'read-toggle';
    const paint = () => { const on = !!progress[section.id]; button.setAttribute('aria-pressed', String(on)); button.textContent = on ? '✓ 읽은 장으로 표시됨' : '이 장을 읽었어요'; };
    button.addEventListener('click', () => { progress[section.id] = !progress[section.id]; save(progress); paint(); markToc(progress); });
    paint();
    section.append(button);
  });
  markToc(progress);

  const links = new Map([...document.querySelectorAll('aside.toc a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      links.get(e.target.id)?.setAttribute('aria-current', 'true');
    }), { rootMargin: '-30% 0px -60% 0px' });
    document.querySelectorAll('section.chapter, header.hero').forEach((s) => io.observe(s));
  }
})();
