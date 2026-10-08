import { cancelMotion, openMotion, closeMotion } from './motion.js?v=20261008-series1';
import { shouldPreview } from './shelf-model.mjs?v=20261008-series1';

export function createReader(dialog, isReduced) {
  let source = null;
  let revision = 0;
  let closing = false;
  const book = dialog.querySelector('.open-book');
  const closeButton = dialog.querySelector('.reader-close');

  function fillReader(link) {
    const template = document.getElementById(link.dataset.preview);
    if (!template) return false;
    const contents = template.content.cloneNode(true);
    // Contents on the left page, title page with illustration on the right (see shelf_renderer.preview).
    document.getElementById('reader-left').replaceChildren(contents.querySelector('.reader-contents'));
    document.getElementById('reader-right').replaceChildren(contents.querySelector('.reader-copy'));
    dialog.querySelector('.reader-title').id = 'reader-title';
    book.className = `open-book ${[...link.classList].find(c => c.startsWith('tone-')) || 'tone-aqua'}`;
    addPageTurns();
    showPage('title');
    return true;
  }

  /** Phones show one page at a time; these buttons turn between the title page and the contents. */
  function addPageTurns() {
    const turns = [['.reader-copy', 'contents', '목차 보기 →'], ['.reader-contents', 'title', '← 첫 면으로']];
    turns.forEach(([selector, page, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'page-turn';
      button.dataset.turn = page;
      button.textContent = label;
      button.addEventListener('click', () => {
        showPage(page);
        book.querySelector(`.page-turn[data-turn="${page === 'title' ? 'contents' : 'title'}"]`)?.focus();
      });
      dialog.querySelector(selector).append(button);
    });
  }

  function showPage(page) {
    book.dataset.page = page;
  }

  async function open(link) {
    if (dialog.open || !fillReader(link)) return;
    source = link;
    closing = false;
    const current = ++revision;
    dialog.dataset.state = 'opening';
    dialog.showModal();
    document.documentElement.classList.add('reader-active');
    source.classList.add('is-selected');
    closeButton.focus({ preventScroll: true });
    await openMotion(dialog, source, isReduced());
    if (current !== revision) return;
    cancelMotion(dialog);
    dialog.dataset.state = 'open';
  }

  async function close() {
    if (!dialog.open || closing) return;
    closing = true;
    ++revision;
    cancelMotion(dialog);
    dialog.dataset.state = 'closing';
    await closeMotion(dialog, source, isReduced());
    cancelMotion(dialog);
    source?.classList.remove('is-selected');
    dialog.close();
    document.documentElement.classList.remove('reader-active');
    source?.focus({ preventScroll: true });
    source = null;
    closing = false;
    dialog.dataset.state = 'closed';
  }

  function resetInterruptedMotion() {
    if (!dialog.open) return;
    cancelMotion(dialog);
  }

  closeButton.addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.addEventListener('click', event => {
    if (event.target === dialog || event.target.classList.contains('reader-scene')) close();
  });
  window.addEventListener('resize', resetInterruptedMotion);
  return { open, close, resetInterruptedMotion };
}

export function connectSpines(reader) {
  document.querySelectorAll('[data-preview]').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (!shouldPreview(event)) return;
      event.preventDefault();
      reader.open(link);
    });
    link.addEventListener('keydown', event => {
      if (event.key === ' ' && link.tagName === 'A') {
        event.preventDefault();
        reader.open(link);
      }
    });
  });
}
