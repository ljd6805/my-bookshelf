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

/** How many spines of `bookWidth` px, standing `gap` px apart, fit on a shelf `width` px wide. */
export function shelfCapacity(width, bookWidth, gap = 1) {
  if (!(bookWidth > 0)) return 1;
  return Math.max(1, Math.floor((width + gap) / (bookWidth + gap)));
}

/**
 * Split books (given by their category, in shelf order) into shelves of `capacity`.
 * A category group that fits on one shelf moves to the next shelf rather than break;
 * a group longer than a whole shelf fills the current one and continues below.
 * Returns shelves as arrays of book indexes, in order.
 */
export function packShelves(categories, capacity) {
  const size = Math.max(1, Math.floor(capacity) || 1);
  const shelves = [];
  let shelf = [];
  for (let start = 0; start < categories.length;) {
    let end = start;
    while (end < categories.length && categories[end] === categories[start]) end += 1;
    const group = end - start;
    if (shelf.length && group > size - shelf.length && group <= size) {
      shelves.push(shelf);
      shelf = [];
    }
    for (let i = start; i < end; i += 1) {
      if (shelf.length === size) {
        shelves.push(shelf);
        shelf = [];
      }
      shelf.push(i);
    }
    start = end;
  }
  if (shelf.length) shelves.push(shelf);
  return shelves;
}
