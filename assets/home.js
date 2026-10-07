(() => {
  'use strict';
  const tools = document.getElementById('resource-tools');
  const search = document.getElementById('resource-search');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('[data-resource]')];
  const count = document.getElementById('result-count');
  const empty = document.getElementById('no-results');
  let category = 'all';

  function updateResults() {
    const query = search.value.trim().toLocaleLowerCase('ko');
    let visible = 0;
    cards.forEach(card => {
      const matchesCategory = category === 'all' || card.dataset.category === category;
      const matchesQuery = card.dataset.search.toLocaleLowerCase('ko').includes(query);
      card.hidden = !(matchesCategory && matchesQuery);
      if (!card.hidden) visible += 1;
    });
    count.textContent = visible === cards.length
      ? '전체 ' + cards.length + '개 자료'
      : cards.length + '개 자료 중 ' + visible + '개';
    empty.hidden = visible !== 0;
  }

  function selectCategory(value) {
    category = value;
    filters.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.filter === category));
    });
    updateResults();
  }

  search.addEventListener('input', updateResults);
  filters.forEach(button => button.addEventListener('click', () => selectCategory(button.dataset.filter)));
  document.getElementById('reset-search').addEventListener('click', () => {
    search.value = '';
    selectCategory('all');
    search.focus();
  });
  tools.hidden = false;
  updateResults();
})();
