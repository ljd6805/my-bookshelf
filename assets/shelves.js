import { shelfCapacity, packShelves } from './shelf-model.mjs?v=20261008-atlas3';

/**
 * Stack the learning-book shelf like real furniture: as many spines as the width holds
 * stand on one board, and the rest continue on new boards below (docs/04-site-plan.html#shelf-display-rule).
 * The generated HTML keeps a scrolling fallback; this only rearranges the same spines.
 */
export function setupShelves(list) {
  const rows = [...list.querySelectorAll('.shelf-row[data-shelf=book]')];
  if (rows.length === 0) return { layout() {} };
  const first = rows[0];
  // Each spine travels with the <template> preview generated right after it.
  const books = rows.flatMap(row => [...row.querySelectorAll('.glass-book')])
    .map(spine => ({ spine, preview: spine.nextElementSibling?.matches('template') ? spine.nextElementSibling : null,
      category: spine.querySelector('.spine-category')?.textContent.trim() || '' }));
  rows.slice(1).forEach(row => row.remove());
  const blank = first.cloneNode(true);
  blank.querySelector('.book-track').replaceChildren();
  first.classList.add('is-stacked');
  const shelves = [first];
  let lastKey = '';

  function capacity() {
    if (list.classList.contains('is-list')) return Infinity;
    const track = first.querySelector('.book-track');
    const style = getComputedStyle(track);
    const width = track.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const spine = getComputedStyle(books[0].spine);
    return shelfCapacity(width, parseFloat(spine.flexBasis) || parseFloat(spine.width), parseFloat(style.columnGap) || 0);
  }

  function shelfAt(index) {
    while (shelves.length <= index) {
      const next = blank.cloneNode(true);
      next.classList.add('is-stacked');
      shelves[shelves.length - 1].after(next);
      shelves.push(next);
    }
    return shelves[index];
  }

  function layout(force = false) {
    const visible = books.filter(book => !book.spine.hidden);
    const size = capacity();
    const key = `${size}:${visible.map(book => book.spine.dataset.resource).join(',')}`;
    if (!force && key === lastKey) return;
    lastKey = key;
    const focused = document.activeElement;
    const packed = packShelves(visible.map(book => book.category), size);
    const hidden = books.filter(book => book.spine.hidden);
    packed.forEach((indexes, i) => {
      const nodes = indexes.flatMap(n => [visible[n].spine, visible[n].preview].filter(Boolean));
      if (i === 0) nodes.push(...hidden.flatMap(book => [book.spine, book.preview].filter(Boolean)));
      const track = shelfAt(i).querySelector('.book-track');
      track.replaceChildren(...nodes);
      track.setAttribute('aria-label', packed.length > 1 ? `학습 책 서가 ${i + 1}단` : '학습 책 서가');
    });
    if (packed.length === 0) shelfAt(0).querySelector('.book-track')
      .replaceChildren(...hidden.flatMap(book => [book.spine, book.preview].filter(Boolean)));
    const used = Math.max(packed.length, 1);
    shelves.forEach((shelf, i) => {
      shelf.hidden = i >= used || (packed.length === 0);
      shelf.classList.toggle('is-last', i === used - 1);
    });
    if (focused && focused !== document.activeElement && document.contains(focused)) focused.focus({ preventScroll: true });
  }

  let frame = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => layout());
  }).observe(list);
  layout(true);
  return { layout };
}
