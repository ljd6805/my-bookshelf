/** Pure catalog filtering and preference decisions, shared by UI and unit tests. */
export function normalizeQuery(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('ko').trim();
}

export function matchesItem(item, query, category = 'all') {
  const haystack = normalizeQuery(item.search);
  const terms = normalizeQuery(query).split(/\s+/).filter(Boolean);
  return (category === 'all' || item.category === category)
    && terms.every(term => haystack.includes(term));
}

export function usesReducedMotion(saved, systemReduced) {
  return systemReduced || saved === 'reduce';
}

export function shouldPreview(event) {
  return event.button === 0 && !event.ctrlKey && !event.metaKey
    && !event.shiftKey && !event.altKey;
}

/**
 * Split books (given by their category, in shelf order) into shelves, and open every run of
 * one category on a shelf with a divider card (docs/04-site-plan.html#shelf-divider).
 * A category group that fits on a fresh shelf moves down rather than break; a longer group
 * fills the current shelf and continues below, behind a new divider with the same name.
 * Widths are px: `width` is the inner track width, `book` a spine, `gap` the space between
 * items, `divider` the card, and `lead` the extra space before a divider that does not open its shelf.
 * Returns shelves as arrays of runs: [{ category, books: [indexes] }].
 */
export function packDividedShelves(categories, width, { book, gap = 1, divider = 0, lead = 0 }) {
  const shelves = [];
  let shelf = [];
  let used = 0;
  const cost = (atStart, count) => (atStart ? 0 : gap + lead) + divider + count * (book + gap);
  const close = () => { if (shelf.length) shelves.push(shelf); shelf = []; used = 0; };
  for (let start = 0; start < categories.length;) {
    let end = start;
    while (end < categories.length && categories[end] === categories[start]) end += 1;
    const fitsFresh = cost(true, end - start) <= width;
    if (shelf.length && fitsFresh && used + cost(false, end - start) > width) close();
    for (let i = start; i < end;) {
      if (shelf.length && used + cost(false, 1) > width) close();
      const room = Math.floor((width - used - cost(!shelf.length, 0)) / (book + gap));
      const take = Math.max(1, Math.min(end - i, room));
      used += cost(!shelf.length, take);
      shelf.push({ category: categories[start], books: Array.from({ length: take }, (_, k) => i + k) });
      i += take;
      if (i < end) close();
    }
    start = end;
  }
  close();
  return shelves;
}
