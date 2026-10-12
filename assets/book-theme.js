/* 모든 책의 공통 테마 규칙: 처음 열면 밝은 화면, 독자가 고른 화면은 서재 전체에서 기억한다.
   책 <head>에서 type.css 바로 뒤에 동기 스크립트로 불러 첫 그림부터 저장된 테마로 그린다.
   각 책의 #theme 버튼은 data-theme만 바꾸고, 저장·버튼 문구·theme-color는 여기서 맞춘다. */
(function () {
  var KEY = 'bookshelf:shelf:v1:book-theme', root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { saved = null; }
  root.dataset.theme = saved === 'dark' ? 'dark' : 'light';

  function sync() {
    var dark = root.dataset.theme === 'dark', button = document.getElementById('theme');
    if (button) {
      button.textContent = dark ? '밝은 화면' : '어두운 화면';
      button.setAttribute('aria-label', button.textContent + '으로 전환');
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    var bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (meta && bg) meta.setAttribute('content', bg);
  }

  function watch() {
    sync();
    new MutationObserver(function () {
      try { localStorage.setItem(KEY, root.dataset.theme === 'dark' ? 'dark' : 'light'); } catch (e) { /* 저장 불가: 이번 방문에만 적용 */ }
      sync();
    }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
})();
