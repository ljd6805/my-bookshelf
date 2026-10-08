/* 도표를 원래 읽기 흐름 안에서 보거나, 독립된 대화상자에서 확대한다. */
window.CompFigureView = (() => {
  'use strict';
  let dialog;
  let opener;

  function render(key, label) {
    const f = window.CompFigures[key];
    if (!f) return '';
    return `<figure class="figure-plate"><div class="figure-heading"><div><span>${label}</span><h3>${f.title}</h3></div><button type="button" data-figure="${key}" aria-label="${f.title} 확대 보기">확대 보기</button></div>
      <div class="figure-viewport">${f.html}</div>
      <figcaption>${f.caption}</figcaption></figure>`;
  }

  function ensureDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog');
    dialog.className = 'figure-dialog';
    dialog.setAttribute('aria-labelledby', 'figure-dialog-title');
    document.body.append(dialog);
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog || e.target.closest('[data-close-figure]')) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.style.overflow = '';
      if (opener?.isConnected) opener.focus();
    });
  }

  function open(key, button) {
    const f = window.CompFigures[key];
    if (!f) return;
    ensureDialog();
    opener = button;
    // 대화상자가 열린 동안에도 본문의 SVG ID와 겹치지 않게 한다.
    const html = f.html.replaceAll('id="diagram-', 'id="zoom-diagram-')
      .replaceAll('aria-labelledby="diagram-', 'aria-labelledby="zoom-diagram-')
      .replaceAll('arrow-diagram', 'zoom-arrow-diagram');
    dialog.innerHTML = `<div class="figure-dialog-toolbar"><h2 id="figure-dialog-title">${f.title}</h2><button data-close-figure>닫기</button></div>
      <div class="figure-viewport" tabindex="0" role="region" aria-label="확대된 개념도">${html}</div><p class="caption">${f.caption}</p>`;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
  }

  function bind(root) {
    root.addEventListener('click', (e) => {
      const button = e.target.closest('[data-figure]');
      if (button) open(button.dataset.figure, button);
    });
  }

  function close() {
    if (dialog?.open) dialog.close();
  }
  return { render, bind, close };
})();
