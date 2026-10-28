import { packDividedShelves } from './shelf-model.mjs?v=20261028-divider1';

/**
 * Stack the learning-book shelf like real furniture: as many spines as the width holds
 * stand on one board, and the rest continue on new boards below (docs/04-site-plan.html#shelf-display-rule).
 * Each field's run of books opens with a divider card naming the field (#shelf-divider).
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

  function divider(category) {
    const card = document.createElement('span');
    card.className = 'shelf-divider';
    card.setAttribute('aria-hidden', 'true');
    card.innerHTML = '<span class="shelf-divider-name"></span>';
    card.firstChild.textContent = category;
    return card;
  }

  function geometry() {
    if (list.classList.contains('is-list')) return { width: Infinity, book: 1 };
    const track = first.querySelector('.book-track');
    const style = getComputedStyle(track);
    const probe = track.appendChild(divider(''));
    const card = getComputedStyle(probe);
    const spine = getComputedStyle(books[0].spine);
    const sizes = {
      width: track.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
      book: parseFloat(spine.flexBasis) || parseFloat(spine.width),
      gap: parseFloat(style.columnGap) || 0,
      divider: parseFloat(card.flexBasis) || parseFloat(card.width) || 0,
      lead: parseFloat(card.getPropertyValue('--divider-lead')) || 0
    };
    probe.remove();
    return sizes;
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
    const sizes = geometry();
    const key = `${JSON.stringify(sizes)}:${visible.map(book => book.spine.dataset.resource).join(',')}`;
    if (!force && key === lastKey) return;
    lastKey = key;
    const focused = document.activeElement;
    const packed = packDividedShelves(visible.map(book => book.category), sizes.width, sizes);
    const hidden = books.filter(book => book.spine.hidden);
    const nodesOf = book => [book.spine, book.preview].filter(Boolean);
    packed.forEach((runs, i) => {
      const nodes = runs.flatMap(run => [divider(run.category), ...run.books.flatMap(n => nodesOf(visible[n]))]);
      if (i === 0) nodes.push(...hidden.flatMap(nodesOf));
      const track = shelfAt(i).querySelector('.book-track');
      track.replaceChildren(...nodes);
      track.setAttribute('aria-label', packed.length > 1 ? `학습 책 서가 ${i + 1}단` : '학습 책 서가');
    });
    if (packed.length === 0) shelfAt(0).querySelector('.book-track').replaceChildren(...hidden.flatMap(nodesOf));
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
