/* 해시 경로 라우터와 머리말 동작(밝은·어두운 화면, 모바일 목차). 경로 목록은 index.html의 book-routes와 같아야 합니다. */
(() => {
  'use strict';
  const B = LABook, H = LAApp, P = LAPages;
  const menu = document.querySelector('#menu');
  const closeMenu = () => { document.body.classList.remove('menu-open'); menu.setAttribute('aria-expanded', 'false'); };

  function route() {
    const hash = location.hash.slice(1) || 'home';
    const index = B.chapters.findIndex((c) => c.id === hash);
    closeMenu();
    UI.stopAll();
    if (index >= 0) { UI.markRead(hash); H.side(); P.chapter(B.chapters[index], index); } else P.home();
    document.querySelectorAll('[data-chapter]').forEach((a) => {
      const active = a.dataset.chapter === hash;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const target = (hash === 'chapters' || hash === 'sources') && document.getElementById(hash);
    if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
  }

  function theme() {
    const root = document.documentElement, dark = root.dataset.theme === 'dark', b = document.querySelector('#theme');
    root.dataset.theme = dark ? 'light' : 'dark';
    b.textContent = dark ? '어두운 화면' : '밝은 화면';
    b.setAttribute('aria-label', `${b.textContent}으로 전환`);
  }

  H.side();
  window.addEventListener('hashchange', route);
  document.querySelector('#theme').addEventListener('click', theme);
  menu.addEventListener('click', () => { const open = document.body.classList.toggle('menu-open'); menu.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  route();
})();
