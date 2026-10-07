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
