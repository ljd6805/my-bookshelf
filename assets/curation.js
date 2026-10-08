/* 서가 큐레이션의 동작. HTML은 build_catalog.py가 미리 만들어 두므로 이 파일이 없어도
   모든 노선·정거장·개념 카드가 펼쳐진 채로 읽힙니다. 여기서는 한 번에 하나만 보이게 하고
   개념 지도에서 줄을 펼치고 책 칸을 밝히고 분야로 거르는 일만 합니다. */

function selectStop(route, n) {
  route.querySelectorAll('.station-link').forEach(link => {
    if (link.dataset.stop === String(n)) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  route.querySelectorAll('.route-stop').forEach(stop => {
    stop.classList.toggle('is-active', stop.dataset.stop === String(n));
  });
}

function selectRoute(explorer, id, focus = false) {
  const tabs = [...explorer.querySelectorAll('[role=tab]')];
  tabs.forEach(tab => {
    const on = tab.getAttribute('aria-controls') === id;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on && focus) tab.focus();
  });
  explorer.querySelectorAll('.route').forEach(route => route.classList.toggle('is-active', route.id === id));
}

export function setupRoutes(explorer) {
  if (!explorer) return;
  const tabs = [...explorer.querySelectorAll('[role=tab]')];
  explorer.classList.add('is-enhanced');
  explorer.querySelectorAll('.route').forEach(route => {
    selectStop(route, 1);
    route.querySelectorAll('.station-link').forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      selectStop(route, link.dataset.stop);
      if (matchMedia('(max-width: 720px)').matches) {
        route.querySelector('.route-stop.is-active')?.scrollIntoView({ block: 'nearest' });
      }
    }));
  });
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', event => {
      event.preventDefault();
      selectRoute(explorer, tab.getAttribute('aria-controls'));
    });
    tab.addEventListener('keydown', event => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = tabs[(index + step + tabs.length) % tabs.length];
      selectRoute(explorer, next.getAttribute('aria-controls'), true);
    });
  });
  const fromHash = tabs.find(tab => `#${tab.getAttribute('aria-controls')}` === location.hash);
  selectRoute(explorer, (fromHash || tabs[0]).getAttribute('aria-controls'));
}

function lightColumn(map, book) {
  map.querySelectorAll('[data-book]').forEach(el => el.classList.toggle('is-col', el.dataset.book === book));
}

function filterField(atlas, field) {
  atlas.querySelectorAll('.atlas-filter button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.field === field)));
  atlas.querySelectorAll('.atlas-group').forEach(group => {
    let shown = 0;
    group.querySelectorAll('.atlas-row').forEach(row => {
      const hide = Boolean(field) && !row.dataset.fields.split(' ').includes(field);
      row.classList.toggle('is-filtered', hide);
      row.nextElementSibling.classList.toggle('is-filtered', hide);
      if (!hide) shown += 1;
    });
    group.classList.toggle('is-filtered', shown === 0);
  });
}

export function setupAtlas(atlas) {
  const map = atlas?.querySelector('.atlas-map');
  if (!map) return;
  const rows = [...map.querySelectorAll('.atlas-row')];
  function toggle(id, open) {
    rows.forEach(row => {
      const on = open && row.dataset.concept === id;
      row.classList.toggle('is-active', on);
      row.nextElementSibling.classList.toggle('is-open', on);
      const node = row.querySelector('.atlas-node');
      node.classList.toggle('is-active', on);
      node.setAttribute('aria-expanded', String(on));
    });
  }
  atlas.classList.add('is-enhanced');
  rows.forEach(row => row.addEventListener('click', event => {
    if (event.target.closest('.atlas-detail a')) return;
    event.preventDefault();
    toggle(row.dataset.concept, !row.classList.contains('is-active'));
  }));
  map.querySelectorAll('[data-book]').forEach(el => {
    el.addEventListener('pointerenter', () => lightColumn(map, el.dataset.book));
    el.addEventListener('pointerleave', () => lightColumn(map, null));
  });
  map.querySelectorAll('.atlas-book a').forEach(a => {
    a.addEventListener('focus', () => lightColumn(map, a.parentElement.dataset.book));
    a.addEventListener('blur', () => lightColumn(map, null));
  });
  atlas.querySelectorAll('.atlas-filter button').forEach(b => b.addEventListener('click', () => filterField(atlas, b.dataset.field)));
  const fromHash = rows.find(row => `#concept-${row.dataset.concept}` === location.hash);
  if (fromHash) toggle(fromHash.dataset.concept, true);
}
